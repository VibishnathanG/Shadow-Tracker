'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString, getHabitDateStatus, parseDateString } from '@/lib/dateUtils';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { NiceTimePicker } from '@/components/NiceTimePicker';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { format, subDays, addDays } from 'date-fns';
import { Habit, Category } from '@/types';
import { fireConfetti, fireStreakConfetti } from '@/lib/confetti';
import { useViewPreference } from '@/lib/viewPreferences';

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
  isCompleted: boolean;
  isUncompleted: boolean;
  reasonText?: string;
  isFutureDate: boolean;
  isPastGracePeriod: boolean;
  selectedDateStr: string;
  todayStr: string;
  miniHeatmapDays: Date[];
  onToggle: (id: string, date: string) => void;
  onMarkUncompleted: (habit: Habit, date: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

const PremiumHabitCard: React.FC<PremiumHabitCardProps> = ({
  habit,
  category,
  isCompleted,
  isUncompleted,
  reasonText,
  isFutureDate,
  isPastGracePeriod,
  selectedDateStr,
  todayStr,
  miniHeatmapDays,
  onToggle,
  onMarkUncompleted,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const completedInLast21Days = useMemo(() => miniHeatmapDays.filter(d => habit.completedDates.includes(formatDateString(d))).length, [miniHeatmapDays, habit.completedDates]);
  const energyLevel = useMemo(() => Math.round((completedInLast21Days / 21) * 100), [completedInLast21Days]);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.015, transition: { type: "spring", stiffness: 400, damping: 12 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group rounded-3xl p-4 sm:p-5 overflow-hidden transition-all duration-500 border ${
        isCompleted
          ? 'bg-gradient-to-br from-card/95 to-primary/10 border-primary/30 shadow-[0_0_30px_-5px_rgba(var(--primary),0.15)]'
          : isUncompleted
          ? 'bg-gradient-to-br from-card/95 to-rose-500/10 border-rose-500/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]'
          : 'bg-surface-elevated/95 backdrop-blur-xl border-border/80 hover:border-border hover:shadow-lg hover:bg-surface-elevated'
      }`}
    >
      {isCompleted && (
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
      
      {/* Top-Right Streak Prism / Crystal Artwork */}
      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 pointer-events-none drop-shadow-md z-10 transition-transform group-hover:scale-105">
        {getArtwork(habit.streakCount)}
      </div>

      <div className="relative z-10 space-y-3.5">
        {/* TOP ROW: Check/X Actions + Vitality + Edit/Delete */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Action Control: Complete Checkmark & Not Completed X */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Complete Check Button (✓) */}
            <div className="relative">
              {isCompleted && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary rounded-xl blur-sm pointer-events-none"
                />
              )}
              <motion.button
                whileTap={!isFutureDate && !isPastGracePeriod ? { scale: 0.93 } : undefined}
                disabled={isFutureDate || isPastGracePeriod}
                onClick={() => onToggle(habit.id, selectedDateStr)}
                className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isFutureDate
                    ? 'bg-secondary/20 text-muted-foreground/30 border border-border/40 cursor-not-allowed opacity-35'
                    : isPastGracePeriod
                    ? isCompleted
                      ? 'bg-primary/50 text-white/80 border border-primary/40 cursor-not-allowed opacity-60'
                      : 'bg-secondary/20 text-muted-foreground/30 border border-border/40 cursor-not-allowed opacity-35'
                    : isCompleted
                    ? 'bg-gradient-to-tr from-primary to-purple-500 text-primary-foreground shadow-md shadow-primary/40 scale-105 border border-primary/40 cursor-pointer'
                    : 'bg-surface-elevated/90 text-secondary hover:text-primary hover:border-primary/60 border-2 border-border/90 shadow-xs cursor-pointer'
                }`}
                title={
                  isFutureDate
                    ? 'Future habits cannot be marked complete before date'
                    : isPastGracePeriod
                    ? '3-day grace period expired - cannot update'
                    : isCompleted
                    ? 'Completed (Click to untoggle)'
                    : 'Mark as Completed'
                }
              >
                <Lucide.Check
                  size={20}
                  className={
                    isCompleted
                      ? 'stroke-[3px]'
                      : isFutureDate || isPastGracePeriod
                      ? 'opacity-20'
                      : 'opacity-40 hover:opacity-100 stroke-[2.5px]'
                  }
                />
              </motion.button>
            </div>

            {/* Not Completed Button (✗) */}
            <div className="relative">
              {isUncompleted && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-rose-500 rounded-xl blur-sm pointer-events-none"
                />
              )}
              <motion.button
                whileTap={!isFutureDate ? { scale: 0.93 } : undefined}
                disabled={isFutureDate}
                onClick={() => onMarkUncompleted(habit, selectedDateStr)}
                className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isFutureDate
                    ? 'bg-secondary/20 text-muted-foreground/30 border border-border/40 cursor-not-allowed opacity-35'
                    : isUncompleted
                    ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/60 shadow-md shadow-rose-500/20 scale-105 cursor-pointer'
                    : 'bg-surface-elevated/90 text-secondary hover:text-rose-400 hover:border-rose-500/60 border-2 border-border/90 shadow-xs cursor-pointer'
                }`}
                title={
                  isFutureDate
                    ? 'Cannot log reasons for future dates'
                    : isUncompleted
                    ? `Marked uncompleted${reasonText ? `: "${reasonText}"` : ''} (Click to edit reason)`
                    : 'Mark Not Completed (Optional reason)'
                }
              >
                <Lucide.X
                  size={18}
                  className={
                    isUncompleted
                      ? 'stroke-[3px]'
                      : isFutureDate
                      ? 'opacity-20'
                      : 'opacity-40 hover:opacity-100 stroke-[2.5px]'
                  }
                />
              </motion.button>
            </div>
          </div>

          {/* Vitality in Top Row - Fully visible with dedicated clearance for the top-right prism logo */}
          <div className="flex-1 min-w-0 px-2 sm:px-3 pr-12 sm:pr-14">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-secondary uppercase tracking-wider flex items-center gap-1">
                <Lucide.BatteryCharging size={13} className="text-primary shrink-0" /> 
                <span className="font-extrabold text-foreground/90 whitespace-nowrap">Vitality</span>
              </span>
              <span className="text-xs font-black text-foreground font-mono ml-1 shrink-0">{energyLevel}%</span>
            </div>
            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
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
          
          {/* Action Controls (Edit/Delete) */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity relative z-20">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onEdit(habit); }} 
                className="p-1.5 text-secondary hover:text-foreground hover:bg-surface-elevated rounded-lg transition-all cursor-pointer"
                title="Edit Habit"
              >
                <Lucide.Edit2 size={15} />
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }} 
                className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                title="Delete Habit"
              >
                <Lucide.Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* DOWN/BOTTOM SECTION: Full Habit Name & Multi-line Description */}
        <div className="min-w-0 pt-1">
          <motion.h3 layout className="text-base font-extrabold tracking-tight text-foreground flex items-start justify-between gap-2 leading-snug">
            <span className="break-words">{habit.name}</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="shrink-0 mt-0.5"
            >
              <Lucide.Sparkles size={14} className={isCompleted ? "text-primary" : "text-primary/40"} />
            </motion.div>
          </motion.h3>
          {habit.description && (
            <p className="text-xs text-secondary font-medium mt-1 leading-relaxed break-words">
              {habit.description}
            </p>
          )}
          {reasonText && (
            <button
              type="button"
              onClick={() => onMarkUncompleted(habit, selectedDateStr)}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold hover:bg-amber-500/25 transition-all text-left max-w-full"
              title="Click to view/edit reflection reason"
            >
              <Lucide.FileEdit size={11} className="shrink-0 text-amber-400" />
              <span className="truncate max-w-[280px]">Reason: {reasonText}</span>
            </button>
          )}
        </div>

        {/* Streaks & Category Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-surface-elevated/95 px-2.5 py-1.5 rounded-xl border border-border/80 shadow-xs">
            <motion.div
              animate={{ rotate: [-5, 5, -5], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lucide.Flame size={14} className={habit.streakCount > 0 ? "text-amber-400 fill-amber-400" : "text-amber-400/60"} />
            </motion.div>
            <span className={habit.streakCount > 0 ? "text-amber-400 font-black" : "text-secondary font-bold"}>{habit.streakCount} Day{habit.streakCount !== 1 && 's'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-elevated/95 px-2.5 py-1.5 rounded-xl border border-border/80 shadow-xs">
            <Lucide.Trophy size={14} className={habit.longestStreak > 0 ? "text-amber-400" : "text-amber-400/60"} />
            <span className={habit.longestStreak > 0 ? "text-amber-400 font-black" : "text-secondary font-bold"}>Best: {habit.longestStreak}</span>
          </div>

          {category && (
            <div className="flex items-center gap-1.5 bg-surface-elevated/95 px-2.5 py-1.5 rounded-xl border border-border/80 shadow-xs max-w-full">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0" style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}` }} />
              <span className="text-foreground font-black text-xs truncate max-w-[130px] sm:max-w-none">{category.name}</span>
            </div>
          )}
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
    reminders,
    addHabit,
    updateHabit,
    toggleHabitCompletion,
    markHabitUncompleted,
    clearHabitUncompleted,
    deleteHabit,
    addReminder,
    updateReminder,
    settings,
  } = useShadowTrackerStore();
  const graceDays = settings?.habitGracePeriodDays ?? 3;

  const [habitFilter, setHabitFilter] = useViewPreference('habitsFilter') as ['all' | 'today' | 'yesterday' | 'tomorrow' | 'pending-today' | 'completed-today', (v: 'all' | 'today' | 'yesterday' | 'tomorrow' | 'pending-today' | 'completed-today') => void];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [reasonModal, setReasonModal] = useState<{ habit: Habit; dateStr: string } | null>(null);
  const [presetReason, setPresetReason] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [formCustomDays, setFormCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Notification Reminder State
  const [formEnableNotification, setFormEnableNotification] = useState(false);
  const [formNotifyTime, setFormNotifyTime] = useState('08:00');
  const [formNotifyDays, setFormNotifyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const todayStr = getTodayDateString();

  const openAddModal = useCallback(() => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormCategoryId('');
    setFormFrequency('daily');
    setFormCustomDays([1, 2, 3, 4, 5]);
    setFormEnableNotification(false);
    setFormNotifyTime('08:00');
    setFormNotifyDays([0, 1, 2, 3, 4, 5, 6]);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description || '');
    setFormCategoryId(habit.categoryId || '');
    setFormFrequency(habit.frequency);
    setFormCustomDays(habit.customDays || [1, 2, 3, 4, 5]);

    const existingReminder = reminders.find(r => r.habitId === habit.id);
    if (existingReminder) {
      setFormEnableNotification(existingReminder.isEnabled);
      setFormNotifyTime(existingReminder.time || '08:00');
      setFormNotifyDays(existingReminder.days || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setFormEnableNotification(false);
      setFormNotifyTime('08:00');
      setFormNotifyDays([0, 1, 2, 3, 4, 5, 6]);
    }

    setIsModalOpen(true);
  }, [reminders]);

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

    let savedHabitId = editingHabit?.id;
    if (editingHabit) {
      await updateHabit(editingHabit.id, habitPayload);
    } else {
      const created = await addHabit(habitPayload);
      savedHabitId = created?.id;
    }

    if (savedHabitId) {
      const existing = reminders.find(r => r.habitId === savedHabitId);
      if (formEnableNotification) {
        if (existing) {
          await updateReminder(existing.id, {
            title: formName.trim(),
            time: formNotifyTime,
            days: formNotifyDays,
            isEnabled: true,
          });
        } else {
          await addReminder({
            title: formName.trim(),
            time: formNotifyTime,
            days: formNotifyDays,
            isEnabled: true,
            type: 'habit',
            habitId: savedHabitId,
          });
        }
      } else if (existing) {
        await updateReminder(existing.id, { isEnabled: false });
      }
    }

    setIsModalOpen(false);
  }, [editingHabit, formName, formDesc, formCategoryId, formFrequency, formCustomDays, formEnableNotification, formNotifyTime, formNotifyDays, updateHabit, addHabit, reminders, addReminder, updateReminder]);

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

  const activeDateStr = useMemo(() => {
    if (habitFilter === 'tomorrow') return formatDateString(addDays(new Date(), 1));
    if (habitFilter === 'yesterday') return formatDateString(subDays(new Date(), 1));
    return todayStr;
  }, [habitFilter, todayStr]);

  const activeDateStatus = useMemo(() => {
    return getHabitDateStatus(activeDateStr, todayStr, graceDays);
  }, [activeDateStr, todayStr, graceDays]);

  const openReasonModal = useCallback((habit: Habit, dateStr: string) => {
    setReasonModal({ habit, dateStr });
    setCustomReasonText(habit.missedReasons?.[dateStr] || '');
    setPresetReason('');
  }, []);

  const handleSaveReason = useCallback(async () => {
    if (!reasonModal) return;
    const { habit, dateStr } = reasonModal;
    const finalReason = customReasonText.trim() || presetReason || '';
    await markHabitUncompleted(habit.id, dateStr, finalReason);
    setReasonModal(null);
    setPresetReason('');
    setCustomReasonText('');
  }, [reasonModal, customReasonText, presetReason, markHabitUncompleted]);

  const handleClearReasonStatus = useCallback(async () => {
    if (!reasonModal) return;
    const { habit, dateStr } = reasonModal;
    await clearHabitUncompleted(habit.id, dateStr);
    setReasonModal(null);
    setPresetReason('');
    setCustomReasonText('');
  }, [reasonModal, clearHabitUncompleted]);

  const filteredHabits = useMemo(() => {
    const todayObj = new Date();
    const todayDayOfWeek = todayObj.getDay();
    const yesterdayDayOfWeek = (todayDayOfWeek + 6) % 7;
    const tomorrowDayOfWeek = (todayDayOfWeek + 1) % 7;

    return habits.filter(habit => {
      const isCompletedOnActiveDate = habit.completedDates.includes(activeDateStr);

      const isScheduledToday = habit.frequency === 'daily' || habit.frequency === 'weekly' || (habit.frequency === 'custom' && (habit.customDays?.includes(todayDayOfWeek) ?? true));
      const isScheduledYesterday = habit.frequency === 'daily' || habit.frequency === 'weekly' || (habit.frequency === 'custom' && (habit.customDays?.includes(yesterdayDayOfWeek) ?? true));
      const isScheduledTomorrow = habit.frequency === 'daily' || habit.frequency === 'weekly' || (habit.frequency === 'custom' && (habit.customDays?.includes(tomorrowDayOfWeek) ?? true));

      if (habitFilter === 'today' && !isScheduledToday) return false;
      if (habitFilter === 'yesterday' && !isScheduledYesterday) return false;
      if (habitFilter === 'tomorrow' && !isScheduledTomorrow) return false;
      if (habitFilter === 'pending-today' && (!isScheduledToday || isCompletedOnActiveDate)) return false;
      if (habitFilter === 'completed-today' && !isCompletedOnActiveDate) return false;

      return true;
    });
  }, [habits, habitFilter, activeDateStr]);

  const daysOfWeekLabels = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Habit Routines</h2>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="relative z-20 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Lucide.Plus size={15} />
          Create Habit
        </button>
      </div>

      {habits.length > 0 && (
        <div className="tile p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-1.5">
              <Lucide.Grid size={14} className="text-primary" /> Matrix Consistency (Last 15 Weeks)
            </h3>
            <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/30">
              30d Rate: {overallCompletionRate}%
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar md:custom-scrollbar py-2">
            <div className="flex gap-1 items-center justify-start min-w-max">
              {globalHeatmapDays.map((date) => {
                const dateStr = formatDateString(date);
                const completions = habits.filter(h => h.completedDates.includes(dateStr)).length;
                const ratio = habits.length > 0 ? completions / habits.length : 0;
                
                let bgClass = 'bg-surface-elevated/80 border border-border/80 hover:border-primary/50';
                if (ratio > 0.75) bgClass = 'bg-primary border-primary/30 shadow-xs';
                else if (ratio > 0.45) bgClass = 'bg-primary/75 border-primary/25';
                else if (ratio > 0.15) bgClass = 'bg-primary/45 border-primary/15';
                else if (ratio > 0) bgClass = 'bg-primary/25 border-primary/10';

                return (
                  <div
                    key={dateStr}
                    className={`w-3.5 h-3.5 rounded-md border heatmap-cell ${bgClass}`}
                    title={`${completions} completions on ${format(date, 'MMM dd, yyyy')}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-xs text-secondary mt-3 font-bold">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-surface-elevated/80 border border-border/80 rounded-xs" />
            <div className="w-2.5 h-2.5 bg-primary/25 border border-primary/10 rounded-xs" />
            <div className="w-2.5 h-2.5 bg-primary/45 border border-primary/15 rounded-xs" />
            <div className="w-2.5 h-2.5 bg-primary/75 border border-primary/25 rounded-xs" />
            <div className="w-2.5 h-2.5 bg-primary border border-primary/30 rounded-xs" />
            <span>More</span>
          </div>
        </div>
      )}

      {/* Habit Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 relative z-10">
        <span className="text-xs font-black text-secondary uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Lucide.Filter size={13} className="text-primary" /> Filter Routines:
        </span>
        {[
          { id: 'all', label: 'All Routines' },
          { id: 'today', label: 'Scheduled Today' },
          { id: 'yesterday', label: `Yesterday (Grace ${graceDays}d)` },
          { id: 'tomorrow', label: 'Tomorrow' },
          { id: 'pending-today', label: 'Pending Today' },
          { id: 'completed-today', label: 'Completed Today' },
        ].map(hf => (
          <button
            key={hf.id}
            type="button"
            onClick={() => setHabitFilter(hf.id as typeof habitFilter)}
            className={`filter-pill ${habitFilter === hf.id ? 'active' : ''}`}
          >
            {hf.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHabits.length > 0 ? (
          filteredHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(activeDateStr);
            const isUncompleted = Boolean(habit.uncompletedDates?.includes(activeDateStr) || habit.missedReasons?.[activeDateStr]);
            const reasonText = habit.missedReasons?.[activeDateStr];
            const category = categories.find(c => c.id === habit.categoryId);

            return (
              <PremiumHabitCard
                key={habit.id}
                habit={habit}
                category={category}
                isCompleted={isCompleted}
                isUncompleted={isUncompleted}
                reasonText={reasonText}
                isFutureDate={activeDateStatus.isFuture}
                isPastGracePeriod={activeDateStatus.isPastGracePeriod}
                selectedDateStr={activeDateStr}
                todayStr={todayStr}
                miniHeatmapDays={miniHeatmapDays}
                onToggle={async (id, date) => {
                  if (activeDateStatus.isFuture || activeDateStatus.isPastGracePeriod) return;
                  const willComplete = !isCompleted && date === activeDateStr;
                  const prevFocus = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === activeDateStr)?.focusScore ?? 0;

                  if (willComplete) {
                    if (habit.streakCount >= 4) fireStreakConfetti();
                    else fireConfetti();
                  }
                  
                  await toggleHabitCompletion(id, date);

                  if (willComplete) {
                    const freshLog = useShadowTrackerStore.getState().dailyLogs.find(l => l.date === activeDateStr);
                    const newFocus = freshLog?.focusScore ?? prevFocus;
                    const focusDiff = newFocus - prevFocus;
                    const flowGainText = focusDiff > 0 ? `+${focusDiff}% Flow State` : `${newFocus}% Flow State`;

                    window.dispatchEvent(new CustomEvent('showCelebrationNotice', {
                      detail: {
                        title: 'Routine Completed',
                        subtitle: habit.name,
                        flowText: flowGainText,
                        type: 'routine'
                      }
                    }));
                  }
                }}
                onMarkUncompleted={openReasonModal}
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
              maxLength={120}
              placeholder="e.g. Read code architectures"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground placeholder-muted-foreground border border-border/40 focus:border-primary outline-none"
            />
            {formName.length >= 120 && (
              <span className="text-[11px] text-amber-500 font-semibold px-1 block animate-fadeIn">
                Habit name limit reached (120/120)
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Description</label>
            <textarea
              placeholder="Why is this routine critical to build?"
              maxLength={500}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full text-xs px-3.5 py-3 bg-secondary/50 rounded-xl text-foreground placeholder-muted-foreground border border-border/40 focus:border-primary outline-none resize-none"
            />
            {formDesc.length >= 500 && (
              <span className="text-[11px] text-amber-500 font-semibold px-1 block animate-fadeIn">
                Description limit reached (500/500)
              </span>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Link</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full text-xs pl-3.5 pr-9 py-3 bg-secondary/50 rounded-xl text-foreground border border-border/40 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="">Unassigned</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-8 text-muted-foreground pointer-events-none" size={14} />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule Rule</label>
            <select
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as 'daily' | 'weekly' | 'custom')}
              className="w-full text-xs pl-3.5 pr-9 py-3 bg-secondary/50 rounded-xl text-foreground border border-border/40 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="daily">Every Single Day</option>
              <option value="weekly">Once A Week</option>
              <option value="custom">Custom Days Selection</option>
            </select>
            <Lucide.ChevronDown className="absolute right-3.5 top-8 text-muted-foreground pointer-events-none" size={14} />
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

          <div className="border-t border-border/40 pt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formEnableNotification}
                onChange={(e) => setFormEnableNotification(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary bg-secondary/50 border-border/60 cursor-pointer"
              />
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <Lucide.Bell size={15} className="text-primary" />
                Enable Habit Notification Alert
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

      {/* Missed Habit Reflection & Reason Modal */}
      <AnimatePresence>
        {reasonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
            onClick={() => setReasonModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
                    <Lucide.FileEdit size={18} />
                  </span>
                  <h3 className="text-base font-extrabold text-foreground">Habit Reflection & Reason</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReasonModal(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Lucide.X size={16} />
                </button>
              </div>

              <div className="space-y-1.5 bg-secondary/30 border border-border/40 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Habit & Date</span>
                <p className="text-sm font-black text-foreground">{reasonModal.habit.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  Date: {format(parseDateString(reasonModal.dateStr), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">Quick Presets (Optional):</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {[
                    '⏰ High Workload / No Time',
                    '😴 Felt Unwell / Needed Rest',
                    '✈️ Travel / Away from Home',
                    '🧠 Forgot / Slipped Schedule',
                    '🎯 Rest Day / Deliberate Recovery',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPresetReason(preset)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                        presetReason === preset
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-xs'
                          : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reflection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Reflection Notes (Optional):</label>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Why was this habit uncompleted? Write an optional reflection..."
                  value={customReasonText}
                  onChange={e => setCustomReasonText(e.target.value)}
                  className="w-full text-xs p-3 bg-secondary/40 border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:border-rose-500/60 transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <div>
                  {(reasonModal.habit.uncompletedDates?.includes(reasonModal.dateStr) || reasonModal.habit.missedReasons?.[reasonModal.dateStr]) && (
                    <button
                      type="button"
                      onClick={handleClearReasonStatus}
                      className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-rose-400 rounded-xl transition-all"
                      title="Reset uncompleted status back to neutral"
                    >
                      Reset Status
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReasonModal(null)}
                    className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReason}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <Lucide.Check size={14} />
                    <span>Save & Mark Missed</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitsFeature;
