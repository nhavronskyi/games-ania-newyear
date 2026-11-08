import Phaser from 'phaser';
import { COLORS, FONT, H, W } from '../config';
import { CATEGORIES, Category, ITEMS } from '../items';
import { addOwned, ownedCount, save, state } from '../state';
import { button } from '../ui';

const CARD_W = 340;
const CARD_H = 200;
const CARD_GAP = 20;
const GRID_Y = 400;

export class ShopScene extends Phaser.Scene {
  private cat: Category = 'newyear';
  private grid: Phaser.GameObjects.GameObject[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private tabRects = new Map<Category, Phaser.GameObjects.Rectangle>();

  constructor() {
    super('Shop');
  }

  create(): void {
    // dim + block input to the room below
    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setInteractive();
    this.add.rectangle(W / 2, H / 2, W - 40, H - 120, COLORS.panel).setStrokeStyle(6, 0xffffff, 0.25);

    this.add
      .text(60, 110, '🛍️ Магазин', { fontSize: '56px', fontFamily: FONT, color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0, 0.5);
    this.coinText = this.add
      .text(W - 160, 110, '', { fontSize: '46px', fontFamily: FONT, color: '#ffd86b', fontStyle: 'bold' })
      .setOrigin(1, 0.5);
    button(this, W - 100, 110, 90, 90, '✕', COLORS.accent, () => this.close(), 44);

    const tabW = 160;
    const gap = 10;
    const x0 = (W - (CATEGORIES.length * tabW + (CATEGORIES.length - 1) * gap)) / 2 + tabW / 2;
    CATEGORIES.forEach((c, i) => {
      const b = button(this, x0 + i * (tabW + gap), 250, tabW, 100, `${c.icon}\n${c.name}`, COLORS.panelLight, () => {
        this.cat = c.id;
        this.render();
      }, 26);
      this.tabRects.set(c.id, b.r);
    });

    this.render();
  }

  private render(): void {
    this.grid.forEach((o) => o.destroy());
    this.grid = [];
    this.coinText.setText(`🪙 ${state.coins}`);
    this.tabRects.forEach((r, id) => r.setFillStyle(id === this.cat ? COLORS.accent : COLORS.panelLight));

    ITEMS.filter((i) => i.category === this.cat).forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 40 + CARD_W / 2 + col * (CARD_W + CARD_GAP) + 10;
      const y = GRID_Y + CARD_H / 2 + row * (CARD_H + CARD_GAP);

      const card = this.add.rectangle(x, y, CARD_W, CARD_H, COLORS.panelLight).setStrokeStyle(3, 0xffffff, 0.2);
      const icon = this.add.text(x - 100, y - 10, item.emoji, { fontSize: '90px', fontFamily: FONT }).setOrigin(0.5);
      const name = this.add
        .text(x + 60, y - 50, item.name, { fontSize: '32px', fontFamily: FONT, color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      const price = this.add
        .text(x + 60, y, `🪙 ${item.price}`, { fontSize: '36px', fontFamily: FONT, color: '#ffd86b' })
        .setOrigin(0.5);
      const have = this.add
        .text(x + 60, y + 55, ownedCount(item.id) > 0 ? `є: ${ownedCount(item.id)}` : 'тапни, щоб купити', {
          fontSize: '22px',
          fontFamily: FONT,
          color: '#9fb4e6',
        })
        .setOrigin(0.5);

      card.setInteractive({ useHandCursor: true });
      card.on('pointerup', () => {
        if (state.coins >= item.price) {
          state.coins -= item.price;
          addOwned(item.id);
          save();
          this.tweens.add({ targets: [icon], scale: 1.3, yoyo: true, duration: 120 });
          this.coinText.setText(`🪙 ${state.coins}`);
          have.setText(`є: ${ownedCount(item.id)}`);
        } else {
          this.tweens.add({ targets: [this.coinText], x: this.coinText.x + 12, yoyo: true, repeat: 3, duration: 50 });
          this.coinText.setColor('#ff6b6b');
          this.time.delayedCall(500, () => this.coinText.setColor('#ffd86b'));
        }
      });
      this.grid.push(card, icon, name, price, have);
    });
  }

  private close(): void {
    this.scene.resume('Room');
    this.scene.get('Room').events.emit('shop-closed');
    this.scene.stop();
  }
}
