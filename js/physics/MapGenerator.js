export class MapGenerator {
    constructor() {
        this.mapCanvas = null;
        this.mapCtx = null;
        this.mapImageData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.originalImage = null;
        
        // ⭐ FRISSÍTETT SZÍN KÓDOK A VALÓS TÉRKÉP ALAPJÁN
        this.colorMap = {
            // Eredeti színek (ha valaki más térképet használ)
            grass: { r: 128, g: 0, b: 128, tolerance: 50 },
            river: { r: 0, g: 0, b: 255, tolerance: 60 },
            highway: { r: 255, g: 255, b: 0, tolerance: 50 },
            road: { r: 255, g: 255, b: 255, tolerance: 40 },
            roadBorder: { r: 255, g: 0, b: 0, tolerance: 40 },
            city: { r: 128, g: 128, b: 128, tolerance: 60 },
            
            // ⭐ BORSOD MEGYE TÉRKÉP SPECIFIKUS SZÍNEK
            realRoad: { r: 255, g: 255, b: 255, tolerance: 30 },     // Fehér utak
            realHighway: { r: 255, g: 0, b: 0, tolerance: 40 },      // Piros főutak
            realCity: { r: 0, g: 0, b: 0, tolerance: 50 },           // Fekete városok
            realWater: { r: 0, g: 0, b: 255, tolerance: 60 },        // Kék víz
            realForest: { r: 0, g: 128, g: 0, tolerance: 50 },       // Zöld erdő
            realBackground: { r: 255, g: 255, b: 224, tolerance: 30 } // Krém háttér
        };
        
        this.terrainData = [];
        this.routePoints = [];
        this.roadNetwork = []; // ⭐ FELISMERT ÚTHÁLÓZAT
    }
    
    // ⭐ TÉRKÉP BETÖLTÉSE ÉS ELEMZÉSE
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
                this.generateDefaultTerrain();
                resolve();
            };
            
            img.src = mapImageSrc;
        });
    }
    
    // ⭐ TÉRKÉP KÉP FELDOLGOZÁSA
    processMapImage(img) {
        this.mapCanvas = document.createElement('canvas');
        this.mapCtx = this.mapCanvas.getContext('2d');
        
        const maxSize = 800; // Optimális méret
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
        }
        
        this.mapCanvas.width = width;
        this.mapCanvas.height = height;
        this.mapWidth = width;
        this.mapHeight = height;
        
        this.mapCtx.drawImage(img, 0, 0, width, height);
        this.mapImageData = this.mapCtx.getImageData(0, 0, width, height);
        
        // ⭐ SZÍNEK ELEMZÉSE ÉS DEBUG
        this.analyzeMapColors();
        
        // ⭐ TEREP ADATOK ELEMZÉSE
        this.analyzeTerrainData();
        
        // ⭐ ÚTHÁLÓZAT FELISMERÉSE
        this.detectRoadNetwork();
        
        // ⭐ ÚTVONAL PONTOK GENERÁLÁSA AZ UTAK ALAPJÁN
        this.generateRouteFromRoads();
    }
    
    // ⭐ TÉRKÉP SZÍNEINEK ELEMZÉSE (DEBUG)
    analyzeMapColors() {
        const colorCounts = {};
        const data = this.mapImageData.data;
        const sampleStep = 10; // Minden 10. pixel mintavételezése
        
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const colorKey = `${r},${g},${b}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
        
        // ⭐ LEGGYAKORIBB SZÍNEK KIÍRÁSA
        const sortedColors = Object.entries(colorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        console.log('🎨 Térkép leggyakoribb színei:');
        sortedColors.forEach(([color, count], index) => {
            const [r, g, b] = color.split(',').map(Number);
            console.log(`${index + 1}. RGB(${r},${g},${b}) - ${count} pixel`);
        });
    }
    
    // ⭐ ÚTHÁLÓZAT FELISMERÉSE
    detectRoadNetwork() {
        this.roadNetwork = [];
        const data = this.mapImageData.data;
        
        // ⭐ PIROS VONALAK KERESÉSE (FŐUTAK)
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const index = (y * this.mapWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // ⭐ PIROS FŐÚT DETEKTÁLÁS
                if (r > 200 && g < 100 && b < 100) {
                    this.roadNetwork.push({
                        x: x,
                        y: y,
                        type: 'highway',
                        color: { r, g, b }
                    });
                }
                
                // ⭐ FEHÉR/VILÁGOS ÚT DETEKTÁLÁS
                else if (r > 220 && g > 220 && b > 220) {
                    this.roadNetwork.push({
                        x: x,
                        y: y,
                        type: 'road',
                        color: { r, g, b }
                    });
                }
                
                // ⭐ SÁRGA ÚT DETEKTÁLÁS
                else if (r > 200 && g > 200 && b < 100) {
                    this.roadNetwork.push({
                        x: x,
                        y: y,
                        type: 'highway',
                        color: { r, g, b }
                    });
                }
            }
        }
        
        console.log(`🛣️ Úthálózat felismerve: ${this.roadNetwork.length} út pixel`);
    }
    
    // ⭐ ÚTVONAL GENERÁLÁSA AZ UTAK ALAPJÁN
    generateRouteFromRoads() {
        this.routePoints = [];
        
        if (this.roadNetwork.length === 0) {
            console.warn('⚠️ Nincs felismert út, spirál útvonal generálása');
            this.generateSpiralRoute();
            return;
        }
        
        // ⭐ UTAK CSOPORTOSÍTÁSA Y KOORDINÁTA SZERINT
        const roadGroups = {};
        this.roadNetwork.forEach(road => {
            const yGroup = Math.floor(road.y / 5) * 5; // 5 pixeles csoportok
            if (!roadGroups[yGroup]) {
                roadGroups[yGroup] = [];
            }
            roadGroups[yGroup].push(road);
        });
        
        // ⭐ ÚTVONAL ÉPÍTÉSE FENTRŐL LEFELÉ
        const sortedYGroups = Object.keys(roadGroups)
            .map(Number)
            .sort((a, b) => a - b);
        
        sortedYGroups.forEach(yGroup => {
            const roads = roadGroups[yGroup];
            
            // ⭐ X KOORDINÁTA SZERINT RENDEZÉS
            roads.sort((a, b) => a.x - b.x);
            
            // ⭐ MINDEN 10. ÚT PIXEL HOZZÁADÁSA
            for (let i = 0; i < roads.length; i += 10) {
                this.routePoints.push({
                    x: roads[i].x,
                    y: roads[i].y,
                    type: roads[i].type
                });
            }
        });
        
        // ⭐ HA TÚLSÁGOSAN KEVÉS PONT, KIEGÉSZÍTÉS
        if (this.routePoints.length < 500) {
            console.log('🔄 Kevés útvonal pont, kiegészítés...');
            this.extendRoute();
        }
        
        console.log(`🛣️ Útvonal generálva: ${this.routePoints.length} pont`);
    }
    
    // ⭐ SPIRÁL ÚTVONAL GENERÁLÁSA (FALLBACK)
    generateSpiralRoute() {
        this.routePoints = [];
        const totalPoints = 1500;
        
        for (let i = 0; i < totalPoints; i++) {
            const progress = i / totalPoints;
            const spiralTurns = 2;
            const angle = progress * spiralTurns * Math.PI * 2;
            const radius = (this.mapWidth / 4) * (1 - progress * 0.5);
            
            const centerX = this.mapWidth / 2;
            const centerY = this.mapHeight / 2;
            
            const x = Math.max(10, Math.min(this.mapWidth - 10, 
                centerX + Math.cos(angle) * radius
            ));
            const y = Math.max(10, Math.min(this.mapHeight - 10, 
                centerY + Math.sin(angle) * radius + progress * this.mapHeight * 0.4
            ));
            
            this.routePoints.push({ 
                x: Math.floor(x), 
                y: Math.floor(y),
                type: 'highway'
            });
        }
    }
    
    // ⭐ ÚTVONAL KIEGÉSZÍTÉSE
    extendRoute() {
        const originalLength = this.routePoints.length;
        const targetLength = 1000;
        
        for (let i = originalLength; i < targetLength; i++) {
            const baseIndex = i % originalLength;
            const basePoint = this.routePoints[baseIndex];
            
            // ⭐ VARIÁCIÓ HOZZÁADÁSA
            const variation = (i - originalLength) * 2;
            const x = Math.max(0, Math.min(this.mapWidth - 1, 
                basePoint.x + (Math.random() - 0.5) * variation
            ));
            const y = Math.max(0, Math.min(this.mapHeight - 1, 
                basePoint.y + variation
            ));
            
            this.routePoints.push({
                x: Math.floor(x),
                y: Math.floor(y),
                type: basePoint.type || 'road'
            });
        }
    }
    
    // ⭐ TEREP ADATOK ELEMZÉSE
    analyzeTerrainData() {
        this.terrainData = [];
        const data = this.mapImageData.data;
        
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const index = (y * this.mapWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                const terrainType = this.identifyTerrainAdvanced(r, g, b);
                row.push({
                    type: terrainType,
                    color: { r, g, b },
                    elevation: this.calculateElevation(terrainType),
                    curve: this.calculateCurve(terrainType, x, y)
                });
            }
            this.terrainData.push(row);
        }
        
        console.log(`🗺️ Terep elemzés kész: ${this.terrainData.length} sor`);
    }
    
    // ⭐ FEJLETT TEREP TÍPUS AZONOSÍTÁS
    identifyTerrainAdvanced(r, g, b) {
        // ⭐ PIROS FŐUTAK
        if (r > 200 && g < 100 && b < 100) {
            return 'highway';
        }
        
        // ⭐ FEHÉR UTAK
        if (r > 220 && g > 220 && b > 220) {
            return 'road';
        }
        
        // ⭐ SÁRGA UTAK
        if (r > 200 && g > 200 && b < 100) {
            return 'highway';
        }
        
        // ⭐ KÉK VÍZ
        if (b > r + 50 && b > g + 50 && b > 100) {
            return 'river';
        }
        
        // ⭐ ZÖLD ERDŐ
        if (g > r + 30 && g > b + 30 && g > 80) {
            return 'forest';
        }
        
        // ⭐ FEKETE VÁROSOK
        if (r < 50 && g < 50 && b < 50) {
            return 'city';
        }
        
        // ⭐ SZÜRKE TERÜLETEK
        if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 100 && r < 200) {
            return 'city';
        }
        
        // ⭐ ALAPÉRTELMEZETT: FŰ
        return 'grass';
    }
    
    // ⭐ MAGASSÁG SZÁMÍTÁSA
    calculateElevation(terrainType) {
        const elevations = {
            grass: 0,
            forest: 20,
            river: -50,
            highway: 15,
            road: 8,
            city: 25,
            mountain: 80
        };
        
        return elevations[terrainType] || 0;
    }
    
    // ⭐ KANYAR SZÁMÍTÁSA
    calculateCurve(terrainType, x, y) {
        if (terrainType !== 'highway' && terrainType !== 'road') {
            return 0;
        }
        
        // ⭐ KÖRNYEZŐ PIXELEK ELEMZÉSE
        let leftSimilar = 0;
        let rightSimilar = 0;
        
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const checkX = x + dx;
                const checkY = y + dy;
                
                if (checkX >= 0 && checkX < this.mapWidth && 
                    checkY >= 0 && checkY < this.mapHeight) {
                    
                    const checkType = this.getTerrainAt(checkX, checkY);
                    if (checkType === terrainType) {
                        if (dx < 0) leftSimilar++;
                        if (dx > 0) rightSimilar++;
                    }
                }
            }
        }
        
        const curveFactor = (rightSimilar - leftSimilar) / 15;
        return Math.max(-0.8, Math.min(0.8, curveFactor));
    }
    
    // ⭐ PÁLYA GENERÁLÁSA TÉRKÉP ALAPJÁN
    generateTrackFromMap(game) {
        if (!this.terrainData.length || !this.routePoints.length) {
            console.warn('⚠️ Nincs térkép adat, alapértelmezett pálya generálása');
            this.generateDefaultTerrain();
            return;
        }
        
        game.road = [];
        game.signs = [];
        
        const segmentLength = game.segmentLength;
        const totalSegments = Math.max(1000, this.routePoints.length); // Minimum 1000 szegmens
        game.trackLength = totalSegments * segmentLength;
        
        let currentHill = 0;
        let currentCurve = 0;
        
        console.log(`🏗️ Pálya építése térképből: ${totalSegments} szegmens (${Math.round(game.trackLength/1000)}km)`);
        
        for (let i = 0; i < totalSegments; i++) {
            // ⭐ ÚTVONAL PONT LEKÉRÉSE (CIKLIKUS)
            const routeIndex = i % this.routePoints.length;
            const routePoint = this.routePoints[routeIndex];
            const terrain = this.getTerrainDataAt(routePoint.x, routePoint.y);
            
            // ⭐ MAGASSÁG ÉS KANYAR FRISSÍTÉSE
            currentHill = this.smoothTransition(currentHill, terrain.elevation, 0.03);
            currentCurve = this.smoothTransition(currentCurve, terrain.curve, 0.08);
            
            // ⭐ SZEGMENS LÉTREHOZÁSA
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
                terrainType: terrain.type,
                color: this.getSegmentColor(terrain.type, i),
                mapPosition: { x: routePoint.x, y: routePoint.y }
            };
            
            this.placeSigns(game, terrain, i, segmentLength);
            game.road.push(segment);
        }
        
        console.log(`✅ Térkép alapú pálya kész: ${game.road.length} szegmens, ${game.signs.length} tábla`);
    }
    
    // ⭐ TEREP ADAT LEKÉRÉSE KOORDINÁTÁKKAL
    getTerrainDataAt(x, y) {
        if (!this.terrainData.length) {
            return { type: 'grass', elevation: 0, curve: 0 };
        }
        
        const clampedY = Math.max(0, Math.min(this.mapHeight - 1, y));
        const clampedX = Math.max(0, Math.min(this.mapWidth - 1, x));
        
        if (this.terrainData[clampedY] && this.terrainData[clampedY][clampedX]) {
            return this.terrainData[clampedY][clampedX];
        }
        
        return { type: 'grass', elevation: 0, curve: 0 };
    }
    
    // ⭐ SIMA ÁTMENET
    smoothTransition(current, target, factor) {
        return current + (target - current) * factor;
    }
    
    // ⭐ SZEGMENS SZÍN MEGHATÁROZÁSA
    getSegmentColor(terrainType, segmentIndex) {
        const baseColor = segmentIndex % 3 === 0 ? 'dark' : 'light';
        
        switch (terrainType) {
            case 'river':
                return segmentIndex % 2 === 0 ? 'water_dark' : 'water_light';
            case 'highway':
                return segmentIndex % 2 === 0 ? 'highway_dark' : 'highway_light';
            case 'city':
                return segmentIndex % 2 === 0 ? 'city_dark' : 'city_light';
            case 'road':
                return segmentIndex % 2 === 0 ? 'road_dark' : 'road_light';
            case 'forest':
                return segmentIndex % 2 === 0 ? 'forest_dark' : 'forest_light';
            default:
                return baseColor;
        }
    }
    
    // ⭐ TÁBLÁK ELHELYEZÉSE
    placeSigns(game, terrain, segmentIndex, segmentLength) {
        if (terrain.type === 'city' && segmentIndex % 250 === 0) {
            game.signs.push({
                type: 'city',
                cityName: this.getRandomCityName(),
                z: segmentIndex * segmentLength,
                offset: Math.random() > 0.5 ? 0.8 : -0.8,
                sprite: null
            });
        }
        
        if ((terrain.type === 'highway' || terrain.type === 'road') && segmentIndex % 400 === 0) {
            const speedLimit = terrain.type === 'highway' ? 130 : 90;
            game.signs.push({
                type: 'speed',
                speedLimit: speedLimit,
                z: segmentIndex * segmentLength,
                offset: Math.random() > 0.5 ? 0.7 : -0.7,
                sprite: null
            });
        }
        
        if (Math.abs(terrain.curve) > 0.4 && segmentIndex % 200 === 0) {
            const direction = terrain.curve > 0 ? 'right' : 'left';
            game.signs.push({
                type: 'curve',
                direction: direction,
                z: (segmentIndex - 30) * segmentLength,
                offset: terrain.curve > 0 ? -0.7 : 0.7,
                distance: 30 * segmentLength,
                sprite: null
            });
        }
    }
    
    // ⭐ BORSOD MEGYE VÁROSOK
    getRandomCityName() {
        const cities = [
            'MISKOLC', 'KAZINCBARCIKA', 'TISZAÚJVÁROS', 'ÓZDI', 'SÁTORALJAÚJHELY',
            'MEZŐKÖVESD', 'SZERENCS', 'EDELÉNY', 'PUTNOK', 'BORSODNÁDASD',
            'TISZALÚC', 'SAJÓSZENTPÉTER', 'ALSÓZSOLCA', 'FELSŐZSOLCA'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
    
    // ⭐ ALAPÉRTELMEZETT TEREP
    generateDefaultTerrain() {
        this.terrainData = [];
        const defaultHeight = 400;
        const defaultWidth = 400;
        
        for (let y = 0; y < defaultHeight; y++) {
            const row = [];
            for (let x = 0; x < defaultWidth; x++) {
                let terrainType = 'grass';
                
                if (x >= defaultWidth * 0.4 && x <= defaultWidth * 0.6) {
                    terrainType = Math.random() > 0.7 ? 'highway' : 'road';
                } else if (Math.random() > 0.9) {
                    terrainType = 'city';
                } else if (Math.random() > 0.95) {
                    terrainType = 'river';
                }
                
                row.push({
                    type: terrainType,
                    elevation: this.calculateElevation(terrainType),
                    curve: (Math.random() - 0.5) * 0.5
                });
            }
            this.terrainData.push(row);
        }
        
        this.mapWidth = defaultWidth;
        this.mapHeight = defaultHeight;
        
        this.routePoints = [];
        for (let i = 0; i < 1200; i++) {
            this.routePoints.push({
                x: Math.floor(defaultWidth / 2 + Math.sin(i * 0.02) * 80),
                y: Math.floor(i / 3),
                type: 'highway'
            });
        }
        
        console.log('🎨 Alapértelmezett terep generálva');
    }
    
    // ⭐ AKTUÁLIS POZÍCIÓ LEKÉRÉSE
    getCurrentMapPosition(gamePosition, trackLength) {
        if (!this.routePoints.length) return { x: 0, y: 0 };
        
        const progress = Math.max(0, Math.min(1, gamePosition / trackLength));
        const pointIndex = Math.floor(progress * (this.routePoints.length - 1));
        
        return this.routePoints[pointIndex] || { x: 0, y: 0 };
    }
    
    // ⭐ MINI TÉRKÉP ADATOK
    getMiniMapData() {
        return {
            originalImage: this.originalImage,
            routePoints: this.routePoints,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            roadNetwork: this.roadNetwork
        };
    }
    
    // ⭐ TEREP TÍPUS LEKÉRÉSE
    getTerrainAt(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return 'grass';
        }
        
        if (!this.terrainData[y] || !this.terrainData[y][x]) {
            return 'grass';
        }
        
        return this.terrainData[y][x].type;
    }
}
