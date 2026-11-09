export type RoomId = "bedroom" | "kitchen" | "balcony" | "garage" | "garden";

export interface Decor {
  art: string; // decor texture key (decor:<art>)
  x: number;
  y: number;
  scale?: number;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  icon: string;
  wall: number;
  floor: number;
  decor: Decor[];
}

// Static, non-interactive furniture that is "built in" to each room (from the sketches).
export const ROOMS: RoomDef[] = [
  {
    id: "bedroom",
    name: "Спальня",
    icon: "🛏️",
    wall: 0xffe3d3,
    floor: 0xc98f5b,
    decor: [
      { art: "window", x: 400, y: 470 },
      { art: "bed", x: 205, y: 690 },
      { art: "door", x: 685, y: 635 },
    ],
  },
  {
    id: "kitchen",
    name: "Кухня",
    icon: "🍳",
    wall: 0xdff3e4,
    floor: 0xb9a07a,
    decor: [
      { art: "window", x: 220, y: 470 },
      { art: "fridge", x: 660, y: 625 },
      { art: "stove", x: 440, y: 700 },
    ],
  },
  {
    id: "balcony",
    name: "Балкон",
    icon: "🪴",
    wall: 0xcfe8ff,
    floor: 0x8a8f99,
    decor: [
      { art: "city", x: 390, y: 430 },
      { art: "railing", x: 390, y: 710 },
      { art: "plantpot", x: 680, y: 695 },
    ],
  },
  {
    id: "garage",
    name: "Гараж",
    icon: "📦",
    wall: 0xd9dbe2,
    floor: 0x6f7480,
    decor: [
      { art: "cabinet", x: 670, y: 635 },
      { art: "box", x: 170, y: 735 },
      { art: "box", x: 305, y: 745, scale: 0.85 },
    ],
  },
  {
    id: "garden",
    name: "Сад",
    icon: "🌲",
    wall: 0x9fd4ff,
    floor: 0xf4f8ff, // snow
    decor: [
      { art: "cloud", x: 170, y: 375 },
      { art: "fir", x: 110, y: 650 },
      { art: "fir", x: 670, y: 650 },
      { art: "mailbox", x: 400, y: 710 },
    ],
  },
];

export const roomById = (id: RoomId): RoomDef =>
  ROOMS.find((r) => r.id === id) ?? ROOMS[0];
