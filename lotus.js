class LotusRacing {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Játék állapot
        this.gameState = {
            speed: 0,
            maxSpeed: 200,
            acceleration: 0.5,
            deceleration: 0.8,
            turnSpeed: 0,
            maxTurnSpeed: 3,
            position: { x: 400, y: 500 },
            roadPosition: 0,
            lap: 1,
            totalLaps: 3,
            startTime: Date.now(),
            playerPosition: 1
        };
        
        // Pálya adatok
        this.road = {
            width: 200,
            segments: [],
            curves: [0, 0.5, -0.3, 0.8, -0.5, 0.2, -0.7, 0.4]
        };
        
        // Ellenfelek
        this.opponents = [];
        this.initOpponents();
        
        // Billentyűzet kezelés
        this.keys = {};
        this.setupControls();
        
        // Pálya generálás
        this.generateRoad();
        
        // Játék indítás
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    generateRoad() {
        // Egyszerű pálya generálás kanyarokkal
        for (let i = 0; i < 1000; i++) {
            const curveIndex = Math.floor(i / 125) % this.road.curves.length;
            this.road.segments.push({
                curve: this.road.curves[curveIndex],
                y: i * 10,
                color: i % 20 < 10 ? '#666' : '#555'
            });
        }
    }
    
    initOpponents() {
        for (let i = 0; i < 4; i++) {
            this.opponents.push({
                x: 350 + Math.random() * 100,
                y: -100 - i * 150,
                speed: 80 + Math.random() * 40,
                lane: Math.random() * 0.6 - 0.3,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
        }
    }
    
    handleInput() {
        // Gyorsítás
        if (this.keys['ArrowUp']) {
            this.gameState.speed = Math.min(
                this.gameState.speed + this.gameState.acceleration,
                this.gameState.maxSpeed
            );
        } else {
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration,
                0
            );
        }
        
        // Fékezés
        if (this.keys['ArrowDown']) {
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration * 2,
                0
            );
        }
        
        // Kormányozás
        if (this.keys['ArrowLeft']) {
            this.gameState.turnSpeed = Math.max(
                this.gameState.turnSpeed - 0.2,
                -this.gameState.maxTurnSpeed
            );
        } else if (this.keys['ArrowRight']) {
            this.gameState.turnSpeed = Math.min(
                this.gameState.turnSpeed + 0.2,
                this.gameState.maxTurnSpeed
            );
        } else {
            this.gameState.turnSpeed *= 0.9; // Fokozatos visszatérés középre
        }
        
        // Újraindítás
        if (this.keys['Space']) {
            this.restart();
        }
    }
    
    update() {
        // Pozíció frissítés
        this.gameState.roadPosition += this.gameState.speed * 0.01;
        this.gameState.position.x += this.gameState.turnSpeed;
        
        // Pálya határok
        this.gameState.position.x = Math.max(250, Math.min(550, this.gameState.position.x));
        
        // Ellenfelek frissítése
        this.updateOpponents();
        
        // Kör számítás
        const currentLap = Math.floor(this.gameState.roadPosition / 100) + 1;
        if (currentLap > this.gameState.lap) {
            this.gameState.lap = Math.min(currentLap, this.gameState.totalLaps);
        }
    }
    
    updateOpponents() {
        this.opponents.forEach(opponent => {
            opponent.y += (this.gameState.speed - opponent.speed) * 0.1;
            
            // Ha túl messze van, újrapozicionáljuk
            if (opponent.y > 700) {
                opponent.y = -200;
                opponent.x = 350 + Math.random() * 100;
                opponent.speed = 80 + Math.random() * 40;
            }
        });
    }
    
    render() {
        // Háttér törlése
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Út renderelése
        this.renderRoad();
        
        // Ellenfelek renderelése
        this.renderOpponents();
        
        // Játékos autó renderelése
        this.renderPlayer();
        
        // HUD frissítése
        this.updateHUD();
    }
    
    renderRoad() {
        const segmentHeight = 3;
        const roadWidth = this.road.width;
        
        for (let i = 0; i < this.canvas.height / segmentHeight + 1; i++) {
            const segmentIndex = Math.floor(this.gameState.roadPosition + i);
            const segment = this.road.segments[segmentIndex % this.road.segments.length];
            
            if (!segment) continue;
            
            const y = this.canvas.height - i * segmentHeight;
            const curve = segment.curve * (i * 0.1);
            const centerX = this.canvas.width / 2 + curve * 50;
            
            // Út
            this.ctx.fillStyle = segment.color;
            this.ctx.fillRect(
                centerX - roadWidth / 2,
                y,
                roadWidth,
                segmentHeight + 1
            );
            
            // Középső vonal
            if (Math.floor(this.gameState.roadPosition + i) % 8 < 4) {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(centerX - 2, y, 4, segmentHeight + 1);
            }
            
            // Szélső vonalak
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(centerX - roadWidth / 2 - 3, y, 3, segmentHeight + 1);
            this.ctx.fillRect(centerX + roadWidth / 2, y, 3, segmentHeight + 1);
        }
    }
    
    renderPlayer() {
        const playerX = this.gameState.position.x;
        const playerY = this.gameState.position.y;
        
        // Autó test
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(playerX - 15, playerY - 30, 30, 60);
        
        // Autó részletek
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(playerX - 10, playerY - 20, 20, 15);
        this.ctx.fillRect(playerX - 10, playerY + 5, 20, 15);
        
        // Kerekek
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(playerX - 18, playerY - 25, 6, 15);
        this.ctx.fillRect(playerX + 12, playerY - 25, 6, 15);
        this.ctx.fillRect(playerX - 18, playerY + 10, 6, 15);
        this.ctx.fillRect(playerX + 12, playerY + 10, 6, 15);
    }
    
    renderOpponents() {
        this.opponents.forEach(opponent => {
            if (opponent.y > -50 && opponent.y < 650) {
                // Ellenfél autó
                this.ctx.fillStyle = opponent.color;
                this.ctx.fillRect(opponent.x - 12, opponent.y - 25, 24, 50);
                
                // Kerekek
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(opponent.x - 15, opponent.y - 20, 4, 10);
                this.ctx.fillRect(opponent.x + 11, opponent.y - 20, 4, 10);
                this.ctx.fillRect(opponent.x - 15, opponent.y + 10, 4, 10);
                this.ctx.fillRect(opponent.x + 11, opponent.y + 10, 4, 10);
            }
        });
    }
    
    updateHUD() {
        document.getElementById('speed').textContent = Math.round(this.gameState.speed);
        document.getElementById('lap').textContent = this.gameState.lap;
        
        const elapsed = (Date.now() - this.gameState.startTime) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('position').textContent = this.gameState.playerPosition;
    }
    
    restart() {
        this.gameState.speed = 0;
        this.gameState.roadPosition = 0;
        this.gameState.position.x = 400;
        this.gameState.lap = 1;
        this.gameState.startTime = Date.now();
        this.initOpponents();
    }
    
    gameLoop() {
        this.handleInput();
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Játék indítása
window.addEventListener('load', () => {
    new LotusRacing();
});
