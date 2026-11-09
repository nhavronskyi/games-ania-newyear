import Phaser from "phaser";
import { COLORS, FONT, H, W } from "../config";
import { GARLAND_MIN_LEN } from "../goals";
import * as sound from "../sound";
import { save, state } from "../state";
import { button } from "../ui";

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
  }[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private dotsText!: Phaser.GameObjects.Text;
  private earnedText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
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
    this.add
      .rectangle(W / 2, H / 2, W - 40, H - 120, COLORS.panelLight)
      .setStrokeStyle(6, 0xffffff, 0.25);

    this.add
      .text(60, 110, "💡 Гірлянда", {
        fontSize: "56px",
        fontFamily: FONT,
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.coinText = this.add
      .text(W - 160, 110, "", {
        fontSize: "46px",
        fontFamily: FONT,
        color: "#ffd86b",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);
    button(
      this,
      W - 100,
      110,
      90,
      90,
      "✕",
      COLORS.accent,
      () => this.close(),
      44,
    );

    this.statusText = this.add
      .text(W / 2, 330, "", {
        fontSize: "52px",
        fontFamily: FONT,
        color: "#ffffff",
        fontStyle: "bold",
      })
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

  private drawWires(): void {
    const g = this.add.graphics();
    g.lineStyle(8, 0x1b2a49, 1);
    ROWS.forEach((y) => {
      g.lineBetween(70, y - 125, W - 70, y - 125);
      COLS.forEach((x) => g.lineBetween(x, y - 125, x, y - 80));
    });
  }

  private buildBulb(i: number): void {
    const x = COLS[i % 3];
    const y = ROWS[Math.floor(i / 3)];
    const color = BULB_COLORS[i];
    const glow = this.add
      .circle(x, y, BULB_R + 38, color, 0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add.circle(x, y, BULB_R, 0x1b2a49).setStrokeStyle(6, 0xffffff, 0.25);
    const lit = this.add.circle(x, y, BULB_R - 6, color, UNLIT_ALPHA);
    lit.setInteractive({ useHandCursor: true });
    lit.on("pointerdown", () => this.onBulbTap(i));
    this.bulbs.push({ lit, glow });
  }

  private flash(i: number, ms: number): void {
    const b = this.bulbs[i];
    sound.bulb(i, ms / 1000 + 0.15);
    b.lit.setAlpha(1);
    b.glow.setAlpha(0.85);
    b.lit.setScale(1.1);
    this.time.delayedCall(ms, () => {
      b.lit.setAlpha(UNLIT_ALPHA).setScale(1);
      b.glow.setAlpha(0);
    });
  }

  private refreshInfo(): void {
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
    const dim = this.add
      .rectangle(cx, 700, W - 120, 640, COLORS.bg, 0.96)
      .setStrokeStyle(5, 0xffffff, 0.3);
    const title = this.add
      .text(cx, 480, perfect ? "🌟 Ідеально!" : "Гарна гра!", {
        fontSize: "60px",
        fontFamily: FONT,
        color: "#ffffff",
        fontStyle: "bold",
      })
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
