import {Vector} from "../model/geometry/vector";

export class CircleTools {

  public static generateCirclePoints(center: Vector, radius: number, count: number, distance: number, angle: number): Vector[] {
    const points: Vector[] = [];
    let radian = angle * (Math.PI / 180); // Convert to radians

    for (let i = 0; i < count; i++) {
      const pointX = center.x + radius * Math.cos(radian);
      const pointY = center.y + radius * Math.sin(radian);
      points.push(Vector.of(pointX, pointY));

      radian -= 2 * Math.asin(distance / (2 * radius));
    }
    return points;
  }
}
