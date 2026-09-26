'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';
import { isWindowActive, subscribeWindowState } from '@/lib/windowState';

export type CritterType = 
  | 'spider' 
  | 'dumbbell' 
  | 'car' 
  | 'flying_money' 
  | 'hacker' 
  | 'flow' 
  | 'rocket' 
  | 'arc_reactor' 
  | 'coin' 
  | 'spark' 
  | 'crown'
  | 'ufo'
  | 'hoverboard'
  | 'phoenix'
  | 'maglev'
  | 'ninja'
  | 'dragon';

export const ALL_CRITTERS: CritterType[] = [
  'spider', 
  'dumbbell', 
  'car', 
  'flying_money', 
  'hacker', 
  'rocket', 
  'arc_reactor', 
  'flow', 
  'coin', 
  'crown', 
  'spark',
  'ufo',
  'hoverboard',
  'phoenix',
  'maglev',
  'ninja',
  'dragon'
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

// --- 4. FLYING MONEY: Majestic Dual-Wing Flapping Currency & Gold Orbiters ---
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
      <motion.div 
        className="relative flex items-center"
        animate={{ y: [-7, 7, -7], rotate: isRtl ? [3, -3, 3] : [-3, 3, -3] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Trailing Gold Stardust & Coin Dust */}
        <div className={`absolute ${isRtl ? '-right-6' : '-left-8'} top-1 flex items-center gap-1.5 pointer-events-none`}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-[9px] font-black text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] select-none"
              animate={{ 
                x: isRtl ? [2, 16 + i * 6] : [-2, -16 - i * 6], 
                y: [0, (i % 2 === 0 ? -6 : 6)],
                opacity: [1, 0],
                scale: [1, 0.3]
              }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18, ease: 'easeOut' }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        {/* Banknote with Dual Flapping Feathered Wings */}
        <div className="relative drop-shadow-[0_0_16px_rgba(16,185,129,0.65)]">
          <svg width="68" height="42" viewBox="0 0 120 70" fill="none">
            {/* Left Flapping Wing (Back Wing) */}
            <motion.g
              animate={{ 
                rotate: [-28, 24, -28], 
                scaleY: [0.85, 1.15, 0.85],
                transformOrigin: '32px 30px'
              }}
              transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 32 30 C 20 10, 2 -2, 0 10 C -1 18, 12 28, 30 32 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                opacity="0.9"
              />
              <path d="M 12 12 Q 22 22 28 28" stroke="#94a3b8" strokeWidth="0.8" opacity="0.7" />
              <path d="M 6 18 Q 18 24 26 30" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
            </motion.g>

            {/* Right Flapping Wing (Front Wing) */}
            <motion.g
              animate={{ 
                rotate: [28, -24, 28], 
                scaleY: [0.85, 1.15, 0.85],
                transformOrigin: '88px 30px'
              }}
              transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 88 30 C 100 10, 118 -2, 120 10 C 121 18, 108 28, 90 32 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                opacity="0.9"
              />
              <path d="M 108 12 Q 98 22 92 28" stroke="#94a3b8" strokeWidth="0.8" opacity="0.7" />
              <path d="M 114 18 Q 102 24 94 30" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
            </motion.g>

            {/* Main Banknote Body */}
            <rect x="24" y="24" width="72" height="38" rx="4" fill="#059669" stroke="#047857" strokeWidth="1.5" />
            <rect x="27" y="27" width="66" height="32" rx="3" fill="#10b981" stroke="#34d399" strokeWidth="0.8" strokeDasharray="3 2" />
            
            {/* Guilloche Corner Accents */}
            <circle cx="31" cy="31" r="2.5" fill="#fef08a" opacity="0.9" />
            <circle cx="89" cy="31" r="2.5" fill="#fef08a" opacity="0.9" />
            <circle cx="31" cy="55" r="2.5" fill="#fef08a" opacity="0.9" />
            <circle cx="89" cy="55" r="2.5" fill="#fef08a" opacity="0.9" />

            {/* Central Cameo Medallion */}
            <circle cx="60" cy="43" r="12" fill="#047857" stroke="#fef08a" strokeWidth="1.2" />
            <circle cx="60" cy="43" r="9.5" fill="#065f46" />
            <text 
              x="60" 
              y="49.5" 
              fontSize="16" 
              fontWeight="900" 
              fill="#fef08a" 
              textAnchor="middle" 
              fontFamily="sans-serif"
            >
              $
            </text>
          </svg>
        </div>

        {/* Orbiting Little Gold Coin */}
        <motion.div
          className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-amber-400 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.9)] flex items-center justify-center pointer-events-none"
          animate={{ y: [-4, 4, -4], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[8px] font-black text-amber-950">$</span>
        </motion.div>
      </motion.div>
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

// --- 6. ROCKET: Aerodynamically Aligned Space Rocket with Exhaust Fire (FIXED PROPER DIRECTION) ---
export const RocketCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local' }) => {
  const isGlobal = variant === 'global';
  // Rocket ALWAYS launches forward in the proper direction (Left-to-Right) climbing into the sky!
  const startX = isGlobal ? -120 : -60;
  const endX = isGlobal ? 1100 : 360;

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ x: startX, y: isGlobal ? 70 : 34, opacity: 0 }}
      animate={{ 
        x: endX, 
        y: isGlobal ? 15 : 8,
        opacity: [0, 1, 1, 1, 0] 
      }}
      transition={{ 
        duration: isGlobal ? 6.8 : 4.8, 
        ease: 'linear',
        times: [0, 0.08, 0.85, 0.96, 1]
      }}
    >
      {/* Aerodynamic forward climb angle: tilted -12° with nose pointing forward-up (+X) */}
      <div 
        className="relative flex items-center"
        style={{ transform: 'rotate(-12deg)' }}
      >
        {/* Thruster Fire & Trailing Exhaust Particles (Trailing backwards to the left) */}
        <div className="absolute -left-9 top-2 flex items-center pointer-events-none">
          <motion.div
            className="w-10 h-4 rounded-l-full bg-gradient-to-l from-amber-400 via-orange-500 to-transparent blur-[1px]"
            animate={{ scaleX: [0.8, 1.4, 0.8], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.16, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="text-[9px] text-amber-300 font-black absolute -left-2 top-0 select-none"
            animate={{ x: [-2, -12], opacity: [1, 0], scale: [1, 0.4] }}
            transition={{ duration: 0.22, repeat: Infinity, ease: 'linear' }}
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
            {/* Cockpit Porthole (Obsidian & Silver Glint) */}
            <circle cx="58" cy="25" r="4.5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="56.5" cy="23.5" r="1.5" fill="#ffffff" opacity="0.9" />
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

// --- 7. MAGLEV BULLET TRAIN: Hyper-Speed Aerodynamic Shinkansen with Neon Levitation Beam ---
export const MaglevCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 6.8);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 32 : 18 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 32 : 18 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Under-chassis Levitation Magnetic Beam & Speed Stream */}
        <div className="absolute -left-12 bottom-0 flex items-center pointer-events-none">
          <motion.div
            className="w-16 h-1 rounded-l-full bg-gradient-to-l from-cyan-400 via-teal-300 to-transparent blur-[1px]"
            animate={{ opacity: [0.6, 1, 0.6], scaleX: [0.9, 1.3, 0.9] }}
            transition={{ duration: 0.2, repeat: Infinity, ease: 'linear' }}
          />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-[8px] font-black text-cyan-300 absolute -left-2 select-none"
              animate={{ x: [-2, -18 - i * 8], opacity: [0.9, 0], scale: [1, 0.3] }}
              transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.1, ease: 'linear' }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        {/* Shinkansen Bullet Train Body */}
        <div className="relative drop-shadow-[0_0_12px_rgba(20,184,166,0.6)]">
          <svg width="84" height="26" viewBox="0 0 140 44" fill="none">
            {/* Guide Rail Track Line */}
            <line x1="0" y1="42" x2="140" y2="42" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.4" />
            
            {/* Sleek Aerodynamic Nose Fuselage */}
            <path
              d="M 6 36 L 40 16 L 115 16 C 130 16, 138 24, 138 34 L 138 36 L 6 36 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            {/* Lower Chassis Skirt */}
            <path d="M 6 36 L 138 36 L 134 40 L 12 40 Z" fill="#0f172a" />
            
            {/* Racing Speed Stripe */}
            <path d="M 28 26 L 138 26 L 138 29 L 24 29 Z" fill="#0d9488" />
            
            {/* Aerodynamic Cockpit Windshield */}
            <path d="M 112 19 L 130 25 C 133 27, 130 29, 124 29 L 106 29 Z" fill="#1e293b" stroke="#0d9488" strokeWidth="0.8" />
            <line x1="110" y1="21" x2="124" y2="26" stroke="#fff" strokeWidth="0.8" opacity="0.8" />

            {/* Passenger Cabin Illuminated Windows */}
            <rect x="42" y="19" width="10" height="5" rx="1.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" opacity="0.9" />
            <rect x="58" y="19" width="10" height="5" rx="1.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" opacity="0.9" />
            <rect x="74" y="19" width="10" height="5" rx="1.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" opacity="0.9" />
            <rect x="90" y="19" width="10" height="5" rx="1.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" opacity="0.9" />

            {/* Front Headlight Beam */}
            <circle cx="136" cy="31" r="2.5" fill="#fef08a" />
            <polygon points="137,30 148,27 148,35 137,32" fill="#fef08a" opacity="0.35" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// --- 8. CYBER SHINOBI: Minimalist Shadow Ninja Dashing with Flowing Scarf ---
export const NinjaCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7.2);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 28 : 16 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 28 : 16 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Shadow Clone After-Images (Motion Blur Dash Trail) */}
        <div className="absolute -left-7 top-1 pointer-events-none opacity-30">
          <svg width="40" height="38" viewBox="0 0 100 95" fill="none">
            <circle cx="56" cy="24" r="8" fill="#475569" />
            <path d="M 52 32 L 64 52 L 44 54 Z" fill="#334155" />
            <line x1="44" y1="54" x2="32" y2="76" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="64" y1="52" x2="76" y2="74" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Main Sprinting Cyber Ninja Silhouette */}
        <motion.div 
          className="relative drop-shadow-[0_0_12px_rgba(239,68,68,0.65)]"
          animate={{ y: [-3, 2, -3] }}
          transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="46" height="42" viewBox="0 0 100 95" fill="none">
            {/* Flowing Crimson Ribbon/Scarf Waving in the Wind */}
            <motion.path
              d="M 50 30 Q 30 18 10 24 Q 24 32 46 34 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="1"
              animate={{
                d: [
                  "M 50 30 Q 30 18 10 24 Q 24 32 46 34 Z",
                  "M 50 30 Q 28 36 6 28 Q 22 22 46 34 Z",
                  "M 50 30 Q 30 18 10 24 Q 24 32 46 34 Z"
                ]
              }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Katana Blade on Back with Silver Glint */}
            <line x1="28" y1="54" x2="68" y2="18" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="26" y1="56" x2="34" y2="48" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <circle cx="68" cy="18" r="1.5" fill="#fff" />

            {/* Head & Mask */}
            <circle cx="56" cy="24" r="8" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
            {/* Glowing Eye Visor Slit */}
            <line x1="58" y1="24" x2="63" y2="24" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />

            {/* Torso (Athletic Low Forward Lean) */}
            <path d="M 52 32 L 66 52 L 44 54 Z" fill="#0f172a" />
            <path d="M 54 34 L 62 48" stroke="#334155" strokeWidth="2" />

            {/* Forward Reaching Arm */}
            <line x1="58" y1="36" x2="74" y2="42" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            {/* Rear Arm */}
            <line x1="50" y1="38" x2="36" y2="46" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

            {/* Dynamic Running Stride Legs */}
            <line x1="44" y1="54" x2="28" y2="72" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="28" y1="72" x2="20" y2="78" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <line x1="66" y1="52" x2="80" y2="68" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="80" y1="68" x2="88" y2="72" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          </svg>
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

// --- 11. MONEY COIN: 3D Gleaming Gold Coin with Cascading Stardust ---
export const CoinCritter: React.FC<{
  className?: string;
  variant?: 'local' | 'global';
  direction?: 'ltr' | 'rtl';
}> = ({ className = '', variant = 'local', direction = 'ltr' }) => {
  const isGlobal = variant === 'global';
  const isRtl = direction === 'rtl';
  const motionProps = getLinearMotion(isGlobal, isRtl, 7.6);

  return (
    <motion.div
      className={`absolute pointer-events-none select-none z-30 ${className}`}
      initial={{ ...motionProps.initial, y: isGlobal ? 28 : 15 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 28 : 15 }}
      transition={motionProps.transition}
    >
      <motion.div
        animate={{ y: [-8, 4, -8] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
      >
        {/* Shimmering Golden Dust Trail */}
        <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} flex items-center gap-1 pointer-events-none`}>
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="text-[9px] font-black text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] select-none"
              animate={{ 
                x: isRtl ? [0, 14 + i * 6] : [0, -14 - i * 6], 
                y: [0, (i === 0 ? -4 : 4)],
                opacity: [1, 0],
                scale: [1, 0.2]
              }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.2, ease: 'easeOut' }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        {/* 3D Spinning Gold Medallion */}
        <motion.div
          animate={{ scaleX: [1, 0.18, 1, 0.18, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 relative flex items-center justify-center drop-shadow-[0_0_14px_rgba(234,179,8,0.8)]"
        >
          <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" fill="#eab308" stroke="#ca8a04" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="#facc15" stroke="#eab308" strokeWidth="2" strokeDasharray="5 3" />
            {/* Center Crown / Star Crest */}
            <polygon points="50,24 64,50 50,76 36,50" fill="#ca8a04" />
            <polygon points="50,28 60,50 50,72 40,50" fill="#fef08a" />
            <circle cx="50" cy="50" r="5" fill="#f59e0b" />
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

// --- 14. CELESTIAL DRAGON: Serpentine Lung Dragon Undulating Through Starlight ---
export const DragonCritter: React.FC<{
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
      initial={{ ...motionProps.initial, y: isGlobal ? 25 : 14 }}
      animate={{ ...motionProps.animate, y: isGlobal ? 25 : 14 }}
      transition={motionProps.transition}
    >
      <div className={`relative flex items-center ${isRtl ? 'scale-x-[-1]' : ''}`}>
        {/* Starlight Dragon Pearls & Floating Golden Embers */}
        <div className="absolute -left-8 top-1 flex items-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-[9px] font-black text-amber-300 absolute -left-2 select-none"
              animate={{ 
                x: [-2, -22 - i * 8], 
                y: [0, (i % 2 === 0 ? -8 : 8)],
                opacity: [1, 0],
                scale: [1, 0.2]
              }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.22, ease: 'easeOut' }}
            >
              ✧
            </motion.span>
          ))}
        </div>

        {/* Serpentine Dragon Body SVG */}
        <motion.div
          animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative drop-shadow-[0_0_14px_rgba(245,158,11,0.65)]"
        >
          <svg width="78" height="34" viewBox="0 0 140 60" fill="none">
            {/* Undulating Serpentine Dragon Spine */}
            <motion.path
              d="M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="9"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28",
                  "M 12 30 Q 30 46 50 32 Q 70 16 90 36 Q 105 44 120 28",
                  "M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28"
                ]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Golden Core Belly Scale Strip */}
            <motion.path
              d="M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28"
              fill="none"
              stroke="#fef08a"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28",
                  "M 12 30 Q 30 46 50 32 Q 70 16 90 36 Q 105 44 120 28",
                  "M 12 36 Q 30 18 50 34 Q 70 50 90 32 Q 105 20 120 28"
                ]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Dragon Head */}
            <g transform="translate(112, 20)">
              {/* Snout & Jaws */}
              <polygon points="6,4 20,8 18,16 4,14" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
              {/* Golden Antlers */}
              <path d="M 8 4 L 14 -6 L 18 -4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <path d="M 12 -2 L 10 -8" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              {/* Crimson Eye */}
              <circle cx="12" cy="8" r="2.2" fill="#ef4444" />
              <circle cx="12" cy="7.5" r="0.8" fill="#fff" />
              {/* Flowing Whiskers */}
              <path d="M 18 12 Q 26 14 28 8" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M 18 14 Q 24 20 26 18" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" fill="none" />
              {/* Celestial Dragon Pearl in Front of Jaws */}
              <circle cx="26" cy="12" r="3.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
            </g>
          </svg>
        </motion.div>
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
    case 'maglev':
      return <MaglevCritter key="maglev" variant={variant} direction={direction} />;
    case 'ninja':
      return <NinjaCritter key="ninja" variant={variant} direction={direction} />;
    case 'dragon':
      return <DragonCritter key="dragon" variant={variant} direction={direction} />;
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
    case 'hoverboard':
      return <HoverboardCritter key="hoverboard" variant={variant} direction={direction} />;
    case 'phoenix':
      return <PhoenixCritter key="phoenix" variant={variant} direction={direction} />;
    default:
      return null;
  }
};

// --- GLOBAL IDLE WANDERER ---
// Completely disabled to ensure 0% CPU consumption during idle
export const DashboardIdleCrittersOverlay: React.FC = () => null;
