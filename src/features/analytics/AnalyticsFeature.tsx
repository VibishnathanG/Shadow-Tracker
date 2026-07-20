'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';
import { useShadowTrackerStore } from '@/store';
import EmptyState from '@/components/EmptyState';
import { format, parseISO, subDays, eachDayOfInterval, getHours } from 'date-fns';

const HEX_POINTS = (() => {
  const pts: { cx: number; cy: number }[] = [];
  const size = 40;
  const dx = size * 1.5;
  const dy = size * Math.sqrt(3);
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 12; col++) {
      const x = col * dx + (row % 2 === 1 ? dx / 2 : 0);
      const y = row * dy;
      pts.push({ cx: x, cy: y });
    }
  }
  return pts;
})();

const hexPath = (cx: number, cy: number, r: number) => {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    angles
      .map((a, i) => {
        const rad = (Math.PI / 180) * a;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
};

const BackgroundDecorations = () => {
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${(i * 13) % 100}%`,
    top: `${(i * 29) % 100}%`,
    width: `${(i % 4) + 1}px`,
    height: `${(i % 4) + 1}px`,
    xTarget: (i % 30) - 15,
    duration: 3 + (i % 5),
    delay: (i % 5),
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <motion.div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-lighten"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], x: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' as const }}
      />
      <motion.div 
        className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-500/20 rounded-full blur-[150px] mix-blend-screen dark:mix-blend-lighten"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' as const, delay: 2 }}
      />
      
      <motion.svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] opacity-[0.06] dark:opacity-[0.08]"
        viewBox="0 0 720 720"
        style={{ color: 'var(--text-primary, currentColor)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: 'linear' as const }}
      >
        {HEX_POINTS.map((p, i) => (
          <motion.path
            key={i}
            d={hexPath(p.cx, p.cy, 18)}
            fill="none"
            stroke="var(--bg-surface-elevated, currentColor)"
            strokeWidth={0.4}
            className="text-primary"
            style={{ stroke: 'currentColor' }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 6 + (i % 5) * 1.5, repeat: Infinity, ease: 'easeInOut' as const, delay: (i % 8) * 0.5 }}
          />
        ))}
      </motion.svg>
      <motion.svg
        className="absolute top-[5%] right-[5%] w-[800px] h-[800px] text-primary opacity-[0.07] mix-blend-plus-lighter"
        viewBox="0 0 100 100"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' as const }}
      >
        {[40, 30, 20].map((r, i) => (
          <motion.circle 
            key={i} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth={0.5 - i * 0.1} 
            strokeDasharray={i % 2 === 0 ? "2 4" : "none"} 
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4 + i * 2, repeat: Infinity, ease: 'easeInOut' as const }}
          />
        ))}
        <line x1="50" y1="50" x2="50" y2="10" stroke="currentColor" strokeWidth="1" />
        <motion.circle cx="50" cy="10" r="2" fill="currentColor" 
          animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }} 
          transition={{ duration: 2, repeat: Infinity }} 
        />
      </motion.svg>
      <div className="absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent"
            style={{ 
              left: `${(i + 1) * 4}%`, 
              height: `${20 + (i % 5) * 10}%`,
              opacity: 0.3 + (i % 3) * 0.2
            }}
            animate={{ 
              y: ['-100vh', '150vh'],
            }}
            transition={{ 
              duration: 8 + (i % 7) * 2, 
              repeat: Infinity, 
              ease: 'linear' as const,
              delay: -(i % 10) * 2
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]">
        {particles.map((p) => (
          <motion.div
            key={`particle-${p.id}`}
            className="absolute rounded-full bg-primary mix-blend-screen"
            style={{
              left: p.left,
              top: p.top,
              width: p.width,
              height: p.height,
              boxShadow: '0 0 10px 2px var(--primary)',
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, p.xTarget, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut' as const,
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const RadialChart = ({ value, label, color, size = 100, strokeWidth = 8 }: { value: number, label: string, color: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 filter drop-shadow-md">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut" as const, delay: 0.2 }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-2xl font-black tracking-tighter leading-none text-foreground"
        >
          {value}%
        </motion.span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{label}</span>
      </div>
    </div>
  );
};

export const AnalyticsFeature = () => {
  const { dailyLogs, tasks, habits } = useShadowTrackerStore();
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; score: number; date: string } | null>(null);

  const stats = useMemo(() => {
    if (dailyLogs.length === 0) return null;

    const sortedLogs = [...dailyLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartLogs = sortedLogs.slice(-15);
    const totalLogs = dailyLogs.length;
    const averageFocusScore = Math.round(dailyLogs.reduce((acc, log) => acc + log.focusScore, 0) / (totalLogs || 1));
    const longestHabitStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
    const totalCompletedHabits = habits.reduce((total, h) => total + h.completedDates.length, 0);
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalCompletedTasks = completedTasks.length;
    
    const hourCounts: Record<number, number> = {};
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const hour = getHours(parseISO(t.completedAt));
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const mostProductiveHourRaw = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '10';
    const ampm = parseInt(mostProductiveHourRaw) >= 12 ? 'PM' : 'AM';
    const displayHour = (parseInt(mostProductiveHourRaw) % 12 || 12) + ':00 ' + ampm;

    const taskVelocity = totalLogs > 0 ? (totalCompletedTasks / totalLogs).toFixed(1) : '0';
    const habitRanking = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length).slice(0, 3);
    const today = new Date();
    const startDate = subDays(today, 49);
    const heatmapDays = eachDayOfInterval({ start: startDate, end: today }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = dailyLogs.find(l => l.date === dateStr);
      return {
        date: dateStr,
        score: log ? log.focusScore : 0
      };
    });

    return {
      chartLogs,
      averageFocusScore,
      longestHabitStreak,
      totalCompletedHabits,
      totalCompletedTasks,
      mostProductiveHour: displayHour,
      taskVelocity,
      habitRanking,
      heatmapDays
    };
  }, [dailyLogs, tasks, habits]);

  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const { points, linePath, areaPath } = useMemo(() => {
    const logs = stats?.chartLogs || [];
    const pts = logs.map((log, index) => {
      const x = padding.left + (index / (Math.max(logs.length - 1, 1))) * (chartWidth - padding.left - padding.right);
      const y = padding.top + (1 - log.focusScore / 100) * (chartHeight - padding.top - padding.bottom);
      return { x, y, score: log.focusScore, date: log.date };
    });

    const lp = pts.length > 0 
      ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const ap = pts.length > 0
      ? `${lp} L ${pts[pts.length - 1].x} ${chartHeight - padding.bottom} L ${pts[0].x} ${chartHeight - padding.bottom} Z`
      : '';

    return { points: pts, linePath: lp, areaPath: ap };
  }, [stats?.chartLogs, chartWidth, chartHeight, padding.left, padding.top, padding.right, padding.bottom]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Lucide.Activity size={48} className="text-primary mb-4 animate-pulse" />
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Gathering Intelligence...</p>
      </div>
    );
  }

  const {
    chartLogs,
    averageFocusScore,
    longestHabitStreak,
    totalCompletedHabits,
    totalCompletedTasks,
    mostProductiveHour,
    taskVelocity,
    habitRanking,
    heatmapDays
  } = stats;

  return (
    <motion.div 
      className="relative space-y-8 pb-12"
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <BackgroundDecorations />
      <div className="flex items-end justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            Command Center
          </h2>
          <p className="text-xs text-primary font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" /> Live Telemetry Active
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <RadialChart 
            value={chartLogs[chartLogs.length - 1]?.focusScore || 0} 
            label="Today's Focus" 
            color="var(--primary)" 
            size={86} 
            strokeWidth={6} 
          />
        </motion.div>
      </div>
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {[
          { label: 'Avg Focus Index', value: `${averageFocusScore}%`, icon: Lucide.Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Peak Streak', value: `${longestHabitStreak}d`, icon: Lucide.Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Task Velocity', value: `${taskVelocity}/d`, icon: Lucide.Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Action Count', value: totalCompletedTasks + totalCompletedHabits, icon: Lucide.Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            className="tile p-5 relative overflow-hidden group"
            whileTap={{ scale: 0.95 }}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-60`} />
            <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl w-fit mb-4`}>
              <stat.icon size={18} />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            <div className="text-3xl font-black tracking-tight text-foreground mt-1">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="md:col-span-2 tile p-6 relative overflow-hidden"
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Lucide.LineChart size={14} className="text-primary" /> Focus Timeline
            </h3>
            <div className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
              Last 15 Records
            </div>
          </div>
          
          <div className="w-full relative aspect-[2.5/1] min-h-[220px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val} className="opacity-30">
                  <line
                    x1={padding.left} y1={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom)}
                    x2={chartWidth - padding.right} y2={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom)}
                    className="stroke-border" strokeWidth={1} strokeDasharray="4,4"
                  />
                  <text x={padding.left - 10} y={padding.top + (1 - val / 100) * (chartHeight - padding.top - padding.bottom) + 3} 
                        className="fill-muted-foreground text-xs font-bold" textAnchor="end">{val}</text>
                </g>
              ))}
              {points.map((p, i) => (
                (i % 2 === 0 || i === points.length - 1) && (
                  <text key={`label-${p.date}`} x={p.x} y={chartHeight - 10} className="fill-muted-foreground text-xs font-bold" textAnchor="middle">
                    {format(parseISO(p.date), 'dd/MM')}
                  </text>
                )
              ))}
              {areaPath && (
                <motion.path
                  d={areaPath} fill="url(#chartGradient)"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                />
              )}
              {linePath && (
                <motion.path
                  d={linePath} className="stroke-primary fill-transparent" strokeWidth={2.5} filter="url(#glow)"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" as const }}
                />
              )}
              {points.map((p, i) => (
                <g key={p.date} 
                   onMouseEnter={() => setHoveredPoint(p)}
                   onMouseLeave={() => setHoveredPoint(null)}
                   className="cursor-crosshair group/point"
                >
                  <motion.circle
                    cx={p.x} cy={p.y} r={hoveredPoint?.date === p.date ? 6 : 4}
                    className="fill-card stroke-primary" strokeWidth={2} filter="url(#glow)"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.05 }}
                  />
                  <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
                </g>
              ))}
            </svg>
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                  className="absolute z-10 pointer-events-none bg-popover/95 backdrop-blur-md border border-border shadow-xl p-3 rounded-2xl flex flex-col items-center"
                  style={{ left: `calc(${(hoveredPoint.x / chartWidth) * 100}% - 44px)`, top: `calc(${(hoveredPoint.y / chartHeight) * 100}% - 80px)` }}
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase">{format(parseISO(hoveredPoint.date), 'MMM dd')}</span>
                  <span className="text-xl font-black text-primary leading-none mt-1">{hoveredPoint.score}%</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <motion.div 
          className="space-y-6"
          layout
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.div className="tile p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Prime Time</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Lucide.Clock size={24} />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-foreground">{mostProductiveHour}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Peak execution window</div>
              </div>
            </div>
          </motion.div>
          <motion.div className="tile p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Top Protocols</h3>
            <div className="space-y-4">
              {habitRanking.length > 0 ? habitRanking.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 group/habit">
                  <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold group-hover/habit:bg-primary/20 group-hover/habit:text-primary transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-foreground">{h.name}</div>
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (h.completedDates.length / 30) * 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" as const, delay: 0.5 + i * 0.1 }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-black bg-secondary px-2 py-1 rounded-md">{h.completedDates.length}x</div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground italic">No habit data available.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <motion.div 
        className="tile p-6"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Activity Matrix</h3>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-1 rounded-md">Last 49 Days</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center lg:justify-start">
          {heatmapDays.map((day, i) => {
            const intensity = day.score === 0 ? 0 : day.score < 40 ? 1 : day.score < 70 ? 2 : day.score < 90 ? 3 : 4;
            const colors = [
              'bg-secondary/40', 
              'bg-primary/30', 
              'bg-primary/60', 
              'bg-primary/90', 
              'bg-primary shadow-[0_0_8px_var(--primary)] scale-110'
            ];
            
            return (
              <div key={day.date} className="relative group/heatmap">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.01 }}
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-md ${colors[intensity]} cursor-pointer`}
                  whileHover={{ scale: 1.3, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/heatmap:block z-50 pointer-events-none">
                  <motion.div initial={{ opacity: 0, y: 5, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-surface-elevated border border-border px-2 py-1 rounded shadow-xl whitespace-nowrap flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="text-sm">{['💤', '🌱', '🔥', '🚀', '💎'][intensity]}</span>
                    <div className="flex flex-col">
                      <span>{format(parseISO(day.date), 'do MMM')}</span>
                      <span className="text-muted-foreground">{day.score}% focus</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-secondary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary/90" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Lucide.ShieldCheck size={14} /> Systems Nominal
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsFeature;
