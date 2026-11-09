import type Phaser from "phaser";
import {
  circle,
  circleShaded,
  ellipse,
  face,
  glint,
  polygon,
  rrect,
  rrectShaded,
  star,
} from "./draw";
import { P, shade } from "./palette";
import type { ArtFn } from "./types";

type G = Phaser.GameObjects.Graphics;

const ORNAMENTS = [P.red, P.yellow, P.sky, P.pink, P.orange];

/** Soft rounded-triangle tier: dark base shape, lit inner shape, round corners. */
function tier(
  g: G,
  cx: number,
  topY: number,
  botY: number,
  halfW: number,
  r: number,
  color: number,
): void {
  const dark = shade(color, -0.18);
  polygon(
    g,
    [
      [cx, topY],
      [cx + halfW, botY],
      [cx - halfW, botY],
    ],
    dark,
  );
  circle(g, cx + halfW - r, botY - r, r, dark);
  circle(g, cx - halfW + r, botY - r, r, dark);
  circle(g, cx, topY + r, r, dark);
  const lift = r * 0.5;
  polygon(
    g,
    [
      [cx, topY + lift],
      [cx + halfW, botY - lift],
      [cx - halfW, botY - lift],
    ],
    color,
  );
  circle(g, cx + halfW - r, botY - r - lift * 0.5, r * 0.95, color);
  circle(g, cx - halfW + r, botY - r - lift * 0.5, r * 0.95, color);
  circle(g, cx, topY + r, r * 0.9, color);
}

const tree: ArtFn = (g, w, h) => {
  const cx = w / 2;
  rrectShaded(g, w * 0.43, h * 0.8, w * 0.14, h * 0.16, w * 0.03, P.brown);
  tier(g, cx, h * 0.3, h * 0.84, w * 0.4, w * 0.06, P.green);
  tier(g, cx, h * 0.18, h * 0.64, w * 0.32, w * 0.055, P.leaf);
  tier(g, cx, h * 0.08, h * 0.44, w * 0.23, w * 0.05, shade(P.leaf, 0.12));
  star(g, cx, h * 0.095, w * 0.09, w * 0.04, 5, P.yellow);
  const orns: [number, number][] = [
    [0.36, 0.72],
    [0.62, 0.78],
    [0.5, 0.62],
    [0.42, 0.5],
    [0.6, 0.48],
    [0.5, 0.33],
    [0.7, 0.68],
    [0.3, 0.76],
  ];
  orns.forEach(([ox, oy], i) => {
    circleShaded(g, w * ox, h * oy, w * 0.04, ORNAMENTS[i % ORNAMENTS.length]);
  });
};

const starArt: ArtFn = (g, w, h) => {
  const cx = w / 2;
  const cy = h * 0.54;
  star(g, cx, cy + h * 0.025, w * 0.44, w * 0.22, 5, shade(P.gold, -0.2));
  star(g, cx, cy, w * 0.42, w * 0.21, 5, P.yellow);
  circle(g, cx, cy, w * 0.14, shade(P.yellow, 0.25));
  glint(g, cx - w * 0.1, cy - h * 0.2, w * 0.035);
  glint(g, cx + w * 0.02, cy - h * 0.3, w * 0.02);
};

const lights: ArtFn = (g, w, h) => {
  const colors = [P.red, P.yellow, P.sky, P.pink, P.orange, P.mint];
  const x0 = w * 0.07;
  const x1 = w * 0.93;
  const yAt = (t: number): number => h * 0.22 + Math.sin(t * Math.PI) * h * 0.4;
  g.lineStyle(Math.max(3, w * 0.03), shade(P.green, -0.3));
  g.beginPath().moveTo(x0, yAt(0));
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    g.lineTo(x0 + (x1 - x0) * t, yAt(t));
  }
  g.strokePath();
  const count = 6;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t;
    const y = yAt(t);
    const color = colors[i % colors.length];
    circle(g, x, y + h * 0.04, w * 0.075, color, 0.25);
    rrect(g, x - w * 0.02, y - h * 0.01, w * 0.04, h * 0.06, w * 0.01, P.grey);
    circleShaded(g, x, y + h * 0.1, w * 0.06, color);
  }
};

const ball: ArtFn = (g, w, h) => {
  const cx = w / 2;
  const cy = h * 0.58;
  const r = w * 0.36;
  rrect(g, cx - w * 0.07, h * 0.1, w * 0.14, h * 0.1, w * 0.02, P.gold);
  g.lineStyle(Math.max(3, w * 0.03), P.gold)
    .beginPath()
    .arc(cx, h * 0.1, w * 0.06, Math.PI, Math.PI * 2)
    .strokePath();
  circleShaded(g, cx, cy, r, P.red);
  rrect(
    g,
    cx - r * 0.95,
    cy - h * 0.04,
    r * 1.9,
    h * 0.08,
    w * 0.04,
    P.white,
    0.4,
  );
  [-0.5, 0, 0.5].forEach((k) => {
    circle(g, cx + r * k, cy, w * 0.025, P.yellow);
  });
  glint(g, cx + r * 0.35, cy - r * 0.55, w * 0.025);
};

const gift: ArtFn = (g, w, h) => {
  const cx = w / 2;
  rrectShaded(g, w * 0.12, h * 0.42, w * 0.76, h * 0.5, w * 0.07, P.coral);
  rrect(g, cx - w * 0.07, h * 0.42, w * 0.14, h * 0.44, w * 0.01, P.yellow);
  rrectShaded(
    g,
    w * 0.07,
    h * 0.3,
    w * 0.86,
    h * 0.17,
    w * 0.06,
    shade(P.coral, 0.1),
  );
  rrect(g, cx - w * 0.07, h * 0.3, w * 0.14, h * 0.16, w * 0.01, P.yellow);
  ellipse(g, cx - w * 0.14, h * 0.2, w * 0.13, h * 0.08, P.yellow);
  ellipse(g, cx + w * 0.14, h * 0.2, w * 0.13, h * 0.08, P.yellow);
  ellipse(
    g,
    cx - w * 0.14,
    h * 0.2,
    w * 0.06,
    h * 0.035,
    shade(P.yellow, -0.15),
  );
  ellipse(
    g,
    cx + w * 0.14,
    h * 0.2,
    w * 0.06,
    h * 0.035,
    shade(P.yellow, -0.15),
  );
  circleShaded(g, cx, h * 0.26, w * 0.06, P.gold);
};

const snowman: ArtFn = (g, w, h) => {
  const cx = w / 2;
  circleShaded(g, cx, h * 0.72, w * 0.27, P.snow);
  circleShaded(g, cx, h * 0.4, w * 0.2, P.snow);
  // hat
  rrect(
    g,
    cx - w * 0.2,
    h * 0.17,
    w * 0.4,
    h * 0.05,
    w * 0.02,
    shade(P.night, -0.2),
  );
  rrectShaded(
    g,
    cx - w * 0.13,
    h * 0.04,
    w * 0.26,
    h * 0.16,
    w * 0.04,
    P.night,
  );
  rrect(g, cx - w * 0.13, h * 0.14, w * 0.26, h * 0.03, 0, P.red);
  // face
  face(g, cx, h * 0.37, w * 0.07, w * 0.022);
  polygon(
    g,
    [
      [cx, h * 0.41],
      [cx + w * 0.16, h * 0.45],
      [cx, h * 0.47],
    ],
    P.orange,
  );
  // scarf
  rrectShaded(g, cx - w * 0.2, h * 0.53, w * 0.4, h * 0.07, w * 0.035, P.red);
  rrectShaded(g, cx + w * 0.06, h * 0.57, w * 0.09, h * 0.16, w * 0.03, P.red);
  // buttons
  [0.67, 0.76].forEach((y) => circle(g, cx, h * y, w * 0.026, P.ink));
  // arms
  g.lineStyle(Math.max(3, w * 0.025), P.brown);
  g.beginPath()
    .moveTo(cx - w * 0.25, h * 0.66)
    .lineTo(cx - w * 0.4, h * 0.56)
    .strokePath();
  g.beginPath()
    .moveTo(cx + w * 0.25, h * 0.66)
    .lineTo(cx + w * 0.4, h * 0.56)
    .strokePath();
};

const stocking: ArtFn = (g, w, h) => {
  const dark = shade(P.red, -0.18);
  // leg
  rrect(g, w * 0.3, h * 0.16, w * 0.3, h * 0.55, w * 0.06, dark);
  rrect(g, w * 0.3, h * 0.16, w * 0.3, h * 0.52, w * 0.06, P.red);
  // foot
  rrect(g, w * 0.3, h * 0.6, w * 0.6, h * 0.3, w * 0.13, dark);
  rrect(g, w * 0.3, h * 0.6, w * 0.6, h * 0.26, w * 0.13, P.red);
  // heel & toe patches
  circle(g, w * 0.82, h * 0.72, w * 0.07, P.yellow);
  circle(g, w * 0.36, h * 0.52, w * 0.05, P.yellow, 0);
  rrect(g, w * 0.3, h * 0.38, w * 0.3, h * 0.05, 0, P.white, 0.35);
  // cuff
  rrectShaded(g, w * 0.24, h * 0.08, w * 0.42, h * 0.14, w * 0.06, P.snow);
  glint(g, w * 0.4, h * 0.3, w * 0.025);
};

const candle: ArtFn = (g, w, h) => {
  const cx = w / 2;
  // holder
  ellipse(g, cx, h * 0.88, w * 0.3, h * 0.07, shade(P.gold, -0.2));
  ellipse(g, cx, h * 0.85, w * 0.3, h * 0.07, P.gold);
  // body
  rrectShaded(g, cx - w * 0.14, h * 0.4, w * 0.28, h * 0.46, w * 0.05, P.snow);
  // drip
  rrect(g, cx + w * 0.02, h * 0.4, w * 0.07, h * 0.15, w * 0.035, P.white);
  // flame glow + flame
  circle(g, cx, h * 0.25, w * 0.2, P.yellow, 0.25);
  ellipse(g, cx, h * 0.26, w * 0.09, h * 0.14, P.orange);
  ellipse(g, cx, h * 0.285, w * 0.055, h * 0.09, P.yellow);
  rrect(g, cx - w * 0.01, h * 0.36, w * 0.02, h * 0.06, w * 0.01, P.ink);
  // holly
  circle(g, cx - w * 0.1, h * 0.8, w * 0.04, P.green);
  circle(g, cx + w * 0.1, h * 0.8, w * 0.04, P.green);
  circle(g, cx, h * 0.8, w * 0.03, P.red);
};

const sofa: ArtFn = (g, w, h) => {
  const c = P.coral;
  // feet
  rrect(g, w * 0.14, h * 0.86, w * 0.08, h * 0.08, w * 0.02, P.brown);
  rrect(g, w * 0.78, h * 0.86, w * 0.08, h * 0.08, w * 0.02, P.brown);
  // back
  rrectShaded(
    g,
    w * 0.12,
    h * 0.2,
    w * 0.76,
    h * 0.45,
    w * 0.1,
    shade(c, -0.05),
  );
  // seat cushions
  rrectShaded(g, w * 0.2, h * 0.5, w * 0.31, h * 0.28, w * 0.07, c);
  rrectShaded(g, w * 0.49, h * 0.5, w * 0.31, h * 0.28, w * 0.07, c);
  // arms
  rrectShaded(
    g,
    w * 0.04,
    h * 0.4,
    w * 0.18,
    h * 0.46,
    w * 0.08,
    shade(c, 0.05),
  );
  rrectShaded(
    g,
    w * 0.78,
    h * 0.4,
    w * 0.18,
    h * 0.46,
    w * 0.08,
    shade(c, 0.05),
  );
  // pillow
  rrectShaded(g, w * 0.27, h * 0.3, w * 0.16, h * 0.18, w * 0.05, P.yellow);
};

const chair: ArtFn = (g, w, h) => {
  const wood = P.wood;
  // back legs + front legs
  rrect(g, w * 0.22, h * 0.6, w * 0.08, h * 0.34, w * 0.02, shade(wood, -0.25));
  rrect(g, w * 0.7, h * 0.6, w * 0.08, h * 0.34, w * 0.02, shade(wood, -0.25));
  rrect(g, w * 0.28, h * 0.62, w * 0.09, h * 0.32, w * 0.025, wood);
  rrect(g, w * 0.63, h * 0.62, w * 0.09, h * 0.32, w * 0.025, wood);
  // backrest posts + panel
  rrect(g, w * 0.2, h * 0.08, w * 0.09, h * 0.55, w * 0.03, wood);
  rrect(g, w * 0.71, h * 0.08, w * 0.09, h * 0.55, w * 0.03, wood);
  rrectShaded(g, w * 0.2, h * 0.1, w * 0.6, h * 0.24, w * 0.06, P.mint);
  // seat
  rrectShaded(g, w * 0.12, h * 0.5, w * 0.76, h * 0.15, w * 0.06, P.green);
};

const mirror: ArtFn = (g, w, h) => {
  const cx = w / 2;
  rrectShaded(g, w * 0.36, h * 0.9, w * 0.28, h * 0.05, w * 0.02, P.brown);
  rrectShaded(g, w * 0.16, h * 0.06, w * 0.68, h * 0.88, w * 0.3, P.gold);
  rrect(g, w * 0.25, h * 0.14, w * 0.5, h * 0.72, w * 0.22, shade(P.sky, -0.1));
  rrect(g, w * 0.26, h * 0.14, w * 0.48, h * 0.66, w * 0.22, P.sky);
  polygon(
    g,
    [
      [w * 0.34, h * 0.4],
      [w * 0.42, h * 0.28],
      [w * 0.5, h * 0.28],
      [w * 0.4, h * 0.46],
    ],
    P.white,
    0.5,
  );
  polygon(
    g,
    [
      [w * 0.44, h * 0.6],
      [w * 0.5, h * 0.52],
      [w * 0.54, h * 0.52],
      [w * 0.48, h * 0.62],
    ],
    P.white,
    0.4,
  );
  circle(g, cx, h * 0.095, w * 0.025, P.coral);
};

const picture: ArtFn = (g, w, h) => {
  rrectShaded(g, w * 0.08, h * 0.12, w * 0.84, h * 0.78, w * 0.08, P.wood);
  rrect(g, w * 0.16, h * 0.2, w * 0.68, h * 0.6, w * 0.04, P.cream);
  // sky + hills
  rrect(g, w * 0.18, h * 0.22, w * 0.64, h * 0.56, w * 0.03, P.sky);
  circle(g, w * 0.66, h * 0.36, w * 0.07, P.yellow);
  glint(g, w * 0.34, h * 0.34, w * 0.03);
  ellipse(g, w * 0.34, h * 0.8, w * 0.28, h * 0.17, shade(P.leaf, -0.1));
  ellipse(g, w * 0.66, h * 0.82, w * 0.26, h * 0.14, P.leaf);
  rrect(g, w * 0.18, h * 0.78, w * 0.64, h * 0.02, 0, P.cream);
  rrect(g, w * 0.16, h * 0.78, w * 0.68, h * 0.06, 0, P.wood);
  rrect(g, w * 0.16, h * 0.77, w * 0.68, h * 0.04, w * 0.02, P.wood);
};

const bulb: ArtFn = (g, w, h) => {
  const cx = w / 2;
  circle(g, cx, h * 0.38, w * 0.4, P.yellow, 0.2);
  // base
  rrectShaded(g, cx - w * 0.14, h * 0.7, w * 0.28, h * 0.1, w * 0.03, P.grey);
  rrectShaded(
    g,
    cx - w * 0.12,
    h * 0.8,
    w * 0.24,
    h * 0.09,
    w * 0.03,
    shade(P.grey, -0.1),
  );
  circle(g, cx, h * 0.9, w * 0.05, P.ink);
  // glass
  circleShaded(g, cx, h * 0.42, w * 0.27, P.yellow);
  rrect(g, cx - w * 0.13, h * 0.58, w * 0.26, h * 0.16, w * 0.06, P.yellow);
  rrect(
    g,
    cx - w * 0.13,
    h * 0.58,
    w * 0.26,
    h * 0.12,
    w * 0.05,
    shade(P.yellow, 0.1),
  );
  // filament
  g.lineStyle(Math.max(2, w * 0.02), P.orange);
  g.beginPath()
    .moveTo(cx - w * 0.07, h * 0.7)
    .lineTo(cx - w * 0.07, h * 0.44)
    .lineTo(cx, h * 0.5)
    .lineTo(cx + w * 0.07, h * 0.44)
    .lineTo(cx + w * 0.07, h * 0.7)
    .strokePath();
};

const rug: ArtFn = (g, w, h) => {
  const y = h * 0.3;
  const rh = h * 0.6;
  rrectShaded(g, w * 0.06, y, w * 0.88, rh, w * 0.12, P.purple);
  rrect(g, w * 0.12, y + rh * 0.12, w * 0.76, rh * 0.62, w * 0.08, P.lilac);
  rrect(g, w * 0.17, y + rh * 0.22, w * 0.66, rh * 0.42, w * 0.05, P.pink);
  [0.28, 0.5, 0.72].forEach((fx, i) => {
    circle(g, w * fx, y + rh * 0.43, w * 0.045, i === 1 ? P.yellow : P.white);
  });
  // fringe
  for (let i = 0; i < 8; i++) {
    rrect(
      g,
      w * (0.12 + i * 0.1),
      y + rh * 0.74,
      w * 0.04,
      rh * 0.1,
      w * 0.02,
      P.cream,
    );
  }
};

/** Item art, part A: ids tree, star, lights, ball, gift, snowman, stocking, candle, sofa, chair, mirror, picture, bulb, rug. */
export const ITEM_ART_A: Record<string, ArtFn> = {
  tree,
  star: starArt,
  lights,
  ball,
  gift,
  snowman,
  stocking,
  candle,
  sofa,
  chair,
  mirror,
  picture,
  bulb,
  rug,
};
