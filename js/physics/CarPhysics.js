export class CarPhysics {
    constructor() {
        this.acceleration = 80; // ⭐ MEGNÖVELT GYORSULÁS
        this.deceleration = 800;
        this.brakeForce = 150;
        this.friction = 40;
    }
    
    update(dt, game, inputManager) {
        // ⭐ JAVÍTOTT NITRO MÓD
        const isNitroPressed = inputManager.isPressed('Space');
        
        if (isNitroPressed && game.nitroAmount > 0) {
            game.nitroMode = true;
            game.maxSpeed = 450; // ⭐ MAGASABB MAX SEBESSÉG
            game.nitroAmount -= dt * 25;
            game.nitroAmount = Math.max(0, game.nitroAmount);
        } else {
            game.nitroMode = false;
            game.maxSpeed = 300;
            if (game.nitroAmount < 100) {
                game.nitroAmount += dt * 8; // ⭐ GYORSABB TÖLTŐDÉS
                game.nitroAmount = Math.min(100, game.nitroAmount);
            }
        }
        
        // ⭐ JAVÍTOTT GYORSÍTÁS/LASSÍTÁS/FÉKEZÉS
        const isAcceleratePressed = inputManager.isPressed('ArrowUp') || inputManager.isPressed('KeyW');
        const isBrakePressed = inputManager.isPressed('ArrowDown') || inputManager.isPressed('KeyS');
        
        if (isAcceleratePressed) {
            // ⭐ NITRO BOOST: Ha nitro aktív, SOKKAL nagyobb gyorsulás
            const currentAcceleration = game.nitroMode ? this.acceleration * 2.5 : this.acceleration;
            game.speed = Math.min(game.maxSpeed, game.speed + currentAcceleration * dt);
        } else if (isBrakePressed) {
            game.speed = Math.max(0, game.speed - this.brakeForce * dt);
        } else {
            // ⭐ NITRO ESETÉN LASSABB LASSULÁS
            const currentFriction = game.nitroMode ? this.friction * 0.3 : this.friction;
            game.speed = Math.max(0, game.speed - currentFriction * dt);
        }
        
        // ⭐ JAVÍTOTT KORMÁNYZÁS
        const isSteerLeftPressed = inputManager.isPressed('ArrowLeft') || inputManager.isPressed('KeyA');
        const isSteerRightPressed = inputManager.isPressed('ArrowRight') || inputManager.isPressed('KeyD');
        
        const speedPercent = game.speed / game.maxSpeed;
        const steeringSensitivity = 3.0 + (speedPercent * 2.0);
        const maxSteer = 2.0;
        const steerInput = dt * steeringSensitivity;
        
        if (isSteerLeftPressed) {
            game.playerX -= steerInput;
        }
        if (isSteerRightPressed) {
            game.playerX += steerInput;
        }
        
        // Pozíció korlátozása
        game.playerX = Math.max(-maxSteer, Math.min(maxSteer, game.playerX));
        
        // Kanyar hatás
        this.applyCurveEffect(game, speedPercent);
        
        // Fű ellenőrzés
        this.checkOffRoad(game);
        
        // ⭐ SHAKE FRISSÍTÉSE
        this.updateShake(game, dt);
    }
    
    updateShake(game, dt) {
        if (game.shake.duration > 0) {
            game.shake.duration -= dt;
            
            game.shake.x = (Math.random() - 0.5) * game.shake.intensity;
            game.shake.y = (Math.random() - 0.5) * game.shake.intensity;
            
            game.shake.intensity *= 0.95;
        } else {
            game.shake.x = 0;
            game.shake.y = 0;
            game.shake.intensity = 0;
        }
    }
    
    applyCurveEffect(game, speedPercent) {
        const playerSegment = this.findSegment(game);
        if (playerSegment && game.speed > 50) {
            const curveForce = playerSegment.curve * speedPercent * 0.005;
            game.playerX -= curveForce;
            
            if (Math.abs(playerSegment.curve) > 3) {
                // ⭐ NITRO ESETÉN KISEBB LASSULÁS KANYAROKBAN
                const curvePenalty = game.nitroMode ? 0.995 : 0.99;
                game.speed *= curvePenalty;
            }
        }
    }
    
    checkOffRoad(game) {
        const isOffRoad = Math.abs(game.playerX) > 0.8;
        
        if (isOffRoad && game.speed > 30) {
            const shakeIntensity = Math.min(10, game.speed / 20);
            this.startShake(game, shakeIntensity, 0.1);
            // ⭐ NITRO ESETÉN KISEBB LASSULÁS FÜVÖN
            const offRoadPenalty = game.nitroMode ? 0.96 : 0.92;
            game.speed *= offRoadPenalty;
        }
        
        if (Math.abs(game.playerX) > 1.2) {
            // ⭐ NITRO ESETÉN KISEBB BÜNTETÉS
            const steerPenalty = game.nitroMode ? 0.99 : 0.98;
            game.speed *= steerPenalty;
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
