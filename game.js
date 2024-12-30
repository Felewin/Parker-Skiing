class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        
        this.skierImg = new Image();
        this.skierImg.src = 'skier.png';
        this.treeImg = new Image();
        this.treeImg.src = 'tree.png';
        
        this.playerX = window.innerWidth / 2;
        this.playerY = window.innerHeight * 0.4;
        this.direction = 'left';
        this.trees = [];
        this.gameOver = false;
        this.canRestart = false;
        this.startTime = Date.now();
        this.currentScore = 0;
        this.highScore = 0;
        
        this.lastPKeyTime = 0;
        this.easyMode = false;
        this.activeKeys = new Set();  // Track currently pressed keys
        
        this.startAnimation = {
            startTime: Date.now(),
            scaleComplete: false,
            flashingComplete: false,
            invulnerable: true
        };
        
        // Add base number of trees constant
        this.baseTreeCount = 4;
        
        // Add snow configuration
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());
        
        // Add star configuration
        this.stars = Array(50).fill().map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * (window.innerHeight * 0.6),
            size: Math.random() * 1 + 0.5,
            twinkleSpeed: Math.random() * 2 + 1
        }));
        
        // Initialize DOM elements and event listeners first
        this.timerText = document.getElementById('timer-text');
        this.birthdayText = document.getElementById('birthday-text');
        this.setupEventListeners();
        this.setupBirthdayText();

        // Initialize timer text content
        this.timerText.textContent = '0.00s';
        
        // Set timer to switch text
        setTimeout(() => {
            this.birthdayText.style.opacity = '0';
            this.timerText.style.opacity = '1';
        }, 1500);

        // Initialize game components
        this.spawnInitialTrees();
        this.gameLoop();

        // Add flag to control features
        this.SHOW_SKY_AND_FADING = false;  // Set to true to restore original behavior
        
        // Add overlay reference
        this.mountainOverlay = document.getElementById('mountain-overlay');
        
        // Update canvas z-index based on feature flag
        this.canvas.style.zIndex = this.SHOW_SKY_AND_FADING ? "2" : "3";
    }
    
    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupBirthdayText() {
        const text = ["Happy", "Birthday", "Parker!"];
        const container = document.getElementById('birthday-text');
        
        text.forEach(word => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'word';
            
            word.split('').forEach((char, i) => {
                const span = document.createElement('span');
                span.className = 'letter';
                span.textContent = char;
                span.style.animation = `float 2s ease-in-out infinite`;
                span.style.animationDelay = `${i * 0.1}s`;
                wordDiv.appendChild(span);
            });
            
            container.appendChild(wordDiv);
        });
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && this.canRestart) {
                this.restart();
                return;
            }

            // Track key for easy mode movement
            this.activeKeys.add(e.key);
            
            // Check for secret sequence
            if (e.key === 'p') {
                this.lastPKeyTime = Date.now();
            } else if (e.key === 'k' && this.lastPKeyTime > 0) {
                const timeSinceP = Date.now() - this.lastPKeyTime;
                if (timeSinceP <= 5000) {  // Within 5 seconds
                    this.easyMode = true;
                    this.lastPKeyTime = 0;  // Reset sequence
                }
            }

            // Normal mode direction changes
            if (!this.easyMode) {
                if (e.key === 'ArrowLeft') this.direction = 'left';
                if (e.key === 'ArrowRight') this.direction = 'right';
            }
        });

        document.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key);
        });
        
        // Handle both touch and click for direction changes
        const handleDirectionInput = (e) => {
            if (this.gameOver) {
                if (this.canRestart) this.restart();
                return;
            }
            
            // Get X coordinate from either touch or click event
            const x = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            this.direction = x < window.innerWidth / 2 ? 'left' : 'right';
        };
        
        document.addEventListener('touchstart', handleDirectionInput);
        document.addEventListener('click', handleDirectionInput);
    }
    
    spawnInitialTrees() {
        // Get current tree multiplier based on time
        const multiplier = this.getTreeMultiplier();
        const treeCount = this.baseTreeCount * multiplier;
        
        for (let i = 0; i < treeCount; i++) {
            this.trees.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height + this.canvas.height * 0.3
            });
        }
    }
    
    // Add method to calculate tree multiplier based on time
    getTreeMultiplier() {
        if (this.currentScore >= 120) return 3;      // After 2 minutes
        if (this.currentScore >= 60) return 2;       // After 1 minute
        return 1;                                    // Default
    }
    
    update() {
        if (this.gameOver) return;
        
        this.currentScore = (Date.now() - this.startTime) / 1000;
        
        // Check if start animation and invulnerability should end
        const timeSinceStart = Date.now() - this.startAnimation.startTime;
        if (timeSinceStart >= 2000 && this.startAnimation.invulnerable) {
            this.startAnimation.invulnerable = false;
            this.startAnimation.flashingComplete = true;
        }
        if (timeSinceStart >= 500) {
            this.startAnimation.scaleComplete = true;
        }
        
        let horizontalSpeed = 0;
        let verticalSpeed = 0;

        if (this.easyMode) {
            // Easy mode movement
            const speed = 1;
            
            // Calculate speeds based on active keys
            if (this.activeKeys.has('ArrowLeft')) horizontalSpeed += speed;
            if (this.activeKeys.has('ArrowRight')) horizontalSpeed -= speed;
            if (this.activeKeys.has('ArrowUp')) verticalSpeed += speed;
            if (this.activeKeys.has('ArrowDown')) verticalSpeed -= speed;

            // Update direction for visual purposes
            if (horizontalSpeed > 0) this.direction = 'left';
            else if (horizontalSpeed < 0) this.direction = 'right';
        } else {
            // Normal mode movement
            horizontalSpeed = this.direction === 'left' ? 1 : -1;
            verticalSpeed = -1;  // Constant downward movement in normal mode
        }
        
        // Move trees
        this.trees.forEach(tree => {
            tree.x += horizontalSpeed;
            tree.y += verticalSpeed;
            
            if (tree.y < -50) {
                tree.y = this.canvas.height + 50;
                tree.x = Math.random() * this.canvas.width;
            }
        });
        
        // Check if we need to add more trees based on time
        const currentMultiplier = this.getTreeMultiplier();
        const desiredTreeCount = this.baseTreeCount * currentMultiplier;
        
        while (this.trees.length < desiredTreeCount) {
            this.trees.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 50
            });
        }
        
        const cornerSize = 24; // Changed from 8 to 24 (3x bigger)
        const playerBaseHitbox = {
            x: this.playerX - 20,
            y: this.playerY,
            width: 40,
            height: 20
        };
        
        // Only check collisions if not invulnerable
        if (!this.startAnimation.invulnerable) {
            for (const tree of this.trees) {
                const treeHitbox = {
                    x: tree.x - 2.5,
                    y: tree.y + 10,
                    width: 5,
                    height: 10
                };
                
                if (this.checkPlayerCollision(playerBaseHitbox, treeHitbox, cornerSize)) {
                    this.gameOver = true;
                    this.canRestart = false;
                    this.gameOverTime = Date.now();  // Track when game over started
                    this.highScore = Math.max(this.highScore, this.currentScore);
                    setTimeout(() => {
                        this.canRestart = true;
                    }, 1000);
                    break;
                }
            }
        }
        
        // Update snowflakes
        this.snowflakes.forEach(snow => {
            // Move diagonally based on player direction
            const diagonalSpeed = snow.speed;
            if (this.easyMode) {
                // In easy mode, use actual movement direction
                snow.x += horizontalSpeed * diagonalSpeed;
                snow.y += verticalSpeed * diagonalSpeed;
            } else {
                // In normal mode, move diagonally based on facing direction
                snow.x += (this.direction === 'left' ? diagonalSpeed : -diagonalSpeed);
                snow.y -= diagonalSpeed;  // Always move up relative to player
            }
            
            // Reset snowflake when it goes off screen
            if (snow.y < -10) {
                // If goes off top, reset to bottom
                snow.y = this.canvas.height + 10;
                snow.x = Math.random() * this.canvas.width;
            } else if (snow.y > this.canvas.height + 10) {
                // If goes off bottom, reset to top
                snow.y = -10;
                snow.x = Math.random() * this.canvas.width;
            }
            
            // Reset if goes off sides
            if (snow.x < -10) {
                snow.x = this.canvas.width + 10;
            } else if (snow.x > this.canvas.width + 10) {
                snow.x = -10;
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkPlayerCollision(player, tree, cornerSize) {
        return this.checkCollision(player, tree);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Only update sky if feature is enabled
        if (this.SHOW_SKY_AND_FADING) {
            const skyColors = this.getSkyGradient();
            const sky = document.getElementById('sky');
            sky.style.background = `linear-gradient(to bottom, ${skyColors.top}, ${skyColors.bottom})`;
            
            // Show/hide mountain overlay
            const overlay = document.getElementById('mountain-overlay');
            if (overlay) overlay.style.display = 'none';
        } else {
            const overlay = document.getElementById('mountain-overlay');
            if (overlay) overlay.style.display = 'block';
        }
        
        // Draw stars only if feature is enabled
        if (this.SHOW_SKY_AND_FADING && this.currentScore >= 150) {
            // Calculate fade from 2:30 to 3:00 (30 second fade)
            const starAlpha = Math.min((this.currentScore - 150) / 30, 1);
            
            this.stars.forEach(star => {
                const twinkle = Math.sin(Date.now() * 0.001 * star.twinkleSpeed) * 0.5 + 0.5;
                // Combine the fade-in alpha with the twinkle effect
                const finalAlpha = starAlpha * twinkle;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // Draw trees with fade effects
        this.trees.forEach(tree => {
            let opacity = 1;
            
            if (this.gameOver) {
                const treeBottom = tree.y + 30;
                const playerTop = this.playerY - 20;
                
                if (treeBottom <= playerTop) {
                    // If tree is above player during game over, fade out with sky timing
                    const timeSinceGameOver = (Date.now() - (this.gameOverTime || Date.now())) / 1000;
                    const fadeProgress = Math.min(timeSinceGameOver, 1);
                    opacity = 1 - fadeProgress;
                }
            } else if (this.SHOW_SKY_AND_FADING) {
                // Normal gameplay fade logic when feature enabled
                const treeBottom = tree.y + 20;
                const playerTop = this.playerY - 20;
                
                if (treeBottom < playerTop + 40) {
                    opacity = Math.max(0, (treeBottom - playerTop) / 40);
                }
            }
            
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.drawImage(this.treeImg, tree.x - 8, tree.y - 20, 16, 40);
            this.ctx.restore();
            
            // Draw collision boxes during game over for non-faded trees
            if (this.gameOver && opacity > 0) {
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    tree.x - 2.5,
                    tree.y + 10,
                    5,
                    10
                );
            }
        });
        
        // Calculate scale animation
        let scale = 1;
        if (!this.startAnimation.scaleComplete) {
            const timeSinceStart = Date.now() - this.startAnimation.startTime;
            const progress = Math.min(timeSinceStart / 500, 1); // 0.5 seconds
            
            // Elastic easing function with overshoot
            const c4 = (2 * Math.PI) / 3;
            scale = progress === 1 
                ? 1
                : progress === 0
                ? 0
                : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
        }
        
        // Calculate flash effect
        let shieldAlpha = 0;
        if (!this.startAnimation.flashingComplete) {
            const timeSinceStart = Date.now() - this.startAnimation.startTime;
            const flashProgress = (timeSinceStart % 300) / 300; // 0.3 second delay
            shieldAlpha = Math.sin(flashProgress * Math.PI) * 0.5; // Smooth sine wave for flash
        }
        
        // Draw player and shield
        this.ctx.save();
        this.ctx.translate(this.playerX, this.playerY);
        
        // Draw shield circle if active
        if (shieldAlpha > 0) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${shieldAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${shieldAlpha * 0.3})`;
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
        }
        
        if (this.direction === 'right') {
            this.ctx.scale(-scale, scale);
        } else {
            this.ctx.scale(scale, scale);
        }
        
        this.ctx.drawImage(this.skierImg, -20, -20, 40, 40);
        this.ctx.restore();
        
        // Update timer text if game is active
        if (!this.gameOver) {
            this.timerText.textContent = `${this.currentScore.toFixed(2)}s`;
        } else {
            this.timerText.style.opacity = '0';  // Hide timer on game over
        }
        
        if (this.gameOver) {
            // Show sky with fade animation when game over
            if (this.mountainOverlay) {
                this.mountainOverlay.style.transition = 'opacity 1s';
                this.mountainOverlay.style.opacity = '0';
            }
            
            // Draw semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Track time since game over for fade animation
            const timeSinceGameOver = (Date.now() - (this.gameOverTime || Date.now())) / 1000;
            const fadeProgress = Math.min(timeSinceGameOver, 1);  // 0 to 1 over 1 second
            
            // Draw player collision box
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                this.playerX - (20 * scale),
                this.playerY + (0 * scale),
                40 * scale,
                20 * scale
            );
            
            // Draw game over text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Score: ${this.currentScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2);
            this.ctx.fillText(`High Score: ${this.highScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2 + 60);
            
            if (this.canRestart) {
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Click or tap anywhere to restart', this.canvas.width/2, this.canvas.height/2 + 120);
            }
        }
        
        // Draw snowflakes
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.snowflakes.forEach(snow => {
            this.ctx.beginPath();
            this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    restart() {
        if (!this.canRestart) return;
        
        // Instantly hide sky on restart
        if (this.mountainOverlay) {
            this.mountainOverlay.style.transition = 'none';  // Disable transition
            this.mountainOverlay.style.opacity = '1';
        }
        
        this.gameOver = false;
        this.canRestart = false;
        this.trees = [];
        this.spawnInitialTrees();
        this.startTime = Date.now();
        this.currentScore = 0;
        this.direction = 'left';
        this.easyMode = false;
        this.lastPKeyTime = 0;
        this.activeKeys.clear();
        
        // Reset start animation state
        this.startAnimation = {
            startTime: Date.now(),
            scaleComplete: false,
            flashingComplete: false,
            invulnerable: true
        };
        
        // Regenerate star positions
        this.stars = Array(50).fill().map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * (window.innerHeight * 0.6),
            size: Math.random() * 1 + 0.5,
            twinkleSpeed: Math.random() * 2 + 1
        }));
        
        // Show timer again on restart
        this.timerText.style.opacity = '1';
        
        // Reset snowflakes
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Add method to calculate sky colors based on time
    getSkyGradient() {
        const timeInSeconds = this.currentScore;
        
        // Default sky colors (0-60s)
        let topColor = [0, 51, 102];      // #003366 (dark blue)
        let bottomColor = [173, 216, 230]; // #ADD8E6 (light blue)
        
        if (timeInSeconds >= 60 && timeInSeconds <= 120) {
            // Transition to sunset colors (60-120s)
            const progress = (timeInSeconds - 60) / 60;
            
            // Transition from blue to pink at top
            topColor = [
                this.lerp(0, 255, progress),     // R: 0->255
                this.lerp(51, 182, progress),    // G: 51->182
                this.lerp(102, 193, progress)    // B: 102->193
            ];
            
            // Transition from light blue to orange at bottom
            bottomColor = [
                this.lerp(173, 255, progress),   // R: 173->255
                this.lerp(216, 140, progress),   // G: 216->140
                this.lerp(230, 0, progress)      // B: 230->0
            ];
        } else if (timeInSeconds > 120 && timeInSeconds <= 180) {
            // Transition to night (120-180s)
            const progress = (timeInSeconds - 120) / 60;
            
            // Transition from pink to black at top
            topColor = [
                this.lerp(255, 0, progress),     // R: 255->0
                this.lerp(182, 0, progress),     // G: 182->0
                this.lerp(193, 0, progress)      // B: 193->0
            ];
            
            // Transition from orange to black at bottom
            bottomColor = [
                this.lerp(255, 0, progress),     // R: 255->0
                this.lerp(140, 0, progress),     // G: 140->0
                this.lerp(0, 0, progress)        // B: 0->0
            ];
        } else if (timeInSeconds > 180) {
            // Complete night (after 180s)
            topColor = [0, 0, 0];
            bottomColor = [0, 0, 0];
        }
        
        return {
            top: `rgb(${topColor.join(',')})`,
            bottom: `rgb(${bottomColor.join(',')})`
        };
    }
    
    // Helper method for color interpolation
    lerp(start, end, progress) {
        return Math.round(start + (end - start) * progress);
    }
    
    createSnowflake(forceTop = false) {
        // If forceTop is true, create at top of screen, otherwise random position
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -10 : Math.random() * this.canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1.5 + 2
        };
    }
}

// Add CSS animation for floating text
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Start the game when images are loaded
window.onload = () => new Game(); 