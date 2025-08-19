// Game constants extracted from requirements
export const GAME_CONSTANTS = {
  // Board dimensions
  N_TILES_WIDTH: 15,
  N_TILES_HEIGHT: 15,
  
  // Player movement
  TIME_PLAYER_MOVE_COOLDOWN_MS: 100,
  
  // Scoring
  POINTS_COLLECT_KEY: 200,
  POINTS_COMPLETE_LEVEL: 1000,
  POINTS_DESTROY_BLOCK: 100,
  POINTS_DESTROY_DRAGON: 1000,
  POINTS_SERIAL_DESTROY_FACTOR: 1.5,
  
  // Timing
  TIME_LEVEL_INIT_TIME_SECONDS: 30,
  TIME_NEW_BLOCK_INTERVAL_MS: 1000,
  TIME_BLOCK_DESTROY_TIME_MS: 100,
  TIME_BLOCK_DESTROY_TIME_AWARD_SECONDS: 1,
  
  // Dragon behavior
  TIME_DRAGON_MOVE_MS: 200,
  TIME_DRAGON_FIRE_MS: 300,
  TIME_DRAGON_RESPAWN_SECONDS: 30,
  
  // Fireball and fire
  TIME_FIREBALL_MOVE_SPEED_MS: 50,
  TIME_FIRE_BURN_MIN_MS: 3000,
  TIME_FIRE_BURN_MAX_MS: 5000,
  
  // Game structure
  STAGES_COUNT: 3,
  LEVELS_PER_STAGE: 7,
  INITIAL_KEYS_COUNT: 3
} as const;

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum EntityType {
  EMPTY = 'EMPTY',
  FLASHLIGHT = 'FLASHLIGHT',
  BLOCK = 'BLOCK',
  DRAGON = 'DRAGON',
  FIREBALL = 'FIREBALL',
  FIRE = 'FIRE',
  KEY = 'KEY'
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  PAUSED = 'PAUSED'
}

export enum KeyVisibility {
  VISIBLE = 'VISIBLE',
  INVISIBLE = 'INVISIBLE',
  ILLUMINATED = 'ILLUMINATED'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  type: EntityType;
  position: Position;
  direction?: Direction;
  id?: string;
}

export interface GameEntity extends Entity {
  createdAt?: number;
  destroyAt?: number;
  health?: number;
  keyNumber?: number;
  visibility?: KeyVisibility;
}

export interface GameBoard {
  width: number;
  height: number;
  tiles: (GameEntity | null)[][];
}

export interface GameLevel {
  stage: number;
  level: number;
  keysRequired: number;
  keysCollected: number;
  timeRemaining: number;
  score: number;
}

export interface GameSettings {
  tileSize: number;
  canvasWidth: number;
  canvasHeight: number;
}