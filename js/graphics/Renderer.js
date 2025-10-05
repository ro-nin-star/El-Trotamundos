import { ScreenManager } from './ScreenManager.js';
import { HUD } from '../ui/HUD.js';
import { SignRenderer } from './SignRenderer.js';

export class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.screenManager = new ScreenManager();
        this.hud = new HUD();
        this.signRenderer = new SignRenderer();
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
        this.renderSigns(gameEngine);
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
    
    renderSigns(gameEngine) {
        const game = gameEngine.game;
        
        if (!game.signs) return;
        
        game.signs.forEach(sign => {
            const signWorldZ = sign.z;
            const distanceToSign = signWorldZ - game.position;
            
            if (distanceToSign > -1000 && distanceToSign < 4000) {
                this.renderSignAtPosition(sign, game, distanceToSign);
            }
        });
    }
    
    renderSignAtPosition(sign, game, distanceToSign) {
        if (!sign.sprite) {
            switch (sign.type) {
                case 'curve':
                    sign.sprite = this.signRenderer.createCurveSign(sign.direction, sign.distance);
                    break;
                case 'speed':
                    sign.sprite = this.signRenderer.createSpeedSign(sign.speedLimit);
                    break;
                case 'city':
                    sign.sprite = this.signRenderer.createCitySign(sign.cityName);
                    break;
            }
        }
        
        if (!sign.sprite) return;
        
        const signWorldX = sign.offset * game.roadWidth;
        const signWorldY = -50;
        const signWorldZ = sign.z;
        
        const cameraX = signWorldX - (game.playerX * game.roadWidth);
        const cameraY = signWorldY - game.cameraY;
        const cameraZ = signWorldZ - game.position;
        
        if (cameraZ <= 0.1) return;
        
        const scale = 0.84 / cameraZ;
        const screenX = (this.canvas.width / 2) + (scale * cameraX * this.canvas.width / 2);
        const screenY = (this.canvas.height / 2) - (scale * cameraY * this.canvas.height / 2);
        
        const signScale = Math.max(0.3, Math.min(2.0, scale * 15));
        const finalW = sign.sprite.width * signScale;
        const finalH = sign.sprite.height * signScale;
        
        const destX = screenX - (finalW / 2);
        const destY = screenY - finalH;
        
        let alpha = 1.0;
        if (distanceToSign > 2000) {
            alpha = Math.max(0.3, 1.0 - ((distanceToSign - 2000) / 2000));
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.imageSmoothingEnabled = false;
        
        try {
            this.ctx.drawImage(sign.sprite, destX, destY, finalW, finalH);
            
            this.ctx.globalAlpha = alpha * 0.3;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(destX + 5, destY + finalH - 5, finalW * 0.8, 10);
            
        } catch (error) {
            console.warn('⚠️ Tábla renderelési hiba:', error);
        }
        
        this.ctx.restore();
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
            if (car.z > -3000 && car.z < 8000 && car.sprite && car.sprite instanceof HTMLImageElement) {
                this.renderCarAtPosition(car, game);
            }
        });
    }
    
    // ⭐ TELJESEN ÚJRAÍRT AUTÓ MÉRETEZÉS - REALISZTIKUS KÖZELI MÉRET
    renderCarAtPosition(car, game) {
        const carWorldZ = game.position + car.z;
        const carWorldX = car.offset * game.roadWidth;
        const carWorldY = 0;
        
        const cameraX = carWorldX - (game.playerX * game.roadWidth);
        const cameraY = carWorldY - game.cameraY;
        const cameraZ = carWorldZ - game.position;
        
        if (cameraZ <= 0.05) return;
        
        const scale = 0.84 / cameraZ;
        const screenX = (this.canvas.width / 2) + (scale * cameraX * this.canvas.width / 2);
        const screenY = (this.canvas.height / 2) - (scale * cameraY * this.canvas.height / 2);
        
        const spriteWidth = car.sprite.width || 40;
        const spriteHeight = car.sprite.height || 20;
        
        // ⭐ JAVÍTOTT MÉRETEZÉSI ALGORITMUS
        let finalW, finalH;
        const distance = Math.abs(car.z);
        
        if (car.z > 0) {
            // ⭐ ELŐTTÜNK LÉVŐ AUTÓK - TÁVOLSÁG ALAPÚ MÉRETEZÉS
            if (distance < 500) {
                // ⭐ NAGYON KÖZELI AUTÓK (0-500 távolság) - NAGY MÉRET
                const closeScale = Math.max(4.0, Math.min(8.0, scale * 80));
                finalW = spriteWidth * closeScale;
                finalH = spriteHeight * closeScale;
                
                // Minimum és maximum méret közeli autókhoz
                finalW = Math.max(120, Math.min(600, finalW));
                finalH = Math.max(80, Math.min(400, finalH));
                
            } else if (distance < 1500) {
                // ⭐ KÖZEPES TÁVOLSÁG (500-1500) - KÖZEPES MÉRET
                const mediumScale = Math.max(2.0, Math.min(4.0, scale * 50));
                finalW = spriteWidth * mediumScale;
                finalH = spriteHeight * mediumScale;
                
                finalW = Math.max(80, Math.min(300, finalW));
                finalH = Math.max(50, Math.min(200, finalH));
                
            } else {
                // ⭐ TÁVOLI AUTÓK (1500+) - EREDETI MÉRET
                const farScale = Math.max(0.8, Math.min(2.0, scale * 35));
                finalW = spriteWidth * farScale;
                finalH = spriteHeight * farScale;
                
                finalW = Math.max(40, Math.min(150, finalW));
                finalH = Math.max(25, Math.min(100, finalH));
            }
            
        } else {
            // ⭐ MÖGÖTTÜNK LÉVŐ AUTÓK - KISEBB MÉRETEZÉS
            if (distance < 300) {
                // ⭐ KÖZELI HÁTSÓ AUTÓK
                const backCloseScale = Math.max(2.0, Math.min(4.0, scale * 40));
                finalW = spriteWidth * backCloseScale;
                finalH = spriteHeight * backCloseScale;
                
                finalW = Math.max(60, Math.min(250, finalW));
                finalH = Math.max(40, Math.min(180, finalH));
                
            } else {
                // ⭐ TÁVOLI HÁTSÓ AUTÓK
                const backScale = Math.max(0.5, Math.min(2.0, scale * 25));
                finalW = spriteWidth * backScale;
                finalH = spriteHeight * backScale;
                
                finalW = Math.max(20, Math.min(120, finalW));
                finalH = Math.max(15, Math.min(80, finalH));
            }
        }
        
        // ⭐ POZÍCIÓ SZÁMÍTÁSA
        const destX = screenX - (finalW / 2);
        const destY = screenY - finalH;
        
        // ⭐ TÁVOLSÁG ALAPÚ ÁTLÁTSZÓSÁG
        let alpha = 1.0;
        if (car.z > 4000) {
            alpha = Math.max(0.3, 1.0 - ((car.z - 4000) / 4000));
        }
        
        // ⭐ KÉPERNYŐN KÍVÜLI AUTÓK KISZŰRÉSE
        if (destX + finalW < -50 || destX > this.canvas.width + 50 || 
            destY + finalH < 0 || destY > this.canvas.height + 50) {
            return;
        }
        
        // ⭐ RENDERELÉS
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.imageSmoothingEnabled = false;
        
        try {
            this.ctx.drawImage(car.sprite, destX, destY, finalW, finalH);
            
            // ⭐ DEBUG INFO (kapcsolható)
            if (false) { // true-ra állítva debug infót mutat
                this.ctx.fillStyle = 'white';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`D:${Math.round(distance)} S:${finalW.toFixed(0)}x${finalH.toFixed(0)}`, destX, destY - 5);
            }
            
        } catch (error) {
            console.warn('⚠️ Autó renderelési hiba:', error);
        }
        
        this.ctx.restore();
    }
    
    renderPlayerCar(gameEngine, assetLoader) {
        const assets = assetLoader.getAssets();
        if (!assets.player) return;
        
        // ⭐ JÁTÉKOS AUTÓ MÉRETE IS NAGYOBB LEGYEN
        const carScale = this.isMobile ? 2.5 : 3.0; // Nagyobb alapméret
        const carW = assets.player.width * carScale;
        const carH = assets.player.height * carScale;
        
        const carX = (this.canvas.width / 2) - (carW / 2);
        const carY = this.canvas.height - carH - 20;
        
        this.ctx.save();
        this.ctx.globalAlpha = 1.0;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.translate(carX + carW / 2, carY + carH / 2);
        this.ctx.rotate(gameEngine.game.playerX * 0.1);
        this.ctx.drawImage(assets.player, -carW / 2, -carH / 2, carW, carH);
        this.ctx.restore();
    }
}
