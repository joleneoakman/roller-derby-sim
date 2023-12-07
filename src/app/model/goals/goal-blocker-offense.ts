import {Goal} from "./goal";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {GoalFactory} from "./goal-factory";
import {Target} from "../target";
import {GoalBlockerBlock} from "./goal-blocker-block";
import {GameConstants} from "../../game/game-constants";
import {GoalBlockerFormWall} from "./goal-blocker-form-wall";

export class GoalBlockerOffenseFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.BLOCKER_OFFENSE;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (!player.isBlocker() || player.hasGoal(this.type)) {
      return false;
    }

    const activePack = pack.activePack;
    if (!activePack) {
      return false;
    }

    if (!player.isInPlay(pack, track)) {
      return false;
    }


    const ownJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (ownJammer && !pack.isInEngagementZone(ownJammer, track)) {
      return false;
    }

    const opposingJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (!opposingJammer) {
      return true;
    }

    return GoalBlockerOffense.canDoOffense(players, player, track, pack);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalBlockerOffense {
    return new GoalBlockerOffense(now);
  }
}

export class GoalBlockerOffense extends Goal {

  constructor(time: number) {
    super(GoalType.BLOCKER_OFFENSE, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const activePack = pack.activePack;
    if (!activePack) {
      return player.clearGoal(this);
    }

    if (!player.isInPlay(pack, track)) {
      return player.clearGoal(this);
    }

    const ownJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (!ownJammer || !pack.isInEngagementZone(ownJammer, track)) {
      return player.clearGoal(this);
    }

    const opposingJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (opposingJammer && pack.isInEngagementZone(opposingJammer, track)) {
      const canDoOffense = GoalBlockerOffense.canDoOffense(players, player, track, pack);
      if (!canDoOffense) {
        return player.clearGoal(this);
      }
    }

    const opposingBlockerToHit = GoalBlockerOffense.findOpposingBlockerClosestToJammer(player, ownJammer, players, track, pack);
    if (!opposingBlockerToHit) {
      return player.clearGoal(this);
    }

    const targetRelPos = opposingBlockerToHit.relativePosition(track);
    const targetAbsPos = track.getAbsolutePosition(targetRelPos);
    return player.withTarget(Target.speedUpTo(targetAbsPos));
  }

  private static findOpposingBlockerClosestToJammer(player: Player, ownJammer: Player, players: Player[], track: Track, pack: Pack): Player | undefined {
    let minDistanceToJammer = Number.MAX_VALUE;
    let index = -1;

    for (let i = 0; i < players.length; i++) {
      const candidate = players[i];
      if (candidate.isJammer() || candidate.id === player.id || candidate.team === player.team || !candidate.isInPlay(pack, track)) {
        continue;
      }

      const distanceToJammer = candidate.distanceTo(ownJammer);
      if (distanceToJammer < minDistanceToJammer) {
        minDistanceToJammer = distanceToJammer;
        index = i;
      }
    }

    return index === -1 ? undefined : players[index];
  }

  public static canDoOffense(players: Player[], player: Player, track: Track, pack: Pack) {
    const playerIndex = players.findIndex(p => p.id === player.id);
    const wallCandidates = GoalBlockerFormWall.calculateWallCandidates(player.team, players, track, pack);
    return !wallCandidates.includes(playerIndex);
  }
}
