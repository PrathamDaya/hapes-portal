import { createEngine } from './engine.js';
import { createGame as createCatchGame } from './heart-catch.js';
import { createGame as createSlasherGame } from './love-slasher.js';
import { createGame as createMemoryGame } from './memory-match.js';
import { mountDare } from './couple-dare.js';
import { mountQuiz } from './quiz-about-us.js';
const GAME_LABELS={catch:'Catch the Heart',slasher:'Love Slasher',memory:'Memory Match',dare:'Couple’s Dare',quiz:'Quiz About Us'};
const CANVAS_GAMES={catch:createCatchGame,slasher:createSlasherGame,memory:createMemoryGame},GAME_KEYS=Object.keys(GAME_LABELS);
let currentGame='',engine=null,gameInstance=null,isPaused=false,isFinished=false;
let muted=localStorage.getItem('hetuArcadeMuted')==='true',audioContext=null,previousScore=0;
const get=id=>document.getElementById(id);
function playTone(frequency=540){if(muted)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioContext||=new C();if(audioContext.state==='suspended')audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.045,audioContext.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.13);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+.14);}catch(error){}}
function showOverlay(title,copy,action,callback){get('arcadeOverlayTitle').textContent=title;get('arcadeOverlayCopy').textContent=copy||'';const button=get('arcadeOverlayAction');button.textContent=action;button.onclick=callback;get('arcadeOverlay').hidden=false;}
function hideOverlay(){get('arcadeOverlay').hidden=true;}
function cachedScores(){try{const a=JSON.parse(localStorage.getItem('hetuArcadeScores')||'[]');return Array.isArray(a)?a:[];}catch(error){return[];}}
function scoreQueue(){try{const a=JSON.parse(localStorage.getItem('hetuArcadeScoreQueue')||'[]');return Array.isArray(a)?a:[];}catch(error){return[];}}
function saveQueue(a){try{localStorage.setItem('hetuArcadeScoreQueue',JSON.stringify(a));}catch(error){}}
async function postScore(row){const endpoint=window.HETU_SCRIPT_URL;if(!endpoint)throw new Error('Score service is unavailable.');const form=new FormData();form.append('formType','gameScoreEntry');form.append('game','LoveArcade_'+row.game);form.append('score',String(row.score));form.append('player',row.player);const response=await fetch(endpoint,{method:'POST',body:form,mode:'cors'}),result=await response.json();if(!response.ok||result.status!=='success')throw new Error(result.message||'Score could not sync.');}
async function flushScoreQueue(){if(!navigator.onLine)return;const queue=scoreQueue();while(queue.length){try{await postScore(queue[0]);queue.shift();saveQueue(queue);}catch(error){return;}}refreshLeaderboard();}
function recordScore(score){const row={game:currentGame,score:Math.max(0,Math.round(Number(score)||0)),player:window.HETU_CURRENT_USER?.()||'Chikoo',createdAt:new Date().toISOString()};const rows=cachedScores();rows.push(row);try{localStorage.setItem('hetuArcadeScores',JSON.stringify(rows.slice(-250)));}catch(error){}const queue=scoreQueue();queue.push(row);saveQueue(queue);flushScoreQueue();refreshLeaderboard();}
async function gameRows(game){try{const endpoint=window.HETU_SCRIPT_URL;if(!endpoint)return[];const response=await fetch(endpoint+'?action=getLeaderboard&game='+encodeURIComponent('LoveArcade_'+game),{cache:'no-store'}),result=await response.json();return result.status==='success'&&Array.isArray(result.data)?result.data.filter(row=>String(row.game||'').includes('LoveArcade_'+game)):[];}catch(error){return[];}}
function renderScores(groups){
    const active=[...(groups[currentGame]||[]),...cachedScores().filter(row=>row.game===currentGame)],best=new Map();
    for(const row of active){const name=row.player==='Prath'?'Prath':'Chikoo';best.set(name,Math.max(best.get(name)||0,Number(row.score)||0));}
    const container=get('arcadeLeaderboard');container.replaceChildren();
    for(const name of ['Chikoo','Prath']){const row=document.createElement('div');row.className='arcade-board-row';const player=document.createElement('span'),score=document.createElement('strong');player.textContent=name;score.textContent=String(best.get(name)||0);row.append(player,score);container.appendChild(row);}
    let aWins=0,bWins=0,ties=0;
    for(const game of GAME_KEYS){const scores=new Map();for(const row of [...(groups[game]||[]),...cachedScores().filter(item=>item.game===game)]){const name=row.player==='Prath'?'Prath':'Chikoo';scores.set(name,Math.max(scores.get(name)||0,Number(row.score)||0));}const a=scores.get('Chikoo')||0,b=scores.get('Prath')||0;if(a>b)aWins++;else if(b>a)bWins++;else ties++;}
    get('arcadeTally').textContent='Chikoo '+aWins+' · Prath '+bWins+' · Tied '+ties;
}
let boardRequest=0;
async function refreshLeaderboard(){const id=++boardRequest;get('arcadeLeaderboard').innerHTML='<p class="field-hint">Refreshing shared scores…</p>';const pairs=await Promise.all(GAME_KEYS.map(async game=>[game,await gameRows(game)]));if(id===boardRequest)renderScores(Object.fromEntries(pairs));}
function startCanvasGame(){
    if(engine){engine.stop();engine=null;}const factory=CANVAS_GAMES[currentGame];if(!factory)return;
    gameInstance=factory();previousScore=gameInstance.score||0;isPaused=false;isFinished=false;get('arcadePauseButton').hidden=false;
    engine=createEngine(get('arcadeCanvas'),gameInstance,{onFrame(score){if(score>previousScore)playTone(690);previousScore=score;},onGameOver(score){isFinished=true;isPaused=false;playTone(420);recordScore(score);showOverlay('A sweet run','You scored '+Math.round(score)+'. Your score is saved and shared when online.','Play again',startCanvasGame);}});
    hideOverlay();get('arcadeCanvas').focus({preventScroll:true});engine.start();playTone(560);
}
function startPanelGame(){
    isFinished=false;isPaused=false;get('arcadePauseButton').hidden=true;get('arcadePanel').replaceChildren();
    if(currentGame==='dare')mountDare(get('arcadePanel'),score=>{isFinished=true;recordScore(score);showOverlay('A moment together','Your shared deck is keeping score.','Draw another card',startPanelGame);});
    if(currentGame==='quiz')mountQuiz(get('arcadePanel'),score=>{isFinished=true;recordScore(score);showOverlay('That’s your round','The result is saved to your shared scores.','Play another round',startPanelGame);});
    hideOverlay();playTone(560);
}
function startCurrent(){if(CANVAS_GAMES[currentGame])startCanvasGame();else startPanelGame();}
function resumeCurrent(){if(!engine||isFinished)return;isPaused=false;engine.resume();hideOverlay();get('arcadePauseButton').textContent='Pause';}
function pauseCurrent(){if(!engine||isFinished)return;if(!isPaused){isPaused=true;engine.pause();showOverlay('Paused','Take your time. Your game is right where you left it.','Resume',resumeCurrent);get('arcadePauseButton').textContent='Resume';}else resumeCurrent();}
function stopArcadeGame(){if(engine){engine.stop();engine=null;}gameInstance=null;isPaused=false;isFinished=false;const overlay=get('arcadeOverlay');if(overlay)overlay.hidden=true;}
function launchArcade(game){
    if(!GAME_LABELS[game])return;stopArcadeGame();currentGame=game;navigateToApp('arcadePlayScreen');get('arcadeTitle').textContent=GAME_LABELS[game];get('arcadePanel').replaceChildren();
    get('arcadeCanvasShell').hidden=!CANVAS_GAMES[game];get('arcadePanel').hidden=Boolean(CANVAS_GAMES[game]);get('arcadePauseButton').hidden=!CANVAS_GAMES[game];get('arcadePauseButton').textContent='Pause';
    const copy={catch:'Move the basket with your finger or arrow keys. Catch hearts and keep your combo going.',slasher:'Swipe across fruit to score. A bomb costs a heart.',memory:'Flip two cards at a time and find every photo pair.',dare:'Choose a category and intensity, then draw a card you both like.',quiz:'Take turns answering the same five questions, then compare your scores.'};
    showOverlay('Ready for '+GAME_LABELS[game]+'?',copy[game],'Start',startCurrent);refreshLeaderboard();
}
function toggleMute(){muted=!muted;localStorage.setItem('hetuArcadeMuted',String(muted));const button=get('arcadeMuteButton');button.textContent=muted?'Sound off':'Sound on';button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',muted?'Enable sound':'Mute sound');if(!muted)playTone(720);}
get('arcadePauseButton').addEventListener('click',pauseCurrent);get('arcadeMuteButton').addEventListener('click',toggleMute);
get('arcadeMuteButton').textContent=muted?'Sound off':'Sound on';get('arcadeMuteButton').setAttribute('aria-pressed',String(muted));get('arcadeMuteButton').setAttribute('aria-label',muted?'Enable sound':'Mute sound');
window.launchArcade=launchArcade;window.stopArcadeGame=stopArcadeGame;window.addEventListener('online',flushScoreQueue);flushScoreQueue();

