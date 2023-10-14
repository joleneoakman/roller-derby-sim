import {Position} from "./position";
import {Velocity} from "./velocity";
import {Track} from "./track";

export class Target {
  readonly position: Position;
  readonly velocity: Velocity;

  // X: Relative lane position (<0 = out of bounds (inner), 0..1 = in bounds, 1 = outside, >1 = out of bounds (outer))
  // Y: Relative distance traveled along track (0 = start, 0.9999... = end)
  private _relativePosition?: Position;

  constructor(position: Position, velocity: Velocity) {
    this.position = position;
    this.velocity = velocity;
  }

  //
  // Create
  //

  public static of(position: Position, velocity?: Velocity): Target {
    velocity = velocity === undefined ? Velocity.ZERO : velocity;
    return new Target(position, velocity);
  }

  //
  // Setters
  //

  public withPosition(position: Position): Target {
    return Target.of(position, this.velocity);
  }

  public withVelocity(velocity: Velocity): Target {
    return Target.of(this.position, velocity);
  }

  //
  // Getters
  //

  public relativePosition(track: Track): Position {
    if (this._relativePosition === undefined) {
      this._relativePosition = track.getRelativePosition(this.position);
    }
    return this._relativePosition;
  }
}
