import {
  GameBoard,
  GameEntity,
  GameLevel,
  EntityType,
  Direction,
  Position,
  GameState,
  KeyVisibility,
  GAME_CONSTANTS
} from './types.js';
import { Utils } from './utils.js';

export class GameLogic {
  private board: GameBoard;
  private gameLevel: GameLevel;
  private gameState: GameState;
  private entities: Map<string, GameEntity>;
  private flashlight: GameEntity | null = null;
  private dragon: GameEntity | null = null;
  private dragonRespawnTime: number = 0;
  private lastBlockSpawnTime: number = 0;
  private lastDragonMoveTime: number = 0;
  private lastDragonFireTime: number = 0;
  private serialDestroyCount: number = 0;
  private fireStartTime: number = 0;
  private destroyingBlocks: boolean = false;

  constructor() {
    this.board = this.createEmptyBoard();
    this.entities = new Map();
    this.gameLevel = {
      stage: 1,
      level: 1,
      keysRequired: GAME_CONSTANTS.INITIAL_KEYS_COUNT,
      keysCollected: 0,
      timeRemaining: GAME_CONSTANTS.TIME_LEVEL_INIT_TIME_SECONDS,
      score: 0
    };
    this.gameState = GameState.PLAYING;
    this.initializeLevel();
  }

  private createEmptyBoard(): GameBoard {
    const tiles: (GameEntity | null)[][] = [];
    for (let y = 0; y < GAME_CONSTANTS.N_TILES_HEIGHT; y++) {
      tiles[y] = new Array(GAME_CONSTANTS.N_TILES_WIDTH).fill(null);
    }
    
    return {
      width: GAME_CONSTANTS.N_TILES_WIDTH,
      height: GAME_CONSTANTS.N_TILES_HEIGHT,
      tiles
    };
  }

  private initializeLevel(): void {
    // Clear board and entities
    this.clearBoard();
    this.entities.clear();
    
    // Place flashlight at center
    const flashlightPos = {
      x: Math.floor(GAME_CONSTANTS.N_TILES_WIDTH / 2),
      y: Math.floor(GAME_CONSTANTS.N_TILES_HEIGHT / 2)
    };
    
    this.flashlight = {
      type: EntityType.FLASHLIGHT,
      position: flashlightPos,
      direction: Direction.UP,
      id: Utils.generateId()
    };
    
    this.placeEntity(this.flashlight);
    
    // Place dragon
    this.spawnDragon();
    
    // Place keys
    this.placeKeys();
    
    // Reset timers
    this.lastBlockSpawnTime = Date.now();
    this.lastDragonMoveTime = Date.now();
    this.lastDragonFireTime = Date.now();
  }

  private clearBoard(): void {
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        this.board.tiles[y][x] = null;
      }
    }
  }

  private spawnDragon(): void {
    if (this.dragon) return;
    
    let position: Position;
    let attempts = 0;
    
    do {
      position = Utils.getRandomPosition(this.board.width, this.board.height);
      attempts++;
    } while (this.board.tiles[position.y][position.x] !== null && attempts < 100);
    
    if (attempts < 100) {
      this.dragon = {
        type: EntityType.DRAGON,
        position,
        direction: Utils.getRandomDirection(),
        id: Utils.generateId()
      };
      
      this.placeEntity(this.dragon);
    }
  }

  private placeKeys(): void {
    const keyVisibility = this.gameLevel.stage === 1 ? 
      KeyVisibility.VISIBLE : KeyVisibility.INVISIBLE;
    
    for (let i = 1; i <= this.gameLevel.keysRequired; i++) {
      let position: Position;
      let attempts = 0;
      
      do {
        position = Utils.getRandomPosition(this.board.width, this.board.height);
        attempts++;
      } while (this.board.tiles[position.y][position.x] !== null && attempts < 100);
      
      if (attempts < 100) {
        const key: GameEntity = {
          type: EntityType.KEY,
          position,
          keyNumber: i,
          visibility: keyVisibility,
          id: Utils.generateId()
        };
        
        this.placeEntity(key);
      }
    }
  }

  private placeEntity(entity: GameEntity): void {
    if (Utils.isValidPosition(entity.position, this.board.width, this.board.height)) {
      this.board.tiles[entity.position.y][entity.position.x] = entity;
      if (entity.id) {
        this.entities.set(entity.id, entity);
      }
    }
  }

  private removeEntity(entity: GameEntity): void {
    if (Utils.isValidPosition(entity.position, this.board.width, this.board.height)) {
      this.board.tiles[entity.position.y][entity.position.x] = null;
      if (entity.id) {
        this.entities.delete(entity.id);
      }
    }
  }

  update(deltaTime: number): void {
    if (this.gameState !== GameState.PLAYING) return;
    
    const currentTime = Date.now();
    
    // Cap delta time to prevent large jumps (like when page loads)
    const cappedDelta = Math.min(deltaTime, 100); // Max 100ms per frame
    
    // Update timer
    const timeDecrement = cappedDelta / 1000;
    this.gameLevel.timeRemaining -= timeDecrement;
    
    // Debug logging (remove in production)
    if (cappedDelta > 16) { // Log only if frame time is unusually high
      console.log(`Delta: ${deltaTime}ms, Capped: ${cappedDelta}ms, Time remaining: ${this.gameLevel.timeRemaining}s`);
    }
    
    // Check game over conditions
    if (this.gameLevel.timeRemaining <= 0) {
      this.fillBoardWithBlocks();
      this.gameState = GameState.GAME_OVER;
      return;
    }
    
    // Spawn blocks periodically
    if (currentTime - this.lastBlockSpawnTime >= GAME_CONSTANTS.TIME_NEW_BLOCK_INTERVAL_MS) {
      this.spawnBlock();
      this.lastBlockSpawnTime = currentTime;
    }
    
    // Update dragon
    this.updateDragon(currentTime);
    
    // Update fires
    this.updateFires(currentTime);
    
    // Update fireballs
    this.updateFireballs(currentTime);
    
    // Check level completion
    if (this.gameLevel.keysCollected >= this.gameLevel.keysRequired) {
      console.log(`Level complete! Keys: ${this.gameLevel.keysCollected}/${this.gameLevel.keysRequired}`);
      this.completeLevel();
    }
    
    // Respawn dragon if needed
    if (!this.dragon && currentTime >= this.dragonRespawnTime) {
      this.spawnDragon();
    }
  }

  private spawnBlock(): void {
    let position: Position;
    let attempts = 0;
    
    do {
      position = Utils.getRandomPosition(this.board.width, this.board.height);
      attempts++;
    } while (this.board.tiles[position.y][position.x] !== null && attempts < 100);
    
    if (attempts < 100) {
      const block: GameEntity = {
        type: EntityType.BLOCK,
        position,
        id: Utils.generateId()
      };
      
      this.placeEntity(block);
    }
  }

  private fillBoardWithBlocks(): void {
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        if (this.board.tiles[y][x] === null) {
          const block: GameEntity = {
            type: EntityType.BLOCK,
            position: { x, y },
            id: Utils.generateId()
          };
          this.placeEntity(block);
        }
      }
    }
  }

  private updateDragon(currentTime: number): void {
    if (!this.dragon || !this.flashlight) return;
    
    // Dragon movement
    if (currentTime - this.lastDragonMoveTime >= GAME_CONSTANTS.TIME_DRAGON_MOVE_MS) {
      this.moveDragon();
      this.lastDragonMoveTime = currentTime;
    }
    
    // Dragon firing
    if (currentTime - this.lastDragonFireTime >= GAME_CONSTANTS.TIME_DRAGON_FIRE_MS) {
      this.dragonFire();
      this.lastDragonFireTime = currentTime;
    }
  }

  private moveDragon(): void {
    if (!this.dragon || !this.flashlight) return;
    
    // Bias towards flashlight, but with some randomness
    const shouldMoveTowardsFlashlight = Math.random() < 0.7;
    let newDirection: Direction;
    
    if (shouldMoveTowardsFlashlight) {
      newDirection = Utils.getDirectionTowards(this.dragon.position, this.flashlight.position);
    } else {
      newDirection = Utils.getRandomDirection();
    }
    
    const newPosition = Utils.getPositionInDirection(this.dragon.position, newDirection);
    
    if (Utils.isValidPosition(newPosition, this.board.width, this.board.height) &&
        this.board.tiles[newPosition.y][newPosition.x] === null) {
      
      this.removeEntity(this.dragon);
      this.dragon.position = newPosition;
      this.dragon.direction = newDirection;
      this.placeEntity(this.dragon);
    } else {
      // Just change direction if can't move
      this.dragon.direction = newDirection;
    }
  }

  private dragonFire(): void {
    if (!this.dragon || !this.flashlight) return;
    
    // Check if dragon is adjacent to flashlight and facing it
    const dragonPos = this.dragon.position;
    const flashlightPos = this.flashlight.position;
    const targetPos = Utils.getPositionInDirection(dragonPos, this.dragon.direction!);
    
    if (targetPos.x === flashlightPos.x && targetPos.y === flashlightPos.y) {
      // Dragon kills player
      this.gameState = GameState.GAME_OVER;
      return;
    }
    
    // Check if dragon is adjacent to any other entity and facing it
    if (Utils.isValidPosition(targetPos, this.board.width, this.board.height) &&
        this.board.tiles[targetPos.y][targetPos.x] !== null) {
      // Move instead of firing
      this.moveDragon();
      return;
    }
    
    // Fire fireball
    const fireball: GameEntity = {
      type: EntityType.FIREBALL,
      position: { ...dragonPos },
      direction: this.dragon.direction!,
      id: Utils.generateId(),
      createdAt: Date.now()
    };
    
    this.entities.set(fireball.id!, fireball);
  }

  private updateFireballs(currentTime: number): void {
    const fireballs = Array.from(this.entities.values())
      .filter(entity => entity.type === EntityType.FIREBALL);
    
    fireballs.forEach(fireball => {
      if (!fireball.createdAt || !fireball.direction) return;
      
      const timeSinceCreated = currentTime - fireball.createdAt;
      const moveInterval = GAME_CONSTANTS.TIME_FIREBALL_MOVE_SPEED_MS;
      
      if (timeSinceCreated >= moveInterval) {
        this.moveFireball(fireball);
        fireball.createdAt = currentTime;
      }
    });
  }

  private moveFireball(fireball: GameEntity): void {
    if (!fireball.direction) return;
    
    const newPosition = Utils.getPositionInDirection(fireball.position, fireball.direction);
    
    // Stop at random position or when hitting something
    if (!Utils.isValidPosition(newPosition, this.board.width, this.board.height) ||
        this.board.tiles[newPosition.y][newPosition.x] !== null ||
        Math.random() < 0.3) {
      
      // Convert to fire
      const fire: GameEntity = {
        type: EntityType.FIRE,
        position: fireball.position,
        id: Utils.generateId(),
        createdAt: Date.now(),
        destroyAt: Date.now() + Utils.getRandomInt(
          GAME_CONSTANTS.TIME_FIRE_BURN_MIN_MS,
          GAME_CONSTANTS.TIME_FIRE_BURN_MAX_MS
        )
      };
      
      this.entities.delete(fireball.id!);
      this.placeEntity(fire);
      return;
    }
    
    // Move fireball
    fireball.position = newPosition;
  }

  private updateFires(currentTime: number): void {
    const fires = Array.from(this.entities.values())
      .filter(entity => entity.type === EntityType.FIRE);
    
    fires.forEach(fire => {
      if (fire.destroyAt && currentTime >= fire.destroyAt) {
        this.removeEntity(fire);
      }
    });
  }

  private completeLevel(): void {
    this.gameLevel.score += GAME_CONSTANTS.POINTS_COMPLETE_LEVEL;
    this.gameLevel.level++;
    
    if (this.gameLevel.level > GAME_CONSTANTS.LEVELS_PER_STAGE) {
      // Next stage
      this.gameLevel.stage++;
      this.gameLevel.level = 1;
      
      if (this.gameLevel.stage > GAME_CONSTANTS.STAGES_COUNT) {
        // Game complete
        this.gameState = GameState.GAME_OVER;
        return;
      }
    }
    
    // Increase keys required
    this.gameLevel.keysRequired = GAME_CONSTANTS.INITIAL_KEYS_COUNT + (this.gameLevel.level - 1);
    this.gameLevel.keysCollected = 0;
    this.gameLevel.timeRemaining = GAME_CONSTANTS.TIME_LEVEL_INIT_TIME_SECONDS;
    
    this.initializeLevel();
  }

  // Public methods for game control
  movePlayer(direction: Direction): boolean {
    if (!this.flashlight || this.gameState !== GameState.PLAYING) return false;
    
    const newPosition = Utils.getPositionInDirection(this.flashlight.position, direction);
    
    if (!Utils.isValidPosition(newPosition, this.board.width, this.board.height)) {
      // Just change direction
      this.flashlight.direction = direction;
      return true;
    }
    
    const targetEntity = this.board.tiles[newPosition.y][newPosition.x];
    
    if (targetEntity === null) {
      // Move to empty space
      this.removeEntity(this.flashlight);
      this.flashlight.position = newPosition;
      this.flashlight.direction = direction;
      this.placeEntity(this.flashlight);
      return true;
    } else if (targetEntity.type === EntityType.KEY) {
      // Collect key
      if (targetEntity.keyNumber === this.gameLevel.keysCollected + 1) {
        this.collectKey(targetEntity);
        this.removeEntity(this.flashlight);
        this.flashlight.position = newPosition;
        this.flashlight.direction = direction;
        this.placeEntity(this.flashlight);
        return true;
      } else {
        // Wrong key, just change direction
        this.flashlight.direction = direction;
        return true;
      }
    } else {
      // Blocked, just change direction
      this.flashlight.direction = direction;
      return true;
    }
  }

  private collectKey(key: GameEntity): void {
    this.removeEntity(key);
    this.gameLevel.keysCollected++;
    this.gameLevel.score += GAME_CONSTANTS.POINTS_COLLECT_KEY;
  }

  startFiring(): void {
    if (this.gameState !== GameState.PLAYING) return;
    
    this.destroyingBlocks = true;
    this.serialDestroyCount = 0;
    this.fireStartTime = Date.now();
  }

  stopFiring(): void {
    this.destroyingBlocks = false;
  }

  updateFiring(): void {
    if (!this.destroyingBlocks || !this.flashlight) return;
    
    const currentTime = Date.now();
    const beamPositions = this.getFlashlightBeam();
    
    // Check if enough time has passed to destroy next block
    if (currentTime - this.fireStartTime >= GAME_CONSTANTS.TIME_BLOCK_DESTROY_TIME_MS) {
      const targetPosition = beamPositions.find(pos => {
        const entity = this.board.tiles[pos.y][pos.x];
        return entity && (entity.type === EntityType.BLOCK || entity.type === EntityType.DRAGON);
      });
      
      if (targetPosition) {
        const targetEntity = this.board.tiles[targetPosition.y][targetPosition.x]!;
        this.destroyEntity(targetEntity);
        this.fireStartTime = currentTime;
      }
    }
  }

  private destroyEntity(entity: GameEntity): void {
    let points = 0;
    
    if (entity.type === EntityType.BLOCK) {
      points = GAME_CONSTANTS.POINTS_DESTROY_BLOCK;
      this.gameLevel.timeRemaining += GAME_CONSTANTS.TIME_BLOCK_DESTROY_TIME_AWARD_SECONDS;
    } else if (entity.type === EntityType.DRAGON) {
      points = GAME_CONSTANTS.POINTS_DESTROY_DRAGON;
      this.dragon = null;
      this.dragonRespawnTime = Date.now() + (GAME_CONSTANTS.TIME_DRAGON_RESPAWN_SECONDS * 1000);
    }
    
    // Apply serial destroy bonus
    const bonus = Math.pow(GAME_CONSTANTS.POINTS_SERIAL_DESTROY_FACTOR, this.serialDestroyCount);
    points = Math.floor(points * bonus);
    
    this.gameLevel.score += points;
    this.serialDestroyCount++;
    
    this.removeEntity(entity);
  }

  getFlashlightBeam(): Position[] {
    if (!this.flashlight) return [];
    
    const beam: Position[] = [];
    let currentPos = Utils.getPositionInDirection(this.flashlight.position, this.flashlight.direction!);
    
    while (Utils.isValidPosition(currentPos, this.board.width, this.board.height)) {
      beam.push({ ...currentPos });
      
      const entity = this.board.tiles[currentPos.y][currentPos.x];
      if (entity) {
        // Update key visibility for stages 2 and 3
        if (entity.type === EntityType.KEY) {
          if (this.gameLevel.stage === 2) {
            entity.visibility = KeyVisibility.ILLUMINATED;
          } else if (this.gameLevel.stage === 3) {
            // Only visible while beam is on it - handled in renderer
            entity.visibility = KeyVisibility.ILLUMINATED;
          }
        }
        break; // Beam stops at first entity
      }
      
      currentPos = Utils.getPositionInDirection(currentPos, this.flashlight.direction!);
    }
    
    // Reset key visibility for stage 3 keys not in beam
    if (this.gameLevel.stage === 3) {
      this.entities.forEach(entity => {
        if (entity.type === EntityType.KEY && 
            !beam.some(pos => pos.x === entity.position.x && pos.y === entity.position.y)) {
          entity.visibility = KeyVisibility.INVISIBLE;
        }
      });
    }
    
    return beam;
  }

  // Getters
  getBoard(): GameBoard { return this.board; }
  getGameLevel(): GameLevel { return { ...this.gameLevel }; }
  getGameState(): GameState { return this.gameState; }
}