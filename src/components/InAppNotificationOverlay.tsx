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
  const isWhiteTheme = settings.theme === 'white' || settings.theme === 'light';

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
          className={`pointer-events-auto w-full border-2 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3 relative overflow-hidden transition-all duration-200 ${
            isWhiteTheme
              ? alert.sticky
                ? 'bg-white [html[data-theme=\'white\']_&]:bg-white text-slate-900 [html[data-theme=\'white\']_&]:text-slate-900 border-amber-500 ring-2 ring-amber-400/40 shadow-xl'
                : 'bg-white [html[data-theme=\'white\']_&]:bg-white text-slate-900 [html[data-theme=\'white\']_&]:text-slate-900 border-slate-300 [html[data-theme=\'white\']_&]:border-slate-300 shadow-xl'
              : alert.sticky
                ? 'bg-slate-900/95 text-white border-amber-500/80 ring-2 ring-amber-500/30'
                : 'bg-slate-900/95 text-white border-primary/60'
          }`}
          style={alert.sticky ? { animation: 'notification-pulse 2s ease-in-out infinite' } : undefined}
        >
          {/* Top ambient glow line */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            alert.sticky
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500'
              : 'bg-gradient-to-r from-primary via-purple-500 to-amber-500'
          }`} />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shadow-md shrink-0 mt-0.5 ${
                isWhiteTheme
                  ? alert.sticky
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-indigo-600 text-white font-black'
                  : alert.sticky
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-primary text-primary-foreground'
              }`}>
                {alert.habitId ? <Lucide.Repeat size={18} /> : <Lucide.BellRing size={18} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isWhiteTheme
                      ? alert.sticky
                        ? 'text-amber-900 bg-amber-100 border border-amber-300'
                        : 'text-indigo-900 bg-indigo-100 border border-indigo-200'
                      : alert.sticky
                        ? 'text-amber-300 bg-amber-500/20'
                        : 'text-primary bg-primary/20'
                  }`}>
                    {alert.sticky ? '📌 ACTION REQUIRED' : 'REMINDER ALERT'}
                  </span>
                  <span className={`text-[10px] font-bold ${isWhiteTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {alert.timestamp}
                  </span>
                </div>
                <h4 className={`text-sm font-black tracking-tight mt-1 truncate ${
                  isWhiteTheme ? 'text-slate-950 [html[data-theme=\'white\']_&]:text-slate-950' : 'text-white'
                }`}>
                  {alert.title}
                </h4>
                <p className={`text-xs font-semibold leading-relaxed mt-0.5 line-clamp-2 ${
                  isWhiteTheme ? 'text-slate-700 [html[data-theme=\'white\']_&]:text-slate-700' : 'text-slate-300'
                }`}>
                  {alert.body}
                </p>
              </div>
            </div>

            {/* Only show X button for non-sticky alerts */}
            {!alert.sticky && (
              <button
                onClick={() => dismissAlert(alert.id)}
                className={`p-1 rounded-lg transition-colors shrink-0 ${
                  isWhiteTheme ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lucide.X size={16} />
              </button>
            )}
          </div>

          {/* Action Buttons: High Contrast YES / NO in both Dark and White themes */}
          <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
            isWhiteTheme ? 'border-slate-200 [html[data-theme=\'white\']_&]:border-slate-200' : 'border-slate-800'
          }`}>
            <button
              onClick={() => dismissAlert(alert.id)}
              className={`px-3.5 py-2 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                isWhiteTheme
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-rose-300 shadow-xs [html[data-theme=\'white\']_&]:bg-rose-100 [html[data-theme=\'white\']_&]:text-rose-800 [html[data-theme=\'white\']_&]:border-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700'
              }`}
            >
              <Lucide.X size={14} /> NO (Dismiss)
            </button>
            <button
              onClick={() => handleAction(alert)}
              className={`px-4 py-2 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                isWhiteTheme
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-700 shadow-emerald-600/30 [html[data-theme=\'white\']_&]:bg-emerald-600 [html[data-theme=\'white\']_&]:text-white [html[data-theme=\'white\']_&]:border-emerald-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
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
