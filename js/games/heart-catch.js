export function createGame() {
    const state = { score: 0, combo: 0, lives: 3, basketX: .5, items: [], elapsed: 0, spawn: 0, power: 0, pointerDown: false };
    function reset() { state.score=0; state.combo=0; state.lives=3; state.items=[]; state.elapsed=0; state.spawn=0; state.power=0; }
    return {
        get score(){ return state.score; },
        update(dt,w,h,finish) {
            state.elapsed += dt; state.spawn += dt; state.power=Math.max(0,state.power-dt);
            if(state.spawn>.72){ state.spawn=0; const roll=Math.random(); state.items.push({x:Math.random()*w,y:-28,speed:150+Math.random()*120,kind:roll<.12?'broken':roll<.23?'gold':'heart'}); }
            const bx=state.basketX*w, by=h-44;
            state.items=state.items.filter(item=>{
                item.y+=item.speed*dt;
                if(item.y>by-16&&item.y<by+24&&Math.abs(item.x-bx)<58){
                    if(item.kind==='broken'){ state.lives=Math.max(0,state.lives-1); state.combo=0; }
                    else { state.combo++; state.score+=item.kind==='gold'?25+state.combo*3:10+Math.min(state.combo,10); if(item.kind==='gold') state.power=5; }
                    return false;
                }
                if(item.y>h+24){ if(item.kind!=='broken') state.lives=Math.max(0,state.lives-1); state.combo=0; return false; }
                return true;
            });
            if(state.lives<=0) finish(state.score);
        },
        draw(ctx,w,h) {
            const bg=ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,'#fff8f3'); bg.addColorStop(1,'#f4e1e8'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
            ctx.fillStyle='#533b4b'; ctx.font='600 16px system-ui'; ctx.fillText('Score '+state.score,18,26); ctx.fillText('♥ '.repeat(state.lives),18,50);
            if(state.combo>1){ctx.fillStyle='#a76478';ctx.fillText('Combo ×'+state.combo, w-112,26);}
            for(const item of state.items){ ctx.font='30px system-ui'; ctx.textAlign='center'; ctx.fillText(item.kind==='broken'?'💔':item.kind==='gold'?'💛':'💗',item.x,item.y); }
            ctx.textAlign='center'; ctx.font='38px system-ui'; ctx.fillText('🧺',state.basketX*w,h-20);
            if(state.power>0){ctx.strokeStyle='rgba(167,100,120,.45)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(state.basketX*w,h-26,42,0,Math.PI*2);ctx.stroke();}
        },
        pointer(type,x,y,w) { if(type==='pointerdown'||type==='pointermove') state.basketX=Math.max(.06,Math.min(.94,x/w)); },
        key(key,type) { if(type!=='keydown') return; if(key==='ArrowLeft')state.basketX=Math.max(.06,state.basketX-.06);if(key==='ArrowRight')state.basketX=Math.min(.94,state.basketX+.06); },
        reset
    };
}

