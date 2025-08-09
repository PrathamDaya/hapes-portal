// --- SCRIPT START ---

const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// --- DOM Element References ---
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');
const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');
const dareTextElement = document.getElementById('dareText');

// --- Global State Variables ---
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {}; 
let usedDares = [];

// --- Data Arrays ---
const coupleDares = ["Give your partner a slow, sensual massage.", "Whisper three things you find sexiest about your partner.", "Blindfold your partner and tease them with light touches.", "Choose a song and give your partner a private slow dance.", "Write a steamy compliment and have your partner read it aloud.", "Let your partner slowly remove one item of your clothing.", "Describe your favorite passionate memory together.", "Feed your partner a piece of fruit seductively.", "Kiss passionately for at least 60 seconds.", "Trace words of affection on each other's backs.", "Share a secret fantasy you've had about your partner.", "Let your partner choose a spot on your body to kiss.", "Remove your top and let your partner admire you.", "Maintain eye contact for 2 minutes while caressing hands.", "Give a lingering kiss on their collarbone.", "Tell your partner what you want to do with them tonight.", "Gently bite your partner's earlobe or lip.", "Apply lotion or oil to each other's arms or chest.", "Cuddle and share soft kisses for 5 minutes.", "Blindfold your partner and kiss them in three secret spots.", "Slowly lick honey or chocolate syrup off your partner.", "Recreate your very first kiss.", "Give your partner a sensual foot massage.", "Both remove your shirts and compliment each other.", "Write 'I want you' with lipstick on your partner's body.", "Playfully spank your partner.", "Share a shower or bath together.", "Let your partner choose one item of your clothing to remove.", "Kiss your partner from their lips, down their neck, to their chest.", "Tell your partner a secret intimate desire.", "Blindfold yourself and let your partner guide your hands over their body.", "Take turns giving each other eskimo kisses.", "Whisper your partner's name seductively.", "Communicate only with kisses for 3 minutes.", "Draw a temporary tattoo on your partner.", "Both remove your tops and dance together skin to skin.", "Give your partner a sensual 'once-over' look.", "Tease your partner by almost kissing them several times.", "Read an erotic poem or story to each other.", "Describe your partner's sexiest feature.", "Let your partner pick a dare for you from this list.", "Give your partner a lap dance.", "Role-play as a famous movie star and an adoring fan.", "Take a sexy selfie together.", "Kiss each of your partner's fingertips slowly.", "Dare your partner to make you blush with only words."];

// --- Personalized "Miss You" Messages ---
const forChikooMessages = [
    "Prath is missing his Chikoo a lot right now... 💖",
    "Prath sends you a thousand virtual huggies and kisses! 🤗😘",
    "Just a little reminder that Prath is thinking of you. Always. ✨",
    "Hey my love, Prath can't wait to see you! ❤️",
    "Prath wants you to know you're the best thing that ever happened to him. 🥰"
];
const forPrathMessages = [
    "Your Chikoo is sending you all her love! 💌",
    "Chikoo misses her Prath more than words can say. 💕",
    "Psst... Chikoo is thinking about your handsome face. 😊",
    "Chikoo sends you a big, warm, cuddly hug! 🤗",
    "Hey you, Chikoo loves you to the moon and back! 🚀"
];


// --- Authentication & Session Management ---
function login(userName) {
    currentUser = userName;
    localStorage.setItem(SCRIPT_USER_KEY, currentUser);
    updateUserDisplay();
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    navigateToApp('homeScreen');
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    appContainer.style.display = 'none';
    loginContainer.style.display = 'block';
}

function updateUserDisplay() {
    loggedInUserDisplay.textContent = currentUser ? `User: ${currentUser}` : 'Not logged in';
    dynamicUserNameElements.forEach(el => { el.textContent = currentUser || 'User'; });
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        login(storedUser);
    }
}

// --- Main Navigation ---
function navigateToApp(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');

    if (screenId === 'feelingsPortalScreen') navigateToFeelingsPage('feelingsPage1');
    if (screenId === 'diaryScreen') {
        fetchDiaryEntries().then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryCalendarPage');
        });
    }
}

// --- Feelings Portal Functions ---
function navigateToFeelingsPage(pageId, emotion = '') {
    feelingsPages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    if (emotion) currentEmotion = emotion;
    if (pageId === 'feelingsPage2' && currentEmotion) {
        document.querySelector('#feelingsPage2 h2').textContent = `You selected: ${currentEmotion}. Share your thoughts.`;
    }
}

function submitFeelingsEntry() {
    const messageInput = document.getElementById('feelingsMessage');
    const message = messageInput.value.trim();
    if (!currentUser || !currentEmotion || !message) {
        showCustomMessage('Please select an emotion and write a message.');
        return;
    }
    
    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser);

    const btn = document.getElementById('submitFeelingsBtn');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            navigateToFeelingsPage('feelingsPage3');
            messageInput.value = '';
        })
        .catch(err => showCustomMessage(`Error: ${err.message}`))
        .finally(() => {
            btn.textContent = 'Submit Entry';
            btn.disabled = false;
        });
}

async function fetchAndDisplayFeelingsEntries() {
    navigateToFeelingsPage('feelingsViewEntriesPage');
    const listContainer = document.getElementById('feelingsEntriesList');
    listContainer.innerHTML = '<p class="text-center text-gray-400">Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getFeelingsEntries`);
        const serverData = await response.json();
        if (serverData.status !== 'success') throw new Error(serverData.message || 'Failed to load entries.');
        
        listContainer.innerHTML = '';
        if (!serverData.data || serverData.data.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-400">No entries yet. Be the first!</p>';
            return;
        }

        serverData.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        serverData.data.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'p-4 mb-4 border border-gray-700 rounded-xl bg-gray-800 shadow-sm';
            const entryDate = new Date(entry.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let replyHTML = '';
            if (entry.repliedBy && entry.replyMessage) {
                const replyDate = new Date(entry.replyTimestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const replierColor = entry.repliedBy === 'Chikoo' ? 'text-pink-400' : 'text-fuchsia-400';
                replyHTML = `<div class="mt-3 pt-3 border-t border-gray-700"><p class="text-sm font-bold ${replierColor}">${entry.repliedBy} replied:</p><p class="text-gray-300 text-sm">${entry.replyMessage}</p><p class="text-xs text-gray-500 text-right">${replyDate}</p></div>`;
            } else {
                replyHTML = `<div class="text-right mt-2"><button class="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-green-600 transition" onclick="showReplyPrompt('feeling', '${entry.timestamp}', \`${entry.message}\`)">Reply 💌</button></div>`;
            }

            const submitterColor = entry.submittedBy === 'Chikoo' ? 'text-pink-400' : 'text-fuchsia-400';
            entryDiv.innerHTML = `<div class="flex justify-between items-center mb-2"><span class="font-bold ${submitterColor}">${entry.submittedBy}</span><span class="text-xs text-gray-500">${entryDate}</span></div><p class="text-gray-300 mb-2">${entry.message}</p><span class="inline-block px-3 py-1 text-sm font-semibold text-white rounded-full ${getEmotionColor(entry.emotion)}">${entry.emotion}</span>${replyHTML}`;
            listContainer.appendChild(entryDiv);
        });
    } catch (error) {
        listContainer.innerHTML = `<p class="text-center text-red-400">Error loading entries: ${error.message}</p>`;
    }
}

function getEmotionColor(emotion) {
    switch(emotion?.toLowerCase()) {
        case 'happy': return 'bg-yellow-500';
        case 'sad': return 'bg-blue-500';
        case 'grievance': return 'bg-red-500';
        case 'appreciate': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
}

// --- Diary Functions ---
function navigateToDiaryPage(pageId) {
    diaryPages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
}

async function fetchDiaryEntries() {
    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`);
        const data = await response.json();
        if (data.status === 'success') {
            diaryEntries = {}; 
            if (data.data) data.data.forEach(entry => { diaryEntries[entry.date] = entry; });
        }
    } catch (error) {
        console.error('Failed to fetch diary entries:', error);
        diaryEntries = {};
    }
}

function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (!calendarGrid || !monthYearDisplay) return;

    calendarGrid.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();
    monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
        calendarGrid.innerHTML += `<div class="font-bold text-pink-400 text-sm">${day}</div>`;
    });

    for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.appendChild(document.createElement('div'));

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        const formattedCellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = formattedCellDate;
        dayCell.textContent = day;
        
        let cellClasses = 'p-2 rounded-full hover:bg-gray-700 cursor-pointer transition-colors flex items-center justify-center aspect-square';
        if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && day === today.getDate()) {
            cellClasses += ' bg-pink-500 text-white font-bold';
        }
        if (diaryEntries[formattedCellDate]) {
            cellClasses += ' border-2 ' + (diaryEntries[formattedCellDate].submittedBy === 'Chikoo' ? 'border-pink-400' : 'border-cyan-400');
        }
        dayCell.className = cellClasses;
        dayCell.onclick = () => diaryEntries[formattedCellDate] ? viewDiaryEntry(formattedCellDate) : openDiaryEntry(formattedCellDate);
        calendarGrid.appendChild(dayCell);
    }
}

function openDiaryEntry(dateString) {
    document.getElementById('selectedDate').value = dateString;
    const dateObj = new Date(dateString + 'T00:00:00');
    document.getElementById('diaryEntryTitle').textContent = `Diary for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    document.getElementById('diaryThoughts').value = '';
    navigateToDiaryPage('diaryEntryPage');
}

function viewDiaryEntry(dateString) {
    const entry = diaryEntries[dateString];
    if (!entry) return;
    const dateObj = new Date(dateString + 'T00:00:00');
    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts;
    document.getElementById('diaryEntryAttribution').textContent = `— ${entry.submittedBy}`;
    
    const replySection = document.getElementById('diaryViewPageReplySection');
    replySection.innerHTML = '';
    if (entry.repliedBy && entry.replyMessage) {
        const replyDate = new Date(entry.replyTimestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const replierColor = entry.repliedBy === 'Chikoo' ? 'text-pink-400' : 'text-fuchsia-400';
        replySection.innerHTML = `<p class="text-sm font-bold ${replierColor}">${entry.repliedBy} replied:</p><p class="text-gray-300 text-sm">${entry.replyMessage}</p><p class="text-xs text-gray-500 text-right">${replyDate}</p>`;
    } else {
        replySection.innerHTML = `<div class="text-center"><button class="bg-green-500 text-white text-sm font-bold py-2 px-4 rounded-full hover:bg-green-600 transition" onclick="showReplyPrompt('diary', '${dateString}', \`${entry.thoughts}\`)">Reply 💌</button></div>`;
    }
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value;
    if (!date || !thoughts) { showCustomMessage('Please write your thoughts for the selected date.'); return; }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser);

    const btn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            return fetchDiaryEntries();
        })
        .then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryConfirmationPage');
        })
        .catch(err => showCustomMessage(`Error: ${err.message}`))
        .finally(() => {
            btn.textContent = 'Save Entry';
            btn.disabled = false;
        });
}

async function fetchAndDisplayAllDiaryEntries() {
    navigateToDiaryPage('allDiaryEntriesPage');
    const listContainer = document.getElementById('allDiaryEntriesList');
    listContainer.innerHTML = '<p class="text-center text-gray-400">Loading entries...</p>';

    try {
        if (Object.keys(diaryEntries).length === 0) await fetchDiaryEntries();
        const sortedEntries = Object.values(diaryEntries).sort((a, b) => new Date(b.date) - new Date(a.date));

        listContainer.innerHTML = '';
        if (sortedEntries.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-400">No diary entries yet.</p>';
            return;
        }

        sortedEntries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'p-4 mb-4 border border-gray-700 rounded-xl bg-gray-800 shadow-sm';
            const entryDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            let replyHTML = '';
            if (entry.repliedBy && entry.replyMessage) {
                 const replyDate = new Date(entry.replyTimestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                 const replierColor = entry.repliedBy === 'Chikoo' ? 'text-pink-400' : 'text-fuchsia-400';
                 replyHTML = `<div class="mt-3 pt-3 border-t border-gray-700"><p class="text-sm font-bold ${replierColor}">${entry.repliedBy} replied:</p><p class="text-gray-300 text-sm">${entry.replyMessage}</p><p class="text-xs text-gray-500 text-right">${replyDate}</p></div>`;
            } else {
                 replyHTML = `<div class="text-right mt-2"><button class="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-green-600 transition" onclick="showReplyPrompt('diary', '${entry.date}', \`${entry.thoughts}\`)">Reply 💌</button></div>`;
            }
            
            const submitterColor = entry.submittedBy === 'Chikoo' ? 'text-pink-400' : 'text-cyan-400';
            entryDiv.innerHTML = `<h3 class="font-bold text-lg ${submitterColor}">${entryDate}</h3><p class="text-sm text-gray-500 mb-2">by ${entry.submittedBy}</p><p class="text-gray-300 whitespace-pre-wrap">${entry.thoughts}</p>${replyHTML}`;
            listContainer.appendChild(entryDiv);
        });
    } catch (error) {
        listContainer.innerHTML = `<p class="text-center text-red-400">Error loading entries: ${error.message}</p>`;
    }
}

// --- Reply Functions ---
function showReplyPrompt(entryType, entryIdentifier, originalMessage) {
    const overlay = document.getElementById('customModalOverlay');
    const modalContent = `
        <div class="bg-gray-800 p-6 rounded-2xl shadow-2xl text-left max-w-md w-full border border-gray-700">
            <h3 class="font-bold text-lg mb-2 text-gray-200">Replying to entry:</h3>
            <p class="text-sm bg-gray-900 p-2 rounded-lg max-h-24 overflow-y-auto custom-scrollbar mb-4 text-gray-400">${originalMessage}</p>
            <textarea id="replyMessage" class="w-full h-24 p-2 bg-gray-700 text-gray-200 border-2 border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition" placeholder="Your reply..."></textarea>
            <div class="flex justify-end items-center mt-4 gap-4">
                <button class="bg-gray-600 text-gray-200 font-bold py-2 px-4 rounded-xl hover:bg-gray-500 transition" onclick="closeCustomModal()">Cancel</button>
                <button class="bg-green-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition" onclick="submitReply('${entryType}', '${entryIdentifier}')">Submit Reply</button>
            </div>
        </div>
    `;
    overlay.innerHTML = modalContent;
    overlay.classList.remove('hidden');
    document.getElementById('replyMessage').focus();
}

async function submitReply(entryType, entryIdentifier) {
    const replyMessage = document.getElementById('replyMessage').value.trim();
    if (!replyMessage) { showCustomMessage("Reply cannot be empty."); return; }

    const formData = new FormData();
    formData.append('formType', 'replyEntry');
    formData.append('entryType', entryType);
    formData.append('entryIdentifier', entryIdentifier);
    formData.append('replyMessage', replyMessage);
    formData.append('repliedBy', currentUser);

    closeCustomModal();
    showCustomMessage("Submitting reply...");

    try {
        const response = await fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' });
        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message);
        
        showCustomMessage("Reply submitted successfully!");
        if (entryType === 'feeling') {
            fetchAndDisplayFeelingsEntries();
        } else if (entryType === 'diary') {
            await fetchDiaryEntries();
            renderCalendar(calendarCurrentDate);
            if (document.getElementById('allDiaryEntriesPage').classList.contains('active')) fetchAndDisplayAllDiaryEntries();
            if (document.getElementById('diaryViewPage').classList.contains('active')) {
                const viewedDate = document.getElementById('viewDiaryDateDisplay').textContent;
                if(new Date(entryIdentifier + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) === viewedDate) {
                    viewDiaryEntry(entryIdentifier);
                }
            }
        }
    } catch (error) {
        showCustomMessage(`Error submitting reply: ${error.message}`);
    }
}

// --- Dare Game Functions ---
function generateDare() {
    if (!currentUser) { showCustomMessage('Please log in to play!'); return; }
    let availableDares = coupleDares.filter(d => !usedDares.includes(d));
    if (availableDares.length === 0) {
        usedDares = [];
        availableDares = coupleDares;
        showCustomMessage("You've done all the dares! Resetting for more fun. 😉");
    }
    const dare = availableDares[Math.floor(Math.random() * availableDares.length)];
    usedDares.push(dare);
    dareTextElement.textContent = dare;
}

// --- Popups & Modals ---
function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-face');
    bunnyFace.classList.add('spinning');
    setTimeout(() => {
        bunnyFace.classList.remove('spinning');
        let message = "I miss you!";
        if (currentUser === 'Chikoo') {
            message = forChikooMessages[Math.floor(Math.random() * forChikooMessages.length)];
        } else if (currentUser === 'Prath') {
            message = forPrathMessages[Math.floor(Math.random() * forPrathMessages.length)];
        }
        document.getElementById('missYouMessage').textContent = message;
        document.getElementById('missYouPopup').classList.remove('hidden');
    }, 1500);
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').classList.add('hidden');
}

function showCustomMessage(message) {
    const overlay = document.getElementById('customModalOverlay');
    overlay.innerHTML = `<div class="bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-pink-500/30"><p class="text-lg text-gray-200 mb-6">${message}</p><button class="bg-pink-500 text-white font-bold py-2 px-6 rounded-xl hover:bg-pink-600 transition" onclick="closeCustomModal()">Okay</button></div>`;
    overlay.classList.remove('hidden');
}

function closeCustomModal() {
    const overlay = document.getElementById('customModalOverlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar(calendarCurrentDate);
    });
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar(calendarCurrentDate);
    });
});
