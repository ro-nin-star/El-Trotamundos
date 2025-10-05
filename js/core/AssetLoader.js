export class AssetLoader {
    constructor() {
        this.assets = {
            player: null,
            enemies: []
        };
        this.loadedImages = 0;
        this.totalImages = 0;
    }
    
    async loadAssets() {
        console.log('🎨 Asset-ek betöltése képfájlokból...');
        
        try {
            // ⭐ JÁTÉKOS AUTÓ BETÖLTÉSE
            this.assets.player = await this.loadImage('assets/player-car.png');
            
            // ⭐ ELLENFÉL AUTÓK BETÖLTÉSE
            const enemyCarFiles = [
                'assets/enemy-car1.png',
                'assets/enemy-car2.png',
                'assets/enemy-car3.png',
                'assets/enemy-car4.png',

            ];
            
            this.assets.enemies = [];
            for (const file of enemyCarFiles) {
                try {
                    const enemySprite = await this.loadImage(file);
                    this.assets.enemies.push(enemySprite);
                } catch (error) {
                    console.warn(`⚠️ Nem sikerült betölteni: ${file}, fallback sprite készítése...`);
                    // Fallback: generált sprite ha a kép nem található
                    this.assets.enemies.push(this.createFallbackEnemySprite(this.assets.enemies.length));
                }
            }
            
            console.log('✅ Asset-ek betöltve:', this.assets.enemies.length, 'ellenfél autó');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Képbetöltési hiba, fallback sprite-ok használata:', error);
            // Teljes fallback
            this.assets.player = this.createPlayerCarSprite();
            this.assets.enemies = [
                this.createFallbackEnemySprite(0),
                this.createFallbackEnemySprite(1),
                this.createFallbackEnemySprite(2),
                this.createFallbackEnemySprite(3),
                this.createFallbackEnemySprite(4)
            ];
            return true;
        }
    }
    
    // ⭐ KÉPFÁJL BETÖLTŐ FÜGGVÉNY
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Betöltve: ${src}`);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`❌ Nem található: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }
    
    getAssets() {
        return this.assets;
    }
    
    // ⭐ RANDOM ELLENFÉL SPRITE VÁLASZTÁS
    getRandomEnemySprite() {
        if (this.assets.enemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.assets.enemies.length);
            return this.assets.enemies[randomIndex];
        }
        return this.createFallbackEnemySprite(0);
    }
    
    // FALLBACK SPRITE-OK (ha a képek nem találhatók)
    createPlayerCarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        // Piros autó
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(8, 2, 24, 16);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Lámpák
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
    
    createFallbackEnemySprite(index) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#0000FF', '#00FF00', '#FF00FF', '#FFFF00', '#FF8800', '#8800FF'];
        const color = colors[index % colors.length];
        
        // Autó test
        ctx.fillStyle = color;
        ctx.fillRect(8, 2, 24, 16);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Lámpák
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
}
