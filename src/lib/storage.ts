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

    return {
      version: '1.0.0',
      tasks,
      habits,
      dailyLogs,
      notes,
      reminders,
      categories,
      settings,
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
    
    const importStore = <T>(storeName: StoreName, items: T[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.clear();
        
        for (const item of items) {
          store.put(item);
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    };

    await importStore(STORES.TASKS, data.tasks);
    await importStore(STORES.HABITS, data.habits);
    await importStore(STORES.DAILY_LOGS, data.dailyLogs || []);
    await importStore(STORES.NOTES, data.notes || []);
    await importStore(STORES.REMINDERS, data.reminders || []);
    await importStore(STORES.CATEGORIES, data.categories || []);
  }
};

// Settings are stored in localStorage for easier synchronous retrieval during initialization
const SETTINGS_KEY = 'shadow_tracker_settings';
const DEFAULT_SETTINGS: Settings = {
  theme: 'onedark',
  backupReminderDays: 7,
  soundEnabled: false,
  showCompletedTasks: true,
  isCompletedOnboarding: false,
  xp: 0,
  level: 1,
  unlockedBadges: [],
};

export const settingsStorage = {
  get(): Settings {
    if (!isBrowser) return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
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
