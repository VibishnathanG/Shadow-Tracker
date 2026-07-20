import re

with open('/Main_Workspace/Programming/Python/workspace/shadow-tracker/src/features/calendar/CalendarFeature.tsx', 'r') as f:
    content = f.read()

# Add useMemo for maps
imports_replacement = """import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import { getTodayDateString, formatDateString, getMonthGridDates, getWeekDates } from '@/lib/dateUtils';
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth } from 'date-fns';"""

maps_code = """
  const habitCompletionMap = useMemo(() => {
    const map = new Map<string, number>();
    habits.forEach(h => {
      h.completedDates.forEach(d => {
        map.set(d, (map.get(d) || 0) + 1);
      });
    });
    return map;
  }, [habits]);

  const notesMap = useMemo(() => {
    const map = new Map<string, boolean>();
    notes.forEach(n => {
      if (n.content.trim().length > 0) map.set(n.id, true);
    });
    return map;
  }, [notes]);
  
  const dailyLogsMap = useMemo(() => {
    const map = new Map<string, any>();
    dailyLogs.forEach(l => {
      map.set(l.date, l);
    });
    return map;
  }, [dailyLogs]);
  
  const tasksByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const arr = map.get(t.dueDate) || [];
      arr.push(t);
      map.set(t.dueDate, arr);
    });
    return map;
  }, [tasks]);
"""

# Replace todayStr with useMemo
content = content.replace("const todayStr = getTodayDateString();", "const todayStr = useMemo(() => getTodayDateString(), []);")

# Insert maps code before return
content = content.replace("  return (", maps_code + "\n  return (")

# Replace expensive lookups in month view
content = content.replace(
    "const dayLog = dailyLogs.find(l => l.date === dateStr);",
    "const dayLog = dailyLogsMap.get(dateStr);"
)
content = content.replace(
    "const dayHabitsCompleted = habits.filter(h => h.completedDates.includes(dateStr)).length;",
    "const dayHabitsCompleted = habitCompletionMap.get(dateStr) || 0;"
)
content = content.replace(
    "const hasNote = notes.some(n => n.id === dateStr && n.content.trim().length > 0);",
    "const hasNote = notesMap.get(dateStr) || false;"
)

# Replace expensive lookups in week view
content = content.replace(
    "const dayTasks = tasks.filter(t => t.dueDate === dateStr);",
    "const dayTasks = tasksByDate.get(dateStr) || [];"
)

# Add spring animations to whileHover and ensure whileTap={{ scale: 0.95 }} for buttons
content = re.sub(r'whileHover=\{\{\s*scale:\s*1\.05\s*\}\}', "whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } }}", content)
content = re.sub(r'whileHover=\{\{\s*scale:\s*1\.1,\s*backgroundColor:\s*\'var\(--card\)\'\s*\}\}', "whileHover={{ scale: 1.1, backgroundColor: 'var(--card)', transition: { type: 'spring', stiffness: 400, damping: 10 } }}", content)
content = re.sub(r'whileHover=\{\{\s*scale:\s*1\.05,\s*backgroundColor:\s*\'var\(--card\)\'\s*\}\}', "whileHover={{ scale: 1.05, backgroundColor: 'var(--card)', transition: { type: 'spring', stiffness: 400, damping: 10 } }}", content)
content = re.sub(r'whileHover=\{\{\s*scale:\s*1\.1,\s*y:\s*-2\s*\}\}', "whileHover={{ scale: 1.1, y: -2, transition: { type: 'spring', stiffness: 400, damping: 10 } }}", content)

content = re.sub(r'whileTap=\{\{\s*scale:\s*0\.9\s*\}\}', "whileTap={{ scale: 0.95 }}", content)

# input and textarea focus
content = re.sub(r'whileFocus=\{\{\s*scale:\s*1\.01\s*\}\}', "whileFocus={{ scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 10 } }}", content)

# Check text contrast
content = content.replace('text-xs uppercase opacity-90 font-black', 'text-xs uppercase text-muted-foreground font-black')
content = content.replace('text-lg leading-none mt-0.5', 'text-lg text-foreground leading-none mt-0.5')
content = content.replace('text-primary text-base', 'text-primary text-foreground text-base')

with open('/Main_Workspace/Programming/Python/workspace/shadow-tracker/src/features/calendar/CalendarFeature.tsx', 'w') as f:
    f.write(content)

print("Done updating.")
