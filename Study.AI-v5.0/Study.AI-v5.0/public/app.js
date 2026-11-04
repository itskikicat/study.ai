const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let authMode = "login";
let pendingEmail = "";
let chatHistory = [];
let quizData = [];
let quizIndex = 0;
let flashcards = [];
let flashIndex = 0;
let showingBack = false;

function notice(message, bad=false) {
  const box = $("#authMessage");
  box.textContent = message;
  box.classList.remove("hidden");
  box.style.borderColor = bad ? "#9d4e64" : "#51416e";
}
function setAuthMode(mode) {
  authMode = mode;
  $("#authMessage").classList.add("hidden");
  $("#authTitle").textContent = mode === "register" ? "Create your account." : mode === "verify" ? "Check your inbox." : "Welcome back.";
  $("#authSubtitle").textContent = mode === "register" ? "Your free study space starts here." : mode === "verify" ? `Enter the six-digit code sent to ${pendingEmail}.` : "Sign in to pick up where you left off.";
  $("#passwordLabel").classList.toggle("hidden", mode === "verify");
  $("#codeLabel").classList.toggle("hidden", mode !== "verify");
  $("#authEmail").classList.toggle("hidden", mode === "verify");
  $("#authSubmit").innerHTML = mode === "register" ? "Create account <span>→</span>" : mode === "verify" ? "Verify email <span>→</span>" : "Sign in <span>→</span>";
  $("#toggleAuth").classList.toggle("hidden", mode === "verify");
  $("#resendCode").classList.toggle("hidden", mode !== "verify");
  $("#toggleAuth").textContent = mode === "register" ? "Already have an account? Sign in" : "Create a free account";
  $("#authPassword").autocomplete = mode === "register" ? "new-password" : "current-password";
}
async function api(url, options={}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showApp(user) {
  $("#authView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#profileEmail").textContent = user.email;
}
function showAuth() { $("#appView").classList.add("hidden"); $("#authView").classList.remove("hidden"); }
$("#toggleAuth").addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
$("#authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#authSubmit"); btn.disabled = true;
  try {
    if (authMode === "verify") {
      const data = await api("/api/auth/verify", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:pendingEmail,code:$("#authCode").value})});
      showApp(data.user); return;
    }
    const payload = {email:$("#authEmail").value,password:$("#authPassword").value};
    if (authMode === "register") {
      await api("/api/auth/register", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      pendingEmail = payload.email.toLowerCase(); setAuthMode("verify"); notice("We sent a six-digit code. It expires in 10 minutes.");
    } else {
      try {
        const data = await api("/api/auth/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        showApp(data.user);
      } catch (err) {
        if (err.message.includes("verify your email")) { pendingEmail = payload.email.toLowerCase(); setAuthMode("verify"); notice(err.message); }
        else throw err;
      }
    }
  } catch(err) { notice(err.message, true); }
  finally { btn.disabled = false; }
});
$("#resendCode").addEventListener("click", async () => {
  try { const d=await api("/api/auth/resend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:pendingEmail})}); notice(d.message); }
  catch(e){notice(e.message,true);}
});
$("#logoutBtn").addEventListener("click", async()=>{await api("/api/auth/logout",{method:"POST"});chatHistory=[];showAuth();setAuthMode("login");});
async function boot(){try{const d=await api("/api/me");if(d.user)showApp(d.user);else showAuth();}catch{showAuth();}}
boot();

const pageNames={home:"Overview",chat:"AI Tutor",scanner:"Question Scanner",quiz:"Quiz Arena",cards:"Flashcards",notes:"Study Notes"};
function go(page){
  $$(".page").forEach(p=>p.classList.remove("active-page"));
  $(`#page-${page}`).classList.add("active-page");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("#pageName").textContent=pageNames[page];
}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

function addMessage(role,text){
  const box=$("#chatMessages");
  const welcome=box.querySelector(".welcome-message"); if(welcome)welcome.remove();
  const el=document.createElement("div");el.className=`message ${role}`;el.textContent=text;box.append(el);box.scrollTop=box.scrollHeight;return el;
}
async function sendChat(text){
  if(!text.trim())return;
  addMessage("user",text);chatHistory.push({role:"user",content:text});
  const typing=addMessage("assistant","Study.AI is thinking…");typing.classList.add("typing");
  try{
    const d=await api("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:chatHistory})});
    typing.textContent=d.answer;typing.classList.remove("typing");chatHistory.push({role:"assistant",content:d.answer});
  }catch(e){typing.textContent=e.message;typing.classList.remove("typing");}
}
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const t=$("#chatInput").value;$("#chatInput").value="";sendChat(t);});
$("#chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit();}});
$$(".suggestions button").forEach(b=>b.addEventListener("click",()=>sendChat(b.textContent)));
$("#newChat").addEventListener("click",()=>{chatHistory=[];$("#chatMessages").innerHTML='<div class="welcome-message"><div class="big-spark">✧</div><h2>What are we learning?</h2><p class="muted">I'm here to make the tricky stuff easier.</p><div class="suggestions"><button>Explain photosynthesis simply</button><button>Help me understand fractions</button><button>Give me a history study plan</button></div></div>';$$(".suggestions button").forEach(b=>b.addEventListener("click",()=>sendChat(b.textContent)));});

let selectedImage=null;
$("#scanImage").addEventListener("change",e=>{
  selectedImage=e.target.files[0]||null;const box=$("#imagePreview");box.innerHTML="";
  if(selectedImage){const img=document.createElement("img");img.src=URL.createObjectURL(selectedImage);box.append(img);box.classList.remove("hidden");}
  else box.classList.add("hidden");
});
$("#scanForm").addEventListener("submit",async e=>{
  e.preventDefault();const result=$("#scanResult");result.textContent="Reading your question…";
  const form=new FormData();form.append("question",$("#scanQuestion").value);if(selectedImage)form.append("image",selectedImage);
  try{const d=await api("/api/solve",{method:"POST",body:form});result.textContent=d.answer;}
  catch(err){result.textContent=err.message;}
});

$("#makeQuiz").addEventListener("click",async()=>{
  const topic=$("#quizTopic").value.trim();if(!topic){$("#quizArea").textContent="Enter a topic first.";return;}
  $("#quizArea").textContent="Creating your practice quiz…";
  try{
    const prompt=`Create ${$("#quizCount").value} ${$("#quizDifficulty").value.toLowerCase()} multiple-choice practice questions about ${topic}. Return ONLY valid JSON array. Each item: {"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}. answer is the zero-based correct option index.`;
    const d=await api("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
    const raw=d.answer.replace(/```json|```/g,"").trim();const match=raw.match(/\[[\s\S]*\]/);if(!match)throw new Error("Couldn't read the quiz format. Try again.");
    quizData=JSON.parse(match[0]);quizIndex=0;renderQuiz();
  }catch(err){$("#quizArea").textContent=err.message;}
});
function renderQuiz(){
  const area=$("#quizArea");if(quizIndex>=quizData.length){area.textContent="Quiz complete! Great work.";return;}
  const q=quizData[quizIndex];area.innerHTML="";const wrap=document.createElement("div");wrap.className="quiz-question";
  const title=document.createElement("b");title.textContent=`Question ${quizIndex+1} of ${quizData.length}: ${q.question}`;wrap.append(title);
  q.options.forEach((opt,i)=>{const b=document.createElement("button");b.className="quiz-option";b.textContent=opt;b.addEventListener("click",()=>{if(wrap.dataset.done)return;wrap.dataset.done="1";b.classList.add(i===q.answer?"correct":"wrong");if(i!==q.answer)wrap.querySelectorAll(".quiz-option")[q.answer].classList.add("correct");const explain=document.createElement("p");explain.textContent=q.explanation||"Review the topic and try another question.";wrap.append(explain);const next=document.createElement("button");next.className="primary";next.textContent=quizIndex===quizData.length-1?"Finish quiz":"Next question →";next.onclick=()=>{quizIndex++;renderQuiz();};wrap.append(next);});wrap.append(b);});
  area.append(wrap);
}
$("#makeCards").addEventListener("click",async()=>{
  const topic=$("#cardTopic").value.trim();if(!topic){$("#cardsArea").textContent="Enter a topic first.";return;}
  $("#cardsArea").textContent="Making your flashcards…";
  try{
    const prompt=`Create 10 concise study flashcards about ${topic}. Return ONLY valid JSON array with objects {"front":"question or term","back":"short answer"}.`;
    const d=await api("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
    const match=d.answer.replace(/```json|```/g,"").match(/\[[\s\S]*\]/);if(!match)throw new Error("Couldn't read the flashcards. Try again.");
    flashcards=JSON.parse(match[0]);flashIndex=0;showCard();
  }catch(e){$("#cardsArea").textContent=e.message;}
});
function showCard(){
  const area=$("#cardsArea");if(!flashcards.length){area.textContent="No cards yet.";return;}
  const card=flashcards[flashIndex];area.innerHTML="";
  const face=document.createElement("div");face.className="flashcard";face.innerHTML="";const text=document.createElement("div");text.textContent=showingBack?card.back:card.front;const hint=document.createElement("small");hint.textContent=showingBack?"ANSWER · CLICK TO FLIP":"QUESTION · CLICK TO REVEAL";face.append(text,hint);face.onclick=()=>{showingBack=!showingBack;showCard();};
  const controls=document.createElement("div");controls.style="display:flex;justify-content:space-between;align-items:center;margin-top:12px";
  const prev=document.createElement("button");prev.className="secondary";prev.textContent="← Previous";prev.onclick=()=>{flashIndex=(flashIndex-1+flashcards.length)%flashcards.length;showingBack=false;showCard();};
  const count=document.createElement("span");count.textContent=`${flashIndex+1} / ${flashcards.length}`;
  const next=document.createElement("button");next.className="secondary";next.textContent="Next →";next.onclick=()=>{flashIndex=(flashIndex+1)%flashcards.length;showingBack=false;showCard();};
  controls.append(prev,count,next);area.append(face,controls);
}
$("#saveNotes").addEventListener("click",()=>{localStorage.setItem("studyai.notes.title",$("#notesTitle").value);localStorage.setItem("studyai.notes.body",$("#notesBody").value);$("#notesStatus").textContent="Saved in this browser ✓";});
$("#notesTitle").value=localStorage.getItem("studyai.notes.title")||"";
$("#notesBody").value=localStorage.getItem("studyai.notes.body")||"";
