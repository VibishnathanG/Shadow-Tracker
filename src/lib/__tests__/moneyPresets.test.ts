import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUBSCRIPTION_PRESETS,
  DEFAULT_INVESTMENT_PRESETS,
  DEFAULT_BIG_EXPENSE_PRESETS,
  MoneyPresetItem,
  mergeMoneyPresets,
} from '@/lib/moneyPresets';

describe('Financial Presets & Auto-Fill System', () => {
  describe('Default Presets Integrity', () => {
    it('provides subscription presets with valid names, positive amounts, and emojis', () => {
      expect(DEFAULT_SUBSCRIPTION_PRESETS.length).toBeGreaterThanOrEqual(10);
      for (const sub of DEFAULT_SUBSCRIPTION_PRESETS) {
        expect(sub.name).toBeTruthy();
        expect(typeof sub.amount).toBe('number');
        expect(sub.amount).toBeGreaterThan(0);
        expect(sub.emoji).toBeTruthy();
        expect(sub.cycle).toMatch(/^(monthly|yearly)$/);
      }
    });

    it('provides investment presets with auto-fill fixed amounts and emojis (replacing legacy name-only suggestions)', () => {
      expect(DEFAULT_INVESTMENT_PRESETS.length).toBeGreaterThanOrEqual(6);
      for (const inv of DEFAULT_INVESTMENT_PRESETS) {
        expect(inv.name).toBeTruthy();
        expect(typeof inv.amount).toBe('number');
        expect(inv.amount).toBeGreaterThan(0);
        expect(inv.emoji).toBeTruthy();
      }

      const invNames = DEFAULT_INVESTMENT_PRESETS.map(i => i.name);
      expect(invNames).toContain('Nifty 50 Index Fund');
      expect(invNames).toContain('Public Provident Fund (PPF)');
      expect(invNames).toContain('Fixed Deposit (FD)');
    });

    it('provides big fixed expense presets with fixed monthly values for quick repeat additions', () => {
      expect(DEFAULT_BIG_EXPENSE_PRESETS.length).toBeGreaterThanOrEqual(6);
      for (const exp of DEFAULT_BIG_EXPENSE_PRESETS) {
        expect(exp.name).toBeTruthy();
        expect(typeof exp.amount).toBe('number');
        expect(exp.amount).toBeGreaterThan(0);
        expect(exp.emoji).toBeTruthy();
      }

      const expNames = DEFAULT_BIG_EXPENSE_PRESETS.map(e => e.name);
      expect(expNames).toContain('House Rent');
      expect(expNames).toContain('Car / Bike EMI');
      expect(expNames).toContain('Home Loan EMI');
      expect(expNames).toContain('Maid / Cook Salary');
    });
  });

  describe('Custom Presets Operations', () => {
    it('allows appending custom presets with fixed monthly values', () => {
      const initial: MoneyPresetItem[] = [...DEFAULT_INVESTMENT_PRESETS];
      const customItem: MoneyPresetItem = {
        name: 'S&P 500 Index SIP',
        amount: 15000,
        emoji: '🇺🇸',
      };

      const updated = mergeMoneyPresets(initial, customItem);
      expect(updated).toHaveLength(initial.length + 1);

      const found = updated.find(p => p.name === 'S&P 500 Index SIP');
      expect(found).toBeDefined();
      expect(found?.amount).toBe(15000);
      expect(found?.emoji).toBe('🇺🇸');
    });

    it('updates fixed amount for existing preset without duplicating entries', () => {
      const initial: MoneyPresetItem[] = [...DEFAULT_BIG_EXPENSE_PRESETS];
      const rentUpdate: MoneyPresetItem = {
        name: 'House Rent',
        amount: 28000,
        emoji: '🏠',
      };

      const updated = mergeMoneyPresets(initial, rentUpdate);
      expect(updated).toHaveLength(initial.length);

      const rent = updated.find(p => p.name.toLowerCase() === 'house rent');
      expect(rent?.amount).toBe(28000);
    });
  });
});
