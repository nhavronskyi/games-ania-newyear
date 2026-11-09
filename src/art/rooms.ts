import type Phaser from "phaser";
import type { RoomId } from "../rooms";
import { circle, ellipse, rrect, star } from "./draw";
import { P, shade } from "./palette";
import type { ArtFn } from "./types";

/** Room background size: W x (ROOM_BOTTOM - ROOM_TOP) = 780 x 680. Wall/floor boundary is at y = FLOOR_Y - ROOM_TOP = 570. */
export const ROOM_BG_W = 780;
export const ROOM_BG_H = 680;
export const ROOM_BG_FLOOR = 570;

type G = Phaser.GameObjects.Graphics;

/** Vertical banding between two colours (smooth-ish gradient). */
function bands(
  g: G,
  y0: number,
  y1: number,
  top: number,
  bottom: number,
  steps: number,
): void {
  const h = (y1 - y0) / steps;
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const r = Math.round(
      ((top >> 16) & 255) * (1 - t) + ((bottom >> 16) & 255) * t,
    );
    const gr = Math.round(
      ((top >> 8) & 255) * (1 - t) + ((bottom >> 8) & 255) * t,
    );
    const b = Math.round((top & 255) * (1 - t) + (bottom & 255) * t);
    g.fillStyle((r << 16) | (gr << 8) | b, 1).fillRect(
      0,
      y0 + i * h,
      ROOM_BG_W,
      h + 1,
    );
  }
}

function baseboard(g: G, color: number): void {
  const y = ROOM_BG_FLOOR;
  g.fillStyle(shade(color, -0.2), 1).fillRect(0, y - 8, ROOM_BG_W, 26);
  g.fillStyle(color, 1).fillRect(0, y - 8, ROOM_BG_W, 18);
  g.fillStyle(P.white, 0.35).fillRect(0, y - 8, ROOM_BG_W, 3);
}

function vignette(g: G): void {
  for (let i = 0; i < 8; i++) {
    const w = 90 - i * 11;
    const a = 0.03;
    g.fillStyle(0x000000, a).fillRect(0, 0, w, ROOM_BG_H);
    g.fillStyle(0x000000, a).fillRect(ROOM_BG_W - w, 0, w, ROOM_BG_H);
  }
}

function floorShade(g: G): void {
  // lighter near wall, darker toward bottom
  const steps = 6;
  const h = (ROOM_BG_H - ROOM_BG_FLOOR - 10) / steps;
  for (let i = 0; i < steps; i++) {
    g.fillStyle(0x000000, 0.012 + i * 0.012).fillRect(
      0,
      ROOM_BG_FLOOR + 10 + i * h,
      ROOM_BG_W,
      h + 1,
    );
  }
}

const bedroom: ArtFn = (g) => {
  const wall = 0xffe3d3;
  const floor = P.wood;
  g.fillStyle(wall, 1).fillRect(0, 0, ROOM_BG_W, ROOM_BG_FLOOR);
  // vertical stripes
  for (let x = 0; x < ROOM_BG_W; x += 80) {
    g.fillStyle(shade(wall, 0.4), 0.55).fillRect(x, 0, 40, ROOM_BG_FLOOR);
  }
  // dots
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 13; col++) {
      const x = 20 + col * 60 + (row % 2) * 30;
      const y = 50 + row * 75;
      if (y < ROOM_BG_FLOOR - 40) circle(g, x, y, 6, P.pink, 0.45);
    }
  }
  // soft wall glow
  ellipse(g, 390, 220, 330, 200, P.white, 0.12);
  baseboard(g, P.white);
  // floor planks
  g.fillStyle(floor, 1).fillRect(0, ROOM_BG_FLOOR + 10, ROOM_BG_W, ROOM_BG_H);
  const ph = 36;
  for (let i = 0; i * ph + ROOM_BG_FLOOR + 10 < ROOM_BG_H; i++) {
    const y = ROOM_BG_FLOOR + 10 + i * ph;
    g.fillStyle(shade(floor, i % 2 === 0 ? 0.08 : -0.03), 1).fillRect(
      0,
      y,
      ROOM_BG_W,
      ph,
    );
    g.fillStyle(shade(floor, -0.2), 0.8).fillRect(0, y, ROOM_BG_W, 2);
    const off = (i % 2) * 90;
    for (let x = off; x < ROOM_BG_W; x += 180) {
      g.fillStyle(shade(floor, -0.2), 0.7).fillRect(x, y, 2, ph);
    }
  }
  floorShade(g);
  vignette(g);
};

const kitchen: ArtFn = (g) => {
  const wall = 0xdff3e4;
  g.fillStyle(shade(P.mint, 0.5), 1).fillRect(0, 0, ROOM_BG_W, ROOM_BG_FLOOR);
  // upper scallop band
  g.fillStyle(wall, 1).fillRect(0, 0, ROOM_BG_W, 200);
  for (let x = 0; x < ROOM_BG_W + 40; x += 40) {
    circle(g, x, 200, 22, wall);
  }
  // little flowers on the upper band
  for (let x = 40; x < ROOM_BG_W; x += 80) {
    circle(g, x, 90, 8, P.white, 0.7);
    circle(g, x, 90, 3, P.yellow);
  }
  // tiles on the lower wall
  const ts = 60;
  for (let row = 0; row * ts + 215 < ROOM_BG_FLOOR; row++) {
    for (let col = 0; col < 14; col++) {
      const x = col * ts;
      const y = 215 + row * ts;
      const hh = Math.min(ts, ROOM_BG_FLOOR - y);
      rrect(
        g,
        x + 2,
        y + 2,
        ts - 4,
        hh - 4,
        8,
        (row + col) % 2 === 0 ? shade(P.mint, 0.45) : shade(P.mint, 0.3),
      );
      g.fillStyle(P.white, 0.45).fillRoundedRect(x + 8, y + 7, 18, 6, 3);
    }
  }
  baseboard(g, shade(P.mint, -0.05));
  // checker tile floor
  const fs = 60;
  for (let row = 0; ROOM_BG_FLOOR + 10 + row * fs < ROOM_BG_H; row++) {
    for (let col = 0; col < 14; col++) {
      const dark = (row + col) % 2 === 0;
      g.fillStyle(dark ? 0xd6bf98 : 0xf0e2c4, 1).fillRect(
        col * fs,
        ROOM_BG_FLOOR + 10 + row * fs,
        fs,
        fs,
      );
    }
  }
  floorShade(g);
  vignette(g);
};

const balcony: ArtFn = (g) => {
  // lighter outdoors
  bands(g, 0, ROOM_BG_FLOOR, 0xe3f3ff, 0xbfe0fb, 10);
  // soft clouds
  for (const [x, y, s] of [
    [130, 90, 1],
    [480, 60, 1.2],
    [650, 140, 0.9],
  ] as const) {
    circle(g, x, y, 26 * s, P.white, 0.8);
    circle(g, x + 28 * s, y + 6, 20 * s, P.white, 0.8);
    circle(g, x - 28 * s, y + 8, 18 * s, P.white, 0.8);
  }
  // brick wall at bottom of wall zone (parapet), y 380..570
  const top = 380;
  const brick = 0xe7a99a;
  g.fillStyle(brick, 1).fillRect(0, top, ROOM_BG_W, ROOM_BG_FLOOR - top);
  const bh = 32;
  const bw = 80;
  for (let row = 0; top + row * bh < ROOM_BG_FLOOR; row++) {
    const off = (row % 2) * (bw / 2);
    for (let x = -bw; x < ROOM_BG_W + bw; x += bw) {
      rrect(
        g,
        x + off + 2,
        top + row * bh + 2,
        bw - 4,
        bh - 4,
        6,
        shade(brick, row % 3 === 0 ? 0.08 : 0),
        1,
      );
    }
  }
  // cap
  rrect(g, -10, top - 14, ROOM_BG_W + 20, 24, 10, shade(brick, 0.25));
  g.fillStyle(P.white, 0.35).fillRoundedRect(
    10,
    top - 11,
    ROOM_BG_W - 20,
    5,
    3,
  );
  baseboard(g, shade(brick, -0.1));
  // concrete floor
  g.fillStyle(0xa9aeb9, 1).fillRect(
    0,
    ROOM_BG_FLOOR + 10,
    ROOM_BG_W,
    ROOM_BG_H,
  );
  for (let x = 0; x < ROOM_BG_W; x += 130) {
    g.fillStyle(0x8d929e, 0.5).fillRect(x, ROOM_BG_FLOOR + 10, 3, ROOM_BG_H);
  }
  g.fillStyle(0x8d929e, 0.5).fillRect(0, ROOM_BG_FLOOR + 70, ROOM_BG_W, 3);
  floorShade(g);
  vignette(g);
};

const garage: ArtFn = (g) => {
  const wall = 0xd9dbe2;
  g.fillStyle(wall, 1).fillRect(0, 0, ROOM_BG_W, ROOM_BG_FLOOR);
  // vertical panels
  const pw = 130;
  for (let i = 0; i * pw < ROOM_BG_W; i++) {
    const x = i * pw;
    g.fillStyle(shade(wall, i % 2 === 0 ? 0.08 : -0.03), 1).fillRect(
      x,
      0,
      pw,
      ROOM_BG_FLOOR,
    );
    g.fillStyle(shade(P.lilac, -0.2), 0.35).fillRect(x, 0, 3, ROOM_BG_FLOOR);
    g.fillStyle(P.white, 0.4).fillRect(x + 3, 0, 2, ROOM_BG_FLOOR);
  }
  // horizontal stripe + lilac band
  g.fillStyle(P.lilac, 0.55).fillRect(0, 300, ROOM_BG_W, 22);
  g.fillStyle(P.white, 0.4).fillRect(0, 300, ROOM_BG_W, 4);
  g.fillStyle(shade(wall, -0.15), 0.5).fillRect(0, 100, ROOM_BG_W, 3);
  baseboard(g, shade(P.lilac, 0.1));
  // concrete floor
  g.fillStyle(0x7e8392, 1).fillRect(
    0,
    ROOM_BG_FLOOR + 10,
    ROOM_BG_W,
    ROOM_BG_H,
  );
  for (let x = 0; x < ROOM_BG_W; x += 195) {
    g.fillStyle(0x666b79, 0.6).fillRect(x, ROOM_BG_FLOOR + 10, 3, ROOM_BG_H);
  }
  g.fillStyle(0x666b79, 0.6).fillRect(0, ROOM_BG_FLOOR + 85, ROOM_BG_W, 3);
  // yellow safety line
  g.fillStyle(P.yellow, 0.7).fillRect(0, ROOM_BG_FLOOR + 30, ROOM_BG_W, 6);
  floorShade(g);
  vignette(g);
};

const garden: ArtFn = (g) => {
  bands(g, 0, ROOM_BG_FLOOR, P.night, 0x6d8fd8, 12);
  // stars
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 34; i++) {
    const x = rnd() * ROOM_BG_W;
    const y = rnd() * 330;
    if (i % 4 === 0) star(g, x, y, 9, 4, 4, P.yellow);
    else circle(g, x, y, 1.5 + rnd() * 2, P.white, 0.85);
  }
  // moon
  circle(g, 640, 90, 36, shade(P.cream, 0), 1);
  circle(g, 654, 80, 32, shade(P.night, 0.05), 1);
  // snowy hills
  ellipse(g, 160, 560, 330, 150, shade(P.sky, 0.2));
  ellipse(g, 600, 575, 360, 130, shade(P.sky, 0.4));
  ellipse(g, 380, 590, 300, 90, P.snow);
  baseboard(g, shade(P.snow, -0.05));
  // snow floor
  g.fillStyle(P.snow, 1).fillRect(0, ROOM_BG_FLOOR + 10, ROOM_BG_W, ROOM_BG_H);
  for (let i = 0; i < 5; i++) {
    ellipse(
      g,
      100 + i * 170,
      640 + (i % 2) * 20,
      120,
      18,
      shade(P.sky, 0.45),
      0.5,
    );
  }
  for (let i = 0; i < 24; i++) {
    glintDot(g, rnd() * ROOM_BG_W, ROOM_BG_FLOOR + 20 + rnd() * 90);
  }
  floorShade(g);
  vignette(g);
};

function glintDot(g: G, x: number, y: number): void {
  circle(g, x, y, 2, P.white, 0.9);
}

export const ROOM_BG: Record<RoomId, ArtFn> = {
  bedroom,
  kitchen,
  balcony,
  garage,
  garden,
};
