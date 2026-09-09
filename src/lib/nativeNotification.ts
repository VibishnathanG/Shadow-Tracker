/**
 * Native Notification Service for Windows Desktop (Tauri EXE), Mobile (Capacitor), and Web (Docker/Browser)
 */

export const isTauriEnv = (): boolean =>
  typeof window !== 'undefined' &&
  (Boolean((window as any).__TAURI__) || Boolean((window as any).__TAURI_INTERNALS__));

export const isCapacitorEnv = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean((window as any).Capacitor?.isNativePlatform?.());

export const playNotificationChime = (): void => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();

    osc.type = 'sine';
    oscHarmonic.type = 'triangle';

    // Arpeggiated C5 -> E5 -> G5 -> C6 chord progression
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(1046.50, t + 0.38);

    oscHarmonic.frequency.setValueAtTime(261.63, t);
    oscHarmonic.frequency.exponentialRampToValueAtTime(329.63, t + 0.12);
    oscHarmonic.frequency.exponentialRampToValueAtTime(392.00, t + 0.25);

    // Smooth envelope decay over 1.25 seconds
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    gainHarmonic.gain.setValueAtTime(0.001, t);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);

    osc.connect(gain);
    gain.connect(ctx.destination);

    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(ctx.destination);

    osc.start(t);
    oscHarmonic.start(t);

    osc.stop(t + 1.25);
    oscHarmonic.stop(t + 1.05);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch (_) {}
};

export const sendNativeNotification = async (
  title: string,
  body: string,
  options: { sound?: boolean; sticky?: boolean } = {}
): Promise<boolean> => {
  const soundEnabled = options.sound ?? true;
  const stickyEnabled = options.sticky ?? false;

  // 1. Tauri Desktop (Windows EXE / Mac / Linux)
  if (isTauriEnv()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // Instead of an OS-level toast, we bring the app window to the front
      // so the user sees the floating in-app banner.
      await invoke('show_window');
      
      if (soundEnabled) {
        playNotificationChime();
      }
      return true;
    } catch (e) {
      console.warn('Tauri show_window invoke error:', e);
    }
    return false;
  }

  // 2. Mobile (Android / iOS via Capacitor)
  if (isCapacitorEnv()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 250) },
            channelId: 'reminders',
            sound: soundEnabled ? 'default' : undefined,
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('Capacitor local notification error:', e);
    }
  }

  // 3. Web / Docker / Browser – Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        const n = new Notification(title, {
          body,
          icon: '/app_logo_master.png',
          requireInteraction: stickyEnabled,
          silent: !soundEnabled,
        });
        n.onclick = () => window.focus();
        if (soundEnabled) playNotificationChime();
        return true;
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          const n = new Notification(title, {
            body,
            icon: '/app_logo_master.png',
            requireInteraction: stickyEnabled,
            silent: !soundEnabled,
          });
          n.onclick = () => window.focus();
          if (soundEnabled) playNotificationChime();
          return true;
        }
      }
    } catch (e) {
      console.warn('Web Notification error:', e);
    }
  }

  return false;
};
