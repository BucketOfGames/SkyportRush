import { Vector2D, Player as IPlayer } from '../../types/game';
import { InputManager } from '../managers/InputManager';

export class Player implements IPlayer {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: Vector2D;
  public active: boolean = true;
  public health: number = 100;
  public maxHealth: number = 100;
  public invulnerable: boolean = false;
  public invulnerabilityTime: number = 0;
  public thrust: number = 0;
  public rotation: number = 0;

  private readonly maxSpeed: number = 400;
  private readonly acceleration: number = 800;
  private readonly friction: number = 0.95;
  private readonly rotationSpeed: number = 4;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.size = { x: 40, y: 20 };
  }

  public update(deltaTime: number, inputManager: InputManager): void {
    this.handleInput(deltaTime, inputManager);
    this.updateMovement(deltaTime);
    this.updateInvulnerability(deltaTime);
  }

  private handleInput(deltaTime: number, inputManager: InputManager): void {
    // Rotation
    if (inputManager.isPressed('left')) {
      this.rotation -= this.rotationSpeed * deltaTime;
    }
    if (inputManager.isPressed('right')) {
      this.rotation += this.rotationSpeed * deltaTime;
    }

    // Thrust
    if (inputManager.isPressed('thrust')) {
      this.thrust = 1;
      const thrustForce = this.acceleration * deltaTime;
      this.velocity.x += Math.cos(this.rotation) * thrustForce;
      this.velocity.y += Math.sin(this.rotation) * thrustForce;
    } else {
      this.thrust = 0;
    }

    // Limit speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
    }
  }

  private updateMovement(deltaTime: number): void {
    // Apply friction
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  private updateInvulnerability(deltaTime: number): void {
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
      }
    }
  }

  public takeDamage(): void {
    if (!this.invulnerable) {
      this.health -= 20;
      this.invulnerable = true;
      this.invulnerabilityTime = 2; // 2 seconds of invulnerability
    }
  }

  public collidesWith(other: any): boolean {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (this.size.x + other.size.x) / 2;
    return distance < minDistance;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Apply invulnerability effect
    if (this.invulnerable) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
    }

    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Ship body
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Engine glow when thrusting
    if (this.thrust > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-15, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cockpit
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(5, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}