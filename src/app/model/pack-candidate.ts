import {Player} from "./player";
import {Team} from "./team";
import {GameConstants} from "../game/game-constants";

/**
 * Represents a pack of players, defined by start and end positions (according to pack line).
 */
export class PackCandidate {
  readonly start: number;
  readonly end: number;
  readonly playerIndices: number[];
  readonly hasBothTeams: boolean;

  constructor(start: number, end: number, players: number[], hasBothTeams: boolean) {
    this.start = start;
    this.end = end;
    this.playerIndices = players;
    this.hasBothTeams = hasBothTeams;
  }

  public static of(playerIndices: number[], players: Player[], positions: number[], totalDistance: number): PackCandidate {
    const packPositions = playerIndices.map(i => positions[i]);
    let start = Math.min(...packPositions) - GameConstants.PLAYER_RADIUS;
    let end = Math.max(...packPositions) + GameConstants.PLAYER_RADIUS;
    const switchStartAndEnd = (end - start) > totalDistance / 2;
    const hasBothTeams = PackCandidate.hasBothTeams(playerIndices, players);
    return new PackCandidate(switchStartAndEnd ? end : start, switchStartAndEnd ? start : end, playerIndices, hasBothTeams);
  }

  public get size(): number {
    return this.playerIndices.length;
  }

  public includes(playerIndex: number): boolean {
    return this.playerIndices.includes(playerIndex);
  }

  //
  // Utility methods
  //

  private static hasBothTeams(playerIndices: number[], players: Player[]): boolean {
    let hasA = false;
    let hasB = false;
    for (const index of playerIndices) {
      const player = players[index];
      if (player.team === Team.A) {
        hasA = true;
      } else if (player.team === Team.B) {
        hasB = true;
      }
    }
    return hasA && hasB;
  }
}
