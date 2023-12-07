import {GoalFactory} from "./goal-factory";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Circle} from "../geometry/circle";
import {GameConstants} from "../../game/game-constants";
import {Line} from "../geometry/line";
import {Renderer} from "../../renderer/renderer";


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

    const isGoingOutOfBounds = GoalStayInBounds.isGoingOutOfBounds(player, track);
    if (isGoingOutOfBounds) {
      return true;
    }

    const relativeX = player.relativePosition(track).x;
    return relativeX < GoalStayInBounds.MIN_X || relativeX > GoalStayInBounds.MAX_X;
  }
}

export class GoalStayInBounds extends Goal {

  public static readonly MIN_X = 0.08;
  public static readonly MAX_X = 0.92;
  public static readonly MARGIN = 0.02;

  exitRelPos: Vector;

  constructor(time: number, exitRelPos: Vector) {
    super(GoalType.STAY_IN_BOUNDS, time);
    this.exitRelPos = exitRelPos;
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    if (!player.isInBounds(track)) {
      return player.clearGoal(this);
    }

    // If going out of bounds, adjust target to center or stop immediately
    const isGoingOutOfBounds = GoalStayInBounds.isGoingOutOfBounds(player, track);
    if (isGoingOutOfBounds && player.velocity.speed.kph > 0) {
      if (player.targets.length > 0) {
        const relTarget = track.getRelativePosition(player.targets[0].position);
        const absTarget = track.getAbsolutePosition(Vector.of(0.5, relTarget.y));
        return player.withTarget(Target.speedUpTo(absTarget));
      }
      return player.withTarget(Target.stopAt(player.position));
    }

    // When nearing the track boundary, go back a bit
    const relPos = player.relativePosition(track);
    if (relPos.x < GoalStayInBounds.MIN_X || relPos.x > GoalStayInBounds.MAX_X) {
      let targetRelX = relPos.x;
      if (relPos.x > GoalStayInBounds.MAX_X) {
        targetRelX = GoalStayInBounds.MAX_X - GoalStayInBounds.MARGIN;
      } else if (relPos.x < GoalStayInBounds.MIN_X) {
        targetRelX = GoalStayInBounds.MIN_X + GoalStayInBounds.MARGIN;
      }
      const targetPos = track.getAbsolutePosition(Vector.of(targetRelX, relPos.y));
      return player.withTarget(Target.speedUpTo(targetPos));
    }

    // When in a good position, done!
    return player.clearGoal(this);
  }

  public static isGoingOutOfBounds(player: Player, track: Track): boolean {
    const stoppingDistance = Player.calculateStoppingDistance(player.velocity.speed.kph) + GameConstants.ONE_FOOT;
    const stoppingPosition = Circle.of(player.position, stoppingDistance).getPositionAt(player.velocity.angle);
    return !track.isInBounds(stoppingPosition);
  }
}