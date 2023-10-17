import {PlayerGoal} from "./player-goal";
import {PlayerGoalType} from "./player-goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Vector} from "../geometry/vector";
import {Target} from "../target";

export class PlayerGoalJammerDoLaps extends PlayerGoal {

  constructor(time: number) {
    super(PlayerGoalType.JAMMER_DO_LAPS, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track): Player {
    const relativePosition = player.relativePosition(track);
    const targetPosition = track.getAbsolutePosition(Vector.of(0.8, relativePosition.y + 0.1));
    return player.withTarget(Target.of(targetPosition));
  }
}