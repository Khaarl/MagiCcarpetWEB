// magic-carpet-game/js/audio.js

import * as C from './config.js'; // C stands for Config (Constants)
import { freqMult, getRandom } from './utils.js'; // Import necessary utilities

// --- Audio Node Creation / Setup ---

/**
 * Creates a WaveShaper curve for distortion effect.
 * @param {number} amount - The intensity of the distortion.
 * @returns {Float32Array} The curve data for the WaveShaperNode.
 */
export function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : C.DISTORTION_AMOUNT; // Use default if not provided
    const n_samples = 44100; // Standard sample rate assumption
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    let i = 0;
    let x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1; // Normalize x between -1 and 1
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); // Distortion formula
    }
    return curve;
}

/**
 * Creates an AudioBuffer containing white noise.
 * @param {AudioContext} audioCtx - The active AudioContext.
 * @param {number} [seconds=1] - The duration of the noise buffer.
 * @returns {AudioBuffer|null} The generated AudioBuffer, or null if context is missing.
 */
export function createWhiteNoiseBuffer(audioCtx, seconds = 1) {
    if (!audioCtx) {
        console.error("Cannot create white noise buffer without AudioContext.");
        return null;
    }
    const bufferSize = audioCtx.sampleRate * seconds;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0); // Get data channel
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // Fill with random values between -1 and 1
    }
    return buffer;
}

// --- Sound Trigger Functions ---
// These functions schedule audio events on the provided AudioContext.
// They take the necessary audio nodes (ctx, gain, distortion) as arguments
// to allow flexibility in routing within the main Game class.

/** Schedules a kick drum sound. */
export function triggerKick(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; // Basic kick sound type

        // Pitch Envelope (Quick drop in pitch)
        const startFreq = C.KICK_FREQ + C.KICK_PITCH_ENV_AMOUNT;
        const endFreq = C.KICK_FREQ;
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.05);

        // Volume Envelope (Fast decay)
        gain.gain.setValueAtTime(1.0, time); // Start loud
        gain.gain.exponentialRampToValueAtTime(0.001, time + C.KICK_DECAY); // Fade out quickly

        // Connect nodes and start/stop
        osc.connect(gain);
        gain.connect(masterGain); // Connect to the main output gain
        osc.start(time);
        osc.stop(time + C.KICK_DECAY + 0.05); // Stop slightly after decay ends
    } catch (e) { console.error("Error in triggerKick:", e); }
}

/** Schedules a snare drum sound using filtered noise. */
export function triggerSnare(audioCtx, distortion, time) {
     if (!audioCtx || !distortion) return;
     try {
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.5); // Short noise buffer
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;

         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         // Filter settings for snare 'snap'
         filter.type = 'bandpass';
         filter.frequency.setValueAtTime(C.SNARE_FREQ, time);
         filter.Q.setValueAtTime(1.0, time); // Moderate resonance

         // Volume Envelope
         gain.gain.setValueAtTime(0.8, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + C.SNARE_DECAY);

         // Connect nodes (Noise -> Filter -> Gain -> Distortion -> Master)
         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Connect to distortion for grit
         noiseSource.start(time);
         noiseSource.stop(time + C.SNARE_DECAY + 0.05);
     } catch (e) { console.error("Error in triggerSnare:", e); }
 }

/** Schedules a hi-hat sound (closed or open) using filtered noise. */
export function triggerHat(audioCtx, distortion, time, isOpen = false) {
     if (!audioCtx || !distortion) return;
     try {
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.5);
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;

         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         const decay = isOpen ? C.HAT_DECAY_OPEN : C.HAT_DECAY;
         const vol = isOpen ? 0.5 : 0.4; // Open hats slightly louder

         // Filter settings for hi-hat 'tick'
         filter.type = 'highpass'; // Cut low frequencies
         filter.frequency.setValueAtTime(C.HAT_FREQ, time);

         // Volume Envelope
         gain.gain.setValueAtTime(vol, time);
         gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

         // Connect nodes (Noise -> Filter -> Gain -> Distortion -> Master)
         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Connect to distortion
         noiseSource.start(time);
         noiseSource.stop(time + decay + 0.05);
     } catch (e) { console.error("Error in triggerHat:", e); }
 }

/** Schedules a bass synth note. */
export function triggerBass(audioCtx, masterGain, time, note) {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth'; // Raw synth waveform
        const freq = C.BASS_FREQ * freqMult(note); // Calculate frequency from base + note offset
        osc.frequency.setValueAtTime(freq, time);

        // Lowpass filter to shape the bass sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(C.BASS_FILTER_FREQ, time);
        filter.Q.setValueAtTime(1.0, time); // Low resonance

        // Volume Envelope
        gain.gain.setValueAtTime(0.7, time); // Bass volume
        gain.gain.linearRampToValueAtTime(0.001, time + C.BASS_DECAY); // Linear decay for bass

        // Connect nodes (Osc -> Filter -> Gain -> Master)
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + C.BASS_DECAY);
    } catch (e) { console.error("Error in triggerBass:", e); }
}

/** Schedules a lead synth note. */
export function triggerLead(audioCtx, distortion, time, note, randomFunc = getRandom) { // Use imported getRandom
    if (!audioCtx || !distortion) return;
    try {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'square'; // Different waveform for lead
        // Slight random pitch variation for character
        const freq = C.LEAD_FREQ_BASE * freqMult(note + randomFunc(-0.1, 0.1));
        osc.frequency.setValueAtTime(freq, time);

        // Bandpass filter with envelope for 'wah' effect
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(C.LEAD_FILTER_FREQ_START, time); // Start high
        filter.Q.setValueAtTime(C.LEAD_FILTER_Q, time); // High resonance
        // Filter frequency sweep down
        filter.frequency.linearRampToValueAtTime(C.LEAD_FILTER_FREQ_END, time + C.LEAD_DECAY * 0.6);

        // Volume Envelope
        gain.gain.setValueAtTime(0.4, time); // Lead volume
        gain.gain.exponentialRampToValueAtTime(0.001, time + C.LEAD_DECAY);

        // Connect nodes (Osc -> Filter -> Gain -> Distortion -> Master)
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(distortion); // Connect to distortion
        osc.start(time);
        osc.stop(time + C.LEAD_DECAY);
    } catch (e) { console.error("Error in triggerLead:", e); }
}

/** Schedules a 'zap' FX sound. */
export function triggerZap(audioCtx, distortion, time) {
     if (!audioCtx || !distortion) return;
     try {
         const osc = audioCtx.createOscillator();
         const gain = audioCtx.createGain();
         osc.type = 'sawtooth'; // Raw waveform for zap

         // Fast downward pitch sweep
         osc.frequency.setValueAtTime(C.ZAP_FREQ_START, time);
         osc.frequency.exponentialRampToValueAtTime(C.ZAP_FREQ_END, time + C.ZAP_DECAY);

         // Fast volume decay
         gain.gain.setValueAtTime(0.5, time);
         gain.gain.exponentialRampToValueAtTime(0.001, time + C.ZAP_DECAY);

         // Connect nodes (Osc -> Gain -> Distortion -> Master)
         osc.connect(gain);
         gain.connect(distortion); // Connect to distortion
         osc.start(time);
         osc.stop(time + C.ZAP_DECAY + 0.02); // Stop shortly after decay
     } catch (e) { console.error("Error in triggerZap:", e); }
 }

/** Schedules a rising noise sweep FX sound. */
export function triggerSweep(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const noiseSource = audioCtx.createBufferSource();
        const noiseBuf = createWhiteNoiseBuffer(audioCtx, C.SWEEP_DURATION + 0.1); // Buffer slightly longer than sweep
        if (!noiseBuf) return;
        noiseSource.buffer = noiseBuf;

        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        // Bandpass filter sweeps upwards
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, time); // Start low
        filter.frequency.exponentialRampToValueAtTime(12000, time + C.SWEEP_DURATION); // End high
        filter.Q.setValueAtTime(3, time); // Moderate resonance

        // Volume Envelope (Fade out over duration)
        gain.gain.setValueAtTime(0.3, time); // Sweep volume
        gain.gain.linearRampToValueAtTime(0.001, time + C.SWEEP_DURATION);

        // Connect nodes (Noise -> Filter -> Gain -> Master)
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noiseSource.start(time);
        noiseSource.stop(time + C.SWEEP_DURATION + 0.1); // Stop after sweep finishes
    } catch (e) { console.error("Error in triggerSweep:", e); }
}

/** Schedules a sword swing 'whoosh' sound. */
export function triggerSwordSwing(audioCtx, distortion, time) {
     if (!audioCtx || !distortion) return;
     try {
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.1); // Short noise duration
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;

         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         // Bandpass filter sweeps down quickly for 'whoosh'
         filter.type = 'bandpass';
         filter.frequency.setValueAtTime(1500, time); // Start mid-high frequency
         filter.Q.setValueAtTime(5, time); // Moderate resonance
         filter.frequency.exponentialRampToValueAtTime(400, time + 0.08); // Sweep down

         // Volume Envelope
         gain.gain.setValueAtTime(0.3, time);
         gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

         // Connect nodes (Noise -> Filter -> Gain -> Distortion -> Master)
         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Add grit via distortion
         noiseSource.start(time);
         noiseSource.stop(time + 0.1);
     } catch (e) { console.error("Error in triggerSwordSwing:", e); }
 }

/** Schedules a sword hit impact sound (metallic crackle + thud). */
export function triggerSwordHit(audioCtx, masterGain, distortion, time) {
     if (!audioCtx || !masterGain || !distortion) return;
     try {
         // --- Noise Burst (High-frequency crackle) ---
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.08);
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;
         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         filter.type = 'highpass'; // Only high frequencies
         filter.frequency.setValueAtTime(3000, time);
         gain.gain.setValueAtTime(0.4, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Very short decay

         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Distortion for the crackle sound

         noiseSource.start(time);
         noiseSource.stop(time + 0.08);

         // --- Low Thud (Impact body) ---
         const osc = audioCtx.createOscillator();
         const gainOsc = audioCtx.createGain();
         osc.type = 'triangle'; // Softer waveform for thud
         osc.frequency.setValueAtTime(120, time); // Low frequency
         osc.frequency.exponentialRampToValueAtTime(60, time + 0.06); // Pitch drop
         gainOsc.gain.setValueAtTime(0.6, time); // Thud volume
         gainOsc.gain.exponentialRampToValueAtTime(0.01, time + 0.07); // Short decay

         osc.connect(gainOsc);
         gainOsc.connect(masterGain); // Thud goes direct to master gain (less distortion)

         osc.start(time);
         osc.stop(time + 0.07);
     } catch (e) { console.error("Error in triggerSwordHit:", e); }
 }

/** Schedules a sound for hitting a patroller enemy. */
export function triggerPatrollerHit(audioCtx, distortion, time) {
     if (!audioCtx || !distortion) return;
     try {
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.06);
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;

         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         // Filtered noise for a duller 'thwack'
         filter.type = 'bandpass';
         filter.frequency.setValueAtTime(2500, time); // Mid-range frequency
         filter.Q.value = 3; // Lower Q than sword hit

         // Volume Envelope
         gain.gain.setValueAtTime(0.3, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04); // Very short

         // Connect nodes (Noise -> Filter -> Gain -> Distortion -> Master)
         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Connect to distortion
         noiseSource.start(time);
         noiseSource.stop(time + 0.06);
     } catch (e) { console.error("Error in triggerPatrollerHit:", e); }
 }

/** Schedules a sound for destroying a patroller enemy. */
export function triggerPatrollerDestroy(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const noiseSource = audioCtx.createBufferSource();
        const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.2); // Longer noise buffer
        if (!noiseBuf) return;
        noiseSource.buffer = noiseBuf;

        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        // Lowpass filtered noise for an 'explosion' or 'crumble' sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, time); // Start low
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.15); // Sweep lower
        filter.Q.value = 1;

        // Volume Envelope
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15); // Fade out

        // Connect nodes (Noise -> Filter -> Gain -> Master)
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain); // Connect directly to master gain
        noiseSource.start(time);
        noiseSource.stop(time + 0.2);
    } catch (e) { console.error("Error in triggerPatrollerDestroy:", e); }
}

/** Schedules a jump sound effect. */
export function triggerJumpSound(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle'; // Softer waveform

        // Upward pitch sweep
        osc.frequency.setValueAtTime(440, time); // A4
        osc.frequency.exponentialRampToValueAtTime(880, time + 0.1); // Up to A5

        // Quick volume decay
        gain.gain.setValueAtTime(0.2, time); // Relatively quiet
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        // Connect nodes (Osc -> Gain -> Master)
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.12);
    } catch (e) { console.error("Error in triggerJumpSound:", e); }
}

/** Schedules a landing sound effect. */
export function triggerLandSound(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const noiseSource = audioCtx.createBufferSource();
        const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.08);
        if (!noiseBuf) return;
        noiseSource.buffer = noiseBuf;

        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        // Lowpass filtered noise for a soft 'thud'
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time); // Cut high frequencies

        // Very quick volume decay
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);

        // Connect nodes (Noise -> Filter -> Gain -> Master)
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noiseSource.start(time);
        noiseSource.stop(time + 0.08);
    } catch (e) { console.error("Error in triggerLandSound:", e); }
}

/** Schedules a fireball shooting sound. */
export function triggerFireballShoot(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; // Harsh waveform

        // Downward pitch sweep
        osc.frequency.setValueAtTime(600, time);
        osc.frequency.exponentialRampToValueAtTime(300, time + 0.1);

        // Quick decay
        gain.gain.setValueAtTime(0.2, time); // Moderate volume
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        // Connect nodes (Osc -> Gain -> Master)
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.12);
    } catch (e) { console.error("Error in triggerFireballShoot:", e); }
}

/** Schedules a fireball explosion sound. */
export function triggerFireballExplode(audioCtx, distortion, time) {
     if (!audioCtx || !distortion) return;
     try {
         const noiseSource = audioCtx.createBufferSource();
         const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.3); // Longer buffer for explosion
         if (!noiseBuf) return;
         noiseSource.buffer = noiseBuf;

         const filter = audioCtx.createBiquadFilter();
         const gain = audioCtx.createGain();

         // Lowpass filter with resonance for 'boom'
         filter.type = 'lowpass';
         filter.frequency.setValueAtTime(800, time); // Start mid-low
         filter.frequency.exponentialRampToValueAtTime(100, time + 0.2); // Sweep down
         filter.Q.value = 5; // Some resonance

         // Volume Envelope
         gain.gain.setValueAtTime(0.6, time); // Loud explosion
         gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25); // Fade out

         // Connect nodes (Noise -> Filter -> Gain -> Distortion -> Master)
         noiseSource.connect(filter);
         filter.connect(gain);
         gain.connect(distortion); // Connect to distortion for boom/grit
         noiseSource.start(time);
         noiseSource.stop(time + 0.3);
     } catch (e) { console.error("Error in triggerFireballExplode:", e); }
 }

/** Schedules a lightning bolt casting sound (crackle + buzz). */
 export function triggerLightningBoltSound(audioCtx, masterGain, time) {
    if (!audioCtx || !masterGain) return;
    try {
        // --- Sharp crackle using filtered noise ---
        const noiseSource = audioCtx.createBufferSource();
        const noiseBuf = createWhiteNoiseBuffer(audioCtx, 0.1);
        if (!noiseBuf) return;
        noiseSource.buffer = noiseBuf;
        const filter = audioCtx.createBiquadFilter();
        const gainNoise = audioCtx.createGain();

        filter.type = 'bandpass'; // Isolate frequencies for crackle
        filter.frequency.setValueAtTime(4000, time); // High frequency start
        filter.frequency.exponentialRampToValueAtTime(800, time + 0.05); // Quick drop
        filter.Q.setValueAtTime(15, time); // Sharp resonance

        gainNoise.gain.setValueAtTime(0.7, time); // Crackle volume
        gainNoise.gain.exponentialRampToValueAtTime(0.01, time + 0.08); // Fast decay

        noiseSource.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(masterGain); // Connect crackle directly to master

        noiseSource.start(time);
        noiseSource.stop(time + 0.1);

        // --- Lower frequency buzz/hum ---
        const osc = audioCtx.createOscillator();
        const gainOsc = audioCtx.createGain();
        osc.type = 'sawtooth'; // Raw buzz sound
        osc.frequency.setValueAtTime(150, time); // Lower base frequency
        // Optional: Add slight pitch waver/vibrato?
        // const vibrato = audioCtx.createOscillator();
        // const vibratoGain = audioCtx.createGain();
        // vibrato.frequency.setValueAtTime(8, time); // Vibrato speed
        // vibratoGain.gain.setValueAtTime(10, time); // Vibrato amount (Hz)
        // vibrato.connect(vibratoGain);
        // vibratoGain.connect(osc.frequency);
        // vibrato.start(time);
        // vibrato.stop(time + 0.25);

        osc.frequency.exponentialRampToValueAtTime(80, time + 0.2); // Slow frequency decay

        gainOsc.gain.setValueAtTime(0.4, time); // Buzz volume
        gainOsc.gain.exponentialRampToValueAtTime(0.001, time + 0.2); // Buzz decay

        osc.connect(gainOsc);
        gainOsc.connect(masterGain); // Connect buzz directly to master

        osc.start(time);
        osc.stop(time + 0.25);

    } catch (e) { console.error("Error in triggerLightningBoltSound:", e); }
}