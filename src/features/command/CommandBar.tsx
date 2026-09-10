'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { addTask, addHabit, updateSettings, settings, importBackup } = useShadowTrackerStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo(() => [
    { id: 'nav-dash', category: 'Navigation', label: 'Go to Dashboard', icon: 'LayoutDashboard', action: () => onNavigate('dashboard') },
    { id: 'nav-tasks', category: 'Navigation', label: 'Go to Tasks', icon: 'CheckSquare', action: () => onNavigate('tasks') },
    { id: 'nav-todo', category: 'Navigation', label: 'Go to Standalone ToDo', icon: 'CheckCircle2', action: () => onNavigate('todo') },
    { id: 'nav-habits', category: 'Navigation', label: 'Go to Habits', icon: 'Repeat', action: () => onNavigate('habits') },
    { id: 'nav-cal', category: 'Navigation', label: 'Go to Calendar', icon: 'Calendar', action: () => onNavigate('calendar') },
    { id: 'nav-health', category: 'Navigation', label: 'Go to Health & Vitality', icon: 'HeartPulse', action: () => onNavigate('health') },
    { id: 'nav-anal', category: 'Navigation', label: 'Go to Analytics', icon: 'TrendingUp', action: () => onNavigate('analytics') },
    { id: 'nav-notes', category: 'Navigation', label: 'Go to Daily Journal', icon: 'BookOpen', action: () => onNavigate('notes') },
    { id: 'nav-money', category: 'Navigation', label: 'Go to Wealth & Subscriptions OS', icon: 'DollarSign', action: () => onNavigate('money') },
    { id: 'nav-rpg', category: 'Navigation', label: 'Go to Life RPG & Skill Trees', icon: 'Crown', action: () => onNavigate('rpg') },
    { id: 'nav-set', category: 'Navigation', label: 'Go to Settings', icon: 'Settings', action: () => onNavigate('settings') },
    
    { id: 'act-task', category: 'Quick Add', label: `Create Task: "${query || 'New Task'}"`, icon: 'PlusSquare', action: async () => {
      if (!query.trim()) return;
      await addTask({
        title: query.trim(),
        dueDate: getTodayDateString(),
        priority: 'medium',
        isRecurring: false,
        recurrencePattern: null,
      });
      onClose();
    }},
    { id: 'act-habit', category: 'Quick Add', label: `Create Habit: "${query || 'New Habit'}"`, icon: 'CalendarDays', action: async () => {
      if (!query.trim()) return;
      await addHabit({
        name: query.trim(),
        frequency: 'daily',
      });
      onClose();
    }},

    { id: 'theme-light', category: 'Appearance', label: 'Switch to Standard White', icon: 'Sun', action: () => {
      updateSettings({ theme: 'light' });
      onClose();
    }},
    { id: 'theme-obsidian', category: 'Appearance', label: 'Switch to Obsidian Mode', icon: 'Moon', action: () => {
      updateSettings({ theme: 'obsidian' });
      onClose();
    }},
    { id: 'theme-onedark', category: 'Appearance', label: 'Switch to One Dark Mode', icon: 'Terminal', action: () => {
      updateSettings({ theme: 'onedark' });
      onClose();
    }},
    { id: 'theme-cyberpunk', category: 'Appearance', label: 'Switch to Cyberpunk Mode', icon: 'Zap', action: () => {
      updateSettings({ theme: 'cyberpunk' });
      onClose();
    }},
    { id: 'theme-midnight', category: 'Appearance', label: 'Switch to Purple Mode', icon: 'Sparkles', action: () => {
      updateSettings({ theme: 'midnight' });
      onClose();
    }},
    { id: 'data-load-2y-demo', category: 'Data & Workspaces', label: 'Load 2-Year Masterclass Demo (730 Days)', icon: 'Sparkles', action: async () => {
      if (window.confirm('Load 2-Year Extensive Masterclass Demo Dataset? This will populate 730 days of habits, daily logs, notes, 220+ tasks, 24 full months of financial data, and Level 25 Master rank.')) {
        try {
          const { generateMassiveTwoYearData } = await import('@/lib/seedData');
          await importBackup(generateMassiveTwoYearData());
          window.location.reload();
        } catch (e) {
          console.error(e);
        }
      }
      onClose();
    }},
  ], [onNavigate, query, addTask, addHabit, updateSettings, importBackup, onClose]);

  const filteredCommands = useMemo(() => commands.filter(cmd => {
    if (cmd.id === 'act-task' || cmd.id === 'act-habit') {
      return query.length > 0;
    }
    return cmd.label.toLowerCase().includes(query.toLowerCase()) || 
           cmd.category.toLowerCase().includes(query.toLowerCase());
  }), [commands, query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        cmd.action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg"
          />

          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring' as const, damping: 25, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-2xl tile overflow-hidden z-10 mt-10 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center px-5 border-b border-border bg-card">
              <Lucide.Search className="text-foreground mr-3" size={22} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, navigate tabs, or type to add tasks..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full h-16 bg-transparent text-foreground font-semibold placeholder-muted-foreground border-0 outline-none focus:ring-0 text-base"
              />
              <div className="hidden md:flex items-center gap-1 text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border">
                <span>ESC</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar">
              {filteredCommands.length > 0 ? (
                Object.entries(
                  filteredCommands.reduce((acc, cmd) => {
                    if (!acc[cmd.category]) acc[cmd.category] = [];
                    acc[cmd.category].push(cmd);
                    return acc;
                  }, {} as Record<string, typeof filteredCommands>)
                ).map(([category, items]) => (
                  <div key={category} className="mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground px-3 py-2">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const ItemIcon = (Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap) as React.ElementType;

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: isSelected ? 1.01 : 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              item.action();
                            }}
                            className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'text-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ItemIcon 
                                size={20} 
                                className={`transition-colors ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} 
                              />
                              <span className="text-sm font-semibold">{item.label}</span>
                            </div>
                            {isSelected && (
                              <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xs font-bold tracking-wider uppercase opacity-90 bg-primary-foreground/20 px-2.5 py-1 rounded-md"
                              >
                                Enter
                              </motion.span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <p className="text-base font-bold text-foreground">No matches found</p>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Try searching navigation tabs, or toggle actions</p>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary text-xs text-foreground font-semibold">
              <div className="flex gap-5">
                <span className="flex items-center gap-1.5"><Lucide.ArrowDown size={14} /><Lucide.ArrowUp size={14} /> Navigate</span>
                <span className="flex items-center gap-1.5"><Lucide.CornerDownLeft size={14} /> Select</span>
              </div>
              <div className="hidden sm:block">
                <span>Type and select &quot;Create Task&quot; to add immediately</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandBar;
