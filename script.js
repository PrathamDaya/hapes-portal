// ===== GLOBAL CONFIGURATION =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// Application State
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let periodCalendarDate = new Date();
let diaryEntries = {};
let periodData = [];
let usedDares = [];
let selectedMood = null;

// Games state
let memoryMoves = 0;
let memoryFlipped = [];
let memoryLock = false;
let memHighScore = 0;

let catchScore = 0;
let catchGameRunning = false;
let catchLoopId = null;

let slasherScore = 0;
let slasherGameRunning = false;
let slasherLoopId = null;

let gameHighScores = {
    memory: 0,
    catch: 0,
    slasher: 0
};

// ===== TIMELINE DATA =====
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData')) || [
    { date: "2023-01-01", title: "Where it began", img: "assets/Timeline/1.jpg", desc: "The start of us." },
    { date: "2023-02-14", title: "Valentine's", img: "assets/Timeline/2.jpg", desc: "Our first Valentine’s Day together." }
];

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';

    timelineData.sort((a, b) => new Date(b.date) - new Date(a.date));

    timelineData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'polaroid-card';

        const rotation = Math.random() * 6 - 3;
        card.style.setProperty('--rotation', `${rotation}deg`);

        const imgContainer = document.createElement('div');
        imgContainer.className = 'polaroid-img-container';

        const img = document.createElement('img');
        img.src = item.img;
        img.onerror = function () { this.src = 'assets/Timeline/1.jpg'; };

        imgContainer.appendChild(img);

        const dateEl = document.createElement('div');
        dateEl.className = 'timeline-date';
        const dateObj = new Date(item.date);
        dateEl.textContent = isNaN(dateObj)
            ? item.date
            : dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

        const titleEl = document.createElement('div');
        titleEl.className = 'timeline-title';
        titleEl.textContent = item.title;

        card.appendChild(imgContainer);
        card.appendChild(dateEl);
        card.appendChild(titleEl);

        card.onclick = () => openMemoryModal(item);
        container.appendChild(card);
    });
}

function openAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.style.display = 'none';
}

function saveNewMemory() {
    const title = document.getElementById('newMemTitle').value.trim();
    const date = document.getElementById('newMemDate').value;
    const imgNum = document.getElementById('newMemImgNum').value.trim();
    const desc = document.getElementById('newMemDesc').value.trim();

    if (!title || !date || !imgNum) {
        showCustomPopup("Error", "Please fill in Title, Date, and Image Number.");
        return;
    }

    const newEntry = {
        title,
        date,
        img: `assets/Timeline/${imgNum}.jpg`,
        desc
    };

    timelineData.push(newEntry);
    localStorage.setItem('hetuTimelineData', JSON.stringify(timelineData));
    renderTimeline();
    closeAddMemoryModal();

    document.getElementById('newMemTitle').value = '';
    document.getElementById('newMemDate').value = '';
    document.getElementById('newMemImgNum').value = '';
    document.getElementById('newMemDesc').value = '';
}

function openMemoryModal(item) {
    const modal = document.getElementById('memoryModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalImg').src = item.img;
    document.getElementById('modalDesc').textContent = item.desc || "No description available.";
    modal.style.display = 'flex';
}

function closeMemoryModal() {
    const modal = document.getElementById('memoryModal');
    if (modal) modal.style.display = 'none';
}

// ===== FEELINGS PORTAL =====
function navigateToFeelingsPage(pageId, emotion = '') {
    document.querySelectorAll('#feelingsPortalScreen .page')
        .forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        if (emotion) currentEmotion = emotion;

        if (pageId === 'feelingsPage2' && currentEmotion) {
            const heading = document.querySelector('#feelingsPage2 h2');
            if (heading) {
                heading.textContent = `You selected: ${currentEmotion}. ${currentUser}, please let me know your thoughts.`;
            }
        }
    }
}

function submitFeelingsEntry() {
    if (!currentUser) return;

    const message = document.getElementById('feelingsMessage').value.trim();
    if (!currentEmotion || !message) {
        showCustomPopup('Incomplete', 'Please select an emotion and write your thoughts.');
        return;
    }

    const submitBtn = document.getElementById('submitFeelingsBtn');
    releaseButterflies(submitBtn);

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('feelingsMessage').value = '';
                navigateToFeelingsPage('feelingsPage3');
                showCustomPopup('Success', 'Your feelings have been recorded! 💌');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showCustomPopup('Error', 'Failed to submit feelings: ' + error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Entry';
        });
}

async function fetchAndDisplayFeelingsEntries() {
    if (!currentUser) return;

    const listContainer = document.getElementById('feelingsEntriesList');
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        const serverData = await response.json();

        if (serverData.status === 'success' && serverData.data?.length > 0) {
            listContainer.innerHTML = '';

            const table = document.createElement('table');
            table.className = 'feelings-table';

            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            ['Date & Time', 'Entry By', 'Emotion', 'Message', 'Response'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            const tbody = table.createTBody();
            serverData.data.forEach(entry => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                    <td><strong>${entry.submittedBy || 'Unknown'}</strong></td>
                    <td><span class="emotion-tag ${entry.emotion?.toLowerCase()}">${entry.emotion || 'N/A'}</span></td>
                    <td>${entry.message || 'No message'}</td>
                    <td id="response-${entry.timestamp}"></td>
                `;

                const responseCell = row.cells[4];
                if (entry.repliedBy && entry.replyMessage) {
                    responseCell.innerHTML = `
                        <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                            <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
                            <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                        </div>
                    `;
                } else {
                    const replyBtn = document.createElement('button');
                    replyBtn.textContent = 'Reply 📮';
                    replyBtn.className = 'reply-btn small-reply-btn';
                    replyBtn.onclick = () => showCustomPopup(
                        `Reply to ${entry.submittedBy}`,
                        `Original message: "${entry.message}"\n\nYour reply:`,
                        'Write your reply here.',
                        (replyText) => {
                            if (replyText) submitReply('feeling', entry.timestamp, replyText, replyBtn);
                        }
                    );
                    responseCell.appendChild(replyBtn);
                }
            });

            listContainer.appendChild(table);
        } else {
            listContainer.innerHTML = '<p>No feelings entries yet.</p>';
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch (error) {
        listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// ===== DIARY FUNCTIONS =====
function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
}

async function fetchDiaryEntries() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        const data = await response.json();
        diaryEntries = {};
        if (data.status === 'success' && data.data) {
            data.data.forEach(entry => diaryEntries[entry.date] = entry);
        }
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
    }
}

function renderCalendar(date) {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');

    if (!grid || !monthYear) return;

    grid.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();
    monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = dateStr;

        if (dateStr === today.toISOString().split('T')[0]) {
            dayCell.classList.add('today');
        }
        if (diaryEntries[dateStr]) {
            dayCell.classList.add('has-entry');
        }

        dayCell.addEventListener('click', () => {
            if (diaryEntries[dateStr]) {
                viewDiaryEntry(dateStr);
            } else {
                openDiaryEntry(dateStr);
            }
        });

        grid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateStr) {
    document.getElementById('selectedDate').value = dateStr;
    navigateToDiaryPage('diaryEntryPage');
}

function submitDiaryEntry() {
    if (!currentUser) return;

    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;

    if (!thoughts) {
        showCustomPopup('Incomplete', 'Please write your thoughts.');
        return;
    }

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    releaseButterflies(submitBtn);

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                return fetchDiaryEntries().then(() => {
                    renderCalendar(calendarCurrentDate);
                    navigateToDiaryPage('diaryConfirmationPage');
                    showCustomPopup('Success', 'Diary entry saved! 📝');
                });
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showCustomPopup('Error', 'Failed to save diary: ' + error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Entry';
        });
}

function viewDiaryEntry(dateStr) {
    const entry = diaryEntries[dateStr];
    if (!entry) return;

    document.getElementById('diaryViewDate').textContent = new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('diaryViewContent').textContent = entry.thoughts || 'No thoughts.';

    const replyContainer = document.getElementById('diaryViewReplyContainer');
    replyContainer.innerHTML = '';

    if (entry.repliedBy && entry.replyMessage) {
        replyContainer.innerHTML = `
            <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
                <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
            </div>
        `;
    } else {
        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Reply 📮';
        replyBtn.className = 'reply-btn small-reply-btn';
        replyBtn.onclick = () => showCustomPopup(
            'Reply to Entry',
            `Entry: "${entry.thoughts}"\n\nYour reply:`,
            'Write your reply.',
            (replyText) => {
                if (replyText) submitReply('diary', entry.date, replyText, replyBtn);
            }
        );
        replyContainer.appendChild(replyBtn);
    }

    navigateToDiaryPage('diaryViewPage');
}

async function fetchAndDisplayAllDiaryEntries() {
    if (!currentUser) return;

    const listContainer = document.getElementById('allDiaryEntriesList');
    listContainer.innerHTML = '<p>Loading entries.</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, { method: 'GET', mode: 'cors' });
        const serverData = await response.json();

        if (serverData.status === 'success' && serverData.data?.length > 0) {
            listContainer.innerHTML = '';
            serverData.data
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .forEach(entry => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'diary-entry-list-item';

                    const dateObj = new Date(entry.date);
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    entryDiv.innerHTML = `
                        <h3>${formattedDate}</h3>
                        <div class="entry-meta-info ${entry.submittedBy?.toLowerCase()}-entry">
                            <strong>${entry.submittedBy || 'Unknown User'}</strong> made a new entry:
                        </div>
                        <p class="entry-content">${entry.thoughts || 'No thoughts.'}</p>
                    `;

                    if (entry.repliedBy && entry.replyMessage) {
                        entryDiv.innerHTML += `
                            <div class="reply-display ${entry.repliedBy.toLowerCase()}-reply">
                                <p><strong>${entry.repliedBy} Replied:</strong> ${entry.replyMessage}</p>
                                <p class="reply-timestamp">Replied: ${new Date(entry.replyTimestamp).toLocaleString()}</p>
                            </div>
                        `;
                    } else {
                        const replyBtn = document.createElement('button');
                        replyBtn.textContent = 'Reply 📮';
                        replyBtn.className = 'reply-btn small-reply-btn';
                        replyBtn.onclick = () => showCustomPopup(
                            'Reply to Entry',
                            `Entry: "${entry.thoughts}"\n\nYour reply:`,
                            'Write your reply.',
                            (replyText) => {
                                if (replyText) submitReply('diary', entry.date, replyText, replyBtn);
                            }
                        );
                        entryDiv.appendChild(replyBtn);
                    }

                    listContainer.appendChild(entryDiv);
                });
        } else {
            listContainer.innerHTML = '<p>No diary entries yet.</p>';
        }

        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        listContainer.innerHTML = `<p>Error loading entries: ${error.message}</p>`;
    }
}

// ===== REPLY FUNCTION (📮) =====
async function submitReply(entryType, entryIdentifier, replyMessage, buttonElement) {
    if (!currentUser || !replyMessage.trim()) {
        showCustomPopup('Error', 'Reply cannot be empty.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage.trim());
    formData.append('repliedBy', currentUser);

    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Replying...';
    }

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        const data = await response.json();

        if (data.status === 'success') {
            showCustomPopup('Success', 'Reply sent successfully! 📮');

            if (entryType === 'feeling') {
                fetchAndDisplayFeelingsEntries();
            } else {
                await fetchDiaryEntries();
                renderCalendar(calendarCurrentDate);
                if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) {
                    fetchAndDisplayAllDiaryEntries();
                }
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showCustomPopup('Error', 'Failed to send reply: ' + error.message);
    } finally {
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Reply 📮';
        }
    }
}

// ===== DARE GAME =====
function generateDare() {
    if (!currentUser) return;

    if (usedDares.length === coupleDares.length) {
        usedDares = [];
        showCustomPopup('All Dares Complete!', "You've gone through all the dares! Resetting for more fun. 😉");
    }

    const availableDares = coupleDares.filter(dare => !usedDares.includes(dare));
    const randomDare = availableDares[Math.floor(Math.random() * availableDares.length)];

    usedDares.push(randomDare);
    document.getElementById('dareText').textContent = randomDare;
}

// ===== PERIOD TRACKER =====
function selectMood(mood) {
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    selectedMood = mood;
}

function addPeriodEntry() {
    const startDate = document.getElementById('periodStartDate').value;
    const endDate = document.getElementById('periodEndDate').value || startDate;

    if (!startDate) {
        showCustomPopup('Error', 'Please select at least a start date.');
        return;
    }

    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');

    periodData.push({
        startDate,
        endDate,
        mood: selectedMood,
        loggedBy: currentUser,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem('periodData', JSON.stringify(periodData));

    document.getElementById('periodStartDate').value = '';
    document.getElementById('periodEndDate').value = '';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    selectedMood = null;

    loadPeriodTracker();
    showCustomPopup('Success', 'Period entry recorded! 🌸');
}

function calculateAverageCycleLength() {
    if (periodData.length < 2) return 28;
    const sorted = [...periodData].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    let total = 0;
    let count = 0;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].startDate);
        const curr = new Date(sorted[i].startDate);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff > 0 && diff < 60) {
            total += diff;
            count++;
        }
    }
    return count ? Math.round(total / count) : 28;
}

function renderPeriodCalendar() {
    const grid = document.getElementById('periodCalendarGrid');
    const label = document.getElementById('periodMonthYear');
    if (!grid || !label) return;

    grid.innerHTML = '';
    const month = periodCalendarDate.getMonth();
    const year = periodCalendarDate.getFullYear();
    label.textContent = `${periodCalendarDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    const periodDates = new Set();
    periodData.forEach(entry => {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getMonth() === month && d.getFullYear() === year) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                periodDates.add(dateStr);
            }
        }
    });

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (periodDates.has(dateStr)) {
            dayCell.classList.add('period-day');
        }
        grid.appendChild(dayCell);
    }
}

function loadPeriodTracker() {
    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');

    const statusEl = document.getElementById('periodStatus');
    const nextInfoEl = document.getElementById('nextPeriodInfo');

    if (periodData.length === 0) {
        statusEl.textContent = 'No period data recorded yet.';
        nextInfoEl.textContent = '';
        renderPeriodCalendar();
        return;
    }

    const sortedData = [...periodData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const lastPeriod = sortedData[0];
    const lastStart = new Date(lastPeriod.startDate);
    const lastEnd = new Date(lastPeriod.endDate);
    const cycleLength = calculateAverageCycleLength();

    const nextPeriodDate = new Date(lastStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    const today = new Date();
    const daysSinceLast = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24));
    const daysUntilNext = Math.floor((nextPeriodDate - today) / (1000 * 60 * 60 * 24));

    const currentLength = Math.floor((lastEnd - lastStart) / (1000 * 60 * 60 * 24)) + 1;

    if (daysSinceLast <= currentLength) {
        statusEl.innerHTML = `🌸 Currently on period (Day ${daysSinceLast + 1})<br>Mood: ${lastPeriod.mood || 'Not recorded'}`;
    } else if (daysUntilNext <= 7 && daysUntilNext > 0) {
        statusEl.textContent = `🌸 Your period may come in ${daysUntilNext} day(s). Take care, my love.`;
    } else if (daysUntilNext <= 0) {
        statusEl.textContent = `🌸 Period may be late by ${Math.abs(daysUntilNext)} day(s).`;
    } else {
        statusEl.textContent = `🌸 All good right now. Next period is in about ${daysUntilNext} day(s).`;
    }

    nextInfoEl.textContent = `Estimated next period start: ${nextPeriodDate.toLocaleDateString()}`;
    renderPeriodCalendar();
}

// ===== LOVE ARCADE: MEMORY GAME =====
function startMemoryGame() {
    navigateToApp('memoryGameScreen');
    const grid = document.getElementById('memoryGrid');
    const movesLabel = document.getElementById('memoryMoves');
    memoryMoves = 0;
    memoryFlipped = [];
    memoryLock = false;
    movesLabel.textContent = memoryMoves;

    const emojis = ['💖', '🐰', '🦋', '🌸', '🍓', '🍉', '⭐', '💌'];
    const cards = [...emojis, ...emojis]
        .sort(() => Math.random() - 0.5)
        .map((emoji, index) => ({ id: index, emoji, matched: false }));

    grid.innerHTML = '';

    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'memory-card';
        cardEl.dataset.id = card.id;
        cardEl.dataset.emoji = card.emoji;
        cardEl.innerHTML = `<span class="front">?</span><span class="back">${card.emoji}</span>`;
        cardEl.onclick = () => flipMemoryCard(cardEl);
        grid.appendChild(cardEl);
    });
}

function flipMemoryCard(cardEl) {
    if (memoryLock || cardEl.classList.contains('matched') || cardEl.classList.contains('flipped')) return;
    cardEl.classList.add('flipped');
    memoryFlipped.push(cardEl);

    if (memoryFlipped.length === 2) {
        memoryLock = true;
        const [c1, c2] = memoryFlipped;
        const e1 = c1.dataset.emoji;
        const e2 = c2.dataset.emoji;

        if (e1 === e2) {
            setTimeout(() => {
                c1.classList.add('matched');
                c2.classList.add('matched');
                memoryFlipped = [];
                memoryLock = false;
                checkMemoryWin();
            }, 400);
        } else {
            setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                memoryFlipped = [];
                memoryLock = false;
            }, 600);
        }

        memoryMoves++;
        document.getElementById('memoryMoves').textContent = memoryMoves;
    }
}

function checkMemoryWin() {
    const allCards = document.querySelectorAll('.memory-card');
    if ([...allCards].every(c => c.classList.contains('matched'))) {
        if (memHighScore === 0 || memoryMoves < memHighScore) {
            memHighScore = memoryMoves;
            gameHighScores.memory = memoryMoves;
            saveHighScores();
        }
        showCustomPopup('Yay! 🎉', `You finished Memory Match in ${memoryMoves} moves!`);
        updateHighScoreDisplays();
    }
}

// ===== LOVE ARCADE: CATCH THE HEART =====
function startCatchGame() {
    navigateToApp('catchGameScreen');
    const canvas = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');

    setTimeout(() => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('catchStartOverlay').style.display = 'flex';
    }, 100);
}

function initCatchGame() {
    document.getElementById('catchStartOverlay').style.display = 'none';
    const canvas = document.getElementById('catchGameCanvas');
    const container = document.getElementById('catchGameCanvasContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    catchScore = 0;
    document.getElementById('catchScore').textContent = catchScore;
    catchGameRunning = true;

    let items = [];
    let frame = 0;

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const activeCtx = newCanvas.getContext('2d');

    const basket = {
        width: 70,
        height: 35,
        x: newCanvas.width / 2 - 35,
        y: newCanvas.height - 60
    };

    function moveBasket(e) {
        if (!catchGameRunning) return;
        e.preventDefault();
        const rect = newCanvas.getBoundingClientRect();
        let clientX;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }

        const x = clientX - rect.left;
        basket.x = Math.max(0, Math.min(x - basket.width / 2, newCanvas.width - basket.width));
    }

    newCanvas.addEventListener('mousemove', moveBasket);
    newCanvas.addEventListener('touchmove', moveBasket, { passive: false });

    function loop() {
        if (!catchGameRunning) return;

        activeCtx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        // Basket
        activeCtx.fillStyle = '#d94a6b';
        activeCtx.fillRect(basket.x, basket.y, basket.width, basket.height);
        activeCtx.fillStyle = 'white';
        activeCtx.font = '24px Arial';
        activeCtx.fillText('📮', basket.x + 18, basket.y + 26);

        // Spawn hearts
        if (frame % 40 === 0) {
            const isBad = Math.random() < 0.3;
            items.push({
                x: Math.random() * (newCanvas.width - 30),
                y: -30,
                type: isBad ? '💔' : '💖',
                speed: 2 + Math.random() * 3
            });
        }

        // Move & draw hearts
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += item.speed;
            activeCtx.font = '32px Arial';
            activeCtx.fillText(item.type, item.x, item.y);

            const hitsBasket =
                item.y > basket.y && item.y < basket.y + basket.height &&
                item.x + 26 > basket.x && item.x < basket.x + basket.width;

            if (hitsBasket) {
                if (item.type === '💔') {
                    endCatchGame();
                    return;
                } else {
                    catchScore++;
                    document.getElementById('catchScore').textContent = catchScore;
                    items.splice(i, 1);
                }
            } else if (item.y > newCanvas.height + 40) {
                items.splice(i, 1);
            }
        }

        frame++;
        catchLoopId = requestAnimationFrame(loop);
    }

    loop();
}

function endCatchGame() {
    catchGameRunning = false;
    if (catchLoopId) cancelAnimationFrame(catchLoopId);
    if (catchScore > gameHighScores.catch) {
        gameHighScores.catch = catchScore;
        saveHighScores();
        showCustomPopup('Game Over', `New High Score: ${catchScore}! 🏆`);
    } else {
        showCustomPopup('Game Over', `Score: ${catchScore}`);
    }
    document.getElementById('catchStartOverlay').style.display = 'flex';
}

// ===== LOVE ARCADE: LOVE SLASHER (FRUIT + BOMB 💣) =====
function startSlasherGame() {
    navigateToApp('slasherGameScreen');
    const canvas = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');

    setTimeout(() => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        document.getElementById('slasherStartOverlay').style.display = 'flex';
    }, 100);
}

function initSlasherGame() {
    document.getElementById('slasherStartOverlay').style.display = 'none';
    const canvas = document.getElementById('slasherCanvas');
    const container = document.getElementById('slasherCanvasContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    slasherScore = 0;
    document.getElementById('slasherScore').textContent = slasherScore;
    slasherGameRunning = true;

    let fruits = [];
    let particles = [];
    let frame = 0;
    const gravity = 0.15;
    let trail = [];

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const activeCtx = newCanvas.getContext('2d');

    function inputHandler(e) {
        if (!slasherGameRunning) return;
        e.preventDefault();

        const rect = newCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        trail.push({ x, y, life: 10 });

        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            const dist = Math.sqrt((x - f.x) ** 2 + (y - f.y) ** 2);
            if (dist < f.size) {
                if (f.type === '💣') {
                    endSlasherGame();
                    return;
                }
                slasherScore++;
                document.getElementById('slasherScore').textContent = slasherScore;
                createParticles(f.x, f.y, f.color);
                fruits.splice(i, 1);
            }
        }
    }

    newCanvas.addEventListener('mousemove', inputHandler);
    newCanvas.addEventListener('touchmove', inputHandler, { passive: false });

    function createParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 20,
                color: color
            });
        }
    }

    function loop() {
        if (!slasherGameRunning) return;
        activeCtx.clearRect(0, 0, newCanvas.width, newCanvas.height);

        // Slash trail
        activeCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        activeCtx.lineWidth = 3;
        activeCtx.beginPath();
        for (let i = 0; i < trail.length; i++) {
            let p = trail[i];
            if (i === 0) activeCtx.moveTo(p.x, p.y);
            else activeCtx.lineTo(p.x, p.y);
            p.life--;
        }
        activeCtx.stroke();
        trail = trail.filter(p => p.life > 0);

        // Spawn fruits/bomb
        if (frame % 50 === 0) {
            const types = [
                { emoji: '🍉', color: 'red' },
                { emoji: '🍓', color: 'crimson' },
                { emoji: '🍎', color: 'darkred' },
                { emoji: '🍍', color: 'goldenrod' },
                { emoji: '🍌', color: 'gold' },
                { emoji: '🍇', color: 'purple' },
                { emoji: '💣', color: 'black' } // bomb
            ];
            const obj = types[Math.floor(Math.random() * types.length)];
            fruits.push({
                x: Math.random() * (newCanvas.width - 60) + 30,
                y: newCanvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 5 + 8),
                type: obj.emoji,
                color: obj.color,
                size: 30
            });
        }

        // Move fruits
        for (let i = fruits.length - 1; i >= 0; i--) {
            let f = fruits[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vy += gravity;

            activeCtx.font = '40px Arial';
            activeCtx.fillText(f.type, f.x - 20, f.y + 15);

            if (f.y > newCanvas.height + 50) fruits.splice(i, 1);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            activeCtx.fillStyle = p.color;
            activeCtx.beginPath();
            activeCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            activeCtx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }

        frame++;
        slasherLoopId = requestAnimationFrame(loop);
    }

    loop();
}

function endSlasherGame() {
    slasherGameRunning = false;
    if (slasherLoopId) cancelAnimationFrame(slasherLoopId);

    if (slasherScore > gameHighScores.slasher) {
        gameHighScores.slasher = slasherScore;
        saveHighScores();
        showCustomPopup('BOOM! 💥', `New High Score: ${slasherScore}! 🏆`);
    } else {
        showCustomPopup('BOOM! 💥', `Game Over. Score: ${slasherScore}`);
    }
    document.getElementById('slasherStartOverlay').style.display = 'flex';
}

// ===== GAME COMMON =====
function quitGame(goHome = true) {
    catchGameRunning = false;
    if (catchLoopId) cancelAnimationFrame(catchLoopId);
    slasherGameRunning = false;
    if (slasherLoopId) cancelAnimationFrame(slasherLoopId);

    if (goHome) {
        navigateToApp('gameHubScreen');
    }
}

function saveHighScores() {
    localStorage.setItem('hetuApp_highscores', JSON.stringify(gameHighScores));
    updateHighScoreDisplays();
}

function updateHighScoreDisplays() {
    const memEl = document.getElementById('memHighScore');
    const catchEl = document.getElementById('catchHighScore');
    const slashEl = document.getElementById('slashHighScore');

    if (memEl) memEl.textContent = gameHighScores.memory || 0;
    if (catchEl) catchEl.textContent = gameHighScores.catch || 0;
    if (slashEl) slashEl.textContent = gameHighScores.slasher || 0;
}

// ===== USER AUTHENTICATION =====
function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
        createFloatingEmojis();

        // Butterflies flying on login 🦋
        setTimeout(() => {
            const header = document.querySelector('.main-header h1');
            if (header) releaseButterflies(header);
        }, 1000);
    } else {
        showCustomPopup('Error', 'Invalid user selection.');
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.body.style.alignItems = 'center';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('floatingBg').innerHTML = '';
}

function updateUserDisplay() {
    const display = document.getElementById('loggedInUserDisplay');
    if (display) {
        display.textContent = currentUser ? `User: ${currentUser}` : 'User: Not logged in';
    }
    document.querySelectorAll('.dynamicUserName').forEach(el => {
        el.textContent = currentUser || 'User';
    });
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
    }
    const storedScores = localStorage.getItem('hetuApp_highscores');
    if (storedScores) {
        gameHighScores = JSON.parse(storedScores);
    }
    updateHighScoreDisplays();
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ===== FLOATING EMOJI BACKGROUND (hearts + bunny + butterflies + flowers) =====
function createFloatingEmojis() {
    const container = document.getElementById('floatingBg');
    if (!container) return;
    container.innerHTML = '';

    const emojis = [
        '💖', '💗', '💓', '💞', '💘', '💝', // hearts
        '🐰',                             // bunny
        '🦋', '🦋',                       // butterflies
        '🌸', '🌷', '🌺', '🌹',           // flowers
        '✨', '⭐'                        // sparkles
    ];

    for (let i = 0; i < 18; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'floating-emoji';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = Math.random() * 100 + '%';
        emoji.style.top = Math.random() * 100 + '%';
        emoji.style.animationDelay = Math.random() * 6 + 's';
        emoji.style.animationDuration = (4 + Math.random() * 4) + 's';
        container.appendChild(emoji);
    }
}

// ===== BUTTERFLY RELEASE EFFECT (🦋) =====
function releaseButterflies(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        butterfly.textContent = '🦋';

        const tx = (Math.random() - 0.5) * 250 + 'px';
        butterfly.style.setProperty('--tx', tx);

        butterfly.style.left = centerX + 'px';
        butterfly.style.top = centerY + 'px';

        butterfly.style.animation = `butterflyFly 2.3s ease-out forwards ${Math.random() * 0.6}s`;

        document.body.appendChild(butterfly);

        setTimeout(() => {
            butterfly.remove();
        }, 3000);
    }
}

// ===== CUSTOM POPUP SYSTEM =====
function showCustomPopup(title, message, inputPlaceholder = null, callback = null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p => p.remove());

    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'custom-popup';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const messageEl = document.createElement('p');
    messageEl.style.whiteSpace = "pre-line";
    messageEl.textContent = message;

    popup.appendChild(titleEl);
    popup.appendChild(messageEl);

    let input = null;
    if (inputPlaceholder) {
        input = document.createElement('textarea');
        input.rows = 3;
        input.placeholder = inputPlaceholder;
        input.style.cssText = 'width: 100%; padding: 10px; margin: 10px 0; border: 1px solid var(--border-color); border-radius: 8px;';
        popup.appendChild(input);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.marginTop = '15px';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.background = '#ccc';
    cancelBtn.onclick = () => {
        overlay.remove();
        if (callback) callback(null);
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = inputPlaceholder ? 'Submit' : 'OK';
    confirmBtn.onclick = () => {
        overlay.remove();
        if (callback) callback(input ? input.value : true);
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    if (input) input.focus();
}

// ===== NAVIGATION =====
function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') {
        showCustomPopup('Session Expired', 'Please log in again.');
        logout();
        return;
    }

    quitGame(false);

    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    }
    if (screenId === 'periodTrackerScreen') {
        loadPeriodTracker();
    }
    if (screenId === 'timelineScreen') {
        renderTimeline();
    }
}

// ===== MISS YOU POPUP =====
function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-button .bunny-face');
    if (bunnyFace) bunnyFace.classList.add('spinning');

    setTimeout(() => {
        if (bunnyFace) bunnyFace.classList.remove('spinning');

        const hour = new Date().getHours();
        let message = "";

        if (hour >= 5 && hour < 12) {
            message = "Good morning, sunshine! ☀️";
        } else if (hour >= 22 || hour < 5) {
            message = "Sweet dreams, my love 🌙";
        } else {
            const msgs = [
                "You're my favorite notification 📱",
                "I love you my Chikoo! 🥰",
                "Sending virtual huggies 🤗 to my darling!",
                "Sending virtual kissy 😘 to my darling!",
                "Thinking of you, always! ✨",
                "You're the best! 💖"
            ];
            message = msgs[Math.floor(Math.random() * msgs.length)];
        }

        if (currentUser === 'Prath' && (message.includes('kissy') || message.includes('huggies'))) {
            message += "\n(From Chikoo)";
        }

        document.getElementById('missYouMessage').textContent = message;
        document.getElementById('missYouPopup').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }, 2000);
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkLoginStatus();

    if (!currentUser) createFloatingEmojis();

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');

    if (prevBtn) {
        prevBtn.onclick = () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            renderCalendar(calendarCurrentDate);
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            renderCalendar(calendarCurrentDate);
        };
    }

    const periodPrev = document.getElementById('periodPrevMonthBtn');
    const periodNext = document.getElementById('periodNextMonthBtn');

    if (periodPrev) {
        periodPrev.onclick = () => {
            periodCalendarDate.setMonth(periodCalendarDate.getMonth() - 1);
            renderPeriodCalendar();
        };
    }
    if (periodNext) {
        periodNext.onclick = () => {
            periodCalendarDate.setMonth(periodCalendarDate.getMonth() + 1);
            renderPeriodCalendar();
        };
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.onclick = toggleTheme;
    }
});
