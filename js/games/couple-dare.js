const CATEGORY_RANGES = {
    sweet: new Set([4,5,6,7,8,9,20,23,24,25,26,27,30,33,34]),
    playful: new Set([3,19,20,21,22,25,29,30,31,32,35]),
    spicy: new Set([2,10,11,12,13,14,15,16,17,18,19])
};

export function mountDare(panel, onFinish) {
    const cards=window.HETU_DARE_CARDS||[];
    let saved={}; try{saved=JSON.parse(localStorage.getItem('hetuDareDeckState')||'{}');}catch(error){}
    let used=new Set(saved.used||[]);
    let completed=Number(saved.completed)||0;
    panel.innerHTML='<div class="arcade-choice-row"><label>Category<select id="dareCategory"><option value="all">Anything</option><option value="sweet">Sweet</option><option value="playful">Playful</option><option value="spicy">Spicy</option></select></label><label>Intensity<select id="dareLevel"><option value="1">Gentle</option><option value="2">Playful</option><option value="3">Bold</option></select></label></div><article class="arcade-dare-card"><p class="insight-eyebrow">YOUR SHARED CARD</p><p id="arcadeDareText">Choose a category, then draw a card.</p></article><p class="field-hint">Skip any card or change the intensity whenever you like.</p><div class="arcade-actions"><button class="btn-primary" id="drawDare">Draw a card</button><button class="btn-outline" id="completeDare">We did it</button></div>';
    const draw=panel.querySelector('#drawDare'), text=panel.querySelector('#arcadeDareText');
    draw.onclick=()=>{
        const category=panel.querySelector('#dareCategory').value;
        const level=Number(panel.querySelector('#dareLevel').value);
        const matches=cards.map((value,index)=>({value,index})).filter(item=>(category==='all'||CATEGORY_RANGES[category]?.has(item.index))&&((item.index%3)+1)<=level);
        if(!matches.length){text.textContent='No cards at that intensity in this category. Try another level.';return;}
        let available=matches.filter(item=>!used.has(item.index));
        if(!available.length){used.clear();available=matches;}
        const card=available[Math.floor(Math.random()*available.length)];
        used.add(card.index);localStorage.setItem('hetuDareDeckState',JSON.stringify({used:[...used],completed}));
        text.textContent=card.value;text.classList.remove('arcade-card-in');void text.offsetWidth;text.classList.add('arcade-card-in');
    };
    panel.querySelector('#completeDare').onclick=()=>{
        completed++;localStorage.setItem('hetuDareDeckState',JSON.stringify({used:[...used],completed}));
        onFinish(completed);
    };
}

