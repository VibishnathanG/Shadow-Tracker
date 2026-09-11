'use client';
/* eslint-disable react-hooks/purity */

import React, { useState, useEffect } from 'react';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import Layout from '@/components/Layout';
import Onboarding from '@/features/onboarding/Onboarding';
import { MotionConfig } from 'framer-motion';

import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useViewPreference } from '@/lib/viewPreferences';

const PageFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">Loading Workspace...</span>
  </div>
);

const Dashboard = dynamic(() => import('@/features/dashboard/Dashboard'), { ssr: false, loading: PageFallback });
const ExplorerFeature = dynamic(() => import('@/features/explorer/ExplorerFeature'), { ssr: false, loading: PageFallback });
const TasksFeature = dynamic(() => import('@/features/tasks/TasksFeature'), { ssr: false, loading: PageFallback });
const HabitsFeature = dynamic(() => import('@/features/habits/HabitsFeature'), { ssr: false, loading: PageFallback });
const CalendarFeature = dynamic(() => import('@/features/calendar/CalendarFeature'), { ssr: false, loading: PageFallback });
const AnalyticsFeature = dynamic(() => import('@/features/analytics/AnalyticsFeature'), { ssr: false, loading: PageFallback });
const NotesFeature = dynamic(() => import('@/features/notes/NotesFeature'), { ssr: false, loading: PageFallback });
const MoneyFeature = dynamic(() => import('@/features/money/MoneyFeature'), { ssr: false, loading: PageFallback });
const SettingsFeature = dynamic(() => import('@/features/settings/SettingsFeature'), { ssr: false, loading: PageFallback });
const TodoFeature = dynamic(() => import('@/features/todo/TodoFeature'), { ssr: false, loading: PageFallback });
const HealthFeature = dynamic(() => import('@/features/health/HealthFeature'), { ssr: false, loading: PageFallback });
const LifeRpgFeature = dynamic(() => import('@/features/rpg/LifeRpgFeature'), { ssr: false, loading: PageFallback });
const WizardFeature = dynamic(() => import('@/features/wizard/WizardFeature'), { ssr: false, loading: PageFallback });

export default function Home() {
  const { settings, init, isLoading } = useShadowTrackerStore();
  const [activeTab, setActiveTab] = useViewPreference('lastActivePage') as [string, (v: string) => void];
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mount/initialize
  useEffect(() => {
    setMounted(true);
    setSelectedDate(getTodayDateString());
    init();

    // Debounced mobile check
    let resizeTimer: ReturnType<typeof setTimeout>;
    const checkMobile = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => setIsMobile(window.innerWidth < 640), 150);
    };
    setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, [init]);

  // Server-side / Hydration pass
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#030603] text-foreground flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030603] text-foreground flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
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
      case 'explorer':
        return <ExplorerFeature />;
      case 'tasks':
        return <TasksFeature />;
      case 'todo':
        return <TodoFeature />;
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
      case 'health':
        return <HealthFeature />;
      case 'wizard':
        return <WizardFeature />;
      case 'rpg':
        return <LifeRpgFeature />;
      case 'settings':
        return <SettingsFeature />;
      default:
        return <Dashboard onNavigate={setActiveTab} setSelectedDate={setSelectedDate} />;
    }
  };

  const isEcoOrLowGpu = Boolean(settings.lowGpuMode || settings.ecoMode);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={isEcoOrLowGpu || isMobile ? 'always' : 'never'}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderActiveFeature()}
        </Layout>
      </MotionConfig>
    </ErrorBoundary>
  );
}
