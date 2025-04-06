// Stream browsing and join request functionality

// Update the StreamBrowser class to add stream deletion functionality

class StreamBrowser {
    constructor() {
        this.streamsList = document.getElementById('streams-list');
        this.createStreamBtn = document.getElementById('create-stream-btn');
        this.browseStreamsBtn = document.getElementById('browse-streams-btn');
        this.streamForm = document.getElementById('stream-form');
        this.endStreamBtn = document.getElementById('end-stream-btn');
        this.leaveStreamBtn = document.getElementById('leave-stream-btn');
        this.approveJoinBtn = document.getElementById('approve-join-btn');
        this.rejectJoinBtn = document.getElementById('reject-join-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.requesterNameSpan = document.getElementById('requester-name');
        
        this.currentStreamId = null;
        this.isHost = false;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.createStreamBtn.addEventListener('click', () => {
            showSection('create-stream-section');
        });
        
        this.browseStreamsBtn.addEventListener('click', () => {
            this.loadStreams();
            showSection('browse-streams-section');
        });
        
        this.streamForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createStream();
        });
        
        this.leaveStreamBtn.addEventListener('click', () => {
            this.leaveStream();
        });
        
        this.approveJoinBtn.addEventListener('click', () => {
            this.handleJoinRequest(true);
        });
        
        this.rejectJoinBtn.addEventListener('click', () => {
            this.handleJoinRequest(false);
        });
        
        this.confirmDeleteBtn.addEventListener('click', () => {
            this.deleteStream();
        });
        
        this.cancelDeleteBtn.addEventListener('click', () => {
            hideModal('delete-stream-modal');
        });
        
        // Check for join requests periodically (simulating real-time)
        setInterval(() => {
            if (this.isHost && this.currentStreamId) {
                this.checkJoinRequests();
            }
        }, 2000);
    }
    
    loadStreams() {
        // Clear existing streams
        this.streamsList.innerHTML = '';
        
        // Get public streams
        const streams = getPublicStreams();
        
        if (streams.length === 0) {
            this.streamsList.innerHTML = '<p>No streams available. Be the first to create one!</p>';
            return;
        }
        
        // Display streams
        streams.forEach(stream => {
            this.displayStreamCard(stream);
        });
    }
    
    // Update the displayStreamCard method in the StreamBrowser class
    
    // Update the StreamBrowser class to support passive viewing and active participation
    
    displayStreamCard(stream) {
        const streamCard = document.createElement('div');
        streamCard.className = 'stream-card';
        
        // Generate a random placeholder color for the stream thumbnail
        const colors = ['#6441a5', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        streamCard.innerHTML = `
            <div class="stream-card-header">
                <h3><i class="fas fa-broadcast-tower"></i> ${stream.title}</h3>
            </div>
            <div class="stream-thumbnail" style="background-color: ${randomColor}; height: 160px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-video" style="font-size: 3rem; color: rgba(255,255,255,0.7);"></i>
            </div>
            <div class="stream-card-body">
                <p><i class="fas fa-user"></i> Host: ${stream.host}</p>
                <p><i class="fas fa-lock${stream.type === 'public' ? '-open' : ''}"></i> Type: ${stream.type.charAt(0).toUpperCase() + stream.type.slice(1)}</p>
                <p><i class="fas fa-clock"></i> Started: ${formatTimestamp(stream.createdAt)}</p>
                <p><i class="fas fa-users"></i> Viewers: ${stream.viewers ? stream.viewers.length : 0}</p>
            </div>
            <div class="stream-card-actions">
                <button class="watch-stream-btn" data-stream-id="${stream.id}">
                    <i class="fas fa-eye"></i> Watch Stream
                </button>
                <button class="join-stream-btn" data-stream-id="${stream.id}">
                    <i class="fas fa-sign-in-alt"></i> Participate
                </button>
            </div>
        `;
        
        // Add event listeners to buttons
        const watchBtn = streamCard.querySelector('.watch-stream-btn');
        watchBtn.addEventListener('click', () => {
            this.watchStream(stream.id);
        });
        
        const joinBtn = streamCard.querySelector('.join-stream-btn');
        joinBtn.addEventListener('click', () => {
            this.requestToJoin(stream.id);
        });
        
        this.streamsList.appendChild(streamCard);
    }
    
    createStream() {
        const title = document.getElementById('stream-title').value.trim();
        const type = document.getElementById('stream-type').value;
        
        if (title) {
            const stream = {
                id: generateId(),
                host: getCurrentUser(),
                title: title,
                type: type,
                joinRequests: [],
                viewers: [],
                active: true,
                createdAt: Date.now()
            };
            
            // Save stream to localStorage
            saveStream(stream);
            
            // Start hosting the stream
            this.startHosting(stream.id);
        }
    }
    
    startHosting(streamId) {
        this.currentStreamId = streamId;
        this.isHost = true;
        
        // Get stream details
        const stream = getStreamById(streamId);
        
        // Update UI
        document.getElementById('stream-view-title').textContent = stream.title;
        document.getElementById('stream-host').textContent = stream.host;
        
        // Initialize video call as host
        videoCall.startHostStream(streamId);
        
        // Initialize chat
        chat.setCurrentStream(streamId);
        
        // Show stream view section
        showSection('stream-view-section');
    }
    
    requestToJoin(streamId) {
        const stream = getStreamById(streamId);
        
        if (stream) {
            // Add join request
            stream.joinRequests.push({
                id: generateId(),
                user: getCurrentUser(),
                timestamp: Date.now(),
                status: 'pending'
            });
            
            // Update stream in localStorage
            updateStream(stream);
            
            // Show message to user
            alert(`Join request sent to ${stream.host}. Please wait for approval.`);
            
            // Check for approval periodically (simulating real-time)
            this.checkJoinApproval(streamId);
        }
    }
    
    checkJoinApproval(streamId) {
        // In a real app, this would be handled by WebSockets
        // For this demo, we'll poll localStorage
        const checkInterval = setInterval(() => {
            const stream = getStreamById(streamId);
            
            if (!stream) {
                clearInterval(checkInterval);
                return;
            }
            
            const currentUser = getCurrentUser();
            const request = stream.joinRequests.find(req => req.user === currentUser);
            
            if (request && request.status === 'approved') {
                clearInterval(checkInterval);
                this.joinStream(streamId);
            } else if (request && request.status === 'rejected') {
                clearInterval(checkInterval);
                alert('Your join request was rejected by the host.');
            }
        }, 2000);
    }
    
    checkJoinRequests() {
        const stream = getStreamById(this.currentStreamId);
        
        if (stream) {
            const pendingRequests = stream.joinRequests.filter(req => req.status === 'pending');
            
            if (pendingRequests.length > 0) {
                // Show the first pending request
                const request = pendingRequests[0];
                this.showJoinRequestModal(request);
            }
        }
    }
    
    showJoinRequestModal(request) {
        this.requesterNameSpan.textContent = request.user;
        this.currentRequest = request;
        showModal('join-request-modal');
    }
    
    handleJoinRequest(approved) {
        if (this.currentRequest) {
            const stream = getStreamById(this.currentStreamId);
            
            if (stream) {
                // Find the request in the stream
                const requestIndex = stream.joinRequests.findIndex(req => 
                    req.user === this.currentRequest.user && req.status === 'pending'
                );
                
                if (requestIndex !== -1) {
                    // Update request status
                    stream.joinRequests[requestIndex].status = approved ? 'approved' : 'rejected';
                    
                    // If approved, add user to viewers
                    if (approved) {
                        stream.viewers.push({
                            user: this.currentRequest.user,
                            joinedAt: Date.now()
                        });
                    }
                    
                    // Update stream in localStorage
                    updateStream(stream);
                }
            }
            
            // Hide modal
            hideModal('join-request-modal');
            this.currentRequest = null;
        }
    }

    watchStream(streamId) {
        this.currentStreamId = streamId;
        this.isHost = false;
        this.isParticipant = false;
        
        // Get stream details
        const stream = getStreamById(streamId);
        
        if (!stream) {
            showAlert('Stream Error', 'This stream no longer exists.', 'error');
            return;
        }
        
        // Update UI
        document.getElementById('stream-view-title').textContent = stream.title;
        document.getElementById('stream-host').textContent = stream.host;
        
        // Add as a passive viewer
        if (!stream.passiveViewers) {
            stream.passiveViewers = [];
        }
        
        stream.passiveViewers.push({
            user: getCurrentUser(),
            joinedAt: Date.now()
        });
        
        updateStream(stream);
        
        // Initialize chat only (no video)
        chat.setCurrentStream(streamId);
        
        // Hide viewer video container
        document.querySelector('.viewer-video').style.display = 'none';
        
        // Update control buttons visibility
        document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'block');
        
        // Hide audio/video/screen controls for passive viewers
        document.getElementById('mute-audio-btn').style.display = 'none';
        document.getElementById('mute-video-btn').style.display = 'none';
        document.getElementById('share-screen-btn').style.display = 'none';
        
        // Show stream view section
        showSection('stream-view-section');
        
        showAlert('Watching Stream', `You are now watching ${stream.host}'s stream.`, 'success');
    }
    
    // Update the joinStream method to mark as participant
    joinStream(streamId) {
        this.currentStreamId = streamId;
        this.isHost = false;
        this.isParticipant = true;
        
        // Get stream details
        const stream = getStreamById(streamId);
        
        if (!stream) {
            showAlert('Stream Error', 'This stream no longer exists.', 'error');
            return;
        }
        
        // Update UI
        document.getElementById('stream-view-title').textContent = stream.title;
        document.getElementById('stream-host').textContent = stream.host;
        
        // Initialize video call as participant
        videoCall.joinStream(streamId);
        
        // Initialize chat
        chat.setCurrentStream(streamId);
        
        // Show viewer video container
        document.querySelector('.viewer-video').style.display = 'block';
        
        // Update control buttons visibility
        document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.participant-only').forEach(el => el.style.display = 'block');
        
        // Show audio/video/screen controls for participants
        document.getElementById('mute-audio-btn').style.display = 'block';
        document.getElementById('mute-video-btn').style.display = 'block';
        document.getElementById('share-screen-btn').style.display = 'block';
        
        // Show stream view section
        showSection('stream-view-section');
        
        showAlert('Joined Stream', `You are now participating in ${stream.host}'s stream.`, 'success');
    }
    
    // Update the leaveStream method
    leaveStream() {
        if (this.isHost) {
            // Show delete confirmation if host
            showModal('delete-stream-modal');
        } else {
            const stream = getStreamById(this.currentStreamId);
            
            if (stream) {
                if (this.isParticipant) {
                    // Remove from active participants
                    const viewerIndex = stream.viewers.findIndex(viewer => viewer.user === getCurrentUser());
                    
                    if (viewerIndex !== -1) {
                        stream.viewers.splice(viewerIndex, 1);
                    }
                } else {
                    // Remove from passive viewers
                    if (stream.passiveViewers) {
                        const viewerIndex = stream.passiveViewers.findIndex(viewer => viewer.user === getCurrentUser());
                        
                        if (viewerIndex !== -1) {
                            stream.passiveViewers.splice(viewerIndex, 1);
                        }
                    }
                }
                
                updateStream(stream);
            }
            
            // End video call if participant
            if (this.isParticipant) {
                videoCall.endCall();
            }
            
            // Clear chat
            chat.clear();
            
            // Reset state
            this.currentStreamId = null;
            this.isHost = false;
            this.isParticipant = false;
            
            // Show success message
            showAlert('Stream Left', 'You have left the stream.', 'info');
            
            // Show browse section
            this.loadStreams();
            showSection('browse-streams-section');
        }
    }
    
    // Add this method after the leaveStream method
    deleteStream() {
        const stream = getStreamById(this.currentStreamId);
        
        if (stream) {
            // Remove the stream from localStorage
            deleteStream(this.currentStreamId);
            
            // End video call
            videoCall.endCall();
            
            // Clear chat
            chat.clear();
            
            // Reset state
            this.currentStreamId = null;
            this.isHost = false;
            this.isParticipant = false;
            
            // Show success message
            showAlert('Stream Ended', 'Your stream has been ended successfully.', 'success');
            
            // Show browse section
            this.loadStreams();
            showSection('browse-streams-section');
        }
        
        // Hide modal
        hideModal('delete-stream-modal');
    }
}

// Create a global instance
const streamBrowser = new StreamBrowser();