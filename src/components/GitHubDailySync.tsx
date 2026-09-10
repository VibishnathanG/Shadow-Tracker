'use client';

import { useEffect, useRef } from 'react';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { pushToCloudGistFile, pushToCloud, pullFromCloudGistFile, pullFromCloud } from '@/lib/gistSync';
import { dbService } from '@/lib/storage';
import { smartMergeBackupData } from '@/lib/smartMerge';

export const GitHubDailySync = () => {
  const { settings, updateSettings } = useShadowTrackerStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    const cleanPat = (settings.githubPat || '').trim();
    if (hasCheckedRef.current) return;
    if (!settings.githubSyncEnabled || !cleanPat) return;

    const todayStr = getTodayDateString();
    const isLaunchSync = settings.githubSyncOnLaunch !== false; // Default to true if undefined

    // If launch sync is OFF, fall back to standard 1-time daily sync
    if (!isLaunchSync && settings.lastGithubSyncDate === todayStr) {
      return;
    }

    hasCheckedRef.current = true;

    const performDailySync = async () => {
      try {
        const state = useShadowTrackerStore.getState();
        const localBackup = await dbService.exportAllData(state.settings);

        let cloudData = null;
        if (settings.githubGistId && settings.githubSyncFile) {
          cloudData = await pullFromCloudGistFile(cleanPat, settings.githubGistId, settings.githubSyncFile);
        } else {
          cloudData = await pullFromCloud(cleanPat);
        }

        // Bi-directional smart merge: resolve conflicts between mobile & desktop without losing items
        const finalData = cloudData ? smartMergeBackupData(localBackup, cloudData as any) : localBackup;

        // Apply merged data to local DB if cloud data was present
        if (cloudData) {
          await useShadowTrackerStore.getState().importBackup(finalData as any);
        }

        // Push merged state back to cloud Gist
        const syncPayload = {
          tasks: finalData.tasks,
          habits: finalData.habits,
          dailyLogs: finalData.dailyLogs,
          notes: finalData.notes,
          categories: finalData.categories,
          reminders: finalData.reminders,
          settings: finalData.settings,
          moneyData: finalData.moneyData,
          healthData: (finalData as any).healthData,
          rpgQuests: (finalData as any).rpgQuests,
          wizardScrolls: (finalData as any).wizardScrolls,
          unlockedBadges: finalData.unlockedBadges,
          version: finalData.version,
          exportedAt: finalData.exportedAt,
          timestamp: Date.now(),
        };

        if (settings.githubGistId && settings.githubSyncFile) {
          await pushToCloudGistFile(cleanPat, settings.githubGistId, settings.githubSyncFile, syncPayload);
        } else {
          await pushToCloud(cleanPat, syncPayload);
        }

        updateSettings({
          lastGithubSyncDate: todayStr,
          lastSyncTimestamp: Date.now(),
          lastGithubSyncStatus: `✓ Bi-directional Smart Sync Completed (${isLaunchSync ? 'App Launch' : 'Daily'})`,
        });
        console.log('[GitHubSync] Bi-directional smart sync completed cleanly for date:', todayStr);
      } catch (err: any) {
        console.warn('[GitHubSync] Automated sync failed:', err);
        updateSettings({
          lastGithubSyncStatus: `⚠️ Sync Error: ${err?.message || 'Network error'}`,
        });
      }
    };

    const timer = setTimeout(performDailySync, 3000);
    return () => clearTimeout(timer);
  }, [
    settings.githubSyncEnabled,
    settings.githubPat,
    settings.lastGithubSyncDate,
    settings.githubGistId,
    settings.githubSyncFile,
    settings.githubSyncOnLaunch,
    updateSettings,
  ]);

  return null;
};
