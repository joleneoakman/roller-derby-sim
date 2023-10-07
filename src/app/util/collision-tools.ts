import {Circle} from "../model/circle";
import {Pair} from "../model/pair";
import {Position} from "../model/position";
import {PlayerState} from "../state/player.state";
import {DistanceTools} from "./distance-tools";
import {Rectangle} from "../model/rectangle";
import {MathTools} from "./math-tools";

export class CollisionTools {

  /**
   * Returns true if the given circle collides with this circle.
   */
  public static collidesCircles(circle1: Circle, circle2: Circle): boolean {
    const distance = DistanceTools.ofCircles(circle1, circle2);
    return distance < 0;
  }

  public static collidesCircleAndRectangle(circle: Circle, rect: Rectangle): boolean {
    // Find the closest point on the rectangle to the circle's center
    const closestX = MathTools.clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = MathTools.clamp(circle.y, rect.y, rect.y + rect.height);

    // Calculate the distance between the circle's center and this closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    // Check if this distance is less than or equal to the circle's radius
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  public static collideCircles(circle1: Circle, circle2: Circle): Pair<Circle, Circle> {
    // Step 1: Calculate distance between centers
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Step 2: Calculate overlap
    const overlap = (circle2.radius + circle1.radius) - distance;

    if (overlap <= 0) {
      return Pair.of(circle1, circle2);
    }

    // Step 3: Divide the overlap by 2
    const halfOverlap = overlap / 2;

    // Step 4: Calculate direction to move each circle
    const ax = dx / distance;
    const ay = dy / distance;

    // Step 5: Update positions
    const x1 = circle1.x + ax * halfOverlap;
    const y1 = circle1.y + ay * halfOverlap;

    const x2 = circle2.x - ax * halfOverlap;
    const y2 = circle2.y - ay * halfOverlap;

    const circleNew1 = circle1.withPosition(Position.of(x1, y1));
    const circleNew2 = circle2.withPosition(Position.of(x2, y2));
    return Pair.of(circleNew1, circleNew2);
  }

  public static collidePlayers(player1: PlayerState, player2: PlayerState): Pair<PlayerState, PlayerState> {
    // If there is no collision, return the original players
    const distance = DistanceTools.ofPlayers(player1, player2);
    if (distance > 0) {
      return Pair.of(player1, player2);
    }

    // Recalculate player velocities based on initial velocities and masses


    // Correct player positions if they are overlapping
    if (distance < 0) {
      const corrected = CollisionTools.collideCircles(player1.toCircle(), player2.toCircle());
      player1 = player1.withPosition(corrected.a.position);
      player2 = player2.withPosition(corrected.b.position);
    }
    return Pair.of(player1, player2);
  }
}
