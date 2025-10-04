class AmigaLotusRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 256;
        this.scale = 3;
        
        // Amiga OCS/ECS színpaletta (32 szín)
        this.palette = {
            sky: ['#87CEEB', '#B0E0E6', '#F0F8FF', '#E6E6FA'],
            road: '#404040',
            roadLine: '#FFFF00',
            grass: '#228B22',
            tree: '#006400',
            trunk: '#8B4513',
            car: {
                red: '#DC143C',
                blue: '#0000CD',
                yellow: '#FFD700',
                green: '#32CD32',
                white: '#F5F5F5',
                black: '#2F2F2F'
            },
            ui: {
                cyan: '#00FFFF',
                magenta: '#FF00FF',
                orange: '#FF8C00',
                lime: '#00FF00'
            }
        };
        
        // Játék állapot
        this.gameState = {
            playerX: 160,
            playerY: 200,
            playerZ: 0,
            speed: 0,
            maxSpeed: 200,
            acceleration: 2,
            deceleration: 3,
            turnSpeed: 0,
            maxTurnSpeed: 0.1,
            cameraHeight: 1000,
            roadWidth: 2000,
            segmentLength: 200,
            drawDistance: 300,
            position: 0,
            curve: 0,
            roadSegments: [],
            cars: [],
            sprites: [],
            score: 0,
            lap: 1,
            totalLaps: 3,
            checkpoints: [],
            currentCheckpoint: 0
        };
        
        // Sprite rendszer
        this.spriteSheets = {};
        this.animations = {};
        
        this.keys = {};
        this.setupControls();
        this.init();
    }
    
    async init() {
        console.log('Amiga Lotus Racing inicializálása...');
        
        this.createCanvas();
        await this.createSpriteSheets();
        this.buildTrack();
        this.createCars();
        this.createSprites();
        
        document.getElementById('loading').style.display = 'none';
        this.startDemo();
        this.gameLoop();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        
        // Amiga stílusú pixelated rendering
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(this.canvas);
        
        console.log('Amiga canvas létrehozva:', this.width + 'x' + this.height);
    }
    
    async createSpriteSheets() {
        console.log('Amiga sprite sheet-ek létrehozása...');
        
        // Lotus Esprit sprite (16x32 pixel)
        this.spriteSheets.lotusEsprit = this.createLotusEspritSprite();
        
        // Ellenfél autók
        this.spriteSheets.ferrariF40 = this.createFerrariF40Sprite();
        this.spriteSheets.porsche911 = this.createPorsche911Sprite();
        this.spriteSheets.lamborghini = this.createLamborghiniSprite();
        
        // Környezeti sprite-ok
        this.spriteSheets.palmTree = this.createPalmTreeSprite();
        this.spriteSheets.building = this.createBuildingSprite();
        this.spriteSheets.billboard = this.createBillboardSprite();
        
        // Effektek
        this.spriteSheets.explosion = this.createExplosionAnimation();
        this.spriteSheets.dust = this.createDustEffect();
        
        console.log('Sprite sheet-ek létrehozva');
    }
    
    createLotusEspritSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Lotus Esprit pixel art (16x32)
        const lotusData = [
            // Hátsó
            '0000066666600000',
            '0000666666660000',
            '0006666666666000',
            '0066666666666600',
            '0666777777776660',
            '6666777777777666',
            '6667777777777766',
            '6677777777777776',
            // Középső rész
            '6677788888877776',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            '6678888888888676',
            // Szélvédő
            '6678844444888676',
            '6678844444888676',
            '6678844444888676',
            '6678888888888676',
            // Első rész
            '6677788888877776',
            '6677777777777776',
            '6667777777777766',
            '6666777777777666',
            '0666777777776660',
            '0066666666666600',
            '0006666666666000',
            '0000666666660000'
        ];
        
        // Színkódok: 0=átlátszó, 6=piros, 7=sötétpiros, 8=fehér, 4=kék
        const colors = {
            '0': 'transparent',
            '4': '#0000CD',
            '6': '#DC143C',
            '7': '#8B0000',
            '8': '#F5F5F5'
        };
        
        for (let y = 0; y < lotusData.length; y++) {
            for (let x = 0; x < lotusData[y].length; x++) {
                const colorCode = lotusData[y][x];
                if (colorCode !== '0') {
                    ctx.fillStyle = colors[colorCode];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createFerrariF40Sprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Ferrari F40 (piros)
        const ferrariData = [
            '0000033333300000',
            '0003333333333000',
            '0033333333333300',
            '0333333333333330',
            '3333444444443333',
            '3334444444444333',
            '3344444444444433',
            '3444444444444443',
            '3444455555544443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445555555555443',
            '3445566666555443',
            '3445566666555443',
            '3445566666555443',
            '3445555555555443',
            '3444455555544443',
            '3444444444444443',
            '3344444444444433',
            '3334444444444333',
            '3333444444443333',
            '0333333333333330',
            '0033333333333300',
            '0003333333333000'
        ];
        
        const colors = {
            '0': 'transparent',
            '3': '#8B0000',
            '4': '#DC143C',
            '5': '#F5F5F5',
            '6': '#0000CD'
        };
        
        for (let y = 0; y < ferrariData.length; y++) {
            for (let x = 0; x < ferrariData[y].length; x++) {
                const colorCode = ferrariData[y][x];
                if (colorCode !== '0') {
                    ctx.fillStyle = colors[colorCode];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createPorsche911Sprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Porsche 911 (sárga)
        const porscheData = [
            '0000077777700000',
            '0007777777777000',
            '0077777777777700',
            '0777777777777770',
            '7777888888887777',
            '7778888888888777',
            '7788888888888877',
            '7888888888888887',
            '7888899999988887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889999999999887',
            '7889944444999887',
            '7889944444999887',
            '7889944444999887',
            '7889999999999887',
            '7888899999988887',
            '7888888888888887',
            '7788888888888877',
            '7778888888888777',
            '7777888888887777',
            '0777777777777770',
            '0077777777777700',
            '0007777777777000'
        ];
        
        const colors = {
            '0': 'transparent',
            '4': '#0000CD',
            '7': '#B8860B',
            '8': '#FFD700',
            '9': '#F5F5F5'
        };
        
        for (let y = 0; y < porscheData.length; y++) {
            for (let x = 0; x < porscheData[y].length; x++) {
                const colorCode = porscheData[y][x];
                if (colorCode !== '0') {
                    ctx.fillStyle = colors[colorCode];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createLamborghiniSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Lamborghini (zöld)
        const lamboData = [
            '0000022222200000',
            '0002222222222000',
            '0022222222222200',
            '0222222222222220',
            '2222333333332222',
            '2223333333333222',
            '2233333333333322',
            '2333333333333332',
            '2333344444433332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334444444444332',
            '2334455555444332',
            '2334455555444332',
            '2334455555444332',
            '2334444444444332',
            '2333344444433332',
            '2333333333333332',
            '2233333333333322',
            '2223333333333222',
            '2222333333332222',
            '0222222222222220',
            '0022222222222200',
            '0002222222222000'
        ];
        
        const colors = {
            '0': 'transparent',
            '2': '#006400',
            '3': '#32CD32',
            '4': '#F5F5F5',
            '5': '#0000CD'
        };
        
        for (let y = 0; y < lamboData.length; y++) {
            for (let x = 0; x < lamboData[y].length; x++) {
                const colorCode = lamboData[y][x];
                if (colorCode !== '0') {
                    ctx.fillStyle = colors[colorCode];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createPalmTreeSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Pálmafa sprite
        const palmData = [
            // Levelek
            '000000222222000000000000',
            '000002222222200000000000',
            '000022222222220000000000',
            '000222222222222000000000',
            '002222222222222200000000',
            '022222222222222220000000',
            '222222222222222222000000',
            '222222222222222222200000',
            '022222222222222222220000',
            '002222222222222222222000',
            '000222222222222222222200',
            '000022222222222222222220',
            '000002222222222222222222',
            '000000222222222222222222',
            '000000022222222222222222',
            '000000002222222222222222',
            '000000000222222222222222',
            '000000000022222222222222',
            '000000000002222222222222',
            '000000000000222222222222',
            // Törzs
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000',
            '000000000000111111000000'
        ];
        
        const colors = {
            '0': 'transparent',
            '1': '#8B4513',
            '2': '#228B22'
        };
        
        for (let y = 0; y < palmData.length; y++) {
            for (let x = 0; x < palmData[y].length; x += 2) {
                const colorCode = palmData[y][x];
                if (colorCode !== '0') {
                    ctx.fillStyle = colors[colorCode];
                    ctx.fillRect(x / 2, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createBuildingSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Egyszerű épület
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 16, 32, 48);
        
        // Ablakok
        ctx.fillStyle = '#FFD700';
        for (let y = 20; y < 60; y += 8) {
            for (let x = 4; x < 28; x += 6) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(x, y, 4, 6);
                }
            }
        }
        
        // Tető
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(0, 10, 32, 6);
        
        return canvas;
    }
    
    createBillboardSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Billboard háttér
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(0, 0, 48, 24);
        
        // Szöveg
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.fillText('LOTUS', 8, 12);
        ctx.fillText('RACING', 6, 20);
        
        // Oszlop
        ctx.fillStyle = '#696969';
        ctx.fillRect(22, 24, 4, 8);
        
        return canvas;
    }
    
    createExplosionAnimation() {
        const frames = [];
        
        for (let frame = 0; frame < 8; frame++) {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            const size = 4 + frame * 3;
            const colors = ['#FFFF00', '#FF8C00', '#FF0000', '#8B0000'];
            
            for (let i = 0; i < 20; i++) {
                const x = 16 + (Math.random() - 0.5) * size;
                const y = 16 + (Math.random() - 0.5) * size;
                const particleSize = 1 + Math.random() * 3;
                
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(x, y, particleSize, particleSize);
            }
            
            frames.push(canvas);
        }
        
        return frames;
    }
    
    createDustEffect() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        // Por effekt
        ctx.fillStyle = '#D2B48C';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 16;
            const y = Math.random() * 8;
            ctx.fillRect(x, y, 1, 1);
        }
        
        return canvas;
    }
    
    buildTrack() {
        console.log('Amiga stílusú pálya építése...');
        
        const segments = [];
        
        // Komplex pálya építése
        this.addStraight(segments, 200);
        this.addCurve(segments, 100, -4);
        this.addStraight(segments, 150);
        this.addCurve(segments, 120, 6);
        this.addStraight(segments, 200);
        this.addCurve(segments, 80, -8);
        this.addStraight(segments, 100);
        this.addCurve(segments, 150, 4);
        this.addStraight(segments, 300);
        this.addCurve(segments, 200, -6);
        this.addStraight(segments, 150);
        
        this.gameState.roadSegments = segments;
        
        // Checkpointok hozzáadása
        this.gameState.checkpoints = [
            segments.length * 0.25,
            segments.length * 0.5,
            segments.length * 0.75,
            segments.length * 0.95
        ];
        
        console.log('Pálya építve:', segments.length, 'szegmens');
    }
    
    addStraight(segments, count) {
        for (let i = 0; i < count; i++) {
            segments.push({
                index: segments.length,
                curve: 0,
                sprites: [],
                cars: []
            });
        }
    }
    
    addCurve(segments, count, curve) {
        for (let i = 0; i < count; i++) {
            segments.push({
                index: segments.length,
                curve: curve,
                sprites: [],
                cars: []
            });
        }
    }
    
    createCars() {
        this.gameState.cars = [
            {
                sprite: 'ferrariF40',
                segment: 50,
                offset: -0.5,
                z: 0,
                speed: 120 + Math.random() * 40
            },
            {
                sprite: 'porsche911',
                segment: 80,
                offset: 0.2,
                z: 0,
                speed: 100 + Math.random() * 50
            },
            {
                sprite: 'lamborghini',
                segment: 120,
                offset: 0.8,
                z: 0,
                speed: 110 + Math.random() * 45
            }
        ];
    }
    
    createSprites() {
        // Pálya melletti objektumok
        for (let i = 0; i < this.gameState.roadSegments.length; i += 20) {
            if (Math.random() > 0.6) {
                this.gameState.roadSegments[i].sprites.push({
                    sprite: 'palmTree',
                    offset: Math.random() > 0.5 ? -2.5 : 2.5
                });
            }
            
            if (Math.random() > 0.8) {
                this.gameState.roadSegments[i].sprites.push({
                    sprite: 'building',
                    offset: Math.random() > 0.5 ? -3.5 : 3.5
                });
            }
            
            if (Math.random() > 0.9) {
                this.gameState.roadSegments[i].sprites.push({
                    sprite: 'billboard',
                    offset: Math.random() > 0.5 ? -2.8 : 2.8
                });
            }
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR') {
                this.restart();
            }
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    startDemo() {
        // Amiga stílusú demo mód
        console.log('Demo mód indítása...');
        this.gameState.speed = 50;
    }
    
    update(dt) {
        // Irányítás
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.gameState.speed = Math.min(this.gameState.maxSpeed, 
                this.gameState.speed + this.gameState.acceleration);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.gameState.speed = Math.max(0, 
                this.gameState.speed - this.gameState.deceleration);
        } else {
            this.gameState.speed = Math.max(0, 
                this.gameState.speed - this.gameState.deceleration * 0.3);
        }
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.turnSpeed = Math.max(-this.gameState.maxTurnSpeed, 
                this.gameState.turnSpeed - 0.01);
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.turnSpeed = Math.min(this.gameState.maxTurnSpeed, 
                this.gameState.turnSpeed + 0.01);
        } else {
            this.gameState.turnSpeed *= 0.9;
        }
        
        // Pozíció frissítés
        this.gameState.position += this.gameState.speed * dt;
        this.gameState.playerX += this.gameState.turnSpeed * this.gameState.speed * dt;
        
        // Pálya határok
        if (this.gameState.playerX < -1000) this.gameState.playerX = -1000;
        if (this.gameState.playerX > 1000) this.gameState.playerX = 1000;
        
        // Autók frissítése
        this.updateCars(dt);
        
        // Pontszám
        this.gameState.score += Math.floor(this.gameState.speed * dt);
    }
    
    updateCars(dt) {
        this.gameState.cars.forEach(car => {
            car.z -= dt * car.speed;
            
            if (car.z < -this.gameState.segmentLength) {
                car.z += this.gameState.segmentLength;
                car.segment = (car.segment + 1) % this.gameState.roadSegments.length;
            }
        });
    }
    
    render() {
        // Háttér
        this.renderBackground();
        
        // Pálya
        this.renderRoad();
        
        // HUD
        this.renderAmigaHUD();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // Amiga stílusú égbolt gradiens
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * this.scale * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#B0E0E6');
        gradient.addColorStop(0.6, '#F0F8FF');
        gradient.addColorStop(1, '#E6E6FA');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale * 0.6);
        
        // Hegyek
        this.renderMountains();
        
        // Nap
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width * this.scale * 0.8, this.height * this.scale * 0.2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Felhők
        this.renderClouds();
    }
    
    renderMountains() {
        const ctx = this.ctx;
        
        // Háttér hegyek
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.moveTo(0, this.height * this.scale * 0.6);
        
        for (let x = 0; x <= this.width * this.scale; x += 20) {
            const y = this.height * this.scale * 0.6 - 60 + Math.sin(x * 0.01) * 20;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width * this.scale, this.height * this.scale * 0.6);
        ctx.fill();
        
        // Előtér hegyek
        ctx.fillStyle = '#8A2BE2';
        ctx.beginPath();
        ctx.moveTo(0, this.height * this.scale * 0.6);
        
        for (let x = 0; x <= this.width * this.scale; x += 15) {
            const y = this.height * this.scale * 0.6 - 40 + Math.sin(x * 0.015) * 15;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width * this.scale, this.height * this.scale * 0.6);
        ctx.fill();
    }
    
    renderClouds() {
        const ctx = this.ctx;
        
        for (let i = 0; i < 5; i++) {
            const x = (i * 80 + this.gameState.position * 0.1) % (this.width * this.scale);
            const y = 40 + i * 20;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.arc(x + 20, y, 20, 0, Math.PI * 2);
            ctx.arc(x + 40, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderRoad() {
        const ctx = this.ctx;
        const baseSegment = this.findSegment(this.gameState.position);
        
        // Egyszerűsített pseudo-3D út renderelés
        const roadY = this.height * this.scale * 0.6;
        const roadHeight = this.height * this.scale * 0.4;
        
        // Út háttér
        ctx.fillStyle = this.palette.road;
        ctx.fillRect(0, roadY, this.width * this.scale, roadHeight);
        
        // Fű
        ctx.fillStyle = this.palette.grass;
        ctx.fillRect(0, roadY, this.width * this.scale * 0.3, roadHeight);
        ctx.fillRect(this.width * this.scale * 0.7, roadY, this.width * this.scale * 0.3, roadHeight);
        
        // Út vonalak
        this.renderRoadLines();
        
        // Sprite-ok renderelése
        this.renderSprites();
        
        // Játékos autó
        this.renderPlayerCar();
    }
    
    renderRoadLines() {
        const ctx = this.ctx;
        const roadY = this.height * this.scale * 0.6;
        const lineOffset = (this.gameState.position * 2) % 40;
        
        // Középső vonal
        ctx.fillStyle = this.palette.roadLine;
        for (let y = roadY - lineOffset; y < this.height * this.scale; y += 40) {
            ctx.fillRect((this.width * this.scale / 2) - 2, y, 4, 20);
        }
        
        // Szélső vonalak
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.width * this.scale * 0.3, roadY, 2, this.height * this.scale * 0.4);
        ctx.fillRect(this.width * this.scale * 0.7, roadY, 2, this.height * this.scale * 0.4);
    }
    
    renderSprites() {
        // Környezeti objektumok renderelése
        const baseSegment = this.findSegment(this.gameState.position);
        
        for (let i = 0; i < 50; i++) {
            const segment = this.gameState.roadSegments[(baseSegment.index + i) % this.gameState.roadSegments.length];
            
            segment.sprites.forEach(sprite => {
                const scale = 1 - (i / 100);
                const x = this.width * this.scale / 2 + sprite.offset * 50 * scale;
                const y = this.height * this.scale * 0.6 + i * 2;
                
                if (scale > 0.1 && this.spriteSheets[sprite.sprite]) {
                    this.drawScaledSprite(this.spriteSheets[sprite.sprite], x, y, scale);
                }
            });
        }
        
        // Ellenfél autók
        this.gameState.cars.forEach(car => {
            const distance = this.calculateCarDistance(car);
            if (distance > 0 && distance < 200) {
                const scale = 1 - (distance / 300);
                const x = this.width * this.scale / 2 + car.offset * 100 * scale;
                const y = this.height * this.scale * 0.8 - distance;
                
                if (scale > 0.2) {
                    this.drawScaledSprite(this.spriteSheets[car.sprite], x, y, scale);
                }
            }
        });
    }
    
    renderPlayerCar() {
        const x = this.width * this.scale / 2;
        const y = this.height * this.scale - 50;
        
        this.drawScaledSprite(this.spriteSheets.lotusEsprit, x, y, 2);
        
        // Kormányozás effekt
        if (Math.abs(this.gameState.turnSpeed) > 0.02) {
            const tilt = this.gameState.turnSpeed * 100;
            this.drawTiltedSprite(this.spriteSheets.lotusEsprit, x, y, 2, tilt);
        }
    }
    
    drawScaledSprite(sprite, x, y, scale) {
        if (!sprite) return;
        
        const width = sprite.width * scale * this.scale;
        const height = sprite.height * scale * this.scale;
        
        this.ctx.drawImage(
            sprite,
            x - width / 2,
            y - height / 2,
            width,
            height
        );
    }
    
    drawTiltedSprite(sprite, x, y, scale, tilt) {
        if (!sprite) return;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(tilt * Math.PI / 180);
        
        const width = sprite.width * scale * this.scale;
        const height = sprite.height * scale * this.scale;
        
        this.ctx.drawImage(
            sprite,
            -width / 2,
            -height / 2,
            width,
            height
        );
        
        this.ctx.restore();
    }
    
    renderAmigaHUD() {
        const ctx = this.ctx;
        
        // Amiga stílusú HUD háttér
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width * this.scale, 40);
        ctx.fillRect(0, this.height * this.scale - 40, this.width * this.scale, 40);
        
        // Sebesség
        ctx.fillStyle = this.palette.ui.cyan;
        ctx.font = `${12 * this.scale}px monospace`;
        ctx.fillText(`SPEED: ${Math.floor(this.gameState.speed)} KM/H`, 10, 25);
        
        // Pontszám
        ctx.fillStyle = this.palette.ui.lime;
        ctx.fillText(`SCORE: ${this.gameState.score}`, 10, this.height * this.scale - 15);
        
        // Kör
        ctx.fillStyle = this.palette.ui.magenta;
        ctx.fillText(`LAP: ${this.gameState.lap}/${this.gameState.totalLaps}`, this.width * this.scale - 120, 25);
        
        // Sebességmérő
        this.renderSpeedometer();
        
        // Logo
        ctx.fillStyle = this.palette.ui.orange;
        ctx.font = `${16 * this.scale}px monospace`;
        ctx.fillText('LOTUS', this.width * this.scale / 2 - 40, 25);
    }
    
    renderSpeedometer() {
        const ctx = this.ctx;
        const centerX = this.width * this.scale - 80;
        const centerY = this.height * this.scale - 80;
        const radius = 30;
        
        // Háttér
        ctx.strokeStyle = this.palette.ui.cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Mutató
        const angle = (this.gameState.speed / this.gameState.maxSpeed) * Math.PI * 1.5 - Math.PI * 0.75;
        ctx.strokeStyle = this.palette.ui.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * radius * 0.8,
            centerY + Math.sin(angle) * radius * 0.8
        );
        ctx.stroke();
    }
    
    // Segédfüggvények
    findSegment(position) {
        const segmentIndex = Math.floor(position / this.gameState.segmentLength) % this.gameState.roadSegments.length;
        return this.gameState.roadSegments[segmentIndex];
    }
    
    calculateCarDistance(car) {
        return Math.abs(car.segment - this.findSegment(this.gameState.position).index) * 10;
    }
    
    restart() {
        this.gameState.position = 0;
        this.gameState.speed = 0;
        this.gameState.playerX = 160;
        this.gameState.score = 0;
        this.gameState.lap = 1;
        this.createCars();
    }
    
    gameLoop() {
        const now = Date.now();
        const dt = Math.min(1, (now - (this.lastTime || now)) / 1000);
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Játék indítása
window.addEventListener('load', () => {
    console.log('Amiga Lotus Racing indítása...');
    new AmigaLotusRacing();
});
