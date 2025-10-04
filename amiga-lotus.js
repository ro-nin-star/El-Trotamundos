class Lotus90sRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 200; // Valódi 90s felbontás
        this.scale = 4;
        
        // 90s VGA színpaletta (256 szín)
        this.colors = {
            sky: {
                top: '#4A90E2',
                middle: '#87CEEB', 
                bottom: '#B0E0E6'
            },
            road: {
                asphalt: '#2C2C2C',
                lines: '#FFFF00',
                kerb: '#FF0000',
                grass: '#1B7B1B',
                dirt: '#8B4513'
            },
            car: {
                lotus: '#DC143C',
                ferrari: '#8B0000', 
                porsche: '#FFD700',
                lamborghini: '#32CD32'
            },
            environment: {
                mountain: '#6B46C1',
                tree: '#228B22',
                building: '#708090',
                billboard: '#FF4500'
            }
        };
        
        // Játék állapot
        this.gameState = {
            // Játékos
            playerX: 0,
            playerY: 0,
            playerZ: 0,
            speed: 0,
            maxSpeed: 300,
            
            // Kamera és pálya
            cameraX: 0,
            cameraY: 1000,
            cameraZ: 0,
            position: 0,
            curve: 0,
            
            // Pálya paraméterek
            roadWidth: 2000,
            segmentLength: 200,
            rumbleLength: 3,
            trackLength: 0,
            drawDistance: 300,
            
            // Pálya szegmensek
            road: [],
            cars: [],
            sprites: [],
            
            // Játék info
            currentLap: 1,
            totalLaps: 3,
            lapTime: 0,
            bestTime: 0,
            score: 0,
            rank: 1
        };
        
        this.keys = {};
        this.lastTime = 0;
        
        this.init();
    }
    
    async init() {
        console.log('90s Lotus Racing inicializálása...');
        
        this.createCanvas();
        await this.loadAssets();
        this.buildTrack();
        this.createCars();
        this.setupControls();
        
        document.getElementById('loading').style.display = 'none';
        
        this.gameLoop();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        
        // 90s stílusú sharp pixels
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(this.canvas);
        
        console.log('Canvas létrehozva');
    }
    
    async loadAssets() {
        console.log('90s stílusú grafikai elemek létrehozása...');
        
        // Lotus Esprit sprite (nagyobb, részletesebb)
        this.lotusSprite = this.createLotusEspritSprite();
        
        // Ellenfél autók
        this.carSprites = {
            ferrari: this.createFerrariSprite(),
            porsche: this.createPorscheSprite(), 
            lamborghini: this.createLamborghiniSprite()
        };
        
        // Környezeti elemek
        this.environmentSprites = {
            tree: this.createTreeSprite(),
            building: this.createBuildingSprite(),
            billboard: this.createBillboardSprite(),
            mountain: this.createMountainSprite()
        };
        
        console.log('Grafikai elemek betöltve');
    }
    
    createLotusEspritSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Lotus Esprit részletes pixel art
        const lotusPixels = [
            // Hátsó spoiler
            '000000000000000000000000',
            '000000888888888888000000',
            '000008888888888888800000',
            '000088888888888888880000',
            // Hátsó rész
            '000888999999999999888000',
            '008889999999999999988800',
            '088899999999999999998880',
            '888999999999999999999888',
            '888999999999999999999888',
            '888999999999999999999888',
            // Középső rész (motor)
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            // Cockpit
            '888999bbbbbbbbbb999888',
            '888999bbbbbbbbbb999888',
            '888999bbbbbbbbbb999888',
            '888999bbbbbbbbbb999888',
            '888999bbbbbbbbbb999888',
            '888999bbbbbbbbbb999888',
            // Motorháztető
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            '888999aaaaaaaaaa999888',
            // Első rész
            '888999999999999999999888',
            '888999999999999999999888',
            '088899999999999999998880',
            '008889999999999999988800',
            '000888999999999999888000',
            // Első lökhárító
            '000088888888888888880000',
            '000008888888888888800000',
            '000000888888888888000000',
            // Fényszórók
            '000000cccccccccc000000',
            '000000cccccccccc000000',
            '000000cccccccccc000000',
            '000000000000000000000000',
            '000000000000000000000000',
            '000000000000000000000000',
            '000000000000000000000000',
            '000000000000000000000000'
        ];
        
        // Színkódok
        const colorMap = {
            '0': 'transparent',
            '8': '#2F2F2F',      // Fekete karosszéria árnyék
            '9': '#DC143C',      // Piros karosszéria
            'a': '#8B0000',      // Sötétpiros részletek
            'b': '#191970',      // Sötétkék szélvédő
            'c': '#F0F8FF'       // Fehér fényszórók
        };
        
        // Rajzolás
        for (let y = 0; y < lotusPixels.length; y++) {
            for (let x = 0; x < lotusPixels[y].length; x++) {
                const pixel = lotusPixels[y][x];
                if (pixel !== '0') {
                    ctx.fillStyle = colorMap[pixel];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
    
    createFerrariSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Ferrari F40 stílusú autó
        ctx.fillStyle = '#8B0000'; // Sötétpiros
        ctx.fillRect(6, 8, 12, 32);
        
        ctx.fillStyle = '#DC143C'; // Világospiros
        ctx.fillRect(7, 10, 10, 28);
        
        // Szélvédő
        ctx.fillStyle = '#191970';
        ctx.fillRect(8, 18, 8, 12);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 12, 4, 6);
        ctx.fillRect(18, 12, 4, 6);
        ctx.fillRect(2, 30, 4, 6);
        ctx.fillRect(18, 30, 4, 6);
        
        return canvas;
    }
    
    createPorscheSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Porsche 911 stílusú autó
        ctx.fillStyle = '#B8860B'; // Sötétsárga
        ctx.fillRect(6, 8, 12, 32);
        
        ctx.fillStyle = '#FFD700'; // Arany
        ctx.fillRect(7, 10, 10, 28);
        
        // Szélvédő
        ctx.fillStyle = '#191970';
        ctx.fillRect(8, 18, 8, 12);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 12, 4, 6);
        ctx.fillRect(18, 12, 4, 6);
        ctx.fillRect(2, 30, 4, 6);
        ctx.fillRect(18, 30, 4, 6);
        
        return canvas;
    }
    
    createLamborghiniSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Lamborghini stílusú autó
        ctx.fillStyle = '#006400'; // Sötétzöld
        ctx.fillRect(6, 8, 12, 32);
        
        ctx.fillStyle = '#32CD32'; // Világoszöld
        ctx.fillRect(7, 10, 10, 28);
        
        // Szélvédő
        ctx.fillStyle = '#191970';
        ctx.fillRect(8, 18, 8, 12);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 12, 4, 6);
        ctx.fillRect(18, 12, 4, 6);
        ctx.fillRect(2, 30, 4, 6);
        ctx.fillRect(18, 30, 4, 6);
        
        return canvas;
    }
    
    createTreeSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Törzs
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(6, 20, 4, 12);
        
        // Lombkorona (részletesebb)
        ctx.fillStyle = '#006400';
        ctx.fillRect(2, 8, 12, 16);
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(3, 10, 10, 12);
        
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(4, 12, 8, 8);
        
        return canvas;
    }
    
    createBuildingSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Épület test
        ctx.fillStyle = '#708090';
        ctx.fillRect(0, 16, 32, 48);
        
        // Ablakok (90s stílus)
        ctx.fillStyle = '#FFD700';
        for (let y = 20; y < 60; y += 8) {
            for (let x = 4; x < 28; x += 6) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(x, y, 4, 6);
                    // Ablakkeret
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, 4, 6);
                }
            }
        }
        
        // Tető
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(0, 10, 32, 6);
        
        return canvas;
    }
    
    createBillboardSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Billboard háttér
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(0, 0, 48, 24);
        
        // Keret
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 48, 24);
        
        // "LOTUS" szöveg
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.fillText('LOTUS', 8, 12);
        ctx.fillText('RACING', 6, 20);
        
        // Oszlop
        ctx.fillStyle = '#708090';
        ctx.fillRect(22, 24, 4, 8);
        
        return canvas;
    }
    
    createMountainSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Hegy sziluett
        ctx.fillStyle = '#6B46C1';
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(16, 8);
        ctx.lineTo(32, 16);
        ctx.lineTo(48, 4);
        ctx.lineTo(64, 12);
        ctx.lineTo(64, 32);
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }
    
    buildTrack() {
        console.log('90s stílusú pálya építése...');
        
        const road = [];
        
        // Komplex pálya OutRun Europa stílusban
        this.addRoad(road, 300, 0, 0);           // Hosszú egyenes
        this.addRoad(road, 100, 200, 0);         // Emelkedő
        this.addRoad(road, 200, 0, -6);          // Bal kanyar
        this.addRoad(road, 100, 0, 0);           // Egyenes
        this.addRoad(road, 150, -200, 4);        // Jobb kanyar lejtőn
        this.addRoad(road, 200, 0, 8);           // Éles jobb kanyar
        this.addRoad(road, 100, 0, 0);           // Egyenes
        this.addRoad(road, 250, 0, -4);          // Hosszú bal kanyar
        this.addRoad(road, 150, 300, 0);         // Emelkedő egyenes
        this.addRoad(road, 100, 0, -8);          // Éles bal kanyar
        this.addRoad(road, 200, -300, 6);        // Jobb kanyar lejtőn
        this.addRoad(road, 300, 0, 0);           // Célegyenes
        
        this.gameState.road = road;
        this.gameState.trackLength = road.length * this.gameState.segmentLength;
        
        // Környezeti objektumok hozzáadása
        this.addEnvironmentObjects();
        
        console.log('Pálya építve:', road.length, 'szegmens');
    }
    
    addRoad(road, count, hill, curve) {
        const startY = road.length > 0 ? road[road.length - 1].p2.world.y : 0;
        const endY = startY + hill;
        const total = road.length + count;
        
        for (let i = road.length; i < total; i++) {
            const percent = (i - road.length) / count;
            const y = startY + hill * percent;
            
            road.push({
                index: i,
                p1: {
                    world: { x: 0, y: y, z: i * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                p2: {
                    world: { x: 0, y: y, z: (i + 1) * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                curve: curve,
                sprites: [],
                cars: [],
                color: Math.floor(i / this.gameState.rumbleLength) % 2 ? 'dark' : 'light'
            });
        }
    }
    
    addEnvironmentObjects() {
        // Fák, épületek, billboard-ok hozzáadása
        for (let i = 0; i < this.gameState.road.length; i += 20) {
            const segment = this.gameState.road[i];
            
            // Fák
            if (Math.random() > 0.5) {
                segment.sprites.push({
                    sprite: this.environmentSprites.tree,
                    offset: Math.random() > 0.5 ? -2.5 : 2.5,
                    scale: 0.8 + Math.random() * 0.4
                });
            }
            
            // Épületek
            if (Math.random() > 0.8) {
                segment.sprites.push({
                    sprite: this.environmentSprites.building,
                    offset: Math.random() > 0.5 ? -4 : 4,
                    scale: 1 + Math.random() * 0.5
                });
            }
            
            // Billboard-ok
            if (Math.random() > 0.9) {
                segment.sprites.push({
                    sprite: this.environmentSprites.billboard,
                    offset: Math.random() > 0.5 ? -3 : 3,
                    scale: 1
                });
            }
        }
    }
    
    createCars() {
        this.gameState.cars = [
            {
                segment: 50,
                offset: -0.7,
                z: 0,
                sprite: this.carSprites.ferrari,
                speed: 200 + Math.random() * 50
            },
            {
                segment: 100,
                offset: 0.5,
                z: 0,
                sprite: this.carSprites.porsche,
                speed: 180 + Math.random() * 60
            },
            {
                segment: 150,
                offset: 0,
                z: 0,
                sprite: this.carSprites.lamborghini,
                speed: 190 + Math.random() * 55
            }
        ];
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR') {
                this.restart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update(dt) {
        const playerSegment = this.findSegment(this.gameState.position + this.gameState.playerZ);
        const speedPercent = this.gameState.speed / this.gameState.maxSpeed;
        const dx = dt * 2 * speedPercent;
        
        // Pozíció frissítés
        this.gameState.position = this.increase(this.gameState.position, dt * this.gameState.speed, this.gameState.trackLength);
        
        // Irányítás
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.gameState.speed = this.accelerate(this.gameState.speed, 300, dt);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.gameState.speed = this.accelerate(this.gameState.speed, -500, dt);
        } else {
            this.gameState.speed = this.accelerate(this.gameState.speed, -200, dt);
        }
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.playerX -= dx;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.playerX += dx;
        }
        
        // Kanyar hatás
        if (playerSegment) {
            this.gameState.playerX -= (dx * speedPercent * playerSegment.curve * 0.0003);
        }
        
        // Pálya szélén tartás
        if (this.gameState.playerX < -1 || this.gameState.playerX > 1) {
            if (this.gameState.speed > this.gameState.maxSpeed / 4) {
                this.gameState.speed = this.accelerate(this.gameState.speed, -600, dt);
            }
        }
        
        this.gameState.playerX = Math.max(-2, Math.min(2, this.gameState.playerX));
        
        // Autók frissítése
        this.updateCars(dt);
        
        // Idő frissítés
        this.gameState.lapTime += dt;
        this.gameState.score += Math.floor(this.gameState.speed * dt);
    }
    
    updateCars(dt) {
        this.gameState.cars.forEach(car => {
            car.z -= dt * car.speed;
            
            if (car.z < -this.gameState.segmentLength) {
                car.z += this.gameState.segmentLength;
                car.segment = this.increase(car.segment, 1, this.gameState.road.length);
            }
        });
    }
    
    render() {
        // Háttér
        this.renderBackground();
        
        // Pálya
        this.renderRoad();
        
        // HUD
        this.render90sHUD();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // 90s stílusú égbolt gradiens
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * this.scale * 0.6);
        gradient.addColorStop(0, this.colors.sky.top);
        gradient.addColorStop(0.5, this.colors.sky.middle);
        gradient.addColorStop(1, this.colors.sky.bottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale * 0.6);
        
        // Hegyek a távolban
        this.renderMountains();
        
        // Nap/Hold
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width * this.scale * 0.8, this.height * this.scale * 0.25, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Felhők
        this.renderClouds();
    }
    
    renderMountains() {
        const ctx = this.ctx;
        
        // Háttér hegyek
        for (let i = 0; i < 3; i++) {
            const offset = (this.gameState.position * (0.1 + i * 0.05)) % (this.width * this.scale * 2);
            
            ctx.drawImage(
                this.environmentSprites.mountain,
                offset - this.width * this.scale,
                this.height * this.scale * 0.35,
                64,
                32
            );
            
            ctx.drawImage(
                this.environmentSprites.mountain,
                offset,
                this.height * this.scale * 0.35,
                64,
                32
            );
        }
    }
    
    renderClouds() {
        const ctx = this.ctx;
        
        for (let i = 0; i < 4; i++) {
            const x = (i * 100 + this.gameState.position * 0.05) % (this.width * this.scale + 60);
            const y = 30 + i * 15;
            
            // 90s stílusú felhők
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.arc(x + 15, y, 18, 0, Math.PI * 2);
            ctx.arc(x + 30, y, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderRoad() {
        const ctx = this.ctx;
        const baseSegment = this.findSegment(this.gameState.position);
        const basePercent = this.percentRemaining(this.gameState.position, this.gameState.segmentLength);
        const playerSegment = this.findSegment(this.gameState.position + this.gameState.playerZ);
        const playerPercent = this.percentRemaining(this.gameState.position + this.gameState.playerZ, this.gameState.segmentLength);
        const playerY = this.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent);
        
        let maxy = this.height * this.scale;
        let x = 0;
        let dx = -(basePercent * baseSegment.curve);
        
        for (let n = 0; n < this.gameState.drawDistance; n++) {
            const segment = this.gameState.road[(baseSegment.index + n) % this.gameState.road.length];
            
            segment.looped = segment.index < baseSegment.index;
            segment.clip = maxy;
            
            this.project(segment.p1, (this.gameState.playerX * this.gameState.roadWidth) - x, playerY + this.gameState.cameraY, this.gameState.position - (segment.looped ? this.gameState.trackLength : 0));
            this.project(segment.p2, (this.gameState.playerX * this.gameState.roadWidth) - x - dx, playerY + this.gameState.cameraY, this.gameState.position - (segment.looped ? this.gameState.trackLength : 0));
            
            x += dx;
            dx += segment.curve;
            
            if ((segment.p1.camera.z <= 0.84) || (segment.p2.screen.y >= maxy)) {
                continue;
            }
            
            this.renderSegment(ctx, segment);
            
            maxy = segment.p1.screen.y;
        }
        
        // Sprite-ok és autók renderelése
        for (let n = (this.gameState.drawDistance - 1); n > 0; n--) {
            const segment = this.gameState.road[(baseSegment.index + n) % this.gameState.road.length];
            
            // Sprite-ok
            segment.sprites.forEach(sprite => {
                this.renderSprite(ctx, sprite, segment);
            });
            
            // Autók
            this.gameState.cars.forEach(car => {
                if (car.segment === segment.index) {
                    this.renderCar(ctx, car, segment);
                }
            });
        }
        
        // Játékos autó
        this.renderPlayerCar();
    }
    
    renderSegment(ctx, segment) {
        const rumbleWidth = this.gameState.roadWidth / Math.max(6, 2 * 3);
        const laneWidth = this.gameState.roadWidth / Math.max(32, 8 * 3);
        
        const r1 = rumbleWidth * segment.p1.screen.scale;
        const r2 = rumbleWidth * segment.p2.screen.scale;
        const l1 = laneWidth * segment.p1.screen.scale;
        const l2 = laneWidth * segment.p2.screen.scale;
        
        // Fű
        ctx.fillStyle = segment.color === 'dark' ? '#1B7B1B' : '#228B22';
        ctx.fillRect(0, segment.p2.screen.y, this.width * this.scale, segment.p1.screen.y - segment.p2.screen.y);
        
        // Rumble strips
        this.polygon(ctx,
            segment.p1.screen.x - segment.p1.screen.w - r1, segment.p1.screen.y,
            segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x - segment.p2.screen.w - r2, segment.p2.screen.y,
            segment.color === 'dark' ? '#CC0000' : '#FF0000'
        );
        
        this.polygon(ctx,
            segment.p1.screen.x + segment.p1.screen.w + r1, segment.p1.screen.y,
            segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x + segment.p2.screen.w + r2, segment.p2.screen.y,
            segment.color === 'dark' ? '#CC0000' : '#FF0000'
        );
        
        // Út
        this.polygon(ctx,
            segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
            segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
            segment.color === 'dark' ? '#2C2C2C' : '#404040'
        );
        
        // Középső vonal
        if (segment.color === 'light') {
            this.polygon(ctx,
                segment.p1.screen.x - l1, segment.p1.screen.y,
                segment.p1.screen.x + l1, segment.p1.screen.y,
                segment.p2.screen.x + l2, segment.p2.screen.y,
                segment.p2.screen.x - l2, segment.p2.screen.y,
                '#FFFF00'
            );
        }
    }
    
    renderSprite(ctx, sprite, segment) {
        if (segment.p1.camera.z <= 0.84) return;
        
        const spriteScale = segment.p1.screen.scale * sprite.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * this.gameState.roadWidth * this.width * this.scale / 2);
        const spriteY = segment.p1.screen.y;
        
        const destW = sprite.sprite.width * spriteScale * this.width * this.scale / 2;
        const destH = sprite.sprite.height * spriteScale * this.width * this.scale / 2;
        const destX = spriteX - (destW / 2);
        const destY = spriteY - destH;
        
        const clipH = Math.max(0, destY + destH - segment.clip);
        if (clipH < destH) {
            ctx.drawImage(sprite.sprite, destX, destY, destW, destH - clipH);
        }
    }
    
    renderCar(ctx, car, segment) {
        if (segment.p1.camera.z <= 0.84) return;
        
        const spriteScale = segment.p1.screen.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * car.offset * this.gameState.roadWidth * this.width * this.scale / 2);
        const spriteY = segment.p1.screen.y;
        
        const destW = car.sprite.width * spriteScale * this.width * this.scale / 2;
        const destH = car.sprite.height * spriteScale * this.width * this.scale / 2;
        const destX = spriteX - (destW / 2);
        const destY = spriteY - destH;
        
        const clipH = Math.max(0, destY + destH - segment.clip);
        if (clipH < destH) {
            ctx.drawImage(car.sprite, destX, destY, destW, destH - clipH);
        }
    }
    
    renderPlayerCar() {
        const ctx = this.ctx;
        const carW = this.lotusSprite.width * this.scale * 2;
        const carH = this.lotusSprite.height * this.scale * 2;
        const carX = (this.width * this.scale / 2) - (carW / 2);
        const carY = this.height * this.scale - carH - 10;
        
        // Árnyék
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(carX + 5, carY + carH + 2, carW, 8);
        
        // Lotus Esprit
        ctx.drawImage(this.lotusSprite, carX, carY, carW, carH);
    }
    
    render90sHUD() {
        const ctx = this.ctx;
        
        // 90s stílusú HUD háttér
        const gradient = ctx.createLinearGradient(0, 0, 0, 40);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width * this.scale, 40);
        ctx.fillRect(0, this.height * this.scale - 40, this.width * this.scale, 40);
        
        // Sebesség
        ctx.fillStyle = '#00FFFF';
        ctx.font = `${14 * this.scale}px monospace`;
        ctx.fillText(`${Math.floor(this.gameState.speed)} KM/H`, 10, 25);
        
        // Pontszám
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`SCORE: ${this.gameState.score}`, 10, this.height * this.scale - 15);
        
        // Kör
        ctx.fillStyle = '#FF00FF';
        ctx.fillText(`LAP: ${this.gameState.currentLap}/${this.gameState.totalLaps}`, this.width * this.scale - 120, 25);
        
        // Idő
        const minutes = Math.floor(this.gameState.lapTime / 60);
        const seconds = Math.floor(this.gameState.lapTime % 60);
        const time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillStyle = '#00FF00';
        ctx.fillText(time, this.width * this.scale - 80, this.height * this.scale - 15);
        
        // Logo
        ctx.fillStyle = '#FF4500';
        ctx.font = `${18 * this.scale}px monospace`;
        ctx.fillText('LOTUS', this.width * this.scale / 2 - 40, 25);
        
        // Sebességmérő
        this.renderSpeedometer();
        
        // Minimap
        this.renderMinimap();
    }
    
    renderSpeedometer() {
        const ctx = this.ctx;
        const centerX = this.width * this.scale - 80;
        const centerY = 80;
        const radius = 25;
        
        // Háttér
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 2);
        ctx.stroke();
        
        // Skála
        for (let i = 0; i <= 10; i++) {
            const angle = Math.PI + (i / 10) * Math.PI;
            const x1 = centerX + Math.cos(angle) * (radius - 5);
            const y1 = centerY + Math.sin(angle) * (radius - 5);
            const x2 = centerX + Math.cos(angle) * radius;
            const y2 = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Mutató
        const speedPercent = this.gameState.speed / this.gameState.maxSpeed;
        const angle = Math.PI + speedPercent * Math.PI;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * (radius - 8),
            centerY + Math.sin(angle) * (radius - 8)
        );
        ctx.stroke();
    }
    
    renderMinimap() {
        const ctx = this.ctx;
        const mapX = 20;
        const mapY = this.height * this.scale - 80;
        const mapW = 80;
        const mapH = 60;
        
        // Minimap háttér
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX, mapY, mapW, mapH);
        
        // Pálya
        const currentSegment = this.findSegment(this.gameState.position);
        const progress = currentSegment.index / this.gameState.road.length;
        
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(mapX + 2, mapY + mapH - 10, (mapW - 4) * progress, 8);
        
        // Játékos pozíció
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(mapX + (mapW - 4) * progress, mapY + mapH - 12, 4, 12);
    }
    
    // Segédfüggvények
    polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }
    
    project(p, cameraX, cameraY, cameraZ) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        
        p.screen.scale = 0.84 / p.camera.z;
        p.screen.x = Math.round((this.width * this.scale / 2) + (p.screen.scale * p.camera.x * this.width * this.scale / 2));
        p.screen.y = Math.round((this.height * this.scale / 2) - (p.screen.scale * p.camera.y * this.height * this.scale / 2));
        p.screen.w = Math.round((p.screen.scale * this.gameState.roadWidth * this.width * this.scale / 2));
    }
    
    findSegment(z) {
        return this.gameState.road[Math.floor(z / this.gameState.segmentLength) % this.gameState.road.length];
    }
    
    percentRemaining(n, total) {
        return (n % total) / total;
    }
    
    interpolate(a, b, percent) {
        return a + (b - a) * percent;
    }
    
    accelerate(v, accel, dt) {
        return v + (accel * dt);
    }
    
    increase(start, increment, max) {
        let result = start + increment;
        while (result >= max) result -= max;
        while (result < 0) result += max;
        return result;
    }
    
    restart() {
        this.gameState.position = 0;
        this.gameState.speed = 0;
        this.gameState.playerX = 0;
        this.gameState.score = 0;
        this.gameState.lapTime = 0;
        this.gameState.currentLap = 1;
        this.createCars();
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
    console.log('90s Lotus Racing indítása...');
    new Lotus90sRacing();
});
