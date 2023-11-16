import {GoalFactory} from "./goal-factory";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {GoalType} from "./goal-type";
import {Goal} from "./goal";
import {Vector} from "../geometry/vector";
import {Target} from "../target";


export class GoalBlockerDoLapsFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.BLOCKER_DO_LAPS;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return player.isBlocker() && !player.hasGoal(this.type);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalBlockerDoLaps {
    return new GoalBlockerDoLaps(now);
  }
}

export class GoalBlockerDoLaps extends Goal {

  constructor(time: number) {
    super(GoalType.BLOCKER_DO_LAPS, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    // Todo: target with max speed
    const relativePosition = player.relativePosition(track);
    const targetPosition = track.getAbsolutePosition(Vector.of(relativePosition.x, relativePosition.y + 0.002));
    return player.withTarget(Target.stopAt(targetPosition));
  }
}