'use client';

/**
 * OneDrive Auto-Sync Hook
 *
 * Subscribes to the Shadow Tracker store and auto-syncs ALL data
 * to the configured OneDrive file whenever any data changes.
 * Debounced to 3 seconds to avoid hammering the disk.
 * Uses Page Visibility API to pause sync when app is in background.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useShadowTrackerStore } from '@/store';
import { performFullBidirectionalSync } from '@/lib/oneDriveSync';

export function useOneDriveAutoSync() {
  const { tasks, habits, dailyLogs, notes, categories, settings } = useShadowTrackerStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);
  const isVisible = useRef(true);

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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current || !isVisible.current) return;
      try {
        const syncedBackup = await performFullBidirectionalSync(useShadowTrackerStore.getState().settings);
        if (syncedBackup) {
          useShadowTrackerStore.getState().updateSettings({
            lastOneDriveSyncTimestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('[OneDriveSync] Auto-sync failed:', err);
      }
    }, 3000);
  }, []);

  // 1. Sync on Zustand Store domain updates
  useEffect(() => {
    triggerDebouncedSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, habits, dailyLogs, notes, categories, settings.oneDriveSyncEnabled, settings.oneDriveSyncFile, triggerDebouncedSync]);

  // 2. Sync on External Local/Health/Diet/Money/RPG updates
  useEffect(() => {
    const handleDomainEvent = () => {
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
