'use client';

import React, { useState, useMemo } from 'react';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { fireConfetti } from '@/lib/confetti';
import { format, parseISO } from 'date-fns';
import type { Task, Category, TaskStatus, EisenhowerQuadrant } from '@/types';

interface TaskKanbanViewProps {
  onOpenAddModal: (dueDate?: string, initialStatus?: TaskStatus, initialQuadrant?: EisenhowerQuadrant) => void;
  onOpenEditModal: (task: Task) => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const {
    tasks,
    categories,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
  } = useShadowTrackerStore();

  // Mode: 'columns' (To Do / In Progress / Done) vs 'matrix' (Eisenhower 4-Quadrant)
  const [boardMode, setBoardMode] = useState<'columns' | 'matrix'>('columns');

  // Drag over target tracker
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Active non-deleted tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.isSoftDeleted);
  }, [tasks]);

  // Helper to normalize task status
  const getTaskStatus = (t: Task): TaskStatus => {
    if (t.status) return t.status;
    return t.isCompleted ? 'done' : 'todo';
  };

  // Helper to normalize Eisenhower quadrant
  const getTaskQuadrant = (t: Task): EisenhowerQuadrant => {
    if (t.matrixQuadrant) return t.matrixQuadrant;
    if (t.priority === 'high') return 'urgent_important';
    if (t.priority === 'medium') return 'not_urgent_important';
    if (t.priority === 'low') return 'urgent_not_important';
    return 'neither';
  };

  // Group by Kanban status
  const kanbanGroups = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const done: Task[] = [];

    activeTasks.forEach(t => {
      const status = getTaskStatus(t);
      if (status === 'done') {
        done.push(t);
      } else if (status === 'in_progress') {
        inProgress.push(t);
      } else {
        todo.push(t);
      }
    });

    return { todo, inProgress, done };
  }, [activeTasks]);

  // Group by Eisenhower quadrant
  const matrixGroups = useMemo(() => {
    const q1: Task[] = []; // Urgent & Important
    const q2: Task[] = []; // Not Urgent & Important
    const q3: Task[] = []; // Urgent & Not Important
    const q4: Task[] = []; // Neither

    activeTasks.forEach(t => {
      const quad = getTaskQuadrant(t);
      if (quad === 'urgent_important') q1.push(t);
      else if (quad === 'not_urgent_important') q2.push(t);
      else if (quad === 'urgent_not_important') q3.push(t);
      else q4.push(t);
    });

    return { q1, q2, q3, q4 };
  }, [activeTasks]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  // Drop onto Kanban Column
  const handleDropColumn = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverTarget(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentStatus = getTaskStatus(task);
    if (currentStatus === targetStatus) return;

    if (targetStatus === 'done') {
      await updateTask(taskId, {
        status: 'done',
        isCompleted: true,
        completedAt: new Date().toISOString(),
      });
      fireConfetti();
    } else {
      await updateTask(taskId, {
        status: targetStatus,
        isCompleted: false,
      });
    }
  };

  // Drop onto Eisenhower Quadrant
  const handleDropQuadrant = async (e: React.DragEvent, targetQuadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    setDragOverTarget(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const priorityMap: Record<EisenhowerQuadrant, 'high' | 'medium' | 'low'> = {
      urgent_important: 'high',
      not_urgent_important: 'medium',
      urgent_not_important: 'low',
      neither: 'low',
    };

    await updateTask(taskId, {
      matrixQuadrant: targetQuadrant,
      priority: priorityMap[targetQuadrant],
    });
  };

  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'done') {
      await updateTask(taskId, {
        status: 'done',
        isCompleted: true,
        completedAt: new Date().toISOString(),
      });
      fireConfetti();
    } else {
      await updateTask(taskId, {
        status: newStatus,
        isCompleted: false,
      });
    }
  };

  const handleCheckTask = async (taskId: string, currentCompleted: boolean) => {
    await toggleTaskCompletion(taskId);
    if (!currentCompleted) {
      fireConfetti();
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* ── HEADER & SUB-TAB SWITCHER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface/70 border border-border/70 p-4 rounded-3xl backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-2xl border border-purple-500/30 shadow-xs shrink-0">
            <Lucide.Kanban size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <span>{boardMode === 'columns' ? 'Kanban Board' : 'Eisenhower Matrix'}</span>
              <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider">
                {boardMode === 'columns' ? 'Workflow' : '4 Quadrants'}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {boardMode === 'columns'
                ? 'Drag tasks: To Do → In Progress → Done'
                : 'Prioritize by urgency and importance'}
            </p>
          </div>
        </div>

        {/* Controls: Board Switcher & Quick Add */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="pill-group">
            <button
              type="button"
              onClick={() => setBoardMode('columns')}
              className={`filter-pill ${boardMode === 'columns' ? 'active' : ''}`}
            >
              <Lucide.Columns3 size={13} />
              <span>Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setBoardMode('matrix')}
              className={`filter-pill ${boardMode === 'matrix' ? 'active' : ''}`}
            >
              <Lucide.Grid2X2 size={13} />
              <span>Matrix</span>
            </button>
          </div>

          {/* Stat Badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-surface-elevated px-3 py-1.5 rounded-2xl border border-border/80">
            <span className="text-sky-400">{kanbanGroups.todo.length} To Do</span>
            <span className="text-border">/</span>
            <span className="text-amber-400">{kanbanGroups.inProgress.length} In Progress</span>
            <span className="text-border">/</span>
            <span className="text-emerald-400">{kanbanGroups.done.length} Done</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddModal()}
            className="btn-glass-pill active text-xs font-black py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto sm:ml-0"
          >
            <Lucide.Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: KANBAN 3-COLUMN BOARD ── */}
      {boardMode === 'columns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* COLUMN 1: TO DO */}
          <div
            onDragOver={(e) => handleDragOver(e, 'todo')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropColumn(e, 'todo')}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all shadow-xs ${
              dragOverTarget === 'todo'
                ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/40'
                : 'bg-surface/60 border-border/70'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 bg-surface-elevated/70 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <Lucide.ListTodo size={16} />
                <span className="text-xs font-black uppercase tracking-wider">To Do</span>
                <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                  {kanbanGroups.todo.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddModal(undefined, 'todo')}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
                title="Add task to To Do"
              >
                <Lucide.Plus size={15} />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="p-3 space-y-2.5 min-h-[420px] max-h-[700px] overflow-y-auto custom-scrollbar">
              {kanbanGroups.todo.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground/50 border-2 border-dashed border-border/40 rounded-xl p-4">
                  <Lucide.ClipboardList size={28} className="opacity-40 mb-1.5" />
                  <p className="text-xs font-bold">No tasks to do</p>
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(undefined, 'todo')}
                    className="mt-1 text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                kanbanGroups.todo.map(task => {
                  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="group relative p-3.5 bg-surface-elevated/95 hover:bg-surface border border-border/70 hover:border-sky-500/50 rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-foreground leading-snug line-clamp-2">
                          {task.title}
                        </span>

                        <Lucide.GripVertical size={14} className="text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground" />
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {category && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="truncate max-w-[80px]">{category.name}</span>
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-mono">
                            {format(parseISO(task.dueDate), 'd MMM')}
                          </span>
                        </div>

                        {/* Fast Action Buttons */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStatus(task.id, 'in_progress'); }}
                            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Move to In Progress"
                          >
                            <span>Start</span>
                            <Lucide.ArrowRight size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStatus(task.id, 'done'); }}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                            title="Mark as Done"
                          >
                            <Lucide.Check size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div
            onDragOver={(e) => handleDragOver(e, 'in_progress')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropColumn(e, 'in_progress')}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all shadow-xs ${
              dragOverTarget === 'in_progress'
                ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40'
                : 'bg-surface/60 border-border/70'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 bg-surface-elevated/70 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider">In Progress</span>
                <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                  {kanbanGroups.inProgress.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddModal(undefined, 'in_progress')}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
                title="Add task to In Progress"
              >
                <Lucide.Plus size={15} />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="p-3 space-y-2.5 min-h-[420px] max-h-[700px] overflow-y-auto custom-scrollbar">
              {kanbanGroups.inProgress.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground/50 border-2 border-dashed border-border/40 rounded-xl p-4">
                  <Lucide.Hourglass size={28} className="opacity-40 mb-1.5" />
                  <p className="text-xs font-bold">Nothing currently in progress</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Drag a task here to start working.</p>
                </div>
              ) : (
                kanbanGroups.inProgress.map(task => {
                  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="group relative p-3.5 bg-surface-elevated/95 hover:bg-surface border border-amber-500/40 hover:border-amber-500/80 rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-foreground leading-snug line-clamp-2">
                          {task.title}
                        </span>

                        <Lucide.GripVertical size={14} className="text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground" />
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {category && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="truncate max-w-[80px]">{category.name}</span>
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-amber-400 font-mono font-bold">
                            Active
                          </span>
                        </div>

                        {/* Fast Action Buttons */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStatus(task.id, 'todo'); }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                            title="Move back to To Do"
                          >
                            <Lucide.ArrowLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStatus(task.id, 'done'); }}
                            className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Mark as Done"
                          >
                            <Lucide.Check size={11} />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: DONE */}
          <div
            onDragOver={(e) => handleDragOver(e, 'done')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropColumn(e, 'done')}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all shadow-xs ${
              dragOverTarget === 'done'
                ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40'
                : 'bg-surface/60 border-border/70'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 bg-surface-elevated/70 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lucide.CheckCircle2 size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Done</span>
                <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                  {kanbanGroups.done.length}
                </span>
              </div>

              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Completed
              </span>
            </div>

            {/* Tasks Container */}
            <div className="p-3 space-y-2.5 min-h-[420px] max-h-[700px] overflow-y-auto custom-scrollbar">
              {kanbanGroups.done.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground/50 border-2 border-dashed border-border/40 rounded-xl p-4">
                  <Lucide.Sparkles size={28} className="opacity-40 mb-1.5" />
                  <p className="text-xs font-bold">No completed tasks yet</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Complete tasks or drag them here!</p>
                </div>
              ) : (
                kanbanGroups.done.map(task => {
                  const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="group relative p-3.5 bg-secondary/25 hover:bg-secondary/40 border border-border/50 rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-all space-y-2 opacity-80 hover:opacity-100"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <Lucide.CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-muted-foreground line-through leading-snug line-clamp-2">
                            {task.title}
                          </span>
                        </div>

                        <Lucide.GripVertical size={14} className="text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground" />
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/30 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {category && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/50 text-muted-foreground font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="truncate max-w-[80px]">{category.name}</span>
                            </span>
                          )}
                          <span className="text-emerald-400/80 font-mono font-bold">Done</span>
                        </div>

                        {/* Revert Button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveStatus(task.id, 'todo'); }}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 py-0.5 rounded bg-surface text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Revert back to To Do"
                        >
                          <Lucide.RotateCcw size={10} />
                          <span>Reopen</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: EISENHOWER 4-QUADRANT MATRIX ── */}
      {boardMode === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* QUADRANT 1: URGENT & IMPORTANT (DO FIRST) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'urgent_important')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropQuadrant(e, 'urgent_important')}
            className={`tile p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
              dragOverTarget === 'urgent_important'
                ? 'border-rose-500 bg-rose-500/10 ring-4 ring-rose-500/20'
                : 'border-rose-500/40 bg-rose-500/[0.03]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl">
                    <Lucide.AlertOctagon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Q1: Do First</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                        {matrixGroups.q1.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Urgent &amp; Important • Crises, immediate deadlines
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddModal(undefined, 'todo', 'urgent_important')}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  title="Add Q1 Task"
                >
                  <Lucide.Plus size={16} />
                </button>
              </div>

              {/* Task Cards in Q1 */}
              <div className="space-y-2 my-3 min-h-[200px] max-h-[360px] overflow-y-auto custom-scrollbar">
                {matrixGroups.q1.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center text-muted-foreground/40 border border-dashed border-rose-500/20 rounded-xl">
                    <p className="text-xs font-bold">No pressing crises</p>
                    <p className="text-[10px]">Drag urgent items here</p>
                  </div>
                ) : (
                  matrixGroups.q1.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="p-2.5 bg-surface-elevated/90 hover:bg-surface border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleCheckTask(task.id, task.isCompleted)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-rose-400 shrink-0">
                        {format(parseISO(task.dueDate), 'd MMM')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[11px] font-bold text-rose-400/80 pt-2 border-t border-rose-500/15 flex justify-between items-center">
              <span>Strategy: Execute immediately</span>
              <span className="font-mono">{matrixGroups.q1.filter(t => t.isCompleted).length}/{matrixGroups.q1.length} done</span>
            </div>
          </div>

          {/* QUADRANT 2: NOT URGENT & IMPORTANT (SCHEDULE) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'not_urgent_important')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropQuadrant(e, 'not_urgent_important')}
            className={`tile p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
              dragOverTarget === 'not_urgent_important'
                ? 'border-sky-500 bg-sky-500/10 ring-4 ring-sky-500/20'
                : 'border-sky-500/40 bg-sky-500/[0.03]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-sky-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                    <Lucide.CalendarCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Q2: Schedule</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300">
                        {matrixGroups.q2.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Not Urgent &amp; Important • Mastery, learning, strategic goals
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddModal(undefined, 'todo', 'not_urgent_important')}
                  className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/15 transition-colors cursor-pointer"
                  title="Add Q2 Task"
                >
                  <Lucide.Plus size={16} />
                </button>
              </div>

              {/* Task Cards in Q2 */}
              <div className="space-y-2 my-3 min-h-[200px] max-h-[360px] overflow-y-auto custom-scrollbar">
                {matrixGroups.q2.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center text-muted-foreground/40 border border-dashed border-sky-500/20 rounded-xl">
                    <p className="text-xs font-bold">No strategic tasks scheduled</p>
                    <p className="text-[10px]">Drag long-term goals here</p>
                  </div>
                ) : (
                  matrixGroups.q2.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="p-2.5 bg-surface-elevated/90 hover:bg-surface border border-sky-500/30 rounded-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleCheckTask(task.id, task.isCompleted)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-sky-400 shrink-0">
                        {format(parseISO(task.dueDate), 'd MMM')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[11px] font-bold text-sky-400/80 pt-2 border-t border-sky-500/15 flex justify-between items-center">
              <span>Strategy: Time-block &amp; focus</span>
              <span className="font-mono">{matrixGroups.q2.filter(t => t.isCompleted).length}/{matrixGroups.q2.length} done</span>
            </div>
          </div>

          {/* QUADRANT 3: URGENT & NOT IMPORTANT (DELEGATE / QUICK) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'urgent_not_important')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropQuadrant(e, 'urgent_not_important')}
            className={`tile p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
              dragOverTarget === 'urgent_not_important'
                ? 'border-amber-500 bg-amber-500/10 ring-4 ring-amber-500/20'
                : 'border-amber-500/40 bg-amber-500/[0.03]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
                    <Lucide.Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Q3: Delegate / Fast</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                        {matrixGroups.q3.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Urgent &amp; Not Important • Interruptions, quick chores
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddModal(undefined, 'todo', 'urgent_not_important')}
                  className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer"
                  title="Add Q3 Task"
                >
                  <Lucide.Plus size={16} />
                </button>
              </div>

              {/* Task Cards in Q3 */}
              <div className="space-y-2 my-3 min-h-[200px] max-h-[360px] overflow-y-auto custom-scrollbar">
                {matrixGroups.q3.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center text-muted-foreground/40 border border-dashed border-amber-500/20 rounded-xl">
                    <p className="text-xs font-bold">No interruptions</p>
                    <p className="text-[10px]">Drag quick favors/chores here</p>
                  </div>
                ) : (
                  matrixGroups.q3.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="p-2.5 bg-surface-elevated/90 hover:bg-surface border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleCheckTask(task.id, task.isCompleted)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-amber-400 shrink-0">
                        {format(parseISO(task.dueDate), 'd MMM')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[11px] font-bold text-amber-400/80 pt-2 border-t border-amber-500/15 flex justify-between items-center">
              <span>Strategy: Automate or delegate</span>
              <span className="font-mono">{matrixGroups.q3.filter(t => t.isCompleted).length}/{matrixGroups.q3.length} done</span>
            </div>
          </div>

          {/* QUADRANT 4: NOT URGENT & NOT IMPORTANT (ELIMINATE) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'neither')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropQuadrant(e, 'neither')}
            className={`tile p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
              dragOverTarget === 'neither'
                ? 'border-purple-500 bg-purple-500/10 ring-4 ring-purple-500/20'
                : 'border-purple-500/40 bg-purple-500/[0.03]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/15 text-purple-400 rounded-xl">
                    <Lucide.MinusCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Q4: Eliminate</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                        {matrixGroups.q4.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Neither • Low impact, distractions, backlogged ideas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAddModal(undefined, 'todo', 'neither')}
                  className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/15 transition-colors cursor-pointer"
                  title="Add Q4 Task"
                >
                  <Lucide.Plus size={16} />
                </button>
              </div>

              {/* Task Cards in Q4 */}
              <div className="space-y-2 my-3 min-h-[200px] max-h-[360px] overflow-y-auto custom-scrollbar">
                {matrixGroups.q4.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center text-muted-foreground/40 border border-dashed border-purple-500/20 rounded-xl">
                    <p className="text-xs font-bold">Inbox clean</p>
                    <p className="text-[10px]">No trivial items pending</p>
                  </div>
                ) : (
                  matrixGroups.q4.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onOpenEditModal(task)}
                      className="p-2.5 bg-surface-elevated/90 hover:bg-surface border border-purple-500/30 rounded-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleCheckTask(task.id, task.isCompleted)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-primary border-border/80 focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-purple-400 shrink-0">
                        {format(parseISO(task.dueDate), 'd MMM')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[11px] font-bold text-purple-400/80 pt-2 border-t border-purple-500/15 flex justify-between items-center">
              <span>Strategy: Drop or review later</span>
              <span className="font-mono">{matrixGroups.q4.filter(t => t.isCompleted).length}/{matrixGroups.q4.length} done</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskKanbanView;
