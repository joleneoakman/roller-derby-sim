import {Team} from "./team";
import {GameConstants} from "../game/game-constants";
import {PackPlayer} from "./pack-player";
import {Overflow} from "./overflow";

/**
 * Represents a pack of players, defined by start and end positions (according to pack line).
 */
export class PackCandidate {
  readonly back: Overflow;
  readonly front: Overflow;
  readonly relativeBack: Overflow;
  readonly relativeFront: Overflow;
  readonly backEngagementZone: Overflow;
  readonly frontEngagementZone: Overflow;
  readonly relativeBackEngagementZone: Overflow;
  readonly relativeFrontEngagementZone: Overflow;
  readonly playerIndices: number[];
  readonly hasBothTeams: boolean;

  constructor(back: Overflow,
              front: Overflow,
              relativeBack: Overflow,
              relativeFront: Overflow,
              backEngagementZone: Overflow,
              frontEngagementZone: Overflow,
              relativeBackEngagementZone: Overflow,
              relativeFrontEngagementZone: Overflow,
              players: number[],
              hasBothTeams: boolean) {
    this.back = back;
    this.front = front;
    this.relativeBack = relativeBack;
    this.relativeFront = relativeFront;
    this.backEngagementZone = backEngagementZone;
    this.frontEngagementZone = frontEngagementZone;
    this.relativeBackEngagementZone = relativeBackEngagementZone;
    this.relativeFrontEngagementZone = relativeFrontEngagementZone;
    this.playerIndices = players;
    this.hasBothTeams = hasBothTeams;
  }

  public static of(players: PackPlayer[], totalDistance: number): PackCandidate {
    const sortedPlayers = PackCandidate.sortPlayersFrontToBack(players);
    const back = sortedPlayers[0].position;
    const front = sortedPlayers[sortedPlayers.length - 1].position;
    const relativeBack = Overflow.of(back.value / totalDistance, 1);
    const relativeFront = Overflow.of(front.value / totalDistance, 1);
    const backEngagementZone = Overflow.of(back.value - GameConstants.TWENTY_FEET, totalDistance);
    const frontEngagementZone = Overflow.of(front.value + GameConstants.TWENTY_FEET, totalDistance);
    const relativeBackEngagementZone = Overflow.of(back.value / totalDistance, 1);
    const relativeFrontEngagementZone = Overflow.of(front.value / totalDistance, 1);
    const sortedPlayerIndices = sortedPlayers.map(p => p.playerIndex);
    const hasBothTeams = PackCandidate.hasBothTeams(players);
    return new PackCandidate(back, front, relativeBack, relativeFront, backEngagementZone, frontEngagementZone, relativeBackEngagementZone, relativeFrontEngagementZone, sortedPlayerIndices, hasBothTeams);
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

  private static sortPlayersFrontToBack(players: PackPlayer[]): PackPlayer[] {
    return players.slice().sort((a: PackPlayer, b: PackPlayer) => a.position.compareInFrontOf(b.position));
  }

  private static hasBothTeams(players: PackPlayer[]): boolean {
    let hasA = false;
    let hasB = false;
    for (const player of players) {
      if (player.player.team === Team.A) {
        hasA = true;
      } else if (player.player.team === Team.B) {
        hasB = true;
      }
    }
    return hasA && hasB;
  }
}
