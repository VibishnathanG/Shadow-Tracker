'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { LoggedFood } from './NutritionPlateVisualizer';
import { normalizeNutrientKey } from './micronutrientData';

interface AddSupplementModalProps {
  onClose: () => void;
  onAdd: (supplement: LoggedFood) => void;
}

// Standard adult reference targets for calculating intuitive % RDA preview
const RDA_REFERENCE: Record<string, { name: string; icon: string; unit: string; target: number }> = {
  vit_c: { name: 'Vit C', icon: '🍊', unit: 'mg', target: 90 },
  vit_d: { name: 'Vit D', icon: '☀️', unit: 'mcg', target: 15 },
  vit_b12: { name: 'Vit B12', icon: '🧠', unit: 'mcg', target: 2.4 },
  vit_b6: { name: 'Vit B6', icon: '⚡', unit: 'mg', target: 1.3 },
  vit_a: { name: 'Vit A', icon: '🥕', unit: 'mcg', target: 800 },
  vit_b9: { name: 'Folate B9', icon: '🥬', unit: 'mcg', target: 400 },
  vit_e: { name: 'Vit E', icon: '🥑', unit: 'mg', target: 15 },
  min_zinc: { name: 'Zinc', icon: '🛡️', unit: 'mg', target: 11 },
  min_magnesium: { name: 'Magnesium', icon: '🌙', unit: 'mg', target: 400 },
  min_iron: { name: 'Iron', icon: '🩸', unit: 'mg', target: 10 },
  min_calcium: { name: 'Calcium', icon: '🦴', unit: 'mg', target: 1000 },
  min_potassium: { name: 'Potassium', icon: '🍌', unit: 'mg', target: 3000 },
};

const PRESET_SUPPLEMENTS = [
  {
    id: 'supp_centrum_men',
    name: 'Centrum Men Multivitamin',
    serving: '1 tablet',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    icon: '💊',
    micros: {
      vit_c: 90,
      vit_d: 25,
      vit_a: 800,
      vit_b12: 3,
      vit_b6: 2,
      vit_e: 15,
      min_iron: 8,
      min_zinc: 11,
      min_magnesium: 100,
      min_calcium: 210,
      min_potassium: 80,
    },
  },
  {
    id: 'supp_centrum_women',
    name: 'Centrum Women Multivitamin',
    serving: '1 tablet',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    icon: '💊',
    micros: {
      vit_c: 75,
      vit_d: 25,
      vit_a: 700,
      vit_b12: 6,
      vit_b6: 2,
      vit_e: 15,
      min_iron: 18,
      min_zinc: 8,
      min_magnesium: 100,
      min_calcium: 320,
      min_potassium: 80,
    },
  },
  {
    id: 'supp_vit_d3',
    name: 'Vitamin D3 (2000 IU / 50mcg)',
    serving: '1 softgel',
    calories: 5,
    protein: 0,
    carbs: 0,
    fats: 0.5,
    icon: '☀️',
    micros: {
      vit_d: 50,
    },
  },
  {
    id: 'supp_zma',
    name: 'Zinc & Magnesium Complex (ZMA)',
    serving: '2 capsules',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    icon: '🛡️',
    micros: {
      min_zinc: 15,
      min_magnesium: 250,
      vit_b6: 4,
    },
  },
  {
    id: 'supp_whey_isolate',
    name: 'Whey Protein Isolate (1 Scoop)',
    serving: '1 scoop (30g)',
    calories: 110,
    protein: 25,
    carbs: 1,
    fats: 0.5,
    icon: '🥤',
    micros: {
      min_calcium: 120,
      min_potassium: 160,
    },
  },
  {
    id: 'supp_fish_oil',
    name: 'Omega-3 Fish Oil (1000mg)',
    serving: '1 softgel',
    calories: 10,
    protein: 0,
    carbs: 0,
    fats: 1,
    icon: '🐟',
    micros: {
      vit_e: 5,
    },
  },
  {
    id: 'supp_creatine',
    name: 'Creatine Monohydrate (5g)',
    serving: '1 scoop (5g)',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    icon: '⚡',
    micros: {},
  },
];

export default function AddSupplementModal({ onClose, onAdd }: AddSupplementModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body & document scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
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
  }, [onClose]);

  // Custom Supplement Builder State
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');
  const [customCategory, setCustomCategory] = useState<'vitamin' | 'mineral' | 'protein' | 'stack'>('vitamin');
  const [customCalories, setCustomCalories] = useState('0');
  const [customProtein, setCustomProtein] = useState('0');
  const [customCarbs, setCustomCarbs] = useState('0');
  const [customFats, setCustomFats] = useState('0');
  const [customMicros, setCustomMicros] = useState<Record<string, number>>({
    vit_c: 0,
    vit_d: 0,
    min_zinc: 0,
    min_magnesium: 0,
  });

  const handleToggleNutrient = (key: string) => {
    setCustomMicros(prev => {
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        const ref = RDA_REFERENCE[key];
        next[key] = ref ? ref.target : 10;
      }
      return next;
    });
  };

  const handleUpdateNutrientAmount = (key: string, val: number) => {
    setCustomMicros(prev => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  const handleAddPreset = (preset: typeof PRESET_SUPPLEMENTS[0]) => {
    const cleanMicros: Record<string, number> = {};
    for (const [k, v] of Object.entries(preset.micros)) {
      cleanMicros[normalizeNutrientKey(k)] = v;
    }

    onAdd({
      id: `${preset.id}_${Date.now()}`,
      foodId: preset.id,
      name: preset.name,
      serving: preset.serving,
      standardGrams: 100,
      grams: 100,
      meal: 'snack',
      quantity: 1,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fats: preset.fats,
      icon: preset.icon,
      isSupplement: true,
      customMicros: cleanMicros,
      micros: cleanMicros,
    } as any);
    onClose();
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;

    // Filter only non-zero nutrients
    const cleanMicros: Record<string, number> = {};
    for (const [k, v] of Object.entries(customMicros)) {
      if (v && v > 0) {
        cleanMicros[normalizeNutrientKey(k)] = v;
      }
    }

    const icon =
      customCategory === 'protein'
        ? '🥤'
        : customCategory === 'mineral'
        ? '🛡️'
        : customCategory === 'stack'
        ? '⚡'
        : '💊';

    onAdd({
      id: `custom_supp_${Date.now()}`,
      foodId: `custom_supp_${Date.now()}`,
      name: customName.trim(),
      serving: customServing.trim() || '1 serving',
      standardGrams: 100,
      grams: 100,
      meal: 'snack',
      quantity: 1,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories: parseFloat(customCalories) || 0,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fats: parseFloat(customFats) || 0,
      icon,
      isSupplement: true,
      customMicros: cleanMicros,
      micros: cleanMicros,
    } as any);
    onClose();
  };

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
      onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onWheel={(e) => e.stopPropagation()}
      style={{ touchAction: 'none' }}
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-xl bg-surface border border-border/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-primary/15 text-primary rounded-2xl border border-primary/30">
              <Lucide.Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Log Supplement &amp; Micronutrients
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Vitamins, minerals, and workout supplements with live RDA yield.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <Lucide.X size={18} />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex bg-secondary/80 p-1 rounded-2xl mb-4 shrink-0 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 text-xs font-black py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lucide.Flame size={14} />
            <span>Smart Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 text-xs font-black py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lucide.Plus size={14} />
            <span>Custom Supplement Builder</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
          {activeTab === 'presets' ? (
            <div className="space-y-3">
              {PRESET_SUPPLEMENTS.map(preset => {
                const microEntries = Object.entries(preset.micros);
                return (
                  <div
                    key={preset.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 transition-all space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl p-2 bg-surface rounded-xl shadow-xs shrink-0">
                          {preset.icon}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                            {preset.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground">{preset.serving}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {preset.calories > 0
                                ? `${preset.calories} kcal • ${preset.protein}g Protein`
                                : '0 kcal • Pure Micronutrients'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        className="px-3 py-1.5 bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                      >
                        <Lucide.Plus size={13} className="stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Micronutrient Content Breakdown with % RDA */}
                    {microEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                        {microEntries.map(([k, amt]) => {
                          const normalized = normalizeNutrientKey(k);
                          const ref = RDA_REFERENCE[normalized];
                          const pct = ref ? Math.round((amt / ref.target) * 100) : 0;
                          return (
                            <span
                              key={k}
                              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                pct >= 100
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : pct >= 50
                                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                  : 'bg-secondary text-muted-foreground border-border/60'
                              }`}
                            >
                              <span>{ref ? ref.icon : '✨'}</span>
                              <span>{ref ? ref.name : k}: {amt}{ref ? ref.unit : ''}</span>
                              <strong className="text-foreground">({pct}% RDA)</strong>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground italic pt-0.5">
                        Clean performance ergogenic (0 kcal, 0 vitamins)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Supplement Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Magnesium Glycinate 400mg"
                    className="w-full bg-secondary border border-border/70 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Serving Description
                  </label>
                  <input
                    type="text"
                    value={customServing}
                    onChange={e => setCustomServing(e.target.value)}
                    placeholder="e.g. 1 capsule, 2 tablets, 1 scoop"
                    className="w-full bg-secondary border border-border/70 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Category & Macros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={e => setCustomCalories(e.target.value)}
                    className="w-full bg-secondary border border-border/70 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={customProtein}
                    onChange={e => setCustomProtein(e.target.value)}
                    className="w-full bg-secondary border border-border/70 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={e => setCustomCarbs(e.target.value)}
                    className="w-full bg-secondary border border-border/70 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    value={customFats}
                    onChange={e => setCustomFats(e.target.value)}
                    className="w-full bg-secondary border border-border/70 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Micronutrient Selection & Dosing Section */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span>💊 What Vitamins &amp; Minerals Does It Contain?</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Tap to toggle, enter dose
                  </span>
                </div>

                {/* Quick Toggle Chips for all 12 key micronutrients */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(RDA_REFERENCE).map(([key, ref]) => {
                    const isSelected = key in customMicros;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleNutrient(key)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary/20 text-primary border-primary/50 shadow-xs'
                            : 'bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground'
                        }`}
                      >
                        <span>{ref.icon}</span>
                        <span>{ref.name}</span>
                        {isSelected && <Lucide.Check size={11} className="stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Configured Micronutrients Inputs with live % RDA */}
                <div className="space-y-2 pt-2">
                  {Object.keys(customMicros).length === 0 ? (
                    <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 text-center text-xs text-muted-foreground italic">
                      No micronutrients added yet. Tap any vitamin or mineral chip above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(customMicros).map(([key, amt]) => {
                        const ref = RDA_REFERENCE[key];
                        if (!ref) return null;
                        const pct = Math.round((amt / ref.target) * 100);
                        return (
                          <div
                            key={key}
                            className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">{ref.icon}</span>
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs text-foreground block truncate">
                                  {ref.name}
                                </span>
                                <span className={`text-[9.5px] font-mono font-bold ${pct >= 100 ? 'text-emerald-400' : 'text-sky-400'}`}>
                                  {pct}% of {ref.target} {ref.unit} RDA
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={amt}
                                onChange={e => handleUpdateNutrientAmount(key, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-surface border border-border/80 rounded-lg px-2 py-1 text-xs font-mono font-black text-center text-foreground outline-none focus:border-primary"
                              />
                              <span className="text-[10px] text-muted-foreground font-mono w-6">
                                {ref.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleNutrient(key)}
                                className="p-1 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Remove nutrient"
                              >
                                <Lucide.Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Custom */}
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Lucide.Plus size={16} className="stroke-[3]" />
                <span>Save &amp; Log Custom Supplement to Today</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
