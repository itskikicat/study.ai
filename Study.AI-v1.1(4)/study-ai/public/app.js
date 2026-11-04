const questions = [
  { q: 'Which planet is known as the Red Planet?', a: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 1, why: 'Mars looks reddish because iron minerals in its soil have oxidized, or rusted.' },
  { q: 'What is 8 × 7?', a: ['54', '56', '64', '48'], correct: 1, why: '8 groups of 7 make 56.' },
  { q: 'Which gas do plants absorb from the atmosphere?', a: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correct: 2, why: 'Plants use carbon dioxide during photosynthesis to make sugars.' }
];
const cards = [
  ['What is photosynthesis?', 'The process plants use to turn light, water, and carbon dioxide into sugar and oxygen.'],
  ['What is the capital of the Czech Republic?', 'Prague.'],
  ['What is  the value of π (pi), approximately?', '3.14159']
];
let questionIndex = 0, score = 0, cardIndex = 0, flipped = false;
function modal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function startQuiz() { questionIndex = 0; score = 0; renderQuestion(); }
function renderQuestion() {
  if (questionIndex >= questions.length) { modal(`<div class="eyebrow">QUIZ COMPLETE</div><h2>You scored ${score} / ${questions.length}!</h2><p>${score === questions.length ? 'Perfect score. You nailed it!' : 'Nice effort! Review the explanations and give it another try.'}</p><button class="btn-primary" onclick="startQuiz()">Try again →</button>`); return; }
  const q = questions[questionIndex];
  modal(`<div class="eyebrow">QUESTION ${questionIndex + 1} OF ${questions.length}</div><h2>${q.q}</h2><div class="answer-list">${q.a.map((a,i)=>`<button class="answer-option" onclick="answerQuestion(${i})">${a}</button>`).join('')}</div><p id="feedback" class="feedback"></p>`);
}
function answerQuestion(i) {
  const q = questions[questionIndex]; const buttons = document.querySelectorAll('.answer-option');
  buttons.forEach((b,n)=>{ b.disabled=true; if(n===q.correct)b.classList.add('correct'); else if(n===i)b.classList.add('incorrect'); });
  if(i===q.correct) score++;
  document.getElementById('feedback').innerHTML = `${i===q.correct?'✓ Correct!':'Not quite.'} ${q.why}<br><br><button class="btn-primary" onclick="questionIndex++;renderQuestion()">${questionIndex===questions.length-1?'See results':'Next question'} →</button>`;
}
function showFlashcards() { cardIndex=0; flipped=false; renderCard(); }
function renderCard() { const c=cards[cardIndex]; modal(`<div class="eyebrow">FLASHCARDS · ${cardIndex+1} OF ${cards.length}</div><button class="flashcard-face" onclick="flipCard()"><span>${flipped?'ANSWER':'QUESTION'}</span><h2>${flipped?c[1]:c[0]}</h2><small>Click to flip ↻</small></button><div class="card-controls"><button class="answer-option" onclick="previousCard()">← Previous</button><button class="btn-primary" onclick="nextCard()">Next →</button></div>`); }
function flipCard(){flipped=!flipped;renderCard();} function nextCard(){cardIndex=(cardIndex+1)%cards.length;flipped=false;renderCard();} function previousCard(){cardIndex=(cardIndex-1+cards.length)%cards.length;flipped=false;renderCard();}
function openHelper(){modal(`<div class="eyebrow">STUDY AI HELPER · DEMO</div><h2>What are you learning?</h2><p>Enter a topic and choose a sample explanation.</p><input id="helper-topic" class="helper-input" placeholder="e.g. photosynthesis, fractions, gravity"><button class="btn-primary" onclick="askHelper()">Explain it →</button><div id="helper-answer" class="helper-answer"></div>`);}
function askHelper(){const topic=(document.getElementById('helper-topic').value||'your topic').trim();document.getElementById('helper-answer').innerHTML=`<h3>Let's break down ${topic}.</h3><p>This is a demo helper. A real AI connection hasn't been added yet, but this is where a clear explanation, an example, and a quick memory tip will appear.</p><p><b>Study tip:</b> Try explaining the idea in your own words, then make a flashcard for it.</p>`;}
document.addEventListener('click', e=>{if(e.target.id==='modal')closeModal();});
document.addEventListener('keydown', e=>{if(e.key==='Escape')closeModal();});
