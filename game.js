class Game {
    constructor() {
        // Add intro state
        this.isIntroScreen = true;
        this.introStartTime = Date.now();
        
        // Initialize basic components needed for intro
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        
        // Initialize highscore in localStorage if it doesn't exist
        if (!localStorage.getItem('highScore') || isNaN(parseFloat(localStorage.getItem('highScore')))) {
            localStorage.setItem('highScore', '0');
        }
        
        // Add screen shake configuration
        this.screenShake = {
            active: false,
            startTime: 0,
            duration: 400,  // 400ms shake
            intensity: 15   // Maximum shake offset in pixels
        };
        
        // Add snow configuration (needed from start)
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());
        
        // Add large snowflake configuration for intro
        this.largeSnowflakes = Array(15).fill().map(() => this.createLargeSnowflake());
        
        // Add extra-large snowflake configuration for intro
        this.extraLargeSnowflakes = Array(8).fill().map(() => this.createExtraLargeSnowflake());
        
        // Add super large snowflake configuration
        this.superSnowflakes = Array(4).fill().map(() => this.createSuperSnowflake());
        this.superSnowflakeImg = new Image();
        this.superSnowflakeImg.src = 'snowflake.png';
        
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
        
        // Setup speed text reference but keep it hidden
        this.speedText = document.getElementById('speed-text');
        
        this.restartTextStartTime = 0;  // Track when restart text appears
        
        // Setup skiing sound
        this.skiingSounds = [
            new Audio('Skiing.mp3'),
            new Audio('Skiing.mp3')
        ];
        this.skiingSounds.forEach((sound, index) => {
            sound.volume = 0.25;
            
            // Add error handling
            sound.addEventListener('error', (e) => {
                console.error(`Skiing sound ${index} error:`, e);
                // Only try to recover if we're actually playing
                if (!this.isIntroScreen && !this.gameOver) {
                    sound.currentTime = 0;
                    sound.load();
                }
            });

            sound.addEventListener('timeupdate', () => {
                // Skip if not actually playing or if game is over/intro
                if (sound.paused || sound.currentTime === 0 || this.isIntroScreen || this.gameOver) {
                    return;
                }

                // Start crossfade when 1 second from the end
                if (sound.currentTime > sound.duration - 1) {
                    const otherSound = this.skiingSounds.find(s => s !== sound);
                    
                    // Start the other sound if it's not already playing and we're still in game
                    if (otherSound.paused && !this.isIntroScreen && !this.gameOver) {
                        otherSound.currentTime = 0;
                        otherSound.volume = 0.25;
                        otherSound.play().catch(e => {
                            console.error('Error playing skiing sound:', e);
                            // Only try to restart current sound if still in game
                            if (!this.isIntroScreen && !this.gameOver) {
                                sound.currentTime = 0;
                                sound.play().catch(console.error);
                            }
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
        this.crashSound = new Audio('smack.mp3');
        this.crashSound.volume = 0.25;  // Keep same volume level
        
        // Setup snowstorm sound but don't play yet
        this.snowstormSound = new Audio('snowstorm.mp3');
        this.snowstormSound.loop = true;
        this.snowstormSound.volume = 0.25;
        
        // Setup restart sound at full volume
        this.restartSound = new Audio('Juicy Wooden Click.wav');
        this.restartSound.volume = 1.0;  // Changed from 0.25 to 1.0

        // Setup highscore applause sound
        this.highscoreApplauseSound = new Audio('Cheer Clapping Small Group In Theater Applause sound effect.mp3');
        this.highscoreApplauseSound.volume = 0.25;

        // Setup success jingle for beating highscore during gameplay
        this.successJingle = new Audio('Success Jingle Plucking.wav');
        this.successJingle.volume = 0.25;

        // Setup crowd cheering sounds
        this.cheerSound1 = new Audio('Crowd Cheering Exterior, Big Surge, Rose Bowl Stadium, Applause _5.1 LCRLsRsLf_01.mp3');
        this.cheerSound2 = new Audio('Crowd Cheering Interior, Female Crowd, Short Swell 24, Staples Arena Los Angeles  _5.1 LCRLsRsLf_01.mp3');
        this.cheerSound1.volume = 0.35;  // Increased from 0.25 to 0.35 (140% as loud)
        this.cheerSound2.volume = 0.35;  // Increased from 0.25 to 0.35 (140% as loud)

        // Setup VOX cheer sounds
        this.voxCheers = [
            new Audio('ChenBase_VOX_Cheer01.ogg'),
            new Audio('ChenBase_VOX_Cheer02.ogg'),
            new Audio('Falstad_VOX_Cheer04.ogg'),
            new Audio('Falstad_VOX_Cheer05.ogg')
        ];
        this.voxCheers.forEach(sound => sound.volume = 0.114);  // Changed from 0.175 to 0.114 (65% as loud)
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
        this.introMusic.addEventListener('error', (e) => {
            console.error('Intro music error:', e);
            // Try to recover
            this.introMusic.currentTime = 0;
            this.introMusic.load();
        });
        this.introMusic.addEventListener('play', () => {
            console.log('Intro music started playing');
        });
        this.introMusic.addEventListener('ended', () => {
            if (this.isIntroScreen) {  // Only restart if still in intro
                console.log('Intro music ended, attempting to restart');
                this.introMusic.currentTime = 0;
                this.introMusic.play().catch(e => console.error('Error restarting intro music:', e));
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
                            
                            // Hide birthday text and show timer when starting game
                            this.birthdayText.style.opacity = '0';
                            this.timerText.style.opacity = '1';
                            this.speedText.style.opacity = '1';
                            
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
                this.introMusic.play().catch(e => {
                    console.error('Error playing intro music:', e);
                    // On mobile, we might need to try again on the next user interaction
                    const retryPlay = () => {
                        this.introMusic.play().catch(console.error);
                        document.removeEventListener('touchstart', retryPlay);
                        document.removeEventListener('click', retryPlay);
                    };
                    document.addEventListener('touchstart', retryPlay);
                    document.addEventListener('click', retryPlay);
                });
                
                // Start snowstorm with fade in
                this.snowstormSound.volume = 0;  // Start silent
                this.snowstormSound.play();
                
                // Fade in over 1 second
                const fadeIn = () => {
                    if (this.snowstormSound.volume < 0.25) {
                        this.snowstormSound.volume = Math.min(0.25, this.snowstormSound.volume + 0.01);
                        setTimeout(fadeIn, 40);  // 40ms * 25 steps = 1000ms (1 second)
                    }
                };
                fadeIn();
                
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

        // Add tab visibility tracking
        this.isTabVisible = true;
        this.lastVisibleTime = Date.now();
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isTabVisible = false;
            } else {
                this.isTabVisible = true;
                // Update the start time to account for time spent in background
                if (!this.isIntroScreen && !this.gameOver) {
                    const timeInBackground = Date.now() - this.lastVisibleTime;
                    this.startTime += timeInBackground;
                }
            }
            this.lastVisibleTime = Date.now();
        });

        // Add skiing sound health check interval
        this.skiingSoundCheckInterval = setInterval(() => {
            // Only check during active gameplay
            if (!this.isIntroScreen && !this.gameOver) {
                // Check if any skiing sound is playing
                const anySkiingSoundPlaying = this.skiingSounds.some(sound => 
                    !sound.paused && sound.currentTime > 0 && !sound.ended
                );
                
                // If no skiing sound is playing, restart first sound
                if (!anySkiingSoundPlaying) {
                    console.log('Recovering from skiing sound silence');
                    this.skiingSounds[0].currentTime = 0;
                    this.skiingSounds[0].volume = 0.25;
                    this.skiingSounds[0].play().catch(console.error);
                }
            }
        }, 3000);  // Check every 3 seconds

        // Add collision particles array
        this.collisionParticles = [];

        // Add powerup configuration
        this.powerups = [];
        this.powerupImg = new Image();
        this.powerupImg.src = 'hourglass.png';
        this.powerupSound = new Audio('Powerup Pickup.mp3');
        this.powerupSound.volume = 0.25;
        
        // Add floating text configuration
        this.floatingTexts = [];
        
        // Add timer flash state
        this.timerFlash = {
            active: false,
            startTime: 0,
            duration: 1000  // 1 second flash
        };

        // Add shield configuration
        this.shield = {
            active: false,
            startTime: 0,
            duration: 0,
            color: 'rgb(0, 255, 0)',  // Default green
            opacity: 0
        };
        
        // Add both powerup types
        this.powerups = [];
        this.powerupImg = new Image();
        this.powerupImg.src = 'hourglass.png';
        this.snowmanImg = new Image();
        this.snowmanImg.src = 'snowman.png';
        this.powerupSound = new Audio('Powerup Pickup.mp3');
        this.shieldSound = new Audio('Powerup Bump.mp3');
        this.powerupSound.volume = 0.25;
        this.shieldSound.volume = 0.25;
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
                this.speedText.style.opacity = '1';
                
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
        
        // Add large snowflake configuration for gameplay too
        this.largeSnowflakes = Array(15).fill().map(() => this.createLargeSnowflake());
        
        // Add extra-large snowflake configuration for gameplay too
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

        this.activateShield(3000, 'rgb(0, 255, 0)');  // 3 seconds, green color
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

        // Add back the keyup handler for responsive controls
        document.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key);
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
        
        // Scale base tree count with screen width, but less aggressively
        const widthRatio = Math.sqrt(this.canvas.width / 800);  // Use square root for gentler scaling
        const baseTreeCount = Math.ceil(this.baseTreeCount * widthRatio);
        const treeCount = baseTreeCount * multiplier * 4;  // Always use 4x multiplier
        
        // Calculate spawn width based on screen dimensions
        const screenRatio = this.canvas.width / this.canvas.height;
        const spawnWidthMultiplier = Math.max(3, 12 / screenRatio);  // Scale between 3-12x based on ratio
        const spawnWidth = this.canvas.width * spawnWidthMultiplier;
        const spawnOffset = (spawnWidth - this.canvas.width) / 2;
        
        for (let i = 0; i < treeCount; i++) {
            this.trees.push({
                x: (Math.random() * spawnWidth) - spawnOffset,
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
    
    // Add method to calculate speed multiplier based on time
    getSpeedMultiplier() {                                          
        const minutesPassed = this.currentScore / 180;  // How many 3-minute intervals have passed
        return 1 + minutesPassed;  // Start at 1, add progress continuously
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
            
            // Update super snowflakes for intro screen
            this.superSnowflakes.forEach(snow => {
                snow.y += snow.speed;  // Only move down in intro
                snow.rotation += snow.rotationSpeed;
                
                // Reset position when off screen
                if (snow.y > this.canvas.height + 50) {
                    snow.y = -50;
                    snow.x = Math.random() * this.canvas.width;
                }
            });
            
        } else {
            if (this.gameOver) {
                // Update collision particles even during game over
                this.collisionParticles = this.collisionParticles.filter(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.life -= 0.02;  // Reduced from 0.05 to fade out slower
                    return particle.life > 0;
                });
                return;  // Skip other updates
            }
            
            // Only update score if tab is visible
            if (this.isTabVisible) {
                this.currentScore = (Date.now() - this.startTime) / 1000;
                this.lastVisibleTime = Date.now();
                
                // Check if we just surpassed the highscore during gameplay
                const storedHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
                if (!this.gameOver && storedHighScore > 1 && this.currentScore > storedHighScore && !this.hasPlayedHighscoreJingle) {
                    // Play success jingle
                    this.successJingle.currentTime = 0;
                    this.successJingle.play();
                    this.hasPlayedHighscoreJingle = true;  // Only play once per run
                    
                    // Flash timer gold
                    this.timerText.style.transition = 'color 0.3s';
                    this.timerText.style.color = '#FFD700';  // Gold color
                    setTimeout(() => {
                        this.timerText.style.color = '#001933';  // Reset to original color
                    }, 1000);
                }
            }
            
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
            
            const BASE_SPEED = this.getSpeedMultiplier();
            
            if (this.easyMode) {
                // Easy mode movement
                // Calculate speeds based on active keys
                if (this.activeKeys.has('ArrowLeft')) horizontalSpeed += BASE_SPEED;
                if (this.activeKeys.has('ArrowRight')) horizontalSpeed -= BASE_SPEED;
                if (this.activeKeys.has('ArrowUp')) verticalSpeed += BASE_SPEED;
                if (this.activeKeys.has('ArrowDown')) verticalSpeed -= BASE_SPEED;
            } else {
                // Normal mode movement
                horizontalSpeed = this.direction === 'left' ? BASE_SPEED : -BASE_SPEED;
                verticalSpeed = -BASE_SPEED;  // Using base speed here too
            }
            
            // Move trees with adjusted vertical speed
            this.trees.forEach(tree => {
                tree.x += horizontalSpeed;
                tree.y += verticalSpeed;
                
                if (tree.y < -50) {
                    const isPortrait = window.innerHeight > window.innerWidth;
                    const spawnWidthMultiplier = isPortrait ? 12 : 3;
                    const spawnWidth = this.canvas.width * spawnWidthMultiplier;
                    const spawnOffset = (spawnWidth - this.canvas.width) / 2;
                    tree.y = this.canvas.height + 50;
                    tree.x = (Math.random() * spawnWidth) - spawnOffset;
                }
            });
            
            // Keep original speed for snowflakes
            this.snowflakes.forEach(snow => {
                const diagonalSpeed = snow.speed;
                if (this.easyMode) {
                    snow.x += horizontalSpeed * diagonalSpeed;
                    snow.y += verticalSpeed * diagonalSpeed;  // Divide by multiplier to maintain original speed
                } else {
                    snow.x += (this.direction === 'left' ? diagonalSpeed : -diagonalSpeed);
                    snow.y -= diagonalSpeed;  // Keep original speed for snow
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
            
            // Do the same for large and extra-large snowflakes
            this.largeSnowflakes.forEach(snow => {
                const diagonalSpeed = snow.speed;
                if (this.easyMode) {
                    snow.x += horizontalSpeed * diagonalSpeed;
                    snow.y += verticalSpeed * diagonalSpeed;
                } else {
                    snow.x += (this.direction === 'left' ? diagonalSpeed : -diagonalSpeed);
                    snow.y -= diagonalSpeed;
                }
                
                // Reset large snowflake when it goes off screen
                if (snow.y < -20) {
                    snow.y = this.canvas.height + 20;
                    snow.x = Math.random() * this.canvas.width;
                } else if (snow.y > this.canvas.height + 20) {
                    snow.y = -20;
                    snow.x = Math.random() * this.canvas.width;
                }
                if (snow.x < -20) {
                    snow.x = this.canvas.width + 20;
                } else if (snow.x > this.canvas.width + 20) {
                    snow.x = -20;
                }
            });

            this.extraLargeSnowflakes.forEach(snow => {
                const diagonalSpeed = snow.speed;
                if (this.easyMode) {
                    snow.x += horizontalSpeed * diagonalSpeed;
                    snow.y += verticalSpeed * diagonalSpeed;
                } else {
                    snow.x += (this.direction === 'left' ? diagonalSpeed : -diagonalSpeed);
                    snow.y -= diagonalSpeed;
                }
                
                // Reset extra-large snowflake when it goes off screen
                if (snow.y < -30) {
                    snow.y = this.canvas.height + 30;
                    snow.x = Math.random() * this.canvas.width;
                } else if (snow.y > this.canvas.height + 30) {
                    snow.y = -30;
                    snow.x = Math.random() * this.canvas.width;
                }
                if (snow.x < -30) {
                    snow.x = this.canvas.width + 30;
                } else if (snow.x > this.canvas.width + 30) {
                    snow.x = -30;
                }
            });
            
            // Check if we need to add more trees based on time
            const currentMultiplier = this.getTreeMultiplier();
            const widthRatio = this.canvas.width / 800;
            const baseTreeCount = Math.ceil(this.baseTreeCount * widthRatio);
            const desiredTreeCount = baseTreeCount * currentMultiplier * 4;  // Always use 4x multiplier
            
            while (this.trees.length < desiredTreeCount) {
                const screenRatio = this.canvas.width / this.canvas.height;
                const spawnWidthMultiplier = Math.max(3, 12 / screenRatio);  // Scale between 3-12x based on ratio
                const spawnWidth = this.canvas.width * spawnWidthMultiplier;
                const spawnOffset = (spawnWidth - this.canvas.width) / 2;
                
                this.trees.push({
                    x: (Math.random() * spawnWidth) - spawnOffset,
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
                        y: tree.y + 13,  // Start 3 pixels lower (70% of bottom portion)
                        width: 5,
                        height: 7  // Reduced from 10 to 7 (70% of original)
                    };
                    
                    if (this.checkPlayerCollision(playerBaseHitbox, treeHitbox, cornerSize)) {
                        // Create collision effect at impact point
                        this.createCollisionEffect(tree.x, tree.y + 15);
                        
                        this.gameOver = true;
                        this.canRestart = false;
                        
                        // Update highscore in localStorage if current score is higher
                        const storedHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
                        if (this.currentScore > storedHighScore) {
                            localStorage.setItem('highScore', this.currentScore.toString());
                            // Play highscore applause sound
                            this.highscoreApplauseSound.currentTime = 0;
                            this.highscoreApplauseSound.play();
                            // Play success jingle
                            this.successJingle.currentTime = 0;
                            this.successJingle.play();
                        }
                        
                        // Stop all skiing sounds immediately
                        this.skiingSounds.forEach(sound => {
                            sound.pause();
                            sound.currentTime = 0;
                        });
                        
                        // Play crash sound
                        this.crashSound.currentTime = 0;
                        this.crashSound.play();
                        
                        setTimeout(() => {
                            this.canRestart = true;
                            this.restartTextStartTime = Date.now();
                        }, 1000);
                        break;
                    }
                }
            }
            
            // Update confetti
            this.confetti = this.confetti.filter(conf => {
                conf.y += conf.speedY;
                conf.x += conf.speedX;
                conf.rotation += conf.rotationSpeed;
                conf.speedY += 0.1;  // Add gravity
                
                // Remove confetti that's fallen off screen
                return conf.y < this.canvas.height + 20;
            });
            
            // Update powerups
            this.powerups = this.powerups.filter(powerup => {
                // Move powerup with game movement
                powerup.x += horizontalSpeed;
                powerup.y += verticalSpeed;
                
                // Handle fade out
                if (powerup.fadeOut) {
                    powerup.opacity -= 0.05;  // Fade out over 0.2 seconds (20 frames)
                    return powerup.opacity > 0;
                }
                
                // Check collision with player if not fading
                if (!powerup.fadeOut) {
                    const playerHitbox = {
                        x: this.playerX - 20,
                        y: this.playerY,
                        width: 40,
                        height: 20
                    };
                    
                    const powerupHitbox = {
                        x: powerup.x - 10,
                        y: powerup.y - 10,
                        width: 20,
                        height: 20
                    };
                    
                    if (this.checkCollision(playerHitbox, powerupHitbox)) {
                        // Call handlePowerupCollision instead of inline code
                        this.handlePowerupCollision(powerup);
                    }
                }
                
                return powerup.y > -20;  // Keep if still on screen
            });
            
            // Spawn new powerups occasionally
            if (Math.random() < 0.004) {  // Spawn check frequency unchanged
                const timeSinceStart = (Date.now() - this.startTime) / 1000;
                // Only allow snowman after 5 seconds
                const isTimeBonus = timeSinceStart < 5 ? true : Math.random() < 0.5;
                const newPowerup = this.createPowerup(isTimeBonus);
                this.powerups.push(newPowerup);
            }
            
            // Update floating texts
            this.floatingTexts = this.floatingTexts.filter(text => {
                const elapsed = Date.now() - text.startTime;
                return elapsed < text.duration;
            });
            
            // Update super snowflakes for gameplay
            this.superSnowflakes.forEach(snow => {
                if (this.easyMode) {
                    snow.x += horizontalSpeed * snow.speed;
                    snow.y += verticalSpeed * snow.speed;
                } else {
                    snow.x += (this.direction === 'left' ? snow.speed : -snow.speed);
                    snow.y -= snow.speed;
                }
                
                snow.rotation += snow.rotationSpeed;
                
                // Reset position when off screen
                if (snow.y < -50) {
                    snow.y = this.canvas.height + 50;
                    snow.x = Math.random() * this.canvas.width;
                } else if (snow.y > this.canvas.height + 50) {
                    snow.y = -50;
                    snow.x = Math.random() * this.canvas.width;
                }
                if (snow.x < -50) {
                    snow.x = this.canvas.width + 50;
                } else if (snow.x > this.canvas.width + 50) {
                    snow.x = -50;
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
        if (this.shield.active) return false;  // No collision while shield is active
        return this.checkCollision(player, tree);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply screen shake at the very start of draw method
        this.ctx.save();
        if (this.screenShake.active) {
            const elapsed = Date.now() - this.screenShake.startTime;
            if (elapsed < this.screenShake.duration) {
                const progress = elapsed / this.screenShake.duration;
                const intensity = this.screenShake.intensity * (1 - progress);  // Fade out shake
                const shakeX = (Math.random() - 0.5) * intensity * 2;
                const shakeY = (Math.random() - 0.5) * intensity * 2;
                this.ctx.translate(shakeX, shakeY);
            } else {
                this.screenShake.active = false;
            }
        }

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

            // Draw version number in bottom left
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';  // Semi-transparent white
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(`v${GAME_VERSION}`, 10, this.canvas.height - 10);
            
            // Draw highscore in bottom right
            this.ctx.textAlign = 'right';
            const storedHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
            this.ctx.fillText(`Highscore: ${storedHighScore.toFixed(2)}s`, this.canvas.width - 10, this.canvas.height - 10);
            
            this.ctx.restore();
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
            
            // Draw shield if active
            this.drawShieldEffect(0, 0, scale);
            
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
                const speedMph = Math.round(this.getSpeedMultiplier() * 20);
                this.speedText.textContent = `${speedMph} MPH`;
            } else {
                this.timerText.style.opacity = '0';  // Hide timer on game over
                this.speedText.style.opacity = '0';  // Hide speed on game over
            }
            
            if (this.gameOver) {
                // Draw semi-transparent overlay
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Comment out collision box visualization
                /*
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
                        collidedTree.y + 13,  // Updated to match new hitbox
                        5,
                        7  // Updated to match new hitbox
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
                */
                
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
                this.ctx.fillText(`Score:`, this.canvas.width/2, this.canvas.height/2 - 30);
                this.ctx.fillText(`${this.currentScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2 + 30);
                this.ctx.fillText(`Highscore:`, this.canvas.width/2, this.canvas.height/2 + 90);
                const storedHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
                this.ctx.fillText(`${storedHighScore.toFixed(2)}s`, this.canvas.width/2, this.canvas.height/2 + 150);
                
                // Draw "New Highscore!" text if we just set a record
                if (this.currentScore === storedHighScore) {
                    const pulseSpeed = 1.5;
                    const pulseAmount = 0.05;
                    const breatheScale = 1 + (Math.sin(Date.now() * 0.001 * pulseSpeed) * pulseAmount);
                    
                    this.ctx.save();
                    this.ctx.translate(this.canvas.width/2, 150); // Changed from 50 to 150 (3x further from top)
                    this.ctx.scale(breatheScale, breatheScale);
                    
                    // Create rainbow gradient
                    const gradient = this.ctx.createLinearGradient(-200, 0, 200, 0);  // Widened gradient range for larger text
                    const time = Date.now() * 0.001;
                    gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 80%)`);
                    gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 70%, 80%)`);
                    gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 70%, 80%)`);
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.font = '48px Arial';  // Changed from 24px to 48px (2x bigger)
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('New Highscore!', 0, 0);
                    
                    this.ctx.restore();
                }
                
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
                    this.ctx.translate(this.canvas.width/2, this.canvas.height - 50);  // Changed from canvas.height/2 + 120
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

            // Draw player with flash effect
            this.ctx.save();
            this.ctx.translate(this.playerX, this.playerY);
            
            // Add red flash if recently hit
            if (this.playerFlashTime) {
                const flashProgress = (Date.now() - this.playerFlashTime) / 200;  // 200ms flash
                if (flashProgress < 1) {
                    // Use globalCompositeOperation to only tint non-transparent pixels
                    this.ctx.globalCompositeOperation = 'source-atop';
                    this.ctx.fillStyle = `rgba(255, 0, 0, ${1 - flashProgress})`;
                    this.ctx.drawImage(this.skierImg, -20, -20, 40, 40);  // Draw player first
                    this.ctx.fillRect(-20, -20, 40, 40);  // Then overlay the red tint
                    this.ctx.globalCompositeOperation = 'source-over';  // Reset composite operation
                } else {
                    this.playerFlashTime = null;
                }
            }
            
            // ... rest of player drawing code ...
            this.ctx.restore();
            
            // Draw collision particles
            this.collisionParticles.forEach(particle => {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw powerups
            this.powerups.forEach(powerup => {
                this.ctx.save();
                this.ctx.globalAlpha = powerup.opacity;
                this.ctx.drawImage(
                    powerup.type === 'time' ? this.powerupImg : this.snowmanImg,  // Choose image based on type
                    powerup.x - 10,
                    powerup.y - 10,
                    20,
                    20
                );
                this.ctx.restore();
            });
            
            // Draw floating texts
            this.floatingTexts.forEach(text => {
                const elapsed = Date.now() - text.startTime;
                const progress = elapsed / text.duration;
                
                // Calculate position with wave movement
                const waveX = text.baseX + Math.sin(progress * Math.PI * 4) * 20;
                const y = text.y - (progress * 100);  // Float upward
                
                this.ctx.save();
                this.ctx.fillStyle = `rgba(0, 255, 0, ${1 - progress})`;
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(text.text, waveX, y);
                this.ctx.restore();
            });
            
            // Apply timer flash
            if (this.timerFlash.active) {
                const elapsed = Date.now() - this.timerFlash.startTime;
                if (elapsed < this.timerFlash.duration) {
                    const progress = elapsed / this.timerFlash.duration;
                    const alpha = Math.sin(progress * Math.PI);
                    this.timerText.style.color = `rgba(0, 255, 0, ${alpha})`;
                } else {
                    this.timerFlash.active = false;
                    this.timerText.style.color = '#001933';  // Reset to original color
                }
            }
        }

        // Draw super snowflakes (always active)
        this.superSnowflakes.forEach(snow => {
            this.ctx.save();
            this.ctx.translate(snow.x, snow.y);
            this.ctx.rotate(snow.rotation);
            this.ctx.globalAlpha = 0.15;  // Changed to 15% opacity
            this.ctx.drawImage(
                this.superSnowflakeImg,
                -snow.size/2,
                -snow.size/2,
                snow.size,
                snow.size
            );
            this.ctx.restore();
        });

        this.ctx.restore();  // Restore at the very end of draw method
    }
    
    restart() {
        if (!this.canRestart) return;
        
        // Fade out highscore applause sound if it's playing
        if (!this.highscoreApplauseSound.paused) {
            const fadeOut = () => {
                if (this.highscoreApplauseSound.volume > 0.01) {
                    this.highscoreApplauseSound.volume = Math.max(0, this.highscoreApplauseSound.volume - 0.025);  // Fade over 1 second (40 steps)
                    setTimeout(fadeOut, 25);  // 25ms * 40 steps = 1000ms (1 second)
                } else {
                    this.highscoreApplauseSound.pause();
                    this.highscoreApplauseSound.volume = 0.25;  // Reset volume for next time
                }
            };
            fadeOut();
        }
        
        // Play restart sound
        this.restartSound.currentTime = 0;
        this.restartSound.play();
        
        // Reset and restart skiing sounds
        this.skiingSounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        // Start first skiing sound with a clean state
        this.skiingSounds[0].currentTime = 0;
        this.skiingSounds[0].volume = 0.25;
        this.skiingSounds[0].play().catch(e => {
            console.error('Error restarting skiing sound:', e);
            // Try again after a short delay if it fails
            setTimeout(() => {
                this.skiingSounds[0].play().catch(console.error);
            }, 100);
        });
        
        // Play random VOX cheer after delay
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
        this.speedText.style.opacity = '1';  // Show speed text again too
        
        // Reset snowflakes
        this.snowflakes = Array(100).fill().map(() => this.createSnowflake());

        // Clear collision particles
        this.collisionParticles = [];
        this.playerFlashTime = null;
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
        // Regular (small) snowflakes - slowest
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -10 : Math.random() * this.canvas.height,
            size: Math.random() * 2 + 1,  // Size range: 1-3 pixels
            speed: this.isIntroScreen ? 
                Math.random() * 0.5 + 0.5 :    // Intro speed: 0.5-1
                Math.random() * 1.5 + 2      // Game speed: 2-3.5
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
        // Large snowflakes - faster
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -20 : Math.random() * this.canvas.height,
            size: Math.random() * 5 + 4,    // Size range: 4-9 pixels
            speed: Math.random() * 2 + 4,   // Changed: Speed range 4-6 (faster)
            opacity: Math.random() * 0.3 + 0.2
        };
    }

    createExtraLargeSnowflake(forceTop = false) {
        // Extra large snowflakes - fastest
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -30 : Math.random() * this.canvas.height,
            size: Math.random() * 8 + 8,    // Size range: 8-16 pixels
            speed: Math.random() * 3 + 6,   // Changed: Speed range 6-9 (much faster)
            opacity: Math.random() * 0.2 + 0.1
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

    // Add method to create collision effect
    createCollisionEffect(x, y) {
        // Create ring of particles with slower speed
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (Math.random() * 2 + 3) * 0.1;  // 10% of original speed (0.3-0.5)
            this.collisionParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,  // Start at full opacity
                size: Math.random() * 3 + 2  // Random size between 2-5
            });
        }
        
        // Start screen shake
        this.screenShake = {
            active: true,
            startTime: Date.now(),
            duration: 400,
            intensity: 15
        };
    }

    // Clean up interval when game is destroyed
    destroy() {
        if (this.skiingSoundCheckInterval) {
            clearInterval(this.skiingSoundCheckInterval);
        }
    }

    createPowerup(forceTime = false) {
        const isTimeBonus = forceTime || Math.random() < 0.5;  // Use forceTime parameter
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 25,
            opacity: 1,
            fadeOut: false,
            type: isTimeBonus ? 'time' : 'shield'
        };
    }
    
    createFloatingText(x, y, text) {
        return {
            x: x,
            y: y,
            text: text,
            startTime: Date.now(),
            duration: 2000,  // 2 seconds total animation
            baseX: x  // Store initial X for wave movement
        };
    }

    createSuperSnowflake(forceTop = false) {
        // Super large image snowflakes - fastest of all
        return {
            x: Math.random() * this.canvas.width,
            y: forceTop ? -150 : Math.random() * this.canvas.height,  // Increased offset for larger size
            size: Math.random() * 60 + 120,    // Changed: Size range: 120-180 pixels (3x bigger)
            speed: Math.random() * 6 + 12,     // Changed: Speed range 12-18 (1.5x faster)
            rotation: Math.random() * Math.PI * 2,  // Random initial rotation
            rotationSpeed: (Math.random() - 0.5) * 0.02  // Keep same rotation speed
        };
    }

    activateShield(duration, color) {
        this.shield = {
            active: true,
            startTime: Date.now(),
            duration: duration,
            color: color,
            opacity: 0.5
        };
    }

    drawShieldEffect(x, y, scale) {
        if (this.shield.active) {
            const elapsed = Date.now() - this.shield.startTime;
            if (elapsed < this.shield.duration) {
                const flashProgress = (elapsed % 300) / 300;
                const shieldAlpha = Math.sin(flashProgress * Math.PI) * this.shield.opacity;

                // Draw shield circle with larger radius (increased from 25 to 35)
                this.ctx.beginPath();
                this.ctx.arc(x, y, 35 * scale, 0, Math.PI * 2);  // Changed from 25 to 35
                this.ctx.strokeStyle = `${this.shield.color.replace('rgb', 'rgba').replace(')', `, ${shieldAlpha})`)}`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();

                this.ctx.strokeStyle = `${this.shield.color.replace('rgb', 'rgba').replace(')', `, ${shieldAlpha * 0.3})`)}`;
                this.ctx.lineWidth = 6;
                this.ctx.stroke();

                // Draw countdown
                const remainingSeconds = Math.ceil((this.shield.duration - elapsed) / 1000);
                if (remainingSeconds > 0) {
                    const numberProgress = (elapsed % 1000) / 1000;
                    const numberScale = 3 - (2 * numberProgress);
                    const numberAlpha = numberProgress <= 0.5 
                        ? numberProgress * 2 
                        : 2 - (numberProgress * 2);

                    this.ctx.save();
                    this.ctx.translate(0, -80);
                    this.ctx.scale(numberScale, numberScale);
                    this.ctx.fillStyle = `${this.shield.color.replace('rgb', 'rgba').replace(')', `, ${numberAlpha})`)}`;
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(remainingSeconds.toString(), 0, 0);
                    this.ctx.restore();
                }
            } else {
                this.shield.active = false;
            }
        }
    }

    handlePowerupCollision(powerup) {
        powerup.fadeOut = true;
        
        if (powerup.type === 'time') {
            this.powerupSound.currentTime = 0;
            this.powerupSound.play();
            this.startTime -= 20000;
            this.timerFlash.active = true;
            this.timerFlash.startTime = Date.now();
            this.floatingTexts.push(
                this.createFloatingText(this.playerX, this.playerY - 40, "+20")
            );
        } else {  // shield type
            this.shieldSound.currentTime = 0;
            this.shieldSound.play();
            
            // If shield is already active, just refresh its duration
            if (this.shield.active) {
                this.shield.startTime = Date.now();  // Reset start time
                this.shield.duration = 8000;         // Set full duration
            } else {
                // Otherwise activate new shield
                this.activateShield(8000, 'rgb(0, 100, 255)');
            }
        }
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