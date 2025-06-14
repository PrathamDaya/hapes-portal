// --- FULLY UPDATED script.js with User Login, Attribution, Reply & Dare Game Functionality ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec'; // <<< REPLACE WITH YOUR URL

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Dark Mode Toggle Element
const darkModeToggle = document.getElementById('darkModeToggle');

// Dare Game Elements
const dareTextElement = document.getElementById('dareText');

// Song Game Elements
const songTextElement = document.getElementById('songText'); // New element for song display

// Global variables for application state
let currentUser = ''; 
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
const DARK_MODE_KEY = 'hetuAppDarkMode'; // Key for dark mode preference
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {}; 

// --- Dares List ---
// Dares are designed for couples, aiming for playful, intimate, and sexy interactions.
// "Upper body nudity" is permitted as per request.
// The term "partner" is used to refer to the other person in the couple.
const coupleDares = [
  "Take your shirt off slowly and rub yourself over your pants while staring at your partner.",
  "Rub your bulge or clit slowly over your pants while grinding against your partner’s thigh.",
  "Spell your partner’s name with your fingers across your chest—then make them watch you touch yourself over your pants.",
  "Play with your nipples while rubbing yourself over your pants for 30 seconds.",
  "Sit shirtless and tell your partner, 'You can kiss me anywhere anywhere above the waist.' Let them choose.",
  "Keep one hand on your chest and the other teasing yourself over your clothes while talking dirty.",
  "Remove your shirt with eye contact, then grab yourself over your pants and say what you want.",
  "Grind in the air while topless and rubbing yourself over your pants — let them watch.",
  "Let your partner kiss or suck one of your nipples — then touch yourself over your clothes for 10 seconds.",
  "Rub yourself over your clothes and try to make your partner moan just by watching.",
  "Offer your partner a choice: lick your nipple, or watch you touch yourself over your clothes.",
  "Grab yourself over your clothes and whisper something explicit you want to do.",
  "Rub yourself on your partner’s thigh — all over clothes — while kissing their neck.",
  "Let your partner tease your chest until you moan — you can only touch yourself, not them.",
  "Rub yourself slowly over your pants. When your partner says 'stop,' freeze and beg for more.",
  "Sit on your partner’s lap topless, grind slowly, and touch yourself over your clothes.",
  "Rub yourself slowly while holding eye contact — whisper their name softly.",
  "Rub your nipples with one hand and your private area (over clothes) with the other — try not to moan.",
  "Give a topless lap dance while rubbing yourself gently through your clothes.",
  "Offer your partner a choice: kiss your chest or watch you touch yourself for 15 seconds.",
  "Stand topless in front of a mirror and rub yourself while your partner watches from behind.",
  "Rub yourself while whispering something naughty you want your partner to do.",
  "Let your partner kiss your chest — each kiss earns them 5 seconds of watching you tease yourself.",
  "Let them use only their mouth on your nipples while you rub yourself — no hands allowed.",
  "Tug one nipple and grind on their thigh — all over clothes.",
  "Press your bare chest to theirs and slowly grind without using hands.",
  "Rub yourself slowly and whisper, 'I’m already wet/hard… can you feel it?'",
  "Straddle your partner topless, kiss their neck, and rub yourself against them over clothes.",
  "Let them guide your hand as you touch yourself — they control when you stop.",
  "Say your partner’s name while playing with your chest and rubbing yourself through clothes."
];
let usedDares = [];

// --- Song List (from wwe.xlsx - Sheet1.csv) ---
// This array will be populated from the CSV data.
const songList = [
    "Tu Jaane Na", "Hum Nashe Mein Toh Nahin", "Tum Ho", "Jee Le Zaraa", "Phir Se Ud Chala",
    "Pehli Nazar Mein", "Mere Bina", "Khoya Khoya", "Aao Naa", "Tujhe Bhula Diya",
    "Kun Faya Kun", "Abhi Kuch Dino Se", "Maula Mere Maula", "Maahi", "Bheegi Si Bhaagi Si",
    "Khuda Jaane (From \"Bachna Ae Haseeno\")", "Raabta", "Aas Paas Khuda", "O Re Piya", "Hosanna",
    "Saiyyan", "Tujhko Jo Paaya", "Tere Bin Nahi Laage (Male Version)", "Ajj Din Chadheya", "Rang Jo Lagyo",
    "Jashn-E-Bahaaraa", "Phir Mohabbat", "Main Rang Sharbaton Ka", "Darmiyaan", "Is This Love",
    "BHAGE RE MANN", "SAU DARD", "Sapna Jahan (From \"Brothers\")", "KABHI KABHI ADITI", "Wo Ajnabee",
    "Hale Dil", "PEE LOON", "ADHOORE", "Tere Ho Ke Rahenge - Reprise", "GUZARISH",
    "Saaiyaan", "TENNU LE", "Khudaya Khair", "Mann Mera", "O Saathi (From \"Baaghi 2\")",
    "Surili Akhiyon Wale", "KUCHH KHAAS", "Soulmate", "Saiyaara", "TUM SE HI",
    "Hey Ya !", "Tu Hi Meri Shab Hai (From \"Gangster\")", "Zara Sa", "SONIYE", "SAUDEBAZI (ENCORE)",
    "Tum Mile", "Dildaara (Stand By Me)", "Criminal", "Uff Teri Adaa", "Tu Hi Mera",
    "GUSTAKH DIL TERE LIYE", "Madhubala", "Tum Se", "Tum Mile (Love Reprise)", "Akhiyaan Gulaab",
    "Hua Main", "Lover", "Tumse Hi Tumse", "Tere Bina", "OFFO",
    "Tum Hi Ho Bandhu", "AAO MILO CHALO", "SOORAJ DOOBA HAIN", "Tu Mera Hero", "Make Some Noise For The Desi Boyz",
    "SAWAAR LOON", "Bandook Meri Laila (feat. Raftaar, Sidharth Malhotra)", "TUMSE MILKE DIL KA", "Saibo", "Piya O Re Piya",
    "Mileya Mileya", "Gulabi", "Bairiyaa", "YE TUNE KYA KIYA", "Tune Jo Na Kaha",
    "TUM JO AAYE", "Right Now Now", "Subha Hone Na De", "Lat Lag Gayee", "Prem Ki Naiyya",
    "DADDY MUMMY", "Jhak Maar Ke", "Abcd", "Love Me Thoda Aur", "Sunny Sunny",
    "Gf Bf", "GIRL I NEED YOU", "Jeene Ke Hain Chaar Din", "Mujhse Shaadi Karogi", "Tum Hi Ho",
    "Meri Aashiqui", "Bol Na Halke Halke", "MAST MAGAN", "Humdard", "JAB TAK",
    "Pal", "PHIR KABHI", "Bol Do Na Zara", "SAB TERA", "KABHI JO BAADAL BARSE",
    "Ghungroo (From \"WAR\")", "Ek Main Aur Ekk Tu", "Tere Naina", "Kya Mujhe Pyar Hai", "SAWARE",
    "Tera Hone Laga Hoon", "Beete Lamhein", "KABIRA", "GENDA PHOOL", "Raataan Lambiyan (From \"Shershaah\")",
    "Duniyaa (From \"Luka Chuppi\")", "Gal Mitthi Mitthi", "LOCHA-E-ULFAT", "Jab Mila Tu", "O Rangrez",
    "Uff", "Bang Bang", "Tu Meri", "Meherbaan", "Khamoshiyan",
    "Mera Yaar", "KINNA SONA", "Allah Maaf Kare", "Soniyo", "Hookah Bar",
    "Nadaan Parinde", "SONI DE NAKHRE", "Mitwa", "Humraah (From \"Malang - Unleash The Madness\")", "Chahun Main Ya Naa",
    "Satranga", "Tere Liye", "Bakhuda Tumhi Ho", "Main Hoon Saath Tere", "Apna Bana Le (From \"Bhediya\")",
    "Dil Ibaadat", "Le Aaunga", "Jaanam (From \"Bad Newz\")", "Khoobsurat (From \"Stree 2\")", "Nazm Nazm",
    "Meherbani", "Aadat (From \"Kalyug\")", "Dagabaaz Re", "Sajdaa", "Tera Deedar Hua",
    "Sanu Ek Pal (From \"Raid\")", "TERE MAST MAST DO NAIN", "Rabba Main Toh Mar Gaya Oye", "Khairiyat", "Labon Ko",
    "Saathiya", "Tose Naina", "Jiya Dhadak Dhadak Jaye (From \"Kalyug\")", "Aa Zara", "Caller Tune",
    "You Are My Soniya", "MAIN RAHOON YA NA RAHOON", "Baarish", "Nain Katari Re", "Te Amo (Duet)",
    "Lutt Putt Gaya", "Jogi", "Rait Zara Si", "I Love You", "Pehli Dafa",
    "Itni Si Baat Hain", "Tera Fitoor", "TAINU LEKE", "Meet", "Meri Banogi Kya",
    "Teri Jhuki Nazar", "Humko Pyar Hua", "DUPATTA TERA NAU RANG DA", "Sajdaa (From \"My Name Is Khan\")", "LO MAAN LIYA",
    "Rishte Naate", "Aa Jao Meri Tamanna", "Marjaani", "Ishq Sufiyana", "Shaayraana",
    "Kajra Re | Full Song | Bunty Aur Babli | Aishwarya, Abhishek, Amitabh Bachchan | Shankar-Ehsaan-Loy",
    "Chaudhary", "Thodi Der", "Boom Boom (Lip Lock)"
];
let usedSongs = [];


// --- User Authentication and Session ---
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
        showCustomMessage('Invalid user selection.');
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


// --- Dark Mode Functionality ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, isDarkMode);
    console.log(`Dark mode toggled: ${isDarkMode}`);
}

function checkDarkModePreference() {
    const storedPreference = localStorage.getItem(DARK_MODE_KEY);
    if (storedPreference === 'true') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// --- Main Navigation and Core Functions ---
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') { 
        console.warn('No user logged in. Redirecting to login.');
        logout(); 
        return;
    }
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
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
    } else if (screenId === 'dareGameScreen') {
        // Reset dares if all have been used, or on first load of the game screen
        if (usedDares.length === coupleDares.length) {
            usedDares = [];
        }
        if (dareTextElement) { // Initial message for dare game
             dareTextElement.textContent = "Click the button below to get your first dare!";
        }
    } else if (screenId === 'songGameScreen') { // New: Handle song game screen
        // Reset songs if all have been used, or on first load of the game screen
        if (usedSongs.length === songList.length) {
            usedSongs = [];
        }
        if (songTextElement) { // Initial message for song game
             songTextElement.textContent = "Click the button below to get a random song!";
        }
    }
}

// --- Custom Message Modal ---
function showCustomMessage(message) {
    const modal = document.getElementById('customMessageModal');
    const messageText = document.getElementById('customMessageText');
    if (messageText) {
        messageText.textContent = message;
    }
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideCustomMessage() {
    const modal = document.getElementById('customMessageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


// --- Hetu's Feelings Portal Functions ---
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Feelings page not found:', pageId);
        return;
    }

    if (emotion) { 
        currentEmotion = emotion;
    }

    if (pageId === 'feelingsPage2' && currentEmotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) heading.textContent = `You selected: ${currentEmotion}. ${currentUser}, please let me know your thoughts.`;
    }
    if (pageId === 'feelingsPage3') {
        const messageBox = document.getElementById('feelings-message-box');
        const messageTextarea = document.getElementById('feelingsMessage');
        if (messageBox && messageTextarea && messageTextarea.value) {
            messageBox.textContent = messageTextarea.value.substring(0, 20) + '...';
        } else if (messageBox) {
            messageBox.textContent = "Thoughts recorded!";
        }
    }
}

function submitFeelingsEntry() {
    if (!currentUser) { showCustomMessage('Please log in first.'); logout(); return; }
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();

    if (!currentEmotion) { showCustomMessage('Please select an emotion first!'); return; }
    if (!message) { showCustomMessage('Please enter your thoughts.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser); 

    const submitBtn = document.getElementById('submitFeelingsBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    console.log(`Submitting feelings entry by ${currentUser}:`, { emotion: currentEmotion, message: message.substring(0, 50) + '...' });

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Feelings Entry Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving feeling.');
        navigateToFeelingsPage('feelingsPage3');
        if (messageInput) messageInput.value = '';
    })
    .catch(error => {
        console.error('Feelings Entry Error!', error);
        showCustomMessage('Error submitting feelings entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) { showCustomMessage('Please log in to view entries.'); logout(); return; }
    console.log('Fetching feelings entries...');
    const listContainer = document.getElementById('feelingsEntriesList');
    if (!listContainer) { console.error('"feelingsEntriesList" not found.'); navigateToFeelingsPage('feelingsPage1'); return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';
    navigateToFeelingsPage('allFeelingsEntriesPage'); // Navigate to the display page

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received feelings data:', serverData);
        listContainer.innerHTML = ''; // Clear loading message

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const table = document.createElement('table');
            table.classList.add('feelings-table');
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            const headers = ['Date & Time', 'Entry By', 'Emotion', 'Message', 'Response'];
            headers.forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            const tbody = table.createTBody();
            serverData.data.forEach(entry => {
                const row = tbody.insertRow();
                const cellTimestamp = row.insertCell();
                cellTimestamp.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
                const cellSubmittedBy = row.insertCell();
                cellSubmittedBy.textContent = entry.submittedBy || 'N/A';
                const cellEmotion = row.insertCell();
                cellEmotion.textContent = entry.emotion || 'N/A';
                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'N/A';
                const cellResponse = row.insertCell();
                cellResponse.textContent = entry.response || 'N/A';
            });
            listContainer.appendChild(table);
        } else {
            listContainer.innerHTML = '<p>No feelings entries found yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching feelings entries:', error);
        listContainer.innerHTML = '<p style="color: red;">Error loading entries: ' + error.message + '</p>';
        showCustomMessage('Error loading feelings entries: ' + error.message);
    }
}


// --- Hetu's Diary Functions ---
function navigateToDiaryPage(pageId, date = null) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Diary page not found:', pageId);
        return;
    }

    if (pageId === 'diaryEntryPage') {
        const dateHeading = document.getElementById('diaryEntryDate');
        const messageTextarea = document.getElementById('diaryMessage');
        if (dateHeading) {
            const displayDate = date || calendarCurrentDate;
            dateHeading.textContent = `Entry for: ${displayDate.toDateString()}`;
        }
        if (messageTextarea) {
            const entryKey = formatDateToYYYYMMDD(date || calendarCurrentDate);
            messageTextarea.value = diaryEntries[entryKey] ? diaryEntries[entryKey].message : '';
        }
    }
    if (pageId === 'diaryEntryConfirmationPage') {
        const messageBox = document.getElementById('diary-message-box');
        const messageTextarea = document.getElementById('diaryMessage');
        if (messageBox && messageTextarea && messageTextarea.value) {
            messageBox.textContent = messageTextarea.value.substring(0, 20) + '...';
        } else if (messageBox) {
            messageBox.textContent = "Entry saved!";
        }
    }
}

async function fetchDiaryEntries() {
    if (!currentUser) { console.warn('No user logged in for diary entries.'); return; }
    console.log('Fetching diary entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries&submittedBy=${currentUser}`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received diary data:', serverData);

        diaryEntries = {}; // Clear existing entries
        if (serverData.status === 'success' && serverData.data) {
            serverData.data.forEach(entry => {
                const dateKey = formatDateToYYYYMMDD(new Date(entry.timestamp));
                diaryEntries[dateKey] = entry;
            });
        }
        console.log('Diary entries mapped:', diaryEntries);
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        showCustomMessage('Error loading diary entries: ' + error.message);
    }
}

function renderCalendar(date) {
    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    if (!monthYearDisplay || !calendarGrid) return;

    monthYearDisplay.textContent = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; // Clear previous days

    const today = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('calendar-day-header');
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Add empty divs for leading blank days
    let startDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'inactive');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(date.getFullYear(), date.getMonth(), day);
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        dayElement.dataset.date = formatDateToYYYYMMDD(currentDay);

        // Check for current day
        if (currentDay.toDateString() === today.toDateString()) {
            dayElement.classList.add('current-day');
        }

        // Check for entries
        const entryKey = formatDateToYYYYMMDD(currentDay);
        if (diaryEntries[entryKey]) {
            dayElement.classList.add('has-entry');
            const indicator = document.createElement('span');
            indicator.classList.add('entry-indicator');
            dayElement.appendChild(indicator);
        }

        dayElement.addEventListener('click', () => {
            calendarCurrentDate = currentDay; // Set selected date for entry
            navigateToDiaryPage('diaryEntryPage', currentDay);
        });
        calendarGrid.appendChild(dayElement);
    }
}

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function submitDiaryEntry() {
    if (!currentUser) { showCustomMessage('Please log in first.'); logout(); return; }
    const messageInput = document.getElementById('diaryMessage');
    const message = messageInput.value.trim();
    const entryDate = formatDateToYYYYMMDD(calendarCurrentDate);

    if (!message) { showCustomMessage('Please enter your diary entry.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('entryDate', entryDate);
    formData.append('message', message);
    formData.append('submittedBy', currentUser); 

    const submitBtn = document.getElementById('submitDiaryBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log(`Submitting diary entry by ${currentUser} for ${entryDate}:`, message.substring(0, 50) + '...');

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Diary Entry Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving diary entry.');
        diaryEntries[entryDate] = { timestamp: new Date().toISOString(), message: message, submittedBy: currentUser }; // Update local cache
        navigateToDiaryPage('diaryEntryConfirmationPage');
        if (messageInput) messageInput.value = '';
        renderCalendar(calendarCurrentDate); // Re-render calendar to show new entry
    })
    .catch(error => {
        console.error('Diary Entry Error!', error);
        showCustomMessage('Error saving diary entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayDiaryEntries() {
    if (!currentUser) { showCustomMessage('Please log in to view entries.'); logout(); return; }
    console.log('Fetching all diary entries...');
    const listContainer = document.getElementById('diaryEntriesList');
    if (!listContainer) { console.error('"diaryEntriesList" not found.'); navigateToDiaryPage('diaryCalendarPage'); return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';
    navigateToDiaryPage('allDiaryEntriesPage'); // Navigate to the display page

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries&submittedBy=${currentUser}`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received all diary data:', serverData);
        listContainer.innerHTML = ''; // Clear loading message

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const table = document.createElement('table');
            table.classList.add('diary-table');
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            const headers = ['Date & Time', 'Entry By', 'Message'];
            headers.forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            const tbody = table.createTBody();
            // Sort entries by timestamp in descending order
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            sortedEntries.forEach(entry => {
                const row = tbody.insertRow();
                const cellTimestamp = row.insertCell();
                cellTimestamp.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
                const cellSubmittedBy = row.insertCell();
                cellSubmittedBy.textContent = entry.submittedBy || 'N/A';
                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'N/A';
            });
            listContainer.appendChild(table);
        } else {
            listContainer.innerHTML = '<p>No diary entries found yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching all diary entries:', error);
        listContainer.innerHTML = '<p style="color: red;">Error loading entries: ' + error.message + '</p>';
        showCustomMessage('Error loading all diary entries: ' + error.message);
    }
}


// --- Dare Game Functions ---
function getNewDare() {
    if (coupleDares.length === 0) {
        dareTextElement.textContent = "No dares available!";
        return;
    }
    if (usedDares.length === coupleDares.length) {
        usedDares = []; // Reset if all dares have been used
        showCustomMessage("All dares used! Resetting the list.");
    }

    let newDare;
    do {
        const randomIndex = Math.floor(Math.random() * coupleDares.length);
        newDare = coupleDares[randomIndex];
    } while (usedDares.includes(newDare));

    usedDares.push(newDare);
    dareTextElement.textContent = newDare;
}

// --- Song Game Functions ---
function getNewSong() {
    if (songList.length === 0) {
        songTextElement.textContent = "No songs available!";
        return;
    }
    if (usedSongs.length === songList.length) {
        usedSongs = []; // Reset if all songs have been used
        showCustomMessage("All songs used! Resetting the list.");
    }

    let newSong;
    do {
        const randomIndex = Math.floor(Math.random() * songList.length);
        newSong = songList[randomIndex];
    } while (usedSongs.includes(newSong));

    usedSongs.push(newSong);
    songTextElement.textContent = newSong;
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    checkLoginStatus(); 
    checkDarkModePreference(); // Apply dark mode preference on load

    // Event listener for dark mode toggle button
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
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
         console.error('❌ script.js core functions not defined globally! This can happen if script is deferred or has loading issues.');
         showCustomMessage('Error: Critical script functions not loaded.');
     } else {
         console.log('✅ script.js core functions seem to be defined.');
     }
});
