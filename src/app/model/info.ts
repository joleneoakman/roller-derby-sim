export class Info {
  public readonly title: string;
  public readonly value: string;

  constructor(title: string, value: string) {
    this.title = title;
    this.value = value;
  }

  public static of(title: string, value: string): Info {
    return new Info(title, value);
  }
}