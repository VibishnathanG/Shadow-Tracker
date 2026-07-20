'use client';
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShadowTrackerStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

type ExpenseCategory = 'Shopping' | 'Food' | 'Bills' | 'Other';
type Expense = { id: string; date: string; amount: number; category: ExpenseCategory; note: string };
type SubItem = { id: string; name: string; amount: number; isPaid?: boolean };
type GlobalStats = { income: number; savings: number; bigExpenses: SubItem[]; investments: SubItem[]; lentBorrowed: SubItem[] };

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

export default function MoneyFeature() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<GlobalStats>({ 
    income: 100000, 
    savings: 25000, 
    bigExpenses: [{ id: '1', name: 'Rent', amount: 30000, isPaid: true }, { id: '2', name: 'Car EMI', amount: 15000, isPaid: false }], 
    investments: [{ id: '1', name: 'Mutual Funds', amount: 10000 }, { id: '2', name: 'Stocks', amount: 5000 }],
    lentBorrowed: [{ id: '1', name: 'John Doe', amount: 2000 }]
  });
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<'bigExpenses' | 'investments' | 'lentBorrowed' | null>(null);
  
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>('Shopping');
  const [noteInput, setNoteInput] = useState('');
  const [subNameInput, setSubNameInput] = useState('');
  const [subAmountInput, setSubAmountInput] = useState('');
  
  const [chartFilters, setChartFilters] = useState({ spend: true, income: true, savings: true, investments: true });
  
  useEffect(() => {
    const saved = localStorage.getItem('shadow_money_data_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.stats) {
          if (!parsed.stats.lentBorrowed) parsed.stats.lentBorrowed = [];
          setStats(parsed.stats);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shadow_money_data_v3', JSON.stringify({ expenses, stats }));
    useShadowTrackerStore.getState().checkAndUnlockBadges();
  }, [expenses, stats]);

  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);

  const prevMonth = useCallback(() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)), []);

  const monthYearStr = useMemo(() => currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [currentDate]);

  const getExpensesForDay = useCallback((day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return expenses.filter(e => e.date === dateStr);
  }, [currentDate, expenses]);

  const handleAddExpense = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !amountInput) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 11),
      date: dateStr,
      amount: parseFloat(amountInput),
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
    if (!activeSubModal || !subNameInput || !subAmountInput) return;
    
    const newItem: SubItem = {
      id: Math.random().toString(36).substring(2, 11),
      name: subNameInput,
      amount: parseFloat(subAmountInput),
      isPaid: false
    };
    
    setStats(prev => ({
      ...prev,
      [activeSubModal]: [...prev[activeSubModal], newItem]
    }));
    setSubNameInput('');
    setSubAmountInput('');
  }, [activeSubModal, subNameInput, subAmountInput]);

  const handleDeleteSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed') => {
    setStats(prev => ({
      ...prev,
      [list]: prev[list].filter(item => item.id !== id)
    }));
  }, []);
  
  const handleToggleSubItem = useCallback((id: string, list: 'bigExpenses' | 'investments' | 'lentBorrowed') => {
    setStats(prev => ({
      ...prev,
      [list]: prev[list].map(item => item.id === id ? { ...item, isPaid: !item.isPaid } : item)
    }));
  }, []);

  const updateScalarStat = useCallback((key: 'income' | 'savings', val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setStats(prev => ({ ...prev, [key]: num }));
    }
  }, []);

  const totalBigExpenses = useMemo(() => stats.bigExpenses.reduce((sum, item) => sum + item.amount, 0), [stats.bigExpenses]);
  const totalInvestments = useMemo(() => stats.investments.reduce((sum, item) => sum + item.amount, 0), [stats.investments]);
  const totalLentBorrowed = useMemo(() => stats.lentBorrowed.reduce((sum, item) => sum + item.amount, 0), [stats.lentBorrowed]);

  const currentMonthStr = useMemo(() => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`, [currentDate]);
  const calendarExpensesThisMonth = useMemo(() => expenses.filter(e => e.date.startsWith(currentMonthStr)), [expenses, currentMonthStr]);
  const totalCalendarSpend = useMemo(() => calendarExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0), [calendarExpensesThisMonth]);
  const totalMonthlySpend = useMemo(() => totalCalendarSpend + totalBigExpenses, [totalCalendarSpend, totalBigExpenses]);
  
  const topCalendarExpenses = useMemo(() => [...calendarExpensesThisMonth].sort((a, b) => b.amount - a.amount).slice(0, 3), [calendarExpensesThisMonth]);

  const currentMonthName = useMemo(() => currentDate.toLocaleString('default', { month: 'short' }), [currentDate]);
  const historicalData = useMemo(() => [
    { month: 'Feb', Spend: 25000, Income: 80000, Savings: 15000, Investments: 10000 },
    { month: 'Mar', Spend: 28000, Income: 85000, Savings: 18000, Investments: 12000 },
    { month: 'Apr', Spend: 22000, Income: 85000, Savings: 20000, Investments: 12000 },
    { month: 'May', Spend: 31000, Income: 90000, Savings: 22000, Investments: 15000 },
    { month: 'Jun', Spend: 29000, Income: 90000, Savings: 25000, Investments: 15000 },
    { month: currentMonthName, Spend: totalMonthlySpend, Income: stats.income, Savings: stats.savings, Investments: totalInvestments },
  ], [currentMonthName, totalMonthlySpend, stats.income, stats.savings, totalInvestments]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8 relative"
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
        <div className="col-span-1 md:col-span-3 lg:col-span-6 flex justify-between items-center tile p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Lucide.Wallet size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Money Dashboard</h1>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{monthYearStr}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevMonth} className="p-2 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Lucide.ChevronLeft size={16}/></motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextMonth} className="p-2 bg-surface hover:bg-surface-elevated border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Lucide.ChevronRight size={16}/></motion.button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 tile p-5 relative overflow-hidden group flex flex-col">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-orange-500/40" />
          <div className="flex items-center justify-between text-muted-foreground mb-3 font-medium text-sm">
            <span className="flex items-center gap-2"><Lucide.Activity size={16} className="text-orange-500" /> Total Spend</span>
          </div>
          <div className="flex items-baseline mb-3">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <span className="text-2xl font-bold text-foreground">{totalMonthlySpend.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto border-t border-border/50 pt-3">
            {topCalendarExpenses.slice(0, 3).map(item => {
              const dayStr = item.date.split('-')[2];
              return (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-muted-foreground">{dayStr}</span>
                  <span className="truncate max-w-[60px] text-muted-foreground">{item.category}</span>
                </div>
                <span className="font-semibold text-foreground">₹{item.amount.toLocaleString()}</span>
              </div>
            )})}
            {topCalendarExpenses.length === 0 && <div className="text-xs text-muted-foreground text-center">No daily spends yet</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-1 tile p-5 relative overflow-hidden group flex flex-col justify-between">
          <TileArtIncome />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-emerald-500/40" />
          <div className="flex items-center gap-2 text-muted-foreground mb-3 font-medium text-sm relative z-10">
            <Lucide.ArrowDownCircle size={16} className="text-emerald-500" /> Monthly Income
          </div>
          <div className="flex items-baseline">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <input 
              type="number" value={stats.income} onChange={(e) => updateScalarStat('income', e.target.value)}
              className="bg-transparent border-none text-2xl font-bold text-foreground focus:outline-none w-full appearance-none"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onClick={() => setActiveSubModal('bigExpenses')} className="col-span-1 tile p-5 relative overflow-hidden group cursor-pointer flex flex-col">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-rose-500/40" />
          <div className="flex items-center justify-between text-muted-foreground mb-3 font-medium text-sm">
            <span className="flex items-center gap-2"><Lucide.CreditCard size={16} className="text-rose-500" /> Big Expenses</span>
            <Lucide.ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline mb-3">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <span className="text-2xl font-bold text-foreground">{totalBigExpenses.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto border-t border-border/50 pt-3">
            {stats.bigExpenses.slice(0, 2).map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.isPaid ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                     {item.isPaid && <Lucide.Check size={8} strokeWidth={4} />}
                  </div>
                  <span className={`truncate max-w-[80px] ${item.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.name}</span>
                </div>
                <span className={`font-semibold ${item.isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            {stats.bigExpenses.length > 2 && <div className="text-xs text-muted-foreground text-center">+{stats.bigExpenses.length - 2} more</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-1 tile p-5 relative overflow-hidden group flex flex-col justify-between">
          <TileArtSavings />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-sky-500/40" />
          <div className="flex items-center gap-2 text-muted-foreground mb-3 font-medium text-sm relative z-10">
            <Lucide.PiggyBank size={16} className="text-sky-500" /> Total Savings
          </div>
          <div className="flex items-baseline">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <input 
              type="number" value={stats.savings} onChange={(e) => updateScalarStat('savings', e.target.value)}
              className="bg-transparent border-none text-2xl font-bold text-foreground focus:outline-none w-full appearance-none"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={() => setActiveSubModal('investments')} className="col-span-1 tile p-5 relative overflow-hidden group cursor-pointer flex flex-col">
          <TileArtInvestments />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 3 }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-purple-500/40" />
          <div className="flex items-center justify-between text-muted-foreground mb-3 font-medium text-sm relative z-10">
            <span className="flex items-center gap-2"><Lucide.TrendingUp size={16} className="text-purple-500" /> Investments</span>
            <Lucide.ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline mb-3">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <span className="text-2xl font-bold text-foreground">{totalInvestments.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto border-t border-border/50 pt-3">
            {stats.investments.slice(0, 2).map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[80px] text-foreground">{item.name}</span>
                <span className="font-semibold text-foreground">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            {stats.investments.length > 2 && <div className="text-xs text-muted-foreground text-center">+{stats.investments.length - 2} more</div>}
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} onClick={() => setActiveSubModal('lentBorrowed')} className="col-span-1 tile p-5 relative overflow-hidden group cursor-pointer flex flex-col">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 4 }} className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] bg-amber-500/40" />
          <div className="flex items-center justify-between text-muted-foreground mb-3 font-medium text-sm">
            <span className="flex items-center gap-2"><Lucide.Users size={16} className="text-amber-500" /> Lent/Borrowed</span>
            <Lucide.ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline mb-3">
            <span className="text-muted-foreground text-lg mr-1">₹</span>
            <span className="text-2xl font-bold text-foreground">{totalLentBorrowed.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-auto border-t border-border/50 pt-3">
            {stats.lentBorrowed.slice(0, 2).map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.isPaid ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                     {item.isPaid && <Lucide.Check size={8} strokeWidth={4} />}
                  </div>
                  <span className={`truncate max-w-[80px] ${item.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.name}</span>
                </div>
                <span className={`font-semibold ${item.isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            {stats.lentBorrowed.length > 2 && <div className="text-xs text-muted-foreground text-center">+{stats.lentBorrowed.length - 2} more</div>}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="tile overflow-hidden flex-1 flex flex-col relative z-10">
        
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03] overflow-hidden">
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

        <div className="grid grid-cols-7 border-b border-border bg-surface/50 relative z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(100px,1fr)] relative z-10">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
             <div key={`empty-${i}`} className="border-b border-r border-border/50 bg-black/5" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayExpenses = getExpensesForDay(day);
            const totalSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            return (
              <motion.div 
                key={day} 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.6 + (i * 0.015) }}
                onClick={() => setSelectedDay(day)}
                whileHover={{ 
                  backgroundColor: 'var(--surface-elevated)', 
                  scale: 1.1, 
                  y: -4,
                  boxShadow: '0 12px 25px -5px rgba(var(--primary-rgb), 0.4)',
                  zIndex: 10, 
                  transition: { type: 'spring', stiffness: 500, damping: 20 } 
                }}
                whileTap={{ scale: 0.9, y: 0 }}
                className={`border-b border-r border-border/50 p-2 relative cursor-pointer group transition-colors flex flex-col ${selectedDay === day ? 'bg-primary/10 ring-1 ring-inset ring-primary' : 'bg-surface/30'}`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <span className={`text-sm font-semibold ${selectedDay === day ? 'text-primary' : 'text-muted-foreground'} group-hover:text-foreground transition-colors`}>{day}</span>
                  {totalSpent > 0 && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">₹{totalSpent.toLocaleString()}</span>}
                </div>
                <div className="mt-2 flex flex-col gap-1 overflow-hidden">
                  {dayExpenses.map(e => (
                    <div key={e.id} className="text-xs truncate text-muted-foreground flex justify-between bg-surface/80 rounded px-1 py-0.5">
                      <span>{e.category}</span>
                      <span className="font-medium text-foreground">₹{e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {totalSpent > 0 && (
                  <motion.div animate={{ opacity: [0.02, 0.08, 0.02] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-primary/20 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedDay !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-[var(--theme-radius)] shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Lucide.Calendar size={18} className="text-primary"/> {monthYearStr} {selectedDay}
                </h3>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDay(null)} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-colors"><Lucide.X size={18} /></motion.button>
              </div>
              
              <div className="p-5">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Amount (₹)</label>
                      <input type="number" required step="0.01" value={amountInput} onChange={e=>setAmountInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Category</label>
                      <select value={categoryInput} onChange={e=>setCategoryInput(e.target.value as ExpenseCategory)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>Shopping</option>
                        <option>Food</option>
                        <option>Bills</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">Note (Optional)</label>
                    <input type="text" value={noteInput} onChange={e=>setNoteInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Groceries, gas..." />
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg transition-colors shadow-lg shadow-primary/20">Add Daily Expense</motion.button>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-[var(--theme-radius)] shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
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
                      <input type="number" required step="0.01" value={subAmountInput} onChange={e=>setSubAmountInput(e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0" />
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="tile p-6 relative z-10 flex flex-col gap-6 mb-10">
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
  );
}
