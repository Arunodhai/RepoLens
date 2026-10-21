import React, { useState } from 'react';
import { RepoMetadata, DateRange } from '../types/repo';
import {
  GitFork,
  Star,
  RefreshCw,
  ChevronDown,
  Settings,
  User,
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ExternalLink,
  GitCommit,
  ShieldCheck,
  Github,
  GitBranch,
  Download,
  Kanban,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type NavigationTab =
  | 'dashboard'
  | 'commits'
  | 'contributors'
  | 'kanban'
  | 'security'
  | 'timeline';

interface HeaderProps {
  currentRepo: RepoMetadata;
  allRepos: RepoMetadata[];
  onSelectRepo: (repo: RepoMetadata) => void;
  dateRange: DateRange;
  onSelectDateRange: (range: DateRange) => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenGitHubModal: () => void;
  onRepoCustomSearch?: (owner: string, repo: string, token?: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  commitsCount?: number;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRepo,
  allRepos,
  onSelectRepo,
  dateRange,
  onSelectDateRange,
  activeTab,
  onSelectTab,
  onOpenGitHubModal,
  onSync,
  isSyncing,
  commitsCount,
  onExportPdf,
  isExportingPdf,
}) => {
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const dateLabels: Record<DateRange, string> = {
    ALL: 'All Time',
    '1Y': '1 Year',
    '90D': '90 Days',
    '30D': '30 Days',
    '7D': '7 Days',
  };

  const handleSyncClick = () => {
    onSync();
    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.1, x: 0.8 },
        colors: ['rgba(109, 255, 3, 1)', 'rgba(254, 83, 0, 1)', 'rgba(255, 255, 255, 1)'],
      });
    } catch {}
  };

  return (
    <header className="border-b border-zinc-800/80 bg-black sticky top-0 z-40 px-4 lg:px-8 py-3.5 space-y-3">
      {/* Top Header Row matching the reference screenshot */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: App Title and User Identifier */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              RepoLens — Repository Intelligence
            </h1>
          </div>
          {/* User badge matching reference image: Arunodhai V arunodhai007@gmail.com */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>arunodhai007</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-slate-400">arunodhai007@gmail.com</span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1 text-emerald-400 font-sans text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Right: Controls matching reference screenshot (Sync, All Time, Dark mode, Settings) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Repository Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRepoDropdown(!showRepoDropdown)}
              className="flex items-center gap-2 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className="text-amber-400 font-bold">{currentRepo.owner}</span>
              <span className="text-zinc-500">/</span>
              <span className="font-semibold">{currentRepo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showRepoDropdown && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-black border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowRepoDropdown(false)}
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-500">
                  Active Repository
                </div>
                {allRepos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => onSelectRepo(repo)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                      repo.id === currentRepo.id
                        ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20'
                        : 'text-slate-300 hover:bg-zinc-900'
                    }`}
                  >
                    <span className="truncate pr-2">{repo.fullName}</span>
                    <span className="text-[10px] text-emerald-400 shrink-0 font-sans">
                      Active
                    </span>
                  </button>
                ))}
                <div className="border-t border-zinc-800 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={onOpenGitHubModal}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 hover:bg-zinc-900 flex items-center justify-between transition-colors"
                  >
                    <span>+ Connect Custom Repo...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sync Button matching reference */}
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-xs font-mono text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : ''}`} />
            <span>Sync</span>
            <RefreshCw className={`w-3 h-3 text-zinc-400 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Date Selector Dropdown matching reference "All Time ▾" */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>{dateLabels[dateRange]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showDateDropdown && (
              <div
                className="absolute right-0 mt-1.5 w-32 bg-black border border-zinc-800 rounded-xl shadow-2xl p-1 z-50"
                onClick={() => setShowDateDropdown(false)}
              >
                {(['ALL', '1Y', '90D', '30D', '7D'] as DateRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onSelectDateRange(r)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      dateRange === r
                        ? 'bg-amber-500/10 text-amber-300 font-bold'
                        : 'text-slate-300 hover:bg-zinc-900'
                    }`}
                  >
                    {dateLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Paste Repo & PAT Button */}
          <button
            type="button"
            onClick={onOpenGitHubModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors font-medium shadow-xs"
            title="Paste any GitHub repository link and Personal Access Token"
          >
            <Github className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connect Repo & PAT</span>
          </button>

          {/* Export PDF Summary Report Button */}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors font-medium shadow-xs cursor-pointer disabled:opacity-50"
              title="Export and download executive PDF summary report for the active repository"
            >
              <Download className={`w-3.5 h-3.5 text-amber-400 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>
          )}

          {/* Settings / PAT Modal Trigger */}
          <button
            type="button"
            aria-label="Settings and GitHub token"
            onClick={onOpenGitHubModal}
            className="p-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Dashboard, Commits, Top Authors, Kanban Board, Security, Git Timeline & Files) */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar border-t border-zinc-800">
        {[
          { id: 'dashboard' as const, label: 'Intelligence Dashboard', icon: LayoutDashboard },
          {
            id: 'commits' as const,
            label: commitsCount !== undefined ? `Commits & Details (${commitsCount})` : 'Commits & Details',
            icon: GitCommit,
            isBadge: true,
          },
          { id: 'contributors' as const, label: 'Top Authors', icon: Users },
          { id: 'kanban' as const, label: 'Kanban Board', icon: Kanban },
          { id: 'security' as const, label: 'Security & Vulnerabilities', icon: ShieldCheck },
          { id: 'timeline' as const, label: 'Git Timeline & Code Files', icon: GitBranch },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.isBadge && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}

        {/* GitHub External Link */}
        <div className="ml-auto hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            {currentRepo.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            {currentRepo.forks.toLocaleString()}
          </span>
          <a
            href={currentRepo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
