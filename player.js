// ...existing code...

// Prevent falling through floor (simple boundary) - Only apply if not in noclip
if (player.y + player.height > C.CANVAS_HEIGHT) {
    player.y = C.CANVAS_HEIGHT - player.height;
    player.velocityY = 0;
    player.onGround = true; // Consider canvas bottom as ground
    if (player.animationState === 'jumping' || player.animationState === 'falling') {
        player.animationState = 'idle';
    }
}

// Add this code to prevent sticking at the top of the screen
// Prevent flying through ceiling (top boundary)
if (player.y < 0) {
    player.y = 0;
    player.velocityY = Math.max(0, player.velocityY); // Allow downward but not upward velocity
    // Don't set onGround true at the ceiling
}

// ...existing code...
