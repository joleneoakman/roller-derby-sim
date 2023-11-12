import {Component, EventEmitter, HostListener, Input, Output} from "@angular/core";
import {PackWarningType} from "../model/pack-warning-type";
import {ScoreType} from "../model/score-type";

@Component({
  selector: 'app-button-bar',
  templateUrl: './button-bar.component.html',
  styleUrls: ['./button-bar.component.scss']
})
export class ButtonBarComponent {

  @Input()
  enabled: boolean = false;

  @Output()
  packWarning: EventEmitter<PackWarningType> = new EventEmitter<PackWarningType>();

  @Output()
  toggleGame: EventEmitter<void> = new EventEmitter<void>();

  protected readonly PackWarning = PackWarningType;
  protected readonly ScoreType = ScoreType;

  scoreTypes: ScoreType[] = [];
  scoreTimes: number[] = [];
  private clickedButtons: PackWarningType[] = [];

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.toggleGame.emit();
      return;
    }

    if (!this.enabled) {
      return;
    }

    if (event.key === 'n' || event.key === 'N') {
      this.onClick(PackWarningType.NO_PACK);
    } else if (event.key === 's' || event.key === 'S') {
      this.onClick(PackWarningType.SPLIT_PACK);
    } else if (event.key === 'h' || event.key === 'H') {
      this.onClick(PackWarningType.PACK_IS_HERE);
    } else if (event.key === 'a' || event.key === 'A') {
      this.onClick(PackWarningType.PACK_IS_ALL);
    } else if (event.key === 'b' || event.key === 'B') {
      this.onClick(PackWarningType.PACK_IS_BACK);
    } else if (event.key === 'f' || event.key === 'F') {
      this.onClick(PackWarningType.PACK_IS_FRONT);
    }
  }

  isClicked(packWarning: PackWarningType): boolean {
    return this.clickedButtons.includes(packWarning);
  }

  onClick(packWarning: PackWarningType): void {
    this.clickedButtons.push(packWarning);
    this.packWarning.emit(packWarning);
    setTimeout(() => this.resetClicked(packWarning), 200);
  }

  onScored(scoreType: ScoreType): void {
    const time = Date.now();
    this.scoreTypes.push(scoreType);
    this.scoreTimes.push(time);
    setTimeout(() => this.resetScored(time), 1000);
  }

  toName(scoreType: ScoreType): string {
    switch (scoreType) {
      case ScoreType.PERFECT:
        return 'Perfect';
      case ScoreType.GOOD:
        return 'Good';
      case ScoreType.OK:
        return 'Ok';
      case ScoreType.MISTAKE:
        return 'Oops';
    }
  }

  private resetClicked(packWarning: PackWarningType): void {
    this.clickedButtons = this.clickedButtons.filter(b => b !== packWarning)
  }

  private resetScored(time: number): void {
    const index = this.scoreTimes.findIndex(t => t !== time);
    if (index === this.scoreTimes.length - 1) {
      this.scoreTimes = [];
      this.scoreTimes = [];
    }
  }
}