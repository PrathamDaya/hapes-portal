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
let selectedMood = null;

// ===== DYNAMIC TIMELINE LOGIC =====

// 1. Initialize Data (Load from LocalStorage OR use Defaults)
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData')) || [
    { id: 1, date: "2023-01-01", title: "Where it began", img: "assets/Timeline/1.jpg", desc: "The start of us." },
    { id: 2, date: "2023-02-14", title: "Valentine's", img: "assets/Timeline/2.jpg", desc: "Our first V-day." }
];

// Ensure all items have IDs (Migration for old data)
timelineData.forEach((item, index) => {
    if (!item.id) item.id = Date.now() + index;
});

// 2. Render Function (Displays the data)
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = ''; 

    // Sort by Date (Newest First)
    timelineData.sort((a, b) => new Date(b.date) - new Date(a.date));

    timelineData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        
        // Random tilt
        const rotation = Math.random() * 6 - 3;
        card.style.setProperty('--rotation', `${rotation}deg`);

        const imgContainer = document.createElement('div');
        imgContainer.className = 'polaroid-img-container';
        
        const img = document.createElement('img');
        img.src = item.img;
        img.onerror = function() { 
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23ddd%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%23aaa%22%3EPhoto%3C%2Ftext%3E%3C%2Fsvg%3E'; 
        }; 
        
        imgContainer.appendChild(img);
        
        const dateEl = document.createElement('div');
        dateEl.className = 'timeline-date';
        const dateObj = new Date(item.date);
        dateEl.textContent = isNaN(dateObj) ? item.date : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const titleEl = document.createElement('div');
        titleEl.className = 'timeline-title';
        titleEl.textContent = item.title;

        card.appendChild(imgContainer);
        card.appendChild(dateEl);
        card.appendChild(titleEl);
        
        // Pass the specific Item ID for reference
        card.onclick = () => openMemoryModal(item.id);
        container.appendChild(card);
    });
}

// 3. Add / Edit Memory Functions
function openAddMemoryModal() {
    // Reset fields for "Add" mode
    document.getElementById('addEditModalTitle').textContent = "Add New Memory 📝";
    document.getElementById('memEntryId').value = ""; // Empty ID means new
    document.getElementById('newMemTitle').value = "";
    document.getElementById('newMemDate').value = "";
    document.getElementById('newMemImgNum').value = "";
    document.getElementById('newMemDesc').value = "";
    
    document.getElementById('addMemoryModal').style.display = 'flex';
}

function closeAddMemoryModal() {
    document.getElementById('addMemoryModal').style.display = 'none';
}

function saveNewMemory() {
    const id = document.getElementById('memEntryId').value;
    const title = document.getElementById('newMemTitle').value;
    const date = document.getElementById('newMemDate').value;
    const imgNum = document.getElementById('newMemImgNum').value;
    const desc = document.getElementById('newMemDesc').value;

    if (!title || !date || !imgNum) {
        showCustomPopup("Error", "Please fill in Title, Date, and Image Number.");
        return;
    }

    const imgPath = `assets/Timeline/${imgNum}.jpg`;

    if (id) {
        // EDIT MODE: Update existing
        const index = timelineData.findIndex(item => item.id == id);
        if (index !== -1) {
            timelineData[index] = {
                id: parseInt(id), // Keep existing ID
                title: title,
                date: date,
                img: imgPath,
                desc: desc
            };
            showCustomPopup("Updated!", "Memory has been updated.");
        }
    } else {
        // CREATE MODE: Add new
        const newEntry = {
            id: Date.now(), // Generate unique ID
            title: title,
            date: date,
            img: imgPath, 
            desc: desc
        };
        timelineData.push(newEntry);
        showCustomPopup("Saved!", "Memory added to timeline.");
    }

    // Save to Storage
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));

    // Refresh View
    renderTimeline();
    closeAddMemoryModal();
}

// 4. View / Edit / Delete Memory Functions
function openMemoryModal(id) {
    const item = timelineData.find(x => x.id == id);
    if (!item) return;

    const modal = document.getElementById('memoryModal'); 
    
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalImg').src = item.img;
    document.getElementById('modalDesc').textContent = item.desc || "No description.";
    
    // Attach functionality to Edit/Delete buttons
    const editBtn = document.getElementById('btnEditMemory');
    const delBtn = document.getElementById('btnDeleteMemory');

    editBtn.onclick = () => openEditMemoryModal(item);
    delBtn.onclick = () => deleteMemory(item.id);

    modal.style.display = 'flex';
}

function closeMemoryModal() {
    document.getElementById('memoryModal').style.display = 'none';
}

function openEditMemoryModal(item) {
    // Close View Modal
    closeMemoryModal();

    // Open Add Modal but in Edit Mode
    document.getElementById('addEditModalTitle').textContent = "Edit Memory ✏️";
    document.getElementById('addMemoryModal').style.display = 'flex';

    // Fill fields
    document.getElementById('memEntryId').value = item.id;
    document.getElementById('newMemTitle').value = item.title;
    document.getElementById('newMemDate').value = item.date;
    document.getElementById('newMemDesc').value = item.desc;

    // Try to extract image number from "assets/Timeline/X.jpg"
    const imgMatch = item.img.match(/Timeline\/(\d+)\.jpg/);
    if (imgMatch && imgMatch[1]) {
        document.getElementById('newMemImgNum').value = imgMatch[1];
    } else {
        document.getElementById('newMemImgNum').value = ""; // User needs to re-enter if format is weird
    }
}

function deleteMemory(id) {
    // Create custom confirmation using the existing popup system
    showCustomPopup(
        "Delete Memory?", 
        "Are you sure you want to delete this memory? This cannot be undone.", 
        null, 
        (confirmed) => {
            if (confirmed) {
                timelineData = timelineData.filter(item => item.id != id);
                localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
                renderTimeline();
                closeMemoryModal();
                // Just to be sure
                setTimeout(() => showCustomPopup("Deleted", "Memory removed."), 300);
            }
        }
    );
}

// ===== CUSTOM POPUP (UPDATED TO SUPPORT CALLBACKS) =====
function showCustomPopup(title, message, inputPlaceholder = null, callback = null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p => p.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.marginBottom = '10px';
    titleEl.style.color = 'var(--accent-color)';
    
    const messageEl = document.createElement('p');
    messageEl.style.whiteSpace = "pre-line"; 
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
    
    // Logic for Cancel Button (Only show if callback exists - implying a choice)
    if (callback) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = '#ccc';
        cancelBtn.onclick = () => {
            overlay.remove();
            callback(false);
        };
        buttonContainer.appendChild(cancelBtn);
    }
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = inputPlaceholder ? 'Submit' : (callback ? 'Yes, Delete' : 'OK');
    if (callback && !inputPlaceholder) confirmBtn.style.background = 'var(--danger-color)';
    
    confirmBtn.onclick = () => {
        overlay.remove();
        if (callback) callback(input ? input.value : true);
    };
    
    buttonContainer.appendChild(confirmBtn);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    if (input) input.focus();
}

// ===== GAME STATE VARIABLES =====
const usePhotoAssets = true; 

// Memory Game Vars
let memMoves = 0;
let memLock = false;
let memHasFlippedCard = false;
let memFirstCard, memSecondCard;

// Canvas Game Vars
let catchGameRunning = false;
let catchScore = 0;
let catchLoopId;

let slasherGameRunning = false;
let slasherScore = 0;
let slasherLoopId;

// High Scores
let gameHighScores = {
    memory: 100,
    catch: 0,
    slasher: 0
};

// ===== DARES LIST =====
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
    }
    const storedScores = localStorage.getItem('hetuApp_highscores');
    if(storedScores) {
        gameHighScores = JSON.parse(storedScores);
    }
    updateHighScoreDisplays();
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
    container.innerHTML = '';
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

// ===== NAVIGATION =====
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') {
        showCustomPopup('Session Expired', 'Please log in again.');
        logout();
        return;
    }
    
    quitGame(false);

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
        } else if (screenId === 'dareGameScreen') {
            if (usedDares.length === coupleDares.length) usedDares = [];
            document.getElementById('dareText').textContent = "Click the button below to get your first dare!";
        } else if (screenId === 'periodTrackerScreen') {
            loadPeriodTracker();
        } else if (screenId === 'gameHubScreen') {
            updateHighScoreDisplays();
        } else if (screenId === 'timelineScreen') {
            renderTimeline();
        }
    }
}

function quitGame(navigate = true) {
    catchGameRunning = false;
    slasherGameRunning = false;
    cancelAnimationFrame(catchLoopId);
    cancelAnimationFrame(slasherLoopId);
    if (navigate) navigateToApp('gameHubScreen');
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
    const submitBtn = document.getElementById('submitFeelingsBtn');
    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('feelingsMessage').value = '';
                navigateToFeelingsPage('feelingsPage3');
                showCustomPopup('Success', 'Your feelings have been recorded! 💌');
