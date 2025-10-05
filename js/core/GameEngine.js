import { CarPhysics } from '../physics/CarPhysics.js';
import { TrackBuilder } from '../physics/TrackBuilder.js';

export class GameEngine {
    constructor() {
        this.carPhysics = new CarPhysics();
        this.trackBuilder = new TrackBuilder();
        
        this.game = {
            playerX: 0,
            speed: 0,
            maxSpeed: 300,
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
            trackLength: 50000, // ⭐ HOSSZABB PÁLYA
            road: [],
            cars: [],
            lastCarSpawn: 0,
            carSpawnDelay: 2000 // ⭐ GYAKORIBB AUTÓ SPAWN
        };
    }
    
    buildTrack(assetLoader) {
        this.trackBuilder.buildTrack(this.game, assetLoader);
    }
    
    update(dt, gameState, inputManager, audioManager) {
        if (gameState.current !== 'PLAYING') return;
        
        this.carPhysics.update(dt, this.game, inputManager);
        this.updateGearAndRPM(dt);
        this.updatePosition(dt);
        this.updateCars(dt);
        this.spawnNewCar();
        
        if (audioManager && audioManager.updateEngineSound) {
            audioManager.updateEngineSound(this.game);
        }
        
        // ⭐ JAVÍTOTT CÉLBA ÉRÉS
        if (this.game.position >= this.game.trackLength - 1000) {
            this.handleFinish(audioManager);
        }
        
        // ⭐ MOBIL RESTART TÁMOGATÁS
        if (this.game.finished && (inputManager.isPressed('KeyR') || inputManager.isPressed('Enter'))) {
            this.restartRace();
            if (audioManager && audioManager.startBackgroundMusic) {
                audioManager.startBackgroundMusic();
            }
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
    
    // ⭐ JAVÍTOTT AUTÓ FRISSÍTÉS
    updateCars(dt) {
        this.game.cars.forEach((car, index) => {
            // Autó saját mozgása
            const carForwardMovement = car.speed * dt * 50;
            // Játékos hatása (hátrafelé mozognak a játékoshoz képest)
            const playerEffect = this.game.speed * dt * 50;
            
            car.z += carForwardMovement - playerEffect;
            
            // Pálya követés javítva
            if (car.followsTrack) {
                const carPosition = this.game.position + car.z;
                const carSegment = this.findSegment(carPosition);
                
                if (carSegment && Math.abs(carSegment.curve) > 0) {
                    const curveEffect = carSegment.curve * 0.0002; // Finomabb követés
                    car.offset += curveEffect;
                    car.offset = Math.max(-0.9, Math.min(0.9, car.offset));
                }
            }
            
            // ⭐ NAGYOBB TÁVOLSÁG ELTÁVOLÍTÁSHOZ
            if (car.z > 5000 || car.z < -2000) {
                this.game.cars.splice(index, 1);
                return;
            }
        });
    }
    
    // ⭐ JAVÍTOTT AUTÓ SPAWN
    spawnNewCar() {
        const now = Date.now();
        
        if (now - this.game.lastCarSpawn < this.game.carSpawnDelay) {
            return;
        }
        
        if (this.game.cars.length >= 5) { // Több autó
            return;
        }
        
        // Változatos pozíciók
        const spawnPositions = [
            { z: 1500, offset: -0.6 }, // Bal sáv
            { z: 2000, offset: 0.0 },  // Közép
            { z: 1800, offset: 0.6 },  // Jobb sáv
            { z: 2500, offset: -0.3 }, // Bal-közép
            { z: 2200, offset: 0.3 }   // Jobb-közép
        ];
        
        const randomPos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
        
        const newCar = {
            z: randomPos.z + Math.random() * 500,
            offset: randomPos.offset + (Math.random() - 0.5) * 0.2,
            sprite: this.getRandomEnemySprite(),
            speed: 80 + Math.random() * 40, // Változatos sebesség
            width: 60,
            height: 30,
            followsTrack: true
        };
        
        this.game.cars.push(newCar);
        this.game.lastCarSpawn = now;
        
        // Következő spawn idő variálása
        this.game.carSpawnDelay = 1500 + Math.random() * 2000;
    }
    
    getRandomEnemySprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#0000FF', '#00FF00', '#FF00FF', '#FFFF00', '#FF8800', '#8800FF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.fillStyle = color;
        ctx.fillRect(8, 2, 24, 16);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
    
    findSegment(z) {
        const segmentIndex = Math.floor(z / this.game.segmentLength);
        if (segmentIndex >= 0 && segmentIndex < this.game.road.length) {
            return this.game.road[segmentIndex];
        }
        return this.game.road.length > 0 ? this.game.road[0] : null;
    }
    
    // ⭐ JAVÍTOTT CÉLBA ÉRÉS - AUTOMATIKUS HANGLEÁLLÍTÁS
    handleFinish(audioManager) {
        if (!this.game.finished) {
            this.game.finished = true;
            this.game.finishTime = Date.now() - this.game.raceStartTime;
            
            // ⭐ MINDEN HANG LEÁLLÍTÁSA
            if (audioManager) {
                audioManager.stopAllSounds(); // Új metódus
                if (audioManager.playSound) {
                    setTimeout(() => audioManager.playSound('finish'), 500);
                }
            }
            
            console.log('🏁 FINISH! Hangok leállítva.');
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
        console.log('🔄 Race restarted!');
    }
}
