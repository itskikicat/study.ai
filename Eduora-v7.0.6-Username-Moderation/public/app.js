const $ = id => document.getElementById(id);
let mode = "login", emailPending = "", quizItems = [], flashcards = [], cardIndex = 0, cardBack = false;

async function api(url, options = {}) {
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
function showMessage(text) { $("msg").textContent = text; }
function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) { button.dataset.originalText = button.textContent; button.textContent = label || "Please wait…"; }
  else if (button.dataset.originalText) { button.textContent = button.dataset.originalText; delete button.dataset.originalText; }
  button.disabled = busy;
}

// Authentication
const authForm = $("form");
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  $("submit").textContent = mode === "login" ? "Sign in" : "Create account";
  $("registerUsernameWrap").classList.toggle("hide", mode !== "register");
  showMessage("");
}));
authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("submit"); setBusy(button, true, "Please wait…");
  emailPending = $("email").value.trim().toLowerCase();
  try {
    if (mode === "register") {
      await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: emailPending, password: $("password").value, username: $("registerUsername").value.trim() }) });
      authForm.classList.add("hide"); $("verify").classList.remove("hide"); showMessage("Check your inbox for your six-digit code.");
    } else {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailPending, password: $("password").value }) });
      await start();
    }
  } catch (error) { showMessage(error.message); }
  finally { setBusy(button, false); }
});
$("verify").addEventListener("submit", async event => {
  event.preventDefault(); const button = event.submitter || $("verify").querySelector(".primary"); setBusy(button, true, "Verifying…");
  try { await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ email: emailPending, code: $("code").value.trim() }) }); await start(); }
  catch (error) { showMessage(error.message); }
  finally { setBusy(button, false); }
});
$("resend").addEventListener("click", async () => {
  const button = $("resend"); setBusy(button, true, "Sending…");
  try { await api("/api/auth/resend", { method: "POST", body: JSON.stringify({ email: emailPending }) }); showMessage("A new code has been sent."); }
  catch (error) { showMessage(error.message); }
  finally { setBusy(button, false); }
});
async function start() {
  $("auth").classList.add("hide"); $("app").classList.remove("hide");
  try { const data = await api("/api/auth/me"); window.eduoraSignedInEmail = data.user.email; window.eduoraProfile = data.user; renderEmailVisibility(); loadProfileSettings(); } catch { $("who").textContent = ""; }
  await Promise.all([loadNotes(), loadTasks()]);
}
async function init() { try { await api("/api/auth/me"); await start(); } catch { /* Signed-out state is already visible. */ } }

document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hide"));
  $(button.dataset.page).classList.remove("hide");
  if (button.dataset.page === "planner") loadTasks();
  if (button.dataset.page === "notes") loadNotes();
  if (button.dataset.page === "people") loadConversations();
}));
$("logout").addEventListener("click", async () => { try { await api("/api/auth/logout", { method: "POST" }); } finally { location.reload(); } });

// Eduora AI chat
function bubble(text, className) {
  const paragraph = document.createElement("p"); paragraph.className = className; paragraph.textContent = text;
  $("messages").append(paragraph); $("messages").scrollTop = $("messages").scrollHeight; return paragraph;
}
$("newchat").addEventListener("click", () => { $("messages").replaceChildren(); bubble("New chat. What are we learning?", "ai"); });
$("chatForm").addEventListener("submit", async event => {
  event.preventDefault(); const input = $("prompt"), text = input.value.trim(); if (!text) return;
  input.value = ""; bubble(text, "user"); const waiting = bubble("Eduora AI is thinking…", "ai");
  const button = event.submitter; setBusy(button, true, "Thinking…");
  try {
    const response = await fetch("/api/ai/chat-stream", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,language:window.eduoraLanguage||localStorage.getItem("eduora-language")||"en",answerStyle:localStorage.getItem("eduora-answerStyleSelect")||"balanced",explanationLevel:localStorage.getItem("eduora-studyLevelSelect")||"school"})});
    if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||`Request failed (${response.status}).`)}
    waiting.textContent=""; const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";
    while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const payload=line.slice(6).trim();if(payload==="[DONE]")continue;try{const part=JSON.parse(payload);if(part.error)throw new Error(part.error);const delta=part.choices?.[0]?.delta?.content;if(typeof delta==="string"){waiting.textContent+=delta;$ ("messages").scrollTop=$("messages").scrollHeight;}}catch(error){if(error.message!=="Unexpected end of JSON input")throw error;}}}
    if(!waiting.textContent.trim())waiting.textContent="I couldn't create a response. Please try again.";
  } catch (error) { waiting.textContent = error.message; }
  finally { setBusy(button, false); }
});

// Screenshot question scanner
$("scanBtn").addEventListener("click", async () => {
  const file = $("image").files[0]; if (!file) { $("scanResult").textContent = "Choose an image first."; return; }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { $("scanResult").textContent = "Please choose a PNG, JPG, or WEBP image."; return; }
  if (file.size > 4 * 1024 * 1024) { $("scanResult").textContent = "The image must be smaller than 4 MB."; return; }
  const form = new FormData(); form.append("image", file); form.append("prompt", "Complete the entire worksheet shown in the image. First carefully inspect the full image and transcribe the visible instructions and questions. Then answer EVERY visible question, fill EVERY blank and unfinished field, and preserve the original order, numbering, labels, and table structure as closely as possible. For multiple-choice questions, give the correct option and its text. For calculations, show the working and final answer. For diagrams, identify the relevant labels where possible. Do not skip questions. If any text or part is unreadable, clearly say exactly which part needs a clearer photo instead of guessing. Check each answer for correctness before responding. Format the result neatly as a completed worksheet, followed by brief explanations only where useful. " + ($("scanPrompt").value || "").trim()); form.append("language", window.eduoraLanguage||"en");
  const button = $("scanBtn"); setBusy(button, true, "Completing…"); $("scanResult").textContent = "Eduora AI is reading the whole worksheet and preparing the answers…";
  try { $("scanResult").textContent = (await api("/api/ai/scan", { method: "POST", body: form })).answer; }
  catch (error) { $("scanResult").textContent = error.message; }
  finally { setBusy(button, false); }
});

// Practice quizzes with a score and explanations
$("quizBtn").addEventListener("click", async () => {
  const button = $("quizBtn"); setBusy(button, true, "Building quiz…"); $("quizResult").textContent = "Eduora AI is preparing your questions…";
  try { const data = await api("/api/ai/generate", { method: "POST", body: JSON.stringify({ type: "quiz", topic: $("topic").value.trim(), language: window.eduoraLanguage||"en" }) }); quizItems = data.items; renderQuiz(); }
  catch (error) { $("quizResult").textContent = error.message; }
  finally { setBusy(button, false); }
});
function renderQuiz() {
  const root = $("quizResult"); root.replaceChildren();
  const answers = new Array(quizItems.length).fill(null);
  const progress = document.createElement("p"); progress.className = "muted"; root.append(progress);
  const cards = quizItems.map((question, index) => {
    const panel = document.createElement("article"); panel.className = "panel quizQuestion";
    const heading = document.createElement("h3"); heading.textContent = `${index + 1}. ${question.question}`; panel.append(heading);
    const options = document.createElement("div"); options.className = "quizOptions";
    question.options.forEach((option, optionIndex) => {
      const button = document.createElement("button"); button.className = "quizOption"; button.textContent = option;
      button.addEventListener("click", () => {
        if (answers[index] !== null) return;
        answers[index] = optionIndex; button.classList.add(optionIndex === question.answer ? "correct" : "incorrect");
        options.querySelectorAll("button").forEach((item, i) => { item.disabled = true; if (i === question.answer) item.classList.add("correct"); });
        const explanation = document.createElement("p"); explanation.className = "explanation";
        explanation.textContent = `${optionIndex === question.answer ? "Correct! " : "Not quite. "}${question.explanation}`; panel.append(explanation);
        const count = answers.filter(value => value !== null).length; progress.textContent = `${count} of ${quizItems.length} answered`;
        if (count === quizItems.length) showScore();
      }); options.append(button);
    });
    panel.append(options); return panel;
  });
  cards.forEach(card => root.append(card));
  const score = document.createElement("div"); score.className = "panel scorePanel hide"; score.id = "quizScore"; root.append(score);
  function showScore() {
    const correct = answers.reduce((sum, value, i) => sum + (value === quizItems[i].answer ? 1 : 0), 0);
    score.classList.remove("hide"); score.innerHTML = `<h2>Quiz complete!</h2><p class="scoreNumber">${correct} / ${quizItems.length}</p><p>${Math.round(correct / quizItems.length * 100)}% correct</p><button type="button" class="primary" id="retryQuiz">Try again</button>`;
    $("retryQuiz").addEventListener("click", renderQuiz);
    score.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  progress.textContent = `0 of ${quizItems.length} answered`;
}

// Flashcards: flip, navigate, and shuffle
$("cardBtn").addEventListener("click", async () => {
  const button = $("cardBtn"); setBusy(button, true, "Creating cards…"); $("cardResult").textContent = "Eduora AI is creating your flashcards…";
  try { flashcards = (await api("/api/ai/generate", { method: "POST", body: JSON.stringify({ type: "flashcards", topic: $("cardTopic").value.trim(), language: window.eduoraLanguage||"en" }) })).items; cardIndex = 0; cardBack = false; renderCard(); }
  catch (error) { $("cardResult").textContent = error.message; }
  finally { setBusy(button, false); }
});
function renderCard() {
  if (!flashcards.length) return; const root = $("cardResult"); root.replaceChildren();
  const card = document.createElement("button"); card.type = "button"; card.className = "flashcard panel"; card.textContent = cardBack ? flashcards[cardIndex].back : flashcards[cardIndex].front;
  card.setAttribute("aria-label", "Flashcard. Click to flip."); card.addEventListener("click", () => { cardBack = !cardBack; renderCard(); });
  const count = document.createElement("p"); count.className = "muted"; count.textContent = `Card ${cardIndex + 1} of ${flashcards.length} · Click the card to flip`;
  const controls = document.createElement("div"); controls.className = "flashcardControls";
  const previous = document.createElement("button"); previous.textContent = "Previous"; previous.disabled = flashcards.length < 2;
  previous.addEventListener("click", () => { cardIndex = (cardIndex + flashcards.length - 1) % flashcards.length; cardBack = false; renderCard(); });
  const shuffle = document.createElement("button"); shuffle.textContent = "Shuffle"; shuffle.addEventListener("click", () => { flashcards = [...flashcards].sort(() => Math.random() - .5); cardIndex = 0; cardBack = false; renderCard(); });
  const next = document.createElement("button"); next.textContent = "Next"; next.disabled = flashcards.length < 2;
  next.addEventListener("click", () => { cardIndex = (cardIndex + 1) % flashcards.length; cardBack = false; renderCard(); });
  controls.append(previous, shuffle, next); root.append(card, count, controls);
}

// Study notes
$("saveNote").addEventListener("click", async () => {
  const button = $("saveNote"); setBusy(button, true, "Saving…");
  try { await api("/api/notes", { method: "POST", body: JSON.stringify({ title: $("noteTitle").value, body: $("noteBody").value }) }); $("noteTitle").value = ""; $("noteBody").value = ""; await loadNotes(); }
  catch (error) { alert(error.message); }
  finally { setBusy(button, false); }
});
async function loadNotes() {
  try {
    const data = await api("/api/notes"); const root = $("noteList"); root.replaceChildren();
    data.notes.forEach(note => {
      const panel = document.createElement("article"); panel.className = "panel";
      const heading = document.createElement("h3"); heading.textContent = note.title;
      const body = document.createElement("p"); body.textContent = note.body;
      const remove = document.createElement("button"); remove.textContent = "Delete"; remove.addEventListener("click", async () => { if (!confirm("Delete this note?")) return; try { await api(`/api/notes/${encodeURIComponent(note.id)}`, { method: "DELETE" }); await loadNotes(); } catch (error) { alert(error.message); } });
      panel.append(heading, body, remove); root.append(panel);
    });
    if (!data.notes.length) root.textContent = "Your saved notes will appear here.";
  } catch (error) { $("noteList").textContent = error.message; }
}

// Personal study planner
$("taskForm").addEventListener("submit", async event => {
  event.preventDefault(); const button = event.submitter; setBusy(button, true, "Adding…");
  try { await api("/api/tasks", { method: "POST", body: JSON.stringify({ title: $("taskTitle").value, dueDate: $("taskDate").value }) }); $("taskTitle").value = ""; $("taskDate").value = ""; await loadTasks(); }
  catch (error) { alert(error.message); }
  finally { setBusy(button, false); }
});
async function loadTasks() {
  try {
    const data = await api("/api/tasks"); const root = $("taskList"); root.replaceChildren();
    const done = data.tasks.filter(task => task.done).length; $("taskDone").textContent = done; $("taskTodo").textContent = data.tasks.length - done;
    data.tasks.forEach(task => {
      const row = document.createElement("div"); row.className = "taskRow panel";
      const label = document.createElement("label"); label.className = "taskLabel";
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = task.done; checkbox.addEventListener("change", async () => { checkbox.disabled = true; try { await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "PATCH", body: JSON.stringify({ done: checkbox.checked }) }); await loadTasks(); } catch (error) { checkbox.checked = !checkbox.checked; checkbox.disabled = false; alert(error.message); } });
      const title = document.createElement("span"); title.textContent = task.title; if (task.done) title.classList.add("taskDone"); label.append(checkbox, title);
      const meta = document.createElement("small"); meta.textContent = task.due_date ? `Due ${new Date(`${String(task.due_date).slice(0,10)}T12:00:00`).toLocaleDateString()}` : "No due date";
      const remove = document.createElement("button"); remove.textContent = "Remove"; remove.addEventListener("click", async () => { try { await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" }); await loadTasks(); } catch (error) { alert(error.message); } });
      row.append(label, meta, remove); root.append(row);
    });
    if (!data.tasks.length) root.textContent = "No tasks yet. Add your first study goal above!";
  } catch (error) { $("taskList").textContent = error.message; }
}


// AI presentation builder with editable slide content and print-to-PDF support.
$("makePresentationBtn").addEventListener("click",async()=>{const topic=$("presentationTopic").value.trim(),button=$("makePresentationBtn"),status=$("presentationStatus"),root=$("presentationResult");if(!topic){status.textContent="Enter a presentation topic.";return}setBusy(button,true,"Building slides…");status.textContent="Eduora AI is creating your presentation…";root.replaceChildren();try{const data=await api("/api/ai/presentation",{method:"POST",body:JSON.stringify({topic,audience:$("presentationAudience").value.trim(),language:window.eduoraLanguage||"en"})});const deck=data.presentation;const header=document.createElement("div");header.className="presentationToolbar";const title=document.createElement("h2");title.textContent=deck.title;const print=document.createElement("button");print.className="primary";print.textContent="Print / Save as PDF";print.addEventListener("click",()=>window.print());header.append(title,print);root.append(header);if(deck.subtitle){const sub=document.createElement("p");sub.className="muted";sub.textContent=deck.subtitle;root.append(sub)}deck.slides.forEach((slide,index)=>{const card=document.createElement("article");card.className="panel presentationSlide";const heading=document.createElement("h3");heading.textContent=`${index+1}. ${slide.title}`;heading.contentEditable="true";card.append(heading);const list=document.createElement("ul");slide.bullets.forEach(item=>{const li=document.createElement("li");li.textContent=item;li.contentEditable="true";list.append(li)});card.append(list);if(slide.speakerNotes){const details=document.createElement("details");const summary=document.createElement("summary");summary.textContent="Speaker notes";const notes=document.createElement("p");notes.textContent=slide.speakerNotes;details.append(summary,notes);card.append(details)}root.append(card)});status.textContent=`Created ${deck.slides.length} slides. You can edit text on the page or print to PDF.`}catch(error){status.textContent=error.message}finally{setBusy(button,false)}});

init();

// Personal display settings (stored locally on this device)
function renderEmailVisibility(){ const show=localStorage.getItem("eduora-show-email")!=="false"; const who=$("who"); if(who) who.textContent=show && window.eduoraSignedInEmail ? `Signed in as ${window.eduoraSignedInEmail}` : ""; const toggle=$("showEmailToggle"); if(toggle) toggle.checked=show; }
function applyTheme(){ const light=localStorage.getItem("eduora-theme")==="light"; document.body.classList.toggle("lightMode",light); const toggle=$("lightModeToggle"); if(toggle) toggle.checked=light; }
function loadProfileSettings(){const p=window.eduoraProfile||{};if($("usernameInput"))$("usernameInput").value=p.username||"";if($("displayNameInput"))$("displayNameInput").value=p.displayName||"";for(const id of ["fontSizeSelect","answerStyleSelect","studyLevelSelect"]){const v=localStorage.getItem("eduora-"+id);if(v&&$(id))$(id).value=v;}applyTextSize();}
function applyTextSize(){const size=localStorage.getItem("eduora-font-size")||"normal";document.body.classList.toggle("largeText",size==="large");document.body.classList.toggle("largerText",size==="larger");if($("fontSizeSelect"))$("fontSizeSelect").value=size;}
$("saveProfileBtn")?.addEventListener("click",async()=>{const b=$("saveProfileBtn"),status=$("profileStatus");setBusy(b,true,"Saving…");try{const data=await api("/api/auth/profile",{method:"PATCH",body:JSON.stringify({username:$("usernameInput").value,displayName:$("displayNameInput").value})});window.eduoraProfile={...(window.eduoraProfile||{}),...data.user};status.textContent="Profile saved successfully.";}catch(e){status.textContent=e.message;}finally{setBusy(b,false);}});
for(const id of ["fontSizeSelect","answerStyleSelect","studyLevelSelect"]){$(id)?.addEventListener("change",e=>{localStorage.setItem("eduora-"+id,e.target.value);if(id==="fontSizeSelect"){localStorage.setItem("eduora-font-size",e.target.value);applyTextSize();}});}
applyTheme();applyTextSize();
$("lightModeToggle")?.addEventListener("change",e=>{localStorage.setItem("eduora-theme",e.target.checked?"light":"dark");applyTheme();});
$("showEmailToggle")?.addEventListener("change",e=>{localStorage.setItem("eduora-show-email",String(e.target.checked));renderEmailVisibility();});

// People search and private messaging.
let activeConversation = null, activeConversationTimer = null;
function safeText(el, value){el.textContent=value==null?"":String(value)}
async function searchPeople(){const q=$("peopleSearch").value.trim(),root=$("peopleResults");root.textContent="Searching…";try{const data=await api(`/api/people?q=${encodeURIComponent(q)}`);root.replaceChildren();if(!data.users.length){root.textContent="No matching usernames found. Users need to set a username in Settings first.";return;}data.users.forEach(user=>{const row=document.createElement("div");row.className="personResult";const label=document.createElement("span");label.textContent=`${user.displayName} · @${user.username}`;const btn=document.createElement("button");btn.type="button";btn.textContent="Message";btn.addEventListener("click",async()=>{try{const c=await api("/api/conversations",{method:"POST",body:JSON.stringify({username:user.username})});await loadConversations();await openConversation(c.id,`@${user.username}`)}catch(e){alert(e.message)}});row.append(label,btn);root.append(row)})}catch(e){root.textContent=e.message}}
async function loadConversations(){const root=$("conversationList");try{const data=await api("/api/conversations");root.replaceChildren();if(!data.conversations.length){root.textContent="No conversations yet. Search for a username above to start one.";return;}data.conversations.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="conversationButton";b.textContent=c.other_name?`${c.other_name} (@${c.other_username||"member"})`:"Conversation";b.addEventListener("click",()=>openConversation(c.id,b.textContent));root.append(b)})}catch(e){root.textContent=e.message}}
async function openConversation(id,title){activeConversation=id;$("dmTitle").textContent=title;$("dmInput").disabled=false;$("dmSend").disabled=false;await refreshMessages();if(activeConversationTimer)clearInterval(activeConversationTimer);activeConversationTimer=setInterval(()=>{if(activeConversation===id)refreshMessages()},5000)}
async function refreshMessages(){if(!activeConversation)return;try{const data=await api(`/api/conversations/${activeConversation}/messages`),root=$("dmMessages");root.replaceChildren();data.messages.forEach(m=>{const wrap=document.createElement("div");wrap.className=m.mine?"dmBubble mine":"dmBubble";const who=document.createElement("b");who.textContent=m.mine?"You":(m.display_name||m.username||"Member");wrap.append(who);if(m.body){const body=document.createElement("p");body.textContent=m.body;wrap.append(body)}if(m.media_data){if((m.media_type||"").startsWith("image/")){const img=document.createElement("img");img.src=m.media_data;img.alt=m.media_name||"Shared image";img.className="dmMediaImage";wrap.append(img)}else if((m.media_type||"").startsWith("video/")){const video=document.createElement("video");video.src=m.media_data;video.controls=true;video.className="dmMediaVideo";wrap.append(video)}}root.append(wrap)});root.scrollTop=root.scrollHeight}catch(e){$("dmMessages").textContent=e.message}}
$("peopleSearchBtn")?.addEventListener("click",searchPeople);$("peopleSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchPeople()}});
$("dmForm")?.addEventListener("submit",async e=>{e.preventDefault();const input=$("dmInput"),body=input.value.trim(),file=$("dmMedia").files[0];if((!body&&!file)||!activeConversation)return;$("dmSend").disabled=true;try{const form=new FormData();form.append("body",body);if(file)form.append("media",file);await api(`/api/conversations/${activeConversation}/messages`,{method:"POST",body:form});input.value="";$("dmMedia").value="";$("dmMediaName").textContent="Only you and the selected member can see this conversation.";await refreshMessages()}catch(err){alert(err.message)}finally{$("dmSend").disabled=false}});

// Messaging panel controls and account lifecycle actions.
$("dmMedia")?.addEventListener("change",e=>{$("dmMediaName").textContent=e.target.files[0]?.name||"Only you and the selected member can see this conversation."});
$("hideDmBtn")?.addEventListener("click",()=>{const content=$("dmContent"),hidden=content.classList.toggle("hide");$("hideDmBtn").textContent=hidden?"Show chat":"Hide chat";$("hideDmBtn").setAttribute("aria-expanded",String(!hidden))});
$("deactivateAccountBtn")?.addEventListener("click",async()=>{if(!confirm("Deactivate your Eduora account? You will be signed out and won't be able to sign in until support reactivates it."))return;try{await api("/api/account/deactivate",{method:"POST",body:JSON.stringify({})});location.reload()}catch(e){$("accountStatus").textContent=e.message}});
$("deleteAccountBtn")?.addEventListener("click",async()=>{if(!confirm("Permanently delete your Eduora account and associated data? This cannot be undone."))return;if(!confirm("Final confirmation: permanently delete this account?"))return;try{await api("/api/account",{method:"DELETE"});location.reload()}catch(e){$("accountStatus").textContent=e.message}});
