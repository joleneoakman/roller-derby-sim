import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Renderer} from "./renderer/renderer";
import {distinctUntilChanged, map, Observable} from "rxjs";
import {GameState} from "./model/game-state";
import {Vector} from "./model/geometry/vector";
import {GameStateService} from "./game/game-state.service";
import {Info} from "./model/info";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas', {static: false}) canvas?: ElementRef;

  public state$: Observable<GameState>;
  public info$?: Observable<Info[]>;

  private renderer?: Renderer;
  private clickPoint?: Vector;
  private offset?: Vector;

  constructor(private gameStateService: GameStateService) {
    this.state$ = gameStateService.observeState();
    this.info$ = this.state$
      .pipe(
        map(state => state.toInfo()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      );
  }

  ngAfterViewInit() {
    this.onResize();
    window.addEventListener('resize', () => {
      this.onResize();
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

  public onMouseDown(event: MouseEvent) {
    const clientPosition = Vector.of(event.clientX, event.clientY);
    const gamePosition = this.getRenderer().toGamePosition(clientPosition);
    if (event.button === 0) {
      this.gameStateService.update(state => state.select(gamePosition));
    } else if (event.button === 1) {
      this.clickPoint = clientPosition;
      this.offset = this.getRenderer().getOffset();
    } else if (event.button === 2) {
      this.gameStateService.update(state => state.withSelectedTargetPosition(gamePosition));
    }
  }

  public onMouseUp(event: MouseEvent) {
    this.clickPoint = undefined;
    this.offset = undefined;
  }

  public onMouseMove(event: MouseEvent) {
    if (this.clickPoint === undefined || this.offset === undefined) {
      return;
    }

    const clientPos = Vector.of(event.clientX, event.clientY);
    const diff = clientPos.minus(this.clickPoint);
    console.log(this.clickPoint, clientPos, diff)
    const delta = this.offset.plus(diff);
    this.getRenderer().updateOffset(delta);
  }

  public onWheel(event: WheelEvent) {
    this.getRenderer().updateZoom(event.deltaY / 100);
  }

  private onResize() {
    const canvas = this.canvas?.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.renderer?.setCanvasSize(canvas.width, canvas.height);
  }

  private getRenderer(): Renderer {
    if (this.renderer === undefined) {
      throw new Error('Renderer not initialized');
    }
    return this.renderer;
  }
}
