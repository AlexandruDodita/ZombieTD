# Tower Defense Game

A desktop-ready, modular tower defense game built with HTML Canvas, JavaScript, and Electron.

## Game Description

Defend your base from waves of enemies by strategically placing towers and walls on a tile grid. The main tower is placed at the center of the map, and you can build additional defenses to protect it. Enemies spawn at the edges of the map and target your main tower.

## Features

- Tile-based map system
- Multiple tower types with different abilities
- Various enemy types with different behaviors
- Wave-based progression
- Tower upgrades
- Resource management (gold)

## How to Play

1. Start a wave using the "Start Wave" button
2. Place towers and walls to defend your base
3. Earn gold by defeating enemies
4. Upgrade your towers to increase their effectiveness
5. Survive as many waves as possible!

## Development

### Prerequisites

- Node.js and npm

### Installation

1. Clone the repository
2. Install dependencies:

```
npm install
```

3. Run the game:

```
npm start
```

### Project Structure

- `index.html` - Base layout and canvas
- `style.css` - Minimal responsive design
- `main.js` - Electron main process
- `preload.js` - For communication between frontend and Electron
- `game/game.js` - Main game loop, rendering, and logic
- `game/tilemap.js` - Handles the tile grid and tower placement
- `game/defenses.js` - Classes for towers, walls, and upgrade logic
- `game/enemies.js` - Classes for enemies and movement logic
- `game/spawner.js` - Handles wave progression and enemy spawning
- `assets/` - Sprites for towers and enemies (to be added later)

## License

MIT 