import Phaser from "phaser";
import { FONT } from "./config";
import { P, shade } from "./art/palette";
import * as sound from "./sound";

export interface Btn {
  c: Phaser.GameObjects.Container;
  /** Invisible hit rectangle; setFillStyle(color) is patched to recolour the visual. */
  r: Phaser.GameObjects.Rectangle;
  t: Phaser.GameObjects.Text;
  setColor(color: number): void;
}

export interface Bubble {
  c: Phaser.GameObjects.Container;
  t: Phaser.GameObjects.Text;
  setColor(color: number): void;
}

const STROKE = "#3d2c4e";
const LIP = 8;
const SINK = 6;

function labelStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontSize: `${fontSize}px`,
    fontFamily: FONT,
    fontStyle: "bold",
    color: "#ffffff",
    align: "center",
    stroke: STROKE,
    strokeThickness: 6,
  };
}

function softShadow(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  radius: number,
  dy: number,
): void {
  g.fillStyle(0x000000, 0.1);
  g.fillRoundedRect(-w / 2 - 6, -h / 2 + dy - 2, w + 12, h + 12, radius + 6);
  g.fillStyle(0x000000, 0.14);
  g.fillRoundedRect(-w / 2, -h / 2 + dy + 2, w, h + 4, radius);
}

/** Press = sink into the lip + squash; release = spring back. */
function spring(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
  moving: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)[],
  hit: Phaser.GameObjects.Shape,
  onClick: () => void,
): void {
  const items = moving;
  const rest = items.map((o) => o.y);
  const setY = (dy: number): void =>
    items.forEach((o, i) => {
      o.y = rest[i] + dy;
    });
  const down = (): void => {
    scene.tweens.killTweensOf([c, ...moving]);
    c.setScale(0.96);
    setY(SINK);
  };
  const up = (): void => {
    scene.tweens.killTweensOf([c, ...moving]);
    c.setScale(0.96);
    scene.tweens.add({
      targets: c,
      scale: 1,
      duration: 260,
      ease: "Back.easeOut",
    });
    items.forEach((o, i) =>
      scene.tweens.add({
        targets: o,
        y: rest[i],
        duration: 200,
        ease: "Back.easeOut",
      }),
    );
  };
  hit.setInteractive({ useHandCursor: true });
  let armed = false;
  hit.on("pointerdown", () => {
    armed = true;
    down();
  });
  hit.on("pointerout", () => {
    if (!armed) return;
    armed = false;
    up();
  });
  hit.on("pointerup", () => {
    if (!armed) return;
    armed = false;
    up();
    sound.tap();
    onClick();
  });
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
  const radius = Math.min(h / 2, 32);
  const bodyH = h - LIP;
  const c = scene.add.container(x, y);
  const shadow = scene.add.graphics();
  softShadow(shadow, w, h, radius, 4);
  const g = scene.add.graphics();
  const r = scene.add.rectangle(0, 0, w, h, fill, 0.001);
  const t = scene.add
    .text(0, -LIP / 2, label, labelStyle(fontSize))
    .setOrigin(0.5);

  const draw = (color: number): void => {
    g.clear();
    g.fillStyle(shade(color, -0.3), 1);
    g.fillRoundedRect(-w / 2, -h / 2 + LIP, w, bodyH, radius);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, bodyH, radius);
    g.fillStyle(shade(color, 0.35), 0.55);
    g.fillRoundedRect(
      -w / 2 + radius * 0.6,
      -h / 2 + 6,
      w - radius * 1.2,
      Math.max(6, bodyH * 0.2),
      Math.max(3, bodyH * 0.1),
    );
  };
  draw(fill);
  r.setFillStyle = (color?: number): Phaser.GameObjects.Rectangle => {
    if (color !== undefined) draw(color);
    return r;
  };

  c.add([shadow, g, r, t]);
  spring(scene, c, [g, t], r, onClick);
  return { c, r, t, setColor: draw };
}

export function setBtnColor(btn: Btn, color: number): void {
  btn.setColor(color);
}

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  radius = 40,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  softShadow(g, w, h, radius, 8);
  g.fillStyle(shade(color, -0.25), 1);
  g.fillRoundedRect(-w / 2, -h / 2 + 8, w, h - 8, radius);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h - 8, radius);
  g.lineStyle(4, shade(color, 0.3), 0.6);
  g.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 12, radius);
  return g;
}

export function pill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
): { c: Phaser.GameObjects.Container; t: Phaser.GameObjects.Text } {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  softShadow(g, w, h, h / 2, 4);
  g.fillStyle(shade(color, -0.25), 1);
  g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h - 4, h / 2);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h - 4, h / 2);
  g.fillStyle(P.white, 0.3);
  g.fillRoundedRect(
    -w / 2 + h * 0.4,
    -h / 2 + 5,
    w - h * 0.8,
    h * 0.18,
    h * 0.09,
  );
  const t = scene.add
    .text(0, -2, "", labelStyle(Math.round(h * 0.52)))
    .setOrigin(0.5);
  c.add([g, t]);
  return { c, t };
}

export function bubble(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
  color: number,
  label: string,
  onClick: () => void,
  fontSize = 40,
): Bubble {
  const c = scene.add.container(x, y);
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.14);
  shadow.fillCircle(0, 8, r + 2);
  const g = scene.add.graphics();
  const hit = scene.add.circle(0, 0, r, 0xffffff, 0.001);
  const t = scene.add
    .text(0, -LIP / 2, label, labelStyle(fontSize))
    .setOrigin(0.5);
  const draw = (col: number): void => {
    g.clear();
    g.fillStyle(shade(col, -0.3), 1);
    g.fillCircle(0, LIP / 2, r);
    g.fillStyle(col, 1);
    g.fillCircle(0, -LIP / 2, r);
    g.fillStyle(shade(col, 0.35), 0.55);
    g.fillEllipse(0, -LIP / 2 - r * 0.55, r * 1.1, r * 0.3);
  };
  draw(color);
  c.add([shadow, g, hit, t]);
  spring(scene, c, [g, t], hit, onClick);
  return { c, t, setColor: draw };
}
