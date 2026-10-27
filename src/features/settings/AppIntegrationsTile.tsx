'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lucide } from '@/components/icons';
import { motion } from 'framer-motion';
import { fireConfetti } from '@/lib/confetti';
import Modal from '@/components/Modal';
import { parseStreakBackup, mergeStreakDataIntoApp, StreakMergeSummary } from '@/lib/integrations/streakImporter';
import { parseGymManeBackup, mergeGymManeDataIntoApp, GymManeMergeSummary } from '@/lib/integrations/gymmaneImporter';
import {
  hasFileSystemAccess,
  saveIntegrationHandle,
  getIntegrationHandle,
  verifyReadPermission,
  removeIntegrationHandle,
  syncIntegrationFile,
  setCachedIntegrationFile,
  IntegrationSyncStatus,
} from '@/lib/integrations/integrationAutoSync';
import { useShadowTrackerStore } from '@/store';

const TileArtIntegrations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08] select-none z-0">
    <svg className="w-full h-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
      <circle cx="25" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
      <circle cx="75" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
      <line x1="39" y1="50" x2="61" y2="50" stroke="currentColor" strokeWidth="0.5" />
      <polygon points="48,47 52,50 48,53" fill="currentColor" />
      <polygon points="52,47 48,50 52,53" fill="currentColor" />
    </svg>
  </div>
);

export const AppIntegrationsTile: React.FC = () => {
  const store = useShadowTrackerStore();
  const settings = store.settings;
  const updateSettings = store.updateSettings;

  const streakInputRef = useRef<HTMLInputElement>(null);
  const gymmaneInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingStreak, setIsLoadingStreak] = useState(false);
  const [isLoadingGymMane, setIsLoadingGymMane] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Result modal state (for manual imports)
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: 'streak' | 'gymmane';
    streakSummary?: StreakMergeSummary;
    gymmaneSummary?: GymManeMergeSummary;
    fileName: string;
  }>({
    isOpen: false,
    type: 'streak',
    fileName: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to background sync telemetry
  useEffect(() => {
    const handleStatusEvent = (e: CustomEvent<IntegrationSyncStatus>) => {
      const detail = e.detail;
      if (detail.status === 'synced' && (detail.itemsUpdated || detail.itemsAdded)) {
        const typeName = detail.type === 'streak' ? 'Streak' : 'GymMane';
        setSyncNotice(`${typeName} auto-synced: +${detail.itemsAdded || 0} added, ${detail.itemsUpdated || 0} updated`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    };

    window.addEventListener('shadow_integration_sync_status' as any, handleStatusEvent);
    return () => {
      window.removeEventListener('shadow_integration_sync_status' as any, handleStatusEvent);
    };
  }, []);

  // Handle Streak File Upload (Manual)
  const handleStreakFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoadingStreak(true);
      setErrorMessage(null);
      setCachedIntegrationFile('streak', file);

      const parsed = await parseStreakBackup(file);
      const summary = await mergeStreakDataIntoApp(parsed, { silent: false, autoDownload: false });

      updateSettings({
        streakAutoSyncFileName: file.name,
        streakLastModified: file.lastModified,
        streakLastSyncTimestamp: Date.now(),
      });

      fireConfetti();
      setResultModal({
        isOpen: true,
        type: 'streak',
        streakSummary: summary,
        fileName: file.name,
      });
    } catch (err: any) {
      console.error('Streak import error:', err);
      setErrorMessage(`Streak Import Failed: ${err.message || 'Unable to parse backup file'}`);
    } finally {
      setIsLoadingStreak(false);
      if (streakInputRef.current) streakInputRef.current.value = '';
    }
  };

  // Handle GymMane File Upload (Manual)
  const handleGymManeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoadingGymMane(true);
      setErrorMessage(null);
      setCachedIntegrationFile('gymmane', file);

      const parsed = await parseGymManeBackup(file);
      const summary = await mergeGymManeDataIntoApp(parsed, { silent: false, autoDownload: false });

      updateSettings({
        gymmaneAutoSyncFileName: file.name,
        gymmaneLastModified: file.lastModified,
        gymmaneLastSyncTimestamp: Date.now(),
      });

      fireConfetti();
      setResultModal({
        isOpen: true,
        type: 'gymmane',
        gymmaneSummary: summary,
        fileName: file.name,
      });
    } catch (err: any) {
      console.error('GymMane import error:', err);
      setErrorMessage(`GymMane Import Failed: ${err.message || 'Unable to parse backup file'}`);
    } finally {
      setIsLoadingGymMane(false);
      if (gymmaneInputRef.current) gymmaneInputRef.current.value = '';
    }
  };

  // File Picker for Streak (Used when explicitly clicking Select File or Change)
  const handlePickStreakFile = async (enableAutoSync = false) => {
    if (hasFileSystemAccess()) {
      try {
        setIsLoadingStreak(true);
        setErrorMessage(null);
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Streak Backup (*.zip, *.json, all files)',
              accept: {
                'application/json': ['.json'],
                'application/zip': ['.zip'],
                'application/octet-stream': ['.zip', '.json', '.backup', '.bak', '.bin', '.dat'],
              },
            },
          ],
          excludeAcceptAllOption: false,
          multiple: false,
        });

        if (handle) {
          const file = await handle.getFile();
          setCachedIntegrationFile('streak', file);
          await saveIntegrationHandle('streak', handle);
          const parsed = await parseStreakBackup(file);
          const summary = await mergeStreakDataIntoApp(parsed, { silent: false, autoDownload: false });

          updateSettings({
            streakAutoSyncEnabled: enableAutoSync ? true : Boolean(settings.streakAutoSyncEnabled),
            streakAutoSyncFileName: file.name,
            streakLastModified: file.lastModified,
            streakLastSyncTimestamp: Date.now(),
          });

          fireConfetti();
          setResultModal({
            isOpen: true,
            type: 'streak',
            streakSummary: summary,
            fileName: file.name,
          });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[Streak File Picker Error]:', err);
          setErrorMessage(`Streak Selection Failed: ${err.message || 'Unable to access file'}`);
        }
      } finally {
        setIsLoadingStreak(false);
      }
    } else {
      streakInputRef.current?.click();
    }
  };

  // Toggle Auto-Sync for Streak (Zero folder dialogs: purely toggles & autosyncs the selected file)
  const handleToggleStreakAutoSync = async () => {
    if (settings.streakAutoSyncEnabled) {
      // Turn OFF
      updateSettings({ streakAutoSyncEnabled: false });
      setSyncNotice('Streak Auto-Sync paused');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    // Turn ON
    updateSettings({ streakAutoSyncEnabled: true });
    setSyncNotice(`Streak Auto-Sync enabled for "${settings.streakAutoSyncFileName || 'selected file'}"`);
    setTimeout(() => setSyncNotice(null), 3500);

    // Silently check & sync the selected file right away (0 folder popups)
    try {
      await syncIntegrationFile('streak', { force: false });
    } catch (err) {
      console.warn('[Streak AutoSync Initial Check]:', err);
    }
  };

  const handleUnlinkStreak = async () => {
    try {
      await removeIntegrationHandle('streak');
    } catch {}
    updateSettings({
      streakAutoSyncEnabled: false,
      streakAutoSyncFileName: undefined,
      streakLastModified: undefined,
      streakLastSyncTimestamp: undefined,
    });
    setSyncNotice('Streak backup file unlinked');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // File Picker for GymMane (Used when explicitly clicking Select File or Change)
  const handlePickGymManeFile = async (enableAutoSync = false) => {
    if (hasFileSystemAccess()) {
      try {
        setIsLoadingGymMane(true);
        setErrorMessage(null);
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'GymMane Backup (*.json, *.zip, all files)',
              accept: {
                'application/json': ['.json'],
                'application/zip': ['.zip'],
                'application/octet-stream': ['.json', '.zip', '.backup', '.bak', '.bin', '.dat'],
              },
            },
          ],
          excludeAcceptAllOption: false,
          multiple: false,
        });

        if (handle) {
          const file = await handle.getFile();
          setCachedIntegrationFile('gymmane', file);
          await saveIntegrationHandle('gymmane', handle);
          const parsed = await parseGymManeBackup(file);
          const summary = await mergeGymManeDataIntoApp(parsed, { silent: false, autoDownload: false });

          updateSettings({
            gymmaneAutoSyncEnabled: enableAutoSync ? true : Boolean(settings.gymmaneAutoSyncEnabled),
            gymmaneAutoSyncFileName: file.name,
            gymmaneLastModified: file.lastModified,
            gymmaneLastSyncTimestamp: Date.now(),
          });

          fireConfetti();
          setResultModal({
            isOpen: true,
            type: 'gymmane',
            gymmaneSummary: summary,
            fileName: file.name,
          });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[GymMane File Picker Error]:', err);
          setErrorMessage(`GymMane Selection Failed: ${err.message || 'Unable to access file'}`);
        }
      } finally {
        setIsLoadingGymMane(false);
      }
    } else {
      gymmaneInputRef.current?.click();
    }
  };

  // Toggle Auto-Sync for GymMane (Zero folder dialogs: purely toggles & autosyncs the selected file)
  const handleToggleGymManeAutoSync = async () => {
    if (settings.gymmaneAutoSyncEnabled) {
      updateSettings({ gymmaneAutoSyncEnabled: false });
      setSyncNotice('GymMane Auto-Sync paused');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    // Turn ON
    updateSettings({ gymmaneAutoSyncEnabled: true });
    setSyncNotice(`GymMane Auto-Sync enabled for "${settings.gymmaneAutoSyncFileName || 'selected file'}"`);
    setTimeout(() => setSyncNotice(null), 3500);

    // Silently check & sync the selected file right away (0 folder popups)
    try {
      await syncIntegrationFile('gymmane', { force: false });
    } catch (err) {
      console.warn('[GymMane AutoSync Initial Check]:', err);
    }
  };

  const handleUnlinkGymMane = async () => {
    try {
      await removeIntegrationHandle('gymmane');
    } catch {}
    updateSettings({
      gymmaneAutoSyncEnabled: false,
      gymmaneAutoSyncFileName: undefined,
      gymmaneLastModified: undefined,
      gymmaneLastSyncTimestamp: undefined,
    });
    setSyncNotice('GymMane backup file unlinked');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // Manual Trigger to force check right now
  const handleForceSyncStreak = async () => {
    setIsLoadingStreak(true);
    try {
      const res = await syncIntegrationFile('streak', { force: true });
      if (res.status === 'synced') {
        setSyncNotice(`Streak checked: ${res.itemsAdded || 0} added, ${res.itemsUpdated || 0} updated`);
      } else if (res.status === 'error') {
        setErrorMessage(res.errorMessage || 'Sync check failed');
      }
    } finally {
      setIsLoadingStreak(false);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  const handleForceSyncGymMane = async () => {
    setIsLoadingGymMane(true);
    try {
      const res = await syncIntegrationFile('gymmane', { force: true });
      if (res.status === 'synced') {
        setSyncNotice(`GymMane checked: ${res.itemsAdded || 0} added, ${res.itemsUpdated || 0} updated`);
      } else if (res.status === 'error') {
        setErrorMessage(res.errorMessage || 'Sync check failed');
      }
    } finally {
      setIsLoadingGymMane(false);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };

  const formatLastSync = (ts?: number) => {
    if (!ts) return 'Never';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="lg:col-span-2 tile settings-tile p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <TileArtIntegrations />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lucide.Workflow size={18} />
              </span>
              External App Integrations (Streak &amp; GymMane)
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Seamless one-way sync from external backup files into Shadow Tracker. Automatically watches file timestamps, updates matching items, and appends new telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <Lucide.ShieldCheck size={12} /> One-Way Ingestion
            </span>
          </div>
        </div>

        {syncNotice && (
          <div className="relative z-10 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5 animate-fadeIn">
            <Lucide.CheckCircle2 size={15} className="shrink-0" />
            <span className="font-semibold">{syncNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="relative z-10 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-400 flex items-start gap-2.5">
            <Lucide.AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Sync Notice: </strong>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-500/20 rounded cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Lucide.X size={14} />
            </button>
          </div>
        )}

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
          {/* Card 1: Streak */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-secondary/30 border border-border/80 hover:border-primary/40 transition-all space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    <Lucide.Flame size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground tracking-wide">Streak Integration</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">InlitX/streak</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground">
                  .zip / .json / backup
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Syncs Streak backup files directly into Shadow Tracker:
              </p>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lucide.CheckSquare size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    Streak <strong>To-Dos</strong> &rarr; <span className="text-primary font-bold">Simple Tasks</span> (updates matching names)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lucide.Zap size={13} className="text-amber-500 shrink-0" />
                  <span>
                    Streak <strong>Habits</strong> &rarr; <span className="text-primary font-bold">Habits</span> (unions streak dates)
                  </span>
                </div>
              </div>

              {/* Selected File Visibility Box */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Selected Backup File
                </span>

                {settings.streakAutoSyncFileName ? (
                  <div className="p-3 rounded-xl bg-surface-elevated/90 border border-amber-500/30 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            settings.streakAutoSyncEnabled
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          <Lucide.FileCheck size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="font-mono text-xs font-bold text-foreground truncate max-w-[170px] sm:max-w-[220px]"
                              title={settings.streakAutoSyncFileName}
                            >
                              {settings.streakAutoSyncFileName}
                            </span>
                            {settings.streakAutoSyncEnabled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live Sync
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-secondary text-muted-foreground border border-border shrink-0">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                            <span>
                              Synced: <strong className="text-foreground">{formatLastSync(settings.streakLastSyncTimestamp)}</strong>
                            </span>
                            {settings.streakLastModified && (
                              <span>
                                &bull; Modified:{' '}
                                {new Date(settings.streakLastModified).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {settings.streakAutoSyncEnabled && (
                          <button
                            type="button"
                            onClick={handleForceSyncStreak}
                            disabled={isLoadingStreak}
                            className="px-2.5 py-1 rounded-lg !bg-emerald-500 hover:!bg-emerald-600 !text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                            title="Check file for modifications right now"
                          >
                            <Lucide.RefreshCw size={11} className={isLoadingStreak ? 'animate-spin' : ''} />
                            Sync
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePickStreakFile(Boolean(settings.streakAutoSyncEnabled))}
                          disabled={isLoadingStreak}
                          className="px-2.5 py-1 rounded-lg filter-pill !text-foreground text-[10px] font-semibold cursor-pointer transition-all"
                          title="Choose a different Streak backup file"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleUnlinkStreak}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Unlink file"
                        >
                          <Lucide.Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-secondary/20 border border-dashed border-border/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Lucide.FileQuestion size={16} className="text-muted-foreground/60 shrink-0" />
                      <span className="truncate">No Streak file selected yet</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickStreakFile(false)}
                      disabled={isLoadingStreak}
                      className="px-3 py-1.5 rounded-xl !bg-amber-500 hover:!bg-amber-600 !text-white text-[11px] font-bold cursor-pointer transition-all shadow-xs shrink-0"
                    >
                      Select File
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-Sync Toggle Control */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lucide.RefreshCw
                        size={12}
                        className={settings.streakAutoSyncEnabled ? 'text-emerald-400 animate-spin-slow' : 'text-muted-foreground'}
                      />
                      Automatic Sync
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Watches file timestamp &amp; syncs on modification
                    </span>
                  </div>

                  <div
                    className={`toggle-track ${settings.streakAutoSyncEnabled ? 'active' : ''}`}
                    data-checked={Boolean(settings.streakAutoSyncEnabled)}
                    onClick={handleToggleStreakAutoSync}
                    role="switch"
                    aria-checked={Boolean(settings.streakAutoSyncEnabled)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleToggleStreakAutoSync();
                      }
                    }}
                  >
                    <div className="toggle-handle" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <input
                ref={streakInputRef}
                type="file"
                accept="*/*,.zip,.json,application/zip,application/json"
                onChange={handleStreakFile}
                className="hidden"
                id="streak-file-input"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => (hasFileSystemAccess() ? handlePickStreakFile(false) : streakInputRef.current?.click())}
                disabled={isLoadingStreak}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 !bg-amber-500 hover:!bg-amber-600 !text-white !border-amber-400 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingStreak ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing Streak Backup...</span>
                  </>
                ) : (
                  <>
                    <Lucide.Upload size={14} />
                    <span>Import Streak File Manually</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Card 2: GymMane */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-secondary/30 border border-border/80 hover:border-primary/40 transition-all space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
                    <Lucide.Dumbbell size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground tracking-wide">GymMane Integration</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">InlitX/GymMane</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground">
                  .json / .zip
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Syncs GymMane logs directly into Health &amp; Nutrition:
              </p>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lucide.Droplets size={13} className="text-sky-400 shrink-0" />
                  <span>
                    Water Sips &rarr; <span className="text-primary font-bold">Hydration Logs &amp; Totals</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lucide.Utensils size={13} className="text-emerald-400 shrink-0" />
                  <span>
                    Food Log &rarr; <span className="text-primary font-bold">Nutrition Plate &amp; Macros</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lucide.Pill size={13} className="text-purple-400 shrink-0" />
                  <span>
                    Supplements &rarr; <span className="text-primary font-bold">Daily Supplements</span>
                  </span>
                </div>
              </div>

              {/* Selected File Visibility Box */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Selected Backup File
                </span>

                {settings.gymmaneAutoSyncFileName ? (
                  <div className="p-3 rounded-xl bg-surface-elevated/90 border border-sky-500/30 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            settings.gymmaneAutoSyncEnabled
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          <Lucide.FileCheck size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="font-mono text-xs font-bold text-foreground truncate max-w-[170px] sm:max-w-[220px]"
                              title={settings.gymmaneAutoSyncFileName}
                            >
                              {settings.gymmaneAutoSyncFileName}
                            </span>
                            {settings.gymmaneAutoSyncEnabled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live Sync
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-secondary text-muted-foreground border border-border shrink-0">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                            <span>
                              Synced: <strong className="text-foreground">{formatLastSync(settings.gymmaneLastSyncTimestamp)}</strong>
                            </span>
                            {settings.gymmaneLastModified && (
                              <span>
                                &bull; Modified:{' '}
                                {new Date(settings.gymmaneLastModified).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {settings.gymmaneAutoSyncEnabled && (
                          <button
                            type="button"
                            onClick={handleForceSyncGymMane}
                            disabled={isLoadingGymMane}
                            className="px-2.5 py-1 rounded-lg !bg-emerald-500 hover:!bg-emerald-600 !text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                            title="Check file for modifications right now"
                          >
                            <Lucide.RefreshCw size={11} className={isLoadingGymMane ? 'animate-spin' : ''} />
                            Sync
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePickGymManeFile(Boolean(settings.gymmaneAutoSyncEnabled))}
                          disabled={isLoadingGymMane}
                          className="px-2.5 py-1 rounded-lg filter-pill !text-foreground text-[10px] font-semibold cursor-pointer transition-all"
                          title="Choose a different GymMane backup file"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleUnlinkGymMane}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Unlink file"
                        >
                          <Lucide.Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-secondary/20 border border-dashed border-border/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Lucide.FileQuestion size={16} className="text-muted-foreground/60 shrink-0" />
                      <span className="truncate">No GymMane file selected yet</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickGymManeFile(false)}
                      disabled={isLoadingGymMane}
                      className="px-3 py-1.5 rounded-xl !bg-sky-500 hover:!bg-sky-600 !text-white text-[11px] font-bold cursor-pointer transition-all shadow-xs shrink-0"
                    >
                      Select File
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-Sync Toggle Control */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lucide.RefreshCw
                        size={12}
                        className={settings.gymmaneAutoSyncEnabled ? 'text-sky-400 animate-spin-slow' : 'text-muted-foreground'}
                      />
                      Automatic Sync
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Watches file timestamp &amp; syncs on modification
                    </span>
                  </div>

                  <div
                    className={`toggle-track ${settings.gymmaneAutoSyncEnabled ? 'active' : ''}`}
                    data-checked={Boolean(settings.gymmaneAutoSyncEnabled)}
                    onClick={handleToggleGymManeAutoSync}
                    role="switch"
                    aria-checked={Boolean(settings.gymmaneAutoSyncEnabled)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleToggleGymManeAutoSync();
                      }
                    }}
                  >
                    <div className="toggle-handle" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <input
                ref={gymmaneInputRef}
                type="file"
                accept="*/*,.json,.zip,application/json,application/zip"
                onChange={handleGymManeFile}
                className="hidden"
                id="gymmane-file-input"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => (hasFileSystemAccess() ? handlePickGymManeFile(false) : gymmaneInputRef.current?.click())}
                disabled={isLoadingGymMane}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 !bg-sky-500 hover:!bg-sky-600 !text-white !border-sky-400 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingGymMane ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing GymMane Backup...</span>
                  </>
                ) : (
                  <>
                    <Lucide.Upload size={14} />
                    <span>Import GymMane File Manually</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Import Summary Modal (Clean, informative, NO auto-download popup) */}
      <Modal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        title={resultModal.type === 'streak' ? 'Streak Import Complete' : 'GymMane Import Complete'}
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Lucide.CheckCircle2 size={20} />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Workspace Successfully Updated!</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All records from <strong className="text-foreground">{resultModal.fileName}</strong> have been peacefully
                merged into your workspace. Existing records remain 100% intact.
              </p>
            </div>
          </div>

          {/* Streak Metrics Breakdown */}
          {resultModal.type === 'streak' && resultModal.streakSummary && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                <span className="text-2xl font-black text-primary">
                  {resultModal.streakSummary.tasksAdded}
                </span>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Simple Tasks Added
                </p>
                {resultModal.streakSummary.tasksUpdated > 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                    ({resultModal.streakSummary.tasksUpdated} existing updated)
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                <span className="text-2xl font-black text-primary">
                  {resultModal.streakSummary.habitsAdded + resultModal.streakSummary.habitsMerged}
                </span>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Habits Synced ({resultModal.streakSummary.habitsAdded} new, {resultModal.streakSummary.habitsMerged} merged)
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Total Simple Tasks in Workspace:</span>
                <strong className="text-foreground font-bold">{resultModal.streakSummary.totalSimpleTasksNow}</strong>
              </div>
            </div>
          )}

          {/* GymMane Metrics Breakdown */}
          {resultModal.type === 'gymmane' && resultModal.gymmaneSummary && (
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
                <span className="text-xl font-black text-sky-400">
                  {resultModal.gymmaneSummary.waterSipsAdded}
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Water Sips
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
                <span className="text-xl font-black text-emerald-400">
                  {resultModal.gymmaneSummary.foodsAdded}
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Food Logs {resultModal.gymmaneSummary.foodsUpdated > 0 ? `(${resultModal.gymmaneSummary.foodsUpdated} upd)` : ''}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/80">
                <span className="text-xl font-black text-purple-400">
                  {resultModal.gymmaneSummary.supplementsAdded}
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Supplements
                </p>
              </div>

              <div className="col-span-3 p-3 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Unique Calendar Dates Updated in Nutrition Tab:</span>
                <strong className="text-foreground font-bold">{resultModal.gymmaneSummary.datesAffected}</strong>
              </div>
            </div>
          )}

          {/* Clean Done Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
