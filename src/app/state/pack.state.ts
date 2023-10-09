import {PlayerState} from "./player.state";
import {TrackLine} from "../model/track-line";
import {Pack} from "../model/pack";
import {GameConstants} from "../game/game-constants";
import {Pair} from "../model/pair";

export class PackState {

  readonly players: PlayerState[];
  readonly positions: number[]; // Position on the pack line (in meters)
  readonly distances: number[][]; // Distances between players along the pack line (in meters)
  readonly packs: Pack[];
  readonly activePackIndex: number; // Pack index or -1 if no active pack
  readonly splitPackIndex1: number; // Pack index or -1 if no split pack
  readonly splitPackIndex2: number; // Pack index or -1 if no split pack

  constructor(players: PlayerState[], packLine: TrackLine) {
    this.players = players;
    this.positions = PackState.calculatePositions(this.players, packLine);
    this.distances = PackState.calculateDistances(this.players, this.positions, packLine.distance);
    this.packs = PackState.calculatePacks(this.players, this.positions, this.distances, packLine);

    const activePackIndices = PackState.calculateActivePack(this.packs);
    this.activePackIndex = activePackIndices.a;
    this.splitPackIndex1 = activePackIndices.b.a;
    this.splitPackIndex2 = activePackIndices.b.b;
  }

  public static create(players: PlayerState[], packLine: TrackLine): PackState {
    return new PackState(players, packLine);
  }

  public get activePack(): Pack | undefined {
    return this.packs[this.activePackIndex];
  }

  public get splitPack(): Pair<Pack, Pack> | undefined {
    if (this.splitPackIndex1 === -1 || this.splitPackIndex2 === -1) {
      return undefined;
    }
    return Pair.of(this.packs[this.splitPackIndex1], this.packs[this.splitPackIndex2]);
  }

  //
  // Utility methods
  //

  private static calculatePositions(players: PlayerState[], packLine: TrackLine): number[] {
    const count = players.length;
    const positions: number[] = new Array(count);
    for (let i = 0; i < count; i++) {
      positions[i] = packLine.distanceAlong(players[i].position);
    }
    return positions;
  }

  private static calculateDistances(players: PlayerState[], positions: number[], totalDistance: number): number[][] {
    const halfTotalDistance = totalDistance / 2;
    const count = players.length;
    const distances: number[][] = new Array(count);
    for (let i = 0; i < count; i++) {
      const distancesToPlayer: number[] = new Array(count);
      for (let j = 0; j < count; j++) {
        if (i === j) {
          distancesToPlayer[j] = 0;
        } else {
          let distance = Math.abs(positions[i] - positions[j]);
          distance = distance > halfTotalDistance ? totalDistance - distance : distance;
          distancesToPlayer[j] = distance;
        }
      }
      distances[i] = distancesToPlayer;
    }
    return distances;
  }

  private static calculatePacks(players: PlayerState[], positions: number[], distances: number[][], packLine: TrackLine): Pack[] {
    const totalDistance = packLine.distance;
    const count = players.length;

    // Calculate which players within ten feet of each other
    const playersWithinTenFeet: boolean[][] = new Array(count);
    for (let i = 0; i < count; i++) {
      const row: boolean[] = new Array(count);
      for (let j = 0; j < count; j++) {
        if (i === j) {
          row[j] = true;
        } else {
          row[j] = distances[i][j] < GameConstants.TEN_FEET;
        }
      }
      playersWithinTenFeet[i] = row;
    }

    // Cluster the players within ten feet of each other in a pack
    const visited = new Array(count).fill(false);
    const packs: Pack[] = [];

    for (let i = 0; i < count; i++) {
      if (!visited[i]) {
        const packPlayerIndices: number[] = [];
        const stack = [i];
        visited[i] = true;

        while (stack.length > 0) {
          const currentPlayer = stack.pop() as number;
          packPlayerIndices.push(currentPlayer);

          for (let j = 0; j < count; j++) {
            if (!visited[j] && playersWithinTenFeet[currentPlayer][j]) {
              stack.push(j);
              visited[j] = true;
            }
          }
        }

        packs.push(Pack.of(packPlayerIndices, players, positions, totalDistance));
      }
    }

    return packs;
  }

  private static calculateActivePack(packs: Pack[]): Pair<number, Pair<number, number>> {
    let curSize = 0;
    let candidatePackIndices: number[] = [];
    for (let i = 0; i < packs.length; i++) {
      const pack = packs[i];
      if (pack.size > curSize && pack.hasBothTeams) {
        curSize = pack.size;
        candidatePackIndices = [i];
      } else if (pack.size === curSize && pack.hasBothTeams) {
        candidatePackIndices.push(i);
      }
    }

    if (candidatePackIndices.length === 1) {
      return Pair.of(candidatePackIndices[0], Pair.of(-1, -1));
    } else if (candidatePackIndices.length === 2) {
      return Pair.of(-1, Pair.of(candidatePackIndices[0], candidatePackIndices[1]));
    } else {
      return Pair.of(-1, Pair.of(-1, -1));
    }
  }
}
