# Magic Carpet Game

A 2D platformer game featuring a player character who can fly on a magic carpet, fight enemies with sword attacks and magic spells, and collect rewards to progress through procedurally generated levels.

## Running the Game

To run the game without encountering CORS issues, you need to serve the files through a local web server. Here are the steps:

### Option 2: Using Node.js
1. Install `http-server` globally by running:
   ```bash
   npm install -g http-server
   ```
2. Navigate to the project directory:
   ```bash
   cd "D:/PROJECTS/magic carpet game"
   ```
3. Start the server:
   ```bash
   http-server
   ```
4. Open the URL provided by the server (e.g., `http://127.0.0.1:8080`) in your browser.

### Option 3: Using Python
1. Navigate to the project directory:
   ```bash
   cd "D:/PROJECTS/magic carpet game"
   ```
2. Start the server:
   - For Python 3:
     ```bash
     python -m http.server
     ```
   - For Python 2:
     ```bash
     python -m SimpleHTTPServer
     ```
3. Open the URL provided by the server (e.g., `http://127.0.0.1:8000`) in your browser.

Once the server is running, you can play the game without any CORS issues.

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
