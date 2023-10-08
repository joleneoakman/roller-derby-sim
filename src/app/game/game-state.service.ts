import {GameState} from "../state/game.state";
import {Track} from "../model/track";
import {PlayerState} from "../state/player.state";
import {Team} from "../model/team";
import {PlayerType} from "../model/player-type";
import {Position} from "../model/position";
import {Velocity} from "../model/velocity";
import {BehaviorSubject, Subject} from "rxjs";
import {Injectable} from "@angular/core";
import {Pair} from "../model/pair";
import {GameConstants} from "./game-constants";
import {Speed} from "../model/speed";
import {Angle} from "../model/angle";


@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  private state: GameState = GameStateService.initialState();
  private state$: Subject<GameState> = new BehaviorSubject(this.state);

  constructor() {
    setInterval(() => {
      this.state$.next(this.state);
    }, 1000);
  }

  public observe(): Subject<GameState> {
    return this.state$;
  }

  public update(reducer: (state: GameState) => GameState): GameState {
    this.state = reducer(this.state);
    return this.state;
  }

  private static initialState(): GameState {
    const track = Track.create();
    const players = GameStateService.initialDerbyTeams();
    return GameState.of(track, players);
  }

  private static initialDerbyTeams(): PlayerState[] {
    const width = GameConstants.CANVAS_WIDTH_IN_METERS;
    return [
      PlayerState.of(Team.A, PlayerType.JAMMER, Position.of(1, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.A, PlayerType.PIVOT, Position.of(2, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.A, PlayerType.BLOCKER, Position.of(3, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.A, PlayerType.BLOCKER, Position.of(4, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.A, PlayerType.BLOCKER, Position.of(5, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.B, PlayerType.JAMMER, Position.of(width - 1, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.B, PlayerType.PIVOT, Position.of(width - 2, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.B, PlayerType.BLOCKER, Position.of(width - 3, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.B, PlayerType.BLOCKER, Position.of(width - 4, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      PlayerState.of(Team.B, PlayerType.BLOCKER, Position.of(width - 5, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
    ];
  }

  private static initialPlayers(count: number): PlayerState[] {
    const positionsAndAngles = this.generatePointsOnCircle(Position.of(35, 6), 3, 6);
    const result: PlayerState[] = [];
    for (let i = 0; i < count; i++) {
      const position = positionsAndAngles.a[i];
      const angle = positionsAndAngles.b[i];
      result.push(PlayerState.of(Team.A, PlayerType.JAMMER, position, Velocity.of(Speed.ZERO, angle), Velocity.of(Speed.ofKph(1), angle), 100));
    }
    return result;
  }

  private static generatePointsOnCircle(center: Position, radius: number, numPoints: number): Pair<Position[], Angle[]> {
    const points: Position[] = [];
    const angles: Angle[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push(Position.of(x, y));
      angles.push(Angle.ofDegrees(180 - i * 360 / numPoints));
    }

    return Pair.of(points, angles);
  }
}
