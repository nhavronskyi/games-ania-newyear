import type Phaser from "phaser";
import {
  circle,
  circleShaded,
  ellipse,
  glint,
  groundShadow,
  rrect,
  rrectShaded,
  star,
} from "./draw";
import { P, shade } from "./palette";
import type { ArtDef } from "./types";

type G = Phaser.GameObjects.Graphics;

function snowCap(g: G, x: number, y: number, w: number): void {
  rrect(g, x, y, w, w * 0.18, w * 0.09, P.snow);
  circle(g, x + w * 0.25, y + w * 0.18, w * 0.07, P.snow);
  circle(g, x + w * 0.62, y + w * 0.19, w * 0.09, P.snow);
}

/**
 * Built-in room furniture. Texture key = `decor:<key>`. Keys required:
 * window, bed, door, fridge, stove, city, cabinet, box, mailbox, fir, cloud, plantpot, railing.
 * Sizes are logical px as displayed (the scene shows them at 1:1, origin centre).
 */
export const DECOR_ART: Record<string, ArtDef> = {
  window: {
    w: 220,
    h: 260,
    draw: (g, w, h) => {
      const sill = h * 0.07;
      const fx = w * 0.12;
      const fw = w - fx * 2;
      const fh = h - sill - 6;
      rrect(g, fx, 4, fw, fh, 18, shade(P.white, -0.12));
      rrect(g, fx, 4, fw, fh - 4, 18, P.white);
      const ix = fx + 14;
      const iy = 18;
      const iw = fw - 28;
      const ih = fh - 32;
      rrect(g, ix, iy, iw, ih, 10, P.night);
      rrect(g, ix, iy + ih * 0.5, iw, ih * 0.5, 10, shade(P.night, 0.25));
      g.fillStyle(P.night, 1).fillRect(ix, iy + ih * 0.5, iw, 8);
      // snowy hill + stars + moon
      ellipse(g, ix + iw * 0.3, iy + ih, iw * 0.55, ih * 0.14, P.snow);
      ellipse(
        g,
        ix + iw * 0.85,
        iy + ih,
        iw * 0.5,
        ih * 0.2,
        shade(P.snow, -0.06),
      );
      circle(g, ix + iw * 0.75, iy + ih * 0.22, 14, P.cream);
      circle(
        g,
        ix + iw * 0.75 + 7,
        iy + ih * 0.22 - 4,
        12,
        shade(P.night, 0.1),
      );
      star(g, ix + iw * 0.2, iy + ih * 0.2, 8, 3.5, 4, P.yellow);
      star(g, ix + iw * 0.45, iy + ih * 0.4, 6, 2.5, 4, P.white);
      for (let i = 0; i < 10; i++) {
        circle(
          g,
          ix + ((i * 37) % iw),
          iy + ((i * 53) % (ih * 0.75)),
          2.5,
          P.white,
          0.85,
        );
      }
      // cross frame
      g.fillStyle(P.white, 1).fillRect(ix + iw / 2 - 5, iy, 10, ih);
      g.fillStyle(P.white, 1).fillRect(ix, iy + ih / 2 - 5, iw, 10);
      g.fillStyle(shade(P.white, -0.12), 1).fillRect(
        ix + iw / 2 + 3,
        iy,
        2,
        ih,
      );
      // curtains
      rrect(g, 0, 0, w * 0.2, h * 0.82, 14, shade(P.coral, -0.15));
      rrect(g, 0, 0, w * 0.18, h * 0.8, 14, P.coral);
      rrect(g, w * 0.8, 0, w * 0.2, h * 0.82, 14, shade(P.coral, -0.15));
      rrect(g, w * 0.82, 0, w * 0.18, h * 0.8, 14, P.coral);
      g.fillStyle(P.white, 0.25).fillRoundedRect(w * 0.04, 10, 6, h * 0.6, 3);
      g.fillStyle(P.white, 0.25).fillRoundedRect(w * 0.86, 10, 6, h * 0.6, 3);
      // sill
      rrect(g, 4, h - sill - 4, w - 8, sill + 4, 8, shade(P.wood, -0.18));
      rrect(g, 4, h - sill - 4, w - 8, sill, 8, P.wood);
    },
  },

  bed: {
    w: 380,
    h: 240,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 6, w * 0.46, 10);
      // frame
      rrectShaded(g, 6, h * 0.1, 40, h * 0.86, 16, P.brown);
      rrectShaded(g, w - 46, h * 0.3, 40, h * 0.66, 16, P.brown);
      rrectShaded(g, 20, h * 0.62, w - 30, h * 0.3, 14, P.wood);
      // mattress
      rrectShaded(g, 36, h * 0.42, w - 76, h * 0.34, 22, P.cream);
      // pillow
      rrectShaded(g, 52, h * 0.3, 100, h * 0.2, 20, P.white);
      // blanket
      rrectShaded(g, 140, h * 0.38, w - 190, h * 0.42, 22, P.coral);
      rrect(g, 140, h * 0.38, 30, h * 0.42, 14, P.white, 0.9);
      for (let i = 0; i < 4; i++) {
        circle(g, 200 + i * 40, h * 0.58 + (i % 2) * 14, 6, P.white, 0.6);
      }
      glint(g, 70, h * 0.35, 4);
      // feet
      rrect(g, 22, h * 0.9, 24, h * 0.1, 8, shade(P.brown, -0.2));
      rrect(g, w - 46, h * 0.9, 24, h * 0.1, 8, shade(P.brown, -0.2));
    },
  },

  door: {
    w: 170,
    h: 330,
    draw: (g, w, h) => {
      rrect(g, 0, 0, w, h, 24, shade(P.brown, -0.2));
      rrect(g, 6, 6, w - 12, h - 6, 20, P.wood);
      rrect(g, 6, 6, w - 12, h * 0.5, 20, shade(P.wood, 0.06));
      // panels
      rrect(g, 24, 28, w - 48, h * 0.38, 14, shade(P.wood, -0.14));
      rrect(g, 28, 32, w - 56, h * 0.38 - 8, 12, shade(P.wood, 0.1));
      rrect(g, 24, h * 0.5, w - 48, h * 0.42, 14, shade(P.wood, -0.14));
      rrect(g, 28, h * 0.5 + 4, w - 56, h * 0.42 - 8, 12, shade(P.wood, 0.1));
      glint(g, 44, 48, 5);
      // knob
      circleShaded(g, w - 30, h * 0.52, 12, P.gold);
    },
  },

  fridge: {
    w: 190,
    h: 330,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 4, w * 0.45, 9);
      rrectShaded(g, 6, 4, w - 12, h - 14, 26, P.sky);
      g.fillStyle(shade(P.sky, -0.25), 1).fillRect(14, h * 0.34, w - 28, 5);
      // handles
      rrect(g, w - 38, h * 0.1, 10, h * 0.16, 5, P.white);
      rrect(g, w - 38, h * 0.4, 10, h * 0.2, 5, P.white);
      // magnets
      circle(g, 50, h * 0.14, 11, P.coral);
      glint(g, 46, h * 0.14 - 4, 3);
      rrect(g, 70, h * 0.08, 34, 30, 8, P.yellow);
      star(g, 128 - 20, h * 0.2, 11, 5, 5, P.orange);
      rrect(g, 36, h * 0.24, 44, 34, 6, P.white);
      g.fillStyle(P.pink, 1).fillRect(44, h * 0.24 + 8, 28, 4);
      g.fillStyle(P.pink, 1).fillRect(44, h * 0.24 + 18, 20, 4);
      // feet
      rrect(g, 24, h - 14, 24, 10, 4, shade(P.sky, -0.4));
      rrect(g, w - 48, h - 14, 24, 10, 4, shade(P.sky, -0.4));
    },
  },

  stove: {
    w: 200,
    h: 170,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 4, w * 0.46, 8);
      const top = h * 0.4;
      // pan on top
      rrect(g, 28, top - 26, 100, 26, 10, shade(P.ink, 0.1));
      ellipse(g, 78, top - 24, 50, 6, shade(P.ink, 0.35));
      rrect(g, 124, top - 20, 52, 9, 4, shade(P.ink, 0.1));
      glint(g, 48, top - 14, 3);
      // body
      rrectShaded(g, 4, top, w - 8, h - top - 8, 20, P.lilac);
      g.fillStyle(shade(P.lilac, -0.25), 1).fillRect(10, top + 6, w - 20, 5);
      // oven window
      rrect(g, 28, top + 26, w - 56, h * 0.3, 14, shade(P.ink, 0.1));
      rrect(g, 34, top + 32, w - 68, h * 0.3 - 12, 10, shade(P.orange, 0.2));
      glint(g, 48, top + 42, 4);
      // knobs
      for (let i = 0; i < 4; i++)
        circleShaded(g, 34 + i * 44, top + 18 - 2, 6, P.white);
    },
  },

  city: {
    w: 460,
    h: 230,
    draw: (g, w, h) => {
      const cols = [
        P.lilac,
        P.blue,
        P.purple,
        P.sky,
        shade(P.blue, 0.2),
        P.lilac,
        P.purple,
      ];
      const bw = w / 7;
      const heights = [0.6, 0.85, 0.5, 1, 0.7, 0.9, 0.55];
      for (let i = 0; i < 7; i++) {
        const bh = h * heights[i];
        const x = i * bw + 2;
        const y = h - bh;
        rrect(g, x, y, bw - 4, bh + 20, 16, shade(cols[i], -0.2));
        rrect(g, x, y, bw - 4, bh + 16, 16, cols[i]);
        for (let wy = y + 20; wy < h - 20; wy += 28) {
          for (let wx = x + 12; wx < x + bw - 24; wx += 22) {
            const lit = (Math.floor(wx) + Math.floor(wy) + i) % 3 !== 0;
            rrect(g, wx, wy, 12, 16, 4, lit ? P.yellow : shade(cols[i], -0.25));
          }
        }
      }
    },
  },

  cabinet: {
    w: 190,
    h: 320,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 4, w * 0.45, 9);
      rrectShaded(g, 6, 4, w - 12, h - 14, 14, P.blue);
      const rows = 4;
      const sh = (h - 40) / rows;
      for (let i = 0; i < rows; i++) {
        const y = 20 + i * sh;
        rrect(g, 18, y, w - 36, sh - 8, 8, shade(P.blue, -0.3));
        rrect(g, 18, y + sh - 14, w - 36, 6, 3, P.white, 0.5);
      }
      // items
      const y1 = 20 + sh - 14;
      rrect(g, 30, y1 - 34, 30, 34, 6, P.coral);
      rrect(g, 66, y1 - 24, 40, 24, 6, P.yellow);
      circle(g, 135, y1 - 14, 14, P.green);
      const y2 = 20 + sh * 2 - 14;
      rrect(g, 30, y2 - 40, 24, 40, 8, P.orange);
      rrect(g, 60, y2 - 30, 52, 30, 6, P.mint);
      rrect(g, 118, y2 - 22, 34, 22, 6, P.pink);
      const y3 = 20 + sh * 3 - 14;
      rrect(g, 28, y3 - 30, 60, 30, 6, P.wood);
      rrect(g, 96, y3 - 40, 26, 40, 8, P.lilac);
      const y4 = 20 + sh * 4 - 14;
      rrect(g, 34, y4 - 28, 90, 28, 8, P.sky);
      circle(g, 146, y4 - 12, 12, P.gold);
    },
  },

  box: {
    w: 130,
    h: 110,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 3, w * 0.46, 6);
      rrectShaded(g, 4, 10, w - 8, h - 18, 12, P.wood);
      // flaps
      rrect(g, 4, 6, w - 8, 22, 8, shade(P.wood, 0.15));
      // tape
      rrect(g, w / 2 - 14, 6, 28, h - 14, 4, shade(P.yellow, 0.1), 0.9);
      g.fillStyle(P.white, 0.4).fillRect(w / 2 - 10, 10, 4, h - 26);
      // label
      rrect(g, 16, h * 0.55, 30, 22, 4, P.white);
      g.fillStyle(P.coral, 1).fillRect(21, h * 0.55 + 6, 20, 3);
    },
  },

  mailbox: {
    w: 100,
    h: 180,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 4, w * 0.35, 5);
      // post
      rrectShaded(g, w / 2 - 9, h * 0.4, 18, h * 0.58, 6, P.brown);
      // box
      rrect(g, 4, 14, w - 8, h * 0.4, 22, shade(P.red, -0.2));
      rrect(g, 4, 14, w - 8, h * 0.4 - 6, 22, P.red);
      rrect(g, w * 0.55, 30, w * 0.34, h * 0.22, 8, shade(P.red, -0.25));
      g.fillStyle(P.white, 0.4).fillRoundedRect(14, 24, 28, 7, 3);
      // flag
      rrect(g, w - 12, 12, 8, 40, 3, P.yellow);
      rrect(g, w - 12, 12, 8, 12, 4, P.yellow);
      snowCap(g, 6, 4, w - 12);
    },
  },

  fir: {
    w: 210,
    h: 300,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 6, w * 0.4, 10);
      rrectShaded(g, w / 2 - 16, h * 0.82, 32, h * 0.16, 8, P.brown);
      // three tiers, bottom to top: [apex y, base y, width factor]
      const tiers: [number, number, number][] = [
        [0.4, 0.86, 1],
        [0.22, 0.64, 0.78],
        [0.06, 0.44, 0.56],
      ];
      for (const [apex, base, wf] of tiers) {
        const tw = w * wf;
        const x = w / 2 - tw / 2;
        const y = h * apex;
        const th = h * (base - apex);
        g.fillStyle(shade(P.green, -0.2), 1).fillTriangle(
          w / 2,
          y - 3,
          x,
          y + th,
          x + tw,
          y + th,
        );
        circle(g, x + 10, y + th - 8, 12, shade(P.green, -0.2));
        circle(g, x + tw - 10, y + th - 8, 12, shade(P.green, -0.2));
        g.fillStyle(P.green, 1).fillTriangle(
          w / 2,
          y,
          x + 4,
          y + th - 8,
          x + tw - 4,
          y + th - 8,
        );
        // snow
        g.fillStyle(P.snow, 1).fillTriangle(
          w / 2,
          y,
          w / 2 - tw * 0.2,
          y + th * 0.4,
          w / 2 + tw * 0.2,
          y + th * 0.4,
        );
        circle(g, w / 2 - tw * 0.2, y + th * 0.4, 6, P.snow);
        circle(g, w / 2 + tw * 0.2, y + th * 0.4, 6, P.snow);
        circle(g, w / 2 + tw * 0.14, y + th * 0.72, 7, P.snow);
        circle(g, w / 2 - tw * 0.24, y + th * 0.8, 6, P.snow);
      }
      star(g, w / 2, h * 0.05, 11, 5, 5, P.yellow);
    },
  },

  cloud: {
    w: 220,
    h: 110,
    draw: (g, w, h) => {
      const parts: [number, number, number][] = [
        [0.25, 0.62, 0.26],
        [0.5, 0.42, 0.34],
        [0.76, 0.6, 0.26],
      ];
      rrect(
        g,
        w * 0.08,
        h * 0.5,
        w * 0.84,
        h * 0.42,
        h * 0.21,
        shade(P.sky, 0.25),
      );
      for (const [px, py, pr] of parts) {
        circle(g, w * px, h * py + 4, h * pr, shade(P.sky, 0.25));
      }
      for (const [px, py, pr] of parts) {
        circle(g, w * px, h * py, h * pr, P.white);
      }
      rrect(g, w * 0.1, h * 0.5, w * 0.8, h * 0.38, h * 0.19, P.white);
      glint(g, w * 0.4, h * 0.26, 5);
    },
  },

  plantpot: {
    w: 130,
    h: 190,
    draw: (g, w, h) => {
      groundShadow(g, w / 2, h - 4, w * 0.38, 6);
      // leaves
      const leaves: [number, number, number, number][] = [
        [0.5, 0.2, 0.2, 0.14],
        [0.28, 0.32, 0.22, 0.11],
        [0.72, 0.3, 0.22, 0.11],
        [0.4, 0.46, 0.2, 0.1],
        [0.62, 0.46, 0.2, 0.1],
      ];
      for (const [lx, ly, rx, ry] of leaves) {
        ellipse(g, w * lx, h * ly + 3, w * rx, h * ry, shade(P.green, -0.2));
        ellipse(g, w * lx, h * ly, w * rx, h * ry, P.leaf);
      }
      glint(g, w * 0.46, h * 0.16, 4);
      // pot
      rrectShaded(g, 12, h * 0.52, w - 24, h * 0.46, 18, P.orange);
      rrect(g, 6, h * 0.5, w - 12, h * 0.12, 8, shade(P.orange, 0.12));
      circle(g, w / 2, h * 0.75, 8, P.white, 0.5);
    },
  },

  railing: {
    w: 780,
    h: 160,
    draw: (g, w, h) => {
      const rail = P.white;
      // posts / bars
      for (let x = 20; x < w - 10; x += 52) {
        rrect(g, x, 26, 18, h - 30, 9, shade(rail, -0.18));
        rrect(g, x, 26, 14, h - 34, 9, rail);
      }
      // top & bottom rails
      rrect(g, 0, 6, w, 28, 14, shade(rail, -0.18));
      rrect(g, 0, 6, w, 22, 14, shade(P.sky, 0.3));
      g.fillStyle(P.white, 0.7).fillRoundedRect(14, 10, w - 28, 5, 3);
      rrect(g, 0, h - 26, w, 22, 11, shade(rail, -0.18));
      rrect(g, 0, h - 26, w, 17, 11, rail);
      // snow on top
      for (let x = 30; x < w - 30; x += 110) {
        ellipse(g, x + 30, 8, 40, 7, P.snow);
      }
    },
  },
};
