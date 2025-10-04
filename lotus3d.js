class AmigaLotusRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 320;
        this.height = 256;
        this.scale = 3;
        
        // Amiga színpaletta
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
        
        // Egyszerűsített játék állapot
        this.gameState = {
            playerX: 160,
            playerY: 200,
            speed: 0,
            maxSpeed: 200,
            acceleration: 2,
            deceleration: 3,
            turnSpeed: 0,
            maxTurnSpeed: 3,
            position: 0,
            roadOffset: 0,
            curve: 0,
            cars: [],
            objects: [],
            score: 0,
            lap: 1,
            totalLaps: 3
        };
        
        this.keys = {};
        this.setupControls();
        this.init();
    }
    
    init() {
        console.log('Amiga Lotus Racing inicializálása...');
        
        try {
            this.createCanvas();
            this.createSimpleSprites();
            this.initGame();
            
            // Betöltés befejezése
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            console.log('Játék sikeresen betöltve');
            this.gameLoop();
            
        } catch (error) {
            console.error('Hiba a játék inicializálása során:', error);
            alert('Hiba történt a játék betöltése során: ' + error.message);
        }
    }
    
    createCanvas() {
        console.log('Canvas létrehozása...');
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        
        // Pixelated rendering
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
        
        console.log('Canvas létrehozva:', this.width + 'x' + this.height);
    }
    
    createSimpleSprites() {
        console.log('Egyszerű sprite-ok létrehozása...');
        
        // Egyszerűsített sprite létrehozás
        this.sprites = {
            playerCar: this.createPlayerCarSprite(),
            enemyCar1: this.createEnemyCarSprite('#DC143C'), // Piros
            enemyCar2: this.createEnemyCarSprite('#0000CD'), // Kék  
            enemyCar3: this.createEnemyCarSprite('#FFD700'), // Sárga
            tree: this.createTreeSprite(),
            building: this.createBuildingSprite()
        };
        
        console.log('Sprite-ok létrehozva');
    }
    
    createPlayerCarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Lotus Esprit egyszerűsített verzió
        // Fő test (piros)
        ctx.fillStyle = this.palette.car.red;
        ctx.fillRect(4, 8, 8, 16);
        
        // Motorháztető
        ctx.fillStyle = this.palette.car.black;
        ctx.fillRect(5, 6, 6, 4);
        
        // Szélvédő
        ctx.fillStyle = this.palette.car.blue;
        ctx.fillRect(6, 12, 4, 6);
        
        // Kerekek
        ctx.fillStyle = this.palette.car.black;
        ctx.fillRect(2, 10, 2, 3);
        ctx.fillRect(12, 10, 2, 3);
        ctx.fillRect(2, 19, 2, 3);
        ctx.fillRect(12, 19, 2, 3);
        
        // Fényszórók
        ctx.fillStyle = this.palette.car.white;
        ctx.fillRect(5, 4, 2, 2);
        ctx.fillRect(9, 4, 2, 2);
        
        return canvas;
    }
    
    createEnemyCarSprite(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Ellenfél autó
        ctx.fillStyle = color;
        ctx.fillRect(4, 8, 8, 16);
        
        // Szélvédő
        ctx.fillStyle = this.palette.car.blue;
        ctx.fillRect(6, 12, 4, 6);
        
        // Kerekek
        ctx.fillStyle = this.palette.car.black;
        ctx.fillRect(2, 10, 2, 3);
        ctx.fillRect(12, 10, 2, 3);
        ctx.fillRect(2, 19, 2, 3);
        ctx.fillRect(12, 19, 2, 3);
        
        return canvas;
    }
    
    createTreeSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 12;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        
        // Törzs
        ctx.fillStyle = this.palette.trunk;
        ctx.fillRect(5, 16, 2, 8);
        
        // Lombkorona
        ctx.fillStyle = this.palette.tree;
        ctx.fillRect(2, 8, 8, 8);
        ctx.fillRect(3, 4, 6, 6);
        ctx.fillRect(4, 2, 4, 4);
        
        return canvas;
    }
    
    createBuildingSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Épület test
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 8, 24, 24);
        
        // Ablakok
        ctx.fillStyle = this.palette.ui.orange;
        for (let y = 12; y < 28; y += 6) {
            for (let x = 3; x < 21; x += 6) {
                if (Math.random() > 0.4) {
                    ctx.fillRect(x, y, 3, 4);
                }
            }
        }
        
        // Tető
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(0, 4, 24, 4);
        
        return canvas;
    }
    
    initGame() {
        console.log('Játék inicializálása...');
        
        // Ellenfél autók
        this.gameState.cars = [
            { x: 100, y: 50, sprite: 'enemyCar1', speed: 1.5 },
            { x: 200, y: 80, sprite: 'enemyCar2', speed: 1.2 },
            { x: 140, y: 20, sprite: 'enemyCar3', speed: 1.8 }
        ];
        
        // Környezeti objektumok
        this.gameState.objects = [];
        for (let i = 0; i < 15; i++) {
            this.gameState.objects.push({
                x: Math.random() < 0.5 ? Math.random() * 80 : 240 + Math.random() * 80,
                y: Math.random() * 200,
                sprite: Math.random() < 0.7 ? 'tree' : 'building'
            });
        }
        
        console.log('Játék inicializálva');
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
    
    update() {
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
            this.gameState.playerX = Math.max(80, this.gameState.playerX - this.gameState.maxTurnSpeed);
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.playerX = Math.min(240, this.gameState.playerX + this.gameState.maxTurnSpeed);
        }
        
        // Pálya scrolling
        this.gameState.roadOffset += this.gameState.speed * 0.1;
        this.gameState.position += this.gameState.speed * 0.1;
        
        // Ellenfelek mozgása
        this.gameState.cars.forEach(car => {
            car.y += this.gameState.speed * 0.1 + car.speed;
            
            // Ha kiment a képernyőről
            if (car.y > this.height + 50) {
                car.y = -50;
                car.x = 80 + Math.random() * 160;
            }
            
            // Egyszerű AI
            if (Math.random() < 0.01) {
                car.x += (Math.random() - 0.5) * 20;
                car.x = Math.max(80, Math.min(240, car.x));
            }
        });
        
        // Objektumok mozgása
        this.gameState.objects.forEach(obj => {
            obj.y += this.gameState.speed * 0.1;
            
            if (obj.y > this.height + 50) {
                obj.y = -50;
                obj.x = Math.random() < 0.5 ? Math.random() * 80 : 240 + Math.random() * 80;
            }
        });
        
        // Ütközés detektálás
        this.checkCollisions();
        
        // Pontszám
        this.gameState.score += Math.floor(this.gameState.speed * 0.1);
    }
    
    checkCollisions() {
        const playerRect = {
            x: this.gameState.playerX - 8,
            y: this.gameState.playerY - 16,
            width: 16,
            height: 32
        };
        
        // Autók
        this.gameState.cars.forEach(car => {
            const carRect = {
                x: car.x - 8,
                y: car.y - 16,
                width: 16,
                height: 32
            };
            
            if (this.rectsOverlap(playerRect, carRect)) {
                this.crash();
            }
        });
        
        // Objektumok (csak épületek)
        this.gameState.objects.forEach(obj => {
            if (obj.sprite === 'building') {
                const objRect = {
                    x: obj.x - 12,
                    y: obj.y - 16,
                    width: 24,
                    height: 32
                };
                
                if (this.rectsOverlap(playerRect, objRect)) {
                    this.crash();
                }
            }
        });
    }
    
    rectsOverlap(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    crash() {
        this.gameState.speed = 0;
        // Egyszerű crash effekt - villogás
        this.flashScreen();
    }
    
    flashScreen() {
        const originalStyle = this.canvas.style.filter;
        this.canvas.style.filter = 'invert(1)';
        
        setTimeout(() => {
            this.canvas.style.filter = originalStyle;
        }, 100);
    }
    
    restart() {
        this.gameState.playerX = 160;
        this.gameState.speed = 0;
        this.gameState.position = 0;
        this.gameState.score = 0;
        this.gameState.lap = 1;
        this.initGame();
    }
    
    render() {
        try {
            // Háttér törlése
            this.ctx.fillStyle = '#000040';
            this.ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale);
            
            // Háttér
            this.renderBackground();
            
            // Út
            this.renderRoad();
            
            // Objektumok
            this.renderObjects();
            
            // Autók
            this.renderCars();
            
            // Játékos
            this.renderPlayer();
            
            // HUD
            this.renderHUD();
            
        } catch (error) {
            console.error('Renderelési hiba:', error);
        }
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // Égbolt gradiens
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * this.scale * 0.5);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#F0F8FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale * 0.5);
        
        // Hegyek
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(0, this.height * this.scale * 0.4, this.width * this.scale, this.height * this.scale * 0.1);
        
        // Nap
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width * this.scale * 0.8, this.height * this.scale * 0.2, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRoad() {
        const ctx = this.ctx;
        const roadY = this.height * this.scale * 0.5;
        const roadWidth = 160 * this.scale;
        const roadX = (this.width * this.scale - roadWidth) / 2;
        
        // Fű
        ctx.fillStyle = this.palette.grass;
        ctx.fillRect(0, roadY, this.width * this.scale, this.height * this.scale * 0.5);
        
        // Út
        ctx.fillStyle = this.palette.road;
        ctx.fillRect(roadX, roadY, roadWidth, this.height * this.scale * 0.5);
        
        // Út szélei
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(roadX - 2, roadY, 2, this.height * this.scale * 0.5);
        ctx.fillRect(roadX + roadWidth, roadY, 2, this.height * this.scale * 0.5);
        
        // Középső vonal
        const lineOffset = (this.gameState.roadOffset * 2) % 32;
        ctx.fillStyle = this.palette.roadLine;
        
        for (let y = roadY - lineOffset; y < this.height * this.scale; y += 32) {
            ctx.fillRect((this.width * this.scale / 2) - 2, y, 4, 16);
        }
    }
    
    renderObjects() {
        this.gameState.objects.forEach(obj => {
            const sprite = this.sprites[obj.sprite];
            if (sprite) {
                this.drawSprite(sprite, obj.x, obj.y);
            }
        });
    }
    
    renderCars() {
        this.gameState.cars.forEach(car => {
            const sprite = this.sprites[car.sprite];
            if (sprite) {
                this.drawSprite(sprite, car.x, car.y);
            }
        });
    }
    
    renderPlayer() {
        const sprite = this.sprites.playerCar;
        if (sprite) {
            this.drawSprite(sprite, this.gameState.playerX, this.gameState.playerY);
        }
    }
    
    renderHUD() {
        const ctx = this.ctx;
        
        // HUD háttér
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width * this.scale, 30);
        ctx.fillRect(0, this.height * this.scale - 30, this.width * this.scale, 30);
        
        // Szöveg
        ctx.fillStyle = this.palette.ui.cyan;
        ctx.font = `${10 * this.scale}px monospace`;
        ctx.fillText(`SPEED: ${Math.floor(this.gameState.speed)}`, 10, 20);
        
        ctx.fillStyle = this.palette.ui.lime;
        ctx.fillText(`SCORE: ${this.gameState.score}`, 10, this.height * this.scale - 10);
        
        ctx.fillStyle = this.palette.ui.magenta;
        ctx.fillText(`LAP: ${this.gameState.lap}/${this.gameState.totalLaps}`, this.width * this.scale - 100, 20);
        
        // Logo
        ctx.fillStyle = this.palette.ui.orange;
        ctx.font = `${12 * this.scale}px monospace`;
        ctx.fillText('LOTUS', this.width * this.scale / 2 - 30, 20);
    }
    
    drawSprite(sprite, x, y) {
        if (!sprite) return;
        
        this.ctx.drawImage(
            sprite,
            (x - sprite.width / 2) * this.scale,
            (y - sprite.height / 2) * this.scale,
            sprite.width * this.scale,
            sprite.height * this.scale
        );
    }
    
    gameLoop() {
        try {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Játék loop hiba:', error);
        }
    }
}

// Játék indítása
window.addEventListener('load', () => {
    console.log('Amiga Lotus Racing indítása...');
    try {
        new AmigaLotusRacing();
    } catch (error) {
        console.error('Játék indítási hiba:', error);
        alert('Nem sikerült elindítani a játékot: ' + error.message);
    }
});
