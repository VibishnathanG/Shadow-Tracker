import { useShadowTrackerStore } from '@/store';
import { ContextWindow, CONTEXT_WINDOW_OPTIONS } from './aiTypes';
import { getTodayDateString } from '@/lib/dateUtils';
import { StandaloneTodo } from '@/features/todo/todoTypes';

export interface CompiledAiContext {
  window: ContextWindow;
  days: number;
  startDate: string;
  endDate: string;
  tokenEstimate: number;
  payload: Record<string, unknown>;
  jsonString: string;
}

export function compileAiContext(windowId: ContextWindow): CompiledAiContext {
  const windowOption = CONTEXT_WINDOW_OPTIONS.find(o => o.id === windowId) || CONTEXT_WINDOW_OPTIONS[0];
  const days = windowOption.days;

  const today = new Date();
  const endDate = getTodayDateString();
  const startDateTime = new Date(today);
  startDateTime.setDate(startDateTime.getDate() - days);
  const startDate = startDateTime.toISOString().split('T')[0];

  const state = useShadowTrackerStore.getState();

  // 1. User Profile
  const userProfile = {
    alias: state.settings.alias || 'Shadow Voyager',
    level: state.level,
    xp: state.xp,
    theme: state.settings.theme,
    currentDate: endDate,
  };

  // 2. Tasks
  const tasksFiltered = state.tasks
    .filter(t => !t.isSoftDeleted)
    .filter(t => {
      if (!t.isCompleted) return true; // keep all active
      if (t.updatedAt && t.updatedAt >= startDate) return true;
      return false;
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      isCompleted: t.isCompleted,
      dueDate: t.dueDate,
      estimatedMinutes: t.estimatedMinutes,
    }));

  // 3. Standalone ToDos
  let standaloneTodos: Partial<StandaloneTodo>[] = [];
  try {
    const rawTodos = localStorage.getItem('shadow_standalone_todos_v1');
    if (rawTodos) {
      const parsed: StandaloneTodo[] = JSON.parse(rawTodos);
      standaloneTodos = parsed
        .filter(t => !t.isCompleted || (t.createdAt && t.createdAt >= startDate))
        .map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          isCompleted: t.isCompleted,
          dueDate: t.dueDate,
          notes: t.description,
        }));
    }
  } catch {
    // fallback empty
  }

  // 4. Habits & Routines
  const habitsFiltered = state.habits
    .filter(h => !h.isSoftDeleted)
    .map(h => ({
      id: h.id,
      name: h.name,
      streakCount: h.streakCount,
      longestStreak: h.longestStreak,
      frequency: h.frequency,
      completionsInWindow: (h.completedDates || []).filter(d => d >= startDate && d <= endDate).length,
    }));

  // 5. Daily Logs (Focus & Moods)
  const logsFiltered = state.dailyLogs
    .filter(l => l.date >= startDate && l.date <= endDate)
    .map(l => ({
      date: l.date,
      focusScore: l.focusScore,
      mood: l.mood,
      habitsCompleted: l.completedHabitsCount || 0,
      tasksCompleted: l.completedTasksCount || 0,
    }));

  // 6. Health & Hydration
  let healthSummary: Record<string, unknown> = {};
  try {
    const rawHealth = localStorage.getItem('shadow_health_data_v2') || localStorage.getItem('shadow_health_data_v1');
    if (rawHealth) {
      const healthMap = JSON.parse(rawHealth);
      const recentHealthDates = Object.keys(healthMap).filter(d => d >= startDate && d <= endDate);
      let totalWaterMl = 0;
      let totalSleep = 0;
      let count = 0;
      recentHealthDates.forEach(d => {
        const item = healthMap[d];
        if (item) {
          totalWaterMl += item.waterIntakeMl || 0;
          totalSleep += item.sleepHours || 0;
          count++;
        }
      });
      healthSummary = {
        daysLogged: recentHealthDates.length,
        averageDailyWaterMl: count > 0 ? Math.round(totalWaterMl / count) : 0,
        averageSleepHours: count > 0 ? Math.round((totalSleep / count) * 10) / 10 : 0,
        recentDays: recentHealthDates.slice(-7).map(d => ({
          date: d,
          waterMl: healthMap[d]?.waterIntakeMl,
          sleepHours: healthMap[d]?.sleepHours,
        })),
      };
    }
  } catch {
    // fallback
  }

  // 7. Wealth & Expense Snapshot
  let wealthSummary: Record<string, unknown> = {};
  try {
    const rawExpenses = localStorage.getItem('shadow_money_expenses_v4');
    if (rawExpenses) {
      const expenses = JSON.parse(rawExpenses);
      const recentExpenses = (expenses as { date: string; amount: number; category: string; note: string }[])
        .filter(e => e.date >= startDate && e.date <= endDate);
      const totalSpent = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      wealthSummary = {
        totalSpentInWindow: totalSpent,
        transactionCount: recentExpenses.length,
        recentExpenses: recentExpenses.slice(-10),
      };
    }
  } catch {
    // fallback
  }

  // 8. Notes & Reflections
  const notesFiltered = state.notes
    .filter(n => (n.date && n.date >= startDate && n.date <= endDate) || (n.updatedAt && n.updatedAt >= startDate))
    .slice(-10)
    .map(n => ({
      date: n.date,
      title: n.title,
      contentExcerpt: n.content ? n.content.substring(0, 160) + (n.content.length > 160 ? '...' : '') : '',
    }));

  const payload = {
    profile: userProfile,
    windowRange: { startDate, endDate, days },
    tasks: tasksFiltered,
    standaloneTodos,
    habits: habitsFiltered,
    dailyLogs: logsFiltered,
    health: healthSummary,
    wealth: wealthSummary,
    recentNotes: notesFiltered,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  // Rough token estimation: ~4 chars per token in English JSON
  const tokenEstimate = Math.max(1, Math.ceil(jsonString.length / 4));

  return {
    window: windowId,
    days,
    startDate,
    endDate,
    tokenEstimate,
    payload,
    jsonString,
  };
}
