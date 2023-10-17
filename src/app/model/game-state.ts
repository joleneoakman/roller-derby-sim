import {Player} from "./player";
import {Track} from "./track";
import {Vector} from "./vector";
import {PlayerSelection} from "./player-selection";
import {Pack} from "./pack";
import {Target} from "./target";

export class GameState {

  readonly frames: number;
  readonly track: Track;
  readonly players: Player[];
  readonly pack: Pack;
  readonly playerSelection?: PlayerSelection;

  constructor(frames: number, track: Track, players: Player[], pack: Pack, selection?: PlayerSelection) {
    this.frames = frames;
    this.players = players;
    this.track = track;
    this.pack = pack;
    this.playerSelection = selection;
  }

  public static of(track: Track, players: Player[]): GameState {
    return new GameState(0, track, players, Pack.create(players, track), undefined);
  }

  public withFrameRate(frames: number): GameState {
    return new GameState(frames, this.track, this.players, this.pack, this.playerSelection);
  }

  public withPlayers(players: Player[]): GameState {
    const pack = Pack.create(players, this.track);
    return new GameState(this.frames, this.track, players, pack, this.playerSelection);
  }

  public withSelection(index: number): GameState {
    return new GameState(this.frames, this.track, this.players, this.pack, PlayerSelection.of(index));
  }

  public withSelectedTargetPosition(position: Vector): GameState {
    if (this.playerSelection === undefined) {
      return this;
    }
    return this.withSelection(this.playerSelection.index).withPlayers(this.players.map((p, i) => {
      if (i === this.playerSelection?.index) {
        return p.addTarget(Target.of(position));
      } else {
        return p;
      }
    }));
  }

  public clearTargets(): GameState {
    return this.withPlayers(this.players.map((p, i) => {
      if (i === this.playerSelection?.index) {
        return p.clearTargets();
      } else {
        return p;
      }
    }));
  }

  public select(position: Vector): GameState {
     const index = this.findPlayerIndexAt(position);
     return this.withSelection(index);
  }

  public deselect(): GameState {
    return new GameState(this.frames, this.track, this.players, this.pack, undefined);
  }

  public findPlayerIndexAt(position: Vector): number {
    const count = this.players.length;
    for (let i = 0; i < count; i++) {
      const player = this.players[i];
      const distance = player.position.distanceTo(position);
      if (distance <= player.radius) {
        return i;
      }
    }
    return -1;
  }

  public recalculate(): GameState {
    const playersAfterObjectives = GameState.calculateObjectives(this.players, this.track);
    const playersAfterMove = GameState.calculateMovements(playersAfterObjectives);
    const playersAfterCollisions = GameState.calculateCollisions(playersAfterMove);
    return this.withFrameRate(this.frames + 1).withPlayers(playersAfterCollisions);
  }

  private static calculateObjectives(players: Player[], track: Track): Player[] {
    // Todo (temp: let them do laps)
    return GameState.calculateObjectivesForJammers(players, track);
  }

  private static calculateMovements(players: Player[]): Player[] {
    return players.map(player => player.moveTowardsTarget());
  }

  private static calculateCollisions(players: Player[]): Player[] {
    const result: Player[] = [...players];
    const count = players.length;
    for (let i = 0; i < count; i++) {
      const player = result[i];
      for (let j = 0; j < count; j++) {
        const other = result[j];
        if (i !== j && player.collidesWith(other)) {
          const [player1, player2] = player.collideWith(other);
          result[i] = player1;
          result[j] = player2;
        }
      }
    }
    return result;
  }

  //
  // Debug methods
  //

  private static calculateObjectsLapsForAll(players: Player[], track: Track): Player[] {
    const result = [...players];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const inBounds = player.isInBounds(track);
      if (inBounds) {
        const relativePosition = player.relativePosition(track);
        const targetPosition = track.getAbsolutePosition(Vector.of(0.8, relativePosition.y + 0.1));
        result[i] = player.withTargets([Target.of(targetPosition)]);
      } else {
        const targetPosition = track.getClosestPointOnTrackLine(player, 0.5);
        result[i] = player.withTargets([Target.of(targetPosition)]);
      }
    }
    return result;
  }

  private static calculateObjectivesForJammers(players: Player[], track: Track): Player[] {
    const result = [...players];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const inBounds = player.isInBounds(track);
      if (inBounds && player.isJammer()) {
        const relativePosition = player.relativePosition(track);
        const targetPosition = track.getAbsolutePosition(Vector.of(0.8, relativePosition.y + 0.1));
        result[i] = player.withTargets([Target.of(targetPosition)]);
      } else if (!inBounds) {
        const targetPosition = track.getClosestPointOnTrackLine(player, 0.5);
        result[i] = player.withTargets([Target.of(targetPosition)]);
      }
    }
    return result;
  }
}
