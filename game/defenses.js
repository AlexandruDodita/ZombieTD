// Base class for all defensive structures
class Defense {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.level = 1;
        this.upgradeCost = 50;
        this.width = 1; // Default size is 1x1
        this.height = 1;
        this.baseCost = 0; // Will be set by child classes
        this.totalSpent = 0; // Track total gold spent for selling
        
        // Health properties
        this.health = 100;
        this.maxHealth = 100;
        this.lastHealthChange = 0; // For animation
        this.healthBarOpacity = 0; // Only visible when damaged
        
        // Regeneration properties
        this.regenTimer = 0;
        this.regenRate = 5; // HP per interval
        this.regenInterval = 5000; // 5 seconds
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw health bar if needed
        this.drawHealthBar(ctx, x, y, tileSize);
        
        // Restore context
        ctx.restore();
    }
    
    drawHealthBar(ctx, x, y, tileSize) {
        const isMainTower = this instanceof MainTower;
        const healthPercent = this.health / this.maxHealth;
        
        // For regular towers, only show health bar when damaged
        if (!isMainTower && healthPercent >= 1) {
            this.healthBarOpacity = Math.max(0, this.healthBarOpacity - 0.05);
            if (this.healthBarOpacity <= 0) return;
        } else {
            this.healthBarOpacity = 1;
        }
        
        // Health bar dimensions
        const barWidth = tileSize * this.width;
        const barHeight = 5;
        
        // Position above the tower
        const barX = x;
        const barY = y - 10;
        
        // Draw background
        ctx.globalAlpha = this.healthBarOpacity;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health color based on percentage
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#2ecc71'; // Green
        } else if (healthPercent > 0.3) {
            healthColor = '#f39c12'; // Orange
        } else {
            healthColor = '#e74c3c'; // Red
        }
        
        // Draw health
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        ctx.globalAlpha = 1;
    }
    
    update(deltaTime) {
        // Handle regeneration for non-main towers
        if (!(this instanceof MainTower) && this.health < this.maxHealth) {
            this.regenTimer += deltaTime;
            
            if (this.regenTimer >= this.regenInterval) {
                this.health = Math.min(this.maxHealth, this.health + this.regenRate);
                this.regenTimer = 0;
            }
        }
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.lastHealthChange = Date.now();
        this.healthBarOpacity = 1; // Show health bar
    }
    
    upgrade() {
        // Track total spent for sell value calculation
        this.totalSpent += this.upgradeCost;
        
        this.level++;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
        
        // Increase max health on upgrade
        this.maxHealth = Math.floor(this.maxHealth * 1.2);
        this.health = this.maxHealth; // Heal fully on upgrade
    }
    
    // Get total value of defense (for sell calculation)
    getTotalValue() {
        return this.baseCost + this.totalSpent;
    }
    
    // Get the tiles this defense occupies
    getOccupiedTiles() {
        const tiles = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                tiles.push({
                    x: this.gridX + x,
                    y: this.gridY + y
                });
            }
        }
        
        return tiles;
    }
}

// Base class for all tower types
class Tower extends Defense {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 3;
        this.damage = 10;
        this.fireRate = 1; // Shots per second
        this.fireTimer = 0;
        this.target = null;
        
        // Targeting and barrel rotation
        this.barrelAngle = 0; // in radians
        this.targetAngle = 0; // in radians
        this.rotationSpeed = Math.PI; // radians per second
        
        // Bullet system
        this.bullets = [];
    }
    
    update(deltaTime, enemies) {
        // Call base class update for health regeneration
        super.update(deltaTime);
        
        // Update bullets
        this.updateBullets(deltaTime, enemies);
        
        // Find target and update barrel rotation
        this.findTarget(enemies);
        this.updateBarrelRotation(deltaTime);
        
        // Handle firing
        this.fireTimer -= deltaTime / 1000;
        
        if (this.fireTimer <= 0 && this.target) {
            this.fire();
            this.fireTimer = 1 / this.fireRate;
        }
    }
    
    updateBullets(deltaTime, enemies) {
        // Update existing bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime, enemies);
            
            // Remove inactive bullets
            if (!bullet.isActive) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    findTarget(enemies) {
        this.target = null;
        let closestDistance = this.range * 40; // Range in pixels
        
        // Tower center position in game coordinates
        const towerCenterX = (this.gridX + this.width / 2) * 40;
        const towerCenterY = (this.gridY + this.height / 2) * 40;
        
        for (const enemy of enemies) {
            // Calculate distance from center of tower to enemy
            const dx = enemy.x - towerCenterX;
            const dy = enemy.y - towerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                this.target = enemy;
                
                // Calculate target angle
                this.targetAngle = Math.atan2(dy, dx);
            }
        }
    }
    
    updateBarrelRotation(deltaTime) {
        if (!this.target) return;
        
        // Calculate shortest rotation direction
        let angleDiff = this.targetAngle - this.barrelAngle;
        
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Calculate rotation step
        const rotationStep = this.rotationSpeed * (deltaTime / 1000);
        
        // Rotate towards target
        if (Math.abs(angleDiff) <= rotationStep) {
            this.barrelAngle = this.targetAngle;
        } else if (angleDiff > 0) {
            this.barrelAngle += rotationStep;
        } else {
            this.barrelAngle -= rotationStep;
        }
        
        // Normalize angle to [0, 2*PI]
        while (this.barrelAngle < 0) this.barrelAngle += Math.PI * 2;
        while (this.barrelAngle >= Math.PI * 2) this.barrelAngle -= Math.PI * 2;
    }
    
    fire() {
        if (!this.target) return;
        
        // Calculate center of tower in game coordinates
        const towerCenterX = (this.gridX + this.width / 2) * 40;
        const towerCenterY = (this.gridY + this.height / 2) * 40;
        
        // Create bullet and add to array
        const bullet = new MainTowerBullet(towerCenterX, towerCenterY, this.target, this.damage);
        this.bullets.push(bullet);
    }
    
    drawBase(ctx, x, y, tileSize, color) {
        // Draw base covering the tower's area
        ctx.fillStyle = color;
        ctx.fillRect(x, y, tileSize * this.width, tileSize * this.height);
    }
    
    drawBarrel(ctx, x, y, tileSize, color, length, width) {
        // Center of tower
        const centerX = x + tileSize * this.width / 2;
        const centerY = y + tileSize * this.height / 2;
        
        // Save context to restore after rotation
        ctx.save();
        
        // Translate to center for rotation
        ctx.translate(centerX, centerY);
        ctx.rotate(this.barrelAngle);
        
        // Draw barrel
        ctx.fillStyle = color;
        ctx.fillRect(0, -width / 2, length, width);
        
        // Restore context
        ctx.restore();
    }
    
    drawRangeCircle(ctx, x, y, tileSize, color) {
        // Center of tower
        const centerX = x + tileSize * this.width / 2;
        const centerY = y + tileSize * this.height / 2;
        
        // Draw range circle
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            centerX,
            centerY,
            this.range * tileSize,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
    
    drawBullets(ctx, offsetX, offsetY) {
        for (const bullet of this.bullets) {
            bullet.draw(ctx, offsetX, offsetY);
        }
    }
    
    upgrade() {
        super.upgrade();
        this.damage = Math.floor(this.damage * 1.2);
        this.range += 0.5;
        this.fireRate *= 1.1;
    }
}

// Import bullet types
import { MainTowerBullet, CannonBullet, SniperBullet } from './bullets.js';

export class MainTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 4;
        this.damage = 15;
        this.fireRate = 1.5;
        this.upgradeCost = 100;
        this.baseCost = 0; // Main tower is free
        this.width = 2; // 2x2 size
        this.height = 2;
        
        // Main tower has more health
        this.health = 500;
        this.maxHealth = 500;
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw main tower (2x2 size)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x, y, tileSize * this.width, tileSize * this.height);
        
        // Draw center dot
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(
            x + tileSize * this.width / 2,
            y + tileSize * this.height / 2,
            tileSize / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw rotating guns
        this.drawBarrel(
            ctx,
            x,
            y,
            tileSize,
            '#2980b9',
            tileSize * 0.8,
            tileSize / 4
        );
        
        // Draw range circle - always show for main tower
        this.drawRangeCircle(ctx, x, y, tileSize, 'rgba(52, 152, 219, 0.3)');
        
        // Draw fixed UI health bar (needs canvasWidth/Height *without* offset)
        ctx.restore(); // Restore before drawing UI bar
        this.drawUIHealthBar(ctx, canvasWidth, canvasHeight);
        ctx.save(); // Save again before drawing bullets with offset
        ctx.translate(offsetX, offsetY);
        
        // Draw bullets
        this.drawBullets(ctx, offsetX, offsetY); // Pass offsets here, bullet draw expects them
        
        // Restore context
        ctx.restore();
    }
    
    drawUIHealthBar(ctx, canvasWidth, canvasHeight) {
        // Save the current transform to restore after drawing
        ctx.save();
        // Reset transform to draw in screen space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Health bar dimensions
        const barWidth = 200;
        const barHeight = 15;
        const padding = 10;
        
        // Position in top right corner
        const barX = canvasWidth - barWidth - padding;
        const barY = padding;
        
        // Draw background and border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Calculate health percentage
        const healthPercent = this.health / this.maxHealth;
        
        // Health color based on percentage
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#2ecc71'; // Green
        } else if (healthPercent > 0.3) {
            healthColor = '#f39c12'; // Orange
        } else {
            healthColor = '#e74c3c'; // Red
        }
        
        // Draw health
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Draw health text
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.floor(this.health)} / ${this.maxHealth}`,
            barX + barWidth / 2,
            barY + barHeight / 1.5
        );
        
        // Restore the original transform
        ctx.restore();
    }
    
    update(deltaTime, enemies) {
        // Main tower does not regenerate health, so don't call super.update()
        
        // Update bullets
        this.updateBullets(deltaTime, enemies);
        
        // Find target and update barrel rotation
        this.findTarget(enemies);
        this.updateBarrelRotation(deltaTime);
        
        // Handle firing
        this.fireTimer -= deltaTime / 1000;
        
        if (this.fireTimer <= 0 && this.target) {
            this.fire();
            this.fireTimer = 1 / this.fireRate;
        }
    }
    
    fire() {
        if (!this.target) return;
        
        // Calculate center of tower in game coordinates
        const towerCenterX = (this.gridX + this.width / 2) * 40;
        const towerCenterY = (this.gridY + this.height / 2) * 40;
        
        // Create bullet and add to array
        const bullet = new MainTowerBullet(towerCenterX, towerCenterY, this.target, this.damage);
        this.bullets.push(bullet);
    }
}

export class CannonTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 3;
        this.damage = 12;
        this.fireRate = 0.8; // Shots per second
        this.upgradeCost = 60;
        this.baseCost = 50;
        this.width = 2; // 2x2 size
        this.height = 2;
        
        // Health settings
        this.health = 150;
        this.maxHealth = 150;
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw base
        this.drawBase(ctx, x, y, tileSize, '#e74c3c');
        
        // Draw barrel
        this.drawBarrel(
            ctx,
            x,
            y,
            tileSize,
            '#c0392b',
            tileSize * 0.9,
            tileSize * 0.4
        );
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.level.toString(),
            x + tileSize * this.width / 2,
            y + tileSize * this.height / 2
        );
        
        // Always draw range circle
        this.drawRangeCircle(ctx, x, y, tileSize, 'rgba(231, 76, 60, 0.3)');
        
        // Draw health bar
        this.drawHealthBar(ctx, x, y, tileSize);
        
        // Draw bullets
        this.drawBullets(ctx, offsetX, offsetY);
        
        ctx.restore();
    }
    
    fire() {
        if (!this.target) return;
        
        // Calculate center of tower in game coordinates
        const towerCenterX = (this.gridX + this.width / 2) * 40;
        const towerCenterY = (this.gridY + this.height / 2) * 40;
        
        // Create bullet
        const bullet = new CannonBullet(towerCenterX, towerCenterY, this.target, this.damage);
        this.bullets.push(bullet);
    }
    
    upgrade() {
        super.upgrade();
        this.damage = Math.floor(this.damage * 1.3);
    }
}

export class SniperTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 8;
        this.damage = 35;
        this.fireRate = 0.5; // Shots per second
        this.upgradeCost = 80;
        this.baseCost = 70;
        this.width = 2; // 2x2 size
        this.height = 2;
        
        // Health settings
        this.health = 100;
        this.maxHealth = 100;
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw base
        this.drawBase(ctx, x, y, tileSize, '#2ecc71');
        
        // Draw barrel
        this.drawBarrel(
            ctx,
            x,
            y,
            tileSize,
            '#27ae60',
            tileSize * 1.2,
            tileSize * 0.15
        );
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.level.toString(),
            x + tileSize * this.width / 2,
            y + tileSize * this.height / 2
        );
        
        // Always draw range circle
        this.drawRangeCircle(ctx, x, y, tileSize, 'rgba(46, 204, 113, 0.3)');
        
        // Draw health bar
        this.drawHealthBar(ctx, x, y, tileSize);
        
        // Draw bullets
        this.drawBullets(ctx, offsetX, offsetY);
        
        ctx.restore();
    }
    
    fire() {
        if (!this.target) return;
        
        // Calculate center of tower in game coordinates
        const towerCenterX = (this.gridX + this.width / 2) * 40;
        const towerCenterY = (this.gridY + this.height / 2) * 40;
        
        // Create bullet
        const bullet = new SniperBullet(towerCenterX, towerCenterY, this.target, this.damage);
        this.bullets.push(bullet);
    }
    
    upgrade() {
        super.upgrade();
        this.damage = Math.floor(this.damage * 1.4);
        this.range += 0.8;
    }
}

export class Wall extends Defense {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.upgradeCost = 25;
        this.baseCost = 10;
        this.health = 200;
        this.maxHealth = 200;
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw wall base
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x, y, tileSize, tileSize);
        
        // Draw wall details based on level
        ctx.fillStyle = '#95a5a6';
        
        if (this.level === 1) {
            // Level 1: Basic wall with cracks
            ctx.fillRect(x + tileSize * 0.1, y + tileSize * 0.1, tileSize * 0.8, tileSize * 0.8);
            
            // Add cracks
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.3, y + tileSize * 0.3);
            ctx.lineTo(x + tileSize * 0.6, y + tileSize * 0.7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.7, y + tileSize * 0.2);
            ctx.lineTo(x + tileSize * 0.5, y + tileSize * 0.5);
            ctx.stroke();
        } else if (this.level === 2) {
            // Level 2: Reinforced wall
            ctx.fillRect(x + tileSize * 0.1, y + tileSize * 0.1, tileSize * 0.8, tileSize * 0.8);
            
            // Add reinforcement bars
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.2);
            ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.5);
            ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.8);
            ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.8);
            ctx.stroke();
        } else {
            // Level 3: Metal wall
            ctx.fillStyle = '#34495e';
            ctx.fillRect(x + tileSize * 0.1, y + tileSize * 0.1, tileSize * 0.8, tileSize * 0.8);
            
            // Add metal details
            ctx.fillStyle = '#95a5a6';
            ctx.beginPath();
            ctx.arc(x + tileSize * 0.3, y + tileSize * 0.3, tileSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x + tileSize * 0.7, y + tileSize * 0.3, tileSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x + tileSize * 0.3, y + tileSize * 0.7, tileSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x + tileSize * 0.7, y + tileSize * 0.7, tileSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw health bar
        this.drawHealthBar(ctx, x, y, tileSize);
        
        // Restore context
        ctx.restore();
    }
    
    update(deltaTime) {
        // Call the parent update method for health regeneration
        super.update(deltaTime);
    }
    
    takeDamage(amount) {
        // Call the parent method
        super.takeDamage(amount);
    }
    
    upgrade() {
        super.upgrade();
        
        // Walls get significant health boost on upgrade
        this.maxHealth = Math.floor(this.maxHealth * 1.5);
        this.health = this.maxHealth;
    }
} 