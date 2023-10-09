import {Position} from "./position";

export class PlayerSelection {

  readonly index: number;
  readonly targetPosition?: Position;

  constructor(index: number, targetPosition?: Position) {
    this.index = index;
    this.targetPosition = targetPosition;
  }

  public static of(index: number, targetPosition: Position): PlayerSelection {
    return new PlayerSelection(index, targetPosition);
  }

  public withIndex(index: number): PlayerSelection {
    return new PlayerSelection(index, undefined);
  }

  public withTargetPosition(targetPosition: Position): PlayerSelection {
    return new PlayerSelection(this.index, targetPosition);
  }
}
