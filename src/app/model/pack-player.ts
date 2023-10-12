import {Player} from "./player";
import {Overflow} from "./overflow";

export class PackPlayer {
  readonly player: Player;
  readonly playerIndex: number;
  readonly position: Overflow;

  private constructor(player: Player, playerIndex: number, position: Overflow) {
    this.player = player;
    this.playerIndex = playerIndex;
    this.position = position;
  }

  public static of(player: Player, playerIndex: number, position: Overflow): PackPlayer {
    return new PackPlayer(player, playerIndex, position);
  }
}
