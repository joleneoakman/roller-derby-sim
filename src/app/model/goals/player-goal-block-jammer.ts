import {PlayerGoal} from "./player-goal";
import {PlayerGoalType} from "./player-goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {GoalFactory} from "./goal-factory";
import {GameConstants} from "../../game/game-constants";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Overflow} from "../overflow";

export class PlayerGoalBlockJammerFactory implements GoalFactory {
  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    return player.isBlocker() && !player.hasGoal(PlayerGoalType.BLOCKER_BLOCK);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): PlayerGoalBlockJammer {
    return new PlayerGoalBlockJammer(now);
  }
}

export class PlayerGoalBlockJammer extends PlayerGoal {

  constructor(time: number) {
    super(PlayerGoalType.BLOCKER_BLOCK, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track): Player {
    const opposingJammer = players.find(p => p.isJammer() && p.team !== player.team);
    if (!opposingJammer) {
      return player;
    }

    const distance = player.distanceTo(opposingJammer);
    if (distance > GameConstants.TWENTY_FEET) {
      return player;
    }

    const relativePositionJammer = opposingJammer.relativePosition(track);
    const relativePositionPlayer = player.relativePosition(track);
    const yJammer = Overflow.of(relativePositionJammer.y);
    const yPlayer = Overflow.of(relativePositionPlayer.y);
    if (yJammer.isInFrontOf(yPlayer)) {
      return player;
    }

    const newPosition = track.getAbsolutePosition(Vector.of(relativePositionJammer.x, relativePositionPlayer.y));
    return player.withTarget(Target.of(newPosition));
  }
}
