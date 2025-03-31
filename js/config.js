// magic-carpet-game/js/config.js

// --- Canvas ---
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// --- Debug / Development ---
export const ALLOW_DEVELOPER_MODE = true; // Enables the developer mode toggle key (~)

// --- Base Physics ---
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = 14.5;

// --- Ground Movement ---
export const GROUND_ACCELERATION = 2.0; // Reduced from 2.4
export const GROUND_MAX_SPEED = 12; // Reduced from 16
export const GROUND_FRICTION = 0.7; // Increased from 0.5

// --- Air/Flying Movement ---
export const AIR_ACCELERATION = 0.65; // Reduced from 0.8
export const AIR_MAX_SPEED = 14.0; // Reduced from 17.0
export const AIR_FRICTION = 0.985; // Increased from 0.98
export const FLY_STRENGTH = 1.3; // Reduced from 1.5
export const MAX_FLY_SPEED = 9.0; // Reduced from 10.0
export const FLYING_GRAVITY_MULTIPLIER = 0.3; // Reduced from 0.4
export const FLYING_PARTICLE_RATE = 0.3; // 30% chance per frame for flying particles

// --- Magic Carpet ---
export const CARPET_WIDTH = 130; // Increased from 110 for better visuals
export const CARPET_HEIGHT = 15; // Increased from 10 for better visuals
export const CARPET_COLOR_1 = '#8050e0'; // Slightly adjusted top gradient color
export const CARPET_COLOR_2 = '#c090f0'; // Slightly adjusted bottom gradient color
export const CARPET_OFFSET_Y = 5; // Unchanged
export const CARPET_WAVE_SPEED = 5; // Reduced from 8 for smoother animation
export const CARPET_WAVE_AMP_X = 0.06; // Reduced from 0.08
export const CARPET_WAVE_AMP_Y = 0.12; // Reduced from 0.15
export const CARPET_MOVEMENT_RESPONSE = 0.0015; // How much movement affects wave amplitude
export const CARPET_MAX_MOVEMENT_AMP_MULT = 2.5; // Maximum multiplier for wave amplitude based on movement
export const CARPET_TRAIL_PARTICLES = true; // Enable trailing particles for faster movement
export const CARPET_TRAIL_SPEED_THRESHOLD = 8.0; // Minimum speed for trail particles
export const CARPET_EDGE_DETAIL = 8; // Number of tassels/decorative elements on carpet edges
export const CARPET_PATTERN_ENABLED = true; // Whether to show decorative pattern on carpet

// --- Sword FX ---
export const SWORD_GLOW_COLOR = 'rgba(200, 200, 255, 0.7)';
export const SWORD_GLOW_BLUR = 12;
export const SWORD_LIGHTNING_COLOR = 'rgba(220, 220, 255, 0.8)';
export const SWORD_LIGHTNING_SPEED = 150;
export const SWORD_LIGHTNING_LIFESPAN = 0.15;
export const SWORD_LIGHTNING_CHANCE = 0.1; // Probability of lightning effect on swing
export const ATTACK_DURATION = 0.25; // How long the attack state/animation lasts (seconds)
export const ATTACK_COOLDOWN = 0.1; // Time after attack before another can start (seconds)
export const SWORD_HITBOX_WIDTH = 45;
export const SWORD_HITBOX_HEIGHT = 30;
export const SWORD_HITBOX_OFFSET_X = 15; // Horizontal offset from player center
export const SWORD_KNOCKBACK_STRENGTH = 6; // Base horizontal knockback force
export const SWORD_VERTICAL_KNOCKBACK = -2; // Upward knockback force on hit

// --- Fireball Attack ---
export const FIREBALL_SPEED = 400; // Pixels per second
export const FIREBALL_RADIUS = 16;
export const FIREBALL_COOLDOWN = 0.5; // Seconds between shots
export const FIREBALL_TEST_COOLDOWN = 0.25; // Reduced cooldown in test mode
export const FIREBALL_LIFESPAN = 5.0; // Seconds before fizzling out
export const FIREBALL_EXPLOSION_RADIUS = 50; // Area of effect for explosion damage
export const FIREBALL_EXPLOSION_PARTICLES = 25; // Number of particles on explosion
export const FIREBALL_COLOR = '#ff8800'; // Base color (used in drawing function)
export const FIREBALL_EXPLOSION_COLOR = '#ffcc66'; // Base color for explosion particles

// --- Lightning Bolt Attack ---
export const LIGHTNING_BOLT_COOLDOWN = 1.0; // Seconds between casts
export const LIGHTNING_BOLT_CHAIN_COUNT = 3; // Max number of enemies chained
export const LIGHTNING_BOLT_RANGE = 300; // Initial range from player
export const LIGHTNING_BOLT_CHAIN_RANGE = 200; // Range for subsequent chains
export const LIGHTNING_BOLT_DURATION = 0.5; // How long the bolt visual lasts (seconds)
export const LIGHTNING_BOLT_COLOR = '#00FFFF'; // Cyan base color
export const LIGHTNING_BOLT_SECONDARY_COLOR = '#FFFFFF'; // White core color
export const LIGHTNING_BOLT_WIDTH = 3; // Thickness of the bolt line
export const LIGHTNING_BOLT_SEGMENTS = 8; // Number of jagged segments per bolt

// --- Other Gameplay ---
export const ANIMATION_SPEED = 8.0; // Base speed multiplier for animations
export const NUM_REWARDS = 3; // Number of collectibles to spawn per level
export const STARTING_LIVES = 3;
export const INVULNERABILITY_DURATION = 1.0; // Seconds of flashing/invincibility after taking damage
export const SHIELD_INVULNERABILITY_DURATION = 0.5; // Shorter duration after shield breaks
export const SCREEN_FLASH_DURATION = 0.3; // Default duration for screen flashes
export const SCREEN_FLASH_COLOR_DAMAGE = 'rgba(255, 50, 50, 0.5)'; // Red flash for player damage
export const SCREEN_FLASH_COLOR_POWER = 'rgba(255, 255, 150, 0.6)'; // Yellow/White flash for powerups/shield break
export const BAT_DESTROY_RADIUS = 180; // Radius for potential unused bat destruction effect
export const BACKGROUND_COLOR = '#0a0a1a'; // Fallback background color if needed
export const PLATFORM_BASE_COLOR = '#d2b48c'; // Sandy tan platform body
export const PLATFORM_EDGE_COLOR = '#f7d78f'; // Light gold platform edge/glow
export const PLATFORM_EDGE_GLOW_BLUR = 6;
export const PLAYER_COLOR = '#333333'; // Changed from '#ffffff' to dark gray
export const GOAL_FRAME_COLOR = '#a0a0ff'; // Outer color of the goal doorway
export const GOAL_INNER_COLOR = '#100510'; // Dark color inside the goal
export const COLLECTIBLE_COLOR = '#ffccff'; // Color of the reward orbs
export const SWORD_COLOR = '#e0e0ff'; // Color of the sword blade
export const SWORD_LINE_WIDTH = 2;
export const REWARD_BASE_RADIUS = 15; // Visual radius of the collectible orb
export const REWARD_COLLISION_SIZE = REWARD_BASE_RADIUS * 2; // Collision box size for rewards
export const GOAL_DOOR_WIDTH = 80;
export const GOAL_DOOR_HEIGHT = 120;
export const PULSE_SPEED = 4.0; // Speed for pulsating effects (rewards, goal)
export const PULSE_MAGNITUDE_ORB = 0.3; // How much the reward orb radius changes
export const GLOW_BLUR = 10; // Base blur radius for glows
export const GLOW_OFFSET = 0; // Offset for shadow/glow effects
export const WIN_TEXT_COLOR = '#ffffff';
export const WIN_TEXT_FONT = 'bold 80px sans-serif';
export const STAR_COUNT = 150; // Number of stars in the background starfield
export const BG_SCROLL_FACTOR_STARS = 0.02; // Parallax scroll speed factor for stars
export const LAVA_BASE_HEIGHT = 80; // Average height of the lava from the bottom
export const LAVA_STRIP_HEIGHT = 10; // Height of the bright lava highlight strips
export const LAVA_HEIGHT = LAVA_BASE_HEIGHT; // (Seems redundant with LAVA_BASE_HEIGHT)
export const LAVA_SPEED = 0.004; // Horizontal speed of lava waves (time multiplier)
export const LAVA_SCALE_X1 = 0.02; // Frequency/scaling of the first lava wave component
export const LAVA_SCALE_X2 = 0.05; // Frequency/scaling of the second lava wave component
export const LAVA_WAVE_HEIGHT = 25; // Max amplitude of lava waves
export const LAVA_VERTICAL_SPEED = 0.0015; // Speed of overall vertical lava bobbing
export const LAVA_SEGMENT_WIDTH = 4; // Width of segments used to draw the lava surface
export const CACTUS_WIDTH = 50;
export const CACTUS_HEIGHT = 80;
export const CACTUS_COLOR = '#44bb44';
export const CACTUS_CHANCE = 0.30; // Probability a suitable platform will have a cactus
export const ORBITER_DISTANCE = 40; // Distance of shield orbs from player center
export const ORBITER_RADIUS = 5; // Visual radius of shield orbs
export const ORBITER_SPEED = 4; // Angular speed of shield orb rotation (radians/sec)
export const ORBITER_COLOR = '#80ff80'; // Color of shield orbs
export const PARTICLE_LIFESPAN = 0.5; // Base lifespan for particles (seconds)
export const PARTICLE_SPEED = 40; // Base speed for particles
export const PARTICLE_DRAG = 0.95; // Multiplier applied to particle velocity each frame (closer to 1 = less drag)
export const PARTICLE_GRAVITY = 30; // Gravity applied to particles (if useGravity is true)
export const STARDUST_LIFESPAN = 0.4; // Lifespan for player trail particles
export const STARDUST_SPEED = 20; // Base speed for player trail particles
export const STARDUST_DRAG = 0.97; // Drag for player trail particles
export const STARDUST_COLOR = '#ddeeff'; // Color of player trail particles
export const LOW_STATUS_PULSE_SPEED = 8.0; // Speed for UI pulsing when low lives/shields
export const COYOTE_TIME_DURATION = 0.1; // Seconds player can still jump after leaving edge

// --- Level Generation ---
export const CHUNK_WIDTH = CANVAS_WIDTH; // Width of a generation chunk
export const NUM_CHUNKS = 10; // Number of chunks to generate for the level length
export const PLATFORM_HEIGHT = 20; // Thickness of platforms
export const PLATFORM_BUFFER = 30; // Minimum space between platforms during generation
export const MIN_PLAT_WIDTH_CHUNK = 100; // Minimum width of a generated platform
export const MAX_PLAT_WIDTH_CHUNK = 250; // Maximum width of a generated platform
export const STEP_HEIGHT_MIN = 40; // Min vertical distance between stepping platforms
export const STEP_HEIGHT_MAX = 80; // Max vertical distance between stepping platforms
export const STEP_WIDTH_MIN = 100; // Min horizontal distance between stepping platforms
export const STEP_WIDTH_MAX = 180; // Max horizontal distance between stepping platforms
export const FLOAT_PLAT_MIN_SEP_X = 80; // Min horizontal distance for floating platforms
export const FLOAT_PLAT_MAX_SEP_X = 200; // Max horizontal distance for floating platforms
export const FLOAT_PLAT_MIN_SEP_Y = 50; // Min vertical distance for floating platforms
export const FLOAT_PLAT_MAX_SEP_Y = 120; // Max vertical distance for floating platforms
export const SPAWN_CLEAR_RADIUS = 120; // Radius around player start with no platforms/enemies
export const REWARD_CLEAR_RADIUS = 100; // Radius around spawn/goal with no rewards
export const EXIT_CLEAR_RADIUS = 150; // Radius around goal with no enemies
export const START_PLATFORM_WIDTH = 200; // Width of the initial starting platform
export const MAX_REWARD_PLACEMENT_ATTEMPTS = 25; // Tries to place each reward
export const MAX_PLACEMENT_ATTEMPTS = 25; // Tries per platform/enemy placement step

// --- Bat Enemy ---
export const NUM_BATS_TO_SPAWN = 10; // Target number of bats per level
export const BAT_PATROL_RANGE = 200; // Max distance bats patrol from their origin
export const BAT_DETECTION_RADIUS = 400; // Range at which bats detect the player
export const BAT_LEASH_RADIUS = BAT_DETECTION_RADIUS * 1.6; // Range player must exceed for bat to return
export const BAT_RETURN_SPEED_MULTIPLIER = 1.2; // Speed increase when returning to origin
export const BAT_ORIGIN_THRESHOLD_SQ = 30 * 30; // Squared distance threshold to consider bat "at origin"
export const BAT_CHASE_SPEED = 80.0; // Speed when chasing player
export const BAT_PATROL_SPEED = 48.0; // Speed when patrolling

// --- Ground Patroller Enemy ---
export const PATROLLER_SPEED = 1.5 * 60; // Speed in pixels per second (original was likely per frame)
export const PATROLLER_WIDTH = 25;
export const PATROLLER_HEIGHT = 60;
export const PATROLLER_COLOR = '#dd8855'; // Brownish color
export const PATROLLER_HEALTH = 2;
export const NUM_PATROLLERS_TO_SPAWN = 4; // Target number per level

// --- Snake Enemy ---
export const NUM_SNAKES_TO_SPAWN = 6; // Target number per level (reduced)
export const SNAKE_WIDTH = 40; // Width of the head segment/collision box
export const SNAKE_HEIGHT = 20; // Height of the head segment/collision box
export const SNAKE_COLOR = '#d4af37'; // Goldish primary color
export const SNAKE_ACCENT_COLOR = '#8b4513'; // Brown secondary color
export const SNAKE_PATROL_RANGE = 250;
export const SNAKE_DETECTION_RADIUS = 350;
export const SNAKE_LEASH_RADIUS = SNAKE_DETECTION_RADIUS * 1.4;
export const SNAKE_PATROL_SPEED = 60.0; // Snake patrol speed (pixels/sec)
export const SNAKE_CHASE_SPEED = 90.0; // Snake chase speed (pixels/sec)
export const SNAKE_HEALTH = 3;
export const SNAKE_BODY_SEGMENTS = 16; // Number of visual segments (reduced for performance if needed)
export const SNAKE_UNDULATION_SPEED = 6.0; // Speed of the body wave animation
export const SNAKE_UNDULATION_AMPLITUDE = 15.0; // How wide the body wave is

// --- Giant Bat Boss ---
export const GIANT_BAT_BOSS_WIDTH = 80;
export const GIANT_BAT_BOSS_HEIGHT = 50;
export const GIANT_BAT_BOSS_COLOR_1 = '#4b0082'; // Indigo base
export const GIANT_BAT_BOSS_COLOR_2 = '#8a2be2'; // Blue-violet wings
export const GIANT_BAT_BOSS_EYE_COLOR = '#ff1493'; // Deep pink eyes
export const GIANT_BAT_BOSS_HEALTH = 20;
export const GIANT_BAT_BOSS_CHASE_SPEED = 95.0; // Pixels/sec
export const GIANT_BAT_BOSS_PATROL_SPEED = 55.0; // Pixels/sec
export const GIANT_BAT_BOSS_DETECTION_RADIUS = 550;
export const GIANT_BAT_BOSS_LEASH_RADIUS = GIANT_BAT_BOSS_DETECTION_RADIUS * 1.8;
export const GIANT_BAT_BOSS_SPAWN_INTERVAL = 15.0; // Seconds between spawning minions
export const GIANT_BAT_BOSS_SPAWN_COUNT = 2; // Number of bats spawned each time
export const GIANT_BAT_BOSS_SPAWN_RADIUS = 200; // Radius around boss where minions spawn
export const GIANT_BAT_BOSS_FLAP_SPEED_MULT = 0.7; // Multiplier for wing flap animation speed
export const GIANT_BAT_BOSS_KNOCKBACK_RESISTANCE = 0.4; // 0 = full knockback, 1 = no knockback

// --- Audio --- (Based on original values)
export const BPM = 145;
export const SIXTEENTH_NOTE_DURATION = 60 / BPM / 4; // Seconds per 16th note
// Kick Drum
export const KICK_FREQ = 55; // Base frequency (A1)
export const KICK_DECAY = 0.18; // Duration of the sound
export const KICK_PITCH_ENV_AMOUNT = 30; // Pitch drop amount
// Snare Drum
export const SNARE_DECAY = 0.1;
export const SNARE_FREQ = 1600; // Center frequency for noise bandpass
// Hi-Hat
export const HAT_DECAY = 0.03; // Closed hat duration
export const HAT_DECAY_OPEN = 0.15; // Open hat duration
export const HAT_FREQ = 9000; // Frequency for highpass filter
// Bass Synth
export const BASS_FREQ = 41; // Base frequency (E1)
export const BASS_FILTER_FREQ = 350; // Lowpass filter cutoff
export const BASS_DECAY = SIXTEENTH_NOTE_DURATION * 1.8; // Slightly longer than a 16th note
// Lead Synth
export const LEAD_FREQ_BASE = 220; // Base frequency (A3)
export const LEAD_FILTER_FREQ_START = 5000; // Filter starting frequency
export const LEAD_FILTER_FREQ_END = 500; // Filter ending frequency
export const LEAD_FILTER_Q = 8; // Resonance of the filter
export const LEAD_DECAY = SIXTEENTH_NOTE_DURATION * 0.9; // Slightly shorter than 16th
// FX Sounds
export const ZAP_FREQ_START = 4000;
export const ZAP_FREQ_END = 100;
export const ZAP_DECAY = 0.05;
export const NOISE_BURST_DECAY = 0.04; // Used in hit sounds?
export const SWEEP_DURATION = SIXTEENTH_NOTE_DURATION * 16; // Duration of noise sweep (4 beats)
// Master Audio Settings
export const MASTER_VOLUME = 0.3; // Overall game volume (0 to 1)
export const DISTORTION_AMOUNT = 40; // Amount for distortion effect curve
// Pad Synth (Background ambient sound)
export const PAD_VOLUME = 0.08; // Volume of the background pad
export const PAD_LFO_RATE = 0.1; // Speed of the pad's frequency modulation (Hz)
export const PAD_LFO_DEPTH = 5; // Amount of frequency modulation

// --- Initial Entity States (Prototypes) ---
// Use these with deepCopy() to create new instances
export const INITIAL_PLAYER_STATE = {
    x: 100, y: CANVAS_HEIGHT - 100, width: 20, height: 45,
    velocityX: 0, velocityY: 0, onGround: false, groundPlatform: null,
    facingDirection: 'right', animationState: 'idle', animationTimer: 0,
    animationFrameIndex: 0, isAttacking: false, attackTimer: 0,
    attackCooldownTimer: 0, landingTimer: 0, coyoteTimer: 0,
    lives: STARTING_LIVES, orbShieldCount: 0, fireballCooldownTimer: 0,
    lightningBoltCooldownTimer: 0, invulnerabilityTimer: 0, // Added invulnerability timer
    hitSoundPlayedThisSwing: false, // Added flag for sword hit sound
    // Developer Mode Flags
    isInvincible: false,
    noclipActive: false
};

export const INITIAL_GOAL_STATE = {
    x: 0, y: 0, width: GOAL_DOOR_WIDTH, height: GOAL_DOOR_HEIGHT, color: GOAL_FRAME_COLOR
};

export const BAT_PROTOTYPE = {
    x: 0, y: 0, width: 25, height: 15, velocityX: 0, velocityY: 0, type: 'bat',
    state: 'idle', stateTimer: 0, originX: 0, originY: 0, patrolTargetX: 0, patrolTargetY: 0,
    patrolRange: BAT_PATROL_RANGE, detectionRadius: BAT_DETECTION_RADIUS,
    leashRadius: BAT_LEASH_RADIUS, chaseSpeed: BAT_CHASE_SPEED, patrolSpeed: BAT_PATROL_SPEED,
    flapTimer: 0, health: 1, randomMoveTimer: 0
};

export const GROUND_PATROLLER_PROTOTYPE = {
    x: 0, y: 0, width: PATROLLER_WIDTH, height: PATROLLER_HEIGHT,
    velocityX: 0, // Initial horizontal velocity
    // velocityY: 0, // If they need vertical physics
    type: 'patroller', health: PATROLLER_HEALTH,
    onPlatform: null, // Reference to the platform they are on
    direction: 1, // 1 for right, -1 for left
    // friction: 0.9 // If needed for smoother stops
};

export const FIREBALL_PROTOTYPE = {
    x: 0, y: 0, vx: 0, vy: 0, radius: FIREBALL_RADIUS, life: FIREBALL_LIFESPAN, active: false, type: 'fireball'
};

export const SNAKE_PROTOTYPE = {
    x: 0, y: 0, width: SNAKE_WIDTH, height: SNAKE_HEIGHT, velocityX: 0, velocityY: 0,
    type: 'snake', state: 'idle', stateTimer: 0, originX: 0, originY: 0,
    patrolTargetX: 0, patrolTargetY: 0, patrolRange: SNAKE_PATROL_RANGE,
    detectionRadius: SNAKE_DETECTION_RADIUS, leashRadius: SNAKE_LEASH_RADIUS,
    chaseSpeed: SNAKE_CHASE_SPEED, patrolSpeed: SNAKE_PATROL_SPEED,
    undulationTimer: 0, health: SNAKE_HEALTH, randomMoveTimer: 0, facingDirection: 1
};

export const GIANT_BAT_BOSS_PROTOTYPE = {
    x: 0, y: 0, width: GIANT_BAT_BOSS_WIDTH, height: GIANT_BAT_BOSS_HEIGHT,
    velocityX: 0, velocityY: 0, type: 'giantBatBoss',
    state: 'idle', stateTimer: 0, originX: 0, originY: 0,
    patrolTargetX: 0, patrolTargetY: 0, patrolRange: BAT_PATROL_RANGE * 1.5, // Boss has larger patrol range
    detectionRadius: GIANT_BAT_BOSS_DETECTION_RADIUS, leashRadius: GIANT_BAT_BOSS_LEASH_RADIUS,
    chaseSpeed: GIANT_BAT_BOSS_CHASE_SPEED, patrolSpeed: GIANT_BAT_BOSS_PATROL_SPEED,
    flapTimer: 0, health: GIANT_BAT_BOSS_HEALTH, randomMoveTimer: 0,
    batSpawnTimer: GIANT_BAT_BOSS_SPAWN_INTERVAL, isDefeated: false
};

// --- Stick Figure Definition ---
// Structure defining player appearance and animations
export const STICK_FIGURE = {
    headRadius: 8,
    jointColor: PLAYER_COLOR,
    lineWidth: 3.5, // Increased from 3 for better visibility with dark color
    outlineColor: '#222222', // Added outline color for contrast
    lineColor: '#444444', // Added specific color for limbs
    sword: null,
    staff: { 
        hand: 'left', 
        length: 48, // Increased from 45 for better proportions
        topOffset: [0, -6], // Adjusted to better align with character
        angle: -15, // Added parameter for slight angle (degrees)
        color: '#5B3A17', // Darker wood color
        gemColor: '#FF3300', // Brighter red for gem
        gemRadius: 5, // Increased from 4 for more prominence
        gemGlow: true,
        gemGlowColor: 'rgba(255, 80, 30, 0.8)', // Increased opacity for stronger glow
        gemGlowRadius: 10, // Increased from 8 for wider glow
        hasRings: true,
        ringColor: '#D4AF37', // More antique gold color
        ringPositions: [0.2, 0.5, 0.75], // Adjusted positions for better spacing
        ringWidth: 3.5 // Slightly wider rings
    },
    hat: { 
        color: '#3A0868', // Darker purple for hat
        tipOffset: [0, -22], // Made taller
        brimWidth: 19, // Slightly wider brim
        brimHeight: 4.5, // Slightly taller brim
        hasStar: true,
        starColor: '#D4AF37', // More antique gold color
        starSize: 4.5, // Slightly larger
        starOffset: [-5, -14], // Adjusted position
        hasMoon: true,
        moonColor: '#A7A7A7', // Slightly darker silver
        moonSize: 3.5, // Slightly larger
        moonOffset: [5, -9] // Adjusted position
    },
    cape: {
        enabled: true,
        attachOffset: [0, -28],
        width: 26, // Slightly wider
        length: 34, // Slightly longer
        color: '#3A0868', // Match hat color
        liningColor: '#7455A8', // Darker lining color
        segments: 6, // Increased from 5 for smoother wave
        waveAmplitude: 7, // Increased from 6 for more dramatic flow
        waveFrequency: 1.8, // Adjusted from 2 for slightly slower waves
        respondToMovement: true
    },
    // Improved animation poses with better limb positioning
    poses: {
        idle: [
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-10, -18], [-15, -8]], // Extended left arm for staff
              armR: [[5, -28], [12, -22], [15, -15]], 
              legL: [[-4, -10], [-6, 0], [-8, 10]], 
              legR: [[4, -10], [6, 0], [8, 10]] },
            { head: [0, -34.5], neck: [0, -27.5], shoulder: [0, -27.5], hip: [0, -10], 
              armL: [[-5, -27.5], [-10, -17.5], [-15, -7.5]], // Subtle breathing animation
              armR: [[5, -27.5], [12, -21.5], [15, -14.5]], 
              legL: [[-4, -10], [-6, 0], [-8, 10]], 
              legR: [[4, -10], [6, 0], [8, 10]] }
        ],
        running: [
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-15, -23], [-25, -18]], // Better arm swing for staff
              armR: [[5, -28], [12, -24], [16, -19]], 
              legL: [[-4, -10], [-5, 0], [-5, 10]], 
              legR: [[4, -10], [15, -5], [20, 5]] },
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-12, -24], [-8, -19]], // Return swing
              armR: [[5, -28], [15, -22], [20, -16]], 
              legL: [[-4, -10], [-15, -5], [-20, 5]], 
              legR: [[4, -10], [5, 0], [5, 10]] }
        ],
        jumping: [
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-10, -35], [-15, -38]], // Staff arm position
              armR: [[5, -28], [10, -32], [12, -28]], // More upwards arm position
              legL: [[-4, -10], [-8, -5], [-12, 0]], 
              legR: [[4, -10], [8, -5], [12, 0]] }
        ],
        falling: [
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-12, -20], [-18, -12]], // Staff arm flailing outward
              armR: [[5, -28], [12, -20], [18, -12]], // Right arm balancing
              legL: [[-4, -10], [-8, -2], [-6, 6]], // Legs slightly bent and spread
              legR: [[4, -10], [8, -2], [6, 6]] }
        ],
        attacking: [
            { head: [2, -35], neck: [1, -28], shoulder: [0, -28], hip: [0, -10], // Head turns slightly 
              armL: [[-5, -28], [-10, -18], [-12, -8]], 
              armR: [[5, -28], [20, -25], [35, -22]], // Adjusted sword arm
              legL: [[-4, -10], [-8, 0], [-10, 10]], // Stance widens
              legR: [[4, -10], [8, 0], [10, 10]] }
        ],
        landing: [
            { head: [0, -33], neck: [0, -26], shoulder: [0, -26], hip: [0, -8], 
              armL: [[-5, -26], [-8, -16], [-12, -6]], // More exaggerated arms for impact
              armR: [[5, -26], [8, -16], [12, -6]], 
              legL: [[-5, -8], [-9, -2], [-11, 5]], // Wider stance
              legR: [[5, -8], [9, -2], [11, 5]] }
        ],
        casting: [ // New pose for magic casting
            { head: [0, -35], neck: [0, -28], shoulder: [0, -28], hip: [0, -10], 
              armL: [[-5, -28], [-15, -30], [-25, -25]], // Staff arm extended forward
              armR: [[5, -28], [10, -30], [15, -35]], // Supporting gesture
              legL: [[-6, -10], [-8, 0], [-10, 10]], // Stable wide stance
              legR: [[6, -10], [8, 0], [10, 10]] }
        ]
    }
};
