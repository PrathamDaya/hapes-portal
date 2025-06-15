// --- FULLY UPDATED script.js with User Login, Attribution, Reply, Dare Game, and Books Functionality ---
// IMPORTANT: If you are using Google Apps Script for feelings/diary data,
// REPLACE THIS WITH YOUR ACTUAL DEPLOYED WEB APP URL from Google Apps Script.
// If you are only using local storage simulation for all features, you can leave this blank or remove it.
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec'; // <<< REPLACE WITH YOUR URL

// DOM Elements (Keep existing ones)
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const dynamicUserNameElements = document.querySelectorAll('.dynamicUserName');

const screens = document.querySelectorAll('.screen');
const feelingsPages = document.querySelectorAll('#feelingsPortalScreen .page');
const diaryPages = document.querySelectorAll('#diaryScreen .page');

// Dare Game Elements (Keep existing ones)
const dareTextElement = document.getElementById('dareText');

// Global variables for application state (Combine existing with new for Books)
let currentUser = ''; 
const SCRIPT_USER_KEY = 'hetuAppCurrentUser'; // Key for local storage for login
let currentEmotion = ''; // For Feelings Portal
let calendarCurrentDate = new Date(); // For Diary
let diaryEntries = {}; // For Diary, assuming this was used for Google Apps Script fetched entries

// This object will simulate a database for storing entries locally
// In a real application, this data would come from a server
let appData = {
    feelingsEntries: [],
    diaryEntries: [],
    // Simulate stored books - In a real app, these would be paths to files on the server
    // For local testing, these are just placeholders.
    books: [
        { id: 'book1', title: 'Sample Book 1', url: 'https://mozilla.github.io/pdf.js/web/compressed.pdf', thumbnailUrl: '' },
        { id: 'book2', title: 'Sample Book 2 (Large)', url: 'https://www.africau.edu/images/default/sample.pdf', thumbnailUrl: '' }
    ]
};

// Initialize appData from localStorage if available
function loadAppData() {
    const storedData = localStorage.getItem('hetuApp');
    if (storedData) {
        appData = JSON.parse(storedData);
        // Ensure 'books' array exists, if not, initialize it or set defaults
        if (!appData.books) {
            appData.books = [
                { id: 'book1', title: 'Sample Book 1', url: 'https://mozilla.github.io/pdf.js/web/compressed.pdf', thumbnailUrl: '' },
                { id: 'book2', title: 'Sample Book 2 (Large)', url: 'https://www.africau.edu/images/default/sample.pdf', thumbnailUrl: '' }
            ];
        }
    }
}

// Save appData to localStorage
function saveAppData() {
    localStorage.setItem('hetuApp', JSON.stringify(appData));
}

document.addEventListener('DOMContentLoaded', function() {
    loadAppData(); // Load data on startup
    // Initialize current screen based on login status or default
    if (localStorage.getItem('loggedInUser')) {
        currentUser = localStorage.getItem('loggedInUser');
        document.getElementById('loggedInUserDisplay').textContent = `User: ${currentUser}`;
        document.querySelectorAll('.dynamicUserName').forEach(span => {
            span.textContent = currentUser;
        });
        navigateToApp('homeScreen');
    } else {
        navigateToApp('loginContainer');
    }
    setupCalendar(); // Ensure calendar is set up on load
    displayCurrentMonth(); // Initial display of calendar
    
    // Check script URL warning
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE') || scriptURL === '') {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL if you are using a Google Apps Script backend.');
    }
});

function login(user) {
    currentUser = user;
    localStorage.setItem('loggedInUser', user);
    document.getElementById('loggedInUserDisplay').textContent = `User: ${currentUser}`;
    // Update all dynamicUserName spans
    document.querySelectorAll('.dynamicUserName').forEach(span => {
        span.textContent = currentUser;
    });
    navigateToApp('homeScreen');
}

function logout() {
    currentUser = '';
    localStorage.removeItem('loggedInUser');
    document.getElementById('loggedInUserDisplay').textContent = 'User: Not logged in';
    navigateToApp('loginContainer');
}

function navigateToApp(screenId) {
    document.querySelectorAll('.screen, #loginContainer').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    // currentAppScreen = screenId; // This variable was not used consistently, relying on active class

    // Specific actions when navigating to a screen
    if (screenId === 'booksScreen') {
        fetchAndDisplayBooks();
    } else if (screenId === 'diaryScreen') {
        setupCalendar(); // Re-initialize calendar if needed
        displayCurrentMonth(); // Ensure correct month is shown
    }
    // Add other screen-specific initializations here if needed
}

// --- Feelings Portal Functions ---
let currentFeelingsType = '';

function navigateToFeelingsPage(pageId, type = '') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'feelingsPage2' && type) {
        currentFeelingsType = type;
        document.querySelector('#feelingsPage2 h2').textContent = `My ${type} Thoughts`;
    }
}

function submitFeelingsEntry() {
    const message = document.getElementById('feelingsMessage').value.trim();
    if (message) {
        const entry = {
            type: currentFeelingsType,
            message: message,
            date: new Date().toLocaleString(),
            user: currentUser
        };
        appData.feelingsEntries.push(entry);
        saveAppData();
        document.getElementById('feelingsMessage').value = '';
        displayFeelingsConfirmation();
    } else {
        alert('Please write something before submitting.');
    }
}

function displayFeelingsConfirmation() {
    const confirmationBox = document.querySelector('#feelingsPage3 .confirmation-box'); // Not directly used here, but good practice
    const messageBox = document.getElementById('feelings-message-box');
    
    // Clear previous content
    messageBox.innerHTML = '';

    // Simulate sending animation
    messageBox.textContent = 'Sending...';
    messageBox.style.opacity = 1;
    messageBox.style.transform = 'translateY(0)';
    document.getElementById('feelings-mail-icon').style.opacity = 1;

    setTimeout(() => {
        messageBox.textContent = 'Sent!';
        setTimeout(() => {
            messageBox.style.opacity = 0;
            messageBox.style.transform = 'translateY(-20px)';
            document.getElementById('feelings-mail-icon').style.opacity = 0;
            navigateToFeelingsPage('feelingsPage3'); // Show the final confirmation screen
        }, 1000);
    }, 1500);
}


function fetchAndDisplayFeelingsEntries() {
    const entriesList = document.getElementById('feelingsEntriesList');
    entriesList.innerHTML = ''; // Clear previous entries

    if (appData.feelingsEntries.length === 0) {
        entriesList.innerHTML = '<p>No feelings entries yet.</p>';
        navigateToFeelingsPage('feelingsViewEntriesPage');
        return;
    }

    appData.feelingsEntries.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

    appData.feelingsEntries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry-item');
        entryDiv.innerHTML = `
            <h3>${entry.type}</h3>
            <p>${entry.message}</p>
            <small>By ${entry.user} on ${entry.date}</small>
        `;
        entriesList.appendChild(entryDiv);
    });
    navigateToFeelingsPage('feelingsViewEntriesPage');
}

// --- Diary Functions ---
let currentMonth, currentYear;

function setupCalendar() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    // displayCurrentMonth() is called at the end of DOMContentLoaded
    // Event listeners are set up once in DOMContentLoaded
}

function displayCurrentMonth() {
    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = ''; // Clear existing days

    const date = new Date(currentYear, currentMonth, 1);
    monthYearDisplay.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Add day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.classList.add('calendar-day', 'day-name');
        dayNameDiv.textContent = day;
        calendarGrid.appendChild(dayNameDiv);
    });

    // Fill in leading empty days
    const firstDayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    // Fill in days of the month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = i;
        dayDiv.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dayDiv.onclick = () => selectDiaryDate(dayDiv.dataset.date);

        // Highlight days with entries
        if (getDiaryEntryForDate(dayDiv.dataset.date)) {
            dayDiv.classList.add('has-entry');
        }

        calendarGrid.appendChild(dayDiv);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    displayCurrentMonth();
}

function getDiaryEntryForDate(date) {
    return appData.diaryEntries.find(entry => entry.date === date);
}

function selectDiaryDate(date) {
    const entry = getDiaryEntryForDate(date);
    document.getElementById('selectedDate').value = date;
    document.getElementById('diaryDateDisplay').textContent = date;
    document.getElementById('diaryEntryTitle').textContent = `Entry for ${date}`;

    if (entry) {
        // If an entry exists, show it in view mode
        document.getElementById('viewDiaryDateDisplay').textContent = date;
        document.getElementById('viewDiaryThoughts').textContent = entry.thoughts;
        document.getElementById('diaryEntryAttribution').textContent = `By ${entry.user}`;
        
        // Clear and prepare reply section
        const replySection = document.getElementById('diaryViewPageReplySection');
        replySection.innerHTML = '';

        if (currentUser !== entry.user) { // Only show reply if not the original author
            const replyLabel = document.createElement('p');
            replyLabel.textContent = `Reply to ${entry.user}'s entry:`;
            replySection.appendChild(replyLabel);

            const replyTextarea = document.createElement('textarea');
            replyTextarea.id = 'diaryReplyThoughts';
            replyTextarea.placeholder = 'Write your reply here...';
            replySection.appendChild(replyTextarea);

            const replyButton = document.createElement('button');
            replyButton.textContent = 'Submit Reply';
            replyButton.onclick = () => submitDiaryReply(date);
            replySection.appendChild(replyButton);
        }

        // Display existing replies
        if (entry.replies && entry.replies.length > 0) {
            const repliesHeader = document.createElement('h4');
            repliesHeader.textContent = 'Replies:';
            replySection.appendChild(repliesHeader);

            entry.replies.forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.classList.add('reply-item');
                replyDiv.innerHTML = `
                    <p>${reply.message}</p>
                    <small>By ${reply.user} on ${reply.date}</small>
                `;
                replySection.appendChild(replyDiv);
            });
        }

        navigateToDiaryPage('diaryViewPage');
    } else {
        // No entry, allow writing a new one
        document.getElementById('diaryThoughts').value = ''; // Clear textarea
        navigateToDiaryPage('diaryEntryPage');
    }
}

function submitDiaryEntry() {
    const date = document.getElementById('selectedDate').value;
    const thoughts = document.getElementById('diaryThoughts').value.trim();

    if (thoughts) {
        const existingEntryIndex = appData.diaryEntries.findIndex(entry => entry.date === date);

        if (existingEntryIndex > -1) {
            // Update existing entry
            appData.diaryEntries[existingEntryIndex].thoughts = thoughts;
            appData.diaryEntries[existingEntryIndex].user = currentUser; // Update user if edited by other person
        } else {
            // Add new entry
            const entry = {
                date: date,
                thoughts: thoughts,
                user: currentUser,
                replies: []
            };
            appData.diaryEntries.push(entry);
        }
        saveAppData();
        displayCurrentMonth(); // Update calendar to show new entry
        navigateToDiaryPage('diaryConfirmationPage');
    } else {
        alert('Please write your diary entry.');
    }
}

function submitDiaryReply(entryDate) {
    const replyMessage = document.getElementById('diaryReplyThoughts').value.trim();
    if (replyMessage) {
        const entry = appData.diaryEntries.find(e => e.date === entryDate);
        if (entry) {
            if (!entry.replies) {
                entry.replies = [];
            }
            entry.replies.push({
                message: replyMessage,
                user: currentUser,
                date: new Date().toLocaleString()
            });
            saveAppData();
            alert('Reply submitted!');
            selectDiaryDate(entryDate); // Re-render the view page with the new reply
        }
    } else {
        alert('Please write your reply.');
    }
}

function fetchAndDisplayAllDiaryEntries() {
    const allEntriesList = document.getElementById('allDiaryEntriesList');
    allEntriesList.innerHTML = '';

    if (appData.diaryEntries.length === 0) {
        allEntriesList.innerHTML = '<p>No diary entries yet.</p>';
        navigateToDiaryPage('allDiaryEntriesPage');
        return;
    }

    appData.diaryEntries.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

    appData.diaryEntries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry-item');
        entryDiv.innerHTML = `
            <h3>${entry.date} <small>by ${entry.user}</small></h3>
            <p>${entry.thoughts.substring(0, 100)}...</p>
            <button onclick="selectDiaryDate('${entry.date}')">Read More</button>
        `;
        allEntriesList.appendChild(entryDiv);
    });
    navigateToDiaryPage('allDiaryEntriesPage');
}

function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// --- Dare Game Functions ---
const dares = [
    "Give your partner a 1-minute massage.",
    "Tell your partner three things you love about them.",
    "Plan a spontaneous date night for this week.",
    "Cook your partner's favorite meal together.",
    "Write a short love letter to your partner.",
    "Take a silly selfie together and share it.",
    "Describe your favorite memory with your partner.",
    "Give your partner a sincere compliment.",
    "Do an activity your partner loves, even if it's not your favorite.",
    "Have a 5-minute dance party to your favorite songs."
];

function generateDare() {
    const dareTextElement = document.getElementById('dareText');
    const randomIndex = Math.floor(Math.random() * dares.length);
    dareTextElement.textContent = dares[randomIndex];
}


// --- New Books Functions ---
function navigateToBooksPage(pageId) {
    document.querySelectorAll('#booksScreen .page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'booksListPage') {
        fetchAndDisplayBooks(); // Refresh book list when going back to it
    }
}

function fetchAndDisplayBooks() {
    const bookListContainer = document.getElementById('bookList');
    bookListContainer.innerHTML = ''; // Clear existing books

    if (appData.books.length === 0) {
        bookListContainer.innerHTML = '<p>No books uploaded yet. Upload your first PDF!</p>';
        return;
    }

    appData.books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.classList.add('book-item');
        bookItem.onclick = () => viewPdf(book.url, book.title);

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('book-thumbnail');
        // In a real app, you'd generate and use book.thumbnailUrl here
        // For simulation, use a generic icon or a placeholder image
        thumbnailDiv.innerHTML = '<span class="pdf-icon">📄</span>'; // Generic PDF icon (You might need to define .pdf-icon in CSS)
        // Or if you have actual thumbnails:
        // if (book.thumbnailUrl) {
        //     const img = document.createElement('img');
        //     img.src = book.thumbnailUrl;
        //     img.alt = book.title;
        //     thumbnailDiv.appendChild(img);
        // } else {
        //     thumbnailDiv.innerHTML = '<span class="pdf-icon">📄</span>';
        // }
        
        const titlePara = document.createElement('p');
        titlePara.textContent = book.title;

        bookItem.appendChild(thumbnailDiv);
        bookItem.appendChild(titlePara);
        bookListContainer.appendChild(bookItem);
    });
}

function uploadPdf() {
    const fileInput = document.getElementById('pdfUploadInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a PDF file to upload.');
        return;
    }

    if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed.');
        return;
    }

    // --- IMPORTANT: This is a client-side simulation ---
    // The uploaded PDF will be loaded into memory via a Blob URL and will NOT persist on page refresh.
    // For persistent storage, you MUST send this file to a server-side backend.
    /*
    Example of what you would do with a backend (Node.js, Python Flask/Django, PHP, etc.):
    const formData = new FormData();
    formData.append('pdfFile', file);

    fetch('/upload-pdf-endpoint', { // Your backend upload endpoint
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('PDF uploaded successfully to server!');
            // Add the new book to appData.books based on server response (e.g., data.bookId, data.bookTitle, data.bookUrl, data.thumbnailUrl)
            const newBookFromServer = { 
                id: data.id, 
                title: data.title, 
                url: data.url, 
                thumbnailUrl: data.thumbnailUrl // Server would ideally provide a thumbnail URL
            };
            appData.books.push(newBookFromServer);
            saveAppData();
            fetchAndDisplayBooks(); // Refresh the list
            fileInput.value = ''; // Clear the input field
        } else {
            alert('Upload failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error uploading PDF:', error);
        alert('An error occurred during upload.');
    });
    */

    // Client-side simulation for immediate testing:
    const blobUrl = URL.createObjectURL(file);
    const newBook = {
        id: 'book-' + Date.now(), // Simple unique ID
        title: file.name.replace('.pdf', ''), // Title from filename
        url: blobUrl, // Use the blob URL for immediate viewing (temporary)
        thumbnailUrl: '' // No real thumbnail generated client-side for this simulation
    };
    appData.books.push(newBook);
    saveAppData();
    fetchAndDisplayBooks(); // Refresh the list
    fileInput.value = ''; // Clear the input
    alert('PDF simulated upload successful! (Note: This PDF will disappear on page refresh as it\'s not saved to a server.)');
}

function viewPdf(pdfUrl, title) {
    document.getElementById('pdfViewerTitle').textContent = title;
    const pdfViewerFrame = document.getElementById('pdfViewerFrame');
    pdfViewerFrame.src = pdfUrl; // Set the PDF source
    navigateToBooksPage('pdfViewerPage');
}

// Event listeners for calendar navigation
document.addEventListener('DOMContentLoaded', () => {
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }
});
