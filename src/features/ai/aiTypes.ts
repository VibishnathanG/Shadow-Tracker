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
  timestamp: number;
}

export interface AiEndpointConfig {
  baseUrl: string;
  model: string;
  apiKey: string; // Session-only!
  isLocal: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
