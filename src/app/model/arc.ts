import {Position} from "./position";
import {Angle} from "./angle";
import {Circle} from "./circle";
import {TrackLineShape} from "./trackLineShape";

export class Arc implements TrackLineShape {
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

  public distanceAlong(target: Position): number {
    return this.percentageAlong(target) * this.distance;
  }

  public getClosestPointTo(p: Position): Position {
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

  /**
   * Returns the percentage from the start position of the shape to the target position.
   */
  public percentageAlong(target: Position): number {
    const p = this.getClosestPointTo(target);

    // Calculate the angle between the target and the center of the circle
    const targetAngle = Angle.ofVector(this.position.minus(p));

    // Calculate angular distance from startAngle to targetAngle
    const angularDistanceToTarget = this.startAngle.angleTo(targetAngle);

    // Calculate the entire angular distance of the arc
    const totalAngularDistance = this.startAngle.angleTo(this.endAngle);

    // Calculate the percentage from start position to target position
    return angularDistanceToTarget.radians / totalAngularDistance.radians;
  }
}
