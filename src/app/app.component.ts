import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Renderer} from "./renderer/renderer";
import {BehaviorSubject, distinctUntilChanged, map, Observable} from "rxjs";
import {GameState} from "./model/game-state";
import {Vector} from "./model/geometry/vector";
import {GameStateService} from "./game/game-state.service";
import {GameInfo} from "./model/game-info";
import {PackWarningType} from "./model/pack-warning-type";
import {PackGameScore} from "./model/pack-game-score";
import {ScoreType} from "./model/score-type";
import {ButtonBarComponent} from "./button-bar/button-bar.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas', {static: false}) canvas?: ElementRef;
  @ViewChild(ButtonBarComponent, {static: false}) buttonBar?: ButtonBarComponent;

  public state$: Observable<GameState>;
  public info$?: Observable<GameInfo>;
  public score$: BehaviorSubject<PackGameScore> = new BehaviorSubject(PackGameScore.empty());
  public buttonsEnabled$: Observable<boolean>;

  private renderer?: Renderer;
  private clickPoint?: Vector;
  private offset?: Vector;
  private button?: number;

  constructor(private gameStateService: GameStateService) {
    this.state$ = gameStateService.observeState();
    this.info$ = this.state$
      .pipe(
        map(state => state.toInfo()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      );
    this.state$
      .pipe(map(state => state.packGame.score))
      .subscribe(score => this.updateScore(score));
    this.buttonsEnabled$ = this.state$.pipe(map(state => state.packGame.newGameWarnings.length > 0));
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
    } else if (event.key === '1' || event.key === '&') {
      this.gameStateService.update(state => state.withSelection(0));
    } else if (event.key === '2' || event.key === 'é') {
      this.gameStateService.update(state => state.withSelection(1));
    } else if (event.key === '3' || event.key === '"') {
      this.gameStateService.update(state => state.withSelection(2));
    } else if (event.key === '4' || event.key === '\'') {
      this.gameStateService.update(state => state.withSelection(3));
    } else if (event.key === '5' || event.key === '(') {
      this.gameStateService.update(state => state.withSelection(4));
    } else if (event.key === '6' || event.key === '§') {
      this.gameStateService.update(state => state.withSelection(5));
    } else if (event.key === '7' || event.key === 'è') {
      this.gameStateService.update(state => state.withSelection(6));
    } else if (event.key === '8' || event.key === '!') {
      this.gameStateService.update(state => state.withSelection(7));
    } else if (event.key === '9' || event.key === 'ç') {
      this.gameStateService.update(state => state.withSelection(8));
    } else if (event.key === '0' || event.key === 'à') {
      this.gameStateService.update(state => state.withSelection(9));
    }
  }

  public onMouseDown(event: MouseEvent) {
    const clientPosition = Vector.of(event.clientX, event.clientY);
    const gamePosition = this.getRenderer().toGamePosition(clientPosition);
    if (event.button === 0) {
      this.gameStateService.update(state => state.select(gamePosition));
    } else if (event.button === 1 || event.button === 2) {
      this.clickPoint = clientPosition;
      this.offset = this.getRenderer().getOffset();
      this.button = event.button;
    }
  }

  public onMouseUp(event: MouseEvent) {

    if (event.button === 2 && this.clickPoint !== undefined) {
      const clientPosition = Vector.of(event.clientX, event.clientY);
      const gamePosition = this.getRenderer().toGamePosition(this.clickPoint);
      const stop = this.clickPoint?.distanceTo(clientPosition) < 5;
      this.gameStateService.update(state => state.withSelectedTargetPosition(gamePosition, stop));
    }

    this.clickPoint = undefined;
    this.offset = undefined;
    this.button = undefined;
  }

  public onMouseMove(event: MouseEvent) {
    if (this.clickPoint === undefined || this.offset === undefined || this.button !== 1) {
      return;
    }

    const clientPos = Vector.of(event.clientX, event.clientY);
    const diff = clientPos.minus(this.clickPoint);
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

  private updateScore(newScore: PackGameScore): void {
    const oldScore = this.score$.getValue();

    if (oldScore.perfects < newScore.perfects) {
      this.buttonBar?.onScored(ScoreType.PERFECT);
    }
    if (oldScore.goods < newScore.goods) {
      this.buttonBar?.onScored(ScoreType.GOOD);
    }
    if (oldScore.oks < newScore.oks) {
      this.buttonBar?.onScored(ScoreType.OK);
    }
    if (oldScore.mistakes < newScore.mistakes) {
      this.buttonBar?.onScored(ScoreType.MISTAKE);
    }
    this.score$.next(newScore);
  }

  toValueLines(value: string): string[] {
    return value.split('\n');
  }

  onPackWarning(packWarning: PackWarningType): void {
    this.gameStateService.update(state => state.givePackWarning(packWarning));
  }

  onToggleGame(): void {
    this.gameStateService.update(state => state.toggleGame());
  }
}
