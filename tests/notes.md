# Magic Carpet Game - Menu & UI Graphics Implementation

## Overview

The Magic Carpet game implements its menus and UI through a combination of:
1. Canvas-based rendering for dynamic game elements and backgrounds
2. HTML/DOM elements for static UI components
3. Scene-based architecture for different game states

## Scene Architecture

The game uses a Scene-based architecture where different game states are represented by different Scene classes:

```javascript
import { Scene } from '../core/scene.js';

export class GameplayScene extends Scene {
    constructor() {
        super();
        // Scene initialization
    }
    
    // Scene lifecycle methods
    onEnter() { /* ... */ }
    update(deltaTime) { /* ... */ }
    render(ctx) { /* ... */ }
    onExit() { /* ... */ }
}
```

Each scene handles its own rendering, updates, and input.

## Menu Scenes

While the provided code focuses on the GameplayScene, the game likely includes:

1. **TitleScene** - The initial splash screen
2. **MenuScene** - The main menu with options
3. **GameplayScene** - The actual gameplay (shown in provided code)
4. Potentially others (settings, pause menu, etc.)

## UI Rendering

### In-Game UI Elements

The gameplay scene renders UI elements directly on the canvas:

```javascript
renderUI(ctx) {
    if (this.gameWon) {
        ctx.fillStyle = C.WIN_TEXT_COLOR;
        ctx.font = C.WIN_TEXT_FONT;
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2);
    }

    if (!this.player.onGround && this.keysPressed[' ']) {
        const flyingText = this.gameMode === 'test' ? "ENHANCED FLYING" : "FLYING";
        ctx.fillStyle = this.gameMode === 'test' ? '#FF9900' : '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(flyingText, C.CANVAS_WIDTH / 2, 50);
    }
}
```

### HTML-based UI

The game also uses HTML elements for persistent UI components:

```javascript
updateLivesDisplay() {
    const livesDisplay = document.getElementById('livesDisplay');
    if (livesDisplay && this.player) {
        livesDisplay.textContent = `Lives: ${this.player.lives}`;
    }
}

updateOrbShieldDisplay() {
    const orbShieldDisplay = document.getElementById('orbShieldDisplay');
    if (orbShieldDisplay && this.player) {
        orbShieldDisplay.textContent = `Shield: ${this.player.orbShieldCount}`;
    }
}
```

### Game Mode Indicator

The UI shows the current game mode:

```javascript
// Render Game Mode Toggle Text
ctx.fillStyle = this.gameMode === 'test' ? '#FFFF00' : '#FFFFFF'; // Yellow in test, white in normal
ctx.font = '18px Arial';
ctx.textAlign = 'right'; // Align to the right
ctx.fillText(`Mode: ${this.gameMode.toUpperCase()} (Press T to toggle)`,
            C.CANVAS_WIDTH - 20, 30); // Position near top-right
```

### Debug Information

When debug mode is enabled, additional information is displayed:

```javascript
renderDebugInfo(ctx) {
    if (!this.debugMode) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 130, 250, 160);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    // Various debug information
    // Camera position, player info, performance stats, etc.
}
```

## Background Rendering

The game uses rich, animated backgrounds. For example, in the gameplay scene:

```javascript
drawDesertDunesBackground(time, camX, ctx) {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.7, '#FFDAB9');
    skyGradient.addColorStop(1, '#FFA07A');
    
    // Animated sun
    const sunX = canvas.width * 0.8 - camX * 0.02;
    const sunY = canvas.height * 0.15;
    
    // Parallax dune layers
    // Multiple layers with different parallax effects
}
```

## Visual Effects

The game implements various visual effects such as:

1. **Particle Effects** - For player movement, abilities, and environment
2. **Magic Carpet Animation** - Complex animated carpet with wave motion and particle trail
3. **Animated Player** - Stick figure with multiple animation states

```javascript
drawMagicCarpet(player, time, ctx) {
    // Complex animation with waves, tassels, and gradients
    // ...

    // Particle trail effect
    this.drawCarpetTrail(carpetCenterX, carpetCenterY, velocityX, velocityY, time, ctx);
}
```

## Menu Structure (Inferred)

Based on the provided code, the main menu likely:

1. Uses a separate scene class (TitleScene/MenuScene)
2. Implements animated backgrounds similar to the gameplay scene
3. Renders menu options on canvas or via HTML
4. Handles transitions between different game states

## Input Handling

The game handles keyboard input for both gameplay and menu navigation:

```javascript
this.handleKeyDown = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
    }
    this.keysPressed[e.key.toLowerCase()] = true;
    
    // Special keys like mode toggle and debug mode
}
```

## Scene Transitions

The game manages transitions between scenes (such as from menu to gameplay):

```javascript
onEnter() {
    // Setup when entering this scene
    // ...
}

onExit() {
    // Cleanup when leaving this scene
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
}
```
