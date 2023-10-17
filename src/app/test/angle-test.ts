import {Testing} from "./testing";
import {Angle} from "../model/geometry/angle";
import {Vector} from "../model/geometry/vector";

export class AngleTest {

  public static testAngleOfVector() {
    // Clockwise angles, starting at 3 o'clock
    Testing.assertEquals(0, Angle.ofVector(Vector.of(1, 0)).degrees);
    Testing.assertEquals(45, Angle.ofVector(Vector.of(1, 1)).degrees);
    Testing.assertEquals(90, Angle.ofVector(Vector.of(0, 1)).degrees);
  }

  public static testAngleBetween() {
    Testing.assertEquals(270, Angle.ofVectors(Vector.of(1, 0), Vector.of(0, 0), Vector.of(0, 1)).degrees);
    Testing.assertEquals(90, Angle.ofVectors(Vector.of(0, 1), Vector.of(0, 0), Vector.of(1, 0)).degrees);

    Testing.assertEquals(270, Angle.ofVectors(Vector.of(2, 1), Vector.of(1, 1), Vector.of(1, 2)).degrees);
    Testing.assertEquals(90, Angle.ofVectors(Vector.of(1, 2), Vector.of(1, 1), Vector.of(2, 1)).degrees);
  }

  public testAngleDiff() {

  }
}