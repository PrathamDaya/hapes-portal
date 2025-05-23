// --- FULLY FIXED script.js ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< REPLACE WITH YOUR URL
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {};

// --- Main Navigation ---
function navigateToApp(screenId) {
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // Special actions for specific screens
    if (screenId === 'diaryScreen') {
        calendarCurrentDate = new Date(); // Reset calendar to current month
        renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
        loadDiaryEntries();
    } else if (screenId === 'feelingsPortalScreen') {
        // Ensure feelingsPage1 is active when entering portal
        navigateToFeelingsPage('feelingsPage1');
        resetFeelingsForm(); // Clear form if user comes back
    }
}

function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'feelingsPage2' && emotion) {
        currentEmotion = emotion;
        document.getElementById('currentFeeling').textContent = emotion;
        document.getElementById('feelingsMessage').value = ''; // Clear textarea
        updateCharCount('feelingsMessage', 'charCount'); // Reset char count
    } else if (pageId === 'feelingsViewEntriesPage') {
        loadFeelingsEntries();
    }
}

function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'diaryCalendarPage') {
        renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
    } else if (pageId === 'allDiaryEntriesPage') {
        loadAllDiaryEntries();
    }
}

// --- Feelings Portal Functions ---
document.getElementById('feelingsMessage').addEventListener('input', () => {
    updateCharCount('feelingsMessage', 'charCount');
});

function updateCharCount(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const countSpan = document.getElementById(countId);
    countSpan.textContent = textarea.value.length;
}

async function submitFeelingsEntry() {
    const message = document.getElementById('feelingsMessage').value;
    if (!message.trim()) {
        alert('Please write something in your message.');
        return;
    }

    navigateToFeelingsPage('feelingsPage3'); // Show confirmation/animation screen

    try {
        const formData = new FormData();
        formData.append('type', 'feelings');
        formData.append('emotion', currentEmotion);
        formData.append('message', message);

        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Feelings entry success:', result);

        // Animation should ideally complete here before showing "thank you"
        // For now, it's just shown after the fetch is complete.
        document.getElementById('feelings-thank-you-message').textContent = `Thank you for sharing your feelings, Hetu! Your '${currentEmotion}' message has been received.`;

    } catch (error) {
        console.error('Error submitting feelings entry:', error);
        document.getElementById('feelings-thank-you-message').textContent = `Oops! Something went wrong while sending your feelings. Please try again.`;
        alert('Could not send your feelings. Please check your internet connection or try again later.');
    }
}

async function loadFeelingsEntries() {
    const entriesListDiv = document.getElementById('feelingsEntriesList');
    entriesListDiv.innerHTML = '<p>Loading feelings entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelings`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched feelings data:', data);

        if (data.status === 'success' && data.data && data.data.length > 0) {
            entriesListDiv.innerHTML = ''; // Clear loading message
            // Sort entries by timestamp in descending order (newest first)
            data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            data.data.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('entry-item');
                const date = new Date(entry.timestamp);
                entryDiv.innerHTML = `
                    <h3>${entry.emotion} - ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
                    <p>${entry.message}</p>
                `;
                entriesListDiv.appendChild(entryDiv);
            });
        } else {
            entriesListDiv.innerHTML = '<p>No feelings entries found yet.</p>';
        }
    } catch (error) {
        console.error('Error loading feelings entries:', error);
        entriesListDiv.innerHTML = '<p>Failed to load feelings entries. Please try again later.</p>';
    }
}

function resetFeelingsForm() {
    document.getElementById('feelingsMessage').value = '';
    updateCharCount('feelingsMessage', 'charCount');
    document.getElementById('feelings-thank-you-message').textContent = `Thank you for sharing your feelings, Hetu! I've received them.`; // Reset message
}


// --- Diary Functions ---
document.getElementById('diaryThoughts').addEventListener('input', () => {
    updateCharCount('diaryThoughts', 'diaryCharCount');
});

async function saveDiaryEntry() {
    const dateString = document.getElementById('selectedDate').value;
    const thoughts = document.getElementById('diaryThoughts').value;

    if (!thoughts.trim()) {
        alert('Please write your diary entry.');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'diary');
        formData.append('date', dateString);
        formData.append('thoughts', thoughts);

        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Diary entry success:', result);
        if (result.status === 'success') {
            diaryEntries[dateString] = thoughts; // Update local cache
            document.getElementById('savedDiaryDate').textContent = new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            navigateToDiaryPage('diaryConfirmationPage');
            renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth()); // Re-render to show new entry
        } else {
            alert('Failed to save diary entry: ' + (result.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error saving diary entry:', error);
        alert('Could not save diary entry. Please check your internet connection or try again later.');
    }
}

async function loadDiaryEntries() {
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched diary data:', data);

        if (data.status === 'success' && data.data) {
            diaryEntries = data.data; // Store fetched entries
            renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
        } else {
            diaryEntries = {};
            console.log('No diary entries found.');
        }
    } catch (error) {
        console.error('Error loading diary entries:', error);
        // Optionally show an error message on the calendar page
    }
}

async function loadAllDiaryEntries() {
    const allEntriesListDiv = document.getElementById('allDiaryEntriesList');
    allEntriesListDiv.innerHTML = '<p>Loading all diary entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();

        if (data.status === 'success' && data.data && Object.keys(data.data).length > 0) {
            allEntriesListDiv.innerHTML = ''; // Clear loading message
            const sortedDates = Object.keys(data.data).sort((a, b) => new Date(b) - new Date(a)); // Newest first

            sortedDates.forEach(dateString => {
                const entryContent = data.data[dateString];
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('entry-item');

                const date = new Date(dateString);
                entryDiv.innerHTML = `
                    <h3>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <p>${entryContent}</p>
                    <button onclick="viewDiaryEntry('${dateString}')">View Details</button>
                    <button onclick="editDiaryEntryFromList('${dateString}')">Edit</button>
                    <button onclick="deleteDiaryEntry('${dateString}', true)">Delete</button>
                `;
                allEntriesListDiv.appendChild(entryDiv);
            });
        } else {
            allEntriesListDiv.innerHTML = '<p>No diary entries found yet.</p>';
        }
    } catch (error) {
        console.error('Error loading all diary entries:', error);
        allEntriesListDiv.innerHTML = '<p>Failed to load all diary entries. Please try again later.</p>';
    }
}

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

    // FIX: Explicitly specify date components to avoid time/timezone
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('viewDiaryContent').textContent = entry;
    document.getElementById('selectedDate').value = dateString; // Set for edit/delete
    navigateToDiaryPage('diaryViewPage');
}

function editDiaryEntry() {
    const dateString = document.getElementById('selectedDate').value;
    const content = document.getElementById('viewDiaryContent').textContent; // Get current content from view

    document.getElementById('diaryThoughts').value = content;
    updateCharCount('diaryThoughts', 'diaryCharCount');
    document.getElementById('selectedDate').value = dateString; // Ensure date is set for save
    openDiaryEntry(dateString); // Re-use openDiaryEntry to navigate and display date
}

function editDiaryEntryFromList(dateString) {
    const content = diaryEntries[dateString];
    document.getElementById('diaryThoughts').value = content;
    updateCharCount('diaryThoughts', 'diaryCharCount');
    document.getElementById('selectedDate').value = dateString; // Ensure date is set for save
    openDiaryEntry(dateString);
}


async function deleteDiaryEntry(dateString = null, fromAllEntriesPage = false) {
    const dateToDelete = dateString || document.getElementById('selectedDate').value;
    if (!dateToDelete) {
        alert('No date selected for deletion.');
        return;
    }

    if (!confirm(`Are you sure you want to delete the diary entry for ${dateToDelete}?`)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'deleteDiary');
        formData.append('date', dateToDelete);

        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Delete diary entry success:', result);

        if (result.status === 'success') {
            delete diaryEntries[dateToDelete]; // Remove from local cache
            alert('Diary entry deleted successfully!');
            if (fromAllEntriesPage) {
                loadAllDiaryEntries(); // Refresh the all entries list
            } else {
                navigateToDiaryPage('diaryCalendarPage'); // Go back to calendar
            }
            renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth()); // Re-render calendar
        } else {
            alert('Failed to delete diary entry: ' + (result.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error deleting diary entry:', error);
        alert('Could not delete diary entry. Please check your internet connection or try again later.');
    }
}


// --- Calendar Functions ---
function renderCalendar(year, month) {
    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');

    monthYearDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; // Clear previous days

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.classList.add('calendar-day-header');
        headerCell.textContent = day;
        calendarGrid.appendChild(headerCell);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Add days of the month
    for (let day = 1; day <= numDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateString;

        // Check for current day
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('current-day');
        }

        // Check if there's a diary entry for this date
        if (diaryEntries[dateString]) {
            dayCell.classList.add('has-entry');
            const indicator = document.createElement('span');
            indicator.classList.add('entry-indicator');
            indicator.innerHTML = '📝'; // Or any small icon
            dayCell.appendChild(indicator);
        }

        dayCell.addEventListener('click', () => {
            if (dayCell.classList.contains('has-entry')) {
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

    // FIX: Explicitly specify date components to avoid time/timezone
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    })}`; // This element might not exist, ensure your HTML has it if you use this.

    // Pre-fill if an entry exists, otherwise clear
    const existingEntry = diaryEntries[dateString] || '';
    document.getElementById('diaryThoughts').value = existingEntry;
    updateCharCount('diaryThoughts', 'diaryCharCount');

    navigateToDiaryPage('diaryEntryPage');
}

function changeMonth(delta) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
    renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
}


// --- Initialize on Load ---
document.addEventListener('DOMContentLoaded', () => {
    navigateToApp('homeScreen'); // Start on the home screen
    loadDiaryEntries(); // Load diary entries for calendar display
    createFloatingEmojis(); // Start the emoji animation
});

// --- Floating Emoji Animation Logic ---
function createFloatingEmojis() {
    const emojiContainer = document.querySelector('.emoji-background');
    const emojis = ['💖', '❤️', '💕', '💘', '💜', '💙', '💚', '💛', '🧡']; // Love-themed emojis
    const numberOfEmojis = 30; // Adjust as needed for density

    for (let i = 0; i < numberOfEmojis; i++) {
        const emoji = document.createElement('span');
        emoji.classList.add('emoji');
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)]; // Random emoji

        // Randomize initial position
        const startX = Math.random() * 100; // 0-100% of viewport width
        emoji.style.left = `${startX}vw`;
        
        // Randomize animation properties
        const delay = Math.random() * 6; // 0-6 seconds delay
        const duration = 6 + Math.random() * 6; // 6-12 seconds duration for floating
        const spinDuration = 3 + Math.random() * 5; // 3-8 seconds duration for spinning
        const size = 1 + Math.random() * 1.5; // 1em to 2.5em size
        const randomXOffset = (Math.random() - 0.5) * 40; // -20vw to +20vw horizontal drift

        emoji.style.setProperty('--delay', `${delay}s`);
        emoji.style.setProperty('--duration', `${duration}s`);
        emoji.style.setProperty('--spin-duration', `${spinDuration}s`);
        emoji.style.setProperty('--random-x', `${randomXOffset}vw`); // Pass random x-offset to CSS
        emoji.style.fontSize = `${size}em`;

        emojiContainer.appendChild(emoji);

        // Remove emoji after animation to prevent excessive DOM elements
        emoji.addEventListener('animationend', () => {
            emoji.remove();
            // Recreate a new emoji to keep the animation continuous
            const newEmoji = document.createElement('span');
            newEmoji.classList.add('emoji');
            newEmoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            const newStartX = Math.random() * 100;
            const newDelay = 0; // Start new emoji immediately
            const newDuration = 6 + Math.random() * 6;
            const newSpinDuration = 3 + Math.random() * 5;
            const newSize = 1 + Math.random() * 1.5;
            const newRandomXOffset = (Math.random() - 0.5) * 40;

            newEmoji.style.left = `${newStartX}vw`;
            newEmoji.style.setProperty('--delay', `${newDelay}s`);
            newEmoji.style.setProperty('--duration', `${newDuration}s`);
            newEmoji.style.setProperty('--spin-duration', `${newSpinDuration}s`);
            newEmoji.style.setProperty('--random-x', `${newRandomXOffset}vw`);
            newEmoji.style.fontSize = `${newSize}em`;

            emojiContainer.appendChild(newEmoji);
        });
    }
}
