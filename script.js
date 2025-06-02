script.js
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

// Theme Toggle Elements
const themeSwitch = document.getElementById('themeSwitch');
const themeIcon = document.getElementById('themeIcon');
const THEME_KEY = 'hetuAppTheme';


// Global variables for application state
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};

// --- Dares List ---
const coupleDares = [
  "Do a slow striptease, removing one upper-body item every 5 seconds while making intense eye contact.",
  "Moan your partner’s name like you're being touched exactly how you want to be — three times in a row.",
  "Give a topless lap dance and whisper exactly what you want your partner to do next.",
  "Blindfold your partner, straddle them, and slowly drag your chest across theirs.",
  "Lick whipped cream off your partner’s nipples or collarbone — slow and teasing.",
  "Dance seductively while pretending you're in a high-end strip club performing for just them.",
  "Tell your partner your dirtiest fantasy — but only while caressing their chest slowly.",
  "Suck or gently bite on your partner’s neck while whispering what you’d do if there were no limits.",
  "Remove your top with your teeth only — and let them watch like they paid for a show.",
  "Kiss your partner all over their upper body, but stop an inch before the spot they want most.",
  "Pretend you're in a porno shoot — pose, moan, and say your lines like you're the star.",
  "Let your partner paint 'naughty words' on your chest with their finger or tongue.",
  "Hold ice in your mouth and run it along their neck and chest, then warm the spot with your lips.",
  "Pretend to be a naughty nurse or professor — make up a 'punishment' for your partner.",
  "Put on music and give a lap dance — every 10 seconds, whisper one naughty thing you're thinking.",
  "Lick chocolate syrup or honey off your own chest slowly while making eye contact with your partner.",
  "Give your partner 60 seconds to kiss every inch of your upper body — no hands allowed.",
  "Sit topless and order your partner to worship your chest with only their mouth.",
  "Do a sexy dance — and after every move, ask them, ‘Do you want more?’",
  "Let your partner pin your hands above your head while they kiss all over your upper body.",
  "Kiss your partner’s chest, whispering one dirty compliment between each kiss.",
  "Role-play: You're a forbidden lover sneaking in for one last kiss — make it intense and forbidden.",
  "Let your partner tie your hands and tease you with feathers or ice on your chest.",
  "Give a ‘body tour’ — describe each part of your chest while your partner touches it.",
  "Kiss your partner and then describe in detail how you'd undress them if there were no rules.",
  "Tell your partner where to touch you and how — exactly — but only above the waist.",
  "Ask your partner to spank your chest lightly with kisses for every naughty thing you whisper.",
  "Recreate a passionate scene where you’re caught making out — desperate, breathless, and hot.",
  "Have your partner draw a heart around your nipple with their tongue or finger.",
  "Look into their eyes and beg them to touch you — but don’t let them until you say a code word."];
let usedDares = [];


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
        loggedInUserDisplay.textContent = currentUser ? `Logged in: ${currentUser}` : 'User: Not logged in';
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
        window.scrollTo(0, 0); // Scroll to top on new screen
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
        if (usedDares.length === coupleDares.length) {
            usedDares = [];
        }
        if (dareTextElement) {
             dareTextElement.textContent = "Click the button below to get your first dare!";
        }
    }
}

// --- Hetu's Feelings Portal Functions ---
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0); 
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
    const originalBtnText = submitBtn.innerHTML; // Save full HTML content
    submitBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Submitting...';
    submitBtn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'error') throw new Error(data.message || 'Server error saving feeling.');
        navigateToFeelingsPage('feelingsPage3');
        if (messageInput) messageInput.value = '';
    })
    .catch(error => {
        showCustomMessage('Error submitting feelings entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) { showCustomMessage('Please log in to view entries.'); logout(); return; }
    const listContainer = document.getElementById('feelingsEntriesList');
    if (!listContainer) { navigateToFeelingsPage('feelingsPage1'); return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
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
                row.insertCell().textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
                row.insertCell().innerHTML = `<strong>${entry.submittedBy || 'Unknown'}</strong>`;
                const cellEmotion = row.insertCell();
                const emotionSpan = document.createElement('span');
                emotionSpan.classList.add('emotion-tag', entry.emotion ? entry.emotion.toLowerCase() : 'unknown');
                emotionSpan.textContent = entry.emotion || 'N/A';
                cellEmotion.appendChild(emotionSpan);
                row.insertCell().textContent = entry.message || 'No message';

                const cellResponse = row.insertCell();
                cellResponse.style.verticalAlign = 'top';
                if (entry.repliedBy && entry.replyMessage) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display', `${entry.repliedBy.toLowerCase()}-reply`);
                    replyContainer.innerHTML = `<p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>` +
                                               (entry.replyTimestamp ? `<p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>` : '');
                    cellResponse.appendChild(replyContainer);
                } else {
                    const replyButton = document.createElement('button');
                    replyButton.innerHTML = '<span class="material-icons">reply</span> Reply';
                    replyButton.classList.add('styled-button', 'reply-btn', 'small-reply-btn');
                    replyButton.onclick = function() {
                        replyButton.disabled = true;
                        const entryDateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : "this feeling";
                        showCustomPrompt(`Replying to ${entry.submittedBy || 'User'}'s feeling on ${entryDateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                            if (replyText !== null) {
                                submitReply('feeling', entry.timestamp, replyText, replyButton);
                            } else {
                                replyButton.disabled = false;
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
        if (listContainer) listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}


// --- Diary Functions ---
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    } else {
        console.error('Diary page not found:', pageId);
    }
}

async function fetchDiaryEntries() {
    if (!currentUser) { return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        diaryEntries = {}; return;
    }
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
            diaryEntries = {};
            if (data.data) {
                data.data.forEach(entry => {
                    if (!diaryEntries[entry.date]) {
                        diaryEntries[entry.date] = [];
                    }
                    diaryEntries[entry.date].push(entry); // Store as array for multiple entries per date
                });
            }
        } else {
            diaryEntries = {};
        }
    } catch (error) {
        diaryEntries = {};
    }
}


function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) return;

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
        
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = day;
        dayCell.appendChild(dayNumberSpan);

        const formattedCellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = formattedCellDate;

        if (year === todayYear && month === todayMonth && day === todayDate) {
            dayCell.classList.add('today');
        }

        if (diaryEntries[formattedCellDate] && diaryEntries[formattedCellDate].length > 0) {
            dayCell.classList.add('has-entry');
            const dotsContainer = document.createElement('div');
            dotsContainer.classList.add('entry-dots-container');
            
            // Create a Set to only add one dot per user for that day
            const usersOnThisDay = new Set();
            diaryEntries[formattedCellDate].forEach(entry => {
                usersOnThisDay.add(entry.submittedBy.toLowerCase());
            });

            usersOnThisDay.forEach(user => {
                const dot = document.createElement('span');
                dot.classList.add('entry-dot', user); // e.g., 'chikoo' or 'prath'
                dotsContainer.appendChild(dot);
            });
            dayCell.appendChild(dotsContainer);
            dayCell.title = `${usersOnThisDay.size} entr${usersOnThisDay.size > 1 ? 'ies' : 'y'}. Click to view/add.`;
        }


        dayCell.addEventListener('click', () => {
            if (diaryEntries[dayCell.dataset.date] && diaryEntries[dayCell.dataset.date].length > 0) {
                viewDiaryEntry(dayCell.dataset.date); // Prioritize viewing if entries exist
            } else {
                openDiaryEntry(dayCell.dataset.date);
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}


function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { showCustomMessage('Invalid date format: ' + dateString); return; }
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    if (isNaN(dateObj.getTime())) { showCustomMessage('Invalid date: ' + dateString); return; }
    
    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('diaryEntryTitle').textContent = `New Diary Entry for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    document.getElementById('diaryThoughts').placeholder = `${currentUser}, write your diary entry here...`;
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entriesForDate = diaryEntries[dateString];
    // For simplicity in this view, we'll show the first entry or allow new.
    // A more complex UI might list multiple entries or show a combined view.
    // For now, if an entry by current user exists, show it. Otherwise, prompt to add new or show other's.
    // Let's keep current behavior: show first entry, with attribution and reply.
    const entry = entriesForDate ? entriesForDate[0] : null; // Default to first entry for simplicity for now
                                                            // The 'all entries' list handles multiple entries better.
                                                            // Or better: find entry by currentUser first.
    let userEntry = null;
    if (entriesForDate) {
        userEntry = entriesForDate.find(e => e.submittedBy === currentUser);
    }
    const displayEntry = userEntry || entry; // Prioritize current user's entry for direct view

    if (!displayEntry) {
        openDiaryEntry(dateString); // If no entry, open new entry page
        return;
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { showCustomMessage('Invalid date format: ' + dateString); return; }
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    if (isNaN(dateObj.getTime())) { showCustomMessage('Invalid date: ' + dateString); return; }

    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('viewDiaryThoughts').textContent = displayEntry.thoughts || 'No thoughts.';

    const attributionElement = document.getElementById('diaryEntryAttribution');
    if (attributionElement) {
        attributionElement.innerHTML = `<em>Entry by ${displayEntry.submittedBy || 'Unknown User'}</em>`;
        attributionElement.className = 'entry-attribution';
        if (displayEntry.submittedBy) {
            attributionElement.classList.add(`${displayEntry.submittedBy.toLowerCase()}-entry`);
        }
    }

    const singleViewReplyContainer = document.getElementById('diaryViewPageReplySection');
    if (singleViewReplyContainer) {
        singleViewReplyContainer.innerHTML = '';
        if (displayEntry.repliedBy && displayEntry.replyMessage) {
            const replyDisplay = document.createElement('div');
            replyDisplay.classList.add('reply-display', `${displayEntry.repliedBy.toLowerCase()}-reply`);
            replyDisplay.innerHTML = `<p><strong>${displayEntry.repliedBy} Replied:</strong> ${displayEntry.replyMessage}</p>` +
                                     (displayEntry.replyTimestamp ? `<p class="reply-timestamp">Replied: ${new Date(displayEntry.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})}</p>` : '');
            singleViewReplyContainer.appendChild(replyDisplay);
        } else if (displayEntry.submittedBy !== currentUser) { // Only allow reply if not own entry
            const replyButton = document.createElement('button');
            replyButton.innerHTML = '<span class="material-icons">reply</span> Reply';
            replyButton.classList.add('styled-button', 'reply-btn');
            replyButton.onclick = function() {
                replyButton.disabled = true;
                const currentDisplayDate = document.getElementById('viewDiaryDateDisplay').textContent || displayEntry.date;
                showCustomPrompt(`Replying to ${displayEntry.submittedBy || 'User'}'s diary entry for ${currentDisplayDate}:\n"${(displayEntry.thoughts || '').substring(0, 100)}${(displayEntry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                     if (replyText !== null) {
                        // Pass unique identifier: date + original submitter for diary replies
                        submitReply('diary', `${dateString}_${displayEntry.submittedBy}`, replyText, replyButton); 
                    } else {
                         replyButton.disabled = false;
                    }
                });
            };
            singleViewReplyContainer.appendChild(replyButton);
        }
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

    const submitBtn = document.querySelector('#diaryEntryPage .styled-button.primary');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Saving...';
    submitBtn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'error') throw new Error(data.message || 'Server error saving diary.');
        return fetchDiaryEntries().then(() => {
             renderCalendar(calendarCurrentDate);
             navigateToDiaryPage('diaryConfirmationPage');
        });
    })
    .catch(error => {
        showCustomMessage('Error saving diary entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) { showCustomMessage('Please log in to view entries.'); logout(); return; }
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) { return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        listContainer.innerHTML = '<p>Error: scriptURL not configured.</p>'; return;
    }

    try {
        // We already have diaryEntries from fetchDiaryEntries, just need to display them all
        // If not, fetch them (though navigateToApp should have done this for diary screen)
        if (Object.keys(diaryEntries).length === 0) {
            await fetchDiaryEntries();
        }

        listContainer.innerHTML = '';
        const allEntries = [];
        for (const date in diaryEntries) {
            diaryEntries[date].forEach(entry => allEntries.push(entry));
        }

        if (allEntries.length > 0) {
            const sortedEntries = allEntries.sort((a, b) => {
                const dateA = new Date(a.date + "T00:00:00"); // Ensure date part is parsed correctly
                const dateB = new Date(b.date + "T00:00:00");
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                // If dates are same, sort by creation timestamp if available
                const tsA = a.createdTimestamp ? new Date(a.createdTimestamp) : 0;
                const tsB = b.createdTimestamp ? new Date(b.createdTimestamp) : 0;
                return tsB - tsA;
            });

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
                entryMetaDiv.innerHTML = `<strong>${entry.submittedBy || 'Unknown User'}</strong> wrote:`;

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
                    replyContainer.innerHTML = `<p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>` +
                                               (entry.replyTimestamp ? `<p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>` : '');
                    replySectionDiv.appendChild(replyContainer);
                } else if (entry.submittedBy !== currentUser) { // Can only reply to other's entries
                    const replyButton = document.createElement('button');
                    replyButton.innerHTML = '<span class="material-icons">reply</span> Reply';
                    replyButton.classList.add('styled-button', 'reply-btn', 'small-reply-btn');
                    replyButton.onclick = function(event) {
                        event.stopPropagation();
                        replyButton.disabled = true;
                        showCustomPrompt(`Replying to ${entry.submittedBy || 'User'}'s diary entry for ${formattedDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`, (replyText) => {
                            if (replyText !== null) {
                                // For diary, identifier should be unique: date + original_submitter
                                submitReply('diary', `${entry.date}_${entry.submittedBy}`, replyText, replyButton);
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
        } else {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        if (listContainer) listContainer.innerHTML = `<p>Error loading all diary entries: ${error.message}</p>`;
    }
}


// --- Submit Reply Function ---
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!currentUser) { showCustomMessage('Please log in to reply.'); logout(); return; }
    if (!replyMessage || replyMessage.trim() === "") {
        showCustomMessage("Reply cannot be empty.");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.innerHTML = '<span class="material-icons">reply</span> Reply'; }
        return;
    }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('Please update the scriptURL in script.js.');
        if (buttonElement) { buttonElement.disabled = false; buttonElement.innerHTML = '<span class="material-icons">reply</span> Reply'; }
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier); // For diary, this is now "date_originalSubmitter"
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser);

    const originalButtonHTML = buttonElement ? buttonElement.innerHTML : '<span class="material-icons">reply</span> Reply';
    if (buttonElement) {
        buttonElement.innerHTML = '<span class="material-icons">hourglass_top</span> Replying...';
        buttonElement.disabled = true;
    }

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${text}`);
        }
        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message || `Error saving reply from server.`);

        showCustomMessage(`Reply by ${currentUser} submitted successfully!`);

        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries();
        } else if (entryType === 'diary') {
            await fetchDiaryEntries(); // Refetch all diary entries
            renderCalendar(calendarCurrentDate); // Re-render calendar with new data

            // If currently on a page displaying this entry, refresh it
            const allEntriesPageActive = document.getElementById('allDiaryEntriesPage').classList.contains('active');
            const diaryViewPageActive = document.getElementById('diaryViewPage').classList.contains('active');
            
            if (allEntriesPageActive) {
                fetchAndDisplayAllDiaryEntries(); // This will re-render the list
            }
            
            // For single view, check if the replied entry is being viewed
            // entryIdentifier for diary is "date_originalSubmitter"
            const [dateOfEntry, originalSubmitter] = entryIdentifier.split('_');
            const viewedDate = document.getElementById('selectedDate')?.value || document.querySelector('#diaryViewPage .date-display #viewDiaryDateDisplay')?.textContent;
            //This check needs to be more robust if viewDiaryEntry is showing a specific entry
            if (diaryViewPageActive && viewedDate && dateOfEntry) {
                 const currentDateObj = new Date(dateOfEntry + "T00:00:00");
                 const currentDisplayDateStr = currentDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                if(document.getElementById('viewDiaryDateDisplay').textContent === currentDisplayDateStr){
                     // find the specific entry in diaryEntries[dateOfEntry] that matches originalSubmitter
                     const targetEntry = diaryEntries[dateOfEntry]?.find(e => e.submittedBy === originalSubmitter);
                     if(targetEntry) {
                        // Manually update the specific entry in memory before re-rendering view
                        targetEntry.repliedBy = currentUser;
                        targetEntry.replyMessage = replyMessage.trim();
                        targetEntry.replyTimestamp = new Date().toISOString();
                        viewDiaryEntry(dateOfEntry); // Re-render the view for this date
                     } else { // Fallback if direct update is tricky
                        navigateToApp('diaryScreen'); // Go back to calendar which will be fresh
                     }
                }
            }
        }

    } catch (error) {
        showCustomMessage('Error submitting reply.\n' + error.message);
    } finally {
         if (buttonElement) {
            buttonElement.innerHTML = originalButtonHTML;
            buttonElement.disabled = false;
        }
    }
}

// --- Dare Game Functions ---
function generateDare() {
    if (!currentUser) { showCustomMessage('Please log in to play the Dare Game!'); logout(); return; }
    if (!dareTextElement) { return; }
    if (coupleDares.length === 0) { dareTextElement.textContent = "No dares available!"; return; }

    let availableDares = coupleDares.filter(dare => !usedDares.includes(dare));
    if (availableDares.length === 0) {
        usedDares = [];
        availableDares = [...coupleDares];
        showCustomMessage("You've gone through all the dares! Resetting for more fun. 😉");
    }
    const randomIndex = Math.floor(Math.random() * availableDares.length);
    const selectedDare = availableDares[randomIndex];
    usedDares.push(selectedDare);
    dareTextElement.textContent = selectedDare;
}


// --- Custom Message/Prompt Implementation ---
function showCustomMessage(message, onOkCallback) {
    const existingPopup = document.getElementById('customMessagePopup');
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById('customMessageOverlay');
     if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customMessageOverlay'; // Use same ID for CSS targeting
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: var(--overlay-bg); z-index: 1999; display: flex;
        align-items: center; justify-content: center; backdrop-filter: var(--overlay-backdrop-filter);
    `;

    const popup = document.createElement('div');
    popup.id = 'customMessagePopup'; // Use same ID for CSS targeting
    popup.style.cssText = `
        background: var(--popup-bg); padding: 25px; border-radius: 16px;
        box-shadow: var(--popup-shadow); text-align: center;
        max-width: 360px; width: 90%; z-index: 2000;
        font-family: 'Roboto', 'Segoe UI', sans-serif;
        color: var(--text-color); line-height: 1.6; border: 1px solid var(--popup-border);
    `;
    
    const messageP = document.createElement('p');
    messageP.textContent = message;
    messageP.style.margin = "0 0 20px 0";
    messageP.style.fontSize = "1.05em";

    const okButton = document.createElement('button');
    okButton.textContent = 'Okay';
    okButton.classList.add('styled-button', 'primary'); // Use new button style

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
        background: var(--overlay-bg); z-index: 1999; display: flex;
        align-items: center; justify-content: center; backdrop-filter: var(--overlay-backdrop-filter);
    `;

    const popup = document.createElement('div');
    popup.id = 'customPromptPopup';
    popup.style.cssText = `
        background: var(--popup-bg); padding: 25px; border-radius: 16px;
        box-shadow: var(--popup-shadow); text-align: center;
        max-width: 400px; width: 90%; z-index: 2000;
        font-family: 'Roboto', 'Segoe UI', sans-serif;
        color: var(--text-color); border: 1px solid var(--popup-border);
    `;

    const messageP = document.createElement('p');
    messageP.textContent = message;
    messageP.style.cssText = "margin: 0 0 15px 0; font-size: 1em; line-height: 1.5; white-space: pre-wrap;";

    const inputField = document.createElement('textarea');
    inputField.rows = 3;
    inputField.style.cssText = `
        width: calc(100% - 20px); padding: 12px; border: 1px solid var(--input-border);
        border-radius: 8px; margin-bottom: 20px; font-size: 0.95em;
        box-sizing: border-box; resize: vertical; background-color: var(--surface-color); color: var(--text-color);
    `;
    inputField.onfocus = () => {
        inputField.style.borderColor = 'var(--input-focus-border)';
        inputField.style.boxShadow = '0 0 0 2px var(--input-focus-shadow)';
    };
    inputField.onblur = () => {
        inputField.style.borderColor = 'var(--input-border)';
        inputField.style.boxShadow = 'none';
    };


    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end'; // Align buttons to right
    buttonContainer.style.gap = '10px';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.classList.add('styled-button', 'primary');

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('styled-button', 'secondary');

    submitButton.onclick = () => {
        overlay.remove();
        callback(inputField.value);
    };
    cancelButton.onclick = () => {
        overlay.remove();
        callback(null);
    };
    
    popup.appendChild(messageP);
    popup.appendChild(inputField);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    inputField.focus();
}

// --- Theme Management ---
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeSwitch) themeSwitch.checked = true;
        if (themeIcon) themeIcon.textContent = '🌙';
    } else { // Light theme
        document.body.classList.remove('dark-theme');
        if (themeSwitch) themeSwitch.checked = false;
        if (themeIcon) themeIcon.textContent = '☀️';
    }
}

function toggleTheme() {
    if (themeSwitch.checked) {
        localStorage.setItem(THEME_KEY, 'dark');
        applyTheme('dark');
    } else {
        localStorage.setItem(THEME_KEY, 'light');
        applyTheme('light');
    }
}

function loadTheme() {
    const preferredTheme = localStorage.getItem(THEME_KEY);
    if (preferredTheme) {
        applyTheme(preferredTheme);
    } else {
        // Default to light theme if no preference or system preference check
        applyTheme('light');
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        showCustomMessage('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    loadTheme(); // Load theme first
    checkLoginStatus(); 
    
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (!currentUser) return;
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            renderCalendar(calendarCurrentDate); // Fetch is not strictly needed if entries are global & pre-fetched
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (!currentUser) return;
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            renderCalendar(calendarCurrentDate);
        });
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }

     if (typeof navigateToApp === 'undefined') {
         showCustomMessage('Error: Critical script functions not loaded.');
     }
});
