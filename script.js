// --- FULLY UPDATED script.js with User Login, Attribution & Reply Functionality ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/'; // <<< REPLACE WITH YOUR URL

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');

const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Global variables for application state
let currentUser = ''; // Stores 'Chikoo' or 'Prath'
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {}; // Stores { 'YYYY-MM-DD': entryObject }

// --- User Authentication and Session ---
function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.alignItems = 'flex-start'; // Align app container to top
        navigateToApp('homeScreen');
        console.log(`${currentUser} logged in.`);
    } else {
        alert('Invalid user selection.');
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay(); // Clear display
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
    document.body.style.alignItems = 'center'; // Re-center login screen
    // Ensure all app screens are hidden, login is visible
    screens.forEach(screen => screen.classList.remove('active'));
    console.log('User logged out.');
    // Optionally, navigate to a specific part of login screen if it had pages.
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
        navigateToApp('homeScreen'); // Or last visited screen if implemented
    } else {
        appContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        document.body.style.alignItems = 'center';
    }
}


// --- Main Navigation and Core Functions ---
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') { // loginScreen doesn't exist as a .screen element
        console.warn('No user logged in. Redirecting to login.');
        logout(); // This will show the login screen
        return;
    }
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error("Screen not found:", screenId);
        if (currentUser) navigateToApp('homeScreen'); // Fallback for logged-in user
        else logout(); // Fallback for logged-out user
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
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();

    if (!currentEmotion) { alert('Please select an emotion first!'); return; }
    if (!message) { alert('Please enter your thoughts.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser); // User attribution

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
        alert('Error submitting feelings entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) { alert('Please log in to view entries.'); logout(); return; }
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
            // Headers: Date, Submitted By, Emotion, Message, Response
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
                        const promptMessage = `Replying to ${entry.submittedBy || 'User'}'s feeling on ${entryDateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`;
                        const replyText = prompt(promptMessage);
                        if (replyText !== null) {
                            submitReply('feeling', entry.timestamp, replyText, replyButton);
                        } else {
                            replyButton.disabled = false;
                        }
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
             // Add user-specific class to calendar day if entry exists
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
    if (dateParts.length !== 3) { alert('Invalid date format for opening diary: ' + dateString); return; }
    const yearNum = parseInt(dateParts[0], 10);
    const monthNum = parseInt(dateParts[1], 10) - 1;
    const dayNum = parseInt(dateParts[2], 10);
    const dateObj = new Date(yearNum, monthNum, dayNum);

    if (isNaN(dateObj.getTime())) { alert('Could not create valid date from: ' + dateString); return; }
    
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
        alert('Could not load details for ' + dateString + '. Entry not found. Try going back.');
        openDiaryEntry(dateString); 
        return;
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { alert('Invalid date format for view: ' + dateString); return; }
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    if (isNaN(dateObj.getTime())) { alert('Invalid date object for view: ' + dateString); return; }

    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';

    // Display who made the entry
    const attributionElement = document.getElementById('diaryEntryAttribution');
    if (attributionElement) {
        attributionElement.innerHTML = `<em>${entry.submittedBy || 'Unknown User'} Made a New entry</em>`;
        attributionElement.className = 'entry-attribution'; // Reset classes
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
                const promptMessage = `Replying to ${entry.submittedBy || 'User'}'s diary entry for ${currentDisplayDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`;
                const replyText = prompt(promptMessage);
                if (replyText !== null) {
                    submitReply('diary', dateString, replyText, replyButton);
                } else {
                     replyButton.disabled = false;
                }
            };
            singleViewReplyContainer.appendChild(replyButton);
        }
    } else {
        console.error("Reply container 'diaryViewPageReplySection' not found.");
    }
    navigateToDiaryPage('diaryViewPage');
}


function submitDiaryEntry() {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;

    if (!date) { alert('No date selected.'); return; }
    if (!thoughts) { alert('Please write your thoughts.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser); // User attribution

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
        alert('Error saving diary entry: ' + error.message);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) { alert('Please log in to view entries.'); logout(); return; }
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
                        const promptMessage = `Replying to ${entry.submittedBy || 'User'}'s diary entry for ${formattedDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`;
                        const replyText = prompt(promptMessage);
                        if (replyText !== null) {
                            submitReply('diary', entry.date, replyText, replyButton);
                        } else {
                            replyButton.disabled = false;
                        }
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
    if (!currentUser) { alert('Please log in to reply.'); logout(); return; }
    if (!replyMessage || replyMessage.trim() === "") {
        alert("Reply cannot be empty.");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌'; }
        return;
    }

    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.');
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌'; }
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser); // User attribution for reply

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

        alert(`Reply by ${currentUser} submitted successfully! Notification sent.`);
        
        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries(); 
        } else if (entryType === 'diary') {
            await fetchDiaryEntries(); 
            renderCalendar(calendarCurrentDate); 
            
            if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                fetchAndDisplayAllDiaryEntries();
            }
            const diaryViewPageActive = document.getElementById('diaryViewPage').classList.contains('active');
            // Check if current view page matches the entryIdentifier for diary entries
            const currentViewingDate = diaryEntries[entryIdentifier] ? entryIdentifier : null; 
            if (diaryViewPageActive && currentViewingDate === entryIdentifier) { 
                 viewDiaryEntry(entryIdentifier); 
            }
        }

    } catch (error) {
        console.error('Reply Submission Error!', error);
        alert('Error submitting reply.\n' + error.message);
        if (buttonElement) { 
            buttonElement.textContent = originalButtonText;
            buttonElement.disabled = false;
        }
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
        // No alert here, login screen will be shown by default.
    }
    
    checkLoginStatus(); // Check login status and navigate accordingly
    
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; // Prevent action if not logged in
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; // Prevent action if not logged in
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
     console.log('DOM loaded. External script functions should be available.');
     if (typeof navigateToApp === 'undefined') {
         console.error('❌ script.js core functions not defined globally! This can happen if script is deferred or has loading issues.');
         alert('Error: Critical script functions not loaded.');
     } else {
         console.log('✅ script.js core functions seem to be defined.');
     }
});
