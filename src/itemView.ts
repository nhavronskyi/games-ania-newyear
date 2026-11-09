import Phaser from "phaser";
import { FONT } from "./config";
import type { ItemDef } from "./items";

export type ItemVisual = Phaser.GameObjects.Image | Phaser.GameObjects.Text;

/** Baked item art at `size` x `size`; falls back to the emoji when the texture is missing. */
export function itemVisual(
  scene: Phaser.Scene,
  x: number,
  y: number,
  def: ItemDef,
  size: number,
): ItemVisual {
  const key = `item:${def.id}`;
  if (scene.textures.exists(key)) {
    return scene.add.image(x, y, key).setDisplaySize(size, size);
  }
  return scene.add
    .text(x, y, def.emoji, { fontSize: `${size}px`, fontFamily: FONT })
    .setOrigin(0.5);
}
