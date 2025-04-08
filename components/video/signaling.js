// WebRTC Signaling with Socket.io
class SignalingService {
    constructor() {
        this.socket = null;
        this.channelId = null;
        this.isHost = false;
        this.localStream = null;
        this.peerConnections = {};
        this.onRemoteStreamCallback = null;
        this.connectionStatusCallback = null; // Add this line
    }
    
    // Add this method to your Signaling class
    generateShareableLink(streamId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}?join=${streamId}`;
    }
    
    // Also ensure your connect method is properly handling SSL
    // In the connect method, update the server URL handling
    connect() {
        return new Promise((resolve, reject) => {
            // Get the current hostname
            const hostname = window.location.hostname;
            
            // Determine the appropriate server URL
            let serverUrl;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // Local development
                serverUrl = 'http://localhost:3000';
            } else {
                // Production - use secure WebSockets with the same hostname
                serverUrl = window.location.origin;
            }
            
            console.log('Connecting to signaling server at:', serverUrl);
            
            // Connect with transport options to handle potential SSL issues
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                secure: true,
                rejectUnauthorized: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            this.socket.on('connect', () => {
                console.log('Successfully connected to signaling server');
                this.setupSocketListeners();
                resolve();
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }
    
    setupSocketListeners() {
        this.socket.on('offer', async (data) => {
            if (!this.isHost) {
                await this.handleOffer(data);
            }
        });
        
        this.socket.on('answer', async (data) => {
            if (this.isHost) {
                await this.handleAnswer(data);
            }
        });
        
        this.socket.on('candidate', async (data) => {
            await this.handleCandidate(data);
        });
        
        this.socket.on('viewer-joined', (data) => {
            console.log(`Viewer joined: ${data.userId}`);
            if (this.isHost) {
                this.createPeerConnection(data.userId);
            }
        });
        
        this.socket.on('stream-ended', () => {
            showAlert('Stream Ended', 'The host has ended the stream.', 'info');
            // Redirect to browse page
            navigateTo('browse-streams-section');
        });
    }
    
    async joinChannel(channelId, isHost, localStream) {
        try {
            if (!this.socket) {
                await this.connect();
            }
            
            this.channelId = channelId;
            this.isHost = isHost;
            this.localStream = localStream;
            
            this.socket.emit('join-channel', {
                channelId,
                isHost,
                userId: getCurrentUser()
            });
            
            if (isHost) {
                console.log('Host ready for connections on channel:', channelId);
            } else {
                console.log('Viewer joining channel:', channelId);
                this.socket.emit('viewer-join', {
                    channelId,
                    userId: getCurrentUser()
                });
            }
        } catch (error) {
            console.error('Error joining channel:', error);
            throw error;
        }
    }
    
    // Helper function to enhance audio SDP
    enhanceAudioSDP(sdp) {
        // Split SDP into lines
        const lines = sdp.split('\r\n');
        const audioLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
        
        if (audioLineIndex !== -1) {
            // Find the audio section
            let audioSection = [];
            let i = audioLineIndex;
            while (i < lines.length && !lines[i].startsWith('m=')) {
                audioSection.push(lines[i]);
                i++;
            }
            
            // Add or modify audio parameters
            const opusIndex = audioSection.findIndex(line => line.includes('opus/48000'));
            if (opusIndex !== -1) {
                // Add parameters for better audio quality
                audioSection.splice(opusIndex + 1, 0, 
                    'a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;maxaveragebitrate=510000;cbr=1'
                );
            }
            
            // Replace the audio section in the SDP
            lines.splice(audioLineIndex, audioSection.length, ...audioSection);
        }
        
        return lines.join('\r\n');
    }
    
    // Update the createPeerConnection method to use more STUN/TURN servers
    createPeerConnection(remoteUserId) {
        console.log('Creating peer connection for:', remoteUserId);
        
        // Set up peer connection with improved connectivity settings
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Add free TURN servers for better NAT traversal
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            sdpSemantics: 'unified-plan',
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        };
        
        const pc = new RTCPeerConnection(configuration);
        this.peerConnections[remoteUserId] = pc;
        
        // Add local stream
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('candidate', {
                    channelId: this.channelId,
                    candidate: event.candidate,
                    from: getCurrentUser(),
                    to: remoteUserId
                });
            }
        };
        
        // Create and send offer if host
        if (this.isHost) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    this.socket.emit('offer', {
                        channelId: this.channelId,
                        sdp: pc.localDescription,
                        from: getCurrentUser(),
                        to: remoteUserId
                    });
                })
                .catch(error => console.error('Error creating offer:', error));
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(event.streams[0], remoteUserId);
            }
        };
        
        // Modify SDP to prioritize audio quality when creating offer/answer
        const originalCreateOffer = pc.createOffer;
        pc.createOffer = async (options) => {
            const offer = await originalCreateOffer.apply(pc, [options]);
            offer.sdp = this.enhanceAudioSDP(offer.sdp);
            return offer;
        };
        
        const originalCreateAnswer = pc.createAnswer;
        pc.createAnswer = async (options) => {
            const answer = await originalCreateAnswer.apply(pc, [options]);
            answer.sdp = this.enhanceAudioSDP(answer.sdp);
            return answer;
        };
        
        return pc;
    }
    
    // Add a new method to handle connection state changes
    handleConnectionStateChange(pc, remoteUserId) {
        pc.onconnectionstatechange = () => {
            console.log(`Connection state change: ${pc.connectionState} for user: ${remoteUserId}`);
            
            switch(pc.connectionState) {
                case 'connected':
                    showAlert('Connected', `Successfully connected to ${remoteUserId}`, 'success', 2000);
                    break;
                case 'disconnected':
                    showAlert('Disconnected', `Connection to ${remoteUserId} was lost`, 'warning');
                    // Try to reconnect
                    this.tryReconnect(remoteUserId);
                    break;
                case 'failed':
                    showAlert('Connection Failed', `Could not connect to ${remoteUserId}`, 'error');
                    // Try alternative connection method
                    this.tryAlternativeConnection(remoteUserId);
                    break;
            }
        };
    }
    
    // Add this method to the createPeerConnection function
    createPeerConnection(remoteUserId) {
        // Add connection state change handler
        this.handleConnectionStateChange(pc, remoteUserId);
        
        // Add ICE connection state change handler
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state: ${pc.iceConnectionState} for user: ${remoteUserId}`);
            
            if (pc.iceConnectionState === 'failed') {
                console.log('ICE Gathering failed, trying to restart ICE');
                pc.restartIce();
            }
        };
        
        // Add ICE gathering state change handler
        pc.onicegatheringstatechange = () => {
            console.log(`ICE gathering state: ${pc.iceGatheringState} for user: ${remoteUserId}`);
        };
        
        // Handle remote stream
        pc.ontrack = (event) => {
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(event.streams[0], remoteUserId);
            }
        };
        
        // Create and send offer if host
        if (this.isHost) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    this.socket.emit('offer', {
                        channelId: this.channelId,
                        sdp: pc.localDescription,
                        from: getCurrentUser(),
                        to: remoteUserId
                    });
                })
                .catch(error => console.error('Error creating offer:', error));
        }
    }
    
    async handleOffer(data) {
        console.log('Received offer from:', data.from);
        
        const pc = this.peerConnections[data.from] || this.createPeerConnection(data.from);
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            this.socket.emit('answer', {
                channelId: this.channelId,
                sdp: pc.localDescription,
                from: getCurrentUser(),
                to: data.from
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }
    
    async handleAnswer(data) {
        console.log('Received answer from:', data.from);
        
        const pc = this.peerConnections[data.from];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }
    
    async handleCandidate(data) {
        console.log('Received ICE candidate');
        
        const pc = this.peerConnections[data.from] || this.peerConnections[data.to];
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        }
    }
    
    setOnRemoteStream(callback) {
        this.onRemoteStreamCallback = callback;
    }
    
    endStream() {
        if (this.isHost) {
            this.socket.emit('end-stream', {
                channelId: this.channelId
            });
        }
        this.closeAllConnections();
    }
    
    leaveChannel() {
        this.socket.emit('leave-channel', {
            channelId: this.channelId,
            userId: getCurrentUser()
        });
        this.closeAllConnections();
    }
    
    closeAllConnections() {
        Object.values(this.peerConnections).forEach(pc => {
            pc.close();
        });
        this.peerConnections = {};
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.closeAllConnections();
    }
    
    // Add this method to your signaling class
    setConnectionStatusCallback(callback) {
        this.connectionStatusCallback = callback;
        
        // Set up event listeners for connection status changes
        this.socket.on('user-connected', (userId) => {
            if (this.connectionStatusCallback) {
                this.connectionStatusCallback('connected', userId);
            }
        });
        
        this.socket.on('user-disconnected', (userId) => {
            if (this.connectionStatusCallback) {
                this.connectionStatusCallback('disconnected', userId);
            }
        });
    }
}

// Create global instance
const signaling = new SignalingService();