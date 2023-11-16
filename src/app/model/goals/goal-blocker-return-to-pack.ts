import {GoalFactory} from "./goal-factory";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {GoalType} from "./goal-type";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Overflow} from "../overflow";


export class GoalBlockerReturnToPackFactory implements GoalFactory {
  get type(): GoalType {
    return GoalType.BLOCKER_RETURN_TO_PACK;
  }

  create(now: number, player: Player, players: Player[], track: Track, pack: Pack): Goal {
    return new GoalBlockerReturnToPack(now, player.relativePosition(track));
  }

  test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (player.isJammer() || player.hasGoal(this.type)) {
      return false;
    }

    const activePack = pack.activePack;
    if (activePack === undefined) {
      return false;
    }

    return !pack.isInEngagementZone(player, track);
  }
}

export class GoalBlockerReturnToPack extends Goal {

  exitRelPos: Vector;

  constructor(time: number, exitRelPos: Vector) {
    super(GoalType.BLOCKER_RETURN_TO_PACK, time);
    this.exitRelPos = exitRelPos;
  }

  override execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const activePack = pack.activePack;
    if (activePack === undefined) {
      return player.clearGoal(this);
    }

    if (pack.isInEngagementZone(player, track)) {
      return player.clearGoal(this);
    }

    const frontPosition = track.getAbsolutePosition(Vector.of(0.5, activePack.relativeFront.value));
    const backPosition = track.getAbsolutePosition(Vector.of(0.5, activePack.relativeBack.value));
    const distanceToFront = frontPosition.distanceTo(this.exitRelPos);
    const distanceToBack = backPosition.distanceTo(this.exitRelPos);
    const targetRelY = distanceToFront < distanceToBack ? activePack.relativeFront : activePack.relativeBack;
    const curRelPos = player.relativePosition(track);
    const isBehind = Overflow.of(curRelPos.y).isBehind(targetRelY);
    const relTargetPos = Vector.of(0.5, isBehind ? curRelPos.y + 0.05 : curRelPos.y - 0.05);
    const targetPos = track.getAbsolutePosition(relTargetPos);
    return player.withTarget(Target.speedUpTo(targetPos));
  }
}