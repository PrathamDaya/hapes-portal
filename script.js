// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< REPLACE WITH YOUR URL
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};

// --- Main Navigation ---
function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) { 
        alert('No entry for ' + dateString); 
        return; 
    }

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) { 
        alert('Invalid date for view: ' + dateString); 
        return; 
    }
    
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

    if (isNaN(dateObj.getTime())) { 
        alert('Invalid date object for view: ' + dateString); 
        return; 
    }

    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value; // Should be YYYY-MM-DD

    if (!date) { 
        alert('No date selected.'); 
        return; 
    }
    if (!thoughts) { 
        alert('Please write some thoughts.'); 
        return; 
    }

    // Validate that we have the script URL configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        alert('Please update the scriptURL in script.js with your Google Apps Script web app URL.');
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

    console.log('Submitting diary entry:', { date: date, thoughts: thoughts });

    fetch(scriptURL, { 
        method: 'POST', 
        body: formData,
        mode: 'cors'
    })
        .then(response => {
            console.log('Diary response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => { 
                    console.error('Diary error response:', text);
                    throw new Error(`HTTP error! ${response.status}, ${text}`) 
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Diary server response:', data);
            if (data.status === 'error') {
                throw new Error(data.message || 'Error saving diary from server.');
            }
            console.log('Diary Entry Success!', data);
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
            if (submitBtn) { 
                submitBtn.textContent = originalBtnText; 
                submitBtn.disabled = false; 
            }
        });
}

async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries list...');
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) { 
        console.error('"allDiaryEntriesList" not found.'); 
        return; 
    }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) { 
            const errorText = await response.text(); 
            console.error('All diary entries fetch error:', errorText);
            throw new Error(`HTTP error! ${response.status}, ${errorText}`);
        }
        
        const serverData = await response.json();
        console.log('All diary entries data:', serverData);
        listContainer.innerHTML = '';

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                const dateParts = entry.date.split('-');
                let formattedDate = entry.date;
                
                if (dateParts.length === 3) {
                    const entryDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    if (!isNaN(entryDateObj.getTime())) {
                        formattedDate = entryDateObj.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                    }
                }
                
                entryDiv.innerHTML = `<h3>${formattedDate}</h3><p>${entry.thoughts || 'No thoughts.'}</p><hr>`;
                listContainer.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown response'}</p>`;
        }
        navigateToDiaryPage('allDiaryEntriesPage');
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
    // Check if script URL is configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
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
}); navigateToApp(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1');
    } else if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryCalendarPage');
        });
    }
}

// --- Hetu's Feelings Portal ---
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    else { console.error('Feelings page not found:', pageId); return; }

    currentEmotion = emotion;
    if (pageId === 'feelingsPage2' && emotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) heading.textContent = `You selected: ${emotion}. Please let me know your thoughts.`;
    }
    if (pageId === 'feelingsPage3') {
        const messageBox = document.getElementById('feelings-message-box');
        const messageTextarea = document.getElementById('feelingsMessage');
        if (messageBox && messageTextarea) messageBox.textContent = messageTextarea.value.substring(0, 20) + '...';
    }
}

function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();
    if (!message) { 
        alert('Please enter your thoughts.'); 
        return; 
    }

    // Validate that we have the script URL configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        alert('Please update the scriptURL in script.js with your Google Apps Script web app URL.');
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

    console.log('Submitting feelings entry:', { emotion: currentEmotion, message: message });

    fetch(scriptURL, { 
        method: 'POST', 
        body: formData,
        mode: 'cors'
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => { 
                    console.error('Error response:', text);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`) 
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            if (data.status === 'error') {
                throw new Error(data.message || 'Unknown error from server submitting feelings.');
            }
            console.log('Feelings Entry Success!', data);
            navigateToFeelingsPage('feelingsPage3');
            if (messageInput) messageInput.value = '';
        })
        .catch(error => {
            console.error('Feelings Entry Error!', error);
            alert('There was an error submitting your entry. Please check the console for details.\n' + error.message);
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
    const feelingsListContainer = document.getElementById('feelingsEntriesList');
    if (!feelingsListContainer) { 
        console.error('"feelingsEntriesList" not found.'); 
        navigateToFeelingsPage('feelingsPage1'); 
        return; 
    }
    feelingsListContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) { 
            const errorText = await response.text(); 
            console.error('Fetch error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received feelings data from server:', data);

        feelingsListContainer.innerHTML = ''; // Clear loading

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
                cellTimestamp.textContent = entry.timestamp || 'N/A';

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
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        if (feelingsListContainer) {
            feelingsListContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
        }
        alert('Error loading past feelings entries.\n' + error.message);
        navigateToFeelingsPage('feelingsPage1');
    }
}

// --- Hetu's Diary ---
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    else console.error('Diary page not found:', pageId);
}

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
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
            console.log('Diary entries loaded:', diaryEntries);
        } else {
            console.error('Error fetching diary entries from server:', data.message);
        }
    } catch (error) { 
        console.error('Failed to fetch diary entries (network/fetch error):', error); 
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
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        const cellDate = new Date(year, month, day);

        // Use local components for YYYY-MM-DD format
        const localYear = cellDate.getFullYear();
        const localMonth = String(cellDate.getMonth() + 1).padStart(2, '0');
        const localDay = String(cellDate.getDate()).padStart(2, '0');
        const formattedCellDate = `${localYear}-${localMonth}-${localDay}`;

        dayCell.dataset.date = formattedCellDate;

        if (cellDate.getTime() === today.getTime()) dayCell.classList.add('today');
        if (diaryEntries[formattedCellDate]) {
            dayCell.classList.add('has-entry');
            dayCell.title = 'Diary entry exists.';
        }

        dayCell.addEventListener('click', () => {
            console.log('Clicked date from dataset:', dayCell.dataset.date);
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
    if (dateParts.length !== 3) { 
        alert('Invalid date: ' + dateString); 
        return; 
    }
    
    const yearNum = parseInt(dateParts[0], 10);
    const monthNum = parseInt(dateParts[1], 10) - 1; // JS months 0-11
    const dayNum = parseInt(dateParts[2], 10);
    const dateObj = new Date(yearNum, monthNum, dayNum);

    if (isNaN(dateObj.getTime())) { 
        alert('Invalid date created: ' + dateString); 
        return; 
    }
    
    console.log('Parsed dateObj for display in openDiaryEntry:', dateObj.toString());

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
    
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

function
