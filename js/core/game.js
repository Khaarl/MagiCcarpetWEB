// magic-carpet-game/js/core/game.js

import * as C from '../config.js'; // Game constants
import { SaveSystem } from './save.js'; // Handles saving/loading progress
import { TouchControls } from './touch.js'; // Handles touch input
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
        /** @type {GainNode|null} */
        this.masterGain = null; // Master volume control
        /** @type {WaveShaperNode|null} */
        this.distortion = null; // Distortion effect node
        /** @type {OscillatorNode|null} */
        this.padLfo = null; // LFO for modulating the pad synth
        /** @type {OscillatorNode|null} */
        this.padOsc = null; // Oscillator for the background pad synth
        /** @type {GainNode|null} */
        this.padGain = null; // Gain control for the pad synth
        /** @type {number|null} */
        this.musicIntervalId = null; // ID for the setInterval controlling the music sequencer
        this.isAudioInitialized = false; // Has the AudioContext been created?
        this.stepCounter = 0; // Counter for the music sequencer step
        this.isMuted = false; // Is the game audio muted?
        this.bassNotes = [0, 0, 3, 0, 5, 0, 3, 0]; // Example bass sequence (semitones from root)
        this.leadNotes = [0, 3, 7, 10, 12, 10, 7, 3]; // Example lead sequence (semitones from root)

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
            if (e.altKey || e.ctrlKey || e.metaKey) return;

            const key = e.key.toLowerCase();
            let relevantKey = true; // Flag to check if we should prevent default

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
            }
            // Prevent default browser action (like scrolling with arrow keys/space) only for relevant keys
            if (relevantKey && (key === ' ' || key.startsWith('arrow'))) {
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
     * Initializes the Web Audio API AudioContext and sets up master gain,
     * distortion, and the background pad synthesizer nodes.
     * Should be called after user interaction (e.g., clicking the overlay).
     */
    initAudio() {
        if (this.isAudioInitialized) return; // Prevent re-initialization
        try {
            // Create AudioContext (handle browser differences)
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (!this.audioCtx) {
                throw new Error("Web Audio API not supported by this browser.");
            }

            // Master Gain Node (controls overall volume)
            this.masterGain = this.audioCtx.createGain();
            // Set initial volume based on mute state
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0.001 : C.MASTER_VOLUME, this.audioCtx.currentTime);

            // Distortion Node
            this.distortion = this.audioCtx.createWaveShaper();
            this.distortion.curve = makeDistortionCurve(C.DISTORTION_AMOUNT);
            this.distortion.oversample = '4x'; // Improves quality, reduces aliasing

            // Background Pad Synth Setup
            this.padOsc = this.audioCtx.createOscillator(); // Main pad oscillator
            this.padGain = this.audioCtx.createGain(); // Pad volume control
            this.padLfo = this.audioCtx.createOscillator(); // LFO for frequency modulation
            const lfoGain = this.audioCtx.createGain(); // Controls LFO modulation depth

            this.padOsc.type = 'sawtooth'; // Pad waveform
            this.padOsc.frequency.setValueAtTime(30, this.audioCtx.currentTime); // Low base frequency
            this.padGain.gain.setValueAtTime(C.PAD_VOLUME, this.audioCtx.currentTime); // Set pad volume

            this.padLfo.frequency.setValueAtTime(C.PAD_LFO_RATE, this.audioCtx.currentTime); // LFO speed
            lfoGain.gain.setValueAtTime(C.PAD_LFO_DEPTH, this.audioCtx.currentTime); // LFO amount

            // --- Connect Audio Nodes ---
            this.padLfo.connect(lfoGain);          // LFO oscillator -> LFO gain
            lfoGain.connect(this.padOsc.frequency); // LFO gain modulates pad oscillator frequency
            this.padOsc.connect(this.padGain);     // Pad oscillator -> Pad gain
            this.padGain.connect(this.masterGain); // Pad gain -> Master gain
            this.distortion.connect(this.masterGain);// Distortion -> Master gain (parallel path)
            this.masterGain.connect(this.audioCtx.destination); // Master gain -> Output (speakers)

            // --- Start Oscillators ---
            this.padOsc.start();
            this.padLfo.start();

            this.isAudioInitialized = true;
            console.log("Web Audio API Initialized successfully. BPM:", C.BPM);

        } catch (e) {
            console.error("Error initializing Web Audio API:", e);
            alert("Could not initialize audio. Sound will be disabled. Error: " + e.message);
            // Ensure audio features are disabled if initialization fails
            this.isAudioInitialized = false;
            this.audioCtx = null;
            this.masterGain = null;
            this.distortion = null;
            // etc.
        }
    }

    /**
     * Starts the background music sequencer if audio is initialized,
     * not muted, the game is running, and it's not already playing.
     */
    startMusic() {
        // Check multiple conditions before starting
        if (!this.isAudioInitialized || this.musicIntervalId !== null || this.isMuted || !this.isRunning) {
            return;
        }
        // Additional check: Only start music if in an active gameplay scene
        if (!this.currentScene || typeof this.currentScene.isGameplayActive !== 'function' || !this.currentScene.isGameplayActive()) {
            return;
        }

        console.log("Starting background music sequencer.");
        this.stepCounter = 0; // Reset sequence step
        const intervalMilliseconds = C.SIXTEENTH_NOTE_DURATION * 1000; // Calculate interval time

        // Clear any existing interval just in case
        if (this.musicIntervalId) clearInterval(this.musicIntervalId);

        // Immediately trigger the first beat
        this.musicSequencer();

        // Set the interval for subsequent beats
        this.musicIntervalId = setInterval(() => this.musicSequencer(), intervalMilliseconds);
    }

    /**
     * Stops the background music sequencer by clearing the interval.
     */
    stopMusic() {
        if (this.musicIntervalId !== null) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
            console.log("Background music sequencer stopped.");
        }
    }

    /**
     * The core music sequencer logic. Called at regular intervals (16th notes).
     * Triggers different instrument sounds based on the current step counter.
     */
    musicSequencer() {
        // Essential guards: Ensure audio is ready and not muted
        if (!this.isAudioInitialized || this.isMuted || !this.audioCtx || !this.masterGain || !this.distortion) {
            this.stopMusic(); // Stop if audio state becomes invalid
            return;
        }

        try {
            const now = this.audioCtx.currentTime; // Get precise current audio time
            const noteTime = C.SIXTEENTH_NOTE_DURATION;
            const thirtySecondNote = noteTime * 0.5;

            // Calculate current position within patterns
            const beat16 = this.stepCounter % 16; // Position within a 16-step (1 bar) pattern
            const beat64 = this.stepCounter % 64; // Position within a 64-step (4 bar) pattern

            // --- Drum Pattern ---
            // Kick on downbeats (1, 5, 9, 13)
            if (beat16 % 4 === 0) {
                triggerKick(this.audioCtx, this.masterGain, now);
            }
            // Snare on backbeats (steps 4 and 12 in a 0-15 sequence)
            if (beat16 === 4 || beat16 === 12) {
                 if (Math.random() < 0.9) { // High chance for snare
                     triggerSnare(this.audioCtx, this.distortion, now);
                 }
             } else if (beat16 === 14 && Math.random() < 0.2) { // Occasional ghost note before loop
                 triggerSnare(this.audioCtx, this.distortion, now + thirtySecondNote);
             }
            // Hi-Hats
            triggerHat(this.audioCtx, this.distortion, now); // Closed hat on every 16th
            // Random off-beat closed hats
            if (beat16 % 2 !== 0 && Math.random() < 0.6) {
                 triggerHat(this.audioCtx, this.distortion, now + thirtySecondNote);
            }
            // Occasional open hats near end of phrases
            if ((beat16 === 7 || beat16 === 15) && Math.random() < 0.5) {
                 triggerHat(this.audioCtx, this.distortion, now, true); // true = open hat
             }

            // --- Bass Line ---
            const bassStep = this.stepCounter % this.bassNotes.length;
            // Play bass notes less frequently, e.g., on specific beats
            if (beat16 % 4 === 0 || beat16 === 7 || beat16 === 11 || beat16 === 14) { // Example syncopated pattern
                 if (Math.random() < 0.7) { // Chance to play bass note
                    triggerBass(this.audioCtx, this.masterGain, now, this.bassNotes[bassStep]);
                }
             }

            // --- Lead Melody ---
            // Play lead only during certain sections (e.g., bars 2 & 4 of a 4-bar loop)
            const leadActive = (beat64 >= 16 && beat64 < 32) || (beat64 >= 48 && beat64 < 64);
            if (leadActive) {
                 // Play lead notes sparsely, e.g., every 2 or 4 steps
                 if (beat16 % 4 === 0 || beat16 % 4 === 2) { // Example pattern on 1st & 3rd beat of bar
                     if (Math.random() < 0.6) { // Chance to play lead note
                         const leadNoteIndex = beat16 % this.leadNotes.length;
                         const octaveShift = (Math.random() < 0.15) ? 12 : 0; // Occasionally jump octave
                         triggerLead(this.audioCtx, this.distortion, now, this.leadNotes[leadNoteIndex] + octaveShift, getRandom); // Pass getRandom utility
                    }
                 }
             }

            // --- FX Sounds ---
            // Occasional random 'zap'
            if (Math.random() < 0.04) { // Lowered frequency
                triggerZap(this.audioCtx, this.distortion, now);
            }
            // Longer noise sweep, e.g., every 32 or 64 steps
            if (beat64 === 0 && Math.random() < 0.7) { // Play sweep at start of 64-step cycle
                triggerSweep(this.audioCtx, this.masterGain, now);
            }

            // Increment step counter for the next call
            this.stepCounter++; // Let it increment indefinitely, use modulo for patterns
            // Optional: Wrap stepCounter if needed for specific long-term structures
            // this.stepCounter = this.stepCounter % 256;

        } catch (e) {
            console.error("Error during musicSequencer tick:", e);
            this.stopMusic(); // Stop music if errors occur to prevent spamming
        }
    }

    /**
     * Toggles the master audio mute state on/off.
     * Smoothly ramps the master gain and stops/starts the music sequencer.
     */
    toggleMute() {
        // Guard: Ensure audio is initialized before trying to mute/unmute
        if (!this.isAudioInitialized || !this.masterGain || !this.audioCtx) {
            console.warn("Cannot toggle mute: Audio not initialized.");
            return;
        }

        this.isMuted = !this.isMuted; // Flip the state
        const targetVolume = this.isMuted ? 0.001 : C.MASTER_VOLUME; // Target near zero for mute
        const now = this.audioCtx.currentTime;

        // Smoothly change the volume using linearRampToValueAtTime
        this.masterGain.gain.cancelScheduledValues(now); // Cancel any pending ramps
        this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + 0.1); // Ramp over 0.1 seconds

        console.log(`Audio Muted: ${this.isMuted}`);

        // Stop or start the music sequencer based on the new mute state
        if (this.isMuted) {
            this.stopMusic();
        } else {
            // If unmuting, try to start the music only if the game is running
            // and the current scene indicates active gameplay.
            if (this.isRunning && this.currentScene?.isGameplayActive()) {
                this.startMusic();
            }
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
     * @param {string} name - The name of the scene to switch to.
     */
    setScene(name) {
        console.log(`Attempting to set active scene to: "${name}"`);
        const newScene = this.scenes[name];

        if (!newScene) {
            console.error(`Failed to set scene: Scene "${name}" not found in registry!`);
            alert(`Error: Could not load game scene "${name}".`);
            this.stop(); // Stop the game if a critical scene is missing
            return;
        }

        // Call onExit on the current scene if it exists and has the method
        if (this.currentScene && typeof this.currentScene.onExit === 'function') {
            console.log(`Exiting previous scene: "${this.currentScene.constructor.name}"`);
            this.currentScene.onExit();
        }

        // Set the new scene as current
        this.currentScene = newScene;
        console.log(`Current scene set to: "${name}"`);

        // Call onEnter on the new scene if it exists and has the method
        if (typeof this.currentScene.onEnter === 'function') {
            this.currentScene.onEnter(); // Initialize the new scene
        } else {
             console.warn(`Scene "${name}" loaded but has no onEnter method defined.`);
        }

        console.log(`Scene set to "${name}". Current scene is ${this.currentScene ? this.currentScene.constructor.name : 'null'}`);

        // Special handling after setting scene: Attempt to start music if applicable
        if (this.isAudioInitialized && !this.isMuted && this.isRunning && this.currentScene?.isGameplayActive()) {
             console.log("Scene changed to active gameplay: Starting music.");
             this.startMusic();
        } else {
             // Stop music if the new scene is not active gameplay (e.g., title screen)
             this.stopMusic();
        }
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
                // Clear the canvas completely before drawing the new frame
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
             this.startMusic();
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
}