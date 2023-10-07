import {Position} from "./position";

export class Circle {
  readonly position: Position;
  readonly radius: number;

  constructor(position: Position, radius: number) {
    this.position = position;
    this.radius = radius;
  }

  public static of(position: Position, radius: number): Circle {
    return new Circle(position, radius);
  }

  public withPosition(position: Position): Circle {
    return new Circle(position, this.radius);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }
}
