'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getCharacterTitle, getXpForLevel } from '@/features/rpg/rpgLevels';
import confetti from 'canvas-confetti';
import { useViewPreference } from '@/lib/viewPreferences';

interface QuoteItem {
  id: string;
  vibe: 'power' | 'wisdom' | 'wealth' | 'tech' | 'health';
  quote: string;
  author?: string;
}

const ARCANE_QUOTES: QuoteItem[] = [
  {
    id: 'q-1',
    vibe: 'power',
    quote: 'A lion does not flinch at the laughter of hyenas. Stay fiercely focused on building your empire.',
    author: 'Ancient Creed'
  },
  {
    id: 'q-2',
    vibe: 'power',
    quote: 'Intensity and unyielding focus are the true currencies of success. Spend them with uncompromising precision.',
    author: 'Shadow Grimoire'
  },
  {
    id: 'q-3',
    vibe: 'wisdom',
    quote: 'To reach new heights and perceive the vastness of the realm, one must be prepared to walk in solitude.',
    author: 'Void Monk'
  },
  {
    id: 'q-4',
    vibe: 'power',
    quote: 'The discipline you endure today becomes the indestructible armor you wield tomorrow. Never retreat.',
    author: 'Iron Sage'
  },
  {
    id: 'q-5',
    vibe: 'wealth',
    quote: 'Gold is merely energy crystallized into currency. True power lies in knowing where to direct its flow.',
    author: 'Arcane Merchant'
  },
  {
    id: 'q-6',
    vibe: 'tech',
    quote: 'Architect the reality you desire to inhabit. Relentless mastery behind the terminal pays compound dividends.',
    author: 'Cyber Alchemist'
  },
  {
    id: 'q-7',
    vibe: 'health',
    quote: 'Care for your mortal vessel with reverence. It is the sole temple capable of manifesting your ambitions.',
    author: 'Vitality Codex'
  },
  {
    id: 'q-8',
    vibe: 'power',
    quote: 'Throw me to the shadows and I will return commanding the abyss. Resilience is forged in high pressure.',
    author: 'Shadow Sovereign'
  },
  {
    id: 'q-9',
    vibe: 'wisdom',
    quote: 'Master your own mind and you conquer the external world. Silence is the sanctuary where great strategies awaken.',
    author: 'Oracle of Mist'
  },
  {
    id: 'q-10',
    vibe: 'wealth',
    quote: 'Patience is the ultimate leverage. Those who master compounding govern the fate of dynasties.',
    author: 'Compound Codex'
  },
  {
    id: 'q-11',
    vibe: 'tech',
    quote: 'Data is raw mana; applied discernment is the spell that converts potential into reality.',
    author: 'Matrix Arcanist'
  },
  {
    id: 'q-12',
    vibe: 'power',
    quote: 'Do not pray for an easy voyage. Pray for the unshakeable will to navigate the fiercest storms.',
    author: 'Abyssal Navigator'
  }
];

const VIBE_CATEGORIES = [
  { id: 'all', label: 'All Arcana', icon: Lucide.Sparkles },
  { id: 'power', label: 'Discipline', icon: Lucide.Flame },
  { id: 'wisdom', label: 'Wisdom', icon: Lucide.Eye },
  { id: 'wealth', label: 'Wealth', icon: Lucide.Coins },
  { id: 'tech', label: 'Cybernetics', icon: Lucide.Terminal },
  { id: 'health', label: 'Vitality', icon: Lucide.Heart },
];

export default function WizardFeature() {
  const { level = 1, xp = 0, settings, addXp } = useShadowTrackerStore();
  const title = getCharacterTitle(level);
  const currentLevelBaseXp = getXpForLevel(level);
  const nextLvlXp = getXpForLevel(level + 1);
  const xpProgress = Math.min(100, Math.max(0, Math.round(((xp - currentLevelBaseXp) / Math.max(1, nextLvlXp - currentLevelBaseXp)) * 100)));

  const [selectedVibe, setSelectedVibe] = useViewPreference('wizardVibe');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState<number>(0);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [isReciting, setIsReciting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customQuoteText, setCustomQuoteText] = useState('');
  const [customQuoteAuthor, setCustomQuoteAuthor] = useState('');
  const [customQuoteVibe, setCustomQuoteVibe] = useState<'power' | 'wisdom' | 'wealth' | 'tech' | 'health'>('wisdom');
  const [customQuotes, setCustomQuotes] = useState<QuoteItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load custom quotes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shadow_wizard_quotes_v1');
      if (stored) {
        setCustomQuotes(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const allQuotes = useMemo(() => {
    return [...customQuotes, ...ARCANE_QUOTES];
  }, [customQuotes]);

  const filteredQuotes = useMemo(() => {
    if (selectedVibe === 'all') return allQuotes;
    return allQuotes.filter(q => q.vibe === selectedVibe);
  }, [allQuotes, selectedVibe]);

  const currentQuote = filteredQuotes[activeQuoteIndex % Math.max(1, filteredQuotes.length)] || allQuotes[0];

  const libraryFilteredQuotes = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    return filteredQuotes.filter(item => {
      if (!q) return true;
      return (
        item.quote.toLowerCase().includes(q) ||
        (item.author || '').toLowerCase().includes(q) ||
        item.vibe.toLowerCase().includes(q)
      );
    });
  }, [filteredQuotes, librarySearch]);

  const handleNextQuote = () => {
    setActiveQuoteIndex(prev => (prev + 1) % filteredQuotes.length);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#06b6d4', '#6366f1', '#e0e7ff']
    });
  };

  const handlePrevQuote = () => {
    setActiveQuoteIndex(prev => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  const handleRandomQuote = () => {
    if (filteredQuotes.length <= 1) return;
    let nextIdx = activeQuoteIndex;
    while (nextIdx === activeQuoteIndex) {
      nextIdx = Math.floor(Math.random() * filteredQuotes.length);
    }
    setActiveQuoteIndex(nextIdx);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#38bdf8', '#a855f7', '#f59e0b']
    });
  };

  // Recite quote using Web Speech API
  const handleRecite = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isReciting) {
      setIsReciting(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentQuote.quote);
    utterance.rate = 0.92;
    utterance.pitch = 0.88;
    utterance.onend = () => setIsReciting(false);
    utterance.onerror = () => setIsReciting(false);

    setIsReciting(true);
    window.speechSynthesis.speak(utterance);
  }, [currentQuote, isReciting]);

  const handleCopyQuote = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`"${currentQuote.quote}" — ${currentQuote.author || 'Shadow Wizard'}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCommuneMascot = () => {
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.35, x: 0.5 },
      colors: ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']
    });
    addXp(10);
    handleRecite();
  };

  const handleAddCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuoteText.trim()) return;

    const newQuote: QuoteItem = {
      id: `custom-${Date.now()}`,
      vibe: customQuoteVibe,
      quote: customQuoteText.trim(),
      author: customQuoteAuthor.trim() || settings.alias || 'Shadow'
    };

    const updated = [newQuote, ...customQuotes];
    setCustomQuotes(updated);
    try {
      localStorage.setItem('shadow_wizard_quotes_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setCustomQuoteText('');
    setCustomQuoteAuthor('');
    setShowAddModal(false);
    setActiveQuoteIndex(0);
    confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
  };

  return (
    <div className="space-y-8 select-none font-sans relative pb-16">
      {/* ── TOP SECTION: COMPACT HORIZONTAL COSMIC SANCTUM ── */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-br from-[#0c081e] via-[#160d33] to-[#0a0718] text-white p-4 sm:p-5 lg:p-6 shadow-2xl shadow-purple-950/40">
        {/* Mystic Background Glows & Starlight */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Floating starlight sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-300"
              style={{
                left: `${10 + (i * 15) % 80}%`,
                bottom: '10%'
              }}
              animate={{
                y: [-5, -90],
                opacity: [0, 0.9, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        {/* Horizontal Layout: Compact Avatar on left, Title & Telemetry on right */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 lg:gap-8">
          {/* Compact Mascot Centerpiece with Dual Arcane Rune Rings */}
          <div className="shrink-0 flex flex-col items-center justify-center relative py-1">
            {/* Arcane Rune Ring Outer (Clockwise rotation) */}
            <motion.svg
              className="absolute w-32 h-32 sm:w-36 sm:h-36 text-purple-400/50 pointer-events-none"
              viewBox="0 0 200 200"
              animate={{ rotate: 360 }}
              transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8 14 6" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <circle
                  key={deg}
                  cx={100 + 95 * Math.cos((deg * Math.PI) / 180)}
                  cy={100 + 95 * Math.sin((deg * Math.PI) / 180)}
                  r="3"
                  className="fill-cyan-300"
                />
              ))}
            </motion.svg>

            {/* Arcane Rune Ring Inner (Counter-Clockwise rotation) */}
            <motion.svg
              className="absolute w-26 h-26 sm:w-30 sm:h-30 text-cyan-400/50 pointer-events-none"
              viewBox="0 0 200 200"
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6 12 4" />
              <polygon
                points="100,20 170,140 30,140"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
                opacity="0.4"
              />
              <polygon
                points="100,180 170,60 30,60"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
                opacity="0.4"
              />
            </motion.svg>

            {/* Floating Animated Avatar Container */}
            <motion.div
              onClick={handleCommuneMascot}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              animate={{
                y: [-4, 4, -4],
                rotate: [-0.5, 0.5, -0.5]
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative z-10 w-22 h-22 sm:w-26 sm:h-26 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-indigo-400 to-cyan-400 shadow-[0_0_28px_rgba(168,85,247,0.55)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] transition-shadow cursor-pointer select-none group"
              title="🧙‍♂️ Click to interact with Shadow Wizard (+10 XP & Voice Recital)!"
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/30 bg-[#07050f] relative shadow-inner">
                <Image
                  src="/shadow_wizard.jpg"
                  alt="Shadow Wizard Mascot"
                  width={104}
                  height={104}
                  className="w-full h-full object-cover object-top scale-105 group-hover:scale-115 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-cyan-500/15 pointer-events-none" />
              </div>

              {/* Companion Badge */}
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-950/95 border border-cyan-400/60 shadow-md shadow-purple-500/50 flex items-center gap-1 text-[8.5px] font-black text-cyan-300 uppercase tracking-wider whitespace-nowrap"
              >
                <Lucide.Sparkles size={9} className="text-cyan-300" />
                <span>Shadow Wizard</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Title, Companion Badge, Lore Quote & Telemetry */}
          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-md">
                The Shadow Wizard Sanctuary
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-black tracking-wider uppercase shadow-xs">
                <Lucide.Flame size={12} className="text-amber-400" />
                <span>Companion Lvl {level}</span>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-purple-200/95 leading-snug font-medium max-w-2xl italic">
              &ldquo;Seek not an easy path through the void, Seeker. Forge the iron discipline that commands darkness into absolute clarity.&rdquo;
            </p>

            {/* Compact RPG Level Progression Bar */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-purple-200">
                <span className="flex items-center gap-1.5">
                  <Lucide.Award size={12} className="text-amber-400" />
                  <span>Title: <strong className="text-white">{title}</strong></span>
                </span>
                <span className="font-mono text-cyan-300 text-[10px] sm:text-[11px]">
                  {xp} / {nextLvlXp} XP ({xpProgress}%)
                </span>
              </div>

              <div className="w-full h-1.5 sm:h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Quick Metrics Badges in Horizontal Row */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs font-semibold pt-0.5">
              <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5 text-[10.5px] sm:text-xs">
                <Lucide.BookOpen size={11} className="text-cyan-300" />
                <span>{allQuotes.length} Wisdom Scrolls</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5 text-[10.5px] sm:text-xs">
                <Lucide.Zap size={11} className="text-amber-400" />
                <span>+10 XP On Wizard Interaction</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-purple-200 flex items-center gap-1.5 text-[10.5px] sm:text-xs">
                <Lucide.Volume2 size={11} className="text-emerald-400" />
                <span>Voice Synthesizer Ready</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE ORACLE ALTAR: DAILY INCANTATIONS & WISDOM ── */}
      <div className="space-y-4">
        {/* Vibe Filter Controls & Inscribe Action */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-2xl border border-border/60 overflow-x-auto no-scrollbar scrollbar-none max-w-full backdrop-blur-md">
            {VIBE_CATEGORIES.map((v) => {
              const Icon = v.icon;
              const isSelected = selectedVibe === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVibe(v.id);
                    setActiveQuoteIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inscribe Scroll Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-foreground font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs hover:border-primary"
              title="Inscribe New Wisdom Scroll"
            >
              <Lucide.Plus size={14} className="text-primary" />
              <span>Inscribe Scroll</span>
            </button>
          </div>
        </div>

        {/* Featured Wisdom Oracle Card */}
        <motion.div
          key={currentQuote.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="relative tile p-6 sm:p-10 rounded-3xl border border-border/80 shadow-xl overflow-hidden backdrop-blur-xl"
        >
          {/* Subtle background rune art */}
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-primary">
            <Lucide.Sparkles size={220} />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header: Vibe badge & Recite/Share Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  {currentQuote.vibe.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  Scroll {activeQuoteIndex + 1} of {filteredQuotes.length}
                </span>
              </div>

              {/* Recite, Copy, Randomize Actions */}
              <div className="flex items-center gap-2">
                {/* Randomize Button */}
                <button
                  onClick={handleRandomQuote}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary/80 hover:bg-secondary border border-border/60 text-foreground transition-all cursor-pointer"
                  title="Random Wisdom Scroll"
                >
                  <Lucide.Shuffle size={13} className="text-primary" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>

                {/* Voice Recite Button with Equalizer Wave */}
                <button
                  onClick={handleRecite}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isReciting
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 animate-pulse'
                      : 'bg-secondary/80 hover:bg-secondary border-border/60 text-foreground'
                  }`}
                  title="Recite Quote with Voice"
                >
                  <Lucide.Volume2 size={14} className={isReciting ? 'animate-bounce text-primary-foreground' : 'text-primary'} />
                  <span>{isReciting ? 'Reciting...' : 'Recite'}</span>
                  {isReciting && (
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-3 bg-primary-foreground animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-primary-foreground animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-2 bg-primary-foreground animate-pulse delay-150 rounded-full" />
                    </span>
                  )}
                </button>

                {/* Copy Button */}
                <button
                  onClick={handleCopyQuote}
                  className="p-2 bg-secondary/80 hover:bg-secondary border border-border/60 text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
                  title="Copy Scroll Text"
                >
                  {copied ? <Lucide.Check size={14} className="text-emerald-500" /> : <Lucide.Copy size={14} />}
                </button>
              </div>
            </div>

            {/* High Contrast Quote Typography */}
            <blockquote className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-relaxed italic border-l-4 border-primary pl-4 sm:pl-6 py-2">
              &ldquo;{currentQuote.quote}&rdquo;
            </blockquote>

            {/* Footer with Author and Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60 gap-4 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1.5">
                <Lucide.Scroll size={15} />
                <span>— {currentQuote.author || 'Shadow Arcanum'}</span>
              </span>

              {/* Carousel Prev/Next Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuote}
                  className="p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
                  title="Previous Scroll"
                >
                  <Lucide.ChevronLeft size={16} />
                </button>

                <button
                  onClick={handleNextQuote}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/25 cursor-pointer active:scale-95"
                  title="Invoke Next Wisdom"
                >
                  <span>Next Wisdom</span>
                  <Lucide.Sparkles size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── ARCANUM ARCHIVE: THE GREAT GRIMOIRE LIBRARY ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
            <Lucide.BookOpen size={18} className="text-primary" />
            <span>Wisdom &amp; Quotes Library ({libraryFilteredQuotes.length} Quotes)</span>
          </h3>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Lucide.Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search wisdom quotes..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="w-full text-xs !pl-9 pr-3 py-2 bg-secondary/40 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Scrolls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {libraryFilteredQuotes.length > 0 ? (
            libraryFilteredQuotes.map((q) => {
              const originalIndex = filteredQuotes.findIndex(fq => fq.id === q.id);
              const isCurrent = currentQuote.id === q.id;

              return (
                <motion.div
                  key={q.id}
                  whileHover={{ y: -3 }}
                  onClick={() => {
                    if (originalIndex !== -1) {
                      setActiveQuoteIndex(originalIndex);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 backdrop-blur-md ${
                    isCurrent
                      ? 'bg-primary/15 border-primary shadow-md shadow-primary/10 ring-2 ring-primary/40'
                      : 'tile hover:border-primary/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-primary border border-border/40">
                        {q.vibe}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Lucide.Sparkles size={11} />
                          <span>Active Altar</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 font-medium leading-relaxed line-clamp-3">
                      &ldquo;{q.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate font-medium">{q.author || 'Ancient Creed'}</span>
                    <span className="flex items-center gap-0.5 text-primary font-bold text-[10px] group-hover:translate-x-0.5 transition-transform">
                      <span>Invoke</span>
                      <Lucide.ChevronRight size={13} />
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-10 text-center text-muted-foreground text-sm space-y-2">
              <Lucide.Scroll size={28} className="mx-auto opacity-40 text-primary" />
              <p>No scrolls match your search in this category.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── INSCRIBE CUSTOM SCROLL MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div 
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="tile border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-primary/15 text-primary">
                    <Lucide.Feather size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Inscribe Wisdom Scroll</h3>
                    <p className="text-xs text-muted-foreground">Add personal aphorisms to the Shadow Wizard library.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary cursor-pointer"
                >
                  <Lucide.X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomQuote} className="space-y-4">
                {/* Vibe Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Arcana Category
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['power', 'wisdom', 'wealth', 'tech', 'health'] as const).map((vibe) => (
                      <button
                        type="button"
                        key={vibe}
                        onClick={() => setCustomQuoteVibe(vibe)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          customQuoteVibe === vibe
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {vibe.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Scroll Inscription
                  </label>
                  <textarea
                    rows={4}
                    maxLength={300}
                    placeholder="Enter words of relentless discipline, focus, or strategy..."
                    value={customQuoteText}
                    onChange={e => setCustomQuoteText(e.target.value)}
                    className="w-full text-sm p-3.5 bg-secondary/30 rounded-2xl border border-border/80 text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none font-medium"
                    autoFocus
                  />
                  {customQuoteText.length >= 300 && (
                    <span className="text-[11px] text-amber-500 font-semibold block animate-fadeIn">
                      Quote inscription limit reached (300/300)
                    </span>
                  )}
                </div>

                {/* Author / Alias */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Inscriber Signature
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder={settings.alias || 'Shadow'}
                    value={customQuoteAuthor}
                    onChange={e => setCustomQuoteAuthor(e.target.value)}
                    className="w-full text-xs p-3 bg-secondary/30 rounded-xl border border-border/80 text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:outline-none font-medium"
                  />
                  {customQuoteAuthor.length >= 80 && (
                    <span className="text-[11px] text-amber-500 font-semibold block animate-fadeIn">
                      Signature limit reached (80/80)
                    </span>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customQuoteText.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground transition-all shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Lucide.Check size={14} />
                    <span>Inscribe Scroll</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
