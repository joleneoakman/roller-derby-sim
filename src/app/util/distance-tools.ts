import {Position} from "../model/position";
import {Circle} from "../model/circle";
import {PlayerState} from "../state/player.state";

export class DistanceTools {

  public static ofPositions(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  }

  public static ofCircleToPosition(circle: Circle, position: Position): number {
    return DistanceTools.ofPositions(circle.position, position) - circle.radius;
  }

  public static ofCircles(circle1: Circle, circle2: Circle): number {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    return Math.sqrt(dx * dx + dy * dy) - circle1.radius - circle2.radius;
  }
}
