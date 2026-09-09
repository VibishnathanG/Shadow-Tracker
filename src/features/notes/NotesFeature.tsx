'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { format, parseISO } from 'date-fns';

const AmbientArt = React.memo(() => (
  <div className="dashboard-watermark absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-[-20%] right-[-10%] text-primary"
      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
      transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, scale: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
    >
      <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.3,-40.5C85.5,-25.7,91.7,-10.1,90.4,5C89.1,20.1,80.3,34.7,70,47.1C59.7,59.5,47.9,69.7,33.9,76.5C19.9,83.3,3.7,86.7,-11.4,84.5C-26.5,82.3,-40.5,74.5,-53.4,64.2C-66.3,53.9,-78.1,41.1,-84.6,25.8C-91.1,10.5,-92.3,-7.3,-86.6,-22.6C-80.9,-37.9,-68.3,-50.7,-54.1,-59.4C-39.9,-68.1,-24.1,-72.7,-8,-74.6C8.1,-76.5,24.3,-75.7,45.7,-76.3Z" transform="translate(100 100)" />
      </svg>
    </motion.div>

    <motion.div
      className="absolute bottom-[-15%] left-[-15%] text-primary"
      animate={{ scale: [1, 1.15, 1], opacity: [0.02, 0.04, 0.02] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="500" height="500" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M42.7,-73.4C56.6,-66.1,69.8,-56.3,79.5,-43.3C89.2,-30.3,95.4,-14.1,93.5,1.5C91.6,17.1,81.6,32.1,70.5,45.2C59.4,58.3,47.2,69.5,33.1,76.3C19,83.1,3,85.5,-12.3,83.1C-27.6,80.7,-42.2,73.5,-54.3,62.8C-66.4,52.1,-76,37.9,-81.4,22.1C-86.8,6.3,-88,-11.1,-82.7,-26.4C-77.4,-41.7,-65.6,-54.9,-51.7,-62.4C-37.8,-69.9,-21.8,-71.7,-5.3,-65.4C11.2,-59.1,28.8,-80.7,42.7,-73.4Z" transform="translate(100 100)" />
      </svg>
    </motion.div>
  </div>
));
AmbientArt.displayName = 'AmbientArt';

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95, filter: "blur(2px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.95, filter: "blur(2px)", transition: { duration: 0.15 } }
};

export const NotesFeature: React.FC = () => {
  const { notes, saveNote, deleteNote } = useShadowTrackerStore();
  const todayStr = getTodayDateString();

  const [selectedNoteId, setSelectedNoteId] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(todayStr);
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  useEffect(() => {
    const existing = notes.find(n => n.id === selectedNoteId);
    if (existing) {
      setNoteTitle(existing.title || '');
      setNoteContent(existing.content);
      setNoteDate(existing.date);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteDate(selectedNoteId);
    }
  }, [selectedNoteId, notes]);

  const handleSave = useCallback(async () => {
    if (!noteContent.trim() && !noteTitle.trim()) return;
    await saveNote(noteDate, noteContent.trim(), noteTitle.trim() || undefined);
    
    if (noteDate !== selectedNoteId) {
      setSelectedNoteId(noteDate);
    }

    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 2000);
  }, [noteContent, noteTitle, noteDate, selectedNoteId, saveNote]);

  const handleDelete = useCallback(async () => {
    await deleteNote(selectedNoteId);
    setSelectedNoteId(getTodayDateString());
  }, [deleteNote, selectedNoteId]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        (note.title || '').toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.date.includes(searchQuery)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, searchQuery]);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch md:h-[calc(100vh-80px)] md:overflow-hidden min-h-0">
      <AmbientArt />

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="order-2 md:order-1 md:col-span-1 space-y-5 relative z-10 flex flex-col h-full min-h-0 overflow-hidden"
      >
        <div className="space-y-1">
          <motion.h2 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2"
          >
            <Lucide.PenTool className="text-primary" size={24} />
            Journal
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground font-semibold uppercase tracking-widest pl-8"
          >
            Mindful reflections
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative group"
        >
          <Lucide.Search className="absolute left-3.5 top-3 text-muted-foreground transition-colors group-focus-within:text-primary" size={16} />
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-secondary/40 border border-border/60 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary backdrop-blur-md"
          />
        </motion.div>

        <motion.div 
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-3 flex-1 flex flex-col min-h-0"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -1, boxShadow: "0px 8px 16px -8px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedNoteId(getTodayDateString())}
            className={`w-full shrink-0 flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all shadow-sm backdrop-blur-md ${
              selectedNoteId === todayStr && !notes.some(n=>n.id===todayStr)
                ? 'bg-primary/15 border-primary/60 text-foreground ring-1 ring-primary/30'
                : 'bg-card/80 border-border/80 hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lucide.PlusCircle size={16} className={selectedNoteId === todayStr && !notes.some(n=>n.id===todayStr) ? 'text-primary' : ''} /> 
              Today&apos;s Entry
            </span>
            <span className="text-xs font-bold bg-background/60 px-2.5 py-1 rounded-full border border-border/60 text-foreground">
              {format(new Date(), 'dd MMM')}
            </span>
          </motion.button>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0 pb-2">
            <AnimatePresence mode="popLayout">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(n => {
                const isSelected = n.id === selectedNoteId;
                return (
                  <motion.div
                    layout
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2, 
                      boxShadow: isSelected ? undefined : "0px 10px 20px -10px rgba(0,0,0,0.1)",
                      transition: { type: "spring", stiffness: 500, damping: 25 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    key={n.id}
                    onClick={() => setSelectedNoteId(n.id)}
                    className={`relative p-4 border rounded-2xl cursor-pointer transition-all space-y-2 overflow-hidden backdrop-blur-xl ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-primary/30 shadow-lg'
                        : 'bg-card/80 border-border/80 hover:border-primary/50 hover:bg-card text-foreground'
                    }`}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-note-bg"
                        className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent z-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between text-xs font-bold tracking-wide uppercase">
                      <span className={isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                        {format(parseISO(n.date), 'EEE, MMM dd, yyyy')}
                      </span>
                    </div>
                    <motion.h4 layout="position" className="relative z-10 text-base font-extrabold truncate leading-tight">
                      {n.title || 'Untitled Entry'}
                    </motion.h4>
                    <motion.p layout="position" className={`relative z-10 text-sm line-clamp-2 leading-relaxed font-medium ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                      {n.content || 'No content...'}
                    </motion.p>
                  </motion.div>
                );
              })
            ) : (
              searchQuery.trim() !== '' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground font-medium text-center py-8">
                  No matching journal notes found.
                </motion.p>
              )
            )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedNoteId}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="order-1 md:order-2 md:col-span-2 relative z-10 tile p-6 md:p-8 flex flex-col h-full min-h-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between border-b border-border/60 pb-5">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2 bg-primary/15 rounded-xl text-primary"
              >
                <Lucide.BookOpen size={18} />
              </motion.div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                Journal Editor
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {isSavedIndicator ? (
                  <motion.span 
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    className="text-xs font-bold text-foreground flex items-center gap-1.5 bg-emerald-500/15 px-3 py-1.5 rounded-full"
                  >
                    <Lucide.Check size={14} className="text-emerald-500" /> Saved
                  </motion.span>
                ) : (
                  <motion.button
                    key="save-btn"
                    whileHover={{ scale: 1.05, boxShadow: "0px 4px 12px rgba(var(--primary-rgb),0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={!noteContent.trim() && !noteTitle.trim()}
                    className="px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <Lucide.Save size={16} />
                    Save Note
                  </motion.button>
                )}
              </AnimatePresence>

              {notes.some(n => n.id === selectedNoteId) && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 10, backgroundColor: "rgba(239, 68, 68, 0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="p-2.5 text-foreground hover:text-foreground rounded-xl transition-colors bg-red-500/5"
                  title="Delete Entry"
                >
                  <Lucide.Trash2 size={16} className="text-red-500" />
                </motion.button>
              )}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/30 p-4 border border-border/60 rounded-2xl transition-colors hover:bg-secondary/50 backdrop-blur-md shrink-0 mt-4"
          >
            <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Lucide.Calendar size={16} className="text-primary" /> 
              Scheduled Date
            </span>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="text-sm px-4 py-2 bg-background/80 backdrop-blur-sm border border-border/80 rounded-xl text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer font-bold shadow-sm"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-10 group shrink-0 mt-4"
          >
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              placeholder="Reflection title..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full text-xl md:text-2xl font-black px-5 py-4 bg-secondary/20 backdrop-blur-sm border border-border/60 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 shadow-sm"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 flex-1 flex flex-col min-h-0 mt-4"
          >
            <motion.textarea
              whileFocus={{ scale: 1.005 }}
              placeholder="How was today? What goals did you reach? What blocks did you experience? Record thoughts in Markdown..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full text-sm p-5 bg-secondary/20 backdrop-blur-sm border border-border/60 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none resize-none focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium leading-relaxed custom-scrollbar shadow-sm flex-1 min-h-0 overflow-y-auto"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 flex items-center justify-between text-xs text-muted-foreground font-semibold px-2 pt-3 border-t border-border/50 shrink-0 mt-4"
          >
            <span className="flex items-center gap-1.5"><Lucide.Info size={14} className="text-primary" /> Markdown formatting supported</span>
            <span className="flex items-center gap-1.5"><Lucide.Shield size={14} className="text-primary" /> Locally saved</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NotesFeature;
