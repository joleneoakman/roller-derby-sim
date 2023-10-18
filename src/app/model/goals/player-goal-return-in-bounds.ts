import {PlayerGoal} from "./player-goal";
import {PlayerGoalType} from "./player-goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Target} from "../target";
import {PlayerId} from "../player-id";
import {Vector} from "../geometry/vector";
import {Overflow} from "../overflow";
import {GameConstants} from "../../game/game-constants";
import {Pack} from "../pack";
import {GoalFactory} from "./goal-factory";

export class PlayerGoalReturnInBoundsFactory implements GoalFactory {

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return !player.isInBounds(track) && !player.hasGoal(PlayerGoalType.RETURN_IN_BOUNDS);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): PlayerGoalReturnInBounds {
    return new PlayerGoalReturnInBounds(now, player, players, track);
  }
}

export class PlayerGoalReturnInBounds extends PlayerGoal {

  readonly outOfBoundsY: Overflow;
  readonly playersInFront: PlayerId[];

  constructor(time: number, player: Player, players: Player[], track: Track) {
    super(PlayerGoalType.RETURN_IN_BOUNDS, time);
    this.playersInFront = PlayerGoalReturnInBounds.calculatePlayersInFront(player, players, track);
    this.outOfBoundsY = Overflow.of(player.relativePosition(track).y);
  }

  execute(now: number, player: Player, players: Player[], track: Track): Player {
    if (now < this.time + GameConstants.REACTION_TIME_MS) {
        return player;
    }

    const inBounds = player.isInBounds(track);
    if (!inBounds) {
      const targetPosition = this.calculateTarget(player, players, track);
      return player.withTarget(Target.of(targetPosition));
    } else {
      return player.clearTargets().clearGoal(PlayerGoalType.RETURN_IN_BOUNDS);
    }
  }

  private calculateTarget(player: Player, players: Player[], track: Track): Vector {
    const rearMostRelativePosition = PlayerGoalReturnInBounds.calculateRelativePositionToSkateBackTo(this.playersInFront, player, players, track);
    const currentRelativePosition = player.relativePosition(track);
    const isOnInsideTrack = player.isOnInsideTrack(track);
    if (rearMostRelativePosition) {
      const relativeX = isOnInsideTrack ? -0.3 : 1.3;
      const currentRelativePosition = player.relativePosition(track);
      const relativePosition = Vector.of(relativeX, Overflow.of(currentRelativePosition.y - 0.1).value);
      return track.getAbsolutePosition(relativePosition);
    } else {
      const closestPointOnTrackLine = track.getClosestPointOnTrackLine(player, 0.5);
      if (Overflow.of(currentRelativePosition.y).isInFrontOf(Overflow.of(this.outOfBoundsY.value))) {
        const relativeX = isOnInsideTrack ? -0.3 : 1.3;
        const relativePosition1 = Vector.of(relativeX, Overflow.of(this.outOfBoundsY.value - 0.1).value);
        return track.getAbsolutePosition(relativePosition1);
      }
      return closestPointOnTrackLine;
    }
  }

  private static calculateRelativePositionToSkateBackTo(playersInFront: PlayerId[], player: Player, players: Player[], track: Track): Overflow | undefined {
    return players
      .filter(candidate => playersInFront.includes(candidate.id) && candidate.isInBounds(track) && player.isInFrontOf(candidate, track))
      .map(candidate => Overflow.of(candidate.relativePosition(track).y))
      .sort((a, b) => a.compareInFrontOf(b))
      .at(0);
  }

  private static calculatePlayersInFront(player: Player, players: Player[], track: Track): PlayerId[] {
    return players
      .filter(candidate => this.isApplicableAndInFrontOf(player, candidate, track))
      .map(candidate => candidate.id);
  }

  private static isApplicableAndInFrontOf(player: Player, candidate: Player, track: Track) {
    return player !== candidate
      && candidate.isInBounds(track)
      && candidate.isInFrontOf(player, track)
      && candidate.distanceTo(player) < GameConstants.TEN_FEET;
  }
}
