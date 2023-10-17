import {Team} from "./team";
import {PlayerType} from "./player-type";

export class PlayerId {
  readonly team: Team;
  readonly number: string;
  readonly name: string;
  readonly type: PlayerType;

  constructor(team: Team, number: string, name: string, type: PlayerType) {
    this.team = team;
    this.number = number;
    this.name = name;
    this.type = type;
  }

  public static of(team: Team, number: string, name: string, type: PlayerType): PlayerId {
    return new PlayerId(team, number, name, type);
  }
}