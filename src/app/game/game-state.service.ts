import {GameState} from "../model/game-state";
import {Track} from "../model/track";
import {Player} from "../model/player";
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
import {TrackLine} from "../model/track-line";


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
    // const players = GameStateService.onePlayer(track);
    const players = GameStateService.initialSomePlayerAtPackLine(track);
    // const players = GameStateService.initialDerbyTeams(track);
    return GameState.of(track, players);
  }

  private static onePlayer(track: Track): Player[] {
    const velocity = Velocity.of(Speed.ZERO, Angle.ZERO);
    return [
      Player.of(track, Team.A, PlayerType.BLOCKER, track.innerBounds.getAbsolutePositionOf(0.1), velocity, velocity, 100),
    ]
  }

  private static initialDerbyTeams(track: Track): Player[] {
    const width = GameConstants.CANVAS_WIDTH_IN_METERS;
    return [
      Player.of(track, Team.A, PlayerType.JAMMER, Position.of(1, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.A, PlayerType.PIVOT, Position.of(2, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.A, PlayerType.BLOCKER, Position.of(3, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.A, PlayerType.BLOCKER, Position.of(4, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.A, PlayerType.BLOCKER, Position.of(5, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.B, PlayerType.JAMMER, Position.of(width - 1, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.B, PlayerType.PIVOT, Position.of(width - 2, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.B, PlayerType.BLOCKER, Position.of(width - 3, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.B, PlayerType.BLOCKER, Position.of(width - 4, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
      Player.of(track, Team.B, PlayerType.BLOCKER, Position.of(width - 5, 1), Velocity.ZERO, Velocity.ofReadable(5, -90),  100),
    ];
  }

  private static initialSomePlayerAtPackLine(track: Track): Player[] {
    const angle = Angle.ZERO;
    const speed = Speed.ofKph(0);
    return [
      Player.of(track, Team.A, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.11), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.A, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.12), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.A, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.50), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.A, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.70), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.B, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.74), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.B, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.78), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.B, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.99), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
      Player.of(track, Team.B, PlayerType.BLOCKER, track.packLine.getAbsolutePositionOf(0.01), Velocity.of(Speed.ZERO, angle), Velocity.of(speed, angle), 100),
    ]
  }


  private static initialPlayersAtPackLine(track: Track): Player[] {
    const result: Player[] = [];
    const playerCount = 10;
    for (let i = 0; i < playerCount; i++) {
      const position = track.packLine.getAbsolutePositionOf(i / playerCount);
      const angle = Angle.ZERO;
      result.push(Player.of(track, Team.A, PlayerType.JAMMER, position, Velocity.of(Speed.ZERO, angle), Velocity.of(Speed.ZERO, angle), 100));
    }
    return result;
  }

  private static initialPlayers(track: Track, count: number): Player[] {
    const positionsAndAngles = this.generatePointsOnCircle(Position.of(35, 6), 3, 6);
    const result: Player[] = [];
    for (let i = 0; i < count; i++) {
      const position = positionsAndAngles.a[i];
      const angle = positionsAndAngles.b[i];
      result.push(Player.of(track, Team.A, PlayerType.JAMMER, position, Velocity.of(Speed.ZERO, angle), Velocity.of(Speed.ofKph(1), angle), 100));
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
