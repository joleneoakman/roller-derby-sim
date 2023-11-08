import {AfterViewInit, Component, EventEmitter, HostListener, Output} from "@angular/core";
import {PackWarning} from "../model/pack-warning";
import {Pack} from "../model/pack";

@Component({
  selector: 'app-button-bar',
  templateUrl: './button-bar.component.html',
  styleUrls: ['./button-bar.component.scss']
})
export class ButtonBarComponent {

  @Output()
  packWarning: EventEmitter<PackWarning> = new EventEmitter<PackWarning>();

  @Output()
  toggleGame: EventEmitter<void> = new EventEmitter<void>();

  protected readonly PackWarning = PackWarning;

  private clickedButtons: PackWarning[] = [];

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.toggleGame.emit()
    } else if (event.key === 'd' || event.key === 'D') {
      this.onClick(PackWarning.NO_PACK);
    } else if (event.key === 'f' || event.key === 'F') {
      this.onClick(PackWarning.SPLIT_PACK);
    } else if (event.key === 'g' || event.key === 'G') {
      this.onClick(PackWarning.PACK_IS_HERE);
    } else if (event.key === 'h' || event.key === 'H') {
      this.onClick(PackWarning.PACK_IS_ALL);
    } else if (event.key === 'j' || event.key === 'J') {
      this.onClick(PackWarning.PACK_IS_BACK);
    } else if (event.key === 'k' || event.key === 'K') {
      this.onClick(PackWarning.PACK_IS_FRONT);
    }
  }

  isClicked(packWarning: PackWarning): boolean {
    return this.clickedButtons.includes(packWarning);
  }

  onClick(packWarning: PackWarning): void {
    this.clickedButtons.push(packWarning);
    this.packWarning.emit(packWarning);
    setTimeout(() => this.resetClicked(packWarning), 200);
  }

  private resetClicked(packWarning: PackWarning): void {
    this.clickedButtons = this.clickedButtons.filter(b => b !== packWarning)
  }
}