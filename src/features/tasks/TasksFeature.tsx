'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { fireConfetti } from '@/lib/confetti';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { format, addDays, parseISO } from 'date-fns';
import type { Task, TaskStatus, EisenhowerQuadrant } from '@/types';
import { TaskPlannerView } from './TaskPlannerView';
import { TaskKanbanView } from './TaskKanbanView';
import { useViewPreference } from '@/lib/viewPreferences';

export const TasksFeature: React.FC = () => {
  const {
    tasks,
    categories,
    reminders,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    addReminder,
    updateReminder,
  } = useShadowTrackerStore();

  // Top Workspace Switcher: 'list' vs 'planner' vs 'kanban' (Persisted)
  const [workspaceView, setWorkspaceView] = useViewPreference('tasksWorkspaceView') as ['list' | 'planner' | 'kanban', (v: 'list' | 'planner' | 'kanban') => void];

  const [activeTab, setActiveTab] = useViewPreference('tasksActiveTab') as ['pending' | 'completed' | 'all', (v: 'pending' | 'completed' | 'all') => void];
  const [dateFilter, setDateFilter] = useViewPreference('tasksDateFilter') as ['all' | 'today' | 'tomorrow' | 'this-week' | 'overdue', (v: 'all' | 'today' | 'tomorrow' | 'this-week' | 'overdue') => void];
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useViewPreference('tasksPriorityFilter') as [string, (v: string) => void];
  const [categoryFilter, setCategoryFilter] = useViewPreference('tasksCategoryFilter') as [string, (v: string) => void];
  const [viewMode, setViewMode] = useViewPreference('tasksViewMode') as ['list' | 'grid', (v: 'list' | 'grid') => void];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState(getTodayDateString());
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formQuadrant, setFormQuadrant] = useState<EisenhowerQuadrant>('not_urgent_important');
  const [formScheduledTime, setFormScheduledTime] = useState('');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(30);

  // Notification Reminder State
  const [formEnableNotification, setFormEnableNotification] = useState(false);
  const [formNotifyTime, setFormNotifyTime] = useState('09:00');
  const [formNotifyDays, setFormNotifyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const openAddModal = useCallback((dueDate?: string, initialStatus?: TaskStatus, initialQuadrant?: EisenhowerQuadrant) => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormDueDate(dueDate || getTodayDateString());
    setFormPriority(initialQuadrant === 'urgent_important' ? 'high' : 'medium');
    setFormStatus(initialStatus || 'todo');
    setFormQuadrant(initialQuadrant || (initialStatus === 'done' ? 'not_urgent_important' : 'not_urgent_important'));
    setFormScheduledTime('');
    setFormEstimatedMinutes(30);
    setFormCategoryId('');
    setFormIsRecurring(false);
    setFormRecurrencePattern('daily');
    setFormEnableNotification(false);
    setFormNotifyTime('09:00');
    setFormNotifyDays([0, 1, 2, 3, 4, 5, 6]);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormDueDate(task.dueDate);
    setFormPriority(task.priority);
    setFormStatus(task.status || (task.isCompleted ? 'done' : 'todo'));
    setFormQuadrant(
      task.matrixQuadrant || 
      (task.priority === 'high' ? 'urgent_important' : task.priority === 'medium' ? 'not_urgent_important' : 'urgent_not_important')
    );
    setFormScheduledTime(task.scheduledTime || '');
    setFormEstimatedMinutes(task.estimatedMinutes || 30);
    setFormCategoryId(task.categoryId || '');
    setFormIsRecurring(task.isRecurring);
    setFormRecurrencePattern(task.recurrencePattern || 'daily');

    const existingReminder = reminders.find(r => r.taskId === task.id);
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
  }, [reminders]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const taskPayload = {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        dueDate: formDueDate,
        priority: formPriority,
        categoryId: formCategoryId || undefined,
        isRecurring: formIsRecurring,
        recurrencePattern: formIsRecurring ? formRecurrencePattern : null,
        status: formStatus,
        matrixQuadrant: formQuadrant,
        scheduledTime: formScheduledTime.trim() || undefined,
        estimatedMinutes: formEstimatedMinutes > 0 ? formEstimatedMinutes : 30,
        isCompleted: formStatus === 'done',
      };

      let savedTaskId = editingTask?.id;
      if (editingTask) {
        await updateTask(editingTask.id, taskPayload);
      } else {
        const created = await addTask(taskPayload);
        savedTaskId = created?.id;
      }

      if (savedTaskId) {
        const existing = reminders.find(r => r.taskId === savedTaskId);
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
  }, [formTitle, formDesc, formDueDate, formPriority, formCategoryId, formIsRecurring, formRecurrencePattern, formStatus, formQuadrant, formScheduledTime, formEstimatedMinutes, formEnableNotification, formNotifyTime, formNotifyDays, editingTask, updateTask, addTask, reminders, addReminder, updateReminder]);

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

      if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) return false;

      return true;
    });
  }, [tasks, activeTab, dateFilter, searchQuery, priorityFilter, categoryFilter]);

  return (
    <div className="space-y-6 relative min-h-[600px]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.05] mix-blend-screen flex items-center justify-center">
        <motion.svg
          viewBox="0 0 800 800"
          className="w-full h-full max-w-[900px] text-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="12 8" />
          <motion.circle
            cx="400" cy="400" r="250"
            stroke="currentColor" strokeWidth="0.6" fill="none"
            strokeDasharray="6 14"
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '400px 400px' }}
          />
          <motion.circle
            cx="400" cy="400" r="150"
            stroke="currentColor" strokeWidth="0.5" fill="none"
            strokeDasharray="4 20"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '400px 400px' }}
          />
          <circle cx="400" cy="400" r="3" fill="currentColor" opacity="0.4" />
          <motion.line
            x1="50" y1="400" x2="750" y2="400"
            stroke="currentColor" strokeWidth="0.4"
            strokeDasharray="2 6"
            animate={{ y1: [200, 600, 200], y2: [200, 600, 200] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <motion.circle
              key={deg}
              cx={400 + 300 * Math.cos((deg * Math.PI) / 180)}
              cy={400 + 300 * Math.sin((deg * Math.PI) / 180)}
              r="4"
              fill="currentColor"
              opacity="0.3"
              animate={{ opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, delay: deg / 120 }}
            />
          ))}
        </motion.svg>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Tasks Workspace</h2>
        </div>
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

      {/* Date Filters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 relative z-10">
        <span className="text-xs font-black text-secondary uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Lucide.Calendar size={13} className="text-primary" /> Filter Date:
        </span>
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
      </div>

      {/* Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 relative z-10">
        <div className="pill-group overflow-x-auto scrollbar-none">
          {(['pending', 'completed', 'all'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`filter-pill ${isActive ? 'active' : ''}`}
              >
                <span className="capitalize">{tab}</span>
                {tab === 'pending' && tasks.filter(t=>!t.isCompleted).length > 0 && (
                  <span className={`ml-1.5 px-2 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20 text-primary'
                  }`}>
                    {tasks.filter(t=>!t.isCompleted).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: List Details vs Grid View */}
        <div className="pill-group self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`filter-pill ${viewMode === 'list' ? 'active' : ''}`}
            title="List View with full details"
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
      </div>

      {/* Task Items: Grid vs List Rendering */}
      {filteredTasks.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View: High-Density Cards to View More Tasks at Once */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
            {filteredTasks.map((task) => {
              const taskCategory = categories.find(c => c.id === task.categoryId);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className={`p-3.5 bg-surface border border-border/80 hover:border-primary/50 hover:shadow-lg rounded-2xl transition-all flex flex-col justify-between gap-3 ${
                    task.isCompleted ? 'opacity-65 bg-surface-elevated/50 border-border/30' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={async () => {
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

                        {taskCategory && (
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: taskCategory.color }} />
                            <span className="truncate">{taskCategory.name}</span>
                          </span>
                        )}
                      </div>

                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                        task.priority === 'high' 
                          ? 'text-red-500 bg-red-500/10' 
                          : task.priority === 'medium' 
                          ? 'text-yellow-500 bg-yellow-500/10' 
                          : 'text-muted-foreground bg-muted-foreground/10'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold line-clamp-2 leading-snug ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs mt-auto">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Lucide.Calendar size={12} /> {format(new Date(task.dueDate), 'MMM dd')}
                    </span>
                    <div className="flex items-center gap-1">
                      {!task.isCompleted && (
                        <button
                          onClick={() => handleSnooze(task.id, task.dueDate)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated transition-colors"
                          title="Snooze 1 Day"
                        >
                          <Lucide.Clock size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated transition-colors"
                        title="Edit Task"
                      >
                        <Lucide.Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
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
              const taskCategory = categories.find(c => c.id === task.categoryId);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, scale: 1.005 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-border/80 hover:border-primary/50 hover:shadow-lg rounded-2xl transition-all duration-150 gap-4 ${
                    task.isCompleted ? 'opacity-65 bg-surface-elevated/50 border-border/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <motion.button
                      layout
                      whileTap={{ scale: 0.9 }}
                      onClick={async () => {
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
                      <h3 className={`text-base font-bold transition-colors ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-surface-elevated px-2.5 py-1 rounded-md">
                          <Lucide.Calendar size={13} /> {format(new Date(task.dueDate), 'MMM dd')}
                        </span>

                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${
                          task.priority === 'high' 
                            ? 'text-red-500 bg-red-500/10' 
                            : task.priority === 'medium' 
                            ? 'text-yellow-500 bg-yellow-500/10' 
                            : 'text-muted-foreground bg-muted-foreground/10'
                        }`}>
                          {task.priority}
                        </span>

                        {taskCategory && (
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-surface-elevated px-2.5 py-1 rounded-md">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: taskCategory.color }} />
                            {taskCategory.name}
                          </span>
                        )}

                        {task.isRecurring && (
                          <span className="text-xs font-bold text-primary bg-primary/10 flex items-center gap-1.5 px-2.5 py-1 rounded-md">
                            <Lucide.Repeat size={13} /> {task.recurrencePattern}
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
                        onClick={() => handleSnooze(task.id, task.dueDate)}
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-all"
                        title="Snooze 1 Day"
                      >
                        <Lucide.Clock size={18} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(task)}
                      className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-xl transition-all"
                      title="Edit Task"
                    >
                      <Lucide.Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteTask(task.id)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
              <input
                type="date"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
              <select 
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full text-sm pl-4 pr-9 py-3 bg-secondary rounded-xl text-foreground font-semibold border border-border/60 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-[35px] text-muted-foreground pointer-events-none" size={15} />
            </div>
          </div>

          {/* Kanban Status & Eisenhower Quadrant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kanban Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                className="w-full text-sm pl-4 pr-9 py-3 bg-secondary rounded-xl text-foreground font-semibold border border-border/60 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="todo">📌 To Do</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-[35px] text-muted-foreground pointer-events-none" size={15} />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Eisenhower Matrix</label>
              <select
                value={formQuadrant}
                onChange={(e) => setFormQuadrant(e.target.value as EisenhowerQuadrant)}
                className="w-full text-sm pl-4 pr-9 py-3 bg-secondary rounded-xl text-foreground font-semibold border border-border/60 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="urgent_important">🔴 Q1: Do First</option>
                <option value="not_urgent_important">🔵 Q2: Schedule</option>
                <option value="urgent_not_important">🟡 Q3: Delegate / Quick</option>
                <option value="neither">⚪ Q4: Eliminate / Backlog</option>
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-[35px] text-muted-foreground pointer-events-none" size={15} />
            </div>
          </div>

          {/* Planner Fields: Scheduled Time & Estimated Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Clock size={13} className="text-primary" /> Scheduled Time (Optional)
              </label>
              <input
                type="time"
                value={formScheduledTime}
                onChange={(e) => setFormScheduledTime(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lucide.Timer size={13} className="text-primary" /> Estimated Duration
              </label>
              <select
                value={formEstimatedMinutes}
                onChange={(e) => setFormEstimatedMinutes(Number(e.target.value))}
                className="w-full text-sm pl-4 pr-9 py-2.5 bg-surface-elevated rounded-xl text-foreground font-bold border border-border/40 focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
                <option value={180}>3 Hours</option>
                <option value={240}>4 Hours</option>
              </select>
              <Lucide.ChevronDown className="absolute right-3.5 top-[34px] text-muted-foreground pointer-events-none" size={15} />
            </div>
          </div>

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

          <div className="border-t border-border/40 pt-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formEnableNotification}
                onChange={(e) => setFormEnableNotification(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary bg-surface-elevated border-border/60 cursor-pointer"
              />
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <Lucide.Bell size={16} className="text-primary" />
                Enable Task Notification Alert
              </span>
            </label>

            {formEnableNotification && (
              <div className="space-y-4 animate-fadeIn p-4 bg-secondary/30 rounded-2xl border border-border/40">
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
    </div>
  );
};

export default TasksFeature;
