import {Vector} from "./vector";
import {Shape} from "./shape";

export class Triangle implements Shape {
  readonly p1: Vector;
  readonly p2: Vector;
  readonly p3: Vector;

  constructor(p1: Vector, p2: Vector, p3: Vector) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  public static of(p1: Vector, p2: Vector, p3: Vector): Triangle {
    return new Triangle(p1, p2, p3);
  }

  public containsPoint(point: Vector): boolean {
    const { p1, p2, p3 } = this;
    const areaOrig = Triangle.of(p1, p2, p3).area;
    const area1 = Triangle.of(point, p2, p3).area;
    const area2 = Triangle.of(p1, point, p3).area;
    const area3 = Triangle.of(p1, p2, point).area;
    return areaOrig === (area1 + area2 + area3);
  }

  public get area(): number {
    const { p1, p2, p3 } = this;
    return Math.abs((p1.x*(p2.y-p3.y) + p2.x*(p3.y-p1.y) + p3.x*(p1.y-p2.y)) / 2);
  }
}
