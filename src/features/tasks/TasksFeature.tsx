'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { fireConfetti } from '@/lib/confetti';
import { useShadowTrackerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { format, addDays, parseISO } from 'date-fns';
import type { Task, TaskStatus, EisenhowerQuadrant } from '@/types';
import { calculateTaskExecutionTimes } from '@/lib/taskScheduling';
import { TaskPlannerView } from './TaskPlannerView';
import { TaskKanbanView } from './TaskKanbanView';
import { useViewPreference } from '@/lib/viewPreferences';

const TASK_STATUS_CONFIG = {
  done: { label: 'Done', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  in_progress: { label: 'In Progress', color: 'text-amber-800 dark:text-amber-400 bg-amber-500/10 border-amber-500/25' },
  todo: { label: 'To Do', color: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/25' },
} as const;

export const TasksFeature: React.FC = () => {
  const {
    tasks,
    categories,
    reminders,
    settings,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    addReminder,
    updateReminder,
    updateSettings,
  } = useShadowTrackerStore(
    useShallow(state => ({
      tasks: state.tasks,
      categories: state.categories,
      reminders: state.reminders,
      settings: state.settings,
      addTask: state.addTask,
      updateTask: state.updateTask,
      toggleTaskCompletion: state.toggleTaskCompletion,
      deleteTask: state.deleteTask,
      addReminder: state.addReminder,
      updateReminder: state.updateReminder,
      updateSettings: state.updateSettings,
    }))
  );

  // Top Workspace Switcher: 'list' vs 'planner' vs 'kanban' (Persisted)
  const [workspaceView, setWorkspaceView] = useViewPreference('tasksWorkspaceView') as ['list' | 'planner' | 'kanban', (v: 'list' | 'planner' | 'kanban') => void];

  const [activeTab, setActiveTab] = useViewPreference('tasksActiveTab') as ['pending' | 'completed' | 'all', (v: 'pending' | 'completed' | 'all') => void];
  const [dateFilter, setDateFilter] = useViewPreference('tasksDateFilter') as ['all' | 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'month', (v: 'all' | 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'month') => void];
  const [selectedMonth, setSelectedMonth] = useViewPreference('tasksSelectedMonth') as [string, (v: string) => void];

  // Available months for direct month selector (covering 2-year history to +1 year forward)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const now = new Date();
    for (let offset = -24; offset <= 12; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      list.push({ key, label });
    }
    return list;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useViewPreference('tasksPriorityFilter') as [string, (v: string) => void];
  const [categoryFilter, setCategoryFilter] = useViewPreference('tasksCategoryFilter') as [string, (v: string) => void];
  const [viewMode, setViewMode] = useViewPreference('tasksViewMode') as ['list' | 'grid', (v: 'list' | 'grid') => void];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Assignees & Default Setup
  const assignees = useMemo(() => {
    return settings?.taskAssignees && settings.taskAssignees.length > 0
      ? settings.taskAssignees
      : ['Shadow', 'Core Lead', 'Operator'];
  }, [settings?.taskAssignees]);

  const defaultAssignee = settings?.defaultAssignee || 'Shadow';

  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState(getTodayDateString());
  const [formDueDate, setFormDueDate] = useState(getTodayDateString());
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formScheduledTime, setFormScheduledTime] = useState('');
  const [formEstimatedHours, setFormEstimatedHours] = useState<number | string>(1);
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formQuadrant, setFormQuadrant] = useState<EisenhowerQuadrant>('not_urgent_important');
  const [formAssignee, setFormAssignee] = useState(defaultAssignee);
  const [formAdditionalDetails, setFormAdditionalDetails] = useState('');

  // Simple Task Notifications (Start & End)
  const [formNotifyOnStart, setFormNotifyOnStart] = useState(false);
  const [formNotifyOnEnd, setFormNotifyOnEnd] = useState(false);
  const [spillError, setSpillError] = useState<string | null>(null);

  // Daily Repeat Reminder State
  const [formEnableNotification, setFormEnableNotification] = useState(false);
  const [formNotifyTime, setFormNotifyTime] = useState('09:00');
  const [formNotifyDays, setFormNotifyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const parsedHours = useMemo(() => {
    if (typeof formEstimatedHours === 'number') return Math.max(1, Math.round(formEstimatedHours));
    const p = parseInt(formEstimatedHours, 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [formEstimatedHours]);

  const executionTimes = useMemo(() => {
    return calculateTaskExecutionTimes({
      startDate: formStartDate,
      dueDate: formDueDate,
      scheduledDate: formScheduledDate || formStartDate || formDueDate,
      scheduledTime: formScheduledTime || '09:00',
      estimatedHours: parsedHours,
    });
  }, [formStartDate, formDueDate, formScheduledDate, formScheduledTime, parsedHours]);

  // Keep viewingTask in sync with store tasks
  useEffect(() => {
    if (viewingTask) {
      const fresh = tasks.find(t => t.id === viewingTask.id);
      if (fresh) {
        setViewingTask(fresh);
      } else {
        setViewingTask(null);
      }
    }
  }, [tasks]);

  // Jump to task listener from Morning/Evening review
  useEffect(() => {
    const handleJump = (e: any) => {
      const taskId = e.detail?.taskId;
      if (taskId) {
        const found = tasks.find(t => t.id === taskId);
        if (found) {
          setViewingTask(found);
        }
      }
    };
    window.addEventListener('openTaskDetail' as any, handleJump);
    return () => window.removeEventListener('openTaskDetail' as any, handleJump);
  }, [tasks]);

  const handleAddAssignee = useCallback(() => {
    const trimmed = newAssigneeName.trim();
    if (!trimmed) return;
    if (assignees.includes(trimmed)) {
      setNewAssigneeName('');
      return;
    }
    const updated = [...assignees, trimmed];
    updateSettings({ taskAssignees: updated });
    setNewAssigneeName('');
  }, [assignees, newAssigneeName, updateSettings]);

  const handleRemoveAssignee = useCallback((nameToRemove: string) => {
    if (assignees.length <= 1) return;
    const updated = assignees.filter(a => a !== nameToRemove);
    const newDefault = defaultAssignee === nameToRemove ? (updated[0] || 'Shadow') : defaultAssignee;
    updateSettings({
      taskAssignees: updated,
      defaultAssignee: newDefault,
    });
  }, [assignees, defaultAssignee, updateSettings]);

  const handleSetDefaultAssignee = useCallback((name: string) => {
    updateSettings({ defaultAssignee: name });
  }, [updateSettings]);

  const openAddModal = useCallback((dueDate?: string, initialStatus?: TaskStatus, initialQuadrant?: EisenhowerQuadrant) => {
    const today = getTodayDateString();
    const initialDue = dueDate || today;
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormStartDate(today);
    setFormDueDate(initialDue);
    setFormScheduledDate(initialDue);
    setFormScheduledTime('09:00');
    setFormEstimatedHours(1);
    setFormPriority(initialQuadrant === 'urgent_important' ? 'high' : 'medium');
    setFormStatus(initialStatus || 'todo');
    setFormQuadrant(initialQuadrant || (initialStatus === 'done' ? 'not_urgent_important' : 'not_urgent_important'));
    setFormCategoryId('');
    setFormIsRecurring(false);
    setFormRecurrencePattern('daily');
    setFormAssignee(defaultAssignee);
    setFormAdditionalDetails('');
    setFormNotifyOnStart(false);
    setFormNotifyOnEnd(false);
    setFormEnableNotification(false);
    setFormNotifyTime('09:00');
    setFormNotifyDays([0, 1, 2, 3, 4, 5, 6]);
    setSpillError(null);
    setIsModalOpen(true);
  }, [defaultAssignee]);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    const initialStart = task.startDate || task.scheduledDate || task.dueDate || getTodayDateString();
    setFormStartDate(initialStart);
    setFormDueDate(task.dueDate);
    setFormScheduledDate(task.scheduledDate || task.dueDate || '');
    setFormScheduledTime(task.scheduledTime || '');
    const hours = task.estimatedHours ?? (task.estimatedMinutes ? Math.max(1, Math.round(task.estimatedMinutes / 60)) : 1);
    setFormEstimatedHours(hours);
    setFormPriority(task.priority);
    setFormStatus(task.status || (task.isCompleted ? 'done' : 'todo'));
    setFormQuadrant(
      task.matrixQuadrant || 
      (task.priority === 'high' ? 'urgent_important' : task.priority === 'medium' ? 'not_urgent_important' : 'urgent_not_important')
    );
    setFormCategoryId(task.categoryId || '');
    setFormIsRecurring(task.isRecurring);
    setFormRecurrencePattern(task.recurrencePattern || 'daily');
    setFormAssignee(task.assignee || defaultAssignee);
    setFormAdditionalDetails(task.additionalDetails || '');
    setFormNotifyOnStart(Boolean(task.notifyOnStart));
    setFormNotifyOnEnd(Boolean(task.notifyOnEnd));
    setSpillError(null);

    const existingReminder = reminders.find(r => r.taskId === task.id && r.reminderType !== 'task_start' && r.reminderType !== 'task_end');
    if (existingReminder) {
      setFormEnableNotification(existingReminder.isEnabled);
      setFormNotifyTime(existingReminder.time || '09:00');
      setFormNotifyDays(existingReminder.days || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setFormEnableNotification(false);
      setFormNotifyTime('09:00');
      setFormNotifyDays([0, 1, 2, 3, 4, 5, 6]);
    }

    setIsModalOpen(true);
  }, [reminders, defaultAssignee]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (executionTimes.isSpillover) {
      setSpillError(`Cannot save: Task duration spills past Due Date into ${executionTimes.spillFormatted}. Please click "Extend Due Date" or adjust hours.`);
      return;
    }

    try {
      const lines = formAdditionalDetails.split('\n');
      const cappedDetails = lines.length > 500 ? lines.slice(0, 500).join('\n') : formAdditionalDetails;

      const taskPayload = {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        startDate: formStartDate || undefined,
        dueDate: formDueDate,
        scheduledDate: formScheduledDate || undefined,
        scheduledTime: formScheduledTime.trim() || undefined,
        estimatedHours: parsedHours,
        estimatedMinutes: parsedHours * 60,
        priority: formPriority,
        categoryId: formCategoryId || undefined,
        isRecurring: formIsRecurring,
        recurrencePattern: formIsRecurring ? formRecurrencePattern : null,
        status: formStatus,
        matrixQuadrant: formQuadrant,
        isCompleted: formStatus === 'done',
        assignee: formAssignee.trim() || defaultAssignee,
        additionalDetails: cappedDetails.trim() ? cappedDetails : undefined,
        notifyOnStart: formNotifyOnStart,
        notifyOnEnd: formNotifyOnEnd,
      };

      let savedTaskId = editingTask?.id;
      if (editingTask) {
        await updateTask(editingTask.id, taskPayload);
      } else {
        const created = await addTask(taskPayload);
        savedTaskId = created?.id;
      }

      if (savedTaskId) {
        const existing = reminders.find(r => r.taskId === savedTaskId && r.reminderType !== 'task_start' && r.reminderType !== 'task_end');
        if (formEnableNotification) {
          if (existing) {
            await updateReminder(existing.id, {
              title: formTitle.trim(),
              time: formNotifyTime,
              days: formNotifyDays,
              isEnabled: true,
            });
          } else {
            await addReminder({
              title: formTitle.trim(),
              time: formNotifyTime,
              days: formNotifyDays,
              isEnabled: true,
              type: 'task',
              taskId: savedTaskId,
            });
          }
        } else if (existing) {
          await updateReminder(existing.id, { isEnabled: false });
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsModalOpen(false);
    }
  }, [formTitle, formDesc, formStartDate, formDueDate, formScheduledDate, formScheduledTime, parsedHours, executionTimes, formPriority, formCategoryId, formIsRecurring, formRecurrencePattern, formStatus, formQuadrant, formAssignee, formAdditionalDetails, defaultAssignee, formNotifyOnStart, formNotifyOnEnd, formEnableNotification, formNotifyTime, formNotifyDays, editingTask, updateTask, addTask, reminders, addReminder, updateReminder]);

  const handleSnooze = useCallback(async (id: string, dateStr: string) => {
    const nextDate = formatDateString(addDays(parseISO(dateStr), 1));
    await updateTask(id, { dueDate: nextDate });
  }, [updateTask]);

  const filteredTasks = useMemo(() => {
    const todayStr = getTodayDateString();
    const tomorrowStr = formatDateString(addDays(parseISO(todayStr), 1));
    const weekEndStr = formatDateString(addDays(parseISO(todayStr), 7));

    return tasks.filter(task => {
      if (activeTab === 'pending' && task.isCompleted) return false;
      if (activeTab === 'completed' && !task.isCompleted) return false;

      // Date Filtering
      if (dateFilter === 'today' && task.dueDate !== todayStr) return false;
      if (dateFilter === 'tomorrow' && task.dueDate !== tomorrowStr) return false;
      if (dateFilter === 'this-week' && (task.dueDate < todayStr || task.dueDate > weekEndStr)) return false;
      if (dateFilter === 'overdue' && (task.isCompleted || task.dueDate >= todayStr)) return false;
      if (dateFilter === 'month') {
        const targetMonth = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        if (!task.dueDate || !task.dueDate.startsWith(targetMonth)) return false;
      }

      if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) return false;

      return true;
    });
  }, [tasks, activeTab, dateFilter, selectedMonth, searchQuery, priorityFilter, categoryFilter]);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  return (
    <div className="space-y-6 relative min-h-[600px]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.05] mix-blend-screen flex items-center justify-center">
        <svg
          viewBox="0 0 800 800"
          className="w-full h-full max-w-[900px] text-primary animate-spin-cw [animation-duration:180s]"
        >
          <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="12 8" />
          <circle
            cx="400" cy="400" r="250"
            stroke="currentColor" strokeWidth="0.6" fill="none"
            strokeDasharray="6 14"
            className="animate-spin-ccw [animation-duration:90s]"
            style={{ transformOrigin: '400px 400px' }}
          />
          <circle
            cx="400" cy="400" r="150"
            stroke="currentColor" strokeWidth="0.5" fill="none"
            strokeDasharray="4 20"
            className="animate-spin-cw [animation-duration:60s]"
            style={{ transformOrigin: '400px 400px' }}
          />
          <circle cx="400" cy="400" r="3" fill="currentColor" opacity="0.4" />
          <line
            x1="50" y1="400" x2="750" y2="400"
            stroke="currentColor" strokeWidth="0.4"
            strokeDasharray="2 6"
          />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx={400 + 300 * Math.cos((deg * Math.PI) / 180)}
              cy={400 + 300 * Math.sin((deg * Math.PI) / 180)}
              r="4"
              fill="currentColor"
              opacity="0.3"
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Tasks Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsAssigneeModalOpen(true)}
            className="btn-glass-pill text-xs font-black py-2.5 px-3.5 shadow-md flex items-center gap-1.5 cursor-pointer border border-border/70 hover:border-primary/50 text-foreground"
            title="Manage Assignees & Default User"
          >
            <Lucide.Users size={16} className="text-primary" />
            <span>Assignees</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openAddModal()}
            className="btn-glass-pill active text-xs font-black py-2.5 px-4 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Lucide.Plus size={16} />
            <span>Create Task</span>
          </motion.button>
        </div>
      </div>

      {/* Workspace Sub-Tab Switcher */}
      <div className="w-full relative z-10">
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setWorkspaceView('list')}
            className={`filter-pill w-full sm:w-auto justify-center sm:justify-start gap-1.5 sm:gap-2.5 !py-2 !px-2 sm:!px-4 text-xs ${workspaceView === 'list' ? 'active' : ''}`}
          >
            <Lucide.ListFilter size={14} className={workspaceView === 'list' ? 'text-white shrink-0' : 'text-primary shrink-0'} />
            <span className="font-bold truncate">List</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceView('planner')}
            className={`filter-pill w-full sm:w-auto justify-center sm:justify-start gap-1.5 sm:gap-2.5 !py-2 !px-2 sm:!px-4 text-xs ${workspaceView === 'planner' ? 'active' : ''}`}
          >
            <Lucide.CalendarRange size={14} className={workspaceView === 'planner' ? 'text-white shrink-0' : 'text-sky-400 shrink-0'} />
            <span className="font-bold truncate">Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceView('kanban')}
            className={`filter-pill w-full sm:w-auto justify-center sm:justify-start gap-1.5 sm:gap-2.5 !py-2 !px-2 sm:!px-4 text-xs ${workspaceView === 'kanban' ? 'active' : ''}`}
          >
            <Lucide.Kanban size={14} className={workspaceView === 'kanban' ? 'text-white shrink-0' : 'text-purple-400 shrink-0'} />
            <span className="font-bold truncate">Kanban</span>
          </button>
        </div>
      </div>

      {workspaceView === 'planner' ? (
        <TaskPlannerView onOpenAddModal={openAddModal} onOpenEditModal={openEditModal} />
      ) : workspaceView === 'kanban' ? (
        <TaskKanbanView onOpenAddModal={openAddModal} onOpenEditModal={openEditModal} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface border border-border/60 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative z-10">
            <div className="sm:col-span-2 relative group">
              <Lucide.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none z-10" size={17} />
              <input
            type="text"
            maxLength={80}
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm !pl-11 pr-4 py-2.5 bg-surface-elevated rounded-xl border border-transparent focus:border-border hover:bg-surface-elevated/80 focus:bg-surface-elevated text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="relative group">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl border border-transparent text-secondary focus:text-foreground hover:bg-surface-elevated/80 cursor-pointer outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <Lucide.ChevronDown className="absolute right-3.5 top-3 text-secondary pointer-events-none group-hover:text-foreground transition-colors" size={16} />
        </div>

        <div className="relative group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl border border-transparent text-secondary focus:text-foreground hover:bg-surface-elevated/80 cursor-pointer outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Lucide.ChevronDown className="absolute right-3.5 top-3 text-secondary pointer-events-none group-hover:text-foreground transition-colors" size={16} />
        </div>
      </div>

      {/* Consolidated Single-Line Filter Toolbar (Status + Date Filters + View Mode) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 relative z-10">
        {/* Combined Pills: Status Tabs (Pending, Completed, All) + Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 min-w-0 max-w-full">
          {/* Status Tabs */}
          <div className="pill-group shrink-0">
            {(['pending', 'completed', 'all'] as const).map(tab => {
              const isActive = activeTab === tab;
              const pendingCount = tasks.filter(t => !t.isCompleted).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`filter-pill ${isActive ? 'active' : ''}`}
                >
                  <span className="capitalize">{tab}</span>
                  {tab === 'pending' && pendingCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                      isActive ? 'bg-black/20 text-slate-100' : 'bg-primary/15 text-primary'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-[1px] bg-border/60 mx-0.5 shrink-0" />

          {/* Date Filters */}
          <div className="pill-group shrink-0">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'this-week', label: 'This Week' },
              { id: 'overdue', label: 'Overdue' },
            ].map(df => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id as typeof dateFilter)}
                className={`filter-pill ${dateFilter === df.id ? 'active' : ''}`}
              >
                {df.label}
              </button>
            ))}

            {/* Specific Month Chooser Filter */}
            <div
              className={`filter-pill relative flex items-center gap-1 cursor-pointer shrink-0 ${dateFilter === 'month' ? 'active' : ''}`}
              title="Filter tasks by specific month"
            >
              <Lucide.CalendarDays size={12} className={dateFilter === 'month' ? 'text-slate-100' : 'text-primary'} />
              <span className="text-xs font-semibold whitespace-nowrap">
                {(() => {
                  const currentDefault = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  const mVal = selectedMonth || currentDefault;
                  try {
                    return format(parseISO(`${mVal}-01`), 'MMM yyyy');
                  } catch {
                    return 'Month';
                  }
                })()}
              </span>
              <Lucide.ChevronDown size={10} className="opacity-70 shrink-0" />
              <select
                value={dateFilter === 'month' ? (selectedMonth || '') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    setDateFilter('month');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Filter tasks by specific month"
              >
                <option value="" disabled>Select Specific Month</option>
                {availableMonths.map(m => (
                  <option key={m.key} value={m.key} className="bg-surface text-foreground font-semibold text-xs">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Toggle: List Details vs Grid View */}
        <div className="pill-group shrink-0 self-center">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`filter-pill ${viewMode === 'list' ? 'active' : ''}`}
            title="List View with full details"
          >
            <Lucide.ListFilter size={13} />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`filter-pill ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid View (view more tasks at once)"
          >
            <Lucide.LayoutGrid size={13} />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Task Items: Grid vs List Rendering */}
      {filteredTasks.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View: High-Density Cards to View More Tasks at Once */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
            {filteredTasks.map((task) => {
              const taskCategory = task.categoryId ? categoryMap.get(task.categoryId) : undefined;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setViewingTask(task)}
                  className={`p-3.5 bg-surface border border-border/80 hover:border-primary/50 hover:shadow-lg rounded-2xl transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    task.isCompleted ? 'opacity-65 bg-surface-elevated/50 border-border/30' : ''
                  }`}
                >
                    <div className="space-y-2">
                      {/* Line 1: Checkbox + Assignee (left) & Category (right) */}
                      <div className="flex items-center justify-between gap-1.5 w-full flex-nowrap overflow-hidden">
                        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const willComplete = !task.isCompleted;
                              const todayStr = getTodayDateString();
                              const prevFocus = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr)?.focusScore ?? 0;
                              await toggleTaskCompletion(task.id);
                              if (willComplete) {
                                fireConfetti();
                                const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr);
                                const newFocus = freshLog?.focusScore ?? prevFocus;
                                const diff = newFocus - prevFocus;
                                window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                                  detail: { title: 'Node Resolved', subtitle: task.title, flowText: diff > 0 ? `+${diff}% Flow` : `${newFocus}% Flow`, type: 'task' }
                                }));
                              }
                            }}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              task.isCompleted
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xs'
                                : 'border-2 border-muted-foreground/60 hover:border-emerald-500 hover:bg-emerald-500/10'
                            }`}
                          >
                            {task.isCompleted && <Lucide.Check size={12} className="stroke-[3.5]" />}
                          </button>

                          {/* Label 1: Assignee */}
                          <span className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 max-w-[120px]" title={`Assignee: ${task.assignee || defaultAssignee}`}>
                            <Lucide.User size={11} className="shrink-0 opacity-75" />
                            <span className="truncate">{task.assignee || defaultAssignee}</span>
                          </span>
                        </div>

                        {/* Label 2: Category (top-right) */}
                        {taskCategory ? (
                          <span className="text-[11px] font-medium text-muted-foreground hidden min-[240px]:inline-flex items-center gap-1.5 bg-surface-elevated/90 border border-border/60 px-2 py-0.5 rounded-full shrink-0 truncate max-w-[130px] ml-auto" title={`Category: ${taskCategory.name}`}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: taskCategory.color }} />
                            <span className="truncate">{taskCategory.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground/70 hidden min-[240px]:inline-flex items-center gap-1.5 bg-surface-elevated/70 border border-border/50 px-2 py-0.5 rounded-full shrink-0 truncate ml-auto">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
                            <span>General</span>
                          </span>
                        )}
                      </div>

                      {/* Line 2: Kanban Progress (bottom-left) & Priority (bottom-right) */}
                      <div className="flex items-center justify-between gap-1.5 w-full flex-nowrap overflow-hidden">
                        {/* Label 3: Kanban Progress */}
                        {(() => {
                          const status = task.status || (task.isCompleted ? 'done' : 'todo');
                          const statusConfig = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.todo;

                          return (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.color} shrink-0 hidden min-[220px]:inline-flex`}>
                              {statusConfig.label}
                            </span>
                          );
                        })()}

                        {/* Label 4: Priority / Severity */}
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ml-auto ${
                          task.priority === 'high' 
                            ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25' 
                            : task.priority === 'medium' 
                            ? 'text-amber-800 dark:text-amber-400 bg-amber-500/10 border-amber-500/25' 
                            : 'text-slate-700 dark:text-muted-foreground bg-muted-foreground/10 border-border/30'
                        }`}>
                          {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                        </span>
                      </div>

                      <h4 className={`text-sm item-title line-clamp-2 leading-snug ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs mt-auto">
                      {/* Label 5: Due Date */}
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 bg-surface-elevated/80 border border-border/60 px-2 py-0.5 rounded-full shrink-0">
                        <Lucide.Calendar size={11} className="text-primary/70 shrink-0" /> {format(new Date(task.dueDate), 'MMM dd')}
                      </span>
                    <div className="flex items-center gap-1">
                      {!task.isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSnooze(task.id, task.dueDate);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated transition-colors"
                          title="Snooze 1 Day"
                        >
                          <Lucide.Clock size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(task);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated transition-colors"
                        title="Edit Task"
                      >
                        <Lucide.Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                        title="Delete Task"
                      >
                        <Lucide.Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View: Full Detailed Cards */
          <div className="space-y-3 relative z-10">
            {filteredTasks.map((task) => {
              const taskCategory = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, scale: 1.005 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  onClick={() => setViewingTask(task)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-border/80 hover:border-primary/50 hover:shadow-lg rounded-2xl transition-all duration-150 gap-4 cursor-pointer ${
                    task.isCompleted ? 'opacity-65 bg-surface-elevated/50 border-border/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <motion.button
                      layout
                      whileTap={{ scale: 0.9 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const willComplete = !task.isCompleted;
                        const todayStr = getTodayDateString();
                        const prevFocus = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr)?.focusScore ?? 0;
                        
                        await toggleTaskCompletion(task.id);
                        
                        if (willComplete) {
                          fireConfetti();
                          const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr);
                          const newFocus = freshLog?.focusScore ?? prevFocus;
                          const focusDiff = newFocus - prevFocus;
                          const flowGainText = focusDiff > 0 ? `+${focusDiff}% Flow State` : `${newFocus}% Flow State`;

                          window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                            detail: {
                              title: 'Node Resolved',
                              subtitle: task.title,
                              flowText: flowGainText,
                              type: 'task'
                            }
                          }));
                        }
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 relative shrink-0 ${
                        task.isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'border-2 border-muted-foreground/60 hover:border-emerald-500/80 hover:bg-emerald-500/10'
                      }`}
                    >
                      {task.isCompleted && (
                        <motion.span
                          key={task.id + "_pulse"}
                          initial={{ scale: 0.6, opacity: 0.9 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none"
                        />
                      )}
                      <motion.div
                        initial={false}
                        animate={
                          task.isCompleted 
                            ? { scale: [0, 1], rotate: [-45, 0] } 
                            : { scale: 0, rotate: 0 }
                        }
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <Lucide.Check size={14} className="stroke-[3.5px]" />
                      </motion.div>
                    </motion.button>

                    <div className="min-w-0">
                      <h3 className={`text-base item-title transition-colors ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* 1. Assignee */}
                        <span className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/25 flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 max-w-[120px]" title={`Assignee: ${task.assignee || defaultAssignee}`}>
                          <Lucide.User size={11} className="shrink-0 opacity-75" />
                          <span className="truncate">{task.assignee || defaultAssignee}</span>
                        </span>

                        {/* 2. Kanban Progress */}
                        {(() => {
                          const status = task.status || (task.isCompleted ? 'done' : 'todo');
                          const statusConfig = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.todo;

                          return (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.color} shrink-0`}>
                              {statusConfig.label}
                            </span>
                          );
                        })()}

                        {/* 3. Category */}
                        {taskCategory ? (
                          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 bg-surface-elevated/90 border border-border/60 px-2 py-0.5 rounded-full shrink-0 truncate max-w-[130px]" title={`Category: ${taskCategory.name}`}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: taskCategory.color }} />
                            <span className="truncate">{taskCategory.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1.5 bg-surface-elevated/70 border border-border/50 px-2 py-0.5 rounded-full shrink-0 truncate">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
                            <span>General</span>
                          </span>
                        )}

                        {/* 4. Priority / Severity */}
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                          task.priority === 'high' 
                            ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25' 
                            : task.priority === 'medium' 
                            ? 'text-amber-800 dark:text-amber-400 bg-amber-500/10 border-amber-500/25' 
                            : 'text-slate-700 dark:text-muted-foreground bg-muted-foreground/10 border-border/30'
                        }`}>
                          {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                        </span>

                        {/* 5. Due Date */}
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 bg-surface-elevated/80 border border-border/60 px-2 py-0.5 rounded-full shrink-0">
                          <Lucide.Calendar size={11} className="text-primary/70 shrink-0" /> {format(new Date(task.dueDate), 'MMM dd')}
                        </span>

                        {task.isRecurring && (
                          <span className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/25 flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0">
                            <Lucide.Repeat size={11} /> {task.recurrencePattern}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {!task.isCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSnooze(task.id, task.dueDate);
                        }}
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-all"
                        title="Snooze 1 Day"
                      >
                        <Lucide.Clock size={18} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task);
                      }}
                      className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-all"
                      title="Edit Task"
                    >
                      <Lucide.Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete Task"
                    >
                      <Lucide.Trash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          icon="CheckSquare"
          title="No tasks match these filters"
          description="Clear search / filters, or add a new task to get started."
          actionLabel="Add Task"
          onAction={() => openAddModal()}
        />
      )}
      </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Focus Task' : 'Schedule New Task'}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title</label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Design app interface"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-surface-elevated rounded-xl text-foreground placeholder:text-muted-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {formTitle.length >= 120 && (
              <span className="text-xs text-amber-500 font-medium px-1 block animate-fadeIn">
                Title character limit reached (120/120)
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
            <textarea
              placeholder="Provide a quick action summary..."
              maxLength={500}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground placeholder:text-muted-foreground border border-border/40 focus:border-primary outline-none resize-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {formDesc.length >= 500 && (
              <span className="text-xs text-amber-500 font-medium px-1 block animate-fadeIn">
                Description character limit reached (500/500)
              </span>
            )}
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Calendar size={13} className="text-primary" /> Start Date
              </label>
              <input
                type="date"
                required
                value={formStartDate}
                onChange={(e) => {
                  setFormStartDate(e.target.value);
                  if (!formScheduledDate) {
                    setFormScheduledDate(e.target.value);
                  }
                  setSpillError(null);
                }}
                className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.CalendarCheck size={13} className="text-primary" /> Due Date
              </label>
              <input
                type="date"
                required
                value={formDueDate}
                onChange={(e) => {
                  setFormDueDate(e.target.value);
                  setSpillError(null);
                }}
                className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Calendar size={13} className="text-primary" /> Schedule Date
              </label>
              <input
                type="date"
                value={formScheduledDate}
                onChange={(e) => {
                  setFormScheduledDate(e.target.value);
                  setSpillError(null);
                }}
                className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Clock size={13} className="text-primary" /> Schedule Time
              </label>
              <input
                type="time"
                value={formScheduledTime}
                onChange={(e) => {
                  setFormScheduledTime(e.target.value);
                  setSpillError(null);
                }}
                className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Priority & Estimated Duration (Integer Hours with hrs label and quick chips) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
              <select 
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full text-sm pl-4 pr-9 py-2.5 bg-secondary rounded-xl text-foreground font-semibold border border-border/60 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-[34px] text-muted-foreground pointer-events-none" size={15} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Timer size={13} className="text-primary" /> Estimated Duration
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formEstimatedHours}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setFormEstimatedHours(raw === '' ? '' : parseInt(raw, 10));
                    setSpillError(null);
                  }}
                  placeholder="1"
                  className="w-full text-sm font-bold pl-4 pr-12 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
                <span className="absolute right-4 text-xs font-black uppercase text-muted-foreground tracking-wider pointer-events-none">
                  hrs
                </span>
              </div>

              {/* Preconfigured Values Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 6, 8, 12].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setFormEstimatedHours(preset);
                      setSpillError(null);
                    }}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                      parsedHours === preset && formEstimatedHours !== ''
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-surface-elevated hover:bg-secondary text-muted-foreground hover:text-foreground border-border/40'
                    }`}
                  >
                    {preset} {preset === 1 ? 'hr' : 'hrs'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spillover Warning Banner */}
          {executionTimes.isSpillover && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <Lucide.AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold block text-amber-200">Estimated Completion Exceeds Due Date Limit</span>
                  <span className="text-[11px] text-amber-300/80 leading-relaxed block mt-0.5">
                    Starting on {executionTimes.startDateStr} at {executionTimes.startTimeStr} + {parsedHours} hrs finishes on <strong className="text-amber-200">{executionTimes.spillFormatted}</strong>, which spills past the Due Date ({formDueDate}).
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormDueDate(executionTimes.spillDate);
                    setSpillError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Lucide.CalendarPlus size={14} />
                  <span>Extend Due Date to {executionTimes.spillDate}</span>
                </button>
              </div>
            </div>
          )}

          {spillError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Lucide.AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{spillError}</span>
            </div>
          )}

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full text-base pl-5 pr-10 py-3.5 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">Uncategorized</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Lucide.ChevronDown className="absolute right-4 top-[38px] text-muted-foreground pointer-events-none" size={16} />
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lucide.User size={13} className="text-primary" /> Assignee
            </label>
            <select
              value={formAssignee}
              onChange={(e) => setFormAssignee(e.target.value)}
              className="w-full text-base pl-5 pr-10 py-3.5 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
            >
              {assignees.map(user => (
                <option key={user} value={user}>
                  {user} {user === defaultAssignee ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <Lucide.ChevronDown className="absolute right-4 top-[38px] text-muted-foreground pointer-events-none" size={16} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.FileText size={13} className="text-primary" /> Additional Details (Markdown • Max 500 lines)
              </label>
              <span className={`text-[11px] font-mono font-medium ${formAdditionalDetails.split('\n').length >= 480 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                {formAdditionalDetails ? formAdditionalDetails.split('\n').length : 0}/500 lines
              </span>
            </div>
            <textarea
              placeholder="Add extended markdown notes, checklists, code blocks, or instructions (up to 500 lines)..."
              value={formAdditionalDetails}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                if (lines.length > 500) {
                  setFormAdditionalDetails(lines.slice(0, 500).join('\n'));
                } else {
                  setFormAdditionalDetails(e.target.value);
                }
              }}
              rows={5}
              className="w-full text-xs font-mono px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground placeholder:text-muted-foreground border border-border/40 focus:border-primary outline-none resize-y focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
            />
          </div>

          <div className="border-t border-border/40 pt-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formIsRecurring}
                onChange={(e) => setFormIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary bg-surface-elevated border-border/60 cursor-pointer"
              />
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Enable Recurrence</span>
            </label>

            {formIsRecurring && (
              <div className="space-y-2 animate-fadeIn relative">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recurrence Schedule</label>
                <select 
                  value={formRecurrencePattern || ''}
                  onChange={(e) => setFormRecurrencePattern(e.target.value as 'daily' | 'weekly' | 'monthly' | null)}
                  className="w-full text-base pl-5 pr-10 py-3.5 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekly">Every Week</option>
                  <option value="monthly">Every Month</option>
                </select>
                <Lucide.ChevronDown className="absolute right-4 top-[38px] text-muted-foreground pointer-events-none" size={16} />
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  When completed, the app will automatically schedule the next task occurrence based on this rule.
                </p>
              </div>
            )}
          </div>

          {/* Simple Task Notifications (Start & End) */}
          <div className="border-t border-border/40 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Bell size={14} className="text-primary" /> Task Notifications
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Auto-syncs on timing &amp; date updates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                formNotifyOnStart 
                  ? 'bg-primary/15 border-primary text-foreground' 
                  : 'bg-surface-elevated/60 border-border/40 text-muted-foreground hover:text-foreground'
              }`}>
                <input
                  type="checkbox"
                  checked={formNotifyOnStart}
                  onChange={(e) => setFormNotifyOnStart(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary bg-surface-elevated border-border/60 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block text-foreground">
                    🚀 Notify on Task Start
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 font-mono">
                    {executionTimes.startDateStr} at {executionTimes.startTimeStr}
                  </span>
                </div>
              </label>

              <label className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                formNotifyOnEnd 
                  ? 'bg-primary/15 border-primary text-foreground' 
                  : 'bg-surface-elevated/60 border-border/40 text-muted-foreground hover:text-foreground'
              }`}>
                <input
                  type="checkbox"
                  checked={formNotifyOnEnd}
                  onChange={(e) => setFormNotifyOnEnd(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary bg-surface-elevated border-border/60 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block text-foreground">
                    🏁 Notify on Task End
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 font-mono">
                    {executionTimes.endDateStr} at {executionTimes.endTimeStr}
                  </span>
                </div>
              </label>
            </div>

            {/* Optional Daily Repeat Reminder */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formEnableNotification}
                  onChange={(e) => setFormEnableNotification(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary bg-surface-elevated border-border/60 cursor-pointer"
                />
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Lucide.Repeat size={12} />
                  Add Recurring Daily Alarm Reminder
                </span>
              </label>

              {formEnableNotification && (
                <div className="space-y-4 animate-fadeIn p-4 mt-2 bg-secondary/30 rounded-2xl border border-border/40">
                  <NiceTimePicker
                    value={formNotifyTime}
                    onChange={setFormNotifyTime}
                    label="Notification Time"
                  />

                  <ScheduleSelector
                    selectedDays={formNotifyDays}
                    onChange={setFormNotifyDays}
                    label="Notification Repeat Schedule"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3.5 border-t border-border/40 pt-5 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl shadow-md shadow-primary/25 transition-all"
            >
              {editingTask ? 'Apply Changes' : 'Schedule Task'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Assignee & Team Management Modal */}
      <Modal
        isOpen={isAssigneeModalOpen}
        onClose={() => setIsAssigneeModalOpen(false)}
        title="Manage Assignees & Default User"
      >
        <div className="space-y-5">
          {/* Default Assignee Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lucide.UserCheck size={14} className="text-primary" /> Default Assignee
            </label>
            <div className="relative">
              <select
                value={defaultAssignee}
                onChange={(e) => handleSetDefaultAssignee(e.target.value)}
                className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl text-foreground font-bold border border-border/60 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                {assignees.map(user => (
                  <option key={user} value={user}>
                    {user} {user === defaultAssignee ? '(Current Default)' : ''}
                  </option>
                ))}
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none" size={15} />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              All tasks created without an explicit assignee automatically default to this user.
            </p>
          </div>

          {/* Current Assignees List */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Team Members / Operators ({assignees.length})</span>
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {assignees.map(user => {
                const isDefault = user === defaultAssignee;
                return (
                  <div key={user} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated border border-border/40 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {user.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground truncate">{user}</span>
                      {isDefault && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/20 text-primary shrink-0">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAssignee(user)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          title="Set as Default"
                        >
                          Make Default
                        </button>
                      )}
                      {!isDefault && assignees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(user)}
                          className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove User"
                        >
                          <Lucide.Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Assignee Input */}
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Assignee</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Lead Engineer, Vibish..."
                maxLength={30}
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAssignee();
                  }
                }}
                className="flex-1 text-sm px-3.5 py-2.5 bg-surface-elevated rounded-xl border border-border/40 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleAddAssignee}
                disabled={!newAssigneeName.trim()}
                className="btn-glass-pill active text-xs font-black px-4 py-2.5 cursor-pointer disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={() => setIsAssigneeModalOpen(false)}
              className="px-5 py-2 text-xs font-bold text-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Fixed Pop-in Task Detail Modal */}
      <Modal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title="Task Overview & Specifications"
      >
        {viewingTask && (() => {
          const taskCategory = viewingTask.categoryId ? categoryMap.get(viewingTask.categoryId) : undefined;
          const currentStatus = viewingTask.status || (viewingTask.isCompleted ? 'done' : 'todo');

          return (
            <div className="space-y-5">
              {/* Header Title & Status Checkbox */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const willComplete = !viewingTask.isCompleted;
                    const todayStr = getTodayDateString();
                    const prevFocus = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr)?.focusScore ?? 0;
                    await toggleTaskCompletion(viewingTask.id);
                    if (willComplete) {
                      fireConfetti();
                      const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === todayStr);
                      const newFocus = freshLog?.focusScore ?? prevFocus;
                      const diff = newFocus - prevFocus;
                      window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                        detail: { title: 'Node Resolved', subtitle: viewingTask.title, flowText: diff > 0 ? `+${diff}% Flow` : `${newFocus}% Flow`, type: 'task' }
                      }));
                    }
                  }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-1 shrink-0 cursor-pointer ${
                    viewingTask.isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xs'
                      : 'border-2 border-muted-foreground/60 hover:border-emerald-500 hover:bg-emerald-500/10'
                  }`}
                  title={viewingTask.isCompleted ? 'Mark Active' : 'Mark Completed'}
                >
                  {viewingTask.isCompleted && <Lucide.Check size={14} className="stroke-[3.5]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className={`text-lg font-black leading-snug ${viewingTask.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {viewingTask.title}
                  </h3>
                  {viewingTask.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {viewingTask.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 5 Visible Labels Display Panel */}
              <div className="p-3.5 rounded-2xl bg-surface-elevated/70 border border-border/50 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Task Parameters &amp; Metadata
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Assignee */}
                  <span className="text-xs font-bold text-primary bg-primary/15 border border-primary/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5" title="Task Assignee">
                    <Lucide.User size={13} className="shrink-0" />
                    <span>Assignee: {viewingTask.assignee || defaultAssignee}</span>
                  </span>

                  {/* 2. Kanban Progress */}
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${
                    currentStatus === 'done' 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : currentStatus === 'in_progress' 
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                      : 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                  }`}>
                    {currentStatus === 'done' ? '✅ Done' : currentStatus === 'in_progress' ? '⚡ In Progress' : '📌 To Do'}
                  </span>

                  {/* 3. Category */}
                  {taskCategory ? (
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: taskCategory.color }} />
                      <span>{taskCategory.name}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground/70 flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                      <span className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/40" />
                      <span>General</span>
                    </span>
                  )}

                  {/* 4. Priority / Severity */}
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${
                    viewingTask.priority === 'high' 
                      ? 'text-red-500 bg-red-500/10 border border-red-500/20' 
                      : viewingTask.priority === 'medium' 
                      ? 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20' 
                      : 'text-muted-foreground bg-muted-foreground/10 border border-border/40'
                  }`}>
                    {viewingTask.priority} Priority
                  </span>

                  {/* Start Date */}
                  {viewingTask.startDate && (
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                      <Lucide.Calendar size={13} className="text-emerald-400" />
                      <span>Start: {format(new Date(viewingTask.startDate), 'MMM dd, yyyy')}</span>
                    </span>
                  )}

                  {/* Due Date */}
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                    <Lucide.CalendarCheck size={13} className="text-primary/80" />
                    <span>Due: {format(new Date(viewingTask.dueDate), 'MMM dd, yyyy')}</span>
                  </span>

                  {/* Schedule Date & Time + Estimated Duration */}
                  {(viewingTask.scheduledDate || viewingTask.scheduledTime || viewingTask.estimatedHours || viewingTask.estimatedMinutes) && (
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                      <Lucide.Clock size={13} className="text-sky-400" />
                      <span>
                        {viewingTask.scheduledDate ? format(new Date(viewingTask.scheduledDate), 'MMM dd') + ' ' : ''}
                        {viewingTask.scheduledTime || '09:00'} ({viewingTask.estimatedHours || Math.round((viewingTask.estimatedMinutes || 60) / 60)}h)
                      </span>
                    </span>
                  )}

                  {/* Start Notification Status */}
                  {viewingTask.notifyOnStart && (
                    <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Lucide.Bell size={12} />
                      <span>Start Alert</span>
                    </span>
                  )}

                  {/* End Notification Status */}
                  {viewingTask.notifyOnEnd && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Lucide.Bell size={12} />
                      <span>End Alert</span>
                    </span>
                  )}

                  {viewingTask.isRecurring && (
                    <span className="text-xs font-bold text-primary bg-primary/10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/20">
                      <Lucide.Repeat size={13} /> {viewingTask.recurrencePattern}
                    </span>
                  )}
                </div>
              </div>

              {/* Fast Kanban Status Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Kanban Status Switch
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['todo', 'in_progress', 'done'] as const).map(st => {
                    const isCurrent = currentStatus === st;
                    const labels = { todo: '📌 To Do', in_progress: '⚡ In Progress', done: '✅ Done' };
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={async () => {
                          await updateTask(viewingTask.id, {
                            status: st,
                            isCompleted: st === 'done',
                          });
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-surface-elevated hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50'
                        }`}
                      >
                        {labels[st]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details (Markdown Supported • 500 lines limit) */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lucide.FileText size={13} className="text-primary" /> Additional Details (Markdown)
                  </span>
                  {viewingTask.additionalDetails && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {viewingTask.additionalDetails.split('\n').length} lines
                    </span>
                  )}
                </div>

                {viewingTask.additionalDetails && viewingTask.additionalDetails.trim() ? (
                  <div className="p-4 rounded-2xl bg-surface-elevated border border-border/50 max-h-72 overflow-y-auto leading-relaxed text-xs">
                    <MarkdownRenderer content={viewingTask.additionalDetails} />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-surface-elevated/40 border border-dashed border-border/60 text-xs text-muted-foreground italic text-center">
                    No markdown notes or steps provided yet. Click &quot;Edit Task&quot; below to add formatted details (up to 500 lines).
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={async () => {
                    const willComplete = !viewingTask.isCompleted;
                    await toggleTaskCompletion(viewingTask.id);
                    if (willComplete) {
                      fireConfetti();
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewingTask.isCompleted
                      ? 'bg-secondary text-muted-foreground hover:text-foreground'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {viewingTask.isCompleted ? 'Reopen Task' : 'Complete Task'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const t = viewingTask;
                      setViewingTask(null);
                      openEditModal(t);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border/50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lucide.Edit2 size={13} />
                    <span>Edit Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const id = viewingTask.id;
                      setViewingTask(null);
                      await deleteTask(id);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lucide.Trash2 size={13} />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default TasksFeature;
