export class Pair<A, B> {
  readonly a: A;
  readonly b: B;

  private constructor(a: A, b: B) {
    this.a = a;
    this.b = b;
  }

  public static of<A, B>(a: A, b: B): Pair<A, B> {
    return new Pair(a, b);
  }
}
