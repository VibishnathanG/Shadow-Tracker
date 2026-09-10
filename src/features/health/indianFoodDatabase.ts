export interface FoodItem {
  id: string;
  name: string;
  category: 'breakfast' | 'main' | 'protein' | 'snack' | 'sweet' | 'south' | 'foreign';
  serving: string;
  standardGrams: number; // reference grams for the serving
  calories: number;      // kcal for standardGrams
  protein: number;       // g for standardGrams
  carbs: number;         // g for standardGrams
  fats: number;          // g for standardGrams
  icon: string;          // emoji
  popular?: boolean;
  isCustom?: boolean;
}

export const BASE_FOOD_DATABASE: FoodItem[] = [
  // --- South Indian Staples ---
  {
    id: 'keerai_kootu',
    name: 'Keerai Kootu / Spinach Dal',
    category: 'south',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 120,
    protein: 6.5,
    carbs: 16.0,
    fats: 3.5,
    icon: '🥬',
    popular: true,
  },
  {
    id: 'keerai_poriyal',
    name: 'Keerai Poriyal / Sautéed Greens',
    category: 'south',
    serving: '1 bowl (120g)',
    standardGrams: 120,
    calories: 95,
    protein: 4.2,
    carbs: 10.0,
    fats: 4.5,
    icon: '🥬',
    popular: true,
  },
  {
    id: 'idli_sambar',
    name: 'Idli with Sambar',
    category: 'south',
    serving: '2 pcs (120g)',
    standardGrams: 120,
    calories: 175,
    protein: 6.2,
    carbs: 34.0,
    fats: 1.5,
    icon: '⚪',
    popular: true,
  },
  {
    id: 'plain_dosa',
    name: 'Plain Crispy Dosa',
    category: 'south',
    serving: '1 medium (90g)',
    standardGrams: 90,
    calories: 165,
    protein: 4.0,
    carbs: 28.0,
    fats: 4.5,
    icon: '🥞',
    popular: true,
  },
  {
    id: 'masala_dosa',
    name: 'Masala Dosa with Potato Filling',
    category: 'south',
    serving: '1 dosa (140g)',
    standardGrams: 140,
    calories: 310,
    protein: 5.5,
    carbs: 42.0,
    fats: 13.0,
    icon: '🥞',
    popular: true,
  },
  {
    id: 'medu_vada',
    name: 'Medu Vada (Urad Dal)',
    category: 'south',
    serving: '1 pc (50g)',
    standardGrams: 50,
    calories: 140,
    protein: 4.0,
    carbs: 14.0,
    fats: 8.0,
    icon: '🍩',
  },
  {
    id: 'sambar_bowl',
    name: 'Vegetable Sambar',
    category: 'south',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 85,
    protein: 3.5,
    carbs: 14.0,
    fats: 2.0,
    icon: '🥣',
    popular: true,
  },
  {
    id: 'rasam_bowl',
    name: 'Tomato Pepper Rasam',
    category: 'south',
    serving: '1 cup (150ml)',
    standardGrams: 150,
    calories: 45,
    protein: 1.5,
    carbs: 8.0,
    fats: 1.0,
    icon: '🥣',
  },
  {
    id: 'ven_pongal',
    name: 'Ven Pongal (Ghee & Moong)',
    category: 'south',
    serving: '1 bowl (160g)',
    standardGrams: 160,
    calories: 260,
    protein: 6.5,
    carbs: 38.0,
    fats: 9.5,
    icon: '🍚',
    popular: true,
  },
  {
    id: 'curd_rice',
    name: 'Curd Rice / Thayir Sadam',
    category: 'south',
    serving: '1 bowl (180g)',
    standardGrams: 180,
    calories: 220,
    protein: 6.0,
    carbs: 36.0,
    fats: 5.5,
    icon: '🍚',
    popular: true,
  },
  {
    id: 'lemon_rice',
    name: 'Lemon Rice with Peanuts',
    category: 'south',
    serving: '1 plate (160g)',
    standardGrams: 160,
    calories: 250,
    protein: 4.5,
    carbs: 42.0,
    fats: 7.0,
    icon: '🍋',
  },
  {
    id: 'chicken_chettinad',
    name: 'Chettinad Pepper Chicken',
    category: 'south',
    serving: '1 bowl (160g)',
    standardGrams: 160,
    calories: 270,
    protein: 26.0,
    carbs: 6.0,
    fats: 15.0,
    icon: '🍗',
    popular: true,
  },
  {
    id: 'south_fish_curry',
    name: 'South Indian Fish Curry',
    category: 'south',
    serving: '1 bowl (160g)',
    standardGrams: 160,
    calories: 210,
    protein: 22.0,
    carbs: 5.0,
    fats: 11.0,
    icon: '🐟',
  },

  // --- North Indian Staples & Curries ---
  {
    id: 'roti_phulka',
    name: 'Roti / Phulka (Whole Wheat)',
    category: 'main',
    serving: '1 pc (40g)',
    standardGrams: 40,
    calories: 104,
    protein: 3.2,
    carbs: 20.0,
    fats: 2.0,
    icon: '🫓',
    popular: true,
  },
  {
    id: 'steamed_rice',
    name: 'Steamed Basmati Rice',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 195,
    protein: 3.8,
    carbs: 44.0,
    fats: 0.5,
    icon: '🍚',
    popular: true,
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 165,
    protein: 3.5,
    carbs: 35.0,
    fats: 1.5,
    icon: '🌾',
  },
  {
    id: 'dal_tadka',
    name: 'Dal Tadka (Yellow Toor Dal)',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 155,
    protein: 8.0,
    carbs: 20.0,
    fats: 5.0,
    icon: '🍲',
    popular: true,
  },
  {
    id: 'dal_makhani',
    name: 'Dal Makhani',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 260,
    protein: 8.5,
    carbs: 22.0,
    fats: 15.0,
    icon: '🍲',
  },
  {
    id: 'rajma_masala',
    name: 'Rajma Masala (Red Kidney Beans)',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 180,
    protein: 9.0,
    carbs: 26.0,
    fats: 4.5,
    icon: '🫘',
    popular: true,
  },
  {
    id: 'chole_masala',
    name: 'Chole / Chickpea Masala',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 210,
    protein: 8.5,
    carbs: 30.0,
    fats: 6.5,
    icon: '🫘',
  },
  {
    id: 'paneer_butter_masala',
    name: 'Paneer Butter Masala',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 330,
    protein: 13.0,
    carbs: 12.0,
    fats: 25.0,
    icon: '🧀',
    popular: true,
  },
  {
    id: 'palak_paneer',
    name: 'Palak Paneer (Spinach & Cottage Cheese)',
    category: 'main',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 230,
    protein: 12.0,
    carbs: 8.0,
    fats: 16.0,
    icon: '🥬',
    popular: true,
  },
  {
    id: 'aloo_paratha',
    name: 'Aloo Paratha (with butter)',
    category: 'breakfast',
    serving: '1 pc (110g)',
    standardGrams: 110,
    calories: 290,
    protein: 5.2,
    carbs: 40.0,
    fats: 12.0,
    icon: '🥔',
    popular: true,
  },
  {
    id: 'poha',
    name: 'Kanda Poha',
    category: 'breakfast',
    serving: '1 plate (150g)',
    standardGrams: 150,
    calories: 210,
    protein: 4.2,
    carbs: 36.0,
    fats: 5.5,
    icon: '🥣',
    popular: true,
  },
  {
    id: 'upma_rava',
    name: 'Rava Upma',
    category: 'breakfast',
    serving: '1 plate (150g)',
    standardGrams: 150,
    calories: 195,
    protein: 4.5,
    carbs: 32.0,
    fats: 5.5,
    icon: '🥣',
  },
  {
    id: 'veg_biryani',
    name: 'Vegetable Dum Biryani',
    category: 'main',
    serving: '1 plate (220g)',
    standardGrams: 220,
    calories: 330,
    protein: 6.5,
    carbs: 52.0,
    fats: 10.5,
    icon: '🍛',
  },
  {
    id: 'chicken_biryani',
    name: 'Chicken Dum Biryani',
    category: 'main',
    serving: '1 plate (250g)',
    standardGrams: 250,
    calories: 420,
    protein: 24.0,
    carbs: 48.0,
    fats: 14.5,
    icon: '🍗',
    popular: true,
  },

  // --- High-Protein & Fitness Staples ---
  {
    id: 'boiled_eggs_2',
    name: 'Boiled Whole Eggs (2 eggs)',
    category: 'protein',
    serving: '2 eggs (100g)',
    standardGrams: 100,
    calories: 144,
    protein: 12.6,
    carbs: 1.0,
    fats: 10.0,
    icon: '🥚',
    popular: true,
  },
  {
    id: 'egg_whites_4',
    name: 'Boiled Egg Whites (4 whites)',
    category: 'protein',
    serving: '4 whites (130g)',
    standardGrams: 130,
    calories: 68,
    protein: 14.5,
    carbs: 0.8,
    fats: 0.2,
    icon: '🍳',
    popular: true,
  },
  {
    id: 'egg_bhurji',
    name: 'Egg Bhurji / Scramble (2 eggs)',
    category: 'protein',
    serving: '1 portion (130g)',
    standardGrams: 130,
    calories: 185,
    protein: 13.0,
    carbs: 4.0,
    fats: 13.0,
    icon: '🍳',
    popular: true,
  },
  {
    id: 'raw_paneer_100',
    name: 'Raw / Grilled Paneer',
    category: 'protein',
    serving: '100g portion',
    standardGrams: 100,
    calories: 265,
    protein: 18.0,
    carbs: 4.0,
    fats: 20.0,
    icon: '🧀',
    popular: true,
  },
  {
    id: 'grilled_chicken_breast',
    name: 'Grilled Chicken Breast',
    category: 'protein',
    serving: '1 portion (150g)',
    standardGrams: 150,
    calories: 220,
    protein: 43.0,
    carbs: 0.0,
    fats: 4.5,
    icon: '🍗',
    popular: true,
  },
  {
    id: 'soya_chunks_curry',
    name: 'Soya Chunks Curry',
    category: 'protein',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 190,
    protein: 18.0,
    carbs: 14.0,
    fats: 6.0,
    icon: '🫘',
    popular: true,
  },
  {
    id: 'whey_protein',
    name: 'Whey Protein Isolate (in water)',
    category: 'protein',
    serving: '1 scoop (30g)',
    standardGrams: 30,
    calories: 120,
    protein: 25.0,
    carbs: 2.0,
    fats: 1.5,
    icon: '🥤',
    popular: true,
  },
  {
    id: 'sprouts_salad',
    name: 'Sprouted Moong Salad',
    category: 'protein',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 125,
    protein: 8.5,
    carbs: 21.0,
    fats: 1.2,
    icon: '🥗',
    popular: true,
  },
  {
    id: 'plain_curd_dahi',
    name: 'Plain Curd / Fresh Dahi',
    category: 'protein',
    serving: '1 bowl (150g)',
    standardGrams: 150,
    calories: 95,
    protein: 4.8,
    carbs: 6.5,
    fats: 5.0,
    icon: '🥛',
    popular: true,
  },

  // --- Common Foreign & Global Fitness Foods ---
  {
    id: 'rolled_oats_milk',
    name: 'Rolled Oats with Milk & Berries',
    category: 'foreign',
    serving: '1 bowl (200g)',
    standardGrams: 200,
    calories: 240,
    protein: 9.0,
    carbs: 40.0,
    fats: 5.0,
    icon: '🥣',
    popular: true,
  },
  {
    id: 'peanut_butter_toast',
    name: 'Peanut Butter on Whole Wheat Toast',
    category: 'foreign',
    serving: '2 slices (80g)',
    standardGrams: 80,
    calories: 260,
    protein: 10.0,
    carbs: 28.0,
    fats: 14.0,
    icon: '🥜',
    popular: true,
  },
  {
    id: 'greek_yogurt',
    name: 'Unsweetened Greek Yogurt',
    category: 'foreign',
    serving: '1 cup (150g)',
    standardGrams: 150,
    calories: 130,
    protein: 15.0,
    carbs: 6.0,
    fats: 4.0,
    icon: '🍨',
    popular: true,
  },
  {
    id: 'avocado_toast',
    name: 'Avocado on Sourdough Toast',
    category: 'foreign',
    serving: '1 slice (90g)',
    standardGrams: 90,
    calories: 220,
    protein: 5.0,
    carbs: 24.0,
    fats: 12.0,
    icon: '🥑',
  },
  {
    id: 'grilled_salmon',
    name: 'Grilled Salmon Fillet',
    category: 'foreign',
    serving: '1 fillet (150g)',
    standardGrams: 150,
    calories: 280,
    protein: 34.0,
    carbs: 0.0,
    fats: 16.0,
    icon: '🐟',
    popular: true,
  },
  {
    id: 'subway_chicken_wrap',
    name: 'Subway Roast Chicken Salad / Wrap',
    category: 'foreign',
    serving: '1 wrap (200g)',
    standardGrams: 200,
    calories: 320,
    protein: 26.0,
    carbs: 38.0,
    fats: 7.0,
    icon: '🌯',
  },
  {
    id: 'protein_bar',
    name: 'High Protein Whey Snack Bar',
    category: 'foreign',
    serving: '1 bar (60g)',
    standardGrams: 60,
    calories: 210,
    protein: 20.0,
    carbs: 22.0,
    fats: 6.0,
    icon: '🍫',
  },

  // --- Chai, Drinks & Snacks ---
  {
    id: 'masala_chai',
    name: 'Masala Chai (with milk)',
    category: 'snack',
    serving: '1 cup (150ml)',
    standardGrams: 150,
    calories: 95,
    protein: 2.5,
    carbs: 14.0,
    fats: 3.0,
    icon: '☕',
    popular: true,
  },
  {
    id: 'black_coffee',
    name: 'Black Coffee / Green Tea',
    category: 'snack',
    serving: '1 cup (200ml)',
    standardGrams: 200,
    calories: 3,
    protein: 0.3,
    carbs: 0.4,
    fats: 0.0,
    icon: '🍵',
  },
  {
    id: 'roasted_makhana',
    name: 'Roasted Foxnuts (Makhana)',
    category: 'snack',
    serving: '1 bowl (30g)',
    standardGrams: 30,
    calories: 105,
    protein: 3.0,
    carbs: 20.0,
    fats: 0.5,
    icon: '🍿',
    popular: true,
  },
  {
    id: 'samosa_single',
    name: 'Samosa (Fried)',
    category: 'snack',
    serving: '1 pc (80g)',
    standardGrams: 80,
    calories: 260,
    protein: 4.0,
    carbs: 28.0,
    fats: 15.0,
    icon: '🥟',
  },
  {
    id: 'gulab_jamun',
    name: 'Gulab Jamun',
    category: 'sweet',
    serving: '1 pc (40g)',
    standardGrams: 40,
    calories: 150,
    protein: 2.0,
    carbs: 22.0,
    fats: 6.5,
    icon: '🟤',
  },
];

// LocalStorage key for persisting user custom foods into library
const CUSTOM_FOODS_KEY = 'shadow_custom_foods_v2';
const QUICK_SUGGESTIONS_KEY = 'shadow_quick_food_suggestions_v2';

export function getCustomFoods(): FoodItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CUSTOM_FOODS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomFoodToLibrary(food: FoodItem): FoodItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomFoods();
    const updated = [
      { ...food, isCustom: true },
      ...existing.filter(f => f.id !== food.id && f.name.toLowerCase() !== food.name.toLowerCase()),
    ];
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function getAllFoods(): FoodItem[] {
  const custom = getCustomFoods();
  return [...custom, ...BASE_FOOD_DATABASE];
}

// Quick Suggestion Chips storage
export const DEFAULT_QUICK_SUGGESTIONS: FoodItem[] = [
  BASE_FOOD_DATABASE.find(f => f.id === 'keerai_kootu')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'idli_sambar')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'masala_dosa')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'roti_phulka')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'dal_tadka')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'boiled_eggs_2')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'grilled_chicken_breast')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'whey_protein')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'rolled_oats_milk')!,
  BASE_FOOD_DATABASE.find(f => f.id === 'peanut_butter_toast')!,
].filter(Boolean);

export function getQuickSuggestions(): FoodItem[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_SUGGESTIONS;
  try {
    const saved = localStorage.getItem(QUICK_SUGGESTIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_SUGGESTIONS;
  } catch (e) {
    return DEFAULT_QUICK_SUGGESTIONS;
  }
}

export function saveQuickSuggestion(food: FoodItem): FoodItem[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_SUGGESTIONS;
  try {
    const existing = getQuickSuggestions();
    if (existing.some(f => f.name.toLowerCase() === food.name.toLowerCase())) {
      return existing;
    }
    const updated = [food, ...existing].slice(0, 15);
    localStorage.setItem(QUICK_SUGGESTIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_QUICK_SUGGESTIONS;
  }
}

// Grams-to-Macros Proportional Recalculator
export function calculateNutrientsForGrams(
  food: { standardGrams?: number; calories: number; protein: number; carbs: number; fats: number },
  grams: number
): { calories: number; protein: number; carbs: number; fats: number } {
  const baseGrams = food.standardGrams || 100;
  const safeGrams = Math.max(1, grams || baseGrams);
  const ratio = safeGrams / baseGrams;
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fats: Math.round(food.fats * ratio * 10) / 10,
  };
}

// Auto-detect Emoji from dish/food name while user types
export function detectEmojiFromDishName(text: string): string {
  const t = text.toLowerCase().trim();
  if (!t) return '🥗';

  // South Indian / Veg / Greens
  if (t.includes('keerai') || t.includes('spinach') || t.includes('greens') || t.includes('palak') || t.includes('lettuce')) return '🥬';
  if (t.includes('dosa') || t.includes('dosai') || t.includes('pancake') || t.includes('chilla')) return '🥞';
  if (t.includes('idli') || t.includes('idly')) return '⚪';
  if (t.includes('vada') || t.includes('vadai') || t.includes('donut')) return '🍩';
  if (t.includes('sambar') || t.includes('rasam') || t.includes('soup') || t.includes('kootu')) return '🥣';
  if (t.includes('rice') || t.includes('sadam') || t.includes('biryani') || t.includes('pulao') || t.includes('pongal')) return '🍚';
  if (t.includes('roti') || t.includes('chapati') || t.includes('phulka') || t.includes('paratha') || t.includes('naan')) return '🫓';
  if (t.includes('dal') || t.includes('curry') || t.includes('gravy') || t.includes('sabzi')) return '🍲';
  if (t.includes('paneer') || t.includes('cheese') || t.includes('tofu')) return '🧀';
  if (t.includes('egg') || t.includes('omlette') || t.includes('bhurji')) return '🍳';
  if (t.includes('chicken') || t.includes('poultry')) return '🍗';
  if (t.includes('fish') || t.includes('salmon') || t.includes('tuna') || t.includes('seafood')) return '🐟';
  if (t.includes('mutton') || t.includes('lamb') || t.includes('beef') || t.includes('steak') || t.includes('meat')) return '🥩';
  if (t.includes('oats') || t.includes('oatmeal') || t.includes('cereal') || t.includes('porridge') || t.includes('upma') || t.includes('poha')) return '🥣';
  if (t.includes('curd') || t.includes('dahi') || t.includes('yogurt') || t.includes('milk') || t.includes('lassi')) return '🥛';
  if (t.includes('protein') || t.includes('whey') || t.includes('shake') || t.includes('smoothie')) return '🥤';
  if (t.includes('bread') || t.includes('toast') || t.includes('sandwich')) return '🥪';
  if (t.includes('avocado') || t.includes('guac')) return '🥑';
  if (t.includes('peanut') || t.includes('nut') || t.includes('almond') || t.includes('cashew') || t.includes('walnut')) return '🥜';
  if (t.includes('banana')) return '🍌';
  if (t.includes('apple')) return '🍎';
  if (t.includes('berry') || t.includes('berries') || t.includes('strawberry')) return '🫐';
  if (t.includes('mango')) return '🥭';
  if (t.includes('orange') || t.includes('citrus') || t.includes('lemon')) return '🍋';
  if (t.includes('coffee')) return '☕';
  if (t.includes('tea') || t.includes('chai')) return '☕';
  if (t.includes('coconut')) return '🥥';
  if (t.includes('salad') || t.includes('cucumber') || t.includes('veggie')) return '🥗';
  if (t.includes('pizza')) return '🍕';
  if (t.includes('burger')) return '🍔';
  if (t.includes('pasta') || t.includes('noodle')) return '🍝';
  if (t.includes('samosa') || t.includes('snack') || t.includes('dumpling')) return '🥟';
  if (t.includes('sweet') || t.includes('jamun') || t.includes('mithai') || t.includes('halwa') || t.includes('kheer')) return '🍬';
  if (t.includes('chocolate') || t.includes('bar')) return '🍫';

  return '🥗';
}

export interface NutritionProfile {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  emoji: string;
  matchedName: string;
}

export const COMMON_FOOD_PROFILES: { keywords: string[]; profile: NutritionProfile }[] = [
  {
    keywords: ['mutton', 'lamb', 'goat meat', 'mutton curry', 'mutton chops'],
    profile: { calories: 250, protein: 25, carbs: 0, fats: 17, emoji: '🥩', matchedName: 'Mutton / Lamb' }
  },
  {
    keywords: ['chicken breast', 'grilled chicken', 'boiled chicken'],
    profile: { calories: 165, protein: 31, carbs: 0, fats: 3.6, emoji: '🍗', matchedName: 'Chicken Breast' }
  },
  {
    keywords: ['chicken', 'chicken curry', 'chicken thigh'],
    profile: { calories: 215, protein: 24, carbs: 2, fats: 12, emoji: '🍗', matchedName: 'Chicken Curry' }
  },
  {
    keywords: ['egg white', 'egg whites'],
    profile: { calories: 52, protein: 11, carbs: 0.7, fats: 0.2, emoji: '🍳', matchedName: 'Egg Whites' }
  },
  {
    keywords: ['egg', 'boiled egg', 'eggs', 'whole egg', 'omlette', 'bhurji'],
    profile: { calories: 144, protein: 12.6, carbs: 1, fats: 10, emoji: '🥚', matchedName: 'Whole Eggs' }
  },
  {
    keywords: ['keerai', 'spinach', 'palak', 'greens', 'keerai kootu', 'poriyal'],
    profile: { calories: 65, protein: 4.5, carbs: 8, fats: 3, emoji: '🥬', matchedName: 'Keerai / Spinach' }
  },
  {
    keywords: ['paneer', 'cottage cheese', 'raw paneer'],
    profile: { calories: 265, protein: 18, carbs: 4, fats: 20, emoji: '🧀', matchedName: 'Paneer' }
  },
  {
    keywords: ['tofu', 'soya paneer'],
    profile: { calories: 80, protein: 8, carbs: 2, fats: 4, emoji: '🧀', matchedName: 'Tofu' }
  },
  {
    keywords: ['fish', 'salmon', 'fish curry', 'pomfret'],
    profile: { calories: 200, protein: 22, carbs: 2, fats: 11, emoji: '🐟', matchedName: 'Fish' }
  },
  {
    keywords: ['tuna', 'canned tuna'],
    profile: { calories: 130, protein: 28, carbs: 0, fats: 1, emoji: '🐟', matchedName: 'Tuna' }
  },
  {
    keywords: ['beef', 'steak'],
    profile: { calories: 250, protein: 26, carbs: 0, fats: 15, emoji: '🥩', matchedName: 'Beef / Steak' }
  },
  {
    keywords: ['white rice', 'rice', 'basmati rice', 'steamed rice', 'sadam'],
    profile: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, emoji: '🍚', matchedName: 'White Rice' }
  },
  {
    keywords: ['brown rice'],
    profile: { calories: 110, protein: 2.6, carbs: 23, fats: 0.9, emoji: '🌾', matchedName: 'Brown Rice' }
  },
  {
    keywords: ['roti', 'chapati', 'phulka'],
    profile: { calories: 260, protein: 8, carbs: 50, fats: 5, emoji: '🫓', matchedName: 'Roti / Chapati' }
  },
  {
    keywords: ['paratha', 'aloo paratha'],
    profile: { calories: 290, protein: 5.5, carbs: 40, fats: 12, emoji: '🫓', matchedName: 'Paratha' }
  },
  {
    keywords: ['dosa', 'plain dosa', 'masala dosa'],
    profile: { calories: 170, protein: 4, carbs: 29, fats: 4.5, emoji: '🥞', matchedName: 'Dosa' }
  },
  {
    keywords: ['idli', 'idly'],
    profile: { calories: 130, protein: 4.5, carbs: 27, fats: 0.5, emoji: '⚪', matchedName: 'Idli' }
  },
  {
    keywords: ['dal', 'yellow dal', 'toor dal', 'dal tadka'],
    profile: { calories: 105, protein: 5.5, carbs: 14, fats: 3.5, emoji: '🍲', matchedName: 'Dal Tadka' }
  },
  {
    keywords: ['sambar'],
    profile: { calories: 60, protein: 2.5, carbs: 9, fats: 1.5, emoji: '🥣', matchedName: 'Sambar' }
  },
  {
    keywords: ['rasam'],
    profile: { calories: 30, protein: 1, carbs: 5, fats: 0.5, emoji: '🥣', matchedName: 'Rasam' }
  },
  {
    keywords: ['oats', 'oatmeal', 'rolled oats'],
    profile: { calories: 120, protein: 4.5, carbs: 21, fats: 2.5, emoji: '🥣', matchedName: 'Rolled Oats' }
  },
  {
    keywords: ['greek yogurt'],
    profile: { calories: 90, protein: 10, carbs: 4, fats: 3, emoji: '🍨', matchedName: 'Greek Yogurt' }
  },
  {
    keywords: ['curd', 'dahi', 'yogurt'],
    profile: { calories: 65, protein: 3.5, carbs: 4.5, fats: 3.5, emoji: '🥛', matchedName: 'Curd / Dahi' }
  },
  {
    keywords: ['milk', 'cow milk'],
    profile: { calories: 60, protein: 3.2, carbs: 4.8, fats: 3.3, emoji: '🥛', matchedName: 'Milk' }
  },
  {
    keywords: ['whey', 'whey protein', 'protein powder'],
    profile: { calories: 400, protein: 83, carbs: 6, fats: 5, emoji: '🥤', matchedName: 'Whey Protein' }
  },
  {
    keywords: ['peanut butter'],
    profile: { calories: 590, protein: 25, carbs: 20, fats: 50, emoji: '🥜', matchedName: 'Peanut Butter' }
  },
  {
    keywords: ['almond', 'almonds', 'badam'],
    profile: { calories: 579, protein: 21, carbs: 22, fats: 50, emoji: '🥜', matchedName: 'Almonds' }
  },
  {
    keywords: ['walnut', 'walnuts', 'akhrot'],
    profile: { calories: 654, protein: 15, carbs: 14, fats: 65, emoji: '🥜', matchedName: 'Walnuts' }
  },
  {
    keywords: ['apple'],
    profile: { calories: 52, protein: 0.3, carbs: 14, fats: 0.2, emoji: '🍎', matchedName: 'Apple' }
  },
  {
    keywords: ['banana'],
    profile: { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, emoji: '🍌', matchedName: 'Banana' }
  },
  {
    keywords: ['potato', 'aloo'],
    profile: { calories: 87, protein: 1.9, carbs: 20, fats: 0.1, emoji: '🥔', matchedName: 'Potato' }
  },
  {
    keywords: ['sweet potato'],
    profile: { calories: 86, protein: 1.6, carbs: 20, fats: 0.1, emoji: '🥔', matchedName: 'Sweet Potato' }
  },
  {
    keywords: ['pasta', 'macaroni', 'spaghetti'],
    profile: { calories: 131, protein: 5, carbs: 25, fats: 1.1, emoji: '🍝', matchedName: 'Pasta' }
  },
  {
    keywords: ['pizza'],
    profile: { calories: 266, protein: 11, carbs: 33, fats: 10, emoji: '🍕', matchedName: 'Pizza' }
  },
  {
    keywords: ['burger'],
    profile: { calories: 250, protein: 13, carbs: 24, fats: 12, emoji: '🍔', matchedName: 'Burger' }
  },
  {
    keywords: ['prawn', 'prawns', 'shrimp', 'shrimps', 'eral'],
    profile: { calories: 100, protein: 24, carbs: 0.2, fats: 0.3, emoji: '🦐', matchedName: 'Prawns / Shrimp' }
  },
  {
    keywords: ['salad', 'green salad', 'cucumber salad', 'vegetable salad'],
    profile: { calories: 35, protein: 1.5, carbs: 6, fats: 0.5, emoji: '🥗', matchedName: 'Fresh Salad' }
  },
  {
    keywords: ['chai', 'tea', 'masala chai'],
    profile: { calories: 65, protein: 1.7, carbs: 9, fats: 2, emoji: '☕', matchedName: 'Chai' }
  },
  {
    keywords: ['coffee', 'filter coffee'],
    profile: { calories: 50, protein: 2, carbs: 6, fats: 2, emoji: '☕', matchedName: 'Coffee' }
  },
];

export function lookupCommonFoodNutrition(query: string, grams: number = 100): NutritionProfile | null {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return null;

  // 1. Check exact keyword match in COMMON_FOOD_PROFILES first (e.g. 'mutton', 'chicken', 'egg')
  for (const entry of COMMON_FOOD_PROFILES) {
    for (const kw of entry.keywords) {
      if (q === kw.toLowerCase()) {
        const scale = grams / 100;
        return {
          calories: Math.round(entry.profile.calories * scale),
          protein: Math.round(entry.profile.protein * scale * 10) / 10,
          carbs: Math.round(entry.profile.carbs * scale * 10) / 10,
          fats: Math.round(entry.profile.fats * scale * 10) / 10,
          emoji: entry.profile.emoji,
          matchedName: entry.profile.matchedName,
        };
      }
    }
  }

  // 2. Check word boundary / substring in COMMON_FOOD_PROFILES
  for (const entry of COMMON_FOOD_PROFILES) {
    for (const kw of entry.keywords) {
      const lkw = kw.toLowerCase();
      if (q.includes(lkw) || (lkw.includes(q) && q.length >= 3)) {
        const scale = grams / 100;
        return {
          calories: Math.round(entry.profile.calories * scale),
          protein: Math.round(entry.profile.protein * scale * 10) / 10,
          carbs: Math.round(entry.profile.carbs * scale * 10) / 10,
          fats: Math.round(entry.profile.fats * scale * 10) / 10,
          emoji: entry.profile.emoji,
          matchedName: entry.profile.matchedName,
        };
      }
    }
  }

  // 3. Fallback: Check BASE_FOOD_DATABASE items
  const dbMatch = BASE_FOOD_DATABASE.find(
    item => item.name.toLowerCase() === q || item.name.toLowerCase().includes(q) || (q.length >= 4 && q.includes(item.name.toLowerCase()))
  );
  if (dbMatch) {
    const scale = grams / (dbMatch.standardGrams || 100);
    return {
      calories: Math.round(dbMatch.calories * scale),
      protein: Math.round(dbMatch.protein * scale * 10) / 10,
      carbs: Math.round(dbMatch.carbs * scale * 10) / 10,
      fats: Math.round(dbMatch.fats * scale * 10) / 10,
      emoji: dbMatch.icon,
      matchedName: dbMatch.name,
    };
  }

  return null;
}

