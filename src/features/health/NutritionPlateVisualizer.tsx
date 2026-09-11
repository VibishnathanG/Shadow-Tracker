'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { calculateNutrientsForGrams } from './indianFoodDatabase';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LoggedFood {
  id: string;
  foodId: string;
  name: string;
  serving: string;
  standardGrams?: number;
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  icon: string;
  meal: MealType;
  quantity: number; // multiplier e.g. 1, 2, 0.5
  time: string;
}

interface NutritionPlateVisualizerProps {
  loggedFoods: LoggedFood[];
  calorieGoal: number;
  onUpdateFood: (id: string, updates: Partial<LoggedFood>) => void;
  onRemoveFood: (id: string) => void;
  onOpenAddModal: (defaultMeal?: MealType) => void;
}

export default function NutritionPlateVisualizer({
  loggedFoods,
  calorieGoal,
  onUpdateFood,
  onRemoveFood,
  onOpenAddModal,
}: NutritionPlateVisualizerProps) {
  const [editingItem, setEditingItem] = useState<LoggedFood | null>(null);
  const [activeMealTab, setActiveMealTab] = useState<MealType | 'all'>('all');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editGrams, setEditGrams] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFats, setEditFats] = useState('');
  const [editMeal, setEditMeal] = useState<MealType>('lunch');
  const [editQuantity, setEditQuantity] = useState(1);

  // Lock body scroll when editing item modal is open
  useEffect(() => {
    if (!editingItem) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [editingItem]);

  // Meal Totals
  const mealTotals = useMemo(() => {
    return {
      breakfast: loggedFoods
        .filter(f => f.meal === 'breakfast')
        .reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0),
      lunch: loggedFoods
        .filter(f => f.meal === 'lunch')
        .reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0),
      dinner: loggedFoods
        .filter(f => f.meal === 'dinner')
        .reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0),
      snack: loggedFoods
        .filter(f => f.meal === 'snack')
        .reduce((sum, f) => sum + f.calories * (f.quantity || 1), 0),
    };
  }, [loggedFoods]);

  const totalCalories = Math.round(
    mealTotals.breakfast + mealTotals.lunch + mealTotals.dinner + mealTotals.snack
  );

  const totalProtein = Math.round(
    loggedFoods.reduce((sum, f) => sum + f.protein * (f.quantity || 1), 0)
  );
  const totalCarbs = Math.round(
    loggedFoods.reduce((sum, f) => sum + f.carbs * (f.quantity || 1), 0)
  );
  const totalFats = Math.round(
    loggedFoods.reduce((sum, f) => sum + f.fats * (f.quantity || 1), 0)
  );

  // Target Macro Grams
  const targetProteinGrams = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbsGrams = Math.round((calorieGoal * 0.4) / 4);
  const targetFatsGrams = Math.round((calorieGoal * 0.3) / 9);

  const caloriePct = Math.round((totalCalories / (calorieGoal || 2000)) * 100);
  const clampedRingPct = Math.min(100, caloriePct);
  const remainingCalories = calorieGoal - totalCalories;
  const isOverBudget = remainingCalories < 0;

  // Filtered foods for display
  const displayFoods = activeMealTab === 'all'
    ? loggedFoods
    : loggedFoods.filter(f => f.meal === activeMealTab);

  const startEdit = (food: LoggedFood) => {
    setEditingItem(food);
    setEditName(food.name);
    setEditGrams(String(food.grams || food.standardGrams || 100));
    setEditCalories(String(Math.round(food.calories)));
    setEditProtein(String(food.protein));
    setEditCarbs(String(food.carbs));
    setEditFats(String(food.fats));
    setEditMeal(food.meal);
    setEditQuantity(food.quantity || 1);
  };

  // When grams input changes in edit modal, proportionally update macros if standard exists
  const handleEditGramsChange = (newGramsStr: string) => {
    setEditGrams(newGramsStr);
    const g = parseFloat(newGramsStr);
    if (!isNaN(g) && g > 0 && editingItem) {
      const baseGrams = editingItem.standardGrams || 100;
      const ratio = g / baseGrams;
      setEditCalories(String(Math.round((editingItem.calories / (editingItem.grams ? editingItem.grams / baseGrams : 1)) * ratio)));
      setEditProtein(String(Math.round(((editingItem.protein / (editingItem.grams ? editingItem.grams / baseGrams : 1)) * ratio) * 10) / 10));
      setEditCarbs(String(Math.round(((editingItem.carbs / (editingItem.grams ? editingItem.grams / baseGrams : 1)) * ratio) * 10) / 10));
      setEditFats(String(Math.round(((editingItem.fats / (editingItem.grams ? editingItem.grams / baseGrams : 1)) * ratio) * 10) / 10));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateFood(editingItem.id, {
      name: editName.trim() || editingItem.name,
      grams: parseFloat(editGrams) || editingItem.grams || 100,
      calories: parseFloat(editCalories) || editingItem.calories,
      protein: parseFloat(editProtein) || editingItem.protein,
      carbs: parseFloat(editCarbs) || editingItem.carbs,
      fats: parseFloat(editFats) || editingItem.fats,
      meal: editMeal,
      quantity: editQuantity,
    });

    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Plate & Macro Dashboard Tile */}
      <div className="tile settings-tile p-5 sm:p-7 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Circular Interactive Nutrition Plate Visualizer */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Porcelain Plate Rim with Realistic Depth */}
              <div className="absolute inset-0 rounded-full border-[6px] border-surface-elevated/95 bg-gradient-to-br from-surface-elevated via-secondary/50 to-surface/90 shadow-2xl flex items-center justify-center ring-1 ring-border/80" />

              {/* Concentric Ceramic Groove Ring */}
              <div className="absolute inset-4 rounded-full border border-border/40 pointer-events-none" />

              {/* Progress Arc SVG with Gradient Fill (Light Green -> Amber -> Red Overflow) */}
              <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] -rotate-90" viewBox="0 0 100 100">
                <defs>
                  {/* Standard In-Budget Gradient (Mint Green -> Vibrant Emerald -> Gold Amber) */}
                  <linearGradient id="healthyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="60%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  
                  {/* Calorie Overflow Gradient (Vibrant Amber -> Crimson Red -> Deep Red) */}
                  <linearGradient id="overlimitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>

                {/* Track Background */}
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/15"
                />

                {/* Dynamic Calorie Arc */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="257.6"
                  initial={{ strokeDashoffset: 257.6 }}
                  animate={{
                    strokeDashoffset: 257.6 - (257.6 * clampedRingPct) / 100,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  stroke={isOverBudget ? 'url(#overlimitGradient)' : 'url(#healthyGradient)'}
                />
              </svg>

              {/* Inner Meal Quadrants with Colorized Icon Boxes (No clipping) */}
              <div className="absolute inset-8 pointer-events-none flex flex-col justify-between items-center py-1 select-none">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xs" title="Breakfast Section">
                  <Lucide.Sunrise size={13} />
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-xs" title="Dinner Section">
                  <Lucide.MoonStar size={13} />
                </div>
              </div>
              <div className="absolute inset-8 pointer-events-none flex justify-between items-center px-1 select-none">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xs" title="Lunch Section">
                  <Lucide.SunMedium size={13} />
                </div>
                <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-xs" title="Snacks Section">
                  <Lucide.Coffee size={13} />
                </div>
              </div>

              {/* Center Porcelain Hub Display */}
              <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-surface/95 backdrop-blur-md border border-border/80 shadow-xl flex flex-col items-center justify-center text-center p-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">EATEN</span>
                <div className="flex items-baseline gap-0.5 font-mono font-black text-foreground">
                  <span className="text-2xl sm:text-3xl leading-none">{totalCalories}</span>
                  <span className="text-[10px] text-muted-foreground">kcal</span>
                </div>
                <span className="text-[9.5px] font-bold text-muted-foreground pt-0.5">Limit: {calorieGoal}</span>

                <div className="mt-1.5">
                  {isOverBudget ? (
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                      +{Math.abs(remainingCalories)} Over Limit
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {remainingCalories} Left
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Meal Calories Legend Bar (Below Plate with Vector Icons) */}
            <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground pt-1">
              <span className="flex items-center gap-1 text-amber-400">
                <Lucide.Sunrise size={12} /> {mealTotals.breakfast}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Lucide.SunMedium size={12} /> {mealTotals.lunch}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-400">
                <Lucide.MoonStar size={12} /> {mealTotals.dinner}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-400">
                <Lucide.Coffee size={12} /> {mealTotals.snack} kcal
              </span>
            </div>
          </div>

          {/* Right Side: Macro Breakdown & Meal Summary */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>🍽️ Daily Nutrition Plate</span>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full border ${
                    isOverBudget
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {caloriePct}% Goal
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Macronutrient targets with automatic grams scaling and live edit support.
                </p>
              </div>

              <button
                onClick={() => onOpenAddModal()}
                className="px-4 py-2 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 self-start sm:self-auto"
              >
                <Lucide.Plus size={14} /> Add Food to Plate
              </button>
            </div>

            {/* Macro Bars (Protein, Carbs, Fats) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Protein Bar */}
              <div className="bg-secondary/40 p-3.5 rounded-2xl border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-sky-400 flex items-center gap-1">
                    🍗 Protein
                  </span>
                  <span className="font-mono font-black text-foreground">{totalProtein}g</span>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((totalProtein / targetProteinGrams) * 100))}%` }}
                    className="h-full bg-sky-400 rounded-full transition-all"
                  />
                </div>
                <div className="text-[9.5px] text-muted-foreground text-right font-medium">
                  Goal: {targetProteinGrams}g ({Math.round((totalProtein / targetProteinGrams) * 100)}%)
                </div>
              </div>

              {/* Carbs Bar */}
              <div className="bg-secondary/40 p-3.5 rounded-2xl border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1">
                    🌾 Carbs
                  </span>
                  <span className="font-mono font-black text-foreground">{totalCarbs}g</span>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((totalCarbs / targetCarbsGrams) * 100))}%` }}
                    className="h-full bg-amber-400 rounded-full transition-all"
                  />
                </div>
                <div className="text-[9.5px] text-muted-foreground text-right font-medium">
                  Goal: {targetCarbsGrams}g ({Math.round((totalCarbs / targetCarbsGrams) * 100)}%)
                </div>
              </div>

              {/* Fats Bar */}
              <div className="bg-secondary/40 p-3.5 rounded-2xl border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-rose-400 flex items-center gap-1">
                    🥑 Fats
                  </span>
                  <span className="font-mono font-black text-foreground">{totalFats}g</span>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((totalFats / targetFatsGrams) * 100))}%` }}
                    className="h-full bg-rose-400 rounded-full transition-all"
                  />
                </div>
                <div className="text-[9.5px] text-muted-foreground text-right font-medium">
                  Goal: {targetFatsGrams}g ({Math.round((totalFats / targetFatsGrams) * 100)}%)
                </div>
              </div>
            </div>

            {/* Quick Meal Slot Cards with Vector Icon Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { type: 'breakfast' as MealType, label: 'Breakfast', icon: Lucide.Sunrise, bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', kcal: mealTotals.breakfast },
                { type: 'lunch' as MealType, label: 'Lunch', icon: Lucide.SunMedium, bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', kcal: mealTotals.lunch },
                { type: 'dinner' as MealType, label: 'Dinner', icon: Lucide.MoonStar, bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400', kcal: mealTotals.dinner },
                { type: 'snack' as MealType, label: 'Snack / Chai', icon: Lucide.Coffee, bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400', kcal: mealTotals.snack },
              ].map(m => {
                const IconComp = m.icon;
                return (
                  <button
                    key={m.type}
                    onClick={() => onOpenAddModal(m.type)}
                    className="flex items-center justify-between p-3 bg-surface-elevated/70 hover:bg-surface-elevated border border-border/70 rounded-2xl transition-all cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl border ${m.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                        <IconComp size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground block truncate">
                          {m.label}
                        </span>
                        <span className="text-xs font-black font-mono text-foreground">
                          {m.kcal} kcal
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      <Lucide.Plus size={14} />
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Logged Foods List & Interactive Pop-Edit Section */}
      <div className="tile settings-tile p-5 sm:p-7 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
              Today's Logged Foods ({loggedFoods.length})
            </h4>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/60 text-[10px] font-bold overflow-x-auto no-scrollbar scrollbar-none">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveMealTab(tab)}
                className={`px-3 py-1 rounded-lg capitalize cursor-pointer transition-all ${
                  activeMealTab === tab
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'all' ? 'All Meals' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Food Items List */}
        {displayFoods.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-3xl">🥗</p>
            <p className="text-xs font-bold text-muted-foreground">No food logged for this meal yet.</p>
            <button
              onClick={() => onOpenAddModal(activeMealTab === 'all' ? 'lunch' : activeMealTab)}
              className="text-xs font-black text-primary hover:underline cursor-pointer"
            >
              + Tap here to log your first dish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayFoods.map(food => {
              const itemCalories = Math.round(food.calories * (food.quantity || 1));
              const itemProtein = Math.round(food.protein * (food.quantity || 1) * 10) / 10;
              const itemGrams = food.grams || food.standardGrams;
              return (
                <motion.div
                  key={food.id}
                  layout
                  className="p-3.5 bg-surface-elevated/60 hover:bg-surface-elevated border border-border/70 hover:border-primary/50 rounded-2xl flex items-center justify-between gap-3 group transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl p-2 bg-secondary/80 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                      {food.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-foreground truncate">{food.name}</span>
                        {food.quantity && food.quantity !== 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                            {food.quantity}x
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {itemGrams ? `${itemGrams}g` : food.serving} • <span className="text-sky-400 font-bold">{itemProtein}g Pro</span> • <span className="capitalize">{food.meal}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-black text-xs text-foreground">{itemCalories}</span>
                      <span className="text-[9px] text-muted-foreground block font-bold">kcal</span>
                    </div>

                    {/* Explicit Edit Button */}
                    <button
                      type="button"
                      onClick={() => startEdit(food)}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Edit dish / grams / macros"
                    >
                      <Lucide.Edit size={13} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveFood(food.id)}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove from plate"
                    >
                      <Lucide.Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Pop-Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div 
            onClick={() => setEditingItem(null)}
            onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
            style={{ touchAction: 'none' }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
              className="w-full max-w-md bg-surface-elevated border border-border/80 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y cursor-default"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-secondary rounded-2xl">{editingItem.icon}</span>
                  <div>
                    <h3 className="text-sm font-black text-foreground">Edit Logged Food</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Change grams, meal, or exact macros</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <Lucide.X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Food Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Dish Name</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold outline-none focus:border-primary"
                  />
                  {editName.length >= 80 && (
                    <span className="text-[10px] text-amber-500 font-semibold block animate-fadeIn">
                      Dish name limit reached (80/80)
                    </span>
                  )}
                </div>

                {/* Grams & Multiplier */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Portion Grams (g)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={editGrams}
                      onChange={e => handleEditGramsChange(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold outline-none focus:border-primary"
                      placeholder="e.g. 150"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Multiplier ({editQuantity}x)
                    </label>
                    <div className="flex gap-1">
                      {[0.5, 1, 1.5, 2].map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setEditQuantity(q)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                            editQuantity === q
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                          }`}
                        >
                          {q}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Meal Slot Switcher */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Meal Slot</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditMeal(m)}
                        className={`p-2 rounded-xl text-[10px] font-bold capitalize transition-all cursor-pointer border ${
                          editMeal === m
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-secondary text-foreground border-border/60 hover:bg-surface'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Macros */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Calories</label>
                    <input
                      type="number"
                      value={editCalories}
                      onChange={e => setEditCalories(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-1.5 text-foreground text-xs font-mono font-black outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Protein</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editProtein}
                      onChange={e => setEditProtein(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-1.5 text-foreground text-xs font-mono font-bold outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Carbs</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editCarbs}
                      onChange={e => setEditCarbs(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-1.5 text-foreground text-xs font-mono font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Fats</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFats}
                      onChange={e => setEditFats(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-xl px-2 py-1.5 text-foreground text-xs font-mono font-bold outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveFood(editingItem.id);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs cursor-pointer transition-all"
                  >
                    Delete
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-md hover:bg-primary/90 cursor-pointer transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
