'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { DailyHealthData } from './HealthFeature';
import { getTodayDateString } from '@/lib/dateUtils';

interface HealthCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  healthMap: Record<string, DailyHealthData>;
}

export default function HealthCalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  healthMap,
}: HealthCalendarModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);



  const todayStr = useMemo(() => getTodayDateString(), []);

  // Parse current viewing month/year from selectedDate
  const [viewYear, setViewYear] = useState<number>(() => {
    const parts = selectedDate.split('-').map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const parts = selectedDate.split('-').map(Number);
    return (parts[1] || new Date().getMonth() + 1) - 1; // 0-indexed
  });

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(todayStr);
    onClose();
  };

  // Month name
  const monthName = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }, [viewYear, viewMonth]);

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Actual days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = healthMap[dateStr];
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      // Extract day metrics
      const waterMet = data ? data.waterIntakeMl >= (data.waterGoalMl || 2500) : false;
      const waterLogged = data ? data.waterIntakeMl > 0 : false;
      
      const totalCal = data?.loggedFoods
        ? data.loggedFoods.reduce((s, f) => s + f.calories * (f.quantity || 1), 0)
        : 0;
      const calGoal = data?.calorieGoal || 2000;
      const calOnTarget = totalCal > 0 && totalCal <= calGoal;
      const calOver = totalCal > calGoal;

      const sleepMet = data ? data.sleepHours >= 7 : false;
      const workoutLogged = data ? data.workouts && data.workouts.length > 0 : false;

      days.push({
        empty: false,
        dayNum: d,
        dateStr,
        isToday,
        isSelected,
        waterMet,
        waterLogged,
        calOnTarget,
        calOver,
        sleepMet,
        workoutLogged,
        totalCal,
        key: dateStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, healthMap, todayStr, selectedDate]);

  // Lock body & document scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
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
    }
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-4 pointer-events-auto overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
        style={{ touchAction: 'none' }}
        className="fixed inset-0 bg-black/85"
      />

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        className="relative w-full max-w-md bg-surface-elevated border border-border/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden my-auto z-10 cursor-default"
      >
        {/* Calendar Header with Nav & Today Jump */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/15 text-primary rounded-xl">
              <Lucide.Calendar size={16} />
            </span>
            <span className="text-sm font-black text-foreground">{monthName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={jumpToToday}
              className="px-2.5 py-1 text-[10px] font-black bg-primary/15 text-primary hover:bg-primary/25 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <Lucide.ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <Lucide.ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer ml-1"
            >
              <Lucide.X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Calendar Body */}
        <div className="overflow-y-auto overscroll-contain touch-pan-y flex-1 min-h-0 space-y-2 pr-0.5 custom-scrollbar">
          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted-foreground uppercase pb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(cell => {
              if (cell.empty) {
                return <div key={cell.key} className="h-12 w-full" />;
              }

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => {
                    onSelectDate(cell.dateStr!);
                    onClose();
                  }}
                  className={`h-12 rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer border relative group ${
                    cell.isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 ring-2 ring-primary/40'
                      : cell.isToday
                      ? 'bg-surface border-primary/50 text-foreground ring-1 ring-primary/40'
                      : 'bg-secondary/40 hover:bg-secondary text-foreground border-border/50'
                  }`}
                >
                  {/* Day Number */}
                  <span
                    className={`text-xs font-black font-mono leading-none ${
                      cell.isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Micro Visual Indicators Row (No clutter words) */}
                  <div className="flex items-center gap-0.5 justify-center w-full">
                    {/* Water: Sky blue dot */}
                    {cell.waterMet ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-xs" title="Water Goal Reached" />
                    ) : cell.waterLogged ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500/40" title="Water Logged" />
                    ) : null}

                    {/* Calorie: Green (on-target) or Red (over limit) */}
                    {cell.calOver ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Calories Over Limit" />
                    ) : cell.calOnTarget ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Calories on Target" />
                    ) : null}

                    {/* Sleep: Purple/Indigo dot */}
                    {cell.sleepMet && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="7h+ Sleep Logged" />
                    )}

                    {/* Workout: Amber dot */}
                    {cell.workoutLogged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Workout Active" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Micro Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[10px] font-bold text-muted-foreground px-1 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Water Met
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Calorie Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Over Limit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> Sleep 7h+
          </span>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
