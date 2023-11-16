import {Player} from "./player";
import {Track} from "./track";
import {Vector} from "./geometry/vector";
import {PlayerSelection} from "./player-selection";
import {Pack} from "./pack";
import {Target} from "./target";
import {GoalReturnInBoundsFactory} from "./goals/goal-return-in-bounds";
import {GoalJammerDoLapsFactory} from "./goals/goal-jammer-do-laps";
import {GoalBlockerBlockFactory} from "./goals/goal-blocker-block";
import {GoalFactory} from "./goals/goal-factory";
import {GoalBlockerDoLapsFactory} from "./goals/goal-blocker-do-laps";
import {Info} from "./info";
import {Goal} from "./goals/goal";
import {GoalBlockerReturnToPackFactory} from "./goals/goal-blocker-return-to-pack";
import {GameConstants} from "../game/game-constants";
import {GameInfo} from "./game-info";
import {PackWarningType} from "./pack-warning-type";
import {PackGame} from "./pack-game";
import {PackWarning} from "./pack-warning";
import {GoalJammerEvadeFactory} from "./goals/goal-jammer-evade";
import {GoalStayInBoundsFactory} from "./goals/goal-stay-in-bounds";
import {GoalBlockerReformPackFactory} from "./goals/goal-blocker-reform-pack";
import {GoalBlockerFormWallFactory} from "./goals/goal-blocker-form-wall";
import {GoalBlockerOffenseFactory} from "./goals/goal-blocker-offense";

export class GameState {

  private static readonly GOAL_FACTORIES: GoalFactory[] = [
    new GoalReturnInBoundsFactory(),
    new GoalStayInBoundsFactory(),
    new GoalJammerEvadeFactory(),
    new GoalJammerDoLapsFactory(),
    new GoalBlockerReformPackFactory(),
    new GoalBlockerReturnToPackFactory(),
    new GoalBlockerBlockFactory(),
    new GoalBlockerOffenseFactory(),
    new GoalBlockerFormWallFactory(),
    new GoalBlockerDoLapsFactory()
  ];
  private static readonly GOAL_COMPARATOR = GameState.createGoalComparator(GameState.GOAL_FACTORIES);

  readonly frames: number;
  readonly track: Track;
  readonly players: Player[];
  readonly pack: Pack;
  readonly playerSelection?: PlayerSelection;
  readonly paused: boolean;
  readonly packGame: PackGame;

  constructor(frames: number, track: Track, players: Player[], pack: Pack, paused: boolean, packGame: PackGame, selection: PlayerSelection | undefined) {
    this.frames = frames;
    this.players = players;
    this.track = track;
    this.pack = pack;
    this.paused = paused;
    this.packGame = packGame;
    this.playerSelection = selection;
  }

  //
  // Create
  //

  public static of(track: Track, players: Player[]): GameState {
    return new GameState(0, track, players, Pack.create(players, track), true, PackGame.empty(), undefined);
  }

  //
  // Getters
  //

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

  public toInfo(): GameInfo {
    return GameInfo.of(
      this.toPlayerInfo(),
      this.toPackInfo(),
      this.toScoreInfo()
    );
  }

  private toPlayerInfo(): Info[] {
    const p = this.playerSelection === undefined ? undefined : this.players[this.playerSelection.index];
    if (!p) {
      return [];
    }
    const goals = p.goals.length === 0 ? 'None' : p.goals.map(g => g.type).join('\n');
    const relativePosition = p.relativePosition(this.track);
    return [
      Info.of('Name', p.name),
      Info.of('In play', p.isInPlay(this.pack, this.track) ? 'Yes' : 'No'),
      Info.of('X (%)', relativePosition.x.toFixed(3)),
      Info.of('Y (%)', relativePosition.y.toFixed(3)),
      Info.of('Speed (kph)', p.velocity.speed.kph.toFixed(1)),
      Info.of('Angle', p.velocity.angle.degrees.toFixed(0)),
      Info.of('Goals', goals),
    ];
  }

  private toPackInfo(): Info[] {
    const pack = this.pack.activePack;
    const packDefinition = Info.of('Pack', this.pack.warning)
    const size = pack?.playerIndices?.length;
    return [
      packDefinition,
      Info.of('Pack size', '' + (size ? size : '0')),
    ];
  }

  private toScoreInfo(): Info[] {
    return [
      Info.of('Score', '' + this.packGame.score.score),
      Info.of('Perfects', '' + this.packGame.score.perfects),
      Info.of('Goods', '' + this.packGame.score.goods),
      Info.of('OKs', '' + this.packGame.score.oks),
      Info.of('Mistakes', '' + this.packGame.score.mistakes),
    ]
  }

  //
  // Setters
  //

  public withFrameRate(frames: number): GameState {
    return new GameState(frames, this.track, this.players, this.pack, this.paused, this.packGame, this.playerSelection);
  }

  public withPlayers(players: Player[]): GameState {
    const pack = Pack.create(players, this.track);
    return new GameState(this.frames, this.track, players, pack, this.paused, this.packGame, this.playerSelection);
  }

  public withSelection(index: number): GameState {
    return new GameState(this.frames, this.track, this.players, this.pack, this.paused, this.packGame, PlayerSelection.of(index));
  }

  public withSelectedTargetPosition(position: Vector, stop: boolean): GameState {
    if (this.playerSelection === undefined) {
      return this;
    }
    return this.withSelection(this.playerSelection.index).withPlayers(this.players.map((p, i) => {
      if (i === this.playerSelection?.index) {
        return p.addTarget(Target.of(position, stop));
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
    return new GameState(this.frames, this.track, this.players, this.pack, this.paused, this.packGame, undefined);
  }

  public recalculate(): GameState {
    const goalFactories = this.paused ? [] : GameState.GOAL_FACTORIES;
    const playersAfterGoals = this.paused ? this.players : GameState.calculateGoals(this.players, this.track, this.pack, goalFactories);
    const playersAfterMove = GameState.calculateMovements(playersAfterGoals);
    const playersAfterCollisions = GameState.calculateCollisions(this.players, playersAfterMove);
    const packGame = this.packGame.withNewGameWarning(PackWarning.of(this.pack.warning, Date.now()));
    return this.withFrameRate(this.frames + 1)
      .withPlayers(playersAfterCollisions)
      .withPackGame(packGame);
  }

  public toggleGame(): GameState {
    const paused = !this.paused;
    const players = paused ? this.players.map(p => p.freeze()) : this.players;
    return new GameState(this.frames, this.track, players, this.pack, paused, this.packGame, this.playerSelection);
  }

  public givePackWarning(packWarning: PackWarningType): GameState {
    const now = Date.now();
    const packGame = this.packGame.withNewUserWarning(PackWarning.of(packWarning, now));
    return this.withPackGame(packGame);
  }

  private withPackGame(packGame: PackGame): GameState {
    return new GameState(this.frames, this.track, this.players, this.pack, this.paused, packGame, this.playerSelection);
  }

  //
  // Utility methods
  //

  private static calculateGoals(players: Player[], track: Track, pack: Pack, goalFactories: GoalFactory[]): Player[] {
    const playersAfterNewGoals = GameState.calculateNewGoals(players, track, pack, goalFactories);
    return GameState.calculateGoalTargets(playersAfterNewGoals, track, pack);
  }

  private static calculateNewGoals(players: Player[], track: Track, pack: Pack, goalFactories: GoalFactory[]): Player[] {
    const now = Date.now();
    if (!GameConstants.PLAY) {
      return players;
    }

    return players.map(player => {
      const newGoals: Goal[] = [];
      for (const factory of goalFactories) {
        if (factory.test(player, players, track, pack)) {
          const goal = factory.create(now, player, players, track, pack);
          newGoals.push(goal);
        }
      }

      if (newGoals.length > 0) {
        return player.addGoals(newGoals, this.GOAL_COMPARATOR);
      }
      return player;
    });
  }

  private static calculateGoalTargets(players: Player[], track: Track, pack: Pack): Player[] {
    return players.map(player => {
      if (player.goals.length === 0) {
        return player;
      }

      let goal = player.goals[0];
      do {
        goal = player.goals[0];
        player = goal.execute(Date.now(), player, players, track, pack);
      } while (!player.hasGoal(goal.type));
      return player;
    });
  }

  private static calculateMovements(players: Player[]): Player[] {
    return players.map(player => player.moveTowardsTarget());
  }

  private static calculateCollisions(oldPlayers: Player[], players: Player[]): Player[] {
    const result: Player[] = [...players];
    const count = players.length;
    for (let i = 0; i < count; i++) {
      const player1 = result[i];
      const oldPosition1 = oldPlayers[i].position;
      for (let j = 0; j < count; j++) {
        const player2 = result[j];
        const oldPosition2 = oldPlayers[i].position;
        if (i !== j && player1.collidesWith(player2)) {
          const [player1New, player2New] = player1.collideWith(player2, oldPosition1, oldPosition2);
          result[i] = player1New;
          result[j] = player2New;
        }
      }
    }
    return result;
  }

  /**
   * Create a comparator that sorts goals by the order in which the given factories array is sorted.
   */
  private static createGoalComparator(factories: GoalFactory[]): (a: Goal, b: Goal) => number {
    return (a: Goal, b: Goal) => {
      const aIndex = factories.findIndex(f => f.type === a.type);
      const bIndex = factories.findIndex(f => f.type === b.type);
      return aIndex - bIndex;
    }
  }
}
