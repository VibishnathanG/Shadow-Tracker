'use client';
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';
import { Lucide } from './icons';

const defaultMotivationalData = [
  {
    vibe: "power",
    quote: "A lion does not flinch at the laughter of hyenas. Stay fiercely focused on building your empire."
  },
  {
    vibe: "power",
    quote: "Intensity and unyielding focus are the true currencies of success. Spend them wisely."
  },
  {
    vibe: "wisdom",
    quote: "To reach new heights and see the bigger picture, you must be willing to fly alone."
  },
  {
    vibe: "power",
    quote: "The pain and discipline you endure today become the unbreakable strength you wield tomorrow. Keep pushing."
  },
  {
    vibe: "wealth",
    quote: "Money is merely a tool. True wisdom is knowing how to deploy it to forge your future."
  },
  {
    vibe: "tech",
    quote: "Code the future you desire to live in. Relentless hard work behind the screens pays exponential dividends."
  },
  {
    vibe: "wisdom",
    quote: "True wisdom is not just a product of schooling, but the lifelong, relentless pursuit of understanding."
  },
  {
    vibe: "power",
    quote: "Take exceptional care of your body. It is the only vehicle you have to carry you to greatness."
  },
  {
    vibe: "power",
    quote: "Throw me to the wolves, and I will return leading the pack. Resilience is born in adversity."
  },
  {
    vibe: "wealth",
    quote: "Do not save what is left after spending; spend only what is left after strategic saving and investing."
  },
  {
    vibe: "power",
    quote: "Your ambitions should intimidate you. If they don't, you are thinking far too small."
  },
  {
    vibe: "tech",
    quote: "Even the most advanced neural networks require moments of recalibration. Rest deeply, then execute flawlessly."
  },
  {
    vibe: "power",
    quote: "Discipline is doing what you absolutely hate to do, but executing it as if you love it."
  },
  {
    vibe: "power",
    quote: "Precision beats power. Timing beats speed. Wait patiently for your optimal moment, then strike with absolute certainty."
  },
  {
    vibe: "health",
    quote: "Fuel your biological machine with excellence. Exceptional health is the foundation of ultimate wealth."
  },
  {
    vibe: "tech",
    quote: "The currency of the new era is relentless innovation and unshakeable trust. Build both simultaneously."
  },
  {
    vibe: "wealth",
    quote: "True financial power is possessing the patience to let your investments compound while you sleep."
  },
  {
    vibe: "power",
    quote: "It does not matter how slowly you progress, as long as you categorically refuse to stop."
  },
  {
    vibe: "tech",
    quote: "Data is the raw material of the modern age, but actionable wisdom is the engine that converts it into power."
  },
  {
    vibe: "power",
    quote: "Do not pray for an easy, comfortable life. Pray for the strength to endure and conquer a difficult one."
  },
  {
    vibe: "power",
    quote: "The hardest climb yields the most breathtaking view. Never surrender to the altitude of your goals."
  },
  {
    vibe: "wisdom",
    quote: "Master your mind, and you master your reality. True strength is forged in the fires of silent discipline."
  }
];

const defaultSlides = defaultMotivationalData.map((data, idx) => ({
  id: `default-${idx}`,
  vibe: data.vibe,
  quote: data.quote
}));

/* ── Colorful inline SVG wizard miniature ── */
const WizardMiniature: React.FC<{ theme: string }> = ({ theme }) => {
  const themeColors: Record<string, { hat: string; hatDark: string; robe: string; robeDark: string; staff: string; orb: string; skin: string; belt: string; orbGlow: string; beard: string }> = {
    obsidian:  { hat: '#6b7db0', hatDark: '#4a5a80', robe: '#4e6090', robeDark: '#3a4a6e', staff: '#c4a265', orb: '#7dd3fc', skin: '#e0b088', belt: '#b8860b', orbGlow: 'rgba(125,211,252,0.6)', beard: '#c8c0a8' },
    cyberpunk: { hat: '#d946ef', hatDark: '#a21caf', robe: '#8b5cf6', robeDark: '#6d28d9', staff: '#fbbf24', orb: '#22d3ee', skin: '#e0b088', belt: '#f59e0b', orbGlow: 'rgba(34,211,238,0.7)', beard: '#e8e0c0' },
    midnight:  { hat: '#10b981', hatDark: '#059669', robe: '#047857', robeDark: '#064e3b', staff: '#a7f3d0', orb: '#34d399', skin: '#e0b088', belt: '#6ee7b7', orbGlow: 'rgba(52,211,153,0.6)', beard: '#d0c8b8' },
    onedark:   { hat: '#dc2626', hatDark: '#991b1b', robe: '#b91c1c', robeDark: '#7f1d1d', staff: '#fb923c', orb: '#f87171', skin: '#e0b088', belt: '#ea580c', orbGlow: 'rgba(248,113,113,0.6)', beard: '#d8c8a8' },
    light:     { hat: '#2563eb', hatDark: '#1d4ed8', robe: '#1e40af', robeDark: '#1e3a5f', staff: '#d4a020', orb: '#fbbf24', skin: '#e0b088', belt: '#b45309', orbGlow: 'rgba(251,191,36,0.6)', beard: '#c0b898' },
  };
  const c = themeColors[theme] || themeColors.obsidian;

  return (
    <svg viewBox="0 0 120 160" width="72" height="96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Staff */}
      <line x1="93" y1="22" x2="84" y2="142" stroke={c.staff} strokeWidth="3.5" strokeLinecap="round" />
      {/* Orb glow */}
      <circle cx="93" cy="18" r="11" fill={c.orbGlow} opacity="0.45">
        <animate attributeName="r" values="9;13;9" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.55;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Orb */}
      <circle cx="93" cy="18" r="6" fill={c.orb} />
      <circle cx="91" cy="16" r="2" fill="white" opacity="0.6" />

      {/* Robe body */}
      <path d="M30 88 Q32 72 46 68 L56 66 Q60 65 64 66 L74 68 Q88 72 90 88 L96 142 Q60 156 24 142 Z" fill={c.robe} />
      {/* Robe dark fold */}
      <path d="M56 66 Q59 92 52 142 L64 146 Q63 92 64 66 Z" fill={c.robeDark} opacity="0.5" />
      {/* Robe highlight */}
      <path d="M38 82 Q42 105 36 138" stroke="white" strokeWidth="0.7" opacity="0.2" fill="none" />

      {/* Belt */}
      <rect x="33" y="92" width="54" height="5" rx="2" fill={c.belt} />
      <circle cx="60" cy="94.5" r="2.5" fill={c.orb} opacity="0.9" />

      {/* Left sleeve */}
      <path d="M32 75 Q17 84 22 102 L30 98 Q27 86 38 79 Z" fill={c.robe} />
      {/* Right sleeve */}
      <path d="M88 75 Q99 82 96 98 L88 96 Q92 84 84 77 Z" fill={c.robe} />
      {/* Hands */}
      <circle cx="23" cy="102" r="4.5" fill={c.skin} />
      <circle cx="95" cy="98" r="4.5" fill={c.skin} />

      {/* Neck */}
      <rect x="54" y="57" width="12" height="11" rx="4" fill={c.skin} />

      {/* Head */}
      <ellipse cx="60" cy="50" rx="15" ry="17" fill={c.skin} />

      {/* Beard */}
      <path d="M48 56 Q55 78 60 80 Q65 78 72 56 Q66 64 60 66 Q54 64 48 56 Z" fill={c.beard} />
      <path d="M50 57 Q57 73 60 75 Q63 73 70 57 Q65 62 60 63 Q55 62 50 57 Z" fill={c.beard} opacity="0.7" />

      {/* Eyes */}
      <ellipse cx="54" cy="47" rx="2.2" ry="2.8" fill="white" />
      <ellipse cx="66" cy="47" rx="2.2" ry="2.8" fill="white" />
      <circle cx="54" cy="47.3" r="1.4" fill="#2d1b00" />
      <circle cx="66" cy="47.3" r="1.4" fill="#2d1b00" />
      <circle cx="54.5" cy="46.5" r="0.5" fill="white" opacity="0.8" />
      <circle cx="66.5" cy="46.5" r="0.5" fill="white" opacity="0.8" />

      {/* Eyebrows */}
      <path d="M50 43 Q54 40 58 43" stroke="#5a4020" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M62 43 Q66 40 70 43" stroke="#5a4020" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M59 51 Q60 53.5 61 51" stroke="#c09060" strokeWidth="0.8" fill="none" />

      {/* Hat */}
      <path d="M36 44 L60 4 L84 44 Q74 38 60 37 Q46 38 36 44 Z" fill={c.hat} />
      {/* Hat darker side */}
      <path d="M60 4 L84 44 Q74 38 60 37 Z" fill={c.hatDark} opacity="0.6" />
      {/* Hat brim */}
      <ellipse cx="60" cy="44" rx="28" ry="7" fill={c.hat} />
      {/* Hat band */}
      <path d="M34 42 Q60 50 86 42 Q60 48 34 42 Z" fill={c.belt} />
      {/* Hat star */}
      <path d="M63 19 L64 23 L68 23 L65 25.5 L66 29 L63 27 L60 29 L61 25.5 L58 23 L62 23 Z" fill={c.orb} opacity="0.85">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </path>

      {/* Shoes */}
      <ellipse cx="43" cy="149" rx="9" ry="4.5" fill="#5a3d20" />
      <ellipse cx="73" cy="149" rx="9" ry="4.5" fill="#5a3d20" />
    </svg>
  );
};

const DynamicBackground: React.FC<{ vibe: string }> = ({ vibe }) => {
  const wisdomNodes = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    size: Math.random() * 100 + 20,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 3 + 3
  })), []);

  const wealthBars = useMemo(() => [...Array(10)].map((_, i) => ({
    id: i,
    left: `${i * 10}%`,
    h0: `${Math.random() * 60 + 20}%`,
    h1: `${Math.random() * 80 + 20}%`,
    h2: `${Math.random() * 60 + 20}%`,
    duration: Math.random() * 2 + 2
  })), []);

  const particles = useMemo(() => [...Array(40)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    xTarget: Math.random() * 100 - 50,
    yTarget: Math.random() * 100 - 50,
    duration: Math.random() * 5 + 3
  })), []);

  const starlight = useMemo(() => [...Array(50)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 3 + 1,
    delay: Math.random() * 2
  })), []);

  const matrixLines = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${i * 5}%`,
    height: `${Math.random() * 50 + 20}%`,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 2
  })), []);

  if (vibe === 'power') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-orange-950 to-black overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          style={{ backgroundImage: 'radial-gradient(circle at center, #ff0000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <motion.div 
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,0,0,0.3)_360deg)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        />
      </div>
    );
  }
  if (vibe === 'wisdom') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-black overflow-hidden">
        {wisdomNodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-full bg-blue-400/20"
            style={{ width: node.size, height: node.size, left: node.left, top: node.top }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: node.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }
  if (vibe === 'wealth') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-emerald-950 to-black overflow-hidden flex flex-col justify-end">
        {wealthBars.map((bar) => (
          <motion.div
            key={bar.id}
            className="absolute bottom-0 w-8 bg-gradient-to-t from-yellow-500/40 to-transparent"
            style={{ left: bar.left, height: bar.h0 }}
            animate={{ height: [bar.h0, bar.h1, bar.h2] }}
            transition={{ duration: bar.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }
  if (vibe === 'tech') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-black via-cyan-950 to-black overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          animate={{ y: [0, 20], x: [0, 20] }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
      </div>
    );
  }
  if (vibe === 'health') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-emerald-900 to-black overflow-hidden flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-teal-400/30"
            style={{ width: (i + 1) * 150, height: (i + 1) * 150 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, delay: i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }
  
  if (vibe === 'vortex') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-fuchsia-950 to-black overflow-hidden flex items-center justify-center">
        <motion.div 
          className="absolute w-[200%] h-[200%] rounded-full border-[40px] border-dashed border-white/5"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        />
        <motion.div 
          className="absolute w-[150%] h-[150%] rounded-full border-[20px] border-dotted border-fuchsia-400/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        />
      </div>
    );
  }
  if (vibe === 'topography') {
    return (
      <div className="absolute inset-0 bg-stone-950 overflow-hidden">
        <motion.div
          className="absolute inset-[-100%] opacity-20"
          animate={{ x: [-50, 0], y: [-50, 0] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 Q 30 40 50 10 T 90 10' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M10 30 Q 30 60 50 30 T 90 30' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M10 50 Q 30 80 50 50 T 90 50' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }}
        />
      </div>
    );
  }
  if (vibe === 'waves') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black overflow-hidden flex items-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[200%] h-32 bg-cyan-500/10 rounded-[100%]"
            style={{ top: `${20 + i * 15}%`, left: '-50%' }}
            animate={{ y: [-20, 20, -20], rotate: [-2, 2, -2] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }
  if (vibe === 'particles') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ left: p.left, top: p.top }}
            animate={{ x: [0, p.xTarget], y: [0, p.yTarget], opacity: [0.1, 1, 0.1] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }
  if (vibe === 'prism') {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden flex items-center justify-center mix-blend-screen">
        <motion.div className="absolute w-64 h-64 bg-pink-500/30 blur-2xl rounded-full" animate={{ x: [50, -50, 50], y: [50, -50, 50] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute w-64 h-64 bg-cyan-500/30 blur-2xl rounded-full" animate={{ x: [-50, 50, -50], y: [-50, 50, -50] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute w-64 h-64 bg-yellow-500/30 blur-2xl rounded-full" animate={{ x: [0, 50, -50, 0], y: [50, 0, -50, 50] }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }} />
      </div>
    );
  }
  if (vibe === 'aurora') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden">
        <motion.div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-green-500/20 blur-[100px] rounded-full" animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/4 left-1/4 w-[150%] h-[150%] bg-purple-500/20 blur-[100px] rounded-full" animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    );
  }
  if (vibe === 'radar') {
    return (
      <div className="absolute inset-0 bg-green-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgNDBMNDAgMCIgc3Ryb2tlPSIjMDBmZjAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30" />
        <motion.div className="w-[150%] h-[150%] rounded-full absolute bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(0,255,0,0.4)_360deg)]" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        <div className="w-[80%] h-[80%] rounded-full border border-green-500/30 absolute" />
        <div className="w-[50%] h-[50%] rounded-full border border-green-500/30 absolute" />
      </div>
    );
  }
  if (vibe === 'matrix') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden">
        {matrixLines.map((line) => (
          <motion.div key={line.id} className="absolute w-1 bg-gradient-to-b from-transparent via-green-500 to-white/80 rounded-full" style={{ left: line.left, height: line.height, top: '-100%' }} animate={{ top: '200%' }} transition={{ duration: line.duration, repeat: Infinity, ease: "linear", delay: line.delay }} />
        ))}
      </div>
    );
  }
  if (vibe === 'nova') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950 to-black overflow-hidden flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full border-2 border-orange-500/50" style={{ width: 10, height: 10 }} animate={{ scale: [1, 50], opacity: [1, 0] }} transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: "easeOut" }} />
        ))}
      </div>
    );
  }
  if (vibe === 'dna') {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden flex items-center">
        {[...Array(15)].map((_, i) => (
          <motion.div key={i} className="absolute w-2 h-32 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-40" style={{ left: `${i * 7}%` }} animate={{ y: [-30, 30, -30], scaleY: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>
    );
  }
  if (vibe === 'fractal') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center">
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute border border-indigo-500/30" style={{ width: `${100 - i * 15}%`, height: `${100 - i * 15}%` }} animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }} />
        ))}
      </div>
    );
  }
  if (vibe === 'neon-grid') {
    return (
      <div className="absolute inset-0 bg-purple-950 overflow-hidden perspective-[1000px]">
        <motion.div className="absolute bottom-0 w-[200%] h-[100%] left-[-50%] opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255, 0, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 255, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'rotateX(60deg)' }} animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        <div className="absolute top-0 w-full h-[50%] bg-gradient-to-b from-black to-transparent" />
      </div>
    );
  }
  if (vibe === 'plasma') {
    return (
      <div className="absolute inset-0 bg-rose-950 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-50">
          <filter id="plasmaFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.2 0 0 0  0 0.5 0 0 0  0 0 0 1 0" />
            <feColorMatrix type="hueRotate" values="0">
              <animate attributeName="values" from="0" to="360" dur="10s" repeatCount="indefinite" />
            </feColorMatrix>
          </filter>
          <rect width="100%" height="100%" filter="url(#plasmaFilter)" />
        </svg>
      </div>
    );
  }
  if (vibe === 'starlight') {
    return (
      <div className="absolute inset-0 bg-black overflow-hidden">
        {starlight.map((star) => (
          <motion.div key={star.id} className="absolute w-[2px] h-[2px] bg-white rounded-full" style={{ left: star.left, top: star.top }} animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }} transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>
    );
  }
  if (vibe === 'cyber-circuit') {
    return (
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #0ff 2px, transparent 0)', backgroundSize: '40px 40px' }} />
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} className="absolute h-[2px] bg-cyan-400 shadow-[0_0_8px_#0ff]" style={{ top: `${(i + 1) * 20}%`, left: '-100%', width: '50%' }} animate={{ left: ['-50%', '150%'] }} transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "linear" }} />
        ))}
      </div>
    );
  }
  
  // default (nature/other)
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-black overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"
      />
    </div>
  );
};

export const AnimeGreeting: React.FC = () => {
  const { settings } = useShadowTrackerStore();
  const theme = settings.theme || 'obsidian';
  const [showPopup, setShowPopup] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slides = (settings.motivationalSlides && settings.motivationalSlides.length > 0 && settings.motivationalSlides[0].vibe) 
    ? settings.motivationalSlides 
    : defaultSlides;

  const getThemeBg = () => {
    switch (theme) {
      case 'obsidian': return 'bg-slate-900/90';
      case 'cyberpunk': return 'bg-yellow-900/90';
      case 'midnight': return 'bg-indigo-900/90';
      case 'onedark': return 'bg-red-900/90';
      case 'light':
      default: return 'bg-amber-900/90';
    }
  };

  const bg = getThemeBg();
  const handleOpen = () => {
    if (slides.length > 0) {
      const randomIndex = Math.floor(Math.random() * slides.length);
      setCurrentIndex(randomIndex);
    }
    setShowPopup(true);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentItem = slides[currentIndex] || slides[0];

  return (
    <div className="w-full flex justify-center items-center relative z-20 mb-2">
      {/* The wizard miniature — just the art, no surrounding tile */}
      <motion.div 
        onClick={handleOpen}
        title="Open Carousel"
        className="cursor-pointer select-none"
        whileHover={{ scale: 1.12, y: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      >
        <WizardMiniature theme={theme} />
      </motion.div>

      {/* Popup carousel via portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPopup && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 cursor-pointer"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-5xl w-full bg-surface border border-border/30 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => setShowPopup(false)}
                    className="p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-md shadow-lg hover:scale-110"
                  >
                    <Lucide.X size={20} />
                  </button>
                </div>

                {/* Navigation Arrows */}
                <button 
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all hover:scale-110"
                >
                  <Lucide.ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all hover:scale-110"
                >
                  <Lucide.ChevronRight size={24} />
                </button>

                {/* Abstract Background Area */}
                <div className="relative w-full md:w-3/5 h-[40vh] md:h-[70vh] bg-black overflow-hidden flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <DynamicBackground vibe={currentItem.vibe || 'power'} />
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-black/20 md:to-black z-10" />
                </div>

                {/* Quote Area */}
                <div className={`relative w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center items-start z-10 ${bg} backdrop-blur-xl border-l border-white/5`}>
                  <motion.div 
                    key={`icon-${currentIndex}`}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 mb-6 shadow-inner text-white"
                  >
                    <Lucide.Zap size={24} />
                  </motion.div>
                  
                  <AnimatePresence mode="wait">
                    <motion.h2 
                      key={`quote-${currentIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-lg"
                      style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    >
                      &ldquo;{currentItem.quote}&rdquo;
                    </motion.h2>
                  </AnimatePresence>

                  <div className="mt-12 flex gap-2 flex-wrap">
                    {slides.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
