import {Vector} from "./vector";
import {Velocity} from "./velocity";
import {Track} from "./track";

export class Target {
  readonly position: Vector;
  readonly velocity: Velocity;

  // Lazy values
  // X: Relative lane position (<0 = out of bounds (inner), 0..1 = in bounds, 1 = outside, >1 = out of bounds (outer))
  // Y: Relative distance traveled along track (0 = start, 0.9999... = end)
  private _relativePosition?: Vector;

  constructor(position: Vector, velocity: Velocity) {
    this.position = position;
    this.velocity = velocity;
  }

  //
  // Create
  //

  public static of(position: Vector, velocity?: Velocity): Target {
    velocity = velocity === undefined ? Velocity.ZERO : velocity;
    return new Target(position, velocity);
  }

  //
  // Getters
  //

  public relativePosition(track: Track): Vector {
    if (this._relativePosition === undefined) {
      this._relativePosition = track.getRelativePosition(this.position);
    }
    return this._relativePosition;
  }

  //
  // Setters
  //

  public withPosition(position: Vector): Target {
    return Target.of(position, this.velocity);
  }

  public withVelocity(velocity: Velocity): Target {
    return Target.of(this.position, velocity);
  }
}
