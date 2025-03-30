# Magic Carpet Game

A 2D platformer game featuring a player character who can fly on a magic carpet, fight enemies with sword attacks and magic spells, and collect rewards to progress through procedurally generated levels.

## Project Structure

```
d:\PROJECTS\magic carpet game\
│
├── index.html              # Main HTML entry point
├── css\
│   └── style.css           # Game styles and UI elements
│
├── js\                     # JavaScript source files
│   ├── main.js             # Entry point that initializes the game
│   ├── config.js           # Game constants and configuration
│   ├── utils.js            # Utility functions used across the game
│   ├── audio.js            # Audio system and sound effect functions
│   │
│   ├── core\               # Core game engine components
│   │   ├── game.js         # Main game controller class
│   │   ├── scene.js        # Base scene class
│   │   ├── particle.js     # Particle system for visual effects
│   │   ├── effects.js      # Visual effects manager
│   │   ├── powerup.js      # Power-up system
│   │   ├── save.js         # Save/load game progress
│   │   └── touch.js        # Touch input handling
│   │
│   ├── level\              # Level generation and management
│   │   └── levelGenerator.js # Procedural level generation
│   │
│   └── scenes\             # Game scenes/states
│       └── gameplayScene.js # Main gameplay implementation
```

## Architecture Overview

The game follows a component-based architecture with these key elements:

1. **Game Loop**: Managed by the `Game` class, handles timing, scene switching, and audio
2. **Scene System**: Different game states (gameplay, title, etc.) managed as scenes
3. **Entity System**: Player, enemies, and objects with position, size, and behavior
4. **Audio System**: Web Audio API-based sound effects and music generation
5. **Input Handling**: Keyboard, mouse, and touch input processing
6. **Rendering Pipeline**: Canvas-based drawing with layers and effects
7. **Level Generation**: Procedural creation of platforms, enemies, and collectibles

## Key Components

### Game Class
The central controller that manages:
- Game loop (update/render cycle)
- Scene management
- Audio initialization and control
- Input processing
- Canvas management

### Scene System
- **Scene**: Base class for different game states
- **GameplayScene**: Main gameplay scene with:
  - Player controls
  - Enemy behavior
  - Collision detection
  - Physics simulation
  - Level management

### Audio System
- Uses Web Audio API for dynamic sound synthesis
- Procedurally generates sound effects
- Implements a basic music sequencer
- Handles audio context initialization and muting

### Rendering
- Canvas-based with optimized drawing approaches
- Particle system for visual effects
- Camera system with tracking and bounds

### Level Generation
- Procedural platform placement with physics considerations
- Enemy and collectible distribution
- Difficulty progression

## Game Mechanics

### Player Abilities
- Ground movement (running, jumping)
- Flight on magic carpet
- Sword attacks
- Magic spells (Fireball, Lightning)
- Shield orbs for protection

### Enemies
- **Bats**: Flying enemies with patrol and chase behavior
- **Ground Patrollers**: Enemies that walk on platforms
- **Snakes**: More complex enemies with multiple segments
- **Giant Bat Boss**: Boss enemy with special abilities

### Level Progression
- Complete level by reaching the goal
- Collect rewards for additional points
- Time-based scoring system
- Progressive difficulty

## Configuration

The game's behavior can be modified through constants in `config.js`, including:
- Physics parameters (gravity, jump strength, movement speed)
- Enemy properties and behaviors
- Visual effects settings
- Audio parameters
- Level generation parameters

## Development Guidelines

### Adding New Features
1. Identify the appropriate module for your feature
2. Follow existing patterns for similar functionality
3. Add constants to `config.js` for configurable values
4. Update relevant systems to integrate the feature

### Creating New Enemies
1. Add a prototype object in `config.js`
2. Implement spawn logic in `levelGenerator.js`
3. Add update and render logic in `gameplayScene.js`
4. Create relevant sounds in `audio.js`

### Debugging Tools
- Browser console logging is used extensively
- Game state is visible through UI elements
- Performance metrics can be added to monitor frame rate

## Initialization Sequence

1. The entry point is `main.js` which sets up the canvas and creates the Game instance.
2. An audio overlay requires user interaction to start the game (browser security requirement).
3. On overlay click, audio is initialized and the game scene is set to 'gameplay'.
4. Scene switching happens with proper lifecycle calls (onExit, onEnter).

## Current Status

- Game initializes without errors.
- Test scene renders successfully (red rectangle with "GAME IS RENDERING" text).
- Main gameplay scene fails to properly load/initialize.

## Troubleshooting Guide

### Scene Management Issues
- Check console for errors during scene transitions.
- Verify `GameplayScene.onEnter()` completes without errors.
- Ensure level generation is working (`levelGenerator.generateLevel()`).
- Confirm player object is properly initialized with default state.

### Audio System
- Audio requires user interaction (click) to initialize due to browser policies.
- System implements procedural sound synthesis with Web Audio API.
- If no sound, check browser console for AudioContext initialization errors.
- The `musicSequencer` implementation creates dynamic background music.

### Rendering Issues
- Canvas dimensions are set from `config.js` constants.
- Camera position affects what's visible in the world.
- Check if `camera.x/y` coordinates are within the level bounds.
- Verify that `player.x/y` and platform positions are properly calculated.

### Input Handling
- The game supports keyboard, mouse, and touch input.
- Input handler registration happens in `Game.initInput()`.
- Touch controls are divided into screen zones for different actions.
- Debug touch zones by checking the `TouchControls.render()` implementation.

## Implementation Notes

### Scene Registration
Two methods exist for adding scenes:
- `game.addScene(name, sceneInstance)` - Used in `main.js`.
- `game.registerScene(name, sceneInstance)` - Used in `game.init()`.

Ensure scenes are not being overwritten by using both methods.

### Game Loop Management
- The main loop is driven by `requestAnimationFrame`.
- Delta time is capped at 50ms to prevent physics issues during lag.
- `Game.start()` initializes the loop and `Game.stop()` terminates it.

### Level Generator
- Procedurally creates platforms, enemies, and collectibles.
- Uses chunk-based generation for level layout.
- Implements collision detection to prevent overlapping elements.
- Creates a boss at the end of levels when appropriate.

### Save System
- Uses `localStorage` for persistent game data.
- Tracks highest level reached and completion times.
- Handles save data corruption with fallback to defaults.
