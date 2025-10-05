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
                'assets/enemy-car5.png'
            ];
            
            this.assets.enemies = [];
            for (const file of enemyCarFiles) {
                try {
                    const enemySprite = await this.loadImage(file);
                    this.assets.enemies.push(enemySprite);
                    console.log(`✅ Ellenfél autó betöltve: ${file}`);
                } catch (error) {
                    console.warn(`⚠️ Nem sikerült betölteni: ${file}`);
                    // ⭐ NEM HOZUNK LÉTRE FALLBACK SPRITE-OT!
                    // Csak a ténylegesen betöltött képeket használjuk
                }
            }
            
            // ⭐ ELLENŐRZÉS: VAN-E BETÖLTÖTT ELLENFÉL AUTÓ
            if (this.assets.enemies.length === 0) {
                console.warn('❌ Egyetlen ellenfél autó sem töltődött be! Ellenőrizd a fájlokat.');
                return false;
            }
            
            console.log('✅ Asset-ek sikeresen betöltve:', this.assets.enemies.length, 'ellenfél autó');
            return true;
            
        } catch (error) {
            console.error('❌ Kritikus hiba az asset betöltésben:', error);
            return false;
        }
    }
    
    // ⭐ KÉPFÁJL BETÖLTŐ FÜGGVÉNY
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Sikeres betöltés: ${src}`);
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
    
    // ⭐ RANDOM ELLENFÉL SPRITE VÁLASZTÁS (CSAK BETÖLTÖTT KÉPEKBŐL)
    getRandomEnemySprite() {
        if (this.assets.enemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.assets.enemies.length);
            return this.assets.enemies[randomIndex];
        }
        
        console.warn('⚠️ Nincs betöltött ellenfél sprite!');
        return null; // ⭐ NULL VISSZAADÁSA HA NINCS KÉP
    }
    
    // ⭐ ELLENŐRZÉS: VANNAK-E BETÖLTÖTT ELLENFÉL AUTÓK
    hasEnemySprites() {
        return this.assets.enemies.length > 0;
    }
    
    // ⭐ JÁTÉKOS AUTÓ ELLENŐRZÉS
    hasPlayerSprite() {
        return this.assets.player !== null;
    }
}
