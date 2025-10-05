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
        
        // ⭐ AUDIOMANAGER MOBIL BEÁLLÍTÁS
        this.audioManager.setMobile(this.isMobile);
        this.audioManager.init();
        
        this.gameEngine.buildTrack(this.assetLoader);
        this.inputManager.setupControls(this);
        this.audioManager.createMuteButton();
        
        if (this.isMobile) {
            this.createMobileControls();
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
    
    createMobileControls() {
        const mobileControls = document.createElement('div');
        mobileControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 1000;
        `;
        
        const buttons = [
            { emoji: '⬅️', text: 'BALRA', key: 'ArrowLeft' },
            { emoji: '⬇️', text: 'FÉK', key: 'ArrowDown' },
            { emoji: '⬆️', text: 'GÁZ', key: 'ArrowUp' },
            { emoji: '➡️', text: 'JOBBRA', key: 'ArrowRight' },
            { emoji: '🚀', text: 'NITRO', key: 'Space', color: '#FF4444' }
        ];
        
        buttons.forEach(btn => {
            const button = this.createMobileButton(btn.emoji, btn.text, btn.color);
            this.setupMobileButton(button, btn.key);
            mobileControls.appendChild(button);
        });
        
        document.body.appendChild(mobileControls);
    }
    
    createMobileButton(emoji, text, bgColor = 'rgba(0, 0, 0, 0.7)') {
        const button = document.createElement('div');
        button.innerHTML = `<div style="font-size: 24px;">${emoji}</div><div style="font-size: 10px;">${text}</div>`;
        button.style.cssText = `
            width: 60px; height: 60px; background: ${bgColor};
            border: 2px solid #00FFFF; border-radius: 50%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: Arial; cursor: pointer; touch-action: manipulation;
        `;
        return button;
    }
    
    setupMobileButton(button, keyCode) {
        const onStart = (e) => {
            e.preventDefault();
            this.inputManager.keys[keyCode] = true;
            button.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
            
            // ⭐ MOBIL RESTART TÁMOGATÁS
            if (this.gameEngine.game.finished && keyCode !== 'Space') {
                this.inputManager.keys['Enter'] = true;
            }
        };
        
        const onEnd = (e) => {
            e.preventDefault();
            this.inputManager.keys[keyCode] = false;
            button.style.backgroundColor = keyCode === 'Space' ? '#FF4444' : 'rgba(0, 0, 0, 0.7)';
            
            if (this.gameEngine.game.finished) {
                this.inputManager.keys['Enter'] = false;
            }
        };
        
        button.addEventListener('touchstart', onStart, { passive: false });
        button.addEventListener('touchend', onEnd, { passive: false });
        button.addEventListener('mousedown', onStart);
        button.addEventListener('mouseup', onEnd);
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
