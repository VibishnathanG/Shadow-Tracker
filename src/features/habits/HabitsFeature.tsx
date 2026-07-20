'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { format, subDays } from 'date-fns';
import { Habit, Category } from '@/types';
import { fireConfetti, fireStreakConfetti } from '@/lib/confetti';

const MagicCrystal = () => (
  <motion.svg width="36" height="36" viewBox="0 0 100 100"
    animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    <defs>
      <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <motion.g
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.85, 1, 0.85] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50px 50px" }}
    >
      <path 
        d="M50 10 L70 40 L50 90 L30 40 Z" 
        fill="url(#crystalGrad)" 
        filter="url(#glow)"
      />
      <path d="M50 10 L70 40 L50 50 Z" fill="#ffffff" opacity="0.4" />
      <path d="M50 10 L30 40 L50 50 Z" fill="#000000" opacity="0.2" />
      <path d="M50 90 L70 40 L50 50 Z" fill="#ffffff" opacity="0.1" />
      <path d="M50 90 L30 40 L50 50 Z" fill="#000000" opacity="0.3" />
    </motion.g>
  </motion.svg>
);

const GrowingPlant = ({ level }: { level: number }) => (
  <motion.svg width="36" height="36" viewBox="0 0 100 100" className="overflow-visible">
    <defs>
      <linearGradient id="plantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
    <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50px 90px" }}>
      <motion.path 
        d="M50 90 Q40 60 50 30" 
        stroke="url(#plantGrad)" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.path 
        d="M48 60 Q20 50 30 30 Q45 40 48 60 Z" 
        fill="url(#plantGrad)"
        initial={{ scale: 0 }}
        animate={{ scale: level > 0 ? 1 : 0 }}
        transition={{ delay: 0.5, type: "spring" }}
        style={{ transformOrigin: "48px 60px" }}
      />
      <motion.path 
        d="M52 50 Q80 40 70 20 Q55 30 52 50 Z" 
        fill="url(#plantGrad)"
        initial={{ scale: 0 }}
        animate={{ scale: level > 1 ? 1 : 0 }}
        transition={{ delay: 0.7, type: "spring" }}
        style={{ transformOrigin: "52px 50px" }}
      />
      <motion.path 
        d="M50 30 Q35 10 50 0 Q65 10 50 30 Z" 
        fill="#22c55e"
        initial={{ scale: 0 }}
        animate={{ scale: level > 2 ? 1 : 0 }}
        transition={{ delay: 0.9, type: "spring" }}
        style={{ transformOrigin: "50px 30px" }}
      />
    </motion.g>
  </motion.svg>
);

const EnergyRingsArtwork = () => (
  <motion.svg width="36" height="36" viewBox="0 0 100 100">
    <motion.g animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "50px 50px" }}>
      <circle cx="50" cy="50" r="30" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="10 5" opacity="0.6"/>
    </motion.g>
    <motion.g animate={{ rotate: -360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "50px 50px" }}>
      <circle cx="50" cy="50" r="20" stroke="#a855f7" strokeWidth="3" fill="none" strokeDasharray="15 15" opacity="0.8"/>
    </motion.g>
    <motion.circle cx="50" cy="50" r="6" fill="#facc15"
      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.svg>
);

const getArtwork = (streak: number) => {
  if (streak >= 14) return <MagicCrystal />;
  if (streak >= 3) return <GrowingPlant level={Math.min(3, Math.floor(streak / 3))} />;
  return <EnergyRingsArtwork />;
};

interface PremiumHabitCardProps {
  habit: Habit;
  category?: Category;
  isCompletedToday: boolean;
  todayStr: string;
  miniHeatmapDays: Date[];
  onToggle: (id: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

const PremiumHabitCard: React.FC<PremiumHabitCardProps> = ({ habit, category, isCompletedToday, todayStr, miniHeatmapDays, onToggle, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const completedInLast21Days = useMemo(() => miniHeatmapDays.filter(d => habit.completedDates.includes(formatDateString(d))).length, [miniHeatmapDays, habit.completedDates]);
  const energyLevel = useMemo(() => Math.round((completedInLast21Days / 21) * 100), [completedInLast21Days]);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group rounded-3xl p-5 overflow-hidden transition-all duration-500 border ${
        isCompletedToday
          ? 'bg-gradient-to-br from-card to-primary/5 border-primary/30 shadow-[0_0_30px_-5px_rgba(var(--primary),0.15)]'
          : 'bg-surface-elevated/70 backdrop-blur-xl border-border/80 hover:border-border hover:shadow-lg hover:bg-surface-elevated/90'
      }`}
    >
      {isCompletedToday && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.15, 0], scale: [0.8, 1.2, 1.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-primary/30 rounded-full blur-[80px] pointer-events-none"
          style={{ transformOrigin: 'center' }}
        />
      )}

      <div className="absolute -right-16 -top-16 opacity-[0.04] pointer-events-none">
         <motion.svg width="250" height="250" viewBox="0 0 100 100" animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 50px' }}>
           <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" />
           <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="10 5" />
         </motion.svg>
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
             <div className="relative shrink-0">
               {isCompletedToday && (
                 <motion.div
                   animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 bg-primary rounded-full blur-md"
                 />
               )}
               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => onToggle(habit.id, todayStr)}
                 className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                   isCompletedToday
                     ? 'bg-gradient-to-tr from-primary to-purple-500 text-primary-foreground shadow-lg shadow-primary/40 scale-105'
                     : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60'
                 }`}
               >
                 <motion.div
                   animate={isCompletedToday ? { scale: [1, 1.1, 1] } : {}}
                   transition={{ duration: 2, repeat: Infinity }}
                 >
                   <Lucide.Check size={22} className={isCompletedToday ? 'stroke-[3px]' : 'opacity-50'} />
                 </motion.div>
               </motion.button>
             </div>

             <div className="min-w-0 flex-1">
               <motion.h3 layout className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2 truncate">
                 <span className="truncate">{habit.name}</span>
                 <motion.div
                   animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   className="shrink-0"
                 >
                   <Lucide.Sparkles size={14} className={isCompletedToday ? "text-primary" : "text-muted-foreground/50"} />
                 </motion.div>
               </motion.h3>
               {habit.description && (
                 <p className="text-xs text-muted-foreground mt-0.5 truncate">
                   {habit.description}
                 </p>
               )}
             </div>
          </div>
          
          <div className="flex items-center shrink-0">
            <div className="mr-2 pointer-events-none drop-shadow-lg">
              {getArtwork(habit.streakCount)}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(habit)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
                <Lucide.Edit2 size={14} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(habit.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-red-500/10 rounded-lg transition-all">
                <Lucide.Trash2 size={14} />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-border/40">
            <motion.div
              animate={{ rotate: [-5, 5, -5], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lucide.Flame size={14} className={habit.streakCount > 0 ? "text-foreground" : "text-muted-foreground"} />
            </motion.div>
            <span className={habit.streakCount > 0 ? "text-foreground" : ""}>{habit.streakCount} Day{habit.streakCount !== 1 && 's'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-border/40">
            <Lucide.Trophy size={14} className={habit.longestStreak > 0 ? "text-foreground" : "text-muted-foreground"} />
            <span className={habit.longestStreak > 0 ? "text-foreground" : ""}>Best: {habit.longestStreak}</span>
          </div>

          {category && (
            <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-border/40">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}` }} />
              <span className="truncate max-w-[80px]">{category.name}</span>
            </div>
          )}
        </div>

        <div className="pt-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Lucide.BatteryCharging size={11} className={energyLevel > 0 ? "text-foreground" : ""} /> 
              Vitality Base
            </span>
            <span className="text-xs font-bold text-foreground">{energyLevel}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary/50 to-primary relative"
            >
               <motion.div
                 animate={{ x: ['-100%', '200%'] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
                 className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
               />
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={false}
          animate={{ height: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-2 border-t border-border/40">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Consistency Timeline (21d)</span>
            </div>
            <div className="flex gap-1 justify-between">
              {miniHeatmapDays.map((date, i) => {
                const dateStr = formatDateString(date);
                const isDone = habit.completedDates.includes(dateStr);
                const isTodayDate = dateStr === todayStr;

                return (
                  <div key={dateStr} className="relative group/heatmap flex-1 h-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: isHovered ? i * 0.02 : 0, type: "spring", stiffness: 300 }}
                      className={`w-full h-full rounded-[3px] border transition-colors ${
                        isDone
                          ? 'bg-primary border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]'
                          : isTodayDate
                          ? 'border-primary/50 border-dashed bg-primary/10'
                          : 'bg-secondary/60 border-border/40'
                      }`}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/heatmap:block z-50 pointer-events-none">
                      <motion.div initial={{ opacity: 0, y: 5, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-surface-elevated border border-border px-2 py-1 rounded shadow-xl whitespace-nowrap flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span className="text-sm">{isDone ? '🔥' : '🌱'}</span>
                        <div className="flex flex-col">
                          <span>{format(date, 'do MMM')}</span>
                          <span className="text-muted-foreground">{isDone ? 'Completed' : 'Pending'}</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const HabitsFeature: React.FC = () => {
  const {
    habits,
    categories,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    deleteHabit,
  } = useShadowTrackerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [formCustomDays, setFormCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const todayStr = getTodayDateString();

  const openAddModal = useCallback(() => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormCategoryId('');
    setFormFrequency('daily');
    setFormCustomDays([1, 2, 3, 4, 5]);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description || '');
    setFormCategoryId(habit.categoryId || '');
    setFormFrequency(habit.frequency);
    setFormCustomDays(habit.customDays || [1, 2, 3, 4, 5]);
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const habitPayload = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      categoryId: formCategoryId || undefined,
      frequency: formFrequency,
      customDays: formFrequency === 'custom' ? formCustomDays : undefined,
    };

    if (editingHabit) {
      await updateHabit(editingHabit.id, habitPayload);
    } else {
      await addHabit(habitPayload);
    }

    setIsModalOpen(false);
  }, [editingHabit, formName, formDesc, formCategoryId, formFrequency, formCustomDays, updateHabit, addHabit]);

  const toggleDaySelection = useCallback((day: number) => {
    setFormCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  }, []);

  const getPastDays = useCallback((count: number) => {
    const dates: Date[] = [];
    for (let i = count - 1; i >= 0; i--) {
      dates.push(subDays(new Date(), i));
    }
    return dates;
  }, []);

  const miniHeatmapDays = useMemo(() => getPastDays(21), [getPastDays]);
  const globalHeatmapDays = useMemo(() => getPastDays(105), [getPastDays]);

  const overallCompletionRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const totalPossible = habits.length * 30;
    let totalCompleted = 0;
    const thirtyDaysAgo = subDays(new Date(), 30);

    habits.forEach(h => {
      h.completedDates.forEach((d: string) => {
        if (new Date(d) >= thirtyDaysAgo) {
          totalCompleted++;
        }
      });
    });

    return Math.round((totalCompleted / totalPossible) * 100);
  }, [habits]);

  const daysOfWeekLabels = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Habit Routines</h2>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
            Build discipline via recurring atomic milestones
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Lucide.Plus size={15} />
          Create Habit
        </motion.button>
      </div>

      {habits.length > 0 && (
        <div className="tile p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Lucide.Grid size={14} className="text-foreground" /> Matrix Consistency (Last 15 Weeks)
            </h3>
            <span className="text-xs font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-full">
              30d Rate: {overallCompletionRate}%
            </span>
          </div>

          <div className="flex flex-wrap gap-1 items-center justify-start overflow-x-auto py-1">
            {globalHeatmapDays.map((date, idx) => {
              const dateStr = formatDateString(date);
              const completions = habits.filter(h => h.completedDates.includes(dateStr)).length;
              const ratio = habits.length > 0 ? completions / habits.length : 0;
              
              let bgClass = 'bg-secondary/45 border-border/40';
              if (ratio > 0.75) bgClass = 'bg-primary border-primary/20';
              else if (ratio > 0.45) bgClass = 'bg-primary/70 border-primary/20';
              else if (ratio > 0.15) bgClass = 'bg-primary/35 border-primary/10';
              else if (ratio > 0) bgClass = 'bg-primary/15 border-primary/5';

              return (
                <div
                  key={dateStr}
                  className={`w-3.5 h-3.5 rounded-md border heatmap-cell ${bgClass}`}
                  title={`${completions} completions on ${format(date, 'MMM dd, yyyy')}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mt-3 font-semibold">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-secondary/45 border border-border/40 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-primary/15 border border-primary/5 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-primary/35 border border-primary/10 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-primary/70 border border-primary/20 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-primary border border-primary/20 rounded-sm" />
            <span>More</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const isCompletedToday = habit.completedDates.includes(todayStr);
            const category = categories.find(c => c.id === habit.categoryId);

            return (
              <PremiumHabitCard
                key={habit.id}
                habit={habit}
                category={category}
                isCompletedToday={isCompletedToday}
                todayStr={todayStr}
                miniHeatmapDays={miniHeatmapDays}
                onToggle={(id, date) => {
                  if (!isCompletedToday && date === todayStr) {
                    if (habit.streakCount >= 4) fireStreakConfetti();
                    else fireConfetti();
                  }
                  toggleHabitCompletion(id, date);
                }}
                onEdit={openEditModal}
                onDelete={deleteHabit}
              />
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon="Repeat"
              title="No habit routines configured"
              description="Establishing structured patterns leads to continuous development."
              actionLabel="Establish Habit"
              onAction={openAddModal}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabit ? 'Modify Routine' : 'Create Routine'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Habit Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Read code architectures"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground placeholder-muted-foreground border border-border/40 focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Description</label>
            <textarea
              placeholder="Why is this routine critical to build?"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground placeholder-muted-foreground border border-border/40 focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Link</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground border border-border/40 focus:border-primary outline-none cursor-pointer"
            >
              <option value="">Unassigned</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule Rule</label>
            <select
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as 'daily' | 'weekly' | 'custom')}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground border border-border/40 focus:border-primary outline-none cursor-pointer"
            >
              <option value="daily">Every Single Day</option>
              <option value="weekly">Once A Week</option>
              <option value="custom">Custom Days Selection</option>
            </select>
          </div>

          {formFrequency === 'custom' && (
            <div className="space-y-2 border-t border-border/40 pt-4 animate-fadeIn">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Active Days</label>
              <div className="flex gap-1.5">
                {daysOfWeekLabels.map((dayLabel, idx) => {
                  const isActive = formCustomDays.includes(idx);
                  return (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      key={idx}
                      type="button"
                      onClick={() => toggleDaySelection(idx)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary/20 shadow-md shadow-primary/10'
                          : 'bg-secondary/45 border-border/60 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {dayLabel}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3.5 border-t border-border/40 pt-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl shadow-md shadow-primary/25 transition-all"
            >
              {editingHabit ? 'Save Routine' : 'Start Routine'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HabitsFeature;
