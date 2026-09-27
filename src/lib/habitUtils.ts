export function isHabitScheduledForDate(habit: any, date: Date | string): boolean {
  let targetDayOfWeek: number;
  if (typeof date === 'string') {
    // Assuming YYYY-MM-DD
    targetDayOfWeek = new Date(date + 'T00:00:00').getDay();
  } else {
    targetDayOfWeek = date.getDay();
  }

  if (habit.frequency === 'daily' || habit.frequency === 'weekly') return true;
  if (habit.frequency === 'custom' && habit.customDays) {
    return habit.customDays.includes(targetDayOfWeek);
  }
  return true;
}
