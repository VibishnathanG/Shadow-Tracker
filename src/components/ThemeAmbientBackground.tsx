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
    {/* Outermost ring — slow clockwise (hidden on mobile for minimal look) */}
    <motion.div
      className="mobile-hide-symbol absolute w-[860px] h-[860px]"
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
   2. OBSIDIAN: ASTRONOMICAL RINGS & CELESTIAL SWORDS (BLACK, PURPLE & WHITE)
   Deep pitch black canvas, celestial purple geometry & razor-sharp white blades
   ───────────────────────────────────────────────────────────── */
const ObsidianBackground = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 overflow-hidden">
    {/* Ambient deep violet & white starlight radial glow on pitch black */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.14),rgba(255,255,255,0.02)_60%,transparent_80%)]" />

    {/* Outer celestial rings — rotating slowly (hidden on mobile for minimal appearance) */}
    <motion.div
      className="mobile-hide-symbol absolute w-[820px] h-[820px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 800 800" className="w-full h-full">
        <circle cx="400" cy="400" r="380" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="6 18" opacity="0.3" />
        <circle cx="400" cy="400" r="350" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.2" />
        {/* Cardinal tick diamonds in pure white */}
        {[0, 90, 180, 270].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 400 + 380 * Math.cos(rad);
          const cy = 400 + 380 * Math.sin(rad);
          return (
            <polygon
              key={idx}
              points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
              fill="#ffffff"
              opacity="0.6"
            />
          );
        })}
      </svg>
    </motion.div>

    {/* Middle counter-rotating ring with purple & white sacred geometry */}
    <motion.div
      className="absolute w-[580px] h-[580px]"
      animate={{ rotate: -360 }}
      transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 600 600" className="w-full h-full">
        <circle cx="300" cy="300" r="270" fill="none" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="12 12" opacity="0.3" />
        <circle cx="300" cy="300" r="220" fill="none" stroke="#ffffff" strokeWidth="0.7" strokeDasharray="3 6" opacity="0.25" />
        {/* Hexagonal sacred lines */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 300 + 180 * Math.cos(rad);
          const y1 = 300 + 180 * Math.sin(rad);
          const x2 = 300 + 265 * Math.cos(rad);
          const y2 = 300 + 265 * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? "#a855f7" : "#ffffff"} strokeWidth="0.9" opacity="0.25" />
          );
        })}
      </svg>
    </motion.div>

    {/* Central Abstract Crossed Celestial Swords in Purple & Brilliant White */}
    <motion.div
      className="absolute w-[360px] h-[360px] flex items-center justify-center"
      animate={{ rotate: [-8, 8, -8], scale: [0.98, 1.02, 0.98] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]">
        {/* Sword 1: Slanted left-to-right (-45 deg) */}
        <g transform="translate(150,150) rotate(-45) translate(-150,-150)">
          {/* Blade Spine: Brilliant White */}
          <line x1="150" y1="20" x2="150" y2="215" stroke="#ffffff" strokeWidth="1.8" opacity="0.9" />
          {/* Blade Edges: Amethyst Purple */}
          <polygon points="150,15 155,50 154,215 146,215 145,50" fill="none" stroke="#c084fc" strokeWidth="0.9" opacity="0.6" />
          {/* Crossguard: Vivid Purple */}
          <line x1="130" y1="215" x2="170" y2="215" stroke="#a855f7" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
          {/* Grip / Hilt */}
          <line x1="150" y1="215" x2="150" y2="260" stroke="#f3e8ff" strokeWidth="2.5" opacity="0.7" />
          {/* Pommel Diamond: White */}
          <polygon points="150,265 155,272 150,279 145,272" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Sword 2: Slanted right-to-left (+45 deg) */}
        <g transform="translate(150,150) rotate(45) translate(-150,-150)">
          {/* Blade Spine: Brilliant White */}
          <line x1="150" y1="20" x2="150" y2="215" stroke="#ffffff" strokeWidth="1.8" opacity="0.9" />
          {/* Blade Edges: Amethyst Purple */}
          <polygon points="150,15 155,50 154,215 146,215 145,50" fill="none" stroke="#c084fc" strokeWidth="0.9" opacity="0.6" />
          {/* Crossguard: Vivid Purple */}
          <line x1="130" y1="215" x2="170" y2="215" stroke="#a855f7" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
          {/* Grip */}
          <line x1="150" y1="215" x2="150" y2="260" stroke="#f3e8ff" strokeWidth="2.5" opacity="0.7" />
          {/* Pommel Diamond: White */}
          <polygon points="150,265 155,272 150,279 145,272" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Center Intersection Rune Ring in White & Purple */}
        <circle cx="150" cy="150" r="18" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.8" />
        <circle cx="150" cy="150" r="8" fill="#a855f7" opacity="0.6" />
      </svg>
    </motion.div>

    {/* Floating purple & white blade sparks (hidden on mobile for minimal look) */}
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        className="mobile-hide-symbol absolute w-1 h-8 bg-gradient-to-b from-[#a855f7] via-[#ffffff] to-transparent rounded-full opacity-35"
        style={{
          left: `${15 + (i * 14) % 75}%`,
          top: `${20 + (i * 17) % 65}%`,
          transform: `rotate(${30 + i * 25}deg)`,
        }}
        animate={{
          y: [-15, 15, -15],
          opacity: [0.2, 0.6, 0.2],
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

      {/* Floating 3D Isometric Wireframe Cubes (hidden on mobile for minimal appearance) */}
      {cubes.map((c, idx) => (
        <motion.div
          key={idx}
          className="mobile-hide-symbol absolute"
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
   4. MONOKAI PURPLE: VIBRANT VIOLET & MONOKAI AMBER/ORANGE CELESTIAL RINGS
   Light-theme minimal purple aesthetic with warm yellow-orange geometric accents



/* ─────────────────────────────────────────────────────────────
   MULTI-COLOR DARK & WHITE MIXED THEME ("SPECTRUM")
   Harmonious multi-color orbital rings (indigo, cyan, amber, emerald, white)
   with floating multi-hue stardust on neutral dark graphite canvas
   ───────────────────────────────────────────────────────────── */
const MultiColorPurpleBackground = React.memo(() => {
  const sparks = React.useMemo(() => {
    const colors = ['#6366f1', '#06b6d4', '#f97316', '#10b981', '#f43f5e', '#fdfbf7'];
    return Array.from({ length: 24 }).map((_, i) => ({
      x: (i * 17 + 8) % 94,
      y: (i * 23 + 10) % 92,
      size: (i % 3) + 1.5,
      delay: (i % 6) * 0.5,
      duration: 4 + (i % 4),
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
      {/* Multi-Color Ambient Radial Glows on Dark Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.1),transparent_55%),radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.06),transparent_65%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.06),transparent_55%)]" />

      {/* Intersecting Concentric Rings in Indigo, Cyan, Amber & Creamy White */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-[740px] h-[740px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 700 700" className="w-full h-full">
            <circle cx="350" cy="350" r="330" fill="none" stroke="#6366f1" strokeWidth="0.9" strokeDasharray="6 16" opacity="0.35" />
            <circle cx="350" cy="350" r="280" fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="4 12" opacity="0.3" />
            <circle cx="350" cy="350" r="220" fill="none" stroke="#f97316" strokeWidth="0.85" opacity="0.25" />
            <circle cx="350" cy="350" r="170" fill="none" stroke="#fdfbf7" strokeWidth="0.6" strokeDasharray="2 6" opacity="0.25" />
            {/* Orbital nodes with creamy white highlights */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 350 + 330 * Math.cos(rad);
              const y = 350 + 330 * Math.sin(rad);
              return <circle key={i} cx={x} cy={y} r="2.5" fill={i % 2 === 0 ? "#fdfbf7" : "#818cf8"} opacity="0.85" />;
            })}
          </svg>
        </motion.div>

        <motion.div
          className="absolute w-[520px] h-[520px]"
          animate={{ rotate: -360, scale: [0.97, 1.03, 0.97] }}
          transition={{ rotate: { duration: 60, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <polygon points="250,45 455,250 250,455 45,250" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="8 10" opacity="0.25" />
            <polygon points="250,85 415,250 250,415 85,250" fill="none" stroke="#06b6d4" strokeWidth="0.75" opacity="0.28" />
            <circle cx="250" cy="250" r="140" fill="none" stroke="#6366f1" strokeWidth="0.85" strokeDasharray="4 6" opacity="0.32" />
          </svg>
        </motion.div>
      </div>

      {/* Multi-Hue Cosmic Stardust Motes */}
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          className="mobile-hide-symbol absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 8px ${s.color}`,
          }}
          animate={{
            opacity: [0.2, 0.85, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  );
});
MultiColorPurpleBackground.displayName = 'MultiColorPurpleBackground';


/* ─────────────────────────────────────────────────────────────
   5. WHITE / LIGHT THEME: ETERNALS GOLDEN COSMIC RUNES & CELESTIAL CIRCUITS
   Marvel Eternals movie inspired golden sacred geometric runes,
   interlocking circular mandalas & energy filaments traversing across canvas.
   ───────────────────────────────────────────────────────────── */
const EternalsGoldRunesBackground = React.memo(() => {
  const goldenSparks = React.useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      x: (i * 19 + 5) % 94,
      y: (i * 31 + 13) % 90,
      size: (i % 3) + 1.8,
      delay: (i % 5) * 0.7,
      duration: 5 + (i % 4),
      opacity: 0.25 + (i % 3) * 0.15,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {/* Soft warm golden ambient radial illumination */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(245,158,11,0.06),rgba(217,119,6,0.02)_60%,transparent_80%)]" />

      {/* Horizontal & Diagonal Traversing Eternals Energy Filaments */}
      <div className="absolute inset-0">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
          {/* Main horizontal celestial circuit line with rune nodes */}
          <motion.g
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M -100,280 L 320,280 L 420,340 L 780,340 L 860,260 L 1200,260 L 1320,320 L 1600,320"
              fill="none"
              stroke="#d97706"
              strokeWidth="0.9"
              strokeDasharray="8 12 24 12"
              opacity="0.35"
            />
            <path
              d="M -100,280 L 320,280 L 420,340 L 780,340 L 860,260 L 1200,260 L 1320,320 L 1600,320"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.4"
              opacity="0.25"
            />
            {/* Celestial node circles along the path */}
            {[320, 420, 780, 860, 1200, 1320].map((cx, i) => {
              const cy = cx === 320 ? 280 : cx === 420 || cx === 780 ? 340 : cx === 860 || cx === 1200 ? 260 : 320;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="3.5" fill="#f59e0b" opacity="0.6" />
                  <circle cx={cx} cy={cy} r="7" fill="none" stroke="#d97706" strokeWidth="0.75" opacity="0.4" />
                </g>
              );
            })}
          </motion.g>

          {/* Lower secondary filament circuit */}
          <motion.g
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <path
              d="M -50,680 L 260,680 L 380,600 L 720,600 L 840,690 L 1180,690 L 1290,620 L 1550,620"
              fill="none"
              stroke="#d97706"
              strokeWidth="0.8"
              strokeDasharray="6 14"
              opacity="0.3"
            />
            {[260, 380, 720, 840, 1180].map((cx, i) => {
              const cy = cx === 260 ? 680 : cx === 380 || cx === 720 ? 600 : cx === 840 || cx === 1180 ? 690 : 620;
              return (
                <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f59e0b" opacity="0.5" />
              );
            })}
          </motion.g>
        </svg>
      </div>

      {/* Central Rotating Eternals Mandala & Cosmic Rune Circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer slow golden celestial ring */}
        <motion.div
          className="w-[840px] h-[840px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 800 800" className="w-full h-full">
            <circle cx="400" cy="400" r="380" fill="none" stroke="#d97706" strokeWidth="0.9" strokeDasharray="5 18 20 18" opacity="0.3" />
            <circle cx="400" cy="400" r="350" fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="3 9" opacity="0.25" />
            {/* Celestial cardinal rune points */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 400 + 380 * Math.cos(rad);
              const y = 400 + 380 * Math.sin(rad);
              return (
                <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? "3.5" : "2"} fill="#d97706" opacity="0.5" />
              );
            })}
          </svg>
        </motion.div>

        {/* Middle counter-rotating Eternals sacred mandala */}
        <motion.div
          className="absolute w-[560px] h-[560px]"
          animate={{ rotate: -360, scale: [0.98, 1.02, 0.98] }}
          transition={{ rotate: { duration: 70, repeat: Infinity, ease: 'linear' }, scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ willChange: 'transform' }}
        >
          <svg viewBox="0 0 600 600" className="w-full h-full">
            <circle cx="300" cy="300" r="270" fill="none" stroke="#f59e0b" strokeWidth="1.1" strokeDasharray="14 14" opacity="0.32" />
            <circle cx="300" cy="300" r="220" fill="none" stroke="#d97706" strokeWidth="0.75" opacity="0.22" />
            {/* Sacred 12-point star / interconnected Eternals rune glyphs */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const radNext = ((deg + 120) * Math.PI) / 180;
              const x1 = 300 + 220 * Math.cos(rad);
              const y1 = 300 + 220 * Math.sin(rad);
              const x2 = 300 + 220 * Math.cos(radNext);
              const y2 = 300 + 220 * Math.sin(radNext);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="0.8" opacity="0.25" />
              );
            })}
            <polygon points="300,100 473,400 127,400" fill="none" stroke="#d97706" strokeWidth="0.9" opacity="0.25" />
            <polygon points="300,500 473,200 127,200" fill="none" stroke="#d97706" strokeWidth="0.9" opacity="0.25" />
            <circle cx="300" cy="300" r="100" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="4 8" opacity="0.35" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Gold Cosmic Stardust Motes */}
      {goldenSparks.map((s, idx) => (
        <motion.div
          key={idx}
          className="mobile-hide-symbol absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 8px rgba(245, 158, 11, 0.45)',
          }}
          animate={{
            y: [-25, 25, -25],
            opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5],
            scale: [0.85, 1.25, 0.85],
          }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  );
});
EternalsGoldRunesBackground.displayName = 'EternalsGoldRunesBackground';


/* ─────────────────────────────────────────────────────────────
   STATIC FALLBACK FOR ECO MODE
   100% Static SVG with ZERO Framer Motion animations & 0% CPU usage!
   ───────────────────────────────────────────────────────────── */
const StaticEternalRings: React.FC<{ theme: string }> = ({ theme }) => {
  const colorMap: Record<string, { stroke: string; accent: string; opacity: number }> = {
    light: { stroke: '#d97706', accent: '#f59e0b', opacity: 0.05 },
    white: { stroke: '#d97706', accent: '#f59e0b', opacity: 0.05 },
    obsidian: { stroke: '#a855f7', accent: '#ffffff', opacity: 0.035 },
    onedark: { stroke: '#60a5fa', accent: '#2563eb', opacity: 0.025 },
    cyberpunk: { stroke: '#38bdf8', accent: '#fb7185', opacity: 0.025 },
    midnight: { stroke: '#a855f7', accent: '#06b6d4', opacity: 0.04 },
    pine: { stroke: '#a855f7', accent: '#06b6d4', opacity: 0.04 },
    purple: { stroke: '#a855f7', accent: '#06b6d4', opacity: 0.04 },
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
      case 'white': return '#edf2f7'; // Cool porcelain canvas so warm creamy tiles pop out!
      case 'obsidian': return '#07060a'; // Pure pitch black
      case 'onedark': return '#16181d';
      case 'cyberpunk': return '#10131a';
      case 'midnight':
      case 'pine':
      case 'purple':
      case 'spectrum': return '#0c0e14'; // Multi-Color Dark & White Mixed Spectrum canvas
      default: return '#16181d';
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
      case 'spectrum':
        return <MultiColorPurpleBackground />;
      case 'light':
      case 'white':
      default:
        return <EternalsGoldRunesBackground />;
    }
  };

  return (
    <div
      className="theme-ambient-canvas fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: getBgColor() }}
      aria-hidden="true"
    >
      {renderThemeAnimation()}
    </div>
  );
});
ThemeAmbientBackground.displayName = 'ThemeAmbientBackground';
