class RealisticHungaryMap {
    constructor() {
        this.map = null;
        this.playerMarker = null;
        this.playerLat = 47.4979; // Budapest szélességi foka
        this.playerLng = 19.0402; // Budapest hosszúsági foka
        this.hungaryBorderLayer = null;
        this.isHungaryBorderLoaded = false;

        this.gridCellSize = 0.05;

        this.visitedPoiCells = {};
        this.activePopup = null;
        this.lastVisitedCellId = null;

        this.visitedGridCellsLayer = L.layerGroup();
        this.drawnGridCells = {};
        this.poiGridCellsLayer = L.layerGroup();
        this.drawnPoiCells = {};

        // Játékos ikon definíciója
        this.playerIcon = L.icon({
            iconUrl: 'player_walk.gif',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        this.pointsOfInterest = [
            {
                name: "Balaton",
                lat: 46.85,
                lng: 17.75,
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Balaton_from_Fony%C3%B3d.jpg/640px-Balaton_from_Fony%C3%B3d.jpg",
                description: "Magyarország legnagyobb tava, népszerű üdülőhely."
            },
            {
                name: "Miskolc",
                lat: 48.10,
                lng: 20.78,
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Miskolc_-_Avasi_kil%C3%A1t%C3%B3.jpg/640px-Miskolc_-_Avasi_kil%C3%A1t%C3%B3.jpg",
                description: "Borsod-Abaúj-Zemplén vármegye székhelye, ipari és kulturális központ."
            },
            {
                name: "Budapest",
                lat: 47.4979,
                lng: 19.0402,
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Budapest_Parliament_and_Chain_Bridge.jpg/640px-Budapest_Parliament_and_Chain_Bridge.jpg",
                description: "Magyarország fővárosa, a Duna két partján fekszik."
            },
            {
                name: "Debrecen",
                lat: 47.53,
                lng: 21.63,
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Debrecen_Nagy_templom.jpg/640px-Debrecen_Nagy_templom.jpg",
                description: "Magyarország második legnagyobb városa, a Hortobágy kapuja."
            },
            {
                name: "Pécs",
                lat: 46.07,
                lng: 18.23,
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/P%C3%A9cs_-_Sz%C3%A9chenyi_t%C3%A9r_a_dzs%C3%A1mival.jpg/640px-P%C3%A9cs_-_Sz%C3%A9chenyi_t%C3%A9r_a_dzs%C3%A1mival.jpg",
                description: "Baranya vármegye székhelye, gazdag történelmi és kulturális örökséggel."
            }
        ];

        this.initializeMap();
        this.loadGeoJsonData().then(() => {
            this.setupControls();
            this.drawInitialPoiCells();
            this.isHungaryBorderLoaded = true;
            console.log("Hungary border successfully loaded!");
        }).catch(error => {
            console.error("Failed to load Hungary border:", error);
            this.isHungaryBorderLoaded = false;
            this.setupControls();
            this.drawInitialPoiCells();
        });
    }

    initializeMap() {
        this.map = L.map('map').setView([this.playerLat, this.playerLng], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.playerMarker = L.marker([this.playerLat, this.playerLng], { icon: this.playerIcon }).addTo(this.map);
        this.playerMarker.bindPopup("Játékos pozíciója").openPopup();

        this.visitedGridCellsLayer.addTo(this.map);
        this.poiGridCellsLayer.addTo(this.map);
    }

    async loadGeoJsonData() {
        try {
            console.log("Attempting to load GeoJSON...");
            const response = await fetch('gadm41_HUN_0.json');
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const hungaryBorderGeoJson = await response.json();
            console.log("GeoJSON loaded successfully");

            this.hungaryBorderLayer = L.geoJson(hungaryBorderGeoJson, {
                style: {
                    color: '#8B4513',
                    weight: 2,
                    fillColor: '#90EE90',
                    fillOpacity: 0.5
                }
            }).addTo(this.map);
        } catch (error) {
            console.error("Hiba a GeoJSON adat betöltésekor:", error);
            console.log("Using fallback border...");
            
            // Egyszerűsített fallback határ
            const fallbackGeoJson = {
                "type": "Feature",
                "properties": { "name": "Magyarország Határa" },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [16.1, 45.7], [16.1, 48.6], [22.9, 48.6], [22.9, 45.7], [16.1, 45.7]
                    ]]
                }
            };
            
            this.hungaryBorderLayer = L.geoJson(fallbackGeoJson, {
                style: {
                    color: '#8B4513',
                    weight: 2,
                    fillColor: '#90EE90',
                    fillOpacity: 0.5
                }
            }).addTo(this.map);
            
            console.log("Fallback border created");
        }
    }

    // ÁTMENETILEG EGYSZERŰSÍTETT VERZIÓ - CSAK TESZTELÉSHEZ
    isPointInHungary(lat, lng) {
        console.log(`=== HATÁR ELLENŐRZÉS ===`);
        console.log(`Ellenőrzött pont: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        console.log(`Border loaded: ${this.isHungaryBorderLoaded}`);
        console.log(`Border layer exists: ${!!this.hungaryBorderLayer}`);
        
        // ÁTMENETILEG MINDIG ENGEDÉLYEZD A MOZGÁST
        // Csak a budapesti régióban tiltsd le
        if (lat < 45.0 || lat > 49.0 || lng < 15.0 || lng > 24.0) {
            console.log("Túl messze Magyarországtól - tiltva");
            return false;
        }
        
        console.log("Mozgás engedélyezve");
        return true;
    }

    getPlayerGridCell(lat, lng) {
        const cellLat = Math.floor(lat / this.gridCellSize) * this.gridCellSize;
        const cellLng = Math.floor(lng / this.gridCellSize) * this.gridCellSize;
        return { id: `${cellLat.toFixed(4)}_${cellLng.toFixed(4)}`, lat: cellLat, lng: cellLng };
    }

    drawGridCell(cellId, lat, lng, isPoiCell = false) {
        const targetLayer = isPoiCell ? this.poiGridCellsLayer : this.visitedGridCellsLayer;
        const drawnCellsMap = isPoiCell ? this.drawnPoiCells : this.drawnGridCells;

        if (drawnCellsMap && drawnCellsMap[cellId]) {
            return;
        }

        const southWest = L.latLng(lat, lng);
        const northEast = L.latLng(lat + this.gridCellSize, lng + this.gridCellSize);
        const bounds = L.latLngBounds(southWest, northEast);

        const style = isPoiCell ? {
            color: "#0000ff",
            weight: 2,
            fillColor: "#add8e6",
            fillOpacity: 0.3
        } : {
            color: "#ff7800",
            weight: 1,
            fillColor: "#ffff00",
            fillOpacity: 0.2
        };

        const rectangle = L.rectangle(bounds, style).addTo(targetLayer);
        
        if (drawnCellsMap) {
            drawnCellsMap[cellId] = true;
        }
    }

    drawInitialPoiCells() {
        for (const poi of this.pointsOfInterest) {
            const poiCell = this.getPlayerGridCell(poi.lat, poi.lng);
            this.drawGridCell(poiCell.id, poiCell.lat, poiCell.lng, true);
        }
    }

    checkPointsOfInterest() {
        const currentPlayerCell = this.getPlayerGridCell(this.playerLat, this.playerLng);

        this.drawGridCell(currentPlayerCell.id, currentPlayerCell.lat, currentPlayerCell.lng, false);

        if (currentPlayerCell.id === this.lastVisitedCellId) {
            return;
        }
        this.lastVisitedCellId = currentPlayerCell.id;

        if (this.activePopup) {
            this.map.closePopup(this.activePopup);
            this.activePopup = null;
        }

        if (!this.visitedPoiCells[currentPlayerCell.id]) {
            this.visitedPoiCells[currentPlayerCell.id] = {};
        }

        let foundPoi = null;

        for (const poi of this.pointsOfInterest) {
            const poiCell = this.getPlayerGridCell(poi.lat, poi.lng);

            if (poiCell.id === currentPlayerCell.id) {
                if (!this.visitedPoiCells[currentPlayerCell.id][poi.name]) {
                    foundPoi = poi;
                    break;
                }
            }
        }

        if (foundPoi) {
            const popupContent = `
                <div>
                    <h3>${foundPoi.name}</h3>
                    <img src="${foundPoi.imageUrl}" alt="${foundPoi.name}" style="max-width: 200px; height: auto;">
                    <p>${foundPoi.description}</p>
                </div>
            `;
            this.activePopup = L.popup()
                .setLatLng([foundPoi.lat, foundPoi.lng])
                .setContent(popupContent)
                .openOn(this.map);
            
            this.visitedPoiCells[currentPlayerCell.id][foundPoi.name] = true;
        }
    }

    movePlayer(deltaLat, deltaLng) {
        const newLat = this.playerLat + deltaLat;
        const newLng = this.playerLng + deltaLng;

        console.log(`\n=== MOZGÁS KÍSÉRLET ===`);
        console.log(`Jelenlegi pozíció: ${this.playerLat.toFixed(4)}, ${this.playerLng.toFixed(4)}`);
        console.log(`Új pozíció: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
        console.log(`Delta: ${deltaLat.toFixed(6)}, ${deltaLng.toFixed(6)}`);
        
        const isInHungary = this.isPointInHungary(newLat, newLng);
        console.log(`Eredmény: ${isInHungary}`);

        if (isInHungary) {
            this.playerLat = newLat;
            this.playerLng = newLng;
            this.playerMarker.setLatLng([this.playerLat, this.playerLng]);
            this.map.panTo([this.playerLat, this.playerLng]);
            this.checkPointsOfInterest();
            console.log("✅ Sikeres mozgás!");
        } else {
            console.log("❌ Nem léphetsz ki Magyarország területéről!");
        }
        
        this.playerMarker.setPopupContent("Játékos pozíciója").openPopup();
    }

    setupControls() {
        console.log("Setting up controls...");
        document.addEventListener('keydown', (e) => {
            const baseMoveAmount = 0.01; 
            const currentZoom = this.map.getZoom();
            const moveAmount = baseMoveAmount / Math.pow(2, currentZoom - 8);

            console.log(`Key pressed: ${e.key}, Move amount: ${moveAmount.toFixed(6)}`);

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
            }
        });
        console.log("Controls set up successfully!");
    }
}

window.addEventListener('load', () => {
    console.log("Loading RealisticHungaryMap...");
    new RealisticHungaryMap();
});
