'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { customDialogs, ToastItem, ConfirmDialogState, AlertDialogState } from '@/lib/dialogs';

export default function CustomDialogOverlay() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  });
  const [alertState, setAlertState] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
    buttonLabel: 'OK',
  });

  useEffect(() => {
    // Override window.alert & window.confirm to route through custom in-app dialogs
    if (typeof window !== 'undefined') {
      window.alert = (msg?: any) => {
        customDialogs.alert(String(msg || ''));
      };
      window.confirm = (msg?: string) => {
        // Synchronous confirm fallback trigger
        customDialogs.confirm({ message: msg || 'Are you sure?' });
        return true; // default true for non-async calls or routed async
      };
    }

    const unsubscribe = customDialogs.subscribe(() => {
      setToasts([...customDialogs.getToasts()]);
      setConfirmState({ ...customDialogs.getConfirmState() });
      setAlertState({ ...customDialogs.getAlertState() });
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Top Floating Toast Banners Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map(t => {
            const isError = t.type === 'error';
            const isSuccess = t.type === 'success';
            const isWarning = t.type === 'warning';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
                  isError
                    ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50'
                    : isSuccess
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50'
                    : isWarning
                    ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-950/50'
                    : 'bg-surface/90 border-primary/40 text-foreground shadow-primary/20'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isError && <Lucide.AlertCircle size={18} className="text-rose-400" />}
                  {isSuccess && <Lucide.CheckCircle2 size={18} className="text-emerald-400" />}
                  {isWarning && <Lucide.AlertTriangle size={18} className="text-amber-400" />}
                  {!isError && !isSuccess && !isWarning && <Lucide.Info size={18} className="text-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-relaxed whitespace-pre-line">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => customDialogs.removeToast(t.id)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg shrink-0"
                >
                  <Lucide.X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Custom Confirm Modal */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => confirmState.resolve?.(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-surface border border-border/80 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${confirmState.isDanger ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-primary/20 border-primary/40 text-primary'}`}>
                  <Lucide.HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                  {confirmState.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                {confirmState.message}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => confirmState.resolve?.(false)}
                  className="px-5 py-2.5 bg-surface-elevated hover:bg-secondary text-foreground font-bold text-xs rounded-xl border border-border transition-all cursor-pointer"
                >
                  {confirmState.cancelLabel}
                </button>
                <button
                  onClick={() => confirmState.resolve?.(true)}
                  className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer text-white ${
                    confirmState.isDanger
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-primary hover:bg-primary/90 shadow-primary/30'
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => alertState.resolve?.()}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-surface border border-emerald-500/40 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl border bg-emerald-500/20 border-emerald-500/40 text-emerald-400">
                  <Lucide.Info size={20} />
                </div>
                <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                  {alertState.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                {alertState.message}
              </p>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => alertState.resolve?.()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {alertState.buttonLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
