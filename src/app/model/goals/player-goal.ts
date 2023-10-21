import {PlayerGoalType} from "./player-goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";

export abstract class PlayerGoal {

  readonly type: PlayerGoalType;
  readonly time: number;

  protected constructor(type: PlayerGoalType, time: number) {
    this.type = type;
    this.time = time;
  }

  public abstract execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player;
}