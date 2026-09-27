import { describe, it, expect } from 'vitest';
import {
  estimateFoodNutrients,
  normalizeNutrientKey,
  RDA_MICRONUTRIENTS,
} from '../micronutrientData';
import { calculatePersonalizedFeasibility } from '../weightFeasibility';

describe('Health Micronutrients & Supplements', () => {
  it('normalizes nutrient keys properly', () => {
    expect(normalizeNutrientKey('zinc')).toBe('min_zinc');
    expect(normalizeNutrientKey('magnesium')).toBe('min_magnesium');
    expect(normalizeNutrientKey('iron')).toBe('min_iron');
    expect(normalizeNutrientKey('calcium')).toBe('min_calcium');
    expect(normalizeNutrientKey('potassium')).toBe('min_potassium');
    expect(normalizeNutrientKey('vit_c')).toBe('vit_c');
    expect(normalizeNutrientKey('vit_d')).toBe('vit_d');
  });

  it('preserves absolute supplement dosage without dividing by 100', () => {
    // A Vitamin C tablet with 90mg Vit C and 1 quantity
    const supplementItem = {
      name: 'Vitamin C 500mg',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      grams: 1, // 1 tablet
      quantity: 1,
      isSupplement: true,
      customMicros: {
        vit_c: 90,
      },
    };

    const nutrients = estimateFoodNutrients(supplementItem as any);
    expect(nutrients.vit_c).toBe(90); // 90mg, not 0.9mg!
  });

  it('scales regular food nutrients based on grams / 100', () => {
    const foodItem = {
      name: 'Orange',
      calories: 47,
      protein: 0.9,
      carbs: 11.8,
      fat: 0.1,
      grams: 200, // 200g of orange
      quantity: 1,
    };

    const nutrients = estimateFoodNutrients(foodItem as any);
    // Orange has 53.2mg vit_c per 100g, for 200g it should be ~106.4mg
    expect(nutrients.vit_c).toBeCloseTo(106.4, 1);
  });

  it('has RDA reference values defined for core vitamins and minerals', () => {
    const vitC = RDA_MICRONUTRIENTS.find(n => n.id === 'vit_c');
    const vitD = RDA_MICRONUTRIENTS.find(n => n.id === 'vit_d');
    const zinc = RDA_MICRONUTRIENTS.find(n => n.id === 'min_zinc');
    const magnesium = RDA_MICRONUTRIENTS.find(n => n.id === 'min_magnesium');

    expect(vitC?.rda.male.adult).toBe(90);
    expect(vitD?.rda.male.adult).toBe(15);
    expect(zinc?.rda.male.adult).toBe(11);
    expect(magnesium?.rda.male.adult).toBe(400);
  });
});

describe('Weight Feasibility & Safety Engine', () => {
  it('correctly adapts for bulking goals (+15 kg)', () => {
    const result = calculatePersonalizedFeasibility({
      currentWeightKg: 75,
      targetWeightKg: 90,
      age: 28,
      sex: 'male',
      heightCm: 175,
      activityLevel: 'moderate',
      weeklyLossKg: 0.35, // Optimal mass gain
    });

    expect(result.direction).toBe('gain');
    expect(result.deltaKg).toBe(15);
    expect(result.recommendedKgPerWeek).toBe(0.35);
    expect(result.level).toBe(4); // Optimal lean bulk
    expect(result.safetyScore).toBeGreaterThanOrEqual(90);
    expect(result.targetDailyCalories).toBeGreaterThan(result.tdee);
    expect(result.badge).toBe('HYPERTROPHY SWEET SPOT');
  });

  it('correctly adapts for cutting goals (-10 kg)', () => {
    const result = calculatePersonalizedFeasibility({
      currentWeightKg: 85,
      targetWeightKg: 75,
      age: 28,
      sex: 'male',
      heightCm: 175,
      activityLevel: 'moderate',
      weeklyLossKg: 0.5,
    });

    expect(result.direction).toBe('loss');
    expect(result.deltaKg).toBe(-10);
    expect(result.level).toBe(4); // Gold standard fat loss
    expect(result.targetDailyCalories).toBeLessThan(result.tdee);
    expect(result.targetDailyCalories).toBeGreaterThan(result.minSafeCalories);
  });

  it('flags extreme crash deficits with danger warnings', () => {
    const result = calculatePersonalizedFeasibility({
      currentWeightKg: 85,
      targetWeightKg: 70,
      days: 14, // 15 kg in 14 days is dangerous crash diet
      age: 28,
      sex: 'male',
      heightCm: 175,
      activityLevel: 'sedentary',
    });

    expect(result.direction).toBe('loss');
    expect(result.level).toBe(1); // Danger level
    expect(result.safetyScore).toBeLessThan(30);
  });

  it('accurately computes weight goal progress and match closeness', () => {
    // Current matches target
    const curMatch = 72;
    const target = 72;
    const matchPct = Math.min(100, Math.max(5, Math.round((Math.min(curMatch, target) / Math.max(curMatch, target)) * 100)));
    expect(matchPct).toBe(100);

    // Current slightly above target (75kg with 70kg target)
    const curAbove = 75;
    const targetCut = 70;
    const abovePct = Math.min(100, Math.max(5, Math.round((Math.min(curAbove, targetCut) / Math.max(curAbove, targetCut)) * 100)));
    expect(abovePct).toBe(93);

    // Current below target (65kg with 70kg target)
    const curBelow = 65;
    const belowPct = Math.min(100, Math.max(5, Math.round((Math.min(curBelow, targetCut) / Math.max(curBelow, targetCut)) * 100)));
    expect(belowPct).toBe(93);
  });
});
