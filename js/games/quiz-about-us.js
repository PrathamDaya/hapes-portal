const QUESTIONS = [
    {q:'What date marks the beginning of our story?',a:'April 21, 2023',choices:['April 21, 2023','June 10, 2023','February 14, 2024']},
    {q:'What is the title of our first Journey chapter?',a:'Where it all began',choices:['Where it all began','Summer Memories','New Year, Together']},
    {q:'When is the Valentine’s Day memory in our timeline?',a:'February 14, 2024',choices:['February 14, 2023','February 14, 2024','April 21, 2024']},
    {q:'What time is shown in the home together counter?',a:'6:00 PM',choices:['6:00 PM','8:00 AM','12:00 PM']},
    {q:'Which two names open our little world?',a:'Chikoo and Prath',choices:['Chikoo and Prath','Hetu and Love','Bunny and Panda']},
    {q:'Which chapter is dated June 10, 2023?',a:'Summer Memories',choices:['Where it all began','Summer Memories','New Year, Together']}
];
export function mountQuiz(panel,onFinish){
    const round=[...QUESTIONS].sort(()=>Math.random()-.5).slice(0,5),players=['Chikoo','Prath'],results={Chikoo:0,Prath:0};
    let playerIndex=0,index=0;
    function render(){
        if(index>=round.length){
            playerIndex++;index=0;
            if(playerIndex>=players.length){
                const combined=results.Chikoo+results.Prath;
                panel.innerHTML='<article class="arcade-dare-card"><p class="insight-eyebrow">YOUR RESULTS</p><p class="arcade-quiz-result">Chikoo '+results.Chikoo+' · Prath '+results.Prath+' / '+round.length+' each</p><p class="field-hint">You answered the same five questions. Compare what you remembered.</p><button class="btn-primary" id="quizDone">Save result</button></article>';
                panel.querySelector('#quizDone').onclick=()=>onFinish(Math.round(combined/(round.length*2)*1000));return;
            }
            promptPlayer();return;
        }
        const player=players[playerIndex],item=round[index];
        panel.innerHTML='<p class="insight-eyebrow">'+player.toUpperCase()+' · QUESTION '+(index+1)+' OF '+round.length+'</p><h3 class="arcade-question">'+item.q+'</h3><div class="arcade-quiz-choices">'+item.choices.map(choice=>'<button type="button" class="btn-outline" data-answer="'+choice.replace(/"/g,'&quot;')+'">'+choice+'</button>').join('')+'</div>';
        panel.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
            if(button.dataset.answer===item.a)results[player]++;
            panel.querySelectorAll('[data-answer]').forEach(choice=>choice.disabled=true);
            button.classList.add(button.dataset.answer===item.a?'correct':'incorrect');
            setTimeout(()=>{index++;render();},350);
        });
    }
    function promptPlayer(){
        panel.innerHTML='<article class="arcade-dare-card"><p class="insight-eyebrow">PASS THE PHONE</p><p class="arcade-quiz-result">'+players[playerIndex]+', your turn.</p><p class="field-hint">The other player can look away while you answer.</p><button class="btn-primary" id="quizBegin">I’m ready</button></article>';
        panel.querySelector('#quizBegin').onclick=render;
    }
    promptPlayer();
}

