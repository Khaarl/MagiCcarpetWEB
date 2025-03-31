export class DebugOverlay {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.metrics = {
            fps: 0,
            entities: 0,
            playerPos: { x: 0, y: 0 },
            memory: 0
        };
    }

    toggle() {
        this.visible = !this.visible;
    }

    update(deltaTime) {
        if (!this.visible) return;
        this.metrics.fps = Math.round(1 / deltaTime);
        this.metrics.entities = this.game.currentScene?.entities?.length || 0;
        this.metrics.playerPos = this.game.currentScene?.player?.position || { x: 0, y: 0 };
        this.metrics.memory = performance.memory?.usedJSHeapSize / 1048576 || 0;
    }

    render(ctx) {
        if (!this.visible) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 100);
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.metrics.fps}`, 20, 30);
        ctx.fillText(`Entities: ${this.metrics.entities}`, 20, 50);
        ctx.fillText(`Player: (${Math.round(this.metrics.playerPos.x)}, ${Math.round(this.metrics.playerPos.y)})`, 20, 70);
        ctx.fillText(`Memory: ${Math.round(this.metrics.memory)} MB`, 20, 90);
    }
}
