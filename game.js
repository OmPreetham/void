class Car {
    constructor(isPlayer = false) {
        // Create main car body group
        this.mesh = new THREE.Group();
        
        // Health-based color system
        this.healthColors = {
            100: 0xffffff, // 100% - Pure white
            90: 0xeeeeee,  // 90-99% - Light gray
            80: 0xdddddd,  // 80-89% - Lighter gray
            70: 0xcccccc,  // 70-79% - Light medium gray
            60: 0xbbbbbb,  // 60-69% - Medium gray
            50: 0x999999,  // 50-59% - Darker medium gray
            40: 0x777777,  // 40-49% - Dark gray
            30: 0x555555,  // 30-39% - Darker gray
            20: 0x444444,  // 20-29% - Very dark gray
            10: 0x333333,  // 10-19% - Almost black
            0: 0x222222    // 0-9% - Nearly black
        };
        
        // Create stylish car design
        this.createCarBody();
        
        // Physics properties
        this.mesh.position.y = 0.5;
        this.speed = isPlayer ? 0 : 0.2 + Math.random() * 0.2; // Player starts stationary
        this.rotationSpeed = 0;
        this.maxSpeed = isPlayer ? 0.8 : 0.5;
        this.acceleration = 0.02;
        this.deceleration = 0.01;
        this.maxRotationSpeed = 0.05;
        this.isPlayer = isPlayer;
        this.aiChangeDirectionCounter = 0;
        
        // Enhanced collision properties
        this.radius = 2.5;
        this.mass = isPlayer ? 2.0 : 1.0;
        this.elasticity = 0.5; // Reduced bounce for more solid feel
        this.velocity = new THREE.Vector3();
        this.isColliding = false;
        this.collisionCooldown = 0;
        this.lastCollisionPoint = null;
        
        // Health and combat properties
        this.health = 100;
        this.isDestroyed = false;
        this.laserCooldown = 0;
        this.laserColor = isPlayer ? 0xffffff : 0xaaaaaa;
        this.lasers = [];
        this.shootSound = new Audio('data:audio/wav;base64,UklGRl9vAAAKAAAAIAAAACQAAAABACQAZGF0YT9vAAAAAAAAAA=='); // Empty audio for mobile
        
        // Random starting position for AI cars
        if (!isPlayer) {
            this.mesh.position.x = (Math.random() - 0.5) * 1000;
            this.mesh.position.z = (Math.random() - 0.5) * 1000;
            this.mesh.rotation.y = Math.random() * Math.PI * 2;
        }

        this.scene = null; // Reference to the game scene
    }

    setScene(scene) {
        this.scene = scene;
    }

    createCarBody() {
        // Get initial car color based on health
        const bodyColor = this.isPlayer ? this.getHealthColor() : 0x666666;
        
        // Main body frame with health-based color
        const bodyGeometry = new THREE.BoxGeometry(2.2, 0.6, 4);
        const bodyMaterial = new THREE.LineBasicMaterial({ 
            color: bodyColor, 
            linewidth: 2,
            transparent: true,
            opacity: 0.9
        });
        const bodyWireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(bodyGeometry),
            bodyMaterial
        );
        this.mesh.add(bodyWireframe);

        // Front section (hood) - sloped design
        const hoodGeometry = new THREE.BufferGeometry();
        const hoodVertices = new Float32Array([
            // Front slope
            -1.1, 0.3, -2.0,  // left front top
            1.1, 0.3, -2.0,   // right front top
            -1.1, 0.6, -1.0,  // left back top
            1.1, 0.6, -1.0,   // right back top
            -1.1, 0, -2.0,    // left front bottom
            1.1, 0, -2.0,     // right front bottom
        ]);
        hoodGeometry.setAttribute('position', new THREE.BufferAttribute(hoodVertices, 3));
        const hoodIndices = new Uint16Array([
            0, 1, 0, 2, 1, 3, 2, 3,  // top
            0, 4, 1, 5, 4, 5         // front connections
        ]);
        hoodGeometry.setIndex(new THREE.BufferAttribute(hoodIndices, 1));
        const hood = new THREE.LineSegments(hoodGeometry, bodyMaterial);
        this.mesh.add(hood);

        // Windshield
        const windshieldGeometry = new THREE.BufferGeometry();
        const windshieldVertices = new Float32Array([
            -1.0, 0.6, -1.0,  // bottom left
            1.0, 0.6, -1.0,   // bottom right
            -0.9, 1.2, 0,     // top left
            0.9, 1.2, 0       // top right
        ]);
        windshieldGeometry.setAttribute('position', new THREE.BufferAttribute(windshieldVertices, 3));
        const windshieldIndices = new Uint16Array([0, 1, 1, 3, 3, 2, 2, 0]);
        windshieldGeometry.setIndex(new THREE.BufferAttribute(windshieldIndices, 1));
        const windshield = new THREE.LineSegments(
            windshieldGeometry,
            new THREE.LineBasicMaterial({ 
                color: 0xeeeeee, // Brighter gray
                linewidth: 2,
                transparent: true,
                opacity: 0.8
            })
        );
        this.mesh.add(windshield);

        // Roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.2, 2);
        const roofWireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(roofGeometry),
            new THREE.LineBasicMaterial({ color: bodyColor, linewidth: 2 })
        );
        roofWireframe.position.set(0, 1.2, 0.5);
        this.mesh.add(roofWireframe);

        // Rear window (sloped)
        const rearWindowGeometry = new THREE.BufferGeometry();
        const rearWindowVertices = new Float32Array([
            -0.9, 1.2, 1.0,   // top left
            0.9, 1.2, 1.0,    // top right
            -1.0, 0.6, 2.0,   // bottom left
            1.0, 0.6, 2.0     // bottom right
        ]);
        rearWindowGeometry.setAttribute('position', new THREE.BufferAttribute(rearWindowVertices, 3));
        rearWindowGeometry.setIndex(new THREE.BufferAttribute(windshieldIndices, 1));
        const rearWindow = new THREE.LineSegments(
            rearWindowGeometry,
            new THREE.LineBasicMaterial({ color: 0xdddddd, linewidth: 2 }) // Light gray
        );
        this.mesh.add(rearWindow);

        // Wheels with better contrast
        const wheelPositions = [
            [-1.1, -0.2, -1.5], [1.1, -0.2, -1.5],  // Front wheels
            [-1.1, -0.2, 1.5], [1.1, -0.2, 1.5]     // Rear wheels
        ];

        wheelPositions.forEach(position => {
            // Wheel rim
            const rimGeometry = new THREE.CircleGeometry(0.4, 16);
            const rim = new THREE.LineSegments(
                new THREE.WireframeGeometry(rimGeometry),
                new THREE.LineBasicMaterial({ 
                    color: 0x999999, // Medium gray
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.9
                })
            );
            rim.rotation.y = Math.PI / 2;
            rim.position.set(...position);
            this.mesh.add(rim);

            // Wheel spokes
            const spokesGeometry = new THREE.BufferGeometry();
            const spokesVertices = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                spokesVertices.push(
                    0, 0, 0,
                    Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0
                );
            }
            spokesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spokesVertices, 3));
            const spokes = new THREE.LineSegments(
                spokesGeometry,
                new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 }) // Light gray
            );
            spokes.rotation.y = Math.PI / 2;
            spokes.position.set(...position);
            this.mesh.add(spokes);
        });

        // Enhanced headlights
        const headlightGeometry = new THREE.CircleGeometry(0.2, 8);
        const headlightMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 2,
            transparent: true,
            opacity: 1
        });
        [-0.8, 0.8].forEach(x => {
            const headlight = new THREE.LineSegments(
                new THREE.WireframeGeometry(headlightGeometry),
                headlightMaterial
            );
            headlight.position.set(x, 0.3, -2);
            headlight.rotation.y = Math.PI / 2;
            this.mesh.add(headlight);
        });

        // Enhanced taillights
        const taillightGeometry = new THREE.CircleGeometry(0.2, 8);
        const taillightMaterial = new THREE.LineBasicMaterial({ 
            color: 0x444444, // Darker gray
            linewidth: 2,
            transparent: true,
            opacity: 0.9
        });
        [-0.8, 0.8].forEach(x => {
            const taillight = new THREE.LineSegments(
                new THREE.WireframeGeometry(taillightGeometry),
                taillightMaterial
            );
            taillight.position.set(x, 0.3, 2);
            taillight.rotation.y = Math.PI / 2;
            this.mesh.add(taillight);
        });
    }

    getHealthColor() {
        const healthLevel = Math.floor(this.health / 10) * 10;
        return this.healthColors[healthLevel] || this.healthColors[0];
    }

    updateCarColor() {
        if (!this.isPlayer || this.isDestroyed) return;
        
        const newColor = this.getHealthColor();
        this.mesh.children.forEach(child => {
            if (child.material) {
                child.material.color.setHex(newColor);
            }
        });
    }

    checkCollision(otherCar) {
        const dx = this.mesh.position.x - otherCar.mesh.position.x;
        const dz = this.mesh.position.z - otherCar.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const minDistance = this.radius + otherCar.radius;
        
        if (distance < minDistance) {
            // Store collision point for visualization
            const collisionX = (this.mesh.position.x + otherCar.mesh.position.x) / 2;
            const collisionZ = (this.mesh.position.z + otherCar.mesh.position.z) / 2;
            this.lastCollisionPoint = { x: collisionX, z: collisionZ };
            otherCar.lastCollisionPoint = { x: collisionX, z: collisionZ };
            
            // Push cars apart to prevent passing through
            const overlap = minDistance - distance;
            const pushX = (dx / distance) * overlap * 0.5;
            const pushZ = (dz / distance) * overlap * 0.5;
            
            this.mesh.position.x += pushX;
            this.mesh.position.z += pushZ;
            otherCar.mesh.position.x -= pushX;
            otherCar.mesh.position.z -= pushZ;
            
            return true;
        }
        return false;
    }

    resolveCollision(otherCar) {
        if (this.collisionCooldown > 0 || otherCar.collisionCooldown > 0) return;

        // Calculate collision normal
        const dx = otherCar.mesh.position.x - this.mesh.position.x;
        const dz = otherCar.mesh.position.z - this.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        const nx = dx / distance;
        const nz = dz / distance;

        // Calculate relative velocity
        const relativeVelocityX = this.velocity.x - otherCar.velocity.x;
        const relativeVelocityZ = this.velocity.z - otherCar.velocity.z;

        // Calculate impulse
        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityZ * nz;
        if (velocityAlongNormal > 0) return;

        const restitution = this.elasticity;
        const impulseMagnitude = -(1 + restitution) * velocityAlongNormal;
        const totalMass = this.mass + otherCar.mass;
        const impulse = impulseMagnitude / totalMass;

        // Apply stronger impulse
        const impulseFactor = 1.5; // Increased impact force
        this.velocity.x -= (impulse * otherCar.mass * nx * impulseFactor);
        this.velocity.z -= (impulse * otherCar.mass * nz * impulseFactor);
        otherCar.velocity.x += (impulse * this.mass * nx * impulseFactor);
        otherCar.velocity.z += (impulse * this.mass * nz * impulseFactor);

        // Set collision flags and longer cooldown
        this.isColliding = true;
        otherCar.isColliding = true;
        this.collisionCooldown = 30;
        otherCar.collisionCooldown = 30;

        // More dramatic rotation on collision
        const collisionAngle = Math.atan2(dz, dx);
        this.rotationSpeed = (collisionAngle - this.mesh.rotation.y) * 0.2;
        otherCar.rotationSpeed = (collisionAngle - otherCar.mesh.rotation.y) * 0.2;

        // Significant speed reduction on collision
        this.speed *= 0.3;
        otherCar.speed *= 0.3;
    }

    shootLaser() {
        if (this.laserCooldown > 0) return;
        
        // Create enhanced laser with trail effect
        const laserGroup = new THREE.Group();
        
        // Main laser beam
        const laserGeometry = new THREE.BoxGeometry(0.2, 0.2, 3);
        const laserMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial);
        laserMesh.position.z = 0;
        laserGroup.add(laserMesh);
        
        // Add laser trail for better visibility
        for (let i = 1; i <= 3; i++) {
            const trailGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.5);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7 - (i * 0.2)
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.z = -i * 0.4;
            laserGroup.add(trail);
        }
        
        // Position and orient the laser
        const direction = new THREE.Vector3();
        this.mesh.getWorldDirection(direction);
        
        const position = this.mesh.position.clone();
        position.y += 0.5; // Adjust height
        laserGroup.position.copy(position);
        laserGroup.quaternion.copy(this.mesh.quaternion);
        
        this.scene.add(laserGroup);
        
        // Calculate velocity based on direction - increased speed
        const velocity = direction.multiplyScalar(3);
        
        this.lasers.push({
            mesh: laserGroup,
            velocity: velocity,
            lifetime: 30
        });

        this.laserCooldown = 10; // Faster shooting
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        if (this.isPlayer) {
            this.updateCarColor();
        }

        if (this.health <= 0 && !this.isDestroyed) {
            this.isDestroyed = true;
            this.createBrokenEffect();
        }
    }

    createBrokenEffect() {
        // Break the car into pieces
        const pieces = [];
        const pieceCount = 8;
        
        // Create broken pieces
        for (let i = 0; i < pieceCount; i++) {
            const pieceGeometry = new THREE.BoxGeometry(
                0.5 + Math.random() * 0.5,
                0.2 + Math.random() * 0.3,
                0.5 + Math.random() * 0.5
            );
            
            const pieceMaterial = new THREE.LineBasicMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.5
            });
            
            const piece = new THREE.LineSegments(
                new THREE.WireframeGeometry(pieceGeometry),
                pieceMaterial
            );

            // Position pieces around the car
            const angle = (i / pieceCount) * Math.PI * 2;
            const radius = 1 + Math.random();
            piece.position.set(
                this.mesh.position.x + Math.cos(angle) * radius,
                0.5 + Math.random(),
                this.mesh.position.z + Math.sin(angle) * radius
            );

            // Add random rotation
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            if (this.scene) {
                this.scene.add(piece);
                pieces.push(piece);
            }
        }

        // Add smoke effect
        const smokeParticles = [];
        const smokeCount = 20;
        
        for (let i = 0; i < smokeCount; i++) {
            const smokeGeometry = new THREE.CircleGeometry(0.2 + Math.random() * 0.3, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x222222,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.2
            });
            
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.copy(this.mesh.position);
            smoke.position.y = 0.5 + Math.random();
            
            if (this.scene) {
                this.scene.add(smoke);
                smokeParticles.push(smoke);
            }
        }

        // Animate smoke and pieces
        const animateDebris = () => {
            pieces.forEach((piece, index) => {
                piece.rotation.x += 0.02;
                piece.rotation.y += 0.03;
                piece.position.y *= 0.98; // Slowly fall
                piece.material.opacity *= 0.99; // Fade out
            });

            smokeParticles.forEach((smoke, index) => {
                smoke.position.y += 0.02;
                smoke.scale.multiplyScalar(1.02);
                smoke.material.opacity *= 0.98;
            });

            // Remove pieces and smoke when they fade out
            if (pieces[0].material.opacity > 0.01) {
                requestAnimationFrame(animateDebris);
            } else {
                pieces.forEach(piece => this.scene.remove(piece));
                smokeParticles.forEach(smoke => this.scene.remove(smoke));
            }
        };

        animateDebris();

        // Hide the original car mesh
        this.mesh.visible = false;
    }

    update(keys = null) {
        if (this.isDestroyed) {
            this.speed = 0;
            this.rotationSpeed = 0;
            return;
        }

        if (this.collisionCooldown > 0) this.collisionCooldown--;
        if (this.collisionCooldown === 0) {
            this.isColliding = false;
            this.lastCollisionPoint = null;
        }

        if (this.isPlayer && keys) {
            // Player controls - only move when UP is pressed
            if (keys.ArrowUp) {
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            } else if (keys.ArrowDown) {
                this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed);
            } else {
                // Apply stronger deceleration when not accelerating
                if (Math.abs(this.speed) < this.deceleration) {
                    this.speed = 0;
                } else {
                    this.speed -= Math.sign(this.speed) * this.deceleration * 2;
                }
            }

            // Switched left and right controls
            if (keys.ArrowRight) this.rotationSpeed = -this.maxRotationSpeed;
            else if (keys.ArrowLeft) this.rotationSpeed = this.maxRotationSpeed;
            else this.rotationSpeed = 0;
        } else {
            // AI behavior
            this.aiChangeDirectionCounter++;
            if (this.aiChangeDirectionCounter > 100) {
                this.rotationSpeed = (Math.random() - 0.5) * this.maxRotationSpeed;
                this.aiChangeDirectionCounter = 0;
            }
        }

        // Apply movement with improved physics
        this.mesh.rotation.y += this.rotationSpeed;
        
        // Update velocity based on car's direction and speed
        const targetVelocityX = Math.sin(this.mesh.rotation.y) * this.speed;
        const targetVelocityZ = Math.cos(this.mesh.rotation.y) * this.speed;
        
        // Smoother velocity transition
        this.velocity.x += (targetVelocityX - this.velocity.x) * 0.1;
        this.velocity.z += (targetVelocityZ - this.velocity.z) * 0.1;

        // Apply velocity to position
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.z += this.velocity.z;

        // Stronger velocity decay during collisions
        const decayFactor = this.isColliding ? 0.8 : 0.95;
        this.velocity.multiplyScalar(decayFactor);

        // Update laser cooldown
        if (this.laserCooldown > 0) this.laserCooldown--;

        // Shoot laser on spacebar for player
        if (this.isPlayer && keys && keys.Space && this.laserCooldown === 0) {
            this.shootLaser();
        }

        // Random shooting for AI
        if (!this.isPlayer && Math.random() < 0.01) {
            this.shootLaser();
        }

        // Update lasers with cleanup
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.mesh.position.add(laser.velocity);
            laser.lifetime--;
            if (laser.lifetime <= 0) {
                this.scene.remove(laser.mesh);
                this.lasers.splice(i, 1);
            }
        }
    }

    createHitEffect(position) {
        const rings = [];
        const numRings = 3;
        
        for (let i = 0; i < numRings; i++) {
            const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            ring.position.copy(position);
            ring.rotation.x = Math.PI / 2; // Flat on the ground
            
            this.scene.add(ring);
            rings.push(ring);
        }
        
        let scale = 0.1;
        const expandRings = setInterval(() => {
            scale += 0.1;
            
            rings.forEach((ring, i) => {
                ring.scale.set(scale + i * 0.5, scale + i * 0.5, 1);
                ring.material.opacity = 0.7 - (scale / 3);
            });
            
            if (scale >= 2) {
                clearInterval(expandRings);
                rings.forEach(ring => this.scene.remove(ring));
            }
        }, 30);
    }
}

class Game {
    constructor() {
        this.initGame();
    }

    initGame() {
        this.score = 0;
        this.gameOver = false;
        this.initThree();
        this.setupEventListeners();
        this.animate();
    }

    initThree() {
        // Scene setup with pure black background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera setup
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 40;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            1000
        );
        this.camera.position.set(0, 20, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.z = Math.PI;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);
        
        // Create enhanced ground design
        this.createEnhancedGround();
        
        // Create player car
        this.car = new Car(true);
        this.car.setScene(this.scene);
        this.scene.add(this.car.mesh);

        // Create more AI cars (increased to 50)
        this.aiCars = [];
        for (let i = 0; i < 50; i++) {
            const aiCar = new Car(false);
            aiCar.setScene(this.scene);
            this.aiCars.push(aiCar);
            this.scene.add(aiCar.mesh);
        }
        
        // Controls
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = frustumSize * aspect / -2;
            this.camera.right = frustumSize * aspect / 2;
            this.camera.top = frustumSize / 2;
            this.camera.bottom = frustumSize / -2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createEnhancedGround() {
        // Create smaller glass-like grid effect with better contrast
        const gridSize = 1000;
        const cellSize = 5;
        const gridGeometry = new THREE.BufferGeometry();
        const gridVertices = [];
        
        // Create hazard zones array
        this.hazardZones = [];
        
        // Create smaller squares for glass effect
        for (let x = -gridSize/2; x <= gridSize/2; x += cellSize) {
            for (let z = -gridSize/2; z <= gridSize/2; z += cellSize) {
                // Randomly make some cells hazardous (about 5% of cells)
                const isHazard = Math.random() < 0.02;
                
                if (isHazard) {
                    // Create hazard cell
                    const hazardGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
                    const hazardMaterial = new THREE.MeshBasicMaterial({
                        color: 0x444444,
                        transparent: true,
                        opacity: 0.4,
                        side: THREE.DoubleSide
                    });
                    const hazardZone = new THREE.Mesh(hazardGeometry, hazardMaterial);
                    hazardZone.rotation.x = Math.PI / 2;
                    hazardZone.position.set(x + cellSize/2, 0.15, z + cellSize/2);
                    
                    this.scene.add(hazardZone);
                    this.hazardZones.push({
                        mesh: hazardZone,
                        size: cellSize/2,
                        damage: 0.2 // Reduced damage per frame
                    });
                }

                // Square outline
                gridVertices.push(
                    x, 0.1, z,
                    x + cellSize, 0.1, z,
                    x + cellSize, 0.1, z,
                    x + cellSize, 0.1, z + cellSize,
                    x + cellSize, 0.1, z + cellSize,
                    x, 0.1, z + cellSize,
                    x, 0.1, z + cellSize,
                    x, 0.1, z
                );
            }
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.6
        });
        const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
        this.scene.add(grid);

        // Enhanced glow points
        const pointsGeometry = new THREE.BufferGeometry();
        const pointsVertices = [];
        for (let x = -gridSize/2; x <= gridSize/2; x += cellSize) {
            for (let z = -gridSize/2; z <= gridSize/2; z += cellSize) {
                pointsVertices.push(x, 0.1, z);
            }
        }
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices, 3));
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0x555555,
            size: 2,
            transparent: true,
            opacity: 0.5
        });
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        this.scene.add(points);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver && event.code === 'Space') {
                this.restartGame();
                return;
            }

            if (event.code === 'Space') {
                this.keys.Space = true;
            } else if (this.keys.hasOwnProperty(event.code)) {
                this.keys[event.code] = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                this.keys.Space = false;
            } else if (this.keys.hasOwnProperty(event.code)) {
                this.keys[event.code] = false;
            }
        });

        // Steering overlay controls
        const overlay = document.getElementById('steeringOverlay');
        let startX = 0;
        let isDragging = false;

        const handleSteering = (e) => {
            if (!isDragging) return;
            
            let currentX;
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
            } else {
                currentX = e.clientX;
            }
            
            const deltaX = currentX - startX;
            const screenWidth = window.innerWidth;
            const steeringAmount = (deltaX / screenWidth) * 3; // Adjust sensitivity

            // Update steering based on touch position
            this.keys.ArrowLeft = steeringAmount < -0.1;
            this.keys.ArrowRight = steeringAmount > 0.1;
        };

        const startSteering = (e) => {
            isDragging = true;
            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX;
            } else {
                startX = e.clientX;
            }
        };

        const endSteering = () => {
            isDragging = false;
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
        };

        // Touch events for steering overlay
        overlay.addEventListener('touchstart', startSteering);
        overlay.addEventListener('touchmove', handleSteering);
        overlay.addEventListener('touchend', endSteering);
        
        // Mouse events for steering overlay (desktop testing)
        overlay.addEventListener('mousedown', startSteering);
        overlay.addEventListener('mousemove', handleSteering);
        overlay.addEventListener('mouseup', endSteering);
        overlay.addEventListener('mouseleave', endSteering);

        // Auto-drive toggle
        const autoBtn = document.querySelector('.auto-drive');
        this.isAutoDriving = false;
        
        autoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.isAutoDriving = !this.isAutoDriving;
            autoBtn.classList.toggle('active');
            this.keys.ArrowUp = this.isAutoDriving;
        });

        // Shoot button
        const shootBtn = document.querySelector('.shoot-btn');
        
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.Space = true;
        });

        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.Space = false;
        });

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.touch-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    restartGame() {
        // Create restart effect
        this.createRestartEffect();

        // Remove all existing cars and lasers
        this.scene.remove(this.car.mesh);
        this.aiCars.forEach(car => {
            this.scene.remove(car.mesh);
            car.lasers.forEach(laser => this.scene.remove(laser.mesh));
        });

        // Reset game state
        this.gameOver = false;
        this.score = 0;

        // Create new player car with spawn effect
        this.car = new Car(true);
        this.car.setScene(this.scene);
        this.scene.add(this.car.mesh);
        this.createSpawnEffect(this.car.mesh.position);

        // Create new AI cars with spawn effects
        this.aiCars = [];
        for (let i = 0; i < 50; i++) {
            const aiCar = new Car(false);
            aiCar.setScene(this.scene);
            this.aiCars.push(aiCar);
            this.scene.add(aiCar.mesh);
            this.createSpawnEffect(aiCar.mesh.position);
        }
    }

    createRestartEffect() {
        // Create expanding grid pulse
        const pulseGeometry = new THREE.RingGeometry(0, 1000, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.rotation.x = Math.PI / 2;
        pulse.scale.set(0.1, 0.1, 0.1);
        this.scene.add(pulse);

        // Animate pulse
        let scale = 0.1;
        const expandPulse = setInterval(() => {
            scale += 0.1;
            pulse.scale.set(scale, scale, scale);
            pulse.material.opacity -= 0.02;

            if (scale >= 2) {
                clearInterval(expandPulse);
                this.scene.remove(pulse);
            }
        }, 20);
    }

    createSpawnEffect(position) {
        // Create spawn ring effect
        const ringCount = 5;
        const rings = [];
        
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            ring.rotation.x = Math.PI / 2;
            ring.scale.set(0.1, 0.1, 0.1);
            this.scene.add(ring);
            rings.push(ring);
        }

        // Animate spawn rings
        let scale = 0.1;
        const expandRings = setInterval(() => {
            scale += 0.2;
            rings.forEach((ring, index) => {
                ring.scale.set(scale * (index + 1), scale * (index + 1), scale * (index + 1));
                ring.material.opacity -= 0.05;
            });

            if (scale >= 2) {
                clearInterval(expandRings);
                rings.forEach(ring => this.scene.remove(ring));
            }
        }, 30);
    }

    checkCollisions() {
        // Check laser collisions with improved visual feedback and more accurate detection
        this.aiCars.concat([this.car]).forEach(car => {
            for (let i = car.lasers.length - 1; i >= 0; i--) {
                const laser = car.lasers[i];
                let hitDetected = false;
                
                this.aiCars.concat([this.car]).some(target => {
                    if (car === target || target.isDestroyed || hitDetected) return false;
                    
                    // Get laser position and direction
                    const laserPos = laser.mesh.position.clone();
                    const laserDir = laser.velocity.clone().normalize();
                    
                    // Calculate distance from laser to target
                    const targetPos = target.mesh.position.clone();
                    targetPos.y = laserPos.y; // Adjust for height difference
                    
                    // Vector from laser to target
                    const toTarget = targetPos.clone().sub(laserPos);
                    
                    // Calculate closest point of approach
                    const dotProduct = toTarget.dot(laserDir);
                    const closestPoint = laserPos.clone().add(laserDir.clone().multiplyScalar(dotProduct));
                    
                    // Distance from closest point to target center
                    const distance = closestPoint.distanceTo(targetPos);
                    
                    // Check if laser is pointing toward the target
                    const isFacing = dotProduct > 0;
                    
                    // Check if laser is close enough to hit
                    const hitDistance = 2.5; // Increased hit box size
                    
                    if (distance < hitDistance && isFacing) {
                        // Create hit effect at the impact point
                        this.createHitEffect(closestPoint);
                        
                        // Apply damage to target
                        target.takeDamage(25);
                        
                        // Remove laser
                        this.scene.remove(laser.mesh);
                        car.lasers.splice(i, 1);
                        
                        hitDetected = true;
                        return true; // Stop iteration after hit
                    }
                    
                    return false;
                });
            }
        });

        // Check player collision with AI cars
        this.aiCars.forEach(aiCar => {
            if (this.car.checkCollision(aiCar)) {
                this.car.resolveCollision(aiCar);
            }
        });

        // Check AI cars collisions with each other
        for (let i = 0; i < this.aiCars.length; i++) {
            for (let j = i + 1; j < this.aiCars.length; j++) {
                if (this.aiCars[i].checkCollision(this.aiCars[j])) {
                    this.aiCars[i].resolveCollision(this.aiCars[j]);
                }
            }
        }
    }

    checkHazardZones() {
        if (!this.car || this.car.isDestroyed) return;

        this.hazardZones.forEach(zone => {
            const dx = this.car.mesh.position.x - zone.mesh.position.x;
            const dz = this.car.mesh.position.z - zone.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < zone.size) {
                // Car is in hazard zone
                this.car.takeDamage(zone.damage);
                
                // Visual feedback
                zone.mesh.material.opacity = 0.6;
                setTimeout(() => {
                    zone.mesh.material.opacity = 0.4;
                }, 100);
            }
        });
    }

    update() {
        // Check if player car is destroyed
        if (this.car.isDestroyed && !this.gameOver) {
            this.gameOver = true;
            // Create "GAME OVER" message with enhanced style
            const message = document.createElement('div');
            message.style.position = 'fixed';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.color = '#ffffff';
            message.style.fontFamily = 'monospace';
            message.style.fontSize = '36px';
            message.style.textAlign = 'center';
            message.style.letterSpacing = '4px';
            message.style.textShadow = '0 0 10px rgba(255,255,255,0.5)';
            message.style.animation = 'pulse 2s infinite';
            message.innerHTML = 'GAME OVER<br>PRESS SPACE TO RESTART';
            message.id = 'restart-message';

            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(message);
            return;
        }

        // Remove restart message if game is active
        if (!this.gameOver) {
            const message = document.getElementById('restart-message');
            if (message) {
                document.body.removeChild(message);
            }
        }

        // Only update game if not game over
        if (!this.gameOver) {
            // Update player car
            this.car.update(this.keys);
            
            // Update AI cars
            this.aiCars.forEach(aiCar => aiCar.update());

            // Check and resolve collisions
            this.checkCollisions();
            
            // Check hazard zones
            this.checkHazardZones();
            
            // Update camera to follow player
            this.camera.position.x = this.car.mesh.position.x;
            this.camera.position.z = this.car.mesh.position.z;
            
            // Update score
            this.score++;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 