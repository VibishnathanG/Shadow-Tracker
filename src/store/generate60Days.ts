import { Task, Habit, DailyLog, Note, Category, Reminder } from '@/types';
import { formatDateString } from '@/lib/dateUtils';

export function generate60DaysSeedData(categories: Category[]): {
  categories: Category[];
  tasks: Task[];
  habits: Habit[];
  dailyLogs: DailyLog[];
  notes: Note[];
  reminders: Reminder[];
} {
  const now = new Date();
  const getOffsetDateStr = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offsetDays);
    return formatDateString(d);
  };
  const isoNow = now.toISOString();

  // Create Habits
  const habits: Habit[] = [
    {
      id: 'habit-1',
      name: 'Morning Mindfulness',
      description: '10 minutes of silent meditation and breathing exercises.',
      categoryId: 'cat-personal',
      frequency: 'daily',
      completedDates: [],
      streakCount: 60,
      longestStreak: 60,
      createdAt: getOffsetDateStr(-60),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'habit-2',
      name: 'Gym Workout Routine',
      description: '45 mins strength training or cardio session.',
      categoryId: 'cat-health',
      frequency: 'custom',
      customDays: [1, 3, 5], 
      completedDates: [],
      streakCount: 20,
      longestStreak: 25,
      createdAt: getOffsetDateStr(-60),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
    {
      id: 'habit-3',
      name: 'Read Technical Book',
      description: 'Read at least 10 pages of software design guides.',
      categoryId: 'cat-study',
      frequency: 'daily',
      completedDates: [],
      streakCount: 15,
      longestStreak: 20,
      createdAt: getOffsetDateStr(-60),
      updatedAt: isoNow,
      isSoftDeleted: false,
    },
  ];

  const tasks: Task[] = [];
  const dailyLogs: DailyLog[] = [];
  const notes: Note[] = [];

  // Populate 60 days
  for (let i = -60; i <= 0; i++) {
    const dateStr = getOffsetDateStr(i);
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayOfWeek = d.getDay();

    // Habit completions
    habits[0].completedDates.push(dateStr); // Everyday

    if ([1, 3, 5].includes(dayOfWeek) && i % 3 !== 0) {
      habits[1].completedDates.push(dateStr);
    }
    
    if (i % 2 === 0) {
      habits[2].completedDates.push(dateStr);
    }

    // Generate some tasks
    if (i % 2 === 0) {
      tasks.push({
        id: `task-high-${i}`,
        title: `Deep Work Session ${i}`,
        description: 'Complete the main objective.',
        isCompleted: i < 0 ? true : false,
        dueDate: dateStr,
        priority: 'high',
        categoryId: 'cat-work',
        isRecurring: false,
        recurrencePattern: null,
        completedAt: i < 0 ? isoNow : undefined,
        createdAt: getOffsetDateStr(-61),
        updatedAt: isoNow,
        isSoftDeleted: false,
      });
    }

    if (i % 3 === 0) {
      tasks.push({
        id: `task-low-${i}`,
        title: `Maintenance task ${i}`,
        description: 'Routine maintenance.',
        isCompleted: i < -2 ? true : false,
        dueDate: dateStr,
        priority: 'low',
        categoryId: 'cat-personal',
        isRecurring: false,
        recurrencePattern: null,
        completedAt: i < -2 ? isoNow : undefined,
        createdAt: getOffsetDateStr(-61),
        updatedAt: isoNow,
        isSoftDeleted: false,
      });
    }

    // Notes
    if (i % 5 === 0) {
      notes.push({
        id: dateStr,
        date: dateStr,
        title: `Reflection Day ${i}`,
        content: `Today felt productive. Continuing the grind!`,
        createdAt: dateStr,
        updatedAt: dateStr,
      });
    }

    // Daily Logs
    const tasksDue = tasks.filter(t => t.dueDate === dateStr);
    const completedTasks = tasksDue.filter(t => t.isCompleted);
    const totalTasksCount = tasksDue.length;
    const completedTasksCount = completedTasks.length;
    
    const completedHabitsCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
    const activeHabitsCount = habits.length;

    let focusScore = 0;
    if (totalTasksCount > 0 && activeHabitsCount > 0) {
      focusScore = Math.round(((completedTasksCount / totalTasksCount) * 50) + ((completedHabitsCount / activeHabitsCount) * 50));
    } else if (totalTasksCount > 0) {
      focusScore = Math.round((completedTasksCount / totalTasksCount) * 100);
    } else if (activeHabitsCount > 0) {
      focusScore = Math.round((completedHabitsCount / activeHabitsCount) * 100);
    }

    dailyLogs.push({
      id: dateStr,
      date: dateStr,
      focusScore: Math.min(100, Math.max(15, focusScore || 70)),
      completedTasksCount,
      completedHabitsCount,
      mood: i % 7 === 0 ? 'good' : (i % 5 === 0 ? 'great' : 'neutral'),
      createdAt: dateStr,
      updatedAt: dateStr,
    });
  }

  return { categories, tasks, habits, dailyLogs, notes, reminders: [] };
}
