import {PackWarning} from "./pack-warning";
import {PackGameScore} from "./pack-game-score";

export class PackGame {

  readonly userWarnings: PackWarning[];
  readonly lastGameWarning?: PackWarning;
  readonly newGameWarning?: PackWarning;
  readonly score: PackGameScore;

  constructor(userWarnings: PackWarning[], lastGameWarning: PackWarning | undefined, currentGameWarning: PackWarning | undefined, score: PackGameScore) {
    this.score = score;
    this.userWarnings = userWarnings;
    this.lastGameWarning = lastGameWarning;
    this.newGameWarning = currentGameWarning;
    this.score = score;
  }

  //
  // Create
  //

  public static empty(): PackGame {
    return new PackGame([], undefined, undefined, PackGameScore.empty());
  }

  //
  // Setters
  //

  public withNewUserWarning(warning: PackWarning): PackGame {
    const userWarnings = [...this.userWarnings, warning];
    const score = this.score.recalculate(this.newGameWarning, warning);
    return new PackGame(userWarnings, this.lastGameWarning, undefined, score);
  }

  public withNewGameWarning(warning: PackWarning): PackGame {
    if (this.lastGameWarning !== undefined && this.lastGameWarning.type === warning.type) {
      return this;
    }
    return new PackGame(this.userWarnings, warning, warning, this.score);
  }
}