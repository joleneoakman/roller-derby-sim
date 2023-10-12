import {Circle} from "./circle";
import {Position} from "./position";
import {GameConstants} from "../game/game-constants";
import {Line} from "./line";
import {MathTools} from "../util/math-tools";
import {CircleTools} from "../util/circle-tools";
import {TrackLine} from "./track-line";
import {Player} from "./player";
import {Overflow} from "./overflow";
import {TrackLineShape} from "./track-line-shape";
import {Shape} from "./shape";
import {Arc} from "./arc";
import {Quad} from "./quad";
import {Triangle} from "./triangle";
import {Renderer} from "../renderer/renderer";

export class Track {

  // Bounds
  readonly innerBounds: TrackLine;
  readonly outerBounds: TrackLine;

  // Visual lines (bounds + player radius)
  readonly innerTrackLine: TrackLine;
  readonly outerTrackLine: TrackLine;

  // Marker lines
  readonly jammerLine: Line;
  readonly pivotLine: Line;
  readonly tenFeetLines: Line[];

  // Pack line
  readonly packLine: TrackLine;

  // Rendering info
  readonly trackRatio: number;

  constructor(innerBounds: TrackLine,
              outerBounds: TrackLine,
              innerTrackLine: TrackLine,
              outerTrackLine: TrackLine,
              packLine: TrackLine,
              jammerLine: Line,
              pivotLine: Line,
              tenFeetLines: Line[]) {
    this.innerBounds = innerBounds;
    this.outerBounds = outerBounds;
    this.jammerLine = jammerLine;
    this.pivotLine = pivotLine;
    this.tenFeetLines = tenFeetLines;
    this.innerTrackLine = innerTrackLine;
    this.outerTrackLine = outerTrackLine;
    this.packLine = packLine;
    this.trackRatio = Track.calculateTrackRatio(this);
  }

  public static create(): Track {
    const oneFoot = GameConstants.ONE_FOOT;
    const tenFeet = GameConstants.TEN_FEET;
    const w = 5.33;
    const h = 3.81;
    const rIn = 3.81;
    const rPack = GameConstants.PACK_LINE_RADIUS;
    const rOut = 8.08;
    const centerPoint = Position.of(GameConstants.CANVAS_WIDTH_IN_METERS / 2 - tenFeet, rOut * 1.5 - 1);

    // Inner bounds
    const r = GameConstants.PLAYER_RADIUS;
    const innerBounds = TrackLine.of(
      Line.of(Position.of(centerPoint.x - w, centerPoint.y + h + r), Position.of(centerPoint.x + w, centerPoint.y + h + r)),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y), rIn + r),
      Line.of(Position.of(centerPoint.x + w, centerPoint.y - h - r), Position.of(centerPoint.x - w, centerPoint.y - h - r)),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y), rIn + r));

    // Outer bounds
    const outerBounds = TrackLine.of(
      Line.of(Position.of(centerPoint.x - w, centerPoint.y + rOut + oneFoot - r), Position.of(centerPoint.x + w, centerPoint.y + rOut - oneFoot - r)),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y - oneFoot), rOut - r),
      Line.of(Position.of(centerPoint.x + w, centerPoint.y - rOut - oneFoot + r), Position.of(centerPoint.x - w, centerPoint.y - rOut + oneFoot + r)),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y + oneFoot), rOut - r));

    // Inner track line
    const innerTrackLine = TrackLine.of(
      Line.of(Position.of(centerPoint.x - w, centerPoint.y + h), Position.of(centerPoint.x + w, centerPoint.y + h)),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y), rIn),
      Line.of(Position.of(centerPoint.x + w, centerPoint.y - h), Position.of(centerPoint.x - w, centerPoint.y - h)),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y), rIn));

    // Outer track line
    const outerTrackLine = TrackLine.of(
      Line.of(Position.of(centerPoint.x - w, centerPoint.y + rOut + oneFoot), Position.of(centerPoint.x + w, centerPoint.y + rOut - oneFoot)),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y - oneFoot), rOut),
      Line.of(Position.of(centerPoint.x + w, centerPoint.y - rOut - oneFoot), Position.of(centerPoint.x - w, centerPoint.y - rOut + oneFoot)),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y + oneFoot), rOut));

    // Pack line
    const packLine = TrackLine.of(
      Line.of(Position.of(centerPoint.x - w, centerPoint.y + rPack), Position.of(centerPoint.x + w, centerPoint.y + rPack)),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y), rPack),
      Line.of(Position.of(centerPoint.x + w, centerPoint.y - rPack), Position.of(centerPoint.x - w, centerPoint.y - rPack)),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y), rPack));

    // Lines
    const jammerLine = Line.of(Position.of(centerPoint.x + w - tenFeet * 3, centerPoint.y + h), Position.of(centerPoint.x + w - tenFeet * 3, centerPoint.y + rOut + oneFoot * 0.6));
    const pivotLine = Line.of(Position.of(centerPoint.x + w, centerPoint.y + h), Position.of(centerPoint.x + w, centerPoint.y + rOut - oneFoot));
    const tenFeetLines = Track.createTenFeetLines(centerPoint, w, h, rIn, rOut);

    return new Track(
      innerBounds,
      outerBounds,
      innerTrackLine,
      outerTrackLine,
      packLine,
      jammerLine,
      pivotLine,
      tenFeetLines
    );
  }

  private static createTenFeetLines(centerPoint: Position,
                                    w: number,
                                    h: number,
                                    rIn: number,
                                    rOut: number): Line[] {
    const oneFoot = GameConstants.ONE_FOOT;
    const tenFeet = GameConstants.TEN_FEET;
    const length = 0.6;
    const result: Line[] = [];

    // Bottom lines
    const centerLineBottom = Line.of(
      Position.of(centerPoint.x - w, centerPoint.y + (h + rOut + oneFoot) / 2),
      Position.of(centerPoint.x + w, centerPoint.y + (h + rOut - oneFoot) / 2));
    const bottomX1 = centerPoint.x + w - tenFeet;
    const bottomY1 = centerLineBottom.resolveY( bottomX1);
    const bottomX2 = centerPoint.x + w - tenFeet * 2;
    const bottomY2 = centerLineBottom.resolveY(bottomX2);
    result.push(Track.createLine(Position.of(bottomX1, bottomY1), length));
    result.push(Track.createLine(Position.of(bottomX2, bottomY2), length));

    // Top lines
    const centerLineTop = Line.of(
      Position.of(centerPoint.x - w, centerPoint.y - (h + rOut - oneFoot) / 2),
      Position.of(centerPoint.x + w, centerPoint.y - (h + rOut + oneFoot) / 2));
    const topX0 = centerPoint.x - w;
    const topY0 = centerLineTop.resolveY(topX0);
    const topX1 = centerPoint.x - w + tenFeet;
    const topY1 = centerLineTop.resolveY(topX1);
    const topX2 = centerPoint.x - w + tenFeet * 2;
    const topY2 = centerLineTop.resolveY(topX2);
    const topX3 = centerPoint.x - w + tenFeet * 3;
    const topY3 = centerLineTop.resolveY(topX3);
    result.push(Track.createLine(Position.of(topX0, topY0), length));
    result.push(Track.createLine(Position.of(topX1, topY1), length));
    result.push(Track.createLine(Position.of(topX2, topY2), length));
    result.push(Track.createLine(Position.of(topX3, topY3), length));

    // Right arc
    const rightCenter = Position.of(centerPoint.x + w, centerPoint.y - oneFoot / 2);
    const scalar = 1.09;
    const rightPoints = CircleTools.generateCirclePoints(rightCenter, (rIn + rOut) / 2, 6, tenFeet * scalar, 90);
    for (let i = 1; i < rightPoints.length; i++) {
      const point = rightPoints[i];
      const pos1 = MathTools.addDistanceAlongLine(Line.of(rightCenter, point), -length / 2);
      const pos2 = MathTools.addDistanceAlongLine(Line.of(rightCenter, point), length / 2);
      result.push(Line.of(pos1, pos2));
    }

    // Left arc
    const leftCenter = Position.of(centerPoint.x - w, centerPoint.y + oneFoot / 2);
    const leftPoints = CircleTools.generateCirclePoints(leftCenter, (rIn + rOut) / 2, 6, tenFeet * scalar, -90);
    for (let i = 1; i < leftPoints.length; i++) {
      const point = leftPoints[i];
      const pos1 = MathTools.addDistanceAlongLine(Line.of(leftCenter, point), -length / 2);
      const pos2 = MathTools.addDistanceAlongLine(Line.of(leftCenter, point), length / 2);
      result.push(Line.of(pos1, pos2));
    }

    return result;
  }

  private static createLine(position: Position, length: number): Line {
    return Line.of(Position.of(position.x, position.y - length / 2), Position.of(position.x, position.y + length / 2));
  }

  /**
   * Returns the track line at the given percentage (0 - 1), with:
   * - 0 being the inner track line
   * - 1 being the outer track line
   */
  public trackLineAt(percentage: number): TrackLine {
    return TrackLine.of(
      Track.interpolateLines(this.innerTrackLine.bottomLine, this.outerTrackLine.bottomLine, percentage),
      Track.interpolateCircles(this.innerTrackLine.rightCircle, this.outerTrackLine.rightCircle, percentage),
      Track.interpolateLines(this.innerTrackLine.topLine, this.outerTrackLine.topLine, percentage),
      Track.interpolateCircles(this.innerTrackLine.leftCircle, this.outerTrackLine.leftCircle, percentage)
    );
  }

  /**
   * Returns the absolute position (real world coordinates based on the relative position on the track, with:
   *  - X: Relative lane position (<0 = out of bounds (inner), 0..1 = in bounds, 1 = outside, >1 = out of bounds (outer))
   *  - Y: Relative distance traveled along track (0 = start, 0.9999... = end)
   */
  public getAbsolutePosition(relativePosition: Position): Position {
    const distance = this.packLine.distance * relativePosition.y;
    const pointOnPackLine = this.packLine.pointAtDistance(distance);
    const pointOnInnerTrackLine = this.innerBounds.getClosestPointTo(pointOnPackLine);
    const pointOnOuterTrackLine = this.outerBounds.getClosestPointTo(pointOnPackLine);
    const line = Line.of(pointOnInnerTrackLine, pointOnOuterTrackLine);
    return line.getAbsolutePositionOf(relativePosition.x);
  }

  /**
   * Returns the relative position on the track, given the absolute position (real world coordinates), with:
   *  - X: Relative lane position (<0 = out of bounds (inner), 0..1 = in bounds, 1 = outside, >1 = out of bounds (outer))
   *  - Y: Relative distance traveled along track (0 = start, 0.9999... = end)
   */
  public getRelativePosition(candidate: Position): Position {
    const pointOnPackLine = this.packLine.getClosestPointTo(candidate);
    const pointOnInnerTrackLine = this.innerTrackLine.getClosestPointTo(pointOnPackLine);
    const shapeIndex = this.packLine.findShapeIndexOf(candidate);
    const innerTrackToCandidate = Line.of(pointOnPackLine, pointOnInnerTrackLine);
    const pointOnInnerBounds = this.innerBounds.getIntersectionWith(innerTrackToCandidate, shapeIndex);
    const pointOnOuterBounds = this.outerBounds.getIntersectionWith(innerTrackToCandidate, shapeIndex);
    const innerOuterBounds = Line.of(pointOnInnerBounds, pointOnOuterBounds);
    const relativeX = innerOuterBounds.getRelativeDistanceAlong(candidate);
    const relativeY = this.packLine.getRelativeDistanceAlong(pointOnPackLine);
    return Position.of(relativeX, relativeY);
  }

  public getClosestPointOnTrackLine(player: Player, percentage: number): Position {
    const trackLine = this.trackLineAt(percentage);
    return trackLine.getClosestPointTo(player.position);
  }

  public lane(lane: number): TrackLine {
    const percentage = lane / GameConstants.LANE_COUNT;
    return this.trackLineAt(percentage);
  }

  public getPackShapes(relativeBack: Overflow, relativeFront: Overflow): Shape[] {
    const packBack = this.packLine.getAbsolutePositionOf(relativeBack.value);
    const packFront = this.packLine.getAbsolutePositionOf(relativeFront.value);
    const innerBack = this.innerTrackLine.getClosestPointTo(packBack);
    const innerFront = this.innerTrackLine.getClosestPointTo(packFront);
    const lineBack = Line.of(innerBack, packBack);
    const lineFront = Line.of(innerFront, packFront);
    const shapeIndexBack = this.innerTrackLine.findShapeIndexOf(innerBack);
    const shapeIndexFront = this.innerTrackLine.findShapeIndexOf(innerFront);
    const outerBack = this.outerTrackLine.getIntersectionWith(lineBack, shapeIndexBack);
    const outerFront = this.outerTrackLine.getIntersectionWith(lineFront, shapeIndexFront);

    // Get inner/outer shapes
    const innerShapes = this.innerTrackLine.getShapes(innerBack, innerFront);
    const outerShapes = this.outerTrackLine.getShapes(outerBack, outerFront);

    // Merge shapes
    const shapes: Shape[] = [];
    for (let i = 0; i < innerShapes.length; i++) {
      const innerShape = innerShapes[i];
      const outerShape = outerShapes[i];
      if (innerShape instanceof Line) {
        const innerLine = innerShape as Line;
        const outerLine = outerShape as Line;
        shapes.push(Quad.of(innerLine.p1, innerLine.p2, outerLine.p2, outerLine.p1));
      } else if (innerShape instanceof Arc) {
        const innerArc = innerShape as Arc;
        const outerArc = outerShape as Arc;
        shapes.push(outerShape);
        shapes.push(Triangle.of(innerArc.position, outerArc.p1, outerArc.p2));
      }
    }
    return shapes;
  }

  //
  // Utility methods
  //

  private static calculateTrackRatio(track: Track): number {
    const trackWidth = track.innerTrackLine.topLine.p2.distanceTo(track.outerTrackLine.topLine.p2);
    const trackLength = track.packLine.distance;
    return trackWidth / trackLength;
  }

  private static interpolateLines(line1: Line, line2: Line, percentage: number): Line {
    const innerWeight = 1 - percentage;
    const outerWeight = percentage;
    const x1 = line1.p1.x * innerWeight + line2.p1.x * outerWeight;
    const y1 = line1.p1.y * innerWeight + line2.p1.y * outerWeight;
    const x2 = line1.p2.x * innerWeight + line2.p2.x * outerWeight;
    const y2 = line1.p2.y * innerWeight + line2.p2.y * outerWeight;
    return Line.of(Position.of(x1, y1), Position.of(x2, y2));
  }

  private static interpolateCircles(circle1: Circle, circle2: Circle, percentage: number): Circle {
    const innerWeight = 1 - percentage;
    const outerWeight = percentage;
    const x = circle1.x * innerWeight + circle2.x * outerWeight;
    const y = circle1.y * innerWeight + circle2.y * outerWeight;
    const radius = circle1.radius * innerWeight + circle2.radius * outerWeight;
    return Circle.of(Position.of(x, y), radius);
  }
}
