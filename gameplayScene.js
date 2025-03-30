// Fix import statement
import { Scene } from '../core/scene.js';
// ...existing code...

// Fix collision logic
if (collisionType === 'ceiling') {
    collidedVertically = true; // Corrected from collidedHorizontally
}
// ...existing code...

// Refactor animation state handling
updateAnimationState() {
    if (this.player.animationState === 'jumping' || this.player.animationState === 'falling') {
        // Handle landing logic
        this.player.animationState = 'idle';
    }
    // Add other animation state transitions here
}
// Replace repeated checks with a call to updateAnimationState
this.updateAnimationState();
// ...existing code...

// Optimize debug rendering
if (this.debugMode) {
    this.renderDebugInfo(); // Conditional debug rendering
}
// ...existing code...

renderDebugInfo() {
    // Render debug information like Camera (X, Y), etc.
    // ...existing code...
}
