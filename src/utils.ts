import { Position, Direction } from './types.js';

export class Utils {
  static getPositionInDirection(pos: Position, direction: Direction): Position {
    switch (direction) {
      case Direction.UP:
        return { x: pos.x, y: pos.y - 1 };
      case Direction.DOWN:
        return { x: pos.x, y: pos.y + 1 };
      case Direction.LEFT:
        return { x: pos.x - 1, y: pos.y };
      case Direction.RIGHT:
        return { x: pos.x + 1, y: pos.y };
      default:
        return pos;
    }
  }

  static isValidPosition(pos: Position, boardWidth: number, boardHeight: number): boolean {
    return pos.x >= 0 && pos.x < boardWidth && pos.y >= 0 && pos.y < boardHeight;
  }

  static getDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  static getDirectionTowards(from: Position, to: Position): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      return dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  static getRandomDirection(): Direction {
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  static getRandomPosition(boardWidth: number, boardHeight: number): Position {
    return {
      x: Math.floor(Math.random() * boardWidth),
      y: Math.floor(Math.random() * boardHeight)
    };
  }

  static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}