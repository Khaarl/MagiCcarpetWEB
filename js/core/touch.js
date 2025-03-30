// magic-carpet-game/js/core/touch.js

/**
 * Handles touch input by dividing the screen into zones for movement and actions.
 */
export class TouchControls {
    /**
     * Creates an instance of TouchControls.
     * @param {Game} gameInstance - A reference to the main Game object.
     */
    constructor(gameInstance) {
        this.game = gameInstance;
        this.canvas = gameInstance.canvas;

        // Define zones as fractions of the canvas dimensions
        // Allows easy adaptation to different screen sizes
        this.zoneDefs = {
            left: { x: 0, y: 0, w: 1/3, h: 1 },    // Left third for moving left
            right: { x: 1/3, y: 0, w: 1/3, h: 1 },   // Middle third for moving right
            jump: { x: 2/3, y: 0, w: 1/3, h: 1 }    // Right third for jumping/flying
            // Example for adding an attack zone (e.g., bottom right corner)
            // attack: { x: 2/3, y: 2/3, w: 1/3, h: 1/3 }
        };

        // This will store the calculated pixel coordinates of the zones
        this.zones = {};

        // Stores the identifier of the touch currently active in each zone
        // Allows multi-touch (e.g., moving left while jumping)
        this.activeTouches = {
            left: null,
            right: null,
            jump: null,
            // attack: null // Add if attack zone is implemented
        };

        // Bind methods to ensure 'this' context is correct in event handlers
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.calculateZones = this.calculateZones.bind(this); // Bind resize handler too

        this.calculateZones(); // Initial calculation based on current canvas size
        this.addListeners();   // Attach event listeners
    }

    /**
     * Calculates the pixel coordinates for each touch zone based on the current canvas size.
     * This should be called initially and on window resize.
     */
    calculateZones() {
        // Use offsetWidth/offsetHeight for the actual displayed size,
        // which might differ from canvas.width/height due to CSS scaling.
        const w = this.canvas.offsetWidth;
        const h = this.canvas.offsetHeight;

        for (const key in this.zoneDefs) {
            const def = this.zoneDefs[key];
            this.zones[key] = {
                x: def.x * w,
                y: def.y * h,
                width: def.w * w,
                height: def.h * h
            };
        }
         // console.log("Recalculated Touch Zones (pixels):", this.zones); // For debugging
    }

    /**
     * Attaches the necessary touch event listeners to the canvas
     * and a resize listener to the window.
     */
    addListeners() {
        // Use passive: false to allow preventDefault() - important for stopping scrolling/zooming
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        // touchcancel is important for cases where the touch is interrupted (e.g., alert box)
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

        // Recalculate zones if the window (and potentially canvas) is resized
        window.addEventListener('resize', this.calculateZones);
    }

    /**
     * Handles the 'touchstart' event. Identifies which zone the touch started in
     * and registers the touch identifier for that zone.
     * @param {TouchEvent} event - The touch event object.
     */
    handleTouchStart(event) {
        event.preventDefault(); // Prevent default browser actions (like scrolling or zooming)
        const touches = event.changedTouches; // Get the touches that *just* started
        const rect = this.canvas.getBoundingClientRect(); // Get canvas position on the page

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            // Calculate coordinates relative to the canvas element
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            const touchId = touch.identifier; // Unique ID for this specific touch point

            // Check which zone the touch is inside and if that zone isn't already active
            // This prevents a second finger in the same zone from taking over
            if (this.isInside(touchX, touchY, this.zones.left) && this.activeTouches.left === null) {
                this.activeTouches.left = touchId;
                // console.log(`Touch Start: Left (ID: ${touchId})`); // Debugging
            } else if (this.isInside(touchX, touchY, this.zones.right) && this.activeTouches.right === null) {
                this.activeTouches.right = touchId;
                // console.log(`Touch Start: Right (ID: ${touchId})`); // Debugging
            } else if (this.isInside(touchX, touchY, this.zones.jump) && this.activeTouches.jump === null) {
                this.activeTouches.jump = touchId;
                // console.log(`Touch Start: Jump (ID: ${touchId})`); // Debugging
            }
            // else if (this.isInside(touchX, touchY, this.zones.attack) && this.activeTouches.attack === null) {
            //     this.activeTouches.attack = touchId;
            // }
            // Add checks for other zones if implemented
        }
    }

    /**
     * Handles the 'touchmove' event. Currently only prevents default actions.
     * Could be used to track if a touch moves out of its original zone if needed.
     * @param {TouchEvent} event - The touch event object.
     */
    handleTouchMove(event) {
        event.preventDefault(); // Prevent scrolling while dragging finger
        // Optional: Logic to handle touches moving between zones
    }

    /**
     * Handles the 'touchend' and 'touchcancel' events.
     * Clears the active touch identifier for the zone associated with the ended touch.
     * @param {TouchEvent} event - The touch event object.
     */
    handleTouchEnd(event) {
        event.preventDefault();
        const touches = event.changedTouches; // Get the touches that *just* ended

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = touch.identifier;

            // Check if this ended touch ID matches any active zone
            if (touchId === this.activeTouches.left) {
                this.activeTouches.left = null;
                // console.log(`Touch End: Left (ID: ${touchId})`); // Debugging
            }
            if (touchId === this.activeTouches.right) {
                this.activeTouches.right = null;
                // console.log(`Touch End: Right (ID: ${touchId})`); // Debugging
            }
            if (touchId === this.activeTouches.jump) {
                this.activeTouches.jump = null;
                // console.log(`Touch End: Jump (ID: ${touchId})`); // Debugging
            }
            // if (touchId === this.activeTouches.attack) {
            //     this.activeTouches.attack = null;
            // }
            // Add checks for other zones
        }
    }

    /**
     * Checks if a given point (x, y) is inside a zone rectangle.
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @param {object} zone - The zone rectangle { x, y, width, height }.
     * @returns {boolean} True if the point is inside the zone, false otherwise.
     */
    isInside(x, y, zone) {
        if (!zone) return false; // Check if zone exists
        return x >= zone.x && x <= zone.x + zone.width &&
               y >= zone.y && y <= zone.y + zone.height;
    }

    /**
     * Returns the current input state based on which touch zones are active.
     * This is called by the main game loop or scene update.
     * @returns {object} An object representing the current input state (e.g., { left: true, right: false, space: true, attack: false }).
     */
    getInput() {
        // Simply check if a touch ID is currently assigned to each zone
        return {
            left: this.activeTouches.left !== null,
            right: this.activeTouches.right !== null,
            space: this.activeTouches.jump !== null, // Map jump zone to 'space' key equivalent
            attack: false // Set to true if attack zone implemented and active: this.activeTouches.attack !== null
            // Note: For a 'tap' attack, logic might differ. You might set attack=true in handleTouchStart
            // and immediately reset it here after reading it once.
        };
    }

    /**
     * Optional: Renders visual feedback for the touch zones onto the canvas.
     * Useful for debugging or showing players where the controls are.
     * @param {CanvasRenderingContext2D} ctx - The drawing context.
     */
    render(ctx) {
        ctx.save();
        // Set a low opacity for the zone indicators
        ctx.globalAlpha = 0.15;

        // --- Draw Left Zone ---
        if (this.zones.left) {
            // Make zone slightly brighter if active
            ctx.fillStyle = (this.activeTouches.left !== null) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(this.zones.left.x, this.zones.left.y, this.zones.left.width, this.zones.left.height);
            // Optional Text Label
            // ctx.fillStyle = "white"; ctx.fillText("LEFT", this.zones.left.x + 10, this.zones.left.y + 20);
        }

        // --- Draw Right Zone ---
        if (this.zones.right) {
            ctx.fillStyle = (this.activeTouches.right !== null) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(this.zones.right.x, this.zones.right.y, this.zones.right.width, this.zones.right.height);
            // Optional Text Label
        }

        // --- Draw Jump Zone ---
        if (this.zones.jump) {
            ctx.fillStyle = (this.activeTouches.jump !== null) ? 'rgba(173, 216, 230, 0.4)' : 'rgba(173, 216, 230, 0.15)'; // Light blueish
            ctx.fillRect(this.zones.jump.x, this.zones.jump.y, this.zones.jump.width, this.zones.jump.height);
            // Optional Text Label
            // ctx.fillStyle = "white"; ctx.fillText("JUMP/FLY", this.zones.jump.x + 10, this.zones.jump.y + 20);
        }

        // --- Draw Attack Zone (if implemented) ---
        // if (this.zones.attack) {
        //     ctx.fillStyle = (this.activeTouches.attack !== null) ? 'rgba(255, 100, 100, 0.4)' : 'rgba(255, 100, 100, 0.15)'; // Reddish
        //     ctx.fillRect(this.zones.attack.x, this.zones.attack.y, this.zones.attack.width, this.zones.attack.height);
        // }

        ctx.restore(); // Restore original alpha and fillStyle
    }

    /**
     * Removes event listeners. Should be called if the TouchControls instance is no longer needed.
     */
    destroy() {
        console.log("Destroying TouchControls listeners.");
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
        window.removeEventListener('resize', this.calculateZones);
    }
}