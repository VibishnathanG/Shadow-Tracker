'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lucide } from './icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { playNotificationChime } from '@/lib/nativeNotification';

export interface ActiveBannerAlert {
  id: string;
  title: string;
  body: string;
  taskId?: string;
  habitId?: string;
  timestamp: string;
  sticky?: boolean;
}

export const InAppNotificationOverlay: React.FC = () => {
  const [alerts, setAlerts] = useState<ActiveBannerAlert[]>([]);
  const { toggleTaskCompletion, toggleHabitCompletion, settings } = useShadowTrackerStore();
  const todayStr = getTodayDateString();

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveBannerAlert>;
      const detail = customEvent.detail;
      if (!detail) return;

      setAlerts((prev) => [detail, ...prev]);

      if (settings.soundEnabled) {
        playNotificationChime();
      }

      // Non-sticky notifications auto-dismiss after 10 seconds
      // Sticky notifications stay until user clicks YES or NO
      if (!detail.sticky) {
        setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== detail.id));
        }, 10000);
      }
    };

    window.addEventListener('shadow-notification', handleNotification);
    return () => window.removeEventListener('shadow-notification', handleNotification);
  }, [settings.soundEnabled]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleAction = useCallback((alert: ActiveBannerAlert) => {
    if (alert.taskId) {
      toggleTaskCompletion(alert.taskId);
    } else if (alert.habitId) {
      toggleHabitCompletion(alert.habitId, todayStr);
    }
    dismissAlert(alert.id);
  }, [toggleTaskCompletion, toggleHabitCompletion, todayStr, dismissAlert]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-md px-4 pointer-events-none space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto w-full bg-slate-900/95 text-white border-2 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3 relative overflow-hidden transition-all duration-200 ${
            alert.sticky
              ? 'border-amber-500/80 ring-2 ring-amber-500/30'
              : 'border-primary/60'
          }`}
          style={alert.sticky ? { animation: 'notification-pulse 2s ease-in-out infinite' } : undefined}
        >
          {/* Top ambient glow line */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            alert.sticky
              ? 'bg-gradient-to-r from-amber-500 via-red-500 to-amber-500'
              : 'bg-gradient-to-r from-primary via-purple-500 to-amber-500'
          }`} />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shadow-md shrink-0 mt-0.5 ${
                alert.sticky
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {alert.habitId ? <Lucide.Repeat size={18} /> : <Lucide.BellRing size={18} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    alert.sticky
                      ? 'text-amber-300 bg-amber-500/20'
                      : 'text-primary bg-primary/20'
                  }`}>
                    {alert.sticky ? '📌 ACTION REQUIRED' : 'REMINDER ALERT'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{alert.timestamp}</span>
                </div>
                <h4 className="text-sm font-extrabold text-white tracking-tight mt-1 truncate">
                  {alert.title}
                </h4>
                <p className="text-xs font-semibold text-slate-300 leading-relaxed mt-0.5 line-clamp-2">
                  {alert.body}
                </p>
              </div>
            </div>

            {/* Only show X button for non-sticky alerts */}
            {!alert.sticky && (
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <Lucide.X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => dismissAlert(alert.id)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Lucide.X size={14} /> NO (Dismiss)
            </button>
            <button
              onClick={() => handleAction(alert)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Lucide.CheckCircle size={14} /> YES (Complete)
            </button>
          </div>
        </div>
      ))}

      {/* Inline CSS animation for sticky pulse — avoids adding to globals.css */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes notification-pulse {
          0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px 4px rgba(245,158,11,0.15); }
        }
      `}} />
    </div>
  );
};
