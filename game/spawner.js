import { Zombie, Runner, Tank, Boss } from './enemies.js';

export class Spawner {
    constructor(tileMap) {
        this.tileMap = tileMap;
        this.isSpawning = false;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.enemiesLeftToSpawn = 0;
        this.waveNumber = 1;
        this.spawnedEnemies = [];
        
        // Wave settings
        this.timeBetweenWaves = 30000; // 30 seconds
        this.timeBetweenSpawns = 1000; // 1 second
    }
    
    update(deltaTime, waveNumber, currentEnemies) {
        // Reference to current enemies for adding new spawns
        this.spawnedEnemies = currentEnemies;
        this.waveNumber = waveNumber;
        
        if (this.isSpawning) {
            // Update spawn timer
            this.spawnTimer -= deltaTime;
            
            if (this.spawnTimer <= 0 && this.enemiesLeftToSpawn > 0) {
                this.spawnEnemy();
                this.spawnTimer = this.timeBetweenSpawns;
                this.enemiesLeftToSpawn--;
                
                if (this.enemiesLeftToSpawn <= 0) {
                    this.isSpawning = false;
                }
            }
        } else {
            // Update wave timer
            this.waveTimer -= deltaTime;
            
            if (this.waveTimer <= 0) {
                this.startWave();
            }
        }
    }
    
    startWave() {
        // Reset timers
        this.isSpawning = true;
        this.waveTimer = this.timeBetweenWaves;
        this.spawnTimer = 0;
        
        // Calculate number of enemies based on wave
        this.enemiesLeftToSpawn = Math.min(5 + Math.floor(this.waveNumber * 1.5), 30);
        
        console.log(`Starting wave ${this.waveNumber} with ${this.enemiesLeftToSpawn} enemies`);
    }
    
    spawnEnemy() {
        // Find an unoccupied edge tile
        const spawnTile = this.tileMap.findUnoccupiedEdgeTile();
        if (!spawnTile) {
            console.log('No available spawn tiles');
            return;
        }
        
        // Create appropriate enemy based on wave number
        let enemy;
        
        // Check if it's a boss wave (every 10 waves)
        if (this.waveNumber % 10 === 0) {
            enemy = new Boss(spawnTile.x, spawnTile.y);
        } else {
            // Random enemy type with weights based on wave number
            const rand = Math.random();
            
            if (this.waveNumber < 3) {
                // Early waves: mostly zombies
                enemy = new Zombie(spawnTile.x, spawnTile.y);
            } else if (this.waveNumber < 5) {
                // Mid waves: zombies and runners
                if (rand < 0.7) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y);
                } else {
                    enemy = new Runner(spawnTile.x, spawnTile.y);
                }
            } else if (this.waveNumber < 8) {
                // Later waves: zombies, runners, and a few tanks
                if (rand < 0.5) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y);
                } else if (rand < 0.8) {
                    enemy = new Runner(spawnTile.x, spawnTile.y);
                } else {
                    enemy = new Tank(spawnTile.x, spawnTile.y);
                }
            } else {
                // End waves: mix of all types
                if (rand < 0.4) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y);
                } else if (rand < 0.7) {
                    enemy = new Runner(spawnTile.x, spawnTile.y);
                } else {
                    enemy = new Tank(spawnTile.x, spawnTile.y);
                }
            }
        }
        
        // Scale enemy health based on wave number
        if (this.waveNumber > 1) {
            const healthMultiplier = 1 + (this.waveNumber - 1) * 0.1;
            enemy.health *= healthMultiplier;
            enemy.maxHealth *= healthMultiplier;
        }
        
        // Add enemy to game
        this.spawnedEnemies.push(enemy);
    }
} 