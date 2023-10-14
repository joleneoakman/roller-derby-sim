import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Renderer} from "./renderer/renderer";
import {Observable} from "rxjs";
import {GameState} from "./model/game-state";
import {Position} from "./model/position";
import {GameConstants} from "./game/game-constants";
import {GameStateService} from "./game/game-state.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas', {static: false}) canvas?: ElementRef;

  public state$: Observable<GameState>;

  constructor(private gameStateService: GameStateService) {
    this.state$ = gameStateService.observe();
  }

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
    });
    this.gameLoop();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Delete') {
      this.gameStateService.update(state => state.clearTargets());
    } else if (event.key === 'Escape') {
      this.gameStateService.update(state => state.deselect());
    }
  }

  public onClick(event: MouseEvent) {
    const clientPos = Position.of(event.clientX, event.clientY);
    const normalizedPos = this.normalizePoint(clientPos);
    console.warn(event);
    if (event.button === 0) {
      this.gameStateService.update(state => state.select(normalizedPos));
    } else if (event.button === 2) {
      this.gameStateService.update(state => state.withSelectedTargetPosition(normalizedPos));
    }
  }

  private resize() {
    const canvas = this.canvas?.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private gameLoop(): void {
    const canvas = this.canvas?.nativeElement;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / GameConstants.CANVAS_WIDTH_IN_METERS;
    const renderer = new Renderer(ctx, scale, canvas.width, canvas.height);
    this.renderScene(renderer);
    requestAnimationFrame(() => this.gameLoop());
  }

  private renderScene(renderer: Renderer) {
    const state = this.gameStateService.update(state => state.recalculate());
    renderer.drawScene(state);
  }

  private normalizePoint(position: Position): Position {
    const canvas = this.canvas?.nativeElement;
    const scale = canvas.width / GameConstants.CANVAS_WIDTH_IN_METERS;
    return Position.of(position.x / scale, position.y / scale);
  }
}
