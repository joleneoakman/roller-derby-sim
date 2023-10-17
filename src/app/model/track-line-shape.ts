import {Vector} from "./geometry/vector";
import {Shape} from "./geometry/shape";

export interface TrackLineShape extends Shape {

  get distance(): number;

  /**
   * Returns the distance along the shape to the target position.
   */
  getDistanceAlong(target: Vector): number;

  /**
   * Returns the closest point on the shape to the given position.
   */
  getClosestPointTo(position: Vector): Vector;

  /**
   * Returns a point along the shape at the given relativeDistance.
   * Values between 0 and 1 are always on the shape.
   */
  getAbsolutePositionOf(relativeDistance: number): Vector;

  /**
   * Returns the relativeDistance along the shape from the start position to the target position.
   */
  getRelativeDistanceAlong(target: Vector): number;
}
