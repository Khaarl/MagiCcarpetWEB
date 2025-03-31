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
        const { gameMode = 'normal', scenario = null } = options;
        let levelData = {
            platforms: [],
            collectibles: [],
            enemies: [],
            startPlatform: null,
            goal: { x: C.CHUNK_WIDTH * C.NUM_CHUNKS - 200, y: C.CANVAS_HEIGHT - 150, width: C.GOAL_DOOR_WIDTH, height: C.GOAL_DOOR_HEIGHT, color: C.GOAL_FRAME_COLOR },
            levelEndX: C.CHUNK_WIDTH * C.NUM_CHUNKS
        };

        if (scenario === 'emptyLevel') {
            console.log("Creating empty test level with minimal elements");
            
            const startPlatform = {
                x: 100,
                y: C.CANVAS_HEIGHT - 100,
                width: 200,
                height: 20,
                color: '#8B4513'
            };
            
            levelData.platforms = [startPlatform];
            levelData.startPlatform = startPlatform;
            levelData.enemies = [];
            levelData.collectibles = [];
            levelData.levelEndX = C.CANVAS_WIDTH * 2;

            return levelData;
        }

        console.log("LevelGenerator.generateLevel: Creating new level");
        console.log("Generating Level Layout...");
        const platforms = [];
        const collectibles = [];
        const bats = [];
        const groundPatrollers = [];
        const snakes = [];
        let giantBatBoss = null; // Initialize boss as null

        let currentX = 0; // Tracks the rightmost edge of placed content
        // Calculate a safe starting Y position above the highest possible lava wave
        const safeStartY = this.height - C.LAVA_BASE_HEIGHT - this.safeSpawnBuffer;
        let currentY = safeStartY; // Tracks the Y position of the last placed 'connected' platform
        let levelEndX = C.CHUNK_WIDTH * C.NUM_CHUNKS; // Initial estimated level width

        // --- 1. Starting Platform ---
        const startPlatform = {
            x: 50,
            y: safeStartY,
            width: C.START_PLATFORM_WIDTH,
            height: C.PLATFORM_HEIGHT,
            color: C.PLATFORM_BASE_COLOR,
            hasCactus: false // Start platform never has a cactus
        };
        platforms.push(startPlatform);
        currentX = startPlatform.x + startPlatform.width; // Update current X position
        console.log(`Start Platform at (${startPlatform.x}, ${startPlatform.y.toFixed(0)}), Width: ${startPlatform.width}`);

        // --- 2. Generate Platforms in Chunks ---
        for (let i = 0; i < C.NUM_CHUNKS; i++) {
            const chunkStartX = i * C.CHUNK_WIDTH;
            const chunkEndX = chunkStartX + C.CHUNK_WIDTH;
            let chunkPlatCount = 0;
            let attempts = 0;
            let lastPlatformXInChunk = currentX; // Track X to detect if stuck

            // Keep adding platforms until the current X reaches the end of the chunk or max attempts exceeded
            while (currentX < chunkEndX && attempts < C.MAX_PLACEMENT_ATTEMPTS * 2) {
                attempts++;
                // Determine platform type: stepping up, down, or floating
                const stepUp = Math.random() < 0.4;
                const stepDown = !stepUp && Math.random() < 0.3;
                const isFloating = !stepUp && !stepDown;

                let nextWidth = getRandom(C.MIN_PLAT_WIDTH_CHUNK, C.MAX_PLAT_WIDTH_CHUNK);
                let nextX, nextY;

                // Calculate position based on type
                if (isFloating) {
                    nextX = currentX + getRandom(C.FLOAT_PLAT_MIN_SEP_X, C.FLOAT_PLAT_MAX_SEP_X);
                    nextY = currentY + getRandom(-C.FLOAT_PLAT_MAX_SEP_Y, C.FLOAT_PLAT_MAX_SEP_Y);
                    // Clamp Y for floating platforms to stay within a safe middle band
                    nextY = Math.max(C.PLATFORM_HEIGHT * 3, Math.min(this.height - C.LAVA_BASE_HEIGHT - C.PLATFORM_HEIGHT * 4, nextY));
                } else { // Stepping up or down
                    nextX = currentX + getRandom(C.STEP_WIDTH_MIN, C.STEP_WIDTH_MAX);
                    let yChange = getRandom(C.STEP_HEIGHT_MIN, C.STEP_HEIGHT_MAX);
                    if (stepDown) yChange *= -1;
                    nextY = currentY + yChange;
                    // Clamp Y for stepping platforms (can be closer to edges)
                    nextY = Math.max(C.PLATFORM_HEIGHT, Math.min(this.height - C.LAVA_BASE_HEIGHT - C.PLATFORM_HEIGHT * 2, nextY));
                }

                // Create potential platform object
                const newPlat = {
                    x: nextX, y: nextY, width: nextWidth, height: C.PLATFORM_HEIGHT,
                    color: C.PLATFORM_BASE_COLOR,
                    // Add cactus based on chance and if platform is wide enough
                    hasCactus: Math.random() < C.CACTUS_CHANCE && nextWidth > C.CACTUS_WIDTH * 1.5
                };

                // Check for overlaps only with potentially nearby platforms for efficiency
                // Check radius slightly larger than max possible separation + max platform width
                const checkRadius = C.MAX_PLAT_WIDTH_CHUNK + Math.max(C.FLOAT_PLAT_MAX_SEP_X, C.STEP_WIDTH_MAX);
                const nearbyPlatforms = platforms.filter(p => Math.abs((p.x + p.width/2) - (newPlat.x + newPlat.width/2)) < checkRadius);

                // Check if the new platform overlaps existing ones (using buffer)
                if (!checkPlatformArrayOverlap(newPlat, nearbyPlatforms, C.PLATFORM_BUFFER)) {
                    // Check distance from initial spawn point
                    const distToSpawn = Math.sqrt(
                        Math.pow(newPlat.x + newPlat.width/2 - (startPlatform.x + startPlatform.width/2), 2) +
                        Math.pow(newPlat.y + newPlat.height/2 - (startPlatform.y + startPlatform.height/2), 2)
                    );

                    // Place platform if it doesn't overlap and is far enough from spawn
                    if (distToSpawn > C.SPAWN_CLEAR_RADIUS) {
                        platforms.push(newPlat);
                        currentX = newPlat.x + newPlat.width; // Advance generator X position
                        if (!isFloating) { // Only update Y anchor for connected platforms
                            currentY = newPlat.y;
                        }
                        chunkPlatCount++;
                        lastPlatformXInChunk = currentX; // Update last successful X

                        // --- Add Ground Patroller? ---
                        if (groundPatrollers.length < C.NUM_PATROLLERS_TO_SPAWN &&
                            !newPlat.hasCactus && // No cactus on platform
                            newPlat.width > C.PATROLLER_WIDTH * 2 && // Platform wide enough
                            Math.random() < 0.15) // Chance to spawn
                        {
                             // Create patroller from prototype
                             const patroller = deepCopy(C.GROUND_PATROLLER_PROTOTYPE);
                             patroller.x = newPlat.x + newPlat.width / 2 - patroller.width / 2; // Center on platform
                             patroller.y = newPlat.y - patroller.height; // Place on top
                             patroller.onPlatform = newPlat; // Link to platform (important: reference, not copy!)
                             patroller.direction = (Math.random() < 0.5) ? 1 : -1; // Random start direction
                             patroller.health = C.PATROLLER_HEALTH; // Reset health

                             // Check proximity to other patrollers to avoid clustering
                             let tooClose = groundPatrollers.some(gp =>
                                Math.abs(gp.x - patroller.x) < 150 && Math.abs(gp.y - patroller.y) < 50
                             );
                             if (!tooClose) {
                                 groundPatrollers.push(patroller);
                             }
                        } // End patroller placement check
                    } // End spawn distance check
                } // End overlap check

                // Prevent infinite loop if placement fails repeatedly within a chunk
                if (currentX === lastPlatformXInChunk && attempts > C.MAX_PLACEMENT_ATTEMPTS) {
                     console.warn(`Stuck placing platforms in chunk ${i}, forcing advance.`);
                     currentX = chunkEndX; // Force move to next chunk
                 }

            } // End while loop for placing platforms in chunk

            // If a chunk somehow ended up with no platforms, ensure X advances
            if (chunkPlatCount === 0 && currentX < chunkEndX) {
                 console.warn(`Chunk ${i} generated no platforms. Advancing X.`);
                 currentX = chunkEndX; // Ensure progress
            }
        } // End for loop (chunks)

        // --- 3. Place Goal ---
        // Find a suitable platform near the end of the generated platforms
        let endPlatform = platforms[platforms.length - 1]; // Default to last platform
        if (platforms.length > 3) { // Ensure there are enough platforms to choose from
            // Select a platform from the last 20% of the generated platforms (excluding the very last one maybe)
            const startIndex = Math.max(1, Math.floor(platforms.length * 0.8)); // Ensure index is at least 1
             const goalPlatformIndex = getRandomInt(startIndex, platforms.length - 2); // Avoid very last one
            endPlatform = platforms[goalPlatformIndex] || platforms[platforms.length - 1]; // Fallback to last if index fails
        }
        // Ensure level end X coordinate is well beyond the goal platform
        levelEndX = Math.max(levelEndX, endPlatform.x + endPlatform.width + 300);

        // Create goal object using prototype
        const goal = deepCopy(C.INITIAL_GOAL_STATE);
        goal.x = endPlatform.x + (endPlatform.width / 2) - (C.GOAL_DOOR_WIDTH / 2); // Center on platform
        goal.y = endPlatform.y - C.GOAL_DOOR_HEIGHT; // Position above platform

        // Simple overlap check for goal against other platforms (not the one it's on)
        const goalRect = { x: goal.x, y: goal.y, width: goal.width, height: goal.height };
        const otherPlatforms = platforms.filter(p => p !== endPlatform);
        if (checkPlatformArrayOverlap(goalRect, otherPlatforms, -10)) { // Negative buffer allows slight visual overlap is ok
            console.warn("Goal position adjusted due to potential overlap with other platforms.");
            // Fallback placement: right edge of platform
            goal.x = endPlatform.x + endPlatform.width - goal.width - 5;
            goal.y = endPlatform.y - goal.height;
        }
        console.log(`Goal placed near platform at (${endPlatform.x.toFixed(0)}, ${endPlatform.y.toFixed(0)})`);


        // --- 4. Place Collectibles (Rewards) ---
        let placedRewards = 0;
        let rewardAttempts = 0;
        while (placedRewards < C.NUM_REWARDS && rewardAttempts < C.MAX_REWARD_PLACEMENT_ATTEMPTS) {
            rewardAttempts++;
            // Try placing on platforms excluding the start and the goal platform
            const platformIndex = getRandomInt(1, platforms.length - 1); // Exclude start platform (index 0)
            const targetPlatform = platforms[platformIndex];

            // Skip if platform is invalid, has cactus, is start, or is the goal platform
            if (!targetPlatform || targetPlatform.hasCactus || targetPlatform === startPlatform || targetPlatform === endPlatform) continue;

            // Position reward floating slightly above the platform center
            const rewardX = targetPlatform.x + targetPlatform.width / 2 - C.REWARD_COLLISION_SIZE / 2;
            const rewardY = targetPlatform.y - C.REWARD_COLLISION_SIZE - getRandom(10, 30); // Higher above platform

            const rewardRect = { x: rewardX, y: rewardY, width: C.REWARD_COLLISION_SIZE, height: C.REWARD_COLLISION_SIZE };

            // Check distance from spawn and goal points
            const distToSpawnSq = Math.pow(rewardX - startPlatform.x, 2) + Math.pow(rewardY - startPlatform.y, 2);
            const distToGoalSq = Math.pow(rewardX - goal.x, 2) + Math.pow(rewardY - goal.y, 2);

            // Check overlaps with existing collectibles and platforms below it
             if (distToSpawnSq > C.REWARD_CLEAR_RADIUS * C.REWARD_CLEAR_RADIUS &&
                 distToGoalSq > C.REWARD_CLEAR_RADIUS * C.REWARD_CLEAR_RADIUS && // Use squared distance for efficiency
                 !checkRewardArrayOverlap(rewardRect, collectibles, C.REWARD_BASE_RADIUS) && // Check against other rewards
                 !checkPlatformArrayOverlap(rewardRect, platforms.filter(p => p !== targetPlatform), -C.REWARD_COLLISION_SIZE * 0.5)) // Check doesn't overlap platforms below significantly
             {
                 collectibles.push({
                     x: rewardX, y: rewardY, width: C.REWARD_COLLISION_SIZE, height: C.REWARD_COLLISION_SIZE,
                     color: C.COLLECTIBLE_COLOR, collected: false // Ensure collected state is false
                 });
                 placedRewards++;
             }
        }
        if (placedRewards < C.NUM_REWARDS) console.warn(`Only placed ${placedRewards}/${C.NUM_REWARDS} rewards.`);

        // --- 5. Place Bats ---
        let placedBats = 0;
        let batAttempts = 0;
        while (placedBats < C.NUM_BATS_TO_SPAWN && batAttempts < C.MAX_PLACEMENT_ATTEMPTS * 3) { // Allow more attempts
            batAttempts++;
            // Choose a random platform (not start) as an anchor point for the bat's origin
             const targetPlatformIndex = getRandomInt(1, platforms.length - 1);
             const targetPlatform = platforms[targetPlatformIndex];
            if (!targetPlatform) continue;

            // Calculate potential origin point in the air near the platform
            const originX = targetPlatform.x + targetPlatform.width / 2 + getRandom(-C.CHUNK_WIDTH / 4, C.CHUNK_WIDTH / 4);
            const originY = targetPlatform.y - getRandom(C.BAT_PROTOTYPE.height * 4, C.BAT_PROTOTYPE.height * 10); // Higher, wider range

            // Clamp Y to stay within world bounds (above lava, below top edge buffer)
            const minY = C.BAT_PROTOTYPE.height + 20;
            const maxY = this.height - C.LAVA_BASE_HEIGHT - C.BAT_PROTOTYPE.height - 20;
            const clampedY = Math.max(minY, Math.min(maxY, originY));

            // Define the bat's potential bounding box for collision checks
            const batRect = { x: originX - C.BAT_PROTOTYPE.width / 2, y: clampedY - C.BAT_PROTOTYPE.height / 2, width: C.BAT_PROTOTYPE.width, height: C.BAT_PROTOTYPE.height };

            // Check distances from spawn and goal
            const distToSpawnSq = Math.pow(originX - startPlatform.x, 2) + Math.pow(clampedY - startPlatform.y, 2);
            const distToGoalSq = Math.pow(originX - goal.x, 2) + Math.pow(clampedY - goal.y, 2);

             // Check overlaps with platforms and other bats
             if (distToSpawnSq > (C.SPAWN_CLEAR_RADIUS * 1.5)**2 && // Further from spawn (squared)
                 distToGoalSq > (C.EXIT_CLEAR_RADIUS * 1.0)**2 &&   // Decent distance from goal (squared)
                 !checkPlatformArrayOverlap(batRect, platforms, 40) && // Don't spawn too close/inside platforms (larger buffer)
                 !checkBatArrayOverlap(batRect, bats, 70)) // Don't spawn too close to other bats (larger buffer)
             {
                 const bat = deepCopy(C.BAT_PROTOTYPE); // Create copy from prototype
                 bat.originX = originX; // Store where it should return to
                 bat.originY = clampedY;
                 bat.x = batRect.x; // Set initial position
                 bat.y = batRect.y;
                 bat.state = (Math.random() < 0.5) ? 'idle' : 'patrolling'; // Random initial state
                  // Get initial patrol point using utility function
                  [bat.patrolTargetX, bat.patrolTargetY] = getRandomPatrolPoint(
                      bat.originX, bat.originY, bat.patrolRange,
                      this.height, C.LAVA_BASE_HEIGHT, bat.height
                  );
                 bat.stateTimer = getRandom(1, 3); // Initial duration for state
                 bat.health = 1; // Reset health
                 bat.randomMoveTimer = getRandom(0, 1); // Timer for idle movement variation
                 bats.push(bat);
                 placedBats++;
             }
        }
        if (placedBats < C.NUM_BATS_TO_SPAWN) console.warn(`Only placed ${placedBats}/${C.NUM_BATS_TO_SPAWN} bats.`);


        // --- 6. Place Snakes ---
         let placedSnakes = 0;
         let snakeAttempts = 0;
         while (placedSnakes < C.NUM_SNAKES_TO_SPAWN && snakeAttempts < C.MAX_PLACEMENT_ATTEMPTS * 3) {
             snakeAttempts++;
             const targetPlatformIndex = getRandomInt(1, platforms.length - 1);
             const targetPlatform = platforms[targetPlatformIndex];
             if (!targetPlatform) continue;

             // Snakes spawn closer to platforms than bats, often just above or slightly off edge
             const spawnSide = Math.random() < 0.5 ? -1 : 1; // Spawn left or right of center
             const originX = targetPlatform.x + targetPlatform.width / 2 + spawnSide * getRandom(targetPlatform.width * 0.2, targetPlatform.width * 0.6);
             const originY = targetPlatform.y - getRandom(C.SNAKE_PROTOTYPE.height * 0.5, C.SNAKE_PROTOTYPE.height * 2.5); // Closer vertically

             // Clamp Y
             const minY = C.SNAKE_PROTOTYPE.height + 10;
             const maxY = this.height - C.LAVA_BASE_HEIGHT - C.SNAKE_PROTOTYPE.height - 10;
             const clampedY = Math.max(minY, Math.min(maxY, originY));

             const snakeRect = { x: originX - C.SNAKE_PROTOTYPE.width / 2, y: clampedY - C.SNAKE_PROTOTYPE.height / 2, width: C.SNAKE_PROTOTYPE.width, height: C.SNAKE_PROTOTYPE.height };

             const distToSpawnSq = Math.pow(originX - startPlatform.x, 2) + Math.pow(clampedY - startPlatform.y, 2);
             const distToGoalSq = Math.pow(originX - goal.x, 2) + Math.pow(clampedY - goal.y, 2);

             // Check overlaps (snakes can overlap bats slightly more easily than other snakes)
             if (distToSpawnSq > (C.SPAWN_CLEAR_RADIUS * 1.3)**2 &&
                 distToGoalSq > (C.EXIT_CLEAR_RADIUS * 0.9)**2 &&
                 !checkPlatformArrayOverlap(snakeRect, platforms, 20) && // Check not inside platforms (smaller buffer ok)
                  !checkBatArrayOverlap(snakeRect, snakes, 90)) // Avoid snake clustering (check vs other snakes, large buffer)
             {
                 const snake = deepCopy(C.SNAKE_PROTOTYPE);
                 snake.originX = originX;
                 snake.originY = clampedY;
                 snake.x = snakeRect.x;
                 snake.y = snakeRect.y;
                 snake.state = (Math.random() < 0.5) ? 'idle' : 'patrolling';
                 [snake.patrolTargetX, snake.patrolTargetY] = getRandomPatrolPoint(
                     snake.originX, snake.originY, snake.patrolRange,
                     this.height, C.LAVA_BASE_HEIGHT, snake.height
                 );
                 snake.stateTimer = getRandom(1.5, 3.5);
                 snake.health = C.SNAKE_HEALTH; // Use configured health
                 snake.randomMoveTimer = getRandom(0, 1.5);
                 snake.undulationTimer = getRandom(0, Math.PI * 2); // Start animation at random phase
                 snake.facingDirection = (Math.random() < 0.5) ? 1 : -1;
                 snakes.push(snake);
                 placedSnakes++;
             }
         }
         if (placedSnakes < C.NUM_SNAKES_TO_SPAWN) console.warn(`Only placed ${placedSnakes}/${C.NUM_SNAKES_TO_SPAWN} snakes.`);


        // --- 7. Place Giant Bat Boss ---
        // Only place boss if conditions allow (e.g., not on first level? Configurable?)
        const shouldPlaceBoss = true; // Example: Always place for now

        if (shouldPlaceBoss) {
            let bossSpawnAttempts = 0;
            const MAX_BOSS_SPAWN_ATTEMPTS = 15;
            let bossPlaced = false;

            while (!bossPlaced && bossSpawnAttempts < MAX_BOSS_SPAWN_ATTEMPTS) {
                bossSpawnAttempts++;
                // Try placing the boss in a clear area near (but usually above) the goal
                const bossOriginX = goal.x + goal.width / 2 + getRandom(-150, 150); // X near goal
                const bossOriginY = goal.y - C.GIANT_BAT_BOSS_HEIGHT - getRandom(120, 220); // Significantly above goal

                // Clamp Y
                 const minY = C.GIANT_BAT_BOSS_HEIGHT + 30;
                 const maxY = this.height - C.LAVA_BASE_HEIGHT - C.GIANT_BAT_BOSS_HEIGHT - 30;
                const clampedBossY = Math.max(minY, Math.min(maxY, bossOriginY));

                const bossRect = {
                    x: bossOriginX - C.GIANT_BAT_BOSS_WIDTH / 2,
                    y: clampedBossY - C.GIANT_BAT_BOSS_HEIGHT / 2,
                    width: C.GIANT_BAT_BOSS_WIDTH,
                    height: C.GIANT_BAT_BOSS_HEIGHT
                };

                // Check boss doesn't overlap platforms or the goal itself significantly
                if (!checkPlatformArrayOverlap(bossRect, platforms, 60) && // Large buffer vs platforms
                    !checkRectOverlap(bossRect, goalRect)) // Don't overlap goal rect
                {
                     giantBatBoss = deepCopy(C.GIANT_BAT_BOSS_PROTOTYPE); // Create from prototype
                     giantBatBoss.originX = bossOriginX;
                     giantBatBoss.originY = clampedBossY;
                     giantBatBoss.x = bossRect.x;
                     giantBatBoss.y = bossRect.y;
                      [giantBatBoss.patrolTargetX, giantBatBoss.patrolTargetY] = getRandomPatrolPoint(
                          giantBatBoss.originX, giantBatBoss.originY, giantBatBoss.patrolRange,
                          this.height, C.LAVA_BASE_HEIGHT, giantBatBoss.height
                      );
                     giantBatBoss.stateTimer = getRandom(2, 4);
                     giantBatBoss.health = C.GIANT_BAT_BOSS_HEALTH; // Use configured health
                     giantBatBoss.isDefeated = false; // Ensure not defeated initially
                     giantBatBoss.batSpawnTimer = C.GIANT_BAT_BOSS_SPAWN_INTERVAL * getRandom(0.5, 1.0); // Start spawn timer variably
                     bossPlaced = true;
                     console.log("Giant Bat Boss placed near goal.");
                 }
            } // End boss placement attempts
             if (!bossPlaced) {
                 console.warn("Could not place Giant Bat Boss after attempts.");
                 // Level will proceed without a boss if placement fails
             }
        } // End if(shouldPlaceBoss)


        console.log(`Level Generation Complete: ${platforms.length} platforms, ${collectibles.length} rewards, ${bats.length}, ${groundPatrollers.length} patrollers, ${snakes.length} snakes, Boss: ${!!giantBatBoss}. Estimated EndX: ${levelEndX.toFixed(0)}`);
        console.log("LevelGenerator.generateLevel: Level created", {
            platformCount: platforms.length,
            collectibleCount: collectibles.length,
            startPlatform: startPlatform
        });

        // Return all generated level data in a structured object
        return {
            platforms,
            collectibles,
            bats,
            groundPatrollers,
            snakes,
            goal,
            startPlatform,
            levelEndX,
            giantBatBoss // This will be null if placement failed or wasn't attempted
        };
    } // End generateLevel()
} // End LevelGenerator Class