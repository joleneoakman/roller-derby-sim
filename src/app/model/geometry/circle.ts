import {Vector} from "./vector";
import {Line} from "./line";
import {Pair} from "../pair";
import {Angle} from "./angle";
import {Shape} from "./shape";

export class Circle implements Shape {
  readonly position: Vector;
  readonly radius: number;

  constructor(position: Vector, radius: number) {
    this.position = position;
    this.radius = radius;
  }

  public static of(position: Vector, radius: number): Circle {
    return new Circle(position, radius);
  }

  public withPosition(position: Vector): Circle {
    return new Circle(position, this.radius);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public distanceTo(circle: Circle): number {
    return this.distanceToPoint(circle.position) - circle.radius;
  }

  public distanceToPoint(position: Vector): number {
    return this.position.distanceTo(position) - this.radius;
  }

  public containsPoint(position: Vector): boolean {
    const distance = this.distanceToPoint(position);
    return distance <= 0;
  }

  public getClosestPoint(position: Vector): Vector {
    const intersections = this.getIntersectionWithCenter(position);
    if (intersections.length === 0) {
      throw Error("No point found");
    }
    return intersections.reduce((prev, curr) => prev.distanceTo(position) < curr.distanceTo(position) ? prev : curr);
  }

  public getPositionAt(angle: Angle): Vector {
    const x = this.position.x + this.radius * Math.cos(angle.radians);
    const y = this.position.y + this.radius * Math.sin(angle.radians);
    return Vector.of(x, y);
  }

  /**
   * Calculate the angle between the target and the center of the arc.
   */
  public getAngleOf(position: Vector): Angle {
    const p = this.getClosestPoint(position);
    return Angle.ofVector(p.minus(this.position));
  }

  public getIntersectionWithCenter(position: Vector): Vector[] {
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
  public getIntersectionWithLine(line: Line): Vector[] {
    const A = line.p1;
    const B = line.p2;
    const C = this.position;

    const AB = Vector.of(B.x - A.x, B.y - A.y);

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

    const pos1 = Vector.of(A.x + t1 * AB.x, A.y + t1 * AB.y);
    const pos2 = Vector.of(A.x + t2 * AB.x, A.y + t2 * AB.y);

    if (discriminant == 0) {
      return [pos1];
    }

    return [pos1, pos2];
  }

  /**
   * Returns true if the given circle collides with this circle.
   */
  public collidesWith(circle2: Circle): boolean {
    const distance = this.distanceTo(circle2);
    return distance < 0;
  }

  public collideWith(circle2: Circle): Pair<Circle, Circle> {
    // Step 1: Calculate distance between centers
    let circle1: Circle = this;
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Step 2: Calculate overlap
    const overlap = (circle2.radius + circle1.radius) - distance;

    if (overlap <= 0) {
      return Pair.of(circle1, circle2);
    }

    // Step 3: Divide the overlap by 2
    const halfOverlap = overlap / 2;

    // Step 4: Calculate direction to move each circle
    const ax = dx / distance;
    const ay = dy / distance;

    // Step 5: Update positions
    const x1 = circle1.x + ax * halfOverlap;
    const y1 = circle1.y + ay * halfOverlap;

    const x2 = circle2.x - ax * halfOverlap;
    const y2 = circle2.y - ay * halfOverlap;

    const circleNew1 = circle1.withPosition(Vector.of(x1, y1));
    const circleNew2 = circle2.withPosition(Vector.of(x2, y2));
    return Pair.of(circleNew1, circleNew2);
  }
}
