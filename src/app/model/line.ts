import {Position} from "./position";
import {Circle} from "./circle";
import {MathTools} from "../util/math-tools";

export class Line {
  readonly p1: Position;
  readonly p2: Position;

  constructor(p1: Position, p2: Position) {
    this.p1 = p1;
    this.p2 = p2;
  }

  public static of(p1: Position, p2: Position): Line {
    return new Line(p1, p2);
  }
}
