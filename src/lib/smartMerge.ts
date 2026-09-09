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
 * Bi-Directional Smart Merge:
 * Prevents sync conflict ambiguities (e.g. mobile updated at 11PM, desktop updated at 11:30PM).
 * Merges tasks, habit completions, logs, notes, badges, and financial data by timestamp & union set.
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

  // 8. Merge Money Data if present
  let mergedMoney = localData.moneyData || cloudData.moneyData || null;
  if (localData.moneyData && cloudData.moneyData) {
    try {
      mergedMoney = {
        ...cloudData.moneyData,
        ...localData.moneyData,
      };
    } catch {}
  }

  return {
    tasks: Array.from(taskMap.values()),
    habits: Array.from(habitMap.values()),
    dailyLogs: Array.from(logMap.values()),
    notes: Array.from(noteMap.values()),
    categories: Array.from(categoryMap.values()),
    reminders: Array.from(reminderMap.values()),
    settings: localData.settings || cloudData.settings,
    moneyData: mergedMoney,
    unlockedBadges: mergedBadges,
    version: localData.version || cloudData.version || '1.0.0',
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
  };
}
