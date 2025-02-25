const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Game configuration
const SYMBOLS = {
    JACKPOT: { id: 'jackpot', multiplier: [0, 0, 500, 2500, 10000], weight: 1 },
    BELL: { id: 'bell', multiplier: [0, 0, 100, 500, 2500], weight: 2 },
    ORANGE: { id: 'orange', multiplier: [0, 0, 20, 100, 500], weight: 4 },
    PLUM: { id: 'plum', multiplier: [0, 0, 15, 75, 400], weight: 4 },
    LEMON: { id: 'lemon', multiplier: [0, 0, 10, 50, 300], weight: 5 },
    CHERRY: { id: 'cherry', multiplier: [0, 0, 5, 25, 200], weight: 6 }
};

const PAYLINES = [
    [1,1,1,1,1], // Middle line
    [0,0,0,0,0], // Top line
    [2,2,2,2,2], // Bottom line
    [0,1,2,1,0], // V shape
    [2,1,0,1,2], // Inverted V
    [0,0,1,2,2], // Diagonal 1
    [2,2,1,0,0], // Diagonal 2
    [1,0,0,0,1], // U shape top
    [1,2,2,2,1], // U shape bottom
    [0,1,1,1,0], // Small V
    [2,1,1,1,2], // Small inverted V
    [1,1,0,1,1], // Top bump
    [1,1,2,1,1], // Bottom bump
    [0,1,0,1,0], // W shape top
    [2,1,2,1,2], // W shape bottom
    [1,0,1,0,1], // Zigzag top
    [1,2,1,2,1], // Zigzag bottom
    [0,2,0,2,0], // Extreme zigzag top
    [2,0,2,0,2], // Extreme zigzag bottom
    [1,1,1,1,1]  // Extra middle line
];

function getRandomSymbol() {
    const weights = Object.values(SYMBOLS).map(s => s.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of Object.values(SYMBOLS)) {
        random -= symbol.weight;
        if (random <= 0) return symbol.id;
    }
    return Object.values(SYMBOLS)[0].id;
}

function generateSpin() {
    const reels = Array(5).fill().map(() => 
        Array(3).fill().map(() => getRandomSymbol())
    );
    return reels;
}

function calculateWinnings(reels, bet) {
    let totalWin = 0;
    let winningLines = [];
    
    PAYLINES.forEach((payline, lineIndex) => {
        const lineSymbols = payline.map((pos, i) => reels[i][pos]);
        const firstSymbol = lineSymbols[0];
        let count = 1;
        
        for(let i = 1; i < lineSymbols.length; i++) {
            if(lineSymbols[i] === firstSymbol) {
                count++;
            } else {
                break;
            }
        }
        
        if(count >= 3) {
            const multiplier = SYMBOLS[firstSymbol.toUpperCase()].multiplier[count - 1];
            const win = bet * multiplier;
            if(win > 0) {
                winningLines.push({
                    lineIndex,
                    count,
                    symbol: firstSymbol,
                    win
                });
                totalWin += win;
            }
        }
    });
    
    return { totalWin, winningLines };
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('spin', ({ bet }) => {
        const reels = generateSpin();
        const result = calculateWinnings(reels, bet);
        
        socket.emit('spinResult', {
            reels,
            ...result
        });
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
