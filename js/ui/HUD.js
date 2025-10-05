export class HUD {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
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
        
        // Nitro jelzés
        if (game.nitroMode) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.strokeText(`NITRO!`, this.canvas.width - 350, 60);
            this.ctx.fillText(`NITRO!`, this.canvas.width - 350, 60);
        }
        
        // Fokozat
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.strokeText(`${game.currentGear}. GEAR`, this.canvas.width - 350, 40);
        this.ctx.fillText(`${game.currentGear}. GEAR`, this.canvas.width - 350, 40);
    }
}
