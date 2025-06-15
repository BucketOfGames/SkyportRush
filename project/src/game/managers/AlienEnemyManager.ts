import * as THREE from 'three';

interface AlienEnemy {
  mesh: THREE.Mesh;
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

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createMotherShip();
    this.setupEnemySpawners();
    this.initializeWaves();
  }

  private createMotherShip(): void {
    const shipGroup = new THREE.Group();
    
    // Main hull
    const hullGeometry = new THREE.CylinderGeometry(8, 12, 6, 8);
    const hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      emissive: 0x440044,
      shininess: 100
    });
    
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.x = Math.PI / 2;
    shipGroup.add(hull);

    // Command tower
    const towerGeometry = new THREE.CylinderGeometry(3, 4, 8, 6);
    const tower = new THREE.Mesh(towerGeometry, hullMaterial);
    tower.position.set(0, 4, 0);
    shipGroup.add(tower);

    // Engine glows
    for (let i = 0; i < 4; i++) {
      const engineGeometry = new THREE.CylinderGeometry(1, 1.5, 3, 8);
      const engineMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.8
      });
      
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      const angle = (i / 4) * Math.PI * 2;
      engine.position.set(
        Math.cos(angle) * 10,
        -2,
        Math.sin(angle) * 10
      );
      shipGroup.add(engine);
    }

    // Weapon turrets
    for (let i = 0; i < 6; i++) {
      const turretGeometry = new THREE.SphereGeometry(1, 8, 8);
      const turretMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        emissive: 0x220022
      });
      
      const turret = new THREE.Mesh(turretGeometry, turretMaterial);
      const angle = (i / 6) * Math.PI * 2;
      turret.position.set(
        Math.cos(angle) * 8,
        Math.random() * 4 - 2,
        Math.sin(angle) * 8
      );
      shipGroup.add(turret);
    }

    // Position the mothership high in the sky
    shipGroup.position.set(0, 80, 0);
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
      color: 0x8844ff,
      transparent: true,
      opacity: 0.6,
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
          
          vec3 color = mix(vec3(0.5, 0.2, 1.0), vec3(1.0, 0.4, 0.8), ripple);
          float alpha = fade * 0.7;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const energy = new THREE.Mesh(energyGeometry, energyMaterial);
    energy.rotation.x = Math.PI / 2;
    portalGroup.add(energy);

    portalGroup.position.copy(position);
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
    enemy.mesh.position.copy(spawnPoint);
    enemy.lastPosition = spawnPoint.clone();

    // Set initial patrol target
    enemy.patrolTarget = new THREE.Vector3(
      spawnPoint.x + (Math.random() - 0.5) * 40,
      spawnPoint.y,
      spawnPoint.z + (Math.random() - 0.5) * 40
    );

    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
  }

  private createEnemyMesh(type: 'scout' | 'warrior' | 'heavy' | 'flyer'): AlienEnemy {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let health: number;
    let speed: number;
    let attackDamage: number;
    let detectionRange: number;
    let attackRange: number;

    switch (type) {
      case 'scout':
        geometry = new THREE.SphereGeometry(0.8, 8, 6);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xff6644,
          emissive: 0x441100
        });
        health = 50;
        speed = 12;
        attackDamage = 15;
        detectionRange = 25;
        attackRange = 8;
        break;
      
      case 'warrior':
        geometry = new THREE.BoxGeometry(1.5, 2.5, 1.5);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xff4444,
          emissive: 0x220000
        });
        health = 100;
        speed = 8;
        attackDamage = 25;
        detectionRange = 20;
        attackRange = 6;
        break;
      
      case 'heavy':
        geometry = new THREE.BoxGeometry(2.5, 3, 2.5);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x8844ff,
          emissive: 0x220044
        });
        health = 200;
        speed = 4;
        attackDamage = 40;
        detectionRange = 15;
        attackRange = 10;
        break;
      
      case 'flyer':
        geometry = new THREE.ConeGeometry(1, 2, 6);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x44ff88,
          emissive: 0x002200
        });
        health = 75;
        speed = 15;
        attackDamage = 20;
        detectionRange = 30;
        attackRange = 12;
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    leftEye.position.set(-0.3, 0.2, 0.5);
    rightEye.position.set(0.3, 0.2, 0.5);
    
    mesh.add(leftEye);
    mesh.add(rightEye);

    // Add weapon for non-scout enemies
    if (type !== 'scout') {
      const weaponGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 6);
      const weaponMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.5, 0, 0.5);
      weapon.rotation.z = Math.PI / 2;
      mesh.add(weapon);
    }

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

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update mothership
    if (this.motherShip) {
      this.motherShip.rotation.y += deltaTime * 0.2;
      this.motherShip.position.y += Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Update wave spawning
    this.updateWaveSpawning(deltaTime);

    // Update enemies
    this.enemies.forEach(enemy => {
      if (enemy.health <= 0 || enemy.destroyed) return;

      this.updateEnemyBehavior(enemy, deltaTime, playerPosition);
      this.updateEnemyMovement(enemy, deltaTime);
      this.updateEnemyAttack(enemy, playerPosition);
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
    
    // State machine for enemy behavior
    switch (enemy.behavior) {
      case 'patrol':
        if (distanceToPlayer <= enemy.detectionRange) {
          enemy.behavior = 'chase';
        } else if (enemy.patrolTarget && enemy.mesh.position.distanceTo(enemy.patrolTarget) < 2) {
          // Set new patrol target
          enemy.patrolTarget = new THREE.Vector3(
            enemy.mesh.position.x + (Math.random() - 0.5) * 40,
            enemy.mesh.position.y,
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

  private updateEnemyMovement(enemy: AlienEnemy, deltaTime: number): void {
    let targetPosition: THREE.Vector3;
    
    switch (enemy.behavior) {
      case 'patrol':
        targetPosition = enemy.patrolTarget || enemy.mesh.position;
        break;
      case 'chase':
      case 'attack':
        // Get player position from the scene (simplified)
        targetPosition = new THREE.Vector3(0, 2, 0); // This should be the actual player position
        break;
      default:
        return;
    }

    // Move towards target
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, enemy.mesh.position);
    direction.y = 0; // Keep on ground level (except for flyers)
    
    if (enemy.type === 'flyer') {
      direction.y = Math.sin(Date.now() * 0.003) * 2; // Floating movement
    }
    
    if (direction.length() > 0.5) {
      direction.normalize();
      const movement = direction.multiplyScalar(enemy.speed * deltaTime);
      enemy.mesh.position.add(movement);
      
      // Look at target
      enemy.mesh.lookAt(targetPosition);
    }
  }

  private updateEnemyAttack(enemy: AlienEnemy, playerPosition: THREE.Vector3): void {
    if (enemy.behavior !== 'attack') return;
    
    const distance = enemy.mesh.position.distanceTo(playerPosition);
    if (distance <= enemy.attackRange && Date.now() - enemy.lastAttack > 2000) {
      this.performEnemyAttack(enemy, playerPosition);
      enemy.lastAttack = Date.now();
    }
  }

  private performEnemyAttack(enemy: AlienEnemy, playerPosition: THREE.Vector3): void {
    // Create attack projectile
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const projectileMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });
    
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.copy(enemy.mesh.position);
    
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
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
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
      const originalColor = (enemy.mesh.material as THREE.MeshPhongMaterial).color.clone();
      (enemy.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffffff);
      
      setTimeout(() => {
        if (!enemy.destroyed) {
          (enemy.mesh.material as THREE.MeshPhongMaterial).color.copy(originalColor);
        }
      }, 100);

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
    return this.enemies.filter(e => !e.destroyed).map(enemy => enemy.mesh);
  }

  public getCurrentWave(): number {
    return this.currentWave + 1;
  }

  public getEnemyCount(): number {
    return this.enemies.filter(e => !e.destroyed).length;
  }
}