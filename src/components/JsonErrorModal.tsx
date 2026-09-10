import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  FileCode,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { JsonDiagnosticIssue } from '@/lib/jsonDiagnostics';

interface JsonErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostic: JsonDiagnosticIssue | null;
  fileName?: string;
}

export const JsonErrorModal: React.FC<JsonErrorModalProps> = ({
  isOpen,
  onClose,
  diagnostic,
  fileName,
}) => {
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !diagnostic) return null;

  const handleCopyTemplate = async () => {
    if (!diagnostic.expectedStructure) return;
    try {
      await navigator.clipboard.writeText(diagnostic.expectedStructure);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy template to clipboard', e);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'syntax':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'schema':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'field':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      default:
        return 'bg-red-500/10 text-red-500 border-red-500/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-card border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 my-8 text-foreground flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-red-500/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Corrupted JSON Backup Detected
                </h3>
                <p className="text-xs text-muted-foreground">
                  {fileName ? `File: ${fileName}` : 'Verification Diagnostic Engine'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-sm">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getBadgeColor(
                  diagnostic.type
                )}`}
              >
                {diagnostic.type.toUpperCase()} ERROR
              </span>

              {diagnostic.line !== undefined && (
                <span className="px-2.5 py-1 text-xs font-mono bg-muted/60 text-muted-foreground rounded-full border border-border/60">
                  Line {diagnostic.line}, Column {diagnostic.column ?? 1}
                </span>
              )}

              {diagnostic.fieldPath && (
                <span className="px-2.5 py-1 text-xs font-mono bg-muted/60 text-muted-foreground rounded-full border border-border/60">
                  Field Path: {diagnostic.fieldPath}
                </span>
              )}
            </div>

            {/* Error Message */}
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="font-medium text-red-400 leading-relaxed text-xs sm:text-sm">
                {diagnostic.message}
              </p>
            </div>

            {/* Code Snippet */}
            {diagnostic.snippet && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    Exact Line Context
                  </span>
                  <span className="text-[11px] font-mono text-red-400">
                    ▲ Error Marker
                  </span>
                </div>
                <pre className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono overflow-x-auto text-neutral-300 leading-5">
                  {diagnostic.snippet}
                </pre>
              </div>
            )}

            {/* Actionable Suggestion */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4" />
                <span>How to Fix This File</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {diagnostic.suggestion}
              </p>
            </div>

            {/* Official Schema Reference Template */}
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTemplate(!showTemplate)}
                className="w-full flex items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left font-medium text-xs sm:text-sm"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  Official Shadow Tracker Backup Structure
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  {showTemplate ? 'Hide Template' : 'Show Template'}
                  {showTemplate ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {showTemplate && (
                <div className="p-3.5 bg-neutral-950 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">
                      Standard JSON format expected by all sync engines:
                    </span>
                    <button
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1 text-xs bg-muted/30 hover:bg-muted/60 border border-neutral-700 text-neutral-200 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-neutral-900/80 rounded-lg text-xs font-mono text-neutral-300 max-h-60 overflow-y-auto custom-scrollbar leading-relaxed">
                    {diagnostic.expectedStructure}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-muted/20 border-t border-border/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-xl text-xs hover:bg-primary/90 transition-colors shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
