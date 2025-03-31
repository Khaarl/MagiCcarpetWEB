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
}

export default Logger;
