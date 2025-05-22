const scriptURL = 'https://script.google.com/macros/s/AKfycbw11-sZBdkaxqiKzKeLtkOBs5KZaABiz2BkEIsUTI2a2TGRUDXLFhb-GEKPZqEd0eEREQ/exec'; // Same script URL
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

let currentEmotion = '';
let currentDiaryDate = null; // For storing the selected date for a diary entry
let calendarCurrentDate = new Date(); // For calendar navigation

// --- Main Navigation ---
function navigateToApp(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'feelingsPortalScreen') {
        navigateToFeelingsPage('feelingsPage1'); // Default to first feelings page
    } else if (screenId === 'diaryScreen') {
        renderCalendar(calendarCurrentDate);
        navigateToDiaryPage('diaryCalendarPage'); // Default to calendar page
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

    // Show loading state (optional)
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
        dayCell.dataset.date = cellDate.toISOString().split('T')[0];

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('today');
        }

        dayCell.addEventListener('click', () => {
            openDiaryEntry(dayCell.dataset.date);
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
            navigateToDiaryPage('diaryConfirmationPage');
            // Optionally, mark date on calendar if you implement read functionality later
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


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    navigateToApp('homeScreen'); // Start at the new home screen

    // Calendar controls
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            renderCalendar(calendarCurrentDate);
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            renderCalendar(calendarCurrentDate);
        });
    }
});
