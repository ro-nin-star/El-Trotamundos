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
        
        this.createCanvas();
        this.gameLoop();
        
        await this.simulateLoading();
        await this.assetLoader.loadAssets();
        this.audioManager.init();
        this.gameEngine.buildTrack();
        this.inputManager.setupControls(this);
        this.audioManager.createMuteButton();
        
        this.gameState.current = 'INTRO';
        console.log('✅ Játék betöltve!');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.canvas.style.imageRendering = 'pixelated';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        document.body.appendChild(this.canvas);
        
        // Komponenseknek átadjuk a canvas-t
        this.renderer.setCanvas(this.canvas, this.ctx);
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
