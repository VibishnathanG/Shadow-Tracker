import { describe, it, expect } from 'vitest';
import {
  generateEveningReflectionMarkdown,
  stripExistingEveningReflection,
  updateJournalWithEveningReflection,
  EveningReflectionData,
} from '../eveningReflection';

describe('eveningReflection utility', () => {
  const sampleData: EveningReflectionData = {
    mood: 'great',
    biggestWin: 'Shipped high performance release build',
    gratitude: 'Supportive team and quiet focus environment',
    habitsCompletedCount: 4,
    habitsTotalCount: 5,
    tasksCompletedCount: 6,
    tasksTotalCount: 7,
  };

  it('generates a detailed 10-line markdown block with emoji and metrics', () => {
    const md = generateEveningReflectionMarkdown(sampleData, false);
    expect(md).toContain('### 🌙-Evening-Reflection');
    expect(md).toContain('😄 Great');
    expect(md).toContain('Shipped high performance release build');
    expect(md).toContain('Supportive team and quiet focus environment');
    expect(md).toContain('4/5 completed (80%)');
    expect(md).toContain('6/7 completed (86%)');

    // Strip comment markers to count actual markdown lines
    const lines = md.replace(/<!--[\s\S]*?-->/g, '').trim().split('\n');
    expect(lines.length).toBe(9); // 9 lines of content + 1 blank line before divider/next section
  });

  it('generates a compact 5-line markdown block', () => {
    const md = generateEveningReflectionMarkdown(sampleData, true);
    expect(md).toContain('### 🌙-Evening-Reflection');
    expect(md).toContain('😄 Great');
    expect(md).toContain('🏆 Win');
    expect(md).toContain('❤️ Gratitude');
    
    const lines = md.replace(/<!--[\s\S]*?-->/g, '').trim().split('\n');
    expect(lines.length).toBe(5);
  });

  it('strips existing evening reflection with comment tags', () => {
    const original = `<!-- EVENING_REFLECTION_START -->
### 🌙-Evening-Reflection
- Old reflection
---
<!-- EVENING_REFLECTION_END -->

My private daily journal notes here.`;

    const cleaned = stripExistingEveningReflection(original);
    expect(cleaned).toBe('My private daily journal notes here.');
    expect(cleaned).not.toContain('Evening-Reflection');
  });

  it('strips legacy evening reflection headings without comment tags', () => {
    const original = `### 🌙 Evening Reflection
- **Win**: Ran 5k
- **Gratitude**: Sunshine
---

User note content below.`;

    const cleaned = stripExistingEveningReflection(original);
    expect(cleaned).toBe('User note content below.');
    expect(cleaned).not.toContain('Evening Reflection');
  });

  it('uses detailed 10-line version when journal is not updated yet for the day', () => {
    const result = updateJournalWithEveningReflection('', sampleData);
    expect(result.versionUsed).toBe('detailed');
    expect(result.content).toContain('Habit Consistency');
    expect(result.content).toContain('Task Execution');
    expect(result.content).toContain('😄 Great');
  });

  it('uses compact 5-line version when available lines are constrained (< 15 lines)', () => {
    // Generate 488 lines of user text (leaving 12 lines available out of 500)
    const longUserNotes = Array(488).fill('Daily reflection log line').join('\n');
    const result = updateJournalWithEveningReflection(longUserNotes, sampleData, 500);

    expect(result.versionUsed).toBe('compact');
    expect(result.content).toContain('### 🌙-Evening-Reflection');
    expect(result.content).toContain('Mood & Status');
    // Ensure the resulting journal does not breach max limit
    const totalLines = result.content.split('\n').length;
    expect(totalLines).toBeLessThanOrEqual(500);
  });

  it('replaces old evening reflection without duplicates when updated multiple times', () => {
    // First evening update
    const firstRun = updateJournalWithEveningReflection('Initial morning notes', sampleData);
    expect(firstRun.content).toContain('Shipped high performance release build');

    // Second evening update with updated win and mood
    const updatedData: EveningReflectionData = {
      ...sampleData,
      mood: 'good',
      biggestWin: 'Squashed final edge-case bug',
    };

    const secondRun = updateJournalWithEveningReflection(firstRun.content, updatedData);
    expect(secondRun.content).toContain('Squashed final edge-case bug');
    expect(secondRun.content).toContain('😊 Good');
    expect(secondRun.content).not.toContain('Shipped high performance release build');
    expect(secondRun.content).not.toContain('😄 Great');
    expect(secondRun.content).toContain('Initial morning notes');

    // Check occurrences of header
    const matches = secondRun.content.match(/Evening-Reflection/g);
    expect(matches).toHaveLength(1);
  });
});
