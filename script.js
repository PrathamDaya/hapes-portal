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

// Dare Game Elements
const dareTextElement = document.getElementById('dareText');

// Song Game Elements
const songTextElement = document.getElementById('songText'); // New element for song display

// Global variables for application state
let currentUser = ''; 
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
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
  "Sit shirtless and tell your partner, 'You can kiss me anywhere above the waist.' Let them choose.",
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
        // Using custom modal/message box instead of alert
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
    if (!listContainer) {
        console.error('"feelingsEntriesList" not found.');
        navigateToFeelingsPage('feelingsPage1'); return;
    }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received feelings data:', serverData);
        listContainer.innerHTML = '';

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
                cellSubmittedBy.innerHTML = `<strong>${entry.submittedBy || 'Unknown'}</strong>`;

                const cellEmotion = row.insertCell();
                const emotionSpan = document.createElement('span');
                emotionSpan.classList.add('emotion-tag', entry.emotion ? entry.emotion.toLowerCase() : 'unknown');
                emotionSpan.textContent = entry.emotion || 'N/A';
                cellEmotion.appendChild(emotionSpan);

                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'No message';

                const cellResponse = row.insertCell();
                cellResponse.style.verticalAlign = 'top';

                if (entry.repliedBy && entry.replyMessage) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display', `${entry.repliedBy.toLowerCase()}-reply`);
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestamp) {
                        const replyTimeP = document.createElement('p');
                        replyTimeP.classList.add('reply-timestamp');
                        replyTimeP.textContent = `Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`;
                        replyContainer.appendChild(replyTimeP);
                    }
                    cellResponse.appendChild(replyContainer);
                } else {
                    const replyButton = document.createElement('button');
                    replyButton.textContent = 'Reply 💌';
                    replyButton.classList.add('reply-btn', 'small-reply-btn');
                    replyButton.onclick = function() {
                        replyButton.disabled = true;
                        const entryDateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : "this feeling";
                        // Using custom prompt
                        showCustomPrompt(`Replying to ${entry.submittedBy || 'User'}'s feeling on ${entryDateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                            if (replyText !== null) { // Check if user provided input (not cancelled)
                                submitReply('feeling', entry.timestamp, replyText, replyButton);
                            } else {
                                replyButton.disabled = false; // Re-enable if cancelled
                            }
                        });
                    };
                    cellResponse.appendChild(replyButton);
                }
            });
            listContainer.appendChild(table);
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No feelings entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown server response'}</p>`;
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        if (listContainer) listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}


// --- Diary Functions ---
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Diary page not found:', pageId);
    }
}

async function fetchDiaryEntries() {
    if (!currentUser) { console.warn('User not logged in. Diary fetch aborted.'); return; }
    console.log('Fetching diary entries...');
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('scriptURL not configured. Diary entries cannot be fetched.');
        diaryEntries = {}; return; 
    }
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Diary entries response:', data);
        if (data.status === 'success') {
            diaryEntries = {}; 
            if (data.data) {
                data.data.forEach(entry => {
                    diaryEntries[entry.date] = entry;
                });
            }
            console.log('Diary entries loaded into memory:', Object.keys(diaryEntries).length);
        } else {
            console.error('Error fetching diary entries from server:', data.message);
            diaryEntries = {};
        }
    } catch (error) {
        console.error('Failed to fetch diary entries (network/fetch error):', error);
        diaryEntries = {};
    }
}

function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) {
        console.error("Calendar elements not found."); return;
    }

    calendarGrid.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();
    monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeaderEl = document.createElement('div');
        dayHeaderEl.classList.add('calendar-day-header');
        dayHeaderEl.textContent = day;
        calendarGrid.appendChild(dayHeaderEl);
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        
        const cellDate = new Date(year, month, day);
        const formattedCellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = formattedCellDate;

        if (year === todayYear && month === todayMonth && day === todayDate) {
            dayCell.classList.add('today');
        }

        if (diaryEntries[formattedCellDate]) {
            dayCell.classList.add('has-entry');
            dayCell.title = `${diaryEntries[formattedCellDate].submittedBy || 'Someone'} made an entry.`;
            if (diaryEntries[formattedCellDate].submittedBy) {
                dayCell.classList.add(`${diaryEntries[formattedCellDate].submittedBy.toLowerCase()}-entry-marker`);
            }
        }


        dayCell.addEventListener('click', () => {
            console.log('Clicked calendar day with date:', dayCell.dataset.date);
            if (diaryEntries[dayCell.dataset.date]) {
                viewDiaryEntry(dayCell.dataset.date);
            } else {
                openDiaryEntry(dayCell.dataset.date);
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    console.log('openDiaryEntry received dateString:', dateString);

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { showCustomMessage('Invalid date format for opening diary: ' + dateString); return; }
    const yearNum = parseInt(dateParts[0], 10);
    const monthNum = parseInt(dateParts[1], 10) - 1;
    const dayNum = parseInt(dateParts[2], 10);
    const dateObj = new Date(yearNum, monthNum, dayNum);

    if (isNaN(dateObj.getTime())) { showCustomMessage('Could not create valid date from: ' + dateString); return; }
    
    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    document.getElementById('diaryThoughts').placeholder = `${currentUser}, write your diary entry here...`;
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) {
        console.warn('viewDiaryEntry called for a date with no cached entry:', dateString);
        showCustomMessage('Could not load details for ' + dateString + '. Entry not found. Try going back.');
        openDiaryEntry(dateString); 
        return;
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { showCustomMessage('Invalid date format for view: ' + dateString); return; }
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    if (isNaN(dateObj.getTime())) { showCustomMessage('Invalid date object for view: ' + dateString); return; }

    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';

    const attributionElement = document.getElementById('diaryEntryAttribution');
    if (attributionElement) {
        attributionElement.innerHTML = `<em>${entry.submittedBy || 'Unknown User'} Made a New entry</em>`;
        attributionElement.className = 'entry-attribution'; 
        if (entry.submittedBy) {
            attributionElement.classList.add(`${entry.submittedBy.toLowerCase()}-entry`);
        }
    }


    const singleViewReplyContainer = document.getElementById('diaryViewPageReplySection');
    if (singleViewReplyContainer) {
        singleViewReplyContainer.innerHTML = ''; 

        if (entry.repliedBy && entry.replyMessage) {
            const replyDisplay = document.createElement('div');
            replyDisplay.classList.add('reply-display', `${entry.repliedBy.toLowerCase()}-reply`);
            const replyTextP = document.createElement('p');
            replyTextP.innerHTML = `<strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}`;
            replyDisplay.appendChild(replyTextP);
            if (entry.replyTimestamp) {
                const replyTimeP = document.createElement('p');
                replyTimeP.classList.add('reply-timestamp');
                replyTimeP.textContent = `Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})}`;
                replyDisplay.appendChild(replyTimeP);
            }
            singleViewReplyContainer.appendChild(replyDisplay);
        } else {
            const replyButton = document.createElement('button');
            replyButton.textContent = 'Reply 💌';
            replyButton.classList.add('reply-btn');
            replyButton.onclick = function() {
                replyButton.disabled = true;
                const currentDisplayDate = document.getElementById('viewDiaryDateDisplay').textContent || entry.date;
                showCustomPrompt(`Replying to ${entry.submittedBy || 'User'}'s diary entry for ${currentDisplayDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                     if (replyText !== null) {
                        submitReply('diary', dateString, replyText, replyButton);
                    } else {
                         replyButton.disabled = false;
                    }
                });
            };
            singleViewReplyContainer.appendChild(replyButton);
        }
    } else {
        console.error("Reply container 'diaryViewPageReplySection' not found.");
    }
    navigateToDiaryPage('diaryViewPage');
}


function submitDiaryEntry() {
    if (!currentUser) { showCustomMessage('Please log in first.'); logout(); return; }
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;

    if (!date) { showCustomMessage('No date selected.'); return; }
    if (!thoughts) { showCustomMessage('Please write your thoughts.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser); 

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log(`Submitting diary entry by ${currentUser}:`, { date: date, thoughts: thoughts.substring(0, 50) + '...' });

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Diary Entry Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving diary.');
        return fetchDiaryEntries().then(() => { 
             renderCalendar(calendarCurrentDate); 
             navigateToDiaryPage('diaryConfirmationPage');
        });
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

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) { showCustomMessage('Please log in to view entries.'); logout(); return; }
    console.log('Fetching all diary entries list...');
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) { console.error('"allDiaryEntriesList" not found.'); return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        listContainer.innerHTML = '<p>Error: scriptURL not configured.</p>'; return;
    }

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('All diary entries data:', serverData);
        listContainer.innerHTML = '';

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date)); 
            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                
                let formattedDate = 'Unknown Date';
                if (entry.date) {
                    const entryDateObj = new Date(entry.date + "T00:00:00"); 
                     if (!isNaN(entryDateObj.getTime())) {
                        formattedDate = entryDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    } else { formattedDate = `Invalid Date: ${entry.date}`; }
                }
                
                const entryMetaDiv = document.createElement('div');
                entryMetaDiv.classList.add('entry-meta-info');
                if(entry.submittedBy) entryMetaDiv.classList.add(`${entry.submittedBy.toLowerCase()}-entry`);
                entryMetaDiv.innerHTML = `<strong>${entry.submittedBy || 'Unknown User'}</strong> Made a New entry:`;
                
                entryDiv.innerHTML = `<h3>${formattedDate}</h3>`;
                entryDiv.appendChild(entryMetaDiv);
                const thoughtsP = document.createElement('p');
                thoughtsP.classList.add('entry-content');
                thoughtsP.textContent = entry.thoughts || 'No thoughts.';
                entryDiv.appendChild(thoughtsP);


                const replySectionDiv = document.createElement('div');
                replySectionDiv.classList.add('entry-reply-section');

                if (entry.repliedBy && entry.replyMessage) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display', `${entry.repliedBy.toLowerCase()}-reply`);
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestamp) {
                        const replyTimeP = document.createElement('p');
                        replyTimeP.classList.add('reply-timestamp');
                        replyTimeP.textContent = `Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`;
                        replyContainer.appendChild(replyTimeP);
                    }
                    replySectionDiv.appendChild(replyContainer);
                } else {
                    const replyButton = document.createElement('button');
                    replyButton.textContent = 'Reply 💌';
                    replyButton.classList.add('reply-btn', 'small-reply-btn');
                    replyButton.onclick = function(event) {
                        event.stopPropagation();
                        replyButton.disabled = true;
                        showCustomPrompt(`Replying to ${entry.submittedBy || 'User'}'s diary entry for ${formattedDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                            if (replyText !== null) {
                                submitReply('diary', entry.date, replyText, replyButton);
                            } else {
                                replyButton.disabled = false;
                            }
                        });
                    };
                    replySectionDiv.appendChild(replyButton);
                }
                entryDiv.appendChild(replySectionDiv);
                entryDiv.appendChild(document.createElement('hr')); 
                listContainer.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown server response'}</p>`;
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        console.error('Failed to fetch all diary entries list:', error);
        if (listContainer) listContainer.innerHTML = `<p>Error loading all diary entries: ${error.message}</p>`;
    }
}


// --- Submit Reply Function ---
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!currentUser) { showCustomMessage('Please log in to reply.'); logout(); return; }
    if (!replyMessage || replyMessage.trim() === "") {
        showCustomMessage("Reply cannot be empty.");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌'; }
        return;
    }

    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('Please update the scriptURL in script.js.');
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌'; }
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser); 

    const originalButtonText = buttonElement ? buttonElement.textContent : 'Reply 💌';
    if (buttonElement) {
        buttonElement.textContent = 'Replying...';
        buttonElement.disabled = true;
    }

    console.log(`${currentUser} submitting reply for ${entryType} ID ${entryIdentifier}: ${replyMessage.trim()}`);

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const text = await response.text();
            console.error('Reply submission HTTP error response text:', text);
            throw new Error(`HTTP error! ${response.status}: ${text}`);
        }
        const data = await response.json();
        console.log('Reply server response:', data);
        if (data.status === 'error') throw new Error(data.message || `Error saving reply from server.`);

        showCustomMessage(`Reply by ${currentUser} submitted successfully! Notification sent.`);
        
        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries(); 
        } else if (entryType === 'diary') {
            await fetchDiaryEntries(); 
            renderCalendar(calendarCurrentDate); 
            
            if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                fetchAndDisplayAllDiaryEntries();
            }
            const diaryViewPageActive = document.getElementById('diaryViewPage').classList.contains('active');
            const currentViewingDate = diaryEntries[entryIdentifier] ? entryIdentifier : null; 
            if (diaryViewPageActive && currentViewingDate === entryIdentifier) { 
                 viewDiaryEntry(entryIdentifier); 
            }
        }

    } catch (error) {
        console.error('Reply Submission Error!', error);
        showCustomMessage('Error submitting reply.\n' + error.message);
        if (buttonElement) { 
            buttonElement.textContent = originalButtonText;
            buttonElement.disabled = false;
        }
    }
}

// --- Dare Game Functions ---
function generateDare() {
    if (!currentUser) {
        showCustomMessage('Please log in to play the Dare Game!');
        logout();
        return;
    }
    if (!dareTextElement) {
        console.error("Dare text element not found!");
        return;
    }

    if (coupleDares.length === 0) {
        dareTextElement.textContent = "No dares available!";
        return;
    }

    let availableDares = coupleDares.filter(dare => !usedDares.includes(dare));

    if (availableDaires.length === 0) {
        // All dares have been used, reset
        usedDares = [];
        availableDares = [...coupleDares];
        showCustomMessage("You've gone through all the dares! Resetting for more fun. 😉");
    }

    const randomIndex = Math.floor(Math.random() * availableDares.length);
    const selectedDare = availableDares[randomIndex];
    
    usedDares.push(selectedDare);
    dareTextElement.textContent = selectedDare;
}

// --- Song Game Functions ---
function generateSong() {
    if (!currentUser) {
        showCustomMessage('Please log in to play the Song Game!');
        logout();
        return;
    }
    if (!songTextElement) {
        console.error("Song text element not found!");
        return;
    }

    if (songList.length === 0) {
        songTextElement.textContent = "No songs available!";
        return;
    }

    let availableSongs = songList.filter(song => !usedSongs.includes(song));

    if (availableSongs.length === 0) {
        // All songs have been used, reset
        usedSongs = [];
        availableSongs = [...songList];
        showCustomMessage("You've gone through all the songs! Resetting the list. 🎶");
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const selectedSong = availableSongs[randomIndex];
    
    usedSongs.push(selectedSong);
    songTextElement.textContent = selectedSong;
}


// --- Custom Message/Prompt Implementation (Replaces alert/prompt) ---
function showCustomMessage(message, onOkCallback) {
    // Check if a custom message popup already exists, remove it
    const existingPopup = document.getElementById('customMessagePopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    const existingOverlay = document.getElementById('customMessageOverlay');
     if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'customMessageOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 1999; display: flex;
        align-items: center; justify-content: center; backdrop-filter: blur(3px);
    `;

    const popup = document.createElement('div');
    popup.id = 'customMessagePopup';
    popup.style.cssText = `
        background: #fff; padding: 25px; border-radius: 15px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.25); text-align: center;
        max-width: 350px; width: 90%; z-index: 2000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #5c3b4c; line-height: 1.6;
    `;
    
    const messageP = document.createElement('p');
    messageP.textContent = message;
    messageP.style.margin = "0 0 20px 0";
    messageP.style.fontSize = "1.05em";

    const okButton = document.createElement('button');
    okButton.textContent = 'Okay';
    okButton.style.cssText = `
        background: linear-gradient(45deg, #d94a6b, #ff80a0); color: white;
        border: none; padding: 10px 20px; border-radius: 20px;
        cursor: pointer; font-size: 1em; font-weight: bold;
    `;

    okButton.onclick = () => {
        overlay.remove();
        if (onOkCallback && typeof onOkCallback === 'function') {
            onOkCallback();
        }
    };

    popup.appendChild(messageP);
    popup.appendChild(okButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

function showCustomPrompt(message, callback) {
    const existingPopup = document.getElementById('customPromptPopup');
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById('customPromptOverlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customPromptOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.65); z-index: 1999; display: flex;
        align-items: center; justify-content: center; backdrop-filter: blur(4px);
    `;

    const popup = document.createElement('div');
    popup.id = 'customPromptPopup';
    popup.style.cssText = `
        background: #fff; padding: 25px; border-radius: 15px;
        box-shadow: 0 6px 25px rgba(0,0,0,0.3); text-align: center;
        max-width: 400px; width: 90%; z-index: 2000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #5c3b4c;
    `;

    const messageP = document.createElement('p');
    messageP.textContent = message;
    messageP.style.cssText = "margin: 0 0 15px 0; font-size: 1em; line-height: 1.5; white-space: pre-wrap;";

    const inputField = document.createElement('textarea');
    inputField.rows = 3;
    inputField.style.cssText = `
        width: calc(100% - 20px); padding: 10px; border: 1px solid #ddd;
        border-radius: 8px; margin-bottom: 20px; font-size: 0.95em;
        box-sizing: border-box; resize: vertical;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-around';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.cssText = `
        background: linear-gradient(45deg, #4CAF50, #81C784); color: white;
        border: none; padding: 10px 20px; border-radius: 20px;
        cursor: pointer; font-size: 0.9em; font-weight: bold; flex-grow: 1; margin: 0 5px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        background: #f0f0f0; color: #666; border: 1px solid #ddd;
        padding: 10px 20px; border-radius: 20px; cursor: pointer;
        font-size: 0.9em; font-weight: bold; flex-grow: 1; margin: 0 5px;
    `;

    cancelButton.onclick = () => {
        overlay.remove();
        callback(null); // Indicate cancellation
    };
    
    popup.appendChild(messageP);
    popup.appendChild(inputField);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    inputField.focus();
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    checkLoginStatus(); 
    
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
