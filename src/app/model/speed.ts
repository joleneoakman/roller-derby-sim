import {GameConstants} from "../game/game-constants";
import {Vector} from "./vector";

export class Speed {

  public static readonly ZERO: Speed = Speed.ofKph(0);

  kph: number; // Kilometers per hour (0 <= kph <= ∞)
  mpf: number; // Meters per frame

  constructor(kph: number) {
    if (isNaN(kph)) {
      throw Error("Speed is NaN");
    }
    this.kph = Math.max(0, kph);
    this.mpf = Speed.toMetersPerFrame(this.kph);
  }

  public static ofKph(kph: number): Speed {
    return new Speed(kph);
  }

  public static ofVector(point: Vector): Speed {
    // Calculate the speed in meters per frame
    const speedMpf = point.distance;

    // Convert it to meters per second and then to kilometers per hour
    const speedMps = speedMpf * GameConstants.FPS;
    const speedKph = (speedMps * 3600) / 1000;
    return Speed.ofKph(speedKph);
  }

  public static toMetersPerFrame(kph: number): number {
    const metersPerHour = kph * 1000;
    const metersPerSecond = metersPerHour / 3600
    return metersPerSecond / GameConstants.FPS;
  }

  public plus(speed: Speed): Speed {
    return Speed.ofKph(this.kph + speed.kph);
  }

  public minus(speed: Speed): Speed {
    return Speed.ofKph(this.kph - speed.kph);
  }

  public isMoving(): boolean {
    return this.kph > 0;
  }
}
