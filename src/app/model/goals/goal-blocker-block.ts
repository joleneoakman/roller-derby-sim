import {Goal} from "./goal";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {GoalFactory} from "./goal-factory";
import {GameConstants} from "../../game/game-constants";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Overflow} from "../overflow";

export class GoalBlockerBlockFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.BLOCKER_BLOCK;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (!player.isBlocker() || player.hasGoal(this.type)) {
      return false;
    }

    const opposingJammer = players.find(p => p.isJammer() && p.team !== player.team);
    if (!opposingJammer) {
      return false;
    }

    const distance = player.distanceTo(opposingJammer);
    if (distance > GameConstants.TWENTY_FEET) {
      return false;
    }

    if (!player.isInPlay(pack, track)) {
      return false;
    }

    const relativePositionJammer = opposingJammer.relativePosition(track);
    const relativePositionPlayer = player.relativePosition(track);
    const yJammer = Overflow.of(relativePositionJammer.y);
    const yPlayer = Overflow.of(relativePositionPlayer.y);
    if (yJammer.isInFrontOf(yPlayer)) {
      return false;
    }
    return true;
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalBlockerBlock {
    return new GoalBlockerBlock(now);
  }
}

export class GoalBlockerBlock extends Goal {

  constructor(time: number) {
    super(GoalType.BLOCKER_BLOCK, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const opposingJammer = players.find(p => p.isJammer() && p.team !== player.team);
    if (!opposingJammer) {
      return player.clearGoal(this);
    }

    const distance = player.distanceTo(opposingJammer);
    if (distance > GameConstants.TWENTY_FEET) {
      return player.clearGoal(this);
    }

    if (!player.isInPlay(pack, track)) {
      return player.clearGoal(this);
    }

    const relativePositionJammer = opposingJammer.relativePosition(track);
    const relativePositionPlayer = player.relativePosition(track);
    const yJammer = Overflow.of(relativePositionJammer.y);
    const yPlayer = Overflow.of(relativePositionPlayer.y);
    if (yJammer.isInFrontOf(yPlayer)) {
      return player.clearGoal(this);
    }

    const newPosition = track.getAbsolutePosition(Vector.of(relativePositionJammer.x, relativePositionPlayer.y));
    return player.withTarget(Target.stopAt(newPosition));
  }
}
