import {Player} from "./player";
import {Track} from "./track";
import {Position} from "./position";
import {PlayerSelection} from "./player-selection";
import {Pack} from "./pack";

export class GameState {

  readonly track: Track;
  readonly players: Player[];
  readonly pack: Pack;
  readonly playerSelection?: PlayerSelection;

  constructor(track: Track, players: Player[], pack: Pack, selection?: PlayerSelection) {
    this.players = players;
    this.track = track;
    this.pack = pack;
    this.playerSelection = selection;
  }

  public static of(track: Track, players: Player[]): GameState {
    return new GameState(track, players, Pack.create(players, track.packLine), undefined);
  }

  public withPlayers(players: Player[]): GameState {
    const pack = Pack.create(players, this.track.packLine);
    return new GameState(this.track, players, pack, this.playerSelection);
  }

  public withSelection(index: number, targetPosition: Position): GameState {
    return new GameState(this.track, this.players, this.pack, PlayerSelection.of(index, targetPosition));
  }

  public withSelectedTargetPosition(position: Position): GameState {
    if (this.playerSelection === undefined) {
      return this;
    }
    return this.withSelection(this.playerSelection.index, position).withPlayers(this.players.map((p, i) => {
      if (i === this.playerSelection?.index) {
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
      const distance = player.position.distanceTo(position);
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
    const playersAfterBlocks: Player[] = [...playersAfterMove];
    for (let i = 0; i < count; i++) {
      const playerAfterMove1 = playersAfterBlocks[i];
      for (let j = i + 1; j < count; j++) {
        const playerAfterMove2 = playersAfterBlocks[j];
        const collided = playerAfterMove1.collideWith(playerAfterMove2);
        playersAfterBlocks[i] = collided.a;
        playersAfterBlocks[j] = collided.b;
      }
    }

    // Calculate player - track collisions (and compensate)
    const playersAfterBounds: Player[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const oldPlayer = this.players[i];
      const newPlayer = playersAfterBlocks[i];
      const containsOld = oldPlayer.isInBounds(this.track);
      const containsNew = newPlayer.isInBounds(this.track);

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
