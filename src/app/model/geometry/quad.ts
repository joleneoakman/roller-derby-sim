import {Vector} from "./vector";

export class Quad {
  readonly p1: Vector;
  readonly p2: Vector;
  readonly p3: Vector;
  readonly p4: Vector;

  constructor(p1: Vector, p2: Vector, p3: Vector, p4: Vector) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
  }

  public static of(p1: Vector, p2: Vector, p3: Vector, p4: Vector): Quad {
    return new Quad(p1, p2, p3, p4);
  }

  /**
   * Returns true if the quad, defined by the four points, contains the given point.
   */
  public containsPoint(candidate: Vector): boolean {
    const points = [this.p1, this.p2, this.p3, this.p4];
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
}
