import { TileMap } from './tilemap.js';
import { MainTower, CannonTower, SniperTower, Wall } from './defenses.js';
import { Zombie, Runner, Tank, Boss } from './enemies.js';
import { Spawner } from './spawner.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.gold = 100;
        this.waveNumber = 1;
        this.baseHealth = 100;
        this.selectedTower = null;
        this.isPlacingDefense = false;
        this.defenseToPlace = null;
        
        // Game entities
        this.tileMap = null;
        this.towers = [];
        this.walls = [];
        this.enemies = [];
        this.mainTower = null;
        this.spawner = null;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        
        // Event listeners
        window.addEventListener('resize', this.handleResize);
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        
        // UI buttons
        document.getElementById('start-wave').addEventListener('click', () => this.startWave());
        document.getElementById('place-cannon').addEventListener('click', () => this.setDefenseToPlace('cannon'));
        document.getElementById('place-sniper').addEventListener('click', () => this.setDefenseToPlace('sniper'));
        document.getElementById('place-wall').addEventListener('click', () => this.setDefenseToPlace('wall'));
        document.getElementById('upgrade-tower').addEventListener('click', () => this.upgradeTower());
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.handleResize(); // Set initial canvas size
        
        // Create tile map (20x15 grid with 40px tiles)
        this.tileMap = new TileMap(20, 15, 40);
        
        // Create main tower at center
        const centerX = Math.floor(this.tileMap.cols / 2);
        const centerY = Math.floor(this.tileMap.rows / 2);
        this.mainTower = new MainTower(centerX, centerY);
        this.tileMap.setTileOccupied(centerX, centerY, true);
        
        // Create spawner
        this.spawner = new Spawner(this.tileMap);
        
        // Update UI
        this.updateUI();
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tilemap grid
        this.tileMap.draw(this.ctx);
        
        // Update and draw towers
        this.mainTower.update(deltaTime, this.enemies);
        this.mainTower.draw(this.ctx, this.tileMap.tileSize);
        
        for (const tower of this.towers) {
            tower.update(deltaTime, this.enemies);
            tower.draw(this.ctx, this.tileMap.tileSize);
        }
        
        // Update and draw walls
        for (const wall of this.walls) {
            wall.draw(this.ctx, this.tileMap.tileSize);
        }
        
        // Update and draw enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.update(deltaTime, this.mainTower, this.tileMap);
            enemy.draw(this.ctx, this.tileMap.tileSize);
            
            // Handle dead enemies
            if (enemy.health <= 0) {
                this.gold += enemy.goldValue;
                this.enemies.splice(i, 1);
                this.updateUI();
            }
            
            // Handle enemies reaching main tower
            if (enemy.hasReachedTarget(this.mainTower)) {
                this.baseHealth -= enemy.damage;
                this.enemies.splice(i, 1);
                this.updateUI();
                
                if (this.baseHealth <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Update spawner
        this.spawner.update(deltaTime, this.waveNumber, this.enemies);
        
        // Draw placement preview
        if (this.isPlacingDefense && this.mouseGridPos) {
            const { x, y } = this.mouseGridPos;
            
            // Draw semi-transparent preview
            this.ctx.globalAlpha = 0.5;
            if (this.defenseToPlace === 'cannon') {
                new CannonTower(x, y).draw(this.ctx, this.tileMap.tileSize);
            } else if (this.defenseToPlace === 'sniper') {
                new SniperTower(x, y).draw(this.ctx, this.tileMap.tileSize);
            } else if (this.defenseToPlace === 'wall') {
                new Wall(x, y).draw(this.ctx, this.tileMap.tileSize);
            }
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
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridX = Math.floor(clickX / this.tileMap.tileSize);
        const gridY = Math.floor(clickY / this.tileMap.tileSize);
        
        // Check if coordinates are valid
        if (gridX < 0 || gridX >= this.tileMap.cols || gridY < 0 || gridY >= this.tileMap.rows) {
            return;
        }
        
        if (this.isPlacingDefense) {
            this.placeDefense(gridX, gridY);
        } else {
            // Select tower for upgrading
            this.selectTowerAt(gridX, gridY);
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridX = Math.floor(mouseX / this.tileMap.tileSize);
        const gridY = Math.floor(mouseY / this.tileMap.tileSize);
        
        // Check if coordinates are valid
        if (gridX >= 0 && gridX < this.tileMap.cols && gridY >= 0 && gridY < this.tileMap.rows) {
            this.mouseGridPos = { x: gridX, y: gridY };
        } else {
            this.mouseGridPos = null;
        }
    }
    
    placeDefense(x, y) {
        // Check if tile is already occupied
        if (this.tileMap.isTileOccupied(x, y)) {
            console.log('Tile is already occupied');
            return;
        }
        
        let cost = 0;
        let defense = null;
        
        // Create defense based on type
        if (this.defenseToPlace === 'cannon') {
            cost = 50;
            if (this.gold >= cost) {
                defense = new CannonTower(x, y);
                this.towers.push(defense);
            }
        } else if (this.defenseToPlace === 'sniper') {
            cost = 75;
            if (this.gold >= cost) {
                defense = new SniperTower(x, y);
                this.towers.push(defense);
            }
        } else if (this.defenseToPlace === 'wall') {
            cost = 25;
            if (this.gold >= cost) {
                defense = new Wall(x, y);
                this.walls.push(defense);
            }
        }
        
        if (defense) {
            // Update gold and mark tile as occupied
            this.gold -= cost;
            this.tileMap.setTileOccupied(x, y, true);
            this.updateUI();
            
            // Reset placement mode
            this.isPlacingDefense = false;
            this.defenseToPlace = null;
        } else {
            console.log('Not enough gold');
        }
    }
    
    selectTowerAt(x, y) {
        // Check main tower
        if (this.mainTower.gridX === x && this.mainTower.gridY === y) {
            this.selectedTower = this.mainTower;
            document.getElementById('upgrade-tower').disabled = false;
            return;
        }
        
        // Check other towers
        for (const tower of this.towers) {
            if (tower.gridX === x && tower.gridY === y) {
                this.selectedTower = tower;
                document.getElementById('upgrade-tower').disabled = false;
                return;
            }
        }
        
        // No tower selected
        this.selectedTower = null;
        document.getElementById('upgrade-tower').disabled = true;
    }
    
    upgradeTower() {
        if (this.selectedTower && this.gold >= this.selectedTower.upgradeCost) {
            this.gold -= this.selectedTower.upgradeCost;
            this.selectedTower.upgrade();
            this.updateUI();
        }
    }
    
    setDefenseToPlace(type) {
        this.isPlacingDefense = true;
        this.defenseToPlace = type;
        this.selectedTower = null;
        document.getElementById('upgrade-tower').disabled = true;
    }
    
    startWave() {
        if (!this.spawner.isSpawning) {
            this.spawner.startWave();
        }
    }
    
    updateUI() {
        document.getElementById('wave-counter').textContent = this.waveNumber;
        document.getElementById('gold-counter').textContent = this.gold;
        document.getElementById('health-counter').textContent = this.baseHealth;
        
        // Disable buttons if not enough gold
        document.getElementById('place-cannon').disabled = this.gold < 50;
        document.getElementById('place-sniper').disabled = this.gold < 75;
        document.getElementById('place-wall').disabled = this.gold < 25;
        
        if (this.selectedTower) {
            document.getElementById('upgrade-tower').disabled = this.gold < this.selectedTower.upgradeCost;
        }
    }
    
    gameOver() {
        alert('Game Over! Your base was destroyed.');
        // Could reset the game here
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 