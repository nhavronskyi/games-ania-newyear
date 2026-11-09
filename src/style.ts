import type Phaser from "phaser";
import { FONT } from "./config";

/** White bold text with a dark purple outline: headings and labels. */
export function strokeText(
  size: number,
  color = "#ffffff",
  thickness = 6,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontSize: `${size}px`,
    fontFamily: FONT,
    fontStyle: "bold",
    color,
    stroke: "#3d2c4e",
    strokeThickness: thickness,
    align: "center",
  };
}
