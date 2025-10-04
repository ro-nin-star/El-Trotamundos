class OutRunRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 200;
        this.scale = 3;
        
        // Asset-ek
        this.assets = {
            player: null,
            enemies: [],
            environment: []
        };
        
        // Játék állapot
        this.game = {
            // Játékos
            playerX: 0,        // -1 bal, +1 jobb
            speed: 0,
            maxSpeed: 300,
            
            // Kamera/pozíció
            position: 0,
            cameraX: 0,
            cameraY: 1000,
            cameraZ: 0,
            
            // Pálya
            roadWidth: 2000,
            segmentLength: 200,
            drawDistance: 300,
            
            // Pálya szegmensek
            road: [],
            cars: []
        };
        
        this.keys = {};
        this.lastTime = 0;
        
        this.init();
    }
    
    async init() {
        console.log('OutRun racing inicializálása...');
        
        this.createCanvas();
        await this.loadAssets();
        this.buildTrack();
        this.setupControls();
        this.gameLoop();
    }
    
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
            this.assets.enemies = [
                await this.loadImage('assets/enemy1.png'),
                await this.loadImage('assets/enemy2.png')
            ];
        } catch (error) {
            console.log('Placeholder-ek használata');
            this.createPlaceholders();
        }
    }
    
    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed: ${src}`));
            img.src = src;
        });
    }
    
    createPlaceholders() {
        // Játékos autó (hátulról nézve)
        this.assets.player = this.createPlayerCarSprite();
        this.assets.enemies = [
            this.createEnemyCarSprite('#0000FF'),
            this.createEnemyCarSprite('#00FF00')
        ];
    }
    
    createPlayerCarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        // Autó test (hátulról nézve)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(8, 2, 24, 16);
        
        // Hátsó szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Hátsó lámpák
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
        
        // Kerekek
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
        
        // Autó test
        ctx.fillStyle = color;
        ctx.fillRect(8, 2, 24, 16);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
    
    buildTrack() {
        this.game.road = [];
        
        // Egyszerű pálya OutRun stílusban
        this.addRoad(200, 0, 0);        // Egyenes
        this.addRoad(100, 0, -6);       // Bal kanyar
        this.addRoad(100, 0, 0);        // Egyenes
        this.addRoad(100, 0, 6);        // Jobb kanyar
        this.addRoad(100, 300, 0);      // Emelkedő
        this.addRoad(100, 0, -4);       // Bal kanyar
        this.addRoad(200, 0, 0);        // Hosszú egyenes
        
        // Ellenfél autók
        this.createCars();
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
                color: Math.floor(this.game.road.length / 3) % 2 ? 'dark' : 'light'
            });
        }
    }
    
    createCars() {
        this.game.cars = [
            {
                segment: 50,
                offset: -0.7,
                z: 0,
                sprite: this.assets.enemies[0],
                speed: 200
            },
            {
                segment: 100,
                offset: 0.5,
                z: 0,
                sprite: this.assets.enemies[1],
                speed: 180
            }
        ];
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update(dt) {
        // Gyorsítás/lassítás
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.game.speed = Math.min(this.game.maxSpeed, this.game.speed + 300 * dt);
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.game.speed = Math.max(0, this.game.speed - 500 * dt);
        } else {
            this.game.speed = Math.max(0, this.game.speed - 200 * dt);
        }
        
        // Kormányzás
        const speedPercent = this.game.speed / this.game.maxSpeed;
        const dx = dt * 2 * speedPercent;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.game.playerX -= dx;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.game.playerX += dx;
        }
        
        // Pozíció frissítés
        this.game.position += this.game.speed * dt;
        
        // Kanyar hatás
        const playerSegment = this.findSegment(this.game.position);
        if (playerSegment) {
            this.game.playerX -= (dx * speedPercent * playerSegment.curve * 0.003);
        }
        
        // Játékos pozíció korlátozása
        this.game.playerX = Math.max(-1, Math.min(1, this.game.playerX));
        
        // Autók frissítése
        this.updateCars(dt);
    }
    
    updateCars(dt) {
        this.game.cars.forEach(car => {
            car.z -= dt * car.speed;
            
            if (car.z < -this.game.segmentLength) {
                car.z += this.game.segmentLength;
                car.segment++;
                if (car.segment >= this.game.road.length) {
                    car.segment = 0;
                }
            }
        });
    }
    
    findSegment(z) {
        return this.game.road[Math.floor(z / this.game.segmentLength) % this.game.road.length];
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Égbolt
        this.renderSky();
        
        // Pálya (pseudo-3D)
        this.renderRoad();
        
        // Játékos autó
        this.renderPlayerCar();
        
        // HUD
        this.renderHUD();
    }
    
    renderSky() {
        // Égbolt gradiens
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
    }
    
    renderRoad() {
        const baseSegment = this.findSegment(this.game.position);
        const basePercent = (this.game.position % this.game.segmentLength) / this.game.segmentLength;
        const playerSegment = this.findSegment(this.game.position);
        const playerY = 0;
        
        let maxy = this.canvas.height;
        let x = 0;
        let dx = -(basePercent * baseSegment.curve);
        
        for (let n = 0; n < this.game.drawDistance; n++) {
            const segment = this.game.road[(baseSegment.index + n) % this.game.road.length];
            
            // 3D projekció
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
        
        // Autók renderelése
        for (let n = this.game.drawDistance - 1; n > 0; n--) {
            const segment = this.game.road[(baseSegment.index + n) % this.game.road.length];
            
            this.game.cars.forEach(car => {
                if (car.segment === segment.index) {
                    this.renderCar(car, segment);
                }
            });
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
        
        // Fű
        this.ctx.fillStyle = segment.color === 'dark' ? '#228B22' : '#32CD32';
        this.ctx.fillRect(0, segment.p2.screen.y, this.canvas.width, segment.p1.screen.y - segment.p2.screen.y);
        
        // Rumble strips
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
        
        // Útburkolat
        this.polygon(
            segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
            segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
            segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
            segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
            segment.color === 'dark' ? '#666666' : '#999999'
        );
        
        // Középső vonal
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
    
    renderCar(car, segment) {
        if (segment.p1.camera.z <= 0.84) return;
        
        const spriteScale = segment.p1.screen.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * car.offset * this.game.roadWidth * this.canvas.width / 2);
        const spriteY = segment.p1.screen.y;
        
        const destW = car.sprite.width * spriteScale * this.canvas.width / 2;
        const destH = car.sprite.height * spriteScale * this.canvas.width / 2;
        const destX = spriteX - (destW / 2);
        const destY = spriteY - destH;
        
        this.ctx.drawImage(car.sprite, destX, destY, destW, destH);
    }
    
    renderPlayerCar() {
        if (!this.assets.player) return;
        
        const carW = this.assets.player.width * this.scale;
        const carH = this.assets.player.height * this.scale;
        const carX = (this.canvas.width / 2) - (carW / 2);
        const carY = this.canvas.height - carH - 20;
        
        // Kormányzás animáció
        this.ctx.save();
        this.ctx.translate(carX + carW / 2, carY + carH / 2);
        this.ctx.rotate(this.game.playerX * 0.05);
        
        this.ctx.drawImage(this.assets.player, -carW / 2, -carH / 2, carW, carH);
        
        this.ctx.restore();
    }
    
    renderHUD() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Speed: ${Math.floor(this.game.speed)} km/h`, 10, 30);
        this.ctx.fillText(`Position: ${Math.floor(this.game.position)}m`, 10, 50);
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
