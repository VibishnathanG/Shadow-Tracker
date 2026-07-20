'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { fireConfetti } from '@/lib/confetti';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { format, addDays } from 'date-fns';
import type { Task } from '@/types';

export const TasksFeature: React.FC = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
  } = useShadowTrackerStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState(getTodayDateString());
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');

  const openAddModal = useCallback(() => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormDueDate(getTodayDateString());
    setFormPriority('medium');
    setFormCategoryId('');
    setFormIsRecurring(false);
    setFormRecurrencePattern('daily');
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormDueDate(task.dueDate);
    setFormPriority(task.priority);
    setFormCategoryId(task.categoryId || '');
    setFormIsRecurring(task.isRecurring);
    setFormRecurrencePattern(task.recurrencePattern || 'daily');
    setIsModalOpen(true);
  }, []);

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
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskPayload);
      } else {
        await addTask(taskPayload);
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsModalOpen(false);
    }
  }, [formTitle, formDesc, formDueDate, formPriority, formCategoryId, formIsRecurring, formRecurrencePattern, editingTask, updateTask, addTask]);

  const handleSnooze = useCallback(async (id: string, dateStr: string) => {
    const nextDate = formatDateString(addDays(new Date(dateStr), 1));
    await updateTask(id, { dueDate: nextDate });
  }, [updateTask]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (activeTab === 'pending' && task.isCompleted) return false;
      if (activeTab === 'completed' && !task.isCompleted) return false;

      if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) return false;

      return true;
    });
  }, [tasks, activeTab, searchQuery, priorityFilter, categoryFilter]);

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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Tasks Workspace</h2>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mt-1">
            Focus lists and dynamic recurrence schedules
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-5 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Lucide.Plus size={18} />
          Create Task
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface border border-border/60 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative z-10">
        <div className="sm:col-span-2 relative group">
          <Lucide.Search className="absolute left-3.5 top-3 text-muted-foreground group-hover:text-foreground transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-surface-elevated rounded-xl border border-transparent focus:border-border hover:bg-surface-elevated/80 focus:bg-surface-elevated text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="relative group">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl border border-transparent text-muted-foreground focus:text-foreground hover:bg-surface-elevated/80 cursor-pointer outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" size={16} />
        </div>

        <div className="relative group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-sm px-4 py-2.5 bg-surface-elevated rounded-xl border border-transparent text-muted-foreground focus:text-foreground hover:bg-surface-elevated/80 cursor-pointer outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Lucide.ChevronDown className="absolute right-3.5 top-3 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" size={16} />
        </div>
      </div>

      <div className="flex border-b border-border/50 relative z-10">
        {(['pending', 'completed', 'all'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`px-5 py-3 text-sm font-bold capitalize border-b-2 transition-all relative ${
              activeTab === tab 
                ? 'border-primary text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {tab === 'pending' && tasks.filter(t=>!t.isCompleted).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">
                {tasks.filter(t=>!t.isCompleted).length}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="space-y-3 relative z-10">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const taskCategory = categories.find(c => c.id === task.categoryId);
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-border/80 hover:border-border hover:shadow-md rounded-2xl transition-all gap-4 ${
                  task.isCompleted ? 'opacity-65 bg-surface-elevated/50 border-border/30' : ''
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <motion.button
                    layout
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!task.isCompleted) fireConfetti();
                      toggleTaskCompletion(task.id);
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
          })
        ) : (
          <EmptyState
            icon="CheckSquare"
            title="No tasks match these filters"
            description="Clear search / filters, or add a new task to get started."
            actionLabel="Add Task"
            onAction={openAddModal}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Focus Task' : 'Schedule New Task'}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Design app interface"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-surface-elevated rounded-xl text-foreground placeholder:text-muted-foreground border border-border/40 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
            <textarea
              placeholder="Provide a quick action summary..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full text-sm px-4 py-3 bg-surface-elevated rounded-xl text-foreground placeholder:text-muted-foreground border border-border/40 focus:border-primary outline-none resize-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
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
                className="w-full text-base px-5 py-3.5 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Lucide.ChevronDown className="absolute right-4 top-10 text-muted-foreground pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-surface-elevated rounded-xl text-foreground border border-border/40 focus:border-primary outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
            >
              <option value="">Uncategorized</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Lucide.ChevronDown className="absolute right-4 top-10 text-muted-foreground pointer-events-none" size={16} />
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
                  className="flex-1 text-base px-5 py-3.5 bg-secondary rounded-2xl text-foreground font-semibold border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekly">Every Week</option>
                  <option value="monthly">Every Month</option>
                </select>
                <Lucide.ChevronDown className="absolute right-4 top-10 text-muted-foreground pointer-events-none" size={16} />
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  When completed, the app will automatically schedule the next task occurrence based on this rule.
                </p>
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
