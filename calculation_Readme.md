# 🧮 Mathematical & Computational Reference Guide — Shadow Tracker

This document serves as the authoritative mathematical reference for all metrics, scoring algorithms, financial equations, habit streak logic, and gamification calculations implemented in **Shadow Tracker**.

---

## 📑 Table of Contents
1. [Daily Focus Score Engine](#1-daily-focus-score-engine)
2. [Habit Streak & Frequency Algorithms](#2-habit-streak--frequency-algorithms)
3. [Financial & Wealth Calculations](#3-financial--wealth-calculations)
4. [Gamification & XP Leveling Math](#4-gamification--xp-leveling-math)
5. [Analytics & Contribution Matrix Curves](#5-analytics--contribution-matrix-curves)

---

## 1. 🎯 Daily Focus Score Engine

Location: `src/store/index.ts` → `recalculateDailyLogStats(date)`

The Daily Focus Score evaluates your discipline on any given day on a scale of **0% to 100%**.

### Scheduled Filtering Rule
Before calculating ratios, habits are dynamically filtered to include **only habits actively scheduled for that date**:
- **Daily Habits**: Scheduled every day.
- **Custom Habits**: Scheduled only if `customDays` includes `getDay(date)` (0 = Sunday, 1 = Monday, ... 6 = Saturday).
- **Weekly Habits**: Scheduled if completed on that date or active in current week.
- **Soft-Deleted Filter**: Soft-deleted habits (`isSoftDeleted === true`) are excluded from both numerator and denominator.

### Mathematical Weighting Formula

$$\text{Task Ratio} = \frac{\text{Completed Tasks Due on Date}}{\text{Total Tasks Due on Date}}$$

$$\text{Habit Ratio} = \frac{\text{Completed Habits on Date}}{\text{Total Active Scheduled Habits for Date}}$$

```typescript
if (totalTasksCount > 0 && activeHabitsCount > 0) {
  focusScore = Math.round((taskRatio * 50) + (habitRatio * 50));
} else if (totalTasksCount > 0) {
  focusScore = Math.round((completedTasksCount / totalTasksCount) * 100);
} else if (activeHabitsCount > 0) {
  focusScore = Math.round((completedHabitsCount / activeHabitsCount) * 100);
} else {
  focusScore = 0;
}
```

| Scenario | Weight Allocation |
| :--- | :--- |
| **Tasks + Habits Scheduled** | 50% Tasks Weight + 50% Habits Weight |
| **Only Tasks Due** | 100% Tasks Weight |
| **Only Habits Scheduled** | 100% Habits Weight |
| **No Items Scheduled** | 0% Focus Score |

---

## 2. 🔥 Habit Streak & Frequency Algorithms

Location: `src/lib/dateUtils.ts` → `calculateStreaks(completedDates)`

### 2.1 Current Streak & Longest Streak
Dates are sorted descending (`YYYY-MM-DD`). A habit streak is active if completed **Today** or **Yesterday**.

$$\text{Current Streak} = \text{Consecutive active days counting backward from Today/Yesterday}$$

$$\text{Longest Streak} = \max\Big(\text{Historical Max Consecutive Days}, \text{Current Streak}\Big)$$

```typescript
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
      tempStreak = 1; // streak broken
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  prevDate = currentDate;
}
```

### 2.2 Frequency Rules
1. **Daily**: Active every day of the month.
2. **Custom Days**: Active only on selected days of the week (e.g. Mon, Wed, Fri).
3. **Once-a-Week**: 
   - Completing **1 day** within a calendar week marks the entire week complete for that habit.
   - Additional days in the same week are disabled (`isEnabled: false`) with a locked badge tooltip.

---

## 3. 💰 Financial & Wealth Calculations

Location: `src/features/money/MoneyFeature.tsx`

### 3.1 Cashflow Equations

$$\text{Monthly Outflow} = \text{Daily Calendar Spends} + \text{Big Fixed Expenses}$$

$$\text{Total Allocation} = \text{Monthly Outflow} + \text{Investments}$$

$$\text{Unallocated Cash Balance} = \text{Income} - \text{Monthly Outflow} - \text{Investments} - \text{Savings}$$

### 3.2 Budget Cap Guard

$$\text{Budget Usage \%} = \min\left(100, \left\lfloor \frac{\text{Monthly Calendar Spend}}{\text{Monthly Budget Cap}} \times 100 \right\rfloor\right)$$

- **🟢 Healthy Status**: $\text{Usage} < 70\%$
- **🟡 Caution Status**: $70\% \le \text{Usage} \le 90\%$
- **🚨 Over Target Status**: $\text{Usage} > 90\%$

### 3.3 Emergency Reserve Safety Net Cushion

$$\text{Emergency Reserve Months} = \frac{\text{Total Accumulated Savings}}{\max(1, \text{Monthly Outflow})}$$

$$\text{Savings Rate \%} = \left\lfloor \frac{\text{Total Savings}}{\text{Total Income}} \times 100 \right\rfloor$$

| Reserve Months | Safety Level | Indicator |
| :--- | :--- | :--- |
| $\ge 3.0$ Months | Strong Financial Cushion | 🟢 Strong Safety Net |
| $1.0 - 2.9$ Months | Moderate Reserve | 🟡 Moderate Safety Net |
| $< 1.0$ Month | Low Safety Net Reserve | 🚨 Low Safety Net |

---

## 4. ⚡ Gamification & XP Leveling Math

Location: `src/store/index.ts` → `addXp(amount)`

### 4.1 Level Threshold Formula

$$\text{XP Needed for Next Level} = \text{Current Level} \times 100$$

When $\text{Current XP} \ge \text{XP Needed}$:
- Level increments by `+1`.
- Remaining XP carries over: $\text{Current XP} = \text{Current XP} - \text{XP Needed}$.

### 4.2 XP Award Matrix

| Action | XP Change |
| :--- | :--- |
| **Complete Task / Habit** | $+15\text{ XP}$ |
| **Uncheck Task / Habit** | $-15\text{ XP}$ |
| **Log Missed Habit Journal Reflection** | $+40\text{ XP}$ |
| **Complete Daily Journal Entry** | $+40\text{ XP}$ |

---

## 5. 📊 Analytics & Contribution Matrix Curves

Location: `src/features/analytics/AnalyticsFeature.tsx`

### 5.1 Habit Completion Curve Points (SVG Wave)

$$\text{X Coordinate} = \text{Index} \times \left( \frac{\text{SVG Width}}{\text{Total Days} - 1} \right)$$

$$\text{Y Coordinate} = \text{SVG Height} - \left( \frac{\text{Completion \%}}{100} \times (\text{SVG Height} - 8) \right) - 4$$

### 5.2 GitHub-Style Tasks Heatmap Intensity

For each day in the 49-day (7-week) matrix:

$$\text{Intensity Level} = \begin{cases} 
0, & \text{if } \text{Tasks} = 0 \\
1, & \text{if } \text{Tasks} = 1 \\
2, & \text{if } \text{Tasks} = 2 \\
3, & \text{if } \text{Tasks} = 3 \\
4, & \text{if } \text{Tasks} \ge 4 
\end{cases}$$

---

*This document is automatically maintained for developer reference in [calculation_Readme.md](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/calculation_Readme.md).*
