import {Player} from "../model/player";
import {Track} from "../model/track";
import {GameState} from "../model/game-state";
import {Velocity} from "../model/velocity";
import {GameConstants} from "../game/game-constants";
import {Team} from "../model/team";
import {Stroke} from "./stroke";
import {Position} from "../model/position";
import {Arc} from "../model/arc";
import {TrackLine} from "../model/track-line";
import {Circle} from "../model/circle";
import {Speed} from "../model/speed";
import {Pack} from "../model/pack";
import {Rectangle} from "../model/rectangle";
import {Fill} from "./fill";
import {Quad} from "../model/quad";
import {Triangle} from "../model/triangle";
import {Line} from "../model/line";

export class Renderer {

  public static debugPoints: Position[] = [];

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
    // Reset
    this.ctx.clearRect(GameConstants.ORIGIN.x, GameConstants.ORIGIN.y, this.width, this.height);
    this.drawRect(GameConstants.ORIGIN, this.width, this.height, GameConstants.OUT_OF_BOUNDS_FILL);

    // Track
    this.drawTrack(state.track);

    // Pack
    this.drawPack(state.track, state.pack);

    // Players
    for (let i = 0; i < state.players.length; i++) {
      this.drawPlayer(state.players[i], state.playerSelection?.index === i);
    }

    // Relative track
    const relativeTrack = Renderer.createRelativeTrack(this.width, this.height, this.scale, state.track);
    this.drawRelativeTrack(relativeTrack, 0.2);

    // Relative pack
    this.drawRelativePack(relativeTrack, state.pack);

    // Relative players
    for (let i = 0; i < state.players.length; i++) {
      const player = state.players[i];
      if (player.relativePosition.x >= -1 && player.relativePosition.x <= 2) {
        this.drawRelativePlayer(relativeTrack, player, state.playerSelection?.index === i);
      }
    }

    // Debug
    Renderer.debugPoints.forEach(p => this.drawCircle(Circle.of(p, 0.1), Fill.of(GameConstants.DEBUG_POINT_COLOR)));
  }

  private drawRelativeTrack(relativeTrack: Rectangle, tenFeetLineWidth: number) {
    const {x, y, width: w, height: h} = relativeTrack;
    this.drawRect(Position.of(this.width / this.scale - w * 3 - GameConstants.ONE_FOOT, 0), w * 3, this.height / this.scale, Fill.of('black'));
    this.drawRect(Position.of(this.width / this.scale - w * 3, 0), w * 3, this.height / this.scale, GameConstants.OUT_OF_BOUNDS_FILL);
    this.drawRect(Position.of(x, y), w, h, Fill.of(GameConstants.INBOUNDS_COLOR), Stroke.of(GameConstants.TRACK_STROKE_COLOR, 1));
    this.drawRelativeTrackLine(0.25, relativeTrack);
    this.drawRelativeTrackLine(0.50, relativeTrack);
    this.drawRelativeTrackLine(0.75, relativeTrack);

    const stroke = Stroke.of(GameConstants.TRACK_STROKE_COLOR, GameConstants.TRACK_LINE_OUTLINE_WIDTH)
    const step = h / GameConstants.TEN_FEET_LINE_COUNT;
    for (let i = 1; i < GameConstants.TEN_FEET_LINE_COUNT; i++) {

      const currentLineWidth = i == 3 ? w : tenFeetLineWidth;
      const left = Position.of(x + w / 2 - currentLineWidth / 2, y + h - step * i);
      const right = Position.of(x + w / 2 + currentLineWidth / 2, y + h - step * i);
      this.drawLine(left, right, stroke);
    }
  }

  private drawRelativePack(relativeTrack: Rectangle, pack: Pack) {
    const activePack = pack.activePack;
    if (activePack === undefined) {
      return;
    }

    // Regular pack
    const start = activePack.relativeBack;
    const end = activePack.relativeFront;
    if (Math.abs(start.value - end.value) < 0.5) {
      this.drawRelativePackPart(relativeTrack, start.value, end.value);
      return;
    }

    // Pack is wrapping around 1 -> 0
    this.drawRelativePackPart(relativeTrack, start.value, 1);
    this.drawRelativePackPart(relativeTrack, 0, end.value);
  }

  private drawRelativePackPart(relativeTrack: Rectangle, start: number, end: number) {
    const rect = Rectangle.of(
      Position.of(relativeTrack.x, relativeTrack.y + relativeTrack.height * (1 - end)),
      relativeTrack.width,
      relativeTrack.height * (end - start));
    this.drawRect(rect.position, rect.width, rect.height, Fill.of(GameConstants.PACK_COLOR));
  }

  private drawRelativeTrackLine(percentage: number, rect: Rectangle) {
    const x1 = rect.x * (1 - percentage) + (rect.x + rect.width) * percentage;
    this.drawLine(Position.of(x1, rect.y), Position.of(x1, rect.y + rect.height), Stroke.of(GameConstants.TRACK_LANE_COLOR, 1));
  }

  private drawRelativePlayer(relativeTrack: Rectangle, player: Player, selected: boolean) {
    const {color, strokeColor} = Renderer.getColorsForPlayer(player);
    const relativeCircle = Circle.of(Position.of(relativeTrack.x + relativeTrack.width * player.relativePosition.x, relativeTrack.y + relativeTrack.height * (1 - player.relativePosition.y)), player.radius / 2.5);
    this.drawCircle(relativeCircle, Fill.of(color), Stroke.of(strokeColor, GameConstants.PLAYER_OUTLINE_WIDTH));
  }

  private drawTrack(track: Track) {
    // Track
    this.drawTrackLine(track.outerTrackLine, GameConstants.INBOUNDS_FILL);
    this.drawTrackLine(track.innerTrackLine, GameConstants.OUT_OF_BOUNDS_FILL);

    // Lines
    const stroke = Stroke.of(GameConstants.TRACK_STROKE_COLOR, GameConstants.TRACK_LINE_OUTLINE_WIDTH);
    this.drawLine(track.jammerLine.p1, track.jammerLine.p2, stroke);
    this.drawLine(track.pivotLine.p1, track.pivotLine.p2, stroke);
    track.tenFeetLines.forEach(line => this.drawLine(line.p1, line.p2, stroke));

    // Center lines
    this.drawTrackLine(track.innerTrackLine, undefined, stroke, GameConstants.DEBUG_TRACK_LINES);
    this.drawTrackLine(track.outerTrackLine, undefined, stroke, GameConstants.DEBUG_TRACK_LINES);

    // Debug info
    if (GameConstants.DEBUG_BOUNDS) {
      const debugStroke = Stroke.of(GameConstants.TRACK_DEBUG_COLOR, 1);
      this.drawTrackLine(track.innerBounds, undefined, debugStroke, GameConstants.DEBUG_TRACK_LINES);
      this.drawTrackLine(track.trackLineAt(0.5), undefined, debugStroke, GameConstants.DEBUG_TRACK_LINES);
      this.drawTrackLine(track.outerBounds, undefined, debugStroke, GameConstants.DEBUG_TRACK_LINES);
      this.drawTrackLine(track.packLine, undefined, Stroke.of("red", 1, true), GameConstants.DEBUG_TRACK_LINES);

      const laneOutline = Stroke.of(GameConstants.TRACK_LANE_COLOR, 1);
      for (let i = 1; i < 4; i++) {
        this.drawTrackLine(track.lane(i), undefined, laneOutline);
      }
    }
  }

  private drawPack(track: Track, pack: Pack) {
    const activePack = pack.activePack;
    if (activePack === undefined) {
      return;
    }

    const shapes = track.getPackShapes(activePack);
    for (let shape of shapes) {
      if (shape instanceof Arc) {
        const arc = shape as Arc;
        this.drawArc(arc, GameConstants.PACK_FILL, undefined, false);
      } else if (shape instanceof Triangle) {
        const triangle = shape as Triangle;
        this.drawTriangle(triangle.p1, triangle.p2, triangle.p3, GameConstants.PACK_FILL);
      }
    }
    this.drawTrackLine(track.innerTrackLine, GameConstants.OUT_OF_BOUNDS_FILL);
    for (let shape of shapes) {
      if (shape instanceof Quad) {
        const quad = shape as Quad;
        this.drawQuad(quad.p1, quad.p2, quad.p3, quad.p4, GameConstants.PACK_FILL);
      } else if (shape instanceof Line) {
        const line = shape as Line;
        this.drawLine(line.p1, line.p2, GameConstants.PACK_FILL.toStroke());
        this.drawPoint(line.p1, GameConstants.PACK_POINT_FILL);
        this.drawPoint(line.p2, GameConstants.PACK_POINT_FILL);
      }
    }
  }

  private drawTrackLine(trackLine: TrackLine, fill?: Fill, stroke?: Stroke, showPercentages: boolean = false) {
    if (fill) {
      this.drawQuad(trackLine.bottomLine.p1, trackLine.bottomLine.p2, trackLine.topLine.p1, trackLine.topLine.p2, fill);
      this.drawCircle(trackLine.leftCircle, fill);
      this.drawCircle(trackLine.rightCircle, fill);
    }

    if (stroke) {
      this.drawLine(trackLine.topLine.p1, trackLine.topLine.p2, stroke);
      this.drawLine(trackLine.bottomLine.p1, trackLine.bottomLine.p2, stroke);
      this.drawArc(trackLine.leftArc, undefined, stroke);
      this.drawArc(trackLine.rightArc, undefined, stroke);

      if (showPercentages) {
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.1), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.2), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.3), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.4), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.5), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.6), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.7), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.8), 0.1), GameConstants.DEBUG_POINT_FILL);
        this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.9), 0.1), GameConstants.DEBUG_POINT_FILL);
      }
    }
  }

  private drawPlayer(player: Player, selected: boolean) {
    const position = player.position;
    const targetVelocity = Velocity.of(Speed.ofKph(10), player.targetVelocity.angle);
    const velocity = Velocity.of(Speed.ofKph(10), player.velocity.angle);
    const {color, strokeColor} = Renderer.getColorsForPlayer(player);
    this.drawCircle(player.toCircle(), Fill.of(color), Stroke.of(strokeColor, 1));
    this.drawLine(position, Position.of(position.x + (targetVelocity.x * 10), position.y + (targetVelocity.y * 10)), Stroke.of('black', 1));
    this.drawLine(position, Position.of(position.x + (velocity.x * 10), position.y + (velocity.y * 10)), Stroke.of('black', 1));
    this.drawText(position.plus(Position.of(0, 0.8)), '' + position.x.toFixed(2) + ', ' + position.y.toFixed(2), Stroke.of('black', 1));
    this.drawText(position.plus(Position.of(0, 1.2)), '' + player.relativePosition.x.toFixed(2) + ', ' + player.relativePosition.y.toFixed(2), Stroke.of('black', 1));
  }

  private drawText(position: Position, text: string, stroke: Stroke) {
    this.ctx.beginPath();
    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = stroke.color;
    this.ctx.fillText(text, position.x * this.scale, position.y * this.scale);
    this.ctx.closePath();
  }

  private drawArc(arc: Arc, fill?: Fill, stroke?: Stroke, fillTriangle: boolean = true) {
    const { position, radius, startAngle, endAngle } = arc;
    this.ctx.beginPath();
    this.ctx.arc(position.x * this.scale, position.y * this.scale, radius * this.scale, startAngle.radians, endAngle.radians);
    this.fill(fill);
    this.stroke(stroke);
    this.ctx.closePath();

    if (fill && fillTriangle) {
      this.drawTriangle(position, arc.getPointAtAngle(startAngle), arc.getPointAtAngle(endAngle), fill);
    }
  }

  private drawPoint(position: Position, fill?: Fill, stroke?: Stroke) {
    this.drawCircle(Circle.of(position, 0.08), fill, stroke);
  }

  private drawCircle(circle: Circle, fill?: Fill, stroke?: Stroke) {
    const pos = circle.position;
    const radius = circle.radius;
    this.ctx.beginPath();
    this.ctx.arc(pos.x * this.scale, pos.y * this.scale, radius * this.scale, 0, Math.PI * 2);
    this.fill(fill);
    this.stroke(stroke);
    this.ctx.closePath();
  }

  private drawQuad(pos1: Position, pos2: Position, pos3: Position, pos4: Position, fill?: Fill, stroke?: Stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineTo(pos3.x * this.scale, pos3.y * this.scale);
    this.ctx.lineTo(pos4.x * this.scale, pos4.y * this.scale);
    this.ctx.closePath();
    this.fill(fill);
    this.stroke(stroke);
  }

  private drawRect(pos: Position, width: number, height: number, fill?: Fill, stroke?: Stroke) {
    this.ctx.beginPath();
    this.ctx.rect(pos.x * this.scale, pos.y * this.scale, width * this.scale, height * this.scale);
    this.fill(fill);
    this.stroke(stroke);
    this.ctx.closePath();
  }

  private drawLine(pos1: Position, pos2: Position, stroke: Stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.stroke(stroke);
    this.ctx.closePath();
  }

  private drawTriangle(pos1: Position, pos2: Position, pos3: Position, fill?: Fill, stroke?: Stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineTo(pos3.x * this.scale, pos3.y * this.scale);
    this.ctx.closePath();
    this.fill(fill);
    this.stroke(stroke);
  }

  private fill(fill?: Fill) {
if (!fill) {
      return;
    }
    this.ctx.fillStyle = fill.color;
    this.ctx.fill();
  }

  private stroke(stroke?: Stroke) {
    if (!stroke) {
      return;
    }
    this.ctx.lineWidth = stroke.width;
    this.ctx.strokeStyle = stroke.color;
    this.ctx.setLineDash([stroke.dotted ? 5 : 0]);
    this.ctx.stroke();
  }

  //
  // Utility methods
  //

  private static createRelativeTrack(width: number, height: number, scale: number, track: Track): Rectangle {
    const trackRatio = track.trackRatio;
    const h = height / scale - GameConstants.ONE_FOOT * 2;
    const w = h * trackRatio;
    const x = width / scale - w * 2;
    const y = GameConstants.ONE_FOOT;
    return Rectangle.of(Position.of(x, y), w, h);
  }

  private static getColorsForPlayer(player: Player): {color: string, strokeColor: string} {
    const color = player.team === Team.A ? GameConstants.TEAM_A_COLOR : GameConstants.TEAM_B_COLOR;
    const strokeColor = player.team === Team.A ? GameConstants.TEAM_A_STROKE_COLOR : GameConstants.TEAM_B_STROKE_COLOR;
    return {color, strokeColor};
  }
}
