'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import Modal from '@/components/Modal';
import { useShadowTrackerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import EmptyState from '@/components/EmptyState';
import { useViewPreference } from '@/lib/viewPreferences';
import { getHabitDateStatus, parseDateString, getTodayDateString } from '@/lib/dateUtils';
import { 
  format, 
  parseISO, 
  subDays, 
  eachDayOfInterval, 
  getHours, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns';

const BackgroundDecorations = React.memo(() => null);
BackgroundDecorations.displayName = 'BackgroundDecorations';

const RadialChart = ({ value, label, color, size = 100, strokeWidth = 8 }: { value: number, label: string, color: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-md">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black tracking-tighter leading-none text-foreground transition-transform duration-300">
          {value}%
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{label}</span>
      </div>
    </div>
  );
};

/* =========================================================
   HABITS MONTHLY GRID COMPONENT
   Interactive 4-5 Week Grid split by weeks with checkbox tiles
   ========================================================= */

const WEEK_THEME_COLORS = [
  { bg: 'bg-purple-600', border: 'border-purple-400/60', text: 'text-purple-300', fill: 'bg-purple-600', shadow: 'shadow-purple-500/30' },
  { bg: 'bg-emerald-600', border: 'border-emerald-400/60', text: 'text-emerald-300', fill: 'bg-emerald-600', shadow: 'shadow-emerald-500/30' },
  { bg: 'bg-pink-600', border: 'border-pink-400/60', text: 'text-pink-300', fill: 'bg-pink-600', shadow: 'shadow-pink-500/30' },
  { bg: 'bg-blue-600', border: 'border-blue-400/60', text: 'text-blue-300', fill: 'bg-blue-600', shadow: 'shadow-blue-500/30' },
  { bg: 'bg-amber-600', border: 'border-amber-400/60', text: 'text-amber-300', fill: 'bg-amber-600', shadow: 'shadow-amber-500/30' },
];

const HabitsMonthlyGridCard: React.FC = () => {
  const { habits, categories, notes, saveNote, toggleHabitCompletion, markHabitUncompleted, clearHabitUncompleted, settings, updateSettings } = useShadowTrackerStore(
    useShallow(state => ({
      habits: state.habits,
      categories: state.categories,
      notes: state.notes,
      saveNote: state.saveNote,
      toggleHabitCompletion: state.toggleHabitCompletion,
      markHabitUncompleted: state.markHabitUncompleted,
      clearHabitUncompleted: state.clearHabitUncompleted,
      settings: state.settings,
      updateSettings: state.updateSettings,
    }))
  );
  const graceDays = settings?.habitGracePeriodDays ?? 3;
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [matrixViewMode, setMatrixViewMode] = useViewPreference('analyticsMatrixViewMode') as ['month' | 'week', (v: 'month' | 'week') => void];
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(0);
  const [reasonModal, setReasonModal] = useState<{ habit: typeof habits[0]; dateStr: string } | null>(null);
  const [presetReason, setPresetReason] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const prevMonth = useCallback(() => setCurrentMonthDate(prev => subMonths(prev, 1)), []);
  const nextMonth = useCallback(() => setCurrentMonthDate(prev => addMonths(prev, 1)), []);

  const openReasonModal = useCallback((habit: typeof habits[0], dateStr: string) => {
    setReasonModal({ habit, dateStr });
    setCustomReasonText(habit.missedReasons?.[dateStr] || '');
    setPresetReason('');
  }, []);

  const handleSaveMissedReason = useCallback(async () => {
    if (!reasonModal) return;
    const { habit, dateStr } = reasonModal;
    const reason = customReasonText.trim() || presetReason || '';
    await markHabitUncompleted(habit.id, dateStr, reason);

    const formattedDate = format(parseDateString(dateStr), 'MMM d, yyyy');
    setReasonModal(null);
    setPresetReason('');
    setCustomReasonText('');
    setToastNotice(`Reflection saved for ${formattedDate}!`);
    setTimeout(() => setToastNotice(null), 3000);
  }, [reasonModal, customReasonText, presetReason, markHabitUncompleted]);

  const handleClearMissedStatus = useCallback(async () => {
    if (!reasonModal) return;
    const { habit, dateStr } = reasonModal;
    await clearHabitUncompleted(habit.id, dateStr);

    const formattedDate = format(parseDateString(dateStr), 'MMM d, yyyy');
    setReasonModal(null);
    setPresetReason('');
    setCustomReasonText('');
    setToastNotice(`Habit status reset for ${formattedDate}`);
    setTimeout(() => setToastNotice(null), 3000);
  }, [reasonModal, clearHabitUncompleted]);

  const monthStart = useMemo(() => startOfMonth(currentMonthDate), [currentMonthDate]);
  const monthEnd = useMemo(() => endOfMonth(currentMonthDate), [currentMonthDate]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // Group days into weeks (Week 1, Week 2, Week 3, etc.)
  const weekGroups = useMemo(() => {
    const weeks: { weekNumber: number; days: Date[] }[] = [];
    let currentWeek: Date[] = [];
    let weekIndex = 1;

    daysInMonth.forEach((date, i) => {
      currentWeek.push(date);

      // If it's Sunday (day 0) or the last day of the month, close current week group
      if (date.getDay() === 0 || i === daysInMonth.length - 1) {
        weeks.push({ weekNumber: weekIndex++, days: currentWeek });
        currentWeek = [];
      }
    });

    return weeks;
  }, [daysInMonth]);

  const weekDataByDateStr = useMemo(() => {
    const map = new Map<string, { weekGroup: typeof weekGroups[0]; weekIdx: number; weekDays: Date[] }>();
    weekGroups.forEach((w, wIdx) => {
      w.days.forEach(d => {
        map.set(format(d, 'yyyy-MM-dd'), { weekGroup: w, weekIdx: wIdx, weekDays: w.days });
      });
    });
    return map;
  }, [weekGroups]);

  const resetToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonthDate(today);
    const todayStr = format(today, 'yyyy-MM-dd');
    const wIdx = weekGroups.findIndex(w => w.days.some(d => format(d, 'yyyy-MM-dd') === todayStr));
    if (wIdx >= 0) {
      setSelectedWeekIdx(wIdx);
    } else {
      setSelectedWeekIdx(0);
    }
  }, [weekGroups]);

  const displayWeekGroups = useMemo(() => {
    if (matrixViewMode === 'week' && weekGroups[selectedWeekIdx]) {
      return [weekGroups[selectedWeekIdx]];
    }
    return weekGroups;
  }, [matrixViewMode, selectedWeekIdx, weekGroups]);

  const displayDays = useMemo(() => {
    if (matrixViewMode === 'week' && weekGroups[selectedWeekIdx]) {
      return weekGroups[selectedWeekIdx].days;
    }
    return daysInMonth;
  }, [matrixViewMode, selectedWeekIdx, weekGroups, daysInMonth]);

  // Helper to determine habit schedule state for a given day
  const evaluateHabitDaySchedule = useCallback((habit: typeof habits[0], date: Date, weekDays: Date[]) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = getTodayDateString();
    const dateStatus = getHabitDateStatus(dateStr, todayStr, graceDays);

    const isCompleted = habit.completedDates.includes(dateStr);
    const isMarkedUncompleted = Boolean(habit.uncompletedDates?.includes(dateStr) || habit.missedReasons?.[dateStr]);
    const hasReason = Boolean(habit.missedReasons?.[dateStr]);
    const reasonText = habit.missedReasons?.[dateStr] || '';

    // Check scheduling based on frequency
    let isScheduled = true;
    let notScheduledTooltip = '';

    if (habit.frequency === 'custom') {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const isCustomDay = habit.customDays && habit.customDays.length > 0
        ? habit.customDays.includes(dayOfWeek)
        : true;
      if (!isCustomDay) {
        isScheduled = false;
        notScheduledTooltip = `${habit.name} - Not scheduled on ${format(date, 'EEEE')}`;
      }
    } else if (habit.frequency === 'weekly') {
      const completedDateInWeek = weekDays
        .map(d => format(d, 'yyyy-MM-dd'))
        .find(dStr => habit.completedDates.includes(dStr));

      if (completedDateInWeek && completedDateInWeek !== dateStr) {
        isScheduled = false;
        notScheduledTooltip = `${habit.name} - Already completed for this week on ${format(parseISO(completedDateInWeek), 'MMM d')}`;
      }
    }

    if (!isScheduled) {
      return {
        isScheduled: false,
        isEnabled: false,
        isCompleted: false,
        isMissed: false,
        isFuture: dateStatus.isFuture,
        isPastGracePeriod: dateStatus.isPastGracePeriod,
        canToggle: false,
        hasReason: false,
        reasonText: '',
        tooltip: notScheduledTooltip || `${habit.name} - Not scheduled`,
      };
    }

    // Scheduled habit: check future dates first (strictly cannot complete or modify)
    if (dateStatus.isFuture) {
      return {
        isScheduled: true,
        isEnabled: false,
        isCompleted: false,
        isMissed: false,
        isFuture: true,
        isPastGracePeriod: false,
        canToggle: false,
        hasReason,
        reasonText,
        tooltip: `${habit.name} - ${format(date, 'MMM d')}: Future date (cannot check off before date)`,
      };
    }

    // Completed habit:
    if (isCompleted) {
      const canToggle = dateStatus.isInGracePeriod;
      return {
        isScheduled: true,
        isEnabled: canToggle,
        isCompleted: true,
        isMissed: false,
        isFuture: false,
        isPastGracePeriod: dateStatus.isPastGracePeriod,
        canToggle,
        hasReason,
        reasonText,
        tooltip: dateStatus.isPastGracePeriod
          ? `${habit.name} - ${format(date, 'MMM d')}: Completed (${graceDays}d past lock-in expired - locked)`
          : `${habit.name} - ${format(date, 'MMM d')}: Completed (Click to untoggle)`,
      };
    }

    // Uncompleted habit:
    // If past grace period: "same ass not filled after grace period... and once reason iss updated make it red x mark"
    if (dateStatus.isPastGracePeriod) {
      return {
        isScheduled: true,
        isEnabled: false, // Faded / locked from ticking complete
        isCompleted: false,
        isMissed: true, // Red X mark!
        isFuture: false,
        isPastGracePeriod: true,
        canToggle: false,
        hasReason,
        reasonText,
        tooltip: hasReason
          ? `${habit.name} - ${format(date, 'MMM d')}: Missed (${reasonText}) [Locked]`
          : `${habit.name} - ${format(date, 'MMM d')}: Not completed within ${graceDays}-day past lock-in period (Locked)`,
      };
    }

    // Within grace period (today or last graceDays days) but explicitly marked uncompleted or has reason:
    if (isMarkedUncompleted) {
      return {
        isScheduled: true,
        isEnabled: true,
        isCompleted: false,
        isMissed: true, // Red X mark!
        isFuture: false,
        isPastGracePeriod: false,
        canToggle: true,
        hasReason,
        reasonText,
        tooltip: hasReason
          ? `${habit.name} - ${format(date, 'MMM d')}: Marked uncompleted (${reasonText})`
          : `${habit.name} - ${format(date, 'MMM d')}: Marked uncompleted (Grace period active)`,
      };
    }

    // Unfilled day within grace period:
    return {
      isScheduled: true,
      isEnabled: true, // Clickable!
      isCompleted: false,
      isMissed: false,
      isFuture: false,
      isPastGracePeriod: false,
      canToggle: true,
      hasReason,
      reasonText,
      tooltip: `${habit.name} - ${format(date, 'MMM d')}: Click to complete (Grace period active)`,
    };
  }, [graceDays]);

  // Daily statistics (Progress %, Done count, Not Done count)
  const dailyStats = useMemo(() => {
    const activeHabits = habits.filter(h => !h.isSoftDeleted);

    return daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Fast O(1) week group lookup
      const weekInfo = weekDataByDateStr.get(dateStr);
      const weekDays = weekInfo ? weekInfo.weekDays : [date];

      let scheduledCount = 0;
      let doneCount = 0;

      activeHabits.forEach(habit => {
        const evalState = evaluateHabitDaySchedule(habit, date, weekDays);
        if (evalState.isScheduled) {
          scheduledCount++;
          if (evalState.isCompleted) {
            doneCount++;
          }
        }
      });

      const notDoneCount = Math.max(0, scheduledCount - doneCount);
      const percentage = scheduledCount > 0 ? Math.round((doneCount / scheduledCount) * 100) : 100;

      return {
        dateStr,
        scheduledCount,
        doneCount,
        notDoneCount,
        percentage
      };
    });
  }, [daysInMonth, habits, weekDataByDateStr, evaluateHabitDaySchedule]);

  const activeHabits = useMemo(() => habits.filter(h => !h.isSoftDeleted), [habits]);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.color])), [categories]);
  const getCategoryColor = useCallback((catId?: string) => {
    if (!catId) return '#8b5cf6';
    return categoryMap.get(catId) || '#8b5cf6';
  }, [categoryMap]);

  // Daily Progress Chart Path calculation
  const chartHeight = 45;
  const chartWidth = 900;
  const chartPoints = useMemo(() => {
    if (dailyStats.length === 0) return { path: '', area: '' };
    const step = chartWidth / Math.max(1, dailyStats.length - 1);
    
    const pts = dailyStats.map((stat, idx) => {
      const x = idx * step;
      const y = chartHeight - (stat.percentage / 100) * (chartHeight - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const path = `M ${pts.join(' L ')}`;
    const area = `${path} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    return { path, area };
  }, [dailyStats]);

  return (
    <div className="tile p-4 sm:p-6 relative overflow-hidden space-y-6">
      {/* Month Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Lucide.CalendarCheck className="text-primary" size={18} />
            <h3 className="text-base font-bold tracking-tight text-foreground">Monthly Habit Matrix</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold border border-amber-500/20 text-[10px]">
              <Lucide.FileEdit size={10} /> Tap 📝 to journal
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
            Interactive schedule grid with habit checkboxes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle: Month vs Week View */}
          <div className="flex items-center bg-surface-elevated border border-border/80 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setMatrixViewMode('month')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                matrixViewMode === 'month' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Full Month
            </button>
            <button
              onClick={() => setMatrixViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                matrixViewMode === 'week' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Past Habit Lock-in Window Setting */}
          <div 
            className="flex items-center gap-1.5 bg-surface-elevated border border-border/80 rounded-xl px-2.5 py-1.5 text-xs shadow-sm"
            title="Days allowed to retroactively fill/update past habits (1-10 days, default 3)"
          >
            <Lucide.Clock size={13} className="text-primary shrink-0" />
            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Past Lock-in:</span>
            <select
              value={graceDays}
              onChange={(e) => {
                const days = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 3));
                updateSettings({ habitGracePeriodDays: days });
                setToastNotice(`Past lock-in window set to ${days} ${days === 1 ? 'day' : 'days'}`);
                setTimeout(() => setToastNotice(null), 3000);
              }}
              className="bg-transparent font-black text-foreground text-xs appearance-none border-0 outline-none ring-0 shadow-none cursor-pointer pr-1"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <option key={d} value={d} className="bg-surface text-foreground font-semibold">
                  {d} {d === 1 ? 'day' : 'days'}{d === 3 ? ' (default)' : ''}{d === 10 ? ' (max)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-surface-elevated/90 border border-border/80 rounded-2xl p-1 shadow-xs shrink-0">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-all cursor-pointer border-0 outline-none ring-0 focus:outline-none"
              title="Previous Month"
            >
              <Lucide.ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={resetToToday}
              className="filter-pill text-xs py-1 px-3.5 rounded-full font-bold uppercase cursor-pointer"
              title="Jump to Today"
            >
              Today
            </button>
            <span className="text-xs font-extrabold px-2.5 text-foreground tracking-wider uppercase border-l border-border/60">
              {format(currentMonthDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-all cursor-pointer border-0 outline-none ring-0 focus:outline-none"
              title="Next Month"
            >
              <Lucide.ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Week View Chips Bar (Visible when Week View is selected) */}
      {matrixViewMode === 'week' && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 pt-1">
          <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest shrink-0">Select Week:</span>
          {weekGroups.map((w, wIdx) => (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeekIdx(wIdx)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                selectedWeekIdx === wIdx
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Week {w.weekNumber} ({w.days.length}d)
            </button>
          ))}
        </div>
      )}

      {activeHabits.length === 0 ? (
        <EmptyState 
          icon="Repeat" 
          title="No Active Habits" 
          description="Create your first habit in the Habits tab to populate the monthly tracking grid."
        />
      ) : (
        <div className="space-y-6">
          {/* Scrollable Monthly Grid */}
          <div className="overflow-x-auto no-scrollbar md:custom-scrollbar pb-3">
            <table className="w-full border-collapse select-none min-w-0 table-fixed">
              <colgroup>
                <col className="w-36 sm:w-52" />
                {displayDays.map(d => (
                  <col key={format(d, 'yyyy-MM-dd')} className="w-7 sm:w-8 min-w-[26px] sm:min-w-[32px]" />
                ))}
              </colgroup>
              <thead>
                {/* Row 1: Week Headers */}
                <tr>
                  <th className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] text-left text-[10px] sm:text-xs font-black text-foreground uppercase tracking-wider border-b border-border/50 border-r border-border/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lucide.CalendarDays size={13} className="text-primary shrink-0" />
                      <span className="truncate">{matrixViewMode === 'week' ? `WEEK ${weekGroups[selectedWeekIdx]?.weekNumber || 1}` : 'MONTHLY GRID'}</span>
                    </div>
                  </th>
                  {displayWeekGroups.map((week, wIdx) => {
                    const actualWeekIdx = matrixViewMode === 'week' ? selectedWeekIdx : wIdx;
                    const theme = WEEK_THEME_COLORS[actualWeekIdx % WEEK_THEME_COLORS.length];
                    return (
                      <th 
                        key={week.weekNumber}
                        colSpan={week.days.length}
                        className="p-0.5 sm:p-1 text-center border-b border-border/50 border-r border-border/40 last:border-r-0"
                      >
                        <div className={`py-1 px-2.5 rounded-md sm:rounded-lg text-[9.5px] sm:text-[10.5px] font-black tracking-wider uppercase ${theme.bg} text-white shadow-xs border ${theme.border}`}>
                          Week {week.weekNumber}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Row 2: Day of Week Abbreviation & Day Number */}
                <tr className="border-b border-border/60">
                  <th className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] text-[10px] sm:text-xs font-bold text-muted-foreground uppercase text-left border-r border-border/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lucide.Repeat size={13} className="text-muted-foreground shrink-0" />
                      <span className="truncate">Habits ({activeHabits.length})</span>
                    </div>
                  </th>
                  {displayDays.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isCurrent = isToday(date);
                    const dayOfWeek = format(date, 'EE').slice(0, 2);
                    const dayNum = format(date, 'd');

                    return (
                      <th
                        key={dateStr}
                        className={`p-0.5 text-center border-r border-border/30 last:border-r-0 transition-colors ${
                          isCurrent ? 'bg-primary/10 border-x border-primary/30 rounded-t-md' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-[7.5px] sm:text-[9px] font-bold uppercase tracking-tighter ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dayOfWeek}
                          </span>
                          <span className={`text-[9.5px] sm:text-xs font-extrabold ${isCurrent ? 'text-primary font-black scale-105' : 'text-foreground'}`}>
                            {dayNum}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {/* Habit Rows */}
                {activeHabits.map((habit) => (
                  <tr key={habit.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors group">
                    {/* Habit Name Column (Sticky Left) */}
                    <td className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] border-r border-border/40 text-left align-middle">
                      <div className="flex items-center gap-2 font-bold text-[10px] sm:text-xs text-foreground group-hover:text-primary transition-colors min-w-0">
                        <div 
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: getCategoryColor(habit.categoryId) }}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate" title={habit.name}>
                            {habit.name}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase tracking-tight truncate">
                            {habit.frequency === 'custom' ? 'Custom' : habit.frequency === 'weekly' ? '1x/Wk' : 'Daily'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells (Checkboxes) */}
                    {displayDays.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isCurrent = isToday(date);
                      
                      const weekInfo = weekDataByDateStr.get(dateStr);
                      const weekDays = weekInfo ? weekInfo.weekDays : [date];
                      const weekIdx = weekInfo ? weekInfo.weekIdx : 0;
                      const theme = WEEK_THEME_COLORS[weekIdx % WEEK_THEME_COLORS.length];

                      const evalState = evaluateHabitDaySchedule(habit, date, weekDays);

                      return (
                        <td 
                          key={dateStr}
                          className={`p-0.5 text-center align-middle relative group/cell border-r border-border/25 last:border-r-0 ${isCurrent ? 'bg-primary/5 border-x border-primary/20' : ''}`}
                        >
                          <div className="relative w-full h-full flex items-center justify-center py-0.5">
                            <button
                              disabled={!evalState.canToggle}
                              onClick={async () => {
                                if (evalState.canToggle) {
                                  await toggleHabitCompletion(habit.id, dateStr);
                                }
                              }}
                              className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
                                evalState.isCompleted
                                  ? `${theme.fill} text-white shadow-xs ${theme.shadow} border ${theme.border} ${evalState.isPastGracePeriod ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`
                                  : evalState.isMissed
                                  ? `bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-xs ${evalState.isPastGracePeriod ? 'opacity-60 cursor-not-allowed' : 'hover:border-rose-500 cursor-pointer'}`
                                  : !evalState.isScheduled
                                  ? 'bg-secondary/20 border border-transparent text-muted-foreground/30 cursor-not-allowed opacity-35'
                                  : evalState.isFuture
                                  ? 'bg-secondary/15 border border-dashed border-border/40 text-muted-foreground/20 cursor-not-allowed opacity-30'
                                  : 'bg-surface-elevated/80 border border-border/80 hover:border-primary/60 text-transparent cursor-pointer'
                              }`}
                              title={evalState.tooltip}
                            >
                              {evalState.isCompleted ? (
                                <Lucide.Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3px]" />
                              ) : evalState.isMissed ? (
                                <Lucide.X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3px]" />
                              ) : !evalState.isScheduled ? (
                                <span className="text-[8px] font-bold">-</span>
                              ) : evalState.isFuture ? (
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              ) : (
                                <Lucide.Check className="w-3 h-3 opacity-0" />
                              )}
                            </button>

                            {/* Small Note Icon (📝) over the cell */}
                            {evalState.isScheduled && !evalState.isFuture && (
                              (evalState.hasReason || (!evalState.isCompleted && !evalState.isPastGracePeriod)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReasonModal(habit, dateStr);
                                  }}
                                  className={`absolute -top-1 -right-0.5 z-20 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-md hover:scale-125 transition-all ${
                                    evalState.hasReason
                                      ? 'text-amber-400 bg-surface-elevated border border-amber-500/60 opacity-100'
                                      : 'text-muted-foreground hover:text-amber-400 bg-surface-elevated border border-border/70 opacity-80 sm:opacity-0 sm:group-hover/cell:opacity-100'
                                  }`}
                                  title={
                                    evalState.hasReason
                                      ? `Reason: "${evalState.reasonText}" (Click to view/edit)`
                                      : 'Log reason for this habit in Journal 📝'
                                  }
                                >
                                  <Lucide.FileEdit size={9} className="stroke-[2.5px]" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Summary Row 1: Progress % */}
                <tr className="border-t-2 border-border/80 bg-surface-elevated/40 font-black text-xs sm:text-sm">
                  <td className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] border-r border-border/40 text-left align-middle text-muted-foreground uppercase tracking-wider font-black text-xs sm:text-sm">
                    Progress %
                  </td>
                  {displayDays.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const stat = dailyStats.find(s => s.dateStr === dateStr) || { percentage: 0 };
                    return (
                      <td key={`pct-${dateStr}`} className="p-0.5 text-center text-primary font-black text-[10px] sm:text-xs border-r border-border/25 last:border-r-0">
                        {stat.percentage}%
                      </td>
                    );
                  })}
                </tr>

                {/* Summary Row 2: Done */}
                <tr className="bg-surface-elevated/20 font-black text-xs sm:text-sm">
                  <td className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] border-r border-border/40 text-left align-middle text-emerald-400 uppercase tracking-wider font-black text-xs sm:text-sm">
                    Done
                  </td>
                  {displayDays.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const stat = dailyStats.find(s => s.dateStr === dateStr) || { doneCount: 0 };
                    return (
                      <td key={`done-${dateStr}`} className="p-0.5 text-center text-emerald-400 font-black text-[10px] sm:text-xs border-r border-border/25 last:border-r-0">
                        {stat.doneCount}
                      </td>
                    );
                  })}
                </tr>

                {/* Summary Row 3: Not Done */}
                <tr className="bg-surface-elevated/20 font-black text-xs sm:text-sm">
                  <td className="sticky left-0 bg-surface z-20 px-3 py-2 sm:px-4 sm:py-2.5 w-36 sm:w-52 min-w-[140px] sm:min-w-[200px] max-w-[140px] sm:max-w-[200px] border-r border-border/40 text-left align-middle text-rose-400 uppercase tracking-wider font-black text-xs sm:text-sm">
                    Not Done
                  </td>
                  {displayDays.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const stat = dailyStats.find(s => s.dateStr === dateStr) || { notDoneCount: 0 };
                    return (
                      <td key={`notdone-${dateStr}`} className="p-0.5 text-center text-rose-400 font-black text-[10px] sm:text-xs border-r border-border/25 last:border-r-0">
                        {stat.notDoneCount}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Daily Progress Wave Chart */}
          <div className="pt-4 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>Daily Completion Curve</span>
              <span className="text-primary font-extrabold">{format(currentMonthDate, 'MMMM yyyy')}</span>
            </div>
            
            <div className="relative w-full h-[45px] overflow-hidden rounded-xl bg-secondary/20 border border-border/40 p-1">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="habitCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {chartPoints.area && (
                  <path d={chartPoints.area} fill="url(#habitCurveGrad)" />
                )}
                {chartPoints.path && (
                  <path d={chartPoints.path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-surface-elevated border border-emerald-500/40 text-foreground px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold"
          >
            <Lucide.CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
            <span>{toastNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missed Habit Reason Modal */}
      <Modal
        isOpen={Boolean(reasonModal)}
        onClose={() => setReasonModal(null)}
        title="Log Missed Habit Reason"
        size="md"
      >
        {reasonModal && (
          <div className="space-y-5">
            <div className="space-y-2 bg-secondary/30 border border-border/40 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Habit & Date</span>
              <p className="text-sm font-black text-foreground">{reasonModal.habit.name}</p>
              <p className="text-xs font-semibold text-muted-foreground">
                Date: {format(parseISO(reasonModal.dateStr), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            {/* Preset Reason Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Select Quick Preset Reason:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  '⏰ High Workload / Time Constraint',
                  '😴 Low Energy / Fatigue',
                  '✈️ Travel / Out of Routine',
                  '🧠 Forgot / Distracted',
                  '🎯 Prioritized Other Goals'
                ].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPresetReason(chip)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      presetReason === chip
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm'
                        : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Text Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Or Write Custom Reason:</label>
              <textarea
                rows={3}
                placeholder="Why was this habit missed today? Write your honest reflection..."
                value={customReasonText}
                onChange={e => setCustomReasonText(e.target.value)}
                className="w-full text-xs p-3 bg-secondary/40 border border-border/80 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:border-amber-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
              <div>
                {(reasonModal.habit.uncompletedDates?.includes(reasonModal.dateStr) || reasonModal.habit.missedReasons?.[reasonModal.dateStr]) && (
                  <button
                    type="button"
                    onClick={handleClearMissedStatus}
                    className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                    title="Reset uncompleted status back to neutral"
                  >
                    Reset Status
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReasonModal(null)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMissedReason}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Lucide.BookOpen size={14} />
                  <span>Save Reason to Journal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* =========================================================
   TASKS GITHUB-STYLE HEATMAP CARD
   Dedicated contribution matrix for Task completions
   ========================================================= */

const TasksHeatmapCard: React.FC = () => {
  const tasks = useShadowTrackerStore(state => state.tasks);

  const heatmapDays = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 49);
    const intervalDays = eachDayOfInterval({ start: startDate, end: today });

    return intervalDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedTasksForDay = tasks.filter(t => t.isCompleted && t.dueDate === dateStr).length;

      return {
        dateStr,
        count: completedTasksForDay
      };
    });
  }, [tasks]);

  return (
    <div className="tile p-6 relative overflow-hidden space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Lucide.CheckSquare className="text-blue-400" size={16} /> Tasks Contribution Matrix
          </h3>
          <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
            GitHub-style activity grid showing daily task execution over the past 49 days
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-md shrink-0">
          Last 49 Days
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center lg:justify-start">
        {heatmapDays.map((day) => {
          const intensity = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 4 ? 2 : day.count <= 6 ? 3 : 4;
          const colors = [
            'bg-secondary/40 border border-border/40 text-muted-foreground/30', 
            'bg-blue-500/30 border border-blue-500/40 text-blue-200', 
            'bg-blue-500/60 border border-blue-500/70 text-blue-100', 
            'bg-blue-500/90 border border-blue-400 text-white', 
            'bg-blue-500 shadow-[0_0_10px_#3b82f6] border border-blue-300 text-white font-black'
          ];
          
          return (
            <div key={day.dateStr} className="relative group/taskmap">
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${colors[intensity]} cursor-pointer flex items-center justify-center select-none text-[9.5px] font-bold transition-transform hover:scale-125 active:scale-95`}
              >
                {day.count > 0 ? (
                  <span className="leading-none drop-shadow-xs">{day.count}</span>
                ) : null}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/taskmap:block z-50 pointer-events-none">
                <div 
                  className="bg-surface-elevated border border-border px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-2 text-xs font-bold text-foreground animate-fadeIn"
                >
                  <Lucide.CheckSquare size={14} className="text-blue-400" />
                  <div className="flex flex-col">
                    <span>{format(parseISO(day.dateStr), 'EEEE, MMM do')}</span>
                    <span className="text-muted-foreground">{day.count} {day.count === 1 ? 'task' : 'tasks'} completed</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-secondary/40 border border-border/40" />
            <div className="w-3 h-3 rounded-sm bg-blue-500/30" />
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <div className="w-3 h-3 rounded-sm bg-blue-500/90" />
            <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <Lucide.ShieldCheck size={14} /> Task Pipeline Active
        </div>
      </div>
    </div>
  );
};

export const AnalyticsFeature = () => {
  const { dailyLogs, tasks, habits } = useShadowTrackerStore(
    useShallow(state => ({
      dailyLogs: state.dailyLogs,
      tasks: state.tasks,
      habits: state.habits,
    }))
  );
  const [hoveredPoint, setHoveredPoint] = useState<{ 
    x: number; 
    y: number; 
    score: number; 
    date: string;
    completedTasksCount: number;
    totalTasksCount: number;
    completedHabitsCount: number;
    totalHabitsCount: number;
  } | null>(null);

  const stats = useMemo(() => {
    const sortedLogs = [...dailyLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartLogs = sortedLogs.slice(-15);
    const totalLogs = dailyLogs.length;
    const averageFocusScore = totalLogs > 0 ? Math.round(dailyLogs.reduce((acc, log) => acc + log.focusScore, 0) / totalLogs) : 0;
    const longestHabitStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
    const totalCompletedHabits = habits.reduce((total, h) => total + h.completedDates.length, 0);
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalCompletedTasks = completedTasks.length;
    
    const hourCounts: Record<number, number> = {};
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const hour = getHours(parseISO(t.completedAt));
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const mostProductiveHourRaw = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '10';
    const ampm = parseInt(mostProductiveHourRaw) >= 12 ? 'PM' : 'AM';
    const displayHour = (parseInt(mostProductiveHourRaw) % 12 || 12) + ':00 ' + ampm;

    const taskVelocity = totalLogs > 0 ? (totalCompletedTasks / totalLogs).toFixed(1) : '0';
    const habitRanking = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length).slice(0, 3);

    return {
      chartLogs,
      averageFocusScore,
      longestHabitStreak,
      totalCompletedHabits,
      totalCompletedTasks,
      mostProductiveHour: displayHour,
      taskVelocity,
      habitRanking,
    };
  }, [dailyLogs, tasks, habits]);

  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const { points, linePath, areaPath } = useMemo(() => {
    const logs = stats?.chartLogs || [];
    const pts = logs.map((log, index) => {
      const x = padding.left + (index / (Math.max(logs.length - 1, 1))) * (chartWidth - padding.left - padding.right);
      const y = padding.top + (1 - log.focusScore / 100) * (chartHeight - padding.top - padding.bottom);

      const dayTasks = tasks.filter(t => t.dueDate === log.date && !t.isSoftDeleted);
      const completedTasksCount = dayTasks.filter(t => t.isCompleted).length;
      const totalTasksCount = dayTasks.length;

      const completedHabitsCount = habits.filter(h => h.completedDates.includes(log.date)).length;
      const totalHabitsCount = habits.length;

      return { 
        x, 
        y, 
        score: log.focusScore, 
        date: log.date,
        completedTasksCount,
        totalTasksCount,
        completedHabitsCount,
        totalHabitsCount
      };
    });

    const lp = pts.length > 0 
      ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const ap = pts.length > 0
      ? `${lp} L ${pts[pts.length - 1].x} ${chartHeight - padding.bottom} L ${pts[0].x} ${chartHeight - padding.bottom} Z`
      : '';

    return { points: pts, linePath: lp, areaPath: ap };
  }, [stats?.chartLogs, tasks, habits, chartWidth, chartHeight, padding.left, padding.top, padding.right, padding.bottom]);

  const {
    chartLogs,
    averageFocusScore,
    longestHabitStreak,
    totalCompletedHabits,
    totalCompletedTasks,
    mostProductiveHour,
    taskVelocity,
    habitRanking,
  } = stats;

  return (
    <div className="space-y-6 pb-16 relative">
      <BackgroundDecorations />
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Command Center
          </h2>
          <p className="text-xs text-primary font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" /> Live Telemetry Active
          </p>
        </div>
        <div>
          <RadialChart 
            value={chartLogs[chartLogs.length - 1]?.focusScore || 0} 
            label="Today's Focus" 
            color="var(--primary)" 
            size={86} 
            strokeWidth={6} 
          />
        </div>
      </div>

      {/* Habits Monthly Activity Grid */}
      <HabitsMonthlyGridCard />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Avg Focus Index', value: `${averageFocusScore}%`, icon: Lucide.Target, color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', desc: '30-day average focus score across daily logs' },
          { label: 'Peak Streak', value: `${longestHabitStreak}d`, icon: Lucide.Flame, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', desc: 'Highest unbroken streak across all habits' },
          { label: 'Task Velocity', value: `${taskVelocity}/d`, icon: Lucide.Zap, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', desc: 'Average completed tasks per active day' },
          { label: 'Action Count', value: totalCompletedTasks + totalCompletedHabits, icon: Lucide.Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', desc: 'Total tasks & habit check-ins completed' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`tile p-3.5 sm:p-5 relative overflow-hidden group flex flex-col justify-between border ${stat.border} transition-transform active:scale-95`}
          >
            <div>
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-60`} />
              <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl w-fit mb-3`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider sm:tracking-widest block truncate">{stat.label}</span>
              <div className="text-xl sm:text-3xl font-black tracking-tight text-foreground mt-0.5">
                {stat.value}
              </div>
            </div>
            <p className="text-[9.5px] sm:text-[10px] text-muted-foreground/80 font-medium leading-tight mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Focus Timeline Chart & Peak execution cards (Moved DOWN!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 tile p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Lucide.LineChart size={14} className="text-primary" /> Focus Timeline
              </h3>
              <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">Line graph tracking daily focus score percentage across the last 15 days</p>
            </div>
            <div className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider shrink-0">
              Last 15 Records
            </div>
          </div>
          
          <div className="w-full relative aspect-[2.5/1] min-h-[220px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val} className="opacity-30">
                  <line
                    x1={padding.left} y1={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom)}
                    x2={chartWidth - padding.right} y2={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom)}
                    className="stroke-border" strokeWidth={1} strokeDasharray="4,4"
                  />
                  <text x={padding.left - 10} y={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom) + 3} 
                        className="fill-muted-foreground text-xs font-bold" textAnchor="end">{val}</text>
                </g>
              ))}
              {points.map((p, i) => (
                (i % 2 === 0 || i === points.length - 1) && (
                  <text key={`label-${p.date}`} x={p.x} y={chartHeight - 10} className="fill-muted-foreground text-xs font-bold" textAnchor="middle">
                    {format(parseISO(p.date), 'dd/MM')}
                  </text>
                )
              ))}
              {areaPath && (
                <path
                  d={areaPath} fill="url(#chartGradient)"
                  className="transition-opacity duration-500"
                />
              )}
              {linePath && (
                <path
                  d={linePath} className="stroke-primary fill-transparent" strokeWidth={2.5} filter="url(#glow)"
                />
              )}
              {/* Vertical Crosshair Line on Hover */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={padding.top}
                  x2={hoveredPoint.x}
                  y2={chartHeight - padding.bottom}
                  className="stroke-primary/40"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}

              {points.map((p) => (
                <g key={p.date} 
                   onMouseEnter={() => setHoveredPoint(p)}
                   onMouseLeave={() => setHoveredPoint(null)}
                   className="cursor-crosshair group/point"
                >
                  <circle
                    cx={p.x} cy={p.y} r={hoveredPoint?.date === p.date ? 6 : 4}
                    className="fill-card stroke-primary transition-all duration-150" strokeWidth={2} filter="url(#glow)"
                  />
                  <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
                </g>
              ))}
            </svg>

            {/* Top-Center Banner Overlay */}
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, y: -14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[94%] max-w-lg tile p-3.5 rounded-2xl shadow-2xl flex flex-col space-y-2.5 border border-primary/30 bg-surface-elevated/95 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Lucide.Calendar size={13} className="text-primary" />
                      <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                        {format(parseISO(hoveredPoint.date), 'EEEE, MMM dd, yyyy')}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0 flex items-center gap-1">
                      <Lucide.Zap size={11} />
                      {hoveredPoint.score}% Focus State
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs pt-0.5">
                    {/* Tasks box */}
                    <div className="bg-secondary/40 border border-border/40 p-2 rounded-xl flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                          <Lucide.CheckSquare size={12} className="text-blue-400 shrink-0" />
                          Tasks
                        </span>
                        <span className="font-extrabold text-foreground text-[11px]">
                          {hoveredPoint.completedTasksCount} / {hoveredPoint.totalTasksCount} done
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden border border-border/40">
                        <div 
                          className="bg-blue-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${hoveredPoint.totalTasksCount > 0 ? Math.min(100, (hoveredPoint.completedTasksCount / hoveredPoint.totalTasksCount) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Habits box */}
                    <div className="bg-secondary/40 border border-border/40 p-2 rounded-xl flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                          <Lucide.Repeat size={12} className="text-emerald-400 shrink-0" />
                          Habits
                        </span>
                        <span className="font-extrabold text-foreground text-[11px]">
                          {hoveredPoint.completedHabitsCount} / {hoveredPoint.totalHabitsCount} done
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden border border-border/40">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${hoveredPoint.totalHabitsCount > 0 ? Math.min(100, (hoveredPoint.completedHabitsCount / hoveredPoint.totalHabitsCount) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="tile p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Prime Time</h3>
            <p className="text-[10px] text-muted-foreground/80 font-medium mb-4">Hour of the day when you complete the most tasks</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Lucide.Clock size={24} />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-foreground">{mostProductiveHour}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Peak execution window</div>
              </div>
            </div>
          </div>

          <div className="tile p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Top Protocols</h3>
            <p className="text-[10px] text-muted-foreground/80 font-medium mb-4">Your top 3 most frequently completed habits</p>
            <div className="space-y-4">
              {habitRanking.length > 0 ? habitRanking.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 group/habit">
                  <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold group-hover/habit:bg-primary/20 group-hover/habit:text-primary transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-foreground">{h.name}</div>
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-out" 
                        style={{ width: `${Math.min(100, (h.completedDates.length / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-black bg-secondary px-2 py-1 rounded-md">{h.completedDates.length}x</div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground italic">No habit data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Tasks Contribution Heatmap Card */}
      <TasksHeatmapCard />
    </div>
  );
};

export default AnalyticsFeature;
