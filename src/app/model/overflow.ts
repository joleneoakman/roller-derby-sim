/**
 * Represents a value that is overflows around a max value.
 */
export class Overflow {
  readonly value: number;
  readonly max: number;

  private constructor(value: number, max: number) {
    if (isNaN(value) || isNaN(max)) {
      throw new Error("Invalid overflow value: " + value + ", max: " + max);
    }
    this.value = value;
    this.max = max;
  }

  public static of(value: number, max: number = 1): Overflow {
    if (value < 0 || value > max) {
      value = (value + max) % max;
    }
    return new Overflow(value, max);
  }

  public static ofRearMost(start: number, end: number, max: number): Overflow {
    const startO = Overflow.of(start, max);
    const endO = Overflow.of(end, max);
    return !startO.isInFrontOf(endO) ? startO : endO;
  }

  public static ofForeMost(start: number, end: number, max: number): Overflow {
    const startO = Overflow.of(start, max);
    const endO = Overflow.of(end, max);
    return startO.isInFrontOf(endO) ? startO : endO;
  }

  public plus(other: Overflow): Overflow {
    return Overflow.of(this.value + other.value, this.max);
  }

  public plusNumber(other: number): Overflow {
    return Overflow.of(this.value + other, this.max);
  }

  public minus(other: Overflow): Overflow {
    return Overflow.of(this.value - other.value, this.max);
  }

  public minusNumber(other: number): Overflow {
    return Overflow.of(this.value - other, this.max);
  }

  /**
   * Returns the shortest distance to the other value, with a max distance of max / 2.
   */
  public distanceTo(other: Overflow): number {
    const diff = Math.abs(this.value - other.value);
    if (diff < this.max / 2) {
      return diff;
    }
    return this.max - diff;
  }

  /**
   * Returns true if this value is in front of the other value.
   */
  public isInFrontOf(other: Overflow): boolean {
    // 0.1 : 0.9 => true
    // 0.9 : 0.1 => false
    // 0.1 : 0.2 => false
    // 0.2 : 0.1 => true

    const diff = this.value - other.value;
    if (Math.abs(diff) < this.max / 2) {
      return diff > 0;
    }
    return diff <= 0;
  }

  public isBehind(other: Overflow): boolean {
    return !this.isInFrontOf(other);
  }

  /**
   * Compares the values by ordering
   */
  compareInFrontOf(other: Overflow): number {
    if (this.value === other.value) {
      return 0;
    } else if (this.isInFrontOf(other)) {
      return 1;
    }
    return -1;
  }
}