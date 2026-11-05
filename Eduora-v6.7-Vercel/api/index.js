
const express=require("express"),{neon}=require("@neondatabase/serverless"),bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken"),crypto=require("crypto"),multer=require("multer"),cookieLib=require("cookie"),path=require("path");
const app=express();

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"../public"),{index:"index.html",fallthrough:true,maxAge:process.env.NODE_ENV==="production"?"1h":0}));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"../public/admin.html")));

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:4*1024*1024},fileFilter:(r,f,c)=>c(null,["image/png","image/jpeg","image/webp"].includes(f.mimetype))});

let sql;
const db=()=>{if(!process.env.DATABASE_URL)throw Error("Set DATABASE_URL in Render.");return sql||(sql=neon(process.env.DATABASE_URL))};

let ready;
async function schema(){
if(!ready)ready=(async()=>{
const q=db();
await q`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,verified BOOLEAN DEFAULT FALSE,banned BOOLEAN DEFAULT FALSE,ban_reason TEXT,created_at TIMESTAMPTZ DEFAULT NOW(),last_login_at TIMESTAMPTZ)`;
await q`CREATE TABLE IF NOT EXISTS verification_codes(email TEXT PRIMARY KEY,code_hash TEXT NOT NULL,expires_at TIMESTAMPTZ NOT NULL,last_sent_at TIMESTAMPTZ DEFAULT NOW())`;
await q`CREATE TABLE IF NOT EXISTS user_notes(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,body TEXT NOT NULL,updated_at TIMESTAMPTZ DEFAULT NOW())`;
await q`CREATE TABLE IF NOT EXISTS study_tasks(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,due_date DATE,done BOOLEAN DEFAULT FALSE,created_at TIMESTAMPTZ DEFAULT NOW())`;
await q`CREATE TABLE IF NOT EXISTS admin_logs(id BIGSERIAL PRIMARY KEY,action TEXT,target_email TEXT,details TEXT,created_at TIMESTAMPTZ DEFAULT NOW())`;
})();
return ready;
}

const cookie="study_session";
function cookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800};}

function setSession(res,claims){
if(!process.env.SESSION_SECRET)throw Error("Set SESSION_SECRET.");
const token=jwt.sign(claims,process.env.SESSION_SECRET,{expiresIn:"7d"});
res.append("Set-Cookie",cookieLib.serialize(cookie,token,cookieOptions()));
}

function clearSession(res){
res.append("Set-Cookie",cookieLib.serialize(cookie,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0,expires:new Date(0)}));
}

function payload(req){
const c=(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(cookie+"="));
return c?jwt.verify(decodeURIComponent(c.slice(cookie.length+1)),process.env.SESSION_SECRET):null;
}

function auth(role="user"){
return async(req,res,next)=>{
try{
const p=payload(req);
if(!p||p.role!==role)return res.status(401).json({error:"Please sign in."});
if(role==="user"){
await schema();
const u=await db()`SELECT id,email,verified,banned,ban_reason FROM users WHERE id=${p.sub}`;
if(!u.length||!u[0].verified)return res.status(401).json({error:"Account unavailable."});
if(u[0].banned)return res.status(403).json({error:"Account suspended.",reason:u[0].ban_reason});
req.user=u[0];
}
req.actor=p;
next();
}catch(e){res.status(401).json({error:"Session expired."});}
};
}

const hashCode=(e,c)=>crypto.createHash("sha256").update(`${e}:${c}:${process.env.SESSION_SECRET}`).digest("hex");

// RESEND EMAIL DELIVERY
async function mailCode(email,code){
if(!process.env.RESEND_API_KEY)throw Error("Set RESEND_API_KEY in Render Environment.");

const response=await fetch("https://api.resend.com/emails",{
method:"POST",
headers:{
Authorization:`Bearer ${process.env.RESEND_API_KEY}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
from:"Eduora <verify@eduora.net>",
to:[email],
subject:"Your Eduora verification code",
text:`Your Eduora verification code is ${code}. It expires in 10 minutes.`
}),
signal:AbortSignal.timeout(15000)
});

const result=await response.json().catch(()=>({}));
if(!response.ok)throw Error(`Resend email failed (${response.status}): ${result.message||result.name||"Unknown API error"}`);
}

// GROQ AI DELIVERY
async function ai(prompt,image){
if(!process.env.GROQ_API_KEY)throw Error("Set GROQ_API_KEY in Render.");

const content=[{type:"text",text:String(prompt||"")}];

if(image){
content.push({
type:"image_url",
image_url:{url:`data:${image.mimetype};base64,${image.buffer.toString("base64")}`}
});
}

const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{
method:"POST",
headers:{
Authorization:`Bearer ${process.env.GROQ_API_KEY}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"qwen/qwen3.8-27b",
messages:[
{
role:"system",
content:"You are Eduora AI, a friendly study tutor. Explain reasoning clearly and help learners understand. Do not help secretly cheat in live graded games or bypass protections."
},
{role:"user",content}
],
temperature:0.7,
max_completion_tokens:2048
}),
signal:AbortSignal.timeout(60000)
});

const data=await response.json().catch(()=>({}));

if(!response.ok)throw Error(data.error?.message||`Groq request failed (${response.status}).`);

const answer=data.choices?.[0]?.message?.content;

if(typeof answer!=="string"||!answer.trim())throw Error("Groq returned an empty response. Please try again.");

return answer.trim();
}

const fail=(res,e)=>{console.error(e);res.status(400).json({error:e.message||"Request failed."})};

// REGISTER
app.post("/api/auth/register",async(req,res)=>{
try{
await schema();
const email=String(req.body.email||"").trim().toLowerCase(),pw=String(req.body.password||"");

if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"Enter a valid email."});
if(pw.length<8)return res.status(400).json({error:"Password must be at least 8 characters."});

const old=await db()`SELECT id,verified FROM users WHERE email=${email}`;
if(old.length&&old[0].verified)return res.status(409).json({error:"Email already registered."});

const id=old[0]?.id||crypto.randomUUID(),ph=await bcrypt.hash(pw,12);

await db()`INSERT INTO users(id,email,password_hash,verified) VALUES(${id},${email},${ph},FALSE) ON CONFLICT(email) DO UPDATE SET password_hash=${ph},verified=FALSE`;

const code=String(crypto.randomInt(0,1000000)).padStart(6,"0"),ch=hashCode(email,code);

await db()`INSERT INTO verification_codes(email,code_hash,expires_at,last_sent_at) VALUES(${email},${ch},NOW()+INTERVAL '10 minutes',NOW()) ON CONFLICT(email) DO UPDATE SET code_hash=${ch},expires_at=NOW()+INTERVAL '10 minutes',last_sent_at=NOW()`;

await mailCode(email,code);
res.json({ok:true});
}catch(e){fail(res,e);}
});

// VERIFY EMAIL
app.post("/api/auth/verify",async(req,res)=>{
try{
await schema();
const email=String(req.body.email||"").toLowerCase(),code=String(req.body.code||"");

const rows=await db()`SELECT code_hash,expires_at FROM verification_codes WHERE email=${email}`;
const expected=rows[0]?.code_hash||"",actual=hashCode(email,code);

if(!rows.length||new Date(rows[0].expires_at)<new Date()||expected.length!==actual.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return res.status(400).json({error:"Invalid or expired code."});

const u=await db()`UPDATE users SET verified=TRUE WHERE email=${email} RETURNING id,email`;
await db()`DELETE FROM verification_codes WHERE email=${email}`;

setSession(res,{sub:u[0].id,email,role:"user"});
res.json({ok:true});
}catch(e){fail(res,e);}
});

// RESEND VERIFICATION
app.post("/api/auth/resend",async(req,res)=>{
try{
await schema();
const email=String(req.body.email||"").toLowerCase(),u=await db()`SELECT verified FROM users WHERE email=${email}`;

if(!u.length||u[0].verified)return res.status(404).json({error:"No pending verification."});

const last=await db()`SELECT last_sent_at FROM verification_codes WHERE email=${email}`;

if(last.length&&Date.now()-new Date(last[0].last_sent_at).getTime()<60000)return res.status(429).json({error:"Wait one minute before resending."});

const c=String(crypto.randomInt(0,1000000)).padStart(6,"0"),h=hashCode(email,c);

await db()`UPDATE verification_codes SET code_hash=${h},expires_at=NOW()+INTERVAL '10 minutes',last_sent_at=NOW() WHERE email=${email}`;

await mailCode(email,c);
res.json({ok:true});
}catch(e){fail(res,e);}
});

// LOGIN
app.post("/api/auth/login",async(req,res)=>{
try{
await schema();
const email=String(req.body.email||"").toLowerCase(),pw=String(req.body.password||""),u=await db()`SELECT * FROM users WHERE email=${email}`;

if(!u.length||!await bcrypt.compare(pw,u[0].password_hash))return res.status(401).json({error:"Incorrect email or password."});
if(!u[0].verified)return res.status(403).json({error:"Please verify your email first."});
if(u[0].banned)return res.status(403).json({error:"Account suspended: "+(u[0].ban_reason||"")});

await db()`UPDATE users SET last_login_at=NOW() WHERE id=${u[0].id}`;

setSession(res,{sub:u[0].id,email,role:"user"});
res.json({ok:true});
}catch(e){fail(res,e);}
});

app.post("/api/auth/logout",(_,res)=>{clearSession(res);res.json({ok:true});});
app.get("/api/auth/me",auth(),(req,res)=>res.json({user:{email:req.user.email}}));

// AI CHAT
app.post("/api/ai/chat",auth(),async(req,res)=>{
try{
res.json({answer:await ai(String(req.body.message||"").slice(0,12000))});
}catch(e){fail(res,e);}
});

// AI IMAGE SCAN
app.post("/api/ai/scan",auth(),upload.single("image"),async(req,res)=>{
try{
if(!req.file)return res.status(400).json({error:"Choose a PNG, JPG, or WEBP image."});

res.json({
answer:await ai(req.body.prompt||"Read this practice question, solve it step by step, and explain the answer.",req.file)
});
}catch(e){fail(res,e);}
});

// QUIZ AND FLASHCARDS
app.post("/api/ai/generate",auth(),async(req,res)=>{
try{
const type=req.body.type,topic=String(req.body.topic||"").trim().slice(0,400);

if(!["quiz","flashcards"].includes(type))return res.status(400).json({error:"Choose quiz or flashcards."});
if(!topic)return res.status(400).json({error:"Enter a topic first."});

const prompt=type==="flashcards"
?`Create 8 useful flashcards about ${topic}. Return only a JSON array of objects with string keys front and back.`
:`Create 8 multiple-choice practice questions about ${topic}. Return only a JSON array of objects with question, options (exactly 4 strings), answer (integer 0-3), and explanation.`;

const raw=await ai(prompt);
const cleaned=raw.replace(/```(?:json)?/gi,"").replace(/```/g,"").trim();

const start=cleaned.indexOf("["),end=cleaned.lastIndexOf("]");
if(start<0||end<start)throw Error("Eduora AI returned an unreadable format. Please try again.");

const items=JSON.parse(cleaned.slice(start,end+1));

if(!Array.isArray(items)||items.length===0)throw Error("Eduora AI did not return any study items.");

if(type==="flashcards"){
for(const x of items){
if(typeof x.front!=="string"||typeof x.back!=="string")throw Error("Flashcards were incomplete. Please try again.");
}
}else{
for(const x of items){
if(typeof x.question!=="string"||!Array.isArray(x.options)||x.options.length!==4||!x.options.every(v=>typeof v==="string")||!Number.isInteger(x.answer)||x.answer<0||x.answer>3||typeof x.explanation!=="string")throw Error("Quiz questions were incomplete. Please try again.");
}
}

res.json({items});
}catch(e){fail(res,e);}
});

// NOTES
app.get("/api/notes",auth(),async(req,res)=>{
try{
await schema();
res.json({notes:await db()`SELECT id,title,body,updated_at FROM user_notes WHERE user_id=${req.user.id} ORDER BY updated_at DESC`});
}catch(e){fail(res,e);}
});

app.post("/api/notes",auth(),async(req,res)=>{
try{
await schema();
const id=crypto.randomUUID(),title=String(req.body.title||"Untitled").slice(0,120),body=String(req.body.body||"").slice(0,20000);

await db()`INSERT INTO user_notes(id,user_id,title,body) VALUES(${id},${req.user.id},${title},${body})`;

res.json({ok:true});
}catch(e){fail(res,e);}
});

app.delete("/api/notes/:id",auth(),async(req,res)=>{
try{
await schema();
await db()`DELETE FROM user_notes WHERE id=${req.params.id} AND user_id=${req.user.id}`;
res.json({ok:true});
}catch(e){fail(res,e);}
});

// PERSONAL STUDY PLANNER
app.get("/api/tasks",auth(),async(req,res)=>{
try{
await schema();
const tasks=await db()`SELECT id,title,due_date,done,created_at FROM study_tasks WHERE user_id=${req.user.id} ORDER BY done ASC,due_date ASC NULLS LAST,created_at DESC`;
res.json({tasks});
}catch(e){fail(res,e);}
});

app.post("/api/tasks",auth(),async(req,res)=>{
try{
await schema();
const title=String(req.body.title||"").trim().slice(0,160),due=String(req.body.dueDate||"").trim();

if(!title)return res.status(400).json({error:"Enter a task title."});
if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))return res.status(400).json({error:"Choose a valid due date."});

const id=crypto.randomUUID();

await db()`INSERT INTO study_tasks(id,user_id,title,due_date) VALUES(${id},${req.user.id},${title},${due||null})`;

res.json({ok:true,id});
}catch(e){fail(res,e);}
});

app.patch("/api/tasks/:id",auth(),async(req,res)=>{
try{
await schema();
const done=!!req.body.done;

const rows=await db()`UPDATE study_tasks SET done=${done} WHERE id=${req.params.id} AND user_id=${req.user.id} RETURNING id`;

if(!rows.length)return res.status(404).json({error:"Task not found."});

res.json({ok:true});
}catch(e){fail(res,e);}
});

app.delete("/api/tasks/:id",auth(),async(req,res)=>{
try{
await schema();
await db()`DELETE FROM study_tasks WHERE id=${req.params.id} AND user_id=${req.user.id}`;
res.json({ok:true});
}catch(e){fail(res,e);}
});

/* ADMIN PANEL */
app.post("/api/admin/login",(req,res)=>{
const a=String(req.body.password||""),b=process.env.ADMIN_PASSWORD||"";

if(!b||a.length!==b.length||!crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b)))return res.status(401).json({error:"Incorrect admin password."});

setSession(res,{sub:"admin",email:"admin",role:"admin"});
res.json({ok:true});
});

app.get("/api/admin/me",auth("admin"),(_,res)=>res.json({ok:true}));
app.post("/api/admin/logout",(_,res)=>{clearSession(res);res.json({ok:true});});

app.get("/api/admin/overview",auth("admin"),async(_,res)=>{
try{
await schema();

const [a,b,c,d,n,logs]=await Promise.all([
db()`SELECT COUNT(*)::int n FROM users`,
db()`SELECT COUNT(*)::int n FROM users WHERE verified`,
db()`SELECT COUNT(*)::int n FROM users WHERE banned`,
db()`SELECT COUNT(*)::int n FROM users WHERE created_at>=CURRENT_DATE`,
db()`SELECT COUNT(*)::int n FROM user_notes`,
db()`SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 20`
]);

res.json({stats:{users:a[0].n,verified:b[0].n,banned:c[0].n,newToday:d[0].n,notes:n[0].n},logs});
}catch(e){fail(res,e);}
});

app.get("/api/admin/users",auth("admin"),async(req,res)=>{
try{
await schema();
const term=`%${String(req.query.q||"").slice(0,100)}%`;

res.json({users:await db()`SELECT id,email,verified,banned,ban_reason,created_at,last_login_at FROM users WHERE email ILIKE ${term} ORDER BY created_at DESC LIMIT 200`});
}catch(e){fail(res,e);}
});

app.post("/api/admin/users/:id/ban",auth("admin"),async(req,res)=>{
try{
await schema();
const reason=String(req.body.reason||"Suspended by administrator").slice(0,500);

const u=await db()`UPDATE users SET banned=TRUE,ban_reason=${reason} WHERE id=${req.params.id} RETURNING email`;

if(!u.length)return res.status(404).json({error:"User not found."});

await db()`INSERT INTO admin_logs(action,target_email,details) VALUES('ban',${u[0].email},${reason})`;

res.json({ok:true});
}catch(e){fail(res,e);}
});

app.post("/api/admin/users/:id/unban",auth("admin"),async(req,res)=>{
try{
await schema();

const u=await db()`UPDATE users SET banned=FALSE,ban_reason=NULL WHERE id=${req.params.id} RETURNING email`;

if(!u.length)return res.status(404).json({error:"User not found."});

await db()`INSERT INTO admin_logs(action,target_email,details) VALUES('unban',${u[0].email},'Account restored')`;

res.json({ok:true});
}catch(e){fail(res,e);}
});

app.delete("/api/admin/users/:id",auth("admin"),async(req,res)=>{
try{
await schema();

const u=await db()`DELETE FROM users WHERE id=${req.params.id} RETURNING email`;

if(!u.length)return res.status(404).json({error:"User not found."});

await db()`INSERT INTO admin_logs(action,target_email,details) VALUES('delete',${u[0].email},'Account permanently deleted')`;

res.json({ok:true});
}catch(e){fail(res,e);}
});

app.get("/api/health",(_,res)=>res.json({ok:true,version:"6.4.0"}));

module.exports=app;
