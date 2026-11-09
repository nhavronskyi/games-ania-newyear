import { itemById } from "./items";
import { ROOMS } from "./rooms";
import type { RoomId } from "./rooms";
import { MAX_STARS, roomStars, save, state, totalStars } from "./state";

export interface Goal {
  id: string;
  text: string;
  reward: number;
  done: () => boolean;
}

export interface Reward {
  kind: "goal" | "star";
  text: string;
  coins: number;
}

export const STAR_REWARD = 5;
export const GARLAND_MIN_LEN = 3;

const hasNewYearItem = (room: RoomId): boolean =>
  state.placed.some((p) => p.room === room && itemById(p.id)?.newYear === true);

/** Ordered: each goal appears only after the previous one is done. */
export const GOALS: Goal[] = [
  {
    id: "tree",
    text: "Постав ялинку в спальні",
    reward: 20,
    done: () =>
      state.placed.some((p) => p.id === "tree" && p.room === "bedroom"),
  },
  {
    id: "garland-1",
    text: "Зіграй у гру «Гірлянда» 💡",
    reward: 20,
    done: () => state.bestGarland >= GARLAND_MIN_LEN,
  },
  {
    id: "buy",
    text: "Купи щось у магазині 🛍️",
    reward: 20,
    done: () => state.purchases > 0,
  },
  {
    id: "kitchen",
    text: "Отримай 3 ⭐ на кухні",
    reward: 30,
    done: () => roomStars("kitchen") >= 3,
  },
  {
    id: "garland-6",
    text: "Повтори гірлянду з 6 вогників",
    reward: 40,
    done: () => state.bestGarland >= 6,
  },
  {
    id: "newyear-all",
    text: "Новорічний декор у кожній кімнаті",
    reward: 50,
    done: () => ROOMS.every((r) => hasNewYearItem(r.id)),
  },
  {
    id: "all-stars",
    text: `Отримай усі ${MAX_STARS} ⭐`,
    reward: 100,
    done: () => totalStars() >= MAX_STARS,
  },
];

export const currentGoal = (): Goal | undefined => GOALS[state.goalIdx];

/**
 * Pay out newly earned stars and finished goals. Mutates and saves state.
 * Returns what was paid so the UI can celebrate.
 */
export function collectRewards(): Reward[] {
  const rewards: Reward[] = [];

  for (const room of ROOMS) {
    const stars = roomStars(room.id);
    const paid = state.starsPaid[room.id] ?? 0;
    if (stars > paid) {
      const coins = (stars - paid) * STAR_REWARD;
      state.coins += coins;
      state.starsPaid[room.id] = stars;
      rewards.push({ kind: "star", text: `⭐ ${room.name}`, coins });
    }
  }

  let goal = currentGoal();
  while (goal?.done()) {
    state.coins += goal.reward;
    state.goalIdx += 1;
    rewards.push({ kind: "goal", text: `🎯 ${goal.text}`, coins: goal.reward });
    goal = currentGoal();
  }

  if (rewards.length > 0) save();
  return rewards;
}
