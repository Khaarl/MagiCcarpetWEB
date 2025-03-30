// magic-carpet-game/js/utils.js

/**
 * Generates a random floating-point number between min (inclusive) and max (exclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random number between min and max.
 */
export function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum integer value.
 * @param {number} max - The maximum integer value.
 * @returns {number} A random integer between min and max.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; // Ensure max is inclusive
}

/**
 * Checks if two rectangles overlap.
 * Assumes rectangles have { x, y, width, height }.
 * @param {object} rect1 - The first rectangle.
 * @param {object} rect2 - The second rectangle.
 * @returns {boolean} True if the rectangles overlap, false otherwise.
 */
export function checkRectOverlap(rect1, rect2) {
    if (!rect1 || !rect2) return false; // Basic check for null/undefined inputs
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Checks if a rectangle overlaps with any rectangle in an array, using a buffer.
 * @param {object} rect1 - The rectangle to check.
 * @param {Array<object>} existingPlatforms - Array of platform rectangles to check against.
 * @param {number} [buffer=30] - The buffer zone around each existing platform.
 * @returns {boolean} True if rect1 overlaps any buffered platform, false otherwise.
 */
export function checkPlatformArrayOverlap(rect1, existingPlatforms, buffer = 30) { // Default buffer from config PLATFORM_BUFFER
    for (const rect2 of existingPlatforms) {
        const bufferedRect2 = {
            x: rect2.x - buffer,
            y: rect2.y - buffer,
            width: rect2.width + buffer * 2,
            height: rect2.height + buffer * 2
        };
        if (checkRectOverlap(rect1, bufferedRect2)) return true;
    }
    return false;
}

/**
 * Checks if a rectangle overlaps with any reward rectangle in an array, using a buffer.
 * @param {object} rect1 - The rectangle to check (e.g., potential new reward position).
 * @param {Array<object>} existingRewards - Array of existing reward rectangles.
 * @param {number} [buffer=15] - The buffer zone around each existing reward (often half its collision size).
 * @returns {boolean} True if rect1 overlaps any buffered reward, false otherwise.
 */
 export function checkRewardArrayOverlap(rect1, existingRewards, buffer = 15) { // Default buffer from REWARD_BASE_RADIUS
     for (const rect2 of existingRewards) {
         // Use reward's actual size for buffer calculation if needed, or use fixed buffer
         const rewardCollisionSize = rect2.width || 30; // Use actual width or default if not present
         const effectiveBuffer = buffer; // Use the passed buffer directly, assuming it accounts for radii
         const bufferedRect2 = {
             x: rect2.x - effectiveBuffer,
             y: rect2.y - effectiveBuffer,
             width: (rect2.width || rewardCollisionSize) + effectiveBuffer * 2, // Use actual or default width
             height: (rect2.height || rewardCollisionSize) + effectiveBuffer * 2 // Use actual or default height
         };
          if (checkRectOverlap(rect1, bufferedRect2)) return true;
      }
      return false;
  }


/**
 * Checks if a rectangle overlaps with any bat rectangle in an array, using a buffer.
 * @param {object} rect1 - The rectangle to check (e.g., potential new bat position).
 * @param {Array<object>} existingBats - Array of existing bat objects { x, y, width, height }.
 * @param {number} [buffer=10] - The buffer zone around each existing bat.
 * @returns {boolean} True if rect1 overlaps any buffered bat, false otherwise.
 */
export function checkBatArrayOverlap(rect1, existingBats, buffer = 10) {
    for (const bat of existingBats) {
        // Ensure bat has valid position and dimensions
        if (typeof bat.x !== 'number' || typeof bat.y !== 'number' || typeof bat.width !== 'number' || typeof bat.height !== 'number') {
            // console.warn("Skipping bat with invalid properties in overlap check:", bat);
            continue;
        }
        const rect2 = { x: bat.x, y: bat.y, width: bat.width, height: bat.height };
        const bufferedRect2 = {
            x: rect2.x - buffer,
            y: rect2.y - buffer,
            width: rect2.width + buffer * 2,
            height: rect2.height + buffer * 2
        };
        if (checkRectOverlap(rect1, bufferedRect2)) return true;
    }
    return false;
}

/**
 * Calculates the frequency multiplier for a given number of semitones.
 * @param {number} semitones - The number of semitones (positive or negative).
 * @returns {number} The frequency multiplier.
 */
export function freqMult(semitones) {
    return Math.pow(2, semitones / 12);
}

/**
 * Gets a random point within a specified range around an origin, clamped within level bounds.
 * @param {number} originX - The center X coordinate for the patrol range.
 * @param {number} originY - The center Y coordinate for the patrol range.
 * @param {number} range - The maximum distance from the origin.
 * @param {number} canvasHeight - The height of the canvas.
 * @param {number} lavaBaseHeight - The height of the lava base from the bottom.
 * @param {number} entityHeight - The height of the entity to keep it above lava.
 * @returns {Array<number>} An array containing the [targetX, targetY].
 */
export function getRandomPatrolPoint(originX, originY, range, canvasHeight, lavaBaseHeight, entityHeight = 20) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * range;
    const targetX = originX + Math.cos(angle) * distance;

    // Define safe vertical boundaries
    const minY = 20; // Min distance from top edge
    const maxY = canvasHeight - lavaBaseHeight - entityHeight - 20; // Max distance (above lava, below top margin)

    const targetY = Math.max(minY, Math.min(maxY, originY + Math.sin(angle) * distance));

    // Clamp X as well? Optional, depends if patrolling should stay within screen bounds.
    // targetX = Math.max(entityWidth / 2, Math.min(levelWidth - entityWidth / 2, targetX));

    return [targetX, targetY];
}

/**
 * Creates a deep copy of a simple object or array (using JSON methods).
 * Note: This method does not work for objects with functions, Dates, Maps, Sets, etc.
 * Suitable for simple state objects like prototypes in this game.
 * @param {object|Array} obj - The object or array to copy.
 * @returns {object|Array|null} A deep copy of the object, or null if copying fails.
 */
export function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj; // Return primitives directly
    }
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error("Deep copy failed:", e, "Object:", obj);
        return null; // Indicate failure
    }
}

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} t - Interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}