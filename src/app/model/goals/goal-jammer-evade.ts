import {GoalFactory} from "./goal-factory";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {GameConstants} from "../../game/game-constants";
import {Target} from "../target";
import {Vector} from "../geometry/vector";

export class GoalJammerEvadeFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.JAMMER_EVADE;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (player.hasGoal(this.type)) {
      return false;
    }

    if (!player.isJammer()) {
      return false;
    }

    if (!player.isInPlay(pack, track)) {
      return false;
    }

    return GoalJammerEvade.calculateBlockersInFront(player, players, track, pack).length > 0;
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalJammerEvade {
    return new GoalJammerEvade(now);
  }
}

export class GoalJammerEvade extends Goal {

  constructor(time: number) {
    super(GoalType.JAMMER_EVADE, time);
  }

  execute(now: number, jammer: Player, players: Player[], track: Track, pack: Pack): Player {
    if (!jammer.isInPlay(pack, track)) {
      return jammer.clearGoal(this);
    }

    const blockersInFront = GoalJammerEvade.calculateBlockersInFront(jammer, players, track, pack);
    if (blockersInFront.length === 0) {
      return jammer.clearGoal(this);
    }

    const blockerRelPositions = blockersInFront.map(blocker => blocker.relativePosition(track));
    const jammerRelPosition = jammer.relativePosition(track);
    const relX = this.calculateOptimalX(jammerRelPosition, blockerRelPositions);
    const relY = jammerRelPosition.y + 0.02;
    const target1Position = track.getAbsolutePosition(Vector.of(relX, relY));
    const target2Position = track.getAbsolutePosition(Vector.of(0.5, relY + 0.1));
    return jammer.withTargets([
      relX > 0.7 ? Target.stopAt(target1Position) : Target.speedUpTo(target1Position),
      Target.speedUpTo(target2Position)
    ]);  
  }

  private calculateOptimalX(jammerRelPosition: Vector, blockerRelPositions: Vector[]): number {
    const blockerXs = blockerRelPositions.map(blocker => blocker.x);
    const blockerXsSorted = blockerXs.sort((a, b) => a - b);
    const xCandidates = GoalJammerEvade.calculateXCandidates(blockerXsSorted);

    let maxDistance = 0;
    let optimalX = jammerRelPosition.x;
    for (let i = 0; i < xCandidates.length; i++) {
      const xCandidate = xCandidates[i];
      const minDistanceCandidate = GoalJammerEvade.calculateMaxDistance(xCandidate, blockerXsSorted);
      if (minDistanceCandidate > maxDistance) {
        maxDistance = minDistanceCandidate;
        optimalX = xCandidate;
      }
    }
    const averageOptimalX = optimalX * 3/4 + jammerRelPosition.x / 4;
    return Math.max(0.05, Math.min(averageOptimalX, 0.95));
  }

  public static calculateBlockersInFront(jammer: Player, players: Player[], track: Track, pack: Pack): Player[] {
    return players
      .filter(candidate => this.isApplicableAndInFrontOf(jammer, candidate, track, pack));
  }

  private static isApplicableAndInFrontOf(jammer: Player, candidate: Player, track: Track, pack: Pack) {
    return jammer !== candidate
      && candidate.isBlocker()
      && candidate.isInPlay(pack, track)
      && candidate.isInFrontOf(jammer, track)
      && candidate.distanceTo(jammer) < GameConstants.TEN_FEET / 2;
  }

  private static calculateXCandidates(blockerXsSorted: number[]): number[] {
    const candidateXs: number[] = [0];
    for (let i = 1; i < blockerXsSorted.length; i++) {
      const a = blockerXsSorted[i - 1];
      const b = blockerXsSorted[i];
      candidateXs.push((a + b) / 2);
    }
    candidateXs.push(1);
    return candidateXs;
  }

  private static calculateMaxDistance(xCandidate: number, blockerXsSorted: number[]): number {
    let maxDistance = 0;
    for (let i = 0; i < blockerXsSorted.length; i++) {
      const blockerX = blockerXsSorted[i];
      const distance = Math.abs(xCandidate - blockerX);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
    return maxDistance;
  }
}