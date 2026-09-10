import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup Mock LocalStorage and Window
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => storageMock[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    storageMock[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageMock[key];
  }),
  clear: vi.fn(() => {
    for (const k in storageMock) delete storageMock[k];
  }),
};

// Provide global window and localStorage
(global as any).window = {
  localStorage: mockLocalStorage,
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
(global as any).localStorage = mockLocalStorage;
(global as any).CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, params?: { detail: any }) {
    this.type = type;
    this.detail = params?.detail;
  }
};

import {
  DEFAULT_VIEW_PREFERENCES,
  getAllViewPreferences,
  getViewPreference,
  setViewPreference,
  resetAllViewPreferences,
} from '../viewPreferences';

describe('viewPreferences', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    resetAllViewPreferences();
  });

  it('returns default preferences when nothing is stored', () => {
    const prefs = getAllViewPreferences();
    expect(prefs.todoViewMode).toBe('list');
    expect(prefs.calendarViewMode).toBe('month');
    expect(prefs.healthActiveSubTab).toBe('vitality');
    expect(prefs.tasksWorkspaceView).toBe('list');
    expect(prefs.moneyViewMode).toBe('month');
    expect(prefs.habitsFilter).toBe('all');
    expect(prefs.lastActivePage).toBe('dashboard');
    expect(prefs.analyticsMatrixViewMode).toBe('month');
    expect(prefs.explorerFilter).toBe('all');
  });

  it('persists and retrieves updated viewMode for ToDo across navigation', () => {
    expect(getViewPreference('todoViewMode')).toBe('list');
    setViewPreference('todoViewMode', 'grid');
    expect(getViewPreference('todoViewMode')).toBe('grid');

    // Simulate navigating to calendar
    setViewPreference('lastActivePage', 'calendar');
    expect(getViewPreference('lastActivePage')).toBe('calendar');

    // Simulate coming back to ToDo
    setViewPreference('lastActivePage', 'todo');
    expect(getViewPreference('todoViewMode')).toBe('grid');
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('persists and retrieves calendar view mode across navigation', () => {
    expect(getViewPreference('calendarViewMode')).toBe('month');
    setViewPreference('calendarViewMode', 'week');
    expect(getViewPreference('calendarViewMode')).toBe('week');

    // Switch away and back
    setViewPreference('calendarViewMode', 'timeline');
    expect(getViewPreference('calendarViewMode')).toBe('timeline');
  });

  it('persists and retrieves health active sub-tab', () => {
    expect(getViewPreference('healthActiveSubTab')).toBe('vitality');
    setViewPreference('healthActiveSubTab', 'diet');
    expect(getViewPreference('healthActiveSubTab')).toBe('diet');

    setViewPreference('healthActiveSubTab', 'gym');
    expect(getViewPreference('healthActiveSubTab')).toBe('gym');

    setViewPreference('healthActiveSubTab', 'dashboard');
    expect(getViewPreference('healthActiveSubTab')).toBe('dashboard');
  });

  it('persists and retrieves tasks workspace and filter settings', () => {
    expect(getViewPreference('tasksWorkspaceView')).toBe('list');
    setViewPreference('tasksWorkspaceView', 'kanban');
    expect(getViewPreference('tasksWorkspaceView')).toBe('kanban');

    setViewPreference('tasksActiveTab', 'completed');
    expect(getViewPreference('tasksActiveTab')).toBe('completed');

    setViewPreference('tasksDateFilter', 'today');
    expect(getViewPreference('tasksDateFilter')).toBe('today');
  });

  it('persists and retrieves analytics matrix and explorer filters', () => {
    setViewPreference('analyticsMatrixViewMode', 'week');
    expect(getViewPreference('analyticsMatrixViewMode')).toBe('week');

    setViewPreference('explorerFilter', 'lifestyle');
    expect(getViewPreference('explorerFilter')).toBe('lifestyle');
  });

  it('resets all preferences back to defaults without data loss', () => {
    setViewPreference('todoViewMode', 'grid');
    setViewPreference('calendarViewMode', 'timeline');
    setViewPreference('healthActiveSubTab', 'gym');
    setViewPreference('lastActivePage', 'todo');
    setViewPreference('analyticsMatrixViewMode', 'week');

    expect(getViewPreference('todoViewMode')).toBe('grid');
    expect(getViewPreference('lastActivePage')).toBe('todo');

    resetAllViewPreferences();

    expect(getViewPreference('todoViewMode')).toBe(DEFAULT_VIEW_PREFERENCES.todoViewMode);
    expect(getViewPreference('calendarViewMode')).toBe(DEFAULT_VIEW_PREFERENCES.calendarViewMode);
    expect(getViewPreference('healthActiveSubTab')).toBe(DEFAULT_VIEW_PREFERENCES.healthActiveSubTab);
    expect(getViewPreference('lastActivePage')).toBe(DEFAULT_VIEW_PREFERENCES.lastActivePage);
    expect(getViewPreference('analyticsMatrixViewMode')).toBe(DEFAULT_VIEW_PREFERENCES.analyticsMatrixViewMode);
  });
});
