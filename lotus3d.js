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
        
        // Pálya adatok a térképhez
        this.trackData = {
            segments: [],
            totalLength: 1000,
            width: 20
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
            distanceTraveled: 0
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
        this.createRoad();
        this.createOpponents();
        this.createEnvironment();
        this.setupCamera();
        this.initMinimap();
        
        // Betöltés befejezése
        document.getElementById('loading').classList.add('hidden');
        
        this.animate();
    }
    
    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 50, 200);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000033);
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
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Irányított fény (nap)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
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
        
        // Oldalküszöb (GT-86 jellegzetes)
        const sideSillGeometry = new THREE.BoxGeometry(0.1, 0.15, 3.5);
        const sideSillMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        const leftSill = new THREE.Mesh(sideSillGeometry, sideSillMaterial);
        leftSill.position.set(-0.95, 0.1, 0);
        carGroup.add(leftSill);
        
        const rightSill = new THREE.Mesh(sideSillGeometry, sideSillMaterial);
        rightSill.position.set(0.95, 0.1, 0);
        carGroup.add(rightSill);
        
        // Visszapillantó tükrök (narancssárga)
        const mirrorGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.12);
        const mirrorMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        
        const leftMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        leftMirror.position.set(-1.0, 0.9, 0.8);
        carGroup.add(leftMirror);
        
        const rightMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        rightMirror.position.set(1.0, 0.9, 0.8);
        carGroup.add(rightMirror);
        
        // Szélvédő
        const windshieldGeometry = new THREE.PlaneGeometry(1.5, 1.0);
        const windshieldMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x003366, 
            transparent: true, 
            opacity: 0.7 
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, 0.9, 0.5);
        windshield.rotation.x = -0.3;
        carGroup.add(windshield);
        
        // Hátsó szélvédő
        const rearWindshieldGeometry = new THREE.PlaneGeometry(1.4, 0.8);
        const rearWindshield = new THREE.Mesh(rearWindshieldGeometry, windshieldMaterial);
        rearWindshield.position.set(0, 0.85, -1.2);
        rearWindshield.rotation.x = 0.3;
        carGroup.add(rearWindshield);
        
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
        
        // LED fényszórók (GT-86 stílus)
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
        
        // Kipufogó csövek
        const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        leftExhaust.rotation.z = Math.PI / 2;
        leftExhaust.position.set(-0.5, 0.1, -2.4);
        carGroup.add(leftExhaust);
        
        const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        rightExhaust.rotation.z = Math.PI / 2;
        rightExhaust.position.set(0.5, 0.1, -2.4);
        carGroup.add(rightExhaust);
        
        // Fényszórók pozicionálása
        this.headlights[0].position.set(-0.6, 0.5, 2.5);
        this.headlights[1].position.set(0.6, 0.5, 2.5);
        carGroup.add(this.headlights[0]);
        carGroup.add(this.headlights[1]);
        
        this.car = carGroup;
        this.scene.add(this.car);
    }
    
    createRoad() {
        const roadWidth = 20;
        const segmentLength = 10;
        const segments = 100;
        
        // Egyenes pálya a könnyebb teszteléshez
        for (let i = 0; i < segments; i++) {
            const z = -i * segmentLength;
            
            this.trackData.segments.push({ x: 0, z: z, angle: 0 });
            
            // Út szegmens
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
            const roadMaterial = new THREE.MeshLambertMaterial({ 
                color: i % 2 === 0 ? 0x444444 : 0x555555 
            });
            const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
            roadSegment.rotation.x = -Math.PI / 2;
            roadSegment.position.set(0, 0, z);
            roadSegment.receiveShadow = true;
            this.scene.add(roadSegment);
            this.road.push(roadSegment);
            
            // Középső vonal
            if (i % 4 < 2) {
                const lineGeometry = new THREE.PlaneGeometry(0.5, segmentLength);
                const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.set(0, 0.01, z);
                this.scene.add(line);
            }
            
            // Szélső vonalak
            [-roadWidth/2, roadWidth/2].forEach(offset => {
                const borderGeometry = new THREE.PlaneGeometry(1, segmentLength);
                const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const border = new THREE.Mesh(borderGeometry, borderMaterial);
                border.rotation.x = -Math.PI / 2;
                border.position.set(offset, 0.01, z);
                this.scene.add(border);
            });
        }
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
            
            // Pozicionálás
            opponentGroup.position.set(
                (Math.random() - 0.5) * 15,
                0.5,
                -50 - i * 30
            );
            
            this.opponents.push({
                mesh: opponentGroup,
                speed: 80 + Math.random() * 40,
                lane: (Math.random() - 0.5) * 15
            });
            
            this.scene.add(opponentGroup);
        }
    }
    
    createEnvironment() {
        // Égbolt
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000066,
            side: THREE.BackSide 
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Fák és tájelem
        for (let i = 0; i < 50; i++) {
            const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
            const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            
            const side = Math.random() > 0.5 ? 1 : -1;
            tree.position.set(
                side * (25 + Math.random() * 20),
                4,
                -Math.random() * 1000
            );
            tree.castShadow = true;
            this.scene.add(tree);
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
        
        const scale = 0.15;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Pálya rajzolása (egyenes út)
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, 20);
        ctx.lineTo(centerX, canvas.height - 20);
        ctx.stroke();
        
        // Pálya szélek
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ellenfelek rajzolása
        ctx.fillStyle = '#ff0000';
        this.opponents.forEach(opponent => {
            const x = centerX + opponent.mesh.position.x * scale;
            const y = centerY + (opponent.mesh.position.z - this.car.position.z) * scale * 0.1;
            
            if (y > 0 && y < canvas.height) {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Játékos autó rajzolása
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const playerX = centerX + this.car.position.x * scale;
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
                this.camera.position.set(this.car.position.x, 20, this.car.position.z + 5);
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
        
        // Gyorsítás - JAVÍTOTT LOGIKA
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
        
        // Kormányozás - csak mozgás közben
        const speedFactor = Math.max(this.gameState.speed / this.gameState.maxSpeed, 0.1);
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.turnSpeed = Math.max(
                this.gameState.turnSpeed - 0.001 * speedFactor,
                -this.gameState.maxTurnSpeed * speedFactor
            );
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.turnSpeed = Math.min(
                this.gameState.turnSpeed + 0.001 * speedFactor,
                this.gameState.maxTurnSpeed * speedFactor
            );
        } else {
            this.gameState.turnSpeed *= 0.9; // Fokozatos visszatérés középre
        }
    }
    
    update() {
        // Autó forgatás
        this.gameState.rotation += this.gameState.turnSpeed;
        this.car.rotation.y = this.gameState.rotation;
        
        // JAVÍTOTT MOZGÁS LOGIKA
        if (this.gameState.speed > 0) {
            const speedFactor = this.gameState.speed * 0.02; // Növelt sebesség faktor
            
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
        const lapLength = 500;
        this.gameState.lap = Math.floor(this.gameState.distanceTraveled / lapLength) + 1;
        this.gameState.lap = Math.min(this.gameState.lap, this.gameState.totalLaps);
        
        // Minimap frissítése
        this.updateMinimap();
        
        // HUD frissítés
        this.updateHUD();
    }
    
    updateOpponents() {
        this.opponents.forEach(opponent => {
            // Egyszerű AI mozgás
            opponent.mesh.position.z += 0.5;
            
            // Ha túl messze van, újrapozicionáljuk
            if (opponent.mesh.position.z > this.car.position.z + 100) {
                opponent.mesh.position.z = this.car.position.z - 300;
                opponent.mesh.position.x = (Math.random() - 0.5) * 15;
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
