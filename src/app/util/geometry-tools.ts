import {Circle} from "../model/circle";
import {Line} from "../model/line";
import {MathTools} from "./math-tools";
import {Rectangle} from "../model/rectangle";
import {Position} from "../model/position";
import {CollisionTools} from "./collision-tools";
import {Track} from "../model/track";
import {PlayerState} from "../state/player.state";

export class GeometryTools {

  public static containsTrackPlayer(track: Track, player: PlayerState): boolean {
    return GeometryTools.containsTrackCircle(track, player.toCircle());
  }

  public static containsTrackCircle(track: Track, circle: Circle): boolean {
    return track.trackRectangles.some(rectangle => GeometryTools.containsRectangleCircle(rectangle, circle));
  }

  public static containsRectangleCircle(rectangle: Rectangle, circle: Circle): boolean {
    if (circle.x - circle.radius < rectangle.x || circle.x + circle.radius > rectangle.x + rectangle.width) {
      return false;
    } else if (circle.y - circle.radius < rectangle.y || circle.y + circle.radius > rectangle.y + rectangle.height) {
      return false;
    }
    return true;
  }

  public static collidesTrackWithCircle(track: Track, circle: Circle): boolean {
    return track.trackRectangles.some(rectangle => CollisionTools.collidesCircleAndRectangle(circle, rectangle));
  }

  public static intersectsTrackAndCircle(track: Track, circle: Circle): boolean {
    return track.trackRectangles.some(rectangle => GeometryTools.intersectsCircleAndRectangle(circle, rectangle));
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
