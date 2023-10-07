import {Position} from "./position";

export class Rectangle {

  readonly position: Position;
  readonly width: number;
  readonly height: number;

  constructor(position: Position, width: number, height: number) {
    this.position = position;
    this.width = width;
    this.height = height;
  }

  public static of(position: Position, width: number, height: number): Rectangle {
    return new Rectangle(position, width, height);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public getCenterPoint(): Position {
    return Position.of(this.x + this.width / 2, this.y + this.height / 2);
  }
}
