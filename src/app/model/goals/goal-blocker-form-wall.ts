import {GoalFactory} from "./goal-factory";
import {GoalType} from "./goal-type";
import {Player} from "../player";
import {Track} from "../track";
import {Pack} from "../pack";
import {Goal} from "./goal";
import {Team} from "../team";
import {GameConstants} from "../../game/game-constants";
import {Vector} from "../geometry/vector";
import {Target} from "../target";
import {Overflow} from "../overflow";

export class GoalBlockerFormWallFactory implements GoalFactory {

  public get type(): GoalType {
    return GoalType.BLOCKER_FORM_WALL;
  }

  public test(player: Player, players: Player[], track: Track, pack: Pack): boolean {
    if (!player.isBlocker()  || player.hasGoal(this.type)) {
      return false;
    }

    if (!player.isInBounds(track)) {
      return false;
    }

    const wallCandidates = GoalBlockerFormWall.calculateWallCandidates(player.team, players, track, pack);
    const playerIndex = players.findIndex(p => p.id === player.id);
    if (!wallCandidates.includes(playerIndex)) {
      return false;
    }

    return !GoalBlockerFormWall.isWallFormed(players, wallCandidates);
  }

  public create(now: number, player: Player, players: Player[], track: Track, pack: Pack): GoalBlockerFormWall {
    return new GoalBlockerFormWall(now);
  }
}

export class GoalBlockerFormWall extends Goal {

  public static readonly MIN_WALL_DISTANCE = GameConstants.PLAYER_RADIUS * 2.8;

  constructor(time: number) {
    super(GoalType.BLOCKER_FORM_WALL, time);
  }

  execute(now: number, player: Player, players: Player[], track: Track, pack: Pack): Player {
    const wallCandidates = GoalBlockerFormWall.calculateWallCandidates(player.team, players, track, pack);
    const playerIndex = players.findIndex(p => p.id === player.id);
    if (!wallCandidates.includes(playerIndex)) {
      return player.clearGoal(this);
    }

    const wallFormed = GoalBlockerFormWall.isWallFormed(players, wallCandidates);
    if (wallFormed) {
      return player.clearGoal(this);
    }

    const candidate1 = players[wallCandidates[0]];
    const candidate2 = players[wallCandidates[1]];
    const candidate3 = players[wallCandidates[2]];
    const targetY = (candidate1.position.y + candidate2.position.y + candidate3.position.y) / 3;
    const ownJammer = players.find(p => p.isJammer() && p.team === player.team);

    let targetX = this.calculateWallX(candidate1, candidate2, candidate3);
    if (!!ownJammer && pack.isInEngagementZone(ownJammer, track)) {
      const jammerX = Overflow.of(ownJammer.relativePosition(track).x, track.packLine.distance);
      targetX = jammerX.isBehind(Overflow.of(targetX, track.packLine.distance)) ? targetX - 0.06 : targetX;
    }

    const targetPosition = Vector.of(targetX, targetY);
    return player.withTarget(Target.stopAt(targetPosition));
  }

  private calculateWallX(candidate1: Player, candidate2: Player, candidate3: Player): number {
    const averagePlayerX = (candidate1.position.x + candidate2.position.x + candidate3.position.x) / 3;
    return Math.min(0.8, Math.max(0.2, averagePlayerX));
  }

  public static isWallFormed(players: Player[], wallCandidates: number[]): boolean {
    if (wallCandidates.length !== 3) {
      return false;
    }

    const candidate1 = players[wallCandidates[0]];
    const candidate2 = players[wallCandidates[1]];
    const candidate3 = players[wallCandidates[2]];
    const distance1 = candidate1.position.distanceTo(candidate2.position);
    const distance2 = candidate2.position.distanceTo(candidate3.position);
    const distance3 = candidate3.position.distanceTo(candidate1.position);
    return distance1 <= GoalBlockerFormWall.MIN_WALL_DISTANCE
      && distance2 <= GoalBlockerFormWall.MIN_WALL_DISTANCE
      && distance3 <= GoalBlockerFormWall.MIN_WALL_DISTANCE;
  }

  public static calculateWallCandidates(team: Team, players: Player[], track: Track, pack: Pack): number[] {
    const validIndices = players.map((p, i) => p.isBlocker() && p.team === team && p.isInBounds(track) ? i : -1).filter(i => i >= 0);

    let minDistance = Number.MAX_VALUE;
    let closestPlayers: number[] = [];
    for (let i = 0; i < players.length; i++) {

      if (!validIndices.includes(i)) {
        continue;
      }

      for (let j = i + 1; j < players.length; j++) {

        if (!validIndices.includes(j)) {
          continue;
        }

        for (let k = j + 1; k < players.length; k++) {

          if (!validIndices.includes(k)) {
            continue;
          }

          const distanceSum = pack.distances[i][j] + pack.distances[j][k] + pack.distances[k][i];
          if (distanceSum < minDistance) {
            minDistance = distanceSum;
            closestPlayers = [i, j, k];
          }
        }
      }
    }

    return closestPlayers;
  }
}