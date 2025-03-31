// magic-carpet-game/js/core/game.js

import * as C from '../config.js'; // Game constants
// Import specific constants needed
import { ALLOW_DEVELOPER_MODE } from '../config.js';
import { SaveSystem } from './save.js'; // Handles saving/loading progress
import { TouchControls } from './touch.js'; // Handles touch input
import { AudioManager } from './audioManager.js'; // AudioManager for handling music and sound effects
// Import audio functions and setup utilities
import { makeDistortionCurve, createWhiteNoiseBuffer, triggerKick, triggerSnare, triggerHat, triggerBass, triggerLead, triggerZap, triggerSweep } from '../audio.js';
import { getRandom } from '../utils.js'; // Utility functions

/**
 * The main Game class orchestrates the game loop, scene management,
 * input handling, and audio initialization/control.
 */
export class Game {
    /**
     * Creates an instance of the Game.
     * @param {HTMLCanvasElement} canvas - The HTML canvas element to draw on.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error("Failed to get 2D rendering context from canvas.");
        }

        // --- Scene Management ---
        /** @type {Scene|null} */
        this.currentScene = null; // The currently active scene object
        /** @type {Object.<string, Scene>} */
        this.scenes = {}; // Stores all added scenes, keyed by name

        // --- Timing ---
        this.lastTime = 0; // Timestamp of the last frame
        this.deltaTime = 0; // Time elapsed since the last frame (in seconds)
        this.currentTime = 0; // Total time elapsed since game start (in seconds)

        // --- Game State ---
        this.isPaused = false; // Is the game loop paused?
        this.isRunning = false; // Is the game loop active?
        this.developerModeEnabled = false; // Is the developer mode active?

        // --- Input State ---
        this.inputState = {
            keys: { // Keyboard state
                left: false, right: false, up: false, w: false, space: false,
                r: false, m: false, x: false, one: false, two: false
            },
            mouseX: 0, // Mouse X position relative to canvas
            mouseY: 0, // Mouse Y position relative to canvas
            isMouseDown: false, // Is the primary mouse button currently pressed?
        };
        /** @type {TouchControls|null} */
        this.touchControls = null; // Instance for handling touch input

        // --- Audio State ---
        /** @type {AudioContext|null} */
        this.audioCtx = null; // The Web Audio API context
        /** @type {AudioManager|null} */
        this.audioManager = null; // AudioManager instance
        this.isAudioInitialized = false; // Has the AudioContext been created?

        // --- Persistence ---
        this.saveSystem = new SaveSystem(); // Handles loading/saving progress

        // --- Initialization ---
        this.initInput(); // Set up keyboard, mouse, and touch listeners
        this.applyCursorStyle(); // Apply the custom cursor defined in CSS
    }

    /**
     * Initializes event listeners for keyboard, mouse, and touch input.
     */
    initInput() {
        // --- Keyboard Listeners ---
        window.addEventListener('keydown', (e) => {
            // Ignore keydown events if a modifier key (like Alt, Ctrl, Meta) is pressed,
            // except for specific combinations if needed later.
            // Allow Ctrl/Shift for dev commands
            // if (e.altKey || e.ctrlKey || e.metaKey) return; // Keep this commented or refine later if needed

            const key = e.key.toLowerCase();
            let relevantKey = true; // Flag to check if we should prevent default for gameplay keys

            // --- Developer Mode Toggle ---
            if (key === '`') { // Backtick key for developer mode toggle
                if (ALLOW_DEVELOPER_MODE) {
                    this.developerModeEnabled = !this.developerModeEnabled;
                    console.log(`Developer Mode: ${this.developerModeEnabled ? 'ON' : 'OFF'}`);
                    // Potentially update UI or trigger scene-specific dev setup
                    if (this.currentScene && typeof this.currentScene.onDeveloperModeToggle === 'function') {
                        this.currentScene.onDeveloperModeToggle(this.developerModeEnabled);
                    }
                }
                return; // Don't process further if it was the toggle key
            }

            // --- Developer Mode Active Keybinds ---
            if (this.developerModeEnabled && this.currentScene) {
                let devActionTaken = false;
                // Check for scene-specific dev methods before executing
                if (key === 'g' && !e.repeat && typeof this.currentScene.devToggleGodMode === 'function') {
                    this.currentScene.devToggleGodMode();
                    devActionTaken = true;
                } else if (key === 'n' && !e.repeat && typeof this.currentScene.devToggleNoclip === 'function') {
                    this.currentScene.devToggleNoclip();
                    devActionTaken = true;
                } else if (key === 'k' && !e.repeat && typeof this.currentScene.devKillAllEnemies === 'function') {
                    this.currentScene.devKillAllEnemies();
                    devActionTaken = true;
                } else if (e.shiftKey && key === '1' && !e.repeat && typeof this.currentScene.devSpawnEnemy === 'function') {
                    this.currentScene.devSpawnEnemy('bat'); // Type is passed to scene method
                    devActionTaken = true;
                } else if (e.shiftKey && key === '2' && !e.repeat && typeof this.currentScene.devSpawnEnemy === 'function') {
                    this.currentScene.devSpawnEnemy('patroller'); // Type is passed to scene method
                    devActionTaken = true;
                }
                // Add more dev keys here (e.g., teleport, give item) later

                if (devActionTaken) {
                    e.preventDefault(); // Prevent default for dev keys if action was taken
                    return; // Stop processing if a dev key was handled
                }
            }

            // --- Regular Gameplay Keybinds ---
            // Only process if not handled by developer mode keys above
            switch (key) {
                case 'arrowleft': case 'a': this.inputState.keys.left = true; break;
                case 'arrowright': case 'd': this.inputState.keys.right = true; break;
                case 'arrowup': case 'w': this.inputState.keys.up = true; break;
                case ' ': this.inputState.keys.space = true; break; // Space key
                case 'x': this.inputState.keys.x = true; break; // Sword attack
                case '1': this.inputState.keys.one = true; break; // Fireball
                case '2': this.inputState.keys.two = true; break; // Lightning
                case 'r':
                    if (!this.inputState.keys.r) this.handleReset(); // Trigger reset only on first press
                    this.inputState.keys.r = true;
                    break;
                case 'm':
                    if (!this.inputState.keys.m) this.toggleMute(); // Trigger mute toggle only on first press
                    this.inputState.keys.m = true;
                    break;
                default:
                    relevantKey = false; // Not a key we care about for default prevention
                    break;
                // Backtick ('`') is handled above, removed from here
            }
            // Prevent default browser action (like scrolling with arrow keys/space) only for relevant gameplay keys
            if (relevantKey && (key === ' ' || key.startsWith('arrow') || ['w', 'a', 's', 'd'].includes(key))) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            switch (key) {
                case 'arrowleft': case 'a': this.inputState.keys.left = false; break;
                case 'arrowright': case 'd': this.inputState.keys.right = false; break;
                case 'arrowup': case 'w': this.inputState.keys.up = false; break;
                case ' ': this.inputState.keys.space = false; break;
                case 'x': this.inputState.keys.x = false; break;
                case '1': this.inputState.keys.one = false; break;
                case '2': this.inputState.keys.two = false; break;
                case 'r': this.inputState.keys.r = false; break;
                case 'm': this.inputState.keys.m = false; break;
            }
        });

        // --- Mouse Listeners (Attached to Canvas) ---
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.inputState.mouseX = e.clientX - rect.left;
            this.inputState.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Primary mouse button (usually left)
                this.inputState.isMouseDown = true;
                // The GameplayScene will check this state for firing fireballs.
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Primary mouse button
                this.inputState.isMouseDown = false;
            }
        });

        // Prevent the default context menu when right-clicking on the canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // --- Touch Controls Initialization ---
        // Check if touch events are supported
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            console.log("Touch support detected, initializing TouchControls.");
            this.touchControls = new TouchControls(this);
        } else {
            console.log("No touch support detected.");
        }
    }

    /**
     * Applies the 'magic-cursor' CSS class to the canvas element.
     */
    applyCursorStyle() {
        if (this.canvas) {
            this.canvas.classList.add('magic-cursor');
        }
    }

    /**
     * Handles the reset action (e.g., 'R' key press).
     * Delegates the actual reset logic to the current scene.
     */
    handleReset() {
        if (this.currentScene && typeof this.currentScene.handleReset === 'function') {
            this.currentScene.handleReset();
        } else {
            console.warn("Current scene does not implement handleReset().");
        }
    }

    /**
     * Initializes the Web Audio API AudioContext and sets up the AudioManager.
     * Should be called after user interaction (e.g., clicking the overlay).
     */
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.audioManager = new AudioManager(this.audioCtx);

            Promise.all([
                this.audioManager.loadTrack('title', './assets/audio/middle-eastern-title.mp3'),
                this.audioManager.loadTrack('gameplay', './assets/audio/adventure-gameplay.mp3'),
                this.audioManager.loadTrack('menuMusic', './assets/audio/amiga-middle-eastern.mp3')
            ]).then(() => {
                this.isAudioInitialized = true;
                if (this.currentScene?.name === 'menu') {
                    this.startMenuMusic();
                }
            }).catch(err => console.error("Failed to load audio tracks:", err));
        } catch (e) {
            console.error("Audio initialization failed:", e);
            this.isAudioInitialized = false;
        }
    }

    /**
     * Starts the menu music.
     */
    startMenuMusic() {
        if (this.isAudioInitialized && this.audioManager) {
            this.audioManager.playTrack('menuMusic');
            this.audioManager.musicPlayingScene = 'menu';
        }
    }

    /**
     * Adds a scene instance to the game's scene registry.
     * @param {string} name - The unique name to identify the scene.
     * @param {Scene} scene - The scene object instance.
     */
    addScene(name, scene) {
        if (this.scenes[name]) {
            console.warn(`Scene with name "${name}" already exists. Overwriting.`);
        }
        this.scenes[name] = scene;
        scene.game = this; // Provide the scene with a reference back to the game object
        console.log(`Scene added: "${name}"`);
    }

    /**
     * Switches the currently active scene.
     * Calls `onExit()` on the old scene and `onEnter()` on the new scene.
     * Updates the music based on the scene.
     * @param {string} sceneName - The name of the scene to switch to.
     */
    setScene(sceneName) {
        console.log(`Setting scene to '${sceneName}'...`);
        this.currentScene = this.scenes[sceneName];
        if (!this.currentScene || typeof this.currentScene.onEnter !== 'function') {
            console.error(`Scene '${sceneName}' does not have a valid onEnter method.`);
            return;
        }
        this.currentScene.onEnter();

        if (this.isAudioInitialized && this.audioManager) {
            this.audioManager.stopCurrentTrack();
            if (sceneName === 'menu') {
                this.startMenuMusic();
            }
        }
    }

    /**
     * Starts the title music.
     */
    startTitleMusic() {
        if (this.isAudioInitialized && this.audioManager) {
            this.audioManager.playTrack('title');
        }
    }

    /**
     * Starts the gameplay music.
     */
    startGameplayMusic() {
        if (this.isAudioInitialized && this.audioManager) {
            this.audioManager.playTrack('gameplay');
        }
    }

    /**
     * Stops the current music track.
     */
    stopMusic() {
        if (this.audioManager) {
            this.audioManager.stopCurrentTrack();
        }
    }

    /**
     * Registers scenes and initializes the game.
     */
    init() {
        console.log("Game initializing...");
        
        // Only register the test scene, not gameplay
        this.registerScene('test', new TestScene(this));
        
        // Don't set initial scene here - wait for user interaction
        // this.setScene('test');
        
        // For testing only: If you want to start with the test scene
        // uncomment the next line
        this.setScene('test');
    }

    /**
     * Registers a scene with the game.
     * @param {string} name - The name of the scene.
     * @param {Scene} scene - The scene instance.
     */
    registerScene(name, scene) {
        this.scenes[name] = scene;
    }

    /**
     * The main game loop, called repeatedly via requestAnimationFrame.
     * Calculates delta time, updates the current scene, and renders the current scene.
     * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        console.log(`Game loop running - time: ${timestamp.toFixed(0)}, deltaTime: ${this.deltaTime.toFixed(3)}`);
        // If the game isn't running, stop the loop immediately.
        if (!this.isRunning) {
            console.log("Game loop stopped.");
            return;
        }

        // Calculate delta time (time since last frame in seconds)
        if (!this.lastTime) this.lastTime = timestamp; // Initialize lastTime on first frame
        // Clamp deltaTime to prevent huge jumps if the tab was inactive or performance dips severely.
        this.deltaTime = Math.min(0.05, (timestamp - this.lastTime) / 1000); // Max 50ms step (equiv. to 20 FPS min)
        this.lastTime = timestamp;
        // Keep track of the total time elapsed (useful for animations, shaders, etc.)
        this.currentTime = (this.currentTime || 0) + this.deltaTime; // Increment total time

        try {
            // Update game logic only if not paused
            if (!this.isPaused && this.currentScene) {
                this.currentScene.update(this.deltaTime);
            }

            // Render the current scene (always render, even if paused)
            if (this.currentScene) {
                this.currentScene.update(this.deltaTime);
                this.currentScene.render(this.ctx);
            } else {
                // Optional: Render a fallback if no scene is active
                 this.ctx.fillStyle = 'black';
                 this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
                 this.ctx.fillStyle = 'white';
                 this.ctx.font = '20px sans-serif';
                 this.ctx.textAlign = 'center';
                 this.ctx.fillText('No active scene', this.canvas.width / 2, this.canvas.height / 2);
            }

            // Request the next frame, continuing the loop
            requestAnimationFrame(this.gameLoop.bind(this));

        } catch (error) {
            // Catch critical errors during the loop to prevent browser freezing
            console.error("CRITICAL ERROR in game loop:", error);
            this.stop(); // Stop the game loop immediately on error
            alert(`A critical error occurred during the game loop: ${error.message}. See console (F12) for details. The game has stopped.`);
            // Optionally: Display error message on canvas or switch to an error scene
        }
    }

    /**
     * Starts the game loop and sets the game state to running.
     * Resets timing variables.
     */
    start() {
        if (this.isRunning) {
            console.warn("Game.start() called but game is already running.");
            return; // Don't start if already running
        }
        console.log("Starting game loop...");
        this.isRunning = true;
        this.lastTime = 0; // Reset time tracking for the first frame
        this.currentTime = 0; // Reset total game time

        // Ensure cursor style is applied if it was removed on stop
        this.applyCursorStyle();

        // Request the first frame to kick off the game loop
        requestAnimationFrame(this.gameLoop.bind(this));

        // Attempt to start music immediately if conditions are right
        // (e.g., if starting directly into an active gameplay scene)
        if (this.isAudioInitialized && !this.isMuted && this.currentScene?.isGameplayActive()) {
             this.startGameplayMusic();
        }
    }

    /**
     * Stops the game loop and music sequencer. Sets the game state to not running.
     */
    stop() {
        if (!this.isRunning) return; // Don't stop if not running
        console.log("Stopping game loop and music...");
        this.isRunning = false;
        this.stopMusic(); // Ensure music interval is cleared
        // Optionally remove custom cursor when stopped?
        // if (this.canvas) { this.canvas.classList.remove('magic-cursor'); }
    }

    /**
     * Triggers a jump sound effect at the specified time.
     * @param {number} time - The audio context time to schedule the sound.
     */
    triggerJumpSound(time) {
        if (!this.isAudioInitialized || this.isMuted || !this.audioCtx || !this.audioManager) return;
        
        try {
            // Import the function only when needed to avoid circular dependencies
            import('../audio.js').then(audio => {
                audio.triggerJumpSound(this.audioCtx, this.audioManager.masterGain, time);
            }).catch(err => {
                console.error("Error importing audio module for jump sound:", err);
            });
        } catch (e) {
            console.error("Error in Game.triggerJumpSound:", e);
        }
    }

    /**
     * Handles the jump action when the player is on the ground.
     * @param {Object} player - The player object.
     * @param {boolean} onGround - Whether the player is on the ground.
     */
    handleJump(player, onGround) {
        if ((this.inputState.keys.up || this.inputState.keys.w) && onGround) {
            player.velocityY = -C.JUMP_STRENGTH * 0.9; // Reduced to match other movement changes
            player.onGround = false;
            onGround = false;
            player.animationState = 'jumping';
            if (this.audioCtx) {
                this.triggerJumpSound(this.audioCtx.currentTime);
            }
        }
    }
}
