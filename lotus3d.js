class RetroLotusOutRun {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 240;
        this.scale = 3; // Pixel scaling
        
        // Játék állapot
        this.gameState = {
            speed: 0,
            maxSpeed: 300,
            acceleration: 0.2,
            deceleration: 0.1,
            position: 0,
            curve: 0,
            playerX: 0,
            playerY: 0,
            cameraHeight: 1000,
            roadWidth: 2000,
            segmentLength: 200,
            rumbleLength: 3,
            trackLength: 0,
            fieldOfView: 100,
            cameraDepth: 0.84,
            drawDistance: 300,
            fogDensity: 5,
            resolution: null,
            roadSegments: [],
            cars: [],
            sprites: [],
            background: null
        };
        
        // Irányítás
        this.keys = {};
        this.setupControls();
        
        // Színek (retro OutRun paletta)
        this.colors = {
            sky: ['#72D7EE', '#7DADE2', '#8B9EE2', '#9B8CE2'],
            hill: ['#46B1C9', '#5B9BD1', '#7B8CE2', '#9B7CE2'],
            tree: ['#619B47', '#7C9947', '#9B9B47', '#B8B247'],
            fog: '#E6D690',
            road: {
                grass: '#10AA10',
                rumble: '#555555',
                road: '#888888',
                lane: '#CCCCCC'
            },
            car: {
                shell: '#FF0000',
                underbody: '#CC0000',
                windshield: '#4444FF'
            }
        };
        
        // Inicializálás
        this.init();
    }
    
    init() {
        console.log('Retro Lotus OutRun inicializálása...');
        
        this.createCanvas();
        this.buildTrack();
        this.createSprites();
        this.resetCars();
        
        // Betöltés befejezése
        document.getElementById('loading').style.display = 'none';
        
        this.gameLoop();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(this.canvas);
        
        console.log('Retro canvas létrehozva:', this.width + 'x' + this.height);
    }
    
    buildTrack() {
        const segments = [];
        
        // Egyenes szakaszok és kanyarok
        this.addStraight(segments, 500);
        this.addCurve(segments, 300, -6);
        this.addStraight(segments, 200);
        this.addCurve(segments, 400, 4);
        this.addStraight(segments, 300);
        this.addCurve(segments, 500, -8);
        this.addStraight(segments, 400);
        this.addCurve(segments, 200, 6);
        this.addStraight(segments, 500);
        this.addCurve(segments, 600, -4);
        this.addStraight(segments, 300);
        
        this.gameState.roadSegments = segments;
        this.gameState.trackLength = segments.length * this.gameState.segmentLength;
        
        console.log('Pálya építve:', segments.length, 'szegmens');
    }
    
    addStraight(segments, count) {
        for (let i = 0; i < count; i++) {
            segments.push({
                index: segments.length,
                p1: {
                    world: { x: 0, y: 0, z: segments.length * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                p2: {
                    world: { x: 0, y: 0, z: (segments.length + 1) * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                curve: 0,
                sprites: [],
                cars: [],
                color: Math.floor(segments.length / this.gameState.rumbleLength) % 2 ? 'dark' : 'light'
            });
        }
    }
    
    addCurve(segments, count, curve) {
        for (let i = 0; i < count; i++) {
            segments.push({
                index: segments.length,
                p1: {
                    world: { x: 0, y: 0, z: segments.length * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                p2: {
                    world: { x: 0, y: 0, z: (segments.length + 1) * this.gameState.segmentLength },
                    camera: {},
                    screen: {}
                },
                curve: curve,
                sprites: [],
                cars: [],
                color: Math.floor(segments.length / this.gameState.rumbleLength) % 2 ? 'dark' : 'light'
            });
        }
    }
    
    createSprites() {
        // Fák és objektumok hozzáadása
        for (let n = 0; n < 200; n++) {
            const segment = this.gameState.roadSegments[Math.floor(Math.random() * this.gameState.roadSegments.length)];
            
            if (Math.random() > 0.7) {
                segment.sprites.push({
                    source: this.createTreeSprite(),
                    offset: Math.random() > 0.5 ? -2.5 : 2.5
                });
            }
            
            if (Math.random() > 0.9) {
                segment.sprites.push({
                    source: this.createBillboardSprite(),
                    offset: Math.random() > 0.5 ? -3 : 3
                });
            }
        }
    }
    
    createTreeSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Fa törzs
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(14, 32, 4, 16);
        
        // Lombkorona
        ctx.fillStyle = '#228B22';
        ctx.fillRect(8, 16, 16, 20);
        ctx.fillRect(10, 12, 12, 8);
        ctx.fillRect(12, 8, 8, 8);
        
        return canvas;
    }
    
    createBillboardSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Billboard háttér
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(0, 0, 64, 32);
        
        // Szöveg
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.fillText('LOTUS', 16, 12);
        ctx.fillText('RACING', 12, 24);
        
        return canvas;
    }
    
    resetCars() {
        this.gameState.cars = [];
        
        for (let i = 0; i < 5; i++) {
            this.gameState.cars.push({
                segment: Math.floor(Math.random() * this.gameState.roadSegments.length),
                offset: Math.random() * 2 - 1,
                z: Math.random() * this.gameState.segmentLength,
                sprite: this.createCarSprite(i),
                speed: this.gameState.maxSpeed / 4 + Math.random() * this.gameState.maxSpeed / 2,
                percent: 0
            });
        }
    }
    
    createCarSprite(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#FF0000', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const color = colors[type % colors.length];
        
        // Autó test
        ctx.fillStyle = color;
        ctx.fillRect(4, 4, 16, 8);
        
        // Szélvédő
        ctx.fillStyle = '#4444FF';
        ctx.fillRect(6, 5, 4, 6);
        ctx.fillRect(14, 5, 4, 6);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 3, 3, 3);
        ctx.fillRect(2, 10, 3, 3);
        ctx.fillRect(19, 3, 3, 3);
        ctx.fillRect(19, 10, 3, 3);
        
        return canvas;
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
        
        this.gameState.position = this.increase(this.gameState.position, dt * this.gameState.speed, this.gameState.trackLength);
        
        // Irányítás
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.playerX -= dx;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.playerX += dx;
        }
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.gameState.speed = this.accelerate(this.gameState.speed, this.gameState.acceleration, dt);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.gameState.speed = this.accelerate(this.gameState.speed, -this.gameState.deceleration, dt);
        } else {
            this.gameState.speed = this.accelerate(this.gameState.speed, -this.gameState.deceleration * 0.5, dt);
        }
        
        // Kanyar hatás
        if (playerSegment) {
            this.gameState.playerX -= (dx * speedPercent * playerSegment.curve * 0.0005);
        }
        
        // Pálya szélén tartás
        if (this.gameState.playerX < -1 || this.gameState.playerX > 1) {
            if (this.gameState.speed > this.gameState.maxSpeed / 4) {
                this.gameState.speed = this.accelerate(this.gameState.speed, -this.gameState.deceleration * 2, dt);
            }
            
            // Fű hangeffekt szimulálása
            if (Math.random() > 0.8) {
                this.gameState.playerX += (Math.random() - 0.5) * 0.02;
            }
        }
        
        this.gameState.playerX = Math.max(-2, Math.min(2, this.gameState.playerX));
        
        // Ellenfelek frissítése
        this.updateCars(dt);
    }
    
    updateCars(dt) {
        this.gameState.cars.forEach(car => {
            const oldSegment = this.gameState.roadSegments[car.segment];
            car.offset += this.updateCarOffset(car, oldSegment, this.gameState.playerX);
            car.z -= dt * car.speed;
            
            if (car.z < -this.gameState.segmentLength) {
                car.z += this.gameState.segmentLength;
                car.segment = this.increase(car.segment, 1, this.gameState.roadSegments.length);
            }
        });
    }
    
    updateCarOffset(car, carSegment, playerX) {
        const lookahead = 20;
        const carW = 0.3;
        const dir = car.offset - playerX;
        
        return dir > 0 ? -0.25 : 0.25;
    }
    
    render() {
        // Háttér
        this.renderBackground();
        
        // Pálya
        this.renderRoad();
        
        // Autó
        this.renderPlayer();
        
        // HUD
        this.renderHUD();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // Égbolt gradiens
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * this.scale);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#FFB6C1');
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale / 2);
        
        // Hegyek
        this.renderHills();
        
        // Nap
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(this.width * this.scale * 0.8, this.height * this.scale * 0.2, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Pálmafák a távolban
        this.renderDistantPalms();
    }
    
    renderHills() {
        const ctx = this.ctx;
        const hillHeight = this.height * this.scale * 0.3;
        
        // Háttér hegyek
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.moveTo(0, this.height * this.scale / 2);
        
        for (let x = 0; x <= this.width * this.scale; x += 20) {
            const y = this.height * this.scale / 2 - hillHeight + Math.sin(x * 0.01 + this.gameState.position * 0.001) * 20;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width * this.scale, this.height * this.scale / 2);
        ctx.fill();
        
        // Előtér hegyek
        ctx.fillStyle = '#8A2BE2';
        ctx.beginPath();
        ctx.moveTo(0, this.height * this.scale / 2);
        
        for (let x = 0; x <= this.width * this.scale; x += 15) {
            const y = this.height * this.scale / 2 - hillHeight * 0.7 + Math.sin(x * 0.015 + this.gameState.position * 0.002) * 15;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width * this.scale, this.height * this.scale / 2);
        ctx.fill();
    }
    
    renderDistantPalms() {
        const ctx = this.ctx;
        
        for (let i = 0; i < 8; i++) {
            const x = (i * 50 + this.gameState.position * 0.1) % (this.width * this.scale);
            const y = this.height * this.scale * 0.45;
            
            // Pálma törzs
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - 2, y, 4, 20);
            
            // Pálma levelek
            ctx.fillStyle = '#228B22';
            ctx.fillRect(x - 8, y - 5, 16, 3);
            ctx.fillRect(x - 3, y - 10, 6, 8);
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
        
        this.gameState.curve = 0;
        
        for (let n = 0; n < this.gameState.drawDistance; n++) {
            const segment = this.gameState.roadSegments[(baseSegment.index + n) % this.gameState.roadSegments.length];
            
            segment.looped = segment.index < baseSegment.index;
            segment.fog = this.exponentialFog(n / this.gameState.drawDistance, this.gameState.fogDensity);
            segment.clip = maxy;
            
            this.project(segment.p1, (this.gameState.playerX * this.gameState.roadWidth) - x, playerY + this.gameState.cameraHeight, this.gameState.position - (segment.looped ? this.gameState.trackLength : 0), this.gameState.cameraDepth, this.width * this.scale, this.height * this.scale, this.gameState.roadWidth);
            this.project(segment.p2, (this.gameState.playerX * this.gameState.roadWidth) - x - dx, playerY + this.gameState.cameraHeight, this.gameState.position - (segment.looped ? this.gameState.trackLength : 0), this.gameState.cameraDepth, this.width * this.scale, this.height * this.scale, this.gameState.roadWidth);
            
            x += dx;
            dx += segment.curve;
            this.gameState.curve += segment.curve;
            
            if ((segment.p1.camera.z <= this.gameState.cameraDepth) || (segment.p2.screen.y >= maxy)) {
                continue;
            }
            
            this.renderSegment(ctx, this.width * this.scale, this.gameState.lanes, segment, segment.color === 'dark' ? 'dark' : 'light');
            
            maxy = segment.p1.screen.y;
        }
        
        // Sprite-ok és autók renderelése
        for (let n = (this.gameState.drawDistance - 1); n > 0; n--) {
            const segment = this.gameState.roadSegments[(baseSegment.index + n) % this.gameState.roadSegments.length];
            
            // Sprite-ok
            segment.sprites.forEach(sprite => {
                this.renderSprite(ctx, this.width * this.scale, this.height * this.scale, this.gameState.resolution, this.gameState.roadWidth, sprite, segment);
            });
            
            // Autók
            this.gameState.cars.forEach(car => {
                if (car.segment === segment.index) {
                    this.renderCar(ctx, this.width * this.scale, this.height * this.scale, this.gameState.resolution, this.gameState.roadWidth, car, segment);
                }
            });
        }
    }
    
    renderSegment(ctx, width, lanes, segment, color) {
        const r1 = this.rumbleWidth(segment.p1.screen.w, this.gameState.roadWidth);
        const r2 = this.rumbleWidth(segment.p2.screen.w, this.gameState.roadWidth);
        const l1 = this.laneMarkerWidth(segment.p1.screen.w, this.gameState.roadWidth);
        const l2 = this.laneMarkerWidth(segment.p2.screen.w, this.gameState.roadWidth);
        
        // Fű
        ctx.fillStyle = color === 'dark' ? '#0F8A0F' : '#10AA10';
        ctx.fillRect(0, segment.p2.screen.y, width, segment.p1.screen.y - segment.p2.screen.y);
        
        // Rumble strips
        this.polygon(ctx, segment.p1.screen.x - segment.p1.screen.w - r1, segment.p1.screen.y,
                          segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
                          segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
                          segment.p2.screen.x - segment.p2.screen.w - r2, segment.p2.screen.y,
                          color === 'dark' ? '#666666' : '#555555');
        
        this.polygon(ctx, segment.p1.screen.x + segment.p1.screen.w + r1, segment.p1.screen.y,
                          segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
                          segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
                          segment.p2.screen.x + segment.p2.screen.w + r2, segment.p2.screen.y,
                          color === 'dark' ? '#666666' : '#555555');
        
        // Út
        this.polygon(ctx, segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
                          segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
                          segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
                          segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
                          color === 'dark' ? '#777777' : '#888888');
        
        // Középső vonal
        if (color === 'light') {
            this.polygon(ctx, segment.p1.screen.x - l1, segment.p1.screen.y,
                              segment.p1.screen.x + l1, segment.p1.screen.y,
                              segment.p2.screen.x + l2, segment.p2.screen.y,
                              segment.p2.screen.x - l2, segment.p2.screen.y,
                              '#CCCCCC');
        }
    }
    
    renderSprite(ctx, width, height, resolution, roadWidth, sprite, segment) {
        if (segment.p1.camera.z <= this.gameState.cameraDepth) return;
        
        const spriteScale = segment.p1.screen.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width / 2);
        const spriteY = segment.p1.screen.y;
        
        const destW = (sprite.source.width * spriteScale * width / 2) * (0.3 + 0.7 * Math.random());
        const destH = (sprite.source.height * spriteScale * width / 2) * (0.3 + 0.7 * Math.random());
        const destX = spriteX - (destW / 2);
        const destY = spriteY - destH;
        
        const clipH = Math.max(0, destY + destH - segment.clip);
        if (clipH < destH) {
            ctx.drawImage(sprite.source, 0, 0, sprite.source.width, sprite.source.height - (sprite.source.height * clipH / destH), destX, destY, destW, destH - clipH);
        }
    }
    
    renderCar(ctx, width, height, resolution, roadWidth, car, segment) {
        if (segment.p1.camera.z <= this.gameState.cameraDepth) return;
        
        const spriteScale = segment.p1.screen.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * car.offset * roadWidth * width / 2);
        const spriteY = segment.p1.screen.y;
        
        const destW = car.sprite.width * spriteScale * width / 2;
        const destH = car.sprite.height * spriteScale * width / 2;
        const destX = spriteX - (destW / 2);
        const destY = spriteY - destH;
        
        const clipH = Math.max(0, destY + destH - segment.clip);
        if (clipH < destH) {
            ctx.drawImage(car.sprite, 0, 0, car.sprite.width, car.sprite.height - (car.sprite.height * clipH / destH), destX, destY, destW, destH - clipH);
        }
    }
    
    renderPlayer() {
        const ctx = this.ctx;
        const carWidth = 80;
        const carHeight = 40;
        const carX = this.width * this.scale / 2 - carWidth / 2;
        const carY = this.height * this.scale - carHeight - 20;
        
        // Autó árnyék
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(carX + 5, carY + carHeight + 5, carWidth, 8);
        
        // Játékos autó (Lotus stílusú)
        // Fő test
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(carX + 10, carY + 10, carWidth - 20, carHeight - 20);
        
        // Motorháztető
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(carX + 15, carY + 5, carWidth - 30, 15);
        
        // Szélvédő
        ctx.fillStyle = '#4444FF';
        ctx.fillRect(carX + 20, carY + 12, carWidth - 40, 8);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(carX + 5, carY + 8, 8, 8);
        ctx.fillRect(carX + 5, carY + 24, 8, 8);
        ctx.fillRect(carX + carWidth - 13, carY + 8, 8, 8);
        ctx.fillRect(carX + carWidth - 13, carY + 24, 8, 8);
        
        // Fényszórók
        ctx.fillStyle = '#FFFF88';
        ctx.fillRect(carX + 8, carY + 2, 4, 3);
        ctx.fillRect(carX + carWidth - 12, carY + 2, 4, 3);
        
        // Kormány hatás
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            ctx.save();
            ctx.translate(carX + carWidth/2, carY + carHeight/2);
            ctx.rotate(-0.1);
            ctx.translate(-carWidth/2, -carHeight/2);
            // Újra rajzolás döntött állapotban
            ctx.restore();
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            ctx.save();
            ctx.translate(carX + carWidth/2, carY + carHeight/2);
            ctx.rotate(0.1);
            ctx.translate(-carWidth/2, -carHeight/2);
            // Újra rajzolás döntött állapotban
            ctx.restore();
        }
    }
    
    renderHUD() {
        const ctx = this.ctx;
        
        // Sebesség
        ctx.fillStyle = '#FFFF00';
        ctx.font = '16px monospace';
        ctx.fillText(`SPEED: ${Math.round(this.gameState.speed)}`, 10, 30);
        
        // Pozíció
        const position = Math.floor(this.gameState.position / this.gameState.segmentLength);
        ctx.fillText(`POS: ${position}`, 10, 50);
        
        // Sebességmérő
        const speedPercent = this.gameState.speed / this.gameState.maxSpeed;
        const meterWidth = 100;
        const meterHeight = 10;
        const meterX = 10;
        const meterY = 60;
        
        // Háttér
        ctx.fillStyle = '#333333';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Sebesség csík
        ctx.fillStyle = speedPercent > 0.8 ? '#FF0000' : speedPercent > 0.5 ? '#FFFF00' : '#00FF00';
        ctx.fillRect(meterX, meterY, meterWidth * speedPercent, meterHeight);
        
        // OutRun logo
        ctx.fillStyle = '#FF00FF';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('LOTUS OUTRUN', this.width * this.scale - 200, 30);
        
        // Retro grid
        this.renderRetroGrid();
    }
    
    renderRetroGrid() {
        const ctx = this.ctx;
        const gridY = this.height * this.scale - 60;
        const gridHeight = 50;
        
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 1;
        
        // Horizontális vonalak
        for (let i = 0; i < 6; i++) {
            const y = gridY + (i * gridHeight / 5);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width * this.scale, y);
            ctx.stroke();
        }
        
        // Vertikális vonalak
        for (let i = 0; i < 20; i++) {
            const x = (i * this.width * this.scale / 19);
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo(x, gridY + gridHeight);
            ctx.stroke();
        }
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
    
    project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
    }
    
    findSegment(z) {
        return this.gameState.roadSegments[Math.floor(z / this.gameState.segmentLength) % this.gameState.roadSegments.length];
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
    
    exponentialFog(distance, density) {
        return 1 / (Math.pow(Math.E, (distance * distance * density)));
    }
    
    rumbleWidth(projectedRoadWidth, roadWidth) {
        return projectedRoadWidth / Math.max(6, 2 * this.gameState.lanes);
    }
    
    laneMarkerWidth(projectedRoadWidth, roadWidth) {
        return projectedRoadWidth / Math.max(32, 8 * this.gameState.lanes);
    }
    
    restart() {
        this.gameState.position = 0;
        this.gameState.speed = 0;
        this.gameState.playerX = 0;
        this.resetCars();
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
    console.log('Retro Lotus OutRun indítása...');
    new RetroLotusOutRun();
});
