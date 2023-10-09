import {Position} from "./position";
import {TrackLineShape} from "./trackLineShape";
import {MathTools} from "../util/math-tools";

export class Line implements TrackLineShape {
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

  public distanceAlong(target: Position): number {
    return this.getRelativePositionOf(target) * this.distance;
  }

  public getClosestPointTo(p: Position): Position {
    const p1 = this.p1;
    const p2 = this.p2;
    const lineLen = p1.distanceTo(p2);
    const t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / (lineLen * lineLen);

    const tClamped = MathTools.limit(t, 0, 1);

    const closestX = p1.x + tClamped * (p2.x - p1.x);
    const closestY = p1.y + tClamped * (p2.y - p1.y);
    return Position.of(closestX, closestY);
  }

    /**
   * Returns a point along the track line at the given percentage (0 - 1), with:
   * - 0 being p1
   * - 0.5 halfway point between p1 and p2
   * - 1 being p2
   */
  public getAbsolutePositionOf(percentage: number): Position {
    const x = this.p1.x * (1 - percentage) + this.p2.x * (percentage);
    const y = this.p1.y * (1 - percentage) + this.p2.y * (percentage);
    return new Position(x, y);
  };

  /**
   * Returns the percentage (0..1) from the start position (p1) of line to the target position.
   * The target position must be on the line between p1 and p2.
   */
  public getRelativePositionOf(target: Position): number {
    if (target.equals(this.p1)) {
      return 0;
    }
    if (target.equals(this.p2)) {
      return 1;
    }

    // Calculate vector from p1 to p2
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;

    // Calculate vector from p1 to target
    const dxt = target.x - this.p1.x;
    const dyt = target.y - this.p1.y;

    // Calculate the length of the line segment
    const length = this.distance;

    // Calculate the dot product of (p1 to p2) and (p1 to target)
    const dotProduct = dx * dxt + dy * dyt;

    // Calculate the percentage
    return dotProduct / (length * length);
  }

  /**
   * For the given line, find the y coordinate for the given x coordinate.
   */
  public resolveY(x: number): number {
    const x1 = this.p1.x;
    const y1 = this.p1.y;
    const x2 = this.p2.x;
    const y2 = this.p2.y;
    if (x1 === x2) {
      return y1;
    }

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    return m * x + b;
  }
}
