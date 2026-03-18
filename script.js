// ═══════════════════════════════════════════════════════════════
//  HAPES PORTAL — script.js v2
//  All bugs fixed · Clean & documented
// ═══════════════════════════════════════════════════════════════

// ── Google Sheets backend URL ──────────────────────────────────
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// ── App State ──────────────────────────────────────────────────
let currentUser       = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion    = '';
let calendarCurrentDate = new Date();
let periodCalendarDate  = new Date();
let diaryEntries      = {};
let periodData        = [];
let usedDares         = [];
let selectedMood      = null;

// ── Game State ─────────────────────────────────────────────────
const usePhotoAssets  = true;
let memMoves = 0, memLock = false, memHasFlippedCard = false;
let memFirstCard, memSecondCard;
let catchGameRunning = false, catchScore = 0, catchLoopId;
let slasherGameRunning = false, slasherScore = 0, slasherLoopId;
let gameHighScores = { memory: Infinity, catch: 0, slasher: 0 };

// ── Timeline Data ──────────────────────────────────────────────
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData')) || [];
if (timelineData.length === 0) {
    timelineData = [
        { date: '2023-01-01', title: 'Where it began',  img: 'assets/Timeline/1.jpg', desc: 'The start of us.' },
        { date: '2023-02-14', title: "Valentine's Day",  img: 'assets/Timeline/2.jpg', desc: 'Our first V-day together.' },
        { date: '2023-06-10', title: 'Summer Memories',  img: 'assets/Timeline/3.jpg', desc: 'Sun, laughter, and us.' },
        { date: '2023-12-31', title: 'New Year, Us',     img: 'assets/Timeline/4.jpg', desc: 'Welcoming the year together.' },
    ];
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
}

// ── Dares List ─────────────────────────────────────────────────
const coupleDares = [
    "Give your partner a slow, sensual massage on their neck and shoulders for 5 minutes.",
    "Whisper three things you find most attractive about your partner into their ear.",
    "Blindfold your partner and tease them with light touches for 2 minutes.",
    "Choose a song and give your partner a private slow dance.",
    "Write a short, sweet compliment and have your partner read it aloud.",
    "Feed your partner a strawberry in the most romantic way.",
    "Kiss your partner passionately for at least 60 seconds.",
    "Take turns tracing words of affection on each other's backs.",
    "Share a secret dream or wish you've had for your future together.",
    "Sit facing each other, knees touching, maintain eye contact for 2 minutes.",
    "Give your partner a lingering kiss on their collarbone.",
    "Lie down together and cuddle with soft kisses for 5 minutes.",
    "Recreate your very first kiss with your partner.",
    "Give your partner a sensual foot massage.",
    "Take turns giving each other eskimo and butterfly kisses.",
    "Whisper your partner's name softly while looking deep into their eyes.",
    "Set a timer for 3 minutes and communicate only with gentle touches.",
    "Give your partner a 'once-over' admiring look and describe what you see.",
    "Tease your partner by almost kissing them several times before finally kissing.",
    "Describe your partner's favourite feature and why you love it.",
    "Kiss each of your partner's fingertips, one by one, very slowly.",
    "Close your eyes and describe your ideal romantic evening together.",
    "Role-play: One is a movie star, the other is an adoring fan.",
    "Take a silly selfie together, then a romantic one.",
    "Spend 5 minutes only exchanging compliments.",
    "Dare your partner to make you smile with just words.",
    "Write 'I love you' on your partner's palm with your finger.",
    "Hug your partner from behind and whisper something sweet.",
    "Tell your partner the exact moment you knew you were falling for them.",
    "Plan a surprise mini-date for some time this week.",
    "Recreate a favourite photo you've taken together.",
    "Read a favourite poem or quote to each other.",
    "Describe your partner in exactly 10 words — make them good ones.",
    "Exchange heartfelt 'I love you because...' statements for 2 minutes.",
    "Hold hands and take turns sharing a favourite memory together.",
    "Write your partner a 3-sentence love note right now.",
    "Name 5 things you're grateful for about your partner.",
    "Both stare into each other's eyes silently for 1 full minute.",
    "Give your partner the longest hug you've ever given them.",
    "Plan one thing you both want to do or experience together this month."
];


// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Returns a local date string "YYYY-MM-DD" without UTC shifting.
 * BUG FIX: date.toISOString() uses UTC, causing off-by-one errors for
 * users in timezones ahead of UTC. This function uses local time instead.
 */
function localDateStr(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Returns today as a local "YYYY-MM-DD" string */
function todayStr() {
    return localDateStr(new Date());
}


// ═══════════════════════════════════════════════════════════════
//  TIMELINE
// ═══════════════════════════════════════════════════════════════

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...timelineData].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); padding:40px; text-align:center;">No memories yet — add your first one! 📸</p>';
        return;
    }

    sorted.forEach((item, idx) => {
        // Find original index for edit/delete
        const origIdx = timelineData.indexOf(item);

        const card = document.createElement('div');
        card.className = 'polaroid-card';
        const rotation = (Math.random() * 6 - 3).toFixed(1);
        card.style.setProperty('--rotation', `${rotation}deg`);

        const imgWrap = document.createElement('div');
        imgWrap.className = 'polaroid-img-container';

        const img = document.createElement('img');
        img.src = item.img;
        img.alt = item.title;
        img.onerror = () => {
            imgWrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3em;color:var(--text-muted);">📷</div>';
        };
        imgWrap.appendChild(img);

        const dateEl = document.createElement('div');
        dateEl.className = 'timeline-date';
        const d = new Date(item.date + 'T00:00:00'); // force local parse
        dateEl.textContent = isNaN(d) ? item.date : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const titleEl = document.createElement('div');
        titleEl.className = 'timeline-title';
        titleEl.textContent = item.title;

        card.appendChild(imgWrap);
        card.appendChild(dateEl);
        card.appendChild(titleEl);
        card.onclick = () => openMemoryModal(item, origIdx);
        container.appendChild(card);
    });
}

function openMemoryModal(item, index) {
    const modal = document.getElementById('memoryModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalImg').src = item.img;
    document.getElementById('modalDesc').textContent = item.desc || 'No description.';

    const actionsDiv = document.getElementById('modalActions');
    actionsDiv.innerHTML = `
        <button class="edit-btn" onclick="prepareEditMemory(${index})">Edit ✏️</button>
        <button class="delete-btn" onclick="deleteMemory(${index})">Delete 🗑️</button>
    `;
    modal.style.display = 'flex';
}

function closeMemoryModal() { document.getElementById('memoryModal').style.display = 'none'; }

function openAddMemoryModal(isEdit = false) {
    const title = document.getElementById('addModalTitle');
    const indexInput = document.getElementById('editIndex');
    if (!isEdit) {
        title.textContent = 'Add New Memory 📝';
        indexInput.value = '-1';
        ['newMemTitle', 'newMemDate', 'newMemImgNum', 'newMemDesc'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } else {
        title.textContent = 'Edit Memory ✏️';
    }
    document.getElementById('addMemoryModal').style.display = 'flex';
}

function closeAddMemoryModal() { document.getElementById('addMemoryModal').style.display = 'none'; }

function prepareEditMemory(index) {
    closeMemoryModal();
    const item = timelineData[index];
    if (!item) return;

    let imgNum = '';
    if (item.img) {
        const match = item.img.match(/Timeline\/(\d+)\.jpg/i);
        if (match) imgNum = match[1];
    }

    document.getElementById('newMemTitle').value   = item.title;
    document.getElementById('newMemDate').value    = item.date;
    document.getElementById('newMemImgNum').value  = imgNum;
    document.getElementById('newMemDesc').value    = item.desc;
    document.getElementById('editIndex').value     = index;
    openAddMemoryModal(true);
}

function deleteMemory(index) {
    showCustomPopup('Delete Memory?', 'This cannot be undone. Are you sure?', null, (confirmed) => {
        if (!confirmed) return;
        timelineData.splice(index, 1);
        localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
        closeMemoryModal();
        renderTimeline();
        showCustomPopup('Deleted', 'Memory removed. 🗑️');
    });
}

function saveNewMemory() {
    const title   = document.getElementById('newMemTitle').value.trim();
    const date    = document.getElementById('newMemDate').value;
    const imgNum  = document.getElementById('newMemImgNum').value.trim();
    const desc    = document.getElementById('newMemDesc').value.trim();
    const editIdx = parseInt(document.getElementById('editIndex').value);

    if (!title || !date || !imgNum) {
        showCustomPopup('Missing info', 'Please fill in Title, Date, and Image Number.');
        return;
    }

    const entry = { title, date, img: `assets/Timeline/${imgNum}.jpg`, desc };

    if (isNaN(editIdx) || editIdx === -1) {
        timelineData.push(entry);
        showCustomPopup('Saved! 🌸', 'New memory added to your lane.');
    } else {
        timelineData[editIdx] = entry;
        showCustomPopup('Updated! ✨', 'Memory edited successfully.');
    }

    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
    renderTimeline();
    closeAddMemoryModal();
}


// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

function login(userName) {
    if (userName !== 'Chikoo' && userName !== 'Prath') {
        showCustomPopup('Error', 'Invalid user.'); return;
    }
    currentUser = userName;
    localStorage.setItem(SCRIPT_USER_KEY, currentUser);
    updateUserDisplay();

    document.getElementById('loginContainer').style.display = 'none';
    const appEl = document.getElementById('appContainer');
    appEl.style.display = 'block';

    navigateToApp('homeScreen');
    createFloatingEmojis();

    setTimeout(() => {
        const header = document.querySelector('.main-title');
        if (header) releaseButterflies(header);
    }, 400);
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('floatingBg').innerHTML = '';
}

function updateUserDisplay() {
    const avatarEl = document.getElementById('userAvatarEmoji');
    const nameEl   = document.getElementById('loggedInUserDisplay');
    if (avatarEl) avatarEl.textContent = currentUser === 'Prath' ? '🐼' : '🐰';
    if (nameEl)   nameEl.textContent   = currentUser || 'Guest';

    document.querySelectorAll('.dynamicUserName').forEach(el => {
        el.textContent = currentUser || 'love';
    });

    // Update home greeting
    const greetEl = document.getElementById('homeGreeting');
    if (greetEl && currentUser) {
        const hour = new Date().getHours();
        let time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        greetEl.textContent = `${time}, ${currentUser} 💕`;
    }

    // Footer date
    const footerDate = document.getElementById('footerDate');
    if (footerDate) {
        footerDate.textContent = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    }
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        navigateToApp('homeScreen');
    }

    const storedScores = localStorage.getItem('hetuApp_highscores');
    if (storedScores) {
        try { gameHighScores = JSON.parse(storedScores); } catch(e) {}
    }
    updateHighScoreDisplays();
}


// ═══════════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════════

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}


// ═══════════════════════════════════════════════════════════════
//  BACKGROUND EFFECTS
// ═══════════════════════════════════════════════════════════════

function createFloatingEmojis() {
    const container = document.getElementById('floatingBg');
    container.innerHTML = '';
    const emojis = ['💖','💕','💗','🐰','🦋','🌸','🌼','✨','🌹','🐇','💝','🫶'];
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'floating-emoji';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left            = Math.random() * 100 + '%';
        el.style.top             = Math.random() * 100 + '%';
        el.style.animationDelay  = Math.random() * 8 + 's';
        el.style.animationDuration = (7 + Math.random() * 7) + 's';
        el.style.fontSize        = (1.2 + Math.random() * 0.8) + 'em';
        container.appendChild(el);
    }
}

function releaseButterflies(element) {
    if (!element) return;
    const rect    = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top  + rect.height / 2;

    for (let i = 0; i < 7; i++) {
        const b = document.createElement('div');
        b.className = 'butterfly';
        b.textContent = '🦋';
        b.style.setProperty('--tx', (Math.random() - 0.5) * 220 + 'px');
        b.style.left      = centerX + 'px';
        b.style.top       = centerY + 'px';
        b.style.animation = `butterflyFly 2.2s ease-out forwards ${Math.random() * 0.4}s`;
        document.body.appendChild(b);
        setTimeout(() => b.remove(), 3000);
    }
}


// ═══════════════════════════════════════════════════════════════
//  CUSTOM POPUP (replaces alert/confirm)
// ═══════════════════════════════════════════════════════════════

function showCustomPopup(title, message, inputPlaceholder = null, callback = null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p => p.remove());

    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'custom-popup';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const msgEl = document.createElement('p');
    msgEl.style.whiteSpace = 'pre-line';
    msgEl.textContent = message;

    popup.appendChild(titleEl);
    popup.appendChild(msgEl);

    let inputEl = null;
    if (inputPlaceholder) {
        inputEl = document.createElement('textarea');
        inputEl.rows = 3;
        inputEl.placeholder = inputPlaceholder;
        popup.appendChild(inputEl);
    }

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:10px; justify-content:center; margin-top:14px;';

    if (callback) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = '#ccc';
        cancelBtn.style.color = '#555';
        cancelBtn.onclick = () => { overlay.remove(); callback(null); };

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = inputPlaceholder ? 'Submit' : 'OK';
        confirmBtn.onclick = () => { overlay.remove(); callback(inputEl ? inputEl.value : true); };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.onclick = () => overlay.remove();
        btnRow.appendChild(okBtn);
    }

    popup.appendChild(btnRow);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    if (inputEl) inputEl.focus();
}


// ═══════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════

function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'homeScreen') {
        showCustomPopup('Session Expired', 'Please log in again.');
        logout(); return;
    }

    // Stop active games
    quitGame(false);

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (!target) { showCustomPopup('Oops', 'Screen not found.'); return; }
    target.classList.add('active');

    // Screen-specific init
    switch (screenId) {
        case 'feelingsPortalScreen':
            navigateToFeelingsPage('feelingsPage1'); break;
        case 'diaryScreen':
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
                navigateToDiaryPage('diaryCalendarPage');
            }); break;
        case 'dareGameScreen':
            if (usedDares.length === coupleDares.length) usedDares = [];
            document.getElementById('dareText').textContent = 'Ready for a dare? Press the button!';
            break;
        case 'periodTrackerScreen':
            loadPeriodTracker(); break;
        case 'gameHubScreen':
            updateHighScoreDisplays(); break;
        case 'timelineScreen':
            renderTimeline(); break;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function quitGame(navigate = true) {
    catchGameRunning  = false;
    slasherGameRunning = false;
    cancelAnimationFrame(catchLoopId);
    cancelAnimationFrame(slasherLoopId);
    if (navigate) navigateToApp('gameHubScreen');
}


// ═══════════════════════════════════════════════════════════════
//  FEELINGS PORTAL
// ═══════════════════════════════════════════════════════════════

function navigateToFeelingsPage(pageId, emotion = '') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (!target) return;
    target.classList.add('active');

    if (emotion) currentEmotion = emotion;
    if (pageId === 'feelingsPage2' && currentEmotion) {
        const heading = document.getElementById('feelingsPage2Title');
        if (heading) heading.textContent = `You're feeling ${currentEmotion}. What's on your mind, ${currentUser}?`;
    }
}

function submitFeelingsEntry() {
    if (!currentUser) return;
    const message = document.getElementById('feelingsMessage').value.trim();
    if (!currentEmotion || !message) {
        showCustomPopup('Incomplete', 'Please select how you feel and write your thoughts.'); return;
    }

    const btn = document.getElementById('submitFeelingsBtn');
    releaseButterflies(btn);
    btn.disabled = true; btn.textContent = 'Sending...';

    const fd = new FormData();
    fd.append('formType', 'feelingsEntry');
    fd.append('emotion', currentEmotion);
    fd.append('message', message);
    fd.append('submittedBy', currentUser);

    fetch(scriptURL, { method: 'POST', body: fd, mode: 'cors' })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('feelingsMessage').value = '';
                navigateToFeelingsPage('feelingsPage3');
            } else { throw new Error(data.message); }
        })
        .catch(err => showCustomPopup('Error', 'Could not submit: ' + err.message))
        .finally(() => { btn.disabled = false; btn.textContent = 'Send it 💌'; });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) return;
    const list = document.getElementById('feelingsEntriesList');
    list.innerHTML = '<p class="loading-text">Loading entries...</p>';

    try {
        const res  = await fetch(`${scriptURL}?action=getFeelingsEntries`, { mode: 'cors' });
        const data = await res.json();

        if (data.status === 'success' && data.data?.length > 0) {
            list.innerHTML = '';
            const table = document.createElement('table');
            table.className = 'feelings-table';

            const thead = table.createTHead();
            const hr = thead.insertRow();
            ['Date', 'By', 'Feeling', 'Message', 'Reply'].forEach(t => {
                const th = document.createElement('th');
                th.textContent = t; hr.appendChild(th);
            });

            const tbody = table.createTBody();
            data.data.forEach(entry => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
                    <td><strong>${entry.submittedBy || 'Unknown'}</strong></td>
                    <td><span class="emotion-tag ${(entry.emotion || '').toLowerCase()}">${entry.emotion || 'N/A'}</span></td>
                    <td>${entry.message || '—'}</td>
                    <td></td>
                `;
                const replyCell = row.cells[4];
                if (entry.repliedBy && entry.replyMessage) {
                    replyCell.innerHTML = `
                        <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                            <strong>${entry.repliedBy}:</strong> ${entry.replyMessage}
                            <div class="reply-timestamp">${new Date(entry.replyTimestamp).toLocaleDateString()}</div>
                        </div>`;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 📮';
                    replyBtn.className = 'reply-btn';
                    replyBtn.onclick = () => showCustomPopup(
                        `Reply to ${entry.submittedBy}`,
                        `"${entry.message}"`,
                        'Your reply...',
                        (txt) => { if (txt) submitReply('feeling', entry.timestamp, txt, replyBtn); }
                    );
                    replyCell.appendChild(replyBtn);
                }
            });

            list.appendChild(table);
        } else {
            list.innerHTML = '<p class="loading-text">No feelings entries yet 💕</p>';
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (err) {
        list.innerHTML = `<p class="loading-text">Error: ${err.message}</p>`;
    }
}


// ═══════════════════════════════════════════════════════════════
//  DIARY
// ═══════════════════════════════════════════════════════════════

function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
}

async function fetchDiaryEntries() {
    if (!currentUser) return;
    try {
        const res  = await fetch(`${scriptURL}?action=getDiaryEntries`, { mode: 'cors' });
        const data = await res.json();
        diaryEntries = {};
        if (data.status === 'success' && data.data) {
            data.data.forEach(entry => { diaryEntries[entry.date] = entry; });
        }
    } catch (e) { console.warn('Could not fetch diary entries:', e.message); }
}

function renderCalendar(date) {
    const grid      = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');
    if (!grid || !monthYear) return;

    grid.innerHTML = '';
    const month = date.getMonth();
    const year  = date.getFullYear();
    monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today       = todayStr(); // BUG FIX: local date string

    // Day headers
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'calendar-day-header';
        h.textContent = d;
        grid.appendChild(h);
    });

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day empty';
        grid.appendChild(e);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const cell    = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = day;
        cell.dataset.date = dateStr;

        if (dateStr === today) cell.classList.add('today');
        if (diaryEntries[dateStr]) cell.classList.add('has-entry');

        cell.addEventListener('click', () => {
            diaryEntries[dateStr] ? viewDiaryEntry(dateStr) : openDiaryEntry(dateStr);
        });
        grid.appendChild(cell);
    }
}

function openDiaryEntry(dateStr) {
    document.getElementById('selectedDate').value = dateStr;
    // BUG FIX: append T00:00:00 so Date() uses local timezone
    const d = new Date(dateStr + 'T00:00:00');
    document.getElementById('diaryDateDisplay').textContent  = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('diaryEntryTitle').textContent   = d.toLocaleDateString('en-US', { month:'long', day:'numeric' });
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateStr) {
    const entry = diaryEntries[dateStr];
    if (!entry) return;

    const d = new Date(dateStr + 'T00:00:00');
    document.getElementById('viewDiaryDateDisplay').textContent = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('viewDiaryThoughts').textContent    = entry.thoughts || 'No thoughts recorded.';
    document.getElementById('diaryEntryAttribution').innerHTML  = `<em>Written by ${entry.submittedBy || 'Unknown'}</em>`;

    const replySection = document.getElementById('diaryViewPageReplySection');
    replySection.innerHTML = '';
    if (entry.repliedBy && entry.replyMessage) {
        replySection.innerHTML = `
            <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                <strong>${entry.repliedBy} replied:</strong> ${entry.replyMessage}
                <div class="reply-timestamp">${new Date(entry.replyTimestamp).toLocaleDateString()}</div>
            </div>`;
    } else {
        const btn = document.createElement('button');
        btn.textContent = 'Reply 📮';
        btn.className = 'reply-btn';
        btn.onclick = () => showCustomPopup(
            'Reply to Diary Entry',
            `"${entry.thoughts}"`,
            'Your reply...',
            (txt) => { if (txt) submitReply('diary', dateStr, txt, btn); }
        );
        replySection.appendChild(btn);
    }
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    if (!currentUser) return;
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date     = document.getElementById('selectedDate').value;
    if (!thoughts) { showCustomPopup('Empty!', 'Please write something first 📓'); return; }

    const btn = document.getElementById('saveDiaryBtn');
    releaseButterflies(btn);
    btn.disabled = true; btn.textContent = 'Saving...';

    const fd = new FormData();
    fd.append('formType', 'diaryEntry');
    fd.append('date', date);
    fd.append('thoughts', thoughts);
    fd.append('submittedBy', currentUser);

    fetch(scriptURL, { method: 'POST', body: fd, mode: 'cors' })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                return fetchDiaryEntries().then(() => {
                    renderCalendar(calendarCurrentDate);
                    navigateToDiaryPage('diaryConfirmationPage');
                });
            } else { throw new Error(data.message); }
        })
        .catch(err => showCustomPopup('Error', 'Could not save: ' + err.message))
        .finally(() => { btn.disabled = false; btn.textContent = 'Save Entry 💾'; });
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) return;
    const list = document.getElementById('allDiaryEntriesList');
    list.innerHTML = '<p class="loading-text">Loading...</p>';

    try {
        const res  = await fetch(`${scriptURL}?action=getDiaryEntries`, { mode: 'cors' });
        const data = await res.json();

        if (data.status === 'success' && data.data?.length > 0) {
            list.innerHTML = '';
            const sorted = [...data.data].sort((a,b) => new Date(b.date) - new Date(a.date));

            sorted.forEach(entry => {
                const d         = new Date(entry.date + 'T00:00:00');
                const formatted = d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
                const div = document.createElement('div');
                div.className = 'diary-entry-list-item';
                div.innerHTML = `
                    <h3>${formatted}</h3>
                    <div class="entry-meta-info">Written by <strong>${entry.submittedBy || 'Unknown'}</strong></div>
                    <p class="entry-content">${entry.thoughts || 'No content.'}</p>
                `;
                if (entry.repliedBy && entry.replyMessage) {
                    div.innerHTML += `
                        <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                            <strong>${entry.repliedBy}:</strong> ${entry.replyMessage}
                            <div class="reply-timestamp">${new Date(entry.replyTimestamp).toLocaleDateString()}</div>
                        </div>`;
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = 'Reply 📮';
                    btn.className = 'reply-btn';
                    btn.onclick = () => showCustomPopup(
                        'Reply to Entry',
                        `"${entry.thoughts}"`,
                        'Write your reply...',
                        (txt) => { if (txt) submitReply('diary', entry.date, txt, btn); }
                    );
                    div.appendChild(btn);
                }
                list.appendChild(div);
            });
        } else {
            list.innerHTML = '<p class="loading-text">No diary entries yet. Start writing! 📝</p>';
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (err) {
        list.innerHTML = `<p class="loading-text">Error: ${err.message}</p>`;
    }
}


// ── Reply ──────────────────────────────────────────────────────

async function submitReply(entryType, entryId, replyMessage, btn) {
    if (!currentUser || !replyMessage.trim()) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    const fd = new FormData();
    fd.append('formType', 'replyEntry');
    fd.append('entryType', entryType);
    fd.append('entryIdentifier', entryId);
    fd.append('replyMessage', replyMessage.trim());
    fd.append('repliedBy', currentUser);

    try {
        const res  = await fetch(scriptURL, { method:'POST', body: fd, mode:'cors' });
        const data = await res.json();
        if (data.status === 'success') {
            showCustomPopup('Sent! 📮', 'Your reply was delivered.');
            if (entryType === 'feeling') {
                fetchAndDisplayFeelingsEntries();
            } else {
                await fetchDiaryEntries();
                renderCalendar(calendarCurrentDate);
                if (document.getElementById('allDiaryEntriesPage')?.classList.contains('active')) {
                    fetchAndDisplayAllDiaryEntries();
                }
            }
        } else { throw new Error(data.message); }
    } catch (err) {
        showCustomPopup('Error', 'Could not send reply: ' + err.message);
        if (btn) { btn.disabled = false; btn.textContent = 'Reply 📮'; }
    }
}


// ═══════════════════════════════════════════════════════════════
//  DARE GAME
// ═══════════════════════════════════════════════════════════════

function generateDare() {
    if (!currentUser) return;
    if (usedDares.length >= coupleDares.length) {
        usedDares = [];
        showCustomPopup('All Dares Done! 🎉', 'You\'ve gone through all the dares! Starting over...');
    }
    const available = coupleDares.filter(d => !usedDares.includes(d));
    const dare = available[Math.floor(Math.random() * available.length)];
    usedDares.push(dare);

    const el = document.getElementById('dareText');
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = dare; el.style.opacity = '1'; el.style.transition = 'opacity 0.4s'; }, 150);
}


// ═══════════════════════════════════════════════════════════════
//  PERIOD TRACKER (All bugs fixed)
// ═══════════════════════════════════════════════════════════════

/**
 * BUG FIX: selectMood now receives the button element directly
 * instead of relying on the implicit `event` global.
 */
function selectMood(mood, btnEl) {
    document.querySelectorAll('.mood-pill').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    selectedMood = mood;
}

function addPeriodEntry() {
    const startDate = document.getElementById('periodStartDate').value;
    const endDate   = document.getElementById('periodEndDate').value || startDate;

    if (!startDate) {
        showCustomPopup('Missing Date', 'Please select at least a start date.'); return;
    }

    // Save cycle preference
    const cycleInput = document.getElementById('cycleLengthInput');
    if (cycleInput) localStorage.setItem('periodCycleLength', cycleInput.value);

    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    periodData.push({
        startDate, endDate,
        mood: selectedMood,
        loggedBy: currentUser,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('periodData', JSON.stringify(periodData));

    // Reset form
    document.getElementById('periodStartDate').value = '';
    document.getElementById('periodEndDate').value   = '';
    document.querySelectorAll('.mood-pill').forEach(b => b.classList.remove('active'));
    selectedMood = null;

    showCustomPopup('Logged! 🌸', 'Period entry recorded successfully.');
    loadPeriodTracker();
}

function loadPeriodTracker() {
    // Load saved cycle length
    const savedCycle = localStorage.getItem('periodCycleLength');
    const cycleInput = document.getElementById('cycleLengthInput');
    if (savedCycle && cycleInput) cycleInput.value = savedCycle;

    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');

    const statusEl  = document.getElementById('periodStatus');
    const nextInfoEl = document.getElementById('nextPeriodInfo');
    const iconEl     = document.getElementById('periodStatusIcon');

    if (periodData.length === 0) {
        statusEl.textContent = 'No period data recorded yet.';
        nextInfoEl.innerHTML = '';
        iconEl.textContent   = '🌸';
        renderPeriodCalendar();
        renderPeriodHistory();
        return;
    }

    // BUG FIX: use [...periodData].sort() so we don't mutate the original array
    const sorted    = [...periodData].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    const lastPeriod = sorted[0];
    const lastStart  = new Date(lastPeriod.startDate + 'T00:00:00');

    const cycleLength  = parseInt(cycleInput?.value || '28') || 28;
    const nextDate     = new Date(lastStart);
    nextDate.setDate(nextDate.getDate() + cycleLength);

    const today = new Date(); today.setHours(0,0,0,0);
    const daysUntil = Math.ceil((nextDate - today) / 86400000);

    // Status message
    if (daysUntil < 0) {
        iconEl.textContent  = '⚠️';
        statusEl.textContent = 'Period may be late or just starting';
    } else if (daysUntil === 0) {
        iconEl.textContent  = '🔔';
        statusEl.textContent = 'Period expected today!';
    } else if (daysUntil <= 5) {
        iconEl.textContent  = '⚠️';
        statusEl.textContent = `Period expected in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
    } else if (daysUntil <= 14) {
        iconEl.textContent  = '📅';
        statusEl.textContent = `Next period in ${daysUntil} days`;
    } else {
        iconEl.textContent  = '✅';
        statusEl.textContent = `Cycle on track — ${daysUntil} days until next period`;
    }

    nextInfoEl.innerHTML = `
        <strong>Next expected:</strong> ${nextDate.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}<br>
        <strong>Last period:</strong> ${lastStart.toLocaleDateString('en-US', { month:'long', day:'numeric' })}<br>
        <strong>Cycle length:</strong> ${cycleLength} days${lastPeriod.mood ? ` &nbsp;·&nbsp; Mood: ${lastPeriod.mood}` : ''}
    `;

    renderPeriodCalendar();
    renderPeriodHistory();
}

function changePeriodMonth(dir) {
    periodCalendarDate.setMonth(periodCalendarDate.getMonth() + dir);
    renderPeriodCalendar();
}

function renderPeriodCalendar() {
    const grid      = document.getElementById('periodCalendarGrid');
    const monthYear = document.getElementById('periodMonthYear');
    const cycleInput = document.getElementById('cycleLengthInput');
    if (!grid || !monthYear) return;

    grid.innerHTML = '';
    const month = periodCalendarDate.getMonth();
    const year  = periodCalendarDate.getFullYear();
    monthYear.textContent = periodCalendarDate.toLocaleString('default', { month:'long', year:'numeric' });

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today       = todayStr();

    // Headers
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'calendar-day-header';
        h.textContent = d;
        grid.appendChild(h);
    });

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day empty';
        grid.appendChild(e);
    }

    // BUG FIX: sort a copy, not in place
    const cycleLength = parseInt(cycleInput?.value || '28') || 28;
    const sortedData  = [...periodData].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    const lastPeriod  = sortedData[0];

    let nextStart = null, predictionEnd = null;
    if (lastPeriod) {
        nextStart = new Date(lastPeriod.startDate + 'T00:00:00');
        nextStart.setDate(nextStart.getDate() + cycleLength);
        predictionEnd = new Date(nextStart);
        predictionEnd.setDate(predictionEnd.getDate() + 4);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const currentD   = new Date(dateStr + 'T00:00:00');

        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = day;

        // BUG FIX: use local date string comparison throughout
        const isPeriod = periodData.some(entry => {
            const s = new Date(entry.startDate + 'T00:00:00');
            const e = new Date((entry.endDate || entry.startDate) + 'T00:00:00');
            return currentD >= s && currentD <= e;
        });

        if (isPeriod) {
            cell.classList.add('period-day');
        } else if (nextStart && currentD >= nextStart && currentD <= predictionEnd) {
            cell.classList.add('predicted-period');
        }

        if (dateStr === today) cell.classList.add('today');
        grid.appendChild(cell);
    }
}

function renderPeriodHistory() {
    const list   = document.getElementById('periodHistoryList');
    const panel  = document.getElementById('periodHistoryPanel');
    if (!list || !panel) return;

    if (periodData.length === 0) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';

    const sorted = [...periodData].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    const recent = sorted.slice(0, 6);

    list.innerHTML = '';
    recent.forEach((entry, i) => {
        const s = new Date(entry.startDate + 'T00:00:00');
        const e = entry.endDate ? new Date(entry.endDate + 'T00:00:00') : null;

        const isSameDay = !e || localDateStr(s) === localDateStr(e);
        const dateLabel = isSameDay
            ? s.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
            : `${s.toLocaleDateString('en-US', { month:'short', day:'numeric' })} – ${e.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`;

        const item = document.createElement('div');
        item.className = 'period-log-item';
        item.innerHTML = `
            <div class="log-dot"></div>
            <div class="log-info">
                <div class="log-dates">${dateLabel}</div>
                ${entry.mood ? `<div class="log-mood">Mood: ${entry.mood}</div>` : ''}
                ${entry.loggedBy ? `<div class="log-user">Logged by ${entry.loggedBy}</div>` : ''}
            </div>
            <button class="delete-log-btn" onclick="deleteLogEntry(${periodData.indexOf(entry)})" title="Delete">🗑️</button>
        `;
        list.appendChild(item);
    });
}

function deleteLogEntry(index) {
    showCustomPopup('Delete this log?', 'Remove this period entry?', null, (confirmed) => {
        if (!confirmed) return;
        periodData.splice(index, 1);
        localStorage.setItem('periodData', JSON.stringify(periodData));
        loadPeriodTracker();
    });
}


// ═══════════════════════════════════════════════════════════════
//  MISS YOU POPUP
// ═══════════════════════════════════════════════════════════════

function showMissYouPopup() {
    const bunny = document.getElementById('bunnyEmoji');
    if (bunny) { bunny.classList.add('spinning'); }

    setTimeout(() => {
        if (bunny) bunny.classList.remove('spinning');
        const hour = new Date().getHours();
        let msg;
        if (hour >= 5 && hour < 12) {
            msg = "Good morning, sunshine! ☀️\nHope your day is as lovely as you are.";
        } else if (hour >= 22 || hour < 5) {
            msg = "Sweet dreams, my love 🌙\nRest well — I'll be here when you wake up.";
        } else {
            const msgs = [
                "You're my favourite notification 📱",
                "I love you, my chikoo! 🥰",
                "Sending you the warmest virtual hug 🤗",
                "Thinking of you, always ✨",
                "You make every day better 💖",
                "Just wanted to say — you're wonderful 🌸",
                "Missing you extra today 🐰",
            ];
            msg = msgs[Math.floor(Math.random() * msgs.length)];
        }

        document.getElementById('missYouMessage').textContent = msg;
        document.getElementById('missYouPopup').style.display = 'flex';
    }, 1800);
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
}


// ═══════════════════════════════════════════════════════════════
//  GAME ARCADE
// ═══════════════════════════════════════════════════════════════

function updateHighScoreDisplays() {
    const mem = document.getElementById('memHighScore');
    if (mem) mem.textContent = gameHighScores.memory === Infinity ? '—' : gameHighScores.memory + ' moves';
    const cat = document.getElementById('catchHighScore');
    if (cat) cat.textContent = gameHighScores.catch || '0';
    const sla = document.getElementById('slashHighScore');
    if (sla) sla.textContent = gameHighScores.slasher || '0';
}

function saveHighScores() {
    localStorage.setItem('hetuApp_highscores', JSON.stringify(gameHighScores));
    updateHighScoreDisplays();
}


// ── Memory Match ──────────────────────────────────────────────

function startMemoryGame() {
    navigateToApp('memoryGameScreen');
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memMoves = 0;
    document.getElementById('memoryMoves').textContent = 0;
    memLock = false; memHasFlippedCard = false;

    const items = usePhotoAssets
        ? ['assets/mem1.jpg','assets/mem2.jpg','assets/mem3.jpg','assets/mem4.jpg','assets/mem5.jpg','assets/mem6.jpg']
        : ['🧸','🐰','💖','🍓','💋','🌹'];

    const deck = [...items, ...items].sort(() => Math.random() - 0.5);

    deck.forEach(item => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.framework = item;

        const front = document.createElement('div');
        front.className = 'front-face';
        if (usePhotoAssets) {
            const img = document.createElement('img');
            img.src = item;
            img.alt = 'Memory';
            img.onerror = () => { front.textContent = '📷'; };
            front.appendChild(img);
        } else { front.textContent = item; }

        const back = document.createElement('div');
        back.className = 'back-face';
        back.textContent = '?';

        card.appendChild(front);
        card.appendChild(back);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (memLock || this === memFirstCard) return;
    this.classList.add('flip');
    if (!memHasFlippedCard) {
        memHasFlippedCard = true;
        memFirstCard = this;
        return;
    }
    memSecondCard = this;
    checkMemoryMatch();
}

function checkMemoryMatch() {
    memMoves++;
    document.getElementById('memoryMoves').textContent = memMoves;
    const isMatch = memFirstCard.dataset.framework === memSecondCard.dataset.framework;
    if (isMatch) {
        memFirstCard.removeEventListener('click', flipCard);
        memSecondCard.removeEventListener('click', flipCard);
        resetMemoryBoard();
        if (document.querySelectorAll('.memory-card.flip').length === 12) {
            setTimeout(() => {
                if (memMoves < gameHighScores.memory) {
                    gameHighScores.memory = memMoves;
                    saveHighScores();
                    showCustomPopup('New Record! 🏆', `You won in just ${memMoves} moves!`);
                } else {
                    showCustomPopup('You Won! 🎉', `Finished in ${memMoves} moves.`);
                }
            }, 400);
        }
    } else {
        memLock = true;
        setTimeout(() => {
            memFirstCard.classList.remove('flip');
            memSecondCard.classList.remove('flip');
            resetMemoryBoard();
        }, 1000);
    }
}

function resetMemoryBoard() {
    [memHasFlippedCard, memLock]   = [false, false];
    [memFirstCard, memSecondCard]  = [null, null];
}


// ── Catch the Heart ───────────────────────────────────────────

function startCatchGame() {
    navigateToApp('catchGameScreen');
    const canvas    = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');
    setTimeout(() => {
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('catchStartOverlay').style.display = 'flex';
    }, 100);
}

function initCatchGame() {
    document.getElementById('catchStartOverlay').style.display = 'none';
    const canvas    = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');
    canvas.width    = container.clientWidth;
    canvas.height   = container.clientHeight;

    catchScore = 0;
    document.getElementById('catchScore').textContent = 0;
    catchGameRunning = true;

    const basket = { x: canvas.width/2 - 25, y: canvas.height - 55, width: 60, height: 36 };
    let items = [], frame = 0;

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const ctx = newCanvas.getContext('2d');

    function moveBasket(e) {
        if (!catchGameRunning) return;
        e.preventDefault();
        const rect    = newCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        basket.x = Math.max(0, Math.min(clientX - rect.left - basket.width/2, newCanvas.width - basket.width));
    }

    newCanvas.addEventListener('mousemove', moveBasket);
    newCanvas.addEventListener('touchmove', moveBasket, { passive: false });

    function loop() {
        if (!catchGameRunning) return;
        ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        // Draw basket
        ctx.font = '36px Arial';
        ctx.fillText('🧺', basket.x + 12, basket.y + 32);

        if (frame % 42 === 0) {
            const bad = Math.random() < 0.28;
            items.push({
                x: Math.random() * (newCanvas.width - 36),
                y: -36,
                type: bad ? '💔' : '💖',
                speed: 2 + Math.random() * 2.5
            });
        }

        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.y += item.speed;
            ctx.font = '30px Arial';
            ctx.fillText(item.type, item.x, item.y);

            if (item.y > basket.y && item.y < basket.y + basket.height &&
                item.x + 30 > basket.x && item.x < basket.x + basket.width) {
                if (item.type === '💔') { endCatchGame(); return; }
                catchScore++;
                document.getElementById('catchScore').textContent = catchScore;
                items.splice(i, 1);
            } else if (item.y > newCanvas.height) {
                items.splice(i, 1);
            }
        }
        frame++;
        catchLoopId = requestAnimationFrame(loop);
    }
    loop();
}

function endCatchGame() {
    catchGameRunning = false;
    if (catchScore > gameHighScores.catch) {
        gameHighScores.catch = catchScore;
        saveHighScores();
        showCustomPopup('Game Over 💔', `New High Score: ${catchScore}! 🏆`);
    } else {
        showCustomPopup('Game Over', `Score: ${catchScore}`);
    }
    document.getElementById('catchStartOverlay').style.display = 'flex';
}


// ── Love Slasher ──────────────────────────────────────────────

function startSlasherGame() {
    navigateToApp('slasherGameScreen');
    const canvas    = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');
    setTimeout(() => {
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('slasherStartOverlay').style.display = 'flex';
    }, 100);
}

function initSlasherGame() {
    document.getElementById('slasherStartOverlay').style.display = 'none';
    const canvas    = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');
    canvas.width    = container.clientWidth;
    canvas.height   = container.clientHeight;

    slasherScore = 0;
    document.getElementById('slasherScore').textContent = 0;
    slasherGameRunning = true;

    let fruits = [], particles = [], trail = [], frame = 0;

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const ctx = newCanvas.getContext('2d');

    function onInput(e) {
        if (!slasherGameRunning) return;
        e.preventDefault();
        const rect    = newCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left, y = clientY - rect.top;
        trail.push({ x, y, life: 10 });

        for (let i = fruits.length - 1; i >= 0; i--) {
            const f = fruits[i];
            if (Math.hypot(x - f.x, y - f.y) < f.size) {
                if (f.type === '💣') { endSlasherGame(); return; }
                slasherScore++;
                document.getElementById('slasherScore').textContent = slasherScore;
                for (let j = 0; j < 5; j++) particles.push({
                    x: f.x, y: f.y,
                    vx: (Math.random()-.5)*10, vy:(Math.random()-.5)*10,
                    life: 18, color: f.color
                });
                fruits.splice(i, 1);
            }
        }
    }

    newCanvas.addEventListener('mousemove', onInput);
    newCanvas.addEventListener('touchmove', onInput, { passive: false });

    function loop() {
        if (!slasherGameRunning) return;
        ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        // Trail
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3; ctx.beginPath();
        trail.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); p.life--; });
        ctx.stroke();
        trail = trail.filter(p => p.life > 0);

        if (frame % 50 === 0) {
            const types = [
                { emoji:'🍓', color:'#e74c3c' },
                { emoji:'🍉', color:'#27ae60' },
                { emoji:'🍊', color:'#e67e22' },
                { emoji:'💣', color:'#2c3e50' },
            ];
            const t = types[Math.floor(Math.random() * types.length)];
            fruits.push({
                x: Math.random() * (newCanvas.width - 60) + 30,
                y: newCanvas.height,
                vx: (Math.random()-.5) * 4,
                vy: -(Math.random() * 5 + 8),
                type: t.emoji, color: t.color, size: 30
            });
        }

        fruits.forEach((f, i) => {
            f.x += f.vx; f.y += f.vy; f.vy += 0.15;
            ctx.font = '38px Arial';
            ctx.fillText(f.type, f.x - 16, f.y + 16);
            if (f.y > newCanvas.height + 50) fruits.splice(i, 1);
        });

        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life--;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        });

        frame++;
        slasherLoopId = requestAnimationFrame(loop);
    }
    loop();
}

function endSlasherGame() {
    slasherGameRunning = false;
    if (slasherScore > gameHighScores.slasher) {
        gameHighScores.slasher = slasherScore;
        saveHighScores();
        showCustomPopup('BOOM! 💥', `New High Score: ${slasherScore}! 🏆`);
    } else {
        showCustomPopup('BOOM! 💥', `Game over. Score: ${slasherScore}`);
    }
    document.getElementById('slasherStartOverlay').style.display = 'flex';
}


// ═══════════════════════════════════════════════════════════════
//  EVENT LISTENERS & INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkLoginStatus();
    if (!currentUser) createFloatingEmojis();

    // Diary calendar nav (use event listeners, not inline onclick, for reliability)
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) prevBtn.onclick = () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    };
    if (nextBtn) nextBtn.onclick = () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    };

    document.getElementById('themeToggle').onclick = toggleTheme;

    // Cycle length saves immediately on change
    const cycleInput = document.getElementById('cycleLengthInput');
    if (cycleInput) cycleInput.addEventListener('change', () => {
        localStorage.setItem('periodCycleLength', cycleInput.value);
        loadPeriodTracker();
    });
});

// Prevent double-tap zoom on mobile
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
}, { passive: false });
