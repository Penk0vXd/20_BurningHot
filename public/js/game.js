const socket = io();

class SlotMachine {
    constructor() {
        this.balance = 5000;
        this.currentBet = 0.20;
        this.isSpinning = false;
        this.animations = new SlotAnimations({
            spinDuration: 3000,
            symbolHeight: 100,
            reelStaggerDelay: 200
        });
        
        this.init();
    }
    
    init() {
        this.setupDOMElements();
        this.setupEventListeners();
        this.renderReels();
        this.updateBalance();
        this.loadSounds();
        this.setupBetSelector();
    }
    
    setupDOMElements() {
        this.reels = Array.from({ length: 5 }, (_, i) => document.getElementById(`reel${i}`));
        this.spinButton = document.getElementById('spin-button');
        this.balanceElement = document.getElementById('balance');
        this.currentBetElement = document.getElementById('current-bet');
        this.lastWinElement = document.getElementById('last-win-amount');
        this.betSelector = document.getElementById('bet-selector');
        this.winLinesContainer = document.getElementById('win-lines');
        this.totalBetElement = document.getElementById('total-bet');
        this.autoPlayButton = document.getElementById('autoplay-button');
        this.soundToggle = document.getElementById('sound-toggle');
    }
    
    loadSounds() {
        this.sounds = {
            spin: new Audio('sounds/spin.mp3'),
            win: new Audio('sounds/win.mp3'),
            bigWin: new Audio('sounds/big-win.mp3'),
            click: new Audio('sounds/click.mp3'),
            coinDrop: new Audio('sounds/coin-drop.mp3')
        };
        
        // Load and mute all sounds initially
        Object.values(this.sounds).forEach(sound => {
            sound.load();
            sound.volume = 0.5;
        });
        
        // Restore sound preference
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.updateSoundToggle();
    }
    
    setupBetSelector() {
        const betOptions = [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 5.00, 10.00, 20.00];
        
        this.betSelector.innerHTML = '';
        betOptions.forEach(bet => {
            const option = document.createElement('div');
            option.className = 'bet-option';
            option.textContent = bet.toFixed(2);
            option.dataset.bet = bet;
            
            option.addEventListener('click', () => {
                if (!this.isSpinning) {
                    this.selectBet(bet);
                    this.playSound('click');
                }
            });
            
            this.betSelector.appendChild(option);
        });
        
        // Set initial bet
        this.selectBet(0.20);
    }
    
    selectBet(amount) {
        const options = this.betSelector.querySelectorAll('.bet-option');
        options.forEach(option => {
            option.classList.toggle('selected', parseFloat(option.dataset.bet) === amount);
        });
        
        this.currentBet = amount;
        this.currentBetElement.textContent = amount.toFixed(2);
        this.updateTotalBet();
    }
    
    updateTotalBet() {
        const totalBet = this.currentBet * 20; // 20 paylines
        this.totalBetElement.textContent = totalBet.toFixed(2);
    }
    
    setupEventListeners() {
        this.spinButton.addEventListener('click', () => {
            this.playSound('click');
            this.spin();
        });
        
        this.soundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('soundEnabled', this.soundEnabled);
            this.updateSoundToggle();
            this.playSound('click');
        });
        
        this.autoPlayButton.addEventListener('click', () => {
            this.toggleAutoPlay();
        });
        
        socket.on('spinResult', (result) => this.handleSpinResult(result));
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.spin();
            }
        });
    }
    
    updateSoundToggle() {
        this.soundToggle.classList.toggle('active', this.soundEnabled);
        this.soundToggle.innerHTML = this.soundEnabled ? '🔊' : '🔇';
    }
    
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
        }
    }
    
    renderReels() {
        this.reels.forEach(reel => {
            reel.innerHTML = '';
            // Add extra symbols for smooth spinning
            for (let i = 0; i < 6; i++) {
                const symbol = document.createElement('div');
                symbol.className = 'symbol';
                reel.appendChild(symbol);
            }
        });
        
        // Initial symbol setup
        this.reels.forEach(reel => {
            const symbols = Array(3).fill().map(() => 'cherry');
            this.animations.updateReelSymbols(reel, symbols);
        });
    }
    
    async spin() {
        if (this.isSpinning || this.balance < this.currentBet * 20) return;
        
        this.isSpinning = true;
        this.balance -= this.currentBet * 20;
        this.updateBalance();
        this.spinButton.disabled = true;
        this.clearWinLines();
        
        this.playSound('spin');
        
        // Emit spin event to server
        socket.emit('spin', { bet: this.currentBet });
        
        // Start spinning animation for all reels
        const spinPromises = this.reels.map((reel, index) => 
            this.animations.animateReelSpin(reel, index, ['cherry', 'cherry', 'cherry'])
        );
        
        // Wait for all reels to finish spinning
        await Promise.all(spinPromises);
    }
    
    clearWinLines() {
        while (this.winLinesContainer.firstChild) {
            this.winLinesContainer.firstChild.remove();
        }
    }
    
    async handleSpinResult(result) {
        const { reels, totalWin, winningLines } = result;
        
        // Update reels with final symbols
        for (let i = 0; i < this.reels.length; i++) {
            this.animations.updateReelSymbols(this.reels[i], reels[i]);
        }
        
        this.isSpinning = false;
        this.spinButton.disabled = false;
        
        // Update balance and show wins
        if (totalWin > 0) {
            this.playSound(totalWin > this.currentBet * 50 ? 'bigWin' : 'win');
            
            // Animate each winning line
            for (const line of winningLines) {
                await this.animations.animateWin(line, this.winLinesContainer);
                this.playSound('coinDrop');
            }
            
            this.balance += totalWin;
            this.updateBalance();
            this.lastWinElement.textContent = totalWin.toFixed(2);
            
            // Show win celebration for big wins
            if (totalWin > this.currentBet * 50) {
                this.showBigWinCelebration(totalWin);
            }
        }
        
        // Continue autoplay if active
        if (this.autoPlayActive && this.balance >= this.currentBet * 20) {
            setTimeout(() => this.spin(), 1000);
        }
    }
    
    showBigWinCelebration(amount) {
        const celebration = document.createElement('div');
        celebration.className = 'big-win-celebration';
        celebration.innerHTML = `
            <div class="win-amount">BIG WIN!</div>
            <div class="win-value">${amount.toFixed(2)}</div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.remove();
        }, 3000);
    }
    
    toggleAutoPlay() {
        this.autoPlayActive = !this.autoPlayActive;
        this.autoPlayButton.classList.toggle('active', this.autoPlayActive);
        
        if (this.autoPlayActive && !this.isSpinning && this.balance >= this.currentBet * 20) {
            this.spin();
        }
    }
    
    updateBalance() {
        this.balanceElement.textContent = this.balance.toFixed(2);
        
        // Update UI state based on balance
        const canSpin = this.balance >= this.currentBet * 20;
        this.spinButton.disabled = !canSpin || this.isSpinning;
        this.spinButton.classList.toggle('disabled', !canSpin);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new SlotMachine();
});
