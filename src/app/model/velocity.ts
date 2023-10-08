import {Vector} from "./vector";
import {GameConstants} from "../game/game-constants";
import {Position} from "./position";
import {ArcTools} from "../util/arc-tools";
import {Angle} from "./angle";
import {Speed} from "./speed";


export class Velocity implements Vector {

  public static readonly ZERO: Velocity = Velocity.of(Speed.ZERO, Angle.ZERO);

  readonly speed: Speed;
  readonly angle: Angle;
  readonly x: number;
  readonly y: number;

  private constructor(speed: Speed, angle: Angle, x: number, y: number) {
    if (isNaN(x)) {
      throw Error("x is NaN");
    }
    if (isNaN(y)) {
      throw Error("y is NaN");
    }
    this.speed = speed;
    this.angle = angle;
    this.x = x;
    this.y = y;
  }

  /**
   * Calculates a vector based on the given speed (kph) and angle (degrees)
   * @param speed   Speed in kilometers per hour
   * @param angle Angle in degrees (0 <= angle <= 360, where 0 is east, 90 is north, 180 is west, 270 is south)
   */
  public static of(speed: Speed, angle: Angle): Velocity {
    const x = speed.mpf * Math.cos(angle.radians);
    const y = speed.mpf * Math.sin(angle.radians);
    return new Velocity(speed, angle, x, y);
  }

  public static ofReadable(kph: number, angle: number): Velocity {
    return Velocity.of(Speed.ofKph(kph), Angle.ofDegrees(angle));
  }

  public static ofVector(x: number, y: number): Velocity {
    const vector = Position.of(x, y);
    const speed = Speed.ofVector(vector);
    const angle = Angle.ofVector(vector);
    return Velocity.of(speed, angle);
  }

  /**
   * Returns a new angle that is pointed towards the given target point.
   */
  turnTowards(targetPoint: Position, currentPosition: Position): Angle {
    return Angle.ofVector(targetPoint.minus(currentPosition));
  }

    /**
   * Calculate the new velocity based on this velocity and the given target velocity.
   */
  public recalculate(targetVelocity: Velocity): Velocity {
    // Calculate new speed
    const speedDiff = targetVelocity.speed.minus(this.speed);
    const kph = speedDiff.isMoving()
      ? Math.min(targetVelocity.speed.kph, this.speed.kph + GameConstants.ACCELERATION_STEP)
      : Math.max(targetVelocity.speed.kph, this.speed.kph - GameConstants.DECELERATION_STEP);

    const newAngle = this.angle.turnTowards(targetVelocity.angle, GameConstants.MAX_TURN_PER_FRAME);

    // Done
    return Velocity.of(Speed.ofKph(kph), newAngle);
  }

  /**
   * Calculate the new vector based on the given position (x, y) and frame rate (fps)
   * @param position The position (object with x and y coordinates)
   */
  public calculatePosition(position: Position): Position {
    const x = position.x + this.x;
    const y = position.y + this.y;
    return Position.of(x, y);
  }

  public withKph(speed: Speed): Velocity {
    return Velocity.of(speed, this.angle);
  }

  public withAngle(angle: Angle): Velocity {
    return Velocity.of(this.speed, angle);
  }
}
