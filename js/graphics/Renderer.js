import { ScreenManager } from './ScreenManager.js';
import { HUD } from '../ui/HUD.js';

export class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.screenManager = new ScreenManager();
        this.hud = new HUD();
        this.isMobile = false;
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.screenManager.setCanvas(canvas, ctx);
        this.hud.setCanvas(canvas, ctx);
    }
    
    setMobile(isMobile) {
        this.isMobile = isMobile;
        this.screenManager.setMobile(isMobile);
        this.hud.setMobile(isMobile);
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
        const game = gameEngine.game;
        const baseSegment = this.findSegment(game.position, game);
        
        if (!baseSegment) return;
        
        const basePercent = (game.position % game.segmentLength) / game.segmentLength;
        const playerY = 0;
        
        let maxy = this.canvas.height;
        let x = 0;
        let dx = -(basePercent * baseSegment.curve);
        
        for (let n = 0; n < game.drawDistance; n++) {
            const segmentIndex = (baseSegment.index + n) % game.road.length;
            const segment = game.road[segmentIndex];
            
            if (!segment) continue;
            
            this.project(segment.p1, 
                (game.playerX * game.roadWidth) - x, 
                playerY + game.cameraY, 
                game.position);
            this.project(segment.p2, 
                (game.playerX * game.roadWidth) - x - dx, 
                playerY + game.cameraY, 
                game.position);
            
            x += dx;
            dx += segment.curve;
            
            if ((segment.p1.camera.z <= 0.84) || (segment.p2.screen.y >= maxy)) {
                continue;
            }
            
            this.renderSegment(segment);
            maxy = segment.p1.screen.y;
        }
        
        this.renderFinishLine(game);
        this.renderCars(game);
    }
    
    findSegment(z, game) {
        const segmentIndex = Math.floor(z / game.segmentLength);
        if (segmentIndex >= 0 && segmentIndex < game.road.length) {
            return game.road[segmentIndex];
        }
        return game.road.length > 0 ? game.road[0] : null;
    }
    
    project(p, cameraX, cameraY, cameraZ) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        
        if (p.camera.z <= 0) {
            p.screen.scale = 0;
            p.screen.x = 0;
            p.screen.y = 0;
            p.screen.w = 0;
            return;
        }
        
        p.screen.scale = 0.84 / p.camera.z;
        p.screen.x = Math.round((this.canvas.width / 2) + (p.screen.scale * p.camera.x * this.canvas.width / 2));
        p.screen.y = Math.round((this.canvas.height / 2) - (p.screen.scale * p.camera.y * this.canvas.height / 2));
        p.screen.w = Math.round(p.screen.scale * 2000 * this.canvas.width / 2);
    }
    
    renderSegment(segment) {
        const rumbleWidth = 2000 / 8;
        const laneWidth = 2000 / 20;
        
        const r1 = rumbleWidth * segment.p1.screen.scale;
        const r2 = rumbleWidth * segment.p2.screen.scale;
        const l1 = laneWidth * segment.p1.screen.scale;
        const l2 = laneWidth * segment.p2.screen.scale;
        
        // Fű
        this.ctx.fillStyle = segment.color === 'dark' ? '#228B22' : '#32CD32';
        this.ctx.fillRect(0, segment.p2.screen.y, this.canvas.width, segment.p1.screen.y - segment.p2.screen.y);
        
        // Út oldalsó csíkok
        this.polygon(
            segment.p1.screen.x - segment.p1.screen.w - r1, segment.p1.screen.y,
            segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x - segment.p2.screen.w - r2, segment.p2.screen.y,
            segment.color === 'dark' ? '#FF0000' : '#FFFFFF'
        );
        
        this.polygon(
            segment.p1.screen.x + segment.p1.screen.w + r1, segment.p1.screen.y,
            segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x + segment.p2.screen.w + r2, segment.p2.screen.y,
            segment.color === 'dark' ? '#FF0000' : '#FFFFFF'
        );
        
        // Út
        this.polygon(
            segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
            segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
            segment.color === 'dark' ? '#666666' : '#999999'
        );
        
        // Középvonal
        if (segment.color === 'light') {
            this.polygon(
                segment.p1.screen.x - l1, segment.p1.screen.y,
                segment.p1.screen.x + l1, segment.p1.screen.y,
                segment.p2.screen.x + l2, segment.p2.screen.y,
                segment.p2.screen.x - l2, segment.p2.screen.y,
                '#FFFF00'
            );
        }
    }
    
    polygon(x1, y1, x2, y2, x3, y3, x4, y4, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.lineTo(x4, y4);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderFinishLine(game) {
        const finishPosition = game.trackLength - 500;
        const distanceToFinish = finishPosition - game.position;
        
        if (distanceToFinish > 0 && distanceToFinish < 2000) {
            const finishSegment = this.findSegment(finishPosition, game);
            
            if (finishSegment && finishSegment.p1 && finishSegment.p1.screen) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, finishSegment.p1.screen.y - 10, this.canvas.width, 20);
                
                for (let i = 0; i < this.canvas.width; i += 40) {
                    this.ctx.fillStyle = i % 80 === 0 ? '#FFFFFF' : '#000000';
                    this.ctx.fillRect(i, finishSegment.p1.screen.y - 10, 40, 20);
                }
            }
        }
    }
    
    renderCars(game) {
        game.cars.forEach(car => {
            // ⭐ CSAK VALÓDI SPRITE-OKKAL RENDELKEZŐ AUTÓK RENDERELÉSE
            if (car.z > -1000 && car.z < 4000 && car.sprite && car.sprite instanceof HTMLImageElement) {
                this.renderCarAtPosition(car, game);
            }
        });
    }
    
    // ⭐ JAVÍTOTT AUTÓ RENDERELÉS - SZELLEMKÉP JAVÍTÁS
    renderCarAtPosition(car, game) {
        const carWorldZ = game.position + car.z;
        const carWorldX = car.offset * game.roadWidth;
        const carWorldY = 0;
        
        const cameraX = carWorldX - (game.playerX * game.roadWidth);
        const cameraY = carWorldY - game.cameraY;
        const cameraZ = carWorldZ - game.position;
        
        if (cameraZ <= 0.1) return;
        
        const scale = 0.84 / cameraZ;
        const screenX = (this.canvas.width / 2) + (scale * cameraX * this.canvas.width / 2);
        const screenY = (this.canvas.height / 2) - (scale * cameraY * this.canvas.height / 2);
        
        // ⭐ REALISZTIKUS MÉRETEZÉS
        const baseScale = 15.0;
        const distanceScale = Math.max(0.4, Math.min(4.0, scale * 20));
        
        const destW = car.sprite.width * distanceScale * baseScale / 10;
        const destH = car.sprite.height * distanceScale * baseScale / 10;
        
        const finalW = Math.max(20, Math.min(300, destW));
        const finalH = Math.max(15, Math.min(180, finalH));
        
        const destX = screenX - (finalW / 2);
        const destY = screenY - finalH;
        
        // ⭐ TELJES ÁTLÁTSZATLANSÁG - SZELLEMKÉP JAVÍTÁS
        this.ctx.save();
        this.ctx.globalAlpha = 1.0; // ⭐ TELJES ÁTLÁTSZATLANSÁG
        
        // ⭐ KÉPMINŐSÉG JAVÍTÁS
        this.ctx.imageSmoothingEnabled = false;
        
        try {
            this.ctx.drawImage(car.sprite, destX, destY, finalW, finalH);
        } catch (error) {
            console.warn('⚠️ Autó renderelési hiba:', error);
        }
        
        this.ctx.restore();
    }
    
    renderPlayerCar(gameEngine, assetLoader) {
        const assets = assetLoader.getAssets();
        if (!assets.player) return;
        
        const carScale = this.isMobile ? 2.0 : 2.5;
        const carW = assets.player.width * carScale;
        const carH = assets.player.height * carScale;
        
        const carX = (this.canvas.width / 2) - (carW / 2);
        const carY = this.canvas.height - carH - 20;
        
        this.ctx.save();
        this.ctx.globalAlpha = 1.0; // ⭐ JÁTÉKOS AUTÓ IS TELJES ÁTLÁTSZATLANSÁG
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.translate(carX + carW / 2, carY + carH / 2);
        this.ctx.rotate(gameEngine.game.playerX * 0.1);
        this.ctx.drawImage(assets.player, -carW / 2, -carH / 2, carW, carH);
        this.ctx.restore();
    }
}
