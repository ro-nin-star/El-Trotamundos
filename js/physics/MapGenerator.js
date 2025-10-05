export class MapGenerator {
    constructor() {
        this.mapCanvas = null;
        this.mapCtx = null;
        this.mapImageData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        this.originalImage = null; // ⭐ EREDETI KÉP TÁROLÁSA A MINI TÉRKÉPHEZ
        
        // ⭐ SZÍN KÓDOK A TÉRKÉP ELEMEKHEZ
        this.colorMap = {
            grass: { r: 128, g: 0, b: 128, tolerance: 50 },      // Lila - fű (nagyobb tolerancia)
            river: { r: 0, g: 0, b: 255, tolerance: 60 },        // Kék - folyók
            highway: { r: 255, g: 255, b: 0, tolerance: 50 },    // Sárga - főutak
            road: { r: 255, g: 255, b: 255, tolerance: 40 },     // Fehér - alsóbb rangú utak
            roadBorder: { r: 255, g: 0, b: 0, tolerance: 40 },   // Piros - út szegély
            city: { r: 128, g: 128, b: 128, tolerance: 60 },     // Szürke - város
            // ⭐ TOVÁBBI SZÍNEK A VALÓS TÉRKÉPHEZ
            forest: { r: 0, g: 128, b: 0, tolerance: 50 },       // Zöld - erdő
            mountain: { r: 139, g: 69, b: 19, tolerance: 50 },   // Barna - hegyek
            water: { r: 173, g: 216, b: 230, tolerance: 50 }     // Világoskék - víz
        };
        
        this.terrainData = [];
        this.routePoints = []; // ⭐ ÚTVONAL PONTOK A MINI TÉRKÉPHEZ
    }
    
    // ⭐ TÉRKÉP BETÖLTÉSE ÉS ELEMZÉSE
    async loadMap(mapImageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.originalImage = img; // ⭐ EREDETI KÉP MENTÉSE
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
        
        // ⭐ MÉRETEZÉS (NAGYOBB FELBONTÁS A HOSSZABB PÁLYÁHOZ)
        const maxSize = 1024; // Nagyobb méret = hosszabb pálya
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
        
        // ⭐ KÉP RAJZOLÁSA ÉS PIXEL ADATOK KINYERÉSE
        this.mapCtx.drawImage(img, 0, 0, width, height);
        this.mapImageData = this.mapCtx.getImageData(0, 0, width, height);
        
        // ⭐ TEREP ADATOK ELEMZÉSE
        this.analyzeTerrainData();
        
        // ⭐ ÚTVONAL PONTOK GENERÁLÁSA
        this.generateRoutePoints();
    }
    
    // ⭐ ÚTVONAL PONTOK GENERÁLÁSA (SPIRÁL VAGY CIKK-CAKK)
    generateRoutePoints() {
        this.routePoints = [];
        const totalPoints = Math.max(2000, this.mapHeight * 4); // ⭐ SOKKAL TÖBB PONT = HOSSZABB PÁLYA
        
        for (let i = 0; i < totalPoints; i++) {
            const progress = i / totalPoints;
            
            // ⭐ SPIRÁL ÚTVONAL A TÉRKÉP KÖRÜL
            const spiralTurns = 3; // Hányszor kerüljük körbe a térképet
            const angle = progress * spiralTurns * Math.PI * 2;
            const radius = (this.mapWidth / 4) * (1 - progress * 0.7); // Spirál befelé
            
            const centerX = this.mapWidth / 2;
            const centerY = this.mapHeight / 2;
            
            const x = Math.max(10, Math.min(this.mapWidth - 10, 
                centerX + Math.cos(angle) * radius
            ));
            const y = Math.max(10, Math.min(this.mapHeight - 10, 
                centerY + Math.sin(angle) * radius + progress * this.mapHeight * 0.3
            ));
            
            this.routePoints.push({ x: Math.floor(x), y: Math.floor(y) });
        }
        
        console.log(`🛣️ Útvonal generálva: ${this.routePoints.length} pont`);
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
                
                const terrainType = this.identifyTerrain(r, g, b);
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
    
    // ⭐ TEREP TÍPUS AZONOSÍTÁSA SZÍN ALAPJÁN (JAVÍTOTT)
    identifyTerrain(r, g, b) {
        let bestMatch = 'grass';
        let bestDistance = Infinity;
        
        for (const [type, color] of Object.entries(this.colorMap)) {
            const distance = Math.sqrt(
                Math.pow(r - color.r, 2) +
                Math.pow(g - color.g, 2) +
                Math.pow(b - color.b, 2)
            );
            
            if (distance < color.tolerance && distance < bestDistance) {
                bestDistance = distance;
                bestMatch = type;
            }
        }
        
        // ⭐ SPECIÁLIS ESETEK BORSOD MEGYE TÉRKÉPHEZ
        if (r > 200 && g > 200 && b > 200) {
            return 'road'; // Világos területek = utak
        }
        if (r < 100 && g < 100 && b > 150) {
            return 'river'; // Sötétkék = folyók
        }
        if (r > 150 && g > 150 && b < 100) {
            return 'city'; // Sárgás = városok
        }
        
        return bestMatch;
    }
    
    // ⭐ MAGASSÁG SZÁMÍTÁSA TEREP TÍPUS ALAPJÁN
    calculateElevation(terrainType) {
        const elevations = {
            grass: 0,
            forest: 20,      // Erdők magasabban
            river: -50,      // Folyók mélyebben
            water: -30,      // Víz mélyebben
            highway: 10,     // Főutak kicsit magasabban
            road: 5,         // Utak kicsit magasabban
            roadBorder: 5,
            city: 30,        // Városok magasabban
            mountain: 100    // Hegyek magasan
        };
        
        return elevations[terrainType] || 0;
    }
    
    // ⭐ KANYAR SZÁMÍTÁSA KÖRNYEZET ALAPJÁN
    calculateCurve(terrainType, x, y) {
        // ⭐ KÖRNYEZŐ PIXELEK ELEMZÉSE
        let leftSimilar = 0;
        let rightSimilar = 0;
        
        for (let dx = -2; dx <= 2; dx++) {
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
        
        // ⭐ KANYAR IRÁNY MEGHATÁROZÁSA
        const curveFactor = (rightSimilar - leftSimilar) / 10;
        return Math.max(-1, Math.min(1, curveFactor));
    }
    
    // ⭐ TEREP TÍPUS LEKÉRÉSE KOORDINÁTA ALAPJÁN
    getTerrainAt(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return 'grass';
        }
        
        if (!this.terrainData[y] || !this.terrainData[y][x]) {
            return 'grass';
        }
        
        return this.terrainData[y][x].type;
    }
    
    // ⭐ PÁLYA GENERÁLÁSA TÉRKÉP ALAPJÁN (JAVÍTOTT HOSSZÚ VERZIÓ)
    generateTrackFromMap(game) {
        if (!this.terrainData.length || !this.routePoints.length) {
            console.warn('⚠️ Nincs térkép adat, alapértelmezett pálya generálása');
            this.generateDefaultTerrain();
            return;
        }
        
        game.road = [];
        game.signs = [];
        
        // ⭐ PÁLYA HOSSZ AZ ÚTVONAL PONTOK ALAPJÁN
        const segmentLength = game.segmentLength;
        const totalSegments = this.routePoints.length; // Útvonal pontok száma = szegmensek száma
        game.trackLength = totalSegments * segmentLength; // ⭐ DINAMIKUS PÁLYA HOSSZ
        
        let currentHill = 0;
        let currentCurve = 0;
        
        console.log(`🏗️ Hosszú pálya építése térképből: ${totalSegments} szegmens (${Math.round(game.trackLength/1000)}km)`);
        
        for (let i = 0; i < totalSegments; i++) {
            // ⭐ ÚTVONAL PONT LEKÉRÉSE
            const routePoint = this.routePoints[i];
            const terrain = this.getTerrainDataAt(routePoint.x, routePoint.y);
            
            // ⭐ MAGASSÁG ÉS KANYAR FRISSÍTÉSE
            currentHill = this.smoothTransition(currentHill, terrain.elevation, 0.02);
            currentCurve = this.smoothTransition(currentCurve, terrain.curve, 0.05);
            
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
                mapPosition: { x: routePoint.x, y: routePoint.y } // ⭐ TÉRKÉP POZÍCIÓ TÁROLÁSA
            };
            
            // ⭐ TÁBLÁK ELHELYEZÉSE
            this.placeSigns(game, terrain, i, segmentLength);
            
            game.road.push(segment);
        }
        
        console.log(`✅ Térkép alapú hosszú pálya kész: ${game.road.length} szegmens, ${game.signs.length} tábla`);
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
    
    // ⭐ SIMA ÁTMENET SZÁMÍTÁSA
    smoothTransition(current, target, factor) {
        return current + (target - current) * factor;
    }
    
    // ⭐ SZEGMENS SZÍN MEGHATÁROZÁSA TEREP TÍPUS ALAPJÁN
    getSegmentColor(terrainType, segmentIndex) {
        const baseColor = segmentIndex % 3 === 0 ? 'dark' : 'light';
        
        // ⭐ TEREP SPECIFIKUS SZÍNEK
        switch (terrainType) {
            case 'river':
            case 'water':
                return segmentIndex % 2 === 0 ? 'water_dark' : 'water_light';
            case 'highway':
                return segmentIndex % 2 === 0 ? 'highway_dark' : 'highway_light';
            case 'city':
                return segmentIndex % 2 === 0 ? 'city_dark' : 'city_light';
            case 'road':
                return segmentIndex % 2 === 0 ? 'road_dark' : 'road_light';
            case 'forest':
                return segmentIndex % 2 === 0 ? 'forest_dark' : 'forest_light';
            case 'mountain':
                return segmentIndex % 2 === 0 ? 'mountain_dark' : 'mountain_light';
            default:
                return baseColor;
        }
    }
    
    // ⭐ TÁBLÁK ELHELYEZÉSE TEREP ALAPJÁN
    placeSigns(game, terrain, segmentIndex, segmentLength) {
        // ⭐ VÁROS TÁBLÁK
        if (terrain.type === 'city' && segmentIndex % 200 === 0) {
            game.signs.push({
                type: 'city',
                cityName: this.getRandomCityName(),
                z: segmentIndex * segmentLength,
                offset: Math.random() > 0.5 ? 0.8 : -0.8,
                sprite: null
            });
        }
        
        // ⭐ SEBESSÉG TÁBLÁK
        if ((terrain.type === 'highway' || terrain.type === 'road') && segmentIndex % 300 === 0) {
            const speedLimit = terrain.type === 'highway' ? 130 : 90;
            game.signs.push({
                type: 'speed',
                speedLimit: speedLimit,
                z: segmentIndex * segmentLength,
                offset: Math.random() > 0.5 ? 0.7 : -0.7,
                sprite: null
            });
        }
        
        // ⭐ KANYAR TÁBLÁK
        if (Math.abs(terrain.curve) > 0.4 && segmentIndex % 150 === 0) {
            const direction = terrain.curve > 0 ? 'right' : 'left';
            game.signs.push({
                type: 'curve',
                direction: direction,
                z: (segmentIndex - 20) * segmentLength,
                offset: terrain.curve > 0 ? -0.7 : 0.7,
                distance: 20 * segmentLength,
                sprite: null
            });
        }
    }
    
    // ⭐ VÉLETLENSZERŰ VÁROS NEVEK (BORSOD MEGYE)
    getRandomCityName() {
        const cities = [
            'MISKOLC', 'KAZINCBARCIKA', 'TISZAÚJVÁROS', 'ÓZDI', 'SÁTORALJAÚJHELY',
            'MEZŐKÖVESD', 'SZERENCS', 'EDELÉNY', 'PUTNOK', 'BORSODNÁDASD',
            'TISZALÚC', 'SAJÓSZENTPÉTER', 'ALSÓZSOLCA', 'FELSŐZSOLCA'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
    
    // ⭐ ALAPÉRTELMEZETT TEREP GENERÁLÁSA (HA NINCS TÉRKÉP)
    generateDefaultTerrain() {
        this.terrainData = [];
        const defaultHeight = 500; // Nagyobb alapértelmezett méret
        const defaultWidth = 500;
        
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
        
        // ⭐ ALAPÉRTELMEZETT ÚTVONAL PONTOK
        this.routePoints = [];
        for (let i = 0; i < 2000; i++) {
            this.routePoints.push({
                x: Math.floor(defaultWidth / 2 + Math.sin(i * 0.01) * 100),
                y: Math.floor(i / 4)
            });
        }
        
        console.log('🎨 Alapértelmezett hosszú terep generálva');
    }
    
    // ⭐ AKTUÁLIS POZÍCIÓ LEKÉRÉSE A TÉRKÉPEN
    getCurrentMapPosition(gamePosition, trackLength) {
        if (!this.routePoints.length) return { x: 0, y: 0 };
        
        const progress = Math.max(0, Math.min(1, gamePosition / trackLength));
        const pointIndex = Math.floor(progress * (this.routePoints.length - 1));
        
        return this.routePoints[pointIndex] || { x: 0, y: 0 };
    }
    
    // ⭐ MINI TÉRKÉP ADATOK LEKÉRÉSE
    getMiniMapData() {
        return {
            originalImage: this.originalImage,
            routePoints: this.routePoints,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight
        };
    }
}
