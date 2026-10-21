import React, { useState, useMemo } from 'react';
import { VelocityPoint, CommitItem } from '../types/repo';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

interface CommitPRTrendCardProps {
  data: VelocityPoint[];
  commits?: CommitItem[];
}

export const CommitPRTrendCard: React.FC<CommitPRTrendCardProps> = ({ data, commits }) => {
  const [metricMode, setMetricMode] = useState<'both' | 'commits' | 'prs'>('both');

  // Compute trend data dynamically from commits if available
  const trendData = useMemo(() => {
    if (!commits || commits.length === 0) return data;

    const map: Record<string, { commits: number; prsMerged: number; prsOpened: number; dateTimestamp: number }> = {};
    const prMap = new Map<number, string>();

    commits.forEach((c) => {
      const d = c.date.split('T')[0];
      if (!map[d]) {
        map[d] = {
          commits: 0,
          prsMerged: 0,
          prsOpened: 0,
          dateTimestamp: new Date(d + 'T12:00:00Z').getTime(),
        };
      }
      map[d].commits += 1;
      if (c.prNumber && !prMap.has(c.prNumber)) {
        prMap.set(c.prNumber, d);
        map[d].prsMerged += 1;
        map[d].prsOpened += 1;
      }
    });

    const sortedDays = Object.keys(map).sort();
    const points = sortedDays.map((d) => {
      const dt = new Date(d + 'T12:00:00Z');
      const monthStr = dt.toLocaleString('en-US', { month: 'short' });
      const dayNum = String(dt.getUTCDate()).padStart(2, '0');
      return {
        dateLabel: `${monthStr} ${dayNum}`,
        commits: map[d].commits,
        prsMerged: map[d].prsMerged,
        prsOpened: map[d].prsOpened,
      };
    });

    // In huge repos with many commit days, group or sample to prevent axis label collision
    if (points.length > 20) {
      const stride = Math.ceil(points.length / 16);
      const condensed: typeof points = [];
      for (let i = 0; i < points.length; i += stride) {
        const chunk = points.slice(i, i + stride);
        const totalC = chunk.reduce((s, p) => s + p.commits, 0);
        const totalP = chunk.reduce((s, p) => s + p.prsMerged, 0);
        condensed.push({
          dateLabel: chunk[0].dateLabel,
          commits: totalC,
          prsMerged: totalP,
          prsOpened: totalP,
        });
      }
      return condensed;
    }

    return points;
  }, [commits, data]);

  const peakPoint = useMemo(() => {
    return trendData.reduce(
      (max, curr) => (curr.commits > (max?.commits || 0) ? curr : max),
      trendData[0]
    );
  }, [trendData]);

  const totalCommitsInTrend = useMemo(() => {
    return trendData.reduce((sum, p) => sum + p.commits, 0);
  }, [trendData]);

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[340px] shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Commit & PR Velocity Trend</h2>
            <span className="text-[11px] font-mono text-zinc-400">
              {totalCommitsInTrend} commits across {trendData.length} active dates
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Chronological delivery momentum and merge cadence</p>
        </div>

        {/* Metric Selector & Tooltip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setMetricMode('both')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metricMode === 'both' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('commits')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metricMode === 'commits' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Commits
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('prs')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metricMode === 'prs' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              PRs
            </button>
          </div>

          <div className="relative group/tooltip">
            <button
              type="button"
              aria-label="Trend velocity info"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-6 z-50 hidden group-hover/tooltip:block w-56 p-2 text-xs bg-black border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
              <p className="font-semibold text-white mb-0.5">Momentum Trajectory</p>
              <p className="text-zinc-400">
                Continuous spline tracking of weekly merge cadence. Orange area traces commit output, and green line tracks merged pull requests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[225px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 28, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(254, 83, 0, 1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgba(254, 83, 0, 1)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="trendPrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(109, 255, 3, 1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgba(109, 255, 3, 1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateLabel"
              stroke="#52525b"
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              minTickGap={20}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as VelocityPoint;
                return (
                  <div className="bg-black border border-zinc-700 text-slate-200 p-2.5 rounded-lg shadow-xl font-mono text-xs">
                    <p className="text-white font-semibold mb-1 text-[13px]">{d.dateLabel}</p>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(254, 83, 0, 1)' }} />
                      <span>Commits: <strong className="text-white">{d.commits.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 mt-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(109, 255, 3, 1)' }} />
                      <span>PRs Merged: <strong style={{ color: 'rgba(109, 255, 3, 1)' }}>{d.prsMerged.toLocaleString()}</strong></span>
                    </div>
                  </div>
                );
              }}
            />
            {(metricMode === 'both' || metricMode === 'commits') && (
              <Area
                type="linear"
                dataKey="commits"
                name="Commits"
                stroke="rgba(254, 83, 0, 1)"
                strokeWidth={2}
                fill="url(#trendAreaGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'rgba(254, 83, 0, 1)', stroke: '#ffffff', strokeWidth: 1.5 }}
              />
            )}
            {(metricMode === 'both' || metricMode === 'prs') && (
              <Line
                type="linear"
                dataKey="prsMerged"
                name="PRs Merged"
                stroke="rgba(109, 255, 3, 1)"
                strokeWidth={2}
                dot={{ r: 2, fill: 'rgba(109, 255, 3, 1)' }}
                activeDot={{ r: 4, fill: 'rgba(109, 255, 3, 1)', stroke: '#ffffff', strokeWidth: 1.5 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer notation */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
        <span>
          Peak velocity: <strong className="text-slate-200">{peakPoint?.dateLabel}</strong> ({peakPoint?.commits.toLocaleString()} commits)
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[rgba(254,83,0,1)]" />
            <span>Commits</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[rgba(109,255,3,1)]" />
            <span>PRs</span>
          </span>
        </div>
      </div>
    </div>
  );
};
