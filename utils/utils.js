// Utility functions for the app

// Generate a random ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Play gift sound
function playGiftSound() {
    const isMuted = document.getElementById('mute-gift-sound').checked;
    if (!isMuted) {
        const audio = new Audio('assets/sounds/gift-sound.mp3');
        audio.play();
    }
}

// Show a section and hide others
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section, .active-section').forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('section');
    });
    
    // Show the requested section
    const section = document.getElementById(sectionId);
    section.classList.remove('section');
    section.classList.add('active-section');
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

// Hide modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Get current user
function getCurrentUser() {
    return localStorage.getItem('username') || 'Guest';
}

// Save stream to localStorage
function saveStream(stream) {
    const streams = getStreams();
    streams.push(stream);
    localStorage.setItem('streams', JSON.stringify(streams));
}

// Get all streams from localStorage
function getStreams() {
    const streams = localStorage.getItem('streams');
    return streams ? JSON.parse(streams) : [];
}

// Get public streams
function getPublicStreams() {
    return getStreams().filter(stream => stream.type === 'public');
}

// Get stream by ID
function getStreamById(streamId) {
    const streams = getStreams();
    return streams.find(stream => stream.id === streamId);
}

// Update stream in localStorage
function updateStream(updatedStream) {
    const streams = getStreams();
    const index = streams.findIndex(stream => stream.id === updatedStream.id);
    
    if (index !== -1) {
        streams[index] = updatedStream;
        localStorage.setItem('streams', JSON.stringify(streams));
    }
}

// Remove stream from localStorage
function removeStream(streamId) {
    const streams = getStreams();
    const filteredStreams = streams.filter(stream => stream.id !== streamId);
    localStorage.setItem('streams', JSON.stringify(filteredStreams));
}

// Show custom alert
function showAlert(title, message, type = 'info') {
    const alertElement = document.getElementById('custom-alert');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const alertIcon = alertElement.querySelector('i');
    
    // Set content
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    // Set icon based on type
    alertIcon.className = 'fas';
    switch (type) {
        case 'success':
            alertIcon.classList.add('fa-check-circle');
            alertIcon.style.color = 'var(--success)';
            break;
        case 'warning':
            alertIcon.classList.add('fa-exclamation-triangle');
            alertIcon.style.color = 'var(--warning)';
            break;
        case 'error':
            alertIcon.classList.add('fa-times-circle');
            alertIcon.style.color = 'var(--danger)';
            break;
        default:
            alertIcon.classList.add('fa-info-circle');
            alertIcon.style.color = 'var(--primary-color)';
    }
    
    // Show alert
    alertElement.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 3000);
}

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}


// Add this function to delete a specific stream
function deleteStream(streamId) {
    const streams = JSON.parse(localStorage.getItem('streams') || '[]');
    const updatedStreams = streams.filter(stream => stream.id !== streamId);
    localStorage.setItem('streams', JSON.stringify(updatedStreams));
}

// Add this function to clear all streams
function clearAllStreams() {
    localStorage.removeItem('streams');
    showAlert('Streams Cleared', 'All streams have been removed successfully.', 'success');
}