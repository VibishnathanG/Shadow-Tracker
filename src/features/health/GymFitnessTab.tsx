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
import confetti from '@/lib/confetti';

export interface ExerciseLogItem {
  id: string;
  name: string;
  muscle: string;
  mode?: 'strength' | 'cardio' | 'fullbody';
  sets?: number;
  reps?: number;
  weightKg?: number;
  oneRepMax?: number;
  distanceKm?: number;
  durationMinutes?: number;
  pace?: string;
  calories?: number;
  time: string;
}

interface GymFitnessTabProps {
  currentWeightKg?: number;
  weightUnit: 'kg' | 'lbs';
  workouts?: any[];
  onRemoveWorkout?: (workoutId: string) => void;
  onUpdateWeight: (weight: number | undefined) => void;
  onLogWorkoutMinutes: (type: any, duration: number, calories: number, notes: string) => void;
  addXp: (amount: number) => void;
}

const CARDIO_FULLBODY_SUGGESTIONS = [
  { name: 'Running / Treadmill', muscle: 'Cardio', emoji: '🏃', mode: 'cardio' as const, distance: '5.0', time: '30', pace: '6:00/km', kcal: 350 },
  { name: 'Road Cycling / Bike', muscle: 'Cardio', emoji: '🚴', mode: 'cardio' as const, distance: '15.0', time: '40', pace: '22 km/h', kcal: 420 },
  { name: 'Freestyle Swimming', muscle: 'Cardio', emoji: '🏊', mode: 'cardio' as const, distance: '1.0', time: '30', pace: '2:15/100m', kcal: 300 },
  { name: 'Morning Jogging', muscle: 'Cardio', emoji: '🏃‍♂️', mode: 'cardio' as const, distance: '3.5', time: '25', pace: '7:00/km', kcal: 260 },
  { name: '30 Mins Full Body Cardio', muscle: 'Full Body', emoji: '💦', mode: 'fullbody' as const, time: '30', rounds: '4', reps: '15', kcal: 350 },
  { name: 'HIIT Tabata Sprint', muscle: 'Full Body', emoji: '🔥', mode: 'fullbody' as const, time: '20', rounds: '8', reps: '20s/10s', kcal: 280 },
];

const STRENGTH_SUGGESTIONS = [
  { name: 'Barbell Flat Bench Press', muscle: 'Chest', emoji: '🏋️', mode: 'strength' as const, sets: '3', reps: '10', weight: '60' },
  { name: 'Barbell Back Squat', muscle: 'Quads', emoji: '🦵', mode: 'strength' as const, sets: '4', reps: '8', weight: '80' },
  { name: 'Conventional Deadlift', muscle: 'Back', emoji: '🧱', mode: 'strength' as const, sets: '3', reps: '5', weight: '100' },
  { name: 'Overhead Barbell Press', muscle: 'Shoulders', emoji: '⚡', mode: 'strength' as const, sets: '3', reps: '8', weight: '40' },
  { name: 'Wide Lat Pulldown', muscle: 'Lats', emoji: '🧗', mode: 'strength' as const, sets: '3', reps: '12', weight: '55' },
  { name: 'Incline Dumbbell Press', muscle: 'Upper Chest', emoji: '💪', mode: 'strength' as const, sets: '3', reps: '10', weight: '22' },
  { name: 'Dumbbell Lateral Raises', muscle: 'Side Delts', emoji: '🦅', mode: 'strength' as const, sets: '4', reps: '15', weight: '10' },
  { name: 'Dumbbell Bicep Curls', muscle: 'Biceps', emoji: '💪', mode: 'strength' as const, sets: '3', reps: '12', weight: '14' },
];

const COMMON_EXERCISE_SUGGESTIONS = [
  ...STRENGTH_SUGGESTIONS,
  ...CARDIO_FULLBODY_SUGGESTIONS,
];

export default function GymFitnessTab({
  currentWeightKg = 75,
  weightUnit,
  workouts = [],
  onRemoveWorkout,
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

  // Auto-save biometrics whenever any parameter changes (debounced, skips mount to prevent event storms)
  const isFirstMountRef = React.useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
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
    }, 400);
    return () => clearTimeout(timer);
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

  // Dynamic Exercise & Workout Logger State
  const [loggerMode, setLoggerMode] = useState<'strength' | 'cardio' | 'fullbody'>('strength');
  const [activeChipCategory, setActiveChipCategory] = useState<'strength' | 'cardio'>('strength');
  const [exerciseName, setExerciseName] = useState<string>('');
  const [exerciseSets, setExerciseSets] = useState<string>('3');
  const [exerciseReps, setExerciseReps] = useState<string>('10');
  const [exerciseWeight, setExerciseWeight] = useState<string>('50');
  const [workoutDistance, setWorkoutDistance] = useState<string>('5.0');
  const [workoutDuration, setWorkoutDuration] = useState<string>('30');
  const [workoutPace, setWorkoutPace] = useState<string>('5:30');
  const [workoutCalories, setWorkoutCalories] = useState<string>('250');
  const [workoutRounds, setWorkoutRounds] = useState<string>('4');
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
        window.dispatchEvent(new CustomEvent('shadow_health_updated'));
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

  const handleLogIndividualWorkout = (ex: WorkoutExercise) => {
    const isCardio = ex.muscle.toLowerCase().includes('cardio') || 
                     ex.name.toLowerCase().includes('running') || 
                     ex.name.toLowerCase().includes('cycling') || 
                     ex.name.toLowerCase().includes('swimming') ||
                     ex.name.toLowerCase().includes('jogging');
    const isFullBody = ex.muscle.toLowerCase().includes('full body') || ex.name.toLowerCase().includes('full body') || ex.name.toLowerCase().includes('hiit');

    const duration = ex.notes?.includes('30 min') ? 30 : 25;
    const cals = ex.kcal || (isCardio ? 350 : isFullBody ? 300 : 180);
    const type = isCardio ? 'cardio' : isFullBody ? 'hiit' : 'gym';
    
    onLogWorkoutMinutes(
      type,
      duration,
      cals,
      `${ex.name}${ex.sets && ex.reps ? ` (${ex.sets} × ${ex.reps})` : ''}`
    );
    addXp(25);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
  };

  const handleQuickLogToPR = (ex: WorkoutExercise) => {
    setExerciseName(ex.name);
    const isCardio = ex.muscle.toLowerCase().includes('cardio') || 
                     ex.name.toLowerCase().includes('running') || 
                     ex.name.toLowerCase().includes('cycling') || 
                     ex.name.toLowerCase().includes('swimming') ||
                     ex.name.toLowerCase().includes('jogging');
    const isFullBody = ex.muscle.toLowerCase().includes('full body') || ex.name.toLowerCase().includes('full body') || ex.name.toLowerCase().includes('hiit');

    if (isCardio) {
      setLoggerMode('cardio');
      setActiveChipCategory('cardio');
      setWorkoutDuration('30');
      setWorkoutDistance(ex.name.toLowerCase().includes('cycling') ? '15.0' : ex.name.toLowerCase().includes('swimming') ? '1.0' : '5.0');
      setWorkoutCalories(String(ex.kcal || 350));
      setWorkoutPace(ex.name.toLowerCase().includes('cycling') ? '22 km/h' : ex.name.toLowerCase().includes('swimming') ? '2:15/100m' : '6:00/km');
    } else if (isFullBody) {
      setLoggerMode('fullbody');
      setActiveChipCategory('cardio');
      setWorkoutDuration('30');
      setWorkoutRounds('4');
      setWorkoutCalories(String(ex.kcal || 350));
    } else {
      setLoggerMode('strength');
      setActiveChipCategory('strength');
      const s = parseInt(ex.sets, 10);
      if (!isNaN(s)) setExerciseSets(String(s));
      const r = parseInt(ex.reps, 10);
      if (!isNaN(r)) setExerciseReps(String(r));
    }
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

  // Add Exercise Log (Dynamic for Strength, Cardio & Full Body)
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (loggerMode === 'cardio') {
      const dist = parseFloat(workoutDistance) || 0;
      const dur = parseInt(workoutDuration, 10) || 30;
      const cals = parseInt(workoutCalories, 10) || (dur * 8);

      const newEx: ExerciseLogItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: exerciseName.trim(),
        muscle: 'Cardio',
        mode: 'cardio',
        distanceKm: dist,
        durationMinutes: dur,
        pace: workoutPace || undefined,
        calories: cals,
        time: timeStr,
      };

      saveExercises([newEx, ...loggedExercises]);
      onLogWorkoutMinutes(
        'cardio',
        dur,
        cals,
        `${exerciseName.trim()} (${dist > 0 ? `${dist} km • ` : ''}${dur} mins${workoutPace ? ` • ${workoutPace}` : ''})`
      );
      addXp(25);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setExerciseName('');
    } else if (loggerMode === 'fullbody') {
      const dur = parseInt(workoutDuration, 10) || 30;
      const rounds = parseInt(workoutRounds, 10) || 4;
      const reps = parseInt(exerciseReps, 10) || 12;
      const cals = parseInt(workoutCalories, 10) || (dur * 9);

      const newEx: ExerciseLogItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: exerciseName.trim(),
        muscle: 'Full Body',
        mode: 'fullbody',
        durationMinutes: dur,
        sets: rounds,
        reps,
        calories: cals,
        time: timeStr,
      };

      saveExercises([newEx, ...loggedExercises]);
      onLogWorkoutMinutes(
        'hiit',
        dur,
        cals,
        `${exerciseName.trim()} (${rounds} rounds • ${dur} mins)`
      );
      addXp(25);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setExerciseName('');
    } else {
      // Strength / Lifting
      const s = parseInt(exerciseSets, 10) || 3;
      const r = parseInt(exerciseReps, 10) || 10;
      const w = parseFloat(exerciseWeight) || 0;
      // 1RM Brzycki formula: W * (1 + R/30)
      const onerm = Math.round(w * (1 + r / 30) * 10) / 10;

      const newEx: ExerciseLogItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: exerciseName.trim(),
        muscle: 'Lifting',
        mode: 'strength',
        sets: s,
        reps: r,
        weightKg: w,
        oneRepMax: onerm,
        time: timeStr,
      };

      saveExercises([newEx, ...loggedExercises]);
      onLogWorkoutMinutes(
        'gym',
        25,
        180,
        `${exerciseName.trim()} (${s} sets × ${r} reps @ ${w} ${weightUnit})`
      );
      addXp(20);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setExerciseName('');
    }
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
            <div className="bg-secondary/40 hover:bg-secondary/60 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Current Wt</span>
                <button
                  type="button"
                  onClick={() => onUpdateWeight(parseFloat(calcCurrentWeight))}
                  className="text-[9.5px] text-primary hover:text-primary-foreground font-black px-2 py-0.5 rounded-lg bg-primary/15 hover:bg-primary border border-primary/25 transition-all cursor-pointer shadow-2xs"
                  title="Sync with today's logged weight"
                >
                  Sync
                </button>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={calcCurrentWeight}
                  onChange={e => setCalcCurrentWeight(e.target.value)}
                  style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}
                  className="w-full text-lg sm:text-xl font-black font-mono text-foreground outline-none focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                  placeholder="80"
                />
                <span className="text-xs font-bold text-muted-foreground font-mono shrink-0 ml-1.5">{weightUnit}</span>
              </div>
            </div>

            {/* Target Weight */}
            <div className="bg-secondary/40 hover:bg-secondary/60 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Target Wt</span>
                <span className="text-[9.5px] font-black text-emerald-400">Goal</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={calcTargetWeight}
                  onChange={e => setCalcTargetWeight(e.target.value)}
                  style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}
                  className="w-full text-lg sm:text-xl font-black font-mono text-foreground outline-none focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                  placeholder="72"
                />
                <span className="text-xs font-bold text-muted-foreground font-mono shrink-0 ml-1.5">{weightUnit}</span>
              </div>
            </div>

            {/* Height */}
            <div className="bg-secondary/40 hover:bg-secondary/60 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Height</span>
                <span className="text-[9.5px] font-bold text-muted-foreground/70">cm</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <input
                  type="number"
                  step="1"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}
                  className="w-full text-lg sm:text-xl font-black font-mono text-foreground outline-none focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                  placeholder="175"
                />
                <span className="text-xs font-bold text-muted-foreground font-mono shrink-0 ml-1.5">cm</span>
              </div>
            </div>

            {/* Age */}
            <div className="bg-secondary/40 hover:bg-secondary/60 focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Age</span>
                <span className="text-[9.5px] font-bold text-muted-foreground/70">Years</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <input
                  type="number"
                  step="1"
                  min="14"
                  max="100"
                  value={userAge}
                  onChange={e => setUserAge(e.target.value)}
                  style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}
                  className="w-full text-lg sm:text-xl font-black font-mono text-foreground outline-none focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                  placeholder="28"
                />
                <span className="text-xs font-bold text-muted-foreground font-mono shrink-0 ml-1.5">yrs</span>
              </div>
            </div>

            {/* Biological Sex */}
            <div className="bg-secondary/40 hover:bg-secondary/60 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Biological Sex</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 bg-surface/70 p-1 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setUserSex('male')}
                  className={`flex-1 py-1 text-xs rounded-lg font-black transition-all cursor-pointer ${
                    userSex === 'male'
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ♂ Male
                </button>
                <button
                  type="button"
                  onClick={() => setUserSex('female')}
                  className={`flex-1 py-1 text-xs rounded-lg font-black transition-all cursor-pointer ${
                    userSex === 'female'
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ♀ Female
                </button>
              </div>
            </div>

            {/* Daily Activity Level */}
            <div className="bg-secondary/40 hover:bg-secondary/60 transition-all p-3.5 rounded-2xl border border-border/70 flex flex-col justify-between min-h-[84px] shadow-xs">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Activity Level</span>
              </div>
              <div className="mt-1">
                <select
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value as any)}
                  style={{ padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)' }}
                  className="w-full text-xs font-black bg-surface/90 text-foreground rounded-xl outline-none cursor-pointer focus:border-primary truncate"
                >
                  <option value="sedentary">Sedentary (1.2x)</option>
                  <option value="light">Light (1.375x)</option>
                  <option value="moderate">Moderate (1.55x)</option>
                  <option value="very_active">Active (1.725x)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE WEEKLY RATE SELECTOR (Dynamically adapted to Loss vs Gain) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-emerald-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{feasibility.direction === 'gain' ? '📈' : '📉'}</span>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                  {feasibility.direction === 'gain'
                    ? '2. Weekly Surplus & Muscle Gain Target'
                    : feasibility.direction === 'loss'
                    ? '2. Weekly Deficit & Weight Loss Target'
                    : '2. Energy Maintenance Target'}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {feasibility.direction === 'gain'
                  ? 'Choose your lean bulk pace or adjust the slider to test caloric feasibility.'
                  : 'Choose your comfortable pace or adjust the slider to test feasibility.'}
              </p>
            </div>

            {/* Dynamic Goal Difference */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Difference</span>
              <span className="text-xs font-black font-mono text-foreground">
                {Math.abs((parseFloat(calcTargetWeight) || 0) - (parseFloat(calcCurrentWeight) || 0)).toFixed(1)} {weightUnit}
                {' '}({feasibility.direction === 'gain' ? '+Gain' : feasibility.direction === 'loss' ? '-Cut' : 'Maintain'})
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons (Personalized to user's direction & bodyweight) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Personalized Scientific Paces:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRateChange(feasibility.gentleKgPerWeek)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.gentleKgPerWeek) < 0.05
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>{feasibility.direction === 'gain' ? '🌱 Lean Bulking' : '🟢 Gentle Recomp'}</span>
                  <span className="font-mono text-[10px]">{feasibility.gentleKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {feasibility.direction === 'gain' ? 'Minimal fat, clean lean gains' : 'Low friction lifestyle shift'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.recommendedKgPerWeek)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.recommendedKgPerWeek) < 0.05
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>{feasibility.direction === 'gain' ? '🌟 Optimal Mass' : '🌟 Optimal Gold'}</span>
                  <span className="font-mono text-[10px] font-black text-emerald-400">{feasibility.recommendedKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-emerald-400/90 mt-0.5">
                  {feasibility.direction === 'gain' ? 'Muscle building sweet spot' : 'Recommended Sweet Spot'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.athleticKgPerWeek)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.athleticKgPerWeek) < 0.05
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>{feasibility.direction === 'gain' ? '⚡ Accelerated Bulk' : '⚡ Athletic Cut'}</span>
                  <span className="font-mono text-[10px]">{feasibility.athleticKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {feasibility.direction === 'gain' ? 'Hardgainer caloric surplus' : 'Strict disciplined shred'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(feasibility.maxSafeKgPerWeek)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(weeklyLossRate - feasibility.maxSafeKgPerWeek) < 0.05
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-xs'
                    : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between">
                  <span>{feasibility.direction === 'gain' ? '🚀 Upper Safe Gain' : '🚀 Max Safe Pace'}</span>
                  <span className="font-mono text-[10px]">{feasibility.maxSafeKgPerWeek} kg/wk</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {feasibility.direction === 'gain' ? 'Upper physiological rate' : 'Upper physiological limit'}
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Slider & Days Controls */}
          {(() => {
            const maxSliderRate = feasibility.direction === 'gain' ? 1.00 : 1.50;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-center">
                {/* Slider */}
                <div className="md:col-span-2 space-y-2 bg-secondary/30 p-3.5 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {feasibility.direction === 'gain' ? 'Weekly Muscle Building Pace:' : 'Custom Weekly Pace Slider:'}
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {weeklyLossRate.toFixed(2)} kg / week
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.10"
                    max={maxSliderRate}
                    step="0.05"
                    value={weeklyLossRate}
                    onChange={e => handleRateChange(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-secondary rounded-lg"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>0.10 kg/wk ({feasibility.direction === 'gain' ? 'Lean Recomp' : 'Gentle Cut'})</span>
                    <span className="text-emerald-400 font-bold">~{feasibility.pctBodyWeightPerWeek}% body wt/wk</span>
                    <span>{maxSliderRate.toFixed(2)} kg/wk ({feasibility.direction === 'gain' ? 'Rapid Bulk' : 'Aggressive Cut'})</span>
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
            );
          })()}
        </div>

        {/* Dynamic Feasibility Output Card */}
        <motion.div
          key={`${feasibility.level}-${feasibility.days}-${feasibility.kgPerWeek}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 sm:p-6 rounded-3xl border ${feasibility.borderClass} ${feasibility.bgClass} shadow-lg space-y-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-surface/90 shadow-xs border border-border/50">
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
            <div className="flex items-center gap-3 sm:gap-4 bg-surface/90 p-3 sm:p-3.5 rounded-2xl border border-border/70 text-right shrink-0">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Weekly Pace</span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">{feasibility.kgPerWeek} kg / wk</span>
              </div>
              <div className="h-6 w-px bg-border/80" />
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  {feasibility.direction === 'loss' ? 'Daily Deficit' : 'Daily Surplus'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">
                  {feasibility.direction === 'loss' ? '-' : '+'}{feasibility.dailyDeficitSurplusKcal} kcal/d
                </span>
              </div>
              <div className="h-6 w-px bg-border/80" />
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Target Intake</span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                  {feasibility.targetDailyCalories} kcal/d
                </span>
              </div>
            </div>
          </div>

          {/* Calorie Floor / Surplus Safety Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs px-3.5 py-2.5 rounded-2xl bg-surface/80 border border-border/60 gap-2">
            {feasibility.direction === 'gain' ? (
              <>
                <div className="flex items-center gap-2">
                  <Lucide.ShieldCheck size={15} className={feasibility.dailyDeficitSurplusKcal <= 500 ? 'text-emerald-400' : 'text-amber-400'} />
                  <span className="text-foreground font-semibold">
                    Hypertrophy Surplus: <strong className="font-mono text-foreground">+{feasibility.dailyDeficitSurplusKcal} kcal/day</strong> over maintenance TDEE ({feasibility.tdee} kcal)
                  </span>
                </div>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                  feasibility.dailyDeficitSurplusKcal <= 400
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {feasibility.dailyDeficitSurplusKcal <= 400
                    ? '✓ Clean Hypertrophy Range (200-400 kcal)'
                    : `⚠️ +${feasibility.dailyDeficitSurplusKcal - 400} kcal above recommended surplus`}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Lucide.ShieldCheck size={15} className={feasibility.targetDailyCalories >= feasibility.minSafeCalories ? 'text-emerald-400' : 'text-rose-500'} />
                  <span className="text-foreground font-semibold">
                    Clinical Safety Floor: <strong className="font-mono text-foreground">{feasibility.minSafeCalories} kcal/day</strong> (based on {feasibility.bmr} kcal BMR)
                  </span>
                </div>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                  feasibility.targetDailyCalories >= feasibility.minSafeCalories
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                }`}>
                  {feasibility.targetDailyCalories >= feasibility.minSafeCalories
                    ? `✓ +${feasibility.targetDailyCalories - feasibility.minSafeCalories} kcal above floor`
                    : `⚠️ ${feasibility.minSafeCalories - feasibility.targetDailyCalories} kcal below floor!`}
                </span>
              </>
            )}
          </div>

          {/* 5-Level Progress Tier Visualizer */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {feasibility.direction === 'gain' ? (
                <>
                  <span className={feasibility.level === 1 ? 'text-rose-500 font-black' : ''}>1. Unsafe Surplus</span>
                  <span className={feasibility.level === 2 ? 'text-amber-500 font-black' : ''}>2. Rapid Bulk</span>
                  <span className={feasibility.level === 3 ? 'text-yellow-400 font-black' : ''}>3. Accelerated</span>
                  <span className={feasibility.level === 4 ? 'text-emerald-400 font-black' : ''}>4. Optimal Lean Bulk</span>
                  <span className={feasibility.level === 5 ? 'text-sky-400 font-black' : ''}>5. Lean Recomp</span>
                </>
              ) : (
                <>
                  <span className={feasibility.level === 1 ? 'text-rose-500 font-black' : ''}>1. Danger</span>
                  <span className={feasibility.level === 2 ? 'text-amber-500 font-black' : ''}>2. Warning</span>
                  <span className={feasibility.level === 3 ? 'text-yellow-400 font-black' : ''}>3. Challenging</span>
                  <span className={feasibility.level === 4 ? 'text-emerald-400 font-black' : ''}>4. Optimal Cut</span>
                  <span className={feasibility.level === 5 ? 'text-sky-400 font-black' : ''}>5. Gentle Recomp</span>
                </>
              )}
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
              <div key={idx} className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground bg-surface/50 p-2 rounded-xl border border-border/40">
                <span className="text-xs leading-none mt-0.5 text-primary font-bold">✓</span>
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
                      {/* Compact Sets x Reps Pill (Hidden for time-bound cardio) */}
                      {(ex.sets || ex.reps) && (
                        <div className="px-2.5 py-1 bg-secondary/80 rounded-xl border border-border/60 text-right font-mono font-black text-xs text-foreground">
                          {ex.sets} {ex.sets && ex.reps && <span className="text-muted-foreground text-[10px] font-sans font-bold">×</span>} {ex.reps}
                        </div>
                      )}

                      {/* Generic Kcal Drain */}
                      {ex.kcal && (
                        <div className="px-2 py-1 bg-rose-500/10 rounded-xl border border-rose-500/20 text-right font-mono font-black text-xs text-rose-400" title="Estimated calories burned">
                          🔥 {ex.kcal}
                        </div>
                      )}

                      {/* Log Individual Workout directly */}
                      <button
                        type="button"
                        onClick={() => handleLogIndividualWorkout(ex)}
                        className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl border border-amber-500/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Log this specific movement directly to today's workouts"
                      >
                        <Lucide.Plus size={11} className="stroke-[3]" />
                        <span>Log</span>
                      </button>

                      {/* Quick 1-Tap Log into PR Logger */}
                      <button
                        type="button"
                        onClick={() => handleQuickLogToPR(ex)}
                        className="p-1.5 bg-secondary hover:bg-surface text-muted-foreground hover:text-amber-400 rounded-xl border border-border/70 transition-all cursor-pointer"
                        title="Quick-fill into Exercise & PR Logger below"
                      >
                        <Lucide.Zap size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Logged Workouts for Today with Removal */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/15 text-amber-500 rounded-lg">
                    <Lucide.Activity size={15} />
                  </span>
                  <span className="text-sm font-black text-foreground">Today's Logged Workouts</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {workouts.length} recorded
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Total Active: <strong className="text-foreground font-mono">{workouts.reduce((acc, w) => acc + (w.duration || 0), 0)} mins</strong> • <strong className="text-amber-400 font-mono">{workouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0)} kcal</strong>
                </span>
              </div>

              {workouts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-center text-xs text-muted-foreground italic">
                  No workouts logged for today yet. Tap &ldquo;+ Log&rdquo; on any routine exercise above or use the adaptive logger below!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {workouts.map(w => {
                    const isCardio = w.type === 'cardio' || w.type === 'running' || w.type === 'cycling' || w.type === 'swimming';
                    const isHiit = w.type === 'hiit' || w.type === 'fullbody';
                    const icon = isCardio ? '🏃' : isHiit ? '⚡' : '🏋️';
                    return (
                      <div
                        key={w.id}
                        className="p-3 bg-secondary/50 hover:bg-secondary/70 rounded-2xl border border-border/60 flex items-center justify-between gap-3 text-xs shadow-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base p-1.5 bg-surface rounded-xl shrink-0 shadow-xs">{icon}</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-foreground truncate text-xs" title={w.notes || w.type}>
                              {w.notes || (String(w.type).toUpperCase() + ' Session')}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-medium">
                              <span className="font-mono text-foreground font-bold">{w.duration} mins</span>
                              <span>•</span>
                              <span className="text-amber-400 font-mono font-bold">🔥 {w.caloriesBurned} kcal</span>
                            </div>
                          </div>
                        </div>

                        {onRemoveWorkout && (
                          <button
                            type="button"
                            onClick={() => onRemoveWorkout(w.id)}
                            className="p-1.5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Remove this workout from today"
                          >
                            <Lucide.Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: Live Adaptive Exercise & PR Lift Logger */}
      <div id="exercise-pr-logger" className="tile settings-tile p-4 sm:p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
              <Lucide.Trophy size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  Adaptive Workout &amp; PR Logger
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {loggedExercises.length} Logged
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Fields adapt to your discipline: Strength (kg), Cardio (pace &amp; km), or Full Body (circuits &amp; time).
              </p>
            </div>
          </div>

          {/* Dynamic Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-2xl border border-border/70 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLoggerMode('strength');
                setExerciseName('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                loggerMode === 'strength'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🏋️</span>
              <span>Strength</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoggerMode('cardio');
                setExerciseName('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                loggerMode === 'cardio'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🏃</span>
              <span>Cardio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoggerMode('fullbody');
                setExerciseName('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                loggerMode === 'fullbody'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>⚡</span>
              <span>Full Body</span>
            </button>
          </div>
        </div>

        {/* Quick Autocomplete Chips filtered by Mode */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Quick {loggerMode === 'strength' ? 'Strength Lifts' : loggerMode === 'cardio' ? 'Cardio Activities (No Weights)' : 'Full Body Workouts'}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(loggerMode === 'strength'
              ? STRENGTH_SUGGESTIONS
              : loggerMode === 'cardio'
              ? CARDIO_FULLBODY_SUGGESTIONS.filter(s => s.mode === 'cardio')
              : CARDIO_FULLBODY_SUGGESTIONS.filter(s => s.mode === 'fullbody')
            ).map(s => (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  setExerciseName(s.name);
                  if (s.mode === 'cardio') {
                    if ('distance' in s && s.distance) setWorkoutDistance(s.distance);
                    if ('time' in s && s.time) setWorkoutDuration(s.time);
                    if ('pace' in s && s.pace) setWorkoutPace(s.pace);
                    if ('kcal' in s && s.kcal) setWorkoutCalories(String(s.kcal));
                  } else if (s.mode === 'fullbody') {
                    if ('time' in s && s.time) setWorkoutDuration(s.time);
                    if ('rounds' in s && s.rounds) setWorkoutRounds(s.rounds);
                    if ('reps' in s && s.reps) setExerciseReps(String(s.reps));
                    if ('kcal' in s && s.kcal) setWorkoutCalories(String(s.kcal));
                  } else {
                    if ('sets' in s && s.sets) setExerciseSets(s.sets);
                    if ('reps' in s && s.reps) setExerciseReps(s.reps);
                    if ('weight' in s && s.weight) setExerciseWeight(s.weight);
                  }
                }}
                className={`text-[10px] font-bold px-2.5 py-1 bg-secondary hover:bg-surface text-muted-foreground rounded-xl border border-border/60 transition-all cursor-pointer flex items-center gap-1.5 ${
                  exerciseName === s.name ? 'border-primary/50 text-foreground bg-surface shadow-xs' : ''
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Add Workout Form Based on Discipline */}
        <form onSubmit={handleAddExercise} className="p-4 bg-secondary/30 rounded-2xl border border-border/60 space-y-3">
          {loggerMode === 'strength' && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Exercise Name</label>
                <input
                  type="text"
                  required
                  maxLength={60}
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
                    className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {loggerMode === 'cardio' && (
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Cardio Activity (No Weights)</label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. Running, Cycling, Swimming, Jogging"
                  value={exerciseName}
                  onChange={e => setExerciseName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  value={workoutDistance}
                  onChange={e => setWorkoutDistance(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration (mins)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={workoutDuration}
                  onChange={e => setWorkoutDuration(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Pace / Speed</label>
                <input
                  type="text"
                  placeholder="e.g. 5:30/km"
                  value={workoutPace}
                  onChange={e => setWorkoutPace(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Calories (kcal)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 300"
                    value={workoutCalories}
                    onChange={e => setWorkoutCalories(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {loggerMode === 'fullbody' && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Body / HIIT Workout</label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. 30 Mins Full Body Cardio, HIIT Circuit"
                  value={exerciseName}
                  onChange={e => setExerciseName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration (mins)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={workoutDuration}
                  onChange={e => setWorkoutDuration(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Rounds / Circuits</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={workoutRounds}
                  onChange={e => setWorkoutRounds(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Calories (kcal)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={workoutCalories}
                    onChange={e => setWorkoutCalories(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Logged Exercise & Workout Records */}
        <div className="space-y-2">
          {loggedExercises.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 font-medium italic">
              No individual workouts logged in this session yet. Select an activity above and log!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loggedExercises.map(ex => (
                <div
                  key={ex.id}
                  className="p-3 bg-secondary/50 border border-border/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{ex.mode === 'cardio' ? '🏃' : ex.mode === 'fullbody' ? '⚡' : '🏋️'}</span>
                      <p className="font-extrabold text-foreground truncate">{ex.name}</p>
                    </div>
                    {ex.mode === 'cardio' ? (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ex.distanceKm ? `${ex.distanceKm} km • ` : ''}{ex.durationMinutes} mins{ex.pace ? ` • ${ex.pace}` : ''} • <span className="text-sky-400 font-mono font-bold">🔥 {ex.calories} kcal</span>
                      </p>
                    ) : ex.mode === 'fullbody' ? (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ex.durationMinutes} mins • {ex.sets} rounds • <span className="text-amber-400 font-mono font-bold">🔥 {ex.calories} kcal</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ex.sets} sets × {ex.reps} reps @ <strong className="text-foreground font-mono">{ex.weightKg} {weightUnit}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {ex.mode === 'strength' && ex.oneRepMax ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground block">Est. 1RM</span>
                        <span className="font-black font-mono text-emerald-400">{ex.oneRepMax} {weightUnit}</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground block">Logged At</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{ex.time}</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      title="Delete from list"
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
