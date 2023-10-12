import {OverFlowTest} from "./overflow-test";

export class Testing {

  private static readonly TEST_CLASSES: any[] = [
    OverFlowTest
  ]

  public static runAll() {
    for (const testClass of Testing.TEST_CLASSES) {
      for (const methodName of Object.getOwnPropertyNames(testClass)) {
        if (methodName.startsWith("test")) {
          testClass[methodName]();
        }
      }
    }
  }

  public static assertTrue(value: boolean) {
    if (!value) {
      throw new Error("Assertion failed");
    }
  }

  public static assertFalse(value: boolean) {
    if (value) {
      throw new Error("Assertion failed");
    }
  }

  public static assertEquals(expected: any, actual: any) {
    if (expected !== actual) {
      throw new Error("Assertion failed: expected: " + expected + ", actual: " + actual);
    }
  }
}