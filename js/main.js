import Game from './core/game.js';
import GameplayScene from './scenes/gameplayScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

// Wait for the DOM to be fully loaded
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Could not get 2D context");
        return;
    }

    // Set canvas dimensions
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // Initialize and start the game
    const game = new Game(canvas, ctx);
    const gameplayScene = new GameplayScene(game);
    game.addScene('gameplay', gameplayScene);
    game.startScene('gameplay');

    console.log("Magic Carpet Game initialized.");
});
