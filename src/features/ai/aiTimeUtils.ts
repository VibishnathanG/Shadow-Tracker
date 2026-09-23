import { getTodayDateString, formatDateString } from '@/lib/dateUtils';
import { addDays, subDays } from 'date-fns';

export interface SystemTimeInfo {
  currentDate: string; // YYYY-MM-DD
  currentTime: string; // e.g. "09:22:25 PM"
  currentDay: string;  // e.g. "Wednesday"
  tomorrowDate: string; // YYYY-MM-DD
  timeZone: string;     // e.g. "Asia/Calcutta"
  isoString: string;
  source: 'system_clock' | 'web_verified_clock';
  webUtcTime?: string;
}

/**
 * Returns the current system date and time directly from local code execution.
 * Guaranteed to succeed with zero network latency.
 */
export function getSystemTimeInfo(): SystemTimeInfo {
  const now = new Date();
  const currentDate = getTodayDateString();
  const tomorrowDate = formatDateString(addDays(now, 1));
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentDay = now.toLocaleDateString([], { weekday: 'long' });
  
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'System Local';
  } catch {
    timeZone = 'System Local';
  }

  return {
    currentDate,
    currentTime,
    currentDay,
    tomorrowDate,
    timeZone,
    isoString: now.toISOString(),
    source: 'system_clock',
  };
}

/**
 * Attempts to verify time against an authoritative web network API with a strict 1.5s timeout.
 * Always falls back to the system clock from code if the network is slow or offline.
 */
export async function fetchLiveTimeWithFallback(): Promise<SystemTimeInfo> {
  const localInfo = getSystemTimeInfo();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.dateTime) {
        return {
          ...localInfo,
          source: 'web_verified_clock',
          webUtcTime: data.dateTime,
        };
      }
    }
  } catch {
    // Web fetch failed or timed out: silently fallback to local system time from code
  }

  return localInfo;
}

/**
 * Resolves and normalizes task/todo due dates.
 * Handles relative strings ('today', 'tomorrow', 'next week') and corrects
 * hallucinated past-year dates (e.g. 2024 or 2025 when today is 2026).
 */
export function resolveAiDueDate(rawDueDate?: string | null): string {
  const today = getTodayDateString();
  if (!rawDueDate) return today;

  const normalized = String(rawDueDate).trim().toLowerCase();
  if (normalized === 'today' || normalized === 'now') {
    return today;
  }
  if (normalized === 'tomorrow') {
    return formatDateString(addDays(new Date(), 1));
  }
  if (normalized === 'yesterday') {
    return formatDateString(subDays(new Date(), 1));
  }

  // Check for ISO YYYY-MM-DD format
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const inputYear = parseInt(isoMatch[1], 10);
    const month = isoMatch[2];
    const day = isoMatch[3];

    const currentYear = new Date().getFullYear();
    // If the model hallucinated a past year (e.g. 2024 or 2025), upgrade it to current year
    if (inputYear < currentYear) {
      const candidate = `${currentYear}-${month}-${day}`;
      // If the candidate date has already passed this year, default to tomorrow
      if (candidate < today) {
        return formatDateString(addDays(new Date(), 1));
      }
      return candidate;
    }
    return `${inputYear}-${month}-${day}`;
  }

  // Attempt standard Date parsing
  try {
    const parsed = new Date(rawDueDate);
    if (!isNaN(parsed.getTime())) {
      const currentYear = new Date().getFullYear();
      if (parsed.getFullYear() < currentYear) {
        parsed.setFullYear(currentYear);
      }
      return formatDateString(parsed);
    }
  } catch {
    // Parse error: default to today
  }

  return today;
}
