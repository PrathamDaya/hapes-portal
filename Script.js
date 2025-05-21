// script.js
const scriptURL = 'https://script.google.com/macros/s/AKfycbw11-sZBdkaxqiKzKeLtkOBs5KZaABiz2BkEIsUTI2a2TGRUDXLFhb-GEKPZqEd0eEREQ/exec'; // This needs to be YOUR Google Apps Script URL
const pages = document.querySelectorAll('.page');
let currentEmotion = '';
let diaryCalendarInstance = null;
let datesWithEntries = []; // To store dates that have entries

// --- Navigation ---
function navigateTo(pageId, context = null) {
    pages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error("Page not found:", pageId);
        document.getElementById('page1').classList.add('active'); // Fallback to home
        return;
    }

    currentEmotion = ''; // Reset emotion

    if (pageId === 'page1') {
        // Optional: Reset or clear things when going to home
    } else if (pageId === 'page2' && context) { // Existing feeling entry
        currentEmotion = context; // context is emotion here
        document.querySelector('#page2 h2').textContent = `You selected: ${currentEmotion}. Please let me know your thoughts.`;
    } else if (pageId === 'page3') { // Existing thank you page
        const messageBox = document.getElementById('message-box');
        const messageTextarea = document.getElementById('message');
        if (messageTextarea && messageBox) { // Check if elements exist
            messageBox.textContent = messageTextarea.value.substring(0, 20) + '...';
        }
    } else if (pageId === 'diaryPage') {
        initializeCalendar();
        // Fetch and highlight dates with entries when navigating to diary page
        fetchDatesWithEntries().then(dates => {
            datesWithEntries = dates;
            if (diaryCalendarInstance) {
                diaryCalendarInstance.redraw(); // Redraw to apply custom date styling
                diaryCalendarInstance.refresh();
            }
        });
    } else if (pageId === 'diaryEntryPage' && context) { // context is the selected date string
        const dateStr = context;
        document.getElementById('selectedDateDisplay').textContent = formatDateForDisplay(dateStr);
        document.getElementById('diaryDate').value = dateStr;
        // Clear previous entry form data
        document.getElementById('diaryThoughts').value = '';
        document.getElementById('diaryPhoto').value = '';
        document.getElementById('diaryVideo').value = '';
        // Potentially load existing entry if any for this date (advanced)
    }
}

// --- Existing Feeling Submission ---
function submitEntry() {
    const messageInput = document.getElementById('message');
    if (!messageInput) {
        console.error("Message input not found for feeling entry.");
        alert('An unexpected error occurred. Please try again.');
        return;
    }
    const message = messageInput.value;
    if (!message.trim()) {
        alert('Please enter your thoughts.');
        return;
    }

    const timestamp = new Date().toISOString();
    const formData = new FormData();
    formData.append('timestamp', timestamp);
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('sheetName', 'Sheet1'); // Specify sheet for feelings

    // Show a generic loading/processing indicator if you have one
    // For now, relying on browser's default fetch behavior

    fetch(scriptURL, {
        method: 'POST',
        body: formData // Sending as FormData
    })
    .then(response => {
        if (!response.ok) {
            // Try to get more error info from response if possible
            return response.text().then(text => {
                 throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.result === "success") {
            console.log('Feeling Success!', data);
            navigateTo('page3');
            messageInput.value = ''; // Clear the textarea
        } else {
            console.error('Feeling submission error:', data.message || 'Unknown error from server');
            alert('There was an error submitting your entry: ' + (data.message || 'Please try again.'));
        }
    })
    .catch((error) => {
        console.error('Error submitting feeling!', error);
        alert(`There was an error submitting your entry: ${error.message}. Please try again later.`);
    });
}


// --- Diary Feature ---

function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function initializeCalendar() {
    if (diaryCalendarInstance) {
        // Optional: Refresh or update if needed, but flatpickr handles redraws
        return;
    }
    const calendarInput = document.getElementById('diaryCalendar');
    if (!calendarInput) {
        console.error("Calendar input #diaryCalendar not found!");
        return;
    }
    diaryCalendarInstance = flatpickr(calendarInput, {
        inline: true, // Show calendar directly, not as a dropdown
        dateFormat: "Y-m-d", // Store date in this format
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                navigateTo('diaryEntryPage', dateStr);
            }
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            // Add custom class if the date has an entry
            if (datesWithEntries.includes(dayElem.dateObj.toISOString().split('T')[0])) {
                dayElem.classList.add("has-entry");
            }
        },
        // You might want to add month/year navigation if `inline:true` doesn't provide it as you like.
        // Flatpickr's inline calendar usually has these.
    });
}

function fetchDatesWithEntries() {
    // Show spinner if any
    return new Promise((resolve, reject) => {
        if (!google || !google.script || !google.script.run) {
             console.warn("Google Apps Script API not available. Serving from localhost or script not loaded.");
             // For local testing, return dummy data or an empty array
             resolve([]); // Or resolve(['2025-05-20', '2025-05-15']) for testing highlights
             return;
        }
        google.script.run
            .withSuccessHandler(response => {
                if (response.error) {
                    console.error("Error fetching dates with entries:", response.error);
                    resolve([]);
                } else {
                    resolve(response.dates || []);
                }
            })
            .withFailureHandler(error => {
                console.error('Failed to call getDatesWithEntries:', error);
                resolve([]);
            })
            .getDatesWithEntries(); // This function needs to be in your Google Apps Script
    });
}


function submitDiaryEntry() {
    const date = document.getElementById('diaryDate').value;
    const thoughts = document.getElementById('diaryThoughts').value;
    const photoFile = document.getElementById('diaryPhoto').files[0];
    const videoFile = document.getElementById('diaryVideo').files[0];
    const spinner = document.getElementById('diaryLoadingSpinner');

    if (!date) {
        alert('Date is missing. Please select a date from the calendar.');
        return;
    }
    if (!thoughts.trim() && !photoFile && !videoFile) {
        alert('Please write some thoughts or upload a photo/video.');
        return;
    }

    spinner.style.display = 'block'; // Show spinner

    // We need to read files as base64 to send to Google Apps Script
    // This involves Promises to handle asynchronous file reading

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null); // No file, resolve with null
                return;
            }
            // Basic size check (example: 10MB for photos, 50MB for videos)
            if (file.type.startsWith("image/") && file.size > 10 * 1024 * 1024) {
                reject(new Error(`Photo "${file.name}" is too large (max 10MB).`));
                return;
            }
            if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
                 reject(new Error(`Video "${file.name}" is too large (max 50MB).`));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                // result is "data:mime/type;base64,THE_BASE_64_STRING"
                // We need to split this to send to Apps Script
                const base64Data = reader.result.split(',')[1];
                resolve({
                    fileName: file.name,
                    mimeType: file.type,
                    base64Data: base64Data
                });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    Promise.all([readFileAsBase64(photoFile), readFileAsBase64(videoFile)])
    .then(([photoData, videoData]) => {
        const entryData = {
            timestamp: new Date().toISOString(),
            date: date,
            thoughts: thoughts,
            photo: photoData, // Will be null if no photo selected, or {fileName, mimeType, base64Data}
            video: videoData, // Will be null if no video selected
            sheetName: 'Sheet2' // Specify sheet for diary entries
        };

        // Check if google.script.run is available (it won't be if served from file://)
        if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
                .withSuccessHandler(response => {
                    spinner.style.display = 'none'; // Hide spinner
                    if (response.result === "success") {
                        alert('Diary entry saved successfully!');
                        if (!datesWithEntries.includes(date)) { // Add to local list and refresh calendar highlights
                            datesWithEntries.push(date);
                        }
                        navigateTo('diaryPage'); // Go back to calendar view
                        // Optionally, clear the form, though navigating away might be enough
                        document.getElementById('diaryThoughts').value = '';
                        document.getElementById('diaryPhoto').value = '';
                        document.getElementById('diaryVideo').value = '';
                    } else {
                        console.error("Server error saving diary entry:", response);
                        alert('Error saving diary entry: ' + (response.message || 'Unknown server error.'));
                    }
                })
                .withFailureHandler(error => {
                    spinner.style.display = 'none'; // Hide spinner
                    console.error('Failure saving diary entry:', error);
                    alert('Failed to save diary entry: ' + error.message + '. Check console for details.');
                })
                .saveDiaryEntry(entryData); // This will be your Google Apps Script function
        } else {
            spinner.style.display = 'none'; // Hide spinner
            // Fallback for local testing without Google Apps Script
            console.warn("google.script.run not available. Simulating diary save.");
            console.log("Simulated diary entry data:", entryData);
            alert("Diary entry would be saved (simulated). Check console.");
            navigateTo('diaryPage');
        }
    })
    .catch(error => {
        spinner.style.display = 'none'; // Hide spinner
        console.error("Error processing files:", error);
        alert("Error processing files: " + error.message);
    });
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on page1 to initialize things, or if direct navigation is needed
    const initialActivePage = document.querySelector('.page.active');
    if (initialActivePage) {
        navigateTo(initialActivePage.id); // Ensure correct initialization based on active page
    } else {
        navigateTo('page1'); // Default to page1 if no active page set in HTML
    }

    // If the diary page is active on load, initialize its calendar.
    // This might happen if the user reloads the page while on the diary page.
    if (document.getElementById('diaryPage').classList.contains('active')) {
        initializeCalendar();
        fetchDatesWithEntries().then(dates => {
            datesWithEntries = dates;
            if (diaryCalendarInstance) {
                diaryCalendarInstance.redraw();
                diaryCalendarInstance.refresh();
            }
        });
    }
});
