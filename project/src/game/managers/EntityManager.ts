import { Collectible, Obstacle } from '../../types/game';

class CollectibleEntity implements Collectible {
  public position = { x: 0, y: 0 };
  public velocity = { x: 0, y: 0 };
  public size = { x: 20, y: 20 };
  public active = true;
  public type: 'fuel' | 'crystal' | 'powerup';
  public value: number;
  public rotation: number = 0;

  constructor(x: number, y: number, type: 'fuel' | 'crystal' | 'powerup') {
    this.position.x = x;
    this.position.y = y;
    this.type = type;
    this.velocity.x = -200 - Math.random() * 100;
    this.velocity.y = (Math.random() - 0.5) * 100;
    
    switch (type) {
      case 'fuel':
        this.value = 50;
        this.size = { x: 16, y: 16 };
        break;
      case 'crystal':
        this.value = 100;
        this.size = { x: 20, y: 20 };
        break;
      case 'powerup':
        this.value = 200;
        this.size = { x: 24, y: 24 };
        break;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.rotation += deltaTime * 2;

    if (this.position.x < -50) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case 'fuel':
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#34d399';
        break;
      case 'crystal':
        ctx.fillStyle = '#8b5cf6';
        ctx.strokeStyle = '#a78bfa';
        break;
      case 'powerup':
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fbbf24';
        break;
    }

    ctx.lineWidth = 2;
    const size = this.size.x / 2;
    
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, -size);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner glow
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.3, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class ObstacleEntity implements Obstacle {
  public position = { x: 0, y: 0 };
  public velocity = { x: 0, y: 0 };
  public size = { x: 30, y: 30 };
  public active = true;
  public type: 'asteroid' | 'barrier' | 'mine';
  public rotation: number = 0;
  public damage: number;

  constructor(x: number, y: number, type: 'asteroid' | 'barrier' | 'mine') {
    this.position.x = x;
    this.position.y = y;
    this.type = type;
    this.velocity.x = -150 - Math.random() * 50;
    this.velocity.y = (Math.random() - 0.5) * 50;
    this.rotation = Math.random() * Math.PI * 2;
    this.damage = 25;

    switch (type) {
      case 'asteroid':
        this.size = { x: 35, y: 35 };
        break;
      case 'barrier':
        this.size = { x: 20, y: 60 };
        break;
      case 'mine':
        this.size = { x: 25, y: 25 };
        break;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.rotation += deltaTime;

    if (this.position.x < -100) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case 'asteroid':
        this.renderAsteroid(ctx);
        break;
      case 'barrier':
        this.renderBarrier(ctx);
        break;
      case 'mine':
        this.renderMine(ctx);
        break;
    }

    ctx.restore();
  }

  private renderAsteroid(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;

    const size = this.size.x / 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = size * (0.8 + Math.random() * 0.4);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderBarrier(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;

    const w = this.size.x / 2;
    const h = this.size.y / 2;
    ctx.fillRect(-w, -h, this.size.x, this.size.y);
    ctx.strokeRect(-w, -h, this.size.x, this.size.y);

    // Warning stripes
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 3; i++) {
      const y = -h + (i + 0.5) * (this.size.y / 3);
      ctx.fillRect(-w, y - 2, this.size.x, 4);
    }
  }

  private renderMine(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;

    const size = this.size.x / 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spikes
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = Math.cos(angle) * size * 0.7;
      const y1 = Math.sin(angle) * size * 0.7;
      const x2 = Math.cos(angle) * size * 1.3;
      const y2 = Math.sin(angle) * size * 1.3;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

export class EntityManager {
  private collectibles: CollectibleEntity[] = [];
  private obstacles: ObstacleEntity[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public spawnCollectible(screenWidth: number, screenHeight: number): void {
    const types: ('fuel' | 'crystal' | 'powerup')[] = ['fuel', 'crystal', 'powerup'];
    const weights = [0.5, 0.35, 0.15]; // Fuel most common, powerup least common
    
    let random = Math.random();
    let type: 'fuel' | 'crystal' | 'powerup' = 'fuel';
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        type = types[i];
        break;
      }
      random -= weights[i];
    }

    const x = screenWidth + 50;
    const y = 50 + Math.random() * (screenHeight - 100);
    
    this.collectibles.push(new CollectibleEntity(x, y, type));
  }

  public spawnObstacle(screenWidth: number, screenHeight: number): void {
    const types: ('asteroid' | 'barrier' | 'mine')[] = ['asteroid', 'barrier', 'mine'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const x = screenWidth + 50;
    const y = 50 + Math.random() * (screenHeight - 100);
    
    this.obstacles.push(new ObstacleEntity(x, y, type));
  }

  public update(deltaTime: number): void {
    // Update collectibles
    this.collectibles.forEach(collectible => {
      if (collectible.active) {
        collectible.update(deltaTime);
      }
    });

    // Update obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.active) {
        obstacle.update(deltaTime);
      }
    });

    // Remove inactive entities
    this.collectibles = this.collectibles.filter(c => c.active);
    this.obstacles = this.obstacles.filter(o => o.active);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.collectibles.forEach(collectible => {
      if (collectible.active) {
        collectible.render(ctx);
      }
    });

    this.obstacles.forEach(obstacle => {
      if (obstacle.active) {
        obstacle.render(ctx);
      }
    });
  }

  public getCollectibles(): CollectibleEntity[] {
    return this.collectibles.filter(c => c.active);
  }

  public getObstacles(): ObstacleEntity[] {
    return this.obstacles.filter(o => o.active);
  }

  public clear(): void {
    this.collectibles = [];
    this.obstacles = [];
  }
}