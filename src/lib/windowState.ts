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
      document.documentElement.classList.add('is-hidden', 'window-blurred', 'window-inactive');
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
 * Freezes CPU and GPU rendering pipelines the exact moment window focus is lost,
 * mouse leaves the screen to another monitor, or the window is minimized/masked.
 */
export const initWindowStateManager = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let leaveTimer: ReturnType<typeof setTimeout> | null = null;

  const handleBlur = () => {
    if (leaveTimer) clearTimeout(leaveTimer);
    notifyListeners(false);
  };

  const handleFocus = () => {
    if (leaveTimer) clearTimeout(leaveTimer);
    if (!document.hidden) {
      notifyListeners(true);
    }
  };

  const handleVisibility = () => {
    if (document.hidden) {
      notifyListeners(false);
    } else {
      const hasFocus = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      notifyListeners(hasFocus);
    }
  };

  // When mouse leaves the window viewport (e.g. moving mouse to a second monitor)
  const handleMouseLeave = () => {
    if (leaveTimer) clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      // If document doesn't have focus or mouse left the screen, transition to low-resource state
      if (!document.hasFocus || !document.hasFocus()) {
        notifyListeners(false);
      }
    }, 600);
  };

  const handleMouseEnter = () => {
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    // Only wake up if document is visible
    if (!document.hidden) {
      notifyListeners(true);
    }
  };

  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pageshow', handleFocus);
  window.addEventListener('pagehide', handleBlur);
  document.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('mouseenter', handleMouseEnter);

  // Sync initial state on mount
  if (typeof document !== 'undefined') {
    const initialActive = !document.hidden && (typeof document.hasFocus === 'function' ? document.hasFocus() : true);
    notifyListeners(initialActive);
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
    if (leaveTimer) clearTimeout(leaveTimer);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pageshow', handleFocus);
    window.removeEventListener('pagehide', handleBlur);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('mouseenter', handleMouseEnter);
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
