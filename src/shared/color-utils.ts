/** Parse a hex color string to [r, g, b] (0-255). */
export function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert [r, g, b] (0-255) to hex string. */
export function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    clamp(r).toString(16).padStart(2, "0") +
    clamp(g).toString(16).padStart(2, "0") +
    clamp(b).toString(16).padStart(2, "0")
  );
}

/** Linearly interpolate between two hex colors. */
export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t,
  );
}

/** Darken a hex color by a factor (0 = unchanged, 1 = black). */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const f = 1 - amount;
  return toHex(r * f, g * f, b * f);
}

/** Lighten a hex color by a factor (0 = unchanged, 1 = white). */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/** Vary a color slightly using a random function. */
export function varyColor(hex: string, amount: number, rand: () => number): string {
  const [r, g, b] = parseHex(hex);
  const v = amount * 255;
  return toHex(
    r + (rand() - 0.5) * v,
    g + (rand() - 0.5) * v,
    b + (rand() - 0.5) * v,
  );
}
