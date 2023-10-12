import {Overflow} from "../model/overflow";
import {Testing} from "./testing";

export class OverFlowTest {

  public static testDistanceTo() {
    Testing.assertEquals(2, Overflow.of(1, 10).distanceTo(Overflow.of(9, 10)));
    Testing.assertEquals(2, Overflow.of(9, 10).distanceTo(Overflow.of(1, 10)));
    Testing.assertEquals(1, Overflow.of(2, 10).distanceTo(Overflow.of(1, 10)));
    Testing.assertEquals(1, Overflow.of(1, 10).distanceTo(Overflow.of(2, 10)));
  }

  public static testInFrontOf() {
    Testing.assertTrue(Overflow.of(0.1, 1).isInFrontOf(Overflow.of(0.9, 1)));
    Testing.assertFalse(Overflow.of(0.9, 1).isInFrontOf(Overflow.of(0.1, 1)));
    Testing.assertTrue(Overflow.of(0.2, 1).isInFrontOf(Overflow.of(0.1, 1)));
    Testing.assertFalse(Overflow.of(0.1, 1).isInFrontOf(Overflow.of(0.2, 1)));
  }
}