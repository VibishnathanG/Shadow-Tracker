'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useViewPreference } from '@/lib/viewPreferences';

interface PageGuide {
  id: string;
  title: string;
  tabId: string;
  icon: string;
  badge: string;
  summary: string;
  howToUse: string;
  keyFeatures: string[];
  color: string;
  bg: string;
  border: string;
}

const pageGuides: PageGuide[] = [
  {
    "id": "dashboard",
    "title": "Dashboard",
    "tabId": "dashboard",
    "icon": "LayoutDashboard",
    "badge": "Daily Control Hub",
    "summary": "Your home base for monitoring daily execution momentum, live Focus Score percentage, daily briefing reviews, and quick entries.",
    "howToUse": "Check off today's habits and tasks, trigger morning/evening reflections, and inspect your real-time execution flow state.",
    "keyFeatures": [
      "Live Daily Focus Score (%) telemetry calculation",
      "Achievement Nexus badge ribbon showcasing unlocked milestones",
      "One-click Morning Briefing & Evening Reflection modals",
      "Fast inline task and habit capture bar"
    ],
    "color": "text-violet-500",
    "bg": "bg-violet-500/10",
    "border": "border-violet-500/30"
  },
  {
    "id": "tasks",
    "title": "Tasks Workspace",
    "tabId": "tasks",
    "icon": "CheckSquare",
    "badge": "Complex Execution",
    "summary": "Structured project execution engine with priorities, custom categories, subtasks, dynamic recurrence schedules, and quick snoozing.",
    "howToUse": "Filter by Pending/Completed/All with capsule pills, assign High/Medium/Low priority, set recurrence rules, or snooze items by 1 day.",
    "keyFeatures": [
      "Glassy capsule filters (All Dates, Today, Tomorrow, This Week, Overdue)",
      "Dynamic recurrence engine (Daily, Weekly, Monthly)",
      "1-Click quick snooze to postpone tasks to tomorrow",
      "Dual viewing modes: detailed row list or visual compact grid"
    ],
    "color": "text-blue-500",
    "bg": "bg-blue-500/10",
    "border": "border-blue-500/30"
  },
  {
    "id": "todo",
    "title": "Standalone ToDo Hub",
    "tabId": "todo",
    "icon": "ListTodo",
    "badge": "Fast Checklist",
    "summary": "An ultra-fast, zero-friction checklist for quick daily tasks, instant subtasks, starring high-priority items, and 15-day commitment telemetry.",
    "howToUse": "Type a task in the rapid bar to save instantly. Star critical tasks, expand inline subtasks, or switch between List and Grid view.",
    "keyFeatures": [
      "Instant inline subtask adding directly on task cards",
      "15-Day Committed vs Completed visual activity bar graph",
      "Quick Star toggle for high-priority focus items",
      "Capsule filters for All, Active, Completed, and Starred"
    ],
    "color": "text-cyan-500",
    "bg": "bg-cyan-500/10",
    "border": "border-cyan-500/30"
  },
  {
    "id": "habits",
    "title": "Habits Tracker",
    "tabId": "habits",
    "icon": "Repeat",
    "badge": "Streak Architect",
    "summary": "Build lasting daily disciplines with flexible scheduling models, streak counters, and intelligent completion locks.",
    "howToUse": "Configure habits as Daily, Once-a-Week (locks upon first weekly tick), or Custom Days (e.g. Mon/Wed/Fri). Check off daily to grow streaks.",
    "keyFeatures": [
      "Flexible frequency schedules (Daily, 1x/Week, Custom Days)",
      "Smart 1-tick week locking mechanism for weekly target habits",
      "Real-time streak counters tracking current and longest streaks",
      "Visual completion dots with category color coding"
    ],
    "color": "text-emerald-500",
    "bg": "bg-emerald-500/10",
    "border": "border-emerald-500/30"
  },
  {
    "id": "calendar",
    "title": "Calendar & Time-Blocking",
    "tabId": "calendar",
    "icon": "Calendar",
    "badge": "Schedule Inspector",
    "summary": "A visual monthly grid, weekly row, and dedicated Time-Blocking planner to inspect, allocate hours, and check off historical records.",
    "howToUse": "Switch between Month, Week, and Timeline views using glassy pill buttons. Click any date to inspect tasks, habits, and daily journal notes.",
    "keyFeatures": [
      "Interactive Month, Week, and Timeline view toggle controls",
      "Full Day Inspector modal with direct task & habit check-offs",
      "Time-blocking schedule engine for hourly calendar allocation",
      "1-Click quick jump to Today"
    ],
    "color": "text-amber-500",
    "bg": "bg-amber-500/10",
    "border": "border-amber-500/30"
  },
  {
    "id": "health",
    "title": "Health & Vitality Suite",
    "tabId": "health",
    "icon": "Activity",
    "badge": "Biological OS",
    "summary": "Comprehensive biological management including Nutrition Plate Visualizer, Weekly Diet Planner, Gym Workout Splits, and Feasibility Engine.",
    "howToUse": "Log meals with macro breakdown (protein, carbs, fats), track water in 250ml intervals, view your 7-day hydration bars, and plan gym routines.",
    "keyFeatures": [
      "Interactive Nutrition Plate Visualizer with macro progress rings",
      "Weekly Diet Planner with pre-configured healthy meal blueprints",
      "Gym & Fitness Split Tracker with exercise sets, reps, and weights",
      "Calorie & Weight Feasibility Engine with dynamic activity adjustments"
    ],
    "color": "text-rose-500",
    "bg": "bg-rose-500/10",
    "border": "border-rose-500/30"
  },
  {
    "id": "analytics",
    "title": "Analytics Command Center",
    "tabId": "analytics",
    "icon": "TrendingUp",
    "badge": "Telemetry Engine",
    "summary": "Deep data analytics featuring a 15-day Focus Line Graph, a 4-5 Week Habits Monthly Matrix with live checkboxes, and a 49-day Tasks Heatmap.",
    "howToUse": "Inspect daily focus scores over the last 15 days, check off missed habits directly within the monthly grid, and analyze peak execution hours.",
    "keyFeatures": [
      "15-Day Focus Score line graph with interactive tooltips",
      "4-5 Week Habits Monthly Matrix with live historical check-ins",
      "49-Day GitHub-style Tasks Contribution Heatmap",
      "Prime Time hour telemetry identifying peak productivity windows"
    ],
    "color": "text-fuchsia-500",
    "bg": "bg-fuchsia-500/10",
    "border": "border-fuchsia-500/30"
  },
  {
    "id": "notes",
    "title": "Journal & Reflections",
    "tabId": "notes",
    "icon": "BookOpen",
    "badge": "Mindfulness & Logs",
    "summary": "A private daily markdown diary to record morning intentions, evening reviews, technical notes, and deep reflections.",
    "howToUse": "Pick any date or create a new journal entry. Format using standard markdown syntax (headings, bold, lists, quotes, code blocks).",
    "keyFeatures": [
      "Full Markdown editor with instant preview and syntax styling",
      "Integrated with Morning Briefing and Evening Reflection reviews",
      "Date-bound reflections automatically linked to daily logs",
      "Real-time search filtering across all journal archives"
    ],
    "color": "text-indigo-500",
    "bg": "bg-indigo-500/10",
    "border": "border-indigo-500/30"
  },
  {
    "id": "money",
    "title": "Wealth & Subscriptions OS",
    "tabId": "money",
    "icon": "DollarSign",
    "badge": "Finance Manager",
    "summary": "Personal finance operating system to track monthly income, categorized expenses, recurring subscriptions, savings goals, and investment assets.",
    "howToUse": "Record income sources and expenses, set monthly savings/investment targets, and track active recurring software subscriptions.",
    "keyFeatures": [
      "Monthly Income vs Expense cashflow breakdown",
      "Savings & Investment allocation progress meters",
      "Recurring Subscriptions management with renewal cadence",
      "Net Worth calculation and financial discipline rating"
    ],
    "color": "text-teal-500",
    "bg": "bg-teal-500/10",
    "border": "border-teal-500/30"
  },
  {
    "id": "rpg",
    "title": "Life RPG & Gamification",
    "tabId": "rpg",
    "icon": "Crown",
    "badge": "Universal Progression",
    "summary": "Universal XP-based gamification engine with evolving character crest, 4 Life Pillars (Discipline, Wisdom, Strength, Wealth), and weekly bounties.",
    "howToUse": "Earn universal XP by completing tasks (+15), habits (+10), logs (+15), and reviews (+20). Claim weekly bounties to level up to 100.",
    "keyFeatures": [
      "Universal mathematical leveling algorithm scaling up to Level 100",
      "The 4 Life Pillars dynamically calculated from real execution data",
      "Weekly procedural bounties with XP rewards and claim celebration",
      "Eco Mode support: disables heavy continuous loops on low-spec hardware"
    ],
    "color": "text-amber-400",
    "bg": "bg-amber-400/10",
    "border": "border-amber-400/30"
  },
  {
    "id": "wizard",
    "title": "System Wizard",
    "tabId": "wizard",
    "icon": "Sparkles",
    "badge": "Setup & Calibration",
    "summary": "Interactive system calibrator and onboarding guide to configure your life profile, avatar, primary habits, and target productivity baseline.",
    "howToUse": "Step through the guided workflow to calibrate your daily routine parameters, customize your alias, and seed initial goals.",
    "keyFeatures": [
      "Step-by-step calibration for schedule, sleep, and focus targets",
      "Interactive companion avatar selection",
      "Automated initial category and habit seeding",
      "Instant profile synchronization with app settings"
    ],
    "color": "text-purple-400",
    "bg": "bg-purple-400/10",
    "border": "border-purple-400/30"
  },
  {
    "id": "settings",
    "title": "Settings & Local Backup",
    "tabId": "settings",
    "icon": "Settings",
    "badge": "Customization & Data",
    "summary": "Full control over your visual themes, global UI scale, category taxonomy, and 100% offline JSON database export, import, and reset.",
    "howToUse": "Switch between 5 dynamic themes, adjust global UI scale, customize category colors and icons, or back up your complete data vault.",
    "keyFeatures": [
      "5 Dynamic Themes: Obsidian, Cyberpunk, OneDark, Midnight, Light",
      "Global App Scale zoom slider (75% to 125%)",
      "100% Local JSON Database Export, Import & Merging",
      "Epoch Badge Reset & Total Factory Reset protections"
    ],
    "color": "text-pink-500",
    "bg": "bg-pink-500/10",
    "border": "border-pink-500/30"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 24 } }
};

interface ExplorerFeatureProps {
  onNavigate?: (tab: string) => void;
  onBackToDashboard?: () => void;
}

export default function ExplorerFeature({ onNavigate, onBackToDashboard }: ExplorerFeatureProps) {
  const [selectedFilter, setSelectedFilter] = useViewPreference('explorerFilter') as ['all' | 'core' | 'lifestyle' | 'intelligence', (v: 'all' | 'core' | 'lifestyle' | 'intelligence') => void];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = pageGuides.filter(guide => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = guide.title.toLowerCase().includes(q);
      const matchSummary = guide.summary.toLowerCase().includes(q);
      const matchKey = guide.keyFeatures.some(f => f.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchKey) return false;
    }

    if (selectedFilter === 'core') return ['dashboard', 'tasks', 'todo', 'habits', 'calendar'].includes(guide.id);
    if (selectedFilter === 'lifestyle') return ['health', 'money', 'rpg'].includes(guide.id);
    if (selectedFilter === 'intelligence') return ['analytics', 'notes', 'wizard', 'settings'].includes(guide.id);
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20 select-none font-sans">
      {/* Hero Header */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-md">
              <Lucide.Compass size={26} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                Shadow-Tracker Explorer
              </h1>
              <p className="text-xs text-primary font-extrabold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Complete Operating System Manual &amp; Architecture
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="btn-glass-pill flex items-center gap-2 text-xs font-black self-start sm:self-auto cursor-pointer hover:scale-105 active:scale-95"
            >
              <Lucide.ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        <p className="text-muted-foreground text-sm md:text-base font-medium max-w-4xl leading-relaxed">
          Welcome to your complete operating system manual. Shadow-Tracker delivers an offline-first, private life OS spanning productivity, biological vitality, financial freedom, and universal RPG progression with zero telemetry tracking.
        </p>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 tile p-4 rounded-3xl">
        <div className="pill-group overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'All Modules (12)', icon: 'Layers' },
            { id: 'core', label: 'Core Productivity (5)', icon: 'CheckSquare' },
            { id: 'lifestyle', label: 'Health & Wealth (3)', icon: 'Heart' },
            { id: 'intelligence', label: 'Analytics & Config (4)', icon: 'TrendingUp' },
          ].map(tab => {
            const Icon = (Lucide[tab.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id as typeof selectedFilter)}
                className={`filter-pill ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Lucide.Search className="absolute left-3.5 top-3 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-surface-elevated/70 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Page Guide Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredGuides.map(guide => {
          const Icon = (Lucide[guide.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;

          return (
            <motion.div 
              key={guide.id}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="tile p-6 flex flex-col justify-between space-y-5 border border-border/80 hover:border-primary/40 transition-all duration-300 group rounded-3xl"
            >
              <div className="space-y-4">
                {/* Header Badge & Icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${guide.bg} ${guide.color} border ${guide.border} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${guide.bg} ${guide.color} border ${guide.border}`}>
                    {guide.badge}
                  </span>
                </div>

                {/* Title & Summary */}
                <div>
                  <h3 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-foreground/80 font-medium leading-relaxed mt-1.5">
                    {guide.summary}
                  </p>
                </div>

                {/* How to Use Box */}
                <div className="bg-secondary/30 border border-border/40 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                    How to use:
                  </span>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    {guide.howToUse}
                  </p>
                </div>

                {/* Key Features Bullet List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block">
                    Key Features:
                  </span>
                  <ul className="space-y-1.5">
                    {guide.keyFeatures.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                        <Lucide.CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(guide.tabId)}
                    className="btn-glass-pill w-full mt-3 py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-primary/50"
                  >
                    <span>Open {guide.title}</span>
                    <Lucide.ArrowRight size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Deep Dive 1: Achievement Nexus Badge Lifecycle */}
      <section className="tile p-6 sm:p-8 rounded-3xl space-y-6 border border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
              <Lucide.Award size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Achievement Nexus Architecture &amp; Badge Lifecycle
              </h2>
              <p className="text-xs text-secondary font-bold uppercase tracking-wider">
                Permanent Milestone Status • Decoupled from Leveling • Epoch Reset System
              </p>
            </div>
          </div>
          <span className="filter-pill self-start sm:self-auto text-amber-400 border-amber-500/30 bg-amber-500/10">
            10 Permanent Badges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium leading-relaxed">
          <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-border/70 space-y-2">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Lucide.CheckCircle2 size={16} className="text-emerald-400" />
              1. Permanent Milestones
            </h4>
            <p className="text-muted-foreground">
              Badges represent lifelong habits and execution milestones. Once you achieve an unlock criterion, the badge is earned permanently and saved directly into your local database.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-border/70 space-y-2">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Lucide.GitFork size={16} className="text-primary" />
              2. Decoupled from Leveling
            </h4>
            <p className="text-muted-foreground">
              Achievement Nexus is strictly focused on real-world milestone accomplishments. Character leveling, ascension titles, and XP mechanics are completely housed inside the <strong>Life RPG</strong> engine.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-border/70 space-y-2">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <Lucide.RefreshCw size={16} className="text-cyan-400" />
              3. Epoch Reset Guarantee
            </h4>
            <p className="text-muted-foreground">
              When you reset badges or clear data in Settings, the system logs an epoch timestamp (<code className="px-1 py-0.5 bg-secondary rounded text-[10px]">badgesResetTimestamp</code>). Any events prior to that epoch will never cause ghost unlocks.
            </p>
          </div>
        </div>

        {/* 10 Badges Table / Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            The 10 System Badges &amp; Exact Unlock Criteria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { id: 'first-task', name: 'First Spark', icon: 'Target', trigger: 'Complete 1 Task or Standalone ToDo', color: 'text-cyan-400', tag: 'Initiation' },
              { id: 'first-habit', name: 'Atomic Habit', icon: 'Activity', trigger: 'Complete 1 Habit check-off', color: 'text-indigo-400', tag: 'Routine' },
              { id: 'streak-3', name: 'Triple Streak', icon: 'Zap', trigger: 'Maintain a 3-day continuous habit streak', color: 'text-amber-400', tag: 'Consistency' },
              { id: 'streak-7', name: 'Weekly Streak', icon: 'ShieldCheck', trigger: 'Maintain an unbroken 7-day routine streak', color: 'text-emerald-400', tag: 'Discipline' },
              { id: 'streak-30', name: 'Monthly Core', icon: 'Flame', trigger: 'Forge an unbroken 30-day streak', color: 'text-orange-400', tag: 'Mastery' },
              { id: 'streak-90', name: 'Quarter Zenith', icon: 'Crown', trigger: 'Sustain a legendary 90-day streak', color: 'text-fuchsia-400', tag: 'Legendary' },
              { id: 'perfect-day', name: 'Deep Harmony', icon: 'Sun', trigger: 'Achieve >= 95% Daily Focus Score with tasks/habits', color: 'text-yellow-400', tag: 'Flow State' },
              { id: 'first-note', name: 'Mindful Mind', icon: 'BookOpen', trigger: 'Log your first daily reflection or journal entry', color: 'text-purple-400', tag: 'Mindfulness' },
              { id: 'century', name: 'Century Master', icon: 'CheckCircle2', trigger: 'Process 100 total completed tasks or ToDos', color: 'text-pink-400', tag: 'Execution' },
              { id: 'wealth', name: 'Wealth Master', icon: 'TrendingUp', trigger: 'Hit monthly savings & investment targets', color: 'text-teal-400', tag: 'Financial' },
            ].map((b, i) => {
              const IconComponent = (Lucide[b.icon as keyof typeof Lucide] || Lucide.Award) as React.ElementType;
              return (
                <div key={i} className="p-3.5 rounded-2xl bg-surface-elevated/60 border border-border/70 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-surface border border-border/80 ${b.color}`}>
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{b.name}</h4>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{b.tag}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">{b.trigger}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deep Dive 2: Life RPG Universal Leveling Engine */}
      <section className="tile p-6 sm:p-8 rounded-3xl space-y-6 border border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
              <Lucide.Crown size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Life RPG &amp; Universal XP Leveling Engine
              </h2>
              <p className="text-xs text-secondary font-bold uppercase tracking-wider">
                Universal Curve • The 4 Life Pillars • Weekly Bounties • Level 100 Cap
              </p>
            </div>
          </div>
          <span className="filter-pill self-start sm:self-auto text-primary border-primary/30 bg-primary/10">
            Level 1 → 100 System
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium leading-relaxed">
          {/* Universal XP Curve Explanation */}
          <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-border/70 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Lucide.TrendingUp size={16} className="text-primary" />
              Universal Leveling Curve Algorithm
            </h4>
            <p className="text-muted-foreground">
              The RPG engine is governed by a dual-stage mathematical curve designed to balance instant early engagement with long-term real-life commitment:
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <strong>Levels 1–10 (Onboarding):</strong> Handcrafted progression curve starting at 100 XP up to 7,000 XP.
              </li>
              <li className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <strong>Levels 11–99 (Exponential):</strong> Formula: <code className="px-1 py-0.5 bg-secondary rounded text-[10px]">Math.floor(100 * Math.pow(level, 1.95))</code>.
              </li>
              <li className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <strong>Level 100 (Legendary Cap):</strong> <span className="text-amber-400 font-bold">Eternal Sovereign of Shadows</span>. Hard ceiling requiring millions of cumulative XP.
              </li>
            </ul>
          </div>

          {/* XP Ingestion Matrix */}
          <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-border/70 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Lucide.Zap size={16} className="text-amber-400" />
              Universal XP Ingestion Sources
            </h4>
            <p className="text-muted-foreground">
              XP is awarded automatically and consistently across every feature of Shadow-Tracker:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Complete Task</span>
                <span className="font-bold text-primary font-mono">+15 XP</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Check off Habit</span>
                <span className="font-bold text-emerald-400 font-mono">+10 XP</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Log Meal / Water</span>
                <span className="font-bold text-rose-400 font-mono">+15 XP</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Daily Review Modal</span>
                <span className="font-bold text-indigo-400 font-mono">+20 XP</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Focus Session</span>
                <span className="font-bold text-cyan-400 font-mono">+25 XP</span>
              </div>
              <div className="p-2 rounded-xl bg-surface border border-border flex justify-between items-center">
                <span>Weekly Quest</span>
                <span className="font-bold text-amber-400 font-mono">+40-60 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            The 4 Life Pillars &amp; Algorithmic Calculation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Lucide.Flame size={18} />
                <span>Discipline Pillar</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Calculated from completed tasks count multiplied by active habit streak depth: <code className="text-[10px] block mt-1">(tasks * 2 + streaks * 5) / 15</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
                <Lucide.BookOpen size={18} />
                <span>Wisdom Pillar</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Calculated from reflective journal density, morning briefings, and evening reflection entries: <code className="text-[10px] block mt-1">notes.length / 3</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <Lucide.Shield size={18} />
                <span>Strength Pillar</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Calculated from biological consistency: hydration logging, optimal sleep hours, and completed workout minutes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Lucide.Coins size={18} />
                <span>Wealth Pillar</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Calculated from monthly budget discipline, emergency fund growth, and consistent investment contributions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Guarantees & Privacy Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="tile p-6 space-y-3 border-emerald-500/20 bg-emerald-500/5 rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Lucide.ShieldCheck size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">100% Offline &amp; Local</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            All tasks, habits, daily logs, health vitals, and finances are stored strictly inside your browser sandbox. Zero telemetry tracking, zero cloud dependencies.
          </p>
        </div>

        <div className="tile p-6 space-y-3 border-purple-500/20 bg-purple-500/5 rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Lucide.Command size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">Command Bar (⌘ K)</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Press <code className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[11px] font-bold text-foreground">⌘ K</code> or <code className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[11px] font-bold text-foreground">Ctrl+K</code> anywhere to open the global Command Bar to search anything or jump modules instantly.
          </p>
        </div>

        <div className="tile p-6 space-y-3 border-pink-500/20 bg-pink-500/5 rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Lucide.Cpu size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">Eco Mode &amp; Low GPU</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Toggle Eco Mode in Settings anytime to disable heavy infinite background animations and GPU blurs, keeping laptops cool and preserving mobile battery life.
          </p>
        </div>
      </div>
    </div>
  );
}
