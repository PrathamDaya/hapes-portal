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

    document.getElementById('viewDiaryDateDisplay').textContent = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('viewDiaryThoughts').textContent = entry.thoughts || 'No thoughts.';
    navigateToDiaryPage('diaryViewPage');
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value.trim();
    const date = document.getElementById('selectedDate').value; // Should be YYYY-MM-DD

    if (!date) { 
        alert('No date selected.'); 
        return; 
    }
    if (!thoughts) { 
        alert('Please write some thoughts.'); 
        return; 
    }

    // Validate that we have the script URL configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        alert('Please update the scriptURL in script.js with your Google Apps Script web app URL.');
        return;
    }

    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);

    const submitBtn = document.querySelector('#diaryEntryPage button[onclick="submitDiaryEntry()"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    console.log('Submitting diary entry:', { date: date, thoughts: thoughts });

    fetch(scriptURL, { 
        method: 'POST', 
        body: formData,
        mode: 'cors'
    })
        .then(response => {
            console.log('Diary response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => { 
                    console.error('Diary error response:', text);
                    throw new Error(`HTTP error! ${response.status}, ${text}`) 
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Diary server response:', data);
            if (data.status === 'error') {
                throw new Error(data.message || 'Error saving diary from server.');
            }
            console.log('Diary Entry Success!', data);
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
                navigateToDiaryPage('diaryConfirmationPage');
            });
        })
        .catch(error => {
            console.error('Diary Entry Error!', error);
            alert('Error saving diary entry.\n' + error.message);
        })
        .finally(() => {
            if (submitBtn) { 
                submitBtn.textContent = originalBtnText; 
                submitBtn.disabled = false; 
            }
        });
}

async function fetchAndDisplayAllDiaryEntries() {
    console.log('Fetching all diary entries list...');
    const listContainer = document.getElementById('allDiaryEntriesList');
    if (!listContainer) { 
        console.error('"allDiaryEntriesList" not found.'); 
        return; 
    }
    listContainer.innerHTML = '<p>Loading entries...</p>';

    try {
        const response = await fetch(`${scriptURL}?action=getDiaryEntries`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) { 
            const errorText = await response.text(); 
            console.error('All diary entries fetch error:', errorText);
            throw new Error(`HTTP error! ${response.status}, ${errorText}`);
        }
        
        const serverData = await response.json();
        console.log('All diary entries data:', serverData);
        listContainer.innerHTML = '';

        if (serverData.status === 'success' && serverData.data && serverData.data.length > 0) {
            const sortedEntries = serverData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedEntries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('diary-entry-list-item');
                const dateParts = entry.date.split('-');
                let formattedDate = entry.date;
                
                if (dateParts.length === 3) {
                    const entryDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    if (!isNaN(entryDateObj.getTime())) {
                        formattedDate = entryDateObj.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                    }
                }
                
                entryDiv.innerHTML = `<h3>${formattedDate}</h3><p>${entry.thoughts || 'No thoughts.'}</p><hr>`;
                listContainer.appendChild(entryDiv);
            });
        } else if (serverData.status === 'success' && (!serverData.data || serverData.data.length === 0)) {
            listContainer.innerHTML = '<p>No diary entries recorded yet.</p>';
        } else {
            listContainer.innerHTML = `<p>Could not load entries: ${serverData.message || 'Unknown response'}</p>`;
        }
        navigateToDiaryPage('allDiaryEntriesPage');
    } catch (error) {
        console.error('Failed to fetch all diary entries list:', error);
        if (listContainer) {
            listContainer.innerHTML = '<p>Error loading all diary entries.</p>';
        }
        alert('Error loading all diary entries.\n' + error.message);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if script URL is configured
    if (scriptURL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.warn('⚠️ IMPORTANT: Please update the scriptURL in script.js with your Google Apps Script web app URL.');
    }
    
    navigateToApp('homeScreen');
    
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
