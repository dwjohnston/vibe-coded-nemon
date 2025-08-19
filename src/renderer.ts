import { 
  GameBoard, 
  GameEntity, 
  EntityType, 
  Direction, 
  Position, 
  GameSettings,
  KeyVisibility 
} from './types.js';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: GameSettings;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    
    // Set canvas size
    this.canvas.width = settings.canvasWidth;
    this.canvas.height = settings.canvasHeight;
  }

  render(board: GameBoard, flashlightBeam: Position[], stage: number): void {
    this.clearCanvas();
    this.drawBoard(board);
    this.drawEntities(board, stage);
    this.drawFlashlightBeam(flashlightBeam);
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBoard(board: GameBoard): void {
    // Draw grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= board.width; x++) {
      const pixelX = x * this.settings.tileSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pixelX, 0);
      this.ctx.lineTo(pixelX, board.height * this.settings.tileSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= board.height; y++) {
      const pixelY = y * this.settings.tileSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, pixelY);
      this.ctx.lineTo(board.width * this.settings.tileSize, pixelY);
      this.ctx.stroke();
    }
  }

  private drawEntities(board: GameBoard, stage: number): void {
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const entity = board.tiles[y][x];
        if (entity) {
          this.drawEntity(entity, stage);
        }
      }
    }
  }

  private drawEntity(entity: GameEntity, stage: number): void {
    const x = entity.position.x * this.settings.tileSize;
    const y = entity.position.y * this.settings.tileSize;
    const size = this.settings.tileSize;

    this.ctx.save();

    switch (entity.type) {
      case EntityType.FLASHLIGHT:
        this.drawFlashlight(x, y, size, entity.direction!);
        break;
      case EntityType.BLOCK:
        this.drawBlock(x, y, size);
        break;
      case EntityType.DRAGON:
        this.drawDragon(x, y, size, entity.direction!);
        break;
      case EntityType.FIREBALL:
        this.drawFireball(x, y, size);
        break;
      case EntityType.FIRE:
        this.drawFire(x, y, size);
        break;
      case EntityType.KEY:
        this.drawKey(x, y, size, entity, stage);
        break;
    }

    this.ctx.restore();
  }

  private drawFlashlight(x: number, y: number, size: number, direction: Direction): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.3;

    // Draw flashlight body
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw directional indicator
    this.ctx.fillStyle = '#FF4444';
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    
    switch (direction) {
      case Direction.UP:
        this.ctx.rotate(-Math.PI / 2);
        break;
      case Direction.DOWN:
        this.ctx.rotate(Math.PI / 2);
        break;
      case Direction.LEFT:
        this.ctx.rotate(Math.PI);
        break;
      case Direction.RIGHT:
        // No rotation needed
        break;
    }
    
    this.ctx.fillRect(radius * 0.5, -radius * 0.2, radius * 0.6, radius * 0.4);
    this.ctx.restore();
  }

  private drawBlock(x: number, y: number, size: number): void {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // Add some texture
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }

  private drawDragon(x: number, y: number, size: number, direction: Direction): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Dragon body
    this.ctx.fillStyle = '#8B0000';
    this.ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
    
    // Dragon head (direction indicator)
    this.ctx.fillStyle = '#FF0000';
    let headX = centerX;
    let headY = centerY;
    
    switch (direction) {
      case Direction.UP:
        headY -= size * 0.3;
        break;
      case Direction.DOWN:
        headY += size * 0.3;
        break;
      case Direction.LEFT:
        headX -= size * 0.3;
        break;
      case Direction.RIGHT:
        headX += size * 0.3;
        break;
    }
    
    this.ctx.beginPath();
    this.ctx.arc(headX, headY, size * 0.15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFireball(x: number, y: number, size: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.25;

    // Outer glow
    this.ctx.fillStyle = '#FF4500';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner core
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFire(x: number, y: number, size: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Draw flickering fire effect
    this.ctx.fillStyle = '#FF6600';
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * size * 0.3;
      const offsetY = (Math.random() - 0.5) * size * 0.3;
      const radius = size * (0.15 + Math.random() * 0.1);
      
      this.ctx.beginPath();
      this.ctx.arc(centerX + offsetX, centerY + offsetY, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawKey(x: number, y: number, size: number, entity: GameEntity, stage: number): void {
    // Determine visibility based on stage and entity properties
    let visible = true;
    
    if (stage === 2) {
      visible = entity.visibility === KeyVisibility.VISIBLE || entity.visibility === KeyVisibility.ILLUMINATED;
    } else if (stage === 3) {
      visible = entity.visibility === KeyVisibility.ILLUMINATED;
    }

    if (!visible) return;

    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Key color based on number
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    const colorIndex = ((entity.keyNumber || 1) - 1) % colors.length;
    
    this.ctx.fillStyle = colors[colorIndex];
    
    // Draw key shape (simplified)
    this.ctx.fillRect(centerX - size * 0.1, centerY - size * 0.3, size * 0.2, size * 0.4);
    this.ctx.fillRect(centerX - size * 0.2, centerY - size * 0.3, size * 0.4, size * 0.15);
    
    // Key number
    this.ctx.fillStyle = '#000';
    this.ctx.font = `${size * 0.3}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      (entity.keyNumber || 1).toString(), 
      centerX, 
      centerY + size * 0.1
    );
  }

  private drawFlashlightBeam(beamPositions: Position[]): void {
    if (beamPositions.length === 0) return;

    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    
    beamPositions.forEach(pos => {
      const x = pos.x * this.settings.tileSize;
      const y = pos.y * this.settings.tileSize;
      this.ctx.fillRect(x, y, this.settings.tileSize, this.settings.tileSize);
    });
  }
}