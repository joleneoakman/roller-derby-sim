import {Vector} from "./vector";
import {GameConstants} from "../game/game-constants";
import {Position} from "./position";
import {ArcTools} from "../util/arc-tools";


export class Velocity implements Vector {

  readonly kph: number;
  readonly angle: number;
  readonly x: number;
  readonly y: number;

  private constructor(kph: number, angle: number, x: number, y: number) {
    this.kph = kph;
    this.angle = angle;
    this.x = x;
    this.y = y;
  }

  /**
   * Calculates a vector based on the given speed (kph) and angle (degrees)
   * @param kph   Speed in kilometers per hour
   * @param angle Angle in degrees (0 <= angle <= 360, where 0 is east, 90 is north, 180 is west, 270 is south)
   */
  public static of(kph: number, angle: number): Velocity {
    // Keep within bounds
    angle = (angle + 360) % 360;
    kph = Math.max(0, kph);

    // Calculate x/y
    const metersPerHour = kph * 1000;
    const metersPerSecond = metersPerHour / 3600
    const metersPerFrame = metersPerSecond / GameConstants.FPS;
    const angleRad = (-angle * Math.PI) / 180;
    const x = metersPerFrame * Math.cos(angleRad);
    const y = metersPerFrame * Math.sin(angleRad);
    return new Velocity(kph, angle, x, y);
  }

  public static ofXY(x: number, y: number): Velocity {
    const kph = Velocity.toKph(x, y);
    const angle = ArcTools.toAngle(x, y);
    return Velocity.of(kph, angle);
  }

  public add(velocity: Velocity): Velocity {
    return Velocity.ofXY(this.x + velocity.x, this.y + velocity.y);
  }

  public subtract(velocity: Velocity): Velocity {
    return Velocity.ofXY(this.x - velocity.x, this.y - velocity.y);
  }

  public multiply(factor: number): Velocity {
    return Velocity.ofXY(this.x * factor, this.y * factor);
  }

  public average(velocity: Velocity): Velocity {
    return Velocity.ofXY((this.x + velocity.x) / 2, (this.y + velocity.y) / 2);
  }

  /**
   * Returns a new angle that is pointed towards the given target point.
   */
  turnTowards(targetPoint: Position, currentPosition: Position): number {
    const dx = targetPoint.x - currentPosition.x;
    const dy = targetPoint.y - currentPosition.y;
    return ArcTools.toAngle(dx, dy);
  }

  turnTowardsAngle(targetAngle: number): Velocity {
    const newAngle = ArcTools.turnTowardsAngle(this.angle, targetAngle);
    const result = Velocity.of(this.kph, newAngle);
    if (result.kph !== this.kph || result.kph !== 10) {
      console.log("kph changed: " + this.kph + " -> " + result.kph);
    }
    return result;
  }

    /**
   * Calculate the new velocity based on this velocity and the given target velocity.
   */
  public recalculate(targetVelocity: Velocity): Velocity {
    // Calculate new speed
    const speedDiff = targetVelocity.kph - this.kph;
    const kph = speedDiff > 0
      ? Math.min(targetVelocity.kph, this.kph + GameConstants.ACCELERATION_STEP)
      : Math.max(targetVelocity.kph, this.kph - GameConstants.DECELERATION_STEP);

    // Calculate new angle (slower speeds allow for faster turning)
    /*const kphCapped = Math.min(this.kph, GameConstants.MAX_SPEED_KPH);
    const weight1 = kphCapped / GameConstants.MAX_SPEED_KPH;
    const weight2 = (1 - weight1);
    const angle = this.angle * weight1 + targetVelocity.angle * weight2;
    console.log(`angle: ${angle} targetVelocity.angle: ${targetVelocity.angle}`);*/

    const newAngle = ArcTools.turnTowardsAngle(this.angle, targetVelocity.angle);

    // Done
    return Velocity.of(kph, newAngle);
  }

  /**
   * Calculate the new vector based on the given position (x, y) and frame rate (fps)
   * @param position The position (object with x and y coordinates)
   */
  public calculatePosition(position: Vector): Position {
    const x = position.x + this.x;
    const y = position.y + this.y;
    return Position.of(x, y);
  }

  public withKph(kph: number): Velocity {
    return Velocity.of(kph, this.angle);
  }

  public withAngle(angle: number): Velocity {
    return Velocity.of(this.kph, angle);
  }

  public static toKph(x: number, y: number): number {
    // Calculate the speed in meters per frame
    const speedMpf = Math.sqrt(x * x + y * y);

    // Convert it to meters per second and then to kilometers per hour
    const speedMps = speedMpf * GameConstants.FPS;
    const speedKph = (speedMps * 3600) / 1000;

    return speedKph;
  }
}
