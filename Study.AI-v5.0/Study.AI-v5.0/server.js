"use strict";
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], conversations: {} }, null, 2));

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { users: [], conversations: {} }; }
}
function writeDB(db) {
  const temp = DB_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temp, DB_FILE);
}
const db = readDB();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "studyai.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  store: new FileStore({ path: path.join(DATA_DIR, "sessions"), retries: 1 }),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpeg|webp)$/.test(file.mimetype))
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");
const safeUser = (u) => ({ id: u.id, email: u.email, verified: u.verified });

function requireAuth(req, res, next) {
  const user = db.users.find(u => u.id === req.session.userId);
  if (!user || !user.verified) return res.status(401).json({ error: "Please sign in with a verified email." });
  req.user = user;
  next();
}
async function sendVerification(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Email isn't configured yet. Add RESEND_API_KEY and EMAIL_FROM on the server.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Your Study.AI verification code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#201b35"><h1>Verify your email</h1><p>Your Study.AI code is:</p><div style="font-size:34px;font-weight:800;letter-spacing:10px;padding:18px;background:#f2efff;border-radius:14px;text-align:center">${code}</div><p>This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p></div>`
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Email provider could not send the code. Check your Resend sender configuration. " + detail.slice(0, 180));
  }
}
function newCode() { return String(crypto.randomInt(100000, 1000000)); }

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!emailPattern.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be 8–128 characters." });
  let user = db.users.find(u => u.email === email);
  if (user?.verified) return res.status(409).json({ error: "An account with that email already exists. Please sign in." });
  const code = newCode();
  const passwordHash = await bcrypt.hash(password, 12);
  if (!user) {
    user = { id: crypto.randomUUID(), email, passwordHash, verified: false, verificationHash: hashCode(code), verificationExpires: Date.now() + 10 * 60 * 1000, lastCodeSent: Date.now(), createdAt: Date.now() };
    db.users.push(user);
  } else {
    user.passwordHash = passwordHash;
    user.verificationHash = hashCode(code);
    user.verificationExpires = Date.now() + 10 * 60 * 1000;
    user.lastCodeSent = Date.now();
  }
  try {
    await sendVerification(email, code);
    writeDB(db);
    req.session.pendingEmail = email;
    res.json({ ok: true, message: "Verification code sent. Check your inbox." });
  } catch (e) {
    // Do not persist a registration that cannot receive its verification code.
    if (!user.verified) {
      db.users = db.users.filter(u => u.id !== user.id);
      writeDB(db);
    }
    res.status(503).json({ error: e.message });
  }
});

app.post("/api/auth/verify", authLimiter, (req, res) => {
  const email = String(req.body.email || req.session.pendingEmail || "").trim().toLowerCase();
  const code = String(req.body.code || "").trim();
  const user = db.users.find(u => u.email === email);
  if (!user || !/^\d{6}$/.test(code) || !user.verificationHash || user.verificationExpires < Date.now() || hashCode(code) !== user.verificationHash) {
    return res.status(400).json({ error: "That code is invalid or expired. Request a new one." });
  }
  user.verified = true;
  user.verificationHash = null;
  user.verificationExpires = null;
  writeDB(db);
  req.session.userId = user.id;
  req.session.pendingEmail = null;
  res.json({ ok: true, user: safeUser(user) });
});

app.post("/api/auth/resend", authLimiter, async (req, res) => {
  const email = String(req.body.email || req.session.pendingEmail || "").trim().toLowerCase();
  const user = db.users.find(u => u.email === email && !u.verified);
  if (!user) return res.status(400).json({ error: "No unverified account found for that email." });
  if (Date.now() - (user.lastCodeSent || 0) < 60 * 1000) return res.status(429).json({ error: "Please wait one minute before requesting another code." });
  const code = newCode();
  try {
    await sendVerification(email, code);
    user.verificationHash = hashCode(code);
    user.verificationExpires = Date.now() + 10 * 60 * 1000;
    user.lastCodeSent = Date.now();
    writeDB(db);
    res.json({ ok: true, message: "A new code has been sent." });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
  if (!user.verified) {
    req.session.pendingEmail = email;
    return res.status(403).json({ error: "Please verify your email first.", needsVerification: true });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Could not start your session." });
    req.session.userId = user.id;
    res.json({ ok: true, user: safeUser(user) });
  });
});

app.post("/api/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => {
  const user = db.users.find(u => u.id === req.session.userId && u.verified);
  res.json({ user: user ? safeUser(user) : null });
});

async function askAI(messages, image) {
  if (!process.env.OPENAI_API_KEY) throw new Error("AI isn't configured yet. Add OPENAI_API_KEY to your server environment variables.");
  const input = messages.map(m => ({ role: m.role, content: m.content }));
  if (image) {
    const last = input[input.length - 1];
    last.content = [
      { type: "input_text", text: String(last.content || "Read this image and help me solve the study question.") },
      { type: "input_image", image_url: `data:${image.mimetype};base64,${image.buffer.toString("base64")}` }
    ];
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "You are Study.AI, a friendly and accurate study tutor. Help learners understand school subjects. For questions, give the likely answer and a clear, concise explanation. If an image is provided, read only what is visible and say when text is unclear. Encourage learning and never claim certainty when evidence is missing. Do not help interfere with active quiz games, obtain hidden answers, bypass platform protections, or manipulate scores.",
      input,
      max_output_tokens: 900
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "The AI provider returned an error.");
  const output = (data.output || []).flatMap(item => item.content || []).filter(c => c.type === "output_text").map(c => c.text).join("\n");
  return output || "I couldn't generate a response. Please try again.";
}

app.post("/api/chat", requireAuth, async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-12) : [];
  if (!messages.length || messages.some(m => !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
    return res.status(400).json({ error: "Send a valid chat message." });
  }
  try {
    const answer = await askAI(messages);
    res.json({ answer });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.post("/api/solve", requireAuth, upload.single("image"), async (req, res) => {
  const question = String(req.body.question || "").slice(0, 4000);
  if (!question.trim() && !req.file) return res.status(400).json({ error: "Add a question or upload a screenshot." });
  try {
    const prompt = question || "Please read the visible question(s) in this screenshot, transcribe them, and help me solve them.";
    const answer = await askAI([{ role: "user", content: prompt }], req.file || null);
    res.json({ answer });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, version: "5.0.0" }));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Study.AI running on port ${PORT}`));
