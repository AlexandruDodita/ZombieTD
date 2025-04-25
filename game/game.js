import { TileMap } from './tilemap.js';
import { MainTower, CannonTower, SniperTower, Wall } from './defenses.js';
import { Zombie, Runner, Tank, Boss } from './enemies.js';
import { Spawner } from './spawner.js';
import { UIManager } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.gameState = 'start'; // start, playing, game-over
        
        // Game state
        this.gold = 100;
        this.waveNumber = 1;
        this.score = 0;
        
        // Selection state
        this.selectedDefense = null;
        this.isPlacingDefense = false;
        this.defenseToPlace = null;
        
        // Game entities
        this.tileMap = null;
        this.towers = [];
        this.walls = [];
        this.enemies = [];
        this.mainTower = null;
        this.spawner = null;
        
        // UI Manager
        this.ui = new UIManager(this);
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.skipWaveTimer = this.skipWaveTimer.bind(this);
        
        // Event listeners
        window.addEventListener('resize', this.handleResize);
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        
        // Fix tower placement by adding this property to track grid coordinates consistently
        this.hoveredGridCoords = { x: 0, y: 0 };
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.handleResize(); // Set initial canvas size
        
        // Create tile map (30x20 grid with 40px tiles)
        this.tileMap = new TileMap(40, 30, 40);
        
        // Show start menu
        this.ui.showScene('start');
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }
    
    setGameState(state) {
        this.gameState = state;
        
        if (state === 'playing') {
            this.reset();
            document.getElementById('game-ui').classList.remove('hidden');
        } else if (state === 'start' || state === 'game-over') {
            document.getElementById('game-ui').classList.add('hidden');
        }
    }
    
    reset() {
        // Reset game state
        this.gold = 100;
        this.waveNumber = 1;
        this.score = 0;
        this.selectedDefense = null;
        this.isPlacingDefense = false;
        this.defenseToPlace = null;
        
        // Clear entities (except main tower and tilemap)
        this.towers = [];
        this.walls = [];
        this.enemies = [];
        
        // Clear occupied state on tilemap (except for main tower area)
        for(let y = 0; y < this.tileMap.rows; y++) {
            for(let x = 0; x < this.tileMap.cols; x++) {
                this.tileMap.setTileOccupied(x, y, false);
            }
        }

        // Properly center the main tower in the map
        // For a 2x2 tower and 30x20 grid, we want it at (14,9) for true center
        const centerX = Math.floor(this.tileMap.cols / 2) ; // For a 2x2 tower
        const centerY = Math.floor(this.tileMap.rows / 2) ;
        this.mainTower = new MainTower(centerX, centerY);
        this.mainTower.game = this; // Add reference to game
        this.tileMap.setRectangleOccupied(centerX, centerY, this.mainTower.width, this.mainTower.height, true);
        
        // If we have a spawner, reset it; otherwise create a new one
        if (this.spawner) {
            this.spawner.reset();
        } else {
            this.spawner = new Spawner(this.tileMap, this);
        }
        
        // Connect spawner to skipWaveTimer method
        this.spawner.setSkipTimerCallback(this.skipWaveTimer);
        
        // Update UI
        this.updateUI();
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tilemap grid
        this.tileMap.draw(this.ctx);
        
        // If not playing, don't update game logic
        if (this.gameState !== 'playing') {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        
        // Calculate canvas offsets for bullet rendering
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const mapWidth = this.tileMap.cols * this.tileMap.tileSize;
        const mapHeight = this.tileMap.rows * this.tileMap.tileSize;
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Update and draw towers
        if (this.mainTower) {
            this.mainTower.update(deltaTime, this.enemies);
            this.mainTower.draw(this.ctx, this.tileMap.tileSize);
        }
        
        for (const tower of this.towers) {
            tower.update(deltaTime, this.enemies);
            tower.draw(this.ctx, this.tileMap.tileSize);
        }
        
        // Update and draw walls
        for (const wall of this.walls) {
            wall.update(deltaTime);
            wall.draw(this.ctx, this.tileMap.tileSize);
        }
        
        // Update and draw enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Update enemy and check if attacking
            const isDealingDamage = enemy.update(deltaTime, this.mainTower, this.tileMap);
            enemy.draw(this.ctx, this.tileMap.tileSize);
            
            // Handle dead enemies
            if (enemy.health <= 0) {
                this.gold += enemy.goldValue;
                this.score += enemy.goldValue;
                this.enemies.splice(i, 1);
                this.updateUI();
                continue;
            }
            
            // Handle enemies dealing damage to main tower
            if (isDealingDamage) {
                this.mainTower.takeDamage(enemy.damage);
                this.updateUI();
                
                if (this.mainTower.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Update spawner
        if (this.spawner) {
            // If wave ended and new wave starting, update game wave number
            const prevSpawnerWaveNumber = this.spawner.waveNumber;
            this.spawner.update(deltaTime, 1, this.enemies); // Always pass 1 as waveNumber to ensure it stays at 1
            
            // If the spawner wave number increased, update the game wave number
            if (this.spawner.waveNumber > prevSpawnerWaveNumber) {
                this.waveNumber = this.spawner.waveNumber;
                this.updateUI();
            }
        }
        
        // Draw placement preview
        if (this.isPlacingDefense && this.hoveredGridCoords) {
            const { x, y } = this.hoveredGridCoords;
            
            // Get defense dimensions
            let width = 1;
            let height = 1;
            
            if (this.defenseToPlace === 'cannon' || this.defenseToPlace === 'sniper') {
                width = 2;
                height = 2;
            }
            
            // Check if placement is valid
            const canPlace = this.tileMap.canPlaceDefense(x, y, width, height);
            
            // Draw semi-transparent preview
            this.ctx.globalAlpha = canPlace ? 0.5 : 0.3;
            
            // Calculate offset for canvas centering
            this.ctx.save();
            this.ctx.translate(offsetX, offsetY);
            
            // Draw placement area
            this.ctx.fillStyle = canPlace ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)';
            this.ctx.fillRect(
                x * this.tileMap.tileSize,
                y * this.tileMap.tileSize,
                width * this.tileMap.tileSize,
                height * this.tileMap.tileSize
            );
            
            this.ctx.restore();
            this.ctx.globalAlpha = 1.0;
        }
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    handleResize() {
        // Set canvas size to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    handleClick(event) {
        // If not playing, ignore clicks
        if (this.gameState !== 'playing') {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridPos = this.tileMap.screenToGrid(clickX, clickY);
        const gridX = gridPos.x;
        const gridY = gridPos.y;
        
        // Check if coordinates are valid
        if (gridX < 0 || gridX >= this.tileMap.cols || gridY < 0 || gridY >= this.tileMap.rows) {
            return;
        }
        
        if (this.isPlacingDefense) {
            this.placeDefense(gridX, gridY);
        } else {
            // Select defense for upgrading/selling
            this.selectDefenseAt(gridX, gridY);
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridPos = this.tileMap.screenToGrid(mouseX, mouseY);
        const gridX = gridPos.x;
        const gridY = gridPos.y;
        
        // Check if coordinates are valid
        if (gridX >= 0 && gridX < this.tileMap.cols && gridY >= 0 && gridY < this.tileMap.rows) {
            this.hoveredGridCoords = { x: gridX, y: gridY };
        } else {
            this.hoveredGridCoords = null;
        }
    }
    
    placeDefense(x, y) {
        // Get defense dimensions
        let width = 1;
        let height = 1;
        let defense = null;
        let cost = 0;
        
        if (this.defenseToPlace === 'cannon') {
            width = 2;
            height = 2;
            cost = 50;
        } else if (this.defenseToPlace === 'sniper') {
            width = 2;
            height = 2;
            cost = 75;
        } else if (this.defenseToPlace === 'wall') {
            width = 1;
            height = 1;
            cost = 25;
        }
        
        // Check if placement is valid
        if (!this.tileMap.canPlaceDefense(x, y, width, height)) {
            console.log('Cannot place defense here');
            return;
        }
        
        // Check if enough gold
        if (this.gold < cost) {
            console.log('Not enough gold');
            return;
        }
        
        // Create defense based on type
        if (this.defenseToPlace === 'cannon') {
            defense = new CannonTower(x, y);
            defense.game = this; // Add reference to game
            this.towers.push(defense);
        } else if (this.defenseToPlace === 'sniper') {
            defense = new SniperTower(x, y);
            defense.game = this; // Add reference to game
            this.towers.push(defense);
        } else if (this.defenseToPlace === 'wall') {
            defense = new Wall(x, y);
            defense.game = this; // Add reference to game
            this.walls.push(defense);
        }
        
        if (defense) {
            // Update gold and mark tiles as occupied
            this.gold -= cost;
            this.tileMap.setRectangleOccupied(x, y, width, height, true);
            this.updateUI();
            
            // Reset placement mode
            this.isPlacingDefense = false;
            this.defenseToPlace = null;
        }
    }
    
    selectDefenseAt(x, y) {
        // Check main tower
        if (this.mainTower) {
            const mtX = this.mainTower.gridX;
            const mtY = this.mainTower.gridY;
            const mtWidth = this.mainTower.width;
            const mtHeight = this.mainTower.height;
            
            if (x >= mtX && x < mtX + mtWidth && y >= mtY && y < mtY + mtHeight) {
                this.ui.showSellUpgradeDialog(this.mainTower);
                return;
            }
        }
        
        // Check towers
        for (const tower of this.towers) {
            const tX = tower.gridX;
            const tY = tower.gridY;
            const tWidth = tower.width;
            const tHeight = tower.height;
            
            if (x >= tX && x < tX + tWidth && y >= tY && y < tY + tHeight) {
                this.ui.showSellUpgradeDialog(tower);
                return;
            }
        }
        
        // Check walls
        for (const wall of this.walls) {
            if (wall.gridX === x && wall.gridY === y) {
                this.ui.showSellUpgradeDialog(wall);
                return;
            }
        }
        
        // No defense selected
        this.selectedDefense = null;
    }
    
    removeDefense(defense) {
        // Check if it's the main tower (can't remove)
        if (defense === this.mainTower) {
            console.log("Can't remove main tower");
            return;
        }
        
        // Free up tiles
        this.tileMap.setRectangleOccupied(
            defense.gridX,
            defense.gridY,
            defense.width,
            defense.height,
            false
        );
        
        // Remove from appropriate array
        if (defense instanceof Wall) {
            const index = this.walls.indexOf(defense);
            if (index !== -1) {
                this.walls.splice(index, 1);
            }
        } else {
            const index = this.towers.indexOf(defense);
            if (index !== -1) {
                this.towers.splice(index, 1);
            }
        }
    }
    
    setDefenseToPlace(type) {
        this.isPlacingDefense = true;
        this.defenseToPlace = type;
        this.selectedDefense = null;
    }
    
    skipWaveTimer() {
        if (this.spawner) {
            this.spawner.skipTimer();
        }
    }
    
    updateUI() {
        document.getElementById('wave-counter').textContent = this.waveNumber;
        document.getElementById('gold-counter').textContent = this.gold;
    }
    
    gameOver() {
        this.gameState = 'game-over';
        
        // Clear only in-game entities, don't reset position or recreate objects
        this.enemies = [];
        
        // Update UI with final score
        this.ui.showGameOver(this.score);
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 