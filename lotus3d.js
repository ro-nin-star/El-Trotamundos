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
            maxSpeed: 300,
            acceleration: 2,
            deceleration: 3,
            turnSpeed: 0,
            maxTurnSpeed: 0.05,
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
        this.createCar();
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
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
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
    
    createCar() {
        const carGroup = new THREE.Group();
        
        // Autó test (fekete)
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.6, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        body.castShadow = true;
        carGroup.add(body);
        
        // Hátsó lökhárító (narancssárga)
        const rearBumperGeometry = new THREE.BoxGeometry(1.9, 0.3, 0.3);
        const rearBumperMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const rearBumper = new THREE.Mesh(rearBumperGeometry, rearBumperMaterial);
        rearBumper.position.set(0, 0.15, -2.1);
        rearBumper.castShadow = true;
        carGroup.add(rearBumper);
        
        // Első lökhárító (fekete)
        const frontBumperGeometry = new THREE.BoxGeometry(1.9, 0.3, 0.3);
        const frontBumperMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const frontBumper = new THREE.Mesh(frontBumperGeometry, frontBumperMaterial);
        frontBumper.position.set(0, 0.15, 2.1);
        frontBumper.castShadow = true;
        carGroup.add(frontBumper);
        
        // Tetö (fekete)
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.4, 2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 0.8, -0.5);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Visszapillantó tükrök (narancssárga)
        const mirrorGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
        const mirrorMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        
        const leftMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        leftMirror.position.set(-1.0, 0.9, 0.5);
        carGroup.add(leftMirror);
        
        const rightMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        rightMirror.position.set(1.0, 0.9, 0.5);
        carGroup.add(rightMirror);
        
        // Szélvédő (kék árnyalat)
        const windshieldGeometry = new THREE.PlaneGeometry(1.5, 1.2);
        const windshieldMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x003366, 
            transparent: true, 
            opacity: 0.7 
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, 0.9, 0.3);
        windshield.rotation.x = -0.2;
        carGroup.add(windshield);
        
        // Kerekek (fekete)
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        
        // Felni (ezüst)
        const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
        const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        const wheelPositions = [
            [-0.9, 0, 1.3],   // bal első
            [0.9, 0, 1.3],    // jobb első
            [-0.9, 0, -1.3],  // bal hátsó
            [0.9, 0, -1.3]    // jobb hátsó
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
        
        // Fényszórók
        const headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
        const headlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffcc });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.rotation.z = Math.PI / 2;
        leftHeadlight.position.set(-0.6, 0.4, 1.9);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.rotation.z = Math.PI / 2;
        rightHeadlight.position.set(0.6, 0.4, 1.9);
        carGroup.add(rightHeadlight);
        
        // Hátsó lámpák (piros)
        const tailLightGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
        const tailLightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        const leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        leftTailLight.rotation.z = Math.PI / 2;
        leftTailLight.position.set(-0.6, 0.4, -1.9);
        carGroup.add(leftTailLight);
        
        const rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        rightTailLight.rotation.z = Math.PI / 2;
        rightTailLight.position.set(0.6, 0.4, -1.9);
        carGroup.add(rightTailLight);
        
        // Fényszórók pozicionálása
        this.headlights[0].position.set(-0.6, 0.4, 2);
        this.headlights[1].position.set(0.6, 0.4, 2);
        carGroup.add(this.headlights[0]);
        carGroup.add(this.headlights[1]);
        
        this.car = carGroup;
        this.scene.add(this.car);
    }
    
    createRoad() {
        const roadWidth = 20;
        const segmentLength = 10;
        const segments = 100;
        
        // Pálya adatok létrehozása térképhez
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 4; // 2 teljes kör
            const x = Math.sin(angle) * 30;
            const z = -i * segmentLength;
            
            this.trackData.segments.push({ x, z, angle });
            
            // Út szegmens
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
            const roadMaterial = new THREE.MeshLambertMaterial({ 
                color: i % 2 === 0 ? 0x444444 : 0x555555 
            });
            const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
            roadSegment.rotation.x = -Math.PI / 2;
            roadSegment.position.set(x, 0, z);
            roadSegment.receiveShadow = true;
            this.scene.add(roadSegment);
            this.road.push(roadSegment);
            
            // Középső vonal
            if (i % 4 < 2) {
                const lineGeometry = new THREE.PlaneGeometry(0.5, segmentLength);
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
            
            // Pozicionálás a pályán
            const segmentIndex = 10 + i * 15;
            const segment = this.trackData.segments[segmentIndex];
            opponentGroup.position.set(
                segment.x + (Math.random() - 0.5) * 10,
                0.5,
                segment.z
            );
            
            this.opponents.push({
                mesh: opponentGroup,
                speed: 100 + Math.random() * 50,
                segmentIndex: segmentIndex,
                lane: (Math.random() - 0.5) * 10
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
        
        // Pálya rajzolása
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 8;
        ctx.beginPath();
        
        this.trackData.segments.forEach((segment, index) => {
            const x = centerX + segment.x * scale;
            const y = centerY + segment.z * scale * 0.1;
            
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
        
        // Ellenfelek rajzolása
        ctx.fillStyle = '#ff0000';
        this.opponents.forEach(opponent => {
            const x = centerX + opponent.mesh.position.x * scale;
            const y = centerY + opponent.mesh.position.z * scale * 0.1;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Játékos autó rajzolása
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const playerX = centerX + this.car.position.x * scale;
        const playerY = centerY + this.car.position.z * scale * 0.1;
        
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
        
        // Iránytű
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
        ctx.stroke();
        
        // Észak jelölés
        ctx.fillStyle = '#ff6600';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('É', centerX, centerY - 85);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.updateCamera();
    }
    
    updateCamera() {
        switch (this.gameState.cameraMode) {
            case 0: // Hátsó nézet
                this.camera.position.set(0, 3, 8);
                this.camera.lookAt(this.car.position);
                break;
            case 1: // Cockpit nézet
                this.camera.position.set(0, 1.2, 1);
                this.camera.lookAt(new THREE.Vector3(0, 1, -10));
                break;
            case 2: // Felülnézet
                this.camera.position.set(0, 20, 5);
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
        // Gyorsítás
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.gameState.speed = Math.min(
                this.gameState.speed + this.gameState.acceleration,
                this.gameState.maxSpeed
            );
        } else {
            this.gameState.speed = Math.max(
                this.gameState.speed - this.gameState.deceleration * 0.5,
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
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.gameState.turnSpeed = Math.max(
                this.gameState.turnSpeed - 0.002,
                -this.gameState.maxTurnSpeed
            );
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.gameState.turnSpeed = Math.min(
                this.gameState.turnSpeed + 0.002,
                this.gameState.maxTurnSpeed
            );
        } else {
            this.gameState.turnSpeed *= 0.95;
        }
    }
    
    update() {
        // Autó mozgás
        this.gameState.rotation += this.gameState.turnSpeed;
        this.car.rotation.y = this.gameState.rotation;
        
        // Pozíció frissítés
        const speedFactor = this.gameState.speed * 0.01;
        this.car.position.x += Math.sin(this.gameState.rotation) * speedFactor;
        this.car.position.z -= Math.cos(this.gameState.rotation) * speedFactor;
        
        // Megtett távolság számítása
        this.gameState.distanceTraveled += speedFactor;
        
        // Kerekek forgatása
        this.wheels.forEach(wheel => {
            wheel.rotation.x += speedFactor * 0.1;
        });
        
        // Fényszórók frissítése
        this.headlights.forEach(light => {
            light.target.position.copy(this.car.position);
            light.target.position.z -= 10;
        });
        
        // Kamera követés
        if (this.gameState.cameraMode === 0) {
            const cameraOffset = new THREE.Vector3(0, 3, 8);
            cameraOffset.applyQuaternion(this.car.quaternion);
            this.camera.position.copy(this.car.position).add(cameraOffset);
            this.camera.lookAt(this.car.position);
        } else if (this.gameState.cameraMode === 1) {
            const cockpitOffset = new THREE.Vector3(0, 1.2, 1);
            cockpitOffset.applyQuaternion(this.car.quaternion);
            this.camera.position.copy(this.car.position).add(cockpitOffset);
            const lookTarget = this.car.position.clone();
            lookTarget.z -= 10;
            this.camera.lookAt(lookTarget);
        }
        
        // Ellenfelek frissítése
        this.updateOpponents();
        
        // Fokozat számítás
        this.gameState.gear = Math.floor(this.gameState.speed / 50) + 1;
        this.gameState.gear = Math.min(this.gameState.gear, 6);
        
        // Kör számítás
        const lapProgress = (this.gameState.distanceTraveled / this.trackData.totalLength) % 1;
        this.gameState.lap = Math.floor(this.gameState.distanceTraveled / this.trackData.totalLength) + 1;
        this.gameState.lap = Math.min(this.gameState.lap, this.gameState.totalLaps);
        
        // Minimap frissítése
        this.updateMinimap();
        
        // HUD frissítés
        this.updateHUD();
    }
    
    updateOpponents() {
        this.opponents.forEach(opponent => {
            opponent.mesh.position.z += (this.gameState.speed - opponent.speed) * 0.01;
            
            // Ha túl messze van, újrapozicionáljuk
            if (opponent.mesh.position.z > this.car.position.z + 50) {
                opponent.mesh.position.z = this.car.position.z - 200;
                const randomSegment = this.trackData.segments[Math.floor(Math.random() * this.trackData.segments.length)];
                opponent.mesh.position.x = randomSegment.x + (Math.random() - 0.5) * 10;
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
