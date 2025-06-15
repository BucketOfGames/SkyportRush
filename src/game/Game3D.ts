import * as THREE from 'three';
import { PlayerStats } from '../types/game';
import { Player3D } from './entities/Player3D';
import { AlienEnemyManager } from './managers/AlienEnemyManager';
import { AlienTerrainGenerator } from './terrain/AlienTerrainGenerator';
import { InputManager3D } from './managers/InputManager3D';
import { WeaponSystem } from './systems/WeaponSystem';
import { NetworkManager } from './managers/NetworkManager';
import { AudioManager3D } from './managers/AudioManager3D';
import { CollisionSystem } from './physics/CollisionSystem';

interface GameCallbacks {
  onGameEnd: () => void;
  onStatsUpdate: (stats: Partial<PlayerStats>) => void;
}

export class Game3D {
  private canvas: HTMLCanvasElement;
  private callbacks: GameCallbacks;
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  private player: Player3D;
  private enemyManager: AlienEnemyManager;
  private terrainGenerator: AlienTerrainGenerator;
  private inputManager: InputManager3D;
  private weaponSystem: WeaponSystem;
  private networkManager: NetworkManager;
  private audioManager: AudioManager3D;
  private collisionSystem: CollisionSystem;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private playerStats: PlayerStats;
  
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    
    this.playerStats = {
      health: 100,
      armor: 100,
      ammo: 30,
      score: 0,
      kills: 0,
      level: 1
    };

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initThreeJS();
    this.initGame();
  }

  private initThreeJS(): void {
    // Scene
    this.scene = new THREE.Scene();

    // Camera - optimized for third-person battlefield view
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.width / this.canvas.height,
      0.1,
      2000 // Increased for large battlefield
    );

    // Renderer with enhanced settings for realistic battlefield
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true 
    });
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x2a2a35); // Battlefield sky color
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Realistic battlefield lighting
    const ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun through clouds)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);

    // Battle fire lights (orange glow from explosions)
    const fireLight1 = new THREE.PointLight(0xff4400, 1.5, 200);
    fireLight1.position.set(100, 20, 100);
    this.scene.add(fireLight1);

    const fireLight2 = new THREE.PointLight(0xff6600, 1.2, 150);
    fireLight2.position.set(-80, 15, -120);
    this.scene.add(fireLight2);

    // Distant explosion lights
    const explosionLight = new THREE.PointLight(0xff8800, 2.0, 300);
    explosionLight.position.set(0, 50, -200);
    this.scene.add(explosionLight);
  }

  private initGame(): void {
    // Initialize collision system first
    this.collisionSystem = new CollisionSystem();
    
    // Add ground plane collider
    this.collisionSystem.addCollider({
      type: 'plane',
      position: new THREE.Vector3(0, 0, 0),
      normal: new THREE.Vector3(0, 1, 0),
      isStatic: true,
      id: 'ground'
    });

    this.player = new Player3D(this.scene, this.camera, this.collisionSystem);
    this.terrainGenerator = new AlienTerrainGenerator(this.scene);
    this.enemyManager = new AlienEnemyManager(this.scene);
    this.inputManager = new InputManager3D(this.canvas);
    this.weaponSystem = new WeaponSystem(this.scene);
    this.networkManager = new NetworkManager();
    this.audioManager = new AudioManager3D();

    // Generate large battlefield terrain
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.terrainGenerator.generateChunk(x, z);
      }
    }

    // Add terrain structures to collision system
    this.addTerrainColliders();

    // Start the battle!
    this.enemyManager.spawnWave(0);

    this.bindEvents();
  }

  private addTerrainColliders(): void {
    // Add colliders for terrain structures
    const structures = this.terrainGenerator.getAlienStructures();
    structures.forEach((structure, index) => {
      // Add box colliders for structures
      this.collisionSystem.addCollider({
        type: 'box',
        position: structure.position.clone(),
        size: new THREE.Vector3(8, 6, 8), // Approximate structure size
        isStatic: true,
        id: `structure_${index}`
      });
    });

    // Add colliders for enemy bases
    const enemyBases = this.terrainGenerator.getEnemyBases();
    enemyBases.forEach((base, index) => {
      this.collisionSystem.addCollider({
        type: 'sphere',
        position: base.position.clone(),
        radius: 15,
        isStatic: true,
        id: `enemy_base_${index}`
      });
    });
  }

  private bindEvents(): void {
    // Click to lock pointer and enable mouse look
    this.canvas.addEventListener('click', () => {
      if (!this.inputManager.isPointerLockActive()) {
        this.inputManager.requestPointerLock();
      }
    });

    // Mouse movement for camera control
    this.canvas.addEventListener('mousemove', (event) => {
      this.inputManager.handleMouseMove(event);
    });

    // Weapon firing
    this.canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0 && this.inputManager.isPointerLockActive()) {
        this.handleWeaponFire();
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  private handleWeaponFire(): void {
    const shoulderPos = this.player.getShoulderPosition();
    const direction = this.player.getDirection();
    
    this.weaponSystem.fire(shoulderPos, direction);
    this.audioManager.playWeaponFire();
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop();
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  public destroy(): void {
    this.stop();
    this.inputManager.destroy();
    this.audioManager.destroy();
    this.renderer.dispose();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public updateStats(stats: PlayerStats): void {
    this.playerStats = { ...stats };
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const deltaTime = this.clock.getDelta();

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update player
    this.player.update(deltaTime, this.inputManager);
    
    // Update enemies
    this.enemyManager.update(deltaTime, this.player.getPosition());
    
    // Update terrain
    this.terrainGenerator.update(deltaTime);
    
    // Update weapon system
    this.weaponSystem.update(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Update terrain based on player position
    this.updateTerrain();
    
    // Update game stats
    this.updateGameStats();
  }

  private checkCollisions(): void {
    const playerPos = this.player.getPosition();
    
    // Check enemy collisions with player
    const enemies = this.enemyManager.getEnemies();
    enemies.forEach(enemy => {
      const distance = playerPos.distanceTo(enemy.position);
      if (distance < 2) {
        this.playerStats.health -= 3; // Reduced damage for better gameplay
        this.audioManager.playPlayerHit();
        if (this.playerStats.health <= 0) {
          this.callbacks.onGameEnd();
        }
      }
    });

    // Check projectile hits on enemies
    const projectiles = this.weaponSystem.getProjectiles();
    projectiles.forEach(projectile => {
      enemies.forEach(enemy => {
        const distance = projectile.position.distanceTo(enemy.position);
        if (distance < 1.5) {
          // Hit detected!
          this.enemyManager.damageEnemy(enemy.userData.id, 25);
          this.weaponSystem.removeProjectile(projectile.userData.id);
          this.audioManager.playEnemyHit();
          
          // Update score
          this.playerStats.score += 100;
          
          // Check if enemy was destroyed
          if (this.enemyManager.isEnemyDestroyed(enemy.userData.id)) {
            this.playerStats.kills++;
            this.playerStats.score += 200; // Bonus for kill
          }
        }
      });
    });
  }

  private updateTerrain(): void {
    const playerPos = this.player.getPosition();
    const chunkSize = 200;
    const chunkX = Math.floor(playerPos.x / chunkSize);
    const chunkZ = Math.floor(playerPos.z / chunkSize);

    // Generate chunks around player
    for (let x = chunkX - 2; x <= chunkX + 2; x++) {
      for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
        if (!this.terrainGenerator.hasChunk(x, z)) {
          this.terrainGenerator.generateChunk(x, z);
          // Add new structure colliders
          this.addNewChunkColliders(x, z);
        }
      }
    }
  }

  private addNewChunkColliders(chunkX: number, chunkZ: number): void {
    // This would add colliders for newly generated structures
    // For now, we'll keep it simple since structures are added at initialization
  }

  private updateGameStats(): void {
    // Update ammo
    this.playerStats.ammo = this.weaponSystem.getCurrentAmmo();
    
    // Level progression based on kills and waves
    const newLevel = Math.floor(this.playerStats.kills / 15) + this.enemyManager.getCurrentWave();
    if (newLevel > this.playerStats.level) {
      this.playerStats.level = newLevel;
      // Spawn new wave when level increases
      this.enemyManager.spawnWave();
    }
    
    // Update UI
    this.callbacks.onStatsUpdate({
      ...this.playerStats,
    });
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Public methods for getting game state
  public getCurrentWave(): number {
    return this.enemyManager.getCurrentWave();
  }

  public getEnemyCount(): number {
    return this.enemyManager.getEnemyCount();
  }
}