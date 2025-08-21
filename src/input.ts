import { Direction } from './types.js';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  lastMoveTime: number;
}

export class InputHandler {
  private inputState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    lastMoveTime: 0
  };

  private keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    Space: 'fire'
  } as const;

  constructor() {
    this.setupKeyboardEvents();
    this.setupMobileControls();
  }

  private setupKeyboardEvents(): void {
    document.addEventListener('keydown', (event) => {
      const action = this.keyMap[event.code as keyof typeof this.keyMap];
      if (action) {
        event.preventDefault();
        (this.inputState as any)[action] = true;
      }
    });

    document.addEventListener('keyup', (event) => {
      const action = this.keyMap[event.code as keyof typeof this.keyMap];
      if (action) {
        event.preventDefault();
        (this.inputState as any)[action] = false;
      }
    });
  }

  private setupMobileControls(): void {
    const controls = document.querySelectorAll('.control-btn');
    
    controls.forEach(btn => {
      const key = btn.getAttribute('data-key');
      if (key) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleMobileInput(key, true);
        });
        
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleMobileInput(key, false);
        });
        
        // Also handle mouse events for testing on desktop
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.handleMobileInput(key, true);
        });
        
        btn.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.handleMobileInput(key, false);
        });
      }
    });
  }

  private handleMobileInput(key: string, pressed: boolean): void {
    switch (key) {
      case 'ArrowUp':
        this.inputState.up = pressed;
        break;
      case 'ArrowDown':
        this.inputState.down = pressed;
        break;
      case 'ArrowLeft':
        this.inputState.left = pressed;
        break;
      case 'ArrowRight':
        this.inputState.right = pressed;
        break;
      case 'Space':
        this.inputState.fire = pressed;
        break;
    }
  }

  getInputState(): InputState {
    return { ...this.inputState };
  }

  getMovementDirection(): Direction | null {
    if (this.inputState.up) return Direction.UP;
    if (this.inputState.down) return Direction.DOWN;
    if (this.inputState.left) return Direction.LEFT;
    if (this.inputState.right) return Direction.RIGHT;
    return null;
  }

  isFirePressed(): boolean {
    return this.inputState.fire;
  }

  canMove(currentTime: number, cooldown: number): boolean {
    return currentTime - this.inputState.lastMoveTime >= cooldown;
  }

  recordMove(currentTime: number): void {
    this.inputState.lastMoveTime = currentTime;
  }
}