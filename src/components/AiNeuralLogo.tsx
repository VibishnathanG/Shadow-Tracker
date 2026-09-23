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
        className="w-full h-full drop-shadow-[0_0_10px_var(--primary)]"
      >
        <defs>
          <linearGradient id="aiRevolveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="aiBgCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* 1. Clean Circular Logo Container Background */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="url(#aiBgCore)"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.5"
          className="[html[data-theme='white']_&]:fill-blue-50/70 [html[data-theme='white']_&]:stroke-blue-500/50"
        />

        {/* 2. Static Background Guide Track */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.25"
          className="[html[data-theme='white']_&]:stroke-blue-400"
        />

        {/* 3. Smooth Circle Animation Revolving Around "AI" Wordings */}
        {isAnimated ? (
          <motion.circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="url(#aiRevolveGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="55 180"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
            className="[html[data-theme='white']_&]:stroke-blue-600"
          />
        ) : (
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="45 180"
            className="[html[data-theme='white']_&]:stroke-blue-600"
          />
        )}

        {/* 4. Revolving Orbit Particle (Orbital Electron around the AI Text) */}
        {isAnimated && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          >
            <circle
              cx="50"
              cy="14"
              r="3.5"
              fill="var(--primary)"
              className="[html[data-theme='white']_&]:fill-blue-600"
            />
            <circle
              cx="50"
              cy="14"
              r="1.5"
              fill="#ffffff"
            />
          </motion.g>
        )}

        {/* 5. Crystal Clear, Bold "AI" Wording at Exact Center */}
        {/* Dark / Neon Themes */}
        <text
          x="50"
          y="54"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="34"
          letterSpacing="1.5"
          fill="#ffffff"
          className="[html[data-theme='white']_&]:hidden"
        >
          AI
        </text>

        {/* Light / White Theme (High Contrast Dark Slate) */}
        <text
          x="50"
          y="54"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="34"
          letterSpacing="1.5"
          fill="#0f172a"
          className="hidden [html[data-theme='white']_&]:inline"
        >
          AI
        </text>
      </svg>
    </div>
  );
};
