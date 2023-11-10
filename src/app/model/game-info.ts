import {Info} from "./info";

export class GameInfo {
  public readonly playerInfo: Info[];
  public readonly packInfo: Info[];
  public readonly scoreInfo: Info[];

  constructor(playerInfo: Info[], packInfo: Info[], scoreInfo: Info[]) {
    this.playerInfo = playerInfo;
    this.packInfo = packInfo;
    this.scoreInfo = scoreInfo;
  }

  public static of(playerInfo: Info[], packInfo: Info[], scoreInfo: Info[]): GameInfo {
    return new GameInfo(playerInfo, packInfo, scoreInfo);
  }

  //
  // Getters
  //

  public hasPlayerInfo(): boolean {
    return this.playerInfo.length > 0;
  }
}
