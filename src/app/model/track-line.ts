import {Line} from "./line";
import {Arc} from "./arc";
import {Circle} from "./circle";
import {Angle} from "./angle";
import {Position} from "./position";
import {GameConstants} from "../game/game-constants";
import {TrackLineShape} from "./trackLineShape";

/**
 * A track line is a continuous shape that consists of a top and bottom line, and a left and right arc (half circles).
 */
export class TrackLine implements TrackLineShape {

  readonly bottomLine: Line;
  readonly rightCircle: Circle;
  readonly topLine: Line;
  readonly leftCircle: Circle;

  // Calculated fields
  readonly leftArc: Arc;
  readonly rightArc: Arc;
  readonly shapes: TrackLineShape[];

  private constructor(bottomLine: Line, rightCircle: Circle, topLine: Line, leftCircle: Circle) {
    this.bottomLine = bottomLine;
    this.rightCircle = rightCircle;
    this.topLine = topLine;
    this.leftCircle = leftCircle;

    // Calculated
    this.leftArc = Arc.of(this.leftCircle, Angle.D_90, Angle.D_270);
    this.rightArc = Arc.of(this.rightCircle, Angle.D_270, Angle.D_90);
    this.shapes = [bottomLine, this.rightArc, topLine, this.leftArc];
  }

  public static of(bottomLine: Line, rightCircle: Circle, topLine: Line, leftCircle: Circle): TrackLine {
    return new TrackLine(bottomLine, rightCircle, topLine, leftCircle);
  }

  /**
   * Returns the start point of the track line. This is a point on the bottom line that lies exactly 30 distance
   * left of the bottom line's p2 (where the line is defined by poins p1 and p2).
   */
  public get startPoint(): Position {
    const dx = this.bottomLine.p2.x - this.bottomLine.p1.x;
    const dy = this.bottomLine.p2.y - this.bottomLine.p1.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    const normalizedX = dx / length;
    const normalizedY = dy / length;

    const offsetX = GameConstants.THIRTY_FEET * normalizedX;
    const offsetY = GameConstants.THIRTY_FEET * normalizedY;

    return new Position(this.bottomLine.p2.x - offsetX, this.bottomLine.p2.y - offsetY);
  }

  /**
   * This returns the total distance of the track line, which is the sum of:
   * - the bottom line
   * - the right arc
   * - the top line
   * - the left arc
   */
  public get distance(): number {
    const dTop = this.topLine.distance;
    const dBottom = this.bottomLine.distance;
    const dLeft = this.leftArc.distance;
    const dRight = this.rightArc.distance;
    return dTop + dBottom + dLeft + dRight;
  }

  distanceAlong(target: Position): number {
    return this.percentageAlong(target) * this.distance;
  }

  public getClosestPointTo(position: Position): Position {
    const candidates: Position[] = [];
    candidates.push(this.topLine.getClosestPointTo(position));
    candidates.push(this.bottomLine.getClosestPointTo(position));
    candidates.push(this.leftArc.getClosestPointTo(position));
    candidates.push(this.rightArc.getClosestPointTo(position));

    let minimumDistance = Number.MAX_VALUE;
    let result = candidates[0];
    for (const candidate of candidates) {
      const distance = position.distanceTo(candidate);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        result = candidate;
      }
    }
    return result;
  }

  public pointAtDistance(distance: number): Position {
    const totalDistance = this.distance;
    const percentage = distance / totalDistance;
    return this.pointAtPercentage(percentage);
  }

  /**
   * Returns a point along the track line at the given percentage (0 - 1), with:
   * - 0 being the start point
   * - 1 being the end point (same as start point)
   *
   * The percentage is calculate by the length of the track, consisting of (in order):
   * - the start point along the bottom line
   * - the bottom line, so (startPoint -> line.p2)
   * - the right arc from arc.startAngle to arc.endAngle, along the radius
   * - the top line, so (line.p2 -> line.p1)
   * - the left arc from arc.startAngle to arc.endAngle, along the radius
   * - the bottom line, so (line.p1 -> startPoint)
   */
  public pointAtPercentage(percentage: number): Position {
    const totalLength = this.distance;
    const targetLength = totalLength * percentage;

    // Lengths of individual segments
    const dBottomStart = this.startPoint.distanceTo(this.bottomLine.p2);
    const dRight = this.rightArc.distance;
    const dTop = this.topLine.distance;
    const dLeft = this.leftArc.distance;
    const dBottom = this.startPoint.distanceTo(this.bottomLine.p1);

    let accumulatedLength = 0;

    //console.log(`totalLength: ${totalLength} dBottomStart: ${dBottomStart} dRight: ${dRight} dTop: ${dTop} dLeft: ${dLeft} dBottom: ${dBottom}`);

    // Point lies on the segment from startPoint to bottomLine.p2
    accumulatedLength += dBottomStart;
    if (targetLength < accumulatedLength) {
      return Line.of(this.startPoint, this.bottomLine.p2).pointAtPercentage(targetLength / dBottomStart);
    }

    // Point lies on the right arc
    if ((accumulatedLength + dRight) > targetLength) {
      return this.rightArc.pointAtPercentage(- (targetLength - accumulatedLength - dRight) / dRight);
    }
    accumulatedLength += dRight;

    // Point lies on the top line
    if ((accumulatedLength + dTop) > targetLength) {
      return this.topLine.pointAtPercentage((targetLength - accumulatedLength) / dTop);
    }
    accumulatedLength += dTop;

    // Point lies on the left arc
    if (accumulatedLength + dLeft > targetLength) {
      return this.leftArc.pointAtPercentage(- (targetLength - accumulatedLength - dLeft) / dLeft);
    }
    accumulatedLength += dLeft;

    // Point lies on the bottom line from p1 to startPoint
    return Line.of(this.bottomLine.p1, this.startPoint).pointAtPercentage((targetLength - accumulatedLength) / dBottom);
  }


  /**
   * Returns the percentage from the start position of the track line to the target position.
   */
  public percentageAlong(target: Position): number {
    return this.percentageBetween(this.startPoint, target);
  }

  /**
   * Returns the percentage traveled along the track line from the given reference point to the target position.
   * The traveled percentage is calculated in counter-clockwise direction and is between 0 and 1.
   */
  public percentageBetween(p1: Position, target: Position): number {
    const p2 = this.getClosestPointTo(target);

    // Find shapes of p1 and p2 in order
    const shapeIndexForP1 = this.findShapeIndexOf(p1);
    const shapeIndexForP2 = this.findShapeIndexOf(p2);

    // Loop through each shape to start accumulating distance
    let accumulatedDistance = 0;
    let p2Reached = false;
    for (let i = 0; i < this.shapes.length && !p2Reached; i++) {
      const currentIndex = (i + shapeIndexForP1) % this.shapes.length;
      const currentShape = this.shapes[currentIndex];
      const totalDistanceOfShape = currentShape.distance;

      accumulatedDistance += totalDistanceOfShape;
      if (currentIndex === shapeIndexForP1) {
        const distanceFromStartToP1 = currentShape.distanceAlong(p1);
        accumulatedDistance -= distanceFromStartToP1;
      }
      if (currentIndex == shapeIndexForP2) {
        const distanceFromStartToP2 = currentShape.distanceAlong(p2);
        const distanceFromP2ToEnd = totalDistanceOfShape - distanceFromStartToP2;
        accumulatedDistance -= distanceFromP2ToEnd;
        p2Reached = true;
      }
    }

    // Calculate the percentage
    const totalDistance = this.distance;
    const result = accumulatedDistance / totalDistance;
    return result < 0 ? result + 1 : result
  }

  private findShapeIndexOf(p1: Position) {
    if (p1.equals(this.startPoint)) {
      return 0;
    }

    let result = 0;
    let minDistance = Number.MAX_VALUE;
    for (let i = 0; i < this.shapes.length; i++) {
      const shape = this.shapes[i];
      const closestPoint = shape.getClosestPointTo(p1);
      const distance = closestPoint.distanceTo(p1);
      if (distance < minDistance) {
        minDistance = distance;
        result = i;
      }
    }
    return result;
  }
}
