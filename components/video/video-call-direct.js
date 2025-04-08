// Direct video call functionality
class DirectVideoCall {
    constructor() {
        this.localVideo = document.getElementById('local-video-call');
        this.remoteVideo = document.getElementById('remote-video-call');
        this.muteAudioBtn = document.getElementById('mute-call-audio-btn');
        this.muteVideoBtn = document.getElementById('mute-call-video-btn');
        this.shareScreenBtn = document.getElementById('share-call-screen-btn');
        this.shareCallLinkBtn = document.getElementById('share-call-link-btn');
        this.endCallBtn = document.getElementById('end-call-btn');
        
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        this.isScreenSharing = false;
        this.isInCall = false;
        this.callId = null;
        
        this.localStream = null;
        this.screenStream = null;
        
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
        
        this.shareCallLinkBtn.addEventListener('click', () => {
            this.showShareCallLink();
        });
        
        this.endCallBtn.addEventListener('click', () => {
            this.endCall();
        });
    }
    
    // In the startNewCall method, update the getUserMedia options
    // Update the startNewCall method
    async startNewCall() {
        try {
            showLoading();
            
            // Check network connectivity first
            const hasConnectivity = await this.checkNetworkConnectivity();
            if (!hasConnectivity) {
                showAlert('Network Issue', 'You appear to be behind a restrictive firewall. Video calls may not work properly.', 'warning');
            }
            
            // Generate a unique call ID
            this.callId = generateId();
            
            // Get user media with optimized video and audio settings
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2,
                    latency: 0,
                    volume: 1.0
                }
            });
            
            // Apply audio processing
            this.applyAudioProcessing(this.localStream);
            
            // Display local stream
            this.localVideo.srcObject = this.localStream;
            
            // Initialize signaling with connection status callback
            await signaling.connect();
            await signaling.joinChannel(this.callId, true, this.localStream);
            
            // Add connection status callback
            signaling.setConnectionStatusCallback((status, userId) => {
                if (status === 'connected') {
                    showAlert('User Connected', `${userId} has joined your call`, 'success');
                } else if (status === 'disconnected') {
                    showAlert('User Disconnected', `${userId} has left the call`, 'info');
                }
            });
            
            // Handle remote streams
            signaling.setOnRemoteStream((stream, userId) => {
                console.log(`Received remote stream from ${userId}`);
                this.remoteVideo.srcObject = stream;
                showAlert('User Joined', `${userId} joined your video call`, 'info');
                
                // Ensure the remote video element is visible
                this.remoteVideo.style.display = 'block';
                
                // Log remote track information
                stream.getTracks().forEach(track => {
                    console.log(`Remote track: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}`);
                });
            });
            
            this.isInCall = true;
            
            // Show video call section
            showSection('video-call-section');
            
            hideLoading();
            showAlert('Call Started', 'Your video call has been started. Share the link to invite others.', 'success');
            
            // Show share link modal automatically
            this.showShareCallLink();
            
        } catch (error) {
            console.error('Error starting call:', error);
            hideLoading();
            showAlert('Call Error', 'Could not start video call. Please check your camera and microphone permissions.', 'error');
        }
    }
    
    // Also update the joinCall method with the same audio settings
    async joinCall(callId) {
        try {
            showLoading();
            
            // Check network connectivity first
            const hasConnectivity = await this.checkNetworkConnectivity();
            if (!hasConnectivity) {
                showAlert('Network Issue', 'You appear to be behind a restrictive firewall. Video calls may not work properly.', 'warning');
            }
            
            this.callId = callId;
            
            // Get user media with optimized audio settings
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2,
                    latency: 0,
                    volume: 1.0
                }
            });
            
            // Apply audio processing
            this.applyAudioProcessing(this.localStream);
            
            // Display local stream
            this.localVideo.srcObject = this.localStream;
            
            // Initialize signaling
            await signaling.connect();
            await signaling.joinChannel(this.callId, false, this.localStream);
            
            // Handle remote streams
            signaling.setOnRemoteStream((stream, userId) => {
                console.log(`Received remote stream from ${userId}`);
                this.remoteVideo.srcObject = stream;
                
                // Ensure the remote video element is visible
                this.remoteVideo.style.display = 'block';
                
                // Log remote track information
                stream.getTracks().forEach(track => {
                    console.log(`Remote track: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}`);
                });
            });
            
            this.isInCall = true;
            
            // Show video call section
            showSection('video-call-section');
            
            hideLoading();
            showAlert('Call Joined', 'You have joined the video call successfully!', 'success');
            
        } catch (error) {
            console.error('Error joining call:', error);
            hideLoading();
            showAlert('Call Error', 'Could not join video call. Please check your camera and microphone permissions.', 'error');
        }
    }
    
    toggleAudio() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                this.isAudioMuted = !this.isAudioMuted;
                audioTracks[0].enabled = !this.isAudioMuted;
                
                // Update button UI
                if (this.isAudioMuted) {
                    this.muteAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                } else {
                    this.muteAudioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
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
                } else {
                    this.muteVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
                }
            }
        }
    }
    
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
                
                // Save the original video track to restore later
                this.originalVideoTrack = this.localStream.getVideoTracks()[0];
                
                // Replace video track with screen track
                const screenTrack = this.screenStream.getVideoTracks()[0];
                
                // Update the local video display
                this.localVideo.srcObject = this.screenStream;
                
                // Update button UI
                this.shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
                this.shareScreenBtn.classList.add('active');
                
                // Set flag
                this.isScreenSharing = true;
                
                // Listen for the end of screen sharing
                screenTrack.onended = () => {
                    this.stopScreenSharing();
                };
                
                showAlert('Screen Sharing', 'You are now sharing your screen.', 'info');
            } else {
                this.stopScreenSharing();
            }
        } catch (error) {
            console.error('Error sharing screen:', error);
            showAlert('Screen Sharing Error', 'Could not share screen.', 'error');
        }
    }
    
    stopScreenSharing() {
        if (this.screenStream) {
            // Stop all screen tracks
            this.screenStream.getTracks().forEach(track => track.stop());
            
            // Restore original video
            if (this.localStream) {
                this.localVideo.srcObject = this.localStream;
            }
            
            // Update button UI
            this.shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
            this.shareScreenBtn.classList.remove('active');
            
            // Reset flag
            this.isScreenSharing = false;
            this.screenStream = null;
            
            showAlert('Screen Sharing', 'Screen sharing has ended.', 'info');
        }
    }
    
    showShareCallLink() {
        if (!this.callId) return;
        
        // Generate shareable link
        const shareableLink = this.generateCallLink(this.callId);
        
        // Show in modal
        document.getElementById('share-call-link-input').value = shareableLink;
        showModal('share-call-link-modal');
    }
    
    generateCallLink(callId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}?videocall=${callId}`;
    }
    
    copyCallLink() {
        const linkInput = document.getElementById('share-call-link-input');
        linkInput.select();
        document.execCommand('copy');
        
        // Show feedback
        const copyBtn = document.getElementById('copy-call-link-btn');
        copyBtn.textContent = 'Copied!';
        
        // Automatically close the modal after copying
        setTimeout(() => {
            // Reset button text
            copyBtn.textContent = 'Copy';
            
            // Hide the modal
            hideModal('share-call-link-modal');
            
            // Show alert that link was copied
            showAlert('Link Copied', 'Share this link with participants to join your call', 'success');
            
            // Navigate to the waiting view
            showSection('video-call-section');
        }, 1500);
    }
    
    // Move the applyAudioProcessing method inside the class
    applyAudioProcessing(stream) {
        try {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioTrack = audioTracks[0];
                
                // Get the audio constraints
                const constraints = audioTrack.getConstraints();
                
                // Apply additional constraints if supported
                if (typeof audioTrack.applyConstraints === 'function') {
                    const enhancedConstraints = {
                        ...constraints,
                        autoGainControl: true,
                        echoCancellation: true,
                        noiseSuppression: true,
                        // Set moderate noise suppression (not too aggressive)
                        googNoiseReduction: true,
                        googHighpassFilter: true,
                        googEchoCancellation: true,
                        googEchoCancellation2: true,
                        googAutoGainControl: true,
                        googAutoGainControl2: true
                    };
                    
                    audioTrack.applyConstraints(enhancedConstraints)
                        .catch(error => {
                            console.warn('Could not apply all audio constraints:', error);
                        });
                }
            }
        } catch (error) {
            console.warn('Error applying audio processing:', error);
        }
    }
    
    endCall() {
        if (this.localStream) {
            // Stop all tracks
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Reset video elements
        this.localVideo.srcObject = null;
        this.remoteVideo.srcObject = null;
        
        // Reset state
        this.isInCall = false;
        this.callId = null;
        
        // Disconnect from signaling
        signaling.disconnect();
        
        // Show browse section
        showSection('browse-streams-section');
        
        showAlert('Call Ended', 'The video call has ended.', 'info');
    }
    
    // Move the checkNetworkConnectivity method inside the class
    checkNetworkConnectivity() {
        return new Promise((resolve, reject) => {
            // Check if we can access common STUN servers
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            let hasConnectivity = false;
            
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    // If we get a candidate that's not local, we have connectivity
                    if (e.candidate.candidate.indexOf('typ host') === -1) {
                        hasConnectivity = true;
                        pc.close();
                        resolve(true);
                    }
                }
            };
            
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete' && !hasConnectivity) {
                    pc.close();
                    // We only got local candidates, might be a network issue
                    resolve(false);
                }
            };
            
            // Create data channel to trigger ICE gathering
            pc.createDataChannel('connectivity-test');
            
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(err => {
                    pc.close();
                    reject(err);
                });
            
            // Set a timeout
            setTimeout(() => {
                if (!hasConnectivity) {
                    pc.close();
                    resolve(false);
                }
            }, 5000);
        });
    }
}

// Create a global instance
const directVideoCall = new DirectVideoCall();