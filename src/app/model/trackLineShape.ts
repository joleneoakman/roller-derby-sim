import {Position} from "./position";

export interface TrackLineShape {

  get distance(): number;

  /**
   * Returns the distance along the shape to the target position.
   */
  distanceAlong(target: Position): number;

  /**
   * Returns the closest point on the shape to the given position.
   */
  getClosestPointTo(position: Position): Position;

  /**
   * Returns a point along the shape at the given percentage (0 - 1).
   */
  getAbsolutePositionOf(percentage: number): Position;

  /**
   * Returns the percentage along the shape from the start position to the target position.
   */
  getRelativePositionOf(target: Position): number;
}
