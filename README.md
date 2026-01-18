# Chrono Misfire

A fast-paced, precision-based runner game built with Phaser.js where time itself is your enemy.

## Overview

In **Chrono Misfire**, you play as a runner in an endless side-scrolling world. Your goal is to survive for 60 seconds by shooting the correct targets while avoiding the wrong ones. The unique twist: your accuracy directly controls time speed!

## Core Mechanic

- **Auto-run**: The player character runs automatically from left to right.
- **Shooting**: Use mouse to aim and left-click to shoot.
- **Targets**: Green targets (✔) are correct, red targets (✖) are wrong.
- **Time Manipulation**: 
  - Hit correct targets → Time slows down (up to -0.2x per hit, with combo bonuses)
  - Hit wrong targets or miss → Time speeds up (+0.3x per wrong hit, +0.1x per miss)
  - Time scale ranges from 1.0x to 6.0x
  - If time reaches 6.0x → **TIME OVERLOAD** (Game Over)

## Features

### Gameplay Elements
- **Waves**: Difficulty increases over time (4 waves total)
- **Combo System**: Consecutive correct hits build combo for bigger time bonuses
- **Ammo System**: Limited ammo (8 shots) with reload mechanic (900ms reload time)
- **Gates**: Obstacles that appear, requiring correct hits to open
- **Zigzag Targets**: Some targets move unpredictably for added challenge

### Visuals & Audio
- Parallax scrolling background
- Dynamic UI showing time speed, timer, wave, combo, and ammo
- Color-coded feedback (green for good, red for bad)
- Sound effects for shooting, correct/wrong hits, win/lose
- Smooth animations and particle effects

### Controls
- **Mouse Movement**: Aim crosshair
- **Left Click**: Shoot
- **R**: Restart game
- **M**: Return to menu
- **Space**: Manual reload

## How to Play

1. Click anywhere on the menu to start
2. Aim with mouse, shoot correct targets (green ✔)
3. Avoid shooting wrong targets (red ✖)
4. Manage your time speed - keep it low to survive longer
5. Survive 60 seconds to win!

## Technical Details

- **Framework**: Phaser 3.80.1
- **Language**: JavaScript (ES6 Modules)
- **Build Tool**: Vite
- **Platform**: Web/HTML5
- **Resolution**: 960x540 (16:9 aspect ratio)
- **Physics**: Arcade physics
- **Audio**: Web Audio API

## Installation & Running

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/AshmitSenapati/chrono-misfire.git
cd chrono-misfire

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:5173` in your browser to play.

## Project Structure

```
chrono-misfire/
├── index.html          # Main HTML file
├── package.json        # Dependencies and scripts
├── README.md           # This file
├── assets/
│   └── sfx/            # Sound effects
│       ├── shoot.wav
│       ├── correct.wav
│       ├── wrong.wav
│       ├── win.wav
│       └── lose.wav
└── src/
    ├── main.js         # Game entry point
    └── scenes/
        ├── BootScene.js    # Loading scene
        ├── MenuScene.js    # Main menu
        └── GameScene.js    # Main gameplay
```

## Game Balance

- **Time Scale**: 1.0x to 6.0x (game over at 6.0x)
- **Survival Time**: 60 seconds
- **Ammo**: 8 shots, 900ms reload
- **Target Spawn**: Base delay 850ms, scales with wave and time speed
- **Wave Thresholds**: 0s, 15s, 30s, 45s
- **Combo Bonus**: Up to 25% additional time reduction at max combo

## Assets

All sound effects are original/placeholder assets created for this game.
- No external asset dependencies
- Audio files are in WAV format for web compatibility

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

This is a portfolio/demo project. Feel free to fork and modify for your own use.

## License

MIT License - see package.json for details.

## Credits

- **Developer**: Ashmit Senapati
- **Framework**: Phaser.js
- **Build Tool**: Vite
- **Sound Effects**: Custom created

---

**Enjoy the game! Remember: In Chrono Misfire, time is your most precious resource.**
