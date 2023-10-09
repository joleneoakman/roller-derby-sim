import {Player} from "../model/player";
import {Track} from "../model/track";
import {GameState} from "../model/game-state";
import {Velocity} from "../model/velocity";
import {GameConstants} from "../game/game-constants";
import {Team} from "../model/team";
import {Outline} from "../model/outline";
import {Position} from "../model/position";
import {Arc} from "../model/arc";
import {TrackLine} from "../model/track-line";
import {Circle} from "../model/circle";
import {Speed} from "../model/speed";
import {Pack} from "../model/pack";
import {Line} from "../model/line";
import {Rectangle} from "../model/rectangle";

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
    this.drawRect(GameConstants.ORIGIN, this.width, this.height, GameConstants.OUT_OF_BOUNDS_COLOR);

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
    Renderer.debugPoints.forEach(p => this.drawCircle(Circle.of(p, 0.1), 'red'));
  }

  private drawRelativeTrack(relativeTrack: Rectangle, tenFeetLineWidth: number) {
    const {x, y, width: w, height: h} = relativeTrack;
    this.drawRect(Position.of(this.width / this.scale - w * 3 - GameConstants.ONE_FOOT, 0), w * 3, this.height / this.scale, 'black');
    this.drawRect(Position.of(this.width / this.scale - w * 3, 0), w * 3, this.height / this.scale, GameConstants.OUT_OF_BOUNDS_COLOR);
    this.drawRect(Position.of(x, y), w, h, GameConstants.INBOUNDS_COLOR, Outline.of(GameConstants.TRACK_STROKE_COLOR, 1));
    this.drawRelativeTrackLine(0.25, relativeTrack);
    this.drawRelativeTrackLine(0.50, relativeTrack);
    this.drawRelativeTrackLine(0.75, relativeTrack);

    const outline = Outline.of(GameConstants.TRACK_STROKE_COLOR, GameConstants.TRACK_LINE_OUTLINE_WIDTH)
    const step = h / GameConstants.TEN_FEET_LINE_COUNT;
    for (let i = 1; i < GameConstants.TEN_FEET_LINE_COUNT; i++) {

      const currentLineWidth = i == 3 ? w : tenFeetLineWidth;
      const left = Position.of(x + w / 2 - currentLineWidth / 2, y + h - step * i);
      const right = Position.of(x + w / 2 + currentLineWidth / 2, y + h - step * i);
      this.drawLine(left, right, outline);
    }
  }

  private drawRelativePack(relativeTrack: Rectangle, pack: Pack) {
    const activePack = pack.activePack;
    if (activePack === undefined) {
      return;
    }

    const start = activePack.relativeStart;
    const end = activePack.relativeEnd;
    const rect = Rectangle.of(
      Position.of(relativeTrack.x, relativeTrack.y + relativeTrack.height * (1 - end)),
      relativeTrack.width,
      relativeTrack.height * (end - start));
    this.drawRect(rect.position, rect.width, rect.height, GameConstants.PACK_COLOR);
  }

  private drawRelativeTrackLine(percentage: number, rect: Rectangle) {
    const x1 = rect.x * (1 - percentage) + (rect.x + rect.width) * percentage;
    this.drawLine(Position.of(x1, rect.y), Position.of(x1, rect.y + rect.height), Outline.of(GameConstants.TRACK_LANE_COLOR, 1));
  }

  private drawRelativePlayer(relativeTrack: Rectangle, player: Player, selected: boolean) {
    const {color, strokeColor} = Renderer.getColorsForPlayer(player);
    const relativeCircle = Circle.of(Position.of(relativeTrack.x + relativeTrack.width * player.relativePosition.x, relativeTrack.y + relativeTrack.height * (1 - player.relativePosition.y)), player.radius / 2.5);
    this.drawCircle(relativeCircle, color, Outline.of(strokeColor, GameConstants.PLAYER_OUTLINE_WIDTH));
  }

  private drawTrack(track: Track) {
    // Track
    this.drawTrackLine(track.trackLineAt(1), GameConstants.INBOUNDS_COLOR);
    this.drawTrackLine(track.trackLineAt(0), GameConstants.OUT_OF_BOUNDS_COLOR);

    // Lines
    const outline = Outline.of(GameConstants.TRACK_STROKE_COLOR, GameConstants.TRACK_LINE_OUTLINE_WIDTH);
    this.drawLine(track.jammerLine.p1, track.jammerLine.p2, outline);
    this.drawLine(track.pivotLine.p1, track.pivotLine.p2, outline);
    track.tenFeetLines.forEach(line => this.drawLine(line.p1, line.p2, outline));

    // Center lines
    this.drawTrackLineOutline(track.trackLineAt(0), outline, GameConstants.DEBUG_TRACK_LINES);
    this.drawTrackLineOutline(track.trackLineAt(1), outline, GameConstants.DEBUG_TRACK_LINES);

    // Debug info
    if (GameConstants.DEBUG_BOUNDS) {
      const debugOutline = Outline.of(GameConstants.TRACK_DEBUG_COLOR, 1);
      this.drawTrackLineOutline(track.innerBounds, debugOutline, GameConstants.DEBUG_TRACK_LINES);
      this.drawTrackLineOutline(track.trackLineAt(0.5), debugOutline, GameConstants.DEBUG_TRACK_LINES);
      this.drawTrackLineOutline(track.outerBounds, debugOutline, GameConstants.DEBUG_TRACK_LINES);

      const laneOutline = Outline.of(GameConstants.TRACK_LANE_COLOR, 1);
      for (let i = 1; i < 4; i++) {
        this.drawTrackLineOutline(track.lane(i), laneOutline);
      }
    }
  }

  private drawPack(track: Track, pack: Pack) {
    const activePack = pack.activePack;
    if (activePack === undefined) {
      return;
    }

    const packLine = track.packLine;
    const startOnPackLine = packLine.pointAtDistance(activePack.start);
    const endOnPackLine = packLine.pointAtDistance(activePack.end);
    const engZoneStartOnPackLine = packLine.pointAtDistance(activePack.start - GameConstants.TWENTY_FEET);
    const engZoneEndOnPackLine = packLine.pointAtDistance(activePack.end + GameConstants.TWENTY_FEET);
    const start = track.innerTrackLine.getClosestPointTo(startOnPackLine);
    const end = track.innerTrackLine.getClosestPointTo(endOnPackLine);
    const engZoneStart = track.innerTrackLine.getClosestPointTo(engZoneStartOnPackLine);
    const engZoneEnd = track.innerTrackLine.getClosestPointTo(engZoneEndOnPackLine);
    this.drawCircle(Circle.of(start, 0.1), 'yellow', Outline.of('orange', 0.5));
    this.drawCircle(Circle.of(end, 0.1), 'yellow', Outline.of('orange', 0.5));
    this.drawCircle(Circle.of(engZoneStart, 0.1), 'yellow', Outline.of('orange', 0.5));
    this.drawCircle(Circle.of(engZoneEnd, 0.1), 'yellow', Outline.of('orange', 0.5));
  }

  private drawTrackLine(trackLine: TrackLine, color: string) {
    this.drawQuad(trackLine.bottomLine.p1, trackLine.bottomLine.p2, trackLine.topLine.p1, trackLine.topLine.p2, color);
    this.drawCircle(trackLine.leftCircle, color);
    this.drawCircle(trackLine.rightCircle, color);
  }

  private drawTrackLineOutline(trackLine: TrackLine, outline: Outline, showPercentages?: boolean) {
    this.drawLine(trackLine.topLine.p1, trackLine.topLine.p2, outline);
    this.drawLine(trackLine.bottomLine.p1, trackLine.bottomLine.p2, outline);
    this.drawArc(trackLine.leftArc, outline);
    this.drawArc(trackLine.rightArc, outline);

    if (showPercentages) {
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.1), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.2), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.3), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.4), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.5), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.6), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.7), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.8), 0.1), 'red');
      this.drawCircle(Circle.of(trackLine.getAbsolutePositionOf(0.9), 0.1), 'red');
    }
  }

  private drawPlayer(player: Player, selected: boolean) {
    const position = player.position;
    const targetVelocity = Velocity.of(Speed.ofKph(10), player.targetVelocity.angle);
    const velocity = Velocity.of(Speed.ofKph(10), player.velocity.angle);
    const {color, strokeColor} = Renderer.getColorsForPlayer(player);
    this.drawCircle(player.toCircle(), color, Outline.of(strokeColor, 1));
    this.drawLine(position, Position.of(position.x + (targetVelocity.x * 10), position.y + (targetVelocity.y * 10)), Outline.of('black', 1));
    this.drawLine(position, Position.of(position.x + (velocity.x * 10), position.y + (velocity.y * 10)), Outline.of('black', 1));
  }

  private drawArc(arc: Arc, outline: Outline) {
    const { position, radius, startAngle, endAngle } = arc;
    this.ctx.beginPath();
    this.ctx.arc(position.x * this.scale, position.y * this.scale, radius * this.scale, startAngle.radians, endAngle.radians);
    this.stroke(outline);
    this.ctx.closePath();
  }

  private drawCircle(circle: Circle, color: string, outline?: Outline) {
    const pos = circle.position;
    const radius = circle.radius;
    this.ctx.beginPath();
    this.ctx.arc(pos.x * this.scale, pos.y * this.scale, radius * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.stroke(outline);
    this.ctx.closePath();
  }

  private drawQuad(pos1: Position, pos2: Position, pos3: Position, pos4: Position, color: string, outline?: Outline) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineTo(pos3.x * this.scale, pos3.y * this.scale);
    this.ctx.lineTo(pos4.x * this.scale, pos4.y * this.scale);
    this.ctx.closePath();
    this.stroke(outline);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  private drawRect(pos: Position, width: number, height: number, color: string, outline?: Outline) {
    this.ctx.beginPath();
    this.ctx.rect(pos.x * this.scale, pos.y * this.scale, width * this.scale, height * this.scale);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.stroke(outline);
    this.ctx.closePath();
  }

  private drawLine(pos1: Position, pos2: Position, outline: Outline) {
    this.ctx.beginPath();
    this.ctx.moveTo(pos1.x * this.scale, pos1.y * this.scale);
    this.ctx.lineTo(pos2.x * this.scale, pos2.y * this.scale);
    this.ctx.lineWidth = outline.width;
    this.ctx.strokeStyle = outline.color;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  private drawTriangle(pos1: Position, pos2: Position, pos3: Position, color: string, outline?: Outline) {
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
