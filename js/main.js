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
        
        try {
            // ⭐ CANVAS BEÁLLÍTÁSA ELŐSZÖR
            await this.ensureCanvas();
            
            // ⭐ ASSET BETÖLTÉS
            await this.assetLoader.loadAssets();
            
            // ⭐ MOBIL VEZÉRLÉS
            if (this.isMobile) {
                this.createMobileControls();
            }
            
            // ⭐ ESEMÉNYEK
            this.setupEventListeners();
            
            // ⭐ TÉRKÉP ÉS PÁLYA
            this.gameEngine.setMapImage('assets/map-baz.png');

            await this.gameEngine.buildTrack(this.assetLoader);
            
            // ⭐ JÁTÉK KÉSZ
            this.gameState.current = 'READY';
            this.hideLoading();
            this.gameLoop(0);
            
            console.log('✅ Játék inicializálva!');
            
        } catch (error) {
            console.error('❌ Játék inicializálási hiba:', error);
            this.showError('Játék betöltési hiba!');
        }
    }
    
   createSteeringControls() {
    if (!this.isMobile) return;
    
    console.log('📱 Mobil kormány vezérlés létrehozása...');
    
    // ⭐ KORMÁNY ASSET LEKÉRÉSE
    const steeringWheelAsset = this.assetLoader.getSteeringWheelAsset();
    
    const steeringContainer = document.createElement('div');
    steeringContainer.id = 'steering-container';
    steeringContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 120px;
        height: 120px;
        z-index: 1000;
        touch-action: none;
        user-select: none;
    `;
    
    const steeringWheel = document.createElement('canvas');
    steeringWheel.id = 'steering-wheel';
    steeringWheel.width = 120;
    steeringWheel.height = 120;
    steeringWheel.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        background: radial-gradient(circle, #333, #111);
    `;
    
    const ctx = steeringWheel.getContext('2d');
    
    // ⭐ KORMÁNY ASSET RAJZOLÁSA
    if (steeringWheelAsset) {
        try {
            ctx.drawImage(steeringWheelAsset, 0, 0, 120, 120);
            console.log('✅ Kormány asset sikeresen rajzolva mobilon');
        } catch (error) {
            console.warn('⚠️ Kormány asset rajzolási hiba:', error);
            this.drawFallbackSteering(ctx);
        }
    } else {
        console.warn('⚠️ Kormány asset nem elérhető, fallback rajzolás');
        this.drawFallbackSteering(ctx);
    }
    
    steeringContainer.appendChild(steeringWheel);
    
    // ⭐ GOMB KONTÉNER
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
    `;
    
    // ⭐ GÁZ GOMB
    const gasButton = document.createElement('button');
    gasButton.innerHTML = '⛽';
    gasButton.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 3px solid #00ff00;
        background: rgba(0,255,0,0.2);
        color: white;
        font-size: 24px;
        touch-action: none;
        user-select: none;
    `;
    
    // ⭐ FÉK GOMB
    const brakeButton = document.createElement('button');
    brakeButton.innerHTML = '🛑';
    brakeButton.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 3px solid #ff0000;
        background: rgba(255,0,0,0.2);
        color: white;
        font-size: 24px;
        touch-action: none;
        user-select: none;
    `;
    
    buttonContainer.appendChild(gasButton);
    buttonContainer.appendChild(brakeButton);
    
    document.body.appendChild(steeringContainer);
    document.body.appendChild(buttonContainer);
    
    // ⭐ TOUCH ESEMÉNYEK
    this.setupSteeringEvents(steeringWheel);
    this.setupButtonEvents(gasButton, brakeButton);
    
    console.log('✅ Mobil vezérlés létrehozva kormány asset-tel');
}

// ⭐ FALLBACK KORMÁNY RAJZOLÁS
drawFallbackSteering(ctx) {
    const centerX = 60;
    const centerY = 60;
    
    // Külső gyűrű
    ctx.beginPath();
    ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    
    // Belső gyűrű
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();
    
    // Küllők
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 20, centerY + Math.sin(angle) * 20);
        ctx.lineTo(centerX + Math.cos(angle) * 45, centerY + Math.sin(angle) * 45);
        ctx.stroke();
    }
    
    // Központ
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#444444';
    ctx.fill();
    
    console.log('🎨 Fallback kormány rajzolva');
}

    
    // ⭐ KORMÁNYKERÉK ESEMÉNYEK
    setupSteeringWheelEvents() {
        const wheel = this.mobileControls.steeringWheel;
        
        ctx.clearRect(0, 0, 100, 100);
        
        // ⭐ KÜLSŐ GYŰRŰ
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#2a2a2a';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // ⭐ BELSŐ GYŰRŰ
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        
        // ⭐ KÜLLŐK (FORGATVA)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 4; i++) {
            const spokeAngle = (i * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(spokeAngle) * 12, Math.sin(spokeAngle) * 12);
            ctx.lineTo(Math.cos(spokeAngle) * 32, Math.sin(spokeAngle) * 32);
            ctx.stroke();
        }
        
        // ⭐ KÖZPONT
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#444';
        ctx.fill();
        
        // ⭐ FELSŐ JELZŐ
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -28, 2, 0, Math.PI * 2);
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
            
            // ⭐ VISSZAÁLLÁS KÖZÉPRE
            const resetSteering = () => {
                this.mobileControls.steering *= 0.8;
                this.mobileControls.currentAngle *= 0.8;
                this.drawSteering(ctx, this.mobileControls.currentAngle);
                
                if (Math.abs(this.mobileControls.steering) > 0.05) {
                    requestAnimationFrame(resetSteering);
                } else {
                    this.mobileControls.steering = 0;
                    this.mobileControls.currentAngle = 0;
                    this.drawSteering(ctx, 0);
                }
            };
            
            resetSteering();
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
        // ⭐ GÁZ GOMB
        const gasStart = (event) => {
            event.preventDefault();
            this.mobileControls.gas = true;
            gasButton.style.background = 'rgba(0,255,0,0.6)';
            gasButton.style.transform = 'scale(0.95)';
        };
        
        const gasEnd = (event) => {
            event.preventDefault();
            this.mobileControls.gas = false;
            gasButton.style.background = 'rgba(0,255,0,0.2)';
            gasButton.style.transform = 'scale(1)';
        };
        
        gasButton.addEventListener('touchstart', gasStart);
        gasButton.addEventListener('touchend', gasEnd);
        gasButton.addEventListener('mousedown', gasStart);
        gasButton.addEventListener('mouseup', gasEnd);
        
        // ⭐ FÉK GOMB
        const brakeStart = (event) => {
            event.preventDefault();
            this.mobileControls.brake = true;
            brakeButton.style.background = 'rgba(255,0,0,0.6)';
            brakeButton.style.transform = 'scale(0.95)';
        };
        
        const brakeEnd = (event) => {
            event.preventDefault();
            this.mobileControls.brake = false;
            brakeButton.style.background = 'rgba(255,0,0,0.2)';
            brakeButton.style.transform = 'scale(1)';
        };
        
        brakeButton.addEventListener('touchstart', brakeStart);
        brakeButton.addEventListener('touchend', brakeEnd);
        brakeButton.addEventListener('mousedown', brakeStart);
        brakeButton.addEventListener('mouseup', brakeEnd);
    }
    
    // ⭐ MOBIL VEZÉRLÉS TOGGLE
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
                event.preventDefault();
                this.startGame();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.inputManager.handleKeyUp(event);
        });
        
        // ⭐ MOBIL TOUCH START
        if (this.isMobile && this.canvas) {
            this.canvas.addEventListener('touchstart', (event) => {
                if (this.gameState.current === 'READY') {
                    event.preventDefault();
                    this.startGame();
                }
            });
        }
        
        // ⭐ CLICK START (DESKTOP)
        if (this.canvas) {
            this.canvas.addEventListener('click', (event) => {
                if (this.gameState.current === 'READY') {
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
        if (this.ctx && this.canvas) {
            this.renderer.render(this.gameEngine.game, this.gameState, this.assetLoader.getAssets());
        }
    }
    
    gameLoop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016);
        this.lastTime = currentTime;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ⭐ JÁTÉK INDÍTÁSA
const game = new Game();
game.init().catch(error => {
    console.error('❌ Játék indítási hiba:', error);
});

export { Game };
