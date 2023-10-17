import {PlayerGoal} from "./player-goal";
import {PlayerGoalType} from "./player-goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Target} from "../target";
import {PlayerId} from "../player-id";
import {Vector} from "../geometry/vector";
import {Overflow} from "../overflow";
import {GameConstants} from "../../game/game-constants";

export class PlayerGoalReturnInBounds extends PlayerGoal {

  readonly playersInFront: PlayerId[];

  constructor(time: number, player: Player, players: Player[], track: Track) {
    super(PlayerGoalType.RETURN_IN_BOUNDS, time);
    this.playersInFront = PlayerGoalReturnInBounds.calculatePlayersInFront(player, players, track);
  }

  execute(now: number, player: Player, players: Player[], track: Track): Player {
    if (now < this.time + GameConstants.REACTION_TIME_MS) {
        return player;
    }

    const inBounds = player.isInBounds(track);
    if (!inBounds) {
      const targetPosition = PlayerGoalReturnInBounds.calculateTarget(this.playersInFront, player, players, track);
      return player.withTarget(Target.of(targetPosition));
    } else {
      return player.clearTargets().markGoalAsDone(PlayerGoalType.RETURN_IN_BOUNDS);
    }
  }

  private static calculateTarget(playersInFront: PlayerId[], player: Player, players: Player[], track: Track): Vector {
    const rearMostRelativePosition = PlayerGoalReturnInBounds.calculateRelativePositionToSkateBackTo(playersInFront, player, players, track);
    if (!rearMostRelativePosition) {
      return track.getClosestPointOnTrackLine(player, 0.5);
    } else {
      const isOnInsideTrack = player.isOnInsideTrack(track);
      const relativeX = isOnInsideTrack ? -0.3 : 1.3;
      const currentRelativePosition = player.relativePosition(track);
      const relativePosition = Vector.of(relativeX, Overflow.of(currentRelativePosition.y - 0.1).value);
      return track.getAbsolutePosition(relativePosition);
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
