'use client';
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useShadowTrackerStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

type ExpenseCategory = 'Shopping' | 'Food' | 'Bills' | 'Other';
type Expense = { id: string; date: string; amount: number; category: ExpenseCategory; note: string };
type SubItem = { id: string; name: string; amount: number; isPaid?: boolean };
type GlobalStats = { income: number; savings: number; profits?: number; bigExpenses: SubItem[]; investments: SubItem[]; lentBorrowed: SubItem[] };

const TileArtIncome = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08] select-none z-0">
    <motion.svg className="w-full h-full text-emerald-500" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.line x1="20" y1="100" x2="20" y2="40" stroke="currentColor" strokeWidth="0.5" animate={{ y2: [80, 40, 80] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.line x1="50" y1="100" x2="50" y2="20" stroke="currentColor" strokeWidth="0.5" animate={{ y2: [70, 20, 70] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.line x1="80" y1="100" x2="80" y2="50" stroke="currentColor" strokeWidth="0.5" animate={{ y2: [90, 50, 90] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  </div>
);

const TileArtSavings = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08] select-none z-0">
    <motion.svg className="w-full h-full text-sky-500" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.4" animate={{ r: [10, 30], opacity: [1, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeOut' }} />
      <motion.circle cx="50" cy="50" r="1" fill="currentColor" />
    </motion.svg>
  </div>
);

const TileArtInvestments = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08] select-none z-0">
    <motion.svg className="w-full h-full text-purple-500" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.path d="M 0,80 Q 25,60 50,40 T 100,10" fill="none" stroke="currentColor" strokeWidth="0.6" animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
    </motion.svg>
  </div>
);

const getInitialExpenses = (): Expense[] => [];

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
  const [text, setText] = useState<string>(value > 0 ? value.toLocaleString() : '');

  useEffect(() => {
    if (value === 0 && text === '') return;
    const numericLocal = parseFloat(text.replace(/,/g, ''));
    if (isNaN(numericLocal) || numericLocal !== value) {
      setText(value > 0 ? value.toLocaleString() : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const cleaned = raw.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleBlur = () => {
    const cleaned = text.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      setText(num.toLocaleString());
    } else {
      setText('');
    }
  };

  return (
    <input
      type="text"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default function MoneyFeature() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>(getInitialExpenses);
  
  const currentMonthStr = useMemo(() => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`, [currentDate]);

  // Per-Month Financial Data Map: YYYY-MM -> GlobalStats & budgetCap
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, { budgetCap: number; stats: GlobalStats }>>(() => {
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
        stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [] }
      }
    };
  });

  // Current Month Active Stats
  const currentMonthData = useMemo(() => {
    return monthlyDataMap[currentMonthStr] || {
      budgetCap: 0,
      stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [] }
    };
  }, [monthlyDataMap, currentMonthStr]);

  const stats = currentMonthData.stats;
  const budgetCap = currentMonthData.budgetCap;

  const updateCurrentMonthData = useCallback((updater: (prev: { budgetCap: number; stats: GlobalStats }) => { budgetCap: number; stats: GlobalStats }) => {
    setMonthlyDataMap(prev => {
      const existing = prev[currentMonthStr] || {
        budgetCap: 0,
        stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [] }
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
  const [activeSubModal, setActiveSubModal] = useState<'bigExpenses' | 'investments' | 'lentBorrowed' | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedDay !== null || activeSubModal !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedDay, activeSubModal]);

  useEffect(() => {
    const handleResetEvent = () => {
      const curKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      setExpenses([]);
      setMonthlyDataMap({
        [curKey]: {
          budgetCap: 0,
          stats: { income: 0, savings: 0, profits: 0, bigExpenses: [], investments: [], lentBorrowed: [] }
        }
      });
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    };

    const handleImportEvent = () => {
      if (typeof window !== 'undefined') {
        const savedExp = localStorage.getItem('shadow_money_expenses_v4');
        if (savedExp) {
          try { setExpenses(JSON.parse(savedExp)); } catch (e) {}
        }
        const savedMonths = localStorage.getItem('shadow_money_months_v4');
        if (savedMonths) {
          try { setMonthlyDataMap(JSON.parse(savedMonths)); } catch (e) {}
        }
      }
    };

    window.addEventListener('shadowResetAllData', handleResetEvent);
    window.addEventListener('shadow_data_imported', handleImportEvent);
    return () => {
      window.removeEventListener('shadowResetAllData', handleResetEvent);
      window.removeEventListener('shadow_data_imported', handleImportEvent);
    };
  }, []);
  
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>('Shopping');
  const [noteInput, setNoteInput] = useState('');
  const [subNameInput, setSubNameInput] = useState('');
  const [subAmountInput, setSubAmountInput] = useState('');
  
  const [chartFilters, setChartFilters] = useState({ spend: true, income: true, savings: true, investments: true });
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExp = localStorage.getItem('shadow_money_expenses_v4');
      if (savedExp) {
        try {
          const parsed = JSON.parse(savedExp);
          if (Array.isArray(parsed)) setExpenses(parsed);
        } catch (e) {}
      } else {
        setExpenses([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadow_money_expenses_v4', JSON.stringify(expenses));
      useShadowTrackerStore.getState().checkAndUnlockBadges();
    }
  }, [expenses]);

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
      note: noteInput
    };
    
    setExpenses(prev => [...prev, newExpense]);
    setAmountInput('');
    setNoteInput('');
  }, [selectedDay, amountInput, currentDate, categoryInput, noteInput]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleAddSubItem = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(subAmountInput.replace(/,/g, ''));
    if (!activeSubModal || !subNameInput || isNaN(cleanAmt) || cleanAmt <= 0) return;
    
    const newItem: SubItem = {
      id: Math.random().toString(36).substring(2, 11),
      name: subNameInput,
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

    setSubNameInput('');
    setSubAmountInput('');
  }, [activeSubModal, subNameInput, subAmountInput, updateCurrentMonthData]);

  const handleDeleteSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed') => {
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [list]: (prev.stats[list] || []).filter(item => item.id !== id)
      }
    }));
  }, [updateCurrentMonthData]);
  
  const handleToggleSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed') => {
    updateCurrentMonthData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [list]: (prev.stats[list] || []).map(item => item.id === id ? { ...item, isPaid: !item.isPaid } : item)
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

  const totalBigExpenses = useMemo(() => stats.bigExpenses.reduce((sum, item) => sum + item.amount, 0), [stats.bigExpenses]);
  const totalInvestments = useMemo(() => stats.investments.reduce((sum, item) => sum + item.amount, 0), [stats.investments]);
  const totalLentBorrowed = useMemo(() => stats.lentBorrowed.reduce((sum, item) => sum + item.amount, 0), [stats.lentBorrowed]);

  const calendarExpensesThisMonth = useMemo(() => expenses.filter(e => e.date.startsWith(currentMonthStr)), [expenses, currentMonthStr]);
  const totalCalendarSpend = useMemo(() => calendarExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0), [calendarExpensesThisMonth]);
  
  // Monthly Living Expenses Outflow = Daily Calendar Spends + Big Fixed Expenses
  const monthlyOutflow = useMemo(() => totalCalendarSpend + totalBigExpenses, [totalCalendarSpend, totalBigExpenses]);

  // Total Grand Allocation = Monthly Living Outflow + Total Investments
  const totalGrandSpend = useMemo(() => monthlyOutflow + totalInvestments, [monthlyOutflow, totalInvestments]);

  // Unallocated Cash Balance = Income - Living Outflow - Investments - Savings Reserve
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
    alert(`Successfully transferred ₹${profitAmt.toLocaleString()} Profit directly into Total Savings!`);
  }, [stats.profits, updateCurrentMonthData]);

  const topCalendarExpenses = useMemo(() => [...calendarExpensesThisMonth].sort((a, b) => b.amount - a.amount).slice(0, 3), [calendarExpensesThisMonth]);

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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 relative"
      >
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden opacity-10">
         {useMemo(() => [...Array(6)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-32 h-32 rounded-full border border-primary/40 mix-blend-screen"
             style={{ left: Math.random() * 100 + '%', top: Math.random() * 100 + '%' }}
             animate={{ scale: [1, 1.5, 1], rotate: 360, opacity: [0.1, 0.4, 0.1] }}
             transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: 'linear' }}
           />
         )), [])}
         <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
           <path d="M 0 80 Q 25 20 50 80 T 100 80" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-emerald-500" />
           <path d="M 0 60 Q 25 90 50 60 T 100 60" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-emerald-500" />
         </svg>
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        {/* Header Tile */}
        <div className="order-0 flex justify-between items-center tile p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Lucide.Wallet size={18} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-foreground">Money Dashboard</h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{monthYearStr}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevMonth} className="p-1.5 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Lucide.ChevronLeft size={16}/></motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextMonth} className="p-1.5 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Lucide.ChevronRight size={16}/></motion.button>
          </div>
        </div>

        {/* 7 Summary Detail Cards: TOP on Desktop/Laptop (md:order-1), BOTTOM on Mobile (order-2) */}
        <div className="order-2 md:order-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3.5">
          {/* 1. Monthly Income (DIRECT DATA ENTRY) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 stat-summary-card border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5">
            <div className="stat-card-row-label">
              <Lucide.ArrowDownCircle size={16} className="text-emerald-400 shrink-0" />
              <span className="text-foreground font-extrabold tracking-tight">Income</span>
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-emerald-400/80 mr-1 select-none">₹</span>
              <EditableCurrencyInput 
                value={stats.income || 0} 
                onChange={(val) => updateScalarStat('income', val)}
                className="bg-transparent border-none text-lg sm:text-2xl font-bold font-mono text-emerald-400 focus:outline-none w-full appearance-none p-0 leading-none focus:ring-0"
                placeholder="0"
              />
              <Lucide.Pencil size={12} className="text-emerald-400/40 ml-1 shrink-0 group-hover:text-emerald-400/90 transition-colors" />
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Direct monthly input</span>
            </div>
          </motion.div>

          {/* 2. Total Spend (AUTO CALCULATED SYSTEM TOTAL) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="col-span-1 stat-summary-card border-dashed border-orange-500/40 bg-orange-500/5 hover:border-orange-500/70">
            <div className="stat-card-row-label justify-between">
              <div className="flex items-center gap-2">
                <Lucide.Activity size={16} className="text-orange-400 shrink-0" />
                <span className="text-foreground font-extrabold tracking-tight">Total Spend</span>
              </div>
              <Lucide.Calculator size={14} className="text-orange-400/60 shrink-0" />
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-orange-400/80 mr-1 select-none">₹</span>
              <span className="leading-none text-orange-400 font-bold font-mono text-lg sm:text-2xl">{totalGrandSpend.toLocaleString()}</span>
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Daily + Big Exp + Inv</span>
            </div>
          </motion.div>

          {/* 3. Left / Remaining Balance (AUTO CALCULATED SYSTEM TOTAL) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`col-span-1 stat-summary-card border-dashed ${leftoverMoney < 0 ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/70' : 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70'}`}>
            <div className="stat-card-row-label justify-between">
              <div className="flex items-center gap-2">
                <Lucide.Sparkles size={16} className={`shrink-0 ${leftoverMoney < 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className="text-foreground font-extrabold tracking-tight">Remaining</span>
              </div>
              <Lucide.Calculator size={14} className={`shrink-0 ${leftoverMoney < 0 ? 'text-rose-400/60' : 'text-emerald-400/60'}`} />
            </div>
            <div className="stat-card-row-value">
              <span className={`text-xs sm:text-sm font-semibold mr-1 select-none ${leftoverMoney < 0 ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>₹</span>
              <span className={`leading-none font-bold font-mono text-lg sm:text-2xl ${leftoverMoney < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {leftoverMoney.toLocaleString()}
              </span>
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Income − Spend − Savings</span>
            </div>
          </motion.div>

          {/* 4. Fixed Big Expenses (SUB-ITEMS ENTRY MODAL) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} onClick={() => setActiveSubModal('bigExpenses')} className="col-span-1 stat-summary-card border-sky-500/30 hover:border-sky-500/60 bg-sky-500/5 cursor-pointer">
            <div className="stat-card-row-label justify-between">
              <div className="flex items-center gap-2">
                <Lucide.CreditCard size={16} className="text-sky-400 shrink-0" />
                <span className="text-foreground font-extrabold tracking-tight">Big Expenses</span>
              </div>
              <Lucide.ChevronRight size={14} className="text-sky-400/70 shrink-0" />
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-sky-400/80 mr-1 select-none">₹</span>
              <span className="leading-none text-sky-400 font-bold font-mono text-lg sm:text-2xl">{totalBigExpenses.toLocaleString()}</span>
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Click to manage items</span>
            </div>
          </motion.div>

          {/* 5. Total Savings (DIRECT DATA ENTRY) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-1 stat-summary-card border-sky-500/30 hover:border-sky-500/60 bg-sky-500/5">
            <div className="stat-card-row-label">
              <Lucide.PiggyBank size={16} className="text-sky-400 shrink-0" />
              <span className="text-foreground font-extrabold tracking-tight">Savings</span>
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-sky-400/80 mr-1 select-none">₹</span>
              <EditableCurrencyInput 
                value={stats.savings || 0} 
                onChange={(val) => updateScalarStat('savings', val)}
                className="bg-transparent border-none text-lg sm:text-2xl font-bold font-mono text-sky-400 focus:outline-none w-full appearance-none p-0 leading-none focus:ring-0"
                placeholder="0"
              />
              <Lucide.Pencil size={12} className="text-sky-400/40 ml-1 shrink-0 group-hover:text-sky-400/90 transition-colors" />
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Direct savings input</span>
            </div>
          </motion.div>

          {/* 6. Investments (SUB-ITEMS ENTRY MODAL) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} onClick={() => setActiveSubModal('investments')} className="col-span-1 stat-summary-card border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 cursor-pointer">
            <div className="stat-card-row-label justify-between">
              <div className="flex items-center gap-2">
                <Lucide.TrendingUp size={16} className="text-purple-400 shrink-0" />
                <span className="text-foreground font-extrabold tracking-tight">Investments</span>
              </div>
              <Lucide.ChevronRight size={14} className="text-purple-400/70 shrink-0" />
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-purple-400/80 mr-1 select-none">₹</span>
              <span className="leading-none text-purple-400 font-bold font-mono text-lg sm:text-2xl">{totalInvestments.toLocaleString()}</span>
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Click to manage portfolio</span>
            </div>
          </motion.div>

          {/* 7. Profits (DIRECT DATA ENTRY + SAVE TRANSFER ACTION) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-1 stat-summary-card border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5">
            <div className="stat-card-row-label justify-between">
              <div className="flex items-center gap-2">
                <Lucide.Zap size={16} className="text-amber-400 shrink-0" />
                <span className="text-foreground font-extrabold tracking-tight">Profits</span>
              </div>
              <button 
                onClick={handleAddProfitsToSavings}
                className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[8px] font-extrabold tracking-wider uppercase flex items-center gap-0.5 transition-all shrink-0 select-none shadow-2xs"
                title="Transfer profit amount into Total Savings"
              >
                <Lucide.Plus size={8} className="shrink-0" /> Save
              </button>
            </div>
            <div className="stat-card-row-value">
              <span className="text-xs sm:text-sm font-semibold text-amber-400/80 mr-1 select-none">₹</span>
              <EditableCurrencyInput 
                value={stats.profits || 0} 
                onChange={(val) => updateScalarStat('profits', val)}
                className="bg-transparent border-none text-lg sm:text-2xl font-bold font-mono text-amber-400 focus:outline-none w-full appearance-none p-0 leading-none focus:ring-0"
                placeholder="0"
              />
              <Lucide.Pencil size={12} className="text-amber-400/40 ml-1 shrink-0 group-hover:text-amber-400/90 transition-colors" />
            </div>
            <div className="stat-card-row-meta">
              <span className="text-muted-foreground/80 font-medium">Direct profit input</span>
            </div>
          </motion.div>
        </div>

        {/* Calendar Spend Grid Container: TOP on Mobile (order-1), BOTTOM on Desktop/Laptop (md:order-2) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="order-1 md:order-2 tile overflow-hidden flex-1 flex flex-col relative z-10 min-h-[420px]">
        
        <div className="hidden sm:flex absolute inset-0 pointer-events-none z-0 items-center justify-center opacity-[0.03] overflow-hidden">
          <motion.svg className="w-[1200px] h-[1200px] text-primary" viewBox="0 0 100 100" animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
            {[...Array(20)].map((_, i) => (
              <motion.circle 
                key={i} cx="50" cy="50" r={i * 2.5 + 4} 
                fill="none" stroke="currentColor" strokeWidth="0.3" 
                strokeDasharray={`${i * 2 + 1} ${i * 3 + 2}`} 
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }} 
                transition={{ duration: 50 + i * 10, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '50px 50px' }}
              />
            ))}
          </motion.svg>
        </div>

        {/* Calendar Header with View Switcher */}
        <div className="p-3 border-b border-border bg-surface/70 flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <Lucide.Calendar size={16} className="text-primary" />
            <span className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">Calendar Spends</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border/80 text-xs font-bold">
              <button
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Full Month
              </button>
              <button
                onClick={() => {
                  setViewMode('week');
                  setSelectedWeekIdx(0);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'week'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Week View
              </button>
            </div>
          </div>
        </div>

        {/* Week Selector Chips if in Week View */}
        {viewMode === 'week' && (
          <div className="px-3 py-2 border-b border-border/60 bg-surface/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mr-1 shrink-0">Select Week:</span>
            {calendarWeeks.map((w, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWeekIdx(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
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

        <div className="hidden sm:grid grid-cols-7 border-b border-border bg-surface/50 relative z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2.5 text-center text-xs font-black uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className={`grid grid-cols-5 sm:grid-cols-7 flex-1 ${viewMode === 'week' ? 'auto-rows-[minmax(95px,1fr)] sm:auto-rows-[minmax(115px,1fr)]' : 'auto-rows-[minmax(125px,1fr)] sm:auto-rows-[minmax(140px,1fr)]'} relative z-10`}>
          {/* Render padding empty cells (Desktop 7-col view only) */}
          {viewMode === 'month' && Array.from({ length: firstDayOfMonth }).map((_, i) => (
             <div key={`empty-${i}`} className="hidden sm:block border-b border-r border-border/50 bg-black/5" />
          ))}
          {viewMode === 'week' && Array.from({ length: (firstDayOfMonth + (calendarWeeks[selectedWeekIdx]?.startDay || 1) - 1) % 7 }).map((_, i) => (
             <div key={`empty-w-${i}`} className="hidden sm:block border-b border-r border-border/50 bg-black/5" />
          ))}

          {/* Render Day Cards */}
          {(viewMode === 'month' 
            ? Array.from({ length: daysInMonth }).map((_, i) => i + 1)
            : (calendarWeeks[selectedWeekIdx]?.days || [])
          ).map((day, i) => {
            const isFirstDay = day === 1;
            const dayExpenses = getExpensesForDay(day);
            const totalSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0) + (isFirstDay ? totalBigExpenses : 0);
            const dayOfWeekName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(firstDayOfMonth + day - 1) % 7];
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
            
            // Build combined items list
            const allItems: { id: string; name: string; amount: number; isFixed: boolean }[] = [
              ...(isFirstDay ? stats.bigExpenses.map(b => ({ id: `big-${b.id}`, name: b.name, amount: b.amount, isFixed: true })) : []),
              ...dayExpenses.map(e => ({ id: e.id, name: e.note || e.category, amount: e.amount, isFixed: false }))
            ];
            
            const visibleItems = allItems.slice(0, 4);
            const remainingCount = allItems.length - 4;

            const formatCompactAmount = (amt: number) => {
              if (amt >= 1000000) {
                const val = amt / 1000000;
                return `₹${val % 1 === 0 ? val : val.toFixed(1)}M`;
              }
              if (amt >= 10000) {
                const val = amt / 1000;
                return `₹${val % 1 === 0 ? val : val.toFixed(1)}k`;
              }
              return `₹${amt.toLocaleString()}`;
            };

            return (
              <motion.div 
                key={day} 
                initial={isMobile ? false : { opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={isMobile ? { duration: 0 } : { duration: 0.3, delay: 0.2 + (i * 0.015) }}
                onClick={() => setSelectedDay(day)}
                whileHover={isMobile ? undefined : { 
                  scale: 1.03, 
                  y: -2,
                  zIndex: 10, 
                  transition: { type: 'spring', stiffness: 400, damping: 25 } 
                }}
                className={`border-b border-r border-border/50 p-1.5 sm:p-2.5 relative cursor-pointer group transition-all duration-150 flex flex-col justify-start hover:bg-surface-elevated/90 hover:border-primary/40 hover:shadow-lg ${selectedDay === day ? 'bg-primary/10 ring-1 ring-inset ring-primary' : 'bg-surface/30'}`}
              >
                {/* Day Header Line (Day Number + Day Name ONLY) */}
                <div className="w-full flex items-baseline gap-1 relative z-10 pb-0.5 sm:pb-1 border-b border-border/30 mb-1 sm:mb-1.5 shrink-0">
                  <span className={`text-xs sm:text-sm font-extrabold ${selectedDay === day ? 'text-primary' : 'text-foreground/90'} group-hover:text-foreground transition-colors`}>{day}</span>
                  <span className="text-[8px] sm:text-[9.5px] font-bold text-muted-foreground uppercase">{dayOfWeekName}</span>
                </div>
                
                {/* Entries Section */}
                <div className="w-full flex flex-col gap-0.5 sm:gap-1 overflow-hidden flex-1 min-w-0">
                  {visibleItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`text-[8.5px] sm:text-xs leading-none sm:leading-tight flex items-center justify-between rounded px-1 py-0.5 sm:px-1.5 sm:py-1 gap-1 min-w-0 shadow-2xs ${
                        item.isFixed 
                          ? 'bg-primary/15 border border-primary/30 text-primary font-extrabold' 
                          : 'bg-surface-elevated/90 border border-border/60 text-foreground font-semibold'
                      }`}
                    >
                      {item.name ? (
                        <span className="truncate min-w-0 text-muted-foreground mr-1 text-[8.5px] sm:text-xs">{item.name}</span>
                      ) : null}
                      
                      {/* Mobile view (< sm): Compact format e.g. ₹105k */}
                      <span className={`inline-block sm:hidden font-extrabold shrink-0 ml-auto leading-none text-[8.5px] ${item.isFixed ? 'text-primary' : 'text-rose-500'}`}>
                        {formatCompactAmount(item.amount)}
                      </span>

                      {/* PC / Desktop view (sm: and above): Full format e.g. ₹1,05,000 with larger font */}
                      <span className={`hidden sm:inline-block font-extrabold shrink-0 ml-auto leading-none text-xs md:text-[11.5px] ${item.isFixed ? 'text-primary' : 'text-rose-500'}`}>
                        ₹{item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  
                  {/* Clickable Plus Expansion Button for > 4 items */}
                  {remainingCount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                      }}
                      className="w-full py-0.2 sm:py-0.5 px-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[7px] sm:text-[9.5px] font-extrabold flex items-center justify-center gap-0.5 transition-colors shrink-0 select-none"
                    >
                      <Lucide.Plus size={7} className="shrink-0" /> {remainingCount} more
                    </button>
                  )}
                </div>

                {/* Day Total Spent Sum Badge */}
                {totalSpent > 0 && (
                  <div className="mt-auto pt-1 w-full flex items-center justify-end relative z-10 shrink-0">
                    {/* Mobile view (< sm): Compact format e.g. ₹105k */}
                    <span className="inline-block sm:hidden font-black text-[8.5px] px-1 py-0.2 rounded-md shadow-2xs bg-amber-500/20 text-amber-400 border border-amber-500/40 tracking-tight leading-none">
                      {formatCompactAmount(totalSpent)}
                    </span>

                    {/* PC / Desktop view (sm: and above): Full format e.g. ₹1,05,000 with larger font */}
                    <span className="hidden sm:inline-block font-black text-xs sm:text-[11.5px] md:text-xs px-2 py-0.5 rounded-md shadow-2xs bg-amber-500/20 text-amber-400 border border-amber-500/40 tracking-tight leading-none">
                      ₹{totalSpent.toLocaleString()}
                    </span>
                  </div>
                )}

                {totalSpent > 0 && (
                  <div className={`absolute inset-0 bg-primary/10 pointer-events-none ${isMobile ? '' : 'animate-pulse'}`} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>

      {/* Financial Controls & Budget Guard Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Card 1: Monthly Budget Cap Guard */}
        <div className="tile p-4 sm:p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Lucide.ShieldAlert className="text-amber-500 shrink-0" size={18} />
              <h3 className="text-sm sm:text-base font-extrabold text-foreground truncate">Budget Cap Guard</h3>
            </div>
            <span className={`text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 inline-flex items-center gap-1.5 ${
              budgetPct > 90 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
              budgetPct > 70 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                budgetPct > 90 ? 'bg-rose-500 animate-pulse' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              {budgetPct > 90 ? 'Over Target' : budgetPct > 70 ? 'Caution' : 'Healthy'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-muted-foreground">Monthly Cap:</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">₹</span>
                <EditableCurrencyInput
                  value={budgetCap || 0}
                  onChange={val => updateCurrentMonthData(prev => ({ ...prev, budgetCap: val }))}
                  className="w-24 bg-surface border border-border/80 rounded-lg px-2 py-1 text-right text-xs font-black text-foreground focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Spent ₹{totalCalendarSpend.toLocaleString()} of ₹{budgetCap.toLocaleString()} ({budgetPct}%)
            </p>
          </div>

          {/* Budget Progress Bar */}
          <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border/40 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetPct)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Category Expense Breakdown */}
        <div className="tile p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lucide.PieChart className="text-primary" size={20} />
            <h3 className="text-base font-extrabold text-foreground">Category Breakdown</h3>
          </div>

          <div className="space-y-2.5">
            {(['Shopping', 'Food', 'Bills', 'Other'] as ExpenseCategory[]).map(cat => {
              const amount = (calendarExpensesThisMonth.filter(e => e.category === cat)).reduce((s, e) => s + e.amount, 0);
              const pct = totalCalendarSpend > 0 ? Math.round((amount / totalCalendarSpend) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-foreground">{cat}</span>
                    <span className="text-muted-foreground">₹{amount.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Emergency Fund & Discipline Index */}
        <div className="tile p-4 sm:p-6 space-y-4 border-sky-500/20 bg-sky-500/5">
          <div className="flex items-center gap-2">
            <Lucide.ShieldCheck className="text-sky-500" size={20} />
            <h3 className="text-base font-extrabold text-foreground">Emergency Reserve</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground font-bold">Safety Net Cushion:</span>
              <span className="text-lg font-black text-sky-500">
                {((stats.savings || 0) / (monthlyOutflow || 1)).toFixed(1)} Months
              </span>
            </div>
            <p className="text-xs text-foreground/80 font-medium leading-relaxed">
              {(stats.savings || 0) / (monthlyOutflow || 1) >= 3 
                ? '🟢 Strong financial cushion (3+ months expenses saved).' 
                : (stats.savings || 0) / (monthlyOutflow || 1) >= 1 
                ? '🟡 Moderate safety net. Aim for 3-6 months reserve.' 
                : '🚨 Low safety net reserve. Focus on accumulating emergency savings.'}
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Savings Rate:</span>
            <span className="text-emerald-500 font-extrabold">
              {stats.income > 0 ? Math.round(((stats.savings || 0) / stats.income) * 100) : 0}% of Income
            </span>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="tile p-4 sm:p-6 relative z-10 flex flex-col gap-4 sm:gap-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Financial Trajectory</h2>
            <p className="text-sm text-muted-foreground">Historical comparison (Last 6 months)</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'spend', label: 'Spend', color: '#f97316' },
              { id: 'income', label: 'Income', color: '#10b981' },
              { id: 'savings', label: 'Savings', color: '#0ea5e9' },
              { id: 'investments', label: 'Investments', color: '#a855f7' },
            ].map(filter => (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                key={filter.id}
                onClick={() => setChartFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id as keyof typeof chartFilters] }))}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${chartFilters[filter.id as keyof typeof chartFilters] ? 'bg-surface text-foreground border-border shadow-sm' : 'bg-transparent text-muted-foreground border-transparent hover:bg-surface/50'}`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartFilters[filter.id as keyof typeof chartFilters] ? filter.color : 'gray' }} />
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--foreground)' }}
              />
              {chartFilters.income && <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />}
              {chartFilters.spend && <Area type="monotone" dataKey="Spend" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />}
              {chartFilters.savings && <Area type="monotone" dataKey="Savings" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />}
              {chartFilters.investments && <Area type="monotone" dataKey="Investments" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorInvestments)" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>

    {mounted && typeof window !== 'undefined' && createPortal(
      <>
        <AnimatePresence>
          {selectedDay !== null && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-4 bg-black/85 overflow-hidden pointer-events-auto"
            >
              <motion.div 
                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative w-full max-w-md my-auto max-h-[82vh] bg-surface-elevated border-2 border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
              >
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface shrink-0">
                  <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                    <Lucide.Calendar size={18} className="text-primary"/> {monthYearStr} {selectedDay}
                  </h3>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><Lucide.X size={18} /></motion.button>
                </div>
                
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-sm scrollbar-thin">
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Amount (₹)</label>
                        <input type="number" required step="0.01" value={amountInput} onChange={e=>setAmountInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" />
                      </div>
                      <div className="flex-1 relative">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Category</label>
                        <select value={categoryInput} onChange={e=>setCategoryInput(e.target.value as ExpenseCategory)} className="w-full bg-input border border-border rounded-lg pl-3 pr-9 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                          <option value="Shopping">Shopping</option>
                          <option value="Food">Food</option>
                          <option value="Bills">Bills</option>
                          <option value="Other">Other</option>
                        </select>
                        <Lucide.ChevronDown className="absolute right-3 top-7 text-muted-foreground pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Note (Optional)</label>
                      <input type="text" value={noteInput} onChange={e=>setNoteInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Groceries, gas..." />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-primary/20">Add Daily Expense</motion.button>
                  </form>

                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Logged Today</h4>
                    {getExpensesForDay(selectedDay).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No expenses logged for this day.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {getExpensesForDay(selectedDay).map(e => (
                          <div key={e.id} className="flex justify-between items-center bg-surface border border-border/50 rounded-lg p-3">
                            <div>
                              <div className="font-semibold text-foreground text-sm">{e.category} <span className="font-normal text-muted-foreground text-xs ml-1">{e.note}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-rose-500">₹{e.amount.toLocaleString()}</span>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteExpense(e.id)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                                <Lucide.Trash2 size={14} />
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSubModal !== null && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-4 bg-black/85 overflow-hidden pointer-events-auto"
            >
              <motion.div 
                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative w-full max-w-md my-auto max-h-[82vh] bg-surface-elevated border-2 border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
              >
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface shrink-0">
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                    {activeSubModal === 'bigExpenses' ? <Lucide.CreditCard size={18} className="text-rose-500"/> : 
                     activeSubModal === 'investments' ? <Lucide.TrendingUp size={18} className="text-purple-500"/> :
                     <Lucide.Users size={18} className="text-amber-500"/>}
                    {activeSubModal === 'bigExpenses' ? 'Monthly Big Expenses' : 
                     activeSubModal === 'investments' ? 'Investments Portfolio' : 'Lent & Borrowed'}
                  </h3>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveSubModal(null)} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-colors"><Lucide.X size={18} /></motion.button>
                </div>
                
                <div className="p-5">
                  <form onSubmit={handleAddSubItem} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-[2]">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Name / Type</label>
                        <input type="text" required value={subNameInput} onChange={e=>setSubNameInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder={activeSubModal === 'bigExpenses' ? 'Rent, Car...' : activeSubModal === 'investments' ? 'Stocks, Crypto...' : 'John Doe...'} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Amount (₹)</label>
                        <input type="text" required value={subAmountInput} onChange={e=>setSubAmountInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0" />
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={`w-full font-bold py-2 rounded-lg transition-colors text-white shadow-lg ${activeSubModal === 'bigExpenses' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : activeSubModal === 'investments' ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}>
                      Add {activeSubModal === 'bigExpenses' ? 'Expense' : activeSubModal === 'investments' ? 'Investment' : 'Person'}
                    </motion.button>
                  </form>

                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Current Breakdown</h4>
                    {stats[activeSubModal].length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No items added yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {stats[activeSubModal].map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-surface border border-border/50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                               {(activeSubModal === 'bigExpenses' || activeSubModal === 'lentBorrowed') && (
                                 <motion.button 
                                   whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                   type="button"
                                   onClick={() => handleToggleSubItem(item.id, activeSubModal)}
                                   className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${item.isPaid ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent hover:border-primary/50'}`}
                                 >
                                   <Lucide.Check size={14} strokeWidth={3} />
                                 </motion.button>
                               )}
                              <div className={`font-semibold text-sm transition-colors ${item.isPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.name}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-bold ${item.isPaid ? 'text-muted-foreground' : activeSubModal === 'bigExpenses' ? 'text-rose-500' : activeSubModal === 'investments' ? 'text-purple-500' : 'text-amber-500'}`}>₹{item.amount.toLocaleString()}</span>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteSubItem(item.id, activeSubModal)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                                <Lucide.Trash2 size={14} />
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>,
      document.body
    )}
  </>
);
}
