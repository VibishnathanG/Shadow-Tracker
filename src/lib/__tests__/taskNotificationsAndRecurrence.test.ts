import { describe, it, expect } from 'vitest';
import {
  calculateTaskExecutionTimes,
  buildTaskReminders,
  buildNextRecurringTaskWithReminders,
} from '../taskScheduling';
import { Task, Reminder } from '@/types';

describe('Task Scheduling, Overflow Detection & Notifications', () => {
  describe('calculateTaskExecutionTimes - Spillover & Limit Detection', () => {
    it('detects no spillover when estimated duration finishes before due date end of day', () => {
      // 12th Sep Start, 13th Sep Due, Scheduled at 12:00 PM on 13th Sep for 10 hours -> finishes at 22:00 on 13th Sep
      const result = calculateTaskExecutionTimes({
        startDate: '2026-09-12',
        dueDate: '2026-09-13',
        scheduledDate: '2026-09-13',
        scheduledTime: '12:00',
        estimatedHours: 10,
      });

      expect(result.isSpillover).toBe(false);
      expect(result.startDateStr).toBe('2026-09-13');
      expect(result.startTimeStr).toBe('12:00');
      expect(result.endDateStr).toBe('2026-09-13');
      expect(result.endTimeStr).toBe('22:00');
    });

    it('detects spillover when custom hours exceed due date limit (user example: 13th Sep 12:00 PM + 14 hrs)', () => {
      // 12th Sep Start, 13th Sep Due, Scheduled at 12:00 PM on 13th Sep for 14 hours -> finishes at 02:00 AM on 14th Sep
      const result = calculateTaskExecutionTimes({
        startDate: '2026-09-12',
        dueDate: '2026-09-13',
        scheduledDate: '2026-09-13',
        scheduledTime: '12:00',
        estimatedHours: 14,
      });

      expect(result.isSpillover).toBe(true);
      expect(result.spillDate).toBe('2026-09-14');
      expect(result.endDateStr).toBe('2026-09-14');
      expect(result.endTimeStr).toBe('02:00');
      expect(result.spillFormatted).toContain('Sep 14, 2026');
    });

    it('falls back gracefully when scheduledDate or scheduledTime are omitted', () => {
      const result = calculateTaskExecutionTimes({
        dueDate: '2026-09-20',
        estimatedHours: 2,
      });

      expect(result.isSpillover).toBe(false);
      expect(result.startTimeStr).toBe('09:00');
      expect(result.endTimeStr).toBe('11:00');
      expect(result.startDateStr).toBe('2026-09-20');
      expect(result.endDateStr).toBe('2026-09-20');
    });
  });

  describe('buildTaskReminders - Start & End Task Notifications', () => {
    const baseTask: Task = {
      id: 'task-test-101',
      title: 'Deploy Production Release',
      dueDate: '2026-09-13',
      startDate: '2026-09-12',
      scheduledDate: '2026-09-13',
      scheduledTime: '14:00',
      estimatedHours: 3,
      priority: 'high',
      isCompleted: false,
      isRecurring: false,
      recurrencePattern: null,
      isSoftDeleted: false,
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
      notifyOnStart: true,
      notifyOnEnd: true,
    };

    it('creates start and end reminders for task with exact start and end dates/times', () => {
      const { remindersToUpsert } = buildTaskReminders(baseTask, []);

      expect(remindersToUpsert).toHaveLength(2);

      const startReminder = remindersToUpsert.find(r => r.reminderType === 'task_start');
      expect(startReminder).toBeDefined();
      expect(startReminder?.isEnabled).toBe(true);
      expect(startReminder?.date).toBe('2026-09-13');
      expect(startReminder?.time).toBe('14:00');
      expect(startReminder?.title).toContain('Deploy Production Release');

      const endReminder = remindersToUpsert.find(r => r.reminderType === 'task_end');
      expect(endReminder).toBeDefined();
      expect(endReminder?.isEnabled).toBe(true);
      expect(endReminder?.date).toBe('2026-09-13');
      expect(endReminder?.time).toBe('17:00'); // 14:00 + 3 hours
    });

    it('synchronizes reminders when task timings and dates are updated', () => {
      // Initial reminder creation
      const { remindersToUpsert: initialReminders } = buildTaskReminders(baseTask, []);

      // Task updated to next day 10:00 AM with 5 hours duration
      const updatedTask: Task = {
        ...baseTask,
        dueDate: '2026-09-14',
        scheduledDate: '2026-09-14',
        scheduledTime: '10:00',
        estimatedHours: 5,
      };

      const { remindersToUpsert: updatedReminders } = buildTaskReminders(updatedTask, initialReminders);

      const updatedStart = updatedReminders.find(r => r.reminderType === 'task_start');
      expect(updatedStart?.date).toBe('2026-09-14');
      expect(updatedStart?.time).toBe('10:00');

      const updatedEnd = updatedReminders.find(r => r.reminderType === 'task_end');
      expect(updatedEnd?.date).toBe('2026-09-14');
      expect(updatedEnd?.time).toBe('15:00'); // 10:00 + 5 hours
    });

    it('disables reminders when notifyOnStart or notifyOnEnd is toggled off', () => {
      const { remindersToUpsert: initialReminders } = buildTaskReminders(baseTask, []);

      const disabledTask: Task = {
        ...baseTask,
        notifyOnStart: false,
        notifyOnEnd: false,
      };

      const { remindersToUpsert: result } = buildTaskReminders(disabledTask, initialReminders);

      const start = result.find(r => r.reminderType === 'task_start');
      const end = result.find(r => r.reminderType === 'task_end');

      expect(start?.isEnabled).toBe(false);
      expect(end?.isEnabled).toBe(false);
    });
  });

  describe('Multi-Day Recurring Task & Notification Scheduling', () => {
    const recurringTask: Task = {
      id: 'task-recurring-1',
      title: 'Daily Standup & Sync',
      dueDate: '2026-09-13',
      startDate: '2026-09-13',
      scheduledDate: '2026-09-13',
      scheduledTime: '10:00',
      estimatedHours: 1,
      priority: 'medium',
      isCompleted: false,
      isRecurring: true,
      recurrencePattern: 'daily',
      isSoftDeleted: false,
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
      notifyOnStart: true,
      notifyOnEnd: true,
    };

    it('spawns next daily occurrence with incremented dates and corresponding start/end reminders', () => {
      const existingReminders: Reminder[] = [];

      // Occurrence 1 -> Occurrence 2 (2026-09-14)
      const occ2 = buildNextRecurringTaskWithReminders(recurringTask, 'task-recurring-2', existingReminders);
      expect(occ2.nextTask.dueDate).toBe('2026-09-14');
      expect(occ2.nextTask.startDate).toBe('2026-09-14');
      expect(occ2.nextTask.scheduledDate).toBe('2026-09-14');
      expect(occ2.nextTask.isCompleted).toBe(false);

      expect(occ2.nextReminders).toHaveLength(2);
      const startRem2 = occ2.nextReminders.find(r => r.reminderType === 'task_start');
      const endRem2 = occ2.nextReminders.find(r => r.reminderType === 'task_end');

      expect(startRem2?.date).toBe('2026-09-14');
      expect(startRem2?.time).toBe('10:00');
      expect(endRem2?.date).toBe('2026-09-14');
      expect(endRem2?.time).toBe('11:00');

      // Occurrence 2 -> Occurrence 3 (2026-09-15)
      const occ3 = buildNextRecurringTaskWithReminders(occ2.nextTask, 'task-recurring-3', occ2.nextReminders);
      expect(occ3.nextTask.dueDate).toBe('2026-09-15');
      expect(occ3.nextTask.startDate).toBe('2026-09-15');
      expect(occ3.nextTask.scheduledDate).toBe('2026-09-15');

      const startRem3 = occ3.nextReminders.find(r => r.reminderType === 'task_start');
      const endRem3 = occ3.nextReminders.find(r => r.reminderType === 'task_end');

      expect(startRem3?.date).toBe('2026-09-15');
      expect(startRem3?.time).toBe('10:00');
      expect(endRem3?.date).toBe('2026-09-15');
      expect(endRem3?.time).toBe('11:00');
    });

    it('handles multi-day weekly recurrence preserving notification timeframes across weeks', () => {
      const weeklyTask: Task = {
        ...recurringTask,
        id: 'task-weekly-1',
        recurrencePattern: 'weekly',
        dueDate: '2026-09-13',
        startDate: '2026-09-13',
        scheduledDate: '2026-09-13',
        scheduledTime: '15:30',
        estimatedHours: 2,
      };

      const nextOcc = buildNextRecurringTaskWithReminders(weeklyTask, 'task-weekly-2', []);
      expect(nextOcc.nextTask.dueDate).toBe('2026-09-20');
      expect(nextOcc.nextTask.startDate).toBe('2026-09-20');
      expect(nextOcc.nextTask.scheduledDate).toBe('2026-09-20');

      const startRem = nextOcc.nextReminders.find(r => r.reminderType === 'task_start');
      const endRem = nextOcc.nextReminders.find(r => r.reminderType === 'task_end');

      expect(startRem?.date).toBe('2026-09-20');
      expect(startRem?.time).toBe('15:30');
      expect(endRem?.date).toBe('2026-09-20');
      expect(endRem?.time).toBe('17:30');
    });
  });
});
