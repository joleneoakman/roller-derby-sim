import {Position} from "./position";

export class Triangle {
  readonly p1: Position;
  readonly p2: Position;
  readonly p3: Position;

  constructor(p1: Position, p2: Position, p3: Position) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  public static of(p1: Position, p2: Position, p3: Position): Triangle {
    return new Triangle(p1, p2, p3);
  }

  public containsPoint(point: Position): boolean {
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
