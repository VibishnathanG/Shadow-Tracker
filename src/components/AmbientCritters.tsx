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
  | 'crown';

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
  'spark'
];

// --- 1. SPIDER: Realistic Spiderman-Style Spider with Multi-Directional Stepping Gait ---
export const SpiderCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ 
        x: isRtl ? (isGlobal ? 950 : 320) : (isGlobal ? -80 : -40), 
        y: isGlobal ? 30 : 15, 
        rotate: isRtl ? 180 : 0, 
        opacity: 0 
      }}
      animate={{
        x: isRtl 
          ? (isGlobal ? [950, 780, 620, 440, 260, 80, -80] : [320, 250, 180, 110, 40, -40])
          : (isGlobal ? [-80, 80, 260, 440, 620, 780, 950] : [-40, 40, 110, 180, 250, 320]),
        y: isGlobal ? [30, 22, 38, 24, 36, 22, 30] : [15, 10, 20, 12, 22, 14],
        rotate: isRtl 
          ? [180, 168, 192, 170, 190, 176, 180] 
          : [0, 18, -15, 20, -10, 14, 0],
        opacity: [0, 1, 1, 1, 1, 1, 0]
      }}
      transition={{
        duration: isGlobal ? 9 : 6.5,
        ease: 'easeInOut',
        times: isGlobal ? [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1] : [0, 0.2, 0.4, 0.6, 0.8, 1]
      }}
    >
      <div className="relative">
        {/* Realistic Spider-Man Iconography Spider SVG */}
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
            d="M 45 48 L 28 62 L 22 78 L 15 88"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 45 48 L 28 62 L 22 78 L 15 88", "M 45 48 L 26 56 L 20 72 L 14 82", "M 45 48 L 28 62 L 22 78 L 15 88"] }}
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
            transition={{ duration: 0.32, repeat: Infinity, delay: 0.04, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 54 42 L 76 46 L 86 62 L 93 60"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 54 42 L 76 46 L 86 62 L 93 60", "M 54 42 L 78 40 L 88 56 L 94 52", "M 54 42 L 76 46 L 86 62 L 93 60"] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: 0.16, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 55 48 L 72 62 L 78 78 L 85 88"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            animate={{ d: ["M 55 48 L 72 62 L 78 78 L 85 88", "M 55 48 L 74 56 L 80 72 L 86 82", "M 55 48 L 72 62 L 78 78 L 85 88"] }}
            transition={{ duration: 0.34, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

// --- 2. DUMBBELL: Rolls across the floor with smooth full 360° spin ---
export const DumbbellCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? -80 : -30, opacity: 0 }}
      animate={{
        x: isGlobal ? [-80, 140, 360, 580, 800, 1020] : [-30, 40, 110, 180, 260],
        y: [0, -2, 0, -2, 0, -2],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{
        duration: isGlobal ? 8.5 : 6,
        ease: 'linear'
      }}
    >
      <motion.div
        animate={{ rotate: isGlobal ? 1440 : 720 }}
        transition={{ duration: isGlobal ? 8.5 : 6, ease: 'linear', repeat: Infinity }}
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

// --- 3. CAR: Smooth sports car driving with animated smoke clouds trailing behind ---
export const CarCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? -120 : -60, y: isGlobal ? 35 : 20, opacity: 0 }}
      animate={{
        x: isGlobal ? [-120, 100, 320, 560, 800, 1040] : [-60, 20, 90, 160, 240, 310],
        y: isGlobal ? [35, 34, 36, 34, 35, 34] : [20, 19, 21, 19, 20, 19],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'linear' }}
    >
      <div className="relative flex items-center">
        {/* Trailing Smoke Clouds */}
        <div className="absolute -left-12 bottom-1 flex items-center gap-1.5 pointer-events-none">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-slate-400/60 dark:bg-slate-300/40 blur-[1px]"
              animate={{
                scale: [0.5, 1.8, 2.4],
                x: [-4, -18 - idx * 8],
                y: [-2, -8 - idx * 4],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: idx * 0.28,
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
            <g transform="translate(28, 40)">
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

// --- 4. FLYING MONEY: Banknote with flapping wings soaring smoothly ---
export const FlyingMoneyCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? -80 : -40, y: isGlobal ? 30 : 15, opacity: 0 }}
      animate={{
        x: isGlobal ? [-80, 120, 320, 540, 760, 980] : [-40, 30, 95, 160, 230, 300],
        y: isGlobal ? [30, 12, 40, 15, 38, 16, 28] : [15, 6, 22, 8, 20, 12],
        rotate: [-5, 6, -6, 5, -4, 4, 0],
        opacity: [0, 1, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center justify-center drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">
        {/* Left Flapping Wing */}
        <motion.div
          animate={{ rotate: [-32, 28, -32] }}
          transition={{ duration: 0.38, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-9 origin-right"
        >
          <svg viewBox="0 0 50 60" fill="none" className="w-full h-full text-emerald-200">
            <path
              d="M 50 40 Q 30 15 5 10 Q 15 35 25 45 Q 35 52 50 40 Z"
              fill="#ecfdf5"
              stroke="#10b981"
              strokeWidth="2"
            />
          </svg>
        </motion.div>

        {/* Currency Bill */}
        <div className="w-14 h-8 rounded-md bg-emerald-600 border border-emerald-400 p-1 flex items-center justify-between shadow-md relative z-10">
          <span className="text-[9px] font-black text-emerald-200 leading-none">$</span>
          <div className="w-5 h-5 rounded-full border border-emerald-300 flex items-center justify-center bg-emerald-700/80">
            <span className="text-[8px] font-black text-emerald-100 leading-none">100</span>
          </div>
          <span className="text-[9px] font-black text-emerald-200 leading-none">$</span>
        </div>

        {/* Right Flapping Wing */}
        <motion.div
          animate={{ rotate: [32, -28, 32] }}
          transition={{ duration: 0.38, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-9 origin-left"
        >
          <svg viewBox="0 0 50 60" fill="none" className="w-full h-full text-emerald-200">
            <path
              d="M 0 40 Q 20 15 45 10 Q 35 35 25 45 Q 15 52 0 40 Z"
              fill="#ecfdf5"
              stroke="#10b981"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 5. HACKER: Computer terminal with binary bytes streaming in and out ---
export const HackerCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? -90 : -30, y: isGlobal ? 30 : 15, opacity: 0 }}
      animate={{
        x: isGlobal ? [-90, 80, 260, 480, 700, 920] : [-30, 30, 90, 150, 210, 280],
        y: isGlobal ? [30, 24, 32, 26, 31, 28] : [15, 11, 17, 13, 16, 14],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center gap-2">
        {/* Streaming In Bytes */}
        <div className="flex flex-col gap-1 items-end overflow-hidden w-12">
          {['1010', '0xFF', '0101'].map((byte, idx) => (
            <motion.span
              key={idx}
              className="text-[9px] font-mono font-bold text-emerald-400 leading-none select-none"
              animate={{ x: [-15, 12], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.22, ease: 'linear' }}
            >
              {byte}
            </motion.span>
          ))}
        </div>

        {/* Matrix Hacker Terminal */}
        <div className="w-16 h-12 rounded-xl bg-slate-950 border-2 border-emerald-500/80 p-1.5 flex flex-col justify-between shadow-[0_0_14px_rgba(16,185,129,0.5)] relative">
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
        <div className="flex flex-col gap-1 items-start overflow-hidden w-12">
          {['BYTE', '0x7F', '1100'].map((byte, idx) => (
            <motion.span
              key={idx}
              className="text-[9px] font-mono font-bold text-cyan-400 leading-none select-none"
              animate={{ x: [-8, 20], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.25, ease: 'linear' }}
            >
              {byte}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- 6. ROCKET: Sleek Space Rocket with Exhaust Thruster Fire (Replaces Tick) ---
export const RocketCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? -100 : -40, y: isGlobal ? 60 : 30, rotate: 12, opacity: 0 }}
      animate={{
        x: isGlobal ? [-100, 120, 360, 600, 840, 1060] : [-40, 30, 100, 170, 240, 310],
        y: isGlobal ? [60, 48, 36, 26, 18, 10] : [30, 24, 18, 14, 10, 6],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 7.5 : 5.5, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center">
        {/* Thruster Fire & Exhaust Sparks */}
        <div className="absolute -left-8 top-1.5 flex items-center pointer-events-none">
          <motion.div
            className="w-8 h-3.5 rounded-l-full bg-gradient-to-l from-amber-400 via-orange-500 to-transparent blur-[1px]"
            animate={{ scaleX: [0.7, 1.4, 0.8], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Space Rocket SVG */}
        <div className="relative drop-shadow-[0_0_14px_rgba(249,115,22,0.6)]">
          <svg width="54" height="28" viewBox="0 0 100 50" fill="none">
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
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: isGlobal ? 40 : 20, y: isGlobal ? 25 : 12, opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 1, 1, 0] }}
      transition={{ duration: isGlobal ? 7.5 : 5.5, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center">
        {/* Batsman with Bat Swing */}
        <div className="relative flex items-center">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            {/* Batsman Silhouette Body */}
            <circle cx="36" cy="24" r="8" fill="#3b82f6" />
            {/* Helmet Grill */}
            <path d="M 38 24 L 44 26" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            {/* Torso */}
            <path d="M 34 32 L 40 56 L 30 58 Z" fill="#2563eb" />
            {/* Legs with Pads */}
            <rect x="26" y="58" width="6" height="26" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="34" y="58" width="6" height="26" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            {/* Swinging Cricket Bat */}
            <motion.g
              animate={{ rotate: [-20, 65, -20] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
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
            x: isGlobal ? [0, 80, 200, 360, 520, 720] : [0, 40, 90, 150, 200],
            y: isGlobal ? [0, -38, -58, -42, -15, 20] : [0, -24, -36, -24, -5],
            opacity: [1, 1, 1, 1, 1, 0]
          }}
          transition={{ duration: isGlobal ? 3.6 : 2.8, repeat: Infinity, ease: 'easeOut', repeatDelay: 1 }}
        >
          <div className="relative flex items-center justify-center">
            {/* Red Leather Ball with Seam */}
            <motion.div
              animate={{ rotate: 720 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 rounded-full bg-red-600 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex items-center justify-center"
            >
              <line x1="2" y1="8" x2="14" y2="8" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
            </motion.div>
            {/* Impact Star */}
            <span className="absolute -top-3 -right-2 text-[10px] font-black text-amber-400 select-none">✦</span>
          </div>
        </motion.div>

        {/* "SIX!" Badge Chip */}
        <motion.div
          animate={{ scale: [0.8, 1.15, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="ml-3 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-black text-[9px] tracking-wider uppercase shadow-xs select-none"
        >
          SIX! 🏏 6️⃣
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 8. IRON MAN ARC REACTOR: Palladium / Nanotech Core with Pulsing Energy ---
export const ArcReactorCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 flex items-center justify-center ${className}`}
      initial={{ x: isGlobal ? 80 : 35, y: isGlobal ? 25 : 12, opacity: 0 }}
      animate={{
        x: isGlobal ? [80, 180, 320, 480, 640, 800] : [35, 75, 120, 170, 220, 260],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center justify-center">
        {/* Radiating Electromagnetic Energy Pulse */}
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.75, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-12 h-12 rounded-full border border-cyan-400 bg-cyan-400/15"
        />

        {/* Arc Reactor Core SVG */}
        <motion.div
          animate={{ scale: [0.96, 1.05, 0.96] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative drop-shadow-[0_0_16px_#00f0ff]"
        >
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
            {/* Outer Metallic Ring */}
            <circle cx="50" cy="50" r="46" stroke="#0284c7" strokeWidth="4" fill="#0f172a" />
            <circle cx="50" cy="50" r="38" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
            {/* 10 Copper Coil Segments around Rim */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <rect x="47" y="6" width="6" height="8" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              </g>
            ))}
            {/* Palladium Luminous Core Ring */}
            <circle cx="50" cy="50" r="26" fill="#082f49" stroke="#00f0ff" strokeWidth="3" />
            {/* Central Triangular Core */}
            <polygon points="50,30 67,60 33,60" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" opacity="0.9" />
            <circle cx="50" cy="50" r="7" fill="#fff" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 9. FLOW STATE: Beautiful Multi-Color Neon Wave with Surfing Core ---
export const FlowCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 flex items-center overflow-visible ${className}`}
      initial={{ x: isGlobal ? -120 : -60, opacity: 0 }}
      animate={{
        x: isGlobal ? [-120, 80, 280, 500, 720, 980] : [-60, 20, 90, 160, 230],
        opacity: [0, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'easeInOut' }}
    >
      <div className="relative w-72 h-20">
        <svg width="280" height="70" viewBox="0 0 280 70" fill="none" className="overflow-visible">
          <defs>
            <linearGradient id="flowWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Harmonic Multi-Frequency Aurora Waves */}
          <motion.path
            d="M 0 35 Q 35 10 70 35 T 140 35 T 210 35 T 280 35"
            stroke="url(#flowWaveGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: [
                "M 0 35 Q 35 10 70 35 T 140 35 T 210 35 T 280 35",
                "M 0 35 Q 35 60 70 35 T 140 35 T 210 35 T 280 35",
                "M 0 35 Q 35 10 70 35 T 140 35 T 210 35 T 280 35"
              ]
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: "drop-shadow(0 0 10px #06b6d4)" }}
          />

          <motion.path
            d="M 0 35 Q 35 50 70 35 T 140 35 T 210 35 T 280 35"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeDasharray="5 7"
            opacity="0.8"
            fill="none"
            animate={{
              d: [
                "M 0 35 Q 35 50 70 35 T 140 35 T 210 35 T 280 35",
                "M 0 35 Q 35 20 70 35 T 140 35 T 210 35 T 280 35",
                "M 0 35 Q 35 50 70 35 T 140 35 T 210 35 T 280 35"
              ]
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>

        {/* Surfing Zen Core */}
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-300 border-2 border-white shadow-[0_0_16px_#06b6d4] flex items-center justify-center"
          animate={{
            x: [0, 70, 140, 210, 280],
            y: [26, 12, 30, 14, 26]
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- 10. GOD MODE CROWN: Regal floating drift (Top line removed as requested) ---
export const CrownCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 flex items-center justify-center ${className}`}
      initial={{ x: isGlobal ? -50 : -20, y: isGlobal ? 20 : 10, opacity: 0 }}
      animate={{
        x: isGlobal ? [-50, 100, 260, 440, 640, 850, 1050] : [-20, 40, 100, 160, 220, 280],
        y: isGlobal ? [20, 8, 28, 12, 26, 10, 18] : [10, 2, 16, 4, 14, 8],
        rotate: [-5, 6, -6, 5, -4, 4, 0],
        opacity: [0, 1, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 9 : 6.5, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center justify-center drop-shadow-[0_0_14px_rgba(234,179,8,0.7)]">
        {/* Crown Body with Jewels (Top Line Removed) */}
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
      </div>
    </motion.div>
  );
};

// --- 11. MONEY COIN: RPG Coin Hop ---
export const CoinCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ y: 0, opacity: 0, x: isGlobal ? -40 : -20 }}
      animate={{
        y: isGlobal ? [0, -50, 0, -40, 0, -25, 0, -45, 0] : [0, -40, 0, -30, 0, -18, 0],
        x: isGlobal ? [-40, 80, 200, 340, 480, 620, 750, 880, 1000] : [-20, 40, 100, 160, 220, 270, 320],
        opacity: [0, 1, 1, 1, 1, 1, 1, 1, 0]
      }}
      transition={{ duration: isGlobal ? 8.5 : 6, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{ rotateY: [0, 180, 360] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
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
  );
};

// --- 12. POWER SPARK: Electric Zap Bolt ---
export const SparkCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ scale: 0.3, opacity: 0, x: isGlobal ? 100 : 40, y: isGlobal ? 80 : 30 }}
      animate={{
        scale: [0.3, 1.25, 0.9, 1.4, 1.05, 0],
        opacity: [0, 1, 0.7, 1, 0.8, 0],
        x: isGlobal ? [100, 130, 220, 260, 380, 420] : [40, 60, 90, 120, 150, 180],
        y: isGlobal ? [80, 60, 95, 70, 85, 65] : [30, 20, 40, 25, 35, 20]
      }}
      transition={{ duration: isGlobal ? 6 : 4.5, ease: 'easeInOut' }}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-10 h-10 rounded-full border border-cyan-400 bg-cyan-400/20"
        />
        <svg width="38" height="38" viewBox="0 0 100 100" fill="none" className="text-cyan-400 drop-shadow-[0_0_14px_#22d3ee]">
          <path
            d="M 52 8 L 26 52 L 48 52 L 38 92 L 74 44 L 54 44 Z"
            fill="currentColor"
            stroke="#fff"
            strokeWidth="2.5"
          />
        </svg>
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
      return <DumbbellCritter key="dumbbell" variant={variant} />;
    case 'car':
      return <CarCritter key="car" variant={variant} />;
    case 'flying_money':
      return <FlyingMoneyCritter key="flying_money" variant={variant} />;
    case 'hacker':
      return <HackerCritter key="hacker" variant={variant} />;
    case 'rocket':
      return <RocketCritter key="rocket" variant={variant} />;
    case 'cricket':
      return <CricketCritter key="cricket" variant={variant} />;
    case 'arc_reactor':
      return <ArcReactorCritter key="arc_reactor" variant={variant} />;
    case 'flow':
      return <FlowCritter key="flow" variant={variant} />;
    case 'coin':
      return <CoinCritter key="coin" variant={variant} />;
    case 'crown':
      return <CrownCritter key="crown" variant={variant} />;
    case 'spark':
      return <SparkCritter key="spark" variant={variant} />;
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
