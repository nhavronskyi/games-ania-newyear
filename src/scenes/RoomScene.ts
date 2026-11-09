import Phaser from "phaser";
import {
  COLORS,
  FLOOR_Y,
  FONT,
  H,
  HERO_Y,
  PANEL_TOP,
  ROOM_BOTTOM,
  ROOM_TOP,
  TABS_Y,
  W,
} from "../config";
import { STAR_REWARD, collectRewards, currentGoal } from "../goals";
import type { Reward } from "../goals";
import { ITEMS, itemById } from "../items";
import { ROOMS, RoomId, roomById } from "../rooms";
import * as sound from "../sound";
import {
  MAX_STARS,
  Placed,
  addOwned,
  ownedCount,
  save,
  roomStars,
  state,
  totalStars,
  uid,
} from "../state";
import { button } from "../ui";

const COLS = 5;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;
const CHIP_W = 136;
const CHIP_H = 130;
const CHIP_GAP = 10;
const CHIP_X0 = 30;
const CHIP_Y0 = PANEL_TOP + 90;
const TAP_SLOP = 18; // px a finger may move and still count as a tap on an inventory card

interface Ghost {
  id: string;
  obj: Phaser.GameObjects.Text;
  startX: number;
  startY: number;
  moved: boolean;
}

export class RoomScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics;
  private decor: Phaser.GameObjects.Text[] = [];
  private placedObjs = new Map<string, Phaser.GameObjects.Text>();
  private hero!: Phaser.GameObjects.Container;
  private heroBody!: Phaser.GameObjects.Graphics;
  private bob?: Phaser.Tweens.Tween;
  private coinText!: Phaser.GameObjects.Text;
  private starText!: Phaser.GameObjects.Text;
  private roomTitle!: Phaser.GameObjects.Text;
  private muteText!: Phaser.GameObjects.Text;
  private goalBox!: Phaser.GameObjects.Rectangle;
  private goalText!: Phaser.GameObjects.Text;
  private hand!: Phaser.GameObjects.Text;
  private tabRects = new Map<RoomId, Phaser.GameObjects.Rectangle>();
  private invObjs: Phaser.GameObjects.GameObject[] = [];
  private emptyHint!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private page = 0;
  private ghost?: Ghost;
  private starHelp?: Phaser.GameObjects.GameObject[];

  constructor() {
    super("Room");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.bg = this.add.graphics().setDepth(0);

    this.buildTopBar();
    this.buildTabs();
    this.buildGoalBanner();
    this.buildPanel();
    this.buildHero();

    // Tap the room to walk there.
    const zone = this.add
      .zone(0, ROOM_TOP, W, ROOM_BOTTOM - ROOM_TOP)
      .setOrigin(0)
      .setInteractive();
    zone.on("pointerdown", (p: Phaser.Input.Pointer) => this.moveHero(p.x));

    // Dragging a chip out of the inventory.
    this.input.on("pointermove", (p: Phaser.Input.Pointer) =>
      this.moveGhost(p),
    );
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.dropGhost(p));
    // Finger lifted / left outside the canvas: never leave a ghost stuck on screen.
    this.input.on("pointerupoutside", () => this.cancelGhost());
    this.input.on("gameout", () => this.cancelGhost());

    const onOverlayClosed = (): void => {
      this.afterChange();
      this.refreshInventory();
    };
    this.events.on("shop-closed", onOverlayClosed);
    this.events.on("job-closed", onOverlayClosed);

    this.switchRoom(state.room);
    this.refreshInventory();
    this.afterChange();
  }

  // ---------------------------------------------------------------- HUD

  private buildTopBar(): void {
    this.coinText = this.add
      .text(30, 55, "", {
        fontSize: "46px",
        fontFamily: FONT,
        color: "#ffd86b",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.starText = this.add
      .text(W - 30, 55, "", {
        fontSize: "46px",
        fontFamily: FONT,
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.starText.on("pointerup", () => this.showStarHelp());
    this.roomTitle = this.add
      .text(W / 2, 55, "", {
        fontSize: "40px",
        fontFamily: FONT,
        color: "#cfe0ff",
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.muteText = this.add
      .text(262, 55, "", {
        fontSize: "44px",
        fontFamily: FONT,
        padding: { x: 14, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.muteText.on("pointerup", () => {
      sound.toggleMute();
      this.refreshHud();
    });
  }

  private refreshHud(): void {
    this.coinText.setText(`🪙 ${state.coins}`);
    this.starText.setText(`⭐ ${totalStars()}/${MAX_STARS}`);
    this.roomTitle.setText(roomById(state.room).name);
    this.muteText.setText(state.muted ? "🔇" : "🔊");
  }

  private buildTabs(): void {
    const w = 140;
    const gap = 8;
    const x0 = (W - (ROOMS.length * w + (ROOMS.length - 1) * gap)) / 2 + w / 2;
    ROOMS.forEach((room, i) => {
      const x = x0 + i * (w + gap);
      const b = button(
        this,
        x,
        TABS_Y + 42,
        w,
        84,
        `${room.icon}\n${room.name}`,
        COLORS.panel,
        () => this.switchRoom(room.id),
        26,
      );
      b.c.setDepth(10);
      this.tabRects.set(room.id, b.r);
    });
  }

  // ---------------------------------------------------------------- Goals

  private buildGoalBanner(): void {
    this.goalBox = this.add
      .rectangle(W / 2, ROOM_TOP + 50, W - 40, 76, COLORS.bg, 0.85)
      .setStrokeStyle(3, 0xffc94d, 0.7)
      .setDepth(12);
    this.goalText = this.add
      .text(W / 2, ROOM_TOP + 50, "", {
        fontSize: "28px",
        fontFamily: FONT,
        color: "#ffffff",
        align: "center",
        wordWrap: { width: W - 90 },
      })
      .setOrigin(0.5)
      .setDepth(13);

    // pulsing pointer under the first inventory card until the first item is placed
    this.hand = this.add
      .text(CHIP_X0 + CHIP_W / 2, CHIP_Y0 + CHIP_H + 40, "👆", {
        fontSize: "70px",
        fontFamily: FONT,
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setVisible(false);
    this.tweens.add({
      targets: this.hand,
      y: this.hand.y + 16,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private refreshGoalBanner(): void {
    const goal = currentGoal();
    this.goalText.setText(
      goal
        ? `🎯 ${goal.text}   (+${goal.reward} 🪙)`
        : "🏆 Усі цілі виконано! Прикрашай далі ✨",
    );
    this.hand.setVisible(
      state.goalIdx === 0 && state.placed.length === 0 && this.page === 0,
    );
  }

  /** Call after anything that can change progress: pays rewards, refreshes HUD and the goal banner. */
  private afterChange(): void {
    const rewards = collectRewards();
    this.refreshHud();
    this.refreshGoalBanner();
    if (rewards.length > 0) this.celebrate(rewards);
    // First time she places something is when "what are the stars?" starts to matter.
    if (!state.starHelpSeen && state.placed.length > 0) {
      state.starHelpSeen = true;
      save();
      this.time.delayedCall(rewards.length > 0 ? 2600 : 400, () =>
        this.showStarHelp(),
      );
    }
  }

  /** Popup explaining how to earn stars. Tap anywhere to close; also opened by tapping the ⭐ counter. */
  private showStarHelp(): void {
    if (this.starHelp) return;
    const here = roomStars(state.room);
    const body =
      "⭐ Зірочки — за прикрашання кімнат\n\n" +
      "Кожні 2 предмети в кімнаті = 1 ⭐\n" +
      "У кожній кімнаті до 3 ⭐ (6 предметів)\n" +
      `За кожну нову ⭐ ти отримуєш +${STAR_REWARD} 🪙\n\n` +
      `Тут, у «${roomById(state.room).name}»: ${here}/3 ⭐\n` +
      `Усього: ${totalStars()}/${MAX_STARS} ⭐\n\n` +
      "Не вистачає предметів? Заробляй 🪙 у «Роботі» 💡 і купуй у магазині 🛍️";
    const shade = this.add
      .rectangle(0, 0, W, H, 0x000000, 0.6)
      .setOrigin(0)
      .setDepth(50)
      .setInteractive();
    const panel = this.add
      .rectangle(W / 2, 560, W - 100, 640, COLORS.panel)
      .setStrokeStyle(5, 0xffc94d, 0.8)
      .setDepth(51);
    const text = this.add
      .text(W / 2, 560, body, {
        fontSize: "32px",
        fontFamily: FONT,
        color: "#ffffff",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: W - 180 },
      })
      .setOrigin(0.5)
      .setDepth(52);
    const close = this.add
      .text(W / 2, 835, "Зрозуміло 👍", {
        fontSize: "36px",
        fontFamily: FONT,
        color: "#ffffff",
        backgroundColor: "#3aa86b",
        padding: { x: 30, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(52);
    this.starHelp = [shade, panel, text, close];
    shade.on("pointerup", () => {
      this.starHelp?.forEach((o) => o.destroy());
      this.starHelp = undefined;
    });
    sound.tap();
  }

  private celebrate(rewards: Reward[]): void {
    const hasGoal = rewards.some((r) => r.kind === "goal");
    if (hasGoal) {
      sound.goal();
      this.confetti();
      this.tweens.add({
        targets: this.goalBox,
        scaleY: 1.25,
        duration: 160,
        yoyo: true,
        repeat: 1,
      });
    } else {
      sound.coin();
    }

    const lines = rewards.slice(-3).map((r) => `${r.text}   +${r.coins} 🪙`);
    const toast = this.add
      .text(
        W / 2,
        480,
        `${hasGoal ? "🎉 Ціль виконана!\n" : ""}${lines.join("\n")}`,
        {
          fontSize: "34px",
          fontFamily: FONT,
          color: "#ffffff",
          align: "center",
          backgroundColor: "#e8467c",
          padding: { x: 28, y: 18 },
          wordWrap: { width: W - 160 },
        },
      )
      .setOrigin(0.5)
      .setDepth(40)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 440,
      duration: 250,
      hold: 1900,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }

  private confetti(): void {
    const pieces = ["🎉", "✨", "⭐", "🎄", "🎁"];
    for (let i = 0; i < 18; i++) {
      const piece = this.add
        .text(
          Phaser.Math.Between(40, W - 40),
          ROOM_TOP - 20,
          Phaser.Utils.Array.GetRandom(pieces),
          {
            fontSize: `${Phaser.Math.Between(40, 70)}px`,
            fontFamily: FONT,
          },
        )
        .setOrigin(0.5)
        .setDepth(40);
      this.tweens.add({
        targets: piece,
        y: ROOM_BOTTOM + 40,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1400, 2400),
        delay: Phaser.Math.Between(0, 500),
        ease: "Quad.easeIn",
        onComplete: () => piece.destroy(),
      });
    }
  }

  // -------------------------------------------------------------- Rooms

  private switchRoom(id: RoomId): void {
    state.room = id;
    save();
    const room = roomById(id);

    // background
    const g = this.bg;
    g.clear();
    g.fillStyle(room.wall, 1).fillRect(0, ROOM_TOP, W, FLOOR_Y - ROOM_TOP);
    g.fillStyle(room.floor, 1).fillRect(0, FLOOR_Y, W, ROOM_BOTTOM - FLOOR_Y);
    g.fillStyle(0x000000, 0.12).fillRect(0, FLOOR_Y, W, 8);
    if (id === "garden") {
      // night-ish garden: darker sky
      g.fillStyle(0x1f3a6b, 0.55).fillRect(0, ROOM_TOP, W, FLOOR_Y - ROOM_TOP);
    }
    if (id === "balcony") {
      // railing
      g.fillStyle(0x4a4f5c, 1).fillRect(0, FLOOR_Y - 150, W, 12);
      for (let x = 20; x < W; x += 60) g.fillRect(x, FLOOR_Y - 150, 8, 150);
    }

    // built-in decor
    this.decor.forEach((d) => d.destroy());
    this.decor = room.decor.map((d) =>
      this.add
        .text(d.x, d.y, d.e, { fontSize: `${d.size}px`, fontFamily: FONT })
        .setOrigin(0.5)
        .setDepth(1),
    );

    // placed items for this room
    this.placedObjs.forEach((o) => o.destroy());
    this.placedObjs.clear();
    state.placed
      .filter((p) => p.room === id)
      .forEach((p) => this.spawnPlaced(p));

    // tab highlight
    this.tabRects.forEach((r, rid) =>
      r.setFillStyle(rid === id ? COLORS.accent : COLORS.panel),
    );
    this.refreshHud();
  }

  private spawnPlaced(p: Placed): void {
    const def = itemById(p.id);
    if (!def) return;
    const obj = this.add
      .text(p.x, p.y, def.emoji, {
        fontSize: `${def.size}px`,
        fontFamily: FONT,
      })
      .setOrigin(0.5)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    this.input.setDraggable(obj);

    obj.on("dragstart", () => obj.setScale(1.15).setDepth(20));
    obj.on("drag", (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      obj.setPosition(
        Phaser.Math.Clamp(dx, 40, W - 40),
        Phaser.Math.Clamp(dy, ROOM_TOP + 30, H - 20),
      );
    });
    obj.on("dragend", () => {
      obj.setScale(1).setDepth(4);
      if (obj.y > ROOM_BOTTOM) {
        // dropped on the inventory panel -> put it back
        state.placed = state.placed.filter((q) => q.uid !== p.uid);
        addOwned(p.id);
        this.placedObjs.delete(p.uid);
        obj.destroy();
        sound.tap();
        this.refreshInventory();
      } else {
        p.x = obj.x;
        p.y = obj.y;
        sound.place();
      }
      save();
      this.afterChange();
    });
    this.placedObjs.set(p.uid, obj);
  }

  // ----------------------------------------------------------- Inventory

  private buildPanel(): void {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(COLORS.panel, 1).fillRoundedRect(
      0,
      PANEL_TOP - 10,
      W,
      H - PANEL_TOP + 10,
      36,
    );

    this.add
      .text(30, PANEL_TOP + 22, "🎒 Інвентар", {
        fontSize: "36px",
        fontFamily: FONT,
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setDepth(3);
    this.add
      .text(
        W - 30,
        PANEL_TOP + 28,
        "тап або тягни в кімнату ↑  ·  назад — тягни вниз ↓",
        {
          fontSize: "22px",
          fontFamily: FONT,
          color: "#9fb4e6",
        },
      )
      .setOrigin(1, 0)
      .setDepth(3);

    this.emptyHint = this.add
      .text(W / 2, CHIP_Y0 + 150, "Порожньо. Зазирни до магазину 🛍️", {
        fontSize: "32px",
        fontFamily: FONT,
        color: "#9fb4e6",
      })
      .setOrigin(0.5)
      .setDepth(3);

    const prev = button(
      this,
      90,
      H - 195,
      110,
      56,
      "◀",
      COLORS.panelLight,
      () => this.turnPage(-1),
      36,
    );
    const next = button(
      this,
      W - 90,
      H - 195,
      110,
      56,
      "▶",
      COLORS.panelLight,
      () => this.turnPage(1),
      36,
    );
    prev.c.setDepth(3);
    next.c.setDepth(3);
    this.pageText = this.add
      .text(W / 2, H - 195, "", {
        fontSize: "28px",
        fontFamily: FONT,
        color: "#cfe0ff",
      })
      .setOrigin(0.5)
      .setDepth(3);

    button(
      this,
      215,
      H - 100,
      350,
      110,
      "🛍️ Магазин",
      COLORS.accent,
      () => this.openOverlay("Shop"),
      40,
    ).c.setDepth(3);
    button(
      this,
      565,
      H - 100,
      350,
      110,
      "💡 Робота",
      COLORS.green,
      () => this.openOverlay("Garland"),
      40,
    ).c.setDepth(3);
  }

  private turnPage(d: number): void {
    this.page += d;
    this.refreshInventory();
    this.refreshGoalBanner();
  }

  private openOverlay(key: "Shop" | "Garland"): void {
    this.cancelGhost();
    this.scene.launch(key);
    this.scene.pause();
  }

  private refreshInventory(): void {
    this.invObjs.forEach((o) => o.destroy());
    this.invObjs = [];

    const list = ITEMS.filter((i) => ownedCount(i.id) > 0);
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    this.emptyHint.setVisible(list.length === 0);
    this.pageText.setText(pages > 1 ? `${this.page + 1} / ${pages}` : "");

    list
      .slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE)
      .forEach((item, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = CHIP_X0 + col * (CHIP_W + CHIP_GAP) + CHIP_W / 2;
        const y = CHIP_Y0 + row * (CHIP_H + CHIP_GAP) + CHIP_H / 2;

        const card = this.add
          .rectangle(x, y, CHIP_W, CHIP_H, COLORS.panelLight)
          .setStrokeStyle(3, 0xffffff, 0.2)
          .setDepth(3);
        const icon = this.add
          .text(x, y - 14, item.emoji, { fontSize: "64px", fontFamily: FONT })
          .setOrigin(0.5)
          .setDepth(4);
        const label = this.add
          .text(x, y + 44, `${item.name} ×${ownedCount(item.id)}`, {
            fontSize: "22px",
            fontFamily: FONT,
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setDepth(4);

        card.setInteractive({ useHandCursor: true });
        card.on("pointerdown", (p: Phaser.Input.Pointer) => {
          this.cancelGhost(); // a second finger must not orphan the first ghost
          const obj = this.add
            .text(p.x, p.y - 60, item.emoji, {
              fontSize: `${item.size}px`,
              fontFamily: FONT,
            })
            .setOrigin(0.5)
            .setDepth(30)
            .setAlpha(0.9);
          this.ghost = {
            id: item.id,
            obj,
            startX: p.x,
            startY: p.y,
            moved: false,
          };
        });
        this.invObjs.push(card, icon, label);
      });
  }

  private moveGhost(p: Phaser.Input.Pointer): void {
    if (!this.ghost) return;
    this.ghost.obj.setPosition(p.x, p.y - 60);
    if (
      Phaser.Math.Distance.Between(
        p.x,
        p.y,
        this.ghost.startX,
        this.ghost.startY,
      ) > TAP_SLOP
    ) {
      this.ghost.moved = true;
    }
  }

  private cancelGhost(): void {
    this.ghost?.obj.destroy();
    this.ghost = undefined;
  }

  private dropGhost(p: Phaser.Input.Pointer): void {
    if (!this.ghost) return;
    const { id, obj, moved } = this.ghost;
    this.ghost = undefined;

    const inRoom = p.y >= ROOM_TOP && p.y <= ROOM_BOTTOM;
    const tapped = !moved; // a plain tap on a card drops the item in the middle of the room
    if ((inRoom || tapped) && ownedCount(id) > 0) {
      const placed: Placed = {
        uid: uid(),
        id,
        room: state.room,
        x: tapped
          ? W / 2 + Phaser.Math.Between(-150, 150)
          : Phaser.Math.Clamp(obj.x, 40, W - 40),
        y: tapped
          ? 640
          : Phaser.Math.Clamp(obj.y, ROOM_TOP + 30, ROOM_BOTTOM - 20),
      };
      addOwned(id, -1);
      state.placed.push(placed);
      this.spawnPlaced(placed);
      save();
      sound.place();
      this.refreshInventory();
      this.afterChange();
    }
    obj.destroy();
  }

  // ---------------------------------------------------------------- Hero

  private buildHero(): void {
    const g = this.add.graphics();
    // shadow
    g.fillStyle(0x000000, 0.22).fillEllipse(0, 4, 110, 24);
    // legs
    g.fillStyle(0xf3c9a5).fillRect(-20, -34, 14, 34).fillRect(6, -34, 14, 34);
    g.fillStyle(0x7a3b2e).fillRect(-24, -6, 20, 10).fillRect(4, -6, 20, 10);
    // dress
    g.fillStyle(0xe8467c).fillTriangle(-46, -36, 46, -36, 0, -140);
    g.fillStyle(0xffffff).fillRect(-46, -42, 92, 8);
    // arms
    g.fillStyle(0xf3c9a5)
      .fillRect(-52, -110, 12, 50)
      .fillRect(40, -110, 12, 50);
    // hair + head
    g.fillStyle(0x6b3f23).fillCircle(0, -172, 40);
    g.fillStyle(0xf3c9a5).fillCircle(0, -164, 34);
    g.fillStyle(0x6b3f23).fillEllipse(0, -190, 70, 26);
    // face
    g.fillStyle(0x2b2b2b).fillCircle(-12, -162, 4).fillCircle(12, -162, 4);
    g.fillStyle(0xff8fa3).fillCircle(-22, -150, 6).fillCircle(22, -150, 6);
    g.lineStyle(3, 0xb0446a)
      .beginPath()
      .arc(0, -150, 10, 0.2, Math.PI - 0.2)
      .strokePath();
    // Santa hat
    g.fillStyle(0xd62828).fillTriangle(-36, -196, 36, -196, 10, -262);
    g.fillStyle(0xffffff).fillRect(-40, -204, 80, 16).fillCircle(10, -262, 11);

    this.heroBody = g;
    this.hero = this.add.container(160, HERO_Y, [g]).setDepth(6);
  }

  private moveHero(targetX: number): void {
    const x = Phaser.Math.Clamp(targetX, 70, W - 70);
    const dx = x - this.hero.x;
    if (Math.abs(dx) < 8) return;

    this.tweens.killTweensOf(this.hero);
    this.bob?.stop();
    this.heroBody.y = 0;
    this.hero.scaleX = dx < 0 ? -1 : 1;

    this.bob = this.tweens.add({
      targets: this.heroBody,
      y: -12,
      duration: 140,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: this.hero,
      x,
      duration: Math.abs(dx) * 2.2,
      ease: "Linear",
      onComplete: () => {
        this.bob?.stop();
        this.heroBody.y = 0;
      },
    });
  }
}
