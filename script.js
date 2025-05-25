// --- FULLY FIXED script.js ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // <<< REPLACE WITH YOUR NEW URL!
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

    // Reset to first page when entering a portal
    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1', true); // Pass true to reset form
    } else if (screenId === 'diaryScreen') {
        navigateToDiaryPage('diaryCalendarPage');
        renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
        fetchDiaryEntries(); // Fetch fresh entries when entering diary portal
    }
}

// --- Feelings Portal Navigation & Logic ---
function navigateToFeelingsPage(pageId, resetForm = false) {
    feelingsPages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (resetForm && pageId === 'feelingsPage1') {
        document.getElementById('feelingsMessage').value = ''; // Clear message
        currentEmotion = ''; // Clear selected emotion
    } else if (pageId === 'feelingsPage2') {
        document.getElementById('feelingsMessage').focus();
    }
}

function selectEmotion(emotion) {
    currentEmotion = emotion;
    document.getElementById('selectedEmotionDisplay').textContent = emotion;
    navigateToFeelingsPage('feelingsPage2');
}

async function submitFeelings() {
    const message = document.getElementById('feelingsMessage').value.trim();

    if (!currentEmotion) {
        alert('Please select an emotion first!');
        return;
    }

    const formData = new URLSearchParams();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData,
            // Google Apps Script expects application/x-www-form-urlencoded for e.parameter
            // For JSON parsing (e.postData.contents) you would set 'Content-Type': 'application/json'
            // and `body: JSON.stringify({type: 'feeling', emotion: currentEmotion, message: message})`
        });

        const result = await response.json();
        console.log('Feelings submission result:', result);

        if (result.status === 'success') {
            navigateToFeelingsPage('feelingsConfirmationPage');
            // Animate mail icon and message box
            const mailIcon = document.getElementById('feelings-mail-icon');
            const messageBox = document.getElementById('feelings-message-box');
            mailIcon.style.transform = 'translateY(0) scale(1)';
            messageBox.style.opacity = '0';
            setTimeout(() => {
                mailIcon.style.transform = 'translateY(-20px) scale(1.2)';
                messageBox.style.opacity = '1';
                messageBox.textContent = 'Sent!'; // Ensure text is correct
            }, 100); // Small delay for initial animation
            setTimeout(() => {
                mailIcon.style.transform = 'translateY(0) scale(1)';
            }, 1000); // Reset after animation
        } else {
            alert('Error submitting feelings: ' + (result.message || 'Unknown error.'));
            console.error('Submission error:', result.message);
        }
    } catch (error) {
        console.error('Network or script error:', error);
        alert('Could not submit feelings. Please try again later.');
    }
}

// --- Diary Portal Navigation & Logic ---
function navigateToDiaryPage(pageId, resetForm = false) {
    diaryPages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'diaryCalendarPage') {
        renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
        fetchDiaryEntries(); // Refresh entries when going back to calendar
    } else if (pageId === 'diaryEntryPage' && resetForm) {
        document.getElementById('diaryThoughts').value = '';
        document.getElementById('diaryEntryTitle').textContent = `Diary for ${new Date(document.getElementById('selectedDate').value).toLocaleDateString('en-US', { month: 'long', day: 'numeric'})}`;
        document.getElementById('diaryThoughts').focus();
    }
}

function renderCalendar(year, month) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = ''; // Clear previous days

    const firstDay = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get last day of month

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        dayCell.dataset.date = dateString;

        if (diaryEntries[dateString]) {
            dayCell.classList.add('has-entry');
        }

        dayCell.addEventListener('click', () => {
            if (diaryEntries[dateString]) {
                // If an entry exists, view it
                viewDiaryEntry(dayCell.dataset.date);
            } else {
                // Otherwise, open a new entry form
                openDiaryEntry(dayCell.dataset.date);
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}

function changeMonth(delta) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
    renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth());
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
    })}`; // Simplified title
    
    // Pre-fill if existing entry
    const existingEntry = diaryEntries[dateString];
    if (existingEntry) {
        document.getElementById('diaryThoughts').value = existingEntry.thoughts;
    } else {
        document.getElementById('diaryThoughts').value = '';
    }

    navigateToDiaryPage('diaryEntryPage');
    document.getElementById('diaryThoughts').focus(); // Focus on textarea
}

async function submitDiaryEntry() {
    const date = document.getElementById('selectedDate').value;
    const thoughts = document.getElementById('diaryThoughts').value.trim();

    if (!date) {
        alert('Date not selected!');
        return;
    }
    if (!thoughts) {
        alert('Please write your thoughts for the day!');
        return;
    }

    const formData = new URLSearchParams();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('Diary submission result:', result);

        if (result.status === 'success') {
            // Update local diaryEntries cache
            diaryEntries[date] = {
                date: date,
                thoughts: thoughts,
                created: result.data.created // Get the formatted created timestamp from backend
            };
            renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth()); // Re-render calendar to show new entry
            navigateToDiaryPage('diaryConfirmationPage');
             // Animate mail icon and message box
            const mailIcon = document.getElementById('feelings-mail-icon'); // Re-using feelings animation
            const messageBox = document.getElementById('feelings-message-box'); // Re-using feelings animation
            mailIcon.style.transform = 'translateY(0) scale(1)';
            messageBox.style.opacity = '0';
            setTimeout(() => {
                mailIcon.style.transform = 'translateY(-20px) scale(1.2)';
                messageBox.style.opacity = '1';
                messageBox.textContent = 'Saved!'; // Ensure text is correct
            }, 100); // Small delay for initial animation
            setTimeout(() => {
                mailIcon.style.transform = 'translateY(0) scale(1)';
            }, 1000); // Reset after animation

        } else {
            alert('Error submitting diary entry: ' + (result.message || 'Unknown error.'));
            console.error('Submission error:', result.message);
        }
    } catch (error) {
        console.error('Network or script error:', error);
        alert('Could not submit diary entry. Please try again later.');
    }
}

async function fetchDiaryEntries() {
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        const result = await response.json();
        console.log('Fetched diary entries:', result);

        if (result.status === 'success' && result.data) {
            diaryEntries = {}; // Clear existing
            result.data.forEach(entry => {
                diaryEntries[entry.date] = entry;
            });
            renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth()); // Re-render calendar to show new entries
        } else {
            console.error('Failed to fetch diary entries:', result.message);
        }
    } catch (error) {
        console.error('Error fetching diary entries:', error);
    }
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) {
        alert('No entry found for this date.');
        return;
    }

    const dateParts = dateString.split('-');
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('viewDiaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    })}`;
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts;

    navigateToDiaryPage('viewDiaryEntryPage');
}


async function fetchAndDisplayAllDiaryEntries() {
    const entriesListDiv = document.getElementById('allDiaryEntriesList');
    entriesListDiv.innerHTML = '<p>Loading entries...</p>'; // Show loading

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.length > 0) {
            entriesListDiv.innerHTML = ''; // Clear loading message
            // Sort by date (newest first) for display
            result.data.sort((a, b) => new Date(b.date) - new Date(a.date));

            result.data.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-item');
                // Format date for display
                const displayDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { // Add T00:00:00 to avoid timezone issues
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                entryDiv.innerHTML = `
                    <h3>${displayDate}</h3>
                    <p>${entry.thoughts}</p>
                    <small>Created/Updated: ${entry.created}</small>
                `;
                entriesListDiv.appendChild(entryDiv);
            });
        } else {
            entriesListDiv.innerHTML = '<p>No diary entries found yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching and displaying all diary entries:', error);
        entriesListDiv.innerHTML = '<p>Failed to load entries. Please try again.</p>';
    }
}


// Initial setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    navigateToApp('homeScreen'); // Start on home screen
    renderCalendar(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth()); // Initialize calendar
    fetchDiaryEntries(); // Fetch entries on load
    // Attach event listener for "View All Entries" button dynamically if not done in HTML
    document.querySelector('#diaryCalendarPage button[onclick="navigateToDiaryPage(\'allDiaryEntriesPage\')"]').addEventListener('click', fetchAndDisplayAllDiaryEntries);
});

// Test if JavaScript is working - also in HTML, but good to have here
console.log('script.js loaded and executing!');
