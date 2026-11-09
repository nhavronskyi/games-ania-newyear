import Phaser from "phaser";
import { DECOR_ART } from "../art/decor";
import { HERO_ART } from "../art/hero";
import { ITEM_ART_A } from "../art/items-a";
import { ITEM_ART_B } from "../art/items-b";
import { ROOM_BG, ROOM_BG_H, ROOM_BG_W } from "../art/rooms";
import { ITEM_TEX_SCALE } from "../art/types";
import type { ArtFn } from "../art/types";
import { ITEMS } from "../items";

const ITEM_ART: Record<string, ArtFn> = { ...ITEM_ART_A, ...ITEM_ART_B };

/** Loads the font, bakes every procedural drawing into a texture, then starts the game. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const fontReady = Promise.all([
      document.fonts.load('800 32px "Nunito"'),
      document.fonts.load('900 32px "Nunito"'),
    ]).catch(() => undefined); // never block the game on a font failure
    const timeout = new Promise((r) => setTimeout(r, 2500));
    void Promise.race([fontReady, timeout]).then(() => {
      this.bakeAll();
      this.scene.start("Room");
    });
  }

  private bake(key: string, w: number, h: number, draw: ArtFn): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private bakeAll(): void {
    for (const item of ITEMS) {
      const draw = ITEM_ART[item.id];
      if (!draw) continue; // falls back to emoji in the scenes
      const s = Math.round(item.size * ITEM_TEX_SCALE);
      this.bake(`item:${item.id}`, s, s, draw);
    }
    for (const [key, def] of Object.entries(DECOR_ART))
      this.bake(`decor:${key}`, def.w, def.h, def.draw);
    for (const [key, def] of Object.entries(HERO_ART))
      this.bake(`hero:${key}`, def.w, def.h, def.draw);
    for (const [id, draw] of Object.entries(ROOM_BG))
      this.bake(`room:${id}`, ROOM_BG_W, ROOM_BG_H, draw);
  }
}
