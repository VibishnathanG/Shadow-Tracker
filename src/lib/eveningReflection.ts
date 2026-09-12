export const EVENING_REFLECTION_START = '<!-- EVENING_REFLECTION_START -->';
export const EVENING_REFLECTION_END = '<!-- EVENING_REFLECTION_END -->';

export const MOOD_META: Record<string, { label: string; emoji: string }> = {
  great: { label: 'Great', emoji: '😄' },
  good: { label: 'Good', emoji: '😊' },
  neutral: { label: 'Okay', emoji: '😐' },
  bad: { label: 'Down', emoji: '🙁' },
  terrible: { label: 'Rough', emoji: '😫' },
};

export interface EveningReflectionData {
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  biggestWin: string;
  gratitude: string;
  habitsCompletedCount: number;
  habitsTotalCount: number;
  tasksCompletedCount: number;
  tasksTotalCount: number;
}

/**
 * Strips any previous Evening Reflection block from the markdown content.
 * Cleans both comment-delimited blocks and raw markdown heading blocks to prevent duplicates.
 */
export function stripExistingEveningReflection(content: string): string {
  if (!content) return '';

  // 1. Remove blocks enclosed in HTML comment markers
  const commentRegex = /<!--\s*EVENING_REFLECTION_START\s*-->[\s\S]*?<!--\s*EVENING_REFLECTION_END\s*-->\n*/gi;
  let cleaned = content.replace(commentRegex, '');

  // 2. Remove any legacy or unmarked Evening Reflection headings up to --- divider or next heading
  const headingRegex = /###\s*🌙?[- ]*Evening[- ]*Reflection[\s\S]*?(?:---\n*|(?=\n#{1,4}\s)|$)/gi;
  cleaned = cleaned.replace(headingRegex, '');

  return cleaned.trim();
}

/**
 * Generates formatted Markdown for the Evening Reflection.
 * Returns either a detailed 10-line version or a compact 5-line version.
 */
export function generateEveningReflectionMarkdown(
  data: EveningReflectionData,
  isCompact: boolean = false
): string {
  const moodInfo = MOOD_META[data.mood] || { label: 'Good', emoji: '😊' };
  const win = data.biggestWin.trim() || 'Completed planned objectives and maintained consistency';
  const gratitude = data.gratitude.trim() || 'Good health, clear focus, and peaceful evening';

  const habitPct = data.habitsTotalCount > 0
    ? Math.round((data.habitsCompletedCount / data.habitsTotalCount) * 100)
    : 0;
  const taskPct = data.tasksTotalCount > 0
    ? Math.round((data.tasksCompletedCount / data.tasksTotalCount) * 100)
    : 0;

  if (isCompact) {
    // Exactly 5 lines
    const lines = [
      '### 🌙-Evening-Reflection',
      `- **Mood & Status**: ${moodInfo.emoji} ${moodInfo.label} • Habits: ${data.habitsCompletedCount}/${data.habitsTotalCount} • Tasks: ${data.tasksCompletedCount}/${data.tasksTotalCount}`,
      `- **🏆 Win**: ${win}`,
      `- **❤️ Gratitude**: ${gratitude}`,
      '---',
    ];
    return `${EVENING_REFLECTION_START}\n${lines.join('\n')}\n${EVENING_REFLECTION_END}`;
  }

  // Detailed version: exactly 10 lines
  const lines = [
    '### 🌙-Evening-Reflection',
    `> Daily Wrap-up • Habits: ${data.habitsCompletedCount}/${data.habitsTotalCount} • Tasks: ${data.tasksCompletedCount}/${data.tasksTotalCount}`,
    '',
    `- **Evening Mood**: ${moodInfo.emoji} ${moodInfo.label}`,
    `- **Habit Consistency**: ${data.habitsCompletedCount}/${data.habitsTotalCount} completed (${habitPct}%)`,
    `- **Task Execution**: ${data.tasksCompletedCount}/${data.tasksTotalCount} completed (${taskPct}%)`,
    `- **🏆 Biggest Win**: ${win}`,
    `- **❤️ Grateful For**: ${gratitude}`,
    '---',
    '',
  ];
  return `${EVENING_REFLECTION_START}\n${lines.join('\n')}${EVENING_REFLECTION_END}`;
}

/**
 * Formats and prepends updated Evening Reflection to today's journal note.
 * Removes old evening reflection block, checks available line capacity,
 * selects 5 vs 10 lines version, and guarantees zero duplicates.
 */
export function updateJournalWithEveningReflection(
  existingJournalContent: string | undefined,
  data: EveningReflectionData,
  maxAllowedLines: number = 500
): { content: string; versionUsed: 'detailed' | 'compact' } {
  const cleanedExisting = stripExistingEveningReflection(existingJournalContent || '');

  // If journal is not updated for the day (empty or no user notes), use detailed version
  if (!cleanedExisting) {
    const detailedMd = generateEveningReflectionMarkdown(data, false);
    return {
      content: detailedMd,
      versionUsed: 'detailed',
    };
  }

  const existingLineCount = cleanedExisting.split('\n').length;
  const availableLines = maxAllowedLines - existingLineCount;

  // Use compact (5-line) version when available lines are constrained (< 15 lines)
  const useCompact = availableLines < 15;
  const eveningMd = generateEveningReflectionMarkdown(data, useCompact);

  const finalContent = `${eveningMd}\n\n${cleanedExisting}`.trim();

  return {
    content: finalContent,
    versionUsed: useCompact ? 'compact' : 'detailed',
  };
}
