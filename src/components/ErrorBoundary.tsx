'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Lucide } from './icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      // Try to delete indexedDB
      window.indexedDB.deleteDatabase('shadow_tracker_db');
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-xl bg-[#121214] border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 border-b border-red-500/15 pb-4">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                <Lucide.AlertOctagon size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold uppercase tracking-widest text-red-500">System Crash Detected</h2>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider">SHADOW PORTAL TERMINATED</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Error Message</span>
              <div className="p-4 bg-black/40 border border-border/40 rounded-xl text-xs font-mono text-red-400 overflow-x-auto leading-relaxed">
                {this.state.error?.toString() || 'Unknown Runtime Exception'}
              </div>
            </div>

            {this.state.error?.stack && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Trace Stack</span>
                <div className="p-4 bg-black/40 border border-border/40 rounded-xl text-[10px] font-mono text-muted-foreground overflow-auto max-h-40 leading-relaxed">
                  {this.state.error.stack}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/20 text-xs gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl border border-border/60 transition-all"
              >
                <Lucide.RefreshCw size={14} />
                Reload Portal
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 transition-all"
              >
                <Lucide.Trash2 size={14} />
                Wipe Local State & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
