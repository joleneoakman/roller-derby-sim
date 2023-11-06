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

  public get type(): PlayerGoalType {
    return PlayerGoalType.RETURN_IN_BOUNDS;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return !player.isInBounds(track) && !player.hasGoal(this.type);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): PlayerGoalReturnInBounds {
    const playersInFront = PlayerGoalReturnInBoundsFactory.calculatePlayersInFront(player, players, track);
    const skatedOutRelPosition = player.relativePosition(track);
    return new PlayerGoalReturnInBounds(now, playersInFront, skatedOutRelPosition, false);
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

export class PlayerGoalReturnInBounds extends PlayerGoal {

  readonly playersInFront: PlayerId[];
  readonly skatedOutRelPosition: Vector;
  readonly skatedInBeforeOut: boolean;

  constructor(time: number, playersInFront: PlayerId[], skatedOutRelPosition: Vector, skatedInBeforeOut: boolean) {
    super(PlayerGoalType.RETURN_IN_BOUNDS, time);
    this.playersInFront = playersInFront;
    this.skatedOutRelPosition = skatedOutRelPosition;
    this.skatedInBeforeOut = skatedInBeforeOut;
  }

  withSkatedInBeforeOut(skatedInBeforeOut: boolean): PlayerGoalReturnInBounds {
    return new PlayerGoalReturnInBounds(this.time, this.playersInFront, this.skatedOutRelPosition, skatedInBeforeOut);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    if (now < this.time + GameConstants.REACTION_TIME_MS / 3) {
        return player;
    }

    const inBounds = player.isInBounds(track);
    if (!inBounds || !this.skatedInBeforeOut) {
      return this.updateGoalAndTargets(player, players, track);
    } else {
      return player.clearTargets().clearGoal(this);
    }
  }

  private updateGoalAndTargets(player: Player, players: Player[], track: Track): Player {
    const rearMostRelativePosition = PlayerGoalReturnInBounds.calculateRelativePositionToSkateBackTo(this.playersInFront, player, players, track);
    const currentRelativePosition = player.relativePosition(track);
    const isOnInsideTrack = this.skatedOutRelPosition.x < 0.5;
    const relativeX = isOnInsideTrack ? -0.3 : 1.3;
    const currentYNormalized = Overflow.of(currentRelativePosition.y);
    const skatedOutYNormalized = Overflow.of(this.skatedOutRelPosition.y);
    const skatedInBeforeOut = currentYNormalized.isBehind(skatedOutYNormalized);

    let targetPos: Vector;
    if (rearMostRelativePosition) {
      const currentRelativePosition = player.relativePosition(track);
      const relativePosition = Vector.of(relativeX, Overflow.of(currentRelativePosition.y - 0.01).value);
      targetPos = track.getAbsolutePosition(relativePosition);
    } else {
      const closestPointOnTrackLine = track.getClosestPointOnTrackLine(player, 0.5);
      if (currentYNormalized.isInFrontOf(skatedOutYNormalized)) {
        const relativePosition1 = Vector.of(relativeX, Overflow.of(this.skatedOutRelPosition.y - 0.01).value);
        targetPos = track.getAbsolutePosition(relativePosition1);
      } else {
        targetPos = closestPointOnTrackLine;
      }
    }
    player = player.withTarget(Target.stopAt(targetPos));
    if (this.skatedInBeforeOut !== skatedInBeforeOut) {
      return player.updateGoal(this.withSkatedInBeforeOut(skatedInBeforeOut));
    }
    return player;
  }

  private static calculateRelativePositionToSkateBackTo(playersInFront: PlayerId[], player: Player, players: Player[], track: Track): Overflow | undefined {
    return players
      .filter(candidate => playersInFront.includes(candidate.id) && candidate.isInBounds(track) && player.isInFrontOf(candidate, track))
      .map(candidate => Overflow.of(candidate.relativePosition(track).y))
      .sort((a, b) => a.compareInFrontOf(b))
      .at(0);
  }
}
