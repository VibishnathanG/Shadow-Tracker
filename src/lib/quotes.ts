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

export const BUILTIN_WISP_MOTIVATIONAL_LINES: string[] = [
  "Action defeats inertia. Move before motivation arrives.",
  "Small daily disciplines compound into generational advantages.",
  "The resistance you feel at the starting line is the price of admission.",
  "Mastery is not an accident. It is deliberate, repetitive precision.",
  "Protect your attention like your most sacred asset—because it is.",
  "A blank slate is an opportunity. Define your objective.",
  "Discipline compounds faster than motivation. Build systems, not moods.",
  "One completed task silences a thousand mental doubts.",
  "Your future self is watching you right now through memory. Make them proud.",
  "The work you avoid is usually the exact breakthrough you need.",
  "Consistency turns the improbable into the inevitable.",
  "Silence the noise. Deep focus is where legends are forged.",
  "Do not count the hours; make every single hour count.",
  "A streak is not just a counter; it is your shield against mediocrity.",
  "When tiredness whispers to quit, remember why you began.",
  "Execution is the only bridge between vision and reality.",
  "Outwork self-doubt. Progress is the strongest argument.",
  "Energy flows where discipline directs it.",
  "The grind in the dark creates the glow in the light.",
  "Treat every target like a promise you made to your destiny.",
  "Momentum is hard to build and easy to lose. Guard it fiercely.",
  "You do not rise to your goals; you fall to your systems.",
  "Embrace the friction. Growth lives in the discomfort.",
  "Close open loops. Mental clarity requires clean execution.",
  "Every champion was once a contender who refused to stay down.",
  "The obstacle before you is the raw material for your ascent.",
  "Sharpen your focus until distraction becomes invisible.",
  "Start small, start now, finish strong.",
  "Patience in compounding; ruthless urgency in daily execution.",
  "Your habits forecast your future with terrifying accuracy.",
  "A single step taken beats a grand plan left in your head.",
  "Command your morning, dominate your day, own your destiny.",
  "Do the hard things first. The rest of the day will yield to you.",
  "Greatness is built in private, long before it is celebrated in public.",
  "Do not fear slow progress; only fear standing still.",
  "Turn chaotic pressure into diamond-grade resolve.",
  "Master the art of finishing what you start.",
  "Deep work is a superpower in an era of cheap distraction.",
  "Win the battle against hesitation within the next five seconds.",
  "Clarity comes from engagement, not contemplation.",
  "Never compromise the standard you have set for yourself.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Keep showing up. The universe yields to relentless persistence.",
  "One day or Day One? The choice is made every morning.",
  "Guard your time ruthlessly; it is non-renewable capital.",
  "Courage is taking the next step even when the fog is thick.",
  "Doubt is eliminated by evidence. Create the evidence today.",
  "Build an unbreakable foundation. Storms will test it soon.",
  "Do not wish for lighter loads; forge stronger shoulders.",
  "The cycle never stops, and neither do we. Onward."
];

export const WISP_CUSTOM_LINES_KEY = 'shadow_wisp_custom_lines_v1';

export function getWispCustomLines(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISP_CUSTOM_LINES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWispCustomLine(line: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getWispCustomLines();
    const clean = line.trim();
    if (!clean) return existing;
    const updated = [clean, ...existing.filter(l => l.trim() !== clean)];
    localStorage.setItem(WISP_CUSTOM_LINES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteWispCustomLine(index: number): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getWispCustomLines();
    const updated = existing.filter((_, i) => i !== index);
    localStorage.setItem(WISP_CUSTOM_LINES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getAllWispLines(customLines?: string[]): string[] {
  const custom = customLines ?? getWispCustomLines();
  return [...custom, ...BUILTIN_WISP_MOTIVATIONAL_LINES];
}

export interface MascotStatusOptions {
  customLines?: string[];
  animationVariant?: number;
  forceQuoteIndex?: number;
}

export function getMascotStatus(
  settings: Settings,
  stats: {
    pendingTasks: number;
    completedTasks: number;
    highestStreak: number;
    focusScore: number;
    daysSinceLastActive: number;
  },
  options?: MascotStatusOptions
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

  const allLines = getAllWispLines(options?.customLines);
  const variantIndex = Math.abs((options?.animationVariant ?? 0) % 4);

  // If a forced quote index is requested (e.g. from user click)
  let speech = '';
  if (options?.forceQuoteIndex !== undefined && options.forceQuoteIndex >= 0 && allLines.length > 0) {
    speech = allLines[options.forceQuoteIndex % allLines.length];
  } else if (pendingTasks === 0 && completedTasks === 0) {
    const msgs = [
      `Build systems, not moods, ${settings.alias || 'Shadow'}. Access the Command Bar (⌘ K) to schedule your next focus target.`,
      `Empty day. Either you are perfectly organized, or you are avoiding reality. Plan tomorrow.`,
      `A blank slate is an opportunity. Define your objective.`,
      ...allLines.slice(0, 15)
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
  } else if (focusScore === 100) {
    const msgs = [
      `Perfect day achieved, ${settings.alias || 'Shadow'}! One more day beats your consistency average. System fully locked in.`,
      `Flawless execution. Rest and recover, for tomorrow the cycle continues.`,
      `100% focus. You are proving that discipline > motivation.`,
      ...allLines.slice(15, 30)
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
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
      `${streakStr} System load: ${pendingTasks} tasks pending. Begin processing sequentially.`,
      ...allLines
    ];
    speech = msgs[Math.floor(Math.random() * msgs.length)];
  } else {
    speech = allLines[Math.floor(Math.random() * allLines.length)] || 'Focus on the next target. Action defeats inertia.';
  }

  // 4 Lightweight SVG Animation Varieties for Wisp (Zero CPU burden, pure CSS GPU transforms)
  const tier1Variants = [
    // Variety 0: Celestial Float (Gentle hovering core with breathing luminous aura)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes wispFloat0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes wispBlink0 { 0%, 92%, 98% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes wispAura0 { 0%, 100% { r: 24px; opacity: 0.55; } 50% { r: 28px; opacity: 0.25; } }
        .wf0 { animation: wispFloat0 3.8s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .wb0 { animation: wispBlink0 4.2s infinite; transform-origin: 43px 46px; }
        .wbr0 { animation: wispBlink0 4.2s infinite; transform-origin: 57px 46px; }
        .wa0 { animation: wispAura0 2.8s ease-in-out infinite; }
      </style>
      <g class="wf0">
        <circle cx="50" cy="50" r="24" fill="var(--primary)" class="wa0" filter="blur(6px)" />
        <circle cx="50" cy="50" r="20" fill="var(--primary)" opacity="0.8" />
        <circle cx="50" cy="50" r="16" fill="var(--background)" opacity="0.9" />
        <g class="wb0">
          <ellipse cx="43" cy="46" rx="2.5" ry="3.5" fill="var(--primary)" />
          <circle cx="43" cy="45" r="1" fill="#fff" />
        </g>
        <g class="wbr0">
          <ellipse cx="57" cy="46" rx="2.5" ry="3.5" fill="var(--primary)" />
          <circle cx="57" cy="45" r="1" fill="#fff" />
        </g>
        <path d="M 47 54 Q 50 56 53 54" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </g>
    </svg>`,

    // Variety 1: Orbital Synergy (Dual counter-orbiting energy rings around a nucleus)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes wispFloat1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-3.5px) rotate(2deg); } }
        @keyframes wispOrbitA { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes wispOrbitB { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        @keyframes wispPulseCore { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .wf1 { animation: wispFloat1 4.5s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .woA { animation: wispOrbitA 8s linear infinite; transform-origin: 50px 50px; }
        .woB { animation: wispOrbitB 11s linear infinite; transform-origin: 50px 50px; }
        .wpc { animation: wispPulseCore 2.5s ease-in-out infinite; transform-origin: 50px 50px; }
      </style>
      <g class="wf1">
        <circle cx="50" cy="50" r="32" stroke="var(--primary)" stroke-width="1.2" stroke-dasharray="6 6" opacity="0.4" class="woA" />
        <circle cx="50" cy="50" r="26" stroke="var(--primary)" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.6" class="woB" />
        <circle cx="50" cy="50" r="17" fill="var(--primary)" opacity="0.3" filter="blur(4px)" class="wpc" />
        <circle cx="50" cy="50" r="14" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
        <circle cx="44" cy="47" r="2" fill="var(--primary)" />
        <circle cx="56" cy="47" r="2" fill="var(--primary)" />
        <circle cx="50" cy="54" r="1.5" fill="var(--primary)" opacity="0.8" />
        <circle cx="76" cy="50" r="2" fill="var(--primary)" opacity="0.9" class="woA" />
      </g>
    </svg>`,

    // Variety 2: Prismatic Sentinel (Crystalline beacon with sweeping horizontal scanner)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes wispFloat2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes wispScan2 { 0% { transform: translateY(-8px); opacity: 0.1; } 50% { opacity: 0.9; } 100% { transform: translateY(8px); opacity: 0.1; } }
        @keyframes wispPrismGlow { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.65; } }
        .wf2 { animation: wispFloat2 4s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .ws2 { animation: wispScan2 2.4s ease-in-out infinite; }
        .wpg { animation: wispPrismGlow 3s ease-in-out infinite; }
      </style>
      <g class="wf2">
        <polygon points="50,18 76,34 76,66 50,82 24,66 24,34" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
        <polygon points="50,25 70,38 70,62 50,75 30,62 30,38" fill="var(--primary)" class="wpg" />
        <line x1="30" y1="50" x2="70" y2="50" stroke="var(--primary)" stroke-width="2" class="ws2" />
        <circle cx="43" cy="49" r="2.5" fill="var(--primary)" />
        <circle cx="57" cy="49" r="2.5" fill="var(--primary)" />
      </g>
    </svg>`,

    // Variety 3: Astral Sparkle (Pulsing starlight vortex with shimmering particles)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes wispFloat3 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-4px) scale(1.04); } }
        @keyframes wispRotate3 { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes wispTwinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        .wf3 { animation: wispFloat3 3.6s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .wr3 { animation: wispRotate3 14s linear infinite; transform-origin: 50px 50px; }
        .wtw { animation: wispTwinkle 2s ease-in-out infinite; transform-origin: center; }
      </style>
      <g class="wf3">
        <g class="wr3">
          <circle cx="50" cy="50" r="30" stroke="var(--primary)" stroke-width="1" stroke-dasharray="4 8" opacity="0.5" />
          <circle cx="50" cy="20" r="2" fill="var(--primary)" class="wtw" />
          <circle cx="80" cy="50" r="1.5" fill="var(--primary)" class="wtw" />
          <circle cx="50" cy="80" r="2" fill="var(--primary)" class="wtw" />
          <circle cx="20" cy="50" r="1.5" fill="var(--primary)" class="wtw" />
        </g>
        <circle cx="50" cy="50" r="18" fill="var(--primary)" opacity="0.35" filter="blur(5px)" />
        <circle cx="50" cy="50" r="15" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
        <ellipse cx="44" cy="47" rx="2" ry="3" fill="var(--primary)" />
        <ellipse cx="56" cy="47" rx="2" ry="3" fill="var(--primary)" />
        <circle cx="44" cy="46" r="0.8" fill="#fff" />
        <circle cx="56" cy="46" r="0.8" fill="#fff" />
        <path d="M 47 53 Q 50 55 53 53" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </g>
    </svg>`
  ];

  // 4 Distinct Animation Forms for Tier 4: Overlord / Nexus Prime
  const tier4Variants = [
    // 0: Celestial Float (Majestic levitation with harmonic breathing aura and floating runic wings)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes t4Float0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-4.5px) rotate(1.5deg); } }
        @keyframes t4Aura0 { 0%, 100% { transform: scale(0.95); opacity: 0.3; } 50% { transform: scale(1.15); opacity: 0.75; } }
        @keyframes t4Blink0 { 0%, 93%, 98% { transform: scaleY(1); } 96%, 100% { transform: scaleY(0.1); } }
        @keyframes t4Wing0 { 0%, 100% { transform: scaleY(1); opacity: 0.7; } 50% { transform: scaleY(1.18); opacity: 1; } }
        .t4f0 { animation: t4Float0 4.2s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .t4a0 { animation: t4Aura0 2.8s ease-in-out infinite; transform-origin: 50px 50px; }
        .t4e0 { animation: t4Blink0 4.5s infinite; transform-origin: 50px 50px; }
        .t4w0 { animation: t4Wing0 3.2s ease-in-out infinite; transform-origin: center; }
      </style>
      <g class="t4f0">
        <circle cx="50" cy="50" r="38" fill="var(--primary)" opacity="0.15" filter="blur(6px)" class="t4a0" />
        <circle cx="50" cy="50" r="36" stroke="var(--primary)" stroke-width="1.2" stroke-dasharray="8 6" opacity="0.45" />
        <path d="M 18 38 Q 24 50 18 62" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" class="t4w0" opacity="0.8" />
        <path d="M 82 38 Q 76 50 82 62" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" class="t4w0" opacity="0.8" />
        <polygon points="50,22 74,50 50,78 26,50" fill="var(--background)" stroke="var(--primary)" stroke-width="2.2" />
        <polygon points="50,29 67,50 50,71 33,50" fill="var(--primary)" opacity="0.18" stroke="var(--primary)" stroke-width="1" />
        <g class="t4e0">
          <path d="M 40 48 Q 50 42 60 48 L 55 54 Q 50 48 45 54 Z" fill="var(--primary)" />
          <circle cx="50" cy="50" r="2.2" fill="#fff" />
        </g>
      </g>
    </svg>`,

    // 1: Orbital Synergy (Concentric multi-speed gyroscope rings with orbiting celestial mana nodes)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes t4SpinA { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes t4SpinB { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        @keyframes t4SpinC { 0% { transform: rotate(0deg) scale(0.96); } 50% { transform: rotate(180deg) scale(1.04); } 100% { transform: rotate(360deg) scale(0.96); } }
        @keyframes t4PulseCore { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .t4sa { animation: t4SpinA 9s linear infinite; transform-origin: 50px 50px; }
        .t4sb { animation: t4SpinB 6s linear infinite; transform-origin: 50px 50px; }
        .t4sc { animation: t4SpinC 12s linear infinite; transform-origin: 50px 50px; }
        .t4pc { animation: t4PulseCore 2.2s ease-in-out infinite; transform-origin: 50px 50px; }
      </style>
      <g>
        <circle cx="50" cy="50" r="44" stroke="var(--primary)" stroke-width="1.2" stroke-dasharray="14 8 3 8" class="t4sa" opacity="0.55" />
        <circle cx="50" cy="50" r="36" stroke="var(--primary)" stroke-width="1.6" stroke-dasharray="18 12" class="t4sb" opacity="0.75" />
        <ellipse cx="50" cy="50" rx="30" ry="24" stroke="var(--primary)" stroke-width="1" stroke-dasharray="8 6" class="t4sc" opacity="0.5" />
        <circle cx="50" cy="6" r="2.5" fill="var(--primary)" class="t4sa" />
        <circle cx="94" cy="50" r="2.5" fill="var(--primary)" class="t4sa" />
        <circle cx="14" cy="50" r="2" fill="var(--primary)" class="t4sb" />
        <polygon points="50,26 71,50 50,74 29,50" fill="var(--background)" stroke="var(--primary)" stroke-width="2.2" class="t4pc" />
        <path d="M 40 48 Q 50 42 60 48 L 55 54 Q 50 48 45 54 Z" fill="var(--primary)" />
        <circle cx="50" cy="50" r="2.5" fill="#fff" />
      </g>
    </svg>`,

    // 2: Prismatic Sentinel (Faceted geometric crystal lattice with gliding holographic laser scanner)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes t4Float2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes t4Scanner2 { 0% { transform: translateY(-12px); opacity: 0.15; } 50% { opacity: 1; } 100% { transform: translateY(12px); opacity: 0.15; } }
        @keyframes t4Refract2 { 0%, 100% { opacity: 0.3; transform: scale(0.98); } 50% { opacity: 0.7; transform: scale(1.02); } }
        .t4f2 { animation: t4Float2 4.5s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .t4sc2 { animation: t4Scanner2 2.2s ease-in-out infinite; }
        .t4ref2 { animation: t4Refract2 3.5s ease-in-out infinite; transform-origin: 50px 50px; }
      </style>
      <g class="t4f2">
        <polygon points="50,12 80,30 80,70 50,88 20,70 20,30" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
        <polygon points="50,18 74,34 74,66 50,82 26,66 26,34" fill="var(--primary)" class="t4ref2" stroke="var(--primary)" stroke-width="1" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="var(--primary)" stroke-width="2.5" class="t4sc2" />
        <polygon points="50,28 68,50 50,72 32,50" fill="var(--background)" stroke="var(--primary)" stroke-width="2" />
        <circle cx="43" cy="49" r="2.8" fill="var(--primary)" />
        <circle cx="57" cy="49" r="2.8" fill="var(--primary)" />
        <circle cx="43" cy="48" r="1" fill="#fff" />
        <circle cx="57" cy="48" r="1" fill="#fff" />
      </g>
    </svg>`,

    // 3: Astral Sparkle (Radiant 8-point nova starlight with breathing stellar ripples)
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" style="overflow:visible">
      <style>
        @keyframes t4Float3 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-4px) scale(1.04); } }
        @keyframes t4Nova3 { 0%, 100% { transform: rotate(0deg) scale(0.92); opacity: 0.45; } 50% { transform: rotate(45deg) scale(1.1); opacity: 0.9; } }
        @keyframes t4StarTwinkle { 0%, 100% { opacity: 0.25; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.35); } }
        .t4f3 { animation: t4Float3 3.8s ease-in-out infinite; transform-origin: center; will-change: transform; }
        .t4n3 { animation: t4Nova3 6s ease-in-out infinite; transform-origin: 50px 50px; }
        .t4st { animation: t4StarTwinkle 1.8s ease-in-out infinite; transform-origin: center; }
      </style>
      <g class="t4f3">
        <path d="M 50 10 L 53 47 L 90 50 L 53 53 L 50 90 L 47 53 L 10 50 L 47 47 Z" fill="var(--primary)" class="t4n3" />
        <circle cx="50" cy="50" r="32" stroke="var(--primary)" stroke-width="1.2" stroke-dasharray="5 7" opacity="0.6" />
        <circle cx="50" cy="18" r="2.2" fill="var(--primary)" class="t4st" />
        <circle cx="82" cy="50" r="2.2" fill="var(--primary)" class="t4st" />
        <circle cx="50" cy="82" r="2.2" fill="var(--primary)" class="t4st" />
        <circle cx="18" cy="50" r="2.2" fill="var(--primary)" class="t4st" />
        <polygon points="50,27 69,50 50,73 31,50" fill="var(--background)" stroke="var(--primary)" stroke-width="2.2" />
        <ellipse cx="44" cy="48" rx="2.2" ry="3.2" fill="var(--primary)" />
        <ellipse cx="56" cy="48" rx="2.2" ry="3.2" fill="var(--primary)" />
        <circle cx="44" cy="47" r="0.9" fill="#fff" />
        <circle cx="56" cy="47" r="0.9" fill="#fff" />
        <path d="M 47 54 Q 50 56 53 54" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </g>
    </svg>`
  ];

  const avatarSvgs = {
    1: tier1Variants[variantIndex] || tier1Variants[0],
    2: tier1Variants[variantIndex] || tier1Variants[0],
    3: tier4Variants[variantIndex] || tier4Variants[0],
    4: tier4Variants[variantIndex] || tier4Variants[0]
  };

  return {
    tier,
    name,
    avatarSvg: avatarSvgs[tier as keyof typeof avatarSvgs] || tier4Variants[variantIndex] || tier4Variants[0],
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
