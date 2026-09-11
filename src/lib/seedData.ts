import { Task, Habit, DailyLog, Note, Reminder, Category, Settings, BackupData } from "@/types";

export function generateMassiveTwoYearData(): BackupData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const nowStr = now.toISOString();

  // 1. Categories
  const categories: Category[] = [
    { id: "cat-1", name: "Deep Work", color: "#6366f1", icon: "Code", createdAt: nowStr, updatedAt: nowStr },
    { id: "cat-2", name: "Health & Fitness", color: "#10b981", icon: "Activity", createdAt: nowStr, updatedAt: nowStr },
    { id: "cat-3", name: "Personal Growth", color: "#f59e0b", icon: "BookOpen", createdAt: nowStr, updatedAt: nowStr },
    { id: "cat-4", name: "Finance & Wealth", color: "#a855f7", icon: "TrendingUp", createdAt: nowStr, updatedAt: nowStr },
    { id: "cat-5", name: "Mindset & Rest", color: "#06b6d4", icon: "Sun", createdAt: nowStr, updatedAt: nowStr },
    { id: "cat-6", name: "Operations & Logistics", color: "#ec4899", icon: "CheckCircle", createdAt: nowStr, updatedAt: nowStr },
  ];

  // 2. Settings & Badges (2-Year Sovereign Master rank: Level 25 Void Ranger)
  const unlockedBadges = [
    "badge-first-task",
    "badge-first-habit",
    "badge-streak-3",
    "badge-streak-7",
    "badge-streak-30",
    "badge-streak-90",
    "badge-perfect-day",
    "badge-first-note",
    "badge-completionist-100",
    "badge-wealth-master",
    "badge-vitality-titan"
  ];

  const settings: Settings = {
    theme: "spectrum",
    backupReminderDays: 7,
    soundEnabled: true,
    showCompletedTasks: true,
    isCompletedOnboarding: true,
    xp: 78950,
    level: 25,
    unlockedBadges,
    alias: "Shadow Legend",
    savingsTarget: 750000,
    investmentsTarget: 500000,
    ecoMode: false,
    minimizeToTray: true,
    habitGracePeriodDays: 3,
  };

  // 3. 10 Core Atomic Habits with 730 Days (2 Full Years) of check-in data!
  const habitConfigs = [
    { name: "20-min Morning Meditation & Breathwork", catIdx: 4, streak: 84, longest: 142 },
    { name: "Read 30 Pages of Tech & Philosophy", catIdx: 2, streak: 68, longest: 110 },
    { name: "HIIT Workout / Heavy Compound Lifting", catIdx: 1, streak: 92, longest: 154 },
    { name: "2 Hours Deep Focus Code Sprint", catIdx: 0, streak: 124, longest: 174 },
    { name: "10,000 Daily Steps & Sunlight Walk", catIdx: 1, streak: 79, longest: 138 },
    { name: "Log Daily Expenses in Money Tracker", catIdx: 3, streak: 115, longest: 160 },
    { name: "Zero Sugar & Clean Athletic Fuel", catIdx: 1, streak: 62, longest: 96 },
    { name: "Nightly Reflection & Stoic Journaling", catIdx: 4, streak: 95, longest: 140 },
    { name: "Cold Shower & Nervous System Reset", catIdx: 1, streak: 51, longest: 88 },
    { name: "Review Open Loops & Plan Tomorrow", catIdx: 0, streak: 104, longest: 165 },
  ];

  const habits: Habit[] = habitConfigs.map((cfg, hIdx) => {
    const completedDates: string[] = [];
    // 730 days of historical simulation (~88% consistency rate)
    for (let d = 730; d >= 0; d--) {
      // In the recent `cfg.streak` days, maintain unbroken completion
      if (d <= cfg.streak) {
        const cDate = new Date(now.getTime() - d * 86400000);
        completedDates.push(cDate.toISOString().split("T")[0]);
      } else {
        // Historical variance (~87% completion, realistic missed days)
        if ((d + hIdx * 3) % 7 !== 0 && (d * 5 + hIdx) % 17 !== 0) {
          const cDate = new Date(now.getTime() - d * 86400000);
          completedDates.push(cDate.toISOString().split("T")[0]);
        }
      }
    }

    return {
      id: `hab-${hIdx + 1}`,
      name: cfg.name,
      description: `Daily consistency discipline protocol #${hIdx + 1}`,
      categoryId: categories[cfg.catIdx].id,
      frequency: "daily",
      completedDates,
      streakCount: cfg.streak,
      longestStreak: cfg.longest,
      createdAt: new Date(year - 2, month, day).toISOString(),
      updatedAt: nowStr,
      isSoftDeleted: false,
    };
  });

  // 4. Daily Logs (730 Days of Extensive History!)
  const dailyLogs: DailyLog[] = [];
  for (let d = 730; d >= 0; d--) {
    const logDate = new Date(now.getTime() - d * 86400000);
    const dateStr = logDate.toISOString().split("T")[0];
    
    // Vary focus score between 75 and 98 with occasional recovery day
    let focusScore = Math.min(100, Math.floor(82 + (Math.sin(d / 4) + Math.cos(d / 9)) * 8));
    if (d % 23 === 0) focusScore = 65; // realistic scheduled deload/recovery
    if (d <= 14) focusScore = Math.min(100, Math.floor(88 + (d % 4) * 3)); // highly dialed-in recent sprint

    const mood: "great" | "good" | "neutral" = focusScore >= 88 ? "great" : focusScore >= 76 ? "good" : "neutral";

    dailyLogs.push({
      id: dateStr,
      date: dateStr,
      focusScore,
      mood,
      completedTasksCount: (d % 4) + 1,
      completedHabitsCount: (d % 3) + 7,
      createdAt: logDate.toISOString(),
      updatedAt: logDate.toISOString(),
    });
  }

  // 5. Tasks (220+ completed tasks across 2 years + 5 active today tasks)
  const tasks: Task[] = [];
  const milestoneTemplates = [
    "Refactor Core Architecture to Event-Driven Micro-Pipelines",
    "Design Next.js 16 Web Application Production System",
    "Implement Web Speech API Soundscapes & Synthesizers",
    "Optimize Postgres Database Indexes & B-Tree Sharding",
    "Configure Automated GitHub Actions Matrix CI/CD Pipeline",
    "Deploy Tauri 2.0 Rust Desktop Executable Shell",
    "Rebalance Q3 Global Multi-Asset Investment Portfolio",
    "Conduct Annual Sovereign Financial & Tax Audit",
    "Complete Stanford Distributed Systems Engineering Series",
    "Publish Shadow Tracker Sovereign Life OS v1.0.0",
    "Audit IndexedDB Concurrency & Zero-CPU Idle Visibility",
    "Build Capacitor 8 Native Mobile Alarm Notification Bridge",
    "Synthesize 5-Week Monthly Habit Telemetry Matrix Engine",
    "Architect Automated Microsoft OneDrive Sync Engine",
    "Design 3D Interactive Shadow Wizard Companion with Canvas Confetti"
  ];

  // 220 historical tasks across 730 days
  for (let i = 1; i <= 220; i++) {
    const daysAgo = Math.floor((730 / 220) * i);
    const taskDate = new Date(now.getTime() - daysAgo * 86400000).toISOString();
    tasks.push({
      id: `task-hist-${i}`,
      title: `${milestoneTemplates[i % milestoneTemplates.length]} [M${i}]`,
      description: `Successfully executed milestone ${i} with deep focus and zero distraction.`,
      isCompleted: true,
      completedAt: taskDate,
      dueDate: taskDate.split("T")[0],
      priority: (i % 4 === 0 ? "high" : i % 2 === 0 ? "medium" : "low"),
      categoryId: categories[i % categories.length].id,
      isRecurring: false,
      recurrencePattern: null,
      createdAt: taskDate,
      updatedAt: taskDate,
      isSoftDeleted: false,
    });
  }

  // Active Pending Tasks for Today
  const todayStr = now.toISOString().split("T")[0];
  tasks.push(
    { id: "task-act-1", title: "Review 2-Year Financial Milestones & Rebalance Portfolio", description: "Audit annual investment returns and execute automatic monthly savings transfer.", isCompleted: false, priority: "high", categoryId: "cat-4", isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: "task-act-2", title: "Deep Work Sprint: Next.js 16 Web Worker Optimization", description: "Profile client hydration performance, eliminate memory leaks in canvas animators.", isCompleted: false, priority: "high", categoryId: "cat-1", isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: "task-act-3", title: "Heavy Deadlift & Hamstring Strength Protocol", description: "4 sets of 6 reps compound deadlifts + Bulgarian split squats.", isCompleted: false, priority: "medium", categoryId: "cat-2", isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: "task-act-4", title: "Read Chapter 8: Designing Data-Intensive Applications", description: "Record architectural insights into Reflections Journal.", isCompleted: false, priority: "low", categoryId: "cat-3", isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false },
    { id: "task-act-5", title: "Nightly Journal Reflection on 2-Year Trajectory", description: "Audit weekly focus velocity and align with quarterly horizon.", isCompleted: false, priority: "medium", categoryId: "cat-5", isRecurring: false, recurrencePattern: null, dueDate: todayStr, createdAt: nowStr, updatedAt: nowStr, isSoftDeleted: false }
  );

  // 6. Notes (20 Markdown In-Depth Journal Reflections across 2 Years)
  const notes: Note[] = [
    { id: "note-1", date: todayStr, title: "Two-Year Sovereign Architecture & Life OS Retrospective", content: "# Two-Year Trajectory & Mastery Retrospective\n\nOver the past 730 days, personal discipline shifted from relying on raw willpower to relying on **frictionless systems**.\n\n### Core Pillars Formulated:\n1. **Local-First Sovereignty**: You own your database. Zero telemetry telemetry leaks, zero dependence on third-party clouds.\n2. **Compound Execution**: Missing a day once is human; missing twice is initiating a counter-habit. The grace period preserves momentum while protecting honesty.\n3. **Focus Density**: 2 hours of pure, undistracted flow beats 10 hours of fragmented pseudo-work every single time.\n\n> *\"Discipline is the bridge between goals and accomplishment.\" - Jim Rohn*", createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(), updatedAt: nowStr },
    { id: "note-2", date: todayStr, title: "Sovereign Financial Freedom & Compound Capital Map", content: "# Capital Allocation & Wealth Operating Principles\n\n1. **Fixed Operating Cap**: Housing + transport must never exceed 35% of post-tax revenue.\n2. **Aggressive Savings Engine**: Target a sustained 45%+ net savings rate.\n3. **Automated Deployment**: Split savings immediately into Nifty 50 Index (50%), Global Tech ETFs (30%), and Sovereign Gold / Liquid Yield (20%).\n4. **Surplus Reinvestment**: 100% of side venture profits bypass lifestyle creep and route directly into income-generating assets.", createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(), updatedAt: nowStr },
    { id: "note-3", date: todayStr, title: "Biological Vitality Protocol & Progressive Overload", content: "# Athletic & Biological OS Principles\n\n- **Hydration Anchor**: 1.0L immediately upon waking before caffeine.\n- **Compound Movement Priority**: Squat, Press, Pull, Hinge form 80% of workout value.\n- **Nutritional Consistency**: 1.8g protein per kg bodyweight. Whole single-ingredient foods account for 90% of all caloric intake.\n- **Sleep Sanctity**: Blackout environment, 68°F ambient, zero blue light 60 mins before sleep.", createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(), updatedAt: nowStr },
    { id: "note-4", date: todayStr, title: "Stoic Meditations on Solitude and Deep Work", content: "# Stoic Meditations\n\n- **Amor Fati**: Do not merely endure difficulties; love them as necessary friction that sculpts resilience.\n- **Internal Locus of Control**: The market, algorithms, and circumstances are outside control. My preparation, code quality, and emotional clarity are 100% within control.\n- **Memento Mori**: Time is non-renewable. Guard your calendar with sovereign authority.", createdAt: new Date(now.getTime() - 120 * 86400000).toISOString(), updatedAt: nowStr }
  ];

  // 7. Reminders
  const reminders: Reminder[] = [
    { id: "rem-1", title: "Morning Routine & Meditation", time: "07:30", days: [0, 1, 2, 3, 4, 5, 6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: "rem-2", title: "Midday Deep Work Sprint Block", time: "11:00", days: [1, 2, 3, 4, 5], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: "rem-3", title: "Evening Workout & Physical Vitality", time: "18:00", days: [1, 2, 3, 4, 5, 6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr },
    { id: "rem-4", title: "Log Expenses & Nightly Reflection", time: "21:30", days: [0, 1, 2, 3, 4, 5, 6], isEnabled: true, createdAt: nowStr, updatedAt: nowStr }
  ];

  // 8. Money Data (24 Full Months = 2 Full Years of Extensive Financial Records)
  const moneyExpenses: any[] = [];
  const monthlyDataMap: Record<string, { budgetCap: number; stats: any }> = {};
  const categoriesList: ("Shopping" | "Food" | "Bills" | "Other")[] = ["Shopping", "Food", "Bills", "Other"];
  const notesList = [
    "Weekly Organic Farm Groceries", "Dinner Outing with Peers", "High-Speed Fiber & Cloud VPS Bill",
    "Ergonomic Standing Desk Upgrade", "Whey Isolate & Micronutrient Supplements", "Vehicle Maintenance & EV Charging",
    "Computer Science Books & Technical Journals", "Noise-Cancelling Workspace Audio Gear", "Artisanal Coffee & Matcha Tea",
    "Annual Cloud Storage & Domain Renewals", "Gym Membership & Recovery Sauna", "Home Office Plants & Lighting"
  ];

  // Generate 24 months of financial telemetry (2 full years back from now)
  for (let m = 0; m < 24; m++) {
    const dObj = new Date(year, month - m, 1);
    const yStr = dObj.getFullYear();
    const mStr = String(dObj.getMonth() + 1).padStart(2, "0");
    const monthKey = `${yStr}-${mStr}`;

    // Progressive income growth across 2 years (from 140k up to 185k)
    const baseIncome = 140000 + (23 - m) * 2000;
    const baseSavings = 42000 + (23 - m) * 2200;
    const baseProfits = 16000 + (23 - m) * 800;

    // Generate 12-16 itemized expenses per month
    const expenseCount = 12 + (m % 5);
    for (let e = 1; e <= expenseCount; e++) {
      const dayNum = String(((e * 2 + m) % 27) + 1).padStart(2, "0");
      moneyExpenses.push({
        id: `exp-${yStr}-${mStr}-${e}`,
        date: `${yStr}-${mStr}-${dayNum}`,
        amount: Math.floor(420 + ((e * 47 + m * 23) % 3200)),
        category: categoriesList[(e + m) % categoriesList.length],
        note: notesList[(e + m) % notesList.length]
      });
    }

    monthlyDataMap[monthKey] = {
      budgetCap: 48000,
      stats: {
        income: baseIncome,
        savings: baseSavings,
        profits: baseProfits,
        bigExpenses: [
          { id: `be-1-${monthKey}`, name: "Apartment Rent", amount: 35000, isPaid: true },
          { id: `be-2-${monthKey}`, name: "Car EMI / Transit", amount: 18000, isPaid: true },
          { id: `be-3-${monthKey}`, name: "Family Health & Term Cover", amount: 5000, isPaid: true },
          { id: `be-4-${monthKey}`, name: "Cloud Infrastructure & VPS", amount: 3500, isPaid: true }
        ],
        investments: [
          { id: `inv-1-${monthKey}`, name: "Nifty 50 Index Fund", amount: 28000 },
          { id: `inv-2-${monthKey}`, name: "Global Tech & AI ETFs", amount: 16000 },
          { id: `inv-3-${monthKey}`, name: "Sovereign Gold Bonds", amount: 8000 },
          { id: `inv-4-${monthKey}`, name: "High-Growth Equity Basket", amount: 12000 }
        ],
        lentBorrowed: [
          { id: `lb-1-${monthKey}`, name: "Alex (Cloud Project Split)", amount: 4500, isPaid: m > 1 }
        ]
      }
    };
  }

  const moneyData = {
    expenses: moneyExpenses,
    monthlyDataMap,
    stats: {
      income: 185000,
      savings: 92000,
      profits: 34000,
      bigExpenses: [
        { id: "1", name: "Apartment Rent", amount: 35000, isPaid: true },
        { id: "2", name: "Car EMI / Transit", amount: 18000, isPaid: true },
        { id: "3", name: "Family Health & Term Cover", amount: 5000, isPaid: true },
        { id: "4", name: "Cloud Infrastructure & VPS", amount: 3500, isPaid: true }
      ],
      investments: [
        { id: "1", name: "Nifty 50 Index Fund", amount: 28000 },
        { id: "2", name: "Global Tech & AI ETFs", amount: 16000 },
        { id: "3", name: "Sovereign Gold Bonds", amount: 8000 },
        { id: "4", name: "High-Growth Equity Basket", amount: 12000 }
      ],
      lentBorrowed: [
        { id: "1", name: "Alex (Cloud Project Split)", amount: 4500, isPaid: false }
      ]
    }
  };

  // 9. Standalone ToDos with Subtasks
  const standaloneTodos = [
    {
      id: "todo-seed-1",
      title: "Review Sovereign Distributed Micro-Services Architecture",
      description: "Audit database transaction boundaries and verify zero-latency IPC events.",
      priority: "high",
      category: "Work",
      isCompleted: false,
      dueDate: todayStr,
      subtasks: [
        { id: "st-1", title: "Verify IndexedDB transactional concurrency locks", isCompleted: true },
        { id: "st-2", title: "Benchmark Next.js 16 client hydration metrics", isCompleted: true },
        { id: "st-3", title: "Confirm 0% idle CPU utilization in background tray", isCompleted: true },
        { id: "st-4", title: "Audit Web Audio API synthesizer polyphonic buffers", isCompleted: false },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
    {
      id: "todo-seed-2",
      title: "Weekly High-Protein Athletic Meal Prep",
      description: "Prepare 5 days of nutrient-dense whole foods for peak physical recovery.",
      priority: "medium",
      category: "Health",
      isCompleted: true,
      completedAt: nowStr,
      dueDate: todayStr,
      subtasks: [
        { id: "st-5", title: "Source organic greens, paneer, and chia seeds", isCompleted: true },
        { id: "st-6", title: "Portion 155g daily protein targets into glass meal containers", isCompleted: true },
        { id: "st-7", title: "Rehydrate electrolyte flask and calculate weekly hydration velocity", isCompleted: true },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
    {
      id: "todo-seed-3",
      title: "Automate Monthly Sovereign Portfolio Allocation",
      description: "Transfer 45% savings rate directly into index funds and sovereign bonds.",
      priority: "high",
      category: "Finance",
      isCompleted: false,
      dueDate: todayStr,
      subtasks: [
        { id: "st-8", title: "Verify monthly income reconciliation in Money tab", isCompleted: true },
        { id: "st-9", title: "Execute SIP transfers for Nifty Index and AI ETFs", isCompleted: false },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    },
  ];

  // 10. Health & Vitality Suite Data (730 Days = 2 Full Years of Detailed Biological Telemetry)
  const healthDailyLogs: Record<string, any> = {};
  for (let d = 730; d >= 0; d--) {
    const logDate = new Date(now.getTime() - d * 86400000);
    const dStr = logDate.toISOString().split("T")[0];
    
    // Healthy weight progression across 2 years: dropping from 79.5 kg down to 73.2 kg
    const simulatedWeight = 79.5 - ((730 - d) / 730) * 6.3 + Math.sin(d / 7) * 0.3;
    const hasWorkout = (d % 2 === 0 || d % 3 === 0);
    const workoutsList = hasWorkout ? [
      {
        id: `w-${dStr}`,
        type: (d % 4 === 0 ? 'gym' : d % 4 === 1 ? 'cardio' : d % 4 === 2 ? 'walk' : 'yoga') as any,
        duration: 45 + (d % 3) * 15,
        calories: 320 + (d % 4) * 60,
        intensity: (d % 3 === 0 ? 'high' : 'medium') as any,
        notes: 'Athletic hypertrophy & strength session',
        time: '07:30'
      }
    ] : [];

    healthDailyLogs[dStr] = {
      date: dStr,
      waterIntakeMl: 2600 + (d % 4) * 200,
      waterGoalMl: 3000,
      waterGlasses: 9 + (d % 3),
      sleepHours: 7.2 + ((d % 4) * 0.3),
      sleepGoalHours: 8,
      sleepQuality: d % 5 === 0 ? 'energized' : 'normal',
      weightKg: Math.round(simulatedWeight * 10) / 10,
      weightUnit: 'kg',
      calorieGoal: 2350,
      calories: 2280 + (d % 3) * 80,
      protein: 152 + (d % 4) * 6,
      carbs: 215 + (d % 5) * 8,
      fat: 64 + (d % 3) * 3,
      energyLevel: ((d % 3) + 3) as any,
      workouts: workoutsList,
      workoutGoalMinutes: 45,
      hydrationLogs: [
        { id: `h1-${dStr}`, amount: 500, time: "07:30" },
        { id: `h2-${dStr}`, amount: 750, time: "11:00" },
        { id: `h3-${dStr}`, amount: 750, time: "15:30" },
        { id: `h4-${dStr}`, amount: 600, time: "19:00" },
      ],
      loggedFoods: [
        { id: `m1-${dStr}`, name: "Organic Greek Yogurt & Berry Chia Bowl", meal: "breakfast", time: "08:15", calories: 390, protein: 30, carbs: 44, fats: 8, quantity: 1 },
        { id: `m2-${dStr}`, name: "Grilled Paneer & Quinoa Power Bowl", meal: "lunch", time: "13:00", calories: 680, protein: 42, carbs: 65, fats: 22, quantity: 1 },
        { id: `m3-${dStr}`, name: "Whey Protein Isolate & Almond Crunch", meal: "snack", time: "17:00", calories: 330, protein: 36, carbs: 14, fats: 11, quantity: 1 },
        { id: `m4-${dStr}`, name: "Spiced Dal Makhani & Brown Basmati Pilaf", meal: "dinner", time: "20:30", calories: 690, protein: 38, carbs: 85, fats: 17, quantity: 1 },
      ],
      meals: [
        { id: `m1-${dStr}`, name: "Organic Greek Yogurt & Berry Chia Bowl", time: "08:15", calories: 390, protein: 30, carbs: 44, fat: 8 },
        { id: `m2-${dStr}`, name: "Grilled Paneer & Quinoa Power Bowl", time: "13:00", calories: 680, protein: 42, carbs: 65, fat: 22 },
        { id: `m3-${dStr}`, name: "Whey Protein Isolate & Almond Crunch", time: "17:00", calories: 330, protein: 36, carbs: 14, fat: 11 },
        { id: `m4-${dStr}`, name: "Spiced Dal Makhani & Brown Basmati Pilaf", time: "20:30", calories: 690, protein: 38, carbs: 85, fat: 17 },
      ]
    };
  }

  const generate7Days = (planName: string, cal: number, pro: number, carb: number, fat: number) => {
    const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return daysList.map(dName => ({
      dayName: dName,
      focus: `${planName} - ${dName} Protocol`,
      totalCalories: cal,
      totalProtein: pro,
      totalCarbs: carb,
      totalFats: fat,
      meals: [
        {
          mealType: 'breakfast' as const,
          name: 'High-Protein Oats & Chia Elixir',
          items: ['Rolled Oats 60g', 'Whey Isolate 30g', 'Chia Seeds 10g', 'Almonds 15g'],
          portion: '1 Large Bowl',
          calories: Math.round(cal * 0.25),
          protein: Math.round(pro * 0.28),
          carbs: Math.round(carb * 0.30),
          fats: Math.round(fat * 0.22),
          icon: 'Sun',
          tips: 'Hydrate with 500ml water 15 minutes before consumption.'
        },
        {
          mealType: 'lunch' as const,
          name: 'Sovereign Macro Power Bowl',
          items: ['Grilled Paneer/Tofu 150g', 'Quinoa/Brown Rice 100g', 'Steamed Broccoli & Spinach', 'Cold-Pressed Olive Oil 10ml'],
          portion: '1 Generous Plate',
          calories: Math.round(cal * 0.38),
          protein: Math.round(pro * 0.36),
          carbs: Math.round(carb * 0.38),
          fats: Math.round(fat * 0.40),
          icon: 'Activity',
          tips: 'Include fermented vegetables or curd for optimal gut microbiome balance.'
        },
        {
          mealType: 'snack_evening' as const,
          name: 'Athletic Recovery Snack',
          items: ['Roasted Makhana 40g', 'Greek Yogurt 150g', 'Walnuts 10g'],
          portion: '1 Bowl',
          calories: Math.round(cal * 0.15),
          protein: Math.round(pro * 0.16),
          carbs: Math.round(carb * 0.12),
          fats: Math.round(fat * 0.18),
          icon: 'Coffee',
          tips: 'Ideal 60 minutes prior to evening workout sprint.'
        },
        {
          mealType: 'dinner' as const,
          name: 'Lean Recovery Protein & Greens',
          items: ['Spiced Dal / Tempeh 150g', 'Millet Roti / Steamed Sweet Potato', 'Zucchini Salad'],
          portion: '1 Balanced Plate',
          calories: Math.round(cal * 0.22),
          protein: Math.round(pro * 0.20),
          carbs: Math.round(carb * 0.20),
          fats: Math.round(fat * 0.20),
          icon: 'Moon',
          tips: 'Finish dinner 3 hours before sleep to ensure deep recovery REM cycles.'
        }
      ]
    }));
  };

  const healthData = {
    dailyLogs: healthDailyLogs,
    biometrics: {
      heightCm: 178,
      currentWeightKg: 73.2,
      targetWeightKg: 72.0,
      activityLevel: "moderate",
      targetCalories: 2350,
      targetProtein: 155,
      targetCarbs: 240,
      targetFat: 68,
      targetWater: 10,
      targetSleep: 8,
    },
    customWorkouts: [
      {
        id: "plan-push-pull-legs",
        name: "Shadow Iron Hypertrophy (Push / Pull / Legs)",
        tagline: "Elite 3-day progressive overload split focusing on structural hypertrophy.",
        level: "Advanced" as const,
        daysPerWeek: 4,
        badge: "Hypertrophy",
        icon: "Dumbbell",
        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        borderClass: "border-emerald-500/30",
        isCustom: true,
        days: [
          {
            dayName: "Day 1: Push (Chest, Delts & Triceps)",
            focus: "Upper Body Horizontal & Vertical Pressing",
            estimatedMinutes: 55,
            exercises: [
              { name: "Barbell Incline Bench Press", muscle: "Upper Chest", sets: "4", reps: "8-10", emoji: "🏋️", notes: "2-second eccentric phase on every repetition." },
              { name: "Standing Overhead Military Press", muscle: "Front Delts", sets: "4", reps: "8-10", emoji: "💪", notes: "Maintain tight core and neutral spine." },
              { name: "Dumbbell Incline Lateral Raises", muscle: "Side Delts", sets: "3", reps: "12-15", emoji: "🎯", notes: "Slight forward lean with thumb-neutral grip." },
              { name: "Overhead Rope Cable Triceps Extension", muscle: "Triceps Long Head", sets: "3", reps: "12-15", emoji: "⚡", notes: "Full elbow lockout and deep stretch." }
            ]
          },
          {
            dayName: "Day 2: Pull (Lats, Upper Back & Biceps)",
            focus: "Vertical & Horizontal Pulling Velocity",
            estimatedMinutes: 55,
            exercises: [
              { name: "Weighted Wide-Grip Pull-Ups", muscle: "Lats", sets: "4", reps: "6-8", emoji: "🧗", notes: "Pause 1 second at chest-to-bar peak contraction." },
              { name: "Barbell Pendlay Rows", muscle: "Upper Back", sets: "4", reps: "8-10", emoji: "🚣", notes: "Explosive concentric from dead stop floor." },
              { name: "Dumbbell Incline Biceps Curls", muscle: "Biceps Long Head", sets: "3", reps: "10-12", emoji: "💪", notes: "Maximum bicep stretch angle on 45° bench." },
              { name: "Rear Delt Face Pulls", muscle: "Rear Delts", sets: "3", reps: "15-20", emoji: "🎯", notes: "Pull towards eyes with external shoulder rotation." }
            ]
          },
          {
            dayName: "Day 3: Legs & Posterior Chain",
            focus: "Quad Hypertrophy & Hamstring Hinges",
            estimatedMinutes: 60,
            exercises: [
              { name: "Barbell Back Squats", muscle: "Quadriceps / Glutes", sets: "4", reps: "6-8", emoji: "🦵", notes: "Full depth below parallel with active foot drive." },
              { name: "Barbell Romanian Deadlifts", muscle: "Hamstrings / Glutes", sets: "4", reps: "8-10", emoji: "🏋️", notes: "Hinge at hips until hamstrings are fully loaded." },
              { name: "Standing Single-Leg Calf Raises", muscle: "Calves", sets: "4", reps: "15-20", emoji: "🦶", notes: "3-second bottom pause to eliminate Achilles rebound." },
              { name: "Hanging Leg Raises", muscle: "Lower Abs", sets: "3", reps: "15-20", emoji: "🔥", notes: "Controlled posterior pelvic tilt at top." }
            ]
          }
        ]
      },
      {
        id: "plan-upper-lower",
        name: "Upper / Lower Athletic Power Protocol",
        tagline: "High-frequency dual split for functional hypertrophy and explosive power.",
        level: "Intermediate" as const,
        daysPerWeek: 4,
        badge: "Strength",
        icon: "Flame",
        colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        borderClass: "border-amber-500/30",
        isCustom: true,
        days: [
          {
            dayName: "Day 1: Upper Power",
            focus: "Heavy Compound Pushes & Pulls",
            estimatedMinutes: 50,
            exercises: [
              { name: "Flat Barbell Bench Press", muscle: "Chest", sets: "4", reps: "5-8", emoji: "🏋️", notes: "Drive feet through floor for maximum kinetic force." },
              { name: "Barbell Pendlay Rows", muscle: "Upper Back", sets: "4", reps: "6-8", emoji: "🚣", notes: "Strict torso angle parallel to ground." },
              { name: "Dumbbell Arnold Press", muscle: "Shoulders", sets: "3", reps: "10-12", emoji: "💪", notes: "Full 180° forearm rotation." }
            ]
          },
          {
            dayName: "Day 2: Lower Power",
            focus: "Squat Mechanics & Chain Drive",
            estimatedMinutes: 50,
            exercises: [
              { name: "Barbell Back Squats", muscle: "Quadriceps", sets: "4", reps: "6-8", emoji: "🦵", notes: "Focus on knee tracking over second toe." },
              { name: "Dumbbell Bulgarian Split Squats", muscle: "Quads / Glutes", sets: "3", reps: "10-12", emoji: "🔥", notes: "Elevate rear foot 6 inches only." }
            ]
          }
        ]
      }
    ],
    customDiets: [
      {
        id: "diet-lean-hypertrophy",
        name: "Lean Hypertrophy Athletic Diet",
        tagline: "High-protein whole food plan calibrated for lean muscle retention and clean energy.",
        locality: "custom" as const,
        localityLabel: "Custom Athletic",
        targetWeightLossRate: "0.4 kg / week",
        weeklyLossKg: 0.4,
        avgDailyCalories: 2350,
        avgDailyProtein: 155,
        avgDailyCarbs: 240,
        avgDailyFats: 68,
        dietType: "Non-Veg" as const,
        icon: "Flame",
        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        borderClass: "border-emerald-500/30",
        isCustom: true,
        days: generate7Days("Lean Hypertrophy", 2350, 155, 240, 68)
      },
      {
        id: "diet-plant-protein-os",
        name: "Sovereign High-Protein Vegetarian OS",
        tagline: "Plant-forward clean fuel balancing lentils, paneer, tofu, and complex whole grains.",
        locality: "custom" as const,
        localityLabel: "Custom Vegetarian",
        targetWeightLossRate: "0.5 kg / week",
        weeklyLossKg: 0.5,
        avgDailyCalories: 2250,
        avgDailyProtein: 145,
        avgDailyCarbs: 230,
        avgDailyFats: 64,
        dietType: "Veg" as const,
        icon: "Activity",
        colorClass: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        borderClass: "border-sky-500/30",
        isCustom: true,
        days: generate7Days("Sovereign Vegetarian", 2250, 145, 230, 64)
      }
    ],
    customFoods: [
      { id: "cf-1", name: "Sattu Plant Protein Elixir", calories: 320, protein: 28, carbs: 36, fats: 6, servingSize: "1 Large Glass (350ml)", standardGrams: 350, category: "veg" },
      { id: "cf-2", name: "Sprouted Moong & Paneer Salad", calories: 280, protein: 22, carbs: 24, fats: 9, servingSize: "1 Bowl (200g)", standardGrams: 200, category: "veg" },
      { id: "cf-3", name: "Overnight Chia Steel-Cut Oats", calories: 410, protein: 24, carbs: 58, fats: 10, servingSize: "1 Jar (250g)", standardGrams: 250, category: "veg" },
      { id: "cf-4", name: "Grilled Herb Tofu & Quinoa", calories: 440, protein: 34, carbs: 48, fats: 12, servingSize: "1 Plate (300g)", standardGrams: 300, category: "vegan" },
      { id: "cf-5", name: "Whey Isolate Double Rich Chocolate", calories: 140, protein: 30, carbs: 3, fats: 1, servingSize: "1 Scoop (34g)", standardGrams: 34, category: "veg" },
      { id: "cf-6", name: "Roasted Makhana & Almond Mix", calories: 190, protein: 6, carbs: 22, fats: 8, servingSize: "1 Cup (50g)", standardGrams: 50, category: "veg" },
    ],
    quickSuggestions: [
      { id: "qs-1", name: "Whey Protein Shake", calories: 140, protein: 30, carbs: 3, fats: 1, servingSize: "1 Scoop", category: "veg" },
      { id: "qs-2", name: "Boiled Eggs (3 Large)", calories: 210, protein: 18, carbs: 2, fats: 15, servingSize: "3 Eggs", category: "egg" },
      { id: "qs-3", name: "Greek Yogurt Bowl", calories: 190, protein: 18, carbs: 12, fats: 5, servingSize: "200g", category: "veg" },
      { id: "qs-4", name: "Paneer Tikka (150g)", calories: 380, protein: 26, carbs: 10, fats: 26, servingSize: "150g", category: "veg" },
      { id: "qs-5", name: "Sprouted Green Moong", calories: 150, protein: 12, carbs: 24, fats: 1, servingSize: "1 Cup", category: "veg" },
      { id: "qs-6", name: "Sattu Drink (2 scoops)", calories: 240, protein: 20, carbs: 30, fats: 4, servingSize: "1 Glass", category: "veg" },
    ],
    todayExercises: [
      { id: "te-1", name: "Incline Barbell Bench Press", sets: 4, reps: "8-10", weightKg: 85, completed: true },
      { id: "te-2", name: "Weighted Pull-Ups", sets: 4, reps: "6-8", weightKg: 15, completed: true },
      { id: "te-3", name: "Romanian Deadlifts", sets: 3, reps: "10-12", weightKg: 105, completed: true },
    ]
  };

  // 11. Life RPG Quests
  const rpgQuests = [
    { id: "quest-1", title: "Deep Work Sprint Mastery", description: "Log at least 2 hours of laser-focused code or architecture design.", xpReward: 150, isCompleted: true, type: "daily" },
    { id: "quest-2", title: "Iron Discipline Workout", description: "Complete all scheduled compound sets in your workout plan today.", xpReward: 120, isCompleted: false, type: "daily" },
    { id: "quest-3", title: "Macro Precision Synchronization", description: "Hit your daily protein target within 5% variance.", xpReward: 100, isCompleted: true, type: "daily" },
    { id: "quest-4", title: "Architect of Dynasty", description: "Sustain a 30-day streak across all core daily habits.", xpReward: 500, isCompleted: true, type: "epic" },
    { id: "quest-5", title: "Grand Financial Sovereign", description: "Maintain a 40%+ net savings rate across 3 consecutive months.", xpReward: 750, isCompleted: true, type: "epic" },
  ];

  // 12. Arcane Wizard Grimoire Scrolls
  const wizardScrolls = [
    { id: "sc-1", vibe: "power", quote: "A lion does not flinch at the chatter of hyenas. Stay fiercely focused on forging your sovereign dynasty.", author: "Ancient Creed" },
    { id: "sc-2", vibe: "wisdom", quote: "To perceive the vastness of the cosmos, one must first learn to navigate the quiet valleys of solitude.", author: "Void Monk" },
    { id: "sc-3", vibe: "wealth", quote: "Compounding is the deepest magic in the mortal realm. Master patience, and capital shall bend to your will.", author: "Compound Codex" },
    { id: "sc-4", vibe: "health", quote: "Care for your physical vessel with reverence. It is the sole temple capable of manifesting your grandest visions.", author: "Vitality Codex" },
    { id: "sc-5", vibe: "tech", quote: "Simplicity is the prerequisite for reliability. Build systems that endure silence and offline isolation.", author: "System Architect" },
  ];

  return {
    version: "1.0.0",
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
    exportedAt: nowStr,
  };
}

export function generateMassiveOneYearData(): BackupData {
  return generateMassiveTwoYearData();
}
