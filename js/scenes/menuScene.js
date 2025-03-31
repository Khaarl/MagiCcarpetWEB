import { Scene } from '../core/scene.js';
import * as C from '../config.js';

export class MenuScene extends Scene {
    constructor() {
        super();
        this.title = "Magic Carpet Adventure";
        this.menuItems = [
            { text: "Start Game", action: "startGame" },
            { text: "How to Play", action: "showHowToPlay" },
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
        // Sky gradient from deep blue to purple
        const skyGradient = ctx.createLinearGradient(0, 0, 0, C.CANVAS_HEIGHT);
        skyGradient.addColorStop(0, '#0B1026'); // Deep blue
        skyGradient.addColorStop(0.5, '#1A1340'); // Deep purple
        skyGradient.addColorStop(1, '#3D1E47'); // Lighter purple
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        
        // Draw distant mountains
        ctx.fillStyle = '#2D1133';
        ctx.beginPath();
        ctx.moveTo(0, C.CANVAS_HEIGHT);
        
        // First mountain range (darker, further back)
        let x = 0;
        while (x < C.CANVAS_WIDTH) {
            const peakHeight = 150 + Math.sin(x * 0.01 + this.animationTime * 0.1) * 30;
            ctx.lineTo(x, C.CANVAS_HEIGHT - peakHeight);
            x += 50 + Math.random() * 30;
        }
        
        ctx.lineTo(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        
        // Second mountain range (lighter, closer)
        ctx.fillStyle = '#3F1940';
        ctx.beginPath();
        ctx.moveTo(0, C.CANVAS_HEIGHT);
        
        x = 0;
        while (x < C.CANVAS_WIDTH) {
            const peakHeight = 100 + Math.sin(x * 0.02 + this.animationTime * 0.2) * 40;
            ctx.lineTo(x, C.CANVAS_HEIGHT - peakHeight);
            x += 80 + Math.random() * 40;
        }
        
        ctx.lineTo(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        
        // Draw a moon with glow
        const moonX = C.CANVAS_WIDTH * 0.8;
        const moonY = C.CANVAS_HEIGHT * 0.2;
        const moonRadius = 40;
        
        // Moon glow
        const glow = ctx.createRadialGradient(
            moonX, moonY, moonRadius * 0.8,
            moonX, moonY, moonRadius * 3
        );
        glow.addColorStop(0, 'rgba(255, 255, 180, 0.4)');
        glow.addColorStop(1, 'rgba(255, 255, 180, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon body
        ctx.fillStyle = '#FFF9C4';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon craters
        ctx.fillStyle = 'rgba(200, 200, 150, 0.4)';
        ctx.beginPath();
        ctx.arc(moonX - 15, moonY - 10, 8, 0, Math.PI * 2);
        ctx.arc(moonX + 10, moonY + 15, 6, 0, Math.PI * 2);
        ctx.arc(moonX + 5, moonY - 15, 5, 0, Math.PI * 2);
        ctx.fill();
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
    }
}
