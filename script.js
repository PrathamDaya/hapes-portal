// ===== GLOBAL CONFIGURATION =====
// IMPORTANT: Replace with your actual Google Apps Script URL
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

const missYouMessages = [
    "I love you my chikoo! 🥰",
    "Sending virtual huggies 🤗 to my darling!",
    "Sending virtual kissy 😘 to my darling!",
    "Pratham misses you too! ❤️", 
    "Thinking of you, always! ✨",
    "You're the best! 💖"
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
    // Remove existing popups
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
        } else if (screenId === 'dareGameScreen') {
            if (usedDares.length === coupleDares.length) usedDares = [];
            document.getElementById('dareText').textContent = "Click the button below to get your first dare!";
        } else if (screenId === 'periodTrackerScreen') {
            loadPeriodTracker();
        }
    } else {
        showCustomPopup('Error', 'Screen not found!');
    }
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
                            <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 💌';
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

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Days
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
                            <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 💌';
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

    // Load existing data
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
    showCustomPopup('Success', 'Period entry recorded! 🌸');
}

function loadPeriodTracker() {
    // Load data from localStorage
    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    
    const statusEl = document.getElementById('periodStatus');
    const nextInfoEl = document.getElementById('nextPeriodInfo');
    
    if (periodData.length === 0) {
        statusEl.textContent = 'No period data recorded yet.';
        nextInfoEl.textContent = '';
        renderPeriodCalendar();
        return;
    }

    // Sort by start date
    const sortedData = periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const lastPeriod = sortedData[0];
    const lastStart = new Date(lastPeriod.startDate);
    const lastEnd = new Date(lastPeriod.endDate);
    const cycleLength = calculateAverageCycleLength();
    
    const nextPeriodDate = new Date(lastStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    
    const today = new Date();
    const daysSinceLast = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24));
    const daysUntilNext = Math.floor((nextPeriodDate - today) / (1000 * 60 * 60 * 24));
    
    // Update status
    if (daysSinceLast <= (lastEnd - lastStart) / (1000 * 60 * 60 * 24)) {
        statusEl.innerHTML = `🌸 Currently on period (Day ${daysSinceLast + 1})<br>Mood: ${lastPeriod.mood || 'Not recorded'}`;
    } else if (daysUntilNext <= 7 && daysUntilNext > 0) {
        statusEl.innerHTML = `⚠️ Period expected in ${daysUntilNext} days`;
    } else if (daysUntilNext <= 0) {
        statusEl.textContent = '⚠️ Period might be late';
    } else {
        statusEl.textContent = `✅ Period tracked. Next expected in ~${daysUntilNext} days`;
    }
    
    // Next period info
    nextInfoEl.innerHTML = `
        <strong>Next Period:</strong> ${nextPeriodDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}<br>
        <strong>Average Cycle:</strong> ${cycleLength} days<br>
        <strong>Last Period:</strong> ${lastStart.toLocaleDateString()} - ${lastEnd.toLocaleDateString()}
    `;
    
    renderPeriodCalendar();
}

function calculateAverageCycleLength() {
    if (periodData.length < 2) return 28;
    
    let totalDays = 0;
    const sortedData = periodData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    for (let i = 1; i < sortedData.length; i++) {
        const daysBetween = (new Date(sortedData[i].startDate) - new Date(sortedData[i-1].startDate)) / (1000 * 60 * 60 * 24);
        totalDays += daysBetween;
    }
    
    return Math.round(totalDays / (sortedData.length - 1));
}

function changePeriodMonth(direction) {
    periodCalendarDate.setMonth(periodCalendarDate.getMonth() + direction);
    renderPeriodCalendar();
}

function renderPeriodCalendar() {
    const grid = document.getElementById('periodCalendarGrid');
    const monthYear = document.getElementById('periodMonthYear');
    
    if (!grid || !monthYear) return;
    
    grid.innerHTML = '';
    const month = periodCalendarDate.getMonth();
    const year = periodCalendarDate.getFullYear();
    monthYear.textContent = `${periodCalendarDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if this is a period day
        const periodEntry = periodData.find(entry => {
            const start = new Date(entry.startDate);
            const end = new Date(entry.endDate);
            const current = new Date(dateStr);
            return current >= start && current <= end;
        });
        
        if (periodEntry) {
            dayCell.classList.add('period-day');
            dayCell.innerHTML += '<span class="period-marker">🌸</span>';
        }
        
        // Predict next periods
        if (periodData.length > 0) {
            const lastPeriod = periodData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
            const lastStart = new Date(lastPeriod.startDate);
            const cycleLength = calculateAverageCycleLength();
            const nextPeriodDate = new Date(lastStart);
            nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
            
            if (Math.abs(new Date(dateStr) - nextPeriodDate) < 3 * 24 * 60 * 60 * 1000) {
                dayCell.classList.add('predicted-period');
            }
        }
        
        if (dateStr === today.toISOString().split('T')[0]) {
            dayCell.classList.add('today');
        }
        
        grid.appendChild(dayCell);
    }
}

// ===== MISS YOU POPUP =====
function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-button .bunny-face');
    bunnyFace.classList.add('spinning');
    
    setTimeout(() => {
        bunnyFace.classList.remove('spinning');
        
        let message = missYouMessages[Math.floor(Math.random() * missYouMessages.length)];
        if (currentUser === 'Chikoo' && message.includes('Pratham misses you')) {
            // Keep original message
        } else if (currentUser === 'Prath' && message.includes('Pratham misses you')) {
            message = "Chikoo misses you too! ❤️";
        }
        
        document.getElementById('missYouMessage').innerHTML = message;
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
    
    // Add floating emojis to login screen if not logged in
    if (!currentUser) createFloatingEmojis();
    
    // Calendar navigation buttons
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
    
    // Theme toggle
    document.getElementById('themeToggle').onclick = toggleTheme;
});

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
