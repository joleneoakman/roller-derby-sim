import {GoalFactory} from "./goal-factory";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {PlayerGoalType} from "./player-goal-type";
import {PlayerGoal} from "./player-goal";
import {Vector} from "../geometry/vector";
import {Target} from "../target";


export class PlayerGoalBlockerDoLapsFactory implements GoalFactory {

  public get type(): PlayerGoalType {
    return PlayerGoalType.BLOCKER_DO_LAPS;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return player.isBlocker() && !player.hasGoal(this.type);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): PlayerGoalBlockerDoLaps {
    return new PlayerGoalBlockerDoLaps(now);
  }
}

export class PlayerGoalBlockerDoLaps extends PlayerGoal {

  constructor(time: number) {
    super(PlayerGoalType.BLOCKER_DO_LAPS, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    // Todo: target with max speed
    const relativePosition = player.relativePosition(track);
    const targetPosition = track.getAbsolutePosition(Vector.of(relativePosition.x, relativePosition.y + 0.005));
    return player.withTarget(Target.of(targetPosition));
  }
}