import {Position} from "../model/position";
import {Angle} from "../model/angle";

export class ArcTools {

  public static turnTowardsAngle(currentAngle: Angle, targetAngle: Angle, maxStep: number): Angle {
    const angleDiff = targetAngle.degrees - currentAngle.degrees;
    const angleDiffAbs = Math.abs(angleDiff);
    let newAngle: number;
    if (angleDiffAbs > 180) {
      const step = Math.min(maxStep, - angleDiffAbs + 360);
      newAngle = angleDiff > 0 ? currentAngle.degrees - step : currentAngle.degrees + step;
    } else {
      const step = Math.min(maxStep, angleDiffAbs);
      newAngle = angleDiff > 0 ? currentAngle.degrees + step : currentAngle.degrees - step;
    }
    return Angle.ofDegrees(newAngle);
  }

  public static generateCirclePoints(center: Position, radius: number, count: number, distance: number, angle: number): Position[] {
    const points: Position[] = [];
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
