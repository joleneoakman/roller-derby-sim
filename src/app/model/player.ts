import {Team} from "./team";
import {PlayerType} from "./player-type";
import {Velocity} from "./velocity";
import {Circle} from "./circle";
import {Position} from "./position";
import {Pair} from "./pair";
import {GameConstants} from "../game/game-constants";
import {MathTools} from "../util/math-tools";
import {Track} from "./track";

export class Player {

  // Fixed data
  readonly team: Team;
  readonly type: PlayerType;
  readonly massKg: number;
  readonly radius: number = GameConstants.PLAYER_RADIUS;

  // Physics data
  readonly position: Position;
  // X: Relative lane position (<0 = out of bounds (inner), 0..1 = in bounds, 1 = outside, >1 = out of bounds (outer))
  // Y: Relative distance traveled along track (0 = start, 0.9999... = end)
  readonly relativePosition: Position;
  readonly velocity: Velocity;
  readonly targetVelocity: Velocity;

  private constructor(team: Team,
                      type: PlayerType,
                      position: Position,
                      relativePosition: Position,
                      velocity: Velocity,
                      targetVelocity: Velocity,
                      massKg: number) {
    this.team = team;
    this.type = type;
    this.position = position;
    this.relativePosition = relativePosition;
    this.velocity = velocity;
    this.targetVelocity = targetVelocity;
    this.massKg = massKg;
  }

  public static of(track: Track,
                   team: Team,
                   type: PlayerType,
                   position: Position,
                   velocity: Velocity,
                   targetVelocity: Velocity,
                   massKg: number): Player {
    const relativePosition = track.getRelativePosition(position);
    return new Player(team, type, position, relativePosition, velocity, targetVelocity, massKg);
  }

  public toCircle(): Circle {
    return Circle.of(this.position, this.radius);
  }

  public withVelocity(velocity: Velocity): Player {
    return new Player(this.team, this.type, this.position, this.relativePosition, velocity, this.targetVelocity, this.massKg);
  }

  public withTargetVelocity(targetVelocity: Velocity): Player {
    return new Player(this.team, this.type, this.position, this.relativePosition, this.velocity, targetVelocity, this.massKg);
  }

  public withPosition(position: Position, track: Track): Player {
    const relativePosition = track.getRelativePosition(position);
    return new Player(this.team, this.type, position, relativePosition, this.velocity, this.targetVelocity, this.massKg);
  }

  public distanceTo(other: Player): number {
    return this.toCircle().distanceTo(other.toCircle());
  }

  public isInBounds(): boolean {
    return this.relativePosition.x >= 0 && this.relativePosition.x <= 1;
  }

  public recalculate(track: Track): Player {
    // Calculate new velocity based on target velocity
    const newVelocity = this.velocity.recalculate(this.targetVelocity);
    const newPosition = newVelocity.calculatePosition(this.position);
    return this.withVelocity(newVelocity).withPosition(newPosition, track);
  }

  public turnTowards(targetPoint: Position): Player {
    const angle = this.velocity.turnTowards(targetPoint, this.position);
    return this.withTargetVelocity(this.targetVelocity.withAngle(angle));
  }

  public collideWith(player2: Player, track: Track): Pair<Player, Player> {
    // If there is no collision, return the original players
    let player1: Player = this;
    const distance = player1.distanceTo(player2);
    if (distance > 0) {
      return Pair.of(player1, player2);
    }

    // Recalculate player velocities based on initial velocities and masses


    // Correct player positions if they are overlapping
    if (distance < 0) {
      const corrected = player1.toCircle().collideWith(player2.toCircle());
      player1 = player1.withPosition(corrected.a.position, track);
      player2 = player2.withPosition(corrected.b.position, track);
    }
    return Pair.of(player1, player2);
  }

  /**
   * Calculates the both player states after a collision between them.
   */
  public collide(player2: Player, track: Track): Pair<Player, Player> {
    // If there is no collision, return the original players
    const distance = this.distanceTo(player2);
    if (distance > 0) {
      return Pair.of(this, player2);
    }

    // Correct player positions if they are overlapping
    let player1: Player = this;
    if (distance < 0) {
      const corrected = player1.toCircle().collideWith(player2.toCircle());
      player1 = player1.withPosition(corrected.a.position, track);
      player2 = player2.withPosition(corrected.b.position, track);
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
    const player1New = this.withVelocity(newV1).withPosition(newPos1, track);
    const player2New = player2.withVelocity(newV2).withPosition(newPos2, track);
    return Pair.of(player1New, player2New);
  }

  public getDotN(player2: Player): number {
    return MathTools.getDotN(this.position, this.velocity, player2.position, player2.velocity);
  }

  withTargetPosition(position: Position): Player {
    // Todo
    return this.turnTowards(position);
  }
}
