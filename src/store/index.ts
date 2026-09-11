import { create } from 'zustand';
import { generate60DaysSeedData } from './generate60Days';
import { Task, Habit, DailyLog, Note, Reminder, Category, Settings, BackupData } from '@/types';
import { dbService, STORES, settingsStorage, isMobileDevice } from '@/lib/storage';
import { parseISO, format } from 'date-fns';
import { calculateStreaks, calculateNextRecurrence, getTodayDateString, formatDateString, parseDateString, getHabitDateStatus, upsertHabitMissedNoteSection } from '@/lib/dateUtils';
import { getXpForLevel } from '@/features/rpg/rpgLevels';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (e) {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ShadowTrackerStore {
  tasks: Task[];
  habits: Habit[];
  dailyLogs: DailyLog[];
  notes: Note[];
  reminders: Reminder[];
  categories: Category[];
  settings: Settings;
  isLoading: boolean;

  // Lifecycle
  init: () => Promise<void>;
  resetAllData: () => Promise<void>;
  importBackup: (data: BackupData) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSoftDeleted' | 'isCompleted'> & { isCompleted?: boolean }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'isSoftDeleted' | 'completedDates' | 'streakCount' | 'longestStreak'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
  markHabitUncompleted: (id: string, date: string, reason?: string) => Promise<void>;
  clearHabitUncompleted: (id: string, date: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Daily Logs
  getOrCreateDailyLog: (date: string) => Promise<DailyLog>;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => Promise<void>;
  recalculateDailyLogStats: (date: string) => Promise<void>;

  // Notes
  saveNote: (date: string, content: string, title?: string) => Promise<void>;
  deleteNote: (date: string) => Promise<void>;

  // Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Categories
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<Settings>) => void;

  // Gamification
  xp: number;
  level: number;
  unlockedBadges: string[];
  addXp: (amount: number) => Promise<void>;
  checkAndUnlockBadges: () => Promise<void>;
  resetBadges: () => void;
  restoreBadges: () => Promise<void>;
  resetLifeRpg: () => Promise<void>;
  recalibrateFromCurrentData: () => Promise<{
    level: number;
    xp: number;
    title: string;
    totalTasksCompleted: number;
    totalHabitCheckoffs: number;
    totalNotes: number;
    badgesUnlockedCount: number;
    unlockedBadges: string[];
  }>;
}

const DEFAULT_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  { id: 'cat-work', name: 'Work & Projects', color: '#3b82f6', icon: 'Briefcase' },
  { id: 'cat-personal', name: 'Personal & Life', color: '#a855f7', icon: 'User' },
  { id: 'cat-health', name: 'Health & Fitness', color: '#22c55e', icon: 'Dumbbell' },
  { id: 'cat-study', name: 'Study & Learning', color: '#eab308', icon: 'BookOpen' },
  { id: 'cat-finance', name: 'Finance & Wealth', color: '#10b981', icon: 'DollarSign' },
  { id: 'cat-habits', name: 'Routine & Habits', color: '#f97316', icon: 'CheckCircle' },
];

export const useShadowTrackerStore = create<ShadowTrackerStore>((set, get) => ({
  tasks: [],
  habits: [],
  dailyLogs: [],
  notes: [],
  reminders: [],
  categories: [],
  settings: settingsStorage.get(),
  isLoading: true,
  xp: 0,
  level: 1,
  unlockedBadges: [],

  init: async () => {
    try {
      set({ isLoading: true });

      // Load settings
      const settings = settingsStorage.get();

      // Load data from DB
      let categories = await dbService.getAll<Category>(STORES.CATEGORIES);
      let tasks = await dbService.getAll<Task>(STORES.TASKS);
      let habits = await dbService.getAll<Habit>(STORES.HABITS);
      let dailyLogs = await dbService.getAll<DailyLog>(STORES.DAILY_LOGS);
      let notes = await dbService.getAll<Note>(STORES.NOTES);
      let reminders = await dbService.getAll<Reminder>(STORES.REMINDERS);

      // Seed default categories if empty
      if (categories.length === 0) {
        const nowStr = new Date().toISOString();
        const seededCategories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          createdAt: nowStr,
          updatedAt: nowStr
        }));
        for (const cat of seededCategories) {
          await dbService.put(STORES.CATEGORIES, cat);
        }
        categories = seededCategories;
      }

      // Initialize clean workspace state without preloaded dummy data
      if (categories.length === 0) {
        categories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      // Deduplicate notes by date strictly
      const uniqueNotesMap = new Map<string, Note>();
      (notes || []).forEach(n => {
        const key = n.date || n.id;
        if (!uniqueNotesMap.has(key) || (n.updatedAt && uniqueNotesMap.get(key)!.updatedAt < n.updatedAt)) {
          uniqueNotesMap.set(key, { ...n, id: key, date: key });
        }
      });
      const cleanNotes = Array.from(uniqueNotesMap.values());

      set({
        categories,
        tasks: tasks.filter(t => !t.isSoftDeleted),
        habits: habits.filter(h => !h.isSoftDeleted),
        dailyLogs,
        notes: cleanNotes,
        reminders,
        settings,
        xp: settings.xp || 0,
        level: settings.level || 1,
        unlockedBadges: settings.unlockedBadges || [],
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to initialize Shadow-Tracker database:', error);
      set({ isLoading: false });
    }
  },

  resetAllData: async () => {
    try {
      set({ isLoading: true });
      await dbService.clear(STORES.TASKS);
      await dbService.clear(STORES.HABITS);
      await dbService.clear(STORES.DAILY_LOGS);
      await dbService.clear(STORES.NOTES);
      await dbService.clear(STORES.REMINDERS);
      await dbService.clear(STORES.CATEGORIES);

      const nowStr = new Date().toISOString();
      const seededCategories = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        createdAt: nowStr,
        updatedAt: nowStr
      }));
      for (const cat of seededCategories) {
        await dbService.put(STORES.CATEGORIES, cat);
      }

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      const defaultSettings: Settings = {
        theme: 'onedark',
        backupReminderDays: 7,
        soundEnabled: true,
        showCompletedTasks: true,
        isCompletedOnboarding: true,
        xp: 0,
        level: 1,
        unlockedBadges: [],
        alias: '',
        savingsTarget: 0,
        investmentsTarget: 0,
        badgesResetTimestamp: new Date().toISOString(),
        ecoMode: isMobileDevice(),
        lowGpuMode: isMobileDevice(),
        minimizeToTray: true,
        habitGracePeriodDays: 3,
      };
      settingsStorage.set(defaultSettings);

      set({
        tasks: [],
        habits: [],
        dailyLogs: [],
        notes: [],
        reminders: [],
        categories: seededCategories,
        settings: defaultSettings,
        xp: 0,
        level: 1,
        unlockedBadges: [],
        isLoading: false,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadowResetAllData'));
      }
    } catch (error) {
      console.error('Failed to reset database:', error);
      set({ isLoading: false });
    }
  },

  importBackup: async (data: BackupData) => {
    try {
      set({ isLoading: true });
      await dbService.importAllData(data);
      if (data.settings) {
        settingsStorage.set(data.settings);
      }
      
      const { STORES } = await import('@/lib/storage');
      const tasks = await dbService.getAll<Task>(STORES.TASKS);
      const habits = await dbService.getAll<Habit>(STORES.HABITS);
      const dailyLogs = await dbService.getAll<DailyLog>(STORES.DAILY_LOGS);
      const notes = await dbService.getAll<Note>(STORES.NOTES);
      const reminders = await dbService.getAll<Reminder>(STORES.REMINDERS);
      const categories = await dbService.getAll<Category>(STORES.CATEGORIES);

      set({
        tasks: tasks.filter(t => !t.isSoftDeleted),
        habits: habits.filter(h => !h.isSoftDeleted),
        dailyLogs: dailyLogs || [],
        notes: notes || [],
        reminders: reminders || [],
        categories: categories || [],
        settings: data.settings || settingsStorage.get(),
        isLoading: false,
      });

      if (typeof window !== 'undefined') {
        if (data.moneyData) {
          if (data.moneyData.expenses) {
            localStorage.setItem('shadow_money_expenses_v4', JSON.stringify(data.moneyData.expenses));
          }
          if (data.moneyData.monthlyDataMap) {
            localStorage.setItem('shadow_money_months_v4', JSON.stringify(data.moneyData.monthlyDataMap));
          }
        }
        window.dispatchEvent(new CustomEvent('shadow_data_imported'));
        window.dispatchEvent(new CustomEvent('shadow_money_updated'));
        window.dispatchEvent(new CustomEvent('shadow_health_updated'));
        window.dispatchEvent(new CustomEvent('shadow_todos_updated'));
      }
    } catch (error) {
      console.error('Failed to import backup:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Tasks
  addTask: async (taskData) => {
    const nowStr = new Date().toISOString();
    const isCompleted = taskData.isCompleted ?? (taskData.status === 'done');
    const newTask: Task = {
      ...taskData,
      id: `task-${generateUUID()}`,
      isCompleted,
      status: taskData.status || (isCompleted ? 'done' : 'todo'),
      matrixQuadrant: taskData.matrixQuadrant || (taskData.priority === 'high' ? 'urgent_important' : taskData.priority === 'medium' ? 'not_urgent_important' : 'urgent_not_important'),
      createdAt: nowStr,
      updatedAt: nowStr,
      isSoftDeleted: false,
    };

    await dbService.put(STORES.TASKS, newTask);
    set(state => ({ tasks: [newTask, ...state.tasks] }));
    await get().recalculateDailyLogStats(newTask.dueDate);
    return newTask;
  },

  updateTask: async (id, updates) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const nowStr = new Date().toISOString();
    let isCompleted = updates.isCompleted !== undefined ? updates.isCompleted : task.isCompleted;
    let status = updates.status !== undefined ? updates.status : task.status;

    if (updates.status !== undefined) {
      if (updates.status === 'done') {
        isCompleted = true;
      } else {
        isCompleted = false;
      }
    } else if (updates.isCompleted !== undefined) {
      status = updates.isCompleted ? 'done' : 'todo';
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      isCompleted,
      status: status || (isCompleted ? 'done' : 'todo'),
      completedAt: isCompleted ? (task.completedAt || nowStr) : undefined,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.TASKS, updatedTask);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
    }));

    if (updates.dueDate || updates.isCompleted !== undefined || updates.status !== undefined) {
      await get().recalculateDailyLogStats(task.dueDate);
      if (updates.dueDate && updates.dueDate !== task.dueDate) {
        await get().recalculateDailyLogStats(updates.dueDate);
      }
    }
  },

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const isCompleting = !task.isCompleted;
    const nowStr = new Date().toISOString();

    const updatedTask: Task = {
      ...task,
      isCompleted: isCompleting,
      status: isCompleting ? 'done' : 'todo',
      completedAt: isCompleting ? nowStr : undefined,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.TASKS, updatedTask);

    // If it's recurring and being checked off, generate the next occurrence!
    if (isCompleting && task.isRecurring && task.recurrencePattern) {
      const nextDueDate = calculateNextRecurrence(task.dueDate, task.recurrencePattern);
      
      // Avoid duplicate future recurrences if already scheduled
      const isAlreadyScheduled = get().tasks.some(
        t => t.recurrenceId === task.recurrenceId && t.dueDate === nextDueDate && !t.isCompleted
      );

      if (!isAlreadyScheduled) {
        const nextTask: Task = {
          id: `task-${generateUUID()}`,
          title: task.title,
          description: task.description,
          isCompleted: false,
          status: 'todo',
          matrixQuadrant: task.matrixQuadrant,
          scheduledTime: task.scheduledTime,
          estimatedMinutes: task.estimatedMinutes,
          dueDate: nextDueDate,
          priority: task.priority,
          categoryId: task.categoryId,
          isRecurring: true,
          recurrencePattern: task.recurrencePattern,
          recurrenceId: task.recurrenceId || task.id, // Keep the chain linked
          createdAt: nowStr,
          updatedAt: nowStr,
          isSoftDeleted: false,
        };
        
        await dbService.put(STORES.TASKS, nextTask);
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t).concat(nextTask)
        }));
        
        // Recalculate for the new task's due date too
        await get().recalculateDailyLogStats(nextDueDate);
      } else {
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
        }));
      }
    } else {
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
      }));
    }

    await get().recalculateDailyLogStats(task.dueDate);
    await get().addXp(isCompleting ? 25 : -25);
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const nowStr = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      isSoftDeleted: true,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.TASKS, updatedTask);
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
    await get().recalculateDailyLogStats(task.dueDate);
  },

  // Habits
  addHabit: async (habitData) => {
    const nowStr = new Date().toISOString();
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${generateUUID()}`,
      completedDates: [],
      streakCount: 0,
      longestStreak: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
      isSoftDeleted: false,
    };

    await dbService.put(STORES.HABITS, newHabit);
    set(state => ({ habits: [newHabit, ...state.habits] }));
    return newHabit;
  },

  updateHabit: async (id, updates) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      ...updates,
      updatedAt: nowStr,
    };

    // If completedDates are updated, recalculate streaks
    if (updates.completedDates) {
      const streaks = calculateStreaks(updates.completedDates);
      updatedHabit.streakCount = streaks.currentStreak;
      updatedHabit.longestStreak = streaks.longestStreak;
    }

    await dbService.put(STORES.HABITS, updatedHabit);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));
  },

  toggleHabitCompletion: async (id, date) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    // Strict validation: Future dates cannot be completed, past grace period cannot be updated!
    const graceDays = get().settings?.habitGracePeriodDays ?? 3;
    const dateStatus = getHabitDateStatus(date, getTodayDateString(), graceDays);
    if (dateStatus.isFuture || dateStatus.isPastGracePeriod) {
      return;
    }

    const completedDates = [...habit.completedDates];
    const index = completedDates.indexOf(date);
    let uncompletedDates = [...(habit.uncompletedDates || [])];
    
    if (index >= 0) {
      completedDates.splice(index, 1); // remove completion
    } else {
      completedDates.push(date); // add completion
      // Clear uncompleted state if completing
      uncompletedDates = uncompletedDates.filter(d => d !== date);
    }

    const streaks = calculateStreaks(completedDates);
    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      uncompletedDates,
      streakCount: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.HABITS, updatedHabit);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));

    await get().recalculateDailyLogStats(date);
    await get().addXp(index === -1 ? 15 : -15);
  },

  markHabitUncompleted: async (id, date, reason) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    const graceDays = get().settings?.habitGracePeriodDays ?? 3;
    const dateStatus = getHabitDateStatus(date, getTodayDateString(), graceDays);
    // Future habits strictly cannot be modified
    if (dateStatus.isFuture) return;

    // Remove from completedDates if it was completed
    const completedDates = habit.completedDates.filter(d => d !== date);
    
    // Add to uncompletedDates
    const uncompletedSet = new Set(habit.uncompletedDates || []);
    uncompletedSet.add(date);
    const uncompletedDates = Array.from(uncompletedSet);

    // Update mono missed reason
    const missedReasons = { ...(habit.missedReasons || {}) };
    const trimmedReason = reason !== undefined ? reason.trim() : (missedReasons[date] || '');
    if (trimmedReason) {
      missedReasons[date] = trimmedReason;
    }

    const streaks = calculateStreaks(completedDates);
    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      uncompletedDates,
      missedReasons,
      streakCount: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.HABITS, updatedHabit);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));

    // Sync strictly mono section to Journal Note if reason exists
    if (trimmedReason) {
      const existingNote = get().notes.find(n => n.id === date);
      const updatedNoteContent = upsertHabitMissedNoteSection(
        existingNote ? existingNote.content : '',
        habit.name,
        date,
        trimmedReason
      );
      await get().saveNote(date, updatedNoteContent, existingNote?.title || `Journal Entry - ${format(parseDateString(date), 'MMM d, yyyy')}`);
    }

    await get().recalculateDailyLogStats(date);
  },

  clearHabitUncompleted: async (id, date) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    const uncompletedDates = (habit.uncompletedDates || []).filter(d => d !== date);
    const missedReasons = { ...(habit.missedReasons || {}) };
    delete missedReasons[date];

    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      uncompletedDates,
      missedReasons,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.HABITS, updatedHabit);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));

    // Remove habit missed section from journal note
    const existingNote = get().notes.find(n => n.id === date);
    if (existingNote) {
      const updatedNoteContent = upsertHabitMissedNoteSection(
        existingNote.content,
        habit.name,
        date,
        undefined
      );
      await get().saveNote(date, updatedNoteContent, existingNote.title);
    }

    await get().recalculateDailyLogStats(date);
  },

  deleteHabit: async (id) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      isSoftDeleted: true,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.HABITS, updatedHabit);
    set(state => ({
      habits: state.habits.filter(h => h.id !== id)
    }));

    // Recalculate daily logs where this habit might have been completed
    for (const date of habit.completedDates) {
      await get().recalculateDailyLogStats(date);
    }
  },

  // Daily Logs
  getOrCreateDailyLog: async (date) => {
    const log = await dbService.get<DailyLog>(STORES.DAILY_LOGS, date);
    if (log) return log;

    const nowStr = new Date().toISOString();
    const newLog: DailyLog = {
      id: date,
      date,
      focusScore: 0,
      completedTasksCount: 0,
      completedHabitsCount: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.DAILY_LOGS, newLog);
    
    // Add to state if not there
    set(state => {
      if (state.dailyLogs.some(l => l.id === date)) return {};
      return { dailyLogs: [...state.dailyLogs, newLog] };
    });

    return newLog;
  },

  updateDailyLog: async (date, updates) => {
    const log = await get().getOrCreateDailyLog(date);
    const nowStr = new Date().toISOString();
    
    const updatedLog: DailyLog = {
      ...log,
      ...updates,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.DAILY_LOGS, updatedLog);
    set(state => ({
      dailyLogs: state.dailyLogs.map(l => l.id === date ? updatedLog : l)
    }));
  },

  recalculateDailyLogStats: async (date) => {
    const activeTasks = get().tasks.filter(t => !t.isSoftDeleted);
    const tasksDue = activeTasks.filter(t => t.dueDate === date);
    const completedTasks = tasksDue.filter(t => t.isCompleted);
    
    const activeHabits = get().habits.filter(h => !h.isSoftDeleted);
    const completedHabitsCount = activeHabits.filter(h => h.completedDates.includes(date)).length;
    
    // Filter habits scheduled for this specific date
    const dateObj = parseDateString(date);
    const dayOfWeek = dateObj.getDay();
    const scheduledHabits = activeHabits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'custom') {
        return h.customDays && h.customDays.length > 0 ? h.customDays.includes(dayOfWeek) : true;
      }
      return true;
    });

    const totalTasksCount = tasksDue.length;
    const completedTasksCount = completedTasks.length;
    const activeHabitsCount = scheduledHabits.length;

    let focusScore = 0;
    
    if (totalTasksCount > 0 && activeHabitsCount > 0) {
      const taskRatio = completedTasksCount / totalTasksCount;
      const habitRatio = completedHabitsCount / activeHabitsCount;
      focusScore = Math.round((taskRatio * 50) + (habitRatio * 50));
    } else if (totalTasksCount > 0) {
      focusScore = Math.round((completedTasksCount / totalTasksCount) * 100);
    } else if (activeHabitsCount > 0) {
      focusScore = Math.round((completedHabitsCount / activeHabitsCount) * 100);
    } else {
      focusScore = 0;
    }

    const log = await get().getOrCreateDailyLog(date);
    await get().updateDailyLog(date, {
      completedTasksCount,
      completedHabitsCount,
      focusScore,
      mood: log.mood // preserve mood
    });
  },

  // Notes
  saveNote: async (date, content, title) => {
    const note = get().notes.find(n => n.id === date || n.date === date);
    const nowStr = new Date().toISOString();

    if (note) {
      const updatedNote: Note = {
        ...note,
        id: date,
        date,
        content,
        title,
        updatedAt: nowStr,
      };
      await dbService.put(STORES.NOTES, updatedNote);
      set(state => ({
        notes: state.notes.map(n => (n.id === date || n.date === date) ? updatedNote : n)
      }));
    } else {
      const newNote: Note = {
        id: date,
        date,
        title,
        content,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      await dbService.put(STORES.NOTES, newNote);
      set(state => ({
        notes: [...state.notes.filter(n => n.id !== date && n.date !== date), newNote]
      }));
      await get().addXp(40);
    }
  },

  deleteNote: async (date) => {
    await dbService.delete(STORES.NOTES, date);
    set(state => ({
      notes: state.notes.filter(n => n.id !== date && n.date !== date)
    }));
  },

  // Reminders
  addReminder: async (reminderData) => {
    const nowStr = new Date().toISOString();
    const newReminder: Reminder = {
      ...reminderData,
      id: `reminder-${generateUUID()}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.REMINDERS, newReminder);
    set(state => ({ reminders: [...state.reminders, newReminder] }));
  },

  updateReminder: async (id, updates) => {
    const reminder = get().reminders.find(r => r.id === id);
    if (!reminder) return;

    const nowStr = new Date().toISOString();
    const updatedReminder: Reminder = {
      ...reminder,
      ...updates,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.REMINDERS, updatedReminder);
    set(state => ({
      reminders: state.reminders.map(r => r.id === id ? updatedReminder : r)
    }));
  },

  deleteReminder: async (id) => {
    await dbService.delete(STORES.REMINDERS, id);
    set(state => ({
      reminders: state.reminders.filter(r => r.id !== id)
    }));
  },

  // Categories
  addCategory: async (categoryData) => {
    const nowStr = new Date().toISOString();
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${generateUUID()}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.CATEGORIES, newCategory);
    set(state => ({ categories: [...state.categories, newCategory] }));
  },

  deleteCategory: async (id) => {
    // Check if category is built-in to prevent issues
    if (id.startsWith('cat-work') || id.startsWith('cat-personal') || id.startsWith('cat-health')) {
      // Allow delete but good to know
    }
    
    await dbService.delete(STORES.CATEGORIES, id);
    
    // Set all tasks in this category to categoryId: undefined
    const updatedTasks = get().tasks.map(t => {
      if (t.categoryId === id) {
        const nowStr = new Date().toISOString();
        const updated = { ...t, categoryId: undefined, updatedAt: nowStr };
        dbService.put(STORES.TASKS, updated);
        return updated;
      }
      return t;
    });

    // Set all habits in this category to categoryId: undefined
    const updatedHabits = get().habits.map(h => {
      if (h.categoryId === id) {
        const nowStr = new Date().toISOString();
        const updated = { ...h, categoryId: undefined, updatedAt: nowStr };
        dbService.put(STORES.HABITS, updated);
        return updated;
      }
      return h;
    });

    set(state => ({
      categories: state.categories.filter(c => c.id !== id),
      tasks: updatedTasks,
      habits: updatedHabits
    }));
  },

  // Settings
  updateSettings: (updates) => {
    let modeUpdates: Partial<Settings> = {};

    // Mutual exclusion: Only ONE real-time sync mode can be active at a time
    if (updates.oneDriveSyncEnabled === true) {
      modeUpdates = {
        githubSyncEnabled: false,
        localAutoSyncEnabled: false,
        activeSyncMode: 'onedrive',
      };
    } else if (updates.githubSyncEnabled === true) {
      modeUpdates = {
        oneDriveSyncEnabled: false,
        localAutoSyncEnabled: false,
        activeSyncMode: 'github',
      };
    } else if (updates.localAutoSyncEnabled === true) {
      modeUpdates = {
        oneDriveSyncEnabled: false,
        githubSyncEnabled: false,
        activeSyncMode: 'local',
      };
    } else if (
      (updates.oneDriveSyncEnabled === false && get().settings.activeSyncMode === 'onedrive') ||
      (updates.githubSyncEnabled === false && get().settings.activeSyncMode === 'github') ||
      (updates.localAutoSyncEnabled === false && get().settings.activeSyncMode === 'local')
    ) {
      modeUpdates = { activeSyncMode: 'none' };
    }

    const updatedSettings = {
      ...get().settings,
      ...updates,
      ...modeUpdates,
    };
    settingsStorage.set(updatedSettings);
    set({ settings: updatedSettings });
    // Debounce badge checks to avoid expensive recalculation on rapid settings changes
    if (typeof window !== 'undefined') {
      if ((window as any).__shadowBadgeCheckTimer) {
        clearTimeout((window as any).__shadowBadgeCheckTimer);
      }
      (window as any).__shadowBadgeCheckTimer = setTimeout(() => {
        get().checkAndUnlockBadges();
      }, 500);
    }
  },

  // Gamification Actions
  addXp: async (amount: number) => {
    let currentXp = get().xp + amount;
    let currentLevel = get().level || 1;
    let xpNeeded = getXpForLevel(currentLevel);

    while (currentXp >= xpNeeded && currentLevel < 100) {
      currentXp -= xpNeeded;
      currentLevel++;
      xpNeeded = getXpForLevel(currentLevel);
    }

    if (currentLevel >= 100) {
      currentLevel = 100;
      currentXp = Math.min(currentXp, getXpForLevel(100));
    }

    if (currentXp < 0) {
      currentXp = 0;
    }

    set({ xp: currentXp, level: currentLevel });
    get().updateSettings({ xp: currentXp, level: currentLevel });

    await get().checkAndUnlockBadges();
  },

  checkAndUnlockBadges: async () => {
    const { tasks, habits, dailyLogs, notes, unlockedBadges, settings } = get();
    const activeTasks = tasks.filter(t => !t.isSoftDeleted);
    const activeHabits = habits.filter(h => !h.isSoftDeleted);
    const toUnlock: string[] = [];
    const toRevoke: string[] = [];
    const resetTime = settings.badgesResetTimestamp ? new Date(settings.badgesResetTimestamp).getTime() : 0;

    const isAfterReset = (dateStr?: string) => {
      if (!settings.badgesResetTimestamp) return true;
      if (!dateStr) return true;
      if (dateStr.length === 10) { // YYYY-MM-DD
        return dateStr >= settings.badgesResetTimestamp.substring(0, 10);
      }
      return new Date(dateStr).getTime() >= resetTime;
    };

    const hasBadge = (bId: string) => unlockedBadges.includes(bId);

    // Standalone todos count
    let standaloneCompletedCount = 0;
    let hasRecentStandalone = false;
    try {
      const savedTodos = typeof window !== 'undefined' ? localStorage.getItem('shadow_standalone_todos_v1') : null;
      if (savedTodos) {
        const todosArr = JSON.parse(savedTodos);
        if (Array.isArray(todosArr)) {
          const completedTodos = todosArr.filter((t: any) => t.isCompleted && isAfterReset(t.completedAt || t.updatedAt || t.createdAt));
          standaloneCompletedCount = completedTodos.length;
          hasRecentStandalone = completedTodos.length > 0;
        }
      }
    } catch (e) {}

    // 1. First Spark (Permanent milestone once first task or standalone todo is completed after reset)
    const hasCompletedTask = activeTasks.some(t => t.isCompleted && isAfterReset(t.completedAt || t.updatedAt || t.createdAt)) || hasRecentStandalone;
    if (hasCompletedTask && !hasBadge('badge-first-task')) toUnlock.push('badge-first-task');

    // 2. Atomic Habitual (Permanent milestone once first habit is checked off after reset)
    const hasCompletedHabit = activeHabits.some(h => (h.completedDates && h.completedDates.some(d => isAfterReset(d))) || ((h.streakCount || 0) > 0 && isAfterReset()));
    if (hasCompletedHabit && !hasBadge('badge-first-habit')) toUnlock.push('badge-first-habit');

    // 3. Consistency Kick (Streak >= 3 or longest streak >= 3)
    const hasStreak3 = activeHabits.some(h => (h.streakCount || 0) >= 3 || (h.longestStreak || 0) >= 3);
    if (hasStreak3 && !hasBadge('badge-streak-3')) toUnlock.push('badge-streak-3');

    // 4. Weekly Protocol (Streak >= 7 or longest streak >= 7)
    const hasStreak7 = activeHabits.some(h => (h.streakCount || 0) >= 7 || (h.longestStreak || 0) >= 7);
    if (hasStreak7 && !hasBadge('badge-streak-7')) toUnlock.push('badge-streak-7');

    // 4.5. Monthly Core (Streak >= 30 or longest streak >= 30)
    const hasStreak30 = activeHabits.some(h => (h.streakCount || 0) >= 30 || (h.longestStreak || 0) >= 30);
    if (hasStreak30 && !hasBadge('badge-streak-30')) toUnlock.push('badge-streak-30');

    // 5. Deep Harmony (Requires >= 95% focus score AND at least 1 task/habit completed)
    const hasTasksOrHabits = activeTasks.length > 0 || activeHabits.length > 0 || standaloneCompletedCount > 0;
    const hasPerfectDay = hasTasksOrHabits && dailyLogs.some(l => 
      (l.focusScore ?? 0) >= 95 && 
      ((l.completedTasksCount || 0) + (l.completedHabitsCount || 0) + standaloneCompletedCount > 0) && 
      isAfterReset(l.date || l.createdAt || l.id)
    );
    if (hasPerfectDay && !hasBadge('badge-perfect-day')) {
      toUnlock.push('badge-perfect-day');
    }

    // 6. Mindful Mind (Any note after reset - permanent)
    if (notes.some(n => isAfterReset(n.createdAt || n.updatedAt)) && !hasBadge('badge-first-note')) {
      toUnlock.push('badge-first-note');
    }

    // 7. Quarterly Legend (Streak >= 90 or longest streak >= 90)
    const hasStreak90 = activeHabits.some(h => (h.streakCount || 0) >= 90 || (h.longestStreak || 0) >= 90);
    if (hasStreak90 && !hasBadge('badge-streak-90')) toUnlock.push('badge-streak-90');

    // 9. Completionist 100 (100 total tasks or standalone todos after reset - permanent)
    const newCompletedTasks = activeTasks.filter(t => t.isCompleted && isAfterReset(t.completedAt || t.updatedAt || t.createdAt));
    if ((newCompletedTasks.length + standaloneCompletedCount) >= 100 && !hasBadge('badge-completionist-100')) {
      toUnlock.push('badge-completionist-100');
    }

    // 8. Wealth Master
    try {
      const savedMoney = typeof window !== 'undefined' ? localStorage.getItem('shadow_money_data_v3') : null;
      if (savedMoney) {
        const moneyData = JSON.parse(savedMoney);
        const savings = moneyData.stats?.savings ?? 0;
        const totalInvestments = (moneyData.stats?.investments ?? []).reduce((acc: number, item: any) => acc + item.amount, 0);
        
        const targetSavings = settings.savingsTarget ?? 0;
        const targetInvestments = settings.investmentsTarget ?? 0;
        
        if (targetSavings > 0 && targetInvestments > 0 && savings >= targetSavings && totalInvestments >= targetInvestments && !hasBadge('badge-wealth-master')) {
          toUnlock.push('badge-wealth-master');
        }
      }
    } catch (e) {}

    if (toUnlock.length > 0 || toRevoke.length > 0) {
      let nextBadges = [...unlockedBadges];
      
      // Remove revoked
      if (toRevoke.length > 0) {
        nextBadges = nextBadges.filter(b => !toRevoke.includes(b));
      }
      
      // Add unlocked
      if (toUnlock.length > 0) {
        nextBadges = [...nextBadges, ...toUnlock];
      }

      set({ unlockedBadges: nextBadges });
      const updatedSettings = {
        ...settings,
        unlockedBadges: nextBadges
      };
      settingsStorage.set(updatedSettings);
      set({ settings: updatedSettings });

      if (typeof window !== 'undefined' && toUnlock.length > 0) {
        toUnlock.forEach((bId, idx) => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('badgeUnlocked', { detail: bId }));
          }, idx * 300);
        });
      }
    }
  },

  resetBadges: () => {
    const resetTime = new Date().toISOString();
    const updatedSettings = {
      ...get().settings,
      unlockedBadges: [],
      badgesResetTimestamp: resetTime,
    };
    settingsStorage.set(updatedSettings);
    set({ unlockedBadges: [], settings: updatedSettings });
  },

  restoreBadges: async () => {
    const { tasks, habits, dailyLogs, notes } = get();
    const earned: string[] = [];

    let standaloneCompletedCount = 0;
    try {
      const savedTodos = typeof window !== 'undefined' ? localStorage.getItem('shadow_standalone_todos_v1') : null;
      if (savedTodos) {
        const todosArr = JSON.parse(savedTodos);
        if (Array.isArray(todosArr)) {
          standaloneCompletedCount = todosArr.filter((t: any) => t.isCompleted).length;
        }
      }
    } catch (e) {}

    // 1. First Spark
    if (tasks.filter(t => t.isCompleted).length >= 1 || standaloneCompletedCount >= 1) earned.push('badge-first-task');
    
    // 2. Atomic Habitual
    if (habits.some(h => (h.completedDates && h.completedDates.length > 0) || (h.streakCount || 0) > 0)) earned.push('badge-first-habit');
    
    // 3. Consistency Kick
    if (habits.some(h => (h.streakCount || 0) >= 3 || (h.longestStreak || 0) >= 3)) earned.push('badge-streak-3');
    
    // 4. Weekly Protocol
    if (habits.some(h => (h.streakCount || 0) >= 7 || (h.longestStreak || 0) >= 7)) earned.push('badge-streak-7');
    
    // 4.5. Monthly Core
    if (habits.some(h => (h.streakCount || 0) >= 30 || (h.longestStreak || 0) >= 30)) earned.push('badge-streak-30');
    
    // 5. Deep Harmony
    const hasTasksOrHabits = tasks.length > 0 || habits.length > 0 || standaloneCompletedCount > 0;
    if (hasTasksOrHabits && dailyLogs.some(l => (l.focusScore ?? 0) >= 95 && ((l.completedTasksCount || 0) + (l.completedHabitsCount || 0) + standaloneCompletedCount > 0))) {
      earned.push('badge-perfect-day');
    }
    
    // 6. Mindful Mind
    if (notes.length > 0) earned.push('badge-first-note');
    
    // 7. Quarterly Legend
    if (habits.some(h => (h.streakCount || 0) >= 90 || (h.longestStreak || 0) >= 90)) earned.push('badge-streak-90');
    
    // 9. Completionist 100
    if ((tasks.filter(t => t.isCompleted).length + standaloneCompletedCount) >= 100) earned.push('badge-completionist-100');
    
    // 10. Wealth Master
    const settings = get().settings;
    try {
      const savedMoney = typeof window !== 'undefined' ? localStorage.getItem('shadow_money_data_v3') : null;
      if (savedMoney) {
        const moneyData = JSON.parse(savedMoney);
        const savings = moneyData.stats?.savings ?? 0;
        const totalInvestments = (moneyData.stats?.investments ?? []).reduce((acc: number, item: any) => acc + item.amount, 0);
        
        const targetSavings = settings.savingsTarget ?? 0;
        const targetInvestments = settings.investmentsTarget ?? 0;
        
        if (targetSavings > 0 && targetInvestments > 0 && savings >= targetSavings && totalInvestments >= targetInvestments) {
          earned.push('badge-wealth-master');
        }
      }
    } catch (e) {}

    const updatedSettings = {
      ...settings,
      unlockedBadges: earned,
      badgesResetTimestamp: undefined,
    };
    settingsStorage.set(updatedSettings);
    set({ unlockedBadges: earned, settings: updatedSettings });
  },

  resetLifeRpg: async () => {
    set({ xp: 0, level: 1 });
    get().updateSettings({ xp: 0, level: 1 });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('shadow_rpg_quests_v1');
        window.dispatchEvent(new CustomEvent('shadowRpgReset'));
      } catch (e) {}
    }
  },

  recalibrateFromCurrentData: async () => {
    const { tasks, habits, dailyLogs, notes, settings } = get();
    const activeTasks = tasks.filter(t => !t.isSoftDeleted);
    const activeHabits = habits.filter(h => !h.isSoftDeleted);

    // 1. Count completed tasks & standalone todos
    const completedTasksCount = activeTasks.filter(t => t.isCompleted).length;
    let standaloneCompletedCount = 0;
    try {
      const savedTodos = typeof window !== 'undefined' ? localStorage.getItem('shadow_standalone_todos_v1') : null;
      if (savedTodos) {
        const todosArr = JSON.parse(savedTodos);
        if (Array.isArray(todosArr)) {
          standaloneCompletedCount = todosArr.filter((t: any) => t.isCompleted).length;
        }
      }
    } catch (e) {}
    const totalTasksDone = completedTasksCount + standaloneCompletedCount;

    // 2. Count habit completions & streaks
    let totalHabitCheckoffs = 0;
    let maxStreak = 0;
    activeHabits.forEach(h => {
      totalHabitCheckoffs += (h.completedDates?.length || 0);
      const s = Math.max(h.streakCount || 0, h.longestStreak || 0);
      if (s > maxStreak) maxStreak = s;
    });

    // 3. Count notes and logs
    const notesCount = notes.length;
    const logsCount = dailyLogs.length;

    // 4. Calculate total earned XP based mathematically on real historical execution
    let totalEarnedXp = (totalTasksDone * 25) + (totalHabitCheckoffs * 20) + (maxStreak * 25) + (notesCount * 15) + (logsCount * 15);
    if (totalEarnedXp < 0) totalEarnedXp = 0;

    // 5. Compute level & remaining XP progression
    let newLevel = 1;
    let remainingXp = totalEarnedXp;
    let xpNeeded = getXpForLevel(newLevel);

    while (remainingXp >= xpNeeded && newLevel < 100) {
      remainingXp -= xpNeeded;
      newLevel++;
      xpNeeded = getXpForLevel(newLevel);
    }

    if (newLevel >= 100) {
      newLevel = 100;
      remainingXp = Math.min(remainingXp, getXpForLevel(100));
    }

    // 6. Recalibrate and unlock all earned badges
    const earnedBadges: string[] = [];

    // Badge 1: First Spark
    if (totalTasksDone >= 1) earnedBadges.push('badge-first-task');

    // Badge 2: Atomic Habit
    if (totalHabitCheckoffs >= 1) earnedBadges.push('badge-first-habit');

    // Badge 3: Triple Streak
    if (maxStreak >= 3) earnedBadges.push('badge-streak-3');

    // Badge 4: Weekly Streak
    if (maxStreak >= 7) earnedBadges.push('badge-streak-7');

    // Badge 5: Monthly Core
    if (maxStreak >= 30) earnedBadges.push('badge-streak-30');

    // Badge 6: Deep Harmony
    const hasPerfectDay = dailyLogs.some(l => (l.focusScore ?? 0) >= 95 && ((l.completedTasksCount || 0) + (l.completedHabitsCount || 0) + standaloneCompletedCount > 0));
    if (hasPerfectDay) earnedBadges.push('badge-perfect-day');

    // Badge 7: Mindful Mind
    if (notesCount >= 1) earnedBadges.push('badge-first-note');

    // Badge 8: Quarter Zenith (90 day streak)
    if (maxStreak >= 90) earnedBadges.push('badge-streak-90');

    // Badge 9: Century Master (100 total tasks)
    if (totalTasksDone >= 100) earnedBadges.push('badge-completionist-100');

    // Badge 10: Wealth Master
    try {
      const savedMoney = typeof window !== 'undefined' ? localStorage.getItem('shadow_money_data_v3') : null;
      if (savedMoney) {
        const moneyData = JSON.parse(savedMoney);
        const savings = moneyData.stats?.savings ?? 0;
        const totalInvestments = (moneyData.stats?.investments ?? []).reduce((acc: number, item: any) => acc + item.amount, 0);
        const targetSavings = settings.savingsTarget ?? 0;
        const targetInvestments = settings.investmentsTarget ?? 0;
        if (targetSavings > 0 && targetInvestments > 0 && savings >= targetSavings && totalInvestments >= targetInvestments) {
          earnedBadges.push('badge-wealth-master');
        }
      }
    } catch (e) {}

    const updatedSettings: Settings = {
      ...settings,
      xp: remainingXp,
      level: newLevel,
      unlockedBadges: earnedBadges,
      badgesResetTimestamp: undefined,
    };

    settingsStorage.set(updatedSettings);
    set({
      xp: remainingXp,
      level: newLevel,
      unlockedBadges: earnedBadges,
      settings: updatedSettings,
    });

    const { getCharacterTitle } = await import('@/features/rpg/rpgLevels');
    const title = getCharacterTitle(newLevel);

    return {
      level: newLevel,
      xp: remainingXp,
      title,
      totalTasksCompleted: totalTasksDone,
      totalHabitCheckoffs,
      totalNotes: notesCount,
      badgesUnlockedCount: earnedBadges.length,
      unlockedBadges: earnedBadges,
    };
  },
}));

// Generates Seed/Demo data for rich initial user experience
function generateSeedData(categories: Category[]): {
  categories: Category[];
  tasks: Task[];
  habits: Habit[];
  dailyLogs: DailyLog[];
  notes: Note[];
  reminders: Reminder[];
} {
  const now = new Date();
  const getOffsetDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(now.getDate() + offsetDays);
    return formatDateString(d);
  };

  const isoNow = now.toISOString();

  // Create demo habits with historic completion arrays to generate streaks & heatmaps
  const habits: Habit[] = [
    {
      id: 'habit-1',
      name: 'Morning Mindfulness',
      description: '10 minutes of silent meditation and breathing exercises.',
      categoryId: 'cat-personal',
      frequency: 'daily',
      // Completed last 6 days (active streak)
      completedDates: [
        getOffsetDateStr(0),
        getOffsetDateStr(-1),
        getOffsetDateStr(-2),
        getOffsetDateStr(-3),
        getOffsetDateStr(-4),
        getOffsetDateStr(-5),
      ],
      streakCount: 6,
      longestStreak: 12,
      createdAt: getOffsetDateStr(-15),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'habit-2',
      name: 'Gym Workout Routine',
      description: '45 mins strength training or cardio session.',
      categoryId: 'cat-health',
      frequency: 'custom',
      customDays: [1, 3, 5], // Mon, Wed, Fri
      // Completed Monday and Wednesday
      completedDates: [
        getOffsetDateStr(-2), // 2 days ago
        getOffsetDateStr(-4), // 4 days ago
        getOffsetDateStr(-9), // last week
      ],
      streakCount: 2,
      longestStreak: 5,
      createdAt: getOffsetDateStr(-15),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'habit-3',
      name: 'Read Technical Book',
      description: 'Read at least 10 pages of software design guides.',
      categoryId: 'cat-study',
      frequency: 'daily',
      // Completed yesterday, day before, but not today yet
      completedDates: [
        getOffsetDateStr(-1),
        getOffsetDateStr(-2),
        getOffsetDateStr(-3),
      ],
      streakCount: 3,
      longestStreak: 8,
      createdAt: getOffsetDateStr(-10),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
  ];

  // Tasks
  const tasks: Task[] = [
    // Today tasks
    {
      id: 'task-1',
      title: 'Configure Shadow-Tracker state store',
      description: 'Define Zustand logic, local storage services and seed values.',
      isCompleted: true,
      dueDate: getOffsetDateStr(0),
      priority: 'high',
      categoryId: 'cat-work',
      isRecurring: false,
      recurrencePattern: null,
      completedAt: isoNow,
      createdAt: getOffsetDateStr(-1),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'task-2',
      title: 'Design premium glassmorphism landing interface',
      description: 'Implement dark/light layout, focus gauges, responsive dashboard grid.',
      isCompleted: false,
      dueDate: getOffsetDateStr(0),
      priority: 'high',
      categoryId: 'cat-work',
      isRecurring: false,
      recurrencePattern: null,
      createdAt: getOffsetDateStr(-1),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'task-3',
      title: 'Create Docker-compose configuration',
      description: 'Prepare node development hot-reload and optimized multi-stage build docker containers.',
      isCompleted: false,
      dueDate: getOffsetDateStr(1), // Tomorrow
      priority: 'medium',
      categoryId: 'cat-work',
      isRecurring: false,
      recurrencePattern: null,
      createdAt: getOffsetDateStr(0),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'task-4',
      title: 'Stretch & posture exercises',
      description: 'Focus on posture for 10 minutes mid-day.',
      isCompleted: true,
      dueDate: getOffsetDateStr(0),
      priority: 'low',
      categoryId: 'cat-health',
      isRecurring: true,
      recurrencePattern: 'daily',
      recurrenceId: 'recur-stretch',
      completedAt: isoNow,
      createdAt: getOffsetDateStr(-3),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'task-5',
      title: 'Pay gym monthly membership',
      description: 'Auto-renew or manual wire.',
      isCompleted: false,
      dueDate: getOffsetDateStr(3),
      priority: 'medium',
      categoryId: 'cat-finance',
      isRecurring: false,
      recurrencePattern: null,
      createdAt: getOffsetDateStr(0),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    // Past completed tasks for stats
    {
      id: 'task-6',
      title: 'Outline product architecture and models',
      description: 'Defined shadow schema for offline compatibility.',
      isCompleted: true,
      dueDate: getOffsetDateStr(-1),
      priority: 'high',
      categoryId: 'cat-work',
      isRecurring: false,
      recurrencePattern: null,
      completedAt: getOffsetDateStr(-1),
      createdAt: getOffsetDateStr(-3),
      updatedAt: getOffsetDateStr(-1),
      isSoftDeleted: false,
    },
    {
      id: 'task-7',
      title: 'Audit accessibility colors',
      description: 'Verified WCAG AA contrast ratio compliance.',
      isCompleted: true,
      dueDate: getOffsetDateStr(-2),
      priority: 'medium',
      categoryId: 'cat-personal',
      isRecurring: false,
      recurrencePattern: null,
      completedAt: getOffsetDateStr(-2),
      createdAt: getOffsetDateStr(-4),
      updatedAt: getOffsetDateStr(-2),
      isSoftDeleted: false,
    }
  ];

  // Daily Logs
  const dailyLogs: DailyLog[] = [];
  const notes: Note[] = [];

  // Let's populate the logs for the last 5 days
  for (let i = 0; i >= -5; i--) {
    const dateStr = getOffsetDateStr(i);
    
    // Count items completed on this day
    const tasksDue = tasks.filter(t => t.dueDate === dateStr);
    const completedTasks = tasksDue.filter(t => t.isCompleted);
    const totalTasksCount = tasksDue.length;
    const completedTasksCount = completedTasks.length;
    
    const completedHabitsCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
    const activeHabitsCount = habits.length;

    let focusScore = 0;
    if (totalTasksCount > 0 && activeHabitsCount > 0) {
      focusScore = Math.round(((completedTasksCount / totalTasksCount) * 50) + ((completedHabitsCount / activeHabitsCount) * 50));
    } else if (totalTasksCount > 0) {
      focusScore = Math.round((completedTasksCount / totalTasksCount) * 100);
    } else if (activeHabitsCount > 0) {
      focusScore = Math.round((completedHabitsCount / activeHabitsCount) * 100);
    }

    dailyLogs.push({
      id: dateStr,
      date: dateStr,
      focusScore: Math.min(100, Math.max(15, focusScore || 45)), // cap values for beautiful chart display
      completedTasksCount,
      completedHabitsCount,
      mood: i === 0 ? 'great' : i === -1 ? 'good' : i === -2 ? 'neutral' : 'great',
      createdAt: getOffsetDateStr(i),
      updatedAt: getOffsetDateStr(i),
    });

    if (i === 0) {
      notes.push({
        id: dateStr,
        date: dateStr,
        title: 'Launch Preparation',
        content: `Today was extremely productive! 🚀
- Setup the core IndexedDB local database service.
- Verified state sync using Zustand.
- Focus score is high. Ready to start polishing the styling and Framer Motion micro-interactions.`,
        createdAt: getOffsetDateStr(i),
        updatedAt: getOffsetDateStr(i),
      });
    } else if (i === -1) {
      notes.push({
        id: dateStr,
        date: dateStr,
        title: 'Project Inception',
        content: `Laid the architecture foundations for **Shadow-Tracker** today. 
The database models feel robust and migration-friendly. Ready for Expo scaling later.`,
        createdAt: getOffsetDateStr(i),
        updatedAt: getOffsetDateStr(i),
      });
    }
  }

  // Reminders
  const reminders: Reminder[] = [
    {
      id: 'rem-1',
      title: 'Morning Meditation Call',
      time: '08:00',
      days: [1, 2, 3, 4, 5, 6, 0], // Every day
      isEnabled: true,
      habitId: 'habit-1',
      createdAt: getOffsetDateStr(-10),
      updatedAt: getOffsetDateStr(-10),
    },
    {
      id: 'rem-2',
      title: 'Review daily shadow focus',
      time: '21:00',
      days: [1, 2, 3, 4, 5, 6, 0],
      isEnabled: true,
      createdAt: getOffsetDateStr(-10),
      updatedAt: getOffsetDateStr(-10),
    }
  ];

  return {
    categories,
    tasks,
    habits,
    dailyLogs,
    notes,
    reminders,
  };
}
