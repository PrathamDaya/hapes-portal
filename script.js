// --- FULLY UPDATED script.js with User Login, Attribution & Reply Functionality ---
// AND REFACTORED GAMING FEATURES (Modified for Naughty Dare only, no Letter Hunt)

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
    if (targetTargetScreen) {
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
    }
    // Removed Letter Hunt initialization here
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

// --- Naughty Dare ---
const dareTasks = [
  "Lift your shirt and let me admire or kiss your chest—no touching below the belt.",
  "Sit on my lap and grind for 1 minute—clothes stay on.",
  "Kiss my neck, chest, and ears passionately for 1 full minute.",
  "Describe how you’d touch me if clothes weren’t in the way—be detailed.",
  "Use your hands to show me where you want to be kissed—over clothes only.",
  "Give me a teasing lap dance—no undressing allowed.",
  "Moan my name softly in my ear while lightly stroking my chest or thighs (outside clothing).",
  "Pretend to undress me slowly—without actually removing anything.",
  "Blindfold me and tease me with your breath and lips—only above the waist.",
  "Let me feel your heartbeat—guide my hand under your shirt (but over a bra).",
  "Roleplay you're trying to seduce me at a party—touch me like you mean it, over clothes.",
  "Whisper your favorite way of being touched—while slowly stroking my arm or neck.",
  "Use a feather or soft object to trace my chest and thighs—outside clothing only.",
  "Tease me by kissing just around my lips—but no actual kiss for 30 seconds.",
  "Slide your hand slowly over my body—over clothing only—but maintain strong eye contact.",
  "Tell me a dirty fantasy—but one we can do *with our clothes on*.",
  "Act like you're turned on—without saying a word. Let your body do the talking.",
  "Get on top of me and slowly move—just to tease, no actual grinding.",
  "Use only your mouth to send shivers down my neck and collarbone.",
  "Let me lie down and place your hands where you'd want to be touched—over clothes.",
  "Kiss me on five different places (above the waist) while I keep my eyes closed.",
  "Touch yourself over your clothes while describing what you want me to do to you.",
  "Show me your 'pleasure face'—then explain what causes it.",
  "Put on your sexiest look, lean in close, and say what you want me to do (fully clothed).",
  "Trace my body with your hands slowly—start from shoulders down to thighs.",
  "Let me lightly spank you—just once, fully clothed.",
  "Record a 10-second audio of you saying something seductive—and let me keep it.",
  "Give me a body tour: point and say what each part craves (touch over clothes only).",
  "Get as close as possible to my lips without kissing me. Hold for 30 seconds.",
  "Lay on top of me fully clothed and describe what you'd do if there were no clothes between us."
];

let darePlayerTurnDisplay, dareResultArea, dareNextTurnBtn, getDareBtn; // Renamed variables for clarity

function initNaughtyDare() { // Renamed function
    darePlayerTurnDisplay = document.querySelector('#truthOrDareScreen .dynamicGamePlayer'); // Assuming screen ID remains 'truthOrDareScreen' for now
    dareResultArea = document.getElementById('todResultArea'); // Assuming element ID remains 'todResultArea'
    dareNextTurnBtn = document.getElementById('todNextTurnBtn'); // Assuming element ID remains 'todNextTurnBtn'
    getDareBtn = document.getElementById('getDareBtn'); // Assuming element ID remains 'getDareBtn'

    currentGamePlayer = currentUser; 
    updateDareDisplay(); // Renamed function
    dareResultArea.textContent = "Click 'Get Dare' to start!";
    dareNextTurnBtn.style.display = 'none';
    getDareBtn.style.display = 'inline-block';
}

function updateDareDisplay() { // Renamed function
    if(darePlayerTurnDisplay) darePlayerTurnDisplay.textContent = currentGamePlayer;
}

function getDare() {
    const dare = dareTasks[Math.floor(Math.random() * dareTasks.length)];
    dareResultArea.innerHTML = `<strong>Dare for ${currentGamePlayer}:</strong> ${dare}`;
    dareNextTurnBtn.style.display = 'inline-block';
    getDareBtn.style.display = 'none';
}

function dareNextTurn() { // Renamed function
    currentGamePlayer = getOpponent(currentGamePlayer);
    updateDareDisplay(); // Renamed function
    dareResultArea.textContent = `${currentGamePlayer}, your turn! Click 'Get Dare' for your next challenge.`;
    dareNextTurnBtn.style.display = 'none';
    getDareBtn.style.display = 'inline-block';
}

// Removed all Letter Hunt Game functions and variables.


// Game Selection
function selectGame(gameName) {
    if (!currentUser) {
        alert('Please log in first.');
        logout();
        return;
    }
    console.log(`Game selected: ${gameName}. Current user: ${currentUser}.`);

    switch (gameName) {
        case 'TruthOrDare': // Kept the name for now, but it's "Naughty Dare" in functionality
            navigateToApp('truthOrDareScreen');
            initNaughtyDare(); // Call the renamed init function
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
