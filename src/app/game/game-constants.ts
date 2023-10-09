import {Position} from "../model/position";

export class GameConstants {

  //
  // Debug
  //
  public static readonly DEBUG_BOUNDS = true;
  public static readonly DEBUG_TRACK_LINES = false;

  //
  // Rendering
  //
  public static readonly FPS = 60;
  public static readonly ORIGIN = Position.of(0, 0);

  //
  // Physics
  //
  public static readonly MAX_SPEED_KPH = 20;
  public static readonly ZERO_TO_MAX_IN_SECONDS = 10;
  public static readonly MAX_TO_ZERO_IN_SECONDS = 3;
  public static readonly COLLISION_COEFFICIENT = 1; // 0 - 1
  public static readonly MAX_TURN_PER_FRAME = 0.5;

  public static readonly ACCELERATION_STEP = GameConstants.MAX_SPEED_KPH / (GameConstants.ZERO_TO_MAX_IN_SECONDS * GameConstants.FPS);
  public static readonly DECELERATION_STEP = GameConstants.MAX_SPEED_KPH / (GameConstants.MAX_TO_ZERO_IN_SECONDS * GameConstants.FPS);

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
  public static readonly PACK_LINE_PERCENTAGE = 0.35918181311; // Pack is calculated at this track line

  //
  // Styling
  //
  public static readonly OUT_OF_BOUNDS_COLOR = '#e3aee1';
  public static readonly INBOUNDS_COLOR = '#bafefc';
  public static readonly TRACK_STROKE_COLOR = 'blue';
  public static readonly TRACK_DEBUG_COLOR = '#0000ff1f';
  public static readonly TRACK_LANE_COLOR = '#0000ff2f';

  public static readonly TEAM_A_COLOR = 'red';
  public static readonly TEAM_A_STROKE_COLOR = 'black';
  public static readonly TEAM_A_SELECTED_COLOR = 'orange';
  public static readonly TEAM_B_COLOR = 'blue';
  public static readonly TEAM_B_STROKE_COLOR = 'black';
  public static readonly TEAM_B_SELECTED_COLOR = 'lightblue';
}
