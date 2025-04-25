// Base class for all enemy types
class Enemy {
    constructor(gridX, gridY, game) {
        this.game = game; // Store game reference
        this.tileSize = this.game.tileMap.tileSize;
        
        // Position on the grid
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Position in pixels (for smooth movement)
        this.x = gridX * this.tileSize + this.tileSize / 2; // Center of tile
        this.y = gridY * this.tileSize + this.tileSize / 2;
        
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
        
        // Attack properties
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRate = 0.66; // Attacks per second (approx 1.5 sec cooldown)
        
        // Animation properties
        this.animationState = 'moving'; // 'moving', 'attacking', 'recoiling'
        this.animationTimer = 0;
        this.dashDistance = 5; // Pixels to dash forward during attack
        this.dashDuration = 150; // Milliseconds
        this.recoilDuration = 250; // Milliseconds
        
        // Store original position for animation
        this.baseX = this.x;
        this.baseY = this.y;
        // Direction for dash animation
        this.directionX = 0;
        this.directionY = 0;
    }
    
    update(deltaTime, mainTower, tileMap) {
        // Update animation state
        this.updateAnimation(deltaTime);
        
        // Check if we've reached the main tower
        if (this.hasReachedTarget(mainTower)) {
            if (!this.isAttacking) {
                this.isAttacking = true;
                this.attackCooldown = 0; // Attack immediately the first time
            }
            
            // Handle attack cooldown
            this.attackCooldown -= deltaTime / 1000;
            
            if (this.attackCooldown <= 0 && this.animationState === 'moving') {
                // Start attack animation
                this.startAttackAnimation(mainTower);
                
                // Reset attack cooldown
                this.attackCooldown = 1 / this.attackRate;
                return true; // Signal that we're dealing damage
            }
            
            return false; // Still attacking but not dealing damage this frame
        }
        
        // If no longer in range, stop attacking
        if (this.isAttacking && !this.hasReachedTarget(mainTower)) {
            this.isAttacking = false;
        }
        
        // If in animation, don't move
        if (this.animationState !== 'moving') {
            return false;
        }
        
        // Always set target to main tower tile
        this.targetX = mainTower.gridX;
        this.targetY = mainTower.gridY;

        // Decide next grid step
        let stepX = 0;
        let stepY = 0;

        const diffX = this.targetX - this.gridX;
        const diffY = this.targetY - this.gridY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            stepX = Math.sign(diffX);
        } else if (diffY !== 0) {
            stepY = Math.sign(diffY);
        }

        let nextX = this.gridX + stepX;
        let nextY = this.gridY + stepY;

        // If desired tile occupied, try alternate axis
        if (tileMap.isTileOccupied(nextX, nextY)) {
            // try swapping axes
            if (stepX !== 0 && !tileMap.isTileOccupied(this.gridX, this.gridY + Math.sign(diffY))) {
                nextX = this.gridX;
                nextY = this.gridY + Math.sign(diffY);
            } else if (stepY !== 0 && !tileMap.isTileOccupied(this.gridX + Math.sign(diffX), this.gridY)) {
                nextX = this.gridX + Math.sign(diffX);
                nextY = this.gridY;
            } else {
                // Try any free neighbor that is closer to target
                const neighbors = [
                    {x: this.gridX + 1, y: this.gridY},
                    {x: this.gridX - 1, y: this.gridY},
                    {x: this.gridX, y: this.gridY},
                    {x: this.gridX, y: this.gridY + 1},
                    {x: this.gridX, y: this.gridY - 1}
                ];
                let found = false;
                for (const n of neighbors) {
                    if (!tileMap.isTileOccupied(n.x, n.y)) {
                        nextX = n.x;
                        nextY = n.y;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // stuck, don't move this frame
                    return false;
                }
            }
        }

        // Convert target tile to pixel center
        const targetPixelX = nextX * this.tileSize + this.tileSize / 2;
        const targetPixelY = nextY * this.tileSize + this.tileSize / 2;

        // Move towards that pixel
        const dx = targetPixelX - this.x;
        const dy = targetPixelY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            const moveDist = this.speed * (deltaTime / 1000);
            if (moveDist >= distance) {
                // Arrive at tile center
                this.x = targetPixelX;
                this.y = targetPixelY;
                this.gridX = nextX;
                this.gridY = nextY;
            } else {
                this.x += dirX * moveDist;
                this.y += dirY * moveDist;
                // Update grid based on new pixel pos
                this.gridX = Math.floor(this.x / this.tileSize);
                this.gridY = Math.floor(this.y / this.tileSize);
            }
            
            // Update base position for animations
            this.baseX = this.x;
            this.baseY = this.y;
        }
        
        return false; // Not attacking
    }
    
    updateAnimation(deltaTime) {
        if (this.animationState === 'attacking') {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer < this.dashDuration) {
                // Calculate dash progress (0 to 1)
                const progress = this.animationTimer / this.dashDuration;
                // Ease out function: progress * (2 - progress)
                const easeOut = progress * (2 - progress);
                
                // Apply dash forward effect
                this.x = this.baseX + this.directionX * this.dashDistance * easeOut;
                this.y = this.baseY + this.directionY * this.dashDistance * easeOut;
            } else {
                // Transition to recoil phase
                this.animationState = 'recoiling';
                this.animationTimer = 0;
            }
        } else if (this.animationState === 'recoiling') {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer < this.recoilDuration) {
                // Calculate recoil progress (0 to 1)
                const progress = this.animationTimer / this.recoilDuration;
                // Ease in function: progress * progress
                const easeIn = progress * progress;
                
                // Apply recoil effect (from dash position back to base)
                this.x = this.baseX + this.directionX * this.dashDistance * (1 - easeIn);
                this.y = this.baseY + this.directionY * this.dashDistance * (1 - easeIn);
            } else {
                // Animation complete, return to base position
                this.x = this.baseX;
                this.y = this.baseY;
                this.animationState = 'moving';
            }
        }
    }
    
    startAttackAnimation(target) {
        // Calculate direction to target
        const towerCenterX = (target.gridX + target.width / 2) * this.tileSize;
        const towerCenterY = (target.gridY + target.height / 2) * this.tileSize;
        
        const dx = towerCenterX - this.x;
        const dy = towerCenterY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.directionX = dx / distance;
            this.directionY = dy / distance;
        } else {
            this.directionX = 0;
            this.directionY = 0;
        }
        
        // Set animation state
        this.animationState = 'attacking';
        this.animationTimer = 0;
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
        const targetPixelX = currentTarget.x * this.tileSize + this.tileSize / 2;
        const targetPixelY = currentTarget.y * this.tileSize + this.tileSize / 2;
        
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
        this.gridX = Math.floor(this.x / this.tileSize);
        this.gridY = Math.floor(this.y / this.tileSize);
    }
    
    draw(ctx, tileSize) {
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
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
        
        // Draw attack status indicator if attacking
        if (this.isAttacking) {
            // Draw attack cooldown indicator
            const attackProgress = 1 - (this.attackCooldown * this.attackRate);
            
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, tileSize / 3 + 5, 0, Math.PI * 2 * attackProgress);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    hasReachedTarget(mainTower) {
        // Calculate distance to main tower center
        const towerCenterX = (mainTower.gridX + mainTower.width / 2) * this.tileSize;
        const towerCenterY = (mainTower.gridY + mainTower.height / 2) * this.tileSize;
        
        const dx = towerCenterX - this.x;
        const dy = towerCenterY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Define a threshold for reaching the tower (adjust as needed)
        const reachThreshold = this.tileSize * 1.5; // e.g., 1.5 tiles
        
        return distance < reachThreshold || this.isAdjacentToTower(mainTower);
    }
    
    isAdjacentToTower(tower) {
        // Check if we're in a tile adjacent to the tower
        for (let y = 0; y < tower.height; y++) {
            for (let x = 0; x < tower.width; x++) {
                const towerTileX = tower.gridX + x;
                const towerTileY = tower.gridY + y;
                
                // Check all 8 adjacent tiles
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue; // Skip the tower tile itself
                        
                        const adjacentX = towerTileX + dx;
                        const adjacentY = towerTileY + dy;
                        
                        if (this.gridX === adjacentX && this.gridY === adjacentY) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
}

export class Zombie extends Enemy {
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 40;
        this.damage = 10;
        this.goldValue = 10;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
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
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 80;
        this.damage = 5;
        this.goldValue = 15;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
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
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 30;
        this.damage = 20;
        this.goldValue = 25;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
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
    constructor(gridX, gridY, game) {
        super(gridX, gridY, game);
        this.health = 500;
        this.maxHealth = 500;
        this.speed = 25;
        this.damage = 50;
        this.goldValue = 100;
    }
    
    draw(ctx, tileSize) {
        super.draw(ctx, tileSize);
        
        // Get map dimensions dynamically from the tileMap
        const mapWidth = this.game.tileMap.cols * tileSize;
        const mapHeight = this.game.tileMap.rows * tileSize;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
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