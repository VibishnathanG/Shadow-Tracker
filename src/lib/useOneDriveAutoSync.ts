'use client';

/**
 * OneDrive Auto-Sync Hook
 *
 * Subscribes to the Shadow Tracker store and auto-syncs ALL data
 * to the configured OneDrive file whenever any data changes.
 * Debounced to 3 seconds to avoid hammering the disk.
 * Uses Page Visibility API to pause sync when app is in background.
 */

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    // Only sync if user has configured a sync file
    if (!settings.oneDriveSyncEnabled || !settings.oneDriveSyncFile) return;

    // Clear pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce 3 seconds after last change
    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current) return;
      if (!isVisible.current) return;
      try {
        const syncedBackup = await performFullBidirectionalSync(settings);
        if (syncedBackup) {
          useShadowTrackerStore.getState().updateSettings({
            lastOneDriveSyncTimestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('[OneDriveSync] Auto-sync failed:', err);
      }
    }, 3000);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, habits, dailyLogs, notes, categories, settings.oneDriveSyncEnabled, settings.oneDriveSyncFile]);
}
