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
import { smartMergeBackupData } from '@/lib/smartMerge';

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
  try {
    return (
      typeof window !== 'undefined' &&
      'showSaveFilePicker' in window &&
      'showOpenFilePicker' in window &&
      typeof (window as any).showSaveFilePicker === 'function' &&
      typeof (window as any).showOpenFilePicker === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Trigger an instant browser file download of a JSON object.
 * Works seamlessly across Zen, Brave, Firefox, Safari, and Chrome/Edge.
 */
export function triggerJsonDownload(fileName: string, data: object): void {
  if (typeof window === 'undefined') return;
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  } catch (err) {
    console.warn('[OneDriveSync] JSON download error:', err);
  }
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

/**
 * Returns true if the current environment supports direct background disk file writes
 * via the File System Access API (Edge, Chrome, or Chromium with permissions).
 */
export function hasDirectDiskAccess(): boolean {
  return hasFileSystemAccessAPI();
}

/**
 * Returns true if file sync is supported on this platform.
 * Fully universal: supported across ALL platforms and browsers!
 * - Edge/Chrome/Desktop: Direct disk file handle writes
 * - Zen/Brave/Firefox/Safari: Universal File Pick/Export bidirectional sync
 * - Android/Mobile: Capacitor Filesystem & localStorage sync
 */
export function isFileSyncSupported(): boolean {
  return typeof window !== 'undefined';
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

// ---------- HTML5 File Input Fallback (Universal for Zen / Brave / Firefox / Safari / Mobile) ----------

function pickFileViaHtmlInput(): Promise<{ fileName: string; data: any } | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    let resolved = false;
    const cleanup = () => {
      if (input.parentNode) {
        document.body.removeChild(input);
      }
    };

    input.onchange = async (e) => {
      resolved = true;
      const file = (e.target as HTMLInputElement).files?.[0];
      cleanup();
      if (!file) return resolve(null);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const name = file.name || 'shadow-tracker-sync.json';
        localStorage.setItem(ANDROID_SYNC_FILE_KEY, name);
        localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(parsed));
        resolve({ fileName: name, data: parsed });
      } catch (err) {
        console.warn('[OneDriveSync] Universal file read error:', err);
        resolve(null);
      }
    };

    // Fallback cleanup if user cancels file dialog
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!resolved) {
            cleanup();
            resolve(null);
          }
        }, 1500);
      },
      { once: true }
    );

    input.onerror = () => {
      cleanup();
      resolve(null);
    };

    input.click();
  });
}

// ---------- Public API ----------

/**
 * Create a new sync file (Create & Start Sync).
 * Edge/Chrome: Uses File System Access API showSaveFilePicker for direct disk write.
 * Zen/Brave/Firefox/Safari: Exports data as downloadable JSON for user's OneDrive/local folder and caches state.
 * Android: Sets up local storage & Filesystem sync.
 */
export async function createNewSyncFile(initialData?: object): Promise<string | null> {
  const fileName = 'shadow-tracker-sync.json';

  if (isAndroidCapacitor()) {
    localStorage.setItem(ANDROID_SYNC_FILE_KEY, fileName);
    if (initialData) {
      localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(initialData));
    }
    return fileName;
  }

  if (hasFileSystemAccessAPI()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'Shadow Tracker Sync File', accept: { 'application/json': ['.json'] } }],
        startIn: 'documents',
      });
      await saveHandleToDB(handle);

      if (initialData) {
        const writable = await (handle as any).createWritable();
        await writable.write(JSON.stringify(initialData, null, 2));
        await writable.close();
      }

      localStorage.setItem(ANDROID_SYNC_FILE_KEY, handle.name as string);
      if (initialData) {
        localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(initialData));
      }
      return handle.name as string;
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      console.warn('[OneDriveSync] Native save picker failed, falling back to universal mode:', err);
      // Fall through to universal download
    }
  }

  // Universal fallback: trigger browser download of sync JSON and persist file info
  localStorage.setItem(ANDROID_SYNC_FILE_KEY, fileName);
  if (initialData) {
    localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(initialData));
    triggerJsonDownload(fileName, initialData);
  }
  return fileName;
}

/**
 * Pick an existing sync file (Link & Import Sync).
 * Edge/Chrome: Uses native showOpenFilePicker for direct disk link.
 * Zen/Brave/Firefox/Safari/Android: Uses HTML5 file picker to link & import data.
 */
export async function pickExistingSyncFile(): Promise<{ fileName: string; data: any } | null> {
  if (isAndroidCapacitor()) {
    return pickFileViaHtmlInput();
  }

  if (hasFileSystemAccessAPI()) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Shadow Tracker Sync File', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      });
      if (!handle) return null;

      const hasPermission = await verifyPermission(handle, 'readwrite');
      if (hasPermission) {
        await saveHandleToDB(handle);
        const file: File = await (handle as any).getFile();
        const text = await file.text();
        const parsedData = JSON.parse(text);
        localStorage.setItem(ANDROID_SYNC_FILE_KEY, handle.name as string);
        localStorage.setItem(ANDROID_SYNC_KEY, JSON.stringify(parsedData));
        return { fileName: handle.name as string, data: parsedData };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      console.warn('[OneDriveSync] Native open file picker failed, falling back to HTML input:', err);
    }
  }

  // Universal HTML5 fallback
  return pickFileViaHtmlInput();
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
  try {
    const cachedName = localStorage.getItem(ANDROID_SYNC_FILE_KEY);
    if (cachedName) return cachedName;
  } catch {}

  try {
    const handle = await loadHandleFromDB();
    if (handle?.name) return handle.name;
  } catch {}

  return null;
}

/**
 * Write data to the configured sync file.
 * Desktop: Writes to native file system handle if available, and keeps localStorage/IndexedDB updated.
 * Android: Writes to localStorage and Capacitor Filesystem.
 */
export async function syncToFile(data: object): Promise<void> {
  const jsonStr = JSON.stringify(data, null, 2);
  try {
    localStorage.setItem(ANDROID_SYNC_KEY, jsonStr);
  } catch {}

  if (isAndroidCapacitor()) {
    try {
      const fileName = localStorage.getItem(ANDROID_SYNC_FILE_KEY) || 'shadow-tracker-sync.json';
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
    return;
  }

  try {
    const handle = await loadHandleFromDB();
    if (!handle) return;

    const hasPermission = await verifyPermission(handle, 'readwrite');
    if (!hasPermission) return;

    const writable = await (handle as any).createWritable();
    await writable.write(jsonStr);
    await writable.close();
  } catch (err) {
    console.warn('[OneDriveSync] Handle write failed, saved to local cache:', err);
  }
}

/**
 * Read data from the configured sync file.
 * Desktop: Reads from native file system handle if available, falls back to local cache.
 * Android: Reads from Capacitor Filesystem or localStorage.
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
    } catch (err) {
      console.warn('[OneDriveSync] Android read failed:', err);
    }
  }

  // Try native handle first if available
  try {
    const handle = await loadHandleFromDB();
    if (handle) {
      const hasPermission = await verifyPermission(handle, 'read');
      if (hasPermission) {
        const file: File = await (handle as any).getFile();
        const text = await file.text();
        return JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn('[OneDriveSync] Handle read failed, trying cache:', err);
  }

  // Fallback to cached sync data
  try {
    const raw = localStorage.getItem(ANDROID_SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[OneDriveSync] Cache read failed:', err);
  }

  return null;
}

/**
 * Remove the saved file handle (disconnect sync).
 */
export async function disconnectSyncFile(): Promise<void> {
  try {
    localStorage.removeItem(ANDROID_SYNC_FILE_KEY);
    localStorage.removeItem(ANDROID_SYNC_KEY);
  } catch {}
  await clearHandleFromDB();
}

/**
 * Merge local and remote BackupData datasets bidirectionally.
 * Deeply combines all domains (health, habits, tasks, money, reflections, rpg) while keeping ToDo local.
 */
export function mergeBackupDatasets(local: BackupData, remote: BackupData): BackupData {
  if (!remote || !Array.isArray(remote.tasks)) return local;
  if (!local || !Array.isArray(local.tasks)) return remote;
  return smartMergeBackupData(local as any, remote as any) as any;
}

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
 * Perform a true bidirectional sync:
 * 1. Reads remote sync file.
 * 2. Merges local and remote data deeply across all domains (health, custom diets, workouts, habits, tasks, money, notes, rpg)
 *    while preserving strict local-first ToDos.
 * 3. Applies merged updates locally and dispatches domain sync events.
 * 4. Rewrites the updated merged dataset to the single sync file.
 */
export async function performFullBidirectionalSync(currentSettings: any): Promise<BackupData | null> {
  if (!isFileSyncSupported()) return null;

  try {
    const localData = await dbService.exportAllData(currentSettings);
    const remoteData = await readFromFile();

    if (remoteData && (Array.isArray(remoteData.tasks) || Array.isArray(remoteData.habits) || remoteData.healthData || remoteData.moneyData)) {
      const mergedData = smartMergeBackupData(localData as any, remoteData as any) as any;
      await dbService.importAllData(mergedData);

      if (typeof window !== 'undefined') {
        const syncDetail = { detail: { source: 'onedrive_sync' } };
        window.dispatchEvent(new CustomEvent('shadow_data_imported', syncDetail));
        window.dispatchEvent(new CustomEvent('shadow_health_updated', syncDetail));
        window.dispatchEvent(new CustomEvent('shadow_money_updated', syncDetail));
        window.dispatchEvent(new CustomEvent('shadow_rpg_updated', syncDetail));
      }

      await syncToFile(mergedData);
      return mergedData;
    }

    await syncToFile(localData);
    return localData;
  } catch (err) {
    console.warn('[OneDriveSync] Bidirectional sync failed, falling back to local export:', err);
    return performExportSyncToFile(currentSettings);
  }
}


