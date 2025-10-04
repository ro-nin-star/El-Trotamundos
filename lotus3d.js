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
            currentSegment: 0
        };
        
        // Irányítás
        this.keys = {};
        this.setupControls();
        
        // Inicializálás
        this.init();
    }
    
    init() {
        this.createScene();
        this.createLighting();
        this.createGT86Car();
        this.generateCityTrack();
        this.createOpponents();
        this.createEnvironment();
        this.setupCamera();
        this.initMinimap();
        
        // Betöltés befejezése
        document.getElementById('loading').classList.add('hidden');
        
        this.animate();
    }
    
    // Városi pálya generátor
    generateCityTrack() {
        console.log('Városi pálya generálása...');
        
        // Pálya pontok definiálása (érdekes városi útvonal)
        const trackPoints = [
            // Kezdő egyenes
            { x: 0, z: 0, type: 'straight' },
            { x: 0, z: -100, type: 'straight' },
            
            // Jobb kanyar (városközpont)
            { x: 20, z: -150, type: 'right_turn' },
            { x: 50, z: -180, type: 'right_turn' },
            { x: 80, z: -200, type: 'right_turn' },
            
            // Egyenes szakasz (főutca)
            { x: 150, z: -200, type: 'straight' },
            { x: 250, z: -200, type: 'straight' },
            
            // Bal kanyar (park mellett)
            { x: 280, z: -170, type: 'left_turn' },
            { x: 300, z: -130, type: 'left_turn' },
            { x: 310, z: -80, type: 'left_turn' },
            
            // Hosszú egyenes (külváros)
            { x: 310, z: 0, type: 'straight' },
            { x: 310, z: 100, type: 'straight' },
            { x: 310, z: 200, type: 'straight' },
            
            // U-kanyar (fordulópont)
            { x: 280, z: 230, type: 'u_turn' },
            { x: 230, z: 250, type: 'u_turn' },
            { x: 180, z: 230, type: 'u_turn' },
            { x: 150, z: 200, type: 'u_turn' },
            
            // Visszaút
            { x: 150, z: 100, type: 'straight' },
            { x: 150, z: 0, type: 'straight' },
            { x: 150, z: -100, type: 'straight' },
            
            // Bal kanyar vissza a starthoz
            { x: 120, z: -130, type: 'left_turn' },
            { x: 80, z: -150, type: 'left_turn' },
            { x: 40, z: -130, type: 'left_turn' },
            { x: 20, z: -100, type: 'left_turn' },
            { x: 0, z: -50, type: 'left_turn' },
            { x: 0, z: 0, type: 'straight' }
        ];
        
        // Pálya szegmensek létrehozása
        this.createTrackSegments(trackPoints);
        
        // Városi környezet létrehozása
        this.generateCityEnvironment(trackPoints);
        
        console.log('Pálya generálás befejezve:', this.trackData.segments.length, 'szegmens');
    }
    
    createTrackSegments(trackPoints) {
        const roadWidth = 20;
        const segmentLength = 8;
        
        for (let i = 0; i < trackPoints.length - 1; i++) {
            const start = trackPoints[i];
            const end = trackPoints[i + 1];
            
            // Szegmensek interpolálása
            const steps = Math.ceil(this.distance(start, end) / segmentLength);
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + (end.x - start.x) * t;
                const z = start.z + (end.z - start.z) * t;
                
                // Szegmens adatok tárolása
                this.trackData.segments.push({
                    x: x,
                    z: z,
                    type: start.type,
                    angle: Math.atan2(end.x - start.x, end.z - start.z)
                });
                
                // Út szegmens létrehozása
                const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
                const roadMaterial = new THREE.MeshLambertMaterial({ 
                    color: this.trackData.segments.length % 2 === 0 ? 0x444444 : 0x555555 
                });
                const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
                roadSegment.rotation.x = -Math.PI / 2;
                roadSegment.position.set(x, 0, z);
                roadSegment.receiveShadow = true;
                this.scene.add(roadSegment);
                this.road.push(roadSegment);
                
                // Útburkolat jelzések
                this.createRoadMarkings(x, z, roadWidth, segmentLength, this.trackData.segments.length);
            }
        }
    }
    
    createRoadMarkings(x, z, roadWidth, segmentLength, segmentIndex) {
        // Középső vonal
        if (segmentIndex % 4 < 2) {
            const lineGeometry = new THREE.PlaneGeometry(0.5, segmentLength * 0.8);
            const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, z);
            this.scene.add(line);
        }
        
        // Szélső vonalak
        [-roadWidth/2, roadWidth/2].forEach(offset => {
            const borderGeometry = new THREE.PlaneGeometry(1, segmentLength);
            const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.rotation.x = -Math.PI / 2;
            border.position.set(x + offset, 0.01, z);
            this.scene.add(border);
        });
        
        // Járda
        [-roadWidth/2 - 3, roadWidth/2 + 3].forEach(offset => {
            const sidewalkGeometry = new THREE.PlaneGeometry(4, segmentLength);
            const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
            sidewalk.rotation.x = -Math.PI / 2;
            sidewalk.position.set(x + offset, 0.02, z);
            sidewalk.receiveShadow = true;
            this.scene.add(sidewalk);
        });
    }
    
    generateCityEnvironment(trackPoints) {
        console.log('Városi környezet generálása...');
        
        // Épületek generálása
        this.generateBuildings(trackPoints);
        
        // Fák és parkok
        this.generateVegetation(trackPoints);
        
        // Utcai lámpák
        this.generateStreetLights(trackPoints);
        
        // Forgalmi táblák és jelzőlámpák
        this.generateTrafficElements(trackPoints);
    }
    
    generateBuildings(trackPoints) {
        const buildingTypes = [
            { name: 'Lakóház', height: 8, width: 6, depth: 8, color: 0xCCCCCC },
            { name: 'Irodaház', height: 15, width: 8, depth: 10, color: 0x888888 },
            { name: 'Bevásárlóközpont', height: 5, width: 20, depth: 15, color: 0xAAAAAAA },
            { name: 'Hotel', height: 20, width: 12, depth: 8, color: 0x996633 },
            { name: 'Iskola', height: 6, width: 15, depth: 10, color: 0xFFCC99 },
            { name: 'Kórház', height: 12, width: 12, depth: 12, color: 0xFFFFFF },
            { name: 'Templom', height: 18, width: 8, depth: 12, color: 0xDEB887 }
        ];
        
        trackPoints.forEach((point, index) => {
            if (index % 3 === 0) { // Minden 3. pontnál épület
                const sides = ['left', 'right'];
                
                sides.forEach(side => {
                    if (Math.random() > 0.3) { // 70% esély épületre
                        const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
                        const distance = 25 + Math.random() * 20;
                        const offset = side === 'left' ? -distance : distance;
                        
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
                        
                        // Ablak effektek
                        this.addWindowsToBuilding(buildingGroup, buildingType);
                        
                        // Tető
                        if (buildingType.name === 'Templom') {
                            const roofGeometry = new THREE.ConeGeometry(4, 8, 8);
                            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                            roof.position.y = buildingType.height + 4;
                            buildingGroup.add(roof);
                        }
                        
                        buildingGroup.position.set(
                            point.x + offset + (Math.random() - 0.5) * 10,
                            0,
                            point.z + (Math.random() - 0.5) * 10
                        );
                        
                        this.scene.add(buildingGroup);
                        
                        this.trackData.buildings.push({
                            name: buildingType.name,
                            position: buildingGroup.position.clone(),
                            type: buildingType.name.toLowerCase()
                        });
                    }
                });
            }
        });
        
        console.log('Épületek létrehozva:', this.trackData.buildings.length);
    }
    
    addWindowsToBuilding(buildingGroup, buildingType) {
        const windowsPerFloor = Math.floor(buildingType.width / 2);
        const floors = Math.floor(buildingType.height / 3);
        
        for (let floor = 0; floor < floors; floor++) {
            for (let window = 0; window < windowsPerFloor; window++) {
                // Ablak geometria
                const windowGeometry = new THREE.PlaneGeometry(0.8, 1.2);
                const isLit = Math.random() > 0.6; // 40% esély világító ablakra
                const windowMaterial = new THREE.MeshLambertMaterial({ 
                    color: isLit ? 0xFFFF88 : 0x333366,
                    transparent: true,
                    opacity: 0.8
                });
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                
                // Ablak pozicionálás
                windowMesh.position.set(
                    -buildingType.width/2 + window * 2 + 1,
                    floor * 3 + 2,
                    buildingType.depth/2 + 0.01
                );
                
                buildingGroup.add(windowMesh);
                
                // Ha világít, fényforrás hozzáadása
                if (isLit) {
                    const windowLight = new THREE.PointLight(0xFFFF88, 0.3, 10);
                    windowLight.position.copy(windowMesh.position);
                    windowLight.position.z += 2;
                    buildingGroup.add(windowLight);
                }
            }
        }
    }
    
    generateVegetation(trackPoints) {
        // Fák generálása
        trackPoints.forEach((point, index) => {
            if (index % 2 === 0 && Math.random() > 0.4) {
                const sides = ['left', 'right'];
                
                sides.forEach(side => {
                    if (Math.random() > 0.5) {
                        const treeGroup = new THREE.Group();
                        
                        // Törzs
                        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
                        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                        trunk.position.y = 2;
                        trunk.castShadow = true;
                        treeGroup.add(trunk);
                        
                        // Lombkorona
                        const crownGeometry = new THREE.SphereGeometry(2 + Math.random(), 8, 8);
                        const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
                        crown.position.y = 5 + Math.random();
                        crown.castShadow = true;
                        treeGroup.add(crown);
                        
                        const distance = 15 + Math.random() * 10;
                        const offset = side === 'left' ? -distance : distance;
                        
                        treeGroup.position.set(
                            point.x + offset + (Math.random() - 0.5) * 5,
                            0,
                            point.z + (Math.random() - 0.5) * 10
                        );
                        
                        this.scene.add(treeGroup);
                        this.trackData.trees.push(treeGroup.position.clone());
                    }
                });
            }
        });
        
        // Parkterület
        const parkCenter = { x: 200, z: -100 };
        for (let i = 0; i < 20; i++) {
            const treeGroup = new THREE.Group();
            
            // Törzs
            const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 5, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 2.5;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // Lombkorona
            const crownGeometry = new THREE.SphereGeometry(3 + Math.random(), 8, 8);
            const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 6 + Math.random();
            crown.castShadow = true;
            treeGroup.add(crown);
            
            treeGroup.position.set(
                parkCenter.x + (Math.random() - 0.5) * 40,
                0,
                parkCenter.z + (Math.random() - 0.5) * 40
            );
            
            this.scene.add(treeGroup);
        }
        
        console.log('Növényzet létrehozva:', this.trackData.trees.length, 'fa');
    }
    
    generateStreetLights(trackPoints) {
        trackPoints.forEach((point, index) => {
            if (index % 5 === 0) { // Minden 5. pontnál lámpa
                const sides = ['left', 'right'];
                
                sides.forEach(side => {
                    const lightGroup = new THREE.Group();
                    
                    // Lámpaoszlop
                    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
                    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                    pole.position.y = 3;
                    pole.castShadow = true;
                    lightGroup.add(pole);
                    
                    // Lámpatest
                    const lampGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                    const lampMaterial = new THREE.MeshLambertMaterial({ 
                        color: 0xFFFFAA,
                        emissive: 0x444422
                    });
                    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
                    lamp.position.y = 6;
                    lightGroup.add(lamp);
                    
                    // Fényforrás
                    const streetLight = new THREE.PointLight(0xFFFFAA, 1, 20);
                    streetLight.position.y = 6;
                    streetLight.castShadow = true;
                    lightGroup.add(streetLight);
                    
                    const distance = 12;
                    const offset = side === 'left' ? -distance : distance;
                    
                    lightGroup.position.set(
                        point.x + offset,
                        0,
                        point.z
                    );
                    
                    this.scene.add(lightGroup);
                    this.trackData.streetLights.push(lightGroup.position.clone());
                });
            }
        });
        
        console.log('Utcai világítás létrehozva:', this.trackData.streetLights.length, 'lámpa');
    }
    
    generateTrafficElements(trackPoints) {
        // Forgalmi táblák
        trackPoints.forEach((point, index) => {
            if (index % 8 === 0 && Math.random() > 0.5) {
                const signGroup = new THREE.Group();
                
                // Tábla oszlop
                const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
                const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.y = 1.25;
                signGroup.add(pole);
                
                // Tábla
                const signGeometry = new THREE.PlaneGeometry(0.8, 0.8);
                const signColors = [0xFF0000, 0x0000FF, 0xFFFF00, 0x00FF00];
                const signMaterial = new THREE.MeshLambertMaterial({ 
                    color: signColors[Math.floor(Math.random() * signColors.length)]
                });
                const sign = new THREE.Mesh(signGeometry, signMaterial);
                sign.position.y = 2.5;
                signGroup.add(sign);
                
                signGroup.position.set(
                    point.x + (Math.random() > 0.5 ? -15 : 15),
                    0,
                    point.z + (Math.random() - 0.5) * 5
                );
                
                this.scene.add(signGroup);
            }
        });
        
        // Jelzőlámpák főbb kereszteződésekben
        const intersections = [
            { x: 50, z: -180 },
            { x: 280, z: -130 },
            { x: 180, z: 230 }
        ];
        
        intersections.forEach(intersection => {
            const trafficLightGroup = new THREE.Group();
            
            // Oszlop
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 2;
            trafficLightGroup.add(pole);
            
            // Lámpaház
            const housingGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.2);
            const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const housing = new THREE.Mesh(housingGeometry, housingMaterial);
            housing.position.y = 4;
            trafficLightGroup.add(housing);
            
            // Lámpák (piros, sárga, zöld)
            const lightColors = [0xFF0000, 0xFFFF00, 0x00FF00];
            lightColors.forEach((color, i) => {
                const lightGeometry = new THREE.CircleGeometry(0.08, 8);
                const lightMaterial = new THREE.MeshLambertMaterial({ 
                    color: i === 2 ? color : 0x333333, // Csak a zöld világít
                    emissive: i === 2 ? 0x002200 : 0x000000
                });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(0, 4.3 - i * 0.2, 0.11);
                trafficLightGroup.add(light);
            });
            
            trafficLightGroup.position.set(intersection.x, 0, intersection.z);
            this.scene.add(trafficLightGroup);
        });
    }
    
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
    }
    
    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 800);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Nappali ég szín
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Ablak átméretezés
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createLighting() {
        // Ambiens fény
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Nap (irányított fény)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(200, 300, 200);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        this.scene.add(sunLight);
        
        // Autó fényszórók
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
        const mainBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Sötétszürke
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
                color: Math.random() > 0.7 ? 0x228B22 : 0x90EE90 // Változó zöld árnyalatok
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
        this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
    
    updateMinimap() {
        if (!this.minimapVisible) return;
        
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
                if (this.minimapVisible) {
                    minimap.classList.remove('hidden');
                } else {
                    minimap.classList.add('hidden');
                }
            }
            
            // Újraindítás
            if (e.code === 'KeyR') {
                this.restart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
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
        document.getElementById('speed').textContent = Math.round(this.gameState.speed);
        document.getElementById('lap').textContent = this.gameState.lap;
        document.getElementById('gear').textContent = this.gameState.gear;
        
        const elapsed = (Date.now() - this.gameState.startTime) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('position').textContent = this.gameState.playerPosition;
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
