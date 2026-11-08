export type Category = 'furniture' | 'newyear' | 'plants' | 'other';

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: Category;
  size: number; // font size in px when placed in a room
  newYear?: boolean; // counts for the New Year bonus
}

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'newyear', name: 'Новий рік', icon: '🎄' },
  { id: 'furniture', name: 'Меблі', icon: '🛋️' },
  { id: 'plants', name: 'Рослини', icon: '🪴' },
  { id: 'other', name: 'Інше', icon: '🧸' },
];

// Emoji are placeholders: swap `emoji` for a sprite key once real art exists.
export const ITEMS: ItemDef[] = [
  // New Year
  { id: 'tree', name: 'Ялинка', emoji: '🎄', price: 50, category: 'newyear', size: 150, newYear: true },
  { id: 'star', name: 'Зірка', emoji: '⭐', price: 15, category: 'newyear', size: 80, newYear: true },
  { id: 'lights', name: 'Гірлянда', emoji: '✨', price: 20, category: 'newyear', size: 90, newYear: true },
  { id: 'ball', name: 'Кулька', emoji: '🔮', price: 10, category: 'newyear', size: 70, newYear: true },
  { id: 'gift', name: 'Подарунок', emoji: '🎁', price: 30, category: 'newyear', size: 100, newYear: true },
  { id: 'snowman', name: 'Сніговик', emoji: '⛄', price: 40, category: 'newyear', size: 130, newYear: true },
  { id: 'stocking', name: 'Шкарпетка', emoji: '🧦', price: 15, category: 'newyear', size: 80, newYear: true },
  { id: 'candle', name: 'Свічка', emoji: '🕯️', price: 15, category: 'newyear', size: 80, newYear: true },
  // Furniture
  { id: 'sofa', name: 'Диван', emoji: '🛋️', price: 70, category: 'furniture', size: 150 },
  { id: 'chair', name: 'Стілець', emoji: '🪑', price: 25, category: 'furniture', size: 100 },
  { id: 'mirror', name: 'Дзеркало', emoji: '🪞', price: 35, category: 'furniture', size: 110 },
  { id: 'picture', name: 'Картина', emoji: '🖼️', price: 20, category: 'furniture', size: 100 },
  { id: 'bulb', name: 'Лампа', emoji: '💡', price: 20, category: 'furniture', size: 80 },
  { id: 'rug', name: 'Килимок', emoji: '🟥', price: 15, category: 'furniture', size: 110 },
  // Plants
  { id: 'pot', name: 'Вазон', emoji: '🪴', price: 20, category: 'plants', size: 110 },
  { id: 'fir', name: 'Ялина', emoji: '🌲', price: 35, category: 'plants', size: 160 },
  { id: 'tulip', name: 'Тюльпан', emoji: '🌷', price: 15, category: 'plants', size: 80 },
  { id: 'cactus', name: 'Кактус', emoji: '🌵', price: 15, category: 'plants', size: 90 },
  // Other
  { id: 'teddy', name: 'Ведмедик', emoji: '🧸', price: 25, category: 'other', size: 100 },
  { id: 'cat', name: 'Котик', emoji: '🐱', price: 100, category: 'other', size: 100 },
  { id: 'cookies', name: 'Печиво', emoji: '🍪', price: 10, category: 'other', size: 70 },
  { id: 'cocoa', name: 'Какао', emoji: '☕', price: 10, category: 'other', size: 70 },
];

export const itemById = (id: string): ItemDef | undefined => ITEMS.find((i) => i.id === id);
