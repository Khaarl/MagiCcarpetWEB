// magic-carpet-game/js/main.js

import { Game } from './core/game.js';
import { GameplayScene } from './scenes/gameplayScene.js';
import * as C from './config.js'; // Import constants for canvas dimensions

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const audioOverlay = document.getElementById('audioOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const startTestModeBtn = document.getElementById('startTestModeBtn');
// Other UI elements (timer, lives, etc.) are accessed within GameplayScene

// --- Global Game Instance ---
let game;

// --- Startup Self-Test ---
/**
 * Performs basic checks to ensure the necessary HTML elements and JS classes are available.
 * @returns {boolean} True if all essential tests pass, false otherwise.
 */
function runStartupTests() {
    console.log("--- Running Startup Tests ---");
    let allPassed = true;
    const test = (name, condition) => {
        const result = !!condition; // Ensure boolean result
        console.log(`[${result ? 'PASS' : 'FAIL'}] ${name}`);
        if (!result) {
            allPassed = false;
        }
        return result;
    };

    // Test core DOM elements
    test("Canvas element exists (#gameCanvas)", canvas);
    test("Canvas 2D context obtainable", canvas?.getContext('2d'));
    test("Audio Overlay exists (#audioOverlay)", audioOverlay);
    test("Start Game Button exists (#startGameBtn)", startGameBtn);
    test("Start Test Mode Button exists (#startTestModeBtn)", startTestModeBtn);
    test("Message div exists (#message)", document.getElementById('message'));
    test("Timer div exists (#timer)", document.getElementById('timer'));
    test("Lives display div exists (#livesDisplay)", document.getElementById('livesDisplay'));
    test("Orb Shield display div exists (#orbShieldDisplay)", document.getElementById('orbShieldDisplay'));

    // Test Core JS Classes
    test("Game class defined", typeof Game === 'function');
    test("GameplayScene class defined", typeof GameplayScene === 'function');
    // Could add more tests for utils, core classes if desired

    // Test localStorage (needed for SaveSystem)
    const testStorage = () => {
        try {
            localStorage.setItem('test', 'test');
            const result = localStorage.getItem('test') === 'test';
            localStorage.removeItem('test');
            return result;
        } catch (e) {
            console.error("localStorage test failed:", e);
            return false;
        }
    };
    test("localStorage available (needed for game saves)", testStorage());

    if (allPassed) {
        console.log("--- All Startup Tests Passed ---");
    } else {
        console.error("--- Some Startup Tests Failed! Game might not run correctly. ---");
    }
    return allPassed;
}

// --- Initialization Function ---
/**
 * Sets up the canvas, creates the Game instance, adds scenes, and attaches the overlay listener.
 * Throws errors if critical elements are missing.
 */
function initializeGame() {
    console.log("Initializing Game...");
    if (!canvas) {
        throw new Error("Canvas element #gameCanvas not found!");
    }
    if (!canvas) throw new Error("Canvas element #gameCanvas not found!");
    if (!audioOverlay) throw new Error("Audio overlay element #audioOverlay not found!");
    if (!startGameBtn) throw new Error("Start Game button #startGameBtn not found!");
    if (!startTestModeBtn) throw new Error("Start Test Mode button #startTestModeBtn not found!");

    // Set canvas dimensions from config
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
    console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);

    // Create the main game controller
    game = new Game(canvas);
    console.log("Game instance created.");

    // Add different game states/screens
    game.addScene('gameplay', new GameplayScene());
    console.log("Gameplay scene added.");
    // Add other scenes here if needed (e.g., 'title', 'gameOver')
    // game.addScene('title', new TitleScene());

    // Set up listeners for the specific buttons
    startGameBtn.addEventListener('click', () => handleStartGameClick(false), { once: true });
    startTestModeBtn.addEventListener('click', () => handleStartGameClick(true), { once: true }); // Pass true for test mode
    console.log("Button listeners attached. Waiting for user interaction.");
}

// --- Common Game Start Logic ---
/**
 * Handles the common tasks needed when starting the game (audio, overlay, scene).
 * @param {boolean} isTestMode - Flag indicating if test mode should be activated.
 */
function handleStartGameClick(isTestMode = false) {
    const mode = isTestMode ? "Test Mode" : "Normal Game";
    console.log(`--- ${mode} button clicked ---`);
    if (!game) {
        console.error("Game object not initialized before overlay click!");
        alert("Error: Game initialization failed.");
        return;
    }
    try {
        // 1. Initialize/Resume Audio Context
        // Ensures audio can play after user interaction, crucial for browsers
        if (!game.isAudioInitialized) {
            console.log("Overlay: Initializing audio...");
            game.initAudio(); // Attempt to create AudioContext etc.
        }
        // Attempt to resume if suspended (common state before user interaction)
        if (game.audioCtx && game.audioCtx.state === 'suspended') {
            console.log("Overlay: Attempting to resume suspended AudioContext...");
            game.audioCtx.resume().then(() => {
                console.log("AudioContext resumed successfully.");
                // Try starting music *after* resume, if appropriate
                if (game.isAudioInitialized && !game.isMuted && game.isRunning && game.currentScene?.isGameplayActive()) {
                     console.log("Audio Resumed & Game Running: Starting music.");
                     game.startMusic();
                 }
            }).catch(err => {
                console.error("Overlay: AudioContext resume failed:", err);
                // Inform user if audio cannot be enabled
                alert("Could not enable audio. Please check browser settings/permissions.");
            });
        } else if (game.isAudioInitialized) {
             console.log("Audio was already initialized and not suspended.");
         } else {
             console.warn("Audio initialization might have failed previously or is not supported.");
         }

        // 2. Hide Overlay
        audioOverlay.style.display = 'none';

        // 2.5 Load saved game data if available
        if (game.saveSystem) {
            try {
                console.log("Loading saved game data...");
                const savedData = game.saveSystem.load();
                console.log("Game data loaded:", savedData?.currentLevel || 1);

                // Display a message if returning player
                if (savedData?.currentLevel > 1) {
                    document.getElementById('message').textContent =
                        `Welcome back! Continuing from level ${savedData.currentLevel}`;
                    setTimeout(() => {
                        document.getElementById('message').textContent = '';
                    }, 3000);
                }
            } catch (e) {
                console.error("Error loading saved data:", e);
            }
        }

        // 3. Set Initial Scene and Pass Mode Flag
        // Only set if no scene is currently active
        if (!game.currentScene) {
            console.log(`Setting initial scene to 'gameplay' (Test Mode: ${isTestMode})...`);
            // We need to ensure the scene instance can receive this flag.
            // Assuming the scene instance is already created in initializeGame,
            // we might need to call an init method on it here, or pass the flag differently.
            // For now, let's assume we can pass it when setting the scene or via a method.
            game.setScene('gameplay'); // Set the scene first
            if (game.currentScene && typeof game.currentScene.init === 'function') {
                 game.currentScene.init({ isTestMode: isTestMode }); // Pass the flag to the scene's init method
                 console.log("Called scene init with test mode flag.");
            } else {
                 console.warn("GameplayScene does not have an init method or scene not set correctly. Test mode flag might not be passed.");
                 // As a fallback, maybe set a global flag or property on the game object?
                 // game.isTestMode = isTestMode; // Less ideal, makes game state management harder
            }

            if (!game.currentScene) {
                throw new Error("Failed to set the initial scene 'gameplay'.");
            }
        }

        // 4. Start Game Loop
        // Only start if it's not already running
        if (!game.isRunning) {
            console.log("Overlay: Calling game.start()...");
            game.start(); // Starts the requestAnimationFrame loop and initial music check
        } else {
             // If game was somehow already running but music wasn't (e.g., after pause/resume)
             if (game.isAudioInitialized && !game.isMuted && game.currentScene?.isGameplayActive() && !game.musicIntervalId) {
                  console.log("Overlay: Game already running, attempting to restart music...");
                  game.startMusic();
              }
         }

        console.log(`--- ${mode} start handler finished ---`);

    } catch (error) {
        console.error(`CRITICAL ERROR during ${mode} start handler:`, error);
        alert(`An error occurred starting the game (${mode}): ${error.message}. Check console (F12) for details.`);
        // Attempt to gracefully stop the game if possible
        if (game && game.stop) game.stop();
    }
}


// --- Main Execution ---
// Waits for the HTML document structure to be fully loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Running startup checks...");
    // Perform checks before attempting to initialize
    if (runStartupTests()) {
        try {
            initializeGame();

            // Set up beforeunload event to save game data when closing
            window.addEventListener('beforeunload', () => {
                if (game && game.saveSystem) {
                    console.log("Page closing: Saving game data...");
                    game.saveSystem.save();
                }
            });

        } catch (error) {
            // Catch initialization errors (e.g., missing elements)
            console.error("Game Initialization failed:", error);
            alert(`Game initialization failed: ${error.message}. Check console (F12)`);
            // Optionally display a user-friendly error message on the page itself
            const body = document.querySelector('body');
            if (body && audioOverlay) { // Check if body exists before modifying
                audioOverlay.innerHTML = `<div style="color: red; font-size: 18px; padding: 20px; background: rgba(0,0,0,0.8); border-radius: 10px;">Error during game initialization: ${error.message}<br/>Please check the console (F12) and refresh.</div>`;
                audioOverlay.style.display = 'flex'; // Ensure overlay is visible
                // Remove button listeners if init failed
                startGameBtn?.removeEventListener('click', handleStartGameClick);
                startTestModeBtn?.removeEventListener('click', handleStartGameClick);
            }
        }
    } else {
        // If startup checks fail, inform the user critically.
        alert("Core game components failed startup checks. Game cannot start. Check console (F12).");
        const body = document.querySelector('body');
         if (body && audioOverlay) {
            audioOverlay.innerHTML = `<div style="color: red; font-size: 18px; padding: 20px; background: rgba(0,0,0,0.8); border-radius: 10px;">Startup tests failed. Cannot start game.<br/>Please check the console (F12).</div>`;
            audioOverlay.style.display = 'flex'; // Ensure overlay is visible
             // Remove button listeners if startup failed
             startGameBtn?.removeEventListener('click', handleStartGameClick);
             startTestModeBtn?.removeEventListener('click', handleStartGameClick);
        }
    }
});
