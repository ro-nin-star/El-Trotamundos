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
    
    // ⭐ HIÁNYZÓ setMobile METÓDUS HOZZÁADÁSA
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
            
            const nitroText = this.isMobile ? '🚀 NITRO!' : '🚀 NITRO BOOST! 🚀';
            const nitroX = this.isMobile ? this.canvas.width / 2 - 60 : this.canvas.width / 2 - 120;
            
            this.ctx.strokeText(nitroText, nitroX, 60);
            this.ctx.fillText(nitroText, nitroX, 60);
            
            // Villogó effekt
            if (Math.floor(Date.now() / 100) % 2) {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // Fokozat
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px Arial';
        const gearX = this.isMobile ? this.canvas.width - 150 : this.canvas.width - 350;
        this.ctx.strokeText(`${game.currentGear}. GEAR`, gearX, 40);
        this.ctx.fillText(`${game.currentGear}. GEAR`, gearX, 40);
        
        // ⭐ ANALOG MŰSZERFAL (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            this.dashboard.render(speedKmh, game.currentGear, game.actualRPM);
        }
        
        // ⭐ MOBIL INSTRUKCIÓK
        if (this.isMobile) {
            const infoWidth = 240;
            const infoHeight = 90;
            const infoX = this.canvas.width - infoWidth - 10;
            const infoY = this.canvas.height - infoHeight - 10;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(infoX, infoY, infoWidth, infoHeight);
            
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(infoX, infoY, infoWidth, infoHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('📱 Mobil vezérlők alul', infoX + 10, infoY + 20);
            this.ctx.fillText('🚀 Piros gomb = Nitro', infoX + 10, infoY + 40);
            this.ctx.fillText('⬆️ Kék gomb = Gáz', infoX + 10, infoY + 60);
            this.ctx.fillText('⬅️➡️ Kormányzás', infoX + 10, infoY + 80);
        }
    }
}
