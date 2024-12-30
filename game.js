class Game {
    constructor() {
        // Add intro state
        this.isIntroScreen = true;
        this.introStartTime = Date.now();
        
        // Initialize basic components needed for intro
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        
        // Add snow configuration (needed from start)
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());
        
        // Add large snowflake configuration for intro
        this.largeSnowflakes = Array(15).fill().map(() => this.createLargeSnowflake());
        
        // Add extra-large snowflake configuration for intro
        this.extraLargeSnowflakes = Array(8).fill().map(() => this.createExtraLargeSnowflake());
        
        // Add star configuration (needed for intro)
        this.stars = Array(50).fill().map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * (window.innerHeight * 0.6),
            size: Math.random() * 1 + 0.5,
            twinkleSpeed: Math.random() * 2 + 1
        }));
        
        // Setup intro event listeners
        this.setupIntroEventListeners();
        
        // Start the intro loop
        this.gameLoop();
        
        // Setup birthday text immediately for intro screen
        this.birthdayText = document.getElementById('birthday-text');
        this.setupBirthdayText();
        
        // Setup timer text reference but keep it hidden
        this.timerText = document.getElementById('timer-text');
    }

    setupIntroEventListeners() {
        const startGame = () => {
            if (this.isIntroScreen) {
                this.isIntroScreen = false;
                
                // Hide birthday text and show timer when starting game
                this.birthdayText.style.opacity = '0';
                this.timerText.style.opacity = '1';
                
                this.initializeGame();
                
                // Remove intro listeners
                document.removeEventListener('keydown', startGame);
                document.removeEventListener('click', startGame);
                document.removeEventListener('touchstart', startGame);
                
                // Setup game event listeners
                this.setupEventListeners();
            }
        };

        document.addEventListener('keydown', startGame);
        document.addEventListener('click', startGame);
        document.addEventListener('touchstart', startGame);
    }

    initializeGame() {
        // Move all game initialization here from constructor
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
        
        // Increase base number of trees constant (from 4 to 20)
        this.baseTreeCount = 20;  // Changed from 4 to 20 (5x more)
        
        // Add snow configuration
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());
        
        // Add large snowflake configuration for intro
        this.largeSnowflakes = Array(15).fill().map(() => this.createLargeSnowflake());
        
        // Add extra-large snowflake configuration for intro
        this.extraLargeSnowflakes = Array(8).fill().map(() => this.createExtraLargeSnowflake());
        
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
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupBirthdayText() {
        const text = ["Happy", "Birthday", "Parker!"];
        const container = document.getElementById('birthday-text');
        
        // Clear any existing content
        container.innerHTML = '';
        
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
        
        // Add debug log
        console.log('Birthday text setup complete:', container.innerHTML);
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
                y: (Math.random() * this.canvas.height * 0.7) + (this.canvas.height * 0.3)
            });
        }
    }
    
    // Add method to calculate tree multiplier based on time
    getTreeMultiplier() {
        if (this.currentScore >= 120) return 3;      // After 2 minutes: 60 trees
        if (this.currentScore >= 60) return 2;       // After 1 minute: 40 trees
        return 1;                                    // Default: 20 trees
    }
    
    update() {
        if (this.isIntroScreen) {
            // Update regular snowflakes
            this.snowflakes.forEach(snow => {
                snow.y += snow.speed;
                if (snow.y > this.canvas.height + 10) {
                    snow.y = -10;
                    snow.x = Math.random() * this.canvas.width;
                }
            });
            
            // Update large snowflakes
            this.largeSnowflakes.forEach(snow => {
                snow.y += snow.speed;
                if (snow.y > this.canvas.height + 20) {
                    snow.y = -20;
                    snow.x = Math.random() * this.canvas.width;
                }
            });
            
            // Update extra-large snowflakes
            this.extraLargeSnowflakes.forEach(snow => {
                snow.y += snow.speed;
                if (snow.y > this.canvas.height + 30) {
                    snow.y = -30;
                    snow.x = Math.random() * this.canvas.width;
                }
            });
        } else {
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
                    y: this.canvas.height + (Math.random() * 100 - 50)
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

        if (this.isIntroScreen) {
            // Draw intro screen
            const skyColors = this.getIntroSkyGradient();
            
            // Draw sky gradient
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, `rgb(${skyColors.top.join(',')})`);
            gradient.addColorStop(1, `rgb(${skyColors.bottom.join(',')})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw stars with smooth transitions
            const time = (Date.now() - this.introStartTime) % (5000 * 4);
            const stage = Math.floor(time / 5000);
            const progress = (time % 5000) / 5000;
            
            // Calculate star opacity based on stage
            let starOpacity = 0;
            if (stage === 0) {
                // Fade out at end of blue->sunset
                starOpacity = Math.max(0, 1 - progress * 2);  // Fade out in first half
            } else if (stage === 1) {
                // Full opacity during night
                starOpacity = 1;
            } else if (stage === 2) {
                // Fade out during night->sunrise
                starOpacity = 1 - progress;
            }
            
            // Draw stars with calculated opacity
            if (starOpacity > 0) {
                this.stars.forEach(star => {
                    const twinkle = Math.sin(Date.now() * 0.001 * star.twinkleSpeed) * 0.5 + 0.5;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * starOpacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }

            // Draw intro text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Touch anything to play!', this.canvas.width/2, this.canvas.height * 0.7);

            // Draw regular snowflakes
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.snowflakes.forEach(snow => {
                this.ctx.beginPath();
                this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw large snowflakes
            this.largeSnowflakes.forEach(snow => {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${snow.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw extra-large snowflakes
            this.extraLargeSnowflakes.forEach(snow => {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${snow.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else {
            // Draw trees with conditional fade effect
            this.trees.forEach(tree => {
                // Just draw trees normally
                this.ctx.drawImage(this.treeImg, tree.x - 8, tree.y - 20, 16, 40);
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
                // Draw semi-transparent overlay
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw collision boxes only during game over and only for trees not fully above player
                this.trees.forEach(tree => {
                    const treeBottom = tree.y + 30;  // Bottom of tree sprite (including collision box)
                    const playerTop = this.playerY - 20;  // Top of player hitbox
                    
                    // Only draw collision box if any part of tree is at or below player's top
                    if (treeBottom > playerTop) {
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
                
                // Draw player collision box (now only bottom half)
                this.ctx.strokeStyle = 'blue';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    this.playerX - (20 * scale),
                    this.playerY,
                    40 * scale,
                    20 * scale
                );
                
                // Calculate heartbeat scale using sine wave
                const pulseSpeed = 1.5; // Speed of pulse
                const pulseAmount = 0.05; // Amount of scale variation (5%)
                const pulse = 1 + (Math.sin(Date.now() * 0.001 * pulseSpeed) * pulseAmount);
                
                // Draw game over text with pulse effect
                this.ctx.save();
                this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
                this.ctx.scale(pulse, pulse);
                this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Score: ${this.currentScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2);
                this.ctx.fillText(`High Score: ${this.highScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2 + 60);
                
                this.ctx.restore();
                
                // Draw restart text without pulse
                if (this.canRestart) {
                    this.ctx.font = '24px Arial';
                    this.ctx.fillText('Touch anything to restart', this.canvas.width/2, this.canvas.height/2 + 120);
                }
            }
            
            // Draw snowflakes with lighter opacity
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.snowflakes.forEach(snow => {
                this.ctx.beginPath();
                this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }
    
    restart() {
        if (!this.canRestart) return;
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
            // Slower speed if in intro screen
            speed: this.isIntroScreen ? 
                Math.random() * 0.5 + 0.5 :  // Speed range 0.5-1 for intro
                Math.random() * 1.5 + 2      // Speed range 2-3.5 for game
        };
    }

    getIntroSkyGradient() {
        const cycleTime = 5000; // 5 seconds per stage
        const totalCycle = cycleTime * 4; // Total time for full cycle
        const time = (Date.now() - this.introStartTime) % totalCycle;
        const stage = Math.floor(time / cycleTime);
        const progress = (time % cycleTime) / cycleTime;

        // Define gradients for each stage
        const gradients = {
            0: { // Blue to Sunset
                top: this.lerpColors([0, 51, 102], [255, 182, 193], progress),
                bottom: this.lerpColors([173, 216, 230], [255, 140, 0], progress)
            },
            1: { // Sunset to Night
                top: this.lerpColors([255, 182, 193], [0, 0, 0], progress),
                bottom: this.lerpColors([255, 140, 0], [0, 0, 0], progress)
            },
            2: { // Night to Sunrise
                top: this.lerpColors([0, 0, 0], [255, 182, 193], progress),
                bottom: this.lerpColors([0, 0, 0], [255, 140, 0], progress)
            },
            3: { // Sunrise to Blue
                top: this.lerpColors([255, 182, 193], [0, 51, 102], progress),
                bottom: this.lerpColors([255, 140, 0], [173, 216, 230], progress)
            }
        };

        return gradients[stage];
    }

    lerpColors(start, end, progress) {
        return start.map((startVal, i) => 
            this.lerp(startVal, end[i], progress)
        );
    }

    createLargeSnowflake(forceTop = false) {
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -20 : Math.random() * this.canvas.height,
            size: Math.random() * 5 + 4,  // Size range 4-9 pixels
            speed: Math.random() * 2 + 3,  // Changed: Much faster (3-5 speed range)
            opacity: Math.random() * 0.3 + 0.2  // More transparent
        };
    }

    createExtraLargeSnowflake(forceTop = false) {
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -30 : Math.random() * this.canvas.height,
            size: Math.random() * 8 + 8,  // Size range 8-16 pixels
            speed: Math.random() * 3 + 5,  // Speed range 5-8
            opacity: Math.random() * 0.2 + 0.1  // Very transparent
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