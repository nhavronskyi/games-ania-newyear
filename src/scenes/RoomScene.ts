import Phaser from 'phaser';
import { COLORS, FLOOR_Y, FONT, H, HERO_Y, PANEL_TOP, ROOM_BOTTOM, ROOM_TOP, TABS_Y, W } from '../config';
import { ITEMS, itemById } from '../items';
import { ROOMS, RoomId, roomById } from '../rooms';
import { MAX_STARS, Placed, addOwned, ownedCount, save, state, totalStars, uid } from '../state';
import { button } from '../ui';

const COLS = 5;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;
const CHIP_W = 136;
const CHIP_H = 130;
const CHIP_GAP = 10;
const CHIP_X0 = 30;
const CHIP_Y0 = PANEL_TOP + 90;

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
  private tabRects = new Map<RoomId, Phaser.GameObjects.Rectangle>();
  private invObjs: Phaser.GameObjects.GameObject[] = [];
  private emptyHint!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private page = 0;
  private ghost?: { id: string; obj: Phaser.GameObjects.Text };

  constructor() {
    super('Room');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.bg = this.add.graphics().setDepth(0);

    this.buildTopBar();
    this.buildTabs();
    this.buildPanel();
    this.buildHero();

    // Tap the room to walk there.
    const zone = this.add
      .zone(0, ROOM_TOP, W, ROOM_BOTTOM - ROOM_TOP)
      .setOrigin(0)
      .setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.moveHero(p.x));

    // Dragging a chip out of the inventory.
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.ghost) this.ghost.obj.setPosition(p.x, p.y - 60);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.dropGhost(p));

    this.events.on('shop-closed', () => {
      this.refreshHud();
      this.refreshInventory();
    });

    this.switchRoom(state.room);
    this.refreshInventory();
  }

  // ---------------------------------------------------------------- HUD

  private buildTopBar(): void {
    this.coinText = this.add
      .text(30, 55, '', { fontSize: '46px', fontFamily: FONT, color: '#ffd86b', fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.starText = this.add
      .text(W - 30, 55, '', { fontSize: '46px', fontFamily: FONT, color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(1, 0.5)
      .setDepth(10);
    this.roomTitle = this.add
      .text(W / 2, 55, '', { fontSize: '40px', fontFamily: FONT, color: '#cfe0ff' })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private refreshHud(): void {
    this.coinText.setText(`🪙 ${state.coins}`);
    this.starText.setText(`⭐ ${totalStars()}/${MAX_STARS}`);
    this.roomTitle.setText(roomById(state.room).name);
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
    if (id === 'garden') {
      // night-ish garden: darker sky
      g.fillStyle(0x1f3a6b, 0.55).fillRect(0, ROOM_TOP, W, FLOOR_Y - ROOM_TOP);
    }
    if (id === 'balcony') {
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
    state.placed.filter((p) => p.room === id).forEach((p) => this.spawnPlaced(p));

    // tab highlight
    this.tabRects.forEach((r, rid) => r.setFillStyle(rid === id ? COLORS.accent : COLORS.panel));
    this.refreshHud();
  }

  private spawnPlaced(p: Placed): void {
    const def = itemById(p.id);
    if (!def) return;
    const obj = this.add
      .text(p.x, p.y, def.emoji, { fontSize: `${def.size}px`, fontFamily: FONT })
      .setOrigin(0.5)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    this.input.setDraggable(obj);

    obj.on('dragstart', () => obj.setScale(1.15).setDepth(20));
    obj.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      obj.setPosition(Phaser.Math.Clamp(dx, 40, W - 40), Phaser.Math.Clamp(dy, ROOM_TOP + 30, H - 20));
    });
    obj.on('dragend', () => {
      obj.setScale(1).setDepth(4);
      if (obj.y > ROOM_BOTTOM) {
        // dropped on the inventory panel -> put it back
        state.placed = state.placed.filter((q) => q.uid !== p.uid);
        addOwned(p.id);
        this.placedObjs.delete(p.uid);
        obj.destroy();
        this.refreshInventory();
      } else {
        p.x = obj.x;
        p.y = obj.y;
      }
      save();
      this.refreshHud();
    });
    this.placedObjs.set(p.uid, obj);
  }

  // ----------------------------------------------------------- Inventory

  private buildPanel(): void {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(COLORS.panel, 1).fillRoundedRect(0, PANEL_TOP - 10, W, H - PANEL_TOP + 10, 36);

    this.add
      .text(30, PANEL_TOP + 22, '🎒 Інвентар', { fontSize: '36px', fontFamily: FONT, color: '#ffffff', fontStyle: 'bold' })
      .setDepth(3);
    this.add
      .text(W - 30, PANEL_TOP + 28, 'тягни в кімнату ↑  ·  назад — тягни вниз ↓', {
        fontSize: '22px',
        fontFamily: FONT,
        color: '#9fb4e6',
      })
      .setOrigin(1, 0)
      .setDepth(3);

    this.emptyHint = this.add
      .text(W / 2, CHIP_Y0 + 150, 'Порожньо. Зазирни до магазину 🛍️', {
        fontSize: '32px',
        fontFamily: FONT,
        color: '#9fb4e6',
      })
      .setOrigin(0.5)
      .setDepth(3);

    const prev = button(this, 90, H - 195, 110, 56, '◀', COLORS.panelLight, () => this.turnPage(-1), 36);
    const next = button(this, W - 90, H - 195, 110, 56, '▶', COLORS.panelLight, () => this.turnPage(1), 36);
    prev.c.setDepth(3);
    next.c.setDepth(3);
    this.pageText = this.add
      .text(W / 2, H - 195, '', { fontSize: '28px', fontFamily: FONT, color: '#cfe0ff' })
      .setOrigin(0.5)
      .setDepth(3);

    button(this, W / 2, H - 100, 560, 110, '🛍️  Магазин', COLORS.accent, () => this.openShop(), 46).c.setDepth(3);
  }

  private turnPage(d: number): void {
    this.page += d;
    this.refreshInventory();
  }

  private openShop(): void {
    this.scene.launch('Shop');
    this.scene.pause();
  }

  private refreshInventory(): void {
    this.invObjs.forEach((o) => o.destroy());
    this.invObjs = [];

    const list = ITEMS.filter((i) => ownedCount(i.id) > 0);
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    this.emptyHint.setVisible(list.length === 0);
    this.pageText.setText(pages > 1 ? `${this.page + 1} / ${pages}` : '');

    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = CHIP_X0 + col * (CHIP_W + CHIP_GAP) + CHIP_W / 2;
      const y = CHIP_Y0 + row * (CHIP_H + CHIP_GAP) + CHIP_H / 2;

      const card = this.add.rectangle(x, y, CHIP_W, CHIP_H, COLORS.panelLight).setStrokeStyle(3, 0xffffff, 0.2).setDepth(3);
      const icon = this.add
        .text(x, y - 14, item.emoji, { fontSize: '64px', fontFamily: FONT })
        .setOrigin(0.5)
        .setDepth(4);
      const label = this.add
        .text(x, y + 44, `${item.name} ×${ownedCount(item.id)}`, { fontSize: '22px', fontFamily: FONT, color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(4);

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', (p: Phaser.Input.Pointer) => {
        const obj = this.add
          .text(p.x, p.y - 60, item.emoji, { fontSize: `${item.size}px`, fontFamily: FONT })
          .setOrigin(0.5)
          .setDepth(30)
          .setAlpha(0.9);
        this.ghost = { id: item.id, obj };
      });
      this.invObjs.push(card, icon, label);
    });
  }

  private dropGhost(p: Phaser.Input.Pointer): void {
    if (!this.ghost) return;
    const { id, obj } = this.ghost;
    this.ghost = undefined;
    const inRoom = p.y >= ROOM_TOP && p.y <= ROOM_BOTTOM;
    if (inRoom && ownedCount(id) > 0) {
      const placed: Placed = {
        uid: uid(),
        id,
        room: state.room,
        x: Phaser.Math.Clamp(obj.x, 40, W - 40),
        y: Phaser.Math.Clamp(obj.y, ROOM_TOP + 30, ROOM_BOTTOM - 20),
      };
      addOwned(id, -1);
      state.placed.push(placed);
      this.spawnPlaced(placed);
      save();
      this.refreshHud();
      this.refreshInventory();
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
    g.fillStyle(0xf3c9a5).fillRect(-52, -110, 12, 50).fillRect(40, -110, 12, 50);
    // hair + head
    g.fillStyle(0x6b3f23).fillCircle(0, -172, 40);
    g.fillStyle(0xf3c9a5).fillCircle(0, -164, 34);
    g.fillStyle(0x6b3f23).fillEllipse(0, -190, 70, 26);
    // face
    g.fillStyle(0x2b2b2b).fillCircle(-12, -162, 4).fillCircle(12, -162, 4);
    g.fillStyle(0xff8fa3).fillCircle(-22, -150, 6).fillCircle(22, -150, 6);
    g.lineStyle(3, 0xb0446a).beginPath().arc(0, -150, 10, 0.2, Math.PI - 0.2).strokePath();
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

    this.bob = this.tweens.add({ targets: this.heroBody, y: -12, duration: 140, yoyo: true, repeat: -1 });
    this.tweens.add({
      targets: this.hero,
      x,
      duration: Math.abs(dx) * 2.2,
      ease: 'Linear',
      onComplete: () => {
        this.bob?.stop();
        this.heroBody.y = 0;
      },
    });
  }
}
