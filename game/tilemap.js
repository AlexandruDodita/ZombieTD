export class TileMap {
    constructor(cols, rows, tileSize) {
        this.cols = cols;
        this.rows = rows;
        this.tileSize = tileSize;
        
        // Create a 2D grid to track occupied tiles
        this.grid = Array(rows).fill().map(() => Array(cols).fill(false));
    }
    
    draw(ctx) {
        // Draw the grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        
        // Calculate the center of the canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const mapWidth = this.cols * this.tileSize;
        const mapHeight = this.rows * this.tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Apply offset for centering
        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        // Draw vertical lines
        for (let x = 0; x <= this.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.rows * this.tileSize);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.cols * this.tileSize, y * this.tileSize);
            ctx.stroke();
        }
        
        // Draw occupied tiles with a light background
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) {
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
        
        ctx.restore();
    }
    
    // Check if a tile is occupied
    isTileOccupied(x, y) {
        // Check bounds
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return true; // Consider out-of-bounds as occupied
        }
        
        return this.grid[y][x];
    }
    
    // Mark a tile as occupied or free
    setTileOccupied(x, y, isOccupied) {
        // Check bounds
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return;
        }
        
        this.grid[y][x] = isOccupied;
    }
    
    // Convert screen coordinates to grid coordinates
    screenToGrid(screenX, screenY) {
        // Calculate the center of the canvas
        const canvasWidth = document.getElementById('game-canvas').width;
        const canvasHeight = document.getElementById('game-canvas').height;
        const mapWidth = this.cols * this.tileSize;
        const mapHeight = this.rows * this.tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Adjust for the offset
        const adjustedX = screenX - offsetX;
        const adjustedY = screenY - offsetY;
        
        // Convert to grid coordinates
        const gridX = Math.floor(adjustedX / this.tileSize);
        const gridY = Math.floor(adjustedY / this.tileSize);
        
        return { x: gridX, y: gridY };
    }
    
    // Convert grid coordinates to screen coordinates (center of tile)
    gridToScreen(gridX, gridY) {
        // Calculate the center of the canvas
        const canvasWidth = document.getElementById('game-canvas').width;
        const canvasHeight = document.getElementById('game-canvas').height;
        const mapWidth = this.cols * this.tileSize;
        const mapHeight = this.rows * this.tileSize;
        
        const offsetX = (canvasWidth - mapWidth) / 2;
        const offsetY = (canvasHeight - mapHeight) / 2;
        
        // Convert to screen coordinates (center of tile)
        const screenX = offsetX + (gridX * this.tileSize) + (this.tileSize / 2);
        const screenY = offsetY + (gridY * this.tileSize) + (this.tileSize / 2);
        
        return { x: screenX, y: screenY };
    }
    
    // Find an unoccupied tile along the edge of the map
    findUnoccupiedEdgeTile() {
        const edgeTiles = [];
        
        // Top and bottom edges
        for (let x = 0; x < this.cols; x++) {
            if (!this.isTileOccupied(x, 0)) {
                edgeTiles.push({ x, y: 0 });
            }
            if (!this.isTileOccupied(x, this.rows - 1)) {
                edgeTiles.push({ x, y: this.rows - 1 });
            }
        }
        
        // Left and right edges (excluding corners which are already counted)
        for (let y = 1; y < this.rows - 1; y++) {
            if (!this.isTileOccupied(0, y)) {
                edgeTiles.push({ x: 0, y });
            }
            if (!this.isTileOccupied(this.cols - 1, y)) {
                edgeTiles.push({ x: this.cols - 1, y });
            }
        }
        
        // If no free edge tiles, return null
        if (edgeTiles.length === 0) {
            return null;
        }
        
        // Return a random unoccupied edge tile
        return edgeTiles[Math.floor(Math.random() * edgeTiles.length)];
    }
} 