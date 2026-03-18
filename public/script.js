// State
let currentUser = null;
let anniversaryDate = localStorage.getItem('anniversaryDate') || '2023-04-21';
let anniversaryLabel = localStorage.getItem('anniversaryLabel') || 'Together since';

// Data stores
let memories = JSON.parse(localStorage.getItem('memories')) || [
    { title: 'The Day We Met', date: '2023-04-21', img: 'https://picsum.photos/seed/meet/400/300', desc: 'The start of our beautiful journey.' }
];
let feelings = JSON.parse(localStorage.getItem('feelings')) || [];
let diary = JSON.parse(localStorage.getItem('diary')) || [];
let periods = JSON.parse(localStorage.getItem('periods')) || [];
let scores = JSON.parse(localStorage.getItem('scores')) || { memory: '-', catch: 0, slasher: 0 };

// Music Player State
let audioQueue = [];
let currentTrackIndex = 0;
let isPlaying = false;
const audioEl = document.getElementById('audioEl');

// Init
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCountdown();
    setInterval(updateCountdown, 1000);
    
    // Check login
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        login(savedUser);
    }

    // Music Events
    if (audioEl) {
        audioEl.addEventListener('timeupdate', updateMusicProgress);
        audioEl.addEventListener('ended', musicNext);
        document.getElementById('musicVolSlider').addEventListener('input', (e) => {
            audioEl.volume = e.target.value;
        });
        
        // Fetch server songs
        fetch('/api/music')
            .then(res => res.json())
            .then(data => {
                if (data.songs && data.songs.length > 0) {
                    const wasEmpty = audioQueue.length === 0;
                    audioQueue = [...data.songs, ...audioQueue];
                    if (wasEmpty) {
                        loadTrack(0);
                    }
                }
            })
            .catch(err => console.error('Failed to load music:', err));
    }

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});

// --- CORE UI ---
function login(user) {
    currentUser = user;
    localStorage.setItem('currentUser', user);
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('loggedInUserDisplay').innerText = user;
    document.getElementById('userAvatarEmoji').innerText = user === 'Chikoo' ? '🐰' : '🐼';
    
    document.querySelectorAll('.dynamicUserName').forEach(el => el.innerText = user === 'Chikoo' ? 'Prath' : 'Chikoo');
    
    navigateToApp('homeScreen');
    renderTimeline();
    renderDiaryCalendar();
    renderPeriodCalendar();
    updateScores();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    if (isPlaying) musicToggle();
}

function navigateToApp(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'timelineScreen') renderTimeline();
    if (screenId === 'periodTrackerScreen') renderPeriodCalendar();
    if (screenId === 'diaryScreen') renderDiaryCalendar();
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerText = isDark ? '☀️' : '🌙';
}

function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerText = '☀️';
    }
}

// --- COUNTDOWN ---
function initCountdown() {
    const d = new Date(anniversaryDate);
    document.getElementById('cdSince').innerText = `${anniversaryLabel} ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    updateCountdown();
}

function updateCountdown() {
    const start = new Date(anniversaryDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;

    if (diff < 0) {
        document.getElementById('cdDays').innerText = '0';
        document.getElementById('cdHours').innerText = '00';
        document.getElementById('cdMins').innerText = '00';
        document.getElementById('cdSecs').innerText = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('cdDays').innerText = days;
    document.getElementById('cdHours').innerText = hours.toString().padStart(2, '0');
    document.getElementById('cdMins').innerText = mins.toString().padStart(2, '0');
    document.getElementById('cdSecs').innerText = secs.toString().padStart(2, '0');
}

// --- MODALS ---
function openAnniversaryModal() {
    document.getElementById('anniversaryDate').value = anniversaryDate;
    document.getElementById('anniversaryLabel').value = anniversaryLabel;
    document.getElementById('anniversaryModal').style.display = 'flex';
}

function closeAnniversaryModal() {
    document.getElementById('anniversaryModal').style.display = 'none';
}

function saveAnniversary() {
    anniversaryDate = document.getElementById('anniversaryDate').value || '2023-04-21';
    anniversaryLabel = document.getElementById('anniversaryLabel').value || 'Together since';
    localStorage.setItem('anniversaryDate', anniversaryDate);
    localStorage.setItem('anniversaryLabel', anniversaryLabel);
    initCountdown();
    closeAnniversaryModal();
}

function showMissYouPopup() {
    const msgs = [
        "I miss you more than words can say! 🥺💖",
        "Thinking of you right now... 🥰",
        "Can't wait to see you again! 🌸",
        "Sending you a big virtual hug! 🤗"
    ];
    document.getElementById('missYouMessage').innerText = msgs[Math.floor(Math.random() * msgs.length)];
    document.getElementById('missYouPopup').style.display = 'flex';
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
}

function openLoveNoteCompose() {
    document.getElementById('loveNoteText').value = '';
    document.getElementById('loveNoteModal').style.display = 'flex';
}

function closeLoveNoteModal() {
    document.getElementById('loveNoteModal').style.display = 'none';
}

function saveLoveNote() {
    const text = document.getElementById('loveNoteText').value.trim();
    if (text) {
        const note = { text, date: new Date().toISOString(), author: currentUser };
        // Could save to a notes array, but for now just show alert
        alert("Note sent with love! 💌");
        closeLoveNoteModal();
    }
}

// --- MUSIC PLAYER ---
function toggleMusicPlayer() {
    const player = document.getElementById('musicPlayer');
    const pill = document.getElementById('musicTogglePill');
    if (player.style.display === 'none') {
        player.style.display = 'flex';
        pill.style.display = 'none';
    } else {
        player.style.display = 'none';
        pill.style.display = 'flex';
    }
}

function handleMusicUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        audioQueue.push({ title: file.name.replace(/\.[^/.]+$/, ""), url: url });
    }
    
    if (audioQueue.length > 0 && !isPlaying && currentTrackIndex === 0) {
        loadTrack(0);
    } else if (audioQueue.length > 0) {
        document.getElementById('musicTitle').innerText = audioQueue[currentTrackIndex].title;
    }
}

function loadTrack(index) {
    if (index < 0 || index >= audioQueue.length) return;
    currentTrackIndex = index;
    const track = audioQueue[index];
    audioEl.src = track.url;
    document.getElementById('musicTitle').innerText = track.title;
    document.getElementById('musicArtist').innerText = 'Local Audio';
    if (isPlaying) audioEl.play();
}

function musicToggle() {
    if (audioQueue.length === 0) {
        alert("Please load some songs first! 📁");
        return;
    }
    if (isPlaying) {
        audioEl.pause();
        document.getElementById('musicPlay').innerText = '▶';
    } else {
        audioEl.play();
        document.getElementById('musicPlay').innerText = '⏸';
    }
    isPlaying = !isPlaying;
}

function musicPrev() {
    if (audioQueue.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + audioQueue.length) % audioQueue.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audioEl.play();
}

function musicNext() {
    if (audioQueue.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % audioQueue.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audioEl.play();
}

function updateMusicProgress() {
    if (!audioEl.duration) return;
    const percent = (audioEl.currentTime / audioEl.duration) * 100;
    document.getElementById('musicProgressFill').style.width = `${percent}%`;
    document.getElementById('musicTimeEl').innerText = formatTime(audioEl.currentTime);
    document.getElementById('musicDurEl').innerText = formatTime(audioEl.duration);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- JOURNEY TIMELINE ---
function renderTimeline() {
    const container = document.getElementById('verticalTimeline');
    container.innerHTML = '';
    
    // Sort memories by date
    const sorted = [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach((mem, index) => {
        const d = new Date(mem.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const item = document.createElement('div');
        item.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content" onclick="openMemoryModal(${index})">
                <div class="timeline-date sub-font">${dateStr}</div>
                <h3 class="display-font" style="font-size:1.5em;color:var(--accent);">${mem.title}</h3>
                ${mem.img ? `<img src="${mem.img}" alt="${mem.title}" style="width:100%;border-radius:8px;margin-top:10px;">` : ''}
                <p class="sub-font" style="margin-top:10px;font-size:0.9em;">${mem.desc}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

function openAddMemoryModal() {
    document.getElementById('newMemTitle').value = '';
    document.getElementById('newMemDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newMemImgNum').value = '';
    document.getElementById('newMemDesc').value = '';
    document.getElementById('addMemoryModal').style.display = 'flex';
}

function closeAddMemoryModal() {
    document.getElementById('addMemoryModal').style.display = 'none';
}

function saveNewMemory() {
    const title = document.getElementById('newMemTitle').value.trim();
    const date = document.getElementById('newMemDate').value;
    const img = document.getElementById('newMemImgNum').value.trim();
    const desc = document.getElementById('newMemDesc').value.trim();
    
    if (!title || !date) {
        alert("Title and Date are required!");
        return;
    }
    
    memories.push({ title, date, img, desc });
    localStorage.setItem('memories', JSON.stringify(memories));
    renderTimeline();
    closeAddMemoryModal();
}

function openMemoryModal(index) {
    // Sort memories by date to match the timeline index
    const sorted = [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));
    const mem = sorted[index];
    
    document.getElementById('modalTitle').innerText = mem.title;
    const imgEl = document.getElementById('modalImg');
    if (mem.img) {
        imgEl.src = mem.img;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }
    document.getElementById('modalDesc').innerText = mem.desc;
    document.getElementById('memoryModal').style.display = 'flex';
}

function closeMemoryModal() {
    document.getElementById('memoryModal').style.display = 'none';
}

// --- FEELINGS PORTAL ---
let currentFeeling = '';

function navigateToFeelingsPage(pageId, feeling = '') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (feeling) {
        currentFeeling = feeling;
        const emojiMap = { 'Grievance': '😤', 'Appreciate': '🥹', 'Sad': '🥺', 'Happy': '🥰' };
        document.getElementById('feelingsPage2Title').innerText = `${emojiMap[feeling]} ${feeling}`;
        document.getElementById('feelingsMessage').value = '';
    }
}

function submitFeelingsEntry() {
    const msg = document.getElementById('feelingsMessage').value.trim();
    if (!msg) return;
    
    feelings.push({
        type: currentFeeling,
        message: msg,
        date: new Date().toISOString(),
        author: currentUser
    });
    localStorage.setItem('feelings', JSON.stringify(feelings));
    navigateToFeelingsPage('feelingsPage3');
}

function fetchAndDisplayFeelingsEntries() {
    navigateToFeelingsPage('feelingsViewEntriesPage');
    const container = document.getElementById('feelingsEntriesList');
    container.innerHTML = '';
    
    if (feelings.length === 0) {
        container.innerHTML = '<p class="sub-font" style="text-align:center;opacity:0.6;">No entries yet.</p>';
        return;
    }
    
    const emojiMap = { 'Grievance': '😤', 'Appreciate': '🥹', 'Sad': '🥺', 'Happy': '🥰' };
    
    [...feelings].reverse().forEach(f => {
        const d = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const el = document.createElement('div');
        el.className = 'notebook-card view-only';
        el.style.marginBottom = '15px';
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <span style="font-weight:bold;color:var(--accent);">${emojiMap[f.type]} ${f.type}</span>
                <span class="sub-font" style="font-size:0.8em;opacity:0.7;">${d}</span>
            </div>
            <p class="sub-font">${f.message}</p>
            <p style="text-align:right;font-size:0.8em;margin-top:10px;opacity:0.7;">- ${f.author}</p>
        `;
        container.appendChild(el);
    });
}

// --- DIARY ---
let currentDiaryMonth = new Date().getMonth();
let currentDiaryYear = new Date().getFullYear();

function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function renderDiaryCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonthYear').innerText = `${monthNames[currentDiaryMonth]} ${currentDiaryYear}`;
    
    const daysInMonth = new Date(currentDiaryYear, currentDiaryMonth + 1, 0).getDate();
    const firstDay = new Date(currentDiaryYear, currentDiaryMonth, 1).getDay();
    
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    daysOfWeek.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-day-header';
        el.innerText = d;
        grid.appendChild(el);
    });
    
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentDiaryYear}-${String(currentDiaryMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEntry = diary.some(d => d.date.startsWith(dateStr));
        
        const el = document.createElement('div');
        el.className = `cal-day ${hasEntry ? 'has-entry' : ''}`;
        el.innerText = i;
        
        const today = new Date();
        if (i === today.getDate() && currentDiaryMonth === today.getMonth() && currentDiaryYear === today.getFullYear()) {
            el.classList.add('today');
        }
        
        el.onclick = () => openDiaryEntry(dateStr);
        grid.appendChild(el);
    }
}

document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    currentDiaryMonth--;
    if (currentDiaryMonth < 0) { currentDiaryMonth = 11; currentDiaryYear--; }
    renderDiaryCalendar();
});

document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    currentDiaryMonth++;
    if (currentDiaryMonth > 11) { currentDiaryMonth = 0; currentDiaryYear++; }
    renderDiaryCalendar();
});

function openDiaryEntry(dateStr) {
    const existing = diary.find(d => d.date.startsWith(dateStr));
    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    if (existing) {
        document.getElementById('viewDiaryDateDisplay').innerText = displayDate;
        document.getElementById('viewDiaryThoughts').innerText = existing.text;
        document.getElementById('diaryEntryAttribution').innerText = `- Written by ${existing.author}`;
        navigateToDiaryPage('diaryViewPage');
    } else {
        document.getElementById('diaryDateDisplay').innerText = displayDate;
        document.getElementById('selectedDate').value = dateStr;
        document.getElementById('diaryThoughts').value = '';
        navigateToDiaryPage('diaryEntryPage');
    }
}

function submitDiaryEntry() {
    const text = document.getElementById('diaryThoughts').value.trim();
    const dateStr = document.getElementById('selectedDate').value;
    if (!text) return;
    
    diary.push({
        date: dateStr + 'T12:00:00.000Z', // Store with time
        text: text,
        author: currentUser
    });
    localStorage.setItem('diary', JSON.stringify(diary));
    renderDiaryCalendar();
    navigateToDiaryPage('diaryConfirmationPage');
}

function fetchAndDisplayAllDiaryEntries() {
    navigateToDiaryPage('allDiaryEntriesPage');
    const container = document.getElementById('allDiaryEntriesList');
    container.innerHTML = '';
    
    if (diary.length === 0) {
        container.innerHTML = '<p class="sub-font" style="text-align:center;opacity:0.6;">No entries yet.</p>';
        return;
    }
    
    [...diary].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(d => {
        const dateObj = new Date(d.date);
        const el = document.createElement('div');
        el.className = 'notebook-card view-only';
        el.style.marginBottom = '15px';
        el.innerHTML = `
            <div style="margin-bottom:10px;">
                <span class="sub-font" style="font-weight:bold;color:var(--accent);">${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <p class="sub-font">${d.text}</p>
            <p style="text-align:right;font-size:0.8em;margin-top:10px;opacity:0.7;">- ${d.author}</p>
        `;
        container.appendChild(el);
    });
}

// --- PERIOD TRACKER ---
let currentPeriodMonth = new Date().getMonth();
let currentPeriodYear = new Date().getFullYear();
let selectedMood = '';

function renderPeriodCalendar() {
    const grid = document.getElementById('periodCalendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('periodMonthYear').innerText = `${monthNames[currentPeriodMonth]} ${currentPeriodYear}`;
    
    const daysInMonth = new Date(currentPeriodYear, currentPeriodMonth + 1, 0).getDate();
    const firstDay = new Date(currentPeriodYear, currentPeriodMonth, 1).getDay();
    
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    daysOfWeek.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-day-header';
        el.innerText = d;
        grid.appendChild(el);
    });
    
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentPeriodYear}-${String(currentPeriodMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        let isPeriod = false;
        periods.forEach(p => {
            if (dateStr >= p.start && (!p.end || dateStr <= p.end)) isPeriod = true;
        });
        
        const el = document.createElement('div');
        el.className = `cal-day ${isPeriod ? 'period-day' : ''}`;
        el.innerText = i;
        
        const today = new Date();
        if (i === today.getDate() && currentPeriodMonth === today.getMonth() && currentPeriodYear === today.getFullYear()) {
            el.classList.add('today');
        }
        
        grid.appendChild(el);
    }
    
    updatePeriodStats();
}

function changePeriodMonth(dir) {
    currentPeriodMonth += dir;
    if (currentPeriodMonth < 0) { currentPeriodMonth = 11; currentPeriodYear--; }
    if (currentPeriodMonth > 11) { currentPeriodMonth = 0; currentPeriodYear++; }
    renderPeriodCalendar();
}

function selectMood(mood, btn) {
    selectedMood = mood;
    document.querySelectorAll('.mood-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function addPeriodEntry() {
    const start = document.getElementById('periodStartDate').value;
    const end = document.getElementById('periodEndDate').value;
    
    if (!start) {
        alert("Start date is required!");
        return;
    }
    
    periods.push({ start, end, mood: selectedMood });
    localStorage.setItem('periods', JSON.stringify(periods));
    
    document.getElementById('periodStartDate').value = '';
    document.getElementById('periodEndDate').value = '';
    selectedMood = '';
    document.querySelectorAll('.mood-pill').forEach(b => b.classList.remove('active'));
    
    renderPeriodCalendar();
    alert("Period logged successfully 🌸");
}

function updatePeriodStats() {
    if (periods.length === 0) return;
    
    document.getElementById('periodStatStrip').style.display = 'flex';
    document.getElementById('statTotalLogs').innerText = periods.length;
    
    // Sort periods
    const sorted = [...periods].sort((a, b) => new Date(a.start) - new Date(b.start));
    const latest = sorted[sorted.length - 1];
    
    document.getElementById('periodStatus').innerText = `Last period started on ${new Date(latest.start).toLocaleDateString()}`;
    
    const cycleLen = parseInt(document.getElementById('cycleLengthInput').value) || 28;
    const nextDate = new Date(latest.start);
    nextDate.setDate(nextDate.getDate() + cycleLen);
    
    const diffDays = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        document.getElementById('nextPeriodInfo').innerText = `Next period expected in ${diffDays} days`;
    } else {
        document.getElementById('nextPeriodInfo').innerText = `Period is expected around now`;
    }
    
    drawCycleWheel(diffDays, cycleLen);
}

function drawCycleWheel(daysUntilNext, cycleLen) {
    const canvas = document.getElementById('cycleWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 100;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.3)';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    // Progress arc
    let currentDay = cycleLen - Math.max(0, daysUntilNext);
    if (currentDay < 0) currentDay = 0;
    if (currentDay > cycleLen) currentDay = cycleLen;
    
    const progress = currentDay / cycleLen;
    const endAngle = -0.5 * Math.PI + (progress * 2 * Math.PI);
    
    ctx.beginPath();
    ctx.arc(cx, cy, r, -0.5 * Math.PI, endAngle);
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Text
    ctx.fillStyle = 'var(--accent)';
    ctx.font = 'bold 30px Quicksand';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Day ${currentDay}`, cx, cy - 10);
    
    ctx.font = '14px Quicksand';
    ctx.fillStyle = 'var(--text-muted)';
    ctx.fillText(`of ${cycleLen}`, cx, cy + 20);
    
    document.getElementById('cyclePhasePanel').style.display = 'block';
}

// --- GAMES ---
function updateScores() {
    document.getElementById('memHighScore').innerText = scores.memory;
    document.getElementById('catchHighScore').innerText = scores.catch;
    document.getElementById('slashHighScore').innerText = scores.slasher;
}

function saveScore(game, score) {
    if (game === 'memory') {
        if (scores.memory === '-' || score < scores.memory) scores.memory = score;
    } else {
        if (score > scores[game]) scores[game] = score;
    }
    localStorage.setItem('scores', JSON.stringify(scores));
    updateScores();
}

function quitGame() {
    navigateToApp('gameHubScreen');
}

// Dare Game
const dares = [
    "Give the other person a 2-minute massage.",
    "Share a secret you've never told them.",
    "Kiss them passionately for 10 seconds.",
    "Do your best impression of them.",
    "Let them pick a song and you have to dance to it.",
    "Stare into their eyes for 1 minute without laughing.",
    "Tell them 3 things you love most about them.",
    "Let them tickle you for 30 seconds."
];

function generateDare() {
    const dare = dares[Math.floor(Math.random() * dares.length)];
    document.getElementById('dareText').innerText = dare;
}

// Memory Game
let memCards = [];
let flippedCards = [];
let matchedPairs = 0;
let memMoves = 0;

function startMemoryGame() {
    navigateToApp('memoryGameScreen');
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    memMoves = 0;
    document.getElementById('memoryMoves').innerText = memMoves;
    
    const emojis = ['💖', '🌸', '🐰', '🐼', '💌', '🍓', '✨', '🌙'];
    const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    
    deck.forEach((emoji, i) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.dataset.index = i;
        card.innerHTML = `<div class="memory-card-inner">
            <div class="memory-card-front">❓</div>
            <div class="memory-card-back">${emoji}</div>
        </div>`;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        memMoves++;
        document.getElementById('memoryMoves').innerText = memMoves;
        
        const [c1, c2] = flippedCards;
        if (c1.dataset.emoji === c2.dataset.emoji) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            flippedCards = [];
            matchedPairs++;
            if (matchedPairs === 8) {
                setTimeout(() => {
                    alert(`You won in ${memMoves} moves! 🎉`);
                    saveScore('memory', memMoves);
                }, 500);
            }
        } else {
            setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
}

// Catch Game (Basic Implementation)
let catchCtx, catchCanvas, catchScore = 0, catchAnimationId;
let basket = { x: 150, y: 350, w: 60, h: 20 };
let hearts = [];

function initCatchGame() {
    document.getElementById('catchStartOverlay').style.display = 'none';
    catchCanvas = document.getElementById('catchGameCanvas');
    catchCtx = catchCanvas.getContext('2d');
    
    // Resize canvas to fit container
    const container = document.getElementById('catchGameCanvasContainer');
    catchCanvas.width = container.clientWidth;
    catchCanvas.height = container.clientHeight;
    
    basket.y = catchCanvas.height - 30;
    basket.x = catchCanvas.width / 2 - basket.w / 2;
    
    catchScore = 0;
    document.getElementById('catchScore').innerText = catchScore;
    hearts = [];
    
    catchCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = catchCanvas.getBoundingClientRect();
        basket.x = touch.clientX - rect.left - basket.w / 2;
    });
    
    catchCanvas.addEventListener('mousemove', (e) => {
        const rect = catchCanvas.getBoundingClientRect();
        basket.x = e.clientX - rect.left - basket.w / 2;
    });
    
    catchLoop();
}

function startCatchGame() {
    navigateToApp('catchGameScreen');
    document.getElementById('catchStartOverlay').style.display = 'flex';
    if (catchAnimationId) cancelAnimationFrame(catchAnimationId);
}

function catchLoop() {
    catchCtx.clearRect(0, 0, catchCanvas.width, catchCanvas.height);
    
    // Draw basket
    catchCtx.fillStyle = 'var(--accent)';
    catchCtx.fillRect(basket.x, basket.y, basket.w, basket.h);
    
    // Spawn hearts
    if (Math.random() < 0.03) {
        hearts.push({
            x: Math.random() * (catchCanvas.width - 20),
            y: -20,
            speed: 2 + Math.random() * 3,
            type: Math.random() > 0.2 ? '💖' : '💔'
        });
    }
    
    // Update and draw hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
        let h = hearts[i];
        h.y += h.speed;
        
        catchCtx.font = '24px Arial';
        catchCtx.fillText(h.type, h.x, h.y);
        
        // Collision
        if (h.y + 20 >= basket.y && h.x >= basket.x - 20 && h.x <= basket.x + basket.w) {
            if (h.type === '💖') {
                catchScore += 10;
            } else {
                catchScore -= 20;
            }
            document.getElementById('catchScore').innerText = catchScore;
            hearts.splice(i, 1);
        } else if (h.y > catchCanvas.height) {
            hearts.splice(i, 1);
        }
    }
    
    catchAnimationId = requestAnimationFrame(catchLoop);
}

// Slasher Game (Basic Implementation)
let slashCtx, slashCanvas, slashScore = 0, slashAnimationId;
let fruits = [];
let slashTrail = [];

function initSlasherGame() {
    document.getElementById('slasherStartOverlay').style.display = 'none';
    slashCanvas = document.getElementById('slasherCanvas');
    slashCtx = slashCanvas.getContext('2d');
    
    const container = document.getElementById('slasherCanvasContainer');
    slashCanvas.width = container.clientWidth;
    slashCanvas.height = container.clientHeight;
    
    slashScore = 0;
    document.getElementById('slasherScore').innerText = slashScore;
    fruits = [];
    slashTrail = [];
    
    const handleMove = (x, y) => {
        slashTrail.push({x, y, life: 10});
        
        // Check collision with fruits
        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            let dist = Math.hypot(f.x - x, f.y - y);
            if (dist < 30) {
                if (f.type === '💣') {
                    alert(`Game Over! Score: ${slashScore}`);
                    saveScore('slasher', slashScore);
                    startSlasherGame();
                    return;
                } else {
                    slashScore += 10;
                    document.getElementById('slasherScore').innerText = slashScore;
                    fruits.splice(i, 1);
                }
            }
        }
    };
    
    slashCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = slashCanvas.getBoundingClientRect();
        handleMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    });
    
    let isMouseDown = false;
    slashCanvas.addEventListener('mousedown', () => isMouseDown = true);
    slashCanvas.addEventListener('mouseup', () => isMouseDown = false);
    slashCanvas.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const rect = slashCanvas.getBoundingClientRect();
        handleMove(e.clientX - rect.left, e.clientY - rect.top);
    });
    
    slashLoop();
}

function startSlasherGame() {
    navigateToApp('slasherGameScreen');
    document.getElementById('slasherStartOverlay').style.display = 'flex';
    if (slashAnimationId) cancelAnimationFrame(slashAnimationId);
}

function slashLoop() {
    slashCtx.clearRect(0, 0, slashCanvas.width, slashCanvas.height);
    
    // Spawn fruits
    if (Math.random() < 0.02) {
        fruits.push({
            x: Math.random() * (slashCanvas.width - 40) + 20,
            y: slashCanvas.height + 20,
            vx: (Math.random() - 0.5) * 4,
            vy: -10 - Math.random() * 5,
            type: Math.random() > 0.2 ? '🍉' : '💣'
        });
    }
    
    // Update and draw fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
        let f = fruits[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.2; // gravity
        
        slashCtx.font = '30px Arial';
        slashCtx.fillText(f.type, f.x - 15, f.y + 10);
        
        if (f.y > slashCanvas.height + 50) {
            fruits.splice(i, 1);
        }
    }
    
    // Draw trail
    slashCtx.beginPath();
    slashCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    slashCtx.lineWidth = 4;
    for (let i = 0; i < slashTrail.length; i++) {
        let t = slashTrail[i];
        if (i === 0) slashCtx.moveTo(t.x, t.y);
        else slashCtx.lineTo(t.x, t.y);
        t.life--;
    }
    slashCtx.stroke();
    slashTrail = slashTrail.filter(t => t.life > 0);
    
    slashAnimationId = requestAnimationFrame(slashLoop);
}
