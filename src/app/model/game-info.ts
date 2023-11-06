import {Info} from "./info";

export class GameInfo {
  public readonly playerInfo: Info[];
  public readonly packInfo: Info[];

  constructor(playerInfo: Info[], packInfo: Info[]) {
    this.playerInfo = playerInfo;
    this.packInfo = packInfo;
  }

  public static of(playerInfo: Info[], packInfo: Info[]): GameInfo {
    return new GameInfo(playerInfo, packInfo);
  }

  //
  // Getters
  //

  public hasPlayerInfo(): boolean {
    return this.playerInfo.length > 0;
  }
}
