class RealisticHungaryMap {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playerMarker = document.getElementById('playerMarker');
        
        // Térkép beállítások
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Játékos pozíció (Budapest központ)
        this.playerLat = 47.4979;
        this.playerLng = 19.0402;
        
        // Statisztikák
        this.visitedPlaces = new Set();
        this.totalDistance = 0;
        this.lastPosition = { lat: this.playerLat, lng: this.playerLng };
        
        // Magyarország pontos határai
        this.hungaryBounds = {
            north: 48.585,
            south: 45.737,
            east: 22.906,
            west: 16.113
        };
        
        // Magyarország pontos határvonala (főbb pontok)
        this.hungaryBorder = [
            // Nyugati határ (Ausztria)
            { lat: 47.73, lng: 16.113 }, // Rajka
            { lat: 47.69, lng: 16.15 },
            { lat: 47.65, lng: 16.18 },
            { lat: 47.61, lng: 16.21 },
            { lat: 47.50, lng: 16.25 },
            { lat: 47.35, lng: 16.32 },
            { lat: 47.20, lng: 16.40 },
            { lat: 47.05, lng: 16.48 },
            { lat: 46.90, lng: 16.55 },
            { lat: 46.75, lng: 16.62 },
            { lat: 46.60, lng: 16.70 },
            { lat: 46.45, lng: 16.78 },
            { lat: 46.30, lng: 16.85 },
            { lat: 46.15, lng: 16.92 },
            { lat: 46.00, lng: 17.00 },
            { lat: 45.85, lng: 17.10 },
            { lat: 45.737, lng: 17.20 }, // Déli csúcs
            
            // Déli határ (Horvátország, Szerbia)
            { lat: 45.75, lng: 17.40 },
            { lat: 45.77, lng: 17.70 },
            { lat: 45.79, lng: 18.00 },
            { lat: 45.81, lng: 18.30 },
            { lat: 45.83, lng: 18.60 },
            { lat: 45.85, lng: 18.90 },
            { lat: 45.87, lng: 19.20 },
            { lat: 45.89, lng: 19.50 },
            { lat: 45.91, lng: 19.80 },
            { lat: 45.93, lng: 20.10 },
            { lat: 45.95, lng: 20.40 },
            { lat: 45.97, lng: 20.70 },
            { lat: 45.99, lng: 21.00 },
            
            // Keleti határ (Románia)
            { lat: 46.10, lng: 21.20 },
            { lat: 46.25, lng: 21.35 },
            { lat: 46.40, lng: 21.50 },
            { lat: 46.55, lng: 21.65 },
            { lat: 46.70, lng: 21.80 },
            { lat: 46.85, lng: 21.95 },
            { lat: 47.00, lng: 22.10 },
            { lat: 47.15, lng: 22.25 },
            { lat: 47.30, lng: 22.40 },
            { lat: 47.45, lng: 22.55 },
            { lat: 47.60, lng: 22.70 },
            { lat: 47.75, lng: 22.85 },
            { lat: 47.90, lng: 22.906 }, // Keleti csúcs
            
            // Északi határ (Szlovákia)
            { lat: 48.05, lng: 22.85 },
            { lat: 48.20, lng: 22.70 },
            { lat: 48.35, lng: 22.55 },
            { lat: 48.50, lng: 22.40 },
            { lat: 48.585, lng: 22.25 }, // Északi csúcs
            { lat: 48.57, lng: 22.00 },
            { lat: 48.55, lng: 21.75 },
            { lat: 48.53, lng: 21.50 },
            { lat: 48.51, lng: 21.25 },
            { lat: 48.49, lng: 21.00 },
            { lat: 48.47, lng: 20.75 },
            { lat: 48.45, lng: 20.50 },
            { lat: 48.43, lng: 20.25 },
            { lat: 48.41, lng: 20.00 },
            { lat: 48.39, lng: 19.75 },
            { lat: 48.37, lng: 19.50 },
            { lat: 48.35, lng: 19.25 },
            { lat: 48.33, lng: 19.00 },
            { lat: 48.31, lng: 18.75 },
            { lat: 48.29, lng: 18.50 },
            { lat: 48.27, lng: 18.25 },
            { lat: 48.25, lng: 18.00 },
            { lat: 48.23, lng: 17.75 },
            { lat: 48.21, lng: 17.50 },
            { lat: 48.19, lng: 17.25 },
            { lat: 48.17, lng: 17.00 },
            { lat: 48.15, lng: 16.75 },
            { lat: 48.10, lng: 16.50 },
            { lat: 48.00, lng: 16.30 },
            { lat: 47.90, lng: 16.20 },
            { lat: 47.80, lng: 16.13 }
        ];
        
        // Városok pontos koordinátái
        this.cities = [
            { name: "Budapest", lat: 47.4979, lng: 19.0402, type: "capital", population: 1750000 },
            { name: "Debrecen", lat: 47.5316, lng: 21.6273, type: "major", population: 201981 },
            { name: "Szeged", lat: 46.2530, lng: 20.1414, type: "major", population: 161921 },
            { name: "Miskolc", lat: 48.1034, lng: 20.7784, type: "major", population: 157177 },
            { name: "Pécs", lat: 46.0727, lng: 18.2330, type: "major", population: 145347 },
            { name: "Győr", lat: 47.6875, lng: 17.6504, type: "major", population: 129435 },
            { name: "Nyíregyháza", lat: 47.9559, lng: 21.7183, type: "major", population: 118001 },
            { name: "Kecskemét", lat: 46.9077, lng: 19.6922, type: "city", population: 109651 },
            { name: "Székesfehérvár", lat: 47.1839, lng: 18.4104, type: "city", population: 95818 },
            { name: "Szombathely", lat: 47.2306, lng: 16.6218, type: "city", population: 76062 },
            { name: "Szolnok", lat: 47.1747, lng: 20.1993, type: "city", population: 69108 },
            { name: "Tatabánya", lat: 47.5692, lng: 18.3981, type: "city", population: 66710 },
            { name: "Kaposvár", lat: 46.3598, lng: 17.7972, type: "city", population: 61072 },
            { name: "Békéscsaba", lat: 46.6761, lng: 21.0919, type: "city", population: 58898 },
            { name: "Érd", lat: 47.3964, lng: 18.9061, type: "city", population: 68206 },
            { name: "Hódmezővásárhely", lat: 46.4186, lng: 20.3308, type: "city", population: 44004 },
            { name: "Zalaegerszeg", lat: 46.8450, lng: 16.8453, type: "city", population: 56702 },
            { name: "Sopron", lat: 47.6833, lng: 16.5833, type: "city", population: 61451 },
            { name: "Eger", lat: 47.9026, lng: 20.3734, type: "city", population: 53020 }
        ];
        
        // Hegységek
        this.mountains = [
            { name: "Mátra", lat: 47.8, lng: 19.9, radius: 30 },
            { name: "Bükk", lat: 48.1, lng: 20.5, radius: 25 },
            { name: "Zemplén", lat: 48.3, lng: 21.4, radius: 20 },
            { name: "Bakony", lat: 47.2, lng: 17.8, radius: 35 },
            { name: "Mecsek", lat: 46.1, lng: 18.2, radius: 15 }
        ];
        
        // Víztestek inicializálása
        this.waterBodies = [
            { name: "Duna", type: "river", points: this.generateDanubePoints() },
            { name: "Tisza", type: "river", points: this.generateTiszaPoints() },
            { name: "Balaton", type: "lake", points: this.generateBalatonPoints() },
            { name: "Velencei-tó", type: "lake", points: this.generateVelencePoints() }
        ];
        
        this.initializeMap();
        this.setupControls();
        this.updatePlayerPosition();
        this.addToVisited();
    }
    
    // Pontos Duna folyó pontjai
    generateDanubePoints() {
        return [
            { lat: 47.8, lng: 17.8 },   // Mosonmagyaróvár környéke
            { lat: 47.75, lng: 17.85 },
            { lat: 47.7, lng: 17.9 },
            { lat: 47.65, lng: 17.95 },
            { lat: 47.6, lng: 18.0 },   // Komárom
            { lat: 47.55, lng: 18.1 },
            { lat: 47.5, lng: 18.2 },   // Esztergom
            { lat: 47.48, lng: 18.3 },
            { lat: 47.46, lng: 18.4 },
            { lat: 47.44, lng: 18.5 },
            { lat: 47.42, lng: 18.6 },
            { lat: 47.4, lng: 18.7 },
            { lat: 47.38, lng: 18.8 },
            { lat: 47.36, lng: 18.9 },
            { lat: 47.5, lng: 19.05 },  // Budapest (Duna kanyar)
            { lat: 47.45, lng: 19.1 },
            { lat: 47.4, lng: 19.15 },
            { lat: 47.35, lng: 19.2 },
            { lat: 47.3, lng: 19.25 },
            { lat: 47.25, lng: 19.3 },
            { lat: 47.2, lng: 19.35 },
            { lat: 47.15, lng: 19.4 },  // Dunaújváros
            { lat: 47.1, lng: 19.45 },
            { lat: 47.05, lng: 19.5 },
            { lat: 47.0, lng: 19.55 },
            { lat: 46.95, lng: 19.6 },
            { lat: 46.9, lng: 19.65 },  // Baja környéke
            { lat: 46.85, lng: 19.7 },
            { lat: 46.8, lng: 19.75 },
            { lat: 46.75, lng: 19.8 },
            { lat: 46.7, lng: 19.85 },
            { lat: 46.65, lng: 19.9 },
            { lat: 46.6, lng: 19.95 },
            { lat: 46.55, lng: 20.0 },
            { lat: 46.5, lng: 20.05 },
            { lat: 46.45, lng: 20.1 },
            { lat: 46.4, lng: 20.15 },
            { lat: 46.35, lng: 20.2 },
            { lat: 46.3, lng: 20.25 },
            { lat: 46.25, lng: 20.3 },
            { lat: 46.2, lng: 20.35 },
            { lat: 46.15, lng: 20.4 },
            { lat: 46.1, lng: 20.45 },
            { lat: 46.05, lng: 20.5 }  // Szerb határ felé
        ];
    }
    
    // Pontos Tisza folyó pontjai
    generateTiszaPoints() {
        return [
            { lat: 48.0, lng: 22.2 },   // Ukrán határ
            { lat: 47.95, lng: 22.15 },
            { lat: 47.9, lng: 22.1 },
            { lat: 47.85, lng: 22.05 },
            { lat: 47.8, lng: 22.0 },
            { lat: 47.75, lng: 21.95 },
            { lat: 47.7, lng: 21.9 },
            { lat: 47.65, lng: 21.85 },
            { lat: 47.6, lng: 21.8 },   // Tokaj környéke
            { lat: 47.55, lng: 21.75 },
            { lat: 47.5, lng: 21.7 },
            { lat: 47.45, lng: 21.65 },
            { lat: 47.4, lng: 21.6 },
            { lat: 47.35, lng: 21.55 },
            { lat: 47.3, lng: 21.5 },
            { lat: 47.25, lng: 21.45 },
            { lat: 47.2, lng: 21.4 },   // Szolnok környéke
            { lat: 47.15, lng: 21.35 },
            { lat: 47.1, lng: 21.3 },
            { lat: 47.05, lng: 21.25 },
            { lat: 47.0, lng: 21.2 },
            { lat: 46.95, lng: 21.15 },
            { lat: 46.9, lng: 21.1 },
            { lat: 46.85, lng: 21.05 },
            { lat: 46.8, lng: 21.0 },
            { lat: 46.75, lng: 20.95 },
            { lat: 46.7, lng: 20.9 },
            { lat: 46.65, lng: 20.85 },
            { lat: 46.6, lng: 20.8 },
            { lat: 46.55, lng: 20.75 },
            { lat: 46.5, lng: 20.7 },
            { lat: 46.45, lng: 20.65 },
            { lat: 46.4, lng: 20.6 },
            { lat: 46.35, lng: 20.55 },
            { lat: 46.3, lng: 20.5 },
            { lat: 46.25, lng: 20.45 },
            { lat: 46.2, lng: 20.4 },   // Szeged környéke
            { lat: 46.15, lng: 20.35 },
            { lat: 46.1, lng: 20.3 },
            { lat: 46.05, lng: 20.25 },
            { lat: 46.0, lng: 20.2 }   // Szerb határ
        ];
    }
    
    // Pontos Balaton pontjai
    generateBalatonPoints() {
        return [
            // Balaton pontos alakja
            { lat: 46.75, lng: 17.25 },  // Keszthely
            { lat: 46.76, lng: 17.35 },
            { lat: 46.77, lng: 17.45 },
            { lat: 46.78, lng: 17.55 },
            { lat: 46.79, lng: 17.65 },
            { lat: 46.80, lng: 17.75 },
            { lat: 46.81, lng: 17.85 },
            { lat: 46.82, lng: 17.95 },
            { lat: 46.83, lng: 18.05 },
            { lat: 46.84, lng: 18.15 },  // Siófok
            { lat: 46.85, lng: 18.25 },
            { lat: 46.86, lng: 18.35 },
            { lat: 46.87, lng: 18.45 },  // Balatonfüred
            { lat: 46.88, lng: 18.55 },
            { lat: 46.89, lng: 18.65 },
            { lat: 46.90, lng: 18.75 },  // Tihany
            { lat: 46.89, lng: 18.85 },
            { lat: 46.88, lng: 18.95 },
            { lat: 46.87, lng: 19.05 },
            { lat: 46.86, lng: 19.15 },
            { lat: 46.85, lng: 19.25 },
            { lat: 46.84, lng: 19.35 },
            { lat: 46.83, lng: 19.25 },
            { lat: 46.82, lng: 19.15 },
            { lat: 46.81, lng: 19.05 },
            { lat: 46.80, lng: 18.95 },
            { lat: 46.79, lng: 18.85 },
            { lat: 46.78, lng: 18.75 },
            { lat: 46.77, lng: 18.65 },
            { lat: 46.76, lng: 18.55 },
            { lat: 46.75, lng: 18.45 },
            { lat: 46.74, lng: 18.35 },
            { lat: 46.73, lng: 18.25 },
            { lat: 46.72, lng: 18.15 },
            { lat: 46.71, lng: 18.05 },
            { lat: 46.70, lng: 17.95 },
            { lat: 46.71, lng: 17.85 },
            { lat: 46.72, lng: 17.75 },
            { lat: 46.73, lng: 17.65 },
            { lat: 46.74, lng: 17.55 },
            { lat: 46.75, lng: 17.45 },
            { lat: 46.76, lng: 17.35 },
            { lat: 46.75, lng: 17.25 }   // Vissza a kezdőponthoz
        ];
    }
    
    // Velencei-tó pontjainak generálása
    generateVelencePoints() {
        const centerLat = 47.2;
        const centerLng = 18.6;
        const points = [];
        
        for (let i = 0; i <= 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const radius = 0.05;
            
            points.push({
                lat: centerLat + Math.sin(angle) * radius,
                lng: centerLng + Math.cos(angle) * radius * 1.5
            });
        }
        return points;
    }
    
    // Koordináták átváltása képernyő pozícióra
    latLngToScreen(lat, lng) {
        const x = ((lng - this.hungaryBounds.west) / (this.hungaryBounds.east - this.hungaryBounds.west)) * this.width;
        const y = ((this.hungaryBounds.north - lat) / (this.hungaryBounds.north - this.hungaryBounds.south)) * this.height;
        
        return {
            x: (x + this.offsetX) * this.zoom,
            y: (y + this.offsetY) * this.zoom
        };
    }
    
    // Képernyő pozíció átváltása koordinátákra
    screenToLatLng(x, y) {
        const normalizedX = (x / this.zoom - this.offsetX) / this.width;
        const normalizedY = (y / this.zoom - this.offsetY) / this.height;
        
        const lng = this.hungaryBounds.west + normalizedX * (this.hungaryBounds.east - this.hungaryBounds.west);
        const lat = this.hungaryBounds.north - normalizedY * (this.hungaryBounds.north - this.hungaryBounds.south);
        
        return { lat, lng };
    }
    
    // Térkép inicializálása
    initializeMap() {
        this.drawMap();
    }
    
    // Térkép rajzolása
    drawMap() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Háttér (égszínkék)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Magyarország területe
        this.drawHungaryTerritory();
        
        // Hegységek
        this.drawMountains();
        
        // Víztestek
        this.drawWaterBodies();
        
        // Városok
        this.drawCities();
        
        // Határvonalak
        this.drawBorders();
    }
    
    // Magyarország területének pontos rajzolása
    drawHungaryTerritory() {
        // Alap zöld szín
        this.ctx.fillStyle = '#90EE90';
        this.ctx.beginPath();
        
        // Pontos határvonal használata
        this.hungaryBorder.forEach((point, index) => {
            const screen = this.latLngToScreen(point.lat, point.lng);
            if (index === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Árnyékolás és kontúr
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Belső árnyékolás a térképszerű megjelenéshez
        this.ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
        this.ctx.fill();
    }
    
    // Hegységek rajzolása
    drawMountains() {
        this.mountains.forEach(mountain => {
            const center = this.latLngToScreen(mountain.lat, mountain.lng);
            
            // Hegység árnyékolása
            const gradient = this.ctx.createRadialGradient(
                center.x, center.y, 0,
                center.x, center.y, mountain.radius * this.zoom
            );
            gradient.addColorStop(0, '#8B7355');
            gradient.addColorStop(0.7, '#A0522D');
            gradient.addColorStop(1, '#90EE90');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, mountain.radius * this.zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Hegység neve
            if (this.zoom > 0.8) {
                this.ctx.fillStyle = '#654321';
                this.ctx.font = `${12 * this.zoom}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(mountain.name, center.x, center.y + 5);
            }
        });
    }
    
    // Víztestek rajzolása
    drawWaterBodies() {
        this.waterBodies.forEach(water => {
            if (water.type === 'river') {
                this.drawRiver(water.points);
            } else if (water.type === 'lake') {
                this.drawLake(water.points);
            }
        });
    }
    
    // Folyó rajzolása
    drawRiver(points) {
        this.ctx.strokeStyle = '#4169E1';
        this.ctx.lineWidth = 3 * this.zoom;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        
        points.forEach((point, index) => {
            const screen = this.latLngToScreen(point.lat, point.lng);
            if (index === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.stroke();
    }
    
    // Tó rajzolása
    drawLake(points) {
        this.ctx.fillStyle = '#4169E1';
        this.ctx.beginPath();
        
        points.forEach((point, index) => {
            const screen = this.latLngToScreen(point.lat, point.lng);
            if (index === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // Városok rajzolása
    drawCities() {
        this.cities.forEach(city => {
            const screen = this.latLngToScreen(city.lat, city.lng);
            
            // Város mérete a népesség alapján
            let size = Math.log(city.population) * this.zoom;
            
            // Város típusa szerinti szín
            let color = '#FFD700';
            if (city.type === 'capital') {
                color = '#FF6347';
                size *= 1.5;
            } else if (city.type === 'major') {
                color = '#FFA500';
                size *= 1.2;
            }
            
            // Város rajzolása
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Város neve
            if (this.zoom > 0.6) {
                this.ctx.fillStyle = '#000';
                this.ctx.font = `${Math.max(10, 12 * this.zoom)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(city.name, screen.x, screen.y - size - 5);
            }
        });
    }
    
    // Határvonalak rajzolása
    drawBorders() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2 * this.zoom;
        this.ctx.setLineDash([5, 5]);
        
        // Pontos határvonal használata
        this.ctx.beginPath();
        this.hungaryBorder.forEach((point, index) => {
            const screen = this.latLngToScreen(point.lat, point.lng);
            if (index === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Pont az országon belül van-e ellenőrzés
    isPointInHungary(lat, lng) {
        // Egyszerű bounding box ellenőrzés
        if (lat < this.hungaryBounds.south || lat > this.hungaryBounds.north ||
            lng < this.hungaryBounds.west || lng > this.hungaryBounds.east) {
            return false;
        }
        
        // Pontosabb ellenőrzés a határvonal alapján (ray casting algoritmus)
        let inside = false;
        let j = this.hungaryBorder.length - 1;
        
        for (let i = 0; i < this.hungaryBorder.length; i++) {
            const xi = this.hungaryBorder[i].lng;
            const yi = this.hungaryBorder[i].lat;
            const xj = this.hungaryBorder[j].lng;
            const yj = this.hungaryBorder[j].lat;
            
            if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
            j = i;
        }
        
        return inside;
    }
    
    // Játékos pozíció frissítése
    updatePlayerPosition() {
        const screen = this.latLngToScreen(this.playerLat, this.playerLng);
        this.playerMarker.style.left = screen.x + 'px';
        this.playerMarker.style.top = screen.y + 'px';
        
        // Információk frissítése
        this.updateLocationInfo();
    }
    
    // Helyszín információk frissítése
    updateLocationInfo() {
        const nearestCity = this.findNearestCity();
        
        document.getElementById('currentLocation').textContent = nearestCity.name;
        document.getElementById('locationDetails').textContent = 
            `${nearestCity.type === 'capital' ? 'Főváros' : 'Város'}, ${nearestCity.population.toLocaleString()} lakos`;
        document.getElementById('coordinates').textContent = 
            `Koordináták: ${this.playerLat.toFixed(4)}°, ${this.playerLng.toFixed(4)}°`;
    }
    
    // Legközelebbi város keresése
    findNearestCity() {
        let nearest = this.cities[0];
        let minDistance = this.calculateDistance(this.playerLat, this.playerLng, nearest.lat, nearest.lng);
        
        this.cities.forEach(city => {
            const distance = this.calculateDistance(this.playerLat, this.playerLng, city.lat, city.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = city;
            }
        });
        
        return nearest;
    }
    
    // Távolság számítása (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Föld sugara km-ben
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Látogatott helyek hozzáadása
    addToVisited() {
        const key = `${this.playerLat.toFixed(2)},${this.playerLng.toFixed(2)}`;
        if (!this.visitedPlaces.has(key)) {
            this.visitedPlaces.add(key);
            document.getElementById('visitedCount').textContent = this.visitedPlaces.size;
        }
        
        // Távolság frissítése
        const distance = this.calculateDistance(
            this.lastPosition.lat, this.lastPosition.lng,
            this.playerLat, this.playerLng
        );
        this.totalDistance += distance;
        document.getElementById('distance').textContent = `${this.totalDistance.toFixed(1)} km`;
        
        this.lastPosition = { lat: this.playerLat, lng: this.playerLng };
    }
    
    // Játékos mozgatása - frissített ellenőrzéssel
    movePlayer(deltaLat, deltaLng) {
        const newLat = this.playerLat + deltaLat;
        const newLng = this.playerLng + deltaLng;
        
        // Pontos határellenőrzés
        if (this.isPointInHungary(newLat, newLng)) {
            this.playerLat = newLat;
            this.playerLng = newLng;
            this.updatePlayerPosition();
            this.addToVisited();
        }
    }
    
    // Vezérlés beállítása
    setupControls() {
        // Billentyűzet
        document.addEventListener('keydown', (e) => {
            const moveAmount = 0.05 / this.zoom; // Zoom szinthez igazított mozgás
            
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.movePlayer(moveAmount, 0);
                    break;
                case 's':
                case 'arrowdown':
                    this.movePlayer(-moveAmount, 0);
                    break;
                case 'a':
                case 'arrowleft':
                    this.movePlayer(0, -moveAmount);
                    break;
                case 'd':
                case 'arrowright':
                    this.movePlayer(0, moveAmount);
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case 'r':
                    this.resetView();
                    break;
            }
        });
        
        // Zoom gombok
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        
        // Egér görgő
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        // Egér kattintás
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const coords = this.screenToLatLng(x, y);
            
            // Teleportálás a kattintott helyre
            if (this.isPointInHungary(coords.lat, coords.lng)) {
                this.playerLat = coords.lat;
                this.playerLng = coords.lng;
                this.updatePlayerPosition();
                this.addToVisited();
            }
        });
    }
    
    // Zoom be
    zoomIn() {
        if (this.zoom < 3) {
            this.zoom *= 1.2;
            this.drawMap();
            this.updatePlayerPosition();
        }
    }
    
    // Zoom ki
    zoomOut() {
        if (this.zoom > 0.5) {
            this.zoom /= 1.2;
            this.drawMap();
            this.updatePlayerPosition();
        }
    }
    
    // Nézet visszaállítása
    resetView() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.playerLat = 47.4979;
        this.playerLng = 19.0402;
        this.drawMap();
        this.updatePlayerPosition();
    }
}

// Játék indítása
window.addEventListener('load', () => {
    new RealisticHungaryMap();
});
