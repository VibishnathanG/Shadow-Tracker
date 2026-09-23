'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { CustomToolDefinition, ToolDefinition } from './aiTypes';
import {
  BUILTIN_TOOL_DEFINITIONS,
  getCustomTools,
  saveCustomTool,
  deleteCustomTool,
} from './aiTools';

interface AiToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiToolsModal({ isOpen, onClose }: AiToolsModalProps) {
  const [activeTab, setActiveTab] = useState<'registry' | 'create'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTools, setCustomTools] = useState<CustomToolDefinition[]>([]);

  // Create Custom Tool Form State
  const [toolName, setToolName] = useState('');
  const [toolCategory, setToolCategory] = useState<CustomToolDefinition['category']>('Custom');
  const [toolDescription, setToolDescription] = useState('');
  const [actionType, setActionType] = useState<'prompt_injection' | 'custom_event' | 'webhook'>('prompt_injection');
  const [eventName, setEventName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [returnTemplate, setReturnTemplate] = useState('');
  const [paramsJsonText, setParamsJsonText] = useState(`{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "Topic or parameter value"
    }
  },
  "required": ["topic"]
}`);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Load custom tools
  const reloadCustomTools = () => {
    setCustomTools(getCustomTools());
  };

  useEffect(() => {
    if (isOpen) {
      reloadCustomTools();
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
  const allTools = useMemo(() => {
    const list = [
      ...BUILTIN_TOOL_DEFINITIONS.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
        isCustom: false,
        id: t.function.name,
      })),
      ...customTools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
        isCustom: true,
        id: t.id,
        category: t.category,
        actionType: t.actionType,
      })),
    ];

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q)
    );
  }, [customTools, searchQuery]);

  const handleSaveTool = () => {
    setJsonError(null);

    // Validation
    const cleanName = toolName.trim().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (!cleanName) {
      setJsonError('Tool name is required and should contain alphanumeric characters or underscores.');
      return;
    }
    if (!toolDescription.trim()) {
      setJsonError('Description is required so the AI model knows when to call this tool.');
      return;
    }

    let parsedParams: any;
    try {
      parsedParams = JSON.parse(paramsJsonText);
      if (!parsedParams || parsedParams.type !== 'object') {
        throw new Error('Root schema must have "type": "object"');
      }
    } catch (err: unknown) {
      setJsonError(`Invalid JSON Schema: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    saveCustomTool({
      name: cleanName,
      category: toolCategory,
      description: toolDescription.trim(),
      parameters: parsedParams,
      actionType,
      actionConfig: {
        eventName: actionType === 'custom_event' ? eventName.trim() : undefined,
        webhookUrl: actionType === 'webhook' ? webhookUrl.trim() : undefined,
        returnTemplate: actionType === 'prompt_injection' ? returnTemplate.trim() : undefined,
      },
    });

    reloadCustomTools();
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);

    // Reset form
    setToolName('');
    setToolDescription('');
    setActiveTab('registry');
  };

  const handleDeleteTool = (id: string) => {
    deleteCustomTool(id);
    reloadCustomTools();
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
              <Lucide.Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <span>AI Tool Registry &amp; Custom Engine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {allTools.length} Available Tools
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Inspect autonomous tool parameter schemas or define your own custom integrations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
            aria-label="Close"
          >
            <Lucide.X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-border/60 bg-surface/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'registry'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Lucide.Boxes size={14} />
            <span>Active Tools Registry ({allTools.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Lucide.PlusCircle size={14} />
            <span>+ Define Custom Tool</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'registry' ? (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Lucide.Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tool names, parameters, descriptions..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              {saveSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Lucide.CheckCircle2 size={15} />
                  Custom tool successfully added to AI autonomous execution registry!
                </div>
              )}

              {/* Tool Cards */}
              <div className="space-y-3">
                {allTools.map((tool) => {
                  const paramProps = (tool.parameters as any)?.properties || {};
                  const requiredProps = (tool.parameters as any)?.required || [];

                  return (
                    <div
                      key={tool.id}
                      className="p-4 rounded-xl bg-surface-elevated/60 border border-border space-y-2.5 transition-all hover:border-primary/40 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                            {tool.name}
                          </code>
                          {tool.isCustom ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Custom Integration
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-muted-foreground">
                              Built-in Core
                            </span>
                          )}
                        </div>

                        {tool.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTool(tool.id)}
                            className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Delete custom tool"
                          >
                            <Lucide.Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Parameters Specs */}
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                          Parameters Schema:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(paramProps).map(([key, prop]: [string, any]) => {
                            const isReq = requiredProps.includes(key);
                            return (
                              <div
                                key={key}
                                className="px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/70 text-[11px] font-mono flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-foreground">{key}</span>
                                  <span className="text-muted-foreground text-[10px]">({prop.type})</span>
                                </div>
                                {isReq ? (
                                  <span className="text-[9px] font-bold text-rose-400 shrink-0">required</span>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground shrink-0">optional</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Tab 2: Create Custom Tool */
            <div className="space-y-4">
              {/* How-To Guide Banner */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Lucide.Sparkles size={15} />
                  <span>How to Define a Custom AI Tool</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11.5px]">
                  Custom tools empower Shadow AI to perform custom actions on your machine or return specialized domain knowledge.
                  Provide a clean function name, an accurate description (so the model knows <strong>when</strong> to call it), and valid JSON Schema parameters.
                </p>
              </div>

              {jsonError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <Lucide.AlertCircle size={15} className="shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {/* Tool Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Tool Name (lowercase_snake_case)
                  </span>
                  <input
                    type="text"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="e.g. log_reading_page"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Category
                  </span>
                  <select
                    value={toolCategory}
                    onChange={(e) => setToolCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="Tasks">Tasks</option>
                    <option value="Habits">Habits</option>
                    <option value="Health">Health</option>
                    <option value="Wealth">Wealth</option>
                    <option value="System">System</option>
                    <option value="Automation">Automation</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Description (Crucial for AI Decision Engine)
                </span>
                <textarea
                  rows={2}
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  placeholder="e.g. Record pages read in a book to track daily reading volume..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Action Type */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                  Execution Action Type
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'prompt_injection', label: 'Prompt Return Template' },
                    { id: 'custom_event', label: 'DOM CustomEvent' },
                    { id: 'webhook', label: 'HTTP Webhook POST' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        actionType === act.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-surface text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action specific config */}
              {actionType === 'custom_event' && (
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Event Name (Dispatched via window.dispatchEvent)
                  </span>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. shadow_custom_reading_logged"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>
              )}

              {actionType === 'webhook' && (
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Target Webhook URL
                  </span>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-webhook-endpoint.com/api"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>
              )}

              {actionType === 'prompt_injection' && (
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Custom Return Message Template
                  </span>
                  <input
                    type="text"
                    value={returnTemplate}
                    onChange={(e) => setReturnTemplate(e.target.value)}
                    placeholder="e.g. Successfully tracked reading progress in local session."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              )}

              {/* JSON Schema Parameters */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Parameters JSON Schema (OpenAI Function Calling format)
                </span>
                <textarea
                  rows={7}
                  value={paramsJsonText}
                  onChange={(e) => setParamsJsonText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground font-mono text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveTool}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lucide.Check size={14} />
                  <span>Register Custom Tool</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
