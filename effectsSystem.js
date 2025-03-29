// ...existing code...
emitCarpetDust(x, y, playerVelX, playerVelY, wave) {
    const count = Math.random() < 0.2 ? 2 : 1;
    for (let i = 0; i < count; i++) {
        const particle = particlePool.get();
        if (!particle) continue;

        particle.x = x + getRandom(-CARPET_WIDTH * 0.4, CARPET_WIDTH * 0.4);
        particle.y = y + getRandom(-5, 5);

        const baseVelX = -playerVelX * 0.15;
        const baseVelY = -playerVelY * 0.05 + 5;

        particle.vx = baseVelX + wave * 10 + getRandom(-CARPET_DUST_SPEED * 0.6, CARPET_DUST_SPEED * 0.6);
        particle.vy = baseVelY + getRandom(-CARPET_DUST_SPEED * 0.3, CARPET_DUST_SPEED * 0.3);

        particle.color = CARPET_DUST_COLORS[Math.floor(Math.random() * CARPET_DUST_COLORS.length)];
        particle.size = getRandom(CARPET_DUST_SIZE_MIN, CARPET_DUST_SIZE_MAX);
        particle.isGlowing = true;
        particle.glowStrength = CARPET_DUST_GLOW_STRENGTH;

        particle.life = particle.maxLife = CARPET_DUST_LIFESPAN * (0.7 + Math.random() * 0.6);
        particle.useGravity = false;
        particle.drag = 0.98;
    }
}
// ...existing code...
