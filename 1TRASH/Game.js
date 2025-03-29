class Game {
    constructor(canvas) {
        // ...existing code...
        this.mouseX = 0;
        this.mouseY = 0;
        // ...existing code...
    }

    initInput() {
        // ...existing code...
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        // ...existing code...
    }
}
