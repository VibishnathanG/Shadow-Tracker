'use client';
import React, { useState, useEffect } from 'react';

export function AppSplashGate({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const rawElem = document.getElementById('raw-critical-splash');
    if (rawElem) {
      rawElem.style.opacity = '0';
      rawElem.style.transition = 'opacity 0.15s ease';
      setTimeout(() => rawElem.remove(), 150);
    }

    // Show the Tauri window if it was hidden
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('show_window').catch((err) => console.warn('Failed to show window:', err));
      });
    }

    // Keep the splash visible for 1.5s to ensure a smooth transition
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!isLoaded && (
        <div className="fixed inset-0 z-[999999] bg-[#030603] flex flex-col items-center justify-center p-6 text-white select-none pointer-events-auto">
          {/* Clean Minimal Logo */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-500/10">
              <svg className="w-12 h-12" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="85" fill="#22d3ee" opacity="0.15"/>
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#22d3ee" strokeWidth="12" transform="rotate(-30, 100, 100)"/>
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#818cf8" strokeWidth="12" transform="rotate(30, 100, 100)"/>
                <ellipse cx="100" cy="100" rx="75" ry="32" stroke="#c084fc" strokeWidth="12" transform="rotate(90, 100, 100)"/>
                <circle cx="158" cy="68" r="10" fill="#22d3ee"/>
                <circle cx="42" cy="132" r="10" fill="#818cf8"/>
                <circle cx="100" cy="25" r="10" fill="#c084fc"/>
                <circle cx="100" cy="100" r="18" fill="#22d3ee"/>
                <circle cx="100" cy="100" r="8" fill="#ffffff"/>
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-black tracking-wider uppercase text-white">
            Shadow Tracker
          </h1>
        </div>
      )}

      <div>
        {children}
      </div>
    </>
  );
}
