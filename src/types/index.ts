export type Priority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string; // hex code
  icon: string;  // lucide icon name
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type EisenhowerQuadrant = 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'neither';

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  startDate?: string; // YYYY-MM-DD
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
  status?: TaskStatus;
  matrixQuadrant?: EisenhowerQuadrant;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. '14:30'
  estimatedMinutes?: number; // e.g. 60
  estimatedHours?: number; // Integer custom hours
  spentMinutes?: number;
  assignee?: string; // e.g. 'Shadow', 'Operator'
  additionalDetails?: string; // Markdown supported with 500 lines limit
  notifyOnStart?: boolean;
  notifyOnEnd?: boolean;
}


export interface Habit {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  completedDates: string[]; // Array of YYYY-MM-DD strings
  uncompletedDates?: string[]; // Array of YYYY-MM-DD strings explicitly marked uncompleted/missed
  missedReasons?: Record<string, string>; // dateStr -> single mono reason for this habit on this date
  streakCount: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
  isSoftDeleted: boolean;
}

export interface MorningReviewState {
  completedAt?: string;
  energy?: number;
  intention?: string;
  mitIds?: string[];
}

export interface EveningReviewState {
  completedAt?: string;
  biggestWin?: string;
  gratitude?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
}

export interface DailyLog {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  focusScore: number; // 0 to 100
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  completedTasksCount: number;
  completedHabitsCount: number;
  morningReview?: MorningReviewState;
  eveningReview?: EveningReviewState;
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
  type?: 'task' | 'habit';
  reminderType?: 'task_start' | 'task_end' | 'habit' | 'general';
  date?: string; // YYYY-MM-DD (optional exact date for task alarms)
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
  theme: 'light' | 'white' | 'obsidian' | 'onedark' | 'cyberpunk' | 'midnight' | 'pine' | 'purple' | 'spectrum';
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
  stickyTaskNotifications?: boolean;
  oneDriveSyncFile?: string; // Name of the configured OneDrive sync file
  oneDriveSyncEnabled?: boolean;
  githubSyncEnabled?: boolean;
  githubGistId?: string;
  githubSyncFile?: string;
  githubSyncOnLaunch?: boolean;
  lastGithubSyncDate?: string;
  lastGithubSyncStatus?: string;
  localAutoSyncEnabled?: boolean;
  activeSyncMode?: 'none' | 'onedrive' | 'github' | 'local';
  lastOneDriveSyncTimestamp?: number;
  ecoMode?: boolean;
  lowGpuMode?: boolean;
  minimizeToTray?: boolean;
  habitGracePeriodDays?: number;
  taskAssignees?: string[];
  defaultAssignee?: string;
  customSubscriptionPresets?: Array<{ name: string; amount: number; cycle?: 'monthly' | 'yearly'; emoji?: string }>;
  customInvestmentPresets?: Array<{ name: string; amount: number; emoji?: string }>;
  customBigExpensePresets?: Array<{ name: string; amount: number; emoji?: string }>;
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
  moneyData?: any;
  healthData?: any;
  standaloneTodos?: any[];
  rpgQuests?: any[];
  wizardScrolls?: any[];
  wispCustomLines?: string[];
  unlockedBadges?: string[];
  aiCustomPrompts?: any[];
  aiCustomTools?: any[];
  exportedAt: string;
  archiveYear?: string;
}

