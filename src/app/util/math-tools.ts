import {Position} from "../model/position";
import {Velocity} from "../model/velocity";
import {Line} from "../model/line";

export class MathTools {
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  };

  public static getDotN(position1: Position, velocity1: Velocity, position2: Position, velocity2: Velocity): number {
    const x1 = position1.x;
    const y1 = position1.y;
    const vx1 = velocity1.x;
    const vy1 = velocity1.y;

    const x2 = position2.x;
    const y2 = position2.y;
    const vx2 = velocity2.x;
    const vy2 = velocity2.y;

    // Calculate relative velocities
    const rvx = vx1 - vx2;
    const rvy = vy1 - vy2;

    // Calculate distance between circle centers
    const dx = x1 - x2;
    const dy = y1 - y2;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Calculate normal vector
    const nx = dx / d;
    const ny = dy / d;

    // Calculate velocity along normal
    return rvx * nx + rvy * ny;
  }

  /**
   * For the given line, find the y coordinate for the given x coordinate.
   */
  public static getYFor(line: Line, x: number): number {
    const x1 = line.p1.x;
    const y1 = line.p1.y;
    const x2 = line.p2.x;
    const y2 = line.p2.y;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    return m * x + b;
  }

  /**
   * Returns a new position that adds the given distance to the second point of the line.
   */
  public static addDistanceAlongLine(line: Line, distance: number): Position {
    // Calculate vector from p1 to p2
    const dx = line.p2.x - line.p1.x;
    const dy = line.p2.y - line.p1.y;

    // Normalize the vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;

    // Scale the vector by the distance and add to p2
    const newX = line.p2.x + normalizedDx * distance;
    const newY = line.p2.y + normalizedDy * distance;

    return Position.of(newX, newY);
  }
}
