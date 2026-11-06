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


// Eduora multilingual interface (landing, authentication, and core study navigation).
(()=> {
 const dictionaries = {
  cs: {
   "Features":"Funkce","Preview":"Náhled","Partners":"Partneři","Sign in":"Přihlásit se","Get started":"Začít",
   "YOUR NEW STUDY SPACE":"TVŮJ NOVÝ STUDIJNÍ PROSTOR","Study smarter.":"Uč se chytřeji.","Feel more ready.":"Buď připravenější.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Klidnější způsob učení. Získej pomoc od AI tutora, procvičuj témata a měj všechny studijní plány na jednom místě.",
   "Start learning":"Začít se učit","Explore the preview":"Prohlédnout náhled","One space for your next big breakthrough.":"Jedno místo pro tvůj další velký pokrok.",
   "LESS STRESS, MORE PROGRESS":"MÉNĚ STRESU, VÍCE POKROKU","Everything you need":"Vše, co potřebuješ","From the first question to the final revision, Eduora brings your study tools together.":"Od první otázky až po závěrečné opakování – Eduora spojuje tvoje studijní nástroje.",
   "A little preview":"Malá ukázka","of your ":"tvého ","study space.":"studijního prostoru.","Open my study space":"Otevřít studijní prostor","✦ Update patch notes":"✦ Poznámky k aktualizaci",
   "A LITTLE ABOUT EDUORA":"NĚCO O EDUORA","Made for students.":"Vytvořeno pro studenty.","Built for better learning.":"Pro lepší učení.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora je webová stránka pro studenty, která spojuje užitečné studijní nástroje na jednom místě. Uč se vlastním tempem s pomocí AI, kvízů, kartiček, poznámek a plánování.",
   "Proudly made in Czechia":"S hrdostí vytvořeno v Česku","Created with students and learning in mind.":"Vytvořeno s ohledem na studenty a učení.",
   "Become a partner ↗":"Staňte se partnerem ↗","Visit our partner website ↗":"Navštívit web partnera ↗","About":"O nás",
   "Welcome to Eduora":"Vítej v Eduora","Your next study session starts here.":"Tvoje další studijní lekce začíná zde.","Create account":"Vytvořit účet","Email address":"E-mailová adresa","Password":"Heslo",
   "Verify email":"Ověřit e-mail","Sign out":"Odhlásit se","Scanner":"Skener","Quiz Arena":"Kvízy","Flashcards":"Kartičky","Notes":"Poznámky","Study Planner":"Studijní plánovač","Send":"Odeslat","New chat":"Nový chat"
  },
  de: {
   "Features":"Funktionen","Preview":"Vorschau","Partners":"Partner","Sign in":"Anmelden","Get started":"Loslegen",
   "YOUR NEW STUDY SPACE":"DEIN NEUER LERNBEREICH","Study smarter.":"Lerne cleverer.","Feel more ready.":"Fühl dich besser vorbereitet.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Lerne entspannter. Erhalte Hilfe von deinem KI-Tutor, übe Themen und behalte alle Lernpläne an einem Ort.",
   "Start learning":"Jetzt lernen","Explore the preview":"Vorschau ansehen","One space for your next big breakthrough.":"Ein Ort für deinen nächsten großen Fortschritt.",
   "LESS STRESS, MORE PROGRESS":"WENIGER STRESS, MEHR FORTSCHRITT","Everything you need":"Alles, was du brauchst","From the first question to the final revision, Eduora brings your study tools together.":"Von der ersten Frage bis zur letzten Wiederholung: Eduora vereint deine Lernwerkzeuge.",
   "A LITTLE ABOUT EDUORA":"ÜBER EDUORA","Made for students.":"Für Schüler und Studierende.","Built for better learning.":"Für besseres Lernen.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora ist eine Website für Lernende und vereint hilfreiche Lernwerkzeuge an einem Ort. Lerne in deinem Tempo mit KI-Lernhilfe, Quizzen, Karteikarten, Notizen und Planungstools.",
   "Proudly made in Czechia":"Mit Stolz in Tschechien entwickelt","Created with students and learning in mind.":"Mit Blick auf Lernende und das Lernen entwickelt.",
   "Become a partner ↗":"Partner werden ↗","Visit our partner website ↗":"Partner-Website besuchen ↗","About":"Über uns",
   "Welcome to Eduora":"Willkommen bei Eduora","Your next study session starts here.":"Deine nächste Lerneinheit beginnt hier.","Create account":"Konto erstellen","Email address":"E-Mail-Adresse","Password":"Passwort",
   "Verify email":"E-Mail bestätigen","Sign out":"Abmelden","Scanner":"Scanner","Quiz Arena":"Quiz-Arena","Flashcards":"Karteikarten","Notes":"Notizen","Study Planner":"Lernplaner","Send":"Senden","New chat":"Neuer Chat"
  },
  ru: {
   "Features":"Возможности","Preview":"Обзор","Partners":"Партнёры","Sign in":"Войти","Get started":"Начать",
   "YOUR NEW STUDY SPACE":"ТВОЁ НОВОЕ ПРОСТРАНСТВО ДЛЯ УЧЁБЫ","Study smarter.":"Учись эффективнее.","Feel more ready.":"Будь увереннее.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Учись спокойнее. Получай помощь ИИ-наставника, практикуй темы и храни все учебные планы в одном месте.",
   "Start learning":"Начать учиться","Explore the preview":"Посмотреть обзор","One space for your next big breakthrough.":"Одно место для больших учебных достижений.",
   "LESS STRESS, MORE PROGRESS":"МЕНЬШЕ СТРЕССА — БОЛЬШЕ ПРОГРЕССА","Everything you need":"Всё необходимое","From the first question to the final revision, Eduora brings your study tools together.":"От первого вопроса до повторения — Eduora объединяет учебные инструменты.",
   "A LITTLE ABOUT EDUORA":"О EDUORA","Made for students.":"Создано для учащихся.","Built for better learning.":"Для эффективного обучения.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora — сайт для учащихся, объединяющий полезные учебные инструменты. Учись в своём темпе с помощью ИИ, викторин, карточек, заметок и планировщика.",
   "Proudly made in Czechia":"С гордостью создано в Чехии","Created with students and learning in mind.":"Создано с заботой об учащихся и обучении.",
   "Become a partner ↗":"Стать партнёром ↗","Visit our partner website ↗":"Перейти на сайт партнёра ↗","About":"О проекте",
   "Welcome to Eduora":"Добро пожаловать в Eduora","Your next study session starts here.":"Твоя следующая учебная сессия начинается здесь.","Create account":"Создать аккаунт","Email address":"Электронная почта","Password":"Пароль",
   "Verify email":"Подтвердить почту","Sign out":"Выйти","Scanner":"Сканер","Quiz Arena":"Викторина","Flashcards":"Карточки","Notes":"Заметки","Study Planner":"Планировщик","Send":"Отправить","New chat":"Новый чат"
  },
  fr: {
   "Features":"Fonctionnalités","Preview":"Aperçu","Partners":"Partenaires","Sign in":"Se connecter","Get started":"Commencer",
   "YOUR NEW STUDY SPACE":"TON NOUVEL ESPACE D’ÉTUDE","Study smarter.":"Apprends plus intelligemment.","Feel more ready.":"Sois mieux préparé.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Apprends plus sereinement. Obtiens l’aide de ton tuteur IA, entraîne-toi et rassemble tes plans d’étude au même endroit.",
   "Start learning":"Commencer à apprendre","Explore the preview":"Voir l’aperçu","One space for your next big breakthrough.":"Un espace pour tes prochains progrès.",
   "LESS STRESS, MORE PROGRESS":"MOINS DE STRESS, PLUS DE PROGRÈS","Everything you need":"Tout ce dont tu as besoin","From the first question to the final revision, Eduora brings your study tools together.":"De la première question aux dernières révisions, Eduora réunit tes outils d’apprentissage.",
   "A LITTLE ABOUT EDUORA":"À PROPOS D’EDUORA","Made for students.":"Conçu pour les élèves.","Built for better learning.":"Pour mieux apprendre.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora est un site pour les élèves qui rassemble des outils d’étude utiles. Apprends à ton rythme avec l’aide de l’IA, des quiz, des cartes mémoire, des notes et un planificateur.",
   "Proudly made in Czechia":"Fièrement créé en Tchéquie","Created with students and learning in mind.":"Créé en pensant aux élèves et à l’apprentissage.",
   "Become a partner ↗":"Devenir partenaire ↗","Visit our partner website ↗":"Visiter le site partenaire ↗","About":"À propos",
   "Welcome to Eduora":"Bienvenue sur Eduora","Your next study session starts here.":"Ta prochaine session d’étude commence ici.","Create account":"Créer un compte","Email address":"Adresse e-mail","Password":"Mot de passe",
   "Verify email":"Vérifier l’e-mail","Sign out":"Se déconnecter","Scanner":"Scanner","Quiz Arena":"Quiz","Flashcards":"Cartes mémoire","Notes":"Notes","Study Planner":"Planificateur","Send":"Envoyer","New chat":"Nouvelle discussion"
  },
  es: {
   "Features":"Funciones","Preview":"Vista previa","Partners":"Socios","Sign in":"Iniciar sesión","Get started":"Empezar",
   "YOUR NEW STUDY SPACE":"TU NUEVO ESPACIO DE ESTUDIO","Study smarter.":"Estudia mejor.","Feel more ready.":"Siéntete más preparado.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Aprende con más tranquilidad. Recibe ayuda de tu tutor de IA, practica temas y reúne todos tus planes de estudio en un solo lugar.",
   "Start learning":"Empezar a aprender","Explore the preview":"Explorar la vista previa","One space for your next big breakthrough.":"Un espacio para tu próximo gran avance.",
   "LESS STRESS, MORE PROGRESS":"MENOS ESTRÉS, MÁS PROGRESO","Everything you need":"Todo lo que necesitas","From the first question to the final revision, Eduora brings your study tools together.":"Desde la primera pregunta hasta el repaso final, Eduora reúne tus herramientas de estudio.",
   "A LITTLE ABOUT EDUORA":"SOBRE EDUORA","Made for students.":"Hecho para estudiantes.","Built for better learning.":"Para aprender mejor.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora es un sitio web para estudiantes que reúne herramientas de estudio útiles en un solo lugar. Aprende a tu ritmo con ayuda de IA, cuestionarios, tarjetas, notas y herramientas de planificación.",
   "Proudly made in Czechia":"Hecho con orgullo en Chequia","Created with students and learning in mind.":"Creado pensando en los estudiantes y el aprendizaje.",
   "Become a partner ↗":"Conviértete en socio ↗","Visit our partner website ↗":"Visitar la web del socio ↗","About":"Acerca de",
   "Welcome to Eduora":"Te damos la bienvenida a Eduora","Your next study session starts here.":"Tu próxima sesión de estudio empieza aquí.","Create account":"Crear cuenta","Email address":"Correo electrónico","Password":"Contraseña",
   "Verify email":"Verificar correo","Sign out":"Cerrar sesión","Scanner":"Escáner","Quiz Arena":"Zona de cuestionarios","Flashcards":"Tarjetas","Notes":"Notas","Study Planner":"Planificador","Send":"Enviar","New chat":"Nuevo chat"
  },
  el: {
   "Features":"Λειτουργίες","Preview":"Προεπισκόπηση","Partners":"Συνεργάτες","Sign in":"Σύνδεση","Get started":"Ξεκίνα",
   "YOUR NEW STUDY SPACE":"Ο ΝΕΟΣ ΣΟΥ ΧΩΡΟΣ ΜΕΛΕΤΗΣ","Study smarter.":"Μάθε πιο έξυπνα.","Feel more ready.":"Νιώσε πιο έτοιμος.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"Μάθε με μεγαλύτερη ηρεμία. Λάβε βοήθεια από τον AI καθηγητή σου, εξασκήσου και οργάνωσε όλα τα σχέδια μελέτης σου σε ένα μέρος.",
   "Start learning":"Ξεκίνα τη μάθηση","Explore the preview":"Δες την προεπισκόπηση","One space for your next big breakthrough.":"Ένας χώρος για την επόμενη μεγάλη πρόοδό σου.",
   "LESS STRESS, MORE PROGRESS":"ΛΙΓΟΤΕΡΟ ΑΓΧΟΣ, ΠΕΡΙΣΣΟΤΕΡΗ ΠΡΟΟΔΟΣ","Everything you need":"Όλα όσα χρειάζεσαι","From the first question to the final revision, Eduora brings your study tools together.":"Από την πρώτη ερώτηση έως την τελική επανάληψη, το Eduora συγκεντρώνει τα εργαλεία μελέτης σου.",
   "A LITTLE ABOUT EDUORA":"ΣΧΕΤΙΚΑ ΜΕ ΤΟ EDUORA","Made for students.":"Φτιαγμένο για μαθητές.","Built for better learning.":"Για καλύτερη μάθηση.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Το Eduora είναι ένας ιστότοπος για μαθητές που συγκεντρώνει χρήσιμα εργαλεία μελέτης σε ένα μέρος. Μάθε με τον δικό σου ρυθμό με βοήθεια AI, κουίζ, κάρτες, σημειώσεις και εργαλεία προγραμματισμού.",
   "Proudly made in Czechia":"Με υπερηφάνεια από την Τσεχία","Created with students and learning in mind.":"Δημιουργήθηκε με γνώμονα τους μαθητές και τη μάθηση.",
   "Become a partner ↗":"Γίνε συνεργάτης ↗","Visit our partner website ↗":"Επισκέψου τον ιστότοπο συνεργάτη ↗","About":"Σχετικά",
   "Welcome to Eduora":"Καλώς ήρθες στο Eduora","Your next study session starts here.":"Η επόμενη συνεδρία μελέτης σου ξεκινά εδώ.","Create account":"Δημιουργία λογαριασμού","Email address":"Διεύθυνση email","Password":"Κωδικός πρόσβασης",
   "Verify email":"Επαλήθευση email","Sign out":"Αποσύνδεση","Scanner":"Σαρωτής","Quiz Arena":"Κουίζ","Flashcards":"Κάρτες μελέτης","Notes":"Σημειώσεις","Study Planner":"Πλάνο μελέτης","Send":"Αποστολή","New chat":"Νέα συνομιλία"
  },
  ar: {
   "Features":"المميزات","Preview":"معاينة","Partners":"الشركاء","Sign in":"تسجيل الدخول","Get started":"ابدأ",
   "YOUR NEW STUDY SPACE":"مساحتك الدراسية الجديدة","Study smarter.":"تعلّم بذكاء أكبر.","Feel more ready.":"كن أكثر استعدادًا.",
   "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":"تعلّم بهدوء أكبر. احصل على مساعدة من مدرس الذكاء الاصطناعي، وتدرّب على المواضيع، واجمع خططك الدراسية في مكان واحد.",
   "Start learning":"ابدأ التعلم","Explore the preview":"استكشف المعاينة","One space for your next big breakthrough.":"مساحة واحدة لإنجازك الكبير القادم.",
   "LESS STRESS, MORE PROGRESS":"ضغط أقل، تقدم أكبر","Everything you need":"كل ما تحتاج إليه","From the first question to the final revision, Eduora brings your study tools together.":"من السؤال الأول إلى المراجعة الأخيرة، يجمع Eduora أدوات دراستك في مكان واحد.",
   "A LITTLE ABOUT EDUORA":"نبذة عن EDUORA","Made for students.":"مصمم للطلاب.","Built for better learning.":"من أجل تعلم أفضل.",
   "Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"Eduora موقع إلكتروني للطلاب يجمع أدوات دراسية مفيدة في مكان واحد. تعلّم بالسرعة التي تناسبك مع مساعدة الذكاء الاصطناعي والاختبارات والبطاقات والملاحظات وأدوات التخطيط.",
   "Proudly made in Czechia":"صُنع بكل فخر في التشيك","Created with students and learning in mind.":"صُمم مع مراعاة الطلاب والتعلم.",
   "Become a partner ↗":"كن شريكًا ↗","Visit our partner website ↗":"زيارة موقع الشريك ↗","About":"من نحن",
   "Welcome to Eduora":"مرحبًا بك في Eduora","Your next study session starts here.":"تبدأ جلستك الدراسية القادمة هنا.","Create account":"إنشاء حساب","Email address":"البريد الإلكتروني","Password":"كلمة المرور",
   "Verify email":"تأكيد البريد الإلكتروني","Sign out":"تسجيل الخروج","Scanner":"الماسح","Quiz Arena":"ساحة الاختبارات","Flashcards":"البطاقات التعليمية","Notes":"الملاحظات","Study Planner":"مخطط الدراسة","Send":"إرسال","New chat":"محادثة جديدة"
  }
 };
 const selectors = {
  "Features":".topNav a[href='#features']","Preview":".topNav a[href='#preview']","Partners":".topNav a[href='#partners']",
  "Sign in":"#headerSignIn","Get started":"#headerGetStarted",
  "YOUR NEW STUDY SPACE":".heroCopy .eyebrow","Study smarter.":".heroCopy h1","Feel more ready.":".heroCopy h1 span",
  "A calmer way to learn. Get help from your AI tutor, turn topics into practice, and keep all your study plans in one place.":".heroLead",
  "Start learning":"#heroGetStarted","Explore the preview":".heroActions a","One space for your next big breakthrough.":".heroMeta>span:last-child",
  "LESS STRESS, MORE PROGRESS":".sectionIntro .eyebrow","Everything you need":".sectionIntro h2","From the first question to the final revision, Eduora brings your study tools together.":".sectionIntro p",
  "A LITTLE ABOUT EDUORA":"#about .eyebrow","Made for students.":"#about h2","Eduora is a website for students, bringing helpful study tools together in one place. Learn at your own pace with AI study help, quizzes, flashcards, notes, and planning tools.":"#about .aboutCopy p",
  "Proudly made in Czechia":"#about .aboutOrigin b","Created with students and learning in mind.":"#about .aboutOrigin small",
  "Become a partner ↗":"#partners .partnersCopy .buttonSecondary","Visit our partner website ↗":".partnerCard span","About":"footer .footerLinks a[href='#about']",
  "Welcome to Eduora":".authPanelHead h2","Your next study session starts here.":".authPanelHead p","Create account":".tabs button[data-mode='register']",
  "Email address":"label[for='email']","Password":"label[for='password']",
  "Verify email":"#verify button.primary","Sign out":"#logout","Scanner":".appNav button[data-page='scan']","Quiz Arena":".appNav button[data-page='quiz']","Flashcards":".appNav button[data-page='cards']","Notes":".appNav button[data-page='notes']","Study Planner":".appNav button[data-page='planner']","Send":"#chatForm button.primary","New chat":"#newchat"
 };
 const original = {};
 function apply(lang){
  const dict=dictionaries[lang]||{};
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  Object.entries(selectors).forEach(([key,selector])=>{
   const el=document.querySelector(selector); if(!el)return;
   if(!(key in original)) original[key]=el.innerHTML;
   if(dict[key]) {
    if(key==="Study smarter."||key==="Everything you need"||key==="Made for students.") {
      const span=el.querySelector("span");
      if(span){el.childNodes[0].textContent=dict[key]+" "; if(key==="Study smarter.") span.textContent=dict["Feel more ready."]||span.textContent;}
      else el.textContent=dict[key];
    } else if(key==="Sign in" && el.id==="headerSignIn") el.textContent=dict[key];
    else if(key==="Get started") el.childNodes[0].textContent=dict[key]+" ";
    else el.textContent=dict[key];
   } else if(lang==="en" && original[key]) el.innerHTML=original[key];
  });
  // Update language-specific labels and placeholders where appropriate.
  document.querySelectorAll("#languageSelect,#appLanguageSelect").forEach(s=>s.value=lang);
  const placeholders={
   cs:{"#prompt":"Zadej studijní otázku...","#scanPrompt":"Volitelné pokyny","#topic":"Téma, např. planety","#cardTopic":"Téma","#noteTitle":"Název","#noteBody":"Tvoje poznámky"},
   de:{"#prompt":"Stelle deine Lernfrage...","#scanPrompt":"Optionale Hinweise","#topic":"Thema, z. B. Planeten","#cardTopic":"Thema","#noteTitle":"Titel","#noteBody":"Deine Notizen"},
   ru:{"#prompt":"Задай учебный вопрос...","#scanPrompt":"Дополнительные инструкции","#topic":"Тема, например планеты","#cardTopic":"Тема","#noteTitle":"Название","#noteBody":"Твои заметки"},
   fr:{"#prompt":"Pose ta question...","#scanPrompt":"Instructions facultatives","#topic":"Sujet, ex. planètes","#cardTopic":"Sujet","#noteTitle":"Titre","#noteBody":"Tes notes"},
   es:{"#prompt":"Escribe tu pregunta...","#scanPrompt":"Instrucciones opcionales","#topic":"Tema, p. ej. planetas","#cardTopic":"Tema","#noteTitle":"Título","#noteBody":"Tus notas"},
   el:{"#prompt":"Κάνε την ερώτησή σου...","#scanPrompt":"Προαιρετικές οδηγίες","#topic":"Θέμα, π.χ. πλανήτες","#cardTopic":"Θέμα","#noteTitle":"Τίτλος","#noteBody":"Οι σημειώσεις σου"},
   ar:{"#prompt":"اكتب سؤالك الدراسي...","#scanPrompt":"تعليمات اختيارية","#topic":"الموضوع، مثل الكواكب","#cardTopic":"الموضوع","#noteTitle":"العنوان","#noteBody":"ملاحظاتك"}
  };
  const p=placeholders[lang]||{};
  Object.entries(p).forEach(([sel,val])=>{const el=document.querySelector(sel);if(el)el.placeholder=val});
 }
 const initial=localStorage.getItem("eduora-language")||"en";
 apply(initial);
 ["languageSelect","appLanguageSelect"].forEach(id=>{
  const s=document.getElementById(id); if(s)s.addEventListener("change",()=>{localStorage.setItem("eduora-language",s.value);apply(s.value)});
 });
})();
