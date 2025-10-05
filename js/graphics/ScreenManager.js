export class ScreenManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isMobile = false;
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    setMobile(isMobile) {
        this.isMobile = isMobile;
    }
    
    renderLoadingScreen(gameState) {
        // Retro háttér
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(0.5, '#000066');
        gradient.addColorStop(1, '#000099');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Keret
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);
        
        // Cím
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = this.isMobile ? 'bold 48px monospace' : 'bold 72px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('RACING', this.canvas.width / 2, this.isMobile ? 150 : 200);
        this.ctx.fillText('RACING', this.canvas.width / 2, this.isMobile ? 150 : 200);
        
        this.ctx.fillStyle = '#FF4444';
        this.ctx.strokeText('LOTUS', this.canvas.width / 2, this.isMobile ? 220 : 300);
        this.ctx.fillText('LOTUS', this.canvas.width / 2, this.isMobile ? 220 : 300);
        
        // Loading szöveg
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? '18px monospace' : '24px monospace';
        this.ctx.fillText(gameState.loadingText || 'Loading...', this.canvas.width / 2, this.isMobile ? 300 : 400);
        
        // Progress bar
        const barWidth = this.isMobile ? 300 : 400;
        const barHeight = 30;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.isMobile ? 330 : 450;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
        
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        const progressWidth = (gameState.loadingProgress / 100) * barWidth;
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, barY, progressWidth, barHeight);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px monospace';
        this.ctx.fillText(`${Math.round(gameState.loadingProgress)}%`, this.canvas.width / 2, barY + 20);
        
        this.ctx.textAlign = 'left';
    }
    
    renderIntroScreen() {
        // Retro háttér
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#003344');
        gradient.addColorStop(1, '#005566');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animált háttér vonalak
        const time = Date.now() / 1000;
        for (let i = 0; i < 10; i++) {
            const y = (i * 60 + time * 50) % this.canvas.height;
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i * 0.03})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Fő keret
        const boxWidth = this.isMobile ? this.canvas.width - 40 : 700;
        const boxHeight = this.isMobile ? this.canvas.height - 40 : 500;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Cím
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = this.isMobile ? 'bold 32px monospace' : 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('RACSING GT', this.canvas.width / 2, boxY + (this.isMobile ? 60 : 80));
        this.ctx.fillText('RACSING GT', this.canvas.width / 2, boxY + (this.isMobile ? 60 : 80));
        
        // Irányítás
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 18px monospace' : 'bold 24px monospace';
        this.ctx.fillText('CONTROLS:', this.canvas.width / 2, boxY + (this.isMobile ? 100 : 140));
        
        this.ctx.font = this.isMobile ? '14px monospace' : '20px monospace';
        this.ctx.textAlign = 'left';
        
        const controlsX = boxX + (this.isMobile ? 40 : 80);
        let controlsY = boxY + (this.isMobile ? 130 : 180);
        
        const controls = this.isMobile ? [
            '📱 Használd az alsó gombokat',
            '⬆️ GÁZ gomb - Gyorsítás',
            '⬇️ FÉK gomb - Fékezés',
            '⬅️➡️ Kormányzás',
            '🚀 NITRO gomb - Turbó',
            '🔊 Hang be/ki (bal felső)'
        ] : [
            '↑ / W     - ACCELERATE',
            '↓ / S     - BRAKE',
            '← / A     - STEER LEFT', 
            '→ / D     - STEER RIGHT',
            'SPACE     - NITRO BOOST',
            'M         - MUTE/UNMUTE',
            'R         - RESTART (after finish)'
        ];
        
        const lineHeight = this.isMobile ? 25 : 35;
        
        controls.forEach(control => {
            this.ctx.fillStyle = 'rgba(0, 100, 100, 0.3)';
            this.ctx.fillRect(controlsX - 10, controlsY - 20, boxWidth - (this.isMobile ? 60 : 160), 25);
            
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillText(control, controlsX, controlsY);
            controlsY += lineHeight;
        });
        
        // Start gomb
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = this.isMobile ? 'bold 20px monospace' : 'bold 32px monospace';
        
        if (Math.floor(Date.now() / 500) % 2) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            const startText = this.isMobile ? 'ÉRINTSD MEG A KÉPERNYŐT' : 'PRESS ENTER OR SPACE TO START';
            this.ctx.strokeText(startText, this.canvas.width / 2, boxY + boxHeight - 40);
            this.ctx.fillText(startText, this.canvas.width / 2, boxY + boxHeight - 40);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    // ⭐ JAVÍTOTT FINISH KÉPERNYŐ - MOBIL RESTART
    renderFinishLayer(gameEngine) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const boxWidth = this.isMobile ? this.canvas.width - 40 : 600;
        const boxHeight = this.isMobile ? this.canvas.height - 100 : 400;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;
        
        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = this.isMobile ? 'bold 24px Arial' : 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('🏁 RACE COMPLETE! 🏁', this.canvas.width / 2, boxY + (this.isMobile ? 50 : 80));
        this.ctx.fillText('🏁 RACE COMPLETE! 🏁', this.canvas.width / 2, boxY + (this.isMobile ? 50 : 80));
        
        const finishTimeSeconds = (gameEngine.game.finishTime / 1000).toFixed(2);
        const avgSpeed = Math.floor((gameEngine.game.trackLength / 1000) / (gameEngine.game.finishTime / 1000 / 3600));
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 16px Arial' : 'bold 24px Arial';
        
        this.ctx.strokeText(`Time: ${finishTimeSeconds}s`, this.canvas.width / 2, boxY + (this.isMobile ? 90 : 140));
        this.ctx.fillText(`Time: ${finishTimeSeconds}s`, this.canvas.width / 2, boxY + (this.isMobile ? 90 : 140));
        
        this.ctx.strokeText(`Avg Speed: ${avgSpeed} KM/H`, this.canvas.width / 2, boxY + (this.isMobile ? 120 : 180));
        this.ctx.fillText(`Avg Speed: ${avgSpeed} KM/H`, this.canvas.width / 2, boxY + (this.isMobile ? 120 : 180));
        
        // ⭐ MOBIL ÉS DESKTOP RESTART INSTRUKCIÓ
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.font = this.isMobile ? '14px Arial' : '18px Arial';
        
        const restartText = this.isMobile ? 'Tap any mobile button to restart' : 'Press R to restart';
        this.ctx.strokeText(restartText, this.canvas.width / 2, boxY + boxHeight - 40);
        this.ctx.fillText(restartText, this.canvas.width / 2, boxY + boxHeight - 40);
        
        this.ctx.textAlign = 'left';
    }
}
