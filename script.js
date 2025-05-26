// --- FULLY UPDATED script.js with Reply Functionality ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< REPLACE WITH YOUR URL

// Select relevant DOM elements
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Global variables for application state
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {}; // Stores { 'YYYY-MM-DD': entryObject }

// --- Main Navigation and Core Functions ---

/**
 * Navigates between different main application screens.
 * @param {string} screenId - The ID of the screen to navigate to.
 */
function navigateToApp(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error("Screen not found:", screenId);
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

/**
 * Navigates between different pages within the feelings portal.
 * @param {string} pageId - The ID of the feelings portal page.
 * @param {string} [emotion=''] - The selected emotion.
 */
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Feelings page not found:', pageId);
        return;
    }

    if (emotion) { // Only set currentEmotion if a new one is provided
        currentEmotion = emotion;
    }

    if (pageId === 'feelingsPage2' && currentEmotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) heading.textContent = `You selected: ${currentEmotion}. Please let me know your thoughts.`;
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

/**
 * Submits a new feelings entry.
 */
function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();

    if (!currentEmotion) {
        alert('Please select an emotion first!');
        return;
    }
    if (!message) {
        alert('Please enter your thoughts.');
        return;
    }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);

    const submitBtn = document.getElementById('submitFeelingsBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    console.log('Submitting feelings entry:', { emotion: currentEmotion, message: message.substring(0, 50) + '...' });

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

/**
 * Fetches and displays all feelings entries.
 */
async function fetchAndDisplayFeelingsEntries() {
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
            const headers = ['Date & Time', 'Emotion', 'Message', 'Response']; // MODIFIED: Added Response
            headers.forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            serverData.data.forEach(entry => { // Assumes data is already sorted newest first by backend
                const row = tbody.insertRow();
                
                const cellTimestamp = row.insertCell();
                if (entry.timestamp) {
                    const entryDateTime = new Date(entry.timestamp);
                    cellTimestamp.textContent = !isNaN(entryDateTime.getTime()) ? entryDateTime.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                    }) : entry.timestamp;
                } else { cellTimestamp.textContent = 'N/A'; }

                const cellEmotion = row.insertCell();
                const emotionSpan = document.createElement('span');
                emotionSpan.classList.add('emotion-tag', entry.emotion ? entry.emotion.toLowerCase() : 'unknown');
                emotionSpan.textContent = entry.emotion || 'N/A';
                cellEmotion.appendChild(emotionSpan);

                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'No message';

                // --- ADDED REPLY CELL ---
                const cellResponse = row.insertCell();
                cellResponse.style.verticalAlign = 'top';

                if (entry.replyByPratham) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display');
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestampPratham) {
                        const replyTimeP = document.createElement('p');
                        replyTimeP.classList.add('reply-timestamp');
                        let formattedReplyTs = 'Unknown time';
                        const replyDateObj = new Date(entry.replyTimestampPratham);
                        if (!isNaN(replyDateObj.getTime())) {
                           formattedReplyTs = replyDateObj.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                            });
                        } else { formattedReplyTs = entry.replyTimestampPratham; }
                        replyTimeP.textContent = `Replied: ${formattedReplyTs}`;
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
                        const promptMessage = `Replying to Hetu's feeling on ${entryDateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
                        const replyText = prompt(promptMessage);
                        if (replyText !== null) {
                            submitReply('feeling', entry.timestamp, replyText, replyButton);
                        } else {
                            replyButton.disabled = false;
                        }
                    };
                    cellResponse.appendChild(replyButton);
                }
                // --- END REPLY CELL ---
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
        // alert('Error loading past feelings: ' + error.message); // Optional: can be intrusive
        // navigateToFeelingsPage('feelingsPage1'); // Removed to stay on error page
    }
}


// --- Hetu's Diary Functions ---

/**
 * Navigates between different pages within the diary section.
 * @param {string} pageId - The ID of the diary page.
 */
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Diary page not found:', pageId);
    }
}

/**
 * Fetches diary entries from backend and stores them.
 */
async function fetchDiaryEntries() {
    console.log('Fetching diary entries...');
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('scriptURL not configured. Diary entries cannot be fetched.');
        diaryEntries = {}; // Reset if URL is bad
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
            diaryEntries = {}; // Reset
            if (data.data) {
                data.data.forEach(entry => {
                    diaryEntries[entry.date] = entry; // Key by YYYY-MM-DD date
                });
            }
            console.log('Diary entries loaded into memory:', Object.keys(diaryEntries).length);
        } else {
            console.error('Error fetching diary entries from server:', data.message);
            diaryEntries = {}; // Clear on error
        }
    } catch (error) {
        console.error('Failed to fetch diary entries (network/fetch error):', error);
        diaryEntries = {}; // Clear on error
    }
}

/**
 * Renders the calendar for the given date.
 * @param {Date} date - The date object for the month to display.
 */
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
            dayCell.title = 'Diary entry exists.';
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

/**
 * Opens the diary entry page for a specific date.
 * @param {string} dateString - The date in 'YYYY-MM-DD' format.
 */
function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    console.log('openDiaryEntry received dateString:', dateString);

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format for opening diary: ' + dateString); return;
    }
    const yearNum = parseInt(dateParts[0], 10);
    const monthNum = parseInt(dateParts[1], 10) - 1;
    const dayNum = parseInt(dateParts[2], 10);
    const dateObj = new Date(yearNum, monthNum, dayNum);

    if (isNaN(dateObj.getTime())) {
        alert('Could not create valid date from: ' + dateString); return;
    }
    
    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

/**
 * Displays a specific diary entry in detail.
 * @param {string} dateString - The date of the entry in 'YYYY-MM-DD'.
 */
function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) {
        // This case should ideally not happen if calendar 'has-entry' is accurate.
        // Could mean diaryEntries is stale.
        console.warn('viewDiaryEntry called for a date with no cached entry:', dateString);
        // Option: fetch again, or fallback to open new.
        alert('Could not load details for ' + dateString + '. Entry not found in local cache. Try going back and clicking again.');
        openDiaryEntry(dateString); // Fallback to creating a new one if not found
        return;
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format for view: ' + dateString); return;
    }
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    if (isNaN(dateObj.getTime())) {
        alert('Invalid date object for view: ' + dateString); return;
    }

    const displayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', displayOptions);
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';

    // --- ADDED REPLY SECTION FOR SINGLE DIARY VIEW ---
    const singleViewReplyContainer = document.getElementById('diaryViewPageReplySection');
    if (singleViewReplyContainer) {
        singleViewReplyContainer.innerHTML = ''; // Clear previous

        if (entry.replyByPratham) {
            const replyDisplay = document.createElement('div');
            replyDisplay.classList.add('reply-display');
            const replyTextP = document.createElement('p');
            replyTextP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
            replyDisplay.appendChild(replyTextP);
            if (entry.replyTimestampPratham) {
                const replyTimeP = document.createElement('p');
                replyTimeP.classList.add('reply-timestamp');
                let formattedReplyTs = 'Unknown time';
                const replyDateObj = new Date(entry.replyTimestampPratham);
                if (!isNaN(replyDateObj.getTime())) {
                   formattedReplyTs = replyDateObj.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                    });
                } else { formattedReplyTs = entry.replyTimestampPratham; }
                replyTimeP.textContent = `Replied: ${formattedReplyTs}`;
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
                const promptMessage = `Replying to Hetu's diary entry for ${currentDisplayDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
                const replyText = prompt(promptMessage);
                if (replyText !== null) {
                    submitReply('diary', dateString, replyText, replyButton); // dateString is the YYYY-MM-DD id
                } else {
                     replyButton.disabled = false;
                }
            };
            singleViewReplyContainer.appendChild(replyButton);
        }
    } else {
        console.error("Reply container 'diaryViewPageReplySection' not found.");
    }
    // --- END REPLY SECTION ---
    navigateToDiaryPage('diaryViewPage');
}


/**
 * Submits a new diary entry.
 */
function submitDiaryEntry() {
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

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log('Submitting diary entry:', { date: date, thoughts: thoughts.substring(0, 50) + '...' });

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
        // Important: Re-fetch entries *before* rendering calendar or navigating
        return fetchDiaryEntries().then(() => { // Ensure diaryEntries is updated
             renderCalendar(calendarCurrentDate); // Re-render calendar with new 'has-entry'
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

/**
 * Fetches and displays all diary entries in a list.
 */
async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries list...');
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) {
        console.error('"allDiaryEntriesList" not found.'); return;
    }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    // Ensure local cache is up-to-date first, or rely on direct fetch for this view
    // For simplicity, this function can do its own fetch directly.
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
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                
                let formattedDate = 'Unknown Date';
                if (entry.date) {
                    const entryDateObj = new Date(entry.date + "T00:00:00"); // Ensure parsed as local date
                     if (!isNaN(entryDateObj.getTime())) {
                        formattedDate = entryDateObj.toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        });
                    } else { formattedDate = `Invalid Date: ${entry.date}`; }
                }
                
                entryDiv.innerHTML = `<h3>${formattedDate}</h3><p>${entry.thoughts || 'No thoughts.'}</p>`; // Removed hr, will add reply section below

                // --- ADDED REPLY SECTION FOR ALL DIARY ENTRIES LIST ---
                const replySectionDiv = document.createElement('div');
                replySectionDiv.classList.add('entry-reply-section');

                if (entry.replyByPratham) {
                    const replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply-display');
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestampPratham) {
                        const replyTimeP = document.createElement('p');
                        replyTimeP.classList.add('reply-timestamp');
                        let formattedReplyTs = 'Unknown time';
                        const replyDateObj = new Date(entry.replyTimestampPratham);
                        if (!isNaN(replyDateObj.getTime())) {
                           formattedReplyTs = replyDateObj.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                            });
                        } else { formattedReplyTs = entry.replyTimestampPratham; }
                        replyTimeP.textContent = `Replied: ${formattedReplyTs}`;
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
                        const promptMessage = `Replying to Hetu's diary entry for ${formattedDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
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
                entryDiv.appendChild(document.createElement('hr')); // Add hr after reply section
                // --- END REPLY SECTION ---
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


// --- NEW FUNCTION: submitReply ---
/**
 * Submits a reply to a feeling or diary entry.
 * @param {string} entryType - 'feeling' or 'diary'.
 * @param {string} entryIdentifier - Timestamp for feeling, Date (YYYY-MM-DD) for diary.
 * @param {string} replyMessage - The reply text.
 * @param {HTMLButtonElement} buttonElement - The button that was clicked.
 */
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!replyMessage || replyMessage.trim() === "") {
        alert("Reply cannot be empty.");
        if (buttonElement) {
            buttonElement.disabled = false; // Re-enable
            // Reset button text if needed, though re-render usually handles this
            if(buttonElement.classList.contains('small-reply-btn')) {
                 buttonElement.textContent = 'Reply 💌';
            } else {
                 buttonElement.textContent = 'Reply 💌';
            }
        }
        return;
    }

    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Please update the scriptURL in script.js.');
        if (buttonElement) {
            buttonElement.disabled = false;
             if(buttonElement.classList.contains('small-reply-btn')) {
                 buttonElement.textContent = 'Reply 💌';
            } else {
                 buttonElement.textContent = 'Reply 💌';
            }
        }
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage.trim());

    const originalButtonText = buttonElement ? buttonElement.textContent : 'Reply 💌';
    if (buttonElement) {
        buttonElement.textContent = 'Replying...';
        buttonElement.disabled = true;
    }

    console.log(`Submitting reply for ${entryType} ID ${entryIdentifier}: ${replyMessage.trim()}`);

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Reply submission HTTP error response text:', text);
            throw new Error(`HTTP error! ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log('Reply server response:', data);

        if (data.status === 'error') {
            throw new Error(data.message || `Error saving reply from server.`);
        }

        alert('Reply submitted successfully! Hetu has been notified.');
        
        // Refresh the relevant view
        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries(); 
        } else if (entryType === 'diary') {
            await fetchDiaryEntries(); // Update local diaryEntries cache
            renderCalendar(calendarCurrentDate); 
            
            if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                fetchAndDisplayAllDiaryEntries();
            }
            // If on diaryViewPage for THIS entry, refresh it by re-calling viewDiaryEntry
            const diaryViewPageActive = document.getElementById('diaryViewPage').classList.contains('active');
            // Check if the currently viewed entry matches the one replied to
            const currentViewedEntryDate = document.getElementById('selectedDate').value; // This might not be reliable if view page doesn't set it.
                                                                                          // Better to check against the data attribute of the cell or the entry's actual date.
                                                                                          // For simplicity, we use entryIdentifier which is dateString for diary.
            if (diaryViewPageActive && diaryEntries[entryIdentifier]) { 
                 viewDiaryEntry(entryIdentifier); 
            }
        }

    } catch (error) {
        console.error('Reply Submission Error!', error);
        alert('Error submitting reply.\n' + error.message);
        if (buttonElement) { // Restore button only on error
            buttonElement.textContent = originalButtonText;
            buttonElement.disabled = false;
        }
    }
    // On success, the button is usually removed by the view refresh, so no need to restore here.
}
// --- END NEW FUNCTION ---


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
        alert('WARNING: The application is not configured to save data. Please contact the developer (update scriptURL).');
    }
    
    navigateToApp('homeScreen');
    
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
});
