import { parseISO, format, addDays, addWeeks, addMonths, differenceInCalendarDays, subDays } from 'date-fns';

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateString(dateStr: string): Date {
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }
  return parseISO(dateStr);
}

export function calculateNextRecurrence(dateStr: string, pattern: 'daily' | 'weekly' | 'monthly'): string {
  const date = parseDateString(dateStr);
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

  // Remove duplicates and sort dates descending (newest first) using lexicographical string sort
  const uniqueDates = Array.from(new Set(completedDates)).sort((a, b) => b.localeCompare(a));

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
  const sortedDates = [...uniqueDates].sort((a, b) => a.localeCompare(b));

  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = parseDateString(dateStr);
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

/**
 * Habit grace period status:
 * - diff < 0: Future date (strictly cannot complete or update)
 * - diff === 0: Today (can update)
 * - diff >= 1 && diff <= graceDays: Within grace period (can update)
 * - diff > graceDays: Past grace period (faded/disabled from ticking complete)
 */
export function getHabitDateStatus(
  dateStr: string,
  todayStr: string = getTodayDateString(),
  graceDays: number = 3
) {
  const targetDate = parseDateString(dateStr);
  const todayDate = parseDateString(todayStr);
  const diff = differenceInCalendarDays(todayDate, targetDate);

  const isFuture = diff < 0;
  const isToday = diff === 0;
  const isInGracePeriod = diff >= 0 && diff <= graceDays;
  const isPastGracePeriod = diff > graceDays;

  return {
    diff,
    isFuture,
    isToday,
    isInGracePeriod,
    isPastGracePeriod,
    canUpdate: isInGracePeriod, // Only today and last graceDays days can be updated!
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Cleanly upserts or removes a single mono habit reflection section inside a journal note.
 * Guarantees strictly ONE mono section per habit per day.
 */
export function upsertHabitMissedNoteSection(
  currentContent: string,
  habitName: string,
  dateStr: string,
  reason?: string
): string {
  const formattedDate = format(parseDateString(dateStr), 'MMM d, yyyy');
  const sectionHeaderPattern = new RegExp(
    `(?:\\r?\\n\\r?\\n)?### 📝 Habit Missed: ${escapeRegExp(habitName)}[\\s\\S]*?(?=(?:\\r?\\n\\r?\\n### |$))`,
    'g'
  );

  const cleanedContent = currentContent.replace(sectionHeaderPattern, '').trim();

  if (!reason || !reason.trim()) {
    return cleanedContent;
  }

  const newSection = `\n\n### 📝 Habit Missed: ${habitName}\n- **Date**: ${formattedDate}\n- **Reason**: ${reason.trim()}`;
  return cleanedContent ? `${cleanedContent}${newSection}` : `# Journal Entry - ${formattedDate}\n\nDaily reflection log.${newSection}`;
}
