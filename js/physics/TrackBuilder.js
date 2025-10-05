export class TrackBuilder {
    buildTrack(game) {
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
        
        this.createInitialCars(game);
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
    
    createInitialCars(game) {
        game.cars = [
            {
                z: 800,
                offset: -0.3,
                sprite: null, // Később beállítjuk
                speed: 70,
                width: 60,
                height: 30,
                followsTrack: true
            }
        ];
    }
}
