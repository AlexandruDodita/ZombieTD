// Base class for all defensive structures
class Defense {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.level = 1;
        this.upgradeCost = 50;
    }
    
    draw(ctx, tileSize) {
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = 20 * tileSize; // Assuming 20x15 grid
        const mapHeight = 15 * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Restore context
        ctx.restore();
    }
    
    upgrade() {
        this.level++;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
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
    }
    
    update(deltaTime, enemies) {
        this.fireTimer -= deltaTime / 1000;
        
        if (this.fireTimer <= 0 && enemies.length > 0) {
            this.findTarget(enemies);
            
            if (this.target) {
                this.fire();
                this.fireTimer = 1 / this.fireRate;
            }
        }
    }
    
    findTarget(enemies) {
        this.target = null;
        let closestDistance = this.range * 40; // Range in pixels
        
        for (const enemy of enemies) {
            const dx = enemy.x - ((this.gridX * 40) + 20);
            const dy = enemy.y - ((this.gridY * 40) + 20);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                this.target = enemy;
            }
        }
    }
    
    fire() {
        if (this.target) {
            this.target.takeDamage(this.damage);
        }
    }
    
    upgrade() {
        super.upgrade();
        this.damage = Math.floor(this.damage * 1.2);
        this.range += 0.5;
        this.fireRate *= 1.1;
    }
}

export class MainTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 4;
        this.damage = 15;
        this.fireRate = 1.5;
        this.upgradeCost = 100;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = 20 * tileSize;
        const mapHeight = 15 * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw main tower (a blue pentagon)
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo(x + tileSize / 2, y);
        ctx.lineTo(x + tileSize, y + tileSize / 3);
        ctx.lineTo(x + tileSize - tileSize / 4, y + tileSize);
        ctx.lineTo(x + tileSize / 4, y + tileSize);
        ctx.lineTo(x, y + tileSize / 3);
        ctx.closePath();
        ctx.fill();
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), x + tileSize / 2, y + tileSize / 2);
        
        // Draw range circle
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            x + tileSize / 2,
            y + tileSize / 2,
            this.range * tileSize,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    upgrade() {
        super.upgrade();
        this.range += 0.5;
    }
}

export class CannonTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 2.5;
        this.damage = 20;
        this.fireRate = 0.8;
        this.upgradeCost = 75;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = 20 * tileSize;
        const mapHeight = 15 * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw cannon tower (red circle with barrel)
        ctx.fillStyle = '#e74c3c';
        
        // Draw tower base
        ctx.beginPath();
        ctx.arc(
            x + tileSize / 2,
            y + tileSize / 2,
            tileSize / 2 - 5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw cannon barrel
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(
            x + tileSize / 2 - 5,
            y + tileSize / 2 - 15,
            10,
            30
        );
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), x + tileSize / 2, y + tileSize / 2);
        
        // Draw range circle
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            x + tileSize / 2,
            y + tileSize / 2,
            this.range * tileSize,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        ctx.restore();
    }
    
    upgrade() {
        super.upgrade();
        this.damage = Math.floor(this.damage * 1.3);
    }
}

export class SniperTower extends Tower {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.range = 5;
        this.damage = 30;
        this.fireRate = 0.5;
        this.upgradeCost = 100;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = 20 * tileSize;
        const mapHeight = 15 * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw sniper tower (a green triangle)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(x + tileSize / 2, y);
        ctx.lineTo(x + tileSize, y + tileSize);
        ctx.lineTo(x, y + tileSize);
        ctx.closePath();
        ctx.fill();
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), x + tileSize / 2, y + tileSize / 2 + 5);
        
        // Draw range circle
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            x + tileSize / 2,
            y + tileSize / 2,
            this.range * tileSize,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        ctx.restore();
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
        this.health = 100;
        this.maxHealth = 100;
        this.upgradeCost = 25;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = 20 * tileSize;
        const mapHeight = 15 * tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Position in grid
        const x = this.gridX * tileSize;
        const y = this.gridY * tileSize;
        
        // Draw wall (gray square)
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(
            x + 2,
            y + 2,
            tileSize - 4,
            tileSize - 4
        );
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), x + tileSize / 2, y + tileSize / 2);
        
        // Draw health bar
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = tileSize - 10;
        const currentBarWidth = barWidth * healthPercentage;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            x + 5,
            y + tileSize - 10,
            barWidth,
            5
        );
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(
            x + 5,
            y + tileSize - 10,
            currentBarWidth,
            5
        );
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    upgrade() {
        super.upgrade();
        this.maxHealth = Math.floor(this.maxHealth * 1.5);
        this.health = this.maxHealth;
    }
} 