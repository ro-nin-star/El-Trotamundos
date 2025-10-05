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
        
        // ⭐ MOBIL DETEKTÁLÁS
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Komponensek
        this.assetLoader = new AssetLoader();
        this.inputManager = new InputManager();
        this.gameEngine = new GameEngine();
        this.renderer = new Renderer();
        this.audioManager = new AudioManager();
        
        this.gameState = {
            current: 'LOADING',
            loadingProgress: 0,
            introAccepted: false
        };
        
        this.init();
    }
    
    async init() {
        console.log('🏎️ OutRun Racing inicializálása...');
        console.log('📱 Mobil eszköz:', this.isMobile);
        
        this.createCanvas();
        this.gameLoop();
        
        await this.simulateLoading();
        await this.assetLoader.loadAssets();
        this.audioManager.init();
        this.gameEngine.buildTrack(this.assetLoader);
        this.inputManager.setupControls(this);
        this.audioManager.createMuteButton();
        
        // ⭐ MOBIL VEZÉRLŐK
        if (this.isMobile) {
            this.createMobileControls();
        }
        
        this.gameState.current = 'INTRO';
        console.log('✅ Játék betöltve!');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        
        // ⭐ MOBIL OPTIMALIZÁCIÓ
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
        
        // ⭐ DEBUG: Ellenőrizzük a renderer metódusokat
        console.log('🔍 Renderer metódusok:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.renderer)));
        console.log('🔍 setMobile létezik?', typeof this.renderer.setMobile);
        
        // Komponenseknek átadjuk a canvas-t
        this.renderer.setCanvas(this.canvas, this.ctx);
        
        // ⭐ BIZTONSÁGOS setMobile HÍVÁS
        if (typeof this.renderer.setMobile === 'function') {
            this.renderer.setMobile(this.isMobile);
        } else {
            console.error('❌ setMobile metódus nem létezik a Renderer-ben!');
            // Fallback: hozzáadjuk a metódust
            this.renderer.setMobile = (isMobile) => {
                this.renderer.isMobile = isMobile;
                console.log('✅ Fallback setMobile:', isMobile);
            };
            this.renderer.setMobile(this.isMobile);
        }
    }
    
    // ⭐ MOBIL VEZÉRLŐK LÉTREHOZÁSA
    createMobileControls() {
        console.log('📱 Mobil vezérlők létrehozása...');
        
        const mobileControls = document.createElement('div');
        mobileControls.id = 'mobileControls';
        mobileControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 1000;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        `;
        
        // Vezérlő gombok
        const steerLeft = this.createMobileButton('⬅️', 'BALRA');
        const steerRight = this.createMobileButton('➡️', 'JOBBRA');
        const accelerate = this.createMobileButton('⬆️', 'GÁZ');
        const brake = this.createMobileButton('⬇️', 'FÉK');
        const nitro = this.createMobileButton('🚀', 'NITRO');
        nitro.style.backgroundColor = '#FF4444';
        
        mobileControls.appendChild(steerLeft);
        mobileControls.appendChild(brake);
        mobileControls.appendChild(accelerate);
        mobileControls.appendChild(steerRight);
        mobileControls.appendChild(nitro);
        
        // Event listenerek
        this.setupMobileButton(steerLeft, 'ArrowLeft');
        this.setupMobileButton(steerRight, 'ArrowRight');
        this.setupMobileButton(accelerate, 'ArrowUp');
        this.setupMobileButton(brake, 'ArrowDown');
        this.setupMobileButton(nitro, 'Space');
        
        document.body.appendChild(mobileControls);
        
        console.log('✅ Mobil vezérlők létrehozva');
    }
    
    createMobileButton(emoji, text) {
        const button = document.createElement('div');
        button.innerHTML = `<div style="font-size: 24px;">${emoji}</div><div style="font-size: 10px;">${text}</div>`;
        button.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00FFFF;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            cursor: pointer;
            transition: all 0.1s;
            touch-action: manipulation;
        `;
        
        return button;
    }
    
    setupMobileButton(button, keyCode) {
        const onStart = (e) => {
            e.preventDefault();
            this.inputManager.keys[keyCode] = true;
            button.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
            button.style.transform = 'scale(0.95)';
            
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        };
        
        const onEnd = (e) => {
            e.preventDefault();
            this.inputManager.keys[keyCode] = false;
            button.style.backgroundColor = keyCode === 'Space' ? '#FF4444' : 'rgba(0, 0, 0, 0.7)';
            button.style.transform = 'scale(1)';
        };
        
        button.addEventListener('touchstart', onStart, { passive: false });
        button.addEventListener('touchend', onEnd, { passive: false });
        button.addEventListener('touchcancel', onEnd, { passive: false });
        button.addEventListener('mousedown', onStart);
        button.addEventListener('mouseup', onEnd);
        button.addEventListener('mouseleave', onEnd);
    }
    
    async simulateLoading() {
        return new Promise((resolve) => {
            const steps = [
                'Initializing Racing Engine...',
                'Loading Lotus Sprites...',
                'Generating Track Data...',
                'Setting up Audio System...',
                'Calibrating Speedometer...',
                'Ready to Race!'
            ];
            
            let currentStep = 0;
            const interval = setInterval(() => {
                this.gameState.loadingProgress = (currentStep / steps.length) * 100;
                this.gameState.loadingText = steps[currentStep];
                
                currentStep++;
                
                if (currentStep >= steps.length) {
                    clearInterval(interval);
                    this.gameState.loadingProgress = 100;
                    setTimeout(resolve, 500);
                }
            }, 800);
        });
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

// Játék indítása
window.addEventListener('load', () => {
    new OutRunRacing();
});
