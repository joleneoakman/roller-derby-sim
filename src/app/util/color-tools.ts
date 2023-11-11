export class ColorTools {

  public static darken(hexColor: string, darkenFactor: number): string {
    this.assertColor(hexColor);

    // Convert the hex color to RGB
    let r = parseInt(hexColor.substring(1, 3), 16);
    let g = parseInt(hexColor.substring(3, 5), 16);
    let b = parseInt(hexColor.substring(5, 7), 16);

    // Darken the RGB values
    r = Math.max(0, Math.floor(r * (1 - darkenFactor)));
    g = Math.max(0, Math.floor(g * (1 - darkenFactor)));
    b = Math.max(0, Math.floor(b * (1 - darkenFactor)));

    // Convert back to hex and return
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public static lighten(hexColor: string, lightenFactor: number): string {
    this.assertColor(hexColor);

    // Convert the hex color to RGB
    let r = parseInt(hexColor.substring(1, 3), 16);
    let g = parseInt(hexColor.substring(3, 5), 16);
    let b = parseInt(hexColor.substring(5, 7), 16);

    // Lighten the RGB values
    r = Math.min(255, Math.floor(r + (255 - r) * lightenFactor));
    g = Math.min(255, Math.floor(g + (255 - g) * lightenFactor));
    b = Math.min(255, Math.floor(b + (255 - b) * lightenFactor));

    // Convert back to hex and return
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public static average(hexColor1: string, hexColor2: string, percentage: number = 0.5): string {
    if (!hexColor1.startsWith('#') || !hexColor2.startsWith('#') || hexColor1.length !== 7 || hexColor2.length !== 7) {
      throw new Error("Invalid hex color format. It should be '#RRGGBB'.");
    }

    // Convert the hex colors to RGB
    let r1 = parseInt(hexColor1.substring(1, 3), 16);
    let g1 = parseInt(hexColor1.substring(3, 5), 16);
    let b1 = parseInt(hexColor1.substring(5, 7), 16);

    let r2 = parseInt(hexColor2.substring(1, 3), 16);
    let g2 = parseInt(hexColor2.substring(3, 5), 16);
    let b2 = parseInt(hexColor2.substring(5, 7), 16);

    // Calculate the average for each RGB component
    let avgR = Math.floor(r1 * (1 - percentage) + r2 * percentage);
    let avgG = Math.floor(g1 * (1 - percentage) + g2 * percentage);
    let avgB = Math.floor(b1 * (1 - percentage) + b2 * percentage);

    // Convert back to hex and return
    return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  }

  private static assertColor(hexColor: string) {
    if (!hexColor.startsWith('#') || hexColor.length !== 7) {
      throw new Error("Invalid hex color format. It should be '#RRGGBB'.");
    }
  }
}