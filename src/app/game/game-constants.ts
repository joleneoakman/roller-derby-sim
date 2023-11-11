import {Fill} from "../renderer/fill";
import {Stroke} from "../renderer/stroke";
import {ColorTools} from "../util/color-tools";

export class GameConstants {

  //
  // Debug
  //
  public static readonly DEBUG_BOUNDS = true;
  public static readonly DEBUG_TRACK_LINES = false;
  public static readonly PLAY = true;
  public static readonly DEBUG_COORDINATES = false;

  //
  // Rendering
  //
  public static readonly FPS = 120;

  //
  // Physics
  //

  // Reaction time
  public static readonly REACTION_TIME_MS = 1000;

  // Speed
  public static readonly MAX_SPEED_KPH = 30;
  public static readonly ZERO_TO_MAX_IN_SECONDS = 4;
  public static readonly MAX_TO_ZERO_IN_SECONDS = 1.3;
  public static readonly ACCELERATION_STEP = GameConstants.MAX_SPEED_KPH / (GameConstants.ZERO_TO_MAX_IN_SECONDS * GameConstants.FPS);
  public static readonly DECELERATION_STEP = GameConstants.MAX_SPEED_KPH / (GameConstants.MAX_TO_ZERO_IN_SECONDS * GameConstants.FPS);

  // Turning
  public static readonly SECONDS_TO_TURN_180_DEGREES_AT_MIN = 0.2;
  public static readonly SECONDS_TO_TURN_180_DEGREES_AT_MAX = 2;
  public static readonly DEGREES_TURN_PER_SECONDS_AT_MIN = 180 / GameConstants.SECONDS_TO_TURN_180_DEGREES_AT_MIN;
  public static readonly DEGREES_TURN_PER_SECONDS_AT_MAX = 180 / GameConstants.SECONDS_TO_TURN_180_DEGREES_AT_MAX;
  public static readonly TURN_PER_FRAME_AT_MIN = GameConstants.DEGREES_TURN_PER_SECONDS_AT_MIN / GameConstants.FPS;
  public static readonly TURN_PER_FRAME_AT_MAX = GameConstants.DEGREES_TURN_PER_SECONDS_AT_MAX / GameConstants.FPS;

  // Collisions
  public static readonly COLLISION_COEFFICIENT = 1; // 0 - 1

  //
  // Measurements
  //
  public static readonly LANE_COUNT = 4;
  public static readonly PLAYER_RADIUS = 0.4;
  public static readonly CANVAS_WIDTH_IN_METERS = (5.33 + 8.08) * 3;
  public static readonly ONE_FOOT = 0.305;
  public static readonly TEN_FEET = 3.05;
  public static readonly TWENTY_FEET = GameConstants.TEN_FEET * 2;
  public static readonly THIRTY_FEET = GameConstants.TEN_FEET * 3;
  public static readonly TEN_FEET_LINE_COUNT = 18;
  public static readonly PACK_LINE_RADIUS = 5.344422989025845; // Pack is calculated at this track line

  //
  // Gameplay
  //
  public static readonly PERFECT_WARNING_TIME_MS = 1500;
  public static readonly GOOD_WARNING_TIME_MS = 3000;
  public static readonly OK_WARNING_TIME_MS = 10000;
  public static readonly PERFECT_SCORE = 100;
  public static readonly GOOD_SCORE = 50;
  public static readonly OK_SCORE = 25;
  public static readonly MISTAKE_SCORE = -25;

  //
  // Styling
  //

  // Track colors
  public static readonly OUT_OF_BOUNDS_COLOR = '#3f515d';
  public static readonly OUT_OF_BOUNDS_FILL = Fill.of(GameConstants.OUT_OF_BOUNDS_COLOR);

  public static readonly INBOUNDS_COLOR = '#c4baa8';
  public static readonly INBOUNDS_FILL = Fill.of(GameConstants.INBOUNDS_COLOR);

  public static readonly TRACK_STROKE_COLOR = ColorTools.darken(GameConstants.INBOUNDS_COLOR, 0.5);
  public static readonly TRACK_STROKE = Stroke.of(GameConstants.TRACK_STROKE_COLOR, 1);

  public static readonly TRACK_DEBUG_COLOR = ColorTools.darken(GameConstants.INBOUNDS_COLOR, 0.1);
  public static readonly TRACK_DEBUG_STROKE = Stroke.of(GameConstants.TRACK_DEBUG_COLOR, 1);

  public static readonly TRACK_LANE_COLOR = GameConstants.TRACK_DEBUG_COLOR;

  public static readonly PACK_COLOR = ColorTools.darken(GameConstants.INBOUNDS_COLOR, 0.7);
  public static readonly PACK_FILL = Fill.of(GameConstants.PACK_COLOR + '55');

  public static readonly PACK_POINT_COLOR = ColorTools.lighten(GameConstants.INBOUNDS_COLOR, 0.1);
  public static readonly PACK_POINT_FILL = Fill.of(GameConstants.PACK_POINT_COLOR);

  // Player colors
  public static readonly TEAM_A_BASE_COLOR = '#C1495F';
  public static readonly TEAM_B_BASE_COLOR = '#324376';

  public static readonly TEAM_A_SELECTED_STROKE_COLOR = ColorTools.lighten(GameConstants.TEAM_A_BASE_COLOR, 0.2);
  public static readonly TEAM_B_SELECTED_STROKE_COLOR = ColorTools.lighten(GameConstants.TEAM_B_BASE_COLOR, 0.2);
  public static readonly TEAM_A_COLOR = GameConstants.TEAM_A_BASE_COLOR;
  public static readonly TEAM_A_STROKE_COLOR = ColorTools.darken(GameConstants.TEAM_A_BASE_COLOR, 0.5);
  public static readonly TEAM_A_OUT_OF_PLAY_COLOR = ColorTools.average(GameConstants.TEAM_A_BASE_COLOR, '#cccccc', 0.8);
  public static readonly TEAM_A_SELECTED_COLOR = ColorTools.average(GameConstants.TEAM_A_BASE_COLOR, '#ffffff', 0.5);
  public static readonly TEAM_A_TARGET_COLOR = GameConstants.TEAM_A_BASE_COLOR + '99';
  public static readonly TEAM_B_COLOR = GameConstants.TEAM_B_BASE_COLOR;
  public static readonly TEAM_B_STROKE_COLOR = ColorTools.darken(GameConstants.TEAM_B_BASE_COLOR, 0.5);
  public static readonly TEAM_B_OUT_OF_PLAY_COLOR = ColorTools.average(GameConstants.TEAM_B_BASE_COLOR, '#cccccc', 0.8);
  public static readonly TEAM_B_SELECTED_COLOR = ColorTools.average(GameConstants.TEAM_B_BASE_COLOR, '#ffffff', 0.5);
  public static readonly TEAM_B_TARGET_COLOR = GameConstants.TEAM_A_BASE_COLOR + '99';

  public static readonly PLAYER_SYMBOL_COLOR = '#fff';
  public static readonly PLAYER_SYMBOL_FILL = Fill.of(GameConstants.PLAYER_SYMBOL_COLOR);

  // Text colors
  public static readonly TEXT_COLOR = '#000';
  public static readonly TEXT_STROKE = Stroke.of(GameConstants.TEXT_COLOR, 1);

  // Debug colors
  public static readonly DEBUG_POINT_COLOR = ColorTools.average(GameConstants.TEAM_A_BASE_COLOR, '#ff0000', 0.4);
  public static readonly DEBUG_POINT_FILL = Fill.of(GameConstants.DEBUG_POINT_COLOR);

  // Widths
  public static readonly PLAYER_OUTLINE_WIDTH = 1;
  public static readonly TARGET_OUTLINE_WIDTH = 0.5;
  public static readonly TRACK_LINE_OUTLINE_WIDTH = 1;

}
