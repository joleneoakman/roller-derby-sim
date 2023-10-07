export class Outline {
  readonly color: string;
  readonly width: number;

  private constructor(color: string, width: number) {
    this.color = color;
    this.width = width;
  }

  public static of(color: string, width: number): Outline {
    return new Outline(color, width);
  }
}
