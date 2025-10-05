import { CarPhysics } from '../physics/CarPhysics.js';
import { TrackBuilder } from '../physics/TrackBuilder.js';

export class GameEngine {
    constructor() {
        this.carPhysics = new CarPhysics();
        this.trackBuilder = new TrackBuilder();
        
        this.game = {
            playerX: 0,
            speed: 0,
            maxSpeed: 350,
            nitroMode: false,
            nitroAmount: 100,
            finished: false,
            finishTime: 0,
            raceStartTime: 0,
            currentGear: 1,
            previousGear: 1,
            actualRPM: 800,
            targetRPM: 800,
            shake: { x: 0, y: 0, intensity: 0, duration: 0 },
            position: 0,
            cameraX: 0,
            cameraY: 1200,
            cameraZ: 0,
            roadWidth: 2000,
            segmentLength: 200,
            drawDistance: 400,
            trackLength: 0,
            road: [],
            cars: [],
            lastCarSpawn: 0,
            carSpawnDelay: 5000
        };
    }
    
    buildTrack() {
        this.trackBuilder.buildTrack(this.game);
    }
    
    update(dt, gameState, inputManager, audioManager) {
        if (gameState.current !== 'PLAYING') return;
        
        this.carPhysics.update(dt, this.game, inputManager);
        this.updateGearAndRPM(dt);
        this.updatePosition(dt);
        this.updateCars(dt);
        this.spawnNewCar();
        
        audioManager.updateEngineSound(this.game);
        
        if (this.game.position >= this.game.trackLength - 1000) {
            this.handleFinish(audioManager);
        }
    }
    
    updateGearAndRPM(dt) {
        const speedKmh = Math.floor((this.game.speed / this.game.maxSpeed) * 300);
        let newGear = 1;
        
        if (speedKmh > 30) newGear = 2;
        if (speedKmh > 60) newGear = 3;
        if (speedKmh > 100) newGear = 4;
        if (speedKmh > 150) newGear = 5;
        if (speedKmh > 200) newGear = 6;
        
        if (newGear !== this.game.currentGear) {
            this.game.previousGear = this.game.currentGear;
            this.game.currentGear = newGear;
            
            if (newGear > this.game.previousGear) {
                this.game.targetRPM = this.game.actualRPM * 0.6;
            } else {
                this.game.targetRPM = Math.min(8500, this.game.actualRPM * 1.4);
            }
        }
        
        const gearRanges = {
            1: { min: 0, max: 35, rpmMin: 800, rpmMax: 4500 },
            2: { min: 25, max: 65, rpmMin: 1000, rpmMax: 5500 },
            3: { min: 55, max: 105, rpmMin: 1200, rpmMax: 6500 },
            4: { min: 95, max: 155, rpmMin: 1400, rpmMax: 7500 },
            5: { min: 145, max: 205, rpmMin: 1600, rpmMax: 8500 },
            6: { min: 195, max: 300, rpmMin: 1800, rpmMax: 9000 }
        };
        
        const currentRange = gearRanges[this.game.currentGear];
        const speedInGear = Math.max(0, speedKmh - currentRange.min);
        const gearSpan = currentRange.max - currentRange.min;
        const speedPercent = Math.min(1, speedInGear / gearSpan);
        
        const calculatedRPM = currentRange.rpmMin + (speedPercent * (currentRange.rpmMax - currentRange.rpmMin));
        const rpmDiff = calculatedRPM - this.game.actualRPM;
        this.game.actualRPM += rpmDiff * dt * 8;
        this.game.actualRPM = Math.max(600, Math.min(9000, this.game.actualRPM));
    }
    
    updatePosition(dt) {
        this.game.position += this.game.speed * dt * 50;
    }
    
    updateCars(dt) {
        // Autók frissítése logika
    }
    
    spawnNewCar() {
        // Új autó generálás logika
    }
    
    handleFinish(audioManager) {
        if (!this.game.finished) {
            this.game.finished = true;
            this.game.finishTime = Date.now() - this.game.raceStartTime;
            audioManager.stopBackgroundMusic();
            audioManager.playSound('finish');
        }
    }
    
    restartRace() {
        this.game.position = 0;
        this.game.speed = 0;
        this.game.playerX = 0;
        this.game.finished = false;
        this.game.finishTime = 0;
        this.game.raceStartTime = Date.now();
        this.game.nitroAmount = 100;
        this.game.cars = [];
        this.game.currentGear = 1;
        this.game.actualRPM = 800;
    }
}
