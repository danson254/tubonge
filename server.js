const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('./'));

// Store active channels
const activeChannels = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-channel', (data) => {
        const { channelId, isHost, userId } = data;
        
        // Join socket room
        socket.join(channelId);
        
        // Store channel info
        if (!activeChannels[channelId]) {
            activeChannels[channelId] = {
                hostId: isHost ? userId : null,
                viewers: []
            };
        } else if (isHost) {
            activeChannels[channelId].hostId = userId;
        }
        
        console.log(`User ${userId} joined channel ${channelId} as ${isHost ? 'host' : 'viewer'}`);
    });
    
    socket.on('viewer-join', (data) => {
        const { channelId, userId } = data;
        
        if (activeChannels[channelId]) {
            // Add viewer to channel
            if (!activeChannels[channelId].viewers.includes(userId)) {
                activeChannels[channelId].viewers.push(userId);
            }
            
            // Notify host
            socket.to(channelId).emit('viewer-joined', { userId });
        }
    });
    
    socket.on('offer', (data) => {
        socket.to(data.channelId).emit('offer', data);
    });
    
    socket.on('answer', (data) => {
        socket.to(data.channelId).emit('answer', data);
    });
    
    socket.on('candidate', (data) => {
        socket.to(data.channelId).emit('candidate', data);
    });
    
    socket.on('end-stream', (data) => {
        const { channelId } = data;
        
        // Notify all viewers
        socket.to(channelId).emit('stream-ended');
        
        // Remove channel
        delete activeChannels[channelId];
    });
    
    socket.on('leave-channel', (data) => {
        const { channelId, userId } = data;
        
        if (activeChannels[channelId]) {
            // Remove viewer from channel
            activeChannels[channelId].viewers = activeChannels[channelId].viewers.filter(
                id => id !== userId
            );
            
            // Remove channel if empty
            if (activeChannels[channelId].viewers.length === 0 && 
                activeChannels[channelId].hostId === null) {
                delete activeChannels[channelId];
            }
        }
        
        socket.leave(channelId);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});