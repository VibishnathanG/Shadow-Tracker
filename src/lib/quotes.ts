import { Quote, Settings } from '@/types';

export const BUILTIN_QUOTES: Quote[] = [
  {
    id: 'quote-1',
    content: 'Discipline compounds faster than motivation. Build systems, not moods.',
    author: 'Shadow Core',
    category: 'discipline'
  },
  {
    id: 'quote-2',
    content: 'Every shipped task pays interest. Masters build in public, amateurs wait for inspiration.',
    author: 'Shadow Master',
    category: 'execution'
  },
  {
    id: 'quote-3',
    content: 'The stack you master becomes your leverage. Deep focus yields high yield.',
    author: 'Tech Arch',
    category: 'focus'
  },
  {
    id: 'quote-4',
    content: 'Consistency is the speed of compound growth. One day missed is two steps back.',
    author: 'Streak Sentry',
    category: 'consistency'
  },
  {
    id: 'quote-5',
    content: 'Learn daily, earn later. Skills compound like capital.',
    author: 'Quantum Dev',
    category: 'learning'
  },
  {
    id: 'quote-6',
    content: 'Stop optimizing the tool and start executing the work.',
    author: 'Execution Kernel',
    category: 'execution'
  },
  {
    id: 'quote-7',
    content: 'Your attention is your rarest asset. Do not trade it for cheap distractions.',
    author: 'Focus Beacon',
    category: 'focus'
  },
  {
    id: 'quote-8',
    content: 'Flow follows action. If you feel blocked, start with a 5-minute task.',
    author: 'System Init',
    category: 'discipline'
  },
  {
    id: 'quote-9',
    content: 'The best codebase is the one that solves problems. Build, ship, iterate.',
    author: 'Tech Pioneer',
    category: 'learning'
  },
  {
    id: 'quote-10',
    content: 'A streak is not a number; it is a shield. Defend it with daily execution.',
    author: 'Aegis Sentinel',
    category: 'consistency'
  }
];

export const SHADOW_RANKS = [
  { levelMin: 1, name: 'Explorer', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  { levelMin: 3, name: 'Builder', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { levelMin: 5, name: 'Architect', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { levelMin: 7, name: 'Disciplined', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { levelMin: 9, name: 'Focused', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { levelMin: 11, name: 'Relentless', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { levelMin: 15, name: 'Legend', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }
];

export function getShadowRank(level: number) {
  let matchedRank = SHADOW_RANKS[0];
  for (const rank of SHADOW_RANKS) {
    if (level >= rank.levelMin) {
      matchedRank = rank;
    }
  }
  return matchedRank;
}

export function getQuoteForDay(dateStr: string): Quote {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BUILTIN_QUOTES.length;
  return BUILTIN_QUOTES[index];
}

export interface MascotStatus {
  tier: number;
  name: string;
  avatarSvg: string;
  speech: string;
}

export function getMascotStatus(
  settings: Settings,
  stats: {
    pendingTasks: number;
    completedTasks: number;
    highestStreak: number;
    focusScore: number;
    daysSinceLastActive: number;
  }
): MascotStatus {
  const { level } = settings;
  const { pendingTasks, completedTasks, highestStreak, focusScore, daysSinceLastActive } = stats;

  let tier = 1;
  let name = 'Nexus Wisp';
  
  if (level >= 11 || highestStreak >= 15) {
    tier = 4;
    name = 'Nexus Prime';
  } else if (level >= 6 || highestStreak >= 7) {
    tier = 3;
    name = 'Nexus Oracle';
  } else if (level >= 3 || highestStreak >= 3) {
    tier = 2;
    name = 'Nexus Core';
  }

  // Calculate speech based on the exact logic we created for coaching
  let speech = 'Focus on the next target. Action defeats inertia.';
  const rand = Math.floor(Math.random() * 3);

  // Default empty state
  if (pendingTasks === 0 && completedTasks === 0) {
    const msgs = [
      `Build systems, not moods, ${settings.alias || 'Shadow'}. Access the Command Bar (⌘ K) to schedule your next focus target.`,
      `Empty day. Either you are perfectly organized, or you are avoiding reality. Plan tomorrow.`,
      `A blank slate is an opportunity. Define your objective.`
    ];
    speech = msgs[rand];
  } else if (focusScore === 100) {
    const msgs = [
      `Perfect day achieved, ${settings.alias || 'Shadow'}! One more day beats your consistency average. System fully locked in.`,
      `Flawless execution. Rest and recover, for tomorrow the cycle continues.`,
      `100% focus. You are proving that discipline > motivation.`
    ];
    speech = msgs[rand];
  } else if (pendingTasks === 0 && completedTasks > 0) {
    speech = `All scheduled tasks completed. Systems fully synchronized.`;
  } else if (daysSinceLastActive >= 4) {
    const msgs = [
      `Continuous missed days detected. Discipline is failing, ${settings.alias || 'Shadow'}. Remember why you started this.`,
      `Momentum lost. You are letting your future self down. Get back on track immediately.`,
      `A break is a break. Quitting is a choice. Do not choose the latter.`,
      `System degradation critical. Execute just ONE task today to halt the slide.`
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
  } else if (daysSinceLastActive > 0 && daysSinceLastActive < 4) {
    const msgs = [
      `Streak interrupted. Do not let one missed day become a new habit.`,
      `The darkness is creeping in, ${settings.alias || 'Shadow'}. Take action today to restore the light.`,
      `You stumbled. That is fine. Refusing to get back up is not. Start now.`,
      `It has been a few days. The longer you wait, the heavier the resistance.`
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
  } else if (pendingTasks > 0) {
    const estTime = pendingTasks * 10;
    const streakStr = highestStreak > 0 ? `Protect our ${highestStreak}-day streak!` : `Protect our streak!`;
    const msgs = [
      `Estimated focus required: ${estTime} minutes. Tackle ${pendingTasks} tasks to keep the streak secure.`,
      `You have ${pendingTasks} open loops in your mind, ${settings.alias || 'Shadow'}. Close them. ETA: ${estTime} mins.`,
      `${estTime} minutes of deep work separates you from a clean slate. Execute.`,
      `${streakStr} System load: ${pendingTasks} tasks pending. Begin processing sequentially.`
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
  }

  const avatarSvgs = {
    1: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
          <style>
            @keyframes hover1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
            @keyframes blink1 { 0%, 94%, 98% { transform: scaleY(1); } 96%, 100% { transform: scaleY(0.1); } }
            @keyframes pulseAura1 { 0%, 100% { r: 24px; opacity: 0.5; } 50% { r: 28px; opacity: 0.2; } }
            .wisp { animation: hover1 4s ease-in-out infinite; transform-origin: center; }
            .eye { animation: blink1 4.5s infinite; transform-origin: 43px 46px; }
            .eye-r { animation: blink1 4.5s infinite; transform-origin: 57px 46px; }
            .aura1 { animation: pulseAura1 3s ease-in-out infinite; }
          </style>
          <g class="wisp">
            <circle cx="50" cy="50" r="24" fill="var(--primary)" class="aura1" filter="blur(6px)" />
            <circle cx="50" cy="50" r="20" fill="var(--primary)" opacity="0.8" />
            <circle cx="50" cy="50" r="16" fill="var(--background)" opacity="0.9" />
            <g class="eye">
              <ellipse cx="43" cy="46" rx="2.5" ry="3.5" fill="var(--primary)" />
              <circle cx="43" cy="45" r="1" fill="#fff" />
            </g>
            <g class="eye-r">
              <ellipse cx="57" cy="46" rx="2.5" ry="3.5" fill="var(--primary)" />
              <circle cx="57" cy="45" r="1" fill="#fff" />
            </g>
            <path d="M 47 54 Q 50 56 53 54" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" fill="none" />
          </g>
        </svg>`,
    2: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
          <style>
            @keyframes hover2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 25% { transform: translateY(-5px) rotate(2deg); } 75% { transform: translateY(3px) rotate(-2deg); } }
            @keyframes blink2 { 0%, 94%, 98% { transform: scaleY(1); } 96%, 100% { transform: scaleY(0.1); } }
            @keyframes orbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .drone { animation: hover2 6s ease-in-out infinite; transform-origin: center; }
            .eye2 { animation: blink2 5s infinite; transform-origin: 50px 48px; }
            .ring { animation: orbit 8s linear infinite; transform-origin: 50px 50px; }
          </style>
          <g class="drone">
            <circle cx="50" cy="50" r="32" stroke="var(--primary)" stroke-width="1" stroke-dasharray="8 4" opacity="0.3" class="ring" />
            <rect x="32" y="32" width="36" height="36" rx="12" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
            <rect x="24" y="44" width="8" height="12" rx="4" fill="var(--primary)" opacity="0.7" />
            <rect x="68" y="44" width="8" height="12" rx="4" fill="var(--primary)" opacity="0.7" />
            <g class="eye2">
              <path d="M 38 48 L 62 48 L 58 56 L 42 56 Z" fill="var(--primary)" opacity="0.9" />
              <circle cx="46" cy="52" r="1.5" fill="#fff" />
              <circle cx="54" cy="52" r="1.5" fill="#fff" />
            </g>
          </g>
        </svg>`,
    3: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
          <style>
            @keyframes hover3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
            @keyframes scanline { 0% { transform: translateY(-10px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
            .sentinel { animation: hover3 5s ease-in-out infinite; transform-origin: center; }
            .scanner { animation: scanline 2.5s infinite; }
          </style>
          <g class="sentinel">
            <polygon points="50,14 78,34 78,66 50,86 22,66 22,34" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
            <polygon points="50,22 70,38 70,62 50,78 30,62 30,38" fill="var(--primary)" opacity="0.1" stroke="var(--primary)" stroke-width="1" />
            <rect x="35" y="45" width="30" height="10" rx="3" fill="var(--background)" stroke="var(--primary)" stroke-width="1.5" />
            <path d="M 35 48 L 65 48" stroke="var(--primary)" stroke-width="2" class="scanner" />
            <circle cx="42" cy="50" r="2.5" fill="var(--primary)" />
            <circle cx="58" cy="50" r="2.5" fill="var(--primary)" />
          </g>
        </svg>`,
    4: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
          <style>
            @keyframes hover4 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
            @keyframes spin1 { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes spin2 { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
            @keyframes blink4 { 0%, 94%, 98% { transform: scaleY(1); } 96%, 100% { transform: scaleY(0.1); } }
            .overlord { animation: hover4 7s ease-in-out infinite; transform-origin: center; }
            .ring-outer { animation: spin1 12s linear infinite; transform-origin: 50px 50px; }
            .ring-inner { animation: spin2 8s linear infinite; transform-origin: 50px 50px; }
            .eye4 { animation: blink4 4s infinite; transform-origin: 50px 50px; }
          </style>
          <g class="overlord">
            <circle cx="50" cy="50" r="42" stroke="var(--primary)" stroke-width="1" stroke-dasharray="10 6 2 6" class="ring-outer" opacity="0.5" />
            <circle cx="50" cy="50" r="35" stroke="var(--primary)" stroke-width="1.5" stroke-dasharray="15 15" class="ring-inner" opacity="0.8" />
            <polygon points="50,25 72,50 50,75 28,50" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
            <g class="eye4">
              <path d="M 40 48 Q 50 42 60 48 L 55 54 Q 50 48 45 54 Z" fill="var(--primary)" />
              <circle cx="50" cy="50" r="2" fill="#fff" />
            </g>
          </g>
        </svg>`
  };

  return {
    tier,
    name,
    avatarSvg: avatarSvgs[tier as keyof typeof avatarSvgs] || avatarSvgs[1],
    speech
  };
}

export function getContextualCoaching(stats: {
  pendingTasks: number;
  completedTasks: number;
  activeHabits: number;
  completedHabits: number;
  highestStreak: number;
  daysSinceLastActive: number;
  alias: string;
}): string {
  const { pendingTasks, completedTasks, activeHabits, completedHabits, highestStreak, daysSinceLastActive, alias } = stats;

  const rand = Math.floor(Math.random() * 3); // For variety

  // 1. Perfect Day
  if (pendingTasks === 0 && completedTasks > 0 && completedHabits === activeHabits && activeHabits > 0) {
    const msgs = [
      `Perfect day achieved, ${alias}! Your ${highestStreak}-day streak speaks for itself. System fully locked in.`,
      `Flawless execution. Rest and recover, for tomorrow the cycle continues.`,
      `100% focus. You are proving that discipline > motivation.`
    ];
    return msgs[rand];
  }

  // 2. High Missed Days (Harsh Coaching)
  if (daysSinceLastActive >= 4) {
    const msgs = [
      `Continuous missed days detected (${daysSinceLastActive} days). Discipline is failing, ${alias}. Remember why you started this.`,
      `Momentum lost. You are letting your future self down. Get back on track immediately.`,
      `A break is a break. Quitting is a choice. Do not choose the latter.`,
      `System degradation critical. Execute just ONE task today to halt the slide.`
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // 3. Just started missing (1-3 days)
  if (daysSinceLastActive > 0 && daysSinceLastActive < 4) {
    const msgs = [
      `Streak interrupted by ${daysSinceLastActive} day${daysSinceLastActive > 1 ? 's' : ''}. Do not let one missed day become a new habit.`,
      `The darkness is creeping in, ${alias}. Take action today to restore the light.`,
      `You stumbled. That is fine. Refusing to get back up is not. Start now.`,
      `It has been a few days. The longer you wait, the heavier the resistance.`
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // 4. Tasks Pending (Estimated Focus)
  if (pendingTasks > 0) {
    const estTime = pendingTasks * 10;
    const streakStr = highestStreak > 0 ? `Protect our ${highestStreak}-day streak!` : `Protect our streak!`;
    const msgs = [
      `Estimated focus required: ${estTime} minutes. Tackle ${pendingTasks} tasks to keep the streak secure.`,
      `You have ${pendingTasks} open loops in your mind, ${alias}. Close them. ETA: ${estTime} mins.`,
      `${estTime} minutes of deep work separates you from a clean slate. Execute.`,
      `${streakStr} System load: ${pendingTasks} tasks pending. Begin processing sequentially.`
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // 5. Habits Pending
  if (activeHabits > 0 && completedHabits < activeHabits) {
    const remaining = activeHabits - completedHabits;
    const streakStr = highestStreak > 0 ? `Don't break your ${highestStreak}-day streak.` : '';
    const msgs = [
      `${remaining} routine${remaining > 1 ? 's' : ''} left to check off today. Maintain your momentum. ${streakStr}`,
      `Do not negotiate with your habits, ${alias}. ${remaining} to go.`,
      `Your systems are waiting. Complete the final ${remaining} routine${remaining > 1 ? 's' : ''}.`
    ];
    return msgs[rand];
  }

  // 6. Generic/Zero State
  const msgs = [
    `Build systems, not moods, ${alias}. Access the Command Bar (⌘ K) to schedule your next focus target.`,
    `Empty day. Either you are perfectly organized, or you are avoiding reality. Plan tomorrow.`,
    `A blank slate is an opportunity. Define your objective.`
  ];
  return msgs[rand];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  subtitle: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-first-task',
    name: 'First Spark',
    description: 'Scheduled your first objective.',
    icon: 'Target',
    color: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
    requirement: 'Unlock: Complete 1 Task',
    subtitle: 'First task done'
  },
  {
    id: 'badge-first-habit',
    name: 'Atomic Habit',
    description: 'Checked off your first habit.',
    icon: 'Activity',
    color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
    requirement: 'Unlock: Complete 1 Habit',
    subtitle: 'Habit completed'
  },
  {
    id: 'badge-streak-3',
    name: 'Triple Streak',
    description: 'Maintained a 3-day habit streak.',
    icon: 'Zap',
    color: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30',
    requirement: 'Unlock: 3 Day Habit Streak',
    subtitle: '3-day streak'
  },
  {
    id: 'badge-streak-7',
    name: 'Weekly Streak',
    description: 'Maintained an unbroken 7-day routine streak.',
    icon: 'ShieldCheck',
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    requirement: 'Unlock: 7 Day Habit Streak',
    subtitle: '7-day streak'
  },
  {
    id: 'badge-streak-30',
    name: 'Monthly Core',
    description: 'Maintained an incredible 30-day consistency record.',
    icon: 'Flame',
    color: 'text-orange-700 dark:text-orange-300 bg-orange-500/15 border-orange-500/30',
    requirement: 'Unlock: 30 Day Habit Streak',
    subtitle: '30-day streak'
  },
  {
    id: 'badge-perfect-day',
    name: 'Deep Harmony',
    description: 'Achieved 100% daily focus score.',
    icon: 'Sun',
    color: 'text-yellow-700 dark:text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
    requirement: 'Unlock: Score 100% Focus',
    subtitle: 'Perfect focus'
  },
  {
    id: 'badge-first-note',
    name: 'Mindful Mind',
    description: 'Wrote your first journal entry.',
    icon: 'BookOpen',
    color: 'text-purple-700 dark:text-purple-300 bg-purple-500/15 border-purple-500/30',
    requirement: 'Unlock: Write 1 Journal Entry',
    subtitle: 'First journal'
  },
  {
    id: 'badge-streak-90',
    name: 'Quarter Zenith',
    description: 'Forged an unstoppable 90-day unbroken streak.',
    icon: 'Crown',
    color: 'text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/30',
    requirement: 'Unlock: 90 Day Habit Streak',
    subtitle: '90-day streak'
  },
  {
    id: 'badge-completionist-100',
    name: 'Century Master',
    description: 'Processed 100 total tasks successfully.',
    icon: 'CheckCircle2',
    color: 'text-pink-700 dark:text-pink-300 bg-pink-500/15 border-pink-500/30',
    requirement: 'Unlock: Complete 100 Total Tasks',
    subtitle: '100 tasks'
  },
  {
    id: 'badge-wealth-master',
    name: 'Wealth Master',
    description: 'Met monthly savings and investment targets successfully.',
    icon: 'TrendingUp',
    color: 'text-teal-700 dark:text-teal-300 bg-teal-500/15 border-teal-500/30',
    requirement: 'Unlock: Achieve Monthly Savings & Investment targets',
    subtitle: 'Wealth goal met'
  }
];
