import Phaser from "phaser";
import { COLORS, FONT, H, W } from "../config";
import { GARLAND_MIN_LEN } from "../goals";
import * as sound from "../sound";
import { save, state } from "../state";
import { P, shade } from "../art/palette";
import { strokeText } from "../style";
import { bubble, button, panel, pill } from "../ui";

// Fully saturated colors; unlit bulbs stay clearly coloured, lit ones add a glow and grow slightly.
const BULB_COLORS = [
  0xff2d2d, 0xffd400, 0x22e05a, 0x1aa7ff, 0xa64dff, 0xff3fb0,
];
const UNLIT_ALPHA = 0.75;
const BULB_R = 80;
const COLS = [170, 390, 610];
const ROWS = [560, 860];
const MAX_LEN = 12;
const STEP_MS = 650;
const STEP_MS_AFTER_MISTAKE = 850;
const RECORD_BONUS = 10;

type Phase = "show" | "input" | "over";

/** Calm memory game: watch the bulbs light up, repeat them. No timer, one free retry per length. */
export class GarlandScene extends Phaser.Scene {
  private bulbs: {
    lit: Phaser.GameObjects.Arc;
    glow: Phaser.GameObjects.Arc;
    hi: Phaser.GameObjects.Graphics;
  }[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private dotsText!: Phaser.GameObjects.Text;
  private earnedText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private coinPill!: ReturnType<typeof pill>;
  private coinText!: Phaser.GameObjects.Text;
  private overObjs: Phaser.GameObjects.GameObject[] = [];

  private phase: Phase = "show";
  private seq: number[] = [];
  private pos = 0;
  private retryUsed = false;
  private stepMs = STEP_MS;
  private earned = 0;
  private reached = 0; // longest sequence completed this game
  private prevBest = 0;
  private settled = false;

  constructor() {
    super("Garland");
  }

  create(): void {
    this.bulbs = [];
    this.overObjs = [];

    this.add
      .rectangle(0, 0, W, H, 0x000000, 0.45)
      .setOrigin(0)
      .setInteractive();
    panel(this, W / 2, H / 2, W - 40, H - 120, COLORS.panel, 48);

    this.add.text(60, 110, "💡 Гірлянда", strokeText(54)).setOrigin(0, 0.5);
    this.coinPill = pill(this, W - 290, 110, 200, 66, COLORS.gold);
    this.coinText = this.coinPill.t;
    bubble(this, W - 100, 110, 44, COLORS.accent, "✕", () => this.close(), 40);

    this.statusText = this.add
      .text(W / 2, 330, "", strokeText(50))
      .setOrigin(0.5);

    this.drawWires();
    for (let i = 0; i < BULB_COLORS.length; i++) this.buildBulb(i);

    this.dotsText = this.add
      .text(W / 2, 1100, "", {
        fontSize: "44px",
        fontFamily: FONT,
        color: "#cfe0ff",
      })
      .setOrigin(0.5);
    this.earnedText = this.add
      .text(W / 2, 1210, "", {
        fontSize: "36px",
        fontFamily: FONT,
        color: "#ffd86b",
      })
      .setOrigin(0.5);
    this.bestText = this.add
      .text(W / 2, 1270, "", {
        fontSize: "30px",
        fontFamily: FONT,
        color: "#9fb4e6",
      })
      .setOrigin(0.5);

    this.newGame();
  }

  // ------------------------------------------------------------ Drawing

  /** Y of the drooping wire above row `rowY` at horizontal position x. */
  private wireY(rowY: number, x: number): number {
    const t = (x - 70) / (W - 140);
    return rowY - 125 + 30 * Math.sin(Math.PI * t);
  }

  private drawWires(): void {
    const g = this.add.graphics();
    ROWS.forEach((y) => {
      g.lineStyle(9, 0x1b2a49, 1).beginPath().moveTo(70, this.wireY(y, 70));
      for (let x = 70; x <= W - 70; x += 10) g.lineTo(x, this.wireY(y, x));
      g.strokePath();
      g.fillStyle(0x1b2a49, 1);
      g.fillCircle(70, this.wireY(y, 70), 11);
      g.fillCircle(W - 70, this.wireY(y, W - 70), 11);
      COLS.forEach((x) => {
        // socket cap
        g.fillStyle(0x3a3f55, 1).fillRoundedRect(
          x - 24,
          this.wireY(y, x) - 4,
          48,
          y - BULB_R + 26 - this.wireY(y, x),
          10,
        );
        g.fillStyle(0x59607c, 1).fillRect(x - 24, y - BULB_R - 6, 48, 6);
      });
    });
  }

  private buildBulb(i: number): void {
    const x = COLS[i % 3];
    const y = ROWS[Math.floor(i / 3)];
    const color = BULB_COLORS[i];
    const glow = this.add
      .circle(x, y, BULB_R + 38, color, 0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add.circle(x, y, BULB_R, shade(color, -0.45));
    const lit = this.add.circle(x, y, BULB_R - 6, color, UNLIT_ALPHA);
    lit.setInteractive({ useHandCursor: true });
    lit.on("pointerdown", () => this.onBulbTap(i));
    const hi = this.add.graphics({ x, y });
    hi.fillStyle(P.white, 0.55).fillEllipse(
      -BULB_R * 0.33,
      -BULB_R * 0.4,
      BULB_R * 0.5,
      BULB_R * 0.3,
    );
    hi.fillStyle(P.white, 0.8).fillCircle(-BULB_R * 0.55, -BULB_R * 0.12, 6);
    hi.lineStyle(6, P.white, 0.45)
      .beginPath()
      .arc(0, 0, BULB_R - 20, 0.3, 1.2)
      .strokePath();
    this.bulbs.push({ lit, glow, hi });
  }

  private flash(i: number, ms: number): void {
    const b = this.bulbs[i];
    sound.bulb(i, ms / 1000 + 0.15);
    b.lit.setAlpha(1);
    b.glow.setAlpha(0.85);
    b.lit.setScale(1.1);
    b.hi.setScale(1.1);
    this.tweens.killTweensOf(b.glow);
    b.glow.setScale(0.9);
    this.tweens.add({
      targets: b.glow,
      scale: 1.1,
      duration: ms,
      ease: "Sine.easeOut",
    });
    this.time.delayedCall(ms, () => {
      b.lit.setAlpha(UNLIT_ALPHA).setScale(1);
      b.hi.setScale(1);
      b.glow.setAlpha(0);
    });
  }

  private refreshInfo(): void {
    if (this.coinText.text !== `🪙 ${state.coins}`) {
      this.tweens.killTweensOf(this.coinPill.c);
      this.coinPill.c.setScale(1);
      this.tweens.add({
        targets: this.coinPill.c,
        scale: 1.25,
        yoyo: true,
        duration: 130,
        ease: "Back.easeOut",
      });
    }
    this.coinText.setText(`🪙 ${state.coins}`);
    this.earnedText.setText(
      this.earned > 0 ? `Зароблено: 🪙 ${this.earned}` : "",
    );
    this.bestText.setText(
      state.bestGarland > 0 ? `Рекорд: ${state.bestGarland}` : "",
    );
  }

  private refreshDots(): void {
    const dots = this.seq.map((_, k) => (k < this.pos ? "●" : "○")).join(" ");
    this.dotsText.setText(dots);
  }

  // --------------------------------------------------------------- Flow

  private newGame(): void {
    this.overObjs.forEach((o) => o.destroy());
    this.overObjs = [];
    this.earned = 0;
    this.reached = 0;
    this.prevBest = state.bestGarland;
    this.settled = false;
    this.retryUsed = false;
    this.stepMs = STEP_MS;
    this.seq = Array.from({ length: GARLAND_MIN_LEN }, () => this.randomBulb());
    this.refreshInfo();
    this.playSequence(600);
  }

  private randomBulb(): number {
    return Phaser.Math.Between(0, BULB_COLORS.length - 1);
  }

  private playSequence(startDelay: number): void {
    this.phase = "show";
    this.pos = 0;
    this.statusText.setText("Дивись…");
    this.refreshDots();
    this.seq.forEach((bulbIdx, k) => {
      this.time.delayedCall(startDelay + k * this.stepMs, () =>
        this.flash(bulbIdx, this.stepMs * 0.6),
      );
    });
    this.time.delayedCall(
      startDelay + this.seq.length * this.stepMs + 150,
      () => {
        this.phase = "input";
        this.statusText.setText("Твоя черга 👆");
      },
    );
  }

  private onBulbTap(i: number): void {
    if (this.phase !== "input") return;
    this.flash(i, 250);
    if (this.seq[this.pos] !== i) {
      this.onMistake();
      return;
    }
    this.pos += 1;
    this.refreshDots();
    if (this.pos === this.seq.length) this.onSuccess();
  }

  private onSuccess(): void {
    const len = this.seq.length;
    this.phase = "show"; // lock input while celebrating
    this.reached = len;
    this.earned += len;
    state.coins += len;
    state.bestGarland = Math.max(state.bestGarland, len);
    save();
    sound.coin();
    this.refreshInfo();
    this.statusText.setText(`Чудово! +${len} 🪙`);

    if (len >= MAX_LEN) {
      this.time.delayedCall(900, () => this.gameOver(true));
      return;
    }
    this.retryUsed = false;
    this.stepMs = STEP_MS;
    this.time.delayedCall(1100, () => {
      this.seq.push(this.randomBulb());
      this.playSequence(300);
    });
  }

  private onMistake(): void {
    this.phase = "show";
    sound.fail();
    if (!this.retryUsed) {
      this.retryUsed = true;
      this.stepMs = STEP_MS_AFTER_MISTAKE;
      this.statusText.setText("Нічого, ще раз 🙂");
      this.time.delayedCall(1100, () => this.playSequence(300));
      return;
    }
    this.time.delayedCall(700, () => this.gameOver(false));
  }

  /** Pay the personal-record bonus once per game. */
  private settle(): void {
    if (this.settled) return;
    this.settled = true;
    if (this.reached > this.prevBest) {
      this.earned += RECORD_BONUS;
      state.coins += RECORD_BONUS;
      save();
    }
  }

  private gameOver(perfect: boolean): void {
    this.phase = "over";
    this.settle();
    this.refreshInfo();
    this.statusText.setText("");
    if (perfect) sound.jingle();

    const record = this.reached > this.prevBest;
    const cx = W / 2;
    const dim = panel(this, cx, 700, W - 120, 640, COLORS.bg, 48);
    const title = this.add
      .text(cx, 480, perfect ? "🌟 Ідеально!" : "Гарна гра!", strokeText(58))
      .setOrigin(0.5);
    const lines = [
      `Вогників повторила: ${this.reached}`,
      `Зароблено: 🪙 ${this.earned}`,
    ];
    if (record) lines.push(`🏆 Новий рекорд! +${RECORD_BONUS} 🪙`);
    const summary = this.add
      .text(cx, 640, lines.join("\n"), {
        fontSize: "38px",
        fontFamily: FONT,
        color: "#ffd86b",
        align: "center",
        lineSpacing: 14,
      })
      .setOrigin(0.5);
    const again = button(
      this,
      cx,
      820,
      460,
      100,
      "Ще раз",
      COLORS.green,
      () => this.newGame(),
      44,
    );
    const home = button(
      this,
      cx,
      950,
      460,
      100,
      "Додому",
      COLORS.accent,
      () => this.close(),
      44,
    );
    // keep the overlay above the bulbs
    const overlay = [dim, title, summary, again.c, home.c];
    overlay.forEach((o) => o.setDepth(50));
    this.overObjs.push(...overlay);
  }

  private close(): void {
    this.settle();
    this.scene.resume("Room");
    this.scene.get("Room").events.emit("job-closed");
    this.scene.stop();
  }
}
