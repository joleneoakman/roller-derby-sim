import {PackWarningType} from "./pack-warning-type";

export class PackWarning {

  readonly type: PackWarningType;
  readonly time: number;

  constructor(type: PackWarningType, time: number) {
    this.type = type;
    this.time = time;
  }

  //
  // Create
  //

  public static of(type: PackWarningType, time: number): PackWarning {
    return new PackWarning(type, time);
  }
}