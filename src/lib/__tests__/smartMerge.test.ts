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

    expect(merged.settings?.taskAssignees).toEqual(
      expect.arrayContaining(['Shadow', 'Core Lead', 'Agent Zero', 'Operator', 'Ghost'])
    );
    expect(merged.settings?.defaultAssignee).toBe('Agent Zero');
  });

  it('should merge customSubscriptionPresets, customInvestmentPresets, and customBigExpensePresets without duplicate names', () => {
    const localSettings: Settings = {
      theme: 'spectrum',
      backupReminderDays: 7,
      soundEnabled: true,
      showCompletedTasks: true,
      isCompletedOnboarding: true,
      xp: 0,
      level: 1,
      unlockedBadges: [],
      customSubscriptionPresets: [
        { name: 'Netflix', amount: 649, emoji: '🍿', cycle: 'monthly' },
        { name: 'Custom Cloud VPS', amount: 1200, emoji: '☁️', cycle: 'monthly' },
      ],
      customInvestmentPresets: [
        { name: 'Nifty 50 Index Fund', amount: 5000, emoji: '📈' },
        { name: 'Gold ETF', amount: 3000, emoji: '🪙' },
      ],
      customBigExpensePresets: [
        { name: 'House Rent', amount: 22000, emoji: '🏠' },
      ],
    };

    const cloudSettings: Settings = {
      theme: 'spectrum',
      backupReminderDays: 7,
      soundEnabled: true,
      showCompletedTasks: true,
      isCompletedOnboarding: true,
      xp: 0,
      level: 1,
      unlockedBadges: [],
      customSubscriptionPresets: [
        { name: 'Netflix', amount: 799, emoji: '🍿', cycle: 'monthly' }, // newer or cloud price
        { name: 'Spotify Premium', amount: 119, emoji: '🎵', cycle: 'monthly' },
      ],
      customInvestmentPresets: [
        { name: 'Nifty 50 Index Fund', amount: 6000, emoji: '📈' },
        { name: 'US Tech ETF', amount: 4000, emoji: '🚀' },
      ],
      customBigExpensePresets: [
        { name: 'Car EMI', amount: 14000, emoji: '🚗' },
      ],
    };

    const localData: FullBackupData = {
      tasks: [], habits: [], dailyLogs: [], notes: [], categories: [],
      settings: localSettings,
    };

    const cloudData: FullBackupData = {
      tasks: [], habits: [], dailyLogs: [], notes: [], categories: [],
      settings: cloudSettings,
    };

    const merged = smartMergeBackupData(localData, cloudData);

    expect(merged.settings?.customSubscriptionPresets).toHaveLength(3);
    const subNames = merged.settings?.customSubscriptionPresets?.map(s => s.name);
    expect(subNames).toContain('Netflix');
    expect(subNames).toContain('Custom Cloud VPS');
    expect(subNames).toContain('Spotify Premium');

    expect(merged.settings?.customInvestmentPresets).toHaveLength(3);
    const invNames = merged.settings?.customInvestmentPresets?.map(i => i.name);
    expect(invNames).toContain('Nifty 50 Index Fund');
    expect(invNames).toContain('Gold ETF');
    expect(invNames).toContain('US Tech ETF');

    expect(merged.settings?.customBigExpensePresets).toHaveLength(2);
    const bigNames = merged.settings?.customBigExpensePresets?.map(b => b.name);
    expect(bigNames).toContain('House Rent');
    expect(bigNames).toContain('Car EMI');
  });
});
