import { describe, it, expect } from 'vitest';
import { smartMergeBackupData, FullBackupData } from '../smartMerge';
import { Task, Settings } from '@/types';

describe('smartMergeBackupData - Tasks & Settings Synchronization', () => {
  it('should merge tasks and preserve assignee and additionalDetails', () => {
    const localTask: Task = {
      id: 'task-sync-1',
      title: 'Deploy Production Satellite',
      isCompleted: false,
      dueDate: '2026-09-12',
      priority: 'high',
      isRecurring: false,
      recurrencePattern: null,
      createdAt: '2026-09-12T08:00:00.000Z',
      updatedAt: '2026-09-12T09:00:00.000Z',
      isSoftDeleted: false,
      assignee: 'Core Lead',
      additionalDetails: '# Mission Protocols\n- Step 1: Preflight\n- Step 2: Launch',
    };

    const cloudTask: Task = {
      id: 'task-sync-1',
      title: 'Deploy Production Satellite',
      isCompleted: true,
      dueDate: '2026-09-12',
      priority: 'high',
      isRecurring: false,
      recurrencePattern: null,
      createdAt: '2026-09-12T08:00:00.000Z',
      updatedAt: '2026-09-12T09:30:00.000Z',
      isSoftDeleted: false,
      assignee: 'Core Lead',
      additionalDetails: undefined,
    };

    const localData: FullBackupData = {
      tasks: [localTask],
      habits: [],
      dailyLogs: [],
      notes: [],
      categories: [],
    };

    const cloudData: FullBackupData = {
      tasks: [cloudTask],
      habits: [],
      dailyLogs: [],
      notes: [],
      categories: [],
    };

    const merged = smartMergeBackupData(localData, cloudData);

    expect(merged.tasks).toHaveLength(1);
    const resultTask = merged.tasks[0];
    expect(resultTask.id).toBe('task-sync-1');
    expect(resultTask.isCompleted).toBe(true);
    expect(resultTask.assignee).toBe('Core Lead');
    expect(resultTask.additionalDetails).toContain('# Mission Protocols');
  });

  it('should merge settings and union taskAssignees with defaultAssignee preserved', () => {
    const localSettings: Settings = {
      theme: 'onedark',
      backupReminderDays: 7,
      soundEnabled: true,
      showCompletedTasks: false,
      isCompletedOnboarding: true,
      xp: 100,
      level: 2,
      unlockedBadges: [],
      taskAssignees: ['Shadow', 'Core Lead', 'Agent Zero'],
      defaultAssignee: 'Agent Zero',
    };

    const cloudSettings: Settings = {
      theme: 'onedark',
      backupReminderDays: 7,
      soundEnabled: true,
      showCompletedTasks: false,
      isCompletedOnboarding: true,
      xp: 100,
      level: 2,
      unlockedBadges: [],
      taskAssignees: ['Shadow', 'Core Lead', 'Operator', 'Ghost'],
      defaultAssignee: 'Shadow',
    };

    const localData: FullBackupData = {
      tasks: [],
      habits: [],
      dailyLogs: [],
      notes: [],
      categories: [],
      settings: localSettings,
    };

    const cloudData: FullBackupData = {
      tasks: [],
      habits: [],
      dailyLogs: [],
      notes: [],
      categories: [],
      settings: cloudSettings,
    };

    const merged = smartMergeBackupData(localData, cloudData);

    expect(merged.settings).toBeDefined();
    expect(merged.settings?.taskAssignees).toEqual(
      expect.arrayContaining(['Shadow', 'Core Lead', 'Agent Zero', 'Operator', 'Ghost'])
    );
    expect(merged.settings?.defaultAssignee).toBe('Agent Zero');
  });
});
