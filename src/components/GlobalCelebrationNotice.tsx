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
          className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-surface-elevated opacity-100 border-2 border-primary text-foreground px-6 py-3.5 rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.7)] flex items-center gap-3.5 select-none"
        >
          <div className="p-2 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            {celebrationNotice.type === 'routine' ? (
              <Lucide.Flame size={18} className="text-amber-500 fill-amber-500" />
            ) : (
              <Lucide.CheckCircle2 size={18} className="text-emerald-500" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{celebrationNotice.title}</span>
            <span className="text-sm font-extrabold text-foreground truncate max-w-[200px] mt-0.5 leading-tight">{celebrationNotice.subtitle}</span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary shrink-0 shadow-2xs">
            {celebrationNotice.flowText}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
