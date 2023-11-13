import {PackWarning} from "./pack-warning";
import {PackGameScore} from "./pack-game-score";
import {GameConstants} from "../game/game-constants";

export class PackGame {

  readonly userWarnings: PackWarning[];
  readonly lastGameWarning?: PackWarning;
  readonly newGameWarnings: PackWarning[];
  readonly score: PackGameScore;

  constructor(userWarnings: PackWarning[], lastGameWarning: PackWarning | undefined, newGameWarnings: PackWarning[], score: PackGameScore) {
    this.score = score;
    this.userWarnings = userWarnings;
    this.lastGameWarning = lastGameWarning;
    this.newGameWarnings = newGameWarnings;
    this.score = score;
  }

  //
  // Create
  //

  public static empty(): PackGame {
    return new PackGame([], undefined, [], PackGameScore.empty());
  }

  //
  // Setters
  //

  public withNewUserWarning(warning: PackWarning): PackGame {
    return this.cleanUpGameWarnings().doWithNewUserWarning(warning);
  }

  public withNewGameWarning(warning: PackWarning): PackGame {
    return this.cleanUpGameWarnings().doWithNewGameWarning(warning);
  }

  private doWithNewUserWarning(warning: PackWarning) {
    const userWarnings = [...this.userWarnings, warning];
    const score = this.score.recalculate(this.newGameWarnings, warning);
    const warningIndex = this.newGameWarnings.findIndex(w => w.type === warning.type);
    const newGameWarnings = warningIndex === this.newGameWarnings.length - 1 ? [] : this.newGameWarnings.slice().splice(warningIndex);
    return new PackGame(userWarnings, this.lastGameWarning, newGameWarnings, score);
  }

  private doWithNewGameWarning(warning: PackWarning) {
    if (this.lastGameWarning !== undefined && this.lastGameWarning.type === warning.type) {
      return this;
    }

    let newGameWarnings: PackWarning[] = [...this.newGameWarnings];
    const index = this.newGameWarnings.findIndex(w => w.type === warning.type);
    if (index !== -1) {
      newGameWarnings[index] = warning;
    } else {
      newGameWarnings = [...this.newGameWarnings, warning];
    }
    return new PackGame(this.userWarnings, warning, newGameWarnings, this.score);
  }

  private cleanUpGameWarnings(): PackGame {
    const time = Date.now();
    const newGameWarnings = this.newGameWarnings.filter(w => time - w.time <= GameConstants.OK_WARNING_TIME_MS);
    return new PackGame(this.userWarnings, this.lastGameWarning, newGameWarnings, this.score);
  }
}