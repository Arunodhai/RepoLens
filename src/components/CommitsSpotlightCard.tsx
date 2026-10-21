import React, { useState, useMemo } from 'react';
import { CommitItem } from '../types/repo';
import { DevAvatar } from './DevAvatar';
import {
  GitCommit,
  GitPullRequest,
  ArrowRight,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface CommitsSpotlightCardProps {
  commits: CommitItem[];
  onViewAllCommits: () => void;
  onInspectCommit?: (commit: CommitItem) => void;
  repoName?: string;
}

export const CommitsSpotlightCard: React.FC<CommitsSpotlightCardProps> = ({
  commits,
  onViewAllCommits,
  onInspectCommit,
  repoName = 'ashtapadhi/church-govern-cms',
}) => {
  const [activeDev, setActiveDev] = useState<string>('all');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Extract unique authors & counts
  const authors = useMemo(() => {
    const map = new Map<string, { username: string; name: string; avatarUrl: string; color: string; count: number }>();
    commits.forEach((c) => {
      const u = c.author.username;
      const existing = map.get(u);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(u, {
          username: c.author.username,
          name: c.author.name,
          avatarUrl: c.author.avatarUrl,
          color: c.author.color || 'rgba(254, 83, 0, 1)',
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [commits]);

  const sortedCommits = useMemo(() => {
    return [...commits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commits]);

  const filteredCommits = useMemo(() => {
    if (activeDev === 'all') return sortedCommits.slice(0, 5);
    return sortedCommits
      .filter((c) => c.author.username.toLowerCase() === activeDev.toLowerCase())
      .slice(0, 5);
  }, [sortedCommits, activeDev]);

  const handleCopySha = (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'feat':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'fix':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'refactor':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'chore':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'docs':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/30';
    }
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
      {/* Header with Title and "View All Commits" CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GitCommit className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Recent Commits & Code Delivery
            </h2>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Latest code revisions authored by the team for <strong className="text-zinc-300 font-medium">{repoName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onViewAllCommits}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
          >
            <span>View All {commits.length} Commits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Author Filter Segmented Buttons */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveDev('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeDev === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          All Activity ({commits.length})
        </button>

        {authors.map((auth) => (
          <button
            key={auth.username}
            type="button"
            onClick={() => setActiveDev(auth.username)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeDev.toLowerCase() === auth.username.toLowerCase()
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <DevAvatar
              name={auth.name}
              username={auth.username}
              src={auth.avatarUrl}
              borderColor={auth.color}
              size="xs"
            />
            <span>{auth.name}</span>
            <span className="font-mono text-[11px] opacity-75">({auth.count})</span>
          </button>
        ))}
      </div>

      {/* Commits List */}
      <div className="space-y-2">
        {filteredCommits.map((commit) => {
          const isCopied = copiedSha === commit.sha;

          return (
            <div
              key={commit.sha}
              onClick={onViewAllCommits}
              className="bg-zinc-950/60 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <DevAvatar
                    name={commit.author.name}
                    username={commit.author.username}
                    src={commit.author.avatarUrl}
                    borderColor={commit.author.color || 'rgba(254, 83, 0, 1)'}
                    size="xs"
                  />

                  <span
                    className={`text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded-xs border shrink-0 ${getTypeStyle(
                      commit.type
                    )}`}
                  >
                    {commit.type}
                  </span>

                  <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                    {commit.message}
                  </span>

                  {commit.prNumber && (
                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded-xs shrink-0">
                      <GitPullRequest className="w-2.5 h-2.5" />
                      #{commit.prNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono shrink-0 pl-7 sm:pl-0">
                  <span className="text-[11px] text-zinc-400">{commit.displayDate}</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 text-[11px]">+{commit.stats.additions}</span>
                    <span className="text-rose-400 text-[11px]">-{commit.stats.deletions}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCopySha(commit.sha, e)}
                    className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Copy short SHA"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-300">{commit.shortSha}</span>
                    )}
                  </button>

                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
