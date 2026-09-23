import { AiChatMessage, AiEndpointConfig } from './aiTypes';
import { AI_TOOL_DEFINITIONS, executeAiToolCall } from './aiTools';

const SESSION_KEY_NAME = 'shadow_ai_session_api_key_v1';
const ENDPOINT_STORAGE_KEY = 'shadow_ai_endpoint_url_v1';
const MODEL_STORAGE_KEY = 'shadow_ai_model_name_v1';

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

export interface SendMessageResponse {
  finalContent: string;
  toolResults: {
    toolName: string;
    actionSummary: string;
    success: boolean;
  }[];
  updatedHistory: AiChatMessage[];
}

export async function sendAiChatMessage(
  history: AiChatMessage[],
  config: AiEndpointConfig
): Promise<SendMessageResponse> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Format messages for OpenAI API
  const apiMessages = history.map(m => {
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
  let updatedChatHistory = [...history];

  // Tool-calling loop (maximum 4 recursive rounds)
  for (let round = 0; round < 4; round++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: currentMessages,
          tools: AI_TOOL_DEFINITIONS,
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

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Append assistant message with tool calls
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

        // Append tool result message
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

      // Loop to next round to let model summarize the action results
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
      timestamp: Date.now(),
    });
    break;
  }

  return {
    finalContent: finalAssistantContent,
    toolResults: executedToolSummaries,
    updatedHistory: updatedChatHistory,
  };
}
