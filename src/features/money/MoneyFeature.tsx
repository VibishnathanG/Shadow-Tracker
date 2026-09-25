'use client';
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShadowTrackerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useViewPreference } from '@/lib/viewPreferences';

export type ExpenseCategory = 'Shopping' | 'Food' | 'Bills' | 'Other';
export type Expense = { id: string; date: string; amount: number; category: ExpenseCategory; note: string };
export type SubItem = { id: string; name: string; amount: number; isPaid?: boolean };
export type SubscriptionItem = {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  renewalDay: number; // 1 to 31
  category?: string;
  isAutoRenew?: boolean;
};

export type GlobalStats = {
  income: number;
  savings: number;
  profits?: number;
  bigExpenses: SubItem[];
  investments: SubItem[];
  lentBorrowed: SubItem[];
  subscriptions?: SubscriptionItem[];
};

export type CategoryBudgets = Record<ExpenseCategory, number>;

const DEFAULT_CATEGORY_BUDGETS: CategoryBudgets = {
  Shopping: 0,
  Food: 0,
  Bills: 0,
  Other: 0,
};

import {
  MoneyPresetItem,
  DEFAULT_SUBSCRIPTION_PRESETS,
  DEFAULT_INVESTMENT_PRESETS,
  DEFAULT_BIG_EXPENSE_PRESETS,
} from '@/lib/moneyPresets';

export type { MoneyPresetItem };
export { DEFAULT_SUBSCRIPTION_PRESETS, DEFAULT_INVESTMENT_PRESETS, DEFAULT_BIG_EXPENSE_PRESETS };

const COMMON_SUBSCRIPTION_SUGGESTIONS = DEFAULT_SUBSCRIPTION_PRESETS;

const COMMON_EXPENSE_SUGGESTIONS = [
  { name: 'Groceries', category: 'Shopping' as ExpenseCategory, emoji: '🛒' },
  { name: 'Swiggy / Zomato', category: 'Food' as ExpenseCategory, emoji: '🍕' },
  { name: 'Coffee / Cafe', category: 'Food' as ExpenseCategory, emoji: '☕' },
  { name: 'Uber / Cab', category: 'Other' as ExpenseCategory, emoji: '🚕' },
  { name: 'Fuel / Petrol', category: 'Bills' as ExpenseCategory, emoji: '⛽' },
  { name: 'Dining Out', category: 'Food' as ExpenseCategory, emoji: '🍽️' },
  { name: 'Pharmacy / Medicine', category: 'Bills' as ExpenseCategory, emoji: '💊' },
  { name: 'Electricity Bill', category: 'Bills' as ExpenseCategory, emoji: '⚡' },
];

const COMMON_SUB_ITEM_SUGGESTIONS: Record<string, { name: string; emoji: string }[]> = {
  lentBorrowed: [
    { name: 'Lent to Friend', emoji: '🤝' },
    { name: 'Borrowed for Emergency', emoji: '🤝' },
    { name: 'Apartment Security Deposit', emoji: '🔑' },
    { name: 'Splitwise Balance', emoji: '🧾' },
  ],
};

// Smooth, robust currency input that doesn't jump or desync
const EditableCurrencyInput = ({
  value,
  onChange,
  className = '',
  placeholder = '0',
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState(value > 0 ? value.toString() : '');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalText(value > 0 ? value.toLocaleString() : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setLocalText(raw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const num = parseFloat(raw);
      onChange(isNaN(num) ? 0 : num);
    }, 250);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalText(value > 0 ? value.toString() : '');
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsFocused(false);
    const num = parseFloat(localText.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      setLocalText(num.toLocaleString());
      onChange(num);
    } else {
      setLocalText('');
      onChange(0);
    }
  };

  return (
    <input
      type="text"
      maxLength={12}
      value={localText}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default function MoneyFeature() {
  const { settings, updateSettings } = useShadowTrackerStore(
    useShallow(state => ({
      settings: state.settings,
      updateSettings: state.updateSettings,
    }))
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const currentMonthStr = useMemo(() => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`, [currentDate]);

  // Available months for direct month selector dropdown (covers full 24-month 2-year dataset)
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const now = new Date();
    for (let offset = -24; offset <= 12; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      list.push({ key, label });
    }
    return list;
  }, []);

  // Per-Month Financial Data Map
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, { budgetCap: number; categoryBudgets?: CategoryBudgets; stats: GlobalStats }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shadow_money_months_v4');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    const curKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return {
      [curKey]: {
        budgetCap: 0,
        categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS },
        stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [], subscriptions: [] }
      }
    };
  });

  // Current Month Active Data
  const currentMonthData = useMemo(() => {
    return monthlyDataMap[currentMonthStr] || {
      budgetCap: 0,
      categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS },
      stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [], subscriptions: [] }
    };
  }, [monthlyDataMap, currentMonthStr]);

  const stats = currentMonthData.stats;
  const budgetCap = currentMonthData.budgetCap;
  const categoryBudgets: CategoryBudgets = currentMonthData.categoryBudgets || { ...DEFAULT_CATEGORY_BUDGETS };

  const updateCurrentMonthData = useCallback((updater: (prev: { budgetCap: number; categoryBudgets?: CategoryBudgets; stats: GlobalStats }) => { budgetCap: number; categoryBudgets?: CategoryBudgets; stats: GlobalStats }) => {
    setMonthlyDataMap(prev => {
      const existing = prev[currentMonthStr] || {
        budgetCap: 0,
        categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS },
        stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [], subscriptions: [] }
      };
      const updated = updater(existing);
      const nextMap = { ...prev, [currentMonthStr]: updated };
      if (typeof window !== 'undefined') {
        localStorage.setItem('shadow_money_months_v4', JSON.stringify(nextMap));
      }
      return nextMap;
    });
  }, [currentMonthStr]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<'bigExpenses' | 'investments' | 'lentBorrowed' | 'subscriptions' | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedDay !== null || activeSubModal !== null) {
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
    }
  }, [selectedDay, activeSubModal]);

  // Load expenses & monthly data map (reactive to demo data loads and imports)
  useEffect(() => {
    const loadFromStorage = () => {
      if (typeof window !== 'undefined') {
        const savedExp = localStorage.getItem('shadow_money_expenses_v4');
        if (savedExp) {
          try {
            const parsed = JSON.parse(savedExp);
            if (Array.isArray(parsed)) setExpenses(parsed);
          } catch (e) {}
        }
        const savedMonths = localStorage.getItem('shadow_money_months_v4');
        if (savedMonths) {
          try {
            const parsedMonths = JSON.parse(savedMonths);
            if (parsedMonths && typeof parsedMonths === 'object') setMonthlyDataMap(parsedMonths);
          } catch (e) {}
        }
      }
    };
    loadFromStorage();
    window.addEventListener('shadow_money_updated', loadFromStorage);
    window.addEventListener('shadow_data_imported', loadFromStorage);
    return () => {
      window.removeEventListener('shadow_money_updated', loadFromStorage);
      window.removeEventListener('shadow_data_imported', loadFromStorage);
    };
  }, []);

  // Save expenses (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('shadow_money_expenses_v4', JSON.stringify(expenses));
        useShadowTrackerStore.getState().checkAndUnlockBadges();
      } catch (e) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [expenses]);

  // Form Inputs for Day Expense Modal
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>('Shopping');
  const [noteInput, setNoteInput] = useState('');

  // Sub-items Form Inputs
  const [subNameInput, setSubNameInput] = useState('');
  const [subAmountInput, setSubAmountInput] = useState('');
  const [subRenewalDay, setSubRenewalDay] = useState('1');
  const [subBillingCycle, setSubBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [saveAsPreset, setSaveAsPreset] = useState(false);

  // 1. Subscription Presets (Customizable & Editable)
  const [subPresets, setSubPresets] = useState<MoneyPresetItem[]>(() => {
    if (settings?.customSubscriptionPresets && settings.customSubscriptionPresets.length > 0) {
      return settings.customSubscriptionPresets as MoneyPresetItem[];
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shadow_custom_sub_presets_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_SUBSCRIPTION_PRESETS;
  });

  // 2. Investment Presets (Customizable & Editable with Fixed Monthly Values)
  const [invPresets, setInvPresets] = useState<MoneyPresetItem[]>(() => {
    if (settings?.customInvestmentPresets && settings.customInvestmentPresets.length > 0) {
      return settings.customInvestmentPresets as MoneyPresetItem[];
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shadow_custom_investment_presets_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_INVESTMENT_PRESETS;
  });

  // 3. Big Fixed Expense Presets (Customizable & Editable with Fixed Monthly Values)
  const [bigExpensePresets, setBigExpensePresets] = useState<MoneyPresetItem[]>(() => {
    if (settings?.customBigExpensePresets && settings.customBigExpensePresets.length > 0) {
      return settings.customBigExpensePresets as MoneyPresetItem[];
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shadow_custom_big_expense_presets_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_BIG_EXPENSE_PRESETS;
  });

  // Sync state if settings update from external changes (cloud pull / backup import)
  useEffect(() => {
    if (settings?.customSubscriptionPresets && settings.customSubscriptionPresets.length > 0) {
      setSubPresets(settings.customSubscriptionPresets as MoneyPresetItem[]);
    }
  }, [settings?.customSubscriptionPresets]);

  useEffect(() => {
    if (settings?.customInvestmentPresets && settings.customInvestmentPresets.length > 0) {
      setInvPresets(settings.customInvestmentPresets as MoneyPresetItem[]);
    }
  }, [settings?.customInvestmentPresets]);

  useEffect(() => {
    if (settings?.customBigExpensePresets && settings.customBigExpensePresets.length > 0) {
      setBigExpensePresets(settings.customBigExpensePresets as MoneyPresetItem[]);
    }
  }, [settings?.customBigExpensePresets]);

  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetEmoji, setNewPresetEmoji] = useState('🍿');
  const [newPresetCycle, setNewPresetCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    setIsEditingPresets(false);
    setSaveAsPreset(false);
    setNewPresetName('');
    setNewPresetAmount('');
    if (activeSubModal === 'subscriptions') {
      setNewPresetEmoji('🍿');
    } else if (activeSubModal === 'investments') {
      setNewPresetEmoji('📈');
    } else if (activeSubModal === 'bigExpenses') {
      setNewPresetEmoji('🏠');
    }
  }, [activeSubModal]);

  // Unified updater for presets (syncs state, localStorage, and Settings file)
  const updatePresetsForCategory = useCallback((
    category: 'subscriptions' | 'investments' | 'bigExpenses',
    newPresets: MoneyPresetItem[]
  ) => {
    if (category === 'subscriptions') {
      setSubPresets(newPresets);
      try {
        localStorage.setItem('shadow_custom_sub_presets_v1', JSON.stringify(newPresets));
      } catch {}
      updateSettings({ customSubscriptionPresets: newPresets });
    } else if (category === 'investments') {
      setInvPresets(newPresets);
      try {
        localStorage.setItem('shadow_custom_investment_presets_v1', JSON.stringify(newPresets));
      } catch {}
      updateSettings({ customInvestmentPresets: newPresets });
    } else if (category === 'bigExpenses') {
      setBigExpensePresets(newPresets);
      try {
        localStorage.setItem('shadow_custom_big_expense_presets_v1', JSON.stringify(newPresets));
      } catch {}
      updateSettings({ customBigExpensePresets: newPresets });
    }
  }, [updateSettings]);

  const handleUpdatePresetAmount = useCallback((category: 'subscriptions' | 'investments' | 'bigExpenses', presetName: string, newAmount: number) => {
    const list = category === 'subscriptions' ? subPresets : category === 'investments' ? invPresets : bigExpensePresets;
    const updated = list.map(p => p.name.toLowerCase() === presetName.toLowerCase() ? { ...p, amount: newAmount } : p);
    updatePresetsForCategory(category, updated);
  }, [subPresets, invPresets, bigExpensePresets, updatePresetsForCategory]);

  const handleDeletePreset = useCallback((category: 'subscriptions' | 'investments' | 'bigExpenses', presetName: string) => {
    const list = category === 'subscriptions' ? subPresets : category === 'investments' ? invPresets : bigExpensePresets;
    const updated = list.filter(p => p.name.toLowerCase() !== presetName.toLowerCase());
    updatePresetsForCategory(category, updated);
  }, [subPresets, invPresets, bigExpensePresets, updatePresetsForCategory]);

  const handleAddCustomPreset = useCallback((category: 'subscriptions' | 'investments' | 'bigExpenses', e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !newPresetAmount) return;
    const cleanAmount = parseFloat(newPresetAmount.replace(/,/g, '')) || 0;
    const defaultEmoji = category === 'subscriptions' ? '🍿' : category === 'investments' ? '📈' : '🏠';
    const newP: MoneyPresetItem = {
      name: newPresetName.trim(),
      amount: cleanAmount,
      cycle: category === 'subscriptions' ? newPresetCycle : undefined,
      emoji: newPresetEmoji.trim() || defaultEmoji
    };
    const list = category === 'subscriptions' ? subPresets : category === 'investments' ? invPresets : bigExpensePresets;
    const updated = [...list.filter(p => p.name.toLowerCase() !== newP.name.toLowerCase()), newP];
    updatePresetsForCategory(category, updated);
    setNewPresetName('');
    setNewPresetAmount('');
  }, [newPresetName, newPresetAmount, newPresetCycle, newPresetEmoji, subPresets, invPresets, bigExpensePresets, updatePresetsForCategory]);

  const handleResetPresets = useCallback((category: 'subscriptions' | 'investments' | 'bigExpenses') => {
    const defaults = category === 'subscriptions' ? DEFAULT_SUBSCRIPTION_PRESETS : category === 'investments' ? DEFAULT_INVESTMENT_PRESETS : DEFAULT_BIG_EXPENSE_PRESETS;
    updatePresetsForCategory(category, defaults);
  }, [updatePresetsForCategory]);

  // Chart filters & View Mode (Persisted)
  const [chartFilters, setChartFilters] = useState({ spend: true, income: true, savings: true, investments: true });
  const [viewMode, setViewMode] = useViewPreference('moneyViewMode') as ['month' | 'week', (v: 'month' | 'week') => void];
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(0);

  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);

  const calendarWeeks = useMemo(() => {
    const weeks: { weekIdx: number; startDay: number; endDay: number; days: number[] }[] = [];
    let currentWeekDays: number[] = [];
    let currentWeekIdx = 0;
    let currentStartDay = 1;

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeekDays.push(day);
      const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
      if (dayOfWeek === 6 || day === daysInMonth) {
        weeks.push({
          weekIdx: currentWeekIdx,
          startDay: currentStartDay,
          endDay: day,
          days: [...currentWeekDays]
        });
        currentWeekIdx++;
        currentStartDay = day + 1;
        currentWeekDays = [];
      }
    }
    return weeks;
  }, [daysInMonth, firstDayOfMonth]);

  const prevMonth = useCallback(() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)), []);

  const monthYearStr = useMemo(() => currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [currentDate]);

  const getExpensesForDay = useCallback((day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return expenses.filter(e => e.date === dateStr);
  }, [currentDate, expenses]);


  const handleAddExpense = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(amountInput.replace(/,/g, ''));
    if (!selectedDay || isNaN(cleanAmt) || cleanAmt <= 0) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 11),
      date: dateStr,
      amount: cleanAmt,
      category: categoryInput,
      note: noteInput.trim()
    };
    
    setExpenses(prev => [...prev, newExpense]);
    setAmountInput('');
    setNoteInput('');
  }, [selectedDay, amountInput, currentDate, categoryInput, noteInput]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  // Sub-items handling (Big Expenses, Investments, Lent/Borrowed, Subscriptions)
  const handleAddSubItem = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(subAmountInput.replace(/,/g, ''));
    if (!activeSubModal || !subNameInput.trim() || isNaN(cleanAmt) || cleanAmt <= 0) return;

    // Save as preset if user checked the option (subscriptions, investments, or bigExpenses)
    if (saveAsPreset && (activeSubModal === 'subscriptions' || activeSubModal === 'investments' || activeSubModal === 'bigExpenses')) {
      const list = activeSubModal === 'subscriptions' ? subPresets : activeSubModal === 'investments' ? invPresets : bigExpensePresets;
      const defaultEmoji = activeSubModal === 'subscriptions' ? '🍿' : activeSubModal === 'investments' ? '📈' : '🏠';
      const existing = list.find(p => p.name.toLowerCase() === subNameInput.trim().toLowerCase());
      const itemToSave: MoneyPresetItem = {
        name: subNameInput.trim(),
        amount: cleanAmt,
        emoji: existing?.emoji || defaultEmoji,
        cycle: activeSubModal === 'subscriptions' ? subBillingCycle : undefined,
      };
      const updated = [...list.filter(p => p.name.toLowerCase() !== itemToSave.name.toLowerCase()), itemToSave];
      updatePresetsForCategory(activeSubModal, updated);
    }

    if (activeSubModal === 'subscriptions') {
      const newSub: SubscriptionItem = {
        id: Math.random().toString(36).substring(2, 11),
        name: subNameInput.trim(),
        amount: cleanAmt,
        billingCycle: subBillingCycle,
        renewalDay: Math.min(31, Math.max(1, parseInt(subRenewalDay, 10) || 1)),
        isAutoRenew: true,
      };

      updateCurrentMonthData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          subscriptions: [...(prev.stats.subscriptions || []), newSub]
        }
      }));
    } else {
      const newItem: SubItem = {
        id: Math.random().toString(36).substring(2, 11),
        name: subNameInput.trim(),
        amount: cleanAmt,
        isPaid: false
      };
      
      updateCurrentMonthData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [activeSubModal]: [...(prev.stats[activeSubModal] || []), newItem]
        }
      }));
    }

    setSubNameInput('');
    setSubAmountInput('');
    setSaveAsPreset(false);
  }, [activeSubModal, subNameInput, subAmountInput, subRenewalDay, subBillingCycle, saveAsPreset, subPresets, invPresets, bigExpensePresets, updatePresetsForCategory, updateCurrentMonthData]);

  const handleDeleteSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed' | 'subscriptions') => {
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [list]: (prev.stats[list] as any[] || []).filter(item => item.id !== id)
      }
    }));
  }, [updateCurrentMonthData]);
  
  const handleToggleSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed' | 'subscriptions') => {
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [list]: (prev.stats[list] as any[] || []).map(item => {
          if (item.id === id) {
            return list === 'subscriptions' ? { ...item, isAutoRenew: !item.isAutoRenew } : { ...item, isPaid: !item.isPaid };
          }
          return item;
        })
      }
    }));
  }, [updateCurrentMonthData]);

  const updateScalarStat = useCallback((key: 'income' | 'savings' | 'profits', val: number) => {
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [key]: val
      }
    }));
  }, [updateCurrentMonthData]);

  const totalBigExpenses = useMemo(() => (stats.bigExpenses || []).reduce((sum, item) => sum + item.amount, 0), [stats.bigExpenses]);
  const totalInvestments = useMemo(() => (stats.investments || []).reduce((sum, item) => sum + item.amount, 0), [stats.investments]);
  const totalSubscriptions = useMemo(() => (stats.subscriptions || []).reduce((sum, item) => sum + (item.billingCycle === 'yearly' ? Math.round(item.amount / 12) : item.amount), 0), [stats.subscriptions]);

  const calendarExpensesThisMonth = useMemo(() => expenses.filter(e => e.date.startsWith(currentMonthStr)), [expenses, currentMonthStr]);
  const totalCalendarSpend = useMemo(() => calendarExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0), [calendarExpensesThisMonth]);

  const currentWeekStats = useMemo(() => {
    const currentWeek = calendarWeeks[selectedWeekIdx] || calendarWeeks[0];
    if (!currentWeek) return { totalSpend: 0, dailyAvg: 0, activeDays: 0, dayCount: 0 };
    let total = 0;
    let activeDays = 0;
    currentWeek.days.forEach(day => {
      const dayExp = getExpensesForDay(day);
      const daySum = dayExp.reduce((sum, e) => sum + e.amount, 0) + (day === 1 ? totalBigExpenses : 0);
      total += daySum;
      if (daySum > 0) activeDays++;
    });
    const dayCount = currentWeek.days.length;
    const dailyAvg = dayCount > 0 ? Math.round(total / dayCount) : 0;
    return { totalSpend: total, dailyAvg, activeDays, dayCount };
  }, [calendarWeeks, selectedWeekIdx, getExpensesForDay, totalBigExpenses]);
  
  // Monthly Outflow = Daily Calendar Spends + Big Fixed Expenses + Recurring Subscriptions
  const monthlyOutflow = useMemo(() => totalCalendarSpend + totalBigExpenses + totalSubscriptions, [totalCalendarSpend, totalBigExpenses, totalSubscriptions]);

  // Grand Allocation = Monthly Outflow + Total Investments
  const totalGrandSpend = useMemo(() => monthlyOutflow + totalInvestments, [monthlyOutflow, totalInvestments]);

  // Unallocated Cash Balance = Income - Grand Allocation - Savings
  const leftoverMoney = useMemo(() => (stats.income || 0) - totalGrandSpend - (stats.savings || 0), [stats.income, totalGrandSpend, stats.savings]);

  const budgetPct = useMemo(() => Math.round((totalCalendarSpend / (budgetCap || 1)) * 100), [totalCalendarSpend, budgetCap]);

  const handleAddProfitsToSavings = useCallback(() => {
    const profitAmt = stats.profits || 0;
    if (profitAmt <= 0) return alert('No profits to transfer right now!');
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        savings: (prev.stats.savings || 0) + profitAmt,
        profits: 0,
      }
    }));
    alert(`Transferred ₹${profitAmt.toLocaleString()} profit directly into Total Savings!`);
  }, [stats.profits, updateCurrentMonthData]);

  // Historical data for chart
  const historicalData = useMemo(() => {
    const result: { month: string; Spend: number; Income: number; Savings: number; Investments: number }[] = [];
    const date = new Date(currentDate);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mName = d.toLocaleString('default', { month: 'short' });

      const mData = monthlyDataMap[mStr];
      const monthExpenses = expenses.filter(e => e.date.startsWith(mStr));
      const mSpend = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const mIncome = mData?.stats?.income || 0;
      const mSavings = mData?.stats?.savings || 0;
      const mInvestments = (mData?.stats?.investments || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);

      result.push({
        month: mName,
        Spend: mSpend,
        Income: mIncome,
        Savings: mSavings,
        Investments: mInvestments,
      });
    }

    return result;
  }, [currentDate, monthlyDataMap, expenses]);

  return (
    <>
      <div className="space-y-6 relative pb-16">
        {/* Header Tile */}
        <div className="tile settings-tile p-3.5 sm:p-5 rounded-3xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <Lucide.Wallet size={18} />
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground leading-tight">Wealth</h1>
            </div>

            {/* Month Switcher Segment - 1 Neat and Clean Outer Rectangle */}
            <div className="flex items-center gap-1 px-1.5 py-1 bg-surface-elevated/90 border border-border/80 rounded-xl shadow-xs shrink-0">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <Lucide.ChevronLeft size={14} />
              </button>

              <div className="relative flex items-center px-1.5 py-0.5 cursor-pointer group">
                <Lucide.Calendar size={13} className="text-primary mr-1.5 shrink-0 pointer-events-none" />
                <select
                  value={currentMonthStr}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setCurrentDate(new Date(y, m - 1, 1));
                  }}
                  className="pr-4 py-0.5 font-mono text-xs font-black uppercase tracking-wider text-foreground cursor-pointer group-hover:text-primary transition-colors appearance-none bg-transparent border-0 outline-none shadow-none ring-0 focus:ring-0 focus:outline-none"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                  title="Select Month"
                >
                  {availableMonths.map(m => (
                    <option key={m.key} value={m.key} className="bg-surface text-foreground font-semibold text-xs capitalize">
                      {m.label}
                    </option>
                  ))}
                </select>
                <Lucide.ChevronDown size={11} className="text-muted-foreground pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" />
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                title="Next Month"
                aria-label="Next Month"
              >
                <Lucide.ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Unified Subscription button (Mobile & Desktop) */}
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveSubModal('subscriptions')}
              className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              title="Subscription"
            >
              <Lucide.Repeat size={13} className="shrink-0" />
              <span>Subscription</span>
              {(stats.subscriptions || []).length > 0 && (
                <span className="bg-purple-500 text-white px-1.5 py-0.2 text-[9px] font-mono rounded-full shrink-0">
                  {(stats.subscriptions || []).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 7 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Monthly Income */}
          <div className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold">
                <Lucide.ArrowDownCircle size={15} /> Income
              </div>
              <Lucide.Pencil size={11} className="opacity-40" />
            </div>
            <div className="flex items-baseline font-mono font-black text-emerald-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-emerald-500/70">₹</span>
              <EditableCurrencyInput 
                value={stats.income || 0} 
                onChange={(val) => updateScalarStat('income', val)}
                className="bg-transparent border-none text-emerald-400 focus:outline-none w-full p-0 font-mono font-black"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Direct monthly input</p>
          </div>

          {/* 2. Total Spend */}
          <div className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-orange-500/30 bg-orange-500/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-orange-400 font-extrabold">
                <Lucide.Activity size={15} /> Total Spend
              </div>
              <Lucide.Calculator size={12} className="opacity-40" />
            </div>
            <div className="font-mono font-black text-orange-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-orange-500/70">₹</span>{totalGrandSpend.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Daily + Big + Subs + Inv</p>
          </div>

          {/* 3. Remaining Balance */}
          <div className={`tile settings-tile p-3.5 sm:p-4 rounded-2xl space-y-1 ${leftoverMoney < 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className={`flex items-center gap-1.5 font-extrabold ${leftoverMoney < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                <Lucide.Sparkles size={15} /> Remaining
              </div>
              <Lucide.Calculator size={12} className="opacity-40" />
            </div>
            <div className={`font-mono font-black text-lg sm:text-xl ${leftoverMoney < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <span className="text-xs mr-0.5 opacity-70">₹</span>{leftoverMoney.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Unallocated cash</p>
          </div>

          {/* 4. Big Expenses */}
          <div 
            onClick={() => setActiveSubModal('bigExpenses')}
            className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-sky-500/30 bg-sky-500/5 space-y-1 cursor-pointer hover:border-sky-500/60 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                <Lucide.CreditCard size={15} /> Big Fixed
              </div>
              <Lucide.ChevronRight size={14} className="text-sky-400" />
            </div>
            <div className="font-mono font-black text-sky-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-sky-500/70">₹</span>{totalBigExpenses.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Rent, EMIs, lumpsum</p>
          </div>

          {/* 5. Total Savings */}
          <div className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-sky-500/30 bg-sky-500/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                <Lucide.PiggyBank size={15} /> Savings
              </div>
              <Lucide.Pencil size={11} className="opacity-40" />
            </div>
            <div className="flex items-baseline font-mono font-black text-sky-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-sky-500/70">₹</span>
              <EditableCurrencyInput 
                value={stats.savings || 0} 
                onChange={(val) => updateScalarStat('savings', val)}
                className="bg-transparent border-none text-sky-400 focus:outline-none w-full p-0 font-mono font-black"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Emergency &amp; goals</p>
          </div>

          {/* 6. Investments */}
          <div 
            onClick={() => setActiveSubModal('investments')}
            className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-purple-500/30 bg-purple-500/5 space-y-1 cursor-pointer hover:border-purple-500/60 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-purple-400 font-extrabold">
                <Lucide.TrendingUp size={15} /> Investments
              </div>
              <Lucide.ChevronRight size={14} className="text-purple-400" />
            </div>
            <div className="font-mono font-black text-purple-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-purple-500/70">₹</span>{totalInvestments.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">SIP, stocks, assets</p>
          </div>

          {/* 7. Profits */}
          <div className="tile settings-tile p-3.5 sm:p-4 rounded-2xl border-amber-500/30 bg-amber-500/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold">
                <Lucide.Zap size={15} /> Profits
              </div>
              <button 
                onClick={handleAddProfitsToSavings}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[9px] font-extrabold uppercase transition-all cursor-pointer"
                title="Transfer profit into savings"
              >
                Save
              </button>
            </div>
            <div className="flex items-baseline font-mono font-black text-amber-400 text-lg sm:text-xl">
              <span className="text-xs mr-0.5 text-amber-500/70">₹</span>
              <EditableCurrencyInput 
                value={stats.profits || 0} 
                onChange={(val) => updateScalarStat('profits', val)}
                className="bg-transparent border-none text-amber-400 focus:outline-none w-full p-0 font-mono font-black"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Trading / side gains</p>
          </div>
        </div>

        {/* Subscriptions Radar Banner (If active subscriptions exist) */}
        {(stats.subscriptions || []).length > 0 && (
          <div className="tile settings-tile p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Lucide.Repeat size={18} />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Recurring Subscriptions Active</h4>
                <p className="text-[11px] text-muted-foreground">
                  {(stats.subscriptions || []).length} services tracked • Monthly Burn: <strong className="text-purple-400">₹{totalSubscriptions.toLocaleString()}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(stats.subscriptions || []).slice(0, 3).map(sub => (
                <span key={sub.id} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface border border-border/80 text-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {sub.name}: ₹{sub.amount} (Day {sub.renewalDay})
                </span>
              ))}
              <button
                onClick={() => setActiveSubModal('subscriptions')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 ml-1 cursor-pointer"
              >
                Manage &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Calendar Expense Grid */}
        <div className="tile settings-tile overflow-hidden rounded-3xl flex flex-col relative z-10 min-h-[420px]">
          {/* Header with Month/Week View toggle */}
          <div className="p-3.5 sm:p-4 border-b border-border/60 bg-surface/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lucide.Calendar size={18} className="text-primary" />
              <span className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">Daily Calendar Spends</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Week Spend & Key Metrics - Only shown when Week View is active */}
              {viewMode === 'week' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-black shadow-xs">
                    <Lucide.TrendingDown size={13} className="text-emerald-400" />
                    <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold">Total Spend:</span>
                    <span>₹{currentWeekStats.totalSpend.toLocaleString()}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-border/70 text-foreground font-mono text-xs font-bold">
                    <span className="text-[10px] text-muted-foreground uppercase font-sans">Avg/Day:</span>
                    <span>₹{currentWeekStats.dailyAvg.toLocaleString()}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border/70 text-[10px] text-muted-foreground font-bold">
                    <span>Active:</span>
                    <span className="text-foreground font-mono">{currentWeekStats.activeDays}/{currentWeekStats.dayCount}d</span>
                  </div>
                </div>
              )}

              <div className="flex items-center p-0.5 rounded-xl bg-surface border border-border/80 text-xs font-bold">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'month' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Full Month
                </button>
                <button
                  onClick={() => { setViewMode('week'); setSelectedWeekIdx(0); }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Week View
                </button>
              </div>
            </div>
          </div>

          {/* Week selector if week mode */}
          {viewMode === 'week' && (
            <div className="px-3 py-2 border-b border-border/60 bg-surface/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mr-1 shrink-0">Week:</span>
              {calendarWeeks.map((w, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWeekIdx(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedWeekIdx === idx
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  W{idx + 1} (Day {w.startDay}–{w.endDay})
                </button>
              ))}
            </div>
          )}

          {/* Day of week headers */}
          <div className="hidden sm:grid grid-cols-7 border-b border-border/60 bg-surface/50 text-center text-xs font-black uppercase tracking-wider text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2.5 border-r border-border/50 last:border-r-0">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={`grid grid-cols-5 sm:grid-cols-7 flex-1 ${viewMode === 'week' ? 'auto-rows-[minmax(95px,1fr)] sm:auto-rows-[minmax(115px,1fr)]' : 'auto-rows-[minmax(110px,1fr)] sm:auto-rows-[minmax(130px,1fr)]'}`}>
            {viewMode === 'month' && Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden sm:block border-b border-r border-border/40 bg-black/5" />
            ))}

            {(viewMode === 'month' 
              ? Array.from({ length: daysInMonth }).map((_, i) => i + 1)
              : (calendarWeeks[selectedWeekIdx]?.days || [])
            ).map((day) => {
              const dayExpenses = getExpensesForDay(day);
              const isFirstDay = day === 1;
              const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0) + (isFirstDay ? totalBigExpenses : 0);
              const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(firstDayOfMonth + day - 1) % 7];

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`border-b border-r border-border/50 p-2 relative cursor-pointer group transition-all flex flex-col justify-start hover:bg-surface-elevated/80 ${
                    selectedDay === day ? 'bg-primary/10 ring-1 ring-inset ring-primary' : 'bg-surface/20'
                  }`}
                >
                  <div className="flex items-baseline justify-between pb-1 border-b border-border/30 mb-1">
                    <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{day}</span>
                    <span className="text-[8.5px] font-bold text-muted-foreground uppercase">{dayOfWeek}</span>
                  </div>

                  {/* List of day items */}
                  <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                    {dayExpenses.slice(0, 3).map(e => (
                      <div key={e.id} className="text-[10px] flex items-center justify-between gap-1 px-1.5 py-0.5 rounded bg-surface border border-border/50 truncate">
                        <span className="text-muted-foreground truncate">{e.note || e.category}</span>
                        <span className="font-extrabold text-rose-400 shrink-0">₹{e.amount}</span>
                      </div>
                    ))}
                    {dayExpenses.length > 3 && (
                      <span className="text-[9px] font-extrabold text-primary block text-center">+{dayExpenses.length - 3} more</span>
                    )}
                  </div>

                  {dayTotal > 0 && (
                    <div className="mt-auto pt-1 flex justify-end">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        ₹{dayTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Envelopes & Category Guards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Budget Cap Guard */}
          <div className="tile settings-tile p-5 rounded-3xl space-y-4 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lucide.ShieldAlert className="text-amber-400" size={18} />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Budget Cap Guard</h3>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                budgetPct > 90 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                budgetPct > 70 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {budgetPct > 90 ? 'Over Target' : budgetPct > 70 ? 'Caution' : 'Healthy'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs font-bold">
                <span className="text-muted-foreground">Monthly Cap:</span>
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span>₹</span>
                  <EditableCurrencyInput
                    value={budgetCap || 0}
                    onChange={val => updateCurrentMonthData(prev => ({ ...prev, budgetCap: val }))}
                    className="w-24 bg-surface border border-border/80 rounded-lg px-2 py-0.5 text-right text-xs font-black text-foreground focus:border-amber-400"
                    placeholder="0"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Spent ₹{totalCalendarSpend.toLocaleString()} of ₹{budgetCap.toLocaleString()} ({budgetPct}%)
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border/40 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetPct)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Category Breakdown */}
          <div className="tile settings-tile p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Lucide.PieChart className="text-primary" size={18} />
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Category Breakdown</h3>
            </div>

            <div className="space-y-2.5">
              {(['Shopping', 'Food', 'Bills', 'Other'] as ExpenseCategory[]).map(cat => {
                const amount = calendarExpensesThisMonth.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                const pct = totalCalendarSpend > 0 ? Math.round((amount / totalCalendarSpend) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-foreground">{cat}</span>
                      <span className="text-muted-foreground font-mono">₹{amount.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Emergency Reserve */}
          <div className="tile settings-tile p-5 rounded-3xl space-y-4 border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center gap-2">
              <Lucide.ShieldCheck className="text-sky-400" size={18} />
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Emergency Reserve</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-bold">Safety Net Cushion:</span>
                <span className="text-lg font-black text-sky-400 font-mono">
                  {((stats.savings || 0) / (monthlyOutflow || 1)).toFixed(1)} Months
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {(stats.savings || 0) / (monthlyOutflow || 1) >= 3 
                  ? '🟢 Strong financial cushion (3+ months expenses covered).' 
                  : (stats.savings || 0) / (monthlyOutflow || 1) >= 1 
                  ? '🟡 Moderate safety net. Build toward 3-6 months.' 
                  : '🚨 Low safety net reserve. Focus on accumulating savings.'}
              </p>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span className="text-emerald-400 font-extrabold font-mono">
                {stats.income > 0 ? Math.round(((stats.savings || 0) / stats.income) * 100) : 0}% of Income
              </span>
            </div>
          </div>
        </div>

        {/* 6-Month Trajectory Area Chart */}
        <div className="tile settings-tile p-4 sm:p-5 rounded-3xl space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-foreground">Financial Trajectory</h2>
                {historicalData.length > 0 && (() => {
                  const latest = historicalData[historicalData.length - 1];
                  const mNet = (latest?.Income || 0) - (latest?.Spend || 0);
                  const mReserves = (latest?.Savings || 0) + (latest?.Investments || 0);
                  return (
                    <>
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                        mNet >= 0 
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}>
                        <Lucide.TrendingUp size={11} className={mNet >= 0 ? '' : 'rotate-180'} />
                        {mNet >= 0 ? `+₹${mNet.toLocaleString()} Surplus` : `-₹${Math.abs(mNet).toLocaleString()} Deficit`}
                      </span>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                        ₹{mReserves.toLocaleString()} Reserves
                      </span>
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Historical comparison (Last 6 months) • Hover to inspect</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {(() => {
                const latest = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
                return [
                  { id: 'spend', label: 'Spend', value: latest?.Spend, color: '#f97316' },
                  { id: 'income', label: 'Income', value: latest?.Income, color: '#10b981' },
                  { id: 'savings', label: 'Savings', value: latest?.Savings, color: '#0ea5e9' },
                  { id: 'investments', label: 'Investments', value: latest?.Investments, color: '#a855f7' },
                ].map(filter => {
                  const isEnabled = chartFilters[filter.id as keyof typeof chartFilters];
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setChartFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id as keyof typeof chartFilters] }))}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isEnabled ? 'bg-surface text-foreground border-border shadow-2xs' : 'text-muted-foreground/60 border-transparent hover:text-muted-foreground'
                      }`}
                      title={`Toggle ${filter.label} line`}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isEnabled ? filter.color : '#94a3b8' }} />
                      <span>{filter.label}</span>
                      <span className="font-mono text-[10.5px] opacity-80">
                        ₹{filter.value ? (filter.value >= 1000 ? `${(filter.value / 1000).toFixed(0)}k` : filter.value) : '0'}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          <div className="h-[280px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const mIncome = data.Income || 0;
                      const mSpend = data.Spend || 0;
                      const mNet = mIncome - mSpend;
                      return (
                        <div className="bg-surface-elevated/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-xl text-xs space-y-2 min-w-[190px]">
                          <div className="flex items-center justify-between border-b border-border/60 pb-1.5 font-bold">
                            <span className="text-foreground">{label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold ${mNet >= 0 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>
                              {mNet >= 0 ? `+₹${mNet.toLocaleString()}` : `-₹${Math.abs(mNet).toLocaleString()}`}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((entry: any) => (
                              <div key={entry.name} className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                  {entry.name}
                                </span>
                                <span className="font-mono font-bold text-foreground">
                                  ₹{Number(entry.value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {chartFilters.income && <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />}
                {chartFilters.spend && <Area type="monotone" dataKey="Spend" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />}
                {chartFilters.savings && <Area type="monotone" dataKey="Savings" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSavings)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />}
                {chartFilters.investments && <Area type="monotone" dataKey="Investments" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInvestments)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals Portal */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <>
          {/* Day Expense Modal */}
          <AnimatePresence>
            {selectedDay !== null && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelectedDay(null)}
                onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{ touchAction: 'none' }}
              >
                <div 
                  className="w-full max-w-md bg-surface-elevated border border-border/80 text-foreground rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
                  onClick={e => e.stopPropagation()}
                  style={{ overscrollBehavior: 'contain' }}
                >
                  <div className="p-4 border-b border-border/60 flex justify-between items-center bg-surface/50 shrink-0">
                    <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <Lucide.Calendar size={16} className="text-primary"/> Log Expense • {monthYearStr} {selectedDay}
                    </h3>
                    <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground cursor-pointer">
                      <Lucide.X size={16} />
                    </button>
                  </div>
                  
                  <div 
                    className="p-5 space-y-4 overflow-y-auto max-h-[75vh] overscroll-contain touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                  >
                    <form onSubmit={handleAddExpense} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount (₹)</label>
                          <input 
                            type="number" 
                            required 
                            step="0.01" 
                            value={amountInput} 
                            onChange={e=>setAmountInput(e.target.value)} 
                            className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold focus:border-primary outline-none" 
                            placeholder="0.00" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                          <select 
                            value={categoryInput} 
                            onChange={e=>setCategoryInput(e.target.value as ExpenseCategory)} 
                            className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold focus:border-primary outline-none cursor-pointer"
                          >
                            <option value="Shopping">Shopping</option>
                            <option value="Food">Food</option>
                            <option value="Bills">Bills</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Note / Item Name</label>
                        <input 
                          type="text" 
                          maxLength={100}
                          value={noteInput} 
                          onChange={e=>setNoteInput(e.target.value)} 
                          className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-medium focus:border-primary outline-none" 
                          placeholder="e.g. Groceries, Coffee, Uber..." 
                        />
                        {/* Quick Common Expense Suggestions */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {COMMON_EXPENSE_SUGGESTIONS.map(s => (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => {
                                setNoteInput(s.name);
                                setCategoryInput(s.category);
                              }}
                              className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>{s.emoji}</span>
                              <span>{s.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        Add Daily Expense
                      </button>
                    </form>

                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Logged on Day {selectedDay}</span>
                      {getExpensesForDay(selectedDay).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-3">No expenses recorded for this day.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {getExpensesForDay(selectedDay).map(e => (
                            <div key={e.id} className="flex justify-between items-center bg-secondary/50 border border-border/50 rounded-xl p-2.5 text-xs">
                              <div>
                                <span className="font-bold text-foreground">{e.category}</span>
                                {e.note && <span className="text-muted-foreground text-[11px] ml-1.5">• {e.note}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-rose-400">₹{e.amount.toLocaleString()}</span>
                                <button onClick={() => handleDeleteExpense(e.id)} className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer">
                                  <Lucide.Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Sub-Items / Subscriptions Modal */}
          <AnimatePresence>
            {activeSubModal !== null && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setActiveSubModal(null)}
                onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{ touchAction: 'none' }}
              >
                <div 
                  className="w-full max-w-md bg-surface-elevated border border-border/80 text-foreground rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
                  onClick={e => e.stopPropagation()}
                  style={{ overscrollBehavior: 'contain' }}
                >
                  <div className="p-4 border-b border-border/60 flex justify-between items-center bg-surface/50 shrink-0">
                    <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      {activeSubModal === 'bigExpenses' ? <Lucide.CreditCard size={16} className="text-sky-400"/> : 
                       activeSubModal === 'investments' ? <Lucide.TrendingUp size={16} className="text-purple-400"/> :
                       activeSubModal === 'subscriptions' ? <Lucide.Repeat size={16} className="text-purple-400"/> :
                       <Lucide.Users size={16} className="text-amber-400"/>}
                      {activeSubModal === 'bigExpenses' ? 'Monthly Big Expenses' : 
                       activeSubModal === 'investments' ? 'Investments Portfolio' :
                       activeSubModal === 'subscriptions' ? 'Recurring Subscriptions Radar' : 'Lent & Borrowed'}
                    </h3>
                    <button onClick={() => setActiveSubModal(null)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground cursor-pointer">
                      <Lucide.X size={16} />
                    </button>
                  </div>

                  <div 
                    className="p-5 space-y-4 overflow-y-auto max-h-[75vh] overscroll-contain touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                  >
                    <form onSubmit={handleAddSubItem} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            {activeSubModal === 'subscriptions' ? 'Name / Service' : activeSubModal === 'investments' ? 'Name / Asset' : 'Name / Service'}
                          </label>
                          <input 
                            type="text" 
                            required 
                            maxLength={60}
                            value={subNameInput} 
                            onChange={e=>setSubNameInput(e.target.value)} 
                            className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold focus:border-primary outline-none" 
                            placeholder={
                              activeSubModal === 'subscriptions' ? 'Netflix, AWS, Gym...' :
                              activeSubModal === 'investments' ? 'Nifty 50, Gold SGB, PPF...' :
                              activeSubModal === 'bigExpenses' ? 'House Rent, Car EMI, Cook...' :
                              'Lent to friend, deposit...'
                            } 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            {activeSubModal === 'investments' ? 'Monthly SIP / Value (₹)' : 'Amount (₹)'}
                          </label>
                          <input 
                            type="number" 
                            required 
                            value={subAmountInput} 
                            onChange={e=>setSubAmountInput(e.target.value)} 
                            className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-mono font-bold focus:border-primary outline-none" 
                            placeholder="0" 
                          />
                        </div>
                      </div>

                      {/* Quick Suggestions / Presets with Auto-Fill and Custom Add Options */}
                      {activeSubModal && activeSubModal !== 'lentBorrowed' && (() => {
                        const activeCategory = activeSubModal as 'subscriptions' | 'investments' | 'bigExpenses';
                        const currentPresets = activeCategory === 'subscriptions' ? subPresets : activeCategory === 'investments' ? invPresets : bigExpensePresets;
                        const categoryLabel = activeCategory === 'subscriptions' ? 'Popular Services' : activeCategory === 'investments' ? 'Popular Assets' : 'Common Fixed Spends';

                        return (
                          <div className="space-y-2 p-3 rounded-2xl bg-surface/60 border border-border/70">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Lucide.Sparkles size={12} className="text-primary" />
                                {categoryLabel} {isEditingPresets ? '(Edit Mode)' : '(Auto-Fill)'}:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingPresets(prev => !prev)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                    isEditingPresets
                                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                      : 'bg-surface text-muted-foreground hover:text-foreground border-border/80'
                                  }`}
                                >
                                  {isEditingPresets ? 'Done' : '✏️ Edit / + Add'}
                                </button>
                                {isEditingPresets && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetPresets(activeCategory)}
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg text-muted-foreground hover:text-rose-400 cursor-pointer"
                                    title="Reset presets to default"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>

                            {!isEditingPresets ? (
                              /* Read & Auto-Fill Mode */
                              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                                {currentPresets.map(preset => (
                                  <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => {
                                      setSubNameInput(preset.name);
                                      setSubAmountInput(String(preset.amount));
                                      if (preset.cycle && activeCategory === 'subscriptions') {
                                        setSubBillingCycle(preset.cycle);
                                      }
                                    }}
                                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <span>{preset.emoji}</span>
                                    <span>{preset.name}</span>
                                    <span className="text-[9px] text-primary font-mono font-bold">₹{preset.amount.toLocaleString()}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              /* Manage & Edit Presets Mode */
                              <div className="space-y-2.5">
                                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                  {currentPresets.map(preset => (
                                    <div key={preset.name} className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface border border-border/60 text-xs">
                                      <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                        <span>{preset.emoji}</span>
                                        <span className="truncate">{preset.name}</span>
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] text-muted-foreground font-bold">₹</span>
                                        <input
                                          type="number"
                                          value={preset.amount}
                                          onChange={(e) => handleUpdatePresetAmount(activeCategory, preset.name, parseFloat(e.target.value) || 0)}
                                          className="w-16 bg-surface-elevated border border-border rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-foreground focus:border-primary outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePreset(activeCategory, preset.name)}
                                          className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                          title="Delete preset"
                                        >
                                          <Lucide.Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Add New Custom Preset Row */}
                                <div className="pt-2 border-t border-border/60 space-y-1.5">
                                  <span className="text-[9.5px] font-bold text-muted-foreground uppercase">
                                    Add Custom {activeCategory === 'subscriptions' ? 'Service' : activeCategory === 'investments' ? 'Asset' : 'Fixed Spend'} Preset:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      maxLength={4}
                                      placeholder="Icon"
                                      value={newPresetEmoji}
                                      onChange={(e) => setNewPresetEmoji(e.target.value)}
                                      className="w-12 bg-surface border border-border/80 rounded-xl px-1.5 py-1 text-center text-xs outline-none focus:border-primary"
                                    />
                                    <input
                                      type="text"
                                      maxLength={50}
                                      placeholder={activeCategory === 'subscriptions' ? 'Service Name' : activeCategory === 'investments' ? 'Asset Name' : 'Item Name'}
                                      value={newPresetName}
                                      onChange={(e) => setNewPresetName(e.target.value)}
                                      className="flex-1 bg-surface border border-border/80 rounded-xl px-2 py-1 text-xs outline-none focus:border-primary"
                                    />
                                    <input
                                      type="number"
                                      placeholder="₹ Value"
                                      value={newPresetAmount}
                                      onChange={(e) => setNewPresetAmount(e.target.value)}
                                      className="w-20 bg-surface border border-border/80 rounded-xl px-2 py-1 text-xs font-mono font-bold outline-none focus:border-primary"
                                    />
                                    {activeCategory === 'subscriptions' && (
                                      <select
                                        value={newPresetCycle}
                                        onChange={e => setNewPresetCycle(e.target.value as any)}
                                        className="bg-surface border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold outline-none cursor-pointer"
                                      >
                                        <option value="monthly">Mo</option>
                                        <option value="yearly">Yr</option>
                                      </select>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => handleAddCustomPreset(activeCategory, e)}
                                      disabled={!newPresetName.trim() || !newPresetAmount}
                                      className="bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-bold text-xs rounded-xl px-2.5 py-1 cursor-pointer transition-all shadow-xs"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Checkbox to optionally save newly added items to presets */}
                      {activeSubModal && activeSubModal !== 'lentBorrowed' && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground select-none pt-0.5">
                          <input
                            type="checkbox"
                            checked={saveAsPreset}
                            onChange={e => setSaveAsPreset(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="flex items-center gap-1.5">
                            <Lucide.Sparkles size={12} className="text-primary" />
                            Save to quick suggestions with fixed monthly value
                          </span>
                        </label>
                      )}

                      {activeSubModal === 'lentBorrowed' && COMMON_SUB_ITEM_SUGGESTIONS.lentBorrowed && (
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-bold text-muted-foreground uppercase">Common Suggestions:</span>
                          <div className="flex flex-wrap gap-1">
                            {COMMON_SUB_ITEM_SUGGESTIONS.lentBorrowed.map(item => (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => setSubNameInput(item.name)}
                                className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg bg-surface border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>{item.emoji}</span>
                                <span>{item.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSubModal === 'subscriptions' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Cycle</label>
                            <select
                              value={subBillingCycle}
                              onChange={e => setSubBillingCycle(e.target.value as any)}
                              className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold focus:border-primary outline-none cursor-pointer"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Renewal Day (1-31)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={subRenewalDay}
                              onChange={e => setSubRenewalDay(e.target.value)}
                              className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-foreground text-xs font-bold focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        Add Item
                      </button>
                    </form>

                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Current Items</span>
                      {(stats[activeSubModal] as any[] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-3">No items added yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {(stats[activeSubModal] as any[] || []).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-secondary/50 border border-border/50 rounded-xl p-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => handleToggleSubItem(item.id, activeSubModal)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${
                                    (item.isPaid || item.isAutoRenew) ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                                  }`}
                                >
                                  {(item.isPaid || item.isAutoRenew) && <Lucide.Check size={11} strokeWidth={3} />}
                                </button>
                                <div>
                                  <span className={`font-bold text-foreground ${item.isPaid ? 'line-through opacity-60' : ''}`}>{item.name}</span>
                                  {activeSubModal === 'subscriptions' && (
                                    <span className="text-[10px] text-muted-foreground ml-1.5">
                                      • Renews Day {item.renewalDay} ({item.billingCycle})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-foreground">₹{item.amount.toLocaleString()}</span>
                                <button onClick={() => handleDeleteSubItem(item.id, activeSubModal)} className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer">
                                  <Lucide.Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
