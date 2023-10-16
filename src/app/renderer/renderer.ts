import {Player} from "../model/player";
import {Track} from "../model/track";
import {GameState} from "../model/game-state";
import {GameConstants} from "../game/game-constants";
import {Team} from "../model/team";
import {Stroke} from "./stroke";
import {Vector} from "../model/vector";
import {Arc} from "../model/arc";
import {TrackLine} from "../model/track-line";
import {Circle} from "../model/circle";
import {Pack} from "../model/pack";
import {Rectangle} from "../model/rectangle";
import {Fill} from "./fill";
import {Quad} from "../model/quad";
import {Triangle} from "../model/triangle";
import {Line} from "../model/line";
import {Target} from "../model/target";
import {Speed} from "../model/speed";
import {GameStateService} from "../game/game-state.service";

export class Renderer {

  public static debugPoints: Vector[] = [];
  public static debugText: string[] = [];

  private readonly gameStateService: GameStateService;
  private readonly ctx: CanvasRenderingContext2D;

  private scale: number;
  private width: number;
  private height: number;

  private readonly interval = 1000 / GameConstants.FPS;
  private now: number = Date.now();
  private then: number = Date.now();
  private delta: number = 0;

  constructor(gameStateService: GameStateService, ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.gameStateService = gameStateService;
    this.ctx = ctx;
    this.scale = width / GameConstants.CANVAS_WIDTH_IN_METERS;
    this.width = width;
    this.height = height;
  }

  public setCanvasSize(width: number, height: number): void {
    this.scale = width / GameConstants.CANVAS_WIDTH_IN_METERS;
    this.width = width;
    this.height = height;
  }

  public start(): void {
    requestAnimationFrame(() => this.start());

    this.now = Date.now();
    this.delta = this.now - this.then;
    if (this.delta > this.interval) {
      this.then = this.now - (this.delta % this.interval);

      const state = this.gameStateService.update(state => state.recalculate());
      this.drawScene(state);
    }
  }

  public drawScene(state: GameState): void {
    // Reset
    this.ctx.clearRect(Vector.ORIGIN.x, Vector.ORIGIN.y, this.width, this.height);
    this.drawRect(Vector.ORIGIN, this.width, this.height, GameConstants.OUT_OF_BOUNDS_FILL);

    // Track
    const track = state.track;
    this.drawTrack(track);

    // Pack
    const pack = state.pack;
    this.drawPack(track, pack);

    // Players
    for (let i = 0; i < state.players.length; i++) {
      this.drawPlayer(state.players[i], track, state.playerSelection?.index === i);
    }

    // Relative track
    const relativeTrack = Renderer.createRelativeTrack(this.width, this.height, this.scale, track);
    this.drawRelativeTrack(relativeTrack, 0.2);

    // Relative pack
    this.drawRelativePack(relativeTrack, pack);

    // Relative players
    for (let i = 0; i < state.players.length; i++) {
      const player = state.players[i];
      const relativePosition = player.relativePosition(track);
      if (relativePosition.x >= -1 && relativePosition.x <= 2) {
        this.drawRelativePlayer(relativeTrack, player, relativePosition, state.playerSelection?.index === i);
      }
    }

    // Debug
    Renderer.debugPoints.forEach(p => this.drawCircle(Circle.of(p, 0.1), Fill.of(GameConstants.DEBUG_POINT_COLOR)));
    Renderer.debugText.forEach((text, i) => this.drawText(Vector.of(1, 1.5 + i * 0.47), text, Stroke.of('black', 1)));
  }

  private drawRelativeTrack(relativeTrack: Rectangle, tenFeetLineWidth: number) {
    const {x, y, width: w, height: h} = relativeTrack;
    this.drawRect(Vector.of(this.width / this.scale - w * 3 - GameConstants.ONE_FOOT, 0), w * 3, this.height / this.scale, Fill.of('black'));
    this.drawRect(Vector.of(this.width / this.scale - w * 3, 0), w * 3, this.height / this.scale, GameConstants.OUT_OF_BOUNDS_FILL);
    this.drawRect(Vector.of(x, y), w, h, Fill.of(GameConstants.INBOUNDS_COLOR), Stroke.of(GameConstants.TRACK_STROKE_COLOR, 1));
    this.drawRelativeTrackLine(0.25, relativeTrack);
    this.drawRelativeTrackLine(0.50, relativeTrack);
    this.drawRelativeTrackLine(0.75, relativeTrack);

    const stroke = Stroke.of(GameConstants.TRACK_STROKE_COLOR, GameConstants.TRACK_LINE_OUTLINE_WIDTH)
    const step = h / GameConstants.TEN_FEET_LINE_COUNT;
    for (let i = 1; i < GameConstants.TEN_FEET_LINE_COUNT; i++) {

      const currentLineWidth = i == 3 ? w : tenFeetLineWidth;
      const left = Vector.of(x + w / 2 - currentLineWidth / 2, y + h - step * i);
      const right = Vector.of(x + w / 2 + currentLineWidth / 2, y + h - step * i);
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
      Vector.of(relativeTrack.x, relativeTrack.y + relativeTrack.height * (1 - end)),
      relativeTrack.width,
      relativeTrack.height * (end - start));
    this.drawRect(rect.position, rect.width, rect.height, Fill.of(GameConstants.PACK_COLOR));
  }

  private drawRelativeTrackLine(percentage: number, rect: Rectangle) {
    const x1 = rect.x * (1 - percentage) + (rect.x + rect.width) * percentage;
    this.drawLine(Vector.of(x1, rect.y), Vector.of(x1, rect.y + rect.height), Stroke.of(GameConstants.TRACK_LANE_COLOR, 1));
  }

  private drawRelativePlayer(relativeTrack: Rectangle, player: Player, relativePosition: Vector, selected: boolean) {
    const {color, strokeColor} = Renderer.getColorForTarget(player.team, selected, false);
    const relativeCircle = Circle.of(Vector.of(relativeTrack.x + relativeTrack.width * relativePosition.x, relativeTrack.y + relativeTrack.height * (1 - relativePosition.y)), player.radius / 2.5);
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
      this.drawTrackLine(track.packLine, undefined, Stroke.of("#ff000055", 1), GameConstants.DEBUG_TRACK_LINES);

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

  private drawPlayer(player: Player, track: Track, selected: boolean) {
    const position = player.position;

    // Draw target lines (on select)
    const showTargets = selected;
    const strokeColor = player.team === Team.A ? GameConstants.TEAM_A_STROKE_COLOR : GameConstants.TEAM_B_STROKE_COLOR;
    const lineStroke = Stroke.of(strokeColor, 0.5, true);
    for (let i = 0; showTargets && i < player.targets.length; i++) {
      const a = i === 0 ? player.current : player.targets[i - 1];
      const b = player.targets[i];
      this.drawLine(a.position, b.position, lineStroke);
    }

    // Draw target circles (on select)
    for (let i = 0; showTargets && i < player.targets.length; i++) {
      this.drawTarget(player.radius, player.targets[i], player.team, selected, true);
    }

    // Draw player circle
    this.drawTarget(player.radius, player.current, player.team, selected, false);

    // Draw angle
    const direction = player.current.velocity.withKph(Speed.ofKph(100));
    this.drawLine(position, position.plus(direction.vector), Stroke.of('black', 1));

    // Draw debug coordinates
    this.drawText(position.plus(Vector.of(0, 0.8)), '' + position.x.toFixed(2) + ', ' + position.y.toFixed(2), lineStroke);
    this.drawText(position.plus(Vector.of(0, 1.2)), '' + player.velocity.angle.degrees.toFixed(2) + ', ' + player.velocity.speed.kph.toFixed(2), lineStroke);
  }

  private drawTarget(radius: number, target: Target, team: Team, selected: boolean, isTarget: boolean) {
    const {color, strokeColor} = Renderer.getColorForTarget(team, selected, isTarget);
    const playerFill = Fill.of(color);
    const playerStroke = Stroke.of(strokeColor, selected && !isTarget ? 2 : 1);

    // Circle
    const position = target.position;
    const finalRadius = isTarget ? radius / 2.5 : radius;
    this.drawCircle(Circle.of(position, finalRadius), playerFill, playerStroke);

    // Direction indicator
    const velocity = target.velocity;
    this.drawLine(position, Vector.of(position.x + (velocity.x * 10), position.y + (velocity.y * 10)), Stroke.of('black', 1));
  }

  private drawText(position: Vector, text: string, stroke: Stroke) {
    this.ctx.beginPath();
    this.ctx.font = "16px Arial";
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

  private drawPoint(position: Vector, fill?: Fill, stroke?: Stroke) {
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

  private drawQuad(pos1: Vector, pos2: Vector, pos3: Vector, pos4: Vector, fill?: Fill, stroke?: Stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineTo(pos3.x * this.scale, pos3.y * this.scale);
    this.ctx.lineTo(pos4.x * this.scale, pos4.y * this.scale);
    this.ctx.closePath();
    this.fill(fill);
    this.stroke(stroke);
  }

  private drawRect(pos: Vector, width: number, height: number, fill?: Fill, stroke?: Stroke) {
    this.ctx.beginPath();
    this.ctx.rect(pos.x * this.scale, pos.y * this.scale, width * this.scale, height * this.scale);
    this.fill(fill);
    this.stroke(stroke);
    this.ctx.closePath();
  }

  private drawLine(pos1: Vector, pos2: Vector, stroke: Stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.stroke(stroke);
    this.ctx.closePath();
  }

  private drawTriangle(pos1: Vector, pos2: Vector, pos3: Vector, fill?: Fill, stroke?: Stroke) {
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
    return Rectangle.of(Vector.of(x, y), w, h);
  }

  private static getColorForTarget(team: Team, selected: boolean, isTarget: boolean): {color: string, strokeColor: string} {
    if (team === Team.A && selected && !isTarget) {
      return {color: GameConstants.TEAM_A_SELECTED_COLOR, strokeColor: GameConstants.TEAM_A_SELECTED_STROKE_COLOR};
    } else if (team === Team.B && selected && !isTarget) {
      return {color: GameConstants.TEAM_B_SELECTED_COLOR, strokeColor: GameConstants.TEAM_B_SELECTED_STROKE_COLOR};
    } else if (team === Team.A && !isTarget) {
      return {color: GameConstants.TEAM_A_COLOR, strokeColor: GameConstants.TEAM_A_STROKE_COLOR};
    } else if (team === Team.B && !isTarget) {
      return {color: GameConstants.TEAM_B_COLOR, strokeColor: GameConstants.TEAM_B_STROKE_COLOR};
    } else if (team === Team.A && isTarget) {
      return {color: GameConstants.TEAM_A_TARGET_COLOR, strokeColor: GameConstants.TEAM_A_STROKE_COLOR};
    } else {
      return {color: GameConstants.TEAM_B_TARGET_COLOR, strokeColor: GameConstants.TEAM_B_STROKE_COLOR};
    }
  }
 }
