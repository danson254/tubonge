const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Serve static files from the current directory
app.use(express.static('./'));

// Configure Socket.io with proper CORS settings
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Set up Socket.io event handlers
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('join-channel', (data) => {
        console.log(`User ${data.userId} joining channel ${data.channelId}`);
        socket.join(data.channelId);
        socket.to(data.channelId).emit('user-joined', {
            userId: data.userId,
            channelId: data.channelId
        });
    });
    
    socket.on('leave-channel', (data) => {
        console.log(`User ${data.userId} leaving channel ${data.channelId}`);
        socket.leave(data.channelId);
        socket.to(data.channelId).emit('user-left', {
            userId: data.userId,
            channelId: data.channelId
        });
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
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});