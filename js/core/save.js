// magic-carpet-game/js/core/save.js

/**
 * Manages saving and loading game progress using localStorage.
 * Stores the highest level the player has reached and high scores (best times) for each level.
 */
export class SaveSystem {
    /**
     * Creates an instance of SaveSystem.
     * Loads existing data or initializes with defaults upon creation.
     * @param {string} [storageKey='psyFlightSaveData_v1'] - The key used for storing data in localStorage.
     *                                                      Using a versioned key (e.g., _v1, _v2) is good practice
     *                                                      if the save data structure might change in future updates.
     */
    constructor(storageKey = 'psyFlightSaveData_v1') {
        this.storageKey = storageKey;
        this.data = this.load(); // Load data immediately
        console.log(`SaveSystem initialized with key "${this.storageKey}". Loaded data:`, JSON.stringify(this.data));
    }

    /**
     * Loads game data from localStorage based on the storageKey.
     * Performs basic validation to ensure the loaded data structure is usable.
     * If loading fails or data is invalid, it returns the default save structure.
     * @returns {object} The loaded save data object (or defaults if loading failed).
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // --- Basic Validation ---
                // Check if essential properties exist and have roughly the correct types.
                if (typeof parsed.currentLevel === 'number' &&
                    typeof parsed.highScores === 'object' &&
                    parsed.highScores !== null && // Ensure highScores is not null
                    !Array.isArray(parsed.highScores)) // Ensure highScores is an object, not an array
                {
                    console.log("Save data loaded successfully from localStorage.");
                    // Optional: Could add more specific validation, e.g., checking if high score values are numbers.
                    return parsed;
                } else {
                    // Data exists in localStorage but doesn't match the expected format.
                    console.warn("Loaded save data has invalid format. Ignoring and resetting to defaults.", parsed);
                    // Optionally remove the invalid data to prevent loading it again.
                    localStorage.removeItem(this.storageKey);
                }
            } else {
                // No data found under the specified key.
                console.log("No save data found in localStorage for this key.");
            }
        } catch (e) {
            // Handle errors during localStorage access or JSON parsing.
            console.error("Error loading save data:", e);
            // Attempt to remove potentially corrupted data if parsing failed.
            try {
                localStorage.removeItem(this.storageKey);
            } catch (removeError) {
                console.error("Failed to remove potentially corrupted save data:", removeError);
            }
        }
        // If loading failed, data was invalid, or no data existed, return the default structure.
        console.log("Using default save data structure.");
        return this.getDefaults();
    }

    /**
     * Saves the current state of the `this.data` object to localStorage.
     * Handles potential errors during saving (e.g., storage quota exceeded).
     */
    save() {
        try {
            const dataString = JSON.stringify(this.data);
            localStorage.setItem(this.storageKey, dataString);
             // console.log("Game data saved:", this.data); // Uncomment for debugging saves
        } catch (e) {
            console.error("Error saving game data:", e);
            // Check for specific errors like storage being full.
            if (e.name === 'QuotaExceededError') {
                alert("Could not save game progress: Browser storage quota exceeded. Please clear some browser storage or allow more space.");
            } else {
                // Generic error message.
                alert("Could not save game progress. Local storage might be disabled or full.");
            }
        }
    }

    /**
     * Returns the default structure for the save data object.
     * This is used when initializing or when resetting progress.
     * @returns {object} The default save data object.
     */
    getDefaults() {
        return {
            // The highest level number the player should start on (progress marker).
            currentLevel: 1,
            // An object to store the best completion time (in seconds) for each level.
            // Using string keys for level numbers is generally safer with JSON/objects.
            highScores: {
                // Example: "1": 120.5, "2": 95.2
            }
        };
    }

    /**
     * Updates the save data after a level is completed.
     * Records the time if it's a new high score for that level.
     * Advances the player's `currentLevel` progress marker if they beat a new highest level.
     * @param {number} levelNumber - The (1-based) number of the level that was completed.
     * @param {number} time - The time taken to complete the level, in seconds.
     */
    levelCompleted(levelNumber, time) {
        // Ensure inputs are valid numbers.
        const completionTime = Number(time);
        const levelKey = String(levelNumber); // Use string key for highScores object

        // Basic validation for completion time.
        if (isNaN(completionTime) || completionTime <= 0) {
            console.error(`Invalid completion time (${time}) provided for level ${levelKey}. Score not recorded.`);
            // Even if the time is invalid, we should still update the player's progress
            // marker if they completed a level higher than their current progress.
            this.data.currentLevel = Math.max(this.getCurrentLevel(), levelNumber + 1);
            this.save(); // Save the updated progress marker
            return; // Stop score processing
        }

        console.log(`Level ${levelKey} completed in ${completionTime.toFixed(2)}s`);

        // Check and update the high score for this level.
        const currentBestTime = this.data.highScores[levelKey];
        if (currentBestTime === undefined || completionTime < currentBestTime) {
            console.log(`%cNew high score for level ${levelKey}! ${completionTime.toFixed(2)}s (Previous: ${currentBestTime === undefined ? 'None' : currentBestTime.toFixed(2)}s)`, "color: lightgreen;");
            this.data.highScores[levelKey] = completionTime;
        }

        // Update the highest level reached. Ensures the player progresses.
        // `getCurrentLevel()` handles potential undefined `this.data.currentLevel`.
        this.data.currentLevel = Math.max(this.getCurrentLevel(), levelNumber + 1);
        console.log(`Player progress advanced. Next level unlocked: ${this.data.currentLevel}`);

        this.save(); // Persist all changes to localStorage.
    }

    /**
     * Resets all saved data (current level progress and all high scores) back to the defaults.
     * Prompts the user for confirmation before proceeding.
     * Reloads the page after resetting to ensure the game starts fresh.
     */
    resetProgress() {
        console.log("Attempting to reset save data...");
        // Use browser's confirm dialog for user confirmation.
        if (confirm("Are you sure you want to reset ALL saved progress and high scores? This action cannot be undone.")) {
            console.log("User confirmed reset. Resetting data to defaults.");
            this.data = this.getDefaults(); // Overwrite current data with defaults
            this.save(); // Save the reset state
            console.log("Progress reset and saved.");
            alert("Game progress has been reset."); // Inform the user
            // Reload the page to apply the reset (start game from level 1)
            window.location.reload();
        } else {
            // User cancelled the action.
            console.log("Progress reset cancelled by user.");
        }
    }

    /**
     * Gets the highest level number the player has unlocked or reached.
     * Ensures the returned value is always at least 1.
     * @returns {number} The current highest level number (1-based).
     */
    getCurrentLevel() {
        // Provide default of 1 if `this.data.currentLevel` is missing or invalid.
        const level = this.data?.currentLevel;
        return (typeof level === 'number' && level >= 1) ? level : 1;
    }

    /**
     * Retrieves the best time (high score) recorded for a specific level.
     * @param {number} levelNumber - The (1-based) level number to check.
     * @returns {number | undefined} The high score in seconds, or undefined if no score exists for that level.
     */
    getHighScore(levelNumber) {
        const levelKey = String(levelNumber);
        const score = this.data?.highScores?.[levelKey];
        // Return the score only if it's a valid positive number
        return (typeof score === 'number' && score > 0) ? score : undefined;
    }
}