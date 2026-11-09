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
import { HERO_LAYOUT } from "../art/hero";
import { P } from "../art/palette";
import { STAR_REWARD, collectRewards, currentGoal } from "../goals";
import type { Reward } from "../goals";
import { ITEMS, itemById } from "../items";
import { itemVisual } from "../itemView";
import type { ItemVisual } from "../itemView";
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
import { strokeText } from "../style";
import { bubble, button, panel, pill } from "../ui";

const COLS = 5;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;
const CHIP_W = 136;
const CHIP_H = 130;
const CHIP_GAP = 10;
const CHIP_X0 = 30;
const CHIP_Y0 = PANEL_TOP + 90;
const TAP_SLOP = 18; // px a finger may move and still count as a tap on an inventory card
const CONFETTI_COLORS = [
  P.coral,
  P.yellow,
  P.mint,
  P.sky,
  P.lilac,
  P.orange,
  P.pink,
];
const SNOW_ROOMS: RoomId[] = ["garden", "balcony"];
const ARM_PARTS = ["arm"];

interface Ghost {
  pointerId: number;
  id: string;
  obj: ItemVisual;
  startX: number;
  startY: number;
  moved: boolean;
}

interface PlacedObj {
  p: Placed;
  size: number;
  c: Phaser.GameObjects.Container;
  img: ItemVisual;
  shadow: Phaser.GameObjects.Ellipse;
  groundY: number;
  lifted: boolean;
  dragged: boolean;
  lift: number;
}

type Overlay = "Shop" | "Garland" | "Settings";

export class RoomScene extends Phaser.Scene {
  private bgImg?: Phaser.GameObjects.GameObject;
  private decor: Phaser.GameObjects.GameObject[] = [];
  private snow: Phaser.GameObjects.Image[] = [];
  private placedObjs = new Map<string, PlacedObj>();
  private hero!: Phaser.GameObjects.Container;
  private rig!: Phaser.GameObjects.Container;
  private armR!: Phaser.GameObjects.Image;
  private armL!: Phaser.GameObjects.Image;
  private eyesOpen!: Phaser.GameObjects.Image;
  private eyesClosed!: Phaser.GameObjects.Image;
  private heroTweens: Phaser.Tweens.Tween[] = [];
  private walking = false;
  private bob?: Phaser.Tweens.Tween;
  private coinPill!: ReturnType<typeof pill>;
  private starPill!: ReturnType<typeof pill>;
  private roomTitle!: Phaser.GameObjects.Text;
  private goalBox!: Phaser.GameObjects.Graphics;
  private goalText!: Phaser.GameObjects.Text;
  private hand!: Phaser.GameObjects.Text;
  private tabRects = new Map<RoomId, Phaser.GameObjects.Rectangle>();
  private invObjs: Phaser.GameObjects.GameObject[] = [];
  private emptyHint!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private page = 0;
  private ghost?: Ghost;
  private starHelp?: Phaser.GameObjects.GameObject[];
  private lastCoins = -1;

  constructor() {
    super("Room");
  }

  create(): void {
    // Phaser reuses this instance on scene.restart(): reset every field.
    this.bgImg = undefined;
    this.decor = [];
    this.snow = [];
    this.placedObjs = new Map();
    this.heroTweens = [];
    this.walking = false;
    this.bob = undefined;
    this.tabRects = new Map();
    this.invObjs = [];
    this.page = 0;
    this.ghost = undefined;
    this.starHelp = undefined;
    this.lastCoins = -1;

    this.ensureFx();
    this.input.dragDistanceThreshold = 8;
    this.cameras.main.setBackgroundColor(COLORS.bg);

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
    const onMove = (p: Phaser.Input.Pointer): void => this.moveGhost(p);
    const onUp = (p: Phaser.Input.Pointer): void => this.dropGhost(p);
    const onCancel = (p?: Phaser.Input.Pointer): void => {
      if (p && this.ghost && p.id !== this.ghost.pointerId) return;
      this.cancelGhost();
    };
    this.input.on("pointermove", onMove);
    this.input.on("pointerup", onUp);
    // Finger lifted / left outside the canvas: never leave a ghost stuck on screen.
    this.input.on("pointerupoutside", onCancel);
    this.input.on("gameout", onCancel);

    const onOverlayClosed = (): void => {
      this.afterChange();
      this.refreshInventory();
    };
    const onStarHelp = (): void => this.showStarHelp();
    const onReset = (): void => {
      this.scene.restart();
    };
    this.events.on("shop-closed", onOverlayClosed);
    this.events.on("job-closed", onOverlayClosed);
    this.events.on("settings-closed", onOverlayClosed);
    this.events.on("show-star-help", onStarHelp);
    this.events.on("game-reset", onReset);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("shop-closed", onOverlayClosed);
      this.events.off("job-closed", onOverlayClosed);
      this.events.off("settings-closed", onOverlayClosed);
      this.events.off("show-star-help", onStarHelp);
      this.events.off("game-reset", onReset);
      this.input.off("pointermove", onMove);
      this.input.off("pointerup", onUp);
      this.input.off("pointerupoutside", onCancel);
      this.input.off("gameout", onCancel);
    });

    this.switchRoom(state.room, false);
    this.refreshInventory();
    this.afterChange();
  }

  update(_time: number, _delta: number): void {
    this.placedObjs.forEach((o) => {
      o.lift += ((o.lifted ? 1 : 0) - o.lift) * 0.25;
      const height = Math.max(0, o.groundY - o.c.y);
      const s =
        (1 + o.lift * 0.3) * (1 - Math.min(0.35, height / 160)) * o.c.scaleX;
      o.shadow
        .setPosition(o.c.x, o.groundY + o.size * 0.45 + o.lift * 16)
        .setScale(s, s)
        .setAlpha(0.24 - o.lift * 0.08);
    });
  }

  // ---------------------------------------------------------------- FX

  private ensureFx(): void {
    const bake = (
      key: string,
      w: number,
      h: number,
      draw: (g: Phaser.GameObjects.Graphics) => void,
    ): void => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    bake("fx:dot", 16, 16, (g) => g.fillCircle(8, 8, 8));
    bake("fx:rect", 18, 10, (g) => g.fillRoundedRect(0, 0, 18, 10, 3));
    bake("fx:star", 28, 28, (g) => {
      const pts: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 13 : 5.5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push({ x: 14 + Math.cos(a) * r, y: 14 + Math.sin(a) * r });
      }
      g.fillPoints(pts, true);
    });
  }

  private sparkles(x: number, y: number): void {
    for (let i = 0; i < 9; i++) {
      const isStar = i % 2 === 0;
      const piece = this.add
        .image(x, y, isStar ? "fx:star" : "fx:dot")
        .setTint(Phaser.Utils.Array.GetRandom(CONFETTI_COLORS))
        .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
        .setDepth(25);
      const a = (i / 9) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
      const dist = Phaser.Math.Between(45, 95);
      this.tweens.add({
        targets: piece,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist * 0.7 - 20,
        scale: 0,
        angle: Phaser.Math.Between(-120, 120),
        duration: Phaser.Math.Between(350, 550),
        ease: "Quad.easeOut",
        onComplete: () => piece.destroy(),
      });
    }
  }

  // ---------------------------------------------------------------- HUD

  private buildTopBar(): void {
    this.coinPill = pill(this, 130, 55, 220, 66, COLORS.gold);
    this.coinPill.c.setDepth(10);

    this.starPill = pill(this, W - 140, 55, 240, 66, COLORS.accent);
    this.starPill.c
      .setDepth(10)
      .setSize(240, 66)
      .setInteractive(
        new Phaser.Geom.Rectangle(-120, -33, 240, 66),
        Phaser.Geom.Rectangle.Contains,
      );
    this.starPill.c.input!.cursor = "pointer";
    this.starPill.c.on("pointerup", () => this.showStarHelp());

    this.roomTitle = this.add
      .text(W / 2 + 25, 55, "", strokeText(36, "#ffffff", 5))
      .setOrigin(0.5)
      .setDepth(10);

    bubble(
      this,
      290,
      55,
      34,
      COLORS.panelLight,
      "⚙️",
      () => this.openOverlay("Settings"),
      30,
    ).c.setDepth(10);
  }

  private refreshHud(): void {
    this.coinPill.t.setText(`🪙 ${state.coins}`);
    this.starPill.t.setText(`⭐ ${totalStars()}/${MAX_STARS}`);
    this.roomTitle.setText(roomById(state.room).name);
    if (this.lastCoins >= 0 && state.coins !== this.lastCoins) {
      this.tweens.killTweensOf(this.coinPill.c);
      this.coinPill.c.setScale(1);
      this.tweens.add({
        targets: this.coinPill.c,
        scale: 1.18,
        duration: 120,
        yoyo: true,
        ease: "Back.easeOut",
      });
    }
    this.lastCoins = state.coins;
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
        () => this.switchRoom(room.id, true),
        26,
      );
      b.c.setDepth(10);
      this.tabRects.set(room.id, b.r);
    });
  }

  // ---------------------------------------------------------------- Goals

  private buildGoalBanner(): void {
    this.goalBox = panel(this, W / 2, ROOM_TOP + 50, W - 40, 76, COLORS.bg, 30);
    this.goalBox.setDepth(12);
    this.goalText = this.add
      .text(W / 2, ROOM_TOP + 47, "", {
        ...strokeText(26, "#ffffff", 4),
        wordWrap: { width: W - 100 },
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
      this.time.delayedCall(rewards.length > 0 ? 2600 : 400, () => {
        this.endPlacedDrags();
        this.showStarHelp();
      });
    }
  }

  /** Popup explaining how to earn stars. Tap outside or the button to close; also opened by tapping the star counter. */
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
    const dim = this.add
      .rectangle(0, 0, W, H, 0x000000, 0.6)
      .setOrigin(0)
      .setDepth(50)
      .setInteractive();
    const box = this.add.container(W / 2, 560).setDepth(51);
    const text = this.add
      .text(0, -40, body, {
        fontSize: "31px",
        fontFamily: FONT,
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: W - 190 },
      })
      .setOrigin(0.5);
    const close = (): void => {
      if (!this.starHelp) return;
      const objs = this.starHelp;
      this.starHelp = undefined;
      this.tweens.add({
        targets: box,
        scale: 0.6,
        alpha: 0,
        duration: 140,
        onComplete: () => objs.forEach((o) => o.destroy()),
      });
      dim.disableInteractive();
      dim.setVisible(false);
    };
    const ok = button(
      this,
      0,
      275,
      320,
      96,
      "Зрозуміло 👍",
      COLORS.green,
      close,
      34,
    );
    box.add([panel(this, 0, 0, W - 100, 680, COLORS.panel, 48), text, ok.c]);
    box.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: box,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: "Back.easeOut",
    });
    this.starHelp = [dim, box];
    dim.on("pointerup", close);
    sound.pop();
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
    const text = this.add
      .text(
        0,
        -4,
        `${hasGoal ? "🎉 Ціль виконана!\n" : ""}${lines.join("\n")}`,
        {
          ...strokeText(32, "#ffffff", 5),
          wordWrap: { width: W - 200 },
        },
      )
      .setOrigin(0.5);
    const toast = this.add.container(W / 2, 480).setDepth(40);
    toast.add([
      panel(this, 0, 0, text.width + 70, text.height + 50, COLORS.accent, 36),
      text,
    ]);
    toast.setAlpha(0).setScale(0.7);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      scale: 1,
      y: 440,
      duration: 300,
      ease: "Back.easeOut",
      hold: 1900,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }

  private confetti(): void {
    const keys = ["fx:rect", "fx:dot", "fx:star"];
    for (let i = 0; i < 42; i++) {
      const piece = this.add
        .image(
          Phaser.Math.Between(40, W - 40),
          ROOM_TOP - 20,
          Phaser.Utils.Array.GetRandom(keys),
        )
        .setTint(Phaser.Utils.Array.GetRandom(CONFETTI_COLORS))
        .setScale(Phaser.Math.FloatBetween(0.7, 1.4))
        .setAngle(Phaser.Math.Between(0, 360))
        .setDepth(40);
      this.tweens.add({
        targets: piece,
        y: ROOM_BOTTOM + 40,
        x: piece.x + Phaser.Math.Between(-80, 80),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        duration: Phaser.Math.Between(1400, 2400),
        delay: Phaser.Math.Between(0, 500),
        ease: "Quad.easeIn",
        onComplete: () => piece.destroy(),
      });
    }
  }

  // -------------------------------------------------------------- Rooms

  private clearRoom(): void {
    if (this.bgImg) this.tweens.killTweensOf(this.bgImg);
    this.bgImg?.destroy();
    this.decor.forEach((d) => {
      this.tweens.killTweensOf(d);
      d.destroy();
    });
    this.decor = [];
    this.snow.forEach((s) => {
      this.tweens.killTweensOf(s);
      s.destroy();
    });
    this.snow = [];
    this.placedObjs.forEach((o) => this.destroyPlaced(o));
    this.placedObjs.clear();
  }

  private switchRoom(id: RoomId, animate: boolean): void {
    state.room = id;
    save();
    const room = roomById(id);
    this.clearRoom();

    // background
    const bgKey = `room:${id}`;
    if (this.textures.exists(bgKey)) {
      this.bgImg = this.add.image(0, ROOM_TOP, bgKey).setOrigin(0).setDepth(0);
    } else {
      this.bgImg = this.add
        .rectangle(0, ROOM_TOP, W, FLOOR_Y - ROOM_TOP, room.wall)
        .setOrigin(0)
        .setDepth(0);
    }
    const bgObj = this.bgImg as Phaser.GameObjects.Image;

    // built-in decor
    room.decor.forEach((d, i) => {
      const key = `decor:${d.art}`;
      if (!this.textures.exists(key)) return;
      const img = this.add
        .image(d.x, d.y, key)
        .setScale(d.scale ?? 1)
        .setDepth(1);
      this.decor.push(img);
      if (animate) {
        const base = d.scale ?? 1;
        img.setScale(base * 0.8).setAlpha(0);
        this.tweens.add({
          targets: img,
          scale: base,
          alpha: 1,
          duration: 280,
          delay: 40 + i * 50,
          ease: "Back.easeOut",
        });
      }
    });

    // placed items for this room
    state.placed
      .filter((p) => p.room === id)
      .forEach((p, i) => this.spawnPlaced(p, animate ? "pop" : "none", i));

    if (SNOW_ROOMS.includes(id)) this.spawnSnow();

    if (animate) {
      bgObj.setAlpha(0.3);
      this.tweens.add({ targets: bgObj, alpha: 1, duration: 220 });
      sound.whoosh();
    }

    // tab highlight
    this.tabRects.forEach((r, rid) =>
      r.setFillStyle(rid === id ? COLORS.accent : COLORS.panel),
    );
    this.refreshHud();
  }

  private spawnSnow(): void {
    const total = FLOOR_Y + 30 - ROOM_TOP;
    for (let i = 0; i < 28; i++) {
      const flake = this.add
        .image(
          Phaser.Math.Between(10, W - 10),
          Phaser.Math.Between(ROOM_TOP, FLOOR_Y),
          "fx:dot",
        )
        .setScale(Phaser.Math.FloatBetween(0.25, 0.6))
        .setAlpha(Phaser.Math.FloatBetween(0.6, 0.95))
        .setDepth(2);
      this.snow.push(flake);
      const full = Phaser.Math.Between(6000, 10000);
      const fall = (first: boolean): void => {
        if (!flake.scene) return;
        const remaining = FLOOR_Y + 30 - flake.y;
        this.tweens.add({
          targets: flake,
          y: FLOOR_Y + 30,
          duration: first ? (remaining / total) * full : full,
          onComplete: () => {
            if (!flake.scene) return;
            flake.y = ROOM_TOP - 10;
            fall(false);
          },
        });
      };
      fall(true);
      this.tweens.add({
        targets: flake,
        x: flake.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(1500, 2800),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private destroyPlaced(o: PlacedObj): void {
    this.tweens.killTweensOf([o.c, o.img]);
    o.shadow.destroy();
    o.c.destroy();
  }

  private spawnPlaced(
    p: Placed,
    intro: "none" | "pop" | "land",
    order = 0,
  ): void {
    const def = itemById(p.id);
    if (!def) return;
    const size = def.size;
    const img = itemVisual(this, 0, size / 2, def, size);
    img.setOrigin(0.5, 1);
    const baseScaleY = img.scaleY;
    const c = this.add.container(p.x, p.y, [img]).setDepth(4);
    c.setSize(size, size);
    c.setInteractive(
      new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
      Phaser.Geom.Rectangle.Contains,
    );
    c.input!.cursor = "pointer";
    this.input.setDraggable(c);
    const shadow = this.add
      .ellipse(p.x, p.y + size * 0.45, size * 0.8, size * 0.18, 0x000000, 0.24)
      .setDepth(3.5);

    const o: PlacedObj = {
      p,
      size,
      c,
      img,
      shadow,
      groundY: p.y,
      lifted: false,
      dragged: false,
      lift: 0,
    };

    // idle breathing (on the child so drag / squash scale on the container is untouched)
    this.tweens.add({
      targets: img,
      scaleY: baseScaleY * 1.03,
      duration: Phaser.Math.Between(1100, 1600),
      delay: Phaser.Math.Between(0, 1200),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    c.on("pointerdown", () => {
      o.dragged = false;
    });
    c.on("pointerup", () => {
      if (o.dragged) return;
      this.wobble(o);
      sound.pop(Phaser.Math.FloatBetween(0.9, 1.3));
    });
    c.on("dragstart", () => {
      o.dragged = true;
      o.lifted = true;
      this.tweens.killTweensOf(c);
      c.setDepth(20);
      this.tweens.add({
        targets: c,
        scale: 1.15,
        duration: 140,
        ease: "Back.easeOut",
      });
      sound.pop(1.4);
    });
    c.on("drag", (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      c.setPosition(
        Phaser.Math.Clamp(dx, 40, W - 40),
        Phaser.Math.Clamp(dy, ROOM_TOP + 30, H - 20),
      );
      o.groundY = c.y;
    });
    c.on("dragend", () => {
      o.lifted = false;
      c.setDepth(4);
      if (c.y > ROOM_BOTTOM) {
        // dropped on the inventory panel -> put it back
        state.placed = state.placed.filter((q) => q.uid !== p.uid);
        addOwned(p.id);
        this.placedObjs.delete(p.uid);
        this.destroyPlaced(o);
        sound.whoosh();
        this.refreshInventory();
      } else {
        p.x = c.x;
        p.y = c.y;
        o.groundY = c.y;
        this.bounceLand(o);
        this.sparkles(c.x, c.y + size * 0.4);
        sound.place();
        this.heroHop(24);
      }
      save();
      this.afterChange();
    });
    this.placedObjs.set(p.uid, o);

    if (intro === "land") {
      this.bounceLand(o);
    } else if (intro === "pop") {
      c.setScale(0);
      this.tweens.add({
        targets: c,
        scale: 1,
        duration: 320,
        delay: 80 + order * 50,
        ease: "Back.easeOut",
      });
    }
  }

  private bounceLand(o: PlacedObj): void {
    const { c } = o;
    const y = c.y;
    this.tweens.killTweensOf(c);
    c.setY(y - 34);
    c.setScale(1.15);
    this.tweens.add({ targets: c, y, duration: 460, ease: "Bounce.easeOut" });
    this.tweens.add({
      targets: c,
      scale: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
  }

  private wobble(o: PlacedObj): void {
    const { c } = o;
    this.tweens.killTweensOf(c);
    c.setScale(1);
    this.tweens.add({
      targets: c,
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: c,
          scaleX: 0.92,
          scaleY: 1.12,
          duration: 100,
          yoyo: true,
          onComplete: () => c.setScale(1),
        });
      },
    });
  }

  // ----------------------------------------------------------- Inventory

  private buildPanel(): void {
    const top = PANEL_TOP - 10;
    const bottom = H + 60;
    panel(
      this,
      W / 2,
      (top + bottom) / 2,
      W - 16,
      bottom - top,
      COLORS.panel,
      44,
    ).setDepth(2);

    this.add
      .text(30, PANEL_TOP + 22, "🎒 Інвентар", strokeText(34, "#ffffff", 5))
      .setOrigin(0, 0)
      .setDepth(3);
    this.add
      .text(
        W - 30,
        PANEL_TOP + 63,
        "тап або тягни в кімнату ↑ · назад — тягни вниз ↓",
        {
          fontSize: "20px",
          fontFamily: FONT,
          fontStyle: "bold",
          color: "#d9ccff",
        },
      )
      .setOrigin(1, 0)
      .setDepth(3);

    this.emptyHint = this.add
      .text(W / 2, CHIP_Y0 + 150, "Порожньо. Зазирни до магазину 🛍️", {
        fontSize: "32px",
        fontFamily: FONT,
        fontStyle: "bold",
        color: "#cfe0ff",
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
      30,
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
      30,
    );
    prev.c.setDepth(3);
    next.c.setDepth(3);
    this.pageText = this.add
      .text(W / 2, H - 195, "", strokeText(28, "#ffffff", 4))
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

  private openOverlay(key: Overlay): void {
    this.cancelGhost();
    this.endPlacedDrags();
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

        const card = this.add.graphics({ x, y }).setDepth(3);
        card.fillStyle(0x000000, 0.15);
        card.fillRoundedRect(-CHIP_W / 2, -CHIP_H / 2 + 5, CHIP_W, CHIP_H, 24);
        card.fillStyle(0x4a3a82, 1);
        card.fillRoundedRect(-CHIP_W / 2, -CHIP_H / 2 + 4, CHIP_W, CHIP_H, 24);
        card.fillStyle(0xfff6e9, 1);
        card.fillRoundedRect(-CHIP_W / 2, -CHIP_H / 2, CHIP_W, CHIP_H - 4, 24);
        const icon = itemVisual(this, x, y - 20, item, 84).setDepth(4);
        const label = this.add
          .text(x, y + 42, `${item.name} ×${ownedCount(item.id)}`, {
            fontSize: "21px",
            fontFamily: FONT,
            fontStyle: "bold",
            color: "#3d2c4e",
          })
          .setOrigin(0.5)
          .setDepth(4);
        const hit = this.add
          .rectangle(x, y, CHIP_W, CHIP_H, 0xffffff, 0.001)
          .setDepth(5)
          .setInteractive({ useHandCursor: true });
        hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
          this.cancelGhost(); // a second finger must not orphan the first ghost
          const obj = itemVisual(this, p.x, p.y - 60, item, item.size)
            .setDepth(30)
            .setAlpha(0.92);
          const s = obj.scaleX;
          obj.setScale(s * 0.6);
          this.tweens.add({
            targets: obj,
            scale: s,
            duration: 160,
            ease: "Back.easeOut",
          });
          sound.pop(1.1);
          this.ghost = {
            pointerId: p.id,
            id: item.id,
            obj,
            startX: p.x,
            startY: p.y,
            moved: false,
          };
        });
        this.invObjs.push(card, icon, label, hit);
      });
  }

  private moveGhost(p: Phaser.Input.Pointer): void {
    if (!this.ghost || p.id !== this.ghost.pointerId) return;
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

  /** Finish any in-progress drag of placed items (reset visuals, save position). */
  private endPlacedDrags(): void {
    let changed = false;
    this.placedObjs.forEach((o) => {
      if (!o.lifted) return;
      o.lifted = false;
      o.dragged = false;
      this.tweens.killTweensOf(o.c);
      o.c.setDepth(4);
      o.c.setScale(1);
      o.p.x = o.c.x;
      o.p.y = o.c.y;
      o.groundY = o.c.y;
      changed = true;
    });
    if (changed) save();
  }

  private cancelGhost(): void {
    if (this.ghost) this.tweens.killTweensOf(this.ghost.obj);
    this.ghost?.obj.destroy();
    this.ghost = undefined;
  }

  private dropGhost(p: Phaser.Input.Pointer): void {
    if (!this.ghost || p.id !== this.ghost.pointerId) return;
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
      this.spawnPlaced(placed, "land");
      this.sparkles(placed.x, placed.y + (itemById(id)?.size ?? 80) * 0.4);
      save();
      sound.place();
      this.heroHop(24);
      this.refreshInventory();
      this.afterChange();
    }
    this.tweens.killTweensOf(obj);
    obj.destroy();
  }

  // ---------------------------------------------------------------- Hero

  private buildHero(): void {
    const shadow = this.add.ellipse(0, 4, 120, 26, 0x000000, 0.22);
    this.rig = this.add.container(0, 0);

    const parts = Object.entries(HERO_LAYOUT)
      .filter(([key]) => this.textures.exists(`hero:${key}`))
      .sort((a, b) => a[1].z - b[1].z);
    for (const [key, part] of parts) {
      if (ARM_PARTS.includes(key)) {
        // arms pivot near the shoulder
        const probe = this.add.image(0, 0, `hero:${key}`);
        const h = probe.height;
        probe.destroy();
        const oy = 0.15;
        const mk = (x: number, flip: boolean): Phaser.GameObjects.Image =>
          this.add
            .image(x, part.y - (0.5 - oy) * h, `hero:${key}`)
            .setOrigin(0.5, oy)
            .setFlipX(flip);
        this.armR = mk(part.x, false);
        this.armL = mk(-part.x, true);
        this.rig.add([this.armL, this.armR]);
        continue;
      }
      const img = this.add.image(part.x, part.y, `hero:${key}`);
      if (key === "eyes-open") this.eyesOpen = img;
      if (key === "eyes-closed") this.eyesClosed = img.setVisible(false);
      this.rig.add(img);
    }

    this.hero = this.add.container(160, HERO_Y, [shadow, this.rig]).setDepth(6);
    this.hero.setSize(150, 300);
    this.hero.setInteractive(
      new Phaser.Geom.Rectangle(-80, -300, 160, 300),
      Phaser.Geom.Rectangle.Contains,
    );
    this.hero.on("pointerdown", () => this.heroJump());
    this.startIdle();
    this.scheduleBlink();
  }

  private scheduleBlink(): void {
    this.time.delayedCall(Phaser.Math.Between(2200, 4600), () => {
      this.eyesOpen?.setVisible(false);
      this.eyesClosed?.setVisible(true);
      this.time.delayedCall(130, () => {
        this.eyesOpen?.setVisible(true);
        this.eyesClosed?.setVisible(false);
        this.scheduleBlink();
      });
    });
  }

  private stopHeroTweens(): void {
    this.heroTweens.forEach((t) => t.stop());
    this.heroTweens = [];
    this.tweens.killTweensOf([this.rig, this.armR, this.armL]);
    this.rig.setPosition(0, 0).setScale(1);
    this.armR.setRotation(0);
    this.armL.setRotation(0);
  }

  private startIdle(): void {
    this.stopHeroTweens();
    this.heroTweens.push(
      this.tweens.add({
        targets: this.rig,
        scaleY: 1.025,
        scaleX: 0.99,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    );
  }

  private heroHop(height: number): void {
    if (this.walking) return;
    this.stopHeroTweens();
    this.heroTweens.push(
      this.tweens.add({
        targets: this.rig,
        y: -height,
        scaleY: 1.06,
        scaleX: 0.96,
        duration: 150,
        yoyo: true,
        ease: "Quad.easeOut",
        onComplete: () => this.startIdle(),
      }),
    );
  }

  private heroJump(): void {
    if (this.walking) return;
    sound.giggle();
    this.stopHeroTweens();
    this.heroTweens.push(
      this.tweens.add({
        targets: this.rig,
        y: -70,
        scaleY: 1.08,
        scaleX: 0.94,
        duration: 220,
        yoyo: true,
        ease: "Quad.easeOut",
        onComplete: () => this.startIdle(),
      }),
      this.tweens.add({
        targets: this.armR,
        rotation: 2.6,
        duration: 220,
        yoyo: true,
      }),
      this.tweens.add({
        targets: this.armL,
        rotation: -2.6,
        duration: 220,
        yoyo: true,
      }),
    );
    this.sparkles(this.hero.x, this.hero.y - 280);
  }

  private moveHero(targetX: number): void {
    const x = Phaser.Math.Clamp(targetX, 70, W - 70);
    const dx = x - this.hero.x;
    if (Math.abs(dx) < 8) return;

    this.tweens.killTweensOf(this.hero);
    this.bob?.stop();
    this.stopHeroTweens();
    this.walking = true;
    this.hero.scaleX = dx < 0 ? -1 : 1;

    this.heroTweens.push(
      this.tweens.add({
        targets: this.rig,
        y: -16,
        scaleY: 1.05,
        scaleX: 0.97,
        duration: 140,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeOut",
      }),
      this.tweens.add({
        targets: this.armR,
        rotation: 0.6,
        duration: 140,
        yoyo: true,
        repeat: -1,
      }),
      this.tweens.add({
        targets: this.armL,
        rotation: -0.6,
        duration: 140,
        yoyo: true,
        repeat: -1,
      }),
    );
    this.tweens.add({
      targets: this.hero,
      x,
      duration: Math.abs(dx) * 2.2,
      ease: "Linear",
      onComplete: () => {
        this.walking = false;
        this.stopHeroTweens();
        // little landing squash
        this.tweens.add({
          targets: this.rig,
          scaleY: 0.92,
          scaleX: 1.06,
          duration: 90,
          yoyo: true,
          onComplete: () => this.startIdle(),
        });
      },
    });
  }
}
