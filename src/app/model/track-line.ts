import {Line} from "./line";
import {Arc} from "./arc";
import {Circle} from "./circle";
import {Angle} from "./angle";
import {Position} from "./position";
import {GameConstants} from "../game/game-constants";

/**
 * A track line is a continuous shape that consists of a top and bottom line, and a left and right arc (half circles).
 */
export class TrackLine {
  readonly bottomLine: Line;
  readonly rightCircle: Circle;
  readonly topLine: Line;
  readonly leftCircle: Circle;

  private constructor(bottomLine: Line, rightCircle: Circle, topLine: Line, leftCircle: Circle) {
    this.bottomLine = bottomLine;
    this.rightCircle = rightCircle;
    this.topLine = topLine;
    this.leftCircle = leftCircle;
  }

  public static of(bottomLine: Line, rightCircle: Circle, topLine: Line, leftCircle: Circle): TrackLine {
    return new TrackLine(bottomLine, rightCircle, topLine, leftCircle);
  }

  public get leftArc(): Arc {
    return Arc.of(this.leftCircle, Angle.D_90, Angle.D_270);
  }

  public get rightArc(): Arc {
    return Arc.of(this.rightCircle, Angle.D_270, Angle.D_90);
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

}
