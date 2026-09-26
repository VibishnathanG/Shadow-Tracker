'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  StandaloneTodo,
  TodoSubtask,
  TodoFilterStatus,
  TodoFilterPriority,
  TodoSortOption,
} from './todoTypes';
import {
  getStoredTodos,
  saveStoredTodos,
  scheduleTodoNotification,
  cancelTodoNotification,
} from './todoStorage';
import Modal from '@/components/Modal';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { addDays, parseISO } from 'date-fns';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import { customDialogs } from '@/lib/dialogs';
import { useViewPreference } from '@/lib/viewPreferences';
import { useShadowTrackerStore } from '@/store';

export default function TodoFeature() {
  const [todos, setTodos] = useState<StandaloneTodo[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filters & Sorting (Persisted across page switches)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useViewPreference('todoStatusFilter') as [TodoFilterStatus, (v: TodoFilterStatus) => void];
  const [priorityFilter, setPriorityFilter] = useViewPreference('todoPriorityFilter') as [TodoFilterPriority, (v: TodoFilterPriority) => void];
  const [sortBy, setSortBy] = useViewPreference('todoSortBy') as [TodoSortOption, (v: TodoSortOption) => void];
  const [viewMode, setViewMode] = useViewPreference('todoViewMode') as ['list' | 'grid', (v: 'list' | 'grid') => void];
  const [showGraph, setShowGraph] = useViewPreference('todoShowGraph') as [boolean, (v: boolean | ((prev: boolean) => boolean)) => void];

  // Inline Microsoft To Do Style Input State
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlinePriority, setInlinePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [inlineDueDate, setInlineDueDate] = useState('');
  const [inlineDueTime, setInlineDueTime] = useState('');
  const [inlineEnableReminder, setInlineEnableReminder] = useState(false);
  const [inlineReminderTime, setInlineReminderTime] = useState('');
  const [inlineIsRecurring, setInlineIsRecurring] = useState(false);
  const [inlineRecurrencePattern, setInlineRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [inlineCustomDays, setInlineCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [inlineNotes, setInlineNotes] = useState('');
  const [inlineSubtasks, setInlineSubtasks] = useState<TodoSubtask[]>([]);
  const [inlineNewSubtaskInput, setInlineNewSubtaskInput] = useState('');
  const [isInlineOptionsOpen, setIsInlineOptionsOpen] = useState(false);
  const [inlineActiveTab, setInlineActiveTab] = useState<'none' | 'due' | 'reminder' | 'priority' | 'more'>('none');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<StandaloneTodo | null>(null);

  // Form State inside Edit Modal
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [editEnableReminder, setEditEnableReminder] = useState(false);
  const [editReminderTime, setEditReminderTime] = useState('');
  const [editCustomReminderExpanded, setEditCustomReminderExpanded] = useState(false);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [editCustomDays, setEditCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [editSubtasks, setEditSubtasks] = useState<TodoSubtask[]>([]);
  const [editNewSubtaskInput, setEditNewSubtaskInput] = useState('');

  // Inline Subtask Input on Cards
  const [expandedSubtaskTodoId, setExpandedSubtaskTodoId] = useState<string | null>(null);
  const [cardSubtaskInput, setCardSubtaskInput] = useState('');

  // Load ToDos from local storage
  useEffect(() => {
    setMounted(true);
    const loaded = getStoredTodos();
    setTodos(loaded);
  }, []);

  // Save ToDos to local storage whenever changed
  const updateTodosState = useCallback((newTodos: StandaloneTodo[]) => {
    setTodos(newTodos);
    saveStoredTodos(newTodos);
  }, []);

  // 15-Day Activity Graph calculation (optimized: single-pass O(N) bucketing)
  const last15DaysGraph = useMemo(() => {
    if (!showGraph) {
      return { days: [], maxVal: 1 };
    }

    const today = new Date();
    const dateList: Array<{ dateStr: string; label: string }> = [];
    const dateSet = new Set<string>();

    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      dateList.push({ dateStr, label });
      dateSet.add(dateStr);
    }

    const committedMap: Record<string, number> = {};
    const completedMap: Record<string, number> = {};

    // Single O(N) pass over todos
    todos.forEach(t => {
      const committedDate = t.dueDate || t.createdAt.substring(0, 10);
      if (dateSet.has(committedDate)) {
        committedMap[committedDate] = (committedMap[committedDate] || 0) + 1;
      }

      if (t.isCompleted) {
        const completedDate = t.dueDate || (t.updatedAt ? t.updatedAt.substring(0, 10) : t.createdAt.substring(0, 10));
        if (dateSet.has(completedDate)) {
          completedMap[completedDate] = (completedMap[completedDate] || 0) + 1;
        }
      }
    });

    const days = dateList.map(({ dateStr, label }) => ({
      dateStr,
      label,
      committed: committedMap[dateStr] || 0,
      completed: completedMap[dateStr] || 0,
    }));

    const maxVal = Math.max(1, ...days.map(d => Math.max(d.committed, d.completed)));
    return { days, maxVal };
  }, [todos, showGraph]);

  // Handle Microsoft To Do Inline Task Creation
  const handleInlineSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inlineTitle.trim();
    if (!trimmed) return;

    const nowStr = new Date().toISOString();
    const effectiveReminder = inlineEnableReminder && inlineReminderTime ? inlineReminderTime : undefined;

    const newTodo: StandaloneTodo = {
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: trimmed,
      description: inlineNotes.trim() || undefined,
      isCompleted: false,
      isStarred: false,
      priority: inlinePriority,
      dueDate: inlineDueDate || undefined,
      dueTime: inlineDueTime || undefined,
      reminderTime: effectiveReminder,
      isRecurring: inlineIsRecurring,
      recurrencePattern: inlineIsRecurring ? inlineRecurrencePattern : undefined,
      customDays: inlineIsRecurring && inlineRecurrencePattern === 'custom' ? inlineCustomDays : undefined,
      subtasks: inlineSubtasks,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (effectiveReminder) {
      const notifId = await scheduleTodoNotification(newTodo);
      newTodo.reminderNotificationId = notifId;
    }

    updateTodosState([newTodo, ...todos]);

    // Reset inline inputs cleanly
    setInlineTitle('');
    setInlineNotes('');
    setInlinePriority('medium');
    setInlineDueDate('');
    setInlineDueTime('');
    setInlineEnableReminder(false);
    setInlineReminderTime('');
    setInlineIsRecurring(false);
    setInlineSubtasks([]);
    setInlineNewSubtaskInput('');
    setIsInlineOptionsOpen(false);
    setInlineActiveTab('none');

    // Keep focus on input for seamless rapid entries
    if (inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  };

  // Add subtask to inline creation
  const handleAddInlineSubtask = () => {
    if (!inlineNewSubtaskInput.trim()) return;
    setInlineSubtasks(prev => [
      ...prev,
      {
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: inlineNewSubtaskInput.trim(),
        isCompleted: false,
      },
    ]);
    setInlineNewSubtaskInput('');
  };

  // Open Edit Modal for an existing ToDo
  const openEditModal = (todo: StandaloneTodo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDesc(todo.description || '');
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate || '');
    setEditDueTime(todo.dueTime || '');
    const hasReminder = Boolean(todo.reminderTime);
    setEditEnableReminder(hasReminder);
    setEditReminderTime(todo.reminderTime || '');
    setEditCustomReminderExpanded(hasReminder);
    setEditIsRecurring(Boolean(todo.isRecurring));
    setEditRecurrencePattern(todo.recurrencePattern || 'daily');
    setEditCustomDays(todo.customDays || [1, 2, 3, 4, 5]);
    setEditSubtasks(todo.subtasks || []);
    setEditNewSubtaskInput('');
    setIsEditModalOpen(true);
  };

  // Add/Remove subtask in Edit Modal
  const handleAddEditSubtask = () => {
    if (!editNewSubtaskInput.trim()) return;
    setEditSubtasks(prev => [
      ...prev,
      { id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7), title: editNewSubtaskInput.trim(), isCompleted: false },
    ]);
    setEditNewSubtaskInput('');
  };

  const handleRemoveEditSubtask = (id: string) => {
    setEditSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleEditSubtask = (id: string) => {
    setEditSubtasks(prev => prev.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  // Save Edit Modal Changes
  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    const nowStr = new Date().toISOString();
    const effectiveReminderTime = editEnableReminder && editReminderTime ? editReminderTime : undefined;

    let updatedNotifId = editingTodo.reminderNotificationId;
    const updatedTodo: StandaloneTodo = {
      ...editingTodo,
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      priority: editPriority,
      dueDate: editDueDate || undefined,
      dueTime: editDueTime || undefined,
      reminderTime: effectiveReminderTime,
      isRecurring: editIsRecurring,
      recurrencePattern: editIsRecurring ? editRecurrencePattern : undefined,
      customDays: editIsRecurring && editRecurrencePattern === 'custom' ? editCustomDays : undefined,
      subtasks: editSubtasks,
      updatedAt: nowStr,
    };

    if (effectiveReminderTime !== editingTodo.reminderTime) {
      if (editingTodo.reminderNotificationId) {
        await cancelTodoNotification(editingTodo.reminderNotificationId);
      }
      if (effectiveReminderTime) {
        updatedNotifId = await scheduleTodoNotification(updatedTodo);
        updatedTodo.reminderNotificationId = updatedNotifId;
      } else {
        updatedTodo.reminderNotificationId = undefined;
      }
    }

    const nextTodos = todos.map(t => t.id === editingTodo.id ? updatedTodo : t);
    updateTodosState(nextTodos);
    setIsEditModalOpen(false);
  };

  // Toggle ToDo Completion (with Recurrence Spawning)
  const handleToggleComplete = (id: string) => {
    let spawnedTodo: StandaloneTodo | null = null;

    const nextTodos = todos.map(t => {
      if (t.id === id) {
        const isCompleted = !t.isCompleted;
        if (isCompleted && t.reminderNotificationId) {
          cancelTodoNotification(t.reminderNotificationId);
        }

        // Handle Recurrence Spawning on Completion
        if (isCompleted && t.isRecurring) {
          const baseDateStr = t.dueDate || getTodayDateString();
          const baseDate = parseISO(baseDateStr);
          let nextDueDate = formatDateString(addDays(baseDate, 1));

          if (t.recurrencePattern === 'daily') {
            nextDueDate = formatDateString(addDays(baseDate, 1));
          } else if (t.recurrencePattern === 'weekly') {
            nextDueDate = formatDateString(addDays(baseDate, 7));
          } else if (t.recurrencePattern === 'monthly') {
            nextDueDate = formatDateString(addDays(baseDate, 30));
          } else if (t.recurrencePattern === 'custom' && t.customDays && t.customDays.length > 0) {
            let candidate = addDays(baseDate, 1);
            for (let i = 0; i < 7; i++) {
              if (t.customDays.includes(candidate.getDay())) {
                nextDueDate = formatDateString(candidate);
                break;
              }
              candidate = addDays(candidate, 1);
            }
          }

          spawnedTodo = {
            ...t,
            id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            dueDate: nextDueDate,
            isCompleted: false,
            reminderNotificationId: undefined,
            subtasks: (t.subtasks || []).map(s => ({ ...s, isCompleted: false })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          ...t,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    if (spawnedTodo) {
      updateTodosState([spawnedTodo, ...nextTodos]);
    } else {
      updateTodosState(nextTodos);
    }

    const toggled = todos.find(t => t.id === id);
    if (toggled) {
      const willBeCompleted = !toggled.isCompleted;
      useShadowTrackerStore.getState().addXp(willBeCompleted ? 25 : -25);
      useShadowTrackerStore.getState().checkAndUnlockBadges();
    }
  };

  // Toggle Star / Pin
  const handleToggleStar = (id: string) => {
    const nextTodos = todos.map(t => {
      if (t.id === id) {
        return { ...t, isStarred: !t.isStarred, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    updateTodosState(nextTodos);
  };

  // Delete Single ToDo
  const handleDeleteTodo = async (id: string) => {
    const target = todos.find(t => t.id === id);
    if (target?.reminderNotificationId) {
      await cancelTodoNotification(target.reminderNotificationId);
    }
    const nextTodos = todos.filter(t => t.id !== id);
    updateTodosState(nextTodos);
  };

  // Clear All Completed ToDos
  const handleClearCompleted = async () => {
    const confirmed = await customDialogs.confirm({
      title: 'Clear Completed ToDos',
      message: 'Are you sure you want to clear all completed ToDos?',
      confirmLabel: 'Clear Done',
      isDanger: true,
    });
    if (!confirmed) return;

    const completedList = todos.filter(t => t.isCompleted);
    completedList.forEach(t => {
      if (t.reminderNotificationId) cancelTodoNotification(t.reminderNotificationId);
    });
    const nextTodos = todos.filter(t => !t.isCompleted);
    updateTodosState(nextTodos);
  };

  // Delete All ToDos
  const handleDeleteAll = async () => {
    const confirmed = await customDialogs.confirm({
      title: 'Delete All ToDos',
      message: 'Are you sure you want to delete ALL ToDos? This action cannot be undone.',
      confirmLabel: 'Delete All',
      isDanger: true,
    });
    if (!confirmed) return;

    todos.forEach(t => {
      if (t.reminderNotificationId) cancelTodoNotification(t.reminderNotificationId);
    });
    updateTodosState([]);
  };

  // Inline Subtask Toggle & Add on Card
  const handleToggleCardSubtask = (todoId: string, subtaskId: string) => {
    const nextTodos = todos.map(t => {
      if (t.id === todoId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s);
        return { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    updateTodosState(nextTodos);
  };

  const handleAddCardSubtask = (todoId: string) => {
    if (!cardSubtaskInput.trim()) return;
    const nextTodos = todos.map(t => {
      if (t.id === todoId) {
        const newSub: TodoSubtask = {
          id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          title: cardSubtaskInput.trim(),
          isCompleted: false,
        };
        return { ...t, subtasks: [...t.subtasks, newSub], updatedAt: new Date().toISOString() };
      }
      return t;
    });
    updateTodosState(nextTodos);
    setCardSubtaskInput('');
  };

  const handleDeleteCardSubtask = (todoId: string, subtaskId: string) => {
    const nextTodos = todos.map(t => {
      if (t.id === todoId) {
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId), updatedAt: new Date().toISOString() };
      }
      return t;
    });
    updateTodosState(nextTodos);
  };

  // Statistics Calculation
  const totalCount = todos.length;
  const completedCount = useMemo(() => todos.filter(t => t.isCompleted).length, [todos]);
  const activeCount = totalCount - completedCount;
  const starredCount = useMemo(() => todos.filter(t => t.isStarred).length, [todos]);
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered & Sorted ToDos (Without category)
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // Search (Title & Description only, no category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(q);
        const matchDesc = todo.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // Status Filter
      if (statusFilter === 'active' && todo.isCompleted) return false;
      if (statusFilter === 'completed' && !todo.isCompleted) return false;
      if (statusFilter === 'starred' && !todo.isStarred) return false;

      // Priority Filter
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;

      return true;
    }).sort((a, b) => {
      // Starred always pinned to top
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;

      if (sortBy === 'createdAt_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'createdAt_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority_desc') {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      if (sortBy === 'dueDate_asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [todos, searchQuery, statusFilter, priorityFilter, sortBy]);

  if (!mounted) return null;

  return (
    <div className="space-y-4 pb-12 relative">
      {/* Minimal One-Liner Header */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 py-1 px-0.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Micro Progress Bar & Percentage */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-elevated/80 border border-border/70 px-2 sm:px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
            <div className="w-10 sm:w-20 h-1.5 bg-secondary rounded-full overflow-hidden border border-border/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.35 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <span className="text-[11px] sm:text-xs font-black text-foreground">{completionPercent}%</span>
          </div>

          {/* Minimal One-Liner Metrics */}
          <div className="flex items-center gap-1 sm:gap-2 text-[10.5px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap shrink-0">
            <span>Total: <strong className="text-foreground font-bold">{totalCount}</strong></span>
            <span className="opacity-40">•</span>
            <span>Active: <strong className="text-amber-500 dark:text-amber-400 font-bold">{activeCount}</strong></span>
            <span className="opacity-40">•</span>
            <span>Done: <strong className="text-emerald-500 dark:text-emerald-400 font-bold">{completedCount}</strong></span>
            {starredCount > 0 && (
              <>
                <span className="opacity-40">•</span>
                <span>Starred: <strong className="text-cyan-400 font-bold">{starredCount}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Header Actions: Toggle Velocity Graph & Clear */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1">
          <button
            type="button"
            onClick={() => setShowGraph(prev => !prev)}
            className={`p-1.5 sm:px-2.5 sm:py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              showGraph
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs'
                : 'bg-surface-elevated/70 text-muted-foreground hover:text-foreground border-border/70'
            }`}
            title="Toggle 15-Day Velocity Graph"
          >
            <Lucide.TrendingUp size={13} className={showGraph ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'} />
            <span className="hidden sm:inline">{showGraph ? 'Hide Velocity' : 'Velocity'}</span>
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-surface-elevated/70 hover:bg-surface text-muted-foreground hover:text-foreground border border-border/70 transition-colors cursor-pointer"
              title="Clear Completed ToDos"
            >
              Clear Done
            </button>
          )}

          {totalCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="p-1.5 text-xs font-semibold rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400/80 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
              title="Delete All ToDos"
            >
              <Lucide.Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 15-Day Activity & Velocity Graph (Collapsible) */}
      <AnimatePresence>
        {showGraph && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1 overflow-hidden"
          >
            <div className="tile p-3 sm:p-4 rounded-2xl border border-border/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Lucide.TrendingUp size={13} className="text-emerald-500 dark:text-emerald-400" />
                  <span>15-Day Velocity & Completion History</span>
                </h4>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-300">
                    <span className="w-2 h-2 rounded-xs bg-cyan-500" />
                    <span>Committed</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    <span>Completed</span>
                  </span>
                </div>
              </div>

              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/70 rounded-2xl px-3 sm:px-4 pt-3 pb-3.5 shadow-inner">
                <div className="gap-1 sm:gap-1.5 h-20 items-end pt-1 pb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                  {last15DaysGraph.days.map((item, idx) => {
                    const committedPct = Math.round((item.committed / last15DaysGraph.maxVal) * 100);
                    const completedPct = Math.round((item.completed / last15DaysGraph.maxVal) * 100);
                    const isToday = idx === 14;

                    return (
                      <div
                        key={item.dateStr}
                        className="flex flex-col items-center justify-between h-full group/bar relative pt-1"
                      >
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-surface-elevated border border-border/80 text-foreground px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap shadow-xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-20">
                          <span className="text-emerald-500">{item.label}</span>: {item.committed} committed, {item.completed} done
                        </div>

                        <div className="w-full flex-1 flex items-end justify-center gap-0.5 min-h-[36px] pb-1">
                          <div
                            className={`w-1 sm:w-2 rounded-t-xs transition-all duration-300 ${
                              item.committed > 0
                                ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-xs shadow-cyan-400/40'
                                : 'bg-surface/50'
                            }`}
                            style={{ height: `${item.committed > 0 ? Math.max(18, committedPct) : 4}%` }}
                          />
                          <div
                            className={`w-1 sm:w-2 rounded-t-xs transition-all duration-300 ${
                              item.completed > 0
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs shadow-emerald-500/40'
                                : 'bg-surface/50'
                            }`}
                            style={{ height: `${item.completed > 0 ? Math.max(18, completedPct) : 4}%` }}
                          />
                        </div>

                        <span className={`text-[9px] sm:text-[10px] font-black tracking-tight truncate leading-none shrink-0 py-0.5 ${isToday ? 'text-emerald-500 dark:text-emerald-400 font-extrabold' : 'text-secondary'}`}>
                          {isToday ? 'Today' : item.label.split('/')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microsoft To Do Style Persistent Inline Task Creator */}
      <div className="bg-surface/90 border border-emerald-500/30 hover:border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2.5 sm:p-3 shadow-md transition-all relative z-20">
        <form onSubmit={handleInlineSubmit} className="space-y-2">
          {/* Primary Input Line */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (inlineTitle.trim()) {
                  handleInlineSubmit();
                } else if (inlineInputRef.current) {
                  inlineInputRef.current.focus();
                }
              }}
              className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 transition-all cursor-pointer"
              title="Add ToDo"
            >
              <Lucide.Plus size={17} className="stroke-[2.5]" />
            </button>

            <input name="inline-todo-input" 
              ref={inlineInputRef}
              type="text"
              maxLength={120}
              placeholder="Add a ToDo..."
              value={inlineTitle}
              onChange={e => setInlineTitle(e.target.value)}
              className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-foreground placeholder-muted-foreground/60 outline-none px-1.5 py-1 min-w-0"
            />

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Priority Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextPriority = inlinePriority === 'medium' ? 'high' : inlinePriority === 'high' ? 'low' : 'medium';
                  setInlinePriority(nextPriority);
                }}
                className={`hidden sm:flex px-2 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  inlinePriority === 'high'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/35'
                    : inlinePriority === 'medium'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35'
                    : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/35'
                }`}
                title={`Priority: ${inlinePriority.toUpperCase()} (Click to cycle)`}
              >
                {inlinePriority === 'high' ? '🔥 High' : inlinePriority === 'medium' ? '⚡ Med' : '☕ Low'}
              </button>

              {/* Expand More Options */}
              <button
                type="button"
                onClick={() => setIsInlineOptionsOpen(prev => !prev)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer relative ${
                  isInlineOptionsOpen
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                    : (inlineDueDate || inlineEnableReminder || inlinePriority !== 'low')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground border-border/60 hover:bg-surface-elevated'
                }`}
                title={isInlineOptionsOpen ? 'Collapse options' : 'More task options'}
              >
                <Lucide.SlidersHorizontal size={14} />
                {(inlineDueDate || inlineEnableReminder || inlinePriority !== 'low') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                )}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inlineTitle.trim()}
                className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-35 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0 ml-0.5 sm:ml-1"
              >
                Add
              </button>
            </div>
          </div>

          {/* Expandable Inline Configuration Tray */}
          <AnimatePresence>
            {isInlineOptionsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-border/50 space-y-3 overflow-hidden text-xs"
              >
                {/* Due Date & Time Section */}
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 text-[10px]">
                    <Lucide.Calendar size={12} className="text-emerald-400" />
                    <span>Due Date & Time</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick date pills */}
                    <button
                      type="button"
                      onClick={() => setInlineDueDate(getTodayDateString())}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        inlineDueDate === getTodayDateString()
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineDueDate(formatDateString(addDays(parseISO(getTodayDateString()), 1)))}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        inlineDueDate === formatDateString(addDays(parseISO(getTodayDateString()), 1))
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineDueDate(formatDateString(addDays(parseISO(getTodayDateString()), 7)))}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        inlineDueDate === formatDateString(addDays(parseISO(getTodayDateString()), 7))
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground border-border/60'
                      }`}
                    >
                      Next Week
                    </button>

                    <input name="inline-todo-input" 
                      type="date"
                      value={inlineDueDate}
                      onChange={e => setInlineDueDate(e.target.value)}
                      className="px-2.5 py-1 bg-secondary rounded-lg border border-border text-foreground font-medium outline-none focus:border-emerald-500"
                    />

                    <input name="inline-todo-input" 
                      type="time"
                      value={inlineDueTime}
                      onChange={e => setInlineDueTime(e.target.value)}
                      className="px-2.5 py-1 bg-secondary rounded-lg border border-border text-foreground font-medium outline-none focus:border-emerald-500"
                    />

                    {inlineDueDate && (
                      <button
                        type="button"
                        onClick={() => { setInlineDueDate(''); setInlineDueTime(''); }}
                        className="p-1 text-muted-foreground hover:text-rose-400"
                        title="Clear Due Date"
                      >
                        <Lucide.X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reminder Notification Section */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input name="inline-todo-input" 
                      type="checkbox"
                      checked={inlineEnableReminder}
                      onChange={e => {
                        const checked = e.target.checked;
                        setInlineEnableReminder(checked);
                        if (checked) {
                          if (inlineDueDate) {
                            setInlineReminderTime(`${inlineDueDate}T${inlineDueTime || '09:00'}`);
                          } else {
                            setInlineReminderTime(`${getTodayDateString()}T09:00`);
                          }
                        } else {
                          setInlineReminderTime('');
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-secondary border-border cursor-pointer"
                    />
                    <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <Lucide.Bell size={13} className="text-cyan-400" />
                      Enable Notification Alert
                    </span>
                  </label>

                  {inlineEnableReminder && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const date = inlineDueDate || getTodayDateString();
                            setInlineReminderTime(`${date}T${inlineDueTime || '09:00'}`);
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            inlineReminderTime === `${inlineDueDate || getTodayDateString()}T${inlineDueTime || '09:00'}`
                              ? 'bg-emerald-500 text-black border-emerald-400'
                              : 'bg-secondary/70 text-muted-foreground hover:text-foreground border-border/50'
                          }`}
                        >
                          🔔 At Due Time ({inlineDueTime || '09:00'})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const date = inlineDueDate || getTodayDateString();
                            setInlineReminderTime(`${date}T09:00`);
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            inlineReminderTime === `${inlineDueDate || getTodayDateString()}T09:00`
                              ? 'bg-emerald-500 text-black border-emerald-400'
                              : 'bg-secondary/70 text-muted-foreground hover:text-foreground border-border/50'
                          }`}
                        >
                          🌅 Morning (09:00)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tomorrow = formatDateString(addDays(parseISO(getTodayDateString()), 1));
                            setInlineReminderTime(`${tomorrow}T09:00`);
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            inlineReminderTime.startsWith(formatDateString(addDays(parseISO(getTodayDateString()), 1)))
                              ? 'bg-emerald-500 text-black border-emerald-400'
                              : 'bg-secondary/70 text-muted-foreground hover:text-foreground border-border/50'
                          }`}
                        >
                          ⏭️ Tomorrow 09:00
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">Custom:</span>
                        <input name="inline-todo-input" 
                          type="datetime-local"
                          value={inlineReminderTime}
                          onChange={e => setInlineReminderTime(e.target.value)}
                          className="px-2 py-1 bg-secondary rounded-lg border border-border text-foreground text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Notes */}
                <div className="space-y-1 pt-2 border-t border-border/40">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Notes / Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Add details, links, or instructions..."
                    value={inlineNotes}
                    onChange={e => setInlineNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-secondary/80 rounded-xl border border-border text-foreground placeholder-muted-foreground/60 outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Optional Recurrence */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input name="inline-todo-input" 
                      type="checkbox"
                      checked={inlineIsRecurring}
                      onChange={e => setInlineIsRecurring(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-secondary border-border cursor-pointer"
                    />
                    <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                      <Lucide.Repeat size={13} className="text-emerald-400" />
                      Recurring Task
                    </span>
                  </label>

                  {inlineIsRecurring && (
                    <div className="p-2.5 bg-secondary/50 rounded-xl border border-border/50 space-y-2">
                      <select
                        value={inlineRecurrencePattern}
                        onChange={e => setInlineRecurrencePattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                        className="w-full px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg border border-border outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="daily">Every Day (Daily)</option>
                        <option value="weekly">Every Week (Weekly)</option>
                        <option value="monthly">Every Month (Monthly)</option>
                        <option value="custom">Custom Days</option>
                      </select>
                      {inlineRecurrencePattern === 'custom' && (
                        <ScheduleSelector
                          selectedDays={inlineCustomDays}
                          onChange={setInlineCustomDays}
                          label="Select Repeat Days"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Checklist Subtasks */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1">
                    <Lucide.ListChecks size={12} className="text-emerald-400" />
                    <span>Checklist Sub-tasks ({inlineSubtasks.length})</span>
                  </label>

                  {inlineSubtasks.length > 0 && (
                    <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                      {inlineSubtasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between gap-2 px-2.5 py-1 bg-secondary/60 rounded-lg border border-border/40">
                          <span className="text-xs font-medium text-foreground truncate">{sub.title}</span>
                          <button
                            type="button"
                            onClick={() => setInlineSubtasks(prev => prev.filter(s => s.id !== sub.id))}
                            className="text-muted-foreground hover:text-rose-400 p-0.5"
                          >
                            <Lucide.X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input name="inline-todo-input" 
                      type="text"
                      maxLength={80}
                      placeholder="Add sub-task item..."
                      value={inlineNewSubtaskInput}
                      onChange={e => setInlineNewSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInlineSubtask();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineSubtask}
                      className="px-3 py-1.5 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-lg border border-border transition-all cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Close Options Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInlineOptionsOpen(false)}
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Hide extra options
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Unified Compact Toolbar */}
      <div className="tile p-2.5 rounded-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center gap-2">
          {/* Status Filter Pills */}
          <div className="pill-group overflow-x-auto scrollbar-none flex-nowrap shrink-0">
            {(['all', 'active', 'completed', 'starred'] as TodoFilterStatus[]).map(tab => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`filter-pill text-xs px-3 ${isActive ? 'active' : ''}`}
                >
                  {tab === 'starred' ? '⭐ Starred' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Lucide.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={13} />
            <input name="inline-todo-input" 
              type="text"
              maxLength={80}
              placeholder="Search ToDos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs !pl-7 !pr-6 py-2 bg-surface-elevated rounded-xl border border-border/60 text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-lg"
              >
                <Lucide.X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
            {/* Priority Select */}
            <div className="relative shrink-0 w-28">
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as TodoFilterPriority)}
                className="w-full text-xs pl-2.5 pr-6 py-2 bg-surface-elevated rounded-xl border border-border/60 text-foreground outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="high">High (🔥)</option>
                <option value="medium">Medium (⚡)</option>
                <option value="low">Low (☕)</option>
              </select>
              <Lucide.ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
            </div>

            {/* Sort Select */}
            <div className="relative shrink-0 w-32">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as TodoSortOption)}
                className="w-full text-xs pl-2.5 pr-6 py-2 bg-surface-elevated rounded-xl border border-border/60 text-foreground outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all font-medium"
              >
                <option value="createdAt_desc">Sort: Newest</option>
                <option value="createdAt_asc">Sort: Oldest</option>
                <option value="priority_desc">Sort: Priority</option>
                <option value="dueDate_asc">Sort: Due Date</option>
                <option value="alphabetical">Sort: A-Z</option>
              </select>
              <Lucide.ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={12} />
            </div>

            {/* View Mode Toggle */}
            <div className="pill-group shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`filter-pill text-xs px-2.5 ${viewMode === 'list' ? 'active' : ''}`}
                title="List View"
              >
                <Lucide.ListFilter size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`filter-pill text-xs px-2.5 ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View"
              >
                <Lucide.LayoutGrid size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ToDo List Items Container */}
      {filteredTodos.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-surface/50 border border-border/50 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Lucide.CheckCircle2 size={20} />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {searchQuery ? 'No matching ToDos found' : 'All clear! No ToDos'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or priority filters.'
              : 'Type in the box above and press Enter to quickly add your next task.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View: High-Density Cards (Category-Free) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredTodos.map(todo => {
              const completedSubtasksCount = todo.subtasks.filter(s => s.isCompleted).length;
              const hasSubtasks = todo.subtasks.length > 0;

              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className={`p-3.5 bg-surface border rounded-2xl transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-lg ${
                    todo.isCompleted
                      ? 'opacity-65 bg-surface-elevated/50 border-border/40'
                      : todo.isStarred
                      ? 'border-cyan-500/50 shadow-cyan-500/10 bg-gradient-to-br from-cyan-950/20 to-surface'
                      : 'border-border/80 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Checkbox + Priority + Star (NO Category!) */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(todo.id)}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          todo.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-muted-foreground/60 hover:border-emerald-400 text-transparent hover:bg-emerald-500/10'
                        }`}
                      >
                        <Lucide.Check size={12} className="stroke-[3.5]" />
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-medium shrink-0 ${
                            todo.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                              : todo.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25'
                          }`}
                        >
                          {todo.priority === 'high' ? '🔥 High' : todo.priority === 'medium' ? '⚡ Med' : '☕ Low'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStar(todo.id)}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            todo.isStarred
                              ? 'text-amber-400 bg-amber-400/10'
                              : 'text-muted-foreground hover:text-amber-400'
                          }`}
                          title={todo.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Lucide.Star size={12} className={todo.isStarred ? 'fill-amber-400' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => handleToggleComplete(todo.id)}
                      className={`text-sm item-title line-clamp-2 leading-snug cursor-pointer select-none transition-all ${
                        todo.isCompleted
                          ? 'line-through'
                          : 'hover:text-emerald-400'
                      }`}
                    >
                      {todo.title}
                    </h4>

                    {/* Description */}
                    {todo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {todo.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Meta & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs mt-auto">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {(todo.dueDate || todo.dueTime) && (
                        <span className="text-[9.5px] font-medium text-muted-foreground flex items-center gap-1 bg-surface-elevated/70 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          <Lucide.Calendar size={10} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{todo.dueDate}</span>
                        </span>
                      )}
                      {hasSubtasks && (
                        <span className="text-[9.5px] font-medium text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                          <Lucide.ListChecks size={10} />
                          <span>{completedSubtasksCount}/{todo.subtasks.length}</span>
                        </span>
                      )}
                      {todo.reminderTime && (
                        <span className="text-[9.5px] text-cyan-400 flex items-center" title={`Alert: ${todo.reminderTime}`}>
                          <Lucide.Bell size={10} />
                        </span>
                      )}
                      {todo.isRecurring && (
                        <span className="text-[9.5px] text-emerald-400 flex items-center" title="Recurring task">
                          <Lucide.Repeat size={10} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(todo)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-surface-elevated transition-colors cursor-pointer"
                        title="Edit ToDo"
                      >
                        <Lucide.Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-1 text-muted-foreground hover:text-rose-400 rounded hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete ToDo"
                      >
                        <Lucide.Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List View: Full Detailed View with Subtasks (Category-Free) */
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filteredTodos.map(todo => {
              const completedSubtasksCount = todo.subtasks.filter(s => s.isCompleted).length;
              const hasSubtasks = todo.subtasks.length > 0;
              const isExpanded = expandedSubtaskTodoId === todo.id;

              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`group relative bg-surface hover:bg-surface-elevated/70 border rounded-2xl p-3 sm:p-4 transition-all shadow-sm ${
                    todo.isCompleted
                      ? 'border-border/40 opacity-70 bg-surface/50'
                      : todo.isStarred
                      ? 'border-cyan-500/50 shadow-cyan-500/10 bg-gradient-to-r from-cyan-950/20 to-surface'
                      : 'border-border/80 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(todo.id)}
                      className={`mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        todo.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'border-border/80 hover:border-emerald-400 text-transparent hover:bg-emerald-500/10'
                      }`}
                    >
                      <Lucide.Check size={13} className="stroke-[3]" />
                    </button>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        {/* Title */}
                        <h3
                          onClick={() => handleToggleComplete(todo.id)}
                          className={`text-sm sm:text-base item-title tracking-tight cursor-pointer select-none transition-all ${
                            todo.isCompleted
                              ? 'line-through'
                              : 'hover:text-emerald-400'
                          }`}
                        >
                          {todo.title}
                        </h3>

                        {/* Star & Edit Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleStar(todo.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              todo.isStarred
                                ? 'text-amber-400 bg-amber-400/10'
                                : 'text-muted-foreground hover:text-amber-400 hover:bg-surface-elevated'
                            }`}
                            title={todo.isStarred ? 'Unstar' : 'Star ToDo'}
                          >
                            <Lucide.Star size={15} className={todo.isStarred ? 'fill-amber-400' : ''} />
                          </button>

                          <button
                            onClick={() => openEditModal(todo)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                            title="Edit ToDo"
                          >
                            <Lucide.Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete ToDo"
                          >
                            <Lucide.Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {todo.description && (
                        <p className={`text-xs leading-relaxed ${todo.isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                          {todo.description}
                        </p>
                      )}

                      {/* Tags & Metadata Row (NO Category!) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                        {/* Priority Badge */}
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-medium shrink-0 ${
                            todo.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                              : todo.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25'
                          }`}
                        >
                          {todo.priority === 'high' ? '🔥 High' : todo.priority === 'medium' ? '⚡ Med' : '☕ Low'}
                        </span>

                        {/* Due Date & Time */}
                        {(todo.dueDate || todo.dueTime) && (
                          <span className="flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground bg-surface-elevated/70 px-1.5 py-0.5 rounded-md border border-border/40 shrink-0">
                            <Lucide.Calendar size={10} className="text-emerald-400 shrink-0" />
                            {todo.dueDate} {todo.dueTime}
                          </span>
                        )}

                        {/* Alarm Indicator */}
                        {todo.reminderTime && (
                          <span className="flex items-center gap-1 text-[9.5px] font-medium text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded-md border border-cyan-500/30 shrink-0" title={`Alarm: ${todo.reminderTime}`}>
                            <Lucide.Bell size={10} className="animate-pulse" />
                            <span>Alarm</span>
                          </span>
                        )}

                        {/* Recurrence Indicator */}
                        {todo.isRecurring && (
                          <span className="flex items-center gap-1 text-[9.5px] font-medium text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                            <Lucide.Repeat size={10} />
                            <span className="capitalize">{todo.recurrencePattern || 'recurring'}</span>
                          </span>
                        )}

                        {/* Subtasks Accordion Button */}
                        <button
                          onClick={() => setExpandedSubtaskTodoId(isExpanded ? null : todo.id)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            hasSubtasks
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                          }`}
                        >
                          <Lucide.ListChecks size={12} />
                          <span>Checklist {hasSubtasks ? `(${completedSubtasksCount}/${todo.subtasks.length})` : '+ Add'}</span>
                          <Lucide.ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Subtasks Collapsible Checklist */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2.5 pt-2.5 border-t border-border/50 space-y-2 overflow-hidden"
                          >
                            {/* Checklist Items */}
                            {todo.subtasks.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-surface-elevated rounded-lg transition-colors group/sub">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input name="inline-todo-input" 
                                    type="checkbox"
                                    checked={sub.isCompleted}
                                    onChange={() => handleToggleCardSubtask(todo.id, sub.id)}
                                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-surface-elevated border-border cursor-pointer"
                                  />
                                  <span className={`text-xs font-medium ${sub.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {sub.title}
                                  </span>
                                </label>
                                <button
                                  onClick={() => handleDeleteCardSubtask(todo.id, sub.id)}
                                  className="text-muted-foreground hover:text-rose-400 p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                >
                                  <Lucide.X size={13} />
                                </button>
                              </div>
                            ))}

                            {/* Add Inline Subtask */}
                            <div className="flex items-center gap-2 pt-1">
                              <input name="inline-todo-input" 
                                type="text"
                                placeholder="Add checklist item..."
                                value={expandedSubtaskTodoId === todo.id ? cardSubtaskInput : ''}
                                onChange={e => setCardSubtaskInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCardSubtask(todo.id);
                                  }
                                }}
                                className="flex-1 text-xs px-3 py-1.5 bg-surface-elevated rounded-xl border border-border/60 text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddCardSubtask(todo.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit ToDo Modal (Portaled via shared Modal to guarantee fixed background on Android) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Standalone ToDo"
        size="lg"
      >
        <form onSubmit={handleSaveEditModal} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title *</label>
              <span className="text-[10px] text-muted-foreground font-mono">{editTitle.length}/120</span>
            </div>
            <input name="inline-todo-input" 
              type="text"
              required
              maxLength={120}
              placeholder="What needs to be done?"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full text-base px-4 py-2.5 bg-secondary rounded-xl text-foreground font-semibold border border-border focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Description</label>
              <span className="text-[10px] text-muted-foreground font-mono">{editDesc.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Additional context or details..."
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-secondary rounded-xl text-foreground border border-border focus:border-emerald-500 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Priority Select (Category Removed) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
            <select
              value={editPriority}
              onChange={e => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full text-sm pl-4 pr-9 py-2.5 bg-secondary rounded-xl text-foreground font-semibold border border-border focus:border-emerald-500 outline-none appearance-none cursor-pointer"
            >
              <option value="low">Low Priority (☕)</option>
              <option value="medium">Medium Priority (⚡)</option>
              <option value="high">High Priority (🔥)</option>
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-9 text-muted-foreground pointer-events-none" size={16} />
          </div>

          {/* Recurrence Schedule Selector */}
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input name="inline-todo-input" 
                type="checkbox"
                checked={editIsRecurring}
                onChange={e => setEditIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-secondary border-border cursor-pointer"
              />
              <span className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <Lucide.Repeat size={14} className="text-emerald-400" />
                Enable ToDo Recurrence
              </span>
            </label>

            {editIsRecurring && (
              <div className="space-y-2.5 p-3 bg-secondary/40 rounded-2xl border border-border/50">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recurrence Rule</label>
                  <select
                    value={editRecurrencePattern}
                    onChange={e => setEditRecurrencePattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                    className="w-full text-xs font-bold px-3.5 py-2 bg-secondary text-foreground rounded-xl border border-border outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="daily">Every Single Day (Daily)</option>
                    <option value="weekly">Every Week (Weekly)</option>
                    <option value="monthly">Every Month (Monthly)</option>
                    <option value="custom">Custom Days Schedule</option>
                  </select>
                  <Lucide.ChevronDown size={14} className="absolute right-3.5 top-7 text-muted-foreground pointer-events-none" />
                </div>

                {editRecurrencePattern === 'custom' && (
                  <ScheduleSelector
                    selectedDays={editCustomDays}
                    onChange={setEditCustomDays}
                    label="Custom Days Schedule"
                  />
                )}
              </div>
            )}
          </div>

          {/* Subtasks Checklist Builder */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist Sub-tasks</label>
            
            {editSubtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {editSubtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/50 rounded-xl border border-border/40">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input name="inline-todo-input" 
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleEditSubtask(sub.id)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-surface-elevated border-border"
                      />
                      <span className={`text-xs font-medium ${sub.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditSubtask(sub.id)}
                      className="text-muted-foreground hover:text-rose-400 p-1"
                    >
                      <Lucide.X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask Input */}
            <div className="flex items-center gap-2 pt-1">
              <input name="inline-todo-input" 
                type="text"
                maxLength={80}
                placeholder="Add sub-task item..."
                value={editNewSubtaskInput}
                onChange={e => setEditNewSubtaskInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEditSubtask();
                  }
                }}
                className="flex-1 text-xs px-3.5 py-2 bg-secondary rounded-xl border border-border focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddEditSubtask}
                className="px-4 py-2 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border cursor-pointer"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Modal Buttons Footer */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
