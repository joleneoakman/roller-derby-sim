import {Track} from "../track";
import {Player} from "../player";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {GoalType} from "./goal-type";

export interface GoalFactory {

  /**
   * The type of goal this factory creates.
   */
  get type(): GoalType;

  /**
   * Test if the player is eligible for this goal.
   */
  test(player: Player, players: Player[], track: Track, pack: Pack): boolean;

  /**
   * Create a new goal for the player.
   */
  create(now: number, player: Player, players: Player[], track: Track, pack: Pack): Goal;
}