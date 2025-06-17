import * as THREE from 'three';

interface AlienEnemy {
  mesh: THREE.Mesh | THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  lastAttack: number;
  type: 'scout' | 'warrior' | 'heavy' | 'flyer';
  id: string;
  destroyed: boolean;
  attackDamage: number;
  detectionRange: number;
  attackRange: number;
  behavior: 'patrol' | 'chase' | 'attack' | 'retreat';
  patrolTarget?: THREE.Vector3;
  lastPosition: THREE.Vector3;
  flyingHeight?: number;
  circleRadius?: number;
  circleAngle?: number;
}

interface EnemyWave {
  enemies: number;
  types: ('scout' | 'warrior' | 'heavy' | 'flyer')[];
  spawnDelay: number;
  completed: boolean;
}

export class AlienEnemyManager {
  private scene: THREE.Scene;
  private enemies: AlienEnemy[] = [];
  private enemyCount: number = 0;
  private waves: EnemyWave[] = [];
  private currentWave: number = 0;
  private waveTimer: number = 0;
  private spawnTimer: number = 0;
  private enemySpawners: THREE.Vector3[] = [];
  private motherShip?: THREE.Group;
  private terrainHeightFunction: ((x: number, z: number) => number) | null = null;
  private loader: THREE.GLTFLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loader = new THREE.GLTFLoader();
    this.createMotherShip();
    this.setupEnemySpawners();
    this.initializeWaves();
  }

  public setTerrainHeightFunction(heightFunction: (x: number, z: number) => number): void {
    this.terrainHeightFunction = heightFunction;
  }

  private createMotherShip(): void {
    const shipGroup = new THREE.Group();
    
    // Main hull - larger and more imposing
    const hullGeometry = new THREE.CylinderGeometry(15, 20, 8, 8);
    const hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      emissive: 0x660066,
      shininess: 100
    });
    
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.x = Math.PI / 2;
    shipGroup.add(hull);

    // Command tower
    const towerGeometry = new THREE.CylinderGeometry(5, 8, 12, 6);
    const tower = new THREE.Mesh(towerGeometry, hullMaterial);
    tower.position.set(0, 6, 0);
    shipGroup.add(tower);

    // Engine glows - more prominent
    for (let i = 0; i < 6; i++) {
      const engineGeometry = new THREE.CylinderGeometry(2, 3, 4, 8);
      const engineMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3366,
        transparent: true,
        opacity: 0.9
      });
      
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      const angle = (i / 6) * Math.PI * 2;
      engine.position.set(
        Math.cos(angle) * 18,
        -3,
        Math.sin(angle) * 18
      );
      shipGroup.add(engine);
    }

    // Weapon turrets - more menacing
    for (let i = 0; i < 8; i++) {
      const turretGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const turretMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        emissive: 0x440044
      });
      
      const turret = new THREE.Mesh(turretGeometry, turretMaterial);
      const angle = (i / 8) * Math.PI * 2;
      turret.position.set(
        Math.cos(angle) * 12,
        Math.random() * 6 - 3,
        Math.sin(angle) * 12
      );
      shipGroup.add(turret);
    }

    // Add pulsing energy core
    const coreGeometry = new THREE.SphereGeometry(3, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 0, 0);
    shipGroup.add(core);

    // Position the mothership high in the sky
    shipGroup.position.set(0, 120, 0);
    shipGroup.rotation.y = Math.PI / 4;
    
    this.motherShip = shipGroup;
    this.scene.add(shipGroup);
  }

  private setupEnemySpawners(): void {
    // Create spawn points around the map
    const spawnPoints = [
      new THREE.Vector3(50, 5, 50),
      new THREE.Vector3(-50, 5, 50),
      new THREE.Vector3(50, 5, -50),
      new THREE.Vector3(-50, 5, -50),
      new THREE.Vector3(0, 5, 80),
      new THREE.Vector3(0, 5, -80),
      new THREE.Vector3(80, 5, 0),
      new THREE.Vector3(-80, 5, 0)
    ];

    spawnPoints.forEach(point => {
      this.enemySpawners.push(point);
      this.createSpawnPortal(point);
    });
  }

  private createSpawnPortal(position: THREE.Vector3): void {
    const portalGroup = new THREE.Group();
    
    // Portal ring
    const ringGeometry = new THREE.RingGeometry(3, 4, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa66ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    portalGroup.add(ring);

    // Portal energy
    const energyGeometry = new THREE.PlaneGeometry(6, 6);
    const energyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          float ripple = sin(dist * 20.0 - time * 5.0) * 0.5 + 0.5;
          float fade = 1.0 - smoothstep(0.0, 0.5, dist);
          
          vec3 color = mix(vec3(0.7, 0.4, 1.0), vec3(1.0, 0.6, 0.9), ripple);
          float alpha = fade * 0.8;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const energy = new THREE.Mesh(energyGeometry, energyMaterial);
    energy.rotation.x = Math.PI / 2;
    portalGroup.add(energy);

    // Adjust portal position to terrain height
    const terrainHeight = this.getTerrainHeightAtPosition(position.x, position.z);
    portalGroup.position.set(position.x, terrainHeight + 0.5, position.z);
    this.scene.add(portalGroup);
  }

  private initializeWaves(): void {
    this.waves = [
      // Wave 1: Scout wave
      {
        enemies: 8,
        types: ['scout', 'scout', 'scout', 'warrior'],
        spawnDelay: 2,
        completed: false
      },
      // Wave 2: Mixed assault
      {
        enemies: 12,
        types: ['scout', 'warrior', 'warrior', 'heavy'],
        spawnDelay: 1.5,
        completed: false
      },
      // Wave 3: Heavy assault
      {
        enemies: 15,
        types: ['warrior', 'heavy', 'flyer', 'heavy'],
        spawnDelay: 1,
        completed: false
      },
      // Wave 4: Air superiority
      {
        enemies: 20,
        types: ['flyer', 'flyer', 'warrior', 'heavy'],
        spawnDelay: 0.8,
        completed: false
      },
      // Wave 5: Final assault
      {
        enemies: 25,
        types: ['scout', 'warrior', 'heavy', 'flyer'],
        spawnDelay: 0.5,
        completed: false
      }
    ];
  }

  public spawnWave(waveNumber?: number): void {
    const wave = waveNumber !== undefined ? this.waves[waveNumber] : this.waves[this.currentWave];
    if (!wave || wave.completed) return;

    for (let i = 0; i < wave.enemies; i++) {
      setTimeout(() => {
        const enemyType = wave.types[Math.floor(Math.random() * wave.types.length)];
        this.spawnEnemy(enemyType);
      }, i * wave.spawnDelay * 1000);
    }

    wave.completed = true;
    this.currentWave++;
  }

  private spawnEnemy(type: 'scout' | 'warrior' | 'heavy' | 'flyer'): void {
    const enemy = this.createEnemyMesh(type);
    
    // Choose random spawn point
    const spawnPoint = this.enemySpawners[Math.floor(Math.random() * this.enemySpawners.length)];
    
    // Position enemy on terrain with proper height offset
    const terrainHeight = this.getTerrainHeightAtPosition(spawnPoint.x, spawnPoint.z);
    const heightOffset = this.getEnemyHeightOffset(type);
    
    if (type === 'flyer') {
      // Flying enemies start at a higher altitude and circle around
      enemy.mesh.position.set(spawnPoint.x, terrainHeight + 15, spawnPoint.z);
      enemy.flyingHeight = 15 + Math.random() * 10; // Random height between 15-25
      enemy.circleRadius = 8 + Math.random() * 12; // Random circle radius 8-20
      enemy.circleAngle = Math.random() * Math.PI * 2; // Random starting angle
    } else {
      enemy.mesh.position.set(spawnPoint.x, terrainHeight + heightOffset, spawnPoint.z);
    }
    
    enemy.lastPosition = enemy.mesh.position.clone();

    // Set initial patrol target for ground enemies
    if (type !== 'flyer') {
      enemy.patrolTarget = new THREE.Vector3(
        spawnPoint.x + (Math.random() - 0.5) * 40,
        terrainHeight,
        spawnPoint.z + (Math.random() - 0.5) * 40
      );
    }

    // Mark as enemy for collision detection
    enemy.mesh.userData.isEnemy = true;

    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
  }

  private getEnemyHeightOffset(type: 'scout' | 'warrior' | 'heavy' | 'flyer'): number {
    switch (type) {
      case 'scout': return 1.0; // Ground spider height
      case 'warrior': return 1.5; // Larger ground spider
      case 'heavy': return 2.0; // Biggest ground spider
      case 'flyer': return 15; // Flying height
      default: return 1;
    }
  }

  private getTerrainHeightAtPosition(x: number, z: number): number {
    if (this.terrainHeightFunction) {
      return this.terrainHeightFunction(x, z);
    }
    return 0; // Default ground level
  }

  private createEnemyMesh(type: 'scout' | 'warrior' | 'heavy' | 'flyer'): AlienEnemy {
    let mesh: THREE.Mesh | THREE.Group;
    let health: number;
    let speed: number;
    let attackDamage: number;
    let detectionRange: number;
    let attackRange: number;

    // Create placeholder meshes that will be replaced with actual models
    switch (type) {
      case 'scout':
        // Will be replaced with arachnid_2.0.glb
        mesh = this.createPlaceholderSpider(0.8, 0xff8866);
        health = 50;
        speed = 12;
        attackDamage = 15;
        detectionRange = 25;
        attackRange = 8;
        break;
      
      case 'warrior':
        // Will be replaced with cyborg_spider.glb
        mesh = this.createPlaceholderSpider(1.2, 0xff6666);
        health = 100;
        speed = 8;
        attackDamage = 25;
        detectionRange = 20;
        attackRange = 6;
        break;
      
      case 'heavy':
        // Will be replaced with cyborg_spider.glb (larger scale)
        mesh = this.createPlaceholderSpider(1.8, 0xaa66ff);
        health = 200;
        speed = 4;
        attackDamage = 40;
        detectionRange = 15;
        attackRange = 10;
        break;
      
      case 'flyer':
        // Will be replaced with arachnid_opt.glb
        mesh = this.createPlaceholderFlyer(1.0, 0x66ffaa);
        health = 75;
        speed = 15;
        attackDamage = 20;
        detectionRange = 30;
        attackRange = 12;
        break;
    }

    // Try to load the actual model (will fail silently until models are added)
    this.loadEnemyModel(type, mesh);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const enemy: AlienEnemy = {
      mesh,
      health,
      maxHealth: health,
      speed,
      lastAttack: 0,
      type,
      id: `enemy_${this.enemyCount++}`,
      destroyed: false,
      attackDamage,
      detectionRange,
      attackRange,
      behavior: 'patrol',
      lastPosition: new THREE.Vector3()
    };

    mesh.userData = { id: enemy.id };
    
    return enemy;
  }

  private createPlaceholderSpider(scale: number, color: number): THREE.Group {
    const group = new THREE.Group();
    
    // Spider body
    const bodyGeometry = new THREE.SphereGeometry(1 * scale, 8, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.2)
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Spider legs
    for (let i = 0; i < 8; i++) {
      const legGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, 2 * scale, 6);
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      const side = i < 4 ? 1 : -1;
      
      leg.position.set(
        Math.cos(angle) * 1.5 * scale,
        -0.5 * scale,
        Math.sin(angle) * 1.5 * scale
      );
      leg.rotation.z = side * Math.PI / 6;
      group.add(leg);
    }

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15 * scale, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    
    for (let i = 0; i < 4; i++) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      const angle = (i / 4) * Math.PI * 2;
      eye.position.set(
        Math.cos(angle) * 0.8 * scale,
        0.3 * scale,
        Math.sin(angle) * 0.8 * scale
      );
      group.add(eye);
    }

    group.scale.setScalar(scale);
    return group;
  }

  private createPlaceholderFlyer(scale: number, color: number): THREE.Group {
    const group = new THREE.Group();
    
    // Flying creature body
    const bodyGeometry = new THREE.SphereGeometry(1 * scale, 8, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.2)
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1.5, 0.8, 1);
    group.add(body);

    // Wings
    for (let i = 0; i < 4; i++) {
      const wingGeometry = new THREE.PlaneGeometry(2 * scale, 1 * scale);
      const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const wing = new THREE.Mesh(wingGeometry, wingMaterial);
      const side = i < 2 ? 1 : -1;
      const front = i % 2 === 0 ? 1 : -1;
      
      wing.position.set(side * 1.5 * scale, 0, front * 0.5 * scale);
      wing.rotation.y = side * Math.PI / 6;
      wing.rotation.z = side * Math.PI / 8;
      group.add(wing);
    }

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.3 * scale, 2 * scale, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, -2 * scale);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.2 * scale, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    leftEye.position.set(-0.5 * scale, 0.3 * scale, 0.8 * scale);
    rightEye.position.set(0.5 * scale, 0.3 * scale, 0.8 * scale);
    
    group.add(leftEye);
    group.add(rightEye);

    group.scale.setScalar(scale);
    return group;
  }

  private loadEnemyModel(type: 'scout' | 'warrior' | 'heavy' | 'flyer', placeholder: THREE.Mesh | THREE.Group): void {
    let modelPath: string;
    
    switch (type) {
      case 'scout':
        modelPath = '/models/arachnid_2.0.glb';
        break;
      case 'warrior':
        modelPath = '/models/cyborg_spider.glb';
        break;
      case 'heavy':
        modelPath = '/models/cyborg_spider.glb'; // Same model, different scale
        break;
      case 'flyer':
        modelPath = '/models/arachnid_opt.glb';
        break;
    }

    // Try to load the model (will fail silently until models are added to public folder)
    this.loader.load(
      modelPath,
      (gltf) => {
        // Replace placeholder with actual model
        const model = gltf.scene;
        
        // Scale the model appropriately
        switch (type) {
          case 'scout':
            model.scale.setScalar(0.8);
            break;
          case 'warrior':
            model.scale.setScalar(1.0);
            break;
          case 'heavy':
            model.scale.setScalar(1.5);
            break;
          case 'flyer':
            model.scale.setScalar(1.2);
            break;
        }
        
        // Copy position and rotation from placeholder
        model.position.copy(placeholder.position);
        model.rotation.copy(placeholder.rotation);
        model.userData = placeholder.userData;
        
        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Replace in scene
        if (placeholder.parent) {
          placeholder.parent.add(model);
          placeholder.parent.remove(placeholder);
        }
        
        // Update enemy reference
        const enemy = this.enemies.find(e => e.mesh === placeholder);
        if (enemy) {
          enemy.mesh = model;
        }
      },
      undefined,
      (error) => {
        // Model not found, keep using placeholder
        console.log(`Model ${modelPath} not found, using placeholder`);
      }
    );
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update mothership
    if (this.motherShip) {
      this.motherShip.rotation.y += deltaTime * 0.1;
      this.motherShip.position.y += Math.sin(Date.now() * 0.0005) * 0.2;
      
      // Animate the energy core
      const core = this.motherShip.children.find(child => 
        child instanceof THREE.Mesh && child.material.transparent
      );
      if (core && core.material) {
        core.material.opacity = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    }

    // Update wave spawning
    this.updateWaveSpawning(deltaTime);

    // Update enemies
    this.enemies.forEach(enemy => {
      if (enemy.health <= 0 || enemy.destroyed) return;

      this.updateEnemyBehavior(enemy, deltaTime, playerPosition);
      this.updateEnemyMovement(enemy, deltaTime, playerPosition);
      this.updateEnemyAttack(enemy, playerPosition);
      this.updateEnemyTerrainCollision(enemy);
    });

    // Remove destroyed enemies
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.health <= 0 || enemy.destroyed) {
        this.createDeathEffect(enemy.mesh.position);
        this.scene.remove(enemy.mesh);
        return false;
      }
      return true;
    });
  }

  private updateEnemyTerrainCollision(enemy: AlienEnemy): void {
    if (enemy.type === 'flyer') {
      // Flyers circle around the player at a safe distance
      const terrainHeight = this.getTerrainHeightAtPosition(
        enemy.mesh.position.x, 
        enemy.mesh.position.z
      );
      
      // Update circle angle for smooth circling motion
      enemy.circleAngle = (enemy.circleAngle || 0) + enemy.speed * 0.01;
      
      // Calculate circle position around player (not directly above)
      const circleRadius = enemy.circleRadius || 15;
      const targetX = enemy.mesh.position.x + Math.cos(enemy.circleAngle) * circleRadius * 0.1;
      const targetZ = enemy.mesh.position.z + Math.sin(enemy.circleAngle) * circleRadius * 0.1;
      const targetHeight = terrainHeight + (enemy.flyingHeight || 15);
      
      // Smooth movement towards circle position
      enemy.mesh.position.x = THREE.MathUtils.lerp(enemy.mesh.position.x, targetX, 0.02);
      enemy.mesh.position.z = THREE.MathUtils.lerp(enemy.mesh.position.z, targetZ, 0.02);
      enemy.mesh.position.y = THREE.MathUtils.lerp(enemy.mesh.position.y, targetHeight, 0.05);
      
      // Add some vertical bobbing
      enemy.mesh.position.y += Math.sin(Date.now() * 0.003 + enemy.circleAngle) * 1;
      
    } else {
      // Ground enemies follow terrain with proper height offset
      const terrainHeight = this.getTerrainHeightAtPosition(
        enemy.mesh.position.x, 
        enemy.mesh.position.z
      );
      const heightOffset = this.getEnemyHeightOffset(enemy.type);
      enemy.mesh.position.y = terrainHeight + heightOffset;
    }
  }

  private updateWaveSpawning(deltaTime: number): void {
    this.waveTimer += deltaTime;
    
    // Spawn new wave every 30 seconds if current wave is completed
    if (this.waveTimer >= 30 && this.currentWave < this.waves.length) {
      if (this.enemies.length < 5) { // Don't overwhelm the player
        this.spawnWave();
        this.waveTimer = 0;
      }
    }
  }

  private updateEnemyBehavior(enemy: AlienEnemy, deltaTime: number, playerPosition: THREE.Vector3): void {
    const distanceToPlayer = enemy.mesh.position.distanceTo(playerPosition);
    
    // Flying enemies have different behavior
    if (enemy.type === 'flyer') {
      // Flyers maintain distance and circle around player
      if (distanceToPlayer < 10) {
        enemy.behavior = 'retreat'; // Move away if too close
      } else if (distanceToPlayer > 25) {
        enemy.behavior = 'chase'; // Move closer if too far
      } else {
        enemy.behavior = 'attack'; // Stay in optimal range and attack
      }
      return;
    }
    
    // Ground enemy behavior
    switch (enemy.behavior) {
      case 'patrol':
        if (distanceToPlayer <= enemy.detectionRange) {
          enemy.behavior = 'chase';
        } else if (enemy.patrolTarget && enemy.mesh.position.distanceTo(enemy.patrolTarget) < 2) {
          // Set new patrol target
          const terrainHeight = this.getTerrainHeightAtPosition(
            enemy.mesh.position.x + (Math.random() - 0.5) * 40,
            enemy.mesh.position.z + (Math.random() - 0.5) * 40
          );
          enemy.patrolTarget = new THREE.Vector3(
            enemy.mesh.position.x + (Math.random() - 0.5) * 40,
            terrainHeight,
            enemy.mesh.position.z + (Math.random() - 0.5) * 40
          );
        }
        break;
        
      case 'chase':
        if (distanceToPlayer > enemy.detectionRange * 1.5) {
          enemy.behavior = 'patrol';
        } else if (distanceToPlayer <= enemy.attackRange) {
          enemy.behavior = 'attack';
        }
        break;
        
      case 'attack':
        if (distanceToPlayer > enemy.attackRange * 1.2) {
          enemy.behavior = 'chase';
        }
        break;
    }
  }

  private updateEnemyMovement(enemy: AlienEnemy, deltaTime: number, playerPosition: THREE.Vector3): void {
    let targetPosition: THREE.Vector3;
    
    if (enemy.type === 'flyer') {
      // Flying enemy movement
      switch (enemy.behavior) {
        case 'retreat':
          // Move away from player
          const awayDirection = new THREE.Vector3();
          awayDirection.subVectors(enemy.mesh.position, playerPosition);
          awayDirection.y = 0;
          awayDirection.normalize();
          targetPosition = enemy.mesh.position.clone().add(awayDirection.multiplyScalar(5));
          break;
        case 'chase':
          // Move towards player but maintain some distance
          const towardDirection = new THREE.Vector3();
          towardDirection.subVectors(playerPosition, enemy.mesh.position);
          towardDirection.y = 0;
          towardDirection.normalize();
          targetPosition = enemy.mesh.position.clone().add(towardDirection.multiplyScalar(3));
          break;
        case 'attack':
        default:
          // Circle around player
          targetPosition = enemy.mesh.position.clone();
          break;
      }
    } else {
      // Ground enemy movement
      switch (enemy.behavior) {
        case 'patrol':
          targetPosition = enemy.patrolTarget || enemy.mesh.position;
          break;
        case 'chase':
        case 'attack':
          targetPosition = new THREE.Vector3(
            playerPosition.x,
            this.getTerrainHeightAtPosition(playerPosition.x, playerPosition.z),
            playerPosition.z
          );
          break;
        default:
          return;
      }
    }

    // Move towards target with smooth interpolation
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, enemy.mesh.position);
    
    if (enemy.type !== 'flyer') {
      direction.y = 0; // Keep ground enemies on ground level
    }
    
    if (direction.length() > 0.5) {
      direction.normalize();
      const movement = direction.multiplyScalar(enemy.speed * deltaTime);
      
      // Smooth movement using lerp
      const newPosition = enemy.mesh.position.clone().add(movement);
      enemy.mesh.position.lerp(newPosition, 0.8);
      
      // Smooth rotation towards target (for ground enemies)
      if (enemy.type !== 'flyer') {
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotation = enemy.mesh.rotation.y;
        let rotationDiff = targetRotation - currentRotation;
        
        // Handle angle wrapping
        if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        enemy.mesh.rotation.y += rotationDiff * deltaTime * 5; // Smooth rotation
      } else {
        // Flying enemies look at player
        enemy.mesh.lookAt(playerPosition);
      }
    }
  }

  private updateEnemyAttack(enemy: AlienEnemy, playerPosition: THREE.Vector3): void {
    if (enemy.behavior !== 'attack') return;
    
    const distance = enemy.mesh.position.distanceTo(playerPosition);
    const attackCooldown = enemy.type === 'flyer' ? 1500 : 2000; // Flyers attack more frequently
    
    if (distance <= enemy.attackRange && Date.now() - enemy.lastAttack > attackCooldown) {
      this.performEnemyAttack(enemy, playerPosition);
      enemy.lastAttack = Date.now();
    }
  }

  private performEnemyAttack(enemy: AlienEnemy, playerPosition: THREE.Vector3): void {
    // Create attack projectile
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const projectileColor = enemy.type === 'flyer' ? 0x66ff66 : 0xff6666;
    const projectileMaterial = new THREE.MeshBasicMaterial({ 
      color: projectileColor,
      transparent: true,
      opacity: 0.9
    });
    
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.copy(enemy.mesh.position);
    projectile.userData.isProjectile = true;
    
    // Calculate direction to player
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosition, enemy.mesh.position);
    direction.normalize();
    
    // Add projectile to scene with movement
    this.scene.add(projectile);
    
    // Animate projectile (simplified)
    const speed = 20;
    const animate = () => {
      projectile.position.add(direction.clone().multiplyScalar(speed * 0.016));
      
      if (projectile.position.distanceTo(enemy.mesh.position) > 50) {
        this.scene.remove(projectile);
      } else {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private createDeathEffect(position: THREE.Vector3): void {
    // Create explosion effect
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.7),
        transparent: true,
        opacity: 1
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      );
      
      this.scene.add(particle);
      
      // Animate particle
      const animateParticle = () => {
        particle.position.add(velocity.clone().multiplyScalar(0.016));
        velocity.y -= 9.8 * 0.016; // Gravity
        particle.material.opacity -= 0.02;
        
        if (particle.material.opacity <= 0) {
          this.scene.remove(particle);
        } else {
          requestAnimationFrame(animateParticle);
        }
      };
      animateParticle();
    }
  }

  public damageEnemy(enemyId: string, damage: number): void {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (enemy && !enemy.destroyed) {
      enemy.health -= damage;
      
      // Visual damage feedback
      const mesh = enemy.mesh instanceof THREE.Group ? 
        enemy.mesh.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh :
        enemy.mesh as THREE.Mesh;
        
      if (mesh && mesh.material) {
        const originalColor = (mesh.material as THREE.MeshPhongMaterial).color.clone();
        (mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffffff);
        
        setTimeout(() => {
          if (!enemy.destroyed && mesh.material) {
            (mesh.material as THREE.MeshPhongMaterial).color.copy(originalColor);
          }
        }, 100);
      }

      if (enemy.health <= 0) {
        enemy.destroyed = true;
      }
    }
  }

  public isEnemyDestroyed(enemyId: string): boolean {
    const enemy = this.enemies.find(e => e.id === enemyId);
    return enemy ? enemy.destroyed : false;
  }

  public getEnemies(): THREE.Mesh[] {
    return this.enemies.filter(e => !e.destroyed).map(enemy => 
      enemy.mesh instanceof THREE.Group ? enemy.mesh.children[0] as THREE.Mesh : enemy.mesh as THREE.Mesh
    );
  }

  public getCurrentWave(): number {
    return this.currentWave + 1;
  }

  public getEnemyCount(): number {
    return this.enemies.filter(e => !e.destroyed).length;
  }

  public getMotherShip(): THREE.Group | undefined {
    return this.motherShip;
  }
}