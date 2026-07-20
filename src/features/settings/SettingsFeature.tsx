'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { dbService } from '@/lib/storage';
import { getTodayDateString } from '@/lib/dateUtils';
import Modal from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { pushToCloud, pullFromCloud } from '@/lib/gistSync';

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

export const SettingsFeature: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    importBackup,
    categories,
    addCategory,
    deleteCategory,
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

  const handleSavePat = () => {
    updateSettings({ githubPat: githubPatInput });
    alert('GitHub PAT Saved Locally!');
  };

  const handlePushToCloud = async () => {
    if (!settings.githubPat) return alert('Please save your GitHub PAT first!');
    try {
      setIsSyncing(true);
      const state = useShadowTrackerStore.getState();
      await pushToCloud(settings.githubPat, {
        tasks: state.tasks,
        habits: state.habits,
        dailyLogs: state.dailyLogs,
        notes: state.notes,
        categories: state.categories,
        timestamp: Date.now()
      });
      updateSettings({ lastSyncTimestamp: Date.now() });
      alert('Successfully pushed to Cloud (GitHub Gist)!');
    } catch (e: any) {
      alert('Failed to push to Cloud: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!settings.githubPat) return alert('Please save your GitHub PAT first!');
    try {
      setIsSyncing(true);
      const data = await pullFromCloud(settings.githubPat);
      if (!data) {
        alert('No backup found for this year on the cloud.');
        return;
      }
      
      const confirmPull = window.confirm(
        `Cloud backup from ${new Date(data.timestamp).toLocaleString()}.\nThis will overwrite your local data. Proceed?`
      );
      if (!confirmPull) return;

      // Write directly to IndexedDB, bypassing importBackup validation
      const { STORES } = await import('@/lib/storage');

      // Clear and re-populate each store
      for (const [storeName, items] of [
        [STORES.TASKS, data.tasks],
        [STORES.HABITS, data.habits],
        [STORES.DAILY_LOGS, data.dailyLogs],
        [STORES.NOTES, data.notes],
        [STORES.CATEGORIES, data.categories],
      ] as const) {
        await dbService.clear(storeName as any);
        for (const item of (items || [])) {
          await dbService.put(storeName as any, item);
        }
      }

      // Update the zustand store in-memory to reflect the new data
      useShadowTrackerStore.setState({
        tasks: (data.tasks || []).filter((t: any) => !t.isSoftDeleted),
        habits: (data.habits || []).filter((h: any) => !h.isSoftDeleted),
        dailyLogs: data.dailyLogs || [],
        notes: data.notes || [],
        categories: data.categories || [],
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
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `shadow-tracker-backup-${getTodayDateString()}.json`);
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
        const backupData = JSON.parse(jsonContent);
        await importBackup(backupData);
        alert('Data backup imported successfully!');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import file. Verify it is a valid shadow-tracker backup JSON.');
      }
    };
    reader.readAsText(file);
  }, [importBackup]);

  const handleReset = useCallback(async () => {
    const confirmReset = window.confirm(
      'Are you absolutely sure you want to reset shadow-tracker? All tasks, habits, daily logs, and journal reflections will be permanently deleted. This action cannot be undone.'
    );
    if (confirmReset) {
      await resetAllData();
      alert('Database cleared. Application initialized.');
    }
  }, [resetAllData]);

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
      className="relative space-y-8 max-w-5xl mx-auto pb-12 overflow-hidden"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile p-6 sm:p-8 space-y-6 relative overflow-hidden"
          >
            <TileArtDisplaySettings />
            <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lucide.Sliders size={18} />
              </span>
              Display Settings
            </h3>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">Application Theme</span>
              <div className="flex flex-wrap gap-2 bg-secondary border border-border p-2 rounded-2xl">
                {(['light', 'obsidian', 'onedark', 'cyberpunk', 'midnight'] as const).map(themeOption => {
                  const labelMap = {
                    light: 'White',
                    obsidian: 'Obsidian',
                    onedark: 'One Dark',
                    cyberpunk: 'Cyberpunk',
                    midnight: 'Fox',
                  };
                  const isSelected = settings.theme === themeOption;
                  return (
                    <motion.button
                      key={themeOption}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateSettings({ theme: themeOption })}
                      className={`relative flex-1 min-w-[100px] px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                        isSelected 
                          ? 'text-foreground' 
                          : 'text-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="theme-bubble"
                          className="absolute inset-0 bg-surface rounded-xl shadow-sm border border-border"
                          transition={{ type: "spring" as const, bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{labelMap[themeOption]}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-5 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Operator Alias</span>
              <input 
                type="text" 
                value={settings.alias || 'Shadow'} 
                onChange={(e) => updateSettings({ alias: e.target.value })}
                placeholder="Enter your alias..."
                className="w-full text-base px-4 py-2.5 bg-black/50 border border-border focus:border-primary/50 rounded-xl text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all shadow-inner"
              />
              <p className="text-xs text-muted-foreground">This alias will be used by Nexus Prime and the dashboard as <span className="text-primary font-bold">{settings.alias || 'Shadow'}</span>.</p>
            </div>

            <div className="flex flex-col gap-3 pt-5 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Monthly Financial Targets</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Savings Target</label>
                  <input 
                    type="number" 
                    value={settings.savingsTarget || ''} 
                    onChange={(e) => updateSettings({ savingsTarget: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 25000"
                    className="w-full text-sm px-4 py-2.5 bg-black/50 border border-border focus:border-primary/50 rounded-xl text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Investments Target</label>
                  <input 
                    type="number" 
                    value={settings.investmentsTarget || ''} 
                    onChange={(e) => updateSettings({ investmentsTarget: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 15000"
                    className="w-full text-sm px-4 py-2.5 bg-black/50 border border-border focus:border-primary/50 rounded-xl text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Setting these targets enables the <span className="text-teal-400 font-bold">Wealth Master</span> achievement once met for the month.</p>
            </div>

            <div className="flex flex-col gap-4 pt-5 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Global Interface Scale</span>
                <motion.span 
                  key={settings.appScale}
                  initial={{ scale: 1.2, color: 'var(--color-primary)' }}
                  animate={{ scale: 1, color: 'var(--color-foreground)' }}
                  className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full"
                >
                  {settings.appScale || 100}%
                </motion.span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-foreground font-bold">A</span>
                <input 
                  type="range" 
                  min="80" 
                  max="150" 
                  step="5"
                  value={settings.appScale || 100} 
                  onChange={(e) => updateSettings({ appScale: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer hover:bg-secondary transition-colors"
                />
                <span className="text-base text-foreground font-bold">A</span>
              </div>
            </div>

            <div className="space-y-2 pt-5 border-t border-border">
              {[
                { id: 'soundEnabled', label: 'Sound Notifications', checked: settings.soundEnabled },
                { id: 'showCompletedTasks', label: 'Show Completed Tasks', checked: settings.showCompletedTasks },
              ].map((setting) => (
                <motion.label 
                  key={setting.id} 
                  whileHover={{ x: 6, backgroundColor: 'var(--color-secondary)' }} 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }} 
                  className="group flex items-center justify-between cursor-pointer select-none p-3.5 -mx-3.5 rounded-2xl hover:bg-secondary transition-all border border-transparent hover:border-border"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{setting.label}</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 shadow-inner ${setting.checked ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <motion.div
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-shadow ${setting.checked ? 'shadow-primary/50' : 'shadow-black/10'}`}
                      animate={{ x: setting.checked ? 22 : 4 }}
                      transition={{ type: "spring" as const, stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <input
                    type="checkbox"
                    checked={setting.checked}
                    onChange={(e) => updateSettings({ [setting.id]: e.target.checked })}
                    className="sr-only"
                  />
                </motion.label>
              ))}
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile p-6 sm:p-8 space-y-6 flex flex-col relative overflow-hidden"
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
                className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
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
                    className="group flex items-center justify-between p-4 bg-secondary hover:bg-secondary border border-border hover:border-border rounded-2xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
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

          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="lg:col-span-2 tile p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Lucide.Image size={18} />
                </span>
                Mascot Carousel
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMotivationalModalOpen(true)}
                className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Lucide.Settings2 size={16} />
                Manage Slides
              </motion.button>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-medium">
              Add your own powerful quotes and vibe themes to the Mascot&apos;s popup carousel. These will complement or override the defaults to keep you motivated!
            </p>
          </motion.div>
        </div>

        <div className="pt-8 mt-4 border-t border-border relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Data & Sync</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch pt-4">
          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile p-6 sm:p-8 space-y-6"
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

            <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lucide.Database size={18} />
              </span>
              Storage Sandbox
            </h3>

            <div className="relative z-10 bg-secondary border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              </span>
              <div>
                <p className="text-sm font-extrabold text-foreground">Local-first mode</p>
                <p className="text-xs text-foreground uppercase tracking-widest font-bold mt-1">Privacy-Safe</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-card hover:bg-secondary border-2 border-border hover:border-border text-foreground font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.Download size={18} className="text-primary" />
                Export Backup (JSON)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleImportClick}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-card hover:bg-secondary border-2 border-border hover:border-border text-foreground font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.Upload size={18} className="text-primary" />
                Import Backup (JSON)
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

          <motion.div 
            variants={itemVariants}
            transition={{ type: "spring" as const, stiffness: 300 }}
            className="tile p-6 sm:p-8 space-y-6 relative overflow-hidden"
          >
            <TileArtSync />
            <h3 className="text-base font-bold text-foreground uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lucide.Cloud size={18} />
              </span>
              Cloud Sync (GitHub Gist)
            </h3>

            <p className="text-sm font-medium text-foreground">
              Sync your data across devices seamlessly using a private GitHub Gist. Your data is stored dynamically per-year. 
            </p>

            <div className="space-y-3 relative z-10">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-foreground ml-1">GitHub PAT (Gist Scope Only)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubPatInput}
                  onChange={(e) => setGithubPatInput(e.target.value)}
                  className="flex-1 text-sm px-4 py-3 bg-secondary rounded-xl text-foreground font-semibold placeholder-foreground/40 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                <button
                  onClick={handleSavePat}
                  className="px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md transition-all hover:scale-105"
                >
                  Save
                </button>
              </div>
              <details className="text-xs text-muted-foreground mt-2 group relative z-10 cursor-pointer outline-none">
                <summary className="font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-1 w-max outline-none select-none">
                  <Lucide.HelpCircle size={14} /> How to get a PAT?
                </summary>
                <div className="mt-3 p-4 bg-background/80 rounded-xl border border-border space-y-2.5 leading-relaxed shadow-inner">
                  <p>1. Go to <strong>GitHub Settings</strong> &rarr; <strong>Developer settings</strong> &rarr; <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong></p>
                  <p>2. Click <strong className="text-foreground">Generate new token (classic)</strong></p>
                  <p>3. Give it a note, set expiration (e.g. No expiration)</p>
                  <p>4. Check <strong>ONLY</strong> the <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">gist</code> scope</p>
                  <p>5. Click <strong>Generate token</strong> and paste it here.</p>
                </div>
              </details>
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-2">
              <span>Last Synced: {settings.lastSyncTimestamp ? new Date(settings.lastSyncTimestamp).toLocaleString() : 'Never'}</span>
              {isSyncing && <span className="animate-pulse text-primary">Syncing...</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePushToCloud}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 bg-card hover:bg-secondary border-2 border-border hover:border-primary text-foreground font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.CloudUpload size={18} className="text-primary" />
                Push to Cloud
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePullFromCloud}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 bg-card hover:bg-secondary border-2 border-border hover:border-primary text-foreground font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.CloudDownload size={18} className="text-primary" />
                Pull from Cloud
              </motion.button>
            </div>
          </motion.div>

                  </div>
      </div>

      <div className="pt-8 mt-4 border-t border-border relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Achievements Control</div>
        
        <motion.div 
          className="tile p-6 sm:p-8 space-y-6 mt-4 w-full relative overflow-hidden"
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
                onClick={() => {
                  useShadowTrackerStore.getState().resetBadges();
                  alert("All achievements have been reset and faded. Start fresh from today!");
                }}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 bg-red-500/10 text-red-500 hover:bg-red-500/15 border-2 border-red-500/20 hover:border-red-500/40 font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.RefreshCw size={16} />
                Reset Badges
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  useShadowTrackerStore.getState().restoreBadges();
                  alert("Achievements successfully recalculated and restored based on your current data!");
                }}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 bg-primary/10 text-primary hover:bg-primary/15 border-2 border-primary/20 hover:border-primary/40 font-bold text-sm rounded-2xl shadow-sm transition-all"
              >
                <Lucide.Sparkles size={16} />
                Restore Badges
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pt-8 mt-4 border-t border-border relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full py-1">Danger Zone</div>
        
        <motion.div 
          className="tile p-6 sm:p-8 space-y-6 mt-4 w-full relative overflow-hidden"
        >
          <TileArtDanger />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-red-500/10 text-red-500 font-bold text-sm rounded-2xl border-2 border-red-500/20 hover:border-red-500/40 transition-all shadow-sm"
            >
              <Lucide.Trash size={18} />
              Reset
            </motion.button>
          </div>
        </motion.div>
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
    </motion.div>
  );
};

export default SettingsFeature;
