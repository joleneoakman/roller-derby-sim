import {Track} from "../track";
import {Player} from "../player";
import {Pack} from "../pack";
import {PlayerGoal} from "./player-goal";

export interface GoalFactory {

  /**
   * Test if the player is eligible for this goal.
   */
  test(player: Player, players: Player[], track: Track, pack: Pack): boolean;

  /**
   * Create a new goal for the player.
   */
  create(now: number, player: Player, players: Player[], track: Track, pack: Pack): PlayerGoal;
}