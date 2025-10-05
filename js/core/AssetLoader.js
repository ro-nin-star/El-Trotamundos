export class AssetLoader {
    constructor() {
        this.assets = {};
        this.enemySprites = [];
        this.loadingProgress = 0;
    }
    
    async loadAssets() {
        console.log('📦 Asset betöltés kezdése...');
        
        const assetList = [
            { name: 'player', src: 'assets/images/player-car.png' },
            { name: 'enemy1', src: 'assets/images/enemy-car-1.png' },
            { name: 'enemy2', src: 'assets/images/enemy-car-2.png' },
            { name: 'enemy3', src: 'assets/images/enemy-car-3.png' },
            { name: 'steeringWheel', src: 'assets/images/steering-wheel.png' } // ⭐ KORMÁNY ASSET
        ];
        
        const loadPromises = assetList.map(asset => this.loadImage(asset.name, asset.src));
        
        try {
            await Promise.all(loadPromises);
            this.setupEnemySprites();
            console.log('✅ Minden asset betöltve!');
        } catch (error) {
            console.warn('⚠️ Asset betöltési hiba, generált sprite-ok használata:', error);
            this.generateFallbackAssets();
        }
    }
    
    async loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.assets[name] = img;
                console.log(`✅ ${name} betöltve (${img.width}x${img.height}px)`);
                resolve();
            };
            
            img.onerror = () => {
                console.warn(`⚠️ ${name} betöltése sikertelen: ${src}`);
                this.generateAsset(name);
                resolve();
            };
            
            img.src = src;
        });
    }
    
    generateAsset(name) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (name === 'player') {
            canvas.width = 40;
            canvas.height = 20;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, 40, 20);
            ctx.fillStyle = '#000000';
            ctx.fillRect(5, 3, 30, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(15, 6, 10, 8);
            
        } else if (name.startsWith('enemy')) {
            canvas.width = 40;
            canvas.height = 20;
            const colors = ['#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 40, 20);
            ctx.fillStyle = '#000000';
            ctx.fillRect(5, 3, 30, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(15, 6, 10, 8);
            
        } else if (name === 'steeringWheel') {
            // ⭐ KORMÁNY GENERÁLÁSA (MOBIL-OPTIMALIZÁLT)
            canvas.width = 200;
            canvas.height = 200;
            const centerX = 100;
            const centerY = 100;
            
            // ⭐ KÜLSŐ GYŰRŰ
            ctx.beginPath();
            ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.fill();
            
            // ⭐ KÜLSŐ KERET
            ctx.beginPath();
            ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
            ctx.arc(centerX, centerY, 80, 0, Math.PI * 2, true);
            ctx.fillStyle = '#444444';
            ctx.fill();
            
            // ⭐ KÖZÉPSŐ GYŰRŰ
            ctx.beginPath();
            ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
            ctx.fillStyle = '#2a2a2a';
            ctx.fill();
            
            // ⭐ BELSŐ GYŰRŰ
            ctx.beginPath();
            ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
            ctx.fillStyle = '#333333';
            ctx.fill();
            
            // ⭐ KÜLLŐK (4 DARAB)
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.beginPath();
                ctx.moveTo(centerX + Math.cos(angle) * 30, centerY + Math.sin(angle) * 30);
                ctx.lineTo(centerX + Math.cos(angle) * 70, centerY + Math.sin(angle) * 70);
                ctx.stroke();
            }
            
            // ⭐ KÖZPONTI NAV
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#444444';
            ctx.fill();
            
            // ⭐ KÖZPONTI KERET
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // ⭐ FÉNYES EFFEKT
            const gradient = ctx.createRadialGradient(
                centerX - 20, centerY - 20, 5, 
                centerX, centerY, 90
            );
            gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.1)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // ⭐ LOGO
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏎️', centerX, centerY);
            
            // ⭐ POZÍCIÓ JELZŐ (FELÜL)
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(centerX, centerY - 75, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.assets[name] = canvas;
        console.log(`🎨 ${name} generálva (${canvas.width}x${canvas.height}px)`);
    }
    
    generateFallbackAssets() {
        const assetNames = ['player', 'enemy1', 'enemy2', 'enemy3', 'steeringWheel'];
        assetNames.forEach(name => {
            if (!this.assets[name]) {
                this.generateAsset(name);
            }
        });
        this.setupEnemySprites();
    }
    
    setupEnemySprites() {
        this.enemySprites = [];
        
        ['enemy1', 'enemy2', 'enemy3'].forEach(name => {
            if (this.assets[name]) {
                this.enemySprites.push(this.assets[name]);
            }
        });
        
        if (this.enemySprites.length === 0) {
            console.warn('⚠️ Nincs elérhető ellenfél sprite!');
        }
    }
    
    // ⭐ KORMÁNY ASSET GETTER (MOBIL TÁMOGATÁSSAL)
    getSteeringWheelAsset() {
        if (this.assets['steeringWheel']) {
            console.log('✅ Kormány asset betöltve:', this.assets['steeringWheel']);
            return this.assets['steeringWheel'];
        }
        
        console.warn('⚠️ Kormány asset nincs betöltve, generálás...');
        this.generateAsset('steeringWheel');
        return this.assets['steeringWheel'];
    }
    
    getAssets() {
        return this.assets;
    }
    
    getRandomEnemySprite() {
        if (this.enemySprites.length === 0) {
            return null;
        }
        return this.enemySprites[Math.floor(Math.random() * this.enemySprites.length)];
    }
    
    hasEnemySprites() {
        return this.enemySprites.length > 0;
    }
}
