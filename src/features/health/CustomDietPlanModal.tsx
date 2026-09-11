'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  WeeklyDietPlan,
  DietDay,
  DietMeal,
  PRESET_DIET_PLANS,
  saveCustomDietPlan,
} from './dietPlansData';
import confetti from 'canvas-confetti';

interface CustomDietPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (newPlan: WeeklyDietPlan) => void;
  initialPlan?: WeeklyDietPlan | null;
}

const LOCALITY_OPTIONS: { id: WeeklyDietPlan['locality']; label: string; icon: string }[] = [
  { id: 'tamilnadu', label: 'Tamil Nadu', icon: '🌴' },
  { id: 'telugu', label: 'Telugu (AP & TS)', icon: '🌶️' },
  { id: 'kannada', label: 'Kannada (KA)', icon: '🌾' },
  { id: 'south_general', label: 'South Indian', icon: '🥥' },
  { id: 'north', label: 'North Indian', icon: '🫓' },
  { id: 'western', label: 'Western & Global', icon: '🥑' },
  { id: 'custom', label: 'Custom Regional', icon: '⭐' },
];

const DIET_TYPES: WeeklyDietPlan['dietType'][] = [
  'Non-Veg',
  'Veg',
  'Eggitarian',
  'Vegan',
  'Keto',
  'Millets',
];

const QUICK_ICONS = ['🥗', '🥥', '🍗', '🥑', '🌾', '🍳', '🥩', '🍱', '🍵', '⚡', '🥪', '🥣'];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_TYPE_OPTIONS: { id: DietMeal['mealType']; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'snack_morning', label: 'Morning Snack', icon: '🍏' },
  { id: 'lunch', label: 'Lunch', icon: '☀️' },
  { id: 'snack_evening', label: 'Evening Snack', icon: '☕' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
];

export default function CustomDietPlanModal({
  isOpen,
  onClose,
  onPlanCreated,
  initialPlan,
}: CustomDietPlanModalProps) {
  // Plan Metadata
  const [name, setName] = useState(initialPlan?.name || '');
  const [tagline, setTagline] = useState(initialPlan?.tagline || 'Targeted 7-day nutritional blueprint for sustainable fat loss');
  const [locality, setLocality] = useState<WeeklyDietPlan['locality']>(initialPlan?.locality || 'custom');
  const [dietType, setDietType] = useState<WeeklyDietPlan['dietType']>(initialPlan?.dietType || 'Veg');
  const [weeklyLossKg, setWeeklyLossKg] = useState<number>(initialPlan?.weeklyLossKg || 0.5);
  const [icon, setIcon] = useState(initialPlan?.icon || '🥗');

  // Days initialization
  const [days, setDays] = useState<DietDay[]>(() => {
    if (initialPlan?.days && initialPlan.days.length === 7) {
      return initialPlan.days;
    }
    // Default 7-day shell
    return DAY_NAMES.map((dayName, idx) => ({
      dayName,
      focus: idx % 2 === 0 ? 'High Protein & Lean Fuel' : 'Gut Health & High Fiber',
      totalCalories: 1550,
      totalProtein: 105,
      totalCarbs: 150,
      totalFats: 45,
      meals: [
        {
          mealType: 'breakfast',
          name: 'Balanced Protein Breakfast',
          items: ['2 Idlis or 1 bowl Oats with Chia', '1 cup Sambar or Protein shake', '1 cup Green tea'],
          portion: '1 plate',
          calories: 380,
          protein: 22,
          carbs: 55,
          fats: 8,
          icon: '🌅',
          tips: 'Hydrate with 500ml water 15 minutes before meal',
        },
        {
          mealType: 'lunch',
          name: 'Lean Macro Lunch Plate',
          items: ['1 cup Brown/Red rice or 2 Phulkas', '1 cup Dal or Grilled Protein', '1 large bowl Cucumber & Sprout salad'],
          portion: '1 regular plate',
          calories: 550,
          protein: 38,
          carbs: 65,
          fats: 14,
          icon: '☀️',
          tips: 'Eat fiber and salad first before carbs',
        },
        {
          mealType: 'dinner',
          name: 'Light Recovery Dinner',
          items: ['Steamed veggies with grilled paneer or tofu or chicken soup', 'Warm turmeric milk or Chamomile tea'],
          portion: '1 bowl',
          calories: 420,
          protein: 30,
          carbs: 25,
          fats: 15,
          icon: '🌙',
          tips: 'Finish dinner at least 2.5 hours before bedtime',
        },
      ],
    }));
  });

  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Inline Meal Editor State
  const [editingMealIdx, setEditingMealIdx] = useState<number | null>(null);
  const [mealType, setMealType] = useState<DietMeal['mealType']>('breakfast');
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState('');
  const [mealPortion, setMealPortion] = useState('1 plate');
  const [mealCalories, setMealCalories] = useState<number>(350);
  const [mealProtein, setMealProtein] = useState<number>(20);
  const [mealCarbs, setMealCarbs] = useState<number>(45);
  const [mealFats, setMealFats] = useState<number>(10);
  const [mealIcon, setMealIcon] = useState('🥗');
  const [mealTips, setMealTips] = useState('');
  const [isAddingMeal, setIsAddingMeal] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const currentDay = days[activeDayIdx] || days[0];

  // Recalculate Day totals helper
  const updateDayTotals = (meals: DietMeal[]) => {
    return {
      totalCalories: meals.reduce((acc, m) => acc + (m.calories || 0), 0),
      totalProtein: meals.reduce((acc, m) => acc + (m.protein || 0), 0),
      totalCarbs: meals.reduce((acc, m) => acc + (m.carbs || 0), 0),
      totalFats: meals.reduce((acc, m) => acc + (m.fats || 0), 0),
    };
  };

  // Clone from Preset
  const handleCloneFromPreset = (presetId: string) => {
    const found = PRESET_DIET_PLANS.find(p => p.id === presetId);
    if (!found) return;
    setName(`${found.name} (Custom)`);
    setTagline(found.tagline);
    setLocality(found.locality);
    setDietType(found.dietType);
    setWeeklyLossKg(found.weeklyLossKg);
    setIcon(found.icon);
    setDays(JSON.parse(JSON.stringify(found.days)));
  };

  // Reset meal form
  const resetMealForm = () => {
    setMealType('breakfast');
    setMealName('');
    setMealItems('');
    setMealPortion('1 plate');
    setMealCalories(350);
    setMealProtein(20);
    setMealCarbs(45);
    setMealFats(10);
    setMealIcon('🥗');
    setMealTips('');
    setEditingMealIdx(null);
    setIsAddingMeal(false);
  };

  // Open Add Meal form
  const handleOpenAddMeal = () => {
    resetMealForm();
    setIsAddingMeal(true);
  };

  // Open Edit Meal form
  const handleOpenEditMeal = (mIdx: number) => {
    const m = currentDay.meals[mIdx];
    if (!m) return;
    setMealType(m.mealType);
    setMealName(m.name);
    setMealItems(m.items.join('\n'));
    setMealPortion(m.portion);
    setMealCalories(m.calories);
    setMealProtein(m.protein);
    setMealCarbs(m.carbs);
    setMealFats(m.fats);
    setMealIcon(m.icon || '🥗');
    setMealTips(m.tips || '');
    setEditingMealIdx(mIdx);
    setIsAddingMeal(true);
  };

  // Save Meal to active day
  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const itemsArray = mealItems
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const savedMeal: DietMeal = {
      mealType,
      name: mealName.trim(),
      items: itemsArray.length > 0 ? itemsArray : [mealName.trim()],
      portion: mealPortion.trim() || '1 serving',
      calories: Math.max(0, Number(mealCalories) || 0),
      protein: Math.max(0, Number(mealProtein) || 0),
      carbs: Math.max(0, Number(mealCarbs) || 0),
      fats: Math.max(0, Number(mealFats) || 0),
      icon: mealIcon || '🥗',
      tips: mealTips.trim() || undefined,
    };

    setDays(prev =>
      prev.map((d, i) => {
        if (i !== activeDayIdx) return d;
        let newMeals = [...d.meals];
        if (editingMealIdx !== null) {
          newMeals[editingMealIdx] = savedMeal;
        } else {
          newMeals.push(savedMeal);
        }
        const totals = updateDayTotals(newMeals);
        return {
          ...d,
          meals: newMeals,
          ...totals,
        };
      })
    );

    resetMealForm();
  };

  // Remove Meal from active day
  const handleRemoveMeal = (mIdx: number) => {
    setDays(prev =>
      prev.map((d, i) => {
        if (i !== activeDayIdx) return d;
        const newMeals = d.meals.filter((_, idx) => idx !== mIdx);
        const totals = updateDayTotals(newMeals);
        return {
          ...d,
          meals: newMeals,
          ...totals,
        };
      })
    );
  };

  // Update Day Focus
  const handleUpdateDayFocus = (newFocus: string) => {
    setDays(prev =>
      prev.map((d, i) => (i === activeDayIdx ? { ...d, focus: newFocus } : d))
    );
  };

  // Calculate whole-week daily averages
  const avgCalories = Math.round(
    days.reduce((acc, d) => acc + (d.totalCalories || 0), 0) / (days.length || 1)
  );
  const avgProtein = Math.round(
    days.reduce((acc, d) => acc + (d.totalProtein || 0), 0) / (days.length || 1)
  );
  const avgCarbs = Math.round(
    days.reduce((acc, d) => acc + (d.totalCarbs || 0), 0) / (days.length || 1)
  );
  const avgFats = Math.round(
    days.reduce((acc, d) => acc + (d.totalFats || 0), 0) / (days.length || 1)
  );

  // Save full diet plan
  const handleSavePlan = () => {
    if (!name.trim()) return;

    const locObj = LOCALITY_OPTIONS.find(l => l.id === locality);
    const localityLabel = locObj ? `${locObj.icon} ${locObj.label}` : '⭐ Custom Regional';

    const fullPlan: WeeklyDietPlan = {
      id: initialPlan?.id || `custom_diet_${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || 'Custom targeted 7-day nutritional blueprint',
      locality,
      localityLabel,
      targetWeightLossRate: `${weeklyLossKg} kg / week`,
      weeklyLossKg,
      avgDailyCalories: avgCalories,
      avgDailyProtein: avgProtein,
      avgDailyCarbs: avgCarbs,
      avgDailyFats: avgFats,
      dietType,
      icon: icon || '🥗',
      colorClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/40',
      isCustom: true,
      days,
    };

    saveCustomDietPlan(fullPlan);
    onPlanCreated(fullPlan);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

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
        className="fixed inset-0 bg-black/85"
      />

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-4xl bg-surface-elevated border border-border/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden my-auto z-10 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0 text-2xl">
              {icon}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {initialPlan ? 'Edit Custom Weekly Diet Plan' : 'Create Custom Weekly Diet Plan'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Design 7-day meal schedules, calorie limits &amp; macro targets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
          >
            <Lucide.X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-0">
          {/* Preset quick starter */}
          {!initialPlan && (
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Lucide.Sparkles size={14} className="text-amber-400" />
                <span>Need a head start? Clone from an existing 26+ regional preset:</span>
              </div>
              <select
                onChange={e => {
                  if (e.target.value) handleCloneFromPreset(e.target.value);
                }}
                className="text-xs bg-surface border border-border rounded-xl px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none focus:border-emerald-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a preset to clone...
                </option>
                {PRESET_DIET_PLANS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.localityLabel} • {p.name} ({p.avgDailyCalories} kcal)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plan Metadata Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Plan Title &amp; Focus *
              </label>
              <input
                type="text"
                maxLength={80}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tamil Nadu Lean Cut & Millets Shred"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:border-emerald-500"
              />
              {name.length >= 80 && (
                <span className="text-[10px] text-amber-500 font-semibold block animate-fadeIn">
                  Plan title limit reached (80/80)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Icon Emoji
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_ICONS.slice(0, 7).map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      icon === ic
                        ? 'bg-emerald-500/20 border border-emerald-500 scale-110'
                        : 'bg-surface border border-border hover:bg-secondary'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Tagline / Nutritional Strategy
              </label>
              <input
                type="text"
                maxLength={150}
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. High fiber keerai & sambar, egg white dosa, brown rice lunch"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-emerald-500"
              />
              {tagline.length >= 150 && (
                <span className="text-[10px] text-amber-500 font-semibold block animate-fadeIn">
                  Tagline limit reached (150/150)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Locality / Cuisine
              </label>
              <select
                value={locality}
                onChange={e => setLocality(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
              >
                {LOCALITY_OPTIONS.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Dietary Preference
              </label>
              <select
                value={dietType}
                onChange={e => setDietType(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
              >
                {DIET_TYPES.map(dt => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Weekly Loss Target (kg/wk)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.5"
                  value={weeklyLossKg}
                  onChange={e => setWeeklyLossKg(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] font-semibold text-muted-foreground shrink-0">kg / wk</span>
              </div>
            </div>
          </div>

          {/* 7-Day Selector */}
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Lucide.Calendar size={14} className="text-emerald-400" />
                7-Day Weekly Schedule
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                Day {activeDayIdx + 1} of 7 • {currentDay.dayName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {days.map((day, idx) => {
                const isActive = activeDayIdx === idx;
                return (
                  <button
                    key={day.dayName}
                    type="button"
                    onClick={() => {
                      setActiveDayIdx(idx);
                      resetMealForm();
                    }}
                    className={`flex-1 min-w-[90px] py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-sm'
                        : 'bg-surface/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="text-[11px] font-bold leading-tight">{day.dayName.slice(0, 3)}</div>
                    <div className="text-[9px] font-mono opacity-80">{day.totalCalories} kcal</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Card */}
          <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-4">
            {/* Day Header & Focus Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {currentDay.dayName}
                  </span>
                  <input
                    type="text"
                    value={currentDay.focus}
                    onChange={e => handleUpdateDayFocus(e.target.value)}
                    placeholder="Day focus (e.g. Lean Protein & Gut Cleanse)"
                    className="text-xs font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 px-1 py-0.5 focus:outline-none flex-1"
                  />
                </div>
              </div>

              {/* Day Macro Summary Pills */}
              <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {currentDay.totalCalories} kcal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  P: {currentDay.totalProtein}g
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  C: {currentDay.totalCarbs}g
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  F: {currentDay.totalFats}g
                </span>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-2.5">
              {currentDay.meals.map((meal, mIdx) => {
                const typeObj = MEAL_TYPE_OPTIONS.find(t => t.id === meal.mealType) || MEAL_TYPE_OPTIONS[0];
                return (
                  <div
                    key={mIdx}
                    className="p-3 bg-surface rounded-xl border border-border/70 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-border transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="text-xl p-1.5 rounded-lg bg-secondary shrink-0">
                        {meal.icon || typeObj.icon}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {typeObj.label}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-foreground">{meal.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium">({meal.portion})</span>
                        </div>

                        {meal.items && meal.items.length > 0 && (
                          <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                            {meal.items.map((item, itIdx) => (
                              <li key={itIdx}>{item}</li>
                            ))}
                          </ul>
                        )}

                        {meal.tips && (
                          <div className="text-[10px] text-emerald-400/90 italic flex items-center gap-1 mt-1">
                            <Lucide.Info size={10} />
                            <span>{meal.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="font-extrabold text-amber-400">{meal.calories} kcal</span>
                        <span className="text-[10px] text-muted-foreground">
                          P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMeal(mIdx)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
                          title="Edit Meal"
                        >
                          <Lucide.Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMeal(mIdx)}
                          className="p-1 text-muted-foreground hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors"
                          title="Remove Meal"
                        >
                          <Lucide.Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentDay.meals.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                  No meals added for {currentDay.dayName} yet. Click "+ Add Meal to Day" below.
                </div>
              )}
            </div>

            {/* Add / Edit Meal Inline Form */}
            {isAddingMeal ? (
              <form
                onSubmit={handleSaveMeal}
                className="p-4 bg-surface rounded-2xl border border-emerald-500/40 space-y-3 shadow-inner"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Lucide.PlusCircle size={14} className="text-emerald-400" />
                    {editingMealIdx !== null ? 'Edit Meal' : 'Add New Meal to ' + currentDay.dayName}
                  </span>
                  <button
                    type="button"
                    onClick={resetMealForm}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Meal Slot</label>
                    <select
                      value={mealType}
                      onChange={e => setMealType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                    >
                      {MEAL_TYPE_OPTIONS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.icon} {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Meal Name *</label>
                    <input
                      type="text"
                      value={mealName}
                      onChange={e => setMealName(e.target.value)}
                      placeholder="e.g. Kongu Style Paneer & Thinai Upma"
                      required
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Portion</label>
                    <input
                      type="text"
                      value={mealPortion}
                      onChange={e => setMealPortion(e.target.value)}
                      placeholder="e.g. 1 plate (250g)"
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Food Items (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={mealItems}
                    onChange={e => setMealItems(e.target.value)}
                    placeholder="2 Foxtail Millet Idlis with Sambar&#10;1 boiled egg white&#10;1 glass tender coconut water"
                    className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-emerald-500 resize-none font-mono"
                  />
                </div>

                {/* Macros */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-400 uppercase">Calories (kcal)</label>
                    <input
                      type="number"
                      value={mealCalories}
                      onChange={e => setMealCalories(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-400 uppercase">Protein (g)</label>
                    <input
                      type="number"
                      value={mealProtein}
                      onChange={e => setMealProtein(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase">Carbs (g)</label>
                    <input
                      type="number"
                      value={mealCarbs}
                      onChange={e => setMealCarbs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-400 uppercase">Fats (g)</label>
                    <input
                      type="number"
                      value={mealFats}
                      onChange={e => setMealFats(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetMealForm}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-md transition-all cursor-pointer"
                  >
                    {editingMealIdx !== null ? 'Save Changes' : 'Add Meal'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleOpenAddMeal}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lucide.Plus size={14} />
                <span>Add Meal to {currentDay.dayName}</span>
              </button>
            )}
          </div>

          {/* 7-Day Running Averages Bar */}
          <div className="p-3.5 bg-surface rounded-2xl border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                7-Day Average Daily Target
              </span>
              <span className="text-sm font-black text-foreground">
                {avgCalories} kcal / day
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div>
                <span className="text-[9px] uppercase text-muted-foreground block">Avg Protein</span>
                <span className="font-bold text-blue-400">{avgProtein}g</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-muted-foreground block">Avg Carbs</span>
                <span className="font-bold text-emerald-400">{avgCarbs}g</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-muted-foreground block">Avg Fats</span>
                <span className="font-bold text-rose-400">{avgFats}g</span>
              </div>
              <div className="border-l border-border pl-3">
                <span className="text-[9px] uppercase text-muted-foreground block">Est. Loss</span>
                <span className="font-extrabold text-emerald-400">-{weeklyLossKg} kg/wk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/60 pt-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSavePlan}
            disabled={!name.trim()}
            className="px-5 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Lucide.Save size={15} />
            <span>{initialPlan ? 'Update Diet Plan' : 'Save Weekly Diet Plan'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
