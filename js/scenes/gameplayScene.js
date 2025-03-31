import { Scene } from '../core/scene.js';
import * as C from '../config.js';
// Import specific prototypes needed for spawning
import { BAT_PROTOTYPE, GROUND_PATROLLER_PROTOTYPE } from '../config.js';
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
        console.log(`Current game mode: ${this.gameMode}`); // Add this log to verify mode
        
        try {
            console.log("Initializing level generator...");
            this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            console.log("Level generator created successfully");

            console.log("Initializing effects system...");
            this.effectsSystem = createEffectsSystem();
            console.log("Effects system created successfully");

            // Improved event handler binding
            this.handleKeyDown = (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
                    e.preventDefault();
                }
                this.keysPressed[e.key.toLowerCase()] = true;

                // Removed 't' and 'F9' toggles from here, handled in Game.js or the standalone handleKeyDown
            };

            this.handleKeyUp = (e) => {
                this.keysPressed[e.key.toLowerCase()] = false;
            };

            // Add input listeners
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keyup', this.handleKeyUp);
            console.log("Input listeners added.");

            // resetLevel is now called within onEnter, using the gameMode set by init()
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

            // --- Noclip Movement (Developer Mode) ---
            if (this.game && this.game.developerModeEnabled && player.noclipActive) {
                const noclipSpeed = 15; // Adjust speed as needed
                player.velocityY = 0; // Ignore gravity
                player.velocityX = 0; // Base horizontal speed is 0 unless keys pressed

                if (this.keysPressed['arrowup'] || this.keysPressed['w']) {
                    player.y -= noclipSpeed * deltaTime * 60;
                }
                // Add missing noclip horizontal movement keys here
                if (this.keysPressed['arrowdown'] || this.keysPressed['s']) {
                     player.y += noclipSpeed * deltaTime * 60;
                }
                 if (this.keysPressed['arrowleft'] || this.keysPressed['a']) {
                     player.x -= noclipSpeed * deltaTime * 60;
                     player.facingDirection = 'left';
                 }
                if (this.keysPressed['arrowright'] || this.keysPressed['d']) {
                    player.x += noclipSpeed * deltaTime * 60;
                    player.facingDirection = 'right';
                }
                // Skip normal physics and collision update in noclip
                this.updateAnimationState(); // Still update animation state if needed

            } else { // End of noclip block, start of normal physics
                // --- Normal Physics and Movement ---
                let onGround = player.onGround; // Use current ground status for logic

                // --- Horizontal Movement ---
            const targetAcceleration = onGround ? C.GROUND_ACCELERATION : C.AIR_ACCELERATION;
            const targetMaxSpeed = onGround ? C.GROUND_MAX_SPEED : C.AIR_MAX_SPEED;
            const targetFriction = onGround ? C.GROUND_FRICTION : C.AIR_FRICTION;

            let moveInput = 0;
            if (this.keysPressed['arrowleft'] || this.keysPressed['a']) {
                moveInput = -1;
                player.facingDirection = 'left';
            } else if (this.keysPressed['arrowright'] || this.keysPressed['d']) {
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
                if (this.gameMode === 'test') {
                    currentGravity *= C.TEST_MODE_GRAVITY_MULTIPLIER;
                }
            }
            player.velocityY += currentGravity * deltaTime * 60; // Scale gravity

            // Jumping
            if ((this.keysPressed['arrowup'] || this.keysPressed['w']) && onGround) { // Simple jump, no coyote time yet
                player.velocityY = -C.JUMP_STRENGTH;
                player.onGround = false; // Leave ground immediately
                onGround = false; // Update local variable
                player.animationState = 'jumping';
                if (this.game && this.game.audioCtx) {
                    this.game.triggerJumpSound(this.game.audioCtx.currentTime);
                }
            }

            // Flying (apply upward force if space is pressed and not on ground)
            if (this.keysPressed[' '] && !onGround) {
                let flyStrength = C.FLY_STRENGTH;
                if (this.gameMode === 'test') {
                    flyStrength *= C.TEST_MODE_FLY_STRENGTH_MULTIPLIER;
                }
                player.velocityY -= flyStrength * deltaTime * 60;
                const maxFlySpeed = this.gameMode === 'test' ? C.MAX_FLY_SPEED * C.TEST_MODE_MAX_FLY_SPEED_MULTIPLIER : C.MAX_FLY_SPEED;
                player.velocityY = Math.max(player.velocityY, -maxFlySpeed);
                player.animationState = 'jumping';

                // Corrected particle emission method
                if (this.effectsSystem && Math.random() < C.FLYING_PARTICLE_RATE) {
                    const centerX = player.x + player.width / 2;
                    const bottomY = player.y + player.height;
                    this.effectsSystem.emitPlayerTrail(
                        centerX, 
                        bottomY,
                        player.width,
                        player.height,
                        player.velocityX,
                        player.velocityY
                    );
                }
            }

            // Handle fireball attack
            if (this.keysPressed['1']) {
                const player = this.player;
                
                // In test mode, allow fireball attacks with reduced cooldown
                if (this.gameMode === 'test' || player.fireballCooldownTimer <= 0) {
                    // Cast a fireball
                    if (this.gameMode === 'test') {
                        // In test mode, reduce cooldown or instantly reset
                        player.fireballCooldownTimer = C.FIREBALL_COOLDOWN * 0.5; // 50% cooldown in test mode
                        
                        // Use the casting animation if it exists
                        if (player.animationState !== 'casting' && C.STICK_FIGURE.poses.casting) {
                            player.animationState = 'casting';
                            player.animationFrameIndex = 0;
                            player.animationTimer = 0;
                        }
                        
                        // Create and launch the fireball - assuming this function exists
                        this.launchFireball(player.x, player.y, player.width, player.height, player.facingDirection);
                        
                        // Optional: Add visual feedback for test mode fireballs
                        if (this.effectsSystem) {
                            // Add extra particles or effects for test mode
                            this.effectsSystem.emitParticles(
                                player.x + player.width / 2,
                                player.y + player.height / 2,
                                10, // more particles
                                C.FIREBALL_COLOR,
                                { speed: 100, lifespan: 0.8 }
                            );
                        }
                    } else if (player.fireballCooldownTimer <= 0) {
                        // Normal mode fireball code (presumably already implemented)
                        player.fireballCooldownTimer = C.FIREBALL_COOLDOWN;
                        this.launchFireball(player.x, player.y, player.width, player.height, player.facingDirection);
                    }
                }
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
                             collidedVertically = true; // Corrected from collidedHorizontally
                        }
                    }
                }
            });

            // Update player position
            player.x = nextX;
            player.y = nextY;

            // Update animation state (Moved inside normal physics block)
            this.updateAnimationState();

            // Prevent falling through floor (simple boundary) - Only apply if not in noclip
             if (player.y + player.height > C.CANVAS_HEIGHT) {
                 player.y = C.CANVAS_HEIGHT - player.height;
                 player.velocityY = 0;
                 player.onGround = true; // Consider canvas bottom as ground
                 if (player.animationState === 'jumping' || player.animationState === 'falling') {
                     player.animationState = 'idle';
                 }
             }

            // --- Animation Update --- (Moved inside normal physics block)
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

            } // End of normal physics block (else for noclip)

        } // End if(this.player)

        // Update effects and particles (Moved outside the player block)
        if (this.effectsSystem) { // Check if effects system exists
            this.effectsSystem.update(deltaTime);
        }

        // --- Enemy Update and Collision ---
        // TODO: Implement actual enemy update logic and collision checks here.
        // Collision checks should iterate through active enemies (e.g., bats, patrollers)
        // and check for overlap with the player using checkRectOverlap(this.player, enemy).
        // If a collision occurs, call this.handlePlayerDamage().
        /*
        Example structure:
        Object.values(this.enemies).flat().forEach(enemy => {
            // enemy.update(deltaTime, this.platforms, this.player); // Update enemy AI/movement
            if (checkRectOverlap(this.player, enemy)) {
                this.handlePlayerDamage(); // Call damage handler on collision
            }
        });
        */

        // Update camera position
        this.updateCamera();
    } // End of update method

    /**
     * Handles the consequences of the player taking damage (e.g., from enemy collision).
     * Checks for God Mode before applying effects.
     * This method should be called when a player-enemy collision is detected.
     */
    handlePlayerDamage() {
        if (!this.player) return;

        // --- God Mode Check ---
        // If player is invincible (God Mode enabled), ignore the damage.
        if (this.player.isInvincible) {
            console.log("Player hit detected, but God Mode is ON. Damage ignored.");
            // Optionally add a visual/audio cue for blocked damage
            // e.g., this.effectsSystem.emitShieldHit(this.player.x, this.player.y);
            return; // Exit without applying damage effects
        }
        // --- End God Mode Check ---

        // --- Original Damage Logic ---
        // If not in God Mode, proceed with normal damage consequences.
        // This might involve:
        // 1. Reducing lives: this.player.lives--; this.updateLivesDisplay();
        // 2. Checking for game over: if (this.player.lives <= 0) { /* trigger game over */ }
        // 3. Playing a hurt sound/animation.
        // 4. Applying temporary invulnerability after hit.
        // 5. Resetting the level or player position.

        // Placeholder: Log the hit and reset the level for now.
        // Replace this with the actual game's damage handling logic.
        console.log("Player hit! Applying damage consequences (currently resetting level).");
        this.resetLevel(); // Simple reset as placeholder
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
                 ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }
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
            });
        }

        // Render enemies (assuming sprite exists)
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

        // --- Developer Mode Rendering ---
        // Check the game instance for the developer mode flag
        if (this.game && this.game.developerModeEnabled) {
            this.renderDevInfo(ctx); // Call the dedicated dev info renderer
        }
        // --- End Developer Mode Rendering ---
    }; // End of render method (Added semicolon)

    /**
     * Renders developer mode information overlay.
     * Called only when developer mode is enabled via the Game instance.
     * @param {CanvasRenderingContext2D} ctx - The rendering context
     */
    renderDevInfo(ctx) {
        // This method is now called conditionally from render()
        // based on this.game.developerModeEnabled

        const boxX = 10;
        const boxY = 130; // Position below other UI elements
        const boxWidth = 280;
        const boxHeight = 220; // Increased height to fit new info
        const lineHeight = 18;
        const padding = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#00FF00'; // Green text for dev mode title
        ctx.font = 'bold 14px monospace'; // Bold title
        ctx.textAlign = 'left';

        let y = boxY + padding + lineHeight; // Start drawing inside the box

        // General Status
        ctx.fillText(`--- Developer Mode ON (~) ---`, boxX + padding, y);
        y += lineHeight * 1.5; // Extra space

        // Player Info
        if (this.player) {
            const p = this.player;
            ctx.font = '14px monospace'; // Reset font for details

            ctx.fillStyle = '#FFFFFF'; // White for player info
            ctx.fillText(`Player Pos: (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`Player Vel: (${p.velocityX.toFixed(1)}, ${p.velocityY.toFixed(1)})`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`State: ${p.animationState}, Ground: ${p.onGround}`, boxX + padding, y);
            y += lineHeight;

            // Cheat Status
            ctx.fillStyle = p.isInvincible ? '#FFFF00' : '#AAAAAA'; // Yellow if ON, Gray if OFF
            ctx.fillText(`God Mode (G): ${p.isInvincible ? 'ON' : 'OFF'}`, boxX + padding, y);
            y += lineHeight;

            ctx.fillStyle = p.noclipActive ? '#FFFF00' : '#AAAAAA'; // Yellow if ON, Gray if OFF
            ctx.fillText(`Noclip (N):   ${p.noclipActive ? 'ON' : 'OFF'}`, boxX + padding, y);
            y += lineHeight;
            ctx.fillStyle = '#CCCCCC'; // Light gray for other info
            ctx.fillText(`Spawn Bat (Shift+1)`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`Spawn Patroller (Shift+2)`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`Kill Enemies (K)`, boxX + padding, y);
            y += lineHeight;


        } else {
            ctx.fillStyle = '#FF5555'; // Red if player missing
            ctx.font = '14px monospace';
            ctx.fillText('Player object not found!', boxX + padding, y);
            y += lineHeight;
        }

        // Other Info
        ctx.fillStyle = '#CCCCCC'; // Light gray for other info
        ctx.font = '14px monospace';
        ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`Particles: ${this.effectsSystem?.getActiveCount() || 0}`, boxX + padding, y);
        y += lineHeight;

    }; // End of renderDevInfo method (Added semicolon)

    drawDesertDunesBackground(time, camX, ctx) {
        const canvas = ctx.canvas; // Get canvas reference inside the function
        ctx.save(); // Save the current canvas state

        // 1. Sky Gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.7, '#FFDAB9');
        skyGradient.addColorStop(1, '#FFA07A');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Optional Sun
        const sunX = canvas.width * 0.8 - camX * 0.02;
        const sunY = canvas.height * 0.15;
        const sunRadius = 40;
        ctx.fillStyle = 'rgba(255, 255, 224, 0.9)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        ctx.shadowBlur = 25;
        ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // 3. Dunes (Draw from back to front)
        const duneLayers = [
            {
                parallax: 0.05, // Reduced from ~0.08
                baseY: canvas.height * 0.65,
                amp1: 40, freq1: 0.003,
                amp2: 15, freq2: 0.007,
                hue: 40, sat: 45, lightBase: 55, lightRange: 10,
            },
            {
                parallax: 0.09, // Reduced from ~0.15
                baseY: canvas.height * 0.75,
                amp1: 60, freq1: 0.004,
                amp2: 25, freq2: 0.009,
                hue: 45, sat: 55, lightBase: 65, lightRange: 12,
            },
            {
                parallax: 0.18, // Reduced from ~0.30
                baseY: canvas.height * 0.85,
                amp1: 80, freq1: 0.005,
                amp2: 30, freq2: 0.012,
                hue: 50, sat: 65, lightBase: 70, lightRange: 15,
            }
        ];

        const segmentWidth = 5;

        duneLayers.forEach((layer, index) => {
            const scrollOffset = camX * layer.parallax;
            const timeFactor = time * 5 * (index * 0.5 + 1);

            const gradientYStart = layer.baseY - layer.amp1 - layer.amp2 - 20;
            const gradientYEnd = canvas.height;
            const duneGradient = ctx.createLinearGradient(0, gradientYStart, 0, gradientYEnd);

            const lightHighlight = Math.min(95, layer.lightBase + layer.lightRange);
            const lightShadow = Math.max(10, layer.lightBase - layer.lightRange);

            duneGradient.addColorStop(0, `hsl(${layer.hue}, ${layer.sat}%, ${lightHighlight}%)`);
            duneGradient.addColorStop(0.4, `hsl(${layer.hue}, ${layer.sat}%, ${layer.lightBase}%)`);
            duneGradient.addColorStop(0.8, `hsl(${layer.hue - 10}, ${layer.sat - 10}%, ${lightShadow}%)`);
            duneGradient.addColorStop(1, `hsl(${layer.hue - 15}, ${layer.sat - 15}%, ${lightShadow - 5}%)`);

            ctx.fillStyle = duneGradient;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width; x += segmentWidth) {
                const worldX = x + scrollOffset;
                const duneY = layer.baseY +
                              Math.sin(worldX * layer.freq1 + timeFactor + index * 1.5) * layer.amp1 +
                              Math.sin(worldX * layer.freq2 + timeFactor * 1.3 + index * 3.0) * layer.amp2;
                ctx.lineTo(x, Math.max(0, duneY));
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }; // End of drawDesertDunesBackground method (Added semicolon)

    resetLevel() {
        console.log(`resetLevel: START (Mode: ${this.gameMode})`);
        try {
            if (!this.levelGenerator) {
                 console.error("LevelGenerator not initialized before resetLevel!");
                 this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            }

            console.log("Calling levelGenerator.generateLevel()...");
            const levelData = this.levelGenerator.generateLevel({ gameMode: this.gameMode });
            console.log("Level generation complete.");

            console.log("Creating player...");
            this.player = deepCopy(C.INITIAL_PLAYER_STATE);
            this.player.x = levelData.startPlatform ?
                            levelData.startPlatform.x + (levelData.startPlatform.width / 2) - (this.player.width / 2)
                            : 100;
            this.player.y = levelData.startPlatform ?
                            levelData.startPlatform.y - this.player.height - 1
                            : C.CANVAS_HEIGHT - 100;
            console.log("Player created at:", this.player.x, this.player.y);

            if (this.gameMode === 'test') {
                console.log("Applying test mode modifications to player...");
                this.player.lives = 999;
                this.player.orbShieldCount = 3;
                console.log("Test Player State:", this.player);
            }

            this.platforms = levelData.platforms || [];
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] };
            console.log("Enemies cleared for this level.");
            this.collectibles = levelData.collectibles || [];
            this.goal = levelData.goal || { x: C.CHUNK_WIDTH * C.NUM_CHUNKS - 200, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = levelData.levelEndX || C.CHUNK_WIDTH * C.NUM_CHUNKS;
            console.log(`Level End X set to: ${this.levelEndX}`);

            this.camera = { x: 0, y: 0 };
            this.camera.x = Math.max(0, this.player.x - C.CANVAS_WIDTH / 3);
            this.camera.y = 0;
            console.log("Camera reset to:", this.camera.x, this.camera.y);

            this.gameWon = false;
            this.levelComplete = false;
            this.startTime = Date.now();
            this.levelTime = 0;

            if (this.effectsSystem && typeof this.effectsSystem.reset === 'function') {
                this.effectsSystem.reset();
            }

            console.log("resetLevel: COMPLETE");
        } catch (error) {
            console.error("ERROR in resetLevel:", error);
            this.platforms = [{x: 50, y: C.CANVAS_HEIGHT - 50, width: 400, height: 30, color: 'darkred'}];
            this.player = deepCopy(C.INITIAL_PLAYER_STATE);
            this.player.x = 100;
            this.player.y = C.CANVAS_HEIGHT - 100;
            this.camera = { x: 0, y: 0 };
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] };
            this.collectibles = [];
            this.goal = { x: 1000, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = 1200;
        }
    }; // End of resetLevel method (Added semicolon)

    updateCamera() {
        const targetX = this.player.x - C.CANVAS_WIDTH / 2;
        const maxX = this.levelEndX - C.CANVAS_WIDTH;
        this.camera.x += (Math.max(0, Math.min(maxX, targetX)) - this.camera.x) * 0.1;
    }; // End of updateCamera method (Added semicolon)

    renderUI(ctx) {
        if (this.gameWon) {
            ctx.fillStyle = C.WIN_TEXT_COLOR;
            ctx.font = C.WIN_TEXT_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2);
        }

        if (!this.player.onGround && this.keysPressed[' ']) {
            const flyingText = this.gameMode === 'test' ? "ENHANCED FLYING" : "FLYING";
            ctx.fillStyle = this.gameMode === 'test' ? '#FF9900' : '#FFFFFF';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(flyingText, C.CANVAS_WIDTH / 2, 50);
        }
    }; // End of renderUI method (Added semicolon)

    updateLivesDisplay() {
        const livesDisplay = document.getElementById('livesDisplay');
        if (livesDisplay && this.player) {
            livesDisplay.textContent = `Lives: ${this.player.lives}`;
        }
    }; // End of updateLivesDisplay method (Added semicolon)

    updateOrbShieldDisplay() {
        const orbShieldDisplay = document.getElementById('orbShieldDisplay');
        if (orbShieldDisplay && this.player) {
            orbShieldDisplay.textContent = `Shield: ${this.player.orbShieldCount}`;
        }
    }; // End of updateOrbShieldDisplay method (Added semicolon)

    handleReset() {
        if (this.gameWon) {
            this.currentLevel++;
            this.resetLevel();
        } else {
            this.resetLevel();
        }
    }; // End of handleReset method (Added semicolon)

    isGameplayActive() {
        return this.gameStarted && !this.gameWon && (this.player?.lives > 0);
    }; // End of isGameplayActive method (Added semicolon)

    onExit() {
        console.log("Exiting GameplayScene");
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        console.log("Input listeners removed.");
    }; // End of onExit method (Added semicolon)

    handleKeyDown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        this.keysPressed[e.key.toLowerCase()] = true;

        // Removed 't' and 'F9' toggles from here

        // --- Developer Mode Keybinds ---
        // Check the flag on the game instance
        if (this.game && this.game.developerModeEnabled) {
            if (e.key === 'g' && !e.repeat) {
                if (this.player) {
                    this.player.isInvincible = !this.player.isInvincible;
                    console.log(`God Mode: ${this.player.isInvincible ? 'ON' : 'OFF'}`);
                }
            }
            if (e.key === 'n' && !e.repeat) {
                if (this.player) {
                    this.player.noclipActive = !this.player.noclipActive;
                    console.log(`Noclip Mode: ${this.player.noclipActive ? 'ON' : 'OFF'}`);
                    // Reset velocity when toggling noclip to prevent sudden jumps/falls
                    if (this.player.noclipActive) {
                        this.player.velocityY = 0;
                        this.player.velocityX = 0; // Also reset horizontal velocity
                    }
                }
            }
            // Enemy Spawning
            if (e.shiftKey && e.key === '1' && !e.repeat) { // Shift + 1 for Bat
                if (this.player) {
                    this.devSpawnEnemy('bat', this.player.x + (this.player.facingDirection === 'right' ? 50 : -50), this.player.y);
                }
            }
            if (e.shiftKey && e.key === '2' && !e.repeat) { // Shift + 2 for Ground Patroller
                if (this.player) {
                    this.devSpawnEnemy('patroller', this.player.x + (this.player.facingDirection === 'right' ? 60 : -60), this.player.y);
                }
            }
            if (e.key === 'k' && !e.repeat) { // K key to kill enemies
                this.devKillAllEnemies();
            }
            if (e.key === '`' && !e.repeat) { // Backtick key to toggle developer mode
                if (this.game) {
                    this.game.developerModeEnabled = !this.game.developerModeEnabled;
                    console.log(`Developer Mode: ${this.game.developerModeEnabled ? 'ON' : 'OFF'}`);
                }
            }
            // Add more dev keys here (k, w, etc.) in later phases
        }
        // --- End Developer Mode Keybinds ---
    }; // End of handleKeyDown method (Added semicolon)

    handleKeyUp(e) {
        this.keysPressed[e.key.toLowerCase()] = false;
    }; // End of handleKeyUp method (Added semicolon)

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
            ctx.fillStyle = C.PLAYER_COLOR || 'blue';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            return;
        }

        const frameIndex = Math.floor(player.animationFrameIndex) % poseDataArr.length;
        const poseData = poseDataArr[frameIndex];

        if (!poseData) {
             console.error(`drawPlayer: Invalid frame index ${frameIndex} for state ${player.animationState}`);
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

        const getPos = (relativePos) => {
            if (!relativePos || !Array.isArray(relativePos)) return [anchorX, anchorY];
            return [anchorX + relativePos[0] * flip, anchorY + relativePos[1]];
        };

        const hipPos = getPos(poseData.hip);
        const shoulderPos = getPos(poseData.shoulder);
        const neckPos = getPos(poseData.neck);
        const headPos = getPos(poseData.head);

        ctx.beginPath();
        ctx.moveTo(hipPos[0], hipPos[1]);
        ctx.lineTo(shoulderPos[0], shoulderPos[1]);
        ctx.lineTo(neckPos[0], neckPos[1]);
        ctx.stroke();

        const drawLimb = (limbPoints) => {
            if (!limbPoints || !Array.isArray(limbPoints) || limbPoints.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(shoulderPos[0], shoulderPos[1]);
            for (let i = 0; i < limbPoints.length; i++) {
                const point = getPos(limbPoints[i]);
                ctx.lineTo(point[0], point[1]);
            }
            ctx.stroke();
        };
        drawLimb(poseData.armL);
        drawLimb(poseData.armR);

        const drawLeg = (legPoints) => {
             if (!legPoints || !Array.isArray(legPoints) || legPoints.length < 2) return;
             ctx.beginPath();
             ctx.moveTo(hipPos[0], hipPos[1]);
             for (let i = 0; i < legPoints.length; i++) {
                 const point = getPos(legPoints[i]);
                 ctx.lineTo(point[0], point[1]);
             }
             ctx.stroke();
         };
        drawLeg(poseData.legL);
        drawLeg(poseData.legR);

        ctx.beginPath();
        ctx.arc(headPos[0], headPos[1], stickFigure.headRadius || 5, 0, Math.PI * 2);
        ctx.fill();

        if (stickFigure.hat) {
            const hat = stickFigure.hat;
            
            // Add transparency to hat when facing left
            if (player.facingDirection === 'left') {
                ctx.globalAlpha = 0.6; // 60% opacity when facing left
            }
            
            const tip = getPos([poseData.head[0] + hat.tipOffset[0], poseData.head[1] + hat.tipOffset[1]]);
            const brimY = headPos[1] + hat.brimHeight / 2;
            const brimLeft = getPos([poseData.head[0] - hat.brimWidth / 2, poseData.head[1]]);
            const brimRight = getPos([poseData.head[0] + hat.brimWidth / 2, poseData.head[1]]);

            ctx.fillStyle = hat.color || '#6a0dad';
            ctx.beginPath();
            ctx.moveTo(tip[0], tip[1]);
            ctx.quadraticCurveTo(brimLeft[0], brimY - hat.brimHeight * 1.5, brimLeft[0], brimY);
            ctx.ellipse(headPos[0], brimY, hat.brimWidth / 2, hat.brimHeight / 2, 0, 0, Math.PI * 2);
            ctx.moveTo(tip[0], tip[1]);
            ctx.quadraticCurveTo(brimRight[0], brimY - hat.brimHeight * 1.5, brimRight[0], brimY);
            ctx.fill();
            
            // Restore normal opacity after drawing the hat
            if (player.facingDirection === 'left') {
                ctx.globalAlpha = 1.0;
            }
        }

        const handLPos = getPos(poseData.armL[poseData.armL.length - 1]);
        const handRPos = getPos(poseData.armR[poseData.armR.length - 1]);
        const drawStaff = stickFigure.staff && stickFigure.staff.hand !== 'right' && !player.isAttacking;

        if (drawStaff) {
            const staff = stickFigure.staff;
            const staffTop = [handLPos[0] + staff.topOffset[0] * flip, handLPos[1] + staff.topOffset[1]];
            const staffBottom = [staffTop[0], staffTop[1] + staff.length];

            ctx.strokeStyle = staff.color || '#8B4513';
            ctx.lineWidth = (stickFigure.lineWidth || 2) + 1;
            ctx.beginPath();
            ctx.moveTo(staffTop[0], staffTop[1]);
            ctx.lineTo(staffBottom[0], staffBottom[1]);
            ctx.stroke();

            ctx.fillStyle = staff.gemColor || '#FF4500';
            ctx.beginPath();
            ctx.arc(staffTop[0], staffTop[1], staff.gemRadius || 4, 0, Math.PI * 2);
            ctx.fill();
        }

        const drawSword = false; // Changed from (stickFigure.sword && (stickFigure.staff?.hand !== 'right' || player.isAttacking));

        if (drawSword) {
            // Existing sword drawing code will be skipped
        }

        ctx.restore();
    }; // End of drawPlayer method (Added semicolon)

    drawMagicCarpet(player, time, ctx) {
        const anchorX = player.x + player.width / 2;
        const anchorY = player.y + player.height + (C.CARPET_OFFSET_Y || 5);

        const waveSpeed = C.CARPET_WAVE_SPEED || 8;
        const waveAmpX = C.CARPET_WAVE_AMP_X || 0.08;
        const waveAmpY = C.CARPET_WAVE_AMP_Y || 0.15;
        let baseWidth = C.CARPET_WIDTH || 110;
        let baseHeight = C.CARPET_HEIGHT || 10;

        const waveX1 = Math.sin(time * waveSpeed) * waveAmpX;
        const waveX2 = Math.sin(time * waveSpeed * 0.6 + 1) * waveAmpX * 0.5;
        const waveY1 = Math.cos(time * waveSpeed * 0.7) * waveAmpY;
        const waveY2 = Math.cos(time * waveSpeed * 0.4 + 2) * waveAmpY * 0.6;

        const currentWidth = baseWidth * (1 + waveX1 + waveX2);
        let currentHeight = baseHeight * (1 - (waveY1 + waveY2) * 0.5);
        let carpetX = anchorX - currentWidth / 2;
        let carpetY = anchorY - currentHeight / 2;

        // Validate all values to ensure they're finite
        carpetX = isFinite(carpetX) ? carpetX : 0;
        carpetY = isFinite(carpetY) ? carpetY : 0;
        currentHeight = isFinite(currentHeight) ? currentHeight : 10;

        this.drawCarpetTrail(carpetX + currentWidth / 2, carpetY + currentHeight / 2, player.velocityX, player.velocityY, time, ctx);

        ctx.save();

        // Add extra safety checks for gameMode
        const isTestMode = this.gameMode === 'test';
        console.log(`Drawing carpet in ${isTestMode ? 'test' : 'normal'} mode`);
        
        if (isTestMode) {
            baseWidth *= 1.2;
            baseHeight *= 1.2;
            ctx.shadowColor = C.CARPET_COLOR_1 || 'rgba(160, 96, 255, 0.8)';
            ctx.shadowBlur = 18; // Increased from 15
        } else {
            ctx.shadowColor = C.CARPET_COLOR_1 || 'rgba(160, 96, 255, 0.5)';
            ctx.shadowBlur = 12; // Increased from 8
        }

        const carpetGradient = ctx.createLinearGradient(carpetX, carpetY, carpetX, carpetY + currentHeight);
        carpetGradient.addColorStop(0, C.CARPET_COLOR_1 || '#a060ff');
        carpetGradient.addColorStop(1, C.CARPET_COLOR_2 || '#d0a0ff');
        ctx.fillStyle = carpetGradient;

        const segments = 10;
        ctx.beginPath();
        ctx.moveTo(carpetX, carpetY);

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const px = carpetX + currentWidth * t;
            const pyOffset = Math.sin(time * waveSpeed * 1.5 + t * Math.PI * 2) * currentHeight * 0.2;
            ctx.lineTo(px, carpetY + pyOffset);
        }

        ctx.quadraticCurveTo(carpetX + currentWidth + currentHeight * 0.3, carpetY + currentHeight / 2, carpetX + currentWidth, carpetY + currentHeight);

        for (let i = segments; i >= 1; i--) {
            const t = i / segments;
            const px = carpetX + currentWidth * t;
            const pyOffset = Math.sin(time * waveSpeed * 1.5 + t * Math.PI * 2 + Math.PI) * currentHeight * 0.2;
            ctx.lineTo(px, carpetY + currentHeight + pyOffset);
        }

        ctx.quadraticCurveTo(carpetX - currentHeight * 0.3, carpetY + currentHeight / 2, carpetX, carpetY);

        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'transparent';

        ctx.fillStyle = C.CARPET_COLOR_2 || '#d0a0ff';
        const centerX = carpetX + currentWidth / 2;
        const centerY = carpetY + currentHeight / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - currentHeight * 0.3);
        ctx.lineTo(centerX + currentWidth * 0.1, centerY);
        ctx.lineTo(centerX, centerY + currentHeight * 0.3);
        ctx.lineTo(centerX - currentWidth * 0.1, centerY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX - currentWidth * 0.3, centerY, currentHeight * 0.2, 0, Math.PI * 2);
        ctx.arc(centerX + currentWidth * 0.3, centerY, currentHeight * 0.2, 0, Math.PI * 2);
        ctx.fill();

        const numTassels = 7; // Increased from 5
        const tasselLength = currentHeight * 1.8; // Increased from 1.5
        const beadRadius = 3;
        ctx.strokeStyle = C.CARPET_COLOR_2 || '#d0a0ff';
        ctx.fillStyle = C.CARPET_COLOR_1 || '#a060ff';
        ctx.lineWidth = 2;

        for (let i = 0; i < numTassels; i++) {
            const startX = carpetX + (currentWidth / (numTassels + 1)) * (i + 1);
            const startY = carpetY + currentHeight;
            const endY = startY + tasselLength;
            const controlXOffset = Math.sin(time * waveSpeed * 2 + i * 0.5) * 15;
            const controlYOffset = Math.cos(time * waveSpeed * 1.2 + i * 0.8) * 10;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(
                startX + controlXOffset / 2, startY + tasselLength / 3 + controlYOffset,
                startX - controlXOffset / 2, startY + tasselLength * 2 / 3 - controlYOffset,
                startX + Math.sin(time * waveSpeed * 2.5 + i) * 5, endY
            );
            ctx.stroke();

            const beadX = startX + Math.sin(time * waveSpeed * 2.5 + i) * 5;
            ctx.beginPath();
            ctx.arc(beadX, endY, beadRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }; // End of drawMagicCarpet method (Added semicolon)

    drawCarpetTrail(carpetCenterX, carpetCenterY, velocityX, velocityY, time, ctx) {
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const minSpeedThreshold = 5;
        if (speed < minSpeedThreshold) return;

        ctx.save();
        const particleCount = Math.min(15, Math.floor(3 + speed * 0.2));
        const trailLength = 50 + speed * 0.5;

        const dirX = -velocityX / speed;
        const dirY = -velocityY / speed;

        const trailStartX = carpetCenterX + dirX * (C.CARPET_WIDTH || 110) * 0.3;
        const trailStartY = carpetCenterY + dirY * (C.CARPET_HEIGHT || 10) * 0.3;

        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < particleCount; i++) {
            const trailProgress = i / (particleCount - 1);

            const baseX = trailStartX + dirX * trailLength * trailProgress;
            const baseY = trailStartY + dirY * trailLength * trailProgress;

            const perpendicularAngle = Math.atan2(dirY, dirX) + Math.PI / 2;
            const waveOffsetMagnitude = Math.sin(time * 10 + trailProgress * Math.PI * 3) * 15 * (1 - trailProgress);
            const offsetX = Math.cos(perpendicularAngle) * waveOffsetMagnitude;
            const offsetY = Math.sin(perpendicularAngle) * waveOffsetMagnitude;

            const x = baseX + offsetX;
            const y = baseY + offsetY;

            const baseSize = 1 + 5 * (1 - trailProgress);
            const sizePulse = Math.sin(time * 15 + i * 0.5) * 0.5 + 0.5;
            const size = baseSize * (0.5 + sizePulse * 0.5);

            const alpha = 0.6 * (1 - trailProgress) * (0.5 + sizePulse * 0.5);

            const hue = (180 + time * 30 + trailProgress * 60) % 360;
            const saturation = 80 + 20 * sizePulse;
            const lightness = 60 + 15 * sizePulse;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

            ctx.beginPath();
            ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
            ctx.fill();

            if (Math.random() < 0.15 && trailProgress > 0.3) {
                const starSize = size * 0.8;
                const angle = time * 5 + i * 1.5;
                ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.8})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
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
        ctx.restore();
    }; // End of drawCarpetTrail method (Added semicolon)

    /**
     * Centralizes animation state transitions for the player
     * to avoid scattered animation state changes
     */
    updateAnimationState() {
        if (!this.player) return;
        
        const player = this.player;
        
        // Landing transition
        if ((player.animationState === 'jumping' || player.animationState === 'falling') && player.onGround) {
            player.animationState = 'idle';
        }
        
        // Running transition
        if (player.onGround && Math.abs(player.velocityX) > 0.5) {
            player.animationState = 'running';
        }
        
        // Idle transition
        if (player.onGround && Math.abs(player.velocityX) < 0.1) {
            player.animationState = 'idle';
        }
        
        // Falling transition
        if (!player.onGround && player.velocityY > 0 && !this.keysPressed[' ']) {
            player.animationState = 'falling';
        }
    }; // End of updateAnimationState method (Added semicolon)

    /**
     * Optional hook called by Game.js when developer mode is toggled.
     * @param {boolean} isEnabled - The new state of developer mode.
     */
    onDeveloperModeToggle(isEnabled) {
        console.log(`GameplayScene notified: Developer Mode ${isEnabled ? 'Enabled' : 'Disabled'}`);
        // Add any scene-specific UI updates or logic needed here
        // For example, show/hide a debug menu element
    }

    /**
     * Renders developer mode information overlay.
     * Called only when developer mode is enabled via the Game instance.
     * @param {CanvasRenderingContext2D} ctx - The rendering context
     */
    renderDevInfo(ctx) {
        // This method is now called conditionally from render()
        // based on this.game.developerModeEnabled

        const boxX = 10;
        const boxY = 130; // Position below other UI elements
        const boxWidth = 280;
        const boxHeight = 180;
        const lineHeight = 18;
        const padding = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#00FF00'; // Green text for dev mode title
        ctx.font = 'bold 14px monospace'; // Bold title
        ctx.textAlign = 'left';

        let y = boxY + padding + lineHeight; // Start drawing inside the box

        // General Status
        ctx.fillText(`--- Developer Mode ON (~) ---`, boxX + padding, y);
        y += lineHeight * 1.5; // Extra space

        // Player Info
        if (this.player) {
            const p = this.player;
            ctx.font = '14px monospace'; // Reset font for details

            ctx.fillStyle = '#FFFFFF'; // White for player info
            ctx.fillText(`Player Pos: (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`Player Vel: (${p.velocityX.toFixed(1)}, ${p.velocityY.toFixed(1)})`, boxX + padding, y);
            y += lineHeight;
            ctx.fillText(`State: ${p.animationState}, Ground: ${p.onGround}`, boxX + padding, y);
            y += lineHeight;

            // Cheat Status
            ctx.fillStyle = p.isInvincible ? '#FFFF00' : '#AAAAAA'; // Yellow if ON, Gray if OFF
            ctx.fillText(`God Mode (G): ${p.isInvincible ? 'ON' : 'OFF'}`, boxX + padding, y);
            y += lineHeight;

            ctx.fillStyle = p.noclipActive ? '#FFFF00' : '#AAAAAA'; // Yellow if ON, Gray if OFF
            ctx.fillText(`Noclip (N):   ${p.noclipActive ? 'ON' : 'OFF'}`, boxX + padding, y);
            y += lineHeight;

        } else {
            ctx.fillStyle = '#FF5555'; // Red if player missing
            ctx.font = '14px monospace';
            ctx.fillText('Player object not found!', boxX + padding, y);
            y += lineHeight;
        }

        // Other Info
        ctx.fillStyle = '#CCCCCC'; // Light gray for other info
        ctx.font = '14px monospace';
        ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`Particles: ${this.effectsSystem?.getActiveCount() || 0}`, boxX + padding, y);
        y += lineHeight;

        // Add keybind list to the dev info
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(`--- Keybinds ---`, boxX + padding, y);
        y += lineHeight * 1.5;
        ctx.fillText(`G: God Mode (${this.player?.isInvincible ? 'ON' : 'OFF'})`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`N: Noclip (${this.player?.noclipActive ? 'ON' : 'OFF'})`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`K: Kill Enemies`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`Shift+1: Spawn Bat`, boxX + padding, y);
        y += lineHeight;
        ctx.fillText(`Shift+2: Spawn Patroller`, boxX + padding, y);
        y += lineHeight;


    }; // End of renderDevInfo method (Added semicolon)

    /**
     * Toggles God Mode (invincibility) for the player.
     * Called by Game.js input handler when 'G' is pressed in dev mode.
     */
    devToggleGodMode() {
        if (this.player) {
            this.player.isInvincible = !this.player.isInvincible;
            console.log(`DEV: God Mode ${this.player.isInvincible ? 'Enabled' : 'Disabled'}`);
        } else {
            console.warn("DEV: Cannot toggle God Mode, player not found.");
        }
    }

    /**
     * Toggles Noclip mode for the player.
     * Called by Game.js input handler when 'N' is pressed in dev mode.
     */
    devToggleNoclip() {
        if (this.player) {
            this.player.noclipActive = !this.player.noclipActive;
            console.log(`DEV: Noclip Mode ${this.player.noclipActive ? 'Enabled' : 'Disabled'}`);
            // Reset velocity when toggling noclip to prevent sudden jumps/falls
            if (this.player.noclipActive) {
                this.player.velocityY = 0;
                this.player.velocityX = 0;
            }
            // Ensure player is not stuck in ground state if noclip is activated
            // Might need to adjust player.onGround = false here if issues arise
        } else {
            console.warn("DEV: Cannot toggle Noclip, player not found.");
        }
    }


    /**
     * Spawns a specified enemy type near the player.
     * Called by Game.js input handler when Shift+1/2 etc. are pressed in dev mode.
     * @param {string} enemyType - The type of enemy ('bat', 'patroller', etc.) passed from Game.js.
     */
    devSpawnEnemy(enemyType) { // Removed x, y parameters
        if (!this.enemies) {
            console.error("DEV: Enemy lists not initialized!");
            return;
        }
        if (!this.player) {
            console.warn("DEV: Cannot spawn enemy, player not found.");
            return; // Or spawn at a default location
        }

        // Determine spawn location relative to player
        const spawnX = this.player.x + (this.player.facingDirection === 'right' ? 60 : -60);
        const spawnY = this.player.y; // Spawn at player's Y level

        let newEnemy;
        let targetArray;
        let x = spawnX; // Use calculated spawnX for logic below
        let y = spawnY; // Use calculated spawnY for logic below

        switch (enemyType.toLowerCase()) {
            case 'bat':
                newEnemy = deepCopy(BAT_PROTOTYPE);
                targetArray = this.enemies.bats;
                if (!targetArray) {
                    this.enemies.bats = [];
                    targetArray = this.enemies.bats;
                }
                // Set origin for bat AI
                newEnemy.originX = x;
                newEnemy.originY = y;
                break;
            case 'patroller':
            case 'groundpatroller':
                newEnemy = deepCopy(GROUND_PATROLLER_PROTOTYPE);
                targetArray = this.enemies.groundPatrollers;
                 if (!targetArray) {
                     this.enemies.groundPatrollers = [];
                     targetArray = this.enemies.groundPatrollers;
                 }
                 // Try to find a platform below the spawn point for the patroller
                 let foundPlatform = null;
                 let checkY = y + newEnemy.height; // Start check below the intended spawn
                 for (const plat of this.platforms) {
                     if (x + newEnemy.width > plat.x && x < plat.x + plat.width && checkY >= plat.y && checkY < plat.y + 50) { // Check within 50px below
                         foundPlatform = plat;
                         break;
                     }
                 }
                 if (foundPlatform) {
                     y = foundPlatform.y - newEnemy.height; // Place on top of platform
                     newEnemy.onPlatform = foundPlatform; // Assign platform reference
                 } else {
                     console.warn("Could not find suitable platform for Ground Patroller spawn.");
                     // Spawn anyway, might fall
                 }
                break;
            // Add cases for 'snake', 'giantbatboss' later
            default:
                console.warn(`devSpawnEnemy: Unknown enemy type "${enemyType}"`);
                return;
        }

        if (newEnemy && targetArray) {
            newEnemy.x = x;
            newEnemy.y = y;
            targetArray.push(newEnemy);
            console.log(`Spawned ${enemyType} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        }
    }; // End of devSpawnEnemy method (Added semicolon)

    /**
     * Removes all enemies currently in the scene.
     * Used by developer mode keybinds.
     */
    devKillAllEnemies() {
        if (!this.enemies) {
            console.warn("devKillAllEnemies: Enemy lists not initialized!");
            return;
        }
        // Clear all enemy type arrays
        Object.keys(this.enemies).forEach(key => {
            if (Array.isArray(this.enemies[key])) {
                this.enemies[key] = [];
            }
        });
        console.log("All enemies removed via dev command.");
    }; // End of devKillAllEnemies method (Added semicolon)
} // End of GameplayScene class
