import React from 'react';
import { RadarHealthMetric } from '../types/repo';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { Info, ShieldCheck } from 'lucide-react';

interface RepositoryHealthRadarCardProps {
  metrics: RadarHealthMetric[];
}

export const RepositoryHealthRadarCard: React.FC<RepositoryHealthRadarCardProps> = ({ metrics }) => {
  const avgScore = metrics.length > 0
    ? Math.round(metrics.reduce((acc, curr) => acc + curr.score, 0) / metrics.length)
    : 89;

  const HEALTH_THEME_YELLOW = '#facc15'; // Vibrant Yellow (#facc15)

  return (
    <div className="relative bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[340px] shadow-sm overflow-hidden group">
      {/* Sci-Fi HUD Corner Reticles */}
      <span className="hud-corner-tl" />
      <span className="hud-corner-tr" />
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Repository Health Radar</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
              {avgScore}% Avg
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE SWEEP 360°
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">Multi-dimensional telemetry & maturity scan</p>
        </div>
        <div className="relative group/tooltip">
          <button
            type="button"
            aria-label="Health radar info"
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <div className="absolute right-0 top-6 z-50 hidden group-hover/tooltip:block w-56 p-2.5 text-xs bg-black/95 backdrop-blur-md border border-zinc-700 text-slate-200 rounded-lg shadow-2xl pointer-events-none leading-relaxed">
            <p className="font-semibold text-white mb-0.5">Health Indices</p>
            <p className="text-zinc-400 text-[11px]">Synthesized scorecard evaluating pull request velocity, bus factor resilience, code review responsiveness, and regression guardrails.</p>
          </div>
        </div>
      </div>

      {/* Spider Radar Chart with Cinematic Sweep Beam Overlay */}
      <div className="relative w-full flex-1 min-h-[220px] py-1 flex items-center justify-center">
        {/* Animated Sonar Radar Sweep Beam & Concentric Ping Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          {/* Fading Sonar Ping Wave */}
          <div className="absolute w-24 h-24 rounded-full border border-yellow-400/25 animate-ping opacity-35" style={{ animationDuration: '3.2s' }} />
          
          {/* Secondary Slow Pulse */}
          <div className="absolute w-44 h-44 rounded-full border border-yellow-500/15 animate-ping opacity-20" style={{ animationDuration: '4.8s' }} />

          {/* Sweeping Conic Radar Beam (Movie Radar Line) */}
          <div
            className="w-[184px] h-[184px] rounded-full animate-radar-sweep pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, rgba(250, 204, 21, 0.32) 0deg, rgba(250, 204, 21, 0.08) 42deg, transparent 75deg)',
              borderRight: '1.5px solid rgba(250, 204, 21, 0.75)',
            }}
          />

          {/* Reticle Axis crosshairs */}
          <div className="absolute w-[184px] h-[1px] bg-yellow-500/10 pointer-events-none" />
          <div className="absolute h-[184px] w-[1px] bg-yellow-500/10 pointer-events-none" />
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={metrics}>
            <defs>
              <linearGradient id="healthRadarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#27272a" strokeDasharray="2 2" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={({ payload, x, y, textAnchor }) => {
                const metric = metrics.find((m) => m.dimension === payload.value);
                const score = metric ? `${metric.score}%` : '';
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    fill="#a1a1aa"
                    fontSize={9.5}
                    fontFamily="var(--font-mono)"
                  >
                    <tspan x={x} dy="-2">{payload.value}</tspan>
                    <tspan x={x} dy="11" fill={HEALTH_THEME_YELLOW} fontWeight="bold">{score}</tspan>
                  </text>
                );
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as RadarHealthMetric;
                return (
                  <div className="bg-black/95 backdrop-blur-md border border-zinc-700 text-slate-200 p-2.5 rounded-lg shadow-xl font-mono text-xs">
                    <p className="text-white font-semibold">{d.dimension}</p>
                    <p className="font-bold mt-0.5 text-sm text-yellow-400">{d.score} / 100</p>
                    <p className="text-zinc-400 text-[10px]">Status: {d.status}</p>
                  </div>
                );
              }}
            />
            {/* Health Radar Polygon with movie glowing pulse dots */}
            <Radar
              name="Health"
              dataKey="score"
              stroke="#facc15"
              strokeWidth={2}
              fill="url(#healthRadarGradient)"
              dot={(props: any) => {
                const { cx, cy, key } = props;
                return (
                  <g key={key}>
                    <circle cx={cx} cy={cy} r={6} fill="none" stroke="#facc15" strokeWidth={1} opacity={0.4} className="animate-ping" />
                    <circle cx={cx} cy={cy} r={3.5} fill="#facc15" stroke="#000000" strokeWidth={1.5} />
                  </g>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono relative z-10">
        <span>Aggregate Index: <strong className="text-yellow-400">{avgScore}%</strong></span>
        <span className="text-yellow-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <ShieldCheck className="w-3 h-3 text-yellow-400 inline" />
          <span>All Metrics Nominal</span>
        </span>
      </div>
    </div>
  );
};
