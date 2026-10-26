export function createGame() {
    const state={score:0,lives:3,items:[],trail:[],elapsed:0,spawn:0,dragging:false};
    function reset(){state.score=0;state.lives=3;state.items=[];state.trail=[];state.elapsed=0;state.spawn=0;state.dragging=false;}
    function hit(item,x,y){return Math.hypot(item.x-x,item.y-y)<item.radius+18;}
    return {
        get score(){return state.score;},
        update(dt,w,h,finish){
            state.elapsed+=dt;state.spawn+=dt;
            if(state.spawn>1.05){state.spawn=0;const bomb=Math.random()<.16;state.items.push({x:80+Math.random()*(w-160),y:h+20,vx:(Math.random()-.5)*130,vy:-480-Math.random()*130,radius:26,bomb,sliced:false});}
            for(const item of state.items){item.x+=item.vx*dt;item.y+=item.vy*dt;item.vy+=720*dt;}
            state.items=state.items.filter(item=>item.y<h+80&&!item.sliced);
            state.trail=state.trail.filter(p=>state.elapsed-p.t<.22);
            if(state.lives<=0)finish(state.score);
        },
        draw(ctx,w,h){
            const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#fff9f3');bg.addColorStop(1,'#f2e2e7');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
            ctx.fillStyle='#533b4b';ctx.font='600 16px system-ui';ctx.fillText('Score '+state.score,18,26);ctx.fillText('♥ '.repeat(state.lives),18,50);
            for(const item of state.items){ctx.font='36px system-ui';ctx.textAlign='center';ctx.fillText(item.bomb?'💣':'🍓',item.x,item.y);}
            if(state.trail.length>1){ctx.beginPath();state.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='rgba(167,100,120,.76)';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
            ctx.textAlign='left';
        },
        pointer(type,x,y){
            if(type==='pointerdown'||type==='pointermove'){
                if(type==='pointerdown')state.dragging=true;
                if(state.dragging){
                    state.trail.push({x,y,t:state.elapsed});
                    for(const item of state.items)if(!item.sliced&&hit(item,x,y)){item.sliced=true;if(item.bomb){state.lives=Math.max(0,state.lives-1);state.score=Math.max(0,state.score-10);}else state.score+=10;}
                }
            }
            if(type==='pointerup'||type==='pointercancel')state.dragging=false;
        },
        key(){},
        reset
    };
}

