'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ThemeAmbientBackgroundProps {
  theme: string;
}

/* ─── OneDark: Iron Man Arc Reactor HUD ─── */
const OneDarkBackground = React.memo(() => (
  <div className="absolute inset-0 flex items-center justify-center opacity-60" style={{ transform: 'scale(1.5)', willChange: 'transform' }}>
    {/* Outermost ring — slow clockwise */}
    <motion.div
      className="absolute w-[900px] h-[900px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 900 900" className="w-full h-full">
        <defs>
          <radialGradient id="arcCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#61afef" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#61afef" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Main outer ring */}
        <circle cx="450" cy="450" r="430" fill="none" stroke="#61afef" strokeWidth="0.8" strokeDasharray="8 20" opacity="0.25" />
        {/* Tick marks around perimeter */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10) * Math.PI / 180;
          const x1 = 450 + 420 * Math.cos(angle);
          const y1 = 450 + 420 * Math.sin(angle);
          const x2 = 450 + 440 * Math.cos(angle);
          const y2 = 450 + 440 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#61afef" strokeWidth={i % 3 === 0 ? "2" : "0.8"}
              opacity={i % 3 === 0 ? "0.5" : "0.2"} />
          );
        })}
      </svg>
    </motion.div>

    {/* Second ring — counter-clockwise */}
    <motion.div
      className="absolute w-[700px] h-[700px]"
      animate={{ rotate: -360 }}
      transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 700 700" className="w-full h-full">
        <circle cx="350" cy="350" r="330" fill="none" stroke="#61afef" strokeWidth="2" strokeDasharray="4 12" opacity="0.2" />
        <circle cx="350" cy="350" r="310" fill="none" stroke="#61afef" strokeWidth="0.5" opacity="0.15" />
        {/* HUD arc segments */}
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <path key={i}
            d={`M ${350 + 300 * Math.cos(deg * Math.PI / 180)} ${350 + 300 * Math.sin(deg * Math.PI / 180)} A 300 300 0 0 1 ${350 + 300 * Math.cos((deg + 50) * Math.PI / 180)} ${350 + 300 * Math.sin((deg + 50) * Math.PI / 180)}`}
            fill="none" stroke="#61afef" strokeWidth="3" opacity="0.15" strokeLinecap="round" />
        ))}
      </svg>
    </motion.div>

    {/* Inner reactor ring — breathing */}
    <motion.div
      className="absolute w-[450px] h-[450px]"
      animate={{ rotate: 360, scale: [1, 1.03, 1] }}
      transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      style={{ willChange: 'transform' }}
    >
      <svg viewBox="0 0 450 450" className="w-full h-full">
        {/* Triangular HUD frame */}
        <polygon points="225,40 400,370 50,370" fill="none" stroke="#61afef" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.2" />
        <polygon points="225,80 370,340 80,340" fill="none" stroke="#61afef" strokeWidth="0.8" opacity="0.12" />
        {/* Inner ring */}
        <circle cx="225" cy="225" r="140" fill="none" stroke="#61afef" strokeWidth="2" opacity="0.2" />
        <circle cx="225" cy="225" r="120" fill="none" stroke="#61afef" strokeWidth="0.6" strokeDasharray="3 10" opacity="0.15" />
      </svg>
    </motion.div>

    {/* Core glow */}
    <motion.div
      className="absolute w-[200px] h-[200px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(97,175,239,0.12) 0%, rgba(97,175,239,0.04) 50%, transparent 70%)' }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[60px] h-[60px] rounded-full bg-[#61afef]/10"
      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ boxShadow: '0 0 60px rgba(97,175,239,0.3), 0 0 120px rgba(97,175,239,0.1)' }}
    />

    {/* Floating data points */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45) * Math.PI / 180;
      const r = 180 + (i % 3) * 40;
      return (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-[#61afef] rounded-full"
          style={{
            left: `calc(50% + ${r * Math.cos(angle)}px - 3px)`,
            top: `calc(50% + ${r * Math.sin(angle)}px - 3px)`,
            boxShadow: '0 0 8px rgba(97,175,239,0.6)',
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      );
    })}
  </div>
));
OneDarkBackground.displayName = 'OneDarkBackground';


/* ─── Cyberpunk: Nebula ─── */
const CyberpunkBackground = React.memo(() => {
  const stars = React.useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      x: ((i * 37 + 13) % 97),
      y: ((i * 53 + 7) % 93),
      size: 1 + (i % 3),
      delay: (i % 7) * 0.5,
      duration: 3 + (i % 4),
    })), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ transform: 'scale(1.5)', willChange: 'transform' }}>
      {/* Cyberpunk Nebula clouds */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] rounded-full top-[-20vw] left-[-15vw]"
        style={{ background: 'radial-gradient(ellipse, rgba(255,0,128,0.12) 0%, rgba(255,0,128,0.03) 40%, transparent 70%)' }}
        animate={{ x: [-30, 30, -30], y: [-20, 20, -20], scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[70vw] h-[70vw] rounded-full bottom-[-15vw] right-[-10vw]"
        style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.1) 0%, rgba(0,229,255,0.03) 40%, transparent 70%)' }}
        animate={{ x: [20, -20, 20], y: [15, -15, 15], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full top-[10vw] right-[20vw]"
        style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, transparent 60%)' }}
        animate={{ x: [-15, 15, -15], y: [-15, 15, -15] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cyberpunk Stars */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-300"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
            boxShadow: star.size > 2 ? '0 0 8px rgba(0,229,255,0.8)' : undefined,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: star.duration, repeat: Infinity, ease: 'easeInOut', delay: star.delay }}
        />
      ))}
      
      {/* Glitch Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,128,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
    </div>
  );
});
CyberpunkBackground.displayName = 'CyberpunkBackground';


/* ─── Midnight: Origami Fox Forest Glow ─── */
const MidnightBackground = React.memo(() => {
  // Generate floating warm embers
  const embers = React.useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => {
      const size = 3 + (i % 5) * 1.5;
      return {
        x: (i * 13) % 95,
        y: 85 + (i * 7) % 15,
        size,
        delay: (i % 6) * 0.5,
        duration: 6 + (i % 6)
      };
    }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45">
      {/* Ambient warm radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,125,26,0.1),transparent_65%)]" />

      {/* Center Geometric Fox face */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [0.96, 1.04, 0.96],
            rotate: [-1.5, 1.5, -1.5]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative text-[#ff7d1a]/20 w-[260px] h-[260px]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Left Ear */}
            <polygon points="20,30 35,10 40,40" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Right Ear */}
            <polygon points="80,30 65,10 60,40" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Center Head / Forehead */}
            <polygon points="50,45 35,30 65,30" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Left Face */}
            <polygon points="50,45 35,30 20,45" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Right Face */}
            <polygon points="50,45 65,30 80,45" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Left Cheek */}
            <polygon points="50,45 20,45 35,65" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Right Cheek */}
            <polygon points="50,45 80,45 65,65" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Snout */}
            <polygon points="50,85 35,65 50,45" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <polygon points="50,85 65,65 50,45" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            {/* Nose Tip */}
            <polygon points="50,85 47,80 53,80" fill="currentColor"/>
          </svg>
        </motion.div>
      </div>

      {/* Floating Embers */}
      {embers.map((ember, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full bg-gradient-to-t from-[#ff7d1a] to-[#ffaa66]"
          style={{ 
            left: `${ember.x}%`, 
            top: `${ember.y}%`,
            width: ember.size,
            height: ember.size,
            boxShadow: '0 0 8px #ff7d1a'
          }}
          animate={{ 
            y: [-20, -500],
            x: [0, Math.sin(i) * 30, 0],
            opacity: [0, 0.7, 0],
            scale: [1, 1.2, 0.8]
          }}
          transition={{ duration: ember.duration, repeat: Infinity, ease: 'easeOut', delay: ember.delay }}
        />
      ))}

      {/* Floating Constellation nodes (amber stars) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-[#ffe5d4] rounded-full"
          style={{
            left: `${10 + (i * 12) % 85}%`,
            top: `${15 + (i * 23) % 65}%`,
            boxShadow: '0 0 4px #ffe5d4'
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
});
MidnightBackground.displayName = 'MidnightBackground';


/* ─── Obsidian: Origami Wolf Forest Glow ─── */
const ObsidianBackground = React.memo(() => {
  // Generate floating warm purple embers
  const embers = React.useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => {
      const size = 3 + (i % 5) * 1.5;
      return {
        x: (i * 13) % 95,
        y: 85 + (i * 7) % 15,
        size,
        delay: (i % 6) * 0.5,
        duration: 6 + (i % 6)
      };
    }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-35">
      {/* Ambient purple radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.05),transparent_65%)]" />

      {/* Center Geometric Wolf face */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [0.96, 1.04, 0.96],
            rotate: [-1, 1, -1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative text-[#8b5cf6]/12 w-[280px] h-[280px]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="0.8">
            {/* Ears */}
            <polygon points="25,35 15,10 33,25" />
            <polygon points="75,35 85,10 67,25" />
            {/* Head Center / Forehead */}
            <polygon points="50,45 33,25 67,25" />
            <polygon points="50,45 33,25 25,35" />
            <polygon points="50,45 67,25 75,35" />
            {/* Eyes / Brow area */}
            <polygon points="50,45 25,35 30,55" />
            <polygon points="50,45 75,35 70,55" />
            <polygon points="50,45 30,55 50,60" />
            <polygon points="50,45 70,55 50,60" />
            {/* Snout */}
            <polygon points="50,60 30,55 42,80" />
            <polygon points="50,60 70,55 58,80" />
            <polygon points="50,60 42,80 50,85" />
            <polygon points="50,60 58,80 50,85" />
            {/* Cheeks */}
            <polygon points="30,55 25,35 15,50" />
            <polygon points="70,55 75,35 85,50" />
            <polygon points="30,55 15,50 42,80" />
            <polygon points="70,55 85,50 58,80" />
            {/* Nose Tip */}
            <polygon points="50,85 46,80 54,80" fill="currentColor" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Embers (Purple/Fuchsia) */}
      {embers.map((ember, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full bg-gradient-to-t from-[#8b5cf6]/80 to-[#a78bfa]/40"
          style={{ 
            left: `${ember.x}%`, 
            top: `${ember.y}%`,
            width: ember.size,
            height: ember.size,
            boxShadow: '0 0 6px rgba(139, 92, 246, 0.4)'
          }}
          animate={{ 
            y: [-20, -500],
            x: [0, Math.sin(i) * 30, 0],
            opacity: [0, 0.6, 0],
            scale: [1, 1.2, 0.8]
          }}
          transition={{ duration: ember.duration, repeat: Infinity, ease: 'easeOut', delay: ember.delay }}
        />
      ))}

      {/* Floating Constellation nodes (violet stars) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-[#e2e8f0] rounded-full"
          style={{
            left: `${10 + (i * 12) % 85}%`,
            top: `${15 + (i * 23) % 65}%`,
            boxShadow: '0 0 3px #e2e8f0'
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
});
ObsidianBackground.displayName = 'ObsidianBackground';


/* ─── Light: Origami Assassin Crest Glow ─── */
const LightBackground = React.memo(() => {
  // Generate floating warm golden embers
  const embers = React.useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => {
      const size = 3 + (i % 5) * 1.5;
      return {
        x: (i * 13) % 95,
        y: 85 + (i * 7) % 15,
        size,
        delay: (i % 6) * 0.5,
        duration: 6 + (i % 6)
      };
    }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-35">
      {/* Ambient golden radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(234,88,12,0.06),transparent_65%)]" />

      {/* Center Geometric Assassin logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [0.96, 1.04, 0.96],
            y: [-3, 3, -3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative text-[#ea580c]/15 w-[250px] h-[250px]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="1.2">
            {/* Outer Hood/crest shape */}
            <path d="M 50,15 C 38,40 22,65 15,85 C 30,80 43,62 50,42 C 57,62 70,80 85,85 C 78,65 62,40 50,15 Z" />
            {/* Bottom base lines/crescent */}
            <path d="M 32,80 C 43,84 57,84 68,80 C 60,70 50,68 50,68 C 50,68 40,70 32,80 Z" fill="currentColor" opacity="0.3" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Golden Embers */}
      {embers.map((ember, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full bg-gradient-to-t from-[#ea580c] to-[#f97316]"
          style={{ 
            left: `${ember.x}%`, 
            top: `${ember.y}%`,
            width: ember.size,
            height: ember.size,
            boxShadow: '0 0 6px rgba(234, 88, 12, 0.4)'
          }}
          animate={{ 
            y: [-20, -500],
            x: [0, Math.sin(i) * 30, 0],
            opacity: [0, 0.6, 0],
            scale: [1, 1.2, 0.8]
          }}
          transition={{ duration: ember.duration, repeat: Infinity, ease: 'easeOut', delay: ember.delay }}
        />
      ))}

      {/* Floating Stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-[#ea580c]/50 rounded-full"
          style={{
            left: `${10 + (i * 12) % 85}%`,
            top: `${15 + (i * 23) % 65}%`,
            boxShadow: '0 0 3px rgba(234, 88, 12, 0.3)'
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
});
LightBackground.displayName = 'LightBackground';


/* ─── Main Wrapper ─── */
export const ThemeAmbientBackground: React.FC<ThemeAmbientBackgroundProps> = React.memo(({ theme }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}>
      {theme === 'onedark' && <OneDarkBackground />}
      {theme === 'cyberpunk' && <CyberpunkBackground />}
      {theme === 'midnight' && <MidnightBackground />}
      {theme === 'obsidian' && <ObsidianBackground />}
      {theme === 'light' && <LightBackground />}
    </div>
  );
});
ThemeAmbientBackground.displayName = 'ThemeAmbientBackground';
