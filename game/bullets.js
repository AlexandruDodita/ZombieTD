// Bullet system for towers
export class Bullet {
    constructor(x, y, targetEnemy, config = {}) {
        // Position - store exact game coordinates
        this.x = x;
        this.y = y;
        this.target = targetEnemy;
        
        // Save initial position for debugging if needed
        this.initialX = x;
        this.initialY = y;
        
        // Properties with defaults that can be overridden
        this.damage = config.damage || 10;
        this.penetration = config.penetration || 1; // How many enemies it can hit
        this.splashRadius = config.splashRadius || 0; // 0 for single target
        this.splashMultiplier = config.splashMultiplier || 0.5; // Splash damage multiplier
        this.speed = config.speed || 300; // Pixels per second
        this.size = config.size || 5; // Diameter
        this.color = config.color || '#ffffff';
        this.shape = config.shape || 'circle'; // 'circle', 'rectangle'
        this.width = config.width || this.size; // For rectangle shape
        this.height = config.height || this.size; // For rectangle shape
        
        // State
        this.hitEnemies = new Set(); // Track enemies already hit
        this.isActive = true;
        this.lifeSpan = config.lifeSpan || 3000; // 3 seconds default
    }
    
    update(deltaTime, enemies) {
        // Reduce lifespan
        this.lifeSpan -= deltaTime;
        if (this.lifeSpan <= 0) {
            this.isActive = false;
            return;
        }
        
        // If target is dead or no longer exists, try to find a new target
        if (!this.target || this.target.health <= 0) {
            if (enemies.length > 0) {
                // Find closest enemy that hasn't been hit yet
                let closestDist = Infinity;
                let closestEnemy = null;
                
                for (const enemy of enemies) {
                    if (!this.hitEnemies.has(enemy)) {
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestEnemy = enemy;
                        }
                    }
                }
                
                if (closestEnemy) {
                    this.target = closestEnemy;
                } else {
                    // No valid targets, bullet continues on its last trajectory
                    this.isActive = false;
                    return;
                }
            } else {
                // No enemies left
                this.isActive = false;
                return;
            }
        }
        
        // Move toward target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for collision with target
        if (distance <= this.size / 2 + 15) { // 15 is approx enemy radius
            this.handleCollision(enemies);
            return;
        }
        
        // Move bullet toward target
        const moveDistance = this.speed * (deltaTime / 1000);
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            this.x += dirX * moveDistance;
            this.y += dirY * moveDistance;
        }
    }
    
    handleCollision(enemies) {
        // Check if we've already hit this enemy (avoid multiple collisions)
        if (!this.target || this.hitEnemies.has(this.target)) {
            return;
        }
        
        // Deal damage to primary target
        this.hitEnemies.add(this.target);
        this.target.takeDamage(this.damage);
        
        // Handle splash damage if applicable
        if (this.splashRadius > 0) {
            for (const enemy of enemies) {
                // Skip if already hit or is the primary target
                if (this.hitEnemies.has(enemy) || enemy === this.target) {
                    continue;
                }
                
                // Calculate distance to splash target
                const dx = enemy.x - this.target.x;
                const dy = enemy.y - this.target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Apply splash damage if within radius
                if (distance <= this.splashRadius) {
                    const splashDamage = this.damage * this.splashMultiplier;
                    enemy.takeDamage(splashDamage);
                    this.hitEnemies.add(enemy);
                }
            }
        }
        
        // Check if penetration is used up
        if (this.hitEnemies.size >= this.penetration) {
            this.isActive = false;
        }
    }
    
    draw(ctx, offsetX, offsetY) {
        if (!this.isActive) return;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Draw bullet based on shape
        ctx.fillStyle = this.color;
        
        if (this.shape === 'rectangle') {
            // For rectangle bullets, rotate to face direction of travel
            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const angle = Math.atan2(dy, dx);
                
                // Move to center, rotate, then draw
                ctx.translate(this.x, this.y);
                ctx.rotate(angle);
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                // If no target, just draw without rotation
                ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            }
        } else {
            // Default to circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Different bullet types
export class CannonBullet extends Bullet {
    constructor(x, y, targetEnemy, damage) {
        super(x, y, targetEnemy, {
            damage: damage,
            penetration: 1,
            splashRadius: 40, // Splash damage in 40px radius
            splashMultiplier: 0.5,
            speed: 200,
            size: 8,
            color: '#e74c3c',
            shape: 'circle'
        });
    }
}

export class SniperBullet extends Bullet {
    constructor(x, y, targetEnemy, damage) {
        super(x, y, targetEnemy, {
            damage: damage,
            penetration: 3, // Can hit up to 3 enemies
            splashRadius: 0,
            speed: 500,
            size: 4,
            width: 10, // Longer bullet
            height: 2, // Thinner bullet
            color: '#2ecc71',
            shape: 'rectangle'
        });
    }
}

export class MainTowerBullet extends Bullet {
    constructor(x, y, targetEnemy, damage) {
        super(x, y, targetEnemy, {
            damage: damage,
            penetration: 1,
            splashRadius: 0,
            speed: 350,
            size: 4,
            color: '#3498db',
            shape: 'circle'
        });
    }
} 