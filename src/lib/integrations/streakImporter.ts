import { Task, Habit, Category, BackupData } from '@/types';
import { calculateStreaks, getTodayDateString } from '@/lib/dateUtils';
import { dbService, STORES } from '@/lib/storage';
import { useShadowTrackerStore } from '@/store';
import { triggerJsonDownload } from '@/lib/oneDriveSync';
import { isZipBuffer, extractTextFilesFromZip, normalizeToYyyyMmDd } from './zipExtractor';

export interface StreakParsedData {
  todos: Task[];
  habits: Habit[];
  categories: Category[];
  sourceInfo: {
    app: string;
    version?: number;
    exportedAt?: string;
  };
}

export interface StreakMergeSummary {
  tasksAdded: number;
  tasksUpdated: number;
  habitsAdded: number;
  habitsMerged: number;
  categoriesAdded: number;
  totalSimpleTasksNow: number;
  totalHabitsNow: number;
  backupData?: BackupData;
}

/**
 * Extract raw JSON text from a Streak backup file, buffer, or string.
 * Supports:
 * - Direct JSON text files
 * - Standard .zip files containing backup.json
 * - Extensionless backup files (e.g. 'Streak backup') containing zip data
 * - Resilient decompression for Dart/Flutter archives with size discrepancies
 */
export async function extractStreakBackupJson(input: File | Blob | ArrayBuffer | Uint8Array | string): Promise<string> {
  if (typeof input === 'string') {
    return input;
  }

  let buffer: ArrayBuffer;
  if (input instanceof File || input instanceof Blob) {
    buffer = await input.arrayBuffer();
  } else if (input instanceof Uint8Array) {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  } else {
    buffer = input;
  }

  if (isZipBuffer(buffer)) {
    const files = extractTextFilesFromZip(buffer);
    // Find backup.json or any JSON file
    if (files['backup.json']) {
      return files['backup.json'];
    }

    const jsonKey = Object.keys(files).find(name => name.toLowerCase().endsWith('.json'));
    if (jsonKey && files[jsonKey]) {
      return files[jsonKey];
    }

    throw new Error('Invalid Streak backup archive: No backup.json file found inside the zip archive.');
  }

  // Not a zip archive; decode as UTF-8 text
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

/**
 * Parses Streak backup data and maps:
 * - Streak To-Dos -> Shadow Tracker Simple Tasks (Task with isSimple: true)
 * - Streak Habits -> Shadow Tracker Habits with full completion history (handles DD-MM-YYYY, YYYY-MM-DD, etc.)
 * - Streak Categories -> Shadow Tracker Categories
 */
export async function parseStreakBackup(input: File | Blob | ArrayBuffer | Uint8Array | string): Promise<StreakParsedData> {
  const jsonText = await extractStreakBackupJson(input);
  let raw: any;
  try {
    raw = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error(`Failed to parse Streak backup JSON: ${err.message || 'Malformed JSON'}`);
  }

  // Support payload wrapping if present
  const payload = raw?.payload && typeof raw.payload === 'object' ? raw.payload : raw;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid Streak backup format: Root JSON must be an object.');
  }

  const rawTodos: any[] = Array.isArray(payload.todos) ? payload.todos : [];
  const rawHabits: any[] = Array.isArray(payload.habits) ? payload.habits : [];
  const rawCategories: any[] = Array.isArray(payload.categories) ? payload.categories : [];
  const rawTodoTags: any[] = Array.isArray(payload.todoTags) ? payload.todoTags : [];

  // Map todoTags (projects / tags) for resolving todo.project IDs into human readable names
  const tagMap = new Map<string, string>();
  for (const tag of rawTodoTags) {
    if (tag && tag.id && tag.name) {
      tagMap.set(String(tag.id), String(tag.name));
    }
  }

  // 1. Map Streak Categories
  const categories: Category[] = rawCategories.map((c, idx) => {
    const id = c.id ? `streak_cat_${c.id}` : `streak_cat_${idx}`;
    let color = '#3b82f6';
    if (typeof c.color === 'number') {
      // Dart ARGB int to hex string #RRGGBB
      const hex = (c.color & 0xffffff).toString(16).padStart(6, '0');
      color = `#${hex}`;
    } else if (typeof c.color === 'string' && c.color.startsWith('#')) {
      color = c.color;
    }

    return {
      id,
      name: String(c.name || `Category ${idx + 1}`),
      color,
      icon: String(c.icon || 'Folder'),
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    };
  });

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    // Map both stripped ID, full ID, and category name
    const rawId = c.id.replace('streak_cat_', '');
    categoryMap.set(rawId, c.id);
    categoryMap.set(c.id, c.id);
    categoryMap.set(c.name.toLowerCase().trim(), c.id);
  }

  // 2. Map Streak To-Dos -> Shadow Tracker Simple Tasks
  const todos: Task[] = rawTodos.map((todo, idx) => {
    const todoId = todo.id ? `streak_todo_${todo.id}` : `streak_todo_${idx}_${Date.now()}`;
    const rawText = String(todo.text || '').trim();
    const textLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const title = textLines[0] || 'Untitled To-Do';
    const body = textLines.slice(1).join('\n');

    // Build details from steps, tags, photos, project, etc.
    const detailParts: string[] = [];
    if (body) {
      detailParts.push(body);
    }

    if (Array.isArray(todo.steps) && todo.steps.length > 0) {
      detailParts.push('\n### Checklist');
      todo.steps.forEach((s: any) => {
        const stepText = typeof s === 'string' ? s : s?.text || '';
        const stepDone = typeof s === 'object' ? Boolean(s.done) : false;
        if (stepText) {
          detailParts.push(`- [${stepDone ? 'x' : ' '}] ${stepText}`);
        }
      });
    }

    if (Array.isArray(todo.tags) && todo.tags.length > 0) {
      const tagLabels = todo.tags.map((t: string) => tagMap.get(t) || t);
      detailParts.push(`\n**Tags:** ${tagLabels.join(', ')}`);
    }

    if (todo.project) {
      const projName = tagMap.get(String(todo.project)) || String(todo.project);
      detailParts.push(`**Project:** ${projName}`);
    }

    // Priority mapping (Streak: 0: none, 1: low, 2: medium, 3: high)
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (typeof todo.priority === 'number') {
      if (todo.priority === 1) priority = 'low';
      else if (todo.priority === 3) priority = 'high';
      else priority = 'medium';
    } else if (typeof todo.priority === 'string') {
      const p = todo.priority.toLowerCase();
      if (p === 'low') priority = 'low';
      else if (p === 'high') priority = 'high';
      else priority = 'medium';
    }

    // Due date & scheduled time
    let dueDate = '';
    const normalizedDueDate = normalizeToYyyyMmDd(todo.date);
    if (normalizedDueDate) {
      dueDate = normalizedDueDate;
    }

    let scheduledTime: string | undefined = undefined;
    if (typeof todo.minutes === 'number' && todo.minutes >= 0) {
      const h = Math.floor(todo.minutes / 60);
      const m = todo.minutes % 60;
      scheduledTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const isCompleted = Boolean(todo.done);
    const createdAt = todo.createdAt ? new Date(todo.createdAt).toISOString() : new Date().toISOString();
    const updatedAt = todo.doneAt
      ? new Date(todo.doneAt).toISOString()
      : todo.createdAt
      ? new Date(todo.createdAt).toISOString()
      : new Date().toISOString();

    const isRecurring = Boolean(todo.repeat);
    let recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'custom' | null = null;
    if (isRecurring) {
      recurrencePattern = 'daily';
    }

    // Resolve category id
    let catId = '';
    if (todo.category) {
      const catKey = String(todo.category).toLowerCase().trim();
      catId = categoryMap.get(catKey) || categoryMap.get(String(todo.category)) || '';
    }

    return {
      id: todoId,
      title,
      description: body || undefined,
      additionalDetails: detailParts.length > 0 ? detailParts.join('\n') : undefined,
      isCompleted,
      status: isCompleted ? 'done' : 'todo',
      startDate: getTodayDateString(),
      dueDate,
      priority,
      categoryId: catId,
      isRecurring,
      recurrencePattern,
      completedAt: todo.doneAt ? new Date(todo.doneAt).toISOString() : undefined,
      createdAt,
      updatedAt,
      isSoftDeleted: false,
      isSimple: true,
      matrixQuadrant: 'not_urgent_important',
      scheduledTime,
      estimatedMinutes: typeof todo.estimate === 'number' ? todo.estimate : undefined,
    };
  });

  // 3. Map Streak Habits
  const habits: Habit[] = rawHabits.map((habit, idx) => {
    const habitId = habit.id ? `streak_habit_${habit.id}` : `streak_habit_${idx}_${Date.now()}`;
    const name = String(habit.name || `Habit ${idx + 1}`).trim();
    const description = String(habit.description || '').trim();

    // Map interval (0: daily, 1: weekly, 2: monthly, 3: weekdays, 4: everyXDays)
    let frequency: 'daily' | 'weekly' | 'custom' = 'daily';
    let customDays: number[] | undefined = undefined;

    if (habit.interval === 1) {
      frequency = 'weekly';
    } else if (habit.interval === 3 || habit.interval === 4 || Array.isArray(habit.scheduleWeekdays)) {
      frequency = 'custom';
      if (Array.isArray(habit.scheduleWeekdays) && habit.scheduleWeekdays.length > 0) {
        // In Dart, Monday is 1 and Sunday is 7. In JS Date, Sunday is 0 and Monday is 1.
        const mappedDays = habit.scheduleWeekdays
          .map((d: any) => Number(d === 7 ? 0 : d))
          .filter((d: number) => !isNaN(d) && d >= 0 && d <= 6);
        customDays = Array.from(new Set<number>(mappedDays)).sort((a, b) => a - b);
      }
    }

    // Extract completion dates (normalizes 'DD-MM-YYYY' and 'YYYY-MM-DD' into standard 'YYYY-MM-DD')
    const completedSet = new Set<string>();
    if (habit.completions && typeof habit.completions === 'object') {
      if (Array.isArray(habit.completions)) {
        for (const c of habit.completions) {
          const rawDate = c?.date || (typeof c === 'string' ? c : null);
          const norm = normalizeToYyyyMmDd(rawDate);
          if (norm) {
            completedSet.add(norm);
          }
        }
      } else {
        // Map of date string -> Completion object or count
        for (const [key, value] of Object.entries(habit.completions)) {
          const norm = normalizeToYyyyMmDd(key);
          if (norm) {
            const count = typeof value === 'number' ? value : (value as any)?.numberOfCompletions ?? 1;
            if (count > 0) {
              completedSet.add(norm);
            }
          }
        }
      }
    }

    const completedDates = Array.from(completedSet).sort();
    const streaks = calculateStreaks(completedDates);

    // Missed reasons with normalized dates
    const missedReasons: Record<string, string> = {};
    if (habit.missReasons && typeof habit.missReasons === 'object' && !Array.isArray(habit.missReasons)) {
      for (const [dateKey, reason] of Object.entries(habit.missReasons)) {
        const norm = normalizeToYyyyMmDd(dateKey);
        if (norm && typeof reason === 'string' && reason.trim()) {
          missedReasons[norm] = reason.trim();
        }
      }
    }

    const createdAt = habit.createdAt ? new Date(habit.createdAt).toISOString() : new Date().toISOString();

    // Resolve category id
    let catId = '';
    if (habit.category) {
      const catKey = String(habit.category).toLowerCase().trim();
      catId = categoryMap.get(catKey) || categoryMap.get(String(habit.category)) || '';
    }

    return {
      id: habitId,
      name,
      description: description || undefined,
      categoryId: catId,
      frequency,
      customDays,
      completedDates,
      uncompletedDates: [],
      missedReasons: Object.keys(missedReasons).length > 0 ? missedReasons : undefined,
      streakCount: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      createdAt,
      updatedAt: new Date().toISOString(),
      isSoftDeleted: false,
    };
  });

  return {
    todos,
    habits,
    categories,
    sourceInfo: {
      app: 'streak',
      version: payload.version,
      exportedAt: payload.exportedAt,
    },
  };
}

/**
 * Safely merge Streak data into the live Shadow Tracker workspace:
 * - Appends new Simple Tasks (checking for duplicate IDs or identical title + dueDate)
 * - Appends new Habits or non-destructively merges existing habits (union of completed dates, recalculating streaks)
 * - Updates IndexedDB and Zustand store state immediately
 * - Exports updated master backup JSON and triggers automatic download
 */
export async function mergeStreakDataIntoApp(
  data: StreakParsedData,
  options?: { silent?: boolean; autoDownload?: boolean }
): Promise<StreakMergeSummary> {
  const store = useShadowTrackerStore.getState();
  const currentTasks = [...store.tasks];
  const currentHabits = [...store.habits];
  const currentCategories = [...store.categories];

  // 1. Merge Categories
  const existingCatNames = new Set(currentCategories.map(c => c.name.trim().toLowerCase()));
  const existingCatIds = new Set(currentCategories.map(c => c.id));
  const categoriesToAdd: Category[] = [];

  for (const cat of data.categories) {
    if (!existingCatIds.has(cat.id) && !existingCatNames.has(cat.name.trim().toLowerCase())) {
      categoriesToAdd.push(cat);
      existingCatIds.add(cat.id);
      existingCatNames.add(cat.name.trim().toLowerCase());
    }
  }

  for (const cat of categoriesToAdd) {
    await dbService.put(STORES.CATEGORIES, cat);
  }
  const updatedCategories = [...currentCategories, ...categoriesToAdd];

  // 2. Merge Simple Tasks (One-Way Sync: Update same names gracefully, append new)
  const taskMapById = new Map<string, Task>();
  const taskMapByTitle = new Map<string, Task>();
  for (const t of currentTasks) {
    taskMapById.set(t.id, t);
    taskMapByTitle.set(t.title.trim().toLowerCase(), t);
  }

  let tasksAdded = 0;
  let tasksUpdated = 0;
  const tasksToPersist: Task[] = [];

  for (const incoming of data.todos) {
    const normTitle = incoming.title.trim().toLowerCase();
    const existing = taskMapById.get(incoming.id) || taskMapByTitle.get(normTitle);

    if (existing) {
      // Graceful update: Task with same name or ID exists in Shadow Tracker
      // Update task attributes from source while preserving Shadow Tracker local identity
      const isCompleted = incoming.isCompleted !== undefined ? incoming.isCompleted : existing.isCompleted;
      const completedAt = isCompleted
        ? (incoming.completedAt || existing.completedAt || new Date().toISOString())
        : undefined;

      const updatedTask: Task = {
        ...existing,
        id: existing.id,
        title: incoming.title || existing.title,
        description: incoming.description !== undefined ? incoming.description : existing.description,
        isCompleted,
        completedAt,
        priority: incoming.priority || existing.priority || 'medium',
        dueDate: incoming.dueDate || existing.dueDate,
        scheduledTime: incoming.scheduledTime !== undefined ? incoming.scheduledTime : existing.scheduledTime,
        estimatedMinutes: incoming.estimatedMinutes !== undefined ? incoming.estimatedMinutes : existing.estimatedMinutes,
        categoryId: incoming.categoryId || existing.categoryId,
        isSimple: true,
        updatedAt: new Date().toISOString(),
      };

      taskMapById.set(updatedTask.id, updatedTask);
      taskMapByTitle.set(normTitle, updatedTask);
      tasksToPersist.push(updatedTask);
      tasksUpdated++;
    } else {
      taskMapById.set(incoming.id, incoming);
      taskMapByTitle.set(normTitle, incoming);
      tasksToPersist.push(incoming);
      tasksAdded++;
    }
  }

  for (const task of tasksToPersist) {
    await dbService.put(STORES.TASKS, task);
  }
  const updatedTasks = Array.from(taskMapById.values());

  // 3. Merge Habits (Safe merge / union of completion history)
  const habitMapById = new Map<string, Habit>();
  const habitMapByName = new Map<string, Habit>();
  for (const h of currentHabits) {
    habitMapById.set(h.id, h);
    habitMapByName.set(h.name.trim().toLowerCase(), h);
  }

  let habitsAdded = 0;
  let habitsMerged = 0;
  const habitsToPersist: Habit[] = [];

  for (const incoming of data.habits) {
    const match = habitMapById.get(incoming.id) || habitMapByName.get(incoming.name.trim().toLowerCase());
    if (match) {
      // Non-destructive merge: union of completed dates
      const mergedDates = Array.from(new Set([...(match.completedDates || []), ...(incoming.completedDates || [])])).sort();
      const streaks = calculateStreaks(mergedDates);
      const mergedReasons = {
        ...(incoming.missedReasons || {}),
        ...(match.missedReasons || {}),
      };

      const updatedHabit: Habit = {
        ...match,
        completedDates: mergedDates,
        missedReasons: Object.keys(mergedReasons).length > 0 ? mergedReasons : undefined,
        streakCount: streaks.currentStreak,
        longestStreak: Math.max(match.longestStreak || 0, streaks.longestStreak),
        updatedAt: new Date().toISOString(),
      };

      habitMapById.set(updatedHabit.id, updatedHabit);
      habitMapByName.set(updatedHabit.name.trim().toLowerCase(), updatedHabit);
      habitsToPersist.push(updatedHabit);
      habitsMerged++;
    } else {
      habitMapById.set(incoming.id, incoming);
      habitMapByName.set(incoming.name.trim().toLowerCase(), incoming);
      habitsToPersist.push(incoming);
      habitsAdded++;
    }
  }

  for (const habit of habitsToPersist) {
    await dbService.put(STORES.HABITS, habit);
  }
  const updatedHabits = Array.from(habitMapById.values());

  // 4. Update Zustand Store State
  useShadowTrackerStore.setState({
    tasks: updatedTasks,
    habits: updatedHabits,
    categories: updatedCategories,
  });

  // 5. Update master backup only if explicitly requested (NO auto-download popup!)
  let updatedBackup: BackupData | undefined;
  if (options?.autoDownload) {
    updatedBackup = await dbService.exportAllData(store.settings);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `shadow_tracker_backup_merged_streak_${stamp}.json`;
    triggerJsonDownload(backupFileName, updatedBackup);
  }

  // 6. Dispatch cross-component update events
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shadow_tasks_updated'));
    window.dispatchEvent(new CustomEvent('shadow_habits_updated'));
  }

  return {
    tasksAdded,
    tasksUpdated,
    habitsAdded,
    habitsMerged,
    categoriesAdded: categoriesToAdd.length,
    totalSimpleTasksNow: updatedTasks.filter(t => t.isSimple).length,
    totalHabitsNow: updatedHabits.length,
    backupData: updatedBackup,
  };
}
