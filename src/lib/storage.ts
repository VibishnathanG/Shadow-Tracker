import { Task, Habit, DailyLog, Note, Reminder, Category, Settings, BackupData } from '@/types';

const DB_NAME = 'shadow_tracker_db';
const DB_VERSION = 1;

export const STORES = {
  TASKS: 'tasks',
  HABITS: 'habits',
  DAILY_LOGS: 'daily_logs',
  NOTES: 'notes',
  REMINDERS: 'reminders',
  CATEGORIES: 'categories',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

// SSR-safe check
const isBrowser = typeof window !== 'undefined';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('IndexedDB is only available in browser environments.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        dbPromise = null; // Clear cache on error so we can retry
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.HABITS)) {
          db.createObjectStore(STORES.HABITS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.DAILY_LOGS)) {
          db.createObjectStore(STORES.DAILY_LOGS, { keyPath: 'id' }); // id is YYYY-MM-DD
        }
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          db.createObjectStore(STORES.NOTES, { keyPath: 'id' }); // id is YYYY-MM-DD
        }
        if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
          db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
      };
    } catch (e) {
      dbPromise = null;
      reject(e);
    }
  });

  return dbPromise;
}

export const dbService = {
  async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    if (!isBrowser) return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    if (!isBrowser) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: StoreName, value: T): Promise<void> {
    if (!isBrowser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: StoreName, id: string): Promise<void> {
    if (!isBrowser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName: StoreName): Promise<void> {
    if (!isBrowser) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async exportAllData(settings: Settings): Promise<BackupData> {
    const tasks = await this.getAll<Task>(STORES.TASKS);
    const habits = await this.getAll<Habit>(STORES.HABITS);
    const dailyLogs = await this.getAll<DailyLog>(STORES.DAILY_LOGS);
    const notes = await this.getAll<Note>(STORES.NOTES);
    const reminders = await this.getAll<Reminder>(STORES.REMINDERS);
    const categories = await this.getAll<Category>(STORES.CATEGORIES);

    let moneyData = null;
    let healthData = null;
    let rpgQuests = null;
    let wizardScrolls = null;
    let wispCustomLines: string[] = [];
    let unlockedBadges: string[] = [];
    let aiCustomPrompts = null;
    let aiCustomTools = null;

    if (isBrowser) {
      try {
        // 1. Money Data (v4 + v3 unified)
        const savedMoneyV4Expenses = localStorage.getItem('shadow_money_expenses_v4');
        const savedMoneyV4Months = localStorage.getItem('shadow_money_months_v4');
        const savedMoneyV3 = localStorage.getItem('shadow_money_data_v3');
        const savedSubPresets = localStorage.getItem('shadow_custom_sub_presets_v1');
        const savedInvPresets = localStorage.getItem('shadow_custom_investment_presets_v1');
        const savedBigExpensePresets = localStorage.getItem('shadow_custom_big_expense_presets_v1');
        if (savedMoneyV4Expenses || savedMoneyV4Months || savedSubPresets || savedInvPresets || savedBigExpensePresets) {
          moneyData = {
            expenses: savedMoneyV4Expenses ? JSON.parse(savedMoneyV4Expenses) : [],
            monthlyDataMap: savedMoneyV4Months ? JSON.parse(savedMoneyV4Months) : {},
            customSubscriptionPresets: savedSubPresets ? JSON.parse(savedSubPresets) : (settings?.customSubscriptionPresets || []),
            customInvestmentPresets: savedInvPresets ? JSON.parse(savedInvPresets) : (settings?.customInvestmentPresets || []),
            customBigExpensePresets: savedBigExpensePresets ? JSON.parse(savedBigExpensePresets) : (settings?.customBigExpensePresets || []),
            ...(savedMoneyV3 ? JSON.parse(savedMoneyV3) : {})
          };
        } else if (savedMoneyV3) {
          moneyData = JSON.parse(savedMoneyV3);
        }

        // 2. Health & Vitality Suite
        const savedHealthLogs = localStorage.getItem('shadow_health_data_v2') || localStorage.getItem('shadow_health_data_v1');
        const savedCustomWorkouts = localStorage.getItem('shadow_custom_workout_plans_v1');
        const savedTodayExercises = localStorage.getItem('shadow_logged_exercises_today');
        const savedCustomFoods = localStorage.getItem('shadow_custom_foods_v1');
        const savedFoodSuggestions = localStorage.getItem('shadow_quick_food_suggestions_v1');
        const savedBiometrics = localStorage.getItem('shadow_user_biometrics_v1');
        const savedCustomDiets = localStorage.getItem('shadow_custom_diet_plans_v1');

        if (savedHealthLogs || savedCustomWorkouts || savedCustomDiets || savedBiometrics || savedCustomFoods) {
          healthData = {
            dailyLogs: savedHealthLogs ? JSON.parse(savedHealthLogs) : {},
            customWorkouts: savedCustomWorkouts ? JSON.parse(savedCustomWorkouts) : [],
            todayExercises: savedTodayExercises ? JSON.parse(savedTodayExercises) : [],
            customFoods: savedCustomFoods ? JSON.parse(savedCustomFoods) : [],
            quickSuggestions: savedFoodSuggestions ? JSON.parse(savedFoodSuggestions) : [],
            biometrics: savedBiometrics ? JSON.parse(savedBiometrics) : null,
            customDiets: savedCustomDiets ? JSON.parse(savedCustomDiets) : [],
          };
        }

        // 3. Standalone ToDos are strictly 100% local-first and intentionally omitted from cloud sync

        // 4. RPG Quests
        const savedQuests = localStorage.getItem('shadow_rpg_quests_v2') || localStorage.getItem('shadow_life_rpg_quests_v1');
        if (savedQuests) rpgQuests = JSON.parse(savedQuests);

        // 5. Wizard Scrolls
        const savedScrolls = localStorage.getItem('shadow_wizard_quotes_v1');
        if (savedScrolls) wizardScrolls = JSON.parse(savedScrolls);

        // 6. Badges
        const savedBadges = localStorage.getItem('shadow_unlocked_badges');
        if (savedBadges) unlockedBadges = JSON.parse(savedBadges);

        // 7. Wisp Custom Lines
        const savedWispLines = localStorage.getItem('shadow_wisp_custom_lines_v1');
        if (savedWispLines) wispCustomLines = JSON.parse(savedWispLines);

        // 8. AI Custom Prompts & Custom Tools
        const savedAiPrompts = localStorage.getItem('shadow_ai_custom_prompts_v1');
        if (savedAiPrompts) aiCustomPrompts = JSON.parse(savedAiPrompts);
        const savedAiTools = localStorage.getItem('shadow_ai_custom_tools_v1');
        if (savedAiTools) aiCustomTools = JSON.parse(savedAiTools);
      } catch (e) {
        console.error('Error reading localStorage data for export:', e);
      }
    }

    const safeSettings = settings ? { ...settings } : ({} as Settings);
    delete safeSettings.githubPat;
    delete (safeSettings as any).oneDriveAccessToken;
    delete (safeSettings as any).oneDriveRefreshToken;

    return {
      version: '1.0.0',
      tasks,
      habits,
      dailyLogs,
      notes,
      reminders,
      categories,
      settings: safeSettings,
      moneyData,
      healthData,
      rpgQuests,
      wizardScrolls,
      wispCustomLines,
      unlockedBadges,
      aiCustomPrompts,
      aiCustomTools,
      exportedAt: new Date().toISOString(),
    };
  },

  async importAllData(data: BackupData): Promise<void> {
    if (!isBrowser) return;
    
    // Validate backup data slightly
    if (!data.version || !Array.isArray(data.tasks) || !Array.isArray(data.habits)) {
      throw new Error('Invalid backup file structure.');
    }

    const db = await openDB();
    const isYearArchive = !!data.archiveYear;
    
    const CHUNK_SIZE = 500;
    const importStore = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
      if (!isYearArchive) {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          store.clear();
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }

      if (!items || items.length === 0) return;

      // Ingest in chunks of 500 items and yield to event loop to support 10MB+ files seamlessly
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          for (const item of chunk) {
            store.put(item);
          }
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });

        // Yield to keep UI responsive and prevent browser lockup on massive datasets
        await new Promise((r) => setTimeout(r, 0));
      }
    };

    await importStore(STORES.TASKS, data.tasks);
    await importStore(STORES.HABITS, data.habits);
    await importStore(STORES.DAILY_LOGS, data.dailyLogs || []);
    await importStore(STORES.NOTES, data.notes || []);
    await importStore(STORES.REMINDERS, data.reminders || []);
    await importStore(STORES.CATEGORIES, data.categories || []);

    if (data.moneyData) {
      if (isYearArchive) {
        try {
          const savedMoney = localStorage.getItem('shadow_money_data_v3');
          const existingMoney = savedMoney ? JSON.parse(savedMoney) : { expenses: [], stats: {} };
          const existingExpenses = existingMoney.expenses || [];
          const importedExpenses = data.moneyData.expenses || [];
          const mergedExpMap = new Map(existingExpenses.map((e: any) => [e.id, e]));
          importedExpenses.forEach((e: any) => mergedExpMap.set(e.id, e));

          existingMoney.expenses = Array.from(mergedExpMap.values());
          localStorage.setItem('shadow_money_data_v3', JSON.stringify(existingMoney));
          localStorage.setItem('shadow_money_expenses_v4', JSON.stringify(existingMoney.expenses));
        } catch (e) {}
      } else {
        if (data.moneyData.expenses) {
          localStorage.setItem('shadow_money_expenses_v4', JSON.stringify(data.moneyData.expenses));
        }
        if (data.moneyData.monthlyDataMap) {
          localStorage.setItem('shadow_money_months_v4', JSON.stringify(data.moneyData.monthlyDataMap));
        }
        if (data.moneyData.customSubscriptionPresets) {
          localStorage.setItem('shadow_custom_sub_presets_v1', JSON.stringify(data.moneyData.customSubscriptionPresets));
        }
        if (data.moneyData.customInvestmentPresets) {
          localStorage.setItem('shadow_custom_investment_presets_v1', JSON.stringify(data.moneyData.customInvestmentPresets));
        }
        if (data.moneyData.customBigExpensePresets) {
          localStorage.setItem('shadow_custom_big_expense_presets_v1', JSON.stringify(data.moneyData.customBigExpensePresets));
        }
        localStorage.setItem('shadow_money_data_v3', JSON.stringify(data.moneyData));
      }
    }

    if (data.settings) {
      if (data.settings.customSubscriptionPresets) {
        localStorage.setItem('shadow_custom_sub_presets_v1', JSON.stringify(data.settings.customSubscriptionPresets));
      }
      if (data.settings.customInvestmentPresets) {
        localStorage.setItem('shadow_custom_investment_presets_v1', JSON.stringify(data.settings.customInvestmentPresets));
      }
      if (data.settings.customBigExpensePresets) {
        localStorage.setItem('shadow_custom_big_expense_presets_v1', JSON.stringify(data.settings.customBigExpensePresets));
      }
    }

    if (data.healthData) {
      try {
        if (data.healthData.dailyLogs) {
          localStorage.setItem('shadow_health_data_v2', JSON.stringify(data.healthData.dailyLogs));
        }
        if (data.healthData.customWorkouts) {
          localStorage.setItem('shadow_custom_workout_plans_v1', JSON.stringify(data.healthData.customWorkouts));
        }
        if (data.healthData.todayExercises) {
          localStorage.setItem('shadow_logged_exercises_today', JSON.stringify(data.healthData.todayExercises));
        }
        if (data.healthData.customFoods) {
          localStorage.setItem('shadow_custom_foods_v1', JSON.stringify(data.healthData.customFoods));
        }
        if (data.healthData.quickSuggestions) {
          localStorage.setItem('shadow_quick_food_suggestions_v1', JSON.stringify(data.healthData.quickSuggestions));
        }
        if (data.healthData.biometrics) {
          localStorage.setItem('shadow_user_biometrics_v1', JSON.stringify(data.healthData.biometrics));
        }
        if (data.healthData.customDiets) {
          localStorage.setItem('shadow_custom_diet_plans_v1', JSON.stringify(data.healthData.customDiets));
        }
      } catch (e) {
        console.error('Error restoring healthData:', e);
      }
    }

    // Standalone ToDos are strictly local-first and are NEVER overwritten or restored by sync/backup imports

    if (data.rpgQuests && Array.isArray(data.rpgQuests)) {
      try {
        localStorage.setItem('shadow_rpg_quests_v2', JSON.stringify(data.rpgQuests));
        localStorage.setItem('shadow_life_rpg_quests_v1', JSON.stringify(data.rpgQuests));
      } catch (e) {
        console.error('Error restoring rpgQuests:', e);
      }
    }

    if (data.wizardScrolls && Array.isArray(data.wizardScrolls)) {
      try {
        localStorage.setItem('shadow_wizard_quotes_v1', JSON.stringify(data.wizardScrolls));
      } catch (e) {
        console.error('Error restoring wizardScrolls:', e);
      }
    }

    if (data.wispCustomLines && Array.isArray(data.wispCustomLines)) {
      try {
        localStorage.setItem('shadow_wisp_custom_lines_v1', JSON.stringify(data.wispCustomLines));
      } catch (e) {
        console.error('Error restoring wispCustomLines:', e);
      }
    }

    if (data.unlockedBadges && Array.isArray(data.unlockedBadges)) {
      if (isYearArchive) {
        try {
          const savedBadges = localStorage.getItem('shadow_unlocked_badges');
          const existingBadges: string[] = savedBadges ? JSON.parse(savedBadges) : [];
          const mergedBadges = Array.from(new Set([...existingBadges, ...data.unlockedBadges]));
          localStorage.setItem('shadow_unlocked_badges', JSON.stringify(mergedBadges));
        } catch (e) {}
      } else {
        localStorage.setItem('shadow_unlocked_badges', JSON.stringify(data.unlockedBadges));
      }
    }

    if (data.aiCustomPrompts && Array.isArray(data.aiCustomPrompts)) {
      try {
        localStorage.setItem('shadow_ai_custom_prompts_v1', JSON.stringify(data.aiCustomPrompts));
        window.dispatchEvent(new CustomEvent('shadow_ai_prompts_updated'));
      } catch (e) {
        console.error('Error restoring aiCustomPrompts:', e);
      }
    }

    if (data.aiCustomTools && Array.isArray(data.aiCustomTools)) {
      try {
        localStorage.setItem('shadow_ai_custom_tools_v1', JSON.stringify(data.aiCustomTools));
        window.dispatchEvent(new CustomEvent('shadow_ai_tools_updated'));
      } catch (e) {
        console.error('Error restoring aiCustomTools:', e);
      }
    }
  },

  async getAvailableYears(): Promise<string[]> {
    const tasks = await this.getAll<Task>(STORES.TASKS);
    const habits = await this.getAll<Habit>(STORES.HABITS);
    const dailyLogs = await this.getAll<DailyLog>(STORES.DAILY_LOGS);
    const notes = await this.getAll<Note>(STORES.NOTES);

    const yearsSet = new Set<string>();

    const extractYear = (dateStr?: string) => {
      if (!dateStr) return;
      const yr = dateStr.substring(0, 4);
      if (/^\d{4}$/.test(yr)) {
        yearsSet.add(yr);
      }
    };

    tasks.forEach(t => {
      extractYear(t.createdAt);
      extractYear(t.completedAt);
      extractYear(t.dueDate);
    });

    habits.forEach(h => {
      extractYear(h.createdAt);
      h.completedDates?.forEach(d => extractYear(d));
    });

    dailyLogs.forEach(d => extractYear(d.date));
    notes.forEach(n => {
      extractYear(n.createdAt);
      extractYear(n.date);
    });

    if (isBrowser) {
      try {
        const savedMoney = localStorage.getItem('shadow_money_data_v3');
        if (savedMoney) {
          const money = JSON.parse(savedMoney);
          money.expenses?.forEach((e: any) => extractYear(e.date));
        }
      } catch (e) {}
    }

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  },

  async exportYearData(year: string, settings: Settings): Promise<BackupData> {
    const allTasks = await this.getAll<Task>(STORES.TASKS);
    const allHabits = await this.getAll<Habit>(STORES.HABITS);
    const allDailyLogs = await this.getAll<DailyLog>(STORES.DAILY_LOGS);
    const allNotes = await this.getAll<Note>(STORES.NOTES);
    const reminders = await this.getAll<Reminder>(STORES.REMINDERS);
    const categories = await this.getAll<Category>(STORES.CATEGORIES);

    const yearTasks = allTasks.filter(t => (t.completedAt && t.completedAt.startsWith(year)) || t.createdAt.startsWith(year) || t.dueDate?.startsWith(year));
    const yearDailyLogs = allDailyLogs.filter(d => d.date.startsWith(year));
    const yearNotes = allNotes.filter(n => n.date?.startsWith(year) || n.createdAt.startsWith(year));

    const yearHabits = allHabits.map(h => ({
      ...h,
      completedDates: (h.completedDates || []).filter(d => d.startsWith(year))
    })).filter(h => h.completedDates.length > 0 || h.createdAt.startsWith(year));

    let yearMoneyData = null;
    let unlockedBadges: string[] = [];

    if (isBrowser) {
      try {
        const savedMoney = localStorage.getItem('shadow_money_data_v3');
        if (savedMoney) {
          const money = JSON.parse(savedMoney);
          yearMoneyData = {
            ...money,
            expenses: (money.expenses || []).filter((e: any) => e.date && e.date.startsWith(year))
          };
        }

        const savedBadges = localStorage.getItem('shadow_unlocked_badges');
        if (savedBadges) unlockedBadges = JSON.parse(savedBadges);
      } catch (e) {}
    }

    return {
      version: '1.0.0',
      archiveYear: year,
      tasks: yearTasks,
      habits: yearHabits,
      dailyLogs: yearDailyLogs,
      notes: yearNotes,
      reminders,
      categories,
      settings,
      moneyData: yearMoneyData,
      unlockedBadges,
      exportedAt: new Date().toISOString(),
    };
  },

  async purgeYearData(year: string, settings: Settings): Promise<{ archiveBackup: BackupData; purgedCount: number }> {
    if (!isBrowser) throw new Error('Purge available only in browser environment');

    // 1. MANDATORY AUTOMATIC EXPORT BEFORE PURGING!
    const archiveBackup = await this.exportYearData(year, settings);

    const db = await openDB();
    let purgedCount = 0;

    // Purge Tasks for year
    const tasks = await this.getAll<Task>(STORES.TASKS);
    const tasksToKeep = tasks.filter(t => {
      const isThisYear = (t.completedAt && t.completedAt.startsWith(year)) ||
                         (t.createdAt && t.createdAt.startsWith(year)) ||
                         (t.dueDate && t.dueDate.startsWith(year));
      return !isThisYear;
    });
    purgedCount += (tasks.length - tasksToKeep.length);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      store.clear();
      tasksToKeep.forEach(t => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Purge Daily Logs for year
    const dailyLogs = await this.getAll<DailyLog>(STORES.DAILY_LOGS);
    const logsToKeep = dailyLogs.filter(d => !d.date.startsWith(year));
    purgedCount += (dailyLogs.length - logsToKeep.length);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_LOGS, 'readwrite');
      const store = tx.objectStore(STORES.DAILY_LOGS);
      store.clear();
      logsToKeep.forEach(l => store.put(l));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Purge Notes for year
    const notes = await this.getAll<Note>(STORES.NOTES);
    const notesToKeep = notes.filter(n => !((n.date && n.date.startsWith(year)) || (n.createdAt && n.createdAt.startsWith(year))));
    purgedCount += (notes.length - notesToKeep.length);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES, 'readwrite');
      const store = tx.objectStore(STORES.NOTES);
      store.clear();
      notesToKeep.forEach(n => store.put(n));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Purge completed dates for Habits for year
    const habits = await this.getAll<Habit>(STORES.HABITS);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.HABITS, 'readwrite');
      const store = tx.objectStore(STORES.HABITS);
      habits.forEach(h => {
        const origCount = h.completedDates?.length || 0;
        h.completedDates = (h.completedDates || []).filter(d => !d.startsWith(year));
        purgedCount += (origCount - h.completedDates.length);
        store.put(h);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Purge Money Expenses for year
    try {
      const savedMoney = localStorage.getItem('shadow_money_data_v3');
      if (savedMoney) {
        const money = JSON.parse(savedMoney);
        const origExpCount = money.expenses?.length || 0;
        money.expenses = (money.expenses || []).filter((e: any) => !(e.date && e.date.startsWith(year)));
        purgedCount += (origExpCount - money.expenses.length);
        localStorage.setItem('shadow_money_data_v3', JSON.stringify(money));
      }
    } catch (e) {}

    return { archiveBackup, purgedCount };
  }
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isCapacitor = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
  const isMobileUa = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTouchNarrow = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 820;
  return isCapacitor || isMobileUa || isTouchNarrow;
};

// Settings are stored in localStorage for easier synchronous retrieval during initialization
const SETTINGS_KEY = 'shadow_tracker_settings';
const DEFAULT_SETTINGS: Settings = {
  theme: 'spectrum',
  backupReminderDays: 7,
  soundEnabled: true,
  stickyTaskNotifications: true,
  showCompletedTasks: true,
  isCompletedOnboarding: false,
  xp: 0,
  level: 1,
  unlockedBadges: [],
  githubSyncOnLaunch: true,
  ecoMode: false,
  minimizeToTray: true,
  habitGracePeriodDays: 3,
  alias: 'Shadow',
  taskAssignees: ['Shadow', 'Core Lead', 'Operator'],
  defaultAssignee: 'Shadow',
};

export const settingsStorage = {
  get(): Settings {
    if (!isBrowser) return DEFAULT_SETTINGS;
    const isMobile = isMobileDevice();
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasExplicitEco = typeof parsed.ecoMode === 'boolean';
        const finalEco = hasExplicitEco ? parsed.ecoMode : (isMobile ? true : false);
        let rawAlias = typeof parsed.alias === 'string' ? parsed.alias.trim() : '';
        if (!rawAlias || rawAlias === 'Shadow Legend') {
          rawAlias = 'Shadow';
        }
        const finalAlias = rawAlias.slice(0, 10);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          alias: finalAlias,
          ecoMode: finalEco,
          lowGpuMode: typeof parsed.lowGpuMode === 'boolean' ? parsed.lowGpuMode : finalEco,
          taskAssignees: Array.isArray(parsed.taskAssignees) && parsed.taskAssignees.length > 0 ? parsed.taskAssignees : DEFAULT_SETTINGS.taskAssignees,
          defaultAssignee: parsed.defaultAssignee || DEFAULT_SETTINGS.defaultAssignee,
          customSubscriptionPresets: parsed.customSubscriptionPresets,
          customInvestmentPresets: parsed.customInvestmentPresets,
          customBigExpensePresets: parsed.customBigExpensePresets,
        };
      } else {
        return {
          ...DEFAULT_SETTINGS,
          alias: 'Shadow',
          ecoMode: isMobile,
          lowGpuMode: isMobile,
          taskAssignees: DEFAULT_SETTINGS.taskAssignees,
          defaultAssignee: DEFAULT_SETTINGS.defaultAssignee,
        };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage:', e);
    }
    return {
      ...DEFAULT_SETTINGS,
      ecoMode: isMobile,
      lowGpuMode: isMobile,
    };
  },

  set(settings: Settings): void {
    if (!isBrowser) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error writing settings to localStorage:', e);
    }
  }
};
