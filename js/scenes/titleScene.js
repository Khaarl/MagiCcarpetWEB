import { Scene } from '../core/scene.js';
import * as C from '../config.js';

export class TitleScene extends Scene {
    constructor() {
        super();
        this.time = 0;
        this.startDelay = 3000; // 3 seconds delay before auto-starting
        this.startTimer = 0;
        this.gameStarted = false;
        this.castleX = C.CANVAS_WIDTH * 0.65;
        this.castleY = C.CANVAS_HEIGHT * 0.25;
        this.castleHoverAmplitude = 15;
        this.castleHoverSpeed = 0.5;
        this.cloudPositions = [];
        for (let i = 0; i < 8; i++) {
            this.cloudPositions.push({
                x: Math.random() * C.CANVAS_WIDTH,
                y: Math.random() * C.CANVAS_HEIGHT * 0.4,
                size: 30 + Math.random() * 60,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }

    onEnter() {
        this.startTimer = 0;
        this.gameStarted = false;
    }

    onExit() {
        // No need for click event cleanup as we removed the buttons
    }

    startGame() {
        if (this.game && !this.gameStarted) {
            this.gameStarted = true;
            this.game.setScene('gameplay');
            if (this.game.currentScene && typeof this.game.currentScene.init === 'function') {
                this.game.currentScene.init({ isTestMode: false }); // Start in normal mode
            }
        }
    }

    update(deltaTime) {
        this.time += deltaTime;
        
        // Auto-start the game after delay
        this.startTimer += deltaTime * 1000;
        if (this.startTimer >= this.startDelay && !this.gameStarted) {
            this.startGame();
        }
        
        for (const cloud of this.cloudPositions) {
            cloud.x += cloud.speed * deltaTime * 30;
            if (cloud.x > C.CANVAS_WIDTH + cloud.size) {
                cloud.x = -cloud.size;
                cloud.y = Math.random() * C.CANVAS_HEIGHT * 0.4;
            }
        }
    }

    render(ctx) {
        this.drawDesertBackground(ctx);
        this.drawClouds(ctx);
        this.drawFlyingCastle(ctx);
        this.drawTitle(ctx);
        this.drawStartingMessage(ctx);
        this.drawInstructions(ctx);
    }

    drawDesertBackground(ctx) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, C.CANVAS_HEIGHT);
        skyGradient.addColorStop(0, '#1a75ff');
        skyGradient.addColorStop(0.5, '#66a3ff');
        skyGradient.addColorStop(0.7, '#ffcc99');
        skyGradient.addColorStop(1, '#ff9933');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

        const sunX = C.CANVAS_WIDTH * 0.8;
        const sunY = C.CANVAS_HEIGHT * 0.15;
        const sunRadius = 50;
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

        this.drawDunes(ctx);
    }

    drawDunes(ctx) {
        const duneColors = [
            { color: '#ffcc66', y: C.CANVAS_HEIGHT * 0.7 },
            { color: '#e6ac4d', y: C.CANVAS_HEIGHT * 0.8 },
            { color: '#cc9633', y: C.CANVAS_HEIGHT * 0.9 }
        ];

        for (const dune of duneColors) {
            const baseY = dune.y;
            ctx.fillStyle = dune.color;
            ctx.beginPath();
            ctx.moveTo(0, C.CANVAS_HEIGHT);
            for (let x = 0; x <= C.CANVAS_WIDTH; x += 20) {
                const heightVariation =
                    Math.sin(x * 0.01 + this.time * 0.1) * 20 +
                    Math.sin(x * 0.02 - this.time * 0.05) * 15 +
                    Math.sin(x * 0.005 + this.time * 0.02) * 25;
                ctx.lineTo(x, baseY + heightVariation);
            }
            ctx.lineTo(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            ctx.lineTo(0, C.CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawClouds(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const cloud of this.cloudPositions) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.5, cloud.y - cloud.size * 0.1, cloud.size * 0.6, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.7, cloud.y + cloud.size * 0.1, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawFlyingCastle(ctx) {
        const hoverY = this.castleY + Math.sin(this.time * this.castleHoverSpeed) * this.castleHoverAmplitude;
        ctx.save();
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(this.castleX, hoverY + 80, 120, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#567d46';
        ctx.beginPath();
        ctx.ellipse(this.castleX, hoverY + 75, 110, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d9b38c';
        ctx.fillRect(this.castleX - 60, hoverY - 50, 120, 130);
        ctx.fillStyle = '#ba9476';
        ctx.fillRect(this.castleX - 80, hoverY - 20, 30, 100);
        ctx.fillRect(this.castleX + 50, hoverY - 20, 30, 100);
        ctx.fillRect(this.castleX - 20, hoverY - 100, 40, 180);
        ctx.fillStyle = '#e74c3c';
        this.drawTowerRoof(ctx, this.castleX - 65, hoverY - 20, 30);
        this.drawTowerRoof(ctx, this.castleX + 65, hoverY - 20, 30);
        this.drawTowerRoof(ctx, this.castleX, hoverY - 100, 40);
        ctx.fillStyle = '#f9e076';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillRect(this.castleX - 45 + i * 35, hoverY - 30 + j * 50, 15, 20);
            }
        }
        ctx.fillRect(this.castleX - 72, hoverY, 15, 15);
        ctx.fillRect(this.castleX + 58, hoverY, 15, 15);
        ctx.fillRect(this.castleX - 8, hoverY - 70, 15, 15);
        this.drawFlag(ctx, this.castleX - 65, hoverY - 50, '#f39c12');
        this.drawFlag(ctx, this.castleX + 65, hoverY - 50, '#9b59b6');
        this.drawFlag(ctx, this.castleX, hoverY - 130, '#3498db');
        ctx.restore();
    }

    drawTowerRoof(ctx, x, y, width) {
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y);
        ctx.lineTo(x, y - width);
        ctx.lineTo(x + width / 2, y);
        ctx.closePath();
        ctx.fill();
    }

    drawFlag(ctx, x, y, color) {
        const flagHeight = 30;
        const flagWidth = 20;
        const waveAmplitude = 3;
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - flagHeight - 10);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - flagHeight - 10);
        for (let i = 0; i <= flagWidth; i += 2) {
            const waveY = Math.sin((this.time * 5) + i * 0.5) * waveAmplitude;
            ctx.lineTo(x + i, y - flagHeight - 10 + waveY);
        }
        for (let i = flagWidth; i >= 0; i -= 2) {
            const waveY = Math.sin((this.time * 5) + i * 0.5) * waveAmplitude;
            ctx.lineTo(x + i, y - flagHeight / 2 - 10 + waveY);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawTitle(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.font = 'bold 72px fantasy';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f3c622';
        ctx.fillText('Magic Carpet', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT * 0.25);
        ctx.font = 'italic 36px fantasy';
        ctx.fillStyle = '#f5e7a0';
        ctx.fillText('Desert Adventure', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT * 0.33);
        ctx.restore();
    }

    drawStartingMessage(ctx) {
        if (this.startTimer < this.startDelay) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;
            ctx.fillText(`Starting game in ${Math.ceil((this.startDelay - this.startTimer) / 1000)}...`, 
                C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT * 0.6);
            ctx.restore();
        }
    }

    drawInstructions(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const instructions = [
            "Controls: Arrow Keys/WASD to move, Space to fly",
            "X: Attack | 1: Fireball | 2: Lightning | R: Reset/Next Level"
        ];
        instructions.forEach((text, i) => {
            ctx.fillText(text, C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT - 50 + i * 25);
        });
        ctx.restore();
    }
}
