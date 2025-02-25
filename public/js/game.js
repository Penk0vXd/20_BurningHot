const socket = io();

class SlotMachine {
    constructor() {
        this.balance = 5000;
        this.currentBet = 20;
        this.isSpinning = false;
        this.reels = [[], [], [], [], []];
        this.currentSymbols = [[], [], [], [], []];
        this.setupDOMElements();
        this.initializeControls();
        this.renderReels();
        this.updateBalance();
        this.setupEventListeners();
    }

    setupDOMElements() {
        this.reelElements = Array.from({ length: 5 }, (_, i) => document.getElementById(`reel${i}`));
        this.balanceElement = document.getElementById('balance');
        this.lastWinElement = document.getElementById('last-win-amount');
        this.spinButton = document.getElementById('spin-button');
    }

    renderReels() {
        this.reelElements.forEach((reel, reelIndex) => {
            reel.innerHTML = '';
            // Create 3 visible symbol slots per reel
            for (let i = 0; i < 3; i++) {
                const symbolContainer = document.createElement('div');
                symbolContainer.className = 'symbol-container';
                const symbol = this.getRandomSymbol();
                this.currentSymbols[reelIndex][i] = symbol;
                symbolContainer.style.backgroundImage = `url(${symbol.image})`;
                reel.appendChild(symbolContainer);
            }
        });
    }

    getRandomSymbol() {
        // Get total weight
        const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        // Select symbol based on weight
        for (const symbol of SYMBOL_LIST) {
            random -= SYMBOL_WEIGHTS[symbol.id];
            if (random <= 0) {
                return symbol;
            }
        }
        return SYMBOL_LIST[0];
    }

    async spin() {
        if (this.isSpinning || this.balance < this.currentBet) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.balance -= this.currentBet;
        this.updateBalance();

        // Generate new symbols for each reel
        const newSymbols = this.reelElements.map(() => {
            return Array(3).fill(null).map(() => this.getRandomSymbol());
        });

        // Animate reels
        const promises = this.reelElements.map((reel, i) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.animateReel(reel, newSymbols[i], i * 200);
                    resolve();
                }, i * 200);
            });
        });

        await Promise.all(promises);
        
        // Update current symbols
        this.currentSymbols = newSymbols;
        
        // Check for wins
        const winAmount = this.calculateWin();
        if (winAmount > 0) {
            this.balance += winAmount;
            this.lastWinElement.textContent = (winAmount / 100).toFixed(2);
            this.updateBalance();
        }

        this.isSpinning = false;
        this.spinButton.disabled = false;
    }

    animateReel(reel, newSymbols, delay) {
        const duration = 2000; // 2 seconds
        const fps = 60;
        const frames = duration / (1000 / fps);
        let frame = 0;

        const symbols = Array.from(reel.children);
        const symbolHeight = symbols[0].offsetHeight;
        const totalDistance = symbolHeight * 20; // Spin 20 symbols worth of distance

        const animate = () => {
            frame++;
            const progress = frame / frames;
            const distance = totalDistance * this.easeOutBack(progress);

            symbols.forEach((symbol, i) => {
                symbol.style.transform = `translateY(${distance}px)`;
                
                // When animation is near end, update symbol images
                if (progress > 0.9) {
                    symbol.style.backgroundImage = `url(${newSymbols[i].image})`;
                }
            });

            if (frame < frames) {
                requestAnimationFrame(animate);
            } else {
                // Reset position without transform
                symbols.forEach((symbol, i) => {
                    symbol.style.transform = '';
                    symbol.style.backgroundImage = `url(${newSymbols[i].image})`;
                });
            }
        };

        setTimeout(() => animate(), delay);
    }

    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    calculateWin() {
        let totalWin = 0;
        
        // Check each row
        for (let row = 0; row < 3; row++) {
            const symbols = this.currentSymbols.map(reel => reel[row]);
            const firstSymbol = symbols[0];
            let count = 1;

            // Count matching symbols from left to right
            for (let i = 1; i < symbols.length; i++) {
                if (symbols[i].id === firstSymbol.id) {
                    count++;
                } else {
                    break;
                }
            }

            // Add win amount based on symbol count
            if (count >= 3) {
                totalWin += firstSymbol.payout[count - 1] * this.currentBet;
            }
        }

        return totalWin;
    }

    updateBalance() {
        this.balanceElement.textContent = (this.balance / 100).toFixed(2);
    }

    initializeControls() {
        this.betOptions = [20, 40, 100, 200, 400, 1000, 2000, 5000, 10000, 20000];
        this.currentBetIndex = 0;
        this.currentBet = this.betOptions[this.currentBetIndex];

        // Plus/Minus buttons
        document.getElementById('decrease-bet').addEventListener('click', () => {
            if (this.currentBetIndex > 0) {
                this.currentBetIndex--;
                this.updateBet(this.betOptions[this.currentBetIndex]);
            }
        });

        document.getElementById('increase-bet').addEventListener('click', () => {
            if (this.currentBetIndex < this.betOptions.length - 1) {
                this.currentBetIndex++;
                this.updateBet(this.betOptions[this.currentBetIndex]);
            }
        });

        // Bet option buttons
        document.querySelectorAll('.bet-option').forEach(button => {
            button.addEventListener('click', () => {
                const bet = parseInt(button.dataset.bet);
                this.currentBetIndex = this.betOptions.indexOf(bet);
                this.updateBet(bet);
            });
        });

        // Bet switch buttons
        document.getElementById('lower-bets').addEventListener('click', () => {
            document.getElementById('lower-bet-options').classList.remove('hidden');
            document.getElementById('higher-bet-options').classList.add('hidden');
            document.getElementById('lower-bets').classList.add('active');
            document.getElementById('higher-bets').classList.remove('active');
        });

        document.getElementById('higher-bets').addEventListener('click', () => {
            document.getElementById('higher-bet-options').classList.remove('hidden');
            document.getElementById('lower-bet-options').classList.add('hidden');
            document.getElementById('higher-bets').classList.add('active');
            document.getElementById('lower-bets').classList.remove('active');
        });

        // Initialize with first bet option
        this.updateBet(this.currentBet);
    }

    updateBet(bet) {
        this.currentBet = bet;
        document.getElementById('current-bet').textContent = (bet / 100).toFixed(2);
        
        // Update selected state for bet options
        document.querySelectorAll('.bet-option').forEach(button => {
            if (parseInt(button.dataset.bet) === bet) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });

        // Switch to appropriate bet options panel
        if (bet >= 1000) {
            document.getElementById('higher-bets').click();
        } else {
            document.getElementById('lower-bets').click();
        }
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

    toggleAutoPlay() {
        this.autoPlayActive = !this.autoPlayActive;
        this.autoPlayButton.classList.toggle('active', this.autoPlayActive);
        
        if (this.autoPlayActive && !this.isSpinning && this.balance >= this.currentBet) {
            this.spin();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new SlotMachine();
});
