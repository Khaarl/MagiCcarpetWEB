import Logger from './utils/logger.js';

class Game {
    constructor(canvas) {
        // ...existing code...
    }

    start() {
        this.isRunning = true;

        const gameLoop = (timestamp) => {
            // Replace direct console.log calls with Logger
            Logger.log('gameLoop', 'Game loop running at timestamp:', timestamp);

            if (this.isRunning) {
                requestAnimationFrame(gameLoop);
            }
        };

        requestAnimationFrame(gameLoop);
    }

    // ...existing code...
}
