
export class Vector {

  public static readonly ORIGIN = Vector.of(0, 0);

  readonly x: number;
  readonly y: number;

  private constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  //
  // Create
  //

  public static of(x: number, y: number): Vector {
    return new Vector(x, y);
  }

  //
  // Getters
  //

  public get distance(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  isOrigin(): boolean {
    return this.x === 0 && this.y === 0;
  }

  public distanceTo(v: Vector): number {
    return this.minus(v).distance;
  }

  equals(p1: Vector) {
    return this.x === p1.x && this.y === p1.y;
  }

  //
  // Setters
  //

  public plus(v: Vector): Vector {
    return Vector.of(this.x + v.x, this.y + v.y);
  }

  public minus(v: Vector): Vector {
    return Vector.of(this.x - v.x, this.y - v.y);
  }

  public times(factor: number): Vector {
    return Vector.of(this.x * factor, this.y * factor);
  }
}
