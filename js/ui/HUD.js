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
        
        // ⭐ NITRO BAR (jobb felső)
        const nitroBarX = this.isMobile ? this.canvas.width - 220 : this.canvas.width - 250;
        const nitroBarY = 20;
        const barWidth = this.isMobile ? 150 : 200;
        const barHeight = 20;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.strokeText('NITRO', nitroBarX, nitroBarY);
        this.ctx.fillText('NITRO', nitroBarX, nitroBarY);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(nitroBarX - 2, nitroBarY + 5 - 2, barWidth + 4, barHeight + 4);
        
        const nitroPercent = game.nitroAmount / 100;
        this.ctx.fillStyle = nitroPercent > 0.5 ? '#00FFFF' : 
                            nitroPercent > 0.2 ? '#FFFF00' : '#FF4444';
        this.ctx.fillRect(nitroBarX, nitroBarY + 5, barWidth * nitroPercent, barHeight);
        
        // ⭐ TÁVOLSÁG A CÉLIG (középen felül)
        const distanceToFinish = Math.max(0, (game.trackLength - game.position) / 1000);
        this.ctx.fillStyle = 'white';
        this.ctx.font = this.isMobile ? 'bold 16px Arial' : 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, this.canvas.width / 2, 30);
        this.ctx.fillText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, this.canvas.width / 2, 30);
        this.ctx.textAlign = 'left';
        
        // ⭐ NITRO JELZÉS
        if (game.nitroMode) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            
            const nitroText = this.isMobile ? '🚀 NITRO!' : '🚀 NITRO BOOST! 🚀';
            const nitroX = this.isMobile ? this.canvas.width / 2 - 60 : this.canvas.width / 2 - 120;
            
            this.ctx.strokeText(nitroText, nitroX, 60);
            this.ctx.fillText(nitroText, nitroX, 60);
            
            if (Math.floor(Date.now() / 100) % 2) {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // ⭐ FOKOZAT (jobb felső sarok)
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px Arial';
        const gearX = this.canvas.width - 80;
        this.ctx.strokeText(`${game.currentGear}. GEAR`, gearX, 60);
        this.ctx.fillText(`${game.currentGear}. GEAR`, gearX, 60);
        
        // ⭐ ANALOG MŰSZERFAL (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            const speedKmh = Math.floor((game.speed / game.maxSpeed) * 300);
            this.dashboard.render(speedKmh, game.currentGear, game.actualRPM);
        }
        
        // ⭐ FRISSÍTETT MOBIL INSTRUKCIÓK
        if (this.isMobile) {
            const infoWidth = 260;
            const infoHeight = 100;
            const infoX = this.canvas.width - infoWidth - 10;
            const infoY = this.canvas.height - infoHeight - 220; // Magasabbra a vezérlők miatt
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(infoX, infoY, infoWidth, infoHeight);
            
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(infoX, infoY, infoWidth, infoHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '11px Arial';
            this.ctx.fillText('🏎️ BAL oldal: Kormány (húzd)', infoX + 8, infoY + 18);
            this.ctx.fillText('⬆️ JOBB felső: Gáz', infoX + 8, infoY + 35);
            this.ctx.fillText('⬇️ JOBB alsó: Fék', infoX + 8, infoY + 52);
            this.ctx.fillText('🚀 KÖZÉP: Nitro boost', infoX + 8, infoY + 69);
            this.ctx.fillText('🎯 Egyszerű és intuitív!', infoX + 8, infoY + 86);
        }
    }
}
