(() => {
  const landing = document.getElementById("landing");
  const auth = document.getElementById("auth");
  if (!landing || !auth) return;
  function openAuth(mode = "register") {
    landing.classList.add("hide");
    document.getElementById("app")?.classList.add("hide");
    auth.classList.remove("hide");
    auth.querySelector(`[data-mode="${mode}"]`)?.click();
    window.scrollTo({top:0,behavior:"smooth"});
    document.getElementById("email")?.focus({preventScroll:true});
  }
  function openLanding() {
    auth.classList.add("hide");
    landing.classList.remove("hide");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  ["headerGetStarted","heroGetStarted","previewGetStarted","bottomGetStarted"].forEach(id =>
    document.getElementById(id)?.addEventListener("click",()=>openAuth("register"))
  );
  document.getElementById("headerSignIn")?.addEventListener("click",()=>openAuth("login"));
  document.getElementById("backHome")?.addEventListener("click",event=>{event.preventDefault();openLanding();});
  auth.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{
    auth.querySelectorAll("[data-mode]").forEach(tab=>tab.classList.toggle("active",tab===button));
  }));
})();
// Public release notes and administrator-published site notice.
(()=>{const modal=document.getElementById('patchNotesModal'),open=document.getElementById('patchNotesOpen'),close=document.getElementById('patchNotesClose');if(open&&modal){open.addEventListener('click',()=>{modal.classList.remove('hide');document.body.classList.add('modalOpen')});const shut=()=>{modal.classList.add('hide');document.body.classList.remove('modalOpen')};close?.addEventListener('click',shut);modal.addEventListener('click',e=>{if(e.target===modal)shut()});document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()})}fetch('/api/site-info').then(r=>r.json()).then(d=>{const b=document.getElementById('announcementBanner');if(b&&(d.announcement||d.maintenance)){b.textContent=(d.maintenance?'🛠 Scheduled maintenance notice. ':'✦ Eduora update: ')+(d.announcement||'Some features may be temporarily unavailable.');b.classList.remove('hide')}}).catch(()=>{})})();


// Language selection is persisted and applied by translate.js after a full reload.
(()=> {
 const saved=localStorage.getItem("eduora-language")||"en";
 ["languageSelect","appLanguageSelect"].forEach(id=>{
  const picker=document.getElementById(id); if(!picker)return;
  picker.value=saved;
  picker.addEventListener("change",()=>{
   localStorage.setItem("eduora-language",picker.value);
   window.location.reload();
  });
 });
})();
