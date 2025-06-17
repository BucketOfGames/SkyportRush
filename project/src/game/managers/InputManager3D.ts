export class InputManager3D {
  private keys: Map<string, boolean> = new Map();
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement;
  private isPointerLocked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.set(event.code, true);
    
    // Prevent default for game keys
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.set(event.code, false);
  };

  private handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private handlePointerLockError = (): void => {
    console.warn('Pointer lock failed');
  };

  public handleMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      // Use movementX/Y for smooth mouse look
      this.mouseDelta.x = event.movementX || 0;
      this.mouseDelta.y = event.movementY || 0;
    }
  }

  public isPressed(key: string): boolean {
    return this.keys.get(key) || false;
  }

  public getMouseDelta(): { x: number; y: number } {
    const delta = { ...this.mouseDelta };
    // Reset delta after reading
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  public requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  public isPointerLockActive(): boolean {
    return this.isPointerLocked;
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);
  }
}