import React, { useState } from 'react';
import { KPIMetricItem } from '../types/repo';
import {
  GitCommit,
  GitPullRequest,
  Zap,
  Users,
  Flame,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  FileCode2,
} from 'lucide-react';

interface KPICardsRowProps {
  kpis: KPIMetricItem[];
}

interface CardVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  strokeColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentBarGradient: string;
  iconBg: string;
  iconColor: string;
  points: number[];
}

const getCardVisualConfig = (kpi: KPIMetricItem, idx: number): CardVisualConfig => {
  const t = kpi.title.toLowerCase();

  if (t.includes('commit')) {
    return {
      icon: GitCommit,
      category: 'COMMITS',
      strokeColor: '#f97316',
      gradientFrom: '#f97316',
      gradientTo: '#ea580c',
      accentBarGradient: 'from-amber-500 via-orange-500 to-transparent',
      iconBg: 'bg-orange-500/15 border-orange-500/35',
      iconColor: 'text-orange-400',
      points: [18, 22, 19, 35, 30, 48, 59],
    };
  }

  if (t.includes('pull request')) {
    return {
      icon: GitPullRequest,
      category: 'PRS',
      strokeColor: '#10b981',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
      accentBarGradient: 'from-emerald-400 via-teal-500 to-transparent',
      iconBg: 'bg-emerald-500/15 border-emerald-500/35',
      iconColor: 'text-emerald-400',
      points: [2, 3, 2, 5, 4, 7, 6],
    };
  }

  if (t.includes('review') || t.includes('turnaround')) {
    return {
      icon: Zap,
      category: 'TURNAROUND',
      strokeColor: '#06b6d4',
      gradientFrom: '#06b6d4',
      gradientTo: '#0284c7',
      accentBarGradient: 'from-cyan-400 via-sky-500 to-transparent',
      iconBg: 'bg-cyan-500/15 border-cyan-500/35',
      iconColor: 'text-cyan-400',
      // Latency dropping over time (faster review is better)
      points: [42, 35, 28, 20, 16, 11, 8],
    };
  }

  if (t.includes('contributor')) {
    return {
      icon: Users,
      category: 'TEAM',
      strokeColor: '#a855f7',
      gradientFrom: '#a855f7',
      gradientTo: '#7c3aed',
      accentBarGradient: 'from-purple-400 via-violet-500 to-transparent',
      iconBg: 'bg-purple-500/15 border-purple-500/35',
      iconColor: 'text-purple-400',
      points: [1, 1, 2, 2, 2, 2, 2],
    };
  }

  if (t.includes('line') || t.includes('loc') || t.includes('code') || t.includes('volume')) {
    return {
      icon: Code2,
      category: 'CODE VOLUME',
      strokeColor: '#38bdf8',
      gradientFrom: '#38bdf8',
      gradientTo: '#0284c7',
      accentBarGradient: 'from-sky-400 via-blue-500 to-transparent',
      iconBg: 'bg-sky-500/15 border-sky-500/35',
      iconColor: 'text-sky-400',
      points: [14, 22, 28, 36, 42, 51, 64],
    };
  }

  if (t.includes('hotspot')) {
    return {
      icon: Flame,
      category: 'HOTSPOT',
      strokeColor: '#f43f5e',
      gradientFrom: '#f43f5e',
      gradientTo: '#e11d48',
      accentBarGradient: 'from-rose-500 via-pink-500 to-transparent',
      iconBg: 'bg-rose-500/15 border-rose-500/35',
      iconColor: 'text-rose-400',
      points: [12, 18, 26, 32, 44, 40, 52],
    };
  }

  if (t.includes('merge')) {
    return {
      icon: CheckCircle2,
      category: 'MERGE RATE',
      strokeColor: '#84cc16',
      gradientFrom: '#84cc16',
      gradientTo: '#65a30d',
      accentBarGradient: 'from-lime-400 via-emerald-500 to-transparent',
      iconBg: 'bg-lime-500/15 border-lime-500/35',
      iconColor: 'text-lime-400',
      points: [90, 92, 95, 96, 98, 99, 100],
    };
  }

  // Fallback
  return {
    icon: ShieldCheck,
    category: `METRIC ${idx + 1}`,
    strokeColor: '#38bdf8',
    gradientFrom: '#38bdf8',
    gradientTo: '#0284c7',
    accentBarGradient: 'from-sky-400 via-blue-500 to-transparent',
    iconBg: 'bg-sky-500/15 border-sky-500/35',
    iconColor: 'text-sky-400',
    points: [10, 20, 15, 25, 22, 30, 28],
  };
};

const Sparkline: React.FC<{
  points: number[];
  strokeColor: string;
  fillId: string;
  gradientFrom: string;
  gradientTo: string;
}> = ({ points, strokeColor, fillId, gradientFrom, gradientTo }) => {
  const width = 100;
  const height = 22;
  const paddingY = 3;
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y };
  });

  let pathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX.toFixed(1)} ${p0.y.toFixed(1)}, ${cpX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;
  const lastCoord = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-5 overflow-visible"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.35} />
          <stop offset="100%" stopColor={gradientTo} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-laser-flow"
        strokeDasharray="6 3"
      />
      {/* Live radar tracer beacon on last data coordinate */}
      <circle
        cx={lastCoord.x}
        cy={lastCoord.y}
        r="5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        className="animate-ping"
        opacity="0.6"
      />
      <circle cx={lastCoord.x} cy={lastCoord.y} r="2.5" fill={strokeColor} />
    </svg>
  );
};

export const KPICardsRow: React.FC<KPICardsRowProps> = ({ kpis }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (kpi: KPIMetricItem, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${kpi.title}: ${kpi.value} (${kpi.sublabel})`;
    navigator.clipboard.writeText(textToCopy).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {kpis.map((kpi, idx) => {
        const isDown = kpi.deltaText.includes('↓');
        const isUp = kpi.deltaText.includes('↑') || kpi.isPositive;
        const config = getCardVisualConfig(kpi, idx);
        const IconComponent = config.icon;
        const isCopied = copiedIdx === idx;

        // Smart tooltip position to avoid clipping at screen edges
        const tooltipPositionClass =
          idx === 0
            ? 'left-0 origin-top-left'
            : idx === kpis.length - 1
            ? 'right-0 origin-top-right'
            : 'left-1/2 -translate-x-1/2 origin-top';

        return (
          <div
            key={idx}
            className="group relative bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700/90 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-black/60 overflow-hidden"
          >
            {/* Sci-Fi HUD Corner Brackets */}
            <span className="hud-corner-tl opacity-40 group-hover:opacity-90 transition-opacity" />
            <span className="hud-corner-tr opacity-40 group-hover:opacity-90 transition-opacity" />
            <span className="hud-corner-bl opacity-40 group-hover:opacity-90 transition-opacity" />
            <span className="hud-corner-br opacity-40 group-hover:opacity-90 transition-opacity" />

            {/* Top row: Category tag + Icon & Actions (Copy + Info) */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${config.iconBg} ${config.iconColor} shadow-sm group-hover:scale-105`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-zinc-400 font-semibold uppercase truncate group-hover:text-zinc-300 transition-colors">
                  {config.category}
                </span>
              </div>

              {/* Action buttons (Copy + Info Tooltip) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopy(kpi, idx, e)}
                  title="Copy metric summary"
                  aria-label={`Copy ${kpi.title} value`}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                <div className="relative group/tooltip">
                  <button
                    type="button"
                    aria-label={`Info for ${kpi.title}`}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  >
                    <Info className="w-3 h-3" />
                  </button>

                  {/* Accessible high-contrast dark tooltip */}
                  <div
                    className={`absolute top-6 z-50 hidden group-hover/tooltip:block w-56 p-2.5 text-xs bg-zinc-950/95 backdrop-blur-md border border-zinc-700/90 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed transition-all ${tooltipPositionClass}`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${config.iconColor}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-white truncate">{kpi.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">{kpi.value}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-normal">{kpi.tooltip}</p>
                    <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex justify-between">
                      <span>{kpi.sublabel}</span>
                      <span className="text-zinc-300">{kpi.deltaText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Metric Hero Value & Delta Pill */}
            <div className="mt-1">
              <div className="flex items-baseline justify-between gap-1.5">
                <span
                  className={`font-extrabold font-mono tracking-tight text-white tabular-nums drop-shadow-sm truncate ${
                    kpi.value.length > 7 ? 'text-lg lg:text-xl' : 'text-2xl lg:text-[24px]'
                  }`}
                  title={kpi.value}
                >
                  {kpi.value}
                </span>

                <span
                  className={`flex items-center gap-0.5 shrink-0 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded transition-transform group-hover:scale-105 ${
                    isDown
                      ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                      : isUp
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  }`}
                  title={`Trend: ${kpi.deltaText}`}
                >
                  {isDown ? (
                    <TrendingDown className="w-2.5 h-2.5 inline" />
                  ) : (
                    <TrendingUp className="w-2.5 h-2.5 inline" />
                  )}
                  {kpi.deltaText}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 tracking-tight mt-0.5 truncate" title={kpi.title}>
                {kpi.title}
              </p>
            </div>

            {/* Micro Sparkline Trend */}
            <div className="my-2 px-0.5">
              <Sparkline
                points={config.points}
                strokeColor={config.strokeColor}
                fillId={`sparkline-${idx}`}
                gradientFrom={config.gradientFrom}
                gradientTo={config.gradientTo}
              />
            </div>

            {/* Bottom Row: Full width explanatory sublabel - never cropped */}
            <div className="pt-2 border-t border-zinc-800/80 min-h-[26px] flex items-center">
              <span
                className="text-slate-400 font-mono text-[10.5px] leading-snug break-words select-text"
                title={kpi.sublabel}
              >
                {kpi.sublabel}
              </span>
            </div>

            {/* Quick Copied indicator notification */}
            {isCopied && (
              <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-150">
                <span className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded shadow-lg">
                  Copied metric summary!
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
