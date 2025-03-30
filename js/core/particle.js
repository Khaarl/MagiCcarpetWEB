// magic-carpet-game/js/core/particle.js

import * as C from '../config.js'; // Import constants for configuration values
// Note: No dependency on utils.js in this file

/**
 * Manages a pool of particle objects to reuse them instead of creating new ones frequently,
 * improving performance by reducing garbage collection.
 */
export class ParticlePool {
    /**
     * Creates an instance of ParticlePool.
     * @param {number} size - The initial number of particles to create in the pool.
     */
    constructor(size) {
        /** @type {Array<object>} */
        this.pool = []; // Stores inactive particles ready for reuse.
        /** @type {Array<object>} */
        this.activeParticles = []; // Stores particles currently being updated and rendered.

        // Pre-populate the pool with particle objects.
        for (let i = 0; i < size; i++) {
            this.pool.push(this.createParticle());
        }
        console.log(`ParticlePool initialized with ${size} particles.`);
    }

    /**
     * Creates a single particle object with default properties.
     * @returns {object} A new particle object.
     */
    createParticle() {
        return {
            x: 0, y: 0,         // Position
            vx: 0, vy: 0,         // Velocity
            life: 0,           // Current remaining lifespan (seconds)
            maxLife: 0,        // Initial lifespan (seconds)
            color: '#fff',     // Default color
            size: 2,           // Default size (pixels)
            active: false,     // Is the particle currently in use?
            useGravity: false, // Should gravity affect this particle?
            drag: C.PARTICLE_DRAG // Velocity multiplier per frame (friction)
        };
    }

    /**
     * Retrieves a particle from the pool (or creates a new one if the pool is empty).
     * Marks the particle as active and adds it to the active list.
     * @returns {object} An initialized particle object ready to be configured and used.
     */
    get() {
        let particle;
        if (this.pool.length > 0) {
            // Reuse a particle from the pool
            particle = this.pool.pop();
        } else {
            // Pool is empty, create a new particle (less ideal for performance)
            // console.warn("Particle pool exhausted, creating new particle."); // Optional warning
            particle = this.createParticle();
        }
        // Reset essential properties (although the emitter usually sets these)
        particle.active = true;
        particle.life = 1.0; // Default life, should be overwritten by emitter
        particle.maxLife = 1.0;
        particle.vx = 0;
        particle.vy = 0;
        particle.x = 0;
        particle.y = 0;
        particle.drag = C.PARTICLE_DRAG; // Reset drag to default
        particle.useGravity = false; // Reset gravity usage

        this.activeParticles.push(particle); // Add to the list of active particles
        return particle;
    }

    /**
     * Updates all active particles. Decreases life, updates position based on velocity,
     * applies drag and gravity, and returns dead particles to the pool.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        // Iterate backwards to allow safe removal using splice while iterating.
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];

            // Decrease lifespan
            p.life -= deltaTime;

            // Check if particle has expired
            if (p.life <= 0) {
                p.active = false; // Mark as inactive
                // Remove from active list and return to the pool
                this.pool.push(this.activeParticles.splice(i, 1)[0]);
                continue; // Skip further updates for this dead particle
            }

            // Update position based on velocity
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Apply drag (velocity reduction)
            p.vx *= p.drag;
            p.vy *= p.drag;

            // Apply gravity if enabled for this particle type
            if (p.useGravity) {
                p.vy += C.PARTICLE_GRAVITY * deltaTime;
            }
        }
    }

    /**
     * Renders all active particles onto the canvas.
     * Particles are drawn as simple squares, fading out based on their remaining life.
     * @param {CanvasRenderingContext2D} ctx - The drawing context.
     */
    render(ctx) {
        ctx.save(); // Save context state (like globalAlpha)

        for (const p of this.activeParticles) {
            // Calculate alpha based on remaining life for a fade-out effect.
            // Ensure alpha doesn't go below 0.
            const alpha = Math.max(0, p.life / p.maxLife);
            // Apply base alpha multiplier if desired (e.g., make all particles slightly transparent)
            ctx.globalAlpha = alpha * 0.8; // Example: max 80% opacity

            ctx.fillStyle = p.color;

            // Draw the particle (simple square centered at x, y)
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }

        ctx.restore(); // Restore original context state (globalAlpha)
    }

    /**
     * Gets the number of currently active particles.
     * @returns {number} The count of active particles.
     */
    getActiveCount() {
        return this.activeParticles.length;
    }

    /**
     * Gets the number of inactive particles available in the pool.
     * @returns {number} The count of available particles in the pool.
     */
    getInactiveCount() {
        return this.pool.length;
    }
}