'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { LoggedFood } from './NutritionPlateVisualizer';
import {
  RDA_MICRONUTRIENTS,
  NutrientProgress,
  AgeGroupPreset,
  getAgeGroupPreset,
  calculateDailyMicronutrients,
} from './micronutrientData';
import { getUserBiometrics, UserBiometrics } from './weightFeasibility';

interface MicronutrientSectionProps {
  loggedFoods: LoggedFood[];
  onAddSupplement?: (supplement: LoggedFood) => void;
}

export default function MicronutrientSection({ loggedFoods }: MicronutrientSectionProps) {
  // 1. Load user biometrics as initial preset baseline
  const [biometrics, setBiometrics] = useState<UserBiometrics>(() => getUserBiometrics());

  // Listen for biometrics updates from Weight Goal / Gym tab
  useEffect(() => {
    const handleUpdate = () => {
      setBiometrics(getUserBiometrics());
    };
    window.addEventListener('shadow_health_updated', handleUpdate);
    return () => window.removeEventListener('shadow_health_updated', handleUpdate);
  }, []);

  // 2. Interactive RDA Configuration state (defaults to user's saved biometrics)
  const [selectedSex, setSelectedSex] = useState<'male' | 'female'>(biometrics.sex || 'male');
  const [selectedAgePreset, setSelectedAgePreset] = useState<AgeGroupPreset>(() =>
    getAgeGroupPreset(biometrics.age || 28)
  );

  // Sync if biometrics change externally
  useEffect(() => {
    if (biometrics.sex) setSelectedSex(biometrics.sex);
    if (biometrics.age) setSelectedAgePreset(getAgeGroupPreset(biometrics.age));
  }, [biometrics.sex, biometrics.age]);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vitamin' | 'mineral'>('all');
  const [selectedNutrientDetail, setSelectedNutrientDetail] = useState<NutrientProgress | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNutrientDetail) {
        setSelectedNutrientDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNutrientDetail]);

  // 4. Calculate progress for all nutrients
  const nutrientProgressList = useMemo(() => {
    return calculateDailyMicronutrients(loggedFoods, selectedSex, selectedAgePreset);
  }, [loggedFoods, selectedSex, selectedAgePreset]);

  // Filtered list based on category
  const filteredNutrients = useMemo(() => {
    if (categoryFilter === 'all') return nutrientProgressList;
    return nutrientProgressList.filter(n => n.nutrient.category === categoryFilter);
  }, [nutrientProgressList, categoryFilter]);

  // Overall RDA adherence metrics
  const overallStats = useMemo(() => {
    const total = nutrientProgressList.length;
    const optimalCount = nutrientProgressList.filter(n => n.percentage >= 80).length;
    const moderateCount = nutrientProgressList.filter(n => n.percentage >= 45 && n.percentage < 80).length;
    const deficientCount = nutrientProgressList.filter(n => n.percentage < 45).length;
    const avgPercentage = Math.round(
      nutrientProgressList.reduce((acc, n) => acc + Math.min(100, n.percentage), 0) / (total || 1)
    );
    return { optimalCount, moderateCount, deficientCount, avgPercentage };
  }, [nutrientProgressList]);

  // Age group display labels
  const ageLabels: Record<AgeGroupPreset, string> = {
    teen: '14–18y (Teens)',
    adult: '19–50y (Adults)',
    senior: '51+y (Seniors)',
  };

  return (
    <div className="tile settings-tile p-5 sm:p-7 rounded-3xl space-y-6">
      {/* Header & Personalized Bio Synced Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2.5 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30 text-lg">
              🧪
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
                <h3 className="text-[1em] font-black text-foreground tracking-tight">
                  Vitamins &amp; Minerals Profile
                </h3>
                <span 
                  style={{ fontSize: '0.45em', lineHeight: 1 }}
                  className="inline-flex items-center font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 whitespace-nowrap shrink-0 shadow-2xs origin-left scale-90 sm:scale-100"
                >
                  RDA Standards Preloaded
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Real-time micronutrient yield from today's {loggedFoods.length} logged foods.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Personal Preset Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-surface p-1.5 rounded-full border border-border/80 text-xs">
          {/* Sex Switcher */}
          <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-full border border-border/50">
            <button
              type="button"
              onClick={() => setSelectedSex('male')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedSex === 'male'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ♂ Male
            </button>
            <button
              type="button"
              onClick={() => setSelectedSex('female')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                selectedSex === 'female'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ♀ Female
            </button>
          </div>

          {/* Clean Rounded Age Group Selector */}
          <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-full border border-border/50">
            <span className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider pl-2 pr-0.5">Age:</span>
            {(['teen', 'adult', 'senior'] as const).map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedAgePreset(preset)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedAgePreset === preset
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={ageLabels[preset]}
              >
                {preset === 'teen' ? '14-18' : preset === 'adult' ? '19-50' : '51+'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface/70 p-3.5 rounded-2xl border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overall RDA Met</span>
            <Lucide.Activity size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-foreground">
            {overallStats.avgPercentage}%
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">Daily average across 12 nutrients</div>
        </div>

        <div className="bg-surface/70 p-3.5 rounded-2xl border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Optimal (&gt;=80%)</span>
            <Lucide.CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {overallStats.optimalCount} <span className="text-xs text-muted-foreground">/ 12</span>
          </div>
          <div className="text-[10px] text-emerald-400/90 font-medium">Healthy target range</div>
        </div>

        <div className="bg-surface/70 p-3.5 rounded-2xl border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approaching (45-79%)</span>
            <Lucide.Clock size={14} className="text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            {overallStats.moderateCount} <span className="text-xs text-muted-foreground">/ 12</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">Within reach with next meal</div>
        </div>

        <div className="bg-surface/70 p-3.5 rounded-2xl border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Deficit (&lt;45%)</span>
            <Lucide.AlertCircle size={14} className="text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
            {overallStats.deficientCount} <span className="text-xs text-muted-foreground">/ 12</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">Prioritize in dinner or snacks</div>
        </div>
      </div>

      {/* Filter Tabs: All vs Vitamins vs Minerals */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-full border border-border/70 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Nutrients ({nutrientProgressList.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('vitamin')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'vitamin'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🍊 Vitamins</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({nutrientProgressList.filter(n => n.nutrient.category === 'vitamin').length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('mineral')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'mineral'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>💎 Minerals</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({nutrientProgressList.filter(n => n.nutrient.category === 'mineral').length})
            </span>
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>80-130% RDA Target</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-2" />
          <span>45-79%</span>
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block ml-2" />
          <span>&lt;45%</span>
        </div>
      </div>

      {/* Nutrients Cards Grid */}
      {loggedFoods.length === 0 ? (
        <div className="text-center py-8 rounded-2xl bg-surface/40 border border-dashed border-border/80 space-y-2">
          <span className="text-3xl">🥗</span>
          <p className="text-xs font-bold text-foreground">No foods logged today yet.</p>
          <p className="text-[11px] text-muted-foreground">
            Log your breakfast, lunch, or dinner above to automatically populate your daily vitamin and mineral breakdown against approved RDA targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNutrients.map((item) => {
            const barWidth = Math.min(100, item.percentage);
            return (
              <motion.div
                key={item.nutrient.id}
                layout
                onClick={() => setSelectedNutrientDetail(item)}
                className="p-3.5 bg-surface-elevated/70 hover:bg-surface-elevated border border-border/70 hover:border-primary/50 rounded-2xl space-y-2.5 transition-all cursor-pointer group shadow-xs"
              >
                {/* Top line: Name, Icon, Percentage chip */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl p-1.5 bg-secondary/80 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                      {item.nutrient.icon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-foreground truncate">
                        {item.nutrient.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground truncate block font-medium">
                        {item.nutrient.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full border shrink-0 ${item.bgClass} ${item.colorClass}`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percentage >= 80
                          ? 'bg-emerald-400'
                          : item.percentage >= 45
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                  </div>

                  {/* Quantity numbers */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-foreground">
                      {item.amount} {item.nutrient.unit}
                    </span>
                    <span className="text-muted-foreground">
                      RDA Target: {item.target} {item.nutrient.unit}
                    </span>
                  </div>
                </div>

                {/* Food contributors preview */}
                {item.contributingFoods.length > 0 && (
                  <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-medium truncate">
                      Main source: {item.contributingFoods[0].icon} {item.contributingFoods[0].name}
                    </span>
                    <Lucide.ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive Detail Modal for clicked nutrient */}
      <AnimatePresence>
        {selectedNutrientDetail && (
          <div
            onClick={() => setSelectedNutrientDetail(null)}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-secondary rounded-2xl">
                    {selectedNutrientDetail.nutrient.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {selectedNutrientDetail.nutrient.name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      {selectedNutrientDetail.nutrient.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNutrientDetail(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Lucide.X size={18} />
                </button>
              </div>

              {/* Status & target pill */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/60">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Today's Ingestion
                  </span>
                  <span className="text-lg font-black font-mono text-foreground">
                    {selectedNutrientDetail.amount} / {selectedNutrientDetail.target}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {selectedNutrientDetail.nutrient.unit}
                    </span>
                  </span>
                </div>
                <span
                  className={`text-xs font-black font-mono px-3 py-1 rounded-xl border ${selectedNutrientDetail.bgClass} ${selectedNutrientDetail.colorClass}`}
                >
                  {selectedNutrientDetail.percentage}% RDA
                </span>
              </div>

              {/* Health Benefit Explanation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Physiological Health Role:
                </span>
                <p className="text-xs text-foreground leading-relaxed font-medium bg-surface p-3 rounded-xl border border-border/60">
                  {selectedNutrientDetail.nutrient.healthBenefit}
                </p>
              </div>

              {/* Food Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Logged Foods Contributing Today:
                </span>
                {selectedNutrientDetail.contributingFoods.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">None logged today yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {selectedNutrientDetail.contributingFoods.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-secondary/60 text-xs"
                      >
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{f.icon}</span>
                          <span>{f.name}</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{f.amount} {selectedNutrientDetail.nutrient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedNutrientDetail(null)}
                className="w-full py-2 bg-secondary hover:bg-surface text-foreground font-bold text-xs rounded-full border border-border transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
