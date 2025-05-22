const scriptURL = 'https://script.google.com/macros/s/AKfycbzH4whliZSRjcTeoA_8UQAzM9OmtNohfqiQKmeoJZWXa_xQOHg_e11bTRavjcjZqtzn/exec'; // Your actual script URL
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentEmotion = '';
let currentDiaryDate = null; // For storing the selected date for a diary entry
let calendarCurrentDate = new Date(); // For calendar navigation
let diaryEntries = {}; // To store fetched diary entries { 'YYYY-MM-DD': { thoughts: '', photoLink: '', videoLink: '' } }

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
    }
}

function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();
    if (!message) {
        alert('Please enter your thoughts.');
        return;
    }

    const timestamp = new Date().toISOString();
    const formData = new FormData();
    formData.append('formType', 'feelingsEntry'); // Differentiator for Apps Script
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('timestamp', timestamp);

    const submitBtn = document.getElementById('submitFeelingsBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
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

// NEW: Function to fetch all feelings entries
async function fetchAndDisplayFeelingsEntries() {
    console.log('Fetching feelings entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const feelingsList = document.getElementById('feelingsEntriesList');
        feelingsList.innerHTML = ''; // Clear previous entries

        if (data.status === 'success' && data.data.length > 0) {
            data.data.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('feelings-entry-item'); // Add a class for styling
                const timestamp = new Date(entry.timestamp).toLocaleString();
                entryDiv.innerHTML = `
                    <p><strong>Timestamp:</strong> ${timestamp}</p>
                    <p><strong>Emotion:</strong> <span class="emotion-tag ${entry.emotion.toLowerCase()}">${entry.emotion}</span></p>
                    <p><strong>Message:</strong> ${entry.message}</p>
                    <hr>
                `;
                feelingsList.appendChild(entryDiv);
            });
        } else {
            feelingsList.innerHTML = '<p>No feelings entries recorded yet.</p>';
        }
        navigateToFeelingsPage('feelingsViewEntriesPage'); // Navigate to the view page
    } catch (error) {
        console.error('Failed to fetch feelings entries:', error);
        alert('There was an error loading past feelings entries. Please try again later.\n' + error.message);
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
            diaryEntries = {}; // Clear previous entries
            data.data.forEach(entry => {
                diaryEntries[entry.date] = entry; // Store by date
            });
            console.log('Diary entries fetched:', diaryEntries);
        } else {
            console.error('Error fetching diary entries:', data.message);
            // alert('Could not load past diary entries: ' + data.message); // Commented to not show alert on every calendar load
        }
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
        // alert('There was an error loading past diary entries. Please try again later.\n' + error.message);
    }
}

function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) return;

    calendarGrid.innerHTML = ''; // Clear previous calendar
    const month = date.getMonth();
    const year = date.getFullYear();

    monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon,...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add day headers
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeaderEl = document.createElement('div');
        dayHeaderEl.classList.add('calendar-day-header');
        dayHeaderEl.textContent = day;
        calendarGrid.appendChild(dayHeaderEl);
    });

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Add day cells
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        const cellDate = new Date(year, month, day);
        const formattedCellDate = cellDate.toISOString().split('T')[0]; // YYYY-MM-DD
        dayCell.dataset.date = formattedCellDate;

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('today');
        }

        // Mark dates with entries
        if (diaryEntries[formattedCellDate]) {
            dayCell.classList.add('has-entry');
            dayCell.title = 'Diary entry exists for this date.'; // Add tooltip
        }

        dayCell.addEventListener('click', () => {
            if (diaryEntries[formattedCellDate]) {
                viewDiaryEntry(formattedCellDate); // View existing entry
            } else {
                openDiaryEntry(formattedCellDate); // Create new entry
            }
        });
        calendarGrid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateString) {
    currentDiaryDate = dateString;
    document.getElementById('selectedDate').value = dateString;
    const dateObj = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing for display
    document.getElementById('diaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    
    // Clear previous entry fields
    document.getElementById('diaryThoughts').value = '';
    document.getElementById('diaryPhoto').value = null;
    document.getElementById('diaryVideo').value = null;
    
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) {
        alert('No entry found for this date.');
        return;
    }

    const dateObj = new Date(dateString + 'T00:00:00');
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts recorded.';
    
    const viewPhotoContainer = document.getElementById('viewDiaryPhotoContainer');
    const viewVideoContainer = document.getElementById('viewDiaryVideoContainer');
    viewPhotoContainer.innerHTML = '';
    viewVideoContainer.innerHTML = '';

    if (entry.photoLink) {
        const img = document.createElement('img');
        img.src = entry.photoLink;
        img.alt = 'Diary Photo';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px'; // Limit height for display
        img.style.display = 'block';
        img.style.margin = '10px auto';
        viewPhotoContainer.appendChild(img);
    } else {
        viewPhotoContainer.textContent = 'No photo uploaded.';
    }

    if (entry.videoLink) {
        const video = document.createElement('video');
        video.src = entry.videoLink;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '200px'; // Limit height for display
        video.style.display = 'block';
        video.style.margin = '10px auto';
        viewVideoContainer.appendChild(video);
    } else {
        viewVideoContainer.textContent = 'No video uploaded.';
    }

    navigateToDiaryPage('diaryViewPage');
}


function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const photoFile = document.getElementById('diaryPhoto').files[0];
    const videoFile = document.getElementById('diaryVideo').files[0];
    const date = document.getElementById('selectedDate').value;

    if (!date) {
        alert('No date selected for the diary entry.');
        return;
    }
    if (!thoughts && !photoFile && !videoFile) {
        alert('Please write some thoughts or upload a photo/video for your diary entry.');
        return;
    }

    const timestamp = new Date().toISOString();
    const formData = new FormData();
    formData.append('formType', 'diaryEntry'); // Differentiator for Apps Script
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('timestamp', timestamp);

    if (photoFile) {
        formData.append('photo', photoFile, photoFile.name);
    }
    if (videoFile) {
        formData.append('video', videoFile, videoFile.name);
    }
    
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
             if (data.status === 'error') { // Check for server-side error in JSON response
                throw new Error(data.message || 'Unknown error from server.');
            }
            // After successful submission, re-fetch entries and re-render calendar
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
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

// NEW: Function to fetch all diary entries and display them in a list
async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries...');
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`); // Re-using getDiaryEntries action
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allDiaryEntriesList = document.getElementById('allDiaryEntriesList');
        allDiaryEntriesList.innerHTML = ''; // Clear previous entries

        if (data.status === 'success' && data.data.length > 0) {
            // Sort entries by date, newest first
            data.data.sort((a, b) => new Date(b.date) - new Date(a.date));

            data.data.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item'); // Add a class for styling
                const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                let mediaContent = '';
                if (entry.photoLink) {
                    mediaContent += `<img src="${entry.photoLink}" alt="Photo" style="max-width:100%; height:auto; display:block; margin: 5px 0;">`;
                }
                if (entry.videoLink) {
                    mediaContent += `<video controls src="${entry.videoLink}" style="max-width:100%; height:auto; display:block; margin: 5px 0;"></video>`;
                }

                entryDiv.innerHTML = `
                    <h3>${formattedDate}</h3>
                    <p>${entry.thoughts || 'No thoughts recorded.'}</p>
                    ${mediaContent}
                    <hr>
                `;
                allDiaryEntriesList.appendChild(entryDiv);
            });
        } else {
            allDiaryEntriesList.innerHTML = '<p>No diary entries recorded yet.</p>';
        }
        navigateToDiaryPage('allDiaryEntriesPage'); // Navigate to the view all diary entries page
    } catch (error) {
        console.error('Failed to fetch all diary entries:', error);
        alert('There was an error loading all past diary entries. Please try again later.\n' + error.message);
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    navigateToApp('homeScreen'); // Start at the new home screen

    // Calendar controls
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate)); // Fetch and render
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate)); // Fetch and render
        });
    }
});
