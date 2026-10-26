export function createGame() {
    let memories=[];
    try { memories=JSON.parse(localStorage.getItem('hetuTimelineData')||'[]').filter(item=>item.img).slice(0,6); } catch(error) {}
    if(!memories.length) memories=[1,2,3,4].map((n)=>({img:'assets/Timeline/'+n+'.jpg',title:'Memory '+n}));
    const images=memories.map(item=>{const image=new Image();image.src=item.img;return image;});
    const cards=[...memories.map((item,index)=>({pair:index,image:index})),...memories.map((item,index)=>({pair:index,image:index}))].sort(()=>Math.random()-.5).map(card=>({...card,open:false,matched:false}));
    const state={score:0,moves:0,first:-1,lock:false,hideAt:0,elapsed:0};
    function dimensions(w,h){const cols=4,rows=Math.ceil(cards.length/cols),gap=10,top=48,cardW=(w-gap*(cols+1))/cols,cardH=(h-top-gap*rows)/rows;return{cols,rows,gap,top,cardW,cardH};}
    function reveal(index,finish){
        const card=cards[index];if(!card||card.open||card.matched||state.lock)return;
        card.open=true;
        if(state.first<0){state.first=index;return;}
        state.moves++;const first=cards[state.first];
        if(first.pair===card.pair){first.matched=true;card.matched=true;state.score+=100;}
        else{state.lock=true;state.hideAt=state.elapsed+.8;}
        state.first=-1;
        if(cards.every(item=>item.matched))finish(Math.max(100,cards.length*100-state.moves*10));
    }
    return{
        get score(){return state.score;},
        update(dt,w,h,finish){state.elapsed+=dt;if(state.lock&&state.elapsed>=state.hideAt){cards.forEach(card=>{if(!card.matched)card.open=false;});state.lock=false;}},
        draw(ctx,w,h){
            ctx.fillStyle='#fbf7f1';ctx.fillRect(0,0,w,h);ctx.fillStyle='#533b4b';ctx.font='600 15px system-ui';ctx.fillText('Matches '+cards.filter(card=>card.matched).length+'/'+memories.length+' · Moves '+state.moves,14,22);
            const {cols,gap,top,cardW,cardH}=dimensions(w,h);
            cards.forEach((card,index)=>{
                const x=gap+(index%cols)*(cardW+gap),y=top+Math.floor(index/cols)*(cardH+gap);
                const radius=12;ctx.beginPath();ctx.roundRect(x,y,cardW,cardH,radius);
                ctx.fillStyle=card.matched?'#ead7dd':card.open?'#fff':'#d9c4d0';ctx.fill();
                if(card.open||card.matched){const image=images[card.image];if(image.complete&&image.naturalWidth){ctx.save();ctx.beginPath();ctx.roundRect(x+4,y+4,cardW-8,cardH-8,8);ctx.clip();ctx.drawImage(image,x+4,y+4,cardW-8,cardH-8);ctx.restore();}else{ctx.fillStyle='#6a4a5c';ctx.font='24px system-ui';ctx.textAlign='center';ctx.fillText('♡',x+cardW/2,y+cardH/2);ctx.textAlign='left';}}
                else{ctx.fillStyle='#855e73';ctx.font='28px system-ui';ctx.textAlign='center';ctx.fillText('♡',x+cardW/2,y+cardH/2+10);ctx.textAlign='left';}
            });
        },
        pointer(type,x,y,w,h,finish){if(type!=='pointerdown')return;const{cols,gap,top,cardW,cardH}=dimensions(w,h);const localY=y-top;if(localY<0)return;const col=Math.floor((x-gap)/(cardW+gap)),row=Math.floor(localY/(cardH+gap));if(col<0||col>=cols||row<0)return;const index=row*cols+col;if(index<cards.length)reveal(index,finish);},
        key(){}
    };
}

