export type FeasibilityLevel = 1 | 2 | 3 | 4 | 5;

export interface UserBiometrics {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  preferredWeeklyLossKg?: number;
  days?: number;
}

export interface FeasibilityResult {
  level: FeasibilityLevel;
  levelKey: 'danger' | 'warning' | 'challenging' | 'good' | 'achievable';
  title: string;
  badge: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  deltaKg: number;
  direction: 'loss' | 'gain' | 'maintain';
  days: number;
  kgPerWeek: number;
  pctBodyWeightPerWeek: number; // e.g. 0.7% of total bodyweight
  dailyDeficitSurplusKcal: number;
  targetDailyCalories: number; // personalized based on Mifflin-St Jeor TDEE
  safetyScore: number; // 0 - 100
  summary: string;
  detailedAdvice: string;
  keyPoints: string[];
  // Scientific Biometric Context
  bmi: number;
  bmiCategory: string;
  bmiColor: string;
  bmr: number;
  tdee: number;
  minSafeCalories: number;
  maxSafeKgPerWeek: number;
  recommendedKgPerWeek: number;
  gentleKgPerWeek: number;
  athleticKgPerWeek: number;
  projectedDateStr: string;
}

export const BIOMETRICS_STORAGE_KEY = 'shadow_user_biometrics_v2';

export const DEFAULT_BIOMETRICS: UserBiometrics = {
  age: 28,
  sex: 'male',
  heightCm: 175,
  currentWeightKg: 80,
  targetWeightKg: 72,
  activityLevel: 'moderate',
  preferredWeeklyLossKg: 0.5,
  days: 112,
};

export function getUserBiometrics(): UserBiometrics {
  if (typeof window === 'undefined') return DEFAULT_BIOMETRICS;
  try {
    const raw = localStorage.getItem(BIOMETRICS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_BIOMETRICS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load user biometrics:', e);
  }
  return DEFAULT_BIOMETRICS;
}

export function saveUserBiometrics(biometrics: Partial<UserBiometrics>): UserBiometrics {
  if (typeof window === 'undefined') return DEFAULT_BIOMETRICS;
  try {
    const current = getUserBiometrics();
    const updated = { ...current, ...biometrics };
    localStorage.setItem(BIOMETRICS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save user biometrics:', e);
    return DEFAULT_BIOMETRICS;
  }
}

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation.
 * Clinically validated as the most accurate predictor of resting metabolic rate.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const safeWeight = Math.max(30, weightKg || 70);
  const safeHeight = Math.max(100, heightCm || 170);
  const safeAge = Math.max(14, Math.min(100, age || 28));

  if (sex === 'male') {
    return Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5);
  }
  return Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on activity factor.
 */
export function calculateTDEE(
  bmr: number,
  activity: 'sedentary' | 'light' | 'moderate' | 'very_active' = 'moderate'
): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,       // Desk job, little exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    very_active: 1.725,   // Heavy training 6-7 days/week
  };
  const factor = multipliers[activity] || 1.55;
  return Math.round(bmr * factor);
}

/**
 * Projected target date helper
 */
export function calculateProjectedDate(days: number): string {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.max(1, days));
  return targetDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Full scientific personalized feasibility calculation using Age, Sex, Height, and Weight.
 */
export function calculatePersonalizedFeasibility(params: {
  currentWeightKg: number;
  targetWeightKg: number;
  days?: number;
  weeklyLossKg?: number;
  age?: number;
  sex?: 'male' | 'female';
  heightCm?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'very_active';
}): FeasibilityResult {
  const cur = Math.max(30, params.currentWeightKg || 75);
  const tgt = Math.max(30, params.targetWeightKg || 70);
  const age = Math.max(14, Math.min(100, params.age || 28));
  const sex = params.sex || 'male';
  const heightCm = Math.max(100, Math.min(250, params.heightCm || 175));
  const activity = params.activityLevel || 'moderate';

  const deltaKg = tgt - cur;
  const absDeltaKg = Math.abs(deltaKg);

  // Compute BMI
  const heightM = heightCm / 100;
  const bmi = Math.round((cur / (heightM * heightM)) * 10) / 10;
  let bmiCategory = 'Healthy Weight';
  let bmiColor = 'text-emerald-400';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-sky-400';
  } else if (bmi < 25) {
    bmiCategory = 'Healthy Weight';
    bmiColor = 'text-emerald-400';
  } else if (bmi < 30) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-amber-400';
  } else if (bmi < 35) {
    bmiCategory = 'Class I Obese';
    bmiColor = 'text-orange-500';
  } else {
    bmiCategory = 'Severe Obese';
    bmiColor = 'text-rose-500';
  }

  // Calculate BMR & TDEE
  const bmr = calculateBMR(cur, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activity);

  // Minimum safe daily calorie floor
  const minSafeCalories =
    sex === 'male'
      ? Math.max(1500, Math.round(bmr * 0.85))
      : Math.max(1200, Math.round(bmr * 0.85));

  // Physiological safe rate ceilings (% of body weight)
  // Max safe loss: ~1.0% body weight / week (caps at 1.2kg/week for safety)
  const maxSafeKgPerWeek = Math.min(1.2, Math.round((cur * 0.01) * 100) / 100);
  // Recommended sweet spot: ~0.5% - 0.6% of body weight / week
  const recommendedKgPerWeek = Math.max(0.3, Math.min(0.75, Math.round((cur * 0.006) * 100) / 100));
  // Gentle recomp: ~0.3% of body weight / week
  const gentleKgPerWeek = Math.max(0.2, Math.min(0.4, Math.round((cur * 0.0035) * 100) / 100));
  // Athletic shred: ~0.8% of body weight / week
  const athleticKgPerWeek = Math.max(0.4, Math.min(1.0, Math.round((cur * 0.008) * 100) / 100));

  // Determine days and kgPerWeek based on inputs
  let safeDays = 30;
  let kgPerWeek = 0.5;

  if (params.weeklyLossKg !== undefined && params.weeklyLossKg > 0) {
    kgPerWeek = params.weeklyLossKg;
    safeDays = absDeltaKg > 0 ? Math.max(7, Math.round((absDeltaKg / kgPerWeek) * 7)) : 30;
  } else if (params.days !== undefined && params.days > 0) {
    safeDays = Math.max(1, params.days);
    kgPerWeek = (absDeltaKg / safeDays) * 7;
  } else {
    kgPerWeek = recommendedKgPerWeek;
    safeDays = absDeltaKg > 0 ? Math.max(7, Math.round((absDeltaKg / kgPerWeek) * 7)) : 30;
  }

  const roundedKgPerWeek = Math.round(kgPerWeek * 100) / 100;
  const pctBodyWeightPerWeek = Math.round((roundedKgPerWeek / cur) * 1000) / 10;
  // 1 kg of fat loss requires ~7,700 kcal deficit
  const totalKcalShift = absDeltaKg * 7700;
  const dailyKcalShift = Math.round(totalKcalShift / safeDays);
  const projectedDateStr = calculateProjectedDate(safeDays);

  // 1. Maintenance Branch
  if (absDeltaKg < 0.2) {
    return {
      level: 4,
      levelKey: 'good',
      title: 'Healthy Weight Maintenance',
      badge: 'MAINTENANCE',
      emoji: '⚖️',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      glowClass: 'shadow-emerald-500/20',
      deltaKg: 0,
      direction: 'maintain',
      days: safeDays,
      kgPerWeek: 0,
      pctBodyWeightPerWeek: 0,
      dailyDeficitSurplusKcal: 0,
      targetDailyCalories: tdee,
      safetyScore: 98,
      summary: `Maintenance target: ${tdee} kcal/day. Balances daily energy output with recovery and muscle density.`,
      detailedAdvice: `Based on your profile (${age}yo ${sex}, ${heightCm}cm, ${cur}kg), your maintenance TDEE is ~${tdee} kcal/day. Focus on progressive overload in training and body recomposition.`,
      keyPoints: [
        `Consume maintenance budget of ~${tdee} kcal/day`,
        `Target 1.6g - 2.0g protein/kg (~${Math.round(cur * 1.8)}g protein/day)`,
        'Focus on strength progression and sleep consistency',
      ],
      bmi,
      bmiCategory,
      bmiColor,
      bmr,
      tdee,
      minSafeCalories,
      maxSafeKgPerWeek,
      recommendedKgPerWeek,
      gentleKgPerWeek,
      athleticKgPerWeek,
      projectedDateStr,
    };
  }

  // 2. Weight Loss Branch
  if (deltaKg < 0) {
    const targetDailyCalories = Math.max(700, tdee - dailyKcalShift);

    // LEVEL 1: DANGER / CRASH DIET
    // Triggered if:
    // - losing > 1.3% of total body weight per week, OR
    // - kgPerWeek > 1.4 kg/wk, OR
    // - daily deficit > 1300 kcal, OR
    // - target calories drop below 1000 kcal or deep below safe floor
    if (
      pctBodyWeightPerWeek > 1.3 ||
      roundedKgPerWeek > 1.4 ||
      dailyKcalShift > 1300 ||
      targetDailyCalories < minSafeCalories - 250
    ) {
      return {
        level: 1,
        levelKey: 'danger',
        title: '🚨 DANGER: EXTREME METABOLIC CRASH',
        badge: 'HAZARDOUS DEFICIT',
        emoji: '🚨',
        colorClass: 'text-rose-500',
        bgClass: 'bg-rose-500/15',
        borderClass: 'border-rose-500/50',
        glowClass: 'shadow-rose-500/30',
        deltaKg,
        direction: 'loss',
        days: safeDays,
        kgPerWeek: roundedKgPerWeek,
        pctBodyWeightPerWeek,
        dailyDeficitSurplusKcal: dailyKcalShift,
        targetDailyCalories,
        safetyScore: 15,
        summary: `Requires extreme deficit of ~${dailyKcalShift} kcal/day (${roundedKgPerWeek} kg/wk = ${pctBodyWeightPerWeek}% body wt/wk). Leaves only ${targetDailyCalories} kcal/day!`,
        detailedAdvice: `Losing ${absDeltaKg} kg in ${safeDays} days requires eating below your BMR (${bmr} kcal) at ${targetDailyCalories} kcal. This triggers severe thyroid suppression, acute muscle breakdown, lethargy, and a 95%+ risk of rebound weight regain. Increase timeline to at least ${Math.round(absDeltaKg * 14)} days.`,
        keyPoints: [
          `Severe muscle wasting (body catabolizes lean tissue for energy)`,
          `Drops intake below safe physiological floor (${minSafeCalories} kcal/day)`,
          `Hormonal shutdown: lowered testosterone, elevated cortisol, slowed thyroid`,
          `Recommendation: Reduce pace to ${recommendedKgPerWeek} kg/week`,
        ],
        bmi,
        bmiCategory,
        bmiColor,
        bmr,
        tdee,
        minSafeCalories,
        maxSafeKgPerWeek,
        recommendedKgPerWeek,
        gentleKgPerWeek,
        athleticKgPerWeek,
        projectedDateStr,
      };
    }

    // LEVEL 2: WARNING / AGGRESSIVE
    // Triggered if:
    // - losing 1.0% - 1.3% of body weight / week, OR
    // - deficit > 900 kcal, OR
    // - target calories drop below safe calorie floor
    if (
      pctBodyWeightPerWeek > 1.0 ||
      roundedKgPerWeek > maxSafeKgPerWeek ||
      dailyKcalShift > 900 ||
      targetDailyCalories < minSafeCalories
    ) {
      return {
        level: 2,
        levelKey: 'warning',
        title: '⚠️ WARNING: VERY AGGRESSIVE PACE',
        badge: 'HIGH DEFICIT',
        emoji: '⚠️',
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/40',
        glowClass: 'shadow-amber-500/25',
        deltaKg,
        direction: 'loss',
        days: safeDays,
        kgPerWeek: roundedKgPerWeek,
        pctBodyWeightPerWeek,
        dailyDeficitSurplusKcal: dailyKcalShift,
        targetDailyCalories,
        safetyScore: 45,
        summary: `Fast cut requiring ~${dailyKcalShift} kcal/day deficit (${roundedKgPerWeek} kg/wk = ${pctBodyWeightPerWeek}% body wt/wk). Pushes close to minimum calorie floor (${targetDailyCalories} kcal/day).`,
        detailedAdvice: `While physically possible for a short sprint (2-3 weeks), this rate causes intense hunger, sleep disruptions, and workout fatigue. Maintain high protein (2.0g/kg = ${Math.round(cur * 2)}g) and consider adding 2-4 weeks to ease the deficit.`,
        keyPoints: [
          `High risk of mental fatigue and training strength loss`,
          `Target calories (${targetDailyCalories} kcal) border your clinical floor (${minSafeCalories} kcal)`,
          `Requires meticulous adherence with zero dietary margin for error`,
          `Recommendation: Ease rate to ~${recommendedKgPerWeek} - ${athleticKgPerWeek} kg/week`,
        ],
        bmi,
        bmiCategory,
        bmiColor,
        bmr,
        tdee,
        minSafeCalories,
        maxSafeKgPerWeek,
        recommendedKgPerWeek,
        gentleKgPerWeek,
        athleticKgPerWeek,
        projectedDateStr,
      };
    }

    // LEVEL 3: CHALLENGING / ATHLETE CUT
    // Triggered if:
    // - losing 0.75% - 1.0% of body weight / week
    if (pctBodyWeightPerWeek > 0.75 || dailyKcalShift > 700) {
      return {
        level: 3,
        levelKey: 'challenging',
        title: '⚡ CHALLENGING: STRICT ATHLETE CUT',
        badge: 'CAN BE DONE',
        emoji: '⚡',
        colorClass: 'text-yellow-400',
        bgClass: 'bg-yellow-500/15',
        borderClass: 'border-yellow-500/40',
        glowClass: 'shadow-yellow-500/25',
        deltaKg,
        direction: 'loss',
        days: safeDays,
        kgPerWeek: roundedKgPerWeek,
        pctBodyWeightPerWeek,
        dailyDeficitSurplusKcal: dailyKcalShift,
        targetDailyCalories,
        safetyScore: 72,
        summary: `Challenging but doable pace (~${dailyKcalShift} kcal deficit/day, ${roundedKgPerWeek} kg/wk). Target budget: ~${targetDailyCalories} kcal/day.`,
        detailedAdvice: `Achievable with structured meal prep and high discipline. At ~${targetDailyCalories} kcal/day, prioritize low-calorie volume foods (leafy greens, cruciferous vegetables, egg whites) to stay full while cutting.`,
        keyPoints: [
          `Feasible for disciplined individuals and fitness enthusiasts`,
          `Comfortably above your minimum floor (${targetDailyCalories} kcal vs ${minSafeCalories} kcal floor)`,
          `Maintain 7.5+ hours of sleep to manage cortisol and hunger hormones`,
        ],
        bmi,
        bmiCategory,
        bmiColor,
        bmr,
        tdee,
        minSafeCalories,
        maxSafeKgPerWeek,
        recommendedKgPerWeek,
        gentleKgPerWeek,
        athleticKgPerWeek,
        projectedDateStr,
      };
    }

    // LEVEL 4: GOOD / OPTIMAL GOLD STANDARD
    // Triggered if:
    // - losing 0.35% - 0.75% of body weight / week
    if (pctBodyWeightPerWeek >= 0.35 || dailyKcalShift >= 350) {
      return {
        level: 4,
        levelKey: 'good',
        title: '🌟 GOOD: GOLD STANDARD FAT LOSS',
        badge: 'OPTIMAL & HEALTHY',
        emoji: '🌟',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/15',
        borderClass: 'border-emerald-500/40',
        glowClass: 'shadow-emerald-500/25',
        deltaKg,
        direction: 'loss',
        days: safeDays,
        kgPerWeek: roundedKgPerWeek,
        pctBodyWeightPerWeek,
        dailyDeficitSurplusKcal: dailyKcalShift,
        targetDailyCalories,
        safetyScore: 96,
        summary: `The scientific sweet spot (~${dailyKcalShift} kcal deficit/day, ${roundedKgPerWeek} kg/wk). Target budget: ${targetDailyCalories} kcal/day.`,
        detailedAdvice: `The most clinically supported rate for fat loss. You maintain muscle strength, keep your metabolic rate resilient, and build permanent dietary habits without chronic hunger.`,
        keyPoints: [
          `Maximizes pure adipose fat loss while sparing 95%+ lean muscle`,
          `Generous daily calorie budget (${targetDailyCalories} kcal/day) ensures steady gym energy`,
          `Zero crash risk, low hunger, highly sustainable lifestyle shift`,
        ],
        bmi,
        bmiCategory,
        bmiColor,
        bmr,
        tdee,
        minSafeCalories,
        maxSafeKgPerWeek,
        recommendedKgPerWeek,
        gentleKgPerWeek,
        athleticKgPerWeek,
        projectedDateStr,
      };
    }

    // LEVEL 5: HIGHLY ACHIEVABLE / GENTLE RECOMP
    return {
      level: 5,
      levelKey: 'achievable',
      title: '🟢 HIGHLY ACHIEVABLE: GENTLE LIFESTYLE SHIFT',
      badge: 'EFFORTLESS & EASY',
      emoji: '🟢',
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-500/15',
      borderClass: 'border-sky-500/40',
      glowClass: 'shadow-sky-500/25',
      deltaKg,
      direction: 'loss',
      days: safeDays,
      kgPerWeek: roundedKgPerWeek,
      pctBodyWeightPerWeek,
      dailyDeficitSurplusKcal: dailyKcalShift,
      targetDailyCalories,
      safetyScore: 99,
      summary: `Very gentle goal (~${dailyKcalShift} kcal deficit/day, ${roundedKgPerWeek} kg/wk). Target budget: ${targetDailyCalories} kcal/day.`,
      detailedAdvice: `Effortless to achieve by making simple swaps (e.g. replacing sugary drinks with water, taking a 25-minute daily walk, or eating 1 less roti). Great for long-term adherence.`,
      keyPoints: [
        'Virtually zero hunger pangs or dietary deprivation',
        'Can be achieved simply through daily steps and portion control',
        'Perfect starting point for sustainable, lifelong fitness habits',
      ],
      bmi,
      bmiCategory,
      bmiColor,
      bmr,
      tdee,
      minSafeCalories,
      maxSafeKgPerWeek,
      recommendedKgPerWeek,
      gentleKgPerWeek,
      athleticKgPerWeek,
      projectedDateStr,
    };
  }

  // 3. Weight Gain / Muscle Hypertrophy Branch
  const targetDailyCalories = tdee + dailyKcalShift;

  if (roundedKgPerWeek > 0.8) {
    return {
      level: 1,
      levelKey: 'danger',
      title: '🚨 DANGER: DIRTY BULK / FAT ACCUMULATION',
      badge: 'EXCESSIVE SURPLUS',
      emoji: '🚨',
      colorClass: 'text-rose-500',
      bgClass: 'bg-rose-500/15',
      borderClass: 'border-rose-500/50',
      glowClass: 'shadow-rose-500/30',
      deltaKg,
      direction: 'gain',
      days: safeDays,
      kgPerWeek: roundedKgPerWeek,
      pctBodyWeightPerWeek,
      dailyDeficitSurplusKcal: dailyKcalShift,
      targetDailyCalories,
      safetyScore: 25,
      summary: `Excessive weight gain rate (${roundedKgPerWeek} kg/wk, +${dailyKcalShift} kcal/day). 80%+ will be stored as body fat.`,
      detailedAdvice: 'Natural muscle synthesis caps out at ~0.25 - 0.5 kg of muscle per month. Gaining faster leads to visceral fat, sluggishness, and insulin resistance.',
      keyPoints: [
        'Excess calories convert almost entirely to adipose fat',
        'High burden on cardiovascular health and blood pressure',
        'Recommendation: Cap weight gain at 0.25 - 0.4 kg/week',
      ],
      bmi,
      bmiCategory,
      bmiColor,
      bmr,
      tdee,
      minSafeCalories,
      maxSafeKgPerWeek,
      recommendedKgPerWeek,
      gentleKgPerWeek,
      athleticKgPerWeek,
      projectedDateStr,
    };
  }

  if (roundedKgPerWeek >= 0.25) {
    return {
      level: 4,
      levelKey: 'good',
      title: '🌟 GOOD: OPTIMAL LEAN BULK',
      badge: 'HYPERTROPHY SWEET SPOT',
      emoji: '🌟',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/40',
      glowClass: 'shadow-emerald-500/25',
      deltaKg,
      direction: 'gain',
      days: safeDays,
      kgPerWeek: roundedKgPerWeek,
      pctBodyWeightPerWeek,
      dailyDeficitSurplusKcal: dailyKcalShift,
      targetDailyCalories,
      safetyScore: 95,
      summary: `Optimal muscle building pace (${roundedKgPerWeek} kg/wk, +${dailyKcalShift} kcal/day). Maximizes hypertrophy while minimizing fat.`,
      detailedAdvice: `Gold standard for natural muscle building. Eat nutritious carbs and 1.8g-2.0g protein/kg, focusing on progressive overload in compound lifts.`,
      keyPoints: [
        'Optimal muscle-to-fat gain ratio',
        'Consistently high training energy and joint recovery',
        'Sustainable for 6-12 months of progressive muscle building',
      ],
      bmi,
      bmiCategory,
      bmiColor,
      bmr,
      tdee,
      minSafeCalories,
      maxSafeKgPerWeek,
      recommendedKgPerWeek,
      gentleKgPerWeek,
      athleticKgPerWeek,
      projectedDateStr,
    };
  }

  return {
    level: 5,
    levelKey: 'achievable',
    title: '🟢 HIGHLY ACHIEVABLE: LEAN RECOMP',
    badge: 'VERY GENTLE GAIN',
    emoji: '🟢',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-500/40',
    glowClass: 'shadow-sky-500/25',
    deltaKg,
    direction: 'gain',
    days: safeDays,
    kgPerWeek: roundedKgPerWeek,
    pctBodyWeightPerWeek,
    dailyDeficitSurplusKcal: dailyKcalShift,
    targetDailyCalories,
    safetyScore: 98,
    summary: `Slow and steady recomp (+${dailyKcalShift} kcal/day). Target budget: ~${targetDailyCalories} kcal/day.`,
    detailedAdvice: 'Great for staying lean year-round while gradually adding dense muscle tissue.',
    keyPoints: ['Virtually zero fat gain', 'Requires patience and tracking weights lifted'],
    bmi,
    bmiCategory,
    bmiColor,
    bmr,
    tdee,
    minSafeCalories,
    maxSafeKgPerWeek,
    recommendedKgPerWeek,
    gentleKgPerWeek,
    athleticKgPerWeek,
    projectedDateStr,
  };
}

/**
 * Backward-compatible wrapper for existing callers
 */
export function calculateWeightFeasibility(
  currentWeightKg: number,
  targetWeightKg: number,
  days: number,
  baselineCalories = 2200
): FeasibilityResult {
  return calculatePersonalizedFeasibility({
    currentWeightKg,
    targetWeightKg,
    days,
  });
}
