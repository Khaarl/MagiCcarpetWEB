Okay, coding agent! Let's add a new enemy: the **Giant Bat**. It will be based heavily on the existing `Bat` enemy but bigger, tougher, and perhaps a bit slower or more imposing.

Here are the step-by-step instructions. Please modify the latest code (`Refactored Psy Flight N+-1 (v3.8: Desert Fire)`) accordingly:

**1. Define the Giant Bat Prototype:**

*   Near the `batProto` definition, add a new constant object `giantBatProto`.
*   Copy the properties from `batProto`.
*   **Modify** the following properties for `giantBatProto`:
    *   `width`: Increase significantly (e.g., `50`).
    *   `height`: Increase significantly (e.g., `30`).
    *   `type`: Set to `'giant_bat'`.
    *   `health`: Increase (e.g., `3` or `4`).
    *   `chaseSpeed`: Adjust if desired (e.g., slightly slower `70.0` or keep the same).
    *   `patrolSpeed`: Adjust if desired (e.g., slightly slower `40.0` or keep the same).
    *   `detectionRadius`: Potentially increase (e.g., `450`).
    *   `leashRadius`: Potentially increase (e.g., `detectionRadius * 1.8`).
    *   *(Optional)* `patrolRange`: Maybe slightly larger?
*   **Add** any new properties specific to the Giant Bat if you plan unique behaviors later (not needed for this basic version).

```javascript
// --- Initial Game Object States ---
// ... (player, goal, batProto definitions) ...

const giantBatProto = {
    x: 0, y: 0, width: 50, height: 30, // Increased size
    velocityX: 0, velocityY: 0,
    type: 'giant_bat', // Distinct type
    state: 'idle', stateTimer: 0,
    originX: 0, originY: 0,
    patrolTargetX: 0, patrolTargetY: 0,
    patrolRange: BAT_PATROL_RANGE * 1.2, // Slightly larger range?
    detectionRadius: 450, // Increased detection
    leashRadius: 450 * 1.6, // Increased leash
    chaseSpeed: 70.0, // Slightly slower chase?
    patrolSpeed: 40.0, // Slightly slower patrol?
    flapTimer: 0,
    health: 3, // Increased health
    randomMoveTimer: 0
};

const groundPatrollerProto = { /* ... */ };
const fireballProto = { /* ... */ };
```

**2. Add Constants for Spawning:**

*   Near `NUM_BATS_TO_SPAWN`, add a new constant `NUM_GIANT_BATS_TO_SPAWN`. Start with a small number (e.g., `2` or `3`).

```javascript
// --- Other Gameplay ---
// ...
const MAX_PLACEMENT_ATTEMPTS = 25;
const NUM_BATS_TO_SPAWN = 8; // Maybe reduce regular bats slightly?
const NUM_GIANT_BATS_TO_SPAWN = 2; // How many giant bats per level
const BAT_PATROL_RANGE = 200;
// ...
```

**3. Modify Level Generator:**

*   In `LevelGenerator.generateLevel()`:
    *   Initialize an empty array: `const giantBats = [];` near the start.
    *   **After** the regular bat spawning loop, add a similar loop to spawn Giant Bats:
        *   Use `NUM_GIANT_BATS_TO_SPAWN` as the limit.
        *   Use `giantBatProto` to create the new bat object (`const giantBat = { ...giantBatProto };`).
        *   When checking placement, use `giantBatProto.width` and `giantBatProto.height`.
        *   **Crucially**, modify the collision checks:
            *   `checkPlatformArrayOverlap`: Check against platforms using the giant bat's rect.
            *   `checkBatArrayOverlap`: Check against *regular* bats (`bats` array).
            *   **Add a new check:** Check against already placed *giant* bats (`giantBats` array) using `checkBatArrayOverlap(giantBatRect, giantBats, 75)`. Use a larger buffer (e.g., 75).
        *   Make sure the spawn position logic (`originY`, `clampedY`) uses `giantBatProto.height`.
        *   Push the created `giantBat` into the `giantBats` array.
        *   Add a warning log if not enough giant bats are placed.
    *   Modify the `return` statement to include the new array: `return { platforms, collectibles, bats, groundPatrollers, giantBats, goal, startPlatform, levelEndX };`
    *   Update the logging messages to include the count of placed giant bats.

```javascript
// Inside LevelGenerator.prototype.generateLevel

// ... after regular bat spawning loop ...

let placedGiantBats = 0;
let giantBatAttempts = 0;
while (placedGiantBats < NUM_GIANT_BATS_TO_SPAWN && giantBatAttempts < MAX_PLACEMENT_ATTEMPTS * 2) {
    giantBatAttempts++;
    const targetPlatform = platforms[getRandomInt(1, platforms.length - 1)]; // Ensure valid index
    if (!targetPlatform) continue;

    // Use giantBatProto dimensions for calculations
    const originX = targetPlatform.x + targetPlatform.width / 2 + getRandom(-CHUNK_WIDTH / 2.5, CHUNK_WIDTH / 2.5); // Wider range?
    const originY = targetPlatform.y - getRandom(giantBatProto.height * 1.5, giantBatProto.height * 4); // Adjusted height spawn
    const clampedY = Math.max(giantBatProto.height + 15, Math.min(this.height - LAVA_BASE_HEIGHT - giantBatProto.height - 15, originY));

    const giantBatRect = { x: originX - giantBatProto.width / 2, y: clampedY - giantBatProto.height / 2, width: giantBatProto.width, height: giantBatProto.height };

    const distToSpawn = Math.sqrt(Math.pow(originX - startPlatform.x, 2) + Math.pow(clampedY - startPlatform.y, 2));
    const distToGoal = Math.sqrt(Math.pow(originX - goal.x, 2) + Math.pow(clampedY - goal.y, 2));

    // Check against platforms, regular bats, AND other giant bats
    if (distToSpawn > SPAWN_CLEAR_RADIUS * 1.5 && // Need more clearance?
        distToGoal > EXIT_CLEAR_RADIUS * 1.0 &&
        !checkPlatformArrayOverlap(giantBatRect, platforms, 30) && // Increased buffer?
        !checkBatArrayOverlap(giantBatRect, bats, 50) && // Check against regular bats
        !checkBatArrayOverlap(giantBatRect, giantBats, 75)) // Check against other giant bats (larger buffer)
    {
        const giantBat = { ...giantBatProto }; // Create from giant proto
        giantBat.originX = originX;
        giantBat.originY = clampedY;
        giantBat.x = giantBat.originX - giantBat.width / 2;
        giantBat.y = giantBat.originY - giantBat.height / 2;
        giantBat.state = (Math.random() < 0.5) ? 'idle' : 'patrolling';
        [giantBat.patrolTargetX, giantBat.patrolTargetY] = getRandomPatrolPoint(giantBat.originX, giantBat.originY, giantBat.patrolRange);
        giantBat.stateTimer = getRandom(2, 5); // Slightly longer timers?
        giantBat.health = giantBatProto.health; // Explicitly set health from proto
        giantBat.randomMoveTimer = getRandom(0, 1.5);

        giantBats.push(giantBat);
        placedGiantBats++;
    }
}
if (placedGiantBats < NUM_GIANT_BATS_TO_SPAWN) console.warn(`Only placed ${placedGiantBats}/${NUM_GIANT_BATS_TO_SPAWN} giant bats.`);

// ... update final console log ...
console.log(`Level Generated: ${platforms.length} plats, ${collectibles.length} rewards, ${bats.length} bats, ${giantBats.length} giant bats, ${groundPatrollers.length} patrollers. EndX: ${levelEndX.toFixed(0)}`);

// ... update return statement ...
return { platforms, collectibles, bats, groundPatrollers, giantBats, goal, startPlatform, levelEndX };
```

**4. Integrate into GameplayScene:**

*   In `GameplayScene` constructor: Add `this.giantBats = [];`.
*   In `GameplayScene.generateLevel()`:
    *   Receive the `giantBats` array from `levelData`.
    *   Assign it: `this.giantBats = levelData.giantBats.map(gb => ({...gb})); // Create copies`.
*   In `GameplayScene.update()`: Call a new update function: `this.updateGiantBats(deltaTime);` (place it near `this.updateBats`).
*   **Create the `updateGiantBats` function:**
    *   *Copy* the entire `updateBats` function.
    *   *Rename* the copied function to `updateGiantBats`.
    *   Change the line `this.bats.forEach(bat => {` to `this.giantBats.forEach(bat => {`.
    *   **Inside the loop:** Make sure all logic refers to the `bat` variable (which is now a giant bat instance). It should use the properties already set on the giant bat instance (like its specific `health`, `chaseSpeed`, etc.).
    *   **Platform Collision:** Adjust the push force or logic if needed (`BAT_PLATFORM_PUSH_FORCE`). Maybe giant bats are less affected or push harder? For now, keep it the same.
    *   **Death Handling:** When `bat.health <= 0`, consider calling a different effect `this.effectsSystem.emitGiantBatExplosion(...)` (to be created later).

```javascript
// Inside GameplayScene class

constructor() {
    // ... other properties
    this.giantBats = [];
    // ...
}

generateLevel() {
    // ...
    const levelData = this.levelGenerator.generateLevel();
    // ... other assignments ...
    this.bats = levelData.bats.map(b => ({...b}));
    this.groundPatrollers = levelData.groundPatrollers.map(p => ({...p}));
    this.giantBats = levelData.giantBats.map(gb => ({...gb})); // Assign giant bats
    // ... rest of reset logic ...
    console.log(`Level generated. Player Spawn: (...). Lives: ${this.player.lives}, Shield: ${this.player.orbShieldCount}, Giant Bats: ${this.giantBats.length}`);
}

update(deltaTime) {
    // ...
    this.updatePlayer(deltaTime, combinedInput);
    this.updateBats(deltaTime);
    this.updateGiantBats(deltaTime); // Add this call
    this.updateGroundPatrollers(deltaTime);
    // ...
}

// Add this new function (copy/paste/modify updateBats)
updateGiantBats(deltaTime) {
    const BAT_ACCELERATION = 500; // Maybe adjust for giant bats?
    const BAT_FRICTION = 0.9;
    const BAT_PLATFORM_PUSH_FORCE = 3.0; // Slightly stronger push?

    this.giantBats.forEach(bat => { // Changed from this.bats
        if (bat.health <= 0) {
            if (bat.y > -500) {
                // Call a potentially different effect/sound for giant bats later
                this.effectsSystem.emitBatExplosion(bat.x + bat.width / 2, bat.y + bat.height / 2, 25, '#603070'); // More particles? Different color?
                // Add triggerGiantBatDestroySound(game.audioCtx.currentTime); later
                bat.x = -1000;
                bat.y = -1000;
                bat.velocityX = 0;
                bat.velocityY = 0;
            }
            return;
        }

        bat.flapTimer += deltaTime * 10; // Slower flap?
        if (bat.stateTimer > 0) bat.stateTimer -= deltaTime;

        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const batCenterX = bat.x + bat.width / 2;
        const batCenterY = bat.y + bat.height / 2;

        const dxPlayer = playerCenterX - batCenterX;
        const dyPlayer = playerCenterY - batCenterY;
        const distSqPlayer = dxPlayer * dxPlayer + dyPlayer * dyPlayer;

        const dxOrigin = bat.originX - batCenterX;
        const dyOrigin = bat.originY - batCenterY;
        const distSqOrigin = dxOrigin * dxOrigin + dyOrigin * dyOrigin;

        // --- State Transitions --- (Keep the same logic, uses bat's own properties)
         if (bat.state === 'chasing') {
             if (distSqPlayer > bat.leashRadius * bat.leashRadius) {
                 bat.state = 'returning';
                 bat.stateTimer = 12; // Longer return time?
             }
         } else if (bat.state === 'returning') {
             if (distSqOrigin < BAT_ORIGIN_THRESHOLD_SQ || bat.stateTimer <= 0) {
                 bat.state = 'patrolling';
                 [bat.patrolTargetX, bat.patrolTargetY] = getRandomPatrolPoint(bat.originX, bat.originY, bat.patrolRange);
                 bat.stateTimer = getRandom(4, 8); // Longer patrol time?
             }
         } else { // Idle or Patrolling
             if (distSqPlayer < bat.detectionRadius * bat.detectionRadius) {
                 bat.state = 'chasing';
                 bat.stateTimer = 0;
             } else if (bat.state === 'patrolling' && bat.stateTimer <= 0) {
                 [bat.patrolTargetX, bat.patrolTargetY] = getRandomPatrolPoint(bat.originX, bat.originY, bat.patrolRange);
                 bat.stateTimer = getRandom(4, 8);
             } else if (bat.state === 'idle' && bat.stateTimer <= 0) {
                 bat.state = 'patrolling';
                 [bat.patrolTargetX, bat.patrolTargetY] = getRandomPatrolPoint(bat.originX, bat.originY, bat.patrolRange);
                 bat.stateTimer = getRandom(4, 8);
             }
         }


        // --- Movement Logic --- (Keep the same logic, uses bat's own properties)
         let targetX, targetY, maxSpeed, acceleration;

         if (bat.state === 'chasing') {
             targetX = playerCenterX;
             targetY = playerCenterY;
             maxSpeed = bat.chaseSpeed; // Uses giant bat's chaseSpeed
             acceleration = BAT_ACCELERATION * 1.1; // Slightly less agile?
         } else if (bat.state === 'returning') {
             targetX = bat.originX;
             targetY = bat.originY;
             maxSpeed = bat.patrolSpeed * BAT_RETURN_SPEED_MULTIPLIER;
             acceleration = BAT_ACCELERATION;
         } else { // Patrolling or Idle
             targetX = bat.patrolTargetX;
             targetY = bat.patrolTargetY;
             maxSpeed = bat.patrolSpeed; // Uses giant bat's patrolSpeed
             acceleration = BAT_ACCELERATION * 0.9;
         }

        // ... (Keep rest of movement: direction calc, acceleration apply, friction, speed clamp) ...
         // Calculate direction towards target
         const dxTarget = targetX - batCenterX;
         const dyTarget = targetY - batCenterY;
         const distTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);

         // Apply acceleration towards target
         if (distTarget > 1) { // Avoid division by zero and jittering
             const accelFactor = acceleration / distTarget;
             bat.velocityX += dxTarget * accelFactor * deltaTime;
             bat.velocityY += dyTarget * accelFactor * deltaTime;
         }

         // Apply friction (using exponential decay based on frame time)
         const frictionFactor = Math.pow(BAT_FRICTION, deltaTime * 60); // Adjust friction based on 60fps baseline
         bat.velocityX *= frictionFactor;
         bat.velocityY *= frictionFactor;

         // Clamp speed
         const currentSpeedSq = bat.velocityX * bat.velocityX + bat.velocityY * bat.velocityY;
         const maxSpeedSq = maxSpeed * maxSpeed;
         if (currentSpeedSq > maxSpeedSq) {
             const speedScale = Math.sqrt(maxSpeedSq / currentSpeedSq);
             bat.velocityX *= speedScale;
             bat.velocityY *= speedScale;
         }


        // Store potential next position
        let nextX = bat.x + bat.velocityX * deltaTime;
        let nextY = bat.y + bat.velocityY * deltaTime;
        let pushedX = 0;
        let pushedY = 0;

        // Simple collision avoidance with platforms (push away)
        for (const platform of this.platforms) {
             const batRectNext = { x: nextX, y: nextY, width: bat.width, height: bat.height };
             if (checkRectOverlap(batRectNext, platform)) {
                 // Calculate overlap amounts
                 const overlapX = (batCenterX + bat.velocityX * deltaTime) - (platform.x + platform.width / 2);
                 const overlapY = (batCenterY + bat.velocityY * deltaTime) - (platform.y + platform.height / 2);
                 const combinedHalfWidth = (bat.width + platform.width) / 2;
                 const combinedHalfHeight = (bat.height + platform.height) / 2;
                 const overlapAmountX = combinedHalfWidth - Math.abs(overlapX);
                 const overlapAmountY = combinedHalfHeight - Math.abs(overlapY);

                 if (overlapAmountX > 0 && overlapAmountY > 0) {
                      // Resolve collision based on the shallower overlap axis
                     if (overlapAmountX < overlapAmountY) {
                         const pushDirX = Math.sign(overlapX);
                         pushedX += pushDirX * overlapAmountX * BAT_PLATFORM_PUSH_FORCE * deltaTime; // Apply push scaled by dt
                         bat.velocityX *= 0.5; // Dampen velocity on collision
                     } else {
                         const pushDirY = Math.sign(overlapY);
                         pushedY += pushDirY * overlapAmountY * BAT_PLATFORM_PUSH_FORCE * deltaTime;
                         bat.velocityY *= 0.5;
                     }
                 }
             }
         }

         // Apply Velocity and push adjustments
         bat.x = nextX + pushedX;
         bat.y = nextY + pushedY;

        // Boundary checks (keep within level bounds, above lava)
        const lavaTop = this.getLavaTopY(bat.x + bat.width / 2, this.game.currentTime * 1000);
        bat.x = clamp(bat.x, 0, this.levelEndX - bat.width);
        bat.y = clamp(bat.y, 0, lavaTop - bat.height - 10); // Keep slightly higher above lava?
    });
     // Optional: Clean up dead giant bats (if not done immediately in loop)
    // this.giantBats = this.giantBats.filter(b => b.y > -500);
}

```

**5. Update Collision Checks:**

*   In `GameplayScene.checkCollisions()`:
    *   **After** the loop checking regular bats, add a similar loop for `this.giantBats`.
    *   Make sure it calls `handlePlayerDamage("giant_bat")` or similar if you want different damage logic later (for now, just "giant_bat" source is fine).

```javascript
// Inside GameplayScene.checkCollisions
if (this.screenFlashTimer <= 0) {
    // Bats
    for (const bat of this.bats) { /* ... existing check ... */ }
    // Giant Bats
    for (const bat of this.giantBats) { // Added loop
        if (bat.health > 0 && checkRectOverlap(this.player, bat)) {
            this.handlePlayerDamage("giant_bat"); // Use specific source type
            return; // Process one hit per frame max
        }
    }
    // Ground Patrollers
    for (const patroller of this.groundPatrollers) { /* ... existing check ... */ }
    // Cacti
    for (const platform of this.platforms) { /* ... existing check ... */ }
}
```

*   In `GameplayScene.checkAttackCollisions()`:
    *   **After** the loop checking regular bats, add a similar loop for `this.giantBats`.
    *   Inside the loop, check `bat.health > 0 && checkRectOverlap(attackHitbox, bat)`.
    *   Decrement health: `bat.health--;`.
    *   Emit hit sparks: `this.effectsSystem.emitRewardSparkles(...)`.
    *   Apply knockback. Maybe giant bats are harder to knock back: `bat.velocityX = knockbackDir * SWORD_KNOCKBACK_STRENGTH * 0.5;` and `bat.velocityY = SWORD_VERTICAL_KNOCKBACK * 0.5;`.
    *   Set `hitSomething = true;`.
    *   Trigger a specific hit sound? `triggerGiantBatHitSound()`.

```javascript
// Inside GameplayScene.checkAttackCollisions
// Check Bats
for (const bat of this.bats) { /* ... existing check ... */ }

// Check Giant Bats (New loop)
for (const bat of this.giantBats) {
    if (bat.health > 0 && checkRectOverlap(attackHitbox, bat)) {
        bat.health--; // Decrement health
        this.effectsSystem.emitRewardSparkles(bat.x + bat.width / 2, bat.y + bat.height / 2, 8, '#ffddcc'); // More/different sparks?
        // Apply reduced knockback?
        bat.velocityX = knockbackDir * SWORD_KNOCKBACK_STRENGTH * 0.5;
        bat.velocityY = SWORD_VERTICAL_KNOCKBACK * 0.5;
        hitSomething = true;
        if (bat.health > 0) {
            // Optional: triggerGiantBatHit(game.audioCtx.currentTime);
            if (game && game.audioCtx) triggerPatrollerHit(game.audioCtx.currentTime); // Reuse patroller hit sound for now?
        }
        // Death effects handled in updateGiantBats
    }
}

// Check Ground Patrollers
for (const patroller of this.groundPatrollers) { /* ... existing check ... */ }

if (hitSomething && game && game.audioCtx) {
    triggerSwordHit(game.audioCtx.currentTime); // General sword hit sound
}
```

*   In `GameplayScene.updateFireballs()`:
    *   **After** the loop checking regular bats, add a similar loop for `this.giantBats`.
    *   Check overlap: `checkRectOverlap({ x: fb.x - fb.radius, y: fb.y - fb.radius, width: fb.radius * 2, height: fb.radius * 2 }, bat)`.
    *   Handle health: Decide if one fireball kills it or just damages it. For simplicity now, let's say it kills: `bat.health = 0;`.
    *   Trigger explosion: `fb.active = false; this.triggerFireballExplosion(fb.x, fb.y); break;`.

```javascript
// Inside GameplayScene.updateFireballs

// Check collision with bats
for (const bat of this.bats) { /* ... existing check ... */ }
if (!fb.active) continue;

// Check collision with giant bats (New loop)
for (const bat of this.giantBats) {
    if (bat.health > 0 && checkRectOverlap({ x: fb.x - fb.radius, y: fb.y - fb.radius, width: fb.radius * 2, height: fb.radius * 2 }, bat)) {
        // Option 1: Kill instantly (like regular bats)
        bat.health = 0;
        // Option 2: Damage (e.g., bat.health -= 2;) - Requires death check in updateGiantBats
        fb.active = false;
        this.triggerFireballExplosion(fb.x, fb.y); // Explosion will handle effects
        break; // Stop checking enemies for this fireball
    }
}
if (!fb.active) continue;

// Check collision with ground patrollers
for (const patroller of this.groundPatrollers) { /* ... existing check ... */ }
```

*   In `GameplayScene.triggerFireballExplosion()`:
    *   **After** the loop checking regular bats, add a similar loop for `this.giantBats` to apply splash damage.
    *   Check distance squared.
    *   Reduce health if within radius: `bat.health = 0;` (or `bat.health -= 1;` if they survive direct hits).

```javascript
// Inside GameplayScene.triggerFireballExplosion

// Damage Bats
for (const bat of this.bats) { /* ... existing check ... */ }

// Damage Giant Bats (New loop)
for (const bat of this.giantBats) {
    if (bat.health > 0) {
        const dx = (bat.x + bat.width / 2) - x;
        const dy = (bat.y + bat.height / 2) - y;
        if (dx * dx + dy * dy < explosionRadiusSq) {
            // Kill or damage giant bat in explosion
            bat.health = 0; // Or bat.health -= 1;
            // Death effects handled in updateGiantBats
        }
    }
}

// Damage Ground Patrollers
for (const patroller of this.groundPatrollers) { /* ... existing check ... */ }
```

*   In `GameplayScene.triggerOrbBomb()`:
    *   **After** the loop checking regular bats, add a similar loop for `this.giantBats`.
    *   Check distance squared.
    *   Kill if within radius: `bat.health = 0; batsDestroyed++; this.effectsSystem.emitBatExplosion(...);` (Use a bigger/different explosion effect?).

```javascript
// Inside GameplayScene.triggerOrbBomb
let giantBatsDestroyed = 0; // Add counter

// Destroy Bats
for (let i = this.bats.length - 1; i >= 0; i--) { /* ... existing check ... */ }

// Destroy Giant Bats (New loop)
for (let i = this.giantBats.length - 1; i >= 0; i--) {
    const bat = this.giantBats[i];
    if (bat.health > 0) {
        const batCenterX = bat.x + bat.width / 2;
        const batCenterY = bat.y + bat.height / 2;
        const dx = playerCenterX - batCenterX;
        const dy = playerCenterY - batCenterY;
        const distSq = dx * dx + dy * dy;
        if (distSq < destroyRadiusSq) {
            bat.health = 0;
            giantBatsDestroyed++;
            // Use a different/bigger explosion effect maybe?
             this.effectsSystem.emitBatExplosion(batCenterX, batCenterY, 30, '#704080'); // More particles?
             // Add specific sound later?
        }
    }
}

this.effectsSystem.emitPlayerBombExplosion(playerCenterX, playerCenterY);
console.log(`Bomb destroyed ${batsDestroyed} bats and ${giantBatsDestroyed} giant bats.`); // Update log
```

**6. Update Reset Logic:**

*   In `GameplayScene.restartCurrentLevelOnDeath()`:
    *   **After** the loop resetting regular bats, add a similar loop for `this.giantBats`.
    *   Reset position, velocity, state, target, timer, but only if `bat.health > 0`.

```javascript
// Inside GameplayScene.restartCurrentLevelOnDeath

// Reset Bats
this.bats.forEach(bat => { /* ... existing check ... */ });

// Reset Giant Bats (New loop)
this.giantBats.forEach(bat => {
    if (bat.health > 0) { // Only reset living giant bats
        bat.x = bat.originX - bat.width / 2;
        bat.y = bat.originY - bat.height / 2;
        bat.velocityX = 0;
        bat.velocityY = 0;
        bat.state = (Math.random() < 0.5) ? 'idle' : 'patrolling';
        [bat.patrolTargetX, bat.patrolTargetY] = getRandomPatrolPoint(bat.originX, bat.originY, bat.patrolRange);
        bat.stateTimer = getRandom(2, 5); // Reset timer
        bat.randomMoveTimer = getRandom(0, 1.5);
    }
    // Dead giant bats remain dead
});

// Reset Ground Patrollers
this.groundPatrollers.forEach(p => { /* ... existing check ... */ });
```

**7. Add Drawing Function:**

*   In `GameplayScene`:
    *   Create a new function `drawGiantBat(bat, ctx)`.
    *   *Copy* the `drawBat` function.
    *   *Rename* the copied function to `drawGiantBat`.
    *   Modify the drawing logic to reflect the larger size and potentially different colors/details.
    *   Add a simple health bar above it if `bat.health < giantBatProto.health`.

```javascript
// Inside GameplayScene class, near drawBat

drawGiantBat(bat, ctx) {
    ctx.save();
    // Darker purple/grey color?
    ctx.fillStyle = '#403050'; // Darker base color
    const centerX = bat.x + bat.width / 2;
    const centerY = bat.y + bat.height / 2;

    // Use bat's actual width/height for drawing proportions
    const wingSpan = bat.width * 0.7;
    const wingHeight = bat.height * 0.5;
    const bodyWidth = bat.width * 0.4;
    const bodyHeight = bat.height * 0.8;
    const flapAmount = Math.sin(bat.flapTimer) * wingHeight * 0.4; // Less pronounced flap?

    // Body ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (simpler triangles for larger size?)
    ctx.fillStyle = '#504060'; // Slightly lighter wing color
    ctx.beginPath();
    // Left Wing
    ctx.moveTo(centerX - bodyWidth * 0.3, centerY - bodyHeight * 0.2); // Wing root
    ctx.lineTo(centerX - wingSpan, centerY + flapAmount - wingHeight * 0.3); // Outer top point
    ctx.lineTo(centerX - wingSpan * 0.8, centerY + flapAmount + wingHeight * 0.7); // Outer bottom point
    ctx.closePath();
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(centerX + bodyWidth * 0.3, centerY - bodyHeight * 0.2); // Wing root
    ctx.lineTo(centerX + wingSpan, centerY + flapAmount - wingHeight * 0.3); // Outer top point
    ctx.lineTo(centerX + wingSpan * 0.8, centerY + flapAmount + wingHeight * 0.7); // Outer bottom point
    ctx.closePath();
    ctx.fill();

    // Eyes (larger?)
    ctx.fillStyle = '#ff8888'; // More menacing red?
    const eyeSize = 4;
    ctx.fillRect(centerX - bodyWidth * 0.2, centerY - bodyHeight * 0.2, eyeSize, eyeSize);
    ctx.fillRect(centerX + bodyWidth * 0.2 - eyeSize, centerY - bodyHeight * 0.2, eyeSize, eyeSize);


    // Health Bar
     if (bat.health < giantBatProto.health && bat.health > 0) { // Check health > 0 too
         const healthBarWidth = bat.width * 0.7;
         const healthBarX = bat.x + (bat.width - healthBarWidth) / 2;
         const healthBarY = bat.y - 10; // Position above the bat
         ctx.fillStyle = '#555'; // Background
         ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 5); // Slightly thicker bar
         // Color transitions from green to red maybe?
         const healthRatio = bat.health / giantBatProto.health;
         const hue = healthRatio * 120; // 0=red, 120=green
         ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
         ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthRatio, 5);
     }

    ctx.restore();
}
```

*   In `GameplayScene.render()`:
    *   **After** the loop drawing regular bats, add a loop to draw giant bats: `this.giantBats.forEach(b => { if (b.health > 0) this.drawGiantBat(b, ctx); });`

```javascript
// Inside GameplayScene.render, inside the ctx.translate block

// Enemies
this.bats.forEach(b => { if (b.health > 0) this.drawBat(b, ctx); });
this.giantBats.forEach(b => { if (b.health > 0) this.drawGiantBat(b, ctx); }); // Draw giant bats
this.groundPatrollers.forEach(p => { if (p.health > 0) this.drawGroundPatroller(p, ctx); });
```

**8. Testing and Tuning:**

*   Run the game.
*   Verify giant bats spawn correctly.
*   Check their movement patterns (patrol, chase, return).
*   Test collisions with the player.
*   Test hitting them with the sword and fireballs – check health reduction and knockback.
*   Test the shield bomb effect on them.
*   Ensure they die correctly and trigger effects (placeholder effect for now).
*   Ensure they reset correctly on player death.
*   Adjust constants (`NUM_GIANT_BATS_TO_SPAWN`, `giantBatProto` stats) for difficulty and balance.
*   *(Future)* Create specific sounds and particle effects for giant bat hit/death and integrate them.

This provides a solid foundation for the Giant Bat enemy. Good luck!