import {Player} from "./player";
import {TrackLine} from "./track-line";
import {PackCandidate} from "./pack-candidate";
import {GameConstants} from "../game/game-constants";
import {Pair} from "./pair";
import {PackPlayer} from "./pack-player";
import {Overflow} from "./overflow";
import {Track} from "./track";
import {PackWarningType} from "./pack-warning-type";

export class Pack {

  readonly players: Player[];
  readonly positions: number[]; // Position on the pack line (in meters)
  readonly distances: number[][]; // Distances between players along the pack line (in meters)
  readonly packs: PackCandidate[];
  readonly activePackIndex: number; // Pack index or -1 if no active pack
  readonly splitPackIndex1: number; // Pack index or -1 if no split pack
  readonly splitPackIndex2: number; // Pack index or -1 if no split pack

  readonly isSplit: boolean;
  readonly playerIndicesBehindPack: number[];
  readonly playerIndicesInFrontOfPack: number[];

  private constructor(players: Player[], track: Track) {
    this.players = players;
    this.positions = Pack.calculatePositions(this.players, track.packLine);
    this.distances = Pack.calculateDistances(this.players, this.positions, track.packLine.distance);
    this.packs = Pack.calculatePacks(this.players, this.positions, this.distances, track);

    const activePackIndices = Pack.calculateActivePack(this.packs);
    this.activePackIndex = activePackIndices.a;
    this.splitPackIndex1 = activePackIndices.b.a;
    this.splitPackIndex2 = activePackIndices.b.b;

    this.isSplit = this.splitPackIndex1 !== -1 && this.splitPackIndex2 !== -1;
    this.playerIndicesBehindPack = Pack.getPlayerIndicesBehindPack(this.activePack, this.players, track);
    this.playerIndicesInFrontOfPack = Pack.getPlayerIndicesInFrontOfPack(this.activePack, this.players, track);
  }

  public static create(players: Player[], track: Track): Pack {
    return new Pack(players, track);
  }

  //
  // Getters
  //

  public get activePack(): PackCandidate | undefined {
    return this.activePackIndex === -1 ? undefined : this.packs[this.activePackIndex];
  }

  public get splitPack(): Pair<PackCandidate, PackCandidate> | undefined {
    if (this.splitPackIndex1 === -1 || this.splitPackIndex2 === -1) {
      return undefined;
    }
    return Pair.of(this.packs[this.splitPackIndex1], this.packs[this.splitPackIndex2]);
  }

  public get isFront(): boolean {
    return this.activePack !== undefined && this.playerIndicesInFrontOfPack.length === 0 && this.playerIndicesBehindPack.length > 0;
  }

  public get isBack(): boolean {
    return this.activePack !== undefined && this.playerIndicesInFrontOfPack.length > 0 && this.playerIndicesBehindPack.length === 0;
  }

  public get isAll(): boolean {
    return this.activePack !== undefined && this.playerIndicesInFrontOfPack.length === 0 && this.playerIndicesBehindPack.length === 0;
  }

  public isInPlay(player: Player, track: Track): boolean {
    if (!player.isInBounds(track)) {
      return false;
    } else if (player.isJammer()) {
      return true;
    } else if (!this.activePack) {
      return false;
    }

    const pack = this.activePack;
    const playerIndex = this.players.findIndex(candidate => candidate.id === player.id);
    const totalDistance = track.packLine.distance;
    const playerPosition = this.positions[playerIndex];
    const position = Overflow.of(playerPosition, totalDistance);
    return pack.backEngagementZone.isBehind(position) && pack.frontEngagementZone.isInFrontOf(position);
  }

  public get warning(): PackWarningType {
    if (this.isSplit) {
      return PackWarningType.SPLIT_PACK;
    } else if (!this.activePack) {
      return PackWarningType.NO_PACK;
    } else if (this.isFront) {
      return PackWarningType.PACK_IS_FRONT;
    } else if (this.isBack) {
      return PackWarningType.PACK_IS_BACK;
    } else if (this.isAll) {
      return PackWarningType.PACK_IS_ALL;
    } else {
      return PackWarningType.PACK_IS_HERE;
    }
  }

  //
  // Utility methods
  //

  private static calculatePositions(players: Player[], packLine: TrackLine): number[] {
    const count = players.length;
    const positions: number[] = new Array(count);
    for (let i = 0; i < count; i++) {
      positions[i] = packLine.getDistanceAlong(players[i].position);
    }
    return positions;
  }

  private static calculateDistances(players: Player[], positions: number[], totalDistance: number): number[][] {
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

  private static calculatePacks(players: Player[], positions: number[], distances: number[][], track: Track): PackCandidate[] {
    const totalDistance = track.packLine.distance;
    const count = players.length;

    // Exclude players that are not applicable for pack
    const applicablePlayers: boolean[] = [];
    for (let i = 0; i < count; i++) {
      const player = players[i];
      const isInBounds = player.isInBounds(track);
      const isJammer = player.isJammer();
      applicablePlayers[i] = isInBounds && !isJammer;
    }

    // Calculate which players within ten feet of each other
    const playersWithinTenFeet: boolean[][] = new Array(count);
    for (let i = 0; i < count; i++) {
      const row: boolean[] = new Array(count);
      for (let j = 0; j < count; j++) {
        if (!applicablePlayers[i] || !applicablePlayers[j]) {
          continue;
        }

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
    const packs: PackCandidate[] = [];
    for (let i = 0; i < count; i++) {
      if (!visited[i] && applicablePlayers[i]) {
        const packPlayers: PackPlayer[] = [];
        const stack = [i];
        visited[i] = true;

        while (stack.length > 0) {
          const currentPlayer = stack.pop() as number;
          const position = Overflow.of(positions[currentPlayer], totalDistance);
          packPlayers.push(PackPlayer.of(players[currentPlayer], currentPlayer, position));

          for (let j = 0; j < count; j++) {
            if (!visited[j] && playersWithinTenFeet[currentPlayer][j]) {
              stack.push(j);
              visited[j] = true;
            }
          }
        }

        packs.push(PackCandidate.of(packPlayers, totalDistance));
      }
    }

    return packs;
  }

  private static calculateActivePack(packs: PackCandidate[]): Pair<number, Pair<number, number>> {
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

  private static getRearMostPackPlayerIndex(pack: PackCandidate, players: Player[], track: Track): number {
    let backIndex = 0;
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const backCandidate = players[backIndex];
      if (pack.playerIndices.includes(i) && i !== backIndex && player.isBehind(backCandidate, track)) {
        backIndex = i;
      }
    }
    return backIndex;
  }

  private static getForeMostPackPlayerIndex(pack: PackCandidate, players: Player[], track: Track): number {
    let frontIndex = 0;
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const frontCandidate = players[frontIndex];
      if (pack.playerIndices.includes(i) && i !== frontIndex && player.isInFrontOf(frontCandidate, track)) {
        frontIndex = i;
      }
    }
    return frontIndex;
  }

  private static getPlayerIndicesBehindPack(pack: PackCandidate | undefined, players: Player[], track: Track): number[] {
    if (pack === undefined) {
      return [];
    }

    const relativeBack = pack.relativeBack;
    const result: number[] = [];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.isJammer() || !player.isInBounds(track) || pack.playerIndices.includes(i)) {
        continue;
      }
      const playerPosition = player.relativePosition(track);
      if (Overflow.of(playerPosition.y).isBehind(relativeBack)) {
        result.push(i);
      }
    }
    return result;
  }

  private static getPlayerIndicesInFrontOfPack(pack: PackCandidate | undefined, players: Player[], track: Track): number[] {
    if (pack === undefined) {
      return [];
    }

    const relativeFront = pack.relativeFront;
    const result: number[] = [];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.isJammer() || !player.isInBounds(track) || pack.playerIndices.includes(i)) {
        continue;
      }
      const playerPosition = player.relativePosition(track);
      if (Overflow.of(playerPosition.y).isInFrontOf(relativeFront)) {
        result.push(i);
      }
    }
    return result;
  }
}
