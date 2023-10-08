import {PlayerState} from "./player.state";
import {TrackLine} from "../model/track-line";
import {Pack} from "../model/pack";
import {GameConstants} from "../game/game-constants";

export class PackState {

  readonly players: PlayerState[];
  readonly positions: number[]; // Position on the pack line (in meters)
  readonly distances: number[][]; // Distances between players along the pack line (in meters)
  readonly packs: Pack[];

  constructor(players: PlayerState[], packLine: TrackLine) {
    this.players = players;
    this.positions = PackState.calculatePositions(this.players, packLine);
    this.distances = PackState.calculateDistances(this.players, this.positions, packLine.distance);
    this.packs = PackState.calculatePacks(this.players, this.positions, this.distances, packLine);
  }

  public static create(players: PlayerState[], packLine: TrackLine): PackState {
    return new PackState(players, packLine);
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
}
