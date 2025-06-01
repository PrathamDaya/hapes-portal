// --- FULLY UPDATED script.js with User Login, Attribution & Reply Functionality ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec'; // <<< REPLACE WITH YOUR URL

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');

const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Global variables for application state
let currentUser = ''; // Stores 'Chikoo' or 'Prath'
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let diaryEntries = {}; // Stores { 'YYYY-MM-DD': entryObject }

// --- User Authentication and Session ---
function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.alignItems = 'flex-start'; // Adjust body alignment for app content
        navigateToApp('mainScreen'); // Navigate to the main application screen after login

        // Initial fetch and render for calendar if it's the default view after login
        if (document.getElementById('diaryScreen')) { // Check if diary screen exists
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        }

    } else {
        alert('Invalid username. Please try again.');
    }
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.alignItems = 'flex-start'; // Adjust body alignment for app content
        navigateToApp('mainScreen'); // Navigate to the main screen if already logged in

        // Initial fetch and render for calendar if it's the default view after login
        if (document.getElementById('diaryScreen')) { // Check if diary screen exists
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        }

    } else {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    loginContainer.style.display = 'flex';
    appContainer.style.display = 'none';
    document.body.style.alignItems = 'center'; // Reset body alignment for login screen
}

function updateUserDisplay() {
    if (loggedInUserDisplay) {
        loggedInUserDisplay.textContent = currentUser;
    }
    dynamicUserNameElements.forEach(el => {
        el.textContent = currentUser;
    });
}

// --- Screen Navigation ---
function navigateToApp(screenId) {
    console.log('Navigating to screen:', screenId);
    // Hide all screens
    screens.forEach(screen => {
        screen.style.display = 'none';
    });

    // Show the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'block'; // Or 'flex' if the screen container itself is a flexbox
        console.log(screenId, 'is now visible.');
    } else {
        console.error('Target screen not found:', screenId);
    }

    // Additional logic that might be needed when navigating to specific screens
    if (screenId === 'diaryScreen') {
        // Ensure diary entries are fetched and calendar rendered when navigating to diary
        fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
    }
    // You might add similar logic for 'feelingsPortalScreen' if specific initializations are needed
}


// --- API Interaction (Google Apps Script) ---
async function sendDataToGoogleAppsScript(data, path) {
    try {
        const response = await fetch(`${scriptURL}?path=${path}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error sending data to Google Apps Script:', error);
        alert('Error: Could not send data. Please check your internet connection and script URL.');
        return { success: false, error: error.message };
    }
}

async function fetchDataFromGoogleAppsScript(path, params = {}) {
    const urlParams = new URLSearchParams(params).toString();
    const url = `${scriptURL}?path=${path}&${urlParams}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data from Google Apps Script:', error);
        alert('Error: Could not fetch data. Please check your internet connection and script URL.');
        return { success: false, error: error.message };
    }
}

// --- Feelings Portal Functions ---
function selectEmotion(emotion) {
    currentEmotion = emotion;
    document.querySelectorAll('.emotion-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById(`emotion-${emotion}`).classList.add('selected');
    document.getElementById('emotionMessage').value = ''; // Clear message on new selection
    navigateToApp('feelingsMessageScreen'); // Navigate to message input screen
}

async function sendFeelings() {
    if (!currentEmotion || !currentUser) {
        alert('Please select an emotion and ensure you are logged in.');
        return;
    }
    const message = document.getElementById('emotionMessage').value;

    const data = {
        timestamp: new Date().toISOString(),
        user: currentUser,
        emotion: currentEmotion,
        message: message
    };

    const response = await sendDataToGoogleAppsScript(data, 'addFeeling');
    if (response.success) {
        alert('Your feelings have been sent!');
        navigateToApp('feelingsPortalScreen'); // Go back to emotion selection
        currentEmotion = ''; // Reset emotion
    } else {
        alert('Failed to send feelings: ' + (response.error || 'Unknown error'));
    }
}

// --- Diary Functions ---
async function fetchDiaryEntries() {
    if (!currentUser) {
        console.log("Not logged in, skipping fetchDiaryEntries.");
        return;
    }
    console.log(`Fetching diary entries for user: ${currentUser}`);
    const response = await fetchDataFromGoogleAppsScript('getDiaryEntries', { user: currentUser });
    if (response.success && response.entries) {
        diaryEntries = {}; // Clear existing entries
        response.entries.forEach(entry => {
            // Store by YYYY-MM-DD for easy lookup
            const date = new Date(entry.timestamp);
            const dateKey = date.toISOString().split('T')[0];
            diaryEntries[dateKey] = entry;
        });
        console.log('Diary entries fetched:', diaryEntries);
    } else {
        console.error('Failed to fetch diary entries:', response.error || 'No entries found');
        diaryEntries = {}; // Ensure it's empty if fetch fails
    }
}

function renderCalendar(date) {
    const calendarHeader = document.getElementById('calendarHeader');
    const calendarGrid = document.getElementById('calendarGrid');

    if (!calendarHeader || !calendarGrid) {
        console.error('Calendar elements not found. Cannot render calendar.');
        return;
    }

    calendarHeader.textContent = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; // Clear previous days

    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDay = (firstDayOfMonth.getDay() + 6) % 7; // Adjust to start on Monday (0-6 where 0=Monday)

    // Add empty divs for days before the 1st of the month
    for (let i = 0; i < startDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // Add days of the month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = i;

        const currentDay = new Date(date.getFullYear(), date.getMonth(), i);
        const dateKey = currentDay.toISOString().split('T')[0]; // YYYY-MM-DD

        if (diaryEntries[dateKey]) {
            dayDiv.classList.add('has-entry');
            dayDiv.title = 'Diary entry exists'; // Add a tooltip
        }

        dayDiv.addEventListener('click', () => showDiaryEntry(dateKey));
        calendarGrid.appendChild(dayDiv);
    }
}

function showDiaryEntry(dateKey) {
    const entry = diaryEntries[dateKey];
    const diaryEntryContent = document.getElementById('diaryEntryContent');
    const diaryEntryDateDisplay = document.getElementById('diaryEntryDateDisplay');
    const diaryEntryActions = document.getElementById('diaryEntryActions');
    const editEntryButton = document.getElementById('editEntryButton');
    const deleteEntryButton = document.getElementById('deleteEntryButton');
    const replyMessageDisplay = document.getElementById('replyMessageDisplay');

    if (!diaryEntryContent || !diaryEntryDateDisplay || !diaryEntryActions || !editEntryButton || !deleteEntryButton || !replyMessageDisplay) {
        console.error('One or more diary entry view elements not found.');
        return;
    }

    diaryEntryDateDisplay.textContent = new Date(dateKey).toDateString();
    diaryEntryContent.innerHTML = ''; // Clear previous content
    replyMessageDisplay.innerHTML = ''; // Clear previous reply message

    if (entry) {
        // Display user's entry
        const userEntryPara = document.createElement('p');
        userEntryPara.innerHTML = `<strong>Your Entry:</strong> ${entry.entry.replace(/\n/g, '<br>')}`;
        diaryEntryContent.appendChild(userEntryPara);

        // Display reply if available and for the correct user
        if (entry.reply && currentUser === 'Chikoo') { // Only Chikoo sees replies
            const replyPara = document.createElement('p');
            replyPara.innerHTML = `<strong>Pratham's Reply:</strong> ${entry.reply.replace(/\n/g, '<br>')}`;
            replyMessageDisplay.appendChild(replyPara);
            replyMessageDisplay.style.display = 'block';
        } else if (entry.reply && currentUser === 'Prath') { // Prath can see own replies (though not from other users)
             const replyPara = document.createElement('p');
            replyPara.innerHTML = `<strong>Your Reply:</strong> ${entry.reply.replace(/\n/g, '<br>')}`;
            replyMessageDisplay.appendChild(replyPara);
            replyMessageDisplay.style.display = 'block';
        } else {
            replyMessageDisplay.style.display = 'none';
        }

        // Show edit/delete buttons for the entry owner
        if (entry.user === currentUser) {
            editEntryButton.onclick = () => editDiaryEntry(dateKey, entry.entry);
            deleteEntryButton.onclick = () => confirmDeleteEntry(dateKey);
            diaryEntryActions.style.display = 'block';
        } else {
            diaryEntryActions.style.display = 'none'; // Hide if not owner
        }

        // Show reply section only for Prath if no reply exists yet
        const replySection = document.getElementById('replySection');
        if (currentUser === 'Prath' && !entry.reply) {
            document.getElementById('replyMessageInput').value = '';
            document.getElementById('replyEntryId').value = entry.id; // Store entry ID for reply
            replySection.style.display = 'block';
        } else {
            replySection.style.display = 'none';
        }

    } else {
        diaryEntryContent.innerHTML = '<p>No entry for this date.</p>';
        diaryEntryActions.style.display = 'none';
        replySection.style.display = 'none';
        replyMessageDisplay.style.display = 'none'; // Hide reply display if no entry
    }
    navigateToApp('diaryEntryView'); // Show the diary entry view screen
}


function writeNewDiaryEntry() {
    document.getElementById('diaryEntryInput').value = ''; // Clear previous text
    document.getElementById('diaryEntryConfirmation').style.display = 'none';
    document.getElementById('newDiaryEntryScreen').style.display = 'block'; // Show the new entry screen
    document.getElementById('confirmationBox').style.display = 'none'; // Hide confirmation for new entry
    document.getElementById('confirmSaveButton').onclick = saveNewDiaryEntry; // Set action for save
    document.getElementById('cancelSaveButton').onclick = () => navigateToApp('diaryScreen'); // Set action for cancel
    document.getElementById('entryFormTitle').textContent = 'Write New Entry';
    document.getElementById('editEntryId').value = ''; // Clear edit ID for new entry
    navigateToApp('newDiaryEntryScreen'); // Navigate to the new entry screen
}


function editDiaryEntry(dateKey, currentEntryText) {
    const entry = diaryEntries[dateKey];
    if (entry) {
        document.getElementById('diaryEntryInput').value = currentEntryText;
        document.getElementById('entryFormTitle').textContent = 'Edit Entry';
        document.getElementById('editEntryId').value = entry.id; // Store entry ID for editing
        document.getElementById('confirmSaveButton').onclick = saveEditedDiaryEntry;
        document.getElementById('cancelSaveButton').onclick = () => showDiaryEntry(dateKey); // Return to entry view on cancel
        navigateToApp('newDiaryEntryScreen'); // Reuse the new entry screen for editing
    } else {
        alert('No entry found to edit.');
    }
}


async function saveNewDiaryEntry() {
    const entryText = document.getElementById('diaryEntryInput').value;
    if (!entryText) {
        alert('Diary entry cannot be empty!');
        return;
    }
    const today = calendarCurrentDate; // Use calendarCurrentDate for new entry
    const dateKey = today.toISOString().split('T')[0];

    const data = {
        timestamp: today.toISOString(),
        user: currentUser,
        entry: entryText,
        dateKey: dateKey
    };

    const response = await sendDataToGoogleAppsScript(data, 'addDiaryEntry');
    if (response.success) {
        alert('Diary entry saved!');
        // Update local diaryEntries with the new entry
        diaryEntries[dateKey] = {
            id: response.id, // Assuming the script returns the new entry's ID
            timestamp: today.toISOString(),
            user: currentUser,
            entry: entryText,
            reply: '' // No reply initially
        };
        navigateToApp('diaryScreen'); // Go back to calendar
        renderCalendar(calendarCurrentDate); // Re-render calendar to show new entry
    } else {
        alert('Failed to save diary entry: ' + (response.error || 'Unknown error'));
    }
}

async function saveEditedDiaryEntry() {
    const entryText = document.getElementById('diaryEntryInput').value;
    const entryId = document.getElementById('editEntryId').value;
    if (!entryText || !entryId) {
        alert('Diary entry cannot be empty or ID missing for edit!');
        return;
    }

    const data = {
        id: entryId,
        entry: entryText,
        user: currentUser // Important for security/validation on server-side
    };

    const response = await sendDataToGoogleAppsScript(data, 'updateDiaryEntry');
    if (response.success) {
        alert('Diary entry updated!');
        // Update local diaryEntries
        for (const dateKey in diaryEntries) {
            if (diaryEntries[dateKey].id === entryId) {
                diaryEntries[dateKey].entry = entryText;
                break;
            }
        }
        navigateToApp('diaryScreen'); // Go back to calendar
        renderCalendar(calendarCurrentDate); // Re-render calendar
    } else {
        alert('Failed to update diary entry: ' + (response.error || 'Unknown error'));
    }
}

function confirmDeleteEntry(dateKey) {
    document.getElementById('confirmationText').textContent = 'Are you sure you want to delete this diary entry? This action cannot be undone.';
    document.getElementById('confirmActionBtn').onclick = () => deleteDiaryEntry(dateKey);
    document.getElementById('cancelActionBtn').onclick = () => document.getElementById('confirmationBox').style.display = 'none';
    document.getElementById('confirmationBox').style.display = 'block';
}

async function deleteDiaryEntry(dateKey) {
    const entry = diaryEntries[dateKey];
    if (!entry) {
        alert('No entry found for this date to delete.');
        return;
    }
    document.getElementById('confirmationBox').style.display = 'none'; // Hide confirmation box

    const data = {
        id: entry.id,
        user: currentUser // Important for security/validation on server-side
    };

    const response = await sendDataToGoogleAppsScript(data, 'deleteDiaryEntry');
    if (response.success) {
        alert('Diary entry deleted!');
        delete diaryEntries[dateKey]; // Remove from local storage
        navigateToApp('diaryScreen'); // Go back to calendar
        renderCalendar(calendarCurrentDate); // Re-render calendar
    } else {
        alert('Failed to delete diary entry: ' + (response.error || 'Unknown error'));
    }
}

async function sendReply() {
    const replyText = document.getElementById('replyMessageInput').value;
    const entryId = document.getElementById('replyEntryId').value;

    if (!replyText || !entryId) {
        alert('Reply cannot be empty or entry ID is missing!');
        return;
    }

    const data = {
        id: entryId,
        reply: replyText,
        replier: currentUser // This should be 'Prath'
    };

    const response = await sendDataToGoogleAppsScript(data, 'addReply');
    if (response.success) {
        alert('Reply sent!');
        // Update the local entry with the new reply
        for (const dateKey in diaryEntries) {
            if (diaryEntries[dateKey].id === entryId) {
                diaryEntries[dateKey].reply = replyText;
                // Re-render the current entry view to show the reply
                showDiaryEntry(dateKey);
                break;
            }
        }
    } else {
        alert('Failed to send reply: ' + (response.error || 'Unknown error'));
    }
}

// --- Miss You Pop-up Messages ---
const missYouMessages = [
    "Pratham misses you too! ❤️",
    "Thinking of you, always! ✨",
    "You're the best! 💖"
];

function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-button .bunny-face');
    bunnyFace.classList.add('spinning'); // Start spinning

    setTimeout(() => {
        bunnyFace.classList.remove('spinning');
        
        let message = missYouMessages[Math.floor(Math.random() * missYouMessages.length)];
        // Personalize "Pratham misses you too!" if Chikoo is logged in
        if (typeof currentUser !== 'undefined' && currentUser === 'Chikoo' && message === "Pratham misses you too! ❤️") {
            // message remains as is
        } else if (typeof currentUser !== 'undefined' && currentUser === 'Prath' && message === "Pratham misses you too! ❤️") {
            message = "Chikoo misses you too! ❤️"; // Or a generic message
        }

        document.getElementById('missYouMessage').innerHTML = message;
        document.getElementById('missYouPopup').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }, 2000);
}

function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}


// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup for the login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const usernameInput = document.getElementById('usernameInput');
            login(usernameInput.value);
        });
    }

    // Set up navigation buttons
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.dataset.targetScreen;
            if (targetScreenId) {
                navigateToApp(targetScreenId);
            }
        });
    });

    // Specific navigation button listeners for direct clicks (if not using data-target-screen)
    const feelingsPortalButton = document.getElementById('feelingsPortalButton');
    if (feelingsPortalButton) {
        feelingsPortalButton.addEventListener('click', () => navigateToApp('feelingsPortalScreen'));
    }

    const diaryButton = document.getElementById('diaryButton');
    if (diaryButton) {
        diaryButton.addEventListener('click', () => navigateToApp('diaryScreen'));
    }

    // Add more event listeners for other buttons and forms as needed
    // Example: Emotion selection
    document.querySelectorAll('.emotion-option').forEach(option => {
        option.addEventListener('click', () => selectEmotion(option.dataset.emotion));
    });

    // Example: Send feelings button
    const sendFeelingsButton = document.getElementById('sendFeelingsButton');
    if (sendFeelingsButton) {
        sendFeelingsButton.addEventListener('click', sendFeelings);
    }

    // Example: Back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetScreen = button.dataset.targetScreen;
            if (targetScreen) {
                navigateToApp(targetScreen);
            } else {
                // Default back behavior, e.g., to main screen
                navigateToApp('mainScreen');
            }
        });
    });

    // Diary action buttons
    const writeEntryButton = document.getElementById('writeEntryButton');
    if (writeEntryButton) {
        writeEntryButton.addEventListener('click', writeNewDiaryEntry);
    }

    const confirmSaveButton = document.getElementById('confirmSaveButton');
    if (confirmSaveButton) {
        // Event listener is set dynamically by writeNewDiaryEntry/editDiaryEntry
    }

    const cancelSaveButton = document.getElementById('cancelSaveButton');
    if (cancelSaveButton) {
        // Event listener is set dynamically by writeNewDiaryEntry/editDiaryEntry
    }

    const sendReplyButton = document.getElementById('sendReplyButton');
    if (sendReplyButton) {
        sendReplyButton.addEventListener('click', sendReply);
    }

    // Miss You Pop-up buttons
    const bunnyButton = document.querySelector('.bunny-button');
    if (bunnyButton) {
        bunnyButton.addEventListener('click', showMissYouPopup);
    }

    const closePopupBtn = document.getElementById('closePopupBtn');
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', closeMissYouPopup);
    }

    // Check if scriptURL is updated
    if (scriptURL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
        // No alert here, login screen will be shown by default.
    }
    
    checkLoginStatus(); // Check login status and navigate accordingly
    
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; // Prevent action if not logged in
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (!currentUser) return; // Prevent action if not logged in
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            fetchDiaryEntries().then(() => renderCalendar(calendarCurrentDate));
        });
    }
     console.log('DOM loaded. External script functions should be available.');
     if (typeof navigateToApp === 'undefined') {
         console.error('❌ script.js core functions not defined globally! This can happen if script is deferred or has loading issues.');
         alert('Error: Critical script functions not loaded.');
     } else {
         console.log('✅ script.js core functions seem to be defined.');
     }
});
