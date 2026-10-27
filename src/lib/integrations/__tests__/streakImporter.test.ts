import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { parseStreakBackup, mergeStreakDataIntoApp } from '../streakImporter';
import { useShadowTrackerStore } from '@/store';
import { dbService, STORES } from '@/lib/storage';

vi.mock('@/lib/oneDriveSync', () => ({
  triggerJsonDownload: vi.fn(),
}));

describe('streakImporter', () => {
  const sampleStreakJson = {
    app: 'streak',
    version: 2,
    exportedAt: '2026-03-01T10:00:00.000Z',
    categories: [
      { id: 'cat_work', name: 'Deep Work', color: 0xff3b82f6, icon: 'Briefcase' }
    ],
    todos: [
      {
        id: 'todo_1',
        text: 'Review pull request\nCheck code quality and tests',
        done: false,
        date: '2026-03-02',
        minutes: 630, // 10:30
        priority: 3, // high
        steps: [
          { text: 'Verify unit tests', done: true },
          { text: 'Check mobile responsiveness', done: false }
        ],
        tags: ['code', 'review'],
        project: 'Shadow App',
      },
      {
        id: 'todo_2',
        text: 'Completed task with no deadline',
        done: true,
        priority: 1, // low
        doneAt: '2026-03-01T12:00:00.000Z',
      }
    ],
    habits: [
      {
        id: 'habit_1',
        name: 'Morning Meditation',
        description: '15 mins mindfulness',
        category: 'cat_work',
        interval: 0, // daily
        completions: {
          '2026-03-01': { date: '2026-03-01', numberOfCompletions: 1 },
          '2026-02-28': { date: '2026-02-28', numberOfCompletions: 1 },
          '2026-02-27': { date: '2026-02-27', numberOfCompletions: 1 },
        },
        missReasons: {
          '2026-02-26': 'Travelled early'
        }
      },
      {
        id: 'habit_2',
        name: 'Gym Workout',
        interval: 3, // custom weekdays
        scheduleWeekdays: [1, 3, 5], // Mon, Wed, Fri
        completions: {
          '2026-03-01': 1
        }
      }
    ]
  };

  it('parses direct JSON string correctly and maps todos to Simple Tasks', async () => {
    const parsed = await parseStreakBackup(JSON.stringify(sampleStreakJson));

    expect(parsed.todos).toHaveLength(2);
    expect(parsed.habits).toHaveLength(2);
    expect(parsed.categories).toHaveLength(1);

    // Verify first todo mapping
    const t1 = parsed.todos[0];
    expect(t1.title).toBe('Review pull request');
    expect(t1.description).toBe('Check code quality and tests');
    expect(t1.isSimple).toBe(true);
    expect(t1.isCompleted).toBe(false);
    expect(t1.priority).toBe('high');
    expect(t1.dueDate).toBe('2026-03-02');
    expect(t1.scheduledTime).toBe('10:30');
    expect(t1.additionalDetails).toContain('Verify unit tests');
    expect(t1.additionalDetails).toContain('Check mobile responsiveness');

    // Verify second todo mapping
    const t2 = parsed.todos[1];
    expect(t2.title).toBe('Completed task with no deadline');
    expect(t2.isCompleted).toBe(true);
    expect(t2.status).toBe('done');
    expect(t2.priority).toBe('low');
    expect(t2.dueDate).toBe('');
    expect(t2.isSimple).toBe(true);

    // Verify habit mapping
    const h1 = parsed.habits[0];
    expect(h1.name).toBe('Morning Meditation');
    expect(h1.frequency).toBe('daily');
    expect(h1.completedDates).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(h1.longestStreak).toBe(3);
    expect(h1.missedReasons?.['2026-02-26']).toBe('Travelled early');

    // Verify habit with custom weekdays
    const h2 = parsed.habits[1];
    expect(h2.frequency).toBe('custom');
    expect(h2.customDays).toEqual([1, 3, 5]);
  });

  it('normalizes DD-MM-YYYY dates and resolves todoTags projects like the mobile app', async () => {
    const mobileStreakJson = {
      app: 'streak',
      version: 2,
      todoTags: [
        { id: 'tag_project_1', name: 'Self Improving' }
      ],
      todos: [
        {
          id: 'todo_cert',
          text: 'AWS Security Certification',
          done: false,
          date: '02-03-2026', // DD-MM-YYYY
          priority: 3,
          project: 'tag_project_1',
        }
      ],
      habits: [
        {
          id: 'habit_daily',
          name: 'Daily Shadow Tracker Update',
          interval: 0,
          completions: {
            '05-09-2026': { date: '05-09-2026', numberOfCompletions: 1 },
            '26-10-2026': { date: '26-10-2026', numberOfCompletions: 1 },
          }
        }
      ]
    };

    const parsed = await parseStreakBackup(JSON.stringify(mobileStreakJson));
    expect(parsed.todos[0].dueDate).toBe('2026-03-02');
    expect(parsed.todos[0].additionalDetails).toContain('Self Improving');

    expect(parsed.habits[0].completedDates).toContain('2026-09-05');
    expect(parsed.habits[0].completedDates).toContain('2026-10-26');
  });

  it('seamlessly parses actual mobile backup file from disk if present', async () => {
    const fs = await import('fs');
    const path = '/mnt/h/My Drive/Backup-Main/Personal&wellbeing/Wellbeing/App-data/Streak-Mobile/Streak backup';
    if (fs.existsSync(path)) {
      const buffer = fs.readFileSync(path);
      const parsed = await parseStreakBackup(buffer);
      expect(parsed.todos.length).toBeGreaterThan(0);
      expect(parsed.habits.length).toBeGreaterThan(0);
      expect(parsed.habits[0].completedDates).toContain('2026-10-26');
    }
  });

  it('parses .zip archive containing backup.json seamlessly', async () => {
    const zip = new JSZip();
    zip.file('backup.json', JSON.stringify(sampleStreakJson));
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    const parsed = await parseStreakBackup(zipBuffer);
    expect(parsed.todos).toHaveLength(2);
    expect(parsed.habits).toHaveLength(2);
  });

  it('merges streak data non-destructively and appends new simple tasks & habits', async () => {
    const putSpy = vi.spyOn(dbService, 'put').mockResolvedValue(undefined as any);
    const exportSpy = vi.spyOn(dbService, 'exportAllData').mockResolvedValue({
      version: '17.0.0',
      tasks: [],
      habits: [],
      dailyLogs: [],
      notes: [],
      reminders: [],
      categories: [],
      settings: {} as any,
      exportedAt: new Date().toISOString(),
    });

    // Mock initial store state
    useShadowTrackerStore.setState({
      tasks: [
        {
          id: 'existing_1',
          title: 'Existing Normal Task',
          isCompleted: false,
          dueDate: '2026-03-01',
          priority: 'medium',
          isRecurring: false,
          recurrencePattern: null,
          createdAt: '',
          updatedAt: '',
          isSoftDeleted: false,
        }
      ],
      habits: [
        {
          id: 'existing_habit_meditation',
          name: 'Morning Meditation',
          frequency: 'daily',
          completedDates: ['2026-02-20'],
          streakCount: 1,
          longestStreak: 1,
          createdAt: '',
          updatedAt: '',
          isSoftDeleted: false,
        }
      ],
      categories: [],
    });

    const parsed = await parseStreakBackup(JSON.stringify(sampleStreakJson));
    const summary = await mergeStreakDataIntoApp(parsed);

    expect(summary.tasksAdded).toBe(2);
    expect(summary.habitsAdded).toBe(1); // habit_2 is brand new
    expect(summary.habitsMerged).toBe(1); // 'Morning Meditation' merged with existing!

    // Verify store state has both existing and new tasks
    const state = useShadowTrackerStore.getState();
    expect(state.tasks).toHaveLength(3);
    expect(state.tasks.some(t => t.id === 'existing_1')).toBe(true);

    // Verify the merged habit combined the dates: 2026-02-20 from existing + streak dates!
    const mergedHabit = state.habits.find(h => h.name === 'Morning Meditation');
    expect(mergedHabit?.completedDates).toContain('2026-02-20');
    expect(mergedHabit?.completedDates).toContain('2026-03-01');

    putSpy.mockRestore();
    exportSpy.mockRestore();
  });

  it('gracefully updates existing task with matching name without creating duplicates', async () => {
    const putSpy = vi.spyOn(dbService, 'put').mockResolvedValue(undefined as any);

    // Initial state with task that has the exact title as in sampleStreakJson: "Review pull request"
    useShadowTrackerStore.setState({
      tasks: [
        {
          id: 'shadow_local_pr_review',
          title: 'Review pull request',
          isCompleted: false,
          priority: 'low',
          dueDate: '2026-02-01',
          isRecurring: false,
          recurrencePattern: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          isSoftDeleted: false,
        }
      ],
      habits: [],
      categories: [],
    });

    const parsed = await parseStreakBackup(JSON.stringify(sampleStreakJson));
    const summary = await mergeStreakDataIntoApp(parsed);

    // One task was updated ("Review pull request"), one was added ("Completed task with no deadline")
    expect(summary.tasksUpdated).toBe(1);
    expect(summary.tasksAdded).toBe(1);

    const state = useShadowTrackerStore.getState();
    // Only 2 tasks total, NOT 3 (no duplicate!)
    expect(state.tasks).toHaveLength(2);

    const updated = state.tasks.find(t => t.title === 'Review pull request');
    expect(updated).toBeDefined();
    expect(updated?.id).toBe('shadow_local_pr_review'); // Preserved local ID
    expect(updated?.priority).toBe('high'); // Updated from incoming source (priority 3)
    expect(updated?.dueDate).toBe('2026-03-02'); // Updated from incoming source

    putSpy.mockRestore();
  });
});
