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
    if (!entry) return alert('No entry for ' + dateString);

    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) return alert('Invalid date for view: ' + dateString);

    const dateObj = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    if (isNaN(dateObj)) return alert('Invalid date object for view: ' + dateString);

    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;
    if (!date || !thoughts) return alert('Please select a date and write your thoughts.');

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(res => res.ok ? res.json() : res.text().then(t => { throw new Error(`HTTP ${res.status}: ${t}`); }))
        .then(data => {
            if (data.status === 'error') throw new Error(data.message || 'Server error.');
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
                navigateToDiaryPage('diaryConfirmationPage');
            });
        })
        .catch(err => alert('Error: ' + err.message))
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function navigateToDiaryPage(pageId) {
    diaryPages.forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    const date = new Date(dateString);
    if (isNaN(date)) return alert('Invalid date.');

    document.getElementById('diaryDateDisplay').textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

async function fetchDiaryEntries() {
    try {
        const res = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
            diaryEntries = {};
            data.data.forEach(e => diaryEntries[e.date] = e);
        }
    } catch (e) {
        console.error('Failed to fetch diary entries:', e);
    }
}

function renderCalendar(date) {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('currentMonthYear');
    if (!grid || !label) return;

    grid.innerHTML = '';
    const month = date.getMonth(), year = date.getFullYear();
    label.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
    const start = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(d => {
        const el = document.createElement('div');
        el.classList.add('calendar-day-header');
        el.textContent = d;
        grid.appendChild(el);
    });

    for (let i = 0; i < start; i++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-day', 'empty');
        grid.appendChild(cell);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= days; d++) {
        const cell = document.createElement('div');
        const cellDate = new Date(year, month, d);
        const key = cellDate.toISOString().split('T')[0];
        cell.classList.add('calendar-day');
        cell.textContent = d;
        cell.dataset.date = key;

        if (cellDate.getTime() === today.getTime()) cell.classList.add('today');
        if (diaryEntries[key]) cell.classList.add('has-entry');

        cell.addEventListener('click', () => {
            if (diaryEntries[key]) viewDiaryEntry(key);
            else openDiaryEntry(key);
        });

        grid.appendChild(cell);
    }
}

function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    currentEmotion = emotion;
    if (pageId === 'feelingsPage2' && emotion) {
        const heading = document.querySelector('#feelingsPage2 h2');
        if (heading) heading.textContent = `You selected: ${emotion}. Please let me know your thoughts.`;
    }
    if (pageId === 'feelingsPage3') {
        const box = document.getElementById('feelings-message-box');
        const input = document.getElementById('feelingsMessage');
        if (box && input) box.textContent = input.value.substring(0, 20) + '...';
    }
}

function submitFeelingsEntry() {
    const message = document.getElementById('feelingsMessage').value.trim();
    if (!message) return alert('Please enter your thoughts.');

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);

    const btn = document.getElementById('submitFeelingsBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(res => res.ok ? res.json() : res.text().then(t => { throw new Error(`HTTP ${res.status}: ${t}`); }))
        .then(data => {
            if (data.status === 'error') throw new Error(data.message || 'Unknown server error.');
            navigateToFeelingsPage('feelingsPage3');
            document.getElementById('feelingsMessage').value = '';
        })
        .catch(err => alert('Error: ' + err.message))
        .finally(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        });
}

// ✅ This was the issue: it must be outside the DOMContentLoaded block
function navigateToApp(screenId) {
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

// --- Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready.');
    navigateToApp('homeScreen');

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    });
});

