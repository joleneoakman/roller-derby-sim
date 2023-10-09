import {Circle} from "../model/circle";
import {Line} from "../model/line";
import {MathTools} from "./math-tools";
import {Rectangle} from "../model/rectangle";
import {Position} from "../model/position";
import {TrackLine} from "../model/track-line";

export class GeometryTools {

  public static containsTrackLinePoint(trackLine: TrackLine, p: Position): boolean {
    // Check if point is inside the center quad
    const containsQuadPoint = GeometryTools.containsQuadPoint(
      trackLine.bottomLine.p1,
      trackLine.bottomLine.p2,
      trackLine.topLine.p1,
      trackLine.topLine.p2,
      p);
    if (containsQuadPoint) {
      return true;
    }

    // Check if point is the left arc
    const containsLeftArcPoint = trackLine.leftCircle.containsPoint(p);
    if (containsLeftArcPoint) {
      return true;
    }

    // Check if point is the right arc
    return trackLine.rightCircle.containsPoint(p);
  }

  /**
   * Returns true if the quad, defined by the four points, contains the given point.
   */
  public static containsQuadPoint(p1: Position, p2: Position, p3: Position, p4: Position, candidate: Position): boolean {
    const points = [p1, p2, p3, p4];
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;

      const intersect = ((yi > candidate.y) !== (yj > candidate.y)) &&
        (candidate.x < (xj - xi) * (candidate.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public static containsRectanglePoint(rect: Rectangle, p: Position): boolean {
    return (p.x >= rect.x && p.x <= rect.x + rect.width) && (p.y >= rect.y && p.y <= rect.y + rect.height);
  }

  public static intersectsCircleAndLine(circle: Circle, line: Line): boolean {
    const x1 = line.p1.x;
    const x2 = line.p2.x;
    const y1 = line.p1.y;
    const y2 = line.p2.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const dot = ((circle.x - x1) * (x2 - x1) + (circle.y - y1) * (y2 - y1)) / (len * len);
    const closestX = x1 + dot * (x2 - x1);
    const closestY = y1 + dot * (y2 - y1);

    if (MathTools.clamp(dot, 0, 1) === dot) {
      const distX = closestX - circle.x;
      const distY = closestY - circle.y;
      if (distX * distX + distY * distY <= circle.radius * circle.radius) {
        return true;
      }
    }
    return false;
  }

  public static intersectsCircleAndRectangle(circle: Circle, rect: Rectangle): boolean {
    const lines = [
      Line.of(Position.of(rect.x, rect.y), Position.of(rect.x + rect.width, rect.y)), // Top
      Line.of(Position.of(rect.x, rect.y + rect.height), Position.of(rect.x + rect.width, rect.y + rect.height)), // Bottom
      Line.of(Position.of(rect.x, rect.y), Position.of(rect.x, rect.y + rect.height)), // Left
      Line.of(Position.of(rect.x + rect.width, rect.y), Position.of(rect.x + rect.width, rect.y + rect.height)) // Right
    ];

    for (const line of lines) {
      if (GeometryTools.intersectsCircleAndLine(circle, line)) {
        return true;
      }
    }
    return false;
  }
}
