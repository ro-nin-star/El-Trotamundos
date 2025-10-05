import { SpriteGenerator } from '../graphics/SpriteGenerator.js';

export class AssetLoader {
    constructor() {
        this.assets = {
            player: null,
            enemies: [],
            environment: []
        };
        this.spriteGenerator = new SpriteGenerator();
    }
    
    async loadAssets() {
        console.log('🎨 Asset-ek betöltése...');
        
        try {
            this.assets.player = await this.loadImage('assets/player-car.png');
            this.assets.enemies = [
                await this.loadImage('assets/enemy-car1.png'),
                await this.loadImage('assets/enemy-car2.png'),
            ];
            console.log('✅ Asset-ek sikeresen betöltve!');
        } catch (error) {
            console.log('❌ Asset betöltési hiba, fallback használata...');
            this.createFallbackAssets();
        }
    }
    
    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed: ${src}`));
            img.src = src;
        });
    }
    
    createFallbackAssets() {
        this.assets.player = this.spriteGenerator.createPlayerCarSprite();
        this.assets.enemies = [
            this.spriteGenerator.createEnemyCarSprite('#0000FF'),
            this.spriteGenerator.createEnemyCarSprite('#00FF00'),
            this.spriteGenerator.createEnemyCarSprite('#FF00FF')
        ];
    }
    
    getAssets() {
        return this.assets;
    }
}
