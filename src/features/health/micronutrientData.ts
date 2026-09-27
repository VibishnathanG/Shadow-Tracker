import { LoggedFood } from './NutritionPlateVisualizer';
import { UserBiometrics, getUserBiometrics } from './weightFeasibility';

export type AgeGroupPreset = 'teen' | 'adult' | 'senior';

export interface NutrientRda {
  id: string;
  name: string;
  category: 'vitamin' | 'mineral';
  unit: string;
  icon: string;
  role: string;
  healthBenefit: string;
  // RDA values by sex and age group
  rda: {
    male: {
      teen: number;    // 14-18
      adult: number;   // 19-50
      senior: number;  // 51+
    };
    female: {
      teen: number;
      adult: number;
      senior: number;
    };
  };
  upperLimit?: number; // Tolerable upper intake level if applicable
}

export const RDA_MICRONUTRIENTS: NutrientRda[] = [
  // --- VITAMINS ---
  {
    id: 'vit_c',
    name: 'Vitamin C (Ascorbic Acid)',
    category: 'vitamin',
    unit: 'mg',
    icon: '🍊',
    role: 'Immunity & Collagen Synthesis',
    healthBenefit: 'Boosts immune defenses, antioxidant shield, and accelerates tissue healing.',
    rda: {
      male: { teen: 75, adult: 90, senior: 90 },
      female: { teen: 65, adult: 75, senior: 75 },
    },
    upperLimit: 2000,
  },
  {
    id: 'vit_d',
    name: 'Vitamin D (Calciferol)',
    category: 'vitamin',
    unit: 'mcg',
    icon: '☀️',
    role: 'Bone Mineralization & Mood',
    healthBenefit: 'Enhances calcium absorption, hormonal balance, bone density, and circadian energy.',
    rda: {
      male: { teen: 15, adult: 15, senior: 20 },
      female: { teen: 15, adult: 15, senior: 20 },
    },
    upperLimit: 100,
  },
  {
    id: 'vit_a',
    name: 'Vitamin A (Retinol / Carotene)',
    category: 'vitamin',
    unit: 'mcg',
    icon: '🥕',
    role: 'Vision & Epithelial Health',
    healthBenefit: 'Crucial for night vision, cornea integrity, skin clarity, and cellular regeneration.',
    rda: {
      male: { teen: 900, adult: 900, senior: 900 },
      female: { teen: 700, adult: 700, senior: 700 },
    },
    upperLimit: 3000,
  },
  {
    id: 'vit_b12',
    name: 'Vitamin B12 (Cobalamin)',
    category: 'vitamin',
    unit: 'mcg',
    icon: '🧠',
    role: 'Neurological & Nerve Myelin',
    healthBenefit: 'Powers brain focus, prevents megaloblastic anemia, and sustains central nervous integrity.',
    rda: {
      male: { teen: 2.4, adult: 2.4, senior: 2.4 },
      female: { teen: 2.4, adult: 2.4, senior: 2.4 },
    },
  },
  {
    id: 'vit_b6',
    name: 'Vitamin B6 (Pyridoxine)',
    category: 'vitamin',
    unit: 'mg',
    icon: '⚡',
    role: 'Amino Acid & Neurotransmitters',
    healthBenefit: 'Aids dopamine/serotonin synthesis, red blood cell formation, and protein metabolism.',
    rda: {
      male: { teen: 1.3, adult: 1.3, senior: 1.7 },
      female: { teen: 1.2, adult: 1.3, senior: 1.5 },
    },
    upperLimit: 100,
  },
  {
    id: 'vit_b9',
    name: 'Folate / B9 (Folic Acid)',
    category: 'vitamin',
    unit: 'mcg',
    icon: '🥬',
    role: 'DNA Synthesis & Cell Division',
    healthBenefit: 'Vital for blood cell replication, amino acid conversion, and arterial health.',
    rda: {
      male: { teen: 400, adult: 400, senior: 400 },
      female: { teen: 400, adult: 400, senior: 400 },
    },
    upperLimit: 1000,
  },
  {
    id: 'vit_e',
    name: 'Vitamin E (Tocopherol)',
    category: 'vitamin',
    unit: 'mg',
    icon: '🥑',
    role: 'Lipid Antioxidant & Skin',
    healthBenefit: 'Protects cell membranes from oxidative stress, promotes microvascular blood flow.',
    rda: {
      male: { teen: 15, adult: 15, senior: 15 },
      female: { teen: 15, adult: 15, senior: 15 },
    },
    upperLimit: 1000,
  },

  // --- MINERALS ---
  {
    id: 'min_iron',
    name: 'Iron (Fe)',
    category: 'mineral',
    unit: 'mg',
    icon: '🩸',
    role: 'Oxygen Transport & Hemoglobin',
    healthBenefit: 'Carries oxygen through hemoglobin to working muscles and prevents systemic fatigue.',
    rda: {
      male: { teen: 11, adult: 8, senior: 8 },
      female: { teen: 15, adult: 18, senior: 8 },
    },
    upperLimit: 45,
  },
  {
    id: 'min_calcium',
    name: 'Calcium (Ca)',
    category: 'mineral',
    unit: 'mg',
    icon: '🦴',
    role: 'Bone Matrix & Muscle Contraction',
    healthBenefit: 'Builds skeletal mineral density, activates muscular contraction, and supports cardiac rhythm.',
    rda: {
      male: { teen: 1300, adult: 1000, senior: 1200 },
      female: { teen: 1300, adult: 1000, senior: 1200 },
    },
    upperLimit: 2500,
  },
  {
    id: 'min_magnesium',
    name: 'Magnesium (Mg)',
    category: 'mineral',
    unit: 'mg',
    icon: '🌙',
    role: 'ATP Energy & Sleep Recovery',
    healthBenefit: 'Cofactor in 300+ enzymatic reactions, calms muscle twitching, and deepens slow-wave sleep.',
    rda: {
      male: { teen: 410, adult: 400, senior: 420 },
      female: { teen: 360, adult: 310, senior: 320 },
    },
    upperLimit: 350,
  },
  {
    id: 'min_potassium',
    name: 'Potassium (K)',
    category: 'mineral',
    unit: 'mg',
    icon: '🍌',
    role: 'Electrolyte & Blood Pressure',
    healthBenefit: 'Counterbalances sodium to regulate healthy blood pressure and prevents muscle cramps.',
    rda: {
      male: { teen: 3000, adult: 3400, senior: 3400 },
      female: { teen: 2300, adult: 2600, senior: 2600 },
    },
  },
  {
    id: 'min_zinc',
    name: 'Zinc (Zn)',
    category: 'mineral',
    unit: 'mg',
    icon: '🛡️',
    role: 'Immunity & Protein Metabolism',
    healthBenefit: 'Essential for testosterone, cellular repair, taste perception, and white blood cell activity.',
    rda: {
      male: { teen: 11, adult: 11, senior: 11 },
      female: { teen: 9, adult: 8, senior: 8 },
    },
    upperLimit: 40,
  },
];

export interface NutrientProgress {
  nutrient: NutrientRda;
  amount: number;
  target: number;
  percentage: number;
  status: 'deficient' | 'moderate' | 'optimal' | 'high';
  colorClass: string;
  bgClass: string;
  contributingFoods: { name: string; amount: number; icon: string }[];
}

/**
 * Determine age group preset from numeric age
 */
export function getAgeGroupPreset(age: number): AgeGroupPreset {
  if (age <= 18) return 'teen';
  if (age <= 50) return 'adult';
  return 'senior';
}

/**
 * Get target RDA for a specific nutrient given sex and age preset
 */
export function getRdaTarget(
  nutrient: NutrientRda,
  sex: 'male' | 'female',
  agePreset: AgeGroupPreset
): number {
  const sexGroup = nutrient.rda[sex] || nutrient.rda.male;
  return sexGroup[agePreset] || sexGroup.adult;
}

/**
 * Known nutrient density profiles (per 100g of food item / common staples)
 */
interface FoodMicronutrientProfile {
  vit_c?: number;    // mg
  vit_d?: number;    // mcg
  vit_a?: number;    // mcg
  vit_b12?: number;  // mcg
  vit_b6?: number;   // mg
  vit_b9?: number;   // mcg
  vit_e?: number;    // mg
  min_iron?: number; // mg
  min_calcium?: number; // mg
  min_magnesium?: number; // mg
  min_potassium?: number; // mg
  min_zinc?: number; // mg
}

const FOOD_NUTRIENT_DATABASE: Record<string, FoodMicronutrientProfile> = {
  // Leafy Greens / Keerai / Spinach
  spinach: { vit_a: 469, vit_c: 28, vit_b9: 194, min_iron: 2.7, min_calcium: 99, min_magnesium: 79, min_potassium: 558, min_zinc: 0.5 },
  keerai: { vit_a: 520, vit_c: 35, vit_b9: 180, min_iron: 3.2, min_calcium: 140, min_magnesium: 85, min_potassium: 500, min_zinc: 0.6 },
  kootu: { vit_a: 240, vit_c: 15, vit_b9: 90, min_iron: 2.1, min_calcium: 65, min_magnesium: 55, min_potassium: 380, min_zinc: 1.1 },
  poriyal: { vit_a: 280, vit_c: 20, vit_b9: 75, min_iron: 1.8, min_calcium: 70, min_magnesium: 45, min_potassium: 320, min_zinc: 0.8 },
  
  // Eggs
  egg: { vit_a: 160, vit_d: 2.0, vit_b12: 1.1, vit_b6: 0.17, vit_b9: 44, vit_e: 1.05, min_iron: 1.75, min_calcium: 56, min_magnesium: 12, min_potassium: 138, min_zinc: 1.29 },
  boiled_egg: { vit_a: 149, vit_d: 2.2, vit_b12: 1.1, vit_b6: 0.12, vit_b9: 44, vit_e: 1.0, min_iron: 1.7, min_calcium: 50, min_magnesium: 10, min_potassium: 126, min_zinc: 1.1 },

  // Chicken & Poultry
  chicken: { vit_b6: 0.6, vit_b12: 0.34, min_iron: 1.3, min_magnesium: 29, min_potassium: 256, min_zinc: 1.5, min_calcium: 15 },
  breast: { vit_b6: 0.8, vit_b12: 0.35, min_iron: 1.0, min_magnesium: 32, min_potassium: 334, min_zinc: 1.0, min_calcium: 12 },

  // Fish & Seafood
  fish: { vit_d: 7.0, vit_b12: 2.8, vit_b6: 0.4, min_iron: 0.9, min_magnesium: 30, min_potassium: 380, min_zinc: 0.8, min_calcium: 25 },
  salmon: { vit_d: 11.0, vit_b12: 3.2, vit_b6: 0.6, vit_e: 2.8, min_iron: 0.8, min_magnesium: 35, min_potassium: 420, min_zinc: 0.6, min_calcium: 18 },

  // Dairy & Paneer
  milk: { vit_a: 46, vit_d: 1.2, vit_b12: 0.45, vit_b6: 0.04, min_calcium: 125, min_magnesium: 11, min_potassium: 150, min_zinc: 0.4 },
  curd: { vit_a: 27, vit_b12: 0.38, min_calcium: 120, min_magnesium: 12, min_potassium: 140, min_zinc: 0.5 },
  yogurt: { vit_a: 27, vit_b12: 0.4, min_calcium: 110, min_magnesium: 12, min_potassium: 140, min_zinc: 0.6 },
  paneer: { vit_a: 80, vit_d: 0.5, vit_b12: 0.8, min_calcium: 208, min_magnesium: 18, min_potassium: 75, min_zinc: 1.8, min_iron: 0.3 },

  // Lentils, Dals, Legumes
  dal: { vit_b9: 180, vit_b6: 0.2, min_iron: 3.3, min_calcium: 35, min_magnesium: 45, min_potassium: 360, min_zinc: 1.4 },
  lentil: { vit_b9: 181, vit_b6: 0.18, min_iron: 3.3, min_calcium: 20, min_magnesium: 36, min_potassium: 369, min_zinc: 1.3 },
  chana: { vit_b9: 172, min_iron: 2.9, min_calcium: 49, min_magnesium: 48, min_potassium: 291, min_zinc: 1.5 },
  sambar: { vit_a: 60, vit_c: 8, vit_b9: 45, min_iron: 1.6, min_calcium: 30, min_magnesium: 25, min_potassium: 190, min_zinc: 0.7 },

  // Grains, Rice, Rotis, Oats
  rice: { vit_b6: 0.1, min_iron: 0.8, min_magnesium: 12, min_potassium: 35, min_zinc: 0.5, min_calcium: 10 },
  roti: { vit_b6: 0.15, vit_b9: 25, min_iron: 1.5, min_magnesium: 40, min_potassium: 110, min_zinc: 0.9, min_calcium: 20 },
  oats: { vit_b6: 0.12, vit_b9: 32, min_iron: 4.7, min_calcium: 54, min_magnesium: 138, min_potassium: 429, min_zinc: 3.6 },

  // Fruits
  banana: { vit_c: 8.7, vit_b6: 0.37, vit_a: 3, min_magnesium: 27, min_potassium: 358, min_iron: 0.26, min_calcium: 5 },
  apple: { vit_c: 4.6, vit_a: 3, min_potassium: 107, min_calcium: 6, min_magnesium: 5 },
  orange: { vit_c: 53.2, vit_a: 11, vit_b9: 30, min_calcium: 40, min_potassium: 181, min_magnesium: 10 },

  // Nuts & Seeds
  almond: { vit_e: 25.6, vit_b6: 0.14, min_calcium: 269, min_iron: 3.7, min_magnesium: 270, min_potassium: 733, min_zinc: 3.1 },
  peanut: { vit_e: 8.3, vit_b9: 110, min_iron: 2.1, min_magnesium: 168, min_potassium: 705, min_zinc: 3.3, min_calcium: 54 },

  // SUPPLEMENTS
  'centrum men multivitamin': { vit_c: 90, vit_d: 25, vit_a: 900, vit_b12: 3, vit_b6: 2, vit_e: 15, min_iron: 8, min_calcium: 210, min_magnesium: 100, min_zinc: 11, min_potassium: 80 },
  'centrum women multivitamin': { vit_c: 75, vit_d: 25, vit_a: 700, vit_b12: 6, vit_b6: 2, vit_e: 15, min_iron: 18, min_calcium: 320, min_magnesium: 100, min_zinc: 8, min_potassium: 80 },
  'whey protein isolate (1 scoop)': { min_calcium: 100, min_potassium: 150 },
  'vitamin d3': { vit_d: 50 },
  'zma': { min_zinc: 15, min_magnesium: 200, vit_b6: 4 },
  'multivitamin': { vit_c: 90, vit_d: 25, vit_a: 800, vit_b12: 3, vit_b6: 2, vit_e: 15, min_iron: 10, min_calcium: 200, min_magnesium: 100, min_zinc: 10, min_potassium: 80 },
};

/**
 * Normalizes user/preset nutrient keys (e.g., zinc -> min_zinc) to match RDA IDs
 */
export function normalizeNutrientKey(key: string): string {
  if (key === 'zinc') return 'min_zinc';
  if (key === 'magnesium') return 'min_magnesium';
  if (key === 'iron') return 'min_iron';
  if (key === 'calcium') return 'min_calcium';
  if (key === 'potassium') return 'min_potassium';
  return key;
}

/**
 * Estimates micronutrient contributions for a logged food based on name, category, and grams
 */
export function estimateFoodNutrients(food: LoggedFood): FoodMicronutrientProfile {
  const nameLower = food.name.toLowerCase();
  const anyFood = food as any;
  const isSupplement =
    Boolean(anyFood.isSupplement || anyFood.customMicros || anyFood.micros) ||
    nameLower.includes('supplement') ||
    nameLower.includes('multivitamin') ||
    nameLower.includes('vitamin') ||
    nameLower.includes('capsule') ||
    nameLower.includes('tablet') ||
    nameLower.includes('scoop') ||
    nameLower.includes('zma');

  // For supplements and discrete pill/serving doses, factor is simply the serving multiplier (quantity)
  // For standard gram-based foods, factor scales per 100g
  const grams = food.grams || (food.standardGrams || 100);
  const factor = isSupplement ? (food.quantity || 1) : ((grams / 100) * (food.quantity || 1));

  // 1. Try matching against known food staples
  let profile: FoodMicronutrientProfile = {};
  for (const [key, known] of Object.entries(FOOD_NUTRIENT_DATABASE)) {
    if (nameLower.includes(key)) {
      profile = { ...known };
      break;
    }
  }

  // 2. Custom micros injection directly from food object (if added via Add Supplement or AI skill)
  const incomingMicros = anyFood.customMicros || anyFood.micros;
  if (incomingMicros && typeof incomingMicros === 'object') {
    for (const [k, val] of Object.entries(incomingMicros)) {
      const normalized = normalizeNutrientKey(k);
      profile[normalized as keyof FoodMicronutrientProfile] = Number(val) || 0;
    }
  }

  // 3. If no direct keyword match and no custom micros, estimate from food category
  if (Object.keys(profile).length === 0) {
    const isVeg = nameLower.includes('salad') || nameLower.includes('veg') || nameLower.includes('curry');
    const isFruit = nameLower.includes('juice') || nameLower.includes('berry') || nameLower.includes('shake');
    const isHighProtein = (food.protein || 0) >= 15;

    if (isFruit) {
      profile = { vit_c: 25, vit_a: 15, min_potassium: 220, min_magnesium: 15, min_calcium: 20 };
    } else if (isVeg) {
      profile = { vit_a: 120, vit_c: 18, vit_b9: 45, min_iron: 1.4, min_calcium: 45, min_magnesium: 30, min_potassium: 260, min_zinc: 0.6 };
    } else if (isHighProtein) {
      profile = { vit_b6: 0.35, vit_b12: 0.6, min_iron: 1.5, min_zinc: 1.8, min_magnesium: 28, min_potassium: 280, min_calcium: 30 };
    } else {
      profile = { vit_b6: 0.1, min_iron: 1.0, min_calcium: 30, min_magnesium: 25, min_potassium: 150, min_zinc: 0.7 };
    }
  }

  // Scale by the calculated factor
  const scaled: FoodMicronutrientProfile = {};
  for (const [nutId, value] of Object.entries(profile)) {
    if (value !== undefined && value !== null && !isNaN(value)) {
      const normalizedKey = normalizeNutrientKey(nutId);
      scaled[normalizedKey as keyof FoodMicronutrientProfile] = Math.round((value * factor) * 100) / 100;
    }
  }
  return scaled;
}

/**
 * Calculates total micronutrient intake from an array of logged foods
 */
export function calculateDailyMicronutrients(
  loggedFoods: LoggedFood[],
  sex: 'male' | 'female',
  agePreset: AgeGroupPreset
): NutrientProgress[] {
  // Initialize accumulator map
  const totals: Record<string, { amount: number; foods: { name: string; amount: number; icon: string }[] }> = {};
  RDA_MICRONUTRIENTS.forEach(n => {
    totals[n.id] = { amount: 0, foods: [] };
  });

  // Accumulate from each logged food
  loggedFoods.forEach(food => {
    const estimates = estimateFoodNutrients(food);
    for (const [nutId, amt] of Object.entries(estimates)) {
      if (totals[nutId] && amt && amt > 0) {
        totals[nutId].amount += amt;
        totals[nutId].foods.push({
          name: food.name,
          amount: amt,
          icon: food.icon || '🥗',
        });
      }
    }
  });

  return RDA_MICRONUTRIENTS.map(n => {
    const totalData = totals[n.id] || { amount: 0, foods: [] };
    const roundedAmt = Math.round(totalData.amount * 10) / 10;
    const target = getRdaTarget(n, sex, agePreset);
    const pct = target > 0 ? Math.round((roundedAmt / target) * 100) : 0;

    let status: NutrientProgress['status'] = 'deficient';
    let colorClass = 'text-rose-400';
    let bgClass = 'bg-rose-500/20 border-rose-500/30';

    if (pct >= 130) {
      status = 'high';
      colorClass = 'text-sky-400';
      bgClass = 'bg-sky-500/20 border-sky-500/30';
    } else if (pct >= 80) {
      status = 'optimal';
      colorClass = 'text-emerald-400';
      bgClass = 'bg-emerald-500/20 border-emerald-500/30';
    } else if (pct >= 45) {
      status = 'moderate';
      colorClass = 'text-amber-400';
      bgClass = 'bg-amber-500/20 border-amber-500/30';
    }

    return {
      nutrient: n,
      amount: roundedAmt,
      target,
      percentage: pct,
      status,
      colorClass,
      bgClass,
      contributingFoods: totalData.foods.sort((a, b) => b.amount - a.amount).slice(0, 3),
    };
  });
}
