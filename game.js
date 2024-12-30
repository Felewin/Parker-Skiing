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
        
        this.restartTextStartTime = 0;  // Track when restart text appears
        
        // Setup skiing sound
        this.skiingSounds = [
            new Audio('Skiing.mp3'),
            new Audio('Skiing.mp3')
        ];
        this.skiingSounds.forEach(sound => {
            sound.volume = 0.25;  // Start at full volume
            sound.addEventListener('timeupdate', () => {
                // Start crossfade when 1 second from the end
                if (sound.currentTime > sound.duration - 1) {
                    const otherSound = this.skiingSounds.find(s => s !== sound);
                    
                    // Start the other sound if it's not already playing
                    if (otherSound.paused) {
                        otherSound.currentTime = 0;
                        otherSound.volume = 0.25;  // Start at full volume
                        otherSound.play().catch(e => {
                            console.error('Error playing skiing sound:', e);
                        });
                    }
                }
                
                // Handle fade out of current sound in last 0.5 seconds
                if (sound.currentTime > sound.duration - 0.5) {
                    const fadeOutProgress = (sound.duration - sound.currentTime) / 0.5;
                    sound.volume = Math.max(0, 0.25 * fadeOutProgress);
                    
                    // Ensure other sound is at full volume
                    const otherSound = this.skiingSounds.find(s => s !== sound);
                    if (!otherSound.paused) {
                        otherSound.volume = 0.25;
                    }
                }
            });
        });
        
        // Setup crash sound
        this.crashSound = new Audio('Laser Munch.ogg');
        this.crashSound.volume = 0.25;  // Set to 25%
        
        // Setup snowstorm sound but don't play yet
        this.snowstormSound = new Audio('snowstorm.mp3');
        this.snowstormSound.loop = true;
        this.snowstormSound.volume = 0.25;
        
        // Setup restart sound at full volume
        this.restartSound = new Audio('Juicy Wooden Click.wav');
        this.restartSound.volume = 1.0;  // Changed from 0.25 to 1.0

        // Add error handling and logging
        this.snowstormSound.addEventListener('error', (e) => {
            console.error('Error loading snowstorm sound:', e);
        });

        this.snowstormSound.addEventListener('canplaythrough', () => {
            console.log('Snowstorm sound loaded successfully');
            this.snowstormSound.play().catch(e => {
                console.error('Error playing snowstorm sound:', e);
            });
        });

        // Setup crowd cheering sounds
        this.cheerSound1 = new Audio('Crowd Cheering Exterior, Big Surge, Rose Bowl Stadium, Applause _5.1 LCRLsRsLf.wav');
        this.cheerSound2 = new Audio('Crowd Cheering Interior, Female Crowd, Short Swell 24, Staples Arena Los Angeles  _5.1 LCRLsRsLf.wav');
        this.cheerSound1.volume = 0.25;
        this.cheerSound2.volume = 0.25;

        // Setup VOX cheer sounds
        this.voxCheers = [
            new Audio('ChenBase_VOX_Cheer01.ogg'),
            new Audio('ChenBase_VOX_Cheer02.ogg'),
            new Audio('Falstad_VOX_Cheer04.ogg'),
            new Audio('Falstad_VOX_Cheer05.ogg')
        ];
        this.voxCheers.forEach(sound => sound.volume = 0.25);
        this.lastPlayedVoxIndex = -1;  // Track last played VOX sound

        // Setup confetti
        this.confetti = [];
        this.confettiColors = [
            '#ff9aa2', // pastel red
            '#ffdac1', // pastel orange
            '#ffffd8', // pastel yellow
            '#b5ead7', // pastel green
            '#c7ceea', // pastel blue
            '#e2c0ff'  // pastel purple
        ];

        // Add intro text visibility state
        this.showIntroText = false;
        
        // Setup intro music
        this.introMusic = new Audio('Blue Sky.mp3');
        this.introMusic.volume = 0.25;
        this.introMusic.loop = true;
        this.introMusic.addEventListener('ended', () => {
            if (this.isIntroScreen) {  // Only restart if still in intro
                this.introMusic.currentTime = 0;
                this.introMusic.play();
            }
        });
        
        this.introTextStartTime = 0;  // Track when intro text should appear
        
        // Add loading text state and timing
        this.showLoadingText = true;
        this.loadingTextStartTime = Date.now();  // Start animation immediately
        
        // Add loading progress tracking
        this.loadingProgress = 0;
        this.loadingStartTime = 0;
        this.LOADING_DURATION = 4620;  // Changed from 6000 to 4800 (4/5 of original)
        
        // Add PK sequence tracking for intro screen
        this.lastPKeyTimeIntro = 0;
        
        // Modify first interaction listener
        const showIntroText = (e) => {
            // Only process keyboard events for PK sequence
            if (e.type === 'keydown') {
                if (e.key === 'p') {
                    this.lastPKeyTimeIntro = Date.now();
                } else if (e.key === 'k' && this.lastPKeyTimeIntro > 0) {
                    const timeSinceP = Date.now() - this.lastPKeyTimeIntro;
                    if (timeSinceP <= 5000) {
                        // Skip loading and start game immediately
                        this.showLoadingText = false;
                        this.showIntroText = true;
                        this.introTextStartTime = Date.now();
                        this.introMusic.play();
                        
                        // Start game after brief delay
                        setTimeout(() => {
                            // Fade out intro music
                            const fadeOut = () => {
                                if (this.introMusic.volume > 0.01) {
                                    this.introMusic.volume = Math.max(0, this.introMusic.volume - 0.01);
                                    setTimeout(fadeOut, 40);
                                } else {
                                    this.introMusic.pause();
                                    this.introMusic.currentTime = 0;
                                }
                            };
                            fadeOut();
                            
                            this.isIntroScreen = false;
                            this.createConfetti();
                            
                            // Play random cheer
                            const cheerSound = Math.random() < 0.5 ? this.cheerSound1 : this.cheerSound2;
                            cheerSound.currentTime = 0;
                            cheerSound.play();
                            
                            this.skiingSounds[0].play();
                            this.snowstormSound.play();
                            
                            this.birthdayText.style.opacity = '0';
                            this.timerText.style.opacity = '1';
                            
                            this.initializeGame();
                            this.setupEventListeners();
                        }, 500);
                        
                        // Remove intro listeners
                        document.removeEventListener('keydown', showIntroText);
                        document.removeEventListener('click', showIntroText);
                        document.removeEventListener('touchstart', showIntroText);
                        return;
                    }
                }
                return;  // Ignore all other keyboard events
            }
            
            // Normal intro sequence for mouse/touch only
            if (this.showLoadingText) {
                this.showLoadingText = false;
                this.showIntroText = false;  // Don't show play text yet
                this.introMusic.play();
                this.loadingStartTime = Date.now();
                
                // Set timer to show "Touch to play" after loading completes
                setTimeout(() => {
                    this.showIntroText = true;
                    this.introTextStartTime = Date.now();
                }, this.LOADING_DURATION);
                
                // Remove first interaction listeners
                document.removeEventListener('keydown', showIntroText);
                document.removeEventListener('click', showIntroText);
                document.removeEventListener('touchstart', showIntroText);
            }
        };
        
        // Setup game start listener
        const startGame = (e) => {
            // Only start game if loading is complete and intro text is showing
            if (this.isIntroScreen && this.showIntroText && this.introTextStartTime > 0) {
                // ... game start code ...
            }
        };
        
        document.addEventListener('keydown', showIntroText);
        document.addEventListener('click', showIntroText);
        document.addEventListener('touchstart', showIntroText);
        
        document.addEventListener('keydown', startGame);
        document.addEventListener('click', startGame);
        document.addEventListener('touchstart', startGame);

        this.startAnimation = {
            startTime: Date.now(),
            scaleComplete: false,
            flashingComplete: false,
            invulnerable: true,
            countdownNumber: 3  // Start at 3
        };
    }

    setupIntroEventListeners() {
        const startGame = () => {
            if (this.isIntroScreen && this.showIntroText) {  // Only allow start if intro text is showing
                this.isIntroScreen = false;
                
                // Fade out intro music over 2 seconds
                const fadeOut = () => {
                    if (this.introMusic.volume > 0.01) {
                        this.introMusic.volume = Math.max(0, this.introMusic.volume - 0.01);  // Smaller steps
                        setTimeout(fadeOut, 40);  // 40ms * 50 steps = 2000ms (2 seconds)
                    } else {
                        this.introMusic.pause();
                        this.introMusic.currentTime = 0;
                    }
                };
                fadeOut();
                
                // Create confetti when game starts
                this.createConfetti();
                
                // Play random cheer sound
                const cheerSound = Math.random() < 0.5 ? this.cheerSound1 : this.cheerSound2;
                cheerSound.currentTime = 0;
                cheerSound.play();
                
                // Start first skiing sound
                this.skiingSounds[0].play();
                
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
            invulnerable: true,
            countdownNumber: 3  // Start at 3
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
        // Handle keyboard input immediately
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (this.canRestart) this.restart();
                return;  // Ignore all other input during game over
            }

            // Track key for easy mode movement
            this.activeKeys.add(e.key);
            
            // Immediately respond to direction changes in normal mode
            if (!this.easyMode) {
                if (e.key === 'ArrowLeft') {
                    this.direction = 'left';
                    e.preventDefault();
                }
                if (e.key === 'ArrowRight') {
                    this.direction = 'right';
                    e.preventDefault();
                }
            }
            
            // Check for secret sequence
            if (e.key === 'p') {
                this.lastPKeyTime = Date.now();
            } else if (e.key === 'k' && this.lastPKeyTime > 0) {
                const timeSinceP = Date.now() - this.lastPKeyTime;
                if (timeSinceP <= 5000) {
                    this.easyMode = true;
                    this.lastPKeyTime = 0;
                }
            }
        });

        // Handle touch/click input immediately
        const handleDirectionInput = (e) => {
            if (this.gameOver) {
                if (this.canRestart) this.restart();
                return;  // Ignore direction changes during game over
            }
            
            // Get X coordinate and immediately update direction
            const x = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            this.direction = x < window.innerWidth / 2 ? 'left' : 'right';
            e.preventDefault();
        };
        
        document.addEventListener('touchstart', handleDirectionInput, { passive: false });
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
            if (this.gameOver) {
                // Stop both skiing sounds
                this.skiingSounds.forEach(sound => {
                    sound.pause();
                    sound.currentTime = 0;
                });
                return;
            }
            
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
                        
                        // Play crash sound
                        this.crashSound.currentTime = 0;  // Reset sound to start
                        this.crashSound.play();
                        
                        setTimeout(() => {
                            this.canRestart = true;
                            this.restartTextStartTime = Date.now();
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

            // Update confetti
            this.confetti = this.confetti.filter(conf => {
                conf.y += conf.speedY;
                conf.x += conf.speedX;
                conf.rotation += conf.rotationSpeed;
                conf.speedY += 0.1;  // Add gravity
                
                // Remove confetti that's fallen off screen
                return conf.y < this.canvas.height + 20;
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

            // Draw loading text if active
            if (this.showLoadingText) {
                const timeSinceLoading = Date.now() - this.loadingTextStartTime;
                const bounceProgress = Math.min(timeSinceLoading / 500, 1);
                
                // Elastic bounce effect
                const c4 = (2 * Math.PI) / 3;
                let bounceScale = bounceProgress === 1 
                    ? 1
                    : bounceProgress === 0
                    ? 0
                    : Math.pow(2, -10 * bounceProgress) * Math.sin((bounceProgress * 10 - 0.75) * c4) + 1;
                
                // Breathing effect
                const pulseSpeed = 1.5;
                const pulseAmount = 0.05;
                const breatheScale = 1 + (Math.sin(Date.now() * 0.001 * pulseSpeed) * pulseAmount);
                
                // Blend between bounce and breathing based on bounce progress
                const blendFactor = Math.min((bounceProgress - 0.8) / 0.2, 1); // Start blend at 80% of bounce
                const finalScale = bounceProgress < 0.8 
                    ? bounceScale 
                    : bounceScale * (1 - blendFactor) + breatheScale * blendFactor;
                
                // Draw with same gradient style
                this.ctx.save();
                this.ctx.translate(this.canvas.width/2, this.canvas.height * 0.7);
                this.ctx.scale(finalScale, finalScale);
                
                const gradient = this.ctx.createLinearGradient(-100, 0, 100, 0);
                const time = Date.now() * 0.001;
                gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 80%)`);
                gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 70%, 80%)`);
                gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 70%, 80%)`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Tap to load game!', 0, 0);
                
                this.ctx.restore();
            }
            
            // Only draw "Touch anything to play!" if showIntroText is true and after delay
            else if (this.showIntroText && this.introTextStartTime > 0) {
                const timeSinceIntroText = Date.now() - this.introTextStartTime;
                const bounceProgress = Math.min(timeSinceIntroText / 500, 1); // 0.5 seconds bounce
                
                // Elastic bounce effect
                const c4 = (2 * Math.PI) / 3;
                let bounceScale = bounceProgress === 1 
                    ? 1
                    : bounceProgress === 0
                    ? 0
                    : Math.pow(2, -10 * bounceProgress) * Math.sin((bounceProgress * 10 - 0.75) * c4) + 1;
                
                // Breathing effect
                const pulseSpeed = 1.5;
                const pulseAmount = 0.05;
                const breatheScale = 1 + (Math.sin(Date.now() * 0.001 * pulseSpeed) * pulseAmount);
                
                // Blend between bounce and breathing based on bounce progress
                const blendFactor = Math.min((bounceProgress - 0.8) / 0.2, 1); // Start blend at 80% of bounce
                const finalScale = bounceProgress < 0.8 
                    ? bounceScale 
                    : bounceScale * (1 - blendFactor) + breatheScale * blendFactor;
                
                // Create gradient text
                this.ctx.save();
                this.ctx.translate(this.canvas.width/2, this.canvas.height * 0.7);
                this.ctx.scale(finalScale, finalScale);
                
                // Create gradient
                const gradient = this.ctx.createLinearGradient(-100, 0, 100, 0);
                const time = Date.now() * 0.001;
                gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 80%)`);
                gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 70%, 80%)`);
                gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 70%, 80%)`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Touch anything to play!', 0, 0);
                
                this.ctx.restore();
            }

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

            // Draw loading bar if in loading state
            if (!this.showLoadingText && !this.introTextStartTime) {
                const elapsed = Date.now() - this.loadingStartTime;
                this.loadingProgress = Math.min(elapsed / this.LOADING_DURATION, 1);
                
                // Draw loading bar background
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                const barWidth = 300;
                const barHeight = 20;
                const barX = (this.canvas.width - barWidth) / 2;
                const barY = this.canvas.height * 0.7;
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Draw loading progress
                const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
                const time = Date.now() * 0.001;
                gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 80%)`);
                gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 70%, 80%)`);
                gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 70%, 80%)`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(barX, barY, barWidth * this.loadingProgress, barHeight);
                
                // Draw percentage text
                this.ctx.font = '18px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.floor(this.loadingProgress * 100)}%`, 
                    this.canvas.width / 2, barY + barHeight + 25);
            }
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
            
            // Calculate flash effect and shield alpha outside the shield drawing code
            let shieldAlpha = 0;
            if (!this.startAnimation.flashingComplete) {
                const timeSinceStart = Date.now() - this.startAnimation.startTime;
                const flashProgress = (timeSinceStart % 300) / 300;
                shieldAlpha = Math.sin(flashProgress * Math.PI) * 0.5;
            }
            
            // Draw player and shield
            this.ctx.save();
            this.ctx.translate(this.playerX, this.playerY);
            
            // Draw shield circle
            if (shieldAlpha > 0) {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(0, 255, 0, ${shieldAlpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                this.ctx.strokeStyle = `rgba(0, 255, 0, ${shieldAlpha * 0.3})`;
                this.ctx.lineWidth = 6;
                this.ctx.stroke();
                
                // Draw countdown numbers
                const timeSinceStart = Date.now() - this.startAnimation.startTime;
                const countdownTime = Math.floor(timeSinceStart / 666.67); // 2000ms / 3 numbers ≈ 666.67ms per number
                const currentNumber = 3 - countdownTime;
                
                if (currentNumber >= 1 && currentNumber <= 3) {
                    const numberProgress = (timeSinceStart % 666.67) / 666.67;
                    
                    // Scale from 3x to 1x size
                    const numberScale = 3 - (2 * numberProgress);
                    // Fade in first half, fade out second half
                    const numberAlpha = numberProgress <= 0.5 
                        ? numberProgress * 2 
                        : 2 - (numberProgress * 2);
                    
                    this.ctx.save();
                    this.ctx.translate(0, -80);  // Changed from -40 to -80 to position higher above player
                    this.ctx.scale(numberScale, numberScale);
                    this.ctx.fillStyle = `rgba(0, 255, 0, ${numberAlpha})`;
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(currentNumber.toString(), 0, 0);
                    this.ctx.restore();
                }
            }
            
            // Draw player sprite
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
                
                // Find the tree that caused the collision
                const collidedTree = this.trees.find(tree => {
                    const treeHitbox = {
                        x: tree.x - 2.5,
                        y: tree.y + 10,
                        width: 5,
                        height: 10
                    };
                    return this.checkPlayerCollision(
                        {
                            x: this.playerX - 20,
                            y: this.playerY,
                            width: 40,
                            height: 20
                        },
                        treeHitbox
                    );
                });

                // Only draw collision box for the tree that caused game over
                if (collidedTree) {
                    this.ctx.strokeStyle = 'red';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        collidedTree.x - 2.5,
                        collidedTree.y + 10,
                        5,
                        10
                    );
                }
                
                // Draw player collision box
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
                    const timeSinceRestart = Date.now() - this.restartTextStartTime;
                    const bounceProgress = Math.min(timeSinceRestart / 500, 1); // 0.5 seconds bounce
                    
                    // Elastic bounce effect (same as player)
                    const c4 = (2 * Math.PI) / 3;
                    let bounceScale = bounceProgress === 1 
                        ? 1
                        : bounceProgress === 0
                        ? 0
                        : Math.pow(2, -10 * bounceProgress) * Math.sin((bounceProgress * 10 - 0.75) * c4) + 1;
                    
                    // After bounce, do breathing effect
                    const pulseSpeed = 1.5;
                    const pulseAmount = 0.05;
                    const breatheScale = 1 + (Math.sin(Date.now() * 0.001 * pulseSpeed) * pulseAmount);
                    
                    // Blend between bounce and breathing based on bounce progress
                    const blendFactor = Math.min((bounceProgress - 0.8) / 0.2, 1); // Start blend at 80% of bounce
                    const finalScale = bounceProgress < 0.8 
                        ? bounceScale 
                        : bounceScale * (1 - blendFactor) + breatheScale * blendFactor;
                    
                    // Create gradient text
                    this.ctx.save();
                    this.ctx.translate(this.canvas.width/2, this.canvas.height/2 + 120);
                    this.ctx.scale(finalScale, finalScale);
                    
                    // Create gradient
                    const gradient = this.ctx.createLinearGradient(-100, 0, 100, 0);
                    const time = Date.now() * 0.001;
                    gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 80%)`);
                    gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 70%, 80%)`);
                    gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 70%, 80%)`);
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Touch anything to restart', 0, 0);
                    
                    this.ctx.restore();
                }
            }
            
            // Draw snowflakes with lighter opacity
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.snowflakes.forEach(snow => {
                this.ctx.beginPath();
                this.ctx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // Draw confetti
            this.confetti.forEach(conf => {
                this.ctx.save();
                this.ctx.translate(conf.x, conf.y);
                this.ctx.rotate(conf.rotation);
                this.ctx.scale(conf.scale, conf.scale);
                this.ctx.fillStyle = conf.color;
                this.ctx.fillRect(-conf.size/2, -conf.size/2, conf.size, conf.size * 2);
                this.ctx.restore();
            });
        }
    }
    
    restart() {
        if (!this.canRestart) return;
        
        // Play restart sound
        this.restartSound.currentTime = 0;
        this.restartSound.play();
        
        // Play random VOX cheer after delay (different from last time)
        setTimeout(() => {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * this.voxCheers.length);
            } while (newIndex === this.lastPlayedVoxIndex && this.voxCheers.length > 1);
            
            this.lastPlayedVoxIndex = newIndex;
            const randomCheer = this.voxCheers[newIndex];
            randomCheer.currentTime = 0;
            randomCheer.play();
        }, 200);
        
        // Start first skiing sound again
        this.skiingSounds[0].play();
        
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
            invulnerable: true,
            countdownNumber: 3  // Start at 3
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

    createConfetti() {
        // Create initial batch
        for (let i = 0; i < 50; i++) {  // Start with fewer pieces
            this.confetti.push(this.createConfettiPiece());
        }
        
        // Add more confetti over time
        let piecesAdded = 50;
        const addMoreConfetti = () => {
            if (piecesAdded < 200) {  // Total of 200 pieces
                for (let i = 0; i < 10; i++) {  // Add 10 pieces every interval
                    this.confetti.push(this.createConfettiPiece());
                }
                piecesAdded += 10;
                setTimeout(addMoreConfetti, 100);  // Add more every 100ms
            }
        };
        setTimeout(addMoreConfetti, 100);
    }

    createConfettiPiece() {
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            size: Math.random() * 8 + 4,
            speedX: (Math.random() - 0.5) * 2,  // Reduced horizontal speed
            speedY: Math.random() * 2 + 1,  // Much slower falling (1-3 speed)
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,  // Slower rotation
            color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
            scale: Math.random() * 0.5 + 0.5
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