# Magic Carpet Game - Test Mode & Game Logic Documentation

## Core Game Architecture

The Magic Carpet game uses a scene-based architecture where different game states are managed by separate scene classes. The main gameplay logic is contained within `GameplayScene`, which handles player movement, physics, rendering, and interactions.

## Test Mode Overview

The game features a "test mode" that modifies various game mechanics for testing and debugging purposes. This mode makes the game easier to navigate and test by adjusting physics parameters, cooldowns, and other gameplay elements.

### Test Mode Initialization

Test mode can be initialized in two ways:

1. **At startup** - Through the initialization options:
   ```javascript
   // ...existing code...
   init(options = {}) {
       this.gameMode = options.isTestMode ? 'test' : 'normal';
       console.log(`GameplayScene initialized with mode: ${this.gameMode}`);
   }
   ```

2. **During gameplay** - By toggling with the 'T' key:
   ```javascript
   // ...existing code...
   toggleGameMode() {
       this.gameMode = this.gameMode === 'normal' ? 'test' : 'normal';
       console.log(`Game mode switched to: ${this.gameMode}`);
       this.resetLevel();
   }
   ```

### Test Mode Modifications

#### 1. Physics Modifications
   ```javascript
   // ...existing code...
   if (this.gameMode === 'test') {
       currentGravity *= C.TEST_MODE_GRAVITY_MULTIPLIER;
       flyStrength *= C.TEST_MODE_FLY_STRENGTH_MULTIPLIER;
       player.velocityY = Math.max(player.velocityY, -maxFlySpeed * C.TEST_MODE_MAX_FLY_SPEED_MULTIPLIER);
   }
   ```

#### 2. Ability Cooldown Reductions
   ```javascript
   // ...existing code...
   if (this.gameMode === 'test') {
       player.fireballCooldownTimer = C.FIREBALL_COOLDOWN * 0.5;
   }
   ```

#### 3. Visual Indicators
   ```javascript
   // ...existing code...
   const flyingText = this.gameMode === 'test' ? "ENHANCED FLYING" : "FLYING";
   ctx.fillStyle = this.gameMode === 'test' ? '#FF9900' : '#FFFFFF';
   ```

## Loading & Initialization Process

The complete game initialization process follows these steps:
1. **Scene Creation**: The `GameplayScene` is instantiated.
2. **Configuration**: The scene is initialized with options, including test mode flag.
3. **Scene Entry**: The `onEnter` method is called by the scene manager.
4. **System Initialization**: Level generator and effect systems are created.
5. **Input Setup**: Event listeners for keyboard input are configured.
6. **Level Reset**: The level is reset/initialized based on the current game mode.
7. **UI Update**: Display elements are updated to match the current state.

   ```javascript
   // ...existing code...
   onEnter() {
       console.log("==== GameplayScene.onEnter: START ====");
       console.log(`Current game mode: ${this.gameMode}`);
       this.resetLevel();
       this.updateLivesDisplay();
       this.updateOrbShieldDisplay();
   }
   ```

## Constants & Configuration

The game loads various constants from a central configuration file:
   ```javascript
   export const Constants = {
       // ...existing code...
       TEST_MODE_GRAVITY_MULTIPLIER: 0.5,
       TEST_MODE_FLY_STRENGTH_MULTIPLIER: 1.5,
       TEST_MODE_MAX_FLY_SPEED_MULTIPLIER: 1.5,
   };
   ```

## Debug Mode

Separate from test mode, the game includes a debug mode that displays additional information without changing gameplay mechanics:
   ```javascript
   // ...existing code...
   if (e.key === 'F9') {
       this.debugMode = !this.debugMode;
   }
   ```

## Key Game Logic Components

1. **Physics System**: Handles player movement, gravity, and collisions.
2. **Input System**: Captures and processes keyboard events.
3. **Animation System**: Manages player and environment animations.
4. **Level Generation**: Creates platforms and obstacles.
5. **Effects System**: Handles particles and visual effects.
6. **UI System**: Displays game status and feedback.

## Test Mode Use Cases

Test mode is primarily used for:
1. **Level Testing**: Quickly navigate and explore levels.
2. **Mechanics Testing**: Validate gameplay mechanics with modified parameters.
3. **Debug Assistance**: More easily position the player for troubleshooting.
4. **Content Creation**: Facilitate screenshot or video capture by making movement easier.
