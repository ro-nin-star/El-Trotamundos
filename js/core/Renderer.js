import { ScreenManager } from './ScreenManager.js';
import { HUD } from '../ui/HUD.js';

export class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.screenManager = new ScreenManager();
        this.hud = new HUD();
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.screenManager.setCanvas(canvas, ctx);
        this.hud.setCanvas(canvas, ctx);
    }
    
    render(gameState, gameEngine, assetLoader) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch(gameState.current) {
            case 'LOADING':
                this.screenManager.renderLoadingScreen(gameState);
                break;
            case 'INTRO':
                this.screenManager.renderIntroScreen();
                break;
            case 'PLAYING':
                this.renderGame(gameEngine, assetLoader);
                break;
        }
    }
    
    renderGame(gameEngine, assetLoader) {
        this.ctx.save();
        this.ctx.translate(gameEngine.game.shake.x, gameEngine.game.shake.y);
        
        this.renderSky();
        this.renderRoad(gameEngine);
        this.renderPlayerCar(gameEngine, assetLoader);
        
        this.ctx.restore();
        
        this.hud.render(gameEngine);
        
        if (gameEngine.game.finished) {
            this.screenManager.renderFinishLayer(gameEngine);
        }
    }
    
    renderSky() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
    }
    
    renderRoad(gameEngine) {
        // Pálya renderelési logika
    }
    
    renderPlayerCar(gameEngine, assetLoader) {
        const assets = assetLoader.getAssets();
        if (!assets.player) return;
        
        const carScale = 2.5;
        const carW = assets.player.width * carScale;
        const carH = assets.player.height * carScale;
        
        const carX = (this.canvas.width / 2) - (carW / 2);
        const carY = this.canvas.height - carH - 20;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        this.ctx.translate(carX + carW / 2, carY + carH / 2);
        this.ctx.rotate(gameEngine.game.playerX * 0.1);
        this.ctx.drawImage(assets.player, -carW / 2, -carH / 2, carW, carH);
        this.ctx.restore();
    }
}
