'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { ALL_BADGES, BadgeDefinition } from '@/lib/quotes';
import { fireConfetti } from '@/lib/confetti';
import { useShadowTrackerStore } from '@/store';

export function GlobalBadgeCelebration() {
  const { isLoading, settings } = useShadowTrackerStore();
  const [celebratingBadge, setCelebratingBadge] = useState<BadgeDefinition | null>(null);
  const [isMultiUnlock, setIsMultiUnlock] = useState<boolean>(false);
  const [multiUnlockCount, setMultiUnlockCount] = useState<number>(0);
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAppFullyLaunched = !isLoading && Boolean(settings?.isCompletedOnboarding);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (celebratingBadge || isMultiUnlock) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [celebratingBadge, isMultiUnlock]);

  useEffect(() => {
    if (!isAppFullyLaunched) {
      setIsReady(false);
      return;
    }
    const t = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(t);
  }, [isAppFullyLaunched]);

  useEffect(() => {
    const handleBadgeUnlockedEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const badgeId = customEvent.detail;
      const foundBadge = ALL_BADGES.find(b => b.id === badgeId);
      if (foundBadge) {
        setQueue(prev => [...prev, foundBadge]);
      }
    };
    window.addEventListener('badgeUnlocked', handleBadgeUnlockedEvent);
    return () => window.removeEventListener('badgeUnlocked', handleBadgeUnlockedEvent);
  }, []);

  useEffect(() => {
    if (isReady && !celebratingBadge && !isMultiUnlock && queue.length > 0) {
      const timer = setTimeout(() => {
        if (queue.length > 1) {
          setIsMultiUnlock(true);
          setMultiUnlockCount(queue.length);
          setQueue([]);
          setTimeout(() => fireConfetti(), 100);
        } else if (queue.length === 1) {
          setIsMultiUnlock(false);
          setCelebratingBadge(queue[0]);
          setQueue([]);
          setTimeout(() => fireConfetti(), 100);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, celebratingBadge, isMultiUnlock, queue]);

  // Hard limit: auto-dismiss any celebration after 1.5 seconds
  useEffect(() => {
    if (celebratingBadge || isMultiUnlock) {
      const autoCloseTimer = setTimeout(() => {
        setCelebratingBadge(null);
        setIsMultiUnlock(false);
      }, 1500);
      return () => clearTimeout(autoCloseTimer);
    }
  }, [celebratingBadge, isMultiUnlock]);

  const celebrationContent = (
    <AnimatePresence>
      {isMultiUnlock && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 pointer-events-auto overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsMultiUnlock(false)}
            className="fixed inset-0 bg-[#030603]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/60 text-foreground rounded-3xl p-6 shadow-2xl overflow-hidden z-10 flex flex-col items-center text-center space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 rounded-3xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 w-16 h-16 flex items-center justify-center shadow-lg">
              <Lucide.Trophy size={32} className="text-cyan-300" />
            </div>
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                MULTIPLE ACHIEVEMENTS UNLOCKED
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight pt-1">
                {multiUnlockCount} Badges Unlocked!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto pt-0.5">
                You&apos;ve unlocked {multiUnlockCount} new achievements simultaneously. Visit your Dashboard to view your new badges!
              </p>
            </div>
            <button
              onClick={() => setIsMultiUnlock(false)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md border border-cyan-300/40 cursor-pointer active:scale-[0.98] transition-all"
            >
              View Dashboard Achievements
            </button>
          </motion.div>
        </div>
      )}

      {celebratingBadge && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 pointer-events-auto overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setCelebratingBadge(null)}
            className="fixed inset-0 bg-[#030603]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/60 text-foreground rounded-3xl p-6 shadow-2xl overflow-hidden z-10 flex flex-col items-center text-center space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Cyan Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500" />

            {/* Badge Icon Container */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-1">
              <div className="p-4 rounded-3xl bg-slate-950 border-2 border-cyan-400/60 text-cyan-300 shadow-lg relative">
                {React.createElement((Lucide[celebratingBadge.icon as keyof typeof Lucide] || Lucide.Award) as React.ElementType, { 
                  size: 40, 
                  className: "text-cyan-300" 
                })}
              </div>
            </div>

            {/* Badge Metadata */}
            <div className="relative z-10 space-y-1.5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {celebratingBadge.subtitle}
              </span>

              <h2 className="text-xl font-bold text-white tracking-tight pt-0.5">
                {celebratingBadge.name}
              </h2>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl max-w-xs mx-auto">
                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {celebratingBadge.description}
                </p>
              </div>
            </div>

            {/* Unlock Requirement Box */}
            <div className="relative z-10 p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2">
              <Lucide.ShieldCheck size={14} className="text-cyan-400 shrink-0" />
              <span className="tracking-wide text-[11px]">{celebratingBadge.requirement}</span>
            </div>

            {/* Claim Button */}
            <button
              onClick={() => setCelebratingBadge(null)}
              className="relative z-10 w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md border border-cyan-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Lucide.Sparkles size={15} />
              <span>Claim Badge</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof window === 'undefined') return null;
  return createPortal(celebrationContent, document.body);
}
