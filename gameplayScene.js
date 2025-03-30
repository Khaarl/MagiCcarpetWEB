render(ctx) {
    // Clear canvas
    ctx.fillStyle = C.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // Render platforms
    this.platforms.forEach(platform => {
        ctx.fillStyle = platform.color || 'gray';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Render collectibles
    this.collectibles.forEach(collectible => {
        ctx.drawImage(collectible.sprite, collectible.x, collectible.y);
    });

    // Render player
    ctx.drawImage(this.player.sprite, this.player.x, this.player.y);

    // Render enemies
    this.enemies.forEach(enemy => {
        ctx.drawImage(enemy.sprite, enemy.x, enemy.y);
    });

    // Render effects and particles
    this.effectsSystem.render(ctx);

    // Restore original transform
    ctx.restore();

    // Render UI elements that should not be affected by camera
    this.renderUI(ctx);

    // Debug rendering
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, 10, 50);
    ctx.fillText(`Player: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`, 10, 70);
    ctx.fillText(`Platforms: ${this.platforms.length}`, 10, 90);
}

resetLevel() {
    // Reset camera to focus on player at start
    this.camera.x = Math.max(0, this.player.x - C.CANVAS_WIDTH / 2);
    this.camera.y = 0; // Assuming no vertical camera movement
}
