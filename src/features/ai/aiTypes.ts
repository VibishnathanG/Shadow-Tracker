export type ContextWindow = 
  | '1w' 
  | '2w' 
  | '1m' 
  | '60d' 
  | '90d' 
  | '6m' 
  | '1y';

export interface ContextWindowOption {
  id: ContextWindow;
  label: string;
  days: number;
  isWarnCost?: boolean;
}

export const CONTEXT_WINDOW_OPTIONS: ContextWindowOption[] = [
  { id: '1w', label: 'Last 1 Week (Recommended)', days: 7 },
  { id: '2w', label: 'Last 2 Weeks', days: 14 },
  { id: '1m', label: 'Last 1 Month (30d)', days: 30 },
  { id: '60d', label: 'Last 60 Days', days: 60 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
  { id: '6m', label: 'Last 6 Months', days: 180, isWarnCost: true },
  { id: '1y', label: 'Last 1 Year (Max)', days: 365, isWarnCost: true },
];

export interface TokenUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  isEstimated?: boolean;
}

export interface ContextSnapshotInfo {
  window: ContextWindow;
  days: number;
  estimate: number;
}

export interface AiChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  toolExecutionResults?: {
    toolName: string;
    actionSummary: string;
    success: boolean;
  }[];
  tokenUsage?: TokenUsageInfo;
  contextSnapshot?: ContextSnapshotInfo;
  timestamp: number;
}

export interface AiEndpointConfig {
  baseUrl: string;
  model: string;
  apiKey: string; // Session-only!
  isLocal: boolean;
  maxContextTokens?: number;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface CustomToolDefinition {
  id: string;
  name: string;
  category: 'Tasks' | 'Habits' | 'Health' | 'Wealth' | 'System' | 'Automation' | 'Custom';
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  actionType: 'prompt_injection' | 'custom_event' | 'webhook';
  actionConfig?: {
    eventName?: string;
    webhookUrl?: string;
    returnTemplate?: string;
  };
  createdAt: string;
}

export interface PromptTemplateItem {
  id: string;
  title: string;
  category: 'Tasks' | 'Habits' | 'Health & Diet' | 'Wealth' | 'Journal' | 'Notifications' | 'Custom';
  prompt: string;
  description?: string;
  icon?: string;
  isCustom?: boolean;
  createdAt: string;
}

export const MAX_CONTEXT_PRESETS: { value: number; label: string }[] = [
  { value: 4000, label: '4k Tokens (Conservative)' },
  { value: 8000, label: '8k Tokens (Balanced)' },
  { value: 16000, label: '16k Tokens (Standard Recommended)' },
  { value: 32000, label: '32k Tokens (Extended)' },
  { value: 64000, label: '64k Tokens (Deep Context)' },
  { value: 128000, label: '128k Tokens (Maximum)' },
];
