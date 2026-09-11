'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';
import {
  getAllFoods,
  saveCustomFoodToLibrary,
  getQuickSuggestions,
  saveQuickSuggestion,
  calculateNutrientsForGrams,
  detectEmojiFromDishName,
  lookupCommonFoodNutrition,
  FoodItem,
} from './indianFoodDatabase';
import { createPortal } from 'react-dom';
import { MealType, LoggedFood } from './NutritionPlateVisualizer';
import EmojiPickerModal from './EmojiPickerModal';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMeal?: MealType;
  onAddFood: (food: Omit<LoggedFood, 'id' | 'time'>) => void;
}

export default function AddFoodModal({
  isOpen,
  onClose,
  defaultMeal = 'lunch',
  onAddFood,
}: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'south' | 'main' | 'protein' | 'foreign' | 'breakfast' | 'snack' | 'custom'
  >('all');
  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMeal);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);

  // Foods state including persisted custom foods
  const [allFoodsList, setAllFoodsList] = useState<FoodItem[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<FoodItem[]>([]);

  // Emoji Picker State
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Grams customization modal for library item
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<FoodItem | null>(null);
  const [libraryGramsInput, setLibraryGramsInput] = useState<string>('100');

  // Custom Form State
  const [customName, setCustomName] = useState('');
  const [customGrams, setCustomGrams] = useState('100');
  const [customServing, setCustomServing] = useState('1 serving (100g)');
  const [customCalories, setCustomCalories] = useState('120');
  const [customProtein, setCustomProtein] = useState('10');
  const [customCarbs, setCustomCarbs] = useState('15');
  const [customFats, setCustomFats] = useState('3');
  const [customEmoji, setCustomEmoji] = useState('🥗');
  const [saveToQuickSuggestion, setSaveToQuickSuggestion] = useState(true);
  const [autoMatchedFood, setAutoMatchedFood] = useState<string | null>(null);

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
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Load foods and quick suggestions
  useEffect(() => {
    if (isOpen) {
      setAllFoodsList(getAllFoods());
      setQuickSuggestions(getQuickSuggestions());
    }
  }, [isOpen]);

  // Sync defaultMeal prop
  useEffect(() => {
    setTargetMeal(defaultMeal);
  }, [defaultMeal]);

  // Real-time emoji detection and nutrition auto-lookup while user types dish name
  const handleCustomNameChange = (val: string) => {
    setCustomName(val);
    const autoEmoji = detectEmojiFromDishName(val);
    if (autoEmoji) {
      setCustomEmoji(autoEmoji);
    }

    const g = parseFloat(customGrams) || 100;
    if (val.trim().length >= 2) {
      const match = lookupCommonFoodNutrition(val, g);
      if (match) {
        setCustomCalories(String(match.calories));
        setCustomProtein(String(match.protein));
        setCustomCarbs(String(match.carbs));
        setCustomFats(String(match.fats));
        if (match.emoji) {
          setCustomEmoji(match.emoji);
        }
        setAutoMatchedFood(`${match.matchedName} (${g}g)`);
        return;
      }
    }
    setAutoMatchedFood(null);
  };

  // Proportionally recalculate custom macros when grams change
  const handleCustomGramsChange = (newGramsStr: string) => {
    setCustomGrams(newGramsStr);
    const g = parseFloat(newGramsStr);
    if (!isNaN(g) && g > 0) {
      setCustomServing(`1 serving (${g}g)`);
      if (customName.trim().length >= 2) {
        const match = lookupCommonFoodNutrition(customName, g);
        if (match) {
          setCustomCalories(String(match.calories));
          setCustomProtein(String(match.protein));
          setCustomCarbs(String(match.carbs));
          setCustomFats(String(match.fats));
          setAutoMatchedFood(`${match.matchedName} (${g}g)`);
        }
      }
    }
  };

  // Filtered food list
  const filteredFoods = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allFoodsList.filter(item => {
      const matchCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'custom'
          ? item.isCustom
          : item.category === selectedCategory;

      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [allFoodsList, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Add standard library item directly
  const handleAddDirect = (item: FoodItem, grams?: number) => {
    const finalGrams = grams || item.standardGrams || 100;
    const nutrients = calculateNutrientsForGrams(item, finalGrams);

    onAddFood({
      foodId: item.id,
      name: item.name,
      serving: `${finalGrams}g`,
      standardGrams: item.standardGrams,
      grams: finalGrams,
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fats: nutrients.fats,
      icon: item.icon,
      meal: targetMeal,
      quantity: selectedMultiplier,
    });
    onClose();
  };

  // Add custom food and append to library
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const g = parseFloat(customGrams) || 100;
    const cal = parseFloat(customCalories) || 100;
    const pro = parseFloat(customProtein) || 5;
    const carb = parseFloat(customCarbs) || 10;
    const fat = parseFloat(customFats) || 2;

    const newFoodItem: FoodItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      category: 'main',
      serving: customServing.trim() || `${g}g`,
      standardGrams: g,
      calories: cal,
      protein: pro,
      carbs: carb,
      fats: fat,
      icon: customEmoji || '🥗',
      isCustom: true,
    };

    // 1. Permanently append to library
    const updatedList = saveCustomFoodToLibrary(newFoodItem);
    setAllFoodsList(updatedList);

    // 2. Optionally add to quick suggestions
    if (saveToQuickSuggestion) {
      saveQuickSuggestion(newFoodItem);
    }

    // 3. Add to today's logged plate
    onAddFood({
      foodId: newFoodItem.id,
      name: newFoodItem.name,
      serving: newFoodItem.serving,
      standardGrams: g,
      grams: g,
      calories: cal,
      protein: pro,
      carbs: carb,
      fats: fat,
      icon: newFoodItem.icon,
      meal: targetMeal,
      quantity: selectedMultiplier,
    });

    onClose();
  };

  const applyQuickSuggestion = (item: FoodItem) => {
    handleAddDirect(item);
  };

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const modalContent = (
    <>
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
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl bg-surface-elevated border border-border/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden my-auto z-10 cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                <Lucide.Utensils size={18} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider">
                  Log Food
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Search fitness foods with grams scaling
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

          {/* Target Meal & Multiplier Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/50 p-3 rounded-2xl border border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Meal:</span>
              <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border/60 text-[11px] font-bold">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetMeal(m)}
                    className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-all ${
                      targetMeal === m
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Multiplier:</span>
              <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border/60 text-[10px] font-mono font-bold">
                {[0.5, 1, 1.5, 2].map(mult => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setSelectedMultiplier(mult)}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer transition-all ${
                      selectedMultiplier === mult
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Suggestions Chips Bar */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <span>⚡ Quick One-Tap Suggestions:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold no-scrollbar">
              {quickSuggestions.map(s => (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => applyQuickSuggestion(s)}
                  className="px-2.5 py-1 bg-secondary/80 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 border border-border/60 rounded-xl transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-xs"
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                  <span className="opacity-70 font-mono">({s.calories} kcal)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Switcher: Library vs Custom Food */}
          <div className="flex rounded-xl bg-secondary/80 p-1 border border-border/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🍛 Food Library ({allFoodsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>✍️ Create Custom Food (+Auto Save to Library)</span>
            </button>
          </div>

          {/* TAB 1: FOOD LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="relative">
                <Lucide.Search className="absolute left-3 top-3 text-muted-foreground" size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search foods (e.g. keerai, roti, dosa, chicken, egg, oats, salmon)..."
                  className="w-full bg-secondary border border-border/70 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-foreground outline-none focus:border-emerald-400 placeholder:font-normal"
                />
              </div>

              {/* Category Filter Pills (Generous spacing, no-scrollbar, no vertical clipping) */}
              <div className="py-1.5 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold border-b border-border/40 pb-2.5 no-scrollbar shrink-0 min-h-[44px]">
                {[
                  { id: 'all', label: 'All Foods' },
                  { id: 'south', label: '🌴 South Indian' },
                  { id: 'main', label: '🍲 North Curries & Rice' },
                  { id: 'protein', label: '🍗 High-Protein' },
                  { id: 'foreign', label: '🥑 Global Fitness' },
                  { id: 'breakfast', label: '🥞 Breakfast' },
                  { id: 'snack', label: '☕ Chai & Snacks' },
                  { id: 'custom', label: '⭐ My Custom' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id as any)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all border ${
                      selectedCategory === c.id
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Food List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-48">
                {filteredFoods.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-medium space-y-2">
                    <p>No food matches "{searchQuery}".</p>
                    <button
                      onClick={() => {
                        setCustomName(searchQuery);
                        setActiveTab('custom');
                      }}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      + Create "{searchQuery}" as Custom Food
                    </button>
                  </div>
                ) : (
                  filteredFoods.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-secondary/40 hover:bg-secondary/70 border border-border/60 rounded-2xl flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl p-2 bg-surface rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-foreground truncate">{item.name}</span>
                            {item.isCustom && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {item.serving && item.serving.toLowerCase().includes('g')
                              ? item.serving
                              : `${item.serving || '1 serving'} (${item.standardGrams || 100}g)`}{' '}
                            • <span className="text-sky-400 font-bold">{item.protein}g P</span> •{' '}
                            <span className="text-amber-400 font-bold">{item.carbs}g C</span> •{' '}
                            <span className="text-rose-400 font-bold">{item.fats}g F</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-black text-xs text-foreground">
                            {Math.round(item.calories * selectedMultiplier)}
                          </span>
                          <span className="text-[9px] text-muted-foreground block font-bold">kcal</span>
                        </div>

                        {/* Adjust Grams Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLibraryItem(item);
                            setLibraryGramsInput(String(item.standardGrams || 100));
                          }}
                          className="px-2.5 py-1.5 bg-secondary hover:bg-surface text-muted-foreground hover:text-foreground text-[10px] font-bold rounded-xl border border-border/60 transition-all cursor-pointer"
                          title="Custom grams"
                        >
                          Set Grams
                        </button>

                        {/* Quick Add Button */}
                        <button
                          onClick={() => handleAddDirect(item)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          <Lucide.Plus size={12} /> Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE CUSTOM FOOD */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between text-xs text-primary font-bold">
                <span>⭐ Any dish created here is automatically saved to your Food Library!</span>
              </div>

              {/* Food Name & Icon/Emoji with Auto-detection & Interactive Picker */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Food / Dish Name (Auto-selects Icon)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="e.g. keerai poriyal, chicken salad, oats, fish..."
                    value={customName}
                    onChange={e => handleCustomNameChange(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold outline-none focus:border-emerald-400"
                  />
                  {customName.length >= 80 && (
                    <span className="text-[10px] text-amber-500 font-semibold block animate-fadeIn">
                      Food name limit reached (80/80)
                    </span>
                  )}
                  <span className="text-[9.5px] text-muted-foreground block">
                    Typing auto-detects emoji (or tap the icon button on the right to browse).
                  </span>
                </div>

                {/* Clickable Icon Button that opens Emoji Search Window */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Icon / Emoji</label>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(true)}
                    className="w-full h-10 bg-secondary hover:bg-surface border border-border/70 rounded-xl flex items-center justify-center gap-1.5 text-xl transition-all cursor-pointer group shadow-xs"
                    title="Click to search & choose emoji"
                  >
                    <span>{customEmoji}</span>
                    <Lucide.Search size={11} className="text-muted-foreground group-hover:text-primary" />
                  </button>
                  <span className="text-[9px] text-muted-foreground text-center block">Tap to pick</span>
                </div>
              </div>

              {/* Grams & Serving Description */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Weight in Grams (g)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={customGrams}
                    onChange={e => handleCustomGramsChange(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold outline-none focus:border-emerald-400"
                    placeholder="100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Serving Description
                  </label>
                  <input
                    type="text"
                    value={customServing}
                    onChange={e => setCustomServing(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-medium outline-none focus:border-emerald-400"
                    placeholder="1 bowl (120g)"
                  />
                </div>
              </div>

              {/* Auto-Calculated Nutrition Indicator Banner */}
              {autoMatchedFood && (
                <div className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl flex items-center justify-between text-xs text-emerald-400 font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-emerald-500/25 rounded-lg text-emerald-300">
                      <Lucide.Sparkles size={13} />
                    </span>
                    <span>
                      Auto-matched profile: <span className="text-white underline decoration-emerald-400">{autoMatchedFood}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium bg-surface/50 px-2 py-0.5 rounded-md">
                    KCAL &amp; macros scaled to grams
                  </span>
                </div>
              )}

              {/* Calories, Protein, Carbs, Fats (Pre-populated & Fully Editable) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    value={customCalories}
                    onChange={e => setCustomCalories(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-black outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProtein}
                    onChange={e => setCustomProtein(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold outline-none focus:border-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={e => setCustomCarbs(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Fats (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFats}
                    onChange={e => setCustomFats(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Pin to Quick Suggestions Checkbox */}
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveToQuickSuggestion}
                  onChange={e => setSaveToQuickSuggestion(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>Also pin this dish to Quick Suggestions for instant one-tap logging</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Save to Library &amp; Add to {targetMeal.toUpperCase()}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Grams Adjustment Modal for Library Item */}
      {selectedLibraryItem && (
        <div 
          onClick={() => setSelectedLibraryItem(null)}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-surface-elevated border border-border/80 rounded-3xl p-5 shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedLibraryItem.icon}</span>
                <h4 className="text-sm font-black text-foreground">{selectedLibraryItem.name}</h4>
              </div>
              <button
                onClick={() => setSelectedLibraryItem(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <Lucide.X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Specify Custom Grams (g)
              </label>
              <input
                type="number"
                step="5"
                value={libraryGramsInput}
                onChange={e => setLibraryGramsInput(e.target.value)}
                className="w-full bg-secondary border border-border/70 rounded-xl px-3 py-2 text-foreground font-mono font-black text-sm outline-none focus:border-emerald-400"
                placeholder="100"
              />

              {/* Quick Grams Buttons */}
              <div className="flex gap-1 pt-1">
                {[50, 100, 150, 200, 250].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setLibraryGramsInput(String(g))}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                      libraryGramsInput === String(g)
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Preview */}
            {(() => {
              const g = parseFloat(libraryGramsInput) || selectedLibraryItem.standardGrams || 100;
              const n = calculateNutrientsForGrams(selectedLibraryItem, g);
              return (
                <div className="bg-secondary/50 p-3 rounded-xl border border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">Yield:</span>
                  <div className="space-x-2 font-mono font-bold">
                    <span className="text-foreground">{n.calories} kcal</span>
                    <span className="text-sky-400">{n.protein}g Pro</span>
                    <span className="text-amber-400">{n.carbs}g C</span>
                    <span className="text-rose-400">{n.fats}g F</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedLibraryItem(null)}
                className="px-3 py-2 bg-secondary text-muted-foreground text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const g = parseFloat(libraryGramsInput) || selectedLibraryItem.standardGrams || 100;
                  handleAddDirect(selectedLibraryItem, g);
                  setSelectedLibraryItem(null);
                }}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-sm cursor-pointer"
              >
                Add to {targetMeal.toUpperCase()}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive Emoji Search & Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelectEmoji={emoji => setCustomEmoji(emoji)}
        currentEmoji={customEmoji}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
