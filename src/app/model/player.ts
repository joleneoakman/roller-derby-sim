import {Team} from "./team";
import {PlayerType} from "./player-type";
import {Velocity} from "./geometry/velocity";
import {Circle} from "./geometry/circle";
import {Vector} from "./geometry/vector";
import {GameConstants} from "../game/game-constants";
import {Track} from "./track";
import {Target} from "./target";
import {Angle} from "./geometry/angle";
import {Speed} from "./geometry/speed";
import {PlayerGoal} from "./goals/player-goal";
import {PlayerGoalType} from "./goals/player-goal-type";
import {PlayerId} from "./player-id";
import {Overflow} from "./overflow";
import {PlayerGoalReturnInBounds} from "./goals/player-goal-return-in-bounds";

export class Player {

  // Fixed data
  readonly id: PlayerId;
  readonly massKg: number;
  readonly radius: number = GameConstants.PLAYER_RADIUS;

  // Motion data
  readonly current: Target;
  readonly targets: Target[];

  // Goals
  readonly goals: PlayerGoal[];

  private constructor(id: PlayerId,
                      massKg: number,
                      current: Target,
                      targets: Target[],
                      goals: PlayerGoal[]) {
    this.id = id;
    this.massKg = massKg;
    this.current = current;
    this.targets = targets;
    this.goals = goals;
  }

  //
  // Create
  //

  public static of(team: Team,
                   number: string,
                   name: string,
                   type: PlayerType,
                   massKg: number,
                   current: Target): Player {
    return new Player(PlayerId.of(team, number, name, type), massKg, current, [], []);
  }

  //
  // Setters
  //

  public withMotion(motion: Target): Player {
    return new Player(this.id, this.massKg, motion, this.targets, this.goals);
  }

  public withPosition(position: Vector): Player {
    return this.withMotion(this.current.withPosition(position));
  }

  public withVelocity(velocity: Velocity): Player {
    return this.withMotion(this.current.withVelocity(velocity));
  }

  public withTarget(target: Target): Player {
    return this.withTargets([target]);
  }

  public withTargets(targets: Target[]): Player {
    return new Player(this.id, this.massKg, this.current, targets, this.goals);
  }

  public addTarget(motion: Target): Player {
    return this.withTargets([...this.targets, motion]);
  }

  public markTargetAsReached(): Player {
    const newTargets = this.targets.slice(1);
    return this.withTargets(newTargets);
  }

  public updateGoal(goal: PlayerGoal): Player {
    const newGoals = this.goals.map(g => g.type === goal.type ? goal : g);
    return this.withGoals(newGoals);
  }

  public clearTargets(): Player {
    return this.withTargets([]);
  }

  private withGoals(goals: PlayerGoal[]): Player {
    return new Player(this.id, this.massKg, this.current, this.targets, goals);
  }

  public addGoals(goals: PlayerGoal[], comparator: (g1: PlayerGoal, g2: PlayerGoal) => number): Player {
    const newGoals = [...this.goals, ...goals].sort(comparator);
    return this.withGoals(newGoals);
  }

  public clearGoal(goal: PlayerGoal): Player {
    const newGoals = this.goals.filter(g => g !== goal);
    return this.withGoals(newGoals);
  }

  public moveTowardsTarget(): Player {
    // Target reached!
    const target = this.targets.length > 0 ? this.targets[0] : undefined;
    const currentKph = this.velocity.speed.kph;
    const speedRatio = Math.min(currentKph / GameConstants.MAX_SPEED_KPH, GameConstants.MAX_SPEED_KPH);
    const targetSize = 0.05 * (1 - speedRatio) + 1.5 * speedRatio;
    if (target && this.position.distanceTo(target.position) < targetSize) {
      return this.markTargetAsReached().moveTowardsTarget();
    }

    // Adjust angle
    const newAngle = Player.calculateAdjustedAngle(this.current, target?.position);

    // Adjust speed
    const newSpeed = Player.calculateAdjustedSpeed(this.current, this.targets);
    // Do move
    const newVelocity = Velocity.of(newSpeed, newAngle);
    const newPosition = this.position.plus(this.velocity.vector);
    return this.withVelocity(newVelocity).withPosition(newPosition);
  }

  public collideWith(other: Player): [Player, Player] {
    const updatedPlayers = Player.calculateStaticCollision(this, other);
    return Player.calculateDynamicCollision(updatedPlayers[0], updatedPlayers[1]);
  }

  //
  // Getters
  //

  public get position(): Vector {
    return this.current.position;
  }

  public get velocity(): Velocity {
    return this.current.velocity;
  }

  public toCircle(): Circle {
    return Circle.of(this.position, this.radius);
  }

  public relativePosition(track: Track): Vector {
    return this.current.relativePosition(track);
  }

  public distanceTo(other: Player): number {
    return this.toCircle().distanceTo(other.toCircle());
  }

  public collidesWith(other: Player): boolean {
    return this.toCircle().collidesWith(other.toCircle());
  }

  public isOnInsideTrack(track: Track): boolean {
    const relativePosition = this.relativePosition(track);
    return relativePosition.x < 0;
  }

  public isInBounds(track: Track): boolean {
    const relativePosition = this.relativePosition(track);
    return relativePosition.x >= 0 && relativePosition.x <= 1;
  }

  public get team(): Team {
    return this.id.team;
  }

  public get number(): string {
    return this.id.number;
  }

  public get name(): string {
    return this.id.name;
  }

  public get type(): PlayerType {
    return this.id.type;
  }

  public isJammer() {
    return this.id.type === PlayerType.JAMMER;
  }

  public isBlocker() {
    return this.id.type !== PlayerType.JAMMER;
  }

  public isPivot() {
    return this.id.type === PlayerType.PIVOT;
  }

  public hasGoal(type: PlayerGoalType): boolean {
    return this.goals.some(g => g.type === type);
  }

  public isInFrontOf(other: Player, track: Track): boolean {
    const player1 = Overflow.of(this.relativePosition(track).y);
    const player2 = Overflow.of(other.relativePosition(track).y);
    return player1.isInFrontOf(player2);
  }

  public isBehind(other: Player, track: Track): boolean {
    return !this.isInFrontOf(other, track);
  }

  //
  // Utility methods
  //

  private static calculateAdjustedAngle(current: Target, targetPosition?: Vector): Angle {
    if (targetPosition === undefined) {
      return current.velocity.angle;
    }
    const currentAngle = current.velocity.angle;
    const currentKph = current.velocity.speed.kph;
    const normalizedTarget = targetPosition.minus(current.position);
    if (normalizedTarget.isOrigin()) {
      return currentAngle;
    }
    const targetAngle = Angle.ofVector(normalizedTarget);
    const turnWeight = Math.pow(Math.min(currentKph, GameConstants.MAX_SPEED_KPH) / GameConstants.MAX_SPEED_KPH, 0.35);
    const turnStep = GameConstants.TURN_PER_FRAME_AT_MAX * turnWeight + GameConstants.TURN_PER_FRAME_AT_MIN * (1 - turnWeight);
    return currentAngle.turnTowards(targetAngle, turnStep);
  }

  /**
   * calculateAdjustedSpeed - Calculates the adjusted speed for a player based on their current position, velocity, and target(s).
   *
   * Logic Phases:
   * 1. Accelerate: The player starts from their current position and accelerates until reaching the maximum speed.
   * 2. Maintain Max Speed: The player maintains the maximum speed if the distance to the next target(s) is greater than the stopping distance.
   * 3. Decelerate: Begins to slow down to either stop at the final target or adjust speed according to the angle between successive targets.
   *
   * Scenarios:
   * - Single Target: The player needs to come to a full stop at the next target.
   * - Multiple Targets:
   *    - If angle between successive targets is 0 degrees: Maximum speed.
   *    - If angle is 90 degrees: Complete stop before moving to the next target.
   *    - If angle is between 0 and 90: Speed is adjusted based on `accelerationWeight * (1 - angle / 90)`.
   *
   * Exit Conditions:
   * 1. All targets processed.
   * 2. Distance to n-th target is greater than stopping distance.
   * 3. Max accelerationWeight becomes 0.
   */
  private static calculateAdjustedSpeed(current: Target, targets: Target[]): Speed {
    const currentKph = current.velocity.speed.kph;
    let distanceToStop = Player.calculateStoppingDistance(currentKph);
    let accelerationWeight = 1;

    if (targets.length === 0) {
      // No targets, so just decelerate
      accelerationWeight = 0;
    } else {
      // Inversely adjust speed to let player face target before accelerating
      const playerAngle = current.velocity.angle;
      const playerTargetAngle = Angle.ofVector(targets[0].position.minus(current.position));
      const smallestRotation = playerAngle.minus(playerTargetAngle).shortestAngle().degrees;
      if (smallestRotation > 90) {
        accelerationWeight = 0;
      } else if (smallestRotation > 0) {
        const playerAngleAdjustment = Math.pow(1 - smallestRotation / 90, 1 / 3);
        accelerationWeight *= playerAngleAdjustment;
      }

      // Check next targets to see if we need to slow down
      const allPositions = [current, ...targets];
      for (let i = 1; i < allPositions.length && accelerationWeight > 0; i++) {
        const prev = allPositions[i - 1];
        const curr = allPositions[i];
        const distance1 = prev.position.distanceTo(curr.position);

        if (distance1 > distanceToStop) {
          break;
        } else if (i === allPositions.length - 1) {
          accelerationWeight = 0;
          break;
        }

        const next = allPositions[i + 1];
        const angle = Angle.ofVectors(prev.position, curr.position, next.position);
        const smallestRotation = Math.abs(180 - angle.shortestAngle().degrees);
        if (smallestRotation >= 90) {
          accelerationWeight = 0;
          break;
        } else if (smallestRotation > 0) {
          const nextTargetAngleAdjustment = Math.pow(1 - smallestRotation / 90, 1 / 3);
          accelerationWeight *= nextTargetAngleAdjustment;
        }
      }
    }

    let accelerationStep = currentKph < 5 ? GameConstants.ACCELERATION_STEP * 20 : GameConstants.ACCELERATION_STEP;
    accelerationStep = currentKph < 10 ? GameConstants.ACCELERATION_STEP * 4 : accelerationStep;
    const maxAcceleration = Math.min(currentKph + accelerationStep, GameConstants.MAX_SPEED_KPH);
    const maxDeceleration = Math.max(currentKph - GameConstants.DECELERATION_STEP, 0);
    const newKph = accelerationWeight * maxAcceleration + (1 - accelerationWeight) * maxDeceleration;
    return Speed.ofKph(newKph);
  }

  private static calculateStoppingDistance(currentSpeed: number): number {
    let speed = currentSpeed;
    let distanceToStop = 0;
    while (speed > 0) {
      distanceToStop += speed / GameConstants.FPS; // Convert kph to m/s and multiply by time (1/60)
      speed = Math.max(speed - GameConstants.DECELERATION_STEP, 0);
    }
    return distanceToStop * 1000 / 3600; // convert back to the unit you're using for distance
  }

  /**
   * This method adjusts the position of the players so that they're not overlapping.
   */
  private static calculateStaticCollision(player1: Player, player2: Player): [Player, Player] {
    const distanceBetweenCenters = player1.position.distanceTo(player2.position);
    const sumOfRadii = player1.radius + player2.radius;

    if (distanceBetweenCenters >= sumOfRadii) {
      return [player1, player2];  // No collision
    }

    const overlap = sumOfRadii - distanceBetweenCenters;
    const direction = player2.position.minus(player1.position).normalize();

    // Adjust positions
    const player1NewPosition = player1.position.minus(direction.scale(overlap / 2));
    const player2NewPosition = player2.position.plus(direction.scale(overlap / 2));

    const updatedPlayer1 = player1.withPosition(player1NewPosition);
    const updatedPlayer2 = player2.withPosition(player2NewPosition);

    return [updatedPlayer1, updatedPlayer2];
  }

  /**
   * This method will adjust the velocity of the players to simulate impact, based on speed, angle and mass.
   */
  private static calculateDynamicCollision(player1: Player, player2: Player): [Player, Player] {
    // Todo 2
    return [player1, player2];
  }
}
