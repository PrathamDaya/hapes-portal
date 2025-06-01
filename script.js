// --- FULLY UPDATED script.js with User Login, Attribution & Reply Functionality ---
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
    } else if (screenId === 'coupleDareScreen') {
        showRandomDare(); // Show a dare when entering the screen
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

async function submitReply(type, entryTimestamp, replyMessage, buttonElement) {
    if (!currentUser) { alert('Please log in to reply.'); logout(); return; }
    if (!replyMessage || replyMessage.trim() === '') { alert('Reply cannot be empty.'); buttonElement.disabled = false; return; }

    const formData = new FormData();
    formData.append('formType', 'reply');
    formData.append('entryType', type);
    formData.append('entryTimestamp', entryTimestamp);
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser);

    const originalButtonText = buttonElement.textContent;
    buttonElement.textContent = 'Sending...';
    buttonElement.disabled = true;

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Reply Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving reply.');
        
        alert('Reply submitted successfully!');
        // Re-fetch and display entries to show the new reply
        if (type === 'feeling') {
            fetchAndDisplayFeelingsEntries();
        } else if (type === 'diary') {
            // Re-render diary view if necessary
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        }

    } catch (error) {
        console.error('Reply Error!', error);
        alert('Error submitting reply: ' + error.message);
    } finally {
        buttonElement.textContent = originalButtonText;
        buttonElement.disabled = false;
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
        diaryEntries = {};
        return;
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
        console.error("Calendar elements not found.");
        return;
    }
    calendarGrid.innerHTML = '';

    const month = date.getMonth();
    const year = date.getFullYear();
    monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeaderEl = document.createElement('div');
        dayHeaderEl.classList.add('calendar-day-header');
        dayHeaderEl.textContent = day;
        calendarGrid.appendChild(dayHeaderEl);
    });

    // Fill in leading empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }

    // Fill in days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day');
        dayEl.textContent = day;
        dayEl.dataset.date = dateString;

        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add('today');
        }

        if (diaryEntries[dateString]) {
            dayEl.classList.add('has-entry');
            const indicator = document.createElement('span');
            indicator.classList.add('entry-indicator');
            indicator.textContent = '📝'; // Or a small dot/icon
            dayEl.appendChild(indicator);
            dayEl.onclick = () => viewDiaryEntry(dateString);
        } else {
            dayEl.onclick = () => createDiaryEntry(dateString);
        }
        calendarGrid.appendChild(dayEl);
    }
}

function createDiaryEntry(dateString) {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    document.getElementById('diaryEntryDate').textContent = new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const textarea = document.getElementById('diaryEntryText');
    textarea.value = diaryEntries[dateString] ? diaryEntries[dateString].message : '';
    document.getElementById('saveDiaryEntryBtn').onclick = () => saveDiaryEntry(dateString);
    navigateToDiaryPage('diaryEntryPage');
}

async function saveDiaryEntry(dateString) {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    const entryText = document.getElementById('diaryEntryText').value.trim();
    if (!entryText) { alert('Diary entry cannot be empty!'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', dateString);
    formData.append('message', entryText);
    formData.append('submittedBy', currentUser);

    const saveBtn = document.getElementById('saveDiaryEntryBtn');
    const originalBtnText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Diary Entry Save Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving diary entry.');
        
        diaryEntries[dateString] = { date: dateString, message: entryText, submittedBy: currentUser }; // Update local cache
        alert('Diary entry saved!');
        navigateToDiaryPage('diaryCalendarPage'); // Go back to calendar view
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate)); // Re-render calendar
    } catch (error) {
        console.error('Diary Entry Save Error!', error);
        alert('Error saving diary entry: ' + error.message);
    } finally {
        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;
    }
}

function viewDiaryEntry(dateString) {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    const entry = diaryEntries[dateString];
    if (entry) {
        document.getElementById('viewedDiaryEntryDate').textContent = new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('viewedDiaryEntryText').textContent = entry.message;
        document.getElementById('editDiaryEntryBtn').onclick = () => createDiaryEntry(dateString); // Re-use create for edit
        document.getElementById('deleteDiaryEntryBtn').onclick = () => deleteDiaryEntry(dateString);
        navigateToDiaryPage('diaryViewEntryPage');
    } else {
        alert('No entry found for this date.');
        navigateToDiaryPage('diaryCalendarPage');
    }
}

function editDiaryEntry() {
    const dateString = document.getElementById('viewedDiaryEntryDate').textContent; // This needs to be converted back to YYYY-MM-DD
    // A more robust way would be to pass the dateString directly to the edit function,
    // or store it in a global variable when viewing an entry.
    const dateToEdit = new Date(dateString).toISOString().slice(0, 10);
    createDiaryEntry(dateToEdit); // Use createDiaryEntry function to pre-fill and allow editing
}

async function deleteDiaryEntry(dateString) {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    if (!confirm('Are you sure you want to delete this diary entry?')) return;
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'deleteDiaryEntry');
    formData.append('date', dateString);
    formData.append('submittedBy', currentUser); // For logging/verification if needed

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Diary Entry Delete Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error deleting diary entry.');
        
        delete diaryEntries[dateString]; // Remove from local cache
        alert('Diary entry deleted successfully!');
        navigateToDiaryPage('diaryCalendarPage'); // Go back to calendar view
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate)); // Re-render calendar
    } catch (error) {
        console.error('Diary Entry Delete Error!', error);
        alert('Error deleting diary entry: ' + error.message);
    }
}

async function fetchAndDisplayDiaryEntries() {
    if (!currentUser) { alert('Please log in to view entries.'); logout(); return; }
    console.log('Fetching all diary entries...');
    const listContainer = document.getElementById('diaryEntriesList');
    if (!listContainer) {
        console.error('"diaryEntriesList" not found.');
        navigateToDiaryPage('diaryCalendarPage'); return;
    }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received diary data:', serverData);
        listContainer.innerHTML = '';

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            // Sort entries by date, newest first
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));

            const table = document.createElement('table');
            table.classList.add('diary-table');
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            const headers = ['Date', 'Entry By', 'Message', 'Reply'];
            headers.forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            sortedEntries.forEach(entry => {
                const row = tbody.insertRow();
                
                const cellDate = row.insertCell();
                cellDate.textContent = entry.date ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

                const cellSubmittedBy = row.insertCell();
                cellSubmittedBy.innerHTML = `<strong>${entry.submittedBy || 'Unknown'}</strong>`;

                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'No message';
                cellMessage.classList.add('diary-entry-text-cell'); // Add class for potential styling

                const cellReply = row.insertCell();
                cellReply.style.verticalAlign = 'top';

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
                    cellReply.appendChild(replyContainer);
                } else {
                    const replyButton = document.createElement('button');
                    replyButton.textContent = 'Reply 💌';
                    replyButton.classList.add('reply-btn', 'small-reply-btn');
                    replyButton.onclick = function() {
                        replyButton.disabled = true;
                        const entryDateStr = entry.date ? new Date(entry.date).toLocaleDateString() : "this diary entry";
                         const promptMessage = `Replying to ${entry.submittedBy || 'User'}'s diary entry on ${entryDateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\n${currentUser}, your reply:`;
                        const replyText = prompt(promptMessage);
                        if (replyText !== null) {
                            submitReply('diary', entry.date, replyText, replyButton);
                        } else {
                            replyButton.disabled = false;
                        }
                    };
                    cellReply.appendChild(replyButton);
                }
            });
            listContainer.appendChild(table);
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown server response'}</p>`;
        }
        navigateToDiaryPage('diaryEntriesListPage');
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
        if (listContainer) listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}


// --- Miss You Pop-up (moved to inline script in index.html for simplicity) ---

// --- Couple Dare Game ---
const coupleDares = [
    "Give your partner a sensual full-body massage using their favorite lotion or oil.",
    "Whisper your deepest fantasy to your partner and plan how to make it a reality tonight.",
    "Blindfold your partner and feed them various treats, guessing each one by taste.",
    "Take a shower or bath together and wash each other's bodies slowly and sensually.",
    "Write a short, erotic story about your partner and read it aloud to them.",
    "Engage in a prolonged, passionate kissing session, exploring every part of their mouth.",
    "Give your partner a striptease, removing one item of clothing with each song.",
    "Play a game of 'truth or dare' focusing purely on intimate and suggestive questions/dares.",
    "Explore each other's bodies with your hands, focusing solely on touch and sensation, without words.",
    "Recreate a memorable intimate moment from your past, adding a new, spicier element.",
    "Give your partner a slow, tantalizing lap dance.",
    "Exchange sensual massages, focusing on areas you typically overlook.",
    "Spend 10 minutes kissing each other without using your hands.",
    "Describe in detail what you find most attractive about your partner's body and mind.",
    "Play a game where one person is blindfolded and has to guess where their partner is touching them.",
    "Have a 'no-hands' kissing challenge for as long as you can.",
    "Write a love letter to your partner, but make it entirely about your physical desires for them.",
    "Give each other a sensual foot massage.",
    "Dress up in an outfit your partner finds irresistible and surprise them.",
    "Create a 'sexy scavenger hunt' where clues lead to intimate rewards.",
    "Take turns giving each other a sensual ice cube challenge.",
    "Watch an erotic movie together and act out a scene you both enjoy.",
    "Give your partner a 'body shot' from their favorite part of your body.",
    "Have a 'make-out' session in a new, unexpected room in your house.",
    "Share your favorite intimate memory of each other.",
    "Give your partner a sensual back scratch leading to other areas.",
    "Whisper dirty talk into your partner's ear for five minutes straight.",
    "Explore each other's bodies with only your lips.",
    "Play a board game and for every move, take off an item of clothing.",
    "Surprise your partner with an unexpected intimate gesture when they least expect it."
];

function showRandomDare() {
    if (!currentUser) { alert('Please log in first to play Couple Dares.'); logout(); return; }
    const dareDisplay = document.getElementById('coupleDareText');
    if (dareDisplay) {
        const randomIndex = Math.floor(Math.random() * coupleDares.length);
        dareDisplay.textContent = coupleDares[randomIndex];
    } else {
        console.error("Dare display element not found.");
    }
}


// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if scriptURL is updated, otherwise show a warning
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
