// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< IMPORTANT: REPLACE!
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentEmotion = '';
let currentDiaryDate = null; // For storing the selected date for a diary entry
let calendarCurrentDate = new Date(); // For calendar navigation
let diaryEntries = {}; // To store fetched diary entries { 'YYYY-MM-DD': { thoughts: '' } }

// --- Main Navigation ---
function navigateToApp(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1'); // Default to first feelings page
    } else if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => { // Fetch entries before rendering calendar
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryCalendarPage'); // Default to calendar page
        });
    }
}

// --- Hetu's Feelings Portal ---
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Feelings page not found:', pageId);
        return;
    }

    currentEmotion = emotion;
    if (pageId === 'feelingsPage2' && emotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) {
            heading.textContent = `You selected: ${emotion}. Please let me know your thoughts.`;
        }
    }
    if (pageId === 'feelingsPage3') {
        const messageBox = document.getElementById('feelings-message-box');
        const messageTextarea = document.getElementById('feelingsMessage');
        if (messageBox && messageTextarea) {
            messageBox.textContent = messageTextarea.value.substring(0, 20) + '...';
        }
        // Clear the textarea after showing the confirmation message and potentially navigating away
        // However, it's already cleared in submitFeelingsEntry's success, which is better.
    }
}

function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();
    if (!message) {
        alert('Please enter your thoughts.');
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

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) {
                // Try to get more detailed error from response body
                return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`) });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'error') { // Check for server-side error in JSON response
                throw new Error(data.message || 'Unknown error from server while submitting feelings.');
            }
            console.log('Feelings Entry Success!', data);
            navigateToFeelingsPage('feelingsPage3');
            if (messageInput) messageInput.value = ''; // Clear the textarea
        })
        .catch((error) => {
            console.error('Feelings Entry Error!', error);
            alert('There was an error submitting your entry. Please try again later.\n' + error.message);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
}

async function fetchAndDisplayFeelingsEntries() {
    console.log('Fetching feelings entries...');
    const feelingsList = document.getElementById('feelingsEntriesList');
    if (!feelingsList) {
        console.error('Element with ID "feelingsEntriesList" not found.');
        navigateToFeelingsPage('feelingsPage1'); // Go back if container not found
        return;
    }
    feelingsList.innerHTML = '<p>Loading entries...</p>'; // Show loading message

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log('Received feelings data:', data); // Log to see what's returned

        feelingsList.innerHTML = ''; // Clear loading message/previous entries

        if (data.status === 'success' && data.data && data.data.length > 0) {
            data.data.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('feelings-entry-item');
                entryDiv.innerHTML = `
                    <p><strong>Timestamp:</strong> ${entry.timestamp || 'N/A'}</p>
                    <p><strong>Emotion:</strong> <span class="emotion-tag ${entry.emotion ? entry.emotion.toLowerCase() : ''}">${entry.emotion || 'N/A'}</span></p>
                    <p><strong>Message:</strong> ${entry.message || 'No message'}</p>
                    <hr>
                `;
                feelingsList.appendChild(entryDiv);
            });
        } else if (data.status === 'success' && (!data.data || data.data.length === 0)) {
            feelingsList.innerHTML = '<p>No feelings entries recorded yet.</p>';
        } else {
            // Handle cases where data.status might be 'error' or missing data.data
            feelingsList.innerHTML = `<p>Could not load entries: ${data.message || 'Unknown server response'}</p>`;
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        if (feelingsList) { // Check again in case it was removed or something
            feelingsList.innerHTML = `<p>There was an error loading past feelings entries. Please check the console and try again later.</p>`;
        }
        alert('There was an error loading past feelings entries. Please try again later.\n' + error.message);
        navigateToFeelingsPage('feelingsPage1'); // Navigate back to a safe page
    }
}


// --- Hetu's Diary ---
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
    console.log('Fetching diary entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
            diaryEntries = {}; // Clear previous entries
            if (data.data) {
                data.data.forEach(entry => {
                    diaryEntries[entry.date] = entry; // Store by date (YYYY-MM-DD)
                });
            }
            console.log('Diary entries fetched:', diaryEntries);
        } else {
            console.error('Error fetching diary entries from server:', data.message);
            // Optionally alert user or display error on page
        }
    } catch (error) {
        console.error('Failed to fetch diary entries (network/fetch error):', error);
        // Optionally alert user
    }
}

function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) {
        console.error("Calendar elements not found for rendering.");
        return;
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
    today.setHours(0,0,0,0); // Normalize today to midnight for comparison

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;

        const cellDate = new Date(year, month, day); // This is local time midnight for the current cell
        
        // *** MODIFIED: Format date as YYYY-MM-DD using local components to avoid UTC shift ***
        const localYear = cellDate.getFullYear();
        const localMonth = String(cellDate.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
        const localDay = String(cellDate.getDate()).padStart(2, '0');
        const formattedCellDate = `${localYear}-${localMonth}-${localDay}`; // This is YYYY-MM-DD from local time

        dayCell.dataset.date = formattedCellDate; // Store the YYYY-MM-DD string

        if (cellDate.getTime() === today.getTime()) { // Compare time values for exact date match
            dayCell.classList.add('today');
        }

        if (diaryEntries[formattedCellDate]) {
            dayCell.classList.add('has-entry');
            dayCell.title = 'Diary entry exists for this date.';
        }

        dayCell.addEventListener('click', () => {
            console.log('Clicked date dataset:', dayCell.dataset.date); // Log the date string from dataset
            if (diaryEntries[dayCell.dataset.date]) {
                viewDiaryEntry(dayCell.dataset.date);
            } else {
                openDiaryEntry(dayCell.dataset.date);
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateString) { // dateString is YYYY-MM-DD
    currentDiaryDate = dateString;
    document.getElementById('selectedDate').value = dateString;
    
    console.log('openDiaryEntry received dateString:', dateString); // Log the input

    // Parse dateString as YYYY-MM-DD to avoid timezone issues when creating Date object for display
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format received: ' + dateString);
        console.error('Invalid date format for openDiaryEntry:', dateString);
        return;
    }
    // Create Date object using UTC to avoid local timezone shifts if parts are interpreted as local midnight
    // Then use toLocaleDateString for display which will convert to local display format.
    // Or, more robustly, construct it as local, knowing the parts are from a local representation.
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed for Date constructor
    const day = parseInt(dateParts[2], 10);

    const dateObj = new Date(year, month, day); // Interprets components as local time

    if (isNaN(dateObj.getTime())) {
        alert('Invalid date created: ' + dateString);
        console.error('Could not parse date for openDiaryEntry:', dateString, dateObj);
        return;
    }
    console.log('Parsed dateObj in openDiaryEntry:', dateObj.toString());


    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    
    document.getElementById('diaryThoughts').value = '';
    
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) { // dateString is YYYY-MM-DD
    const entry = diaryEntries[dateString];
    if (!entry) {
        alert('No entry found for this date: ' + dateString);
        return;
    }
    console.log('viewDiaryEntry received dateString:', dateString);

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        alert('Invalid date format for viewing: ' + dateString);
        return;
    }
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2], 10);
    const dateObj = new Date(year, month, day); // Interprets components as local time

    if (isNaN(dateObj.getTime())) {
        alert('Invalid date for viewing: ' + dateString);
        return;
    }

    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts recorded.';
    
    navigateToDiaryPage('diaryViewPage');
}


function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value; // This should be YYYY-MM-DD

    if (!date) {
        alert('No date selected for the diary entry.');
        return;
    }
    if (!thoughts) {
        alert('Please write some thoughts for your diary entry.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) {
                 return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`) });
            }
            return response.json();
        })
        .then(data => {
            console.log('Diary Entry Success!', data);
             if (data.status === 'error') {
                throw new Error(data.message || 'Unknown error from server while saving diary.');
            }
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate); // Re-render with new entry status
                navigateToDiaryPage('diaryConfirmationPage');
            });
        })
        .catch((error) => {
            console.error('Diary Entry Error!', error);
            alert('There was an error saving your diary entry. Please try again later.\n' + error.message);
        })
        .finally(() => {
            if(submitBtn) {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
}

async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries...');
    const allDiaryEntriesList = document.getElementById('allDiaryEntriesList');
    if (!allDiaryEntriesList) {
        console.error('Element with ID "allDiaryEntriesList" not found.');
        return;
    }
    allDiaryEntriesList.innerHTML = '<p>Loading entries...</p>';

    try {
        // fetchDiaryEntries already updates the global diaryEntries object
        // and it's called during diary screen navigation.
        // We can call it again to ensure it's fresh, or rely on the existing data
        // For this specific "View All" it's good to ensure we have the latest.
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const serverData = await response.json(); // Renamed to avoid confusion with global diaryEntries
        allDiaryEntriesList.innerHTML = ''; 

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            // Sort entries by date, newest first
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                
                const dateParts = entry.date.split('-');
                let formattedDate = entry.date; // Fallback
                if (dateParts.length === 3) {
                    const entryDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    if(!isNaN(entryDateObj.getTime())) {
                        formattedDate = entryDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    }
                }
                
                entryDiv.innerHTML = `
                    <h3>${formattedDate}</h3>
                    <p>${entry.thoughts || 'No thoughts recorded.'}</p>
                    <hr>
                `;
                allDiaryEntriesList.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            allDiaryEntriesList.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            allDiaryEntriesList.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown server response'}</p>`;
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        console.error('Failed to fetch all diary entries:', error);
        if (allDiaryEntriesList) {
            allDiaryEntriesList.innerHTML = '<p>There was an error loading all past diary entries. Please try again later.</p>';
        }
        alert('There was an error loading all past diary entries. Please try again later.\n' + error.message);
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    navigateToApp('homeScreen');

    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            // No need to call fetchDiaryEntries here again if renderCalendar uses the global one,
            // but to be safe and ensure calendar highlights are based on freshest data if user navigates fast:
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }

    // Initial fetch for diary when app loads and diary screen might be shown
    // This is also handled by navigateToApp if diaryScreen is the initial target
    // but doesn't hurt to ensure diaryEntries is populated early if needed.
    // However, it's better tied to when the diary screen is actually shown.
    // if (document.getElementById('diaryScreen')) { // If diary screen element exists
    //    fetchDiaryEntries().then(() => {
    //        if (document.getElementById('diaryScreen').classList.contains('active')) {
    //             renderCalendar(calendarCurrentDate); // Render if diary is already active
    //        }
    //    });
    // }
});
