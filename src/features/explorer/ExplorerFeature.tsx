'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';

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
    id: 'dashboard',
    title: 'Dashboard',
    tabId: 'dashboard',
    icon: 'LayoutDashboard',
    badge: 'Daily Control Panel',
    summary: 'Your home base for tracking today’s momentum, focus percentage, and daily execution.',
    howToUse: 'Check off habits as you complete them, add new tasks instantly, and monitor your focus score streak.',
    keyFeatures: [
      'Live Daily Focus Score (%) telemetry',
      'Streak counter & achievement badges',
      'Quick task entry & habit check-ins',
      'Interactive Wizard Mascot for daily motivation'
    ],
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30'
  },
  {
    id: 'tasks',
    title: 'Tasks Engine',
    tabId: 'tasks',
    icon: 'CheckSquare',
    badge: 'Task Management',
    summary: 'Organize one-off and recurring tasks with priorities, due dates, and category tags.',
    howToUse: 'Filter tasks by Pending/Completed, assign High/Medium/Low priority, or snooze a task to tomorrow with 1 click.',
    keyFeatures: [
      'High, Medium, Low priority tags',
      '1-Click Snooze to postpone tasks to tomorrow',
      'Recurring tasks (Daily, Weekly, Monthly)',
      'Category classification & instant search'
    ],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  },
  {
    id: 'habits',
    title: 'Habits Tracker',
    tabId: 'habits',
    icon: 'Repeat',
    badge: 'Routine Building',
    summary: 'Build long-term habits with flexible schedules and track your unbroken consistency streaks.',
    howToUse: 'Choose Daily, Once-a-Week (1-tick week lock), or Custom Days (e.g. Mon/Wed/Fri) when creating a habit.',
    keyFeatures: [
      'Flexible schedules (Daily, 1x/Week, Custom Days)',
      'Smart 1-tick week locking for weekly goals',
      'Current & longest streak milestone counters',
      'Historical completion logs & category dots'
    ],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30'
  },
  {
    id: 'calendar',
    title: 'Calendar Planner',
    tabId: 'calendar',
    icon: 'Calendar',
    badge: 'Schedule Inspector',
    summary: 'A visual monthly grid and daily inspector to view all scheduled tasks and habits by date.',
    howToUse: 'Click any day on the calendar grid to inspect tasks, habits, and notes recorded for that specific date.',
    keyFeatures: [
      'Full monthly visual grid layout',
      'Day detail inspector panel',
      '1-Click habit completion from calendar',
      'Historical date lookup'
    ],
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30'
  },
  {
    id: 'analytics',
    title: 'Analytics Command Center',
    tabId: 'analytics',
    icon: 'TrendingUp',
    badge: 'Performance Telemetry',
    summary: 'Deep data telemetry featuring line charts, a 4-5 Week Habits Grid, and a Tasks Heatmap.',
    howToUse: 'Inspect your 15-day Focus Graph, toggle habit check-ins directly in the Monthly Grid, and view your 49-day Tasks Heatmap.',
    keyFeatures: [
      '15-Day Focus Score Timeline line graph',
      '4-5 Week Habits Monthly Grid with live checkboxes',
      'GitHub-style Tasks Contribution Heatmap',
      'Peak execution hour ("Prime Time") analysis'
    ],
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30'
  },
  {
    id: 'notes',
    title: 'Journal & Reflections',
    tabId: 'notes',
    icon: 'BookOpen',
    badge: 'Mindfulness & Notes',
    summary: 'A private daily markdown diary to capture reflections, technical notes, and ideas.',
    howToUse: 'Select a date or create a new journal entry. Use markdown for headings, bullet points, and code blocks.',
    keyFeatures: [
      'Full Markdown editor with syntax support',
      'Instant search across all reflections',
      'Date-linked journal logs',
      'Mindful thought tracking'
    ],
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30'
  },
  {
    id: 'money',
    title: 'Wealth Tracker',
    tabId: 'money',
    icon: 'DollarSign',
    badge: 'Finance Manager',
    summary: 'Keep track of your personal finances, monthly income, expenses, savings, and investments.',
    howToUse: 'Log your monthly income and expenses, set savings targets, and track your investment portfolio growth.',
    keyFeatures: [
      'Monthly income vs expense breakdown',
      'Savings & Investment allocation trackers',
      'Net Worth milestone metrics',
      'Financial discipline rating'
    ],
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30'
  },
  {
    id: 'settings',
    title: 'Settings & Privacy',
    tabId: 'settings',
    icon: 'Settings',
    badge: 'Customization',
    summary: 'Tailor your visual theme, adjust UI scale, manage categories, and control local data backups.',
    howToUse: 'Switch between 5 dynamic themes, scale the interface zoom, or export a local JSON backup of your database.',
    keyFeatures: [
      '5 Dynamic Themes (Obsidian, Cyberpunk, OneDark, Midnight, Light)',
      'Global UI App Scale zoom controls',
      'Custom category colors & icons',
      'JSON Database Export & Import (100% local)'
    ],
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30'
  },
  {
    id: 'explorer',
    title: 'Explorer Guide',
    tabId: 'explorer',
    icon: 'Compass',
    badge: 'Sitemap & Tour',
    summary: 'Your interactive sitemap and operating system manual to master every tool in Shadow-Tracker.',
    howToUse: 'Browse page guides to understand features, shortcuts, and privacy guarantees.',
    keyFeatures: [
      'Comprehensive page guides',
      'Simple, intuitive feature walkthroughs',
      'Keyboard shortcuts quick reference',
      'Privacy-first architecture overview'
    ],
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface ExplorerFeatureProps {
  onNavigate?: (tab: string) => void;
}

export default function ExplorerFeature({ onNavigate }: ExplorerFeatureProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'core' | 'analytics' | 'lifestyle'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = pageGuides.filter(guide => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = guide.title.toLowerCase().includes(q);
      const matchSummary = guide.summary.toLowerCase().includes(q);
      const matchKey = guide.keyFeatures.some(f => f.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchKey) return false;
    }

    if (selectedFilter === 'core') return ['dashboard', 'tasks', 'habits', 'calendar'].includes(guide.id);
    if (selectedFilter === 'analytics') return ['analytics', 'money'].includes(guide.id);
    if (selectedFilter === 'lifestyle') return ['notes', 'settings', 'explorer'].includes(guide.id);
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Hero Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-md">
            <Lucide.Compass size={26} />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              Shadow-Tracker Explorer
            </h1>
            <p className="text-xs text-primary font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> System Map & Intuitive Feature Guide
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm md:text-base font-medium max-w-3xl leading-relaxed">
          Welcome to your complete operating system manual. Every page in Shadow-Tracker is designed with a specific purpose to help you build habits, execute tasks, and track financial growth with 100% privacy.
        </p>
      </header>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 tile p-4 rounded-3xl">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'All Pages (9)', icon: 'Layers' },
            { id: 'core', label: 'Core Productivity', icon: 'CheckSquare' },
            { id: 'analytics', label: 'Analytics & Wealth', icon: 'TrendingUp' },
            { id: 'lifestyle', label: 'Mindfulness & Config', icon: 'BookOpen' },
          ].map(tab => {
            const Icon = (Lucide[tab.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as typeof selectedFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon size={14} />
                {tab.label}
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
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-secondary/50 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
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
              whileHover={{ y: -4 }}
              className="tile p-6 flex flex-col justify-between space-y-5 border border-border/80 hover:border-primary/40 transition-all duration-300 group"
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
                    onClick={() => onNavigate(guide.tabId)}
                    className="w-full mt-3 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
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

      {/* Companions & System Badges Guide */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-md">
            <Lucide.Trophy size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              Companions & Achievement Badges Manual
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Unlock companions and earn badges as you build consistency. Resetting your data cleanly clears all progress.
            </p>
          </div>
        </div>

        {/* Companions Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="tile p-5 space-y-3 border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                🧙‍♂️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Shadow Wizard Mascot</h3>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Interactive Wisdom Companion</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Located next to the search bar across all platforms. Click the Wizard icon anytime to open the static popup for daily quotes, execution tips, and focus encouragement.
            </p>
          </div>

          <div className="tile p-5 space-y-3 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                🔥
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Streak Flame Companion</h3>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Consistency Milestone Sentry</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monitors your unbroken habit completion streaks daily. Reaching 3, 7, 30, and 90-day streaks triggers achievement badges and celebrates your momentum.
            </p>
          </div>
        </div>

        {/* Badges List Grid */}
        <div className="tile p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Lucide.Award className="text-primary" size={18} />
              System Badges & Unlock Criteria
            </h3>
            <span className="text-xs font-bold text-muted-foreground">10 Unlockable Achievements</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { name: 'First Spark', icon: 'Target', desc: 'Complete 1 Task', tag: 'Task Init' },
              { name: 'Atomic Habit', icon: 'Activity', desc: 'Complete 1 Habit', tag: 'Habit Init' },
              { name: 'Triple Streak', icon: 'Zap', desc: '3 Day Habit Streak', tag: '3 Days' },
              { name: 'Weekly Streak', icon: 'ShieldCheck', desc: '7 Day Habit Streak', tag: '7 Days' },
              { name: 'Monthly Core', icon: 'Flame', desc: '30 Day Habit Streak', tag: '30 Days' },
              { name: 'Quarter Zenith', icon: 'Crown', desc: '90 Day Habit Streak', tag: '90 Days' },
              { name: 'Deep Harmony', icon: 'Sun', desc: 'Score 100% Focus', tag: 'Perfect Score' },
              { name: 'Mindful Mind', icon: 'BookOpen', desc: 'Write 1 Journal Entry', tag: 'First Note' },
              { name: 'Century Master', icon: 'CheckCircle2', desc: 'Complete 100 Tasks', tag: '100 Tasks' },
              { name: 'Wealth Master', icon: 'TrendingUp', desc: 'Meet Savings & Inv Target', tag: 'Finance' },
            ].map((badge, bIdx) => {
              const IconComp = (Lucide[badge.icon as keyof typeof Lucide] || Lucide.Award) as React.ElementType;
              return (
                <div key={bIdx} className="bg-secondary/40 border border-border/60 rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                      <IconComp size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-foreground">{badge.name}</h4>
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{badge.tag}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">{badge.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-secondary/30 border border-border/50 rounded-2xl flex items-center gap-2.5 text-xs text-muted-foreground">
            <Lucide.RefreshCw size={15} className="text-amber-400 shrink-0" />
            <span><strong>Reset Guarantee:</strong> Clicking <strong>Reset All Data</strong> in Settings purges all unlocked badges and updates <code className="px-1 py-0.5 bg-secondary rounded text-[10px]">badgesResetTimestamp</code> so old historical records never trigger phantom unlocks.</span>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts & System Guarantees Footer Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="tile p-6 space-y-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Lucide.ShieldCheck size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">100% Offline & Local</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            All tasks, habits, daily logs, and notes are stored strictly inside your browser sandbox. Zero trackers, zero cookies, 100% privacy guaranteed.
          </p>
        </div>

        <div className="tile p-6 space-y-3 border-purple-500/20 bg-purple-500/5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Lucide.Command size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">Command Bar (⌘ K)</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Press <code className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[11px] font-bold text-foreground">⌘ K</code> or <code className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[11px] font-bold text-foreground">Ctrl+K</code> anywhere to open the global Command Bar to search tasks, toggle habits, or jump tabs instantly.
          </p>
        </div>

        <div className="tile p-6 space-y-3 border-pink-500/20 bg-pink-500/5">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Lucide.Palette size={20} />
          </div>
          <h3 className="text-base font-extrabold text-foreground">5 Dynamic Themes</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Personalize your environment with Obsidian, Cyberpunk, OneDark, Midnight, and Light themes. Click the theme button in the sidebar to cycle themes.
          </p>
        </div>
      </div>
    </div>
  );
}
