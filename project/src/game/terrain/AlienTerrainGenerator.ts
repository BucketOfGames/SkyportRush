import * as THREE from 'three';

export class AlienTerrainGenerator {
  private scene: THREE.Scene;
  private chunks: Map<string, THREE.Mesh> = new Map();
  private chunkSize: number = 200;
  private alienStructures: THREE.Group[] = [];
  private enemyBases: THREE.Group[] = [];
  private groundPlane: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createMainGroundPlane();
    this.createRealisticSky();
    this.createBattlefieldAtmosphere();
    this.createDistantMountains();
  }

  private createMainGroundPlane(): void {
    // Create a large main ground plane that's always visible
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 256, 256);
    
    // Apply height variation to the ground
    const vertices = groundGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 1]; // Note: PlaneGeometry has Y as the second coordinate when flat
      
      // Create realistic terrain height
      const height1 = this.terrainNoise(x * 0.01, z * 0.01) * 8;
      const height2 = this.terrainNoise(x * 0.005, z * 0.005) * 15;
      const height3 = this.terrainNoise(x * 0.02, z * 0.02) * 3;
      const craters = this.craterNoise(x, z);
      
      vertices[i + 2] = height1 + height2 + height3 + craters; // Z is height for PlaneGeometry
    }
    
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    // Create realistic ground material with custom shader
    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        grassColor: { value: new THREE.Color(0x4a5a3a) },
        dirtColor: { value: new THREE.Color(0x6a5a4a) },
        rockColor: { value: new THREE.Color(0x6a6a6a) },
        snowColor: { value: new THREE.Color(0x9a9a9a) }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec3 vWorldPosition;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vHeight = position.z; // Z is height for PlaneGeometry
          
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 grassColor;
        uniform vec3 dirtColor;
        uniform vec3 rockColor;
        uniform vec3 snowColor;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec3 vWorldPosition;
        
        // Simple noise function
        float noise(vec2 p) {
          return sin(p.x * 0.1) * cos(p.y * 0.1);
        }
        
        void main() {
          // Calculate slope
          float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          
          // Base terrain color
          vec3 finalColor = grassColor;
          
          // Add dirt on moderate slopes
          finalColor = mix(finalColor, dirtColor, smoothstep(0.2, 0.5, slope));
          
          // Add rock on steep slopes
          finalColor = mix(finalColor, rockColor, smoothstep(0.4, 0.8, slope));
          
          // Add snow/dust on high areas
          finalColor = mix(finalColor, snowColor, smoothstep(15.0, 25.0, vHeight));
          
          // Add battle damage and variation
          float damage = noise(vWorldPosition.xy * 0.05);
          finalColor *= (0.7 + damage * 0.3);
          
          // Add some color variation
          float variation = noise(vWorldPosition.xy * 0.02);
          finalColor += vec3(variation * 0.1);
          
          // Basic lighting calculation
          vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
          float lighting = max(0.3, dot(vNormal, lightDir));
          finalColor *= lighting;
          
          // Add slight atmospheric perspective
          float distance = length(vWorldPosition.xy);
          float fog = 1.0 - smoothstep(500.0, 1000.0, distance);
          finalColor = mix(vec3(0.4, 0.4, 0.5), finalColor, fog);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundPlane.position.y = 0; // Place at ground level
    this.groundPlane.receiveShadow = true;
    
    this.scene.add(this.groundPlane);

    // Add some scattered rocks and debris on the ground
    this.addGroundDetails();
  }

  private addGroundDetails(): void {
    // Add scattered rocks, debris, and details across the ground
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 1800;
      const z = (Math.random() - 0.5) * 1800;
      
      // Get height at this position
      const y = this.getHeightAtPosition(x, z) + 0.5;
      
      const detailType = Math.floor(Math.random() * 4);
      let detail: THREE.Mesh;

      switch (detailType) {
        case 0: // Small rock
          const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1);
          const rockMaterial = new THREE.MeshPhongMaterial({
            color: 0x5a5a5a,
            roughness: 0.8
          });
          detail = new THREE.Mesh(rockGeometry, rockMaterial);
          break;

        case 1: // Debris
          const debrisGeometry = new THREE.BoxGeometry(
            0.5 + Math.random() * 1,
            0.2 + Math.random() * 0.5,
            0.5 + Math.random() * 1
          );
          const debrisMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a3a3a
          });
          detail = new THREE.Mesh(debrisGeometry, debrisMaterial);
          break;

        case 2: // Metal fragment
          const metalGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 6);
          const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a4a4a,
            metalness: 0.8,
            roughness: 0.3
          });
          detail = new THREE.Mesh(metalGeometry, metalMaterial);
          break;

        case 3: // Crystal shard
          const crystalGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
          const crystalMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488aa,
            transparent: true,
            opacity: 0.7
          });
          detail = new THREE.Mesh(crystalGeometry, crystalMaterial);
          break;

        default:
          continue;
      }

      detail.position.set(x, y, z);
      detail.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      detail.castShadow = true;
      detail.receiveShadow = true;
      
      this.scene.add(detail);
    }
  }

  private getHeightAtPosition(x: number, z: number): number {
    // Calculate height at a specific position using the same noise functions
    const height1 = this.terrainNoise(x * 0.01, z * 0.01) * 8;
    const height2 = this.terrainNoise(x * 0.005, z * 0.005) * 15;
    const height3 = this.terrainNoise(x * 0.02, z * 0.02) * 3;
    const craters = this.craterNoise(x, z);
    
    return height1 + height2 + height3 + craters;
  }

  private createRealisticSky(): void {
    // Create realistic battlefield sky
    const skyGeometry = new THREE.SphereGeometry(1500, 64, 64);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        cloudCoverage: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float cloudCoverage;
        varying vec3 vWorldPosition;
        
        // Noise function for clouds
        float noise(vec3 p) {
          return sin(p.x * 0.01) * cos(p.y * 0.01) * sin(p.z * 0.01);
        }
        
        void main() {
          vec3 direction = normalize(vWorldPosition);
          
          // Base sky color - stormy battlefield atmosphere
          float y = direction.y;
          vec3 skyColor = mix(
            vec3(0.2, 0.15, 0.1), // Dark orange horizon (fires)
            vec3(0.3, 0.35, 0.4),  // Stormy gray sky
            smoothstep(-0.1, 0.6, y)
          );
          
          // Add dramatic clouds
          float cloudNoise = noise(direction * 80.0 + time * 0.1);
          cloudNoise += noise(direction * 160.0 + time * 0.05) * 0.5;
          cloudNoise += noise(direction * 320.0 + time * 0.02) * 0.25;
          
          float clouds = smoothstep(0.0, 1.0, cloudNoise * cloudCoverage);
          vec3 cloudColor = vec3(0.5, 0.5, 0.55);
          
          skyColor = mix(skyColor, cloudColor, clouds * 0.8);
          
          // Add orange glow on horizon (battle fires)
          if (y < 0.2) {
            float fireGlow = (0.2 - y) * 5.0;
            skyColor += vec3(0.4, 0.2, 0.05) * fireGlow * 0.5;
          }
          
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);
  }

  private createBattlefieldAtmosphere(): void {
    // Realistic battlefield fog
    this.scene.fog = new THREE.Fog(0x505060, 100, 1200);

    // Add smoke/dust particles
    this.createBattlefieldParticles();
  }

  private createBattlefieldParticles(): void {
    // Smoke and dust particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1500;
      positions[i * 3 + 1] = Math.random() * 150 + 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1500;

      // Smoke colors - mix of gray and slight orange
      const gray = 0.3 + Math.random() * 0.3;
      const orange = Math.random() * 0.1;
      colors[i * 3] = gray + orange;
      colors[i * 3 + 1] = gray + orange * 0.5;
      colors[i * 3 + 2] = gray;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 12,
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);
  }

  private createDistantMountains(): void {
    // Create mountain ranges in the distance
    const mountainRanges = [
      { distance: 1200, height: 200, color: 0x1a1a25, opacity: 0.4 },
      { distance: 900, height: 150, color: 0x252530, opacity: 0.6 },
      { distance: 600, height: 120, color: 0x303035, opacity: 0.8 }
    ];

    mountainRanges.forEach((range, index) => {
      const mountainGeometry = new THREE.PlaneGeometry(3000, range.height, 128, 32);
      const vertices = mountainGeometry.attributes.position.array as Float32Array;

      // Create mountain silhouette
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const height = this.mountainNoise(x * 0.003) * range.height * 0.9;
        vertices[i + 2] = height; // Z is height for PlaneGeometry
      }

      mountainGeometry.attributes.position.needsUpdate = true;

      const mountainMaterial = new THREE.MeshBasicMaterial({
        color: range.color,
        transparent: true,
        opacity: range.opacity,
        side: THREE.DoubleSide,
        fog: false // Mountains shouldn't be affected by fog
      });

      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      mountain.position.set(0, range.height / 2, -range.distance);
      mountain.rotation.x = -Math.PI / 2;
      this.scene.add(mountain);
    });
  }

  private mountainNoise(x: number): number {
    return Math.sin(x) * 0.5 + 
           Math.sin(x * 2) * 0.25 + 
           Math.sin(x * 4) * 0.125 + 
           Math.sin(x * 8) * 0.0625;
  }

  public generateChunk(chunkX: number, chunkZ: number): void {
    const key = `${chunkX}_${chunkZ}`;
    if (this.chunks.has(key)) return;

    // Add battlefield structures on the main ground plane
    this.addBattlefieldStructures(chunkX, chunkZ);
  }

  private addBattlefieldStructures(chunkX: number, chunkZ: number): void {
    const structureCount = Math.floor(Math.random() * 8) + 4;
    
    for (let i = 0; i < structureCount; i++) {
      const x = chunkX * this.chunkSize + (Math.random() - 0.5) * this.chunkSize * 0.8;
      const z = chunkZ * this.chunkSize + (Math.random() - 0.5) * this.chunkSize * 0.8;
      const y = this.getHeightAtPosition(x, z);
      
      const structureType = Math.floor(Math.random() * 8);
      let structure: THREE.Group;

      switch (structureType) {
        case 0: // Battle Crater
          structure = this.createBattleCrater(x, y, z);
          break;
        case 1: // Destroyed Building
          structure = this.createDestroyedBuilding(x, y, z);
          break;
        case 2: // Enemy Bunker
          structure = this.createEnemyBunker(x, y, z);
          break;
        case 3: // Weapon Cache
          structure = this.createWeaponCache(x, y, z);
          break;
        case 4: // Defensive Wall
          structure = this.createDefensiveWall(x, y, z);
          break;
        case 5: // Enemy Base
          structure = this.createEnemyBase(x, y, z);
          break;
        case 6: // Crashed Ship
          structure = this.createCrashedShip(x, y, z);
          break;
        case 7: // Rock Formation
          structure = this.createRockFormation(x, y, z);
          break;
        default:
          continue;
      }

      this.scene.add(structure);
      this.alienStructures.push(structure);
    }

    // Mark chunk as generated
    this.chunks.set(`${chunkX}_${chunkZ}`, this.groundPlane);
  }

  private createBattleCrater(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Crater rim
    const rimGeometry = new THREE.RingGeometry(8, 12, 16);
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      transparent: true,
      opacity: 0.8
    });
    
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = -1;
    group.add(rim);

    // Crater center (darker)
    const centerGeometry = new THREE.CircleGeometry(8, 16);
    const centerMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a
    });
    
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = -2;
    group.add(center);

    // Add some debris around crater
    for (let i = 0; i < 5; i++) {
      const debrisGeometry = new THREE.BoxGeometry(
        0.5 + Math.random(),
        0.3 + Math.random() * 0.5,
        0.5 + Math.random()
      );
      const debrisMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a3a3a
      });
      
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      const angle = (i / 5) * Math.PI * 2;
      debris.position.set(
        Math.cos(angle) * (10 + Math.random() * 5),
        0,
        Math.sin(angle) * (10 + Math.random() * 5)
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      debris.castShadow = true;
      group.add(debris);
    }

    group.position.set(x, y, z);
    return group;
  }

  private createDestroyedBuilding(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Building ruins
    for (let i = 0; i < 3; i++) {
      const ruinGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        3 + Math.random() * 4,
        2 + Math.random() * 3
      );
      const ruinMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a4a4a
      });
      
      const ruin = new THREE.Mesh(ruinGeometry, ruinMaterial);
      ruin.position.set(
        (Math.random() - 0.5) * 8,
        ruin.geometry.parameters.height / 2,
        (Math.random() - 0.5) * 8
      );
      ruin.rotation.y = Math.random() * Math.PI;
      ruin.rotation.z = (Math.random() - 0.5) * 0.3;
      ruin.castShadow = true;
      ruin.receiveShadow = true;
      group.add(ruin);
    }

    group.position.set(x, y, z);
    return group;
  }

  private createEnemyBunker(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main bunker structure
    const bunkerGeometry = new THREE.BoxGeometry(8, 3, 8);
    const bunkerMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      emissive: 0x0a0a0a
    });
    
    const bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.y = 1.5;
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    group.add(bunker);

    // Entrance
    const entranceGeometry = new THREE.BoxGeometry(2, 2.5, 1);
    const entranceMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a
    });
    
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 1.25, 4);
    group.add(entrance);

    // Defensive turret
    const turretGeometry = new THREE.CylinderGeometry(0.5, 0.8, 1.5, 8);
    const turretMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a5a5a,
      emissive: 0x220000
    });
    
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(0, 4, 0);
    turret.castShadow = true;
    group.add(turret);

    group.position.set(x, y, z);
    return group;
  }

  private createWeaponCache(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Weapon crates
    for (let i = 0; i < 4; i++) {
      const crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const crateMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a6a4a,
        emissive: 0x001100
      });
      
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(
        (Math.random() - 0.5) * 6,
        0.75,
        (Math.random() - 0.5) * 6
      );
      crate.rotation.y = Math.random() * Math.PI;
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);
    }

    group.position.set(x, y, z);
    return group;
  }

  private createDefensiveWall(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Wall segments
    for (let i = 0; i < 5; i++) {
      const wallGeometry = new THREE.BoxGeometry(3, 4, 0.5);
      const wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a5a5a
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(i * 3 - 6, 2, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }

    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI;
    return group;
  }

  private createEnemyBase(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Main base structure
    const baseGeometry = new THREE.CylinderGeometry(12, 15, 8, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a3a,
      emissive: 0x110022
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Energy shield dome
    const shieldGeometry = new THREE.SphereGeometry(18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.y = 2;
    group.add(shield);

    // Communication towers
    for (let i = 0; i < 4; i++) {
      const towerGeometry = new THREE.CylinderGeometry(0.3, 0.5, 12, 6);
      const towerMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a4a4a,
        emissive: 0x002200
      });
      
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      const angle = (i / 4) * Math.PI * 2;
      tower.position.set(
        Math.cos(angle) * 10,
        6,
        Math.sin(angle) * 10
      );
      tower.castShadow = true;
      group.add(tower);
    }

    group.position.set(x, y, z);
    this.enemyBases.push(group);
    return group;
  }

  private createCrashedShip(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Ship hull
    const hullGeometry = new THREE.CylinderGeometry(3, 4, 20, 8);
    const hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      emissive: 0x220000
    });
    
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.z = Math.PI / 4;
    hull.position.set(0, 3, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Smoke effect
    const smokeGeometry = new THREE.SphereGeometry(2, 8, 8);
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x2a2a2a,
      transparent: true,
      opacity: 0.3
    });
    
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(0, 8, 0);
    group.add(smoke);

    group.position.set(x, y, z);
    return group;
  }

  private createRockFormation(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    
    // Rock cluster
    for (let i = 0; i < 5; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2);
      const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a5a5a
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 8,
        rock.geometry.parameters.radius,
        (Math.random() - 0.5) * 8
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
    }

    group.position.set(x, y, z);
    return group;
  }

  private terrainNoise(x: number, z: number): number {
    return Math.sin(x * 2) * Math.cos(z * 1.5) + 
           Math.sin(x * 4) * Math.cos(z * 3) * 0.5 +
           Math.sin(x * 8) * Math.cos(z * 6) * 0.25;
  }

  private craterNoise(x: number, z: number): number {
    // Create random craters
    const craterX = Math.floor(x / 80) * 80;
    const craterZ = Math.floor(z / 80) * 80;
    const distance = Math.sqrt((x - craterX) ** 2 + (z - craterZ) ** 2);
    
    if (distance < 20 && Math.random() > 0.8) {
      return -Math.max(0, 8 - distance * 0.4);
    }
    return 0;
  }

  public update(deltaTime: number): void {
    const time = Date.now() * 0.001;
    
    // Update ground material time uniform
    if (this.groundPlane && this.groundPlane.material.uniforms) {
      this.groundPlane.material.uniforms.time.value = time;
    }
    
    // Animate enemy bases
    this.enemyBases.forEach((base, index) => {
      base.rotation.y += deltaTime * 0.2;
      
      // Animate shield
      const shield = base.children.find(child => child.material && child.material.transparent);
      if (shield) {
        shield.material.opacity = 0.1 + Math.sin(time * 2 + index) * 0.1;
      }
    });

    // Animate other structures
    this.alienStructures.forEach((structure, index) => {
      // Gentle floating for some structures
      if (structure.children.length > 2) {
        structure.position.y += Math.sin(time * 1.5 + index) * 0.02;
      }
    });
  }

  public hasChunk(chunkX: number, chunkZ: number): boolean {
    return this.chunks.has(`${chunkX}_${chunkZ}`);
  }

  public getEnemyBases(): THREE.Group[] {
    return this.enemyBases;
  }
}