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
            { text: "Procedural Terrain Test", action: "startProceduralTerrain" },
            { text: "God Mode", action: "startGodMode" },
            { text: "Particle Effects Test", action: "startParticlesTest" },
            { text: "Back to Title", action: "backToTitle" }
        ];
        this.selectedIndex = 0;
        this.keysPressed = {};
        this.animationTime = 0;
        this.particles = []; // Add array to store particles
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
                
            case 'startProceduralTerrain':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'proceduralterrain' });
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
                
            case 'startParticlesTest':
                if (this.game) {
                    this.game.setScene('gameplay');
                    if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                        this.game.currentScene.init({ isTestMode: true, testMode: 'particles' });
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

        let menuChanged = false;
        
        switch (event.key) {
            case 'ArrowUp':
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                menuChanged = true;
                break;
            case 'ArrowDown':
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                menuChanged = true;
                break;
            case 'Enter':
            case ' ':
                this.emitSelectionParticles(); // Visual feedback on selection
                this.playSelectionSound();
                this.handleMenuAction(this.menuItems[this.selectedIndex].action);
                break;
            case 'Escape':
                if (this.game) this.game.setScene('title');
                break;
        }
        
        // Generate feedback when menu navigation occurs
        if (menuChanged) {
            this.emitSelectionParticles();
            this.playNavigationSound();
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime * 2; // Fade out
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    emitSelectionParticles() {
        const centerY = 220 + this.selectedIndex * 50; // Match Y position from render method
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: C.CANVAS_WIDTH/2,
                y: centerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 6 + 2,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
            });
        }
    }
    
    playNavigationSound() {
        // Play sound if game's audio system is available
        if (this.game && this.game.playSound) {
            this.game.playSound('menuNav', 0.5);
        }
    }
    
    playSelectionSound() {
        // Play sound if game's audio system is available
        if (this.game && this.game.playSound) {
            this.game.playSound('menuSelect', 0.7);
        }
    }

    render(ctx) {
        // Draw background
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        
        // Draw particles behind menu
        this.renderParticles(ctx);
        
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
    
    renderParticles(ctx) {
        // Render all active particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life; // Fade out as life decreases
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1; // Reset alpha
    }
}
