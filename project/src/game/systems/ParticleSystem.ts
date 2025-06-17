import { Particle } from '../../types/game';

class ParticleEntity implements Particle {
  public position = { x: 0, y: 0 };
  public velocity = { x: 0, y: 0 };
  public life: number;
  public maxLife: number;
  public size: number;
  public color: string;
  public alpha: number = 1;
  public gravity: number = 0;

  constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = vx;
    this.velocity.y = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
  }

  update(deltaTime: number): void {
    this.life -= deltaTime;
    this.alpha = this.life / this.maxLife;
    
    this.velocity.y += this.gravity * deltaTime;
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    
    ctx.beginPath();
    ctx.ellipse(this.position.x, this.position.y, this.size, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class ParticleSystem {
  private particles: ParticleEntity[] = [];
  private backgroundParticles: ParticleEntity[] = [];

  constructor() {
    this.createStarField();
  }

  private createStarField(): void {
    // Create background stars
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 2000;
      const y = Math.random() * 1000;
      const size = Math.random() * 2 + 0.5;
      const speed = -20 - Math.random() * 30;
      
      const star = new ParticleEntity(x, y, speed, 0, Infinity, size, '#ffffff');
      star.alpha = 0.3 + Math.random() * 0.7;
      this.backgroundParticles.push(star);
    }
  }

  public createEngineTrail(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const vx = -200 - Math.random() * 100;
      const vy = (Math.random() - 0.5) * 50;
      const life = 0.5 + Math.random() * 0.5;
      const size = 2 + Math.random() * 4;
      const colors = ['#f59e0b', '#f97316', '#ef4444'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.particles.push(new ParticleEntity(x, y, vx, vy, life, size, color));
    }
  }

  public createCollectionEffect(x: number, y: number, type: string): void {
    const colors = {
      fuel: '#10b981',
      crystal: '#8b5cf6',
      powerup: '#f59e0b'
    };

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 1 + Math.random() * 0.5;
      const size = 3 + Math.random() * 3;
      
      const particle = new ParticleEntity(x, y, vx, vy, life, size, colors[type as keyof typeof colors] || '#ffffff');
      particle.gravity = 100;
      this.particles.push(particle);
    }
  }

  public createExplosion(x: number, y: number): void {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.8 + Math.random() * 0.7;
      const size = 4 + Math.random() * 6;
      const colors = ['#ef4444', '#f97316', '#fbbf24'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = new ParticleEntity(x, y, vx, vy, life, size, color);
      particle.gravity = 200;
      this.particles.push(particle);
    }
  }

  public update(deltaTime: number): void {
    // Update regular particles
    this.particles.forEach(particle => {
      particle.update(deltaTime);
    });

    // Update background particles (stars)
    this.backgroundParticles.forEach(particle => {
      particle.update(deltaTime);
      
      // Reset stars that have moved off screen
      if (particle.position.x < -100) {
        particle.position.x = 2000 + Math.random() * 200;
        particle.position.y = Math.random() * 1000;
      }
    });

    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Render background stars
    this.backgroundParticles.forEach(particle => {
      particle.render(ctx);
    });
  }

  public renderForeground(ctx: CanvasRenderingContext2D): void {
    // Render foreground particles
    this.particles.forEach(particle => {
      particle.render(ctx);
    });
  }
}