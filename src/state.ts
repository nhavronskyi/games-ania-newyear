import type { RoomId } from "./rooms";
import { ITEMS } from "./items";
import { ROOMS } from "./rooms";

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
  bestGarland: number; // longest garland sequence ever repeated (0 = never played)
  goalIdx: number; // index of the current goal in GOALS
  starsPaid: Partial<Record<RoomId, number>>; // stars per room already rewarded with coins
  purchases: number; // shop purchases made
  muted: boolean;
  starHelpSeen: boolean; // the "how to earn stars" popup was shown once
}

const KEY = "newyearania.save.v1";
const STARTER_ITEMS = { tree: 1, star: 1, ball: 2, pot: 1, gift: 1 };

function fresh(): SaveData {
  return {
    v: 1,
    coins: 100,
    owned: { ...STARTER_ITEMS },
    placed: [],
    room: "bedroom",
    bestGarland: 0,
    goalIdx: 0,
    starsPaid: {},
    purchases: 0,
    muted: false,
    starHelpSeen: false,
  };
}

function isValidSave(d: Partial<SaveData> | null): d is Partial<SaveData> {
  return (
    !!d &&
    d.v === 1 &&
    typeof d.coins === "number" &&
    !!d.owned &&
    Array.isArray(d.placed)
  );
}

/** Old saves lack newer fields: fill them with defaults instead of discarding progress. */
function migrate(d: Partial<SaveData>): SaveData {
  const merged: SaveData = { ...fresh(), ...d };
  if (!ROOMS.some((r) => r.id === merged.room)) merged.room = "bedroom";
  const known = new Set(ITEMS.map((i) => i.id));
  const roomIds = new Set<string>(ROOMS.map((r) => r.id));
  merged.placed = merged.placed.filter(
    (p) =>
      known.has(p.id) &&
      roomIds.has(p.room) &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y),
  );
  merged.owned = Object.fromEntries(
    Object.entries(merged.owned).filter(([id]) => known.has(id)),
  );
  if (d.purchases === undefined) {
    // Saves from before `purchases` existed: anything beyond the starter set must have been bought.
    const ids = [
      ...Object.keys(merged.owned).filter((k) => merged.owned[k] > 0),
      ...merged.placed.map((p) => p.id),
    ];
    if (ids.some((id) => !(id in STARTER_ITEMS))) merged.purchases = 1;
  }
  return merged;
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData> | null;
      if (isValidSave(parsed)) return migrate(parsed);
    }
  } catch {
    /* storage may be blocked (private mode) or the save is corrupt - just start fresh */
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

/** Wipe all progress in place (keeps the sound setting) and persist. */
export function resetState(): void {
  const { muted } = state;
  Object.assign(state, fresh(), { muted });
  save();
}
