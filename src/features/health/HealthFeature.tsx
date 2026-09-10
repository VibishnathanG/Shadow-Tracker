'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';
import NutritionPlateVisualizer, { LoggedFood, MealType } from './NutritionPlateVisualizer';
import AddFoodModal from './AddFoodModal';
import GymFitnessTab from './GymFitnessTab';
import HealthCalendarModal from './HealthCalendarModal';
import HealthDashboardTab from './HealthDashboardTab';
import WeeklyDietPlanner from './WeeklyDietPlanner';
import { DietMeal } from './dietPlansData';
import { useViewPreference } from '@/lib/viewPreferences';

export interface HydrationLog {
  id: string;
  amount: number; // in ml
  time: string; // HH:MM
}

export interface WorkoutLog {
  id: string;
  type: 'gym' | 'cardio' | 'walk' | 'cycling' | 'yoga' | 'sports' | 'other';
  duration: number; // minutes
  calories?: number;
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
  time: string;
}

export interface DailyHealthData {
  date: string; // YYYY-MM-DD
  waterIntakeMl: number;
  waterGoalMl: number;
  hydrationLogs: HydrationLog[];
  calorieGoal: number;
  loggedFoods: LoggedFood[];
  bedtime?: string; // HH:MM
  wakeTime?: string; // HH:MM
  sleepHours: number;
  sleepGoalHours: number;
  sleepQuality?: 'rested' | 'energized' | 'normal' | 'light' | 'groggy';
  sleepNotes?: string;
  weightKg?: number;
  weightUnit: 'kg' | 'lbs';
  workouts: WorkoutLog[];
  workoutGoalMinutes: number;
  energyLevel?: 1 | 2 | 3 | 4 | 5; // 1 = Drained, 5 = Peak
}

const STORAGE_KEY = 'shadow_health_data_v2';

const getDefaultHealthData = (date: string): DailyHealthData => ({
  date,
  waterIntakeMl: 0,
  waterGoalMl: 2500,
  hydrationLogs: [],
  calorieGoal: 2000,
  loggedFoods: [],
  bedtime: '23:00',
  wakeTime: '07:00',
  sleepHours: 8,
  sleepGoalHours: 8,
  sleepQuality: 'normal',
  sleepNotes: '',
  weightKg: undefined,
  weightUnit: 'kg',
  workouts: [],
  workoutGoalMinutes: 45,
  energyLevel: 3,
});

export default function HealthFeature() {
  const { addXp } = useShadowTrackerStore();
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Sub-tab: 'vitality' (Vitality & Nutrition) vs 'diet' (Diet Planner) vs 'gym' (Gym & Fitness) vs 'dashboard' (Health Dashboard) - Persisted
  const [activeSubTab, setActiveSubTab] = useViewPreference('healthActiveSubTab') as ['vitality' | 'diet' | 'gym' | 'dashboard', (v: 'vitality' | 'diet' | 'gym' | 'dashboard') => void];

  // Interactive Calendar Modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // All historical health data
  const [healthMap, setHealthMap] = useState<Record<string, DailyHealthData>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('shadow_health_data_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed;
        }
      } catch (e) {
        console.error('Error loading health data:', e);
      }
    }
    return { [todayStr]: getDefaultHealthData(todayStr) };
  });

  // Persist changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(healthMap));
      } catch (e) {
        console.error('Error saving health data:', e);
      }
    }
  }, [healthMap]);

  // Current day data
  const currentData = useMemo(() => {
    const raw = healthMap[selectedDate] || getDefaultHealthData(selectedDate);
    // Ensure all default fields exist
    return {
      ...getDefaultHealthData(selectedDate),
      ...raw,
      loggedFoods: raw.loggedFoods || [],
      calorieGoal: raw.calorieGoal || 2000,
    };
  }, [healthMap, selectedDate]);

  // Update helper
  const updateCurrentHealth = useCallback((updater: (prev: DailyHealthData) => DailyHealthData) => {
    setHealthMap(prev => {
      const existing = prev[selectedDate] || getDefaultHealthData(selectedDate);
      const updated = updater({
        ...getDefaultHealthData(selectedDate),
        ...existing,
      });
      return { ...prev, [selectedDate]: updated };
    });
  }, [selectedDate]);

  // Hydration state
  const [customWaterMl, setCustomWaterMl] = useState<string>('');
  const [isEditingWaterGoal, setIsEditingWaterGoal] = useState<boolean>(false);
  const [tempWaterGoal, setTempWaterGoal] = useState<string>(String(currentData.waterGoalMl || 2500));

  // Calorie Goal state
  const [isEditingCalorieGoal, setIsEditingCalorieGoal] = useState<boolean>(false);
  const [tempCalorieGoal, setTempCalorieGoal] = useState<string>(String(currentData.calorieGoal || 2000));

  // Food Modal
  const [isAddFoodOpen, setIsAddFoodOpen] = useState<boolean>(false);
  const [addFoodTargetMeal, setAddFoodTargetMeal] = useState<MealType>('lunch');

  // Hydration Action
  const handleAddWater = (amountMl: number) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: HydrationLog = {
      id: Math.random().toString(36).substring(2, 9),
      amount: amountMl,
      time: timeStr,
    };

    updateCurrentHealth(prev => {
      const newTotal = Math.max(0, prev.waterIntakeMl + amountMl);
      const isFirstGoalReach = prev.waterIntakeMl < prev.waterGoalMl && newTotal >= prev.waterGoalMl;
      if (isFirstGoalReach) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        addXp(20);
      }
      return {
        ...prev,
        waterIntakeMl: newTotal,
        hydrationLogs: amountMl > 0 ? [newLog, ...prev.hydrationLogs] : prev.hydrationLogs.slice(1),
      };
    });
  };

  // Nutrition actions
  const handleAddFood = (foodData: Omit<LoggedFood, 'id' | 'time'>) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLoggedFood: LoggedFood = {
      ...foodData,
      id: Math.random().toString(36).substring(2, 9),
      time: timeStr,
    };

    updateCurrentHealth(prev => ({
      ...prev,
      loggedFoods: [newLoggedFood, ...prev.loggedFoods],
    }));

    addXp(15);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleUpdateFood = (id: string, updates: Partial<LoggedFood>) => {
    updateCurrentHealth(prev => ({
      ...prev,
      loggedFoods: prev.loggedFoods.map(f => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const handleRemoveFood = (id: string) => {
    updateCurrentHealth(prev => ({
      ...prev,
      loggedFoods: prev.loggedFoods.filter(f => f.id !== id),
    }));
  };

  const handleCopyDietMealsToPlate = (meals: DietMeal[]) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newFoods: LoggedFood[] = meals.map(m => {
      const mealCategory: MealType =
        m.mealType === 'breakfast'
          ? 'breakfast'
          : m.mealType === 'lunch'
          ? 'lunch'
          : m.mealType === 'dinner'
          ? 'dinner'
          : 'snack';

      return {
        id: Math.random().toString(36).substring(2, 9),
        foodId: `diet_plan_${Math.random().toString(36).substring(2, 6)}`,
        name: m.name,
        serving: m.portion || '1 serving',
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
        icon: m.icon || '🥗',
        meal: mealCategory,
        quantity: 1,
        time: timeStr,
      };
    });

    updateCurrentHealth(prev => ({
      ...prev,
      loggedFoods: [...newFoods, ...prev.loggedFoods],
    }));

    addXp(25);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
  };

  // Sleep duration calculator
  const calculateSleepDuration = (bed: string, wake: string): number => {
    if (!bed || !wake) return 8;
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    let bedMins = bH * 60 + bM;
    let wakeMins = wH * 60 + wM;
    if (wakeMins < bedMins) wakeMins += 24 * 60;
    const diffHours = (wakeMins - bedMins) / 60;
    return Math.round(diffHours * 10) / 10;
  };

  const handleBedtimeChange = (newBed: string) => {
    updateCurrentHealth(prev => {
      const hours = calculateSleepDuration(newBed, prev.wakeTime || '07:00');
      return { ...prev, bedtime: newBed, sleepHours: hours };
    });
  };

  const handleWakeTimeChange = (newWake: string) => {
    updateCurrentHealth(prev => {
      const hours = calculateSleepDuration(prev.bedtime || '23:00', newWake);
      return { ...prev, wakeTime: newWake, sleepHours: hours };
    });
  };

  // Workout from Gym tab
  const handleLogWorkoutMinutes = (
    type: WorkoutLog['type'],
    duration: number,
    calories: number,
    notes: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newWorkout: WorkoutLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      duration,
      calories,
      intensity: 'high',
      notes,
      time: timeStr,
    };

    updateCurrentHealth(prev => ({
      ...prev,
      workouts: [newWorkout, ...prev.workouts],
    }));
  };

  // Total active workout minutes today
  const totalWorkoutMinutes = useMemo(() => {
    return currentData.workouts.reduce((acc, w) => acc + w.duration, 0);
  }, [currentData.workouts]);

  // Total calories eaten today
  const totalCaloriesEaten = useMemo(() => {
    return Math.round(
      currentData.loggedFoods.reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0)
    );
  }, [currentData.loggedFoods]);

  // Overall Vitality Index (0 - 100)
  const healthScore = useMemo(() => {
    // 1. Water component (max 25 pts)
    const waterScore = Math.min(25, (currentData.waterIntakeMl / (currentData.waterGoalMl || 2500)) * 25);
    // 2. Nutrition component (max 25 pts)
    let nutritionScore = 0;
    if (totalCaloriesEaten > 0) {
      const calRatio = totalCaloriesEaten / (currentData.calorieGoal || 2000);
      if (calRatio >= 0.85 && calRatio <= 1.1) {
        nutritionScore = 25;
      } else if (calRatio < 0.85) {
        nutritionScore = Math.round(calRatio * 25);
      } else {
        nutritionScore = Math.max(5, Math.round(25 - (calRatio - 1.1) * 30));
      }
    }
    // 3. Sleep component (max 25 pts)
    const sleepDiff = Math.abs(currentData.sleepHours - (currentData.sleepGoalHours || 8));
    const sleepScore = Math.max(0, 25 - sleepDiff * 5);
    // 4. Activity & Energy component (max 25 pts)
    const workoutScore = Math.min(15, (totalWorkoutMinutes / (currentData.workoutGoalMinutes || 45)) * 15);
    const energyScore = ((currentData.energyLevel || 3) / 5) * 10;

    return Math.round(waterScore + nutritionScore + sleepScore + workoutScore + energyScore);
  }, [currentData, totalWorkoutMinutes, totalCaloriesEaten]);

  // 7-day Hydration history
  const past7Days = useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dayData = healthMap[str];
      const ml = dayData?.waterIntakeMl || 0;
      const sleep = dayData?.sleepHours || 0;
      list.push({ date: str, dayName, ml, sleep });
    }
    return list;
  }, [healthMap]);

  const waterPct = Math.min(100, Math.round((currentData.waterIntakeMl / (currentData.waterGoalMl || 2500)) * 100));

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Health Score Hero */}
      <div className="tile settings-tile p-5 sm:p-7 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)] shrink-0">
                <Lucide.HeartPulse size={22} className="animate-pulse text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>Health &amp; Vitality Suite</span>
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Complete biological OS: hydration, nutrition plate, gym training splits, and weight feasibility engine.
                </p>
              </div>
            </div>

            {/* Sub-tab Switcher: Vitality & Nutrition vs Gym & Pro Fitness vs Health Dashboard */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="pill-group overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('vitality')}
                  className={`filter-pill ${activeSubTab === 'vitality' ? 'active' : ''}`}
                >
                  <span className="text-emerald-400">🌿</span>
                  <span>Vitality &amp; Nutrition</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('diet')}
                  className={`filter-pill ${activeSubTab === 'diet' ? 'active' : ''}`}
                >
                  <span className="text-orange-400">🥗</span>
                  <span>Diet Planner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('gym')}
                  className={`filter-pill ${activeSubTab === 'gym' ? 'active' : ''}`}
                >
                  <span className="text-amber-400">🏋️‍♂️</span>
                  <span>Gym &amp; Fitness</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('dashboard')}
                  className={`filter-pill ${activeSubTab === 'dashboard' ? 'active' : ''}`}
                >
                  <span className="text-sky-400">📊</span>
                  <span>Dashboard</span>
                </button>
              </div>

              {/* Interactive Date Launcher with Micro Calendar Modal */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="btn-glass-pill flex items-center gap-2 text-xs font-black text-foreground cursor-pointer shadow-xs hover:border-primary/50 group"
                  title="Open Health Calendar Overview"
                >
                  <Lucide.Calendar size={14} className="text-primary group-hover:scale-110 transition-transform" />
                  <span>{selectedDate === todayStr ? `Today (${selectedDate})` : selectedDate}</span>
                  <Lucide.ChevronDown size={13} className="text-muted-foreground" />
                </button>

                {selectedDate !== todayStr && (
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-[11px] font-bold px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors cursor-pointer"
                  >
                    Jump to Today
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daily Vitality Index Dial */}
          <div className="flex items-center gap-4 bg-surface-elevated/80 backdrop-blur-md border border-border/80 p-3.5 sm:p-4 rounded-2xl shadow-xs self-start lg:self-auto">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base sm:text-xl font-black font-mono text-foreground leading-none">{healthScore}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">/100</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
                <Lucide.Sparkles size={13} className="text-amber-400" />
                Vitality Score
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {healthScore >= 80 ? '🔥 Optimal Recovery & Hydration' : healthScore >= 50 ? '⚡ Good Progress Today' : '🌱 Drink water & hit nutrition'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Energy: {['Drained', 'Low', 'Moderate', 'High', 'Peak'][(currentData.energyLevel || 3) - 1]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: VITALITY & NUTRITION OS */}
      {activeSubTab === 'vitality' && (
        <div className="space-y-6">
          {/* Hydration OS & Daily Water Level */}
          <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-sky-500/15 text-sky-500 rounded-xl">
                  <Lucide.Droplets size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                    Hydration OS &amp; Daily Water Level
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <span>Target:</span>
                    {isEditingWaterGoal ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="100"
                          value={tempWaterGoal}
                          onChange={e => setTempWaterGoal(e.target.value)}
                          className="w-20 px-2 py-0.5 text-xs bg-surface border border-sky-400 rounded-lg text-foreground font-mono font-black"
                        />
                        <button
                          onClick={() => {
                            const val = parseInt(tempWaterGoal, 10);
                            if (!isNaN(val) && val > 0) {
                              updateCurrentHealth(prev => ({ ...prev, waterGoalMl: val }));
                            }
                            setIsEditingWaterGoal(false);
                          }}
                          className="px-2 py-0.5 bg-sky-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempWaterGoal(String(currentData.waterGoalMl || 2500));
                          setIsEditingWaterGoal(true);
                        }}
                        className="font-bold text-foreground hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                        title="Click to edit daily water goal"
                      >
                        <span>{currentData.waterGoalMl} ml / day</span>
                        <Lucide.Edit size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {waterPct}% Reached
                </span>
              </div>
            </div>

            {/* Water Graphic & Controls */}
            <div className="flex flex-col md:flex-row items-center gap-6 py-2">
              {/* Animated Water Cylinder Vessel */}
              <div className="relative w-32 h-44 bg-surface-elevated/90 border-2 border-sky-500/40 rounded-b-3xl rounded-t-xl overflow-hidden flex items-end justify-center shadow-inner shrink-0">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${waterPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-full bg-gradient-to-t from-sky-600 via-sky-500 to-cyan-400 opacity-85"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-xl font-black font-mono text-foreground drop-shadow-md">
                    {currentData.waterIntakeMl}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                    / {currentData.waterGoalMl} ml
                  </span>
                </div>
              </div>

              {/* Quick Sips & Direct Input */}
              <div className="flex-1 w-full space-y-4">
                {/* 4 Quick Sips Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleAddWater(250)}
                    className="flex flex-col items-center justify-center p-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-2xl text-sky-400 transition-all cursor-pointer active:scale-95 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🥛</span>
                    <span className="text-xs font-black mt-1">+250 ml</span>
                    <span className="text-[9px] text-muted-foreground font-medium">1 Cup / Glass</span>
                  </button>

                  <button
                    onClick={() => handleAddWater(500)}
                    className="flex flex-col items-center justify-center p-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 rounded-2xl text-sky-400 transition-all cursor-pointer active:scale-95 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">💧</span>
                    <span className="text-xs font-black mt-1">+500 ml</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Water Bottle</span>
                  </button>

                  <button
                    onClick={() => handleAddWater(750)}
                    className="flex flex-col items-center justify-center p-3 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 rounded-2xl text-sky-400 transition-all cursor-pointer active:scale-95 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🧪</span>
                    <span className="text-xs font-black mt-1">+750 ml</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Flask / Shaker</span>
                  </button>

                  <button
                    onClick={() => handleAddWater(1000)}
                    className="flex flex-col items-center justify-center p-3 bg-sky-500/25 hover:bg-sky-500/35 border border-sky-500/60 rounded-2xl text-sky-400 transition-all cursor-pointer active:scale-95 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🫗</span>
                    <span className="text-xs font-black mt-1">+1,000 ml</span>
                    <span className="text-[9px] text-muted-foreground font-medium">1 Litre Jug</span>
                  </button>
                </div>

                {/* Custom ml input with quick-fill chips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Add custom ml (e.g. 350)..."
                      value={customWaterMl}
                      onChange={(e) => setCustomWaterMl(e.target.value)}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-sky-400"
                    />
                    <button
                      onClick={() => {
                        const amt = parseInt(customWaterMl, 10);
                        if (!isNaN(amt) && amt > 0) {
                          handleAddWater(amt);
                          setCustomWaterMl('');
                        }
                      }}
                      className="px-4 py-2 bg-sky-500 text-white text-xs font-black rounded-xl shadow-sm hover:bg-sky-600 transition-all cursor-pointer"
                    >
                      Add Water
                    </button>
                    <button
                      onClick={() => handleAddWater(-250)}
                      disabled={currentData.waterIntakeMl <= 0}
                      className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground text-xs font-bold rounded-xl border border-border/60 transition-all cursor-pointer disabled:opacity-40"
                      title="Undo last sip (-250 ml)"
                    >
                      <Lucide.Undo2 size={14} />
                    </button>
                  </div>

                  {/* Quick-fill chips */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <span>Quick ml:</span>
                    {[150, 300, 400, 600].map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleAddWater(amt)}
                        className="px-2 py-0.5 rounded-lg bg-secondary hover:bg-sky-500/20 hover:text-sky-400 transition-all cursor-pointer"
                      >
                        +{amt}ml
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Hydration Velocity Mini Chart */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                7-Day Hydration Velocity
              </span>
              <div className="flex items-end justify-between gap-1.5 h-12 pt-1">
                {past7Days.map((d) => {
                  const heightPct = Math.min(100, Math.round((d.ml / (currentData.waterGoalMl || 2500)) * 100));
                  const isGoalMet = d.ml >= (currentData.waterGoalMl || 2500);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full bg-secondary/60 rounded-t-md relative h-full flex items-end overflow-hidden">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-md transition-all ${isGoalMet ? 'bg-sky-400' : 'bg-sky-500/40'}`}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Nutrition & Calorie Calculator with Interactive Plate */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥗</span>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Daily Calorie Calculator &amp; Plate Visualizer
                </h3>
              </div>

              {/* Edit Calorie Limit Pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Calorie Limit:</span>
                {isEditingCalorieGoal ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="50"
                      value={tempCalorieGoal}
                      onChange={e => setTempCalorieGoal(e.target.value)}
                      className="w-20 px-2 py-0.5 text-xs bg-surface border border-primary rounded-lg text-foreground font-mono font-black"
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(tempCalorieGoal, 10);
                        if (!isNaN(val) && val > 0) {
                          updateCurrentHealth(prev => ({ ...prev, calorieGoal: val }));
                        }
                        setIsEditingCalorieGoal(false);
                      }}
                      className="px-2 py-0.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempCalorieGoal(String(currentData.calorieGoal || 2000));
                      setIsEditingCalorieGoal(true);
                    }}
                    className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-secondary text-foreground hover:text-primary border border-border/80 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{currentData.calorieGoal} kcal</span>
                    <Lucide.Edit size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Plate Visualizer Component */}
            <NutritionPlateVisualizer
              loggedFoods={currentData.loggedFoods}
              calorieGoal={currentData.calorieGoal || 2000}
              onUpdateFood={handleUpdateFood}
              onRemoveFood={handleRemoveFood}
              onOpenAddModal={(defaultMeal) => {
                setAddFoodTargetMeal(defaultMeal || 'lunch');
                setIsAddFoodOpen(true);
              }}
            />
          </div>

          {/* Sleep & Recovery + Energy Rating */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep & Recovery Module */}
            <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
                    <Lucide.Moon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Sleep &amp; Recovery</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Target: {currentData.sleepGoalHours}h optimal</p>
                  </div>
                </div>
                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {currentData.sleepHours} Hours
                </span>
              </div>

              {/* Bedtime & Wake Time Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 bg-secondary/30 p-3.5 rounded-2xl border border-border/50">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Lucide.Bed size={12} className="text-indigo-400" /> Bedtime
                  </label>
                  <input
                    type="time"
                    value={currentData.bedtime || '23:00'}
                    onChange={(e) => handleBedtimeChange(e.target.value)}
                    className="w-full text-xs font-black px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-indigo-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 bg-secondary/30 p-3.5 rounded-2xl border border-border/50">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Lucide.Sun size={12} className="text-amber-400" /> Wake Time
                  </label>
                  <input
                    type="time"
                    value={currentData.wakeTime || '07:00'}
                    onChange={(e) => handleWakeTimeChange(e.target.value)}
                    className="w-full text-xs font-black px-3 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-indigo-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sleep Quality Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Sleep Quality Rating</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['groggy', 'light', 'normal', 'energized', 'rested'] as const).map((q) => {
                    const isSel = currentData.sleepQuality === q;
                    const labels: Record<string, { label: string; icon: string }> = {
                      groggy: { label: 'Groggy', icon: '😴' },
                      light: { label: 'Light', icon: '🥱' },
                      normal: { label: 'Normal', icon: '🙂' },
                      energized: { label: 'Energized', icon: '⚡' },
                      rested: { label: 'Rested', icon: '✨' },
                    };
                    return (
                      <button
                        key={q}
                        onClick={() => updateCurrentHealth(prev => ({ ...prev, sleepQuality: q }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/25'
                            : 'bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary'
                        }`}
                      >
                        <span className="text-sm">{labels[q].icon}</span>
                        <span className="text-[9px] mt-0.5 capitalize truncate max-w-full">{labels[q].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Notes */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Sleep notes (e.g. magnesium, cold room, 8h uninterrupted)..."
                  value={currentData.sleepNotes || ''}
                  onChange={(e) => updateCurrentHealth(prev => ({ ...prev, sleepNotes: e.target.value }))}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Vitality & Daily Energy Rating */}
            <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-500/15 text-amber-500 rounded-xl">
                    <Lucide.Sparkles size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Vitality &amp; Energy</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Daily subjective energy check-in</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border/60 text-[10px] font-bold">
                  <button
                    onClick={() => updateCurrentHealth(prev => ({ ...prev, weightUnit: 'kg' }))}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${currentData.weightUnit === 'kg' ? 'bg-amber-500 text-white' : 'text-muted-foreground'}`}
                  >
                    KG
                  </button>
                  <button
                    onClick={() => updateCurrentHealth(prev => ({ ...prev, weightUnit: 'lbs' }))}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${currentData.weightUnit === 'lbs' ? 'bg-amber-500 text-white' : 'text-muted-foreground'}`}
                  >
                    LBS
                  </button>
                </div>
              </div>

              {/* Energy Level Selector (1-5) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Today's Subjective Energy</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isSel = (currentData.energyLevel || 3) === lvl;
                    const labels = ['Drained', 'Low', 'Moderate', 'High', 'Peak'];
                    return (
                      <button
                        key={lvl}
                        onClick={() => updateCurrentHealth(prev => ({ ...prev, energyLevel: lvl as any }))}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/25'
                            : 'bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary'
                        }`}
                      >
                        <span className="text-base font-black font-mono">{lvl}</span>
                        <span className="text-[9px] mt-0.5 truncate max-w-full">{labels[lvl - 1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Today's Weight Check-in */}
              <div className="space-y-2 bg-secondary/30 p-4 rounded-2xl border border-border/50">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Fast Weight Check ({currentData.weightUnit.toUpperCase()})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75.0"
                    value={currentData.weightKg || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateCurrentHealth(prev => ({ ...prev, weightKg: isNaN(val) ? undefined : val }));
                    }}
                    className="flex-1 text-base font-black font-mono px-4 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                  />
                  <span className="text-sm font-extrabold text-muted-foreground">{currentData.weightUnit}</span>
                </div>
              </div>

              {/* Advice Card */}
              <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-xs text-foreground">
                <Lucide.Sparkles size={16} className="text-primary shrink-0" />
                <p className="font-medium text-[11px] leading-relaxed">
                  Drinking 2.5L+ water and adhering to your daily nutrition plate keeps insulin stable and preserves cognitive velocity all day.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* VIEW 2: DEDICATED DIET & MEAL PLANNER */}
      {activeSubTab === 'diet' && (
        <div className="space-y-6">
          <WeeklyDietPlanner onCopyDayToPlate={handleCopyDietMealsToPlate} />
        </div>
      )}

      {/* VIEW 3: GYM & PRO FITNESS LAB */}
      {activeSubTab === 'gym' && (
        <GymFitnessTab
          currentWeightKg={currentData.weightKg}
          weightUnit={currentData.weightUnit || 'kg'}
          onUpdateWeight={(newW) => updateCurrentHealth(prev => ({ ...prev, weightKg: newW }))}
          onLogWorkoutMinutes={handleLogWorkoutMinutes}
          addXp={addXp}
        />
      )}

      {/* VIEW 3: UNIFIED HEALTH DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <HealthDashboardTab
          healthMap={healthMap}
          currentData={currentData}
          weightUnit={currentData.weightUnit || 'kg'}
          onNavigateToDate={(d) => {
            setSelectedDate(d);
            setActiveSubTab('vitality');
          }}
        />
      )}

      {/* Add Food Modal (Indian Food Database + Custom Food) */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        defaultMeal={addFoodTargetMeal}
        onAddFood={handleAddFood}
      />

      {/* Health Calendar Modal with Daily Micro-Indicators */}
      <HealthCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(newD) => setSelectedDate(newD)}
        healthMap={healthMap}
      />
    </div>
  );
}
