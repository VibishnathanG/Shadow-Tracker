'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';

export type CritterType = 
  | 'spider' 
  | 'dumbbell' 
  | 'car' 
  | 'flying_money' 
  | 'hacker' 
  | 'flow' 
  | 'rocket' 
  | 'cricket' 
  | 'arc_reactor' 
  | 'coin' 
  | 'spark' 
  | 'crown'
  | 'ufo'
  | 'jet'
  | 'hoverboard'
  | 'phoenix';

export const ALL_CRITTERS: CritterType[] = [
  'spider', 
  'dumbbell', 
  'car', 
  'flying_money', 
  'hacker', 
  'rocket', 
  'cricket', 
  'arc_reactor', 
  'flow', 
  'coin', 
  'crown', 
  'spark',
  'ufo',
  'jet',
  'hoverboard',
  'phoenix'
];

// Helper for seamless continuous horizontal motion
const getLinearMotion = (isGlobal: boolean, isRtl: boolean, duration: number) => {
  const startX = isRtl ? (isGlobal ? 1100 : 340) : (isGlobal ? -120 : -50);
  const endX = isRtl ? (isGlobal ? -120 : -50) : (isGlobal ? 1100 : 340);
  return {
    initial: { x: startX, opacity: 0 },
    animate: { 
      x: endX, 
      opacity: [0, 1, 1, 1, 0] 
    },
    transition: { 
      duration: isGlobal ? duration : duration * 0.7, 
      ease: 'linear' as const,
      times: [0, 0.08, 0.85, 0.96, 1]
    }
  };
};

// --- 1. SPIDER: Realistic Spiderman-Style Spider with Continuous Fluid Scurrying ---
export const SpiderCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 15 }}
      transition={motionProps.transition}
    >
      <motion.div 
        className="relative"
        animate={{ rotate: isRtl ? [174, 186, 174] : [-6, 6, -6] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center center' }}
      >
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" className="text-red-500 dark:text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">
          {/* Cephalothorax & Abdomen (Sleek Angular Spiderman Silhouette) */}
          <path d="M 50 20 L 56 32 L 54 44 L 46 44 L 44 32 Z" fill="currentColor" />
          <path d="M 46 45 L 54 45 L 57 60 L 50 78 L 43 60 Z" fill="currentColor" />
          {/* Pedipalps */}
          <path d="M 47 20 L 44 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M 53 20 L 56 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* Spider Eyes */}
          <polygon points="47,26 49,29 46,31" fill="#fff" />
          <polygon points="53,26 51,29 54,31" fill="#fff" />

          {/* Left Legs */}
          <motion.path
            d="M 47 30 L 32 18 L 20 25 L 12 18"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 47 30 L 32 18 L 20 25 L 12 18", "M 47 30 L 30 12 L 18 20 L 10 12", "M 47 30 L 32 18 L 20 25 L 12 18"] }}
            transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 46 36 L 26 28 L 14 40 L 6 36"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 46 36 L 26 28 L 14 40 L 6 36", "M 46 36 L 24 22 L 12 34 L 5 28", "M 46 36 L 26 28 L 14 40 L 6 36"] }}
            transition={{ duration: 0.32, repeat: Infinity, delay: 0.08, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 46 42 L 24 46 L 14 62 L 7 60"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 46 42 L 24 46 L 14 62 L 7 60", "M 46 42 L 22 40 L 12 56 L 6 52", "M 46 42 L 24 46 L 14 62 L 7 60"] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: 0.04, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 48 44 L 28 62 L 16 76 L 10 82"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 48 44 L 28 62 L 16 76 L 10 82", "M 48 44 L 32 68 L 20 84 L 14 88", "M 48 44 L 28 62 L 16 76 L 10 82"] }}
            transition={{ duration: 0.34, repeat: Infinity, delay: 0.12, ease: 'easeInOut' }}
          />

          {/* Right Legs */}
          <motion.path
            d="M 53 30 L 68 18 L 80 25 L 88 18"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 53 30 L 68 18 L 80 25 L 88 18", "M 53 30 L 70 12 L 82 20 L 90 12", "M 53 30 L 68 18 L 80 25 L 88 18"] }}
            transition={{ duration: 0.28, repeat: Infinity, delay: 0.14, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 54 36 L 74 28 L 86 40 L 94 36"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 54 36 L 74 28 L 86 40 L 94 36", "M 54 36 L 76 22 L 88 34 L 95 28", "M 54 36 L 74 28 L 86 40 L 94 36"] }}
            transition={{ duration: 0.32, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 54 42 L 76 46 L 86 62 L 93 60"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 54 42 L 76 46 L 86 62 L 93 60", "M 54 42 L 78 40 L 88 56 L 94 52", "M 54 42 L 76 46 L 86 62 L 93 60"] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: 0.16, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 52 44 L 72 62 L 84 76 L 90 82"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 52 44 L 72 62 L 84 76 L 90 82", "M 52 44 L 68 68 L 80 84 L 86 88", "M 52 44 L 72 62 L 84 76 L 90 82"] }}
            transition={{ duration: 0.34, repeat: Infinity, delay: 0.24, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// --- 2. DUMBBELL: Continuous Rolling with 360° Spin ---
export const DumbbellCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 45 : 25 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 45 : 25 }}
      transition={motionProps.transition}
    >
      <motion.div
        animate={{ rotate: isRtl ? -1440 : 1440 }}
        transition={{ duration: isGlobal ? 8 : 5.6, ease: 'linear', repeat: Infinity }}
        className="w-9 h-9 flex items-center justify-center drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]"
      >
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" className="text-amber-500">
          <rect x="25" y="45" width="50" height="10" rx="3" fill="currentColor" />
          <line x1="38" y1="46" x2="38" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
          <line x1="45" y1="46" x2="45" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
          <line x1="55" y1="46" x2="55" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
          <line x1="62" y1="46" x2="62" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
          <rect x="18" y="24" width="8" height="52" rx="3" fill="currentColor" />
          <rect x="10" y="32" width="7" height="36" rx="2.5" fill="currentColor" opacity="0.85" />
          <rect x="74" y="24" width="8" height="52" rx="3" fill="currentColor" />
          <rect x="83" y="32" width="7" height="36" rx="2.5" fill="currentColor" opacity="0.85" />
          <circle cx="10" cy="50" r="3" fill="#fff" opacity="0.8" />
          <circle cx="90" cy="50" r="3" fill="#fff" opacity="0.8" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// --- 3. CAR: Smooth Sports Car with Streaming Exhaust Smoke ---
export const CarCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 35 : 20 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 35 : 20 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Trailing Smoke Clouds */}
        <div className="absolute -left-10 bottom-1 flex items-center gap-1 pointer-events-none">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-slate-400/60 dark:bg-slate-300/40 blur-[1px]"
              animate={{
                scale: [0.6, 1.8, 2.5],
                x: [-2, -22 - idx * 8],
                y: [-1, -6 - idx * 3],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: idx * 0.22,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>

        {/* Cyber Sports Car */}
        <div className="relative drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
          <svg width="68" height="34" viewBox="0 0 100 50" fill="none">
            <line x1="0" y1="46" x2="100" y2="46" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" className="text-slate-400" />
            <path
              d="M 12 36 L 20 24 L 38 15 L 68 15 L 84 26 L 96 32 L 96 40 L 12 40 Z"
              fill="#2563eb"
              stroke="#60a5fa"
              strokeWidth="2"
            />
            <polygon points="40,18 64,18 78,28 35,28" fill="#93c5fd" opacity="0.85" />
            <polygon points="94,32 100,28 100,42 94,38" fill="#fde047" opacity="0.9" />
            <rect x="12" y="32" width="3" height="6" rx="1" fill="#ef4444" />

            {/* Front Wheel */}
            <g transform="translate(76, 40)">
              <circle cx="0" cy="0" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <motion.line
                x1="-5" y1="0" x2="5" y2="0"
                stroke="#f8fafc" strokeWidth="1.5"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }}
              />
              <motion.line
                x1="0" y1="-5" x2="0" y2="5"
                stroke="#f8fafc" strokeWidth="1.5"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }}
              />
            </g>

            {/* Rear Wheel */}
            <g transform="translate(26, 40)">
              <circle cx="0" cy="0" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <motion.line
                x1="-5" y1="0" x2="5" y2="0"
                stroke="#f8fafc" strokeWidth="1.5"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }}
              />
              <motion.line
                x1="0" y1="-5" x2="0" y2="5"
                stroke="#f8fafc" strokeWidth="1.5"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'linear' }}
              />
            </g>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- 4. FLYING MONEY: Banknote Flapping Wings ---
export const FlyingMoneyCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 25 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 25 : 15 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Flapping Angel / Fairy Wings */}
        <motion.div
          className="absolute -top-3 left-4 origin-bottom"
          animate={{ rotate: [-24, 28, -24], scaleY: [0.85, 1.15, 0.85] }}
          transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="24" height="20" viewBox="0 0 40 30" fill="none">
            <path d="M 5 28 C 0 10, 20 0, 38 5 C 32 15, 20 22, 5 28 Z" fill="#f8fafc" opacity="0.85" stroke="#cbd5e1" strokeWidth="1.2" />
          </svg>
        </motion.div>

        {/* Banknote */}
        <div className="relative drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]">
          <svg width="50" height="28" viewBox="0 0 100 56" fill="none">
            <rect x="2" y="2" width="96" height="52" rx="4" fill="#10b981" stroke="#059669" strokeWidth="2.5" />
            <rect x="8" y="8" width="84" height="40" rx="3" fill="#34d399" opacity="0.4" stroke="#047857" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="50" cy="28" r="14" fill="#047857" opacity="0.8" />
            <text x="50" y="35" fontSize="22" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="sans-serif">$</text>
          </svg>
        </div>

        {/* Golden Sparkles */}
        <motion.span
          className="absolute -bottom-2 -left-2 text-[10px] font-black text-amber-400 select-none"
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          ✦
        </motion.span>
      </div>
    </motion.div>
  );
};

// --- 5. HACKER TERMINAL: Matrix Bytes Streamer ---
export const HackerCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 18 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 18 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center gap-2 ${isRtl ? 'scale-x-[-1]' : ''}`}>
        <div className="w-24 h-15 rounded-xl bg-slate-950/95 border border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.5)] p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-0.5">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[7px] font-mono text-emerald-400 font-bold">&gt;_ ROOT</span>
          </div>

          <div className="text-[7.5px] font-mono text-emerald-300 font-bold leading-tight">
            <div>ACK 200</div>
            <div className="flex items-center gap-0.5">
              <span>ROOT</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-1 h-2 bg-emerald-400 inline-block"
              />
            </div>
          </div>
        </div>

        {/* Streaming Out Bytes */}
        <div className="flex flex-col gap-0.5 items-start overflow-hidden w-10">
          {['BYTE', '0x7F', '1100'].map((byte, idx) => (
            <motion.span
              key={idx}
              className="text-[9px] font-mono font-bold text-cyan-400 leading-none select-none"
              animate={{ x: [-4, 16], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.2, ease: 'linear' }}
            >
              {byte}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- 6. ROCKET: Aerodynamically Aligned Space Rocket with Exhaust Fire (FIXED ALIGNMENT) ---
export const RocketCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 35 : 20 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 35 : 20 }}
      transition={motionProps.transition}
    >
      {/* 
        Alignment Fix:
        SVG rocket is drawn pointing horizontally forward (nose at x=88, thruster at x=14).
        Pitch is set to -3° (pointing forward with aerodynamic climb angle) when flying LTR,
        and cleanly mirrored when flying RTL so it never looks twisted!
      */}
      <div 
        className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}
        style={{ transform: isRtl ? 'scaleX(-1) rotate(3deg)' : 'rotate(-3deg)' }}
      >
        {/* Thruster Fire & Trailing Exhaust Particles */}
        <div className="absolute -left-9 top-2 flex items-center pointer-events-none">
          <motion.div
            className="w-9 h-4 rounded-l-full bg-gradient-to-l from-amber-400 via-orange-500 to-transparent blur-[1px]"
            animate={{ scaleX: [0.8, 1.4, 0.8], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.16, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="text-[9px] text-amber-300 font-black absolute -left-2 top-0 select-none"
            animate={{ x: [-2, -10], opacity: [1, 0], scale: [1, 0.4] }}
            transition={{ duration: 0.25, repeat: Infinity, ease: 'linear' }}
          >
            ✦
          </motion.span>
        </div>

        {/* Space Rocket SVG */}
        <div className="relative drop-shadow-[0_0_14px_rgba(249,115,22,0.65)]">
          <svg width="56" height="30" viewBox="0 0 100 50" fill="none">
            {/* Rocket Fuselage */}
            <path
              d="M 20 25 C 20 18, 55 15, 85 25 C 55 35, 20 32, 20 25 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {/* Nose Cone */}
            <path d="M 70 18 Q 88 25 70 32 Z" fill="#ef4444" />
            {/* Cockpit Porthole */}
            <circle cx="58" cy="25" r="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="56" cy="23" r="1.5" fill="#fff" />
            {/* Top Fin */}
            <polygon points="22,18 12,8 35,16" fill="#ef4444" />
            {/* Bottom Fin */}
            <polygon points="22,32 12,42 35,34" fill="#ef4444" />
            {/* Exhaust Nozzle */}
            <rect x="14" y="21" width="6" height="8" rx="1.5" fill="#475569" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- 7. CRICKET: Batsman swinging willow and launching a towering Six! ---
export const CricketCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 25 : 12 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 25 : 12 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Batsman with Continuous Bat Swing */}
        <div className="relative flex items-center">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <circle cx="36" cy="24" r="8" fill="#3b82f6" />
            <path d="M 38 24 L 44 26" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            <path d="M 34 32 L 40 56 L 30 58 Z" fill="#2563eb" />
            <rect x="26" y="58" width="6" height="26" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="34" y="58" width="6" height="26" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <motion.g
              animate={{ rotate: [-20, 65, -20] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '40px 42px' }}
            >
              <line x1="40" y1="42" x2="62" y2="28" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
              <rect x="60" y="22" width="22" height="6.5" rx="1.5" transform="rotate(-32 60 22)" fill="#eab308" stroke="#a16207" strokeWidth="1" />
            </motion.g>
          </svg>
        </div>

        {/* Towering Parabolic Cricket Ball Launching for a SIX */}
        <motion.div
          className="absolute left-14 top-4 pointer-events-none"
          animate={{
            x: isGlobal ? [0, 60, 140, 220, 300] : [0, 40, 90, 140, 180],
            y: [0, -32, -45, -28, 5],
            opacity: [1, 1, 1, 1, 0.4]
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 720 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 rounded-full bg-red-600 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex items-center justify-center"
            >
              <line x1="2" y1="8" x2="14" y2="8" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            </motion.div>
            <span className="absolute -top-3 -right-2 text-[10px] font-black text-amber-400 select-none">✦</span>
          </div>
        </motion.div>

        {/* "SIX!" Badge Chip */}
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className="ml-3 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-black text-[9px] tracking-wider uppercase shadow-xs select-none"
        >
          SIX! 🏏 6️⃣
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 8. IRON MAN ARC REACTOR: Continuous Energy Core with Radiating Pulse ---
export const ArcReactorCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 flex items-center justify-center ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 15 }}
      transition={motionProps.transition}
    >
      <div className="relative flex items-center justify-center">
        {/* Continuous Radiating Electromagnetic Shockwave Pulse */}
        <motion.div
          animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute w-12 h-12 rounded-full border border-cyan-400 bg-cyan-400/15"
        />

        {/* Arc Reactor Core SVG */}
        <motion.div
          animate={{ scale: [0.97, 1.04, 0.97] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
          className="relative drop-shadow-[0_0_16px_#00f0ff]"
        >
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#0284c7" strokeWidth="4" fill="#0f172a" />
            <circle cx="50" cy="50" r="38" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <rect x="47" y="6" width="6" height="8" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              </g>
            ))}
            <circle cx="50" cy="50" r="26" fill="#082f49" stroke="#00f0ff" strokeWidth="3" />
            <polygon points="50,30 67,60 33,60" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
            <circle cx="50" cy="50" r="7" fill="#fff" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 9. FLOW STATE: Oscillating Sine Wave Focus ---
export const FlowCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 15 }}
      transition={motionProps.transition}
    >
      <div className="flex items-center gap-1.5 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
        <svg width="80" height="28" viewBox="0 0 120 40" fill="none">
          <motion.path
            d="M 0 20 Q 15 5 30 20 T 60 20 T 90 20 T 120 20"
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: [
                "M 0 20 Q 15 5 30 20 T 60 20 T 90 20 T 120 20",
                "M 0 20 Q 15 35 30 20 T 60 20 T 90 20 T 120 20",
                "M 0 20 Q 15 5 30 20 T 60 20 T 90 20 T 120 20"
              ]
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

// --- 10. GOD MODE CROWN: Regal Floating Drift (Top line removed) ---
export const CrownCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 flex items-center justify-center ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 20 : 10 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 20 : 10 }}
      transition={motionProps.transition}
    >
      <motion.div 
        animate={{ y: [-4, 4, -4], rotate: [-4, 4, -4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center drop-shadow-[0_0_14px_rgba(234,179,8,0.75)]"
      >
        <svg width="44" height="34" viewBox="0 0 100 78" fill="none">
          <polygon
            points="10,65 20,25 38,45 50,15 62,45 80,25 90,65"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="3"
          />
          <rect x="10" y="60" width="80" height="10" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="20" cy="25" r="4.5" fill="#ef4444" stroke="#fff" strokeWidth="1" />
          <circle cx="50" cy="15" r="5.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.2" />
          <circle cx="80" cy="25" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="1" />
          <circle cx="35" cy="65" r="2.2" fill="#fff" />
          <circle cx="50" cy="65" r="2.2" fill="#fff" />
          <circle cx="65" cy="65" r="2.2" fill="#fff" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// --- 11. MONEY COIN: Continuous Rolling RPG Coin ---
export const CoinCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 15 }}
      transition={motionProps.transition}
    >
      <motion.div
        animate={{ y: [-15, 0, -15] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <motion.div
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
          className="w-9 h-9 relative flex items-center justify-center drop-shadow-[0_0_12px_rgba(234,179,8,0.75)]"
        >
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" fill="#eab308" stroke="#ca8a04" strokeWidth="4" />
            <circle cx="50" cy="50" r="36" fill="#facc15" stroke="#eab308" strokeWidth="2" strokeDasharray="6 4" />
            <polygon points="50,26 64,50 50,74 36,50" fill="#ca8a04" />
            <polygon points="50,30 60,50 50,70 40,50" fill="#fef08a" />
            <circle cx="40" cy="38" r="3" fill="#fff" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// --- 12. POWER SPARK: Electric Zap Bolt ---
export const SparkCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 35 : 18 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 35 : 18 }}
      transition={motionProps.transition}
    >
      <motion.div 
        animate={{ scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center drop-shadow-[0_0_14px_rgba(250,204,21,0.85)]"
      >
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
          <polygon
            points="55,10 25,55 50,55 45,90 75,45 50,45"
            fill="#facc15"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polygon
            points="54,16 32,53 50,53 46,82 68,47 50,47"
            fill="#fef08a"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// --- 13. [NEW] UFO / ALIEN SAUCER: Hovering Saucer with Scanning Tractor Beam ---
export const UfoCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 20 : 10 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 20 : 10 }}
      transition={motionProps.transition}
    >
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex flex-col items-center drop-shadow-[0_0_16px_rgba(16,185,129,0.7)]"
      >
        {/* Flying Saucer Craft */}
        <div className="relative">
          <svg width="60" height="32" viewBox="0 0 120 64" fill="none">
            {/* Cockpit Glass Dome */}
            <path d="M 40 32 C 40 12, 80 12, 80 32 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" opacity="0.9" />
            {/* Alien Silhouette */}
            <ellipse cx="60" cy="24" rx="5" ry="6" fill="#10b981" />
            <circle cx="58" cy="23" r="1" fill="#052e16" />
            <circle cx="62" cy="23" r="1" fill="#052e16" />
            {/* Saucer Hull */}
            <ellipse cx="60" cy="36" rx="56" ry="12" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <ellipse cx="60" cy="38" rx="42" ry="7" fill="#0f172a" />
            {/* Spinning Indicator Lights */}
            <circle cx="20" cy="36" r="3" fill="#22c55e" />
            <circle cx="36" cy="40" r="3" fill="#eab308" />
            <circle cx="60" cy="42" r="3.5" fill="#38bdf8" />
            <circle cx="84" cy="40" r="3" fill="#eab308" />
            <circle cx="100" cy="36" r="3" fill="#22c55e" />
          </svg>
        </div>

        {/* Scanning Holographic Tractor Beam */}
        <div className="relative -mt-1 w-16 h-12 flex items-center justify-center overflow-hidden">
          <motion.div
            className="w-full h-full bg-gradient-to-b from-emerald-400/40 via-cyan-400/20 to-transparent"
            style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }}
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- 14. [NEW] SUPERSONIC STEALTH JET: Angular Fighter with Dual Mach Afterburners ---
export const JetCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 6.5);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 25 : 14 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 25 : 14 }}
      transition={motionProps.transition}
    >
      <div 
        className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}
        style={{ transform: isRtl ? 'scaleX(-1) rotate(2deg)' : 'rotate(-2deg)' }}
      >
        {/* Twin Supersonic Afterburners */}
        <div className="absolute -left-10 top-2 flex flex-col gap-1.5 pointer-events-none">
          <motion.div
            className="w-10 h-2 rounded-l-full bg-gradient-to-l from-cyan-400 via-sky-500 to-transparent blur-[1px]"
            animate={{ scaleX: [0.8, 1.5, 0.8], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="w-10 h-2 rounded-l-full bg-gradient-to-l from-cyan-400 via-sky-500 to-transparent blur-[1px]"
            animate={{ scaleX: [0.8, 1.5, 0.8], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.15, repeat: Infinity, delay: 0.07, ease: 'linear' }}
          />
        </div>

        {/* Stealth Fighter Aircraft SVG */}
        <div className="relative drop-shadow-[0_0_14px_rgba(14,165,233,0.7)]">
          <svg width="64" height="28" viewBox="0 0 120 50" fill="none">
            {/* Main Delta Fuselage */}
            <polygon points="115,25 65,12 15,10 25,25 15,40 65,38" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
            {/* Wing details */}
            <polygon points="50,15 15,10 28,25" fill="#0f172a" />
            <polygon points="50,35 15,40 28,25" fill="#0f172a" />
            {/* Cockpit Tinted Canopy */}
            <polygon points="98,25 72,21 60,25 72,29" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" opacity="0.9" />
            <line x1="85" y1="23" x2="68" y2="23" stroke="#fff" strokeWidth="1" opacity="0.7" />
            {/* Twin Vertical Stabilizers */}
            <polygon points="32,15 20,4 28,15" fill="#0284c7" />
            <polygon points="32,35 20,46 28,35" fill="#0284c7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- 15. [NEW] CYBER HOVERBOARDER: Anti-Gravity Skater with Neon Particle Wake ---
export const HoverboardCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7.8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 30 : 16 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 30 : 16 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Anti-Grav Particle Exhaust Wake */}
        <div className="absolute -left-8 bottom-0 flex items-center gap-1 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-fuchsia-400 blur-[1px]"
              animate={{
                x: [-2, -18 - i * 6],
                opacity: [1, 0],
                scale: [1, 0.2]
              }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
            />
          ))}
        </div>

        {/* Hoverboarder Character & Deck */}
        <motion.div
          animate={{ y: [-2, 2, -2], rotate: [-2, 3, -2] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]"
        >
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            {/* Skater Body (Dynamic Surfing Stance) */}
            <circle cx="52" cy="22" r="7" fill="#f43f5e" />
            {/* Visor */}
            <path d="M 54 22 L 60 23" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Torso */}
            <path d="M 50 29 L 58 48 L 44 48 Z" fill="#8b5cf6" />
            {/* Arms for Balance */}
            <path d="M 46 34 L 28 30" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
            <path d="M 54 34 L 72 38" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
            {/* Bent Knees */}
            <path d="M 46 48 L 38 65 L 42 74" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 56 48 L 64 64 L 68 74" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Hoverboard Deck */}
            <rect x="24" y="74" width="60" height="7" rx="3.5" fill="#d946ef" stroke="#fff" strokeWidth="1.5" />
            {/* Repulsor Glow Nodes */}
            <ellipse cx="36" cy="83" rx="8" ry="3" fill="#00f0ff" opacity="0.9" />
            <ellipse cx="72" cy="83" rx="8" ry="3" fill="#00f0ff" opacity="0.9" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 16. [NEW] PHOENIX OF FOCUS: Mythical Fire Bird Gliding with Flapping Wings ---
export const PhoenixCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 8.2);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 25 : 14 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 25 : 14 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Trailing Radiant Ember Sparks */}
        <div className="absolute -left-7 top-3 flex flex-col gap-1 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-[9px] text-amber-400 font-bold select-none"
              animate={{ x: [-2, -18], opacity: [1, 0], scale: [1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18, ease: 'linear' }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        {/* Phoenix Bird SVG */}
        <div className="relative drop-shadow-[0_0_16px_rgba(249,115,22,0.85)]">
          <svg width="58" height="42" viewBox="0 0 100 70" fill="none">
            {/* Streaming Tail Feathers */}
            <path d="M 30 38 Q 15 42 2 54" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 30 38 Q 12 48 5 62" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <path d="M 30 38 Q 18 36 6 44" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

            {/* Bird Torso & Head */}
            <path d="M 30 38 Q 50 32 68 28 Q 78 26 84 22 Q 88 20 86 24 Q 82 28 72 34 Z" fill="#f97316" />
            {/* Crested Crown */}
            <path d="M 80 18 Q 88 12 92 14" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            <path d="M 78 20 Q 84 14 88 16" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="82" cy="22" r="1.5" fill="#fff" />

            {/* Flapping Wings */}
            <motion.path
              d="M 45 32 Q 55 10 70 6 Q 60 22 45 32 Z"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1.5"
              animate={{
                d: [
                  "M 45 32 Q 55 8 72 4 Q 60 22 45 32 Z",
                  "M 45 32 Q 55 38 68 46 Q 58 36 45 32 Z",
                  "M 45 32 Q 55 8 72 4 Q 60 22 45 32 Z"
                ]
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- RENDER CRITTER BY TYPE ---
export const renderCritterComponent = (
  type: CritterType, 
  variant: 'local' | 'global' = 'local',
  direction: 'ltr' | 'rtl' = 'ltr'
) => {
  switch (type) {
    case 'spider':
      return <SpiderCritter key="spider" variant={variant} direction={direction} />;
    case 'dumbbell':
      return <DumbbellCritter key="dumbbell" variant={variant} direction={direction} />;
    case 'car':
      return <CarCritter key="car" variant={variant} direction={direction} />;
    case 'flying_money':
      return <FlyingMoneyCritter key="flying_money" variant={variant} direction={direction} />;
    case 'hacker':
      return <HackerCritter key="hacker" variant={variant} direction={direction} />;
    case 'rocket':
      return <RocketCritter key="rocket" variant={variant} direction={direction} />;
    case 'cricket':
      return <CricketCritter key="cricket" variant={variant} direction={direction} />;
    case 'arc_reactor':
      return <ArcReactorCritter key="arc_reactor" variant={variant} direction={direction} />;
    case 'flow':
      return <FlowCritter key="flow" variant={variant} direction={direction} />;
    case 'coin':
      return <CoinCritter key="coin" variant={variant} direction={direction} />;
    case 'crown':
      return <CrownCritter key="crown" variant={variant} direction={direction} />;
    case 'spark':
      return <SparkCritter key="spark" variant={variant} direction={direction} />;
    case 'ufo':
      return <UfoCritter key="ufo" variant={variant} direction={direction} />;
    case 'jet':
      return <JetCritter key="jet" variant={variant} direction={direction} />;
    case 'hoverboard':
      return <HoverboardCritter key="hoverboard" variant={variant} direction={direction} />;
    case 'phoenix':
      return <PhoenixCritter key="phoenix" variant={variant} direction={direction} />;
    default:
      return null;
  }
};

// --- GLOBAL IDLE WANDERER ---
// Completely disabled when ecoMode or lowGpuMode is enabled!
export const DashboardIdleCrittersOverlay: React.FC = () => {
  const isEco = useShadowTrackerStore((s) => Boolean(s.settings.ecoMode || s.settings.lowGpuMode));
  const [activeCritter, setActiveCritter] = useState<CritterType | null>(null);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [critterKey, setCritterKey] = useState<number>(0);
  const [placementTop, setPlacementTop] = useState<number>(100);

  const lastActiveRef = useRef<number>(Date.now());
  const isRoamingRef = useRef<boolean>(false);
  const lastSpawnTimeRef = useRef<number>(0);

  const triggerRoam = useCallback(() => {
    if (isEco || isRoamingRef.current) return;
    
    // Cooldown: at least 34 seconds between idle wanders
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < 34000) return;

    const randomCritter = ALL_CRITTERS[Math.floor(Math.random() * ALL_CRITTERS.length)];
    const randomDir = Math.random() > 0.5 ? 'ltr' : 'rtl';
    const randomY = Math.floor(Math.random() * 280) + 50;
    
    setPlacementTop(randomY);
    setDirection(randomDir);
    setActiveCritter(randomCritter);
    setCritterKey((k) => k + 1);
    isRoamingRef.current = true;
    lastSpawnTimeRef.current = now;

    setTimeout(() => {
      setActiveCritter(null);
      isRoamingRef.current = false;
    }, 9000);
  }, [isEco]);

  useEffect(() => {
    // Immediate return on eco mode
    if (isEco) {
      setActiveCritter(null);
      return;
    }

    const handleUserActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    // Idle Checker: checks every 3 seconds if user has been inactive for > 12 seconds
    const interval = setInterval(() => {
      const idleTimeSec = (Date.now() - lastActiveRef.current) / 1000;
      if (idleTimeSec >= 12 && !isRoamingRef.current) {
        triggerRoam();
      }
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [isEco, triggerRoam]);

  if (isEco || !activeCritter) return null;

  return (
    <div 
      className="absolute inset-x-0 pointer-events-none z-30 overflow-hidden" 
      style={{ top: `${placementTop}px`, height: '110px' }}
    >
      <AnimatePresence mode="wait">
        <div key={critterKey}>
          {renderCritterComponent(activeCritter, 'global', direction)}
        </div>
      </AnimatePresence>
    </div>
  );
};
