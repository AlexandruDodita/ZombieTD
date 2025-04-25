import { Zombie, Runner, Tank, Boss } from './enemies.js';

export class Spawner {
    constructor(tileMap, game) {
        this.tileMap = tileMap;
        this.game = game; // Store game reference
        this.isSpawning = false;
        this.waveTimer = 0; // Start the first wave immediately
        this.spawnTimer = 0;
        this.enemiesLeftToSpawn = 0;
        this.waveNumber = 0; // Start at 0 so first wave will be 1
        this.spawnedEnemies = [];
        this.waveEnded = true; // Set to true to trigger first wave immediately
        
        // Wave settings
        this.timeBetweenWaves = 10000; // 10 seconds
        this.timeBetweenSpawns = 1000; // 1 second
        
        // UI for wave timer
        this.createWaveTimerUI();
    }
    
    createWaveTimerUI() {
        // Create wave timer UI if it doesn't exist
        if (!document.getElementById('wave-timer-container')) {
            // Create container
            const waveTimerContainer = document.createElement('div');
            waveTimerContainer.id = 'wave-timer-container';
            waveTimerContainer.style.position = 'absolute';
            waveTimerContainer.style.top = '10px';
            waveTimerContainer.style.left = '50%';
            waveTimerContainer.style.transform = 'translateX(-50%)';
            waveTimerContainer.style.textAlign = 'center';
            
            // Create timer display
            const waveTimer = document.createElement('div');
            waveTimer.id = 'wave-timer';
            waveTimer.style.fontSize = '24px';
            waveTimer.style.fontWeight = 'bold';
            waveTimer.style.color = '#fff';
            waveTimer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            waveTimer.textContent = 'Next Wave: 10s';
            
            // Create skip button
            const skipButton = document.createElement('button');
            skipButton.id = 'skip-timer-button';
            skipButton.textContent = 'Skip Timer';
            skipButton.style.marginTop = '5px';
            skipButton.style.padding = '5px 15px';
            skipButton.style.backgroundColor = '#e74c3c';
            skipButton.style.color = '#fff';
            skipButton.style.border = 'none';
            skipButton.style.borderRadius = '4px';
            skipButton.style.cursor = 'pointer';
            
            // Add hover effect
            skipButton.addEventListener('mouseover', () => {
                skipButton.style.backgroundColor = '#c0392b';
            });
            skipButton.addEventListener('mouseout', () => {
                skipButton.style.backgroundColor = '#e74c3c';
            });
            
            // Add click event (actual functionality will be connected in game.js)
            skipButton.addEventListener('click', () => {
                if (typeof this.onSkipTimer === 'function') {
                    this.onSkipTimer();
                }
            });
            
            // Add elements to container
            waveTimerContainer.appendChild(waveTimer);
            waveTimerContainer.appendChild(skipButton);
            
            // Add container to document
            document.body.appendChild(waveTimerContainer);
            
            // Initially hide the UI
            this.hideWaveTimerUI();
        }
    }
    
    showWaveTimerUI() {
        const container = document.getElementById('wave-timer-container');
        if (container) {
            container.style.display = 'block';
        }
    }
    
    hideWaveTimerUI() {
        const container = document.getElementById('wave-timer-container');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    updateWaveTimerUI(seconds) {
        const timerElement = document.getElementById('wave-timer');
        if (timerElement) {
            timerElement.textContent = `Next Wave: ${seconds}s`;
        }
    }
    
    update(deltaTime, waveNumber, currentEnemies) {
        // Reference to current enemies for adding new spawns
        this.spawnedEnemies = currentEnemies;
        
        if (this.isSpawning) {
            // Hide the wave timer UI during spawning
            this.hideWaveTimerUI();
            
            // Update spawn timer
            this.spawnTimer -= deltaTime;
            
            if (this.spawnTimer <= 0 && this.enemiesLeftToSpawn > 0) {
                this.spawnEnemy();
                this.spawnTimer = this.timeBetweenSpawns;
                this.enemiesLeftToSpawn--;
                
                if (this.enemiesLeftToSpawn <= 0) {
                    this.isSpawning = false;
                    this.waveEnded = true;
                    this.waveTimer = this.timeBetweenWaves; // Set timer for next wave
                }
            }
        } else {
            // Check if all enemies are cleared and wave has ended
            if (this.waveEnded && currentEnemies.length === 0) {
                // Show the wave timer UI and update it
                this.showWaveTimerUI();
                
                // Update wave timer
                this.waveTimer -= deltaTime;
                
                // Update the UI display
                const secondsLeft = Math.ceil(this.waveTimer / 1000);
                this.updateWaveTimerUI(secondsLeft);
                
                if (this.waveTimer <= 0) {
                    this.startWave();
                    this.waveEnded = false;
                }
            }
        }
    }
    
    startWave() {
        // Hide the wave timer UI
        this.hideWaveTimerUI();
        
        // Reset timers
        this.isSpawning = true;
        this.waveTimer = this.timeBetweenWaves;
        this.spawnTimer = 0;
        
        // Increment the wave number in the spawner
        this.waveNumber++;
        
        // Calculate number of enemies based on wave
        this.enemiesLeftToSpawn = Math.min(5 + Math.floor(this.waveNumber * 1.5), 30);
        
        console.log(`Starting wave ${this.waveNumber} with ${this.enemiesLeftToSpawn} enemies`);
    }
    
    skipTimer() {
        if (!this.isSpawning && this.waveEnded) {
            this.waveTimer = 0;
        }
    }
    
    // Set a callback function to handle skip button clicks
    setSkipTimerCallback(callback) {
        this.onSkipTimer = callback;
    }
    
    spawnEnemy() {
        // Find an unoccupied edge tile
        const spawnTile = this.tileMap.findUnoccupiedEdgeTile();
        if (!spawnTile) {
            console.log('No available spawn tiles');
            return;
        }
        
        // Create appropriate enemy based on wave number, passing the game reference
        let enemy;
        
        // Check if it's a boss wave (every 10 waves)
        if (this.waveNumber % 10 === 0) {
            enemy = new Boss(spawnTile.x, spawnTile.y, this.game); // Pass game reference
        } else {
            // Random enemy type with weights based on wave number
            const rand = Math.random();
            
            if (this.waveNumber < 3) {
                // Early waves: mostly zombies
                enemy = new Zombie(spawnTile.x, spawnTile.y, this.game);
            } else if (this.waveNumber < 5) {
                // Mid waves: zombies and runners
                if (rand < 0.7) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y, this.game);
                } else {
                    enemy = new Runner(spawnTile.x, spawnTile.y, this.game);
                }
            } else if (this.waveNumber < 8) {
                // Later waves: zombies, runners, and a few tanks
                if (rand < 0.5) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y, this.game);
                } else if (rand < 0.8) {
                    enemy = new Runner(spawnTile.x, spawnTile.y, this.game);
                } else {
                    enemy = new Tank(spawnTile.x, spawnTile.y, this.game);
                }
            } else {
                // End waves: mix of all types
                if (rand < 0.4) {
                    enemy = new Zombie(spawnTile.x, spawnTile.y, this.game);
                } else if (rand < 0.7) {
                    enemy = new Runner(spawnTile.x, spawnTile.y, this.game);
                } else {
                    enemy = new Tank(spawnTile.x, spawnTile.y, this.game);
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
    
    // Add reset method for game restart
    reset() {
        this.isSpawning = false;
        this.waveTimer = 0; // Start the first wave immediately 
        this.spawnTimer = 0;
        this.enemiesLeftToSpawn = 0;
        this.waveNumber = 0; // Start at 0 so first wave will be 1
        this.waveEnded = true; // Set to true to trigger first wave immediately
        
        // Hide any UI elements
        this.hideWaveTimerUI();
    }
} 