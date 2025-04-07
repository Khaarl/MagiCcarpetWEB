import { Scene } from '../core/scene.js';
import * as C from '../config.js';
// Import specific prototypes needed for spawning
import { BAT_PROTOTYPE, GROUND_PATROLLER_PROTOTYPE } from '../config.js';
import { getRandom, getRandomInt, checkRectOverlap, deepCopy } from '../utils.js';
import { LevelGenerator } from '../level/levelGenerator.js';
import { createEffectsSystem } from '../core/effects.js';
import { PowerUpSystem } from '../core/powerup.js';
import Logger from '../utils/logger.js'; // Add Logger import

/* GameplayScene class (most game logic & drawing) */

export class GameplayScene extends Scene {
    constructor() {
        super();
        Logger.log('scene', "GameplayScene constructor called");
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
        this.fireballs = []; // Initialize fireballs array
        this.testParticles = null; // Initialize testParticles array
        this.lastSpaceState = false; // Track space key state for particles
        this.lastEState = false; // Track E key state for particles
    }

    /**
     * Initializes the scene with options, called after the scene is set in main.js.
     * @param {object} options - Initialization options.
     * @param {boolean} [options.isTestMode=false] - Whether to start in test mode.
     * @param {string} [options.testMode=null] - Specific test mode scenario (e.g., 'physics', 'combat').
     */
    init(options = {}) {
        this.gameMode = options.isTestMode ? 'test' : 'normal';
        this.testMode = options.testMode || null; // Store specific test mode if provided
        Logger.log('scene', `GameplayScene initialized with mode: ${this.gameMode}, testMode: ${this.testMode}`);
        // Note: onEnter will be called by the SceneManager *after* this init.
    }

    toggleGameMode() {
        this.gameMode = this.gameMode === 'normal' ? 'test' : 'normal';
        Logger.log('scene', `Game mode switched to: ${this.gameMode}`);
        this.resetLevel();
    }

    onEnter() {
        Logger.log('scene', "==== GameplayScene.onEnter: START ====");
        Logger.log('scene', `Current game mode: ${this.gameMode}`); // Add this log to verify mode
        
        try {
            Logger.log('scene', "Initializing level generator...");
            this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            Logger.log('scene', "Level generator created successfully");

            Logger.log('scene', "Initializing effects system...");
            this.effectsSystem = createEffectsSystem();
            Logger.log('scene', "Effects system created successfully");

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
            Logger.log('scene', "Input listeners added.");

            // resetLevel is now called within onEnter, using the gameMode set by init()
            Logger.log('scene', `Calling resetLevel for mode: ${this.gameMode}...`);
            this.resetLevel(); // resetLevel uses this.gameMode internally
            Logger.log('scene', "resetLevel completed successfully");

            Logger.log('scene', "Updating UI elements...");
            this.updateHpDisplay(); // Changed from updateLivesDisplay
            this.updateOrbShieldDisplay();
            document.getElementById('timer').textContent = "0.00";
            Logger.log('scene', "UI updated successfully");
            
            if (this.game) {
                document.addEventListener('keydown', (e) => {
                    if (e.key.toLowerCase() === 't' && !e.repeat) {
                        this.toggleGameMode();
                    }
                });
            }

            this.gameStarted = true;
            Logger.log('scene', "==== GameplayScene.onEnter: COMPLETE ====");
        } catch (error) {
            Logger.error('scene', "ERROR in GameplayScene.onEnter:", error);
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
        Logger.log('gameLoop', "GameplayScene.update called with deltaTime:", deltaTime);
        if (!this.gameStarted || this.gameWon) {
            Logger.log('gameLoop', "GameplayScene.update: Skipping update due to game state");
            return;
        }
        
        // Update level timer
        this.levelTime = (Date.now() - this.startTime) / 1000;
        document.getElementById('timer').textContent = this.levelTime.toFixed(2);
        
        // --- Player Physics and Movement ---
        if (this.player) {
            let player = this.player;

            // Decrement invulnerability timer
            if (player.invulnerabilityTimer > 0) {
                player.invulnerabilityTimer -= deltaTime;
            }

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

        // --- Fireball Update & Collision ---
        this.fireballs.forEach(fb => {
            if (fb.active) {
                fb.x += fb.vx * deltaTime;
                fb.y += fb.vy * deltaTime;
                fb.life -= deltaTime;
                if (fb.life <= 0) {
                    fb.active = false;
                    // Optional: Fizzle effect
                    if (this.effectsSystem) {
                        this.effectsSystem.emitParticles(fb.x, fb.y, 5, '#AAAAAA', { speed: 20, lifespan: 0.3 });
                    }
                }
                // TODO: Add collision with platforms for fireballs?
            }
        });
        // Remove inactive fireballs
        this.fireballs = this.fireballs.filter(fb => fb.active);


        // --- Enemy Update and Collision ---
        if (this.player && this.enemies) { // Ensure player and enemies exist
            const enemyTypes = Object.keys(this.enemies);
            enemyTypes.forEach(type => {
                if (Array.isArray(this.enemies[type])) {
                    // Iterate backwards for safe removal
                    for (let i = this.enemies[type].length - 1; i >= 0; i--) {
                        const enemy = this.enemies[type][i];

                        // --- Enemy AI/Movement Update (Placeholder) ---
                        // TODO: Implement specific AI for each enemy type (bat flight, patroller movement)
                        // enemy.update(deltaTime, this.platforms, this.player);

                        // --- Player Collision Check ---
                        const playerRect = { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height };
                        const enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                        if (checkRectOverlap(playerRect, enemyRect)) {
                            this.handlePlayerDamage(); // Player takes damage on collision
                            // Optional: Add knockback to player or enemy here
                        }

                        // --- Fireball Collision Check ---
                        for (let j = this.fireballs.length - 1; j >= 0; j--) {
                            const fb = this.fireballs[j];
                            if (!fb.active) continue; // Skip inactive fireballs

                            // Simple circle-rect collision for fireball vs enemy
                            const closestX = Math.max(enemy.x, Math.min(fb.x, enemy.x + enemy.width));
                            const closestY = Math.max(enemy.y, Math.min(fb.y, enemy.y + enemy.height));
                            const distanceX = fb.x - closestX;
                            const distanceY = fb.y - closestY;
                            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

                            if (distanceSquared < (fb.radius * fb.radius)) {
                                // Hit detected!
                                Logger.log('combat', `${enemy.type} hit by fireball!`);
                                enemy.hp -= C.FIREBALL_DAMAGE;
                                fb.active = false; // Deactivate fireball

                                // Trigger explosion effect
                                if (this.effectsSystem) {
                                    this.effectsSystem.emitParticles(
                                        fb.x, fb.y,
                                        C.FIREBALL_EXPLOSION_PARTICLES,
                                        C.FIREBALL_EXPLOSION_COLOR,
                                        { speed: 80, lifespan: 0.6, gravity: true }
                                    );
                                }
                                // TODO: Play explosion sound

                                // Check if enemy is defeated
                                if (enemy.hp <= 0) {
                                    Logger.log('combat', `${enemy.type} defeated!`);
                                    // Remove enemy from the array
                                    this.enemies[type].splice(i, 1);
                                    // TODO: Add score, drop loot, play death sound/effect
                                    if (this.effectsSystem) {
                                        this.effectsSystem.emitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, 'grey', { speed: 50, lifespan: 0.8 });
                                    }
                                    break; // Stop checking fireballs for this defeated enemy
                                } else {
                                    // Optional: Add hit flash effect to enemy
                                }
                                // Since fireball hit, stop checking this fireball against other enemies (it's gone)
                                // Note: We are already iterating backwards on fireballs, so splicing is safe.
                                this.fireballs.splice(j, 1);
                            }
                        } // End fireball loop
                    } // End enemy loop (iterating backwards)
                } // End if isArray
            }); // End enemyTypes loop
        } // End if player && enemies

        // Update camera position
        this.updateCamera();

        // Update test particles if in particles test mode
        if (this.testMode === 'particles' && this.testParticles) {
            this.updateTestParticles(deltaTime);
            if (this.keysPressed[' '] && !this.lastSpaceState) {
                this.createExplosionParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            }
            this.lastSpaceState = this.keysPressed[' '];
            if (this.keysPressed['e'] && !this.lastEState) {
                this.createCollectionParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            }
            this.lastEState = this.keysPressed['e'];
        }
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
            Logger.log('combat', "Player hit detected, but God Mode is ON. Damage ignored.");
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
        // If player is currently invulnerable, ignore damage
        if (this.player.invulnerabilityTimer > 0) {
            Logger.log('combat', "Player hit, but invulnerable.");
            return;
        }

        // Apply damage
        this.player.hp -= C.ENEMY_CONTACT_DAMAGE;
        Logger.log('combat', `Player hit! HP reduced to ${this.player.hp}`);

        // Set invulnerability timer
        this.player.invulnerabilityTimer = C.INVULNERABILITY_DURATION;

        // Trigger screen flash
        if (this.effectsSystem) {
            this.effectsSystem.triggerScreenFlash(C.SCREEN_FLASH_COLOR_DAMAGE, C.SCREEN_FLASH_DURATION);
        }

        // TODO: Play hurt sound

        // Check for game over
        if (this.player.hp <= 0) {
            this.player.hp = 0; // Ensure HP doesn't go negative
            Logger.log('combat', "Player HP depleted! Game Over.");
            // TODO: Implement proper game over sequence (e.g., switch to a GameOverScene)
            this.resetLevel(); // Reset level for now
        }

        // Update HP display
        this.updateHpDisplay();
    }

    render(ctx) {
        // --- Background Rendering ---
        const time = this.levelTime || 0; // Get current time for animations
        const camX = this.camera.x;      // Get current camera X for parallax
        const canvas = ctx.canvas;       // Get canvas reference

        if (this.levelData && this.levelData.hasCustomBackground && this.levelData.drawBackground) {
            this.levelData.drawBackground(ctx);
        } else {
            this.drawDesertDunesBackground(this.levelTime, this.camera.x, ctx);
        }

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

        // Render Fireballs
        this.fireballs.forEach(fb => {
            if (fb.active) {
                ctx.fillStyle = C.FIREBALL_COLOR;
                ctx.beginPath();
                ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
                ctx.fill();
                // Optional: Add glow
                ctx.shadowColor = C.FIREBALL_COLOR;
                ctx.shadowBlur = 8;
                ctx.fill(); // Fill again to apply shadow
                ctx.shadowColor = 'transparent';
            }
        });

        // Render effects and particles (after player/carpet)
        if (this.effectsSystem) {
            this.effectsSystem.render(ctx);
        }

        // Render test particles if in particles test mode
        if (this.testMode === 'particles' && this.testParticles && this.testParticles.length > 0) {
            this.drawTestParticles(ctx);
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

        // Add particle test mode info
        if (this.testMode === 'particles') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 400, 100);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('Particle Effects Test Mode', 20, 30);
            ctx.fillText('Space: Create explosion particles', 20, 55);
            ctx.fillText('E: Create collection particles', 20, 80);
            ctx.fillText(`Active Particles: ${this.testParticles ? this.testParticles.length : 0}`, 250, 30);
        }
    }; // End of renderDevInfo method (Added semicolon)

    drawStaticStarryBackground(ctx) {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, C.CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#000428');
        bgGradient.addColorStop(1, '#004e92');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        const starSeed = 12345;
        let rand = (max) => {
            starSeed = (starSeed * 9301 + 49297) % 233280;
            return (starSeed / 233280) * max;
        };

        for (let i = 0; i < 200; i++) {
            const x = rand(C.CANVAS_WIDTH);
            const y = rand(C.CANVAS_HEIGHT * 0.7);
            const size = rand(3) + 0.5;
            const alpha = 0.5 + rand(0.5);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (let i = 0; i < 5; i++) {
            const x = rand(C.CANVAS_WIDTH);
            const y = rand(C.CANVAS_HEIGHT * 0.5);
            const radius = 50 + rand(100);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${50 + rand(100)}, ${50 + rand(50)}, ${150 + rand(100)}, 0.2)`);
            gradient.addColorStop(1, 'rgba(0, 0, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }; // End of drawStaticStarryBackground method (Added semicolon)

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
        Logger.log('scene', `resetLevel: START (Mode: ${this.gameMode})`);
        try {
            if (!this.levelGenerator) {
                 Logger.error('scene', "LevelGenerator not initialized before resetLevel!");
                 this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            }

            Logger.log('scene', "Calling levelGenerator.generateLevel()...");
            const levelOptions = { gameMode: this.gameMode };
            if (this.testMode === 'physics') {
                levelOptions.scenario = 'physicsTest';
                Logger.log('scene', "Physics test scenario selected for level generation.");
            } else if (this.testMode === 'combat') {
                levelOptions.scenario = 'combatTest';
                Logger.log('scene', "Combat test scenario selected for level generation.");
            } else if (this.testMode === 'levelgen') {
                levelOptions.scenario = 'emptyLevel';
                Logger.log('scene', "Level Generator test scenario selected - creating test cube environment.");
                // After level generation, we'll manually set up a test cube environment
                const levelData = this.levelGenerator.generateLevel(levelOptions);
                Logger.log('scene', "Empty level generated, now adding test cube platforms...");
                
                // Create a test cube environment with platforms on all sides
                const margin = 100; // Space from canvas edges
                const width = C.CANVAS_WIDTH - (margin * 2);
                const height = C.CANVAS_HEIGHT - (margin * 2);
                
                // Clear any existing platforms from the empty level
                levelData.platforms = [];
                
                // Add platform floors and walls to create a cube environment
                levelData.platforms = [
                    // Bottom floor
                    { x: margin, y: C.CANVAS_HEIGHT - margin, width: width, height: 20, color: '#8B4513' },
                    // Left wall
                    { x: margin, y: margin, width: 20, height: height, color: '#8B4513' },
                    // Right wall
                    { x: C.CANVAS_WIDTH - margin - 20, y: margin, width: 20, height: height, color: '#8B4513' },
                    // Top ceiling
                    { x: margin, y: margin, width: width, height: 20, color: '#8B4513' },
                    // Optional middle platform for testing
                    { x: margin + width/4, y: C.CANVAS_HEIGHT - margin - height/2, width: width/2, height: 20, color: '#8B4513' }
                ];
                
                // Update the start platform for player positioning
                levelData.startPlatform = levelData.platforms[0]; // Bottom floor
                
                // Return the modified level data instead of generating a new one
                return levelData;
            } else if (this.testMode === 'proceduralterrain') {
                levelOptions.scenario = 'proceduralTerrain';
                Logger.log('scene', "Procedural Terrain test scenario selected - generating terrain based landscape.");
                const levelWidth = 3000;
                const margin = 50;
                const height = C.CANVAS_HEIGHT - (margin * 2);
                const width = C.CANVAS_WIDTH - (margin * 2);

                const levelData = {
                    platforms: [],
                    collectibles: [],
                    bats: [],
                    groundPatrollers: [],
                    snakes: [],
                    powerUps: [],
                    startPlatform: null,
                    levelWidth: levelWidth,
                    hasCustomBackground: true,
                    drawBackground: (ctx) => this.drawStaticStarryBackground(ctx)
                };

                const platformSegments = 20;
                const segmentWidth = levelWidth / platformSegments;
                let lastHeight = C.CANVAS_HEIGHT - margin - 100;

                for (let i = 0; i < platformSegments; i++) {
                    const heightVariation = Math.sin(i * 0.5) * 100 + Math.cos(i * 0.3) * 50;
                    const platformHeight = lastHeight + heightVariation;
                    lastHeight = Math.max(C.CANVAS_HEIGHT - 200, Math.min(C.CANVAS_HEIGHT - 50, platformHeight));
                    levelData.platforms.push({
                        x: i * segmentWidth,
                        y: lastHeight,
                        width: segmentWidth + 5,
                        height: C.CANVAS_HEIGHT - lastHeight,
                        color: '#554433'
                    });
                }

                for (let i = 0; i < 8; i++) {
                    const x = margin + (levelWidth - margin * 2) * (i / 8);
                    const y = margin + 150 + Math.sin(i * 0.7) * 100;
                    const width = 150 + Math.random() * 100;
                    levelData.platforms.push({
                        x: x,
                        y: y,
                        width: width,
                        height: 20,
                        color: '#663311'
                    });
                }

                levelData.platforms.forEach((platform, index) => {
                    if (index % 3 === 0) {
                        levelData.collectibles.push({
                            x: platform.x + platform.width / 2,
                            y: platform.y - 30,
                            width: 20,
                            height: 20,
                            collected: false
                        });
                    }
                });

                levelData.startPlatform = levelData.platforms[0];
                return levelData;
            } else if (this.testMode === 'particles') {
                levelOptions.scenario = 'particlesTest';
                Logger.log('scene', "Particle effects test scenario selected.");
                if (!this.testParticles) this.testParticles = [];
                this.createTestParticles();
            }
            const levelData = this.levelGenerator.generateLevel(levelOptions);
            Logger.log('scene', "Level generation complete with options:", levelOptions);

            Logger.log('scene', "Creating player...");
            this.player = deepCopy(C.INITIAL_PLAYER_STATE);
            this.player.x = levelData.startPlatform ?
                            levelData.startPlatform.x + (levelData.startPlatform.width / 2) - (this.player.width / 2)
                            : 100;
            this.player.y = levelData.startPlatform ?
                            levelData.startPlatform.y - this.player.height - 1
                            : C.CANVAS_HEIGHT - 100;
            Logger.log('scene', "Player created at:", this.player.x, this.player.y);

            if (this.gameMode === 'test') {
                Logger.log('scene', "Applying test mode modifications to player...");
                this.player.lives = 999;
                this.player.orbShieldCount = 3;
                Logger.log('scene', "Test Player State:", this.player);
            }

            this.platforms = levelData.platforms || [];
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] }; // Ensure enemies are reset
            this.fireballs = []; // Clear existing fireballs
            Logger.log('scene', "Enemies and fireballs cleared for this level.");
            this.collectibles = levelData.collectibles || [];
            this.goal = levelData.goal || { x: C.CHUNK_WIDTH * C.NUM_CHUNKS - 200, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = levelData.levelEndX || C.CHUNK_WIDTH * C.NUM_CHUNKS;
            Logger.log('scene', `Level End X set to: ${this.levelEndX}`);

            this.camera = { x: 0, y: 0 };
            this.camera.x = Math.max(0, this.player.x - C.CANVAS_WIDTH / 3);
            this.camera.y = 0;
            Logger.log('scene', "Camera reset to:", this.camera.x, this.camera.y);

            this.gameWon = false;
            this.levelComplete = false;
            this.startTime = Date.now();
            this.levelTime = 0;

            if (this.effectsSystem && typeof this.effectsSystem.reset === 'function') {
                this.effectsSystem.reset();
            }

            Logger.log('scene', "resetLevel: COMPLETE");
        } catch (error) {
            Logger.error('scene', "ERROR in resetLevel:", error);
            this.platforms = [{x: 50, y: C.CANVAS_HEIGHT - 50, width: 400, height: 30, color: 'darkred'}];
            this.player = deepCopy(C.INITIAL_PLAYER_STATE);
            this.player.x = 100;
            this.player.y = C.CANVAS_HEIGHT - 100;
            this.camera = { x: 0, y: 0 };
            this.enemies = { bats: [], groundPatrollers: [], snakes: [] }; // Ensure enemies are reset
            this.fireballs = []; // Clear existing fireballs
            this.collectibles = [];
            this.goal = { x: 1000, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR };
            this.levelEndX = 1200;
        }
    }; // End of resetLevel method (Added semicolon)

    createTestParticles() {
        this.testParticles = [];
        for (
