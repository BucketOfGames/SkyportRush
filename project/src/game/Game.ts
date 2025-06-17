import { GameStats } from '../types/game';
import { Player } from './entities/Player';
import { EntityManager } from './managers/EntityManager';
import { ParticleSystem } from './systems/ParticleSystem';
import { InputManager } from './managers/InputManager';
import { AudioManager } from './managers/AudioManager';
import { Renderer } from './rendering/Renderer';

interface GameCallbacks {
  onGameEnd: () => void;
  onStatsUpdate: (stats: Partial<GameStats>) => void;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  
  private player: Player;
  private entityManager: EntityManager;
  private particleSystem: ParticleSystem;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private renderer: Renderer;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private gameStats: GameStats;
  
  private levelTimer: number = 0;
  private spawnTimer: number = 0;
  private difficultyTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    
    this.gameStats = {
      score: 0,
      level: 1,
      lives: 3,
      combo: 1,
      fuel: 100,
      highScore: 0
    };

    this.player = new Player(canvas.width / 2, canvas.height / 2);
    this.entityManager = new EntityManager(canvas.width, canvas.height);
    this.particleSystem = new ParticleSystem();
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();
    this.renderer = new Renderer(this.ctx);

    this.init();
  }

  private init(): void {
    this.inputManager.bindEvents();
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  public destroy(): void {
    this.stop();
    this.inputManager.unbindEvents();
    this.audioManager.destroy();
  }

  public resize(width: number, height: number): void {
    this.entityManager.resize(width, height);
  }

  public updateStats(stats: GameStats): void {
    this.gameStats = { ...stats };
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update timers
    this.levelTimer += deltaTime;
    this.spawnTimer += deltaTime;
    this.difficultyTimer += deltaTime;

    // Update player
    this.player.update(deltaTime, this.inputManager);
    
    // Check boundaries
    this.keepPlayerInBounds();
    
    // Update entities
    this.entityManager.update(deltaTime);
    
    // Update particles
    this.particleSystem.update(deltaTime);
    
    // Spawn entities
    this.handleSpawning(deltaTime);
    
    // Check collisions
    this.handleCollisions();
    
    // Update game state
    this.updateGameState(deltaTime);
    
    // Check win/lose conditions
    this.checkGameEnd();
  }

  private keepPlayerInBounds(): void {
    const margin = 50;
    this.player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, this.player.position.x));
    this.player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, this.player.position.y));
  }

  private handleSpawning(deltaTime: number): void {
    const spawnRate = Math.max(0.5, 2 - this.gameStats.level * 0.1);
    
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      
      // Spawn collectibles more frequently than obstacles
      if (Math.random() < 0.6) {
        this.entityManager.spawnCollectible(this.canvas.width, this.canvas.height);
      } else {
        this.entityManager.spawnObstacle(this.canvas.width, this.canvas.height);
      }
    }
  }

  private handleCollisions(): void {
    const collectibles = this.entityManager.getCollectibles();
    const obstacles = this.entityManager.getObstacles();

    // Check collectible collisions
    collectibles.forEach(collectible => {
      if (this.player.collidesWith(collectible)) {
        this.collectItem(collectible);
        collectible.active = false;
      }
    });

    // Check obstacle collisions
    if (!this.player.invulnerable) {
      obstacles.forEach(obstacle => {
        if (this.player.collidesWith(obstacle)) {
          this.hitObstacle(obstacle);
          obstacle.active = false;
        }
      });
    }
  }

  private collectItem(collectible: any): void {
    const basePoints = {
      fuel: 50,
      crystal: 100,
      powerup: 200
    };

    const points = basePoints[collectible.type] * this.gameStats.combo;
    this.gameStats.score += points;
    this.gameStats.combo = Math.min(this.gameStats.combo + 1, 10);

    if (collectible.type === 'fuel') {
      this.gameStats.fuel = Math.min(100, this.gameStats.fuel + 20);
    }

    // Create collection particles
    this.particleSystem.createCollectionEffect(collectible.position.x, collectible.position.y, collectible.type);
    
    this.audioManager.playCollect();
    this.callbacks.onStatsUpdate(this.gameStats);
  }

  private hitObstacle(obstacle: any): void {
    this.gameStats.lives--;
    this.gameStats.combo = 1;
    this.player.takeDamage();
    
    // Create explosion particles
    this.particleSystem.createExplosion(this.player.position.x, this.player.position.y);
    
    this.audioManager.playHit();
    this.callbacks.onStatsUpdate(this.gameStats);
  }

  private updateGameState(deltaTime: number): void {
    // Decrease fuel over time
    this.gameStats.fuel = Math.max(0, this.gameStats.fuel - deltaTime * 5);
    
    // Level progression
    if (this.levelTimer >= 30) {
      this.levelTimer = 0;
      this.gameStats.level++;
    }
    
    // Create engine particles
    if (this.inputManager.isPressed('thrust')) {
      this.particleSystem.createEngineTrail(
        this.player.position.x - Math.cos(this.player.rotation) * 30,
        this.player.position.y - Math.sin(this.player.rotation) * 30
      );
    }
    
    this.callbacks.onStatsUpdate(this.gameStats);
  }

  private checkGameEnd(): void {
    if (this.gameStats.lives <= 0 || this.gameStats.fuel <= 0) {
      this.callbacks.onGameEnd();
    }
  }

  private render(): void {
    // Clear canvas with gradient background
    this.renderer.clear(this.canvas.width, this.canvas.height);
    
    // Render background elements
    this.renderer.renderBackground(this.canvas.width, this.canvas.height);
    
    // Render particles (background layer)
    this.particleSystem.render(this.ctx);
    
    // Render entities
    this.entityManager.render(this.ctx);
    
    // Render player
    this.player.render(this.ctx);
    
    // Render particles (foreground layer)
    this.particleSystem.renderForeground(this.ctx);
  }
}