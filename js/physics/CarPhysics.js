export class CarPhysics {
    constructor() {
        this.acceleration = 60;
        this.deceleration = 800;
        this.brakeForce = 150;
        this.friction = 40;
    }
    
    update(dt, game, inputManager) {
        // NITRO MÓD
        if (inputManager.isPressed('Space') && game.nitroAmount > 0) {
            game.nitroMode = true;
            game.maxSpeed = 450;
            game.nitroAmount -= dt * 20;
            game.nitroAmount = Math.max(0, game.nitroAmount);
        } else {
            game.nitroMode = false;
            game.maxSpeed = 300;
            if (game.nitroAmount < 100) {
                game.nitroAmount += dt * 5;
                game.nitroAmount = Math.min(100, game.nitroAmount);
            }
        }
        
        // Gyorsítás/lassítás/fékezés
        if (inputManager.isPressed('ArrowUp') || inputManager.isPressed('KeyW')) {
            game.speed = Math.min(game.maxSpeed, game.speed + this.acceleration * dt);
        } else if (inputManager.isPressed('ArrowDown') || inputManager.isPressed('KeyS')) {
            game.speed = Math.max(0, game.speed - this.brakeForce * dt);
        } else {
            game.speed = Math.max(0, game.speed - this.friction * dt);
        }
        
        // Kormányzás
        const speedPercent = game.speed / game.maxSpeed;
        const steeringSensitivity = 3.0 + (speedPercent * 2.0);
        const maxSteer = 2.0;
        const steerInput = dt * steeringSensitivity;
        
        if (inputManager.isPressed('ArrowLeft') || inputManager.isPressed('KeyA')) {
            game.playerX -= steerInput;
        }
        if (inputManager.isPressed('ArrowRight') || inputManager.isPressed('KeyD')) {
            game.playerX += steerInput;
        }
        
        // Pozíció korlátozása
        game.playerX = Math.max(-maxSteer, Math.min(maxSteer, game.playerX));
        
        // Kanyar hatás
        this.applyCurveEffect(game, speedPercent);
        
        // Fű ellenőrzés
        this.checkOffRoad(game);
    }
    
    applyCurveEffect(game, speedPercent) {
        const playerSegment = this.findSegment(game);
        if (playerSegment && game.speed > 50) {
            const curveForce = playerSegment.curve * speedPercent * 0.005;
            game.playerX -= curveForce;
            
            if (Math.abs(playerSegment.curve) > 3) {
                game.speed *= (1 - speedPercent * 0.01);
            }
        }
    }
    
    checkOffRoad(game) {
        const isOffRoad = Math.abs(game.playerX) > 0.8;
        
        if (isOffRoad && game.speed > 30) {
            const shakeIntensity = Math.min(10, game.speed / 20);
            this.startShake(game, shakeIntensity, 0.1);
            game.speed *= 0.92;
        }
        
        if (Math.abs(game.playerX) > 1.2) {
            game.speed *= 0.98;
        }
    }
    
    startShake(game, intensity, duration) {
        game.shake.intensity = intensity;
        game.shake.duration = duration;
    }
    
    findSegment(game) {
        const segmentIndex = Math.floor(game.position / game.segmentLength);
        if (segmentIndex >= 0 && segmentIndex < game.road.length) {
            return game.road[segmentIndex];
        }
        return game.road[0];
    }
}
