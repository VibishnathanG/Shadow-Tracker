'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { fireConfetti } from '@/lib/confetti';
import { getTodayDateString, formatDateString, getMonthGridDates } from '@/lib/dateUtils';
import { format, addDays, addWeeks, subWeeks, addMonths, subMonths, isSameMonth, parseISO } from 'date-fns';
import type { Task, Category } from '@/types';

interface TaskPlannerViewProps {
  onOpenAddModal: (dueDate?: string) => void;
  onOpenEditModal: (task: Task) => void;
}

// Format minutes into clean duration e.g. "3h 30m" or "45m"
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export const TaskPlannerView: React.FC<TaskPlannerViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const {
    tasks,
    categories,
    updateTask,
    toggleTaskCompletion,
  } = useShadowTrackerStore(
    useShallow(state => ({
      tasks: state.tasks,
      categories: state.categories,
      updateTask: state.updateTask,
      toggleTaskCompletion: state.toggleTaskCompletion,
    }))
  );

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Planner sub-mode: 'week' vs 'month'
  const [plannerMode, setPlannerMode] = useState<'week' | 'month'>('week');

  // Active anchor date for week or month navigation
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Drag and Drop active drop target
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Category map for rapid lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Non-deleted tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.isSoftDeleted);
  }, [tasks]);

  // Overdue tasks: dueDate < today and not completed
  const overdueTasks = useMemo(() => {
    return activeTasks.filter(t => t.dueDate < todayStr && !t.isCompleted)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [activeTasks, todayStr]);

  const overdueDurationMinutes = useMemo(() => {
    return overdueTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  }, [overdueTasks]);

  // 7 days of the active week
  const weekDays = useMemo(() => {
    // Start from Monday of the current anchorDate's week
    const currentDay = anchorDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = addDays(anchorDate, distanceToMonday);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [anchorDate]);

  // Month grid dates (42 days)
  const monthGrid = useMemo(() => {
    return getMonthGridDates(anchorDate);
  }, [anchorDate]);

  // Tasks grouped by dueDate
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    activeTasks.forEach(t => {
      const list = map.get(t.dueDate) || [];
      list.push(t);
      map.set(t.dueDate, list);
    });
    return map;
  }, [activeTasks]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (plannerMode === 'week') {
      setAnchorDate(prev => subWeeks(prev, 1));
    } else {
      setAnchorDate(prev => subMonths(prev, 1));
    }
  }, [plannerMode]);

  const handleNext = useCallback(() => {
    if (plannerMode === 'week') {
      setAnchorDate(prev => addWeeks(prev, 1));
    } else {
      setAnchorDate(prev => addMonths(prev, 1));
    }
  }, [plannerMode]);

  const handleToday = useCallback(() => {
    setAnchorDate(new Date());
  }, []);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.dueDate === targetDateStr) return;

    await updateTask(taskId, { dueDate: targetDateStr });
  };

  const handleCheckTask = async (taskId: string, currentCompleted: boolean) => {
    await toggleTaskCompletion(taskId);
    if (!currentCompleted) {
      fireConfetti();
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* ── PLANNER HEADER & NAVIGATION BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface/70 border border-border/70 p-4 rounded-3xl backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/15 text-primary rounded-2xl border border-primary/30 shadow-xs">
            <Lucide.CalendarRange size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Super Planner</span>
              <span 
                style={{ fontSize: '7px', lineHeight: '9px' }}
                className="font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 tracking-wider select-none inline-block align-middle"
              >
                Pro Schedule
              </span>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Time-blocked daily sprints &amp; calendar schedule
            </p>
          </div>
        </div>

        {/* Controls: Week/Month Switcher & Period Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sub-mode Toggle (Week vs Month) */}
          <div className="pill-group">
            <button
              type="button"
              onClick={() => setPlannerMode('week')}
              className={`filter-pill ${plannerMode === 'week' ? 'active' : ''}`}
            >
              <Lucide.Columns3 size={13} />
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => setPlannerMode('month')}
              className={`filter-pill ${plannerMode === 'month' ? 'active' : ''}`}
            >
              <Lucide.CalendarDays size={13} />
              <span>Month</span>
            </button>
          </div>

          {/* Navigation Button Group - No Outer Rectangle */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/60 transition-colors cursor-pointer border-0 outline-none ring-0 focus:outline-none"
              title="Previous period"
            >
              <Lucide.ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="filter-pill text-xs py-1 px-3.5 rounded-full font-bold uppercase cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/60 transition-colors cursor-pointer border-0 outline-none ring-0 focus:outline-none"
              title="Next period"
            >
              <Lucide.ChevronRight size={15} />
            </button>
          </div>

          {/* Current Period Label */}
          <div className="text-xs font-black px-2.5 py-1 bg-secondary/50 rounded-xl border border-border/60 text-foreground text-center">
            {plannerMode === 'week' ? (
              <span>
                {format(weekDays[0], 'd MMM')} – {format(weekDays[6], 'd MMM')}
              </span>
            ) : (
              <span>{format(anchorDate, 'MMM yyyy')}</span>
            )}
          </div>

          {/* Create Task Button */}
          <button
            type="button"
            onClick={() => onOpenAddModal(todayStr)}
            className="btn-glass-pill active text-xs font-black py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto sm:ml-0"
          >
            <Lucide.Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ── VIEW 1: WEEK PLANNER (SUPER PRODUCTIVITY COLUMNS) ── */}
      {plannerMode === 'week' && (
        <div className="w-full space-y-4 pb-4">
          <div className="w-full overflow-x-hidden md:overflow-x-auto no-scrollbar md:custom-scrollbar">
            <div className="flex flex-col gap-3.5 w-full md:grid md:grid-cols-4 lg:grid-cols-7 md:min-w-[1050px]">
              {/* COLUMNS 1 TO 7: DAYS OF THE WEEK */}
            {weekDays.map((date) => {
              const dateStr = formatDateString(date);
              const isToday = dateStr === todayStr;
              const dayTasks = tasksByDate.get(dateStr) || [];
              const dayDuration = dayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
              const isDroppingHere = dragOverDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`flex flex-col w-full rounded-2xl overflow-hidden border transition-all shadow-xs ${
                    isDroppingHere
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/40'
                      : isToday
                      ? 'bg-surface/90 border-border/70'
                      : 'bg-surface/50 border-border/70 hover:border-border'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isToday ? 'bg-primary/10 border-border/70' : 'bg-surface-elevated/70 border-border/70'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {format(date, 'EEE d/M')}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground font-mono block mt-0.5">
                        {formatDuration(dayDuration)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAddModal(dateStr)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                      title={`Add task for ${format(date, 'EEE, d MMM')}`}
                    >
                      <Lucide.Plus size={15} />
                    </button>
                  </div>

                  {/* Task Cards Droppable Body */}
                  <div className="p-2 space-y-2 flex-1 min-h-0 md:min-h-[300px] overflow-y-auto custom-scrollbar max-h-[550px]">
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-3.5 md:py-10 text-center text-muted-foreground/40 border border-dashed border-border/40 rounded-xl">
                        <span className="text-[11px] font-bold">No tasks</span>
                        <button
                          type="button"
                          onClick={() => onOpenAddModal(dateStr)}
                          className="mt-0.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    ) : (
                      dayTasks.map(task => {
                        const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            onClick={() => onOpenEditModal(task)}
                            className={`group relative p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 shadow-xs ${
                              task.isCompleted
                                ? 'bg-secondary/20 border-border/40 opacity-70'
                                : 'bg-surface-elevated/95 hover:bg-surface border-border/70 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={task.isCompleted}
                                  onChange={() => handleCheckTask(task.id, task.isCompleted)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 mt-0.5 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                                />
                                <span className={`text-xs font-bold leading-tight line-clamp-2 ${
                                  task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {task.title}
                                </span>
                              </div>

                              {task.isRecurring && (
                                <span title={`Recurring: ${task.recurrencePattern}`} className="shrink-0 mt-0.5">
                                  <Lucide.Repeat size={11} className="text-primary" />
                                </span>
                              )}
                            </div>

                            {/* Tags & Time Row */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {category && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                                  <span className="truncate max-w-[70px]">{category.name}</span>
                                </span>
                              )}

                              {task.scheduledTime && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/60 text-sky-400 font-mono font-bold">
                                  <Lucide.Clock size={10} />
                                  <span>{task.scheduledTime}</span>
                                </span>
                              )}

                              <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-mono font-bold">
                                {formatDuration(task.estimatedMinutes || 30)}
                              </span>

                              {task.priority === 'high' && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase text-[9px]">
                                  High
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Tasks Section (Dedicated Below Week Row) */}
        <div className="bg-rose-500/[0.04] border border-rose-500/25 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-3 sm:px-4 bg-rose-500/10 border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Lucide.AlertCircle size={15} />
              <span className="text-xs font-black uppercase tracking-wider">Overdue Tasks</span>
              <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                {overdueTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span>Total planned:</span>
              <span className="font-mono text-rose-300 font-bold">{formatDuration(overdueDurationMinutes)}</span>
            </div>
          </div>

          {/* Overdue Task Cards */}
          <div className="p-3">
            {overdueTasks.length === 0 ? (
              <div className="flex items-center gap-2.5 py-1 px-1 text-muted-foreground/70">
                <Lucide.CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold">Zero overdue tasks — all scheduled work is on track!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {overdueTasks.map(task => {
                  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="group relative p-2.5 bg-surface-elevated/95 hover:bg-surface border border-rose-500/30 hover:border-rose-500/60 rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => handleCheckTask(task.id, task.isCompleted)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                          />
                          <span className="text-xs font-bold text-foreground truncate leading-tight">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-rose-400 shrink-0 font-mono">
                          {format(parseISO(task.dueDate), 'd MMM')}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {category && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                            <span className="truncate max-w-[70px]">{category.name}</span>
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-mono font-bold">
                          {formatDuration(task.estimatedMinutes || 30)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* ── VIEW 2: MONTH SCHEDULE GRID (SUPER PRODUCTIVITY SCHEDULE) ── */}
      {plannerMode === 'month' && (
        <div className="tile p-4 sm:p-6 overflow-hidden">
          {/* Day of Week Headers (Mon to Sun) */}
          <div className="grid grid-cols-7 text-center border-b border-border/60 pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Calendar Days Grid (6 rows x 7 cols) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-3">
            {monthGrid.map((date) => {
              const dateStr = formatDateString(date);
              const isCurrentMonth = isSameMonth(date, anchorDate);
              const isToday = dateStr === todayStr;
              const dayTasks = tasksByDate.get(dateStr) || [];
              const isDroppingHere = dragOverDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all relative ${
                    isDroppingHere
                      ? 'bg-primary/15 border-primary ring-2 ring-primary/40'
                      : isToday
                      ? 'bg-surface/50 border-border/60 shadow-xs'
                      : isCurrentMonth
                      ? 'bg-surface/40 border-border/60 hover:border-border'
                      : 'bg-secondary/15 border-border/30 opacity-40'
                  }`}
                >
                  {/* Day Cell Header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black font-mono w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {format(date, 'd')}
                    </span>

                    <button
                      type="button"
                      onClick={() => onOpenAddModal(dateStr)}
                      className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity cursor-pointer"
                      title={`Add task for ${dateStr}`}
                    >
                      <Lucide.Plus size={12} />
                    </button>
                  </div>

                  {/* Scheduled Task Chips in Cell */}
                  <div className="space-y-1 my-1 overflow-y-auto custom-scrollbar max-h-[75px] flex-1">
                    {dayTasks.slice(0, 3).map(task => {
                      const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => onOpenEditModal(task)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 truncate cursor-grab active:cursor-grabbing border ${
                            task.isCompleted
                              ? 'bg-secondary/40 text-muted-foreground border-transparent line-through'
                              : 'bg-surface-elevated text-foreground border-border/70 hover:border-primary/50'
                          }`}
                          title={task.title}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: category?.color || '#3b82f6' }}
                          />
                          {task.scheduledTime && (
                            <span className="text-muted-foreground text-[9px] font-mono shrink-0">
                              {task.scheduledTime}
                            </span>
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] font-bold text-muted-foreground pl-1">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Day Footer with Task Count Indicator */}
                  {dayTasks.length > 0 && (
                    <div className="text-[9px] font-extrabold text-muted-foreground flex justify-between items-center border-t border-border/30 pt-0.5 mt-auto">
                      <span className="truncate">
                        <span className="hidden sm:inline">{dayTasks.filter(t => t.isCompleted).length}/{dayTasks.length} done</span>
                        <span className="sm:hidden">{dayTasks.filter(t => t.isCompleted).length}/{dayTasks.length}</span>
                      </span>
                      <span className="font-mono hidden sm:inline">{formatDuration(dayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0))}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPlannerView;
