'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { dbService } from '@/lib/storage';
import { getTodayDateString } from '@/lib/dateUtils';
import Modal from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pushToCloud,
  pullFromCloud,
  listGitHubGistJsonFiles,
  createCustomGitHubGist,
  pushToCloudGistFile,
  pullFromCloudGistFile,
} from '@/lib/gistSync';
import { generateMassiveTwoYearData } from '@/lib/seedData';
import { Task, Habit, DailyLog, Note } from '@/types';
import { smartMergeBackupData } from '@/lib/smartMerge';
import { JsonErrorModal } from '@/components/JsonErrorModal';
import { validateAndParseBackupJSON, JsonDiagnosticIssue } from '@/lib/jsonDiagnostics';
import {
  pickSyncFile,
  createNewSyncFile,
  pickExistingSyncFile,
  syncToFile,
  readFromFile,
  disconnectSyncFile,
  isFileSyncSupported,
  performFullBidirectionalSync,
} from '@/lib/oneDriveSync';

import { LocalNotifications } from '@capacitor/local-notifications';
import { sendNativeNotification, isTauriEnv } from '@/lib/nativeNotification';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { resetAllViewPreferences } from '@/lib/viewPreferences';
import { fireConfetti } from '@/lib/confetti';

const TileArtDisplaySettings = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.1] select-none z-0">
    <motion.svg className="w-full h-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="0.3" animate={{ x1: [-20, 100], x2: [0, 120] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} />
      <motion.line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.3" animate={{ x1: [100, -20], x2: [120, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} />
      <motion.line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="0.3" animate={{ x1: [-40, 80], x2: [-20, 100] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
    </motion.svg>
  </div>
);

const TileArtCategories = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.1] select-none z-0">
    <motion.svg className="w-full h-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
      <circle cx="20" cy="35" r="1" fill="currentColor" />
      <circle cx="80" cy="65" r="1" fill="currentColor" />
      <circle cx="50" cy="50" r="1.5" fill="currentColor" />
      <line x1="20" y1="35" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 1" />
      <line x1="80" y1="65" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 1" />
      <motion.circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="0.3" animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  </div>
);

const TileArtSync = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.1] select-none z-0">
    <motion.svg className="w-full h-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.path d="M 30,60 Q 50,30 70,60" fill="none" stroke="currentColor" strokeWidth="0.6" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.path d="M 20,60 Q 50,20 80,60" fill="none" stroke="currentColor" strokeWidth="0.4" animate={{ opacity: [0.1, 0.7, 0.1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
      <motion.path d="M 10,60 Q 50,10 90,60" fill="none" stroke="currentColor" strokeWidth="0.3" animate={{ opacity: [0.05, 0.5, 0.05] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
    </motion.svg>
  </div>
);

const TileArtDanger = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08] select-none z-0">
    <motion.svg className="w-full h-full text-red-500" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.3" animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 5, repeat: Infinity }} />
      <motion.line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.3" animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 5, repeat: Infinity, delay: 2.5 }} />
      <motion.rect x="40" y="40" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.3" transform="rotate(45 50 50)" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  </div>
);

// --- OneDrive / Local File Sync Tile (self-contained component) ---
interface OneDriveSyncTileProps {
  onDiagnosticError?: (err: JsonDiagnosticIssue, fileName: string) => void;
}

const OneDriveSyncTile: React.FC<OneDriveSyncTileProps> = ({ onDiagnosticError }) => {
  const { settings, updateSettings, importBackup } = useShadowTrackerStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSupported] = useState(() => isFileSyncSupported());

  const handleStartNewSync = async () => {
    try {
      setIsSyncing(true);
      const state = useShadowTrackerStore.getState();
      const currentBackup = await dbService.exportAllData(state.settings);
      const fileName = await createNewSyncFile(currentBackup);
      if (!fileName) return;

      updateSettings({
        oneDriveSyncFile: fileName,
        oneDriveSyncEnabled: true,
        lastOneDriveSyncTimestamp: Date.now(),
      });
      alert(`✅ New sync file created: "${fileName}"\n\nCurrent workspace telemetry exported. Data will auto-sync near-realtime.`);
    } catch (e: any) {
      alert('Failed to create new sync file: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePickExistingSync = async () => {
    try {
      setIsSyncing(true);
      const result = await pickExistingSyncFile();
      if (!result) return;

      const { fileName, data } = result;
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      const validation = validateAndParseBackupJSON(jsonStr);

      if (!validation.isValid) {
        onDiagnosticError?.(validation.error!, fileName);
        return;
      }

      const confirmed = window.confirm(
        `Linked sync file "${fileName}".\n\nWould you like to import and merge existing file data into your app now?\n\nFile Date: ${validation.data.exportedAt ? new Date(validation.data.exportedAt).toLocaleString() : 'Unknown'}`
      );
      if (confirmed) {
        await importBackup(validation.data);
      }

      updateSettings({
        oneDriveSyncFile: fileName,
        oneDriveSyncEnabled: true,
        lastOneDriveSyncTimestamp: Date.now(),
      });
      alert(`✅ Linked sync file: "${fileName}"\n\nAuto-sync is now active for this file!`);
      if (confirmed) window.location.reload();
    } catch (e: any) {
      alert('Failed to pick existing sync file: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const state = useShadowTrackerStore.getState();
      const syncedBackup = await performFullBidirectionalSync(state.settings);
      if (syncedBackup) {
        updateSettings({ lastOneDriveSyncTimestamp: Date.now() });
      }
      alert('✅ Sync completed successfully!\n\nRecorded current state of app with all data and updated the sync file.');
    } catch (e: any) {
      alert('Sync failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('Disconnect the sync file? Auto-sync will pause until you link a file again.');
    if (!confirmed) return;
    await disconnectSyncFile();
    updateSettings({ oneDriveSyncFile: undefined, oneDriveSyncEnabled: false });
  };

  const handleToggleSync = () => {
    updateSettings({ oneDriveSyncEnabled: !settings.oneDriveSyncEnabled });
  };

  return (
    <motion.div
      className="tile settings-tile p-6 sm:p-8 space-y-5 flex flex-col justify-between relative overflow-hidden lg:col-span-1"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07] select-none z-0">
        <motion.svg className="w-full h-full text-sky-400" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path d="M 10,70 Q 30,50 50,60 Q 70,70 90,40" fill="none" stroke="currentColor" strokeWidth="0.8" animate={{ opacity: [0.2, 0.9, 0.2], pathLength: [0, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="50" cy="55" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" animate={{ scale: [0.9, 1.2, 0.9] }} transition={{ duration: 4, repeat: Infinity }} />
        </motion.svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Lucide.HardDrive size={18} />
            </span>
            OneDrive / Local File Sync
          </h3>
          {settings.oneDriveSyncEnabled && (
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[10px] font-black uppercase tracking-wider">
              ACTIVE REALTIME SYNC
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-foreground mt-3 leading-relaxed">
          Create a new sync file or connect an existing file from OneDrive/Disk. Automatic bidirectional sync persists across app restarts.
        </p>

        {settings.oneDriveSyncFile ? (
          <div className="mt-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
            <div className="flex items-start gap-2">
              <Lucide.FileJson size={16} className="text-sky-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-sky-300 truncate">{settings.oneDriveSyncFile}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Last sync: {settings.lastOneDriveSyncTimestamp ? new Date(settings.lastOneDriveSyncTimestamp).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            <label className="flex items-center justify-between mt-3 cursor-pointer select-none">
              <span className="text-xs font-bold text-foreground">Auto-sync active</span>
              <div
                onClick={handleToggleSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 shadow-inner cursor-pointer ${settings.oneDriveSyncEnabled ? 'bg-sky-500' : 'bg-secondary border border-border'}`}
              >
                <motion.div
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md"
                  animate={{ x: settings.oneDriveSyncEnabled ? 22 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </label>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">No sync file connected yet.</p>
        )}
      </div>

      {syncSupported && (
        <div className="flex flex-col gap-2.5 relative z-10 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartNewSync}
              disabled={isSyncing}
              className="filter-pill active flex items-center justify-center gap-2 !px-3.5 !py-3 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Lucide.PlusCircle size={15} />
              Start New Sync File
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePickExistingSync}
              disabled={isSyncing}
              className="filter-pill flex items-center justify-center gap-2 !px-3.5 !py-3 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Lucide.FolderOpen size={15} />
              Pick Existing Sync File
            </motion.button>
          </div>

          {settings.oneDriveSyncFile && (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="filter-pill flex items-center justify-center gap-2 !px-4 !py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Lucide.RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                Sync Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDisconnect}
                disabled={isSyncing}
                className="filter-pill flex items-center justify-center gap-2 !px-4 !py-2.5 text-rose-400 border-rose-500/30 hover:border-rose-500/60 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Lucide.XCircle size={14} />
                Disconnect
              </motion.button>
            </div>
          )}

          {isSyncing && (
            <p className="text-center text-xs text-sky-400 animate-pulse font-bold">Processing sync...</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const SettingsFeature: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    resetLifeRpg,
    recalibrateFromCurrentData,
    importBackup,
    categories,
    addCategory,
    deleteCategory,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    tasks,
    habits,
  } = useShadowTrackerStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catIcon, setCatIcon] = useState('Sparkles');

  const [isMotivationalModalOpen, setIsMotivationalModalOpen] = useState(false);
  const [newSlideVibe, setNewSlideVibe] = useState('random');
  const [newSlideQuote, setNewSlideQuote] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [githubPatInput, setGithubPatInput] = useState(settings.githubPat || '');

  // Corrupted JSON Error Diagnostic Engine Modal State
  const [jsonDiagnosticError, setJsonDiagnosticError] = useState<JsonDiagnosticIssue | null>(null);
  const [corruptedFileName, setCorruptedFileName] = useState<string>('');

  // Dynamic Per-Year Archiving State
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedPurgeYear, setSelectedPurgeYear] = useState<string>('');

  React.useEffect(() => {
    dbService.getAvailableYears().then(years => {
      setAvailableYears(years);
      if (years.length > 0 && !selectedPurgeYear) {
        setSelectedPurgeYear(years[0]);
      }
    });
  }, [tasks, habits]);

  const handleExportYear = useCallback(async () => {
    if (!selectedPurgeYear) return;
    try {
      const yearBackup = await dbService.exportYearData(selectedPurgeYear, settings);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(yearBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `shadow-tracker-archive-${selectedPurgeYear}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Year export failed:', e);
      alert('Failed to export year archive.');
    }
  }, [selectedPurgeYear, settings]);

  const handlePurgeYear = useCallback(async () => {
    if (!selectedPurgeYear) return;
    const confirmPurge = window.confirm(
      `Purge data for year ${selectedPurgeYear}? A mandatory archive JSON (shadow-tracker-archive-${selectedPurgeYear}.json) will be automatically downloaded FIRST before purging.`
    );
    if (!confirmPurge) return;

    try {
      const { archiveBackup, purgedCount } = await dbService.purgeYearData(selectedPurgeYear, settings);
      
      // Auto-trigger mandatory download of pre-purge backup!
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archiveBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `shadow-tracker-archive-${selectedPurgeYear}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Re-fetch clean updated state from IndexedDB to update store in-memory!
      const { STORES } = await import('@/lib/storage');
      const tasks = await dbService.getAll<Task>(STORES.TASKS);
      const habits = await dbService.getAll<Habit>(STORES.HABITS);
      const dailyLogs = await dbService.getAll<DailyLog>(STORES.DAILY_LOGS);
      const notes = await dbService.getAll<Note>(STORES.NOTES);

      useShadowTrackerStore.setState({
        tasks: tasks.filter(t => !t.isSoftDeleted),
        habits: habits.filter(h => !h.isSoftDeleted),
        dailyLogs,
        notes,
      });

      alert(`Mandatory archive saved! Purged ${purgedCount} items for year ${selectedPurgeYear}. Reloading app...`);
      window.location.reload();
    } catch (e: any) {
      console.error('Year purge failed:', e);
      alert('Failed to purge year data: ' + e.message);
    }
  }, [selectedPurgeYear, settings]);

  // Custom Notifications State & Logic
  const [notifPermission, setNotifPermission] = useState<string>('default');

  React.useEffect(() => {
    const checkPerm = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        setNotifPermission(status.display);
      } catch (e) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setNotifPermission(Notification.permission);
        }
      }
    };
    checkPerm();
  }, []);

  const handleRequestPermission = async () => {
    if (isTauriEnv()) {
      try {
        const { isPermissionGranted, requestPermission } = await import(
          '@tauri-apps/plugin-notification'
        );
        let granted = await isPermissionGranted();
        if (!granted) {
          const res = await requestPermission();
          granted = res === 'granted';
        }
        setNotifPermission(granted ? 'granted' : 'denied');
        if (granted) {
          alert('Native Windows Notifications Enabled successfully!');
          sendNativeNotification(
            '🔔 Shadow Tracker Notification Engine Active',
            'Native Windows Desktop Notifications are active and verified.',
            { sound: true }
          );
        } else {
          alert('Notification permission was denied');
        }
        return;
      } catch (e) {
        console.warn('Tauri permission request error:', e);
      }
    }

    try {
      const res = await LocalNotifications.requestPermissions();
      setNotifPermission(res.display);
      if (res.display === 'granted') {
        alert('Push & Native Notifications Enabled successfully!');
      } else {
        alert('Notification permission was ' + res.display);
      }
    } catch (e) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        setNotifPermission(res);
      }
    }
  };

  const handleTestNativeNotification = async () => {
    const success = await sendNativeNotification(
      '🔔 Shadow Tracker Test Notification',
      'Native Windows notification service is working perfectly!',
      { sound: true, sticky: true }
    );
    if (success) {
      alert('Test notification dispatched! Check your desktop notification area.');
    } else {
      alert('Could not dispatch test notification. Please ensure notifications are allowed in system settings.');
    }
  };

  const [taskTime, setTaskTime] = useState('12:00');
  const [taskMessage, setTaskMessage] = useState('');
  const [taggedTaskId, setTaggedTaskId] = useState('');
  const [taskDays, setTaskDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [habitTime, setHabitTime] = useState('09:00');
  const [habitMessage, setHabitMessage] = useState('');
  const [taggedHabitId, setTaggedHabitId] = useState('');
  const [habitDays, setHabitDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const handleAddTaskReminder = async () => {
    if (!taskTime) return alert('Please select a time for task notification');
    await addReminder({
      title: taskMessage.trim() || 'Task Reminder',
      time: taskTime,
      days: taskDays,
      isEnabled: true,
      type: 'task',
      taskId: taggedTaskId || undefined,
    });
    setTaskMessage('');
    setTaggedTaskId('');
  };

  const handleAddHabitReminder = async () => {
    if (!habitTime) return alert('Please select a time for habit notification');
    await addReminder({
      title: habitMessage.trim() || 'Habit Reminder',
      time: habitTime,
      days: habitDays,
      isEnabled: true,
      type: 'habit',
      habitId: taggedHabitId || undefined,
    });
    setHabitMessage('');
    setTaggedHabitId('');
  };

  const taskReminders = useMemo(() => reminders.filter(r => r.type === 'task' || (!r.type && (r.taskId || (!r.taskId && !r.habitId)))), [reminders]);
  const habitReminders = useMemo(() => reminders.filter(r => r.type === 'habit' || (!r.type && r.habitId)), [reminders]);

  // GitHub Gist File Selection & Sync State
  const [isGitHubPickerOpen, setIsGitHubPickerOpen] = useState(false);
  const [githubGistFiles, setGithubGistFiles] = useState<Array<{ gistId: string; filename: string; description: string; updatedAt: string }>>([]);
  const [isFetchingGistFiles, setIsFetchingGistFiles] = useState(false);

  const getActivePat = () => {
    const pat = (settings.githubPat || githubPatInput || '').trim();
    if (pat && pat !== settings.githubPat) {
      updateSettings({ githubPat: pat });
    }
    return pat;
  };

  const handleOpenPickExistingGitHubFile = async () => {
    const pat = getActivePat();
    if (!pat) return alert('Please enter and save your GitHub PAT first!');
    try {
      setIsFetchingGistFiles(true);
      const files = await listGitHubGistJsonFiles(pat);
      if (files.length === 0) {
        alert('No JSON files found on your GitHub Gists. Click "Create New GitHub JSON" to create one!');
        return;
      }
      setGithubGistFiles(files);
      setIsGitHubPickerOpen(true);
    } catch (e: any) {
      alert('Failed to list GitHub files: ' + (e?.message || 'Check PAT permissions'));
    } finally {
      setIsFetchingGistFiles(false);
    }
  };

  const handleSelectGitHubFile = async (fileItem: { gistId: string; filename: string }) => {
    const pat = getActivePat();
    updateSettings({
      githubGistId: fileItem.gistId,
      githubSyncFile: fileItem.filename,
      githubSyncEnabled: true,
      githubPat: pat,
      lastSyncTimestamp: Date.now(),
    });
    setIsGitHubPickerOpen(false);
    
    const confirmPull = window.confirm(`Linked GitHub file "${fileItem.filename}".\nWould you like to pull and import its data now?`);
    if (confirmPull) {
      handlePullFromCloud();
    } else {
      alert(`Linked GitHub file "${fileItem.filename}". Once-a-day auto sync is active.`);
    }
  };

  const handleCreateNewGitHubFile = async () => {
    const pat = getActivePat();
    if (!pat) return alert('Please enter and save your GitHub PAT first!');

    const defaultName = `ShadowTracker_${new Date().getFullYear()}.json`;
    const nameInput = window.prompt('Enter filename for the new GitHub JSON:', defaultName);
    if (!nameInput) return;

    try {
      setIsSyncing(true);
      const state = useShadowTrackerStore.getState();
      const fullBackup = await dbService.exportAllData(state.settings);
      const result = await createCustomGitHubGist(pat, nameInput, {
        tasks: fullBackup.tasks,
        habits: fullBackup.habits,
        dailyLogs: fullBackup.dailyLogs,
        notes: fullBackup.notes,
        categories: fullBackup.categories,
        reminders: fullBackup.reminders,
        settings: fullBackup.settings,
        moneyData: fullBackup.moneyData,
        unlockedBadges: fullBackup.unlockedBadges,
        version: fullBackup.version,
        exportedAt: fullBackup.exportedAt,
        timestamp: Date.now(),
      });

      updateSettings({
        githubGistId: result.gistId,
        githubSyncFile: result.filename,
        githubSyncEnabled: true,
        githubPat: pat,
        lastSyncTimestamp: Date.now(),
      });
      alert(`✅ Created new GitHub JSON file: "${result.filename}"!\n\nOnce-a-day auto sync is active.`);
    } catch (e: any) {
      alert('Failed to create new GitHub file: ' + (e?.message || 'Check PAT permissions'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSavePat = () => {
    const trimmed = (githubPatInput || '').trim();
    if (!trimmed) return alert('Please enter a GitHub Personal Access Token (PAT)');
    updateSettings({ githubPat: trimmed });
    setGithubPatInput(trimmed);
    alert('GitHub PAT Saved Locally!');
  };

  const handlePushToCloud = async () => {
    const pat = getActivePat();
    if (!pat) return alert('Please enter and save your GitHub PAT first!');
    try {
      setIsSyncing(true);
      const state = useShadowTrackerStore.getState();
      const fullBackup = await dbService.exportAllData(state.settings);
      
      const payload = {
        tasks: fullBackup.tasks,
        habits: fullBackup.habits,
        dailyLogs: fullBackup.dailyLogs,
        notes: fullBackup.notes,
        categories: fullBackup.categories,
        reminders: fullBackup.reminders,
        settings: fullBackup.settings,
        moneyData: fullBackup.moneyData,
        unlockedBadges: fullBackup.unlockedBadges,
        version: fullBackup.version,
        exportedAt: fullBackup.exportedAt,
        timestamp: Date.now()
      };

      if (settings.githubGistId && settings.githubSyncFile) {
        await pushToCloudGistFile(pat, settings.githubGistId, settings.githubSyncFile, payload);
      } else {
        await pushToCloud(pat, payload);
      }

      updateSettings({ lastSyncTimestamp: Date.now() });
      alert('Successfully pushed to Cloud (GitHub Gist)!');
    } catch (e: any) {
      alert('Failed to push to Cloud: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    const pat = getActivePat();
    if (!pat) return alert('Please enter and save your GitHub PAT first!');
    try {
      setIsSyncing(true);
      let data;
      if (settings.githubGistId && settings.githubSyncFile) {
        data = await pullFromCloudGistFile(pat, settings.githubGistId, settings.githubSyncFile);
      } else {
        data = await pullFromCloud(pat);
      }

      if (!data) {
        alert('No backup found for this file on the cloud.');
        return;
      }

      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      const validation = validateAndParseBackupJSON(jsonStr);
      if (!validation.isValid) {
        setCorruptedFileName(settings.githubSyncFile || 'Cloud Gist Sync File');
        setJsonDiagnosticError(validation.error || null);
        return;
      }
      
      const confirmPull = window.confirm(
        `Cloud backup from ${new Date(data.timestamp || validation.data.exportedAt || Date.now()).toLocaleString()}.\nThis will safely merge cloud changes with local updates without data loss. Proceed?`
      );
      if (!confirmPull) return;

      const state = useShadowTrackerStore.getState();
      const localBackup = await dbService.exportAllData(state.settings);

      // Perform Bi-Directional Smart Merge
      const mergedData = smartMergeBackupData(localBackup, data as any);

      // Import merged data into IndexedDB & Store
      await useShadowTrackerStore.getState().importBackup(mergedData as any);

      // Push unified merged state back to cloud Gist
      if (settings.githubGistId && settings.githubSyncFile) {
        await pushToCloudGistFile(pat, settings.githubGistId, settings.githubSyncFile, mergedData as any);
      } else {
        await pushToCloud(pat, mergedData as any);
      }

      // Restore settings while preserving current active PAT
      const activePat = pat;
      let finalSettings = settings;
      if (data.settings) {
        finalSettings = {
          ...data.settings,
          githubPat: activePat,
          githubSyncEnabled: true,
          githubGistId: settings.githubGistId || data.settings.githubGistId,
          githubSyncFile: settings.githubSyncFile || data.settings.githubSyncFile,
        };
        const { settingsStorage } = await import('@/lib/storage');
        settingsStorage.set(finalSettings);
      }

      // Update the zustand store in-memory to reflect the new data
      useShadowTrackerStore.setState({
        tasks: (data.tasks || []).filter((t: any) => !t.isSoftDeleted),
        habits: (data.habits || []).filter((h: any) => !h.isSoftDeleted),
        dailyLogs: data.dailyLogs || [],
        notes: data.notes || [],
        reminders: data.reminders || [],
        categories: data.categories || [],
        settings: finalSettings,
        ...(data.unlockedBadges ? { unlockedBadges: data.unlockedBadges } : {}),
      });

      updateSettings({ lastSyncTimestamp: Date.now() });
      alert('Successfully pulled data from Cloud!');
    } catch (e: any) {
      console.error('Pull from cloud failed:', e);
      alert('Failed to pull from Cloud: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const PRESET_COLORS = useMemo(() => [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#10b981', '#22c55e', '#06b6d4', '#3b82f6', '#64748b',
  ], []);

  const PRESET_ICONS = useMemo(() => [
    'Briefcase', 'User', 'Dumbbell', 'BookOpen', 'DollarSign',
    'CheckCircle', 'Code', 'Heart', 'Sparkles', 'Smile',
    'Star', 'Coffee', 'Target', 'Music',
  ], []);

  const handleExport = useCallback(async () => {
    try {
      const backupData = await dbService.exportAllData(settings);
      const jsonContent = JSON.stringify(backupData, null, 2);
      const filename = `shadow-tracker-full-backup-${getTodayDateString()}.json`;

      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON Backup File',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(jsonContent);
          await writable.close();
          alert('Backup saved successfully! Selected file location updated.');
          return;
        } catch (pickerErr: any) {
          if (pickerErr?.name === 'AbortError') return;
        }
      }

      // Fallback HTML5 anchor download
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Export failed:', e);
      alert('Failed to export local data. Check console.');
    }
  }, [settings]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const validation = validateAndParseBackupJSON(jsonContent);

        if (!validation.isValid) {
          setCorruptedFileName(file.name);
          setJsonDiagnosticError(validation.error || null);
          return;
        }

        await importBackup(validation.data);
        alert('Data backup imported successfully! Reloading to apply all settings and wealth data...');
        window.location.reload();
      } catch (err: any) {
        console.error('Import failed:', err);
        setCorruptedFileName(file.name);
        setJsonDiagnosticError({
          type: 'syntax',
          message: err?.message || 'Unexpected failure reading JSON backup file.',
          suggestion: 'Ensure the file is uncorrupted standard JSON with valid UTF-8 encoding.',
          expectedStructure: '{\n  "version": "1.0.0",\n  "tasks": [],\n  "habits": []\n}',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }, [importBackup]);

  const handleLoadDemoData = useCallback(async () => {
    if (window.confirm('Load 2-Year Extensive Masterclass Demo Dataset? This will populate 730 days of habits, daily logs, notes, 220+ tasks, 24 full months of financial data, 365 days of nutrition & health logs, and Level 25 Master rank.')) {
      try {
        const demoData = generateMassiveTwoYearData();
        await importBackup(demoData);
        alert('2-Year Extensive Demo Dataset loaded successfully! Reloading app...');
        window.location.reload();
      } catch (err) {
        console.error('Failed to load demo data:', err);
      }
    }
  }, [importBackup]);

  const handleReset = useCallback(async () => {
    const confirmReset = window.confirm(
      'Are you absolutely sure you want to reset Shadow-Tracker? All tasks, habits, daily logs, and journal reflections will be permanently deleted. This action cannot be undone.'
    );
    if (confirmReset) {
      await resetAllData();
      alert('Database cleared. Application initialized.');
    }
  }, [resetAllData]);

  const handleResetLifeRpg = useCallback(async () => {
    const confirmReset = window.confirm(
      '⚠️ WARNING: Reset Life RPG Progression?\n\n' +
      'This will reset your Character Level back to Level 1, clear all accumulated RPG XP to 0, and reset your active RPG quest log.\n\n' +
      'Your actual completed tasks, habits, notes, and records will NOT be deleted, but your RPG gamification rank will start fresh from Level 1.\n\n' +
      'Are you sure you wish to proceed?'
    );
    if (confirmReset) {
      await resetLifeRpg();
      alert('⚔️ Life RPG Progression reset. Character Level is now 1 and XP cleared.');
    }
  }, [resetLifeRpg]);

  const handleRecalibrateFromCurrentData = useCallback(async () => {
    const res = await recalibrateFromCurrentData();
    fireConfetti();
    alert(
      `🎯 Recalibration Across Current Data Complete!\n\n` +
      `• RPG Rank: Level ${res.level} — "${res.title}"\n` +
      `• Level XP: ${res.xp} XP\n` +
      `• Achievements Unlocked: ${res.badgesUnlockedCount} / 10 Badges\n\n` +
      `📊 Productivity Footprint Accounted:\n` +
      `• ${res.totalTasksCompleted} Completed Tasks & Standalone ToDos\n` +
      `• ${res.totalHabitCheckoffs} Routine Habit Check-offs\n` +
      `• ${res.totalNotes} Historical Journals & Notes\n\n` +
      `All levels, XP, and badges are now perfectly synchronized with your actual data!`
    );
  }, [recalibrateFromCurrentData]);

  const handleAddCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    await addCategory({
      name: catName.trim(),
      color: catColor,
      icon: catIcon,
    });

    setCatName('');
    setIsCategoryModalOpen(false);
  }, [addCategory, catName, catColor, catIcon]);

  const handleAddSlide = useCallback(() => {
    if (!newSlideQuote.trim()) return;
    const slides = settings.motivationalSlides || [];
    
    const allVibes = ['power', 'wisdom', 'wealth', 'tech', 'health', 'nature', 'vortex', 'topography', 'waves', 'particles', 'prism', 'aurora', 'radar', 'matrix', 'nova', 'dna', 'fractal', 'neon-grid', 'plasma', 'starlight', 'cyber-circuit'];
    const finalVibe = newSlideVibe === 'random' 
      ? allVibes[Math.floor(Math.random() * allVibes.length)]
      : newSlideVibe;

    updateSettings({
      motivationalSlides: [
        ...slides,
        { id: `slide-${Date.now()}`, vibe: finalVibe, quote: newSlideQuote.trim() }
      ]
    });
    setNewSlideVibe('random');
    setNewSlideQuote('');
  }, [newSlideQuote, newSlideVibe, settings.motivationalSlides, updateSettings]);

  const handleDeleteSlide = useCallback((id: string) => {
    const slides = settings.motivationalSlides || [];
    updateSettings({
      motivationalSlides: slides.filter(s => s.id !== id)
    });
  }, [settings.motivationalSlides, updateSettings]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20 } }
  }), []);

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative space-y-8 w-full max-w-[1700px] mx-auto pb-12 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.05]" aria-hidden="true">
        <motion.svg
          className="absolute -top-20 -right-20 text-primary"
          width="320" height="320" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="8" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <rect
              key={angle}
              x="46" y="28"
              width="8" height="10" rx="2"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </motion.svg>
        <motion.svg
          className="absolute -bottom-16 -left-16 text-primary"
          width="240" height="240" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="16" />
          <circle cx="50" cy="50" r="6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="47" y="30"
              width="6" height="9" rx="1.5"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </motion.svg>
      </div>

      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          Control Console
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Lucide.Settings size={28} className="text-primary" />
          </motion.div>
        </h2>
        <p className="text-sm text-foreground font-semibold uppercase tracking-widest mt-1">
          Configure local workspace environment & backup records
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile settings-tile p-6 sm:p-8 space-y-6 relative overflow-hidden lg:col-span-2"
          >
            <TileArtDisplaySettings />
            <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3 mb-4">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lucide.Sliders size={18} />
              </span>
              Display & Interface Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Theme, Alias & Financial Targets */}
              <div className="space-y-5">
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Application Theme</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-surface-elevated/40 backdrop-blur-xl border border-border/70 p-2 rounded-2xl shadow-inner">
                    {(['light', 'obsidian', 'onedark', 'cyberpunk', 'spectrum'] as const).map(themeOption => {
                      const labelMap: Record<string, string> = {
                        light: 'White',
                        obsidian: 'Obsidian',
                        onedark: 'One Dark',
                        cyberpunk: 'Cyberpunk',
                        spectrum: 'Spectrum',
                      };
                      const isSelected = settings.theme === themeOption || 
                        (themeOption === 'spectrum' && (settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple' || !settings.theme)) || 
                        (themeOption === 'light' && settings.theme === 'white');
                      return (
                        <button
                          key={themeOption}
                          type="button"
                          onClick={() => updateSettings({ theme: themeOption })}
                          className={`filter-pill w-full !py-2.5 !text-xs font-black transition-all cursor-pointer ${
                            isSelected ? 'active' : ''
                          }`}
                        >
                          {labelMap[themeOption]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operator Alias</span>
                  <input 
                    type="text" 
                    maxLength={30}
                    value={settings.alias !== undefined ? settings.alias : ''} 
                    onChange={(e) => updateSettings({ alias: e.target.value })}
                    placeholder="Enter your alias..."
                    className="input-field"
                  />
                  <p className="text-[11px] text-muted-foreground">Used across dashboard telemetry as <span className="text-primary font-bold">{settings.alias || 'Shadow'}</span>.</p>
                </div>

                <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Financial Targets</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Savings Target</label>
                      <input 
                        type="number" 
                        value={settings.savingsTarget || ''} 
                        onChange={(e) => updateSettings({ savingsTarget: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 25000"
                        className="input-field font-mono font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Investments Target</label>
                      <input 
                        type="number" 
                        value={settings.investmentsTarget || ''} 
                        onChange={(e) => updateSettings({ investmentsTarget: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 15000"
                        className="input-field font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Scale & Environment Toggles */}
              <div className="space-y-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Global Interface Scale</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {settings.appScale || 100}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground font-bold">A</span>
                    <input 
                      type="range" 
                      min="80" 
                      max="150" 
                      step="5"
                      value={settings.appScale || 100} 
                      onChange={(e) => updateSettings({ appScale: parseInt(e.target.value) })}
                      className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-base text-foreground font-bold">A</span>
                  </div>
                </div>

                {/* Past Routine Activity Fill Window */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Past Activity Fill Window</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {settings.habitGracePeriodDays || 3} {settings.habitGracePeriodDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={settings.habitGracePeriodDays || 3} 
                      onChange={(e) => updateSettings({ habitGracePeriodDays: parseInt(e.target.value, 10) })}
                      className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Number of past days permitted to retroactively check off or log missed habit reflections (1-10 days, default 3).
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-border">
                  {[
                    { id: 'soundEnabled', label: '🔔 Sound Notifications', checked: settings.soundEnabled },
                    { id: 'stickyTaskNotifications', label: '📌 Sticky Task Notifications (YES/NO Actions)', checked: Boolean(settings.stickyTaskNotifications) },
                    { id: 'showCompletedTasks', label: '👁️ Show Completed Tasks', checked: settings.showCompletedTasks },
                    { id: 'ecoMode', label: '🌱 Eco Mode (Freezes All Background Animations & Minimal CPU)', checked: Boolean(settings.ecoMode || settings.lowGpuMode) },
                    { id: 'minimizeToTray', label: '📥 Minimize to System Tray (Eco Suspend)', checked: Boolean(settings.minimizeToTray ?? true) },
                  ].map((setting) => (
                    <label 
                      key={setting.id} 
                      className="group flex items-center justify-between cursor-pointer select-none p-3 rounded-2xl bg-surface-elevated/40 hover:bg-surface-elevated/80 transition-all border border-border/40 hover:border-border/80 gap-3 shadow-2xs"
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex-1 pr-2">{setting.label}</span>
                      <div className={`toggle-track ${setting.checked ? 'active' : ''}`} data-checked={setting.checked}>
                        <div className="toggle-handle" />
                      </div>
                      <input
                        type="checkbox"
                        checked={setting.checked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (setting.id === 'ecoMode') {
                            updateSettings({ ecoMode: checked, lowGpuMode: checked });
                          } else {
                            updateSettings({ [setting.id]: checked });
                          }
                        }}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile settings-tile p-6 sm:p-8 space-y-6 flex flex-col relative overflow-hidden lg:col-span-2"
          >
            <TileArtCategories />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Lucide.FolderTree size={18} />
                </span>
                Workspace Categories
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCategoryModalOpen(true)}
                className="filter-pill active !text-sm !font-bold !px-4 !py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lucide.Plus size={16} />
                Add Category
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                    className="group flex items-center justify-between p-4 bg-surface-elevated/40 hover:bg-surface-elevated/70 backdrop-blur-xl border border-border/60 hover:border-primary/50 rounded-2xl text-sm font-semibold shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: `${cat.color}25` }}>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      </div>
                      <span className="text-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
                    </div>
                    
                    {!(cat.id.startsWith('cat-work') || cat.id.startsWith('cat-personal') || cat.id.startsWith('cat-health') || cat.id.startsWith('cat-study') || cat.id.startsWith('cat-finance') || cat.id.startsWith('cat-habits')) && (
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: -10 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-500 hover:bg-red-500/15 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete category"
                      >
                        <Lucide.Trash2 size={16} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* User-Defined Notifications Section (Tasks & Habits) */}
          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Permission Status Header */}
            <div className="tile settings-tile p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Lucide.BellRing size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Device Notification Engine</h3>
                  <p className="text-xs text-muted-foreground font-medium">Works on Windows (.exe), Android (PWA), Linux & Mac without automated spam.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {notifPermission === 'granted' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <Lucide.CheckCircle size={14} /> Permission Granted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Lucide.AlertCircle size={14} /> {notifPermission === 'denied' ? 'In-App Notifications Active' : 'Pending Enable'}
                  </span>
                )}

                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Lucide.ShieldAlert size={14} /> {notifPermission === 'granted' ? 'Re-test Permission' : 'Enable Notifications'}
                </button>
                <button
                  onClick={handleTestNativeNotification}
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl border border-border/80 hover:bg-secondary/80 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Test native OS notification toast"
                >
                  <Lucide.BellRing size={14} className="text-primary" /> Test Native Notification
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Block 1: Task Notifications */}
              <div className="tile settings-tile p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Lucide.CheckSquare size={16} className="text-primary" /> Task Notifications
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {taskReminders.length} Active
                  </span>
                </div>

                {/* Form */}
                <div className="space-y-4 bg-surface-elevated/40 backdrop-blur-xl p-4 rounded-2xl border border-border/60 shadow-xs">
                  <NiceTimePicker
                    value={taskTime}
                    onChange={setTaskTime}
                    label="Task Alert Clock Time"
                  />

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Tag Task (Optional)</label>
                    <select
                      value={taggedTaskId}
                      onChange={(e) => setTaggedTaskId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-surface-elevated/60 backdrop-blur-md text-foreground rounded-xl border border-border/70 outline-none focus:border-primary truncate cursor-pointer shadow-xs hover:border-primary/50 transition-all"
                    >
                      <option value="">General Task Alert</option>
                      {tasks.filter(t => !t.isCompleted && !t.isSoftDeleted).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Notification Message</label>
                    <input
                      type="text"
                      placeholder="e.g. Focus time! Finish your high priority task."
                      value={taskMessage}
                      onChange={(e) => setTaskMessage(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 bg-surface-elevated/60 backdrop-blur-md text-foreground rounded-xl border border-border/70 outline-none focus:border-primary shadow-xs hover:border-primary/50 transition-all"
                    />
                  </div>

                  <ScheduleSelector
                    selectedDays={taskDays}
                    onChange={setTaskDays}
                    label="Task Schedule Repeat Days"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAddTaskReminder}
                      className="filter-pill active !px-4 !py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Lucide.Plus size={14} /> Add Task Alert
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {taskReminders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 font-medium italic">No task notifications set yet.</p>
                  ) : (
                    taskReminders.map(r => {
                      const taggedTask = tasks.find(t => t.id === r.taskId);
                      const daysText = !r.days || r.days.length === 0 ? 'Once' : r.days.length === 7 ? 'Daily' : r.days.length === 5 && [1,2,3,4,5].every(d=>r.days.includes(d)) ? 'Weekdays' : r.days.length === 2 && r.days.includes(0) && r.days.includes(6) ? 'Weekends' : r.days.length === 1 ? `Mon` : `${r.days.length} Days`;
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-surface-elevated/40 backdrop-blur-md border border-border/60 hover:border-primary/40 rounded-xl text-xs shadow-xs transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-md">{r.time}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{r.title}</p>
                              {taggedTask && <p className="text-[10px] text-muted-foreground font-semibold truncate">Task: {taggedTask.title}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{daysText}</span>
                            <button
                              onClick={() => updateReminder(r.id, { isEnabled: !r.isEnabled })}
                              className={`toggle-track ${r.isEnabled ? 'active' : ''}`}
                              data-checked={r.isEnabled}
                              title={r.isEnabled ? 'Enabled' : 'Disabled'}
                            >
                              <div className="toggle-handle" />
                            </button>
                            <button
                              onClick={() => deleteReminder(r.id)}
                              className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                              title="Delete notification"
                            >
                              <Lucide.Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Block 2: Habit Notifications */}
              <div className="tile settings-tile p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Lucide.Repeat size={16} className="text-primary" /> Habit Notifications
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {habitReminders.length} Active
                  </span>
                </div>

                {/* Form */}
                <div className="space-y-4 bg-surface-elevated/40 backdrop-blur-xl p-4 rounded-2xl border border-border/60 shadow-xs">
                  <NiceTimePicker
                    value={habitTime}
                    onChange={setHabitTime}
                    label="Habit Alert Clock Time"
                  />

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Tag Habit (Optional)</label>
                    <select
                      value={taggedHabitId}
                      onChange={(e) => setTaggedHabitId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-surface-elevated/60 backdrop-blur-md text-foreground rounded-xl border border-border/70 outline-none focus:border-primary truncate cursor-pointer shadow-xs hover:border-primary/50 transition-all"
                    >
                      <option value="">General Habit Alert</option>
                      {habits.filter(h => !h.isSoftDeleted).map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Notification Message</label>
                    <input
                      type="text"
                      placeholder="e.g. Keep your streak alive! Time for habit."
                      value={habitMessage}
                      onChange={(e) => setHabitMessage(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 bg-surface-elevated/60 backdrop-blur-md text-foreground rounded-xl border border-border/70 outline-none focus:border-primary shadow-xs hover:border-primary/50 transition-all"
                    />
                  </div>

                  <ScheduleSelector
                    selectedDays={habitDays}
                    onChange={setHabitDays}
                    label="Habit Schedule Repeat Days"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAddHabitReminder}
                      className="filter-pill active !px-4 !py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Lucide.Plus size={14} /> Add Habit Alert
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {habitReminders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 font-medium italic">No habit notifications set yet.</p>
                  ) : (
                    habitReminders.map(r => {
                      const taggedHabit = habits.find(h => h.id === r.habitId);
                      const daysText = !r.days || r.days.length === 0 ? 'Once' : r.days.length === 7 ? 'Daily' : r.days.length === 5 && [1,2,3,4,5].every(d=>r.days.includes(d)) ? 'Weekdays' : r.days.length === 2 && r.days.includes(0) && r.days.includes(6) ? 'Weekends' : r.days.length === 1 ? `Mon` : `${r.days.length} Days`;
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-surface-elevated/40 backdrop-blur-md border border-border/60 hover:border-primary/40 rounded-xl text-xs shadow-xs transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-md">{r.time}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{r.title}</p>
                              {taggedHabit && <p className="text-[10px] text-muted-foreground font-semibold truncate">Habit: {taggedHabit.name}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{daysText}</span>
                            <button
                              onClick={() => updateReminder(r.id, { isEnabled: !r.isEnabled })}
                              className={`toggle-track ${r.isEnabled ? 'active' : ''}`}
                              data-checked={r.isEnabled}
                              title={r.isEnabled ? 'Enabled' : 'Disabled'}
                            >
                              <div className="toggle-handle" />
                            </button>
                            <button
                              onClick={() => deleteReminder(r.id)}
                              className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                              title="Delete notification"
                            >
                              <Lucide.Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="pt-8 mt-4 border-t border-border relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Data &amp; Sync</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch pt-4">
          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-1 tile settings-tile p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden"
          >
            <div className="absolute -bottom-12 -right-12 text-primary/10 pointer-events-none select-none">
              <motion.svg 
                width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </motion.svg>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Lucide.Database size={18} />
                  </span>
                  Storage Sandbox
                </h3>
                <div className="flex items-center gap-1.5 bg-secondary/80 border border-border/80 px-2 py-0.5 rounded-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">Local-First</span>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground leading-relaxed">
                Manage your offline-first IndexedDB local storage backups and demo datasets:
              </p>
            </div>
            <div className="mt-auto pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-card hover:bg-secondary border border-border text-foreground font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Lucide.Download size={15} className="text-primary" />
                Export JSON
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-card hover:bg-secondary border border-border text-foreground font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Lucide.Upload size={15} className="text-primary" />
                Import JSON
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLoadDemoData}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                title="Load 2-Year Extensive Masterclass Demo Dataset (730 days of telemetry)"
              >
                <Lucide.Sparkles size={15} />
                Load 2-Year Demo
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </motion.div>

          {/* Per-Year Archiving & Purge Tile */}
          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-1 tile settings-tile p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col gap-4">
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Lucide.Archive size={18} />
                </span>
                Per-Year Archiving &amp; Purge
              </h3>
              <p className="text-sm font-medium text-foreground">
                Select a detected year to archive or purge. Purging <strong className="text-primary font-bold">automatically downloads a mandatory backup JSON first</strong> so you can revert anytime.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detected History Years</label>
                <select
                  value={selectedPurgeYear}
                  onChange={(e) => setSelectedPurgeYear(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground font-bold border-2 border-border focus:border-primary transition-all outline-none"
                >
                  {availableYears.length === 0 ? (
                    <option value="">No history years detected</option>
                  ) : (
                    availableYears.map(yr => (
                      <option key={yr} value={yr}>Year {yr} Data</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                disabled={!selectedPurgeYear}
                onClick={handleExportYear}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-secondary border-2 border-border text-foreground font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Lucide.Download size={15} className="text-primary" />
                Export {selectedPurgeYear || 'Year'} JSON
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                disabled={!selectedPurgeYear}
                onClick={handlePurgeYear}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 border-2 border-red-500/40 text-red-500 font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Lucide.Trash2 size={15} className="text-red-500" />
                Purge {selectedPurgeYear || 'Year'} (Auto-Backup)
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-1 tile settings-tile p-4 sm:p-6 md:p-8 flex flex-col gap-5 relative overflow-hidden"
          >
            <TileArtSync />
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Lucide.Cloud size={18} />
                </span>
                GitHub Cloud Sync
              </h3>
              {settings.githubSyncEnabled && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[8.5px] font-bold uppercase tracking-wider">
                  Once Daily / Manual
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-foreground leading-relaxed">
              Sync your data via GitHub Gist JSON files. Everyday once automatically or whenever manual sync button is pressed (no continuous per-change network calls).
            </p>

            <div className="space-y-3 relative z-10">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-foreground ml-1">GitHub PAT (Gist Scope Only)</label>
              <div className="flex items-center gap-2 w-full">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubPatInput}
                  onChange={(e) => setGithubPatInput(e.target.value)}
                  className="input-field flex-1 min-w-0 text-xs sm:text-sm !px-3 sm:!px-4 !py-2.5 sm:!py-3 font-semibold placeholder-foreground/40 outline-none"
                />
                <button
                  onClick={handleSavePat}
                  className="filter-pill active shrink-0 !px-4 sm:!px-6 !py-2.5 sm:!py-3 text-xs font-bold rounded-xl shadow-md cursor-pointer whitespace-nowrap"
                >
                  Save
                </button>
              </div>

              {settings.githubSyncFile && (
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lucide.FileJson size={16} className="text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary truncate">{settings.githubSyncFile}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground ml-2 shrink-0">
                      {settings.lastGithubSyncDate ? `Synced ${settings.lastGithubSyncDate}` : 'Pending Today'}
                    </span>
                  </div>
                </div>
              )}

              <details className="text-xs text-muted-foreground mt-2 group relative z-10 cursor-pointer outline-none">
                <summary className="font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1 w-max outline-none select-none">
                  <Lucide.HelpCircle size={14} /> How to get a PAT?
                </summary>
                <div className="mt-3 p-4 bg-surface-elevated/40 backdrop-blur-xl rounded-xl border border-border space-y-2.5 leading-relaxed shadow-inner">
                  <p>1. Go to <strong>GitHub Settings</strong> &rarr; <strong>Developer settings</strong> &rarr; <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong></p>
                  <p>2. Click <strong className="text-foreground">Generate new token (classic)</strong></p>
                  <p>3. Give it a note, set expiration (e.g. No expiration)</p>
                  <p>4. Check <strong>ONLY</strong> the <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">gist</code> scope</p>
                  <p>5. Click <strong>Generate token</strong> and paste it here.</p>
                </div>
              </details>
            </div>

            {/* Sync Mode Toggle & Live Status Telemetry */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-surface-elevated/40 backdrop-blur-md rounded-2xl border border-border/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Lucide.Zap size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-foreground">Sync on Every App Launch</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically perform bi-directional smart merge whenever Shadow Tracker opens
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ githubSyncOnLaunch: settings.githubSyncOnLaunch === false })}
                  className={`toggle-track ${settings.githubSyncOnLaunch !== false ? 'active' : ''}`}
                  data-checked={settings.githubSyncOnLaunch !== false}
                  title="Toggle App Launch Sync Mode"
                >
                  <div className="toggle-handle" />
                </button>
              </div>

              {/* Live Last Sync Status Telemetry Notification Card */}
              <div className="p-3.5 bg-surface-elevated/40 backdrop-blur-md rounded-2xl border border-border/70 space-y-1.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lucide.Activity size={13} className="text-primary" />
                    Last Sync Status
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {settings.githubSyncOnLaunch !== false ? 'App Launch Mode' : 'Daily 1-Time Mode'}
                  </span>
                </div>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  {settings.lastGithubSyncStatus || (settings.lastSyncTimestamp ? '✓ Bi-directional Smart Sync Active' : 'No sync recorded yet')}
                </p>
                {settings.lastSyncTimestamp && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Lucide.Clock size={12} />
                    Last synced: {new Date(settings.lastSyncTimestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 relative z-10 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateNewGitHubFile}
                  disabled={isSyncing}
                  className="filter-pill active flex items-center justify-center gap-2 !px-3.5 !py-3 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lucide.PlusCircle size={15} />
                  Create New GitHub JSON
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenPickExistingGitHubFile}
                  disabled={isSyncing || isFetchingGistFiles}
                  className="filter-pill flex items-center justify-center gap-2 !px-3.5 !py-3 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lucide.FolderOpen size={15} />
                  {isFetchingGistFiles ? 'Fetching...' : 'Select Existing JSON'}
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePushToCloud}
                  disabled={isSyncing}
                  className="filter-pill flex items-center justify-center gap-2 !px-4 !py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lucide.CloudUpload size={14} className={isSyncing ? 'animate-spin' : ''} />
                  Push Manual
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePullFromCloud}
                  disabled={isSyncing}
                  className="filter-pill flex items-center justify-center gap-2 !px-4 !py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lucide.CloudDownload size={14} className={isSyncing ? 'animate-spin' : ''} />
                  Pull Manual
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* OneDrive / Local File Auto-Sync Tile (Right 1x1) */}
          <OneDriveSyncTile onDiagnosticError={(err, fname) => { setCorruptedFileName(fname); setJsonDiagnosticError(err); }} />

          {/* Mascot Carousel Tile (Full width 2-column expansion) */}
          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-2 tile settings-tile p-6 sm:p-8 space-y-4 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
          >
            <div className="space-y-2 flex-1">
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Lucide.Image size={18} />
                </span>
                Mascot Carousel
              </h3>
              <p className="text-xs text-foreground leading-relaxed font-medium">
                Add your own motivational quotes and vibe themes to the Mascot&apos;s popup carousel. These will complement or override the default slides to keep you focused and motivated!
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMotivationalModalOpen(true)}
              className="filter-pill active !text-xs !font-bold !px-6 !py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Lucide.Settings2 size={16} />
              Manage Slides
            </motion.button>
          </motion.div>
          </div>
        </div>

      <div className="pt-8 mt-4 border-t border-border relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 sm:px-4 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full whitespace-nowrap select-none">
          Achievements Control
        </div>
        
        <motion.div 
          className="tile settings-tile p-6 sm:p-8 space-y-6 mt-4 w-full relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10">
                  <Lucide.Award size={18} />
                </span>
                Gamification & Badges
              </h3>
              <p className="text-sm text-foreground leading-relaxed font-medium max-w-xl">
                Reset your achievements drawer to start fresh from today, or recalculate achievements based on your current workspace data.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRecalibrateFromCurrentData}
                className="filter-pill active flex-1 flex items-center justify-center gap-2.5 !px-5 !py-3.5 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
                title="Recalculate Level, XP, and unlock all badges based on real current data"
              >
                <Lucide.Target size={16} />
                <span>Recalibrate from Current Data</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  useShadowTrackerStore.getState().resetBadges();
                  alert("All achievements have been reset and faded. Start fresh from today!");
                }}
                className="filter-pill flex-1 flex items-center justify-center gap-2 !px-4 !py-3.5 text-rose-400 border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Lucide.RefreshCw size={15} />
                <span>Reset Badges (Wipe)</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── DATA-SAFE VIEW PREFERENCES & INTERFACE RESET ── */}
      <motion.div 
        variants={itemVariants}
        className="tile settings-tile p-6 sm:p-8 space-y-6 relative overflow-hidden border border-emerald-500/30 bg-surface/80 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Lucide.SlidersHorizontal size={18} />
              </span>
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em]">
                Page Views & Filter Preferences
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Data Safe • Non-Destructive
              </span>
            </div>
            <p className="text-sm text-secondary leading-relaxed font-medium max-w-2xl">
              Reset remembered page layouts (ToDo Grid/List, Calendar Month/Week/Timeline, Health sub-tabs, Task workspaces) and filter options back to standard defaults. <strong className="text-foreground">Your actual tasks, habits, health logs, finances, notes, and records remain 100% untouched.</strong>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                resetAllViewPreferences();
                alert('✅ All page views and filter settings have been reset to factory defaults! Your personal data remains completely intact.');
              }}
              className="filter-pill active flex items-center justify-center gap-2 !px-5 !py-3 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              <Lucide.RotateCcw size={15} />
              <span>Reset Views & Filters</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                updateSettings({
                  theme: 'spectrum',
                  soundEnabled: true,
                  stickyTaskNotifications: true,
                  showCompletedTasks: true,
                  appScale: 100,
                  ecoMode: false,
                  lowGpuMode: false,
                });
                resetAllViewPreferences();
                alert('✅ Theme restored to Spectrum and interface preferences reset to default! Your personal data is 100% safe.');
              }}
              className="filter-pill flex items-center justify-center gap-2 !px-5 !py-3 bg-secondary/80 hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border transition-all cursor-pointer"
            >
              <Lucide.Sparkles size={15} className="text-primary" />
              <span>Reset Interface Defaults</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="pt-8 mt-4 border-t border-border relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Danger Zone</div>
        
        <div className="space-y-4 mt-4 w-full">
          {/* Life RPG Reset Tile */}
          <motion.div 
            className="tile settings-tile p-6 sm:p-8 space-y-6 w-full relative overflow-hidden border border-amber-500/30 shadow-lg"
          >
            <TileArtDanger />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-amber-500 uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <Lucide.Crown size={18} />
                  </span>
                  Reset Life RPG Progression
                </h3>
                <p className="text-sm text-foreground leading-relaxed font-medium max-w-xl">
                  Reverts character level back to Level 1, clears accumulated RPG XP, and resets active quests. Your actual tasks, habits, and notes remain untouched.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRecalibrateFromCurrentData}
                  className="filter-pill active flex items-center justify-center gap-2.5 !px-5 !py-3.5 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
                  title="Recalculate Level, XP, and unlock all badges based on real current data"
                >
                  <Lucide.Target size={16} />
                  <span>Recalibrate with Current Data</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetLifeRpg}
                  className="filter-pill flex-shrink-0 flex items-center justify-center gap-2.5 !px-5 !py-3.5 bg-amber-500/10 text-amber-400 font-bold text-xs sm:text-sm rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-sm cursor-pointer"
                >
                  <Lucide.RefreshCw size={16} />
                  <span>Reset RPG (Level 1)</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Database Reset Tile */}
          <motion.div 
            className="tile settings-tile p-6 sm:p-8 space-y-6 w-full relative overflow-hidden"
          >
            <TileArtDanger />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-red-500 uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-red-500/15">
                    <Lucide.AlertOctagon size={18} />
                  </span>
                  Reset Database
                </h3>
                <p className="text-sm text-foreground leading-relaxed font-medium max-w-xl">
                  Deletes schedules, journals, logs, and streaks permanently from this browser.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="filter-pill flex-shrink-0 flex items-center justify-center gap-3 !px-8 !py-4 bg-rose-500/10 text-rose-400 font-bold text-sm rounded-2xl border border-rose-500/30 hover:border-rose-500/60 transition-all shadow-sm cursor-pointer"
              >
                <Lucide.Trash size={18} />
                Reset
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Custom Category"
      >
        <form onSubmit={handleAddCategory} className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-foreground ml-1">Category Name</label>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="e.g. Creative Hobbies"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full text-base px-5 py-4 bg-secondary rounded-2xl text-foreground font-semibold placeholder-foreground/40 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-foreground ml-1">Select Color Badge</label>
            <div className="flex flex-wrap gap-3 p-4 bg-secondary rounded-2xl border-2 border-border shadow-inner">
              {PRESET_COLORS.map(color => {
                const isSelected = catColor === color;
                return (
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    key={color}
                    type="button"
                    onClick={() => setCatColor(color)}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-4 ring-primary/50 ring-offset-2 ring-offset-card shadow-lg shadow-primary/30' : 'hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-card'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-foreground ml-1">Select Category Icon</label>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-4 bg-secondary border-2 border-border rounded-2xl custom-scrollbar shadow-inner">
              {PRESET_ICONS.map(iconName => {
                const isSelected = catIcon === iconName;
                const IconComponent = ((Lucide as unknown) as Record<string, React.ElementType>)[iconName] || Lucide.HelpCircle;
                return (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    key={iconName}
                    type="button"
                    onClick={() => setCatIcon(iconName)}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                        : 'bg-card border-border text-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                    }`}
                  >
                    <IconComponent size={22} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-border pt-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-6 py-3.5 text-sm font-bold text-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-8 py-3.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/25 transition-all"
            >
              Add Category
            </motion.button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isMotivationalModalOpen}
        onClose={() => setIsMotivationalModalOpen(false)}
        title="Manage Motivational Slides"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar pr-2">
            {(settings.motivationalSlides || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary rounded-2xl border border-border border-dashed">
                <Lucide.Image size={32} className="text-foreground mb-3" />
                <p className="text-sm text-foreground font-medium">No custom slides added yet.</p>
              </div>
            ) : (
              (settings.motivationalSlides || []).map((slide) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={slide.id} className="group flex gap-4 items-center bg-secondary border border-border hover:border-primary p-4 rounded-2xl transition-all shadow-sm hover:shadow-md"
                >
                  <div className="px-3 py-1.5 flex items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary uppercase shadow-inner">
                    {slide.vibe || 'GENERAL'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">&quot;{slide.quote}&quot;</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-2 text-red-500 hover:text-red-500 hover:bg-red-500/15 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Lucide.Trash2 size={18} />
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>

          <div className="border-t border-border pt-6 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">Add New Slide</h4>
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground ml-1 uppercase tracking-wider">Vibe Theme</label>
              <select
                value={newSlideVibe}
                onChange={(e) => setNewSlideVibe(e.target.value)}
                className="w-full bg-secondary border-2 border-border text-foreground font-semibold px-5 py-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
              >
                <option value="random">Auto (Random Vibe)</option>
                <option value="power">Power</option>
                <option value="wisdom">Wisdom</option>
                <option value="tech">Technology</option>
                <option value="wealth">Wealth</option>
                <option value="health">Health</option>
                <option value="nature">Nature</option>
                <option value="vortex">Vortex</option>
                <option value="topography">Topography</option>
                <option value="waves">Waves</option>
                <option value="particles">Particles</option>
                <option value="prism">Prism</option>
                <option value="aurora">Aurora</option>
                <option value="radar">Radar</option>
                <option value="matrix">Matrix</option>
                <option value="nova">Nova</option>
                <option value="dna">DNA Helix</option>
                <option value="fractal">Fractal</option>
                <option value="neon-grid">Neon Grid</option>
                <option value="plasma">Plasma</option>
                <option value="starlight">Starlight</option>
                <option value="cyber-circuit">Cyber Circuit</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground ml-1 uppercase tracking-wider">Quote</label>
              <textarea
                placeholder="Enter a powerful quote..."
                maxLength={250}
                value={newSlideQuote}
                onChange={(e) => setNewSlideQuote(e.target.value)}
                rows={3}
                className="w-full text-sm font-semibold px-5 py-4 bg-secondary rounded-2xl text-foreground placeholder-foreground/40 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all shadow-inner"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSlide}
              className="w-full px-6 py-4 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/25 transition-all"
            >
              Add to Carousel
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isGitHubPickerOpen}
        onClose={() => setIsGitHubPickerOpen(false)}
        title="Select Existing GitHub JSON File"
      >
        <div className="space-y-4 pt-3">
          <p className="text-xs text-muted-foreground font-medium">
            Select an existing JSON file stored on your GitHub Gists to link for once-a-day or manual sync:
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {githubGistFiles.map((file) => (
              <div
                key={file.gistId + '_' + file.filename}
                onClick={() => handleSelectGitHubFile(file)}
                className="p-3.5 bg-secondary hover:bg-surface border border-border hover:border-primary rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Lucide.FileJson size={18} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{file.filename}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{file.description}</p>
                  </div>
                </div>
                <Lucide.ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Pinpoint Corrupted JSON Backup Error Diagnostics Modal (Only pops up on error) */}
      <JsonErrorModal
        isOpen={!!jsonDiagnosticError}
        onClose={() => setJsonDiagnosticError(null)}
        diagnostic={jsonDiagnosticError}
        fileName={corruptedFileName}
      />
    </motion.div>
  );
};

export default SettingsFeature;
