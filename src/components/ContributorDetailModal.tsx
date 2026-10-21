import React from 'react';
import { ContributorShare, DeveloperFeatureItem } from '../types/repo';
import { ALL_ACHIEVEMENT_BADGES } from '../data/mockRepos';
import { DevAvatar } from './DevAvatar';
import {
  X,
  GitCommit,
  GitPullRequest,
  Eye,
  Plus,
  Minus,
  Calendar,
  Flame,
  Award,
  ExternalLink,
  Code2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ContributorDetailModalProps {
  contributor: ContributorShare | null;
  onClose: () => void;
  onCompareWith?: (contributor: ContributorShare) => void;
  features?: DeveloperFeatureItem[];
  onViewAllFeatures?: () => void;
}

export const ContributorDetailModal: React.FC<ContributorDetailModalProps> = ({
  contributor,
  onClose,
  onCompareWith,
  features = [],
  onViewAllFeatures,
}) => {
  if (!contributor) return null;

  const devFeatures = features.filter((f) =>
    f.developer.username.toLowerCase().includes(contributor.username.toLowerCase()) ||
    contributor.name.toLowerCase().includes(f.developer.name.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-black border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-zinc-800">
          <DevAvatar
            src={contributor.avatarUrl}
            name={contributor.name}
            username={contributor.username}
            size="xl"
            className="w-16 h-16 text-lg border-2 border-amber-500/40 shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {contributor.name}
              </h2>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {contributor.sharePct}% Overall Impact
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              @{contributor.username} · {contributor.role}
            </p>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              {contributor.bio}
            </p>
          </div>
        </div>

        {/* Metric Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Commits</span>
              <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {contributor.commits.toLocaleString()}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Main branch</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Pull Requests</span>
              <GitPullRequest className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {contributor.prs}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">100% merged</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Code Reviews</span>
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {contributor.reviews}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">~1.8h turnaround</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Active Streak</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {contributor.currentStreak}d
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Peak: {contributor.longestStreak}d</p>
          </div>
        </div>

        {/* Lines Changed & Cadence */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Code Modification Footprint
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Plus className="w-3.5 h-3.5" />
                {contributor.additions.toLocaleString()} lines added
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Minus className="w-3.5 h-3.5" />
                {contributor.deletions.toLocaleString()} lines deleted
              </span>
            </div>
          </div>
          <div className="sm:text-right font-mono text-xs">
            <span className="text-slate-400">Total Active Days:</span>{' '}
            <strong className="text-white">{contributor.activeDays} days</strong>
          </div>
        </div>

        {/* Top Modified Areas */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
            Top Modified Modules & Files
          </h3>
          <div className="space-y-1.5">
            {contributor.topFiles.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono"
              >
                <span className="text-slate-300 truncate pr-2">{f.path}</span>
                <span className="text-amber-400 font-bold shrink-0">{f.changes} revisions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipped Features by this Developer */}
        {devFeatures.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-orange-400" />
                Delivered Features & Architectures ({devFeatures.length})
              </h3>
              {onViewAllFeatures && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewAllFeatures();
                  }}
                  className="text-[11px] font-mono text-amber-400 hover:underline"
                >
                  View full audit →
                </button>
              )}
            </div>
            <div className="space-y-2">
              {devFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white tracking-tight flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {feat.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      {feat.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed mb-2">
                    {feat.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                    <span>
                      {feat.prNumber ? `PR #${feat.prNumber} · ` : ''}
                      {feat.commitsCount} commits authored
                    </span>
                    <span className="text-emerald-400">Merged to main</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievement Badges */}
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Earned Achievement Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contributor.badges.map((badgeId) => {
              const b = ALL_ACHIEVEMENT_BADGES[badgeId];
              if (!b) return null;
              return (
                <div
                  key={badgeId}
                  className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-2.5"
                >
                  <span className="text-xl p-1 bg-zinc-900 rounded-lg shrink-0">
                    {b.icon}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">{b.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <a
            href={`https://github.com/${contributor.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
          >
            GitHub Profile
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex items-center gap-2">
            {onCompareWith && (
              <button
                type="button"
                onClick={() => {
                  onCompareWith(contributor);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
              >
                Compare With Another Dev
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
