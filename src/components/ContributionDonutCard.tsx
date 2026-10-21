import React, { useState } from 'react';
import { ContributorShare } from '../types/repo';
import { Info, Users } from 'lucide-react';

interface ContributionDonutCardProps {
  contributors: ContributorShare[];
  onSelectContributor?: (contributor: ContributorShare) => void;
}

// Signature Sky Blue used across other parts of the dashboard (KPI Cards, Hotspots, Code Explorer, DAG, Health Radar)
export const DONUT_THEME_BLUE = '#38bdf8'; // Sky Blue (#38bdf8)
export const DONUT_THEME_BLUE_GRADIENT_TO = '#0284c7'; // Deep Sky Blue (#0284c7)

/**
 * Normalizes contributor colors for the Donut Chart.
 * Replaces orange with the signature cyan/blue used across other parts of the platform.
 */
export const getDonutContributorColor = (rawColor?: string, index: number = 0): string => {
  if (!rawColor) return index === 0 ? DONUT_THEME_BLUE : '#10b981';
  const c = rawColor.toLowerCase();
  if (
    c.includes('254, 83, 0') ||
    c.includes('254,83,0') ||
    c.includes('fe5300') ||
    c.includes('f97316') ||
    c.includes('ea580c') ||
    c.includes('f59e0b') ||
    c.includes('orange') ||
    c.includes('amber')
  ) {
    return DONUT_THEME_BLUE;
  }
  return rawColor;
};

export const ContributionDonutCard: React.FC<ContributionDonutCardProps> = ({
  contributors,
  onSelectContributor,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Geometry configuration in userSpaceOnUse coordinate system (viewBox 0 0 240 240)
  const cx = 120;
  const cy = 120;
  const baseInnerRadius = 54;
  const baseOuterRadius = 88;

  const totalShare = contributors.reduce((sum, c) => sum + (c.sharePct || 0), 0) || 100;
  const totalCommits = contributors.reduce((sum, c) => sum + (c.commits || 0), 0);
  const topContributor = contributors.length > 0
    ? [...contributors].sort((a, b) => (b.sharePct || 0) - (a.sharePct || 0))[0]
    : null;

  // Calculate arc angles for each contributor slice
  let currentAngle = -90; // Start at 12 o'clock
  const gap = contributors.length > 6 ? 1 : contributors.length > 1 ? 2 : 0; // gap in degrees between sectors

  const sectors = contributors.map((c, index) => {
    const isSelected = activeIndex === index;
    const innerRadius = isSelected ? baseInnerRadius - 2 : baseInnerRadius;
    const outerRadius = isSelected ? baseOuterRadius + 5 : baseOuterRadius;
    const midRadius = (innerRadius + outerRadius) / 2;

    const angleSpan = (c.sharePct / totalShare) * 360;
    const startDeg = currentAngle + gap / 2;
    const endDeg = currentAngle + angleSpan - gap / 2;
    currentAngle += angleSpan;

    const radStart = (startDeg * Math.PI) / 180;
    const radEnd = (endDeg * Math.PI) / 180;

    // Gradient follows the arc in userSpaceOnUse from start angle to end angle
    const gradX1 = cx + midRadius * Math.cos(radStart);
    const gradY1 = cy + midRadius * Math.sin(radStart);
    const gradX2 = cx + midRadius * Math.cos(radEnd);
    const gradY2 = cy + midRadius * Math.sin(radEnd);

    // SVG arc path coordinates
    const x1Outer = cx + outerRadius * Math.cos(radStart);
    const y1Outer = cy + outerRadius * Math.sin(radStart);
    const x2Outer = cx + outerRadius * Math.cos(radEnd);
    const y2Outer = cy + outerRadius * Math.sin(radEnd);

    const x1Inner = cx + innerRadius * Math.cos(radStart);
    const y1Inner = cy + innerRadius * Math.sin(radStart);
    const x2Inner = cx + innerRadius * Math.cos(radEnd);
    const y2Inner = cy + innerRadius * Math.sin(radEnd);

    const largeArc = angleSpan - gap > 180 ? 1 : 0;

    const pathData = [
      `M ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
      `L ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}`,
      `L ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
      'Z',
    ].join(' ');

    const gradId = `donut-arc-grad-${c.id || index}`;
    const sliceColor = getDonutContributorColor(c.color, index);
    const stopColor2 = sliceColor === DONUT_THEME_BLUE ? DONUT_THEME_BLUE_GRADIENT_TO : sliceColor;

    return {
      contributor: c,
      index,
      gradId,
      gradX1,
      gradY1,
      gradX2,
      gradY2,
      pathData,
      color: sliceColor,
      stopColor2,
      isSelected,
    };
  });

  const activeContributor = activeIndex !== null ? contributors[activeIndex] : null;

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-[340px] shadow-sm relative overflow-hidden transition-all duration-200">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Contribution Distribution</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {contributors.length} Contributors
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Share of total commits & modifications</p>
          </div>

          <div className="relative group/tooltip">
            <button
              type="button"
              aria-label="Contribution distribution info"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-900 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-7 z-50 hidden group-hover/tooltip:block w-64 p-2.5 text-xs bg-black/95 backdrop-blur-md border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
              <p className="font-semibold text-white mb-1">Workload & Code Ownership Spread</p>
              <p className="text-zinc-400 text-[11px] mb-2">
                Measures code distribution across contributors to assess team balance and bus factor risk.
              </p>
              <div className="space-y-1 pt-1.5 border-t border-zinc-800 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bus Factor:</span>
                  <span className="text-white font-medium">
                    {contributors.length >= 2 ? 'Healthy (≥2 active)' : 'Concentrated'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Commits:</span>
                  <span className="text-white font-medium">{totalCommits.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donut and Legend Layout */}
      <div className="grid grid-cols-12 items-center flex-1 my-1 gap-3">
        {/* Left: Donut Chart with arc-following userSpaceOnUse gradients */}
        <div className="col-span-6 h-full flex items-center justify-center relative">
          <svg
            viewBox="0 0 240 240"
            className="w-[195px] h-[195px] select-none overflow-visible"
          >
            <defs>
              {sectors.map((s) => (
                <linearGradient
                  key={s.gradId}
                  id={s.gradId}
                  gradientUnits="userSpaceOnUse"
                  x1={s.gradX1}
                  y1={s.gradY1}
                  x2={s.gradX2}
                  y2={s.gradY2}
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                  <stop offset="50%" stopColor={s.color} stopOpacity={0.88} />
                  <stop offset="100%" stopColor={s.stopColor2} stopOpacity={0.72} />
                </linearGradient>
              ))}
            </defs>

            {/* Donut Slices */}
            {sectors.map((s) => (
              <path
                key={s.gradId}
                d={s.pathData}
                fill={`url(#${s.gradId})`}
                stroke={s.isSelected ? '#ffffff' : '#000000'}
                strokeWidth={s.isSelected ? 2.5 : 2}
                opacity={activeIndex === null || activeIndex === s.index ? 1 : 0.35}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: s.isSelected ? `drop-shadow(0 0 10px ${s.color})` : 'none',
                }}
                onMouseEnter={() => setActiveIndex(s.index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => onSelectContributor && onSelectContributor(s.contributor)}
              />
            ))}

            {/* Center Donut Hub */}
            <circle
              cx={cx}
              cy={cy}
              r={baseInnerRadius - 5}
              fill="#09090b"
              stroke="#27272a"
              strokeWidth={1}
            />
            <circle
              cx={cx}
              cy={cy}
              r={baseInnerRadius - 8}
              fill="none"
              stroke="#27272a"
              strokeWidth={0.5}
              strokeDasharray="2 3"
              opacity={0.6}
            />

            {/* Center Hub Dynamic Content */}
            {activeContributor ? (
              <>
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize={9.5}
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none select-none uppercase tracking-wider"
                >
                  {activeContributor.name}
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={20}
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none select-none"
                >
                  {activeContributor.sharePct}%
                </text>
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill={getDonutContributorColor(activeContributor.color, activeIndex ?? 0)}
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {activeContributor.commits} COMMITS
                </text>
              </>
            ) : (
              <>
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize={9.5}
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none select-none uppercase tracking-wider"
                >
                  TOTAL
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={totalCommits > 9999 ? 15 : totalCommits > 999 ? 17 : 20}
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none select-none"
                >
                  {totalCommits > 99999 ? `${Math.round(totalCommits / 1000)}k` : totalCommits.toLocaleString()}
                </text>
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize={9.5}
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none select-none uppercase tracking-wider"
                >
                  COMMITS
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Right: Legend & Contributor Rows (scrollable on large contributor counts) */}
        <div className="col-span-6 flex flex-col justify-start max-h-[220px] overflow-y-auto pr-1 space-y-1.5 border-l border-zinc-800/80">
          {contributors.map((c, i) => {
            const itemColor = getDonutContributorColor(c.color, i);
            return (
              <button
                key={c.id || i}
                type="button"
                onClick={() => onSelectContributor && onSelectContributor(c)}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`w-full flex items-center gap-2 text-left transition-all p-1.5 rounded-lg cursor-pointer border ${
                  activeIndex === i
                    ? 'bg-zinc-900 border-zinc-700 shadow-md'
                    : 'bg-zinc-950/40 hover:bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                {/* Contributor Avatar with Color Pill Indicator */}
                <div className="relative shrink-0">
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-7 h-7 rounded-full object-cover border"
                    style={{
                      borderColor: activeIndex === i ? itemColor : 'rgba(255, 255, 255, 0.15)',
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black shrink-0"
                    style={{ backgroundColor: itemColor }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11.5px] font-semibold text-slate-100 truncate leading-tight">
                      {c.name}
                    </p>
                    <span className="text-[11px] font-bold font-mono text-white shrink-0">
                      {c.sharePct}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-0.5">
                    <span className="truncate text-zinc-500">
                      {c.role ? c.role.split('&')[0].trim() : `@${c.username}`}
                    </span>
                    <span className="shrink-0 text-zinc-300">{c.commits} commits</span>
                  </div>

                  {/* Contribution Proportion Mini Bar */}
                  <div className="w-full h-1 bg-zinc-800/80 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${c.sharePct}%`,
                        backgroundColor: itemColor,
                        boxShadow: activeIndex === i ? `0 0 6px ${itemColor}` : 'none',
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-zinc-500 shrink-0" />
          <span>
            Top: <strong className="text-white">{topContributor ? topContributor.name : 'Lead'}</strong> ({topContributor ? `${topContributor.sharePct}%` : '50%'})
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 hidden sm:block">
          Select developer to inspect
        </span>
      </div>
    </div>
  );
};
