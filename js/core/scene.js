// magic-carpet-game/js/core/scene.js

/**
 * Base class for all game scenes (e.g., Title Screen, Gameplay, Game Over).
 * Provides a standard interface for the Game class to manage.
 */
export class Scene {
    constructor() {
        /**
         * A reference to the main Game instance.
         * This will be set automatically by the Game class when the scene is added.
         * @type {Game|null}
         */
        this.game = null;
    }

    /**
     * Called once when this scene becomes the active scene.
     * Use this for setup specific to the scene (e.g., generating level, initializing UI).
     */
    onEnter() {
        // Default implementation does nothing.
        // Override in subclasses (like GameplayScene).
        console.log(`Entering scene: ${this.constructor.name}`);
    }

    /**
     * Called every frame while this scene is active.
     * Handles game logic updates for the scene.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        // Default implementation does nothing.
        // Override in subclasses.
    }

    /**
     * Called every frame while this scene is active, after update().
     * Handles drawing the scene to the canvas.
     * @param {CanvasRenderingContext2D} ctx - The drawing context of the canvas.
     */
    render(ctx) {
        // Default implementation does nothing.
        // Override in subclasses.
    }

    /**
     * Called once when switching away from this scene to another one.
     * Use this for cleanup specific to the scene (e.g., stopping timers, clearing data).
     */
    onExit() {
        // Default implementation does nothing.
        // Override in subclasses.
        console.log(`Exiting scene: ${this.constructor.name}`);
    }

    /**
     * Helper method to check if the scene represents active gameplay
     * (i.e., not paused, won, lost, etc.). Used by the Game class to determine
     * if background music should play.
     * @returns {boolean} True if gameplay is active, false otherwise.
     */
    isGameplayActive() {
        // Default implementation assumes not active gameplay.
        // Override in GameplayScene to return true based on its state (e.g., !gameWon && player.lives > 0).
        return false;
    }

    /**
     * Handles the reset action triggered by the Game class (e.g., pressing 'R').
     * The specific behavior (restart level, go to next level) depends on the scene's state.
     */
     handleReset() {
        // Default implementation logs the request.
        // Override in GameplayScene to handle level restarts/advancement.
        console.log(`Base Scene (${this.constructor.name}): Reset action received.`);
     }
}