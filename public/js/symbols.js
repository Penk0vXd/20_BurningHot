const SYMBOLS = {
    CHERRY: {
        id: 'cherry',
        name: 'Cherry',
        image: 'images/cherry.png',
        payout: [0, 0, 50, 100, 200]  // Payout for 1,2,3,4,5 symbols
    },
    LEMON: {
        id: 'lemon',
        name: 'Lemon',
        image: 'images/lemon.png',
        payout: [0, 0, 40, 80, 160]
    },
    ORANGE: {
        id: 'orange',
        name: 'Orange',
        image: 'images/orange.png',
        payout: [0, 0, 40, 80, 160]
    },
    PLUM: {
        id: 'plum',
        name: 'Plum',
        image: 'images/plum.png',
        payout: [0, 0, 40, 80, 160]
    },
    GRAPES: {
        id: 'grapes',
        name: 'Grapes',
        image: 'images/grapes.png',
        payout: [0, 0, 60, 120, 240]
    },
    BELL: {
        id: 'bell',
        name: 'Bell',
        image: 'images/bell.png',
        payout: [0, 0, 100, 200, 400]
    },
    SEVEN: {
        id: 'seven',
        name: 'Seven',
        image: 'images/seven.png',
        payout: [0, 0, 150, 300, 750]
    },
    STAR: {
        id: 'star',
        name: 'Star',
        image: 'images/star.png',
        payout: [0, 0, 200, 400, 1000]
    }
};

// Array of all symbols for random selection
const SYMBOL_LIST = Object.values(SYMBOLS);

// Weights for each symbol (higher number = less frequent)
const SYMBOL_WEIGHTS = {
    [SYMBOLS.CHERRY.id]: 1,
    [SYMBOLS.LEMON.id]: 1,
    [SYMBOLS.ORANGE.id]: 1,
    [SYMBOLS.PLUM.id]: 1,
    [SYMBOLS.GRAPES.id]: 2,
    [SYMBOLS.BELL.id]: 3,
    [SYMBOLS.SEVEN.id]: 4,
    [SYMBOLS.STAR.id]: 5
};
