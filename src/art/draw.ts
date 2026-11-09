import type Phaser from "phaser";
import { P, shade } from "./palette";

type G = Phaser.GameObjects.Graphics;

/** Flat rounded rect. */
export function rrect(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillRoundedRect(
    x,
    y,
    w,
    h,
    Math.min(r, w / 2, h / 2),
  );
}

export function ellipse(
  g: G,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillEllipse(cx, cy, rx * 2, ry * 2);
}

export function circle(
  g: G,
  cx: number,
  cy: number,
  r: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillCircle(cx, cy, r);
}

/** Soft contact shadow under an object. */
export function groundShadow(
  g: G,
  cx: number,
  cy: number,
  rx: number,
  ry = rx * 0.25,
  alpha = 0.18,
): void {
  ellipse(g, cx, cy, rx, ry, 0x000000, alpha);
}

/** Toca-ish chunky body: base colour + darker underside + soft top highlight. */
export function rrectShaded(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: number,
): void {
  rrect(g, x, y, w, h, r, shade(color, -0.18)); // full shape in the dark tone
  rrect(g, x, y, w, h * 0.86, r, color); // lit part leaves a dark bottom lip
  rrect(
    g,
    x + w * 0.08,
    y + h * 0.07,
    w * 0.5,
    h * 0.1,
    h * 0.05,
    P.white,
    0.35,
  ); // highlight
}

export function circleShaded(
  g: G,
  cx: number,
  cy: number,
  r: number,
  color: number,
): void {
  circle(g, cx, cy, r, shade(color, -0.18));
  circle(g, cx - r * 0.04, cy - r * 0.06, r * 0.93, color);
  circle(g, cx - r * 0.35, cy - r * 0.4, r * 0.2, P.white, 0.55); // glint
}

/** Small white sparkle dot. */
export function glint(g: G, x: number, y: number, r: number): void {
  circle(g, x, y, r, P.white, 0.8);
}

export function polygon(
  g: G,
  pts: [number, number][],
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillPoints(
    pts.map(([x, y]) => ({ x, y }) as Phaser.Geom.Point),
    true,
  );
}

export function star(
  g: G,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
  color: number,
): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  polygon(g, pts, color);
}

/** Two dot eyes + smile for cute characters (teddy, cat, snowman...). */
export function face(
  g: G,
  cx: number,
  cy: number,
  spread: number,
  size: number,
): void {
  circle(g, cx - spread, cy, size, P.ink);
  circle(g, cx + spread, cy, size, P.ink);
  circle(g, cx - spread + size * 0.3, cy - size * 0.3, size * 0.3, P.white);
  circle(g, cx + spread + size * 0.3, cy - size * 0.3, size * 0.3, P.white);
  g.lineStyle(Math.max(2, size * 0.45), P.ink)
    .beginPath()
    .arc(cx, cy + size * 1.6, size * 1.1, 0.25, Math.PI - 0.25)
    .strokePath();
}
