import {GameConstants} from "../game/game-constants";
import {Angle} from "./angle";
import {Speed} from "./speed";
import {Vector} from "./vector";


export class Velocity {

  public static readonly ZERO: Velocity = Velocity.of(Speed.ZERO, Angle.ZERO);

  readonly speed: Speed;
  readonly angle: Angle;

  private _vector?: Vector;

  private constructor(speed: Speed, angle: Angle) {
    this.speed = speed;
    this.angle = angle;
  }

  //
  // Create
  //

  /**
   * Calculates a vector based on the given speed (kph) and angle (degrees)
   * @param speed   Speed in kilometers per hour
   * @param angle Angle in degrees (0 <= angle <= 360, where 0 is east, 90 is north, 180 is west, 270 is south)
   */
  public static of(speed: Speed, angle: Angle): Velocity {
    return new Velocity(speed, angle);
  }

  public static ofReadable(kph: number, angle: number): Velocity {
    return Velocity.of(Speed.ofKph(kph), Angle.ofDegrees(angle));
  }

  public static ofXY(x: number, y: number): Velocity {
    const vector = Vector.of(x, y);
    const speed = Speed.ofVector(vector);
    const angle = Angle.ofVector(vector);
    return Velocity.of(speed, angle);
  }

  //
  // Getters
  //

  public get vector(): Vector {
    if (!this._vector) {
      this._vector = this.calculateVector();
    }
    return this._vector;
  }

  public get x(): number {
    return this.vector.x;
  }

  public get y(): number {
    return this.vector.y;
  }

  public isOrigin(): boolean {
    return this.speed.kph === 0;
  }

  //
  // Setters
  //

  /**
   * Returns a new angle that is pointed towards the given target point.
   */
  turnTowards(targetPoint: Vector, currentPosition: Vector): Angle {
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
  public calculatePosition(position: Vector): Vector {
    const x = position.x + this.x;
    const y = position.y + this.y;
    return Vector.of(x, y);
  }

  public withKph(speed: Speed): Velocity {
    return Velocity.of(speed, this.angle);
  }

  public withAngle(angle: Angle): Velocity {
    return Velocity.of(this.speed, angle);
  }

  //
  // Utility methods
  //

  private calculateVector(): Vector {
    const x = this.speed.mpf * Math.cos(this.angle.radians);
    const y = this.speed.mpf * Math.sin(this.angle.radians);
    return Vector.of(x, y);
  }
}
