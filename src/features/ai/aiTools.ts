import { ToolDefinition, CustomToolDefinition } from './aiTypes';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { StandaloneTodo } from '@/features/todo/todoTypes';
import { getStoredTodos, saveStoredTodos, scheduleTodoNotification } from '@/features/todo/todoStorage';
import { saveCustomDietPlan, WeeklyDietPlan } from '@/features/health/dietPlansData';
import { fetchLiveTimeWithFallback, resolveAiDueDate } from './aiTimeUtils';

export const BUILTIN_TOOL_DEFINITIONS: ToolDefinition[] = [
  // 1. Tasks
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new primary roadmap or daily task in the tracker.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Clear actionable title of the task.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority level.' },
          estimatedMinutes: { type: 'number', description: 'Estimated time in minutes (e.g. 25, 45, 90).' },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update properties of an existing task by its ID or title search.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID to update (or partial title if ID is unknown).' },
          title: { type: 'string', description: 'New title.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Updated priority.' },
          dueDate: { type: 'string', description: 'Updated due date in YYYY-MM-DD.' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'ID or matching title of the task to mark completed.' },
        },
        required: ['taskId'],
      },
    },
  },

  // 2. Standalone ToDos
  {
    type: 'function',
    function: {
      name: 'create_todo',
      description: 'Add a new fast standalone checklist item / ToDo.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'ToDo item text.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level.' },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format.' },
          notes: { type: 'string', description: 'Extra details or reminder notes.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_todo',
      description: 'Update an existing ToDo item.',
      parameters: {
        type: 'object',
        properties: {
          todoId: { type: 'string', description: 'ToDo ID or matching title.' },
          title: { type: 'string', description: 'Updated title.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Updated priority.' },
          notes: { type: 'string', description: 'Updated notes.' },
        },
        required: ['todoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_todo',
      description: 'Mark a standalone ToDo item as checked and completed.',
      parameters: {
        type: 'object',
        properties: {
          todoId: { type: 'string', description: 'ToDo ID or matching title.' },
        },
        required: ['todoId'],
      },
    },
  },

  // 3. Habits & Routines
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Create a new daily or weekly habit routine.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the habit (e.g. "Morning Meditation", "Read 20 pages").' },
          frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'Frequency of habit.' },
          targetDaysPerWeek: { type: 'number', description: 'Target times per week (1-7).' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_habit',
      description: 'Update an existing habit routine.',
      parameters: {
        type: 'object',
        properties: {
          habitId: { type: 'string', description: 'Habit ID or exact habit name.' },
          name: { type: 'string', description: 'New habit name.' },
          frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'Updated frequency.' },
        },
        required: ['habitId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_habit_completion',
      description: 'Log completion of a habit for today or a specific date, boosting streak.',
      parameters: {
        type: 'object',
        properties: {
          habitId: { type: 'string', description: 'Habit ID or name to complete.' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today).' },
        },
        required: ['habitId'],
      },
    },
  },

  // 4. Health & Diet
  {
    type: 'function',
    function: {
      name: 'create_diet_plan',
      description: 'Create a customized weekly meal and nutrition plan.',
      parameters: {
        type: 'object',
        properties: {
          planName: { type: 'string', description: 'Name of the diet plan (e.g. "High Protein Lean Bulk", "Keto Focus").' },
          goal: { type: 'string', enum: ['fat_loss', 'muscle_gain', 'maintenance'], description: 'Nutrition goal.' },
          dailyCalories: { type: 'number', description: 'Estimated target daily calories (e.g. 2100).' },
          description: { type: 'string', description: 'Short overview of the plan.' },
        },
        required: ['planName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_water_intake',
      description: 'Log hydration and water intake in milliliters (ml) for today.',
      parameters: {
        type: 'object',
        properties: {
          amountMl: { type: 'number', description: 'Amount of water in ml (e.g. 250, 500, 1000).' },
        },
        required: ['amountMl'],
      },
    },
  },

  // 5. Wealth & Budgeting
  {
    type: 'function',
    function: {
      name: 'update_wealth_transaction',
      description: 'Record an expense or financial transaction into wealth tracking.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Transaction amount in currency units.' },
          category: { type: 'string', enum: ['Shopping', 'Food', 'Bills', 'Other'], description: 'Category.' },
          note: { type: 'string', description: 'Description or item note (e.g. "Groceries", "Cloud Server bill").' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD (defaults to today).' },
        },
        required: ['amount', 'category', 'note'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_wealth_budget',
      description: 'Update the monthly budget limit for a specific category.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['Shopping', 'Food', 'Bills', 'Other'], description: 'Category.' },
          monthlyLimit: { type: 'number', description: 'New monthly budget threshold.' },
        },
        required: ['category', 'monthlyLimit'],
      },
    },
  },

  // 6. Journal & Notes
  {
    type: 'function',
    function: {
      name: 'create_journal_entry',
      description: 'Save a reflective journal entry or daily log note.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Journal heading.' },
          content: { type: 'string', description: 'Thoughtful reflections, lessons learned, or brain dump.' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today).' },
        },
        required: ['content'],
      },
    },
  },

  // 7. Notification & Alarms Configuration (Tasks, Habits, ToDos, General)
  {
    type: 'function',
    function: {
      name: 'configure_notification',
      description: 'Configure, schedule, and enable alarms or reminder notifications for tasks, habits, standalone ToDos, or general lifestyle alerts.',
      parameters: {
        type: 'object',
        properties: {
          targetType: { 
            type: 'string', 
            enum: ['task', 'habit', 'todo', 'general'], 
            description: 'Item category to set alarm/reminder for.' 
          },
          targetTitle: { 
            type: 'string', 
            description: 'Title or name of the task, habit, or todo.' 
          },
          targetId: { 
            type: 'string', 
            description: 'Optional exact ID of the item if known.' 
          },
          time: { 
            type: 'string', 
            description: 'Alert time in 24-hr format HH:MM (e.g. "08:30", "14:15", "21:00").' 
          },
          days: { 
            type: 'string', 
            description: 'Recurrence: "daily", "weekdays", "weekends", or comma-separated days (0=Sun, 1=Mon, etc.).' 
          },
          message: { 
            type: 'string', 
            description: 'Custom alert message or motivation prompt.' 
          },
          enabled: { 
            type: 'boolean', 
            description: 'Whether reminder is active (defaults to true).' 
          },
        },
        required: ['targetType', 'time'],
      },
    },
  },

  // 8. Web Search (Live Multi-Engine Search)
  {
    type: 'function',
    function: {
      name: 'web_search_query',
      description: 'Search the live web for verified facts, current news, dates/time, people, places, nutrition, or productivity science.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string.' },
        },
        required: ['query'],
      },
    },
  },
];

export const AI_TOOL_DEFINITIONS = BUILTIN_TOOL_DEFINITIONS;

export const STORAGE_CUSTOM_TOOLS_KEY = 'shadow_ai_custom_tools_v1';

export function getCustomTools(): CustomToolDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load custom tools:', e);
    return [];
  }
}

export function saveCustomTool(tool: Omit<CustomToolDefinition, 'id' | 'createdAt'>): CustomToolDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomTools();
    const newTool: CustomToolDefinition = {
      ...tool,
      id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTool, ...existing.filter(t => t.name !== tool.name)];
    localStorage.setItem(STORAGE_CUSTOM_TOOLS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('shadow_ai_tools_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to save custom tool:', e);
    return [];
  }
}

export function deleteCustomTool(id: string): CustomToolDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomTools();
    const updated = existing.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_CUSTOM_TOOLS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('shadow_ai_tools_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to delete custom tool:', e);
    return [];
  }
}

export function getAllActiveToolDefinitions(): ToolDefinition[] {
  const custom = getCustomTools();
  const customFormatted: ToolDefinition[] = custom.map(ct => ({
    type: 'function',
    function: {
      name: ct.name,
      description: `[Custom Tool] ${ct.description}`,
      parameters: ct.parameters,
    },
  }));
  return [...BUILTIN_TOOL_DEFINITIONS, ...customFormatted];
}

export interface ToolExecutionOutput {
  toolName: string;
  actionSummary: string;
  success: boolean;
  resultData?: unknown;
}

export async function executeAiToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<ToolExecutionOutput> {
  const store = useShadowTrackerStore.getState();
  const today = getTodayDateString();

  try {
    switch (name) {
      // 1. Tasks
      case 'create_task': {
        const title = String(args.title || 'New Task');
        const rawPriority = args.priority as string;
        const priority: 'low' | 'medium' | 'high' = 
          rawPriority === 'urgent' || rawPriority === 'high' ? 'high' : 
          rawPriority === 'low' ? 'low' : 'medium';
        const estimatedMinutes = Number(args.estimatedMinutes) || 30;
        const dueDate = resolveAiDueDate(args.dueDate as string);
        const defaultCatId = store.categories[0]?.id || 'cat-general';

        const created = await store.addTask({
          title,
          categoryId: defaultCatId,
          priority,
          estimatedMinutes,
          dueDate,
          isCompleted: false,
          isRecurring: false,
          recurrencePattern: null,
        });

        return {
          toolName: name,
          actionSummary: `Task Created: "${title}" (Priority: ${priority.toUpperCase()})`,
          success: true,
          resultData: { id: created.id, title, priority, dueDate },
        };
      }

      case 'update_task': {
        const target = String(args.taskId || '').toLowerCase();
        const task = store.tasks.find(
          t => t.id === target || t.title.toLowerCase().includes(target)
        );
        if (!task) {
          return { toolName: name, actionSummary: `Task not found for "${target}"`, success: false };
        }

        const updates: Record<string, unknown> = {};
        if (args.title) updates.title = String(args.title);
        if (args.priority) updates.priority = args.priority;
        if (args.dueDate) updates.dueDate = String(args.dueDate);

        await store.updateTask(task.id, updates);
        return {
          toolName: name,
          actionSummary: `Task Updated: "${updates.title || task.title}"`,
          success: true,
          resultData: { id: task.id, updates },
        };
      }

      case 'complete_task': {
        const target = String(args.taskId || '').toLowerCase();
        const task = store.tasks.find(
          t => t.id === target || t.title.toLowerCase().includes(target)
        );
        if (!task) {
          return { toolName: name, actionSummary: `Task not found for "${target}"`, success: false };
        }
        if (!task.isCompleted) {
          await store.toggleTaskCompletion(task.id);
        }
        return {
          toolName: name,
          actionSummary: `Task Completed: "${task.title}"`,
          success: true,
          resultData: { id: task.id, isCompleted: true },
        };
      }

      // 2. Standalone ToDos
      case 'create_todo': {
        const title = String(args.title || 'New ToDo');
        const priority = (args.priority as 'low' | 'medium' | 'high') || 'medium';
        const dueDate = resolveAiDueDate(args.dueDate as string);
        const notes = args.notes ? String(args.notes) : '';

        const newTodo: StandaloneTodo = {
          id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          title,
          description: notes,
          priority,
          dueDate,
          dueTime: '',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: [],
          reminderTime: '',
          isRecurring: false,
          recurrencePattern: 'daily',
          customDays: [1, 2, 3, 4, 5],
        };

        const existing = getStoredTodos();
        const updated = [newTodo, ...existing];
        saveStoredTodos(updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_todos_updated'));
        }

        return {
          toolName: name,
          actionSummary: `ToDo Created: "${title}" (Priority: ${priority.toUpperCase()})`,
          success: true,
          resultData: { id: newTodo.id, title },
        };
      }

      case 'update_todo': {
        const target = String(args.todoId || '').toLowerCase();
        const todos = getStoredTodos();
        const index = todos.findIndex(t => t.id === target || t.title.toLowerCase().includes(target));
        if (index === -1) {
          return { toolName: name, actionSummary: `ToDo not found for "${target}"`, success: false };
        }

        const current = todos[index];
        const updatedTodo: StandaloneTodo = {
          ...current,
          title: args.title ? String(args.title) : current.title,
          priority: (args.priority as 'low' | 'medium' | 'high') || current.priority,
          description: args.notes !== undefined ? String(args.notes) : current.description,
          updatedAt: new Date().toISOString(),
        };

        todos[index] = updatedTodo;
        saveStoredTodos(todos);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_todos_updated'));
        }

        return {
          toolName: name,
          actionSummary: `ToDo Updated: "${updatedTodo.title}"`,
          success: true,
          resultData: { id: updatedTodo.id },
        };
      }

      case 'complete_todo': {
        const target = String(args.todoId || '').toLowerCase();
        const todos = getStoredTodos();
        const index = todos.findIndex(t => t.id === target || t.title.toLowerCase().includes(target));
        if (index === -1) {
          return { toolName: name, actionSummary: `ToDo not found for "${target}"`, success: false };
        }

        todos[index] = { ...todos[index], isCompleted: true, updatedAt: new Date().toISOString() };
        saveStoredTodos(todos);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_todos_updated'));
        }

        return {
          toolName: name,
          actionSummary: `ToDo Completed: "${todos[index].title}"`,
          success: true,
          resultData: { id: todos[index].id, isCompleted: true },
        };
      }

      // 3. Habits
      case 'create_habit': {
        const habitName = String(args.name || 'New Habit');
        const frequency = (args.frequency as 'daily' | 'weekly') || 'daily';
        const defaultCatId = store.categories[0]?.id || 'cat-general';

        const created = await store.addHabit({
          name: habitName,
          categoryId: defaultCatId,
          frequency: frequency === 'weekly' ? 'weekly' : 'daily',
          customDays: frequency === 'weekly' ? [1, 3, 5] : undefined,
        });

        return {
          toolName: name,
          actionSummary: `Habit Created: "${habitName}" (${frequency})`,
          success: true,
          resultData: { id: created.id, name: habitName },
        };
      }

      case 'update_habit': {
        const target = String(args.habitId || '').toLowerCase();
        const habit = store.habits.find(
          h => h.id === target || h.name.toLowerCase().includes(target)
        );
        if (!habit) {
          return { toolName: name, actionSummary: `Habit not found for "${target}"`, success: false };
        }

        const updates: Record<string, unknown> = {};
        if (args.name) updates.name = String(args.name);
        if (args.frequency) updates.frequency = args.frequency;

        await store.updateHabit(habit.id, updates);
        return {
          toolName: name,
          actionSummary: `Habit Updated: "${updates.name || habit.name}"`,
          success: true,
          resultData: { id: habit.id, updates },
        };
      }

      case 'log_habit_completion': {
        const target = String(args.habitId || '').toLowerCase();
        const habit = store.habits.find(
          h => h.id === target || h.name.toLowerCase().includes(target)
        );
        if (!habit) {
          return { toolName: name, actionSummary: `Habit not found for "${target}"`, success: false };
        }

        const date = String(args.date || today);
        const isDone = (habit.completedDates || []).includes(date);
        if (!isDone) {
          await store.toggleHabitCompletion(habit.id, date);
        }

        return {
          toolName: name,
          actionSummary: `Habit Completed for ${date}: "${habit.name}" (Streak: ${habit.streakCount + (isDone ? 0 : 1)})`,
          success: true,
          resultData: { id: habit.id, date },
        };
      }

      // 4. Health & Diet
      case 'create_diet_plan': {
        const planName = String(args.planName || 'Custom Diet Plan');
        const goal = (args.goal as 'fat_loss' | 'muscle_gain' | 'maintenance') || 'maintenance';
        const calories = Number(args.dailyCalories) || 2000;
        const description = String(args.description || `AI-designed ${goal.replace('_', ' ')} nutrition blueprint`);

        const newDiet: WeeklyDietPlan = {
          id: 'custom_diet_' + Date.now(),
          name: planName,
          tagline: description,
          locality: 'custom',
          localityLabel: 'Custom',
          targetWeightLossRate: '0.5 kg / week',
          weeklyLossKg: 0.5,
          avgDailyCalories: calories,
          avgDailyProtein: Math.round((calories * 0.3) / 4),
          avgDailyCarbs: Math.round((calories * 0.4) / 4),
          avgDailyFats: Math.round((calories * 0.3) / 9),
          dietType: 'Veg',
          icon: 'Salad',
          colorClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/30',
          isCustom: true,
          days: [
            {
              dayName: 'Everyday Blueprint',
              focus: goal,
              totalCalories: calories,
              totalProtein: Math.round((calories * 0.3) / 4),
              totalCarbs: Math.round((calories * 0.4) / 4),
              totalFats: Math.round((calories * 0.3) / 9),
              meals: [
                {
                  mealType: 'breakfast',
                  name: 'Power Breakfast',
                  items: ['Oatmeal with Almonds & Banana', 'Whey Protein Shake or 3 Boiled Eggs'],
                  portion: '1 bowl + shake',
                  calories: Math.round(calories * 0.28),
                  protein: Math.round((calories * 0.28 * 0.3) / 4),
                  carbs: Math.round((calories * 0.28 * 0.45) / 4),
                  fats: Math.round((calories * 0.28 * 0.25) / 9),
                  icon: 'Sunrise',
                },
                {
                  mealType: 'lunch',
                  name: 'Balanced Lunch',
                  items: ['Brown Rice or Rotis with Paneer / Grilled Chicken', 'Mixed Veg Salad with Greek Yogurt'],
                  portion: '1 plate',
                  calories: Math.round(calories * 0.38),
                  protein: Math.round((calories * 0.38 * 0.35) / 4),
                  carbs: Math.round((calories * 0.38 * 0.4) / 4),
                  fats: Math.round((calories * 0.38 * 0.25) / 9),
                  icon: 'Utensils',
                },
                {
                  mealType: 'dinner',
                  name: 'Recovery Dinner',
                  items: ['Tofu / Fish Stir-fry with Broccoli & Bell Peppers', 'Warm Lentil Soup (Dal)'],
                  portion: '1 bowl',
                  calories: Math.round(calories * 0.34),
                  protein: Math.round((calories * 0.34 * 0.35) / 4),
                  carbs: Math.round((calories * 0.34 * 0.35) / 4),
                  fats: Math.round((calories * 0.34 * 0.3) / 9),
                  icon: 'Moon',
                },
              ],
            },
          ],
        };

        saveCustomDietPlan(newDiet);
        return {
          toolName: name,
          actionSummary: `Diet Plan Created: "${planName}" (~${calories} kcal/day)`,
          success: true,
          resultData: { id: newDiet.id, name: planName, calories },
        };
      }

      case 'log_water_intake': {
        const amountMl = Number(args.amountMl) || 250;
        const key = 'shadow_health_data_v2';
        const raw = localStorage.getItem(key) || '{}';
        const healthMap = JSON.parse(raw);
        const dayRecord = healthMap[today] || {
          date: today,
          waterIntakeMl: 0,
          waterGoalMl: 3000,
          hydrationLogs: [],
          sleepHours: 0,
          sleepGoalHours: 8,
          workouts: [],
          loggedFoods: [],
        };

        dayRecord.waterIntakeMl = (dayRecord.waterIntakeMl || 0) + amountMl;
        dayRecord.hydrationLogs = [
          ...(dayRecord.hydrationLogs || []),
          {
            id: 'water_' + Date.now(),
            amount: amountMl,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];

        healthMap[today] = dayRecord;
        localStorage.setItem(key, JSON.stringify(healthMap));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_health_updated'));
        }

        return {
          toolName: name,
          actionSummary: `Hydration Logged: +${amountMl}ml (Today's Total: ${dayRecord.waterIntakeMl}ml)`,
          success: true,
          resultData: { amountMl, totalToday: dayRecord.waterIntakeMl },
        };
      }

      // 5. Wealth
      case 'update_wealth_transaction': {
        const amount = Number(args.amount) || 0;
        const category = String(args.category || 'Other');
        const note = String(args.note || 'Expense');
        const date = String(args.date || today);

        const expKey = 'shadow_money_expenses_v4';
        const raw = localStorage.getItem(expKey) || '[]';
        const expenses = JSON.parse(raw);
        const newExp = {
          id: 'exp_' + Date.now(),
          date,
          amount,
          category,
          note,
        };

        expenses.unshift(newExp);
        localStorage.setItem(expKey, JSON.stringify(expenses));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_wealth_updated'));
        }

        return {
          toolName: name,
          actionSummary: `Wealth Transaction Logged: ${amount} [${category}] - "${note}"`,
          success: true,
          resultData: newExp,
        };
      }

      case 'update_wealth_budget': {
        const category = String(args.category || 'Other');
        const monthlyLimit = Number(args.monthlyLimit) || 0;

        const budgetKey = 'shadow_money_category_budgets';
        const raw = localStorage.getItem(budgetKey) || '{}';
        const budgets = JSON.parse(raw);
        budgets[category] = monthlyLimit;
        localStorage.setItem(budgetKey, JSON.stringify(budgets));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shadow_wealth_updated'));
        }

        return {
          toolName: name,
          actionSummary: `Budget Updated: ${category} set to ${monthlyLimit}/month`,
          success: true,
          resultData: { category, monthlyLimit },
        };
      }

      // 6. Journal
      case 'create_journal_entry': {
        const title = args.title ? String(args.title) : 'Daily Reflection';
        const content = String(args.content || '');
        const date = String(args.date || today);

        await store.saveNote(date, content, title);
        return {
          toolName: name,
          actionSummary: `Journal Entry Saved for ${date}: "${title}"`,
          success: true,
          resultData: { date, title },
        };
      }

      // 7. Notification & Alarms Configuration (Tasks, Habits, ToDos, General)
      case 'configure_notification': {
        const targetType = (args.targetType as 'task' | 'habit' | 'todo' | 'general') || 'general';
        const time = String(args.time || '09:00');
        const targetTitle = args.targetTitle ? String(args.targetTitle) : '';
        const targetId = args.targetId ? String(args.targetId) : '';
        const message = args.message ? String(args.message) : '';

        // Recurrence days calculation
        let days = [0, 1, 2, 3, 4, 5, 6];
        if (args.days === 'weekdays') days = [1, 2, 3, 4, 5];
        if (args.days === 'weekends') days = [0, 6];

        if (targetType === 'task') {
          const task = store.tasks.find(t => 
            (targetId && t.id === targetId) || 
            (targetTitle && t.title.toLowerCase().includes(targetTitle.toLowerCase()))
          );
          if (!task) {
            return {
              toolName: name,
              actionSummary: `Task not found for notification target "${targetTitle || targetId}"`,
              success: false,
            };
          }

          await store.updateTask(task.id, {
            scheduledTime: time,
            notifyOnStart: true,
          });

          await store.addReminder({
            title: `Task Reminder: ${task.title}`,
            time,
            days,
            isEnabled: true,
            type: 'task',
            reminderType: 'task_start',
            taskId: task.id,
          });

          return {
            toolName: name,
            actionSummary: `Notification Configured: Alarm set for Task "${task.title}" at ${time} daily`,
            success: true,
            resultData: { targetType, taskId: task.id, time },
          };
        }

        if (targetType === 'habit') {
          const habit = store.habits.find(h => 
            (targetId && h.id === targetId) || 
            (targetTitle && h.name.toLowerCase().includes(targetTitle.toLowerCase()))
          );
          if (!habit) {
            return {
              toolName: name,
              actionSummary: `Habit not found for notification target "${targetTitle || targetId}"`,
              success: false,
            };
          }

          await store.addReminder({
            title: `Habit Routine: ${habit.name}`,
            time,
            days: habit.customDays || days,
            isEnabled: true,
            type: 'habit',
            reminderType: 'habit',
            habitId: habit.id,
          });

          return {
            toolName: name,
            actionSummary: `Notification Configured: Routine alert for Habit "${habit.name}" at ${time}`,
            success: true,
            resultData: { targetType, habitId: habit.id, time },
          };
        }

        if (targetType === 'todo') {
          const todos = getStoredTodos();
          const todo = todos.find(t => 
            (targetId && t.id === targetId) || 
            (targetTitle && t.title.toLowerCase().includes(targetTitle.toLowerCase()))
          );
          if (!todo) {
            return {
              toolName: name,
              actionSummary: `ToDo not found for notification target "${targetTitle || targetId}"`,
              success: false,
            };
          }

          // Build ISO date for today or tomorrow at the specified time
          const [hStr, mStr] = time.split(':');
          const reminderDate = new Date();
          reminderDate.setHours(Number(hStr) || 9, Number(mStr) || 0, 0, 0);
          if (reminderDate.getTime() <= Date.now()) {
            reminderDate.setDate(reminderDate.getDate() + 1);
          }

          todo.dueTime = time;
          todo.reminderTime = reminderDate.toISOString();
          await scheduleTodoNotification(todo);

          saveStoredTodos(todos);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow_todos_updated'));
          }

          return {
            toolName: name,
            actionSummary: `Notification Configured: Standalone ToDo reminder set for "${todo.title}" at ${time}`,
            success: true,
            resultData: { targetType, todoId: todo.id, time },
          };
        }

        // General Reminder
        const reminderTitle = message || targetTitle || 'Shadow Tracker Focus Alert';
        await store.addReminder({
          title: reminderTitle,
          time,
          days,
          isEnabled: true,
          reminderType: 'general',
        });

        return {
          toolName: name,
          actionSummary: `Notification Configured: General Alert "${reminderTitle}" set at ${time}`,
          success: true,
          resultData: { targetType: 'general', title: reminderTitle, time },
        };
      }

      // 8. Web Search (Live Multi-Engine Search)
      case 'web_search_query': {
        const query = String(args.query || '').trim();
        const timeInfo = await fetchLiveTimeWithFallback();
        const isTimeQuery = /\b(time|date|today|tomorrow|current year|what day|clock|timezone)\b/i.test(query);

        let wikiHits: Array<{ title: string; snippet: string }> = [];
        let topSummary = '';
        let ddgSummary = '';

        try {
          // 1. Parallel search: Wikipedia OpenSearch & DuckDuckGo Instant Answer
          const wikiSearchPromise = (async () => {
            try {
              const controller = new AbortController();
              const tid = setTimeout(() => controller.abort(), 3500);
              const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
              const res = await fetch(searchUrl, { signal: controller.signal });
              clearTimeout(tid);
              if (res.ok) {
                const data = await res.json();
                return (data?.query?.search || []).slice(0, 3).map((h: any) => ({
                  title: String(h.title || ''),
                  snippet: String(h.snippet || '').replace(/<[^>]+>/g, '').trim(),
                }));
              }
            } catch {
              // Silently handle network errors
            }
            return [];
          })();

          const ddgPromise = (async () => {
            try {
              const controller = new AbortController();
              const tid = setTimeout(() => controller.abort(), 2500);
              const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
              const res = await fetch(ddgUrl, { signal: controller.signal });
              clearTimeout(tid);
              if (res.ok) {
                const data = await res.json();
                if (data.AbstractText) return String(data.AbstractText);
                if (data.Answer) return String(data.Answer);
                if (data.Definition) return String(data.Definition);
              }
            } catch {
              // Silently handle network errors
            }
            return '';
          })();

          const [hits, ddg] = await Promise.all([wikiSearchPromise, ddgPromise]);
          wikiHits = hits;
          ddgSummary = ddg;

          // 2. Fetch full summary extract for top Wikipedia result
          if (wikiHits.length > 0 && wikiHits[0].title) {
            try {
              const controller = new AbortController();
              const tid = setTimeout(() => controller.abort(), 2500);
              const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiHits[0].title)}`;
              const sRes = await fetch(summaryUrl, { signal: controller.signal });
              clearTimeout(tid);
              if (sRes.ok) {
                const sData = await sRes.json();
                topSummary = sData.extract || '';
              }
            } catch {
              // Silently handle summary fetch error
            }
          }
        } catch (searchErr) {
          console.warn('Web search fetch error:', searchErr);
        }

        const bestSummary = topSummary || ddgSummary || (wikiHits[0]?.snippet ? `Key excerpt: ${wikiHits[0].snippet}` : '');

        const searchOutput: Record<string, unknown> = {
          query,
          temporalReference: {
            currentDate: timeInfo.currentDate,
            currentTime: timeInfo.currentTime,
            currentDay: timeInfo.currentDay,
            timezone: timeInfo.timeZone,
            source: timeInfo.source,
          },
        };

        if (bestSummary) {
          searchOutput.summary = bestSummary;
        }
        if (wikiHits.length > 0) {
          searchOutput.sources = wikiHits.map(h => ({ title: h.title, snippet: h.snippet }));
        }

        if (!bestSummary && wikiHits.length === 0) {
          searchOutput.note = isTimeQuery
            ? `Live system temporal clock provided. Current date is ${timeInfo.currentDate}, time is ${timeInfo.currentTime}.`
            : `Web search could not retrieve external results for "${query}". System date & time confirmed as ${timeInfo.currentDate} (${timeInfo.currentTime}).`;
        }

        return {
          toolName: name,
          actionSummary: `Web Knowledge Queried: "${query}"`,
          success: true,
          resultData: searchOutput,
        };
      }

      // 9. Custom User-Defined Tools
      default: {
        const customTools = getCustomTools();
        const matched = customTools.find(ct => ct.name === name);
        if (matched) {
          if (matched.actionType === 'custom_event') {
            const eventName = matched.actionConfig?.eventName || `shadow_custom_${matched.name}`;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent(eventName, { detail: args }));
            }
            return {
              toolName: name,
              actionSummary: `Custom Event Triggered: "${eventName}"`,
              success: true,
              resultData: args,
            };
          }

          if (matched.actionType === 'webhook' && matched.actionConfig?.webhookUrl) {
            try {
              const res = await fetch(matched.actionConfig.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args),
              });
              const text = await res.text();
              return {
                toolName: name,
                actionSummary: `Webhook executed (${res.status})`,
                success: res.ok,
                resultData: text,
              };
            } catch (err: unknown) {
              return {
                toolName: name,
                actionSummary: `Webhook call failed: ${err instanceof Error ? err.message : String(err)}`,
                success: false,
              };
            }
          }

          // prompt_injection or default return template
          const outputTemplate = matched.actionConfig?.returnTemplate || `Custom tool ${name} executed successfully with arguments: ${JSON.stringify(args)}`;
          return {
            toolName: name,
            actionSummary: `Custom Tool Executed: ${name}`,
            success: true,
            resultData: outputTemplate,
          };
        }

        return {
          toolName: name,
          actionSummary: `Unknown tool "${name}"`,
          success: false,
        };
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      toolName: name,
      actionSummary: `Failed to execute ${name}: ${errorMsg}`,
      success: false,
    };
  }
}
