// magic-carpet-game/js/level/levelGenerator.js

import * as C from '../config.js'; // Import constants
import {
    getRandom,
    getRandomInt,
    checkRectOverlap,
    checkPlatformArrayOverlap,
    checkRewardArrayOverlap,
    checkBatArrayOverlap, // Re-used for checking snake proximity too
    getRandomPatrolPoint,
    deepCopy // To copy prototypes
} from '../utils.js';

export class LevelGenerator {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth; // Should use CANVAS_WIDTH from config
        this.height = canvasHeight; // Should use CANVAS_HEIGHT from config
        // Calculate buffer needed above max lava height
        this.safeSpawnBuffer = C.LAVA_WAVE_HEIGHT * 1.5 + 100; // Max wave deviation + player height + buffer
        console.log(`LevelGenerator initialized for ${this.width}x${this.height}. Safe Buffer: ${this.safeSpawnBuffer.toFixed(0)}`);
    }

    /**
     * Generates the layout for a new level, including platforms, collectibles, and enemies.
     * @param {object} options Options for level generation, including gameMode and scenario.
     * @returns {object} An object containing the generated level data.
     * Example: { platforms, collectibles, enemies, startPlatform, goal, levelEndX }
     */
    generateLevel(options = {}) {
        console.log("LevelGenerator.generateLevel: Starting with options:", options);

        // Initialize empty arrays for level elements
        const platforms = [];
        const collectibles = [];
        const bats = [];
        const groundPatrollers = [];
        const snakes = [];
        let giantBatBoss = null;

        // Default to normal mode if not specified
        const gameMode = options.gameMode || 'normal';
        const scenario = options.scenario || 'standard';

        // Setup level parameters based on game mode and scenario
        let levelWidth = 3000; // Default level width
        let startPlatformWidth = 300;
        let platformDensity = 0.4;
        let collectibleDensity = 0.3;
        let enemyDensity = 0.2;

        console.log(`Level generation starting with mode: ${gameMode}, scenario: ${scenario}`);

        // Handle specific test scenarios
        if (scenario === 'physicsTest') {
            console.log("Creating physics test level");
            const startPlatform = {
                x: 100,
                y: C.CANVAS_HEIGHT - 150,
                width: 300,
                height: 20,
                color: '#8B4513'
            };
            const platforms = [
                startPlatform,
                { x: C.CANVAS_WIDTH / 2 - 150, y: C.CANVAS_HEIGHT - 300, width: 300, height: 20, color: '#8B4513' },
                { x: C.CANVAS_WIDTH - 350, y: C.CANVAS_HEIGHT - 200, width: 250, height: 20, color: '#8B4513' },
                { x: 150, y: C.CANVAS_HEIGHT - 400, width: 200, height: 20, color: '#8B4513' }
            ];
            levelWidth = C.CANVAS_WIDTH * 1.5;
            return {
                platforms,
                collectibles: [],
                bats: [],
                groundPatrollers: [],
                snakes: [],
                goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
                startPlatform,
                levelEndX: levelWidth
            };
        } else if (scenario === 'combatTest') {
            console.log("Creating combat test level");
            const startPlatform = {
                x: 100,
                y: C.CANVAS_HEIGHT - 150,
                width: 300,
                height: 20,
                color: '#8B4513'
            };
            const platforms = [
                startPlatform,
                { x: C.CANVAS_WIDTH / 2 - 150, y: C.CANVAS_HEIGHT - 300, width: 300, height: 20, color: '#8B4513' },
                { x: C.CANVAS_WIDTH - 350, y: C.CANVAS_HEIGHT - 200, width: 250, height: 20, color: '#8B4513' },
                { x: 150, y: C.CANVAS_HEIGHT - 400, width: 200, height: 20, color: '#8B4513' }
            ];
            const bats = [
                { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT - 350, width: 50, height: 50, type: 'bat' },
                { x: C.CANVAS_WIDTH - 250, y: C.CANVAS_HEIGHT - 250, width: 50, height: 50, type: 'bat' }
            ];
            levelWidth = C.CANVAS_WIDTH * 1.5;
            return {
                platforms,
                collectibles: [],
                bats,
                groundPatrollers: [],
                snakes: [],
                goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
                startPlatform,
                levelEndX: levelWidth
            };
        } else if (scenario === 'emptyLevel') {
            console.log("Creating empty test level with minimal elements");
            const startPlatform = {
                x: 100,
                y: C.CANVAS_HEIGHT - 100,
                width: 200,
                height: 20,
                color: '#8B4513'
            };
            return {
                platforms: [startPlatform],
                collectibles: [],
                bats: [],
                groundPatrollers: [],
                snakes: [],
                goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
                startPlatform,
                levelEndX: levelWidth
            };
        } else if (scenario === 'particlesTest') {
            console.log("Creating particle effects test level");
            const startPlatform = {
                x: 100,
                y: C.CANVAS_HEIGHT - 150,
                width: 300,
                height: 20,
                color: '#8B4513'
            };
            const platforms = [
                startPlatform,
                { x: C.CANVAS_WIDTH / 2 - 150, y: C.CANVAS_HEIGHT - 300, width: 300, height: 20, color: '#8B4513' },
                { x: C.CANVAS_WIDTH - 350, y: C.CANVAS_HEIGHT - 200, width: 250, height: 20, color: '#8B4513' },
                { x: 150, y: C.CANVAS_HEIGHT - 400, width: 200, height: 20, color: '#8B4513' }
            ];
            const collectibles = [
                { x: C.CANVAS_WIDTH / 2 - 20, y: C.CANVAS_HEIGHT - 350, width: C.REWARD_COLLISION_SIZE, height: C.REWARD_COLLISION_SIZE, color: C.COLLECTIBLE_COLOR, collected: false },
                { x: C.CANVAS_WIDTH - 250, y: C.CANVAS_HEIGHT - 250, width: C.REWARD_COLLISION_SIZE, height: C.REWARD_COLLISION_SIZE, color: C.COLLECTIBLE_COLOR, collected: false }
            ];
            return {
                platforms,
                collectibles,
                bats: [],
                groundPatrollers: [],
                snakes: [],
                goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
                startPlatform,
                levelEndX: levelWidth
            };
        } else if (scenario === 'proceduralTerrain') {
            console.log("Procedural terrain generation requested - deferring to GameplayScene");
            return {
                platforms: [],
                collectibles: [],
                bats: [],
                groundPatrollers: [],
                snakes: [],
                goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
                startPlatform: null,
                levelEndX: levelWidth
            };
        } else {
            console.log("Standard level generation");
            // Standard level generation logic
            // ...existing code for standard level generation...
        }

        return {
            platforms,
            collectibles,
            bats,
            groundPatrollers,
            snakes,
            goal: { x: levelWidth - 200, y: 100, width: 50, height: 80, type: 'goal' },
            startPlatform: null,
            levelEndX: levelWidth,
            giantBatBoss // This will be null if placement failed or wasn't attempted
        };
    }
}