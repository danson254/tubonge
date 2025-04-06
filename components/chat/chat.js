// Chat functionality

class Chat {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-message-input');
        this.sendButton = document.getElementById('send-message-btn');
        this.currentStreamId = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    
    setCurrentStream(streamId) {
        this.currentStreamId = streamId;
        this.loadMessages();
    }
    
    loadMessages() {
        // Clear existing messages
        this.chatMessages.innerHTML = '';
        
        // Get messages from localStorage
        const messages = this.getMessages();
        
        // Display messages
        messages.forEach(message => {
            this.displayMessage(message);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    getMessages() {
        const messagesKey = `chat_${this.currentStreamId}`;
        const messagesJson = localStorage.getItem(messagesKey);
        return messagesJson ? JSON.parse(messagesJson) : [];
    }
    
    saveMessage(message) {
        const messages = this.getMessages();
        messages.push(message);
        
        const messagesKey = `chat_${this.currentStreamId}`;
        localStorage.setItem(messagesKey, JSON.stringify(messages));
    }
    
    sendMessage() {
        const messageText = this.chatInput.value.trim();
        
        if (messageText && this.currentStreamId) {
            const message = {
                id: generateId(),
                sender: getCurrentUser(),
                text: messageText,
                timestamp: Date.now(),
                type: 'user'
            };
            
            this.saveMessage(message);
            this.displayMessage(message);
            this.scrollToBottom();
            
            // Clear input
            this.chatInput.value = '';
        }
    }
    
    sendGiftMessage(giftValue) {
        const stream = getStreamById(this.currentStreamId);
        
        if (stream && this.currentStreamId) {
            const message = {
                id: generateId(),
                sender: getCurrentUser(),
                text: `${getCurrentUser()} gifted ${stream.host} Ksh ${giftValue}`,
                timestamp: Date.now(),
                type: 'gift'
            };
            
            this.saveMessage(message);
            this.displayMessage(message);
            this.scrollToBottom();
            
            // Play gift sound
            playGiftSound();
        }
    }
    
    displayMessage(message) {
        const messageElement = document.createElement('div');
        const isCurrentUser = message.sender === getCurrentUser();
        
        if (message.type === 'gift') {
            messageElement.className = 'chat-message gift';
            messageElement.innerHTML = `
                <div class="message-content">
                    <p>${message.text}</p>
                    <span class="message-time">${formatTimestamp(message.timestamp)}</span>
                </div>
            `;
        } else {
            messageElement.className = `chat-message ${isCurrentUser ? 'user' : 'other'}`;
            messageElement.innerHTML = `
                <div class="message-header">
                    <strong>${message.sender}</strong>
                    <span class="message-time">${formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    <p>${message.text}</p>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageElement);
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    clear() {
        this.chatMessages.innerHTML = '';
        this.currentStreamId = null;
    }
}

// Create a global instance
const chat = new Chat();