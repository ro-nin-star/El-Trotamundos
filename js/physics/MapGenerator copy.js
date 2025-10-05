export class MapGenerator {
    constructor() {
        this.mapCanvas = null;
        this.mapCtx = null;
        this.mapImageData = null;
        this.mapWidth = 0;
        this.mapHeight = 0;
        
        // ⭐ SZÍN KÓDOK A TÉRKÉP ELEMEKHEZ
        this.colorMap = {
            grass: { r: 128, g: 0, b: 128, tolerance: 20 },      // Lila - fű
            river: { r: 0, g: 0, b: 255, tolerance: 30 },        // Kék - folyók
            highway: { r: 255, g: 255, b: 0, tolerance: 20 },    // Sárga - főutak
            road: { r: 255, g: 255, b: 255, tolerance: 20 },     // Fehér - alsóbb rangú utak
            roadBorder: { r: 255, g: 0, b: 0, tolerance: 20 },   // Piros - út szegély
            city: { r: 128, g: 128, b: 128, tolerance: 30 }      // Szürke - város
        };
        
        this.terrainData = [];
    }
    
    // ⭐ TÉRKÉP BETÖLTÉSE ÉS ELEMZÉSE
    async loadMap(mapImageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
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
        
        // ⭐ MÉRETEZÉS (OPTIMÁLIS FELBONTÁS)
        const maxSize = 512; // Maximum térkép méret a teljesítmény miatt
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
    
    // ⭐ TEREP TÍPUS AZONOSÍTÁSA SZÍN ALAPJÁN
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
        
        return bestMatch;
    }
    
    // ⭐ MAGASSÁG SZÁMÍTÁSA TEREP TÍPUS ALAPJÁN
    calculateElevation(terrainType) {
        const elevations = {
            grass: 0,
            river: -50,      // Folyók mélyebben
            highway: 10,     // Főutak kicsit magasabban
            road: 5,         // Utak kicsit magasabban
            roadBorder: 5,
            city: 20         // Városok magasabban
        };
        
        return elevations[terrainType] || 0;
    }
    
    // ⭐ KANYAR SZÁMÍTÁSA KÖRNYEZET ALAPJÁN
    calculateCurve(terrainType, x, y) {
        if (terrainType !== 'highway' && terrainType !== 'road') {
            return 0; // Csak utakon van kanyar
        }
        
        // ⭐ KÖRNYEZŐ PIXELEK ELEMZÉSE KANYAR IRÁNYÁHOZ
        let leftRoad = 0;
        let rightRoad = 0;
        
        // Balra néz
        if (x > 0) {
            const leftType = this.getTerrainAt(x - 1, y);
            if (leftType === 'highway' || leftType === 'road') leftRoad++;
        }
        
        // Jobbra néz
        if (x < this.mapWidth - 1) {
            const rightType = this.getTerrainAt(x + 1, y);
            if (rightType === 'highway' || rightType === 'road') rightRoad++;
        }
        
        // ⭐ KANYAR IRÁNY MEGHATÁROZÁSA
        if (leftRoad > rightRoad) {
            return -0.5; // Balra kanyar
        } else if (rightRoad > leftRoad) {
            return 0.5;  // Jobbra kanyar
        }
        
        return 0; // Egyenes
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
    
    // ⭐ PÁLYA GENERÁLÁSA TÉRKÉP ALAPJÁN
    generateTrackFromMap(game) {
        if (!this.terrainData.length) {
            console.warn('⚠️ Nincs térkép adat, alapértelmezett pálya generálása');
            this.generateDefaultTerrain();
        }
        
        game.road = [];
        game.signs = [];
        
        const trackLength = game.trackLength;
        const segmentLength = game.segmentLength;
        const totalSegments = Math.floor(trackLength / segmentLength);
        
        let currentHill = 0;
        let currentCurve = 0;
        
        console.log(`🏗️ Pálya építése térképből: ${totalSegments} szegmens`);
        
        for (let i = 0; i < totalSegments; i++) {
            // ⭐ TÉRKÉP POZÍCIÓ SZÁMÍTÁSA
            const mapProgress = i / totalSegments;
            const mapY = Math.floor(mapProgress * this.mapHeight);
            const mapX = Math.floor(this.mapWidth / 2); // Középen haladunk
            
            // ⭐ TEREP ADATOK LEKÉRÉSE
            const terrain = this.getTerrainDataAt(mapX, mapY);
            
            // ⭐ MAGASSÁG ÉS KANYAR FRISSÍTÉSE
            currentHill = this.smoothTransition(currentHill, terrain.elevation, 0.05);
            currentCurve = this.smoothTransition(currentCurve, terrain.curve, 0.1);
            
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
                color: this.getSegmentColor(terrain.type, i)
            };
            
            // ⭐ TÁBLÁK ELHELYEZÉSE
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
                return segmentIndex % 2 === 0 ? 'water_dark' : 'water_light';
            case 'highway':
                return segmentIndex % 2 === 0 ? 'highway_dark' : 'highway_light';
            case 'city':
                return segmentIndex % 2 === 0 ? 'city_dark' : 'city_light';
            case 'road':
                return segmentIndex % 2 === 0 ? 'road_dark' : 'road_light';
            default:
                return baseColor;
        }
    }
    
    // ⭐ TÁBLÁK ELHELYEZÉSE TEREP ALAPJÁN
    placeSigns(game, terrain, segmentIndex, segmentLength) {
        // ⭐ VÁROS TÁBLÁK
        if (terrain.type === 'city' && segmentIndex % 100 === 0) {
            game.signs.push({
                type: 'city',
                cityName: this.getRandomCityName(),
                z: segmentIndex * segmentLength,
                offset: Math.random() > 0.5 ? 0.8 : -0.8,
                sprite: null
            });
        }
        
        // ⭐ SEBESSÉG TÁBLÁK FŐUTAKON
        if (terrain.type === 'highway' && segmentIndex % 150 === 0) {
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
        if (Math.abs(terrain.curve) > 0.3 && segmentIndex % 80 === 0) {
            const direction = terrain.curve > 0 ? 'right' : 'left';
            game.signs.push({
                type: 'curve',
                direction: direction,
                z: (segmentIndex - 10) * segmentLength,
                offset: terrain.curve > 0 ? -0.7 : 0.7,
                distance: 10 * segmentLength,
                sprite: null
            });
        }
    }
    
    // ⭐ VÉLETLENSZERŰ VÁROS NEVEK
    getRandomCityName() {
        const cities = [
            'BUDAPEST', 'DEBRECEN', 'SZEGED', 'MISKOLC', 'PÉCS',
            'GYŐR', 'NYÍREGYHÁZA', 'KECSKEMÉT', 'SZÉKESFEHÉRVÁR',
            'SZOMBATHELY', 'SZOLNOK', 'TATABÁNYA', 'KAPOSVÁR'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
    
    // ⭐ ALAPÉRTELMEZETT TEREP GENERÁLÁSA (HA NINCS TÉRKÉP)
    generateDefaultTerrain() {
        this.terrainData = [];
        const defaultHeight = 100;
        const defaultWidth = 200;
        
        for (let y = 0; y < defaultHeight; y++) {
            const row = [];
            for (let x = 0; x < defaultWidth; x++) {
                let terrainType = 'grass';
                
                // ⭐ EGYSZERŰ MINTÁZAT
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
        
        console.log('🎨 Alapértelmezett terep generálva');
    }
    
    // ⭐ DEBUG: TÉRKÉP MEGJELENÍTÉSE
    showMapDebug() {
        if (!this.mapCanvas) return;
        
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
        `;
        
        const debugCanvas = this.mapCanvas.cloneNode();
        debugCanvas.style.cssText = `
            width: 200px;
            height: auto;
            border: 1px solid white;
        `;
        
        const legend = document.createElement('div');
        legend.innerHTML = `
            <div style="color: white; font-size: 12px; margin-top: 5px;">
                <div>🟣 Lila = Fű</div>
                <div>🔵 Kék = Folyó</div>
                <div>🟡 Sárga = Főút</div>
                <div>⚪ Fehér = Út</div>
                <div>🔴 Piros = Út szél</div>
                <div>⚫ Szürke = Város</div>
            </div>
        `;
        
        debugDiv.appendChild(debugCanvas);
        debugDiv.appendChild(legend);
        document.body.appendChild(debugDiv);
        
        setTimeout(() => debugDiv.remove(), 10000);
    }
}
