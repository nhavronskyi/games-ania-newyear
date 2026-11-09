import type Phaser from "phaser";
import type { ArtFn } from "./types";
import { P, shade } from "./palette";
import {
  circle,
  circleShaded,
  ellipse,
  face,
  glint,
  polygon,
  rrect,
  rrectShaded,
} from "./draw";

type G = Phaser.GameObjects.Graphics;

/** Rounded triangle tier (apex at top) with darker underside. */
function tier(
  g: G,
  cx: number,
  top: number,
  bottom: number,
  half: number,
  r: number,
  color: number,
): void {
  const dark = shade(color, -0.18);
  const draw = (c: number, dy: number, inset: number): void => {
    const b = bottom - dy;
    polygon(
      g,
      [
        [cx, top],
        [cx + half - inset, b - r],
        [cx - half + inset, b - r],
      ],
      c,
    );
    rrect(g, cx - half + inset, b - r * 2, (half - inset) * 2, r * 2, r, c);
  };
  draw(dark, 0, 0);
  draw(color, r * 0.4, 0);
}

function stroke(g: G, color: number, width: number): void {
  g.lineStyle(width, color);
}

export const ITEM_ART_B: Record<string, ArtFn> = {
  pot: (g, w, h) => {
    const leaf = P.leaf;
    // stems
    stroke(g, shade(leaf, -0.2), w * 0.03);
    for (const [x, y] of [
      [0.3, 0.3],
      [0.5, 0.18],
      [0.7, 0.3],
    ] as const) {
      g.beginPath()
        .moveTo(w * 0.5, h * 0.55)
        .lineTo(w * x, h * y)
        .strokePath();
    }
    // leaves
    for (const [x, y, r] of [
      [0.28, 0.3, 0.12],
      [0.5, 0.18, 0.13],
      [0.72, 0.3, 0.12],
      [0.38, 0.42, 0.1],
      [0.62, 0.42, 0.1],
    ] as const) {
      circleShaded(g, w * x, h * y, w * r, leaf);
    }
    circleShaded(g, w * 0.5, h * 0.36, w * 0.1, shade(leaf, 0.12));
    // pot body
    polygon(
      g,
      [
        [w * 0.22, h * 0.56],
        [w * 0.78, h * 0.56],
        [w * 0.68, h * 0.94],
        [w * 0.32, h * 0.94],
      ],
      shade(P.orange, -0.3),
    );
    polygon(
      g,
      [
        [w * 0.22, h * 0.56],
        [w * 0.78, h * 0.56],
        [w * 0.69, h * 0.88],
        [w * 0.31, h * 0.88],
      ],
      P.orange,
    );
    circle(g, w * 0.32, h * 0.94 - w * 0.03, w * 0.03, shade(P.orange, -0.3));
    circle(g, w * 0.68, h * 0.94 - w * 0.03, w * 0.03, shade(P.orange, -0.3));
    rrect(g, w * 0.27, h * 0.7, w * 0.08, h * 0.12, w * 0.04, P.white, 0.3);
    // rim
    rrectShaded(g, w * 0.16, h * 0.5, w * 0.68, h * 0.14, h * 0.07, P.orange);
    // little heart
    circle(g, w * 0.46, h * 0.76, w * 0.03, P.cream, 0.9);
    circle(g, w * 0.54, h * 0.76, w * 0.03, P.cream, 0.9);
    polygon(
      g,
      [
        [w * 0.43, h * 0.78],
        [w * 0.57, h * 0.78],
        [w * 0.5, h * 0.85],
      ],
      P.cream,
      0.9,
    );
  },

  fir: (g, w, h) => {
    const cx = w * 0.5;
    rrectShaded(g, w * 0.43, h * 0.8, w * 0.14, h * 0.15, w * 0.03, P.brown);
    tier(g, cx, h * 0.34, h * 0.88, w * 0.36, w * 0.06, P.green);
    tier(g, cx, h * 0.2, h * 0.7, w * 0.29, w * 0.055, shade(P.green, 0.08));
    tier(g, cx, h * 0.06, h * 0.52, w * 0.21, w * 0.05, shade(P.green, 0.16));
    // snow caps
    for (const [top, half, len] of [
      [0.06, 0.21, 0.2],
      [0.2, 0.29, 0.2],
      [0.34, 0.36, 0.2],
    ] as const) {
      const ratio = len / (top === 0.06 ? 0.46 : top === 0.2 ? 0.5 : 0.54);
      const hw = half * ratio;
      polygon(
        g,
        [
          [cx, h * top],
          [cx + w * hw, h * (top + len)],
          [cx - w * hw, h * (top + len)],
        ],
        P.snow,
      );
      circle(g, cx - w * hw * 0.6, h * (top + len), w * 0.035, P.snow);
      circle(g, cx, h * (top + len), w * 0.04, P.snow);
      circle(g, cx + w * hw * 0.6, h * (top + len), w * 0.035, P.snow);
    }
    glint(g, cx - w * 0.1, h * 0.4, w * 0.015);
    glint(g, cx + w * 0.14, h * 0.6, w * 0.015);
  },

  tulip: (g, w, h) => {
    const stem = shade(P.green, -0.1);
    rrect(g, w * 0.47, h * 0.42, w * 0.06, h * 0.52, w * 0.03, stem);
    // leaves
    polygon(
      g,
      [
        [w * 0.5, h * 0.92],
        [w * 0.2, h * 0.58],
        [w * 0.28, h * 0.52],
        [w * 0.5, h * 0.78],
      ],
      P.leaf,
    );
    polygon(
      g,
      [
        [w * 0.5, h * 0.92],
        [w * 0.8, h * 0.58],
        [w * 0.72, h * 0.52],
        [w * 0.5, h * 0.78],
      ],
      shade(P.leaf, -0.12),
    );
    // bloom
    const c = P.coral;
    ellipse(g, w * 0.5, h * 0.3, w * 0.25, h * 0.24, shade(c, -0.18));
    ellipse(g, w * 0.36, h * 0.27, w * 0.14, h * 0.2, shade(c, -0.05));
    ellipse(g, w * 0.64, h * 0.27, w * 0.14, h * 0.2, shade(c, -0.05));
    ellipse(g, w * 0.5, h * 0.27, w * 0.15, h * 0.22, c);
    polygon(
      g,
      [
        [w * 0.3, h * 0.16],
        [w * 0.4, h * 0.04],
        [w * 0.5, h * 0.17],
        [w * 0.6, h * 0.04],
        [w * 0.7, h * 0.16],
        [w * 0.7, h * 0.3],
        [w * 0.3, h * 0.3],
      ],
      shade(c, 0.05),
    );
    ellipse(g, w * 0.4, h * 0.28, w * 0.025, h * 0.07, P.white, 0.4);
  },

  cactus: (g, w, h) => {
    const c = P.green;
    const d = shade(c, -0.18);
    // arms
    rrect(g, w * 0.14, h * 0.42, w * 0.2, h * 0.14, w * 0.07, d);
    rrect(g, w * 0.14, h * 0.3, w * 0.14, h * 0.26, w * 0.07, d);
    rrect(g, w * 0.14, h * 0.3, w * 0.14, h * 0.24, w * 0.07, c);
    rrect(g, w * 0.66, h * 0.36, w * 0.2, h * 0.14, w * 0.07, d);
    rrect(g, w * 0.72, h * 0.24, w * 0.14, h * 0.26, w * 0.07, d);
    rrect(g, w * 0.72, h * 0.24, w * 0.14, h * 0.24, w * 0.07, c);
    // main body
    rrectShaded(g, w * 0.3, h * 0.12, w * 0.4, h * 0.6, w * 0.2, c);
    // pot
    polygon(
      g,
      [
        [w * 0.24, h * 0.7],
        [w * 0.76, h * 0.7],
        [w * 0.68, h * 0.94],
        [w * 0.32, h * 0.94],
      ],
      shade(P.lilac, -0.2),
    );
    polygon(
      g,
      [
        [w * 0.24, h * 0.7],
        [w * 0.76, h * 0.7],
        [w * 0.69, h * 0.89],
        [w * 0.31, h * 0.89],
      ],
      P.lilac,
    );
    rrectShaded(
      g,
      w * 0.2,
      h * 0.66,
      w * 0.6,
      h * 0.1,
      h * 0.05,
      shade(P.lilac, 0.1),
    );
    // spikes
    for (const [x, y] of [
      [0.36, 0.28],
      [0.64, 0.3],
      [0.37, 0.58],
      [0.63, 0.56],
    ] as const) {
      circle(g, w * x, h * y, w * 0.012, P.cream);
    }
    face(g, w * 0.5, h * 0.4, w * 0.08, w * 0.03);
    // blush
    circle(g, w * 0.36, h * 0.46, w * 0.03, P.pink, 0.7);
    circle(g, w * 0.64, h * 0.46, w * 0.03, P.pink, 0.7);
    // flower
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      circle(
        g,
        w * 0.5 + Math.cos(a) * w * 0.045,
        h * 0.1 + Math.sin(a) * w * 0.045,
        w * 0.04,
        P.pink,
      );
    }
    circle(g, w * 0.5, h * 0.1, w * 0.03, P.yellow);
  },

  teddy: (g, w, h) => {
    const b = P.wood;
    const d = shade(b, -0.18);
    // ears
    circleShaded(g, w * 0.3, h * 0.2, w * 0.1, b);
    circleShaded(g, w * 0.7, h * 0.2, w * 0.1, b);
    circle(g, w * 0.3, h * 0.21, w * 0.05, P.peach);
    circle(g, w * 0.7, h * 0.21, w * 0.05, P.peach);
    // legs
    ellipse(g, w * 0.3, h * 0.88, w * 0.14, h * 0.08, d);
    ellipse(g, w * 0.7, h * 0.88, w * 0.14, h * 0.08, d);
    ellipse(g, w * 0.3, h * 0.865, w * 0.14, h * 0.08, b);
    ellipse(g, w * 0.7, h * 0.865, w * 0.14, h * 0.08, b);
    circle(g, w * 0.3, h * 0.87, w * 0.05, P.peach);
    circle(g, w * 0.7, h * 0.87, w * 0.05, P.peach);
    // body
    ellipse(g, w * 0.5, h * 0.7, w * 0.27, h * 0.24, d);
    ellipse(g, w * 0.5, h * 0.68, w * 0.27, h * 0.23, b);
    // arms
    circleShaded(g, w * 0.24, h * 0.64, w * 0.08, b);
    circleShaded(g, w * 0.76, h * 0.64, w * 0.08, b);
    // belly
    ellipse(g, w * 0.5, h * 0.72, w * 0.16, h * 0.15, P.peach);
    ellipse(g, w * 0.45, h * 0.66, w * 0.05, h * 0.03, P.white, 0.4);
    // head
    circleShaded(g, w * 0.5, h * 0.33, w * 0.24, b);
    // muzzle
    ellipse(g, w * 0.5, h * 0.41, w * 0.1, h * 0.07, P.peach);
    ellipse(g, w * 0.5, h * 0.375, w * 0.035, h * 0.022, P.ink);
    face(g, w * 0.5, h * 0.31, w * 0.1, w * 0.03);
    // bow
    polygon(
      g,
      [
        [w * 0.5, h * 0.56],
        [w * 0.4, h * 0.51],
        [w * 0.4, h * 0.61],
      ],
      P.red,
    );
    polygon(
      g,
      [
        [w * 0.5, h * 0.56],
        [w * 0.6, h * 0.51],
        [w * 0.6, h * 0.61],
      ],
      P.red,
    );
    circle(g, w * 0.5, h * 0.56, w * 0.03, shade(P.red, -0.2));
  },

  cat: (g, w, h) => {
    const c = P.orange;
    const d = shade(c, -0.18);
    // tail
    stroke(g, d, w * 0.1);
    g.beginPath()
      .arc(w * 0.78, h * 0.72, w * 0.16, Math.PI * 0.55, Math.PI * 1.7, true)
      .strokePath();
    circle(g, w * 0.88, h * 0.57, w * 0.05, P.cream);
    // body
    ellipse(g, w * 0.5, h * 0.72, w * 0.26, h * 0.24, d);
    ellipse(g, w * 0.5, h * 0.7, w * 0.26, h * 0.23, c);
    ellipse(g, w * 0.5, h * 0.76, w * 0.14, h * 0.15, P.cream);
    // paws
    ellipse(g, w * 0.4, h * 0.92, w * 0.09, h * 0.05, P.cream);
    ellipse(g, w * 0.6, h * 0.92, w * 0.09, h * 0.05, P.cream);
    // ears
    polygon(
      g,
      [
        [w * 0.25, h * 0.32],
        [w * 0.28, h * 0.06],
        [w * 0.47, h * 0.2],
      ],
      d,
    );
    polygon(
      g,
      [
        [w * 0.75, h * 0.32],
        [w * 0.72, h * 0.06],
        [w * 0.53, h * 0.2],
      ],
      d,
    );
    polygon(
      g,
      [
        [w * 0.29, h * 0.28],
        [w * 0.31, h * 0.12],
        [w * 0.42, h * 0.21],
      ],
      P.pink,
    );
    polygon(
      g,
      [
        [w * 0.71, h * 0.28],
        [w * 0.69, h * 0.12],
        [w * 0.58, h * 0.21],
      ],
      P.pink,
    );
    // head
    ellipse(g, w * 0.5, h * 0.39, w * 0.27, h * 0.22, d);
    ellipse(g, w * 0.5, h * 0.37, w * 0.27, h * 0.21, c);
    // stripes
    stroke(g, d, w * 0.025);
    for (const dx of [-0.05, 0, 0.05]) {
      g.beginPath()
        .moveTo(w * (0.5 + dx), h * 0.18)
        .lineTo(w * (0.5 + dx), h * 0.24)
        .strokePath();
    }
    glint(g, w * 0.34, h * 0.25, w * 0.02);
    face(g, w * 0.5, h * 0.37, w * 0.11, w * 0.03);
    // nose + whiskers
    polygon(
      g,
      [
        [w * 0.47, h * 0.415],
        [w * 0.53, h * 0.415],
        [w * 0.5, h * 0.44],
      ],
      P.pink,
    );
    stroke(g, P.cream, w * 0.012);
    for (const s of [-1, 1]) {
      g.beginPath()
        .moveTo(w * (0.5 + s * 0.15), h * 0.42)
        .lineTo(w * (0.5 + s * 0.27), h * 0.4)
        .strokePath();
      g.beginPath()
        .moveTo(w * (0.5 + s * 0.15), h * 0.45)
        .lineTo(w * (0.5 + s * 0.27), h * 0.47)
        .strokePath();
    }
  },

  cookies: (g, w, h) => {
    // plate
    ellipse(g, w * 0.5, h * 0.84, w * 0.44, h * 0.12, shade(P.sky, -0.2));
    ellipse(g, w * 0.5, h * 0.82, w * 0.44, h * 0.12, P.sky);
    ellipse(g, w * 0.5, h * 0.82, w * 0.32, h * 0.07, shade(P.sky, 0.2));
    const chips = (cx: number, cy: number, r: number): void => {
      for (const [dx, dy] of [
        [-0.45, -0.3],
        [0.2, -0.5],
        [0.45, 0.05],
        [-0.15, 0.1],
        [0.1, 0.5],
        [-0.5, 0.35],
      ] as const) {
        ellipse(g, cx + dx * r, cy + dy * r, r * 0.16, r * 0.12, P.brown);
      }
    };
    const cookie = (cx: number, cy: number, r: number, c: number): void => {
      circleShaded(g, cx, cy, r, c);
      chips(cx, cy, r);
    };
    cookie(w * 0.3, h * 0.7, w * 0.19, P.gold);
    cookie(w * 0.7, h * 0.7, w * 0.19, shade(P.gold, -0.06));
    cookie(w * 0.5, h * 0.5, w * 0.22, shade(P.orange, 0.15));
    glint(g, w * 0.8, h * 0.82, w * 0.015);
  },

  cocoa: (g, w, h) => {
    // steam
    stroke(g, P.white, w * 0.035);
    for (const x of [0.38, 0.52, 0.66]) {
      g.beginPath()
        .moveTo(w * x, h * 0.2)
        .lineTo(w * (x - 0.03), h * 0.12)
        .lineTo(w * (x + 0.03), h * 0.05)
        .strokePath();
    }
    // handle
    stroke(g, shade(P.coral, -0.18), w * 0.06);
    g.beginPath()
      .arc(w * 0.8, h * 0.6, w * 0.1, -Math.PI / 2, Math.PI / 2)
      .strokePath();
    stroke(g, P.coral, w * 0.04);
    g.beginPath()
      .arc(w * 0.8, h * 0.6, w * 0.1, -Math.PI / 2, Math.PI / 2)
      .strokePath();
    // mug body
    rrectShaded(g, w * 0.14, h * 0.3, w * 0.64, h * 0.62, w * 0.14, P.coral);
    // cocoa surface
    ellipse(g, w * 0.46, h * 0.33, w * 0.31, h * 0.06, shade(P.brown, -0.1));
    ellipse(g, w * 0.46, h * 0.325, w * 0.27, h * 0.045, P.brown);
    // marshmallows
    rrect(g, w * 0.3, h * 0.2, w * 0.17, h * 0.13, w * 0.04, P.snow);
    rrect(g, w * 0.46, h * 0.22, w * 0.16, h * 0.12, w * 0.04, P.cream);
    glint(g, w * 0.34, h * 0.23, w * 0.015);
    // face
    face(g, w * 0.46, h * 0.58, w * 0.1, w * 0.03);
    circle(g, w * 0.28, h * 0.64, w * 0.03, P.pink, 0.7);
    circle(g, w * 0.64, h * 0.64, w * 0.03, P.pink, 0.7);
    // stripe
    rrect(g, w * 0.14, h * 0.78, w * 0.64, h * 0.05, h * 0.02, P.white, 0.35);
  },
};
