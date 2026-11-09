import Phaser from "phaser";
import { COLORS, FONT, H, W } from "../config";
import { P } from "../art/palette";
import * as sound from "../sound";
import { resetState } from "../state";
import { bubble, button, panel } from "../ui";

export class SettingsScene extends Phaser.Scene {
  private soundBtnLabel!: Phaser.GameObjects.Text;
  private confirmLayer: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("Settings");
  }

  create(): void {
    // the scene instance is reused between openings: drop references to destroyed objects
    this.confirmLayer = [];

    this.add
      .rectangle(0, 0, W, H, 0x000000, 0.65)
      .setOrigin(0)
      .setInteractive();
    panel(this, W / 2, H / 2, W - 80, 900, COLORS.panel, 48);

    this.add
      .text(W / 2, H / 2 - 370, "⚙️ Налаштування", {
        fontSize: "52px",
        fontFamily: FONT,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#3d2c4e",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    bubble(this, W - 100, H / 2 - 370, 45, COLORS.accent, "✕", () =>
      this.close(),
    );

    const sound1 = button(
      this,
      W / 2,
      H / 2 - 200,
      560,
      130,
      this.soundLabel(),
      COLORS.green,
      () => {
        sound.toggleMute();
        this.soundBtnLabel.setText(this.soundLabel());
      },
      40,
    );
    this.soundBtnLabel = sound1.t;

    button(
      this,
      W / 2,
      H / 2 - 40,
      560,
      130,
      "❓ Як заробити ⭐",
      P.blue,
      () => {
        this.resumeRoom();
        this.scene.get("Room").events.emit("show-star-help");
        this.scene.stop();
      },
      40,
    );

    button(
      this,
      W / 2,
      H / 2 + 200,
      560,
      130,
      "🗑️ Почати заново",
      P.red,
      () => this.openConfirm(),
      40,
    );
  }

  private soundLabel(): string {
    return sound.isMuted() ? "🔇 Звук вимкнено" : "🔊 Звук";
  }

  private openConfirm(): void {
    if (this.confirmLayer.length > 0) return;
    const layer = this.confirmLayer;
    layer.push(
      this.add
        .rectangle(0, 0, W, H, 0x000000, 0.6)
        .setOrigin(0)
        .setInteractive(),
      panel(this, W / 2, H / 2, 640, 560, P.cream, 44),
      this.add
        .text(
          W / 2,
          H / 2 - 120,
          "Стерти все і почати заново?\nМонетки, предмети й кімнати зникнуть.",
          {
            fontSize: "34px",
            fontFamily: FONT,
            fontStyle: "bold",
            color: "#3d2c4e",
            align: "center",
            wordWrap: { width: 560 },
          },
        )
        .setOrigin(0.5),
    );
    let resetDone = false;
    const yes = button(
      this,
      W / 2,
      H / 2 + 50,
      520,
      110,
      "Так, стерти все",
      P.red,
      () => {
        if (resetDone) return;
        resetDone = true;
        resetState();
        this.resumeRoom();
        this.scene.get("Room").events.emit("game-reset");
        this.scene.stop();
      },
      36,
    );
    const no = button(
      this,
      W / 2,
      H / 2 + 190,
      520,
      110,
      "Ні, залишити",
      P.green,
      () => {
        this.time.delayedCall(0, () => {
          layer.forEach((o) => o.destroy());
          this.confirmLayer = [];
        });
      },
      36,
    );
    layer.push(yes.c, no.c);
  }

  private resumeRoom(): void {
    this.scene.resume("Room");
  }

  private close(): void {
    this.resumeRoom();
    this.scene.get("Room").events.emit("settings-closed");
    this.scene.stop();
  }
}
