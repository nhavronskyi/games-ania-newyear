import type Phaser from "phaser";

/** Draws into a Graphics whose local space is (0,0)..(w,h). Baked once to a texture by BootScene. */
export type ArtFn = (
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
) => void;

export interface ArtDef {
  w: number;
  h: number;
  draw: ArtFn;
}

/** Item textures are baked at this multiple of ItemDef.size (square) and displayed at ItemDef.size. */
export const ITEM_TEX_SCALE = 1.5;
