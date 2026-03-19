// ═══════════════════════════════════════════════════════════════
//  HAPES PORTAL  ·  script.js v3
//  Fixed: countdown hardcoded to Apr 21 2023 · real audio player
//  Clean journey page · all previous bugs resolved
// ═══════════════════════════════════════════════════════════════

const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// ── State ──────────────────────────────────────────────────────
let currentUser       = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion    = '';
let calendarCurrentDate = new Date();
let periodCalendarDate  = new Date();
let diaryEntries      = {};
let periodData        = [];
let usedDares         = [];
let selectedMood      = null;
let countdownInterval = null;

// Default anniversary — April 21 2023
const DEFAULT_ANNIVERSARY = '2023-04-21';
const DEFAULT_ANNIVERSARY_LABEL = 'The day everything changed 💕';

// ── Game State ─────────────────────────────────────────────────
const usePhotoAssets = true;
let memMoves=0, memLock=false, memHasFlippedCard=false, memFirstCard, memSecondCard;
let catchGameRunning=false, catchScore=0, catchLoopId;
let slasherGameRunning=false, slasherScore=0, slasherLoopId;
let gameHighScores = { memory: Infinity, catch: 0, slasher: 0 };

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
let musicPlaylist       = [];   // loaded from playlist.json
let musicIdx            = 0;
let musicPlayerOpen     = false;

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

/** Pretty-print filename as title: "tum hi ho.mp3" → "Tum Hi Ho" */
function fileToTitle(filename) {
    return filename
        .replace(/\.[^.]+$/, '')        // remove extension
        .replace(/[-_]/g, ' ')          // dashes/underscores → spaces
        .replace(/\b\w/g, c => c.toUpperCase()); // title case
}


// ══════════════════════════════════════════════════════════════
//  ANNIVERSARY COUNTDOWN  (hardcoded default: Apr 21 2023)
// ══════════════════════════════════════════════════════════════

function initCountdown() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('hetuAnniversary')); } catch(e) {}

    let dateStr = saved?.date || DEFAULT_ANNIVERSARY;
    const label = saved?.label || DEFAULT_ANNIVERSARY_LABEL;
    let start = new Date(dateStr + 'T00:00:00');
    if (isNaN(start.getTime())) start = new Date('2023-04-21T00:00:00');

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
    notes.push({ text, author: currentUser, ts: new Date().toISOString() });
    localStorage.setItem('hetuLoveNotes', JSON.stringify(notes));
    closeLoveNoteModal();
    loadLoveNotes();
    releaseButterflies(document.getElementById('loveNotesPanel'));
    showCustomPopup('Sent! 💌','Your love note is waiting for them.');
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
    if (userName !== 'Chikoo' && userName !== 'Prath') return;
    currentUser = userName;
    localStorage.setItem(SCRIPT_USER_KEY, currentUser);
    updateUserDisplay();
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display   = 'block';
    navigateToApp('homeScreen');
    createFloatingEmojis();
    showMusicPill();
    setTimeout(()=>{ const h=document.querySelector('.main-title'); if(h) releaseButterflies(h); }, 400);
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    if (countdownInterval) clearInterval(countdownInterval);
    pauseAudio();
    document.getElementById('appContainer').style.display   = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('musicTogglePill').style.display = 'none';
    document.getElementById('musicPlayer').style.display    = 'none';
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('floatingBg').innerHTML = '';
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
    const stored = localStorage.getItem(SCRIPT_USER_KEY);
    if (stored) {
        currentUser = stored;
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display   = 'block';
        navigateToApp('homeScreen');
        showMusicPill();
    }
    const sc = localStorage.getItem('hetuApp_highscores');
    if (sc) { try { gameHighScores = JSON.parse(sc); } catch(e){} }
    updateHighScoreDisplays();
    setTimeout(()=>{ if(currentUser){ initCountdown(); loadLoveNotes(); } }, 60);
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
        case 'timelineScreen':
            renderJourney(); break;
    }
    window.scrollTo({top:0, behavior:'smooth'});
}

function quitGame(nav=true) {
    catchGameRunning=false; slasherGameRunning=false;
    cancelAnimationFrame(catchLoopId); cancelAnimationFrame(slasherLoopId);
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
//  PERIOD TRACKER
// ══════════════════════════════════════════════════════════════

function selectMood(mood, btn) {
    document.querySelectorAll('.mood-pill').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selectedMood=mood;
}

function addPeriodEntry() {
    const start=document.getElementById('periodStartDate').value;
    const end=document.getElementById('periodEndDate').value||start;
    if (!start) { showCustomPopup('Missing Date','Please select at least a start date.'); return; }
    const ci=document.getElementById('cycleLengthInput');
    if(ci) localStorage.setItem('periodCycleLength',ci.value);
    periodData=JSON.parse(localStorage.getItem('periodData')||'[]');
    periodData.push({ startDate:start, endDate:end, mood:selectedMood, loggedBy:currentUser, timestamp:new Date().toISOString() });
    localStorage.setItem('periodData',JSON.stringify(periodData));
    document.getElementById('periodStartDate').value='';
    document.getElementById('periodEndDate').value='';
    document.querySelectorAll('.mood-pill').forEach(b=>b.classList.remove('active'));
    selectedMood=null;
    showCustomPopup('Logged! 🌸','Period entry recorded.');
    loadPeriodTracker();
}

function loadPeriodTracker() {
    const savedC=localStorage.getItem('periodCycleLength');
    const ci=document.getElementById('cycleLengthInput');
    if(savedC&&ci) ci.value=savedC;
    periodData=JSON.parse(localStorage.getItem('periodData')||'[]');
    const statusEl=document.getElementById('periodStatus');
    const nextEl=document.getElementById('nextPeriodInfo');
    const iconEl=document.getElementById('periodStatusIcon');
    if(periodData.length===0){ statusEl.textContent='No period data recorded yet.'; nextEl.innerHTML=''; iconEl.textContent='🌸'; renderPeriodCalendar(); renderPeriodHistory(); renderCyclePhase(); return; }
    const sorted=[...periodData].sort((a,b)=>new Date(b.startDate)-new Date(a.startDate));
    const lastStart=new Date(sorted[0].startDate+'T00:00:00');
    const cycleLen=parseInt(ci?.value||'28')||28;
    const nextDate=new Date(lastStart); nextDate.setDate(nextDate.getDate()+cycleLen);
    const today=new Date(); today.setHours(0,0,0,0);
    const dUntil=Math.ceil((nextDate-today)/86400000);
    if(dUntil<0){ iconEl.textContent='⚠️'; statusEl.textContent='Period may be late or just starting'; }
    else if(dUntil===0){ iconEl.textContent='🔔'; statusEl.textContent='Period expected today!'; }
    else if(dUntil<=5){ iconEl.textContent='⚠️'; statusEl.textContent=`Period expected in ${dUntil} day${dUntil===1?'':'s'}`; }
    else { iconEl.textContent='✅'; statusEl.textContent=`Cycle on track — ${dUntil} days until next period`; }
    nextEl.innerHTML=`<strong>Next expected:</strong> ${nextDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}<br><strong>Last period:</strong> ${lastStart.toLocaleDateString('en-US',{month:'long',day:'numeric'})}<br><strong>Cycle:</strong> ${cycleLen} days${sorted[0].mood?` &nbsp;·&nbsp; Mood: ${sorted[0].mood}`:''}`;
    renderPeriodCalendar(); renderPeriodHistory(); renderCyclePhase();
}

function changePeriodMonth(dir) { periodCalendarDate.setMonth(periodCalendarDate.getMonth()+dir); renderPeriodCalendar(); }

function renderPeriodCalendar() {
    const grid=document.getElementById('periodCalendarGrid');
    const my=document.getElementById('periodMonthYear');
    const ci=document.getElementById('cycleLengthInput');
    if(!grid||!my) return;
    grid.innerHTML='';
    const m=periodCalendarDate.getMonth(), y=periodCalendarDate.getFullYear();
    my.textContent=periodCalendarDate.toLocaleString('default',{month:'long',year:'numeric'});
    const first=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
    const today=todayStr();
    const cycleLen=parseInt(ci?.value||'28')||28;
    const sorted=[...periodData].sort((a,b)=>new Date(b.startDate)-new Date(a.startDate));
    const last=sorted[0];
    let nextStart=null, predEnd=null;
    if(last){ nextStart=new Date(last.startDate+'T00:00:00'); nextStart.setDate(nextStart.getDate()+cycleLen); predEnd=new Date(nextStart); predEnd.setDate(predEnd.getDate()+4); }
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{ const h=document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; grid.appendChild(h); });
    for(let i=0;i<first;i++){ const e=document.createElement('div'); e.className='calendar-day empty'; grid.appendChild(e); }
    for(let day=1;day<=dim;day++){
        const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const cur=new Date(ds+'T00:00:00');
        const cell=document.createElement('div'); cell.className='calendar-day'; cell.textContent=day;
        const isPeriod=periodData.some(e=>{ const s=new Date(e.startDate+'T00:00:00'); const en=new Date((e.endDate||e.startDate)+'T00:00:00'); return cur>=s&&cur<=en; });
        if(isPeriod) cell.classList.add('period-day');
        else if(nextStart&&cur>=nextStart&&cur<=predEnd) cell.classList.add('predicted-period');
        if(ds===today) cell.classList.add('today');
        grid.appendChild(cell);
    }
}

function renderPeriodHistory() {
    const list=document.getElementById('periodHistoryList');
    const panel=document.getElementById('periodHistoryPanel');
    const strip=document.getElementById('periodStatStrip');
    if(!list||!panel) return;
    if(strip&&periodData.length>0){
        strip.style.display='grid';
        document.getElementById('statTotalLogs').textContent=periodData.length;
        const wE=periodData.filter(e=>e.endDate&&e.endDate!==e.startDate);
        if(wE.length>0){ const avg=wE.reduce((s,e)=>s+Math.round((new Date(e.endDate+'T00:00:00')-new Date(e.startDate+'T00:00:00'))/86400000)+1,0)/wE.length; document.getElementById('statAvgDuration').textContent=Math.round(avg)+'d'; }
        const s2=[...periodData].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
        if(s2.length>1){ const gaps=[]; for(let i=1;i<s2.length;i++){ const g=Math.round((new Date(s2[i].startDate+'T00:00:00')-new Date(s2[i-1].startDate+'T00:00:00'))/86400000); if(g>10&&g<60) gaps.push(g); } if(gaps.length>0) document.getElementById('statAvgCycle').textContent=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length)+'d'; }
    } else if(strip) strip.style.display='none';
    if(periodData.length===0){ panel.style.display='none'; return; }
    panel.style.display='block';
    const sorted=[...periodData].sort((a,b)=>new Date(b.startDate)-new Date(a.startDate)).slice(0,6);
    list.innerHTML='';
    sorted.forEach((entry,i)=>{
        const s=new Date(entry.startDate+'T00:00:00');
        const e=entry.endDate?new Date(entry.endDate+'T00:00:00'):null;
        const same=!e||localDateStr(s)===localDateStr(e);
        const label=same?s.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):`${s.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${e.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
        const item=document.createElement('div'); item.className='period-log-item';
        item.innerHTML=`<div class="log-dot"></div><div class="log-info"><div class="log-dates">${label}</div>${entry.mood?`<div class="log-mood">Mood: ${entry.mood}</div>`:''}<div class="log-user">Logged by ${esc(entry.loggedBy||'?')}</div></div><button class="delete-log-btn" onclick="deleteLogEntry(${periodData.indexOf(entry)})">🗑️</button>`;
        list.appendChild(item);
    });
}

function deleteLogEntry(idx) {
    showCustomPopup('Delete this log?','Remove this period entry?',null,confirmed=>{ if(!confirmed) return; periodData.splice(idx,1); localStorage.setItem('periodData',JSON.stringify(periodData)); loadPeriodTracker(); });
}


// ══════════════════════════════════════════════════════════════
//  CYCLE WHEEL — Canvas
// ══════════════════════════════════════════════════════════════

const WHEEL_PHASES=[
    {id:'m',name:'Period',    emoji:'🌺',cls:'pb-m',tip:'Rest is everything right now. Warmth, gentle care, and Prath\'s patience makes all the difference 💕'},
    {id:'f',name:'Follicular',emoji:'🌱',cls:'pb-f',tip:'Energy is building! Great time for new plans, creativity, and social fun. Mood lifts naturally 🌿'},
    {id:'o',name:'Ovulation', emoji:'✨',cls:'pb-o',tip:'Peak energy and confidence! Connection and communication feel effortless today 🌟'},
    {id:'l',name:'Luteal',    emoji:'🌙',cls:'pb-l',tip:'Winding down toward the next cycle. Some days feel heavier — that\'s completely normal. Journaling and cozy time help 🌙'},
];
const WHEEL_COLORS =['#ffb3b3','#a5d6a7','#fff176','#ce93d8'];
const WHEEL_BORDERS=['#e57373','#66bb6a','#fdd835','#ab47bc'];

function buildPhaseBadges() {
    const c=document.getElementById('phaseBadges'); if(!c) return;
    c.innerHTML='';
    WHEEL_PHASES.forEach(p=>{ const b=document.createElement('div'); b.className='phase-badge '+p.cls; b.id='pb-'+p.id; b.innerHTML=`<span class="pb-emoji">${p.emoji}</span><span class="pb-name">${p.name}</span><span class="pb-days"></span>`; c.appendChild(b); });
}

function getPhaseIdx(day,total){ const r=total/28; if(day<=Math.round(5*r)) return 0; if(day<=Math.round(13*r)) return 1; if(day<=Math.round(14*r)) return 2; return 3; }

function drawCycleWheel(day,total) {
    const canvas=document.getElementById('cycleWheelCanvas'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2;
    const R=Math.min(W,H)/2-14, rIn=R*.48;
    ctx.clearRect(0,0,W,H);
    const r=total/28;
    const bounds=[Math.round(5*r),Math.round(13*r),Math.round(14*r),total];
    const active=getPhaseIdx(day,total);
    let angle=-Math.PI/2;
    WHEEL_PHASES.forEach((ph,i)=>{
        const segDays=bounds[i]-(i===0?0:bounds[i-1]);
        const segAngle=(segDays/total)*Math.PI*2;
        const isA=i===active;
        const oR=isA?R+8:R, iR=isA?rIn-5:rIn;
        ctx.beginPath(); ctx.arc(cx,cy,oR,angle,angle+segAngle-.03); ctx.arc(cx,cy,iR,angle+segAngle-.03,angle,true); ctx.closePath();
        ctx.fillStyle=WHEEL_COLORS[i]; ctx.fill();
        ctx.strokeStyle=isA?WHEEL_BORDERS[i]:'rgba(255,255,255,.6)'; ctx.lineWidth=isA?2.5:1.5; ctx.stroke();
        const midA=angle+segAngle/2, eR=(oR+iR)/2;
        ctx.font=`${isA?20:17}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(ph.emoji, cx+Math.cos(midA)*eR, cy+Math.sin(midA)*eR);
        const start=i===0?1:bounds[i-1]+1;
        const badge=document.getElementById('pb-'+ph.id);
        if(badge){ badge.querySelector('.pb-days').textContent=start===bounds[i]?`Day ${start}`:`Days ${start}–${bounds[i]}`; badge.classList.toggle('active',isA); }
        angle+=segAngle;
    });
    ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fillStyle='#e85d8a'; ctx.fill();
    const dayFrac=(day-1)/total, mA=-Math.PI/2+dayFrac*Math.PI*2;
    const mR=R+16, mx=cx+Math.cos(mA)*mR, my=cy+Math.sin(mA)*mR;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(mA)*(rIn-2),cy+Math.sin(mA)*(rIn-2)); ctx.lineTo(cx+Math.cos(mA)*(R+3),cy+Math.sin(mA)*(R+3));
    ctx.strokeStyle='#e85d8a'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(mx,my,11,0,Math.PI*2); ctx.fillStyle='#e85d8a'; ctx.fill();
    ctx.fillStyle='white'; ctx.font='bold 9px Raleway,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(day,mx,my);
    ctx.fillStyle='#e85d8a'; ctx.font=`bold 22px Parisienne,cursive`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Day '+day,cx,cy-9);
    ctx.fillStyle='#9e6d80'; ctx.font='11px Raleway,sans-serif'; ctx.fillText('of '+total,cx,cy+10);
}

function renderCyclePhase() {
    const panel=document.getElementById('cyclePhasePanel'); if(!panel) return;
    if(periodData.length===0){ panel.style.display='none'; return; }
    panel.style.display='block';
    buildPhaseBadges();
    const ci=document.getElementById('cycleLengthInput');
    const cycleLen=parseInt(ci?.value||'28')||28;
    const sorted=[...periodData].sort((a,b)=>new Date(b.startDate)-new Date(a.startDate));
    const lastStart=new Date(sorted[0].startDate+'T00:00:00');
    const today=new Date(); today.setHours(0,0,0,0);
    const raw=Math.floor((today-lastStart)/86400000)+1;
    const day=Math.max(1,Math.min(raw,cycleLen+5));
    drawCycleWheel(day,cycleLen);
    const pi=getPhaseIdx(day,cycleLen), ph=WHEEL_PHASES[pi];
    const tl=document.getElementById('phaseTipLabel');
    const tt=document.getElementById('phaseTipText');
    if(tl) tl.textContent=ph.emoji+' '+ph.name+' phase · Day '+day+' of '+cycleLen;
    if(tt) tt.textContent=ph.tip;
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
        img.className='j-img'; img.src=item.img; img.alt=item.title;
        img.onerror=()=>{
            const fb=document.createElement('div'); fb.className='j-img-fallback'; fb.textContent='📷';
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
        thumb.className='f-thumb'+(idx===0?' active':'');
        thumb.onclick=()=>goToSlide(idx);

        const ti=document.createElement('img');
        ti.className='f-thumb-img'; ti.src=item.img; ti.alt=item.title;
        ti.onerror=()=>{ const fb=document.createElement('div'); fb.className='f-thumb-fallback'; fb.textContent='📷'; ti.replaceWith(fb); };

        const tt=document.createElement('div'); tt.className='f-thumb-title'; tt.textContent=item.title;
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
    const thumbs=document.querySelectorAll('.f-thumb');
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
function endSlasherGame(){ slasherGameRunning=false; if(slasherScore>gameHighScores.slasher){gameHighScores.slasher=slasherScore;saveHighScores();showCustomPopup('BOOM! 💥','New High Score: '+slasherScore+'! 🏆');}else showCustomPopup('BOOM! 💥','Game over. Score: '+slasherScore); document.getElementById('slasherStartOverlay').style.display='flex'; }


// ══════════════════════════════════════════════════════════════
//  MUSIC PLAYER  (real HTML5 audio from assets/music/)
// ══════════════════════════════════════════════════════════════

function showMusicPill() {
    const pill=document.getElementById('musicTogglePill');
    if(pill) pill.style.display='block';
}

function toggleMusicPlayer() {
    const player=document.getElementById('musicPlayer');
    const pill=document.getElementById('musicTogglePill');
    musicPlayerOpen=!musicPlayerOpen;
    if(player) player.style.display=musicPlayerOpen?'flex':'none';
    if(pill)   pill.style.display=musicPlayerOpen?'none':'block';
    if(musicPlayerOpen && musicPlaylist.length===0) loadPlaylist();
}

async function loadPlaylist() {
    try {
        const res=await fetch('assets/music/playlist.json');
        const files=await res.json();
        // Filter to audio files only
        musicPlaylist=files.filter(f=>/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(f));
    } catch(e) {
        musicPlaylist=[];
    }
    if(musicPlaylist.length===0){
        musicPlaylist=['example_song.mp3'];
        document.getElementById('musicTitle').textContent='No songs found';
        document.getElementById('musicArtist').textContent='Add .mp3 files and update playlist.json';
    }
    musicIdx=0;
    loadTrack(musicIdx);
}

function loadTrack(idx) {
    if(musicPlaylist.length===0) return;
    const audio=document.getElementById('audioEl');
    const filename=musicPlaylist[idx];
    audio.src='assets/music/'+filename;
    audio.volume=parseFloat(document.getElementById('musicVolSlider')?.value||'0.8');

    // Display
    document.getElementById('musicTitle').textContent=fileToTitle(filename);
    document.getElementById('musicArtist').textContent='♪ ' + filename;
    document.getElementById('musicPlay').textContent='▶';
    document.getElementById('musicProgressFill').style.width='0%';
    document.getElementById('musicTimeEl').textContent='0:00';
    document.getElementById('musicDurEl').textContent='0:00';
    document.getElementById('musicCover').classList.remove('spinning');
}

function musicToggle() {
    const audio=document.getElementById('audioEl');
    const playBtn=document.getElementById('musicPlay');
    const cover=document.getElementById('musicCover');

    if(musicPlaylist.length===0){ loadPlaylist(); return; }

    if(audio.paused) {
        audio.play().then(()=>{
            playBtn.textContent='⏸'; cover.classList.add('spinning');
        }).catch(e=>{
            showCustomPopup('Playback error', 'Could not play audio. Make sure the file exists in assets/music/');
        });
    } else {
        audio.pause(); playBtn.textContent='▶'; cover.classList.remove('spinning');
    }
}

function pauseAudio() {
    const audio=document.getElementById('audioEl');
    if(audio&&!audio.paused) audio.pause();
}

function musicNext() {
    if(musicPlaylist.length===0) return;
    musicIdx=(musicIdx+1)%musicPlaylist.length;
    loadTrack(musicIdx);
    const audio=document.getElementById('audioEl');
    audio.play().then(()=>{ document.getElementById('musicPlay').textContent='⏸'; document.getElementById('musicCover').classList.add('spinning'); }).catch(()=>{});
}

function musicPrev() {
    if(musicPlaylist.length===0) return;
    const audio=document.getElementById('audioEl');
    // If >3s in, restart current; otherwise go back
    if(audio.currentTime>3){ audio.currentTime=0; return; }
    musicIdx=(musicIdx-1+musicPlaylist.length)%musicPlaylist.length;
    loadTrack(musicIdx);
    audio.play().then(()=>{ document.getElementById('musicPlay').textContent='⏸'; document.getElementById('musicCover').classList.add('spinning'); }).catch(()=>{});
}


// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', ()=>{
    loadTheme();
    checkLoginStatus();
    if(!currentUser) createFloatingEmojis();

    // Diary calendar nav
    const pb=document.getElementById('prevMonthBtn');
    const nb=document.getElementById('nextMonthBtn');
    if(pb) pb.onclick=()=>{ calendarCurrentDate.setMonth(calendarCurrentDate.getMonth()-1); fetchDiaryEntries().then(()=>renderCalendar(calendarCurrentDate)); };
    if(nb) nb.onclick=()=>{ calendarCurrentDate.setMonth(calendarCurrentDate.getMonth()+1); fetchDiaryEntries().then(()=>renderCalendar(calendarCurrentDate)); };

    document.getElementById('themeToggle').onclick=toggleTheme;

    const ci=document.getElementById('cycleLengthInput');
    if(ci) ci.addEventListener('change',()=>{ localStorage.setItem('periodCycleLength',ci.value); loadPeriodTracker(); });

    // Audio event listeners
    const audio=document.getElementById('audioEl');
    if(audio){
        audio.addEventListener('timeupdate',()=>{
            if(!audio.duration||!isFinite(audio.duration)) return;
            const pct=(audio.currentTime/audio.duration)*100;
            const fill=document.getElementById('musicProgressFill');
            if(fill) fill.style.width=pct+'%';
            const tel=document.getElementById('musicTimeEl');
            if(tel) tel.textContent=fmtTime(audio.currentTime);
        });
        audio.addEventListener('loadedmetadata',()=>{
            const del=document.getElementById('musicDurEl');
            if(del) del.textContent=fmtTime(audio.duration);
        });
        audio.addEventListener('ended',()=>{
            document.getElementById('musicPlay').textContent='▶';
            document.getElementById('musicCover').classList.remove('spinning');
            musicNext();
        });
        audio.addEventListener('error',()=>{
            document.getElementById('musicPlay').textContent='▶';
            document.getElementById('musicCover').classList.remove('spinning');
            document.getElementById('musicArtist').textContent='⚠ File not found';
        });

        // Volume slider
        const vol=document.getElementById('musicVolSlider');
        if(vol) vol.addEventListener('input',()=>{ audio.volume=parseFloat(vol.value); });

        // Progress bar seek
        const bar=document.getElementById('musicProgressBar');
        if(bar) bar.addEventListener('click',e=>{ if(!audio.duration||!isFinite(audio.duration)) return; const r=bar.getBoundingClientRect(); audio.currentTime=(e.clientX-r.left)/r.width*audio.duration; });
    }
});

// Prevent double-tap zoom
let lastTouch=0;
document.addEventListener('touchend', e=>{ const now=Date.now(); if(now-lastTouch<300) e.preventDefault(); lastTouch=now; },{passive:false});
