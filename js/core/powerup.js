// magic-carpet-game/js/core/powerup.js

import * as C from '../config.js'; // Import game constants

/**
 * Manages power-ups and their effects, including the orbiting shield system.
 */
export class PowerUpSystem {
    /**
     * Creates a PowerUpSystem instance to manage power-ups for a player.
     * @param {object} player - Reference to the player object to apply effects to.
     */
    constructor(player) {
        this.player = player;
        this.orbiterAngle = 0; // Current angle for orbiting shield elements
        this.activePowerUps = []; // Tracks active power-up effects and their timers
        console.log("PowerUpSystem initialized.");
    }

    /**
     * Updates all power-up effects, including orbiting shield positions.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        // Update the orbiter angle for shield orbs
        this.orbiterAngle += C.ORBITER_SPEED * deltaTime;
        
        // Keep angle within 0-2π range for consistency
        if (this.orbiterAngle > Math.PI * 2) {
            this.orbiterAngle -= Math.PI * 2;
        }
        
        // Process any active timed power-ups
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            powerUp.timeRemaining -= deltaTime;
            
            if (powerUp.timeRemaining <= 0) {
                // Apply effect removal if defined
                if (typeof powerUp.onExpire === 'function') {
                    powerUp.onExpire();
                }
                // Remove expired power-up
                this.activePowerUps.splice(i, 1);
            }
        }
    }

    /**
     * Renders active power-up effects, such as shield orbs orbiting the player.
     * @param {CanvasRenderingContext2D} ctx - The rendering context.
     */
    render(ctx) {
        // Render shield orbs orbiting the player if they have any
        if (this.player && this.player.orbShieldCount > 0) {
            this.renderShieldOrbs(ctx);
        }
        
        // Render any visual effects from other active power-ups
        this.activePowerUps.forEach(powerUp => {
            if (typeof powerUp.render === 'function') {
                powerUp.render(ctx);
            }
        });
    }

    /**
     * Renders the shield orbs orbiting around the player.
     * @param {CanvasRenderingContext2D} ctx - The rendering context.
     */
    renderShieldOrbs(ctx) {
        const count = this.player.orbShieldCount;
        if (count <= 0) return;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        ctx.fillStyle = C.ORBITER_COLOR;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        
        // Render each shield orb
        for (let i = 0; i < count; i++) {
            // Calculate position in circular orbit, evenly spaced
            const angle = this.orbiterAngle + (i * (Math.PI * 2) / count);
            const x = playerCenterX + Math.cos(angle) * C.ORBITER_DISTANCE;
            const y = playerCenterY + Math.sin(angle) * C.ORBITER_DISTANCE;
            
            // Draw the orb
            ctx.beginPath();
            ctx.arc(x, y, C.ORBITER_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Optional: Add a glow effect
            ctx.beginPath();
            ctx.arc(x, y, C.ORBITER_RADIUS * 1.5, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                x, y, C.ORBITER_RADIUS * 0.5,
                x, y, C.ORBITER_RADIUS * 1.5
            );
            gradient.addColorStop(0, 'rgba(128, 255, 128, 0.5)');
            gradient.addColorStop(1, 'rgba(128, 255, 128, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    /**
     * Adds a shield orb to the player and returns the new count.
     * @returns {number} The updated shield orb count.
     */
    addShieldOrb() {
        if (this.player) {
            this.player.orbShieldCount++;
            return this.player.orbShieldCount;
        }
        return 0;
    }

    /**
     * Uses a shield orb to absorb damage, if available.
     * @returns {boolean} True if a shield was used, false if no shields available.
     */
    useShield() {
        if (this.player && this.player.orbShieldCount > 0) {
            this.player.orbShieldCount--;
            return true;
        }
        return false;
    }

    /**
     * Activates a temporary power-up effect.
     * @param {string} type - The type of power-up to activate.
     * @param {number} duration - Duration in seconds the power-up should last.
     * @param {object} params - Additional parameters for the specific power-up.
     */
    activatePowerUp(type, duration, params = {}) {
        // Create power-up effect based on type
        const powerUp = {
            type,
            timeRemaining: duration,
            params,
            // Define onExpire function based on power-up type
            onExpire: () => {
                console.log(`PowerUp ${type} expired`);
                // Reset any temporary effects
                switch (type) {
                    case 'speedBoost':
                        // Example: Reset player speed multiplier
                        if (this.player) this.player.speedMultiplier = 1.0;
                        break;
                    case 'invulnerability':
                        // Example: Remove invulnerability
                        if (this.player) this.player.isInvulnerable = false;
                        break;
                    // Add other power-up types as needed
                }
            }
        };
        
        // Apply immediate effect based on power-up type
        switch (type) {
            case 'speedBoost':
                if (this.player) this.player.speedMultiplier = params.multiplier || 1.5;
                break;
            case 'invulnerability':
                if (this.player) this.player.isInvulnerable = true;
                break;
            // Add other power-up types as needed
        }
        
        // Add to active power-ups
        this.activePowerUps.push(powerUp);
    }

    /**
     * Checks if a specific type of power-up is currently active.
     * @param {string} type - The type of power-up to check for.
     * @returns {boolean} True if the power-up is active, false otherwise.
     */
    isPowerUpActive(type) {
        return this.activePowerUps.some(p => p.type === type);
    }

    /**
     * Clears all active power-ups, e.g., on player death or level reset.
     */
    clearAllPowerUps() {
        // Call onExpire for each power-up to properly clean up effects
        this.activePowerUps.forEach(powerUp => {
            if (typeof powerUp.onExpire === 'function') {
                powerUp.onExpire();
            }
        });
        
        // Clear the array
        this.activePowerUps = [];
    }
}