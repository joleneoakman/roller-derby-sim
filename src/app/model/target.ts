import {Vector} from "./geometry/vector";
import {Velocity} from "./geometry/velocity";
import {Track} from "./track";

export class Target {
  readonly position: Vector;
  readonly stop: boolean;

  constructor(position: Vector, stop: boolean) {
    this.position = position;
    this.stop = stop;
  }

  //
  // Create
  //

  public static of(position: Vector, stop: boolean = false): Target {
    return new Target(position, stop);
  }

  public static speedUpTo(position: Vector): Target {
    return new Target(position, false);
  }

  public static stopAt(position: Vector): Target {
    return new Target(position, true);
  }
}
