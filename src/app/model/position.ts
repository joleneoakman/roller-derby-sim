import {Vector} from "./vector";

export class Position implements Vector {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public static of(x: number, y: number): Position {
    return new Position(x, y);
  }

  public plus(v: Position): Position {
    return Position.of(this.x + v.x, this.y + v.y);
  }

  public minus(v: Position): Position {
    return Position.of(this.x - v.x, this.y - v.y);
  }

  public times(factor: number): Position {
    return Position.of(this.x * factor, this.y * factor);
  }

  public get distance(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public distanceTo(v: Position): number {
    return this.minus(v).distance;
  }

  equals(p1: Position) {
    return this.x === p1.x && this.y === p1.y;
  }
}
