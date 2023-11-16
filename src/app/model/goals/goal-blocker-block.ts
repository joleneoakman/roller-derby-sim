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
    if (GoalBlockerBlock.hasJammerPassedBlocker(relativePositionJammer, relativePositionPlayer)) {
      return false;
    }

    return !GoalBlockerBlock.isWorstPositionBlocker(player, opposingJammer, players, track);
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

    if (GoalBlockerBlock.isWorstPositionBlocker(player, opposingJammer, players, track)) {
      return player.clearGoal(this);
    }

    const relativePositionJammer = opposingJammer.relativePosition(track);
    const relativePositionPlayer = player.relativePosition(track);
    if (GoalBlockerBlock.hasJammerPassedBlocker(relativePositionJammer, relativePositionPlayer)) {
      return player.clearGoal(this);
    }

    const playerInFrontOfJammer = player.isInFrontOf(opposingJammer, track);
    const xJammer = relativePositionJammer.x;
    const newX = Math.max(Math.min(0.9, xJammer), 0.1);
    const newY = playerInFrontOfJammer ? relativePositionPlayer.y : relativePositionJammer.y + 0.03;
    const newPosition = track.getAbsolutePosition(Vector.of(newX, newY));
    return player.withTarget(Target.stopAt(newPosition));
  }

  public static hasJammerPassedBlocker(relativePositionJammer: Vector, relativePositionPlayer: Vector): boolean {
    const yJammer = Overflow.of(relativePositionJammer.y);
    const yPlayer = Overflow.of(relativePositionPlayer.y + 0.04);
    return yJammer.isInFrontOf(yPlayer);
  }

  public static isWorstPositionBlocker(player: Player, opposingJammer: Player, players: Player[], track: Track) : boolean {
    const playerIndex = players.findIndex(p => p.id === player.id);
    const distanceToJammer = player.distanceTo(opposingJammer);

    let blockersCloserToJammer = 0;
    let blockersOnTrack = 0;
    for (let i = 0; i < players.length; i++) {
      const candidate = players[i];
      if (i === playerIndex || candidate.isJammer() || candidate.team !== player.team || !candidate.isInBounds(track)) {
        continue;
      }
      blockersOnTrack++;
      const distance = candidate.distanceTo(opposingJammer);
      if (distance < distanceToJammer) {
        blockersCloserToJammer++;
      }
    }
    return blockersCloserToJammer === blockersOnTrack;
  }
}
