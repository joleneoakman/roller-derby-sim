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
    const playersAfterMove = this.players.map(player => player.moveTowardsTarget());

    // Calculate new player velocities based on objectives
    // Todo: implement

    // Calculate new player positions and velocities after collisions
    /*const count = this.players.length;
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
    return this.withPlayers(playersAfterBounds);*/
    return this.withFrameRate(this.frames + 1).withPlayers(playersAfterMove);
  }
}
