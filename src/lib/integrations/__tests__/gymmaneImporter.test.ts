import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { parseGymManeBackup, mergeGymManeDataIntoApp } from '../gymmaneImporter';
import { dbService } from '@/lib/storage';

vi.mock('@/lib/oneDriveSync', () => ({
  triggerJsonDownload: vi.fn(),
}));

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => store[k] || null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = mockLocalStorage;
}
if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}
if (typeof (global as any).CustomEvent === 'undefined') {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params: any = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  };
}
if (typeof (global as any).Event === 'undefined') {
  (global as any).Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}

describe('gymmaneImporter', () => {
  const sampleGymManeJson = {
    units: 'metric',
    nutrition: {
      goals: {
        kcal: 2350,
        protein: 150,
        carbs: 260,
        fat: 75,
      },
      water: [
        { at: '2026-03-01T08:30:00.000Z', ml: 250 },
        { at: '2026-03-01T12:15:00.000Z', ml: 500 },
        { at: '2026-03-02T09:00:00.000Z', ml: 350 },
      ],
      foods: [
        {
          id: 'custom_curd',
          n: 'Greek Yogurt Bowl',
          s: '1 cup',
          g: 200,
          m: { k: 180, p: 20, c: 8, f: 5 },
        }
      ],
      log: [
        {
          id: 'log_entry_1',
          at: '2026-03-01T13:00:00.000Z',
          ml: 'lunch',
          n: 'Grilled Chicken & Rice',
          fd: 'food_chicken',
          x: 1.5, // 1.5 servings
          g: 250,
          m: { k: 300, p: 28, c: 35, f: 6 },
        },
        {
          id: 'log_entry_2',
          at: '2026-03-01T19:30:00.000Z',
          ml: 'dinner',
          n: 'Paneer Bhurji',
          fd: 'food_paneer',
          x: 1,
          g: 150,
          m: { k: 260, p: 18, c: 5, f: 18 },
        }
      ],
      supps: [
        {
          id: 'supp_creatine',
          n: 'Creatine Monohydrate',
          d: '5g scoop',
          at: 480, // 08:00
        },
        {
          id: 'supp_omega3',
          n: 'Omega-3 Fish Oil',
          d: '2 capsules',
          at: 720, // 12:00
        }
      ],
      taken: {
        '2026-03-01': ['supp_creatine', 'supp_omega3'],
        '2026-03-02': ['supp_creatine']
      }
    }
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('parses GymMane JSON correctly with water, foods, supplements, and goals', async () => {
    const parsed = await parseGymManeBackup(JSON.stringify(sampleGymManeJson));

    expect(parsed.calorieGoal).toBe(2350);

    // Verify water sips
    expect(parsed.waterByDate['2026-03-01']).toBeDefined();
    expect(parsed.waterByDate['2026-03-01'].totalMl).toBe(750);
    expect(parsed.waterByDate['2026-03-01'].sips).toHaveLength(2);

    expect(parsed.waterByDate['2026-03-02'].totalMl).toBe(350);

    // Verify logged foods
    expect(parsed.foodsByDate['2026-03-01']).toHaveLength(2);
    const f1 = parsed.foodsByDate['2026-03-01'][0];
    expect(f1.name).toBe('Grilled Chicken & Rice');
    expect(f1.meal).toBe('lunch');
    expect(f1.calories).toBe(450); // 300 * 1.5
    expect(f1.protein).toBe(42); // 28 * 1.5

    // Verify supplements
    expect(parsed.supplementsByDate['2026-03-01']).toHaveLength(2);
    expect(parsed.supplementsByDate['2026-03-01'][0].name).toBe('Creatine Monohydrate');
    expect(parsed.supplementsByDate['2026-03-01'][0].icon).toBe('💊');
    expect(parsed.supplementsByDate['2026-03-01'][0].meal).toBe('snack');
    expect(parsed.supplementsByDate['2026-03-01'][0].time).toBe('08:00');

    // Verify custom foods
    expect(parsed.customFoods).toHaveLength(1);
    expect(parsed.customFoods[0].name).toBe('Greek Yogurt Bowl');
    expect(parsed.customFoods[0].isCustom).toBe(true);
  });

  it('parses GymMane .zip backup archive containing gymmane.json', async () => {
    const zip = new JSZip();
    zip.file('gymmane.json', JSON.stringify(sampleGymManeJson));
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    const parsed = await parseGymManeBackup(zipBuffer);
    expect(parsed.waterByDate['2026-03-01'].totalMl).toBe(750);
    expect(parsed.foodsByDate['2026-03-01']).toHaveLength(2);
  });

  it('safely merges gymmane data non-destructively into localStorage health data', async () => {
    const exportSpy = vi.spyOn(dbService, 'exportAllData').mockResolvedValue({
      version: '17.0.0',
      tasks: [],
      habits: [],
      dailyLogs: [],
      notes: [],
      reminders: [],
      categories: [],
      settings: {} as any,
      exportedAt: new Date().toISOString(),
    });

    // Mock initial health data in localStorage
    const initialHealth = {
      '2026-03-01': {
        date: '2026-03-01',
        waterIntakeMl: 500,
        waterGoalMl: 2500,
        hydrationLogs: [
          { id: 'existing_sip_1', amount: 500, time: '07:00' }
        ],
        calorieGoal: 2000,
        loggedFoods: [
          {
            id: 'existing_breakfast',
            foodId: 'oats',
            name: 'Oatmeal',
            serving: '1 bowl',
            calories: 250,
            protein: 10,
            carbs: 45,
            fats: 4,
            icon: '🥣',
            meal: 'breakfast',
            quantity: 1,
            time: '07:30',
          }
        ],
        sleepHours: 8,
        sleepGoalHours: 8,
        weightUnit: 'kg',
        workouts: [],
        workoutGoalMinutes: 45,
      }
    };
    localStorage.setItem('shadow_health_data_v2', JSON.stringify(initialHealth));

    const parsed = await parseGymManeBackup(JSON.stringify(sampleGymManeJson));
    const summary = await mergeGymManeDataIntoApp(parsed);

    expect(summary.datesAffected).toBe(2);
    expect(summary.waterSipsAdded).toBe(3);
    expect(summary.foodsAdded).toBe(2);
    expect(summary.supplementsAdded).toBe(3);

    // Verify localStorage content after merge
    const updatedHealth = JSON.parse(localStorage.getItem('shadow_health_data_v2') || '{}');
    const day1 = updatedHealth['2026-03-01'];
    expect(day1).toBeDefined();

    // Hydration should now have original 500ml + imported 750ml = 1250ml
    expect(day1.hydrationLogs).toHaveLength(3); // 1 original + 2 imported
    expect(day1.waterIntakeMl).toBe(1250);

    // Food logs should have original breakfast + 2 imported foods + 2 supplements = 5 items
    expect(day1.loggedFoods).toHaveLength(5);
    expect(day1.loggedFoods.some((f: any) => f.name === 'Oatmeal')).toBe(true);
    expect(day1.loggedFoods.some((f: any) => f.name === 'Grilled Chicken & Rice')).toBe(true);
    expect(day1.loggedFoods.some((f: any) => f.name === 'Creatine Monohydrate')).toBe(true);

    // Verify custom foods merged into shadow_custom_foods_v1
    const customFoods = JSON.parse(localStorage.getItem('shadow_custom_foods_v1') || '[]');
    expect(customFoods).toHaveLength(1);
    expect(customFoods[0].name).toBe('Greek Yogurt Bowl');

    exportSpy.mockRestore();
  });
});
