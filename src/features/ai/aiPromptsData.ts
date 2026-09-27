import { PromptTemplateItem } from './aiTypes';

export const BUILTIN_PROMPTS: PromptTemplateItem[] = [
  // 1. Tasks & Planning
  {
    id: 'p_task_mit',
    title: 'Daily Top 3 MITs & Execution Plan',
    category: 'Tasks',
    prompt: 'Review my open tasks from my context and identify my Top 3 Most Important Tasks (MITs) for today. Schedule realistic time estimates and create any missing actionable subtasks.',
    description: 'Prioritize highest leverage tasks with time-boxing.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_task_breakdown',
    title: 'Decompose Complex Goal into Tasks',
    category: 'Tasks',
    prompt: 'I want to execute a major project. Help me break it down into 3-5 distinct, bite-sized tasks with priorities and due dates over the next 7 days, and call create_task for each.',
    description: 'Transforms ambiguous goals into concrete roadmap tasks.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_task_todo_sprint',
    title: 'Quick Checklist Sprint for Today',
    category: 'Tasks',
    prompt: 'Add 4 standalone checklist ToDos for quick administrative errands today (e.g. Inbox zero, organize desk, update backlog, review calendar), and call create_todo for each.',
    description: 'Generates rapid checklist items in the ToDo studio.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_task_velocity_audit',
    title: 'Roadmap Velocity & Completion Audit',
    category: 'Tasks',
    prompt: 'Audit my completed vs pending tasks in my active context window. What is my task completion velocity, and what bottlenecks or overdue items require immediate attention?',
    description: 'Analyzes completion ratios and overdue items.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 2. Habits & Routines
  {
    id: 'p_habit_streak_check',
    title: 'Habit Streak Integrity & Risk Audit',
    category: 'Habits',
    prompt: 'Audit all my habit routines and streak counts. Identify which routines are on a hot streak and which ones are at risk of lapsing today. Provide practical tips to protect momentum.',
    description: 'Pinpoints habits requiring immediate attention today.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_habit_mark_all_done',
    title: 'Log Today\'s Core Habit Completions',
    category: 'Habits',
    prompt: 'Log habit completion for my core daily routines for today (e.g. Meditation, Workout, Reading), boosting my streak count and updating my logs.',
    description: 'Batch logs today’s completed routines in one prompt.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_habit_atomic_stack',
    title: 'Design an Atomic Habit Stack',
    category: 'Habits',
    prompt: 'Design an Atomic Habit Loop linking a new beneficial routine to an existing strong habit in my tracker. Then call create_habit to establish it.',
    description: 'Creates science-backed habit chains using habit stacking.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_habit_evening_winddown',
    title: 'Evening Digital Sunset & Wind-Down',
    category: 'Habits',
    prompt: 'Create a new daily habit titled "Digital Sunset & Screen Off" scheduled for nighttime, and configure an evening reminder notification for it at 21:30.',
    description: 'Establishes a healthy evening sleep preparation routine.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 3. Health & Diet
  {
    id: 'p_health_custom_food_creator',
    title: 'Custom Food Creator (Interactive Skill)',
    category: 'Health & Diet',
    prompt: 'I want to create a new custom food for my library. Please act as the Custom Food Creator skill. Ask me for the food name, category (breakfast, lunch, dinner, snack), serving description, and standard grams. Ask if I know the calories, protein, carbs, and fats. If I don\'t know the exact macros, calculate or estimate them accurately from your nutrition database, ask for my confirmation, and then call create_custom_food to permanently append it to my Food Library!',
    description: 'Interviews you on dish name and grams, calculates missing macros, and saves to Food Library.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_weekly_diet_planner',
    title: 'AI Weekly Diet Planner (Day-by-Day Skill)',
    category: 'Health & Diet',
    prompt: 'Please act as the AI Diet Planner skill. Interview me step-by-step: ask what my goal is (fat loss, muscle gain, maintenance), target daily calories, dietary preferences (veg, non-veg, regional tastes), and walk through Monday to Sunday asking what foods I want or offering balanced suggestions for each meal (breakfast, lunch, dinner, snack). Once we confirm the schedule, call create_diet_plan to save my complete 7-day weekly meal plan!',
    description: 'Interactive day-by-day meal planning interview asking food choices and generating a 7-day plan.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_water_log',
    title: 'Log Water Intake & Hydration Pacing',
    category: 'Health & Diet',
    prompt: 'Log 500ml of water intake for today using log_water_intake, and calculate how many more milliliters I need to hit my 3000ml optimal target.',
    description: 'Quickly adds 500ml water and reviews remaining hydration goal.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_high_protein_plan',
    title: 'Generate High-Protein Lean Bulk Plan',
    category: 'Health & Diet',
    prompt: 'Create a customized high-protein nutrition blueprint with ~2300 kcal/day and 150g+ protein using create_diet_plan. Focus on whole foods and high-satiety meals.',
    description: 'Generates a clean macro-balanced meal blueprint.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_fat_loss_deficit',
    title: 'Design 1800 kcal Fat Loss Diet Blueprint',
    category: 'Health & Diet',
    prompt: 'Generate an 1800 kcal fat loss diet plan with balanced macros (40% carbs, 30% protein, 30% healthy fats) and satisfying breakfast, lunch, and dinner options using create_diet_plan.',
    description: 'Creates a sustainable caloric deficit meal plan.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

    {
    id: 'p_health_custom_food_creator',
    title: 'Custom Food Creator',
    category: 'Health & Diet',
    prompt: 'I want to create a new Custom Food for my food library. Ask me for the food name and its macros (calories, protein, carbs, fats). If I do not know the exact macros, I will give you the food name and you can estimate the macros for me based on standard nutritional data. Once we have the data, use the create_custom_food tool to save it.',
    description: 'Interactive wizard to create and estimate macros for custom foods.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_diet_planner',
    title: 'Interactive Diet Planner',
    category: 'Health & Diet',
    prompt: 'Act as my personal Diet Planner. Start by asking me what kind of foods I want to eat for the day (e.g., Monday), or offer suggestions for breakfast, lunch, and dinner. Ask me a few questions to refine my meal preferences. Once we agree on a menu, use the create_diet_plan tool to generate the comprehensive diet plan.',
    description: 'Conversational assistant to build personalized daily diet plans.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_health_supplement_creation',
    title: 'Supplement Creator',
    category: 'Health & Diet',
    prompt: 'I want to add a new supplement (like a multivitamin or protein powder) to my daily tracker. Ask me the name of the supplement and try to fetch its exact nutritional label (macros and precise micronutrients like vitamins and minerals). Once confirmed, save it so my Vitamin & Mineral profile auto-syncs.',
    description: 'Wizard to cleanly configure and log exact vitamin and protein supplements.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 4. Wealth & Budgeting
  {
    id: 'p_wealth_log_expense',
    title: 'Quick Expense Logger',
    category: 'Wealth',
    prompt: 'Record an expense of ₹450 under category "Food" with note "Healthy lunch meal" using update_wealth_transaction.',
    description: 'Fast transaction logging into financial tracker.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_wealth_budget_triage',
    title: 'Set Monthly Category Budgets',
    category: 'Wealth',
    prompt: 'Update my monthly spending thresholds using update_wealth_budget: Food at ₹15,000, Shopping at ₹8,000, Bills at ₹10,000, and Other at ₹5,000.',
    description: 'Calibrates budget envelopes across all 4 expense categories.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_wealth_spending_audit',
    title: 'Analyze Monthly Spending & Outflows',
    category: 'Wealth',
    prompt: 'Review my recent transactions and expense history in my context window. Summarize my highest spending category and suggest 2 practical areas to curb impulse outlays.',
    description: 'Delivers actionable financial optimization insights.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 5. Journal & Mindset
  {
    id: 'p_journal_evening_reflection',
    title: 'Daily Stoic Evening Reflection',
    category: 'Journal',
    prompt: 'Create a structured evening journal reflection for today using create_journal_entry. Structure it into: 1) What went well today, 2) Where did I act with courage and discipline, 3) Lessons for tomorrow.',
    description: 'Saves an insightful evening review into the journal.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_journal_braindump',
    title: 'Mind Declutter & Brain Dump Distillation',
    category: 'Journal',
    prompt: 'I have multiple thoughts circling in my head right now. Help me untangle them, distill the signal from noise, and save a clean summary in my journal notes.',
    description: 'Clears mental fog and logs key realizations.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 6. Notifications & Alarms
  {
    id: 'p_notif_morning_kickoff',
    title: 'Setup Morning Kickoff Alarm (08:00 AM)',
    category: 'Notifications',
    prompt: 'Configure a daily morning alarm for my primary routine using configure_notification at 08:00 AM with message "Time to dominate the morning focus block!".',
    description: 'Schedules daily morning briefing and focus alarms.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p_notif_hydration_chime',
    title: 'Setup Midday Hydration Alert (14:30 PM)',
    category: 'Notifications',
    prompt: 'Configure a notification reminder at 14:30 for water intake with message "Hydrate! Drink a glass of water to maintain peak cognitive focus." using configure_notification.',
    description: 'Mid-afternoon alert to prevent dehydration fatigue.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const STORAGE_CUSTOM_PROMPTS_KEY = 'shadow_ai_custom_prompts_v1';

export function getCustomPrompts(): PromptTemplateItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PROMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load custom prompts:', e);
    return [];
  }
}

export function saveCustomPrompt(prompt: Omit<PromptTemplateItem, 'id' | 'createdAt' | 'isCustom'>): PromptTemplateItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomPrompts();
    const newPrompt: PromptTemplateItem = {
      ...prompt,
      id: 'cp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPrompt, ...existing];
    localStorage.setItem(STORAGE_CUSTOM_PROMPTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('shadow_ai_prompts_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to save custom prompt:', e);
    return [];
  }
}

export function deleteCustomPrompt(id: string): PromptTemplateItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomPrompts();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_CUSTOM_PROMPTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('shadow_ai_prompts_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to delete custom prompt:', e);
    return [];
  }
}

export function getAllPrompts(): PromptTemplateItem[] {
  const custom = getCustomPrompts();
  return [...custom, ...BUILTIN_PROMPTS];
}
