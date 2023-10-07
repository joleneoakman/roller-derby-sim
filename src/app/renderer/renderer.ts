import {PlayerState} from "../state/player.state";
import {Track} from "../model/track";
import {GameState} from "../state/game.state";
import {Velocity} from "../model/velocity";
import {GameConstants} from "../game/game-constants";
import {Team} from "../model/team";
import {Outline} from "../model/outline";
import {Position} from "../model/position";

export class Renderer {

  private readonly ctx: CanvasRenderingContext2D;
  private readonly scale: number;
  private readonly width: number;
  private readonly height: number;

  constructor(ctx: CanvasRenderingContext2D, scale: number, width: number, height: number) {
    this.ctx = ctx;
    this.scale = scale;
    this.width = width;
    this.height = height;
  }

  drawScene(state: GameState) {
    this.ctx.clearRect(GameConstants.ORIGIN.x, GameConstants.ORIGIN.y, this.width, this.height);
    this.drawRect(GameConstants.ORIGIN, this.width, this.height, GameConstants.TRACK_LINE_COLOR);
    this.drawTrack(state.track);
    for (let i = 0; i < state.players.length; i++) {
      this.drawPlayer(state.players[i], state.selection?.index === i);
    }
  }

  drawTrack(track: Track) {
    // Track outline
    const outline = Outline.of(GameConstants.TRACK_STROKE_COLOR, 2);
    track.trackRectangles.forEach(rectangle => {
      this.drawRect(rectangle.position, rectangle.width, rectangle.height, GameConstants.INSIDE_TRACK_COLOR, outline);
    });
    track.trackTriangles.forEach(triangle => {
      this.drawTriangle(triangle.p1, triangle.p2, triangle.p3, GameConstants.INSIDE_TRACK_COLOR, outline);
    });
    track.trackCircles.forEach(circle => {
      this.drawCircle(circle.position, circle.radius, GameConstants.INSIDE_TRACK_COLOR, outline);
    });

    // Track
    track.trackRectangles.forEach(rectangle => {
      this.drawRect(rectangle.position, rectangle.width, rectangle.height, GameConstants.INSIDE_TRACK_COLOR);
    });
    track.trackTriangles.forEach(triangle => {
      this.drawTriangle(triangle.p1, triangle.p2, triangle.p3, GameConstants.INSIDE_TRACK_COLOR);
    });
    track.trackCircles.forEach(circle => {
      this.drawCircle(circle.position, circle.radius, GameConstants.INSIDE_TRACK_COLOR);
    });

    // Inside track outline
    const innerRect = track.innerRectangle;
    this.drawRect(innerRect.position, innerRect.width, innerRect.height, GameConstants.TRACK_LINE_COLOR, outline);
    track.innerCircles.forEach(circle => {
      this.drawCircle(circle.position, circle.radius, GameConstants.TRACK_LINE_COLOR, outline);
    });

    // Inside track
    this.drawRect(innerRect.position, innerRect.width, innerRect.height, GameConstants.TRACK_LINE_COLOR);
    track.innerCircles.forEach(circle => {
      this.drawCircle(circle.position, circle.radius, GameConstants.TRACK_LINE_COLOR);
    });

    // Lines
    this.drawLine(track.jammerLine.p1, track.jammerLine.p2, outline);
    this.drawLine(track.pivotLine.p1, track.pivotLine.p2, outline);
    track.tenFeetLines.forEach(line => this.drawLine(line.p1, line.p2, outline));
  }

  drawPlayer(player: PlayerState, selected: boolean) {
    const position = player.position;
    const targetVelocity = Velocity.of(10, player.targetVelocity.angle);
    const velocity = Velocity.of(10, player.velocity.angle);
    const color = player.team === Team.A ? GameConstants.TEAM_A_COLOR : GameConstants.TEAM_B_COLOR;
    const strokeColor = player.team === Team.A ? GameConstants.TEAM_A_STROKE_COLOR : GameConstants.TEAM_B_STROKE_COLOR;
    this.drawCircle(position, player.radius, color, Outline.of(strokeColor, 1));
    this.drawLine(position, Position.of(position.x + (targetVelocity.x * 20), position.y + (targetVelocity.y * 20)), Outline.of('black', 1));
    this.drawLine(position, Position.of(position.x + (velocity.x * 20), position.y + (velocity.y * 20)), Outline.of('black', 1));
  }

  drawCircle(pos: Position, radius: number, color: string, outline?: Outline) {
    this.ctx.beginPath();
    this.ctx.arc(pos.x * this.scale, pos.y * this.scale, radius * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.stroke(outline);
    this.ctx.closePath();
  }

  drawRect(pos: Position, width: number, height: number, color: string, outline?: Outline) {
    this.ctx.beginPath();
    this.ctx.rect(pos.x * this.scale, pos.y * this.scale, width * this.scale, height * this.scale);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.stroke(outline);
    this.ctx.closePath();
  }

  drawLine(pos1: Position, pos2: Position, outline: Outline) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineWidth = outline.width;
    this.ctx.strokeStyle = outline.color;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawTriangle(pos1: Position, pos2: Position, pos3: Position, color: string, outline?: Outline) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineTo(pos3.x * this.scale, pos3.y * this.scale);
    this.ctx.closePath();
    this.stroke(outline);
    this.ctx.fillStyle = color;
    this.ctx.fill();

  }

  private stroke(outline?: Outline) {
    if (!outline) {
      return;
    }
    this.ctx.lineWidth = outline.width;
    this.ctx.strokeStyle = outline.color;
    this.ctx.stroke();
  }
}
