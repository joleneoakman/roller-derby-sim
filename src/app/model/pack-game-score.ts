import {GameConstants} from "../game/game-constants";
import {PackWarning} from "./pack-warning";

export class PackGameScore {
  readonly perfects: number;
  readonly goods: number;
  readonly oks: number;
  readonly mistakes: number;

  constructor(perfects: number, goods: number, oks: number, mistakes: number) {
    this.perfects = perfects;
    this.goods = goods;
    this.oks = oks;
    this.mistakes = mistakes;
  }

  //
  // Create
  //

  public static empty(): PackGameScore {
    return new PackGameScore(0, 0, 0, 0);
  }

  //
  // Getters
  //

  public get score(): number {
    const score = this.perfects * GameConstants.PERFECT_SCORE
      + this.goods * GameConstants.GOOD_SCORE
      + this.oks * GameConstants.OK_SCORE
      + this.mistakes * GameConstants.MISTAKE_SCORE;
    return Math.max(0, score);
  }

  //
  // Setters
  //

  public recalculate(gameWarnings: PackWarning[], userWarning: PackWarning): PackGameScore {
    let perfectsDelta = 0;
    let goodsDelta = 0;
    let oksDelta = 0;
    let mistakesDelta = 0;

    const gameWarning = gameWarnings.find(w => w.type === userWarning.type);
    if (gameWarning === undefined) {
      mistakesDelta += 1;
    } else {
      const diffMs = userWarning.time - gameWarning.time;
      if (diffMs > 0) {
        if (diffMs <= GameConstants.PERFECT_WARNING_TIME_MS) {
          perfectsDelta += 1;
        } else if (diffMs <= GameConstants.GOOD_WARNING_TIME_MS) {
          goodsDelta += 1;
        } else if (diffMs <= GameConstants.OK_WARNING_TIME_MS) {
          oksDelta += 1;
        }
      }
    }

    return this.withDeltas(perfectsDelta, goodsDelta, oksDelta, mistakesDelta);
  }

  private withDeltas(perfectsDelta: number, goodsDelta: number, oksDelta: number, mistakesDelta: number): PackGameScore {
    return new PackGameScore(
      this.perfects + perfectsDelta,
      this.goods + goodsDelta,
      this.oks + oksDelta,
      this.mistakes + mistakesDelta
    );
  }
}