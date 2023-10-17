import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Renderer} from "./renderer/renderer";
import {Observable} from "rxjs";
import {GameState} from "./model/game-state";
import {Vector} from "./model/vector";
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

  private renderer?: Renderer;

  constructor(private gameStateService: GameStateService) {
    this.state$ = gameStateService.observeState();
  }

  ngAfterViewInit() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
    });

    const canvas = this.canvas?.nativeElement;
    const ctx = canvas.getContext('2d');
    this.renderer = new Renderer(this.gameStateService, ctx, canvas.width, canvas.height);
    this.renderer.start();
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
    const clientPos = Vector.of(event.clientX, event.clientY);
    const normalizedPos = this.normalizePoint(clientPos);
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
    this.renderer?.setCanvasSize(canvas.width, canvas.height);
  }

  private normalizePoint(position: Vector): Vector {
    const canvas = this.canvas?.nativeElement;
    const scale = canvas.width / GameConstants.CANVAS_WIDTH_IN_METERS;
    return Vector.of(position.x / scale, position.y / scale);
  }
}
