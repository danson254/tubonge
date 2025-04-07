// WebRTC Signaling with Socket.io
class SignalingService {
    constructor() {
        this.socket = null;
        this.peerConnections = {};
        this.localStream = null;
        this.onRemoteStreamCallback = null;
        
        // ICE servers for NAT traversal
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }
    
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
                rejectUnauthorized: false
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
    
    createPeerConnection(remoteUserId) {
        console.log('Creating peer connection for:', remoteUserId);
        
        const pc = new RTCPeerConnection(this.iceServers);
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
        
        return pc;
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
}

// Create global instance
const signaling = new SignalingService();