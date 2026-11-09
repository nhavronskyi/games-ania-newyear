import type Phaser from "phaser";
import {
  circle,
  circleShaded,
  ellipse,
  glint,
  polygon,
  rrect,
} from "./draw";
import { P, shade } from "./palette";
import type { ArtDef } from "./types";

type G = Phaser.GameObjects.Graphics;

const HAIR = P.brown;
const DRESS = P.pink;

function eye(g: G, cx: number, cy: number, r: number): void {
  ellipse(g, cx, cy, r, r * 1.2, P.ink);
  circle(g, cx + r * 0.3, cy - r * 0.45, r * 0.38, P.white);
}

function closedEye(g: G, cx: number, cy: number, r: number): void {
  g.lineStyle(r * 0.5, P.ink)
    .beginPath()
    .arc(cx, cy - r * 0.4, r, 0.35, Math.PI - 0.35)
    .strokePath();
}

/**
 * Anya as separate textures so she can animate. Texture key = `hero:<part>`.
 * Required parts: legs, body, arm (one arm; mirrored for the other side), head, eyes-open, eyes-closed, hat, pompom.
 * HERO_LAYOUT gives each part's centre (x, y) relative to the hero container origin, which is at her FEET (y up is negative),
 * plus the part's draw order. Total height ~ 300px, head ~ 45% of it, wearing a Santa hat.
 */
export const HERO_ART: Record<string, ArtDef> = {
  legs: {
    w: 100,
    h: 60,
    draw: (g, w, h) => {
      for (const cx of [w * 0.3, w * 0.7]) {
        rrect(g, cx - 11, 0, 22, h * 0.7, 8, P.skin);
        rrect(g, cx - 11, h * 0.35, 22, h * 0.25, 4, P.white);
        // shoe
        rrect(g, cx - 20, h * 0.66, 40, h * 0.34, 12, shade(P.brown, -0.25));
        rrect(g, cx - 20, h * 0.66, 40, h * 0.27, 12, P.brown);
        glint(g, cx - 8, h * 0.74, 3);
      }
    },
  },

  body: {
    w: 130,
    h: 100,
    draw: (g, w, h) => {
      // neck
      rrect(g, w / 2 - 14, 0, 28, 22, 8, shade(P.skin, -0.1));
      // dress: shoulders + flared skirt
      polygon(
        g,
        [
          [w * 0.3, 8],
          [w * 0.7, 8],
          [w - 4, h - 6],
          [4, h - 6],
        ],
        shade(DRESS, -0.2),
      );
      rrect(g, w * 0.26, 6, w * 0.48, 40, 16, shade(DRESS, -0.2));
      polygon(
        g,
        [
          [w * 0.31, 10],
          [w * 0.69, 10],
          [w - 10, h - 20],
          [10, h - 20],
        ],
        DRESS,
      );
      rrect(g, w * 0.28, 6, w * 0.44, 34, 14, DRESS);
      // white hem
      rrect(g, 0, h - 26, w, 24, 12, shade(P.white, -0.12));
      rrect(g, 0, h - 26, w, 20, 12, P.white);
      // collar + buttons
      circle(g, w / 2, 14, 12, P.white);
      circle(g, w / 2, 40, 5, P.coral);
      circle(g, w / 2, 58, 5, P.coral);
      glint(g, w * 0.4, 24, 4);
    },
  },

  arm: {
    w: 34,
    h: 100,
    draw: (g, w, h) => {
      rrect(g, 0, 0, w, h * 0.58, 16, shade(DRESS, -0.2));
      rrect(g, 0, 0, w, h * 0.52, 16, DRESS);
      rrect(g, 0, h * 0.46, w, 10, 5, P.white);
      circleShaded(g, w / 2, h * 0.8, 14, P.skin);
    },
  },

  head: {
    w: 150,
    h: 130,
    draw: (g, w, h) => {
      // hair back (long, with side tufts)
      rrect(g, 0, 4, w, h - 4, 56, shade(HAIR, -0.2));
      rrect(g, 0, 0, w, h - 10, 56, HAIR);
      circle(g, 10, h - 22, 18, HAIR);
      circle(g, w - 10, h - 22, 18, HAIR);
      // face
      ellipse(g, w / 2, h * 0.6 + 3, w * 0.38, h * 0.37, shade(P.skin, -0.1));
      ellipse(g, w / 2, h * 0.6, w * 0.38, h * 0.37, P.skin);
      // bangs
      const by = h * 0.3;
      for (let i = 0; i < 5; i++) {
        circle(g, w * 0.18 + i * (w * 0.16), by, 20, HAIR);
      }
      rrect(g, w * 0.1, h * 0.04, w * 0.8, by - h * 0.04, 20, HAIR);
      glint(g, w * 0.3, h * 0.12, 5);
      // cheeks
      ellipse(g, w * 0.27, h * 0.74, 12, 8, P.coral, 0.55);
      ellipse(g, w * 0.73, h * 0.74, 12, 8, P.coral, 0.55);
      // nose
      circle(g, w / 2, h * 0.7, 3, shade(P.skin, -0.28));
      // smile
      g.lineStyle(4, shade(P.red, -0.2))
        .beginPath()
        .arc(w / 2, h * 0.74, 11, 0.3, Math.PI - 0.3)
        .strokePath();
    },
  },

  "eyes-open": {
    w: 90,
    h: 30,
    draw: (g, w, h) => {
      eye(g, w / 2 - 26, h / 2, 8);
      eye(g, w / 2 + 26, h / 2, 8);
    },
  },

  "eyes-closed": {
    w: 90,
    h: 30,
    draw: (g, w, h) => {
      closedEye(g, w / 2 - 26, h / 2, 9);
      closedEye(g, w / 2 + 26, h / 2, 9);
    },
  },

  hat: {
    w: 160,
    h: 75,
    draw: (g, w, h) => {
      const dark = shade(P.red, -0.22);
      const pts: [number, number][] = [
        [16, 52],
        [30, 26],
        [62, 8],
        [100, 6],
        [132, 20],
        [152, 44],
        [144, 52],
      ];
      polygon(
        g,
        pts.map(([x, y]) => [x, y + 4] as [number, number]),
        dark,
      );
      polygon(g, pts, P.red);
      g.fillStyle(P.white, 0.3).fillRoundedRect(46, 14, 40, 6, 3);
      rrect(g, 0, h - 32, w, 32, 16, shade(P.white, -0.14));
      rrect(g, 0, h - 32, w, 26, 16, P.white);
    },
  },

  pompom: {
    w: 40,
    h: 40,
    draw: (g, w) => {
      circleShaded(g, w / 2, w / 2, 18, P.white);
    },
  },
};

export interface HeroPart {
  x: number;
  y: number;
  z: number;
}
/** Centres relative to the feet origin (y up is negative). Arm is the right one; the scene mirrors it for the left. */
export const HERO_LAYOUT: Record<string, HeroPart> = {
  legs: { x: 0, y: -30, z: 0 },
  body: { x: 0, y: -100, z: 1 },
  arm: { x: 64, y: -104, z: 2 },
  head: { x: 0, y: -205, z: 3 },
  "eyes-open": { x: 0, y: -192, z: 4 },
  "eyes-closed": { x: 0, y: -192, z: 4 },
  hat: { x: 0, y: -260, z: 5 },
  pompom: { x: 70, y: -251, z: 6 },
};
