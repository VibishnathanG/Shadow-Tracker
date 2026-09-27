import { ToolDefinition, CustomToolDefinition } from './aiTypes';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { StandaloneTodo } from '@/features/todo/todoTypes';
import { getStoredTodos, saveStoredTodos, scheduleTodoNotification } from '@/features/todo/todoStorage';
import { saveCustomDietPlan, WeeklyDietPlan } from '@/features/health/dietPlansData';
import { saveCustomFoodToLibrary, saveQuickSuggestion, detectEmojiFromDishName, FoodItem } from '@/features/health/indianFoodDatabase';
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

  // 4. Health, Nutrition & Fitness Skills
  {
    type: 'function',
    function: {
      name: 'log_supplement',
      description: 'Log and track a nutritional supplement (multivitamin, whey protein, creatine, omega-3, vitamin D3, zinc, magnesium, etc.) with dosage, macros, and precise micronutrient profile into the user\'s daily health tracker.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the supplement (e.g. "Centrum Multivitamin", "Optimum Nutrition Gold Standard Whey", "Creatine Monohydrate", "Omega-3 Fish Oil", "Vitamin D3 2000IU", "Zinc Picolinate", "Magnesium Glycinate").' },
          category: {
            type: 'string',
            enum: ['multivitamin', 'protein', 'creatine', 'omega3', 'vitamin_d', 'minerals', 'pre_workout', 'other'],
            description: 'Category classification of the supplement.'
          },
          servingSize: { type: 'string', description: 'Serving dosage (e.g. "1 tablet", "1 scoop (30g)", "2 capsules", "5g powder").' },
          standardGrams: { type: 'number', description: 'Serving size in grams (e.g. 30 for protein scoop, 5 for creatine).' },
          calories: { type: 'number', description: 'Total calories in kcal (e.g. 120 for protein, 0 for tablets).' },
          protein: { type: 'number', description: 'Protein content in grams.' },
          carbs: { type: 'number', description: 'Carbohydrates in grams.' },
          fats: { type: 'number', description: 'Fats in grams.' },
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Meal slot when the supplement is taken (defaults to "snack" or "breakfast").'
          },
          date: { type: 'string', description: 'Target date in YYYY-MM-DD format (defaults to today).' },
          vitaminsMinerals: {
            type: 'object',
            description: 'Precise vitamins & minerals dosages supplied by this supplement.',
            properties: {
              vit_c: { type: 'number', description: 'Vitamin C in mg' },
              vit_d: { type: 'number', description: 'Vitamin D in mcg' },
              vit_b12: { type: 'number', description: 'Vitamin B12 in mcg' },
              vit_a: { type: 'number', description: 'Vitamin A in mcg' },
              vit_e: { type: 'number', description: 'Vitamin E in mg' },
              vit_b6: { type: 'number', description: 'Vitamin B6 in mg' },
              min_iron: { type: 'number', description: 'Iron in mg' },
              min_calcium: { type: 'number', description: 'Calcium in mg' },
              min_magnesium: { type: 'number', description: 'Magnesium in mg' },
              min_zinc: { type: 'number', description: 'Zinc in mg' },
              min_potassium: { type: 'number', description: 'Potassium in mg' },
            }
          },
          saveAsPreset: { type: 'boolean', description: 'Whether to save as a reusable quick preset in the supplement modal.' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_workout',
      description: 'Log a specific workout session (running, cycling, swimming, jogging, cardio, full body HIIT, or strength/lifting) with adaptive metrics (distance, duration, pace, calories, or sets/reps/weight).',
      parameters: {
        type: 'object',
        properties: {
          workoutName: { type: 'string', description: 'Name of the workout or exercise (e.g. "Morning 5K Run", "Cycling", "Swimming Laps", "30 Mins Full Body Cardio", "Barbell Bench Press").' },
          category: {
            type: 'string',
            enum: ['running', 'cycling', 'swimming', 'jogging', 'cardio', 'full_body', 'strength', 'other'],
            description: 'Type of workout.'
          },
          durationMinutes: { type: 'number', description: 'Duration of workout in minutes (e.g. 30, 45, 60).' },
          distanceKm: { type: 'number', description: 'Distance covered in kilometers (for running, cycling, swimming, jogging).' },
          pace: { type: 'string', description: 'Pace or speed (e.g. "5:30 min/km", "25 km/h").' },
          caloriesBurned: { type: 'number', description: 'Estimated calories burned in kcal.' },
          sets: { type: 'number', description: 'Number of sets (for strength / lifting).' },
          reps: { type: 'number', description: 'Reps per set (for strength / lifting).' },
          weightKg: { type: 'number', description: 'Weight used in kg (for strength / lifting).' },
          notes: { type: 'string', description: 'Technique cues, route notes, or heart rate.' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today).' },
        },
        required: ['workoutName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_custom_food',
      description: 'Create and permanently save a new custom food dish with calories and macronutrients into the user\'s Food Library.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the dish or food (e.g. "Keerai Dal Poriyal", "Grilled Chicken Breast", "Protein Smoothie").' },
          category: {
            type: 'string',
            enum: ['breakfast', 'main', 'protein', 'snack', 'sweet', 'south', 'foreign'],
            description: 'Food category classification.'
          },
          serving: { type: 'string', description: 'Serving description (e.g. "1 bowl (150g)", "2 rotis (60g)", "1 glass (250ml)").' },
          standardGrams: { type: 'number', description: 'Standard portion size in grams (e.g. 100, 150, 200).' },
          calories: { type: 'number', description: 'Total calories in kcal for the standard portion.' },
          protein: { type: 'number', description: 'Protein content in grams.' },
          carbs: { type: 'number', description: 'Carbohydrates in grams.' },
          fats: { type: 'number', description: 'Fats in grams.' },
          icon: { type: 'string', description: 'Single emoji representing the food (e.g. 🥗, 🍗, 🍛, 🥞, 🥛).' },
          vitaminsMinerals: {
            type: 'object',
            description: 'Micronutrient values if known (vit_c, vit_d, iron, calcium, etc.).',
          },
          saveToQuickSuggestions: { type: 'boolean', description: 'Whether to also pin this to Quick Suggestion chips.' },
          logTodayMeal: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack', 'none'],
            description: 'Optional: immediately log this food into today\'s meal slot.'
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_diet_plan',
      description: 'Create a comprehensive personalized 7-day per week meal and nutrition plan with complete daily breakfast, lunch, dinner, and snack breakdowns.',
      parameters: {
        type: 'object',
        properties: {
          planName: { type: 'string', description: 'Name of the diet plan (e.g. "High Protein Lean Bulk", "Keto Focus", "Vegetarian Fat Shred").' },
          goal: { type: 'string', enum: ['fat_loss', 'muscle_gain', 'maintenance'], description: 'Nutrition goal.' },
          dietType: { type: 'string', enum: ['Veg', 'Non-Veg', 'Eggetarian', 'Keto', 'High Protein'], description: 'Dietary preference style.' },
          dailyCalories: { type: 'number', description: 'Estimated target daily calories (e.g. 2100).' },
          description: { type: 'string', description: 'Detailed overview and nutrition methodology of the plan.' },
          days: {
            type: 'array',
            description: 'Extensive 7-day meal plan array (Monday through Sunday) with breakfast, lunch, dinner, and snack options.',
            items: {
              type: 'object',
              properties: {
                dayName: { type: 'string', description: 'Name of the day (e.g. "Monday • High Energy Carb Day", "Tuesday • Recovery Day", etc.)' },
                focus: { type: 'string', description: 'Focus of the day (e.g. "Upper Body Fuel", "Cardio Day", "Lean Fasting")' },
                totalCalories: { type: 'number' },
                totalProtein: { type: 'number' },
                totalCarbs: { type: 'number' },
                totalFats: { type: 'number' },
                meals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
                      name: { type: 'string' },
                      items: { type: 'array', items: { type: 'string' } },
                      portion: { type: 'string' },
                      calories: { type: 'number' },
                      protein: { type: 'number' },
                      carbs: { type: 'number' },
                      fats: { type: 'number' },
                      icon: { type: 'string' },
                    }
                  }
                }
              }
            }
          }
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

      // 4. Health, Nutrition & Fitness Skills
      case 'log_supplement': {
        const suppName = String(args.name || 'Daily Supplement').trim();
        const category = String(args.category || 'multivitamin');
        const serving = String(args.servingSize || '1 serving');
        const standardGrams = Number(args.standardGrams) || 30;
        const calories = Number(args.calories) || 0;
        const protein = Number(args.protein) || 0;
        const carbs = Number(args.carbs) || 0;
        const fats = Number(args.fats) || 0;
        const meal = (args.mealType as any) || 'snack';
        const targetDate = resolveAiDueDate(args.date as string) || today;
        const customMicros = (args.vitaminsMinerals as Record<string, number>) || {};

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const suppItem: any = {
          id: 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: suppName,
          serving,
          standardGrams,
          calories,
          protein,
          carbs,
          fats,
          meal,
          quantity: 1,
          icon: category === 'protein' ? '🥛' : category === 'omega3' ? '🐟' : '💊',
          time: timeStr,
          customMicros,
          isSupplement: true,
        };

        if (typeof window !== 'undefined') {
          const key = 'shadow_health_data_v2';
          const raw = localStorage.getItem(key) || '{}';
          const healthMap = JSON.parse(raw);
          const dayRecord = healthMap[targetDate] || {
            calorieGoal: 2000,
            waterIntakeMl: 0,
            waterGoalMl: 2500,
            sleepHours: 7,
            sleepGoalHours: 8,
            energyRating: 4,
            loggedFoods: [],
            workouts: [],
          };
          dayRecord.loggedFoods = [suppItem, ...(dayRecord.loggedFoods || [])];
          healthMap[targetDate] = dayRecord;
          localStorage.setItem(key, JSON.stringify(healthMap));

          // If saveAsPreset is set, persist into custom supplement presets
          if (args.saveAsPreset) {
            try {
              const presetKey = 'shadow_custom_supplements_v1';
              const existingPresets = JSON.parse(localStorage.getItem(presetKey) || '[]');
              const newPreset = {
                name: suppName,
                dose: serving,
                category,
                calories,
                protein,
                carbs,
                fats,
                emoji: suppItem.icon,
                micros: customMicros,
              };
              const filtered = existingPresets.filter((p: any) => p.name.toLowerCase() !== suppName.toLowerCase());
              localStorage.setItem(presetKey, JSON.stringify([newPreset, ...filtered]));
            } catch {}
          }

          window.dispatchEvent(new CustomEvent('shadow_health_updated'));
        }

        const microKeys = Object.keys(customMicros);
        const microSummary = microKeys.length > 0 
          ? ` • Micros Synced: ${microKeys.map(k => `${k}: ${customMicros[k]}`).join(', ')}`
          : '';

        return {
          toolName: name,
          actionSummary: `Logged Supplement: "${suppName}" (${serving}, ${protein}g protein, ${calories} kcal) for ${targetDate}${microSummary}`,
          success: true,
          resultData: suppItem,
        };
      }

      case 'log_workout': {
        const workoutName = String(args.workoutName || 'Workout Session').trim();
        const category = String(args.category || 'cardio');
        const duration = Number(args.durationMinutes) || 30;
        const distance = Number(args.distanceKm) || 0;
        const pace = String(args.pace || '');
        const calories = Number(args.caloriesBurned) || (duration * 8);
        const sets = Number(args.sets) || 0;
        const reps = Number(args.reps) || 0;
        const weight = Number(args.weightKg) || 0;
        const notes = String(args.notes || '');
        const targetDate = resolveAiDueDate(args.date as string) || today;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const workoutEntry: any = {
          id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          type: category,
          name: workoutName,
          duration,
          calories,
          intensity: 'high',
          distance: distance > 0 ? distance : undefined,
          pace: pace || undefined,
          sets: sets > 0 ? sets : undefined,
          reps: reps > 0 ? reps : undefined,
          weightKg: weight > 0 ? weight : undefined,
          notes: notes || (distance > 0 ? `${distance} km • ${pace}` : `${duration} mins`),
          time: timeStr,
        };

        if (typeof window !== 'undefined') {
          const key = 'shadow_health_data_v2';
          const raw = localStorage.getItem(key) || '{}';
          const healthMap = JSON.parse(raw);
          const dayRecord = healthMap[targetDate] || {
            calorieGoal: 2000,
            waterIntakeMl: 0,
            waterGoalMl: 2500,
            sleepHours: 7,
            sleepGoalHours: 8,
            energyRating: 4,
            loggedFoods: [],
            workouts: [],
          };
          dayRecord.workouts = [workoutEntry, ...(dayRecord.workouts || [])];
          healthMap[targetDate] = dayRecord;
          localStorage.setItem(key, JSON.stringify(healthMap));

          // Also save to shadow_logged_exercises_today if strength/lifting
          if (sets > 0 || weight > 0) {
            try {
              const onerm = Math.round(weight * (1 + (reps || 10) / 30) * 10) / 10;
              const saved = JSON.parse(localStorage.getItem('shadow_logged_exercises_today') || '[]');
              saved.unshift({
                id: workoutEntry.id,
                name: workoutName,
                muscle: 'Lifting',
                sets,
                reps: reps || 10,
                weightKg: weight,
                oneRepMax: onerm,
                time: timeStr,
              });
              localStorage.setItem('shadow_logged_exercises_today', JSON.stringify(saved));
            } catch {}
          }
          window.dispatchEvent(new CustomEvent('shadow_health_updated'));
        }

        return {
          toolName: name,
          actionSummary: `Logged Workout: "${workoutName}" (${duration} min, 🔥 ${calories} kcal) for ${targetDate}`,
          success: true,
          resultData: workoutEntry,
        };
      }

      case 'create_custom_food': {
        const foodName = String(args.name || '').trim();
        if (!foodName) {
          return {
            toolName: name,
            actionSummary: 'Failed to create food: missing name',
            success: false,
            resultData: 'Food name is required.',
          };
        }

        const grams = Number(args.standardGrams) || 100;
        let protein = Number(args.protein) || 0;
        let carbs = Number(args.carbs) || 0;
        let fats = Number(args.fats) || 0;
        let calories = Number(args.calories) || 0;

        // Auto-calculate calories if missing or 0
        if (!calories && (protein > 0 || carbs > 0 || fats > 0)) {
          calories = Math.round(protein * 4 + carbs * 4 + fats * 9);
        } else if (!calories && protein === 0 && carbs === 0 && fats === 0) {
          // If no macros provided, sensible estimation
          calories = 150;
          protein = 5;
          carbs = 20;
          fats = 5;
        }

        const category = (args.category as any) || 'main';
        const serving = String(args.serving || `1 serving (${grams}g)`);
        const icon = String(args.icon || detectEmojiFromDishName(foodName) || '🥗');
        const customMicros = (args.vitaminsMinerals as Record<string, number>) || {};

        const newFoodItem: FoodItem = {
          id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: foodName,
          category,
          serving,
          standardGrams: grams,
          calories,
          protein,
          carbs,
          fats,
          icon,
          isCustom: true,
        };

        saveCustomFoodToLibrary(newFoodItem);
        if (args.saveToQuickSuggestions) {
          saveQuickSuggestion(newFoodItem);
        }

        // If logTodayMeal is specified, log it directly into today's meal
        if (args.logTodayMeal && args.logTodayMeal !== 'none' && typeof window !== 'undefined') {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const key = 'shadow_health_data_v2';
          const raw = localStorage.getItem(key) || '{}';
          const healthMap = JSON.parse(raw);
          const dayRecord = healthMap[today] || {
            calorieGoal: 2000,
            waterIntakeMl: 0,
            waterGoalMl: 2500,
            sleepHours: 7,
            sleepGoalHours: 8,
            energyRating: 4,
            loggedFoods: [],
            workouts: [],
          };
          const loggedFoodEntry = {
            id: 'lf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: foodName,
            calories,
            protein,
            carbs,
            fats,
            meal: args.logTodayMeal,
            quantity: 1,
            icon,
            time: timeStr,
            standardGrams: grams,
            customMicros,
          };
          dayRecord.loggedFoods = [loggedFoodEntry, ...(dayRecord.loggedFoods || [])];
          healthMap[today] = dayRecord;
          localStorage.setItem(key, JSON.stringify(healthMap));
          window.dispatchEvent(new CustomEvent('shadow_health_updated'));
        }

        return {
          toolName: name,
          actionSummary: `Added custom food "${foodName}" (${calories} kcal, ${protein}g P, ${carbs}g C, ${fats}g F) to Library${args.logTodayMeal ? ` & logged to today's ${args.logTodayMeal}` : ''}`,
          success: true,
          resultData: newFoodItem,
        };
      }

      case 'create_diet_plan': {
        const planName = String(args.planName || 'Custom Diet Plan');
        const goal = (args.goal as 'fat_loss' | 'muscle_gain' | 'maintenance') || 'maintenance';
        const dietType = (args.dietType as any) || 'Veg';
        const calories = Number(args.dailyCalories) || 2000;
        const description = String(args.description || `AI-designed ${goal.replace('_', ' ')} weekly nutrition blueprint (${dietType})`);

        // Generate full 7-day Monday through Sunday schedule if not provided
        const weekDays = [
          { name: 'Monday', focus: 'High Energy Kickoff', carbRatio: 0.45, protRatio: 0.30, fatRatio: 0.25 },
          { name: 'Tuesday', focus: 'Lean Protein Density', carbRatio: 0.40, protRatio: 0.35, fatRatio: 0.25 },
          { name: 'Wednesday', focus: 'Midweek Glycogen Balance', carbRatio: 0.45, protRatio: 0.30, fatRatio: 0.25 },
          { name: 'Thursday', focus: 'Clean Digestion & Fiber', carbRatio: 0.40, protRatio: 0.32, fatRatio: 0.28 },
          { name: 'Friday', focus: 'Pre-Weekend Endurance', carbRatio: 0.42, protRatio: 0.33, fatRatio: 0.25 },
          { name: 'Saturday', focus: 'Active Recovery & Micronutrients', carbRatio: 0.40, protRatio: 0.30, fatRatio: 0.30 },
          { name: 'Sunday', focus: 'Cellular Restoration & Fasting Window', carbRatio: 0.38, protRatio: 0.32, fatRatio: 0.30 },
        ];

        const default7Days = weekDays.map(wd => {
          const dayCals = calories;
          const pGrams = Math.round((dayCals * wd.protRatio) / 4);
          const cGrams = Math.round((dayCals * wd.carbRatio) / 4);
          const fGrams = Math.round((dayCals * wd.fatRatio) / 9);

          return {
            dayName: wd.name,
            focus: `${wd.focus} (${dietType})`,
            totalCalories: dayCals,
            totalProtein: pGrams,
            totalCarbs: cGrams,
            totalFats: fGrams,
            meals: [
              {
                mealType: 'breakfast' as const,
                name: `${wd.name} Power Breakfast`,
                items: dietType === 'Non-Veg' 
                  ? ['3 Egg Scramble with Spinach & Tomatoes', '2 Slices Whole Grain Toast with Avocado', 'Green Tea']
                  : ['Sprouted Moong & Paneer Bowl', 'Oatmeal with Walnuts & Blueberries', 'Almond Milk'],
                portion: '1 bowl + tea',
                calories: Math.round(dayCals * 0.28),
                protein: Math.round(pGrams * 0.28),
                carbs: Math.round(cGrams * 0.30),
                fats: Math.round(fGrams * 0.25),
                icon: 'Sunrise',
              },
              {
                mealType: 'lunch' as const,
                name: `${wd.name} Performance Lunch`,
                items: dietType === 'Non-Veg'
                  ? ['Grilled Herb Chicken Breast (180g)', 'Brown Basmati Rice (150g)', 'Steamed Broccoli & Mixed Greens']
                  : ['High-Protein Keerai Dal Tadka', '2 Multi-Grain Phulkas', 'Greek Yogurt Cucumber Raita (100g)'],
                portion: '1 plate',
                calories: Math.round(dayCals * 0.38),
                protein: Math.round(pGrams * 0.40),
                carbs: Math.round(cGrams * 0.40),
                fats: Math.round(fGrams * 0.32),
                icon: 'Utensils',
              },
              {
                mealType: 'snack' as const,
                name: 'Afternoon Metabolic Boost',
                items: ['Roasted Chickpeas (Chana) or Whey Isolate', 'Handful of Almonds & Pumpkin Seeds'],
                portion: '1 small bowl',
                calories: Math.round(dayCals * 0.12),
                protein: Math.round(pGrams * 0.12),
                carbs: Math.round(cGrams * 0.10),
                fats: Math.round(fGrams * 0.18),
                icon: 'Coffee',
              },
              {
                mealType: 'dinner' as const,
                name: `${wd.name} Recovery Dinner`,
                items: dietType === 'Non-Veg'
                  ? ['Baked Salmon / Fish Fillet with Asparagus', 'Warm Quinoa Bowl with Bell Peppers']
                  : ['Sautéed Tofu & Vegetable Stir-Fry', 'Warm Yellow Lentil Soup with Cumin & Lemon'],
                portion: '1 bowl',
                calories: Math.round(dayCals * 0.22),
                protein: Math.round(pGrams * 0.20),
                carbs: Math.round(cGrams * 0.20),
                fats: Math.round(fGrams * 0.25),
                icon: 'Moon',
              },
            ],
          };
        });

        const days = Array.isArray(args.days) && args.days.length >= 7 
          ? (args.days as any) 
          : Array.isArray(args.days) && args.days.length > 0 
            ? [...args.days, ...default7Days.slice(args.days.length)] 
            : default7Days;

        const newDiet: WeeklyDietPlan = {
          id: 'custom_diet_' + Date.now(),
          name: planName,
          tagline: description,
          locality: 'custom',
          localityLabel: 'Custom',
          targetWeightLossRate: goal === 'fat_loss' ? '0.5 kg / week' : 'Maintenance',
          weeklyLossKg: goal === 'fat_loss' ? 0.5 : 0,
          avgDailyCalories: calories,
          avgDailyProtein: Math.round((calories * 0.3) / 4),
          avgDailyCarbs: Math.round((calories * 0.4) / 4),
          avgDailyFats: Math.round((calories * 0.3) / 9),
          dietType: dietType as any,
          icon: 'Salad',
          colorClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/30',
          isCustom: true,
          days,
        };

        saveCustomDietPlan(newDiet);
        return {
          toolName: name,
          actionSummary: `Diet Plan Created: "${planName}" (~${calories} kcal/day, 7-Day Complete Weekly Schedule)`,
          success: true,
          resultData: { id: newDiet.id, name: planName, calories, daysCount: days.length },
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
