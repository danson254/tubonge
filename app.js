// Main application logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initApp();
    
    // Set up modal buttons
    setupModalButtons();
});

function setupModalButtons() {
    // Set up confirm clear streams modal buttons
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', () => {
            clearAllStreams();
            streamBrowser.loadStreams(); // Refresh the streams list
            hideModal('confirm-clear-streams-modal');
        });
    }
    
    const cancelClearBtn = document.getElementById('cancel-clear-btn');
    if (cancelClearBtn) {
        cancelClearBtn.addEventListener('click', () => {
            hideModal('confirm-clear-streams-modal');
        });
    }
    
    // Set up confirm delete stream modal buttons
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            streamBrowser.deleteStream();
        });
    }
    
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            hideModal('delete-stream-modal');
        });
    }
}

function initApp() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    
    if (username) {
        // Update UI with username
        document.getElementById('username').textContent = username;
        
        // Show browse streams section
        streamBrowser.loadStreams();
        showSection('browse-streams-section');
    } else {
        // Show welcome section for login
        showSection('welcome-section');
    }
    
    // Set up login button
    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', handleLogin);
    
    // Set up clear streams button
    const clearStreamsBtn = document.getElementById('clear-streams-btn');
    if (clearStreamsBtn) {
        clearStreamsBtn.addEventListener('click', handleClearStreams);
    }
    
    // Set up confirm clear streams modal buttons
    document.addEventListener('DOMContentLoaded', () => {
        const confirmClearBtn = document.getElementById('confirm-clear-btn');
        if (confirmClearBtn) {
            confirmClearBtn.addEventListener('click', () => {
                clearAllStreams();
                hideModal('confirm-clear-streams-modal');
            });
        }
        
        const cancelClearBtn = document.getElementById('cancel-clear-btn');
        if (cancelClearBtn) {
            cancelClearBtn.addEventListener('click', () => {
                hideModal('confirm-clear-streams-modal');
            });
        }
    });
}

function handleLogin() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    
    if (username) {
        // Save username to localStorage
        localStorage.setItem('username', username);
        
        // Update UI with username
        document.getElementById('username').textContent = username;
        
        // Show success message
        showAlert('Welcome!', `You're logged in as ${username}`, 'success');
        
        // Show browse streams section
        streamBrowser.loadStreams();
        showSection('browse-streams-section');
    } else {
        showAlert('Login Error', 'Please enter a username', 'error');
    }
}

// Function to handle clearing all streams
function handleClearStreams() {
    // Use our custom alert instead of window.confirm
    showModal('confirm-clear-streams-modal');
}

// Function to actually clear all streams
function clearAllStreams() {
    // Remove all streams from localStorage
    localStorage.removeItem('streams');
    
    // Refresh the streams list
    streamBrowser.loadStreams();
    
    // Show success message
    showAlert('Streams Cleared', 'All streams have been removed successfully.', 'success');
}
// Create a sample gift sound file (in a real app, you would have an actual sound file)
// This is just a placeholder to demonstrate the concept
function createSampleGiftSound() {
    // Create a simple audio context and oscillator
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start and stop the oscillator to create a short beep
    oscillator.start();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // In a real app, you would use an actual sound file instead of generating one
}