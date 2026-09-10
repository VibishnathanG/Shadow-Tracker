'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { format, parseISO } from 'date-fns';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

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

// Helper to strip markdown symbols for clean snippet previews in sidebar
function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [Code Block] ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const NotesFeature: React.FC = () => {
  const { notes, saveNote, deleteNote } = useShadowTrackerStore();
  const todayStr = getTodayDateString();

  const [selectedNoteId, setSelectedNoteId] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState(todayStr);
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(() => {
    const existing = useShadowTrackerStore.getState().notes.find(n => n.id === todayStr);
    const hasContent = Boolean(existing && (existing.content?.trim() || existing.title?.trim()));
    return !hasContent;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const existing = notes.find(n => n.id === selectedNoteId || n.date === selectedNoteId);
    if (existing) {
      setNoteTitle(existing.title || '');
      setNoteContent(existing.content);
      setNoteDate(existing.date || existing.id);
      // Always open in reading view by default for past notes or if any content is already present!
      const hasContent = Boolean(existing.content?.trim() || existing.title?.trim());
      setIsEditing(!hasContent);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteDate(selectedNoteId);
      // If no content, open by default in editing mode
      setIsEditing(true);
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

  // Insert markdown helpers into the textarea at cursor position
  const insertMarkdown = useCallback((prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNoteContent(prev => prev + prefix + defaultPlaceholder + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end) || defaultPlaceholder;
    const replacement = prefix + selectedText + suffix;
    const newContent = noteContent.substring(0, start) + replacement + noteContent.substring(end);
    setNoteContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  }, [noteContent]);

  const filteredNotes = useMemo(() => {
    // Strictly deduplicate by date so there is at most 1 entry per day
    const map = new Map<string, typeof notes[0]>();
    notes.forEach(n => {
      const d = n.date || n.id;
      if (!map.has(d) || (n.updatedAt && map.get(d)!.updatedAt < n.updatedAt)) {
        map.set(d, n);
      }
    });
    const unique = Array.from(map.values());

    return unique.filter(note => {
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        (note.title || '').toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.date.includes(searchQuery)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, searchQuery]);

  const wordCount = useMemo(() => {
    if (!noteContent.trim()) return 0;
    return noteContent.trim().split(/\s+/).length;
  }, [noteContent]);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch md:h-[calc(100vh-80px)] md:overflow-hidden min-h-0">
      <AmbientArt />

      {/* ── SIDEBAR: REFLECTION SEARCH & ENTRY LIST ── */}
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
            Mindful reflections & wisdom
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
            onClick={() => {
              const todayNote = notes.find(n => n.id === todayStr);
              const hasContent = Boolean(todayNote && (todayNote.content?.trim() || todayNote.title?.trim()));
              setSelectedNoteId(todayStr);
              setIsEditing(!hasContent);
            }}
            className={`w-full shrink-0 flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all shadow-sm backdrop-blur-md cursor-pointer ${
              selectedNoteId === todayStr && !notes.some(n => n.id === todayStr)
                ? 'bg-primary/15 border-primary/60 text-foreground ring-1 ring-primary/30'
                : 'bg-card/80 border-border/80 hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lucide.PlusCircle size={16} className={selectedNoteId === todayStr && !notes.some(n => n.id === todayStr) ? 'text-primary' : ''} /> 
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
                const cleanSnippet = stripMarkdown(n.content);
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
                    <motion.p layout="position" className={`relative z-10 text-xs line-clamp-2 leading-relaxed font-medium ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                      {cleanSnippet || 'No content...'}
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

      {/* ── MAIN PANEL: JOURNAL VIEWER & RAW EDITOR ── */}
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

          {/* Top Action Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-border/60 pb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2 bg-primary/15 rounded-xl text-primary"
              >
                <Lucide.BookOpen size={18} />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Journal Reflection
                </h3>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(noteDate), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>

            {/* Segmented View / Edit Mode Capsule & Save Controls */}
            <div className="flex items-center gap-3">
              {/* View / Edit Mode Switcher Capsule */}
              <div className="flex items-center p-1 bg-secondary/50 border border-border/60 rounded-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEditing
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  }`}
                  title="Rendered Markdown View"
                >
                  <Lucide.Eye size={13} />
                  <span>Reading View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEditing
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  }`}
                  title="Raw Markdown Editor"
                >
                  <Lucide.Edit3 size={13} />
                  <span>Raw Editor</span>
                </button>
              </div>

              {/* Save Indicator / Button */}
              <AnimatePresence mode="wait">
                {isSavedIndicator ? (
                  <motion.span 
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    className="text-xs font-bold text-foreground flex items-center gap-1.5 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30"
                  >
                    <Lucide.Check size={14} className="text-emerald-500" /> Saved
                  </motion.span>
                ) : (
                  <motion.button
                    key="save-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={!noteContent.trim() && !noteTitle.trim()}
                    className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lucide.Save size={14} />
                    <span>Save</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Delete Button */}
              {notes.some(n => n.id === selectedNoteId) && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="p-2 text-muted-foreground hover:text-red-500 rounded-xl transition-colors bg-red-500/5 hover:bg-red-500/15 cursor-pointer border border-transparent hover:border-red-500/20"
                  title="Delete Entry"
                >
                  <Lucide.Trash2 size={15} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Date Selector Row */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-3 border border-border/60 rounded-2xl transition-colors backdrop-blur-md shrink-0 mt-3">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <Lucide.Calendar size={14} className="text-primary" /> 
              Entry Date
            </span>
            <input
              type="date"
              value={noteDate}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                setNoteDate(val);
                setSelectedNoteId(val);
              }}
              className="text-xs px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border/80 rounded-xl text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer font-bold shadow-xs"
            />
          </div>

          {/* View Mode vs Edit Mode Content Body */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0 mt-3 overflow-hidden">
            {isEditing ? (
              /* ── RAW MARKDOWN EDITOR MODE ── */
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Reflection title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full text-lg md:text-xl font-black px-4 py-3 bg-secondary/20 backdrop-blur-sm border border-border/60 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs shrink-0"
                />

                {/* Markdown Formatting Helper Toolbar */}
                <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-secondary/40 border border-border/60 rounded-xl backdrop-blur-md shrink-0 text-xs text-muted-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1 text-primary">Insert:</span>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**', 'bold text')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground font-bold transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Bold (**text**)"
                  >
                    <Lucide.Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*', 'italic text')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground italic transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Italic (*text*)"
                  >
                    <Lucide.Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground font-black transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Heading (## Heading)"
                  >
                    <Lucide.Heading size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- [ ] ', '', 'Task')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Checklist task (- [ ])"
                  >
                    <Lucide.CheckSquare size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ', '', 'Bullet item')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Bullet List (- item)"
                  >
                    <Lucide.List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ', '', 'Wisdom or reflection...')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Blockquote (> quote)"
                  >
                    <Lucide.Quote size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('```typescript\n', '\n```', 'console.log("mana");')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground font-mono transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Code Block (```)"
                  >
                    <Lucide.Code size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('[', '](https://)', 'Link title')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Link [title](url)"
                  >
                    <Lucide.Link size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('| Phase | Action |\n| --- | --- |\n| Sprint 1 | ', ' |', 'Design')}
                    className="px-2 py-1 rounded-md hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/60"
                    title="Table (| col | col |)"
                  >
                    <Lucide.Table size={13} />
                  </button>
                </div>

                {/* Raw Textarea */}
                <div className="flex-1 flex flex-col min-h-0">
                  <textarea
                    ref={textareaRef}
                    placeholder="How was today? What goals did you reach? Record thoughts in Markdown (# Header, **bold**, - [ ] task, ```code)..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full flex-1 min-h-0 text-sm p-4 bg-secondary/20 backdrop-blur-sm border border-border/60 rounded-2xl text-foreground placeholder:text-muted-foreground outline-none resize-none focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono leading-relaxed custom-scrollbar shadow-xs overflow-y-auto"
                  />
                </div>
              </div>
            ) : (
              /* ── BEAUTIFUL MARKDOWN READING VIEW MODE ── */
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2 py-2 space-y-4">
                {/* Rendered Entry Header */}
                <div className="border-b border-border/60 pb-3 flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {noteTitle || 'Untitled Reflection'}
                    </h1>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Recorded for {format(parseISO(noteDate), 'EEEE, MMMM dd, yyyy')}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border/60 cursor-pointer shadow-xs"
                    title="Edit Markdown"
                  >
                    <Lucide.Edit3 size={13} className="text-primary" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Rendered Markdown Body */}
                <div className="flex-1 min-h-0">
                  <MarkdownRenderer content={noteContent} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 flex items-center justify-between text-xs text-muted-foreground font-semibold px-2 pt-3 border-t border-border/50 shrink-0 mt-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Lucide.Info size={13} className="text-primary" /> 
                {isEditing ? 'Raw Markdown Editor' : 'Theme-Apt Markdown View'}
              </span>
              <span className="hidden sm:inline-block w-1 h-3 bg-border/60" />
              <span className="hidden sm:inline-block">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Lucide.Shield size={13} className="text-primary" /> 
              Locally saved
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NotesFeature;
