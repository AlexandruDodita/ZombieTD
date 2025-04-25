// Base class for all enemy types
class Enemy {
    constructor(gridX, gridY) {
        // Position on the grid
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Position in pixels (for smooth movement)
        this.x = gridX * 40 + 20; // Center of tile
        this.y = gridY * 40 + 20;
        
        // Enemy properties
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 50; // Pixels per second
        this.damage = 10; // Damage to base when reaching it
        this.goldValue = 10; // Gold rewarded when killed
        
        // Pathfinding
        this.targetX = null;
        this.targetY = null;
        this.path = [];
        this.pathIndex = 0;
    }
    
    update(deltaTime, mainTower, tileMap) {
        // Set target to main tower if not already set
        if (this.targetX === null || this.targetY === null) {
            this.targetX = mainTower.gridX;
            this.targetY = mainTower.gridY;
            
            // Calculate path to target (simplified direct line for now)
            this.calculatePath();
        }
        
        // Move towards target
        this.moveAlongPath(deltaTime);
    }
    
    calculatePath() {
        // Simplified direct path for now
        // In a more complex implementation, this would use A* or similar pathfinding
        this.path = [];
        
        const dx = this.targetX - this.gridX;
        const dy = this.targetY - this.gridY;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 0; i <= steps; i++) {
            const progress = steps === 0 ? 0 : i / steps;
            const x = Math.round(this.gridX + dx * progress);
            const y = Math.round(this.gridY + dy * progress);
            
            this.path.push({ x, y });
        }
    }
    
    moveAlongPath(deltaTime) {
        if (this.pathIndex >= this.path.length) {
            return;
        }
        
        // Get current target point
        const currentTarget = this.path[this.pathIndex];
        const targetPixelX = currentTarget.x * 40 + 20;
        const targetPixelY = currentTarget.y * 40 + 20;
        
        // Calculate direction to target
        const dx = targetPixelX - this.x;
        const dy = targetPixelY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
            // Reached current path point, move to next
            this.pathIndex++;
            return;
        }
        
        // Move towards target
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        this.x += directionX * this.speed * (deltaTime / 1000);
        this.y += directionY * this.speed * (deltaTime / 1000);
        
        // Update grid position based on pixel position
        this.gridX = Math.floor(this.x / 40);
        this.gridY = Math.floor(this.y / 40);
    }
    
    draw(ctx, tileSize) {
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
        
        // Draw health bar
        const healthBarWidth = tileSize - 10;
        const currentHealthWidth = healthBarWidth * (this.health / this.maxHealth);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            this.x - healthBarWidth / 2,
            this.y - tileSize / 2 - 10,
            healthBarWidth,
            5
        );
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(
            this.x - healthBarWidth / 2,
            this.y - tileSize / 2 - 10,
            currentHealthWidth,
            5
        );
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    hasReachedTarget(mainTower) {
        const dx = Math.abs(this.gridX - mainTower.gridX);
        const dy = Math.abs(this.gridY - mainTower.gridY);
        return dx <= 0 && dy <= 0;
    }
}

export class Zombie extends Enemy {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 40;
        this.damage = 10;
        this.goldValue = 10;
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
        
        // Draw zombie (green circle)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(this.x, this.y, tileSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

export class Runner extends Enemy {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 80;
        this.damage = 5;
        this.goldValue = 15;
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
        
        // Draw runner (yellow diamond)
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - tileSize / 3);
        ctx.lineTo(this.x + tileSize / 3, this.y);
        ctx.lineTo(this.x, this.y + tileSize / 3);
        ctx.lineTo(this.x - tileSize / 3, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

export class Tank extends Enemy {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 30;
        this.damage = 20;
        this.goldValue = 25;
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
        
        // Draw tank (purple square)
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(
            this.x - tileSize / 3,
            this.y - tileSize / 3,
            tileSize * 2/3,
            tileSize * 2/3
        );
        
        ctx.restore();
    }
}

export class Boss extends Enemy {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.health = 500;
        this.maxHealth = 500;
        this.speed = 25;
        this.damage = 50;
        this.goldValue = 100;
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
        
        // Draw boss (red hexagon)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        
        const sides = 6;
        const size = tileSize / 2;
        
        ctx.moveTo(this.x + size * Math.cos(0), this.y + size * Math.sin(0));
        
        for (let i = 1; i <= sides; i++) {
            const angle = i * 2 * Math.PI / sides;
            ctx.lineTo(this.x + size * Math.cos(angle), this.y + size * Math.sin(angle));
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Draw crown to indicate boss
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 20);
        ctx.lineTo(this.x - 15, this.y - 30);
        ctx.lineTo(this.x - 5, this.y - 25);
        ctx.lineTo(this.x, this.y - 35);
        ctx.lineTo(this.x + 5, this.y - 25);
        ctx.lineTo(this.x + 15, this.y - 30);
        ctx.lineTo(this.x + 10, this.y - 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
} 