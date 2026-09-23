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
          {/* Futuristic Gradient for Outer Halo */}
          <linearGradient id="aiOrbitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
          </linearGradient>

          {/* Core Synapse Glow */}
          <radialGradient id="aiCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>

          {/* Hexagon Shield Pattern */}
          <linearGradient id="aiHexGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* 1. Ambient Background Hex Shield */}
        <polygon
          points="50,10 85,28 85,72 50,90 15,72 15,28"
          fill="url(#aiHexGrad)"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.65"
        />

        {/* 2. Outer Counter-Rotating Gyroscope Ring */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="url(#aiOrbitalGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="45 25"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="url(#aiOrbitalGrad)"
            strokeWidth="2.2"
            strokeDasharray="45 25"
          />
        )}

        {/* 3. Inner Reverse Orbit Ring */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.8"
            strokeDasharray="25 15"
            opacity="0.75"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.8"
            strokeDasharray="25 15"
            opacity="0.75"
          />
        )}

        {/* 4. Synaptic Neural Rays (Connecting center core to nodes) */}
        <line x1="50" y1="50" x2="50" y2="22" stroke="var(--primary)" strokeWidth="1.5" opacity="0.7" />
        <line x1="50" y1="50" x2="74" y2="64" stroke="var(--primary)" strokeWidth="1.5" opacity="0.7" />
        <line x1="50" y1="50" x2="26" y2="64" stroke="var(--primary)" strokeWidth="1.5" opacity="0.7" />

        {/* 5. Orbital Quantum Nodes */}
        <circle cx="50" cy="22" r="3.5" fill="#38bdf8" />
        <circle cx="74" cy="64" r="3.5" fill="#c084fc" />
        <circle cx="26" cy="64" r="3.5" fill="#34d399" />

        {/* 6. Central Neural Singularity Core (Glowing & Breathing) */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="12"
            fill="url(#aiCoreGlow)"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '50px 50px' }}
          />
        ) : (
          <circle cx="50" cy="50" r="12" fill="url(#aiCoreGlow)" />
        )}

        {/* 7. Center Diamond Spark */}
        <path
          d="M 50 43 L 53 50 L 50 57 L 47 50 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
};
