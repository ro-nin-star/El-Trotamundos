export class TrackBuilder {
    constructor() {
        this.signRenderer = null;
    }
    
    buildTrack(game, assetLoader) {
        console.log('🏗️ Pálya építése...');
        
        // ⭐ SIGNRENDERER IMPORTÁLÁSA
        import('../graphics/SignRenderer.js').then(module => {
            this.signRenderer = new module.SignRenderer();
        });
        
        game.road = [];
        const trackLength = game.trackLength;
        const segmentLength = game.segmentLength;
        const totalSegments = Math.floor(trackLength / segmentLength);
        
        let currentCurve = 0;
        let currentHill = 0;
        
        // ⭐ TÁBLA POZÍCIÓK TÁROLÁSA
        game.signs = [];
        
        for (let i = 0; i < totalSegments; i++) {
            const segment = {
                index: i,
                p1: {
                    world: { x: 0, y: currentHill, z: i * segmentLength },
                    camera: { x: 0, y: 0, z: 0 },
                    screen: { x: 0, y: 0, w: 0, scale: 0 }
                },
                p2: {
                    world: { x: 0, y: currentHill, z: (i + 1) * segmentLength },
                    camera: { x: 0, y: 0, z: 0 },
                    screen: { x: 0, y: 0, w: 0, scale: 0 }
                },
                curve: currentCurve,
                color: i % 3 === 0 ? 'dark' : 'light'
            };
            
            // ⭐ KANYAROK GENERÁLÁSA ÉS TÁBLA ELHELYEZÉSE
            if (i % 50 === 0 && i > 0) {
                const newCurve = (Math.random() - 0.5) * 4;
                
                // ⭐ KANYAR TÁBLA HOZZÁADÁSA
                if (Math.abs(newCurve) > 1) {
                    const direction = newCurve > 0 ? 'right' : 'left';
                    const signPosition = (i - 20) * segmentLength; // 20 szegmensnyire a kanyar előtt
                    const distanceToTurn = 20 * segmentLength;
                    
                    game.signs.push({
                        type: 'curve',
                        direction: direction,
                        z: signPosition,
                        offset: Math.random() > 0.5 ? 0.7 : -0.7, // Jobb vagy bal oldal
                        distance: distanceToTurn,
                        sprite: null // Később generálódik
                    });
                }
                
                currentCurve = newCurve;
            }
            
            // ⭐ DOMBORZAT
            if (i % 80 === 0) {
                currentHill = (Math.random() - 0.5) * 200;
            }
            
            // ⭐ SEBESSÉG TÁBLÁK
            if (i % 150 === 0 && i > 100) {
                const speedLimits = [60, 80, 100, 120];
                const speedLimit = speedLimits[Math.floor(Math.random() * speedLimits.length)];
                
                game.signs.push({
                    type: 'speed',
                    speedLimit: speedLimit,
                    z: i * segmentLength,
                    offset: Math.random() > 0.5 ? 0.8 : -0.8,
                    sprite: null
                });
            }
            
            // ⭐ VÁROS TÁBLÁK
            if (i % 300 === 0 && i > 200) {
                const cities = ['BUDAPEST', 'DEBRECEN', 'SZEGED', 'PÉCS', 'GYŐR'];
                const cityName = cities[Math.floor(Math.random() * cities.length)];
                
                game.signs.push({
                    type: 'city',
                    cityName: cityName,
                    z: i * segmentLength,
                    offset: Math.random() > 0.5 ? 0.9 : -0.9,
                    sprite: null
                });
            }
            
            game.road.push(segment);
        }
        
        console.log(`✅ Pálya kész: ${totalSegments} szegmens, ${game.signs.length} tábla`);
    }
}
