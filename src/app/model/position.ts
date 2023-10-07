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
}
