// --- For My Hetu - Enhanced UI Script ---

// --- Theme Toggle Functionality ---
const themeToggleButton = document.getElementById('themeToggleButton');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('hetuAppTheme', theme);
    if (themeToggleButton) {
        const sunIcon = themeToggleButton.querySelector('.icon-sun');
        const moonIcon = themeToggleButton.querySelector('.icon-moon');
        if (sunIcon && moonIcon) {
            if (theme === 'dark') {
                sunIcon.style.display = 'inline-block';
                moonIcon.style.display = 'none';
                themeToggleButton.setAttribute('aria-label', 'Switch to light theme');
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'inline-block';
                themeToggleButton.setAttribute('aria-label', 'Switch to dark theme');
            }
        }
    }
    console.log(`Theme applied: ${theme}`);
}

function toggleTheme() {
    const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme initialization
    const savedTheme = localStorage.getItem('hetuAppTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDarkScheme.matches) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Default to light if no preference or saved theme
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    } else {
        console.warn("Theme toggle button not found.");
    }

    // Existing DOMContentLoaded logic
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
        // Consider showing a more user-friendly, persistent warning on the UI itself if not configured.
    }
    
    navigateToApp('homeScreen'); // Initial screen
    
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
// --- End Theme Toggle Functionality ---


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
        alert('Application not configured to save data. Please contact support.');
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
    const listContainer = document.getElementById('feelingsEntriesList');
    if (!listContainer) { console.error('"feelingsEntriesList" not found.'); navigateToFeelingsPage('feelingsPage1'); return; }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) { const errTxt = await response.text(); throw new Error(`HTTP ${response.status}: ${errTxt}`); }
        const serverData = await response.json();
        listContainer.innerHTML = '';

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const table = document.createElement('table');
            table.classList.add('feelings-table');
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            ['Date & Time', 'Emotion', 'Message', 'Response'].forEach(text => {
                const th = document.createElement('th'); th.textContent = text; headerRow.appendChild(th);
            });
            const tbody = table.createTBody();
            serverData.data.forEach(entry => {
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

                const cellMessage = row.insertCell(); cellMessage.textContent = entry.message || 'No message';
                const cellResponse = row.insertCell(); cellResponse.style.verticalAlign = 'top';

                if (entry.replyByPratham) {
                    const replyContainer = document.createElement('div'); replyContainer.classList.add('reply-display');
                    const replyTextP = document.createElement('p');
                    replyTextP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
                    replyContainer.appendChild(replyTextP);
                    if (entry.replyTimestampPratham) {
                        const replyTimeP = document.createElement('p'); replyTimeP.classList.add('reply-timestamp');
                        let formattedTs = 'Unknown time';
                        const d = new Date(entry.replyTimestampPratham);
                        if (!isNaN(d.getTime())) formattedTs = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                        else formattedTs = entry.replyTimestampPratham;
                        replyTimeP.textContent = `Replied: ${formattedTs}`;
                        replyContainer.appendChild(replyTimeP);
                    }
                    cellResponse.appendChild(replyContainer);
                } else {
                    const btn = document.createElement('button'); btn.textContent = 'Reply 💌';
                    btn.classList.add('reply-btn', 'small-reply-btn');
                    btn.onclick = function() {
                        this.disabled = true;
                        const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : "this feeling";
                        const promptMsg = `Replying to Hetu's feeling on ${dateStr}:\n"${(entry.message || '').substring(0, 100)}${(entry.message || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
                        const replyTxt = prompt(promptMsg);
                        if (replyTxt !== null) submitReply('feeling', entry.timestamp, replyTxt, this);
                        else this.disabled = false;
                    };
                    cellResponse.appendChild(btn);
                }
            });
            listContainer.appendChild(table);
        } else if (serverData.status === 'success') {
            listContainer.innerHTML = '<p>No feelings entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown error'}</p>`;
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        console.error('Failed to fetch feelings:', error);
        if (listContainer) listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// --- Hetu's Diary Functions ---
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    else console.error('Diary page not found:', pageId);
}

async function fetchDiaryEntries() {
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('scriptURL not configured. Diary entries cannot be fetched.');
        diaryEntries = {}; return; 
    }
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!response.ok) { const err = await response.text(); throw new Error(`HTTP ${response.status}: ${err}`);}
        const data = await response.json();
        if (data.status === 'success') {
            diaryEntries = {}; 
            if (data.data) data.data.forEach(entry => { diaryEntries[entry.date] = entry; });
            console.log('Diary entries loaded:', Object.keys(diaryEntries).length);
        } else { console.error('Error fetching diary entries:', data.message); diaryEntries = {}; }
    } catch (error) { console.error('Failed to fetch diary entries:', error); diaryEntries = {}; }
}

function renderCalendar(date) {
    const grid = document.getElementById('calendarGrid');
    const display = document.getElementById('currentMonthYear');
    if (!grid || !display) { console.error("Calendar elements missing."); return; }

    grid.innerHTML = '';
    const month = date.getMonth(), year = date.getFullYear();
    display.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInM = new Date(year, month + 1, 0).getDate();
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
        const header = document.createElement('div'); header.classList.add('calendar-day-header');
        header.textContent = d; grid.appendChild(header);
    });
    for (let i = 0; i < firstDay; i++) { const cell = document.createElement('div'); cell.classList.add('calendar-day', 'empty'); grid.appendChild(cell); }

    const today = new Date();
    const tY = today.getFullYear(), tM = today.getMonth(), tD = today.getDate();
    for (let day = 1; day <= daysInM; day++) {
        const cell = document.createElement('div'); cell.classList.add('calendar-day');
        cell.textContent = day;
        const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cell.dataset.date = cellDateStr;
        if (year === tY && month === tM && day === tD) cell.classList.add('today');
        if (diaryEntries[cellDateStr]) { cell.classList.add('has-entry'); cell.title = 'Entry exists'; }
        cell.addEventListener('click', () => {
            if (diaryEntries[cell.dataset.date]) viewDiaryEntry(cell.dataset.date);
            else openDiaryEntry(cell.dataset.date);
        });
        grid.appendChild(cell);
    }
}

function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    const parts = dateString.split('-');
    if (parts.length !== 3) { alert('Invalid date: ' + dateString); return; }
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) { alert('Invalid date: ' + dateString); return; }
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('diaryDateDisplay').textContent = d.toLocaleDateString('en-US', opts);
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) { 
        console.warn('No cached entry for:', dateString); 
        openDiaryEntry(dateString); // Fallback to create
        return; 
    }
    const parts = dateString.split('-');
    if (parts.length !== 3) { alert('Invalid date format: ' + dateString); return; }
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) { alert('Invalid date: ' + dateString); return; }
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('viewDiaryDateDisplay').textContent = d.toLocaleDateString('en-US', opts);
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';

    const replyContainerEl = document.getElementById('diaryViewPageReplySection');
    if (replyContainerEl) {
        replyContainerEl.innerHTML = '';
        if (entry.replyByPratham) {
            const disp = document.createElement('div'); disp.classList.add('reply-display');
            const txtP = document.createElement('p'); txtP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
            disp.appendChild(txtP);
            if (entry.replyTimestampPratham) {
                const timeP = document.createElement('p'); timeP.classList.add('reply-timestamp');
                let fTs = 'Unknown time'; const tsD = new Date(entry.replyTimestampPratham);
                if (!isNaN(tsD.getTime())) fTs = tsD.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                else fTs = entry.replyTimestampPratham;
                timeP.textContent = `Replied: ${fTs}`; disp.appendChild(timeP);
            }
            replyContainerEl.appendChild(disp);
        } else {
            const btn = document.createElement('button'); btn.textContent = 'Reply 💌'; btn.classList.add('reply-btn');
            btn.onclick = function() {
                this.disabled = true;
                const dispDate = document.getElementById('viewDiaryDateDisplay').textContent || entry.date;
                const pMsg = `Replying to Hetu's diary for ${dispDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
                const rTxt = prompt(pMsg);
                if (rTxt !== null) submitReply('diary', dateString, rTxt, this);
                else this.disabled = false;
            };
            replyContainerEl.appendChild(btn);
        }
    } else { console.error("diaryViewPageReplySection not found."); }
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;
    if (!date) { alert('No date selected.'); return; }
    if (!thoughts) { alert('Please write your thoughts.'); return; }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Application not configured to save data.'); return;
    }
    const formData = new FormData();
    formData.append('formType', 'diaryEntry'); formData.append('date', date); formData.append('thoughts', thoughts);
    const btn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalTxt = btn.textContent; btn.textContent = 'Saving...'; btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
    .then(res => { if (!res.ok) return res.text().then(t => { throw new Error(`HTTP ${res.status}: ${t}`); }); return res.json(); })
    .then(data => {
        if (data.status === 'error') throw new Error(data.message || 'Server error.');
        return fetchDiaryEntries().then(() => {
             renderCalendar(calendarCurrentDate);
             navigateToDiaryPage('diaryConfirmationPage');
        });
    })
    .catch(err => { console.error('Diary Entry Error:', err); alert('Error saving diary: ' + err.message); })
    .finally(() => { if (btn) { btn.textContent = originalTxt; btn.disabled = false; } });
}

async function fetchAndDisplayAllDiaryEntries() {
    const listCont = document.getElementById('allDiaryEntriesList');
    if (!listCont) { console.error("allDiaryEntriesList not found."); return; }
    listCont.innerHTML = '<p>Loading entries...</p>';
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        listCont.innerHTML = '<p>Error: scriptURL not configured.</p>'; return;
    }
    try {
        const res = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        if (!res.ok) { const errT = await res.text(); throw new Error(`HTTP ${res.status}: ${errT}`); }
        const serverData = await res.json();
        listCont.innerHTML = '';
        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const sorted = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            sorted.forEach(entry => {
                const entryDiv = document.createElement('div'); entryDiv.classList.add('diary-entry-list-item');
                let fDate = 'Unknown Date';
                if (entry.date) {
                    const dObj = new Date(entry.date + "T00:00:00");
                     if (!isNaN(dObj.getTime())) fDate = dObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    else fDate = `Invalid: ${entry.date}`;
                }
                entryDiv.innerHTML = `<h3>${fDate}</h3><p>${entry.thoughts || 'No thoughts.'}</p>`;
                const replySect = document.createElement('div'); replySect.classList.add('entry-reply-section');
                if (entry.replyByPratham) {
                    const rCont = document.createElement('div'); rCont.classList.add('reply-display');
                    const rTxtP = document.createElement('p'); rTxtP.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.replyByPratham}`;
                    rCont.appendChild(rTxtP);
                    if (entry.replyTimestampPratham) {
                        const rTimeP = document.createElement('p'); rTimeP.classList.add('reply-timestamp');
                        let fRts = 'Unknown time'; const rtsD = new Date(entry.replyTimestampPratham);
                        if (!isNaN(rtsD.getTime())) fRts = rtsD.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                        else fRts = entry.replyTimestampPratham;
                        rTimeP.textContent = `Replied: ${fRts}`; rCont.appendChild(rTimeP);
                    }
                    replySect.appendChild(rCont);
                } else {
                    const rBtn = document.createElement('button'); rBtn.textContent = 'Reply 💌';
                    rBtn.classList.add('reply-btn', 'small-reply-btn');
                    rBtn.onclick = function(ev) {
                        ev.stopPropagation(); this.disabled = true;
                        const pM = `Replying to Hetu's diary for ${fDate}:\n"${(entry.thoughts || '').substring(0, 100)}${(entry.thoughts || '').length > 100 ? "..." : ""}"\n\nYour reply:`;
                        const rT = prompt(pM);
                        if (rT !== null) submitReply('diary', entry.date, rT, this);
                        else this.disabled = false;
                    };
                    replySect.appendChild(rBtn);
                }
                entryDiv.appendChild(replySect);
                entryDiv.appendChild(document.createElement('hr'));
                listCont.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success') {
            listCont.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else { listCont.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown error'}</p>`; }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (err) {
        console.error('Failed to fetch all diary entries:', err);
        if (listCont) listCont.innerHTML = `<p>Error loading entries: ${err.message}</p>`;
    }
}

async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!replyMessage || replyMessage.trim() === "") {
        alert("Reply cannot be empty.");
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌'; }
        return;
    }
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        alert('Application not configured to save data.');
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Reply 💌';}
        return;
    }
    const formData = new FormData();
    formData.append('formType', 'replyEntry'); formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier); formData.append('replyMessage', replyMessage.trim());
    const originalBtnTxt = buttonElement ? buttonElement.textContent : 'Reply 💌';
    if (buttonElement) { buttonElement.textContent = 'Replying...'; buttonElement.disabled = true; }

    try {
        const res = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        if (!res.ok) { const txt = await res.text(); throw new Error(`HTTP ${res.status}: ${txt}`); }
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message || `Server error saving reply.`);
        alert('Reply submitted successfully! Hetu has been notified.');
        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries(); 
        } else if (entryType === 'diary') {
            await fetchDiaryEntries(); 
            renderCalendar(calendarCurrentDate); 
            if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                fetchAndDisplayAllDiaryEntries();
            }
            const diaryViewActive = document.getElementById('diaryViewPage').classList.contains('active');
            if (diaryViewActive && diaryEntries[entryIdentifier]) { 
                 viewDiaryEntry(entryIdentifier); 
            }
        }
    } catch (error) {
        console.error('Reply Submission Error!', error);
        alert('Error submitting reply.\n' + error.message);
        if (buttonElement) { buttonElement.textContent = originalBtnTxt; buttonElement.disabled = false; }
    }
}
