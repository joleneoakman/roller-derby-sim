import {Angle} from "./angle";
import {Circle} from "./circle";
import {TrackLineShape} from "./track-line-shape";
import {Line} from "./line";
import {MathTools} from "../util/math-tools";
import {Vector} from "./vector";

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

  public get position(): Vector {
    return this.circle.position;
  }

  public get radius(): number {
    return this.circle.radius;
  }

  public get distance(): number {
    return this.startAngle.angleTo(this.endAngle).radians * this.radius;
  }

  public get p1(): Vector {
    return this.getPointAtAngle(this.startAngle);
  }

  public get p2(): Vector {
    return this.getPointAtAngle(this.endAngle);
  }

  public getDistanceAlong(target: Vector): number {
    return this.getRelativeDistanceAlong(target) * this.distance;
  }

  public getIntersectionWith(line: Line): Vector {
    const start = this.getPointAtAngle(this.startAngle);
    const end = this.getPointAtAngle(this.endAngle);
    const intersections = this.circle.getIntersectionWithLine(line)
      .filter(i => {
        const angle = Angle.ofVector(i.minus(this.position));
        return angle.isBetween(this.startAngle, this.endAngle);
      });
    const candidates: Vector[] = [
      start,
      end,
      ...intersections,
    ];
    return candidates.reduce((prev, curr) => prev.distanceTo(line.p1) < curr.distanceTo(line.p1) ? prev : curr);
  }

  public getClosestPointTo(p: Vector): Vector {
    const start = this.getPointAtAngle(this.startAngle);
    const end = this.getPointAtAngle(this.endAngle);
    const intersections = this.circle.getIntersectionWithCenter(p)
      .filter(i => {
        const angle = Angle.ofVector(i.minus(this.position));
        return angle.isBetween(this.startAngle, this.endAngle);
      });
    const candidates: Vector[] = [
      start,
      end,
      ...intersections,
    ];
    return candidates.reduce((prev, curr) => prev.distanceTo(p) < curr.distanceTo(p) ? prev : curr);
  }

  getPointAtAngle(angle: Angle): Vector {
    const x = this.position.x + this.radius * Math.cos(angle.radians);
    const y = this.position.y + this.radius * Math.sin(angle.radians);
    return Vector.of(x, y);
  }

  /**
   * Returns a point along the shape at the given relativeDistance.
   * Values between 0 and 1 are always on the shape.
   * Values outside of these bounds are normalized to 0 and 1.
   */
  public getAbsolutePositionOf(relativeDistance: number): Vector {
    relativeDistance = MathTools.limit(relativeDistance, 0, 1)
    const diff = this.startAngle.angleTo(this.endAngle);
    return this.getPointAtAngle(this.startAngle.plusRadians(diff.radians * relativeDistance));
  }

  /**
   * Returns the percentage from the start position of the shape to the target position.
   */
  public getRelativeDistanceAlong(target: Vector): number {
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

  /**
   * Calculate the angle between the target and the center of the arc, limited to the angle of the arc.
   */
  public getAngleOf(position: Vector): Angle {
    const result = this.circle.getAngleOf(position);

    // Todo: limit angle to arc
    // 270 -> 90      3     => 3
    // 270 -> 90      130   => 90
    // 270 -> 90      359   => 359
    // 90  -> 270     3     => 90
    // 90  -> 270     130   => 130
    // 90  -> 270     359   => 270

    return result;
  }
}
