import {Circle} from "../model/circle";
import {Line} from "../model/line";
import {MathTools} from "./math-tools";
import {Rectangle} from "../model/rectangle";
import {Position} from "../model/position";
import {Track} from "../model/track";
import {PlayerState} from "../state/player.state";
import {DistanceTools} from "./distance-tools";
import {Triangle} from "../model/triangle";
import {Arc} from "../model/arc";
import {TrackLine} from "../model/track-line";

export class GeometryTools {

  public static isInBounds(track: Track, player: PlayerState): boolean {
    const insideOuterBounds = GeometryTools.containsTrackLinePoint(track.outerBounds, player.position);
    const insideInnerBounds = GeometryTools.containsTrackLinePoint(track.innerBounds, player.position);
    return insideOuterBounds && !insideInnerBounds;
  }

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
    const containsLeftArcPoint = GeometryTools.containsCirclePoint(trackLine.leftCircle, p);
    if (containsLeftArcPoint) {
      return true;
    }

    // Check if point is the right arc
    return GeometryTools.containsCirclePoint(trackLine.rightCircle, p);
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

  /**
   * Returns true if the given arc contains the given point.
   */
  public static containsArcPoint(arc: Arc, p: Position): boolean {
    // Todo: this isn't correct yet, probably angles are messed up

    // Calculate distance from point to center of arc
    const dx = p.x - arc.position.x;
    const dy = p.y - arc.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if point is within the circle defined by the radius
    if (distance > arc.radius) return false;

    // Calculate angle relative to arc center
    let angle = Math.atan2(dy, dx);

    // Convert to positive angle in [0, 2 * PI]
    if (angle < 0) angle += 2 * Math.PI;

    // Normalize angles to positive values in [0, 2 * PI]
    let startAngle = arc.startAngle.radians;
    let endAngle = arc.endAngle.radians;

    // Account for angles that cross the 0/2*PI line
    if (endAngle < startAngle) {
      return (angle >= startAngle && angle <= 2 * Math.PI) || (angle >= 0 && angle <= endAngle);
    }

    return angle >= startAngle && angle <= endAngle;
  }

  public static containsCirclePoint(circle: Circle, p: Position): boolean {
    const distance = DistanceTools.ofCircleToPosition(circle, p);
    return distance <= 0;
  }

  public static containsTrianglePoint(triangle: Triangle, p: Position): boolean {
    const { p1, p2, p3 } = triangle;
    const areaOrig = this.areaOfTriangle(p1, p2, p3);
    const area1 = this.areaOfTriangle(p, p2, p3);
    const area2 = this.areaOfTriangle(p1, p, p3);
    const area3 = this.areaOfTriangle(p1, p2, p);
    return areaOrig === (area1 + area2 + area3);
  }

  public static areaOfTriangle(p1: Position, p2: Position, p3: Position): number {
    return Math.abs((p1.x*(p2.y-p3.y) + p2.x*(p3.y-p1.y) + p3.x*(p1.y-p2.y)) / 2);
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


  static getClosestPointOnCenterTrack(track: Track, player: PlayerState): Position {
    const position = player.position;
    const candidates: Position[] = [];
    const trackLine = track.trackLineAt(0.5);
    candidates.push(GeometryTools.getClosestPointOnLine(trackLine.topLine, position));
    candidates.push(GeometryTools.getClosestPointOnLine(trackLine.bottomLine, position));
    candidates.push(trackLine.leftArc.getClosestPoint(position));
    candidates.push(trackLine.rightArc.getClosestPoint(position));

    let minimumDistance = Number.MAX_VALUE;
    let result = candidates[0];
    for (const candidate of candidates) {
      const distance = DistanceTools.ofPositions(position, candidate);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        result = candidate;
      }
    }
    return result;
  }

  public static getClosestPointOnLine(line: Line, p: Position): Position {
    const { p1, p2 } = line;
    const lineLen = DistanceTools.ofPositions(p1, p2);
    const t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / (lineLen * lineLen);

    const tClamped = MathTools.clamp(t, 0, 1);

    const closestX = p1.x + tClamped * (p2.x - p1.x);
    const closestY = p1.y + tClamped * (p2.y - p1.y);

    return Position.of(closestX, closestY);
  }
}
