import {Team} from "../model/team";
import {PlayerType} from "../model/player-type";
import {Velocity} from "../model/velocity";
import {Circle} from "../model/circle";
import {Position} from "../model/position";
import {Pair} from "../model/pair";
import {GameConstants} from "../game/game-constants";
import {MathTools} from "../util/math-tools";
import {CollisionTools} from "../util/collision-tools";
import {DistanceTools} from "../util/distance-tools";

export class PlayerState {
  readonly team: Team;
  readonly type: PlayerType;
  readonly position: Position;
  readonly velocity: Velocity;
  readonly targetVelocity: Velocity;
  readonly massKg: number;

  readonly radius: number = GameConstants.PLAYER_RADIUS;

  private constructor(team: Team,
                      type: PlayerType,
                      position: Position,
                      velocity: Velocity,
                      targetVelocity: Velocity,
                      massKg: number) {
    this.team = team;
    this.type = type;
    this.position = position;
    this.velocity = velocity;
    this.targetVelocity = targetVelocity;
    this.massKg = massKg;
  }

  public static of(team: Team,
                   type: PlayerType,
                   position: Position,
                   velocity: Velocity,
                   targetVelocity: Velocity,
                   massKg: number): PlayerState {
    return new PlayerState(team, type, position, velocity, targetVelocity, massKg);
  }

  public toCircle(): Circle {
    return Circle.of(this.position, this.radius);
  }

  public withVelocity(velocity: Velocity): PlayerState {
    return new PlayerState(this.team, this.type, this.position, velocity, this.targetVelocity, this.massKg);
  }

  public withTargetVelocity(targetVelocity: Velocity): PlayerState {
    return new PlayerState(this.team, this.type, this.position, this.velocity, targetVelocity, this.massKg);
  }

  public withPosition(position: Position): PlayerState {
    return new PlayerState(this.team, this.type, position, this.velocity, this.targetVelocity, this.massKg);
  }

  public recalculate(): PlayerState {
    // Calculate new velocity based on target velocity
    const newVelocity = this.velocity.recalculate(this.targetVelocity);
    const newPosition = newVelocity.calculatePosition(this.position);
    return this.withVelocity(newVelocity).withPosition(newPosition);
  }

  turnTowards(targetPoint: Position): PlayerState {
    const angle = this.velocity.turnTowards(targetPoint, this.position);
    return this.withTargetVelocity(this.targetVelocity.withAngle(angle));
  }

  /**
   * Calculates the both player states after a collision between them.
   */
  public collide(player2: PlayerState): Pair<PlayerState, PlayerState> {
    // If there is no collision, return the original players
    const distance = DistanceTools.ofPlayers(this, player2);
    if (distance > 0) {
      return Pair.of(this, player2);
    }

    // Correct player positions if they are overlapping
    let player1: PlayerState = this;
    if (distance < 0) {
      const corrected = CollisionTools.collideCircles(player1.toCircle(), player2.toCircle());
      player1 = player1.withPosition(corrected.a.position);
      player2 = player2.withPosition(corrected.b.position);
    }
    if (true) {
      return Pair.of(player1, player2);
    }

    // Get mass and velocity for each player
    const m1 = player1.massKg;
    const m2 = player2.massKg;
    const v1 = player1.velocity;
    const v2 = player2.velocity;

    // Calculate distance between circle centers
    const dx = player1.position.x - player2.position.x;
    const dy = player1.position.y - player2.position.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Calculate normal vector
    const nx = dx / d;
    const ny = dy / d;

    // Calculate new velocities using 1D elastic collision equation
    const vDotN = player1.getDotN(player2);
    const j = -(1 + GameConstants.COLLISION_COEFFICIENT) * vDotN / (1 / m1 + 1 / m2);
    const jx = j * nx;
    const jy = j * ny;

    const newV1 = Velocity.ofVector(v1.x + (jx / m1), v1.y + (jy / m1));
    const newV2 = Velocity.ofVector(v2.x - (jx / m2), v2.y - (jy / m2));

    // Calculate new positions to ensure minimum distance between players
    const overlap = player1.radius + player2.radius - d;  // Calculate the overlap between circles
    const correctionFactor = overlap / (d * (1/m1 + 1/m2)); // How much to move each circle

    // Move player circles away from each other
    const newPosX1 = player1.position.x + (correctionFactor * nx * (1/m1));
    const newPosY1 = player1.position.y + (correctionFactor * ny * (1/m1));

    const newPosX2 = player2.position.x - (correctionFactor * nx * (1/m2));
    const newPosY2 = player2.position.y - (correctionFactor * ny * (1/m2));

    // Generate new Position objects
    const newPos1 = Position.of(newPosX1, newPosY1);
    const newPos2 = Position.of(newPosX2, newPosY2);

    // Return new players
    const player1New = this.withVelocity(newV1).withPosition(newPos1);
    const player2New = player2.withVelocity(newV2).withPosition(newPos2);
    return Pair.of(player1New, player2New);
  }

  public getDotN(player2: PlayerState): number {
    return MathTools.getDotN(this.position, this.velocity, player2.position, player2.velocity);
  }

  withTargetPosition(position: Position): PlayerState {
    // Todo
    return this.turnTowards(position);
  }
}
