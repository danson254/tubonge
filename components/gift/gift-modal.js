// Gift modal functionality

class GiftModal {
    constructor() {
        this.modal = document.getElementById('gift-modal');
        this.giftOptions = document.querySelectorAll('.gift-option');
        this.cancelButton = document.getElementById('cancel-gift-btn');
        this.giftButton = document.getElementById('gift-btn');
        this.selectedGift = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.giftButton.addEventListener('click', () => this.showModal());
        this.cancelButton.addEventListener('click', () => this.hideModal());
        
        this.giftOptions.forEach(option => {
            option.addEventListener('click', () => this.selectGift(option));
        });
    }
    
    showModal() {
        showModal('gift-modal');
        this.resetSelection();
    }
    
    hideModal() {
        hideModal('gift-modal');
    }
    
    resetSelection() {
        this.selectedGift = null;
        this.giftOptions.forEach(option => {
            option.classList.remove('selected');
        });
    }
    
    selectGift(option) {
        // Remove selected class from all options
        this.giftOptions.forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Get gift value
        const giftValue = option.getAttribute('data-value');
        this.selectedGift = giftValue;
        
        // Send gift after a short delay
        setTimeout(() => {
            this.sendGift();
        }, 500);
    }
    
    sendGift() {
        if (this.selectedGift) {
            // Send gift message to chat
            chat.sendGiftMessage(this.selectedGift);
            
            // Hide modal
            this.hideModal();
        }
    }
}

// Create a global instance
const giftModal = new GiftModal();