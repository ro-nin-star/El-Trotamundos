class Lotus3DRacing {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.road = [];
        this.opponents = [];
        this.minimap = null;
        this.minimapVisible = true;
        
        // OSM adatok tárolása
        this.osmData = {
            buildings: [],
            roads: [],
            landmarks: [],
            trees: [],
            streetLights: []
        };
        
        // Pálya adatok
        this.trackData = {
            segments: [],
            totalLength: 2000,
            width: 20,
            buildings: [],
            landmarks: [],
            trees: [],
            streetLights: []
        };
        
        // 3D objektum cache
        this.objectCache = new Map();
        
        // Játék állapot
        this.gameState = {
            speed: 0,
            maxSpeed: 250,
            acceleration: 1.5,
            deceleration: 2,
            turnSpeed: 0,
            maxTurnSpeed: 0.03,
            position: new THREE.Vector3(0, 0.5, 0),
            rotation: 0,
            lap: 1,
            totalLaps: 3,
            startTime: Date.now(),
            playerPosition: 1,
            gear: 1,
            cameraMode: 0,
            distanceTraveled: 0,
            currentSegment: 0,
            currentCity: 'Budapest'
        };
        
        // Irányítás
        this.keys = {};
        this.setupControls();
        
        // Inicializálás
        this.init();
    }
    
    async init() {
        this.createScene();
        this.createLighting();
        this.createGT86Car();
        
        // OSM adatok betöltése és 3D város generálása
        await this.loadAndGenerate3DCity();
        
        this.createOpponents();
        this.createEnvironment();
        this.setupCamera();
        this.initMinimap();
        
        // Betöltés befejezése
        document.getElementById('loading').classList.add('hidden');
        
        this.animate();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Kamera váltás
            if (e.code === 'KeyC') {
                this.gameState.cameraMode = (this.gameState.cameraMode + 1) % 3;
            }
            
            // Térkép ki/bekapcsolás
            if (e.code === 'KeyM') {
                this.minimapVisible = !this.minimapVisible;
                const minimap = document.querySelector('.minimap');
                if (minimap) {
                    if (this.minimapVisible) {
                        minimap.classList.remove('hidden');
                    } else {
                        minimap.classList.add('hidden');
                    }
                }
            }
            
            // Újraindítás
            if (e.code === 'KeyR') {
                this.restart();
            }
            
            // Város váltás
            if (e.code === 'KeyT') {
                this.switchCity();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    async loadAndGenerate3DCity() {
        console.log('3D város generálása OSM adatokból...');
        
        // Válassz várost
        const cityData = await this.getCityData(this.gameState.currentCity);
        
        // Épületek generálása OSM adatokból
        await this.generateBuildingsFromOSM(cityData);
        
        // Utak generálása
        await this.generateRoadsFromOSM(cityData);
        
        // Nevezetességek hozzáadása
        await this.addLandmarks(cityData);
        
        // Városi infrastruktúra
        this.generateUrbanInfrastructure();
        
        console.log('3D város generálás befejezve');
    }
    
    async getCityData(cityName) {
        // Valódi városadatok szimulálása OSM stílusban
        const cities = {
            'Budapest': {
                center: { lat: 47.4979, lng: 19.0402 },
                bounds: {
                    north: 47.5200, south: 47.4700,
                    east: 19.1000, west: 19.0000
                },
                buildings: [
                    // Parlament környéke
                    {
                        name: 'Magyar Parlament',
                        coords: [
                            [47.5069, 19.0456], [47.5069, 19.0466], 
                            [47.5059, 19.0466], [47.5059, 19.0456]
                        ],
                        height: 96,
                        type: 'government',
                        style: 'neo-gothic'
                    },
                    // Szent István Bazilika
                    {
                        name: 'Szent István Bazilika',
                        coords: [
                            [47.5008, 19.0540], [47.5008, 19.0550], 
                            [47.4998, 19.0550], [47.4998, 19.0540]
                        ],
                        height: 96,
                        type: 'church',
                        style: 'neoclassical'
                    },
                    // Széchenyi Lánchíd
                    {
                        name: 'Széchenyi Lánchíd',
                        coords: [
                            [47.4986, 19.0436], [47.4986, 19.0446], 
                            [47.4976, 19.0446], [47.4976, 19.0436]
                        ],
                        height: 48,
                        type: 'bridge',
                        style: 'suspension'
                    },
                    // Buda Vár
                    {
                        name: 'Budavári Palota',
                        coords: [
                            [47.4965, 19.0394], [47.4965, 19.0404], 
                            [47.4955, 19.0404], [47.4955, 19.0394]
                        ],
                        height: 60,
                        type: 'palace',
                        style: 'baroque'
                    },
                    // Operaház
                    {
                        name: 'Magyar Állami Operaház',
                        coords: [
                            [47.5030, 19.0586], [47.5030, 19.0596], 
                            [47.5020, 19.0596], [47.5020, 19.0586]
                        ],
                        height: 35,
                        type: 'theater',
                        style: 'neo-renaissance'
                    }
                ],
                roads: [
                    // Andrássy út
                    {
                        name: 'Andrássy út',
                        points: [
                            [47.5020, 19.0520], [47.5030, 19.0586], 
                            [47.5040, 19.0650], [47.5050, 19.0720]
                        ],
                        width: 30,
                        type: 'avenue'
                    },
                    // Váci utca
                    {
                        name: 'Váci utca',
                        points: [
                            [47.4979, 19.0520], [47.4989, 19.0520], 
                            [47.4999, 19.0520], [47.5009, 19.0520]
                        ],
                        width: 15,
                        type: 'pedestrian'
                    },
                    // Körút
                    {
                        name: 'Nagykörút',
                        points: [
                            [47.4950, 19.0600], [47.5000, 19.0650], 
                            [47.5050, 19.0600], [47.5000, 19.0550]
                        ],
                        width: 25,
                        type: 'boulevard'
                    }
                ]
            }
        };
        
        return cities[cityName] || cities['Budapest'];
    }
    
    async generateBuildingsFromOSM(cityData) {
        console.log('Épületek generálása OSM adatokból...');
        
        cityData.buildings.forEach(building => {
            const buildingMesh = this.createBuildingFromOSMData(building);
            if (buildingMesh) {
                this.scene.add(buildingMesh);
                this.trackData.buildings.push({
                    name: building.name,
                    position: buildingMesh.position.clone(),
                    type: building.type,
                    mesh: buildingMesh
                });
            }
        });
        
        // Kiegészítő épületek generálása
        this.generateAdditionalBuildings(cityData);
    }
    
    createBuildingFromOSMData(osmBuilding) {
        const buildingGroup = new THREE.Group();
        
        // Koordináták konvertálása 3D pozíciókká
        const centerLat = osmBuilding.coords.reduce((sum, coord) => sum + coord[0], 0) / osmBuilding.coords.length;
        const centerLng = osmBuilding.coords.reduce((sum, coord) => sum + coord[1], 0) / osmBuilding.coords.length;
        
        // GPS -> méter konverzió
        const x = (centerLng - 19.0402) * 111320 * Math.cos(centerLat * Math.PI / 180) * 0.01;
        const z = -(centerLat - 47.4979) * 110540 * 0.01;
        
        // Épület méretei
        const width = this.calculateBuildingWidth(osmBuilding.coords);
        const depth = this.calculateBuildingDepth(osmBuilding.coords);
        const height = osmBuilding.height || 20;
        
        // Épület stílus alapján geometria
        let geometry, material;
        
        switch (osmBuilding.type) {
            case 'government':
                geometry = new THREE.BoxGeometry(width, height, depth);
                material = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
                
                // Parlament specifikus részletek
                if (osmBuilding.name.includes('Parlament')) {
                    this.addParliamentDetails(buildingGroup, width, height, depth);
                }
                break;
                
            case 'church':
                geometry = new THREE.BoxGeometry(width, height, depth);
                material = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
                
                // Bazilika kupola
                if (osmBuilding.name.includes('Bazilika')) {
                    this.addBasilicaDome(buildingGroup, width, height, depth);
                }
                break;
                
            case 'bridge':
                return this.createBridge(osmBuilding, x, z);
                
            case 'palace':
                geometry = new THREE.BoxGeometry(width, height, depth);
                material = new THREE.MeshLambertMaterial({ color: 0xCD853F });
                this.addPalaceDetails(buildingGroup, width, height, depth);
                break;
                
            case 'theater':
                geometry = new THREE.BoxGeometry(width, height, depth);
                material = new THREE.MeshLambertMaterial({ color: 0xDDA0DD });
                this.addTheaterDetails(buildingGroup, width, height, depth);
                break;
                
            default:
                geometry = new THREE.BoxGeometry(width, height, depth);
                material = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        }
        
        const building = new THREE.Mesh(geometry, material);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);
        
        // Ablakok hozzáadása
        this.addDetailedWindows(buildingGroup, width, height, depth, osmBuilding.type);
        
        // Pozicionálás
        buildingGroup.position.set(x, 0, z);
        buildingGroup.userData = { name: osmBuilding.name, type: osmBuilding.type };
        
        return buildingGroup;
    }
    
    addParliamentDetails(group, width, height, depth) {
        // Parlament kupola
        const domeGeometry = new THREE.SphereGeometry(width * 0.3, 16, 16);
        const domeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = height + width * 0.2;
        dome.castShadow = true;
        group.add(dome);
        
        // Tornyok
        for (let i = 0; i < 4; i++) {
            const towerGeometry = new THREE.CylinderGeometry(2, 3, height * 0.3, 8);
            const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            tower.position.x = Math.cos(angle) * width * 0.4;
            tower.position.z = Math.sin(angle) * depth * 0.4;
            tower.position.y = height * 0.8;
            tower.castShadow = true;
            group.add(tower);
        }
        
        // Zászlórúd
        const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 15, 8);
        const flagPoleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.y = height + 10;
        group.add(flagPole);
        
        // Magyar zászló
        const flagGeometry = new THREE.PlaneGeometry(4, 2.5);
        const flagMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(2, height + 12, 0);
        group.add(flag);
    }
    
    addBasilicaDome(group, width, height, depth) {
        // Főkupola
        const mainDomeGeometry = new THREE.SphereGeometry(width * 0.4, 16, 16);
        const domeMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
        const mainDome = new THREE.Mesh(mainDomeGeometry, domeMaterial);
        mainDome.position.y = height + width * 0.3;
        mainDome.castShadow = true;
        group.add(mainDome);
        
        // Kereszt a tetején
        const crossGeometry = new THREE.BoxGeometry(0.3, 8, 0.3);
        const crossMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const cross = new THREE.Mesh(crossGeometry, crossMaterial);
        cross.position.y = height + width * 0.3 + 6;
        group.add(cross);
        
        // Harang torony
        const bellTowerGeometry = new THREE.CylinderGeometry(3, 4, height * 0.5, 8);
        const bellTowerMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
        const bellTower = new THREE.Mesh(bellTowerGeometry, bellTowerMaterial);
        bellTower.position.set(width * 0.6, height * 0.7, 0);
        bellTower.castShadow = true;
        group.add(bellTower);
    }
    
    addPalaceDetails(group, width, height, depth) {
        // Palota oszlopok
        for (let i = 0; i < 6; i++) {
            const columnGeometry = new THREE.CylinderGeometry(0.5, 0.7, height * 0.8, 8);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.x = -width/2 + (i + 1) * (width / 7);
            column.position.z = depth/2 + 0.5;
            column.position.y = height * 0.4;
            column.castShadow = true;
            group.add(column);
        }
    }
    
    addTheaterDetails(group, width, height, depth) {
        // Színház homlokzat
        const facadeGeometry = new THREE.BoxGeometry(width * 1.1, height * 0.3, 2);
        const facadeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const facade = new THREE.Mesh(facadeGeometry, facadeMaterial);
        facade.position.y = height * 0.85;
        facade.position.z = depth/2 + 1;
        facade.castShadow = true;
        group.add(facade);
    }
    
    createBridge(osmBuilding, x, z) {
        const bridgeGroup = new THREE.Group();
        
        // Híd fő szerkezete
        const bridgeGeometry = new THREE.BoxGeometry(80, 3, 15);
        const bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.y = 8;
        bridge.castShadow = true;
        bridgeGroup.add(bridge);
        
        // Lánchíd specifikus láncok
        if (osmBuilding.name.includes('Lánchíd')) {
            // Tornyok
            for (let i = 0; i < 2; i++) {
                const towerGeometry = new THREE.BoxGeometry(8, 30, 8);
                const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
                const tower = new THREE.Mesh(towerGeometry, towerMaterial);
                tower.position.x = i === 0 ? -30 : 30;
                tower.position.y = 15;
                tower.castShadow = true;
                bridgeGroup.add(tower);
                
                // Láncok
                for (let j = 0; j < 10; j++) {
                    const chainGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20, 8);
                    const chainMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                    const chain = new THREE.Mesh(chainGeometry, chainMaterial);
                    chain.position.set(
                        (i === 0 ? -30 : 30) + (j - 5) * 3,
                        20 - Math.abs(j - 5) * 0.5,
                        0
                    );
                    chain.rotation.z = (j - 5) * 0.1;
                    bridgeGroup.add(chain);
                }
            }
        }
        
        bridgeGroup.position.set(x, 0, z);
        return bridgeGroup;
    }
    
    addDetailedWindows(group, width, height, depth, buildingType) {
        const windowsPerRow = Math.floor(width / 3);
        const floors = Math.floor(height / 4);
        
        // Előlap ablakok
        for (let floor = 0; floor < floors; floor++) {
            for (let window = 0; window < windowsPerRow; window++) {
                const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
                const isLit = Math.random() > 0.7;
                
                let windowColor = 0x333366;
                if (buildingType === 'government') windowColor = isLit ? 0xFFFF88 : 0x444444;
                else if (buildingType === 'church') windowColor = isLit ? 0x9966FF : 0x333366;
                else if (buildingType === 'theater') windowColor = isLit ? 0xFF6666 : 0x333366;
                
                const windowMaterial = new THREE.MeshLambertMaterial({ 
                    color: isLit ? 0xFFFF88 : windowColor,
                    transparent: true,
                    opacity: 0.8
                });
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                
                windowMesh.position.set(
                    -width/2 + (window + 0.5) * (width / windowsPerRow),
                    floor * 4 + 2,
                    depth/2 + 0.01
                );
                
                group.add(windowMesh);
                
                // Világítás
                if (isLit) {
                    const windowLight = new THREE.PointLight(0xFFFF88, 0.3, 8);
                    windowLight.position.copy(windowMesh.position);
                    windowLight.position.z += 1;
                    group.add(windowLight);
                }
            }
        }
    }
    
    calculateBuildingWidth(coords) {
        const minLng = Math.min(...coords.map(c => c[1]));
        const maxLng = Math.max(...coords.map(c => c[1]));
        return Math.abs(maxLng - minLng) * 111320 * 0.01 || 10;
    }
    
    calculateBuildingDepth(coords) {
        const minLat = Math.min(...coords.map(c => c[0]));
        const maxLat = Math.max(...coords.map(c => c[0]));
        return Math.abs(maxLat - minLat) * 110540 * 0.01 || 10;
    }
    
    generateAdditionalBuildings(cityData) {
        // Kiegészítő épületek generálása a város körül
        const buildingTypes = [
            { name: 'Lakóház', height: 8, width: 6, depth: 8, color: 0xCCCCCC },
            { name: 'Irodaház', height: 15, width: 8, depth: 10, color: 0x888888 },
            { name: 'Bevásárlóközpont', height: 5, width: 20, depth: 15, color: 0xAAAAA },
            { name: 'Hotel', height: 20, width: 12, depth: 8, color: 0x996633 }
        ];
        
        for (let i = 0; i < 50; i++) {
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            const buildingGroup = new THREE.Group();
            
            // Fő épület
            const geometry = new THREE.BoxGeometry(
                buildingType.width,
                buildingType.height,
                buildingType.depth
            );
            const material = new THREE.MeshLambertMaterial({ color: buildingType.color });
            const building = new THREE.Mesh(geometry, material);
            building.position.y = buildingType.height / 2;
            building.castShadow = true;
            buildingGroup.add(building);
            
            // Ablakok
            this.addDetailedWindows(buildingGroup, buildingType.width, buildingType.height, buildingType.depth, 'residential');
            
            // Véletlenszerű pozíció
            buildingGroup.position.set(
                (Math.random() - 0.5) * 400,
                0,
                (Math.random() - 0.5) * 400
            );
            
            this.scene.add(buildingGroup);
            
            this.trackData.buildings.push({
                name: buildingType.name,
                position: buildingGroup.position.clone(),
                type: buildingType.name.toLowerCase()
            });
        }
    }
    
    async generateRoadsFromOSM(cityData) {
        console.log('Utak generálása OSM adatokból...');
        
        cityData.roads.forEach(road => {
            this.createRoadFromOSMData(road);
        });
        
        // Fő játék pálya generálása
        this.generateMainGameTrack();
    }
    
    createRoadFromOSMData(osmRoad) {
        const roadWidth = osmRoad.width || 20;
        
        for (let i = 0; i < osmRoad.points.length - 1; i++) {
            const start = osmRoad.points[i];
            const end = osmRoad.points[i + 1];
            
            // GPS koordináták konvertálása
            const startX = (start[1] - 19.0402) * 111320 * Math.cos(start[0] * Math.PI / 180) * 0.01;
            const startZ = -(start[0] - 47.4979) * 110540 * 0.01;
            const endX = (end[1] - 19.0402) * 111320 * Math.cos(end[0] * Math.PI / 180) * 0.01;
            const endZ = -(end[0] - 47.4979) * 110540 * 0.01;
            
            // Út szegmens
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, distance);
            
            let roadMaterial;
            switch (osmRoad.type) {
                case 'avenue':
                    roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                    break;
                case 'pedestrian':
                    roadMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
                    break;
                case 'boulevard':
                    roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
                    break;
                default:
                    roadMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            }
            
            const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
            roadSegment.rotation.x = -Math.PI / 2;
            roadSegment.position.set(
                (startX + endX) / 2,
                0,
                (startZ + endZ) / 2
            );
            
            // Forgatás az irány szerint
            const angle = Math.atan2(endX - startX, endZ - startZ);
            roadSegment.rotation.y = angle;
            
            roadSegment.receiveShadow = true;
            this.scene.add(roadSegment);
            this.road.push(roadSegment);
            
            // Út jelzések
            this.addRoadMarkings(roadSegment, roadWidth, distance, osmRoad.type);
        }
    }
    
    addRoadMarkings(roadSegment, width, length, roadType) {
        // Középvonal
        if (roadType !== 'pedestrian') {
            const lineGeometry = new THREE.PlaneGeometry(0.3, length * 0.8);
            const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.copy(roadSegment.position);
            line.position.y += 0.01;
            line.rotation.y = roadSegment.rotation.y;
            this.scene.add(line);
        }
        
        // Szélvonalak
        if (roadType === 'avenue' || roadType === 'boulevard') {
            [-width/2, width/2].forEach(offset => {
                const borderGeometry = new THREE.PlaneGeometry(0.2, length);
                const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const border = new THREE.Mesh(borderGeometry, borderMaterial);
                border.rotation.x = -Math.PI / 2;
                border.position.copy(roadSegment.position);
                border.position.y += 0.01;
                border.rotation.y = roadSegment.rotation.y;
                
                // Offset alkalmazása
                const offsetVector = new THREE.Vector3(offset, 0, 0);
                offsetVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), roadSegment.rotation.y);
                border.position.add(offsetVector);
                
                this.scene.add(border);
            });
        }
    }
    
    generateMainGameTrack() {
        // Fő játék pálya pontok (Budapest körül)
        const trackPoints = [
            { x: 0, z: 0, type: 'straight' },
            { x: 0, z: -50, type: 'straight' },
            { x: 20, z: -80, type: 'right_turn' },
            { x: 50, z: -100, type: 'right_turn' },
            { x: 100, z: -100, type: 'straight' },
            { x: 150, z: -80, type: 'left_turn' },
            { x: 170, z: -50, type: 'left_turn' },
            { x: 170, z: 0, type: 'straight' },
            { x: 170, z: 50, type: 'straight' },
            { x: 150, z: 80, type: 'left_turn' },
            { x: 100, z: 100, type: 'left_turn' },
            { x: 50, z: 100, type: 'straight' },
            { x: 20, z: 80, type: 'left_turn' },
            { x: 0, z: 50, type: 'left_turn' },
            { x: 0, z: 0, type: 'straight' }
        ];
        
        this.createTrackSegments(trackPoints);
    }
    
    createTrackSegments(trackPoints) {
        const roadWidth = 20;
        const segmentLength = 8;
        
        for (let i = 0; i < trackPoints.length - 1; i++) {
            const start = trackPoints[i];
            const end = trackPoints[i + 1];
            
            const steps = Math.ceil(this.distance(start, end) / segmentLength);
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + (end.x - start.x) * t;
                const z = start.z + (end.z - start.z) * t;
                
                this.trackData.segments.push({
                    x: x,
                    z: z,
                    type: start.type,
                    angle: Math.atan2(end.x - start.x, end.z - start.z)
                });
                
                // Verseny pálya szegmens
                const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
                const roadMaterial = new THREE.MeshLambertMaterial({ 
                    color: this.trackData.segments.length % 2 === 0 ? 0x444444 : 0x555555 
                });
                const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
                roadSegment.rotation.x = -Math.PI / 2;
                roadSegment.position.set(x, 0.05, z); // Kicsit magasabban a városi utaknál
                roadSegment.receiveShadow = true;
                this.scene.add(roadSegment);
                
                // Verseny pálya jelzések
                this.createRaceTrackMarkings(x, z, roadWidth, segmentLength);
            }
        }
    }
    
    createRaceTrackMarkings(x, z, roadWidth, segmentLength) {
        // Piros-fehér szélvonalak (F1 stílus)
        [-roadWidth/2, roadWidth/2].forEach((offset, index) => {
            const borderGeometry = new THREE.PlaneGeometry(1, segmentLength);
            const borderMaterial = new THREE.MeshLambertMaterial({ 
                color: index === 0 ? 0xff0000 : 0xffffff 
            });
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.rotation.x = -Math.PI / 2;
            border.position.set(x + offset, 0.06, z);
            this.scene.add(border);
        });
        
        // Start/cél vonal
        if (Math.abs(x) < 5 && Math.abs(z) < 5) {
            for (let i = 0; i < 10; i++) {
                const checkeredGeometry = new THREE.PlaneGeometry(2, 1);
                const checkeredMaterial = new THREE.MeshLambertMaterial({ 
                    color: i % 2 === 0 ? 0x000000 : 0xffffff 
                });
                const checkered = new THREE.Mesh(checkeredGeometry, checkeredMaterial);
                checkered.rotation.x = -Math.PI / 2;
                checkered.position.set(x - 10 + i * 2, 0.07, z);
                this.scene.add(checkered);
            }
        }
    }
    
    async addLandmarks(cityData) {
        // Híres budapesti helyszínek hozzáadása
        const landmarks = [
            {
                name: 'Hősök tere',
                position: { x: 50, z: -150 },
                type: 'monument'
            },
            {
                name: 'Gellért-hegy',
                position: { x: -80, z: 20 },
                type: 'hill'
            },
            {
                name: 'Margit-sziget',
                position: { x: 30, z: 80 },
                type: 'park'
            }
        ];
        
        landmarks.forEach(landmark => {
            const landmarkMesh = this.createLandmark(landmark);
            if (landmarkMesh) {
                this.scene.add(landmarkMesh);
                this.trackData.landmarks.push(landmark);
            }
        });
    }
    
    createLandmark(landmark) {
        const landmarkGroup = new THREE.Group();
        
        switch (landmark.type) {
            case 'monument':
                // Millennium emlékmű
                const monumentGeometry = new THREE.CylinderGeometry(2, 3, 30, 8);
                const monumentMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
                const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
                monument.position.y = 15;
                monument.castShadow = true;
                landmarkGroup.add(monument);
                
                // Szobrok körül
                for (let i = 0; i < 7; i++) {
                    const statueGeometry = new THREE.BoxGeometry(1, 8, 1);
                    const statueMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
                    const statue = new THREE.Mesh(statueGeometry, statueMaterial);
                    
                    const angle = (i / 7) * Math.PI * 2;
                    statue.position.x = Math.cos(angle) * 8;
                    statue.position.z = Math.sin(angle) * 8;
                    statue.position.y = 4;
                    statue.castShadow = true;
                    landmarkGroup.add(statue);
                }
                break;
                
            case 'hill':
                // Gellért-hegy
                const hillGeometry = new THREE.ConeGeometry(20, 40, 8);
                const hillMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const hill = new THREE.Mesh(hillGeometry, hillMaterial);
                hill.position.y = 20;
                hill.castShadow = true;
                landmarkGroup.add(hill);
                
                // Citadella
                const citadellaGeometry = new THREE.BoxGeometry(8, 6, 8);
                const citadellaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
                const citadella = new THREE.Mesh(citadellaGeometry, citadellaMaterial);
                citadella.position.y = 43;
                citadella.castShadow = true;
                landmarkGroup.add(citadella);
                break;
                
            case 'park':
                // Margit-sziget parkja
                for (let i = 0; i < 15; i++) {
                    const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
                    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
                    
                    tree.position.set(
                        (Math.random() - 0.5) * 30,
                        4,
                        (Math.random() - 0.5) * 30
                    );
                    tree.castShadow = true;
                    landmarkGroup.add(tree);
                }
                break;
        }
        
        landmarkGroup.position.set(landmark.position.x, 0, landmark.position.z);
        landmarkGroup.userData = { name: landmark.name, type: landmark.type };
        
        return landmarkGroup;
    }
    
    generateUrbanInfrastructure() {
        // Utcai lámpák a valódi utakon
        this.trackData.segments.forEach((segment, index) => {
            if (index % 10 === 0) {
                [-15, 15].forEach(offset => {
                    const lightGroup = new THREE.Group();
                    
                    // Modern LED utcai lámpa
                    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 8, 8);
                    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                    pole.position.y = 4;
                    pole.castShadow = true;
                    lightGroup.add(pole);
                    
                    // LED lámpatest
                    const lampGeometry = new THREE.BoxGeometry(1, 0.3, 0.5);
                    const lampMaterial = new THREE.MeshLambertMaterial({ 
                        color: 0xFFFFAA,
                        emissive: 0x444422
                    });
                    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
                    lamp.position.y = 8;
                    lightGroup.add(lamp);
                    
                    // Fényforrás
                    const streetLight = new THREE.PointLight(0xFFFFAA, 1, 25);
                    streetLight.position.y = 8;
                    streetLight.castShadow = true;
                    lightGroup.add(streetLight);
                    
                    lightGroup.position.set(
                        segment.x + offset,
                        0,
                        segment.z
                    );
                    
                    this.scene.add(lightGroup);
                    this.trackData.streetLights.push(lightGroup.position.clone());
                });
            }
        });
        
        console.log('Városi infrastruktúra létrehozva');
    }
    
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(300, 400, 300);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 1500;
        sunLight.shadow.camera.left = -300;
        sunLight.shadow.camera.right = 300;
        sunLight.shadow.camera.top = 300;
        sunLight.shadow.camera.bottom = -300;
        this.scene.add(sunLight);
        
        const headlight1 = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6);
        const headlight2 = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6);
        this.headlights = [headlight1, headlight2];
        this.scene.add(headlight1);
        this.scene.add(headlight2);
    }
    
    createGT86Car() {
        const carGroup = new THREE.Group();
        
        // Fő karosszéria (GT-86 stílusú alacsony sportkocsi)
        const mainBodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 4.2);
        const mainBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
        mainBody.position.y = 0.4;
        mainBody.castShadow = true;
        carGroup.add(mainBody);
        
        // Alsó karosszéria
        const lowerBodyGeometry = new THREE.BoxGeometry(1.9, 0.3, 4.3);
        const lowerBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const lowerBody = new THREE.Mesh(lowerBodyGeometry, lowerBodyMaterial);
        lowerBody.position.y = 0.15;
        lowerBody.castShadow = true;
        carGroup.add(lowerBody);
        
        // Tető/Kabinfedél (GT-86 jellegzetes alacsony tető)
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.35, 2.2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 0.85, -0.3);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Motorháztető
        const hoodGeometry = new THREE.BoxGeometry(1.7, 0.1, 1.5);
        const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.set(0, 0.75, 1.2);
        hood.castShadow = true;
        carGroup.add(hood);
        
        // Csomagtartó
        const trunkGeometry = new THREE.BoxGeometry(1.6, 0.1, 1.2);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 0.75, -1.8);
        trunk.castShadow = true;
        carGroup.add(trunk);
        
        // Első lökhárító (narancssárga akcentek)
        const frontBumperGeometry = new THREE.BoxGeometry(1.9, 0.25, 0.4);
        const frontBumperMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const frontBumper = new THREE.Mesh(frontBumperGeometry, frontBumperMaterial);
        frontBumper.position.set(0, 0.2, 2.3);
        frontBumper.castShadow = true;
        carGroup.add(frontBumper);
        
        // Első lökhárító narancssárga csík
        const frontAccentGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.35);
        const frontAccentMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const frontAccent = new THREE.Mesh(frontAccentGeometry, frontAccentMaterial);
        frontAccent.position.set(0, 0.15, 2.32);
        carGroup.add(frontAccent);
        
        // Hátsó lökhárító (narancssárga)
        const rearBumperGeometry = new THREE.BoxGeometry(1.9, 0.25, 0.4);
        const rearBumperMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const rearBumper = new THREE.Mesh(rearBumperGeometry, rearBumperMaterial);
        rearBumper.position.set(0, 0.2, -2.3);
        rearBumper.castShadow = true;
        carGroup.add(rearBumper);
        
        // Visszapillantó tükrök (narancssárga)
        const mirrorGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.12);
        const mirrorMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        
        const leftMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        leftMirror.position.set(-1.0, 0.9, 0.8);
        carGroup.add(leftMirror);
        
        const rightMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        rightMirror.position.set(1.0, 0.9, 0.8);
        carGroup.add(rightMirror);
        
        // Kerekek (GT-86 stílusú)
        const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        
        // Sportfelnik
        const rimGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 8);
        const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        const wheelPositions = [
            [-0.9, 0, 1.4],   // bal első
            [0.9, 0, 1.4],    // jobb első
            [-0.9, 0, -1.4],  // bal hátsó
            [0.9, 0, -1.4]    // jobb hátsó
        ];
        
        this.wheels = [];
        wheelPositions.forEach(pos => {
            const wheelGroup = new THREE.Group();
            
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            
            wheel.rotation.z = Math.PI / 2;
            rim.rotation.z = Math.PI / 2;
            rim.position.z = 0.025;
            
            wheelGroup.add(wheel);
            wheelGroup.add(rim);
            wheelGroup.position.set(pos[0], pos[1], pos[2]);
            wheelGroup.castShadow = true;
            
            carGroup.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });
        
        // LED fényszórók
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const headlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.45, 2.2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.45, 2.2);
        carGroup.add(rightHeadlight);
        
        // Hátsó LED lámpák
        const tailLightGeometry = new THREE.BoxGeometry(0.25, 0.12, 0.08);
        const tailLightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        const leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        leftTailLight.position.set(-0.7, 0.45, -2.2);
        carGroup.add(leftTailLight);
        
        const rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        rightTailLight.position.set(0.7, 0.45, -2.2);
        carGroup.add(rightTailLight);
        
        // Fényszórók pozicionálása
        this.headlights[0].position.set(-0.6, 0.5, 2.5);
        this.headlights[1].position.set(0.6, 0.5, 2.5);
        carGroup.add(this.headlights[0]);
        carGroup.add(this.headlights[1]);
        
        this.car = carGroup;
        this.scene.add(this.car);
    }
    
    createOpponents() {
        for (let i = 0; i < 4; i++) {
            const opponentGroup = new THREE.Group();
            
            // Ellenfél autó test
            const bodyGeometry = new THREE.BoxGeometry(1.6, 0.5, 3.5);
            const colors = [0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.25;
            body.castShadow = true;
            opponentGroup.add(body);
            
            // Pozicionálás a pályán
            if (this.trackData.segments.length > 0) {
                const segmentIndex = Math.min(i * 10, this.trackData.segments.length - 1);
                const segment = this.trackData.segments[segmentIndex];
                opponentGroup.position.set(
                    segment.x + (Math.random() - 0.5) * 10,
                    0.5,
                    segment.z - 20
                );
            } else {
                opponentGroup.position.set(
                    (Math.random() - 0.5) * 15,
                    0.5,
                    -50 - i * 30
                );
            }
            
            this.opponents.push({
                mesh: opponentGroup,
                speed: 80 + Math.random() * 40,
                lane: (Math.random() - 0.5) * 15,
                targetSegment: i * 10
            });
            
            this.scene.add(opponentGroup);
        }
    }
    
    createEnvironment() {
        // Égbolt (nappali)
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide 
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Felhők
        for (let i = 0; i < 30; i++) {
            const cloudGeometry = new THREE.SphereGeometry(8 + Math.random() * 4, 8, 8);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 1000,
                80 + Math.random() * 40,
                (Math.random() - 0.5) * 1000
            );
            this.scene.add(cloud);
        }
        
        // Városi talaj/fű területek
        for (let i = 0; i < 200; i++) {
            const groundGeometry = new THREE.PlaneGeometry(15, 15);
            const groundMaterial = new THREE.MeshLambertMaterial({ 
                color: Math.random() > 0.7 ? 0x228B22 : 0x90EE90
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.set(
                (Math.random() - 0.5) * 800,
                -0.1,
                (Math.random() - 0.5) * 800
            );
            ground.receiveShadow = true;
            this.scene.add(ground);
        }
    }
    
    initMinimap() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }
    
    updateMinimap() {
        if (!this.minimapVisible || !this.minimapCtx) return;
        
        const ctx = this.minimapCtx;
        const canvas = this.minimapCanvas;
        
        // Háttér törlése
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const scale = 0.5;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Pálya rajzolása
        if (this.trackData.segments.length > 0) {
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 6;
            ctx.beginPath();
            
            this.trackData.segments.forEach((segment, index) => {
                const x = centerX + (segment.x - this.car.position.x) * scale;
                const y = centerY + (segment.z - this.car.position.z) * scale;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // Pálya szélek
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Épületek rajzolása
        ctx.fillStyle = '#ffff00';
        this.trackData.buildings.forEach(building => {
            const x = centerX + (building.position.x - this.car.position.x) * scale;
            const y = centerY + (building.position.z - this.car.position.z) * scale;
            
            if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                ctx.beginPath();
                ctx.rect(x - 2, y - 2, 4, 4);
                ctx.fill();
            }
        });
        
        // Utcai lámpák
        ctx.fillStyle = '#ffff88';
        this.trackData.streetLights.forEach(light => {
            const x = centerX + (light.x - this.car.position.x) * scale;
            const y = centerY + (light.z - this.car.position.z) * scale;
            
            if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Ellenfelek rajzolása
        ctx.fillStyle = '#ff0000';
        this.opponents.forEach(opponent => {
            const x = centerX + (opponent.mesh.position.x - this.car.position.x) * scale;
            const y = centerY + (opponent.mesh.position.z - this.car.position.z) * scale;
            
            if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Játékos autó rajzolása
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const playerX = centerX;
        const playerY = centerY;
        
        ctx.save();
        ctx.translate(playerX, playerY);
        ctx.rotate(this.gameState.rotation);
        
        // Autó alakja (háromszög)
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.updateCamera();
    }
    
    updateCamera() {
        switch (this.gameState.cameraMode) {
            case 0: // Hátsó nézet
                const backOffset = new THREE.Vector3(0, 2.5, 6);
                backOffset.applyQuaternion(this.car.quaternion);
                this.camera.position.copy(this.car.position).add(backOffset);
                this.camera.lookAt(this.car.position);
                break;
            case 1: // Cockpit nézet
                const cockpitOffset = new THREE.Vector3(0, 1.0, 0.5);
                cockpitOffset.applyQuaternion(this.car.quaternion);
                this.camera.position.copy(this.car.position).add(cockpitOffset);
                const lookTarget = this.car.position.clone();
                const lookDirection = new THREE.Vector3(0, 0, -10);
                lookDirection.applyQuaternion(this.car.quaternion);
                lookTarget.add(lookDirection);
                this.camera.lookAt(lookTarget);
                break;
            case 2: // Felülnézet
                this.camera.position.set(this.car.position.x, 50, this.car.position.z + 10);
                this.camera.lookAt(this.car.position);
                break;
        }
    }
    
    handleInput() {
        const deltaTime = 0.016; // ~60 FPS
        
        // Gyorsítás
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.gameState.speed = Math.min(
                this.gameState.speed + this.gameState.acceleration,
                this.gameState.maxSpeed
            );
        } else {
            // Természetes lassulás
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration * 0.3,
                0
            );
        }
        
        // Fékezés
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration,
                0
            );
        }
        
        // Kézifék
        if (this.keys['Space']) {
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration * 2,
                0
            );
        }
        
        // JAVÍTOTT KORMÁNYOZÁS - FORDÍTOTT IRÁNYOK
        const speedFactor = Math.max(this.gameState.speed / this.gameState.maxSpeed, 0.1);
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            // BALRA KANYARODÁS - POZITÍV IRÁNY
            this.gameState.turnSpeed = Math.min(
                this.gameState.turnSpeed + 0.001 * speedFactor,
                this.gameState.maxTurnSpeed * speedFactor
            );
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            // JOBBRA KANYARODÁS - NEGATÍV IRÁNY
            this.gameState.turnSpeed = Math.max(
                this.gameState.turnSpeed - 0.001 * speedFactor,
                -this.gameState.maxTurnSpeed * speedFactor
            );
        } else {
            this.gameState.turnSpeed *= 0.9; // Fokozatos visszatérés középre
        }
    }
    
    update() {
        // Autó forgatás
        this.gameState.rotation += this.gameState.turnSpeed;
        this.car.rotation.y = this.gameState.rotation;
        
        // Mozgás logika
        if (this.gameState.speed > 0) {
            const speedFactor = this.gameState.speed * 0.02;
            
            // Előre mozgás a forgatás irányában
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.car.quaternion);
            direction.multiplyScalar(speedFactor);
            
            this.car.position.add(direction);
            
            // Távolság számítás
            this.gameState.distanceTraveled += speedFactor;
        }
        
        // Kerekek forgatása
        const wheelRotation = this.gameState.speed * 0.01;
        this.wheels.forEach(wheel => {
            wheel.rotation.x += wheelRotation;
        });
        
        // Első kerekek kormányozás szerinti forgatása
        if (this.wheels.length >= 2) {
            this.wheels[0].rotation.y = this.gameState.turnSpeed * 10; // bal első
            this.wheels[1].rotation.y = this.gameState.turnSpeed * 10; // jobb első
        }
        
        // Fényszórók frissítése
        this.headlights.forEach((light, index) => {
            const lightDirection = new THREE.Vector3(0, 0, -1);
            lightDirection.applyQuaternion(this.car.quaternion);
            light.target.position.copy(this.car.position).add(lightDirection.multiplyScalar(20));
        });
        
        // Kamera frissítés
        this.updateCamera();
        
        // Ellenfelek frissítése
        this.updateOpponents();
        
        // Fokozat számítás
        this.gameState.gear = Math.floor(this.gameState.speed / 40) + 1;
        this.gameState.gear = Math.min(this.gameState.gear, 6);
        
        // Kör számítás
        const lapLength = 1000;
        this.gameState.lap = Math.floor(this.gameState.distanceTraveled / lapLength) + 1;
        this.gameState.lap = Math.min(this.gameState.lap, this.gameState.totalLaps);
        
        // Minimap frissítése
        this.updateMinimap();
        
        // HUD frissítés
        this.updateHUD();
    }
    
    updateOpponents() {
        this.opponents.forEach((opponent, index) => {
            // Egyszerű AI - pálya követés
            if (this.trackData.segments.length > 0) {
                opponent.targetSegment = (opponent.targetSegment + 1) % this.trackData.segments.length;
                const targetSegment = this.trackData.segments[opponent.targetSegment];
                
                // Mozgás a célszegmens felé
                const dx = targetSegment.x - opponent.mesh.position.x;
                const dz = targetSegment.z - opponent.mesh.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance > 1) {
                    const speed = 0.5;
                    opponent.mesh.position.x += (dx / distance) * speed;
                    opponent.mesh.position.z += (dz / distance) * speed;
                }
            } else {
                // Fallback: egyszerű mozgás
                opponent.mesh.position.z += 0.5;
                
                // Ha túl messze van, újrapozicionáljuk
                if (opponent.mesh.position.z > this.car.position.z + 100) {
                    opponent.mesh.position.z = this.car.position.z - 300;
                    opponent.mesh.position.x = (Math.random() - 0.5) * 15;
                }
            }
        });
    }
    
    updateHUD() {
        const speedElement = document.getElementById('speed');
        const lapElement = document.getElementById('lap');
        const gearElement = document.getElementById('gear');
        const timeElement = document.getElementById('time');
        const positionElement = document.getElementById('position');
        
        if (speedElement) speedElement.textContent = Math.round(this.gameState.speed);
        if (lapElement) lapElement.textContent = this.gameState.lap;
        if (gearElement) gearElement.textContent = this.gameState.gear;
        
        if (timeElement) {
            const elapsed = (Date.now() - this.gameState.startTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            timeElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (positionElement) positionElement.textContent = this.gameState.playerPosition;
    }
    
    switchCity() {
        // Város váltás funkció
        const cities = ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'];
        const currentIndex = cities.indexOf(this.gameState.currentCity);
        const nextIndex = (currentIndex + 1) % cities.length;
        this.gameState.currentCity = cities[nextIndex];
        
        console.log('Város váltás:', this.gameState.currentCity);
        
        // Újra generálás
        this.clearScene();
        this.loadAndGenerate3DCity();
    }
    
    clearScene() {
        // Jelenlegi város objektumok törlése
        this.trackData.buildings.forEach(building => {
            if (building.mesh) {
                this.scene.remove(building.mesh);
            }
        });
        
        this.road.forEach(roadSegment => {
            this.scene.remove(roadSegment);
        });
        
        // Törlés
        this.trackData.buildings = [];
        this.trackData.landmarks = [];
        this.trackData.streetLights = [];
        this.road = [];
    }
    
    restart() {
        this.gameState.speed = 0;
        this.gameState.rotation = 0;
        this.gameState.turnSpeed = 0;
        this.gameState.distanceTraveled = 0;
        this.car.position.set(0, 0.5, 0);
        this.car.rotation.set(0, 0, 0);
        this.gameState.lap = 1;
        this.gameState.startTime = Date.now();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.handleInput();
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Játék indítása
window.addEventListener('load', () => {
    new Lotus3DRacing();
});
