'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { GlobalBadgeCelebration } from './GlobalBadgeCelebration';
import { GlobalCelebrationNotice } from './GlobalCelebrationNotice';
import { Lucide } from './icons';
import CommandBar from '@/features/command/CommandBar';
import { AnimeGreeting } from './AnimeGreeting';
import { SidebarArt } from './SidebarArt';
import { ThemeAmbientBackground } from './ThemeAmbientBackground';
import { NotificationScheduler } from './NotificationScheduler';
import { InAppNotificationOverlay } from './InAppNotificationOverlay';
import { useOneDriveAutoSync } from '@/lib/useOneDriveAutoSync';
import { GitHubDailySync } from './GitHubDailySync';
import CustomDialogOverlay from './CustomDialogOverlay';
import { DayReviewModal } from './DayReviewModal';
import dynamic from 'next/dynamic';

const AiAssistantModal = dynamic(() => import('@/features/ai/AiAssistantModal'), { ssr: false });

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

// High-contrast clean app logo SVG — Atom/Electron orbital design (Theme compatible)
function AppLogo({ size = 26, theme = 'onedark' }: { size?: number; theme?: string }) {
  const getThemePalette = () => {
    switch (theme) {
      case 'light':
      case 'white':
        return { r1: '#4f46e5', r2: '#6366f1', r3: '#818cf8', bg: '#4f46e5', core: '#4f46e5', opacity: '0.15' };
      case 'obsidian':
        return { r1: '#0284c7', r2: '#38bdf8', r3: '#7dd3fc', bg: '#0284c7', core: '#0284c7', opacity: '0.25' };
      case 'onedark':
        return { r1: '#60a5fa', r2: '#38bdf8', r3: '#93c5fd', bg: '#60a5fa', core: '#60a5fa', opacity: '0.25' };
      case 'cyberpunk':
        return { r1: '#fb7185', r2: '#38bdf8', r3: '#f43f5e', bg: '#fb7185', core: '#38bdf8', opacity: '0.25' };
      case 'midnight':
      case 'pine':
      case 'purple':
        return { r1: '#6366f1', r2: '#06b6d4', r3: '#f97316', bg: '#6366f1', core: '#ffffff', opacity: '0.2' };
      default:
        return { r1: '#4f46e5', r2: '#38bdf8', r3: '#60a5fa', bg: '#4f46e5', core: '#4f46e5', opacity: '0.2' };
    }
  };

  const p = getThemePalette();

  return (
    <svg
      viewBox="0 0 200 200"
      style={{ width: `${size}px`, height: `${size}px` }}
      fill="none"
      className="shrink-0 transition-all duration-300"
    >
      <circle cx="100" cy="100" r="85" fill={p.bg} opacity={p.opacity} />
      <ellipse
        cx="100"
        cy="100"
        rx="75"
        ry="32"
        stroke={p.r1}
        strokeWidth="14"
        transform="rotate(-30, 100, 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="75"
        ry="32"
        stroke={p.r2}
        strokeWidth="14"
        transform="rotate(30, 100, 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="75"
        ry="32"
        stroke={p.r3}
        strokeWidth="14"
        transform="rotate(90, 100, 100)"
      />
      <circle cx="158" cy="68" r="11" fill={p.r1} />
      <circle cx="42" cy="132" r="11" fill={p.r2} />
      <circle cx="100" cy="25" r="11" fill={p.r3} />
      <circle cx="100" cy="100" r="18" fill={p.core} />
      <circle cx="100" cy="100" r="9" fill="#ffffff" />
    </svg>
  );
}



export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  const { settings, updateSettings, isLoading, dailyLogs } = useShadowTrackerStore();
  const [mounted, setMounted] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [dayReviewModal, setDayReviewModal] = useState<'morning' | 'evening' | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // OneDrive auto-sync
  useOneDriveAutoSync();

  const cycleTheme = () => {
    const themes = ['light', 'obsidian', 'onedark', 'cyberpunk', 'midnight'] as const;
    const currentNorm = (settings.theme === 'white' ? 'light' : (settings.theme === 'pine' || settings.theme === 'purple') ? 'midnight' : settings.theme) as typeof themes[number];
    const currentIndex = themes.indexOf(currentNorm);
    const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  const getThemeIcon = (size: number) => {
    const current = settings.theme;
    if (current === 'light' || current === 'white') {
      return <Lucide.Sun size={size} className="text-amber-500" />;
    }
    if (current === 'midnight' || current === 'pine' || current === 'purple' || current === 'spectrum') {
      return <Lucide.Sparkles size={size} className="text-indigo-400" />;
    }
    if (current === 'obsidian') {
      return <Lucide.Moon size={size} className="text-purple-300" />;
    }
    if (current === 'onedark') {
      return <Lucide.Terminal size={size} className="text-blue-400" />;
    }
    if (current === 'cyberpunk') {
      return <Lucide.Zap size={size} className="text-rose-400" />;
    }
    return <Lucide.Sparkles size={size} className="text-indigo-400" />;
  };

  // Sync theme + scale + eco/low-gpu mode + activeTab
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-white', 'theme-obsidian', 'theme-onedark', 'theme-cyberpunk', 'theme-midnight', 'theme-pine', 'theme-purple', 'theme-spectrum', 'dark', 'light');

    const currentTheme = settings.theme || 'spectrum';
    const isLight = currentTheme === 'light' || currentTheme === 'white';
    const isSpectrum = currentTheme === 'midnight' || currentTheme === 'pine' || currentTheme === 'purple' || currentTheme === 'spectrum';

    const semanticTheme = isLight ? 'white' : (isSpectrum ? 'spectrum' : currentTheme);
    root.setAttribute('data-theme', semanticTheme);
    root.setAttribute('data-active-tab', activeTab);

    if (isLight) {
      root.classList.add('theme-light', 'theme-white', 'light');
    } else if (isSpectrum) {
      root.classList.add('theme-midnight', 'theme-pine', 'theme-purple', 'theme-spectrum', 'dark');
    } else {
      root.classList.add(`theme-${currentTheme}`, 'dark');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (root.style as any).zoom = settings.appScale ? `${settings.appScale}%` : '100%';

    const isEco = Boolean(settings.lowGpuMode || settings.ecoMode);
    if (isEco) {
      root.classList.add('eco-mode', 'low-gpu-mode');
    } else {
      root.classList.remove('eco-mode', 'low-gpu-mode');
    }
  }, [settings.theme, settings.appScale, settings.lowGpuMode, settings.ecoMode, activeTab]);

  // Sync minimizeToTray & ecoMode to Tauri Rust commands + listen for tray eco toggle events
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('set_minimize_to_tray', { enabled: settings.minimizeToTray ?? true }).catch(() => {});
        invoke('set_eco_mode', { enabled: Boolean(settings.lowGpuMode || settings.ecoMode) }).catch(() => {});
      });

      import('@tauri-apps/api/event').then(({ listen }) => {
        const unlisten = listen<{ ecoMode: boolean }>('shadow-tray-eco-toggle', (event) => {
          const enabled = Boolean(event.payload?.ecoMode);
          updateSettings({ lowGpuMode: enabled, ecoMode: enabled });
        });
        return unlisten;
      });
    }
  }, [settings.minimizeToTray, settings.lowGpuMode, settings.ecoMode, updateSettings]);

  // Request notification permission on first launch (non-intrusive, one time)
  useEffect(() => {
    const notifAsked = sessionStorage.getItem('shadow_notif_asked');
    if (notifAsked) return;
    sessionStorage.setItem('shadow_notif_asked', '1');

    // Small delay so the app feels fully loaded first
    const timer = setTimeout(async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch {
        // Fallback for non-Capacitor environments (browser/Tauri)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
    { id: 'todo', label: 'ToDo', icon: 'CheckCircle2' },
    { id: 'habits', label: 'Habits', icon: 'Repeat' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'health', label: 'Health', icon: 'HeartPulse' },
    { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
    { id: 'notes', label: 'Journal', icon: 'BookOpen' },
    { id: 'money', label: 'Wealth', icon: 'Wallet' },
    { id: 'rpg', label: 'Life RPG', icon: 'Crown' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ] as const;

  const todayStr = getTodayDateString();
  const todayLog = dailyLogs.find(l => l.date === todayStr);
  const todayFocus = todayLog?.focusScore ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Lucide.Sparkles className="absolute text-primary animate-pulse" size={18} />
        </div>
        <p className="text-xs tracking-widest text-muted-foreground uppercase font-bold animate-pulse-slow">
          Loading Shadow Space...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen">
      <ThemeAmbientBackground theme={settings.theme} />
      <NotificationScheduler />
      <InAppNotificationOverlay />
      <GlobalCelebrationNotice />
      <GitHubDailySync />
      <CustomDialogOverlay />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bg-surface/80 backdrop-blur-xl border-r border-border/80 pt-7 pb-6 select-none z-30">
        <SidebarArt />

        <div className="flex flex-col h-full relative z-10 px-5 overflow-hidden">
          {/* Logo & AI Assistant Button */}
          <div className="flex items-center justify-between gap-2 px-1 mb-8 shrink-0 relative">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 transition-colors">
                <AppLogo size={32} theme={settings.theme} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-tight whitespace-nowrap">
                  <span className="text-primary truncate max-w-[125px] inline-block align-bottom">{settings.alias ? settings.alias.charAt(0).toUpperCase() + settings.alias.slice(1) : 'Shadow'}</span>
                  <span className="text-white [html[data-theme='white']_&]:text-foreground [html[data-theme='light']_&]:text-foreground"> Tracker</span>
                </h1>
                <span 
                  style={{ fontSize: '7px', lineHeight: '9px' }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full bg-surface-elevated/90 border border-border/70 font-semibold text-muted-foreground tracking-wider uppercase select-none pointer-events-none w-fit"
                >
                  <Lucide.ShieldCheck size={7} className="text-emerald-400" />
                  Privacy First
                </span>
              </div>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm shadow-primary/15 relative shrink-0 group"
              title="Shadow AI Assistant (Autonomous Copilot)"
              aria-label="Open AI Assistant"
            >
              <Lucide.Sparkles size={16} className="group-hover:scale-110 group-hover:rotate-12 transition-transform text-primary" />
              <span style={{ fontSize: '7px' }} className="font-black tracking-wider uppercase text-primary -mt-0.5">AI</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-none pb-4 px-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  data-active={isActive}
                  className={`nav-item w-full ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="text-[13.5px] font-bold tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Section: Focus + Actions (NO AnimeGreeting here - only in Wizard modal) */}
          <div className="flex flex-col gap-4 shrink-0 pt-3 px-1 border-t border-border/50 bg-surface/40 rounded-t-xl mt-2 backdrop-blur-sm">
            {/* Today's Focus Score */}
            <div className="bg-surface-elevated border border-border rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-black text-secondary uppercase tracking-[0.12em]">Today&apos;s Focus</span>
                <span className="text-sm font-extrabold text-primary font-mono">{todayFocus}%</span>
              </div>
              <div className="w-full bg-surface h-2.5 rounded-full overflow-hidden border border-border/50">
                <div
                  className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${todayFocus}%` }}
                />
              </div>
            </div>

            {/* Action buttons section */}
            <div className="space-y-2">
              {/* Full-width spacious Search Button */}
              <button
                onClick={() => setCommandBarOpen(true)}
                className="sidebar-search-btn w-full flex items-center justify-between px-3.5 py-2 bg-surface-elevated hover:bg-surface text-secondary hover:text-foreground rounded-xl text-xs font-bold transition-all border border-border shadow-sm cursor-pointer group"
                title="Search Command Bar (Ctrl + K)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lucide.Search size={14} className="text-secondary group-hover:text-primary transition-colors shrink-0" />
                  <span className="truncate">Search Commands</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-surface border border-border/80 rounded-md text-secondary shadow-xs shrink-0">⌘ K</kbd>
              </button>

              {/* Day Review Launchers */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setDayReviewModal('morning')}
                  className="sidebar-morning-btn flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Start My Day (Morning Briefing)"
                >
                  <Lucide.Sunrise size={13} className="text-amber-700 dark:text-amber-400" />
                  <span>Morning</span>
                </button>
                <button
                  onClick={() => setDayReviewModal('evening')}
                  className="sidebar-evening-btn flex items-center justify-center gap-1.5 px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="End of Day (Evening Reflection)"
                >
                  <Lucide.Sunset size={13} className="text-indigo-700 dark:text-indigo-400" />
                  <span>Evening</span>
                </button>
              </div>

              {/* 3-Column Quick Actions Row */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Wizard Button */}
                <button
                  onClick={() => setActiveTab('wizard')}
                  className={`sidebar-quick-btn flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all border shadow-sm cursor-pointer active:scale-95 min-w-0 ${
                    activeTab === 'wizard'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 ring-1 ring-primary/40'
                      : 'bg-surface-elevated hover:bg-surface text-secondary hover:text-foreground border-border hover:border-primary/40'
                  }`}
                  title="Shadow Wizard Sanctuary"
                  aria-label="Shadow Wizard Mascot"
                >
                  <Lucide.Sparkles size={13} className={`${activeTab === 'wizard' ? 'text-primary-foreground' : 'text-primary'} shrink-0`} />
                  <span className="truncate">Wizard</span>
                </button>

                {/* ToDo Button */}
                <button
                  onClick={() => setActiveTab('todo')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all border shadow-sm cursor-pointer active:scale-95 min-w-0 ${
                    activeTab === 'todo'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                  }`}
                  title="Standalone ToDo"
                  aria-label="Standalone ToDo Page"
                >
                  <Lucide.CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">ToDo</span>
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={cycleTheme}
                  className="sidebar-quick-btn flex items-center justify-center gap-1 px-2 py-1.5 bg-surface-elevated hover:bg-surface border border-border text-secondary hover:text-foreground rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer min-w-0"
                  title="Toggle Theme"
                >
                  {getThemeIcon(13)}
                  <span className="truncate">Theme</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 bg-surface/90 backdrop-blur-xl border-b border-border sticky top-0 z-40 select-none shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <AppLogo size={24} theme={settings.theme} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black tracking-tight leading-tight whitespace-nowrap">
                <span className="text-primary truncate max-w-[95px] inline-block align-bottom">{settings.alias ? settings.alias.charAt(0).toUpperCase() + settings.alias.slice(1) : 'Shadow'}</span>
                <span className="text-white [html[data-theme='white']_&]:text-foreground [html[data-theme='light']_&]:text-foreground"> Tracker</span>
              </span>
              <span 
                style={{ fontSize: '6.5px', lineHeight: '8px' }}
                className="font-semibold tracking-wider uppercase flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded-full bg-surface-elevated/90 border border-border/80 text-muted-foreground w-fit select-none pointer-events-none"
              >
                <Lucide.ShieldCheck size={6.5} className="text-emerald-400" /> PRIVACY FIRST
              </span>
            </div>

            {/* Mobile AI Assistant Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="ml-1 w-8.5 h-8.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm shadow-primary/15 shrink-0 group"
              title="Shadow AI Assistant"
              aria-label="Open AI Assistant"
            >
              <Lucide.Sparkles size={13} className="group-hover:scale-110 transition-transform text-primary" />
              <span style={{ fontSize: '6px' }} className="font-black tracking-wider uppercase text-primary -mt-0.5">AI</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`p-2.5 rounded-xl border shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                activeTab === 'wizard'
                  ? 'bg-primary text-white border-primary shadow-primary/30'
                  : 'bg-surface-elevated text-secondary hover:text-foreground border-border'
              }`}
              aria-label="Shadow Wizard Mascot"
              title="Shadow Wizard Sanctuary"
            >
              <Lucide.Sparkles size={16} className={activeTab === 'wizard' ? 'text-white' : 'text-primary'} />
            </button>

            {/* ToDo Button next to Wizard Button in Android/Mobile Header */}
            <button
              onClick={() => setActiveTab('todo')}
              className={`p-2.5 rounded-xl border shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                activeTab === 'todo'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-400 hover:text-emerald-300 border-emerald-500/40'
              }`}
              aria-label="Standalone ToDo Page"
              title="Standalone ToDo"
            >
              <Lucide.CheckCircle2 size={16} className="text-emerald-400" />
            </button>

            <button
              onClick={() => setCommandBarOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
              aria-label="Search Command Bar"
            >
              <Lucide.Search size={18} />
            </button>

            <button
              onClick={cycleTheme}
              className="p-2.5 bg-surface-elevated text-muted-foreground hover:text-foreground rounded-xl border border-border"
              aria-label="Toggle Theme"
            >
              {getThemeIcon(16)}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8 overflow-x-clip relative z-10">
          <div key={activeTab}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile More Menu */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="md:hidden fixed bottom-20 right-4 left-4 z-50 bg-surface/95 backdrop-blur-2xl border border-border/60 rounded-3xl p-3 shadow-2xl flex flex-col gap-1 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.filter(i => !['dashboard', 'habits', 'tasks'].includes(i.id)).map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMoreMenuOpen(false); }}
                      data-active={isActive}
                      className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl transition-all ${
                        isActive ? 'bg-primary text-white shadow-md' : 'text-foreground bg-surface-elevated border border-border/40 hover:bg-surface'
                      }`}
                    >
                      <Icon size={24} className={isActive ? 'stroke-[2.5px] text-white' : 'text-primary/90'} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Tab Nav Bar — Rounded Glossy Navigation Dock */}
      {(() => {
        const isMoreTabActive = !['dashboard', 'habits', 'tasks'].includes(activeTab);
        const activeMoreItem = navItems.find(i => i.id === activeTab) || (activeTab === 'wizard' ? { id: 'wizard', label: 'Wizard', icon: 'Sparkles' } : null);
        const MoreActiveIcon = activeMoreItem ? ((Lucide[activeMoreItem.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType) : null;

        return (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex w-full bg-surface/90 backdrop-blur-2xl border-t border-border/60 px-2 py-1.5 justify-between select-none shadow-2xl items-center gap-1 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
            {/* 1. Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}
              className={`mobile-nav-btn flex-1 ${!isMoreMenuOpen && activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Dashboard"
            >
              <Lucide.LayoutDashboard size={19} className={!isMoreMenuOpen && activeTab === 'dashboard' ? 'stroke-[2.5px]' : 'opacity-80'} />
              <span className="text-[10px] font-bold tracking-tight leading-none truncate max-w-full">Dashboard</span>
            </button>

            {/* 2. Habits */}
            <button
              onClick={() => { setActiveTab('habits'); setIsMoreMenuOpen(false); }}
              className={`mobile-nav-btn flex-1 ${!isMoreMenuOpen && activeTab === 'habits' ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Habits"
            >
              <Lucide.Repeat size={19} className={!isMoreMenuOpen && activeTab === 'habits' ? 'stroke-[2.5px]' : 'opacity-80'} />
              <span className="text-[10px] font-bold tracking-tight leading-none truncate max-w-full">Habits</span>
            </button>

            {/* 3. Search Center Button - Elevated pill with NO surrounding rectangular box */}
            <button
              type="button"
              onClick={() => setCommandBarOpen(true)}
              className="mobile-nav-btn-center group cursor-pointer shrink-0 border-0 outline-none ring-0 bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', border: 'none', boxShadow: 'none', background: 'transparent', backgroundColor: 'transparent', WebkitAppearance: 'none', appearance: 'none' }}
              aria-label="Search & Commands"
              title="Search Commands (⌘K)"
            >
              <div className="center-search-icon-wrapper">
                <Lucide.Search size={20} className="transition-transform group-hover:scale-110 group-active:scale-95 text-white" />
              </div>
              <span className="text-[9px] font-extrabold tracking-tight leading-none text-muted-foreground mt-0.5">⌘K</span>
            </button>

            {/* 4. Tasks */}
            <button
              onClick={() => { setActiveTab('tasks'); setIsMoreMenuOpen(false); }}
              className={`mobile-nav-btn flex-1 ${!isMoreMenuOpen && activeTab === 'tasks' ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Tasks"
            >
              <Lucide.CheckSquare size={19} className={!isMoreMenuOpen && activeTab === 'tasks' ? 'stroke-[2.5px]' : 'opacity-80'} />
              <span className="text-[10px] font-bold tracking-tight leading-none truncate max-w-full">Tasks</span>
            </button>

            {/* 5. More Menu */}
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`mobile-nav-btn flex-1 ${isMoreMenuOpen || isMoreTabActive ? 'active' : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="More features menu"
            >
              <div className="relative flex items-center justify-center">
                <Lucide.Menu size={19} className={isMoreMenuOpen || isMoreTabActive ? 'stroke-[2.5px]' : 'opacity-80'} />
                {isMoreTabActive && MoreActiveIcon && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs border border-surface text-[8px] animate-in fade-in zoom-in-75 duration-200">
                    <MoreActiveIcon size={8} className="stroke-[2.5px]" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-none truncate max-w-full">
                {isMoreTabActive && activeMoreItem ? activeMoreItem.label : 'More'}
              </span>
            </button>
          </nav>
        );
      })()}

      {/* Command Bar */}
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setCommandBarOpen(false);
        }}
      />

      {/* Shadow Wizard Modal - AnimeGreeting ONLY shown here when Wizard button clicked */}
      {isWizardModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 overflow-hidden pointer-events-auto transform-gpu"
          onClick={() => setIsWizardModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-y-auto max-h-[85vh] text-foreground space-y-4 my-auto select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 shadow-md">
                  <Lucide.Sparkles size={20} className="text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">Shadow Wizard</h3>
                  <p className="text-[11px] font-medium text-cyan-300/80">Daily Wisdom &amp; Focus Motivation</p>
                </div>
              </div>
              <button
                onClick={() => setIsWizardModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Lucide.X size={18} />
              </button>
            </div>

            <div className="py-2">
              <AnimeGreeting />
            </div>
          </div>
        </div>
      )}

      {/* Day Review Modal (Morning Briefing / Evening Reflection) */}
      <DayReviewModal
        isOpen={dayReviewModal !== null}
        mode={dayReviewModal || 'morning'}
        onClose={() => setDayReviewModal(null)}
        onJumpToTask={(taskId) => {
          setDayReviewModal(null);
          setActiveTab('tasks');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: { taskId } }));
          }, 50);
        }}
      />

      {/* Autonomous Shadow AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
