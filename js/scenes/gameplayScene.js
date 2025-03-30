import { Scene } from '../core/scene.js';
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
        
        // Update game entities and handle physics
        console.log("GameplayScene.update: Updating entities and physics");
        // (Implementation would be much more extensive)
        
        // Update effects and particles
        this.effectsSystem.update(deltaTime);
        
        // Update camera position
        this.updateCamera();
    }

    render(ctx) {
        // Clear background
        ctx.fillStyle = this.gameMode === 'test' ? '#111122' : 'black'; // Dark blue for test, black for normal
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- Conditional Rendering based on Mode ---
        if (this.gameMode === 'normal') {
            // TODO: Add normal background rendering here (stars, lava, etc.)
            // Assuming these might be drawn by separate methods or within this block
            console.log("Rendering normal background elements (placeholder)");
        } else {
            // Test mode has a plain background (already cleared above)
            console.log("Rendering minimal test background");
        }

        // --- Common Rendering (Platforms, Player, UI Text) ---

        // Draw simple test elements (kept for debugging visibility)
        ctx.fillStyle = 'red';
        ctx.fillRect(100, 100, 100, 100);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('GAMEPLAY SCENE ACTIVE', 150, 80);
        
        // Draw player if available
        if (this.player) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.player.x - this.camera.x, this.player.y - this.camera.y, 
                        this.player.width, this.player.height);
            
            // Debug text
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(`Player: (${this.player.x}, ${this.player.y})`, 20, 20);
            ctx.fillText(`Camera: (${this.camera.x}, ${this.camera.y})`, 20, 40);
        }

        ctx.fillStyle = this.gameMode === 'test' ? '#FFFF00' : '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText(`Mode: ${this.gameMode.toUpperCase()} (Press T to toggle)`, 
                    ctx.canvas.width - 250, 30);
    }

    resetLevel() {
        console.log(`resetLevel: START (Mode: ${this.gameMode})`);
        
        try {
            if (this.gameMode === 'normal') {
                console.log("Calling levelGenerator.generateLevel()...");
                const levelData = this.levelGenerator.generateLevel();
                console.log("Level generation complete", levelData);
                
                console.log("Creating player...");
                this.player = deepCopy(C.INITIAL_PLAYER_STATE);
                this.player.x = levelData.startPlatform ? 
                                levelData.startPlatform.x + 100 : 100;
                this.player.y = levelData.startPlatform ? 
                                levelData.startPlatform.y - this.player.height : 300;
                console.log("Player created:", this.player);
                
                this.platforms = levelData.platforms || [];
                this.camera = { x: 0, y: 0 };
                this.gameWon = false;
                this.levelComplete = false;
                this.startTime = Date.now();
                this.levelTime = 0;
            } else {
                this.createTestEnvironment();
            }
            
            console.log("resetLevel: COMPLETE");
        } catch (error) {
            console.error("ERROR in resetLevel:", error);
            this.platforms = [{x: 50, y: 500, width: 400, height: 30, color: 'gray'}];
            this.player = {x: 100, y: 450, width: 32, height: 48, velocityX: 0, velocityY: 0, lives: 3};
            this.camera = { x: 0, y: 0 };
        }
    }

    createTestEnvironment() {
        console.log("Creating Test Environment...");
        this.player = deepCopy(C.INITIAL_PLAYER_STATE);
        this.player.x = 150; // Start closer to center of first platform
        this.player.y = 400; // Start slightly higher above the first platform (y=500)
        this.player.onGround = false; // Ensure starting in air state
        this.player.lives = 999; // Infinite lives for testing
        this.player.orbShieldCount = 3; // Start with shields for testing
        console.log("Test Player State:", this.player);

        // Simple hardcoded platforms for testing
        this.platforms = [
            {x: 50, y: 500, width: 300, height: 30, color: '#8B4513'},
            {x: 400, y: 450, width: 150, height: 30, color: '#A0522D'},
            {x: 600, y: 400, width: 150, height: 30, color: '#CD853F'},
            {x: 800, y: 350, width: 150, height: 30, color: '#D2B48C'},
            {x: 1000, y: 350, width: 200, height: 30, color: '#F5DEB3'},
            {x: 1250, y: 450, width: 200, height: 30, color: '#DEB887'},
            {x: 1500, y: 550, width: 800, height: 30, color: '#8B4513'},
        ];

        this.goal = {
            x: 2100, 
            y: 450, 
            width: C.GOAL_DOOR_WIDTH, 
            height: C.GOAL_DOOR_HEIGHT, 
            color: C.GOAL_FRAME_COLOR
        };

        this.bats = [];
        this.groundPatrollers = [];
        this.snakes = [];
        this.collectibles = [];
        this.levelEndX = 2500;
    }

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
        document.removeEventListener('keydown', this.handleKeyDown);
        // Clean up any resources if needed
    }
}
