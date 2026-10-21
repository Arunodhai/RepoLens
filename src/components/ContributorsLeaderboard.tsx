import React, { useState, useEffect } from 'react';
import { ContributorShare } from '../types/repo';
import { ALL_ACHIEVEMENT_BADGES } from '../data/mockRepos';
import { DevAvatar } from './DevAvatar';
import { DeveloperComparisonView } from './DeveloperComparisonView';
import { Trophy, ArrowRight, ArrowLeftRight, Users, Users2 } from 'lucide-react';

interface ContributorsLeaderboardProps {
  contributors: ContributorShare[];
  onSelectContributor: (contributor: ContributorShare) => void;
  onCompareWith?: (contributor: ContributorShare) => void;
  subTab?: 'leaderboard' | 'comparison';
  onSubTabChange?: (tab: 'leaderboard' | 'comparison') => void;
  compareDevA?: ContributorShare | null;
  compareDevB?: ContributorShare | null;
  onSelectCompareDevs?: (a: ContributorShare, b: ContributorShare) => void;
}

export const ContributorsLeaderboard: React.FC<ContributorsLeaderboardProps> = ({
  contributors,
  onSelectContributor,
  onCompareWith,
  subTab,
  onSubTabChange,
  compareDevA,
  compareDevB,
  onSelectCompareDevs,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'leaderboard' | 'comparison'>('leaderboard');
  const currentSubTab = subTab !== undefined ? subTab : internalSubTab;

  const [localDevA, setLocalDevA] = useState<ContributorShare | null>(compareDevA || contributors[0] || null);
  const [localDevB, setLocalDevB] = useState<ContributorShare | null>(
    compareDevB || contributors[1] || contributors[0] || null
  );

  useEffect(() => {
    if (compareDevA) setLocalDevA(compareDevA);
  }, [compareDevA]);

  useEffect(() => {
    if (compareDevB) setLocalDevB(compareDevB);
  }, [compareDevB]);

  const handleTabChange = (newTab: 'leaderboard' | 'comparison') => {
    if (onSubTabChange) {
      onSubTabChange(newTab);
    } else {
      setInternalSubTab(newTab);
    }
  };

  const handleRowCompare = (c: ContributorShare) => {
    const targetA = c;
    const targetB = contributors.find((item) => item.id !== c.id) || contributors[0];
    setLocalDevA(targetA);
    setLocalDevB(targetB);
    if (onSelectCompareDevs) {
      onSelectCompareDevs(targetA, targetB);
    }
    handleTabChange('comparison');
    if (onCompareWith) {
      onCompareWith(c);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Authors Page Header & Sub-Navigation */}
      <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-zinc-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Top Authors & Team Intelligence
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive contribution ranking, velocity, and side-by-side head-to-head comparison
            </p>
          </div>

          {/* Sub-view switcher: Leaderboard vs Comparison */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentSubTab === 'leaderboard'
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard ({contributors.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentSubTab === 'comparison'
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-400" />
              <span>Developer Comparison</span>
            </button>
          </div>
        </div>

        {/* Dynamic View rendering: Leaderboard Table OR Comparison View */}
        {currentSubTab === 'leaderboard' ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3 font-sans">Author</th>
                  <th className="py-2.5 px-3 text-right">Commits</th>
                  <th className="py-2.5 px-3 text-right">PRs</th>
                  <th className="py-2.5 px-3 text-right">Reviews</th>
                  <th className="py-2.5 px-3 text-right">Cadence</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 font-sans">Badges</th>
                  <th className="py-2.5 px-3 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {contributors.map((c, index) => {
                  const rankColor =
                    index === 0
                      ? 'text-amber-400'
                      : index === 1
                      ? 'text-zinc-300'
                      : index === 2
                      ? 'text-amber-600'
                      : 'text-zinc-500';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-900/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectContributor(c)}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3">
                        <span className={`font-bold ${rankColor}`}>#{index + 1}</span>
                      </td>

                      {/* Contributor Profile */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <DevAvatar
                            src={c.avatarUrl}
                            name={c.name}
                            username={c.username}
                            size="lg"
                            className="border border-zinc-800"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              @{c.username} · {c.role}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Commits */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className="text-slate-200 font-semibold">{c.commits.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          +{c.additions.toLocaleString()}
                        </span>
                      </td>

                      {/* PRs */}
                      <td className="py-3 px-3 text-right tabular-nums text-slate-200">{c.prs}</td>

                      {/* Reviews */}
                      <td className="py-3 px-3 text-right tabular-nums text-slate-200">{c.reviews}</td>

                      {/* Cadence & Streak */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className="text-white font-medium">{c.activeDays}d active</span>
                        <span className="text-[10px] text-emerald-400 block font-mono">{c.longestStreak}d streak</span>
                      </td>

                      {/* Share % */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-bold text-white">{c.sharePct}%</span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                        </div>
                      </td>

                      {/* Achievement Badges */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-1 flex-wrap">
                          {c.badges.slice(0, 3).map((badgeId) => {
                            const badge = ALL_ACHIEVEMENT_BADGES[badgeId];
                            if (!badge) return null;
                            return (
                              <span
                                key={badgeId}
                                title={`${badge.name}: ${badge.description}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-200 border border-zinc-800"
                              >
                                <span>{badge.icon}</span>
                                <span className="hidden xl:inline">{badge.name}</span>
                              </span>
                            );
                          })}
                          {c.badges.length > 3 && (
                            <span className="text-[10px] text-zinc-400 font-mono">+{c.badges.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRowCompare(c)}
                            title={`Compare ${c.name} head-to-head`}
                            className="px-2.5 py-1 text-[11px] font-medium text-orange-300 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Compare</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectContributor(c)}
                            className="px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Profile</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <DeveloperComparisonView
              contributors={contributors}
              initialA={localDevA}
              initialB={localDevB}
              onBackToLeaderboard={() => handleTabChange('leaderboard')}
              onSelectContributor={onSelectContributor}
            />
          </div>
        )}
      </div>
    </div>
  );
};
