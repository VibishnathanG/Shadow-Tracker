export type Priority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string; // hex code
  icon: string;  // lucide icon name
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  categoryId?: string;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | null;
  recurrenceId?: string; // Links recurring instances
  completedAt?: string;  // Datetime ISO string
  createdAt: string;
  updatedAt: string;
  isSoftDeleted: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  completedDates: string[]; // Array of YYYY-MM-DD strings
  streakCount: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
  isSoftDeleted: boolean;
}

export interface DailyLog {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  focusScore: number; // 0 to 100
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  completedTasksCount: number;
  completedHabitsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string; // YYYY-MM-DD or standard UUID if daily journal means 1 note per day
  date: string; // YYYY-MM-DD
  title?: string;
  content: string; // markdown content
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // HH:MM
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  isEnabled: boolean;
  taskId?: string;
  habitId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  category: 'discipline' | 'focus' | 'learning' | 'consistency' | 'execution';
}

export interface Settings {
  theme: 'light' | 'obsidian' | 'onedark' | 'cyberpunk' | 'midnight';
  backupReminderDays: number;
  lastBackupDate?: string;
  soundEnabled: boolean;
  showCompletedTasks: boolean;
  isCompletedOnboarding: boolean;
  appScale?: number;
  githubPat?: string;
  lastSyncTimestamp?: number;
  xp: number;
  level: number;
  motivationalSlides?: Array<{ id: string; imageUrl?: string; vibe?: string; quote: string }>;
  unlockedBadges: string[];
  alias?: string;
  savingsTarget?: number;
  investmentsTarget?: number;
  badgesResetTimestamp?: string;
}

export interface BackupData {
  version: string;
  tasks: Task[];
  habits: Habit[];
  dailyLogs: DailyLog[];
  notes: Note[];
  reminders: Reminder[];
  categories: Category[];
  settings: Settings;
  exportedAt: string;
}
