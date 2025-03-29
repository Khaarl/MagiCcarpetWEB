function drawFireball(fb, ctx) {
    if (!fb.active) return;

    const angle = Math.atan2(fb.vy, fb.vx);

    ctx.save();
    ctx.translate(fb.x, fb.y);
    ctx.rotate(angle);

    ctx.fillStyle = FIREBALL_COLOR;
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.ellipse(0, 0, fb.radius * 1.5, fb.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    const trailLength = 3;
    const alphaStep = 0.6 / trailLength;
    for (let i = 1; i <= trailLength; i++) {
        ctx.globalAlpha = 0.6 - i * alphaStep;
        ctx.beginPath();
        ctx.ellipse(-i * 3, 0, fb.radius * (1 - i * 0.15), fb.radius * (1 - i * 0.15), 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}
