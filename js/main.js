import { GameEngine } from './core/GameEngine.js';
import { AssetLoader } from './core/AssetLoader.js';
import { InputManager } from './core/InputManager.js';
import { Renderer } from './graphics/Renderer.js';
import { AudioManager } from './audio/AudioManager.js';

class OutRunRacing {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.scale = 2;
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.assetLoader = new AssetLoader();
        this.inputManager = new InputManager();
        this.gameEngine = new GameEngine();
        this.renderer = new Renderer();
        this.audioManager = new AudioManager();
        this.mapImagePath = 'assets/map-bazpng'; // Példa térkép

        // ⭐ KORMÁNYOS MOBIL VEZÉRLÉS
        this.mobileControls = {
            steeringAngle: 0,      // Kormány elfordulása (-45° és +45° között)
            steeringInput: 0,      // Tényleges input érték (-1 és 1 között)
            accelerating: false,
            braking: false,
            nitro: false,
            isDragging: false,
            lastTouchAngle: 0,
            steeringWheel: null,
            gasButton: null,
            brakeButton: null,
            nitroButton: null
        };
        
        this.gameState = {
            current: 'LOADING',
            loadingProgress: 0,
            loadingText: 'Loading...'
        };
        
        this.init();
    }
    
    async init() {
        console.log('🏎️ OutRun Racing inicializálása...');
        
        this.createCanvas();
        this.gameLoop();
        
        await this.simulateLoading();
        await this.assetLoader.loadAssets();
        
        this.audioManager.setMobile(this.isMobile);
        this.audioManager.init();
        
        this.gameEngine.buildTrack(this.assetLoader);
        this.inputManager.setupControls(this);
        this.audioManager.createMuteButton();
        
        if (this.isMobile) {
            this.createSteeringControls();
        }
        
        this.gameState.current = 'INTRO';
        console.log('✅ Játék betöltve!');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        
        if (this.isMobile) {
            this.width = 600;
            this.height = 400;
            this.scale = 1.5;
        }
        
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.canvas.style.cssText = `
            image-rendering: pixelated;
            width: 100%;
            max-width: 800px;
            height: auto;
            display: block;
            margin: 0 auto;
            touch-action: none;
            background: #000;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        document.body.appendChild(this.canvas);
        
        this.renderer.setCanvas(this.canvas, this.ctx);
        this.renderer.setMobile(this.isMobile);
    }
    
    // ⭐ KORMÁNYOS VEZÉRLÉS LÉTREHOZÁSA
    createSteeringControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 250px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        // ⭐ KORMÁNYKERÉK KONTÉNER
        const steeringContainer = document.createElement('div');
        steeringContainer.style.cssText = `
            position: absolute;
            left: 20px;
            bottom: 20px;
            width: 150px;
            height: 150px;
            pointer-events: auto;
        `;
        
        // ⭐ KORMÁNYKERÉK ELEM
        const steeringWheel = document.createElement('div');
        steeringWheel.style.cssText = `
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
            border: 3px solid #444;
            position: relative;
            cursor: grab;
            box-shadow: 
                inset 0 0 20px rgba(0,0,0,0.5),
                0 5px 15px rgba(0,0,0,0.3);
            transition: transform 0.1s ease-out;
        `;
        
        // ⭐ KORMÁNY KÜLLŐK
        const spokes = document.createElement('div');
        spokes.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; width: 2px; height: 60px; background: #666; transform: translate(-50%, -50%) rotate(0deg);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 60px; height: 2px; background: #666; transform: translate(-50%, -50%) rotate(0deg);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 2px; height: 60px; background: #666; transform: translate(-50%, -50%) rotate(90deg);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 60px; height: 2px; background: #666; transform: translate(-50%, -50%) rotate(90deg);"></div>
        `;
        steeringWheel.appendChild(spokes);
        
        // ⭐ KÖZPONTI RÉSZ
        const center = document.createElement('div');
        center.innerHTML = '🏎️';
        center.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 2px solid #555;
        `;
        steeringWheel.appendChild(center);
        
        // ⭐ CÍMKE
        const steeringLabel = document.createElement('div');
        steeringLabel.textContent = 'KORMÁNY';
        steeringLabel.style.cssText = `
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 12px;
            font-family: Arial;
            text-align: center;
        `;
        
        steeringContainer.appendChild(steeringWheel);
        steeringContainer.appendChild(steeringLabel);
        
        // ⭐ GÁZ GOMB
        const gasButton = document.createElement('div');
        gasButton.innerHTML = `
            <div style="font-size: 24px;">⬆️</div>
            <div style="font-size: 12px;">GÁZ</div>
        `;
        gasButton.style.cssText = `
            position: absolute;
            right: 20px;
            bottom: 120px;
            width: 80px;
            height: 60px;
            background: linear-gradient(145deg, #00AA00, #008800);
            border: 2px solid #00FF00;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial;
            pointer-events: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        
        // ⭐ FÉK GOMB
        const brakeButton = document.createElement('div');
        brakeButton.innerHTML = `
            <div style="font-size: 24px;">⬇️</div>
            <div style="font-size: 12px;">FÉK</div>
        `;
        brakeButton.style.cssText = `
            position: absolute;
            right: 20px;
            bottom: 50px;
            width: 80px;
            height: 60px;
            background: linear-gradient(145deg, #AA0000, #880000);
            border: 2px solid #FF0000;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial;
            pointer-events: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        
        // ⭐ NITRO GOMB
        const nitroButton = document.createElement('div');
        nitroButton.innerHTML = `
            <div style="font-size: 20px;">🚀</div>
            <div style="font-size: 10px;">NITRO</div>
        `;
        nitroButton.style.cssText = `
            position: absolute;
            right: 120px;
            bottom: 85px;
            width: 70px;
            height: 50px;
            background: linear-gradient(145deg, #FF4444, #FF6666);
            border: 2px solid #FFFF00;
            border-radius: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial;
            pointer-events: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        
        // ⭐ REFERENCIÁK MENTÉSE
        this.mobileControls.steeringWheel = steeringWheel;
        this.mobileControls.gasButton = gasButton;
        this.mobileControls.brakeButton = brakeButton;
        this.mobileControls.nitroButton = nitroButton;
        
        // ⭐ ÖSSZEÁLLÍTÁS
        controlsContainer.appendChild(steeringContainer);
        controlsContainer.appendChild(gasButton);
        controlsContainer.appendChild(brakeButton);
        controlsContainer.appendChild(nitroButton);
        
        document.body.appendChild(controlsContainer);
        
        // ⭐ EVENT LISTENER-EK BEÁLLÍTÁSA
        this.setupSteeringWheelEvents();
        this.setupButtonEvents();
    }
    
    // ⭐ KORMÁNYKERÉK ESEMÉNYEK
    setupSteeringWheelEvents() {
        const wheel = this.mobileControls.steeringWheel;
        
        // ⭐ TOUCH START
        wheel.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.isDragging = true;
            wheel.style.cursor = 'grabbing';
            wheel.style.boxShadow = `
                inset 0 0 20px rgba(0,0,0,0.7),
                0 2px 8px rgba(0,0,0,0.5)
            `;
            
            const touch = e.touches[0];
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            this.mobileControls.lastTouchAngle = Math.atan2(
                touch.clientY - centerY,
                touch.clientX - centerX
            ) * 180 / Math.PI;
        });
        
        // ⭐ TOUCH MOVE - KORMÁNY TEKERÉSE
        wheel.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.mobileControls.isDragging) return;
            
            const touch = e.touches[0];
            const rect = wheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const currentAngle = Math.atan2(
                touch.clientY - centerY,
                touch.clientX - centerX
            ) * 180 / Math.PI;
            
            let angleDiff = currentAngle - this.mobileControls.lastTouchAngle;
            
            // ⭐ SZÖG NORMALIZÁLÁS
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            
            // ⭐ KORMÁNY ELFORDÍTÁSA
            this.mobileControls.steeringAngle += angleDiff * 0.5; // Érzékenység
            this.mobileControls.steeringAngle = Math.max(-45, Math.min(45, this.mobileControls.steeringAngle));
            
            // ⭐ INPUT ÉRTÉK SZÁMÍTÁSA
            this.mobileControls.steeringInput = this.mobileControls.steeringAngle / 45;
            
            // ⭐ VIZUÁLIS FRISSÍTÉS
            wheel.style.transform = `rotate(${this.mobileControls.steeringAngle}deg)`;
            
            // ⭐ INPUT MANAGER FRISSÍTÉSE
            this.inputManager.keys['ArrowLeft'] = this.mobileControls.steeringInput < -0.1;
            this.inputManager.keys['ArrowRight'] = this.mobileControls.steeringInput > 0.1;
            
            this.mobileControls.lastTouchAngle = currentAngle;
        });
        
        // ⭐ TOUCH END
        wheel.addEventListener('touchend', () => {
            this.mobileControls.isDragging = false;
            wheel.style.cursor = 'grab';
            wheel.style.boxShadow = `
                inset 0 0 20px rgba(0,0,0,0.5),
                0 5px 15px rgba(0,0,0,0.3)
            `;
            
            // ⭐ KORMÁNY VISSZATÉRÍTÉSE KÖZÉPRE
            this.returnSteeringToCenter();
        });
        
        // ⭐ TOUCH CANCEL
        wheel.addEventListener('touchcancel', () => {
            this.mobileControls.isDragging = false;
            wheel.style.cursor = 'grab';
            this.returnSteeringToCenter();
        });
    }
    
    // ⭐ KORMÁNY VISSZATÉRÍTÉSE KÖZÉPRE
    returnSteeringToCenter() {
        const returnSpeed = 0.1;
        
        const returnAnimation = () => {
            if (Math.abs(this.mobileControls.steeringAngle) > 1) {
                this.mobileControls.steeringAngle *= (1 - returnSpeed);
                this.mobileControls.steeringInput = this.mobileControls.steeringAngle / 45;
                
                this.mobileControls.steeringWheel.style.transform = `rotate(${this.mobileControls.steeringAngle}deg)`;
                
                // ⭐ INPUT MANAGER FRISSÍTÉSE
                this.inputManager.keys['ArrowLeft'] = this.mobileControls.steeringInput < -0.1;
                this.inputManager.keys['ArrowRight'] = this.mobileControls.steeringInput > 0.1;
                
                requestAnimationFrame(returnAnimation);
            } else {
                this.mobileControls.steeringAngle = 0;
                this.mobileControls.steeringInput = 0;
                this.mobileControls.steeringWheel.style.transform = 'rotate(0deg)';
                this.inputManager.keys['ArrowLeft'] = false;
                this.inputManager.keys['ArrowRight'] = false;
            }
        };
        
        returnAnimation();
    }
    
    // ⭐ GOMB ESEMÉNYEK
    setupButtonEvents() {
        // ⭐ GÁZ GOMB
        this.mobileControls.gasButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.accelerating = true;
            this.inputManager.keys['ArrowUp'] = true;
            this.mobileControls.gasButton.style.transform = 'scale(0.95)';
            this.mobileControls.gasButton.style.background = 'linear-gradient(145deg, #00CC00, #00AA00)';
        });
        
        this.mobileControls.gasButton.addEventListener('touchend', () => {
            this.mobileControls.accelerating = false;
            this.inputManager.keys['ArrowUp'] = false;
            this.mobileControls.gasButton.style.transform = 'scale(1)';
            this.mobileControls.gasButton.style.background = 'linear-gradient(145deg, #00AA00, #008800)';
        });
        
        // ⭐ FÉK GOMB
        this.mobileControls.brakeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.braking = true;
            this.inputManager.keys['ArrowDown'] = true;
            this.mobileControls.brakeButton.style.transform = 'scale(0.95)';
            this.mobileControls.brakeButton.style.background = 'linear-gradient(145deg, #CC0000, #AA0000)';
        });
        
        this.mobileControls.brakeButton.addEventListener('touchend', () => {
            this.mobileControls.braking = false;
            this.inputManager.keys['ArrowDown'] = false;
            this.mobileControls.brakeButton.style.transform = 'scale(1)';
            this.mobileControls.brakeButton.style.background = 'linear-gradient(145deg, #AA0000, #880000)';
        });
        
        // ⭐ NITRO GOMB
        this.mobileControls.nitroButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.nitro = true;
            this.inputManager.keys['Space'] = true;
            this.mobileControls.nitroButton.style.transform = 'scale(0.95)';
            this.mobileControls.nitroButton.style.background = 'linear-gradient(145deg, #FF6666, #FF8888)';
        });
        
        this.mobileControls.nitroButton.addEventListener('touchend', () => {
            this.mobileControls.nitro = false;
            this.inputManager.keys['Space'] = false;
            this.mobileControls.nitroButton.style.transform = 'scale(1)';
            this.mobileControls.nitroButton.style.background = 'linear-gradient(145deg, #FF4444, #FF6666)';
        });
    }
    
    async simulateLoading() {
        const steps = ['Loading Engine...', 'Loading Assets...', 'Building Track...', 'Ready!'];
        
        for (let i = 0; i < steps.length; i++) {
            this.gameState.loadingProgress = (i / steps.length) * 100;
            this.gameState.loadingText = steps[i];
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.gameState.loadingProgress = 100;
    }
    
    update(dt) {
        this.gameEngine.update(dt, this.gameState, this.inputManager, this.audioManager);
    }
    
    render() {
        this.renderer.render(this.gameState, this.gameEngine, this.assetLoader);
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

window.addEventListener('load', () => {
    new OutRunRacing();
});
