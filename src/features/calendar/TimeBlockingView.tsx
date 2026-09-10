'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import confetti from 'canvas-confetti';

export interface TimeBlock {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: 'work' | 'deep_work' | 'health' | 'personal' | 'meeting' | 'routine';
  color?: string;
  taskId?: string;
  isCompleted?: boolean;
}

const CATEGORY_COLORS: Record<TimeBlock['category'], { bg: string; text: string; border: string; label: string }> = {
  deep_work: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/40', label: 'Deep Work' },
  work: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40', label: 'Work / Tasks' },
  health: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Health & Gym' },
  meeting: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Meeting / Call' },
  personal: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40', label: 'Personal / Break' },
  routine: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/40', label: 'Routine / Habit' },
};

const STORAGE_KEY = 'shadow_timeline_blocks_v1';

export const TimeBlockingView: React.FC<{
  selectedDate: string;
}> = ({ selectedDate }) => {
  const { tasks, addXp } = useShadowTrackerStore();
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Save changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    }
  }, [blocks]);

  const dateBlocks = useMemo(() => {
    return blocks
      .filter(b => b.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [blocks, selectedDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockTitle, setBlockTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<TimeBlock['category']>('deep_work');
  const [taggedTaskId, setTaggedTaskId] = useState<string>('');

  // Current time marker
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const handleOpenAdd = (defaultHour?: number) => {
    setEditingBlockId(null);
    setBlockTitle('');
    const hStr = defaultHour ? String(defaultHour).padStart(2, '0') : '09';
    const nextHStr = defaultHour ? String(defaultHour + 1).padStart(2, '0') : '10';
    setStartTime(`${hStr}:00`);
    setEndTime(`${nextHStr}:00`);
    setCategory('deep_work');
    setTaggedTaskId('');
    setIsModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    if (editingBlockId) {
      setBlocks(prev => prev.map(b => b.id === editingBlockId ? {
        ...b,
        title: blockTitle.trim(),
        startTime,
        endTime,
        category,
        taskId: taggedTaskId || undefined,
      } : b));
    } else {
      const newBlock: TimeBlock = {
        id: Math.random().toString(36).substring(2, 9),
        date: selectedDate,
        title: blockTitle.trim(),
        startTime,
        endTime,
        category,
        taskId: taggedTaskId || undefined,
        isCompleted: false,
      };
      setBlocks(prev => [...prev, newBlock]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === id) {
        const nextState = !b.isCompleted;
        if (nextState) {
          confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
          addXp(15);
        }
        return { ...b, isCompleted: nextState };
      }
      return b;
    }));
  };

  // Auto-Schedule Today's Tasks into open slots
  const handleAutoSchedule = () => {
    const todayTasks = tasks.filter(t => t.dueDate === selectedDate && !t.isCompleted);
    if (todayTasks.length === 0) {
      alert('No pending tasks for this date to schedule!');
      return;
    }

    let startH = 9;
    const newScheduled: TimeBlock[] = [];

    todayTasks.slice(0, 5).forEach((t) => {
      // Find next hour slot not already occupied
      while (dateBlocks.some(b => parseInt(b.startTime.split(':')[0], 10) === startH) && startH < 22) {
        startH++;
      }
      if (startH >= 22) return;

      const sTime = `${String(startH).padStart(2, '0')}:00`;
      const eTime = `${String(startH + 1).padStart(2, '0')}:00`;

      newScheduled.push({
        id: Math.random().toString(36).substring(2, 9),
        date: selectedDate,
        title: t.title,
        startTime: sTime,
        endTime: eTime,
        category: t.priority === 'high' ? 'deep_work' : 'work',
        taskId: t.id,
        isCompleted: false,
      });

      startH++;
    });

    if (newScheduled.length > 0) {
      setBlocks(prev => [...prev, ...newScheduled]);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      alert(`Auto-scheduled ${newScheduled.length} tasks into your day's time slots!`);
    }
  };

  return (
    <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-purple-500/15 text-purple-400 rounded-2xl border border-purple-500/30">
            <Lucide.Clock size={20} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
              Daily Time-Blocking &amp; Timeline
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Hour-by-hour calendar planner for deep work and intentional schedule blocks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoSchedule}
            className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Auto-place pending tasks into open hours"
          >
            <Lucide.Wand2 size={14} />
            <span className="hidden sm:inline">Auto-Schedule Tasks</span>
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Lucide.Plus size={14} /> Add Block
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative border border-border/70 rounded-2xl bg-surface/30 overflow-hidden select-none">
        {/* Hour Rows */}
        <div className="divide-y divide-border/40">
          {hours.map((h) => {
            const hStr = `${String(h).padStart(2, '0')}:00`;
            const rowBlocks = dateBlocks.filter(b => {
              const start = timeToMinutes(b.startTime);
              const rowStart = h * 60;
              return start >= rowStart && start < rowStart + 60;
            });

            return (
              <div
                key={h}
                onClick={() => handleOpenAdd(h)}
                className="flex items-start min-h-[58px] p-2 hover:bg-surface-elevated/50 transition-colors cursor-pointer group relative"
              >
                {/* Time Label */}
                <div className="w-14 shrink-0 font-mono font-bold text-xs text-muted-foreground group-hover:text-primary pt-0.5">
                  {hStr}
                </div>

                {/* Blocks Container */}
                <div className="flex-1 flex flex-wrap gap-2 pl-2">
                  {rowBlocks.map(block => {
                    const cfg = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.work;
                    return (
                      <div
                        key={block.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBlockId(block.id);
                          setBlockTitle(block.title);
                          setStartTime(block.startTime);
                          setEndTime(block.endTime);
                          setCategory(block.category);
                          setTaggedTaskId(block.taskId || '');
                          setIsModalOpen(true);
                        }}
                        className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${cfg.bg} ${cfg.border} ${block.isCompleted ? 'opacity-50 line-through' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(block.id);
                            }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer ${
                              block.isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                            }`}
                          >
                            {block.isCompleted && <Lucide.Check size={11} strokeWidth={3} />}
                          </button>
                          <span className={`font-black ${cfg.text}`}>{block.startTime}–{block.endTime}</span>
                          <span className="font-bold text-foreground">{block.title}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
                          className="text-muted-foreground hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                        >
                          <Lucide.Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live "Now" Line Indicator (Only shown for today) */}
        {selectedDate === new Date().toISOString().split('T')[0] && currentTimeMinutes >= 6 * 60 && currentTimeMinutes <= 24 * 60 && (
          <div
            className="absolute left-14 right-0 pointer-events-none z-20 flex items-center"
            style={{
              top: `${((currentTimeMinutes - 6 * 60) / (18 * 60)) * 100}%`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-md shadow-rose-500/50 animate-pulse" />
            <div className="h-[2px] w-full bg-rose-500 shadow-sm opacity-80" />
          </div>
        )}
      </div>

      {/* Add / Edit Block Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border/80 text-foreground rounded-3xl shadow-2xl p-6 space-y-4 my-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Lucide.Clock size={16} className="text-primary" />
                  {editingBlockId ? 'Edit Time Block' : 'Add Time Block'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                  <Lucide.X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveBlock} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Block Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Work on API Refactor, Gym Session..."
                    value={blockTitle}
                    onChange={e => setBlockTitle(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(CATEGORY_COLORS) as Array<TimeBlock['category']>).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                          category === cat
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-secondary text-foreground border-border/60 hover:bg-surface'
                        }`}
                      >
                        {CATEGORY_COLORS[cat].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Link Task (Optional)</label>
                  <select
                    value={taggedTaskId}
                    onChange={e => {
                      setTaggedTaskId(e.target.value);
                      if (!blockTitle && e.target.value) {
                        const t = tasks.find(item => item.id === e.target.value);
                        if (t) setBlockTitle(t.title);
                      }
                    }}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none cursor-pointer"
                  >
                    <option value="">No Linked Task</option>
                    {tasks.filter(t => !t.isCompleted).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl shadow-md hover:bg-primary/90"
                  >
                    {editingBlockId ? 'Save Changes' : 'Create Block'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
