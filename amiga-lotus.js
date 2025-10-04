class OutrunStyleRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 200;
        this.scale = 3;
        
        // Asset-ek tárolása
        this.assets = {
            player: null,
            enemies: [],
            background: null,
            roadTextures: {},
            environment: []
        };
        
        // Játék állapot
        this.game = {
            // Játékos autó
            playerX: 0,          // -1 bal szél, +1 jobb szél
            playerY: 0,
            speed: 0,
            maxSpeed: 200,
            
            // Kamera és pozíció
            position: 0,
            roadCurve: 0,
            hill: 0,
            
            // Pálya
            roadWidth: 2000,
            segmentLength: 200,
            drawDistance: 300,
            
            // Ellenfelek
            enemies: [],
            
            // Környezet
            roadSegments: [],
            backgroundOffset: 0
        };
        
        this.keys = {};
        this.lastTime = 0;
        
        this.init();
    }
    
    async init() {
        console.log('Outrun stílusú játék inicializálása...');
        
        this.createCanvas();
        await this.loadAssets();
        this.generateRoad();
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
            // Játékos autó - ide add meg a saját képed
            this.assets.player = await this.loadImage('assets/player-car.png');
            console.log('Játékos autó betöltve:', this.assets.player);
            
            // Ellenfél autók
            this.assets.enemies = [
                await this.loadImage('assets/enemy-car1.png'),
                await this.loadImage('assets/enemy-car2.png'),
                await this.loadImage('assets/enemy-car3.png')
            ];
            
            // Háttér elemek
            this.assets.background = await this.loadImage('assets/background.png');
            
            // Környezeti objektumok
            this.assets.environment = [
                await this.loadImage('assets/tree.png'),
                await this.loadImage('assets/building.png'),
                await this.loadImage('assets/sign.png')
            ];
            
        } catch (error) {
            console.log('Asset-ek nem találhatók, placeholder-ek használata:', error);
            this.createPlaceholderAssets();
        }
        
        // Ellenőrizzük, hogy van-e játékos autó
        if (!this.assets.player) {
            console.error('Nincs játékos autó asset!');
            this.assets.player = this.createCarPlaceholder('#FF0000');
        }
        
        console.log('Asset-ek betöltve, játékos autó:', this.assets.player);
    }
    
    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Nem sikerült betölteni: ${src}`));
            img.src = src;
        });
    }
    
    createPlaceholderAssets() {
        // Ha nincsenek asset-ek, készítünk placeholder-eket
        this.assets.player = this.createCarPlaceholder('#FF0000');
        this.assets.enemies = [
            this.createCarPlaceholder('#0000FF'),
            this.createCarPlaceholder('#00FF00'),
            this.createCarPlaceholder('#FFFF00')
        ];
        this.assets.background = this.createBackgroundPlaceholder();
        this.assets.environment = [
            this.createTreePlaceholder(),
            this.createBuildingPlaceholder()
        ];
    }
    
    createCarPlaceholder(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Háttér törlése
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Autó test (nagyobb, láthatóbb)
        ctx.fillStyle = color;
        ctx.fillRect(6, 8, 20, 48);
        
        // Autó körvonal
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 8, 20, 48);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(8, 16, 16, 20);
        
        // Kerekek (nagyobbak)
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, 12, 8, 10);
        ctx.fillRect(22, 12, 8, 10);
        ctx.fillRect(2, 42, 8, 10);
        ctx.fillRect(22, 42, 8, 10);
        
        // Fényszórók
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(8, 8, 6, 4);
        ctx.fillRect(18, 8, 6, 4);
        
        console.log('Placeholder autó létrehozva:', canvas.width, 'x', canvas.height);
        
        return canvas;
    }
    
    createBackgroundPlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width * this.scale;
        canvas.height = this.height * this.scale * 0.6;
        const ctx = canvas.getContext('2d');
        
        // Égbolt gradiens
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas;
    }
    
    createTreePlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Törzs
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, 32, 4, 16);
        
        // Lombkorona
        ctx.fillStyle = '#228B22';
        ctx.fillRect(4, 8, 16, 24);
        
        return canvas;
    }
    
    createBuildingPlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#708090';
        ctx.fillRect(0, 0, 48, 64);
        
        return canvas;
    }
    
    generateRoad() {
        this.game.roadSegments = [];
        
        // Pálya generálás OutRun stílusban
        this.addRoadSection(100, 0, 0);      // Egyenes
        this.addRoadSection(50, 0, -3);      // Bal kanyar
        this.addRoadSection(100, 0, 0);      // Egyenes
        this.addRoadSection(50, 0, 4);       // Jobb kanyar
        this.addRoadSection(80, 200, 0);     // Domb
        this.addRoadSection(60, 0, -5);      // Éles bal kanyar
        this.addRoadSection(120, 0, 0);      // Hosszú egyenes
        this.addRoadSection(40, -200, 6);    // Jobb kanyar lejtőn
        
        // Ellenfelek létrehozása
        this.createEnemies();
    }
    
    addRoadSection(segments, hill, curve) {
        const startY = this.game.roadSegments.length > 0 ? 
            this.game.roadSegments[this.game.roadSegments.length - 1].y : 0;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            this.game.roadSegments.push({
                index: this.game.roadSegments.length,
                y: startY + (hill * progress),
                curve: curve,
                sprites: this.generateRoadSideObjects()
            });
        }
    }
    
    generateRoadSideObjects() {
        const objects = [];
        
        // Véletlenszerű objektumok az út szélén
        if (Math.random() < 0.1) {
            objects.push({
                sprite: this.assets.environment[0], // Fa
                x: Math.random() > 0.5 ? -2.5 : 2.5,
                scale: 0.8 + Math.random() * 0.4
            });
        }
        
        if (Math.random() < 0.05) {
            objects.push({
                sprite: this.assets.environment[1], // Épület
                x: Math.random() > 0.5 ? -4 : 4,
                scale: 1 + Math.random() * 0.5
            });
        }
        
        return objects;
    }
    
    createEnemies() {
        this.game.enemies = [
            {
                segment: 50,
                x: -0.5,
                z: 0,
                sprite: this.assets.enemies[0],
                speed: 120
            },
            {
                segment: 100,
                x: 0.3,
                z: 0,
                sprite: this.assets.enemies[1],
                speed: 140
            },
            {
                segment: 150,
                x: 0,
                z: 0,
                sprite: this.assets.enemies[2],
                speed: 110
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
        // Irányítás
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.game.speed = Math.min(this.game.maxSpeed, this.game.speed + 300 * dt);
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.game.speed = Math.max(0, this.game.speed - 500 * dt);
        } else {
            this.game.speed = Math.max(0, this.game.speed - 200 * dt);
        }
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.game.playerX -= dt * 2;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.game.playerX += dt * 2;
        }
        
        // Játékos pozíció korlátozása
        this.game.playerX = Math.max(-1.2, Math.min(1.2, this.game.playerX));
        
        // Pozíció frissítés
        this.game.position += this.game.speed * dt;
        
        // Kanyar hatás
        const currentSegment = this.getCurrentSegment();
        if (currentSegment) {
            this.game.roadCurve = currentSegment.curve;
            this.game.playerX -= dt * this.game.speed * currentSegment.curve * 0.0001;
        }
        
        // Ellenfelek frissítése
        this.updateEnemies(dt);
        
        // Háttér scrolling
        this.game.backgroundOffset += this.game.speed * dt * 0.1;
    }
    
    updateEnemies(dt) {
        this.game.enemies.forEach(enemy => {
            enemy.z -= dt * enemy.speed;
            
            if (enemy.z < -this.game.segmentLength) {
                enemy.z += this.game.segmentLength;
                enemy.segment = (enemy.segment + 1) % this.game.roadSegments.length;
            }
        });
    }
    
    getCurrentSegment() {
        const segmentIndex = Math.floor(this.game.position / this.game.segmentLength);
        return this.game.roadSegments[segmentIndex % this.game.roadSegments.length];
    }
    
    render() {
        // Teljes canvas törlése
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Háttér
        this.renderBackground();
        
        // Pálya (háttérben)
        this.renderRoad();
        
        // Játékos autó (előtérben, utoljára rajzoljuk)
        this.renderPlayerCar();
        
        // HUD (legfelül)
        this.renderHUD();
    }
    
    renderBackground() {
        // Scrollozó háttér
        const bgX = -(this.game.backgroundOffset % this.assets.background.width);
        
        this.ctx.drawImage(
            this.assets.background,
            bgX, 0,
            this.canvas.width + this.assets.background.width,
            this.canvas.height * 0.6
        );
    }
    
    renderRoad() {
        const baseSegment = Math.floor(this.game.position / this.game.segmentLength);
        
        for (let i = 0; i < this.game.drawDistance; i++) {
            const segment = this.game.roadSegments[(baseSegment + i) % this.game.roadSegments.length];
            const z = (i + 1) * this.game.segmentLength;
            
            if (z > 0) {
                this.renderRoadSegment(segment, z, i);
            }
        }
    }
    
    renderRoadSegment(segment, z, index) {
        const scale = 200 / z;
        const roadWidth = scale * this.game.roadWidth;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.8;
        
        // Út renderelés
        const color = index % 6 < 3 ? '#404040' : '#606060';
        this.ctx.fillStyle = color;
        
        const roadY = centerY - (segment.y * scale);
        this.ctx.fillRect(
            centerX - roadWidth / 2,
            roadY,
            roadWidth,
            scale * 20
        );
        
        // Útszéli objektumok
        segment.sprites.forEach(obj => {
            this.renderRoadSideObject(obj, centerX, roadY, scale);
        });
        
        // Ellenfelek
        this.game.enemies.forEach(enemy => {
            if (Math.abs(enemy.segment - (segment.index % this.game.roadSegments.length)) < 2) {
                this.renderEnemy(enemy, centerX, roadY, scale);
            }
        });
    }
    
    renderRoadSideObject(obj, centerX, roadY, scale) {
        if (!obj.sprite) return;
        
        const objScale = scale * obj.scale;
        const objX = centerX + (obj.x * scale * 100);
        const objY = roadY - (obj.sprite.height * objScale);
        
        this.ctx.drawImage(
            obj.sprite,
            objX,
            objY,
            obj.sprite.width * objScale,
            obj.sprite.height * objScale
        );
    }
    
    renderEnemy(enemy, centerX, roadY, scale) {
        if (!enemy.sprite) return;
        
        const enemyX = centerX + (enemy.x * scale * 100);
        const enemyY = roadY - (enemy.sprite.height * scale);
        
        this.ctx.drawImage(
            enemy.sprite,
            enemyX,
            enemyY,
            enemy.sprite.width * scale,
            enemy.sprite.height * scale
        );
    }
    
    renderPlayerCar() {
        if (!this.assets.player) {
            console.log('Nincs játékos autó asset betöltve');
            return;
        }
        
        // Debug információk
        console.log('Player car rendering:', {
            asset: this.assets.player,
            width: this.assets.player.width,
            height: this.assets.player.height
        });
        
        const carWidth = this.assets.player.width * this.scale;
        const carHeight = this.assets.player.height * this.scale;
        const carX = (this.canvas.width / 2) - (carWidth / 2);
        const carY = this.canvas.height - carHeight - 20;
        
        // Kanyarodás animáció
        const tilt = this.game.playerX * 0.1;
        
        this.ctx.save();
        
        // Transzformáció a kocsi közepére
        this.ctx.translate(carX + carWidth / 2, carY + carHeight / 2);
        this.ctx.rotate(tilt);
        
        // Autó rajzolása
        this.ctx.drawImage(
            this.assets.player,
            -carWidth / 2,
            -carHeight / 2,
            carWidth,
            carHeight
        );
        
        this.ctx.restore();
        
        // Debug: keret rajzolása az autó körül
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(carX, carY, carWidth, carHeight);
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
    new OutrunStyleRacing();
});
