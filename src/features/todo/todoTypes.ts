export interface TodoSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface StandaloneTodo {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isStarred?: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderTime?: string; // ISO String (YYYY-MM-DDTHH:mm)
  reminderNotificationId?: number;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number[];
  subtasks: TodoSubtask[];
  createdAt: string;
  updatedAt: string;
}

export type TodoFilterStatus = 'all' | 'active' | 'completed' | 'starred';
export type TodoFilterPriority = 'all' | 'high' | 'medium' | 'low';
export type TodoSortOption = 'createdAt_desc' | 'createdAt_asc' | 'dueDate_asc' | 'priority_desc' | 'alphabetical';
