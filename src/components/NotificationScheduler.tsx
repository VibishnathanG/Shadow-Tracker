'use client';

import { useEffect, useRef } from 'react';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  isTauriEnv,
  isCapacitorEnv,
  sendNativeNotification,
} from '@/lib/nativeNotification';

export const NotificationScheduler = () => {
  const { reminders, tasks, habits, settings, updateReminder, toggleTaskCompletion } = useShadowTrackerStore();
  const triggeredMapRef = useRef<Record<string, string>>({});
  const isHiddenRef = useRef(false); // tracks when EXE window is hidden/minimised
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Eagerly request browser Notification permission on mount ──────────────
  useEffect(() => {
    if (!isTauriEnv() && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // ── Track eco-mode / hidden state for CPU optimisation (EXE only) ─────────
  useEffect(() => {
    const onEco = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      isHiddenRef.current = Boolean(detail?.enabled);
    };
    window.addEventListener('shadow-eco-mode', onEco);
    return () => window.removeEventListener('shadow-eco-mode', onEco);
  }, []);

  // 1. Android channel + action-type setup (APK only – no-op on EXE/Docker) ──
  useEffect(() => {
    if (!isCapacitorEnv()) return;
    try {
      LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Reminders & Notifications',
        description: 'Habit and Task Alerts',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'default',
      }).catch(() => {});

      LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'TASK_STICKY_ACTIONS',
            actions: [
              { id: 'yes_complete', title: '✅ Yes (Complete)', foreground: false },
              { id: 'no_snooze', title: '❌ No (Dismiss)', foreground: false },
            ],
          },
          {
            id: 'HABIT_STICKY_ACTIONS',
            actions: [
              { id: 'yes_complete', title: '✅ Yes (Done)', foreground: false },
              { id: 'no_snooze', title: '❌ No (Skip)', foreground: false },
            ],
          },
        ],
      }).catch(() => {});

      // Handle Action Clicks (YES / NO) on APK
      const actionListener = LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notificationAction) => {
          const { actionId, notification } = notificationAction;
          const taskId = notification.extra?.taskId;
          const habitId = notification.extra?.habitId;
          
          if (actionId === 'yes_complete' || actionId === 'tap') {
            if (taskId) {
              toggleTaskCompletion(taskId);
            } else if (habitId) {
              const { toggleHabitCompletion } = useShadowTrackerStore.getState();
              toggleHabitCompletion(habitId, getTodayDateString());
            }
            if (notification.id) {
              LocalNotifications.cancel({ notifications: [{ id: notification.id }] }).catch(() => {});
            }
          } else if (actionId === 'no_snooze' && notification.id) {
            LocalNotifications.cancel({ notifications: [{ id: notification.id }] }).catch(() => {});
          }
        }
      );

      return () => {
        actionListener.then((h) => h.remove()).catch(() => {});
      };
    } catch (e) {}
  }, [toggleTaskCompletion]);

  // 2. Pre-schedule native Android alarms for the next 7 days (APK only) ────
  useEffect(() => {
    if (!isCapacitorEnv()) return;
    try {
      LocalNotifications.requestPermissions()
        .then((perm) => {
          if (perm.display !== 'granted') return;

          const scheduledList: Array<{
            id: number;
            title: string;
            body: string;
            schedule: { at: Date };
            channelId: string;
            actionTypeId: string;
            ongoing?: boolean;
            autoCancel?: boolean;
            sound?: string;
            extra?: Record<string, any>;
          }> = [];

          const now = new Date();
          const isStickyEnabled = settings.stickyTaskNotifications ?? true;
          const isSoundEnabled = settings.soundEnabled;

          reminders.forEach((reminder) => {
            if (!reminder.isEnabled || !reminder.time) return;
            const [hStr, mStr] = reminder.time.split(':');
            const targetH = parseInt(hStr, 10);
            const targetM = parseInt(mStr, 10);
            if (isNaN(targetH) || isNaN(targetM)) return;

            let title = '⏰ Shadow Tracker Reminder';
            let body = reminder.title || 'You have an active scheduled task.';
            let isTaskReminder = false;
            let isHabitReminder = false;

            if (reminder.taskId) {
              const task = tasks.find((t) => t.id === reminder.taskId);
              title = task ? `🎯 Task: ${task.title}` : '🎯 Task Reminder';
              if (!reminder.title && task) body = 'Time to focus and execute this task!';
              isTaskReminder = true;
            } else if (reminder.habitId) {
              const habit = habits.find((h) => h.id === reminder.habitId);
              title = habit ? `🔥 Habit: ${habit.name}` : '🔥 Habit Reminder';
              if (!reminder.title && habit)
                body = `Keep your streak alive! (${habit.streakCount} day streak)`;
              isHabitReminder = true;
            }

            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
              const scheduledDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + dayOffset,
                targetH,
                targetM,
                0,
                0
              );
              if (scheduledDate <= now) continue;
              const dayOfWeek = scheduledDate.getDay();
              if (reminder.days && reminder.days.length > 0 && !reminder.days.includes(dayOfWeek))
                continue;

              const uniqueNumericId = Math.abs(
                (reminder.id
                  .split('')
                  .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0) +
                  dayOffset * 1000) %
                  2147483647
              );

              // When stickyTaskNotifications is ON, make all reminders sticky with YES/NO
              const useSticky = isStickyEnabled;
              const actionType = useSticky
                ? (isHabitReminder ? 'HABIT_STICKY_ACTIONS' : 'TASK_STICKY_ACTIONS')
                : '';

              scheduledList.push({
                id: uniqueNumericId,
                title,
                body,
                schedule: { at: scheduledDate },
                channelId: 'reminders',
                actionTypeId: actionType,
                ongoing: useSticky,
                autoCancel: !useSticky,
                sound: isSoundEnabled ? 'default' : undefined,
                extra: { taskId: reminder.taskId, habitId: reminder.habitId },
              });
            }
          });

          if (scheduledList.length > 0) {
            // Cancel previously scheduled to avoid duplicates, then schedule fresh
            LocalNotifications.getPending().then((pending) => {
              if (pending.notifications.length > 0) {
                LocalNotifications.cancel({ notifications: pending.notifications }).catch(() => {});
              }
              LocalNotifications.schedule({ notifications: scheduledList.slice(0, 50) }).catch(() => {});
            }).catch(() => {
              LocalNotifications.schedule({ notifications: scheduledList.slice(0, 50) }).catch(() => {});
            });
          }
        })
        .catch(() => {});
    } catch (e) {
      console.error('Failed to pre-schedule native notifications:', e);
    }
  }, [reminders, tasks, habits, settings.stickyTaskNotifications, settings.soundEnabled]);

  // 3. Live minute-tick checker – fires on EXE + Docker ─────────────────────
  // • Always sends a native OS toast with proper sound/sticky settings
  // • Only shows the in-app floating banner when the window is visible
  // • Polling pauses when the EXE window is hidden/minimised (eco mode)
  // • Uses 60s polling (sufficient granularity for HH:MM matching, saves CPU)
  useEffect(() => {
    // Skip on Capacitor — Android uses pre-scheduled alarms (effect #2)
    if (isCapacitorEnv()) return;

    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentHHmm = `${hours}:${minutes}`;
      const todayStr = getTodayDateString();
      const currentDayOfWeek = now.getDay();

      reminders.forEach((reminder) => {
        if (!reminder.isEnabled) return;
        if (reminder.time !== currentHHmm) return;
        if (reminder.days && reminder.days.length > 0 && !reminder.days.includes(currentDayOfWeek))
          return;

        const triggerKey = `${reminder.id}_${todayStr}_${currentHHmm}`;
        if (triggeredMapRef.current[triggerKey]) return;
        triggeredMapRef.current[triggerKey] = 'triggered';

        let title = '⏰ Shadow Tracker Alert';
        let body = reminder.title || 'You have a scheduled notification.';

        if (reminder.taskId) {
          const task = tasks.find((t) => t.id === reminder.taskId);
          title = task ? `🎯 Task: ${task.title}` : '🎯 Task Reminder';
          if (!reminder.title && task) body = 'Time to focus and execute this task!';
        } else if (reminder.habitId) {
          const habit = habits.find((h) => h.id === reminder.habitId);
          title = habit ? `🔥 Habit: ${habit.name}` : '🔥 Habit Reminder';
          if (!reminder.title && habit)
            body = `Keep your streak alive! (${habit.streakCount} day streak)`;
        }

        const soundEnabled = settings.soundEnabled;
        const stickyEnabled = Boolean(settings.stickyTaskNotifications);

        // Always send native OS notification with correct sound/sticky settings
        sendNativeNotification(
          title,
          stickyEnabled
            ? `${body}\n⚡ Use YES/NO in the app to respond`
            : body,
          { sound: soundEnabled, sticky: stickyEnabled }
        );

        // In-app floating banner – always dispatch so it's waiting when the app comes to foreground
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('shadow-notification', {
              detail: {
                id: `${reminder.id}_${Date.now()}`,
                title,
                body,
                taskId: reminder.taskId,
                habitId: reminder.habitId,
                timestamp: currentHHmm,
                sticky: stickyEnabled,
              },
            })
          );
        }

        if (!reminder.days || reminder.days.length === 0) {
          updateReminder(reminder.id, { isEnabled: false });
        }
      });
    };

    checkReminders();
    // 15-second polling guarantees catching exact HH:MM minute transitions without timer drift
    intervalRef.current = setInterval(checkReminders, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reminders, tasks, habits, settings.soundEnabled, settings.stickyTaskNotifications, updateReminder]);

  return null;
};
