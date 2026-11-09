import Phaser from "phaser";
import { COLORS, FONT, H, W } from "../config";
import { P } from "../art/palette";
import { CATEGORIES, Category, ITEMS } from "../items";
import { itemVisual } from "../itemView";
import * as sound from "../sound";
import { addOwned, ownedCount, save, state } from "../state";
import { strokeText } from "../style";
import { bubble, button, panel, pill } from "../ui";

const CARD_W = 340;
const CARD_H = 200;
const CARD_GAP = 20;
const GRID_Y = 400;

export class ShopScene extends Phaser.Scene {
  private cat: Category = "newyear";
  private grid: Phaser.GameObjects.GameObject[] = [];
  private coinPill!: ReturnType<typeof pill>;
  private tabRects = new Map<Category, Phaser.GameObjects.Rectangle>();

  constructor() {
    super("Shop");
  }

  create(): void {
    // the scene instance is reused between openings: drop references to destroyed objects
    this.grid = [];
    this.tabRects.clear();
    this.cat = "newyear";

    // dim + block input to the room below
    this.add
      .rectangle(0, 0, W, H, 0x000000, 0.65)
      .setOrigin(0)
      .setInteractive();
    panel(this, W / 2, H / 2, W - 40, H - 120, COLORS.panel, 48);

    this.add.text(60, 110, "🛍️ Магазин", strokeText(54)).setOrigin(0, 0.5);
    this.coinPill = pill(this, W - 290, 110, 200, 66, COLORS.gold);
    bubble(this, W - 100, 110, 44, COLORS.accent, "✕", () => this.close(), 40);

    const tabW = 160;
    const gap = 10;
    const x0 =
      (W - (CATEGORIES.length * tabW + (CATEGORIES.length - 1) * gap)) / 2 +
      tabW / 2;
    CATEGORIES.forEach((c, i) => {
      const b = button(
        this,
        x0 + i * (tabW + gap),
        250,
        tabW,
        100,
        `${c.icon}\n${c.name}`,
        COLORS.panelLight,
        () => {
          this.cat = c.id;
          this.render();
        },
        26,
      );
      this.tabRects.set(c.id, b.r);
    });

    this.render();
  }

  private render(): void {
    this.grid.forEach((o) => o.destroy());
    this.grid = [];
    this.coinPill.t.setText(`🪙 ${state.coins}`);
    this.tabRects.forEach((r, id) =>
      r.setFillStyle(id === this.cat ? COLORS.accent : COLORS.panelLight),
    );

    ITEMS.filter((i) => i.category === this.cat).forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 40 + CARD_W / 2 + col * (CARD_W + CARD_GAP) + 10;
      const y = GRID_Y + CARD_H / 2 + row * (CARD_H + CARD_GAP);

      const cardC = this.add.container(x, y);
      const card = panel(this, 0, 0, CARD_W, CARD_H, P.cream, 36);
      const disc = this.add.circle(-105, -8, 66, COLORS.panelLight, 0.35);
      const icon = itemVisual(this, -105, -8, item, 100);
      const name = this.add
        .text(65, -58, item.name, {
          fontSize: "32px",
          fontFamily: FONT,
          fontStyle: "bold",
          color: "#3d2c4e",
        })
        .setOrigin(0.5);
      const price = pill(this, 65, 0, 150, 52, COLORS.gold);
      price.t.setText(`🪙 ${item.price}`);
      const have = this.add
        .text(
          65,
          55,
          ownedCount(item.id) > 0
            ? `є: ${ownedCount(item.id)}`
            : "тапни, щоб купити",
          {
            fontSize: "22px",
            fontFamily: FONT,
            fontStyle: "bold",
            color: "#7a6a99",
          },
        )
        .setOrigin(0.5);
      const hit = this.add
        .rectangle(0, 0, CARD_W, CARD_H, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      cardC.add([card, disc, icon, name, price.c, have, hit]);

      hit.on("pointerdown", () => {
        this.tweens.killTweensOf(cardC);
        cardC.setScale(0.97);
      });
      hit.on("pointerout", () => cardC.setScale(1));
      hit.on("pointerup", () => {
        this.tweens.add({
          targets: cardC,
          scale: 1,
          duration: 200,
          ease: "Back.easeOut",
        });
        if (state.coins >= item.price) {
          state.coins -= item.price;
          state.purchases += 1;
          addOwned(item.id);
          save();
          sound.buy();
          const s = icon.scaleX;
          this.tweens.add({
            targets: icon,
            scale: s * 1.35,
            angle: 10,
            yoyo: true,
            duration: 140,
            ease: "Back.easeOut",
            onComplete: () => icon.setAngle(0),
          });
          this.tweens.killTweensOf(this.coinPill.c);
          this.coinPill.c.setScale(1);
          this.tweens.add({
            targets: this.coinPill.c,
            scale: 1.25,
            yoyo: true,
            duration: 130,
            ease: "Back.easeOut",
          });
          this.coinPill.t.setText(`🪙 ${state.coins}`);
          have.setText(`є: ${ownedCount(item.id)}`);
        } else {
          sound.fail();
          this.tweens.killTweensOf(this.coinPill.c);
          this.coinPill.c.x = W - 290;
          this.tweens.add({
            targets: this.coinPill.c,
            x: W - 290 + 12,
            yoyo: true,
            repeat: 3,
            duration: 50,
            onComplete: () => (this.coinPill.c.x = W - 290),
          });
          this.coinPill.t.setColor("#ff6b6b");
          this.time.delayedCall(500, () => this.coinPill.t.setColor("#ffffff"));
        }
      });
      this.grid.push(cardC);
    });
  }

  private close(): void {
    this.scene.resume("Room");
    this.scene.get("Room").events.emit("shop-closed");
    this.scene.stop();
  }
}
