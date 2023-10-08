import {PlayerState} from "./player.state";
import {Track} from "../model/track";
import {Position} from "../model/position";
import {SelectionState} from "./selection.state";
import {DistanceTools} from "../util/distance-tools";
import {CollisionTools} from "../util/collision-tools";
import {GeometryTools} from "../util/geometry-tools";
import {PackState} from "./pack.state";

export class GameState {

  readonly track: Track;
  readonly players: PlayerState[];
  readonly pack: PackState;
  readonly selection?: SelectionState;

  constructor(track: Track, players: PlayerState[], pack: PackState, selection?: SelectionState) {
    this.players = players;
    this.track = track;
    this.pack = pack;
    this.selection = selection;
  }

  public static of(track: Track, players: PlayerState[]): GameState {
    return new GameState(track, players, PackState.create(players, track.packLine), undefined);
  }

  public withPlayers(players: PlayerState[]): GameState {
    const pack = PackState.create(players, this.track.packLine);
    return new GameState(this.track, players, pack, this.selection);
  }

  public withSelection(index: number, targetPosition: Position): GameState {
    return new GameState(this.track, this.players, this.pack, SelectionState.of(index, targetPosition));
  }

  public withSelectedTargetPosition(position: Position): GameState {
    if (this.selection === undefined) {
      return this;
    }
    return this.withSelection(this.selection.index, position).withPlayers(this.players.map((p, i) => {
      if (i === this.selection?.index) {
        return p.withTargetPosition(position);
      } else {
        return p;
      }
    }));
  }

  public select(position: Position): GameState {
     const index = this.findPlayerIndexAt(position);
     return this.withSelection(index, position);
  }

  public deselect(): GameState {
    return new GameState(this.track, this.players, this.pack, undefined);
  }

  public findPlayerIndexAt(position: Position): number {
    const count = this.players.length;
    for (let i = 0; i < count; i++) {
      const player = this.players[i];
      const distance = DistanceTools.ofPositions(player.position, position);
      if (distance <= player.radius) {
        return i;
      }
    }
    return -1;
  }

  public recalculate(): GameState {
    const playersAfterMove = this.players.map(player => player.recalculate());

    // Calculate new player velocities based on objectives
    // Todo: implement

    // Calculate new player positions and velocities after collisions
    const count = this.players.length;
    const playersAfterBlocks: PlayerState[] = [...playersAfterMove];
    for (let i = 0; i < count; i++) {
      const playerAfterMove1 = playersAfterBlocks[i];
      for (let j = i + 1; j < count; j++) {
        const playerAfterMove2 = playersAfterBlocks[j];
        const collided = CollisionTools.collidePlayers(playerAfterMove1, playerAfterMove2);
        playersAfterBlocks[i] = collided.a;
        playersAfterBlocks[j] = collided.b;
      }
    }

    // Calculate player - track collisions (and compensate)
    const playersAfterBounds: PlayerState[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const oldPlayer = this.players[i];
      const newPlayer = playersAfterBlocks[i];
      const containsOld = GeometryTools.isInBounds(this.track, oldPlayer);
      const containsNew = GeometryTools.isInBounds(this.track, newPlayer);

      if (!containsNew) {
        const targetPoint = this.track.getClosestPointOnTrackLine(newPlayer, 0.5);
        playersAfterBounds[i] = newPlayer.turnTowards(targetPoint);
      } else {
        playersAfterBounds[i] = newPlayer;
      }
    }
    return this.withPlayers(playersAfterBounds);
  }
}
