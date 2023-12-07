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

    const opposingJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (!opposingJammer || !pack.isInEngagementZone(opposingJammer, track)) {
      return false;
    }

    const wallCandidates = GoalBlockerFormWall.calculateWallCandidates(player.team, players, track, pack);
    const playerIndex = players.findIndex(p => p.id === player.id);
    return wallCandidates.includes(playerIndex);
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

    // Not part of wall? Clear goal
    if (!wallCandidates.includes(playerIndex)) {
      return player.clearGoal(this);
    }

    // No opposing jammer? Clear goal
    const opposingJammer = players.find(p => p.isJammer() && p.team === player.team);
    if (!opposingJammer || !pack.isInEngagementZone(opposingJammer, track)) {
      return player.clearGoal(this);
    }

    // Not in play? Clear goal
    if (!player.isInPlay(pack, track)) {
      return player.clearGoal(this);
    }

    // Wall formed? Noop
    /*const wallFormed = GoalBlockerFormWall.isWallFormed(players, wallCandidates);
    if (wallFormed) {
      return player; //.clearGoal(this);
    }*/

    const relX = this.calculateWallX(player, players, wallCandidates, track);
    const relY = wallCandidates.reduce((sum, i) => sum + players[i].relativePosition(track).y, 0) / wallCandidates.length;
    const relPos = this.offsetPerPlayer(player, players, wallCandidates, track, Vector.of(relX, relY));
    const absPos = track.getAbsolutePosition(relPos);
    return player.withTarget(Target.stopAt(absPos));
  }

  private calculateWallX(player: Player, players: Player[], wallCandidates: number[], track: Track): number {
    // Opposing jammer incoming? Move wall in front of them
    const opposingJammer = players.find(p => p.isJammer() && p.team !== player.team);
    if (opposingJammer && opposingJammer.isInBounds(track) && opposingJammer.isBehind(player, track)) {
      return opposingJammer.relativePosition(track).x;
    }

    // Otherwise, move wall to average of all players
    const averagePlayerX = wallCandidates.reduce((sum, i) => sum + players[i].relativePosition(track).x, 0) / wallCandidates.length;
    return Math.min(0.8, Math.max(0.2, averagePlayerX));
  }

  public static isWallFormed(players: Player[], wallCandidates: number[]): boolean {
    for (let i = 0; i < wallCandidates.length; i++) {
      for (let j = i + 1; j < wallCandidates.length; j++) {
        const candidate1 = players[wallCandidates[i]];
        const candidate2 = players[wallCandidates[j]];
        const distance = candidate1.position.distanceTo(candidate2.position);
        if (distance > GoalBlockerFormWall.MIN_WALL_DISTANCE) {
          return false;
        }
      }
    }
    return true;
  }

  public static calculateWallCandidates(team: Team, players: Player[], track: Track, pack: Pack): number[] {
    const validIndices = players.map((p, i) => p.isBlocker() && p.team === team && p.isInBounds(track) ? i : -1).filter(i => i >= 0);
    const fixedPlayers = players
      .map((p, i) => validIndices.includes(i) && p.hasGoal(GoalType.BLOCKER_FORM_WALL) ? i : -1)
      .filter(i => i >= 0);

    // Already (more than) 3 players in wall? Return 3 indices
    if (fixedPlayers.length >= 3) {
      console.log(fixedPlayers, fixedPlayers.slice(0, 3));
      return fixedPlayers.slice(0, 3);
    }

    // All players applicable? Return all
    if (validIndices.length <= 3) {
      return validIndices;
    }

    // Find the 3 players that are closest to each other, but always including fixedPlayers as candidates if they exist
    let minDistance = Number.MAX_VALUE;
    let closestPlayers: number[] = [];
    for (let i = 0; i < validIndices.length; i++) {
      const a = validIndices[i];
      for (let j = i + 1; j < validIndices.length; j++) {
        const b = validIndices[j];
        for (let k = j + 1; k < validIndices.length; k++) {
          const c = validIndices[k];
          const distanceSum = pack.distances[a][b] + pack.distances[b][c] + pack.distances[c][a];
          if (distanceSum < minDistance) {
            minDistance = distanceSum;
            closestPlayers = [a, b, c];
          }
        }
      }
    }
    return closestPlayers;
  }

  private offsetPerPlayer(player: Player, players: Player[], wallCandidates: number[], track: Track, wallCenter: Vector): Vector {
    const playerX = player.relativePosition(track).x;
    const minX = wallCandidates.reduce((min, i) => Math.min(min, players[i].relativePosition(track).x), Number.MAX_VALUE);
    const maxX = wallCandidates.reduce((max, i) => Math.max(max, players[i].relativePosition(track).x), Number.MIN_VALUE);
    if (playerX === minX) {
      return Vector.of(wallCenter.x - 0.1, wallCenter.y - 0.001);
    } else if (playerX === maxX) {
      return Vector.of(wallCenter.x + 0.1, wallCenter.y - 0.001);
    } else {
      return Vector.of(wallCenter.x, wallCenter.y + 0.001);
    }
  }
}