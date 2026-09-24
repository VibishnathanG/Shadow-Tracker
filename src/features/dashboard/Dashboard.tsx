'use client';
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/purity */
// Force turbopack cache invalidation
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { fireConfetti } from '@/lib/confetti';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { format } from 'date-fns';
import { getMascotStatus, getContextualCoaching, ALL_BADGES, BadgeDefinition, getWispCustomLines, getAllWispLines } from '@/lib/quotes';
import ExplorerFeature from '@/features/explorer/ExplorerFeature';
import { DayReviewModal } from '@/components/DayReviewModal';
import { renderCritterComponent, CritterType, ALL_CRITTERS, DashboardIdleCrittersOverlay } from '@/components/AmbientCritters';

// --- Tile Hologram GIF-Art ---
const useIsEco = () => useShadowTrackerStore((s) => Boolean(s.settings.ecoMode || s.settings.lowGpuMode || s.settings.disableGpuAcceleration));

const TileArtCompanion = ({ variant = 0, cycleTrigger = 0 }: { variant?: number; cycleTrigger?: number }) => {
  const isEco = useIsEco();
  const [activeCritter, setActiveCritter] = useState<CritterType | null>(null);
  const [critterKey, setCritterKey] = useState<number>(0);

  // Trigger roaming critter whenever user cycles quote or clicks card
  useEffect(() => {
    if (isEco || cycleTrigger === 0) return;
    const chosen = ALL_CRITTERS[cycleTrigger % ALL_CRITTERS.length];
    setActiveCritter(chosen);
    setCritterKey((k) => k + 1);
    const timer = setTimeout(() => setActiveCritter(null), 6500);
    return () => clearTimeout(timer);
  }, [cycleTrigger, isEco]);

  // Periodic random ambient critter (awakens every 36s, reduced frequency so it's not too often)
  useEffect(() => {
    if (isEco) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const chosen = ALL_CRITTERS[Math.floor(Math.random() * ALL_CRITTERS.length)];
      setActiveCritter(chosen);
      setCritterKey((k) => k + 1);
      setTimeout(() => setActiveCritter(null), 6500);
    }, 36000);
    return () => clearInterval(interval);
  }, [isEco]);

  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Base Harmonic Ambient Glow Field */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_65%)]" />

      {/* Dynamic Abstract Art synchronized with active Wisp Animation Form */}
      {variant === 0 && (
        // Form 0: Celestial Float - Ethereal floating harmonic wave ripples and levitating starlight orbs
        <svg className="w-full h-full absolute inset-0 opacity-40 [html[data-theme='white']_&]:opacity-25" viewBox="0 0 400 200" preserveAspectRatio="none">
          <motion.path
            d="M 0 100 Q 100 40 200 100 T 400 100"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            animate={{ d: [
              "M 0 100 Q 100 40 200 100 T 400 100",
              "M 0 90 Q 100 130 200 90 T 400 90",
              "M 0 100 Q 100 40 200 100 T 400 100"
            ]}}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M 0 140 Q 120 80 240 140 T 400 130"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.8"
            opacity="0.6"
            animate={{ d: [
              "M 0 140 Q 120 80 240 140 T 400 130",
              "M 0 120 Q 120 160 240 120 T 400 140",
              "M 0 140 Q 120 80 240 140 T 400 130"
            ]}}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle cx="310" cy="50" r="18" fill="var(--primary)" opacity="0.12" animate={{ scale: [1, 1.25, 1], y: [-6, 6, -6] }} transition={{ duration: 6, repeat: Infinity }} />
          <motion.circle cx="80" cy="150" r="14" fill="var(--primary)" opacity="0.1" animate={{ scale: [1, 1.3, 1], y: [6, -6, 6] }} transition={{ duration: 5.5, repeat: Infinity }} />
        </svg>
      )}

      {variant === 1 && (
        // Form 1: Orbital Synergy - Concentric mathematical gyroscope rings and orbiting celestial particles
        <svg className="w-full h-full absolute inset-0 opacity-45 [html[data-theme='white']_&]:opacity-30" viewBox="0 0 400 200">
          <motion.circle
            cx="320" cy="100" r="65"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeDasharray="8 6"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "320px 100px" }}
          />
          <motion.circle
            cx="320" cy="100" r="45"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.7"
            animate={{ rotate: -360 }}
            transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "320px 100px" }}
          />
          <motion.circle
            cx="320" cy="35" r="3"
            fill="var(--primary)"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "320px 100px" }}
          />
          <motion.circle
            cx="70" cy="60" r="28"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.8"
            strokeDasharray="6 6"
            opacity="0.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "70px 60px" }}
          />
        </svg>
      )}

      {variant === 2 && (
        // Form 2: Prismatic Sentinel - Faceted geometric prism mesh with subtle holographic beam
        <svg className="w-full h-full absolute inset-0 opacity-40 [html[data-theme='white']_&]:opacity-25" viewBox="0 0 400 200">
          <defs>
            <linearGradient id="prismLaser" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="310,30 360,60 360,130 310,160 260,130 260,60" fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
          <polygon points="310,48 345,70 345,120 310,142 275,120 275,70" fill="var(--primary)" opacity="0.08" stroke="var(--primary)" strokeWidth="0.8" />
          <motion.rect
            x="240" y="20" width="140" height="8"
            fill="url(#prismLaser)"
            animate={{ y: [20, 150, 20] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <line x1="0" y1="100" x2="200" y2="100" stroke="var(--primary)" strokeWidth="0.6" strokeDasharray="4 8" opacity="0.4" />
        </svg>
      )}

      {variant === 3 && (
        // Form 3: Astral Sparkle - Radiant starlight constellations with breathing cosmos flares
        <svg className="w-full h-full absolute inset-0 opacity-45 [html[data-theme='white']_&]:opacity-30" viewBox="0 0 400 200">
          <line x1="280" y1="60" x2="330" y2="120" stroke="var(--primary)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4" />
          <line x1="330" y1="120" x2="370" y2="70" stroke="var(--primary)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4" />
          <line x1="60" y1="80" x2="120" y2="130" stroke="var(--primary)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4" />
          {[
            { cx: 280, cy: 60, r: 2.5, d: 2 },
            { cx: 330, cy: 120, r: 3, d: 2.4 },
            { cx: 370, cy: 70, r: 2, d: 1.8 },
            { cx: 60, cy: 80, r: 2.2, d: 2.2 },
            { cx: 120, cy: 130, r: 2.8, d: 2.6 },
            { cx: 200, cy: 40, r: 1.8, d: 3 }
          ].map((pt, idx) => (
            <motion.circle
              key={idx}
              cx={pt.cx} cy={pt.cy} r={pt.r}
              fill="var(--primary)"
              animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.8, 1.35, 0.8] }}
              transition={{ duration: pt.d, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
              style={{ transformOrigin: `${pt.cx}px ${pt.cy}px` }}
            />
          ))}
          <motion.circle
            cx="320" cy="90" r="35"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.8"
            strokeDasharray="4 8"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "320px 90px" }}
          />
        </svg>
      )}

      {/* Smooth Harmonic Radial Pulse Wave on Cycle Click */}
      {cycleTrigger > 0 && (
        <motion.div
          key={`burst-${cycleTrigger}`}
          initial={{ scale: 0.3, opacity: 0.65 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-10 top-8 w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-primary/10 pointer-events-none"
        />
      )}

      {/* Active Roaming Ambient Critter inside Companion Sanctum Card */}
      <AnimatePresence mode="wait">
        {activeCritter && (
          <div key={critterKey} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {renderCritterComponent(activeCritter, 'local')}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TileArtBadges = () => {
  const isEco = useIsEco();
  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <motion.div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)] mix-blend-screen" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
    </div>
  );
};

const TileArtMission = () => {
  const isEco = useIsEco();
  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.15]">
      <motion.svg className="w-full h-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 50 Q 25 10 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <motion.path d="M0 50 Q 25 10 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="1" animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' as const }} />
      </motion.svg>
    </div>
  );
};

const TileArtTimeline = () => {
  const isEco = useIsEco();
  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05]">
      <div className="w-full h-full bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:20px_20px] text-primary" />
      <motion.div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent h-1/2 w-full" animate={{ y: ['-100%', '200%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' as const }} />
    </div>
  );
};

const TileArtAnalytics = () => {
  const isEco = useIsEco();
  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <motion.svg className="w-full h-full text-emerald-400" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[...Array(5)].map((_, i) => (
          <motion.circle key={i} cx="50" cy="100" r={20 + i * 15} fill="none" stroke="currentColor" strokeWidth="0.5" animate={{ r: [20 + i * 15, 30 + i * 15], opacity: [1, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }} />
        ))}
      </motion.svg>
    </div>
  );
};

const TileArtHabits = () => {
  const isEco = useIsEco();
  if (isEco) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <motion.div className="absolute w-[150%] h-[150%] -top-1/4 -left-1/4 bg-gradient-to-tr from-purple-500/30 to-transparent" animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' as const }} style={{ transformOrigin: 'center' }} />
    </div>
  );
};
// ----------------------------

interface DashboardProps {
  onNavigate: (tab: string) => void;
  setSelectedDate?: (date: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
}) => {
  const {
    tasks,
    habits,
    dailyLogs,
    categories,
    addTask,
    toggleTaskCompletion,
    toggleHabitCompletion,
    xp,
    level,
    unlockedBadges,
    settings,
  } = useShadowTrackerStore();

  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskPriority, setInlineTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'habit'>('task');
  const [showExplorerGuide, setShowExplorerGuide] = useState(false);
  const [reviewMode, setReviewMode] = useState<'morning' | 'evening' | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Data processing
  const todayStr = useMemo(() => getTodayDateString(), []);
  
  const todayTasks = useMemo(() => tasks.filter(t => t.dueDate === todayStr && !t.isSoftDeleted), [tasks, todayStr]);
  const pendingTasks = useMemo(() => todayTasks.filter(t => !t.isCompleted), [todayTasks]);
  const completedTasksCount = useMemo(() => todayTasks.filter(t => t.isCompleted).length, [todayTasks]);

  const activeHabitsCount = habits.length;
  const completedHabitsToday = useMemo(() => habits.filter(h => h.completedDates.includes(todayStr)).length, [habits, todayStr]);

  const totalStreaks = useMemo(() => habits.reduce((acc, h) => acc + h.streakCount, 0), [habits]);
  const highestStreak = useMemo(() => habits.reduce((max, h) => h.streakCount > max ? h.streakCount : max, 0), [habits]);

  const todayLog = useMemo(() => dailyLogs.find(l => l.date === todayStr), [dailyLogs, todayStr]);
  const focusScore = todayLog?.focusScore ?? 0;

  const sessionEmoji = useMemo(() => {
    const emojis = ['✨', '⚡️', '🚀', '🔥', '🌟', '🌅', '☕', '💪', '🎯', '⚔️'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }, []);

  const getGreeting = useCallback(() => {
    const alias = settings.alias || 'Shadow';
    const hrs = new Date().getHours();
    const highlight = <span className="text-primary font-bold capitalize">{alias}</span>;
    if (hrs < 12) return <>Good morning, {highlight} {sessionEmoji}</>;
    if (hrs < 17) return <>Good afternoon, {highlight} {sessionEmoji}</>;
    return <>Good evening, {highlight} {sessionEmoji}</>;
  }, [settings.alias, sessionEmoji]);

  const daysSinceLastActive = useMemo(() => {
    let days = 0;
    const allCompletedDates = habits.flatMap(h => h.completedDates).sort();
    if (allCompletedDates.length > 0) {
      const lastActiveDateStr = allCompletedDates[allCompletedDates.length - 1];
      const todayTime = new Date(todayStr).getTime();
      const lastTime = new Date(lastActiveDateStr).getTime();
      days = Math.max(0, Math.floor((todayTime - lastTime) / (1000 * 3600 * 24)));
    }
    return days;
  }, [habits, todayStr]);

  const [wispVariant, setWispVariant] = useState<number>(() => Math.floor(Math.random() * 4));
  const [wispSpeechIndex, setWispSpeechIndex] = useState<number>(0);
  const [wispCustomLines, setWispCustomLines] = useState<string[]>([]);
  const [showCompanionModal, setShowCompanionModal] = useState<boolean>(false);
  const [wispAnimEffect, setWispAnimEffect] = useState<'none' | 'pulse' | 'shimmer' | 'bounce' | 'ripple'>('none');
  const [cycleBurstTrigger, setCycleBurstTrigger] = useState<number>(0);

  useEffect(() => {
    setWispCustomLines(getWispCustomLines());
  }, []);

  // Wisp wisdom stays for at least 10s (auto-cycles every 12 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const allLines = getAllWispLines(wispCustomLines);
      if (allLines.length === 0) return;
      setWispSpeechIndex(prev => (prev + 1) % allLines.length);
      setWispVariant(prev => (prev + 1) % 4);
    }, 12000);

    return () => clearInterval(timer);
  }, [wispCustomLines]);

  const handleCycleWisp = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allLines = getAllWispLines(wispCustomLines);
    if (allLines.length > 0) {
      setWispSpeechIndex(prev => (prev + 1) % allLines.length);
    }
    setWispVariant(prev => (prev + 1) % 4);
    setCycleBurstTrigger(prev => prev + 1);

    // Random simple and neat micro-animation instead of celebration confetti
    const effects: Array<'pulse' | 'shimmer' | 'bounce' | 'ripple'> = ['pulse', 'shimmer', 'bounce', 'ripple'];
    const selected = effects[Math.floor(Math.random() * effects.length)];
    setWispAnimEffect(selected);
    setTimeout(() => setWispAnimEffect('none'), 650);
  }, [wispCustomLines]);

  const mascot = useMemo(() => getMascotStatus(
    settings,
    {
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasksCount,
      highestStreak,
      focusScore,
      daysSinceLastActive,
    },
    {
      customLines: wispCustomLines,
      animationVariant: wispVariant,
      forceQuoteIndex: wispSpeechIndex,
    }
  ), [settings, pendingTasks.length, completedTasksCount, highestStreak, focusScore, daysSinceLastActive, wispCustomLines, wispVariant, wispSpeechIndex]);

  const coachingText = useMemo(() => {
    return getContextualCoaching({
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasksCount,
      activeHabits: activeHabitsCount,
      completedHabits: completedHabitsToday,
      highestStreak,
      daysSinceLastActive,
      alias: settings.alias || 'Shadow',
    });
  }, [pendingTasks.length, completedTasksCount, activeHabitsCount, completedHabitsToday, highestStreak, daysSinceLastActive, settings.alias]);
  const [showBadgesInfo, setShowBadgesInfo] = useState(false);

  const renderWithAliasHighlight = useCallback((text: string) => {
    const alias = settings.alias || 'Shadow';
    if (!text.includes(alias)) return text;
    const parts = text.split(alias);
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i !== parts.length - 1 && <span className="text-primary font-bold">{alias}</span>}
          </React.Fragment>
        ))}
      </>
    );
  }, [settings.alias]);

  const { completedPercent } = useMemo(() => {
    const total = todayTasks.length + activeHabitsCount;
    const completed = completedTasksCount + completedHabitsToday;
    return {
      totalItems: total,
      completedItems: completed,
      completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [todayTasks.length, activeHabitsCount, completedTasksCount, completedHabitsToday]);

  // Handle Escape key to exit explorer full-view mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExplorerGuide) {
        setShowExplorerGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExplorerGuide]);


  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;

    try {
      if (quickAddType === 'task') {
        await addTask({
          title: inlineTaskTitle.trim(),
          dueDate: todayStr,
          priority: inlineTaskPriority,
          isRecurring: false,
          recurrencePattern: null,
        });
      }
    } catch (err) {
      console.error('Quick add failed:', err);
    } finally {
      setInlineTaskTitle('');
      setShowQuickAddModal(false);
    }
  };

  const getCategoryColor = useCallback((catId?: string) => {
    if (!catId) return '#71717a';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : '#71717a';
  }, [categories]);

  const getCategoryName = useCallback((catId?: string) => {
    if (!catId) return 'General';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  }, [categories]);

  if (showExplorerGuide) {
    return (
      <motion.div
        key="explorer-full-view"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="space-y-6 font-sans select-none"
      >
        {/* Sticky Explorer Header / Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 tile rounded-2xl bg-surface-elevated border border-border/80 sticky top-2 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExplorerGuide(false)}
              className="btn-glass-pill text-xs font-black flex items-center gap-2 text-foreground hover:text-primary transition-all cursor-pointer"
            >
              <Lucide.ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-5 w-px bg-border/60 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse shrink-0" />
              <span>System Explorer &amp; Feature Hub</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExplorerGuide(false)}
            className="filter-pill text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Exit Explorer (Esc)
          </button>
        </div>

        <ExplorerFeature
          onNavigate={(tab) => {
            setShowExplorerGuide(false);
            onNavigate(tab);
          }}
          onBackToDashboard={() => setShowExplorerGuide(false)}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 select-none font-sans relative">
      {/* Global Idle Wanderer Overlay: Crawls across other tiles when the screen is idle */}
      <DashboardIdleCrittersOverlay />

      {/* 1. Refined Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <motion.span 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold tracking-wide text-secondary flex items-center gap-2"
          >
            <Lucide.Calendar size={14} className="text-primary" />
            {format(new Date(), 'EEEE, MMMM do')}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground"
          >
            {getGreeting()}!
          </motion.h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:pb-0 w-full sm:w-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => setShowExplorerGuide(true)}
            className="btn-glass-pill cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] shrink-0 !py-1.5 !px-3"
            title="Open System Explorer & Feature Guide"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Explorer Hub</span>
            <Lucide.ChevronRight size={13} className="text-secondary shrink-0 hidden sm:inline" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full bg-secondary border border-border/80 shadow-sm shrink-0">
            <div className="flex items-center gap-1.5" title="Tasks Completed / Total Today">
              <Lucide.CheckSquare size={13} className="text-blue-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-foreground">{completedTasksCount}/{todayTasks.length}</span>
            </div>
            <div className="w-[1px] h-3.5 bg-border shrink-0" />
            <div className="flex items-center gap-1.5" title="Habits Completed / Total Active">
              <Lucide.Repeat size={13} className="text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-foreground">{completedHabitsToday}/{activeHabitsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-full text-xs sm:text-sm font-medium shadow-sm shrink-0">
            <Lucide.Flame className="text-orange-400 shrink-0" size={14} />
            <span className="text-foreground whitespace-nowrap">{highestStreak} day streak</span>
          </div>
        </motion.div>
      </div>

      {/* Life OS Quick Launchers Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => onNavigate('money')}
          className="tile settings-tile p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 cursor-pointer transition-all active:scale-95 group"
          title="Wealth & Budget Management"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
              <Lucide.Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </span>
            <div className="text-left truncate">
              <span className="text-xs font-black text-foreground block truncate">Wealth Hub</span>
              <span className="text-[9.5px] sm:text-[10px] text-muted-foreground font-medium block truncate">Budget &amp; Assets</span>
            </div>
          </div>
          <Lucide.ChevronRight size={14} className="text-emerald-400/60 shrink-0 hidden sm:block" />
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="tile settings-tile p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-sky-500/30 hover:border-sky-500/60 bg-sky-500/5 cursor-pointer transition-all active:scale-95 group"
          title="Analytics & Habit Telemetry"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-sky-500/15 text-sky-400 group-hover:scale-110 transition-transform">
              <Lucide.BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </span>
            <div className="text-left truncate">
              <span className="text-xs font-black text-foreground block truncate">Analytics</span>
              <span className="text-[9.5px] sm:text-[10px] text-muted-foreground font-medium block truncate">Telemetry &amp; Focus</span>
            </div>
          </div>
          <Lucide.ChevronRight size={14} className="text-sky-400/60 shrink-0 hidden sm:block" />
        </button>

        <button
          onClick={() => onNavigate('health')}
          className="tile settings-tile p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5 cursor-pointer transition-all active:scale-95 group"
          title="Health & Vitality"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-rose-500/15 text-rose-400 group-hover:scale-110 transition-transform">
              <Lucide.HeartPulse className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </span>
            <div className="text-left truncate">
              <span className="text-xs font-black text-foreground block truncate">Health Hub</span>
              <span className="text-[9.5px] sm:text-[10px] text-muted-foreground font-medium block truncate">Water &amp; Sleep</span>
            </div>
          </div>
          <Lucide.ChevronRight size={14} className="text-rose-400/60 shrink-0 hidden sm:block" />
        </button>

        <button
          onClick={() => onNavigate('rpg')}
          className="tile settings-tile p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between border-primary/30 hover:border-primary/60 bg-primary/5 cursor-pointer transition-all active:scale-95 group"
          title="Life RPG & Quests"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-primary/15 text-primary group-hover:scale-110 transition-transform">
              <Lucide.Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </span>
            <div className="text-left truncate">
              <span className="text-xs font-black text-foreground block truncate">Life RPG</span>
              <span className="text-[9.5px] sm:text-[10px] text-muted-foreground font-medium block truncate">Lv {level} • Quests</span>
            </div>
          </div>
          <Lucide.ChevronRight size={14} className="text-primary/60 shrink-0 hidden sm:block" />
        </button>
      </div>

      {/* 1. TOP ROW: Achievement Nexus */}
      <div className="mb-8">
          {/* Badges Drawer */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className={`${
              (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                ? 'bg-slate-950 text-slate-100 border-2 border-slate-800/90 shadow-2xl rounded-3xl' 
                : 'tile'
            } p-5 space-y-4 relative overflow-hidden`}
          >
            <TileArtBadges />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-sm uppercase font-black tracking-widest block text-white">
                Achievement Nexus
              </span>
              <button 
                onClick={() => setShowBadgesInfo(true)}
                className={`text-xs transition-colors px-2.5 py-1 rounded-full border shadow-sm cursor-pointer ${
                  (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                    ? 'text-slate-200 bg-slate-800 border-slate-700 hover:bg-primary/30 hover:text-white' 
                    : 'text-muted-foreground bg-foreground/5 hover:bg-primary/20 hover:text-primary border-border/80'
                }`}
              >
                View Badges Info
              </button>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 py-3 relative z-10">
              {ALL_BADGES.map((b, i) => {
                const isUnlocked = unlockedBadges.includes(b.id);
                const IconComponent = (Lucide[b.icon as keyof typeof Lucide] || Lucide.Award) as React.ElementType;

                const isWhiteTheme = settings.theme === 'white' || settings.theme === 'light';
                const isTargetBlackBadge = ['badge-first-task', 'badge-first-note', 'badge-streak-3', 'badge-streak-7'].includes(b.id) || ['First Spark', 'Mindful Mind', 'Triple Streak', 'Weekly Streak'].includes(b.name);

                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

                const pseudoRandom = (seed: number) => {
                  const x = Math.sin(seed) * 10000;
                  return x - Math.floor(x);
                };
                
                const dealX = (pseudoRandom(i * 13) - 0.5) * 800;
                const dealY = (pseudoRandom(i * 17) - 0.5) * 600;
                const dealRotate = (pseudoRandom(i * 23) - 0.5) * 360;
                
                const dealDelay = i * 0.1; 

                const physics = isUnlocked
                  ? { type: "spring" as const, stiffness: 100, damping: 8, mass: 1 }
                  : { type: "spring" as const, stiffness: 50, damping: 15, mass: 1 };

                const initialAnim = isMobile 
                  ? { opacity: 0, scale: 0.95 }
                  : { opacity: 0, scale: 0.1, x: dealX, y: dealY, rotate: dealRotate };

                const animateTarget = isMobile
                  ? { opacity: isUnlocked ? 1 : 0.7, scale: 1 }
                  : { opacity: isUnlocked ? 1 : 0.7, scale: 1, x: 0, y: 0, rotate: 0 };

                const animTransition = isMobile
                  ? { duration: 0.2, delay: i * 0.02 }
                  : { ...physics, delay: dealDelay };

                return (
                  <motion.div
                    key={b.id + "_" + (isUnlocked ? "u" : "l") + "_" + (isMounted ? "m" : "n")}
                    className="relative w-full"
                    initial={initialAnim}
                    animate={animateTarget}
                    transition={animTransition}
                  >
                    <div
                      onClick={() => {
                        if (isUnlocked) {
                          fireConfetti();
                          window.dispatchEvent(new CustomEvent('badgeUnlocked', { detail: b.id }));
                        }
                      }}
                      className={`w-full min-h-[82px] sm:min-h-[98px] lg:min-h-[104px] p-1.5 sm:p-2.5 lg:p-3 relative rounded-2xl border flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition-all duration-200 ease-out group ${
                        isUnlocked 
                          ? `${b.color} cursor-pointer shadow-[0_0_12px_currentColor] hover:-translate-y-1 hover:scale-[1.04] hover:shadow-[0_0_20px_currentColor] hover:z-20 ${
                              (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                                ? 'bg-slate-900 text-white border-cyan-500/50' 
                                : 'bg-gradient-to-b from-cyan-950/40 via-surface/90 to-surface border-cyan-500/30'
                            }` 
                          : (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                            ? 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60 grayscale shadow-sm hover:scale-[1.02]'
                            : 'bg-surface/40 border-border/70 text-muted-foreground opacity-50 grayscale shadow-sm hover:scale-[1.02]'
                      }`}
                    >
                      {isUnlocked && (
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none border border-cyan-400/50 bg-cyan-500/5 shadow-[0_0_10px_currentColor,inset_0_0_6px_currentColor]"
                        />
                      )}

                      {/* Futuristic Icon Container */}
                      <div className={`p-1.5 sm:p-2 rounded-xl bg-current/15 border border-current/30 flex items-center justify-center shrink-0 relative z-10 ${isUnlocked ? "shadow-sm scale-105" : ""}`}>
                        {isUnlocked && (
                          <div className="absolute -inset-1 rounded-xl border border-dashed border-current/50 pointer-events-none hidden sm:block animate-spin-slow" />
                        )}
                        <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-700 ${isUnlocked ? 'group-hover:rotate-[360deg] text-current' : 'opacity-70'}`} />
                        
                        {!isUnlocked && (
                          <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-950 border border-slate-700 text-slate-400">
                            <Lucide.Lock size={8} />
                          </div>
                        )}
                      </div>
                      
                      {/* High-Contrast Title & Subtitle */}
                      <div className="w-full flex flex-col items-center justify-center gap-0.5 select-none relative z-10">
                        <strong className={`block text-[10px] sm:text-[12.5px] lg:text-sm leading-tight font-bold tracking-tight text-center truncate max-w-full px-0.5 ${
                          (isWhiteTheme && isTargetBlackBadge)
                            ? 'text-black font-black'
                            : (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                              ? 'text-white' 
                              : 'text-foreground'
                        }`}>
                          {b.name}
                        </strong>
                        <span className={`block text-[8px] sm:text-[9.5px] lg:text-[10px] font-medium leading-tight text-center truncate max-w-full px-0.5 ${
                          (isWhiteTheme && isTargetBlackBadge)
                            ? 'text-neutral-900 font-bold'
                            : isUnlocked 
                              ? 'text-cyan-300' 
                              : (settings.theme === 'light' || settings.theme === 'white' || settings.theme === 'midnight' || settings.theme === 'pine' || settings.theme === 'purple')
                                ? 'text-slate-400' 
                                : 'text-muted-foreground'
                        }`}>
                          {b.subtitle}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
      </div>

      {/* 2. SECOND ROW: 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch mb-4">
        <div className="flex flex-col h-full">
          {/* Animated Mascot widget */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => handleCycleWisp()}
            className={`tile p-3 flex flex-col h-full cursor-pointer select-none group transition-all relative overflow-hidden ${
              wispAnimEffect === 'pulse' ? 'ring-2 ring-primary/40' : ''
            }`}
            title="✨ Click card to cycle wisdom & animation form"
          >
            <TileArtCompanion variant={wispVariant} cycleTrigger={cycleBurstTrigger} />

            {/* Micro clean ripple animation on click */}
            {wispAnimEffect === 'ripple' && (
              <motion.div 
                initial={{ scale: 0.6, opacity: 0.4 }} 
                animate={{ scale: 1.5, opacity: 0 }} 
                transition={{ duration: 0.55, ease: 'easeOut' }} 
                className="absolute inset-0 bg-primary/20 rounded-2xl pointer-events-none z-10" 
              />
            )}

            {/* Micro clean shimmer animation on click */}
            {wispAnimEffect === 'shimmer' && (
              <motion.div 
                initial={{ x: '-100%' }} 
                animate={{ x: '200%' }} 
                transition={{ duration: 0.55, ease: 'easeInOut' }} 
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none z-10" 
              />
            )}

            {/* Micro clean bounce animation on click */}
            {wispAnimEffect === 'bounce' && (
              <motion.div 
                initial={{ y: 0 }} 
                animate={{ y: [-4, 0] }} 
                transition={{ duration: 0.4, ease: 'easeOut' }} 
                className="absolute inset-0 pointer-events-none z-10" 
              />
            )}
            
            <div className="relative z-10 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Larger, Prominent Companion Avatar Logo */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCompanionModal(true);
                  }}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-surface-elevated/90 border border-border/80 p-2 flex items-center justify-center relative shadow-sm group/logo cursor-pointer hover:border-primary/60 hover:shadow-md hover:scale-105 transition-all active:scale-95 shrink-0"
                  title="✦ Companion Sanctum (Switch forms, view focus synergy, inscribe lore)"
                >
                  <div 
                    className="w-full h-full transition-transform duration-500 group-hover/logo:scale-110" 
                    dangerouslySetInnerHTML={{ __html: mascot.avatarSvg }} 
                  />
                  {/* Subtle active pulse dot */}
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface shadow-xs animate-pulse" />
                </button>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                      Companion
                    </span>
                    <Lucide.Sparkles size={10} className="text-primary/70 animate-pulse shrink-0" />
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-foreground truncate leading-tight mt-0.5">{mascot.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                    <Lucide.Zap size={11} className="text-primary shrink-0" />
                    <span>{highestStreak}d Synergy</span>
                    <span className="text-border">•</span>
                    <span>Tier {mascot.tier}</span>
                  </p>
                </div>
              </div>

              {/* Action Button: Cycle icon button without words */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCycleWisp(e)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-surface-elevated hover:bg-surface text-secondary hover:text-foreground border border-border/80 hover:border-primary/50 shadow-2xs transition-all active:scale-90 flex items-center justify-center cursor-pointer group"
                  title="Cycle Next Wisdom Quote & Animation"
                >
                  <Lucide.RotateCw size={13} className="group-hover:rotate-180 transition-transform duration-500 text-primary" />
                </button>
              </div>
            </div>

            {/* Differentiated Motivation Quote Bubble with larger readable font and subtle glowing border */}
            <div className="relative z-10 mt-3 p-3.5 bg-surface-elevated/90 [html[data-theme='white']_&]:bg-[#fffbf0] [html[data-theme='light']_&]:bg-[#fffbf0] border border-primary/35 [html[data-theme='white']_&]:border-amber-600/35 border-l-4 border-l-primary [html[data-theme='white']_&]:border-l-amber-600 rounded-xl text-[15px] sm:text-[15.5px] font-semibold leading-relaxed text-foreground [html[data-theme='white']_&]:text-stone-900 shadow-[0_0_12px_rgba(99,102,241,0.18)] dark:shadow-[0_0_14px_rgba(139,92,246,0.20)] [html[data-theme='white']_&]:shadow-[0_0_12px_rgba(217,119,6,0.16)]">
              <div className="absolute -top-1.5 left-7 w-2.5 h-2.5 bg-surface-elevated/90 [html[data-theme='white']_&]:bg-[#fffbf0] border-t border-l border-primary/35 [html[data-theme='white']_&]:border-amber-600/35 transform rotate-45"></div>
              <p className="relative z-10 italic">
                <span className="not-italic text-primary [html[data-theme='white']_&]:text-amber-700 font-bold mr-1 text-lg leading-none select-none">“</span>
                {renderWithAliasHighlight(mascot.speech)}
                <span className="not-italic text-primary [html[data-theme='white']_&]:text-amber-700 font-bold ml-1 text-lg leading-none select-none">”</span>
              </p>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col h-full">
          {/* Analytics Snapshot Mini */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
            className="tile p-3 space-y-2 flex flex-col justify-center shrink-0 h-full"
          >
            <TileArtAnalytics />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-sm uppercase font-bold text-muted-foreground tracking-wide block">Analytics Snapshot</span>
              <Lucide.BarChart2 size={16} className="text-emerald-400/80" />
            </div>
            
            <div className="relative z-10 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{focusScore}</span>
                <span className="text-xs text-muted-foreground">Focus Score</span>
              </div>
              
              {/* Mini Sparkline Chart representation */}
              <div className="h-8 flex items-end gap-1.5 w-full">
                {Array.from({ length: 7 }).map((_, i) => {
                  const pastLog = dailyLogs[dailyLogs.length - 7 + i];
                  const score = pastLog ? pastLog.focusScore : Math.floor(Math.random() * 40) + 20; // fallback aesthetic data if missing
                  const height = Math.max(10, Math.min(100, score));
                  const isToday = i === 6;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-muted-foreground absolute -top-4">{score}</div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.7 + (i * 0.05), type: 'spring' as const }}
                        className={`w-full rounded-t-sm ${isToday ? 'bg-primary' : 'bg-foreground/10 group-hover:bg-foreground/20'}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-0.5 font-medium">
                <span>Past 7d</span>
                <span>Today</span>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col h-full">
          {/* Today's Mission Progress HUD - Layered Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="tile p-3.5 h-full flex flex-col justify-center"
          >
            <TileArtMission />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base font-medium">
                <span className="flex items-center gap-2 text-foreground uppercase text-sm tracking-wide font-semibold">
                  <Lucide.Target size={16} className="text-primary" /> Today&apos;s Objective
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground bg-foreground/5 border border-border px-2 py-1 rounded-md shadow-inner text-sm font-mono">
                    {completedPercent}% completed
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-border shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-primary relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${completedPercent}%` }}
                  transition={{ type: 'spring' as const, stiffness: 60, damping: 15 }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30" />
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02, transition: { type: "spring" as const, stiffness: 300 } }} className="flex items-start gap-2.5 bg-foreground/5 border border-border p-2.5 rounded-xl text-xs font-medium text-foreground leading-relaxed shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Lucide.Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="relative z-10">{renderWithAliasHighlight(coachingText)}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col h-full">
          {/* Floating Quick Actions HUD (Moved here) */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="tile p-3 space-y-2.5 flex flex-col justify-center h-full"
          >
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4, boxShadow: "0 15px 35px -10px rgba(var(--primary-rgb), 0.4)", transition: { type: "spring" as const, stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setQuickAddType('task'); setShowQuickAddModal(true); }}
                className="group flex flex-col items-center justify-center gap-1.5 p-2.5 bg-foreground/5 hover:bg-surface-elevated border border-border hover:border-primary/50 rounded-xl text-sm font-semibold transition-all text-foreground hover:text-foreground shadow-sm"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-inner">
                  <Lucide.PlusSquare size={16} />
                </div>
                <span>New Task</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -4, boxShadow: "0 15px 35px -10px rgba(168, 85, 247, 0.4)", transition: { type: "spring" as const, stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('habits')}
                className="group flex flex-col items-center justify-center gap-2 p-3 bg-foreground/5 hover:bg-surface-elevated border border-border hover:border-purple-400/50 rounded-xl text-sm font-semibold transition-all text-foreground hover:text-foreground shadow-sm"
              >
                <div className="p-2 rounded-lg bg-purple-400/10 text-purple-400 group-hover:scale-110 transition-transform shadow-inner">
                  <Lucide.Repeat size={18} />
                </div>
                <span>Habit</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -4, boxShadow: "0 15px 35px -10px rgba(251, 113, 133, 0.4)", transition: { type: "spring" as const, stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('notes')}
                className="group flex flex-col items-center justify-center gap-2 p-3 bg-foreground/5 hover:bg-surface-elevated border border-border hover:border-rose-400/50 rounded-xl text-sm font-semibold transition-all text-foreground hover:text-foreground shadow-sm"
              >
                <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400 group-hover:scale-110 transition-transform shadow-inner">
                  <Lucide.BookOpen size={18} />
                </div>
                <span>Journal</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -4, boxShadow: "0 15px 35px -10px rgba(52, 211, 153, 0.4)", transition: { type: "spring" as const, stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('analytics')}
                className="group flex flex-col items-center justify-center gap-2 p-3 bg-foreground/5 hover:bg-surface-elevated border border-border hover:border-emerald-400/50 rounded-xl text-sm font-semibold transition-all text-foreground hover:text-foreground shadow-sm"
              >
                <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition-transform shadow-inner">
                  <Lucide.LineChart size={18} />
                </div>
                <span>Stats</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. THIRD ROW: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-8">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full">
          {/* Active Habits Mini-List */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
            className="tile p-5 flex-1 flex flex-col space-y-4 min-h-[220px]"
          >
            <TileArtHabits />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-sm uppercase font-bold text-muted-foreground tracking-wide block">Active Routines</span>
              <Lucide.Activity size={16} className="text-purple-400" />
            </div>

            <div className="relative z-10 flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 pb-2 min-h-0">
              {habits.length > 0 ? (
                habits.map((habit, idx) => {
                  const isCompletedToday = habit.completedDates.includes(todayStr);

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 * idx }}
                      whileHover={{ scale: 1.02, transition: { type: "spring" as const, stiffness: 300 } }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        const isCompletedToday = habit.completedDates.includes(todayStr);
                        const willComplete = !isCompletedToday;
                        const prevFocus = focusScore;

                        await toggleHabitCompletion(habit.id, todayStr);

                        if (willComplete) {
                          fireConfetti();
                          const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr);
                          const newFocus = freshLog?.focusScore ?? prevFocus;
                          const focusDiff = newFocus - prevFocus;
                          const flowGainText = focusDiff > 0 ? `+${focusDiff}% Flow State` : `${newFocus}% Flow State`;

                          window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                            detail: {
                              title: 'Routine Completed',
                              subtitle: habit.name,
                              flowText: flowGainText,
                              type: 'routine'
                            }
                          }));
                        }
                      }}
                      className={`flex flex-col justify-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                        isCompletedToday
                          ? 'bg-foreground/5 border-border opacity-70'
                          : 'bg-foreground/[0.03] border-border hover:border-border hover:bg-foreground/[0.05] shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 relative border shrink-0 ${
                            isCompletedToday
                              ? 'bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 border-fuchsia-400 text-white shadow-[0_0_12px_rgba(217,70,239,0.5)] scale-105'
                              : 'bg-foreground/5 border-border text-muted-foreground hover:border-purple-400'
                          }`}>
                            {isCompletedToday && (
                              <motion.span
                                key={habit.id + "_routine_pulse"}
                                initial={{ scale: 0.6, opacity: 0.9 }}
                                animate={{ scale: 2.2, opacity: 0 }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                                className="absolute inset-0 rounded-md border-2 border-fuchsia-400 pointer-events-none"
                              />
                            )}
                            <motion.div
                              initial={false}
                              animate={isCompletedToday ? { scale: [0, 1], rotate: [-20, 0] } : { scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 18 }}
                            >
                              <Lucide.Check size={11} className={isCompletedToday ? 'stroke-[3.5px]' : 'opacity-30'} />
                            </motion.div>
                          </div>
                          <p 
                            title={habit.name}
                            className={`text-sm font-semibold truncate min-w-0 flex-1 ${isCompletedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          >
                            {habit.name}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-sm font-medium text-muted-foreground flex items-center gap-1 pl-1">
                          <Lucide.Flame size={12} className={isCompletedToday ? "text-orange-400" : "text-orange-400/50"} /> {habit.streakCount}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No active routines.
                </div>
              )}
            </div>
          </motion.div>
        </div>
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full">
          {/* Git-Commit Style Timeline View */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="tile p-6 flex-1 flex flex-col min-h-[220px]"
          >
            <TileArtTimeline />
            <div className="absolute top-0 right-0 bg-gradient-to-bl from-primary/5 to-transparent w-64 h-64 pointer-events-none" />
            
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                <span className="text-sm uppercase tracking-wide font-bold text-foreground flex items-center gap-2">
                  <Lucide.GitCommit size={16} className="text-primary" /> Timeline
                </span>
                <span className="text-sm font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  {completedTasksCount} / {todayTasks.length} nodes resolved
                </span>
              </div>

              {/* Commit tree nodes list - flex layout to avoid overflow clipping */}
              <div className="space-y-0 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4 min-h-0">
                {todayTasks.length > 0 ? (
                  todayTasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex gap-3 group"
                    >
                      {/* Left column: node circle + vertical connector */}
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={async () => {
                            const willComplete = !task.isCompleted;
                            const prevFocus = focusScore;

                            await toggleTaskCompletion(task.id);

                            if (willComplete) {
                              fireConfetti();
                              const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr);
                              const newFocus = freshLog?.focusScore ?? prevFocus;
                              const focusDiff = newFocus - prevFocus;
                              const flowGainText = focusDiff > 0 ? `+${focusDiff}% Flow State` : `${newFocus}% Flow State`;

                              window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                                detail: {
                                  title: 'Node Resolved',
                                  subtitle: task.title,
                                  flowText: flowGainText,
                                  type: 'task'
                                }
                              }));
                            }
                          }}
                          className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10 shrink-0 ${
                            task.isCompleted
                              ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                              : 'bg-surface-elevated border-border hover:border-emerald-500 text-transparent group-hover:scale-110'
                          }`}
                        >
                          {task.isCompleted && (
                            <motion.span
                              key={task.id + "_dashboard_pulse"}
                              initial={{ scale: 0.6, opacity: 0.9 }}
                              animate={{ scale: 2.2, opacity: 0 }}
                              transition={{ duration: 0.45, ease: "easeOut" }}
                              className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none"
                            />
                          )}
                          <motion.div
                            initial={false}
                            animate={
                              task.isCompleted 
                                ? { scale: [0, 1], rotate: [-45, 0] } 
                                : { scale: 0, rotate: 0 }
                            }
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          >
                            <Lucide.Check size={12} className="stroke-[3.5px]" />
                          </motion.div>
                        </motion.button>
                        {idx < todayTasks.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />
                        )}
                      </div>

                      {/* Right column: task card */}
                      <div className="flex-1 pb-4">
                        <motion.div
                          whileHover={{ scale: 1.01, transition: { type: "spring" as const, stiffness: 300 } }}
                          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                            task.isCompleted
                              ? 'bg-foreground/5 border-border opacity-60'
                              : 'bg-foreground/[0.03] border-border hover:border-primary/30 hover:bg-foreground/[0.05] shadow-sm'
                          }`}
                        >
                          {task.isCompleted && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-base font-medium leading-relaxed ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              task.priority === 'high'
                                ? 'text-red-400 bg-red-400/10'
                                : task.priority === 'medium'
                                ? 'text-yellow-400 bg-yellow-400/10'
                                : 'text-zinc-400 bg-zinc-400/10'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-foreground/5 px-2 py-0.5 rounded border border-border">
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                              />
                              {getCategoryName(task.categoryId)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <EmptyState
                      icon="GitBranch"
                      title="Timeline clear"
                      description="No nodes scheduled for today's iteration. Add a task to begin."
                    />
                  </div>
                )}
              </div>
              
              <div className="border-t border-border pt-4 mt-4 flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><Lucide.Zap size={14} className="text-amber-400/80" /> Flow State: {completedPercent || 0}%</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('tasks')} 
                  className="text-primary hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Full board <Lucide.ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>


      </div>

      <Modal
        isOpen={showBadgesInfo}
        onClose={() => setShowBadgesInfo(false)}
        title="Achievement Nexus"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Unlock these 10 permanent milestone badges through real-world consistency across tasks, habit streaks, daily focus harmony, journaling, and financial targets. Badges track your milestone lifecycle and persist across sessions.
          </p>
          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {ALL_BADGES.map((b) => {
              const isUnlocked = unlockedBadges.includes(b.id);
              const IconComponent = (Lucide[b.icon as keyof typeof Lucide] || Lucide.Award) as React.ElementType;
              return (
                <div key={b.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isUnlocked ? b.color + ' border-current/20' : 'bg-surface border-border text-muted-foreground grayscale opacity-60'}`}>
                  <div className={`p-2 rounded-xl bg-current/10 ${isUnlocked ? 'drop-shadow-lg' : ''}`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      {b.name}
                      {isUnlocked && <Lucide.CheckCircle2 size={14} className="text-current" />}
                    </h4>
                    <p className="text-xs font-semibold text-primary/80 mt-1 uppercase tracking-wider">{b.requirement}</p>
                    <p className="text-xs mt-1">{b.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 4. Quick Add Floating Modal */}
      <AnimatePresence>
        {showQuickAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickAddModal(false)}
          >
            <motion.div 
              className="w-full max-w-sm bg-surface-elevated border border-border rounded-2xl p-6 shadow-2xl space-y-5 ring-1 ring-white/5 relative overflow-hidden cursor-default"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-purple-500" />
              
              <div className="flex justify-between items-center pb-2 relative z-10">
                <span className="text-base font-semibold text-foreground">Add new {quickAddType}</span>
                <motion.button onClick={() => setShowQuickAddModal(false)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-foreground/5">
                  <Lucide.X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="E.g., Read documentation..."
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    className="w-full text-base px-4 py-2.5 bg-black/50 border border-border focus:border-primary/50 rounded-xl text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <select
                    value={inlineTaskPriority}
                    onChange={(e) => setInlineTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full text-base pl-4 pr-9 py-2.5 bg-black/50 border border-border focus:border-primary/50 rounded-xl text-foreground focus:outline-none cursor-pointer transition-all shadow-inner appearance-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <Lucide.ChevronDown className="absolute right-3.5 top-9 text-muted-foreground pointer-events-none" size={16} />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full py-3 mt-2 bg-primary hover:bg-primary/90 text-white font-semibold text-base rounded-xl transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)]"
                >
                  Create
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nexus Companion Sanctum Modal */}
      <Modal
        isOpen={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
        title="Nexus Companion Sanctum"
      >
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-elevated border border-border">
            <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-primary/40 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <div 
                className="w-full h-full" 
                dangerouslySetInnerHTML={{ __html: mascot.avatarSvg }} 
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Tier {mascot.tier} • Level {settings.level}
              </span>
              <h3 className="text-base font-bold text-foreground mt-1">{mascot.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Focus Synergy: <strong className="text-foreground">{highestStreak}d streak</strong></p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Switch Wisp Animation Form:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 0, label: 'Celestial Float', desc: 'Ambient hovering' },
                { id: 1, label: 'Orbital Synergy', desc: 'Rotating mana rings' },
                { id: 2, label: 'Prismatic Sentinel', desc: 'Faceted geometric core' },
                { id: 3, label: 'Astral Sparkle', desc: 'Breathing starlight' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWispVariant(f.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    wispVariant === f.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-surface hover:bg-surface-elevated border-border text-foreground'
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className={`text-[10px] ${wispVariant === f.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                handleCycleWisp();
                setShowCompanionModal(false);
              }}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Lucide.Sparkles size={14} />
              <span>Cycle Wisdom Line &amp; Form ✦</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCompanionModal(false);
                onNavigate('wizard');
              }}
              className="w-full py-2.5 bg-surface hover:bg-surface-elevated text-foreground border border-border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lucide.BookOpen size={14} className="text-primary" />
              <span>Inscribe Wisp Wisdom in Wizard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCompanionModal(false);
                onNavigate('rpg');
              }}
              className="w-full py-2 bg-transparent hover:bg-foreground/5 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lucide.Crown size={13} className="text-primary" />
              <span>View Life RPG Companions &amp; Quests</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Day Review Modal (Morning Briefing / Evening Reflection) */}
      <DayReviewModal
        isOpen={reviewMode !== null}
        mode={reviewMode || 'morning'}
        onClose={() => setReviewMode(null)}
        onJumpToTask={(taskId) => {
          setReviewMode(null);
          onNavigate('tasks');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: { taskId } }));
          }, 50);
        }}
      />
    </div>
  );
};

export default Dashboard;
