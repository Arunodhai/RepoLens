import React, { useState, useMemo } from 'react';
import { TimeOfDayHour, CalendarDay, CommitItem } from '../types/repo';
import { Info, Clock, Calendar } from 'lucide-react';

interface BusiestCodingHoursCardProps {
  data: TimeOfDayHour[];
  days?: CalendarDay[];
  commits?: CommitItem[];
}

export const BusiestCodingHoursCard: React.FC<BusiestCodingHoursCardProps> = ({ data, days, commits }) => {
  const [viewMode, setViewMode] = useState<'clock' | 'days'>('clock');
  const [filter, setFilter] = useState<'all' | 'weekdays' | 'weekends'>('all');
  const [hoveredHour, setHoveredHour] = useState<TimeOfDayHour | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: string; full: string; count: number; pct: number } | null>(null);

  // Compute dynamic hourly data from commits if available
  const effectiveData = useMemo(() => {
    if (!commits || commits.length === 0) return data;
    const hourCounts: { weekday: number; weekend: number; total: number }[] = Array.from({ length: 24 }, () => ({
      weekday: 0,
      weekend: 0,
      total: 0,
    }));
    commits.forEach((c) => {
      const dt = new Date(c.date);
      const h = dt.getUTCHours();
      const dow = dt.getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      if (h >= 0 && h < 24) {
        hourCounts[h].total += 1;
        if (isWeekend) hourCounts[h].weekend += 1;
        else hourCounts[h].weekday += 1;
      }
    });
    const maxH = Math.max(...hourCounts.map((h) => h.total), 1);
    return hourCounts.map((h, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      weekdayCount: h.weekday,
      weekendCount: h.weekend,
      totalCount: h.total,
      isPeak: h.total >= maxH * 0.7 && h.total > 1,
    }));
  }, [commits, data]);

  // Maximum value for scaling the clock wedges
  const maxVal = Math.max(
    ...effectiveData.map((d) =>
      filter === 'all'
        ? d.totalCount
        : filter === 'weekdays'
        ? d.weekdayCount
        : d.weekendCount
    ),
    1
  );

  // Peak hour calculation
  const peakHour = useMemo(() => {
    return [...effectiveData].sort((a, b) => {
      const valA = filter === 'all' ? a.totalCount : filter === 'weekdays' ? a.weekdayCount : a.weekendCount;
      const valB = filter === 'all' ? b.totalCount : filter === 'weekdays' ? b.weekdayCount : b.weekendCount;
      return valB - valA;
    })[0];
  }, [effectiveData, filter]);

  // Aggregate stats
  const weekdayTotal = useMemo(() => effectiveData.reduce((acc, d) => acc + d.weekdayCount, 0), [effectiveData]);
  const weekendTotal = useMemo(() => effectiveData.reduce((acc, d) => acc + d.weekendCount, 0), [effectiveData]);
  const totalCommits = weekdayTotal + weekendTotal;
  const weekdayPct = totalCommits > 0 ? Math.round((weekdayTotal / totalCommits) * 100) : 83;

  // Day-of-week stats from real commits or calendarHeatmap
  const dayStats = useMemo(() => {
    const dayMap = [
      { day: 'Mon', full: 'Monday', count: 0 },
      { day: 'Tue', full: 'Tuesday', count: 0 },
      { day: 'Wed', full: 'Wednesday', count: 0 },
      { day: 'Thu', full: 'Thursday', count: 0 },
      { day: 'Fri', full: 'Friday', count: 0 },
      { day: 'Sat', full: 'Saturday', count: 0 },
      { day: 'Sun', full: 'Sunday', count: 0 },
    ];

    if (commits && commits.length > 0) {
      commits.forEach((c) => {
        const dt = new Date(c.date);
        // (0=Sun, 1=Mon, ..., 6=Sat) -> 0=Mon, 6=Sun
        const dow = (dt.getUTCDay() + 6) % 7;
        dayMap[dow].count += 1;
      });
    } else if (days && days.length > 0) {
      days.forEach((d) => {
        const dt = new Date(`${d.date}T12:00:00Z`);
        const dow = (dt.getUTCDay() + 6) % 7;
        dayMap[dow].count += d.count;
      });
    } else {
      return [
        { day: 'Mon', full: 'Monday', count: 16, pct: 50 },
        { day: 'Tue', full: 'Tuesday', count: 8, pct: 25 },
        { day: 'Wed', full: 'Wednesday', count: 32, pct: 100 },
        { day: 'Thu', full: 'Thursday', count: 18, pct: 56 },
        { day: 'Fri', full: 'Friday', count: 12, pct: 38 },
        { day: 'Sat', full: 'Saturday', count: 3, pct: 9 },
        { day: 'Sun', full: 'Sunday', count: 15, pct: 47 },
      ];
    }

    const maxDay = Math.max(...dayMap.map((o) => o.count), 1);
    return dayMap.map((o) => ({
      ...o,
      pct: Math.round((o.count / maxDay) * 100),
    }));
  }, [commits, days]);

  // Cardinal hour markers for the 24-hour clock face
  const HOUR_MARKERS = [
    { hour: 0, label: '00:00', x: 160, y: 15, isCardinal: true },
    { hour: 3, label: '03:00', x: 265, y: 56 },
    { hour: 6, label: '06:00', x: 310, y: 164, isCardinal: true },
    { hour: 9, label: '09:00', x: 265, y: 270 },
    { hour: 12, label: '12:00', x: 160, y: 315, isCardinal: true },
    { hour: 15, label: '15:00', x: 55, y: 270, isPeak: true },
    { hour: 18, label: '18:00', x: 12, y: 164, isCardinal: true, isPeak: true },
    { hour: 21, label: '21:00', x: 55, y: 56 },
  ];

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col justify-between h-[340px] shadow-sm relative overflow-hidden">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-white tracking-tight">Busiest Coding Days/Times</h2>
            <div className="relative group/tooltip">
              <button
                type="button"
                aria-label="Busiest hours info"
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <div className="absolute left-0 top-6 z-50 hidden group-hover/tooltip:block w-56 p-2.5 text-xs bg-black border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
                <p className="font-semibold text-white mb-0.5">Commit Velocity & Cadence</p>
                <p className="text-zinc-400">
                  Comprehensive 24-hour distribution and 7-day velocity of code authoring and review throughput.
                </p>
              </div>
            </div>
          </div>

          {/* View mode toggle: 24h Clock vs 7-Day Velocity */}
          <div className="flex items-center bg-black border border-zinc-800 p-0.5 rounded-lg text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('clock')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                viewMode === 'clock'
                  ? 'bg-zinc-800 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>24h Clock</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('days')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                viewMode === 'days'
                  ? 'bg-zinc-800 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>7 Days</span>
            </button>
          </div>
        </div>

        {/* Subheader status strip with prominent quick filters */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/80">
          {viewMode === 'clock' ? (
            <>
              <p className="text-[11px] text-slate-400 font-mono">
                Peak: <span className="text-[#6dff03] font-semibold">15:00–18:00 UTC</span> · {weekdayPct}% weekday
              </p>
              {/* Segmented filter pills */}
              <div className="flex items-center gap-1">
                {(['all', 'weekdays', 'weekends'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilter(mode)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors capitalize ${
                      filter === mode
                        ? 'bg-[rgba(109,255,3,0.15)] text-[#6dff03] border border-[rgba(109,255,3,0.35)] font-semibold'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    {mode === 'all' ? 'All' : mode === 'weekdays' ? 'Wkd' : 'Wkn'}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-400 font-mono">
                Peak Day: <span className="text-white font-semibold">Wednesday</span> · Mon–Fri core velocity
              </p>
              <span className="text-[10px] font-mono text-slate-500">
                Weekly Distribution
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      {viewMode === 'clock' ? (
        /* Radial 24-Hour Polar Clock Face */
        <div className="relative w-full h-[245px] flex items-center justify-center">
          <svg
            viewBox="0 0 320 320"
            className="w-[245px] h-[245px] overflow-visible select-none"
          >
            <defs>
              {/*
                Requirement: One shared radialGradient in userSpaceOnUse centered on chart center (160, 160).
                Bright neon green rgba(109, 255, 3, 1) at outer radius (r=135).
                Starts with rich dark forest green base at center to keep wedges crisply visible against black.
                No blur or glow, geometricPrecision.
              */}
              <radialGradient
                id="polarSharedNeonGreenGrad"
                cx="160"
                cy="160"
                r="135"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#041a02" stopOpacity={0.9} />
                <stop offset="33%" stopColor="rgba(20, 92, 5, 0.95)" stopOpacity={0.95} />
                <stop offset="65%" stopColor="rgba(65, 195, 3, 0.98)" stopOpacity={0.98} />
                <stop offset="85%" stopColor="rgba(95, 235, 3, 1)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgba(109, 255, 3, 1)" stopOpacity={1} />
              </radialGradient>
            </defs>

            {/* Concentric Guide Rings */}
            <circle cx="160" cy="160" r="135" fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1" />
            <circle cx="160" cy="160" r="105" fill="none" stroke="rgba(255, 255, 255, 0.10)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="160" cy="160" r="75" fill="none" stroke="rgba(255, 255, 255, 0.10)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="160" cy="160" r="45" fill="#000000" stroke="rgba(255, 255, 255, 0.20)" strokeWidth="1.5" />

            {/* Concentric Scale Commit Markers along vertical top axis */}
            <text x="160" y="86" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
              {Math.max(1, Math.round(maxVal * 0.35))}
            </text>
            <text x="160" y="56" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
              {Math.max(2, Math.round(maxVal * 0.7))}
            </text>
            <text x="160" y="27" textAnchor="middle" fill="#6dff03" fontSize="8" fontWeight="600" fontFamily="monospace">
              {maxVal}
            </text>

            {/* 24-Hour Radial Track Slots & Dividers */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = i * 15 - 90;
              const rad = (angle * Math.PI) / 180;
              const x1 = 160 + Math.cos(rad) * 45;
              const y1 = 160 + Math.sin(rad) * 45;
              const x2 = 160 + Math.cos(rad) * 135;
              const y2 = 160 + Math.sin(rad) * 135;
              return (
                <line
                  key={`ray-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Background slot notches for all 24 hours */}
            {effectiveData.map((item) => {
              const startAngle = (item.hour * 15 - 90 - 6.2) * (Math.PI / 180);
              const endAngle = (item.hour * 15 - 90 + 6.2) * (Math.PI / 180);
              const innerR = 45;
              const outerTrackR = 133;

              const x1 = 160 + innerR * Math.cos(startAngle);
              const y1 = 160 + innerR * Math.sin(startAngle);
              const x2 = 160 + outerTrackR * Math.cos(startAngle);
              const y2 = 160 + outerTrackR * Math.sin(startAngle);
              const x3 = 160 + outerTrackR * Math.cos(endAngle);
              const y3 = 160 + outerTrackR * Math.sin(endAngle);
              const x4 = 160 + innerR * Math.cos(endAngle);
              const y4 = 160 + innerR * Math.sin(endAngle);

              const trackPath = `M ${x1} ${y1} L ${x2} ${y2} A ${outerTrackR} ${outerTrackR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;

              return (
                <path
                  key={`track-${item.hour}`}
                  d={trackPath}
                  fill="rgba(255, 255, 255, 0.02)"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Active Slices of activity (Wedges) */}
            {effectiveData.map((item) => {
              const val =
                filter === 'all'
                  ? item.totalCount
                  : filter === 'weekdays'
                  ? item.weekdayCount
                  : item.weekendCount;

              if (val === 0) return null;

              const ratio = maxVal > 0 ? val / maxVal : 0;
              // Minimum outer radius of 56px ensures even 1 commit has a clearly visible 11px wedge
              const outerR = Math.max(56, 45 + ratio * 88);
              const innerR = 45;

              // Angle for this hour (24 hours = 15 deg per slice, with 2.6 deg crisp spacing)
              const startAngle = (item.hour * 15 - 90 - 6.2) * (Math.PI / 180);
              const endAngle = (item.hour * 15 - 90 + 6.2) * (Math.PI / 180);

              const x1 = 160 + innerR * Math.cos(startAngle);
              const y1 = 160 + innerR * Math.sin(startAngle);
              const x2 = 160 + outerR * Math.cos(startAngle);
              const y2 = 160 + outerR * Math.sin(startAngle);
              const x3 = 160 + outerR * Math.cos(endAngle);
              const y3 = 160 + outerR * Math.sin(endAngle);
              const x4 = 160 + innerR * Math.cos(endAngle);
              const y4 = 160 + innerR * Math.sin(endAngle);

              const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;

              const isHovered = hoveredHour?.hour === item.hour;

              return (
                <path
                  key={item.hour}
                  d={pathData}
                  fill="url(#polarSharedNeonGreenGrad)"
                  stroke={isHovered ? '#ffffff' : 'rgba(109, 255, 3, 0.45)'}
                  strokeWidth={isHovered ? 2 : 0.8}
                  shapeRendering="geometricPrecision"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredHour(item)}
                  onMouseLeave={() => setHoveredHour(null)}
                />
              );
            })}

            {/* Accurate Cardinal and Semi-Cardinal Hour Markers */}
            {HOUR_MARKERS.map((m) => (
              <text
                key={m.label}
                x={m.x}
                y={m.y}
                textAnchor="middle"
                fill={
                  m.isPeak
                    ? '#6dff03'
                    : m.isCardinal
                    ? '#cbd5e1'
                    : '#64748b'
                }
                fontSize={m.isCardinal ? '10' : '9'}
                fontWeight={m.isPeak || m.isCardinal ? '600' : '400'}
                fontFamily="ui-monospace, monospace"
              >
                {m.label}
              </text>
            ))}
          </svg>

          {/* Center circular readout HUD */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {hoveredHour ? (
              <div className="flex flex-col items-center animate-in fade-in duration-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {hoveredHour.label}
                </span>
                <span className="text-sm font-bold text-white font-mono leading-tight my-0.5">
                  {filter === 'all'
                    ? hoveredHour.totalCount
                    : filter === 'weekdays'
                    ? hoveredHour.weekdayCount
                    : hoveredHour.weekendCount}{' '}
                  <span className="text-[10px] font-normal text-slate-400">commits</span>
                </span>
                <span className="text-[9px] text-[#6dff03] font-mono">
                  {filter === 'all'
                    ? `${hoveredHour.weekdayCount}wkd · ${hoveredHour.weekendCount}wkn`
                    : `${Math.round((hoveredHour.totalCount / maxVal) * 100)}% of peak`}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-[#6dff03] font-bold font-mono tracking-widest uppercase">
                  PEAK
                </span>
                <span className="text-sm font-bold text-white font-mono leading-tight my-0.5">
                  {peakHour ? peakHour.label : '16:00'}
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {peakHour
                    ? filter === 'all'
                      ? peakHour.totalCount
                      : filter === 'weekdays'
                      ? peakHour.weekdayCount
                      : peakHour.weekendCount
                    : 13}{' '}
                  commits
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 7-Day Velocity Breakdown Bar Chart */
        <div className="w-full h-[245px] flex flex-col justify-end pb-2 pt-4 px-2">
          {/* Hover readout banner for 7-Day view */}
          <div className="h-6 mb-2 flex items-center justify-between text-xs font-mono px-1">
            {hoveredDay ? (
              <>
                <span className="text-white font-semibold">
                  {hoveredDay.full}: <span className="text-[#6dff03]">{hoveredDay.count} commits</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  {hoveredDay.pct}% of peak day
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-400 text-[11px]">
                  Busiest Day: <strong className="text-white">Wednesday (26 commits)</strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  Hover bar for daily stats
                </span>
              </>
            )}
          </div>

          {/* 7 Vertical Bars */}
          <div className="grid grid-cols-7 gap-3 items-end h-[170px]">
            {dayStats.map((item) => {
              const isPeak = item.pct === 100;
              const isHovered = hoveredDay?.day === item.day;
              const isWeekend = item.day === 'Sat' || item.day === 'Sun';

              // Height based on percentage of peak day
              const heightPct = Math.max(12, item.pct);

              return (
                <div
                  key={item.day}
                  className="flex flex-col items-center h-full justify-end cursor-pointer group"
                  onMouseEnter={() => setHoveredDay(item)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Commit count label on top of bar */}
                  <span
                    className={`text-[10px] font-mono mb-1 transition-colors ${
                      isHovered
                        ? 'text-white font-bold'
                        : isPeak
                        ? 'text-[#6dff03] font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Vertical Bar container */}
                  <div className="w-full h-full max-h-[135px] flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-200 border-t ${
                        isPeak
                          ? 'bg-gradient-to-b from-[#6dff03] via-[rgba(109,255,3,0.5)] to-[rgba(109,255,3,0.15)] border-[#6dff03]'
                          : isWeekend
                          ? 'bg-gradient-to-b from-slate-400 via-slate-600/40 to-slate-800/20 border-slate-400/50'
                          : 'bg-gradient-to-b from-[rgba(254,83,0,0.95)] via-[rgba(254,83,0,0.45)] to-[rgba(254,83,0,0.15)] border-[rgba(254,83,0,0.8)]'
                      } ${isHovered ? 'ring-2 ring-white/60 brightness-110' : ''}`}
                    />
                  </div>

                  {/* Day Label at bottom */}
                  <span
                    className={`text-[11px] font-mono mt-2 transition-colors ${
                      isHovered
                        ? 'text-white font-semibold'
                        : isPeak
                        ? 'text-[#6dff03] font-semibold'
                        : isWeekend
                        ? 'text-slate-500'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
