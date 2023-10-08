import {Position} from "./position";

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

  public get distance(): number {
    return Math.sqrt(Math.pow(this.p1.x - this.p2.x, 2) + Math.pow(this.p1.y - this.p2.y, 2));
  }

  /**
   * Returns a point along the track line at the given percentage (0 - 1), with:
   * - 0 being p1
   * - 0.5 halfway point between p1 and p2
   * - 1 being p2
   */
  public pointAtPercentage(percentage: number): Position {
    const x = this.p1.x * (1 - percentage) + this.p2.x * (percentage);
    const y = this.p1.y * (1 - percentage) + this.p2.y * (percentage);
    return new Position(x, y);
  };
}
