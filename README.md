# Modern Slot Machine

A modern, responsive slot machine web application built with Node.js and WebSocket technology.

## Features

- Real-time gameplay with smooth animations
- 20 paylines with various winning patterns
- Multiple bet options (0.20 to 20.00)
- Instant balance updates
- Sound effects and visual feedback
- Responsive design for all devices
- Auto-play functionality
- Detailed paytable with winning combinations

## Project Structure

```
slot-program/
├── public/
│   ├── assets/
│   │   └── symbols/       # Symbol images
│   ├── js/
│   │   ├── animations.js  # Animation system
│   │   └── game.js       # Game logic
│   ├── sounds/           # Sound effects
│   ├── index.html        # Main HTML
│   └── styles.css        # Styles
├── server.js            # Backend logic
├── package.json         # Dependencies
└── README.md           # Documentation
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Open `http://localhost:3000` in your browser

## Symbol Configuration

The game uses the following symbols with their respective multipliers:

- 💎 Jackpot: x500 (3), x2500 (4), x10000 (5)
- 🔔 Bell: x100 (3), x500 (4), x2500 (5)
- 🍊 Orange: x20 (3), x100 (4), x500 (5)
- 🫐 Plum: x15 (3), x75 (4), x400 (5)
- 🍋 Lemon: x10 (3), x50 (4), x300 (5)
- 🍒 Cherry: x5 (3), x25 (4), x200 (5)

## Paylines

The game features 20 paylines with various patterns:
- Horizontal lines
- Diagonal lines
- V-shapes
- W-shapes
- Zigzag patterns

## Future Enhancements

- Additional bonus features
- Progressive jackpot system
- More symbol variations
- Achievement system
- Player statistics

## Technical Details

- Backend: Node.js with Express and Socket.IO
- Frontend: HTML5, CSS3, JavaScript
- Real-time communication via WebSocket
- Modular architecture for easy expansion
- Responsive design with CSS Grid and Flexbox
