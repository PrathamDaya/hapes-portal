// --- FULLY FIXED script.js ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< REPLACE WITH YOUR URL

// Select relevant DOM elements
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Global variables for application state
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};

// --- Main Navigation and Core Functions ---

/**
 * Displays a specific diary entry in detail.
 * @param {string} dateString - The date of the diary entry in 'YYYY-MM-DD' format.
 */
function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) {
        alert('No entry for ' + dateString);
        return;
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format for view: ' + dateString);
        return;
    }
    
    // Create date object from parsed parts to ensure local date interpretation
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

    if (isNaN(dateObj.getTime())) {
        alert('Invalid date object created for view: ' + dateString);
        return;
    }

    // Format and display the date and thoughts
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';
    navigateToDiaryPage('diaryViewPage'); // Navigate to the view page
}

/**
 * Submits a new diary entry to the Google Apps Script backend.
 */
function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value; // Date in YYYY-MM-DD format

    // Client-side validation
    if (!date) {
        alert('No date selected for diary entry.');
        return;
    }
    if (!thoughts) {
        alert('Please write some thoughts for your diary entry.');
        return;
    }

    // Check if script URL is configured (important for deployment)
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        alert('Please update the scriptURL in script.js with your Google Apps Script web app URL before submitting data.');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);

    // Disable button and show loading state
    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log('Submitting diary entry:', { date: date, thoughts: thoughts.substring(0, 50) + '...' });

    // Send data to backend
    fetch(scriptURL, {
        method: 'POST',
        body: formData,
        mode: 'cors'
    })
    .then(response => {
        console.log('Diary response status:', response.status);
        if (!response.ok) { // Handle HTTP errors
            return response.text().then(text => {
                console.error('Diary error response:', text);
                throw new Error(`HTTP error! ${response.status}: ${text}`);
            });
        }
        return response.json(); // Parse JSON response
    })
    .then(data => {
        console.log('Diary server response:', data);
        if (data.status === 'error') {
            throw new Error(data.message || 'Error saving diary from server.');
        }
        console.log('Diary Entry Success!', data);
        // On success, refetch entries, re-render calendar, and show confirmation
        fetchDiaryEntries().then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryConfirmationPage');
        });
    })
    .catch(error => {
        console.error('Diary Entry Error!', error);
        alert('Error saving diary entry.\n' + error.message);
    })
    .finally(() => {
        // Re-enable button
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Fetches all diary entries from the backend and displays them in a list.
 */
async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries list...');
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) {
        console.error('"allDiaryEntriesList" not found. Cannot display entries.');
        return;
    }
    listContainer.innerHTML = '<p>Loading entries...</p>'; // Show loading message

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('All diary entries fetch error:', errorText);
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        
        const serverData = await response.json();
        console.log('All diary entries data:', serverData);
        listContainer.innerHTML = ''; // Clear loading message

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            // Sort entries by date, newest first
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                let formattedDate = 'Unknown Date'; // Default fallback

                // Robust date parsing for Point 4 (Invalid Date display)
                const entryDateObj = new Date(entry.date);
                if (!isNaN(entryDateObj.getTime())) { // Check if the date is valid
                    formattedDate = entryDateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else if (entry.date) {
                    formattedDate = `Invalid Date: ${entry.date}`; // Show original invalid string
                }
                
                entryDiv.innerHTML = `<h3>${formattedDate}</h3><p>${entry.thoughts || 'No thoughts.'}</p><hr>`;
                listContainer.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown response from server'}</p>`;
        }
        navigateToDiaryPage('allDiaryEntriesPage'); // Navigate to the all entries page
    } catch (error) {
        console.error('Failed to fetch all diary entries list:', error);
        if (listContainer) {
            listContainer.innerHTML = '<p>Error loading all diary entries.</p>';
        }
        alert('Error loading all diary entries.\n' + error.message);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Warn if script URL is not configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    navigateToApp('homeScreen'); // Start on the home screen after DOM is loaded
    
    // Event listeners for calendar month navigation buttons
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

/**
 * Navigates between different main application screens.
 * @param {string} screenId - The ID of the screen to navigate to (e.g., 'homeScreen', 'feelingsPortalScreen', 'diaryScreen').
 */
function navigateToApp(screenId) {
    screens.forEach(screen => screen.classList.remove('active')); // Hide all screens
    document.getElementById(screenId).classList.add('active'); // Show target screen

    // Perform specific actions when navigating to certain screens
    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1'); // Go to the first page of feelings portal
    } else if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => { // Fetch diary entries and render calendar
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryCalendarPage'); // Go to the calendar page of diary
        });
    }
}

// --- Hetu's Feelings Portal Functions ---

/**
 * Navigates between different pages within the feelings portal.
 * @param {string} pageId - The ID of the feelings portal page to navigate to.
 * @param {string} [emotion=''] - The selected emotion, if applicable.
 */
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active')); // Hide all feelings pages
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active'); // Show target page
    } else {
        console.error('Feelings page not found:', pageId);
        return;
    }

    currentEmotion = emotion; // Set the global current emotion

    // Update heading for feelingsPage2 based on selected emotion
    if (pageId === 'feelingsPage2' && emotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) heading.textContent = `You selected: ${emotion}. Please let me know your thoughts.`;
    }
    // Update message box for feelingsPage3 (confirmation)
    if (pageId === 'feelingsPage3') {
        const messageBox = document.getElementById('feelings-message-box');
        const messageTextarea = document.getElementById('feelingsMessage');
        if (messageBox && messageTextarea) messageBox.textContent = messageTextarea.value.substring(0, 20) + '...'; // Show snippet
    }
}

/**
 * Submits a new feelings entry to the Google Apps Script backend.
 */
function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();

    // FIX for Point 1 & 5: Validate that an emotion is selected
    if (!currentEmotion) {
        alert('Please select an emotion first!');
        return;
    }

    if (!message) {
        alert('Please enter your thoughts.');
        return;
    }

    // Check if script URL is configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        alert('Please update the scriptURL in script.js with your Google Apps Script web app URL before submitting data.');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);

    // Disable button and show loading state
    const submitBtn = document.getElementById('submitFeelingsBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    console.log('Submitting feelings entry:', { emotion: currentEmotion, message: message.substring(0, 50) + '...' });

    // Send data to backend
    fetch(scriptURL, {
        method: 'POST',
        body: formData,
        mode: 'cors'
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) { // Handle HTTP errors
            return response.text().then(text => {
                console.error('Error response:', text);
                throw new Error(`HTTP error! status: ${response.status}: ${text}`);
            });
        }
        return response.json(); // Parse JSON response
    })
    .then(data => {
        console.log('Server response:', data);
        if (data.status === 'error') {
            throw new Error(data.message || 'Unknown error from server submitting feelings.');
        }
        console.log('Feelings Entry Success!', data);
        navigateToFeelingsPage('feelingsPage3'); // Navigate to confirmation page
        if (messageInput) messageInput.value = ''; // Clear textarea
    })
    .catch(error => {
        console.error('Feelings Entry Error!', error);
        alert('There was an error submitting your entry. Please check the console for details.\n' + error.message);
    })
    .finally(() => {
        // Re-enable button
        if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Fetches all feelings entries from the backend and displays them in a table.
 */
async function fetchAndDisplayFeelingsEntries() {
    console.log('Fetching feelings entries...');
    const feelingsListContainer = document.getElementById('feelingsEntriesList');
    if (!feelingsListContainer) {
        console.error('"feelingsEntriesList" not found. Cannot display entries.');
        navigateToFeelingsPage('feelingsPage1');
        return;
    }
    feelingsListContainer.innerHTML = '<p>Loading entries...</p>'; // Show loading message

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received feelings data from server:', data);

        feelingsListContainer.innerHTML = ''; // Clear loading message

        if (data.status === 'success' && data.data && data.data.length > 0) {
            const table = document.createElement('table');
            table.classList.add('feelings-table');
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            const headers = ['Date & Time', 'Emotion', 'Message'];
            headers.forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            data.data.forEach(entry => {
                const row = tbody.insertRow();
                const cellTimestamp = row.insertCell();

                // Format timestamp for display
                if (entry.timestamp) {
                    const entryDateTime = new Date(entry.timestamp);
                    if (!isNaN(entryDateTime.getTime())) {
                        cellTimestamp.textContent = entryDateTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true // To display AM/PM
                        });
                    } else {
                        cellTimestamp.textContent = entry.timestamp; // Fallback if invalid date
                    }
                } else {
                    cellTimestamp.textContent = 'N/A';
                }

                const cellEmotion = row.insertCell();
                const emotionSpan = document.createElement('span');
                emotionSpan.classList.add('emotion-tag', entry.emotion ? entry.emotion.toLowerCase() : '');
                emotionSpan.textContent = entry.emotion || 'N/A';
                cellEmotion.appendChild(emotionSpan);

                const cellMessage = row.insertCell();
                cellMessage.textContent = entry.message || 'No message';
            });
            feelingsListContainer.appendChild(table);
        } else if (data.status === 'success' && (!data.data || data.data.length === 0)) {
            feelingsListContainer.innerHTML = '<p>No feelings entries recorded yet.</p>';
        } else {
            feelingsListContainer.innerHTML = `<p>Could not load entries: ${data.message || 'Unknown server response'}</p>`;
        }
        navigateToFeelingsPage('feelingsViewEntriesPage'); // Navigate to the view entries page
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        if (feelingsListContainer) {
            feelingsListContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
        }
        alert('Error loading past feelings entries.\n' + error.message);
        navigateToFeelingsPage('feelingsPage1'); // Go back to the initial feelings page
    }
}

// --- Hetu's Diary Functions ---

/**
 * Navigates between different pages within the diary section.
 * @param {string} pageId - The ID of the diary page to navigate to.
 */
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active')); // Hide all diary pages
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active'); // Show target page
    } else {
        console.error('Diary page not found:', pageId);
    }
}

/**
 * Fetches diary entries from the backend and stores them locally.
 * This is called before rendering the calendar or viewing entries.
 */
async function fetchDiaryEntries() {
    console.log('Fetching diary entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Diary fetch error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Diary entries response:', data);
        
        if (data.status === 'success') {
            diaryEntries = {}; // Reset previous entries
            if (data.data) {
                data.data.forEach(entry => {
                    diaryEntries[entry.date] = entry; // Store entries by date for quick lookup
                });
            }
            console.log('Diary entries loaded:', diaryEntries);
        } else {
            console.error('Error fetching diary entries from server:', data.message);
        }
    } catch (error) {
        console.error('Failed to fetch diary entries (network/fetch error):', error);
        // Do not alert here, as this function is called on page load
    }
}

/**
 * Renders the calendar grid for the given date.
 * @param {Date} date - The date object for the month to display.
 */
function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) {
        console.error("Calendar elements not found. Cannot render calendar.");
        return;
    }

    calendarGrid.innerHTML = ''; // Clear previous calendar
    const month = date.getMonth();
    const year = date.getFullYear();
    monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 6 for Saturday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get last day of month

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Add day headers
    daysOfWeek.forEach(day => {
        const dayHeaderEl = document.createElement('div');
        dayHeaderEl.classList.add('calendar-day-header');
        dayHeaderEl.textContent = day;
        calendarGrid.appendChild(dayHeaderEl);
    });

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    const today = new Date();
    // FIX for Point 3: Compare year, month, and day explicitly for 'today' highlighting
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        const cellDate = new Date(year, month, day);

        // Format date to YYYY-MM-DD for consistency with diary entries
        const localYear = cellDate.getFullYear();
        const localMonth = String(cellDate.getMonth() + 1).padStart(2, '0');
        const localDay = String(cellDate.getDate()).padStart(2, '0');
        const formattedCellDate = `${localYear}-${localMonth}-${localDay}`;

        dayCell.dataset.date = formattedCellDate; // Store date in data attribute

        // Highlight current day if it matches
        if (cellDate.getFullYear() === todayYear &&
            cellDate.getMonth() === todayMonth &&
            cellDate.getDate() === todayDate) {
            dayCell.classList.add('today');
        }

        // Add 'has-entry' class if a diary entry exists for this date
        if (diaryEntries[formattedCellDate]) {
            dayCell.classList.add('has-entry');
            dayCell.title = 'Diary entry exists.'; // Add a tooltip
        }

        // Add click event listener to open or view diary entry
        dayCell.addEventListener('click', () => {
            console.log('Clicked calendar day with date:', dayCell.dataset.date);
            if (diaryEntries[dayCell.dataset.date]) {
                viewDiaryEntry(dayCell.dataset.date); // View existing entry
            } else {
                openDiaryEntry(dayCell.dataset.date); // Create new entry
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}

/**
 * Opens the diary entry page for a specific date, pre-filling the date.
 * @param {string} dateString - The date in 'YYYY-MM-DD' format for the entry.
 */
function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString; // Set hidden input value
    console.log('openDiaryEntry received dateString:', dateString);

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format for opening diary entry: ' + dateString);
        return;
    }
    
    // Create date object from parsed parts
    const yearNum = parseInt(dateParts[0], 10);
    const monthNum = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-11
    const dayNum = parseInt(dateParts[2], 10);
    const dateObj = new Date(yearNum, monthNum, dayNum);

    if (isNaN(dateObj.getTime())) {
        alert('Could not create valid date object from: ' + dateString);
        return;
    }
    
    console.log('Parsed dateObj for display in openDiaryEntry:', dateObj.toString());

    // Format and display the date on the entry page
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    })}`;
    
    document.getElementById('diaryThoughts').value = ''; // Clear thoughts textarea
    navigateToDiaryPage('diaryEntryPage'); // Navigate to the diary entry form
}
