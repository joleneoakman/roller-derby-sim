import {Position} from "./position";
import {Angle} from "./angle";
import {Circle} from "./circle";

export class Arc {
  readonly circle: Circle;
  readonly startAngle: Angle;
  readonly endAngle: Angle;

  constructor(circle: Circle, startAngle: Angle, endAngle: Angle) {
    this.circle = circle;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }

  public static of(circle: Circle, startAngle: Angle, endAngle: Angle): Arc {
    return new Arc(circle, startAngle, endAngle);
  }

  public get position(): Position {
    return this.circle.position;
  }

  public get radius(): number {
    return this.circle.radius;
  }

  public get distance(): number {
    return this.startAngle.angleTo(this.endAngle).radians * this.radius;
  }

  public getClosestPoint(p: Position): Position {
    const start = this.getPointAtAngle(this.startAngle);
    const end = this.getPointAtAngle(this.endAngle);
    const intersections = this.circle.getIntersectionWithCenter(p)
      .filter(i => {
        const angle = Angle.ofVector(i.minus(this.position));
        return angle.isBetween(this.startAngle, this.endAngle);
      });
    const candidates: Position[] = [
      start,
      end,
      ...intersections,
    ];
    return candidates.reduce((prev, curr) => prev.distanceTo(p) < curr.distanceTo(p) ? prev : curr);
  }

  getPointAtAngle(angle: Angle): Position {
    const x = this.position.x + this.radius * Math.cos(angle.radians);
    const y = this.position.y + this.radius * Math.sin(angle.radians);
    return Position.of(x, y);
  }

  public pointAtPercentage(percentage: number): Position {
    const diff = this.startAngle.angleTo(this.endAngle);
    return this.getPointAtAngle(this.startAngle.plus(diff.radians * percentage));
  }
}
