import {Goal} from "./goal";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Pack} from "../pack";
import {GoalFactory} from "./goal-factory";

export class GoalJammerDoLapsFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.JAMMER_DO_LAPS;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return player.isJammer() && !player.hasGoal(this.type);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalJammerDoLaps {
    return new GoalJammerDoLaps(now);
  }
}

export class GoalJammerDoLaps extends Goal {

  constructor(time: number) {
    super(GoalType.JAMMER_DO_LAPS, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const relativePosition = player.relativePosition(track);
    const relY = relativePosition.y + 0.01;
    const targetX = this.calculateTargetX(relY);
    const relX = (relativePosition.x + targetX) / 2;
    const targetPosition = track.getAbsolutePosition(Vector.of(relX, relY));
    return player.withTarget(Target.speedUpTo(targetPosition));
  }

  /**
   * Calculate the best relative X for the given relative Y for the jammer:
   *  - Outside track on straight parts
   *  - Inside track on curves
   */
  private calculateTargetX(y: number): number {
    const inputX = y - 0.06;
    return this.calculateSinY(inputX * 2 + 0.25) * 0.9 + 0.05;
  }

  /**
   * Method that gives a Y value for a given X value along the following sine wave:
   *  - frequency: 1 (crosses the x-axis at 0, 0.5, 1, etc.)
   *  - amplitude: 0.5 (y-values range from 0 to 1)
   */
  private calculateSinY(x: number): number {
    return 0.5 * Math.sin(2 * Math.PI * x) + 0.5;
  }
}