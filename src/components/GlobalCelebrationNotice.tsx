'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';

export type CelebrationNoticePayload = {
  title: string;
  subtitle: string;
  flowText: string;
  type: 'task' | 'routine';
};

export function GlobalCelebrationNotice() {
  const [celebrationNotice, setCelebrationNotice] = useState<CelebrationNoticePayload | null>(null);

  useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<CelebrationNoticePayload>;
      setCelebrationNotice(customEvent.detail);
      setTimeout(() => setCelebrationNotice(null), 3500);
    };
    window.addEventListener('showCelebrationNotice', handleCelebration);
    return () => window.removeEventListener('showCelebrationNotice', handleCelebration);
  }, []);

  return (
    <AnimatePresence>
      {celebrationNotice && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none bg-surface-elevated border-2 border-primary text-foreground px-3 py-2 sm:px-6 sm:py-3.5 rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.8)] flex items-center gap-2 sm:gap-3.5 select-none max-w-[90vw] overflow-hidden"
        >
          <div className="p-1.5 sm:p-2 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            {celebrationNotice.type === 'routine' ? (
              <Lucide.Flame size={16} className="text-amber-500 fill-amber-500 sm:w-[18px] sm:h-[18px]" />
            ) : (
              <Lucide.CheckCircle2 size={16} className="text-emerald-500 sm:w-[18px] sm:h-[18px]" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary leading-none">{celebrationNotice.title}</span>
            <span className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-0.5 leading-tight">{celebrationNotice.subtitle}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-primary/15 border border-primary/30 text-primary shrink-0 shadow-2xs whitespace-nowrap">
            {celebrationNotice.flowText}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
