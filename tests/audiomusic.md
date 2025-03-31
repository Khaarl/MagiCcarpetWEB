# Magic Carpet Game - Audio & Music System

## Overview

The Magic Carpet Game features a complete audio system that manages both background music tracks and sound effects. The system is built using the Web Audio API for high-performance audio processing and dynamic sound generation.

## Audio Architecture

The audio system consists of several key components:

1. **AudioManager**: Core class that handles loading, playback, and crossfading between music tracks
2. **Sound Effect Generators**: Functions that synthesize sound effects procedurally
3. **Audio Integration**: Game class methods that trigger audio at appropriate moments
4. **Audio Initialization**: System that ensures audio starts only after user interaction

## Music Track Management

The game includes multiple music tracks for different game states:

- **Title Music**: Middle-eastern themed music for the title screen and menus
- **Gameplay Music**: Adventure-themed background music during actual gameplay

Music tracks are loaded as audio files and managed through the AudioManager, which supports:

- Seamless crossfading between tracks
- Volume control
- Muting/unmuting
- Proper cleanup when switching scenes

### Implementation

```javascript
// Excerpt from AudioManager class
loadTrack(name, url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            this.tracks[name] = audioBuffer;
            console.log(`Loaded audio track: ${name}`);
        });
}

crossfadeToTrack(trackName, duration = 1.0) {
    if (!this.tracks[trackName]) {
        console.warn(`Track "${trackName}" not loaded.`);
        return;
    }
    
    // Fade out current track
    if (this.currentSource) {
        const currentGain = this.trackGainNode;
        currentGain.gain.linearRampToValueAtTime(
            0, 
            this.audioContext.currentTime + duration
        );
    }
    
    // Create and start new track
    const newGain = this.audioContext.createGain();
    newGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    newGain.gain.linearRampToValueAtTime(
        1, 
        this.audioContext.currentTime + duration
    );
    
    // Setup new source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.tracks[trackName];
    source.loop = true;
    
    // Connect and play
    source.connect(newGain);
    newGain.connect(this.masterGain);
    source.start(0);
    
    // Store references
    this.currentSource = source;
    this.trackGainNode = newGain;
    this.currentTrack = trackName;
}
```

## Sound Effects

Sound effects are generated procedurally using the Web Audio API. This approach offers several advantages:

- No need for external sound files, reducing load time and game size
- Dynamic sound generation with variation for more engaging effects
- Control over sound parameters based on game state

### Sound Effect Types

1. **Jump Sound**: Played when the player jumps
2. **Sword Swing**: Played during attack animations
3. **Fireball Launch**: Dynamic sound based on launch force
4. **Lightning Effect**: Electrical crackling sounds
5. **Collision Impacts**: Varied by collision type
6. **Collection Sounds**: For picking up rewards

### Implementation Example

```javascript
// Example of procedural sound effect generation
function triggerJumpSound(audioCtx, masterGain, time) {
    // Create oscillator for the jump sound
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Configure the oscillator
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.exponentialRampToValueAtTime(880, time + 0.1);
    
    // Configure amplitude envelope
    gainNode.gain.setValueAtTime(0.5, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    // Connect nodes
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    // Play sound
    osc.start(time);
    osc.stop(time + 0.2);
}
```

## Test Mode Audio Features

The game's test mode includes special audio considerations:

- **Faster Cooldowns**: Certain sound effects have reduced cooldowns in test mode
- **Modified Parameters**: Some sound effects have adjusted parameters for testing purposes
- **Effect Variations**: Certain effects have extended range or modified characteristics
- **Visualization Aids**: Visual feedback is synchronized with audio for debugging

### Test Mode Implementation

```javascript
// Example of test mode audio implementation
if (this.gameMode === 'test') {
    // In test mode, reduce cooldown for fireball sound effects
    player.fireballCooldownTimer = C.FIREBALL_TEST_COOLDOWN;
    
    // Add extra particles or effects for test mode
    this.effectsSystem.emitParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        10, // more particles
        C.FIREBALL_COLOR,
        { speed: 100, lifespan: 0.8 }
    );
}
```

## Audio Initialization

The audio system initializes only after user interaction to comply with browser autoplay policies:

```javascript
initAudio() {
    try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioManager = new AudioManager(this.audioCtx);

        Promise.all([
            this.audioManager.loadTrack('title', './assets/audio/middle-eastern-title.mp3'),
            this.audioManager.loadTrack('gameplay', './assets/audio/adventure-gameplay.mp3')
        ]).then(() => {
            this.isAudioInitialized = true;
            if (this.currentScene?.name === 'title') {
                this.audioManager.playTrack('title');
            }
        }).catch(err => console.error("Failed to load audio tracks:", err));
    } catch (e) {
        console.error("Audio initialization failed:", e);
        this.isAudioInitialized = false;
    }
}
```

## Muting Controls

Players can control audio with the 'M' key, which toggles all game audio:

```javascript
toggleMute() {
    if (!this.audioManager) return;
    
    this.isMuted = !this.isMuted;
    this.audioManager.setMute(this.isMuted);
    
    // Show feedback to the player
    console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    
    // Optional: Show on-screen indicator
    const muteIndicator = document.getElementById('muteIndicator');
    if (muteIndicator) {
        muteIndicator.textContent = this.isMuted ? 'Audio: OFF' : 'Audio: ON';
        muteIndicator.style.opacity = 1;
        setTimeout(() => { muteIndicator.style.opacity = 0; }, 2000);
    }
}
```

## Future Improvements

Potential future additions to the audio system:

- Additional music tracks for different environments
- More dynamic music transitions based on gameplay intensity
- Positional audio for spatial sound effects
- Advanced reverb and environment modeling
- Audio accessibility options for players with hearing impairments
