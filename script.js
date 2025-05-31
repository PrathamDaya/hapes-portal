// --- FULLY UPDATED script.js with User Login, Attribution & Reply Functionality ---
// AND REFACTORED GAMING FEATURES

const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec'; // <<< YOUR URL

const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');

const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};

// --- User Authentication and Session --- ( 그대로 유지 )
function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.alignItems = 'flex-start'; 
        navigateToApp('homeScreen');
        console.log(`${currentUser} logged in.`);
    } else {
        alert('Invalid user selection.');
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay(); 
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
    document.body.style.alignItems = 'center'; 
    screens.forEach(screen => screen.classList.remove('active'));
    console.log('User logged out.');
}

function updateUserDisplay() {
    if (loggedInUserDisplay) {
        loggedInUserDisplay.textContent = currentUser ? `User: ${currentUser}` : 'User: Not logged in';
    }
    dynamicUserNameElements.forEach(el => {
        el.textContent = currentUser || 'User';
    });
    document.querySelectorAll('.dynamicGamePlayer').forEach(el => {
        el.textContent = currentGamePlayer || (currentUser || 'Player');
    });
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen'); 
    } else {
        appContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        document.body.style.alignItems = 'center';
    }
}

// --- Main Navigation ---
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen' && !loginContainer.contains(document.getElementById(screenId))) { 
        console.warn('No user logged in. Redirecting to login.');
        logout(); 
        return;
    }
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        window.scrollTo(0, 0);
    } else {
        console.error("Screen not found:", screenId);
        if (currentUser) navigateToApp('homeScreen'); 
        else logout(); 
        return;
    }

    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1');
    } else if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryCalendarPage');
        });
    } else if (screenId === 'letterHuntScreen') { // Initialize when navigating to the game
        initLetterHuntGame();
    }
}

// --- Feelings Portal & Diary Functions --- ( 그대로 유지 - For Brevity, not shown here, but they are in your original script.js)
// --- Make sure to keep all existing Feelings and Diary functions from your provided script.js ---
function navigateToFeelingsPage(pageId, emotion = '') { /* ... existing code ... */ }
function submitFeelingsEntry() { /* ... existing code ... */ }
async function fetchAndDisplayFeelingsEntries() { /* ... existing code ... */ }
function navigateToDiaryPage(pageId) { /* ... existing code ... */ }
async function fetchDiaryEntries() { /* ... existing code ... */ }
function renderCalendar(date) { /* ... existing code ... */ }
function openDiaryEntry(dateString) { /* ... existing code ... */ }
function viewDiaryEntry(dateString) { /* ... existing code ... */ }
function submitDiaryEntry() { /* ... existing code ... */ }
async function fetchAndDisplayAllDiaryEntries() { /* ... existing code ... */ }
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) { /* ... existing code ... */ }


// --- GAME VARIABLES & FUNCTIONS ---
let currentGamePlayer = ''; 
let player1Name = "Prath";
let player2Name = "Chikoo";

function getOpponent(player) {
    return player === player1Name ? player2Name : player1Name;
}

// --- Truth or Dare (Updated Content) ---
const truthQuestions = [
    "What's your go-to dance move to impress someone?",
    "Share your cheesiest pickup line – have you ever used it?",
    "Describe your ideal first kiss scenario in three words.",
    "What's a secret talent you have that might surprise the other player?",
    "If you had to serenade the other player, which song would you pick and why?",
    "What's the most adventurous thing you've done that you'd do again with the other player?",
    "What's one physical feature you find most attractive in the other player?",
    "Rate your flirting skills on a scale of 1-10 and explain why.",
    "What's something small the other player does that makes you smile?",
    "If you could plan a 'perfect playful date', what would it involve?"
];
const dareTasks = [
    "Show off your best dance move right now for 15 seconds.",
    "Try a pickup line on the other player. Make it funny or charming!",
    "Demonstrate three different types of 'air' kisses (e.g., a sweet peck, a dramatic movie kiss, a playful Eskimo kiss) towards the other player.",
    "Compliment the other player on three things you genuinely admire about them, physical or otherwise.",
    "Send the other player a flirty text message *right now* (show them you sent it!).",
    "For the next 3 questions/dares, speak in a sultry or playful voice.",
    "Gaze into the other player's eyes for 30 seconds without laughing. First one to laugh does an extra mini-dare (like 5 jumping jacks).",
    "Give the other player a 'coupon' for one future favor (keep it playful, e.g., 'Good for one back rub' or 'One free pass from doing a chore').",
    "Attempt to write a very short, playful poem about the other player in 60 seconds and read it aloud.",
    "Mimic the other player's signature pose or common gesture until they guess what you're doing."
];
let todPlayerTurnDisplay, todResultArea, todNextTurnBtn, getTruthBtn, getDareBtn;

function initTruthOrDare() {
    todPlayerTurnDisplay = document.querySelector('#truthOrDareScreen .dynamicGamePlayer');
    todResultArea = document.getElementById('todResultArea');
    todNextTurnBtn = document.getElementById('todNextTurnBtn');
    getTruthBtn = document.getElementById('getTruthBtn');
    getDareBtn = document.getElementById('getDareBtn');

    currentGamePlayer = currentUser; 
    updateTodDisplay();
    todResultArea.textContent = "Click 'Truth' or 'Dare' to start!";
    todNextTurnBtn.style.display = 'none';
    getTruthBtn.style.display = 'inline-block';
    getDareBtn.style.display = 'inline-block';
}

function updateTodDisplay() {
    if(todPlayerTurnDisplay) todPlayerTurnDisplay.textContent = currentGamePlayer;
}

function getTruth() {
    const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    todResultArea.innerHTML = `<strong>Truth for ${currentGamePlayer}:</strong> ${question}`;
    todNextTurnBtn.style.display = 'inline-block';
    getTruthBtn.style.display = 'none';
    getDareBtn.style.display = 'none';
}

function getDare() {
    const dare = dareTasks[Math.floor(Math.random() * dareTasks.length)];
    todResultArea.innerHTML = `<strong>Dare for ${currentGamePlayer}:</strong> ${dare}`;
    todNextTurnBtn.style.display = 'inline-block';
    getTruthBtn.style.display = 'none';
    getDareBtn.style.display = 'none';
}

function todNextTurn() {
    currentGamePlayer = getOpponent(currentGamePlayer);
    updateTodDisplay();
    todResultArea.textContent = `${currentGamePlayer}, your turn! Choose Truth or Dare.`;
    todNextTurnBtn.style.display = 'none';
    getTruthBtn.style.display = 'inline-block';
    getDareBtn.style.display = 'inline-block';
}


// --- Letter Item Hunt Game ---
let letterHuntGameActive = false;
let letterHuntTimeLeft = 300; // 5 minutes in seconds (300 seconds)
let letterHuntTimerInterval;
let letterHuntScores = { Prath: 0, Chikoo: 0 };
let claimedLetters = {}; // e.g., {'A': 'Prath'}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

let letterHuntTimerDisplayEl, letterHuntStartBtnEl, letterHuntEndEarlyBtnEl;
let prathScoreLHEl, chikooScoreLHEl, letterHuntStatusEl, letterHuntTableBodyEl, letterHuntPlayAgainBtnEl;

function initLetterHuntGame() {
    letterHuntTimerDisplayEl = document.getElementById('letterHuntTimerDisplay');
    letterHuntStartBtnEl = document.getElementById('letterHuntStartBtn');
    letterHuntEndEarlyBtnEl = document.getElementById('letterHuntEndEarlyBtn');
    prathScoreLHEl = document.getElementById('prathScoreLH');
    chikooScoreLHEl = document.getElementById('chikooScoreLH');
    letterHuntStatusEl = document.getElementById('letterHuntStatus');
    letterHuntTableBodyEl = document.querySelector('#letterHuntTable tbody');
    letterHuntPlayAgainBtnEl = document.getElementById('letterHuntPlayAgainBtn');

    letterHuntGameActive = false;
    letterHuntTimeLeft = 300; 
    letterHuntScores = { Prath: 0, Chikoo: 0 };
    claimedLetters = {};
    
    if (letterHuntTimerInterval) clearInterval(letterHuntTimerInterval);

    updateLetterHuntTimerDisplay();
    updateLetterHuntScoreDisplay();
    renderLetterHuntTable();

    letterHuntStatusEl.textContent = "Ready to hunt for letters?";
    letterHuntStartBtnEl.style.display = 'inline-block';
    letterHuntEndEarlyBtnEl.style.display = 'none';
    letterHuntPlayAgainBtnEl.style.display = 'none';
    
    // Ensure table checkboxes are initially disabled if rendered before game start
    letterHuntTableBodyEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = true);
}

function renderLetterHuntTable() {
    if (!letterHuntTableBodyEl) return;
    letterHuntTableBodyEl.innerHTML = ''; // Clear previous table

    alphabet.forEach(letter => {
        const row = letterHuntTableBodyEl.insertRow();
        const cellLetter = row.insertCell();
        const cellPrath = row.insertCell();
        const cellChikoo = row.insertCell();

        cellLetter.textContent = letter;
        
        const checkboxPrath = document.createElement('input');
        checkboxPrath.type = 'checkbox';
        checkboxPrath.dataset.player = player1Name;
        checkboxPrath.dataset.letter = letter;
        checkboxPrath.disabled = true; // Disabled until game starts
        checkboxPrath.onchange = function() { handleLetterClaim(this); };
        cellPrath.appendChild(checkboxPrath);

        const checkboxChikoo = document.createElement('input');
        checkboxChikoo.type = 'checkbox';
        checkboxChikoo.dataset.player = player2Name;
        checkboxChikoo.dataset.letter = letter;
        checkboxChikoo.disabled = true; // Disabled until game starts
        checkboxChikoo.onchange = function() { handleLetterClaim(this); };
        cellChikoo.appendChild(checkboxChikoo);
    });
}

function startLetterHuntGame() {
    letterHuntGameActive = true;
    letterHuntTimeLeft = 300; // Reset timer
    letterHuntScores = { Prath: 0, Chikoo: 0 }; // Reset scores
    claimedLetters = {}; // Reset claimed letters
    
    initLetterHuntGame(); // Re-initialize to reset table state and scores display

    letterHuntStatusEl.textContent = "Game On! Find those items!";
    letterHuntStartBtnEl.style.display = 'none';
    letterHuntEndEarlyBtnEl.style.display = 'inline-block';
    letterHuntPlayAgainBtnEl.style.display = 'none';


    // Enable checkboxes
    letterHuntTableBodyEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = false;
        cb.checked = false; // Ensure they are unchecked
    });

    updateLetterHuntTimerDisplay(); // Show initial time
    letterHuntTimerInterval = setInterval(letterHuntTimerTick, 1000);
}

function letterHuntTimerTick() {
    letterHuntTimeLeft--;
    updateLetterHuntTimerDisplay();
    if (letterHuntTimeLeft <= 0) {
        endLetterHuntGame();
    }
}

function updateLetterHuntTimerDisplay() {
    const minutes = Math.floor(letterHuntTimeLeft / 60);
    const seconds = letterHuntTimeLeft % 60;
    if (letterHuntTimerDisplayEl) {
        letterHuntTimerDisplayEl.textContent = `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function handleLetterClaim(checkboxElement) {
    if (!letterHuntGameActive) {
        checkboxElement.checked = false; // Revert check if game not active
        return;
    }

    const letter = checkboxElement.dataset.letter;
    const player = checkboxElement.dataset.player;

    if (currentUser !== player) {
        alert("It's not your turn to claim, or you are not logged in as this player!");
        checkboxElement.checked = false; // Revert if not the current user
        return;
    }

    if (claimedLetters[letter]) {
        // This letter is already claimed, this should ideally not happen if checkboxes are disabled correctly
        // but as a safeguard:
        if (claimedLetters[letter] !== player) { // If claimed by opponent
             alert(`Letter ${letter} already claimed by ${claimedLetters[letter]}!`);
        }
        checkboxElement.checked = (claimedLetters[letter] === player); // Ensure it reflects actual claim state
        return;
    }

    claimedLetters[letter] = player;
    letterHuntScores[player]++;
    updateLetterHuntScoreDisplay();

    // Disable both checkboxes for this letter
    document.querySelector(`input[data-letter="${letter}"][data-player="${player1Name}"]`).disabled = true;
    document.querySelector(`input[data-letter="${letter}"][data-player="${player2Name}"]`).disabled = true;
    
    // Ensure the clicked checkbox remains checked (it should be by default, but good to be explicit)
    checkboxElement.checked = true; 
    letterHuntStatusEl.textContent = `${player} claimed letter ${letter}!`;
}

function updateLetterHuntScoreDisplay() {
    if (prathScoreLHEl) prathScoreLHEl.textContent = letterHuntScores.Prath;
    if (chikooScoreLHEl) chikooScoreLHEl.textContent = letterHuntScores.Chikoo;
}

function endLetterHuntGame(early = false) {
    letterHuntGameActive = false;
    clearInterval(letterHuntTimerInterval);

    let WinnerText = "Time's up! ";
    if (early) WinnerText = "Game ended early! ";

    if (letterHuntScores.Prath > letterHuntScores.Chikoo) {
        WinnerText += `${player1Name} wins!`;
    } else if (letterHuntScores.Chikoo > letterHuntScores.Prath) {
        WinnerText += `${player2Name} wins!`;
    } else {
        WinnerText += "It's a tie!";
    }
    letterHuntStatusEl.textContent = `${WinnerText} Final Scores - Prath: ${letterHuntScores.Prath}, Chikoo: ${letterHuntScores.Chikoo}`;

    // Disable all checkboxes
    if (letterHuntTableBodyEl) {
        letterHuntTableBodyEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = true);
    }
    letterHuntEndEarlyBtnEl.style.display = 'none';
    letterHuntPlayAgainBtnEl.style.display = 'inline-block';
}


// Game Selection
function selectGame(gameName) {
    if (!currentUser) {
        alert('Please log in first.');
        logout();
        return;
    }
    console.log(`Game selected: ${gameName}. Current user: ${currentUser}.`);

    switch (gameName) {
        case 'TruthOrDare':
            navigateToApp('truthOrDareScreen');
            initTruthOrDare();
            break;
        case 'LetterHunt':
            navigateToApp('letterHuntScreen');
            // initLetterHuntGame() is called by navigateToApp if screenId is 'letterHuntScreen'
            break;
        default:
            alert('Selected game is not available yet.');
            navigateToApp('gameSelectionScreen');
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    checkLoginStatus(); 
    
    // Calendar button listeners ( 그대로 유지 )
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; 
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; 
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
     console.log('DOM loaded. External script functions should be available.');
     if (typeof navigateToApp === 'undefined') {
         console.error('❌ script.js core functions not defined globally!');
         alert('Error: Critical script functions not loaded.');
     } else {
         console.log('✅ script.js core functions seem to be defined.');
     }
});
