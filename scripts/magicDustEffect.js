export class MagicDustEffect {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.configureParticleSystem();
    }

    configureParticleSystem() {
        const ps = this.particleSystem;

        // Basic Particle Configuration
        ps.duration = 0.2;
        ps.looping = false;
        ps.playOnAwake = false;
        ps.startLifetime = { min: 0.5, max: 1.5 };
        ps.emissionRate = 75;

        // Visual Appearance
        ps.material = "Sprites-Default";
        ps.startColor = { gradient: ["#F4A460", "#E6CCB2", "#87CEEB"] };

        // Motion and Behavior
        ps.simulationSpace = "World";
        ps.sizeOverLifetime = { curve: [0.2, 1.0, 0.0] };
        ps.velocityRandomness = { x: 0.5, y: 0.5 };
    }

    emitDust(position) {
        this.particleSystem.position = position;
        this.particleSystem.emit();
    }
}
