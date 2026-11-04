const questions = [
 {q:"Which planet is known as the Red Planet?",a:["Venus","Mars","Jupiter","Mercury"],correct:1,why:"Mars looks reddish because iron minerals in its soil have oxidized, or rusted."},
 {q:"What is the largest ocean on Earth?",a:["Atlantic","Indian","Arctic","Pacific"],correct:3,why:"The Pacific Ocean is the largest and deepest of Earth's ocean basins."},
 {q:"What process do plants use to make food from sunlight?",a:["Respiration","Photosynthesis","Evaporation","Condensation"],correct:1,why:"Photosynthesis uses light energy to turn water and carbon dioxide into sugars and oxygen."}
];
const cards = [
 {q:"What is photosynthesis?",a:"The process plants use to turn light, water and carbon dioxide into sugars and oxygen."},
 {q:"What is the capital of Czechia?",a:"Prague."},
 {q:"What is a prime number?",a:"A whole number greater than 1 with exactly two factors: 1 and itself."},
 {q:"What force pulls objects toward Earth?",a:"Gravity."}
];
let qi=0,score=0,cardIndex=0,flipped=false;
function openModal(html){document.getElementById('modal-content').innerHTML=html;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function startQuiz(){qi=0;score=0;renderQuestion()}
function renderQuestion(){
 const q=questions[qi];
 if(!q){openModal(`<div class="eyebrow">QUIZ COMPLETE</div><h2>You scored ${score} / ${questions.length}</h2><p>${score===questions.length?'Perfect run!': 'Nice effort. Review the explanations and give it another try.'} Turn the questions you missed into flashcards to help remember them.</p><button class="modal-action" onclick="showFlashcards()">Review flashcards →</button> <button class="modal-action" onclick="startQuiz()">Try again</button>`);return}
 openModal(`<div class="eyebrow">QUIZ ARENA · QUESTION ${qi+1}/${questions.length}</div><h2>${q.q}</h2><div class="answers">${q.a.map((a,i)=>`<button class="answer" onclick="answer(${i},this)">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div><div id="feedback"></div>`)
}
function answer(i,el){
 const q=questions[qi];document.querySelectorAll('.answer').forEach((b,n)=>{b.disabled=true;if(n===q.correct)b.classList.add('correct')});
 if(i===q.correct)score++;else el.classList.add('wrong');
 document.getElementById('feedback').innerHTML=`<div class="response">${i===q.correct?'Correct!':'Not quite.'} ${q.why}</div><p style="margin-top:15px"><button class="modal-action" onclick="qi++;renderQuestion()">${qi===questions.length-1?'See results':'Next question'} →</button></p>`;
}
function showFlashcards(){cardIndex=0;renderCard()}
function renderCard(){flipped=false;const c=cards[cardIndex];openModal(`<div class="eyebrow">FLASHCARDS · ${cardIndex+1}/${cards.length}</div><h2>Make it stick.</h2><div class="flashcard" onclick="flipCard()"><div id="card-text">${c.q}<small>Tap to flip</small></div></div><div style="display:flex;justify-content:space-between"><button class="modal-action" onclick="cardIndex=(cardIndex+cards.length-1)%cards.length;renderCard()">← Previous</button><button class="modal-action" onclick="cardIndex=(cardIndex+1)%cards.length;renderCard()">Next →</button></div>`)}
function flipCard(){const c=cards[cardIndex];flipped=!flipped;document.getElementById('card-text').innerHTML=(flipped?c.a:c.q)+`<small>${flipped?'Answer':'Tap to flip'}</small>`}
function openHelper(){openModal(`<div class="eyebrow">STUDY.AI · STUDY COPILOT</div><h2>What are we learning?</h2><p>Ask for a simple explanation or a memory tip. This starter version uses built-in demo responses.</p><input class="helper-input" id="helper-q" placeholder="e.g. Explain gravity simply"><button class="modal-action" onclick="askHelper()">Ask Study AI →</button><div class="response" id="helper-response">Your explanation will appear here.</div>`)}
function askHelper(){const q=(document.getElementById('helper-q').value||'').trim();if(!q)return;let answer="Try breaking the topic into three parts: what it is, how it works, and one real-world example. Write it in your own words, then test yourself without looking.";if(/gravity/i.test(q))answer="Gravity is the force that pulls objects with mass toward each other. Earth's gravity pulls you toward the ground and helps keep the Moon in orbit. Memory tip: gravity = the pull between things with mass.";else if(/photosynthesis/i.test(q))answer="Photosynthesis is how plants make their own food. They use sunlight to combine water and carbon dioxide into sugar, and release oxygen. Memory tip: light helps plants make food.";document.getElementById('helper-response').textContent=answer}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
