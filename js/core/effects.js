// magic-carpet-game/js/core/effects.js

import * as C from '../config.js'; // Import constants
import { ParticlePool } from './particle.js'; // Import the particle pool manager
import { getRandom, getRandomInt } from '../utils.js'; // Import random number utilities

/**
 * Factory function to create an effects system instance.
 * This system manages particle effects using a ParticlePool.
 * @returns {object} An object with methods to emit various particle effects, update, and render them.
 */
export function createEffectsSystem() {
    // Increased pool size for potentially many effects simultaneously
    const particlePool = new ParticlePool(2000);
    console.log("EffectsSystem created with particle pool.");

    // --- Emitter Methods ---
    // Each method configures and emits particles for a specific visual effect.

    /** Emits sparkling particles, typically used for rewards or positive feedback. */
    const emitRewardSparkles = (x, y, count, color = C.COLLECTIBLE_COLOR) => {
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue; // Skip if pool somehow fails

            const angle = Math.random() * Math.PI * 2; // Random direction
            // Velocity with some variation
            const velocity = getRandom(C.PARTICLE_SPEED * 0.8, C.PARTICLE_SPEED * 1.2);
            // Lifespan with variation
            const life = C.PARTICLE_LIFESPAN * getRandom(0.7, 1.3);

            // Configure particle properties
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;
            particle.color = color;
            particle.size = getRandom(1, 3.5); // Slightly larger max size
            particle.life = particle.maxLife = life;
            particle.useGravity = false; // Sparkles don't fall
            particle.drag = C.PARTICLE_DRAG * 0.98; // Slightly less drag than default
        }
    };

    /** Emits particles simulating a bat explosion (dark, falling debris). */
    const emitBatExplosion = (x, y, count = 15, color = '#504060') => {
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue;

            const angle = Math.random() * Math.PI * 2;
            // Higher velocity for explosions
            const velocity = getRandom(C.PARTICLE_SPEED * 1.0, C.PARTICLE_SPEED * 2.0);
            const life = C.PARTICLE_LIFESPAN * getRandom(0.6, 1.1);

            // Spawn particles slightly spread out
            particle.x = x + getRandom(-8, 8);
            particle.y = y + getRandom(-8, 8);
            // Add slight upward bias initially before gravity takes over
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity - getRandom(10, 40);
            particle.color = color;
            particle.size = getRandom(2, 5);
            particle.life = particle.maxLife = life;
            particle.useGravity = true; // Debris falls
            particle.drag = C.PARTICLE_DRAG; // Default drag
        }
    };

    /** Emits bright particles for shield break or power-up effects. */
    const emitPlayerBombExplosion = (x, y, count = 40, color = C.ORBITER_COLOR) => {
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue;

            const angle = Math.random() * Math.PI * 2;
            // High velocity outward burst
            const velocity = getRandom(C.PARTICLE_SPEED * 1.5, C.PARTICLE_SPEED * 3.0);
            const life = C.PARTICLE_LIFESPAN * getRandom(0.6, 1.2);

            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;

            // Color variation: Lerp between base color and bright white/yellow
            const lerp = Math.random();
            let r = 255, g = 255, b = 200; // Default bright target
            try { // Protect against invalid hex color strings
                const baseR = parseInt(color.slice(1, 3), 16);
                const baseG = parseInt(color.slice(3, 5), 16);
                const baseB = parseInt(color.slice(5, 7), 16);
                r = Math.floor(baseR * (1 - lerp) + 255 * lerp);
                g = Math.floor(baseG * (1 - lerp) + 255 * lerp);
                b = Math.floor(baseB * (1 - lerp) + 150 * lerp); // Keep some base color tint
            } catch (e) { console.error("Error parsing color in emitPlayerBombExplosion:", color, e); }

            particle.color = `rgb(${r},${g},${b})`;
            particle.size = getRandom(2.5, 6.5); // Larger particles
            particle.life = particle.maxLife = life;
            particle.useGravity = false; // Bright energy doesn't fall
            particle.drag = C.PARTICLE_DRAG * 0.97; // Slightly less drag
        }
    };

    /** Emits a trail of stardust particles behind the player/carpet. */
    const emitPlayerTrail = (x, y, playerWidth, playerHeight, playerVelX, playerVelY) => {
        const count = 1; // Emit one particle per call for a continuous stream
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue;

            // Position near player center/bottom, slightly randomized
            particle.x = x + getRandom(-playerWidth * 0.3, playerWidth * 0.3);
            particle.y = y + getRandom(-playerHeight * 0.1, playerHeight * 0.1);

            // Initial velocity slightly opposite to player movement + random spread
            const baseVelX = -playerVelX * 0.05; // Reduced counter-velocity
            const baseVelY = -playerVelY * 0.05;
            const spreadSpeed = C.STARDUST_SPEED * 0.7; // Control random spread speed
            particle.vx = baseVelX + getRandom(-spreadSpeed, spreadSpeed);
            particle.vy = baseVelY + getRandom(-spreadSpeed, spreadSpeed);

            particle.color = C.STARDUST_COLOR;
            particle.size = getRandom(1, 3.0); // Slightly larger max size
            particle.life = particle.maxLife = C.STARDUST_LIFESPAN * getRandom(0.8, 1.2);
            particle.useGravity = false;
            particle.drag = C.STARDUST_DRAG; // Use specific drag for stardust
        }
    };

    /** Emits crackling lightning particles along the path of the sword swing. */
    const emitSwordLightning = (startX, startY, endX, endY) => {
        const count = getRandomInt(2, 4); // More sparks
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue;

            // Spawn particle randomly along the line segment of the swing
            const lerp = Math.random();
            particle.x = startX + (endX - startX) * lerp;
            particle.y = startY + (endY - startY) * lerp;

            // Emit particle perpendicular to the sword's direction + randomness
            const swordAngle = Math.atan2(endY - startY, endX - startX);
            // Emit roughly perpendicular +/- random angle
            const emitAngle = swordAngle + (Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1)) + getRandom(-0.6, 0.6);
            const velocity = C.SWORD_LIGHTNING_SPEED * getRandom(0.7, 1.3);

            particle.vx = Math.cos(emitAngle) * velocity;
            particle.vy = Math.sin(emitAngle) * velocity;
            particle.color = C.SWORD_LIGHTNING_COLOR;
            particle.size = getRandom(1, 2.5);
            particle.life = particle.maxLife = C.SWORD_LIGHTNING_LIFESPAN * getRandom(0.7, 1.3);
            particle.useGravity = false;
            particle.drag = 0.92; // Lightning sparks have less drag
        }
    };

    /** Emits fiery particles for a fireball explosion. */
    const emitFireballExplosion = (x, y, count = C.FIREBALL_EXPLOSION_PARTICLES, color = C.FIREBALL_EXPLOSION_COLOR) => {
        for (let i = 0; i < count; i++) {
            const particle = particlePool.get();
            if (!particle) continue;

            const angle = Math.random() * Math.PI * 2;
            // Explosion particles have high initial velocity
            const velocity = getRandom(C.PARTICLE_SPEED * 1.0, C.PARTICLE_SPEED * 2.5);
            const life = C.PARTICLE_LIFESPAN * getRandom(0.5, 1.0);

            // Spawn slightly spread out from center
            particle.x = x + getRandom(-8, 8);
            particle.y = y + getRandom(-8, 8);
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity;

            // Color variation: Lerp between base explosion color and bright yellow/white
            const lerp = Math.random();
            let r = 255, g = 220, b = 100; // Target bright yellow
            try { // Protect against invalid hex color strings
                const baseR = parseInt(color.slice(1, 3), 16);
                const baseG = parseInt(color.slice(3, 5), 16);
                const baseB = parseInt(color.slice(5, 7), 16);
                r = Math.floor(baseR * (1 - lerp) + 255 * lerp); // Lerp towards target R
                g = Math.floor(baseG * (1 - lerp) + 220 * lerp); // Lerp towards target G
                b = Math.floor(baseB * (1 - lerp) + 100 * lerp); // Lerp towards target B
            } catch (e) { console.error("Error parsing color in emitFireballExplosion:", color, e); }

            particle.color = `rgb(${r},${g},${b})`;
            particle.size = getRandom(2, 6); // Larger fiery particles
            particle.life = particle.maxLife = life;
            particle.useGravity = true; // Fiery debris should fall
            particle.drag = C.PARTICLE_DRAG * 0.98; // Slightly less drag for fiery bits
        }
    };

    // --- System Methods ---

    /** Updates the state of all active particles in the pool. */
    const update = (deltaTime) => {
        particlePool.update(deltaTime);
    };

    /** Renders all active particles onto the provided canvas context. */
    const render = (ctx) => {
        particlePool.render(ctx);
    };

    /** Gets the current number of active particles. */
    const getActiveCount = () => {
        return particlePool.getActiveCount();
    }

    /** Gets the current number of active particles. */
    const getActiveParticleCount = () => {
        return particlePool.getActiveCount();
    }

    // Return the public interface of the effects system
    return {
        emitRewardSparkles,
        emitBatExplosion,
        emitPlayerBombExplosion,
        emitPlayerTrail,
        emitSwordLightning,
        emitFireballExplosion,
        update,
        render,
        getActiveCount,                // Renamed to match how it's called in gameplayScene.js
        getActiveParticleCount: getActiveCount  // Keep the old name as an alias for backward compatibility
    };
}