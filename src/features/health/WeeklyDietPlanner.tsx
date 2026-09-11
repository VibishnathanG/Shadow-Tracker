'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  WeeklyDietPlan,
  DietDay,
  DietMeal,
  PRESET_DIET_PLANS,
  getCustomDietPlans,
  deleteCustomDietPlan,
  recommendDietPlan,
} from './dietPlansData';
import { getUserBiometrics } from './weightFeasibility';
import CustomDietPlanModal from './CustomDietPlanModal';
import confetti from 'canvas-confetti';

interface WeeklyDietPlannerProps {
  onCopyDayToPlate?: (meals: DietMeal[]) => void;
}

type LocalityFilter = 'all' | 'tamilnadu' | 'telugu' | 'kannada' | 'south_general' | 'north' | 'western' | 'custom';

export default function WeeklyDietPlanner({ onCopyDayToPlate }: WeeklyDietPlannerProps) {
  // Custom plans from localStorage
  const [customPlans, setCustomPlans] = useState<WeeklyDietPlan[]>([]);
  
  useEffect(() => {
    const reload = () => {
      setCustomPlans(getCustomDietPlans());
    };
    reload();
    window.addEventListener('shadow_health_updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('shadow_health_updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  // Filter state
  const [selectedLocality, setSelectedLocality] = useState<LocalityFilter>('all');
  
  // All available plans (Presets + Custom)
  const allPlans = useMemo(() => {
    return [...customPlans, ...PRESET_DIET_PLANS];
  }, [customPlans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (selectedLocality === 'all') return allPlans;
    if (selectedLocality === 'custom') return customPlans;
    return allPlans.filter(p => p.locality === selectedLocality);
  }, [allPlans, customPlans, selectedLocality]);

  // Selected Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>('tn_lean_cut');

  const selectedPlan: WeeklyDietPlan = useMemo(() => {
    const found = allPlans.find(p => p.id === selectedPlanId);
    if (found) return found;
    return filteredPlans[0] || PRESET_DIET_PLANS[0];
  }, [allPlans, filteredPlans, selectedPlanId]);

  // Ensure active plan ID matches filtered list when filter changes
  useEffect(() => {
    if (filteredPlans.length > 0 && !filteredPlans.some(p => p.id === selectedPlanId)) {
      setSelectedPlanId(filteredPlans[0].id);
    }
  }, [filteredPlans, selectedPlanId]);

  // Current plan index within filtered list & navigation
  const currentPlanIndex = useMemo(() => {
    const idx = filteredPlans.findIndex(p => p.id === selectedPlan.id);
    return idx >= 0 ? idx : 0;
  }, [filteredPlans, selectedPlan.id]);

  const handlePrevPlan = () => {
    if (filteredPlans.length <= 1) return;
    const prevIdx = (currentPlanIndex - 1 + filteredPlans.length) % filteredPlans.length;
    setSelectedPlanId(filteredPlans[prevIdx].id);
  };

  const handleNextPlan = () => {
    if (filteredPlans.length <= 1) return;
    const nextIdx = (currentPlanIndex + 1) % filteredPlans.length;
    setSelectedPlanId(filteredPlans[nextIdx].id);
  };

  // Active day index (0 = Monday, ..., 6 = Sunday)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Recommendation engine inputs initialized from user biometrics
  const initialBiometrics = useMemo(() => getUserBiometrics(), []);
  const [targetLossKg, setTargetLossKg] = useState<number>(initialBiometrics.preferredWeeklyLossKg || 0.5);
  const [userAge, setUserAge] = useState<number>(initialBiometrics.age || 28);
  const [userSex, setUserSex] = useState<'male' | 'female'>(initialBiometrics.sex || 'male');
  const [preferredLocality, setPreferredLocality] = useState<string>('all');
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);

  // Custom Plan Modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [planToEdit, setPlanToEdit] = useState<WeeklyDietPlan | null>(null);

  // Collapsible Smart Matcher state (default collapsed for spacious, uncluttered view)
  const [isMatcherOpen, setIsMatcherOpen] = useState<boolean>(false);

  // Copy to Plate notification
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Trigger Recommendation
  const handleRecommend = () => {
    const matched = recommendDietPlan({
      locality: preferredLocality,
      weeklyLossKg: targetLossKg,
      age: userAge,
      sex: userSex,
    });

    if (matched) {
      setSelectedPlanId(matched.id);
      if (matched.locality !== selectedLocality && selectedLocality !== 'all') {
        setSelectedLocality('all');
      }
      setRecommendationMessage(`🎯 Best match: ${matched.name} (${matched.localityLabel})`);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.3 } });
      setTimeout(() => setRecommendationMessage(null), 6000);
    }
  };

  // Delete Custom Plan
  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom diet plan?')) {
      const updated = deleteCustomDietPlan(id);
      setCustomPlans(updated);
      if (selectedPlanId === id) {
        setSelectedPlanId(PRESET_DIET_PLANS[0].id);
      }
    }
  };

  // Active day meals
  const currentDay: DietDay = useMemo(() => {
    if (!selectedPlan?.days || selectedPlan.days.length === 0) {
      return {
        dayName: 'Monday',
        focus: 'Balanced Nutrition',
        totalCalories: 1500,
        totalProtein: 100,
        totalCarbs: 150,
        totalFats: 45,
        meals: [],
      };
    }
    return selectedPlan.days[selectedDayIdx] || selectedPlan.days[0];
  }, [selectedPlan, selectedDayIdx]);

  // Copy Day meals to plate
  const handleCopyDayToPlate = () => {
    if (onCopyDayToPlate && currentDay.meals && currentDay.meals.length > 0) {
      onCopyDayToPlate(currentDay.meals);
      setCopyFeedback(`Copied ${currentDay.meals.length} meals from ${currentDay.dayName} to your Daily Tracker!`);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.4 } });
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  // Total macro ratio for hero card
  const macroRatio = useMemo(() => {
    const p = selectedPlan.avgDailyProtein * 4;
    const c = selectedPlan.avgDailyCarbs * 4;
    const f = selectedPlan.avgDailyFats * 9;
    const total = p + c + f || 1;
    return {
      pPercent: Math.round((p / total) * 100),
      cPercent: Math.round((c / total) * 100),
      fPercent: Math.round((f / total) * 100),
    };
  }, [selectedPlan]);

  return (
    <div className="tile settings-tile p-4 sm:p-6 md:p-8 rounded-3xl space-y-6 border border-emerald-500/25 bg-gradient-to-b from-surface-elevated/90 to-surface/90 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 text-xl">
              🥗
            </span>
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              Weekly Diet Plans
            </h2>
            <span className="text-[6.5px] font-black uppercase px-1.5 py-[1px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-wider leading-none">
              7-Day Schedules
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Week-long regional diet presets tailored for Indian and global nutrition.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setIsMatcherOpen(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isMatcherOpen
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-surface hover:bg-secondary text-secondary hover:text-foreground border-border'
            }`}
            title="Toggle Smart Diet Matcher"
          >
            <Lucide.Sparkles size={14} className={isMatcherOpen ? 'text-amber-400' : 'text-amber-400/80'} />
            <span>{isMatcherOpen ? 'Close Matcher' : 'Smart Matcher'}</span>
            <Lucide.ChevronDown size={14} className={`transition-transform duration-200 ${isMatcherOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setPlanToEdit(null);
              setIsCustomModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Lucide.Plus size={15} />
            <span className="hidden sm:inline">+ Create Custom Diet</span>
            <span className="sm:hidden">+ Custom</span>
          </button>
        </div>
      </div>

      {/* Smart Precision Matcher / Recommendation Panel (Collapsible to keep layout clean & uncluttered) */}
      <AnimatePresence>
        {isMatcherOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 rounded-3xl bg-surface/90 border border-border/80 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Lucide.Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Smart Diet Matcher
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    — Find your culturally ideal weekly fat loss blueprint
                  </span>
                </div>
                {recommendationMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                  >
                    {recommendationMessage}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 items-end">
                {/* Locality */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Locality / Cuisine
                  </label>
                  <select
                    value={preferredLocality}
                    onChange={e => setPreferredLocality(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-elevated border border-border rounded-xl text-foreground font-semibold cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Any Regional Cuisine</option>
                    <option value="tamilnadu">🌴 Tamil Nadu (5 Presets)</option>
                    <option value="telugu">🌶️ Telugu AP &amp; TS (3 Presets)</option>
                    <option value="kannada">🌾 Kannada KA (3 Presets)</option>
                    <option value="south_general">🥥 General South Indian (5 Presets)</option>
                    <option value="north">🫓 North Indian (5 Presets)</option>
                    <option value="western">🥑 Western &amp; Global (5 Presets)</option>
                  </select>
                </div>

                {/* Target Loss Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Weekly Loss Target
                  </label>
                  <select
                    value={targetLossKg}
                    onChange={e => setTargetLossKg(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-surface-elevated border border-border rounded-xl text-foreground font-semibold cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0.3}>0.3 kg / week (Gentle &amp; Steady)</option>
                    <option value={0.5}>0.5 kg / week (Recommended Gold)</option>
                    <option value={0.6}>0.6 kg / week (Athletic Shred)</option>
                    <option value={0.8}>0.8 kg / week (Rapid Fat Loss)</option>
                    <option value={1.0}>1.0 kg / week (Aggressive Cut)</option>
                  </select>
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Age
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="90"
                    value={userAge}
                    onChange={e => setUserAge(parseInt(e.target.value, 10) || 28)}
                    className="w-full px-3 py-2 text-xs bg-surface-elevated border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Sex */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sex
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUserSex('male')}
                      className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                        userSex === 'male'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-surface-elevated text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserSex('female')}
                      className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                        userSex === 'female'
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                          : 'bg-surface-elevated text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Auto-Recommend Button */}
                <div className="col-span-2 sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleRecommend}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Lucide.Sparkles size={14} />
                    <span>Auto-Recommend</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locality Category Filter Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Filter by Regional Cuisine:</span>
          <span className="font-mono text-[11px]">{filteredPlans.length} plans available</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedLocality('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'all'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            All Presets ({allPlans.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('tamilnadu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'tamilnadu'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🌴 Tamil Nadu (5)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('telugu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'telugu'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🌶️ Telugu (3)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('kannada')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'kannada'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🌾 Kannada (3)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('south_general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'south_general'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🥥 South Indian (5)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('north')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'north'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🫓 North Indian (5)
          </button>

          <button
            type="button"
            onClick={() => setSelectedLocality('western')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
              selectedLocality === 'western'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            🥑 Western &amp; Global (5)
          </button>

          {customPlans.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedLocality('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                selectedLocality === 'custom'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-surface border-border text-amber-400/80 hover:text-amber-300 hover:bg-secondary'
              }`}
            >
              ⭐ My Custom Diets ({customPlans.length})
            </button>
          )}
        </div>
      </div>

      {/* Selected Plan Hero Card & Switcher */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface/90 border border-emerald-500/30 space-y-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          {/* Plan identity */}
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
                {selectedPlan.icon}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-black text-foreground">
                    {selectedPlan.name}
                  </h3>
                  {selectedPlan.isCustom && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Custom Saved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium mt-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground font-semibold">
                    {selectedPlan.localityLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {selectedPlan.dietType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    Target: {selectedPlan.targetWeightLossRate}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 max-w-3xl">
              {selectedPlan.tagline}
            </p>
          </div>

          {/* Plan Dropdown Switcher with < > Arrow Buttons */}
          <div className="flex flex-col sm:flex-row items-end md:items-center gap-2 shrink-0">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>Select Blueprint Plan:</span>
                <span className="font-mono text-emerald-400 font-black">
                  {currentPlanIndex + 1} of {filteredPlans.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevPlan}
                  disabled={filteredPlans.length <= 1}
                  className="p-2.5 rounded-xl bg-surface-elevated hover:bg-secondary border border-border text-foreground hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs shrink-0"
                  title="Previous Blueprint Plan (<)"
                >
                  <Lucide.ChevronLeft size={16} />
                </button>

                <select
                  value={selectedPlan.id}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-xs bg-surface-elevated border border-border rounded-xl text-foreground font-bold cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  {filteredPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name} ({p.avgDailyCalories} kcal)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextPlan}
                  disabled={filteredPlans.length <= 1}
                  className="p-2.5 rounded-xl bg-surface-elevated hover:bg-secondary border border-border text-foreground hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs shrink-0"
                  title="Next Blueprint Plan (>)"
                >
                  <Lucide.ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Custom Edit / Clone */}
            <div className="flex items-center gap-1 mt-1 sm:mt-5">
              <button
                type="button"
                onClick={() => {
                  setPlanToEdit(selectedPlan);
                  setIsCustomModalOpen(true);
                }}
                className="p-2.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-xl border border-border transition-colors cursor-pointer"
                title="Duplicate / Customize This Plan"
              >
                <Lucide.Copy size={15} />
              </button>

              {selectedPlan.isCustom && (
                <button
                  type="button"
                  onClick={e => handleDeletePlan(selectedPlan.id, e)}
                  className="p-2.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete Custom Plan"
                >
                  <Lucide.Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Daily Target Macro Bar & Stats */}
        <div className="pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-elevated/70 rounded-2xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Avg Daily Energy
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                {selectedPlan.avgDailyCalories}
              </span>
              <span className="text-xs text-muted-foreground font-bold">kcal / day</span>
            </div>
          </div>

          <div className="p-4 bg-surface-elevated/70 rounded-2xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">
              Avg Protein ({macroRatio.pPercent}%)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-blue-400">
                {selectedPlan.avgDailyProtein}
              </span>
              <span className="text-xs text-muted-foreground font-bold">g / day</span>
            </div>
          </div>

          <div className="p-4 bg-surface-elevated/70 rounded-2xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Avg Carbs ({macroRatio.cPercent}%)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {selectedPlan.avgDailyCarbs}
              </span>
              <span className="text-xs text-muted-foreground font-bold">g / day</span>
            </div>
          </div>

          <div className="p-4 bg-surface-elevated/70 rounded-2xl border border-border/60">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              Avg Fats ({macroRatio.fPercent}%)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-rose-400">
                {selectedPlan.avgDailyFats}
              </span>
              <span className="text-xs text-muted-foreground font-bold">g / day</span>
            </div>
          </div>
        </div>

        {/* Visual Macro Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-secondary">
            <div
              style={{ width: `${macroRatio.pPercent}%` }}
              className="bg-blue-400 h-full transition-all"
              title={`Protein: ${macroRatio.pPercent}%`}
            />
            <div
              style={{ width: `${macroRatio.cPercent}%` }}
              className="bg-emerald-400 h-full transition-all"
              title={`Carbs: ${macroRatio.cPercent}%`}
            />
            <div
              style={{ width: `${macroRatio.fPercent}%` }}
              className="bg-rose-400 h-full transition-all"
              title={`Fats: ${macroRatio.fPercent}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-mono">
            <span>🔵 Protein {selectedPlan.avgDailyProtein}g</span>
            <span>🟢 Carbs {selectedPlan.avgDailyCarbs}g</span>
            <span>🔴 Fats {selectedPlan.avgDailyFats}g</span>
          </div>
        </div>
      </div>

      {/* 7-Day Day Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lucide.Calendar size={16} className="text-emerald-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              7-Day Schedule Breakdown
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {currentDay.dayName}: <span className="text-foreground font-bold">{currentDay.focus}</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {selectedPlan.days.map((day, idx) => {
            const isActive = selectedDayIdx === idx;
            return (
              <button
                key={day.dayName}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md scale-[1.02]'
                    : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="text-xs sm:text-sm font-black leading-tight">
                  {day.dayName.slice(0, 3)}
                </div>
                <div className="text-[10px] font-mono mt-1 opacity-90 hidden sm:block">
                  {day.totalCalories} kcal
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Day Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-surface/90 rounded-2xl border border-border/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {currentDay.dayName}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-foreground">
              {currentDay.focus}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground pt-1">
            <span className="font-bold text-amber-400">{currentDay.totalCalories} kcal</span>
            <span>•</span>
            <span className="text-blue-400 font-semibold">P: {currentDay.totalProtein}g</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">C: {currentDay.totalCarbs}g</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">F: {currentDay.totalFats}g</span>
          </div>
        </div>

        {/* Copy Day Meals to Daily Plate Button */}
        {onCopyDayToPlate && (
          <div className="flex items-center gap-2.5 shrink-0">
            {copyFeedback && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                {copyFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopyDayToPlate}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-emerald-500/15 text-foreground hover:text-emerald-400 border border-border hover:border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Copy all meals from this day directly into today's Nutrition Plate"
            >
              <Lucide.Copy size={14} />
              <span>Copy to Today's Plate</span>
            </button>
          </div>
        )}
      </div>

      {/* Spacious 3-Column Responsive Meals Grid for Active Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {currentDay.meals.map((meal, mIdx) => {
          const typeBadge = {
            breakfast: { label: 'Breakfast', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', defaultIcon: '🌅' },
            snack_morning: { label: 'Mid-Morning', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', defaultIcon: '🍏' },
            lunch: { label: 'Lunch', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', defaultIcon: '☀️' },
            snack_evening: { label: 'Evening Snack', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', defaultIcon: '☕' },
            dinner: { label: 'Dinner', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', defaultIcon: '🌙' },
          }[meal.mealType] || { label: 'Meal', color: 'text-foreground bg-secondary border-border', defaultIcon: '🥗' };

          return (
            <motion.div
              key={`${meal.mealType}-${mIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mIdx * 0.04 }}
              className="p-5 sm:p-6 rounded-3xl bg-surface/90 border border-border/80 hover:border-emerald-500/40 transition-all space-y-4 flex flex-col justify-between group shadow-xs hover:shadow-md min-h-[250px]"
            >
              <div className="space-y-2.5">
                {/* Meal slot header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>
                  <span className="text-lg p-1.5 bg-secondary/70 rounded-xl shrink-0">
                    {meal.icon || typeBadge.defaultIcon}
                  </span>
                </div>

                {/* Meal name & portion */}
                <div>
                  <h4 className="text-sm font-black text-foreground group-hover:text-emerald-400 transition-colors leading-snug">
                    {meal.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Portion: {meal.portion}
                  </p>
                </div>

                {/* Items list */}
                {meal.items && meal.items.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Plate Composition:
                    </span>
                    <ul className="space-y-1 text-xs text-foreground/90 leading-relaxed">
                      {meal.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 shrink-0 text-xs leading-none mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Nutrition tip */}
                {meal.tips && (
                  <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-1.5 mt-2 leading-relaxed">
                    <Lucide.Info size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <span className="italic">{meal.tips}</span>
                  </div>
                )}
              </div>

              {/* Meal Macros Card Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between font-mono text-xs">
                <span className="font-extrabold text-amber-400 text-sm">
                  {meal.calories} kcal
                </span>
                <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                  <span className="text-blue-400 font-bold">P: {meal.protein}g</span>
                  <span className="text-emerald-400 font-bold">C: {meal.carbs}g</span>
                  <span className="text-rose-400 font-bold">F: {meal.fats}g</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Diet Plan Modal */}
      {isCustomModalOpen && (
        <CustomDietPlanModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          initialPlan={planToEdit}
          onPlanCreated={newPlan => {
            const updated = getCustomDietPlans();
            setCustomPlans(updated);
            setSelectedPlanId(newPlan.id);
            setSelectedLocality('custom');
          }}
        />
      )}
    </div>
  );
}
