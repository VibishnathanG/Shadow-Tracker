'use client';

/**
 * Third-Party Integrations Auto-Sync Engine
 *
 * Implements seamless, one-way background synchronization for external backup files (Streak & GymMane).
 * - Watches user-selected files using File System Access API (FileSystemFileHandle)
 * - Persists handles in IndexedDB across reloads
 * - Checks file.lastModified timestamp; only parses & syncs when timestamp changes
 * - Zero CPU / Zero disk writes: strictly one-way (source -> Shadow Tracker)
 * - Graceful deduplication & same-name task updates
 * - Dispatches 'shadow_integration_sync_status' events for reactive UI telemetry
 */

import { useShadowTrackerStore } from '@/store';
import { parseStreakBackup, mergeStreakDataIntoApp } from './streakImporter';
import { parseGymManeBackup, mergeGymManeDataIntoApp } from './gymmaneImporter';

const IDB_INTEGRATION_DB = 'shadow_integrations_sync';
const IDB_STORE = 'handles';

export type IntegrationType = 'streak' | 'gymmane';

export interface IntegrationSyncStatus {
  type: IntegrationType;
  fileName?: string;
  lastModified?: number;
  lastSyncTimestamp?: number;
  isSyncing: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  itemsUpdated?: number;
  itemsAdded?: number;
}

// In-memory handle cache to avoid DB roundtrips on rapid polling
const handleMemoryCache: Record<IntegrationType, FileSystemFileHandle | null> = {
  streak: null,
  gymmane: null,
};

// In-memory file cache for files loaded via standard HTML input or picker
const fileMemoryCache: Record<IntegrationType, File | null> = {
  streak: null,
  gymmane: null,
};

export function setCachedIntegrationFile(type: IntegrationType, file: File): void {
  fileMemoryCache[type] = file;
}

export function getCachedIntegrationFile(type: IntegrationType): File | null {
  return fileMemoryCache[type];
}

// Concurrency lock to avoid overlapping sync runs
const isSyncingLock: Record<IntegrationType, boolean> = {
  streak: false,
  gymmane: false,
};

/**
 * Checks if File System Access API is supported (Edge, Chrome, Chromium, Tauri WebView2).
 */
export function hasFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    typeof (window as any).showOpenFilePicker === 'function'
  );
}

// ---------- IndexedDB Handle Storage ----------

async function openIntegrationDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(IDB_INTEGRATION_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveIntegrationHandle(type: IntegrationType, handle: FileSystemFileHandle): Promise<void> {
  handleMemoryCache[type] = handle;
  try {
    const file = await handle.getFile();
    fileMemoryCache[type] = file;
  } catch {}
  try {
    const db = await openIntegrationDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, type);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[AutoSync] Could not save handle in IndexedDB for ${type}:`, err);
  }
}

export async function getIntegrationHandle(type: IntegrationType): Promise<FileSystemFileHandle | null> {
  if (handleMemoryCache[type]) return handleMemoryCache[type];
  try {
    const db = await openIntegrationDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(type);
      req.onsuccess = () => {
        const handle = (req.result as FileSystemFileHandle) || null;
        if (handle) handleMemoryCache[type] = handle;
        resolve(handle);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function removeIntegrationHandle(type: IntegrationType): Promise<void> {
  handleMemoryCache[type] = null;
  fileMemoryCache[type] = null;
  try {
    const db = await openIntegrationDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(type);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

/**
 * Verify read permission for a stored FileSystemFileHandle.
 */
export async function verifyReadPermission(handle: FileSystemFileHandle, prompt = false): Promise<boolean> {
  try {
    const opts = { mode: 'read' as const };
    const query = await (handle as any).queryPermission(opts);
    if (query === 'granted') return true;
    if (prompt && typeof (handle as any).requestPermission === 'function') {
      const req = await (handle as any).requestPermission(opts);
      return req === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Dispatches an event with current sync telemetry for UI consumers.
 */
function broadcastSyncStatus(status: IntegrationSyncStatus): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('shadow_integration_sync_status', {
      detail: status,
    })
  );
}

/**
 * Performs a one-way sync check for a specific integration.
 * Only syncs if file.lastModified > previous recorded lastModified or if force is true.
 */
export async function syncIntegrationFile(
  type: IntegrationType,
  options?: { force?: boolean; file?: File }
): Promise<IntegrationSyncStatus> {
  if (isSyncingLock[type]) {
    return {
      type,
      isSyncing: true,
      status: 'syncing',
    };
  }

  const store = useShadowTrackerStore.getState();
  const settings = store.settings;

  try {
    isSyncingLock[type] = true;
    broadcastSyncStatus({ type, isSyncing: true, status: 'syncing' });

    let fileToSync: File | null = options?.file || null;
    let handle: FileSystemFileHandle | null = null;

    if (!fileToSync) {
      handle = await getIntegrationHandle(type);
      if (handle) {
        try {
          fileToSync = await handle.getFile();
          fileMemoryCache[type] = fileToSync;
        } catch {
          const hasPerm = await verifyReadPermission(handle, false);
          if (hasPerm) {
            try {
              fileToSync = await handle.getFile();
              fileMemoryCache[type] = fileToSync;
            } catch {}
          }
        }
      }

      // Fallback to in-memory cached file if handle is not available
      if (!fileToSync && fileMemoryCache[type]) {
        fileToSync = fileMemoryCache[type];
      }

      if (!fileToSync) {
        isSyncingLock[type] = false;
        const result: IntegrationSyncStatus = {
          type,
          isSyncing: false,
          status: 'idle',
          errorMessage: 'No file configured for auto-sync',
        };
        broadcastSyncStatus(result);
        return result;
      }
    }

    const currentModified = fileToSync.lastModified;
    const recordedModified =
      type === 'streak' ? settings.streakLastModified || 0 : settings.gymmaneLastModified || 0;

    // Skip if file hasn't changed and not forced
    if (!options?.force && currentModified <= recordedModified) {
      isSyncingLock[type] = false;
      const result: IntegrationSyncStatus = {
        type,
        fileName: fileToSync.name,
        lastModified: currentModified,
        lastSyncTimestamp: type === 'streak' ? settings.streakLastSyncTimestamp : settings.gymmaneLastSyncTimestamp,
        isSyncing: false,
        status: 'synced',
      };
      broadcastSyncStatus(result);
      return result;
    }

    // Execute one-way sync
    let itemsAdded = 0;
    let itemsUpdated = 0;

    if (type === 'streak') {
      const parsed = await parseStreakBackup(fileToSync);
      const summary = await mergeStreakDataIntoApp(parsed, { silent: true, autoDownload: false });
      itemsAdded = summary.tasksAdded + summary.habitsAdded;
      itemsUpdated = summary.tasksUpdated + summary.habitsMerged;

      store.updateSettings({
        streakAutoSyncFileName: fileToSync.name,
        streakLastModified: currentModified,
        streakLastSyncTimestamp: Date.now(),
      });
    } else {
      const parsed = await parseGymManeBackup(fileToSync);
      const summary = await mergeGymManeDataIntoApp(parsed, { silent: true, autoDownload: false });
      itemsAdded = summary.waterSipsAdded + summary.foodsAdded + summary.supplementsAdded;
      itemsUpdated = summary.foodsUpdated;

      store.updateSettings({
        gymmaneAutoSyncFileName: fileToSync.name,
        gymmaneLastModified: currentModified,
        gymmaneLastSyncTimestamp: Date.now(),
      });
    }

    const finalResult: IntegrationSyncStatus = {
      type,
      fileName: fileToSync.name,
      lastModified: currentModified,
      lastSyncTimestamp: Date.now(),
      isSyncing: false,
      status: 'synced',
      itemsAdded,
      itemsUpdated,
    };
    broadcastSyncStatus(finalResult);
    return finalResult;
  } catch (err: any) {
    console.error(`[AutoSync] Error syncing ${type}:`, err);
    const errorResult: IntegrationSyncStatus = {
      type,
      isSyncing: false,
      status: 'error',
      errorMessage: err.message || 'Sync failed',
    };
    broadcastSyncStatus(errorResult);
    return errorResult;
  } finally {
    isSyncingLock[type] = false;
  }
}

/**
 * Checks and syncs all enabled integrations if their watched files have been updated.
 */
export async function checkAndSyncAllIntegrations(force = false): Promise<void> {
  const settings = useShadowTrackerStore.getState().settings;

  if (settings.streakAutoSyncEnabled) {
    try {
      await syncIntegrationFile('streak', { force });
    } catch (e) {
      console.warn('[AutoSync] Streak check error:', e);
    }
  }

  if (settings.gymmaneAutoSyncEnabled) {
    try {
      await syncIntegrationFile('gymmane', { force });
    } catch (e) {
      console.warn('[AutoSync] GymMane check error:', e);
    }
  }
}
