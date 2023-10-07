import {Position} from "./position";
import {Circle} from "./circle";

export class Triangle {
  readonly p1: Position;
  readonly p2: Position;
  readonly p3: Position;

  constructor(p1: Position, p2: Position, p3: Position) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  public static of(p1: Position, p2: Position, p3: Position): Triangle {
    return new Triangle(p1, p2, p3);
  }
}
