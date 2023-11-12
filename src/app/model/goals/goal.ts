import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";

export abstract class Goal {

  readonly type: GoalType;
  readonly time: number;

  protected constructor(type: GoalType, time: number) {
    this.type = type;
    this.time = time;
  }

  public abstract execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player;
}