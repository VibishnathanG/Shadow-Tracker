'use client';

/**
 * Third-Party Integrations Auto-Sync Hook
 *
 * Automatically monitors configured Streak & GymMane backup files for external modifications.
 * - Triggers timestamp comparison every 6 seconds while window is active
 * - Instantly re-checks when the browser tab regains focus or visibility
 * - Pauses polling when tab is hidden (0% CPU impact)
 */

import { useEffect, useRef } from 'react';
import { useShadowTrackerStore } from '@/store';
import { checkAndSyncAllIntegrations } from '@/lib/integrations/integrationAutoSync';

export function useIntegrationAutoSync(): void {
  const isMounted = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const runCheck = async (force = false) => {
      if (!isMounted.current || isCheckingRef.current) return;
      if (document.hidden) return; // Zero CPU when minimized or tab hidden

      const settings = useShadowTrackerStore.getState().settings;
      if (!settings.streakAutoSyncEnabled && !settings.gymmaneAutoSyncEnabled) {
        return;
      }

      try {
        isCheckingRef.current = true;
        await checkAndSyncAllIntegrations(force);
      } catch (err) {
        console.warn('[IntegrationAutoSync] Background check notice:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check on mount
    runCheck(false);

    // Periodic watcher (every 6 seconds while window is visible)
    const intervalId = setInterval(() => {
      runCheck(false);
    }, 6000);

    // Immediate check when window regains focus or visibility
    const handleFocus = () => runCheck(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runCheck(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
