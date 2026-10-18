'use client';

/**
 * OneDrive Auto-Sync Hook
 *
 * Subscribes to the Shadow Tracker store and auto-syncs ALL data
 * to the configured OneDrive file whenever any data changes.
 * Debounced to 3 seconds to avoid hammering the disk.
 * Uses Page Visibility API to pause sync when app is in background.
 * Strictly prevents recursive echo / re-entrant sync storms.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useShadowTrackerStore } from '@/store';
import { performFullBidirectionalSync } from '@/lib/oneDriveSync';

export function useOneDriveAutoSync() {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);
  const isVisible = useRef(true);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const handleVisibility = () => {
      isVisible.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const triggerDebouncedSync = useCallback(() => {
    const currentSettings = useShadowTrackerStore.getState().settings;
    if (!currentSettings.oneDriveSyncEnabled || !currentSettings.oneDriveSyncFile) return;
    if (isSyncingRef.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current || !isVisible.current || isSyncingRef.current) return;
      try {
        isSyncingRef.current = true;
        const syncedBackup = await performFullBidirectionalSync(useShadowTrackerStore.getState().settings);
        if (syncedBackup) {
          useShadowTrackerStore.getState().updateSettings({
            lastOneDriveSyncTimestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('[OneDriveSync] Auto-sync failed:', err);
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 1500);
      }
    }, 3000);
  }, []);

  // 1. Sync on Zustand Store domain updates via external subscription (zero React re-renders)
  useEffect(() => {
    let prevTasks = useShadowTrackerStore.getState().tasks;
    let prevHabits = useShadowTrackerStore.getState().habits;
    let prevDailyLogs = useShadowTrackerStore.getState().dailyLogs;
    let prevNotes = useShadowTrackerStore.getState().notes;
    let prevCategories = useShadowTrackerStore.getState().categories;
    let prevSyncEnabled = useShadowTrackerStore.getState().settings.oneDriveSyncEnabled;
    let prevSyncFile = useShadowTrackerStore.getState().settings.oneDriveSyncFile;

    const unsub = useShadowTrackerStore.subscribe((state) => {
      if (isSyncingRef.current) {
        // Sync operation in progress — update baseline references without looping
        prevTasks = state.tasks;
        prevHabits = state.habits;
        prevDailyLogs = state.dailyLogs;
        prevNotes = state.notes;
        prevCategories = state.categories;
        prevSyncEnabled = state.settings.oneDriveSyncEnabled;
        prevSyncFile = state.settings.oneDriveSyncFile;
        return;
      }

      if (
        state.tasks !== prevTasks ||
        state.habits !== prevHabits ||
        state.dailyLogs !== prevDailyLogs ||
        state.notes !== prevNotes ||
        state.categories !== prevCategories ||
        state.settings.oneDriveSyncEnabled !== prevSyncEnabled ||
        state.settings.oneDriveSyncFile !== prevSyncFile
      ) {
        prevTasks = state.tasks;
        prevHabits = state.habits;
        prevDailyLogs = state.dailyLogs;
        prevNotes = state.notes;
        prevCategories = state.categories;
        prevSyncEnabled = state.settings.oneDriveSyncEnabled;
        prevSyncFile = state.settings.oneDriveSyncFile;
        triggerDebouncedSync();
      }
    });

    return () => {
      unsub();
    };
  }, [triggerDebouncedSync]);

  // 2. Sync on External Local/Health/Diet/Money/RPG updates
  useEffect(() => {
    const handleDomainEvent = (e: Event) => {
      // Ignore events dispatched by sync operation itself
      if ((e as CustomEvent)?.detail?.source === 'onedrive_sync') {
        return;
      }
      if (isSyncingRef.current) return;
      triggerDebouncedSync();
    };

    window.addEventListener('shadow_health_updated', handleDomainEvent);
    window.addEventListener('shadow_health_local_changed', handleDomainEvent);
    window.addEventListener('shadow_money_updated', handleDomainEvent);
    window.addEventListener('shadow_rpg_updated', handleDomainEvent);
    window.addEventListener('storage', handleDomainEvent);

    return () => {
      window.removeEventListener('shadow_health_updated', handleDomainEvent);
      window.removeEventListener('shadow_health_local_changed', handleDomainEvent);
      window.removeEventListener('shadow_money_updated', handleDomainEvent);
      window.removeEventListener('shadow_rpg_updated', handleDomainEvent);
      window.removeEventListener('storage', handleDomainEvent);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [triggerDebouncedSync]);
}
