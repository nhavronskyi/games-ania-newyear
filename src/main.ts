import Phaser from 'phaser';
import { H, W } from './config';
import { RoomScene } from './scenes/RoomScene';
import { ShopScene } from './scenes/ShopScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1b2a49',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [RoomScene, ShopScene],
});

// Offline support (only in production builds, and only where service workers exist).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* not fatal */
    });
  });
}
