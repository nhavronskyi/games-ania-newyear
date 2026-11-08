import type { RoomId } from './rooms';
import { ROOMS } from './rooms';

export interface Placed {
  uid: string;
  id: string; // item id
  room: RoomId;
  x: number;
  y: number;
}

export interface SaveData {
  v: 1;
  coins: number;
  owned: Record<string, number>; // items in inventory (not placed)
  placed: Placed[];
  room: RoomId;
}

const KEY = 'newyearania.save.v1';

function fresh(): SaveData {
  return {
    v: 1,
    coins: 100, // "earned from previous jobs"; jobs come in week 2
    owned: { tree: 1, star: 1, ball: 2, pot: 1, gift: 1 },
    placed: [],
    room: 'bedroom',
  };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as SaveData;
      if (d && d.v === 1 && typeof d.coins === 'number' && d.owned && Array.isArray(d.placed)) {
        if (!ROOMS.some((r) => r.id === d.room)) d.room = 'bedroom';
        return d;
      }
    }
  } catch {
    /* storage may be blocked (private mode) - just play without saving */
  }
  return fresh();
}

export const state: SaveData = load();

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export function ownedCount(id: string): number {
  return state.owned[id] ?? 0;
}

export function addOwned(id: string, n = 1): void {
  state.owned[id] = ownedCount(id) + n;
}

/** 0-3 stars per room: one star for every 2 placed items (max 3). */
export function roomStars(room: RoomId): number {
  const n = state.placed.filter((p) => p.room === room).length;
  return Math.min(3, Math.floor(n / 2));
}

export function totalStars(): number {
  return ROOMS.reduce((sum, r) => sum + roomStars(r.id), 0);
}

export const MAX_STARS = ROOMS.length * 3;
