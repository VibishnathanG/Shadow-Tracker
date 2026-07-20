import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStreaks, formatDateString } from '../lib/dateUtils';
import { subDays, addDays } from 'date-fns';

describe('Streak Calculator', () => {
  beforeEach(() => {
    // Mock system time to keep dates deterministic during runs
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 streaks if no completions exist', () => {
    const result = calculateStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('should calculate active streak when completed today', () => {
    const today = new Date();
    const completions = [
      formatDateString(today),
      formatDateString(subDays(today, 1)),
      formatDateString(subDays(today, 2)),
    ];

    const result = calculateStreaks(completions);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('should calculate active streak when completed yesterday but not today yet', () => {
    const today = new Date();
    const completions = [
      formatDateString(subDays(today, 1)),
      formatDateString(subDays(today, 2)),
      formatDateString(subDays(today, 3)),
    ];

    const result = calculateStreaks(completions);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('should reset current streak but preserve longest streak when a gap exists', () => {
    const today = new Date();
    // 5-day streak in past, broken, then completed yesterday/today (2-day streak)
    const completions = [
      // Current active streak: completed yesterday and today
      formatDateString(today),
      formatDateString(subDays(today, 1)),

      // Broken gap: subDays(today, 2) is missing

      // Past historic streak of 4 days
      formatDateString(subDays(today, 3)),
      formatDateString(subDays(today, 4)),
      formatDateString(subDays(today, 5)),
      formatDateString(subDays(today, 6)),
    ];

    const result = calculateStreaks(completions);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(4);
  });
});
