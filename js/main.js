// magic-carpet-game/js/main.js
alert("DEBUG: main.js is loading");
console.log("[DEBUG] Starting main.js execution");

import { Game } from './core/game.js';
console.log("[DEBUG] Game import result:", Game ? "Success" : "Failed");

import { GameplayScene } from './scenes/gameplayScene.js';
console.log("[DEBUG] GameplayScene import result:", GameplayScene ? "Success" : "Failed");
import { TitleScene } from './scenes/titleScene.js';
import { TestModeMenuScene } from './scenes/testModeMenuScene.js'; // Import the new scene
import * as C from './config.js'; // Import constants for canvas dimensions

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const audioOverlay = document.getElementById('audioOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const startTestModeBtn = document.getElementById('startTestModeBtn');
// Other UI elements (timer, lives, etc.) are accessed within GameplayScene

// --- Global Game Instance ---
let game;
console.log("[DEBUG] Global game variable declared");

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
    test("HP display div exists (#hpDisplay)", document.getElementById('hpDisplay')); // Changed from livesDisplay
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
    console.log("[DEBUG] initializeGame() called");
    console.log("[DEBUG] Canvas element:", canvas);
    console.log("[DEBUG] Audio overlay:", audioOverlay);
    console.log("[DEBUG] Start buttons:", startGameBtn, startTestModeBtn);
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
    console.log("[DEBUG] Attempting to create Game instance");
    try {
        game = new Game(canvas);
        console.log("[DEBUG] Game instance created successfully:", game);
        console.log("[DEBUG] Game instance methods:",
            "start:", typeof game.start,
            "setScene:", typeof game.setScene,
            "addScene:", typeof game.addScene);
    } catch (e) {
        console.error("[DEBUG] Game instantiation failed:", e);
        throw e;
    }

    // Add different game states/screens
    game.addScene('title', new TitleScene());
    game.addScene('gameplay', new GameplayScene());
    console.log("Initializing TestModeMenuScene...");
    game.addScene('testModeMenu', new TestModeMenuScene()); // Register the test mode menu scene
    console.log("Scenes added: title, gameplay, testModeMenu");
    game.setScene('title');
    console.log("Initial scene set to 'title'.");
    // Add other scenes here if needed (e.g., 'gameOver')

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

        // 3. Set Initial Scene based on Mode
        if (isTestMode) {
            console.log("Setting scene to 'testModeMenu'...");
            game.setScene('testModeMenu');
            if (game.currentScene && typeof game.currentScene.init === 'function') {
                game.currentScene.init({ isTestMode: true });
                console.log("Called testModeMenu scene init with isTestMode: true.");
            } else {
                console.warn("TestModeMenuScene does not have an init method or scene not set correctly.");
            }
        } else {
            console.log("Setting scene to 'gameplay' (Normal Mode)...");
            game.setScene('gameplay');
            if (game.currentScene && typeof game.currentScene.init === 'function') {
                game.currentScene.init({ isTestMode: false });
                console.log("Called gameplay scene init with isTestMode: false.");
            } else {
                console.warn("GameplayScene does not have an init method or scene not set correctly.");
            }
        }

        if (!game.currentScene) {
            throw new Error(`Failed to set the initial scene ('${isTestMode ? 'testModeMenu' : 'gameplay'}').`);
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

        // Re-register event listeners for future use
        startGameBtn.addEventListener('click', () => handleStartGameClick(false), { once: true });
        startTestModeBtn.addEventListener('click', () => handleStartGameClick(true), { once: true });

        console.log(`--- ${mode} start handler finished ---`);

    } catch (error) {
        console.error(`CRITICAL ERROR during ${mode} start handler:`, error);
        alert(`An error occurred starting the game (${mode}): ${error.message}. Check console (F12) for details.`);
        // Attempt to gracefully stop the game if possible
        if (game && game.stop) game.stop();
    }
}

// Initialize the overlay background
function initializeOverlayBackground() {
    const canvas = document.getElementById('overlayCanvas');
    if (!canvas) return;

    // Match canvas resolution to its display size
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    function drawOverlayBackground() {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#1a75ff');
        skyGradient.addColorStop(0.5, '#66a3ff');
        skyGradient.addColorStop(0.7, '#ffcc99');
        skyGradient.addColorStop(1, '#ff9933');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunX = width * 0.8;
        const sunY = height * 0.2;
        const sunRadius = width * 0.08;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 200, 50, 0.8)';
        ctx.shadowBlur = 50;
        ctx.fillStyle = 'rgba(255, 240, 200, 1)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 220, 1)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Distant mountains
        const mountainColors = [
            { color: '#6d5f5e', y: height * 0.5 },
            { color: '#7a6b68', y: height * 0.55 },
            { color: '#8b7973', y: height * 0.6 }
        ];

        mountainColors.forEach(mountain => {
            ctx.fillStyle = mountain.color;
            ctx.beginPath();
            ctx.moveTo(0, height);

            for (let x = 0; x <= width; x += width / 20) {
                const heightVariation = Math.sin(x * 0.01 + x * 0.005) * height * 0.15;
                ctx.lineTo(x, mountain.y + heightVariation);
            }

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();
        });

        // Draw dunes
        const duneColors = [
            { color: '#ffcc66', y: height * 0.7 },
            { color: '#e6ac4d', y: height * 0.8 },
            { color: '#cc9633', y: height * 0.9 }
        ];

        duneColors.forEach(dune => {
            const baseY = dune.y;
            ctx.fillStyle = dune.color;
            ctx.beginPath();
            ctx.moveTo(0, height);

            for (let x = 0; x <= width; x += width / 40) {
                const heightVariation =
                    Math.sin(x * 0.01 + time * 0.1) * height * 0.05 +
                    Math.sin(x * 0.02 - time * 0.05) * height * 0.03 +
                    Math.sin(x * 0.005 + time * 0.02) * height * 0.04;
                ctx.lineTo(x, baseY + heightVariation);
            }

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();
        });

        time += 0.01;
        requestAnimationFrame(drawOverlayBackground);
    }

    drawOverlayBackground();

    // Handle resizing
    window.addEventListener('resize', () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });
}

// --- Main Execution ---
// Waits for the HTML document structure to be fully loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Running startup checks...");
    // Perform checks before attempting to initialize
    if (runStartupTests()) {
        try {
            initializeGame();
            initializeOverlayBackground();

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
