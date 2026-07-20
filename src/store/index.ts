import { create } from 'zustand';
import { generate60DaysSeedData } from './generate60Days';
import { Task, Habit, DailyLog, Note, Reminder, Category, Settings, BackupData } from '@/types';
import { dbService, STORES, settingsStorage } from '@/lib/storage';
import { calculateStreaks, calculateNextRecurrence, getTodayDateString, formatDateString } from '@/lib/dateUtils';

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
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSoftDeleted' | 'isCompleted'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'isSoftDeleted' | 'completedDates' | 'streakCount' | 'longestStreak'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
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

      // Seed demo data if this is the very first onboarding
      if (!settings.isCompletedOnboarding && tasks.length === 0 && habits.length === 0) {
        const seed = generate60DaysSeedData(categories);
        
        // Save seed data to IndexedDB
        for (const cat of seed.categories) {
          await dbService.put(STORES.CATEGORIES, cat);
        }
        for (const t of seed.tasks) {
          await dbService.put(STORES.TASKS, t);
        }
        for (const h of seed.habits) {
          await dbService.put(STORES.HABITS, h);
        }
        for (const log of seed.dailyLogs) {
          await dbService.put(STORES.DAILY_LOGS, log);
        }
        for (const note of seed.notes) {
          await dbService.put(STORES.NOTES, note);
        }

        set({
          categories: seed.categories,
          tasks: seed.tasks,
          habits: seed.habits,
          dailyLogs: seed.dailyLogs,
          notes: seed.notes,
          reminders: seed.reminders,
          isLoading: false,
        });
        
        // Ensure badges unlock based on 60 day seed
        get().checkAndUnlockBadges();
        return;
      }

      set({
        categories,
        tasks: tasks.filter(t => !t.isSoftDeleted),
        habits: habits.filter(h => !h.isSoftDeleted),
        dailyLogs,
        notes,
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

      const defaultSettings: Settings = {
        theme: 'onedark',
        backupReminderDays: 7,
        soundEnabled: true,
        showCompletedTasks: true,
        isCompletedOnboarding: true,
        xp: 0,
        level: 1,
        unlockedBadges: [],
        alias: 'Shadow',
        savingsTarget: 0,
        investmentsTarget: 0,
      };
      settingsStorage.set(defaultSettings);

      const seed = generate60DaysSeedData(seededCategories);
      
      // Save seed data to IndexedDB
      for (const t of seed.tasks) await dbService.put(STORES.TASKS, t);
      for (const h of seed.habits) await dbService.put(STORES.HABITS, h);
      for (const log of seed.dailyLogs) await dbService.put(STORES.DAILY_LOGS, log);
      for (const note of seed.notes) await dbService.put(STORES.NOTES, note);

      set({
        tasks: seed.tasks,
        habits: seed.habits,
        dailyLogs: seed.dailyLogs,
        notes: seed.notes,
        reminders: seed.reminders,
        categories: seed.categories,
        settings: defaultSettings,
        xp: 0,
        level: 1,
        unlockedBadges: [],
        isLoading: false,
      });
      
      get().checkAndUnlockBadges();
    } catch (error) {
      console.error('Failed to reset database:', error);
      set({ isLoading: false });
    }
  },

  importBackup: async (data: BackupData) => {
    try {
      set({ isLoading: true });
      await dbService.importAllData(data);
      settingsStorage.set(data.settings);
      
      set({
        tasks: data.tasks.filter(t => !t.isSoftDeleted),
        habits: data.habits.filter(h => !h.isSoftDeleted),
        dailyLogs: data.dailyLogs || [],
        notes: data.notes || [],
        reminders: data.reminders || [],
        categories: data.categories || [],
        settings: data.settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to import backup:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Tasks
  addTask: async (taskData) => {
    const nowStr = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${generateUUID()}`,
      isCompleted: false,
      createdAt: nowStr,
      updatedAt: nowStr,
      isSoftDeleted: false,
    };

    await dbService.put(STORES.TASKS, newTask);
    set(state => ({ tasks: [newTask, ...state.tasks] }));
    await get().recalculateDailyLogStats(newTask.dueDate);
  },

  updateTask: async (id, updates) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const nowStr = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.TASKS, updatedTask);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
    }));

    if (updates.dueDate || updates.isCompleted !== undefined) {
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
    const todayDate = getTodayDateString();

    const updatedTask: Task = {
      ...task,
      isCompleted: isCompleting,
      completedAt: isCompleting ? nowStr : undefined,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.TASKS, updatedTask);
    await get().addXp(isCompleting ? 25 : -25);

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

    const completedDates = [...habit.completedDates];
    const index = completedDates.indexOf(date);
    
    if (index >= 0) {
      completedDates.splice(index, 1); // remove completion
    } else {
      completedDates.push(date); // add completion
    }

    const streaks = calculateStreaks(completedDates);
    const nowStr = new Date().toISOString();
    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streakCount: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      updatedAt: nowStr,
    };

    await dbService.put(STORES.HABITS, updatedHabit);
    await get().addXp(index === -1 ? 15 : -15);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));

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
    const tasksDue = get().tasks.filter(t => t.dueDate === date);
    const completedTasks = tasksDue.filter(t => t.isCompleted);
    
    // For habits, they don't have a due date in task sense, but we check completions on this date
    const completedHabitsCount = get().habits.filter(h => h.completedDates.includes(date)).length;
    
    const totalTasksCount = tasksDue.length;
    const completedTasksCount = completedTasks.length;
    
    // Calculate focus score
    // 50% tasks weight, 50% habits weight
    // If no tasks are due, 100% habits weight. If no habits exist, 100% tasks weight.
    // If neither, 0 focus score.
    const activeHabitsCount = get().habits.length;

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
    const note = get().notes.find(n => n.id === date);
    const nowStr = new Date().toISOString();

    if (note) {
      const updatedNote: Note = {
        ...note,
        content,
        title,
        updatedAt: nowStr,
      };
      await dbService.put(STORES.NOTES, updatedNote);
      set(state => ({
        notes: state.notes.map(n => n.id === date ? updatedNote : n)
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
        notes: [...state.notes, newNote]
      }));
      await get().addXp(40);
    }
  },

  deleteNote: async (date) => {
    await dbService.delete(STORES.NOTES, date);
    set(state => ({
      notes: state.notes.filter(n => n.id !== date)
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
    const updatedSettings = {
      ...get().settings,
      ...updates,
    };
    settingsStorage.set(updatedSettings);
    set({ settings: updatedSettings });
    get().checkAndUnlockBadges();
  },

  // Gamification Actions
  addXp: async (amount: number) => {
    let currentXp = get().xp + amount;
    let currentLevel = get().level;
    let xpNeeded = currentLevel * 100;

    let leveledUp = false;
    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      currentLevel++;
      xpNeeded = currentLevel * 100;
      leveledUp = true;
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
    const toUnlock: string[] = [];
    const resetTime = settings.badgesResetTimestamp ? new Date(settings.badgesResetTimestamp).getTime() : 0;

    const isAfterReset = (dateStr?: string) => {
      if (!dateStr) return false;
      return new Date(dateStr).getTime() >= resetTime;
    };

    // 1. First Spark
    const newCompletedTasks = tasks.filter(t => t.isCompleted && isAfterReset(t.completedAt || t.updatedAt));
    if (newCompletedTasks.length > 0 && !unlockedBadges.includes('badge-first-task')) {
      toUnlock.push('badge-first-task');
    }

    // 2. Atomic Habitual
    const hasNewHabitCheck = habits.some(h => h.completedDates.some(d => new Date(d).getTime() >= resetTime));
    if (hasNewHabitCheck && !unlockedBadges.includes('badge-first-habit')) {
      toUnlock.push('badge-first-habit');
    }

    // 3. Consistency Kick
    if (habits.some(h => h.streakCount >= 3 && h.completedDates.some(d => new Date(d).getTime() >= resetTime)) && !unlockedBadges.includes('badge-streak-3')) {
      toUnlock.push('badge-streak-3');
    }

    // 4. Weekly Protocol
    if (habits.some(h => h.streakCount >= 7 && h.completedDates.some(d => new Date(d).getTime() >= resetTime)) && !unlockedBadges.includes('badge-streak-7')) {
      toUnlock.push('badge-streak-7');
    }

    // 4.5. Monthly Core
    if (habits.some(h => h.streakCount >= 30 && h.completedDates.some(d => new Date(d).getTime() >= resetTime)) && !unlockedBadges.includes('badge-streak-30')) {
      toUnlock.push('badge-streak-30');
    }

    // 5. Deep Harmony
    if (dailyLogs.some(l => l.focusScore === 100 && isAfterReset(l.id)) && !unlockedBadges.includes('badge-perfect-day')) {
      toUnlock.push('badge-perfect-day');
    }

    // 6. Mindful Mind
    if (notes.some(n => isAfterReset(n.createdAt || n.updatedAt)) && !unlockedBadges.includes('badge-first-note')) {
      toUnlock.push('badge-first-note');
    }

    // 7. Quarterly Legend
    if (habits.some(h => h.streakCount >= 90 && h.completedDates.some(d => new Date(d).getTime() >= resetTime)) && !unlockedBadges.includes('badge-streak-90')) {
      toUnlock.push('badge-streak-90');
    }

    // 9. Completionist 100
    if (newCompletedTasks.length >= 100 && !unlockedBadges.includes('badge-completionist-100')) {
      toUnlock.push('badge-completionist-100');
    }

    // 8. Wealth Master
    try {
      const savedMoney = localStorage.getItem('shadow_money_data_v3');
      if (savedMoney) {
        const moneyData = JSON.parse(savedMoney);
        const savings = moneyData.stats?.savings ?? 0;
        const totalInvestments = (moneyData.stats?.investments ?? []).reduce((acc: number, item: any) => acc + item.amount, 0);
        
        const targetSavings = settings.savingsTarget ?? 0;
        const targetInvestments = settings.investmentsTarget ?? 0;
        
        if (targetSavings > 0 && targetInvestments > 0 && savings >= targetSavings && totalInvestments >= targetInvestments && !unlockedBadges.includes('badge-wealth-master')) {
          toUnlock.push('badge-wealth-master');
        }
      }
    } catch (e) {}

    if (toUnlock.length > 0) {
      const nextBadges = [...unlockedBadges, ...toUnlock];
      set({ unlockedBadges: nextBadges });
      const updatedSettings = {
        ...settings,
        unlockedBadges: nextBadges
      };
      settingsStorage.set(updatedSettings);
      set({ settings: updatedSettings });

      if (typeof window !== 'undefined') {
        toUnlock.forEach((bId, idx) => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('badgeUnlocked', { detail: bId }));
          }, idx * 1000);
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

    // 1. First Spark
    if (tasks.filter(t => t.isCompleted).length >= 1) earned.push('badge-first-task');
    
    // 2. Atomic Habitual
    if (habits.some(h => h.completedDates.length > 0)) earned.push('badge-first-habit');
    
    // 3. Consistency Kick
    if (habits.some(h => h.streakCount >= 3)) earned.push('badge-streak-3');
    
    // 4. Weekly Protocol
    if (habits.some(h => h.streakCount >= 7)) earned.push('badge-streak-7');
    
    // 4.5. Monthly Core
    if (habits.some(h => h.streakCount >= 30)) earned.push('badge-streak-30');
    
    // 5. Deep Harmony
    if (dailyLogs.some(l => l.focusScore === 100)) earned.push('badge-perfect-day');
    
    // 6. Mindful Mind
    if (notes.length > 0) earned.push('badge-first-note');
    
    // 7. Quarterly Legend
    if (habits.some(h => h.streakCount >= 90)) earned.push('badge-streak-90');
    
    // 9. Completionist 100
    if (tasks.filter(t => t.isCompleted).length >= 100) earned.push('badge-completionist-100');
    
    // 10. Wealth Master
    const settings = get().settings;
    try {
      const savedMoney = localStorage.getItem('shadow_money_data_v3');
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
