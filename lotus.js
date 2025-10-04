class LotusRacing {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Játék állapot
        this.gameState = 'playing'; // 'playing', 'finished'
        this.startTime = Date.now();
        this.currentLap = 1;
        this.maxLaps = 3;
        
        // Játékos autó (Lotus)
        this.player = {
            x: 400,
            y: 500,
            width: 30,
            height: 60,
            angle: 0,
            speed: 0,
            maxSpeed: 8,
            acceleration: 0.3,
            friction: 0.95,
            turnSpeed: 0.05
        };
        
        // Ellenfelek
        this.opponents = [];
        this.initOpponents();
        
        // Pálya pontok (egyszerű ovál)
        this.trackPoints = this.generateTrack();
        this.checkpoints = this.generateCheckpoints();
        this.playerCheckpoint = 0;
        
        // Vezérlés
        this.keys = {};
        this.setupControls();
        
        // Játék indítása
        this.gameLoop();
    }

    // Ellenfelek inicializálása
    initOpponents() {
        const colors = ['#ff0000', '#0000ff', '#ffff00', '#ff8800'];
        for (let i = 0; i < 4; i++) {
            this.opponents.push({
                x: 380 + i * 40,
                y: 520 + i * 20,
                width: 25,
                height: 50,
                angle: 0,
                speed: 2 + Math.random() * 2,
                color: colors[i],
                checkpoint: 0,
                lap: 1
            });
        }
    }

    // Pálya generálása (egyszerű ovál)
    generateTrack() {
        const points = [];
        const centerX = 400;
        const centerY = 300;
        const radiusX = 300;
        const radiusY = 200;
        
        for (let i = 0; i < 360; i += 5) {
            const angle = (i * Math.PI) / 180;
            points.push({
                x: centerX + Math.cos(angle) * radiusX,
                y: centerY + Math.sin(angle) * radiusY
            });
        }
        return points;
    }

    // Ellenőrző pontok generálása
    generateCheckpoints() {
        const checkpoints = [];
        for (let i = 0; i < this.trackPoints.length; i += 10) {
            checkpoints.push(this.trackPoints[i]);
        }
        return checkpoints;
    }

    // Vezérlés beállítása
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'Space') {
                this.restart();
            }
        });
    }

    // Játékos frissítése
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Gyorsítás/fékezés
        if (this.keys['ArrowUp']) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else if (this.keys['ArrowDown']) {
            this.player.speed = Math.max(this.player.speed - this.player.acceleration * 2, -this.player.maxSpeed * 0.5);
        } else {
            this.player.speed *= this.player.friction;
        }
        
        // Kormányozás
        if (this.keys['ArrowLeft']) {
            this.player.angle -= this.player.turnSpeed * Math.abs(this.player.speed);
        }
        if (this.keys['ArrowRight']) {
            this.player.angle += this.player.turnSpeed * Math.abs(this.player.speed);
        }
        
        // Pozíció frissítése
        this.player.x += Math.sin(this.player.angle) * this.player.speed;
        this.player.y -= Math.cos(this.player.angle) * this.player.speed;
        
        // Pálya határok
        this.player.x = Math.max(50, Math.min(750, this.player.x));
        this.player.y = Math.max(50, Math.min(550, this.player.y));
        
        // Checkpoint ellenőrzés
        this.checkPlayerCheckpoint();
    }

    // Ellenfelek frissítése (egyszerű AI)
    updateOpponents() {
        this.opponents.forEach(opponent => {
            if (opponent.lap <= this.maxLaps) {
                // Egyszerű AI: kövesd a pályát
                const targetPoint = this.trackPoints[Math.floor(opponent.checkpoint * 10) % this.trackPoints.length];
                const dx = targetPoint.x - opponent.x;
                const dy = targetPoint.y - opponent.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 20) {
                    opponent.x += (dx / distance) * opponent.speed;
                    opponent.y += (dy / distance) * opponent.speed;
                } else {
                    opponent.checkpoint = (opponent.checkpoint + 1) % this.checkpoints.length;
                    if (opponent.checkpoint === 0) {
                        opponent.lap++;
                    }
                }
            }
        });
    }

    // Játékos checkpoint ellenőrzése
    checkPlayerCheckpoint() {
        const nextCheckpoint = this.checkpoints[this.playerCheckpoint];
        const dx = this.player.x - nextCheckpoint.x;
        const dy = this.player.y - nextCheckpoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            this.playerCheckpoint = (this.playerCheckpoint + 1) % this.checkpoints.length;
            if (this.playerCheckpoint === 0) {
                this.currentLap++;
                if (this.currentLap > this.maxLaps) {
                    this.gameState = 'finished';
                }
            }
        }
    }

    // Pozíció számítása
    calculatePosition() {
        let position = 1;
        this.opponents.forEach(opponent => {
            if (opponent.lap > this.currentLap || 
                (opponent.lap === this.currentLap && opponent.checkpoint > this.playerCheckpoint)) {
                position++;
            }
        });
        return position;
    }

    // Rajzolás
    draw() {
        // Háttér törlése
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pálya rajzolása
        this.drawTrack();
        
        // Checkpointok rajzolása
        this.drawCheckpoints();
        
        // Autók rajzolása
        this.drawCar(this.player, '#00ff00'); // Lotus zöld
        this.opponents.forEach(opponent => {
            this.drawCar(opponent, opponent.color);
        });
        
        // HUD frissítése
        this.updateHUD();
    }

    // Pálya rajzolása
    drawTrack() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        for (let i = 0; i < this.trackPoints.length; i++) {
            const point = this.trackPoints[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Belső pálya
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.trackPoints.length; i++) {
            const point = this.trackPoints[i];
            const innerX = 400 + (point.x - 400) * 0.6;
            const innerY = 300 + (point.y - 300) * 0.6;
            if (i === 0) {
                this.ctx.moveTo(innerX, innerY);
            } else {
                this.ctx.lineTo(innerX, innerY);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    // Checkpointok rajzolása
    drawCheckpoints() {
        this.checkpoints.forEach((checkpoint, index) => {
            this.ctx.fillStyle = index === this.playerCheckpoint ? '#ffff00' : '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(checkpoint.x, checkpoint.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // Autó rajzolása
    drawCar(car, color) {
        this.ctx.save();
        this.ctx.translate(car.x, car.y);
        this.ctx.rotate(car.angle);
        
        // Autó test
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-car.width/2, -car.height/2, car.width, car.height);
        
        // Autó részletek
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-car.width/2 + 5, -car.height/2 + 5, car.width - 10, 10);
        this.ctx.fillRect(-car.width/2 + 5, car.height/2 - 15, car.width - 10, 10);
        
        this.ctx.restore();
    }

    // HUD frissítése
    updateHUD() {
        const speed = Math.abs(this.player.speed * 20).toFixed(0);
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const position = this.calculatePosition();
        
        document.getElementById('speed').textContent = speed;
        document.getElementById('lap').textContent = this.currentLap;
        document.getElementById('time').textContent = timeStr;
        document.getElementById('position').textContent = position;
    }

    // Újraindítás
    restart() {
        this.player.x = 400;
        this.player.y = 500;
        this.player.angle = 0;
        this.player.speed = 0;
        this.playerCheckpoint = 0;
        this.currentLap = 1;
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.initOpponents();
    }

    // Játék ciklus
    gameLoop() {
        this.updatePlayer();
        this.updateOpponents();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Játék indítása
document.addEventListener('DOMContentLoaded', () => {
    new LotusRacing();
});
