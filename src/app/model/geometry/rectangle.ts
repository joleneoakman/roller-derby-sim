import {Vector} from "./vector";
import {Shape} from "./shape";

export class Rectangle implements Shape {

  readonly position: Vector;
  readonly width: number;
  readonly height: number;

  constructor(position: Vector, width: number, height: number) {
    this.position = position;
    this.width = width;
    this.height = height;
  }

  public static of(position: Vector, width: number, height: number): Rectangle {
    return new Rectangle(position, width, height);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public getCenterPoint(): Vector {
    return Vector.of(this.x + this.width / 2, this.y + this.height / 2);
  }
}
