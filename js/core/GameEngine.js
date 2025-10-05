import { CarPhysics } from '../physics/CarPhysics.js';
import { TrackBuilder } from '../physics/TrackBuilder.js';
import { MiniMap } from '../ui/Minimap.js';

export class GameEngine {
    constructor() {
        this.carPhysics = new CarPhysics();
        this.trackBuilder = new TrackBuilder();
        this.assetLoader = null;
        this.miniMap = new MiniMap(); // ⭐ MINI TÉRKÉP
        
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
            trackLength: 50000, // ⭐ DINAMIKUSAN FRISSÜL A TÉRKÉPBŐL
            road: [],
            cars: [],
            lastCarSpawn: 0,
            carSpawnDelay: 2000,
            mapImageSrc: null
        };
    }
    
    setMapImage(mapImageSrc) {
        this.game.mapImageSrc = mapImageSrc;
        console.log(`🗺️ Térkép beállítva: ${mapImageSrc}`);
    }
    
    async buildTrack(assetLoader) {
        this.assetLoader = assetLoader;
        
        await this.trackBuilder.buildTrack(this.game, assetLoader, this.game.mapImageSrc);
        
        // ⭐ MINI TÉRKÉP INICIALIZÁLÁSA
        if (this.trackBuilder.mapGenerator && this.trackBuilder.mapGenerator.getMiniMapData) {
            const mapData = this.trackBuilder.mapGenerator.getMiniMapData();
            if (mapData.originalImage) {
                this.miniMap.init(mapData);
                console.log('🗺️ Mini térkép inicializálva');
            }
        }
    }
    
    update(dt, gameState, inputManager, audioManager) {
        if (gameState.current !== 'PLAYING') return;
        
        this.carPhysics.update(dt, this.game, inputManager);
        this.updateGearAndRPM(dt);
        this.updatePosition(dt);
        this.updateCars(dt);
        this.spawnNewCar();
        
        // ⭐ MINI TÉRKÉP FRISSÍTÉSE
        this.miniMap.updatePlayerPosition(this.game.position, this.game.trackLength);
        
        if (audioManager && audioManager.updateEngineSound) {
            audioManager.updateEngineSound(this.game);
        }
        
        if (this.game.position >= this.game.trackLength - 1000) {
            this.handleFinish(audioManager);
        }
        
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
    
    updateCars(dt) {
        this.game.cars.forEach((car, index) => {
            const carForwardMovement = car.speed * dt * 50;
            const playerEffect = this.game.speed * dt * 50;
            
            car.z += carForwardMovement - playerEffect;
            
            if (car.followsTrack) {
                const carPosition = this.game.position + car.z;
                const carSegment = this.findSegment(carPosition);
                
                if (carSegment && Math.abs(carSegment.curve) > 0) {
                    const curveEffect = carSegment.curve * 0.0002;
                    car.offset += curveEffect;
                    car.offset = Math.max(-0.9, Math.min(0.9, car.offset));
                }
            }
            
            this.avoidCarCollisions(car, index);
            
            if (car.z > 8000 || car.z < -3000) {
                this.game.cars.splice(index, 1);
                return;
            }
        });
    }
    
    avoidCarCollisions(currentCar, currentIndex) {
        const safeDistance = 400; // ⭐ NAGYOBB BIZTONSÁGOS TÁVOLSÁG
        const sideDistance = 0.3;
        
        this.game.cars.forEach((otherCar, otherIndex) => {
            if (currentIndex === otherIndex) return;
            
            const zDistance = Math.abs(currentCar.z - otherCar.z);
            const offsetDistance = Math.abs(currentCar.offset - otherCar.offset);
            
            if (zDistance < safeDistance && offsetDistance < sideDistance) {
                
                if (currentCar.offset > otherCar.offset) {
                    currentCar.offset = Math.min(0.8, currentCar.offset + 0.01);
                } else {
                    currentCar.offset = Math.max(-0.8, currentCar.offset - 0.01);
                }
                
                if (currentCar.z > otherCar.z) {
                    currentCar.speed = Math.max(60, currentCar.speed - 5);
                } else {
                    currentCar.speed = Math.min(120, currentCar.speed + 5);
                }
            }
        });
    }
    
    // ⭐ SPAWN TÁVOLSÁGOK OPTIMALIZÁLÁSA
    spawnNewCar() {
        const now = Date.now();
        
        if (now - this.game.lastCarSpawn < this.game.carSpawnDelay) {
            return;
        }
        
        if (this.game.cars.length >= 6) {
            return;
        }
        
        if (!this.assetLoader || !this.assetLoader.hasEnemySprites()) {
            console.warn('⚠️ Nincs betöltött ellenfél sprite, autó spawn kihagyva');
            return;
        }
        
        // ⭐ OPTIMALIZÁLT SPAWN POZÍCIÓK - KÖZELI AUTÓK ELKERÜLÉSE
        const spawnPositions = [
            { z: 1200, offset: -0.6 }, // Közeli bal sáv
            { z: 1500, offset: 0.0 },  // Közeli közép
            { z: 1800, offset: 0.6 },  // Közeli jobb sáv
            { z: 2500, offset: -0.3 }, // Közepes bal
            { z: 3000, offset: 0.3 },  // Közepes jobb
            { z: 4000, offset: 0.0 },  // Távoli közép
            { z: 5000, offset: -0.6 }, // Nagyon távoli bal
            { z: 5500, offset: 0.6 }   // Nagyon távoli jobb
        ];
        
        let safePosition = null;
        for (const pos of spawnPositions) {
            if (this.isPositionSafe(pos.z, pos.offset)) {
                safePosition = pos;
                break;
            }
        }
        
        if (!safePosition) {
            console.log('🚫 Nincs biztonságos spawn pozíció');
            return;
        }
        
        const enemySprite = this.assetLoader.getRandomEnemySprite();
        if (!enemySprite) {
            console.warn('⚠️ Nem sikerült ellenfél sprite betöltése');
            return;
        }
        
        const newCar = {
            z: safePosition.z + Math.random() * 200,
            offset: safePosition.offset + (Math.random() - 0.5) * 0.1,
            sprite: enemySprite,
            speed: 70 + Math.random() * 30,
            width: 60,
            height: 30,
            followsTrack: true
        };
        
        this.game.cars.push(newCar);
        this.game.lastCarSpawn = now;
        this.game.carSpawnDelay = 1500 + Math.random() * 2500;
        
        console.log('✅ Új ellenfél autó spawn-olva, távolság:', Math.round(safePosition.z));
    }
    
    isPositionSafe(z, offset) {
        const minDistance = 700; // ⭐ NAGYOBB MINIMUM TÁVOLSÁG
        const minOffsetDistance = 0.4;
        
        for (const car of this.game.cars) {
            const zDistance = Math.abs(car.z - z);
            const offsetDistance = Math.abs(car.offset - offset);
            
            if (zDistance < minDistance && offsetDistance < minOffsetDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    findSegment(z) {
        const segmentIndex = Math.floor(z / this.game.segmentLength);
        if (segmentIndex >= 0 && segmentIndex < this.game.road.length) {
            return this.game.road[segmentIndex];
        }
        return this.game.road.length > 0 ? this.game.road[0] : null;
    }
    
    handleFinish(audioManager) {
        if (!this.game.finished) {
            this.game.finished = true;
            this.game.finishTime = Date.now() - this.game.raceStartTime;
            
            if (audioManager) {
                audioManager.stopAllSounds();
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
