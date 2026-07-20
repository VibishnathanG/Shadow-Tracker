import { parseISO, format, addDays, addWeeks, addMonths, differenceInCalendarDays, subDays } from 'date-fns';

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateString(dateStr: string): Date {
  return parseISO(dateStr);
}

export function calculateNextRecurrence(dateStr: string, pattern: 'daily' | 'weekly' | 'monthly'): string {
  const date = parseISO(dateStr);
  let nextDate: Date;
  switch (pattern) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
  }
  return format(nextDate, 'yyyy-MM-dd');
}

export function calculateStreaks(completedDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Remove duplicates and sort dates descending (newest first)
  const uniqueDates = Array.from(new Set(completedDates)).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const todayStr = getTodayDateString();
  const yesterdayStr = formatDateString(subDays(new Date(), 1));

  let currentStreak = 0;
  let longestStreak = 0;
  
  // Verify if the habit is active (completed today or yesterday)
  const hasCompletedToday = uniqueDates.includes(todayStr);
  const hasCompletedYesterday = uniqueDates.includes(yesterdayStr);

  if (hasCompletedToday || hasCompletedYesterday) {
    let checkDate = hasCompletedToday ? new Date() : subDays(new Date(), 1);
    let checkStr = formatDateString(checkDate);

    while (uniqueDates.includes(checkStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
      checkStr = formatDateString(checkDate);
    }
  }

  // Calculate longest streak historically
  // Sort ascending for historical check
  const sortedDates = [...uniqueDates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = parseISO(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = differenceInCalendarDays(currentDate, prevDate);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1; // broken streak, reset to 1
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currentDate;
  }

  // Fallback: longest streak cannot be less than current streak
  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * Returns helper dates for the weekly overview
 * Start from Monday or Sunday depending on preference (we use Monday)
 */
export function getWeekDates(anchorDate: Date = new Date()): Date[] {
  const currentDay = anchorDate.getDay();
  // Adjust so Monday is index 0
  const distance = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = addDays(anchorDate, distance);
  
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Returns all dates for a month view, including padding from previous/next months
 */
export function getMonthGridDates(date: Date = new Date()): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday
  const totalDays = lastDayOfMonth.getDate();
  
  const gridDates: Date[] = [];
  
  // Padding from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthPadding = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // start from Monday
  for (let i = prevMonthPadding - 1; i >= 0; i--) {
    gridDates.push(new Date(year, month - 1, prevMonthLastDay - i));
  }
  
  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    gridDates.push(new Date(year, month, i));
  }
  
  // Padding from next month to make complete rows of 7 (up to 42 items for 6 rows)
  const remaining = 42 - gridDates.length;
  for (let i = 1; i <= remaining; i++) {
    gridDates.push(new Date(year, month + 1, i));
  }
  
  return gridDates;
}
