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

// ===== DYNAMIC TIMELINE LOGIC =====

// 1. Initialize Data (With Fallback to Defaults if Empty)
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData'));

// If data is null or empty, restore defaults to prevent "Invisible Presets"
if (!timelineData || timelineData.length === 0) {
    timelineData = [
        { date: "2023-01-01", title: "Where it began", img: "assets/Timeline/1.jpg", desc: "The start of us." },
        { date: "2023-02-14", title: "Valentine's", img: "assets/Timeline/2.jpg", desc: "Our first V-day." }
    ];
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
}

// 2. Render Function
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = ''; 

    // Sort by Date (Newest First)
    timelineData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Note: We use the index argument in the loop to track specific items
    timelineData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        
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
        
        // Pass the item AND the index
        card.onclick = () => openMemoryModal(item, index);
        container.appendChild(card);
    });
}

// 3. Add/Edit Memory Functions
function openAddMemoryModal(isEdit = false) {
    const title = document.getElementById('addModalTitle');
    const indexInput = document.getElementById('editIndex');
    
    if (!isEdit) {
        title.textContent = "Add New Memory 📝";
        indexInput.value = "-1";
        // Clear fields
        document.getElementById('newMemTitle').value = '';
        document.getElementById('newMemDate').value = '';
        document.getElementById('newMemImgNum').value = '';
        document.getElementById('newMemDesc').value = '';
    } else {
        title.textContent = "Edit Memory ✏️";
    }
    
    document.getElementById('addMemoryModal').style.display = 'flex';
}

function closeAddMemoryModal() {
    document.getElementById('addMemoryModal').style.display = 'none';
}

function prepareEditMemory(index) {
    // Close the view modal
    closeMemoryModal();
    
    const item = timelineData[index];
    
    // Extract number from "assets/Timeline/5.jpg"
    let imgNum = "";
    if (item.img && item.img.includes('Timeline/')) {
        const match = item.img.match(/Timeline\/(\d+)\.jpg/);
        if (match) imgNum = match[1];
    }

    document.getElementById('newMemTitle').value = item.title;
    document.getElementById('newMemDate').value = item.date;
    document.getElementById('newMemImgNum').value = imgNum;
    document.getElementById('newMemDesc').value = item.desc;
    document.getElementById('editIndex').value = index;

    openAddMemoryModal(true);
}

function deleteMemory(index) {
    if(confirm("Are you sure you want to delete this memory? 🗑️")) {
        timelineData.splice(index, 1);
        localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
        closeMemoryModal();
        renderTimeline();
        showCustomPopup("Deleted", "Memory removed.");
    }
}

function saveNewMemory() {
    // 1. Get the values
    const title = document.getElementById('newMemTitle').value;
    const date = document.getElementById('newMemDate').value;
    const imgNum = document.getElementById('newMemImgNum').value;
    const desc = document.getElementById('newMemDesc').value;
    
    // 2. Safety Check: Does the hidden editIndex input exist?
    const editIndexInput = document.getElementById('editIndex');
    if (!editIndexInput) {
        alert("Error: HTML mismatch. Please reload the page.");
        return;
    }
    const editIndex = parseInt(editIndexInput.value);

    // 3. Validation
    if (!title || !date || !imgNum) {
        showCustomPopup("Error", "Please fill in Title, Date, and Image Number.");
        return;
    }

    const entry = {
        title: title,
        date: date,
        img: `assets/Timeline/${imgNum}.jpg`,
        desc: desc
    };

    // 4. Save or Update
    if (editIndex === -1 || isNaN(editIndex)) {
        // Add New
        timelineData.push(entry);
        showCustomPopup("Saved!", "New memory added.");
    } else {
        // Update Existing
        if (timelineData[editIndex]) {
            timelineData[editIndex] = entry;
            showCustomPopup("Updated!", "Memory edited successfully.");
        } else {
            // Fallback if index is invalid
            timelineData.push(entry);
        }
    }

    // 5. Save to LocalStorage and Refresh
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
    renderTimeline();
    closeAddMemoryModal();
    
    // 6. Clear the form
    document.getElementById('newMemTitle').value = '';
    document.getElementById('newMemDesc').value = '';
    document.getElementById('newMemImgNum').value = '';
    document.getElementById('newMemDate').value = '';
}

function openMemoryModal(item, index) {
    const modal = document.getElementById('memoryModal'); 
    if(!modal) return;
    
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalImg').src = item.img;
    document.getElementById('modalDesc').textContent = item.desc || "No description.";
    
    // Inject Edit/Delete buttons dynamically based on index
    const actionsDiv = document.getElementById('modalActions');
    actionsDiv.innerHTML = `
        <button class="edit-btn" onclick="prepareEditMemory(${index})" style="background: linear-gradient(45deg, #4facfe, #00f2fe); color: white; margin-right: 10px;">Edit ✏️</button>
        <button class="delete-btn" onclick="deleteMemory(${index})" style="background: linear-gradient(45deg, #ff9966, #ff5e62); color: white;">Delete 🗑️</button>
    `;

    modal.style.display = 'flex';
}

function closeMemoryModal() {
    document.getElementById('memoryModal').style.display = 'none';
}


// ===== GAME STATE VARIABLES =====
const usePhotoAssets = true; 

let memMoves = 0;
let memLock = false;
let memHasFlippedCard = false;
let memFirstCard, memSecondCard;

let catchGameRunning = false;
let catchScore = 0;
let catchLoopId;

let slasherGameRunning = false;
let slasherScore = 0;
let slasherLoopId;

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

let selectedMood = null;

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
        
        // 1. RE-INITIALIZE BACKGROUND WITH YOUR REQUESTED EMOJIS
        createFloatingEmojis(); 
        
        // 2. BUTTERFLIES ON LOGIN
        setTimeout(() => {
            const header = document.querySelector('.main-header h1');
            if(header) releaseButterflies(header);
        }, 500);
        
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

// ===== FLOATING EMOJI BACKGROUND (FIXED) =====
function createFloatingEmojis() {
    const container = document.getElementById('floatingBg');
    container.innerHTML = ''; // Clear previous to avoid duplicates

    // FIXED: Added Bunny, Butterfly, Flowers, Heart as requested
    const emojis = ['💖', '💕', '💗', '🐰', '🦋', '🌸', '🌼', '✨', '🌹', '🐇'];
    
    for (let i = 0; i < 20; i++) { // Increased count slightly
        const emoji = document.createElement('div');
        emoji.className = 'floating-emoji';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = Math.random() * 100 + '%';
        emoji.style.top = Math.random() * 100 + '%';
        emoji.style.animationDelay = Math.random() * 6 + 's';
        emoji.style.animationDuration = (8 + Math.random() * 6) + 's'; // Slower float
        container.appendChild(emoji);
    }
}

// ===== BUTTERFLY RELEASE EFFECT (FIXED) =====
function releaseButterflies(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        butterfly.textContent = '🦋'; 
        
        const tx = (Math.random() - 0.5) * 200 + 'px'; 
        butterfly.style.setProperty('--tx', tx);
        
        butterfly.style.left = centerX + 'px';
        butterfly.style.top = centerY + 'px';
        butterfly.style.animation = `butterflyFly 2s ease-out forwards ${Math.random() * 0.5}s`;
        
        document.body.appendChild(butterfly);
        
        setTimeout(() => {
            butterfly.remove();
        }, 3000);
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
    } else {
        showCustomPopup('Error', 'Screen not found!');
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
    releaseButterflies(submitBtn);

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
                            <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    // FIXED: REPLACED WITH POSTBOX EMOJI
                    replyBtn.textContent = 'Reply 📮'; 
                    replyBtn.className = 'reply-btn small-reply-btn';
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
                <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
            </div>
        `;
    } else {
        const replyBtn = document.createElement('button');
        // FIXED: REPLACED WITH POSTBOX EMOJI
        replyBtn.textContent = 'Reply 📮';
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

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    releaseButterflies(submitBtn);

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser);

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
                            <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    // FIXED: REPLACED WITH POSTBOX EMOJI
                    replyBtn.textContent = 'Reply 📮';
                    replyBtn.className = 'reply-btn small-reply-btn';
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
            showCustomPopup('Success', 'Reply sent successfully! 📮');
            
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
            buttonElement.textContent = 'Reply 📮';
        }
    }
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
}

// ===== PERIOD TRACKER (FIXED) =====
function selectMood(mood) {
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    selectedMood = mood;
}

function addPeriodEntry() {
    const startDate = document.getElementById('periodStartDate').value;
    const endDate = document.getElementById('periodEndDate').value || startDate;
    const cycleLengthInput = document.getElementById('cycleLengthInput');
    
    if (!startDate) {
        showCustomPopup('Error', 'Please select at least a start date.');
        return;
    }

    // Save cycle length preference
    if (cycleLengthInput) {
        localStorage.setItem('periodCycleLength', cycleLengthInput.value);
    }

    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    
    periodData.push({
        startDate,
        endDate,
        mood: selectedMood,
        loggedBy: currentUser,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('periodData', JSON.stringify(periodData));
    
    // Clear inputs
    document.getElementById('periodStartDate').value = '';
    document.getElementById('periodEndDate').value = '';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    selectedMood = null;
    
    loadPeriodTracker();
    showCustomPopup('Success', 'Period entry recorded!');
}

function loadPeriodTracker() {
    // 1. Load Cycle Length Preference
    const savedCycle = localStorage.getItem('periodCycleLength');
    const cycleInput = document.getElementById('cycleLengthInput');
    if (savedCycle && cycleInput) {
        cycleInput.value = savedCycle;
    }
    
    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    
    const statusEl = document.getElementById('periodStatus');
    const nextInfoEl = document.getElementById('nextPeriodInfo');
    
    if (periodData.length === 0) {
        statusEl.textContent = 'No period data recorded yet.';
        nextInfoEl.textContent = '';
        renderPeriodCalendar();
        return;
    }

    // Sort by Date (Newest first)
    const sortedData = periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const lastPeriod = sortedData[0];
    const lastStart = new Date(lastPeriod.startDate);
    
    // FIXED: Use user input for calculation
    const cycleLength = parseInt(cycleInput.value) || 28;
    
    const nextPeriodDate = new Date(lastStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysUntilNext = Math.ceil((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
    
    // Determine status message
    if (daysUntilNext <= 7 && daysUntilNext > 0) {
        statusEl.innerHTML = `⚠️ Period expected in ${daysUntilNext} days`;
    } else if (daysUntilNext <= 0) {
        statusEl.textContent = '⚠️ Period might be late (or due today)';
    } else {
        statusEl.textContent = `✅ Period tracked. Next expected in ~${daysUntilNext} days`;
    }
    
    nextInfoEl.innerHTML = `
        <strong>Next Period:</strong> ${nextPeriodDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}<br>
        <strong>Cycle Setting:</strong> ${cycleLength} days<br>
        <strong>Last Period:</strong> ${lastStart.toLocaleDateString()}
    `;
    
    renderPeriodCalendar();
}

function changePeriodMonth(direction) {
    periodCalendarDate.setMonth(periodCalendarDate.getMonth() + direction);
    renderPeriodCalendar();
}

function renderPeriodCalendar() {
    const grid = document.getElementById('periodCalendarGrid');
    const monthYear = document.getElementById('periodMonthYear');
    const cycleInput = document.getElementById('cycleLengthInput');
    
    if (!grid || !monthYear) return;
    
    grid.innerHTML = '';
    const month = periodCalendarDate.getMonth();
    const year = periodCalendarDate.getFullYear();
    monthYear.textContent = `${periodCalendarDate.toLocaleString('default', { month: 'long' })} ${year}`;

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
    today.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDate = new Date(dateStr);
        currentDate.setHours(0,0,0,0);
        
        // 1. Check for Past Periods
        const isPastPeriod = periodData.some(entry => {
            const start = new Date(entry.startDate);
            const end = new Date(entry.endDate);
            // Reset hours for accurate comparison
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            return currentDate >= start && currentDate <= end;
        });
        
        if (isPastPeriod) {
            dayCell.classList.add('period-day');
        }
        
        // 2. Prediction Logic (FIXED)
        if (periodData.length > 0) {
            const lastPeriod = periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
            const lastStart = new Date(lastPeriod.startDate);
            const cycleLength = parseInt(cycleInput.value) || 28;
            
            // Calculate NEXT start date strictly
            const nextStart = new Date(lastStart);
            nextStart.setDate(nextStart.getDate() + cycleLength);
            nextStart.setHours(0,0,0,0);

            // Predict a 5-day window starting from calculated date
            const predictionEnd = new Date(nextStart);
            predictionEnd.setDate(predictionEnd.getDate() + 4);

            if (currentDate >= nextStart && currentDate <= predictionEnd) {
                dayCell.classList.add('predicted-period');
            }
        }
        
        if (dateStr === today.toISOString().split('T')[0]) {
            dayCell.classList.add('today');
        }
        
        grid.appendChild(dayCell);
    }
}

// ===== GAME ARCADE LOGIC =====
function updateHighScoreDisplays() {
    document.getElementById('memHighScore').textContent = gameHighScores.memory === 100 ? '-' : gameHighScores.memory + " moves";
    document.getElementById('catchHighScore').textContent = gameHighScores.catch;
    document.getElementById('slashHighScore').textContent = gameHighScores.slasher;
}

function saveHighScores() {
    localStorage.setItem('hetuApp_highscores', JSON.stringify(gameHighScores));
    updateHighScoreDisplays();
}

// --- MEMORY GAME ---
function startMemoryGame() {
    navigateToApp('memoryGameScreen');
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memMoves = 0;
    document.getElementById('memoryMoves').textContent = memMoves;
    memLock = false;
    memHasFlippedCard = false;

    // FIXED EMOJIS HERE
    const items = usePhotoAssets 
        ? ['assets/mem1.jpg', 'assets/mem2.jpg', 'assets/mem3.jpg', 'assets/mem4.jpg', 'assets/mem5.jpg', 'assets/mem6.jpg'] 
        : ['🧸', '🐰', '💖', '🍓', '💋', '🌹']; 

    const deck = [...items, ...items].sort(() => 0.5 - Math.random());

    deck.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.framework = item;

        const frontFace = document.createElement('div');
        frontFace.classList.add('front-face');
        if (usePhotoAssets) {
            const img = document.createElement('img');
            img.src = item;
            img.onerror = function() { this.style.display='none'; frontFace.textContent='📷'; };
            frontFace.appendChild(img);
        } else {
            frontFace.textContent = item;
        }

        const backFace = document.createElement('div');
        backFace.classList.add('back-face');
        backFace.textContent = '?';

        card.appendChild(frontFace);
        card.appendChild(backFace);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (memLock) return;
    if (this === memFirstCard) return;

    this.classList.add('flip');

    if (!memHasFlippedCard) {
        memHasFlippedCard = true;
        memFirstCard = this;
        return;
    }

    memSecondCard = this;
    checkForMatch();
}

function checkForMatch() {
    memMoves++;
    document.getElementById('memoryMoves').textContent = memMoves;

    let isMatch = memFirstCard.dataset.framework === memSecondCard.dataset.framework;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    memFirstCard.removeEventListener('click', flipCard);
    memSecondCard.removeEventListener('click', flipCard);
    resetBoard();
    
    if (document.querySelectorAll('.memory-card.flip').length === 12) {
        setTimeout(() => {
            if (memMoves < gameHighScores.memory) {
                gameHighScores.memory = memMoves;
                saveHighScores();
                showCustomPopup("New High Score!", `You won in ${memMoves} moves! 🎉`);
            } else {
                showCustomPopup("You Won!", `Finished in ${memMoves} moves.`);
            }
        }, 500);
    }
}

function unflipCards() {
    memLock = true;
    setTimeout(() => {
        memFirstCard.classList.remove('flip');
        memSecondCard.classList.remove('flip');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [memHasFlippedCard, memLock] = [false, false];
    [memFirstCard, memSecondCard] = [null, null];
}

// --- CATCH THE HEART GAME ---
function startCatchGame() {
    navigateToApp('catchGameScreen');
    const canvas = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');
    
    setTimeout(() => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('catchStartOverlay').style.display = 'flex';
    }, 100);
}

function initCatchGame() {
    document.getElementById('catchStartOverlay').style.display = 'none';
    const canvas = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    catchScore = 0;
    document.getElementById('catchScore').textContent = catchScore;
    catchGameRunning = true;

    const basket = { 
        x: canvas.width / 2 - 25, 
        y: canvas.height - 50, 
        width: 50, 
        height: 30 
    };
    let items = [];
    let frame = 0;

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const activeCtx = newCanvas.getContext('2d');

    function moveBasket(e) {
        if (!catchGameRunning) return;
        e.preventDefault();
        const rect = newCanvas.getBoundingClientRect();
        
        let clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        basket.x = clientX - rect.left - basket.width / 2;
        
        if (basket.x < 0) basket.x = 0;
        if (basket.x + basket.width > newCanvas.width) basket.x = newCanvas.width - basket.width;
    }

    newCanvas.addEventListener('mousemove', moveBasket);
    newCanvas.addEventListener('touchmove', moveBasket, { passive: false });

    function loop() {
        if (!catchGameRunning) return;

        activeCtx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        activeCtx.fillStyle = '#d94a6b';
        activeCtx.fillRect(basket.x, basket.y, basket.width, basket.height);
        activeCtx.fillStyle = 'white';
        activeCtx.font = '20px Arial';
        // FIXED: BASKET EMOJI
        activeCtx.fillText('🧺', basket.x + 10, basket.y + 22);

        if (frame % 40 === 0) {
            const isBad = Math.random() < 0.3;
            items.push({
                x: Math.random() * (newCanvas.width - 30),
                y: -30,
                // FIXED: FALLING HEARTS AND BROKEN HEARTS
                type: isBad ? '💔' : '💖',
                speed: 2 + Math.random() * 3
            });
        }

        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += item.speed;
            activeCtx.font = '30px Arial';
            activeCtx.fillText(item.type, item.x, item.y);

            if (item.y > basket.y && item.y < basket.y + basket.height &&
                item.x + 30 > basket.x && item.x < basket.x + basket.width) {
                
                if (item.type === '💔') {
                    endCatchGame();
                    return;
                } else {
                    catchScore++;
                    document.getElementById('catchScore').textContent = catchScore;
                    items.splice(i, 1);
                }
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
        showCustomPopup('Game Over', `New High Score: ${catchScore}! 🏆`);
    } else {
        showCustomPopup('Game Over', `Score: ${catchScore}`);
    }
    document.getElementById('catchStartOverlay').style.display = 'flex';
}

// --- LOVE SLASHER GAME ---
function startSlasherGame() {
    navigateToApp('slasherGameScreen');
    const canvas = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');
    
    setTimeout(() => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('slasherStartOverlay').style.display = 'flex';
    }, 100);
}

function initSlasherGame() {
    document.getElementById('slasherStartOverlay').style.display = 'none';
    const canvas = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    slasherScore = 0;
    document.getElementById('slasherScore').textContent = slasherScore;
    slasherGameRunning = true;

    let fruits = []; 
    let particles = []; 
    let frame = 0;
    const gravity = 0.15;
    let trail = [];

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const activeCtx = newCanvas.getContext('2d');

    function inputHandler(e) {
        if (!slasherGameRunning) return;
        e.preventDefault(); 
        
        const rect = newCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        trail.push({x, y, life: 10});

        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            const dist = Math.sqrt((x - f.x) ** 2 + (y - f.y) ** 2);
            if (dist < f.size) {
                if (f.type === '💣') {
                    endSlasherGame();
                    return;
                }
                slasherScore++;
                document.getElementById('slasherScore').textContent = slasherScore;
                createParticles(f.x, f.y, f.color);
                fruits.splice(i, 1);
            }
        }
    }

    newCanvas.addEventListener('mousemove', inputHandler);
    newCanvas.addEventListener('touchmove', inputHandler, { passive: false });

    function createParticles(x, y, color) {
        for(let i=0; i<5; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 20,
                color: color
            });
        }
    }

    function loop() {
        if (!slasherGameRunning) return;
        activeCtx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        activeCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        activeCtx.lineWidth = 3;
        activeCtx.beginPath();
        for (let i = 0; i < trail.length; i++) {
            let p = trail[i];
            if (i === 0) activeCtx.moveTo(p.x, p.y);
            else activeCtx.lineTo(p.x, p.y);
            p.life--;
        }
        activeCtx.stroke();
        trail = trail.filter(p => p.life > 0);

        if (frame % 50 === 0) {
            // FIXED: FRUIT AND BOMB EMOJIS AS REQUESTED
            const types = [
                {emoji: '🍓', color: 'red'}, 
                {emoji: '🍉', color: 'green'}, 
                {emoji: '🍊', color: 'orange'}, 
                {emoji: '💣', color: 'black'}
            ];
            const obj = types[Math.floor(Math.random() * types.length)];
            fruits.push({
                x: Math.random() * (newCanvas.width - 60) + 30,
                y: newCanvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 5 + 8),
                type: obj.emoji,
                color: obj.color,
                size: 30
            });
        }

        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vy += gravity;

            activeCtx.font = '40px Arial';
            activeCtx.fillText(f.type, f.x - 15, f.y + 15);

            if (f.y > newCanvas.height + 50) fruits.splice(i, 1);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            activeCtx.fillStyle = p.color;
            activeCtx.beginPath();
            activeCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            activeCtx.fill();
            if(p.life <= 0) particles.splice(i, 1);
        }

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
        showCustomPopup('BOOM! 💥', `Game Over. Score: ${slasherScore}`);
    }
    document.getElementById('slasherStartOverlay').style.display = 'flex';
}

// ===== ENHANCED MISS YOU POPUP =====
function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-button .bunny-face');
    bunnyFace.classList.add('spinning');
    
    setTimeout(() => {
        bunnyFace.classList.remove('spinning');
        
        const hour = new Date().getHours();
        let message = "";

        if (hour >= 5 && hour < 12) {
            message = "Good morning, sunshine! ☀️";
        } else if (hour >= 22 || hour < 5) {
            message = "Sweet dreams, my love 🌙";
        } else {
            const msgs = [
                "You're my favorite notification 📱",
                "I love you my chikoo! 🥰",
                "Sending virtual huggies 🤗 to my darling!",
                "Sending virtual kissy 😘 to my darling!",
                "Thinking of you, always! ✨",
                "You're the best! 💖"
            ];
            message = msgs[Math.floor(Math.random() * msgs.length)];
        }

        if (currentUser === 'Prath' && message.includes('kissy') || message.includes('huggies')) {
             message += "\n(From Chikoo)";
        }
        
        document.getElementById('missYouMessage').textContent = message;
        document.getElementById('missYouPopup').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }, 2000);
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkLoginStatus();
    
    // Create floating emojis if not logged in initially
    if (!currentUser) createFloatingEmojis();
    
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        };
    }
    
    document.getElementById('themeToggle').onclick = toggleTheme;
    
    // Save Cycle Length on Change
    const cycleInput = document.getElementById('cycleLengthInput');
    if(cycleInput) {
        cycleInput.addEventListener('change', () => {
            localStorage.setItem('periodCycleLength', cycleInput.value);
            loadPeriodTracker(); // Refresh prediction immediately
        });
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
