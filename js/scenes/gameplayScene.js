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
    }

    onEnter() {
        console.log("Entering GameplayScene");
        
        // Initialize systems
        this.levelGenerator = new LevelGenerator(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        this.effectsSystem = createEffectsSystem();
        
        // Generate the level
        this.resetLevel();
        
        // Initialize UI
        this.updateLivesDisplay();
        this.updateOrbShieldDisplay();
        document.getElementById('timer').textContent = "0.00";
        
        this.gameStarted = true;
    }

    update(deltaTime) {
        if (!this.gameStarted || this.gameWon) return;
        
        // Update level timer
        this.levelTime = (Date.now() - this.startTime) / 1000;
        document.getElementById('timer').textContent = this.levelTime.toFixed(2);
        
        // Update game entities and handle physics
        // (Implementation would be much more extensive)
        
        // Update effects and particles
        this.effectsSystem.update(deltaTime);
        
        // Update camera position
        this.updateCamera();
    }

    render(ctx) {
        // Clear canvas
        ctx.fillStyle = C.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Apply camera transform
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render all game elements
        // (Implementation would render platforms, player, enemies, effects, etc.)
        
        // Render effects and particles
        this.effectsSystem.render(ctx);
        
        // Restore original transform
        ctx.restore();
        
        // Render UI elements that should not be affected by camera
        this.renderUI(ctx);
    }

    resetLevel() {
        console.log("Resetting level...");
        
        // Generate a new level
        const levelData = this.levelGenerator.generateLevel();
        
        // Create player with initial state
        this.player = deepCopy(C.INITIAL_PLAYER_STATE);
        
        // Initialize player position based on start platform
        if (levelData.startPlatform) {
            this.player.x = levelData.startPlatform.x + 100;
            this.player.y = levelData.startPlatform.y - this.player.height;
        }
        
        // Store level data
        this.platforms = levelData.platforms;
        this.collectibles = levelData.collectibles;
        this.bats = levelData.bats;
        this.groundPatrollers = levelData.groundPatrollers;
        this.snakes = levelData.snakes;
        this.goal = levelData.goal;
        this.levelEndX = levelData.levelEndX;
        this.giantBatBoss = levelData.giantBatBoss;
        
        // Initialize power-up system with player reference
        this.powerUpSystem = new PowerUpSystem(this.player);
        
        // Reset camera
        this.camera = { x: 0, y: 0 };
        
        // Reset game state
        this.gameWon = false;
        this.levelComplete = false;
        this.startTime = Date.now();
        this.levelTime = 0;
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
        // Clean up any resources if needed
    }
}
