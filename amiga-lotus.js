class OutRunRacing {
constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 800;
    this.height = 600;
    this.scale = 2;  
    
    // Asset-ek
    this.assets = {
        player: null,
        enemies: [],
        environment: []
    };
    
    // ⭐ HANG RENDSZER
    this.sounds = {
        engine: null,
        nitro: null,
        collision: null,
        gearShift: null,
        finish: null,
        offroad: null,
        muted: false
    };
    
    // ⭐ HÁTTÉRZENE ÁLLAPOT (FRISSÍTETT)
    this.backgroundMusic = {
        bassInterval: null,
        melodyInterval: null,
        drumInterval: null,
        padInterval: null,
        arpInterval: null,
        isPlaying: false
    };
    
    // ⭐ INTRO/LOADING ÁLLAPOT
    this.gameState = {
        current: 'LOADING',
        loadingProgress: 0,
        introAccepted: false
    };
    
    // ⭐ TISZTÍTOTT JÁTÉK ÁLLAPOT
    this.game = {
        // Játékos
        playerX: 0,
        speed: 0,
        maxSpeed: 350,
        nitroMode: false,        
        nitroAmount: 100,        
        finished: false,           
        finishTime: 0,            
        raceStartTime: 0,         
        
        // ⭐ REÁLISABB SEBESSÉGVÁLTÓ RENDSZER (9000 RPM)
        currentGear: 1,
        previousGear: 1,
        actualRPM: 800,
        targetRPM: 800,
        
        // Rezgés effekt
        shake: {
            x: 0,
            y: 0,
            intensity: 0,
            duration: 0
        },
        
        // Kamera/pozíció
        position: 0,
        cameraX: 0,
        cameraY: 1200,
        cameraZ: 0,
        
        // Pálya
        roadWidth: 2000,
        segmentLength: 200,
        drawDistance: 400,
        trackLength: 0,          
        
        // Pálya szegmensek
        road: [],
        cars: [],
        
        // ⭐ AUTÓ GENERÁLÁS
        lastCarSpawn: 0,         
        carSpawnDelay: 5000      
    };
    
    this.keys = {};
    this.lastTime = 0;
    
    this.init();
}

async init() {
    console.log('OutRun racing inicializálása...');
    
    this.createCanvas();
    this.gameLoop();
    
    await this.simulateLoading();
    await this.loadAssets();
    this.initSounds();
    this.buildTrack();
    this.setupControls();
    this.createMuteButton();
    
    this.gameState.current = 'INTRO';
    
    console.log('✅ Játék betöltve, intro megjelenítése...');
}

// ⭐ HIÁNYZÓ FÜGGVÉNYEK HOZZÁADÁSA
createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;
    this.canvas.style.imageRendering = 'pixelated';
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    
    document.body.appendChild(this.canvas);
}

async loadAssets() {
    console.log('Asset-ek betöltése...');
    
    try {
        this.assets.player = await this.loadImage('assets/player-car.png');
        console.log('✅ Játékos autó sikeresen betöltve!');
        
        this.assets.enemies = [
            await this.loadImage('assets/enemy-car1.png'),
            await this.loadImage('assets/enemy-car2.png'),
        ];
        console.log('✅ Ellenfél autók betöltve!');
        
    } catch (error) {
        console.log('❌ Asset betöltési hiba:', error.message);
        console.log('🔄 Fallback placeholder használata...');
        
        if (!this.assets.player) {
            this.assets.player = this.createPlayerCarSprite();
        }
        
        if (this.assets.enemies.length === 0) {
            console.log('⚠️ Nincs ellenfél autó kép, placeholder használata');
            this.assets.enemies = [
                this.createEnemyCarSprite('#0000FF'),
                this.createEnemyCarSprite('#00FF00'),
                this.createEnemyCarSprite('#FF00FF')
            ];
        }
    }
    
    console.log('Végső asset állapot:', {
        player: this.assets.player ? 'Betöltve' : 'Hiányzik',
        enemies: this.assets.enemies.length + ' db'
    });
}

async loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed: ${src}`));
        img.src = src;
    });
}

createPlayerCarSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(8, 2, 24, 16);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(10, 4, 20, 6);
    
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(6, 6, 4, 8);
    ctx.fillRect(30, 6, 4, 8);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(4, 2, 6, 4);
    ctx.fillRect(30, 2, 6, 4);
    ctx.fillRect(4, 14, 6, 4);
    ctx.fillRect(30, 14, 6, 4);
    
    return canvas;
}

createEnemyCarSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.fillRect(8, 2, 24, 16);
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(10, 4, 20, 6);
    
    if (color === '#FF00FF') {
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
    } else {
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
    }
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(4, 2, 6, 4);
    ctx.fillRect(30, 2, 6, 4);
    ctx.fillRect(4, 14, 6, 4);
    ctx.fillRect(30, 14, 6, 4);
    
    return canvas;
}

buildTrack() {
    this.game.road = [];
    
    this.addRoad(200, 0, 0);
    this.addRoad(100, 0, -6);
    this.addRoad(100, 0, 0);
    this.addRoad(100, 0, 6);
    this.addRoad(100, 300, 0);
    this.addRoad(100, 0, -4);
    this.addRoad(200, 0, 0);
    this.addRoad(50, 0, 0);
    
    this.game.trackLength = this.game.road.length * this.game.segmentLength;
    console.log('Pálya hossza:', this.game.trackLength);
    
    this.createInitialCars();
}

addRoad(count, hill, curve) {
    const startY = this.game.road.length > 0 ? 
        this.game.road[this.game.road.length - 1].p2.world.y : 0;
    
    for (let i = 0; i < count; i++) {
        const percent = i / count;
        const y = startY + hill * percent;
        
        this.game.road.push({
            index: this.game.road.length,
            p1: {
                world: { x: 0, y: y, z: this.game.road.length * this.game.segmentLength },
                camera: {},
                screen: {}
            },
            p2: {
                world: { x: 0, y: y, z: (this.game.road.length + 1) * this.game.segmentLength },
                camera: {},
                screen: {}
            },
            curve: curve,
            color: Math.floor(this.game.road.length / 3) % 2 ? 'dark' : 'light',
            isFinish: false
        });
    }
}

createInitialCars() {
    const enemySprites = this.assets.enemies.length > 0 ? this.assets.enemies : [
        this.createEnemyCarSprite('#FF0000'),
        this.createEnemyCarSprite('#0000FF')
    ];
    
    this.game.cars = [
        {
            z: 800,
            offset: -0.3,
            sprite: enemySprites[0],
            speed: 70,
            width: 60,
            height: 30,
            followsTrack: true
        }
    ];
}

spawnNewCar() {
    const now = Date.now();
    
    if (now - this.game.lastCarSpawn < this.game.carSpawnDelay) {
        return;
    }
    
    if (this.game.cars.length >= 1) {
        return;
    }
    
    const enemySprites = this.assets.enemies.length > 0 ? this.assets.enemies : [
        this.createEnemyCarSprite('#FF0000')
    ];
    
    const newCar = {
        z: 1200 + Math.random() * 800,
        offset: (Math.random() - 0.5) * 0.8,
        sprite: enemySprites[Math.floor(Math.random() * enemySprites.length)],
        speed: 60 + Math.random() * 30,
        width: 60,
        height: 30,
        followsTrack: true
    };
    
    this.game.cars.push(newCar);
    this.game.lastCarSpawn = now;
    
    console.log(`Új autó: sebesség=${newCar.speed.toFixed(0)}, távolság=${newCar.z.toFixed(0)}`);
}

// ⭐ REÁLISABB SEBESSÉGVÁLTÓ LOGIKA (9000 RPM)
updateGearAndRPM(speedKmh, dt) {
    let newGear = 1;
    
    // Fokozat meghatározása sebesség alapján
    if (speedKmh > 30) newGear = 2;
    if (speedKmh > 60) newGear = 3;
    if (speedKmh > 100) newGear = 4;
    if (speedKmh > 150) newGear = 5;
    if (speedKmh > 200) newGear = 6;
    
    // Fokozatváltás detektálása
    if (newGear !== this.game.currentGear) {
        this.game.previousGear = this.game.currentGear;
        this.game.currentGear = newGear;
        
        // ⭐ REÁLISABB RPM VÁLTÁS
        if (newGear > this.game.previousGear) {
            // Felváltás - RPM csökken
            this.game.targetRPM = this.game.actualRPM * 0.6; // 40%-kal csökken
        } else {
            // Leváltás - RPM nő
            this.game.targetRPM = Math.min(8500, this.game.actualRPM * 1.4); // 40%-kal nő, max 8500
        }
        
        // Fokozatváltás hang
        this.playSound('gearShift');
        
        console.log(`Fokozatváltás: ${this.game.previousGear} -> ${this.game.currentGear}, RPM: ${this.game.actualRPM.toFixed(0)} -> ${this.game.targetRPM.toFixed(0)}`);
    }
    
    // ⭐ RPM SZÁMÍTÁSA SEBESSÉG ALAPJÁN (9000 RPM-hez igazítva)
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
    
    // Cél RPM a sebesség alapján
    const calculatedRPM = currentRange.rpmMin + (speedPercent * (currentRange.rpmMax - currentRange.rpmMin));
    
    // ⭐ LÁGY RPM ÁTMENET (fokozatváltás után)
    const rpmDiff = calculatedRPM - this.game.actualRPM;
    this.game.actualRPM += rpmDiff * dt * 8; // Lágy átmenet
    
    // RPM korlátok (9000 RPM)
    this.game.actualRPM = Math.max(600, Math.min(9000, this.game.actualRPM));
}

update(dt) {
    // ⭐ CSAK PLAYING ÁLLAPOTBAN FRISSÍTJÜK A JÁTÉKOT
    if (this.gameState.current !== 'PLAYING') {
        return;
    }
    
    const acceleration = 60;
    const deceleration = 800;
    const brakeForce = 150;
    const friction = 40;
    
    if (this.game.finished && this.keys['KeyR']) {
        this.restartRace();
        return;
    }
    
    if (this.game.finished) {
        return;
    }

    // NITRO MÓD
    if (this.keys['Space'] && this.game.nitroAmount > 0) {
        this.game.nitroMode = true;
        this.game.maxSpeed = 450;
        this.game.nitroAmount -= dt * 20;
        this.game.nitroAmount = Math.max(0, this.game.nitroAmount);
    } else {
        this.game.nitroMode = false;
        this.game.maxSpeed = 300;
        if (this.game.nitroAmount < 100) {
            this.game.nitroAmount += dt * 5;
            this.game.nitroAmount = Math.min(100, this.game.nitroAmount);
        }
    }
    
    // Gyorsítás/lassítás/fékezés
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
        this.game.speed = Math.min(this.game.maxSpeed, this.game.speed + acceleration * dt);
    } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
        this.game.speed = Math.max(0, this.game.speed - brakeForce * dt);
    } else {
        this.game.speed = Math.max(0, this.game.speed - friction * dt);
    }
    
    // ⭐ REÁLISABB SEBESSÉGVÁLTÓ ÉS RPM FRISSÍTÉSE
    const speedKmh = Math.floor((this.game.speed / this.game.maxSpeed) * 300);
    this.updateGearAndRPM(speedKmh, dt);
    
    // Kormányzás
    const speedPercent = this.game.speed / this.game.maxSpeed;
    const steeringSensitivity = 3.0 + (speedPercent * 2.0);
    const maxSteer = 2.0;
    
    const steerInput = dt * steeringSensitivity;
    
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
        this.game.playerX -= steerInput;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
        this.game.playerX += steerInput;
    }
    
    // Pozíció frissítés
    this.game.position += this.game.speed * dt * 50;
    
    // FINISH ELLENŐRZÉS
    if (this.game.position >= this.game.trackLength - 1000) {
        this.handleFinish();
    }
    
    // Kanyar hatás
    const playerSegment = this.findSegment(this.game.position);
    if (playerSegment && this.game.speed > 50) {
        const curveForce = playerSegment.curve * speedPercent * 0.005;
        this.game.playerX -= curveForce;
        
        if (Math.abs(playerSegment.curve) > 3) {
            this.game.speed *= (1 - speedPercent * 0.01);
        }
    }
    
    // Fű ellenőrzés
    const isOffRoad = Math.abs(this.game.playerX) > 0.8;
    
    if (isOffRoad && this.game.speed > 30) {
        const shakeIntensity = Math.min(10, this.game.speed / 20);
        this.startShake(shakeIntensity, 0.1);
        this.game.speed *= 0.92;
        
        // ⭐ OFFROAD HANG (periodikusan)
        if (Math.random() < 0.1) {
            this.playSound('collision', 100, 0.05, 0.1);
        }
    }
    
    // Játékos pozíció korlátozása
    this.game.playerX = Math.max(-maxSteer, Math.min(maxSteer, this.game.playerX));
    
    if (Math.abs(this.game.playerX) > 1.2) {
        this.game.speed *= 0.98;
    }
    
    this.updateShake(dt);
    this.updateCars(dt);
    this.spawnNewCar();
    
    // ⭐ MOTOR HANG FRISSÍTÉSE
    this.updateEngineSound();
}

// ⭐ HÁTTÉRZENE INDÍTÁSA
startBackgroundMusic() {
    if (this.gameState.current === 'PLAYING' && !this.backgroundMusic.isPlaying) {
        console.log('🎵 Háttérzene indítása...');
        this.createAdvancedBackgroundMusic();
        this.backgroundMusic.isPlaying = true;
    }
}

// ⭐ MELODIC TECHNO HÁTTÉRZENE GENERÁTOR
createAdvancedBackgroundMusic() {
    if (this.sounds.muted || !this.audioContext) return;
    
    console.log('🎵 Melodic Techno háttérzene generálása...');
    
    // Techno basszus
    this.createTechnoBass();
    
    // Melodic lead szintetizátor
    this.createMelodicLead();
    
    // Techno ritmus
    this.createTechnoBeats();
    
    // Ambient pad
    this.createAmbientPad();
    
    // Arpeggiator
    this.createArpeggiator();
}

// ⭐ TECHNO BASSZUS
createTechnoBass() {
    const bassPattern = [
        { note: 41.20, duration: 0.25 },  // E1
        { note: 0, duration: 0.25 },      // Rest
        { note: 41.20, duration: 0.15 },  // E1
        { note: 46.25, duration: 0.35 },  // F#1
        { note: 0, duration: 0.25 },      // Rest
        { note: 36.71, duration: 0.25 },  // D1
        { note: 41.20, duration: 0.5 }    // E1
    ];
    
    let patternIndex = 0;
    
    const playTechnoBass = () => {
        if (this.sounds.muted || !this.audioContext || this.gameState.current !== 'PLAYING') {
            return;
        }
        
        const currentNote = bassPattern[patternIndex % bassPattern.length];
        
        if (currentNote.note > 0) {
            // Fő basszus oszcillátor
            const bassOsc = this.audioContext.createOscillator();
            const bassGain = this.audioContext.createGain();
            
            // Sub basszus
            const subOsc = this.audioContext.createOscillator();
            const subGain = this.audioContext.createGain();
            
            // Filter (Web Audio API biquad filter)
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200 + Math.random() * 100, this.audioContext.currentTime);
            filter.Q.setValueAtTime(15, this.audioContext.currentTime);
            
            // Beállítások
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(currentNote.note, this.audioContext.currentTime);
            
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(currentNote.note / 2, this.audioContext.currentTime);
            
            // ⭐ HANGOSABB BASSZUS
            bassGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + currentNote.duration);
            
            subGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + currentNote.duration);
            
            // Kapcsolások
            bassOsc.connect(filter);
            filter.connect(bassGain);
            bassGain.connect(this.audioContext.destination);
            
            subOsc.connect(subGain);
            subGain.connect(this.audioContext.destination);
            
            bassOsc.start();
            subOsc.start();
            bassOsc.stop(this.audioContext.currentTime + currentNote.duration);
            subOsc.stop(this.audioContext.currentTime + currentNote.duration);
        }
        
        patternIndex++;
    };
    
    playTechnoBass();
    this.backgroundMusic.bassInterval = setInterval(playTechnoBass, 200);
}

// ⭐ MELODIC LEAD SZINTETIZÁTOR
createMelodicLead() {
    // Melodic techno progresszió
    const melody = [
        { note: 659.25, duration: 0.8 },   // E5
        { note: 783.99, duration: 0.4 },   // G5
        { note: 880.00, duration: 0.6 },   // A5
        { note: 987.77, duration: 0.4 },   // B5
        { note: 880.00, duration: 0.8 },   // A5
        { note: 783.99, duration: 0.6 },   // G5
        { note: 659.25, duration: 1.0 },   // E5
        { note: 587.33, duration: 0.8 }    // D5
    ];
    
    let melodyIndex = 0;
    
    const playMelodicLead = () => {
        if (this.sounds.muted || !this.audioContext || this.gameState.current !== 'PLAYING') {
            return;
        }
        
        const currentNote = melody[melodyIndex % melody.length];
        
        // Lead oszcillátor
        const leadOsc = this.audioContext.createOscillator();
        const leadGain = this.audioContext.createGain();
        
        // Detune oszcillátor (vastagabb hang)
        const detuneOsc = this.audioContext.createOscillator();
        const detuneGain = this.audioContext.createGain();
        
        // Filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000 + Math.sin(Date.now() / 1000) * 500, this.audioContext.currentTime);
        filter.Q.setValueAtTime(8, this.audioContext.currentTime);
        
        // Beállítások
        leadOsc.type = 'sawtooth';
        leadOsc.frequency.setValueAtTime(currentNote.note, this.audioContext.currentTime);
        
        detuneOsc.type = 'sawtooth';
        detuneOsc.frequency.setValueAtTime(currentNote.note * 1.007, this.audioContext.currentTime);
        
        // ⭐ HANGOSABB LEAD
        leadGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        leadGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
        leadGain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + currentNote.duration * 0.7);
        leadGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + currentNote.duration);
        
        detuneGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        detuneGain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.1);
        detuneGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + currentNote.duration);
        
        // Kapcsolások
        leadOsc.connect(filter);
        detuneOsc.connect(filter);
        filter.connect(leadGain);
        filter.connect(detuneGain);
        leadGain.connect(this.audioContext.destination);
        detuneGain.connect(this.audioContext.destination);
        
        leadOsc.start();
        detuneOsc.start();
        leadOsc.stop(this.audioContext.currentTime + currentNote.duration);
        detuneOsc.stop(this.audioContext.currentTime + currentNote.duration);
        
        melodyIndex++;
    };
    
    setTimeout(() => {
        playMelodicLead();
        this.backgroundMusic.melodyInterval = setInterval(playMelodicLead, 600);
    }, 300);
}

// ⭐ TECHNO RITMUS
createTechnoBeats() {
    let beatIndex = 0;
    
    const playTechnoBeats = () => {
        if (this.sounds.muted || !this.audioContext || this.gameState.current !== 'PLAYING') {
            return;
        }
        
        const now = this.audioContext.currentTime;
        
        // Kick drum minden ütemben
        if (beatIndex % 4 === 0) {
            const kickOsc = this.audioContext.createOscillator();
            const kickGain = this.audioContext.createGain();
            
            kickOsc.type = 'sine';
            kickOsc.frequency.setValueAtTime(60, now);
            kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            
            kickGain.gain.setValueAtTime(0.12, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            
            kickOsc.connect(kickGain);
            kickGain.connect(this.audioContext.destination);
            
            kickOsc.start(now);
            kickOsc.stop(now + 0.2);
        }
        
        // Hi-hat minden 2. ütemben
        if (beatIndex % 2 === 1) {
            const hihatOsc = this.audioContext.createOscillator();
            const hihatGain = this.audioContext.createGain();
            
            hihatOsc.type = 'square';
            hihatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, now);
            
            hihatGain.gain.setValueAtTime(0.03, now);
            hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            hihatOsc.connect(hihatGain);
            hihatGain.connect(this.audioContext.destination);
            
            hihatOsc.start(now);
            hihatOsc.stop(now + 0.08);
        }
        
        // Open hi-hat minden 8. ütemben
        if (beatIndex % 8 === 6) {
            const openHihatOsc = this.audioContext.createOscillator();
            const openHihatGain = this.audioContext.createGain();
            
            openHihatOsc.type = 'square';
            openHihatOsc.frequency.setValueAtTime(12000, now);
            
            openHihatGain.gain.setValueAtTime(0.04, now);
            openHihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            openHihatOsc.connect(openHihatGain);
            openHihatGain.connect(this.audioContext.destination);
            
            openHihatOsc.start(now);
            openHihatOsc.stop(now + 0.3);
        }
        
        beatIndex++;
    };
    
    this.backgroundMusic.drumInterval = setInterval(playTechnoBeats, 150);
}

// ⭐ AMBIENT PAD
createAmbientPad() {
    const padChords = [
        [329.63, 415.30, 523.25], // E major
        [293.66, 369.99, 440.00], // D major  
        [261.63, 329.63, 392.00], // C major
        [246.94, 311.13, 369.99]  // B minor
    ];
    
    let chordIndex = 0;
    
    const playAmbientPad = () => {
        if (this.sounds.muted || !this.audioContext || this.gameState.current !== 'PLAYING') {
            return;
        }
        
        const chord = padChords[chordIndex % padChords.length];
        const now = this.audioContext.currentTime;
        
        chord.forEach((freq, i) => {
            const padOsc = this.audioContext.createOscillator();
            const padGain = this.audioContext.createGain();
            
            // Filter
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800 + Math.sin(Date.now() / 2000 + i) * 200, now);
            filter.Q.setValueAtTime(2, now);
            
            padOsc.type = 'sawtooth';
            padOsc.frequency.setValueAtTime(freq, now);
            
            padGain.gain.setValueAtTime(0, now);
            padGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
            padGain.gain.linearRampToValueAtTime(0.03, now + 3.5);
            padGain.gain.linearRampToValueAtTime(0, now + 4.0);
            
            padOsc.connect(filter);
            filter.connect(padGain);
            padGain.connect(this.audioContext.destination);
            
            padOsc.start(now);
            padOsc.stop(now + 4.0);
        });
        
        chordIndex++;
    };
    
    setTimeout(() => {
        playAmbientPad();
        this.backgroundMusic.padInterval = setInterval(playAmbientPad, 4000);
    }, 1000);
}

// ⭐ ARPEGGIATOR
createArpeggiator() {
    const arpPattern = [
        659.25, 783.99, 987.77, 1174.66, // E5, G5, B5, D6
        987.77, 783.99, 659.25, 523.25   // B5, G5, E5, C5
    ];
    
    let arpIndex = 0;
    
    const playArpeggiator = () => {
        if (this.sounds.muted || !this.audioContext || this.gameState.current !== 'PLAYING') {
            return;
        }
        
        const freq = arpPattern[arpIndex % arpPattern.length];
        const now = this.audioContext.currentTime;
        
        const arpOsc = this.audioContext.createOscillator();
        const arpGain = this.audioContext.createGain();
        
        // Filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2, now);
        filter.Q.setValueAtTime(10, now);
        
        arpOsc.type = 'square';
        arpOsc.frequency.setValueAtTime(freq, now);
        
        arpGain.gain.setValueAtTime(0.05, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        arpOsc.connect(filter);
        filter.connect(arpGain);
        arpGain.connect(this.audioContext.destination);
        
        arpOsc.start(now);
        arpOsc.stop(now + 0.2);
        
        arpIndex++;
    };
    
    setTimeout(() => {
        this.backgroundMusic.arpInterval = setInterval(playArpeggiator, 125);
    }, 2000);
}

// ⭐ HÁTTÉRZENE LEÁLLÍTÁSA (FRISSÍTETT)
stopBackgroundMusic() {
    if (this.backgroundMusic.bassInterval) {
        clearInterval(this.backgroundMusic.bassInterval);
        this.backgroundMusic.bassInterval = null;
    }
    if (this.backgroundMusic.melodyInterval) {
        clearInterval(this.backgroundMusic.melodyInterval);
        this.backgroundMusic.melodyInterval = null;
    }
    if (this.backgroundMusic.drumInterval) {
        clearInterval(this.backgroundMusic.drumInterval);
        this.backgroundMusic.drumInterval = null;
    }
    if (this.backgroundMusic.padInterval) {
        clearInterval(this.backgroundMusic.padInterval);
        this.backgroundMusic.padInterval = null;
    }
    if (this.backgroundMusic.arpInterval) {
        clearInterval(this.backgroundMusic.arpInterval);
        this.backgroundMusic.arpInterval = null;
    }
    this.backgroundMusic.isPlaying = false;
    console.log('🎵 Melodic Techno háttérzene leállítva');
}

// ⭐ LOADING SZIMULÁCIÓ
async simulateLoading() {
    return new Promise((resolve) => {
        const loadingSteps = [
            'Initializing Racing Engine...',
            'Loading Lotus Sprites...',
            'Generating Track Data...',
            'Setting up Audio System...',
            'Calibrating Speedometer...',
            'Ready to Race!'
        ];
        
        let currentStep = 0;
        const loadingInterval = setInterval(() => {
            this.gameState.loadingProgress = (currentStep / loadingSteps.length) * 100;
            this.gameState.loadingText = loadingSteps[currentStep];
            
            currentStep++;
            
            if (currentStep >= loadingSteps.length) {
                clearInterval(loadingInterval);
                this.gameState.loadingProgress = 100;
                setTimeout(resolve, 500);
            }
        }, 800);
    });
}

// ⭐ MUTE GOMB LÉTREHOZÁSA
createMuteButton() {
    const muteButton = document.createElement('button');
    muteButton.innerHTML = '🔊 SOUND ON';
    muteButton.style.position = 'absolute';
    muteButton.style.top = '10px';
    muteButton.style.right = '10px';
    muteButton.style.padding = '10px 15px';
    muteButton.style.backgroundColor = '#333';
    muteButton.style.color = 'white';
    muteButton.style.border = '2px solid #00FFFF';
    muteButton.style.borderRadius = '5px';
    muteButton.style.cursor = 'pointer';
    muteButton.style.fontFamily = 'Arial, sans-serif';
    muteButton.style.fontSize = '14px';
    muteButton.style.zIndex = '1000';
    
    muteButton.addEventListener('click', () => {
        this.sounds.muted = !this.sounds.muted;
        muteButton.innerHTML = this.sounds.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
        muteButton.style.borderColor = this.sounds.muted ? '#FF4444' : '#00FFFF';
        
        if (this.sounds.muted) {
            this.stopEngineSound();
            this.stopBackgroundMusic();
        } else {
            this.createEngineSound();
            if (this.gameState.current === 'PLAYING') {
                this.startBackgroundMusic();
            }
        }
        
        console.log('🔊 Hang:', this.sounds.muted ? 'KIKAPCSOLVA' : 'BEKAPCSOLVA');
    });
    
    document.body.appendChild(muteButton);
}

// ⭐ HANG RENDSZER INICIALIZÁLÁSA
initSounds() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.createEngineSound();
    console.log('🔊 Hang rendszer inicializálva');
}

// ⭐ MÉLYEBB MOTOR HANG GENERÁLÁSA
createEngineSound() {
    if (this.sounds.muted || !this.audioContext) return;
    
    this.stopEngineSound();
    
    this.engineOscillators = [];
    this.engineGain = this.audioContext.createGain();
    
    const baseOsc = this.audioContext.createOscillator();
    baseOsc.type = 'sawtooth';
    baseOsc.frequency.setValueAtTime(50, this.audioContext.currentTime);
    
    const harmOsc = this.audioContext.createOscillator();
    harmOsc.type = 'square';
    harmOsc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    
    const noiseOsc = this.audioContext.createOscillator();
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(25, this.audioContext.currentTime);
    
    const baseGain = this.audioContext.createGain();
    const harmGain = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();
    
    baseGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    harmGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    noiseGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    
    baseOsc.connect(baseGain);
    harmOsc.connect(harmGain);
    noiseOsc.connect(noiseGain);
    
    baseGain.connect(this.engineGain);
    harmGain.connect(this.engineGain);
    noiseGain.connect(this.engineGain);
    
    this.engineGain.connect(this.audioContext.destination);
    
    baseOsc.start();
    harmOsc.start();
    noiseOsc.start();
    
    this.engineOscillators = [
        { osc: baseOsc, gain: baseGain, type: 'base' },
        { osc: harmOsc, gain: harmGain, type: 'harmonic' },
        { osc: noiseOsc, gain: noiseGain, type: 'noise' }
    ];
}

stopEngineSound() {
    if (this.engineOscillators) {
        this.engineOscillators.forEach(oscData => {
            try {
                oscData.osc.stop();
            } catch (e) {}
        });
        this.engineOscillators = null;
    }
}

playSound(type, frequency = 440, duration = 0.1, volume = 0.3) {
    if (!this.audioContext || this.sounds.muted) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    
    switch(type) {
        case 'collision':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            gainNode.gain.setValueAtTime(volume * 0.8, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
            break;
            
        case 'gearShift':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.setValueAtTime(250, now + 0.03);
            oscillator.frequency.setValueAtTime(180, now + 0.06);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            oscillator.start(now);
            oscillator.stop(now + 0.12);
            break;
            
        case 'nitro':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(80, now);
            oscillator.frequency.linearRampToValueAtTime(120, now + duration);
            gainNode.gain.setValueAtTime(volume * 0.6, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            oscillator.start(now);
            oscillator.stop(now + duration);
            break;
            
        case 'finish':
            const notes = [262, 330, 392, 523];
            notes.forEach((note, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note, now + i * 0.25);
                gain.gain.setValueAtTime(0.25, now + i * 0.25);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.4);
                
                osc.start(now + i * 0.25);
                osc.stop(now + i * 0.25 + 0.4);
            });
            break;
    }
}

updateEngineSound() {
    if (!this.engineOscillators || !this.engineGain || this.sounds.muted) return;
    
    const speedPercent = this.game.speed / this.game.maxSpeed;
    const rpm = this.game.actualRPM;
    
    const baseFreq = 30 + (rpm / 9000) * 80;
    const harmFreq = 60 + (rpm / 9000) * 160;
    const noiseFreq = 15 + (rpm / 9000) * 40;
    
    const volume = 0.08 + (speedPercent * 0.12);
    
    this.engineOscillators.forEach(oscData => {
        const now = this.audioContext.currentTime;
        
        switch(oscData.type) {
            case 'base':
                oscData.osc.frequency.setValueAtTime(baseFreq, now);
                oscData.gain.gain.setValueAtTime(volume * 1.5, now);
                break;
            case 'harmonic':
                oscData.osc.frequency.setValueAtTime(harmFreq, now);
                oscData.gain.gain.setValueAtTime(volume * 0.8, now);
                break;
            case 'noise':
                oscData.osc.frequency.setValueAtTime(noiseFreq, now);
                oscData.gain.gain.setValueAtTime(volume * 0.6, now);
                break;
        }
    });
    
    if (this.game.nitroMode && Math.random() < 0.3) {
        this.playSound('nitro', 0, 0.08, 0.08);
    }
}

setupControls() {
    document.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        
        // ⭐ INTRO ELFOGADÁSA + HÁTTÉRZENE INDÍTÁSA
        if (this.gameState.current === 'INTRO' && (e.code === 'Enter' || e.code === 'Space')) {
            this.gameState.current = 'PLAYING';
            this.game.raceStartTime = Date.now();
            
            // ⭐ HÁTTÉRZENE INDÍTÁSA
            this.startBackgroundMusic();
            
            console.log('🏁 Verseny kezdése!');
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (e.code === 'KeyM') {
            this.sounds.muted = !this.sounds.muted;
            const muteButton = document.querySelector('button');
            if (muteButton) {
                muteButton.innerHTML = this.sounds.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
                muteButton.style.borderColor = this.sounds.muted ? '#FF4444' : '#00FFFF';
            }
            
            if (this.sounds.muted) {
                this.stopEngineSound();
                this.stopBackgroundMusic();
            } else {
                this.createEngineSound();
                if (this.gameState.current === 'PLAYING') {
                    this.startBackgroundMusic();
                }
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
    });
}

// ⭐ VERSENY ÚJRAKEZDÉSE (HÁTTÉRZENE ÚJRAINDÍTÁSSAL)
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
    this.game.previousGear = 1;
    this.game.actualRPM = 800;
    this.game.targetRPM = 800;
    
    this.createInitialCars();
    
    // ⭐ HÁTTÉRZENE ÚJRAINDÍTÁSA
    this.stopBackgroundMusic();
    this.startBackgroundMusic();
    
    console.log('🔄 Race restarted!');
}

// ⭐ FINISH KEZELÉSE (HÁTTÉRZENE LEÁLLÍTÁSSAL)
handleFinish() {
    if (!this.game.finished) {
        this.game.finished = true;
        this.game.finishTime = Date.now() - this.game.raceStartTime;
        
        // ⭐ HÁTTÉRZENE LEÁLLÍTÁSA
        this.stopBackgroundMusic();
        
        this.playSound('finish');
        
        console.log('🏁 FINISH!');
    }
}

startShake(intensity, duration) {
    this.game.shake.intensity = intensity;
    this.game.shake.duration = duration;
}

updateShake(dt) {
    if (this.game.shake.duration > 0) {
        this.game.shake.duration -= dt;
        
        this.game.shake.x = (Math.random() - 0.5) * this.game.shake.intensity;
        this.game.shake.y = (Math.random() - 0.5) * this.game.shake.intensity;
        
        this.game.shake.intensity *= 0.95;
    } else {
        this.game.shake.x = 0;
        this.game.shake.y = 0;
        this.game.shake.intensity = 0;
    }
}

checkCarCollision(car, carIndex) {
    if (Math.abs(car.z) < 150) {
        const playerWorldX = this.game.playerX;
        const carWorldX = car.offset;
        
        const xDistance = Math.abs(playerWorldX - carWorldX);
        const zDistance = Math.abs(car.z);
        
        if (xDistance < 0.5 && zDistance < 80) {
            this.handleCollision(car);
        }
    }
}

checkCarToCarCollision(car, carIndex) {
    this.game.cars.forEach((otherCar, otherIndex) => {
        if (carIndex !== otherIndex) {
            const xDistance = Math.abs(car.offset - otherCar.offset);
            const zDistance = Math.abs(car.z - otherCar.z);
            
            if (xDistance < 0.4 && zDistance < 80) {
                if (car.z > otherCar.z) {
                    car.z += 20;
                } else {
                    car.z -= 20;
                }
                
                if (car.offset > otherCar.offset) {
                    car.offset += 0.1;
                    otherCar.offset -= 0.1;
                } else {
                    car.offset -= 0.1;
                    otherCar.offset += 0.1;
                }
                
                car.offset = Math.max(-1.0, Math.min(1.0, car.offset));
                otherCar.offset = Math.max(-1.0, Math.min(1.0, otherCar.offset));
            }
        }
    });
}

handleCollision(car) {
    console.log('ÜTKÖZÉS!');
    
    // ⭐ ÜTKÖZÉS HANG
    this.playSound('collision');
    
    this.startShake(20, 0.5);
    this.game.speed *= 0.3;
    
    if (car.offset > this.game.playerX) {
        this.game.playerX -= 0.2;
        car.offset += 0.5;
    } else {
        this.game.playerX += 0.2;
        car.offset -= 0.5;
    }
    
    car.speed *= 0.6;
    car.z += 150;
}

updateCars(dt) {
    this.game.cars.forEach((car, index) => {
        const carForwardMovement = car.speed * dt * 3;
        const playerEffect = this.game.speed * dt * 3;
        
        car.z += carForwardMovement - playerEffect;
        
        if (car.followsTrack) {
            const carPosition = this.game.position + car.z;
            const carSegment = this.findSegment(carPosition);
            
            if (carSegment && Math.abs(carSegment.curve) > 0) {
                const curveEffect = carSegment.curve * 0.0003;
                car.offset -= curveEffect;
                car.offset = Math.max(-0.8, Math.min(0.8, car.offset));
            }
        }
        
        if (car.z > 3500 || car.z < -1500) {
            this.game.cars.splice(index, 1);
            console.log('Autó eltávolítva, maradék:', this.game.cars.length);
            return;
        }
        
        this.checkCarCollision(car, index);
        this.checkCarToCarCollision(car, index);
    });
}

findSegment(z) {
    const segmentIndex = Math.floor(z / this.game.segmentLength);
    if (segmentIndex >= 0 && segmentIndex < this.game.road.length) {
        return this.game.road[segmentIndex];
    }
    return this.game.road[0];
}

render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // ⭐ ÁLLAPOT ALAPÚ RENDERELÉS
    switch(this.gameState.current) {
        case 'LOADING':
            this.renderLoadingScreen();
            break;
        case 'INTRO':
            this.renderIntroScreen();
            break;
        case 'PLAYING':
            this.renderGame();
            break;
    }
}

// ⭐ LOADING KÉPERNYŐ RENDERELÉSE
renderLoadingScreen() {
    // Retro háttér
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(0.5, '#000066');
    gradient.addColorStop(1, '#000099');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pixeles keret
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);
    
    // Belső keret
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(60, 60, this.canvas.width - 120, this.canvas.height - 120);
    
    // RACING LOTUS felirat
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 72px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('RACSING', this.canvas.width / 2, 200);
    this.ctx.fillText('RACSING', this.canvas.width / 2, 200);
    
    this.ctx.fillStyle = '#FF4444';
    this.ctx.font = 'bold 72px monospace';
    this.ctx.strokeText('TECHDEMO', this.canvas.width / 2, 300);
    this.ctx.fillText('TECHDEMO', this.canvas.width / 2, 300);
    
    // Loading szöveg
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px monospace';
    this.ctx.fillText(this.gameState.loadingText || 'Loading...', this.canvas.width / 2, 400);
    
    // Progress bar
    const barWidth = 400;
    const barHeight = 30;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 450;
    
    // Progress bar háttér
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
    
    // Progress bar keret
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Progress fill
    const progressWidth = (this.gameState.loadingProgress / 100) * barWidth;
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(barX, barY, progressWidth, barHeight);
    
    // Progress százalék
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '18px monospace';
    this.ctx.fillText(`${Math.round(this.gameState.loadingProgress)}%`, this.canvas.width / 2, barY + 20);
    
    this.ctx.textAlign = 'left';
}

// ⭐ INTRO KÉPERNYŐ RENDERELÉSE
renderIntroScreen() {
    // Retro háttér
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#003344');
    gradient.addColorStop(1, '#005566');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Animált háttér vonalak
    const time = Date.now() / 1000;
    for (let i = 0; i < 10; i++) {
        const y = (i * 60 + time * 50) % this.canvas.height;
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i * 0.03})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
    }
    
    // Fő keret
    const boxWidth = 700;
    const boxHeight = 500;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = (this.canvas.height - boxHeight) / 2;
    
    // Intro box háttér
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Intro box keret
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Belső dekoráció
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxX + 20, boxY + 20, boxWidth - 40, boxHeight - 40);
    
    // Cím
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText('RACING LOTUS', this.canvas.width / 2, boxY + 80);
    this.ctx.fillText('RACING LOTUS', this.canvas.width / 2, boxY + 80);
    
    // Irányítás
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText('CONTROLS:', this.canvas.width / 2, boxY + 140);
    
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'left';
    
    const controlsX = boxX + 80;
    let controlsY = boxY + 180;
    
    const controls = [
        '↑ / W     - ACCELERATE',
        '↓ / S     - BRAKE',
        '← / A     - STEER LEFT', 
        '→ / D     - STEER RIGHT',
        'SPACE     - NITRO BOOST',
        'M         - MUTE/UNMUTE',
        'R         - RESTART (after finish)'
    ];
    
    controls.forEach(control => {
        // Pixeles háttér minden sorhoz
        this.ctx.fillStyle = 'rgba(0, 100, 100, 0.3)';
        this.ctx.fillRect(controlsX - 10, controlsY - 20, 540, 25);
        
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillText(control, controlsX, controlsY);
        controlsY += 35;
    });
    
    // Start gomb
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = 'bold 32px monospace';
    
    // Villogó effekt
    if (Math.floor(Date.now() / 500) % 2) {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('PRESS ENTER OR SPACE TO START', this.canvas.width / 2, boxY + 440);
        this.ctx.fillText('PRESS ENTER OR SPACE TO START', this.canvas.width / 2, boxY + 440);
    }
    
    this.ctx.textAlign = 'left';
}

// ⭐ JÁTÉK RENDERELÉSE
renderGame() {
    this.ctx.save();
    this.ctx.translate(this.game.shake.x, this.game.shake.y);
    
    this.renderSky();
    this.renderRoad();
    this.renderPlayerCar();
    
    this.ctx.restore();
    
    this.renderHUD();
    
    if (this.game.finished) {
        this.renderFinishLayer();
    }
}

renderFinishLayer() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const boxWidth = 600;
    const boxHeight = 400;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = (this.canvas.height - boxHeight) / 2;
    
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxX + 20, boxY + 20, boxWidth - 40, boxHeight - 40);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText('🏁 RACE COMPLETE! 🏁', this.canvas.width / 2, boxY + 80);
    this.ctx.fillText('🏁 RACE COMPLETE! 🏁', this.canvas.width / 2, boxY + 80);
    
    const finishTimeSeconds = (this.game.finishTime / 1000).toFixed(2);
    const avgSpeed = Math.floor((this.game.trackLength / 1000) / (this.game.finishTime / 1000 / 3600));
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px Arial';
    
    this.ctx.strokeText(`Time: ${finishTimeSeconds}s`, this.canvas.width / 2, boxY + 140);
    this.ctx.fillText(`Time: ${finishTimeSeconds}s`, this.canvas.width / 2, boxY + 140);
    
    this.ctx.strokeText(`Avg Speed: ${avgSpeed} KM/H`, this.canvas.width / 2, boxY + 180);
    this.ctx.fillText(`Avg Speed: ${avgSpeed} KM/H`, this.canvas.width / 2, boxY + 180);
    
    this.ctx.strokeText(`Distance: ${(this.game.trackLength / 1000).toFixed(1)} KM`, this.canvas.width / 2, boxY + 220);
    this.ctx.fillText(`Distance: ${(this.game.trackLength / 1000).toFixed(1)} KM`, this.canvas.width / 2, boxY + 220);
    
    let rating = 'GOOD JOB!';
    let ratingColor = '#00FF00';
    
    if (finishTimeSeconds < 60) {
        rating = 'EXCELLENT!';
        ratingColor = '#FFD700';
    } else if (finishTimeSeconds < 90) {
        rating = 'GREAT!';
        ratingColor = '#00FFFF';
    } else if (finishTimeSeconds > 150) {
        rating = 'TRY HARDER!';
        ratingColor = '#FF4444';
    }
    
    this.ctx.fillStyle = ratingColor;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.strokeText(rating, this.canvas.width / 2, boxY + 280);
    this.ctx.fillText(rating, this.canvas.width / 2, boxY + 280);
    
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = '18px Arial';
    this.ctx.strokeText('Press R to restart', this.canvas.width / 2, boxY + 340);
    this.ctx.fillText('Press R to restart', this.canvas.width / 2, boxY + 340);
    
    if (Math.floor(Date.now() / 500) % 2) {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }
    
    this.ctx.textAlign = 'left';
}

renderSky() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
}

renderCarAtPosition(car) {
    const carWorldZ = this.game.position + car.z;
    const carWorldX = car.offset * this.game.roadWidth;
    const carWorldY = 0;
    
    const cameraX = carWorldX - (this.game.playerX * this.game.roadWidth);
    const cameraY = carWorldY - this.game.cameraY;
    const cameraZ = carWorldZ - this.game.position;
    
    if (cameraZ <= 0.1) return;
    
    const scale = 0.84 / cameraZ;
    const screenX = (this.canvas.width / 2) + (scale * cameraX * this.canvas.width / 2);
    const screenY = (this.canvas.height / 2) - (scale * cameraY * this.canvas.height / 2);
    
    const distance = Math.abs(car.z);
    const baseScale = 8.0;
    
    const destW = car.sprite.width * scale * this.canvas.width * baseScale / 6;
    const destH = car.sprite.height * scale * this.canvas.width * baseScale / 6;
    
    const finalW = Math.max(40, Math.min(200, destW));
    const finalH = Math.max(24, Math.min(120, destH));
    
    const destX = screenX - (finalW / 2);
    const destY = screenY - finalH;
    
    this.ctx.drawImage(car.sprite, destX, destY, finalW, finalH);
}

renderRoad() {
    const baseSegment = this.findSegment(this.game.position);
    const basePercent = (this.game.position % this.game.segmentLength) / this.game.segmentLength;
    const playerY = 0;
    
    let maxy = this.canvas.height;
    let x = 0;
    let dx = -(basePercent * baseSegment.curve);
    
    for (let n = 0; n < this.game.drawDistance; n++) {
        const segmentIndex = (baseSegment.index + n) % this.game.road.length;
        const segment = this.game.road[segmentIndex];
        
        if (!segment) continue;
        
        this.project(segment.p1, 
            (this.game.playerX * this.game.roadWidth) - x, 
            playerY + this.game.cameraY, 
            this.game.position);
        this.project(segment.p2, 
            (this.game.playerX * this.game.roadWidth) - x - dx, 
            playerY + this.game.cameraY, 
            this.game.position);
        
        x += dx;
        dx += segment.curve;
        
        if ((segment.p1.camera.z <= 0.84) || (segment.p2.screen.y >= maxy)) {
            continue;
        }
        
        this.renderSegment(segment);
        maxy = segment.p1.screen.y;
    }
    
    this.renderFinishLine();
    
    this.game.cars.forEach(car => {
        if (car.z > -800 && car.z < 3000) {
            this.renderCarAtPosition(car);
        }
    });
}

renderFinishLine() {
    const finishPosition = this.game.trackLength - 500;
    const distanceToFinish = finishPosition - this.game.position;
    
    if (distanceToFinish > 0 && distanceToFinish < 2000) {
        const finishSegment = this.findSegment(finishPosition);
        
        if (finishSegment) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, finishSegment.p1.screen.y - 10, this.canvas.width, 20);
            
            for (let i = 0; i < this.canvas.width; i += 40) {
                this.ctx.fillStyle = i % 80 === 0 ? '#FFFFFF' : '#000000';
                this.ctx.fillRect(i, finishSegment.p1.screen.y - 10, 40, 20);
            }
        }
    }
}

project(p, cameraX, cameraY, cameraZ) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    
    p.screen.scale = 0.84 / p.camera.z;
    p.screen.x = Math.round((this.canvas.width / 2) + (p.screen.scale * p.camera.x * this.canvas.width / 2));
    p.screen.y = Math.round((this.canvas.height / 2) - (p.screen.scale * p.camera.y * this.canvas.height / 2));
    p.screen.w = Math.round(p.screen.scale * this.game.roadWidth * this.canvas.width / 2);
}

renderSegment(segment) {
    const rumbleWidth = this.game.roadWidth / 8;
    const laneWidth = this.game.roadWidth / 20;
    
    const r1 = rumbleWidth * segment.p1.screen.scale;
    const r2 = rumbleWidth * segment.p2.screen.scale;
    const l1 = laneWidth * segment.p1.screen.scale;
    const l2 = laneWidth * segment.p2.screen.scale;
    
    this.ctx.fillStyle = segment.color === 'dark' ? '#228B22' : '#32CD32';
    this.ctx.fillRect(0, segment.p2.screen.y, this.canvas.width, segment.p1.screen.y - segment.p2.screen.y);
    
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
    
    this.polygon(
        segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
        segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
        segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
        segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
        segment.color === 'dark' ? '#666666' : '#999999'
    );
    
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

renderPlayerCar() {
    if (!this.assets.player) return;
    
    const carScale = 2.5;
    const carW = this.assets.player.width * carScale;
    const carH = this.assets.player.height * carScale;
    
    const carX = (this.canvas.width / 2) - (carW / 2);
    const carY = this.canvas.height - carH - 20;
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    
    this.ctx.translate(carX + carW / 2, carY + carH / 2);
    this.ctx.rotate(this.game.playerX * 0.1);
    
    this.ctx.drawImage(this.assets.player, -carW / 2, -carH / 2, carW, carH);
    
    this.ctx.restore();
}

renderHUD() {
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    
    const speedKmh = Math.floor((this.game.speed / this.game.maxSpeed) * 300);
    
    this.ctx.strokeText(`${speedKmh} KM/H`, 20, 40);
    this.ctx.fillText(`${speedKmh} KM/H`, 20, 40);
    
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 50;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    
    const speedPercent = this.game.speed / this.game.maxSpeed;
    this.ctx.fillStyle = speedPercent > 0.8 ? '#FF4444' : 
                       speedPercent > 0.6 ? '#FFAA00' : '#44FF44';
    this.ctx.fillRect(barX, barY, barWidth * speedPercent, barHeight);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.strokeText('NITRO', 20, 90);
    this.ctx.fillText('NITRO', 20, 90);
    
    const nitroBarY = 95;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX - 2, nitroBarY - 2, barWidth + 4, barHeight + 4);
    
    const nitroPercent = this.game.nitroAmount / 100;
    this.ctx.fillStyle = nitroPercent > 0.5 ? '#00FFFF' : 
                        nitroPercent > 0.2 ? '#FFFF00' : '#FF4444';
    this.ctx.fillRect(barX, nitroBarY, barWidth * nitroPercent, barHeight);
    
    const distanceToFinish = Math.max(0, (this.game.trackLength - this.game.position) / 1000);
    this.ctx.fillStyle = 'white';
    this.ctx.strokeText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, 20, 130);
    this.ctx.fillText(`CÉL: ${distanceToFinish.toFixed(1)} KM`, 20, 130);
    
    if (this.game.nitroMode) {
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.strokeText(`NITRO!`, this.canvas.width - 350, 60);
        this.ctx.fillText(`NITRO!`, this.canvas.width - 350, 60);
    }
    
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.strokeText(`${this.game.currentGear}. GEAR`, this.canvas.width - 350, 40);
    this.ctx.fillText(`${this.game.currentGear}. GEAR`, this.canvas.width - 350, 40);
    
    // ⭐ ANALOG MŰSZERFAL
    this.renderAnalogDashboard(speedKmh, this.game.currentGear);
    
    // ⭐ MUTE JELZÉS
    if (this.sounds.muted) {
        this.ctx.fillStyle = '#FF4444';
        this.ctx.font = '14px Arial';
        this.ctx.strokeText('SOUND OFF (M)', 20, 160);
        this.ctx.fillText('SOUND OFF (M)', 20, 160);
    }
    
    let nearestCar = null;
    let minDistance = Infinity;
    
    this.game.cars.forEach(car => {
        if (Math.abs(car.z) < 200) {
            const distance = Math.sqrt(
                Math.pow((this.game.playerX - car.offset) * 100, 2) + 
                Math.pow(car.z, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestCar = car;
            }
        }
    });
    
    if (nearestCar && minDistance < 100) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.strokeText('FIGYELEM!', this.canvas.width / 2 - 60, 100);
        this.ctx.fillText('FIGYELEM!', this.canvas.width / 2 - 60, 100);
    }
}

// ⭐ JAVÍTOTT ANALOG MŰSZERFAL 9000 RPM-MEL
renderAnalogDashboard(speedKmh, gear) {
    const centerX = this.canvas.width - 180;
    const centerY = 120;
    const radius = 80;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 150, centerY - 100, 300, 180, 15);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // SEBESSÉGMÉRŐ
    const speedCenterX = centerX - 70;
    const speedCenterY = centerY;
    
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(speedCenterX, speedCenterY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    for (let i = 0; i <= 300; i += 20) {
        const angle = (i / 300) * Math.PI * 1.5 + Math.PI * 0.75;
        const x1 = speedCenterX + Math.cos(angle) * (radius - 15);
        const y1 = speedCenterY + Math.sin(angle) * (radius - 15);
        const x2 = speedCenterX + Math.cos(angle) * (radius - (i % 60 === 0 ? 25 : 20));
        const y2 = speedCenterY + Math.sin(angle) * (radius - (i % 60 === 0 ? 25 : 20));
        
        this.ctx.strokeStyle = i > 240 ? '#FF4444' : '#FFFFFF';
        this.ctx.lineWidth = i % 60 === 0 ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        if (i % 60 === 0) {
            const textX = speedCenterX + Math.cos(angle) * (radius - 35);
            const textY = speedCenterY + Math.sin(angle) * (radius - 35);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(i.toString(), textX, textY + 4);
        }
    }
    
    const speedAngle = (speedKmh / 300) * Math.PI * 1.5 + Math.PI * 0.75;
    const speedNeedleX = speedCenterX + Math.cos(speedAngle) * (radius - 20);
    const speedNeedleY = speedCenterY + Math.sin(speedAngle) * (radius - 20);
    
    this.ctx.strokeStyle = speedKmh > 240 ? '#FF4444' : '#00FFFF';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(speedCenterX, speedCenterY);
    this.ctx.lineTo(speedNeedleX, speedNeedleY);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333333';
    this.ctx.beginPath();
    this.ctx.arc(speedCenterX, speedCenterY, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // ⭐ 9000 RPM FORDULATSZÁMMÉRŐ
    const rpmCenterX = centerX + 70;
    const rpmCenterY = centerY;
    
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(rpmCenterX, rpmCenterY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    // ⭐ 9000 RPM SKÁLA
    for (let i = 0; i <= 9000; i += 500) {
        const angle = (i / 9000) * Math.PI * 1.5 + Math.PI * 0.75;
        const x1 = rpmCenterX + Math.cos(angle) * (radius - 15);
        const y1 = rpmCenterY + Math.sin(angle) * (radius - 15);
        const x2 = rpmCenterX + Math.cos(angle) * (radius - (i % 1000 === 0 ? 25 : 20));
        const y2 = rpmCenterY + Math.sin(angle) * (radius - (i % 1000 === 0 ? 25 : 20));
        
        this.ctx.strokeStyle = i > 7000 ? '#FF4444' : '#FFFFFF';
        this.ctx.lineWidth = i % 1000 === 0 ? 3 : 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        if (i % 1000 === 0) {
            const textX = rpmCenterX + Math.cos(angle) * (radius - 35);
            const textY = rpmCenterY + Math.sin(angle) * (radius - 35);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((i / 1000).toString(), textX, textY + 3);
        }
    }
    
    // ⭐ 9000 RPM ALAPÚ MUTATÓ
    const rpmAngle = (this.game.actualRPM / 9000) * Math.PI * 1.5 + Math.PI * 0.75;
    const rpmNeedleX = rpmCenterX + Math.cos(rpmAngle) * (radius - 20);
    const rpmNeedleY = rpmCenterY + Math.sin(rpmAngle) * (radius - 20);
    
    this.ctx.strokeStyle = this.game.actualRPM > 7000 ? '#FF4444' : '#00FFFF';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(rpmCenterX, rpmCenterY);
    this.ctx.lineTo(rpmNeedleX, rpmNeedleY);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333333';
    this.ctx.beginPath();
    this.ctx.arc(rpmCenterX, rpmCenterY, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // DIGITÁLIS KIJELZŐ
    const digitalX = centerX;
    const digitalY = centerY + 40;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(digitalX - 60, digitalY - 15, 120, 30);
    
    this.ctx.strokeStyle = '#00FFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(digitalX - 60, digitalY - 15, 120, 30);
    
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${speedKmh} KM/H`, digitalX, digitalY + 5);
    
    this.ctx.fillStyle = gear >= 5 ? '#FF4444' : '#FFFFFF';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`${gear}`, centerX, centerY - 10);
    
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = '10px Arial';
    this.ctx.fillText('GEAR', centerX, centerY + 5);
    
    // ⭐ RPM DIGITÁLIS KIJELZŐ
    this.ctx.fillStyle = '#FFAA00';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.fillText(`${Math.round(this.game.actualRPM)} RPM`, centerX, digitalY - 30);
    
    if (this.game.nitroMode) {
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('NITRO', centerX, digitalY + 25);
        
        if (Math.floor(Date.now() / 200) % 2) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(centerX - 80, digitalY - 25, 160, 50);
        }
    }
    
    this.ctx.textAlign = 'left';
}

gameLoop() {
    const now = Date.now();
    const dt = Math.min(1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    
    this.update(dt);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
}
}

// Játék indítása
window.addEventListener('load', () => {
    new OutRunRacing();
});
