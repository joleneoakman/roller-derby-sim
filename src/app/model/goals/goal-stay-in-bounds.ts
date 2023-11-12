import {GoalFactory} from "./goal-factory";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {Vector} from "../geometry/vector";
import {Target} from "../target";


export class GoalStayInBoundsFactory implements GoalFactory {
  get type(): GoalType {
    return GoalType.STAY_IN_BOUNDS;
  }

  create(now: number, player: Player, players: Player[], track: Track, pack: Pack): Goal {
    return new GoalStayInBounds(now, player.relativePosition(track));
  }

  test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (player.hasGoal(this.type)) {
      return false;
    }

    if (!player.isInBounds(track)) {
      return false;
    }

    const relativeX = player.relativePosition(track).x;
    return relativeX < 0.1 || relativeX > 0.9;
  }
}

export class GoalStayInBounds extends Goal {

  exitRelPos: Vector;

  constructor(time: number, exitRelPos: Vector) {
    super(GoalType.STAY_IN_BOUNDS, time);
    this.exitRelPos = exitRelPos;
  }

  override execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    if (!player.isInBounds(track)) {
      return player.clearGoal(this);
    }

    const relativePosition = player.relativePosition(track);
    const relativeX = relativePosition.x;
    let targetRelX = relativeX;
    if (relativeX > 0.95) {
      targetRelX = 0.8;
    } else if (relativeX < 0.05) {
      targetRelX = 0.2;
    } else {
      return player.clearGoal(this);
    }

    const targets = player.targets;
    const targetRelY = targets.length > 0 ? track.getRelativePosition(targets[0].position).y : relativePosition.y;
    const targetPosition = track.getAbsolutePosition(Vector.of(targetRelX, targetRelY));
    return player.withTarget(Target.speedUpTo(targetPosition));
  }
}