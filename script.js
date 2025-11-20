// ===== Configuration =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec'; // Your URL

// ===== State Variables =====
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
const THEME_KEY = 'hetuAppTheme';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};
let periodData = { lastPeriodStart: null, lastPeriodEnd: null, history: [] };
let periodDatePickerMode = '';

// ===== GAME ASSETS CONFIGURATION =====
// Set this to true if you have added photos to an 'assets' folder
const useCustomImages = false; 

// If using photos, ensure files are named img1.jpg, img2.jpg... in an 'assets' folder
// If useCustomImages is false, it defaults to emojis.
const memoryImagesConfig = [
    { type: 'img', src: 'assets/img1.jpg', emoji: '🥰' },
    { type: 'img', src: 'assets/img2.jpg', emoji: '💑' },
    { type: 'img', src: 'assets/img3.jpg', emoji: '💋' },
    { type: 'img', src: 'assets/img4.jpg', emoji: '💍' },
    { type: 'img', src: 'assets/img5.jpg', emoji: '🌹' },
    { type: 'img', src: 'assets/img6.jpg', emoji: '🧸' }
];

// High Scores
let highScores = { memory: 999, slasher: 0, catcher: 0 }; // Memory: lower is better

// ===== DOM Elements =====
const screens = document.querySelectorAll('.screen');
const appContainer = document.getElementById('appContainer');
const loginContainer = document.getElementById('loginContainer');

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    checkLoginStatus();
    loadHighScores();
});

function initializeTheme() {
    const theme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

function login(user) {
    currentUser = user;
    localStorage.setItem(SCRIPT_USER_KEY, user);
    checkLoginStatus();
}

function logout() {
    localStorage.removeItem(SCRIPT_USER_KEY);
    location.reload();
}

function checkLoginStatus() {
    const user = localStorage.getItem(SCRIPT_USER_KEY);
    if (user) {
        currentUser = user;
        document.getElementById('loggedInUserDisplay').textContent = user;
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        navigateToApp('homeScreen');
    }
}

function navigateToApp(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if(screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    } else if (screenId === 'gamesHubScreen') {
        updateHighScoreDisplay();
    }
}

function showNotification(msg, type='info') {
    const div = document.createElement('div');
    div.className = 'notification';
    div.innerText = msg;
    div.style.borderLeftColor = type === 'error' ? '#f44336' : '#2196F3';
    document.getElementById('notificationContainer').appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ==========================================
// ============ GAMES LOGIC =================
// ==========================================

function loadHighScores() {
    const stored = localStorage.getItem('hetuGameScores');
    if(stored) highScores = JSON.parse(stored);
    updateHighScoreDisplay();
}

function saveHighScore(game, score) {
    let isNewRecord = false;
    if(game === 'memory') {
        if(score < highScores.memory) { highScores.memory = score; isNewRecord = true; }
    } else {
        if(score > highScores[game]) { highScores[game] = score; isNewRecord = true; }
    }
    
    if(isNewRecord) {
        localStorage.setItem('hetuGameScores', JSON.stringify(highScores));
        showNotification(`New High Score: ${score}! 🎉`, 'success');
        updateHighScoreDisplay();
    }
}

function updateHighScoreDisplay() {
    document.getElementById('hs-memory').innerText = highScores.memory === 999 ? 'Best: -' : `Best: ${highScores.memory} moves`;
    document.getElementById('hs-slasher').innerText = `Best: ${highScores.slasher}`;
    document.getElementById('hs-catcher').innerText = `Best: ${highScores.catcher}`;
}

function openGame(gameName) {
    // Hide all game pages
    document.querySelectorAll('#gamesHubScreen .page').forEach(p => p.style.display = 'none');
    document.querySelector('.games-hub-grid').style.display = 'none';
    
    const container = document.getElementById(`gameContainer-${gameName}`);
    container.style.display = 'block';
    container.classList.add('active');

    if(gameName === 'memory') resetMemoryGame();
}

function backToHub() {
    stopSlasherGame();
    stopCatcherGame();
    document.querySelectorAll('#gamesHubScreen .page').forEach(p => p.style.display = 'none');
    document.querySelector('.games-hub-grid').style.display = 'grid';
}

// --- GAME 1: MEMORY MATCH ---
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let memoryMoves = 0;
let matchesFound = 0;

function resetMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memoryMoves = 0;
    matchesFound = 0;
    document.getElementById('memoryMoves').innerText = 0;
    hasFlippedCard = lockBoard = false;
    firstCard = secondCard = null;

    // Create pairs
    const items = [...memoryImagesConfig, ...memoryImagesConfig];
    // Shuffle
    items.sort(() => 0.5 - Math.random());

    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        
        // Front Face (Content)
        const front = document.createElement('div');
        front.classList.add('front-face');
        
        if (useCustomImages) {
            const img = document.createElement('img');
            img.src = item.src;
            // Fallback to emoji if image fails
            img.onerror = () => { img.style.display='none'; front.innerText = item.emoji; }; 
            front.appendChild(img);
        } else {
            front.innerHTML = `<span class="emoji-content">${item.emoji}</span>`;
        }

        // Back Face (Cover)
        const back = document.createElement('div');
        back.classList.add('back-face');
        back.innerText = '💕';

        card.appendChild(front);
        card.appendChild(back);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    memoryMoves++;
    document.getElementById('memoryMoves').innerText = memoryMoves;
    checkForMatch();
}

function checkForMatch() {
    // Compare content
    const c1 = useCustomImages ? firstCard.querySelector('img').src : firstCard.querySelector('.front-face').innerText;
    const c2 = useCustomImages ? secondCard.querySelector('img').src : secondCard.querySelector('.front-face').innerText;

    let isMatch = c1 === c2;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetBoard();
    matchesFound++;
    if(matchesFound === 6) {
        setTimeout(() => {
            alert(`You won in ${memoryMoves} moves!`);
            saveHighScore('memory', memoryMoves);
        }, 500);
    }
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// --- GAME 2: FRUIT SLASHER ---
let slasherInterval;
let slasherScore = 0;
let slasherLives = 3;
let slasherGameActive = false;

function startSlasherGame() {
    if(slasherGameActive) return;
    slasherGameActive = true;
    slasherScore = 0;
    slasherLives = 3;
    document.getElementById('slasherScore').innerText = 0;
    document.getElementById('slasherLives').innerText = 3;
    document.getElementById('startSlasherBtn').style.display = 'none';
    document.getElementById('slasherArea').innerHTML = '';
    
    slasherInterval = setInterval(spawnFruit, 800);
}

function stopSlasherGame() {
    slasherGameActive = false;
    clearInterval(slasherInterval);
    document.getElementById('startSlasherBtn').style.display = 'inline-block';
    // Clear remaining fruits
    const area = document.getElementById('slasherArea');
    if(area) area.innerHTML = '';
}

function spawnFruit() {
    if(!slasherGameActive) return;
    
    const area = document.getElementById('slasherArea');
    const fruit = document.createElement('div');
    fruit.classList.add('slasher-item');
    const fruits = ['🍉','🍎','🍌','🍓','🥥','🍍'];
    fruit.innerText = fruits[Math.floor(Math.random() * fruits.length)];
    
    // Random Start Position
    const startX = Math.random() * (area.offsetWidth - 60);
    fruit.style.left = `${startX}px`;
    fruit.style.bottom = '-60px';
    
    area.appendChild(fruit);

    let position = -60;
    let speed = 3 + Math.random() * 4;
    let angle = Math.random() * 360;
    let sliced = false;

    // Click/Touch Event
    const handleSlice = (e) => {
        if(sliced) return;
        e.preventDefault(); // Prevent default touch actions
        sliced = true;
        fruit.classList.add('sliced');
        slasherScore += 10;
        document.getElementById('slasherScore').innerText = slasherScore;
        setTimeout(() => fruit.remove(), 300);
    };

    fruit.addEventListener('mousedown', handleSlice);
    fruit.addEventListener('touchstart', handleSlice);

    // Animation Loop for this fruit
    const moveInterval = setInterval(() => {
        if(!slasherGameActive) { clearInterval(moveInterval); fruit.remove(); return; }
        
        position += speed;
        fruit.style.bottom = `${position}px`;
        fruit.style.transform = `rotate(${angle}deg)`;
        angle += 2;

        if(position > 400) { // Missed it
            clearInterval(moveInterval);
            if(!sliced) {
                fruit.remove();
                loseSlasherLife();
            }
        }
    }, 20);
}

function loseSlasherLife() {
    slasherLives--;
    document.getElementById('slasherLives').innerText = slasherLives;
    if(slasherLives <= 0) {
        stopSlasherGame();
        alert(`Game Over! Score: ${slasherScore}`);
        saveHighScore('slasher', slasherScore);
    }
}

// --- GAME 3: CATCH THE HEART ---
let catcherInterval;
let catcherScore = 0;
let catcherLives = 3;
let catcherGameActive = false;
let playerPos = 50; // Percentage

function startCatcherGame() {
    if(catcherGameActive) return;
    catcherGameActive = true;
    catcherScore = 0;
    catcherLives = 3;
    playerPos = 50;
    document.getElementById('catcherScore').innerText = 0;
    document.getElementById('catcherLives').innerText = 3;
    document.getElementById('startCatcherBtn').style.display = 'none';
    
    // Remove old hearts
    const hearts = document.querySelectorAll('.falling-item');
    hearts.forEach(h => h.remove());

    setupCatcherControls();
    catcherInterval = setInterval(spawnHeart, 1000);
}

function stopCatcherGame() {
    catcherGameActive = false;
    clearInterval(catcherInterval);
    document.getElementById('startCatcherBtn').style.display = 'inline-block';
}

function setupCatcherControls() {
    const area = document.getElementById('catcherArea');
    const player = document.getElementById('catcherPlayer');
    
    const movePlayer = (e) => {
        if(!catcherGameActive) return;
        const rect = area.getBoundingClientRect();
        let clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // Calculate relative position inside the game area
        let relativeX = clientX - rect.left;
        // Clamp within bounds
        if (relativeX < 0) relativeX = 0;
        if (relativeX > rect.width) relativeX = rect.width;
        
        playerPos = (relativeX / rect.width) * 100;
        player.style.left = `${playerPos}%`;
    };

    area.addEventListener('mousemove', movePlayer);
    area.addEventListener('touchmove', (e) => { e.preventDefault(); movePlayer(e); }, {passive: false});
}

function spawnHeart() {
    if(!catcherGameActive) return;
    const area = document.getElementById('catcherArea');
    const item = document.createElement('div');
    item.classList.add('falling-item');
    
    const isBad = Math.random() < 0.2; // 20% chance of bomb
    item.innerText = isBad ? '💔' : '💖';
    item.dataset.type = isBad ? 'bad' : 'good';
    
    item.style.left = Math.random() * 90 + '%';
    area.appendChild(item);

    let topPos = -40;
    const speed = 2 + Math.random() * 3;

    const fallInterval = setInterval(() => {
        if(!catcherGameActive) { clearInterval(fallInterval); item.remove(); return; }
        topPos += speed;
        item.style.top = `${topPos}px`;

        // Collision Detection
        const player = document.getElementById('catcherPlayer');
        const pRect = player.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();

        if (
            iRect.bottom >= pRect.top + 10 &&
            iRect.top <= pRect.bottom &&
            iRect.right >= pRect.left + 10 &&
            iRect.left <= pRect.right - 10
        ) {
            // Caught
            clearInterval(fallInterval);
            item.remove();
            if(item.dataset.type === 'good') {
                catcherScore += 10;
                document.getElementById('catcherScore').innerText = catcherScore;
            } else {
                loseCatcherLife();
            }
        } else if (topPos > 400) {
            // Missed
            clearInterval(fallInterval);
            item.remove();
            if(item.dataset.type === 'good') {
                // Optional: Lose life if missed good heart? Let's keep it easy, no penalty for missing.
            }
        }
    }, 20);
}

function loseCatcherLife() {
    catcherLives--;
    document.getElementById('catcherLives').innerText = catcherLives;
    if(catcherLives <= 0) {
        stopCatcherGame();
        alert(`Game Over! Score: ${catcherScore}`);
        saveHighScore('catcher', catcherScore);
    }
}

// --- GAME 4: DARE ---
const dares = [
    "Give your partner a massage for 2 minutes.",
    "Whisper something naughty in your partner's ear.",
    "Recreate your first kiss.",
    "Let your partner check your phone gallery.",
    "Do a silly dance for 1 minute.",
    "Compliment your partner for 1 minute straight.",
    "Hold hands and stare into eyes for 60 seconds without laughing.",
    "Kiss your partner's forehead."
];

function generateDare() {
    const text = dares[Math.floor(Math.random() * dares.length)];
    const el = document.getElementById('dareText');
    el.style.opacity = 0;
    setTimeout(() => {
        el.innerText = text;
        el.style.opacity = 1;
    }, 300);
}

// ==========================================
// ============ EXISTING LOGIC ==============
// ==========================================
// (Simplified versions of your original functions to fit logic)

function submitFeelingsEntry() {
    // Original logic using fetch(scriptURL...)
    // Ensure to include your original code here if needed or use the simplified notification
    const msg = document.getElementById('feelingsMessage').value;
    if(!msg) return alert("Write something!");
    
    const btn = event.target;
    btn.innerText = "Sending...";
    
    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('message', msg);
    formData.append('submittedBy', currentUser);

    fetch(scriptURL, { method: 'POST', body: formData })
    .then(res => {
        showNotification("Sent with love! 💕", "success");
        document.getElementById('feelingsMessage').value = '';
        btn.innerText = "Send Love 💌";
    })
    .catch(e => { alert("Error"); btn.innerText = "Send Love 💌"; });
}

async function fetchAndDisplayFeelingsEntries() {
    const list = document.getElementById('feelingsEntriesList');
    list.innerHTML = "Loading...";
    try {
        const res = await fetch(`${scriptURL}?action=getFeelingsEntries`);
        const data = await res.json();
        list.innerHTML = '';
        if(data.data) {
            data.data.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'feeling-card';
                div.style.textAlign = 'left';
                div.style.marginBottom = '10px';
                div.innerHTML = `<strong>${entry.submittedBy}</strong>: ${entry.message} <br><small>${new Date(entry.timestamp).toLocaleDateString()}</small>`;
                list.appendChild(div);
            });
        }
    } catch(e) { list.innerHTML = "Error loading."; }
}

// Diary Functions (Placeholders for brevity - Copy your original fetch logic here)
async function fetchDiaryEntries() { /* Your original logic */ }
async function fetchAndDisplayAllDiaryEntries() { /* Your original logic */ }
function submitDiaryEntry() { /* Your original logic */ }
function renderCalendar(date) { 
    // Simple calendar render
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const monthDisplay = document.getElementById('currentMonthYear');
    monthDisplay.innerText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for(let i=1; i<=daysInMonth; i++) {
        const d = document.createElement('div');
        d.className = 'calendar-day';
        d.innerText = i;
        d.onclick = () => {
            document.getElementById('diaryEntryModal').style.display = 'block';
            document.getElementById('diaryDateTitle').innerText = `Entry for ${i}`;
            document.getElementById('selectedDate').value = `${date.getFullYear()}-${date.getMonth()+1}-${i}`;
        };
        grid.appendChild(d);
    }
}

// Period Tracker Functions
function openPeriodDatePicker(mode) {
    periodDatePickerMode = mode;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('periodDatePickerPopup').style.display = 'block';
}
function closePeriodDatePicker() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('periodDatePickerPopup').style.display = 'none';
}
function confirmPeriodDate() {
    const date = document.getElementById('periodDateInput').value;
    if(date) {
        if(periodDatePickerMode === 'start') periodData.lastPeriodStart = date;
        else periodData.lastPeriodEnd = date;
        localStorage.setItem('hetuPeriodData', JSON.stringify(periodData));
        updatePeriodDisplay();
        closePeriodDatePicker();
        showNotification("Logged!", "success");
    }
}
function updatePeriodDisplay() {
    const stored = localStorage.getItem('hetuPeriodData');
    if(stored) periodData = JSON.parse(stored);
    if(periodData.lastPeriodStart) {
        document.getElementById('periodStatusText').innerText = `Last start: ${periodData.lastPeriodStart}`;
    }
}
