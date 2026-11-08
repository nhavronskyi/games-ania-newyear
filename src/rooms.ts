export type RoomId = 'bedroom' | 'kitchen' | 'balcony' | 'garage' | 'garden';

export interface Decor {
  e: string; // emoji
  x: number;
  y: number;
  size: number;
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
    id: 'bedroom',
    name: 'Спальня',
    icon: '🛏️',
    wall: 0xffe3d3,
    floor: 0xc98f5b,
    decor: [
      { e: '🪟', x: 560, y: 450, size: 150 },
      { e: '🛏️', x: 190, y: 700, size: 190 },
      { e: '🚪', x: 680, y: 690, size: 170 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Кухня',
    icon: '🍳',
    wall: 0xdff3e4,
    floor: 0xb9a07a,
    decor: [
      { e: '🪟', x: 220, y: 440, size: 140 },
      { e: '🧊', x: 660, y: 660, size: 190 },
      { e: '🍳', x: 440, y: 730, size: 90 },
    ],
  },
  {
    id: 'balcony',
    name: 'Балкон',
    icon: '🪴',
    wall: 0xcfe8ff,
    floor: 0x8a8f99,
    decor: [
      { e: '🏙️', x: 400, y: 420, size: 200 },
      { e: '🪴', x: 690, y: 720, size: 120 },
    ],
  },
  {
    id: 'garage',
    name: 'Гараж',
    icon: '📦',
    wall: 0xd9dbe2,
    floor: 0x6f7480,
    decor: [
      { e: '🗄️', x: 680, y: 660, size: 190 },
      { e: '📦', x: 170, y: 740, size: 120 },
      { e: '📦', x: 300, y: 750, size: 100 },
    ],
  },
  {
    id: 'garden',
    name: 'Сад',
    icon: '🌲',
    wall: 0x9fd4ff,
    floor: 0xf4f8ff, // snow
    decor: [
      { e: '☁️', x: 160, y: 330, size: 110 },
      { e: '🌲', x: 130, y: 690, size: 210 },
      { e: '🌲', x: 650, y: 690, size: 210 },
      { e: '📬', x: 400, y: 730, size: 90 },
    ],
  },
];

export const roomById = (id: RoomId): RoomDef => ROOMS.find((r) => r.id === id) ?? ROOMS[0];
