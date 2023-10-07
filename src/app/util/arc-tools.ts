import {GameConstants} from "../game/game-constants";
import {Position} from "../model/position";

export class ArcTools {

  public static toAngle(x: number, y: number): number {
    return ((- Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  }

  public static turnTowardsAngle(currentAngle: number, targetAngle: number): number {
    const angleDiff = targetAngle - currentAngle;
    const angleDiffAbs = Math.abs(angleDiff);
    let newAngle: number;
    if (angleDiffAbs > 180) {
      const step = Math.min(GameConstants.TURN_STEP_DEGREES, - angleDiffAbs + 360);
      newAngle = angleDiff > 0 ? currentAngle - step : currentAngle + step;
    } else {
      const step = Math.min(GameConstants.TURN_STEP_DEGREES, angleDiffAbs);
      newAngle = angleDiff > 0 ? currentAngle + step : currentAngle - step;
    }
    return newAngle;
  }

  public static generateCirclePoints(center: Position, radius: number, count: number, distance: number, angle: number): Position[] {
    const points: { x: number, y: number }[] = [];
    let radian = angle * (Math.PI / 180); // Convert to radians

    for (let i = 0; i < count; i++) {
      const pointX = center.x + radius * Math.cos(radian);
      const pointY = center.y + radius * Math.sin(radian);
      points.push(Position.of(pointX, pointY));

      radian -= 2 * Math.asin(distance / (2 * radius));
    }
    return points;
  }
}
