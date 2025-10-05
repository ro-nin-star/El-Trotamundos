export class TrackBuilder {
    buildTrack(game, assetLoader) {
        game.road = [];
        
        this.addRoad(game, 200, 0, 0);
        this.addRoad(game, 100, 0, -6);
        this.addRoad(game, 100, 0, 0);
        this.addRoad(game, 100, 0, 6);
        this.addRoad(game, 100, 300, 0);
        this.addRoad(game, 100, 0, -4);
        this.addRoad(game, 200, 0, 0);
        this.addRoad(game, 50, 0, 0);
        
        game.trackLength = game.road.length * game.segmentLength;
        console.log('🛣️ Pálya hossza:', game.trackLength);
        
        this.createInitialCars(game, assetLoader);
    }
    
    addRoad(game, count, hill, curve) {
        const startY = game.road.length > 0 ? 
            game.road[game.road.length - 1].p2.world.y : 0;
        
        for (let i = 0; i < count; i++) {
            const percent = i / count;
            const y = startY + hill * percent;
            
            game.road.push({
                index: game.road.length,
                p1: {
                    world: { x: 0, y: y, z: game.road.length * game.segmentLength },
                    camera: {},
                    screen: {}
                },
                p2: {
                    world: { x: 0, y: y, z: (game.road.length + 1) * game.segmentLength },
                    camera: {},
                    screen: {}
                },
                curve: curve,
                color: Math.floor(game.road.length / 3) % 2 ? 'dark' : 'light',
                isFinish: false
            });
        }
    }
    
    createInitialCars(game, assetLoader) {
        const assets = assetLoader ? assetLoader.getAssets() : null;
        
        // ⭐ TÖBB KEZDŐ AUTÓ
        for (let i = 0; i < 2; i++) {
            const enemySprite = this.getEnemySprite(assets, i);
            
            game.cars.push({
                z: 800 + (i * 400),
                offset: (Math.random() - 0.5) * 0.6,
                sprite: enemySprite,
                speed: 60 + Math.random() * 20,
                width: 60,
                height: 30,
                followsTrack: true
            });
        }
        
        console.log(`✅ ${game.cars.length} kezdő autó létrehozva`);
    }
    
    getEnemySprite(assets, index) {
        // Ha van betöltött asset, használjuk azt
        if (assets && assets.enemies && assets.enemies.length > 0) {
            return assets.enemies[index % assets.enemies.length];
        }
        
        // Fallback sprite generálás
        return this.createFallbackEnemySprite(index);
    }
    
    createFallbackEnemySprite(index) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#0000FF', '#00FF00', '#FF00FF', '#FFFF00', '#FF8800'];
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
