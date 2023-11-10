import {Component, EventEmitter, HostListener, Output} from "@angular/core";
import {PackWarningType} from "../model/pack-warning-type";
import {ScoreType} from "../model/score-type";

@Component({
  selector: 'app-button-bar',
  templateUrl: './button-bar.component.html',
  styleUrls: ['./button-bar.component.scss']
})
export class ButtonBarComponent {

  @Output()
  packWarning: EventEmitter<PackWarningType> = new EventEmitter<PackWarningType>();

  @Output()
  toggleGame: EventEmitter<void> = new EventEmitter<void>();

  protected readonly PackWarning = PackWarningType;
  protected readonly ScoreType = ScoreType;

  private scoreTypes: ScoreType[] = [];
  private clickedButtons: PackWarningType[] = [];

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.toggleGame.emit()
    } else if (event.key === 'd' || event.key === 'D') {
      this.onClick(PackWarningType.NO_PACK);
    } else if (event.key === 'f' || event.key === 'F') {
      this.onClick(PackWarningType.SPLIT_PACK);
    } else if (event.key === 'g' || event.key === 'G') {
      this.onClick(PackWarningType.PACK_IS_HERE);
    } else if (event.key === 'h' || event.key === 'H') {
      this.onClick(PackWarningType.PACK_IS_ALL);
    } else if (event.key === 'j' || event.key === 'J') {
      this.onClick(PackWarningType.PACK_IS_BACK);
    } else if (event.key === 'k' || event.key === 'K') {
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

  hasScored(scoreType: ScoreType): boolean {
    return this.scoreTypes.includes(scoreType);
  }

  private resetClicked(packWarning: PackWarningType): void {
    this.clickedButtons = this.clickedButtons.filter(b => b !== packWarning)
  }

  onScored(scoreType: ScoreType): void {
    this.scoreTypes.push(scoreType);
    setTimeout(() => this.resetScored(scoreType), 1000);
  }

  private resetScored(scoreType: ScoreType): void {
    this.scoreTypes = this.scoreTypes.filter(s => s !== scoreType);
  }
}