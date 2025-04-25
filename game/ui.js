// UI Manager
export class UIManager {
    constructor(game) {
        this.game = game;
        this.currentScene = 'start'; // start, playing, game-over
        
        // Elements
        this.startMenu = document.getElementById('start-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.towerButtons = document.getElementsByClassName('tower-button');
        this.sellUpgradeDialog = document.getElementById('sell-upgrade-dialog');
        
        // Remove the "Start Wave" button if it exists (replaced by auto timer)
        const startWaveBtn = document.getElementById('start-wave');
        if (startWaveBtn) {
            startWaveBtn.remove();
        }
        
        // Hide the health counter text as we're using the health bar
        const healthCounter = document.getElementById('health-counter');
        if (healthCounter && healthCounter.parentElement) {
            healthCounter.parentElement.style.display = 'none';
        }
        
        // Bind methods
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.startGame = this.startGame.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.showScene = this.showScene.bind(this);
        this.selectTower = this.selectTower.bind(this);
        this.showSellUpgradeDialog = this.showSellUpgradeDialog.bind(this);
        this.sellDefense = this.sellDefense.bind(this);
        this.upgradeDefense = this.upgradeDefense.bind(this);
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', this.toggleSidebar);
        
        // Start game button
        document.getElementById('start-game-btn').addEventListener('click', this.startGame);
        
        // Restart game button
        document.getElementById('restart-game-btn').addEventListener('click', this.restartGame);
        
        // Tower buttons
        for (const button of this.towerButtons) {
            button.addEventListener('click', () => this.selectTower(button.dataset.towerType));
        }
        
        // Sell button
        document.getElementById('sell-btn').addEventListener('click', this.sellDefense);
        
        // Upgrade button
        document.getElementById('upgrade-btn').addEventListener('click', this.upgradeDefense);
        
        // Close dialog button
        document.getElementById('close-dialog-btn').addEventListener('click', () => this.sellUpgradeDialog.classList.add('hidden'));
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
    }
    
    showScene(sceneName) {
        this.currentScene = sceneName;
        
        // Hide all scenes/UI elements first
        this.startMenu.classList.add('hidden');
        this.gameOverMenu.classList.add('hidden');
        this.sidebar.classList.add('collapsed'); // Ensure sidebar starts collapsed
        this.sidebarToggle.classList.add('hidden'); // Hide toggle button by default
        
        // Show requested scene
        if (sceneName === 'start') {
            this.startMenu.classList.remove('hidden');
        } else if (sceneName === 'playing') {
            this.sidebarToggle.classList.remove('hidden');
        } else if (sceneName === 'game-over') {
            this.gameOverMenu.classList.remove('hidden');
        }
        
        // Update game state
        this.game.setGameState(sceneName);
    }
    
    startGame() {
        this.showScene('playing');
    }
    
    restartGame() {
        // Simply set the game state to 'playing'. 
        // The setGameState method in game.js already handles calling the reset method.
        this.showScene('playing');
    }
    
    selectTower(towerType) {
        this.game.setDefenseToPlace(towerType);
    }
    
    showSellUpgradeDialog(defense) {
        // Update dialog content based on selected defense
        const dialogTitle = document.getElementById('dialog-title');
        const dialogStats = document.getElementById('dialog-stats');
        const upgradeBtn = document.getElementById('upgrade-btn');
        
        // Set dialog title
        dialogTitle.textContent = defense.constructor.name;
        
        // Set stats
        let statsHtml = `
            <div>Level: ${defense.level}</div>
            <div>Damage: ${defense.damage || 'N/A'}</div>
            <div>Range: ${defense.range || 'N/A'}</div>
        `;
        dialogStats.innerHTML = statsHtml;
        
        // Disable upgrade button if max level
        if (defense.level >= 3) {
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = 'Max Level';
        } else {
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = `Upgrade (${defense.upgradeCost}g)`;
            
            // Disable if not enough gold
            if (this.game.gold < defense.upgradeCost) {
                upgradeBtn.disabled = true;
            }
        }
        
        // Set sell value
        const sellBtn = document.getElementById('sell-btn');
        const sellValue = Math.floor(defense.getTotalValue() * 0.5);
        sellBtn.textContent = `Sell (${sellValue}g)`;
        
        // Show dialog
        this.sellUpgradeDialog.classList.remove('hidden');
        
        // Store reference to selected defense
        this.selectedDefense = defense;
    }
    
    sellDefense() {
        if (!this.selectedDefense) return;
        
        // Calculate sell value (50% of total spent)
        const sellValue = Math.floor(this.selectedDefense.getTotalValue() * 0.5);
        
        // Add gold
        this.game.gold += sellValue;
        
        // Remove from game
        this.game.removeDefense(this.selectedDefense);
        
        // Hide dialog
        this.sellUpgradeDialog.classList.add('hidden');
        this.selectedDefense = null;
        
        // Update UI
        this.game.updateUI();
    }
    
    upgradeDefense() {
        if (!this.selectedDefense) return;
        
        // Check if enough gold
        if (this.game.gold < this.selectedDefense.upgradeCost) {
            return;
        }
        
        // Subtract gold
        this.game.gold -= this.selectedDefense.upgradeCost;
        
        // Upgrade defense
        this.selectedDefense.upgrade();
        
        // Hide dialog and show updated dialog
        this.sellUpgradeDialog.classList.add('hidden');
        this.showSellUpgradeDialog(this.selectedDefense);
        
        // Update UI
        this.game.updateUI();
    }
    
    showGameOver(finalScore) {
        // Update final score
        document.getElementById('final-score').textContent = finalScore;
        
        // Show game over scene
        this.showScene('game-over');
    }
} 