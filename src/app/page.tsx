'use client';
/* eslint-disable react-hooks/purity */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import Layout from '@/components/Layout';
import Onboarding from '@/features/onboarding/Onboarding';
import { motion } from 'framer-motion';

const GlobalThemeBackground = ({ theme }: { theme: string }) => {
  const cyberpunkNodes = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    yTarget: Math.random() * 100 - 50,
    xTarget: Math.random() * 100 - 50,
    duration: Math.random() * 8 + 5
  })), []);

  const onedarkEmbers = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    size: Math.random() * 5 + 2 + 'px',
    left: Math.random() * 100 + '%',
    xTarget: Math.random() * 200 - 100,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 5
  })), []);

  const defaultDust = useMemo(() => [...Array(40)].map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1 + 'px',
    left: Math.random() * 100 + '%',
    xTarget: Math.random() * 100 - 50,
    xTarget2: Math.random() * 200 - 100,
    opacityTarget: Math.random() * 0.5 + 0.2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 10
  })), []);

  if (theme === 'cyberpunk') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030603]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,100,0.08)_0%,transparent_60%)]" />
        
        {/* Alien Geometric Structure */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-[0.15]">
          <motion.svg viewBox="0 0 200 200" className="w-full h-full absolute z-10" animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
            <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#22c55e" strokeWidth="0.5" />
            <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="#4ade80" strokeWidth="0.5" transform="rotate(30 100 100)" />
            <polygon points="100,30 150,65 150,135 100,170 50,135 50,65" fill="none" stroke="#86efac" strokeWidth="1" transform="rotate(60 100 100)" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#16a34a" strokeWidth="0.2" strokeDasharray="5 5" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="1 10" />
            {/* Connecting Neural Lines */}
            <line x1="100" y1="10" x2="100" y2="190" stroke="#4ade80" strokeWidth="0.2" opacity="0.5" />
            <line x1="10" y1="55" x2="190" y2="145" stroke="#4ade80" strokeWidth="0.2" opacity="0.5" />
            <line x1="190" y1="55" x2="10" y2="145" stroke="#4ade80" strokeWidth="0.2" opacity="0.5" />
          </motion.svg>
          <motion.svg viewBox="0 0 200 200" className="w-full h-full absolute z-20" animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
             <circle cx="100" cy="100" r="25" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="4 8" />
             <polygon points="100,60 134,120 66,120" fill="none" stroke="#4ade80" strokeWidth="1" />
          </motion.svg>
        </div>

        {/* Floating Data Nodes */}
        <div className="absolute inset-0 opacity-[0.4]">
          {cyberpunkNodes.map((node) => (
             <motion.div key={node.id} className="absolute w-1 h-1 bg-green-400 rounded-full shadow-[0_0_10px_3px_rgba(74,222,128,0.8)]" style={{ left: node.left, top: node.top }} animate={{ y: [0, node.yTarget, 0], x: [0, node.xTarget, 0], opacity: [0, 1, 0] }} transition={{ duration: node.duration, repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </div>
      </div>
    );
  }

  if (theme === 'midnight') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0d0a09]">
        {/* Warm Orange Fox Aura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,125,26,0.08)_0%,transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.12]">
          {/* Outer Dial */}
          <motion.svg viewBox="0 0 200 200" className="w-[800px] h-[800px] absolute z-10" animate={{ rotate: 360 }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}>
            <circle cx="100" cy="100" r="90" fill="none" stroke="#ffaa66" strokeWidth="12" strokeDasharray="60 30" opacity="0.8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#ff7d1a" strokeWidth="2" />
            <polygon points="100,20 180,180 20,180" fill="none" stroke="#ffaa66" strokeWidth="4" opacity="0.6" />
            <polygon points="100,180 20,20 180,20" fill="none" stroke="#ffaa66" strokeWidth="4" opacity="0.6" />
            <circle cx="100" cy="100" r="45" fill="none" stroke="#e65c00" strokeWidth="15" strokeDasharray="30 10" opacity="0.9" />
            <circle cx="100" cy="100" r="30" fill="#ffaa66" opacity="0.3" />
          </motion.svg>
          {/* Inner Counter Rotating core */}
          <motion.svg viewBox="0 0 200 200" className="w-[800px] h-[800px] absolute z-20" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
            <circle cx="100" cy="100" r="70" fill="none" stroke="#ffeada" strokeWidth="3" strokeDasharray="10 15" opacity="0.8" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="#ffeada" strokeWidth="4" />
          </motion.svg>
        </div>
      </div>
    );
  }

  if (theme === 'onedark') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0a0a0f]">
        {/* Soft Slate Blue Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(82,153,211,0.08)_0%,transparent_50%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] flex items-center justify-center opacity-[0.15]">
          {/* Dimmed plasma layers */}
          <motion.div className="absolute w-[400px] h-[400px] rounded-full bg-[#5299d3]/20 blur-[80px]" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          
          <motion.svg viewBox="0 0 200 200" className="w-[500px] h-[500px] absolute z-10" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            <circle cx="100" cy="100" r="95" fill="none" stroke="#5299d3" strokeWidth="2" strokeDasharray="4 8" opacity="0.5" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="#5b9cd6" strokeWidth="6" strokeDasharray="30 15" opacity="0.5" />
            {[...Array(12)].map((_, i) => (
              <line key={i} x1="100" y1="25" x2="100" y2="40" stroke="#8ac8ff" strokeWidth="2" transform={`rotate(${i * 30} 100 100)`} opacity="0.5" />
            ))}
            <circle cx="100" cy="100" r="45" fill="none" stroke="#8ac8ff" strokeWidth="3" opacity="0.6" />
          </motion.svg>
          
          <motion.svg viewBox="0 0 200 200" className="w-[500px] h-[500px] absolute z-20" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
             <circle cx="100" cy="100" r="30" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 8" opacity="0.6" />
          </motion.svg>
          <motion.div className="absolute w-12 h-12 bg-white/30 rounded-full blur-[10px] z-30" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        
        {/* High Quality Ascending Embers (Slate Blue) */}
        {onedarkEmbers.map((node) => (
          <motion.div key={node.id} className="absolute rounded-full bg-[#8ac8ff] mix-blend-screen" style={{ width: node.size, height: node.size, left: node.left, top: '100%', filter: 'blur(1px)' }} animate={{ y: [0, -1200], x: [0, node.xTarget], opacity: [0, 0.8, 0] }} transition={{ duration: node.duration, repeat: Infinity, delay: node.delay }} />
        ))}
      </div>
    );
  }

  if (theme === 'light') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-zinc-50">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-orange-100/30 to-amber-100/30 blur-[100px]" animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }} transition={{ duration: 25, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-amber-100/30 to-yellow-100/20 blur-[100px]" animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }} transition={{ duration: 20, repeat: Infinity }} />
      </div>
    );
  }

  // Default / Obsidian - Volcanic Obsidian Purple Magic Circle
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#08070a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)]" />
      
      {/* Clean Minimal Magical Dust */}
      <div className="absolute inset-0">
        {defaultDust.map((node) => (
          <motion.div 
            key={node.id} 
            className="absolute rounded-full bg-purple-400 mix-blend-screen"
            style={{ 
              width: node.size, 
              height: node.size, 
              left: node.left, 
              top: '110%',
              filter: 'blur(0.5px)'
            }} 
            animate={{ 
              y: [0, -1000], 
              x: [0, node.xTarget, node.xTarget2],
              opacity: [0, node.opacityTarget, 0] 
            }} 
            transition={{ 
              duration: node.duration, 
              repeat: Infinity, 
              delay: node.delay,
              ease: 'linear'
            }} 
          />
        ))}
      </div>

      <motion.svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] text-purple-500 opacity-[0.15]" viewBox="0 0 200 200" animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}>
        {/* Runes & Magic circles */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="20 5 5 5" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Double inscribed squares */}
        <rect x="50.5" y="50.5" width="99" height="99" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 100 100)" />
        <rect x="50.5" y="50.5" width="99" height="99" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Inner Eye of Agamotto shape */}
        <path d="M 60 100 Q 100 70 140 100 Q 100 130 60 100" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="12" fill="currentColor" opacity="0.4" />
      </motion.svg>
      <motion.svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] text-fuchsia-400 opacity-[0.1]" viewBox="0 0 200 200" animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="2 20" />
      </motion.svg>
    </div>
  );
};

import Dashboard from '@/features/dashboard/Dashboard';
import TasksFeature from '@/features/tasks/TasksFeature';
import HabitsFeature from '@/features/habits/HabitsFeature';
import CalendarFeature from '@/features/calendar/CalendarFeature';
import AnalyticsFeature from '@/features/analytics/AnalyticsFeature';
import NotesFeature from '@/features/notes/NotesFeature';
import MoneyFeature from '@/features/money/MoneyFeature';
import SettingsFeature from '@/features/settings/SettingsFeature';

import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
  const { settings, init, isLoading } = useShadowTrackerStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Mount/initialize
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDate(getTodayDateString());
    init();
  }, [init]);

  // Server-side / Hydration pass matches exactly
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-bold mt-4 animate-pulse">
          Accessing Shadow Space...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase font-bold mt-4 animate-pulse">
          Accessing Shadow Tracker...
        </p>
      </div>
    );
  }

  // Render onboarding blocker if not completed
  if (!settings.isCompletedOnboarding) {
    return (
      <ErrorBoundary>
        <Onboarding />
      </ErrorBoundary>
    );
  }

  const renderActiveFeature = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} setSelectedDate={setSelectedDate} />;
      case 'tasks':
        return <TasksFeature />;
      case 'habits':
        return <HabitsFeature />;
      case 'calendar':
        return <CalendarFeature selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case 'analytics':
        return <AnalyticsFeature />;
      case 'notes':
        return <NotesFeature />;
      case 'money':
        return <MoneyFeature />;
      case 'settings':
        return <SettingsFeature />;
      default:
        return <Dashboard onNavigate={setActiveTab} setSelectedDate={setSelectedDate} />;
    }
  };

  return (
    <ErrorBoundary>
      <GlobalThemeBackground theme={settings.theme} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderActiveFeature()}
      </Layout>
    </ErrorBoundary>
  );
}
