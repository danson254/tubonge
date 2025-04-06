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
            
            // Show host controls, hide viewer controls
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'none');
            
            hideLoading();
            showAlert('Stream Started', 'Your stream has started successfully with noise suppression enabled!', 'success');
        } catch (error) {
            console.error('Error starting host stream:', error);
            hideLoading();
            showAlert('Stream Error', 'Could not start stream. Please check your camera and microphone permissions.', 'error');
        }
    }
    
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
            
            // Display stream
            this.viewerVideo.srcObject = this.localStream;
            
            // Save stream ID
            this.streamId = streamId;
            
            // Show viewer controls, hide host controls
            document.querySelectorAll('.viewer-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
            
            hideLoading();
            showAlert('Joined Stream', 'You have joined the stream successfully with noise suppression enabled!', 'success');
        } catch (error) {
            console.error('Error joining stream:', error);
            hideLoading();
            showAlert('Join Error', 'Could not join stream. Please check your camera and microphone permissions.', 'error');
        }
    }
    
    // Add placeholder methods for toggle functions
    toggleAudio() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                this.isAudioMuted = !this.isAudioMuted;
                audioTracks[0].enabled = !this.isAudioMuted;
                
                // Update button UI
                if (this.isAudioMuted) {
                    this.muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                    this.muteAudioBtn.querySelector('.tooltip-text').textContent = 'Unmute Audio';
                } else {
                    this.muteAudioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    this.muteAudioBtn.querySelector('.tooltip-text').textContent = 'Mute Audio';
                }
            }
        }
    }
    
    toggleVideo() {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                this.isVideoMuted = !this.isVideoMuted;
                videoTracks[0].enabled = !this.isVideoMuted;
                
                // Update button UI
                if (this.isVideoMuted) {
                    this.muteVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                    this.muteVideoBtn.querySelector('.tooltip-text').textContent = 'Unmute Video';
                } else {
                    this.muteVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
                    this.muteVideoBtn.querySelector('.tooltip-text').textContent = 'Mute Video';
                }
            }
        }
    }
    
    async toggleScreenShare() {
        // Implement screen sharing toggle
    }
    
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
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
        this.isScreenSharing = false;
    }
}

// Create a global instance
const videoCall = new VideoCall();