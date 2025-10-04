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
        
        // Materiál cache a GPU optimalizáláshoz
        this.materialCache = new Map();
        
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
        console.log('Játék inicializálása...');
        
        this.createScene();
        this.createLighting();
        this.initMaterialCache();
        this.createGT86Car();
        
        // Egyszerűsített város generálás
        await this.generateSimpleCity();
        
        this.createOpponents();
        this.createEnvironment();
        this.setupCamera();
        this.initMinimap();
        
        // Betöltés befejezése
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
        
        console.log('Játék betöltve, animáció indítása...');
        this.animate();
    }
    
    initMaterialCache() {
        // Előre létrehozott materiálok a GPU optimalizáláshoz
        this.materialCache.set('road', new THREE.MeshLambertMaterial({ color: 0x444444 }));
        this.materialCache.set('roadAlt', new THREE.MeshLambertMaterial({ color: 0x555555 }));
        this.materialCache.set('white', new THREE.MeshLambertMaterial({ color: 0xffffff }));
        this.materialCache.set('building', new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));
        this.materialCache.set('government', new THREE.MeshLambertMaterial({ color: 0xDEB887 }));
        this.materialCache.set('church', new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }));
        this.materialCache.set('bridge', new THREE.MeshLambertMaterial({ color: 0x696969 }));
        this.materialCache.set('tree', new THREE.MeshLambertMaterial({ color: 0x228B22 }));
        this.materialCache.set('trunk', new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        this.materialCache.set('grass', new THREE.MeshLambertMaterial({ color: 0x90EE90 }));
        this.materialCache.set('sidewalk', new THREE.MeshLambertMaterial({ color: 0x888888 }));
        
        console.log('Materiál cache inicializálva');
    }
    
    getMaterial(type) {
        return this.materialCache.get(type) || this.materialCache.get('building');
    }
    
    async generateSimpleCity() {
        console.log('Egyszerűsített város generálása...');
        
        // Fő verseny pálya generálása
        this.generateMainGameTrack();
        
        // Egyszerű épületek
        this.generateSimpleBuildings();
        
        // Alapvető környezet
        this.generateBasicEnvironment();
        
        console.log('Egyszerűsített város generálás befejezve');
    }
    
    generateMainGameTrack() {
        console.log('Fő verseny pálya generálása...');
        
        // Egyszerű körpálya
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
        console.log('Verseny pálya létrehozva:', this.trackData.segments.length, 'szegmens');
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
                
                // Út szegmens
                const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
                const roadMaterial = this.trackData.segments.length % 2 === 0 ? 
                    this.getMaterial('road') : this.getMaterial('roadAlt');
                
                const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
                roadSegment.rotation.x = -Math.PI / 2;
                roadSegment.position.set(x, 0, z);
                roadSegment.receiveShadow = true;
                this.scene.add(roadSegment);
                this.road.push(roadSegment);
                
                // Útburkolat jelzések
                this.createRoadMarkings(x, z, roadWidth, segmentLength);
            }
        }
    }
    
    createRoadMarkings(x, z, roadWidth, segmentLength) {
        // Középső vonal (csak minden 4. szegmensnél)
        if (this.trackData.segments.length % 4 < 2) {
            const lineGeometry = new THREE.PlaneGeometry(0.5, segmentLength * 0.8);
            const line = new THREE.Mesh(lineGeometry, this.getMaterial('white'));
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, z);
            this.scene.add(line);
        }
        
        // Szélső vonalak
        [-roadWidth/2, roadWidth/2].forEach(offset => {
            const borderGeometry = new THREE.PlaneGeometry(1, segmentLength);
            const border = new THREE.Mesh(borderGeometry, this.getMaterial('white'));
            border.rotation.x = -Math.PI / 2;
            border.position.set(x + offset, 0.01, z);
            this.scene.add(border);
        });
        
        // Járda
        [-roadWidth/2 - 3, roadWidth/2 + 3].forEach(offset => {
            const sidewalkGeometry = new THREE.PlaneGeometry(4, segmentLength);
            const sidewalk = new THREE.Mesh(sidewalkGeometry, this.getMaterial('sidewalk'));
            sidewalk.rotation.x = -Math.PI / 2;
            sidewalk.position.set(x + offset, 0.02, z);
            sidewalk.receiveShadow = true;
            this.scene.add(sidewalk);
        });
    }
    
    generateSimpleBuildings() {
        console.log('Egyszerű épületek generálása...');
        
        // Kevesebb, egyszerűbb épület
        for (let i = 0; i < 20; i++) {
            const buildingGroup = new THREE.Group();
            
            // Alapvető épület
            const width = 8 + Math.random() * 10;
            const height = 10 + Math.random() * 20;
            const depth = 8 + Math.random() * 10;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const building = new THREE.Mesh(geometry, this.getMaterial('building'));
            building.position.y = height / 2;
            building.castShadow = true;
            buildingGroup.add(building);
            
            // Egyszerű ablakok (kevesebb)
            this.addSimpleWindows(buildingGroup, width, height, depth);
            
            // Pozicionálás
            const angle = (i / 20) * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            buildingGroup.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            this.scene.add(buildingGroup);
            
            this.trackData.buildings.push({
                name: `Épület ${i + 1}`,
                position: buildingGroup.position.clone(),
                type: 'building'
            });
        }
        
        console.log('Épületek létrehozva:', this.trackData.buildings.length);
    }
    
    addSimpleWindows(group, width, height, depth) {
        const windowsPerRow = Math.floor(width / 4);
        const floors = Math.floor(height / 5);
        
        // Csak az előlapon, kevesebb ablak
        for (let floor = 0; floor < floors; floor++) {
            for (let window = 0; window < windowsPerRow; window++) {
                const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
                const isLit = Math.random() > 0.8; // Kevesebb világító ablak
                
                const windowMaterial = new THREE.MeshLambertMaterial({ 
                    color: isLit ? 0xFFFF88 : 0x333366,
                    transparent: true,
                    opacity: 0.8
                });
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                
                windowMesh.position.set(
                    -width/2 + (window + 0.5) * (width / windowsPerRow),
                    floor * 5 + 2.5,
                    depth/2 + 0.01
                );
                
                group.add(windowMesh);
            }
        }
    }
    
    generateBasicEnvironment() {
        console.log('Alapvető környezet generálása...');
        
        // Kevesebb fa
        for (let i = 0; i < 15; i++) {
            const treeGroup = new THREE.Group();
            
            // Törzs
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
            const trunk = new THREE.Mesh(trunkGeometry, this.getMaterial('trunk'));
            trunk.position.y = 2;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // Lombkorona
            const crownGeometry = new THREE.SphereGeometry(2 + Math.random(), 6, 6);
            const crown = new THREE.Mesh(crownGeometry, this.getMaterial('tree'));
            crown.position.y = 5 + Math.random();
            crown.castShadow = true;
            treeGroup.add(crown);
            
            // Pozicionálás
            const angle = (i / 15) * Math.PI * 2;
            const distance = 25 + Math.random() * 15;
            treeGroup.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            this.scene.add(treeGroup);
            this.trackData.trees.push(treeGroup.position.clone());
        }
        
        // Egyszerű utcai lámpák
        this.trackData.segments.forEach((segment, index) => {
            if (index % 15 === 0) { // Ritkábban
                const lightGroup = new THREE.Group();
                
                // Lámpaoszlop
                const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 6, 6);
                const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.y = 3;
                pole.castShadow = true;
                lightGroup.add(pole);
                
                // Lámpatest
                const lampGeometry = new THREE.SphereGeometry(0.3, 6, 6);
                const lampMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xFFFFAA,
                    emissive: 0x222211
                });
                const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
                lamp.position.y = 6;
                lightGroup.add(lamp);
                
                // Egyszerű fényforrás
                const streetLight = new THREE.PointLight(0xFFFFAA, 0.5, 15);
                streetLight.position.y = 6;
                lightGroup.add(streetLight);
                
                lightGroup.position.set(
                    segment.x + (index % 2 === 0 ? -12 : 12),
                    0,
                    segment.z
                );
                
                this.scene.add(lightGroup);
                this.trackData.streetLights.push(lightGroup.position.clone());
            }
        });
        
        console.log('Környezet létrehozva');
    }
    
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
    }
    
    createScene() {
        console.log('Scene létrehozása...');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);
        
        // Renderer - optimalizált beállítások
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Kikapcsoljuk az antialiasing-ot
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        
        // Árnyékok optimalizálása
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Egyszerűbb árnyékok
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Ablak átméretezés
        window.addEventListener('resize', () => {
            if (this.camera) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
            }
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Scene létrehozva');
    }
    
    createLighting() {
        console.log('Világítás létrehozása...');
        
        // Ambiens fény
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);
        
        // Nap (egyszerűsített)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        
        // Árnyék optimalizálás
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Autó fényszórók (egyszerűsített)
        const headlight1 = new THREE.SpotLight(0xffffff, 0.5, 20, Math.PI / 8);
        const headlight2 = new THREE.SpotLight(0xffffff, 0.5, 20, Math.PI / 8);
        this.headlights = [headlight1, headlight2];
        this.scene.add(headlight1);
        this.scene.add(headlight2);
        
        console.log('Világítás létrehozva');
    }
    
    createGT86Car() {
        console.log('GT-86 autó létrehozása...');
        
        const carGroup = new THREE.Group();
        
        // Fő karosszéria
        const mainBodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 4.2);
        const mainBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
        mainBody.position.y = 0.4;
        mainBody.castShadow = true;
        carGroup.add(mainBody);
        
        // Tető
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.35, 2.2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 0.85, -0.3);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Kerekek
        const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-0.9, 0, 1.4],   // bal első
            [0.9, 0, 1.4],    // jobb első
            [-0.9, 0, -1.4],  // bal hátsó
            [0.9, 0, -1.4]    // jobb hátsó
        ];
        
        this.wheels = [];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            carGroup.add(wheel);
            this.wheels.push(wheel);
        });
        
        // Fényszórók
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const headlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.45, 2.2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.45, 2.2);
        carGroup.add(rightHeadlight);
        
        // Fényszórók pozicionálása
        this.headlights[0].position.set(-0.6, 0.5, 2.5);
        this.headlights[1].position.set(0.6, 0.5, 2.5);
        carGroup.add(this.headlights[0]);
        carGroup.add(this.headlights[1]);
        
        carGroup.position.set(0, 0.5, 0);
        this.car = carGroup;
        this.scene.add(this.car);
        
        console.log('GT-86 autó létrehozva');
    }
    
    createOpponents() {
        console.log('Ellenfelek létrehozása...');
        
        for (let i = 0; i < 3; i++) { // Kevesebb ellenfél
            const opponentGroup = new THREE.Group();
            
            // Ellenfél autó test
            const bodyGeometry = new THREE.BoxGeometry(1.6, 0.5, 3.5);
            const colors = [0x00ff00, 0x0000ff, 0xffff00];
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.25;
            body.castShadow = true;
            opponentGroup.add(body);
            
            // Pozicionálás
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
        
        console.log('Ellenfelek létrehozva:', this.opponents.length);
    }
    
    createEnvironment() {
        console.log('Környezet létrehozása...');
        
        // Egyszerű égbolt
        const skyGeometry = new THREE.SphereGeometry(500, 8, 8);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide 
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Kevesebb felhő
        for (let i = 0; i < 10; i++) {
            const cloudGeometry = new THREE.SphereGeometry(5 + Math.random() * 3, 6, 6);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.6
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 500,
                50 + Math.random() * 30,
                (Math.random() - 0.5) * 500
            );
            this.scene.add(cloud);
        }
        
        // Egyszerű talaj
        for (let i = 0; i < 50; i++) {
            const groundGeometry = new THREE.PlaneGeometry(20, 20);
            const ground = new THREE.Mesh(groundGeometry, this.getMaterial('grass'));
            ground.rotation.x = -Math.PI / 2;
            ground.position.set(
                (Math.random() - 0.5) * 400,
                -0.1,
                (Math.random() - 0.5) * 400
            );
            ground.receiveShadow = true;
            this.scene.add(ground);
        }
        
        console.log('Környezet létrehozva');
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
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    initMinimap() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }
    
    updateMinimap() {
        if (!this.minimapVisible || !this.minimapCtx || !this.car) return;
        
        const ctx = this.minimapCtx;
        const canvas = this.minimapCanvas;
        
        // Háttér törlése
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const scale = 0.8;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Pálya rajzolása
        if (this.trackData.segments.length > 0) {
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 4;
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
        }
        
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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.updateCamera();
    }
    
    updateCamera() {
        if (!this.car || !this.camera) return;
        
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
        
        // Kormányozás
        const speedFactor = Math.max(this.gameState.speed / this.gameState.maxSpeed, 0.1);
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.turnSpeed = Math.min(
                this.gameState.turnSpeed + 0.001 * speedFactor,
                this.gameState.maxTurnSpeed * speedFactor
            );
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.turnSpeed = Math.max(
                this.gameState.turnSpeed - 0.001 * speedFactor,
                -this.gameState.maxTurnSpeed * speedFactor
            );
        } else {
            this.gameState.turnSpeed *= 0.9;
        }
    }
    
    update() {
        if (!this.car) return;
        
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
        if (this.wheels) {
            const wheelRotation = this.gameState.speed * 0.01;
            this.wheels.forEach(wheel => {
                wheel.rotation.x += wheelRotation;
            });
        }
        
        // Fényszórók frissítése
        if (this.headlights) {
            this.headlights.forEach((light) => {
                const lightDirection = new THREE.Vector3(0, 0, -1);
                lightDirection.applyQuaternion(this.car.quaternion);
                light.target.position.copy(this.car.position).add(lightDirection.multiplyScalar(20));
            });
        }
        
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
        this.opponents.forEach((opponent) => {
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
    
    restart() {
        this.gameState.speed = 0;
        this.gameState.rotation = 0;
        this.gameState.turnSpeed = 0;
        this.gameState.distanceTraveled = 0;
        if (this.car) {
            this.car.position.set(0, 0.5, 0);
            this.car.rotation.set(0, 0, 0);
        }
        this.gameState.lap = 1;
        this.gameState.startTime = Date.now();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.handleInput();
        this.update();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Játék indítása
window.addEventListener('load', () => {
    console.log('Oldal betöltve, játék indítása...');
    new Lotus3DRacing();
});
