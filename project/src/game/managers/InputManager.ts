export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private keyMappings: Map<string, string> = new Map([
    ['KeyW', 'thrust'],
    ['ArrowUp', 'thrust'],
    ['KeyA', 'left'],
    ['ArrowLeft', 'left'],
    ['KeyD', 'right'],
    ['ArrowRight', 'right'],
    ['KeyS', 'brake'],
    ['ArrowDown', 'brake'],
    ['Space', 'thrust']
  ]);

  private handleKeyDown = (event: KeyboardEvent): void => {
    const action = this.keyMappings.get(event.code);
    if (action) {
      event.preventDefault();
      this.keys.set(action, true);
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const action = this.keyMappings.get(event.code);
    if (action) {
      event.preventDefault();
      this.keys.set(action, false);
    }
  };

  public bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public unbindEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public isPressed(action: string): boolean {
    return this.keys.get(action) || false;
  }
}