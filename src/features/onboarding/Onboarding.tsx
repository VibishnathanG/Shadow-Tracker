'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';

export const Onboarding: React.FC = () => {
  const [slide, setSlide] = useState(0);
  const { updateSettings } = useShadowTrackerStore();

  const handleComplete = () => {
    updateSettings({ isCompletedOnboarding: true });
  };

  const slides = [
    {
      title: 'Welcome to Shadow-Tracker',
      subtitle: 'A quiet, disciplined personal operating system built to elevate your focus, habits, and daily consistency.',
      icon: 'Moon',
      color: 'from-violet-500 to-indigo-600',
      bullets: [
        'Live Dashboard with Focus Score telemetry and streak counters.',
        'Interactive Wizard Mascot providing daily wisdom and motivation.',
        '100% offline and local-first: your data never leaves your device.',
      ]
    },
    {
      title: 'Smart Tasks & Flexible Habits',
      subtitle: 'Organize your daily execution with precision task filters and customizable habit schedules.',
      icon: 'CheckSquare',
      color: 'from-orange-500 to-rose-600',
      bullets: [
        'Tasks with High/Medium/Low priority, due dates, and 1-click snooze.',
        'Habits with Daily, Once-a-Week (1-tick week lock), or Custom Days.',
        'Streak milestone tracking to build unbreakable momentum.',
      ]
    },
    {
      title: 'Analytics Command Center',
      subtitle: 'Visualize your execution velocity with real-time performance telemetry and interactive grids.',
      icon: 'TrendingUp',
      color: 'from-emerald-500 to-teal-600',
      bullets: [
        '15-Day Focus Timeline tracking peak performance state.',
        'Interactive 4-5 Week Habits Grid with live checkbox check-ins.',
        'GitHub-style Tasks Contribution Heatmap showing 49-day execution.',
      ]
    },
    {
      title: 'Journal, Wealth & Custom Themes',
      subtitle: 'A complete environment tailored for mindfulness, financial clarity, and visual aesthetics.',
      icon: 'Palette',
      color: 'from-purple-500 to-pink-600',
      bullets: [
        'Daily Markdown Journal with instant search and reflections.',
        'Wealth Tracker for income, savings, expenses, and investments.',
        '5 dynamic themes (Obsidian, Cyberpunk, OneDark, Midnight, Light).',
      ]
    }
  ];

  const current = slides[slide];
  const MainIcon = (Lucide[current.icon as keyof typeof Lucide] || Lucide.Sparkles) as React.ElementType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 md:p-6 select-none overflow-hidden">
      {/* Dynamic background lights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse-slow [will-change:transform,opacity]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow [will-change:transform,opacity]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative w-full max-w-xl tile overflow-hidden p-6 md:p-10 flex flex-col items-center text-center max-h-[90vh]"
      >
        {/* Progress indicator */}
        <div className="flex gap-1.5 justify-center mb-8">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === slide ? 'w-8 bg-primary' : 'w-2 bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Icon Sphere */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.7, opacity: 0, rotate: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${current.color} flex items-center justify-center text-primary-foreground shadow-lg mb-6`}
          >
            <MainIcon size={36} className="text-white" />
          </motion.div>
        </AnimatePresence>

        {/* Texts */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 overflow-y-auto mb-8 px-2"
          >
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-foreground">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
              {current.subtitle}
            </p>

            <ul className="text-left max-w-xs md:max-w-sm mx-auto space-y-3.5">
              {current.bullets.map((bullet, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-foreground/85">
                  <Lucide.CheckCircle2 className="text-primary mt-0.5 flex-shrink-0" size={14} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        {/* Buttons footer */}
        <div className="w-full flex items-center justify-between border-t border-border/40 pt-6 mt-auto">
          {slide > 0 ? (
            <button
              onClick={() => setSlide(prev => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Lucide.ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <div />
          )}

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(prev => prev + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue
              <Lucide.ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lucide.Sparkles size={14} className="text-white" />
              Enter Tracker
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
