import { DailyHealthData, HydrationLog } from '@/features/health/HealthFeature';
import { LoggedFood, MealType } from '@/features/health/NutritionPlateVisualizer';
import { FoodItem } from '@/features/health/indianFoodDatabase';
import { BackupData } from '@/types';
import { dbService } from '@/lib/storage';
import { useShadowTrackerStore } from '@/store';
import { triggerJsonDownload } from '@/lib/oneDriveSync';
import { isZipBuffer, extractTextFilesFromZip } from './zipExtractor';

export interface GymManeParsedData {
  waterByDate: Record<string, { totalMl: number; sips: HydrationLog[] }>;
  foodsByDate: Record<string, LoggedFood[]>;
  supplementsByDate: Record<string, LoggedFood[]>;
  customFoods: FoodItem[];
  calorieGoal?: number;
  sourceInfo: {
    app: string;
    exportedAt?: string;
  };
}

export interface GymManeMergeSummary {
  datesAffected: number;
  waterSipsAdded: number;
  foodsAdded: number;
  foodsUpdated: number;
  supplementsAdded: number;
  customFoodsAdded: number;
  totalDatesInHealth: number;
  backupData?: BackupData;
}

const STORAGE_KEY_HEALTH = 'shadow_health_data_v2';
const STORAGE_KEY_CUSTOM_FOODS = 'shadow_custom_foods_v1';

/**
 * Converts a minute of the day (0..1439) to 'HH:MM'.
 */
function minuteToTimeStr(minuteOfDay: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(minuteOfDay)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format ISO string or date into 'HH:MM'.
 */
function formatTimeFromIso(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  } catch (_) {
    // fallback
  }
  return '12:00';
}

/**
 * Maps GymMane meal identifier to Shadow Tracker MealType ('breakfast' | 'lunch' | 'dinner' | 'snack').
 */
function mapGymManeMeal(ml: string): MealType {
  const lower = (ml || '').toLowerCase();
  if (lower === 'breakfast') return 'breakfast';
  if (lower === 'lunch') return 'lunch';
  if (lower === 'dinner') return 'dinner';
  return 'snack'; // 'snacks' in GymMane maps to 'snack'
}

/**
 * Extract raw JSON text from a GymMane backup file, buffer, or string.
 * Supports direct .json files and .zip archives (which contain gymmane.json).
 */
export async function extractGymManeBackupJson(input: File | Blob | ArrayBuffer | Uint8Array | string): Promise<string> {
  if (typeof input === 'string') {
    return input;
  }

  let buffer: ArrayBuffer;
  if (input instanceof File || input instanceof Blob) {
    buffer = await input.arrayBuffer();
  } else if (input instanceof Uint8Array) {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  } else {
    buffer = input;
  }

  if (isZipBuffer(buffer)) {
    const files = extractTextFilesFromZip(buffer);
    if (files['gymmane.json']) {
      return files['gymmane.json'];
    }

    const jsonKey = Object.keys(files).find(name => name.toLowerCase().endsWith('.json'));
    if (jsonKey && files[jsonKey]) {
      return files[jsonKey];
    }

    throw new Error('Invalid GymMane backup archive: No gymmane.json file found inside the zip archive.');
  }

  // Not a zip archive; decode as UTF-8 JSON text
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

/**
 * Parses GymMane backup JSON and maps:
 * - Water sips -> Daily hydration logs & water totals
 * - Food logs -> LoggedFood items (with calories, macros, servings, meal slots)
 * - Supplements & Taken records -> Supplement LoggedFood items
 * - Custom food library -> Shadow Tracker FoodItem database
 */
export async function parseGymManeBackup(input: File | Blob | ArrayBuffer | Uint8Array | string): Promise<GymManeParsedData> {
  const jsonText = await extractGymManeBackupJson(input);
  let raw: any;
  try {
    raw = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error(`Failed to parse GymMane backup JSON: ${err.message || 'Malformed JSON'}`);
  }

  // GymMane stores nutrition data either under the 'nutrition' key or at root level
  const nut = raw?.nutrition && typeof raw.nutrition === 'object' ? raw.nutrition : raw;
  if (!nut || typeof nut !== 'object') {
    throw new Error('Invalid GymMane backup format: No nutrition section found.');
  }

  const rawWater: any[] = Array.isArray(nut.water) ? nut.water : [];
  const rawLog: any[] = Array.isArray(nut.log) ? nut.log : [];
  const rawSupps: any[] = Array.isArray(nut.supps) ? nut.supps : [];
  const rawTaken: Record<string, string[]> = nut.taken && typeof nut.taken === 'object' && !Array.isArray(nut.taken) ? nut.taken : {};
  const rawFoods: any[] = Array.isArray(nut.foods) ? nut.foods : [];

  // Calorie goal
  let calorieGoal: number | undefined = undefined;
  if (nut.goals && typeof nut.goals === 'object' && typeof nut.goals.kcal === 'number' && nut.goals.kcal > 0) {
    calorieGoal = nut.goals.kcal;
  }

  // 1. Parse Water Sips
  const waterByDate: Record<string, { totalMl: number; sips: HydrationLog[] }> = {};
  for (const sip of rawWater) {
    const at = String(sip?.at || '');
    const ml = Number(sip?.ml || 0);
    if (!at || ml <= 0) continue;

    const dateStr = at.substring(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    if (!waterByDate[dateStr]) {
      waterByDate[dateStr] = { totalMl: 0, sips: [] };
    }

    const time = formatTimeFromIso(at);
    waterByDate[dateStr].totalMl += ml;
    waterByDate[dateStr].sips.push({
      id: `gymmane_water_${at}_${ml}_${Math.random().toString(36).substring(2, 6)}`,
      amount: ml,
      time,
    });
  }

  // 2. Parse Custom Food Database Definitions
  const customFoods: FoodItem[] = [];
  const foodDefMap = new Map<string, any>();
  for (const f of rawFoods) {
    if (!f || !f.id) continue;
    foodDefMap.set(f.id, f);

    const macros = f.m || {};
    const grams = Number(f.g || 100);
    const item: FoodItem = {
      id: `gymmane_food_${f.id}`,
      name: String(f.n || 'GymMane Food').trim(),
      category: 'main',
      serving: String(f.s || `${grams}g`),
      standardGrams: grams,
      calories: Math.round(Number(macros.k || 0)),
      protein: Math.round(Number(macros.p || 0) * 10) / 10,
      carbs: Math.round(Number(macros.c || 0) * 10) / 10,
      fats: Math.round(Number(macros.f || 0) * 10) / 10,
      icon: '🥗',
      isCustom: true,
    };
    customFoods.push(item);
  }

  // 3. Parse Daily Food Log Entries
  const foodsByDate: Record<string, LoggedFood[]> = {};
  for (const entry of rawLog) {
    const at = String(entry?.at || '');
    if (!at) continue;

    const dateStr = at.substring(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    if (!foodsByDate[dateStr]) {
      foodsByDate[dateStr] = [];
    }

    const name = String(entry.n || 'Food Item').trim();
    const servings = Math.max(0.1, Number(entry.x || 1));
    const grams = Number(entry.g || 0);
    const macros = entry.m || {};
    const time = formatTimeFromIso(at);
    const meal = mapGymManeMeal(entry.ml);

    const logged: LoggedFood = {
      id: `gymmane_log_${entry.id || Math.random().toString(36).substring(2, 9)}`,
      foodId: entry.fd || entry.id || `food_${Date.now()}`,
      name,
      serving: grams > 0 ? `${Math.round(grams * servings)}g` : `${servings} serving`,
      standardGrams: grams > 0 ? grams : 100,
      grams: grams > 0 ? Math.round(grams * servings) : undefined,
      calories: Math.round(Number(macros.k || 0) * servings),
      protein: Math.round(Number(macros.p || 0) * servings * 10) / 10,
      carbs: Math.round(Number(macros.c || 0) * servings * 10) / 10,
      fats: Math.round(Number(macros.f || 0) * servings * 10) / 10,
      icon: '🥗',
      meal,
      quantity: servings,
      time,
    };

    foodsByDate[dateStr].push(logged);
  }

  // 4. Parse Supplements and Taken History
  const suppDefMap = new Map<string, any>();
  for (const s of rawSupps) {
    if (s && s.id) {
      suppDefMap.set(s.id, s);
    }
  }

  const supplementsByDate: Record<string, LoggedFood[]> = {};
  for (const [dateStr, takenIds] of Object.entries(rawTaken)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !Array.isArray(takenIds)) continue;

    if (!supplementsByDate[dateStr]) {
      supplementsByDate[dateStr] = [];
    }

    for (const suppId of takenIds) {
      const def = suppDefMap.get(suppId);
      const name = def?.n ? String(def.n).trim() : String(suppId);
      const dose = def?.d ? String(def.d).trim() : '1 serving';
      const time = def?.at != null ? minuteToTimeStr(def.at) : '09:00';

      const suppItem: LoggedFood = {
        id: `gymmane_supp_${dateStr}_${suppId}_${Math.random().toString(36).substring(2, 6)}`,
        foodId: `supp_${suppId}`,
        name,
        serving: dose,
        standardGrams: 100,
        grams: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        icon: '💊',
        meal: 'snack',
        quantity: 1,
        time,
      };

      supplementsByDate[dateStr].push(suppItem);
    }
  }

  return {
    waterByDate,
    foodsByDate,
    supplementsByDate,
    customFoods,
    calorieGoal,
    sourceInfo: {
      app: 'gymmane',
      exportedAt: raw.exportedAt || new Date().toISOString(),
    },
  };
}

/**
 * Safely merges GymMane water, foods, supplements, and custom foods into Shadow Tracker:
 * - Updates localStorage['shadow_health_data_v2'] for every date without overwriting existing entries
 * - Safely appends hydrationLogs and updates water totals
 * - Safely appends logged foods and supplements (avoiding duplicate entries)
 * - Updates custom foods in localStorage['shadow_custom_foods_v1']
 * - Dispatches 'shadow_health_updated' and 'storage' events for immediate live UI refresh
 * - Exports updated master backup JSON and triggers automatic download
 */
export async function mergeGymManeDataIntoApp(
  data: GymManeParsedData,
  options?: { silent?: boolean; autoDownload?: boolean }
): Promise<GymManeMergeSummary> {
  const store = useShadowTrackerStore.getState();

  // 1. Read existing health data map
  let existingHealthMap: Record<string, DailyHealthData> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HEALTH) || localStorage.getItem('shadow_health_data_v1');
      if (raw) {
        existingHealthMap = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[GymManeImporter] Failed to read existing health data:', e);
    }
  }

  const allDates = new Set([
    ...Object.keys(data.waterByDate),
    ...Object.keys(data.foodsByDate),
    ...Object.keys(data.supplementsByDate),
  ]);

  let waterSipsAdded = 0;
  let foodsAdded = 0;
  let foodsUpdated = 0;
  let supplementsAdded = 0;

  for (const date of allDates) {
    const existing: DailyHealthData = existingHealthMap[date] || {
      date,
      waterIntakeMl: 0,
      waterGoalMl: 2500,
      hydrationLogs: [],
      calorieGoal: data.calorieGoal || 2000,
      loggedFoods: [],
      bedtime: '23:00',
      wakeTime: '07:00',
      sleepHours: 8,
      sleepGoalHours: 8,
      sleepQuality: 'normal',
      sleepNotes: '',
      weightUnit: 'kg',
      workouts: [],
      workoutGoalMinutes: 45,
      energyLevel: 3,
    };

    // A. Merge Water Sips
    const waterEntry = data.waterByDate[date];
    if (waterEntry && waterEntry.sips.length > 0) {
      const existingSipKeys = new Set(existing.hydrationLogs.map(s => `${s.amount}_${s.time}`));
      const newSips: HydrationLog[] = [];

      for (const sip of waterEntry.sips) {
        const key = `${sip.amount}_${sip.time}`;
        if (!existingSipKeys.has(key)) {
          newSips.push(sip);
          existingSipKeys.add(key);
          waterSipsAdded++;
        }
      }

      existing.hydrationLogs = [...existing.hydrationLogs, ...newSips];
      existing.waterIntakeMl = existing.hydrationLogs.reduce((acc, s) => acc + s.amount, 0);
    }

    // B. Merge Food Logs (Gracefully update existing same-slot foods, append new)
    const incomingFoods = data.foodsByDate[date] || [];
    if (incomingFoods.length > 0) {
      const existingFoodMap = new Map<string, number>();
      existing.loggedFoods.forEach((f, idx) => {
        existingFoodMap.set(`${f.name.toLowerCase().trim()}_${f.meal}_${f.time}`, idx);
      });

      const updatedLoggedFoods = [...existing.loggedFoods];

      for (const food of incomingFoods) {
        const key = `${food.name.toLowerCase().trim()}_${food.meal}_${food.time}`;
        const existingIdx = existingFoodMap.get(key);
        if (existingIdx !== undefined) {
          // Gracefully update existing food item with latest incoming nutrients
          updatedLoggedFoods[existingIdx] = {
            ...updatedLoggedFoods[existingIdx],
            ...food,
            id: updatedLoggedFoods[existingIdx].id || food.id,
          };
          foodsUpdated++;
        } else {
          updatedLoggedFoods.push(food);
          existingFoodMap.set(key, updatedLoggedFoods.length - 1);
          foodsAdded++;
        }
      }

      existing.loggedFoods = updatedLoggedFoods;
    }

    // C. Merge Supplements
    const incomingSupps = data.supplementsByDate[date] || [];
    if (incomingSupps.length > 0) {
      const existingSuppKeys = new Set(existing.loggedFoods.map(f => `${f.name.toLowerCase()}_${f.time}`));
      const newSupps: LoggedFood[] = [];

      for (const supp of incomingSupps) {
        const key = `${supp.name.toLowerCase()}_${supp.time}`;
        if (!existingSuppKeys.has(key)) {
          newSupps.push(supp);
          existingSuppKeys.add(key);
          supplementsAdded++;
        }
      }

      existing.loggedFoods = [...existing.loggedFoods, ...newSupps];
    }

    if (data.calorieGoal && (!existing.calorieGoal || existing.calorieGoal === 2000)) {
      existing.calorieGoal = data.calorieGoal;
    }

    existingHealthMap[date] = existing;
  }

  // 2. Persist health map to LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_HEALTH, JSON.stringify(existingHealthMap));
    } catch (e) {
      console.error('[GymManeImporter] Failed to save health data:', e);
    }
  }

  // 3. Merge Custom Food Definitions into shadow_custom_foods_v1
  let customFoodsAdded = 0;
  if (data.customFoods.length > 0 && typeof window !== 'undefined') {
    try {
      const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_FOODS);
      const existingCustomFoods: FoodItem[] = savedCustom ? JSON.parse(savedCustom) : [];
      const existingCustomNames = new Set(existingCustomFoods.map(f => f.name.toLowerCase().trim()));

      const toAdd: FoodItem[] = [];
      for (const food of data.customFoods) {
        if (!existingCustomNames.has(food.name.toLowerCase().trim())) {
          toAdd.push(food);
          existingCustomNames.add(food.name.toLowerCase().trim());
          customFoodsAdded++;
        }
      }

      if (toAdd.length > 0) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_FOODS, JSON.stringify([...existingCustomFoods, ...toAdd]));
      }
    } catch (e) {
      console.warn('[GymManeImporter] Failed to merge custom foods:', e);
    }
  }

  // 4. Dispatch live update events so HealthFeature reloads immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shadow_health_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  // 5. Update master backup only if explicitly requested (NO auto-download popup!)
  let updatedBackup: BackupData | undefined;
  if (options?.autoDownload) {
    updatedBackup = await dbService.exportAllData(store.settings);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `shadow_tracker_backup_merged_gymmane_${stamp}.json`;
    triggerJsonDownload(backupFileName, updatedBackup);
  }

  return {
    datesAffected: allDates.size,
    waterSipsAdded,
    foodsAdded,
    foodsUpdated,
    supplementsAdded,
    customFoodsAdded,
    totalDatesInHealth: Object.keys(existingHealthMap).length,
    backupData: updatedBackup,
  };
}
