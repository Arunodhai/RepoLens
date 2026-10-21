import React, { useState, useEffect } from 'react';
import { ContributorShare } from '../types/repo';
import { DevAvatar } from './DevAvatar';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Tooltip } from 'recharts';
import { Users2, ArrowLeftRight, Check, Trophy, ArrowLeft } from 'lucide-react';

interface DeveloperComparisonViewProps {
  contributors: ContributorShare[];
  initialA?: ContributorShare | null;
  initialB?: ContributorShare | null;
  onBackToLeaderboard?: () => void;
  onSelectContributor?: (contributor: ContributorShare) => void;
}

export const DeveloperComparisonView: React.FC<DeveloperComparisonViewProps> = ({
  contributors,
  initialA,
  initialB,
  onBackToLeaderboard,
  onSelectContributor,
}) => {
  const [selectedAId, setSelectedAId] = useState<string>(
    initialA?.id || contributors[0]?.id || ''
  );
  const [selectedBId, setSelectedBId] = useState<string>(
    initialB?.id || contributors[1]?.id || ''
  );

  useEffect(() => {
    if (initialA?.id) setSelectedAId(initialA.id);
  }, [initialA?.id]);

  useEffect(() => {
    if (initialB?.id) setSelectedBId(initialB.id);
  }, [initialB?.id]);

  const devA = contributors.find((c) => c.id === selectedAId) || contributors[0];
  const devB = contributors.find((c) => c.id === selectedBId) || contributors[1];

  if (!devA || !devB) return null;

  // Comparison Radar Data normalized to 100
  const maxCommits = Math.max(devA.commits, devB.commits, 1);
  const maxPRs = Math.max(devA.prs, devB.prs, 1);
  const maxReviews = Math.max(devA.reviews, devB.reviews, 1);
  const maxStreak = Math.max(devA.longestStreak, devB.longestStreak, 1);
  const maxAdditions = Math.max(devA.additions, devB.additions, 1);

  const radarData = [
    {
      subject: 'Commits',
      [devA.name]: Math.round((devA.commits / maxCommits) * 100),
      [devB.name]: Math.round((devB.commits / maxCommits) * 100),
    },
    {
      subject: 'PR Volume',
      [devA.name]: Math.round((devA.prs / maxPRs) * 100),
      [devB.name]: Math.round((devB.prs / maxPRs) * 100),
    },
    {
      subject: 'Reviews',
      [devA.name]: Math.round((devA.reviews / maxReviews) * 100),
      [devB.name]: Math.round((devB.reviews / maxReviews) * 100),
    },
    {
      subject: 'Max Streak',
      [devA.name]: Math.round((devA.longestStreak / maxStreak) * 100),
      [devB.name]: Math.round((devB.longestStreak / maxStreak) * 100),
    },
    {
      subject: 'Code Impact',
      [devA.name]: Math.round((devA.additions / maxAdditions) * 100),
      [devB.name]: Math.round((devB.additions / maxAdditions) * 100),
    },
  ];

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-4 h-4 text-amber-400" />
            Developer Head-to-Head Comparison
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare contribution rhythm, review participation, and code scope side-by-side
          </p>
        </div>

        {/* Actions & Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToLeaderboard && (
            <button
              type="button"
              onClick={onBackToLeaderboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Leaderboard</span>
            </button>
          )}

          {/* Dev A Selector */}
          <select
            value={selectedAId}
            onChange={(e) => setSelectedAId(e.target.value)}
            className="bg-black border border-zinc-800 text-zinc-200 text-xs font-mono py-1.5 px-3 rounded-lg focus:outline-none"
          >
            {contributors.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === selectedBId}>
                {c.name}
              </option>
            ))}
          </select>

          <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

          {/* Dev B Selector */}
          <select
            value={selectedBId}
            onChange={(e) => setSelectedBId(e.target.value)}
            className="bg-black border border-zinc-800 text-zinc-200 text-xs font-mono py-1.5 px-3 rounded-lg focus:outline-none"
          >
            {contributors.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === selectedAId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Profiles, Radar, and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Side-by-Side Profiles & Metrics */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Dev A Card */}
            <div
              className={`bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl ${
                onSelectContributor ? 'cursor-pointer hover:border-orange-500/50 transition-colors' : ''
              }`}
              onClick={() => onSelectContributor && onSelectContributor(devA)}
            >
              <div className="flex items-center gap-2.5">
                <DevAvatar
                  src={devA.avatarUrl}
                  name={devA.name}
                  username={devA.username}
                  size="xl"
                  borderColor="border-orange-500"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{devA.name}</p>
                  <p className="text-[11px] text-orange-400 font-mono truncate">@{devA.username}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-zinc-300 font-mono">{devA.role}</p>
                {onSelectContributor && (
                  <span className="text-[10px] text-zinc-500 hover:text-amber-400 font-mono">Profile &rarr;</span>
                )}
              </div>
            </div>

            {/* Dev B Card */}
            <div
              className={`bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl ${
                onSelectContributor ? 'cursor-pointer hover:border-cyan-500/50 transition-colors' : ''
              }`}
              onClick={() => onSelectContributor && onSelectContributor(devB)}
            >
              <div className="flex items-center gap-2.5">
                <DevAvatar
                  src={devB.avatarUrl}
                  name={devB.name}
                  username={devB.username}
                  size="xl"
                  borderColor="border-cyan-500"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{devB.name}</p>
                  <p className="text-[11px] text-cyan-400 font-mono truncate">@{devB.username}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-zinc-300 font-mono">{devB.role}</p>
                {onSelectContributor && (
                  <span className="text-[10px] text-zinc-500 hover:text-cyan-400 font-mono">Profile &rarr;</span>
                )}
              </div>
            </div>
          </div>

          {/* Metric Rows */}
          <div className="space-y-2 font-mono text-xs">
            {[
              { label: 'Commits', valA: devA.commits.toLocaleString(), valB: devB.commits.toLocaleString(), rawA: devA.commits, rawB: devB.commits },
              { label: 'Pull Requests', valA: devA.prs, valB: devB.prs, rawA: devA.prs, rawB: devB.prs },
              { label: 'Peer Reviews', valA: devA.reviews, valB: devB.reviews, rawA: devA.reviews, rawB: devB.reviews },
              { label: 'Contribution Share', valA: `${devA.sharePct}%`, valB: `${devB.sharePct}%`, rawA: devA.sharePct, rawB: devB.sharePct },
              { label: 'Active Days', valA: `${devA.activeDays}d`, valB: `${devB.activeDays}d`, rawA: devA.activeDays, rawB: devB.activeDays },
              { label: 'Longest Streak', valA: `${devA.longestStreak}d`, valB: `${devB.longestStreak}d`, rawA: devA.longestStreak, rawB: devB.longestStreak },
              { label: 'Lines Added', valA: `+${devA.additions.toLocaleString()}`, valB: `+${devB.additions.toLocaleString()}`, rawA: devA.additions, rawB: devB.additions },
            ].map((row, idx) => {
              const aWins = row.rawA > row.rawB;
              const bWins = row.rawB > row.rawA;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-lg"
                >
                  <span className={`w-28 text-left tabular-nums ${aWins ? 'text-orange-400 font-bold' : 'text-zinc-300'}`}>
                    {row.valA}
                  </span>
                  <span className="text-zinc-400 font-sans text-xs uppercase tracking-wider text-center flex-1">
                    {row.label}
                  </span>
                  <span className={`w-28 text-right tabular-nums ${bWins ? 'text-cyan-400 font-bold' : 'text-zinc-300'}`}>
                    {row.valB}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Comparative Radar */}
        <div className="lg:col-span-5 bg-black border border-zinc-800 rounded-xl p-4 flex flex-col justify-between h-[360px]">
          <p className="text-xs font-bold text-white uppercase tracking-wider font-mono text-center">
            Relative Dimension Footprint
          </p>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#27272a" strokeDasharray="2 2" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-black border border-zinc-700 p-2.5 rounded-lg shadow-2xl font-mono text-xs">
                        <p className="text-white font-semibold mb-1">{payload[0]?.payload?.subject}</p>
                        <p className="text-orange-400">{devA.name}: {payload[0]?.value}%</p>
                        <p className="text-cyan-400">{devB.name}: {payload[1]?.value}%</p>
                      </div>
                    );
                  }}
                />
                <Radar
                  name={devA.name}
                  dataKey={devA.name}
                  stroke={devA.color || 'rgba(254, 83, 0, 1)'}
                  strokeWidth={2}
                  fill={devA.color || 'rgba(254, 83, 0, 1)'}
                  fillOpacity={0.25}
                />
                <Radar
                  name={devB.name}
                  dataKey={devB.name}
                  stroke={devB.color || 'rgba(109, 255, 3, 1)'}
                  strokeWidth={2}
                  fill={devB.color || 'rgba(109, 255, 3, 1)'}
                  fillOpacity={0.25}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)', paddingTop: '10px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-slate-500 font-mono text-center">
            Values normalized to maximum recorded metric
          </p>
        </div>
      </div>
    </div>
  );
};
