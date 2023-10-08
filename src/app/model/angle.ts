import {Position} from "./position";

/**
 * Angle starts at 0 at the right, and increases in clockwise direction.
 */
export class Angle {

  private static readonly VALUE_PI_DIVIDED_BY_180: number = Math.PI / 180;
  private static readonly VALUE_180_DIVIDED_BY_PI: number = 180 / Math.PI;
  private static readonly VALUE_PI_TIMES_2: number = Math.PI * 2;

  public static readonly ZERO: Angle = Angle.ofRadians(0);
  public static readonly D_90: Angle = Angle.ofDegrees(90);
  public static readonly D_180: Angle = Angle.ofDegrees(180);
  public static readonly D_270: Angle = Angle.ofDegrees(270); // -90

  readonly radians: number;

  constructor(radians: number) {
    if (isNaN(radians)) {
      throw Error("Angle is NaN");
    }
    this.radians = Angle.normalize(radians);
  }

  public static ofRadians(radians: number): Angle {
    return new Angle(radians);
  }

  public static ofDegrees(degrees: number): Angle {
    return new Angle(degrees * Angle.VALUE_PI_DIVIDED_BY_180);
  }

  public static ofVector(pos: Position): Angle {
    return Angle.ofRadians(Math.atan2(pos.y, pos.x));
  }

  public get degrees(): number {
    return this.radians * Angle.VALUE_180_DIVIDED_BY_PI;
  }

  plus(radians: number): Angle {
    return Angle.ofRadians(this.radians + radians);
  }

  public angleTo(other: Angle): Angle {
    const diff = Angle.normalize(this.radians - other.radians);
    return Angle.ofRadians(diff);
  }

  /**
   * Returns true if this angle is between the given start and end angle.
   */
  public isBetween(startAngle: Angle, endAngle: Angle): boolean {
    let start = startAngle.radians;
    let end = endAngle.radians;
    let angle = this.radians;

    if (start <= end) {
      // Simple case, just check if it is within the interval
      return angle >= start && angle <= end;
    } else {
      // Wraps around, so invert the check
      return angle >= start || angle <= end;
    }
  }

  /**
   * Adjust the current angle to (gradually) turn towards the target angle with a given max turn angle in the current frame.
   */
  public turnTowards(targetAngle: Angle, maxDiffPerFrame: number): Angle {
    const angleDiff = targetAngle.degrees - this.degrees;
    const angleDiffAbs = Math.abs(angleDiff);
    let newAngle: number;
    if (angleDiffAbs > 180) {
      const step = Math.min(maxDiffPerFrame, - angleDiffAbs + 360);
      newAngle = angleDiff > 0 ? this.degrees - step : this.degrees + step;
    } else {
      const step = Math.min(maxDiffPerFrame, angleDiffAbs);
      newAngle = angleDiff > 0 ? this.degrees + step : this.degrees - step;
    }
    return Angle.ofDegrees(newAngle);
  }

  //
  // Utility methods
  //

  private static normalize(radians: number): number {
    radians = radians % Angle.VALUE_PI_TIMES_2;
    if (radians < 0) {
      radians += Angle.VALUE_PI_TIMES_2;
    }
    return radians;
  }
}
