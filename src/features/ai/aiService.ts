import { AiChatMessage, AiEndpointConfig, TokenUsageInfo } from './aiTypes';
import { getAllActiveToolDefinitions, executeAiToolCall } from './aiTools';

const SESSION_KEY_NAME = 'shadow_ai_session_api_key_v1';
const ENDPOINT_STORAGE_KEY = 'shadow_ai_endpoint_url_v1';
const MODEL_STORAGE_KEY = 'shadow_ai_model_name_v1';
const MAX_CONTEXT_STORAGE_KEY = 'shadow_ai_max_context_v1';

export function getSessionApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(SESSION_KEY_NAME) || '';
}

export function setSessionApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY_NAME, key.trim());
}

export function discardSessionApiKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY_NAME);
}

export function getSavedEndpoint(): string {
  if (typeof window === 'undefined') return 'https://api.openai.com/v1';
  return localStorage.getItem(ENDPOINT_STORAGE_KEY) || 'https://api.openai.com/v1';
}

export function saveEndpoint(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENDPOINT_STORAGE_KEY, url.trim());
}

export function getSavedModel(): string {
  if (typeof window === 'undefined') return 'gpt-4o-mini';
  return localStorage.getItem(MODEL_STORAGE_KEY) || 'gpt-4o-mini';
}

export function saveModel(model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODEL_STORAGE_KEY, model.trim());
}

export function getSavedMaxContext(): number {
  if (typeof window === 'undefined') return 16000;
  const raw = localStorage.getItem(MAX_CONTEXT_STORAGE_KEY);
  return raw ? Number(raw) || 16000 : 16000;
}

export function saveMaxContext(val: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAX_CONTEXT_STORAGE_KEY, String(val));
}

export interface SendMessageResponse {
  finalContent: string;
  toolResults: {
    toolName: string;
    actionSummary: string;
    success: boolean;
  }[];
  updatedHistory: AiChatMessage[];
  tokenUsage?: TokenUsageInfo;
  wasContextRefreshed?: boolean;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil((text || '').length / 4));
}

export async function sendAiChatMessage(
  history: AiChatMessage[],
  config: AiEndpointConfig
): Promise<SendMessageResponse> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;
  const maxContext = config.maxContextTokens || getSavedMaxContext();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Check running token usage of history
  let workingHistory = [...history];
  let wasContextRefreshed = false;

  const currentEstimatedTokens = workingHistory.reduce((acc, m) => {
    return acc + estimateTokens(m.content) + (m.tool_calls ? 60 : 0);
  }, 0);

  // If context exceeds max context threshold, automatically refresh session:
  // Retain the original system prompt with the loaded JSON context, clear intermediate chat turns
  if (currentEstimatedTokens >= maxContext && workingHistory.length > 2) {
    const systemPrompt = workingHistory.find(m => m.role === 'system');
    const lastUserMsg = workingHistory[workingHistory.length - 1];

    workingHistory = [
      systemPrompt || {
        id: 'sys_refreshed_' + Date.now(),
        role: 'system',
        content: 'You are Shadow Tracker AI operating with active tracker context.',
        timestamp: Date.now(),
      },
      {
        id: 'refresh_notice_' + Date.now(),
        role: 'assistant',
        content: `🔄 **Memory Session Auto-Refreshed**: Active conversation exceeded **${maxContext.toLocaleString()} tokens** limit. Historical chat turns were flushed while your original tracker JSON context remains permanently anchored in memory.`,
        timestamp: Date.now(),
      },
      lastUserMsg,
    ];
    wasContextRefreshed = true;
  }

  // Format messages for OpenAI API
  const apiMessages = workingHistory.map(m => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: m.tool_call_id || '',
        content: m.content,
      };
    }
    if (m.tool_calls) {
      return {
        role: 'assistant',
        content: m.content || '',
        tool_calls: m.tool_calls,
      };
    }
    if (m.role === 'system') {
      const now = new Date();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      return {
        role: 'system',
        content: `${m.content}\n\n[Active Turn Timestamp: ${now.toLocaleDateString([], { weekday: 'long' })}, ${now.toISOString().split('T')[0]} ${now.toLocaleTimeString()} (${tz})]`,
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });

  const executedToolSummaries: {
    toolName: string;
    actionSummary: string;
    success: boolean;
  }[] = [];

  let currentMessages = [...apiMessages];
  let finalAssistantContent = '';
  let updatedChatHistory = [...workingHistory];
  let finalUsage: TokenUsageInfo | undefined;

  const activeTools = getAllActiveToolDefinitions();

  // Tool-calling loop (maximum 4 rounds)
  for (let round = 0; round < 4; round++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: currentMessages,
          tools: activeTools,
          tool_choice: 'auto',
          temperature: 0.7,
        }),
      });
    } catch (networkError: unknown) {
      const msg = networkError instanceof Error ? networkError.message : String(networkError);
      if (config.isLocal || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        throw new Error(
          `Cannot connect to local endpoint at ${baseUrl}. Ensure Ollama or LM Studio is running and CORS is enabled (e.g. OLLAMA_ORIGINS="*" ollama serve). (${msg})`
        );
      }
      throw new Error(`Network error connecting to ${baseUrl}: ${msg}`);
    }

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }
      throw new Error(`AI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('No response message received from AI model');
    }

    // Capture token usage telemetry
    if (data?.usage) {
      finalUsage = {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || ((data.usage.prompt_tokens || 0) + (data.usage.completion_tokens || 0)),
        isEstimated: false,
      };
    } else {
      // Estimate if endpoint didn't provide usage
      const promptChars = JSON.stringify(currentMessages).length;
      const compChars = (message.content || '').length;
      finalUsage = {
        promptTokens: Math.ceil(promptChars / 4),
        completionTokens: Math.ceil(compChars / 4),
        totalTokens: Math.ceil((promptChars + compChars) / 4),
        isEstimated: true,
      };
    }

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      currentMessages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls,
      });

      const assistantMsgId = 'ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const assistantChatMsg: AiChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls,
        timestamp: Date.now(),
      };
      updatedChatHistory.push(assistantChatMsg);

      // Execute each tool call
      for (const call of message.tool_calls) {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(call.function.arguments || '{}');
        } catch {
          parsedArgs = {};
        }

        const toolResult = await executeAiToolCall(call.function.name, parsedArgs);
        executedToolSummaries.push(toolResult);

        currentMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });

        updatedChatHistory.push({
          id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
          timestamp: Date.now(),
        });
      }

      continue;
    }

    // Normal message received
    finalAssistantContent = message.content || 'Done.';
    const finalMsgId = 'ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    updatedChatHistory.push({
      id: finalMsgId,
      role: 'assistant',
      content: finalAssistantContent,
      toolExecutionResults: executedToolSummaries.length > 0 ? executedToolSummaries : undefined,
      tokenUsage: finalUsage,
      timestamp: Date.now(),
    });
    break;
  }

  return {
    finalContent: finalAssistantContent,
    toolResults: executedToolSummaries,
    updatedHistory: updatedChatHistory,
    tokenUsage: finalUsage,
    wasContextRefreshed,
  };
}
