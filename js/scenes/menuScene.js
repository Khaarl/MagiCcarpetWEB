import { Scene } from '../core/scene.js';
import * as C from '../config.js';

export class MenuScene extends Scene {
    constructor() {
        super();
        this.title = "Magic Carpet Adventure";
        this.menuItems = [
            { text: "Start Game", action: "startGame" },
            { text: "How to Play", action: "showHowToPlay" },
            { text: "Physics Test", action: "startPhysicsTest" },
            { text: "Combat Test", action: "startCombatTest" },
            { text: "Credits", action: "showCredits" }
        ];
        this.selectedIndex = 0;
         this.keysPressed = {};
        this.animationTime = 0;
        this.particles = [];
        this.carpets = [];
        
        // Background stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * C.CANVAS_WIDTH,
                y: Math.random() * C.CANVAS_HEIGHT,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
        
        // Create floating carpets
        for (let i = 0; i < 5; i++) {
            this.carpets.push({
                x: Math.random() * C.CANVAS_WIDTH,
                y: 100 + Math.random() * (C.CANVAS_HEIGHT - 200),
                width: 80 + Math.random() * 60,
                height: 8 + Math.random() * 5,
                speedX: (Math.random() - 0.5) * 1.5,
                phase: Math.random() * Math.PI * 2,
                color1: this.randomCarpetColor(),
                color2: this.randomCarpetColor()
            });
        }
    }
    
    randomCarpetColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 80%, 60%)`;
    }

    onEnter() {
        this.handleKeyDown = (e) => {
            this.keysPressed[e.key.toLowerCase()] = true;
            
            if (e.key === 'ArrowUp' || e.key === 'w') {
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                this.emitSelectionParticles();
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                this.emitSelectionParticles();
            } else if (e.key === 'Enter' || e.key === ' ') {
                this.handleMenuAction(this.menuItems[this.selectedIndex].action);
            }
        };
        
        this.handleKeyUp = (e) => {
            this.keysPressed[e.key.toLowerCase()] = false;
        };
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        if (this.game && this.game.isAudioInitialized && this.game.audioManager?.musicPlayingScene !== 'menu') {
            this.game.startMenuMusic();
        }
    }
    
    emitSelectionParticles() {
        const centerY = C.CANVAS_HEIGHT/2 + 50 + this.selectedIndex * 50;
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: C.CANVAS_WIDTH/2 - 100,
                y: centerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 6 + 2,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
            });
        }
    }

    handleMenuAction(action) {
        switch(action) {
            case 'startGame':
                this.game.setScene('gameplay', { isTestMode: false });
                break;
            case 'showHowToPlay':
                this.game.setScene('howToPlay');
                break;
            case 'showCredits':
                this.game.setScene('credits');
                break;
            case 'startPhysicsTest':
                this.game.setScene('gameplay', { isTestMode: true, testMode: 'physics' });
                break;
            case 'startCombatTest':
                this.game.setScene('gameplay', { isTestMode: true, testMode: 'combat' });
                break;
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed * deltaTime * 30;
            if (star.y > C.CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * C.CANVAS_WIDTH;
            }
        });
        
        // Update floating carpets
        this.carpets.forEach(carpet => {
            carpet.x += carpet.speedX * deltaTime * 30;
            
            // Bounce off edges
            if (carpet.x < -carpet.width || carpet.x > C.CANVAS_WIDTH) {
                carpet.speedX *= -1;
            }
        });
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime * 60;
            p.y += p.vy * deltaTime * 60;
            p.life -= deltaTime * 1.5;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        this.drawDesertNightBackground(ctx);
        this.drawStars(ctx);
        this.drawFloatingCarpets(ctx);
        this.drawTitle(ctx);
        this.drawMenuItems(ctx);
        this.drawParticles(ctx);
    }
    
    drawDesertNightBackground(ctx) {
        const nightGradient = ctx.createLinearGradient(0, 0, 0, C.CANVAS_HEIGHT);
        nightGradient.addColorStop(0, '#0a1332');
        nightGradient.addColorStop(0.3, '#1a2a5e');
        nightGradient.addColorStop(0.7, '#4b2d73');
        nightGradient.addColorStop(1, '#724b83');
        ctx.fillStyle = nightGradient;
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

        this.drawMountains(ctx);
        this.drawMoon(ctx);
        this.drawDunes(ctx);
        this.drawAtmosphere(ctx);
    }

    drawMoon(ctx) {
        const moonX = C.CANVAS_WIDTH * 0.8;
        const moonY = C.CANVAS_HEIGHT * 0.2;
        const moonRadius = C.CANVAS_WIDTH * 0.06;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 200, 0.6)';
        ctx.shadowBlur = moonRadius * 1.5;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = 'rgba(200, 200, 180, 0.2)';
        for (let i = 0; i < 5; i++) {
            const craterX = moonX - moonRadius / 2 + Math.random() * moonRadius;
            const craterY = moonY - moonRadius / 2 + Math.random() * moonRadius;
            const craterSize = Math.random() * (moonRadius / 5) + (moonRadius / 10);
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMountains(ctx) {
        const horizon = C.CANVAS_HEIGHT * 0.7;
        ctx.fillStyle = '#141829';
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        for (let x = 0; x < C.CANVAS_WIDTH; x += 50) {
            const heightVariation = Math.sin(x / 200) * 50 + Math.random() * 20;
            ctx.lineTo(x, horizon - C.CANVAS_HEIGHT * 0.2 - heightVariation);
        }
        ctx.lineTo(C.CANVAS_WIDTH, horizon);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1d1e2c';
        ctx.beginPath();
        ctx.moveTo(0, horizon + 20);
        for (let x = 0; x < C.CANVAS_WIDTH; x += 30) {
            const heightVariation = Math.cos(x / 100) * 40 + Math.random() * 15;
            ctx.lineTo(x, horizon - C.CANVAS_HEIGHT * 0.15 - heightVariation + 70);
        }
        ctx.lineTo(C.CANVAS_WIDTH, horizon + 20);
        ctx.closePath();
        ctx.fill();
    }

    drawDunes(ctx) {
        const duneBaseY = C.CANVAS_HEIGHT * 0.8;
        const duneGradient = ctx.createLinearGradient(0, duneBaseY, 0, C.CANVAS_HEIGHT);
        duneGradient.addColorStop(0, '#3d2b4b');
        duneGradient.addColorStop(1, '#5e3a5a');
        ctx.fillStyle = duneGradient;
        ctx.beginPath();
        ctx.moveTo(0, duneBaseY);
        const time = this.animationTime * 0.1;
        for (let x = 0; x < C.CANVAS_WIDTH; x += 20) {
            const y = duneBaseY + Math.sin(x / 200 + time) * 15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(C.CANVAS_WIDTH, duneBaseY);
        ctx.lineTo(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        ctx.lineTo(0, C.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
    }

    drawAtmosphere(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.03;
        const heatWaveY = C.CANVAS_HEIGHT * 0.75;
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, heatWaveY + i * 20);
            for (let x = 0; x < C.CANVAS_WIDTH; x += 10) {
                const y = heatWaveY + i * 20 + Math.sin(x / 50 + this.animationTime * 2) * 5;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(C.CANVAS_WIDTH, heatWaveY + i * 20);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    drawStars(ctx) {
        this.stars.forEach(star => {
            const pulseSize = star.size * (0.8 + Math.sin(this.animationTime * 3 + star.x) * 0.2);
            const pulseOpacity = star.opacity * (0.8 + Math.sin(this.animationTime * 2 + star.y) * 0.2);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Occasional star twinkle
            if (Math.random() < 0.01) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const twinkleSize = pulseSize * 2.5;
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 4) * i;
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(
                        star.x + Math.cos(angle) * twinkleSize,
                        star.y + Math.sin(angle) * twinkleSize
                    );
                }
                ctx.stroke();
            }
        });
    }
    
    drawFloatingCarpets(ctx) {
        this.carpets.forEach(carpet => {
            const time = this.animationTime;
            const carpetY = carpet.y + Math.sin(time * 2 + carpet.phase) * 15;
            
            ctx.save();
            
            // Carpet shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(
                carpet.x + carpet.width/2,
                carpetY + carpet.height * 3,
                carpet.width * 0.4,
                carpet.height,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Carpet body
            const carpetGradient = ctx.createLinearGradient(
                carpet.x, carpetY,
                carpet.x, carpetY + carpet.height
            );
            carpetGradient.addColorStop(0, carpet.color1);
            carpetGradient.addColorStop(1, carpet.color2);
            
            ctx.fillStyle = carpetGradient;
            ctx.beginPath();
            
            // Draw wavy carpet
            const segments = 10;
            ctx.moveTo(carpet.x, carpetY);
            
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const px = carpet.x + carpet.width * t;
                const py = carpetY + Math.sin(time * 3 + t * Math.PI * 2) * carpet.height * 0.2;
                ctx.lineTo(px, py);
            }
            
            ctx.lineTo(carpet.x + carpet.width, carpetY + carpet.height);
            ctx.lineTo(carpet.x, carpetY + carpet.height);
            ctx.closePath();
            ctx.fill();
            
            // Carpet pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // Horizontal lines
            for (let i = 1; i < 3; i++) {
                const lineY = carpetY + (carpet.height * i / 3);
                ctx.moveTo(carpet.x, lineY);
                
                for (let j = 0; j <= segments; j++) {
                    const t = j / segments;
                    const px = carpet.x + carpet.width * t;
                    const py = lineY + Math.sin(time * 2.5 + t * Math.PI * 2 + i) * carpet.height * 0.1;
                    if (j === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
            }
            
            // Vertical lines
            for (let i = 1; i < 5; i++) {
                const x = carpet.x + (carpet.width * i / 5);
                ctx.moveTo(x, carpetY);
                ctx.lineTo(x, carpetY + carpet.height);
            }
            
            ctx.stroke();
            
            // Add some sparkles
            if (Math.random() < 0.1) {
                const sparkX = carpet.x + Math.random() * carpet.width;
                const sparkY = carpetY + Math.random() * carpet.height;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    drawTitle(ctx) {
        const titleY = C.CANVAS_HEIGHT * 0.25;
        const time = this.animationTime;
        
        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 56px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, C.CANVAS_WIDTH/2 + 4, titleY + 4);
        
        // Title gradient
        const titleGradient = ctx.createLinearGradient(
            0, titleY - 40,
            0, titleY + 10
        );
        titleGradient.addColorStop(0, '#FFC107');
        titleGradient.addColorStop(0.5, '#FFD54F');
        titleGradient.addColorStop(1, '#FF9800');
        
        ctx.fillStyle = titleGradient;
        ctx.fillText(this.title, C.CANVAS_WIDTH/2, titleY);
        
        // Title glow
        const glowIntensity = 0.4 + Math.sin(time * 3) * 0.2;
        ctx.shadowColor = `rgba(255, 150, 0, ${glowIntensity})`;
        ctx.shadowBlur = 15;
        ctx.fillText(this.title, C.CANVAS_WIDTH/2, titleY);
        ctx.shadowBlur = 0;
        
        // Title stroke
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#5D4037';
        ctx.strokeText(this.title, C.CANVAS_WIDTH/2, titleY);
    }
    
    drawMenuItems(ctx) {
        const startY = C.CANVAS_HEIGHT/2 + 50;
        const spacing = 50;
        const time = this.animationTime;
        
        ctx.font = '24px "Arial", sans-serif';
        ctx.textAlign = 'center';
        
        this.menuItems.forEach((item, index) => {
            const itemY = startY + index * spacing;
            const selected = index === this.selectedIndex;
            
            // Hover animation for selected item
            let offsetX = 0;
            let scale = 1.0;
            
            if (selected) {
                offsetX = Math.sin(time * 5) * 10;
                scale = 1.0 + Math.sin(time * 4) * 0.05;
                
                // Draw selection indicator (magic carpet under text)
                const carpetWidth = ctx.measureText(item.text).width + 60;
                const carpetHeight = 8;
                const carpetY = itemY + 15;
                
                // Carpet body
                const carpetGradient = ctx.createLinearGradient(
                    C.CANVAS_WIDTH/2 - carpetWidth/2, carpetY,
                    C.CANVAS_WIDTH/2 + carpetWidth/2, carpetY
                );
                carpetGradient.addColorStop(0, '#9C27B0');
                carpetGradient.addColorStop(0.5, '#7B1FA2');
                carpetGradient.addColorStop(1, '#6A1B9A');
                
                ctx.fillStyle = carpetGradient;
                ctx.beginPath();
                
                // Draw wavy carpet
                const segments = 20;
                const startX = C.CANVAS_WIDTH/2 - carpetWidth/2;
                
                ctx.moveTo(startX, carpetY);
                
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const px = startX + carpetWidth * t;
                    const py = carpetY + Math.sin(time * 6 + t * Math.PI * 4) * carpetHeight * 0.3;
                    ctx.lineTo(px, py);
                }
                
                ctx.lineTo(startX + carpetWidth, carpetY + carpetHeight);
                ctx.lineTo(startX, carpetY + carpetHeight);
                ctx.closePath();
                ctx.fill();
                
                // Carpet glow
                ctx.shadowColor = 'rgba(156, 39, 176, 0.7)';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Carpet sparkles
                for (let i = 0; i < 3; i++) {
                    const sparkX = startX + Math.random() * carpetWidth;
                    const sparkY = carpetY + Math.random() * carpetHeight;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(item.text, C.CANVAS_WIDTH/2 + offsetX + 2, itemY + 2);
            
            // Text fill
            ctx.fillStyle = selected ? '#FFEB3B' : '#E0E0E0';
            ctx.save();
            ctx.translate(C.CANVAS_WIDTH/2 + offsetX, itemY);
            ctx.scale(scale, scale);
            ctx.fillText(item.text, 0, 0);
            
            // Text glow for selected item
            if (selected) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
                ctx.shadowBlur = 8;
                ctx.fillText(item.text, 0, 0);
                ctx.shadowBlur = 0;
            }
            
            ctx.restore();
        });
    }
    
    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
    
    onExit() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        if (this.game?.audioManager) {
            this.game.audioManager.stopCurrentTrack();
        }
    }
}
