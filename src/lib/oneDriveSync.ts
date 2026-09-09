/**
 * OneDrive / Local File Sync
 *
 * Strategy:
 * - Desktop (Windows/Mac): Use File System Access API (showSaveFilePicker / showOpenFilePicker)
 *   to let the user pick a JSON file once (ideally in their OneDrive/Documents folder).
 *   A FileSystemFileHandle is stored in IndexedDB so it persists across app restarts.
 * - Android (Capacitor): Use localStorage-based sync as the File System Access API
 *   is not available in Android WebViews. Data is stored in localStorage and can be
 *   manually exported/imported via the settings panel.
 *
 * Works on: Windows (.exe Tauri via WebView2), Android (Capacitor APK), Desktop PWA
 */

import { BackupData, Task, Habit, DailyLog, Note, Category } from '@/types';
import { calculateStreaks } from '@/lib/dateUtils';
import { dbService } from '@/lib/storage';

const HANDLE_STORE_KEY = 'shadow_onedrive_file_handle';
const IDB_DB_NAME = 'shadow_file_sync';
const IDB_STORE = 'handles';
const ANDROID_SYNC_KEY = 'shadow_onedrive_sync_data';
const ANDROID_SYNC_FILE_KEY = 'shadow_onedrive_sync_filename';

// ---------- Platform detection ----------

function isAndroidCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isCapacitor = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
  return isAndroid || isCapacitor;
}

function hasFileSystemAccessAPI(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window
  );
}

// ---------- IndexedDB handle persistence (Desktop only) ----------

async function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToDB(handle: FileSystemFileHandle): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, HANDLE_STORE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandleFromDB(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(HANDLE_STORE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function clearHandleFromDB(): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(HANDLE_STORE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ---------- File System Access API check ----------

/**
 * Returns true if file sync is supported on this platform.
 * Desktop: File System Access API available
 * Android: Always supported via localStorage fallback
 */
export function isFileSyncSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // Android always supported via localStorage fallback
  if (isAndroidCapacitor()) return true;
  // Desktop: check for File System Access API
  return hasFileSystemAccessAPI();
}

// ---------- Permission re-verification (Desktop only) ----------

async function verifyPermission(handle: FileSystemFileHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
  try {
    const opts = { mode };
    if ((await (handle as any).queryPermission(opts)) === 'granted') return true;
    if ((await (handle as any).requestPermission(opts)) === 'granted') return true;
    return false;
  } catch {
    return false;
  }
}

// ---------- Public API ----------

/**
 * Create a new sync file (Create & Start Sync).
 * Desktop: Opens native save file picker for OneDrive/Documents and initializes data.
 * Android: Prompts filename or sets up local storage handle.
 */
export async function createNewSyncFile(initialData?: object): Promise<string | null> {
  if (!isFileSyncSupported()) return null;

  if (isAndroidCapacitor()) {
    const fileName = 'shadow-tracker-sync.json';
    localStorage.setItem(ANDROID_SYNC_FILE_KEY, fileName);
    if (initialData) {
      localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(initialData));
    }
    return fileName;
  }

  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'shadow-tracker-sync.json',
      types: [{ description: 'Shadow Tracker Sync File', accept: { 'application/json': ['.json'] } }],
      startIn: 'documents',
    });
    await saveHandleToDB(handle);

    if (initialData) {
      const writable = await (handle as any).createWritable();
      await writable.write(JSON.stringify(initialData, null, 2));
      await writable.close();
    }

    return handle.name as string;
  } catch (err: any) {
    if (err?.name === 'AbortError') return null;
    throw err;
  }
}

/**
 * Pick an existing sync file (Link & Import Sync).
 * Desktop: Opens native open file picker for existing sync file, reads & links it.
 * Android: Prompts HTML5 file picker to select existing sync file.
 */
export async function pickExistingSyncFile(): Promise<{ fileName: string; data: any } | null> {
  if (!isFileSyncSupported()) return null;

  if (isAndroidCapacitor()) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          localStorage.setItem(ANDROID_SYNC_FILE_KEY, file.name || 'shadow-tracker-sync.json');
          localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(parsed));
          resolve({ fileName: file.name || 'shadow-tracker-sync.json', data: parsed });
        } catch (err) {
          console.warn('[OneDriveSync] Mobile file read error:', err);
          resolve(null);
        }
      };
      input.onerror = () => resolve(null);
      input.click();
    });
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'Shadow Tracker Sync File', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    if (!handle) return null;

    const hasPermission = await verifyPermission(handle, 'readwrite');
    if (!hasPermission) return null;

    await saveHandleToDB(handle);

    const file: File = await (handle as any).getFile();
    const text = await file.text();
    const parsedData = JSON.parse(text);

    return { fileName: handle.name as string, data: parsedData };
  } catch (err: any) {
    if (err?.name === 'AbortError') return null;
    console.warn('[OneDriveSync] Pick existing file failed:', err);
    return null;
  }
}

/**
 * Legacy wrapper: Let the user pick a new sync file.
 */
export async function pickSyncFile(): Promise<string | null> {
  return createNewSyncFile();
}

/**
 * Get the currently configured sync file name (if any).
 */
export async function getSyncFileName(): Promise<string | null> {
  if (isAndroidCapacitor()) {
    try {
      return localStorage.getItem(ANDROID_SYNC_FILE_KEY) || null;
    } catch {
      return null;
    }
  }
  try {
    const handle = await loadHandleFromDB();
    return handle?.name || null;
  } catch {
    return null;
  }
}

/**
 * Write data to the configured sync file.
 * Desktop: Writes to the native file system handle.
 * Android: Writes to localStorage and prepares downloadable blob.
 * Silently no-ops if no file is configured.
 */
export async function syncToFile(data: object): Promise<void> {
  if (isAndroidCapacitor()) {
    try {
      const fileName = localStorage.getItem(ANDROID_SYNC_FILE_KEY) || 'shadow-tracker-sync.json';
      const jsonStr = JSON.stringify(data, null, 2);
      localStorage.setItem(ANDROID_SYNC_KEY, jsonStr);

      // Write directly to Android Documents / Storage via Capacitor Filesystem
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: fileName,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } catch (fsErr) {
        console.warn('[OneDriveSync] Native Filesystem write fallback:', fsErr);
      }
    } catch (err) {
      console.warn('[OneDriveSync] Android write failed:', err);
    }
    return;
  }

  try {
    const handle = await loadHandleFromDB();
    if (!handle) return;

    const hasPermission = await verifyPermission(handle, 'readwrite');
    if (!hasPermission) return;

    const writable = await (handle as any).createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (err) {
    console.warn('[OneDriveSync] Write failed:', err);
  }
}

/**
 * Read data from the configured sync file.
 * Desktop: Reads from the native file system handle.
 * Android: Reads from localStorage or prompts file selector.
 * Returns null if no file is configured or reading fails.
 */
export async function readFromFile(): Promise<any | null> {
  if (isAndroidCapacitor()) {
    try {
      const fileName = localStorage.getItem(ANDROID_SYNC_FILE_KEY) || 'shadow-tracker-sync.json';
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const res = await Filesystem.readFile({
          path: fileName,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        if (res.data) {
          const parsed = JSON.parse(res.data as string);
          localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(parsed));
          return parsed;
        }
      } catch (fsErr) {}

      const raw = localStorage.getItem(ANDROID_SYNC_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('[OneDriveSync] Android read failed:', err);
    }
  }

  try {
    const handle = await loadHandleFromDB();
    if (!handle) return null;

    const hasPermission = await verifyPermission(handle, 'read');
    if (!hasPermission) return null;

    const file: File = await (handle as any).getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (err) {
    console.warn('[OneDriveSync] Read failed:', err);
    return null;
  }
}

/**
 * Remove the saved file handle (disconnect sync).
 */
export async function disconnectSyncFile(): Promise<void> {
  if (isAndroidCapacitor()) {
    try {
      localStorage.removeItem(ANDROID_SYNC_FILE_KEY);
      localStorage.removeItem(ANDROID_SYNC_KEY);
    } catch {}
    return;
  }
  await clearHandleFromDB();
}

/**
 * Merge local and remote BackupData datasets bidirectionally.
 */
export function mergeBackupDatasets(local: BackupData, remote: BackupData): BackupData {
  if (!remote || !Array.isArray(remote.tasks)) return local;
  if (!local || !Array.isArray(local.tasks)) return remote;

  const taskMap = new Map<string, Task>();
  (local.tasks || []).forEach(t => taskMap.set(t.id, t));
  (remote.tasks || []).forEach(r => {
    const existing = taskMap.get(r.id);
    if (!existing) {
      taskMap.set(r.id, r);
    } else {
      const localTime = new Date(existing.updatedAt || 0).getTime();
      const remoteTime = new Date(r.updatedAt || 0).getTime();
      taskMap.set(r.id, remoteTime > localTime ? r : existing);
    }
  });

  const habitMap = new Map<string, Habit>();
  (local.habits || []).forEach(h => habitMap.set(h.id, h));
  (remote.habits || []).forEach(r => {
    const existing = habitMap.get(r.id);
    if (!existing) {
      habitMap.set(r.id, r);
    } else {
      const mergedCompletedDates = Array.from(new Set([...(existing.completedDates || []), ...(r.completedDates || [])])).sort();
      const streaks = calculateStreaks(mergedCompletedDates);
      const localTime = new Date(existing.updatedAt || 0).getTime();
      const remoteTime = new Date(r.updatedAt || 0).getTime();
      const base = remoteTime > localTime ? r : existing;
      habitMap.set(r.id, {
        ...base,
        completedDates: mergedCompletedDates,
        streakCount: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
      });
    }
  });

  const logMap = new Map<string, DailyLog>();
  (local.dailyLogs || []).forEach(l => logMap.set(l.id, l));
  (remote.dailyLogs || []).forEach(r => {
    const existing = logMap.get(r.id);
    if (!existing) {
      logMap.set(r.id, r);
    } else {
      const localTime = new Date(existing.updatedAt || 0).getTime();
      const remoteTime = new Date(r.updatedAt || 0).getTime();
      logMap.set(r.id, remoteTime > localTime ? r : existing);
    }
  });

  const noteMap = new Map<string, Note>();
  (local.notes || []).forEach(n => noteMap.set(n.id, n));
  (remote.notes || []).forEach(r => {
    const existing = noteMap.get(r.id);
    if (!existing) {
      noteMap.set(r.id, r);
    } else {
      const localTime = new Date(existing.updatedAt || 0).getTime();
      const remoteTime = new Date(r.updatedAt || 0).getTime();
      noteMap.set(r.id, remoteTime > localTime ? r : existing);
    }
  });

  const catMap = new Map<string, Category>();
  (local.categories || []).forEach(c => catMap.set(c.id, c));
  (remote.categories || []).forEach(r => {
    if (!catMap.has(r.id)) catMap.set(r.id, r);
  });

  return {
    version: local.version || '1.0.0',
    tasks: Array.from(taskMap.values()),
    habits: Array.from(habitMap.values()),
    dailyLogs: Array.from(logMap.values()),
    notes: Array.from(noteMap.values()),
    reminders: local.reminders?.length ? local.reminders : (remote.reminders || []),
    categories: Array.from(catMap.values()),
    settings: { ...remote.settings, ...local.settings },
    moneyData: local.moneyData || remote.moneyData,
    unlockedBadges: Array.from(new Set([...(local.unlockedBadges || []), ...(remote.unlockedBadges || [])])),
    exportedAt: new Date().toISOString(),
  };
}

/**
/**
 * Record current state of app with ALL data and update/rewrite the sync file to match.
 */
export async function performExportSyncToFile(currentSettings: any): Promise<BackupData | null> {
  if (!isFileSyncSupported()) return null;

  try {
    const localData = await dbService.exportAllData(currentSettings);
    await syncToFile(localData);
    return localData;
  } catch (err) {
    console.warn('[OneDriveSync] Export sync to file failed:', err);
    return null;
  }
}

/**
 * Perform a complete sync: exports current state with all data and rewrites the sync file.
 */
export async function performFullBidirectionalSync(currentSettings: any): Promise<BackupData | null> {
  return performExportSyncToFile(currentSettings);
}


