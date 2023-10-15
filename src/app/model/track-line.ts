import {Line} from "./line";
import {Arc} from "./arc";
import {Circle} from "./circle";
import {Angle} from "./angle";
import {Vector} from "./vector";
import {GameConstants} from "../game/game-constants";
import {TrackLineShape} from "./track-line-shape";
import {Quad} from "./quad";
import {Overflow} from "./overflow";

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
   * Returns true if the point is inside the enclosing space of the track line's shape.
   */
  public containsPoint(p: Vector): boolean {
    // Check if point is inside the center quad
    const quad = Quad.of(this.bottomLine.p1, this.bottomLine.p2, this.topLine.p1, this.topLine.p2);
    const containsQuadPoint = quad.containsPoint(p);
    if (containsQuadPoint) {
      return true;
    }

    // Check if point is the left arc
    const containsLeftArcPoint = this.leftCircle.containsPoint(p);
    if (containsLeftArcPoint) {
      return true;
    }

    // Check if point is the right arc
    return this.rightCircle.containsPoint(p);
  }

  /**
   * Returns the start point of the track line. This is a point on the bottom line that lies exactly 30 distance
   * left of the bottom line's p2 (where the line is defined by poins p1 and p2).
   */
  public get startPoint(): Vector {
    const dx = this.bottomLine.p2.x - this.bottomLine.p1.x;
    const dy = this.bottomLine.p2.y - this.bottomLine.p1.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    const normalizedX = dx / length;
    const normalizedY = dy / length;

    const offsetX = GameConstants.THIRTY_FEET * normalizedX;
    const offsetY = GameConstants.THIRTY_FEET * normalizedY;

    return Vector.of(this.bottomLine.p2.x - offsetX, this.bottomLine.p2.y - offsetY);
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

  getDistanceAlong(target: Vector): number {
    return this.getRelativeDistanceAlong(target) * this.distance;
  }

  public getClosestPointTo(position: Vector): Vector {
    const candidates: Vector[] = [];
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

  public pointAtDistance(distance: number): Vector {
    const totalDistance = this.distance;
    const percentage = distance / totalDistance;
    return this.getAbsolutePositionOf(percentage);
  }

  /**
   * Returns a point along the shape at the given relativeDistance.
   * Values between 0 and 1 are always on the shape.
   * Given that the track line is a continuous shape, values outside of these bounds are normalized to 0 and 1.
   */
  public getAbsolutePositionOf(relativeDistance: number): Vector {
    // Normalize the relativeDistance
    relativeDistance = (relativeDistance + 1) % 1;

    // Lengths of individual segments
    const totalLength = this.distance;
    const targetLength = totalLength * relativeDistance;
    const dBottomStart = this.startPoint.distanceTo(this.bottomLine.p2);
    const dRight = this.rightArc.distance;
    const dTop = this.topLine.distance;
    const dLeft = this.leftArc.distance;
    const dBottom = this.startPoint.distanceTo(this.bottomLine.p1);

    // Point lies on the segment from startPoint to bottomLine.p2
    let accumulatedLength = 0;
    accumulatedLength += dBottomStart;
    if (targetLength < accumulatedLength) {
      return Line.of(this.startPoint, this.bottomLine.p2).getAbsolutePositionOf(targetLength / dBottomStart);
    }

    // Point lies on the right arc
    if ((accumulatedLength + dRight) > targetLength) {
      return this.rightArc.getAbsolutePositionOf(- (targetLength - accumulatedLength - dRight) / dRight);
    }
    accumulatedLength += dRight;

    // Point lies on the top line
    if ((accumulatedLength + dTop) > targetLength) {
      return this.topLine.getAbsolutePositionOf((targetLength - accumulatedLength) / dTop);
    }
    accumulatedLength += dTop;

    // Point lies on the left arc
    if (accumulatedLength + dLeft > targetLength) {
      return this.leftArc.getAbsolutePositionOf(- (targetLength - accumulatedLength - dLeft) / dLeft);
    }
    accumulatedLength += dLeft;

    // Point lies on the bottom line from p1 to startPoint
    return Line.of(this.bottomLine.p1, this.startPoint).getAbsolutePositionOf((targetLength - accumulatedLength) / dBottom);
  }


  /**
   * Returns the relativeDistance of the given target position between start (0) and finish (1) along the track line.
   */
  public getRelativeDistanceAlong(target: Vector): number {
    return this.getRelativeDistanceBetween(this.startPoint, target);
  }

  /**
   * Returns the relativeDistance of the given target position along the track line, starting at the given start position.
   * The traveled percentage is calculated in counter-clockwise direction and is between 0 (inclusive) and 1 (exclusive).
   */
  public getRelativeDistanceBetween(startPoint: Vector, target: Vector): number {
    const p2 = this.getClosestPointTo(target);

    // Find shapes of p1 and p2 in order
    const shapeIndexForP1 = this.findShapeIndexOf(startPoint);
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
        const distanceFromStartToP1 = currentShape.getDistanceAlong(startPoint);
        accumulatedDistance -= distanceFromStartToP1;
      }
      if (currentIndex == shapeIndexForP2) {
        const distanceFromStartToP2 = currentShape.getDistanceAlong(p2);
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

  /**
   * Returns the index of the shape that contains the given point.
   */
  public findShapeIndexOf(p1: Vector) {
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

  /**
   * Returns an array of shapes that cover a part of the track based on the given relative back and front positions.
   */
  public getShapes(back: Vector, front: Vector): TrackLineShape[] {
    // Iterate through shapes to assemble parts
    const backIndex = this.findShapeIndexOf(back);
    const frontIndex = this.findShapeIndexOf(front);
    const result: TrackLineShape[] = [];
    for (let i = 0; i < this.shapes.length; i++) {
      const index = (i + backIndex) % this.shapes.length;
      const shape = this.shapes[index];
      const isBack = index === backIndex;
      const isFront = index === frontIndex;

      if (isBack && isFront) {
        // Add part between back and front
        if (shape instanceof Line) {
          result.push(Line.of(back, front));
        } else {
          const arc = shape as Arc;
          const frontAngle = arc.getAngleOf(front); // circles are clockwise ...
          const backAngle = arc.getAngleOf(back); // circles are clockwise ...
          result.push(Arc.of(arc.circle, frontAngle, backAngle));
        }
      } else if (isBack) {
        // Add part between back and shape end
        if (shape instanceof Line) {
          const line = shape as Line;
          result.push(Line.of(back, line.p2));
        } else {
          const arc = shape as Arc;
          const backAngle = arc.getAngleOf(back); // circles are clockwise ...
          result.push(Arc.of(arc.circle, arc.startAngle, backAngle));
        }
      } else if (isFront) {
        // Add part between shape begin and front
        if (shape instanceof Line) {
          const line = shape as Line;
          result.push(Line.of(line.p1, front));
        } else {
          const arc = shape as Arc;
          const frontAngle = arc.getAngleOf(front); // circles are clockwise ...
          result.push(Arc.of(arc.circle, frontAngle, arc.endAngle));
        }
      } else {
        // Add entire shape
        result.push(shape);
      }

      if (isFront) {
        return result;
      }
    }
    return [];
  }

  /**
   * Returns the index of the shape that contains the given relative distance.
   */
  public findShapeIndexOfRelativeDistance(relativeDistance: Overflow): number {
    const value = relativeDistance.value / relativeDistance.max;
    if (value === 0) {
      return 0;
    }
    const position = this.getAbsolutePositionOf(value);
    return this.findShapeIndexOf(position);
  }

  public getIntersectionWith(line: Line, shapeIndex: number): Vector {
    // Calculate for line
    const shape = this.shapes[shapeIndex];
    if (shape instanceof Line) {
      const x = line.p1.x;
      const y = (shape as Line).resolveY(x);
      return Vector.of(x, y);
    }

    // Calculate for arc
    const arc = shape as Arc;
    return arc.getIntersectionWith(line);
  }
}
