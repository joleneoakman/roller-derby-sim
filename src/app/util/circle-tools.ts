import {Position} from "../model/position";

export class CircleTools {

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
