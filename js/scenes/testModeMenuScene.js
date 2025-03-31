console.log("TestModeMenuScene.js loaded", new Date().toISOString());

import { Scene } from '../core/scene.js';
import * as C from '../config.js';

/**
 * TestModeMenuScene provides a menu for entering various test modes
 * for the Magic Carpet game. This allows developers and testers to
 * access specific game features and scenarios.
 */
export class TestModeMenuScene extends Scene {
    constructor() {
        super();
        console.log("TestModeMenuScene created");
        
        this.title = "Test Mode Selection";
        this.menuItems = [
            { text: "Physics Test", action: "startPhysicsTest" },
            { text: "Combat Test", action: "startCombatTest" },
            { text: "Level Generator Test", action: "startLevelGenTest" },
            { text: "God Mode", action: "startGodMode" },
            { text: "Back to Title", action: "backToTitle" }
        ];
        this.selectedIndex = 0;
        this.keysPressed = {};
        this.animationTime = 0;
    }

    init({ isTestMode = false }) {
        this.isTestMode = isTestMode;
        this.isActive = true;
        this.setupInputHandlers();
        console.log("TestModeMenuScene initialized with isTestMode:", isTestMode);
    }

    setupInputHandlers() {
        // Remove any existing handlers first
        this.removeInputHandlers();

        // Add keyboard handlers
        this.keydownHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    removeInputHandlers() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }

    onEnter() {
        console.log("Entering TestModeMenuScene");
        
        this.setupInputHandlers();
        
        // Start menu music if available
        if (this.game && this.game.startMenuMusic) {
            this.game.startMenuMusic();
        }
    }

    onExit() {
        console.log("Exiting TestModeMenuScene");
        
        this.removeInputHandlers();
    }
    
    handleMenuAction(action) {
        console.log(`Test menu action: ${action}`);
        
        switch(action) {
            case 'startPhysicsTest':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'physics' });
                    }
                }
                break;
                
            case 'startCombatTest':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'combat' });
                    }
                }
                break;
                
            case 'startLevelGenTest':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'levelgen' });
                    }
                }
                break;
                
            case 'startGodMode':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'godmode' });
                    }
                }
                break;
                
            case 'backToTitle':
                if (this.game) {
                    this.game.setScene('title');
                }
                break;
        }
    }

    handleKeyDown(event) {
        if (!this.isActive) return;

        console.log("TestModeMenu keydown:", event.key);

        switch (event.key) {
            case 'ArrowUp':
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                break;
            case 'ArrowDown':
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                break;
            case 'Enter':
            case ' ':
                this.handleMenuAction(this.menuItems[this.selectedIndex].action);
                break;
            case 'Escape':
                if (this.game) this.game.setScene('title');
                break;
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
    }

    render(ctx) {
        // Draw background
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        
        // Draw title
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, C.CANVAS_WIDTH / 2, 120);
        
        // Draw menu items
        ctx.font = '28px Arial';
        for (let i = 0; i < this.menuItems.length; i++) {
            const item = this.menuItems[i];
            const y = 220 + i * 50;
            
            // Highlight selected item
            if (i === this.selectedIndex) {
                const pulse = Math.sin(this.animationTime * 5) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
                ctx.fillRect(C.CANVAS_WIDTH / 2 - 150, y - 30, 300, 40);
                ctx.fillStyle = '#000';
            } else {
                ctx.fillStyle = '#FFF';
            }
            
            ctx.textAlign = 'center';
            ctx.fillText(item.text, C.CANVAS_WIDTH / 2, y);
        }
        
        // Draw instructions
        ctx.font = '18px Arial';
        ctx.fillStyle = '#AAA';
        ctx.fillText('Use Arrow Keys to Navigate', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT - 100);
        ctx.fillText('Press Enter to Select', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT - 70);
    }
}
