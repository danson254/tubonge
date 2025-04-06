// WebRTC Signaling for multi-device streaming

class SignalingService {
    constructor() {
        this.peerConnections = {};
        this.localStream = null;
        this.onRemoteStreamCallback = null;
        
        // Use a free STUN server for NAT traversal
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        // Initialize Firebase for signaling
        this.initFirebase();
    }
    
    initFirebase() {
        // For a production app, you would use Firebase here
        // For this demo, we'll simulate signaling with localStorage
        this.channelId = null;
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
    
    handleStorageEvent(event) {
        if (!this.channelId) return;
        
        // Only process events for our channel
        if (event.key === `signaling_${this.channelId}`) {
            try {
                const signal = JSON.parse(event.newValue);
                if (signal.type === 'offer' && !this.isHost) {
                    this.handleOffer(signal);
                } else if (signal.type === 'answer' && this.isHost) {
                    this.handleAnswer(signal);
                } else if (signal.type === 'candidate') {
                    this.handleCandidate(signal);
                }
            } catch (e) {
                console.error('Error parsing signal:', e);
            }
        }
    }
    
    async joinChannel(channelId, isHost, localStream) {
        this.channelId = channelId;
        this.isHost = isHost;
        this.localStream = localStream;
        
        if (isHost) {
            // Host waits for connections
            console.log('Host ready for connections on channel:', channelId);
            
            // Store channel info
            const channels = JSON.parse(localStorage.getItem('signaling_channels') || '[]');
            if (!channels.includes(channelId)) {
                channels.push(channelId);
                localStorage.setItem('signaling_channels', JSON.stringify(channels));
            }
        } else {
            // Viewer initiates connection to host
            await this.connectToHost(channelId);
        }
    }
    
    async connectToHost(channelId) {
        console.log('Connecting to host on channel:', channelId);
        
        // Create peer connection
        const pc = new RTCPeerConnection(this.iceServers);
        this.peerConnections[channelId] = pc;
        
        // Add local stream
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal({
                    type: 'candidate',
                    candidate: event.candidate,
                    from: getCurrentUser(),
                    to: 'host'
                });
            }
        };
        
        // Handle remote stream
        pc.ontrack = (event) => {
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(event.streams[0]);
            }
        };
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        this.sendSignal({
            type: 'offer',
            sdp: pc.localDescription,
            from: getCurrentUser(),
            to: 'host'
        });
    }
    
    async handleOffer(signal) {
        const pc = new RTCPeerConnection(this.iceServers);
        this.peerConnections[signal.from] = pc;
        
        // Add local stream
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal({
                    type: 'candidate',
                    candidate: event.candidate,
                    from: 'host',
                    to: signal.from
                });
            }
        };
        
        // Handle remote stream
        pc.ontrack = (event) => {
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(event.streams[0], signal.from);
            }
        };
        
        // Set remote description
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendSignal({
            type: 'answer',
            sdp: pc.localDescription,
            from: 'host',
            to: signal.from
        });
    }
    
    async handleAnswer(signal) {
        const pc = this.peerConnections[signal.from];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
    }
    
    async handleCandidate(signal) {
        const pc = this.peerConnections[signal.from] || this.peerConnections[signal.to];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    }
    
    sendSignal(signal) {
        // In a real app, this would send to Firebase
        // For this demo, we use localStorage
        localStorage.setItem(`signaling_${this.channelId}`, JSON.stringify(signal));
    }
    
    setOnRemoteStream(callback) {
        this.onRemoteStreamCallback = callback;
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