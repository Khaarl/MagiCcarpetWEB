// magic-carpet-game/js/core/powerup.js

/**
 * Manages active power-ups for the player.
 * This is currently a basic placeholder structure.
 * Actual power-up effects need to be implemented within the player's update logic
 * or by having this system directly modify player properties.
 */
export class PowerUpSystem {
    /**
     * Creates an instance of PowerUpSystem.
     * @param {object} player - A reference to the player object.
     */
    constructor(player) {
        /** @type {object} Reference to the player object */
        this.player = player;
        /**
         * Array storing active power-ups and their remaining duration.
         * Example format: [{ type: 'speed', duration: 5.0 }, { type: 'shield', duration: 10.0 }]
         * @type {Array<{type: string, duration: number}>}
         */
        this.activePowerUps = [];
        console.log("PowerUpSystem initialized.");
    }

    /**
     * Updates the duration of active power-ups and removes expired ones.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        // Iterate backwards to safely remove items while looping
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            powerUp.duration -= deltaTime;

            // Check if the power-up has expired
            if (powerUp.duration <= 0) {
                console.log(`Power-up expired: ${powerUp.type}`);
                this.removePowerUpEffect(powerUp.type); // Apply removal logic
                this.activePowerUps.splice(i, 1); // Remove from the active list
            }
        }
    }

    /**
     * Adds a new power-up or resets the duration if it's already active.
     * @param {string} type - The type identifier of the power-up (e.g., 'speed', 'shield', 'tripleShot').
     * @param {number} [duration=10.0] - The duration the power-up should last, in seconds.
     */
    addPowerUp(type, duration = 10.0) {
        // Check if this power-up type is already active
        const existingPowerUp = this.activePowerUps.find(p => p.type === type);

        if (existingPowerUp) {
            // Reset the duration of the existing power-up
            console.log(`Refreshing power-up: ${type}. New duration: ${duration.toFixed(1)}s`);
            existingPowerUp.duration = duration;
        } else {
            // Add the new power-up to the list
            console.log(`Adding power-up: ${type} for ${duration.toFixed(1)}s`);
            this.activePowerUps.push({ type, duration });
            // Apply the initial effect when the power-up is first gained
            this.applyPowerUpEffect(type);
        }
        // Optional: Trigger a sound effect or visual feedback for gaining a power-up
    }

    /**
     * Applies the specific effect when a power-up is gained.
     * This might modify player stats or enable flags.
     * @param {string} type - The type of the power-up being applied.
     */
    applyPowerUpEffect(type) {
        console.log(`Applying effect for power-up: ${type}`);
        switch (type) {
            case 'speed':
                // Placeholder: Player logic should check isActive('speed') to modify speed constants.
                // Or, modify player properties directly: this.player.moveSpeedMultiplier = 1.5; (Requires careful reset)
                console.log("Speed boost applied (logic TBD in player update).");
                break;
            case 'shield':
                // Example: Grant an orb shield if the player doesn't have max shields.
                // Assumes player object has orbShieldCount and a max limit is handled elsewhere.
                if (this.player) {
                    this.player.orbShieldCount = Math.min((this.player.orbShieldCount || 0) + 1, 3); // Add shield, max 3
                    console.log(`Shield power-up granted. Shields: ${this.player.orbShieldCount}`);
                    // GameplayScene needs to update the UI display
                     if (this.player.updateOrbShieldDisplay) this.player.updateOrbShieldDisplay(); // If method exists on player? Or call via game scene.
                 }
                break;
            case 'tripleShot':
                // Placeholder: Player shooting logic should check isActive('tripleShot').
                console.log("Triple Shot enabled (logic TBD in player shooting).");
                break;
            // Add more power-up types here
            default:
                console.warn(`Unknown power-up type applied: ${type}`);
        }
    }

    /**
     * Reverts the effects applied by a power-up when it expires.
     * Needs to counteract the changes made in applyPowerUpEffect.
     * @param {string} type - The type of the power-up being removed.
     */
    removePowerUpEffect(type) {
        console.log(`Removing effect for power-up: ${type}`);
        switch (type) {
            case 'speed':
                // Placeholder: If stats were directly modified, reset them here.
                // this.player.moveSpeedMultiplier = 1.0;
                console.log("Speed boost removed (logic TBD).");
                break;
            case 'shield':
                // Note: Orb shields gained might persist until used, not tied strictly to duration.
                // If the power-up granted temporary invincibility, disable it here.
                console.log("Shield power-up duration ended (orb shields may persist).");
                break;
             case 'tripleShot':
                console.log("Triple Shot disabled (logic TBD).");
                break;
            // Add more cases for other power-up types
            default:
                console.warn(`Unknown power-up type removed: ${type}`);
        }
    }

     /**
      * Checks if a power-up of a specific type is currently active.
      * @param {string} type - The type identifier of the power-up to check.
      * @returns {boolean} True if the power-up is active, false otherwise.
      */
     isActive(type) {
         return this.activePowerUps.some(p => p.type === type);
     }


    /**
     * Optional: Renders indicators for active power-ups on the UI (e.g., icons with timers).
     * @param {CanvasRenderingContext2D} ctx - The drawing context.
     */
    render(ctx) {
        // Example: Draw simple text indicators at the top-left of the screen
        ctx.save();
        ctx.font = "14px 'Lucida Console', Monaco, monospace"; // Monospaced font for timers
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent white
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let yOffset = 80; // Starting Y position below the main HUD
        const xPos = 15;
        const lineHeight = 18;

        this.activePowerUps.forEach(powerUp => {
            // Display power-up type and remaining duration
            const text = `${powerUp.type.toUpperCase()}: ${powerUp.duration.toFixed(1)}s`;
            // Optional background for readability
             // ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
             // ctx.fillRect(xPos - 2, yOffset - 2, ctx.measureText(text).width + 4, lineHeight);
             ctx.fillStyle = "rgba(220, 220, 255, 0.9)"; // Light text color
            ctx.fillText(text, xPos, yOffset);
            yOffset += lineHeight; // Move down for the next indicator
        });

        ctx.restore();
    }

    /**
     * Clears all active power-ups. Useful for restarting levels or game over.
     */
    reset() {
        console.log("Resetting PowerUpSystem - clearing all active power-ups.");
        // Ensure effects are properly removed before clearing the array
        this.activePowerUps.forEach(p => this.removePowerUpEffect(p.type));
        this.activePowerUps = [];
    }
}