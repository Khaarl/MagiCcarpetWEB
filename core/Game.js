// ...existing code...
toggleSlowMotion() {
    this.timeScale = this.timeScale === 1.0 ? 0.3 : 1.0;
    console.log(this.timeScale === 0.3 ? "Slow motion enabled" : "Normal speed restored");
}

gameLoop(timestamp) {
    let deltaTime = (timestamp - this.lastTime) / 1000;
    deltaTime *= this.timeScale || 1.0;
    // ...existing game loop logic...
}
// ...existing code...
