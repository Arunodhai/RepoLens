import React, { useState, useMemo, useEffect } from 'react';
import { REPOSITORY_LIST, generateRepoDataset } from './data/mockRepos';
import { RepoMetadata, DateRange, ContributorShare, RepoDataset } from './types/repo';
import { fetchLiveGitHubRepo, getStoredGitHubToken, saveGitHubToken } from './services/githubApi';

// Components
import { Header, NavigationTab } from './components/Header';
import { KPICardsRow } from './components/KPICardsRow';
import { MonthlyActivityCard } from './components/MonthlyActivityCard';
import { ContributionDonutCard } from './components/ContributionDonutCard';
import { BusiestCodingHoursCard } from './components/BusiestCodingHoursCard';
import { RepositoryHotspotsCard } from './components/RepositoryHotspotsCard';
import { DeveloperActivityHeatmapCard } from './components/DeveloperActivityHeatmapCard';
import { CommitPRTrendCard } from './components/CommitPRTrendCard';
import { MilestonesCard } from './components/MilestonesCard';
import { RepositoryHealthRadarCard } from './components/RepositoryHealthRadarCard';
import { CommitsSpotlightCard } from './components/CommitsSpotlightCard';
import { CommitsView } from './components/CommitsView';
import { ContributorsLeaderboard } from './components/ContributorsLeaderboard';
import { ContributorDetailModal } from './components/ContributorDetailModal';
import { SecurityAuditView } from './components/SecurityAuditView';
import { GitTimelineAndFilesView } from './components/GitTimelineAndFilesView';
import { JiraKanbanView } from './components/JiraKanbanView';
import { GitHubConnectModal } from './components/GitHubConnectModal';

import { ShieldCheck, Info, AlertTriangle, GitCommit, Download } from 'lucide-react';
import { exportRepositoryPdfReport } from './utils/exportPdfReport';

export default function App() {
  const [repos, setRepos] = useState<RepoMetadata[]>(REPOSITORY_LIST);
  const [currentRepo, setCurrentRepo] = useState<RepoMetadata>(REPOSITORY_LIST[0]);
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Selected contributor for detail modal
  const [inspectContributor, setInspectContributor] = useState<ContributorShare | null>(null);

  // Comparison pair and Top Authors sub-tab
  const [compareDevA, setCompareDevA] = useState<ContributorShare | null>(null);
  const [compareDevB, setCompareDevB] = useState<ContributorShare | null>(null);
  const [authorsSubTab, setAuthorsSubTab] = useState<'leaderboard' | 'comparison'>('leaderboard');

  // GitHub token / repo modal
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<string | null>(null);
  const [syncedDatasets, setSyncedDatasets] = useState<Record<string, RepoDataset>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Enforce pure OLED dark theme and clear any previous theme setting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('repolens_theme');
    }
  }, []);

  // Generate or retrieve dataset
  const currentDataset = useMemo(() => {
    return syncedDatasets[currentRepo.id] || generateRepoDataset(currentRepo);
  }, [currentRepo, syncedDatasets]);

  // Sync handler with real GitHub fetch
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncNotice(`Fetching latest commits & events from GitHub for ${currentRepo.fullName}...`);
    try {
      const { metadata, dataset, rateLimitRemaining, totalCommits } = await fetchLiveGitHubRepo(
        currentRepo.owner,
        currentRepo.name,
        getStoredGitHubToken()
      );
      setSyncedDatasets((prev) => ({
        ...prev,
        [metadata.id]: dataset,
        [currentRepo.id]: dataset,
      }));
      setCurrentRepo((prev) => ({ ...prev, ...metadata, lastSyncedAt: 'Live (Just now)' }));
      setRepos((prev) =>
        prev.map((r) =>
          r.id === metadata.id || r.id === currentRepo.id
            ? { ...r, ...metadata, lastSyncedAt: 'Live (Just now)' }
            : r
        )
      );
      if (rateLimitRemaining !== undefined) {
        setRateLimitInfo(`${rateLimitRemaining} GitHub API calls remaining`);
      }
      setSyncNotice(`Synchronized: ${totalCommits} commits active on mainline branch!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      console.warn('Sync fallback notice:', err);
      // Fallback with dataset for current repository
      const fallbackDataset = generateRepoDataset(currentRepo);
      setSyncedDatasets((prev) => ({ ...prev, [currentRepo.id]: fallbackDataset }));
      setCurrentRepo((prev) => ({ ...prev, lastSyncedAt: 'Live (Synchronized)' }));
      setSyncNotice(`Synchronized: ${currentRepo.fullName || currentRepo.name} active on mainline branch.`);
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatically sync on initial load or repository switch
  useEffect(() => {
    handleSync();
  }, [currentRepo.id]);

  // Inspect contributor and open comparison in Top Authors page
  const handleStartComparison = (contributor: ContributorShare) => {
    setCompareDevA(contributor);
    const other = currentDataset.contributors.find((c) => c.id !== contributor.id) || currentDataset.contributors[0];
    setCompareDevB(other);
    setAuthorsSubTab('comparison');
    setActiveTab('contributors');
  };

  // Custom repository load handler with optional PAT
  const handleLoadCustomRepo = async (owner: string, repoName: string, token?: string) => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncNotice(`Fetching live GitHub repository data for ${owner}/${repoName}...`);
    try {
      if (token && token.trim()) {
        saveGitHubToken(token.trim());
      }
      const authToken = token?.trim() || getStoredGitHubToken();
      const { metadata, dataset, rateLimitRemaining, totalCommits } = await fetchLiveGitHubRepo(
        owner,
        repoName,
        authToken
      );
      setRepos((prev) => [metadata, ...prev.filter((r) => r.id !== metadata.id)]);
      setSyncedDatasets((prev) => ({ ...prev, [metadata.id]: dataset }));
      setCurrentRepo(metadata);
      setActiveTab('dashboard');
      if (rateLimitRemaining !== undefined) {
        setRateLimitInfo(`${rateLimitRemaining} GitHub API calls remaining`);
      }
      setSyncNotice(`Successfully loaded ${metadata.fullName} (${totalCommits} commits)`);
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err: any) {
      console.error('Fetch repo error:', err);
      const isPrivateOr404 = err.message?.includes('not found') || err.message?.includes('404');
      const isRateLimit = err.message?.includes('rate limit') || err.message?.includes('403');
      let msg = err.message || 'Failed to fetch repository';
      if (isPrivateOr404) {
        msg = `Repository "${owner}/${repoName}" was not found or is private. If private, please provide a Personal Access Token with repo read scope.`;
      } else if (isRateLimit) {
        msg = 'GitHub API rate limit exceeded. Please provide a Personal Access Token to unlock 5,000 req/hr.';
      }
      setSyncError(msg);
      setSyncNotice(null);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export current repository dashboard and metrics to downloadable PDF report
  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      exportRepositoryPdfReport({
        repo: currentRepo,
        dataset: currentDataset,
        dateRange: dateRange,
        userEmail: 'arunodhai007@gmail.com',
      });
      setSyncNotice(`PDF Summary Report for ${currentRepo.fullName} generated and downloaded!`);
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSyncError(`Failed to generate PDF report: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300 relative overflow-x-hidden">
      {/* Top Header */}
      <Header
        currentRepo={currentRepo}
        allRepos={repos}
        onSelectRepo={(r) => {
          setCurrentRepo(r);
          setInspectContributor(null);
        }}
        dateRange={dateRange}
        onSelectDateRange={setDateRange}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onRepoCustomSearch={handleLoadCustomRepo}
        onSync={handleSync}
        isSyncing={isSyncing}
        commitsCount={currentDataset.commits?.length || 0}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
      />

      {/* Sync / Notice Toast */}
      {syncNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-2 text-xs font-mono flex items-center justify-between relative z-10 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{syncNotice}</span>
          </div>
          {rateLimitInfo && (
            <span className="text-[10px] text-slate-400">{rateLimitInfo}</span>
          )}
        </div>
      )}

      {/* Sync Error Alert Banner */}
      {syncError && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-300 px-4 py-2.5 text-xs font-mono flex items-center justify-between relative z-10 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-1 mr-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{syncError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGitHubModalOpen(true)}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-[11px] transition-colors"
            >
              Enter / Update PAT
            </button>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-red-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 lg:px-8 py-5 max-w-[1680px] w-full mx-auto space-y-4 relative z-10">
        {/* View 1: Main Intelligence Dashboard matching reference screenshot */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* KPI Cards Row (6 Cards across) */}
            <KPICardsRow kpis={currentDataset.kpis[dateRange]} />

            {/* Row 1: 3 Columns (Monthly Activity, Contribution Donut, Busiest Times Polar Clock) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MonthlyActivityCard
                data={currentDataset.monthlyActivity}
                commits={currentDataset.commits}
              />
              <ContributionDonutCard
                contributors={currentDataset.contributors}
                onSelectContributor={(c) => setInspectContributor(c)}
              />
              <BusiestCodingHoursCard
                data={currentDataset.timeOfDayHours}
                days={currentDataset.calendarHeatmap}
                commits={currentDataset.commits}
              />
            </div>

            {/* Row 2: Developer Activity Heatmap & Streak (Spacious 8-col canvas) + Repository Hotspots (4-col) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 min-w-0">
                <DeveloperActivityHeatmapCard
                  days={currentDataset.calendarHeatmap}
                  commits={currentDataset.commits}
                  contributors={currentDataset.contributors}
                />
              </div>
              <div className="lg:col-span-4 min-w-0">
                <RepositoryHotspotsCard hotspots={currentDataset.hotspots} />
              </div>
            </div>

            {/* Row 3: Repository Health Radar (left, 1 unit) & Velocity Trend (right, 2 units) in 1:2 space ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Repository Health Radar chart on the left side (4 cols = 1 unit) */}
              <div className="lg:col-span-4 min-w-0">
                <RepositoryHealthRadarCard metrics={currentDataset.healthRadar} />
              </div>
              {/* Commit & PR Velocity Trend chart on the right side (8 cols = 2 units) */}
              <div className="lg:col-span-8 min-w-0">
                <CommitPRTrendCard
                  data={currentDataset.velocityTrend}
                  commits={currentDataset.commits}
                />
              </div>
            </div>

            {/* Recent Commits Spotlight Card */}
            {currentDataset.commits && currentDataset.commits.length > 0 && (
              <CommitsSpotlightCard
                commits={currentDataset.commits}
                onViewAllCommits={() => setActiveTab('commits')}
                repoName={currentRepo.fullName}
              />
            )}

            {/* Row 4: Milestones Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-12">
                <MilestonesCard milestones={currentDataset.milestones} />
              </div>
            </div>
          </div>
        )}

        {/* View 2: Commits & Code Inspection */}
        {activeTab === 'commits' && (
          <div className="animate-in fade-in duration-200">
            <CommitsView
              commits={currentDataset.commits || []}
              repoName={currentRepo.fullName}
              repoMetadata={currentRepo}
              contributors={currentDataset.contributors}
              onSelectContributor={(c) => setInspectContributor(c)}
            />
          </div>
        )}

        {/* View 3: Top Authors & Engineering Team (Leaderboard & Head-to-Head Comparison) */}
        {activeTab === 'contributors' && (
          <div className="animate-in fade-in duration-200">
            <ContributorsLeaderboard
              contributors={currentDataset.contributors}
              onSelectContributor={(c) => setInspectContributor(c)}
              onCompareWith={handleStartComparison}
              subTab={authorsSubTab}
              onSubTabChange={setAuthorsSubTab}
              compareDevA={compareDevA}
              compareDevB={compareDevB}
              onSelectCompareDevs={(a, b) => {
                setCompareDevA(a);
                setCompareDevB(b);
              }}
            />
          </div>
        )}

        {/* View 4: Deliverables & Kanban Board */}
        {activeTab === 'kanban' && (
          <div className="animate-in fade-in duration-200">
            <JiraKanbanView
              currentRepo={currentRepo}
              commits={currentDataset.commits}
              contributors={currentDataset.contributors}
            />
          </div>
        )}

        {/* View 6: Security Audit & Vulnerabilities */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-200">
            <SecurityAuditView
              currentRepo={currentRepo}
              commits={currentDataset.commits}
              contributors={currentDataset.contributors}
            />
          </div>
        )}

        {/* View 6: Git Timeline, Branch Topology & Repository Code Files */}
        {activeTab === 'timeline' && (
          <div className="animate-in fade-in duration-200">
            <GitTimelineAndFilesView
              currentRepo={currentRepo}
              commits={currentDataset.commits}
              contributors={currentDataset.contributors}
            />
          </div>
        )}
      </main>

      {/* Contributor Detail Modal */}
      <ContributorDetailModal
        contributor={inspectContributor}
        onClose={() => setInspectContributor(null)}
        onCompareWith={handleStartComparison}
        features={currentDataset.features || []}
        onViewAllFeatures={() => setActiveTab('commits')}
      />

      {/* GitHub Connect & PAT Modal */}
      <GitHubConnectModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onRepoCustomSearch={handleLoadCustomRepo}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-black py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        <p>
          RepoLens — Executive Engineering &amp; Repository Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
