import { MapGenerator } from './MapGenerator.js';

export class TrackBuilder {
    constructor() {
        this.signRenderer = null;
        this.mapGenerator = new MapGenerator(); // ⭐ PUBLIKUS HOZZÁFÉRÉS
    }
    
    async buildTrack(game, assetLoader, mapImageSrc = null) {
        console.log('🏗️ Pálya építése...');
        
        try {
            const module = await import('../graphics/SignRenderer.js');
            this.signRenderer = new module.SignRenderer();
        } catch (error) {
            console.warn('⚠️ SignRenderer betöltési hiba:', error);
        }
        
        if (mapImageSrc) {
            try {
                await this.mapGenerator.loadMap(mapImageSrc);
                this.mapGenerator.generateTrackFromMap(game);
                
                console.log(`✅ Térkép alapú pálya kész! Hossz: ${Math.round(game.trackLength/1000)}km`);
                return;
            } catch (error) {
                console.warn('⚠️ Térkép alapú pálya építési hiba:', error);
            }
        }
        
        this.buildDefaultTrack(game);
    }
    
    // ⭐ ALAPÉRTELMEZETT PÁLYA ÉPÍTÉS
    buildDefaultTrack(game) {
        game.road = [];
        game.signs = [];
        
        const trackLength = game.trackLength;
        const segmentLength = game.segmentLength;
        const totalSegments = Math.floor(trackLength / segmentLength);
        
        let currentCurve = 0;
        let currentHill = 0;
        
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
                terrainType: 'grass',
                color: i % 3 === 0 ? 'dark' : 'light'
            };
            
            // ⭐ VÉLETLENSZERŰ KANYAROK
            if (i % 50 === 0 && i > 0) {
                const newCurve = (Math.random() - 0.5) * 4;
                
                if (Math.abs(newCurve) > 1) {
                    const direction = newCurve > 0 ? 'right' : 'left';
                    const signPosition = (i - 20) * segmentLength;
                    const distanceToTurn = 20 * segmentLength;
                    
                    game.signs.push({
                        type: 'curve',
                        direction: direction,
                        z: signPosition,
                        offset: Math.random() > 0.5 ? 0.7 : -0.7,
                        distance: distanceToTurn,
                        sprite: null
                    });
                }
                
                currentCurve = newCurve;
            }
            
            // ⭐ DOMBORZAT
            if (i % 80 === 0) {
                currentHill = (Math.random() - 0.5) * 200;
            }
            
            game.road.push(segment);
        }
        
        console.log(`✅ Alapértelmezett pálya kész: ${totalSegments} szegmens`);
    }
}
