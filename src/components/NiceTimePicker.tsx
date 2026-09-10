'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lucide } from '@/components/icons';

interface NiceTimePickerProps {
  value: string; // "HH:MM" in 24h format
  onChange: (value: string) => void;
  label?: string;
}

export const NiceTimePicker: React.FC<NiceTimePickerProps> = ({
  value,
  onChange,
  label = 'Notification Time',
}) => {
  // Parse initial 24h string into 12h representation
  const parse24h = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return { h: 9, m: 0, ampm: 'AM' as const };
    const [h24, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
    const ampm = h24 >= 12 ? ('PM' as const) : ('AM' as const);
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { h: h12, m: Math.floor(m / 5) * 5, ampm };
  };

  const initial = parse24h(value);
  const [hour12, setHour12] = useState<number>(initial.h);
  const [minute, setMinute] = useState<number>(initial.m);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>(initial.ampm);

  useEffect(() => {
    const parsed = parse24h(value);
    setHour12(parsed.h);
    setMinute(parsed.m);
    setAmPm(parsed.ampm);
  }, [value]);

  const emitTime = (h12: number, min: number, period: 'AM' | 'PM') => {
    let h24 = h12;
    if (period === 'PM' && h12 < 12) h24 += 12;
    if (period === 'AM' && h12 === 12) h24 = 0;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(min).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleHourChange = (newH: number) => {
    setHour12(newH);
    emitTime(newH, minute, ampm);
  };

  const handleMinuteChange = (newM: number) => {
    setMinute(newM);
    emitTime(hour12, newM, ampm);
  };

  const handleAmPmToggle = (newPeriod: 'AM' | 'PM') => {
    setAmPm(newPeriod);
    emitTime(hour12, minute, newPeriod);
  };

  const quickPresets = [
    { label: '08:00 AM', val: '08:00' },
    { label: '12:00 PM', val: '12:00' },
    { label: '06:00 PM', val: '18:00' },
    { label: '09:00 PM', val: '21:00' },
  ];

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Lucide.Clock size={13} className="text-primary" />
            {label}
          </label>
          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')} {ampm}
          </span>
        </div>
      )}

      {/* Main Interactive Time Card */}
      <div className="bg-surface-elevated/40 backdrop-blur-xl border border-border/80 rounded-2xl p-3.5 space-y-3 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          {/* Hour Select */}
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block text-center">Hour</span>
            <select
              value={hour12}
              onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
              className="w-full bg-surface-elevated/60 backdrop-blur-md text-foreground font-black text-base py-2 px-3 rounded-xl border border-border/70 text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none shadow-xs hover:border-primary/50 transition-all"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xl font-black text-primary font-mono mt-4">:</span>

          {/* Minute Select */}
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block text-center">Minute</span>
            <select
              value={minute}
              onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
              className="w-full bg-surface-elevated/60 backdrop-blur-md text-foreground font-black text-base py-2 px-3 rounded-xl border border-border/70 text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none shadow-xs hover:border-primary/50 transition-all"
            >
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          {/* AM / PM Toggle Pill */}
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block text-center">Period</span>
            <div className="flex bg-surface-elevated/60 backdrop-blur-md p-1 rounded-xl border border-border/70 shadow-inner gap-1">
              <button
                type="button"
                onClick={() => handleAmPmToggle('AM')}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  ampm === 'AM'
                    ? 'filter-pill active !py-1 !px-0 text-xs font-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleAmPmToggle('PM')}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  ampm === 'PM'
                    ? 'filter-pill active !py-1 !px-0 text-xs font-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          {quickPresets.map((preset) => (
            <motion.button
              key={preset.val}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(preset.val)}
              className={`filter-pill !py-1 !px-3 text-[11px] font-black whitespace-nowrap transition-all ${
                value === preset.val ? 'active' : ''
              }`}
            >
              {preset.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
