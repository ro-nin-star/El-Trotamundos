import { Dashboard } from './Dashboard.js';

export class HUD {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.dashboard = new Dashboard();
        this.isMobile = false;
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dashboard.setCanvas(canvas, ctx);
    }
    
    setMobile(isMobile) {
        this.isMobile = isMobile;
    }
    
    render(gameEngine) {
        const game = gameEngine.game;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        
        const speedKmh = Math.floor((game.speed / game.maxSpeed) * 300);
        
        // Sebesség
        this.ctx.strokeText(`${speedKmh} KM/H`, 20, 40);
        this.ctx.fillText(`${speedKmh} KM/H`, 20, 40);
        
        // Sebesség bar
        const barWidth = 200;
        const barHeight = 20;
        const barX = 20;
        const barY = 50;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        const speedPercent = game.speed / game.maxSpeed;
        this.ctx.fillStyle = speedPercent > 0.8 ? '#FF4444' : 
                           speedPercent > 0.6 ? '#FFAA00' : '#44FF44';
        this.ctx.fillRect(barX, barY, barWidth * speedPercent, barHeight);
        
        // Nitro
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.strokeText('NITRO', 20, 90);
        this.ctx.fillText('NITRO', 20, 90);
        
        const nitroBarY = 95;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX - 2, nitroBarY - 2, barWidth + 4, barHeight + 4);
        
        const nitroPercent = game.nitroAmount / 100;
        this.ctx.fillStyle = nitroPercent > 0.5 ? '#00FFFF' : 
                            nitroPercent > 0.2 ? '#FFFF00' : '#FF4444';
        this.ctx.fillRect(barX, nitroBarY, barWidth * nitroPercent, barHeight);
        
        // Távolság a célig
        const distanceToFinish = Math.max(0, (game.trackLength - game.position) / 1000);
        this.ctx.fillStyle = 'white';
        this.ctx.strokeText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, 20, 130);
        this.ctx.fillText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, 20, 130);
        
        // ⭐ NITRO JELZÉS (JAVÍTOTT)
        if (game.nitroMode) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(`🚀 NITRO BOOST! 🚀`, this.canvas.width / 2 - 120, 60);
            this.ctx.fillText(`🚀 NITRO BOOST! 🚀`, this.canvas.width / 2 - 120, 60);
            
            // Villogó effekt
            if (Math.floor(Date.now() / 100) % 2) {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // Fokozat
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.strokeText(`${game.currentGear}. GEAR`, this.canvas.width - 350, 40);
        this.ctx.fillText(`${game.currentGear}. GEAR`, this.canvas.width - 350, 40);
        
        // ⭐ ANALOG MŰSZERFAL (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            this.dashboard.render(speedKmh, game.currentGear, game.actualRPM);
        }
        
        // ⭐ MOBIL INSTRUKCIÓK
        if (this.isMobile) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.canvas.width - 250, this.canvas.height - 100, 240, 90);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('📱 Mobil vezérlők alul', this.canvas.width - 240, this.canvas.height - 80);
            this.ctx.fillText('🚀 Piros gomb = Nitro', this.canvas.width - 240, this.canvas.height - 60);
            this.ctx.fillText('⬆️ Kék gomb = Gáz', this.canvas.width - 240, this.canvas.height - 40);
            this.ctx.fillText('⬅️➡️ Kormányzás', this.canvas.width - 240, this.canvas.height - 20);
        }
    }
}
