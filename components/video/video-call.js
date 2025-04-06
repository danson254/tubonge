// WebRTC video call functionality

class VideoCall {
    constructor() {
        this.hostVideo = document.getElementById('host-video');
        this.viewerVideo = document.getElementById('viewer-video');
        this.muteAudioBtn = document.getElementById('mute-audio-btn');
        this.muteVideoBtn = document.getElementById('mute-video-btn');
        this.shareScreenBtn = document.getElementById('share-screen-btn');
        this.noiseSuppressionBtn = document.getElementById('noise-suppression-btn');
        this.endStreamBtn = document.getElementById('end-stream-btn');
        
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        this.isScreenSharing = false;
        this.isNoiseSuppressionEnabled = true;
        this.isHost = false;
        
        this.localStream = null;
        this.screenStream = null;
        this.streamId = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.muteAudioBtn.addEventListener('click', () => {
            this.toggleAudio();
        });
        
        this.muteVideoBtn.addEventListener('click', () => {
            this.toggleVideo();
        });
        
        this.shareScreenBtn.addEventListener('click', () => {
            this.toggleScreenShare();
        });
        
        this.noiseSuppressionBtn.addEventListener('click', () => {
            this.toggleNoiseSuppression();
        });
        
        // Add event listener for end stream button
        if (this.endStreamBtn) {
            this.endStreamBtn.addEventListener('click', () => {
                showModal('delete-stream-modal');
            });
        }
    }
    
    async toggleNoiseSuppression() {
        this.isNoiseSuppressionEnabled = !this.isNoiseSuppressionEnabled;
        
        if (this.localStream) {
            // Stop current tracks
            this.localStream.getTracks().forEach(track => track.stop());
            
            // Get new media stream with updated noise suppression setting
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: this.isNoiseSuppressionEnabled,
                        autoGainControl: true
                    }
                });
                
                // Update video element
                if (this.isHost) {
                    this.hostVideo.srcObject = this.localStream;
                } else {
                    this.viewerVideo.srcObject = this.localStream;
                }
                
                // Update button UI
                if (this.isNoiseSuppressionEnabled) {
                    this.noiseSuppressionBtn.classList.add('active');
                    showAlert('Noise Suppression', 'Noise suppression has been enabled.', 'success');
                } else {
                    this.noiseSuppressionBtn.classList.remove('active');
                    showAlert('Noise Suppression', 'Noise suppression has been disabled.', 'info');
                }
            } catch (error) {
                console.error('Error updating media stream:', error);
                showAlert('Media Error', 'Could not update media settings.', 'error');
            }
        }
    }
    
    // Add to the startHostStream method after getting local stream
    async startHostStream(streamId) {
        try {
            showLoading();
            
            // Set host flag
            this.isHost = true;
            
            // Get user media with noise suppression enabled
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Display stream
            this.hostVideo.srcObject = this.localStream;
            
            // Save stream ID
            this.streamId = streamId;
            
            // Initialize signaling for multi-device streaming
            await signaling.joinChannel(streamId, true, this.localStream);
            
            // Handle remote streams (from viewers)
            signaling.setOnRemoteStream((stream, userId) => {
                // In a real app, you would create a new video element for each viewer
                console.log(`Received stream from viewer: ${userId}`);
            });
            
            // Show host controls, hide viewer controls
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'none');
            
            hideLoading();
            showAlert('Stream Started', 'Your stream has started successfully! Share your stream ID for others to join.', 'success');
        } catch (error) {
            console.error('Error starting host stream:', error);
            hideLoading();
            showAlert('Stream Error', 'Could not start stream. Please check your camera and microphone permissions.', 'error');
        }
    }
    
    // Update the joinStream method
    async joinStream(streamId) {
        try {
            showLoading();
            
            // Set host flag to false
            this.isHost = false;
            
            // Get user media with noise suppression enabled
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Display local stream
            this.viewerVideo.srcObject = this.localStream;
            
            // Save stream ID
            this.streamId = streamId;
            
            // Initialize signaling and connect to host
            await signaling.joinChannel(streamId, false, this.localStream);
            
            // Handle remote stream (from host)
            signaling.setOnRemoteStream((stream) => {
                this.hostVideo.srcObject = stream;
            });
            
            // Show viewer controls, hide host controls
            document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
            
            hideLoading();
            showAlert('Joined Stream', 'You have joined the stream successfully!', 'success');
        } catch (error) {
            console.error('Error joining stream:', error);
            hideLoading();
            showAlert('Join Error', 'Could not join stream. Please check your camera and microphone permissions.', 'error');
        }
    }
    
    // Update the endCall method to close signaling connections
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }
        
        // End stream or leave channel
        if (this.isHost) {
            signaling.endStream();
        } else {
            signaling.leaveChannel();
        }
        
        // Reset video elements
        this.hostVideo.srcObject = null;
        this.viewerVideo.srcObject = null;
        
        // Reset state
        this.localStream = null;
        this.screenStream = null;
        this.streamId = null;
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        this.isScreenSharing = false;    }
    
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false // Audio from screen sharing often causes feedback
                });
                
                // Save the original video track to restore later
                this.originalVideoTrack = this.localStream.getVideoTracks()[0];
                
                // Replace video track with screen track
                const screenTrack = this.screenStream.getVideoTracks()[0];
                
                // Update the local video display
                if (this.isHost) {
                    this.hostVideo.srcObject = this.screenStream;
                } else {
                    this.viewerVideo.srcObject = this.screenStream;
                }
                
                // Update button UI
                this.shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
                this.shareScreenBtn.querySelector('.tooltip-text').textContent = 'Stop Sharing';
                this.shareScreenBtn.classList.add('active');
                
                // Set flag
                this.isScreenSharing = true;
                
                // Listen for the end of screen sharing
                screenTrack.addEventListener('ended', () => {
                    this.stopScreenSharing();
                });
                
                showAlert('Screen Sharing', 'You are now sharing your screen.', 'success');
            } else {
                // Stop screen sharing
                this.stopScreenSharing();
            }
        } catch (error) {
            console.error('Error toggling screen share:', error);
            showAlert('Screen Share Error', 'Could not share screen. Please try again.', 'error');
        }
    }
    
    stopScreenSharing() {
        if (this.screenStream) {
            // Stop all screen tracks
            this.screenStream.getTracks().forEach(track => track.stop());
            
            // Restore original video
            if (this.localStream) {
                if (this.isHost) {
                    this.hostVideo.srcObject = this.localStream;
                } else {
                    this.viewerVideo.srcObject = this.localStream;
                }
            }
            
            // Update button UI
            this.shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
            this.shareScreenBtn.querySelector('.tooltip-text').textContent = 'Share Screen';
            this.shareScreenBtn.classList.remove('active');
            
            // Reset flag
            this.isScreenSharing = false;
            this.screenStream = null;
            
            showAlert('Screen Sharing', 'Screen sharing has ended.', 'info');
        }
    }
}

// Create a global instance
const videoCall = new VideoCall();