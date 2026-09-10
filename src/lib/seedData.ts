import { Task, Habit, DailyLog, Note, Reminder, Category, Settings, BackupData } from '@/types';

export function generateMassiveOneYearData(): BackupData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const nowStr = now.toISOString();

  // 1. Categories
  const categories: Category[] = [
    { id: 'cat-1', name: 'Deep Work', color: '#6366f1', icon: 'Code', createdAt: nowStr, updatedAt: nowStr },
    { id: 'cat-2', name: 'Health & Fitness', color: '#10b981', icon: 'Activity', createdAt: nowStr, updatedAt: nowStr },
    { id: 'cat-3', name: 'Personal Growth', color: '#f59e0b', icon: 'BookOpen', createdAt: nowStr, updatedAt: nowStr },
    { id: 'cat-4', name: 'Finance & Wealth', color: '#a855f7', icon: 'TrendingUp', createdAt: nowStr, updatedAt: nowStr },
    { id: 'cat-5', name: 'Mindset & Rest', color: '#06b6d4', icon: 'Sun', createdAt: nowStr, updatedAt: nowStr },
  ];

  // 2. Settings & Badges
  const unlockedBadges = [
    'badge-first-task',
    'badge-first-habit',
    'badge-streak-3',
    'badge-streak-7',
    'badge-streak-30',
    'badge-perfect-day',
    'badge-first-note',
    'badge-streak-90',
    'badge-completionist-100',
    'badge-wealth-master'
  ];

  const settings: Settings = {
    theme: 'spectrum',
    backupReminderDays: 7,
    soundEnabled: true,
    showCompletedTasks: true,
    isCompletedOnboarding: true,
    xp: 24850,
    level: 15,
    unlockedBadges,
    alias: 'Shadow Legend',
    savingsTarget: 350000,
    investmentsTarget: 200000,
  };

  // 3. Habits (8 habits with 365 days of completedDates!)
  const habitNames = [
    '20-min Morning Meditation',
    'Read 30 Pages of Tech & Philosophy',
    'HIIT Workout / Heavy Lifting',
    '2 Hours Deep Focus Code Block',
    '10,000 Daily Steps Walk',
    'Log Daily Expenses in Money Tracker',
    'No Sugar & Zero Junk Food',
    'Nightly Reflection & Journaling'
  ];

  const habits: Habit[] = habitNames.map((name, hIdx) => {
    const completedDates: string[] = [];
    for (let d = 365; d >= 0; d--) {
      // 85% completion rate
      if ((d + hIdx) % 6 !== 0) {
        const cDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        completedDates.push(cDate.toISOString().split('T')[0]);
      }
    }
    return {
      id: `hab-${hIdx + 1}`,
      name,
      description: `Daily consistency routine #${hIdx + 1}`,
      categoryId: categories[hIdx % categories.length].id,
      frequency: 'daily',
      completedDates,
      streakCount: 30 + (hIdx * 7),
      longestStreak: 90 + (hIdx * 12),
      createdAt: new Date(year - 1, month, day).toISOString(),
      updatedAt: nowStr,
      isSoftDeleted: false
    };
  });

  // 4. Daily Logs (365 Days of History!)
  const dailyLogs: DailyLog[] = [];
  for (let d = 365; d >= 0; d--) {
    const logDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dateStr = logDate.toISOString().split('T')[0];
    const focusScore = Math.min(100, Math.floor(78 + (Math.sin(d) + 1) * 11));
    const mood: 'great' | 'good' | 'neutral' = focusScore > 90 ? 'great' : focusScore > 80 ? 'good' : 'neutral';

    dailyLogs.push({
      id: dateStr,
      date: dateStr,
      focusScore,
      mood,
      completedTasksCount: (d % 3) + 1,
      completedHabitsCount: (d % 2) + 6,
      createdAt: logDate.toISOString(),
      updatedAt: logDate.toISOString(),
    });
  }

  // 5. Tasks (100+ completed tasks + 4 active tasks)
  const tasks: Task[] = [];
  const taskTitles = [
    'Refactor Core Architecture to Microservices',
    'Design Next.js 16 Web Application System',
    'Implement Biometric Passkey Authentication',
    'Optimize Postgres Database Indexes',
    'Configure GitHub Actions CI/CD Pipeline',
    'Deploy Tauri 2.0 Desktop Executable Bundle',
    'Rebalance Q3 Investment Portfolio',
    'Conduct Annual Financial & Tax Planning',
    'Complete Advanced System Design Course',
    'Ship Shadow Tracker V2.0 Full Release'
  ];

  // Completed Tasks across 365 days
  for (let i = 1; i <= 100; i++) {
    const daysAgo = Math.floor((365 / 100) * i);
    const taskDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    tasks.push({
      id: `task-hist-${i}`,
      title: `${taskTitles[i % taskTitles.length]} #${i}`,
      description: `Executed milestone ${i} with deep focus.`,
      isCompleted: true,
      completedAt: taskDate,
      dueDate: taskDate.split('T')[0],
      priority: (i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'),
      categoryId: categories[i % categories.length].id,
      isRecurring: false,
      recurrencePattern: null,
      createdAt: taskDate,
      updatedAt: taskDate,
      isSoftDeleted: false
    });
  }

  // Active Pending Tasks
  const todayStr = now.toISOString().split('T')[0];
  tasks.push(
    { id: 'task-act-1', title: 'Review Annual Financial Growth & Savings Rate', description: 'Check remaining balance and transfer Q3 profits to savings.', isCompleted: false, priority: 'high', categoryId: 'cat-4', isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: 'task-act-2', title: 'Complete 2-Hour Deep Focus Code Sprint', description: 'Refactor state persistence and IndexedDB import/export pipelines.', isCompleted: false, priority: 'high', categoryId: 'cat-1', isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: 'task-act-3', title: 'Evening 45-Min Heavy Strength Workout', description: 'Squats, Bench Press, and Core stability circuit.', isCompleted: false, priority: 'medium', categoryId: 'cat-2', isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: 'task-act-4', title: 'Read Chapter 4 of System Architecture Handbook', description: 'Take notes in Notes feature.', isCompleted: false, priority: 'low', categoryId: 'cat-3', isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false }
  );

  // 6. Notes (15 Markdown Notes)
  const notes: Note[] = [
    { id: 'note-1', date: todayStr, title: 'Q3 Product Architecture Vision', content: '# Q3 Architecture Strategy\n\n- **Core Stack**: Next.js 16 + React 19 + TailwindCSS v4\n- **State Management**: Zustand with IndexedDB persistence\n- **Offline First**: PWA Service Worker + LocalStorage fallbacks\n- **Security**: Zero-server direct client Google Drive OAuth', createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(), updatedAt: nowStr },
    { id: 'note-2', date: todayStr, title: 'Financial Freedom & Wealth Blueprint', content: '# Wealth Allocation Rules\n\n1. **Monthly Income Target**: ₹1,50,000+\n2. **Fixed Big Expenses**: Rent (₹35k), Car EMI (₹18k), Insurance (₹5k)\n3. **Savings Rate**: Minimum 30% into Total Savings\n4. **Investment Split**: 50% Index Mutual Funds, 30% Growth Stocks, 20% Tech ETFs\n5. **Profit Rule**: 100% of Side Hustle & Dividend profits auto-transferred to Savings!', createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(), updatedAt: nowStr },
    { id: 'note-3', date: todayStr, title: 'High-Performance Habit Loops & Micro-Systems', content: '# Atomic Habit Principles\n\n- Never miss twice. One day off is recovery; two days off is a new bad habit.\n- Focus on identity, not outcome. "I am a disciplined developer," not "I want to code more."\n- Reduce friction to 0 for good habits.', createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(), updatedAt: nowStr },
    { id: 'note-4', date: todayStr, title: 'Daily Mental Models & Stoic Reflection', content: '# Core Stoic Reminders\n\n- **Amor Fati**: Embrace whatever happens as fuel for growth.\n- **Control Dichotomy**: Focus only on internal inputs (effort, focus, kindness), ignore external noise.\n- **Memento Mori**: Make today count.', createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(), updatedAt: nowStr }
  ];

  // 7. Reminders
  const reminders: Reminder[] = [
    { id: 'rem-1', title: 'Morning Routine & Meditation', time: '08:00', days: [0,1,2,3,4,5,6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: 'rem-2', title: 'Midday Deep Work Focus Sprint', time: '13:00', days: [1,2,3,4,5], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: 'rem-3', title: 'Evening Workout & Physical Health', time: '18:30', days: [1,2,3,4,5,6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: 'rem-4', title: 'Log Expenses & Daily Reflection', time: '21:30', days: [0,1,2,3,4,5,6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr }
  ];

  // 8. Money Data (12 Full Months of Detailed Expenses & Monthly Financial Maps)
  const moneyExpenses = [];
  const monthlyDataMap: Record<string, { budgetCap: number; stats: any }> = {};
  const categoriesList: ('Shopping' | 'Food' | 'Bills' | 'Other')[] = ['Shopping', 'Food', 'Bills', 'Other'];
  const notesList = [
    'Weekly Organic Groceries', 'Dinner Outing with Friends', 'Electricity & Fiber Wifi Bill',
    'New Ergonomic Chair', 'Protein Supplements & Gym Fuel', 'Fuel & Vehicle Servicing',
    'Tech Books & Subscriptions', 'Gadgets & Workspace Accessories', 'Coffee & Healthy Snacks'
  ];

  for (let m = 0; m < 12; m++) {
    const dObj = new Date(year, month - m, 1);
    const yStr = dObj.getFullYear();
    const mStr = String(dObj.getMonth() + 1).padStart(2, '0');
    const monthKey = `${yStr}-${mStr}`;
    
    // Generate 12 expenses per month
    for (let e = 1; e <= 12; e++) {
      const dayNum = String((e * 2) % 28 + 1).padStart(2, '0');
      moneyExpenses.push({
        id: `exp-${yStr}-${mStr}-${e}`,
        date: `${yStr}-${mStr}-${dayNum}`,
        amount: Math.floor(450 + ((e * 37) % 2800)),
        category: categoriesList[e % categoriesList.length],
        note: notesList[e % notesList.length]
      });
    }

    monthlyDataMap[monthKey] = {
      budgetCap: 45000,
      stats: {
        income: 150000,
        savings: 45000 + (11 - m) * 5000,
        profits: 22000,
        bigExpenses: [
          { id: `be-1-${monthKey}`, name: 'Apartment Rent', amount: 35000, isPaid: true },
          { id: `be-2-${monthKey}`, name: 'Car EMI', amount: 18000, isPaid: true },
          { id: `be-3-${monthKey}`, name: 'Family Health Cover', amount: 5000, isPaid: true }
        ],
        investments: [
          { id: `inv-1-${monthKey}`, name: 'Nifty Index Funds', amount: 25000 },
          { id: `inv-2-${monthKey}`, name: 'Growth Stocks', amount: 15000 },
          { id: `inv-3-${monthKey}`, name: 'Tech & AI ETFs', amount: 10000 }
        ],
        lentBorrowed: [
          { id: `lb-1-${monthKey}`, name: 'Alex (Project Split)', amount: 4500, isPaid: false }
        ]
      }
    };
  }

  const moneyData = {
    expenses: moneyExpenses,
    monthlyDataMap,
    stats: {
      income: 150000,
      savings: 45000,
      profits: 22000,
      bigExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 35000, isPaid: true },
        { id: '2', name: 'Car EMI', amount: 18000, isPaid: true },
        { id: '3', name: 'Family Health Cover', amount: 5000, isPaid: true }
      ],
      investments: [
        { id: '1', name: 'Nifty Index Funds', amount: 25000 },
        { id: '2', name: 'Growth Stocks', amount: 15000 },
        { id: '3', name: 'Tech & AI ETFs', amount: 10000 }
      ],
      lentBorrowed: [
        { id: '1', name: 'Alex (Project Split)', amount: 4500, isPaid: false }
      ]
    }
  };

  // 9. Standalone ToDos with Subtasks
  const standaloneTodos = [
    {
      id: 'todo-seed-1',
      title: 'Review System Architecture & Micro-Services',
      description: 'Audit service boundaries and event loop latency.',
      priority: 'high',
      category: 'Work',
      isCompleted: false,
      dueDate: todayStr,
      subtasks: [
        { id: 'st-1', title: 'Verify IndexedDB transaction concurrency', isCompleted: true },
        { id: 'st-2', title: 'Profile Next.js SSR hydration metrics', isCompleted: false },
        { id: 'st-3', title: 'Benchmark battery drain under 60fps canvas', isCompleted: false },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
    {
      id: 'todo-seed-2',
      title: 'Weekly Meal Prep: High-Protein Muscle Fuel',
      description: 'Prep marinated tofu, grilled paneer, and quinoa bowls.',
      priority: 'medium',
      category: 'Health',
      isCompleted: true,
      completedAt: nowStr,
      dueDate: todayStr,
      subtasks: [
        { id: 'st-4', title: 'Purchase fresh greens and chia seeds', isCompleted: true },
        { id: 'st-5', title: 'Portion macros into 5 glass containers', isCompleted: true },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
    {
      id: 'todo-seed-3',
      title: 'Automate Monthly Savings Transfer',
      description: 'Allocate 30% savings to index funds and sovereign bonds.',
      priority: 'high',
      category: 'Personal',
      isCompleted: false,
      dueDate: todayStr,
      subtasks: [],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
  ];

  // 10. Health & Vitality Suite Data
  const healthDailyLogs: Record<string, any> = {};
  for (let d = 30; d >= 0; d--) {
    const logDate = new Date(now.getTime() - d * 86400000);
    const dStr = logDate.toISOString().split('T')[0];
    healthDailyLogs[dStr] = {
      date: dStr,
      waterGlasses: 8 + (d % 4),
      sleepHours: 7 + ((d % 3) * 0.5),
      weightKg: 74.2 + (Math.sin(d) * 0.4),
      calories: 2250 + (d % 3) * 120,
      protein: 145 + (d % 4) * 8,
      carbs: 210 + (d % 5) * 10,
      fat: 65 + (d % 3) * 4,
      meals: [
        { id: `m1-${dStr}`, name: 'Greek Yogurt & Mixed Berries Bowl', time: '08:30', calories: 380, protein: 28, carbs: 42, fat: 8 },
        { id: `m2-${dStr}`, name: 'Grilled Paneer & Quinoa Power Salad', time: '13:00', calories: 650, protein: 38, carbs: 62, fat: 22 },
        { id: `m3-${dStr}`, name: 'Whey Protein Shake & Almonds', time: '17:00', calories: 320, protein: 34, carbs: 12, fat: 12 },
        { id: `m4-${dStr}`, name: 'Spiced Lentil Dal & Brown Basmati Bowl', time: '20:15', calories: 680, protein: 35, carbs: 88, fat: 16 },
      ]
    };
  }

  const healthData = {
    dailyLogs: healthDailyLogs,
    biometrics: {
      heightCm: 178,
      currentWeightKg: 74.5,
      targetWeightKg: 72,
      activityLevel: 'moderate',
      targetCalories: 2350,
      targetProtein: 155,
      targetCarbs: 240,
      targetFat: 68,
      targetWater: 10,
      targetSleep: 8,
    },
    customWorkouts: [
      {
        id: 'plan-push-pull-legs',
        name: 'Shadow Iron Protocol (Push / Pull / Legs)',
        description: 'Elite 3-day hypertrophy and strength development split.',
        targetDaysPerWeek: 4,
        exercises: [
          { name: 'Barbell Incline Bench Press', sets: 4, reps: '8-10', targetMuscle: 'Chest / Triceps' },
          { name: 'Weighted Pull-Ups', sets: 4, reps: '6-8', targetMuscle: 'Lats / Biceps' },
          { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', targetMuscle: 'Hamstrings / Glutes' },
          { name: 'Standing Overhead Press', sets: 4, reps: '8-10', targetMuscle: 'Deltoids' },
        ]
      }
    ],
    customDiets: [
      {
        id: 'diet-lean-bulk-clean',
        name: 'Lean Hypertrophy Athletic Diet',
        description: 'High-protein whole food plan designed for sustainable recovery.',
        dailyTargetCalories: 2350,
        dailyTargetProtein: 155,
        dailyTargetCarbs: 240,
        dailyTargetFat: 68,
      }
    ]
  };

  // 11. Life RPG Quests
  const rpgQuests = [
    { id: 'quest-1', title: 'Deep Work Mastery', description: 'Log at least 2 hours of laser-focused code or writing.', xpReward: 150, isCompleted: true, type: 'daily' },
    { id: 'quest-2', title: 'Iron Discipline', description: 'Complete your strength training session today.', xpReward: 120, isCompleted: false, type: 'daily' },
    { id: 'quest-3', title: 'Macro Alignment', description: 'Hit your daily protein target within 5% variance.', xpReward: 100, isCompleted: true, type: 'daily' },
    { id: 'quest-4', title: 'Architect of Dynasty', description: 'Maintain a 30-day streak across all core daily habits.', xpReward: 500, isCompleted: true, type: 'epic' },
  ];

  // 12. Wizard Scrolls
  const wizardScrolls = [
    { id: 'sc-1', vibe: 'power', quote: 'A lion does not flinch at the laughter of hyenas. Stay fiercely focused on building your empire.', author: 'Ancient Creed' },
    { id: 'sc-2', vibe: 'wisdom', quote: 'To reach new heights and perceive the vastness of the realm, one must be prepared to walk in solitude.', author: 'Void Monk' },
    { id: 'sc-3', vibe: 'wealth', quote: 'Patience is the ultimate leverage. Those who master compounding govern the fate of dynasties.', author: 'Compound Codex' },
    { id: 'sc-4', vibe: 'health', quote: 'Care for your mortal vessel with reverence. It is the sole temple capable of manifesting your ambitions.', author: 'Vitality Codex' }
  ];

  return {
    version: '1.0.0',
    tasks,
    habits,
    dailyLogs,
    notes,
    reminders,
    categories,
    settings,
    moneyData,
    healthData,
    standaloneTodos,
    rpgQuests,
    wizardScrolls,
    unlockedBadges,
    exportedAt: nowStr
  };
}

