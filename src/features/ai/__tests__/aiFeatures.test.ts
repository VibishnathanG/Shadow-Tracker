import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup Mock Storage
const localMock: Record<string, string> = {};
const sessionMock: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => localMock[key] || null),
  setItem: vi.fn((key: string, value: string) => { localMock[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localMock[key]; }),
  clear: vi.fn(() => { for (const k in localMock) delete localMock[k]; }),
};

const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionMock[key] || null),
  setItem: vi.fn((key: string, value: string) => { sessionMock[key] = value; }),
  removeItem: vi.fn((key: string) => { delete sessionMock[key]; }),
  clear: vi.fn(() => { for (const k in sessionMock) delete sessionMock[k]; }),
};

(global as any).window = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
(global as any).localStorage = mockLocalStorage;
(global as any).sessionStorage = mockSessionStorage;
(global as any).CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, params?: { detail: any }) {
    this.type = type;
    this.detail = params?.detail;
  }
};

import { compileAiContext } from '../aiContext';
import { executeAiToolCall, AI_TOOL_DEFINITIONS } from '../aiTools';
import {
  getSessionApiKey,
  setSessionApiKey,
  discardSessionApiKey,
} from '../aiService';
import { useShadowTrackerStore } from '@/store';
import { getStoredTodos } from '@/features/todo/todoStorage';
import { getCustomDietPlans } from '@/features/health/dietPlansData';

describe('AI Context & Compilation', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  it('compiles context for 1w window with correct date bounds and positive token estimate', () => {
    const ctx = compileAiContext('1w');
    expect(ctx.window).toBe('1w');
    expect(ctx.days).toBe(7);
    expect(ctx.startDate).toBeDefined();
    expect(ctx.endDate).toBeDefined();
    expect(ctx.tokenEstimate).toBeGreaterThan(0);
    expect(ctx.payload).toHaveProperty('profile');
    expect(ctx.payload).toHaveProperty('tasks');
    expect(ctx.payload).toHaveProperty('habits');
    expect(ctx.jsonString).toContain('profile');
  });

  it('compiles context for 1y window with higher days count', () => {
    const ctx = compileAiContext('1y');
    expect(ctx.window).toBe('1y');
    expect(ctx.days).toBe(365);
    expect(ctx.tokenEstimate).toBeGreaterThan(0);
  });
});

describe('AI Tool Definitions & Autonomous Executors', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  it('has 15 defined tools with no delete operations', () => {
    expect(AI_TOOL_DEFINITIONS.length).toBe(15);
    const names = AI_TOOL_DEFINITIONS.map(t => t.function.name);
    names.forEach(name => {
      expect(name).not.toContain('delete');
      expect(name).not.toContain('remove');
      expect(name).not.toContain('destroy');
    });
    expect(names).toContain('create_task');
    expect(names).toContain('create_todo');
    expect(names).toContain('create_habit');
    expect(names).toContain('create_diet_plan');
    expect(names).toContain('log_water_intake');
    expect(names).toContain('update_wealth_transaction');
    expect(names).toContain('create_journal_entry');
    expect(names).toContain('web_search_query');
  });

  it('executes create_task, update_task, and complete_task', async () => {
    const createRes = await executeAiToolCall('create_task', {
      title: 'Finish Quantum Codebase',
      priority: 'high',
      estimatedMinutes: 60,
    });
    expect(createRes.success).toBe(true);
    expect(createRes.actionSummary).toContain('Task Created');

    const createdTask = useShadowTrackerStore.getState().tasks.find(t => t.title === 'Finish Quantum Codebase');
    expect(createdTask).toBeDefined();

    if (createdTask) {
      const updateRes = await executeAiToolCall('update_task', {
        taskId: createdTask.id,
        title: 'Finish Quantum Architecture Refactor',
      });
      expect(updateRes.success).toBe(true);
      expect(useShadowTrackerStore.getState().tasks.find(t => t.id === createdTask.id)?.title).toBe('Finish Quantum Architecture Refactor');

      const compRes = await executeAiToolCall('complete_task', { taskId: createdTask.id });
      expect(compRes.success).toBe(true);
      expect(useShadowTrackerStore.getState().tasks.find(t => t.id === createdTask.id)?.isCompleted).toBe(true);
    }
  });

  it('executes create_todo and complete_todo', async () => {
    const todoRes = await executeAiToolCall('create_todo', {
      title: 'Buy Almond Milk & Matcha',
      priority: 'medium',
    });
    expect(todoRes.success).toBe(true);

    const todos = getStoredTodos();
    const target = todos.find(t => t.title === 'Buy Almond Milk & Matcha');
    expect(target).toBeDefined();

    if (target) {
      const doneRes = await executeAiToolCall('complete_todo', { todoId: target.id });
      expect(doneRes.success).toBe(true);
      const updatedTodos = getStoredTodos();
      expect(updatedTodos.find(t => t.id === target.id)?.isCompleted).toBe(true);
    }
  });

  it('executes create_habit and log_habit_completion', async () => {
    const habitRes = await executeAiToolCall('create_habit', {
      name: 'Cold Plunge Protocol',
      frequency: 'daily',
    });
    expect(habitRes.success).toBe(true);

    const habit = useShadowTrackerStore.getState().habits.find(h => h.name === 'Cold Plunge Protocol');
    expect(habit).toBeDefined();

    if (habit) {
      const logRes = await executeAiToolCall('log_habit_completion', { habitId: habit.id });
      expect(logRes.success).toBe(true);
    }
  });

  it('executes create_diet_plan and log_water_intake', async () => {
    const dietRes = await executeAiToolCall('create_diet_plan', {
      planName: 'Hypertrophy Beast 3000',
      goal: 'muscle_gain',
      dailyCalories: 2800,
    });
    expect(dietRes.success).toBe(true);
    const plans = getCustomDietPlans();
    expect(plans.some(p => p.name === 'Hypertrophy Beast 3000')).toBe(true);

    const waterRes = await executeAiToolCall('log_water_intake', { amountMl: 500 });
    expect(waterRes.success).toBe(true);
    expect(waterRes.actionSummary).toContain('+500ml');
  });

  it('executes update_wealth_transaction and update_wealth_budget', async () => {
    const txRes = await executeAiToolCall('update_wealth_transaction', {
      amount: 1200,
      category: 'Bills',
      note: 'High-speed Fiber Internet',
    });
    expect(txRes.success).toBe(true);
    const rawExpenses = mockLocalStorage.getItem('shadow_money_expenses_v4');
    expect(rawExpenses).toContain('High-speed Fiber Internet');

    const budgetRes = await executeAiToolCall('update_wealth_budget', {
      category: 'Food',
      monthlyLimit: 15000,
    });
    expect(budgetRes.success).toBe(true);
    const rawBudgets = mockLocalStorage.getItem('shadow_money_category_budgets');
    expect(rawBudgets).toContain('15000');
  });

  it('executes web_search_query', async () => {
    const searchRes = await executeAiToolCall('web_search_query', {
      query: 'optimal rest intervals for hypertrophy',
    });
    expect(searchRes.success).toBe(true);
    expect(searchRes.actionSummary).toContain('Web Knowledge Queried');
  });
});

describe('Session-Only API Key Security', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    mockLocalStorage.clear();
  });

  it('stores API key in sessionStorage only and clears on discard', () => {
    setSessionApiKey('sk-test-secret-12345');
    expect(getSessionApiKey()).toBe('sk-test-secret-12345');

    // Verify it is NOT in localStorage
    expect(mockLocalStorage.getItem('shadow_ai_session_api_key_v1')).toBeNull();

    discardSessionApiKey();
    expect(getSessionApiKey()).toBe('');
  });
});
