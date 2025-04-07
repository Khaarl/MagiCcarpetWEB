/**
 * Simple logging utility with category-based filtering
 */
class Logger {
    static enabledCategories = {
        gameLoop: false,  // Set to false to disable game loop logs
        input: true,
        scene: true,
        audio: true,
        general: true
    };
    
    static log(category, ...args) {
        if (this.enabledCategories[category]) {
            console.log(`[${category}]`, ...args);
        }
    }
    
    static error(category, ...args) {
        // Always log errors regardless of category settings
        console.error(`[${category}]`, ...args);
    }
    
    static warn(category, ...args) {
        // Always log warnings regardless of category settings
        console.warn(`[${category}]`, ...args);
    }
    
    static setCategory(category, enabled) {
        this.enabledCategories[category] = enabled;
    }
    
    /**
     * Enable detailed debug logging (for development/troubleshooting)
     * @param {boolean} enabled - Whether to enable detailed debug logs
     */
    static setDebugMode(enabled) {
        // Enable/disable verbose categories based on debug mode
        this.enabledCategories.gameLoop = enabled;
        
        console.log(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    }
}

export default Logger;
