import { Scene } from '../core/scene.js';;
import * as C from '../config.js';
import { getRandom, getRandomInt, checkRectOverlap, deepCopy } from '../utils.js';
import { LevelGenerator } from '../level/levelGenerator.js';
import { createEffectsSystem } from '../core/effects.js';
import { PowerUpSystem } from '../core/powerup.js';

/* GameplayScene class (most game logic & drawing) */

export class GameplayScene extends Scene {
    constructor() {
        super();
        console.log("GameplayScene constructor called");
        // Properties will be initialized in onEnter
        this.levelGenerator = null;
        this.effectsSystem = null;
        this.powerUpSystem = null;
        this.camera = { x: 0, y: 0 };
        this.keysPressed = {}; // Object to store key states
        
        // Game state flags
        this.gameStarted = false;
        this.gameWon = false;
        this.levelComplete = false;
        this.startTime = 0;
        this.levelTime = 0;
        this.currentLevel = 1;
        this.gameMode = 'normal'; // Default, will be set by init
    }

    /**
     * Initializes the scene with options, called after the scene is set in main.js.
     * @param {object} options - Initialization options.
     * @param {boolean} [options.isTestMode=false] - Whether to start in test mode.
     */
    init(options = {}) {
        this.gameMode = options.isTestMode ? 'test' : 'normal';
        console.log(`GameplayScene initialized with mode: ${this.gameMode}`);
        // Note: onEnter will be called by the SceneManager *after* this init.
    }

    toggleGameMode() {
        this.gameMode = this.gameMode === 'normal' ? 'test' : 'normal';
        console.log(`Game mode switched to: ${this.gameMode}`);
        this.resetLevel();
    }

    onEnter() {
        console.log("==== GameplayScene.onEnter: START ====");
        
        try {
            console.log("Initializing level generator...");
            this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            console.log("Level generator created successfully");

            console.log("Initializing effects system...");
            this.effectsSystem = createEffectsSystem();
            console.log("Effects system created successfully");

            // Bind event handlers
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleKeyUp = this.handleKeyUp.bind(this);

            // Add input listeners
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keyup', this.handleKeyUp);
            console.log("Input listeners added.");

            // resetLevel is now called within onEnter, using the gameMode set by init()
            // console.log("Calling resetLevel..."); // Moved inside onEnter logic
            // this.resetLevel(); // Moved inside onEnter logic
            // console.log("resetLevel completed successfully"); // Moved inside onEnter logic
            
            // Initialize based on the mode set by init()
            console.log(`Calling resetLevel for mode: ${this.gameMode}...`);
            this.resetLevel(); // resetLevel uses this.gameMode internally
            console.log("resetLevel completed successfully");

            console.log("Updating UI elements...");
            this.updateLivesDisplay();
            this.updateOrbShieldDisplay();
            document.getElementById('timer').textContent = "0.00";
            console.log("UI updated successfully");
            
            if (this.game) {
                document.addEventListener('keydown', (e) => {
                    if (e.key.toLowerCase() === 't' && !e.repeat) {
                        this.toggleGameMode();
                    }
                });
            }

            this.gameStarted = true;
            console.log("==== GameplayScene.onEnter: COMPLETE ====");
        } catch (error) {
            console.error("ERROR in GameplayScene.onEnter:", error);
            // Simple visual error on canvas
            if (this.game && this.game.ctx) {
                const ctx = this.game.ctx;
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = 'red';
                ctx.font = '24px Arial';
                ctx.fillText(`GameplayScene Error: ${error.message}`, 20, 100);
            }
        }
    }

    update(deltaTime) {
        console.log("GameplayScene.update called with deltaTime:", deltaTime);
        if (!this.gameStarted || this.gameWon) {
            console.log("GameplayScene.update: Skipping update due to game state");
            return;
        }
        
        // Update level timer
        this.levelTime = (Date.now() - this.startTime) / 1000;
        document.getElementById('timer').textContent = this.levelTime.toFixed(2);
        
        // --- Player Physics and Movement ---
        if (this.player) {
            let player = this.player;
            let onGround = player.onGround; // Use current ground status for logic

            // --- Horizontal Movement ---
            const targetAcceleration = onGround ? C.GROUND_ACCELERATION : C.AIR_ACCELERATION;
            const targetMaxSpeed = onGround ? C.GROUND_MAX_SPEED : C.AIR_MAX_SPEED;
            const targetFriction = onGround ? C.GROUND_FRICTION : C.AIR_FRICTION;

            let moveInput = 0;
            if (this.keysPressed['arrowleft']) {
                moveInput = -1;
                player.facingDirection = 'left';
            } else if (this.keysPressed['arrowright']) {
                moveInput = 1;
                player.facingDirection = 'right';
            }

            if (moveInput !== 0) {
                // Accelerate
                player.velocityX += moveInput * targetAcceleration * deltaTime * 60; // Scale acceleration by frame rate factor
                // Clamp to max speed
                player.velocityX = Math.max(-targetMaxSpeed, Math.min(targetMaxSpeed, player.velocityX));
                player.animationState = onGround ? 'running' : player.animationState; // Keep jumping/falling anim in air
            } else {
                // Apply friction
                player.velocityX *= Math.pow(targetFriction, deltaTime * 60); // Apply friction based on time
                if (Math.abs(player.velocityX) < 0.1) {
                    player.velocityX = 0;
                    if (onGround) player.animationState = 'idle';
                }
            }

            // --- Vertical Movement ---
            // Apply Gravity
            let currentGravity = C.GRAVITY;
            if (!onGround && this.keysPressed[' ']) { // Flying reduces gravity
                currentGravity *= C.FLYING_GRAVITY_MULTIPLIER;
            }
            player.velocityY += currentGravity * deltaTime * 60; // Scale gravity

            // Jumping
            if (this.keysPressed['arrowup'] && onGround) { // Simple jump, no coyote time yet
                player.velocityY = -C.JUMP_STRENGTH;
                player.onGround = false; // Leave ground immediately
                onGround = false; // Update local variable
                player.animationState = 'jumping';
            }

            // Flying (apply upward force if space is pressed and not on ground)
            if (this.keysPressed[' '] && !onGround) {
                player.velocityY -= C.FLY_STRENGTH * deltaTime * 60;
                // Clamp upward fly speed
                player.velocityY = Math.max(player.velocityY, -C.MAX_FLY_SPEED);
                 player.animationState = 'jumping'; // Use jumping anim for flying for now
            }

            // --- Collision Detection ---
            let nextX = player.x + player.velocityX * deltaTime * 60;
            let nextY = player.y + player.velocityY * deltaTime * 60;
            let collidedVertically = false;
            let collidedHorizontally = false;
            player.onGround = false; // Assume not on ground until collision check proves otherwise
            player.groundPlatform = null;

            this.platforms.forEach(platform => {
                // Basic AABB collision check
                const playerRect = { x: nextX, y: nextY, width: player.width, height: player.height };
                const platformRect = { x: platform.x, y: platform.y, width: platform.width, height: platform.height };

                if (checkRectOverlap(playerRect, platformRect)) {
                    // Check vertical collision (landing on top)
                    // Condition: Player was above or level with platform top, and will be below or level with it next frame
                    if (player.y + player.height <= platform.y && nextY + player.height >= platform.y && player.velocityY >= 0) {
                         nextY = platform.y - player.height; // Snap to top
                         player.velocityY = 0;
                         player.onGround = true;
                         collidedVertically = true;
                         player.groundPlatform = platform; // Store reference to ground platform
                         if (player.animationState === 'jumping' || player.animationState === 'falling') {
                             player.animationState = 'idle'; // Or 'landing' if implemented
                         }
                    }
                    // Check horizontal collision (hitting sides) - simplified
                    else if (!collidedVertically) { // Only check horizontal if not landing on top in the same check
                        // Check left side collision
                        if (player.x + player.width <= platform.x && nextX + player.width >= platform.x) {
                            nextX = platform.x - player.width;
                            player.velocityX = 0;
                            collidedHorizontally = true;
                        }
                        // Check right side collision
                        else if (player.x >= platform.x + platform.width && nextX <= platform.x + platform.width) {
                            nextX = platform.x + platform.width;
                            player.velocityX = 0;
                            collidedHorizontally = true;
                        }
                        // Check ceiling collision (hitting bottom of platform) - simplified
                        else if (player.y >= platform.y + platform.height && nextY <= platform.y + platform.height) {
                             nextY = platform.y + platform.height;
                             if (player.velocityY < 0) player.velocityY = 0; // Stop upward movement
                             collidedHorizontally = true; // Treat as horizontal collision for simplicity here
                        }
                    }
                }
            });

            // Update player position
            player.x = nextX;
            player.y = nextY;

            // Update animation state if falling
            if (!player.onGround && player.velocityY > 0 && player.animationState !== 'jumping') {
                 player.animationState = 'falling'; // Or use 'jumping' animation for falling
            }

            // Prevent falling through floor (simple boundary)
             if (player.y + player.height > C.CANVAS_HEIGHT) {
                 player.y = C.CANVAS_HEIGHT - player.height;
                 player.velocityY = 0;
                 player.onGround = true; // Consider canvas bottom as ground
                 if (player.animationState === 'jumping' || player.animationState === 'falling') {
                     player.animationState = 'idle';
                 }
             }

            // --- Animation Update ---
            const poseDataArr = C.STICK_FIGURE?.poses[player.animationState];
            if (poseDataArr && poseDataArr.length > 1) { // Only animate if multiple frames exist
                player.animationTimer += deltaTime;
                const frameDuration = 1 / (C.ANIMATION_SPEED || 8); // Time per frame
                if (player.animationTimer >= frameDuration) {
                    player.animationTimer -= frameDuration;
                    player.animationFrameIndex = (player.animationFrameIndex + 1) % poseDataArr.length;
                }
            } else {
                player.animationFrameIndex = 0; // Reset to first frame if state changes or only one frame
            }


        } // End if(this.player)

        // Update effects and particles
        if (this.effectsSystem) { // Check if effects system exists
            this.effectsSystem.update(deltaTime);
        }

        // Update camera position
        this.updateCamera();
    }

    render(ctx) {
        // --- Background Rendering ---
        const time = this.levelTime || 0; // Get current time for animations
        const camX = this.camera.x;      // Get current camera X for parallax
        const canvas = ctx.canvas;       // Get canvas reference

        // Call the new detailed background function
        this.drawDesertDunesBackground(time, camX, ctx);

        // Apply camera transform for game elements (already saved in drawDesertDunesBackground)
        ctx.save(); // Save state *after* background is drawn
        ctx.translate(-this.camera.x, -this.camera.y);

        // --- Render Game Elements (Platforms, Collectibles, Enemies, Player) ---

        // Render platforms (using their defined colors)
        this.platforms.forEach(platform => {
            ctx.fillStyle = platform.color || C.PLATFORM_BASE_COLOR; // Use platform color or default
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Optional: Add edge/glow from config if desired
            if (C.PLATFORM_EDGE_COLOR) {
                 ctx.strokeStyle = C.PLATFORM_EDGE_COLOR;
                 ctx.lineWidth = 2;
                 // ctx.shadowColor = C.PLATFORM_EDGE_COLOR; // Glow effect can be performance heavy
                 // ctx.shadowBlur = C.PLATFORM_EDGE_GLOW_BLUR || 0;
                 ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                 // ctx.shadowColor = 'transparent'; // Reset shadow
            }
            // TODO: Add cactus drawing on platforms if needed
        });

        // Render collectibles (assuming sprite exists)
        if (this.collectibles && this.collectibles.length > 0) {
            this.collectibles.forEach(collectible => {
                if (collectible.sprite) {
                    ctx.drawImage(collectible.sprite, collectible.x, collectible.y);
                } else { // Fallback drawing
                    ctx.fillStyle = C.COLLECTIBLE_COLOR || 'pink';
                    ctx.beginPath();
                    ctx.arc(collectible.x + C.REWARD_BASE_RADIUS, collectible.y + C.REWARD_BASE_RADIUS, C.REWARD_BASE_RADIUS, 0, Math.PI * 2);
             ctx.fill();
        }
    }

    // NEW DESERT BACKGROUND FUNCTION
    drawDesertDunesBackground(time, camX, ctx) {
        const canvas = ctx.canvas; // Get canvas reference inside the function
        ctx.save(); // Save the current canvas state

        // 1. Sky Gradient
        // Create a vertical gradient for the sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75); // Gradient covers top 3/4 of the canvas height
        // Define color stops for the gradient (top to bottom)
        skyGradient.addColorStop(0, '#87CEEB'); // Light Sky Blue at the very top
        skyGradient.addColorStop(0.7, '#FFDAB9'); // Peach Puff / Light Orange near the horizon (70% down)
        skyGradient.addColorStop(1, '#FFA07A'); // Light Salmon / Orange deeper horizon (at 75% down)
        // Fill the entire canvas with this sky gradient first
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Optional Sun
        // Calculate sun position with parallax (moves slower than foreground)
        const sunX = canvas.width * 0.8 - camX * 0.02; // Sun position scrolls very slowly based on camera X
        const sunY = canvas.height * 0.15; // Fixed vertical position near the top
        const sunRadius = 40;
        // Draw the main sun circle (light yellow, slightly transparent)
        ctx.fillStyle = 'rgba(255, 255, 224, 0.9)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2); // Draw a full circle
        ctx.fill();
        // Add a glow effect to the sun using shadow properties
        ctx.shadowColor = 'rgba(255, 255, 0, 0.5)'; // Yellow glow color
        ctx.shadowBlur = 25; // How much blur for the glow
        // Draw a slightly smaller, brighter circle inside to enhance the glow center
        ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent'; // Reset shadow so it doesn't affect dunes

        // 3. Dunes (Draw from back to front)
        // Define properties for multiple dune layers for parallax effect
        const duneLayers = [
            // Far layer (moves slowest)
            {
                parallax: 0.08, // Scroll speed factor (lower = slower/further)
                baseY: canvas.height * 0.65, // Average vertical position
                amp1: 40, freq1: 0.003, // Amplitude (height) & frequency (waviness) of main sine wave
                amp2: 15, freq2: 0.007, // Amplitude & frequency of secondary sine wave (for ripples)
                hue: 40, sat: 45, lightBase: 55, lightRange: 10, // HSL color params for shading (Browner)
            }, // Comma between objects
            // Mid layer
            {
                parallax: 0.15,
                baseY: canvas.height * 0.75,
                amp1: 60, freq1: 0.004,
                amp2: 25, freq2: 0.009,
                hue: 45, sat: 55, lightBase: 65, lightRange: 12, // HSL color params (Standard sand)
            }, // Comma between objects
            // Near layer (moves fastest)
            {
                parallax: 0.30,
                baseY: canvas.height * 0.85,
                amp1: 80, freq1: 0.005,
                amp2: 30, freq2: 0.012,
                hue: 50, sat: 65, lightBase: 70, lightRange: 15, // HSL color params (Lighter sand)
            } // No comma needed for the last object
        ];

        const segmentWidth = 5; // Draw dunes using small vertical line segments

        // Iterate through each defined dune layer and draw it
        duneLayers.forEach((layer, index) => {
            // Calculate how much this layer should scroll based on camera and parallax factor
            const scrollOffset = camX * layer.parallax;
            // Calculate a subtle time-based offset for a "wind" animation effect
            // Use a much smaller multiplier for timeFactor to slow down the animation
            const timeFactor = time * 5 * (index * 0.5 + 1); // Adjusted time multiplier for visible animation

            // Create a vertical gradient FOR THIS DUNE LAYER to simulate shading
            const gradientYStart = layer.baseY - layer.amp1 - layer.amp2 - 20; // Start gradient above highest possible peak
            const gradientYEnd = canvas.height; // Gradient extends to the bottom
            const duneGradient = ctx.createLinearGradient(0, gradientYStart, 0, gradientYEnd);

            // Calculate highlight and shadow colors based on HSL parameters
            const lightHighlight = Math.min(95, layer.lightBase + layer.lightRange);
            const lightShadow = Math.max(10, layer.lightBase - layer.lightRange);

            // Define color stops for the dune shading gradient (top to bottom)
            duneGradient.addColorStop(0, `hsl(${layer.hue}, ${layer.sat}%, ${lightHighlight}%)`);       // Highlight color near top
            duneGradient.addColorStop(0.4, `hsl(${layer.hue}, ${layer.sat}%, ${layer.lightBase}%)`);      // Mid-tone color around base Y
            duneGradient.addColorStop(0.8, `hsl(${layer.hue - 10}, ${layer.sat - 10}%, ${lightShadow}%)`); // Shadow color below base Y
            duneGradient.addColorStop(1, `hsl(${layer.hue - 15}, ${layer.sat - 15}%, ${lightShadow - 5}%)`);// Darkest shadow at the very bottom

            // Set the fill style to the calculated shading gradient
            ctx.fillStyle = duneGradient;
            ctx.beginPath(); // Start drawing the shape of this dune layer
            ctx.moveTo(0, canvas.height); // Start path at bottom-left corner

            // Loop across the screen width, drawing vertical segments
            for (let x = 0; x <= canvas.width; x += segmentWidth) {
                // Calculate the X position in the "world" considering the layer's scroll offset
                const worldX = x + scrollOffset;
                // Calculate the Y position (height) of the dune top at this worldX
                // This combines the base height with TWO sine waves for a more natural, bumpy look
                // It also includes the timeFactor for animation and an index-based phase shift
                const duneY = layer.baseY +
                              Math.sin(worldX * layer.freq1 + timeFactor + index * 1.5) * layer.amp1 +
                              Math.sin(worldX * layer.freq2 + timeFactor * 1.3 + index * 3.0) * layer.amp2;
                // Draw a line segment from the previous point to the current calculated top edge
                // Math.max(0, duneY) prevents dunes from being drawn above the top of the canvas
                ctx.lineTo(x, Math.max(0, duneY));
            }

            ctx.lineTo(canvas.width, canvas.height); // Draw line to bottom-right corner
            ctx.closePath(); // Close the shape (connects back to bottom-left)
            ctx.fill(); // Fill the defined dune shape with the gradient
        });

        ctx.restore(); // Restore the canvas state to how it was before this function
    }
}

        // Render enemies (assuming sprite exists)
        // Need to handle different enemy types if they exist in this.enemies structure
        const enemyTypes = Object.keys(this.enemies || {});
        enemyTypes.forEach(type => {
            if (this.enemies[type] && this.enemies[type].length > 0) {
                this.enemies[type].forEach(enemy => {
                    if (enemy.sprite) {
                        ctx.drawImage(enemy.sprite, enemy.x, enemy.y);
                    } else { // Fallback drawing
                        ctx.fillStyle = enemy.color || 'red'; // Use enemy color or default
                        ctx.fillRect(enemy.x, enemy.y, enemy.width || 20, enemy.height || 20);
                    }
                });
            }
        });

        // --- Render Player and Magic Carpet ---
        if (this.player) {
            const time = this.levelTime || 0;
            // Draw carpet *only* if player is not on the ground
            if (!this.player.onGround) {
                this.drawMagicCarpet(this.player, time, ctx);
            }
            // Draw player on top
            this.drawPlayer(ctx);
        }

        // Render effects and particles (after player/carpet)
        if (this.effectsSystem) {
            this.effectsSystem.render(ctx);
        }

        // Restore original transform (end camera view)
        ctx.restore();

        // --- Render UI elements (Not affected by camera) ---
        this.renderUI(ctx); // Render score, lives, etc.

        // Render Game Mode Toggle Text
        ctx.fillStyle = this.gameMode === 'test' ? '#FFFF00' : '#FFFFFF'; // Yellow in test, white in normal
        ctx.font = '18px Arial';
        ctx.textAlign = 'right'; // Align to the right
        ctx.fillText(`Mode: ${this.gameMode.toUpperCase()} (Press T to toggle)`,
                    C.CANVAS_WIDTH - 20, 30); // Position near top-right
        ctx.textAlign = 'left'; // Reset alignment

        // Debug rendering (Optional, can be commented out)
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, 10, 50);
        ctx.fillText(`Player: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`, 10, 70);
        ctx.fillText(`Platforms: ${this.platforms.length}`, 10, 90);
    }
    
    resetLevel() {
        console.log(`resetLevel: START (Mode: ${this.gameMode})`);
        try {
            // Ensure levelGenerator exists
            if (!this.levelGenerator) {
                 console.error("LevelGenerator not initialized before resetLevel!");
                 this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            }

            // Generate level data regardless of mode
            console.log("Calling levelGenerator.generateLevel()...");
            // Pass gameMode to generator if it needs to adjust generation based on mode
            const levelData = this.levelGenerator.generateLevel({ gameMode: this.gameMode });
            console.log("Level generation complete."); // Keep levelData for setup

            // Initialize player based on level data
            console.log("Creating player...");
            this.player = deepCopy(C.INITIAL_PLAYER_STATE); // Use deepCopy from utils
            // Position player centered on the start platform, just above it
            this.player.x = levelData.startPlatform ?
                            levelData.startPlatform.x + (levelData.startPlatform.width / 2) - (this.player.width / 2)
                            : 100; // Fallback X
            this.player.y = levelData.startPlatform ?
                            levelData.startPlatform.y - this.player.height - 1 // -1 to ensure not overlapping
                            : C.CANVAS_HEIGHT - 100; // Fallback Y
            console.log("Player created at:", this.player.x, this.player.y);

            // Apply test mode modifications AFTER initial player setup
            if (this.gameMode === 'test') {
                console.log("Applying test mode modifications to player...");
                this.player.lives = 999;
                this.player.orbShieldCount = 3; // Give shields in test mode
                console.log("Test Player State:", this.player);
            }

            // Set up level elements from generated data
            // Ensure levelData provides these structures or provide defaults
            this.platforms = levelData.platforms || [];
            // Assuming levelData.enemies is an object like { bats: [], groundPatrollers: [], snakes: [] }
            // Ensure enemies are cleared as per request
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] };
            console.log("Enemies cleared for this level.");
            this.collectibles = levelData.collectibles || [];
            this.goal = levelData.goal || { x: C.CHUNK_WIDTH * C.NUM_CHUNKS - 200, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = levelData.levelEndX || C.CHUNK_WIDTH * C.NUM_CHUNKS;
            console.log(`Level End X set to: ${this.levelEndX}`);

            // Reset camera based on the NEW player position
            this.camera = { x: 0, y: 0 }; // Reset camera first
            // Position camera slightly ahead of player, respecting level start boundary
            this.camera.x = Math.max(0, this.player.x - C.CANVAS_WIDTH / 3);
            this.camera.y = 0; // Assuming no vertical camera movement initially
            console.log("Camera reset to:", this.camera.x, this.camera.y);

            // Reset game state flags
            this.gameWon = false;
            this.levelComplete = false;
            this.startTime = Date.now();
            this.levelTime = 0;

            // Reset effects system if needed
            if (this.effectsSystem && typeof this.effectsSystem.reset === 'function') {
                this.effectsSystem.reset();
            }

            console.log("resetLevel: COMPLETE");
        } catch (error) {
            console.error("ERROR in resetLevel:", error);
            // Fallback setup in case of critical error during generation/setup
            this.platforms = [{x: 50, y: C.CANVAS_HEIGHT - 50, width: 400, height: 30, color: 'darkred'}]; // Visible error platform
            this.player = deepCopy(C.INITIAL_PLAYER_STATE); // Reset player state
            this.player.x = 100;
            this.player.y = C.CANVAS_HEIGHT - 100;
            this.camera = { x: 0, y: 0 };
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] };
            this.collectibles = [];
            this.goal = { x: 1000, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = 1200;
            // Optionally display an error message on screen in render
        }
    }

    // createTestEnvironment() { ... removed as resetLevel now handles both modes ... }

    updateCamera() {
        // Simple player-following camera with level bounds
        const targetX = this.player.x - C.CANVAS_WIDTH / 2;
        const maxX = this.levelEndX - C.CANVAS_WIDTH;
        
        // Smooth camera movement
        this.camera.x += (Math.max(0, Math.min(maxX, targetX)) - this.camera.x) * 0.1;
    }

    renderUI(ctx) {
        // Example UI rendering
        if (this.gameWon) {
            ctx.fillStyle = C.WIN_TEXT_COLOR;
            ctx.font = C.WIN_TEXT_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2);
        }
    }

    updateLivesDisplay() {
        const livesDisplay = document.getElementById('livesDisplay');
        if (livesDisplay && this.player) {
            livesDisplay.textContent = `Lives: ${this.player.lives}`;
        }
    }

    updateOrbShieldDisplay() {
        const orbShieldDisplay = document.getElementById('orbShieldDisplay');
        if (orbShieldDisplay && this.player) {
            orbShieldDisplay.textContent = `Shield: ${this.player.orbShieldCount}`;
        }
    }

    handleReset() {
        if (this.gameWon) {
            // Move to next level
            this.currentLevel++;
            this.resetLevel();
        } else {
            // Restart current level
            this.resetLevel();
        }
    }

    isGameplayActive() {
        // Return true only if not in a winning or game over state
        return this.gameStarted && !this.gameWon && (this.player?.lives > 0);
    }

    onExit() {
        console.log("Exiting GameplayScene");
        // Remove input listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        console.log("Input listeners removed.");
        // Clean up any other resources if needed
    }

    // --- Input Handlers ---
    handleKeyDown(e) {
        // Prevent default browser behavior for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        // Store key state
        this.keysPressed[e.key.toLowerCase()] = true;

        // Handle game mode toggle separately
        if (e.key.toLowerCase() === 't' && !e.repeat) {
            this.toggleGameMode();
        }
    }

    handleKeyUp(e) {
        // Clear key state
        this.keysPressed[e.key.toLowerCase()] = false;
    }

    // --- Drawing Functions ---

    drawPlayer(ctx) {
        if (!this.player || !C.STICK_FIGURE) {
            console.error("drawPlayer: Player or STICK_FIGURE config missing.");
            return;
        }
        const player = this.player;
        const stickFigure = C.STICK_FIGURE;
        const poseDataArr = stickFigure.poses[player.animationState];

        if (!poseDataArr || poseDataArr.length === 0) {
            console.warn(`drawPlayer: No pose data found for animation state: ${player.animationState}`);
            // Fallback: Draw a simple rectangle
            ctx.fillStyle = C.PLAYER_COLOR || 'blue';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            return;
        }

        // Ensure frame index is valid, wrap around if needed
        const frameIndex = Math.floor(player.animationFrameIndex) % poseDataArr.length;
        const poseData = poseDataArr[frameIndex];

        if (!poseData) {
             console.error(`drawPlayer: Invalid frame index ${frameIndex} for state ${player.animationState}`);
             // Fallback: Draw a simple rectangle
             ctx.fillStyle = C.PLAYER_COLOR || 'blue';
             ctx.fillRect(player.x, player.y, player.width, player.height);
             return;
        }

        const anchorX = player.x + player.width / 2;
        const anchorY = player.y + player.height;
        const flip = player.facingDirection === 'left' ? -1 : 1;

        ctx.save();
        ctx.strokeStyle = stickFigure.jointColor || '#FFFFFF';
        ctx.lineWidth = stickFigure.lineWidth || 2;
        ctx.fillStyle = stickFigure.jointColor || '#FFFFFF';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Helper to get absolute position applying flip
        const getPos = (relativePos) => {
            if (!relativePos || !Array.isArray(relativePos)) return [anchorX, anchorY]; // Safety check
            return [anchorX + relativePos[0] * flip, anchorY + relativePos[1]];
        };

        // --- Draw Body Parts ---
        const hipPos = getPos(poseData.hip);
        const shoulderPos = getPos(poseData.shoulder);
        const neckPos = getPos(poseData.neck);
        const headPos = getPos(poseData.head);

        // Torso
        ctx.beginPath();
        ctx.moveTo(hipPos[0], hipPos[1]);
        ctx.lineTo(shoulderPos[0], shoulderPos[1]);
        ctx.lineTo(neckPos[0], neckPos[1]);
        ctx.stroke();

        // Arms
        const drawLimb = (limbPoints) => {
            if (!limbPoints || !Array.isArray(limbPoints) || limbPoints.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(shoulderPos[0], shoulderPos[1]); // Start from shoulder
            for (let i = 0; i < limbPoints.length; i++) {
                const point = getPos(limbPoints[i]);
                ctx.lineTo(point[0], point[1]);
            }
            ctx.stroke();
        };
        drawLimb(poseData.armL);
        drawLimb(poseData.armR);

        // Legs
        const drawLeg = (legPoints) => {
             if (!legPoints || !Array.isArray(legPoints) || legPoints.length < 2) return;
             ctx.beginPath();
             ctx.moveTo(hipPos[0], hipPos[1]); // Start from hip
             for (let i = 0; i < legPoints.length; i++) {
                 const point = getPos(legPoints[i]);
                 ctx.lineTo(point[0], point[1]);
             }
             ctx.stroke();
         };
        drawLeg(poseData.legL);
        drawLeg(poseData.legR);


        // --- Draw Head ---
        ctx.beginPath();
        ctx.arc(headPos[0], headPos[1], stickFigure.headRadius || 5, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw Accessories ---
        // Hat (Example - adapt from description)
        if (stickFigure.hat) {
            const hat = stickFigure.hat;
            const tip = getPos([poseData.head[0] + hat.tipOffset[0], poseData.head[1] + hat.tipOffset[1]]);
            const brimY = headPos[1] + hat.brimHeight / 2; // Center brim vertically on head center
            const brimLeft = getPos([poseData.head[0] - hat.brimWidth / 2, poseData.head[1]]);
            const brimRight = getPos([poseData.head[0] + hat.brimWidth / 2, poseData.head[1]]);

            ctx.fillStyle = hat.color || '#6a0dad';
            ctx.beginPath();
            ctx.moveTo(tip[0], tip[1]);
            // Approximate cone sides + elliptical brim
            ctx.quadraticCurveTo(brimLeft[0], brimY - hat.brimHeight * 1.5, brimLeft[0], brimY);
            ctx.ellipse(headPos[0], brimY, hat.brimWidth / 2, hat.brimHeight / 2, 0, 0, Math.PI * 2);
            ctx.moveTo(tip[0], tip[1]); // Reconnect tip for fill
            ctx.quadraticCurveTo(brimRight[0], brimY - hat.brimHeight * 1.5, brimRight[0], brimY);
            ctx.fill();
        }

        // Staff (Example - adapt from description)
        const handLPos = getPos(poseData.armL[poseData.armL.length - 1]); // Position of last point in armL
        const handRPos = getPos(poseData.armR[poseData.armR.length - 1]); // Position of last point in armR
        const drawStaff = stickFigure.staff && stickFigure.staff.hand !== 'right' && !player.isAttacking; // Condition to draw staff

        if (drawStaff) {
            const staff = stickFigure.staff;
            const staffTop = [handLPos[0] + staff.topOffset[0] * flip, handLPos[1] + staff.topOffset[1]];
            const staffBottom = [staffTop[0], staffTop[1] + staff.length]; // Simple vertical staff

            ctx.strokeStyle = staff.color || '#8B4513';
            ctx.lineWidth = (stickFigure.lineWidth || 2) + 1; // Slightly thicker
            ctx.beginPath();
            ctx.moveTo(staffTop[0], staffTop[1]);
            ctx.lineTo(staffBottom[0], staffBottom[1]);
            ctx.stroke();

            // Gem
            ctx.fillStyle = staff.gemColor || '#FF4500';
            ctx.beginPath();
            ctx.arc(staffTop[0], staffTop[1], staff.gemRadius || 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sword (Example - adapt from description)
        const drawSword = stickFigure.sword && (stickFigure.staff?.hand !== 'right' || player.isAttacking);

        if (drawSword) {
            const sword = stickFigure.sword;
            const hiltBase = [handRPos[0] + sword.hiltOffset[0] * flip, handRPos[1] + sword.hiltOffset[1]];
            let angle = sword.angle * flip;
            if (player.isAttacking) {
                 // Adjust angle during attack - simple example
                 angle += Math.PI / 4 * flip * Math.sin(player.attackTimer / C.ATTACK_DURATION * Math.PI);
            }
            const hiltEndX = hiltBase[0] + Math.cos(angle + Math.PI / 2) * sword.hiltLength;
            const hiltEndY = hiltBase[1] + Math.sin(angle + Math.PI / 2) * sword.hiltLength;
            const bladeTipX = hiltEndX + Math.cos(angle) * sword.bladeLength;
            const bladeTipY = hiltEndY + Math.sin(angle) * sword.bladeLength;

            // Glow
            if (C.SWORD_GLOW_COLOR) {
                ctx.shadowColor = C.SWORD_GLOW_COLOR;
                ctx.shadowBlur = C.SWORD_GLOW_BLUR || 10;
            }

            // Blade
            ctx.strokeStyle = C.SWORD_COLOR || '#e0e0ff';
            ctx.lineWidth = C.SWORD_LINE_WIDTH || 2;
            ctx.beginPath();
            ctx.moveTo(hiltEndX, hiltEndY);
            ctx.lineTo(bladeTipX, bladeTipY);
            ctx.stroke();

            // Hilt (simple line)
            ctx.strokeStyle = stickFigure.jointColor; // Match body color
            ctx.lineWidth = stickFigure.lineWidth + 1;
            ctx.beginPath();
            ctx.moveTo(hiltBase[0], hiltBase[1]);
            ctx.lineTo(hiltEndX, hiltEndY);
            ctx.stroke();

            ctx.shadowColor = 'transparent'; // Reset glow
        }

        ctx.restore();
    }

    drawMagicCarpet(player, time, ctx) {
        const anchorX = player.x + player.width / 2;
        const anchorY = player.y + player.height + (C.CARPET_OFFSET_Y || 5);

        // Calculate animated dimensions based on time and config constants
        const waveSpeed = C.CARPET_WAVE_SPEED || 8;
        const waveAmpX = C.CARPET_WAVE_AMP_X || 0.08;
        const waveAmpY = C.CARPET_WAVE_AMP_Y || 0.15;
        const baseWidth = C.CARPET_WIDTH || 110;
        const baseHeight = C.CARPET_HEIGHT || 10;

        // Combine multiple sine waves for more complex movement
        const waveX1 = Math.sin(time * waveSpeed) * waveAmpX;
        const waveX2 = Math.sin(time * waveSpeed * 0.6 + 1) * waveAmpX * 0.5; // Slower wave
        const waveY1 = Math.cos(time * waveSpeed * 0.7) * waveAmpY; // Slightly different speed for Y
        const waveY2 = Math.cos(time * waveSpeed * 0.4 + 2) * waveAmpY * 0.6;

        const currentWidth = baseWidth * (1 + waveX1 + waveX2);
        const currentHeight = baseHeight * (1 - (waveY1 + waveY2) * 0.5); // Average Y waves, invert effect
        const carpetX = anchorX - currentWidth / 2;
        const carpetY = anchorY - currentHeight / 2; // Center vertically too

        // Call the trail function *before* drawing the carpet itself
        this.drawCarpetTrail(carpetX + currentWidth / 2, carpetY + currentHeight / 2, player.velocityX, player.velocityY, time, ctx);

        ctx.save();

        // Subtle Glow
        ctx.shadowColor = C.CARPET_COLOR_1 || 'rgba(160, 96, 255, 0.5)';
        ctx.shadowBlur = 8;

        // Create gradient fill
        const carpetGradient = ctx.createLinearGradient(carpetX, carpetY, carpetX, carpetY + currentHeight);
        carpetGradient.addColorStop(0, C.CARPET_COLOR_1 || '#a060ff');
        carpetGradient.addColorStop(1, C.CARPET_COLOR_2 || '#d0a0ff');
        ctx.fillStyle = carpetGradient;

        // Draw wavy/curved shape
        const segments = 10; // Number of segments for curves
        ctx.beginPath();
        ctx.moveTo(carpetX, carpetY); // Top-left corner

        // Top edge (wavy)
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const px = carpetX + currentWidth * t;
            const pyOffset = Math.sin(time * waveSpeed * 1.5 + t * Math.PI * 2) * currentHeight * 0.2; // Add waviness
            ctx.lineTo(px, carpetY + pyOffset);
        }

        // Right edge (rounded)
        ctx.quadraticCurveTo(carpetX + currentWidth + currentHeight * 0.3, carpetY + currentHeight / 2, carpetX + currentWidth, carpetY + currentHeight);

        // Bottom edge (wavy)
        for (let i = segments; i >= 1; i--) {
            const t = i / segments;
            const px = carpetX + currentWidth * t;
            const pyOffset = Math.sin(time * waveSpeed * 1.5 + t * Math.PI * 2 + Math.PI) * currentHeight * 0.2; // Add waviness (phase shifted)
            ctx.lineTo(px, carpetY + currentHeight + pyOffset);
        }

         // Left edge (rounded)
        ctx.quadraticCurveTo(carpetX - currentHeight * 0.3, carpetY + currentHeight / 2, carpetX, carpetY);

        ctx.closePath();
        ctx.fill();

        // Reset shadow for patterns/tassels
        ctx.shadowColor = 'transparent';

        // Draw patterns on top (Example: Diamond and circles)
        ctx.fillStyle = C.CARPET_COLOR_2 || '#d0a0ff'; // Use lighter color for contrast
        const centerX = carpetX + currentWidth / 2;
        const centerY = carpetY + currentHeight / 2;
        // Diamond
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - currentHeight * 0.3);
        ctx.lineTo(centerX + currentWidth * 0.1, centerY);
        ctx.lineTo(centerX, centerY + currentHeight * 0.3);
        ctx.lineTo(centerX - currentWidth * 0.1, centerY);
        ctx.closePath();
        ctx.fill();
        // Circles
        ctx.beginPath();
        ctx.arc(centerX - currentWidth * 0.3, centerY, currentHeight * 0.2, 0, Math.PI * 2);
        ctx.arc(centerX + currentWidth * 0.3, centerY, currentHeight * 0.2, 0, Math.PI * 2);
        ctx.fill();


        // Draw wavy tassels
        const numTassels = 5;
        const tasselLength = currentHeight * 1.5;
        const beadRadius = 3;
        ctx.strokeStyle = C.CARPET_COLOR_2 || '#d0a0ff';
        ctx.fillStyle = C.CARPET_COLOR_1 || '#a060ff'; // Bead color
        ctx.lineWidth = 2;

        for (let i = 0; i < numTassels; i++) {
            const startX = carpetX + (currentWidth / (numTassels + 1)) * (i + 1);
            const startY = carpetY + currentHeight; // Start from bottom edge
            const endY = startY + tasselLength;
            const controlXOffset = Math.sin(time * waveSpeed * 2 + i * 0.5) * 15; // Horizontal sway
            const controlYOffset = Math.cos(time * waveSpeed * 1.2 + i * 0.8) * 10; // Vertical curve

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            // Bezier curve for wavy tassel
            ctx.bezierCurveTo(
                startX + controlXOffset / 2, startY + tasselLength / 3 + controlYOffset,
                startX - controlXOffset / 2, startY + tasselLength * 2 / 3 - controlYOffset,
                startX + Math.sin(time * waveSpeed * 2.5 + i) * 5, endY // End point with slight sway
            );
            ctx.stroke();

            // Draw bead at the end
            const beadX = startX + Math.sin(time * waveSpeed * 2.5 + i) * 5;
            ctx.beginPath();
            ctx.arc(beadX, endY, beadRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawCarpetTrail(carpetCenterX, carpetCenterY, velocityX, velocityY, time, ctx) {
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const minSpeedThreshold = 5; // Only draw if moving reasonably fast
        if (speed < minSpeedThreshold) return;

        ctx.save();
        // More particles at higher speeds, up to a limit
        const particleCount = Math.min(15, Math.floor(3 + speed * 0.2));
        const trailLength = 50 + speed * 0.5; // How far back particles spread

        // Normalize direction vector
        const dirX = -velocityX / speed;
        const dirY = -velocityY / speed;

        // Starting point slightly behind the carpet center
        const trailStartX = carpetCenterX + dirX * (C.CARPET_WIDTH || 110) * 0.3;
        const trailStartY = carpetCenterY + dirY * (C.CARPET_HEIGHT || 10) * 0.3;

        ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow

        for (let i = 0; i < particleCount; i++) {
            const trailProgress = i / (particleCount - 1); // 0 (farthest) to 1 (closest)

            // Base position along the trail direction
            const baseX = trailStartX + dirX * trailLength * trailProgress;
            const baseY = trailStartY + dirY * trailLength * trailProgress;

            // Add perpendicular wavy offset for spread
            const perpendicularAngle = Math.atan2(dirY, dirX) + Math.PI / 2;
            const waveOffsetMagnitude = Math.sin(time * 10 + trailProgress * Math.PI * 3) * 15 * (1 - trailProgress); // Wider spread farther back
            const offsetX = Math.cos(perpendicularAngle) * waveOffsetMagnitude;
            const offsetY = Math.sin(perpendicularAngle) * waveOffsetMagnitude;

            const x = baseX + offsetX;
            const y = baseY + offsetY;

            // Size fades out along the trail, pulses slightly
            const baseSize = 1 + 5 * (1 - trailProgress);
            const sizePulse = Math.sin(time * 15 + i * 0.5) * 0.5 + 0.5; // 0 to 1 pulse
            const size = baseSize * (0.5 + sizePulse * 0.5); // Apply pulse, min size 50%

            // Alpha fades out along the trail
            const alpha = 0.6 * (1 - trailProgress) * (0.5 + sizePulse * 0.5); // Fade alpha too

            // Color shifts hue over time and along trail (HSL is good for this)
            const hue = (180 + time * 30 + trailProgress * 60) % 360; // Shift through blues/purples/pinks
            const saturation = 80 + 20 * sizePulse; // More saturated when brighter/larger
            const lightness = 60 + 15 * sizePulse; // Brighter when larger
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

            ctx.beginPath();
            ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2); // Ensure size is not negative
            ctx.fill();

            // Optional: Draw random star sparkles (small percentage)
            if (Math.random() < 0.15 && trailProgress > 0.3) { // Less frequent near carpet
                const starSize = size * 0.8;
                const angle = time * 5 + i * 1.5;
                ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.8})`; // Slightly brighter outline
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) { // 5 points for a star
                    const outerX = x + Math.cos(angle + (j * Math.PI * 2 / 5)) * starSize;
                    const outerY = y + Math.sin(angle + (j * Math.PI * 2 / 5)) * starSize;
                    if (j === 0) ctx.moveTo(outerX, outerY); else ctx.lineTo(outerX, outerY);
                    const innerX = x + Math.cos(angle + (j * Math.PI * 2 / 5) + Math.PI / 5) * starSize * 0.5;
                    const innerY = y + Math.sin(angle + (j * Math.PI * 2 / 5) + Math.PI / 5) * starSize * 0.5;
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore(); // Restore composite operation and other states
    }
}
