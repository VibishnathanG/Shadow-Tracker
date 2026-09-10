'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';

export interface ScheduleSelectorProps {
  selectedDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  onChange: (days: number[]) => void;
  label?: string;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [0, 6];

const DAY_LABELS = [
  { id: 0, short: 'S', full: 'Sunday' },
  { id: 1, short: 'M', full: 'Monday' },
  { id: 2, short: 'T', full: 'Tuesday' },
  { id: 3, short: 'W', full: 'Wednesday' },
  { id: 4, short: 'T', full: 'Thursday' },
  { id: 5, short: 'F', full: 'Friday' },
  { id: 6, short: 'S', full: 'Saturday' },
];

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  selectedDays,
  onChange,
  label = 'Schedule & Notification Pattern',
}) => {
  const isSameSet = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const isDaily = isSameSet(selectedDays, ALL_DAYS);
  const isWeekdays = isSameSet(selectedDays, WEEKDAYS);
  const isWeekends = isSameSet(selectedDays, WEEKENDS);

  const getPresetValue = () => {
    if (isDaily) return 'daily';
    if (isWeekdays) return 'weekdays';
    if (isWeekends) return 'weekends';
    if (selectedDays.length === 1) return `day-${selectedDays[0]}`;
    return 'custom';
  };

  const handlePresetSelect = (preset: string) => {
    if (preset === 'daily') {
      onChange(ALL_DAYS);
    } else if (preset === 'weekdays') {
      onChange(WEEKDAYS);
    } else if (preset === 'weekends') {
      onChange(WEEKENDS);
    } else if (preset.startsWith('day-')) {
      const dayNum = parseInt(preset.split('-')[1], 10);
      onChange([dayNum]);
    } else if (preset === 'once') {
      onChange([]);
    }
  };

  const toggleSingleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      onChange(selectedDays.filter((d) => d !== dayId).sort());
    } else {
      onChange([...selectedDays, dayId].sort());
    }
  };

  const getActiveScheduleLabel = () => {
    if (isDaily) return 'Every Single Day';
    if (isWeekdays) return 'Weekdays Only (Mon - Fri)';
    if (isWeekends) return 'Weekends Only (Sat - Sun)';
    if (selectedDays.length === 0) return 'One-Time Only';
    if (selectedDays.length === 1) {
      const dayObj = DAY_LABELS.find((d) => d.id === selectedDays[0]);
      return `Every ${dayObj?.full || 'Week'}`;
    }
    return `${selectedDays.length} Days Selected`;
  };

  return (
    <div className="space-y-2.5">
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Lucide.Repeat size={13} className="text-primary shrink-0" />
            {label}
          </label>
          <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0 whitespace-nowrap">
            {getActiveScheduleLabel()}
          </span>
        </div>
      )}

      <div className="bg-surface-elevated/40 backdrop-blur-xl border border-border/80 rounded-2xl p-3.5 space-y-3 shadow-inner">
        {/* Preset Selector Dropdown */}
        <div className="relative">
          <select
            value={getPresetValue()}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full text-xs font-bold pl-3.5 pr-8 py-2.5 bg-surface-elevated/60 backdrop-blur-md text-foreground rounded-xl border border-border/70 outline-none focus:border-primary cursor-pointer appearance-none shadow-xs hover:border-primary/50 transition-all"
          >
            <option value="daily">🌟 Every Single Day (Daily)</option>
            <option value="weekdays">💼 Weekdays Only (Mon - Fri)</option>
            <option value="weekends">🏖️ Weekends Only (Sat - Sun)</option>
            <option value="day-1">📅 Every Monday</option>
            <option value="day-2">📅 Every Tuesday</option>
            <option value="day-3">📅 Every Wednesday</option>
            <option value="day-4">📅 Every Thursday</option>
            <option value="day-5">📅 Every Friday</option>
            <option value="day-6">📅 Every Saturday</option>
            <option value="day-0">📅 Every Sunday</option>
            <option value="custom">🎯 Custom Days Selector</option>
            <option value="once">⚡ One-Time (No Repeat)</option>
          </select>
          <Lucide.ChevronDown size={14} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
        </div>

        {/* Custom Day Pills */}
        <div>
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-1.5">
            Select Days
          </span>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_LABELS.map((day) => {
              const isActive = selectedDays.includes(day.id);
              return (
                <motion.button
                  key={day.id}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSingleDay(day.id)}
                  title={`Toggle ${day.full}`}
                  className={`h-9 rounded-xl font-black text-xs flex flex-col items-center justify-center border transition-all ${
                    isActive
                      ? 'filter-pill active !p-0 shadow-md shadow-primary/30 scale-[1.04]'
                      : 'filter-pill !p-0 text-muted-foreground hover:text-foreground hover:border-border-focus'
                  }`}
                >
                  <span>{day.short}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
