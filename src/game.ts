import { GameLogic } from './game-logic.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { GameSettings, GameState, GAME_CONSTANTS } from './types.js';

export class Game {
  private gameLogic: GameLogic;
  private renderer: Renderer;
  private inputHandler: InputHandler;
  private settings: GameSettings;
  private lastMoveTime: number = 0;
  private animationId: number = 0;
  private gameStarted: boolean = false;
  
  // UI Elements
  private stageElement: HTMLElement;
  private levelElement: HTMLElement;
  private scoreElement: HTMLElement;
  private timerElement: HTMLElement;
  private keysCollectedElement: HTMLElement;
  private totalKeysElement: HTMLElement;

  constructor() {
    // Initialize settings
    this.settings = {
      tileSize: 40,
      canvasWidth: 600,
      canvasHeight: 600
    };

    // Get canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize UI elements
    this.stageElement = document.getElementById('stage')!;
    this.levelElement = document.getElementById('level')!;
    this.scoreElement = document.getElementById('score')!;
    this.timerElement = document.getElementById('timer')!;
    this.keysCollectedElement = document.getElementById('keysCollected')!;
    this.totalKeysElement = document.getElementById('totalKeys')!;

    // Initialize game systems
    this.gameLogic = new GameLogic();
    this.renderer = new Renderer(canvas, this.settings);
    this.inputHandler = new InputHandler();

    // Start game loop
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    
    // Skip first frame to avoid setup issues
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.animationId = requestAnimationFrame(this.gameLoop);
      return;
    }

    this.update(currentTime);
    this.render();
    this.updateUI();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(currentTime: number): void {
    // Handle input
    this.handleInput(currentTime);
    
    // Update game logic
    this.gameLogic.update(currentTime);
    
    // Handle firing
    this.gameLogic.updateFiring(currentTime);
  }

  private handleInput(currentTime: number): void {
    const gameState = this.gameLogic.getGameState();
    if (gameState !== GameState.PLAYING) return;

    // Handle movement (convert to milliseconds for comparison with Date.now())
    const movementDirection = this.inputHandler.getMovementDirection();
    if (movementDirection && this.canMove(Date.now())) {
      if (this.gameLogic.movePlayer(movementDirection)) {
        this.lastMoveTime = Date.now();
      }
    }

    // Handle firing
    const isFiring = this.inputHandler.isFirePressed();
    if (isFiring) {
      this.gameLogic.startFiring(currentTime);
    } else {
      this.gameLogic.stopFiring();
    }
  }

  private canMove(currentTime: number): boolean {
    return currentTime - this.lastMoveTime >= GAME_CONSTANTS.TIME_PLAYER_MOVE_COOLDOWN_MS;
  }

  private render(): void {
    const board = this.gameLogic.getBoard();
    const beam = this.gameLogic.getFlashlightBeam();
    const gameLevel = this.gameLogic.getGameLevel();
    
    this.renderer.render(board, beam, gameLevel.stage);
  }

  private updateUI(): void {
    const gameLevel = this.gameLogic.getGameLevel();
    const gameState = this.gameLogic.getGameState();

    this.stageElement.textContent = gameLevel.stage.toString();
    this.levelElement.textContent = gameLevel.level.toString();
    this.scoreElement.textContent = gameLevel.score.toString();
    this.timerElement.textContent = Math.ceil(gameLevel.timeRemaining).toString();
    this.keysCollectedElement.textContent = gameLevel.keysCollected.toString();
    this.totalKeysElement.textContent = gameLevel.keysRequired.toString();

    // Handle game over
    if (gameState === GameState.GAME_OVER) {
      this.handleGameOver();
    }
  }

  private handleGameOver(): void {
    // Only handle game over once
    if (this.animationId === 0) return;
    
    // Stop the game loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Show game over message
    setTimeout(() => {
      const gameLevel = this.gameLogic.getGameLevel();
      const message = gameLevel.stage > GAME_CONSTANTS.STAGES_COUNT 
        ? `Congratulations! You completed all stages!\nFinal Score: ${gameLevel.score}`
        : `Game Over!\nFinal Score: ${gameLevel.score}\n\nPress F5 to restart`;
      
      alert(message);
    }, 100);
  }

  // Public methods for external control if needed
  pause(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  resume(): void {
    if (!this.animationId) {
      this.gameLoop();
    }
  }

  destroy(): void {
    this.pause();
  }
}