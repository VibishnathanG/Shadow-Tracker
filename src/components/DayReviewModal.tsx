'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';

interface DayReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'morning' | 'evening';
  onJumpToTask?: (taskId: string) => void;
}

export const DayReviewModal: React.FC<DayReviewModalProps> = ({
  isOpen,
  onClose,
  mode,
  onJumpToTask,
}) => {
  const {
    tasks,
    habits,
    dailyLogs,
    updateDailyLog,
    toggleHabitCompletion,
    toggleTaskCompletion,
    updateTask,
    addTask,
    saveNote,
    notes,
    addXp,
  } = useShadowTrackerStore();

  const todayStr = useMemo(() => getTodayDateString(), []);
  const [step, setStep] = useState<number>(1);

  // Morning State
  const [selectedMitIds, setSelectedMitIds] = useState<string[]>([]);
  const [newMitText, setNewMitText] = useState<string>('');
  const [morningEnergy, setMorningEnergy] = useState<number>(4);
  const [dailyIntention, setDailyIntention] = useState<string>('');

  // Evening State
  const [biggestWin, setBiggestWin] = useState<string>('');
  const [gratitudeNote, setGratitudeNote] = useState<string>('');
  const [eveningMood, setEveningMood] = useState<'great' | 'good' | 'neutral' | 'bad' | 'terrible'>('good');

  const todayTasks = useMemo(() => tasks.filter(t => t.dueDate === todayStr), [tasks, todayStr]);
  const todayLog = useMemo(() => dailyLogs.find(l => l.date === todayStr), [dailyLogs, todayStr]);

  if (!isOpen) return null;

  const handleMorningFinish = async () => {
    // If new MIT was typed, create it
    if (newMitText.trim()) {
      await addTask({
        title: newMitText.trim(),
        priority: 'high',
        dueDate: todayStr,
        isRecurring: false,
        recurrencePattern: null,
      });
    }

    // Save morning intention to note
    if (dailyIntention.trim()) {
      const existing = notes.find(n => n.id === todayStr);
      const combined = `### 🌅 Morning Intention\n${dailyIntention.trim()}\n\n${existing?.content || ''}`;
      await saveNote(todayStr, combined, existing?.title || 'Daily Journal');
    }

    await addXp(25);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    onClose();
    setStep(1);
  };

  const handleEveningFinish = async () => {
    // Update daily log mood
    await updateDailyLog(todayStr, { mood: eveningMood });

    // Save gratitude & win to notes
    if (biggestWin.trim() || gratitudeNote.trim()) {
      const existing = notes.find(n => n.id === todayStr);
      const eveningText = `### 🌙 Evening Reflection\n- **Win of the Day**: ${biggestWin.trim() || 'N/A'}\n- **Gratitude**: ${gratitudeNote.trim() || 'N/A'}`;
      const combined = `${existing?.content || ''}\n\n${eveningText}`.trim();
      await saveNote(todayStr, combined, existing?.title || 'Daily Journal');
    }

    await addXp(35);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    onClose();
    setStep(1);
  };

  // 1-tap Rollover unfinished tasks to tomorrow
  const handleRolloverTasks = async () => {
    const uncompleted = todayTasks.filter(t => !t.isCompleted);
    if (uncompleted.length === 0) return alert('No uncompleted tasks to roll over!');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    for (const t of uncompleted) {
      await updateTask(t.id, { dueDate: tomorrowStr });
    }

    alert(`Successfully rolled over ${uncompleted.length} tasks to tomorrow (${tomorrowStr})!`);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-surface-elevated border border-border/80 text-foreground rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${mode === 'morning' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
              {mode === 'morning' ? <Lucide.Sunrise size={20} /> : <Lucide.Sunset size={20} />}
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground">
                {mode === 'morning' ? 'Start My Day • Morning Briefing' : 'End of Day • Evening Reflection'}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {mode === 'morning' ? 'Set clarity, choose your top 3 MITs, and lock in focus.' : 'Wrap up habits, rollover tasks, and celebrate wins.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground">
            <Lucide.X size={16} />
          </button>
        </div>

        {/* Content Wizard */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[80vh]">
          {mode === 'morning' ? (
            /* MORNING BRIEFING FLOW */
            <>
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium leading-relaxed flex items-center gap-3">
                    <Lucide.Sparkles size={20} className="shrink-0 text-amber-400 animate-pulse" />
                    <div>
                      <p className="font-bold">“Focus is not about doing everything. It is about doing the right 3 things with ruthless execution.”</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Morning Energy &amp; Readiness</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setMorningEnergy(lvl)}
                          className={`py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                            morningEnergy === lvl
                              ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/30'
                              : 'bg-secondary text-muted-foreground border-border/60 hover:bg-surface'
                          }`}
                        >
                          {lvl}/5
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Daily Main Intention</label>
                    <input
                      type="text"
                      placeholder="e.g. Deep focus on project architecture, no social media before 1pm..."
                      value={dailyIntention}
                      onChange={e => setDailyIntention(e.target.value)}
                      className="w-full text-xs font-medium px-4 py-3 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      Next: Choose 3 MITs <Lucide.ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-foreground">Select up to 3 Most Important Tasks (MITs)</h4>
                    <p className="text-[11px] text-muted-foreground">These 3 tasks are your absolute non-negotiables for today.</p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todayTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No tasks scheduled for today yet.</p>
                    ) : (
                      todayTasks.map(t => {
                        const isSelected = selectedMitIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              if (isSelected) {
                                if (onJumpToTask) {
                                  onClose();
                                  onJumpToTask(t.id);
                                }
                              } else {
                                setSelectedMitIds(prev =>
                                  prev.length < 3 ? [...prev, t.id] : prev
                                );
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/50 text-foreground font-bold hover:bg-amber-500/25'
                                : 'bg-secondary/40 border-border/60 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            <span className="truncate flex-1 pr-2">{t.title}</span>
                            {isSelected && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onJumpToTask) {
                                      onClose();
                                      onJumpToTask(t.id);
                                    }
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/40 flex items-center gap-1 transition-all"
                                  title="Jump to this task in Tasks Workspace"
                                >
                                  <Lucide.ExternalLink size={10} />
                                  <span>Jump to Task</span>
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                                  MIT #{selectedMitIds.indexOf(t.id) + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMitIds(prev => prev.filter(id => id !== t.id));
                                  }}
                                  className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-secondary transition-all"
                                  title="Unselect MIT"
                                >
                                  <Lucide.X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">+ Or add new priority MIT</label>
                    <input
                      type="text"
                      placeholder="e.g. Ship the release build..."
                      value={newMitText}
                      onChange={e => setNewMitText(e.target.value)}
                      className="w-full text-xs font-medium px-3.5 py-2 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={handleMorningFinish}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lucide.CheckCircle2 size={15} /> Lock in Day (+25 XP)
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* EVENING REFLECTION FLOW */
            <>
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-foreground">Review Today's Habits &amp; Tasks</h4>
                    <p className="text-[11px] text-muted-foreground">Tap any habits you completed today to check them off.</p>
                  </div>

                  {/* Habits list */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {habits.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No habits configured.</p>
                    ) : (
                      habits.map(h => {
                        const isDone = h.completedDates.includes(todayStr);
                        return (
                          <div
                            key={h.id}
                            onClick={() => toggleHabitCompletion(h.id, todayStr)}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isDone ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-secondary/40 border-border/60 text-muted-foreground'
                            }`}
                          >
                            <span className="truncate">{h.name}</span>
                            <span className="text-[10px] font-black">{isDone ? '✓ Completed' : 'Pending'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Tasks wrap up & rollover button */}
                  <div className="p-3.5 bg-secondary/40 border border-border/60 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">Unfinished Tasks ({todayTasks.filter(t => !t.isCompleted).length})</p>
                      <p className="text-[11px] text-muted-foreground">Roll them over to tomorrow's schedule automatically.</p>
                    </div>
                    <button
                      onClick={handleRolloverTasks}
                      className="px-3 py-1.5 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Rollover &rarr;
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      Next: Wins &amp; Gratitude <Lucide.ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Lucide.Trophy size={14} className="text-amber-400" /> What was your biggest win today?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Solved the complex caching bug, went for a run..."
                      value={biggestWin}
                      onChange={e => setBiggestWin(e.target.value)}
                      className="w-full text-xs font-medium px-4 py-2.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Lucide.Heart size={14} className="text-rose-400" /> One thing you are grateful for
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A supportive team, good health, peaceful evening..."
                      value={gratitudeNote}
                      onChange={e => setGratitudeNote(e.target.value)}
                      className="w-full text-xs font-medium px-4 py-2.5 bg-secondary text-foreground rounded-xl border border-border/60 outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Evening Mood Check</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['terrible', 'bad', 'neutral', 'good', 'great'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEveningMood(m)}
                          className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                            eveningMood === m
                              ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30'
                              : 'bg-secondary text-muted-foreground border-border/60 hover:bg-surface'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={handleEveningFinish}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lucide.CheckCircle2 size={15} /> Complete Evening Review (+35 XP)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
