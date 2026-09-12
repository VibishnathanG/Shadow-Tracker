import { addHours, format, isValid, parseISO } from 'date-fns';
import { Task, Reminder } from '@/types';
import { parseDateString, calculateNextRecurrence, getTodayDateString } from './dateUtils';

export interface TaskTimingInputs {
  startDate?: string;
  dueDate: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedHours?: number;
}

export interface TaskExecutionTimes {
  startDateTime: Date;
  endDateTime: Date;
  dueDateLimit: Date;
  isSpillover: boolean;
  spillDate: string; // YYYY-MM-DD
  spillFormatted: string; // e.g. "Sep 14, 2026 2:00 AM"
  startTimeStr: string; // HH:mm
  endTimeStr: string; // HH:mm
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string; // YYYY-MM-DD
}

/**
 * Calculates start, end, and due-limit timestamps for a task,
 * and determines whether the estimated duration causes the task to spill
 * past the assigned Due Date.
 */
export function calculateTaskExecutionTimes(inputs: TaskTimingInputs): TaskExecutionTimes {
  const effectiveStartDateStr = inputs.scheduledDate || inputs.startDate || inputs.dueDate || getTodayDateString();
  const effectiveDueDateStr = inputs.dueDate || effectiveStartDateStr;
  const effectiveTimeStr = inputs.scheduledTime && inputs.scheduledTime.includes(':') 
    ? inputs.scheduledTime 
    : '09:00';

  const [hStr, mStr] = effectiveTimeStr.split(':');
  const startH = parseInt(hStr, 10) || 0;
  const startM = parseInt(mStr, 10) || 0;

  const startDateParsed = parseDateString(effectiveStartDateStr);
  const startDateTime = new Date(
    startDateParsed.getFullYear(),
    startDateParsed.getMonth(),
    startDateParsed.getDate(),
    startH,
    startM,
    0,
    0
  );

  const hours = Math.max(1, Math.round(inputs.estimatedHours ?? 1));
  const endDateTime = addHours(startDateTime, hours);

  const dueDateParsed = parseDateString(effectiveDueDateStr);
  const dueDateLimit = new Date(
    dueDateParsed.getFullYear(),
    dueDateParsed.getMonth(),
    dueDateParsed.getDate(),
    23,
    59,
    59,
    999
  );

  const isSpillover = endDateTime.getTime() > dueDateLimit.getTime();
  const spillDate = format(endDateTime, 'yyyy-MM-dd');
  const spillFormatted = format(endDateTime, 'MMM d, yyyy h:mm a');

  return {
    startDateTime,
    endDateTime,
    dueDateLimit,
    isSpillover,
    spillDate,
    spillFormatted,
    startTimeStr: format(startDateTime, 'HH:mm'),
    endTimeStr: format(endDateTime, 'HH:mm'),
    startDateStr: format(startDateTime, 'yyyy-MM-dd'),
    endDateStr: format(endDateTime, 'yyyy-MM-dd'),
  };
}

/**
 * Generates or updates the Start and End notifications for a given task,
 * keeping existing reminders in sync with updated timeframes and dates.
 */
export function buildTaskReminders(
  task: Task,
  existingReminders: Reminder[],
  options?: { notifyOnStart?: boolean; notifyOnEnd?: boolean }
): { updatedReminders: Reminder[]; remindersToUpsert: Reminder[] } {
  const notifyOnStart = options?.notifyOnStart ?? Boolean(task.notifyOnStart);
  const notifyOnEnd = options?.notifyOnEnd ?? Boolean(task.notifyOnEnd);

  const timings = calculateTaskExecutionTimes({
    startDate: task.startDate,
    dueDate: task.dueDate,
    scheduledDate: task.scheduledDate,
    scheduledTime: task.scheduledTime,
    estimatedHours: task.estimatedHours ?? (task.estimatedMinutes ? Math.round(task.estimatedMinutes / 60) : 1),
  });

  const nowIso = new Date().toISOString();
  const startReminderId = `${task.id}-start`;
  const endReminderId = `${task.id}-end`;

  const remindersToUpsert: Reminder[] = [];

  // Start Reminder
  const existingStart = existingReminders.find(r => r.id === startReminderId || (r.taskId === task.id && r.reminderType === 'task_start'));
  const startReminder: Reminder = {
    id: existingStart?.id || startReminderId,
    title: `🚀 Task Started: ${task.title}`,
    time: timings.startTimeStr,
    date: timings.startDateStr,
    days: [],
    isEnabled: notifyOnStart,
    type: 'task',
    reminderType: 'task_start',
    taskId: task.id,
    createdAt: existingStart?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  remindersToUpsert.push(startReminder);

  // End Reminder
  const existingEnd = existingReminders.find(r => r.id === endReminderId || (r.taskId === task.id && r.reminderType === 'task_end'));
  const endReminder: Reminder = {
    id: existingEnd?.id || endReminderId,
    title: `🏁 Task Due / Time Elapsed: ${task.title}`,
    time: timings.endTimeStr,
    date: timings.endDateStr,
    days: [],
    isEnabled: notifyOnEnd,
    type: 'task',
    reminderType: 'task_end',
    taskId: task.id,
    createdAt: existingEnd?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  remindersToUpsert.push(endReminder);

  // Merge into existing reminder list
  const map = new Map<string, Reminder>();
  for (const r of existingReminders) {
    map.set(r.id, r);
  }
  for (const r of remindersToUpsert) {
    map.set(r.id, r);
  }

  return {
    updatedReminders: Array.from(map.values()),
    remindersToUpsert,
  };
}

/**
 * Builds the next occurrence of a recurring task along with its scheduled start/end reminders.
 */
export function buildNextRecurringTaskWithReminders(
  task: Task,
  nextTaskId: string,
  existingReminders: Reminder[]
): { nextTask: Task; nextReminders: Reminder[] } {
  if (!task.isRecurring || !task.recurrencePattern) {
    throw new Error('Task is not marked as recurring or missing recurrence pattern');
  }

  const nextDueDate = calculateNextRecurrence(task.dueDate, task.recurrencePattern);
  const nextStartDate = task.startDate 
    ? calculateNextRecurrence(task.startDate, task.recurrencePattern) 
    : nextDueDate;
  const nextScheduledDate = task.scheduledDate 
    ? calculateNextRecurrence(task.scheduledDate, task.recurrencePattern) 
    : undefined;

  const nowIso = new Date().toISOString();

  const nextTask: Task = {
    id: nextTaskId,
    title: task.title,
    description: task.description,
    isCompleted: false,
    status: 'todo',
    matrixQuadrant: task.matrixQuadrant,
    scheduledDate: nextScheduledDate,
    scheduledTime: task.scheduledTime,
    estimatedMinutes: task.estimatedMinutes,
    estimatedHours: task.estimatedHours,
    startDate: nextStartDate,
    dueDate: nextDueDate,
    priority: task.priority,
    categoryId: task.categoryId,
    isRecurring: true,
    recurrencePattern: task.recurrencePattern,
    recurrenceId: task.recurrenceId || task.id,
    createdAt: nowIso,
    updatedAt: nowIso,
    isSoftDeleted: false,
    assignee: task.assignee,
    additionalDetails: task.additionalDetails,
    notifyOnStart: task.notifyOnStart,
    notifyOnEnd: task.notifyOnEnd,
  };

  const { remindersToUpsert } = buildTaskReminders(nextTask, existingReminders, {
    notifyOnStart: task.notifyOnStart,
    notifyOnEnd: task.notifyOnEnd,
  });

  return {
    nextTask,
    nextReminders: remindersToUpsert.filter(r => r.isEnabled),
  };
}
