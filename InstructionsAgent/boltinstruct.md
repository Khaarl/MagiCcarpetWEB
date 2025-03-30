Okay, here is an instruction prompt for a coding agent to add the Lightning Bolt attack and remap the Fireball attack in the provided HTML/JavaScript code.

```prompt
**Objective:** Modify the provided HTML/JavaScript game code (`magic carpet WEB desert BETA.html`) to introduce a new "Lightning Bolt" attack mapped to the '1' key and remap the existing "Fireball" attack to the '2' key.

**Detailed Instructions:**

1.  **Constants Definition:**
    *   Locate the `// --- Fireball Constants ---` section.
    *   Add a new section below it: `// --- Lightning Bolt Constants ---`.
    *   Define the following constants within this new section:
        *   `LIGHTNING_BOLT_SPEED`: Set to `650` (faster than fireball).
        *   `LIGHTNING_BOLT_WIDTH`: Set to `10`.
        *   `LIGHTNING_BOLT_LENGTH`: Set to `35`.
        *   `LIGHTNING_BOLT_COOLDOWN`: Set to `0.8` (longer cooldown than fireball).
        *   `LIGHTNING_BOLT_LIFESPAN`: Set to `2.0` (shorter lifespan).
        *   `LIGHTNING_BOLT_COLOR`: Set to `'#ccffff'`. // Light cyan/white
        *   `LIGHTNING_BOLT_GLOW_COLOR`: Set to `'rgba(180, 220, 255, 0.7)'`.
        *   `LIGHTNING_BOLT_IMPACT_PARTICLES`: Set to `15`.
        *   `LIGHTNING_BOLT_IMPACT_COLOR`: Set to `'#ddeeff'`.

2.  **Player State Modification:**
    *   Locate the `player` object definition (`const player = { ... };`).
    *   Add a new property: `lightningBoltCooldownTimer: 0`.
    *   In the `GameplayScene.generateLevel` function, inside the player reset section, add the line: `this.player.lightningBoltCooldownTimer = 0;`
    *   In the `GameplayScene.restartCurrentLevelOnDeath` function, add the line: `this.player.lightningBoltCooldownTimer = 0;`

3.  **Input Handling Modification:**
    *   **Key Mapping (`Game.initInput`):**
        *   Find the `keydown` event listener.
        *   Change the line `if (key === 'f') this.inputState.keys.f = true;` to `if (key === '2') this.inputState.keys.shootFireball = true;`
        *   Add a new line: `if (key === '1') this.inputState.keys.shootLightning = true;`
        *   Find the `keyup` event listener.
        *   Change the line `if (key === 'f') this.inputState.keys.f = false;` to `if (key === '2') this.inputState.keys.shootFireball = false;`
        *   Add a new line: `if (key === '1') this.inputState.keys.shootLightning = false;`
        *   Update the initial `this.inputState` definition in the `Game` constructor to reflect these changes: Remove `f: false` and add `shootFireball: false, shootLightning: false`.
    *   **Player Update Logic (`GameplayScene.updatePlayer`):**
        *   Find the line defining `combinedInput`: `const combinedInput = { ... };`
        *   Change the `shoot` property definition from `shoot: kbdInput.f` to `shootFireball: kbdInput.shootFireball`.
        *   Add a new property: `shootLightning: kbdInput.shootLightning`.
        *   Find the `// --- Fireball Shooting ---` section.
        *   Change the condition from `if (input.shoot && ...)` to `if (input.shootFireball && this.player.fireballCooldownTimer <= 0)`.
        *   Add a new section below it: `// --- Lightning Bolt Shooting ---`.
        *   Inside this new section, add:
            ```javascript
            if (input.shootLightning && this.player.lightningBoltCooldownTimer <= 0) {
                this.spawnLightningBolt();
                this.player.lightningBoltCooldownTimer = LIGHTNING_BOLT_COOLDOWN;
            }
            ```
        *   Find the timer updates section (`// --- Timers ---`).
        *   Add a new line: `if (this.player.lightningBoltCooldownTimer > 0) this.player.lightningBoltCooldownTimer -= dt;`

4.  **Lightning Bolt Projectile Prototype:**
    *   Locate the `fireballProto` definition.
    *   Add a new prototype definition below it:
        ```javascript
        const lightningBoltProto = {
            x: 0, y: 0, vx: 0, vy: 0,
            width: LIGHTNING_BOLT_WIDTH, length: LIGHTNING_BOLT_LENGTH,
            angle: 0, // Angle of the bolt
            life: LIGHTNING_BOLT_LIFESPAN,
            active: false
        };
        ```

5.  **Gameplay Scene Initialization:**
    *   In the `GameplayScene` constructor, add `this.lightningBolts = [];` after `this.fireballs = [];`.
    *   In `GameplayScene.generateLevel`, add `this.lightningBolts = [];` to clear bolts on level generation.
    *   In `GameplayScene.restartCurrentLevelOnDeath`, add `this.lightningBolts = [];` to clear bolts on death.

6.  **Lightning Bolt Spawning Logic (`GameplayScene`):**
    *   Create a new method `spawnLightningBolt` within the `GameplayScene` class, similar to `spawnFireball`:
        ```javascript
        spawnLightningBolt() {
            // Use existing mouse aiming logic from spawnFireball
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;

            const cameraX = playerCenterX - canvas.width / 3;
            const cameraX_clamped = Math.max(0, Math.min(this.levelEndX - canvas.width, cameraX));
            const targetX = this.game.mouseX + cameraX_clamped;
            const targetY = this.game.mouseY;

            const dirX = targetX - playerCenterX;
            const dirY = targetY - playerCenterY;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            if (distance > 0) {
                const normalizedDirX = dirX / distance;
                const normalizedDirY = dirY / distance;

                const bolt = { ...lightningBoltProto }; // Create new bolt instance
                const spawnDistance = this.player.width / 2 + 5; // Spawn closer than fireball

                bolt.x = playerCenterX + normalizedDirX * spawnDistance;
                bolt.y = playerCenterY + normalizedDirY * spawnDistance;
                bolt.vx = normalizedDirX * LIGHTNING_BOLT_SPEED;
                bolt.vy = normalizedDirY * LIGHTNING_BOLT_SPEED;
                bolt.angle = Math.atan2(normalizedDirY, normalizedDirX); // Store angle for drawing
                bolt.life = LIGHTNING_BOLT_LIFESPAN;
                bolt.active = true;

                this.lightningBolts.push(bolt);
                this.player.facingDirection = normalizedDirX >= 0 ? 'right' : 'left'; // Update player facing direction

                // TODO: Add Lightning Cast Sound Trigger here later
                 if (game && game.audioCtx) triggerLightningCast(game.audioCtx.currentTime);
            }
        }
        ```

7.  **Lightning Bolt Update Logic (`GameplayScene`):**
    *   Create a new method `updateLightningBolts(dt)` within `GameplayScene`, adapting the logic from `updateFireballs`:
        ```javascript
        updateLightningBolts(dt) {
            for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                const bolt = this.lightningBolts[i];
                if (!bolt.active) continue;

                bolt.life -= dt;
                if (bolt.life <= 0) {
                    bolt.active = false;
                    this.triggerLightningImpact(bolt.x, bolt.y); // Impact effect at end of life
                    continue;
                }

                bolt.x += bolt.vx * dt;
                bolt.y += bolt.vy * dt;

                // Simplified collision rect based on angle
                // This is approximate, assumes bolt aligned with velocity
                const checkRect = {
                     x: bolt.x - bolt.length / 2, // Centered approx
                     y: bolt.y - bolt.width / 2,
                     width: bolt.length,
                     height: bolt.width
                 };
                 // For more accuracy, collision would need rotation math

                // Check collision with platforms
                for (const platform of this.platforms) {
                    // Quick check using the simple rect first
                    if (checkRectOverlap(checkRect, platform)) {
                         // More precise check might be needed depending on visual
                         // For now, simple overlap triggers impact
                        bolt.active = false;
                        this.triggerLightningImpact(bolt.x, bolt.y);
                        break;
                    }
                }
                if (!bolt.active) continue;

                // --- Enemy Collisions ---
                let hitEnemy = false;

                // Bats
                for (const bat of this.bats) {
                    if (bat.health > 0 && checkRectOverlap(checkRect, bat)) {
                        bat.health = 0;
                        this.effectsSystem.emitBatExplosion(bat.x + bat.width / 2, bat.y + bat.height / 2, 8, '#aaddff'); // Different color sparks
                        hitEnemy = true; break;
                    }
                }
                if (hitEnemy) { bolt.active = false; this.triggerLightningImpact(bolt.x, bolt.y); continue; }

                // Patrollers
                for (const patroller of this.groundPatrollers) {
                     if (patroller.health > 0 && checkRectOverlap(checkRect, patroller)) {
                         patroller.health = 0; // Lightning destroys patrollers instantly
                         this.effectsSystem.emitBatExplosion(patroller.x + patroller.width / 2, patroller.y + patroller.height / 2, 10, '#aaddff');
                         if (game && game.audioCtx) triggerPatrollerDestroy(game.audioCtx.currentTime); // Reuse destroy sound
                         hitEnemy = true; break;
                     }
                }
                 if (hitEnemy) { bolt.active = false; this.triggerLightningImpact(bolt.x, bolt.y); continue; }

                // Snakes
                for (const snake of this.snakes) {
                    if (snake.health > 0 && checkRectOverlap(checkRect, snake)) {
                        snake.health = 0; // Lightning kills snakes
                        this.effectsSystem.emitBatExplosion(snake.x + snake.width / 2, snake.y + snake.height / 2, 10, '#aaddff');
                         hitEnemy = true; break;
                    }
                }
                if (hitEnemy) { bolt.active = false; this.triggerLightningImpact(bolt.x, bolt.y); continue; }

                // Giant Bat Boss
                 if (this.boss && this.boss.health > 0 && checkRectOverlap(checkRect, this.boss)) {
                     this.boss.health -= 2; // Lightning does more damage to boss
                     this.effectsSystem.emitRewardSparkles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 15, LIGHTNING_BOLT_IMPACT_COLOR);
                     hitEnemy = true;
                 }
                 if (hitEnemy) { bolt.active = false; this.triggerLightningImpact(bolt.x, bolt.y); continue; }

            }
            // Clean up inactive bolts
            this.lightningBolts = this.lightningBolts.filter(bolt => bolt.active);
        }
        ```
    *   Call this new update function from `GameplayScene.update` after `updateFireballs`:
        ```javascript
        this.updateLightningBolts(deltaTime);
        ```

8.  **Lightning Bolt Impact Logic (`GameplayScene`):**
    *   Create a new method `triggerLightningImpact(x, y)` in `GameplayScene`:
        ```javascript
        triggerLightningImpact(x, y) {
            this.effectsSystem.emitLightningSparks(x, y); // Need to add this effect function
            if (game && game.audioCtx) triggerLightningHit(game.audioCtx.currentTime); // Need to add this sound function
            // No area damage for lightning, just direct hit (unlike fireball explosion)
        }
        ```

9.  **Effects System Modification (`createEffectsSystem`):**
    *   Inside the `createEffectsSystem` function, add a new method to the returned object:
        ```javascript
        emitLightningSparks(x, y, count = LIGHTNING_BOLT_IMPACT_PARTICLES, color = LIGHTNING_BOLT_IMPACT_COLOR) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * PARTICLE_SPEED * 1.8 + PARTICLE_SPEED * 0.6; // Faster sparks
                const life = PARTICLE_LIFESPAN * (0.2 + Math.random() * 0.4); // Shorter life
                const particle = particlePool.get();
                if (!particle) continue;
                particle.x = x + getRandom(-3, 3);
                particle.y = y + getRandom(-3, 3);
                particle.vx = Math.cos(angle) * velocity;
                particle.vy = Math.sin(angle) * velocity;
                // Mix white and the impact color
                 const lerp = Math.random();
                 const r = Math.floor(parseInt(color.slice(1,3), 16) * (1-lerp) + 255 * lerp);
                 const g = Math.floor(parseInt(color.slice(3,5), 16) * (1-lerp) + 255 * lerp);
                 const b = Math.floor(parseInt(color.slice(5,7), 16) * (1-lerp) + 255 * lerp);
                 particle.color = `rgb(${r},${g},${b})`;
                 particle.size = getRandom(1.5, 4);
                 particle.life = particle.maxLife = life;
                 particle.useGravity = Math.random() < 0.3; // Some fall, some don't
                 particle.drag = PARTICLE_DRAG * 0.96;
            }
        },
        ```

10. **Audio Function Creation:**
    *   Add two new sound functions near the other `trigger...` sound functions:
        ```javascript
        function triggerLightningCast(time) {
            if (!game || !game.audioCtx || !game.masterGain) return;
            try {
                // Sharp crack sound
                const noiseSource = game.audioCtx.createBufferSource();
                const noiseBuf = createWhiteNoiseBuffer(0.15);
                if (!noiseBuf) return;
                noiseSource.buffer = noiseBuf;
                const filter = game.audioCtx.createBiquadFilter();
                const gain = game.audioCtx.createGain();

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(3000, time);
                filter.Q.setValueAtTime(15, time);
                filter.frequency.exponentialRampToValueAtTime(600, time + 0.1);

                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

                noiseSource.connect(filter);
                filter.connect(gain);
                gain.connect(game.masterGain); // Connect directly, less distortion maybe
                noiseSource.start(time);
                noiseSource.stop(time + 0.15);

                // Add a quick rising tone
                const osc = game.audioCtx.createOscillator();
                const oscGain = game.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, time);
                osc.frequency.exponentialRampToValueAtTime(2400, time + 0.08);
                oscGain.gain.setValueAtTime(0.15, time);
                oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
                osc.connect(oscGain);
                oscGain.connect(game.masterGain);
                osc.start(time);
                osc.stop(time + 0.1);

            } catch(e) { console.error("Error in triggerLightningCast:", e); }
        }

        function triggerLightningHit(time) {
             if (!game || !game.audioCtx || !game.distortion || !game.masterGain) return;
             try {
                 // Similar to sword hit but sharper/brighter
                 const noiseSource = game.audioCtx.createBufferSource();
                 const noiseBuf = createWhiteNoiseBuffer(0.1);
                 if (!noiseBuf) return;
                 noiseSource.buffer = noiseBuf;
                 const filter = game.audioCtx.createBiquadFilter();
                 const gain = game.audioCtx.createGain();

                 filter.type = 'highpass';
                 filter.frequency.setValueAtTime(4000, time);
                 gain.gain.setValueAtTime(0.35, time);
                 gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);

                 noiseSource.connect(filter);
                 filter.connect(gain);
                 gain.connect(game.distortion); // Use distortion for impact crackle
                 noiseSource.start(time);
                 noiseSource.stop(time + 0.1);

                 // Quick pop sound
                 const osc = game.audioCtx.createOscillator();
                 const gainOsc = game.audioCtx.createGain();
                 osc.type = 'triangle';
                 osc.frequency.setValueAtTime(350, time);
                 osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
                 gainOsc.gain.setValueAtTime(0.4, time);
                 gainOsc.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
                 osc.connect(gainOsc);
                 gainOsc.connect(game.masterGain);
                 osc.start(time);
                 osc.stop(time + 0.07);
             } catch(e) { console.error("Error in triggerLightningHit:", e); }
         }
        ```

11. **Drawing Logic (`GameplayScene`):**
    *   Create a new method `drawLightningBolt(bolt, ctx)` within `GameplayScene`:
        ```javascript
        drawLightningBolt(bolt, ctx) {
            if (!bolt.active) return;
            ctx.save();

            // Position and rotate context
            ctx.translate(bolt.x, bolt.y);
            ctx.rotate(bolt.angle);

            // Draw the main bolt shape (rectangle)
            const halfWidth = bolt.width / 2;
            ctx.fillStyle = LIGHTNING_BOLT_COLOR;
            ctx.shadowColor = LIGHTNING_BOLT_GLOW_COLOR;
            ctx.shadowBlur = 8;
            ctx.fillRect(-bolt.length / 2, -halfWidth, bolt.length, bolt.width);

             // Optional: Add a brighter core line
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.shadowColor = 'transparent'; // Turn off shadow for core
             ctx.fillRect(-bolt.length / 2, -halfWidth * 0.4, bolt.length, bolt.width * 0.8);

            ctx.restore();
        }
        ```
    *   Call this new draw function from `GameplayScene.render`, inside the `ctx.translate(-cameraX, -cameraY);` block, after drawing fireballs:
        ```javascript
        this.lightningBolts.forEach(bolt => this.drawLightningBolt(bolt, ctx));
        ```

12. **Update UI Instructions:**
    *   Find the `<div id="instructions">...</div>` element in the HTML.
    *   Change the text content to:
        `Arrows/AD: Move | W/Up/Space: Fly/Jump | X: Attack | 1: Lightning Bolt | 2: Fireball | R: New Level/Next | M: Mute`

**Final Check:** Ensure all references to the old fireball key ('f') and its associated input state (`kbdInput.f`, `inputState.keys.f`) have been replaced or removed, and the new keys ('1', '2') and states (`shootLightning`, `shootFireball`) are used correctly.
```

This prompt breaks down the task into logical steps, specifies constant values, provides code snippets for new functions and modifications, and addresses all aspects including input, state, logic, effects, audio, drawing, and UI updates.