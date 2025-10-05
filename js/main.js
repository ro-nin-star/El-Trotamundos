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
        
        // ⭐ MOBIL VEZÉRLÉS ÁLLAPOTOK
        this.mobileControls = {
            steering: 0,        // -1 (bal) és 1 (jobb) között
            accelerating: false,
            braking: false,
            nitro: false,
            touchStartX: 0,
            touchStartY: 0,
            steeringZone: null,
            gasZone: null,
            brakeZone: null,
            nitroZone: null
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
            this.createMobileControls();
            this.setupMobileTouchHandlers();
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
    
    // ⭐ ÚJRAÍRT MOBIL VEZÉRLÉS - AUTÓS JÁTÉKHOZ OPTIMALIZÁLT
    createMobileControls() {
        // ⭐ FŐKONTÉNER
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        // ⭐ KORMÁNY ZÓNA (BAL OLDAL)
        const steeringZone = document.createElement('div');
        steeringZone.innerHTML = `
            <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: white; font-size: 14px; text-align: center;">
                🏎️ KORMÁNY
            </div>
            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: #aaa; font-size: 12px; text-align: center;">
                Húzd balra/jobbra
            </div>
        `;
        steeringZone.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(45deg, rgba(0,100,200,0.3), rgba(0,150,255,0.2));
            border: 2px solid rgba(0,255,255,0.5);
            border-radius: 15px 0 0 15px;
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;
        
        // ⭐ GÁZ/FÉK ZÓNA (JOBB OLDAL)
        const gasZone = document.createElement('div');
        gasZone.innerHTML = `
            <div style="display: flex; height: 100%; flex-direction: column;">
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(0,255,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.3);">
                    <div style="text-align: center; color: white;">
                        <div style="font-size: 24px;">⬆️</div>
                        <div style="font-size: 12px;">GÁZ</div>
                    </div>
                </div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,0,0,0.2);">
                    <div style="text-align: center; color: white;">
                        <div style="font-size: 24px;">⬇️</div>
                        <div style="font-size: 12px;">FÉK</div>
                    </div>
                </div>
            </div>
        `;
        gasZone.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            width: 50%;
            height: 100%;
            border: 2px solid rgba(0,255,255,0.5);
            border-radius: 0 15px 15px 0;
            pointer-events: auto;
        `;
        
        // ⭐ NITRO GOMB (KÖZÉP FELÜL)
        const nitroButton = document.createElement('div');
        nitroButton.innerHTML = `
            <div style="font-size: 20px;">🚀</div>
            <div style="font-size: 10px;">NITRO</div>
        `;
        nitroButton.style.cssText = `
            position: absolute;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 50px;
            background: linear-gradient(45deg, #FF4444, #FF6666);
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
        `;
        
        // ⭐ REFERENCIÁK MENTÉSE
        this.mobileControls.steeringZone = steeringZone;
        this.mobileControls.gasZone = gasZone;
        this.mobileControls.nitroZone = nitroButton;
        
        // ⭐ ÖSSZEÁLLÍTÁS
        controlsContainer.appendChild(steeringZone);
        controlsContainer.appendChild(gasZone);
        controlsContainer.appendChild(nitroButton);
        
        document.body.appendChild(controlsContainer);
    }
    
    // ⭐ TOUCH EVENT KEZELŐK
    setupMobileTouchHandlers() {
        // ⭐ KORMÁNY KEZELÉS
        this.setupSteeringControls();
        
        // ⭐ GÁZ/FÉK KEZELÉS
        this.setupGasBrakeControls();
        
        // ⭐ NITRO KEZELÉS
        this.setupNitroControls();
        
        // ⭐ GLOBÁLIS TOUCH END
        document.addEventListener('touchend', () => {
            this.resetMobileControls();
        });
        
        document.addEventListener('touchcancel', () => {
            this.resetMobileControls();
        });
    }
    
    // ⭐ KORMÁNY VEZÉRLÉS BEÁLLÍTÁSA
    setupSteeringControls() {
        const steeringZone = this.mobileControls.steeringZone;
        
        steeringZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = steeringZone.getBoundingClientRect();
            this.mobileControls.touchStartX = touch.clientX - rect.left;
            steeringZone.style.background = 'linear-gradient(45deg, rgba(0,150,255,0.6), rgba(0,200,255,0.4))';
        });
        
        steeringZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = steeringZone.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const deltaX = currentX - this.mobileControls.touchStartX;
            const maxDelta = rect.width / 3; // Érzékenység
            
            // ⭐ KORMÁNY ÉRTÉK SZÁMÍTÁSA (-1 és 1 között)
            this.mobileControls.steering = Math.max(-1, Math.min(1, deltaX / maxDelta));
            
            // ⭐ INPUT MANAGER FRISSÍTÉSE
            this.inputManager.keys['ArrowLeft'] = this.mobileControls.steering < -0.1;
            this.inputManager.keys['ArrowRight'] = this.mobileControls.steering > 0.1;
        });
        
        steeringZone.addEventListener('touchend', () => {
            this.mobileControls.steering = 0;
            this.inputManager.keys['ArrowLeft'] = false;
            this.inputManager.keys['ArrowRight'] = false;
            steeringZone.style.background = 'linear-gradient(45deg, rgba(0,100,200,0.3), rgba(0,150,255,0.2))';
        });
    }
    
    // ⭐ GÁZ/FÉK VEZÉRLÉS BEÁLLÍTÁSA
    setupGasBrakeControls() {
        const gasZone = this.mobileControls.gasZone;
        
        gasZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = gasZone.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
            const zoneHeight = rect.height;
            
            if (touchY < zoneHeight / 2) {
                // ⭐ FELSŐ FÉL - GÁZ
                this.mobileControls.accelerating = true;
                this.inputManager.keys['ArrowUp'] = true;
                this.inputManager.keys['ArrowDown'] = false;
            } else {
                // ⭐ ALSÓ FÉL - FÉK
                this.mobileControls.braking = true;
                this.inputManager.keys['ArrowDown'] = true;
                this.inputManager.keys['ArrowUp'] = false;
            }
        });
        
        gasZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = gasZone.getBoundingClientRect();
            const touchY = touch.clientY - rect.top;
            const zoneHeight = rect.height;
            
            // ⭐ DINAMIKUS VÁLTÁS GÁZ ÉS FÉK KÖZÖTT
            if (touchY < zoneHeight / 2) {
                if (!this.mobileControls.accelerating) {
                    this.mobileControls.accelerating = true;
                    this.mobileControls.braking = false;
                    this.inputManager.keys['ArrowUp'] = true;
                    this.inputManager.keys['ArrowDown'] = false;
                }
            } else {
                if (!this.mobileControls.braking) {
                    this.mobileControls.braking = true;
                    this.mobileControls.accelerating = false;
                    this.inputManager.keys['ArrowDown'] = true;
                    this.inputManager.keys['ArrowUp'] = false;
                }
            }
        });
        
        gasZone.addEventListener('touchend', () => {
            this.mobileControls.accelerating = false;
            this.mobileControls.braking = false;
            this.inputManager.keys['ArrowUp'] = false;
            this.inputManager.keys['ArrowDown'] = false;
        });
    }
    
    // ⭐ NITRO VEZÉRLÉS BEÁLLÍTÁSA
    setupNitroControls() {
        const nitroZone = this.mobileControls.nitroZone;
        
        nitroZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.nitro = true;
            this.inputManager.keys['Space'] = true;
            nitroZone.style.background = 'linear-gradient(45deg, #FF6666, #FF8888)';
            nitroZone.style.transform = 'translateX(-50%) scale(0.95)';
        });
        
        nitroZone.addEventListener('touchend', () => {
            this.mobileControls.nitro = false;
            this.inputManager.keys['Space'] = false;
            nitroZone.style.background = 'linear-gradient(45deg, #FF4444, #FF6666)';
            nitroZone.style.transform = 'translateX(-50%) scale(1)';
        });
    }
    
    // ⭐ MOBIL VEZÉRLÉS VISSZAÁLLÍTÁSA
    resetMobileControls() {
        this.mobileControls.steering = 0;
        this.mobileControls.accelerating = false;
        this.mobileControls.braking = false;
        this.mobileControls.nitro = false;
        
        // ⭐ INPUT MANAGER TISZTÍTÁSA
        this.inputManager.keys['ArrowLeft'] = false;
        this.inputManager.keys['ArrowRight'] = false;
        this.inputManager.keys['ArrowUp'] = false;
        this.inputManager.keys['ArrowDown'] = false;
        this.inputManager.keys['Space'] = false;
        
        // ⭐ VIZUÁLIS VISSZAJELZÉS VISSZAÁLLÍTÁSA
        if (this.mobileControls.steeringZone) {
            this.mobileControls.steeringZone.style.background = 'linear-gradient(45deg, rgba(0,100,200,0.3), rgba(0,150,255,0.2))';
        }
        
        if (this.mobileControls.nitroZone) {
            this.mobileControls.nitroZone.style.background = 'linear-gradient(45deg, #FF4444, #FF6666)';
            this.mobileControls.nitroZone.style.transform = 'translateX(-50%) scale(1)';
        }
        
        // ⭐ RESTART TÁMOGATÁS
        if (this.gameEngine.game.finished) {
            this.inputManager.keys['Enter'] = true;
            setTimeout(() => {
                this.inputManager.keys['Enter'] = false;
            }, 100);
        }
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
