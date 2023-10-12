import {Stroke} from "./stroke";

export class Fill {
  readonly color: string;

  private constructor(color: string) {
    this.color = color;
  }

  public static of(color: string): Fill {
    return new Fill(color);
  }

  public toStroke(width: number): Stroke {
    return Stroke.of(this.color, width);
  }
}