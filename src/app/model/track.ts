import {Rectangle} from "./rectangle";
import {Circle} from "./circle";
import {Position} from "./position";
import {DistanceTools} from "../util/distance-tools";
import {Triangle} from "./triangle";
import {GameConstants} from "../game/game-constants";
import {Line} from "./line";
import {MathTools} from "../util/math-tools";
import {ArcTools} from "../util/arc-tools";

export class Track {

  readonly innerRectangle: Rectangle;
  readonly innerCircles: Circle[];
  readonly trackRectangles: Rectangle[];
  readonly trackTriangles: Triangle[];
  readonly trackCircles: Circle[];
  readonly jammerLine: Line;
  readonly pivotLine: Line;
  readonly tenFeetLines: Line[];

  constructor(innerRectangle: Rectangle, innerCircles: Circle[], trackRectangles: Rectangle[], trackTriangles: Triangle[], trackCircles: Circle[], jammerLine: Line, pivotLine: Line, tenFeetLines: Line[]) {
    this.innerRectangle = innerRectangle;
    this.innerCircles = innerCircles;
    this.trackRectangles = trackRectangles;
    this.trackTriangles = trackTriangles;
    this.trackCircles = trackCircles;
    this.jammerLine = jammerLine;
    this.pivotLine = pivotLine;
    this.tenFeetLines = tenFeetLines;
  }

  public static create(): Track {
    const oneFoot = GameConstants.ONE_FOOT;
    const tenFeet = GameConstants.TEN_FEET;
    const w = 5.33;
    const h = 3.81;
    const rIn = 3.81;
    const rOut = 8.08;
    const centerPoint = Position.of(GameConstants.CANVAS_WIDTH_IN_METERS / 2, rOut * 1.5 - 1);
    const innerRectangle = Rectangle.of(Position.of(centerPoint.x - w, centerPoint.y - h), w * 2, h * 2);
    const innerCircles = [
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y), h),
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y), h)
    ]
    const trackRectangles = [
      Rectangle.of(Position.of(centerPoint.x - w, centerPoint.y - rOut), w * 2, rOut * 2 - oneFoot)
    ];
    const trackTriangles = [
      Triangle.of(
        Position.of(centerPoint.x - w, centerPoint.y - rOut),
        Position.of(centerPoint.x + w, centerPoint.y - rOut + oneFoot),
        Position.of(centerPoint.x + w, centerPoint.y - rOut - oneFoot)
      ),
      Triangle.of(
        Position.of(centerPoint.x - w, centerPoint.y + rOut),
        Position.of(centerPoint.x - w, centerPoint.y + rOut - oneFoot * 2),
        Position.of(centerPoint.x + w, centerPoint.y + rOut - oneFoot)
      ),
    ];
    const trackCircles = [
      Circle.of(Position.of(centerPoint.x + w, centerPoint.y - oneFoot), rOut),
      Circle.of(Position.of(centerPoint.x - w, centerPoint.y), rOut),
    ];
    const jammerLine = Line.of(Position.of(centerPoint.x + w - tenFeet * 3, centerPoint.y + h), Position.of(centerPoint.x + w - tenFeet * 3, centerPoint.y + rOut));
    const pivotLine = Line.of(Position.of(centerPoint.x + w, centerPoint.y + h), Position.of(centerPoint.x + w, centerPoint.y + rOut - oneFoot));
    const tenFeetLines = Track.createTenFeetLines(centerPoint, w, h, rIn, rOut);
    return new Track(innerRectangle, innerCircles, trackRectangles, trackTriangles, trackCircles, jammerLine, pivotLine, tenFeetLines);
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
    const averageBottomLine = Line.of(
      Position.of(centerPoint.x - w, centerPoint.y + (h + rOut) / 2),
      Position.of(centerPoint.x + w, centerPoint.y + (h + rOut - oneFoot) / 2));
    const bottomX1 = centerPoint.x + w - tenFeet;
    const bottomY1 = MathTools.getYFor(averageBottomLine, bottomX1);
    const bottomX2 = centerPoint.x + w - tenFeet * 2;
    const bottomY2 = MathTools.getYFor(averageBottomLine, bottomX2);
    result.push(Track.createLine(Position.of(bottomX1, bottomY1), length));
    result.push(Track.createLine(Position.of(bottomX2, bottomY2), length));

    // Top lines
    const averageTopLine = Line.of(
      Position.of(centerPoint.x - w, centerPoint.y - (h + rOut) / 2),
      Position.of(centerPoint.x + w, centerPoint.y - (h + rOut + oneFoot) / 2));
    const topX0 = centerPoint.x - w;
    const topY0 = MathTools.getYFor(averageTopLine, topX0);
    const topX1 = centerPoint.x - w + tenFeet;
    const topY1 = MathTools.getYFor(averageTopLine, topX1);
    const topX2 = centerPoint.x - w + tenFeet * 2;
    const topY2 = MathTools.getYFor(averageTopLine, topX2);
    const topX3 = centerPoint.x - w + tenFeet * 3;
    const topY3 = MathTools.getYFor(averageTopLine, topX3);
    result.push(Track.createLine(Position.of(topX0, topY0), length));
    result.push(Track.createLine(Position.of(topX1, topY1), length));
    result.push(Track.createLine(Position.of(topX2, topY2), length));
    result.push(Track.createLine(Position.of(topX3, topY3), length));

    // Right arc
    const rightCenter = Position.of(centerPoint.x + w, centerPoint.y - oneFoot / 2);
    const rightPoints = ArcTools.generateCirclePoints(rightCenter, (rIn + rOut) / 2, 6, tenFeet * 1.08, 90);
    for (let i = 1; i < rightPoints.length; i++) {
      const point = rightPoints[i];
      const pos1 = MathTools.addDistanceAlongLine(Line.of(rightCenter, point), -length / 2);
      const pos2 = MathTools.addDistanceAlongLine(Line.of(rightCenter, point), length / 2);
      result.push(Line.of(pos1, pos2));
    }

    // Left arc
    const leftCenter = Position.of(centerPoint.x - w, centerPoint.y);
    const leftPoints = ArcTools.generateCirclePoints(leftCenter, (rIn + rOut) / 2, 6, tenFeet * 1.08, -90);
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

  public getClosestCenterPointFor(circle: Circle): Position {
    let minimumDistance = Number.MAX_VALUE;
    let result: Position = this.trackRectangles[0].getCenterPoint();
    for (let i = 0; i < this.trackRectangles.length; i++) {
      const rectangle = this.trackRectangles[i];
      const candidate = rectangle.getCenterPoint();
      const distance = DistanceTools.ofCircleToPosition(circle, candidate);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        result = candidate;
      }
    }
    return result;
  }
}
