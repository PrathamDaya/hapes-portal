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

// --- Dare Game Variables ---
// IMPORTANT: Replace these placeholders with your actual dares.
// I cannot generate explicit content due to safety guidelines.
const dares = [
    "Dare 1: [Placeholder for a sexy dare, no full nudity, upper body nudity allowed]",
    "Dare 2: [Placeholder for another sexy dare, no full nudity, upper body nudity allowed]",
    "Dare 3: [Placeholder for another sexy dare, no full nudity, upper body nudity allowed]",
    // ... add 47 more similarly suggestive but safe dares here ...
    "Dare 50: [Placeholder for the final sexy dare, no full nudity, upper body nudity allowed]"
];
let currentDareIndex = -1; // -1 means no dare displayed yet
let availableDareIndices = []; // To ensure dares are not repeated until all are shown

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
    // No specific action needed for dareGameScreen here, as its navigation handles content.
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
                cellResponse.style.verticalAlign = 'top'; // Align response to top if multiline
                if (entry.repliedBy && entry.replyMessage) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display', `${entry.repliedBy.toLowerCase()}-reply`);
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestamp) {
                        const replyTimeP = document.createElement('p');
                        replyTimeP.classList.add('reply-timestamp');
                        replyTimeP.textContent = `Replied: ${new Date(entry.replyTimestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                        replyContainer.appendChild(replyTimeP);
                    }
                    cellResponse.appendChild(replyContainer);
                } else {
                    cellResponse.textContent = 'No response yet.';
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Add Reply';
                    replyBtn.classList.add('secondary-btn', 'add-reply-btn');
                    replyBtn.style.fontSize = '0.7em';
                    replyBtn.style.padding = '5px 10px';
                    replyBtn.style.marginTop = '5px';
                    replyBtn.onclick = () => showFeelingsReplyInput(entry.id); // Assuming 'id' is unique for feeling entry
                    if (currentUser === entry.submittedBy) { // Disable reply for own entries
                        replyBtn.disabled = true;
                        replyBtn.textContent = 'Your Entry';
                    }
                    cellResponse.appendChild(replyBtn);
                }
            });
            listContainer.appendChild(table);
        } else {
            listContainer.innerHTML = '<p>No feelings entries found yet.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        listContainer.innerHTML = '<p>Error loading entries. Please try again later.</p>';
        alert('Error fetching feelings entries: ' + error.message);
    }
}

// Function to show reply input for a specific feelings entry
let currentFeelingEntryIdToReply = null; // Global to store which entry we're replying to

function showFeelingsReplyInput(entryId) {
    if (!currentUser) { alert('Please log in to reply.'); logout(); return; }

    const replyInput = document.createElement('textarea');
    replyInput.placeholder = `Reply to this entry as ${currentUser}...`;
    replyInput.id = `replyInput-${entryId}`;
    replyInput.style.width = '100%';
    replyInput.style.minHeight = '60px';
    replyInput.style.marginBottom = '10px';
    replyInput.style.marginTop = '10px';

    const submitReplyBtn = document.createElement('button');
    submitReplyBtn.textContent = 'Submit Reply';
    submitReplyBtn.onclick = () => submitFeelingsReply(entryId, replyInput.value);
    submitReplyBtn.classList.add('submit-reply-btn');
    submitReplyBtn.style.fontSize = '0.8em';
    submitReplyBtn.style.padding = '8px 15px';


    // Find the cell where the reply button was clicked
    const table = document.querySelector('.feelings-table');
    const row = table.querySelector(`tr:has(button[onclick*="showFeelingsReplyInput('${entryId}')"])`); // Find row by button's onclick
    if (row) {
        const replyCell = row.cells[4]; // Assuming reply cell is the 5th column
        replyCell.innerHTML = ''; // Clear existing content (button/no reply)
        replyCell.appendChild(replyInput);
        replyCell.appendChild(submitReplyBtn);
        replyInput.focus();
    }
}


async function submitFeelingsReply(entryId, replyMessage) {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    if (!replyMessage.trim()) { alert('Please enter your reply.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', 'feelings'); // Specify type of entry
    formData.append('entryIdentifier', entryId); // ID of the feelings entry
    formData.append('replyMessage', replyMessage);
    formData.append('repliedBy', currentUser);

    const submitBtn = document.querySelector(`#replyInput-${entryId} + .submit-reply-btn`);
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit Reply';
    if (submitBtn) {
        submitBtn.textContent = 'Replying...';
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Reply Submission Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving reply.');
        
        // Refresh the entries to show the new reply
        fetchAndDisplayFeelingsEntries(); 
    } catch (error) {
        console.error('Feelings Reply Error!', error);
        alert('Error submitting reply: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
}


// --- Our Diary Functions ---
let selectedDate = null; // Global variable to store the currently selected date for diary entry

function navigateToDiaryPage(pageId, isNewEntry = false) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Diary page not found:', pageId);
        return;
    }

    if (pageId === 'diaryEntryPage') {
        const diaryMessageTextarea = document.getElementById('diaryMessage');
        const submitDiaryButton = document.getElementById('submitDiaryBtn');
        const currentEntryContentDiv = document.getElementById('currentDiaryEntryContent');
        const diaryReplyMessageTextarea = document.getElementById('diaryReplyMessage');
        const submitReplyButton = document.getElementById('submitReplyBtn');

        // Reset previous state
        diaryMessageTextarea.value = '';
        currentEntryContentDiv.style.display = 'none';
        diaryReplyMessageTextarea.value = '';
        diaryReplyMessageTextarea.style.display = 'block'; // Ensure reply box is visible
        submitReplyButton.style.display = 'block'; // Ensure reply button is visible
        
        if (isNewEntry) {
            selectedDate = new Date(); // Set to current date for new entry
            const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            document.getElementById('diaryEntryDateDisplay').textContent = `Diary Entry for: ${formattedDate}`;
            diaryMessageTextarea.style.display = 'block';
            submitDiaryButton.style.display = 'block';
        } else if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            document.getElementById('diaryEntryDateDisplay').textContent = `Diary Entry for: ${formattedDate}`;
            // Check if there's an existing entry for this date
            const entryForDate = diaryEntries[formattedDate];
            if (entryForDate) {
                document.getElementById('diaryEntryText').textContent = entryForDate.message;
                document.getElementById('entrySubmittedBy').textContent = entryForDate.submittedBy;
                document.getElementById('entryTimestamp').textContent = entryForDate.timestamp ? new Date(entryForDate.timestamp).toLocaleString() : 'N/A';
                currentEntryContentDiv.style.display = 'block';
                diaryMessageTextarea.style.display = 'none'; // Hide textarea if entry exists
                submitDiaryButton.style.display = 'none'; // Hide submit button if entry exists
                renderDiaryReplies(entryForDate.replies || []);

                // Disable reply input if current user submitted the entry
                if (entryForDate.submittedBy === currentUser) {
                    diaryReplyMessageTextarea.style.display = 'none';
                    submitReplyButton.style.display = 'none';
                }
            } else {
                diaryMessageTextarea.style.display = 'block';
                submitDiaryButton.style.display = 'block';
                document.getElementById('diaryEntryText').textContent = '';
                document.getElementById('diaryRepliesList').innerHTML = '<p>No replies yet.</p>';
            }
        }
    }
}

function renderCalendar(date) {
    const calendarEl = document.getElementById('calendar');
    const currentMonthYearEl = document.getElementById('currentMonthYear');
    if (!calendarEl || !currentMonthYearEl) return;

    calendarEl.innerHTML = ''; // Clear previous calendar
    currentMonthYearEl.textContent = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('calendar-day-header');
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });

    // Add empty divs for days before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarEl.appendChild(document.createElement('div'));
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-date');
        dayEl.textContent = i;

        const fullDate = new Date(date.getFullYear(), date.getMonth(), i);
        const formattedDate = fullDate.toISOString().split('T')[0]; // YYYY-MM-DD

        dayEl.classList.add('current-month'); // All days of current month

        if (diaryEntries[formattedDate]) {
            dayEl.classList.add('has-entry');
            const dot = document.createElement('div');
            dot.classList.add('entry-dot');
            dayEl.appendChild(dot);
        }

        dayEl.addEventListener('click', () => {
            selectedDate = fullDate; // Set the global selected date
            navigateToDiaryPage('diaryEntryPage');
        });

        calendarEl.appendChild(dayEl);
    }
}

async function fetchDiaryEntries() {
    if (!currentUser) { console.warn('Not logged in, skipping diary entry fetch.'); return; }
    console.log('Fetching diary entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const serverData = await response.json();
        console.log('Received diary data:', serverData);

        diaryEntries = {}; // Clear previous entries
        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            serverData.data.forEach(entry => {
                diaryEntries[entry.date] = entry; // Store by date (YYYY-MM-DD)
            });
        }
        // No explicit alert here, calendar will render based on available data
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
        alert('Error fetching diary entries: ' + error.message);
    }
}

function renderDiaryReplies(replies) {
    const diaryRepliesList = document.getElementById('diaryRepliesList');
    diaryRepliesList.innerHTML = ''; // Clear existing replies

    if (replies && replies.length > 0) {
        replies.forEach(reply => {
            const replyDiv = document.createElement('div');
            replyDiv.classList.add('reply-message');
            const replyTextP = document.createElement('p');
            replyTextP.innerHTML = `<strong>${reply.repliedBy}:</strong> ${reply.replyMessage}`;
            replyDiv.appendChild(replyTextP);

            if (reply.replyTimestamp) {
                const replyTimeP = document.createElement('p');
                replyTimeP.classList.add('reply-timestamp');
                replyTimeP.textContent = `Replied: ${new Date(reply.replyTimestamp).toLocaleString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}`;
                replyDiv.appendChild(replyTimeP);
            }
            diaryRepliesList.appendChild(replyDiv);
        });
    } else {
        diaryRepliesList.innerHTML = '<p>No replies yet.</p>';
    }
}


async function submitDiaryEntry() {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    if (!selectedDate) { alert('Please select a date first!'); return; }
    
    const messageInput = document.getElementById('diaryMessage');
    const message = messageInput.value.trim();

    if (!message) { alert('Please enter your diary entry.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }
    
    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', formattedDate);
    formData.append('message', message);
    formData.append('submittedBy', currentUser); // User attribution

    const submitBtn = document.getElementById('submitDiaryBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log(`Submitting diary entry for ${formattedDate} by ${currentUser}:`, { message: message.substring(0, 50) + '...' });

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Diary Entry Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving diary entry.');
        
        // Refresh diary entries and calendar
        await fetchDiaryEntries();
        renderCalendar(calendarCurrentDate);
        navigateToDiaryPage('diaryCalendarPage'); // Go back to calendar after saving
        alert('Diary entry saved!');
        if (messageInput) messageInput.value = ''; // Clear textarea
    } catch (error) {
        console.error('Diary Entry Error!', error);
        alert('Error submitting diary entry: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
}


async function submitDiaryReply() {
    if (!currentUser) { alert('Please log in first.'); logout(); return; }
    if (!selectedDate) { alert('No diary entry selected to reply to.'); return; }

    const replyMessageInput = document.getElementById('diaryReplyMessage');
    const replyMessage = replyMessageInput.value.trim();

    if (!replyMessage) { alert('Please enter your reply.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.'); return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const entryToReplyTo = diaryEntries[formattedDate];

    if (!entryToReplyTo) {
        alert('No diary entry found for this date to reply to.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', 'diary'); // Specify type of entry
    formData.append('entryIdentifier', formattedDate); // Date is the identifier for diary entries
    formData.append('replyMessage', replyMessage);
    formData.append('repliedBy', currentUser);

    const submitBtn = document.getElementById('submitReplyBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Replying...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${text}`);
        }
        const data = await response.json();
        console.log('Diary Reply Submission Success!', data);
        if (data.status === 'error') throw new Error(data.message || 'Server error saving reply.');
        
        // Refresh diary entries and re-render current entry view
        await fetchDiaryEntries();
        navigateToDiaryPage('diaryEntryPage'); // Re-display the entry to show the new reply
        replyMessageInput.value = ''; // Clear reply input
    } catch (error) {
        console.error('Diary Reply Error!', error);
        alert('Error submitting reply: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
}

// --- Dare Game Functions ---
function initializeDares() {
    availableDareIndices = Array.from({ length: dares.length }, (_, i) => i); // Fill with indices 0 to dares.length-1
    shuffleArray(availableDareIndices); // Randomize the order
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

function navigateToDareGame() {
    if (!currentUser) { alert('Please log in to play the Dare Game.'); logout(); return; }
    navigateToApp('dareGameScreen');
    initializeDares(); // Re-initialize dares each time game is started
    displayRandomDare();
}

function displayRandomDare() {
    const dareDisplayEl = document.getElementById('dareDisplay');
    if (availableDareIndices.length === 0) {
        dareDisplayEl.innerHTML = '<p>No more dares! You\'ve completed them all. Resetting...</p>';
        initializeDares(); // Reset dares once all have been shown
        setTimeout(() => displayRandomDare(), 1500); // Display a new dare after a short delay
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableDareIndices.length);
    currentDareIndex = availableDareIndices.splice(randomIndex, 1)[0]; // Remove and get the dare index
    
    dareDisplayEl.innerHTML = `<p>${dares[currentDareIndex]}</p>`;
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners for feelings portal options
    document.querySelectorAll('.feelings-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.feelings-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Check if scriptURL is set
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

    // Dare Game Event Listener
    const nextDareBtn = document.getElementById('nextDareBtn');
    if (nextDareBtn) {
        nextDareBtn.addEventListener('click', displayRandomDare);
    }


     console.log('DOM loaded. External script functions should be available.');
     if (typeof navigateToApp === 'undefined') {
         console.error('❌ script.js core functions not defined globally! This can happen if script is deferred or has loading issues.');
         alert('Error: Critical script functions not loaded.');
     } else {
         console.log('✅ script.js core functions seem to be defined.');
     }
});
