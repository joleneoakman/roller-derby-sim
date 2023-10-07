import {Position} from "../model/position";

export class SelectionState {

  readonly index: number;
  readonly targetPosition?: Position;

  constructor(index: number, targetPosition?: Position) {
    this.index = index;
    this.targetPosition = targetPosition;
  }

  public static of(index: number, targetPosition: Position): SelectionState {
    return new SelectionState(index, targetPosition);
  }

  public withIndex(index: number): SelectionState {
    return new SelectionState(index, undefined);
  }

  public withTargetPosition(targetPosition: Position): SelectionState {
    return new SelectionState(this.index, targetPosition);
  }
}
