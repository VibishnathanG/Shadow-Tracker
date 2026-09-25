'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { getTodayDateString, formatDateString, getMonthGridDates, getWeekDates, parseDateString } from '@/lib/dateUtils';
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth } from 'date-fns';
import { TimeBlockingView } from './TimeBlockingView';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useViewPreference } from '@/lib/viewPreferences';

interface CalendarFeatureProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const dayOfWeekNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const moodEmojis = {
  great: {
    icon: Lucide.SmilePlus,
    label: 'Great',
    activeCls: 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30',
    idleCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20',
  },
  good: {
    icon: Lucide.Smile,
    label: 'Good',
    activeCls: 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30',
    idleCls: 'bg-sky-500/10 text-sky-400 border-sky-500/25 hover:bg-sky-500/20',
  },
  neutral: {
    icon: Lucide.Meh,
    label: 'Okay',
    activeCls: 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/30',
    idleCls: 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20',
  },
  bad: {
    icon: Lucide.Frown,
    label: 'Down',
    activeCls: 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/30',
    idleCls: 'bg-orange-500/10 text-orange-400 border-orange-500/25 hover:bg-orange-500/20',
  },
  terrible: {
    icon: Lucide.Angry,
    label: 'Rough',
    activeCls: 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30',
    idleCls: 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20',
  },
} as const;

export const CalendarFeature: React.FC<CalendarFeatureProps> = ({
  selectedDate,
  setSelectedDate,
}) => {
  const {
    tasks,
    habits,
    dailyLogs,
    notes,
    updateDailyLog,
    saveNote,
    toggleTaskCompletion,
    toggleHabitCompletion,
    settings,
  } = useShadowTrackerStore(
    useShallow(state => ({
      tasks: state.tasks,
      habits: state.habits,
      dailyLogs: state.dailyLogs,
      notes: state.notes,
      updateDailyLog: state.updateDailyLog,
      saveNote: state.saveNote,
      toggleTaskCompletion: state.toggleTaskCompletion,
      toggleHabitCompletion: state.toggleHabitCompletion,
      settings: state.settings,
    }))
  );
  
  const isWhiteTheme = settings?.theme === 'light' || settings?.theme === 'white';

  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => parseDateString(selectedDate));
  const [viewMode, setViewMode] = useViewPreference('calendarViewMode') as ['month' | 'week' | 'timeline', (v: 'month' | 'week' | 'timeline') => void];
  const [direction, setDirection] = useState(0);

  const [journalContent, setJournalContent] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [isNoteEditing, setIsNoteEditing] = useState(false);

  const todayStr = useMemo(() => getTodayDateString(), []);

  useEffect(() => {
    const note = notes.find(n => n.id === selectedDate || n.date === selectedDate);
    setJournalContent(note?.content || '');
    setJournalTitle(note?.title || '');
    const hasContent = Boolean(note && (note.content?.trim() || note.title?.trim()));
    setIsNoteEditing(!hasContent);

    const log = dailyLogs.find(l => l.date === selectedDate);
    setSelectedMood(log?.mood || '');
  }, [selectedDate, notes, dailyLogs]);

  const handleSaveJournal = useCallback(async () => {
    await saveNote(selectedDate, journalContent.trim(), journalTitle.trim() || undefined);
    setIsSavedIndicator(true);
    setIsNoteEditing(false);
    setTimeout(() => setIsSavedIndicator(false), 2000);
  }, [saveNote, selectedDate, journalContent, journalTitle]);

  const handleMoodSelect = useCallback(async (mood: string) => {
    const nextMood = selectedMood === mood ? undefined : (mood as 'great' | 'good' | 'neutral' | 'bad' | 'terrible');
    setSelectedMood(nextMood || '');
    await updateDailyLog(selectedDate, { mood: nextMood });
  }, [selectedMood, selectedDate, updateDailyLog]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentViewDate(prev => viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentViewDate(prev => viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setDirection(today > currentViewDate ? 1 : -1);
    setCurrentViewDate(today);
    setSelectedDate(todayStr);
  }, [currentViewDate, setSelectedDate, todayStr]);

  const monthGrid = useMemo(() => getMonthGridDates(currentViewDate), [currentViewDate]);
  const weekRow = useMemo(() => getWeekDates(currentViewDate), [currentViewDate]);

  const selectedDateTasks = useMemo(() => tasks.filter(t => t.dueDate === selectedDate), [tasks, selectedDate]);
  const selectedDateLog = useMemo(() => dailyLogs.find(l => l.date === selectedDate), [dailyLogs, selectedDate]);
  const selectedDateScore = selectedDateLog?.focusScore ?? 0;

  const isPastDate = selectedDate < todayStr;
  const uncompletedTasksCount = selectedDateTasks.filter(t => !t.isCompleted).length;
  const uncompletedHabitsCount = habits.filter(h => !h.completedDates.includes(selectedDate)).length;
  const totalMissedCount = isPastDate ? (uncompletedTasksCount + uncompletedHabitsCount) : 0;


  const habitCompletionMap = useMemo(() => {
    const map = new Map<string, number>();
    habits.forEach(h => {
      h.completedDates.forEach(d => {
        map.set(d, (map.get(d) || 0) + 1);
      });
    });
    return map;
  }, [habits]);

  const notesMap = useMemo(() => {
    const map = new Map<string, boolean>();
    notes.forEach(n => {
      if (n.content.trim().length > 0) map.set(n.id, true);
    });
    return map;
  }, [notes]);
  
  const dailyLogsMap = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    dailyLogs.forEach(l => {
      map.set(l.date, l);
    });
    return map;
  }, [dailyLogs]);
  
  const tasksByDate = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, { tasks: any[]; completedCount: number }>();
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const entry = map.get(t.dueDate) || { tasks: [], completedCount: 0 };
      entry.tasks.push(t);
      if (t.isCompleted) entry.completedCount++;
      map.set(t.dueDate, entry);
    });
    return map;
  }, [tasks]);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
      <div className="dashboard-watermark absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className={`absolute -top-[40%] -left-[40%] w-[180%] h-[180%] origin-center animate-spin-cw [animation-duration:300s] ${isWhiteTheme ? 'text-primary/20' : 'text-primary/10'}`}
        >
          <svg viewBox="0 0 1000 1000" className="w-full h-full text-current">
            <defs>
              <radialGradient id="calBgGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="500" cy="500" r="420" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 12" opacity="0.8" />
            <circle cx="500" cy="500" r="280" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="6 15" opacity="0.6" />
            <circle cx="500" cy="500" r="160" fill="url(#calBgGlow)" opacity="0.4" />
          </svg>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="pill-group">
            {(['month', 'week', 'timeline'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`filter-pill ${viewMode === mode ? 'active' : ''}`}
              >
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 flex-1 sm:flex-initial w-full sm:w-auto">
            <h2 className="text-lg sm:text-xl font-black tracking-tight min-w-[120px] text-center text-foreground">
              {format(currentViewDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/60 transition-colors cursor-pointer border-0 outline-none ring-0 focus:outline-none"
                title="Previous period"
              >
                <Lucide.ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="filter-pill text-xs py-1 px-3.5 rounded-full font-bold uppercase cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/60 transition-colors cursor-pointer border-0 outline-none ring-0 focus:outline-none"
                title="Next period"
              >
                <Lucide.ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-4 px-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" /> Tasks & Habits</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> Notes</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" /> Mood</div>
        </div>

        <div className="tile p-2.5 sm:p-5 md:p-7 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentViewDate.toISOString() + viewMode}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir * 30, scale: 0.98, filter: 'blur(4px)' }),
                center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
                exit: (dir: number) => ({ opacity: 0, x: dir * -30, scale: 1.02, filter: 'blur(4px)' })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              {viewMode === 'timeline' ? (
                <TimeBlockingView selectedDate={selectedDate} />
              ) : viewMode === 'month' ? (
                <div className="space-y-3 select-none">
                  <div className="grid grid-cols-7 text-center border-b border-border/60 pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {dayOfWeekNames.map(d => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
                    {monthGrid.map((date) => {
                      const dateStr = formatDateString(date);
                      const isCurrentMonth = isSameMonth(date, currentViewDate);
                      const isSelected = dateStr === selectedDate;
                      const isTodayDate = dateStr === todayStr;
                      
                      const dayLog = dailyLogsMap.get(dateStr);
                      const dayScore = dayLog?.focusScore ?? 0;
                      const dayHabitsCompleted = habitCompletionMap.get(dateStr) || 0;
                      const hasNote = notesMap.get(dateStr) || false;
                      const dayTasks = tasksByDate.get(dateStr)?.tasks || [];
                      const hasTasks = dayTasks.length > 0;
                      const dayMood = dayLog?.mood;

                      return (
                        <motion.div
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            if (!isCurrentMonth) setCurrentViewDate(date);
                          }}
                          whileHover={{ 
                            scale: 1.08, 
                            y: -2, 
                            boxShadow: '0 8px 20px -4px rgba(var(--primary-rgb), 0.3)',
                            transition: { type: 'spring', stiffness: 500, damping: 20 }
                          }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative aspect-square flex flex-col justify-between p-1 sm:p-2 rounded-xl sm:rounded-2xl cursor-pointer border transition-colors ${
                            isSelected
                              ? 'text-primary-foreground border-transparent z-10'
                              : isTodayDate
                              ? 'bg-secondary/40 border-transparent text-foreground'
                              : isCurrentMonth
                              ? 'bg-secondary/20 border-transparent text-foreground hover:bg-secondary/60'
                              : 'bg-transparent border-transparent text-muted-foreground/60 hover:bg-secondary/40'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="selectedDay"
                              className="absolute inset-0 bg-primary rounded-2xl -z-10 shadow-lg shadow-primary/30"
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            />
                          )}
                          <span className={`text-sm font-bold leading-none ${isTodayDate && !isSelected ? 'text-primary' : ''}`}>
                            {format(date, 'd')}
                          </span>
                          
                          <div className="flex flex-col items-end gap-1 w-full">
                            <div className="flex flex-wrap gap-1 justify-end w-full mt-1">
                              {hasTasks && (
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'} opacity-90`} title={`${dayTasks.length} Task(s)`} />
                              )}
                              {dayHabitsCompleted > 0 && (
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'} opacity-90`} title={`${dayHabitsCompleted} Habit(s)`} />
                              )}
                              {hasNote && (
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-purple-500'} opacity-90`} title="Journal Note" />
                              )}
                              {dayMood && (
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-orange-500'} opacity-90`} title={`Mood: ${dayMood}`} />
                              )}
                            </div>
                            
                            {dayScore > 0 && (
                              <div className={`w-full h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/30' : 'bg-secondary'} overflow-hidden`}>
                                <div className={`h-full rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} style={{ width: `${dayScore}%` }} />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekRow.map((date) => {
                    const dateStr = formatDateString(date);
                    const isSelected = dateStr === selectedDate;
                    const isTodayDate = dateStr === todayStr;
                    
                    const dayLog = dailyLogsMap.get(dateStr);
                    const dayScore = dayLog?.focusScore ?? 0;
                    
                    const dayTaskEntry = tasksByDate.get(dateStr);
                    const dayTasks = dayTaskEntry?.tasks || [];
                    const dayCompletedCount = dayTaskEntry?.completedCount || 0;
                    const dayHabitsCompleted = habitCompletionMap.get(dateStr) || 0;
                    const hasNote = notesMap.get(dateStr) || false;

                    return (
                      <motion.div
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        whileHover={{ 
                          scale: 1.01,
                          x: 5,
                          boxShadow: '0 8px 20px -4px rgba(var(--primary-rgb), 0.2)',
                          transition: { type: 'spring', stiffness: 500, damping: 25 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-colors overflow-hidden ${
                          isSelected
                            ? 'text-primary-foreground border-transparent shadow-lg shadow-primary/25'
                            : isTodayDate
                            ? 'bg-secondary/40 border-border/60 text-foreground'
                            : 'bg-secondary/20 border-border/60 text-foreground hover:bg-secondary/60 hover:border-border'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="selectedWeekDay"
                            className="absolute inset-0 bg-primary -z-10"
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          />
                        )}
                        <div className="flex items-center gap-4 z-10">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm ${
                            isTodayDate && !isSelected ? 'bg-primary text-primary-foreground' : isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-card text-foreground border border-border/80'
                          }`}>
                            <span className="text-xs uppercase text-muted-foreground font-black">{format(date, 'eee')}</span>
                            <span className="text-lg text-foreground leading-none mt-0.5">{format(date, 'd')}</span>
                          </div>
                          <div>
                            <h4 className={`text-base font-black ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {dayTasks.length > 0 ? `${dayTasks.length} Tasks Scheduled` : 'No Tasks'}
                            </h4>
                            <div className={`text-sm font-semibold flex items-center gap-3 mt-1 ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                              {dayTasks.length > 0 && <span>{dayCompletedCount}/{dayTasks.length} Done</span>}
                              {dayHabitsCompleted > 0 && <span className="flex items-center gap-1"><Lucide.CheckCircle2 size={14} className={isSelected ? '' : 'text-primary'} /> {dayHabitsCompleted} Habits</span>}
                              {hasNote && <span className="flex items-center gap-1"><Lucide.BookOpen size={14} className={isSelected ? '' : 'text-purple-500'} /> Note</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 z-10">
                          <span className={`text-sm font-extrabold px-3 py-1 rounded-lg backdrop-blur-md shadow-sm ${
                            isSelected ? 'bg-primary-foreground/25 text-primary-foreground' : 'bg-card/90 border border-border/80 text-foreground'
                          }`}>
                            Score: {dayScore}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="md:col-span-1 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="tile p-6 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="border-b border-border/60 pb-5">
            <h3 className="text-lg font-black tracking-tight text-foreground">
              {format(new Date(selectedDate), 'EEEE, MMM dd, yyyy')}
            </h3>
            <div className="flex items-center justify-between mt-3 text-sm font-bold text-muted-foreground">
              <span>Focus Level:</span>
              <span className="text-primary text-foreground text-base bg-primary/10 px-2 py-0.5 rounded-md">{selectedDateScore}%</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Lucide.Smile size={14} className="text-primary" /> Daily Mood Rating
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {Object.entries(moodEmojis).map(([key, item]) => {
                const isSelected = selectedMood === key;
                const IconComponent = item.icon;

                return (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    key={key}
                    onClick={() => handleMoodSelect(key)}
                    className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected ? item.activeCls : item.idleCls
                    }`}
                    title={item.label}
                  >
                    <IconComponent size={17} className={isSelected ? 'text-white stroke-[2.5px]' : 'stroke-[2px]'} />
                    
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Lucide.CheckSquare size={14} className="text-primary" /> Focus Tasks ({selectedDateTasks.length})
            </label>
            
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map(t => (
                  <motion.div 
                    key={t.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTaskCompletion(t.id)}
                    className="flex items-center gap-3 text-sm font-bold text-foreground bg-secondary/80 hover:bg-secondary p-3 border border-border/60 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/50"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border relative shrink-0 ${
                        t.isCompleted
                          ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                          : 'border-muted-foreground/60 hover:border-primary'
                      }`}
                    >
                      {t.isCompleted && (
                        <motion.span
                          key={t.id + "_cal_pulse"}
                          initial={{ scale: 0.6, opacity: 0.9 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="absolute inset-0 rounded-md border-2 border-primary pointer-events-none"
                        />
                      )}
                      <motion.div
                        initial={false}
                        animate={
                          t.isCompleted 
                            ? { scale: [0, 1], rotate: [-45, 0] } 
                            : { scale: 0, rotate: 0 }
                        }
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <Lucide.Check size={11} className="stroke-[3.5px]" />
                      </motion.div>
                    </motion.div>
                    <span className={`truncate flex-1 transition-all ${t.isCompleted ? 'line-through text-muted-foreground opacity-70' : 'text-foreground'}`}>{t.title}</span>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-secondary/30 rounded-2xl border-2 border-dashed border-border/60">
                  <Lucide.Sparkles size={24} className="text-primary/40 mb-2" />
                  <p className="text-sm font-bold text-foreground">A clear day</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1 max-w-[180px]">No tasks are scheduled for this date.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Lucide.Repeat size={14} className="text-primary" /> Daily Habits ({habits.length})
            </label>
            
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {habits.length > 0 ? (
                habits.map(h => {
                  const isCompleted = h.completedDates.includes(selectedDate);
                  return (
                    <motion.div 
                      key={h.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleHabitCompletion(h.id, selectedDate)}
                      className="flex items-center gap-3 text-sm font-bold text-foreground bg-secondary/40 hover:bg-secondary p-3 border border-border/60 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/50"
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border relative shrink-0 ${
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                            : 'border-muted-foreground/60 hover:border-primary'
                        }`}
                      >
                        {isCompleted && (
                          <motion.span
                            key={h.id + "_cal_pulse"}
                            initial={{ scale: 0.6, opacity: 0.9 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            className="absolute inset-0 rounded-md border-2 border-primary pointer-events-none"
                          />
                        )}
                        <motion.div
                          initial={false}
                          animate={
                            isCompleted 
                              ? { scale: [0, 1], rotate: [-45, 0] } 
                              : { scale: 0, rotate: 0 }
                          }
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        >
                          <Lucide.Check size={11} className="stroke-[3.5px]" />
                        </motion.div>
                      </motion.div>
                      <span className={`truncate flex-1 transition-all ${isCompleted ? 'line-through text-muted-foreground opacity-70' : 'text-foreground'}`}>{h.name}</span>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-secondary/30 rounded-2xl border-2 border-dashed border-border/60">
                  <Lucide.Repeat size={24} className="text-primary/40 mb-2" />
                  <p className="text-sm font-bold text-foreground">No habits yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Lucide.BookOpen size={14} className="text-purple-500" /> Reflection Notes
              </label>
              
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {isSavedIndicator ? (
                    <motion.span 
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md"
                    >
                      <Lucide.Check size={12} strokeWidth={3} /> Saved
                    </motion.span>
                  ) : isNoteEditing ? (
                    <div className="flex items-center gap-1.5">
                      {(journalContent.trim() || journalTitle.trim()) && (
                        <button
                          type="button"
                          onClick={() => setIsNoteEditing(false)}
                          className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <motion.button
                        key="save"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveJournal}
                        disabled={!journalContent.trim() && !journalTitle.trim()}
                        className="text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Lucide.Save size={12} />
                        <span>Save Entry</span>
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      key="edit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsNoteEditing(true)}
                      className="text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Lucide.Edit3 size={12} />
                      <span>Edit</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {totalMissedCount > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-500">
                <Lucide.AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block mb-1">Missed Objectives</span>
                  You missed {uncompletedTasksCount} task(s) and {uncompletedHabitsCount} habit(s) on this day. Use this space to reflect on the blockers and how you can overcome them next time.
                </div>
              </div>
            )}

            {!isNoteEditing && (journalContent.trim() || journalTitle.trim()) ? (
              <div className="p-4 bg-secondary/30 border border-border/70 rounded-2xl space-y-2.5 backdrop-blur-sm">
                {journalTitle.trim() && (
                  <h4 className="text-sm font-black text-foreground tracking-tight flex items-center gap-2 border-b border-border/40 pb-2">
                    <Lucide.PenLine size={14} className="text-primary shrink-0" />
                    <span>{journalTitle}</span>
                  </h4>
                )}
                <div className="text-xs text-foreground/90 font-medium leading-relaxed max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  <MarkdownRenderer content={journalContent} />
                </div>
              </div>
            ) : !isNoteEditing ? (
              <div className="flex flex-col items-center justify-center py-6 text-center bg-secondary/20 rounded-2xl border-2 border-dashed border-border/60 p-4">
                <Lucide.BookOpen size={22} className="text-purple-400/50 mb-1.5" />
                <p className="text-xs font-bold text-foreground">No reflection recorded for this day</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">Record learnings, obstacles, and wins.</p>
                <button
                  type="button"
                  onClick={() => setIsNoteEditing(true)}
                  className="text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lucide.PlusCircle size={13} />
                  <span>Write Reflection</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.input
                  whileFocus={{ scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                  type="text"
                  placeholder="Entry Title (Optional)..."
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="w-full text-sm font-black px-4 py-3 bg-secondary/40 rounded-xl border border-border/60 outline-none text-foreground placeholder:text-muted-foreground focus:bg-secondary/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                />

                <motion.textarea
                  whileFocus={{ scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                  placeholder={totalMissedCount > 0 ? "What caused you to miss your goals today? How can you adjust..." : "Write down any notes, thoughts, and blocks encountered today..."}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  rows={6}
                  className="w-full text-sm font-medium p-4 bg-secondary/40 rounded-xl border border-border/60 outline-none resize-none text-foreground placeholder:text-muted-foreground focus:bg-secondary/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/20 transition-all leading-relaxed shadow-sm custom-scrollbar"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CalendarFeature;
