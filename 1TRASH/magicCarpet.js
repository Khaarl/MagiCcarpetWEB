// ...existing code...
drawMagicCarpet(player, time, ctx) {
    const anchorX = player.x + player.width / 2;
    const anchorY = player.y + player.height + CARPET_OFFSET_Y;
    const wave = Math.sin(time * CARPET_WAVE_SPEED);
    const currentWidth = CARPET_WIDTH * (1 + wave * CARPET_WAVE_AMP_X);
    const currentHeight = CARPET_HEIGHT * (1 - wave * CARPET_WAVE_AMP_Y * 0.5);
    const carpetX = anchorX - currentWidth / 2;
    const carpetY = anchorY - currentHeight / 2;

    const playerSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
    const speedFactor = Math.min(1.0, playerSpeed / 20);
    const emissionProbability = CARPET_DUST_EMIT_RATE * (0.5 + speedFactor * 0.8);

    if (!player.onGround && Math.random() < emissionProbability) {
        const dustX = anchorX;
        const dustY = carpetY + currentHeight;
        this.effectsSystem.emitCarpetDust(dustX, dustY, player.velocityX, player.velocityY, wave);
    }

    ctx.save();
    ctx.fillStyle = CARPET_COLOR_1;
    ctx.fillRect(carpetX, carpetY, currentWidth, currentHeight);
    ctx.fillStyle = CARPET_COLOR_2;
    ctx.fillRect(carpetX + currentWidth * 0.2, carpetY + currentHeight * 0.2, currentWidth * 0.6, currentHeight * 0.6);
    ctx.strokeStyle = CARPET_COLOR_2;
    ctx.lineWidth = 1;
    const tasselLength = currentHeight * 0.6;
    for (let i = 0; i < 5; i++) {
        const tasselX = carpetX + (currentWidth / 4) * i;
        ctx.beginPath();
        ctx.moveTo(tasselX, carpetY + currentHeight);
        ctx.lineTo(tasselX + wave * 2, carpetY + currentHeight + tasselLength + wave * 2);
        ctx.stroke();
    }
    ctx.restore();
}
// ...existing code...
