// ...existing code...
render(ctx) {
    ctx.save();
    for (const p of this.activeParticles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha * 0.8;

        if (p.isGlowing) {
            ctx.save();
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.glowStrength * 3;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
    }
    ctx.restore();
}
// ...existing code...
