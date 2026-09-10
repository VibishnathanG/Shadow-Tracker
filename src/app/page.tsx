'use client';
/* eslint-disable react-hooks/purity */

import React, { useState, useEffect } from 'react';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import Layout from '@/components/Layout';
import Onboarding from '@/features/onboarding/Onboarding';
import { MotionConfig } from 'framer-motion';

import Dashboard from '@/features/dashboard/Dashboard';
import ExplorerFeature from '@/features/explorer/ExplorerFeature';
import TasksFeature from '@/features/tasks/TasksFeature';
import HabitsFeature from '@/features/habits/HabitsFeature';
import CalendarFeature from '@/features/calendar/CalendarFeature';
import AnalyticsFeature from '@/features/analytics/AnalyticsFeature';
import NotesFeature from '@/features/notes/NotesFeature';
import MoneyFeature from '@/features/money/MoneyFeature';
import SettingsFeature from '@/features/settings/SettingsFeature';
import TodoFeature from '@/features/todo/TodoFeature';
import HealthFeature from '@/features/health/HealthFeature';
import LifeRpgFeature from '@/features/rpg/LifeRpgFeature';
import WizardFeature from '@/features/wizard/WizardFeature';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useViewPreference } from '@/lib/viewPreferences';

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
