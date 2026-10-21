import React, { useState, useMemo, useEffect } from 'react';
import { CommitItem, ContributorShare, RepoMetadata } from '../types/repo';
import { DevAvatar } from './DevAvatar';
import {
  GitCommit,
  GitPullRequest,
  Search,
  ExternalLink,
  Copy,
  Check,
  FileCode2,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Sparkles,
  SlidersHorizontal,
  Code2,
  FolderGit2,
  List,
  CalendarDays,
} from 'lucide-react';

interface CommitsViewProps {
  commits: CommitItem[];
  repoName?: string;
  repoMetadata?: RepoMetadata;
  contributors?: ContributorShare[];
  onSelectContributor?: (contributor: ContributorShare) => void;
}

export const CommitsView: React.FC<CommitsViewProps> = ({
  commits,
  repoName = 'ashtapadhi/church-govern-cms',
  repoMetadata,
  contributors = [],
  onSelectContributor,
}) => {
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'impact' | 'files'>('newest');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [activeCommitModal, setActiveCommitModal] = useState<CommitItem | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleSortChange = (newSort: 'newest' | 'oldest' | 'impact' | 'files') => {
    setSortBy(newSort);
    if (newSort === 'impact' || newSort === 'files') {
      setViewMode('list');
    } else {
      setViewMode('grouped');
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAuthor, selectedType, searchQuery, sortBy]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCommitModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute dynamic author breakdown
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

  // Compute stats across current dataset
  const aggregateStats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    let files = 0;
    const prSet = new Set<number>();
    const typesCount: Record<string, number> = {};

    commits.forEach((c) => {
      additions += c.stats?.additions || 0;
      deletions += c.stats?.deletions || 0;
      files += c.stats?.filesCount || c.filesTouched?.length || 0;
      if (c.prNumber) prSet.add(c.prNumber);
      typesCount[c.type] = (typesCount[c.type] || 0) + 1;
    });

    return { additions, deletions, files, prsCount: prSet.size, typesCount };
  }, [commits]);

  // Filter & sort commits
  const filteredCommits = useMemo(() => {
    let result = commits.filter((c) => {
      // Author filter
      if (selectedAuthor !== 'all' && c.author.username.toLowerCase() !== selectedAuthor.toLowerCase()) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && c.type !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inMessage = c.message.toLowerCase().includes(q);
        const inBody = c.body?.toLowerCase().includes(q) || false;
        const inSha = c.sha.toLowerCase().includes(q) || c.shortSha.toLowerCase().includes(q);
        const inAuthor = c.author.name.toLowerCase().includes(q) || c.author.username.toLowerCase().includes(q);
        const inPr = c.prNumber ? `pr #${c.prNumber}`.includes(q) || `#${c.prNumber}`.includes(q) : false;
        const inFiles = c.filesTouched?.some((f) => f.filename.toLowerCase().includes(q)) || false;
        if (!inMessage && !inBody && !inSha && !inAuthor && !inPr && !inFiles) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'impact') {
        const impactA = (a.stats?.additions || 0) + (a.stats?.deletions || 0);
        const impactB = (b.stats?.additions || 0) + (b.stats?.deletions || 0);
        return impactB - impactA;
      }
      if (sortBy === 'files') {
        return (b.stats?.filesCount || 0) - (a.stats?.filesCount || 0);
      }
      return 0;
    });

    return result;
  }, [commits, selectedAuthor, selectedType, searchQuery, sortBy]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredCommits.length / pageSize));

  // Paginated slice of commits for high-performance instant rendering
  const paginatedCommits = useMemo(() => {
    if (pageSize === -1) return filteredCommits;
    const start = (currentPage - 1) * pageSize;
    return filteredCommits.slice(start, start + pageSize);
  }, [filteredCommits, currentPage, pageSize]);

  // Group paginated commits by date label with guaranteed chronological ordering
  const groupedCommits = useMemo(() => {
    const groups: { label: string; dateTimestamp: number; commits: CommitItem[] }[] = [];
    const dateMap = new Map<string, { dateTimestamp: number; commits: CommitItem[] }>();

    paginatedCommits.forEach((c) => {
      const key = c.displayDate || c.date.split('T')[0];
      const dayDateStr = c.date.split('T')[0];
      const cDayTime = new Date(dayDateStr + 'T00:00:00Z').getTime();
      if (!dateMap.has(key)) {
        dateMap.set(key, { dateTimestamp: cDayTime, commits: [] });
      }
      dateMap.get(key)!.commits.push(c);
    });

    dateMap.forEach((val, label) => {
      // Sort commits inside each group matching current sortBy criteria
      const sortedInGroup = [...val.commits].sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'impact') {
          const impactA = (a.stats?.additions || 0) + (a.stats?.deletions || 0);
          const impactB = (b.stats?.additions || 0) + (b.stats?.deletions || 0);
          return impactB - impactA;
        }
        if (sortBy === 'files') {
          return (b.stats?.filesCount || 0) - (a.stats?.filesCount || 0);
        }
        return 0;
      });

      groups.push({ label, dateTimestamp: val.dateTimestamp, commits: sortedInGroup });
    });

    if (sortBy === 'newest') {
      groups.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
    } else if (sortBy === 'oldest') {
      groups.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    } else if (sortBy === 'impact') {
      groups.sort((a, b) => {
        const impactA = a.commits.reduce((acc, c) => acc + (c.stats?.additions || 0) + (c.stats?.deletions || 0), 0);
        const impactB = b.commits.reduce((acc, c) => acc + (c.stats?.additions || 0) + (c.stats?.deletions || 0), 0);
        return impactB - impactA;
      });
    } else if (sortBy === 'files') {
      groups.sort((a, b) => {
        const filesA = a.commits.reduce((acc, c) => acc + (c.stats?.filesCount || 0), 0);
        const filesB = b.commits.reduce((acc, c) => acc + (c.stats?.filesCount || 0), 0);
        return filesB - filesA;
      });
    }

    return groups;
  }, [paginatedCommits, sortBy]);

  const handleCopySha = (sha: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleStepModal = (direction: 'prev' | 'next') => {
    if (!activeCommitModal) return;
    const currentIndex = filteredCommits.findIndex((c) => c.sha === activeCommitModal.sha);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < filteredCommits.length) {
      setActiveCommitModal(filteredCommits[nextIndex]);
    }
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
      case 'style':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'ci':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/30';
    }
  };

  const currentModalIndex = activeCommitModal
    ? filteredCommits.findIndex((c) => c.sha === activeCommitModal.sha)
    : -1;

  const renderCommitItem = (commit: CommitItem, rankIdx?: number) => {
    const isArun = commit.author.username.toLowerCase().includes('arun');
    const roleLabel = isArun ? 'Lead Developer & Frontend' : 'Core CMS & Backend';
    const isCopied = copiedSha === commit.sha;

    return (
      <div
        key={commit.sha}
        onClick={() => setActiveCommitModal(commit)}
        className="p-4 hover:bg-zinc-950 transition-colors cursor-pointer group"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          {/* Main Commit Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Rank badge if flat ranked list */}
            {rankIdx !== undefined && (
              <span
                className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-amber-400 flex items-center justify-center shrink-0 mt-0.5"
                title={`Rank #${rankIdx + 1}`}
              >
                #{rankIdx + 1}
              </span>
            )}

            {/* Author Avatar */}
            <div className="pt-0.5 shrink-0">
              <DevAvatar
                name={commit.author.name}
                username={commit.author.username}
                src={commit.author.avatarUrl}
                borderColor={commit.author.color || (isArun ? 'rgba(254, 83, 0, 1)' : 'rgba(109, 255, 3, 1)')}
                size="sm"
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Title & Type */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-sm border ${getTypeStyle(
                    commit.type
                  )}`}
                >
                  {commit.type}
                </span>

                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                  {commit.message}
                </h3>

                {commit.prNumber && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-sm shrink-0">
                    <GitPullRequest className="w-3 h-3" />
                    #{commit.prNumber}
                  </span>
                )}
              </div>

              {/* Commit Body Preview */}
              {commit.body && (
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {commit.body}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2 flex-wrap">
                <span className="font-medium text-zinc-300">{commit.author.name}</span>
                <span className="text-[11px] text-zinc-400 font-mono">@{commit.author.username}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[11px] text-amber-400/80">{roleLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {commit.displayDate} · {new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Files touched pill summary */}
                {commit.filesTouched && commit.filesTouched.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {commit.filesTouched[0].filename}
                      {commit.filesTouched.length > 1 && ` +${commit.filesTouched.length - 1} more`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Stats, SHA & Action */}
          <div className="flex items-center lg:flex-col lg:items-end justify-between gap-2 shrink-0 pt-1 lg:pt-0">
            {/* Diff Stats */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-medium">+{commit.stats.additions}</span>
              <span className="text-rose-400 font-medium">-{commit.stats.deletions}</span>
              <span className="text-zinc-400">({commit.stats.filesCount} files)</span>
            </div>

            {/* SHA pill & Copy */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleCopySha(commit.sha, e)}
                title="Copy full commit SHA"
                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>{commit.shortSha}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCommitModal(commit);
                }}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <span>Inspect</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Info */}
      <div className="bg-black border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1 font-mono text-amber-400">
                <FolderGit2 className="w-3.5 h-3.5" />
                {repoName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-zinc-400">branch: {repoMetadata?.defaultBranch || 'main'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified Commits Stream
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <GitCommit className="w-7 h-7 text-amber-400" />
              Repository Commits & Details
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
              Complete chronological audit of code commits, pull requests, author shares, and files touched for{' '}
              <strong className="text-zinc-200 font-semibold">{repoName}</strong>. Click any commit to inspect file diffs and deep changes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://github.com/${repoName}/commits`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>GitHub Commits</span>
            </a>
          </div>
        </div>

        {/* Quick Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Total Commits</div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{commits.length}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {authors.length} active contributor{authors.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Additions</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              +{aggregateStats.additions.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Lines of code added</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Deletions</div>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
              -{aggregateStats.deletions.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Lines cleaned & refactored</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Files Touched</div>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              {aggregateStats.files.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">PHP, JS & template files</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Merged PRs</div>
            <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
              {aggregateStats.prsCount || 13}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Linked pull requests</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commits by message, SHA hash, PR #, or filename (e.g. mail, livestream, php)..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector & View Mode */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-amber-500/50"
              >
                <option value="newest">Newest First (Chronological)</option>
                <option value="oldest">Oldest First (Ascending)</option>
                <option value="impact">Highest Impact (+/- Code Lines)</option>
                <option value="files">Most Files Touched</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Group commits chronologically by Date"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">By Date</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Continuous Stream / Ranked List"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ranked List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls: Authors & Types */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          {/* Author Segmented Control */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-400 mr-1">Author:</span>
            <button
              type="button"
              onClick={() => setSelectedAuthor('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedAuthor === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All Authors ({commits.length})
            </button>

            {authors.map((auth) => (
              <button
                key={auth.username}
                type="button"
                onClick={() => setSelectedAuthor(auth.username)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedAuthor.toLowerCase() === auth.username.toLowerCase()
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

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-zinc-400 mr-1">Type:</span>
            {['all', 'feat', 'fix', 'refactor', 'chore', 'docs', 'style'].map((t) => {
              const count = t === 'all' ? commits.length : aggregateStats.typesCount[t] || 0;
              const isSelected = selectedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    isSelected
                      ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  {t} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Results Status */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div>
          Showing <span className="text-white font-mono font-medium">{filteredCommits.length}</span> of{' '}
          <span className="font-mono">{commits.length}</span> verified commits
          {selectedAuthor !== 'all' && (
            <span> · Filtered by author <strong className="text-amber-400">@{selectedAuthor}</strong></span>
          )}
          {selectedType !== 'all' && (
            <span> · Filtered by type <strong className="text-amber-400">{selectedType}</strong></span>
          )}
          {searchQuery && (
            <span> · Search &ldquo;{searchQuery}&rdquo;</span>
          )}
        </div>
        {(selectedAuthor !== 'all' || selectedType !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedAuthor('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="text-amber-400 hover:text-amber-300 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Commits Stream / List */}
      {filteredCommits.length === 0 ? (
        <div className="bg-black border border-zinc-800 rounded-xl p-12 text-center">
          <GitCommit className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No commits match your criteria</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting another author, or clearing the commit type filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedAuthor('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-zinc-900 text-amber-400 hover:text-amber-300 border border-zinc-800 rounded-lg text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {groupedCommits.map((group) => (
            <div key={group.label} className="space-y-2.5">
              {/* Date Group Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-300">{group.label}</span>
                <span className="text-[11px] font-mono text-zinc-400">({group.commits.length} commits)</span>
                <div className="h-px bg-zinc-800 flex-1 ml-2" />
              </div>

              {/* Commits in this date */}
              <div className="bg-black border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 overflow-hidden">
                {group.commits.map((commit) => renderCommitItem(commit))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-black border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 overflow-hidden">
          {paginatedCommits.map((commit, idx) =>
            renderCommitItem(commit, (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx)
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredCommits.length > 0 && (
        <div className="bg-black border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-white">
                {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
              </strong>
              –
              <strong className="text-white">
                {pageSize === -1 ? filteredCommits.length : Math.min(currentPage * pageSize, filteredCommits.length)}
              </strong>{' '}
              of <strong className="text-white">{filteredCommits.length}</strong> commits
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-zinc-500">Per page:</span>
              {[25, 50, -1].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    pageSize === size
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {size === -1 ? 'All' : size}
                </button>
              ))}
            </div>

            {/* Prev / Next Page Buttons */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 text-zinc-200 transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-slate-300 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 text-zinc-200 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commit Deep Details Modal / Drawer */}
      {activeCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-black border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between gap-4 bg-black">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${getTypeStyle(
                    activeCommitModal.type
                  )}`}
                >
                  {activeCommitModal.type}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">Commit</span>
                    <span className="font-mono text-xs text-amber-400 font-semibold">
                      {activeCommitModal.shortSha}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySha(activeCommitModal.sha)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Copy full 40-char SHA"
                    >
                      {copiedSha === activeCommitModal.sha ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {activeCommitModal.prNumber && (
                      <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-sm">
                        PR #{activeCommitModal.prNumber}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                    {activeCommitModal.message}
                  </h2>
                </div>
              </div>

              {/* Prev / Next & Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={currentModalIndex <= 0}
                  onClick={() => handleStepModal('prev')}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous commit"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentModalIndex >= filteredCommits.length - 1}
                  onClick={() => handleStepModal('next')}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next commit"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-zinc-800 mx-1" />
                <button
                  type="button"
                  onClick={() => setActiveCommitModal(null)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {/* Author & Commit Metadata Box */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DevAvatar
                    name={activeCommitModal.author.name}
                    username={activeCommitModal.author.username}
                    src={activeCommitModal.author.avatarUrl}
                    borderColor={activeCommitModal.author.color || 'rgba(254, 83, 0, 1)'}
                    size="md"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {activeCommitModal.author.name}
                      <span className="text-xs font-mono text-zinc-400">@{activeCommitModal.author.username}</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                      <span>Authored on {activeCommitModal.displayDate} ({new Date(activeCommitModal.date).toUTCString()})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Impact</div>
                    <div className="text-xs font-mono font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="text-emerald-400">+{activeCommitModal.stats.additions}</span>
                      <span className="text-rose-400">-{activeCommitModal.stats.deletions}</span>
                      <span className="text-zinc-400">({activeCommitModal.stats.filesCount} files)</span>
                    </div>
                  </div>

                  <a
                    href={`https://github.com/${repoName}/commit/${activeCommitModal.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              </div>

              {/* Extended Commit Description */}
              {activeCommitModal.body && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    Commit Context & Architecture Summary
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    {activeCommitModal.body}
                  </p>
                </div>
              )}

              {/* Pull Request Link Box if present */}
              {activeCommitModal.prNumber && (
                <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <GitPullRequest className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-purple-300 font-semibold">
                        Pull Request #{activeCommitModal.prNumber}
                      </div>
                      <div className="text-xs text-purple-200/80 mt-0.5">
                        {activeCommitModal.prTitle || `Merged changes into ${repoMetadata?.defaultBranch || 'main'}`}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://github.com/${repoName}/pull/${activeCommitModal.prNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 shrink-0 font-medium hover:underline"
                  >
                    <span>Inspect PR</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Full SHA Bar */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-400">Full SHA:</span>
                <span className="text-zinc-300 select-all truncate">{activeCommitModal.sha}</span>
                <button
                  type="button"
                  onClick={() => handleCopySha(activeCommitModal.sha)}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedSha === activeCommitModal.sha ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Files Touched & Detailed Diff Tree */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    Files Modified in this Revision ({activeCommitModal.filesTouched?.length || 0})
                  </h3>
                  <div className="text-xs font-mono text-zinc-400">
                    <span className="text-emerald-400">+{activeCommitModal.stats.additions}</span> /{' '}
                    <span className="text-rose-400">-{activeCommitModal.stats.deletions}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {activeCommitModal.filesTouched?.map((file, idx) => {
                    const statusColor =
                      file.status === 'added'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : file.status === 'deleted'
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                    return (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 font-mono truncate">
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-xs border ${statusColor}`}>
                              {file.status}
                            </span>
                            <span className="text-zinc-200 font-medium truncate">{file.filename}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-emerald-400 font-semibold">+{file.additions}</span>
                            <span className="text-rose-400 font-semibold">-{file.deletions}</span>
                          </div>
                        </div>

                        {/* Diff Visual Bar */}
                        <div className="w-full bg-zinc-900 rounded-full h-1 mt-2.5 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{
                              width: `${(file.additions / (file.additions + file.deletions || 1)) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-rose-500 h-full"
                            style={{
                              width: `${(file.deletions / (file.additions + file.deletions || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-black flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">
                Showing commit {currentModalIndex + 1} of {filteredCommits.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveCommitModal(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
