export class AudioManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.tracks = {
            title: null,    // Middle Eastern theme for menu/title
            gameplay: null, // Adventure music for actual gameplay
        };
        this.currentTrack = null;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.isMuted = false;
    }

    async loadTrack(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.tracks[key] = audioBuffer;
            console.log(`Loaded track: ${key}`);
            return true;
        } catch (error) {
            console.error(`Failed to load audio track ${key}:`, error);
            return false;
        }
    }

    playTrack(key, loop = true) {
        if (this.isMuted || !this.tracks[key]) return false;
        this.stopCurrentTrack();
        const source = this.audioContext.createBufferSource();
        source.buffer = this.tracks[key];
        source.loop = loop;
        source.connect(this.gainNode);
        this.currentTrack = { key, source };
        source.start(0);
        console.log(`Now playing: ${key}`);
        return true;
    }

    stopCurrentTrack() {
        if (this.currentTrack?.source) {
            try {
                this.currentTrack.source.stop();
            } catch (e) {}
            this.currentTrack = null;
        }
    }

    crossfadeToTrack(key, fadeTime = 1.5) {
        if (!this.tracks[key] || this.currentTrack?.key === key) return false;
        const newSource = this.audioContext.createBufferSource();
        newSource.buffer = this.tracks[key];
        newSource.loop = true;
        const newGain = this.audioContext.createGain();
        newGain.gain.value = 0;
        newSource.connect(newGain);
        newGain.connect(this.audioContext.destination);
        newSource.start(0);
        newGain.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + fadeTime);
        if (this.currentTrack?.source) {
            const oldGain = this.gainNode;
            oldGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
            setTimeout(() => this.stopCurrentTrack(), fadeTime * 1000);
        }
        this.currentTrack = { key, source: newSource };
        this.gainNode = newGain;
        return true;
    }

    setVolume(level) {
        if (this.gainNode) this.gainNode.gain.value = level;
    }

    mute() {
        this.isMuted = true;
        this.setVolume(0);
    }

    unmute() {
        this.isMuted = false;
        this.setVolume(0.7);
    }
}
