import Phaser from "phaser";
import { H, W } from "./config";
import { GarlandScene } from "./scenes/GarlandScene";
import { RoomScene } from "./scenes/RoomScene";
import { ShopScene } from "./scenes/ShopScene";
import { unlockAudio } from "./sound";

// iOS only starts audio from inside a user gesture (and counts touchend/click, not touchstart).
for (const evt of ["touchend", "pointerup", "click"] as const) {
  window.addEventListener(evt, unlockAudio, { passive: true });
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#1b2a49",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [RoomScene, ShopScene, GarlandScene],
});

// Offline support (only in production builds, and only where service workers exist).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* not fatal */
    });
  });
}
