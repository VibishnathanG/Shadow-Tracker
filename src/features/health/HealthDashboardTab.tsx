'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { DailyHealthData } from './HealthFeature';
import { getTodayDateString } from '@/lib/dateUtils';
import {
  getUserBiometrics,
  saveUserBiometrics,
  calculateBMR,
  calculateTDEE,
  calculateProjectedDate,
} from './weightFeasibility';
import {
  calculateDailyMicronutrients,
  getAgeGroupPreset,
  NutrientProgress,
} from './micronutrientData';
import { LoggedFood } from './NutritionPlateVisualizer';

interface HealthDashboardTabProps {
  healthMap: Record<string, DailyHealthData>;
  currentData: DailyHealthData;
  weightUnit: 'kg' | 'lbs';
  onNavigateToDate?: (dateStr: string, targetTab?: 'gym' | 'vitality' | 'diet') => void;
  onAddSupplement?: (supplement: LoggedFood) => void;
  onUpdateWeight?: (weightKg: number) => void;
}

export default function HealthDashboardTab({
  healthMap,
  currentData,
  weightUnit,
  onNavigateToDate,
  onAddSupplement,
  onUpdateWeight,
}: HealthDashboardTabProps) {
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Exercise Calendar Month State
  const [calYear, setCalYear] = useState<number>(() => {
    const p = todayStr.split('-').map(Number);
    return p[0] || new Date().getFullYear();
  });
  const [calMonth, setCalMonth] = useState<number>(() => {
    const p = todayStr.split('-').map(Number);
    return (p[1] || new Date().getMonth() + 1) - 1;
  });
  const [selectedCalDate, setSelectedCalDate] = useState<string>(todayStr);
  const [macroCardView, setMacroCardView] = useState<'macros' | 'vitamins'>('macros');

  // Today's Weight Input & Edit State
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const handleSaveWeight = () => {
    const val = parseFloat(weightInput.trim());
    if (!isNaN(val) && val > 0 && val < 500) {
      if (onUpdateWeight) {
        onUpdateWeight(val);
      }
      saveUserBiometrics({ currentWeightKg: val });
      setIsEditingWeight(false);
      setWeightInput('');
    }
  };

  const prevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const nextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  const jumpToTodayMonth = () => {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
    setSelectedCalDate(todayStr);
  };

  // Month Name Formatted
  const calMonthTitle = useMemo(() => {
    return new Date(calYear, calMonth, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }, [calYear, calMonth]);

  // Workout Streak Calculation (Leading up to today)
  const workoutStreak = useMemo(() => {
    let streak = 0;
    const base = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayData = healthMap[str];
      if (dayData && dayData.workouts && dayData.workouts.length > 0) {
        streak++;
      } else {
        if (i === 0) continue; // Allow today to not be logged yet
        break;
      }
    }
    return streak;
  }, [healthMap]);

  // Stats for the viewed calendar month
  const monthWorkoutStats = useMemo(() => {
    let totalSessions = 0;
    let totalMinutes = 0;
    let totalCalories = 0;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const str = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = healthMap[str];
      if (dayData && dayData.workouts && dayData.workouts.length > 0) {
        totalSessions += dayData.workouts.length;
        totalMinutes += dayData.workouts.reduce((s, w) => s + w.duration, 0);
        totalCalories += dayData.workouts.reduce((s, w) => s + (w.calories || 0), 0);
      }
    }

    return { totalSessions, totalMinutes, totalCalories };
  }, [calYear, calMonth, healthMap]);

  // Calendar Grid Days
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = healthMap[dateStr];
      const isToday = dateStr === todayStr;
      const workouts = dayData?.workouts || [];
      const totalMinutes = workouts.reduce((s, w) => s + w.duration, 0);
      const totalCal = workouts.reduce((s, w) => s + (w.calories || 0), 0);

      days.push({
        empty: false,
        key: dateStr,
        dateStr,
        dayNum: d,
        isToday,
        workouts,
        totalMinutes,
        totalCal,
        hasWorkout: workouts.length > 0,
      });
    }

    return days;
  }, [calYear, calMonth, todayStr, healthMap]);

  // Selected Day Drilldown
  const selectedDayInfo = useMemo(() => {
    const dayData = healthMap[selectedCalDate];
    const workouts = dayData?.workouts || [];
    return {
      dateStr: selectedCalDate,
      workouts,
      hasWorkout: workouts.length > 0,
      totalMinutes: workouts.reduce((s, w) => s + w.duration, 0),
      totalCal: workouts.reduce((s, w) => s + (w.calories || 0), 0),
    };
  }, [selectedCalDate, healthMap]);

  // 14-day chronological health history
  const history14Days = useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayData = healthMap[str];

      const waterMl = dayData?.waterIntakeMl || 0;
      const waterGoal = dayData?.waterGoalMl || 2500;
      const waterMet = waterMl >= waterGoal;

      const totalCal = dayData?.loggedFoods
        ? Math.round(dayData.loggedFoods.reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0))
        : 0;
      const calGoal = dayData?.calorieGoal || 2000;

      const sleepHours = dayData?.sleepHours || 0;
      const energyLevel = dayData?.energyLevel || 3;
      const workoutMins = dayData?.workouts
        ? dayData.workouts.reduce((sum, w) => sum + w.duration, 0)
        : 0;
      const weightKg = dayData?.weightKg || 0;

      list.push({
        date: str,
        dayName,
        isToday: str === todayStr,
        waterMl,
        waterGoal,
        waterMet,
        totalCal,
        calGoal,
        sleepHours,
        energyLevel,
        workoutMins,
        weightKg,
      });
    }
    return list;
  }, [healthMap, todayStr]);

  // Overall Aggregate KPIs
  const kpis = useMemo(() => {
    const validDays = history14Days.filter(d => d.totalCal > 0 || d.waterMl > 0 || d.sleepHours > 0 || d.weightKg > 0);
    const count = Math.max(1, validDays.length);

    const avgCalories = Math.round(validDays.reduce((s, d) => s + d.totalCal, 0) / count);
    const avgWater = Math.round(validDays.reduce((s, d) => s + d.waterMl, 0) / count);
    const avgSleep = Math.round((validDays.reduce((s, d) => s + d.sleepHours, 0) / count) * 10) / 10;
    const waterMetCount = validDays.filter(d => d.waterMet).length;
    const hydrationConsistency = Math.round((waterMetCount / count) * 100);

    const totalWorkoutsMins = validDays.reduce((s, d) => s + d.workoutMins, 0);

    return {
      avgCalories,
      avgWater,
      avgSleep,
      hydrationConsistency,
      totalWorkoutsMins,
      activeTrackingDays: validDays.length,
    };
  }, [history14Days]);

  // Today's Macro Distribution
  const todayMacros = useMemo(() => {
    const foods = currentData.loggedFoods || [];
    const pro = Math.round(foods.reduce((s, f) => s + f.protein * (f.quantity || 1), 0));
    const carb = Math.round(foods.reduce((s, f) => s + f.carbs * (f.quantity || 1), 0));
    const fat = Math.round(foods.reduce((s, f) => s + f.fats * (f.quantity || 1), 0));
    const totalMacroKcal = pro * 4 + carb * 4 + fat * 9;

    return {
      proteinGrams: pro,
      proteinPct: totalMacroKcal > 0 ? Math.round(((pro * 4) / totalMacroKcal) * 100) : 30,
      carbsGrams: carb,
      carbsPct: totalMacroKcal > 0 ? Math.round(((carb * 4) / totalMacroKcal) * 100) : 45,
      fatsGrams: fat,
      fatsPct: totalMacroKcal > 0 ? Math.round(((fat * 9) / totalMacroKcal) * 100) : 25,
    };
  }, [currentData.loggedFoods]);

  // Personalized Biometrics (Reactive to updates across tabs)
  const [biometrics, setBiometrics] = useState(() => getUserBiometrics());

  useEffect(() => {
    const handleUpdate = () => {
      setBiometrics(getUserBiometrics());
    };
    window.addEventListener('shadow_health_updated', handleUpdate);
    return () => window.removeEventListener('shadow_health_updated', handleUpdate);
  }, []);

  // Today's Vitamins & Minerals Micronutrient RDA Profile
  const todayMicros = useMemo(() => {
    const bio = biometrics;
    const sex = bio.sex || 'male';
    const agePreset = getAgeGroupPreset(bio.age || 28);
    const list = calculateDailyMicronutrients(currentData.loggedFoods || [], sex, agePreset);
    
    const vitamins = list.filter(n => n.nutrient.category === 'vitamin');
    const minerals = list.filter(n => n.nutrient.category === 'mineral');

    const avgVitaminPct = Math.round(vitamins.reduce((acc, v) => acc + Math.min(100, v.percentage), 0) / (vitamins.length || 1));
    const avgMineralPct = Math.round(minerals.reduce((acc, m) => acc + Math.min(100, m.percentage), 0) / (minerals.length || 1));
    const overallCoverage = Math.round(list.reduce((acc, item) => acc + Math.min(100, item.percentage), 0) / (list.length || 1));

    const nutrientMap = new Map(list.map(item => [item.nutrient.id, item]));
    const topVitamins = ['vit_c', 'vit_d', 'vit_b12', 'vit_a', 'vit_b6']
      .map(id => nutrientMap.get(id))
      .filter(Boolean) as NutrientProgress[];

    const topMinerals = ['min_zinc', 'min_magnesium', 'min_iron', 'min_calcium', 'min_potassium']
      .map(id => nutrientMap.get(id))
      .filter(Boolean) as NutrientProgress[];

    return {
      list,
      vitamins,
      minerals,
      avgVitaminPct,
      avgMineralPct,
      overallCoverage,
      topVitamins,
      topMinerals,
    };
  }, [currentData.loggedFoods, biometrics]);

  // Metabolic Profile based on current biometrics and recorded weight
  const metabolicProfile = useMemo(() => {
    const cur = currentData.weightKg || biometrics.currentWeightKg || 75;
    const bmr = calculateBMR(cur, biometrics.heightCm, biometrics.age, biometrics.sex);
    const tdee = calculateTDEE(bmr, biometrics.activityLevel);
    const targetDelta = Math.abs((biometrics.targetWeightKg || 70) - cur);
    const weeklyRate = biometrics.preferredWeeklyLossKg || 0.5;
    const daysToGoal = targetDelta > 0 && weeklyRate > 0 ? Math.round((targetDelta / weeklyRate) * 7) : 0;
    const finishDate = daysToGoal > 0 ? calculateProjectedDate(daysToGoal) : 'Goal Met';

    return {
      cur,
      target: biometrics.targetWeightKg || 70,
      targetDelta: Math.round(targetDelta * 10) / 10,
      bmr,
      tdee,
      weeklyRate,
      daysToGoal,
      finishDate,
      sex: biometrics.sex,
      age: biometrics.age,
      heightCm: biometrics.heightCm,
    };
  }, [currentData.weightKg, biometrics]);

  return (
    <div className="space-y-6 transform-gpu">
      {/* Metabolic Baseline & Target Profile Banner - Clean & Responsive */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-elevated/80 border border-emerald-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 text-xl shrink-0">
            🧬
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black uppercase tracking-wider text-foreground">
                Personalized Metabolic Baseline
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Profile: {metabolicProfile.age}y {metabolicProfile.sex === 'male' ? '♂ Male' : '♀ Female'} • {metabolicProfile.heightCm} cm • {metabolicProfile.cur} {weightUnit}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-secondary/70 border border-border/60">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">BMR (Rest)</span>
            <span className="font-black text-amber-400">{metabolicProfile.bmr}</span>
            <span className="text-[9px] text-muted-foreground ml-1">kcal/d</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-secondary/70 border border-border/60">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">TDEE (Burn)</span>
            <span className="font-black text-emerald-400">{metabolicProfile.tdee}</span>
            <span className="text-[9px] text-muted-foreground ml-1">kcal/d</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-secondary/70 border border-border/60">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Chosen Pace</span>
            <span className="font-black text-blue-400">{metabolicProfile.weeklyRate}</span>
            <span className="text-[9px] text-muted-foreground ml-1">kg/wk</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-secondary/70 border border-border/60">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Target Date</span>
            <span className="font-black text-foreground">🎯 {metabolicProfile.finishDate}</span>
          </div>
        </div>
      </div>

      {/* Top Aggregated KPI Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calorie Adherence */}
        <div className="tile settings-tile p-4 sm:p-5 rounded-3xl space-y-2 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Lucide.Flame size={16} />
            </span>
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              14-Day Avg
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-foreground">
              {kpis.avgCalories} <span className="text-xs text-muted-foreground">kcal/d</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Daily Calorie Intake Avg</p>
          </div>
        </div>

        {/* Hydration Consistency */}
        <div className="tile settings-tile p-4 sm:p-5 rounded-3xl space-y-2 border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Lucide.Droplets size={16} />
            </span>
            <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              {kpis.hydrationConsistency}%
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-foreground">
              {kpis.avgWater} <span className="text-xs text-muted-foreground">ml/d</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Average Hydration Volume</p>
          </div>
        </div>

        {/* Sleep Recovery */}
        <div className="tile settings-tile p-4 sm:p-5 rounded-3xl space-y-2 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Lucide.Moon size={16} />
            </span>
            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {kpis.avgSleep >= 7 ? 'Optimal' : 'Deficit'}
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-foreground">
              {kpis.avgSleep} <span className="text-xs text-muted-foreground">hours</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Average Nightly Sleep</p>
          </div>
        </div>

        {/* Workout Activity */}
        <div className="tile settings-tile p-4 sm:p-5 rounded-3xl space-y-2 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Lucide.Dumbbell size={16} />
            </span>
            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Active Time
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-foreground">
              {kpis.totalWorkoutsMins} <span className="text-xs text-muted-foreground">mins</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Total Movement Logged</p>
          </div>
        </div>
      </div>

      {/* 14-Day Calorie & Deficit Velocity Chart */}
      <div className="tile settings-tile p-5 sm:p-7 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
              <Lucide.Activity size={18} />
            </span>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                14-Day Calorie Intake &amp; Adherence Velocity
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Visual history of daily calorie consumption against target limits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> On Target
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Over Limit
            </span>
          </div>
        </div>

        {/* 14-Day Bar Chart */}
        <div className="space-y-2 pt-2">
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-40">
            {history14Days.map(d => {
              const maxScale = Math.max(2500, d.calGoal * 1.3);
              const heightPct = Math.min(100, Math.round((d.totalCal / maxScale) * 100));
              const isOver = d.totalCal > d.calGoal;
              const hasData = d.totalCal > 0;

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  {/* Hover Tooltip Value */}
                  <span className="text-[8.5px] font-mono font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.totalCal} kcal
                  </span>

                  {/* Bar */}
                  <div className="w-full bg-secondary/50 rounded-t-xl relative h-full flex items-end overflow-hidden">
                    {hasData && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`w-full rounded-t-xl transition-all ${
                          isOver
                            ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                            : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Day Label */}
                  <span className={`text-[9px] font-bold ${d.isToday ? 'text-primary font-black' : 'text-muted-foreground'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Macronutrient Distribution & Hydration/Sleep Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Macronutrient Balance Breakdown & Vitamins RDA Profile Tile */}
        <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
                {macroCardView === 'macros' ? <Lucide.PieChart size={18} /> : <Lucide.Sparkles size={18} className="text-emerald-400" />}
              </span>
              <div>
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {macroCardView === 'macros' ? 'Macronutrient Ratio (Today)' : 'Vitamins & Minerals Daily RDA'}
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {macroCardView === 'macros'
                    ? 'Protein, Carbs, and Fats split'
                    : `10 Essential Micronutrients • ${todayMicros.overallCoverage}% Target Met`}
                </p>
              </div>
            </div>

            {/* View Switcher & Supplement Trigger */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-xl border border-border/70 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMacroCardView('macros')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    macroCardView === 'macros'
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Macros
                </button>
                <button
                  type="button"
                  onClick={() => setMacroCardView('vitamins')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    macroCardView === 'vitamins'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>💊 Vitamins RDA</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/25 text-emerald-300 font-mono font-bold">
                    {todayMicros.overallCoverage}%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          {macroCardView === 'macros' ? (
            <div className="space-y-3">
              {/* Tri-Color Stacked Bar */}
              <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex border border-border/60 shadow-inner">
                <div
                  style={{ width: `${todayMacros.proteinPct}%` }}
                  className="h-full bg-sky-400 transition-all"
                  title={`Protein: ${todayMacros.proteinPct}%`}
                />
                <div
                  style={{ width: `${todayMacros.carbsPct}%` }}
                  className="h-full bg-amber-400 transition-all"
                  title={`Carbs: ${todayMacros.carbsPct}%`}
                />
                <div
                  style={{ width: `${todayMacros.fatsPct}%` }}
                  className="h-full bg-rose-400 transition-all"
                  title={`Fats: ${todayMacros.fatsPct}%`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/50 text-center">
                  <span className="text-[10px] font-bold text-sky-400 block">🍗 Protein</span>
                  <span className="text-sm font-black font-mono text-foreground">{todayMacros.proteinGrams}g</span>
                  <span className="text-[9px] text-muted-foreground block">({todayMacros.proteinPct}%)</span>
                </div>

                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/50 text-center">
                  <span className="text-[10px] font-bold text-amber-400 block">🌾 Carbs</span>
                  <span className="text-sm font-black font-mono text-foreground">{todayMacros.carbsGrams}g</span>
                  <span className="text-[9px] text-muted-foreground block">({todayMacros.carbsPct}%)</span>
                </div>

                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/50 text-center">
                  <span className="text-[10px] font-bold text-rose-400 block">🥑 Fats</span>
                  <span className="text-sm font-black font-mono text-foreground">{todayMacros.fatsGrams}g</span>
                  <span className="text-[9px] text-muted-foreground block">({todayMacros.fatsPct}%)</span>
                </div>
              </div>

              {/* Quick teaser button into Vitamins RDA */}
              <button
                type="button"
                onClick={() => setMacroCardView('vitamins')}
                className="w-full mt-1 p-2.5 bg-secondary/30 hover:bg-secondary/60 rounded-2xl border border-border/60 flex items-center justify-between text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm p-1 rounded-lg bg-emerald-500/15">💊</span>
                  <span className="font-bold text-foreground">Vitamins &amp; Minerals Daily RDA</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                    {todayMicros.overallCoverage}% Met
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>View Full Profile</span>
                  <Lucide.ChevronRight size={13} />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary/40 p-2.5 rounded-2xl border border-border/50">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Total RDA Met</span>
                  <span className={`text-base font-black font-mono ${todayMicros.overallCoverage >= 80 ? 'text-emerald-400' : todayMicros.overallCoverage >= 45 ? 'text-sky-400' : 'text-amber-400'}`}>
                    {todayMicros.overallCoverage}%
                  </span>
                  <span className="text-[8.5px] font-bold text-muted-foreground block mt-0.5">
                    {todayMicros.overallCoverage >= 80 ? '✨ Optimal' : todayMicros.overallCoverage >= 45 ? '⚡ In Progress' : '🌱 Needs Boost'}
                  </span>
                </div>
                <div className="bg-secondary/40 p-2.5 rounded-2xl border border-border/50">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">🍊 Vitamins Avg</span>
                  <span className="text-base font-black font-mono text-foreground">
                    {todayMicros.avgVitaminPct}%
                  </span>
                  <span className="text-[8.5px] font-bold text-muted-foreground block mt-0.5">Immunity &amp; Focus</span>
                </div>
                <div className="bg-secondary/40 p-2.5 rounded-2xl border border-border/50">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">🛡️ Minerals Avg</span>
                  <span className="text-base font-black font-mono text-foreground">
                    {todayMicros.avgMineralPct}%
                  </span>
                  <span className="text-[8.5px] font-bold text-muted-foreground block mt-0.5">Bones &amp; Muscle</span>
                </div>
              </div>

              {/* Dual-Column Micronutrient Profile: Left = 5 Vitamins, Right = 5 Minerals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Column 1: Essential Vitamins */}
                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <span>🍊</span> Essential Vitamins
                  </span>
                  <div className="space-y-2">
                    {todayMicros.topVitamins.map(item => {
                      const barPct = Math.min(100, item.percentage);
                      const isOptimal = item.percentage >= 80;
                      const isModerate = item.percentage >= 45;
                      const color = isOptimal ? 'from-emerald-500 to-teal-400' : isModerate ? 'from-sky-500 to-cyan-400' : 'from-amber-500 to-yellow-400';
                      const textCol = isOptimal ? 'text-emerald-400' : isModerate ? 'text-sky-400' : 'text-amber-400';

                      return (
                        <div key={item.nutrient.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-foreground truncate max-w-[60%]">
                              <span>{item.nutrient.icon}</span>
                              <span className="truncate">{item.nutrient.name.split('(')[0].trim()}</span>
                            </span>
                            <div className="flex items-center gap-1.5 font-mono shrink-0">
                              <span className="text-muted-foreground text-[10px]">
                                {item.amount}/{item.target}{item.nutrient.unit}
                              </span>
                              <span className={`text-[10.5px] font-black ${textCol} min-w-[34px] text-right`}>
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border/40">
                            <div
                              style={{ width: `${barPct}%` }}
                              className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Essential Minerals */}
                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <span>🛡️</span> Essential Minerals
                  </span>
                  <div className="space-y-2">
                    {todayMicros.topMinerals.map(item => {
                      const barPct = Math.min(100, item.percentage);
                      const isOptimal = item.percentage >= 80;
                      const isModerate = item.percentage >= 45;
                      const color = isOptimal ? 'from-emerald-500 to-teal-400' : isModerate ? 'from-sky-500 to-cyan-400' : 'from-amber-500 to-yellow-400';
                      const textCol = isOptimal ? 'text-emerald-400' : isModerate ? 'text-sky-400' : 'text-amber-400';

                      return (
                        <div key={item.nutrient.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-foreground truncate max-w-[60%]">
                              <span>{item.nutrient.icon}</span>
                              <span className="truncate">{item.nutrient.name.split('(')[0].trim()}</span>
                            </span>
                            <div className="flex items-center gap-1.5 font-mono shrink-0">
                              <span className="text-muted-foreground text-[10px]">
                                {item.amount}/{item.target}{item.nutrient.unit}
                              </span>
                              <span className={`text-[10.5px] font-black ${textCol} min-w-[34px] text-right`}>
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border/40">
                            <div
                              style={{ width: `${barPct}%` }}
                              className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-end pt-1 border-t border-border/50 text-xs">
                <button
                  type="button"
                  onClick={() => setMacroCardView('macros')}
                  className="text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                >
                  ← Back to Macros Split
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Module B: Hydration & Sleep Correlation */}
        <div className="tile settings-tile p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
                <Lucide.Sparkles size={18} />
              </span>
              <div>
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Biological Habits Velocity
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium">Hydration volume vs sleep stability</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* 7-day Hydration vs Goal */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Lucide.Droplets size={12} className="text-sky-400" /> Today's Hydration
                </span>
                <span className="font-mono text-foreground">
                  {currentData.waterIntakeMl} / {currentData.waterGoalMl || 2500} ml
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.round((currentData.waterIntakeMl / (currentData.waterGoalMl || 2500)) * 100))}%`,
                  }}
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                />
              </div>
            </div>

            {/* Sleep Target */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Lucide.Moon size={12} className="text-indigo-400" /> Sleep Duration
                </span>
                <span className="font-mono text-foreground">
                  {currentData.sleepHours} / {currentData.sleepGoalHours || 8} hours
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.round((currentData.sleepHours / (currentData.sleepGoalHours || 8)) * 100))}%`,
                  }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
                />
              </div>
            </div>

            {/* Today's Weight & Target Goal */}
            <div className="space-y-1.5 p-3 bg-secondary/30 hover:bg-secondary/40 transition-all rounded-2xl border border-border/60">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Lucide.Scale size={13} className="text-emerald-400" />
                  <span>Today's Weight</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {currentData.weightKg ? (
                    <>
                      <span className="font-mono text-foreground font-extrabold text-sm">
                        {currentData.weightKg} <span className="text-xs font-medium text-muted-foreground">{weightUnit}</span>
                      </span>
                      {biometrics.targetWeightKg ? (
                        <span className="text-[11px] text-muted-foreground font-normal">
                          / Goal: <span className="font-mono font-bold text-foreground">{biometrics.targetWeightKg}</span> {weightUnit}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium italic">
                      Not logged today {biometrics.targetWeightKg ? `(Goal: ${biometrics.targetWeightKg} ${weightUnit})` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar towards goal */}
              {currentData.weightKg && biometrics.targetWeightKg ? (() => {
                const cur = currentData.weightKg;
                const target = biometrics.targetWeightKg;
                const diff = cur - target;
                const isAtGoal = Math.abs(diff) < 0.2;
                const closenessPct = Math.min(100, Math.max(5, Math.round((Math.min(cur, target) / Math.max(cur, target)) * 100)));

                return (
                  <div className="space-y-1 pt-0.5">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        style={{ width: `${isAtGoal ? 100 : closenessPct}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        {isAtGoal ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Lucide.CheckCircle2 size={11} /> Target Goal Reached!
                          </span>
                        ) : diff > 0 ? (
                          <span>
                            <span className="font-mono font-bold text-emerald-400">{(diff).toFixed(1)} {weightUnit}</span> to target goal
                          </span>
                        ) : (
                          <span>
                            <span className="font-mono font-bold text-teal-400">{Math.abs(diff).toFixed(1)} {weightUnit}</span> under target goal
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-muted-foreground/80 font-bold">
                        {isAtGoal ? '100%' : `${closenessPct}% match`}
                      </span>
                    </div>
                  </div>
                );
              })() : null}
            </div>

            {/* Quick Status Pill */}
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 flex items-center justify-between text-xs pt-2">
              <span className="text-muted-foreground font-medium">Tracking Status:</span>
              <span className="font-bold text-foreground">
                {kpis.activeTrackingDays} Days Active in History
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise & Workout Activity Calendar (Bottom of Dashboard) */}
      <div className="tile settings-tile p-5 sm:p-7 rounded-3xl space-y-6">
        {/* Header with Navigation & Streak */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Lucide.Dumbbell size={22} />
            </span>
            <div>
              <h3 className="text-sm sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span>Exercise &amp; Workout Activity Calendar</span>
                <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                  Cadence &amp; Streaks
                </span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Monthly workout history, training splits, session durations, and active exercise consistency.
              </p>
            </div>
          </div>

          {/* Month Navigation & Today Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-secondary/80 rounded-xl border border-border/70 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={prevCalMonth}
                className="p-1.5 hover:bg-surface rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Previous Month"
              >
                <Lucide.ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 font-mono font-black text-foreground min-w-[130px] text-center">
                {calMonthTitle}
              </span>
              <button
                type="button"
                onClick={nextCalMonth}
                className="p-1.5 hover:bg-surface rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Next Month"
              >
                <Lucide.ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={jumpToTodayMonth}
              className="text-xs font-bold px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl border border-primary/20 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>

        {/* Workout Activity Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-secondary/40 rounded-2xl border border-border/50 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <span>🔥 Active Streak</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-mono text-amber-400">{workoutStreak}</span>
              <span className="text-xs font-bold text-muted-foreground">Days</span>
            </div>
            <span className="text-[9.5px] text-muted-foreground">Consecutive workout sessions</span>
          </div>

          <div className="p-3.5 bg-secondary/40 rounded-2xl border border-border/50 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <span>🏋️ This Month</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-mono text-foreground">{monthWorkoutStats.totalSessions}</span>
              <span className="text-xs font-bold text-muted-foreground">Sessions</span>
            </div>
            <span className="text-[9.5px] text-muted-foreground">Logged gym &amp; cardio splits</span>
          </div>

          <div className="p-3.5 bg-secondary/40 rounded-2xl border border-border/50 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <span>⏱️ Total Active Time</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-mono text-sky-400">{monthWorkoutStats.totalMinutes}</span>
              <span className="text-xs font-bold text-muted-foreground">Mins</span>
            </div>
            <span className="text-[9.5px] text-muted-foreground">Cumulative training time</span>
          </div>

          <div className="p-3.5 bg-secondary/40 rounded-2xl border border-border/50 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <span>⚡ Est. Burned</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-mono text-rose-400">{monthWorkoutStats.totalCalories}</span>
              <span className="text-xs font-bold text-muted-foreground">kcal</span>
            </div>
            <span className="text-[9.5px] text-muted-foreground">Total energy expended</span>
          </div>
        </div>

        {/* 7-Day Weekday Labels & Monthly Grid */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider py-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="truncate">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarGridDays.map(d => {
              if (d.empty) {
                return (
                  <div
                    key={d.key}
                    className="min-h-[52px] sm:min-h-[76px] rounded-xl sm:rounded-2xl bg-secondary/15 border border-transparent"
                  />
                );
              }

              const isSelected = d.dateStr === selectedCalDate;

              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    if (d.dateStr) setSelectedCalDate(d.dateStr);
                  }}
                  className={`min-h-[52px] sm:min-h-[76px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left group overflow-hidden ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : d.isToday
                      ? 'bg-primary/10 border-primary/40'
                      : d.hasWorkout
                      ? 'bg-secondary/70 border-border/70 hover:border-amber-400/50'
                      : 'bg-secondary/30 border-border/40 hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-black ${
                        d.isToday ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {d.dayNum}
                    </span>
                    {d.isToday && (
                      <>
                        <span className="hidden sm:inline text-[8.5px] font-black uppercase text-primary tracking-tight">Today</span>
                        <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" title="Today" />
                      </>
                    )}
                  </div>

                  {d.hasWorkout ? (
                    <div className="space-y-0.5 sm:space-y-1 pt-1 overflow-hidden w-full">
                      <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8.5px] sm:text-[9.5px] font-black font-mono truncate shadow-2xs">
                        <span className="shrink-0 text-[9px]">🏋️</span>
                        <span className="truncate">{d.totalMinutes}m</span>
                      </div>
                      <span className="text-[7.5px] sm:text-[8.5px] font-medium text-muted-foreground block truncate">
                        {d.workouts[0]?.notes ? d.workouts[0].notes.split('-')[0] : `${d.workouts.length} workout`}
                      </span>
                    </div>
                  ) : (
                    <div className="pt-1 sm:pt-2 overflow-hidden w-full">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground/50 font-medium block truncate">Rest</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Workout Details Drawer / Preview */}
        <div className="p-4 sm:p-5 bg-secondary/40 rounded-2xl border border-border/70 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/15 text-amber-400 rounded-xl">
                <Lucide.Calendar size={15} />
              </span>
              <h4 className="text-xs sm:text-sm font-black text-foreground">
                Workout Activity for {new Date(`${selectedDayInfo.dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h4>
            </div>

            {onNavigateToDate && (
              <button
                type="button"
                onClick={() => onNavigateToDate(selectedDayInfo.dateStr, 'gym')}
                className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Jump to this date in Gym Lab</span>
                <Lucide.ChevronRight size={13} />
              </button>
            )}
          </div>

          {selectedDayInfo.hasWorkout ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground flex-wrap">
                <span>Total Sessions: <strong className="text-foreground font-mono">{selectedDayInfo.workouts.length}</strong></span>
                <span>Total Duration: <strong className="text-sky-400 font-mono">{selectedDayInfo.totalMinutes} mins</strong></span>
                <span>Estimated Burn: <strong className="text-rose-400 font-mono">{selectedDayInfo.totalCal} kcal</strong></span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {selectedDayInfo.workouts.map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="p-3 bg-surface rounded-xl border border-border/60 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl p-1.5 bg-secondary rounded-xl shrink-0">
                        {w.type === 'gym' ? '🏋️‍♂️' : w.type === 'cardio' ? '🏃' : '⚡'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-foreground truncate">
                          {w.notes || `${w.type.toUpperCase()} Training`}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {w.time && `${w.time} • `}{w.duration} mins • Intensity: <span className="text-amber-400 font-bold capitalize">{w.intensity}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-rose-400 block">
                        {w.calories || Math.round(w.duration * 5.5)} kcal
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold">Burned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface/50 rounded-xl border border-border/40 text-center space-y-1">
              <p className="text-xs font-bold text-muted-foreground">
                💤 Rest &amp; Recovery Day (No workouts recorded)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Rest days allow muscular repair, glycogen replenishment, and CNS recovery.
              </p>
            </div>
          )}
        </div>

        {/* Selected Day Bio, Sleep, Hydration & Nutrition Overview */}
        {(() => {
          const selectedDayHealth = healthMap[selectedDayInfo.dateStr] || (selectedDayInfo.dateStr === todayStr ? currentData : null);
          const selHydration = selectedDayHealth?.waterIntakeMl || 0;
          const selHydrationGoal = selectedDayHealth?.waterGoalMl || 2500;
          const selSleep = selectedDayHealth?.sleepHours || 0;
          const selSleepGoal = selectedDayHealth?.sleepGoalHours || 8;
          const selSleepQuality = selectedDayHealth?.sleepQuality;
          const selWeight = selectedDayHealth?.weightKg;
          const selFoods = selectedDayHealth?.loggedFoods || [];
          const selCalories = selFoods.reduce((acc, f) => acc + (f.calories || 0), 0);
          const selCalorieGoal = selectedDayHealth?.calorieGoal || metabolicProfile.tdee || 2000;
          const selProtein = Math.round(selFoods.reduce((acc, f) => acc + (f.protein || 0), 0));
          const selCarbs = Math.round(selFoods.reduce((acc, f) => acc + (f.carbs || 0), 0));
          const selFats = Math.round(selFoods.reduce((acc, f) => acc + (f.fats || 0), 0));

          // Calculate micronutrients / vitamins RDA
          const selMicros = calculateDailyMicronutrients(selFoods, biometrics.sex || 'male', 'adult');
          const selRdaPct = selMicros.length > 0 
            ? Math.round(selMicros.reduce((acc, m) => acc + m.percentage, 0) / selMicros.length)
            : 0;

          return (
            <div className="p-4 sm:p-5 bg-secondary/40 rounded-2xl border border-border/70 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/15 text-sky-400 rounded-xl">
                    <Lucide.Activity size={15} />
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    Health, Sleep &amp; Nutrition Overview for {new Date(`${selectedDayInfo.dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>
                </div>

                {onNavigateToDate && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDate(selectedDayInfo.dateStr, 'diet')}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Jump to Nutrition Plate</span>
                    <Lucide.ChevronRight size={13} />
                  </button>
                )}
              </div>

              {/* 4 Core Pillars: Hydration, Sleep, Weight, Calorie Intake/Limit */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Hydration */}
                <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Lucide.Droplets size={12} className="text-sky-400" /> Hydration
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-400">
                      {Math.round((selHydration / selHydrationGoal) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black font-mono text-foreground">{selHydration}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">/ {selHydrationGoal} ml</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((selHydration / selHydrationGoal) * 100))}%` }}
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>

                {/* 2. Sleep */}
                <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Lucide.Moon size={12} className="text-indigo-400" /> Sleep
                    </span>
                    {selSleepQuality && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold capitalize">
                        {selSleepQuality}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black font-mono text-foreground">{selSleep}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">/ {selSleepGoal} hrs</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((selSleep / selSleepGoal) * 100))}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
                    />
                  </div>
                </div>

                {/* 3. Weight */}
                <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Lucide.Scale size={12} className="text-emerald-400" /> Weight
                    </span>
                    {biometrics.targetWeightKg && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Goal: {biometrics.targetWeightKg}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black font-mono text-foreground">
                      {selWeight ? `${selWeight}` : '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {selWeight ? weightUnit : 'not logged'}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-muted-foreground font-medium truncate">
                    {selWeight && biometrics.targetWeightKg ? (
                      selWeight === biometrics.targetWeightKg
                        ? 'Target achieved 🎯'
                        : `${Math.abs(selWeight - biometrics.targetWeightKg).toFixed(1)} ${weightUnit} to goal`
                    ) : (
                      'Daily checkpoint'
                    )}
                  </div>
                </div>

                {/* 4. Calorie Intake / Limit */}
                <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Lucide.Flame size={12} className="text-amber-400" /> Calories
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {Math.round((selCalories / selCalorieGoal) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black font-mono text-foreground">{selCalories}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">/ {selCalorieGoal} kcal</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.round((selCalories / selCalorieGoal) * 100))}%` }}
                      className={`h-full rounded-full ${
                        selCalories > selCalorieGoal
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Macros (Protein, Carbs, Fat) & Vitamin/Micronutrient Overview */}
              <div className="p-3.5 bg-surface/70 rounded-xl border border-border/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lucide.Utensils size={13} className="text-primary" />
                    <span>Macronutrients &amp; Vitamins Split ({selFoods.length} logged items)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    ✨ {selRdaPct}% Daily Micronutrients RDA Met
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-secondary/50 rounded-lg border border-border/40">
                    <span className="text-[9.5px] font-bold text-sky-400 uppercase tracking-tight block">🍗 Protein</span>
                    <span className="text-xs sm:text-sm font-black font-mono text-foreground">{selProtein}g</span>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-lg border border-border/40">
                    <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-tight block">🌾 Carbs</span>
                    <span className="text-xs sm:text-sm font-black font-mono text-foreground">{selCarbs}g</span>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-lg border border-border/40">
                    <span className="text-[9.5px] font-bold text-rose-400 uppercase tracking-tight block">🥑 Fats</span>
                    <span className="text-xs sm:text-sm font-black font-mono text-foreground">{selFats}g</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
