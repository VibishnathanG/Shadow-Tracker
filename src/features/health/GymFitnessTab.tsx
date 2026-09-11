'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  WORKOUT_PLANS,
  WorkoutRoutinePlan,
  WorkoutExercise,
  getCustomWorkoutPlans,
  saveCustomWorkoutPlan,
  deleteCustomWorkoutPlan,
} from './workoutPlansData';
import {
  calculatePersonalizedFeasibility,
  FeasibilityResult,
  getUserBiometrics,
  saveUserBiometrics,
  UserBiometrics,
} from './weightFeasibility';
import CustomWorkoutPlanModal from './CustomWorkoutPlanModal';
import confetti from 'canvas-confetti';

export interface ExerciseLogItem {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weightKg: number;
  oneRepMax: number;
  time: string;
}

interface GymFitnessTabProps {
  currentWeightKg?: number;
  weightUnit: 'kg' | 'lbs';
  onUpdateWeight: (weight: number | undefined) => void;
  onLogWorkoutMinutes: (type: any, duration: number, calories: number, notes: string) => void;
  addXp: (amount: number) => void;
}

const COMMON_EXERCISE_SUGGESTIONS = [
  { name: 'Barbell Flat Bench Press', muscle: 'Chest', emoji: '🏋️' },
  { name: 'Barbell Back Squat', muscle: 'Quads', emoji: '🦵' },
  { name: 'Conventional Deadlift', muscle: 'Back', emoji: '🧱' },
  { name: 'Overhead Barbell Press', muscle: 'Shoulders', emoji: '⚡' },
  { name: 'Wide Lat Pulldown', muscle: 'Lats', emoji: '🧗' },
  { name: 'Incline Dumbbell Press', muscle: 'Upper Chest', emoji: '💪' },
  { name: 'Dumbbell Lateral Raises', muscle: 'Side Delts', emoji: '🦅' },
  { name: 'Dumbbell Bicep Curls', muscle: 'Biceps', emoji: '💪' },
  { name: 'Tricep Rope Pushdown', muscle: 'Triceps', emoji: '⛓️' },
  { name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings', emoji: '🪶' },
  { name: 'Leg Press', muscle: 'Quads', emoji: '🚜' },
  { name: 'Treadmill Interval Run', muscle: 'Cardio', emoji: '🏃' },
];

export default function GymFitnessTab({
  currentWeightKg = 75,
  weightUnit,
  onUpdateWeight,
  onLogWorkoutMinutes,
  addXp,
}: GymFitnessTabProps) {
  // Persistent Biometric Profile & Feasibility Inputs
  const initialBiometrics = useMemo(() => getUserBiometrics(), []);
  const [calcCurrentWeight, setCalcCurrentWeight] = useState<string>(
    String(currentWeightKg || initialBiometrics.currentWeightKg || 75)
  );
  const [calcTargetWeight, setCalcTargetWeight] = useState<string>(
    String(initialBiometrics.targetWeightKg || 70)
  );
  const [userAge, setUserAge] = useState<string>(String(initialBiometrics.age || 28));
  const [userSex, setUserSex] = useState<'male' | 'female'>(initialBiometrics.sex || 'male');
  const [heightCm, setHeightCm] = useState<string>(String(initialBiometrics.heightCm || 175));
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active'>(
    initialBiometrics.activityLevel || 'moderate'
  );
  const [weeklyLossRate, setWeeklyLossRate] = useState<number>(
    initialBiometrics.preferredWeeklyLossKg || 0.5
  );
  const [calcDays, setCalcDays] = useState<string>(String(initialBiometrics.days || 70));
  const [lastAdjusted, setLastAdjusted] = useState<'rate' | 'days'>('rate');

  // Auto-save biometrics whenever any parameter changes
  useEffect(() => {
    saveUserBiometrics({
      currentWeightKg: parseFloat(calcCurrentWeight) || 75,
      targetWeightKg: parseFloat(calcTargetWeight) || 70,
      age: parseInt(userAge, 10) || 28,
      sex: userSex,
      heightCm: parseFloat(heightCm) || 175,
      activityLevel,
      preferredWeeklyLossKg: weeklyLossRate,
      days: parseInt(calcDays, 10) || 70,
    });
  }, [calcCurrentWeight, calcTargetWeight, userAge, userSex, heightCm, activityLevel, weeklyLossRate, calcDays]);

  // Sync with prop currentWeightKg when it changes
  useEffect(() => {
    if (currentWeightKg && currentWeightKg > 0) {
      setCalcCurrentWeight(String(currentWeightKg));
    }
  }, [currentWeightKg]);

  // Custom Workout Plans State
  const [customPlans, setCustomPlans] = useState<WorkoutRoutinePlan[]>([]);
  const [isCustomPlanModalOpen, setIsCustomPlanModalOpen] = useState(false);
  const [editingCustomPlan, setEditingCustomPlan] = useState<WorkoutRoutinePlan | null>(null);

  // Selected Workout Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>('ppl_split');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Completed exercise tracking for active day
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Inline Quick Add Exercise to Active Day
  const [isAddingExerciseToDay, setIsAddingExerciseToDay] = useState(false);
  const [quickExName, setQuickExName] = useState('');
  const [quickExMuscle, setQuickExMuscle] = useState('Chest');
  const [quickExSets, setQuickExSets] = useState('3');
  const [quickExReps, setQuickExReps] = useState('10');
  const [quickExNotes, setQuickExNotes] = useState('');

  // Exercise Logger State
  const [exerciseName, setExerciseName] = useState<string>('');
  const [exerciseSets, setExerciseSets] = useState<string>('3');
  const [exerciseReps, setExerciseReps] = useState<string>('10');
  const [exerciseWeight, setExerciseWeight] = useState<string>('50');
  const [loggedExercises, setLoggedExercises] = useState<ExerciseLogItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shadow_logged_exercises_today');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Collapsible Biometric Feasibility Calculator state (default collapsed for spacious decluttered layout)
  const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(false);

  // Load custom plans on mount & reload when health data syncs
  useEffect(() => {
    const reload = () => {
      setCustomPlans(getCustomWorkoutPlans());
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('shadow_logged_exercises_today');
          if (saved) setLoggedExercises(JSON.parse(saved));
        } catch (e) {}
      }
    };
    reload();
    window.addEventListener('shadow_health_updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('shadow_health_updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  // Combined plans list
  const allPlans = useMemo(() => {
    return [...WORKOUT_PLANS, ...customPlans];
  }, [customPlans]);

  // Active Plan Object
  const activePlan = useMemo(() => {
    return allPlans.find(p => p.id === selectedPlanId) || allPlans[0] || WORKOUT_PLANS[0];
  }, [allPlans, selectedPlanId]);

  const activeDay = useMemo(() => {
    return activePlan.days[selectedDayIndex] || activePlan.days[0];
  }, [activePlan, selectedDayIndex]);

  // Save logged exercises
  const saveExercises = (newList: ExerciseLogItem[]) => {
    setLoggedExercises(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shadow_logged_exercises_today', JSON.stringify(newList));
      } catch (e) {}
    }
  };


  // Plan creation & deletion callbacks
  const handlePlanSaved = (savedPlan: WorkoutRoutinePlan) => {
    const updated = getCustomWorkoutPlans();
    setCustomPlans(updated);
    setSelectedPlanId(savedPlan.id);
    setSelectedDayIndex(0);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Delete this custom workout routine from your library?')) {
      const updated = deleteCustomWorkoutPlan(planId);
      setCustomPlans(updated);
      setSelectedPlanId('ppl_split');
      setSelectedDayIndex(0);
    }
  };

  const handleToggleExerciseComplete = (exKey: string) => {
    setCompletedExercises(prev => {
      const next = !prev[exKey];
      if (next) {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.65 } });
        addXp(5);
      }
      return { ...prev, [exKey]: next };
    });
  };

  const handleQuickLogToPR = (ex: WorkoutExercise) => {
    setExerciseName(ex.name);
    const s = parseInt(ex.sets, 10);
    if (!isNaN(s)) setExerciseSets(String(s));
    const r = parseInt(ex.reps, 10);
    if (!isNaN(r)) setExerciseReps(String(r));
    const el = document.getElementById('exercise-pr-logger');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddExerciseToActiveDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickExName.trim()) return;

    const newEx: WorkoutExercise = {
      name: quickExName.trim(),
      muscle: quickExMuscle,
      sets: quickExSets || '3',
      reps: quickExReps || '10',
      notes: quickExNotes.trim() || undefined,
      emoji: '🏋️',
    };

    let targetPlanToSave: WorkoutRoutinePlan;

    if (activePlan.isCustom) {
      targetPlanToSave = {
        ...activePlan,
        days: activePlan.days.map((d, i) =>
          i === selectedDayIndex
            ? { ...d, exercises: [...d.exercises, newEx] }
            : d
        ),
      };
    } else {
      targetPlanToSave = {
        ...activePlan,
        id: `custom_${activePlan.id}_${Date.now()}`,
        name: `${activePlan.name} (Custom)`,
        isCustom: true,
        days: activePlan.days.map((d, i) =>
          i === selectedDayIndex
            ? { ...d, exercises: [...d.exercises, newEx] }
            : d
        ),
      };
    }

    saveCustomWorkoutPlan(targetPlanToSave);
    const updated = getCustomWorkoutPlans();
    setCustomPlans(updated);
    setSelectedPlanId(targetPlanToSave.id);

    setQuickExName('');
    setQuickExNotes('');
    setIsAddingExerciseToDay(false);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const getMuscleBadgeClass = (muscle: string) => {
    const m = muscle.toLowerCase();
    if (m.includes('chest')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (m.includes('back') || m.includes('lat')) return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (m.includes('shoulder') || m.includes('delt')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (m.includes('bicep') || m.includes('tricep') || m.includes('arm')) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    if (m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('leg') || m.includes('calf')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (m.includes('abs') || m.includes('core')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (m.includes('cardio')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    return 'bg-secondary text-muted-foreground border-border/70';
  };

  // Scientific Feasibility Calculation Result
  const feasibility = useMemo<FeasibilityResult>(() => {
    const cur = parseFloat(calcCurrentWeight) || currentWeightKg || 75;
    const tgt = parseFloat(calcTargetWeight) || 70;
    const age = parseInt(userAge, 10) || 28;
    const hCm = parseFloat(heightCm) || 175;
    const days = parseInt(calcDays, 10) || 30;

    if (lastAdjusted === 'rate') {
      return calculatePersonalizedFeasibility({
        currentWeightKg: cur,
        targetWeightKg: tgt,
        weeklyLossKg: weeklyLossRate,
        age,
        sex: userSex,
        heightCm: hCm,
        activityLevel,
      });
    } else {
      return calculatePersonalizedFeasibility({
        currentWeightKg: cur,
        targetWeightKg: tgt,
        days,
        age,
        sex: userSex,
        heightCm: hCm,
        activityLevel,
      });
    }
  }, [
    calcCurrentWeight,
    currentWeightKg,
    calcTargetWeight,
    userAge,
    userSex,
    heightCm,
    activityLevel,
    weeklyLossRate,
    calcDays,
    lastAdjusted,
  ]);

  // Interactive Weekly Rate & Timeline Handlers
  const handleRateChange = (newRate: number) => {
    const validRate = Math.max(0.05, Math.round(newRate * 100) / 100);
    setWeeklyLossRate(validRate);
    setLastAdjusted('rate');
    const cur = parseFloat(calcCurrentWeight) || currentWeightKg || 75;
    const tgt = parseFloat(calcTargetWeight) || 70;
    const absDelta = Math.abs(tgt - cur);
    if (absDelta > 0) {
      const computedDays = Math.max(7, Math.round((absDelta / validRate) * 7));
      setCalcDays(String(computedDays));
    }
  };

  const handleDaysChange = (newDaysStr: string) => {
    setCalcDays(newDaysStr);
    setLastAdjusted('days');
    const cur = parseFloat(calcCurrentWeight) || currentWeightKg || 75;
    const tgt = parseFloat(calcTargetWeight) || 70;
    const absDelta = Math.abs(tgt - cur);
    const d = parseInt(newDaysStr, 10);
    if (absDelta > 0 && d > 0) {
      const computedRate = Math.round(((absDelta / d) * 7) * 100) / 100;
      setWeeklyLossRate(computedRate);
    }
  };

  // Add Exercise Log
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const s = parseInt(exerciseSets, 10) || 3;
    const r = parseInt(exerciseReps, 10) || 10;
    const w = parseFloat(exerciseWeight) || 0;
    // 1RM Brzycki formula: W * (1 + R/30)
    const onerm = Math.round(w * (1 + r / 30) * 10) / 10;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEx: ExerciseLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: exerciseName.trim(),
      muscle: 'Gym',
      sets: s,
      reps: r,
      weightKg: w,
      oneRepMax: onerm,
      time: timeStr,
    };

    saveExercises([newEx, ...loggedExercises]);
    addXp(15);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setExerciseName('');
  };

  const handleDeleteExercise = (id: string) => {
    saveExercises(loggedExercises.filter(e => e.id !== id));
  };

  // Quick auto-fix days to optimal rate
  const setOptimalDays = () => {
    handleRateChange(feasibility.recommendedKgPerWeek || 0.5);
  };

  return (
    <div className="space-y-8">
      {/* MODULE 1: Target Weight & Personalized Biometric Feasibility Engine */}
      <div className="tile settings-tile p-4 sm:p-6 md:p-8 rounded-3xl space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 bg-primary/15 text-primary rounded-2xl border border-primary/30 shrink-0">
              <Lucide.Target size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  Weight Goal &amp; Safety
                </h2>
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 tracking-wider">
                  Mifflin-St Jeor
                </span>
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                  Safety Matrix
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium max-w-2xl mt-0.5 leading-relaxed">
                Calculate BMR, TDEE, and safe caloric deficit based on your biometrics.
              </p>
            </div>
          </div>

          {/* Real-time Metabolic Quick Chips & Collapsible Toggle */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-secondary border border-border/70 text-[11px] sm:text-xs font-black font-mono flex items-center gap-1.5 ${feasibility.bmiColor}`}>
              <span>🩺 BMI {feasibility.bmi}</span>
              <span className="opacity-70 font-semibold hidden xs:inline">• {feasibility.bmiCategory}</span>
            </div>
            <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-secondary border border-border/70 text-[11px] sm:text-xs font-black font-mono text-amber-400" title="Basal Metabolic Rate: calories burned at complete rest">
              🔥 BMR: {feasibility.bmr} kcal
            </div>
            <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-secondary border border-border/70 text-[11px] sm:text-xs font-black font-mono text-emerald-400" title="Total Daily Energy Expenditure: daily maintenance calories">
              ⚡ TDEE: {feasibility.tdee} kcal
            </div>

            <button
              type="button"
              onClick={() => setIsFeasibilityOpen(prev => !prev)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isFeasibilityOpen
                  ? 'bg-primary/20 text-primary border-primary/40 shadow-xs'
                  : 'bg-surface hover:bg-secondary text-secondary hover:text-foreground border-border'
              }`}
              title="Toggle Biometrics & Feasibility Calculator"
            >
              <Lucide.Sliders size={13} className="text-primary" />
              <span>{isFeasibilityOpen ? 'Hide' : 'Calculator'}</span>
              <Lucide.ChevronDown size={13} className={`transition-transform duration-200 ${isFeasibilityOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sleek Uncluttered Summary Banner when collapsed */}
        {!isFeasibilityOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-secondary rounded-xl">{feasibility.emoji}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[7.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${feasibility.bgClass} border ${feasibility.borderClass} ${feasibility.colorClass} leading-tight`}>
                    {feasibility.badge}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-foreground">
                    Target: {calcTargetWeight} {weightUnit} (from {calcCurrentWeight} {weightUnit})
                  </span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                    {feasibility.pctBodyWeightPerWeek}% wt/wk
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {feasibility.title} • {feasibility.kgPerWeek} kg/wk • Target Intake: <strong className="text-amber-400 font-mono">{feasibility.targetDailyCalories} kcal/d</strong> • Safety Score: {feasibility.safetyScore}/100
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFeasibilityOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-surface text-foreground border border-border transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0"
            >
              <Lucide.Pencil size={12} />
              <span>Adjust Goal &amp; Rates</span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {isFeasibilityOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-6 overflow-hidden pt-1"
            >
              {/* Inputs Grid: Personal Biometric Parameters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  <span>1. Biometric Profile &amp; Baseline Metrics</span>
                  <span className="text-[10px] text-emerald-400 font-bold lowercase">auto-saved to profile</span>
                </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Current Weight */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                <span>Current Wt ({weightUnit.toUpperCase()})</span>
                <span
                  className="text-[9px] text-primary cursor-pointer hover:underline font-bold"
                  onClick={() => onUpdateWeight(parseFloat(calcCurrentWeight))}
                  title="Sync with today's logged weight"
                >
                  Sync
                </span>
              </label>
              <input
                type="number"
                step="0.1"
                value={calcCurrentWeight}
                onChange={e => {
                  setCalcCurrentWeight(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onUpdateWeight(val);
                }}
                className="w-full text-sm font-black font-mono px-2.5 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
                placeholder="e.g. 80"
              />
            </div>

            {/* Target Weight */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Target Wt ({weightUnit.toUpperCase()})
              </label>
              <input
                type="number"
                step="0.1"
                value={calcTargetWeight}
                onChange={e => setCalcTargetWeight(e.target.value)}
                className="w-full text-sm font-black font-mono px-2.5 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
                placeholder="e.g. 72"
              />
            </div>

            {/* Height */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Height (cm)
              </label>
              <input
                type="number"
                step="1"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className="w-full text-sm font-black font-mono px-2.5 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
                placeholder="e.g. 175"
              />
            </div>

            {/* Age */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Age (Years)
              </label>
              <input
                type="number"
                step="1"
                min="14"
                max="100"
                value={userAge}
                onChange={e => setUserAge(e.target.value)}
                className="w-full text-sm font-black font-mono px-2.5 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
                placeholder="e.g. 28"
              />
            </div>

            {/* Biological Sex */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Biological Sex
              </label>
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setUserSex('male')}
                  className={`flex-1 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    userSex === 'male'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                      : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setUserSex('female')}
                  className={`flex-1 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    userSex === 'female'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-xs'
                      : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Daily Activity Level */}
            <div className="bg-secondary/40 p-3 rounded-2xl border border-border/60 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value as any)}
                className="w-full text-xs font-bold px-2 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary cursor-pointer"
              >
                <option value="sedentary">Sedentary (1.2x)</option>
                <option value="light">Light (1.375x)</option>
                <option value="moderate">Moderate (1.55x)</option>
                <option value="very_active">Very Active (1.725x)</option>
              </select>
            </div>
          </div>
        </div>

        {/* INTERACTIVE WEEKLY LOSS RATE SELECTOR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-emerald-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🎚️</span>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                  2. Weekly Loss Target
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Choose your comfortable pace or adjust the slider to test feasibility.
              </p>
            </div>

            {/* Dynamic Goal Difference */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Difference</span>
              <span className="text-xs font-black font-mono text-foreground">
                {Math.abs((parseFloat(calcTargetWeight) || 0) - (parseFloat(calcCurrentWeight) || 0)).toFixed(1)} {weightUnit}
                {' '}({parseFloat(calcTargetWeight) < parseFloat(calcCurrentWeight) ? 'Cut' : 'Gain'})
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons (Personalized to user's bodyweight) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Personalized Scientific Paces:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRateChange(feasibility.gentleKgPerWeek)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.gentleKgPerWeek) < 0.05
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>🟢 Gentle Recomp</span>
                  <span className="font-mono text-[10px]">{feasibility.gentleKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Low friction lifestyle shift</div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.recommendedKgPerWeek)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.recommendedKgPerWeek) < 0.05
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>🌟 Optimal Gold</span>
                  <span className="font-mono text-[10px] font-black text-emerald-400">{feasibility.recommendedKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-emerald-400/90 mt-0.5">Recommended Sweet Spot</div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.athleticKgPerWeek)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.athleticKgPerWeek) < 0.05
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>⚡ Athletic Cut</span>
                  <span className="font-mono text-[10px]">{feasibility.athleticKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Strict disciplined shred</div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.maxSafeKgPerWeek)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.maxSafeKgPerWeek) < 0.05
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>🚀 Max Safe Pace</span>
                  <span className="font-mono text-[10px]">{feasibility.maxSafeKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Upper physiological limit</div>
              </button>
            </div>
          </div>

          {/* Interactive Slider & Days Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-center">
            {/* Slider */}
            <div className="md:col-span-2 space-y-2 bg-secondary/30 p-3.5 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Custom Weekly Pace Slider:
                </span>
                <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {weeklyLossRate.toFixed(2)} kg / week
                </span>
              </div>

              <input
                type="range"
                min="0.10"
                max={Math.max(1.5, Math.round(feasibility.maxSafeKgPerWeek * 1.3 * 10) / 10)}
                step="0.05"
                value={weeklyLossRate}
                onChange={e => handleRateChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-secondary rounded-lg"
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>0.10 kg/wk (Gentle)</span>
                <span className="text-emerald-400 font-bold">~{feasibility.pctBodyWeightPerWeek}% body wt/wk</span>
                <span>{Math.max(1.5, Math.round(feasibility.maxSafeKgPerWeek * 1.3 * 10) / 10)} kg/wk (Aggressive)</span>
              </div>
            </div>

            {/* Sync Days Input */}
            <div className="space-y-1.5 bg-secondary/30 p-3.5 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                <span>Days to Achieve</span>
                <button
                  type="button"
                  onClick={setOptimalDays}
                  className="text-emerald-400 font-extrabold hover:underline cursor-pointer"
                >
                  Auto-Optimal
                </button>
              </div>
              <input
                type="number"
                min="7"
                max="730"
                value={calcDays}
                onChange={e => handleDaysChange(e.target.value)}
                className="w-full text-base font-black font-mono px-3 py-1.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-primary"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>~{(feasibility.days / 7).toFixed(1)} weeks</span>
                <span className="text-emerald-400 font-bold">🎯 {feasibility.projectedDateStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Feasibility Output Card */}
        <motion.div
          key={`${feasibility.level}-${feasibility.days}-${feasibility.kgPerWeek}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-3xl border ${feasibility.borderClass} ${feasibility.bgClass} shadow-lg space-y-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-surface/80 shadow-xs">
                {feasibility.emoji}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[7.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${feasibility.bgClass} border ${feasibility.borderClass} ${feasibility.colorClass} leading-tight`}>
                    {feasibility.badge}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Safety Score: <strong className="text-foreground">{feasibility.safetyScore}/100</strong>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                    {feasibility.pctBodyWeightPerWeek}% body wt/wk
                  </span>
                </div>
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${feasibility.colorClass} mt-0.5`}>
                  {feasibility.title}
                </h3>
              </div>
            </div>

            {/* Shift Rate Metrics */}
            <div className="flex items-center gap-3 sm:gap-4 bg-surface/80 p-3 rounded-2xl border border-border/70 text-right shrink-0">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Weekly Pace</span>
                <span className="text-sm font-black font-mono text-foreground">{feasibility.kgPerWeek} kg / wk</span>
              </div>
              <div className="h-6 w-px bg-border/80" />
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  {feasibility.direction === 'loss' ? 'Daily Deficit' : 'Daily Surplus'}
                </span>
                <span className="text-sm font-black font-mono text-foreground">
                  {feasibility.direction === 'loss' ? '-' : '+'}{feasibility.dailyDeficitSurplusKcal} kcal/d
                </span>
              </div>
              <div className="h-6 w-px bg-border/80" />
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Target Intake</span>
                <span className="text-sm font-black font-mono text-amber-400">
                  {feasibility.targetDailyCalories} kcal/d
                </span>
              </div>
            </div>
          </div>

          {/* Calorie Floor Safety Status Banner */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-surface/60 border border-border/50">
            <div className="flex items-center gap-2">
              <Lucide.ShieldCheck size={14} className={feasibility.targetDailyCalories >= feasibility.minSafeCalories ? 'text-emerald-400' : 'text-rose-500'} />
              <span className="text-foreground font-semibold">
                Clinical Safety Floor: <strong className="font-mono text-foreground">{feasibility.minSafeCalories} kcal/day</strong> (based on {feasibility.bmr} kcal BMR)
              </span>
            </div>
            <span className={`text-[11px] font-bold font-mono ${feasibility.targetDailyCalories >= feasibility.minSafeCalories ? 'text-emerald-400' : 'text-rose-500'}`}>
              {feasibility.targetDailyCalories >= feasibility.minSafeCalories
                ? `✓ +${feasibility.targetDailyCalories - feasibility.minSafeCalories} kcal above floor`
                : `⚠️ ${feasibility.minSafeCalories - feasibility.targetDailyCalories} kcal below floor!`}
            </span>
          </div>

          {/* 5-Level Progress Tier Visualizer */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className={feasibility.level === 1 ? 'text-rose-500 font-black' : ''}>1. Danger</span>
              <span className={feasibility.level === 2 ? 'text-amber-500 font-black' : ''}>2. Warning</span>
              <span className={feasibility.level === 3 ? 'text-yellow-400 font-black' : ''}>3. Challenging</span>
              <span className={feasibility.level === 4 ? 'text-emerald-400 font-black' : ''}>4. Optimal</span>
              <span className={feasibility.level === 5 ? 'text-sky-400 font-black' : ''}>5. Easy</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 h-2.5">
              {[1, 2, 3, 4, 5].map(lvl => {
                const isActive = feasibility.level === lvl;
                const colors = [
                  'bg-rose-500',
                  'bg-amber-500',
                  'bg-yellow-400',
                  'bg-emerald-400',
                  'bg-sky-400',
                ];
                return (
                  <div
                    key={lvl}
                    className={`rounded-full transition-all ${
                      isActive
                        ? `${colors[lvl - 1]} ring-2 ring-foreground/40 shadow-sm`
                        : 'bg-secondary/80 opacity-40'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <p className="text-xs font-semibold text-foreground leading-relaxed">
            {feasibility.detailedAdvice}
          </p>

          {/* Key Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-border/50">
            {feasibility.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="text-xs leading-none mt-0.5">•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* MODULE 2: Workout Routine Plans Explorer */}
      <div className="tile settings-tile p-4 sm:p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/15 text-amber-500 rounded-2xl border border-amber-500/30 shrink-0">
              <Lucide.Dumbbell size={22} />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Workout Routines
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Custom and preset training splits &amp; conditioning routines.
              </p>
            </div>
          </div>

          {/* Plan Selector & Custom Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <select
                value={selectedPlanId}
                onChange={e => {
                  setSelectedPlanId(e.target.value);
                  setSelectedDayIndex(0);
                }}
                className="text-xs font-black px-3.5 py-2 bg-secondary text-foreground rounded-xl border border-border/80 outline-none cursor-pointer focus:border-amber-400"
              >
                <optgroup label="⭐ My Custom Routines">
                  {customPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name} ({p.daysPerWeek}d)
                    </option>
                  ))}
                  {customPlans.length === 0 && (
                    <option disabled value="">(No custom routines yet)</option>
                  )}
                </optgroup>
                <optgroup label="🏆 Pro Standard Splits">
                  {WORKOUT_PLANS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name} ({p.daysPerWeek}d)
                    </option>
                  ))}
                </optgroup>
              </select>

              {activePlan.isCustom && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomPlan(activePlan);
                      setIsCustomPlanModalOpen(true);
                    }}
                    className="p-2 bg-secondary hover:bg-surface text-muted-foreground hover:text-amber-400 rounded-xl border border-border/60 transition-all cursor-pointer"
                    title="Edit custom routine"
                  >
                    <Lucide.Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(activePlan.id)}
                    className="p-2 bg-secondary hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-xl border border-border/60 transition-all cursor-pointer"
                    title="Delete custom routine"
                  >
                    <Lucide.Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Create Custom Plan Button */}
            <button
              type="button"
              onClick={() => {
                setEditingCustomPlan(null);
                setIsCustomPlanModalOpen(true);
              }}
              className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Lucide.Plus size={13} />
              <span>New Custom Plan</span>
            </button>
          </div>
        </div>

        {/* Selected Plan Details & Day Tabs */}
        <div className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activePlan.icon}</span>
                <h3 className="text-sm font-black text-foreground">{activePlan.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {activePlan.level}
                </span>
                {activePlan.isCustom && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/30">
                    Saved Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {activePlan.tagline}
              </p>
            </div>

            <button
              onClick={() => {
                onLogWorkoutMinutes('gym', activeDay.estimatedMinutes, 250, `${activePlan.name} - ${activeDay.dayName}`);
                addXp(30);
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Lucide.CheckCircle size={14} /> Log This Routine Today (+30 XP)
            </button>
          </div>

          {/* Day Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activePlan.days.map((day, idx) => (
              <button
                key={day.dayName}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedDayIndex === idx
                    ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary'
                }`}
              >
                {day.dayName}
              </button>
            ))}
          </div>

          {/* Day Focus Header & Completion Meter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-bold text-muted-foreground px-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground">{activeDay.focus}</span>
                <span>•</span>
                <span className="font-mono">~{activeDay.estimatedMinutes} Mins</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">
                  {activeDay.exercises.filter((_, i) => completedExercises[`${activePlan.id}_${selectedDayIndex}_${i}`]).length} / {activeDay.exercises.length} Completed
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingExerciseToDay(!isAddingExerciseToDay)}
                  className="text-[10px] font-bold px-2 py-0.5 bg-secondary hover:bg-surface text-muted-foreground hover:text-amber-400 rounded-lg border border-border/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lucide.Plus size={10} /> Add Movement
                </button>
              </div>
            </div>

            {/* Inline Quick Movement Adder Form */}
            {isAddingExerciseToDay && (
              <form
                onSubmit={handleAddExerciseToActiveDay}
                className="p-3.5 bg-secondary/60 rounded-2xl border border-amber-500/30 space-y-2.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lucide.Plus size={12} />
                    <span>Append Movement to {activeDay.dayName.split('•')[0]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingExerciseToDay(false)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Lucide.X size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Movement Name (e.g. Incline DB Flyes)"
                    value={quickExName}
                    onChange={e => setQuickExName(e.target.value)}
                    className="sm:col-span-2 bg-surface border border-border/70 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-amber-400"
                  />
                  <select
                    value={quickExMuscle}
                    onChange={e => setQuickExMuscle(e.target.value)}
                    className="bg-surface border border-border/70 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer"
                  >
                    {['Chest', 'Upper Chest', 'Back', 'Lats', 'Shoulders', 'Side Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs / Core', 'Cardio'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Sets"
                      value={quickExSets}
                      onChange={e => setQuickExSets(e.target.value)}
                      className="w-1/2 bg-surface border border-border/70 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center text-foreground outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      placeholder="Reps"
                      value={quickExReps}
                      onChange={e => setQuickExReps(e.target.value)}
                      className="w-1/2 bg-surface border border-border/70 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center text-foreground outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Technique cue (e.g. 2 sec pause at bottom, full stretch)"
                    value={quickExNotes}
                    onChange={e => setQuickExNotes(e.target.value)}
                    className="flex-1 bg-surface border border-border/70 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Save Movement
                  </button>
                </div>
              </form>
            )}

            {/* Redesigned Intuitive & Non-Wordy Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {activeDay.exercises.map((ex, idx) => {
                const exKey = `${activePlan.id}_${selectedDayIndex}_${idx}`;
                const isDone = Boolean(completedExercises[exKey]);

                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center justify-between gap-3.5 shadow-xs group ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/35'
                        : 'bg-surface-elevated/70 border-border/70 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Interactive Completion Toggle Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleExerciseComplete(exKey)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                          isDone
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                            : 'bg-secondary hover:bg-surface text-muted-foreground border-border/70 hover:border-amber-400'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as completed for today'}
                      >
                        {isDone ? (
                          <Lucide.Check size={16} className="stroke-[3]" />
                        ) : (
                          <span className="text-base">{ex.emoji}</span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-black text-xs truncate ${
                              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {ex.name}
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-md border ${getMuscleBadgeClass(
                              ex.muscle
                            )}`}
                          >
                            {ex.muscle}
                          </span>
                        </div>
                        {ex.notes && (
                          <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            💡 {ex.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Compact Sets x Reps Pill */}
                      <div className="px-2.5 py-1 bg-secondary/80 rounded-xl border border-border/60 text-right font-mono font-black text-xs text-foreground">
                        {ex.sets} <span className="text-muted-foreground text-[10px] font-sans font-bold">×</span> {ex.reps}
                      </div>

                      {/* Quick 1-Tap Log into PR Logger */}
                      <button
                        type="button"
                        onClick={() => handleQuickLogToPR(ex)}
                        className="p-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl border border-amber-500/30 transition-all cursor-pointer"
                        title="Quick-fill into Exercise & PR Logger below"
                      >
                        <Lucide.Zap size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: Live Exercise & PR Lift Logger */}
      <div id="exercise-pr-logger" className="tile settings-tile p-4 sm:p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
              <Lucide.Trophy size={18} />
            </span>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Exercise &amp; PR Logger
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Log sets, weights, and estimated 1RM.
              </p>
            </div>
          </div>

          <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {loggedExercises.length} Lifts Logged
          </span>
        </div>

        {/* Quick Autocomplete Chips for Exercises */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Quick Movements:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_EXERCISE_SUGGESTIONS.map(s => (
              <button
                key={s.name}
                type="button"
                onClick={() => setExerciseName(s.name)}
                className="text-[10px] font-bold px-2.5 py-1 bg-secondary hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 rounded-xl border border-border/60 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Lift Form */}
        <form onSubmit={handleAddExercise} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/60">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Exercise Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Barbell Bench Press"
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Sets</label>
            <input
              type="number"
              value={exerciseSets}
              onChange={e => setExerciseSets(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Reps</label>
            <input
              type="number"
              value={exerciseReps}
              onChange={e => setExerciseReps(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Weight ({weightUnit})</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                value={exerciseWeight}
                onChange={e => setExerciseWeight(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
              >
                Log
              </button>
            </div>
          </div>
        </form>

        {/* Logged Exercise Records */}
        <div className="space-y-2">
          {loggedExercises.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 font-medium italic">
              No exercise lifts recorded yet today. Click a suggestion above or enter your set!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loggedExercises.map(ex => (
                <div
                  key={ex.id}
                  className="p-3 bg-secondary/50 border border-border/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {ex.sets} sets × {ex.reps} reps @ <strong className="text-foreground font-mono">{ex.weightKg} {weightUnit}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground block">Est. 1RM</span>
                      <span className="font-black font-mono text-emerald-400">{ex.oneRepMax} {weightUnit}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                    >
                      <Lucide.Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Workout Plan Creator & Editor Modal */}
      <CustomWorkoutPlanModal
        isOpen={isCustomPlanModalOpen}
        onClose={() => setIsCustomPlanModalOpen(false)}
        onPlanCreated={handlePlanSaved}
        initialPlan={editingCustomPlan}
      />
    </div>
  );
}
