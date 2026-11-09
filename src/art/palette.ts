// Soft, saturated-pastel palette. Always derive light/dark variants with shade() instead of new hexes.
export const P = {
  white: 0xffffff,
  cream: 0xfff6e9,
  ink: 0x3d2c4e, // eyes, thin lines
  coral: 0xff6f91,
  pink: 0xffb3c7,
  red: 0xf0506e,
  peach: 0xffcfa8,
  orange: 0xffa24d,
  yellow: 0xffd84d,
  gold: 0xffc94d,
  mint: 0x9be8c8,
  green: 0x4cc38a,
  leaf: 0x5fd08a,
  sky: 0xa8dcff,
  blue: 0x5aaaf0,
  lilac: 0xc9b5ff,
  purple: 0x8e6bd8,
  wood: 0xc98f5b,
  brown: 0x8a5a3c,
  skin: 0xffd9bd,
  snow: 0xf4f8ff,
  night: 0x23305e,
  grey: 0xc9cfdb,
} as const;

const clamp = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

/** k in [-1, 1]: negative mixes toward black (darker), positive toward white (lighter). */
export function shade(color: number, k: number): number {
  const target = k < 0 ? 0 : 255;
  const t = Math.abs(k);
  const r = clamp(((color >> 16) & 255) * (1 - t) + target * t);
  const g = clamp(((color >> 8) & 255) * (1 - t) + target * t);
  const b = clamp((color & 255) * (1 - t) + target * t);
  return (r << 16) | (g << 8) | b;
}
