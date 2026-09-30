// ═══════════════════════════════════════════════════════════════
//  HAPES PORTAL  ·  script.js v3
//  Fixed: countdown hardcoded to Apr 21 2023 · real audio player
//  Clean journey page · all previous bugs resolved
// ═══════════════════════════════════════════════════════════════

const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// ── State ──────────────────────────────────────────────────────
let currentUser       = 'love';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion    = '';
let calendarCurrentDate = new Date();
let periodCalendarDate  = new Date();
let diaryEntries      = {};
let periodData        = [];
let usedDares         = [];
let selectedMood      = null;
let countdownInterval = null;

// Default anniversary — April 21 2024
const DEFAULT_ANNIVERSARY = '2024-04-21T18:00:00';
const DEFAULT_ANNIVERSARY_LABEL = 'The day everything changed 💕';

// ── Game State ─────────────────────────────────────────────────
const usePhotoAssets = true;
let memMoves=0, memLock=false, memHasFlippedCard=false, memFirstCard, memSecondCard;
let catchGameRunning=false, catchScore=0, catchLoopId;
let slasherGameRunning=false, slasherScore=0, slasherLoopId;
let gameHighScores = { memory: Infinity, catch: 0, slasher: 0, typer: 0 };
let typerDuration  = 30;
let typerRunning   = false;
let typerInterval  = null;
let typerTimeLeft  = 30;
let typerWordList  = [];
let typerCurrent   = 0;
let typerCorrect   = 0;
let typerWrong     = 0;
let typerStartTime = null;
let typerLbFilter  = 'all';
let typerScoreSubmitted = false;

// ── Timeline ───────────────────────────────────────────────────
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData')) || [];
if (timelineData.length === 0) {
    timelineData = [
        { date:'2023-04-21', title:'Where it all began',  img:'assets/Timeline/1.jpg', desc:'The very first day. The start of us.' },
        { date:'2023-02-14', title:"Valentine's Day",     img:'assets/Timeline/2.jpg', desc:'Our first February together, full of roses and warmth.' },
        { date:'2023-06-10', title:'Summer Memories',     img:'assets/Timeline/3.jpg', desc:'Sunlight, laughter, and nowhere else we\'d rather be.' },
        { date:'2023-12-31', title:'New Year, Together',  img:'assets/Timeline/4.jpg', desc:'Counting down to midnight, hand in hand.' },
    ];
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
}

// ── Journey slide state ────────────────────────────────────────
let journeyCurrent = 0;

// ── Music state ────────────────────────────────────────────────
let musicPlayerOpen    = false;
let ytPlayer           = null;    // YouTube IFrame API instance
let ytReady            = false;   // API loaded flag
let musicProgressTimer = null;    // interval for progress bar
let playlistOpen       = false;   // playlist panel visible
let ytPlaylistIds      = [];      // array of video IDs from YT
let ytTitleCache       = {};      // videoId → title cache
let ytCurrentIdx       = 0;       // current playlist index

// ══════════════════════════════════════════════════════════════
//  UTILITY HELPERS
// ══════════════════════════════════════════════════════════════

/** Local date string YYYY-MM-DD (avoids UTC shift bug) */
function localDateStr(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() { return localDateStr(new Date()); }

/** Format mm:ss */
function fmtTime(secs) {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2,'0')}`;
}

/** Escape HTML to prevent XSS */
function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** Relative time: "just now", "3h ago" */
function relTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff/60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h/24);
    if (d < 7)  return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

// fileToTitle removed — YouTube provides song titles via API


// ══════════════════════════════════════════════════════════════
//  ANNIVERSARY COUNTDOWN  (hardcoded default: Apr 21 2023)
// ══════════════════════════════════════════════════════════════

function initCountdown() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('hetuAnniversary')); } catch(e) {}

    let dateStr = saved?.date || DEFAULT_ANNIVERSARY;
    const label = saved?.label || DEFAULT_ANNIVERSARY_LABEL;
    let start = new Date(dateStr);
    if (isNaN(start.getTime())) start = new Date('2024-04-21T18:00:00');

    const sinceEl = document.getElementById('cdSince');
    if (sinceEl) {
        sinceEl.textContent = label
            ? `${label} · ${start.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`
            : `Together since ${start.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
    }

    if (countdownInterval) clearInterval(countdownInterval);

    function tick() {
        let diff = Date.now() - start.getTime();
        if (isNaN(diff)) diff = 0;
        
        if (diff < 0) {
            ['cdDays','cdHours','cdMins','cdSecs'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = id === 'cdDays' ? '0' : '00';
            });
            return;
        }
        const days = Math.floor(diff / 86400000);
        const hrs  = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000)  / 60000);
        const secs = Math.floor((diff % 60000)    / 1000);

        const dEl = document.getElementById('cdDays');
        const hEl = document.getElementById('cdHours');
        const mEl = document.getElementById('cdMins');
        const sEl = document.getElementById('cdSecs');

        if (!dEl) { clearInterval(countdownInterval); return; }
        dEl.textContent = days.toLocaleString();
        hEl.textContent = String(hrs).padStart(2,'0');
        mEl.textContent = String(mins).padStart(2,'0');
        sEl.textContent = String(secs).padStart(2,'0');
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
}

function openAnniversaryModal() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('hetuAnniversary')); } catch(e) {}
    document.getElementById('anniversaryDate').value  = saved?.date  || DEFAULT_ANNIVERSARY;
    document.getElementById('anniversaryLabel').value = saved?.label || DEFAULT_ANNIVERSARY_LABEL;
    document.getElementById('anniversaryModal').style.display = 'flex';
}
function closeAnniversaryModal() { document.getElementById('anniversaryModal').style.display = 'none'; }
function saveAnniversary() {
    const date  = document.getElementById('anniversaryDate').value;
    const label = document.getElementById('anniversaryLabel').value.trim();
    if (!date) { showCustomPopup('Missing date','Please pick a date 💕'); return; }
    localStorage.setItem('hetuAnniversary', JSON.stringify({ date, label }));
    closeAnniversaryModal();
    initCountdown();
    showCustomPopup('Saved! 💖','Anniversary date updated.');
}


// ══════════════════════════════════════════════════════════════
//  LOVE NOTES
// ══════════════════════════════════════════════════════════════

function loadLoveNotes() {
    const panel = document.getElementById('loveNotesPanel');
    const list  = document.getElementById('loveNotesList');
    if (!panel || !list) return;
    panel.style.display = 'block';

    const notes = JSON.parse(localStorage.getItem('hetuLoveNotes') || '[]');
    if (notes.length === 0) {
        list.innerHTML = '<div class="notes-empty">No notes yet — leave your partner a little love note 💕</div>';
        return;
    }

    list.innerHTML = '';
    [...notes].reverse().slice(0,4).forEach((note, revIdx) => {
        const origIdx = notes.length - 1 - revIdx;
        const item = document.createElement('div');
        item.className = 'love-note-item';
        const cls = (note.author||'').toLowerCase();
        item.innerHTML = `
            <div class="note-avatar ${cls}">${note.author==='Prath'?'🐼':'🐰'}</div>
            <div class="note-body">
                <div class="note-text">${esc(note.text)}</div>
                <div class="note-meta sub-font">${esc(note.author||'?')} · ${relTime(note.ts)}</div>
            </div>
            <button class="note-del" onclick="deleteLoveNote(${origIdx})">✕</button>`;
        list.appendChild(item);
    });
}

function openLoveNoteCompose() {
    document.getElementById('loveNoteText').value = '';
    document.getElementById('loveNoteModal').style.display = 'flex';
    setTimeout(()=>document.getElementById('loveNoteText').focus(),100);
}
function closeLoveNoteModal() { document.getElementById('loveNoteModal').style.display = 'none'; }
function saveLoveNote() {
    const text = document.getElementById('loveNoteText').value.trim();
    if (!text) { showCustomPopup('Empty!','Write something first 💕'); return; }
    const notes = JSON.parse(localStorage.getItem('hetuLoveNotes') || '[]');
    const note = { text, author: currentUser, ts: new Date().toISOString() };
    notes.push(note);
    localStorage.setItem('hetuLoveNotes', JSON.stringify(notes));
    closeLoveNoteModal();
    loadLoveNotes();
    releaseButterflies(document.getElementById('loveNotesPanel'));
    showCustomPopup('Sent! 💌','Your love note is waiting for them.');
    // Sync to Google Sheets
    const fd=new FormData();
    fd.append('formType','noteEntry');
    fd.append('text',text);
    fd.append('author',currentUser);
    fd.append('ts',note.ts);
    fetch(scriptURL,{method:'POST',body:fd,mode:'cors'}).catch(()=>{});
}
function deleteLoveNote(index) {
    const notes = JSON.parse(localStorage.getItem('hetuLoveNotes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('hetuLoveNotes', JSON.stringify(notes));
    loadLoveNotes();
}


// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

function login(userName) {
    currentUser = userName;
    localStorage.setItem(SCRIPT_USER_KEY, userName);
    document.getElementById('loginContainer').style.display = 'none';
    const app = document.getElementById('appContainer');
    if (app) app.style.display = 'block';
    updateUserDisplay();
    showMusicPill();
    const sc = localStorage.getItem('hetuApp_highscores');
    if (sc) { try { gameHighScores = JSON.parse(sc); } catch(e){} }
    updateHighScoreDisplays();
    createFloatingEmojis();
    setTimeout(()=>{ initCountdown(); loadLoveNotes(); initCycle(); }, 60);
}

function logout() {
    currentUser = null;
    localStorage.removeItem(SCRIPT_USER_KEY);
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    const player = document.getElementById('musicPlayer');
    const pill   = document.getElementById('musicTogglePill');
    if (player) player.style.display = 'none';
    if (pill)   pill.style.display   = 'none';
    musicPlayerOpen = false;
}

function updateUserDisplay() {
    const avatarEl = document.getElementById('userAvatarEmoji');
    const nameEl   = document.getElementById('loggedInUserDisplay');
    if (avatarEl) avatarEl.textContent = currentUser==='Prath'?'🐼':'🐰';
    if (nameEl)   nameEl.textContent   = currentUser || 'Guest';
    document.querySelectorAll('.dynamicUserName').forEach(el => { el.textContent = currentUser||'love'; });

    const greetEl = document.getElementById('homeGreeting');
    if (greetEl && currentUser) {
        const h = new Date().getHours();
        const t = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
        greetEl.textContent = `${t}, ${currentUser} 💕`;
    }
    const fd = document.getElementById('footerDate');
    if (fd) fd.textContent = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}

function checkLoginStatus() {
    const saved = localStorage.getItem(SCRIPT_USER_KEY);
    if (saved === 'Chikoo' || saved === 'Prath') {
        document.getElementById('loginContainer').style.display = 'none';
        login(saved);
    } else {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }
}


// ══════════════════════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════════════════════

function toggleTheme() {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('themeToggle').textContent = next==='dark'?'☀️':'🌙';
}
function loadTheme() {
    const s = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', s);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = s==='dark'?'☀️':'🌙';
}


// ══════════════════════════════════════════════════════════════
//  BACKGROUND / BUTTERFLIES
// ══════════════════════════════════════════════════════════════

function createFloatingEmojis() {
    const c = document.getElementById('floatingBg');
    c.innerHTML = '';
    const e = ['💖','💕','💗','🐰','🦋','🌸','🌼','✨','🌹','🐇','💝','🫶'];
    for (let i=0;i<18;i++){
        const el = document.createElement('div');
        el.className = 'floating-emoji';
        el.textContent = e[Math.floor(Math.random()*e.length)];
        el.style.left            = Math.random()*100+'%';
        el.style.top             = Math.random()*100+'%';
        el.style.animationDelay  = Math.random()*8+'s';
        el.style.animationDuration = (7+Math.random()*7)+'s';
        el.style.fontSize        = (1.1+Math.random()*.8)+'em';
        c.appendChild(el);
    }
}

function releaseButterflies(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    for (let i=0;i<7;i++){
        const b = document.createElement('div');
        b.className = 'butterfly'; b.textContent = '🦋';
        b.style.setProperty('--tx', (Math.random()-.5)*220+'px');
        b.style.left = r.left+r.width/2+'px';
        b.style.top  = r.top+r.height/2+'px';
        b.style.animation = `butterflyFly 2.2s ease-out forwards ${Math.random()*.4}s`;
        document.body.appendChild(b);
        setTimeout(()=>b.remove(), 3000);
    }
}


// ══════════════════════════════════════════════════════════════
//  CUSTOM POPUP
// ══════════════════════════════════════════════════════════════

function showCustomPopup(title, message, inputPlaceholder=null, callback=null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p=>p.remove());
    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    popup.innerHTML = `<h3>${esc(title)}</h3><p>${esc(message)}</p>`;

    let inputEl = null;
    if (inputPlaceholder) {
        inputEl = document.createElement('textarea');
        inputEl.rows=3; inputEl.placeholder=inputPlaceholder;
        popup.appendChild(inputEl);
    }

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:14px;';

    if (callback) {
        const cancel = document.createElement('button');
        cancel.textContent='Cancel'; cancel.style.background='#ccc'; cancel.style.color='#555';
        cancel.onclick = ()=>{ overlay.remove(); callback(null); };
        const ok = document.createElement('button');
        ok.textContent = inputPlaceholder?'Submit':'OK';
        ok.onclick = ()=>{ overlay.remove(); callback(inputEl?inputEl.value:true); };
        row.appendChild(cancel); row.appendChild(ok);
    } else {
        const ok = document.createElement('button');
        ok.textContent='OK'; ok.onclick=()=>overlay.remove();
        row.appendChild(ok);
    }
    popup.appendChild(row);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    if (inputEl) inputEl.focus();
}


// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════

function navigateToApp(screenId) {
    if (!currentUser && screenId!=='homeScreen') { showCustomPopup('Session expired','Please log in again.'); logout(); return; }
    quitGame(false);
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (!target) { showCustomPopup('Oops','Screen not found.'); return; }
    target.classList.add('active');

    switch (screenId) {
        case 'homeScreen':
            initCountdown(); loadLoveNotes(); break;
        case 'feelingsPortalScreen':
            navigateToFeelingsPage('feelingsPage1'); break;
        case 'diaryScreen':
            fetchDiaryEntries().then(()=>{ renderCalendar(calendarCurrentDate); navigateToDiaryPage('diaryCalendarPage'); }); break;
        case 'dareGameScreen':
            if (usedDares.length>=coupleDares.length) usedDares=[];
            document.getElementById('dareText').textContent='Ready for a dare? Press the button!'; break;
        case 'periodTrackerScreen':
            loadPeriodTracker(); break;
        case 'gameHubScreen':
            updateHighScoreDisplays(); break;
        case 'loveTyperScreen':
            resetTyper(); fetchTyperLeaderboard(); break;
        case 'timelineScreen':
            renderJourney(); break;
    }
    window.scrollTo({top:0, behavior:'smooth'});
}

function quitGame(nav=true) {
    catchGameRunning=false; slasherGameRunning=false; typerRunning=false;
    cancelAnimationFrame(catchLoopId); cancelAnimationFrame(slasherLoopId);
    if(typerInterval){ clearInterval(typerInterval); typerInterval=null; }
    if (nav) navigateToApp('gameHubScreen');
}


// ══════════════════════════════════════════════════════════════
//  FEELINGS PORTAL
// ══════════════════════════════════════════════════════════════

function navigateToFeelingsPage(pageId, emotion='') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(p=>p.classList.remove('active'));
    const t = document.getElementById(pageId);
    if (!t) return; t.classList.add('active');
    if (emotion) currentEmotion=emotion;
    if (pageId==='feelingsPage2' && currentEmotion) {
        const h = document.getElementById('feelingsPage2Title');
        if (h) h.textContent=`You're feeling ${currentEmotion}. What's on your mind, ${currentUser}?`;
    }
}

function submitFeelingsEntry() {
    if (!currentUser) return;
    const msg = document.getElementById('feelingsMessage').value.trim();
    if (!currentEmotion||!msg) { showCustomPopup('Incomplete','Please select how you feel and write your thoughts.'); return; }
    const btn=document.getElementById('submitFeelingsBtn');
    releaseButterflies(btn); btn.disabled=true; btn.textContent='Sending…';
    const fd=new FormData();
    fd.append('formType','feelingsEntry'); fd.append('emotion',currentEmotion);
    fd.append('message',msg); fd.append('submittedBy',currentUser);
    fetch(scriptURL,{method:'POST',body:fd,mode:'cors'})
        .then(r=>r.json()).then(d=>{ if(d.status==='success'){ document.getElementById('feelingsMessage').value=''; navigateToFeelingsPage('feelingsPage3'); } else throw new Error(d.message); })
        .catch(e=>showCustomPopup('Error','Could not submit: '+e.message))
        .finally(()=>{ btn.disabled=false; btn.textContent='Send it 💌'; });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) return;
    const list=document.getElementById('feelingsEntriesList');
    list.innerHTML='<p class="loading-text">Loading entries…</p>';
    try {
        const res=await fetch(`${scriptURL}?action=getFeelingsEntries`,{mode:'cors'});
        const data=await res.json();
        if (data.status==='success' && data.data?.length>0) {
            list.innerHTML='';
            const table=document.createElement('table'); table.className='feelings-table';
            const tr=table.createTHead().insertRow();
            ['Date','By','Feeling','Message','Reply'].forEach(t=>{ const th=document.createElement('th'); th.textContent=t; tr.appendChild(th); });
            const tbody=table.createTBody();
            data.data.forEach(entry=>{
                const row=tbody.insertRow();
                row.innerHTML=`<td>${new Date(entry.timestamp).toLocaleDateString()}</td><td><strong>${esc(entry.submittedBy||'?')}</strong></td><td><span class="emotion-tag ${(entry.emotion||'').toLowerCase()}">${esc(entry.emotion||'N/A')}</span></td><td>${esc(entry.message||'—')}</td><td></td>`;
                const rc=row.cells[4];
                if (entry.repliedBy&&entry.replyMessage) {
                    rc.innerHTML=`<div class="reply-display ${entry.repliedBy.toLowerCase()}-reply"><strong>${esc(entry.repliedBy)}:</strong> ${esc(entry.replyMessage)}<div class="reply-timestamp">${new Date(entry.replyTimestamp).toLocaleDateString()}</div></div>`;
                } else {
                    const rb=document.createElement('button'); rb.textContent='Reply 📮'; rb.className='reply-btn';
                    rb.onclick=()=>showCustomPopup(`Reply to ${entry.submittedBy}`,`"${entry.message}"`, 'Your reply…', txt=>{ if(txt) submitReply('feeling',entry.timestamp,txt,rb); });
                    rc.appendChild(rb);
                }
            });
            list.appendChild(table);
        } else { list.innerHTML='<p class="loading-text">No feelings entries yet 💕</p>'; }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch(e) { list.innerHTML=`<p class="loading-text">Error: ${e.message}</p>`; }
}


// ══════════════════════════════════════════════════════════════
//  DIARY
// ══════════════════════════════════════════════════════════════

function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(p=>p.classList.remove('active'));
    const t=document.getElementById(pageId); if(t) t.classList.add('active');
}

async function fetchDiaryEntries() {
    if (!currentUser) return;
    try {
        const r=await fetch(`${scriptURL}?action=getDiaryEntries`,{mode:'cors'});
        const d=await r.json(); diaryEntries={};
        if(d.status==='success'&&d.data) d.data.forEach(e=>{ diaryEntries[e.date]=e; });
    } catch(e) { console.warn('Diary fetch failed:',e.message); }
}

function renderCalendar(date) {
    const grid=document.getElementById('calendarGrid');
    const my=document.getElementById('currentMonthYear');
    if (!grid||!my) return;
    grid.innerHTML='';
    const m=date.getMonth(), y=date.getFullYear();
    my.textContent=date.toLocaleString('default',{month:'long',year:'numeric'});
    const first=new Date(y,m,1).getDay();
    const dim=new Date(y,m+1,0).getDate();
    const today=todayStr();
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{ const h=document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; grid.appendChild(h); });
    for (let i=0;i<first;i++){ const e=document.createElement('div'); e.className='calendar-day empty'; grid.appendChild(e); }
    for (let day=1;day<=dim;day++){
        const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const cell=document.createElement('div'); cell.className='calendar-day'; cell.textContent=day;
        if (ds===today) cell.classList.add('today');
        if (diaryEntries[ds]) cell.classList.add('has-entry');
        cell.addEventListener('click',()=>{ diaryEntries[ds]?viewDiaryEntry(ds):openDiaryEntry(ds); });
        grid.appendChild(cell);
    }
}

function openDiaryEntry(ds) {
    document.getElementById('selectedDate').value=ds;
    const d=new Date(ds+'T00:00:00');
    document.getElementById('diaryDateDisplay').textContent=d.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('diaryEntryTitle').textContent=d.toLocaleDateString('en-US',{month:'long',day:'numeric'});
    document.getElementById('diaryThoughts').value='';
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(ds) {
    const entry=diaryEntries[ds]; if(!entry) return;
    const d=new Date(ds+'T00:00:00');
    document.getElementById('viewDiaryDateDisplay').textContent=d.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('viewDiaryThoughts').textContent=entry.thoughts||'No thoughts recorded.';
    document.getElementById('diaryEntryAttribution').innerHTML=`<em>Written by ${esc(entry.submittedBy||'Unknown')}</em>`;
    const rs=document.getElementById('diaryViewPageReplySection'); rs.innerHTML='';
    if (entry.repliedBy&&entry.replyMessage) {
        rs.innerHTML=`<div class="reply-display ${entry.repliedBy.toLowerCase()}-reply"><strong>${esc(entry.repliedBy)} replied:</strong> ${esc(entry.replyMessage)}<div class="reply-timestamp">${new Date(entry.replyTimestamp).toLocaleDateString()}</div></div>`;
    } else {
        const rb=document.createElement('button'); rb.textContent='Reply 📮'; rb.className='reply-btn';
        rb.onclick=()=>showCustomPopup('Reply to Diary Entry',`"${entry.thoughts}"`, 'Your reply…', txt=>{ if(txt) submitReply('diary',ds,txt,rb); });
        rs.appendChild(rb);
    }
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    if (!currentUser) return;
    const thoughts=document.getElementById('diaryThoughts').value.trim();
    const date=document.getElementById('selectedDate').value;
    if (!thoughts) { showCustomPopup('Empty!','Please write something first 📓'); return; }
    const btn=document.getElementById('saveDiaryBtn');
    releaseButterflies(btn); btn.disabled=true; btn.textContent='Saving…';
    const fd=new FormData();
    fd.append('formType','diaryEntry'); fd.append('date',date); fd.append('thoughts',thoughts); fd.append('submittedBy',currentUser);
    fetch(scriptURL,{method:'POST',body:fd,mode:'cors'}).then(r=>r.json())
        .then(d=>{ if(d.status==='success') return fetchDiaryEntries().then(()=>{ renderCalendar(calendarCurrentDate); navigateToDiaryPage('diaryConfirmationPage'); }); else throw new Error(d.message); })
        .catch(e=>showCustomPopup('Error','Could not save: '+e.message))
        .finally(()=>{ btn.disabled=false; btn.textContent='Save Entry 💾'; });
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) return;
    const list=document.getElementById('allDiaryEntriesList');
    list.innerHTML='<p class="loading-text">Loading…</p>';
    try {
        const res=await fetch(`${scriptURL}?action=getDiaryEntries`,{mode:'cors'});
        const data=await res.json();
        if(data.status==='success'&&data.data?.length>0){
            list.innerHTML='';
            [...data.data].sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(entry=>{
                const d=new Date(entry.date+'T00:00:00');
                const div=document.createElement('div'); div.className='diary-entry-list-item';
                div.innerHTML=`<h3>${d.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</h3><div class="entry-meta-info">Written by <strong>${esc(entry.submittedBy||'?')}</strong></div><p class="entry-content">${esc(entry.thoughts||'')}</p>`;
                if(entry.repliedBy&&entry.replyMessage){
                    div.innerHTML+=`<div class="reply-display ${entry.repliedBy.toLowerCase()}-reply"><strong>${esc(entry.repliedBy)}:</strong> ${esc(entry.replyMessage)}</div>`;
                } else {
                    const rb=document.createElement('button'); rb.textContent='Reply 📮'; rb.className='reply-btn';
                    rb.onclick=()=>showCustomPopup('Reply to Entry',`"${entry.thoughts}"`, 'Your reply…', txt=>{ if(txt) submitReply('diary',entry.date,txt,rb); });
                    div.appendChild(rb);
                }
                list.appendChild(div);
            });
        } else { list.innerHTML='<p class="loading-text">No diary entries yet. Start writing! 📝</p>'; }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch(e) { list.innerHTML=`<p class="loading-text">Error: ${e.message}</p>`; }
}

async function submitReply(type, id, msg, btn) {
    if (!currentUser||!msg.trim()) return;
    if(btn){btn.disabled=true;btn.textContent='Sending…';}
    const fd=new FormData();
    fd.append('formType','replyEntry'); fd.append('entryType',type); fd.append('entryIdentifier',id);
    fd.append('replyMessage',msg.trim()); fd.append('repliedBy',currentUser);
    try {
        const res=await fetch(scriptURL,{method:'POST',body:fd,mode:'cors'});
        const data=await res.json();
        if(data.status==='success'){
            showCustomPopup('Sent! 📮','Reply delivered.');
            if(type==='feeling') fetchAndDisplayFeelingsEntries();
            else { await fetchDiaryEntries(); renderCalendar(calendarCurrentDate); if(document.getElementById('allDiaryEntriesPage')?.classList.contains('active')) fetchAndDisplayAllDiaryEntries(); }
        } else throw new Error(data.message);
    } catch(e) { showCustomPopup('Error','Could not send: '+e.message); if(btn){btn.disabled=false;btn.textContent='Reply 📮';} }
}


// ══════════════════════════════════════════════════════════════
//  DARE GAME
// ══════════════════════════════════════════════════════════════

const coupleDares = [
    "Give your partner a slow shoulder massage for 5 minutes.",
    "Whisper three things you find most attractive about them into their ear.",
    "Blindfold your partner and tease with light touches for 2 minutes.",
    "Choose a romantic song and share a slow dance.",
    "Write a sweet compliment and have your partner read it aloud.",
    "Feed your partner a strawberry in the most romantic way.",
    "Kiss your partner passionately for 60 seconds.",
    "Take turns tracing words of affection on each other's backs.",
    "Share a secret dream for your future together.",
    "Maintain eye contact silently for 2 full minutes.",
    "Give a lingering kiss on their collarbone.",
    "Cuddle with soft kisses for 5 minutes.",
    "Recreate your very first kiss.",
    "Give your partner a sensual foot massage.",
    "Exchange eskimo and butterfly kisses.",
    "Whisper your partner's name softly while looking into their eyes.",
    "Spend 3 minutes communicating only with gentle touches.",
    "Describe what you love most about your partner in detail.",
    "Almost kiss your partner several times before finally kissing.",
    "Kiss each of their fingertips, very slowly, one by one.",
    "Close your eyes and describe your ideal romantic evening together.",
    "Role-play: one is a famous actor, the other is an adoring fan.",
    "Take a silly selfie, then a romantic one.",
    "Exchange compliments for 5 full minutes.",
    "Write your partner a 3-sentence love note right now.",
    "Hold hands and take turns sharing a favourite memory together.",
    "Name 5 things you're grateful for about your partner.",
    "Stare into each other's eyes silently for 1 full minute.",
    "Give your partner the longest hug you've ever given them.",
    "Tell your partner the exact moment you knew you were falling for them.",
    "Plan a surprise mini-date for some time this week.",
    "Recreate a favourite photo you've taken together.",
    "Read a favourite poem or quote to each other.",
    "Describe your partner in exactly 10 words — make them count.",
    "Hold hands and take turns sharing a favourite memory.",
];

function generateDare() {
    if (!currentUser) return;
    if (usedDares.length>=coupleDares.length) { usedDares=[]; showCustomPopup('All Dares Done! 🎉','Starting over…'); }
    const available=coupleDares.filter(d=>!usedDares.includes(d));
    const dare=available[Math.floor(Math.random()*available.length)];
    usedDares.push(dare);
    const el=document.getElementById('dareText');
    el.style.opacity='0';
    setTimeout(()=>{ el.textContent=dare; el.style.transition='opacity .4s'; el.style.opacity='1'; }, 150);
}


// ══════════════════════════════════════════════════════════════
//  CYCLE TRACKER v2  ·  shared between both phones
//  Data lives in one keyed store; every item carries an "u" (updated-at)
//  timestamp and the newest edit wins on merge. Works offline and syncs
//  when a connection is back. Backend: cycle-sync.gs (see README-SETUP).
// ══════════════════════════════════════════════════════════════

// Sync uses your existing Apps Script (Code.gs v2 adds getCycleDoc + JSON POST).
const CYCLE_SYNC_URL = scriptURL;   // same Apps Script as the rest of the portal

const CY_KEY = 'hetuCycleDoc', CY_PENDING = 'hetuCyPending', CY_POLL_MS = 20000;
const DAY_MS = 86400000;
let cyItems = {}, cySyncing = false, cyResync = false, cyPollId = null, cyReady = false, cyStatus = 'local';
let cySheet = null;

const CY_FLOW  = [['none','—'],['spotting','💧'],['light','🩸'],['medium','🩸🩸'],['heavy','🩸🩸🩸']];
const CY_MOODS = [['Happy','😊'],['Loving','🥰'],['Calm','😌'],['Sad','😔'],['Anxious','😰'],['Irritable','😤'],['Energetic','⚡'],['Tired','😴']];
const CY_SYMS  = ['Cramps','Headache','Bloating','Back pain','Cravings','Tender','Acne','Nausea','Low energy'];
const CY_CARE  = {
    'Cramps':'Heating pad, warm tea, and take over the chores tonight.',
    'Headache':'Dim lights, water, quiet — maybe a slow head massage.',
    'Bloating':'Warm, light food and comfy clothes. No salty snacks.',
    'Back pain':'A warm compress or a slow back rub goes a long way.',
    'Cravings':'Surprise her with her favourite treat 🍫',
    'Tender':'Gentle hugs and soft everything.',
    'Acne':'Remind her she is gorgeous. Zero commentary.',
    'Nausea':'Ginger tea, crackers, and calm company.',
    'Low energy':'Cancel the plans guilt-free — cozy movie night.',
    'Sad':'Listen first, fix later. A hug beats advice.',
    'Anxious':'Slow, calm voice. Ask what would help, not what is wrong.',
    'Irritable':'Give patience and space; do not take it personally.'
};
const WHEEL_PHASES = [
    {id:'m',name:'Period',    emoji:'🌺',cls:'pb-m',her:'Rest is everything right now. Warmth, water and zero guilt about slowing down.',him:'Be extra soft today: warmth, snacks, patience, and no pressure on plans 💕'},
    {id:'f',name:'Follicular',emoji:'🌱',cls:'pb-f',her:'Energy is building. Great time for new plans, creativity and social fun.',him:'Her energy is lifting — plan something fun or new together 🌿'},
    {id:'o',name:'Ovulation', emoji:'✨',cls:'pb-o',her:'Peak energy and confidence. Conversations and connection feel effortless.',him:'Peak-energy days. Date night, deep talks, adventures ✨'},
    {id:'l',name:'Luteal',    emoji:'🌙',cls:'pb-l',her:'Winding down. Heavier days are normal — cozy time and journaling help.',him:'Mood may swing. Cozy nights, patience and small kindnesses matter most 🌙'}
];
const WHEEL_COLORS  = ['#ffb3b3','#a5d6a7','#fff176','#ce93d8'];
const WHEEL_BORDERS = ['#e57373','#66bb6a','#fdd835','#ab47bc'];

// ── date helpers (all local-time, "YYYY-MM-DD" strings) ───────
function pd(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a,b){ return Math.round((a-b)/DAY_MS); }
function fmtShort(d){ return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function partnerName(){ return currentUser==='Prath'?'Chikoo':'Prath'; }

// ── store ─────────────────────────────────────────────────────
function cyLoad(){
    try { cyItems = JSON.parse(localStorage.getItem(CY_KEY)||'{}') || {}; } catch(e){ cyItems = {}; }
    // one-time import of the old localStorage-only data
    if (!localStorage.getItem('hetuCyMigrated')) {
        try {
            const old = JSON.parse(localStorage.getItem('periodData')||'[]');
            old.forEach(e=>{
                if (!e.startDate) return;
                const k='p:'+e.startDate;
                if (!cyItems[k]) cyItems[k]={start:e.startDate,end:(e.endDate&&e.endDate!==e.startDate)?e.endDate:'',by:e.loggedBy||'',u:Date.parse(e.timestamp)||Date.now()};
            });
            const cl = parseInt(localStorage.getItem('periodCycleLength')||'');
            if (cl && !cyItems.cfg) cyItems.cfg={cycleLen:cl,periodLen:5,u:Date.now()};
            if (old.length) localStorage.setItem(CY_PENDING,'1');
        } catch(e){}
        localStorage.setItem('hetuCyMigrated','1');
        cySave();
    }
}
function cySave(){ try{ localStorage.setItem(CY_KEY,JSON.stringify(cyItems)); }catch(e){} }
function cySet(key,val){ cyItems[key]={...val,u:Date.now()}; cySave(); localStorage.setItem(CY_PENDING,'1'); cyRender(); cySync(); }
function cyDel(key){ cyItems[key]={del:true,u:Date.now()}; cySave(); localStorage.setItem(CY_PENDING,'1'); cyRender(); cySync(); }
function cyMerge(a,b){ const o={...a}; for (const k in b) if (!o[k]||(b[k].u||0)>(o[k].u||0)) o[k]=b[k]; return o; }
function cyLive(prefix){ return Object.keys(cyItems).filter(k=>k.startsWith(prefix)&&!cyItems[k].del).map(k=>cyItems[k]); }
function cyCfg(){ const c=cyItems.cfg||{}; return {cycleLen:c.cycleLen||28, periodLen:c.periodLen||5}; }

// ── sync ──────────────────────────────────────────────────────
function cySetStatus(s){
    cyStatus=s;
    const el=document.getElementById('cySyncPill'); if(!el) return;
    const map={local:['📱 This phone only','warn'],syncing:['⟳ Syncing…','busy'],ok:['✓ Synced with '+partnerName(),'ok'],offline:['⚠ Offline — will sync','warn']};
    el.textContent=map[s][0]; el.className='sync-pill '+map[s][1];
}
async function cySync(manual){
    if (!CYCLE_SYNC_URL) { cySetStatus('local'); if(manual===true) showCustomPopup('Set up sync 🔗','Update your Apps Script with the new Code.gs and redeploy it (Deploy → Manage deployments → New version). Steps are in README-SETUP.md.'); return; }
    if (cySyncing) { cyResync=true; return; }
    cySyncing=true; cySetStatus('syncing');
    try {
        const pending = localStorage.getItem(CY_PENDING)==='1';
        const res = pending
            ? await fetch(CYCLE_SYNC_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({items:cyItems})})
            : await fetch(CYCLE_SYNC_URL+'?action=getCycleDoc&t='+Date.now());
        const j = await res.json();
        if (!j || j.status==='error' || !j.items) throw new Error('bad response');
        const before = JSON.stringify(cyItems);
        cyItems = cyMerge(cyItems,j.items);
        if (pending && !cyResync) localStorage.removeItem(CY_PENDING);
        cySave(); cySetStatus('ok');
        if (before!==JSON.stringify(cyItems)) cyRender();
    } catch(e) { cySetStatus('offline'); }
    finally { cySyncing=false; if (cyResync) { cyResync=false; cySync(); } }
}
function initCycle(){
    if (cyReady) return; cyReady=true;
    cyLoad(); cySetStatus(CYCLE_SYNC_URL?'syncing':'local'); cyRender(); cySync();
    cyPollId=setInterval(()=>{ if(document.visibilityState==='visible') cySync(); },CY_POLL_MS);
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') cySync(); });
    window.addEventListener('online',()=>cySync());
    const grid=document.getElementById('periodCalendarGrid');
    if (grid) grid.addEventListener('click',e=>{ const c=e.target.closest('[data-ds]'); if(c) openDaySheet(c.dataset.ds); });
    const sheet=document.getElementById('daySheet');
    if (sheet) sheet.addEventListener('click',e=>{ if(e.target===sheet) closeDaySheet(); });
}

// ── analysis ──────────────────────────────────────────────────
function cyPeriods(){ return cyLive('p:').sort((a,b)=>a.start<b.start?-1:1); }
function cyStats(){
    const ps=cyPeriods(), cfg=cyCfg(), gaps=[];
    for (let i=1;i<ps.length;i++){ const g=diffDays(pd(ps[i].start),pd(ps[i-1].start)); if(g>=15&&g<=60) gaps.push(g); }
    const recent=gaps.slice(-6); let cycle=cfg.cycleLen, sd=0;
    if (recent.length>=2){
        let w=0,s=0; recent.forEach((g,i)=>{ w+=i+1; s+=g*(i+1); }); cycle=Math.round(s/w);
        const mean=recent.reduce((a,b)=>a+b,0)/recent.length;
        sd=Math.sqrt(recent.reduce((a,b)=>a+(b-mean)**2,0)/recent.length);
    } else if (recent.length===1) cycle=Math.round((recent[0]+cfg.cycleLen)/2);
    const durs=ps.filter(p=>p.end).map(p=>diffDays(pd(p.end),pd(p.start))+1).filter(n=>n>=1&&n<=12);
    const plen=durs.length?Math.round(durs.reduce((a,b)=>a+b,0)/durs.length):cfg.periodLen;
    return {ps,cycle,sd,plen,durs,gaps,last:ps[ps.length-1]||null};
}
function cyBounds(cycle,plen){ const ov=Math.max(plen+3,cycle-14); return {ov,b:[plen,ov-1,ov,cycle]}; }
function cyPhaseIdx(day,st){ const {b}=cyBounds(st.cycle,st.plen); return day<=b[0]?0:day<=b[1]?1:day<=b[2]?2:3; }
function cyPeriodDays(st){
    const set=new Set();
    st.ps.forEach(p=>{ const s=pd(p.start), e=p.end?pd(p.end):addDays(s,st.plen-1); for(let d=new Date(s); d<=e; d=addDays(d,1)) set.add(localDateStr(d)); });
    return set;
}
function cyToday(){ const t=new Date(); t.setHours(0,0,0,0); return t; }
function cyState(){
    const st=cyStats(); if(!st.last) return {st,empty:true};
    const today=cyToday(), lastStart=pd(st.last.start);
    const day=diffDays(today,lastStart)+1;
    const ongoing = day>=1 && !st.last.end ? day<=st.plen+2 : (st.last.end?today<=pd(st.last.end):false);
    const next=addDays(lastStart,st.cycle), dUntil=diffDays(next,today);
    return {st,day,ongoing,next,dUntil,phase:ongoing?0:cyPhaseIdx(Math.min(day,st.cycle),st),late:dUntil<0&&!ongoing};
}

// ── actions ───────────────────────────────────────────────────
function cyStartPeriod(ds){ cySet('p:'+ds,{start:ds,end:'',by:currentUser}); }
function cyEndPeriod(ds){
    const ps=cyPeriods().filter(p=>p.start<=ds); const p=ps[ps.length-1];
    if (!p) { showCustomPopup('No start yet','Log when the period started first 🌸'); return false; }
    cySet('p:'+p.start,{...p,end:ds,by:p.by||currentUser}); return true;
}
function cyQuickAction(){
    const s=cyState(), t=todayStr();
    if (!s.empty && s.ongoing) { cyEndPeriod(t); showCustomPopup('Period ended ✅','Take it easy and stay hydrated 💧'); }
    else { cyStartPeriod(t); showCustomPopup('Logged 🌺','Period start saved'+(CYCLE_SYNC_URL?' and shared with '+partnerName()+'.':'.')); }
}
function cyAddManual(){
    const v=document.getElementById('cyFirstDate').value;
    if (!v) { showCustomPopup('Pick a date','Choose the first day of a period.'); return; }
    cyStartPeriod(v); document.getElementById('cyFirstDate').value='';
}
function cySaveCfg(){
    const c=parseInt(document.getElementById('cycleLengthInput').value), p=parseInt(document.getElementById('periodLengthInput').value);
    cySet('cfg',{cycleLen:Math.min(45,Math.max(20,c||28)),periodLen:Math.min(10,Math.max(2,p||5))});
}
function changePeriodMonth(dir){ periodCalendarDate.setDate(1); periodCalendarDate.setMonth(periodCalendarDate.getMonth()+dir); renderPeriodCalendar(true); }
function deleteLogEntry(start){
    showCustomPopup('Delete this period?','It will be removed on both phones.',null,ok=>{ if(ok) cyDel('p:'+start); });
}

// ── day sheet ─────────────────────────────────────────────────
function openDaySheet(ds){
    const ex=cyItems['d:'+ds]; const d=(ex&&!ex.del)?ex:{};
    cySheet={ds,flow:d.flow||'none',mood:d.mood||'',sym:new Set(d.sym||[])};
    document.getElementById('daySheetTitle').textContent=pd(ds).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    document.getElementById('daySheetNote').value=d.note||'';
    const chip=(cls,val,label,on)=>`<button type="button" class="cy-chip ${on?'on':''}" data-${cls}="${val}">${label}</button>`;
    document.getElementById('dsFlow').innerHTML=CY_FLOW.map(([v,l])=>chip('flow',v,v==='none'?'None':l+' '+v,cySheet.flow===v)).join('');
    document.getElementById('dsMood').innerHTML=CY_MOODS.map(([v,e])=>chip('mood',v,e+' '+v,cySheet.mood===v)).join('');
    document.getElementById('dsSym').innerHTML=CY_SYMS.map(v=>chip('sym',v,v,cySheet.sym.has(v))).join('');
    const isStart=!!(cyItems['p:'+ds]&&!cyItems['p:'+ds].del);
    document.getElementById('dsStartBtn').textContent=isStart?'🗑️ Remove period start':'🌺 Period started this day';
    document.getElementById('dsStartBtn').dataset.remove=isStart?'1':'';
    document.getElementById('daySheet').style.display='flex';
}
function closeDaySheet(){ document.getElementById('daySheet').style.display='none'; cySheet=null; }
function daySheetChip(e){
    const b=e.target.closest('.cy-chip'); if(!b||!cySheet) return;
    if (b.dataset.flow!==undefined){ cySheet.flow=b.dataset.flow; document.querySelectorAll('#dsFlow .cy-chip').forEach(x=>x.classList.toggle('on',x===b)); }
    else if (b.dataset.mood!==undefined){ cySheet.mood=(cySheet.mood===b.dataset.mood)?'':b.dataset.mood; document.querySelectorAll('#dsMood .cy-chip').forEach(x=>x.classList.toggle('on',x.dataset.mood===cySheet.mood)); }
    else if (b.dataset.sym!==undefined){ const v=b.dataset.sym; cySheet.sym.has(v)?cySheet.sym.delete(v):cySheet.sym.add(v); b.classList.toggle('on'); }
}
function saveDaySheet(){
    if(!cySheet) return; const {ds}=cySheet, note=document.getElementById('daySheetNote').value.trim();
    const empty=cySheet.flow==='none'&&!cySheet.mood&&!cySheet.sym.size&&!note;
    if (empty) { if(cyItems['d:'+ds]&&!cyItems['d:'+ds].del) cyDel('d:'+ds); }
    else cySet('d:'+ds,{flow:cySheet.flow,mood:cySheet.mood,sym:[...cySheet.sym],note,by:currentUser});
    closeDaySheet();
}
function daySheetPeriod(kind){
    if(!cySheet) return; const {ds}=cySheet;
    if (kind==='start'){ const btn=document.getElementById('dsStartBtn'); btn.dataset.remove?cyDel('p:'+ds):cyStartPeriod(ds); closeDaySheet(); }
    else if (cyEndPeriod(ds)) closeDaySheet();
}

// ── rendering ─────────────────────────────────────────────────
function loadPeriodTracker(){ initCycle(); const c=cyCfg(); document.getElementById('cycleLengthInput').value=c.cycleLen; document.getElementById('periodLengthInput').value=c.periodLen; cyRender(); cySync(); }
function cyRender(){
    renderCheckin();
    const scr=document.getElementById('periodTrackerScreen'); if(!scr||!scr.classList.contains('active')) return;
    renderCycleHero(); renderPeriodCalendar(); renderPeriodHistory();
}
function renderCycleHero(){
    const s=cyState(), q=document.getElementById('cyQuickBtn'), hl=document.getElementById('cyHeadline'), sl=document.getElementById('cySubline'), care=document.getElementById('cyCare');
    buildPhaseBadges();
    if (s.empty){
        hl.textContent='Let\u2019s start tracking 🌸'; sl.textContent='Log the first day of the last period and predictions appear automatically.';
        q.textContent='🌺 Period started today'; drawCycleWheel(null); care.style.display='none';
        document.getElementById('periodStatStrip').style.display='none'; return;
    }
    const {st}=s; const range=st.sd>=1.5?` (±${Math.round(st.sd)}d)`:'';
    if (s.ongoing){ hl.textContent=`Period · Day ${s.day}`; sl.textContent=`Usually lasts about ${st.plen} days · next around ${fmtShort(s.next)}${range}`; q.textContent='✅ Period ended today'; }
    else if (s.late){ hl.textContent=`${-s.dUntil} day${s.dUntil===-1?'':'s'} late`; sl.textContent=`Expected ${fmtShort(s.next)} · stress, travel or sleep can shift it`; q.textContent='🌺 Period started today'; }
    else if (s.dUntil===0){ hl.textContent='Expected today'; sl.textContent='Keep essentials handy 💕'; q.textContent='🌺 Period started today'; }
    else { hl.textContent=`Period in ${s.dUntil} day${s.dUntil===1?'':'s'}`; sl.textContent=`Around ${fmtShort(s.next)}${range} · Day ${s.day} of ${st.cycle}`; q.textContent='🌺 Period started today'; }
    drawCycleWheel(s);
    // care card
    const ph=WHEEL_PHASES[s.phase], him=currentUser==='Prath', t=todayStr();
    const dl=cyItems['d:'+t]&&!cyItems['d:'+t].del?cyItems['d:'+t]:null;
    const hers=dl&&dl.by!=='Prath'?dl:null;
    let extra='';
    if (him){
        const keys=hers?[...(hers.sym||[]),hers.mood].filter(k=>k&&CY_CARE[k]):[];
        extra=hers?`<div class="cy-care-log">Chikoo logged today: ${[hers.mood,...(hers.sym||[])].filter(Boolean).join(', ')||'a note'}</div>`+keys.slice(0,3).map(k=>`<div class="cy-care-tip">💝 <b>${esc(k)}:</b> ${esc(CY_CARE[k])}</div>`).join(''):'<div class="cy-care-log">She hasn\u2019t logged today yet.</div>';
    } else extra=`<div class="cy-care-log">${partnerName()} can see what you log, so he knows how to look after you 💕</div>`;
    care.style.display='block';
    care.innerHTML=`<h3 class="panel-title">${ph.emoji} ${ph.name} phase — ${him?'how to be there for her':'take care of you'}</h3><div class="cy-care-main">${esc(him?ph.him:ph.her)}</div>${extra}`;
    // stats
    const strip=document.getElementById('periodStatStrip'); strip.style.display='grid';
    document.getElementById('statAvgCycle').textContent=st.cycle+'d';
    document.getElementById('statAvgDuration').textContent=st.plen+'d';
    document.getElementById('statTotalLogs').textContent=st.ps.length;
    document.getElementById('statRegular').textContent=st.gaps.length<2?'—':st.sd<=2?'Steady':st.sd<=4?'Mild swing':'Variable';
}
function renderPeriodCalendar(animate){
    const grid=document.getElementById('periodCalendarGrid'), my=document.getElementById('periodMonthYear'); if(!grid||!my) return;
    const m=periodCalendarDate.getMonth(), y=periodCalendarDate.getFullYear();
    my.textContent=periodCalendarDate.toLocaleString('default',{month:'long',year:'numeric'});
    const st=cyStats(), logged=cyPeriodDays(st), today=todayStr();
    const pred=new Set(), fert=new Set(), ovs=new Set();
    if (st.last){
        const ls=pd(st.last.start), {ov}=cyBounds(st.cycle,st.plen);
        for (let k=0;k<=3;k++){
            const cs=addDays(ls,st.cycle*k);
            if (k>0) for(let i=0;i<st.plen;i++) pred.add(localDateStr(addDays(cs,i)));
            const od=addDays(cs,ov-1); ovs.add(localDateStr(od));
            for(let i=-5;i<=1;i++) fert.add(localDateStr(addDays(od,i)));
        }
    }
    const first=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
    let h=['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div class="calendar-day-header">${d}</div>`).join('');
    for(let i=0;i<first;i++) h+='<div class="calendar-day empty"></div>';
    for(let d=1;d<=dim;d++){
        const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const c=['calendar-day'];
        if (logged.has(ds)) c.push('period-day');
        else if (pred.has(ds)) c.push('predicted-period');
        else if (ovs.has(ds)) c.push('ovulation-day');
        else if (fert.has(ds)) c.push('fertile-day');
        if (cyItems['d:'+ds]&&!cyItems['d:'+ds].del) c.push('has-log');
        if (ds===today) c.push('today');
        h+=`<div class="${c.join(' ')}" data-ds="${ds}">${d}</div>`;
    }
    grid.innerHTML=h;
    if (animate){ grid.classList.remove('cal-swap'); void grid.offsetWidth; grid.classList.add('cal-swap'); }
}
function renderPeriodHistory(){
    const list=document.getElementById('periodHistoryList'), panel=document.getElementById('periodHistoryPanel'); if(!list) return;
    const ps=cyPeriods(); if(!ps.length){ panel.style.display='none'; return; }
    panel.style.display='block';
    list.innerHTML=[...ps].reverse().slice(0,8).map((p,i,arr)=>{
        const s=pd(p.start), e=p.end?pd(p.end):null;
        const label=e&&p.end!==p.start?`${fmtShort(s)} – ${fmtShort(e)}`:fmtShort(s);
        const prev=ps[ps.length-2-i];
        const cyc=prev?diffDays(s,pd(prev.start)):null;
        const meta=[e?`${diffDays(e,s)+1} days`:'ongoing',cyc&&cyc<=60?`${cyc}-day cycle`:''].filter(Boolean).join(' · ');
        return `<div class="period-log-item"><div class="log-dot"></div><div class="log-info"><div class="log-dates">${label}, ${s.getFullYear()}</div><div class="log-mood">${meta}</div><div class="log-user">Logged by ${esc(p.by||'?')}</div></div><button class="delete-log-btn" aria-label="Delete" onclick="deleteLogEntry('${p.start}')">🗑️</button></div>`;
    }).join('');
}

// ── cycle wheel ───────────────────────────────────────────────
function buildPhaseBadges(){
    const c=document.getElementById('phaseBadges'); if(!c||c.childElementCount) return;
    WHEEL_PHASES.forEach(p=>{ const b=document.createElement('div'); b.className='phase-badge '+p.cls; b.id='pb-'+p.id; b.innerHTML=`<span class="pb-emoji">${p.emoji}</span><span class="pb-name">${p.name}</span><span class="pb-days"></span>`; c.appendChild(b); });
}
function drawCycleWheel(s){
    const canvas=document.getElementById('cycleWheelCanvas'); if(!canvas) return;
    const dpr=window.devicePixelRatio||1, W=220; canvas.width=W*dpr; canvas.height=W*dpr; canvas.style.width=W+'px'; canvas.style.height=W+'px';
    const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,W);
    const st=(s&&s.st)||{cycle:cyCfg().cycleLen,plen:cyCfg().periodLen}, total=st.cycle, {b}=cyBounds(total,st.plen);
    const cx=W/2, R=W/2-16, rIn=R*.58, day=s&&!s.empty?Math.min(Math.max(s.day,1),total):null;
    const active=s&&!s.empty?s.phase:-1; let angle=-Math.PI/2;
    WHEEL_PHASES.forEach((ph,i)=>{
        const segDays=b[i]-(i===0?0:b[i-1]), seg=(segDays/total)*Math.PI*2, isA=i===active;
        const oR=isA?R+6:R, iR=isA?rIn-4:rIn;
        ctx.beginPath(); ctx.arc(cx,cx,oR,angle,angle+seg-.04); ctx.arc(cx,cx,iR,angle+seg-.04,angle,true); ctx.closePath();
        ctx.globalAlpha=(active<0||isA)?1:.55; ctx.fillStyle=WHEEL_COLORS[i]; ctx.fill(); ctx.globalAlpha=1;
        ctx.strokeStyle=isA?WHEEL_BORDERS[i]:'rgba(255,255,255,.6)'; ctx.lineWidth=isA?2.5:1.5; ctx.stroke();
        const mid=angle+seg/2, er=(oR+iR)/2; ctx.font=`${isA?19:15}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ph.emoji,cx+Math.cos(mid)*er,cx+Math.sin(mid)*er);
        const start=i===0?1:b[i-1]+1, badge=document.getElementById('pb-'+ph.id);
        if (badge){ badge.querySelector('.pb-days').textContent=start===b[i]?`Day ${start}`:`Days ${start}–${b[i]}`; badge.classList.toggle('active',isA); }
        angle+=seg;
    });
    const dark=document.documentElement.getAttribute('data-theme')==='dark';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if (day){
        const mA=-Math.PI/2+((day-.5)/total)*Math.PI*2, mr=(R+rIn)/2, mx=cx+Math.cos(mA)*mr, my=cx+Math.sin(mA)*mr;
        ctx.beginPath(); ctx.arc(mx,my,10,0,Math.PI*2); ctx.fillStyle='#e2447a'; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#e2447a'; ctx.font='26px Parisienne, cursive'; ctx.fillText('Day '+day,cx,cx-8);
        ctx.fillStyle=dark?'#c58ea0':'#9c6b7e'; ctx.font='11px Raleway, sans-serif'; ctx.fillText('of '+total,cx,cx+14);
    } else { ctx.fillStyle='#e2447a'; ctx.font='30px Arial'; ctx.fillText('🌸',cx,cx); }
}

// ── home: daily check-in + cycle heads-up ─────────────────────
const CI_MOODS=[['Happy','😊'],['Loving','🥰'],['Calm','😌'],['Sad','🥺'],['Angry','😤'],['Tired','😴']];
function ciStreak(){
    let n=0, d=cyToday();
    if (!cyItems['c:'+localDateStr(d)+':'+currentUser]||cyItems['c:'+localDateStr(d)+':'+currentUser].del) d=addDays(d,-1);
    for(;;d=addDays(d,-1)){ const it=cyItems['c:'+localDateStr(d)+':'+currentUser]; if(it&&!it.del) n++; else break; }
    return n;
}
function checkinMood(mood){
    const k='c:'+todayStr()+':'+currentUser; const cur=cyItems[k];
    cySet(k,{mood}); const el=document.getElementById('ciMoods'); if(el){ el.classList.remove('ci-pop'); void el.offsetWidth; el.classList.add('ci-pop'); }
}
function renderCheckin(){
    const card=document.getElementById('checkinCard'), moods=document.getElementById('ciMoods'); if(!card||!moods||!currentUser) return;
    const mine=cyItems['c:'+todayStr()+':'+currentUser], mineMood=mine&&!mine.del?mine.mood:'';
    moods.innerHTML=CI_MOODS.map(([m,e])=>`<button class="ci-mood ${mineMood===m?'on':''}" onclick="checkinMood('${m}')" aria-label="${m}"><span>${e}</span><small>${m}</small></button>`).join('');
    const pv=cyItems['c:'+todayStr()+':'+partnerName()], pm=pv&&!pv.del?CI_MOODS.find(x=>x[0]===pv.mood):null;
    document.getElementById('ciPartner').textContent=pm?`${partnerName()} is feeling ${pm[1]} ${pm[0].toLowerCase()} today`:`${partnerName()} hasn\u2019t checked in yet`;
    const n=ciStreak(), sEl=document.getElementById('ciStreak'); sEl.textContent=n>0?`🔥 ${n}-day streak`:''; sEl.style.display=n>0?'block':'none';
    const note=document.getElementById('homeCycleNote'), s=cyState(); let msg='';
    if (!s.empty){
        const him=currentUser==='Prath';
        if (s.ongoing) msg=him?'🌺 Chikoo is on her period — extra cuddles and patience today.':'🌺 Period day '+s.day+' — be gentle with yourself today.';
        else if (s.dUntil>=0&&s.dUntil<=3) msg=him?`🌸 Her period is likely in ${s.dUntil||'0'} day(s) — stock her favourite snacks.`:`🌸 Period expected ${s.dUntil===0?'today':'in '+s.dUntil+' day(s)'}.`;
    }
    note.textContent=msg; note.style.display=msg?'block':'none';
}


// ══════════════════════════════════════════════════════════════
//  OUR JOURNEY  — clean scroll-story
// ══════════════════════════════════════════════════════════════

const BG_GRADS=[
    'radial-gradient(ellipse at 25% 45%, #3d1025 0%, #0a0408 68%)',
    'radial-gradient(ellipse at 75% 40%, #0d2510 0%, #0a0408 68%)',
    'radial-gradient(ellipse at 50% 60%, #2a2000 0%, #0a0408 68%)',
    'radial-gradient(ellipse at 40% 30%, #0a1535 0%, #0a0408 68%)',
    'radial-gradient(ellipse at 65% 55%, #1a0a30 0%, #0a0408 68%)',
    'radial-gradient(ellipse at 20% 35%, #1a1500 0%, #0a0408 68%)',
];
const CHAPTERS=['Chapter One','A Beautiful Day','Golden Moments','Our Journey','Forever Together','Love & Laughter','Sweet Memories','New Adventures','Just the Two of Us'];
const ROTATIONS=[-2,1.5,-1,2,-1.5,1,-2.5,2.5,-.8];

function renderJourney() {
    const slidesEl=document.getElementById('journeySlides');
    const filmstrip=document.getElementById('filmstrip');
    const dotsEl=document.getElementById('journeyDots');
    const bgEl=document.getElementById('journeyBg');
    const countEl=document.getElementById('journeyCount');
    if(!slidesEl) return;

    // Clear everything
    slidesEl.innerHTML=''; filmstrip.innerHTML=''; if(dotsEl) dotsEl.innerHTML='';

    const sorted=[...timelineData].sort((a,b)=>new Date(b.date)-new Date(a.date));

    if(sorted.length===0){
        slidesEl.innerHTML='<div class="journey-empty">No memories yet — add your first one! 📸</div>';
        return;
    }

    journeyCurrent=0;

    sorted.forEach((item,idx)=>{
        const origIdx=timelineData.indexOf(item);
        const d=new Date(item.date+'T00:00:00');
        const dateStr=isNaN(d)?item.date:d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
        const rot=ROTATIONS[idx%ROTATIONS.length];
        const ch=CHAPTERS[idx%CHAPTERS.length];

        // ── SLIDE ──
        const slide=document.createElement('div');
        slide.className='j-slide'+(idx===0?' j-active':'');

        // Polaroid
        const pol=document.createElement('div');
        pol.className='j-polaroid'; pol.style.setProperty('--rot',rot+'deg');
        pol.onclick=()=>openMemoryModal(item,origIdx);

        const img=document.createElement('img');
        img.className='j-photo'; img.src=item.img; img.alt=item.title;
        img.onerror=()=>{
            const fb=document.createElement('div'); fb.className='j-photo-placeholder'; fb.textContent='📷';
            img.replaceWith(fb);
        };

        const cap=document.createElement('div'); cap.className='j-caption';
        cap.innerHTML=`<span class="j-date display-font">${dateStr}</span><span class="j-title-cap">${esc(item.title)}</span>`;
        pol.appendChild(img); pol.appendChild(cap);

        // Text block
        const txt=document.createElement('div'); txt.className='j-text';
        txt.innerHTML=`<div class="j-chapter display-font">${ch}</div><div class="j-desc">${esc(item.desc||'A moment to remember forever.')}</div>`;

        slide.appendChild(pol); slide.appendChild(txt);
        slidesEl.appendChild(slide);

        // ── FILMSTRIP THUMB ──
        const thumb=document.createElement('div');
        thumb.className='thumb-card'+(idx===0?' active':'');
        thumb.onclick=()=>goToSlide(idx);

        const ti=document.createElement('img');
        ti.className='thumb-img'; ti.src=item.img; ti.alt=item.title;
        ti.onerror=()=>{ const fb=document.createElement('div'); fb.className='thumb-img-placeholder'; fb.textContent='📷'; ti.replaceWith(fb); };

        const tt=document.createElement('div'); tt.className='thumb-title'; tt.textContent=item.title;
        thumb.appendChild(ti); thumb.appendChild(tt);
        filmstrip.appendChild(thumb);

        // ── DOT ──
        if(dotsEl){ const dot=document.createElement('button'); dot.className='j-dot'+(idx===0?' on':''); dot.onclick=()=>goToSlide(idx); dotsEl.appendChild(dot); }
    });

    if(countEl) countEl.textContent=`1 / ${sorted.length}`;
    if(bgEl) bgEl.style.background=BG_GRADS[0];

    // Arrow handlers
    const pBtn=document.getElementById('journeyPrev');
    const nBtn=document.getElementById('journeyNext');
    if(pBtn) pBtn.onclick=()=>goToSlide(journeyCurrent-1);
    if(nBtn) nBtn.onclick=()=>goToSlide(journeyCurrent+1);

    // Swipe
    const stage=document.getElementById('journeyStage');
    let sx=0;
    const onTouchStart=e=>{ sx=e.touches[0].clientX; };
    const onTouchEnd=e=>{ const dx=sx-e.changedTouches[0].clientX; if(Math.abs(dx)>45) goToSlide(journeyCurrent+(dx>0?1:-1)); };
    const onMDown=e=>{ sx=e.clientX; };
    const onMUp=e=>{ const dx=sx-e.clientX; if(Math.abs(dx)>45) goToSlide(journeyCurrent+(dx>0?1:-1)); };
    stage.removeEventListener('touchstart',onTouchStart);
    stage.removeEventListener('touchend',onTouchEnd);
    stage.removeEventListener('mousedown',onMDown);
    stage.removeEventListener('mouseup',onMUp);
    stage.addEventListener('touchstart',onTouchStart,{passive:true});
    stage.addEventListener('touchend',onTouchEnd,{passive:true});
    stage.addEventListener('mousedown',onMDown);
    stage.addEventListener('mouseup',onMUp);
}

function goToSlide(n) {
    const slides=document.querySelectorAll('.j-slide');
    const thumbs=document.querySelectorAll('.thumb-card');
    const dots=document.querySelectorAll('.j-dot');
    const count=document.getElementById('journeyCount');
    const bg=document.getElementById('journeyBg');
    const total=slides.length; if(!total) return;

    n=(n+total)%total;

    // Exit current
    slides[journeyCurrent].classList.remove('j-active');
    slides[journeyCurrent].classList.add('j-exit');
    const exitIdx=journeyCurrent;
    setTimeout(()=>{ if(slides[exitIdx]) slides[exitIdx].classList.remove('j-exit'); }, 700);
    thumbs[journeyCurrent]?.classList.remove('active');
    dots[journeyCurrent]?.classList.remove('on');

    journeyCurrent=n;

    // Activate new
    slides[journeyCurrent].classList.add('j-active');
    thumbs[journeyCurrent]?.classList.add('active');
    dots[journeyCurrent]?.classList.add('on');
    thumbs[journeyCurrent]?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});

    if(bg) bg.style.background=BG_GRADS[journeyCurrent%BG_GRADS.length];
    if(count) count.textContent=`${journeyCurrent+1} / ${total}`;
}

// ── Memory modal ───────────────────────────────────────────────
function openMemoryModal(item,index) {
    document.getElementById('modalTitle').textContent=item.title;
    document.getElementById('modalImg').src=item.img;
    document.getElementById('modalDesc').textContent=item.desc||'No description.';
    document.getElementById('modalActions').innerHTML=`<button class="edit-btn" onclick="prepareEditMemory(${index})">Edit ✏️</button><button class="delete-btn" onclick="deleteMemory(${index})">Delete 🗑️</button>`;
    document.getElementById('memoryModal').style.display='flex';
}
function closeMemoryModal(){ document.getElementById('memoryModal').style.display='none'; }

function openAddMemoryModal(isEdit=false) {
    document.getElementById('addModalTitle').textContent=isEdit?'Edit Memory ✏️':'Add New Memory 📝';
    if(!isEdit){ document.getElementById('editIndex').value='-1'; ['newMemTitle','newMemDate','newMemImgNum','newMemDesc'].forEach(id=>{ document.getElementById(id).value=''; }); }
    document.getElementById('addMemoryModal').style.display='flex';
}
function closeAddMemoryModal(){ document.getElementById('addMemoryModal').style.display='none'; }

function prepareEditMemory(index) {
    closeMemoryModal();
    const item=timelineData[index]; if(!item) return;
    let imgNum=''; const match=item.img?.match(/Timeline\/(\d+)\.jpg/i); if(match) imgNum=match[1];
    document.getElementById('newMemTitle').value=item.title;
    document.getElementById('newMemDate').value=item.date;
    document.getElementById('newMemImgNum').value=imgNum;
    document.getElementById('newMemDesc').value=item.desc;
    document.getElementById('editIndex').value=index;
    openAddMemoryModal(true);
}

function deleteMemory(index) {
    showCustomPopup('Delete Memory?','This cannot be undone.',null,confirmed=>{ if(!confirmed) return; timelineData.splice(index,1); localStorage.setItem('hetuTimelineData',JSON.stringify(timelineData)); closeMemoryModal(); renderJourney(); showCustomPopup('Deleted','Memory removed.'); });
}

function saveNewMemory() {
    const title=document.getElementById('newMemTitle').value.trim();
    const date=document.getElementById('newMemDate').value;
    const imgNum=document.getElementById('newMemImgNum').value.trim();
    const desc=document.getElementById('newMemDesc').value.trim();
    const editIdx=parseInt(document.getElementById('editIndex').value);
    if(!title||!date||!imgNum){ showCustomPopup('Missing info','Please fill in Title, Date, and Image Number.'); return; }
    const entry={ title, date, img:`assets/Timeline/${imgNum}.jpg`, desc };
    if(isNaN(editIdx)||editIdx===-1){ timelineData.push(entry); showCustomPopup('Saved! 🌸','New memory added.'); }
    else { timelineData[editIdx]=entry; showCustomPopup('Updated! ✨','Memory edited.'); }
    localStorage.setItem('hetuTimelineData',JSON.stringify(timelineData));
    renderJourney();
    closeAddMemoryModal();
}


// ══════════════════════════════════════════════════════════════
//  MISS YOU
// ══════════════════════════════════════════════════════════════

function showMissYouPopup() {
    const bunny=document.getElementById('bunnyEmoji');
    if(bunny) bunny.classList.add('spinning');
    setTimeout(()=>{
        if(bunny) bunny.classList.remove('spinning');
        const h=new Date().getHours();
        let msg;
        if(h>=5&&h<12) msg='Good morning, sunshine! ☀️\nHope your day is as lovely as you are.';
        else if(h>=22||h<5) msg='Sweet dreams, my love 🌙\nRest well — I\'ll be here when you wake up.';
        else {
            const msgs=['You\'re my favourite notification 📱','I love you, my chikoo! 🥰','Sending you the warmest virtual hug 🤗','Thinking of you, always ✨','You make every day better 💖','Just wanted to say — you\'re wonderful 🌸','Missing you extra today 🐰'];
            msg=msgs[Math.floor(Math.random()*msgs.length)];
        }
        document.getElementById('missYouMessage').textContent=msg;
        document.getElementById('missYouPopup').style.display='flex';
    },1800);
}
function closeMissYouPopup(){ document.getElementById('missYouPopup').style.display='none'; }


// ══════════════════════════════════════════════════════════════
//  GAME ARCADE
// ══════════════════════════════════════════════════════════════

function updateHighScoreDisplays(){
    const m=document.getElementById('memHighScore'); if(m) m.textContent=gameHighScores.memory===Infinity?'—':gameHighScores.memory+' moves';
    const c=document.getElementById('catchHighScore'); if(c) c.textContent=gameHighScores.catch||'0';
    const s=document.getElementById('slashHighScore'); if(s) s.textContent=gameHighScores.slasher||'0';
    const t=document.getElementById('typerHighScore'); if(t) t.textContent=gameHighScores.typer||'—';
}
function saveHighScores(){ localStorage.setItem('hetuApp_highscores',JSON.stringify(gameHighScores)); updateHighScoreDisplays(); }

function startMemoryGame(){
    navigateToApp('memoryGameScreen');
    const grid=document.getElementById('memoryGrid'); grid.innerHTML='';
    memMoves=0; document.getElementById('memoryMoves').textContent=0;
    memLock=false; memHasFlippedCard=false;
    const items=usePhotoAssets?['assets/mem1.jpg','assets/mem2.jpg','assets/mem3.jpg','assets/mem4.jpg','assets/mem5.jpg','assets/mem6.jpg']:['🧸','🐰','💖','🍓','💋','🌹'];
    const deck=[...items,...items].sort(()=>Math.random()-.5);
    deck.forEach(item=>{ const card=document.createElement('div'); card.className='memory-card'; card.dataset.framework=item; const front=document.createElement('div'); front.className='front-face'; if(usePhotoAssets){ const img=document.createElement('img'); img.src=item; img.alt='Memory'; img.onerror=()=>{front.textContent='📷';}; front.appendChild(img); } else front.textContent=item; const back=document.createElement('div'); back.className='back-face'; back.textContent='?'; card.appendChild(front); card.appendChild(back); card.addEventListener('click',flipCard); grid.appendChild(card); });
}
function flipCard(){ if(memLock||this===memFirstCard) return; this.classList.add('flip'); if(!memHasFlippedCard){ memHasFlippedCard=true; memFirstCard=this; return; } memSecondCard=this; memMoves++; document.getElementById('memoryMoves').textContent=memMoves; if(memFirstCard.dataset.framework===memSecondCard.dataset.framework){ memFirstCard.removeEventListener('click',flipCard); memSecondCard.removeEventListener('click',flipCard); [memHasFlippedCard,memLock]=[false,false]; [memFirstCard,memSecondCard]=[null,null]; if(document.querySelectorAll('.memory-card.flip').length===12) setTimeout(()=>{ if(memMoves<gameHighScores.memory){ gameHighScores.memory=memMoves; saveHighScores(); showCustomPopup('New Record! 🏆','You won in just '+memMoves+' moves!'); } else showCustomPopup('You Won! 🎉','Finished in '+memMoves+' moves.'); },400); } else { memLock=true; setTimeout(()=>{ memFirstCard.classList.remove('flip'); memSecondCard.classList.remove('flip'); [memHasFlippedCard,memLock]=[false,false]; [memFirstCard,memSecondCard]=[null,null]; },1000); } }

function startCatchGame(){
    navigateToApp('catchGameScreen');
    const canvas=document.getElementById('catchGameCanvas'), cont=document.getElementById('catchGameCanvasContainer');
    setTimeout(()=>{ canvas.width=cont.clientWidth; canvas.height=cont.clientHeight; document.getElementById('catchStartOverlay').style.display='flex'; },100);
}
function initCatchGame(){
    document.getElementById('catchStartOverlay').style.display='none';
    const canvas=document.getElementById('catchGameCanvas'), cont=document.getElementById('catchGameCanvasContainer');
    canvas.width=cont.clientWidth; canvas.height=cont.clientHeight;
    catchScore=0; document.getElementById('catchScore').textContent=0; catchGameRunning=true;
    const basket={x:canvas.width/2-25,y:canvas.height-55,width:60,height:36}; let items=[],frame=0;
    const nc=canvas.cloneNode(true); canvas.parentNode.replaceChild(nc,canvas); const ctx=nc.getContext('2d');
    function mb(e){ if(!catchGameRunning) return; e.preventDefault(); const r=nc.getBoundingClientRect(); const cx=e.touches?e.touches[0].clientX:e.clientX; basket.x=Math.max(0,Math.min(cx-r.left-basket.width/2,nc.width-basket.width)); }
    nc.addEventListener('mousemove',mb); nc.addEventListener('touchmove',mb,{passive:false});
    function loop(){ if(!catchGameRunning) return; ctx.clearRect(0,0,nc.width,nc.height); ctx.font='36px Arial'; ctx.fillText('🧺',basket.x+12,basket.y+32); if(frame%42===0){ const bad=Math.random()<.28; items.push({x:Math.random()*(nc.width-36),y:-36,type:bad?'💔':'💖',speed:2+Math.random()*2.5}); } for(let i=items.length-1;i>=0;i--){ const it=items[i]; it.y+=it.speed; ctx.font='30px Arial'; ctx.fillText(it.type,it.x,it.y); if(it.y>basket.y&&it.y<basket.y+basket.height&&it.x+30>basket.x&&it.x<basket.x+basket.width){ if(it.type==='💔'){endCatchGame();return;} catchScore++; document.getElementById('catchScore').textContent=catchScore; items.splice(i,1); } else if(it.y>nc.height) items.splice(i,1); } frame++; catchLoopId=requestAnimationFrame(loop); }
    loop();
}
function endCatchGame(){ catchGameRunning=false; if(catchScore>gameHighScores.catch){gameHighScores.catch=catchScore;saveHighScores();showCustomPopup('Game Over 💔','New High Score: '+catchScore+'! 🏆');}else showCustomPopup('Game Over','Score: '+catchScore); document.getElementById('catchStartOverlay').style.display='flex'; }

function startSlasherGame(){
    navigateToApp('slasherGameScreen');
    const canvas=document.getElementById('slasherCanvas'), cont=document.getElementById('slasherCanvasContainer');
    setTimeout(()=>{ canvas.width=cont.clientWidth; canvas.height=cont.clientHeight; document.getElementById('slasherStartOverlay').style.display='flex'; },100);
}
function initSlasherGame(){
    document.getElementById('slasherStartOverlay').style.display='none';
    const canvas=document.getElementById('slasherCanvas'), cont=document.getElementById('slasherCanvasContainer');
    canvas.width=cont.clientWidth; canvas.height=cont.clientHeight;
    slasherScore=0; document.getElementById('slasherScore').textContent=0; slasherGameRunning=true;
    let fruits=[],particles=[],trail=[],frame=0;
    const nc=canvas.cloneNode(true); canvas.parentNode.replaceChild(nc,canvas); const ctx=nc.getContext('2d');
    function onInput(e){ if(!slasherGameRunning) return; e.preventDefault(); const r=nc.getBoundingClientRect(); const cx=e.touches?e.touches[0].clientX:e.clientX; const cy2=e.touches?e.touches[0].clientY:e.clientY; const x=cx-r.left,y=cy2-r.top; trail.push({x,y,life:10}); for(let i=fruits.length-1;i>=0;i--){ const f=fruits[i]; if(Math.hypot(x-f.x,y-f.y)<f.size){ if(f.type==='💣'){endSlasherGame();return;} slasherScore++; document.getElementById('slasherScore').textContent=slasherScore; for(let j=0;j<5;j++) particles.push({x:f.x,y:f.y,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,life:18,color:f.color}); fruits.splice(i,1); } } }
    nc.addEventListener('mousemove',onInput); nc.addEventListener('touchmove',onInput,{passive:false});
    const types=[{emoji:'🍓',color:'#e74c3c'},{emoji:'🍉',color:'#27ae60'},{emoji:'🍊',color:'#e67e22'},{emoji:'💣',color:'#2c3e50'}];
    function loop(){ if(!slasherGameRunning) return; ctx.clearRect(0,0,nc.width,nc.height); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3; ctx.beginPath(); trail.forEach((p,i)=>{ i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y); p.life--; }); ctx.stroke(); trail=trail.filter(p=>p.life>0); if(frame%50===0){ const t=types[Math.floor(Math.random()*types.length)]; fruits.push({x:Math.random()*(nc.width-60)+30,y:nc.height,vx:(Math.random()-.5)*4,vy:-(Math.random()*5+8),type:t.emoji,color:t.color,size:30}); } fruits.forEach((f,i)=>{ f.x+=f.vx; f.y+=f.vy; f.vy+=.15; ctx.font='38px Arial'; ctx.fillText(f.type,f.x-16,f.y+16); if(f.y>nc.height+50) fruits.splice(i,1); }); particles.forEach((p,i)=>{ p.x+=p.vx; p.y+=p.vy; p.life--; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); if(p.life<=0) particles.splice(i,1); }); frame++; slasherLoopId=requestAnimationFrame(loop); }
    loop();
}
function endSlasherGame(){ slasherGameRunning=false; if(slasherScore>gameHighScores.slasher){gameHighScores.slasher=slasherScore;saveHighScores();showCustomPopup('Game Over 💔','New High Score: '+slasherScore+'! 🏆');}else showCustomPopup('Game Over','Score: '+slasherScore); document.getElementById('slasherStartOverlay').style.display='flex'; }


// ══════════════════════════════════════════════════════════════
//  LOVE TYPER — Dialed.gg-style typing speed game
// ══════════════════════════════════════════════════════════════

const TYPER_WORDS = [
    'love','heart','kiss','hug','sweet','dear','warm','soft','gentle','tender',
    'prath','hetu','chikoo','bunny','baby','sugar','honey','darling','beloved',
    'smile','laugh','joy','bliss','happy','lucky','shine','glow','magic','dream',
    'forever','always','promise','trust','care','hold','close','near','safe','home',
    'flower','rose','bloom','petal','garden','sky','star','moon','sun','light',
    'memory','moment','chapter','story','journey','together','us','mine','yours',
    'pretty','lovely','beautiful','radiant','perfect','precious','treasure','rare',
    'cuddle','snuggle','nuzzle','cozy','blanket','warm','night','quiet','peace',
    'morning','coffee','smile','laugh','silly','playful','fun','silly','quirky',
    'brave','strong','kind','patient','gentle','caring','giving','loving','pure',
    'breathe','whisper','soft','light','tender','adore','cherish','worship','devote',
    'soulmate','partner','best','friend','lover','twin','half','whole','complete'
];

function getTyperWords(count) {
    const out=[];
    for(let i=0;i<count;i++) out.push(TYPER_WORDS[Math.floor(Math.random()*TYPER_WORDS.length)]);
    return out;
}

function resetTyper() {
    typerRunning=false;
    if(typerInterval){ clearInterval(typerInterval); typerInterval=null; }
    typerScoreSubmitted=false;
    document.getElementById('typerStartOverlay').style.display='flex';
    document.getElementById('typerGameArea').style.display='none';
    document.getElementById('typerResults').style.display='none';
    const inp=document.getElementById('typerInput'); if(inp){ inp.value=''; inp.classList.remove('typer-correct','typer-wrong'); }
    // reset mode buttons
    document.querySelectorAll('.typer-mode-btn').forEach(b=>b.classList.remove('typer-mode-active'));
    const defBtn=document.querySelector(`.typer-mode-btn[onclick="startTyperGame(${typerDuration})"]`);
    if(defBtn) defBtn.classList.add('typer-mode-active');
}

function startTyperGame(dur) {
    typerDuration=dur; typerTimeLeft=dur; typerRunning=false; typerScoreSubmitted=false;
    typerWordList=getTyperWords(200);
    typerCurrent=0; typerCorrect=0; typerWrong=0; typerStartTime=null;

    document.getElementById('typerStartOverlay').style.display='none';
    document.getElementById('typerResults').style.display='none';
    document.getElementById('typerGameArea').style.display='flex';
    document.getElementById('typerCountdown').textContent=dur;
    document.getElementById('typerLiveWPM').textContent='0';
    document.getElementById('typerLiveAcc').textContent='100';
    document.getElementById('typerLiveWPMHeader').textContent='0';
    document.getElementById('typerTimerBar').style.width='100%';

    // Update active mode button
    document.querySelectorAll('.typer-mode-btn').forEach(b=>b.classList.remove('typer-mode-active'));
    const btn=document.querySelector(`.typer-mode-btn[onclick="startTyperGame(${dur})"]`);
    if(btn) btn.classList.add('typer-mode-active');

    renderTyperWords();
    const inp=document.getElementById('typerInput');
    inp.value=''; inp.classList.remove('typer-correct','typer-wrong');
    inp.removeEventListener('input',typerInputHandler);
    inp.addEventListener('input',typerInputHandler);
    inp.focus();
}

function renderTyperWords() {
    const wrap=document.getElementById('typerWords');
    wrap.innerHTML='';
    const visible=typerWordList.slice(Math.max(0,typerCurrent-5), typerCurrent+30);
    const offset=Math.max(0,typerCurrent-5);
    visible.forEach((w,vi)=>{
        const idx=offset+vi;
        const span=document.createElement('span');
        span.className='typer-word';
        span.id='tw-'+idx;
        span.textContent=w;
        if(idx<typerCurrent) span.classList.add('typed-correct');
        if(idx===typerCurrent) span.classList.add('typer-active');
        wrap.appendChild(span);
    });
    // scroll active word into view
    const active=document.getElementById('tw-'+typerCurrent);
    if(active) active.scrollIntoView({block:'nearest',inline:'nearest'});
}

function typerInputHandler(e) {
    const inp=e.target;
    const val=inp.value;

    // Start timer on first keystroke
    if(!typerRunning && val.length>0) {
        typerRunning=true;
        typerStartTime=Date.now();
        if(typerInterval) clearInterval(typerInterval);
        typerInterval=setInterval(typerTick, 200);
    }

    // Space = submit word
    if(val.endsWith(' ')) {
        const typed=val.trim();
        const expected=typerWordList[typerCurrent];
        if(typed===expected) { typerCorrect++; } else { typerWrong++; }
        typerCurrent++;
        inp.value='';
        inp.classList.remove('typer-correct','typer-wrong');
        renderTyperWords();
        // Generate more words if running low
        if(typerCurrent+30>=typerWordList.length) typerWordList=typerWordList.concat(getTyperWords(50));
        updateTyperStats();
        return;
    }

    // Live correctness highlight
    const partial=val;
    const expected=typerWordList[typerCurrent];
    if(partial.length===0) { inp.classList.remove('typer-correct','typer-wrong'); return; }
    if(expected.startsWith(partial)) { inp.classList.add('typer-correct'); inp.classList.remove('typer-wrong'); }
    else { inp.classList.add('typer-wrong'); inp.classList.remove('typer-correct'); }
}

function typerTick() {
    if(!typerRunning) return;
    typerTimeLeft=typerDuration-Math.floor((Date.now()-typerStartTime)/1000);
    if(typerTimeLeft<=0) { typerTimeLeft=0; endTyperGame(); return; }
    document.getElementById('typerCountdown').textContent=typerTimeLeft;
    document.getElementById('typerTimerBar').style.width=(typerTimeLeft/typerDuration*100)+'%';
    updateTyperStats();
}

function updateTyperStats() {
    if(!typerStartTime) return;
    const elapsed=(Date.now()-typerStartTime)/60000;
    const wpm=elapsed>0?Math.round(typerCorrect/elapsed):0;
    const total=typerCorrect+typerWrong;
    const acc=total>0?Math.round(typerCorrect/total*100):100;
    document.getElementById('typerLiveWPM').textContent=wpm;
    document.getElementById('typerLiveAcc').textContent=acc;
    document.getElementById('typerLiveWPMHeader').textContent=wpm;
}

function endTyperGame() {
    typerRunning=false;
    clearInterval(typerInterval); typerInterval=null;
    document.getElementById('typerGameArea').style.display='none';
    document.getElementById('typerTimerBar').style.width='0%';
    document.getElementById('typerInput').removeEventListener('input',typerInputHandler);

    const elapsed=typerDuration/60;
    const wpm=Math.round(typerCorrect/elapsed);
    const total=typerCorrect+typerWrong;
    const acc=total>0?Math.round(typerCorrect/total*100):100;

    document.getElementById('typerResultWPM').textContent=wpm;
    document.getElementById('typerResultStats').innerHTML=
        `<div class="typer-stat-chip">⌨️ ${typerDuration}s mode</div>`+
        `<div class="typer-stat-chip">✅ ${typerCorrect} correct</div>`+
        `<div class="typer-stat-chip">❌ ${typerWrong} errors</div>`+
        `<div class="typer-stat-chip">🎯 ${acc}% accuracy</div>`;
    document.getElementById('typerResults').style.display='flex';
    document.getElementById('typerSaveBtn').disabled=false;
    document.getElementById('typerSaveBtn').textContent='🏆 Save Score';

    // Update personal best
    if(wpm>gameHighScores.typer){ gameHighScores.typer=wpm; saveHighScores(); }

    // Store pending score for submit
    window._typerPendingScore = { wpm, acc, duration: typerDuration, correct: typerCorrect, errors: typerWrong };
}

async function submitTyperScore() {
    if(typerScoreSubmitted) return;
    const s=window._typerPendingScore;
    if(!s) return;
    typerScoreSubmitted=true;
    const btn=document.getElementById('typerSaveBtn');
    btn.disabled=true; btn.textContent='Saving…';
    try {
        const fd=new FormData();
        fd.append('formType','gameScoreEntry');
        fd.append('game','LoveTyper_'+s.duration+'s');
        fd.append('score',s.wpm);
        fd.append('player',currentUser);
        fd.append('accuracy',s.acc);
        const res=await fetch(scriptURL,{method:'POST',body:fd,mode:'cors'});
        const data=await res.json();
        if(data.status==='success'){
            btn.textContent='Saved! ✅';
            fetchTyperLeaderboard();
        } else throw new Error(data.message);
    } catch(e) {
        typerScoreSubmitted=false;
        btn.disabled=false; btn.textContent='🏆 Save Score';
        showCustomPopup('Error','Could not save: '+e.message);
    }
}

async function fetchTyperLeaderboard() {
    const list=document.getElementById('typerLbList');
    if(!list) return;
    list.innerHTML='<p class="loading-text">Loading…</p>';
    try {
        const res=await fetch(`${scriptURL}?action=getLeaderboard&game=LoveTyper`);
        const data=await res.json();
        if(data.status==='success'&&data.data.length>0){
            const all=data.data;
            // Filter by current tab
            const filtered=typerLbFilter==='all'?all:all.filter(r=>r.game&&r.game.includes('_'+typerLbFilter+'s'));
            const sorted=[...filtered].sort((a,b)=>b.score-a.score).slice(0,15);
            list.innerHTML='';
            const medals=['🥇','🥈','🥉'];
            sorted.forEach((row,i)=>{
                const div=document.createElement('div');
                div.className='typer-lb-row'+(row.player===currentUser?' typer-lb-mine':'');
                const medal=medals[i]||`<span class="lb-rank">${i+1}</span>`;
                div.innerHTML=`<span class="lb-medal">${medal}</span><span class="lb-name">${esc(row.player||'?')}</span><span class="lb-wpm">${row.score} <small>wpm</small></span><span class="lb-mode">${(row.game||'').replace('LoveTyper_','').replace('s','s mode')}</span>`;
                list.appendChild(div);
            });
            if(sorted.length===0) list.innerHTML='<p class="loading-text">No scores yet for this filter!</p>';
        } else {
            list.innerHTML='<p class="loading-text">No scores yet — be the first! ⌨️</p>';
        }
    } catch(e) { list.innerHTML='<p class="loading-text">Could not load leaderboard.</p>'; }
}

function switchLbTab(filter, btn) {
    typerLbFilter=filter;
    document.querySelectorAll('.typer-lb-tab').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    fetchTyperLeaderboard();
}



// ══════════════════════════════════════════════════════════════
//  MUSIC PLAYER — YouTube IFrame API · Custom UI · Playlist
//  Playlist ID: PLg0uQzBdgt9kA8APLHj-4DBmidDksJFGx
// ══════════════════════════════════════════════════════════════

const YT_PLAYLIST_ID = 'PLg0uQzBdgt9kA8APLHj-4DBmidDksJFGx';

// ── YouTube IFrame API ──────────────────────────────────────

// Called automatically by YouTube IFrame API script when ready
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytPlayerContainer', {
        height: '1', width: '1',
        playerVars: {
            listType: 'playlist',
            list:     YT_PLAYLIST_ID,
            autoplay: 0, controls: 0, disablekb: 1,
            fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0,
        },
        events: {
            onReady:       onYTPlayerReady,
            onStateChange: onYTPlayerStateChange,
            onError:       onYTPlayerError,
        }
    });
}

function onYTPlayerReady(event) {
    ytReady = true;
    const vol = parseInt(document.getElementById('musicVolSlider')?.value || '80');
    event.target.setVolume(vol);
    // Load playlist IDs for the playlist panel
    setTimeout(() => {
        try {
            ytPlaylistIds = ytPlayer.getPlaylist() || [];
            buildPlaylistUI();
        } catch(e) { console.warn('Could not load playlist:', e); }
    }, 800);
    updateMusicUI();
}

function onYTPlayerStateChange(event) {
    const playBtn = document.getElementById('musicPlay');
    const cover   = document.getElementById('musicCover');

    if (event.data === YT.PlayerState.PLAYING) {
        if (playBtn) playBtn.textContent = '⏸';
        if (cover)   cover.classList.add('spinning');
        startProgressTimer();
        // Get current index and cache the title
        try {
            ytCurrentIdx = ytPlayer.getPlaylistIndex();
            const data   = ytPlayer.getVideoData();
            if (data?.title && ytPlaylistIds[ytCurrentIdx]) {
                ytTitleCache[ytPlaylistIds[ytCurrentIdx]] = data.title;
            }
        } catch(e) {}
        updateMusicUI();
        highlightPlaylistItem();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        if (playBtn) playBtn.textContent = '▶';
        if (cover)   cover.classList.remove('spinning');
        stopProgressTimer();
        if (event.data === YT.PlayerState.ENDED) {
            setTimeout(() => { if (ytReady && ytPlayer) ytPlayer.nextVideo(); }, 500);
        }
    }
}

function onYTPlayerError(event) {
    console.warn('YouTube player error:', event.data);
    const el = document.getElementById('musicTitle');
    if (el) el.textContent = 'Playback error — check playlist is Public/Unlisted';
}

// ── UI updates ──────────────────────────────────────────────

function updateMusicUI() {
    if (!ytReady || !ytPlayer) return;
    try {
        const data  = ytPlayer.getVideoData();
        const title = data?.title || 'Loading…';
        const auth  = data?.author || '♪ Your Playlist';
        const titleEl  = document.getElementById('musicTitle');
        const artistEl = document.getElementById('musicArtist');
        if (titleEl)  titleEl.textContent  = title;
        if (artistEl) artistEl.textContent = auth;
        // Cache it
        if (data?.video_id && data?.title) ytTitleCache[data.video_id] = data.title;
    } catch(e) {}
}

function startProgressTimer() {
    stopProgressTimer();
    musicProgressTimer = setInterval(tickProgress, 1000);
}
function stopProgressTimer() {
    if (musicProgressTimer) { clearInterval(musicProgressTimer); musicProgressTimer = null; }
}
function tickProgress() {
    if (!ytReady || !ytPlayer) return;
    try {
        const cur  = ytPlayer.getCurrentTime() || 0;
        const dur  = ytPlayer.getDuration()    || 0;
        const pct  = dur > 0 ? (cur / dur) * 100 : 0;
        const fill = document.getElementById('musicProgressFill');
        const tel  = document.getElementById('musicTimeEl');
        const del  = document.getElementById('musicDurEl');
        if (fill) fill.style.width  = pct + '%';
        if (tel)  tel.textContent   = fmtTime(cur);
        if (del)  del.textContent   = fmtTime(dur);
        updateMusicUI();
    } catch(e) {}
}

// ── Playback controls ───────────────────────────────────────

function showMusicPill() {
    const pill = document.getElementById('musicTogglePill');
    if (pill) pill.style.display = 'block';
}

function toggleMusicPlayer() {
    const player = document.getElementById('musicPlayer');
    const pill   = document.getElementById('musicTogglePill');
    musicPlayerOpen = !musicPlayerOpen;
    if (player) player.style.display = musicPlayerOpen ? 'flex' : 'none';
    if (pill)   pill.style.display   = musicPlayerOpen ? 'none' : 'block';
}

function musicToggle() {
    if (!ytReady || !ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

function musicNext() {
    if (!ytReady || !ytPlayer) return;
    ytPlayer.nextVideo();
    setTimeout(() => { updateMusicUI(); highlightPlaylistItem(); }, 900);
}

function musicPrev() {
    if (!ytReady || !ytPlayer) return;
    const cur = ytPlayer.getCurrentTime() || 0;
    if (cur > 3) {
        ytPlayer.seekTo(0, true);
    } else {
        ytPlayer.previousVideo();
        setTimeout(() => { updateMusicUI(); highlightPlaylistItem(); }, 900);
    }
}

function musicSetVolume(val) {
    if (!ytReady || !ytPlayer) return;
    ytPlayer.setVolume(parseInt(val));
}

function pauseAudio() {
    if (ytReady && ytPlayer) { try { ytPlayer.pauseVideo(); } catch(e) {} }
}

// ── Playlist panel ──────────────────────────────────────────

function togglePlaylistPanel() {
    const panel = document.getElementById('playlistPanel');
    const btn   = document.getElementById('playlistToggleBtn');
    if (!panel) return;
    playlistOpen = !playlistOpen;
    panel.classList.toggle('open', playlistOpen);
    if (btn) btn.style.color = playlistOpen ? 'var(--accent)' : '';
    // If we have IDs but haven't built UI yet, try now
    if (playlistOpen && ytReady && ytPlaylistIds.length === 0) {
        try {
            ytPlaylistIds = ytPlayer.getPlaylist() || [];
            buildPlaylistUI();
        } catch(e) {}
    }
}

function buildPlaylistUI() {
    const scroll    = document.getElementById('playlistScroll');
    const countEl   = document.getElementById('playlistCount');
    if (!scroll) return;

    const total = ytPlaylistIds.length;
    if (countEl) countEl.textContent = total > 0 ? `${total} tracks` : '— tracks';

    if (total === 0) {
        scroll.innerHTML = '<div class="playlist-loading">No tracks found — make sure playlist is Public or Unlisted.</div>';
        return;
    }

    scroll.innerHTML = '';
    ytPlaylistIds.forEach((videoId, idx) => {
        const title = ytTitleCache[videoId] || `Track ${idx + 1}`;
        const item  = document.createElement('button');
        item.className    = 'playlist-item' + (idx === ytCurrentIdx ? ' active' : '');
        item.dataset.idx  = idx;
        item.innerHTML    = `
            <span class="pi-index">${idx === ytCurrentIdx ? '♪' : idx + 1}</span>
            <span class="pi-title">${esc(title)}</span>
            <span class="pi-play-icon">▶</span>`;
        item.onclick = () => playPlaylistItem(idx);
        scroll.appendChild(item);
    });
}

function playPlaylistItem(idx) {
    if (!ytReady || !ytPlayer) return;
    ytCurrentIdx = idx;
    ytPlayer.playVideoAt(idx);
    setTimeout(() => { updateMusicUI(); highlightPlaylistItem(); }, 600);
}

function highlightPlaylistItem() {
    try { ytCurrentIdx = ytPlayer.getPlaylistIndex(); } catch(e) {}
    // Refresh titles from cache, update active state
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
        const isActive = i === ytCurrentIdx;
        item.classList.toggle('active', isActive);
        const idxEl = item.querySelector('.pi-index');
        if (idxEl) idxEl.textContent = isActive ? '♪' : i + 1;
        // Update title from cache if available
        const videoId = ytPlaylistIds[i];
        if (videoId && ytTitleCache[videoId]) {
            const titleEl = item.querySelector('.pi-title');
            if (titleEl) titleEl.textContent = ytTitleCache[videoId];
        }
    });
    // Scroll active item into view
    const active = document.querySelector('.playlist-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}


// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', ()=>{
    loadTheme();
    checkLoginStatus();
    createFloatingEmojis();

    // Diary calendar nav
    const pb=document.getElementById('prevMonthBtn');
    const nb=document.getElementById('nextMonthBtn');
    if(pb) pb.onclick=()=>{ calendarCurrentDate.setMonth(calendarCurrentDate.getMonth()-1); fetchDiaryEntries().then(()=>renderCalendar(calendarCurrentDate)); };
    if(nb) nb.onclick=()=>{ calendarCurrentDate.setMonth(calendarCurrentDate.getMonth()+1); fetchDiaryEntries().then(()=>renderCalendar(calendarCurrentDate)); };

    document.getElementById('themeToggle').onclick=toggleTheme;


    // Progress bar click-to-seek
    const bar = document.getElementById('musicProgressBar');
    if (bar) bar.addEventListener('click', e => {
        if (!ytReady || !ytPlayer) return;
        const r = bar.getBoundingClientRect();
        const pct = (e.clientX - r.left) / r.width;
        const dur = ytPlayer.getDuration() || 0;
        if (dur > 0) ytPlayer.seekTo(pct * dur, true);
    });
});

