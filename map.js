class RealisticHungaryMap {
    constructor() {
        this.map = null;
        this.playerMarker = null;
        this.playerLat = 47.4979; // Budapest szélességi foka
        this.playerLng = 19.0402; // Budapest hosszúsági foka
        this.hungaryBorderLayer = null;

        this.gridCellSize = 0.05; // Pl. 0.05 fok ~ 5.5 km szélességben az Egyenlítőnél

        this.visitedPoiCells = {};
        this.activePopup = null;
        this.lastVisitedCellId = null;

        this.visitedGridCellsLayer = L.layerGroup();
        this.drawnGridCells = {};
        this.poiGridCellsLayer = L.layerGroup(); // Rétegcsoport a POI cellákhoz

        // Játékos ikon definíciója
        this.playerIcon = L.icon({
            iconUrl: 'player_walk.gif', // Az animált GIF elérési útja
            iconSize: [32, 32],       // Az ikon mérete (szélesség, magasság)
            iconAnchor: [16, 32],     // Az ikon "horgonypontja" (az ikon alja középen)
            popupAnchor: [0, -32]     // A popup pozíciója az ikonhoz képest
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
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/P%C3%A9cs_-_Sz%C3%A9chenyi_t%C3%A9r_a_dzs%C3%Aámival.jpg/640px-P%C3%A9cs_-_Sz%C3%A9chenyi_t%C3%A9r_a_dzs%C3%A1mival.jpg",
                description: "Baranya vármegye székhelye, gazdag történelmi és kulturális örökséggel."
            }
        ];

        this.initializeMap();
        // A loadGeoJsonData most már Promise-t ad vissza, ezért meg kell várni
        this.loadGeoJsonData().then(() => {
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

    // Módosított loadGeoJsonData metódus
    async loadGeoJsonData() {
        try {
            const response = await fetch('gadm41_HUN_0.json'); // Feltételezzük, hogy a fájl neve hungary_border.geojson
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const hungaryBorderGeoJson = await response.json();

            this.hungaryBorderLayer = L.geoJson(hungaryBorderGeoJson, {
                style: {
                    color: '#8B4513', // Barna szín
                    weight: 2,
                    fillColor: '#90EE90', // Világoszöld kitöltés
                    fillOpacity: 0.5
                }
            }).addTo(this.map);
        } catch (error) {
            console.error("Hiba a GeoJSON adat betöltésekor:", error);
            // Fallback, ha a fájl nem tölthető be, használja az egyszerűsített határt
            const fallbackGeoJson = {
                "type": "Feature",
                "properties": { "name": "Magyarország Határa" },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [16.960, 48.585], [17.113, 48.580], [17.800, 48.570], [18.500, 48.560],
                            [19.200, 48.550], [19.900, 48.540], [20.600, 48.530], [21.300, 48.520],
                            [22.000, 48.510], [22.906, 48.490],
                            [22.900, 48.400], [22.850, 48.200], [22.800, 48.000], [22.750, 47.800],
                            [22.700, 47.600], [22.650, 47.400], [22.600, 47.200], [22.550, 47.000],
                            [22.500, 46.800], [22.450, 46.600], [22.400, 46.400], [22.200, 46.200],
                            [21.800, 46.100], [21.400, 46.050], [21.000, 46.000],
                            [20.600, 45.950], [20.200, 45.900], [19.800, 45.850], [19.400, 45.800],
                            [19.000, 45.750], [18.600, 45.737], [18.200, 45.740], [17.800, 45.750],
                            [17.400, 45.760], [17.000, 45.770], [16.600, 45.780],
                            [16.400, 45.900], [16.300, 46.100], [16.200, 46.300], [16.150, 46.500],
                            [16.120, 46.700], [16.113, 46.900], [16.120, 47.100], [16.150, 47.300],
                            [16.200, 47.500], [16.300, 47.700], [16.500, 47.800], [16.700, 47.850],
                            [16.800, 48.000], [16.850, 48.200], [16.900, 48.400], [16.960, 48.585]
                        ]
                    ]
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
        }
    }

    isPointInHungary(lat, lng) {
        if (!this.hungaryBorderLayer) return false;

        const point = L.latLng(lat, lng);
        // A GeoJSON réteg lehet FeatureCollection, amiben több Feature van.
        // Meg kell találni a tényleges poligon réteget.
        let polygonLayer = null;
        this.hungaryBorderLayer.eachLayer(function(layer) {
            if (layer instanceof L.Polygon) {
                polygonLayer = layer;
            }
        });

        if (!polygonLayer) {
            console.warn("Nem található poligon réteg a határ GeoJSON-ban.");
            return false; // Ha nincs poligon, nem tudjuk ellenőrizni
        }

        // A Leaflet beépített metódusa a pont-poligon ellenőrzésre
        return polygonLayer.getBounds().contains(point) && polygonLayer.getLatLngs()[0].some(ring => L.Polygon.prototype._containsPoint.call({_latlngs: [ring]}, point));
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
        this.drawnPoiCells = {};
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

        if (this.isPointInHungary(newLat, newLng)) {
            this.playerLat = newLat;
            this.playerLng = newLng;
            this.playerMarker.setLatLng([this.playerLat, this.playerLng]);
            this.map.panTo([this.playerLat, this.playerLng]);

            this.checkPointsOfInterest();
        } else {
            // Opcionális: visszajelzés, ha nem lehet kimenni a határon
            console.log("Nem léphetsz ki Magyarország területéről!");
        }
        this.playerMarker.setPopupContent("Játékos pozíciója").openPopup();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            const baseMoveAmount = 0.01; 
            const currentZoom = this.map.getZoom();
            const moveAmount = baseMoveAmount / Math.pow(2, currentZoom - 8);

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
    }
}

window.addEventListener('load', () => {
    new RealisticHungaryMap();
});
