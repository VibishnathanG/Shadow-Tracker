'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import EmptyState from '@/components/EmptyState';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { addDays, parseISO } from 'date-fns';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';

import { customDialogs } from '@/lib/dialogs';
import { useViewPreference } from '@/lib/viewPreferences';
import { useShadowTrackerStore } from '@/store';

const CATEGORY_PRESETS = ['Personal', 'Work', 'Urgent', 'Shopping', 'Quick', 'Health'];

export default function TodoFeature() {
  const [todos, setTodos] = useState<StandaloneTodo[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filters & Sorting (Persisted across page switches)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useViewPreference('todoStatusFilter') as [TodoFilterStatus, (v: TodoFilterStatus) => void];
  const [priorityFilter, setPriorityFilter] = useViewPreference('todoPriorityFilter') as [TodoFilterPriority, (v: TodoFilterPriority) => void];
  const [categoryFilter, setCategoryFilter] = useViewPreference('todoCategoryFilter') as [string, (v: string) => void];
  const [sortBy, setSortBy] = useViewPreference('todoSortBy') as [TodoSortOption, (v: TodoSortOption) => void];
  const [viewMode, setViewMode] = useViewPreference('todoViewMode') as ['list' | 'grid', (v: 'list' | 'grid') => void];
  const [showGraph, setShowGraph] = useViewPreference('todoShowGraph') as [boolean, (v: boolean | ((prev: boolean) => boolean)) => void];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<StandaloneTodo | null>(null);

  // Form State inside Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formReminderTime, setFormReminderTime] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [formCustomDays, setFormCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formSubtasks, setFormSubtasks] = useState<TodoSubtask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

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

  // 15-Day Activity Graph calculation
  const last15DaysGraph = useMemo(() => {
    const days: Array<{
      dateStr: string;
      label: string;
      committed: number;
      completed: number;
    }> = [];

    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      // Committed count: due date is dateStr, or created date is dateStr
      const committed = todos.filter(t => {
        if (t.dueDate) {
          return t.dueDate === dateStr;
        }
        return t.createdAt.substring(0, 10) === dateStr;
      }).length;

      // Completed count: completed and (due date is dateStr, or updated/created date is dateStr)
      const completed = todos.filter(t => {
        if (!t.isCompleted) return false;
        if (t.dueDate) {
          return t.dueDate === dateStr;
        }
        return t.updatedAt.substring(0, 10) === dateStr || t.createdAt.substring(0, 10) === dateStr;
      }).length;

      days.push({ dateStr, label, committed, completed });
    }

    const maxVal = Math.max(1, ...days.map(d => Math.max(d.committed, d.completed)));
    return { days, maxVal };
  }, [todos]);

  // Open Modal for Creation or Editing
  const openCreateModal = () => {
    setEditingTodo(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('medium');
    setFormCategory('Personal');
    setFormCustomCategory('');
    setFormDueDate('');
    setFormDueTime('');
    setFormReminderTime('');
    setFormIsRecurring(false);
    setFormRecurrencePattern('daily');
    setFormCustomDays([1, 2, 3, 4, 5]);
    setFormSubtasks([]);
    setNewSubtaskInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (todo: StandaloneTodo) => {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDesc(todo.description || '');
    setFormPriority(todo.priority);
    
    if (CATEGORY_PRESETS.includes(todo.category || '')) {
      setFormCategory(todo.category || 'Personal');
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(todo.category || '');
    }

    setFormDueDate(todo.dueDate || '');
    setFormDueTime(todo.dueTime || '');
    setFormReminderTime(todo.reminderTime || '');
    setFormIsRecurring(Boolean(todo.isRecurring));
    setFormRecurrencePattern(todo.recurrencePattern || 'daily');
    setFormCustomDays(todo.customDays || [1, 2, 3, 4, 5]);
    setFormSubtasks(todo.subtasks || []);
    setNewSubtaskInput('');
    setIsModalOpen(true);
  };

  // Add/Remove subtask in Modal Form
  const handleAddFormSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setFormSubtasks(prev => [
      ...prev,
      { id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7), title: newSubtaskInput.trim(), isCompleted: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveFormSubtask = (id: string) => {
    setFormSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleFormSubtask = (id: string) => {
    setFormSubtasks(prev => prev.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const finalCategory = formCategory === 'Custom' ? (formCustomCategory.trim() || 'General') : formCategory;
    const nowStr = new Date().toISOString();

    if (editingTodo) {
      // Edit Existing ToDo
      let updatedNotifId = editingTodo.reminderNotificationId;
      const updatedTodo: StandaloneTodo = {
        ...editingTodo,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        priority: formPriority,
        category: finalCategory,
        dueDate: formDueDate || undefined,
        dueTime: formDueTime || undefined,
        reminderTime: formReminderTime || undefined,
        isRecurring: formIsRecurring,
        recurrencePattern: formIsRecurring ? formRecurrencePattern : undefined,
        customDays: formIsRecurring && formRecurrencePattern === 'custom' ? formCustomDays : undefined,
        subtasks: formSubtasks,
        updatedAt: nowStr,
      };

      if (formReminderTime !== editingTodo.reminderTime) {
        if (editingTodo.reminderNotificationId) {
          await cancelTodoNotification(editingTodo.reminderNotificationId);
        }
        if (formReminderTime) {
          updatedNotifId = await scheduleTodoNotification(updatedTodo);
          updatedTodo.reminderNotificationId = updatedNotifId;
        } else {
          updatedTodo.reminderNotificationId = undefined;
        }
      }

      const nextTodos = todos.map(t => t.id === editingTodo.id ? updatedTodo : t);
      updateTodosState(nextTodos);
    } else {
      // Create New ToDo
      const newTodo: StandaloneTodo = {
        id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        isCompleted: false,
        isStarred: false,
        priority: formPriority,
        category: finalCategory,
        dueDate: formDueDate || undefined,
        dueTime: formDueTime || undefined,
        reminderTime: formReminderTime || undefined,
        isRecurring: formIsRecurring,
        recurrencePattern: formIsRecurring ? formRecurrencePattern : undefined,
        customDays: formIsRecurring && formRecurrencePattern === 'custom' ? formCustomDays : undefined,
        subtasks: formSubtasks,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      if (formReminderTime) {
        const notifId = await scheduleTodoNotification(newTodo);
        newTodo.reminderNotificationId = notifId;
      }

      updateTodosState([newTodo, ...todos]);
    }

    setIsModalOpen(false);
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
          let baseDate = parseISO(baseDateStr);
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

  // Mark All Complete / Active
  const handleToggleAllComplete = (targetStatus: boolean) => {
    const nextTodos = todos.map(t => ({
      ...t,
      isCompleted: targetStatus,
      updatedAt: new Date().toISOString(),
    }));
    updateTodosState(nextTodos);
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

  // Categories list for filter bar
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    todos.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [todos]);

  // Filtered & Sorted ToDos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(q);
        const matchDesc = todo.description?.toLowerCase().includes(q);
        const matchCategory = todo.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCategory) return false;
      }

      // Status Filter
      if (statusFilter === 'active' && todo.isCompleted) return false;
      if (statusFilter === 'completed' && !todo.isCompleted) return false;
      if (statusFilter === 'starred' && !todo.isStarred) return false;

      // Priority Filter
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;

      // Category Filter
      if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

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
  }, [todos, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Main Actions & Filters Header */}
      <div className="tile settings-tile p-4 sm:p-5 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="pill-group overflow-x-auto scrollbar-none">
            {(['all', 'active', 'completed', 'starred'] as TodoFilterStatus[]).map(tab => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`filter-pill ${isActive ? 'active' : ''}`}
                >
                  {tab === 'starred' ? '⭐ Starred' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Action Buttons & View Mode Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: List Details vs Grid View */}
            <div className="pill-group">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`filter-pill ${viewMode === 'list' ? 'active' : ''}`}
                title="List View with full details & subtasks"
              >
                <Lucide.ListFilter size={14} />
                <span>List Details</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`filter-pill ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View (view more tasks at once)"
              >
                <Lucide.LayoutGrid size={14} />
                <span>Grid View</span>
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={openCreateModal}
              className="btn-glass-pill active flex items-center gap-1.5 text-xs font-black py-2 px-3.5 shadow-md cursor-pointer"
            >
              <Lucide.Plus size={15} />
              <span>Add ToDo</span>
            </motion.button>

            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface-elevated hover:bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl border border-border transition-all cursor-pointer"
                title="Clear Completed ToDos"
              >
                <Lucide.CheckCheck size={14} />
                <span className="hidden sm:inline">Clear Done</span>
              </button>
            )}

            {totalCount > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                title="Delete All ToDos"
              >
                <Lucide.Trash2 size={14} />
                <span className="hidden sm:inline">Delete All</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Lucide.Search className="absolute left-3.5 top-3 text-muted-foreground pointer-events-none" size={16} />
            <input
              type="text"
              maxLength={80}
              placeholder="Search ToDos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm !pl-10 !pr-8 py-2.5 bg-surface-elevated rounded-xl border border-border/60 text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-lg"
              >
                <Lucide.X size={14} />
              </button>
            )}
          </div>

          {/* Priority Select */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as TodoFilterPriority)}
              className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl border border-border/60 text-foreground outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority (🔥)</option>
              <option value="medium">Medium Priority (⚡)</option>
              <option value="low">Low Priority (☕)</option>
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none" size={16} />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl border border-border/60 text-foreground outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none" size={16} />
          </div>

          {/* Sort By Select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as TodoSortOption)}
              className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl border border-border/60 text-foreground outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
            >
              <option value="createdAt_desc">Sort: Newest First</option>
              <option value="createdAt_asc">Sort: Oldest First</option>
              <option value="priority_desc">Sort: Highest Priority</option>
              <option value="dueDate_asc">Sort: Due Date</option>
              <option value="alphabetical">Sort: Alphabetical</option>
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* ToDo List Cards Container */}
      {filteredTodos.length === 0 ? (
        <EmptyState
          icon="CheckCircle2"
          title={searchQuery ? 'No matching ToDos found' : 'No ToDos yet'}
          description={
            searchQuery
              ? 'Try adjusting your search query or filters.'
              : 'Create your first standalone ToDo to start managing local tasks efficiently.'
          }
          actionLabel="Create ToDo"
          onAction={openCreateModal}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View: High-Density Compact Cards to View More ToDos at Once */
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
                    {/* Header: Checkbox + Category + Priority + Star */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
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

                        {todo.category && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-md truncate max-w-[110px] border border-border/40">
                            🏷️ {todo.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9.5px] ${
                            todo.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : todo.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
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
                          <Lucide.Star size={13} className={todo.isStarred ? 'fill-amber-400' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => handleToggleComplete(todo.id)}
                      className={`text-sm font-bold line-clamp-2 leading-snug cursor-pointer select-none transition-all ${
                        todo.isCompleted
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground hover:text-emerald-400'
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
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-surface-elevated px-1.5 py-0.5 rounded border border-border/40">
                          <Lucide.Calendar size={11} className="text-emerald-400" />
                          <span className="truncate">{todo.dueDate}</span>
                        </span>
                      )}
                      {hasSubtasks && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <Lucide.ListChecks size={11} />
                          <span>{completedSubtasksCount}/{todo.subtasks.length}</span>
                        </span>
                      )}
                      {todo.reminderTime && (
                        <span className="text-[10px] text-cyan-400 flex items-center" title="Alarm set">
                          <Lucide.Bell size={11} />
                        </span>
                      )}
                      {todo.isRecurring && (
                        <span className="text-[10px] text-emerald-400 flex items-center" title="Recurring">
                          <Lucide.Repeat size={11} />
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
        /* List View: Full Detailed View with Subtasks and Full Metadata */
        <div className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredTodos.map(todo => {
              const completedSubtasksCount = todo.subtasks.filter(s => s.isCompleted).length;
              const hasSubtasks = todo.subtasks.length > 0;
              const isExpanded = expandedSubtaskTodoId === todo.id;

              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative bg-surface hover:bg-surface-elevated/70 border rounded-2xl p-4 sm:p-5 transition-all shadow-md ${
                    todo.isCompleted
                      ? 'border-border/40 opacity-70 bg-surface/50'
                      : todo.isStarred
                      ? 'border-cyan-500/50 shadow-cyan-500/10 bg-gradient-to-r from-cyan-950/20 to-surface'
                      : 'border-border/80 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(todo.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        todo.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'border-border/80 hover:border-emerald-400 text-transparent hover:bg-emerald-500/10'
                      }`}
                    >
                      <Lucide.Check size={14} className="stroke-[3]" />
                    </button>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        {/* Title */}
                        <h3
                          onClick={() => handleToggleComplete(todo.id)}
                          className={`text-base font-bold tracking-tight cursor-pointer select-none transition-all ${
                            todo.isCompleted
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground hover:text-emerald-400'
                          }`}
                        >
                          {todo.title}
                        </h3>

                        {/* Star & Actions Right */}
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
                            <Lucide.Star size={16} className={todo.isStarred ? 'fill-amber-400' : ''} />
                          </button>

                          <button
                            onClick={() => openEditModal(todo)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                            title="Edit ToDo"
                          >
                            <Lucide.Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete ToDo"
                          >
                            <Lucide.Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {todo.description && (
                        <p className={`text-xs leading-relaxed ${todo.isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                          {todo.description}
                        </p>
                      )}

                      {/* Tags & Meta Info Row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                            todo.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : todo.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                          }`}
                        >
                          {todo.priority === 'high' ? '🔥 High' : todo.priority === 'medium' ? '⚡ Med' : '☕ Low'}
                        </span>

                        {/* Category Tag */}
                        {todo.category && (
                          <span className="px-2.5 py-0.5 rounded-md font-semibold text-[10px] bg-secondary/80 text-foreground/80 border border-border/50">
                            🏷️ {todo.category}
                          </span>
                        )}

                        {/* Due Date & Time */}
                        {(todo.dueDate || todo.dueTime) && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded-md border border-border/40">
                            <Lucide.Calendar size={12} className="text-emerald-400" />
                            {todo.dueDate} {todo.dueTime}
                          </span>
                        )}

                        {/* Alarm Indicator */}
                        {todo.reminderTime && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/30" title={`Alarm set for ${new Date(todo.reminderTime).toLocaleString()}`}>
                            <Lucide.Bell size={12} className="animate-pulse" />
                            <span>Alarm</span>
                          </span>
                        )}

                        {/* Recurrence Indicator */}
                        {todo.isRecurring && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30" title="Recurring ToDo item">
                            <Lucide.Repeat size={12} />
                            <span className="capitalize">{todo.recurrencePattern || 'recurring'}</span>
                          </span>
                        )}

                        {/* Subtasks Accordion Button */}
                        <button
                          onClick={() => setExpandedSubtaskTodoId(isExpanded ? null : todo.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            hasSubtasks
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                          }`}
                        >
                          <Lucide.ListChecks size={13} />
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
                            className="mt-3 pt-3 border-t border-border/50 space-y-2.5 overflow-hidden"
                          >
                            {/* Checklist Items */}
                            {todo.subtasks.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-surface-elevated rounded-lg transition-colors group/sub">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input
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
                              <input
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
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
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

      {/* Standalone ToDo Studio Overview & Graph Frame */}
      <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/8 blur-[90px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 shadow-xs shrink-0">
                <Lucide.CheckCircle2 size={18} />
              </span>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
                  Standalone ToDo Studio
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-full shrink-0 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Local Only
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid + Graph Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full sm:w-auto">
              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/80 rounded-2xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center min-w-0 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">Total</span>
                <span className="text-sm sm:text-base font-black text-foreground">{totalCount}</span>
              </div>
              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/80 rounded-2xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center min-w-0 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 block truncate">Active</span>
                <span className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400">{activeCount}</span>
              </div>
              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/80 rounded-2xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center min-w-0 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Done</span>
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">{completedCount}</span>
              </div>
              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/80 rounded-2xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center min-w-0 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block truncate">Star</span>
                <span className="text-sm sm:text-base font-black text-cyan-600 dark:text-cyan-400">{starredCount}</span>
              </div>
            </div>

            <button
              onClick={() => setShowGraph(prev => !prev)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-surface-elevated hover:bg-surface text-secondary hover:text-foreground text-xs font-bold rounded-2xl border border-border/80 transition-all cursor-pointer w-full sm:w-auto shrink-0 shadow-xs"
              title="Toggle 15-Day Graph"
            >
              <Lucide.TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span>{showGraph ? 'Hide Graph' : 'Show Graph'}</span>
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border/60 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-muted-foreground uppercase tracking-wider">Overall Progress</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{completionPercent}% ({completedCount}/{totalCount})</span>
            </div>
            <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden border border-border/70 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-md shadow-emerald-500/30"
              />
            </div>
          </div>
        )}

        {/* 15-Day Activity & Completion Graph (Collapsible & Compact) */}
        <AnimatePresence>
          {showGraph && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3.5 pt-3 border-t border-border/60 relative z-10 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Lucide.TrendingUp size={13} className="text-emerald-500 dark:text-emerald-400" />
                  <span>15-Day Activity & Completion Velocity</span>
                </h4>

                {/* Legend */}
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

              {/* Compact Dual Bar Activity Chart */}
              <div className="bg-surface-elevated/70 backdrop-blur-md border border-border/70 rounded-2xl px-3 sm:px-4 pt-3 pb-3.5 shadow-inner">
                <div className="gap-1 sm:gap-1.5 h-24 items-end pt-1 pb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                  {last15DaysGraph.days.map((item, idx) => {
                    const committedPct = Math.round((item.committed / last15DaysGraph.maxVal) * 100);
                    const completedPct = Math.round((item.completed / last15DaysGraph.maxVal) * 100);
                    const isToday = idx === 14;

                    return (
                      <div
                        key={item.dateStr}
                        className="flex flex-col items-center justify-between h-full group/bar relative pt-1"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-elevated border border-border/80 text-foreground px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap shadow-xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-20">
                          <span className="text-emerald-600 dark:text-emerald-400">{item.label}</span>: {item.committed} commit, {item.completed} done
                        </div>

                        {/* Dual Bars Container */}
                        <div className="w-full flex-1 flex items-end justify-center gap-0.5 min-h-[48px] pb-1">
                          {/* Committed Bar */}
                          <div
                            className={`w-1 sm:w-2 rounded-t-xs transition-all duration-300 ${
                              item.committed > 0
                                ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-xs shadow-cyan-400/40'
                                : 'bg-surface/50'
                            }`}
                            style={{ height: `${item.committed > 0 ? Math.max(18, committedPct) : 4}%` }}
                          />
                          {/* Completed Bar */}
                          <div
                            className={`w-1 sm:w-2 rounded-t-xs transition-all duration-300 ${
                              item.completed > 0
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs shadow-emerald-500/40'
                                : 'bg-surface/50'
                            }`}
                            style={{ height: `${item.completed > 0 ? Math.max(18, completedPct) : 4}%` }}
                          />
                        </div>

                        {/* X-Axis Date Label */}
                        <span className={`text-[9px] sm:text-[10px] font-black tracking-tight truncate leading-none shrink-0 py-0.5 ${isToday ? 'text-emerald-500 dark:text-emerald-400 font-extrabold' : 'text-secondary'}`}>
                          {isToday ? 'Today' : item.label.split('/')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create / Edit ToDo Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-surface border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <Lucide.CheckCircle2 size={20} />
                  </span>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {editingTodo ? 'Edit Standalone ToDo' : 'Create Standalone ToDo'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer"
                >
                  <Lucide.X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveModal} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title *</label>
                    <span className="text-[10px] text-muted-foreground font-mono">{formTitle.length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="What needs to be done?"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full text-base px-4 py-3 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Description</label>
                    <span className="text-[10px] text-muted-foreground font-mono">{formDesc.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Additional context or details..."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-secondary rounded-2xl text-foreground border border-border focus:border-emerald-500 focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Priority & Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority Select */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                    <select
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full text-sm pl-4 pr-9 py-3 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="low">Low Priority (☕)</option>
                      <option value="medium">Medium Priority (⚡)</option>
                      <option value="high">High Priority (🔥)</option>
                    </select>
                    <Lucide.ChevronDown className="absolute right-3.5 top-9 text-muted-foreground pointer-events-none" size={16} />
                  </div>

                  {/* Category Preset Select */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Tag</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full text-sm pl-4 pr-9 py-3 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    >
                      {CATEGORY_PRESETS.map(preset => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                      <option value="Custom">+ Custom Tag</option>
                    </select>
                    <Lucide.ChevronDown className="absolute right-3.5 top-9 text-muted-foreground pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Custom Category Input */}
                {formCategory === 'Custom' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Category Name</label>
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="e.g. Project Alpha"
                      value={formCustomCategory}
                      onChange={e => setFormCustomCategory(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-secondary rounded-xl text-foreground border border-border focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Due Date & Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={e => setFormDueDate(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-secondary rounded-xl text-foreground border border-border focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <NiceTimePicker
                    value={formDueTime}
                    onChange={setFormDueTime}
                    label="Due Time"
                  />
                </div>

                {/* Reminder Alarm DateTime */}
                <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Lucide.Bell size={14} />
                    <span>Notification Alarm Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formReminderTime}
                    onChange={e => setFormReminderTime(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-secondary rounded-xl text-foreground border border-border focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Schedules a dedicated local alarm notification for this ToDo item.
                  </p>
                </div>

                {/* Recurrence Schedule Selector */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formIsRecurring}
                      onChange={e => setFormIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-secondary border-border cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <Lucide.Repeat size={14} className="text-emerald-400" />
                      Enable ToDo Recurrence
                    </span>
                  </label>

                  {formIsRecurring && (
                    <div className="space-y-3 animate-fadeIn p-3.5 bg-secondary/40 rounded-2xl border border-border/50">
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recurrence Rule</label>
                        <select
                          value={formRecurrencePattern}
                          onChange={e => setFormRecurrencePattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                          className="w-full text-xs font-bold px-3.5 py-2.5 bg-secondary text-foreground rounded-xl border border-border outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                        >
                          <option value="daily">Every Single Day (Daily)</option>
                          <option value="weekly">Every Week (Weekly)</option>
                          <option value="monthly">Every Month (Monthly)</option>
                          <option value="custom">Custom Days Schedule</option>
                        </select>
                        <Lucide.ChevronDown size={14} className="absolute right-3.5 top-8 text-muted-foreground pointer-events-none" />
                      </div>

                      {formRecurrencePattern === 'custom' && (
                        <ScheduleSelector
                          selectedDays={formCustomDays}
                          onChange={setFormCustomDays}
                          label="Custom Days Schedule"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Subtasks Checklist Builder */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist Sub-tasks</label>
                  
                  {/* List of subtasks */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                    {formSubtasks.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/50 rounded-xl border border-border/40">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={sub.isCompleted}
                            onChange={() => handleToggleFormSubtask(sub.id)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-surface-elevated border-border"
                          />
                          <span className={`text-xs font-medium ${sub.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {sub.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormSubtask(sub.id)}
                          className="text-muted-foreground hover:text-rose-400 p-1"
                        >
                          <Lucide.X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Subtask Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={80}
                      placeholder="Add sub-task item..."
                      value={newSubtaskInput}
                      onChange={e => setNewSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFormSubtask();
                        }
                      }}
                      className="flex-1 text-xs px-3.5 py-2.5 bg-secondary rounded-xl border border-border focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddFormSubtask}
                      className="px-4 py-2.5 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Buttons Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {editingTodo ? 'Save Changes' : 'Create ToDo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
