// ===== GLOBAL CONFIGURATION =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// Application State
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let periodCalendarDate = new Date();
let diaryEntries = {};
let periodData = [];
let usedDares = [];

// Game State
let activeGame = null;
let gameHighScores = {
    dare: 0,
    memory: null,
    fruit: 0,
    hearts: 0
};

// ===== GAME DATA =====
const coupleDares = [
    "Give your partner a slow, sensual massage on their neck and shoulders for 5 minutes.",
    "Whisper three things you find sexiest about your partner into their ear.",
    "Blindfold your partner and tease them with light touches for 2 minutes.",
    "Choose a song and give your partner a private slow dance.",
    "Write a short, steamy compliment and have your partner read it aloud.",
    "Let your partner slowly remove one item of your upper clothing.",
    "Describe your favorite memory of a passionate moment in detail.",
    "Feed your partner a strawberry in the most seductive way.",
    "Kiss your partner passionately for at least 60 seconds.",
    "Take turns tracing words of affection on each other's backs.",
    "Share a secret fantasy you've had about your partner.",
    "Let your partner choose a spot on your upper body to kiss.",
    "Remove your top and let your partner admire you for a minute.",
    "Sit facing each other, knees touching, maintain eye contact for 2 minutes.",
    "Give your partner a lingering kiss on their collarbone.",
    "Tell your partner, in a sultry voice, what you want to do later.",
    "Gently bite your partner's earlobe while whispering something naughty.",
    "Take turns applying lotion to each other's arms or chest.",
    "Lie down together and cuddle with soft kisses for 5 minutes.",
    "Blindfold your partner and kiss them in three different places.",
    "Slowly lick honey off your partner's finger or lips.",
    "Recreate your very first kiss with your partner.",
    "Give your partner a sensual foot massage.",
    "Both remove your shirts and compliment each other's physique.",
    "Write 'I want you' with lipstick on your partner's chest.",
    "Playfully spank your partner (lightly!) and tell them they've been naughty.",
    "Share a shower together, focusing on washing each other.",
    "Let your partner choose one item of your clothing to remove.",
    "Kiss your partner from lips to neck to chest, very slowly.",
    "Tell your partner a secret desire for your intimacy.",
    "Blindfold yourself and let your partner guide your hands.",
    "Take turns giving each other eskimo and butterfly kisses.",
    "Whisper your partner's name seductively while looking deep into their eyes.",
    "Set a timer for 3 minutes, communicate only with kisses and caresses.",
    "Let your partner draw a temporary tattoo on your upper arm.",
    "Both remove your tops and dance together to a sexy song.",
    "Give your partner a sensual 'once-over' look and describe what you see.",
    "Tease your partner by almost kissing them several times.",
    "Take turns reading a short, erotic poem to each other.",
    "If you're Chikoo, remove your top. If you're Prath, give Chikoo a back rub.",
    "If you're Prath, remove your top. If you're Chikoo, kiss Prath's chest.",
    "Describe your partner's sexiest feature and why you love it.",
    "Let your partner pick a dare from this list.",
    "Give your partner a lap dance.",
    "Role-play: One is a movie star, the other is an adoring fan.",
    "Take a sexy selfie together (upper body focus).",
    "Spend 5 minutes only complimenting each other's bodies.",
    "Kiss each of your partner's fingertips, one by one, very slowly.",
    "Dare your partner to make you blush with just words.",
    "Close your eyes and describe your ideal romantic evening together."
];

const missYouMessages = [
    "I love you my chikoo! 🥰",
    "Sending virtual huggies 🤗 to my darling!",
    "Sending virtual kissy 😘 to my darling!",
    "Pratham misses you too! ❤️", 
    "Thinking of you, always! ✨",
    "You're the best! 💖"
];

// ===== USER AUTHENTICATION =====
function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
        createFloatingEmojis();
        loadGameHighScores();
    } else {
        showCustomPopup('Error', 'Invalid user selection.');
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.body.style.alignItems = 'center';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('floatingBg').innerHTML = '';
    if (activeGame) stopGame();
}

function updateUserDisplay() {
    const display = document.getElementById('loggedInUserDisplay');
    if (display) {
        display.textContent = currentUser ? `User: ${currentUser}` : 'User: Not logged in';
    }
    document.querySelectorAll('.dynamicUserName').forEach(el => {
        el.textContent = currentUser || 'User';
    });
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
        loadGameHighScores();
    }
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ===== FLOATING EMOJI BACKGROUND =====
function createFloatingEmojis() {
    const container = document.getElementById('floatingBg');
    const emojis = ['💕', '💖', '💗', '💓', '💝', '💘', '💞', '🌸', '🌺', '🌹', '✨', '🌟', '💫', '🌈', '🦋'];
    
    for (let i = 0; i < 15; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'floating-emoji';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = Math.random() * 100 + '%';
        emoji.style.top = Math.random() * 100 + '%';
        emoji.style.animationDelay = Math.random() * 6 + 's';
        emoji.style.animationDuration = (4 + Math.random() * 4) + 's';
        container.appendChild(emoji);
    }
}

// ===== CUSTOM POPUP SYSTEM =====
function showCustomPopup(title, message, inputPlaceholder = null, callback = null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p => p.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    
    let input = null;
    if (inputPlaceholder) {
        input = document.createElement('textarea');
        input.rows = 3;
        input.placeholder = inputPlaceholder;
        input.style.cssText = 'width: 100%; padding: 10px; margin: 10px 0; border: 1px solid var(--border-color); border-radius: 8px;';
        popup.appendChild(input);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.marginTop = '15px';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.background = '#ccc';
    cancelBtn.onclick = () => {
        overlay.remove();
        if (callback) callback(null);
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = inputPlaceholder ? 'Submit' : 'OK';
    confirmBtn.onclick = () => {
        overlay.remove();
        if (callback) callback(input ? input.value : true);
    };
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    if (input) input.focus();
}

// ===== NAVIGATION =====
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') {
        showCustomPopup('Session Expired', 'Please log in again.');
        logout();
        return;
    }
    
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        if (screenId === 'feelingsPortalScreen') {
            navigateToFeelingsPage('feelingsPage1');
        } else if (screenId === 'diaryScreen') {
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
                navigateToDiaryPage('diaryCalendarPage');
            });
        } else if (screenId === 'gamesScreen') {
            navigateToGamesPage('gamesMenuPage');
        } else if (screenId === 'periodTrackerScreen') {
            loadPeriodTracker();
        }
    } else {
        showCustomPopup('Error', 'Screen not found!');
    }
}

function navigateToGamesPage(pageId) {
    document.querySelectorAll('#gamesScreen .page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        if (pageId === 'gamesMenuPage') {
            updateHighScoreDisplay();
        }
    }
}

function startGame(gameType) {
    if (activeGame) stopGame();
    activeGame = gameType;
    
    switch(gameType) {
        case 'dare':
            navigateToGamesPage('dareGamePage');
            if (usedDares.length === coupleDares.length) usedDares = [];
            document.getElementById('dareCount').textContent = usedDares.length;
            document.getElementById('totalDares').textContent = coupleDares.length;
            document.getElementById('dareText').textContent = "Click the button below to get your first dare!";
            break;
        case 'memory':
            navigateToGamesPage('memoryGamePage');
            startMemoryGame();
            break;
        case 'fruit':
            navigateToGamesPage('fruitGamePage');
            startFruitGame();
            break;
        case 'hearts':
            navigateToGamesPage('heartsGamePage');
            startHeartsGame();
            break;
    }
}

function backToGamesMenu() {
    if (activeGame) stopGame();
    activeGame = null;
    navigateToGamesPage('gamesMenuPage');
}

function stopGame() {
    switch(activeGame) {
        case 'memory':
            stopMemoryGame();
            break;
        case 'fruit':
            stopFruitGame();
            break;
        case 'hearts':
            stopHeartsGame();
            break;
    }
}

// ===== HIGH SCORES =====
function loadGameHighScores() {
    const saved = localStorage.getItem('hetuAppGameHighScores');
    if (saved) {
        gameHighScores = JSON.parse(saved);
    }
    updateHighScoreDisplay();
}

function saveHighScore(game, score) {
    if (game === 'memory') {
        if (!gameHighScores.memory || score < gameHighScores.memory) {
            gameHighScores.memory = score;
        }
    } else {
        if (score > gameHighScores[game]) {
            gameHighScores[game] = score;
        }
    }
    localStorage.setItem('hetuAppGameHighScores', JSON.stringify(gameHighScores));
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    document.getElementById('dareHighScore').textContent = gameHighScores.dare;
    document.getElementById('memoryHighScore').textContent = 
        gameHighScores.memory ? `${gameHighScores.memory}s` : '--';
    document.getElementById('fruitHighScore').textContent = gameHighScores.fruit;
    document.getElementById('heartsHighScore').textContent = gameHighScores.hearts;
}

// ===== DARE GAME =====
function generateDare() {
    if (!currentUser) return;
    
    if (usedDares.length === coupleDares.length) {
        usedDares = [];
        showCustomPopup('All Dares Complete!', 'You\'ve gone through all the dares! Resetting for more fun. 😉');
    }

    const availableDares = coupleDares.filter(dare => !usedDares.includes(dare));
    const randomDare = availableDares[Math.floor(Math.random() * availableDares.length)];
    
    usedDares.push(randomDare);
    document.getElementById('dareText').textContent = randomDare;
    document.getElementById('dareCount').textContent = usedDares.length;
    
    saveHighScore('dare', usedDares.length);
}

// ===== MEMORY GAME =====
let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryMoves = 0;
let memoryTimer = 0;
let memoryTimerInterval = null;

function startMemoryGame() {
    // INSTRUCTIONS FOR CUSTOM PHOTOS:
    // 1. Create a folder named "assets" in the same directory as your HTML file
    // 2. Inside "assets", create a folder named "memory-game"
    // 3. Place your photos there, named: 1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg, 6.jpg, 7.jpg, 8.jpg
    // 4. If you don't add photos, the game will use emojis as fallback
    const imagePaths = [];
    for (let i = 1; i <= 8; i++) {
        imagePaths.push(`assets/memory-game/${i}.jpg`);
    }
    
    memoryCards = [];
    memoryFlippedCards = [];
    memoryMatchedPairs = 0;
    memoryMoves = 0;
    memoryTimer = 0;
    
    document.getElementById('memoryMoves').textContent = '0';
    document.getElementById('memoryTimer').textContent = '0';
    
    const gameArray = [];
    for (let i = 0; i < 8; i++) {
        gameArray.push({ id: i, value: i, type: 'image', path: imagePaths[i] });
        gameArray.push({ id: i + 8, value: i, type: 'image', path: imagePaths[i] });
    }
    
    memoryCards = gameArray.sort(() => Math.random() - 0.5);
    
    renderMemoryCards();
    
    memoryTimerInterval = setInterval(() => {
        memoryTimer++;
        document.getElementById('memoryTimer').textContent = memoryTimer;
    }, 1000);
}

function renderMemoryCards() {
    const grid = document.getElementById('memoryGameGrid');
    grid.innerHTML = '';
    
    memoryCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.index = index;
        cardElement.onclick = () => flipMemoryCard(index);
        
        cardElement.innerHTML = `
            <div class="memory-card-front">?</div>
            <div class="memory-card-back" id="back-${index}">
                ${card.type === 'image' ? 
                    `<img src="${card.path}" alt="Memory" onerror="this.style.display='none'; this.parentElement.textContent='❤️';">` : 
                    '❤️'
                }
            </div>
        `;
        
        grid.appendChild(cardElement);
    });
}

function flipMemoryCard(index) {
    const card = document.querySelector(`[data-index="${index}"]`);
    
    if (card.classList.contains('flipped') || card.classList.contains('matched') || memoryFlippedCards.length === 2) {
        return;
    }
    
    card.classList.add('flipped');
    memoryFlippedCards.push(index);
    
    if (memoryFlippedCards.length === 2) {
        memoryMoves++;
        document.getElementById('memoryMoves').textContent = memoryMoves;
        
        const [first, second] = memoryFlippedCards;
        if (memoryCards[first].value === memoryCards[second].value) {
            setTimeout(() => {
                document.querySelector(`[data-index="${first}"]`).classList.add('matched');
                document.querySelector(`[data-index="${second}"]`).classList.add('matched');
                memoryMatchedPairs++;
                memoryFlippedCards = [];
                
                if (memoryMatchedPairs === 8) {
                    clearInterval(memoryTimerInterval);
                    showCustomPopup('Congratulations!', `You won in ${memoryTimer} seconds with ${memoryMoves} moves!`);
                    saveHighScore('memory', memoryTimer);
                }
            }, 500);
        } else {
            setTimeout(() => {
                document.querySelector(`[data-index="${first}"]`).classList.remove('flipped');
                document.querySelector(`[data-index="${second}"]`).classList.remove('flipped');
                memoryFlippedCards = [];
            }, 1000);
        }
    }
}

function stopMemoryGame() {
    if (memoryTimerInterval) {
        clearInterval(memoryTimerInterval);
        memoryTimerInterval = null;
    }
}

// ===== FRUIT SLASH GAME =====
let fruitGameCanvas, fruitGameCtx;
let fruitGameRunning = false;
let fruitScore = 0;
let fruitLives = 3;
let fruits = [];
let slashes = [];
let lastFruitTime = 0;

function startFruitGame() {
    fruitGameCanvas = document.getElementById('fruitCanvas');
    fruitGameCtx = fruitGameCanvas.getContext('2d');
    fruitGameCanvas.width = fruitGameCanvas.offsetWidth;
    fruitGameCanvas.height = fruitGameCanvas.offsetHeight;
    
    fruitScore = 0;
    fruitLives = 3;
    fruits = [];
    slashes = [];
    lastFruitTime = Date.now();
    fruitGameRunning = true;
    
    document.getElementById('fruitScore').textContent = fruitScore;
    document.getElementById('fruitLives').textContent = '❤️'.repeat(fruitLives);
    
    fruitGameCanvas.addEventListener('touchstart', handleSlashStart, { passive: false });
    fruitGameCanvas.addEventListener('mousedown', handleSlashStart);
    
    gameLoop();
}

function gameLoop() {
    if (!fruitGameRunning) return;
    
    const currentTime = Date.now();
    if (currentTime - lastFruitTime > 1500) {
        spawnFruit();
        lastFruitTime = currentTime;
    }
    
    updateFruits();
    updateSlashes();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function spawnFruit() {
    const fruitEmojis = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🥝', '🍑'];
    const fruit = {
        x: Math.random() * (fruitGameCanvas.width - 40) + 20,
        y: fruitGameCanvas.height + 50,
        vx: (Math.random() - 0.5) * 4,
        vy: -12 - Math.random() * 3,
        emoji: fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)],
        size: 30,
        sliced: false
    };
    fruits.push(fruit);
}

function updateFruits() {
    fruits.forEach((fruit, index) => {
        if (!fruit.sliced) {
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;
            fruit.vy += 0.3;
            
            if (fruit.y > fruitGameCanvas.height + 50) {
                fruits.splice(index, 1);
                if (!fruit.sliced) {
                    fruitLives--;
                    document.getElementById('fruitLives').textContent = '❤️'.repeat(fruitLives);
                    if (fruitLives <= 0) {
                        endFruitGame();
                    }
                }
            }
        }
    });
}

function updateSlashes() {
    slashes = slashes.filter(slash => {
        slash.life--;
        return slash.life > 0;
    });
}

function draw() {
    fruitGameCtx.clearRect(0, 0, fruitGameCanvas.width, fruitGameCanvas.height);
    
    fruits.forEach(fruit => {
        fruitGameCtx.font = `${fruit.size}px Arial`;
        fruitGameCtx.fillText(fruit.emoji, fruit.x, fruit.y);
    });
    
    slashes.forEach(slash => {
        fruitGameCtx.strokeStyle = `rgba(255, 255, 255, ${slash.life / 10})`;
        fruitGameCtx.lineWidth = 3;
        fruitGameCtx.beginPath();
        fruitGameCtx.moveTo(slash.x1, slash.y1);
        fruitGameCtx.lineTo(slash.x2, slash.y2);
        fruitGameCtx.stroke();
    });
}

function handleSlashStart(e) {
    e.preventDefault();
    const rect = fruitGameCanvas.getBoundingClientRect();
    const startX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const startY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    
    function handleSlashEnd(e) {
        const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
        const endY = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top;
        
        checkSlash(startX, startY, endX, endY);
        
        fruitGameCanvas.removeEventListener('touchend', handleSlashEnd);
        fruitGameCanvas.removeEventListener('mouseup', handleSlashEnd);
    }
    
    fruitGameCanvas.addEventListener('touchend', handleSlashEnd, { passive: false });
    fruitGameCanvas.addEventListener('mouseup', handleSlashEnd);
}

function checkSlash(x1, y1, x2, y2) {
    slashes.push({ x1, y1, x2, y2, life: 10 });
    
    fruits.forEach(fruit => {
        if (!fruit.sliced && 
            Math.abs(fruit.x - x1) < fruit.size && 
            Math.abs(fruit.y - y1) < fruit.size) {
            fruit.sliced = true;
            fruitScore += 10;
            document.getElementById('fruitScore').textContent = fruitScore;
            
            setTimeout(() => {
                const index = fruits.indexOf(fruit);
                if (index > -1) fruits.splice(index, 1);
            }, 100);
        }
    });
}

function endFruitGame() {
    fruitGameRunning = false;
    showCustomPopup('Game Over!', `Final Score: ${fruitScore}`);
    saveHighScore('fruit', fruitScore);
}

function stopFruitGame() {
    fruitGameRunning = false;
    fruitGameCanvas.removeEventListener('touchstart', handleSlashStart);
    fruitGameCanvas.removeEventListener('mousedown', handleSlashStart);
}

// ===== CATCH HEARTS GAME =====
let heartsGameArea, heartsBasket;
let heartsGameRunning = false;
let heartsScore = 0;
let heartsLives = 3;
let fallingHearts = [];
let lastHeartTime = 0;
let basketPosition = 50;

function startHeartsGame() {
    heartsGameArea = document.getElementById('heartsGameArea');
    heartsBasket = document.getElementById('heartsBasket');
    
    heartsScore = 0;
    heartsLives = 3;
    fallingHearts = [];
    lastHeartTime = Date.now();
    heartsGameRunning = true;
    basketPosition = 50;
    
    document.getElementById('heartsScore').textContent = heartsScore;
    document.getElementById('heartsLives').textContent = '❤️'.repeat(heartsLives);
    
    heartsGameArea.addEventListener('mousemove', moveBasket);
    heartsGameArea.addEventListener('touchmove', moveBasket, { passive: false });
    
    heartsGameLoop();
}

function heartsGameLoop() {
    if (!heartsGameRunning) return;
    
    const currentTime = Date.now();
    if (currentTime - lastHeartTime > 800) {
        spawnHeart();
        lastHeartTime = currentTime;
    }
    
    updateHearts();
    
    requestAnimationFrame(heartsGameLoop);
}

function spawnHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart-falling';
    heart.textContent = '💖';
    heart.style.left = Math.random() * (heartsGameArea.offsetWidth - 30) + 'px';
    heart.style.top = '-50px';
    heart.style.animationDuration = (2 + Math.random() * 2) + 's';
    
    heartsGameArea.appendChild(heart);
    fallingHearts.push({
        element: heart,
        x: parseFloat(heart.style.left),
        width: 30,
        caught: false
    });
    
    setTimeout(() => {
        if (heart.parentNode) {
            heart.remove();
            const index = fallingHearts.findIndex(h => h.element === heart);
            if (index > -1) {
                fallingHearts.splice(index, 1);
                if (!fallingHearts[index]?.caught) {
                    heartsLives--;
                    document.getElementById('heartsLives').textContent = '❤️'.repeat(heartsLives);
                    if (heartsLives <= 0) {
                        endHeartsGame();
                    }
                }
            }
        }
    }, 4000);
}

function updateHearts() {
    fallingHearts.forEach((heart, index) => {
        if (!heart.caught) {
            const heartY = heart.element.getBoundingClientRect().bottom;
            const basketRect = heartsBasket.getBoundingClientRect();
            
            if (heart.x > basketRect.left - heart.width && 
                heart.x < basketRect.right && 
                heartY > basketRect.top && 
                heartY < basketRect.bottom) {
                heart.caught = true;
                heart.element.remove();
                fallingHearts.splice(index, 1);
                heartsScore += 5;
                document.getElementById('heartsScore').textContent = heartsScore;
            }
        }
    });
}

function moveBasket(e) {
    e.preventDefault();
    const rect = heartsGameArea.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    basketPosition = (x / rect.width) * 100;
    
    if (basketPosition < 5) basketPosition = 5;
    if (basketPosition > 95) basketPosition = 95;
    
    heartsBasket.style.left = basketPosition + '%';
    heartsBasket.style.transform = 'translateX(-50%)';
}

function endHeartsGame() {
    heartsGameRunning = false;
    showCustomPopup('Game Over!', `Final Score: ${heartsScore}`);
    saveHighScore('hearts', heartsScore);
}

function stopHeartsGame() {
    heartsGameRunning = false;
    heartsGameArea.removeEventListener('mousemove', moveBasket);
    heartsGameArea.removeEventListener('touchmove', moveBasket);
    fallingHearts.forEach(heart => heart.element.remove());
    fallingHearts = [];
}

// ===== FEELINGS PORTAL =====
function navigateToFeelingsPage(pageId, emotion = '') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        if (emotion) currentEmotion = emotion;
        if (pageId === 'feelingsPage2' && currentEmotion) {
            const heading = document.querySelector('#feelingsPage2 h2');
            if (heading) heading.textContent = `You selected: ${currentEmotion}. ${currentUser}, please let me know your thoughts.`;
        }
    }
}

function submitFeelingsEntry() {
    if (!currentUser) return;
    
    const message = document.getElementById('feelingsMessage').value.trim();
    if (!currentEmotion || !message) {
        showCustomPopup('Incomplete', 'Please select an emotion and write your thoughts.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser);

    const submitBtn = document.getElementById('submitFeelingsBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('feelingsMessage').value = '';
                navigateToFeelingsPage('feelingsPage3');
                showCustomPopup('Success', 'Your feelings have been recorded! 💌');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showCustomPopup('Error', 'Failed to submit feelings: ' + error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Entry';
        });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) return;
    
    const listContainer = document.getElementById('feelingsEntriesList');
    listContainer.innerHTML = '<p>Loading entries...</p>';
    
    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, { method: 'GET', mode: 'cors' });
        const serverData = await response.json();
        
        if (serverData.status === 'success' && serverData.data?.length > 0) {
            listContainer.innerHTML = '';
            const table = document.createElement('table');
            table.className = 'feelings-table';
            
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            ['Date & Time', 'Entry By', 'Emotion', 'Message', 'Response'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            serverData.data.forEach(entry => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                    <td><strong>${entry.submittedBy || 'Unknown'}</strong></td>
                    <td><span class="emotion-tag ${entry.emotion?.toLowerCase()}">${entry.emotion || 'N/A'}</span></td>
                    <td>${entry.message || 'No message'}</td>
                    <td id="response-${entry.timestamp}"></td>
                `;
                
                const responseCell = row.cells[4];
                if (entry.repliedBy && entry.replyMessage) {
                    responseCell.innerHTML = `
                        <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                            <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 💌';
                    replyBtn.className = 'reply-btn';
                    replyBtn.onclick = () => showCustomPopup(
                        `Reply to ${entry.submittedBy}`,
                        `Original message: "${entry.message}"\n\nYour reply:`,
                        'Write your reply here...',
                        (replyText) => {
                            if (replyText) submitReply('feeling', entry.timestamp, replyText, replyBtn);
                        }
                    );
                    responseCell.appendChild(replyBtn);
                }
            });
            
            listContainer.appendChild(table);
        } else {
            listContainer.innerHTML = '<p>No feelings entries yet.</p>';
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// ===== DIARY FUNCTIONS =====
function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
}

async function fetchDiaryEntries() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        const data = await response.json();
        diaryEntries = {};
        if (data.status === 'success' && data.data) {
            data.data.forEach(entry => diaryEntries[entry.date] = entry);
        }
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
    }
}

function renderCalendar(date) {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');
    
    if (!grid || !monthYear) return;
    
    grid.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();
    monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateStr;

        if (dateStr === today.toISOString().split('T')[0]) {
            dayCell.classList.add('today');
        }
        if (diaryEntries[dateStr]) {
            dayCell.classList.add('has-entry');
        }

        dayCell.addEventListener('click', () => {
            if (diaryEntries[dateStr]) {
                viewDiaryEntry(dateStr);
            } else {
                openDiaryEntry(dateStr);
            }
        });

        grid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    const dateObj = new Date(dateString);
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) return;

    const dateObj = new Date(dateString);
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';
    document.getElementById('diaryEntryAttribution').innerHTML = `<em>${entry.submittedBy || 'Unknown User'} Made a New entry</em>`;

    const replySection = document.getElementById('diaryViewPageReplySection');
    replySection.innerHTML = '';
    
    if (entry.repliedBy && entry.replyMessage) {
        replySection.innerHTML = `
            <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
            </div>
        `;
    } else {
        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Reply 💌';
        replyBtn.className = 'reply-btn';
        replyBtn.onclick = () => showCustomPopup(
            `Reply to Diary Entry`,
            `Original entry: "${entry.thoughts}"\n\nYour reply:`,
            'Write your reply here...',
            (replyText) => {
                if (replyText) submitReply('diary', dateString, replyText, replyBtn);
            }
        );
        replySection.appendChild(replyBtn);
    }
    
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    if (!currentUser) return;
    
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;
    
    if (!thoughts) {
        showCustomPopup('Incomplete', 'Please write your thoughts.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser);

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                return fetchDiaryEntries().then(() => {
                    renderCalendar(calendarCurrentDate);
                    navigateToDiaryPage('diaryConfirmationPage');
                    showCustomPopup('Success', 'Diary entry saved! 📝');
                });
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showCustomPopup('Error', 'Failed to save diary: ' + error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Entry';
        });
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) return;
    
    const listContainer = document.getElementById('allDiaryEntriesList');
    listContainer.innerHTML = '<p>Loading entries...</p>';
    
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        const serverData = await response.json();
        
        if (serverData.status === 'success' && serverData.data?.length > 0) {
            listContainer.innerHTML = '';
            serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'diary-entry-list-item';
                
                const dateObj = new Date(entry.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                entryDiv.innerHTML = `
                    <h3>${formattedDate}</h3>
                    <div class="entry-meta-info ${entry.submittedBy?.toLowerCase()}-entry">
                        <strong>${entry.submittedBy || 'Unknown User'}</strong> Made a New entry:
                    </div>
                    <p class="entry-content">${entry.thoughts || 'No thoughts.'}</p>
                `;
                
                if (entry.repliedBy && entry.replyMessage) {
                    entryDiv.innerHTML += `
                        <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                            <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 💌';
                    replyBtn.className = 'reply-btn';
                    replyBtn.onclick = () => showCustomPopup(
                        'Reply to Entry',
                        `Entry: "${entry.thoughts}"\n\nYour reply:`,
                        'Write your reply...',
                        (replyText) => {
                            if (replyText) submitReply('diary', entry.date, replyText, replyBtn);
                        }
                    );
                    entryDiv.appendChild(replyBtn);
                }
                
                listContainer.appendChild(entryDiv);
            });
        } else {
            listContainer.innerHTML = '<p>No diary entries yet.</p>';
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// ===== REPLY FUNCTION =====
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!currentUser || !replyMessage.trim()) {
        showCustomPopup('Error', 'Reply cannot be empty.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser);

    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Replying...';
    }

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        const data = await response.json();
        
        if (data.status === 'success') {
            showCustomPopup('Success', 'Reply sent successfully! 💌');
            
            if (entryType === 'feeling') {
                fetchAndDisplayFeelingsEntries();
            } else {
                await fetchDiaryEntries();
                renderCalendar(calendarCurrentDate);
                if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                    fetchAndDisplayAllDiaryEntries();
                }
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showCustomPopup('Error', 'Failed to send reply: ' + error.message);
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Reply 💌';
        }
    }
}

// ===== PERIOD TRACKER =====
function selectMood(mood) {
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    selectedMood = mood;
}

function addPeriodEntry() {
    const startDate = document.getElementById('periodStartDate').value;
    const endDate = document.getElementById('periodEndDate').value || startDate;
    
    if (!startDate) {
        showCustomPopup('Error', 'Please select at least a start date.');
        return;
    }

    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    
    periodData.push({
        startDate,
        endDate,
        mood: selectedMood,
        loggedBy: currentUser,
