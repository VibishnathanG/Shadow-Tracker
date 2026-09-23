'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { PromptTemplateItem } from './aiTypes';
import {
  BUILTIN_PROMPTS,
  getCustomPrompts,
  saveCustomPrompt,
  deleteCustomPrompt,
} from './aiPromptsData';

interface AiPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

type PromptCategoryFilter = 'All' | 'Tasks' | 'Habits' | 'Health & Diet' | 'Wealth' | 'Journal' | 'Notifications' | 'Custom';

export default function AiPromptsModal({ isOpen, onClose, onSelectPrompt }: AiPromptsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPrompts, setCustomPrompts] = useState<PromptTemplateItem[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // New Custom Prompt Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<PromptTemplateItem['category']>('Tasks');
  const [customPromptText, setCustomPromptText] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const reloadCustomPrompts = () => {
    setCustomPrompts(getCustomPrompts());
  };

  useEffect(() => {
    if (isOpen) {
      reloadCustomPrompts();
      // Lock background scrolling
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isOpen]);

  // Combine built-in + custom
  const allPrompts = useMemo(() => {
    const list = [...customPrompts, ...BUILTIN_PROMPTS];
    return list.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Custom'
          ? Boolean(item.isCustom)
          : item.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [customPrompts, selectedCategory, searchQuery]);

  const handleSaveCustomPrompt = () => {
    setFormError(null);
    if (!customTitle.trim()) {
      setFormError('Prompt title is required.');
      return;
    }
    if (!customPromptText.trim()) {
      setFormError('Prompt text / instructions are required.');
      return;
    }

    saveCustomPrompt({
      title: customTitle.trim(),
      category: customCategory,
      prompt: customPromptText.trim(),
      description: customDesc.trim() || undefined,
    });

    reloadCustomPrompts();
    setIsAddingCustom(false);
    setCustomTitle('');
    setCustomPromptText('');
    setCustomDesc('');
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomPrompt(id);
    reloadCustomPrompts();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs shrink-0">
              <Lucide.Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <span>Day-to-Day Productivity Prompts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {allPrompts.length} Prompts
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                High-leverage templates to instantly drive your roadmap, habits, health, wealth, and alarms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lucide.Plus size={13} />
              <span>{isAddingCustom ? 'View Prompts' : 'Add Custom'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
              aria-label="Close"
            >
              <Lucide.X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {isAddingCustom ? (
            /* Add Custom Instruction Form */
            <div className="space-y-4 p-5 rounded-2xl bg-surface-elevated/60 border border-border">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Lucide.PenTool size={16} className="text-primary" />
                <span>Save New Custom AI Instruction</span>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <Lucide.AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">Prompt Title</span>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Deep Work Sprint Kickoff"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">Category</span>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="Tasks">Tasks</option>
                    <option value="Habits">Habits</option>
                    <option value="Health & Diet">Health &amp; Diet</option>
                    <option value="Wealth">Wealth</option>
                    <option value="Journal">Journal</option>
                    <option value="Notifications">Notifications</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Full Prompt Text / Instructions
                </span>
                <textarea
                  rows={4}
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Enter the detailed instruction or prompt you want to send to the AI..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Short Description (Optional)
                </span>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Short note summarizing what this prompt does"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomPrompt}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lucide.Check size={14} />
                  <span>Save Instruction</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  'All',
                  'Tasks',
                  'Habits',
                  'Health & Diet',
                  'Wealth',
                  'Journal',
                  'Notifications',
                  'Custom',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-surface-elevated text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Lucide.Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts by keyword..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPrompts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPrompt(p.prompt);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-surface-elevated/70 border border-border hover:border-primary hover:bg-surface-elevated transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {p.category}
                        </span>
                        {p.isCustom && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-purple-400">Custom</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustom(p.id, e)}
                              className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Delete custom prompt"
                            >
                              <Lucide.Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description || p.prompt}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-bold text-primary">
                      <span>Click to use prompt</span>
                      <Lucide.ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {allPrompts.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No prompts found matching your query.
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
