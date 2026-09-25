'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ViewPreferences {
  // Navigation
  lastActivePage: string;

  // ToDo Feature
  todoViewMode: 'list' | 'grid';
  todoStatusFilter: 'all' | 'active' | 'completed' | 'starred';
  todoPriorityFilter: string;
  todoCategoryFilter: string;
  todoSortBy: string;
  todoShowGraph: boolean;

  // Calendar Feature
  calendarViewMode: 'month' | 'week' | 'timeline';

  // Tasks Feature
  tasksWorkspaceView: 'list' | 'planner' | 'kanban';
  tasksViewMode: 'list' | 'grid';
  tasksActiveTab: 'pending' | 'completed' | 'all';
  tasksDateFilter: 'all' | 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'month';
  tasksSelectedMonth: string;
  tasksPriorityFilter: string;
  tasksCategoryFilter: string;

  // Health Feature
  healthActiveSubTab: 'vitality' | 'diet' | 'gym' | 'dashboard';

  // Wealth Feature
  moneyViewMode: 'month' | 'week';

  // Habits Feature
  habitsFilter: 'all' | 'today' | 'yesterday' | 'tomorrow' | 'pending-today' | 'completed-today';

  // Wizard Feature
  wizardVibe: string;

  // Analytics Feature
  analyticsMatrixViewMode: 'month' | 'week';

  // Explorer Feature
  explorerFilter: 'all' | 'core' | 'lifestyle' | 'intelligence';
}

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  lastActivePage: 'dashboard',

  todoViewMode: 'list',
  todoStatusFilter: 'all',
  todoPriorityFilter: 'all',
  todoCategoryFilter: 'all',
  todoSortBy: 'createdAt_desc',
  todoShowGraph: false,

  calendarViewMode: 'month',

  tasksWorkspaceView: 'list',
  tasksViewMode: 'list',
  tasksActiveTab: 'pending',
  tasksDateFilter: 'all',
  tasksSelectedMonth: '',
  tasksPriorityFilter: 'all',
  tasksCategoryFilter: 'all',

  healthActiveSubTab: 'vitality',

  moneyViewMode: 'month',

  habitsFilter: 'all',

  wizardVibe: 'all',

  analyticsMatrixViewMode: 'month',

  explorerFilter: 'all',
};

const PREFERENCES_KEY = 'shadow_view_preferences_v1';
const RESET_EVENT = 'shadow_view_preferences_reset';
const CHANGE_EVENT = 'shadow_view_preference_changed';

// In-memory cache for instantaneous synchronous reads and fallback
let memoryCache: ViewPreferences | null = null;

export function getAllViewPreferences(): ViewPreferences {
  if (memoryCache) {
    return { ...memoryCache };
  }
  if (typeof window === 'undefined') return { ...DEFAULT_VIEW_PREFERENCES };
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache = { ...DEFAULT_VIEW_PREFERENCES, ...(parsed as Partial<ViewPreferences>) };
      return { ...memoryCache };
    }
  } catch (e) {
    console.error('Failed to load view preferences:', e);
  }
  memoryCache = { ...DEFAULT_VIEW_PREFERENCES };
  return { ...memoryCache };
}

export function getViewPreference<K extends keyof ViewPreferences>(key: K): ViewPreferences[K] {
  const prefs = getAllViewPreferences();
  return prefs[key] !== undefined ? prefs[key] : DEFAULT_VIEW_PREFERENCES[key];
}

export function setViewPreference<K extends keyof ViewPreferences>(key: K, value: ViewPreferences[K]): void {
  // Always update in-memory cache first
  if (!memoryCache) {
    getAllViewPreferences();
  }
  if (memoryCache) {
    memoryCache[key] = value;
  }

  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(memoryCache || { ...DEFAULT_VIEW_PREFERENCES, [key]: value });
    localStorage.setItem(PREFERENCES_KEY, serialized);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key, value } }));
  } catch (e) {
    console.error('Failed to save view preference:', e);
  }
}

export function resetAllViewPreferences(): void {
  memoryCache = { ...DEFAULT_VIEW_PREFERENCES };
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(DEFAULT_VIEW_PREFERENCES));
    window.dispatchEvent(new CustomEvent(RESET_EVENT, { detail: DEFAULT_VIEW_PREFERENCES }));
  } catch (e) {
    console.error('Failed to reset view preferences:', e);
  }
}

/**
 * React hook to read and write a persistent view/filter preference.
 * Remembers user choice across page switches and listens for global resets.
 */
export function useViewPreference<K extends keyof ViewPreferences>(
  key: K
): [ViewPreferences[K], (val: ViewPreferences[K] | ((prev: ViewPreferences[K]) => ViewPreferences[K])) => void] {
  const [value, setValue] = useState<ViewPreferences[K]>(() => getViewPreference(key));

  useEffect(() => {
    // Synchronize upon mount
    setValue(getViewPreference(key));

    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent<ViewPreferences>;
      if (customEvent.detail && customEvent.detail[key] !== undefined) {
        setValue(customEvent.detail[key]);
      } else {
        setValue(DEFAULT_VIEW_PREFERENCES[key]);
      }
    };

    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: keyof ViewPreferences; value: any }>;
      if (customEvent.detail && customEvent.detail.key === key) {
        setValue(prev => (prev === customEvent.detail.value ? prev : customEvent.detail.value));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === PREFERENCES_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed[key] !== undefined) {
            if (memoryCache) memoryCache[key] = parsed[key];
            setValue(parsed[key]);
          }
        } catch {}
      }
    };

    window.addEventListener(RESET_EVENT, handleReset);
    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(RESET_EVENT, handleReset);
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [key]);

  const update = useCallback(
    (action: ViewPreferences[K] | ((prev: ViewPreferences[K]) => ViewPreferences[K])) => {
      const current = getViewPreference(key);
      const next = typeof action === 'function' ? (action as (prev: ViewPreferences[K]) => ViewPreferences[K])(current) : action;
      // Synchronously write to memory cache & localStorage
      setViewPreference(key, next);
      // Synchronously update component state
      setValue(next);
    },
    [key]
  );

  return [value, update];
}
