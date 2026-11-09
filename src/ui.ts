import Phaser from "phaser";
import { FONT } from "./config";
import * as sound from "./sound";

export interface Btn {
  c: Phaser.GameObjects.Container;
  r: Phaser.GameObjects.Rectangle;
  t: Phaser.GameObjects.Text;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill: number,
  onClick: () => void,
  fontSize = 34,
): Btn {
  const c = scene.add.container(x, y);
  const r = scene.add
    .rectangle(0, 0, w, h, fill)
    .setStrokeStyle(4, 0xffffff, 0.35);
  const t = scene.add
    .text(0, 0, label, {
      fontSize: `${fontSize}px`,
      fontFamily: FONT,
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);
  c.add([r, t]);
  r.setInteractive({ useHandCursor: true });
  r.on("pointerdown", () => c.setScale(0.96));
  r.on("pointerout", () => c.setScale(1));
  r.on("pointerup", () => {
    c.setScale(1);
    sound.tap();
    onClick();
  });
  return { c, r, t };
}
