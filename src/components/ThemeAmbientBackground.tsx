'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';

interface ThemeAmbientBackgroundProps {
  theme: string;
}

/* ─────────────────────────────────────────────────────────────
   1. ONEDARK: KINETIC ORBITAL RINGS & ARC REACTOR HUD
   Clean nested rings, counter-rotating telemetry arcs, blue glow
   ───────────────────────────────────────────────────────────── */
const OneDarkBackground = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 overflow-hidden" style={{ transform: 'scale(1.2)' }}>
    {/* Outermost ring — slow clockwise */}
    <motion.div
      className="absolute w-[860px] h-[860px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 900 900" className="w-full h-full">
        <circle cx="450" cy="450" r="430" fill="none" stroke="#61afef" strokeWidth="0.8" strokeDasharray="8 20" opacity="0.22" />
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10) * Math.PI / 180;
          const x1 = 450 + 420 * Math.cos(angle);
          const y1 = 450 + 420 * Math.sin(angle);
          const x2 = 450 + 438 * Math.cos(angle);
          const y2 = 450 + 438 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#61afef"
              strokeWidth={i % 3 === 0 ? "1.8" : "0.7"}
              opacity={i % 3 === 0 ? "0.45" : "0.15"}
            />
          );
        })}
      </svg>
    </motion.div>

    {/* Middle counter-rotating ring */}
    <motion.div
      className="absolute w-[680px] h-[680px]"
      animate={{ rotate: -360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 700 700" className="w-full h-full">
        <circle cx="350" cy="350" r="330" fill="none" stroke="#61afef" strokeWidth="1.8" strokeDasharray="4 14" opacity="0.2" />
        <circle cx="350" cy="350" r="310" fill="none" stroke="#61afef" strokeWidth="0.6" opacity="0.14" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <path
            key={i}
            d={`M ${350 + 300 * Math.cos(deg * Math.PI / 180)} ${350 + 300 * Math.sin(deg * Math.PI / 180)} A 300 300 0 0 1 ${350 + 300 * Math.cos((deg + 45) * Math.PI / 180)} ${350 + 300 * Math.sin((deg + 45) * Math.PI / 180)}`}
            fill="none" stroke="#61afef" strokeWidth="2.5" opacity="0.16" strokeLinecap="round"
          />
        ))}
      </svg>
    </motion.div>

    {/* Inner breathing geometric HUD ring */}
    <motion.div
      className="absolute w-[440px] h-[440px]"
      animate={{ rotate: 360, scale: [1, 1.03, 1] }}
      transition={{ rotate: { duration: 35, repeat: Infinity, ease: 'linear' }, scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 450 450" className="w-full h-full">
        <polygon points="225,45 395,365 55,365" fill="none" stroke="#61afef" strokeWidth="1.2" strokeDasharray="6 8" opacity="0.2" />
        <polygon points="225,85 365,335 85,335" fill="none" stroke="#61afef" strokeWidth="0.7" opacity="0.12" />
        <circle cx="225" cy="225" r="140" fill="none" stroke="#61afef" strokeWidth="1.6" opacity="0.2" />
        <circle cx="225" cy="225" r="120" fill="none" stroke="#61afef" strokeWidth="0.6" strokeDasharray="3 8" opacity="0.15" />
      </svg>
    </motion.div>

    {/* Soft core glow */}
    <motion.div
      className="absolute w-[220px] h-[220px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(97,175,239,0.14) 0%, rgba(97,175,239,0.03) 55%, transparent 70%)' }}
      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
));
OneDarkBackground.displayName = 'OneDarkBackground';


/* ─────────────────────────────────────────────────────────────
   2. OBSIDIAN: ASTRONOMICAL RINGS & CELESTIAL SWORDS
   Concentric geometry rings with razor-sharp crossed celestial blades
   ───────────────────────────────────────────────────────────── */
const ObsidianBackground = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-55 overflow-hidden">
    {/* Ambient radial sky glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.08),rgba(2,132,199,0.02)_60%,transparent_80%)]" />

    {/* Outer celestial rings — rotating slowly */}
    <motion.div
      className="absolute w-[820px] h-[820px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 800 800" className="w-full h-full">
        <circle cx="400" cy="400" r="380" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6 18" opacity="0.2" />
        <circle cx="400" cy="400" r="350" fill="none" stroke="#0284c7" strokeWidth="0.5" opacity="0.15" />
        {/* Cardinal tick diamonds */}
        {[0, 90, 180, 270].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 400 + 380 * Math.cos(rad);
          const cy = 400 + 380 * Math.sin(rad);
          return (
            <polygon
              key={idx}
              points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
              fill="#38bdf8"
              opacity="0.4"
            />
          );
        })}
      </svg>
    </motion.div>

    {/* Middle counter-rotating ring with sacred geometry segments */}
    <motion.div
      className="absolute w-[580px] h-[580px]"
      animate={{ rotate: -360 }}
      transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 600 600" className="w-full h-full">
        <circle cx="300" cy="300" r="270" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="12 12" opacity="0.25" />
        <circle cx="300" cy="300" r="220" fill="none" stroke="#7dd3fc" strokeWidth="0.6" strokeDasharray="3 6" opacity="0.2" />
        {/* Hexagonal sacred lines */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 300 + 180 * Math.cos(rad);
          const y1 = 300 + 180 * Math.sin(rad);
          const x2 = 300 + 265 * Math.cos(rad);
          const y2 = 300 + 265 * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="0.9" opacity="0.2" />
          );
        })}
      </svg>
    </motion.div>

    {/* Central Abstract Crossed Celestial Swords & Blade Silhouettes */}
    <motion.div
      className="absolute w-[360px] h-[360px] flex items-center justify-center"
      animate={{ rotate: [-8, 8, -8], scale: [0.98, 1.02, 0.98] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_16px_rgba(56,189,248,0.25)]">
        {/* Sword 1: Slanted left-to-right (-45 deg) */}
        <g transform="translate(150,150) rotate(-45) translate(-150,-150)">
          {/* Blade Spine */}
          <line x1="150" y1="20" x2="150" y2="215" stroke="#38bdf8" strokeWidth="1.6" opacity="0.75" />
          {/* Blade Edges (Tapering to tip at y=20) */}
          <polygon points="150,15 155,50 154,215 146,215 145,50" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
          {/* Crossguard */}
          <line x1="130" y1="215" x2="170" y2="215" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
          {/* Grip / Hilt */}
          <line x1="150" y1="215" x2="150" y2="260" stroke="#7dd3fc" strokeWidth="2.5" opacity="0.55" />
          {/* Pommel Diamond */}
          <polygon points="150,265 155,272 150,279 145,272" fill="#38bdf8" opacity="0.6" />
        </g>

        {/* Sword 2: Slanted right-to-left (+45 deg) */}
        <g transform="translate(150,150) rotate(45) translate(-150,-150)">
          {/* Blade Spine */}
          <line x1="150" y1="20" x2="150" y2="215" stroke="#38bdf8" strokeWidth="1.6" opacity="0.75" />
          {/* Blade Edges */}
          <polygon points="150,15 155,50 154,215 146,215 145,50" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
          {/* Crossguard */}
          <line x1="130" y1="215" x2="170" y2="215" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
          {/* Grip */}
          <line x1="150" y1="215" x2="150" y2="260" stroke="#7dd3fc" strokeWidth="2.5" opacity="0.55" />
          {/* Pommel Diamond */}
          <polygon points="150,265 155,272 150,279 145,272" fill="#38bdf8" opacity="0.6" />
        </g>

        {/* Center Intersection Rune Ring */}
        <circle cx="150" cy="150" r="18" fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.6" />
        <circle cx="150" cy="150" r="8" fill="#38bdf8" opacity="0.3" />
      </svg>
    </motion.div>

    {/* Floating razor blade motes */}
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-8 bg-gradient-to-b from-[#38bdf8] to-transparent rounded-full opacity-30"
        style={{
          left: `${15 + (i * 14) % 75}%`,
          top: `${20 + (i * 17) % 65}%`,
          transform: `rotate(${30 + i * 25}deg)`,
        }}
        animate={{
          y: [-15, 15, -15],
          opacity: [0.15, 0.45, 0.15],
        }}
        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
));
ObsidianBackground.displayName = 'ObsidianBackground';


/* ─────────────────────────────────────────────────────────────
   3. CYBERPUNK: FLOATING ISOMETRIC WIREFRAME CUBES & NEON GRID
   Isometric 3D wireframe cubes slowly drifting through neon perspective lines
   ───────────────────────────────────────────────────────────── */
const IsometricCube: React.FC<{ size: number; stroke: string; opacity: number }> = ({ size, stroke, opacity }) => {
  const s = size;
  const h = s * 0.577; // tan(30 deg)
  return (
    <svg width={s * 2} height={s * 2} viewBox={`0 0 ${s * 2} ${s * 2}`} className="overflow-visible" style={{ opacity }}>
      {/* Top Face */}
      <polygon
        points={`${s},${s - h * 1.6} ${s + s * 0.866},${s - h * 0.7} ${s},${s + h * 0.2} ${s - s * 0.866},${s - h * 0.7}`}
        fill="none" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"
      />
      {/* Left Face */}
      <polygon
        points={`${s - s * 0.866},${s - h * 0.7} ${s},${s + h * 0.2} ${s},${s + h * 1.8} ${s - s * 0.866},${s + h * 0.9}`}
        fill="none" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"
      />
      {/* Right Face */}
      <polygon
        points={`${s},${s + h * 0.2} ${s + s * 0.866},${s - h * 0.7} ${s + s * 0.866},${s + h * 0.9} ${s},${s + h * 1.8}`}
        fill="none" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"
      />
      {/* Center Vertex Lines */}
      <line x1={s} y1={s + h * 0.2} x2={s} y2={s + h * 1.8} stroke={stroke} strokeWidth="1" opacity="0.6" />
    </svg>
  );
};

const CyberpunkBackground = React.memo(() => {
  const cubes = React.useMemo(() => [
    { x: 12, y: 35, size: 28, stroke: '#fb7185', duration: 14, delay: 0, rot: [0, 45, 0] },
    { x: 82, y: 25, size: 36, stroke: '#38bdf8', duration: 18, delay: 2, rot: [10, -35, 10] },
    { x: 25, y: 70, size: 22, stroke: '#c084fc', duration: 16, delay: 1, rot: [-15, 30, -15] },
    { x: 74, y: 72, size: 32, stroke: '#fb7185', duration: 20, delay: 3, rot: [20, -20, 20] },
    { x: 48, y: 18, size: 20, stroke: '#38bdf8', duration: 12, delay: 0.5, rot: [-10, 25, -10] },
    { x: 52, y: 84, size: 26, stroke: '#c084fc', duration: 15, delay: 2.5, rot: [5, -40, 5] },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-55">
      {/* Ambient Neon Clouds */}
      <div className="absolute w-[65vw] h-[65vw] rounded-full -top-[15vw] -left-[10vw] bg-[radial-gradient(ellipse,rgba(251,113,133,0.12)_0%,transparent_65%)]" />
      <div className="absolute w-[60vw] h-[60vw] rounded-full -bottom-[15vw] -right-[10vw] bg-[radial-gradient(ellipse,rgba(56,189,248,0.1)_0%,transparent_65%)]" />

      {/* Cyberpunk Perspective Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(56,189,248,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(251,113,133,0.7) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating 3D Isometric Wireframe Cubes */}
      {cubes.map((c, idx) => (
        <motion.div
          key={idx}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{
            y: [-25, 25, -25],
            x: [-10, 10, -10],
            rotate: c.rot,
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{ duration: c.duration, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
        >
          <IsometricCube size={c.size} stroke={c.stroke} opacity={0.65} />
        </motion.div>
      ))}

      {/* Central Concentric Neon Ring Wave */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-[500px] h-[500px] rounded-full border border-dashed border-rose-500/20"
          animate={{ rotate: 360, scale: [0.98, 1.03, 0.98] }}
          transition={{ rotate: { duration: 50, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-[360px] h-[360px] rounded-full border border-cyan-400/20" />
          </div>
        </motion.div>
      </div>
    </div>
  );
});
CyberpunkBackground.displayName = 'CyberpunkBackground';


/* ─────────────────────────────────────────────────────────────
   4. PURPLE THEME (AMETHYST): ETHEREAL RINGS & GEOMETRIC DIAMONDS
   White and purple mixed aesthetic with floating glowing rings & crystals
   ───────────────────────────────────────────────────────────── */
const PurpleBackground = React.memo(() => {
  // Floating luminous white and lavender crystals / diamond sparks
  const crystals = React.useMemo(() => [
    { x: 15, y: 25, size: 24, delay: 0, duration: 8, stroke: '#ffffff' },
    { x: 80, y: 20, size: 28, delay: 1.5, duration: 10, stroke: '#e9d5ff' },
    { x: 22, y: 75, size: 20, delay: 0.8, duration: 9, stroke: '#c084fc' },
    { x: 75, y: 80, size: 30, delay: 2.2, duration: 11, stroke: '#ffffff' },
    { x: 45, y: 15, size: 16, delay: 1, duration: 7, stroke: '#e9d5ff' },
    { x: 88, y: 55, size: 22, delay: 3, duration: 12, stroke: '#c084fc' },
  ], []);

  const stardust = React.useMemo(() =>
    Array.from({ length: 22 }).map((_, i) => ({
      x: (i * 17 + 7) % 94,
      y: (i * 29 + 11) % 92,
      size: (i % 3) + 1.5,
      delay: (i % 5) * 0.6,
      duration: 4 + (i % 4),
      isWhite: i % 2 === 0,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
      {/* Deep Amethyst Radial Core Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,85,247,0.16),rgba(192,132,252,0.04)_55%,transparent_75%)]" />

      {/* Floating Concentric Ethereal Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-[720px] h-[720px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 95, repeat: Infinity, ease: 'linear' }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 700 700" className="w-full h-full">
            <circle cx="350" cy="350" r="330" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="6 14" opacity="0.3" />
            <circle cx="350" cy="350" r="280" fill="none" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="3 9" opacity="0.25" />
            <circle cx="350" cy="350" r="220" fill="none" stroke="#c084fc" strokeWidth="1.2" opacity="0.2" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute w-[500px] h-[500px]"
          animate={{ rotate: -360, scale: [0.97, 1.03, 0.97] }}
          transition={{ rotate: { duration: 60, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            {/* Interlocking geometric diamond frame */}
            <polygon points="250,50 450,250 250,450 50,250" fill="none" stroke="#a855f7" strokeWidth="1.4" strokeDasharray="8 10" opacity="0.25" />
            <polygon points="250,90 410,250 250,410 90,250" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.2" />
            <circle cx="250" cy="250" r="140" fill="none" stroke="#c084fc" strokeWidth="0.9" strokeDasharray="4 6" opacity="0.25" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Geometric Diamond / Amethyst Crystals */}
      {crystals.map((c, idx) => (
        <motion.div
          key={idx}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{
            y: [-20, 20, -20],
            rotate: [-12, 12, -12],
            scale: [0.92, 1.08, 0.92],
          }}
          transition={{ duration: c.duration, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
        >
          <svg width={c.size * 2} height={c.size * 2.4} viewBox="0 0 50 60" className="drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            {/* Upper facets */}
            <polygon points="25,5 45,22 25,26 5,22" fill="none" stroke={c.stroke} strokeWidth="1.2" opacity="0.7" />
            {/* Lower facets tapering to point */}
            <polygon points="5,22 25,26 25,55" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.6" />
            <polygon points="45,22 25,26 25,55" fill="none" stroke={c.stroke} strokeWidth="1.2" opacity="0.7" />
            {/* Center spine */}
            <line x1="25" y1="5" x2="25" y2="55" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
          </svg>
        </motion.div>
      ))}

      {/* Crisp White & Lavender Stardust Sparks */}
      {stardust.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.isWhite ? '#ffffff' : '#c084fc',
            boxShadow: s.isWhite ? '0 0 8px #ffffff' : '0 0 8px #a855f7',
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  );
});
PurpleBackground.displayName = 'PurpleBackground';


/* ─────────────────────────────────────────────────────────────
   5. WHITE / LIGHT THEME: CREAMY MINIMAL INTERSECTING RINGS & CUBES
   Whisper-light delicate geometry, leaving creamy white clean and pristine
   ───────────────────────────────────────────────────────────── */
const WhiteCreamyBackground = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
    {/* Very soft warm amber/cream ambient radial glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.035),rgba(217,119,6,0.02)_50%,transparent_75%)]" />

    {/* Concentric delicate geometric rings — ultra-minimal stroke */}
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="w-[750px] h-[750px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
      >
        <svg viewBox="0 0 750 750" className="w-full h-full">
          <circle cx="375" cy="375" r="350" fill="none" stroke="#4f46e5" strokeWidth="0.6" strokeDasharray="4 16" opacity="0.18" />
          <circle cx="375" cy="375" r="290" fill="none" stroke="#d97706" strokeWidth="0.5" strokeDasharray="2 10" opacity="0.14" />
          <circle cx="375" cy="375" r="220" fill="none" stroke="#4f46e5" strokeWidth="0.8" opacity="0.12" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute w-[480px] h-[480px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
      >
        <svg viewBox="0 0 500 500" className="w-full h-full">
          {/* Subtle intersecting geometric squares */}
          <rect x="125" y="125" width="250" height="250" fill="none" stroke="#4f46e5" strokeWidth="0.6" strokeDasharray="6 8" opacity="0.14" />
          <circle cx="250" cy="250" r="160" fill="none" stroke="#d97706" strokeWidth="0.5" opacity="0.12" />
        </svg>
      </motion.div>
    </div>

    {/* Subtle floating minimal wireframe cubes in creamy space */}
    {[
      { x: 15, y: 30, size: 24, delay: 0, dur: 14 },
      { x: 82, y: 22, size: 30, delay: 2, dur: 16 },
      { x: 20, y: 78, size: 20, delay: 1, dur: 12 },
      { x: 78, y: 75, size: 26, delay: 3, dur: 15 },
    ].map((cube, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${cube.x}%`, top: `${cube.y}%` }}
        animate={{
          y: [-15, 15, -15],
          rotate: [-6, 6, -6],
        }}
        transition={{ duration: cube.dur, repeat: Infinity, ease: 'easeInOut', delay: cube.delay }}
      >
        <IsometricCube size={cube.size} stroke="#4f46e5" opacity={0.22} />
      </motion.div>
    ))}
  </div>
));
WhiteCreamyBackground.displayName = 'WhiteCreamyBackground';


/* ─────────────────────────────────────────────────────────────
   STATIC FALLBACK FOR ECO MODE
   100% Static SVG with ZERO Framer Motion animations & 0% CPU usage!
   ───────────────────────────────────────────────────────────── */
const StaticEternalRings: React.FC<{ theme: string }> = ({ theme }) => {
  const colorMap: Record<string, { stroke: string; accent: string; opacity: number }> = {
    light: { stroke: '#4f46e5', accent: '#6366f1', opacity: 0.035 },
    white: { stroke: '#4f46e5', accent: '#6366f1', opacity: 0.035 },
    obsidian: { stroke: '#38bdf8', accent: '#0284c7', opacity: 0.025 },
    onedark: { stroke: '#60a5fa', accent: '#2563eb', opacity: 0.025 },
    cyberpunk: { stroke: '#38bdf8', accent: '#fb7185', opacity: 0.025 },
    midnight: { stroke: '#a855f7', accent: '#c084fc', opacity: 0.025 },
    pine: { stroke: '#a855f7', accent: '#c084fc', opacity: 0.025 },
    purple: { stroke: '#a855f7', accent: '#c084fc', opacity: 0.025 },
  };

  const colors = colorMap[theme] || colorMap.onedark;

  return (
    <svg
      className="dashboard-watermark absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: colors.opacity }}
    >
      <circle cx="500" cy="500" r="260" fill="none" stroke={colors.stroke} strokeWidth="0.8" strokeDasharray="4 8" />
      <circle cx="500" cy="500" r="210" fill="none" stroke={colors.accent} strokeWidth="0.9" />
      <circle cx="500" cy="500" r="160" fill="none" stroke={colors.stroke} strokeWidth="0.8" strokeDasharray="8 8" />
      <circle cx="500" cy="500" r="110" fill="none" stroke={colors.accent} strokeWidth="1.0" />
      <circle cx="500" cy="500" r="65" fill="none" stroke={colors.stroke} strokeWidth="0.8" strokeDasharray="3 5" />
      <line x1="500" y1="200" x2="500" y2="800" stroke={colors.stroke} strokeWidth="0.5" strokeDasharray="4 6" />
      <line x1="200" y1="500" x2="800" y2="500" stroke={colors.stroke} strokeWidth="0.5" strokeDasharray="4 6" />
    </svg>
  );
};


/* ─────────────────────────────────────────────────────────────
   MAIN AMBIENT WRAPPER WITH ECO MODE TOGGLE
   ───────────────────────────────────────────────────────────── */
export const ThemeAmbientBackground: React.FC<ThemeAmbientBackgroundProps> = React.memo(({ theme }) => {
  const [isHidden, setIsHidden] = React.useState(false);
  const isEcoOrLowGpu = useShadowTrackerStore((s) => Boolean(s.settings.ecoMode || s.settings.lowGpuMode));

  React.useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.hidden;
      setIsHidden(hidden);
      if (hidden) {
        document.documentElement.classList.add('is-hidden');
      } else {
        document.documentElement.classList.remove('is-hidden');
      }
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);

    // Listen for Tauri native window backgrounding / eco mode event
    if (typeof window !== 'undefined' && ((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__)) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<{ enabled: boolean }>('shadow-eco-mode', (e) => {
          if (e.payload && typeof e.payload.enabled === 'boolean') {
            setIsHidden(e.payload.enabled);
            if (e.payload.enabled) {
              document.documentElement.classList.add('is-hidden');
            } else {
              document.documentElement.classList.remove('is-hidden');
            }
          }
        }).catch(() => {});

        listen<{ ecoMode: boolean }>('shadow-tray-eco-toggle', (e) => {
          if (e.payload && typeof e.payload.ecoMode === 'boolean') {
            useShadowTrackerStore.getState().updateSettings({
              ecoMode: e.payload.ecoMode,
              lowGpuMode: e.payload.ecoMode,
            });
          }
        }).catch(() => {});
      }).catch(() => {});
    }

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  React.useEffect(() => {
    if (isEcoOrLowGpu) {
      document.documentElement.classList.add('eco-mode', 'low-gpu-mode');
    } else {
      document.documentElement.classList.remove('eco-mode', 'low-gpu-mode');
    }
  }, [isEcoOrLowGpu]);

  // When hidden or minimized in background, unmount completely to guarantee 0.0% CPU
  if (isHidden) {
    return null;
  }

  const getBgColor = () => {
    switch (theme) {
      case 'light':
      case 'white': return '#faf8f5';
      case 'obsidian': return '#0b0d11';
      case 'onedark': return '#16181d';
      case 'cyberpunk': return '#10131a';
      case 'midnight':
      case 'pine':
      case 'purple': return '#0e0a1a';
      default: return '#0e0a1a';
    }
  };

  const renderThemeAnimation = () => {
    // If Eco Mode is enabled, render static SVG without any Framer Motion RAF loops!
    if (isEcoOrLowGpu) {
      return <StaticEternalRings theme={theme} />;
    }

    switch (theme) {
      case 'obsidian':
        return <ObsidianBackground />;
      case 'onedark':
        return <OneDarkBackground />;
      case 'cyberpunk':
        return <CyberpunkBackground />;
      case 'midnight':
      case 'pine':
      case 'purple':
        return <PurpleBackground />;
      case 'light':
      case 'white':
      default:
        return <WhiteCreamyBackground />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: getBgColor() }}
      aria-hidden="true"
    >
      {renderThemeAnimation()}
    </div>
  );
});
ThemeAmbientBackground.displayName = 'ThemeAmbientBackground';
