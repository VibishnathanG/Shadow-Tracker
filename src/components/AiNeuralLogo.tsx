'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AiNeuralLogoProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

export const AiNeuralLogo: React.FC<AiNeuralLogoProps> = ({
  size = 32,
  className = '',
  isAnimated = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title="Shadow AI Copilot"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_var(--primary)]"
      >
        <defs>
          {/* Luminous Orbital Gradient */}
          <linearGradient id="aiOrbitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.95" />
          </linearGradient>

          {/* Central Neural Chip Glow */}
          <radialGradient id="aiChipCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="65%" stopColor="var(--primary)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Lettering Gradient - Glowing High Tech */}
          <linearGradient id="aiLetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>

          {/* White Theme High-Contrast Lettering Gradient */}
          <linearGradient id="aiLetterGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* 1. Outer Rotating Quantum Ring */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#aiOrbitalGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="40 28"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#aiOrbitalGrad)"
            strokeWidth="2"
            strokeDasharray="40 28"
          />
        )}

        {/* 2. Counter-Rotating Inner Circuit Ring */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeDasharray="18 14"
            opacity="0.6"
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeDasharray="18 14"
            opacity="0.6"
          />
        )}

        {/* 3. Cardinal Synaptic Node Dots */}
        <circle cx="50" cy="6" r="2.8" fill="var(--primary)" className="[html[data-theme='white']_&]:fill-blue-600" />
        <circle cx="50" cy="94" r="2.8" fill="var(--primary)" className="[html[data-theme='white']_&]:fill-blue-600" />
        <circle cx="6" cy="50" r="2.8" fill="#a855f7" />
        <circle cx="94" cy="50" r="2.8" fill="#06b6d4" />

        {/* 4. Central Cybernetic Core Chip */}
        <rect
          x="19"
          y="20"
          width="62"
          height="60"
          rx="16"
          fill="url(#aiChipCoreGlow)"
          stroke="var(--primary)"
          strokeWidth="1.6"
          className="[html[data-theme='white']_&]:stroke-blue-600 [html[data-theme='white']_&]:fill-blue-50/80"
        />

        {/* Micro Chip Corner Pins */}
        <line x1="28" y1="20" x2="28" y2="15" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />
        <line x1="72" y1="20" x2="72" y2="15" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />
        <line x1="28" y1="80" x2="28" y2="85" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />
        <line x1="72" y1="80" x2="72" y2="85" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />

        {/* 5. Breathing Core Aura */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="20"
            fill="var(--primary)"
            opacity="0.12"
            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle cx="50" cy="50" r="20" fill="var(--primary)" opacity="0.12" />
        )}

        {/* 6. HIGH-TECH BOLD "AI" GLYPH (Vector-Crafted for Universal Crispness) */}
        <g className="[html[data-theme='white']_&]:hidden">
          {/* LETTER "A" */}
          <path
            d="M 39 33 L 47 33 L 57 67 L 49.5 67 L 46.5 57 L 35 57 L 32 67 L 25 67 Z M 44 48 L 41 38 L 37.5 48 Z"
            fill="url(#aiLetterGrad)"
            stroke="var(--primary)"
            strokeWidth="0.8"
            filter="drop-shadow(0 0 3px var(--primary))"
          />

          {/* LETTER "I" */}
          <rect
            x="62"
            y="33"
            width="9"
            height="34"
            rx="2.5"
            fill="url(#aiLetterGrad)"
            stroke="var(--primary)"
            strokeWidth="0.8"
            filter="drop-shadow(0 0 3px var(--primary))"
          />

          {/* Synaptic Bridge Line linking 'A' and 'I' */}
          <line
            x1="46"
            y1="57"
            x2="62"
            y2="57"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Top Neural Spark Node over 'I' */}
          <circle cx="66.5" cy="27" r="2.2" fill="#ffffff" filter="drop-shadow(0 0 4px #38bdf8)" />
        </g>

        {/* 7. HIGH-CONTRAST "AI" GLYPH FOR LIGHT / WHITE THEME */}
        <g className="hidden [html[data-theme='white']_&]:inline">
          {/* LETTER "A" */}
          <path
            d="M 39 33 L 47 33 L 57 67 L 49.5 67 L 46.5 57 L 35 57 L 32 67 L 25 67 Z M 44 48 L 41 38 L 37.5 48 Z"
            fill="url(#aiLetterGradLight)"
            stroke="#1e293b"
            strokeWidth="0.5"
          />

          {/* LETTER "I" */}
          <rect
            x="62"
            y="33"
            width="9"
            height="34"
            rx="2.5"
            fill="url(#aiLetterGradLight)"
            stroke="#1e293b"
            strokeWidth="0.5"
          />

          {/* Synaptic Bridge Line linking 'A' and 'I' */}
          <line
            x1="46"
            y1="57"
            x2="62"
            y2="57"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Top Neural Spark Node over 'I' */}
          <circle cx="66.5" cy="27" r="2.2" fill="#2563eb" />
        </g>
      </svg>
    </div>
  );
};
