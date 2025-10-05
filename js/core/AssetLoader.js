export class AssetLoader {
    constructor() {
        this.assets = {};
        this.enemySprites = [];
        this.loadingProgress = 0;
    }
    
    async loadAssets() {
        console.log('📦 Asset betöltés kezdése...');
        
        const assetList = [
            { name: 'player', src: 'assets/player-car.png' },
            { name: 'enemy1', src: 'assets/images/enemy-car1.png' },
            { name: 'enemy2', src: 'assets/images/enemy-car2.png' },
            { name: 'enemy3', src: 'assets/images/enemy-car3.png' },
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
                console.log(`✅ ${name} betöltve`);
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
            // ⭐ KORMÁNY GENERÁLÁSA
            canvas.width = 200;
            canvas.height = 200;
            
            // Külső gyűrű
            ctx.beginPath();
            ctx.arc(100, 100, 90, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.fill();
            
            // Belső gyűrű
            ctx.beginPath();
            ctx.arc(100, 100, 75, 0, Math.PI * 2);
            ctx.fillStyle = '#333333';
            ctx.fill();
            
            // Küllők
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.beginPath();
                ctx.moveTo(100 + Math.cos(angle) * 30, 100 + Math.sin(angle) * 30);
                ctx.lineTo(100 + Math.cos(angle) * 75, 100 + Math.sin(angle) * 75);
                ctx.stroke();
            }
            
            // Központi rész
            ctx.beginPath();
            ctx.arc(100, 100, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#444444';
            ctx.fill();
            
            // Fényes effekt
            const gradient = ctx.createRadialGradient(85, 85, 10, 100, 100, 90);
            gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Logo
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏎️', 100, 108);
        }
        
        this.assets[name] = canvas;
        console.log(`🎨 ${name} generálva`);
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
