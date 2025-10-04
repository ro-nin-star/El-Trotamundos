class Lotus3DRacing {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.road = [];
        this.opponents = [];
        
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
            cameraMode: 0 // 0: hátsó, 1: cockpit, 2: felülnézet
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
        
        // Autó test
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.6, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        body.castShadow = true;
        carGroup.add(body);
        
        // Tetö
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.4, 2);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 0.8, -0.5);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Kerekek
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        const wheelPositions = [
            [-0.9, 0, 1.3],   // bal első
            [0.9, 0, 1.3],    // jobb első
            [-0.9, 0, -1.3],  // bal hátsó
            [0.9, 0, -1.3]    // jobb hátsó
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
        
        for (let i = 0; i < segments; i++) {
            // Út szegmens
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
            const roadMaterial = new THREE.MeshLambertMaterial({ 
                color: i % 2 === 0 ? 0x444444 : 0x555555 
            });
            const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
            roadSegment.rotation.x = -Math.PI / 2;
            roadSegment.position.set(0, 0, -i * segmentLength);
            roadSegment.receiveShadow = true;
            this.scene.add(roadSegment);
            this.road.push(roadSegment);
            
            // Középső vonal
            if (i % 4 < 2) {
                const lineGeometry = new THREE.PlaneGeometry(0.5, segmentLength);
                const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.set(0, 0.01, -i * segmentLength);
                this.scene.add(line);
            }
            
            // Szélső vonalak
            [-roadWidth/2, roadWidth/2].forEach(x => {
                const borderGeometry = new THREE.PlaneGeometry(1, segmentLength);
                const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const border = new THREE.Mesh(borderGeometry, borderMaterial);
                border.rotation.x = -Math.PI / 2;
                border.position.set(x, 0.01, -i * segmentLength);
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
                -20 - i * 30
            );
            
            this.opponents.push({
                mesh: opponentGroup,
                speed: 100 + Math.random() * 50,
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
                side * (15 + Math.random() * 20),
                4,
                -Math.random() * 1000
            );
            tree.castShadow = true;
            this.scene.add(tree);
        }
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
        
        // HUD frissítés
        this.updateHUD();
    }
    
    updateOpponents() {
        this.opponents.forEach(opponent => {
            opponent.mesh.position.z += (this.gameState.speed - opponent.speed) * 0.01;
            
            // Ha túl messze van, újrapozicionáljuk
            if (opponent.mesh.position.z > this.car.position.z + 50) {
                opponent.mesh.position.z = this.car.position.z - 200;
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
