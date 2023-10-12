import {Fill} from "./fill";

export class Stroke {
  readonly color: string;
  readonly width: number;
  readonly dotted: boolean;

  private constructor(color: string, width: number, dotted: boolean) {
    this.color = color;
    this.width = width;
    this.dotted = dotted;
  }

  public static of(color: string, width: number, dotted: boolean = false): Stroke {
    return new Stroke(color, width, dotted);
  }

  public toFill(): Fill {
    return Fill.of(this.color);
  }
}
