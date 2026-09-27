import React from 'react';

type Listener = (isActive: boolean) => void;
const listeners = new Set<Listener>();

// Initial state: in browser, check !document.hidden && document.hasFocus()
let isWindowActiveState = true;

/**
 * Synchronous check whether the app window is currently active and focused.
 */
export const isWindowActive = (): boolean => {
  if (typeof document === 'undefined') return true;
  return !document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true);
};

/**
 * Subscribe to window active/inactive transitions.
 */
export const subscribeWindowState = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const notifyListeners = (active: boolean) => {
  if (isWindowActiveState === active) return;
  isWindowActiveState = active;

  if (typeof document !== 'undefined') {
    if (!active) {
      document.documentElement.classList.add('window-blurred', 'window-inactive');
      if (document.hidden) {
        document.documentElement.classList.add('is-hidden');
      }
    } else {
      document.documentElement.classList.remove('is-hidden', 'window-blurred', 'window-inactive');
    }
  }

  listeners.forEach((listener) => {
    try {
      listener(active);
    } catch {
      // Ignore listener error
    }
  });
};

/**
 * Initialize global window state event listeners.
 * Pauses background CPU/GPU tasks when minimized or fully hidden,
 * without disrupting active reading or multi-monitor visibility.
 */
export const initWindowStateManager = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const IDLE_TIMEOUT_MS = 6000; // 6s of zero user activity pauses ambient animations
  let lastActivityTime = 0;

  const setIdle = (idle: boolean) => {
    if (typeof document === 'undefined') return;
    if (idle) {
      document.documentElement.classList.add('is-user-idle');
    } else {
      document.documentElement.classList.remove('is-user-idle');
    }
  };

  const handleUserActivity = () => {
    const now = Date.now();
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('is-user-idle')) {
      setIdle(false);
    }
    // Throttle idle timer reset to avoid overhead on rapid cursor motion
    if (now - lastActivityTime > 400) {
      lastActivityTime = now;
      if (idleTimer) clearTimeout(idleTimer);
      if (!document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true)) {
        idleTimer = setTimeout(() => {
          setIdle(true);
        }, IDLE_TIMEOUT_MS);
      }
    }
  };

  const handleBlur = () => {
    if (idleTimer) clearTimeout(idleTimer);
    setIdle(true);
    // Notify window blur without completely blacking out
    notifyListeners(false);
  };

  const handleFocus = () => {
    if (!document.hidden) {
      notifyListeners(true);
      handleUserActivity();
    }
  };

  const handleVisibility = () => {
    if (document.hidden) {
      if (idleTimer) clearTimeout(idleTimer);
      setIdle(true);
      notifyListeners(false);
    } else {
      const hasFocus = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      notifyListeners(hasFocus);
      if (hasFocus) handleUserActivity();
    }
  };

  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pageshow', handleFocus);
  window.addEventListener('pagehide', handleBlur);

  // Active user interaction listeners to pause ambient CPU load during reading / idle
  window.addEventListener('mousemove', handleUserActivity, { passive: true });
  window.addEventListener('keydown', handleUserActivity, { passive: true });
  window.addEventListener('scroll', handleUserActivity, { passive: true });
  window.addEventListener('touchstart', handleUserActivity, { passive: true });
  window.addEventListener('pointerdown', handleUserActivity, { passive: true });

  // Sync initial state on mount
  if (typeof document !== 'undefined') {
    const initialActive = !document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true);
    notifyListeners(initialActive);
    if (initialActive) {
      handleUserActivity();
    }
  }

  // Tauri native window listeners
  let unlistenState: (() => void) | undefined;
  if ((window as any).__TAURI_INTERNALS__) {
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<{ minimized?: boolean; hidden?: boolean; focused?: boolean }>('shadow-window-state', (e) => {
        const isInactive = Boolean(
          e.payload?.minimized ||
          e.payload?.hidden ||
          (typeof e.payload?.focused === 'boolean' && !e.payload.focused)
        );
        if (isInactive) {
          handleBlur();
        } else if (e.payload?.focused === true) {
          handleFocus();
        }
      }).then((unlisten) => {
        unlistenState = unlisten;
      }).catch(() => {});
    }).catch(() => {});
  }

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pageshow', handleFocus);
    window.removeEventListener('pagehide', handleBlur);
    window.removeEventListener('mousemove', handleUserActivity);
    window.removeEventListener('keydown', handleUserActivity);
    window.removeEventListener('scroll', handleUserActivity);
    window.removeEventListener('touchstart', handleUserActivity);
    window.removeEventListener('pointerdown', handleUserActivity);
    if (unlistenState) unlistenState();
  };
};

/**
 * React hook to react to window focus/blur/visibility changes.
 */
export const useWindowState = (): boolean => {
  const [active, setActive] = React.useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true);
  });

  React.useEffect(() => {
    return subscribeWindowState((newActive) => {
      setActive(newActive);
    });
  }, []);

  return active;
};
