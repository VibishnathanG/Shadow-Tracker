'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  WorkoutRoutinePlan,
  WorkoutDayPlan,
  WorkoutExercise,
  saveCustomWorkoutPlan,
} from './workoutPlansData';
import confetti from 'canvas-confetti';

interface CustomWorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (newPlan: WorkoutRoutinePlan) => void;
  initialPlan?: WorkoutRoutinePlan | null;
}

const MUSCLE_GROUPS = [
  'Chest',
  'Upper Chest',
  'Back',
  'Upper Lats',
  'Mid-Back',
  'Shoulders',
  'Side Delts',
  'Rear Delts',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs / Core',
  'Full Body',
  'Cardio',
];

const PRESET_EXERCISES: Record<string, { muscle: string; emoji: string; sets: string; reps: string }> = {
  'Barbell Flat Bench Press': { muscle: 'Chest', emoji: '🏋️', sets: '4', reps: '6-8' },
  'Incline Dumbbell Press': { muscle: 'Upper Chest', emoji: '💪', sets: '3', reps: '8-10' },
  'Dumbbell Chest Flyes': { muscle: 'Chest', emoji: '🦅', sets: '3', reps: '10-12' },
  'Overhead Dumbbell Press': { muscle: 'Shoulders', emoji: '⚡', sets: '3', reps: '8-10' },
  'Dumbbell Lateral Raises': { muscle: 'Side Delts', emoji: '🦅', sets: '4', reps: '12-15' },
  'Tricep Rope Pushdown': { muscle: 'Triceps', emoji: '⛓️', sets: '3', reps: '10-12' },
  'Dips (Bodyweight / Weighted)': { muscle: 'Chest & Triceps', emoji: '⚡', sets: '3', reps: '8-10' },
  'Conventional Barbell Deadlift': { muscle: 'Back', emoji: '🧱', sets: '3', reps: '5' },
  'Wide-Grip Lat Pulldown': { muscle: 'Upper Lats', emoji: '🧗', sets: '4', reps: '8-10' },
  'Barbell Bent-Over Row': { muscle: 'Mid-Back', emoji: '🚣', sets: '3', reps: '8-10' },
  'Seated Cable Row': { muscle: 'Mid-Back', emoji: '🚣', sets: '3', reps: '10-12' },
  'Barbell Bicep Curls': { muscle: 'Biceps', emoji: '💪', sets: '3', reps: '10-12' },
  'Hammer Curls': { muscle: 'Biceps / Forearms', emoji: '🔨', sets: '3', reps: '10-12' },
  'Barbell Back Squat': { muscle: 'Quads', emoji: '🦵', sets: '4', reps: '6-8' },
  'Leg Press': { muscle: 'Quads', emoji: '🚜', sets: '3', reps: '10-12' },
  'Romanian Deadlift (RDL)': { muscle: 'Hamstrings', emoji: '🪶', sets: '3', reps: '8-10' },
  'Lying Leg Curls': { muscle: 'Hamstrings', emoji: '🎯', sets: '3', reps: '12-15' },
  'Standing Calf Raises': { muscle: 'Calves', emoji: '🦶', sets: '4', reps: '15' },
  'Hanging Leg Raises': { muscle: 'Abs / Core', emoji: '🛡️', sets: '3', reps: '12-15' },
  'Treadmill Interval Run': { muscle: 'Cardio', emoji: '🏃', sets: '1', reps: '20 mins' },
};

export default function CustomWorkoutPlanModal({
  isOpen,
  onClose,
  onPlanCreated,
  initialPlan,
}: CustomWorkoutPlanModalProps) {
  const [name, setName] = useState(initialPlan?.name || '');
  const [tagline, setTagline] = useState(initialPlan?.tagline || 'Custom targeted hypertrophy & strength split');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(initialPlan?.level || 'Intermediate');
  const [icon, setIcon] = useState(initialPlan?.icon || '⭐');

  // Days in plan
  const [days, setDays] = useState<WorkoutDayPlan[]>(
    initialPlan?.days || [
      {
        dayName: 'Day 1 • Push Focus',
        focus: 'Chest, Shoulders & Triceps',
        estimatedMinutes: 50,
        exercises: [
          { name: 'Barbell Flat Bench Press', muscle: 'Chest', sets: '4', reps: '6-8', emoji: '🏋️', notes: 'Heavy progressive overload' },
          { name: 'Incline Dumbbell Press', muscle: 'Upper Chest', sets: '3', reps: '8-10', emoji: '💪', notes: '30-degree incline' },
          { name: 'Dumbbell Lateral Raises', muscle: 'Side Delts', sets: '4', reps: '12-15', emoji: '🦅', notes: 'Control the negative' },
          { name: 'Tricep Rope Pushdown', muscle: 'Triceps', sets: '3', reps: '10-12', emoji: '⛓️', notes: 'Full extension' },
        ],
      },
      {
        dayName: 'Day 2 • Pull Focus',
        focus: 'Back & Biceps Width',
        estimatedMinutes: 50,
        exercises: [
          { name: 'Wide-Grip Lat Pulldown', muscle: 'Upper Lats', sets: '4', reps: '8-10', emoji: '🧗', notes: 'Drive elbows down' },
          { name: 'Seated Cable Row', muscle: 'Mid-Back', sets: '3', reps: '10-12', emoji: '🚣', notes: 'Full retraction' },
          { name: 'Barbell Bicep Curls', muscle: 'Biceps', sets: '3', reps: '10-12', emoji: '💪', notes: 'Strict form' },
        ],
      },
    ]
  );

  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // New exercise inline form
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExSets, setNewExSets] = useState('3');
  const [newExReps, setNewExReps] = useState('10');
  const [newExNotes, setNewExNotes] = useState('');
  const [newExEmoji, setNewExEmoji] = useState('🏋️');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body & html scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const scrollY = window.scrollY;
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyPos = document.body.style.position;
      const prevBodyTop = document.body.style.top;
      const prevBodyWidth = document.body.style.width;

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.position = prevBodyPos;
        document.body.style.top = prevBodyTop;
        document.body.style.width = prevBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  // Add Day
  const handleAddDay = () => {
    const nextIdx = days.length + 1;
    const newDay: WorkoutDayPlan = {
      dayName: `Day ${nextIdx} • Custom Split`,
      focus: 'Targeted Muscle Focus',
      estimatedMinutes: 45,
      exercises: [
        { name: 'Barbell Back Squat', muscle: 'Quads', sets: '3', reps: '8', emoji: '🦵', notes: 'Hit parallel depth' },
      ],
    };
    setDays([...days, newDay]);
    setActiveDayIdx(days.length);
  };

  // Remove Day
  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== index);
    setDays(updated);
    setActiveDayIdx(Math.max(0, index - 1));
  };

  // Update current day info
  const handleUpdateCurrentDay = (field: keyof WorkoutDayPlan, value: any) => {
    setDays(prev =>
      prev.map((d, i) => (i === activeDayIdx ? { ...d, [field]: value } : d))
    );
  };

  // Remove exercise from active day
  const handleRemoveExercise = (exIdx: number) => {
    setDays(prev =>
      prev.map((d, i) => {
        if (i !== activeDayIdx) return d;
        return {
          ...d,
          exercises: d.exercises.filter((_, idx) => idx !== exIdx),
        };
      })
    );
  };

  // Add Exercise to active day
  const handleAddExerciseToCurrentDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newEx: WorkoutExercise = {
      name: newExName.trim(),
      muscle: newExMuscle,
      sets: newExSets || '3',
      reps: newExReps || '10',
      notes: newExNotes.trim() || undefined,
      emoji: newExEmoji || '🏋️',
    };

    setDays(prev =>
      prev.map((d, i) => {
        if (i !== activeDayIdx) return d;
        return {
          ...d,
          exercises: [...d.exercises, newEx],
        };
      })
    );

    // Reset inline inputs
    setNewExName('');
    setNewExNotes('');
  };

  // Quick preset exercise select
  const handleSelectPreset = (presetName: string) => {
    const p = PRESET_EXERCISES[presetName];
    if (p) {
      setNewExName(presetName);
      setNewExMuscle(p.muscle);
      setNewExSets(p.sets);
      setNewExReps(p.reps);
      setNewExEmoji(p.emoji);
    }
  };

  // Save full routine
  const handleSaveRoutine = () => {
    if (!name.trim()) return;

    const newPlan: WorkoutRoutinePlan = {
      id: initialPlan?.id || `custom_${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || 'Custom user training routine',
      level,
      daysPerWeek: days.length,
      badge: 'Custom Split',
      icon: icon || '⭐',
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-500/40',
      isCustom: true,
      days,
    };

    saveCustomWorkoutPlan(newPlan);
    onPlanCreated(newPlan);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const currentDay = days[activeDayIdx] || days[0];

  const modalContent = (
    <div 
      className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 pointer-events-auto overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
        style={{ touchAction: 'none' }}
        className="fixed inset-0 bg-black/85"
      />

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        style={{ overscrollBehavior: 'contain' }}
        className="relative w-full max-w-3xl bg-surface-elevated border border-border/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden my-auto z-10 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0 text-xl">
              {icon}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {initialPlan ? 'Edit Custom Workout Routine' : 'Create Custom Workout Routine'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Design custom splits, assign exercises &amp; save routine.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
          >
            <Lucide.X size={18} />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <div 
          className="flex-1 overflow-y-auto space-y-5 pr-1.5 min-h-0 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {/* Plan Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Routine / Plan Name</label>
              <input
                type="text"
                maxLength={80}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Heavy Hypertrophy PPL, Arnold 6-Day, Power Chest & Arms..."
                className="w-full bg-secondary border border-border/70 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-amber-400"
              />
              {name.length >= 80 && (
                <span className="text-[10px] text-amber-500 font-semibold block animate-fadeIn">
                  Plan name limit reached (80/80)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Icon &amp; Level</label>
              <div className="flex items-center gap-2">
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-14 bg-secondary border border-border/70 rounded-xl px-2 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                  {['⭐', '🏋️‍♂️', '💪', '⚡', '🏆', '🔥', '🧗', '🧘', '⚔️', '🛡️', '🦾'].map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>

                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as any)}
                  className="flex-1 bg-secondary border border-border/70 rounded-xl px-2.5 py-2 text-xs font-bold text-foreground outline-none cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Days Tabs Header */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Days in Split ({days.length} Days)
              </span>
              <button
                type="button"
                onClick={handleAddDay}
                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Lucide.Plus size={11} /> Add Another Day
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {days.map((d, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    activeDayIdx === idx
                      ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary'
                  }`}
                  onClick={() => setActiveDayIdx(idx)}
                >
                  <span>{d.dayName.split('•')[0] || `Day ${idx + 1}`}</span>
                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveDay(idx);
                      }}
                      className="ml-1 opacity-70 hover:opacity-100 hover:text-rose-300"
                    >
                      <Lucide.X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Day Details Editor */}
          {currentDay && (
            <div className="p-4 bg-secondary/30 rounded-2xl border border-border/60 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-muted-foreground uppercase">Day Label</label>
                  <input
                    type="text"
                    value={currentDay.dayName}
                    onChange={e => handleUpdateCurrentDay('dayName', e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-amber-400"
                    placeholder="e.g. Day 1 • Push (Chest/Delts)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-muted-foreground uppercase">Focus Muscle Group</label>
                  <input
                    type="text"
                    value={currentDay.focus}
                    onChange={e => handleUpdateCurrentDay('focus', e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-amber-400"
                    placeholder="e.g. Heavy Bench & Lateral Delts"
                  />
                </div>
              </div>

              {/* Current Exercises List in this Day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>Prescribed Exercises ({currentDay.exercises.length})</span>
                </div>

                <div className="space-y-1.5">
                  {currentDay.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-2.5 bg-surface rounded-xl border border-border/60 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base p-1 bg-secondary rounded-lg shrink-0">{ex.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-foreground truncate block">{ex.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            <span className="text-amber-400 font-bold">{ex.muscle}</span> • {ex.sets} sets × {ex.reps}
                            {ex.notes && ` • ${ex.notes}`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="text-muted-foreground hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Remove exercise"
                      >
                        <Lucide.Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline Add Exercise to this Day */}
              <form
                onSubmit={handleAddExerciseToCurrentDay}
                className="p-3 bg-secondary/50 rounded-xl border border-border/70 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black text-foreground uppercase flex items-center gap-1">
                    <Lucide.Plus size={11} className="text-amber-400" />
                    <span>Append Exercise to {currentDay.dayName.split('•')[0]}</span>
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full sm:max-w-[240px] no-scrollbar">
                    {Object.keys(PRESET_EXERCISES).slice(0, 4).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="text-[9px] px-1.5 py-0.5 bg-surface text-muted-foreground hover:text-foreground rounded border border-border/50 whitespace-nowrap cursor-pointer"
                      >
                        {p.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Incline Bench)"
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                      className="w-full bg-surface border border-border/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <select
                      value={newExMuscle}
                      onChange={e => setNewExMuscle(e.target.value)}
                      className="w-full bg-surface border border-border/60 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer"
                    >
                      {MUSCLE_GROUPS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Sets"
                      value={newExSets}
                      onChange={e => setNewExSets(e.target.value)}
                      className="w-1/2 bg-surface border border-border/60 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center text-foreground outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Reps"
                      value={newExReps}
                      onChange={e => setNewExReps(e.target.value)}
                      className="w-1/2 bg-surface border border-border/60 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center text-foreground outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Form notes (e.g. 30-degree bench, 2s pause at bottom)"
                    value={newExNotes}
                    onChange={e => setNewExNotes(e.target.value)}
                    className="flex-1 bg-surface border border-border/60 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveRoutine}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Lucide.CheckCircle size={14} />
            <span>Save Routine to Library</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
