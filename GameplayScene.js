// ...existing code...
// --- Drawing Helpers ---
drawAlienMarioBackground(time, camX, ctx) {
    // ...existing code...
}

drawDesertDunesBackground(time, camX, ctx) {
    ctx.save();

    // 1. Sky Gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75); // Gradient covers top 3/4
    skyGradient.addColorStop(0, '#87CEEB'); // Light Sky Blue
    skyGradient.addColorStop(0.7, '#FFDAB9'); // Peach Puff / Light Orange near horizon
    skyGradient.addColorStop(1, '#FFA07A'); // Light Salmon / Orange deeper horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Optional Sun
    const sunX = canvas.width * 0.8 - camX * 0.02; // Slow parallax for sun
    const sunY = canvas.height * 0.15;
    const sunRadius = 40;
    ctx.fillStyle = 'rgba(255, 255, 224, 0.9)'; // Light Yellow, slightly transparent
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    // Sun Glow
    ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow for dunes

    // 3. Dunes (Draw from back to front)
    const duneLayers = [
        // Far layer
        {
            parallax: 0.08, // Slowest scroll
            baseY: canvas.height * 0.65,
            amp1: 40, freq1: 0.003, // Main wave
            amp2: 15, freq2: 0.007, // Ripple wave
            hue: 40, sat: 45, lightBase: 55, lightRange: 10 // Browner tones
        },
        // Mid layer
        {
            parallax: 0.15,
            baseY: canvas.height * 0.75,
            amp1: 60, freq1: 0.004,
            amp2: 25, freq2: 0.009,
            hue: 45, sat: 55, lightBase: 65, lightRange: 12 // Standard sand
        },
        // Near layer
        {
            parallax: 0.30, // Fastest scroll
            baseY: canvas.height * 0.85,
            amp1: 80, freq1: 0.005,
            amp2: 30, freq2: 0.012,
            hue: 50, sat: 65, lightBase: 70, lightRange: 15 // Lighter, yellower sand
        }
    ];

    const segmentWidth = 5; // Draw dunes in segments

    duneLayers.forEach((layer, index) => {
        const scrollOffset = camX * layer.parallax;
        // Introduce a very slow time factor for subtle "wind" shift, different per layer
        const timeFactor = time * 0.00002 * (index * 0.5 + 1);

        // Create a vertical gradient for this dune layer for shading
        const gradientYStart = layer.baseY - layer.amp1 - layer.amp2 - 20; // Extend gradient slightly above peaks
        const gradientYEnd = canvas.height; // Gradient goes to bottom of canvas
        const duneGradient = ctx.createLinearGradient(0, gradientYStart, 0, gradientYEnd);

        const lightHighlight = Math.min(95, layer.lightBase + layer.lightRange);
        const lightShadow = Math.max(10, layer.lightBase - layer.lightRange);

        // Gradient stops: Highlight -> Mid -> Shadow -> Darker Shadow at bottom
        duneGradient.addColorStop(0, `hsl(${layer.hue}, ${layer.sat}%, ${lightHighlight}%)`); // Highlight near top of wave range
        duneGradient.addColorStop(0.4, `hsl(${layer.hue}, ${layer.sat}%, ${layer.lightBase}%)`); // Mid tone around base Y
        duneGradient.addColorStop(0.8, `hsl(${layer.hue - 10}, ${layer.sat - 10}%, ${lightShadow}%)`); // Shadow below base Y (Slightly less saturated)
        duneGradient.addColorStop(1, `hsl(${layer.hue - 15}, ${layer.sat - 15}%, ${lightShadow - 5}%)`); // Darkest at screen bottom (Even less saturated, slightly darker hue)

        ctx.fillStyle = duneGradient;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height); // Start bottom-left

        for (let x = 0; x <= canvas.width; x += segmentWidth) {
            const worldX = x + scrollOffset;
            // Combine sine waves for more natural dune shapes
            // Add timeFactor to the sine calculation and a phase shift per layer
            const duneY = layer.baseY +
                          Math.sin(worldX * layer.freq1 + timeFactor + index * 1.5) * layer.amp1 +
                          Math.sin(worldX * layer.freq2 + timeFactor * 1.3 + index * 3.0) * layer.amp2;
            ctx.lineTo(x, Math.max(0, duneY)); // Don't let dunes go above screen top visually
        }

        ctx.lineTo(canvas.width, canvas.height); // End bottom-right
        ctx.closePath();
        ctx.fill();
    });

    ctx.restore();
}
// ...existing code...
