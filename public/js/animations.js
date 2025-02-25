class SlotAnimations {
    constructor(config = {}) {
        this.config = {
            spinDuration: 3000,
            symbolHeight: 100,
            reelStaggerDelay: 200,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            ...config
        };
        
        this.initializeSprites();
    }
    
    initializeSprites() {
        this.sprites = {
            'jackpot': { src: 'assets/symbols/jackpot.png', loaded: false },
            'bell': { src: 'assets/symbols/bell.png', loaded: false },
            'orange': { src: 'assets/symbols/orange.png', loaded: false },
            'plum': { src: 'assets/symbols/plum.png', loaded: false },
            'lemon': { src: 'assets/symbols/lemon.png', loaded: false },
            'cherry': { src: 'assets/symbols/cherry.png', loaded: false }
        };
        
        // Preload all sprites
        Object.entries(this.sprites).forEach(([key, sprite]) => {
            const img = new Image();
            img.onload = () => {
                sprite.loaded = true;
                sprite.element = img;
            };
            img.src = sprite.src;
        });
    }
    
    async animateReelSpin(reel, index, finalSymbols) {
        return new Promise(resolve => {
            const symbolCount = reel.children.length;
            const totalDistance = this.config.symbolHeight * symbolCount;
            let startTime = null;
            const delay = index * this.config.reelStaggerDelay;
            
            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                
                if (elapsed < delay) {
                    requestAnimationFrame(animate);
                    return;
                }
                
                const progress = Math.min((elapsed - delay) / this.config.spinDuration, 1);
                const easedProgress = this.easeInOutQuart(progress);
                
                // Calculate dynamic speed for more realistic motion
                const speed = this.calculateSpinSpeed(progress);
                const currentPosition = (totalDistance * speed) % totalDistance;
                
                reel.style.transform = `translateY(${currentPosition}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Set final position and symbols
                    reel.style.transform = 'translateY(0)';
                    this.updateReelSymbols(reel, finalSymbols);
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }
    
    calculateSpinSpeed(progress) {
        // Accelerate at start, maintain speed, then decelerate
        if (progress < 0.2) {
            return progress * 5; // Acceleration
        } else if (progress > 0.8) {
            return 1 - (progress - 0.8) * 5; // Deceleration
        }
        return 1; // Constant speed
    }
    
    updateReelSymbols(reel, symbols) {
        const symbolElements = reel.children;
        symbols.forEach((symbol, index) => {
            if (symbolElements[index]) {
                const sprite = this.sprites[symbol];
                if (sprite && sprite.loaded) {
                    symbolElements[index].innerHTML = '';
                    symbolElements[index].appendChild(sprite.element.cloneNode());
                } else {
                    symbolElements[index].textContent = this.getFallbackEmoji(symbol);
                }
            }
        });
    }
    
    getFallbackEmoji(symbol) {
        const emojiMap = {
            'jackpot': '💎',
            'bell': '🔔',
            'orange': '🍊',
            'plum': '🫐',
            'lemon': '🍋',
            'cherry': '🍒'
        };
        return emojiMap[symbol] || '🎰';
    }
    
    async animateWin(winData, container) {
        const { lineIndex, symbol, win } = winData;
        
        // Create win line element
        const winLine = document.createElement('div');
        winLine.className = 'win-line';
        
        // Position the line based on the payline pattern
        const lineOffset = (lineIndex % 3) * this.config.symbolHeight + this.config.symbolHeight / 2;
        winLine.style.top = `${lineOffset}px`;
        
        // Add glow effect
        winLine.style.boxShadow = '0 0 10px var(--gold), 0 0 20px var(--gold)';
        
        container.appendChild(winLine);
        
        // Animate the win amount
        const winAmount = document.createElement('div');
        winAmount.className = 'win-amount';
        winAmount.textContent = `+${win.toFixed(2)}`;
        winAmount.style.left = '50%';
        winAmount.style.top = `${lineOffset}px`;
        
        container.appendChild(winAmount);
        
        // Remove elements after animation
        setTimeout(() => {
            winLine.remove();
            winAmount.remove();
        }, 2000);
    }
}

// Export for use in main game logic
window.SlotAnimations = SlotAnimations;
