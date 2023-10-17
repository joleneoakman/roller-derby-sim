import {Player} from "./player";
import {Track} from "./track";
import {Vector} from "./geometry/vector";
import {PlayerSelection} from "./player-selection";
import {Pack} from "./pack";
import {Target} from "./target";
import {PlayerGoalReturnInBounds} from "./goals/player-goal-return-in-bounds";
import {PlayerGoalJammerDoLaps} from "./goals/player-goal-jammer-do-laps";

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
    const playersAfterGoals = GameState.calculateGoals(this.players, this.track, this.pack);
    const playersAfterMove = GameState.calculateMovements(playersAfterGoals);
    const playersAfterCollisions = GameState.calculateCollisions(playersAfterMove);
    return this.withFrameRate(this.frames + 1).withPlayers(playersAfterCollisions);
  }

  private static calculateGoals(players: Player[], track: Track, pack: Pack): Player[] {
    const playersAfterNewGoals = GameState.calculateNewGoals(players, track, pack);
    return GameState.calculateGoalTargets(playersAfterNewGoals, track, pack);
  }

  private static calculateNewGoals(players: Player[], track: Track, pack: Pack): Player[] {
    const now = Date.now();
    return players.map(player => {
      // Todo: penalties?
      if (!player.isInBounds(track)) {
        console.log("Out of bounds!");
        return player.addGoal(new PlayerGoalReturnInBounds(now, player, players, track));
      } else if (player.isJammer()) {
        // Todo: other jammer goals
        return player.addGoal(new PlayerGoalJammerDoLaps(now));
      } else {
        // Todo: other blocker goals
        return player;
      }
    });
  }

  private static calculateGoalTargets(players: Player[], track: Track, pack: Pack): Player[] {
    return players.map(player => {
      if (player.goals.length === 0) {
        return player;
      }
      const goal = player.goals[0];
      return goal.execute(Date.now(), player, players, track);
    });
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
}
