/**
 * High-Performance JSON Diagnostics & Corrupted Backup Recovery Engine
 *
 * Pinpoints exact lines, columns, and corrupted field paths when importing JSON files.
 * Provides actionable suggestions and the reference file structure for instant user rectification.
 */

export interface JsonDiagnosticIssue {
  type: 'syntax' | 'schema' | 'field';
  message: string;
  line?: number;
  column?: number;
  fieldPath?: string;
  snippet?: string;
  suggestion: string;
  expectedStructure: string;
}

export interface JsonDiagnosticResult {
  isValid: boolean;
  error?: JsonDiagnosticIssue;
  data?: any;
}

const EXPECTED_BACKUP_SCHEMA_TEMPLATE = `{
  "version": "1.0.0",
  "exportedAt": "2026-09-11T00:00:00.000Z",
  "tasks": [
    {
      "id": "task-1",
      "title": "Task title",
      "description": "Optional details",
      "isCompleted": false,
      "priority": "medium",
      "dueDate": "2026-09-11",
      "createdAt": "2026-09-11T00:00:00.000Z",
      "updatedAt": "2026-09-11T00:00:00.000Z"
    }
  ],
  "habits": [
    {
      "id": "habit-1",
      "name": "Habit name",
      "completedDates": ["2026-09-10", "2026-09-11"],
      "streakCount": 2,
      "longestStreak": 2
    }
  ],
  "dailyLogs": [
    {
      "id": "log-2026-09-11",
      "date": "2026-09-11",
      "focusScore": 85,
      "completedTasksCount": 4,
      "completedHabitsCount": 5
    }
  ],
  "notes": [
    {
      "id": "note-1",
      "date": "2026-09-11",
      "title": "Daily Reflection",
      "content": "Markdown reflection content..."
    }
  ],
  "healthData": {
    "dailyLogs": {
      "2026-09-11": {
        "waterMl": 2500,
        "calorieGoal": 2200,
        "loggedFoods": [
          { "id": "food-1", "name": "Oatmeal with Blueberries", "calories": 350, "protein": 12, "carbs": 58, "fat": 6, "mealType": "breakfast" }
        ],
        "completedExercises": []
      }
    },
    "customWorkouts": [],
    "customFoods": [],
    "customDiets": [],
    "biometrics": { "weightKg": 75, "heightCm": 180, "targetWeightKg": 72 }
  },
  "moneyData": {
    "expenses": [],
    "monthlyDataMap": {}
  },
  "rpgQuests": [],
  "wizardScrolls": [],
  "unlockedBadges": []
}`;

/**
 * Locate the line and column number from a character index in a string
 */
export function getLineAndColumn(content: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const maxPos = Math.min(position, content.length);

  for (let i = 0; i < maxPos; i++) {
    if (content[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Extract a formatted 5-line context snippet around an error line
 */
export function extractCodeSnippet(content: string, errorLine: number, errorColumn: number): string {
  const lines = content.split('\n');
  const startLine = Math.max(1, errorLine - 2);
  const endLine = Math.min(lines.length, errorLine + 2);

  const snippetLines: string[] = [];

  for (let l = startLine; l <= endLine; l++) {
    const isTarget = l === errorLine;
    const prefix = isTarget ? '▶ ' : '  ';
    const lineNum = String(l).padStart(4, ' ');
    const lineText = lines[l - 1] ?? '';
    snippetLines.push(`${prefix}${lineNum} | ${lineText}`);

    if (isTarget) {
      const caretIndent = ' '.repeat(7 + Math.max(0, errorColumn - 1));
      snippetLines.push(`${caretIndent}^--- Error here (line ${errorLine}, col ${errorColumn})`);
    }
  }

  return snippetLines.join('\n');
}

/**
 * Analyze the nature of the JSON syntax error and generate an actionable fix suggestion
 */
function analyzeSyntaxError(jsonStr: string, position: number, rawMessage: string): { suggestion: string; line: number; column: number } {
  const { line, column } = getLineAndColumn(jsonStr, position);
  const lines = jsonStr.split('\n');
  const targetLine = lines[line - 1] || '';
  const prevLine = lines[line - 2] || '';

  // 1. Trailing comma check
  if (targetLine.trim().startsWith('}') || targetLine.trim().startsWith(']')) {
    if (prevLine.trim().endsWith(',')) {
      return {
        line: line - 1,
        column: prevLine.lastIndexOf(',') + 1,
        suggestion: `Trailing comma detected before '${targetLine.trim()[0]}'. Standard JSON forbids trailing commas after the last item. Remove the trailing comma on line ${line - 1}.`
      };
    }
  }

  // 2. Single quotes instead of double quotes
  if (targetLine.includes("'")) {
    return {
      line,
      column,
      suggestion: 'Single quotes (\') detected. JSON syntax strictly requires double quotes (") around all keys and string values. Replace single quotes with double quotes.'
    };
  }

  // 3. Unquoted key
  if (/[a-zA-Z0-9_]+\s*:/.test(targetLine) && !/"[a-zA-Z0-9_]+"\s*:/.test(targetLine)) {
    return {
      line,
      column,
      suggestion: 'Unquoted key detected. All object property names in JSON must be enclosed in double quotes (e.g. "title": "value").'
    };
  }

  // 4. Missing comma
  if (line > 1 && !prevLine.trim().endsWith(',') && !prevLine.trim().endsWith('{') && !prevLine.trim().endsWith('[') && !targetLine.trim().startsWith('}') && !targetLine.trim().startsWith(']')) {
    return {
      line: line - 1,
      column: prevLine.length + 1,
      suggestion: `Missing comma delimiter on line ${line - 1}. Add a comma (,) at the end of line ${line - 1} between consecutive properties or array items.`
    };
  }

  // 5. General syntax suggestion
  return {
    line,
    column,
    suggestion: `Syntax error at character position ${position}: ${rawMessage}. Check for missing quotes, unmatched brackets, or unescaped characters.`
  };
}

/**
 * Comprehensive JSON validator:
 * 1. Checks JSON syntax with line & column precision.
 * 2. Traverses keys and validates schema structures.
 * 3. Returns pinpoint diagnostics with suggestions and expected template on error.
 */
export function validateAndParseBackupJSON(jsonStr: string): JsonDiagnosticResult {
  if (!jsonStr || typeof jsonStr !== 'string' || !jsonStr.trim()) {
    return {
      isValid: false,
      error: {
        type: 'syntax',
        message: 'The provided JSON file is completely empty.',
        line: 1,
        column: 1,
        suggestion: 'Ensure you select a non-empty .json backup file generated by Shadow Tracker.',
        expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
      }
    };
  }

  // Step 1: Parse JSON syntax
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: any) {
    const rawMsg = err?.message || 'JSON Parse error';
    let position = 0;

    // Extract position from standard V8 error message: "at position 1234"
    const posMatch = rawMsg.match(/position\s+(\d+)/i);
    if (posMatch) {
      position = parseInt(posMatch[1], 10);
    } else {
      // Fallback: extract line/column if provided by other engines
      const lineColMatch = rawMsg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
      if (lineColMatch) {
        const l = parseInt(lineColMatch[1], 10);
        const c = parseInt(lineColMatch[2], 10);
        const lines = jsonStr.split('\n');
        let charCount = 0;
        for (let i = 0; i < l - 1; i++) charCount += (lines[i]?.length || 0) + 1;
        position = charCount + (c - 1);
      }
    }

    const { suggestion, line, column } = analyzeSyntaxError(jsonStr, position, rawMsg);
    const snippet = extractCodeSnippet(jsonStr, line, column);

    return {
      isValid: false,
      error: {
        type: 'syntax',
        message: `JSON Syntax Error: ${rawMsg}`,
        line,
        column,
        snippet,
        suggestion,
        expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
      }
    };
  }

  // Step 2: Validate root structure
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      isValid: false,
      error: {
        type: 'schema',
        message: `Root structure must be a JSON object ({...}), but found ${Array.isArray(parsed) ? 'an Array ([...])' : typeof parsed}.`,
        fieldPath: 'root',
        suggestion: 'The backup file must be an object containing "tasks", "habits", "dailyLogs", and "notes" keys.',
        expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
      }
    };
  }

  // Support Shadow Tracker envelope format (un-envelope payload if present)
  if (parsed.format === 'shadow-tracker-backup' && parsed.payload && typeof parsed.payload === 'object') {
    parsed = parsed.payload;
  }

  // Step 3: Deep Key Traversal & Field Validation
  // Validate 'tasks'
  if (parsed.tasks !== undefined) {
    if (!Array.isArray(parsed.tasks)) {
      return {
        isValid: false,
        error: {
          type: 'field',
          message: 'The "tasks" field must be an array of task objects.',
          fieldPath: 'tasks',
          suggestion: 'Ensure "tasks": [...] is an array. If empty, use "tasks": [].',
          expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
        }
      };
    }
    for (let i = 0; i < parsed.tasks.length; i++) {
      const t = parsed.tasks[i];
      if (!t || typeof t !== 'object') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `Task at index [${i}] is corrupted (expected object, found ${typeof t}).`,
            fieldPath: `tasks[${i}]`,
            suggestion: `Ensure tasks[${i}] is an object with "id" and "title" properties.`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
      if (!t.id || typeof t.id !== 'string') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `Task at index [${i}] is missing a valid string "id".`,
            fieldPath: `tasks[${i}].id`,
            suggestion: `Add a unique string "id" to tasks[${i}] (e.g. "id": "task-${i + 1}").`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
      if (!t.title || typeof t.title !== 'string') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `Task at index [${i}] is missing a string "title".`,
            fieldPath: `tasks[${i}].title`,
            suggestion: `Add a valid string "title" to tasks[${i}].`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
    }
  }

  // Validate 'habits'
  if (parsed.habits !== undefined) {
    if (!Array.isArray(parsed.habits)) {
      return {
        isValid: false,
        error: {
          type: 'field',
          message: 'The "habits" field must be an array of habit objects.',
          fieldPath: 'habits',
          suggestion: 'Ensure "habits": [...] is an array. If empty, use "habits": [].',
          expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
        }
      };
    }
    for (let i = 0; i < parsed.habits.length; i++) {
      const h = parsed.habits[i];
      if (!h || typeof h !== 'object') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `Habit at index [${i}] is corrupted (expected object, found ${typeof h}).`,
            fieldPath: `habits[${i}]`,
            suggestion: `Ensure habits[${i}] is an object with "id" and "name" properties.`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
      if (!h.id || typeof h.id !== 'string') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `Habit at index [${i}] is missing a valid string "id".`,
            fieldPath: `habits[${i}].id`,
            suggestion: `Add a unique string "id" to habits[${i}].`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
    }
  }

  // Validate 'dailyLogs'
  if (parsed.dailyLogs !== undefined) {
    if (!Array.isArray(parsed.dailyLogs)) {
      return {
        isValid: false,
        error: {
          type: 'field',
          message: 'The "dailyLogs" field must be an array of daily log objects.',
          fieldPath: 'dailyLogs',
          suggestion: 'Ensure "dailyLogs": [...] is an array of daily tracking objects.',
          expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
        }
      };
    }
    for (let i = 0; i < Math.min(parsed.dailyLogs.length, 500); i++) {
      const l = parsed.dailyLogs[i];
      if (!l || typeof l !== 'object') {
        return {
          isValid: false,
          error: {
            type: 'field',
            message: `DailyLog at index [${i}] is corrupted (expected object, found ${typeof l}).`,
            fieldPath: `dailyLogs[${i}]`,
            suggestion: `Ensure dailyLogs[${i}] is an object with a "date" property in YYYY-MM-DD format.`,
            expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
          }
        };
      }
    }
  }

  // Validate 'notes'
  if (parsed.notes !== undefined && !Array.isArray(parsed.notes)) {
    return {
      isValid: false,
      error: {
        type: 'field',
        message: 'The "notes" field must be an array of journal note objects.',
        fieldPath: 'notes',
        suggestion: 'Ensure "notes": [...] is an array. If empty, use "notes": [].',
        expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
      }
    };
  }

  // Validate 'healthData'
  if (parsed.healthData !== undefined && parsed.healthData !== null) {
    if (typeof parsed.healthData !== 'object' || Array.isArray(parsed.healthData)) {
      return {
        isValid: false,
        error: {
          type: 'field',
          message: 'The "healthData" field must be an object containing health metrics.',
          fieldPath: 'healthData',
          suggestion: 'Ensure "healthData" is an object with "dailyLogs", "customFoods", and "customDiets" properties.',
          expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
        }
      };
    }
  }

  // Validate 'moneyData'
  if (parsed.moneyData !== undefined && parsed.moneyData !== null) {
    if (typeof parsed.moneyData !== 'object' || Array.isArray(parsed.moneyData)) {
      return {
        isValid: false,
        error: {
          type: 'field',
          message: 'The "moneyData" field must be an object containing financial records.',
          fieldPath: 'moneyData',
          suggestion: 'Ensure "moneyData" is an object with "expenses" (array) and "monthlyDataMap" (object).',
          expectedStructure: EXPECTED_BACKUP_SCHEMA_TEMPLATE,
        }
      };
    }
  }

  // Successfully parsed and validated!
  return {
    isValid: true,
    data: parsed,
  };
}
