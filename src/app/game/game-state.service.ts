import {GameState} from "../model/game-state";
import {Track} from "../model/track";
import {Player} from "../model/player";
import {Team} from "../model/team";
import {PlayerType} from "../model/player-type";
import {Vector} from "../model/geometry/vector";
import {Velocity} from "../model/geometry/velocity";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {Injectable} from "@angular/core";
import {Pair} from "../model/pair";
import {Speed} from "../model/geometry/speed";
import {Angle} from "../model/geometry/angle";
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
    // const players = GameStateService.onePlayer(track);
    const players = GameStateService.initialDerbyTeams(track);
    return GameState.of(track, players);
  }

  private static onePlayer(track: Track): Player[] {
    const velocity = Velocity.of(Speed.ZERO, Angle.ZERO);
    const player = Player.of(Team.A, "1", "Ariel", PlayerType.JAMMER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.5, 0)), velocity));
    return [
      player
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.1))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.2))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.3))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.4))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.5))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.6))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.7))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.8))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.9))))
        .addTarget(Target.of(track.getAbsolutePosition(Vector.of(0.5, 1)))),
    ]
  }

  private static initialDerbyTeams(track: Track): Player[] {
    const velocity = Velocity.of(Speed.ZERO, Angle.ZERO);
    return [
      Player.of(Team.A, "1", "Ariel", PlayerType.JAMMER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.3, 0.98)), velocity)),
      Player.of(Team.A, "2", "Mulan", PlayerType.PIVOT, 100, Target.of(track.getAbsolutePosition(Vector.of(0.2, 0.14)), velocity)),
      Player.of(Team.A, "3", "Jasmine", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.3, 0.04)), velocity)),
      Player.of(Team.A, "4", "Belle", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.6, 0.02)), velocity)),
      Player.of(Team.A, "5", "Merida", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.06)), velocity)),
      Player.of(Team.B, "1", "Elsa", PlayerType.JAMMER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.6, 0.98)), velocity)),
      Player.of(Team.B, "2", "Moana", PlayerType.PIVOT, 100, Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.11)), velocity)),
      Player.of(Team.B, "3", "Alice", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.2, 0.05)), velocity)),
      Player.of(Team.B, "4", "Esmeralda", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.5, 0.04)), velocity)),
      Player.of(Team.B, "5", "Megara", PlayerType.BLOCKER, 100, Target.of(track.getAbsolutePosition(Vector.of(0.7, 0.04)), velocity)),
    ];
  }

  private static initialSomePlayerAtPackLine(track: Track): Player[] {
    const angle = Angle.ZERO;
    const speed = Speed.ofKph(5);
    const offset = 0.9;
    const positions = [offset, 0.05 + offset, 0.10 + offset, 0.15 + offset];
    return positions.map((p, i) => {
      const team = i % 2 === 0 ? Team.A : Team.B;
      const number = '' + (i + 1);
      return Player.of(team, number, "Player " + number, PlayerType.BLOCKER, 100, Target.of(track.packLine.getAbsolutePositionOf(p), Velocity.of(speed, angle)));
    })
  }


  private static initialPlayersAtPackLine(track: Track): Player[] {
    const result: Player[] = [];
    const playerCount = 10;
    for (let i = 0; i < playerCount; i++) {
      const position = track.packLine.getAbsolutePositionOf(i / playerCount);
      const angle = Angle.ZERO;
      const number = '' + (i + 1);
      result.push(Player.of(Team.A, number, "Player " + number, PlayerType.JAMMER, 100, Target.of(position, Velocity.of(Speed.ZERO, angle))));
    }
    return result;
  }

  private static initialPlayers(count: number): Player[] {
    const positionsAndAngles = this.generatePointsOnCircle(Vector.of(35, 6), 3, 6);
    const result: Player[] = [];
    for (let i = 0; i < count; i++) {
      const position = positionsAndAngles.a[i];
      const angle = positionsAndAngles.b[i];
      const number = '' + (i + 1);
      result.push(Player.of(Team.A, number, "Player " + number, PlayerType.JAMMER, 100, Target.of(position, Velocity.of(Speed.ofKph(1), angle))));
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
