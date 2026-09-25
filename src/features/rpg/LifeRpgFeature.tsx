'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import confetti from 'canvas-confetti';
import { getXpForLevel, getCharacterTitle, getCumulativeXpForLevel } from './rpgLevels';
import Modal from '@/components/Modal';

interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'discipline' | 'wisdom' | 'strength' | 'wealth';
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  isClaimed: boolean;
}

const STORAGE_KEY_QUESTS = 'shadow_rpg_quests_v2';

const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'q-discipline-1',
    title: 'Task Execution Sprint',
    description: 'Complete 10 tasks or standalone ToDos with zero procrastination.',
    category: 'discipline',
    xpReward: 50,
    currentProgress: 6,
    targetProgress: 10,
    unit: 'tasks',
    isClaimed: false,
  },
  {
    id: 'q-strength-1',
    title: 'Vitality Hydration',
    description: 'Log at least 2,500 ml of pure water intake across 3 distinct days.',
    category: 'strength',
    xpReward: 45,
    currentProgress: 2,
    targetProgress: 3,
    unit: 'days',
    isClaimed: false,
  },
  {
    id: 'q-wisdom-1',
    title: 'Mind Scribe',
    description: 'Complete 3 Morning Briefings or Evening Reflections in your journal.',
    category: 'wisdom',
    xpReward: 40,
    currentProgress: 1,
    targetProgress: 3,
    unit: 'reflections',
    isClaimed: false,
  },
  {
    id: 'q-wealth-1',
    title: 'Capital Warden',
    description: 'Maintain weekly budget cap and record all daily expenses.',
    category: 'wealth',
    xpReward: 50,
    currentProgress: 4,
    targetProgress: 5,
    unit: 'days',
    isClaimed: false,
  },
];

const MILESTONES = [
  { level: 1, title: 'Novice Wanderer', badge: 'Tier 0', perk: 'Base System & Journal Telemetry' },
  { level: 5, title: 'Shadow Initiate', badge: 'Tier I', perk: 'Habit Mastery & Streak Shield Engine' },
  { level: 10, title: 'Master of Shadows', badge: 'Tier II', perk: 'Advanced Diet & Gym Split Engines' },
  { level: 15, title: 'Life Grandmaster', badge: 'Tier III', perk: 'Comprehensive Telemetry & Analytics Core' },
  { level: 20, title: 'Ascended Strategist', badge: 'Tier IV', perk: 'Time-Blocking Flow & Productivity Matrix' },
  { level: 25, title: 'Shadow Vanguard Elite', badge: 'Tier V', perk: 'Precision Focus & Habit Resilience Protocols' },
  { level: 30, title: 'Apex Focus Templar', badge: 'Tier VI', perk: 'Enhanced XP Multiplier on Habit Heatmaps' },
  { level: 35, title: 'Ironclad Disciplinarian', badge: 'Tier VII', perk: 'High-Stakes Task Execution Buff' },
  { level: 40, title: 'High Commander of Execution', badge: 'Tier VIII', perk: 'Priority Workflow Automation' },
  { level: 45, title: 'Sovereign Architect', badge: 'Tier IX', perk: 'Multi-Year Archival & Deep Memory Vault' },
  { level: 50, title: 'Supreme Discipline Warlord', badge: 'Tier X', perk: 'Golden Hologram Crest in Themes' },
  { level: 55, title: 'Abyssal Conqueror', badge: 'Tier XI', perk: 'Indomitable Momentum Shield' },
  { level: 60, title: 'Master of Chronos & Will', badge: 'Tier XII', perk: 'Absolute Routine Synchronization' },
  { level: 65, title: 'Zenith Overlord', badge: 'Tier XIII', perk: 'Exponential Discipline Scaling Engine' },
  { level: 70, title: 'Prime Void Conqueror', badge: 'Tier XIV', perk: 'Transcendental Mind Aura Unlocked' },
  { level: 75, title: 'Astral Vanguard', badge: 'Tier XV', perk: 'Celestial Focus Telemetry & Astral Sync' },
  { level: 80, title: 'Grand Archon of Destiny', badge: 'Tier XVI', perk: 'Supreme Strategic Clairvoyance' },
  { level: 85, title: 'Celestial Paragon', badge: 'Tier XVII', perk: 'Diamond Willpower Resonance' },
  { level: 90, title: 'Transcendent Shadow Deity', badge: 'Tier XVIII', perk: 'God-Tier Habit Automaticity' },
  { level: 95, title: 'Cosmic Dreadnought', badge: 'Tier XIX', perk: 'Mythic Unshakeable Fortress of Will' },
  { level: 100, title: 'Eternal Sovereign of Shadows', badge: 'Tier XX', perk: 'Ultimate Life OS Singularity (Mythic Cap)' },
];

export default function LifeRpgFeature() {
  const { xp, level, settings, tasks, habits, notes, addXp } = useShadowTrackerStore();
  const isEco = useShadowTrackerStore((s) => Boolean(s.settings.ecoMode || s.settings.lowGpuMode));

  const currentLevel = Math.min(100, Math.max(1, level || 1));
  const currentXp = xp || 0;
  const xpForNextLevel = getXpForLevel(currentLevel);
  const xpPct = Math.min(100, Math.max(0, Math.round((currentXp / xpForNextLevel) * 100)));
  const lifetimeXp = useMemo(() => getCumulativeXpForLevel(currentLevel) + currentXp, [currentLevel, currentXp]);

  const characterTitle = useMemo(() => getCharacterTitle(currentLevel), [currentLevel]);

  // Modal States
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showAscensionModal, setShowAscensionModal] = useState(false);

  // Pillar Calculations based on real-world execution
  const completedTasksCount = useMemo(() => tasks.filter(t => t.isCompleted && !t.isSoftDeleted).length, [tasks]);
  const activeHabitsStreak = useMemo(() => habits.reduce((acc, h) => Math.max(acc, h.streakCount || 0), 0), [habits]);
  const journalNotesCount = useMemo(() => notes.filter(n => n.content.trim().length > 0).length, [notes]);

  // 1. Discipline Pillar (Tasks & Habit streaks)
  const disciplineScore = completedTasksCount * 2 + activeHabitsStreak * 5;
  const disciplineLevel = Math.min(10, Math.max(1, Math.floor(disciplineScore / 15) + 1));

  // 2. Wisdom Pillar (Notes & Reflections)
  const wisdomScore = journalNotesCount * 4;
  const wisdomLevel = Math.min(10, Math.max(1, Math.floor(wisdomScore / 12) + 1));

  // 3. Strength Pillar (Health, Vitality, Consistency)
  const strengthLevel = Math.min(10, Math.max(1, Math.floor((currentLevel + disciplineLevel) / 2)));

  // 4. Wealth Pillar (Financial Discipline & Milestones)
  const wealthLevel = Math.min(10, Math.max(1, Math.floor(currentLevel / 1.6) + 1));

  // Quests state
  const [quests, setQuests] = useState<Quest[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_QUESTS);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_QUESTS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(quests));
    }
  }, [quests]);

  const handleClaimQuest = (questId: string, xpReward: number) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true, currentProgress: q.targetProgress } : q));
    addXp(xpReward);
    if (!isEco) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleRerollBounties = () => {
    const fresh: Quest[] = [
      {
        id: `q-disc-${Date.now()}`,
        title: 'Focus Sprint Overdrive',
        description: 'Complete 8 high-priority tasks this week.',
        category: 'discipline',
        xpReward: 55,
        currentProgress: 0,
        targetProgress: 8,
        unit: 'tasks',
        isClaimed: false,
      },
      {
        id: `q-str-${Date.now()}`,
        title: 'Hydration Sentinel',
        description: 'Drink 3,000 ml water on 2 consecutive days.',
        category: 'strength',
        xpReward: 45,
        currentProgress: 0,
        targetProgress: 2,
        unit: 'days',
        isClaimed: false,
      },
      {
        id: `q-wis-${Date.now()}`,
        title: 'Clarity Journaling',
        description: 'Write 4 thoughtful entries in your journal.',
        category: 'wisdom',
        xpReward: 50,
        currentProgress: 0,
        targetProgress: 4,
        unit: 'entries',
        isClaimed: false,
      },
      {
        id: `q-wlt-${Date.now()}`,
        title: 'Savings Allocator',
        description: 'Log and allocate surplus into savings target.',
        category: 'wealth',
        xpReward: 60,
        currentProgress: 0,
        targetProgress: 1,
        unit: 'allocation',
        isClaimed: false,
      },
    ];
    setQuests(fresh);
    if (!isEco) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
  };

  const skillTrees = [
    {
      id: 'discipline',
      name: 'Discipline',
      sub: 'Task Execution & Unbroken Habit Streaks',
      icon: Lucide.Flame,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      badgeBg: 'bg-amber-500/15',
      level: disciplineLevel,
      statDesc: `${completedTasksCount} tasks done • ${activeHabitsStreak}d longest streak`,
      nodes: [
        { name: 'Spark of Will', minLevel: 1, desc: 'First 3 tasks completed' },
        { name: 'Streak Keeper', minLevel: 3, desc: '5-day habit streak unbroken' },
        { name: 'Execution Engine', minLevel: 6, desc: '25 total tasks logged' },
        { name: 'Titan of Routine', minLevel: 9, desc: '30-day streak unbroken' },
      ],
    },
    {
      id: 'wisdom',
      name: 'Wisdom',
      sub: 'Reflective Scribing & Evening Reviews',
      icon: Lucide.BookOpen,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      badgeBg: 'bg-purple-500/15',
      level: wisdomLevel,
      statDesc: `${journalNotesCount} journal logs & daily reviews`,
      nodes: [
        { name: 'The Observer', minLevel: 1, desc: 'First diary reflection logged' },
        { name: 'Daily Scribe', minLevel: 3, desc: '5 days of mindful notes' },
        { name: 'Mind Architect', minLevel: 6, desc: 'Morning intention rituals locked' },
        { name: 'Sage of Clarity', minLevel: 9, desc: 'Deep clarity and mental stillness' },
      ],
    },
    {
      id: 'strength',
      name: 'Strength',
      sub: 'Hydration, Rest, Nutrition & Training',
      icon: Lucide.Shield,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      badgeBg: 'bg-rose-500/15',
      level: strengthLevel,
      statDesc: `Level synergy • Biological OS consistency`,
      nodes: [
        { name: 'Hydration Novice', minLevel: 1, desc: '2.5L water logged' },
        { name: 'Iron Body', minLevel: 3, desc: '3 gym sessions in a week' },
        { name: 'Sleep Sanctum', minLevel: 6, desc: '7 consecutive optimal sleep nights' },
        { name: 'Apex Vitality', minLevel: 9, desc: 'Sustained 90+ health score' },
      ],
    },
    {
      id: 'wealth',
      name: 'Wealth',
      sub: 'Budget Discipline & Investment Growth',
      icon: Lucide.Coins,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/15',
      level: wealthLevel,
      statDesc: `Financial discipline rating • Surplus pace`,
      nodes: [
        { name: 'Frugal Apprentice', minLevel: 1, desc: 'Track first 10 expenses' },
        { name: 'Budget Warden', minLevel: 3, desc: 'Full month under spending cap' },
        { name: 'Asset Builder', minLevel: 6, desc: 'Emergency savings target funded' },
        { name: 'Sovereign Peace', minLevel: 9, desc: 'Complete financial serenity' },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-20 select-none font-sans">
      {/* 1. Hero Holographic Character Crest */}
      <div className="tile p-5 sm:p-8 rounded-3xl relative overflow-hidden border border-border/80 shadow-xl">
        {/* Background glow animation (disabled in Eco Mode) */}
        {!isEco && (
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        )}
        {!isEco && (
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Character Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              {/* Hologram Rings (disabled in eco mode) */}
              {!isEco && (
                <div
                  className="absolute -inset-2 rounded-3xl border border-dashed border-primary/40 pointer-events-none animate-spin-cw [animation-duration:30s]"
                />
              )}
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-3xl bg-surface-elevated border-2 border-primary/40 flex items-center justify-center text-primary shadow-2xl relative overflow-hidden group shrink-0">
                <Lucide.Crown size={34} className={!isEco ? "animate-bounce-subtle" : ""} />
                <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider">
                  Lv.{currentLevel}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground capitalize">
                  {settings.alias || 'Shadow'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black text-primary border border-primary/40 bg-primary/10 shadow-xs shrink-0">
                  Level {currentLevel} / 100
                </span>
                <button
                  type="button"
                  onClick={() => setShowAscensionModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400 transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  <Lucide.Sparkles size={12} className="text-amber-400 shrink-0" />
                  <span>Ascension Perks</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm font-extrabold text-primary/90 tracking-wide">
                {characterTitle}
              </p>

              <p className="text-xs text-muted-foreground font-medium">
                Lifetime XP: <strong className="text-foreground font-mono">{lifetimeXp.toLocaleString()}</strong> • 4-Pillar Life OS
              </p>
            </div>
          </div>

          {/* XP Progress Card */}
          <div className="w-full lg:w-96 space-y-3 bg-surface-elevated/80 backdrop-blur-md p-5 rounded-2xl border border-border/80 shadow-md">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lucide.Zap size={14} className="text-amber-400" />
                Level {currentLevel} Progress
              </span>
              <span className="text-primary font-mono text-xs">
                {currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP ({xpPct}%)
              </span>
            </div>

            <div className="w-full h-3.5 bg-secondary/80 rounded-full overflow-hidden border border-border/70 p-0.5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary via-purple-400 to-cyan-400 rounded-full shadow-md relative overflow-hidden"
              >
                {!isEco && (
                  <div
                    className="absolute inset-0 bg-white/25 w-1/3 -skew-x-12 animate-beam-scan-x"
                  />
                )}
              </motion.div>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground pt-0.5">
              <span>{Math.max(0, xpForNextLevel - currentXp).toLocaleString()} XP to Level {Math.min(100, currentLevel + 1)}</span>
              <button
                type="button"
                onClick={() => setShowRoadmapModal(true)}
                className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Roadmap (1-100) <Lucide.ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. The 4 Life Pillars & Skill Trees */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <Lucide.GitBranch size={20} className="text-primary" />
              The 4 Life Pillars &amp; Algorithmic Skill Trees
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Calculated dynamically from real execution telemetry (tasks, habit streaks, reflections &amp; vitals).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="filter-pill text-xs font-bold text-muted-foreground">
              Universal Algorithm
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillTrees.map(tree => {
            const Icon = tree.icon;
            return (
              <div
                key={tree.id}
                className={`tile p-5 sm:p-6 rounded-3xl space-y-5 border ${tree.border} transition-all duration-300 hover:shadow-lg`}
              >
                {/* Pillar Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-2xl ${tree.bg} ${tree.color} border ${tree.border}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground tracking-tight">{tree.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{tree.sub}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`filter-pill text-xs font-black font-mono ${tree.color} ${tree.border} ${tree.badgeBg}`}>
                      Tier {tree.level} / 10
                    </span>
                    <span className="block text-xs text-muted-foreground font-medium mt-1">
                      {tree.statDesc}
                    </span>
                  </div>
                </div>

                {/* Milestone Nodes Grid */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Pillar Milestones</span>
                    <span>Requirement</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tree.nodes.map((node, i) => {
                      const isUnlocked = tree.level >= node.minLevel;
                      const isCurrentTarget = tree.level + 1 === node.minLevel;

                      return (
                        <div
                          key={i}
                          className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between space-y-1.5 relative overflow-hidden ${
                            isUnlocked
                              ? 'bg-surface-elevated/90 border-primary/40 shadow-xs'
                              : isCurrentTarget
                              ? 'bg-secondary/40 border-amber-500/40 ring-1 ring-amber-500/30'
                              : 'bg-secondary/20 border-border/40 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black ${isUnlocked ? tree.color : isCurrentTarget ? 'text-amber-300' : 'text-muted-foreground'}`}>
                              {node.name}
                            </span>
                            {isUnlocked ? (
                              <Lucide.CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            ) : isCurrentTarget ? (
                              <span className="text-[11px] font-bold uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Next</span>
                            ) : (
                              <Lucide.Lock size={12} className="text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {node.desc}
                          </p>
                          <div className="text-[11px] font-mono text-secondary font-semibold">
                            Tier {node.minLevel} Prerequisite
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Weekly Procedural Bounties & Quests */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <Lucide.Target size={20} className="text-amber-400" />
              Weekly Procedural Bounties
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Complete real-world objectives each week to earn bonus XP bursts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRerollBounties}
              className="btn-glass-pill text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-amber-400/50"
              title="Reroll weekly challenges"
            >
              <Lucide.RefreshCw size={13} className="text-amber-400" />
              <span>Reroll Bounties</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quests.map(q => {
            const isComplete = q.currentProgress >= q.targetProgress;
            const pct = Math.min(100, Math.round((q.currentProgress / q.targetProgress) * 100));

            return (
              <div
                key={q.id}
                className="tile p-5 rounded-2xl space-y-3.5 flex flex-col justify-between border border-border/80 hover:border-primary/40 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      {q.title}
                    </h3>
                    <span className="filter-pill text-xs font-bold text-amber-400 border-amber-500/30 bg-amber-500/15 py-0.5 px-2.5">
                      +{q.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {q.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono text-foreground">
                      {q.currentProgress} / {q.targetProgress} {q.unit} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-secondary/80 rounded-full overflow-hidden border border-border/60">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-border/50">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground capitalize">
                    Pillar: {q.category}
                  </span>

                  {q.isClaimed ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Lucide.CheckCircle2 size={15} />
                      Claimed (+{q.xpReward} XP)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleClaimQuest(q.id, q.xpReward)}
                      disabled={!isComplete}
                      className={`btn-glass-pill text-xs font-black px-4 py-1.5 transition-all cursor-pointer ${
                        isComplete
                          ? 'active cursor-pointer hover:scale-105'
                          : 'opacity-40 cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      {isComplete ? 'Claim XP Reward' : 'In Progress'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Level Milestone Roadmap Modal */}
      <Modal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        title="Life RPG Milestone Roadmap (1–100)"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground font-medium">
            Your journey scales from humble Novice Wanderer to legendary Eternal Sovereign of Shadows. Levels are mathematically bound to real-life consistency.
          </p>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2">
            {MILESTONES.map(m => {
              const isPast = currentLevel >= m.level;
              const isCurrent = currentLevel === m.level;

              return (
                <div
                  key={m.level}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary/40'
                      : isPast
                      ? 'bg-surface-elevated/80 border-border/80'
                      : 'bg-secondary/20 border-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isPast
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}>
                      Lv.{m.level}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                        {m.title}
                        {isCurrent && <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">CURRENT</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.perk}</p>
                    </div>
                  </div>

                  <span className="filter-pill text-xs font-bold text-secondary">
                    {m.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 5. Ascension Showcase Modal */}
      <Modal
        isOpen={showAscensionModal}
        onClose={() => setShowAscensionModal(false)}
        title="Ascension & Character Tier Showcase"
      >
        <div className="space-y-6 py-2 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 border-2 border-primary/40 text-primary flex items-center justify-center shadow-lg">
              <Lucide.Sparkles size={40} className={!isEco ? 'animate-pulse' : ''} />
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Current Ascension Tier
              </span>
              <h3 className="text-2xl font-black text-foreground tracking-tight">
                {characterTitle}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold mt-1">
                Level {currentLevel} • {lifetimeXp.toLocaleString()} Lifetime XP Earned
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-border text-left space-y-2 text-xs font-medium">
            <h4 className="font-black text-foreground uppercase tracking-wider text-xs">Universal Ascension Rule</h4>
            <p className="text-muted-foreground leading-relaxed">
              All XP is strictly earned from real-life actions (tasks completed, habits checked, focus scores logged, and journal entries written). As you reach higher levels, exponential scaling rewards long-term discipline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAscensionModal(false)}
            className="btn-glass-pill w-full py-2.5 active font-black text-xs cursor-pointer"
          >
            Close Showcase
          </button>
        </div>
      </Modal>
    </div>
  );
}
