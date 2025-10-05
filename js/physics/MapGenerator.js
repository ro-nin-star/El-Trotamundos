export class MapGenerator {
    constructor() {
        this.mapCanvas = null;
        this.mapCtx = null;
        this.mapImageData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.originalImage = null;
        this.terrainData = [];
        this.routePoints = [];
    }
    
    async loadMap(mapImageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.originalImage = img;
                this.processMapImage(img);
                console.log(`✅ Térkép feldolgozva: ${this.mapWidth}x${this.mapHeight}px`);
                resolve();
            };
            
            img.onerror = () => {
                console.warn('⚠️ Térkép betöltése sikertelen, alapértelmezett pálya generálása');
                this.generateDefaultRoute();
                resolve();
            };
            
            img.src = mapImageSrc;
        });
    }
    
    processMapImage(img) {
        this.mapCanvas = document.createElement('canvas');
        this.mapCtx = this.mapCanvas.getContext('2d');
        
        // ⭐ OPTIMÁLIS MÉRET
        const targetSize = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > targetSize || height > targetSize) {
            const scale = Math.min(targetSize / width, targetSize / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
        }
        
        this.mapCanvas.width = width;
        this.mapCanvas.height = height;
        this.mapWidth = width;
        this.mapHeight = height;
        
        this.mapCtx.drawImage(img, 0, 0, width, height);
        this.mapImageData = this.mapCtx.getImageData(0, 0, width, height);
        
        // ⭐ EGYSZERŰ ÚTVONAL GENERÁLÁS
        this.generateSimpleRoute();
    }
    
    // ⭐ EGYSZERŰ ÚTVONAL GENERÁLÁS (MŰKÖDIK MINDEN TÉRKÉPPEL)
    generateSimpleRoute() {
        this.routePoints = [];
        
        // ⭐ HOSSZÚ CIKK-CAKK ÚTVONAL A TÉRKÉP KÖRÜL
        const segments = 2000; // Hosszú pálya
        const centerX = this.mapWidth / 2;
        const centerY = this.mapHeight / 2;
        const maxRadius = Math.min(this.mapWidth, this.mapHeight) / 3;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            
            // ⭐ SPIRÁL + CIKK-CAKK KOMBINÁCIÓ
            const angle = progress * Math.PI * 8; // 4 teljes kör
            const radius = maxRadius * (0.3 + 0.7 * Math.sin(progress * Math.PI * 3));
            
            // ⭐ CIKK-CAKK EFFEKT
            const zigzag = Math.sin(progress * Math.PI * 20) * 30;
            
            const x = Math.max(20, Math.min(this.mapWidth - 20, 
                centerX + Math.cos(angle) * radius + zigzag
            ));
            const y = Math.max(20, Math.min(this.mapHeight - 20, 
                centerY + Math.sin(angle) * radius + progress * this.mapHeight * 0.3
            ));
            
            this.routePoints.push({
                x: Math.floor(x),
                y: Math.floor(y),
                type: this.getTerrainTypeAt(Math.floor(x), Math.floor(y))
            });
        }
        
        console.log(`🛣️ Egyszerű útvonal generálva: ${this.routePoints.length} pont`);
    }
    
    // ⭐ TEREP TÍPUS MEGHATÁROZÁSA PIXEL SZÍN ALAPJÁN
    getTerrainTypeAt(x, y) {
        if (!this.mapImageData || x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return 'grass';
        }
        
        const index = (y * this.mapWidth + x) * 4;
        const r = this.mapImageData.data[index];
        const g = this.mapImageData.data[index + 1];
        const b = this.mapImageData.data[index + 2];
        
        // ⭐ EGYSZERŰ SZÍNFELISMERÉS
        if (r > 200 && g < 100 && b < 100) return 'highway';    // Piros
        if (r > 220 && g > 220 && b > 220) return 'road';       // Fehér
        if (r > 200 && g > 200 && b < 100) return 'highway';    // Sárga
        if (b > r + 50 && b > g + 50) return 'river';           // Kék
        if (g > r + 30 && g > b + 30) return 'forest';          // Zöld
        if (r < 50 && g < 50 && b < 50) return 'city';          // Fekete
        
        return 'grass';
    }
    
    // ⭐ ALAPÉRTELMEZETT ÚTVONAL (HA NINCS TÉRKÉP)
    generateDefaultRoute() {
        this.routePoints = [];
        this.mapWidth = 500;
        this.mapHeight = 500;
        
        const segments = 1500;
        const centerX = this.mapWidth / 2;
        const centerY = this.mapHeight / 2;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const angle = progress * Math.PI * 6;
            const radius = 150 * (1 - progress * 0.5);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius + progress * 300;
            
            this.routePoints.push({
                x: Math.floor(x),
                y: Math.floor(y),
                type: 'highway'
            });
        }
        
        console.log('🎨 Alapértelmezett útvonal generálva');
    }
    
    // ⭐ PÁLYA GENERÁLÁSA
    generateTrackFromMap(game) {
        if (!this.routePoints.length) {
            this.generateDefaultRoute();
        }
        
        game.road = [];
        game.signs = [];
        
        const segmentLength = game.segmentLength;
        const totalSegments = this.routePoints.length;
        game.trackLength = totalSegments * segmentLength;
        
        let currentHill = 0;
        let currentCurve = 0;
        
        console.log(`🏗️ Pálya építése: ${totalSegments} szegmens (${Math.round(game.trackLength/1000)}km)`);
        
        for (let i = 0; i < totalSegments; i++) {
            const routePoint = this.routePoints[i];
            const terrainType = routePoint.type;
            
            // ⭐ EGYSZERŰ MAGASSÁG ÉS KANYAR
            const targetHill = this.getElevation(terrainType);
            const targetCurve = this.getCurve(i, totalSegments);
            
            currentHill += (targetHill - currentHill) * 0.02;
            currentCurve += (targetCurve - currentCurve) * 0.05;
            
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
                terrainType: terrainType,
                color: this.getSegmentColor(terrainType, i),
                mapPosition: { x: routePoint.x, y: routePoint.y }
            };
            
            // ⭐ TÁBLÁK
            if (i % 300 === 0) {
                game.signs.push({
                    type: 'city',
                    cityName: this.getRandomCityName(),
                    z: i * segmentLength,
                    offset: Math.random() > 0.5 ? 0.8 : -0.8,
                    sprite: null
                });
            }
            
            game.road.push(segment);
        }
        
        console.log(`✅ Pálya kész: ${game.road.length} szegmens`);
    }
    
    getElevation(terrainType) {
        const elevations = {
            grass: 0, forest: 20, river: -50, highway: 10, road: 5, city: 25
        };
        return elevations[terrainType] || 0;
    }
    
    getCurve(segmentIndex, totalSegments) {
        const progress = segmentIndex / totalSegments;
        return Math.sin(progress * Math.PI * 12) * 0.6; // Változatos kanyarok
    }
    
    getSegmentColor(terrainType, segmentIndex) {
        const isDark = segmentIndex % 3 === 0;
        switch (terrainType) {
            case 'highway': return isDark ? 'highway_dark' : 'highway_light';
            case 'road': return isDark ? 'road_dark' : 'road_light';
            case 'city': return isDark ? 'city_dark' : 'city_light';
            case 'river': return isDark ? 'water_dark' : 'water_light';
            case 'forest': return isDark ? 'forest_dark' : 'forest_light';
            default: return isDark ? 'dark' : 'light';
        }
    }
    
    getRandomCityName() {
        const cities = [
            'MISKOLC', 'KAZINCBARCIKA', 'TISZAÚJVÁROS', 'ÓZDI', 'SZERENCS',
            'MEZŐKÖVESD', 'EDELÉNY', 'PUTNOK', 'SÁTORALJAÚJHELY'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
    
    getCurrentMapPosition(gamePosition, trackLength) {
        if (!this.routePoints.length) return { x: 0, y: 0 };
        
        const progress = Math.max(0, Math.min(1, gamePosition / trackLength));
        const pointIndex = Math.floor(progress * (this.routePoints.length - 1));
        
        return this.routePoints[pointIndex] || { x: 0, y: 0 };
    }
    
    getMiniMapData() {
        return {
            originalImage: this.originalImage,
            routePoints: this.routePoints,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight
        };
    }
}
