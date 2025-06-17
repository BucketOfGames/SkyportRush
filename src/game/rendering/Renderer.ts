export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public clear(width: number, height: number): void {
    // Create dynamic gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a'); // Dark blue
    gradient.addColorStop(0.5, '#1e3a8a'); // Medium blue
    gradient.addColorStop(1, '#1e40af'); // Lighter blue
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  public renderBackground(width: number, height: number): void {
    // Add subtle nebula effect
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    
    const time = Date.now() * 0.001;
    for (let i = 0; i < 3; i++) {
      const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 0.3 + i) * 0.5 + 0.5) * height;
      const radius = 200 + Math.sin(time + i) * 50;
      
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#67e8f9');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);
    }
    
    this.ctx.restore();
  }
}