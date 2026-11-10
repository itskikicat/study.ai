(()=> {
 const lang=localStorage.getItem("eduora-language")||"en";
 const names={en:"English",cs:"Czech",de:"German",ru:"Russian",el:"Greek",fr:"French",es:"Spanish",ar:"Arabic",he:"Hebrew"};
 const rtl=lang==="ar"||lang==="he";
 document.documentElement.lang=lang;
 document.documentElement.dir=rtl?"rtl":"ltr";
 document.documentElement.classList.toggle("rtl",rtl);
 document.querySelectorAll("#languageSelect,#appLanguageSelect").forEach(s=>s.value=lang);
 if(lang==="en"||!names[lang])return;
 const cacheKey="eduora-ui-translations-v2-"+lang;
 let cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||"{}")}catch{}
 const seen=new WeakSet();let pending=new Map(),running=false;
 const skipTags=new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","CODE","PRE","OPTION"]);
 function collect(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
   const p=n.parentElement;if(!p||skipTags.has(p.tagName)||p.closest("script,style,noscript,textarea,code,pre,[data-no-translate],.brand,.brandMark"))return NodeFilter.FILTER_REJECT;
   const t=n.nodeValue.trim();if(!t||t.length>500||seen.has(n)||/^[\d\s.,:;!?()[\]{}\-–—+/%$€£#@]+$/.test(t))return NodeFilter.FILTER_REJECT;
   return NodeFilter.FILTER_ACCEPT;
  }});
  let n;while((n=walker.nextNode())){seen.add(n);const original=n.nodeValue;const key=original.trim();if(cache[key]){n.nodeValue=original.replace(key,cache[key]);continue}if(!pending.has(key))pending.set(key,[]);pending.get(key).push({node:n,original,key});}
  const attrs=["placeholder","title","aria-label","alt"];
  root.querySelectorAll?.("*").forEach(el=>{if(el.closest("script,style,noscript,[data-no-translate],.brand,.brandMark"))return;for(const attr of attrs){const val=el.getAttribute(attr);if(!val||val.length>300||el.dataset["translated"+attr])continue;const k="@@"+attr+":"+val;if(cache[k]){el.setAttribute(attr,cache[k]);el.dataset["translated"+attr]="1"}else{if(!pending.has(k))pending.set(k,[]);pending.get(k).push({el,attr,original:val,key:k})}}});
 }
 async function flush(){
  if(running||!pending.size)return;running=true;
  try{
   while(pending.size){
    const batch=[...pending.entries()].slice(0,70);batch.forEach(([k])=>pending.delete(k));
    const keys=batch.map(([k])=>k);
    const response=await fetch("/api/translate-ui",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language:lang,strings:keys.map(k=>k.startsWith("@@")?k.slice(k.indexOf(":")+1):k)})});
    if(!response.ok)throw Error("Translation service unavailable");
    const data=await response.json();
    batch.forEach(([key,items],i)=>{
     const translated=String(data.translations[i]||"");if(!translated)return;cache[key]=translated;
     items.forEach(item=>{
      if(item.node?.isConnected)item.node.nodeValue=item.original.replace(item.key,translated);
      if(item.el?.isConnected){item.el.setAttribute(item.attr,translated);item.el.dataset["translated"+item.attr]="1"}
     });
    });
    localStorage.setItem(cacheKey,JSON.stringify(cache));
   }
  }catch(e){console.warn("Eduora translation:",e.message)}
  finally{running=false}
 }
 collect(document.body);flush();
 let timer;const observer=new MutationObserver(records=>{for(const r of records){r.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE)collect(n);else if(n.nodeType===Node.TEXT_NODE&&n.parentElement)collect(n.parentElement)});}clearTimeout(timer);timer=setTimeout(flush,180)});
 observer.observe(document.body,{childList:true,subtree:true});
 // Expose selected language for app requests and generated study content.
 window.eduoraLanguage=lang;
})();
