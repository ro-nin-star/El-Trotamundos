import { GameEngine } from './core/GameEngine.js';
import { Renderer } from './graphics/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { AssetLoader } from './core/AssetLoader.js';
import { AudioManager } from './audio/AudioManager.js';

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameEngine = new GameEngine();
        this.renderer = new Renderer();
        this.inputManager = new InputManager();
        this.assetLoader = new AssetLoader();
        this.audioManager = new AudioManager();
        
        this.gameState = { current: 'LOADING' };
        this.lastTime = 0;
        this.isMobile = window.innerWidth <= 768;
        
        // ⭐ MOBIL VEZÉRLÉS ÁLLAPOTOK
        this.mobileControls = {
            steering: 0,
            gas: false,
            brake: false,
            isDragging: false,
            startAngle: 0,
            currentAngle: 0
        };
    }
    
    async init() {
        console.log('🎮 Játék inicializálás...');
        
        // ⭐ VÁRUNK A DOM BETÖLTÉSÉRE
        await this.waitForDOM();
        
        this.setupCanvas();
        await this.assetLoader.loadAssets();
        
        if (this.isMobile) {
            this.createMobileControls();
        }
        
        this.setupEventListeners();
        this.gameEngine.setMapImage('https://static.valasztas.hu/parval2002/onkweb/tart/inf/terkep2/borsod.jpg');
        
        await this.gameEngine.buildTrack(this.assetLoader);
        
        this.gameState.current = 'READY';
        this.hideLoading();
        this.gameLoop(0);
        
        console.log('✅ Játék inicializálva!');
    }
    
    // ⭐ DOM BETÖLTÉSÉRE VÁRÁS
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // ⭐ BETÖLTÉS KÉPERNYŐ ELREJTÉSE
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    setupCanvas() {
        // ⭐ CANVAS ELEM KERESÉSE
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            console.error('❌ gameCanvas elem nem található!');
            // ⭐ CANVAS LÉTREHOZÁSA, HA NINCS
            this.createCanvas();
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.renderer.setCanvas(this.canvas, this.ctx);
            console.log(`📐 Canvas méret: ${this.canvas.width}x${this.canvas.height}`);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        console.log('✅ Canvas beállítva');
    }
    
    // ⭐ CANVAS LÉTREHOZÁSA, HA NINCS
    createCanvas() {
        console.log('🎨 Canvas létrehozása...');
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        this.canvas.style.cssText = `
            display: block;
            background: #000;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1;
        `;
        
        document.body.appendChild(this.canvas);
        console.log('✅ Canvas létrehozva');
    }
    
    // ⭐ MOBIL VEZÉRLÉS LÉTREHOZÁSA
    createMobileControls() {
        console.log('📱 Mobil vezérlés létrehozása...');
        
        // ⭐ KORMÁNY KONTÉNER
        const steeringContainer = document.createElement('div');
        steeringContainer.id = 'steering-container';
        steeringContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 100px;
            height: 100px;
            z-index: 1000;
            touch-action: none;
            user-select: none;
            display: none;
        `;
        
        // ⭐ KORMÁNY CANVAS
        const steeringWheel = document.createElement('canvas');
        steeringWheel.id = 'steering-wheel';
        steeringWheel.width = 100;
        steeringWheel.height = 100;
        steeringWheel.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        const steeringCtx = steeringWheel.getContext('2d');
        this.drawSteering(steeringCtx, 0);
        
        steeringContainer.appendChild(steeringWheel);
        
        // ⭐ GOMB KONTÉNER
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'button-container';
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: none;
            flex-direction: column;
            gap: 15px;
            z-index: 1000;
        `;
        
        // ⭐ GÁZ GOMB
        const gasButton = document.createElement('button');
        gasButton.id = 'gas-button';
        gasButton.innerHTML = '⛽';
        gasButton.style.cssText = `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 3px solid #00ff00;
            background: rgba(0,255,0,0.2);
            color: white;
            font-size: 24px;
            touch-action: none;
            user-select: none;
            transition: all 0.1s;
        `;
        
        // ⭐ FÉK GOMB
        const brakeButton = document.createElement('button');
        brakeButton.id = 'brake-button';
        brakeButton.innerHTML = '🛑';
        brakeButton.style.cssText = `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 3px solid #ff0000;
            background: rgba(255,0,0,0.2);
            color: white;
            font-size: 24px;
            touch-action: none;
            user-select: none;
            transition: all 0.1s;
        `;
        
        buttonContainer.appendChild(gasButton);
        buttonContainer.appendChild(brakeButton);
        
        document.body.appendChild(steeringContainer);
        document.body.appendChild(buttonContainer);
        
        // ⭐ ESEMÉNY KEZELŐK
        this.setupSteeringEvents(steeringWheel, steeringCtx);
        this.setupButtonEvents(gasButton, brakeButton);
        
        console.log('✅ Mobil vezérlés létrehozva');
    }
    
    // ⭐ KORMÁNY RAJZOLÁSA
    drawSteering(ctx, angle) {
        const centerX = 50;
        const centerY = 50;
        const radius = 45;
        
        ctx.clearRect(0, 0, 100, 100);
        
        // ⭐ KÜLSŐ GYŰRŰ
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#2a2a2a';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // ⭐ BELSŐ GYŰRŰ
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        
        // ⭐ KÜLLŐK (FORGATVA)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 4; i++) {
            const spokeAngle = (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spokeAngle) * 15, Math.sin(spokeAngle) * 15);
            ctx.lineTo(Math.cos(spokeAngle) * 35, Math.sin(spokeAngle) * 35);
            ctx.stroke();
        }
        
        // ⭐ KÖZPONT
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#444';
        ctx.fill();
        
        // ⭐ FELSŐ JELZŐ
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -30, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // ⭐ KORMÁNY ESEMÉNYEK
    setupSteeringEvents(wheel, ctx) {
        const getAngle = (event) => {
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            
            return Math.atan2(clientY - centerY, clientX - centerX);
        };
        
        const startHandler = (event) => {
            event.preventDefault();
            this.mobileControls.isDragging = true;
            this.mobileControls.startAngle = getAngle(event);
        };
        
        const moveHandler = (event) => {
            if (!this.mobileControls.isDragging) return;
            event.preventDefault();
            
            const currentAngle = getAngle(event);
            let deltaAngle = currentAngle - this.mobileControls.startAngle;
            
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
            
            const maxAngle = Math.PI / 4;
            deltaAngle = Math.max(-maxAngle, Math.min(maxAngle, deltaAngle));
            
            this.mobileControls.currentAngle = deltaAngle;
            this.mobileControls.steering = deltaAngle / maxAngle;
            
            this.drawSteering(ctx, deltaAngle);
        };
        
        const endHandler = (event) => {
            event.preventDefault();
            this.mobileControls.isDragging = false;
            
            this.mobileControls.steering *= 0.9;
            this.mobileControls.currentAngle *= 0.9;
            this.drawSteering(ctx, this.mobileControls.currentAngle);
            
            if (Math.abs(this.mobileControls.steering) < 0.1) {
                this.mobileControls.steering = 0;
                this.mobileControls.currentAngle = 0;
                this.drawSteering(ctx, 0);
            }
        };
        
        wheel.addEventListener('touchstart', startHandler);
        wheel.addEventListener('touchmove', moveHandler);
        wheel.addEventListener('touchend', endHandler);
        wheel.addEventListener('mousedown', startHandler);
        wheel.addEventListener('mousemove', moveHandler);
        wheel.addEventListener('mouseup', endHandler);
    }
    
    // ⭐ GOMB ESEMÉNYEK
    setupButtonEvents(gasButton, brakeButton) {
        const gasStart = () => {
            this.mobileControls.gas = true;
            gasButton.style.background = 'rgba(0,255,0,0.6)';
            gasButton.style.transform = 'scale(0.95)';
        };
        
        const gasEnd = () => {
            this.mobileControls.gas = false;
            gasButton.style.background = 'rgba(0,255,0,0.2)';
            gasButton.style.transform = 'scale(1)';
        };
        
        gasButton.addEventListener('touchstart', gasStart);
        gasButton.addEventListener('touchend', gasEnd);
        gasButton.addEventListener('mousedown', gasStart);
        gasButton.addEventListener('mouseup', gasEnd);
        
        const brakeStart = () => {
            this.mobileControls.brake = true;
            brakeButton.style.background = 'rgba(255,0,0,0.6)';
            brakeButton.style.transform = 'scale(0.95)';
        };
        
        const brakeEnd = () => {
            this.mobileControls.brake = false;
            brakeButton.style.background = 'rgba(255,0,0,0.2)';
            brakeButton.style.transform = 'scale(1)';
        };
        
        brakeButton.addEventListener('touchstart', brakeStart);
        brakeButton.addEventListener('touchend', brakeEnd);
        brakeButton.addEventListener('mousedown', brakeStart);
        brakeButton.addEventListener('mouseup', brakeEnd);
    }
    
    // ⭐ MOBIL VEZÉRLÉS MEGJELENÍTÉSE/ELREJTÉSE
    toggleMobileControls(show) {
        if (!this.isMobile) return;
        
        const steeringContainer = document.getElementById('steering-container');
        const buttonContainer = document.getElementById('button-container');
        
        if (steeringContainer && buttonContainer) {
            steeringContainer.style.display = show ? 'block' : 'none';
            buttonContainer.style.display = show ? 'flex' : 'none';
        }
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            this.inputManager.handleKeyDown(event);
            
            if (event.code === 'Space' && this.gameState.current === 'READY') {
                this.startGame();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.inputManager.handleKeyUp(event);
        });
        
        if (this.isMobile) {
            this.canvas.addEventListener('touchstart', (event) => {
                if (this.gameState.current === 'READY') {
                    event.preventDefault();
                    this.startGame();
                }
            });
        }
    }
    
    startGame() {
        this.gameState.current = 'PLAYING';
        this.gameEngine.game.raceStartTime = Date.now();
        this.toggleMobileControls(true);
        this.audioManager.startBackgroundMusic();
        console.log('🏁 Játék elindítva!');
    }
    
    update(dt) {
        if (this.isMobile) {
            this.inputManager.mobileInput = {
                left: this.mobileControls.steering < -0.1,
                right: this.mobileControls.steering > 0.1,
                gas: this.mobileControls.gas,
                brake: this.mobileControls.brake,
                steering: this.mobileControls.steering
            };
        }
        
        this.gameEngine.update(dt, this.gameState, this.inputManager, this.audioManager);
    }
    
    render() {
        this.renderer.render(this.gameEngine.game, this.gameState, this.assetLoader.getAssets());
    }
    
    gameLoop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016);
        this.lastTime = currentTime;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ⭐ JÁTÉK INDÍTÁSA DOM BETÖLTÉS UTÁN
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const game = new Game();
        game.init().catch(console.error);
    });
} else {
    const game = new Game();
    game.init().catch(console.error);
}
