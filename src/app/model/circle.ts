import {Position} from "./position";
import {Line} from "./line";

export class Circle {
  readonly position: Position;
  readonly radius: number;

  constructor(position: Position, radius: number) {
    this.position = position;
    this.radius = radius;
  }

  public static of(position: Position, radius: number): Circle {
    return new Circle(position, radius);
  }

  public withPosition(position: Position): Circle {
    return new Circle(position, this.radius);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public getClosestPoint(position: Position): Position {
    const intersections = this.getIntersectionWithCenter(position);
    if (intersections.length === 0) {
      throw Error("No point found");
    }
    return intersections.reduce((prev, curr) => prev.distanceTo(position) < curr.distanceTo(position) ? prev : curr);
  }

  public getIntersectionWithCenter(position: Position): Position[] {
    if (this.position.distanceTo(position) === 0) {
      return [];
    }
    return this.getIntersectionWithLine(Line.of(this.position, position))
  }

  /**
   * Returns an array of points that are intersecting between circle with the line:
   * - Empty array if there are no intersections
   * - One point if the line is tangent to the circle
   * - Two points if the line intersects the circle
   */
  public getIntersectionWithLine(line: Line): Position[] {
    const A = line.p1;
    const B = line.p2;
    const C = this.position;

    const AB = Position.of(B.x - A.x, B.y - A.y);

    const a = AB.x * AB.x + AB.y * AB.y;
    const b = 2 * (AB.x * (A.x - C.x) + AB.y * (A.y - C.y));
    const c = (A.x - C.x) * (A.x - C.x) + (A.y - C.y) * (A.y - C.y) - this.radius * this.radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return [];
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    const pos1 = Position.of(A.x + t1 * AB.x, A.y + t1 * AB.y);
    const pos2 = Position.of(A.x + t2 * AB.x, A.y + t2 * AB.y);

    if (discriminant == 0) {
      return [pos1];
    }

    return [pos1, pos2];
  }
}
