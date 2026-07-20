'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { Lucide } from './icons';
import CommandBar from '@/features/command/CommandBar';
import { AnimeGreeting } from './AnimeGreeting';
import { SidebarArt } from './SidebarArt';
import { ThemeAmbientBackground } from './ThemeAmbientBackground';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
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

  const cycleTheme = () => {
    const themes = ['light', 'obsidian', 'onedark', 'cyberpunk', 'midnight'] as const;
    const currentIndex = themes.indexOf(settings.theme as typeof themes[number]);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  const getThemeIcon = (size: number) => {
    switch (settings.theme) {
      case 'light':
        return (
          <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="text-[#ea580c] fill-none stroke-current animate-pulse" strokeWidth="2.2">
            <path d="M 50,15 C 38,40 22,65 15,85 C 30,80 43,62 50,42 C 57,62 70,80 85,85 C 78,65 62,40 50,15 Z" />
            <path d="M 32,80 C 43,84 57,84 68,80 C 60,70 50,68 50,68 C 50,68 40,70 32,80 Z" fill="currentColor" opacity="0.3" />
          </svg>
        );
      case 'obsidian':
        return (
          <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="text-[#a855f7] fill-none stroke-current animate-pulse" strokeWidth="2.2">
            <polygon points="25,35 15,10 33,25" />
            <polygon points="75,35 85,10 67,25" />
            <polygon points="50,45 33,25 67,25" />
            <polygon points="50,60 42,80 50,85" />
            <polygon points="50,60 58,80 50,85" />
          </svg>
        );
      case 'onedark':
        return (
          <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="text-[#5299d3] fill-none stroke-current animate-pulse" strokeWidth="2.2">
            <polygon points="50,20 45,30 55,30" />
            <polygon points="45,30 20,25 35,45" />
            <polygon points="55,30 80,25 65,45" />
            <polygon points="50,38 35,45 50,65" />
            <polygon points="50,38 65,45 50,65" />
          </svg>
        );
      case 'cyberpunk':
        return <Lucide.Zap size={size} className="text-yellow-400 fill-yellow-400 animate-pulse" />;
      case 'midnight':
        return (
          <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="text-orange-400 fill-none stroke-current animate-pulse" strokeWidth="2.2">
            <polygon points="20,30 35,10 40,40" />
            <polygon points="80,30 65,10 60,40" />
            <polygon points="50,45 35,30 65,30" />
            <polygon points="50,85 35,65 50,45" />
            <polygon points="50,85 65,65 50,45" />
          </svg>
        );
      default:
        return <Lucide.Moon size={size} />;
    }
  };

  const getLogoIcon = (size: number) => {
    if (settings.theme === 'midnight') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="fill-none stroke-current" strokeWidth="2">
          <polygon points="20,30 35,10 40,40" />
          <polygon points="80,30 65,10 60,40" />
          <polygon points="50,45 35,30 65,30" />
          <polygon points="50,45 35,30 20,45" />
          <polygon points="50,45 65,30 80,45" />
          <polygon points="50,85 35,65 50,45" />
          <polygon points="50,85 65,65 50,45" />
          <polygon points="50,85 47,80 53,80" fill="currentColor"/>
        </svg>
      );
    }
    if (settings.theme === 'onedark') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="fill-none stroke-current" strokeWidth="1.8">
          <polygon points="50,20 45,30 55,30" />
          <polygon points="50,38 45,30 55,30" />
          <polygon points="45,30 40,25 50,20" />
          <polygon points="55,30 60,25 50,20" />
          <polygon points="50,38 47,45 53,45" fill="currentColor" />
          <polygon points="45,30 20,25 35,45" />
          <polygon points="35,45 10,35 25,60" />
          <polygon points="20,70 15,80 35,65" />
          <polygon points="55,30 80,25 65,45" />
          <polygon points="65,45 90,35 75,60" />
          <polygon points="80,70 85,80 65,65" />
          <polygon points="50,38 35,45 50,65" />
          <polygon points="50,38 65,45 50,65" />
          <polygon points="50,65 35,65 50,85" />
          <polygon points="50,65 65,65 50,85" />
          <polygon points="50,85 45,95 55,95" />
        </svg>
      );
    }
    if (settings.theme === 'obsidian') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="fill-none stroke-current" strokeWidth="2">
          <polygon points="25,35 15,10 33,25" />
          <polygon points="75,35 85,10 67,25" />
          <polygon points="50,45 33,25 67,25" />
          <polygon points="50,45 33,25 25,35" />
          <polygon points="50,45 67,25 75,35" />
          <polygon points="50,45 25,35 30,55" />
          <polygon points="50,45 75,35 70,55" />
          <polygon points="50,45 30,55 50,60" />
          <polygon points="50,45 70,55 50,60" />
          <polygon points="50,60 30,55 42,80" />
          <polygon points="50,60 70,55 58,80" />
          <polygon points="50,60 42,80 50,85" />
          <polygon points="50,60 58,80 50,85" />
          <polygon points="30,55 25,35 15,50" />
          <polygon points="70,55 75,35 85,50" />
          <polygon points="30,55 15,50 42,80" />
          <polygon points="70,55 85,50 58,80" />
          <polygon points="50,85 46,80 54,80" fill="currentColor" />
        </svg>
      );
    }
    if (settings.theme === 'light') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: `${size}px`, height: `${size}px` }} className="fill-none stroke-current animate-pulse text-[#ea580c]" strokeWidth="1.8">
          <path d="M 50,15 C 38,40 22,65 15,85 C 30,80 43,62 50,42 C 57,62 70,80 85,85 C 78,65 62,40 50,15 Z" />
          <path d="M 32,80 C 43,84 57,84 68,80 C 60,70 50,68 50,68 C 50,68 40,70 32,80 Z" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    return <Lucide.Sparkles size={size} />;
  };

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clear all existing theme classes
    root.classList.remove('theme-light', 'theme-obsidian', 'theme-onedark', 'theme-cyberpunk', 'theme-midnight', 'dark', 'light');
    
    // Add current theme class
    root.classList.add(`theme-${settings.theme}`);
    
    // Apply Global App Scale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (root.style as any).zoom = settings.appScale ? `${settings.appScale}%` : '100%';
    
    // Add dark/light class helper for general browser/Tailwind features
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
  }, [settings.theme, settings.appScale]);

  // Sync keyboard shortcuts (Cmd+K / Ctrl+K opens command bar, D -> dashboard, T -> tasks, H -> habits, C -> calendar, A -> analytics, N -> journal, S -> settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command / Control + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(prev => !prev);
      }
      
      // Prevent shortcut interference in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Quick tab shifts
      if (e.key === 'g') {
        // Double key combo helper could be built, but let's support standard key letters
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
    { id: 'habits', label: 'Habits', icon: 'Repeat' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
    { id: 'notes', label: 'Journal', icon: 'BookOpen' },
    { id: 'money', label: 'Money', icon: 'DollarSign' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ] as const;

  // Find today's focus score
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface/80 backdrop-blur-xl border-r border-border/80 px-5 py-8 justify-between select-none z-10 overflow-hidden">
        {/* Ambient Sidebar Art */}
        <SidebarArt />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 mb-10 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-xl shadow-primary/20">
              {getLogoIcon(18)}
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-foreground"><span className="text-primary">{settings.alias || 'shadow'}</span>-tracker</h1>
              <span className="text-[11px] text-muted-foreground font-bold tracking-[0.15em] uppercase">PRIVACY FIRST</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-[13px] font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated hover:scale-[1.01]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'stroke-[2.5px]' : ''} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Footer + Mascot */}
        <div className="flex flex-col gap-6 relative z-10">
          {/* User / Focus Score Footer */}
          <div className="space-y-5">
            <div className="bg-surface-elevated border border-border rounded-2xl p-4.5 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Today&apos;s Focus</span>
                <span className="text-sm font-bold text-primary">{todayFocus}%</span>
              </div>
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border/50">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${todayFocus}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5 px-1">
               <button
                onClick={cycleTheme}
                className="p-2.5 bg-surface-elevated hover:bg-surface border border-transparent hover:border-border text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm"
                title="Toggle Theme"
              >
                {getThemeIcon(16)}
              </button>

              <button
                onClick={() => setCommandBarOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-surface-elevated hover:bg-surface text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all border border-border shadow-sm"
              >
                <Lucide.Search size={14} />
                <span>⌘K</span>
              </button>
            </div>
          </div>
          
          {/* Full-sized Minion Mascot in Sidebar */}
          <div className="w-full flex-shrink-0">
            <AnimeGreeting />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-surface/90 backdrop-blur-xl border-b border-border sticky top-0 z-40 select-none shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
            {getLogoIcon(16)}
          </div>
          <span className="text-sm font-extrabold tracking-tight text-foreground"><span className="text-primary">{settings.alias || 'shadow'}</span>-tracker</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCommandBarOpen(true)}
            className="p-2.5 bg-surface-elevated text-muted-foreground hover:text-foreground rounded-xl border border-border"
            aria-label="Search Command Bar"
          >
            <Lucide.Search size={16} />
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
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8 overflow-x-hidden relative z-10">
        {children}
      </main>

      {/* Mobile More Menu Popup */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            {/* Backdrop to close menu when clicking outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
            />
            {/* Menu Items */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="md:hidden fixed bottom-20 right-4 left-4 z-50 bg-surface/95 backdrop-blur-2xl border border-border/60 rounded-3xl p-3 shadow-2xl flex flex-col gap-1 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.filter(i => !['dashboard', 'tasks', 'habits', 'money'].includes(i.id)).map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl transition-all ${
                        isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'text-foreground bg-secondary/30 border border-border/40 hover:bg-secondary/60'
                      }`}
                    >
                      <Icon size={24} className={isActive ? 'stroke-[2.5px]' : ''} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Tab Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex w-full bg-surface/95 backdrop-blur-xl border-t border-border px-2 py-2 justify-between select-none shadow-2xl items-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.filter(item => ['dashboard', 'tasks', 'habits', 'money'].includes(item.id)).map((item) => {
          const isActive = activeTab === item.id;
          const Icon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-[2px] py-1 flex-1 transition-all ${
                isActive ? 'text-primary scale-110' : 'text-muted-foreground scale-95'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
              <span className="text-[10px] font-bold tracking-tighter leading-none line-clamp-1 mt-1">{item.label}</span>
            </button>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex flex-col items-center justify-center gap-[2px] py-1 flex-1 transition-all ${
            isMoreMenuOpen ? 'text-primary scale-110' : 'text-muted-foreground scale-95'
          }`}
        >
          <Lucide.Menu size={20} className={isMoreMenuOpen ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] font-bold tracking-tighter leading-none line-clamp-1 mt-1">More</span>
        </button>
      </nav>

      {/* Command Bar Modal */}
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setCommandBarOpen(false);
        }}
      />
    </div>
  );
};

export default Layout;
