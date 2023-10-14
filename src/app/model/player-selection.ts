export class PlayerSelection {

  readonly index: number;

  constructor(index: number) {
    this.index = index;
  }

  public static of(index: number): PlayerSelection {
    return new PlayerSelection(index);
  }
}
