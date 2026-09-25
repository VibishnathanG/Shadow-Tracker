'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { AiNeuralLogo } from '@/components/AiNeuralLogo';
import {
  ContextWindow,
  CONTEXT_WINDOW_OPTIONS,
  AiChatMessage,
  AiEndpointConfig,
  MAX_CONTEXT_PRESETS,
} from './aiTypes';
import { compileAiContext } from './aiContext';
import { getSystemTimeInfo } from './aiTimeUtils';
import {
  getSessionApiKey,
  setSessionApiKey,
  discardSessionApiKey,
  getSavedEndpoint,
  saveEndpoint,
  getSavedModel,
  saveModel,
  getSavedMaxContext,
  saveMaxContext,
  sendAiChatMessage,
} from './aiService';
import AiToolsModal from './AiToolsModal';
import AiPromptsModal from './AiPromptsModal';
import { AiMarkdownRenderer } from './AiMarkdownRenderer';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  // Navigation: Stage 1 = Context & Config, Stage 2 = Chat
  const [stage, setStage] = useState<'config' | 'chat'>('config');

  // Sub-modals
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);

  // Stage 1: Context Settings
  const [withContext, setWithContext] = useState<boolean>(true);
  const [selectedWindow, setSelectedWindow] = useState<ContextWindow>('1w');
  const [copiedContext, setCopiedContext] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  // Max Context Tokens Setting
  const [maxContextTokens, setMaxContextTokens] = useState<number>(16000);

  // Endpoint & Key Settings
  const [baseUrl, setBaseUrl] = useState<string>('https://api.openai.com/v1');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [hasStoredKey, setHasStoredKey] = useState<boolean>(false);
  const [keyDiscardedToast, setKeyDiscardedToast] = useState<boolean>(false);

  // Stage 2: Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefreshedNotice, setAutoRefreshedNotice] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
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

  // Initialize saved endpoint, model, max context, and session key
  useEffect(() => {
    if (!isOpen) return;
    const ep = getSavedEndpoint();
    const mod = getSavedModel();
    const key = getSessionApiKey();
    const maxCtx = getSavedMaxContext();
    setBaseUrl(ep);
    setModel(mod);
    setApiKey(key);
    setMaxContextTokens(maxCtx);
    setHasStoredKey(Boolean(key));
  }, [isOpen]);

  // Compiled context for preview
  const compiledContext = useMemo(() => {
    if (!withContext) return null;
    return compileAiContext(selectedWindow);
  }, [withContext, selectedWindow]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (stage === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, stage]);

  const handleCopyJson = async () => {
    if (!compiledContext) return;
    try {
      await navigator.clipboard.writeText(compiledContext.jsonString);
      setCopiedContext(true);
      setTimeout(() => setCopiedContext(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDiscardKey = () => {
    discardSessionApiKey();
    setApiKey('');
    setHasStoredKey(false);
    setKeyDiscardedToast(true);
    setTimeout(() => setKeyDiscardedToast(false), 3000);
  };

  const handleSetPresetEndpoint = (url: string, defaultMod: string) => {
    setBaseUrl(url);
    setModel(defaultMod);
    saveEndpoint(url);
    saveModel(defaultMod);
  };

  const handleMaxContextChange = (val: number) => {
    setMaxContextTokens(val);
    saveMaxContext(val);
  };

  const handleStartSession = () => {
    if (apiKey.trim()) {
      setSessionApiKey(apiKey);
      setHasStoredKey(true);
    }
    saveEndpoint(baseUrl);
    saveModel(model);
    saveMaxContext(maxContextTokens);

    const timeInfo = getSystemTimeInfo();

    let systemInstruction = `You are Shadow Tracker AI - an ultra-capable personal life operating system co-pilot.
You have native access to execute verified tool actions inside the user's local tracker:
- create_task, update_task, complete_task
- create_todo, update_todo, complete_todo
- create_habit, update_habit, log_habit_completion
- create_diet_plan, log_water_intake
- update_wealth_transaction, update_wealth_budget
- create_journal_entry
- configure_notification (schedule alarms and alerts across tasks, habits, todos, and general alerts)
- web_search_query (search live facts, news, people, places, dates, or productivity science)
- and any custom user tools registered in the active tool engine.

LIVE SYSTEM CLOCK & TEMPORAL CONTEXT (LOADED DIRECTLY FROM LOCAL SYSTEM):
- Today's Date: ${timeInfo.currentDate} (${timeInfo.currentDay})
- Current Time: ${timeInfo.currentTime} (${timeInfo.timeZone})
- Tomorrow's Date: ${timeInfo.tomorrowDate}
- Local Timezone: ${timeInfo.timeZone}
- Full Timestamp: ${timeInfo.isoString}

CRITICAL TEMPORAL CONSTRAINTS:
1. Today's date is strictly ${timeInfo.currentDate}. Tomorrow is strictly ${timeInfo.tomorrowDate}.
2. NEVER use outdated training cutoffs (like 2024 or 2025). When scheduling tasks, habits, due dates, or answering time questions, ALWAYS anchor to today (${timeInfo.currentDate}).
3. When the user asks for "today", use ${timeInfo.currentDate}. When "tomorrow", use ${timeInfo.tomorrowDate}.

OPERATIONAL CONSTRAINTS:
1. STRICTLY NEVER perform delete operations. All mutations must be create, update, or mark completed.
2. Whenever the user asks you to schedule, plan, log, or track something, immediately call the matching tool.
3. Be concise, direct, inspiring, and empowering.`;

    if (withContext && compiledContext) {
      systemInstruction += `\n\nCURRENT USER TRACKER CONTEXT (${compiledContext.window} window, ${compiledContext.days} days):\n${compiledContext.jsonString}`;
    } else {
      systemInstruction += `\n\nNo prior user historical context was attached for this session (running in zero-context mode).`;
    }

    const initHistory: AiChatMessage[] = [
      {
        id: 'sys_' + Date.now(),
        role: 'system',
        content: systemInstruction,
        timestamp: Date.now(),
      },
      {
        id: 'ai_welcome_' + Date.now(),
        role: 'assistant',
        content: `Greetings! I'm your **Shadow AI Assistant**. ${
          withContext && compiledContext
            ? `Active tracker context loaded for **${compiledContext.window.toUpperCase()}** (~${compiledContext.tokenEstimate} tokens). Max session context ceiling is set to **${maxContextTokens.toLocaleString()} tokens**.`
            : `Operating in **zero-context mode**.`
        }\n\nI can autonomously manage your system:
• ⚡ **Tasks & ToDos**: Create, prioritize, and check off items
• 🔄 **Routines & Habits**: Add habits, log completions, boost streaks
• 🔔 **Alarms & Notifications**: Configure alerts for tasks, habits, and todos
• 🥗 **Diet & Hydration**: Log water, design custom meal plans
• 💎 **Wealth & Budget**: Track expenses and manage budgets
• 📖 **Journal**: Capture reflections and brain dumps
• 🌐 **Knowledge & Web**: Query productivity and health science
• 🛠️ **Custom Tools**: Extend capabilities with custom integrations

Click **"Day-to-Day Prompts"** or **"Tools & Engine"** above, or type your request below!`,
        timestamp: Date.now(),
      },
    ];

    setMessages(initHistory);
    setStage('chat');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if (!prompt || isLoading) return;

    setErrorMsg(null);
    setInputPrompt('');

    const userMsg: AiChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    const config: AiEndpointConfig = {
      baseUrl,
      model,
      apiKey: apiKey.trim() || getSessionApiKey(),
      isLocal: baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'),
      maxContextTokens,
    };

    try {
      const response = await sendAiChatMessage(nextHistory, config);
      setMessages(response.updatedHistory);
      if (response.wasContextRefreshed) {
        setAutoRefreshedNotice(true);
        setTimeout(() => setAutoRefreshedNotice(false), 6000);
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPromptFromLibrary = (promptText: string) => {
    setInputPrompt(promptText);
    setIsPromptsModalOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative"
        >
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-surface-elevated/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <AiNeuralLogo size={28} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                  <span>Shadow AI Assistant</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Autonomous Engine
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {stage === 'config'
                    ? 'Configure Context Timeframe, Memory Ceilings & Sovereign Privacy'
                    : withContext
                    ? `Context: ${selectedWindow.toUpperCase()} (~${compiledContext?.tokenEstimate || 0} tokens) • Limit: ${maxContextTokens.toLocaleString()} tokens`
                    : 'Zero-Context Session'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {stage === 'chat' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPromptsModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Open Day-to-Day Prompts Library"
                  >
                    <Lucide.Sparkles size={13} className="text-primary" />
                    <span className="hidden sm:inline">Prompts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsToolsModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="View Tools, Parameters & Custom Integrations"
                  >
                    <Lucide.Wrench size={13} className="text-purple-400" />
                    <span className="hidden sm:inline">Tools</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStage('config')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Configure Context or API Endpoint"
                  >
                    <Lucide.SlidersHorizontal size={13} />
                    <span className="hidden sm:inline">Setup</span>
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Close"
              >
                <Lucide.X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          {stage === 'config' ? (
            /* ================= STAGE 1: PRE-FLIGHT CONTEXT & PROVIDER ================= */
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* 1. Context Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lucide.BrainCircuit size={14} className="text-primary" />
                  1. Context Feeding Preference
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithContext(true)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      withContext
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20 text-foreground'
                        : 'bg-surface-elevated/50 border-border text-muted-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Lucide.FileText size={14} className={withContext ? 'text-primary' : ''} />
                        With Historical Context
                      </span>
                      {withContext && <Lucide.CheckCircle2 size={15} className="text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Feeds tasks, habits, water, wealth, and logs for personalized coaching and autonomous updates.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithContext(false)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      !withContext
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20 text-foreground'
                        : 'bg-surface-elevated/50 border-border text-muted-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Lucide.ZapOff size={14} className={!withContext ? 'text-primary' : ''} />
                        Without Context (Blank)
                      </span>
                      {!withContext && <Lucide.CheckCircle2 size={15} className="text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Zero token context overhead. AI can still execute tools (create tasks, todos, logs) on command.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Context Window Selection */}
              {withContext && (
                <div className="space-y-3.5 p-4 rounded-xl bg-surface-elevated/50 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Lucide.CalendarRange size={14} className="text-primary" />
                      Time Window Selection
                    </label>
                    {compiledContext && (
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        Est. ~{compiledContext.tokenEstimate} tokens
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONTEXT_WINDOW_OPTIONS.map((opt) => {
                      const isSelected = selectedWindow === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedWindow(opt.id)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25'
                              : opt.isWarnCost
                              ? 'bg-surface text-amber-500/90 border-amber-500/30 hover:border-amber-500/60'
                              : 'bg-surface text-secondary hover:text-foreground border-border hover:border-primary/40'
                          }`}
                        >
                          <span>{opt.label.replace(' (Recommended)', '')}</span>
                          {opt.isWarnCost && (
                            <span className="text-[9px] opacity-80 uppercase tracking-tighter">High Token Cost</span>
                          )}
                          {opt.id === '1w' && (
                            <span className={`text-[9px] uppercase tracking-tighter ${isSelected ? 'text-primary-foreground/90' : 'text-emerald-400'}`}>
                              Optimal
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Warning for 6 Months or 1 Year */}
                  {(selectedWindow === '6m' || selectedWindow === '1y') && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5"
                    >
                      <Lucide.AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Token Cost Advisory:</span> Selecting{' '}
                        <strong>{selectedWindow === '6m' ? '6 Months' : '1 Year (Max)'}</strong> generates a large context payload (~{compiledContext?.tokenEstimate} tokens). We strongly advise sticking with <strong>1 Week</strong> or <strong>1 Month</strong> to avoid high token consumption and network latency.
                      </div>
                    </motion.div>
                  )}

                  {/* Context JSON Preview & Copy Option */}
                  {compiledContext && (
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowRawJson(!showRawJson)}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Lucide.Code2 size={13} />
                          {showRawJson ? 'Hide Context JSON Structure' : 'Inspect Context JSON Structure'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyJson}
                          className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs font-bold text-foreground hover:bg-foreground/5 transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          {copiedContext ? (
                            <>
                              <Lucide.Check size={13} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Lucide.Copy size={13} />
                              <span>Copy JSON Context</span>
                            </>
                          )}
                        </button>
                      </div>

                      {showRawJson && (
                        <motion.pre
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 rounded-xl bg-background/80 border border-border font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-48 scrollbar-thin"
                        >
                          {compiledContext.jsonString}
                        </motion.pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Provider & Key Configuration */}
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-elevated/50 border border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lucide.Cpu size={14} className="text-primary" />
                  Endpoint &amp; API Key (OpenAI-Compatible)
                </label>

                {/* Endpoint Preset Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPresetEndpoint('https://api.openai.com/v1', 'gpt-4o-mini')}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      baseUrl === 'https://api.openai.com/v1'
                        ? 'bg-primary/20 text-primary border-primary'
                        : 'bg-surface text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    OpenAI Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetEndpoint('http://localhost:11434/v1', 'llama3.2')}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      baseUrl === 'http://localhost:11434/v1'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-surface text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    Local Ollama (:11434)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetEndpoint('http://localhost:1234/v1', 'local-model')}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      baseUrl === 'http://localhost:1234/v1'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : 'bg-surface text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    Local LM Studio (:1234)
                  </button>
                </div>

                {/* URL & Model Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground block mb-1">Base URL</span>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground block mb-1">Model Name</span>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                {/* API Key (Strictly Session Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Lucide.Key size={12} />
                      API Key (Stored in sessionStorage only)
                    </span>
                    {hasStoredKey && (
                      <button
                        type="button"
                        onClick={handleDiscardKey}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Lucide.Trash2 size={11} />
                        Discard API Key
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        baseUrl.includes('localhost')
                          ? 'Optional for local Ollama / LM Studio'
                          : 'sk-proj-... (Never saved to disk)'
                      }
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <p className="text-[10.5px] text-muted-foreground mt-1">
                    * For security, your key is strictly stored in memory/sessionStorage and wiped automatically when the session terminates.
                  </p>
                </div>

                {keyDiscardedToast && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                    <Lucide.CheckCircle2 size={13} />
                    API key discarded from browser session.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= STAGE 2: CHAT CONVERSATION & TOOLS ================= */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background/50">
              {/* Context Memory Ceiling Notice */}
              {autoRefreshedNotice && (
                <div className="px-4 py-2 bg-primary/10 border-b border-primary/25 text-xs text-primary font-bold flex items-center gap-2 shrink-0">
                  <Lucide.RefreshCw size={14} className="animate-spin" />
                  <span>Session memory auto-refreshed to preserve speed &amp; stay within {maxContextTokens.toLocaleString()} tokens ceiling. Original JSON context remains anchored.</span>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages
                  .filter((m) => m.role !== 'system')
                  .map((msg) => {
                    const isUser = msg.role === 'user';
                    const isTool = msg.role === 'tool';

                    if (isTool) {
                      return null;
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 rounded-tr-xs'
                              : 'bg-surface border border-border text-foreground shadow-sm rounded-tl-xs'
                          }`}
                        >
                          <AiMarkdownRenderer content={msg.content} isUser={isUser} />

                          {/* Executed Tools Badges */}
                          {msg.toolExecutionResults && msg.toolExecutionResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Lucide.Cpu size={12} className="text-emerald-400" />
                                Executed Autonomous Actions:
                              </span>
                              {msg.toolExecutionResults.map((tr, idx) => (
                                <div
                                  key={idx}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2"
                                >
                                  <Lucide.CheckCircle2 size={13} className="shrink-0" />
                                  <span>{tr.actionSummary}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Telemetry Info Pill */}
                          {!isUser && msg.tokenUsage && (
                            <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              <span className="flex items-center gap-1 text-primary">
                                <Lucide.Activity size={10} />
                                Tokens: {msg.tokenUsage.promptTokens} in + {msg.tokenUsage.completionTokens} out ({msg.tokenUsage.totalTokens} total)
                              </span>
                              <span>•</span>
                              <span>
                                Context: {withContext ? `${selectedWindow.toUpperCase()} (${compiledContext?.days || 7}d)` : 'None'}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground px-2 pt-1 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}

                {isLoading && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-surface border border-border w-fit text-xs text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="font-medium animate-pulse">Shadow AI is reasoning &amp; executing actions...</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                    <Lucide.AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold">Error:</span> {errorMsg}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Action Suggestion Bar */}
              <div className="px-4 py-2 bg-surface/40 border-t border-border/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPromptsModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Lucide.Compass size={12} />
                  <span>Day-to-Day Prompts</span>
                </button>

                {[
                  'Schedule MITs for tomorrow',
                  'Set alarm for Meditation at 08:00',
                  'Log 500ml water and routine',
                  'Create 2200 kcal high-protein plan',
                  'Record ₹450 expense in Food',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-full bg-surface-elevated hover:bg-surface border border-border text-[10.5px] font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    ✦ {suggestion}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-surface-elevated/70 border-t border-border shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ask anything or request actions (e.g. 'Create task', 'Set alarm', 'Log water')..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-hidden focus:border-primary disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isLoading}
                    className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/25 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Lucide.Send size={15} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal Footer (Stage 1 Only) */}
          {stage === 'config' && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/80 bg-surface-elevated/70 shrink-0">
              <span className="text-[11px] text-muted-foreground font-mono">
                {withContext ? `Context: ${selectedWindow.toUpperCase()} | Max: ${maxContextTokens.toLocaleString()}` : 'No context'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartSession}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start AI Session</span>
                  <Lucide.ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sub-Modal: Tools & Parameters Viewer & Custom Tool Engine */}
      <AiToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
      />

      {/* Sub-Modal: Day-to-Day Prompts Library */}
      <AiPromptsModal
        isOpen={isPromptsModalOpen}
        onClose={() => setIsPromptsModalOpen(false)}
        onSelectPrompt={handleSelectPromptFromLibrary}
      />
    </>
  );
}
