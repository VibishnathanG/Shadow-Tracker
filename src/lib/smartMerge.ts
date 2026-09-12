import { Task, Habit, DailyLog, Note, Reminder, Category, Settings } from '@/types';
import { calculateStreaks } from './dateUtils';

export interface FullBackupData {
  tasks: Task[];
  habits: Habit[];
  dailyLogs: DailyLog[];
  notes: Note[];
  categories: Category[];
  reminders?: Reminder[];
  settings?: Settings;
  moneyData?: any;
  healthData?: any;
  rpgQuests?: any[];
  wizardScrolls?: any[];
  unlockedBadges?: string[];
  version?: string;
  exportedAt?: string;
  timestamp?: number;
}

function getItemTimestamp(item: any): number {
  if (!item) return 0;
  const timeStr = item.updatedAt || item.createdAt || item.date || item.exportedAt;
  if (!timeStr) return 0;
  const parsed = new Date(timeStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Deep merge Health & Vitality suite data
 */
function mergeHealthData(local?: any, cloud?: any): any {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  // 1. Daily Logs (date-by-date deep merge)
  const mergedDailyLogs: Record<string, any> = {};
  const localLogs = local.dailyLogs || {};
  const cloudLogs = cloud.dailyLogs || {};
  const allDates = Array.from(new Set([...Object.keys(localLogs), ...Object.keys(cloudLogs)]));

  for (const date of allDates) {
    const lDay = localLogs[date];
    const cDay = cloudLogs[date];
    if (!lDay) {
      mergedDailyLogs[date] = cDay;
    } else if (!cDay) {
      mergedDailyLogs[date] = lDay;
    } else {
      // Merge foods by id or name
      const foodMap = new Map<string, any>();
      (lDay.loggedFoods || []).forEach((f: any) => foodMap.set(f.id || f.name, f));
      (cDay.loggedFoods || []).forEach((f: any) => foodMap.set(f.id || f.name, f));

      // Merge completed exercises by id or name
      const exerciseMap = new Map<string, any>();
      (lDay.completedExercises || []).forEach((e: any) => exerciseMap.set(e.id || e.name, e));
      (cDay.completedExercises || []).forEach((e: any) => exerciseMap.set(e.id || e.name, e));

      mergedDailyLogs[date] = {
        ...cDay,
        ...lDay,
        waterMl: Math.max(lDay.waterMl || 0, cDay.waterMl || 0),
        calorieGoal: cDay.calorieGoal || lDay.calorieGoal || 2000,
        loggedFoods: Array.from(foodMap.values()),
        completedExercises: Array.from(exerciseMap.values()),
        notes: lDay.notes || cDay.notes || '',
      };
    }
  }

  // 2. Custom Workouts (union by id or name)
  const workoutMap = new Map<string, any>();
  (local.customWorkouts || []).forEach((w: any) => workoutMap.set(w.id || w.name, w));
  (cloud.customWorkouts || []).forEach((w: any) => workoutMap.set(w.id || w.name, w));

  // 3. Custom Foods / Meals (union by id or name)
  const customFoodMap = new Map<string, any>();
  (local.customFoods || []).forEach((f: any) => customFoodMap.set(f.id || f.name, f));
  (cloud.customFoods || []).forEach((f: any) => customFoodMap.set(f.id || f.name, f));

  // 4. Custom Diets (union by id or name/title)
  const dietMap = new Map<string, any>();
  (local.customDiets || []).forEach((d: any) => dietMap.set(d.id || d.name || d.title, d));
  (cloud.customDiets || []).forEach((d: any) => dietMap.set(d.id || d.name || d.title, d));

  // 5. Today's Exercises
  const todayExerciseMap = new Map<string, any>();
  (local.todayExercises || []).forEach((e: any) => todayExerciseMap.set(e.id || e.name, e));
  (cloud.todayExercises || []).forEach((e: any) => todayExerciseMap.set(e.id || e.name, e));

  // 6. Quick Suggestions (union strings)
  const mergedSuggestions = Array.from(new Set([
    ...(local.quickSuggestions || []),
    ...(cloud.quickSuggestions || [])
  ]));

  // 7. Biometrics (latest non-null)
  let mergedBiometrics = cloud.biometrics || local.biometrics || null;
  if (local.biometrics && cloud.biometrics) {
    const lTime = getItemTimestamp(local.biometrics);
    const cTime = getItemTimestamp(cloud.biometrics);
    mergedBiometrics = cTime >= lTime ? cloud.biometrics : local.biometrics;
  }

  return {
    dailyLogs: mergedDailyLogs,
    customWorkouts: Array.from(workoutMap.values()),
    todayExercises: Array.from(todayExerciseMap.values()),
    customFoods: Array.from(customFoodMap.values()),
    quickSuggestions: mergedSuggestions,
    biometrics: mergedBiometrics,
    customDiets: Array.from(dietMap.values()),
  };
}

/**
 * Deep merge Money & Financial data
 */
function mergeMoneyData(local?: any, cloud?: any): any {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  // Merge individual expenses by ID
  const expenseMap = new Map<string, any>();
  const allExpenses = [...(local.expenses || []), ...(cloud.expenses || [])];
  for (const exp of allExpenses) {
    if (!exp || !exp.id) continue;
    const existing = expenseMap.get(exp.id);
    if (!existing) {
      expenseMap.set(exp.id, exp);
    } else {
      const expTime = getItemTimestamp(exp);
      const exTime = getItemTimestamp(existing);
      expenseMap.set(exp.id, expTime >= exTime ? exp : existing);
    }
  }

  // Merge monthlyDataMap by month key
  const mergedMonthlyMap: Record<string, any> = {
    ...(cloud.monthlyDataMap || {}),
    ...(local.monthlyDataMap || {}),
  };

  return {
    ...cloud,
    ...local,
    expenses: Array.from(expenseMap.values()),
    monthlyDataMap: mergedMonthlyMap,
  };
}

/**
 * Bi-Directional Smart Merge:
 * Prevents sync conflict ambiguities (e.g. mobile updated at 11PM, desktop updated at 11:30PM).
 * Deeply merges tasks, habits, dailyLogs, notes, health metrics, money, RPG quests, and badges.
 * Excludes ToDo Studio (strictly local-first).
 */
export function smartMergeBackupData(localData: FullBackupData, cloudData: FullBackupData): FullBackupData {
  // 1. Merge Tasks by ID (Last Write Wins per task, preserve completion)
  const taskMap = new Map<string, Task>();
  const allTasks = [...(localData.tasks || []), ...(cloudData.tasks || [])];
  
  for (const t of allTasks) {
    if (!t || !t.id) continue;
    const existing = taskMap.get(t.id);
    if (!existing) {
      taskMap.set(t.id, t);
    } else {
      const existingTime = getItemTimestamp(existing);
      const newTime = getItemTimestamp(t);
      const isCompleted = existing.isCompleted || t.isCompleted;
      const winner = newTime >= existingTime ? { ...t, isCompleted } : { ...existing, isCompleted };
      if (!winner.assignee && (existing.assignee || t.assignee)) {
        winner.assignee = existing.assignee || t.assignee;
      }
      if (!winner.additionalDetails && (existing.additionalDetails || t.additionalDetails)) {
        winner.additionalDetails = existing.additionalDetails || t.additionalDetails;
      }
      taskMap.set(t.id, winner);
    }
  }

  // 2. Merge Habits by ID (Union of completedDates so completions on either device are merged)
  const habitMap = new Map<string, Habit>();
  const allHabits = [...(localData.habits || []), ...(cloudData.habits || [])];

  for (const h of allHabits) {
    if (!h || !h.id) continue;
    const existing = habitMap.get(h.id);
    if (!existing) {
      habitMap.set(h.id, h);
    } else {
      const existingTime = getItemTimestamp(existing);
      const newTime = getItemTimestamp(h);
      const baseWinner = newTime >= existingTime ? h : existing;

      const mergedDates = Array.from(new Set([
        ...(existing.completedDates || []),
        ...(h.completedDates || [])
      ])).sort();

      const streaks = calculateStreaks(mergedDates);

      const mergedHabit: Habit = {
        ...baseWinner,
        completedDates: mergedDates,
        streakCount: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        updatedAt: new Date(Math.max(existingTime, newTime, Date.now())).toISOString(),
      };
      habitMap.set(h.id, mergedHabit);
    }
  }

  // 3. Merge Daily Logs by Date (Highest focusScore and completed counts)
  const logMap = new Map<string, DailyLog>();
  const allLogs = [...(localData.dailyLogs || []), ...(cloudData.dailyLogs || [])];

  for (const l of allLogs) {
    if (!l || !l.date) continue;
    const existing = logMap.get(l.date);
    if (!existing) {
      logMap.set(l.date, l);
    } else {
      const existingTime = getItemTimestamp(existing);
      const newTime = getItemTimestamp(l);
      const baseWinner = newTime >= existingTime ? l : existing;

      const mergedLog: DailyLog = {
        ...baseWinner,
        completedTasksCount: Math.max(existing.completedTasksCount || 0, l.completedTasksCount || 0),
        completedHabitsCount: Math.max(existing.completedHabitsCount || 0, l.completedHabitsCount || 0),
        focusScore: Math.max(existing.focusScore || 0, l.focusScore || 0),
        mood: baseWinner.mood || existing.mood || l.mood,
        updatedAt: new Date(Math.max(existingTime, newTime, Date.now())).toISOString(),
      };
      logMap.set(l.date, mergedLog);
    }
  }

  // 4. Merge Notes / Journal by Date or ID
  const noteMap = new Map<string, Note>();
  const allNotes = [...(localData.notes || []), ...(cloudData.notes || [])];

  for (const n of allNotes) {
    if (!n || !n.id) continue;
    const existing = noteMap.get(n.id);
    if (!existing) {
      noteMap.set(n.id, n);
    } else {
      const existingTime = getItemTimestamp(existing);
      const newTime = getItemTimestamp(n);
      const winner = newTime >= existingTime ? n : existing;
      noteMap.set(n.id, winner);
    }
  }

  // 5. Merge Categories by ID
  const categoryMap = new Map<string, Category>();
  const allCategories = [...(localData.categories || []), ...(cloudData.categories || [])];

  for (const c of allCategories) {
    if (!c || !c.id) continue;
    if (!categoryMap.has(c.id)) {
      categoryMap.set(c.id, c);
    }
  }

  // 6. Merge Reminders by ID
  const reminderMap = new Map<string, Reminder>();
  const allReminders = [...(localData.reminders || []), ...(cloudData.reminders || [])];

  for (const r of allReminders) {
    if (!r || !r.id) continue;
    if (!reminderMap.has(r.id)) {
      reminderMap.set(r.id, r);
    }
  }

  // 7. Merge Unlocked Badges (Union Set)
  const mergedBadges = Array.from(new Set([
    ...(localData.unlockedBadges || []),
    ...(cloudData.unlockedBadges || [])
  ]));

  // 8. Merge Health Data
  const mergedHealth = mergeHealthData(localData.healthData, cloudData.healthData);

  // 9. Merge Money Data
  const mergedMoney = mergeMoneyData(localData.moneyData, cloudData.moneyData);

  // 10. Merge RPG Quests (Union by ID, preserve completed)
  const questMap = new Map<string, any>();
  const allQuests = [...(localData.rpgQuests || []), ...(cloudData.rpgQuests || [])];
  for (const q of allQuests) {
    if (!q || !q.id) continue;
    const existing = questMap.get(q.id);
    if (!existing) {
      questMap.set(q.id, q);
    } else {
      questMap.set(q.id, {
        ...existing,
        ...q,
        isCompleted: existing.isCompleted || q.isCompleted,
      });
    }
  }

  // 11. Merge Wizard Scrolls (Union by ID or text)
  const scrollMap = new Map<string, any>();
  const allScrolls = [...(localData.wizardScrolls || []), ...(cloudData.wizardScrolls || [])];
  for (const s of allScrolls) {
    if (!s) continue;
    const key = s.id || s.text || s.quote;
    if (key && !scrollMap.has(key)) {
      scrollMap.set(key, s);
    }
  }

  return {
    tasks: Array.from(taskMap.values()),
    habits: Array.from(habitMap.values()),
    dailyLogs: Array.from(logMap.values()),
    notes: Array.from(noteMap.values()),
    categories: Array.from(categoryMap.values()),
    reminders: Array.from(reminderMap.values()),
    settings: (localData.settings || cloudData.settings) ? ({
      ...(cloudData.settings || {}),
      ...(localData.settings || {}),
      taskAssignees: Array.from(new Set([
        ...(localData.settings?.taskAssignees || ['Shadow', 'Core Lead', 'Operator']),
        ...(cloudData.settings?.taskAssignees || [])
      ])),
      defaultAssignee: localData.settings?.defaultAssignee || cloudData.settings?.defaultAssignee || 'Shadow',
    } as Settings) : undefined,
    moneyData: mergedMoney,
    rpgQuests: Array.from(questMap.values()),
    wizardScrolls: Array.from(scrollMap.values()),
    unlockedBadges: mergedBadges,
    version: localData.version || cloudData.version || '1.0.0',
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
  };
}
