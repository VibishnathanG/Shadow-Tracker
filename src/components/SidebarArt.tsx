'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useShadowTrackerStore } from '@/store';

export const SidebarArt: React.FC = React.memo(() => {
  const { settings } = useShadowTrackerStore();
  const theme = settings.theme || 'obsidian';

  if (settings.disableGpuAcceleration) {
    return null;
  }

  if (theme === 'obsidian') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.25] mix-blend-screen">
        <svg viewBox="0 0 200 600" className="w-full h-full text-[#ff4770]/80 animate-pulse-scale-subtle">
          {/* Geometric lines radiating out from a central Wolf emblem */}
          <circle cx="100" cy="300" r="130" stroke="currentColor" strokeWidth="0.3" fill="none" strokeDasharray="2 8" />
          <circle cx="100" cy="300" r="75" stroke="currentColor" strokeWidth="0.4" fill="none" strokeDasharray="6 12" />
          
          {/* Stylized Wolf silhouette in Sidebar */}
          <g transform="translate(68, 268) scale(0.65)">
            <polygon points="25,35 15,10 33,25" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="75,35 85,10 67,25" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 33,25 67,25" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 33,25 25,35" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 67,25 75,35" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 25,35 30,55" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 75,35 70,55" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 30,55 50,60" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,45 70,55 50,60" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,60 30,55 42,80" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,60 70,55 58,80" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,60 42,80 50,85" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,60 58,80 50,85" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="30,55 25,35 15,50" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="70,55 75,35 85,50" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="30,55 15,50 42,80" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="70,55 85,50 58,80" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,85 46,80 54,80" fill="currentColor" />
          </g>

          <line x1="100" y1="0" x2="100" y2="600" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 8" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (theme === 'cyberpunk') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {/* Scanline grid */}
        <div
          className="absolute inset-0 animate-pan-y-scanline"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.08) 0px, transparent 1px, transparent 30px)',
          }}
        />
        <svg viewBox="0 0 200 600" className="absolute inset-0 w-full h-full text-cyan-400/40">
          <line x1="0" y1="0" x2="200" y2="600" stroke="currentColor" strokeWidth="0.3" />
          <line x1="200" y1="0" x2="0" y2="600" stroke="currentColor" strokeWidth="0.3" />
          <rect x="40" y="200" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
        </svg>
      </div>
    );
  }

  if (theme === 'midnight') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.25] mix-blend-screen">
        <svg viewBox="0 0 200 600" className="w-full h-full text-emerald-400/80 animate-pulse-scale-subtle">
          {/* Geometric lines radiating out from a central fox emblem */}
          <circle cx="100" cy="300" r="120" stroke="currentColor" strokeWidth="0.3" fill="none" strokeDasharray="2 8" />
          <circle cx="100" cy="300" r="70" stroke="currentColor" strokeWidth="0.4" fill="none" strokeDasharray="6 12" />
          
          {/* Stylized Fox Head silhouette in Sidebar */}
          <g transform="translate(75, 275) scale(0.5)">
            <polygon points="20,30 35,10 40,40" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="80,30 65,10 60,40" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,45 35,30 65,30" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,45 35,30 20,45" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,45 65,30 80,45" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,45 20,45 35,65" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,45 80,45 65,65" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,85 35,65 50,45" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,85 65,65 50,45" fill="none" stroke="currentColor" strokeWidth="1"/>
            <polygon points="50,85 47,80 53,80" fill="currentColor"/>
          </g>

          <line x1="100" y1="0" x2="100" y2="600" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 8" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (theme === 'onedark') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.22] mix-blend-screen">
        <svg viewBox="0 0 200 600" className="w-full h-full text-[#5299d3]/80 animate-pulse-scale-subtle">
          {/* Geometric lines radiating out from a central eagle emblem */}
          <circle cx="100" cy="300" r="130" stroke="currentColor" strokeWidth="0.3" fill="none" strokeDasharray="2 8" />
          <circle cx="100" cy="300" r="80" stroke="currentColor" strokeWidth="0.4" fill="none" strokeDasharray="6 12" />
          
          {/* Stylized Eagle silhouette in Sidebar */}
          <g transform="translate(68, 268) scale(0.65)">
            <polygon points="50,20 45,30 55,30" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,38 45,30 55,30" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="45,30 40,25 50,20" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="55,30 60,25 50,20" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,38 47,45 53,45" fill="currentColor" />
            <polygon points="45,30 20,25 35,45" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="35,45 10,35 25,60" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="20,70 15,80 35,65" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="55,30 80,25 65,45" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="65,45 90,35 75,60" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="80,70 85,80 65,65" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,38 35,45 50,65" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,38 65,45 50,65" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,65 35,65 50,85" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,65 65,65 50,85" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50,85 45,95 55,95" fill="none" stroke="currentColor" strokeWidth="1" />
          </g>

          <line x1="100" y1="0" x2="100" y2="600" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 8" opacity="0.3" />
        </svg>
      </div>
    );
  }

  // Light theme
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
      <svg viewBox="0 0 200 600" className="w-full h-full text-[#ea580c]/60 animate-pulse-scale-subtle">
        {/* Geometric radiating framing */}
        <circle cx="100" cy="300" r="130" stroke="currentColor" strokeWidth="0.3" fill="none" strokeDasharray="2 8" />
        <circle cx="100" cy="300" r="75" stroke="currentColor" strokeWidth="0.4" fill="none" strokeDasharray="6 12" />
        
        {/* Stylized Assassin symbol in Sidebar */}
        <g transform="translate(68, 268) scale(0.65)">
          <path d="M 50,15 C 38,40 22,65 15,85 C 30,80 43,62 50,42 C 57,62 70,80 85,85 C 78,65 62,40 50,15 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 32,80 C 43,84 57,84 68,80 C 60,70 50,68 50,68 C 50,68 40,70 32,80 Z" fill="currentColor" />
        </g>

        <line x1="100" y1="0" x2="100" y2="600" stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 8" opacity="0.3" />
      </svg>
    </div>
  );
});

SidebarArt.displayName = 'SidebarArt';
