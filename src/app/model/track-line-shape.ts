import {Position} from "./position";
import {Shape} from "./shape";

export interface TrackLineShape extends Shape {

  get distance(): number;

  /**
   * Returns the distance along the shape to the target position.
   */
  getDistanceAlong(target: Position): number;

  /**
   * Returns the closest point on the shape to the given position.
   */
  getClosestPointTo(position: Position): Position;

  /**
   * Returns a point along the shape at the given relativeDistance.
   * Values between 0 and 1 are always on the shape.
   */
  getAbsolutePositionOf(relativeDistance: number): Position;

  /**
   * Returns the relativeDistance along the shape from the start position to the target position.
   */
  getRelativeDistanceAlong(target: Position): number;
}
