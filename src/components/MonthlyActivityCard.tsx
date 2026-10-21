import React, { useMemo } from 'react';
import { MonthlyActivityData, CommitItem } from '../types/repo';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';

interface MonthlyActivityCardProps {
  data: MonthlyActivityData[];
  commits?: CommitItem[];
}

export const MonthlyActivityCard: React.FC<MonthlyActivityCardProps> = ({ data, commits }) => {
  const chartData = useMemo(() => {
    if (!commits || commits.length === 0) return data;

    const monthlyCounts: Record<string, number> = {};
    const monthOrder: string[] = [];

    // Sort commits chronologically
    const sorted = [...commits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach((c) => {
      const dt = new Date(c.date);
      if (isNaN(dt.getTime())) return;
      const m = dt.toLocaleString('en-US', { month: 'short' });
      if (!monthlyCounts[m]) {
        monthlyCounts[m] = 0;
        monthOrder.push(m);
      }
      monthlyCounts[m] += 1;
    });

    if (monthOrder.length > 0) {
      // Take up to recent 8-10 months so bars remain wide and uncluttered
      const recentMonths = monthOrder.slice(-8);
      return recentMonths.map((m) => {
        const existing = data.find((d) => d.month === m);
        const commitsCount = monthlyCounts[m] || 0;
        return {
          month: m,
          commits: commitsCount,
          prs: existing?.prs ?? Math.max(1, Math.round(commitsCount * 0.15)),
          reviews: existing?.reviews ?? Math.max(1, Math.round(commitsCount * 0.18)),
        };
      });
    }

    return data;
  }, [commits, data]);

  const { totalCommits, totalReviews, busiestMonth } = useMemo<{
    totalCommits: number;
    totalReviews: number;
    busiestMonth: { month: string; total: number } | null;
  }>(() => {
    let totCommits = 0;
    let totReviews = 0;
    let busiest: { month: string; total: number } | null = null;

    chartData.forEach((d) => {
      totCommits += d.commits || 0;
      totReviews += d.reviews || 0;
      const combined = (d.commits || 0) + (d.reviews || 0);
      if (!busiest || combined > busiest.total) {
        busiest = { month: d.month, total: combined };
      }
    });

    return {
      totalCommits: totCommits,
      totalReviews: totReviews,
      busiestMonth: busiest,
    };
  }, [chartData]);

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-[340px] shadow-sm relative overflow-hidden transition-all duration-200 group">
      {/* Sci-Fi HUD Corner Reticles */}
      <span className="hud-corner-tl" />
      <span className="hud-corner-tr" />
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />

      {/* Header */}
      <div>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Monthly Repository Activity</h2>
              {busiestMonth && busiestMonth.total > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Peak: {busiestMonth.month}
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAM ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Aggregated across active cycles (Commits & Reviews)</p>
          </div>

          <div className="relative group/tooltip">
            <button
              type="button"
              aria-label="Monthly activity info"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-900"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-7 z-50 hidden group-hover/tooltip:block w-60 p-2.5 text-xs bg-black/95 backdrop-blur-md border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
              <p className="font-semibold text-white mb-1">Dual Cadence Engine</p>
              <p className="text-zinc-400 text-[11px] mb-2">
                Engineering delivery momentum tracked across rolling development cycles.
              </p>
              <div className="space-y-1 pt-1.5 border-t border-zinc-800 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bright White:</span>
                  <span className="text-white font-medium font-semibold">Commits to main</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vibrant Red:</span>
                  <span className="text-red-400 font-medium font-semibold">Reviews & PRs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart with translucent bright white, vibrant red gradient bars, and live laser scanner beam */}
      <div className="relative w-full flex-1 min-h-[190px] mt-2 mb-1 overflow-hidden">
        {/* Animated Horizontal Laser Scanner Sweep (Movie Telemetry Beam) */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div
            className="w-20 h-full animate-scanner-horiz opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.35) 50%, rgba(255, 255, 255, 0.75) 95%, transparent 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.7)',
              filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))',
            }}
          />
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barCategoryGap="16%" margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
            <defs>
              {/* Bright White translucent gradient */}
              <linearGradient id="barCommitsBrightWhiteGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.88} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.22} />
              </linearGradient>

              {/* Vibrant Red translucent gradient: 65% opacity at top to 16% at bottom */}
              <linearGradient id="barReviewsRedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.16} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="month"
              stroke="#52525b"
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              dy={4}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 4 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as MonthlyActivityData;
                const total = (d.commits || 0) + (d.reviews || 0);
                return (
                  <div className="bg-black/95 backdrop-blur-md border border-zinc-700 text-slate-200 p-2.5 rounded-lg shadow-xl font-mono text-xs min-w-[170px]">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
                      <span className="text-white font-semibold text-[13px]">{d.month}</span>
                      <span className="text-[10px] text-zinc-400">{total} total</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs border border-white bg-white/40" />
                          <span>Commits</span>
                        </div>
                        <strong className="text-white tabular-nums font-bold">{d.commits.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs border border-red-500/80 bg-red-500/35" />
                          <span>Reviews & PRs</span>
                        </div>
                        <strong className="text-red-400 tabular-nums">{d.reviews.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Commits bar - translucent Bright White with crisp glowing border */}
            <Bar
              dataKey="commits"
              name="Commits"
              fill="url(#barCommitsBrightWhiteGradient)"
              stroke="#ffffff"
              strokeWidth={1.5}
              radius={[3, 3, 0, 0]}
              barSize={18}
              maxBarSize={24}
              animationDuration={600}
            />
            {/* PRs & Reviews bar - translucent Vibrant Red with glowing border */}
            <Bar
              dataKey="reviews"
              name="Reviews & PRs"
              fill="url(#barReviewsRedGradient)"
              stroke="rgba(239, 68, 68, 0.95)"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
              barSize={18}
              maxBarSize={24}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer with Live Aggregated Cycle Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs border border-white"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.22) 100%)',
              }}
            />
            <span>Commits</span>
            <span className="text-white font-semibold ml-0.5">{totalCommits.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs border border-red-500/80"
              style={{
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.65) 0%, rgba(185, 28, 28, 0.16) 100%)',
              }}
            />
            <span>Reviews & PRs</span>
            <span className="text-red-400 font-semibold ml-0.5">{totalReviews.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 hidden sm:block">
          {chartData.length} cycles
        </div>
      </div>
    </div>
  );
};
