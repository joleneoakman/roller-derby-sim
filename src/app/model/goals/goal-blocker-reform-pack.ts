import {GoalFactory} from "./goal-factory";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Overflow} from "../overflow";

export class GoalBlockerReformPackFactory implements GoalFactory {
  get type(): GoalType {
    return GoalType.BLOCKER_REFORM_PACK;
  }

  create(now: number, player: Player, players: Player[], track: Track, pack: Pack): Goal {
    return new GoalBlockerReformPack(now, player.relativePosition(track));
  }

  test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (player.isJammer() || player.hasGoal(this.type)) {
      return false;
    }

    const activePack = pack.activePack;
    if (!!activePack) {
      return false;
    }

    const playerIndex = players.findIndex(p => p.id === player.id);
    const indexToReform = GoalBlockerReformPack.calculatePlayerIndexToReform(track, pack);
    return playerIndex === indexToReform;
  }
}

export class GoalBlockerReformPack extends Goal {

  exitRelPos: Vector;

  constructor(time: number, exitRelPos: Vector) {
    super(GoalType.BLOCKER_REFORM_PACK, time);
    this.exitRelPos = exitRelPos;
  }

  override execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const activePack = pack.activePack;
    if (!!activePack) {
      return player.clearGoal(this);
    }

    const playerIndex = players.findIndex(p => p.id === player.id);
    const indexToReform = GoalBlockerReformPack.calculatePlayerIndexToReform(track, pack);
    let skateForward = false;
    if (playerIndex === indexToReform) {
      // Player in rear with greatest distance speeds up to front to close the gap
      skateForward = true;
    } else {
      skateForward = GoalBlockerReformPack.calculateMostBlockersAreBehindPlayer(player, players, track);
    }

    const curRelPos = player.relativePosition(track);
    const relTargetPos = Vector.of(0.5, curRelPos.y + (skateForward ? 0.05 : - 0.05));
    const targetPos = track.getAbsolutePosition(relTargetPos);
    return player.withTarget(Target.speedUpTo(targetPos));
  }

  public static calculatePlayerIndexToReform(track: Track, pack: Pack) {
    const positionsAndIndices = pack.positions
      .map((p, i) => ({position: p, index: i}))
      .filter(p => !pack.players[p.index].isJammer() && pack.players[p.index].isInBounds(track));
    positionsAndIndices.sort((a, b) => a.position - b.position);

    let maxDistance = 0;
    let index = -1;
    const totalDistance = track.packLine.distance;
    const distances = [];
    for (let i = 0; i < positionsAndIndices.length - 1; i++) {
      const p1 = positionsAndIndices[i];
      const p2 = positionsAndIndices[i + 1];
      const o1 = Overflow.of(p1.position, totalDistance);
      const o2 = Overflow.of(p2.position, totalDistance);
      const candidateDistance = o1.distanceTo(o2);
      distances.push(candidateDistance);
      if (candidateDistance > maxDistance && candidateDistance < totalDistance / 2) {
        maxDistance = candidateDistance;
        index = p1.index;
      }
    }
    return index;
  }

  public static calculateMostBlockersAreBehindPlayer(player: Player, players: Player[], track: Track): boolean {
    const playerRelPos = player.relativePosition(track);
    const playerY = Overflow.of(playerRelPos.y, track.packLine.distance);

    let blockersBehind = 0;
    let blockersInFront = 0;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.isJammer() || !p.isInBounds(track)) {
        continue;
      }

      const pRelPos = p.relativePosition(track);
      const pY = Overflow.of(pRelPos.y, track.packLine.distance);
      if (pY.isBehind(playerY)) {
        blockersBehind++;
      } else {
        blockersInFront++;
      }
    }
    return blockersInFront < blockersBehind;
  }
}