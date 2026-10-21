import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarDay, CommitItem, ContributorShare } from '../types/repo';
import { Info, Flame, Sparkles, Calendar, CheckCircle } from 'lucide-react';

interface DeveloperActivityHeatmapCardProps {
  days: CalendarDay[];
  commits?: CommitItem[];
  contributors?: ContributorShare[];
}

export const DeveloperActivityHeatmapCard: React.FC<DeveloperActivityHeatmapCardProps> = ({
  days,
  commits,
  contributors,
}) => {
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
    dayOfWeek: string;
    displayDate: string;
    authors?: Record<string, number>;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Available authors from commits or contributors
  const authorOptions = useMemo(() => {
    if (!commits || commits.length === 0) {
      if (!contributors) return [];
      return contributors.map((c) => ({
        username: c.username,
        name: c.name,
        count: c.commits,
      }));
    }

    const counts: Record<string, { username: string; name: string; count: number }> = {};
    commits.forEach((c) => {
      const u = c.author.username;
      if (!counts[u]) {
        counts[u] = { username: u, name: c.author.name, count: 0 };
      }
      counts[u].count += 1;
    });

    return Object.values(counts);
  }, [commits, contributors]);

  // Daily counts per author and in total from real commits
  const { dailyCounts, dailyAuthors } = useMemo(() => {
    const counts: Record<string, number> = {};
    const authorsMap: Record<string, Record<string, number>> = {};

    if (commits && commits.length > 0) {
      commits.forEach((c) => {
        const d = c.date.split('T')[0];
        const u = c.author.username;

        if (selectedAuthor === 'all' || u.toLowerCase() === selectedAuthor.toLowerCase()) {
          counts[d] = (counts[d] || 0) + 1;
        }

        if (!authorsMap[d]) authorsMap[d] = {};
        authorsMap[d][u] = (authorsMap[d][u] || 0) + 1;
      });
    }

    return { dailyCounts: counts, dailyAuthors: authorsMap };
  }, [commits, selectedAuthor]);

  // Aligned 52-week annual grid (Monday to Sunday) ending on latest active week (Sunday 2026-10-11)
  const { weeks, processedDays, maxStreak, curStreak, totalCommits, activeDaysCount, busiestDay } =
    useMemo(() => {
      // 52 full weeks * 7 = 364 days (1 full rolling year)
      const NUM_WEEKS = 52;

      // Dynamically align grid ending on latest commit date or current week
      let latestDate = new Date();
      if (commits && commits.length > 0) {
        const timestamps = commits
          .map((c) => new Date(c.date).getTime())
          .filter((t) => !isNaN(t));
        if (timestamps.length > 0) {
          latestDate = new Date(Math.max(...timestamps));
        }
      } else if (days && days.length > 0) {
        const activeDays = days.filter((d) => d.count > 0);
        if (activeDays.length > 0) {
          latestDate = new Date(activeDays[activeDays.length - 1].date + 'T12:00:00Z');
        }
      }

      // Snap latestDate to Sunday (end of week)
      const endDow = (latestDate.getUTCDay() + 6) % 7; // 0=Mon, 6=Sun
      const daysToSunday = 6 - endDow;
      const gridEndDate = new Date(latestDate.getTime() + daysToSunday * 24 * 60 * 60 * 1000);
      // Start is 52 weeks prior on Monday
      const gridStartDate = new Date(gridEndDate.getTime() - (NUM_WEEKS * 7 - 1) * 24 * 60 * 60 * 1000);

      const pDays: Array<{
        date: string;
        count: number;
        level: 0 | 1 | 2 | 3 | 4;
        dayOfWeek: string;
        displayDate: string;
        authors?: Record<string, number>;
      }> = [];

      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 0; i < NUM_WEEKS * 7; i++) {
        const curDate = new Date(gridStartDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = curDate.toISOString().split('T')[0];

        // Day of week (0=Mon, 6=Sun)
        const dow = (curDate.getUTCDay() + 6) % 7;
        const dayOfWeek = dayNames[dow];

        const dayNum = curDate.getUTCDate();
        const monthName = monthNames[curDate.getUTCMonth()];
        const displayDate = `${dayNum} ${monthName} ${curDate.getUTCFullYear()}`;

        let count = 0;
        if (commits && commits.length > 0) {
          count = dailyCounts[dateStr] || 0;
        } else {
          const fallback = days.find((d) => d.date === dateStr);
          count = fallback ? fallback.count : 0;
        }

        const level: 0 | 1 | 2 | 3 | 4 =
          count === 0 ? 0 : count <= 2 ? 1 : count <= 6 ? 2 : count <= 12 ? 3 : 4;

        pDays.push({
          date: dateStr,
          count,
          level,
          dayOfWeek,
          displayDate,
          authors: dailyAuthors[dateStr],
        });
      }

      // Group into strict 7-day Monday-to-Sunday week columns
      const weekCols: (typeof pDays)[] = [];
      for (let w = 0; w < NUM_WEEKS; w++) {
        weekCols.push(pDays.slice(w * 7, (w + 1) * 7));
      }

      // Compute statistics
      const total = pDays.reduce((sum, d) => sum + d.count, 0);
      const activeDays = pDays.filter((d) => d.count > 0).length;

      // Longest streak
      let longest = 0;
      let running = 0;
      pDays.forEach((d) => {
        if (d.count > 0) {
          running++;
          if (running > longest) longest = running;
        } else {
          running = 0;
        }
      });

      // Active streak leading up to latest activity
      let activeStreak = 0;
      let streakCounted = false;
      for (let i = pDays.length - 1; i >= 0; i--) {
        if (pDays[i].count > 0) {
          activeStreak++;
          streakCounted = true;
        } else if (streakCounted) {
          break;
        }
      }

      // Busiest day
      const busiest = pDays.reduce(
        (max, d) => (d.count > (max?.count || 0) ? d : max),
        pDays[0]
      );

      return {
        weeks: weekCols,
        processedDays: pDays,
        maxStreak: longest,
        curStreak: activeStreak,
        totalCommits: total,
        activeDaysCount: activeDays,
        busiestDay: busiest && busiest.count > 0 ? busiest : null,
      };
    }, [commits, dailyCounts, dailyAuthors, days]);

  // Auto-scroll to the right so recent activity is immediately visible
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [weeks]);

  const levelColors: Record<number, string> = {
    0: 'bg-[#0d1117] border-[#21262d]/80 hover:border-zinc-500',
    1: 'bg-[#0e4429] border-[#0e4429] hover:border-emerald-300',
    2: 'bg-[#006d32] border-[#006d32] hover:border-emerald-300',
    3: 'bg-[#26a641] border-[#26a641] hover:border-emerald-200',
    4: 'bg-[#39d353] border-[#39d353] hover:border-white',
  };

  // Month markers positioned above the week columns where each month begins
  const monthMarkers = useMemo(() => {
    const markers: Record<number, string> = {};
    let lastMonth = '';
    let lastIndex = -10;

    weeks.forEach((week, wIdx) => {
      // Find the first day of a new month
      const firstOfMonth = week.find((d) => d.date.endsWith('-01') || d.date.endsWith('-02') || d.date.endsWith('-03'));
      if (firstOfMonth && wIdx - lastIndex >= 3) {
        const d = new Date(firstOfMonth.date + 'T12:00:00Z');
        const m = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        if (m !== lastMonth) {
          markers[wIdx] = m;
          lastMonth = m;
          lastIndex = wIdx;
        }
      }
    });

    return markers;
  }, [weeks]);

  const latestDay = processedDays.filter((d) => d.count > 0).slice(-1)[0];

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative transition-all">
      {/* Top Header: Title, Description, and Contributor Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-zinc-800/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Flame className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Developer Activity &amp; Streak
              </h2>
              {latestDay && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Latest: {latestDay.displayDate}
                </span>
              )}
              {curStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/25 text-amber-300">
                  ⚡ {curStreak}d streak
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Verified 52-week annual contribution cadence and continuous deployment streak
            </p>
          </div>
        </div>

        {/* Contributor Filter Tabs & Info Button */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {authorOptions.length > 0 && (
            <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setSelectedAuthor('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedAuthor === 'all'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({commits?.length || totalCommits})
              </button>
              {authorOptions.map((auth) => (
                <button
                  key={auth.username}
                  type="button"
                  onClick={() => setSelectedAuthor(auth.username)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedAuthor.toLowerCase() === auth.username.toLowerCase()
                      ? 'bg-zinc-800 text-emerald-400 font-medium shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {auth.name.split(' ')[0]} ({auth.count})
                </button>
              ))}
            </div>
          )}

          <div className="relative group/tooltip">
            <button
              type="button"
              aria-label="Activity heatmap info"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-900"
            >
              <Info className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-7 z-50 hidden group-hover/tooltip:block w-64 p-3 text-xs bg-zinc-950 border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
              <p className="font-semibold text-white mb-1">Contribution Cadence &amp; Streak</p>
              <p className="text-zinc-400 text-[11px] mb-1.5">
                Each cell maps directly to commits authored on that calendar date over the past 52 weeks (1 year).
              </p>
              <div className="text-[10px] font-mono text-zinc-400 space-y-0.5 border-t border-zinc-800 pt-1.5">
                <div>Current Streak: Consecutive active delivery days</div>
                <div>Longest Streak: Peak historical continuous cadence</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Streak & Activity Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
        {/* Metric 1: Current Streak */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Current Streak
            </span>
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {curStreak}
            </span>
            <span className="text-xs text-zinc-400 font-mono">days</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span>Active cadence</span>
          </div>
        </div>

        {/* Metric 2: Longest Streak */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Longest Streak
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {maxStreak}
            </span>
            <span className="text-xs text-zinc-400 font-mono">days</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            Personal record
          </div>
        </div>

        {/* Metric 3: Total Commits */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Total Commits
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">52W</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {totalCommits}
            </span>
            <span className="text-xs text-zinc-400 font-mono">commits</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {selectedAuthor === 'all' ? 'All contributors' : `@${selectedAuthor}`}
          </div>
        </div>

        {/* Metric 4: Active Days */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Active Days
            </span>
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {activeDaysCount}
            </span>
            <span className="text-xs text-zinc-400 font-mono">/ 365d</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {((activeDaysCount / 364) * 100).toFixed(1)}% commit density
          </div>
        </div>
      </div>

      {/* 52-Week Full Year Calendar Heatmap Grid */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3 my-1">
        <div className="flex items-start gap-2">
          {/* Day of Week Labels: Exactly locked to 7 rows with same height and gap */}
          <div className="w-7 shrink-0 flex flex-col">
            {/* Spacer matching month row height */}
            <div className="h-4 mb-1.5" />
            <div className="flex flex-col gap-1 text-[10px] text-zinc-400 font-mono select-none">
              <div className="h-2.5 flex items-center justify-end pr-1.5 leading-none">Mon</div>
              <div className="h-2.5" />
              <div className="h-2.5 flex items-center justify-end pr-1.5 leading-none">Wed</div>
              <div className="h-2.5" />
              <div className="h-2.5 flex items-center justify-end pr-1.5 leading-none">Fri</div>
              <div className="h-2.5" />
              <div className="h-2.5" />
            </div>
          </div>

          {/* Horizontally scrollable weeks container */}
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            role="region"
            aria-label="Developer activity calendar heatmap"
            className="flex-1 min-w-0 overflow-x-auto pb-1 focus:outline-hidden scrollbar-thin scrollbar-thumb-zinc-800"
          >
            <div className="min-w-max w-full pr-3.5">
              {/* Month labels strictly aligned above week columns */}
              <div className="flex justify-between gap-[3px] mb-1.5 h-4 w-full">
                {weeks.map((_, wIdx) => {
                  const label = monthMarkers[wIdx];
                  // If marker is within the last 3 weeks, anchor to the right to prevent spilling past right edge
                  const isNearRightEdge = wIdx >= weeks.length - 3;
                  return (
                    <div key={wIdx} className="flex-1 min-w-[10px] max-w-[14px] shrink-0 relative">
                      {label && (
                        <span
                          className={`absolute top-0 whitespace-nowrap text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-semibold pointer-events-none ${
                            isNearRightEdge ? 'right-0 text-right' : 'left-0'
                          }`}
                        >
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Weeks Grid columns (52 full rolling Monday-Sunday columns, filling width) */}
              <div className="flex justify-between gap-[3px] w-full">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex-1 min-w-[10px] max-w-[14px] shrink-0 flex flex-col gap-1">
                    {week.map((day, dIdx) => {
                      const isLatest = latestDay?.date === day.date && day.count > 0;
                      const isHovered = hoveredDay?.date === day.date;

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-full aspect-square rounded-[2px] border transition-all cursor-pointer relative ${
                            levelColors[day.level]
                          } ${
                            isHovered
                              ? 'ring-2 ring-white z-20 scale-125'
                              : isLatest
                              ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-black'
                              : ''
                          }`}
                          title={`${day.dayOfWeek}, ${day.displayDate}: ${day.count} commits`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar & Legend */}
      <div className="pt-2.5 mt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Left: Dynamic activity / hover readout */}
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] min-h-[20px]">
          {hoveredDay ? (
            <div className="flex items-center gap-2 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">{hoveredDay.dayOfWeek}, {hoveredDay.displayDate}</strong>:
                {' '}
                <span className="text-emerald-400 font-bold">{hoveredDay.count}</span> commit{hoveredDay.count === 1 ? '' : 's'}
                {hoveredDay.authors && (
                  <span className="text-zinc-400 ml-1.5 font-normal">
                    ({Object.entries(hoveredDay.authors).map(([u, c]) => `${u}: ${c}`).join(' · ')})
                  </span>
                )}
              </span>
            </div>
          ) : busiestDay ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Peak activity: <strong className="text-zinc-200">{busiestDay.dayOfWeek}, {busiestDay.displayDate}</strong> with <strong className="text-emerald-400">{busiestDay.count} commits</strong>
                {selectedAuthor !== 'all' && (
                  <span className="text-amber-400 ml-1.5">· by @{selectedAuthor}</span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Continuous chronological delivery cadence tracked on default branch.</span>
            </div>
          )}
        </div>

        {/* Right: LESS ... MORE Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono shrink-0 self-end sm:self-auto">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                className={`w-2.5 h-2.5 rounded-[2px] ${levelColors[lvl]}`}
                title={`Level ${lvl}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
