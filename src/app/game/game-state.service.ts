import {GameState} from "../model/game-state";
import {Track} from "../model/track";
import {Player} from "../model/player";
import {Team} from "../model/team";
import {PlayerType} from "../model/player-type";
import {Vector} from "../model/vector";
import {Velocity} from "../model/velocity";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {Injectable} from "@angular/core";
import {Pair} from "../model/pair";
import {GameConstants} from "./game-constants";
import {Speed} from "../model/speed";
import {Angle} from "../model/angle";
import {Testing} from "../test/testing";
import {Target} from "../model/target";


@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  private state: GameState = GameStateService.initialState();
  private state$: Subject<GameState> = new BehaviorSubject(this.state);

  constructor() {
    Testing.runAll();
    setInterval(() => {
      this.state$.next(this.state);
      this.state = this.state.withFrameRate(0);
    }, 1000);
  }

  public observeState(): Observable<GameState> {
    return this.state$.asObservable();
  }

  public update(reducer: (state: GameState) => GameState): GameState {
    this.state = reducer(this.state);
    return this.state;
  }

  private static initialState(): GameState {
    const track = Track.create();
    // const players = GameStateService.initialSomePlayerAtPackLine(track);
    const players = GameStateService.onePlayer(track);
    // const players = GameStateService.initialDerbyTeams();
    return GameState.of(track, players).withSelection(0);
  }

  private static onePlayer(track: Track): Player[] {
    const velocity = Velocity.of(Speed.ZERO, Angle.ofDegrees(180));
    const player = Player.of(Team.A, PlayerType.JAMMER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.4, 0.50)), velocity));
    return [
      player
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.6))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.7)))),
    ]
  }

  private static initialDerbyTeams(): Player[] {
    const width = GameConstants.CANVAS_WIDTH_IN_METERS;
    return [
      Player.of(Team.A, PlayerType.JAMMER, 100, Target.of(Vector.of(1, 1), Velocity.ZERO)),
      Player.of(Team.A, PlayerType.PIVOT, 100, Target.of(Vector.of(2, 1), Velocity.ZERO)),
      Player.of(Team.A, PlayerType.BLOCKER, 100, Target.of(Vector.of(3, 1), Velocity.ZERO)),
      Player.of(Team.A, PlayerType.BLOCKER, 100, Target.of(Vector.of(4, 1), Velocity.ZERO)),
      Player.of(Team.A, PlayerType.BLOCKER, 100, Target.of(Vector.of(5, 1), Velocity.ZERO)),
      Player.of(Team.B, PlayerType.JAMMER, 100, Target.of(Vector.of(width - 1, 1), Velocity.ZERO)),
      Player.of(Team.B, PlayerType.PIVOT, 100, Target.of(Vector.of(width - 2, 1), Velocity.ZERO)),
      Player.of(Team.B, PlayerType.BLOCKER, 100, Target.of(Vector.of(width - 3, 1), Velocity.ZERO)),
      Player.of(Team.B, PlayerType.BLOCKER, 100, Target.of(Vector.of(width - 4, 1), Velocity.ZERO)),
      Player.of(Team.B, PlayerType.BLOCKER, 100, Target.of(Vector.of(width - 5, 1), Velocity.ZERO)),
    ];
  }

  private static initialSomePlayerAtPackLine(track: Track): Player[] {
    const angle = Angle.ZERO;
    const speed = Speed.ofKph(5);
    const offset = 0.9;
    const positions = [offset, 0.05 + offset, 0.10 + offset, 0.15 + offset];
    return positions.map((p, i) => {
      const team = i % 2 === 0 ? Team.A : Team.B;
      return Player.of(team, PlayerType.BLOCKER, 100, Target.of(track.packLine.getAbsolutePositionOf(p), Velocity.of(speed, angle)));
    })
  }


  private static initialPlayersAtPackLine(track: Track): Player[] {
    const result: Player[] = [];
    const playerCount = 10;
    for (let i = 0; i < playerCount; i++) {
      const position = track.packLine.getAbsolutePositionOf(i / playerCount);
      const angle = Angle.ZERO;
      result.push(Player.of(Team.A, PlayerType.JAMMER, 100, Target.of(position, Velocity.of(Speed.ZERO, angle))));
    }
    return result;
  }

  private static initialPlayers(count: number): Player[] {
    const positionsAndAngles = this.generatePointsOnCircle(Vector.of(35, 6), 3, 6);
    const result: Player[] = [];
    for (let i = 0; i < count; i++) {
      const position = positionsAndAngles.a[i];
      const angle = positionsAndAngles.b[i];
      result.push(Player.of(Team.A, PlayerType.JAMMER, 100, Target.of(position, Velocity.of(Speed.ofKph(1), angle))));
    }
    return result;
  }

  private static generatePointsOnCircle(center: Vector, radius: number, numPoints: number): Pair<Vector[], Angle[]> {
    const points: Vector[] = [];
    const angles: Angle[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push(Vector.of(x, y));
      angles.push(Angle.ofDegrees(180 - i * 360 / numPoints));
    }

    return Pair.of(points, angles);
  }
}
