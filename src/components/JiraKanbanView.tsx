import React, { useState, useMemo, useEffect } from 'react';
import { RepoMetadata, CommitItem, ContributorShare } from '../types/repo';
import { JiraIssue, JiraSprintInfo, JiraStatus, JiraIssueType, JiraPriority } from '../types/jira';
import { analyzeCommitsToJiraIssues } from '../data/jiraData';
import {
  Kanban,
  Bug,
  Bookmark,
  CheckSquare,
  ShieldCheck,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Equal,
  Plus,
  Search,
  Filter,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Check,
  Copy,
  X,
  Trash2,
  CheckCircle2,
  List,
  RotateCcw,
  FileCode2,
  Tag,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface JiraKanbanViewProps {
  currentRepo: RepoMetadata;
  commits?: CommitItem[];
  contributors?: ContributorShare[];
}

const COLUMNS: { id: JiraStatus; label: string; description: string; borderAccent: string }[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    description: 'Prioritized queue for future iterations',
    borderAccent: 'border-zinc-800',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Active development & engineering',
    borderAccent: 'border-amber-500/40',
  },
  {
    id: 'in_review',
    label: 'In Review / PR',
    description: 'Pull request review & CI checks',
    borderAccent: 'border-cyan-500/40',
  },
  {
    id: 'done',
    label: 'Done (Merged)',
    description: 'Committed, verified & merged to mainline',
    borderAccent: 'border-emerald-500/50',
  },
];

export const JiraKanbanView: React.FC<JiraKanbanViewProps> = ({
  currentRepo,
  commits = [],
  contributors = [],
}) => {
  // Analyze real commits into Jira issues
  const initialData = useMemo(() => {
    return analyzeCommitsToJiraIssues(currentRepo, commits, contributors);
  }, [currentRepo.id, currentRepo.name, commits, contributors]);

  // Load from localStorage or use analyzed real commit issues
  const [sprint, setSprint] = useState<JiraSprintInfo>(initialData.sprint);
  const [issues, setIssues] = useState<JiraIssue[]>(() => {
    const storageKey = `repolens_jira_issues_${currentRepo.id}`;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialData.issues;
  });

  // Re-sync issues if repository changes
  useEffect(() => {
    const storageKey = `repolens_jira_issues_${currentRepo.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setIssues(JSON.parse(saved));
        setSprint(initialData.sprint);
        return;
      } catch {}
    }
    setIssues(initialData.issues);
    setSprint(initialData.sprint);
  }, [currentRepo.id, initialData]);

  // Save to localStorage whenever issues state changes
  useEffect(() => {
    const storageKey = `repolens_jira_issues_${currentRepo.id}`;
    localStorage.setItem(storageKey, JSON.stringify(issues));
  }, [issues, currentRepo.id]);

  // View mode: 'board' (4 columns) or 'table' (scannable deliverables list)
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);

  // Drag and drop state
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<JiraStatus | null>(null);

  // Modals
  const [inspectIssue, setInspectIssue] = useState<JiraIssue | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create issue form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<JiraIssueType>('story');
  const [newPriority, setNewPriority] = useState<JiraPriority>('medium');
  const [newStatus, setNewStatus] = useState<JiraStatus>('backlog');
  const [newPoints, setNewPoints] = useState<number>(3);
  const [newAssigneeName, setNewAssigneeName] = useState<string>(
    contributors[0]?.name || 'Arunodhai V'
  );

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKey = issue.key.toLowerCase().includes(q);
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesDesc = issue.description.toLowerCase().includes(q);
        const matchesSha = issue.linkedCommitSha?.toLowerCase().includes(q);
        if (!matchesKey && !matchesTitle && !matchesDesc && !matchesSha) return false;
      }

      // Type filter
      if (selectedType !== 'all' && issue.type !== selectedType) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && issue.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && issue.status !== selectedStatus) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'all') {
        if (issue.assignee.username.toLowerCase() !== selectedAssignee.toLowerCase()) {
          return false;
        }
      }

      // Only my issues (arunodhai)
      if (onlyMyIssues) {
        if (!issue.assignee.username.toLowerCase().includes('arunodhai')) {
          return false;
        }
      }

      return true;
    });
  }, [issues, searchQuery, selectedType, selectedPriority, selectedStatus, selectedAssignee, onlyMyIssues]);

  // Derived metrics
  const { totalPoints, completedPoints, inProgressPoints, backlogPoints } = useMemo(() => {
    let tot = 0;
    let comp = 0;
    let inProg = 0;
    let back = 0;
    issues.forEach((i) => {
      tot += i.storyPoints;
      if (i.status === 'done') comp += i.storyPoints;
      else if (i.status === 'in_progress' || i.status === 'in_review') inProg += i.storyPoints;
      else back += i.storyPoints;
    });
    return { totalPoints: tot, completedPoints: comp, inProgressPoints: inProg, backlogPoints: back };
  }, [issues]);

  const completionPct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 100;
  const doneCount = useMemo(() => issues.filter((i) => i.status === 'done').length, [issues]);

  // Move issue to a new status
  const handleMoveIssue = (issueId: string, newStatus: JiraStatus) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : i))
    );
    if (inspectIssue && inspectIssue.id === issueId) {
      setInspectIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (issueId: string) => {
    setDraggedIssueId(issueId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: JiraStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: JiraStatus) => {
    e.preventDefault();
    if (draggedIssueId) {
      handleMoveIssue(draggedIssueId, columnId);
      setDraggedIssueId(null);
      setDragOverColumn(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverColumn(null);
  };

  // Reset to original analyzed commits
  const handleResetToRealCommits = () => {
    const storageKey = `repolens_jira_issues_${currentRepo.id}`;
    localStorage.removeItem(storageKey);
    setIssues(initialData.issues);
    setSprint(initialData.sprint);
  };

  // Create new issue
  const handleCreateIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const prefix =
      currentRepo.name.toLowerCase().includes('vulpy')
        ? 'VULP'
        : currentRepo.id === 'church-govern-cms'
        ? 'CHURCH'
        : currentRepo.name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'TASK';

    const nextNum = issues.length + 101;
    const key = `${prefix}-${nextNum}`;

    const newIssue: JiraIssue = {
      id: `issue-${Date.now()}`,
      key,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Created from RepoLens Sprint Board.',
      type: newType,
      priority: newPriority,
      status: newStatus,
      assignee: {
        name: newAssigneeName,
        username: newAssigneeName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      },
      reporter: {
        name: 'arunodhai007',
        username: 'arunodhai007',
      },
      storyPoints: newPoints,
      sprint: sprint.name,
      epic: 'General Backlog',
      labels: ['feature', currentRepo.language.toLowerCase() || 'dev'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      linkedBranch: `feature/${key.toLowerCase()}-${newTitle.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    };

    setIssues((prev) => [newIssue, ...prev]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    setInspectIssue(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(text);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Type and Priority Renderers
  const renderTypeIcon = (type: JiraIssueType) => {
    switch (type) {
      case 'story':
        return (
          <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-2.5 h-2.5" />
          </div>
        );
      case 'bug':
        return (
          <div className="w-3.5 h-3.5 rounded-sm bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Bug className="w-2.5 h-2.5" />
          </div>
        );
      case 'task':
        return (
          <div className="w-3.5 h-3.5 rounded-sm bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-2.5 h-2.5" />
          </div>
        );
      case 'security':
        return (
          <div className="w-3.5 h-3.5 rounded-sm bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-2.5 h-2.5" />
          </div>
        );
    }
  };

  const renderPriorityIcon = (prio: JiraPriority) => {
    switch (prio) {
      case 'highest':
        return (
          <span title="Priority: Highest (Blocker)">
            <ChevronsUp className="w-3.5 h-3.5 text-rose-500" />
          </span>
        );
      case 'high':
        return (
          <span title="Priority: High">
            <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
          </span>
        );
      case 'medium':
        return (
          <span title="Priority: Medium">
            <Equal className="w-3.5 h-3.5 text-amber-400" />
          </span>
        );
      case 'low':
        return (
          <span title="Priority: Low">
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Real Mainline Deliverables Header & Sprint Progress Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <Kanban className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Sprint Board — {currentRepo.name} Deliverables
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  All Real Tasks Completed ({doneCount}/{issues.length})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {sprint.startDate} – {sprint.endDate}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                Analyzed from real mainline Git commits: each task maps directly to verified engineering deliverables, code changes, and security patches.
              </p>
            </div>
          </div>

          {/* Action buttons & View mode toggle */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Deliverables Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToRealCommits}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
              title="Re-analyze issues from real repository commits"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Sprint Progress Bar and Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Mainline Deliverables Shipped</span>
              <span className="text-emerald-400 font-bold">{completionPct}% Done</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-2 rounded-lg">
            <div className="text-emerald-400 font-bold font-mono text-lg">{completedPoints}</div>
            <div className="text-[11px] text-zinc-400 leading-tight">
              <span>Points Delivered</span>
              <span className="block text-zinc-500">of {totalPoints} total</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-2 rounded-lg">
            <div className="text-white font-bold font-mono text-lg">{doneCount}</div>
            <div className="text-[11px] text-zinc-400 leading-tight">
              <span>Finished Tickets</span>
              <span className="block text-zinc-500">merged to mainline</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-2 rounded-lg">
            <div className="text-amber-400 font-bold font-mono text-lg">{sprint.velocity}</div>
            <div className="text-[11px] text-zinc-400 leading-tight">
              <span>Team Velocity</span>
              <span className="block text-zinc-500">story pts / cadence</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 px-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by key, task, or commit SHA..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Types ({issues.length})</option>
            <option value="story">Story</option>
            <option value="bug">Bug</option>
            <option value="task">Task</option>
            <option value="security">Security</option>
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Priorities</option>
            <option value="highest">Highest</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status filter (for table mode) */}
          {viewMode === 'table' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All Columns</option>
              <option value="done">Done</option>
              <option value="in_review">In Review</option>
              <option value="in_progress">In Progress</option>
              <option value="backlog">Backlog</option>
            </select>
          )}
        </div>

        {/* Quick toggles */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setOnlyMyIssues(!onlyMyIssues)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              onlyMyIssues
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Only My Tasks
          </button>
          {(searchQuery || selectedType !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || onlyMyIssues) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedPriority('all');
                setSelectedStatus('all');
                setOnlyMyIssues(false);
              }}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3A. VIEW MODE 1: Kanban Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colIssues = filteredIssues.filter((i) => i.status === col.id);
            const colPoints = colIssues.reduce((acc, i) => acc + i.storyPoints, 0);
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-zinc-950/70 border rounded-xl flex flex-col min-h-[550px] transition-all ${
                  isOver ? 'border-amber-500/80 bg-zinc-900/60 shadow-lg' : col.borderAccent
                }`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {colIssues.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                      {colPoints} pts · {col.description}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 space-y-2.5 overflow-y-auto max-h-[720px]">
                  {colIssues.map((issue) => {
                    const isBeingDragged = draggedIssueId === issue.id;

                    return (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={() => handleDragStart(issue.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setInspectIssue(issue)}
                        className={`bg-black hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 space-y-2 shadow-xs cursor-grab active:cursor-grabbing transition-all ${
                          isBeingDragged ? 'opacity-40 border-dashed border-amber-400' : ''
                        }`}
                      >
                        {/* Top Row: Type, Key, Priority */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {renderTypeIcon(issue.type)}
                            <span className="text-xs font-bold font-mono text-zinc-300 hover:text-amber-400 transition-colors">
                              {issue.key}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {renderPriorityIcon(issue.priority)}
                          </div>
                        </div>

                        {/* Title */}
                        <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                          {issue.title}
                        </p>

                        {/* GitHub Artifact Linkage (Commit SHA, Branch, PR) */}
                        <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-400 flex-wrap">
                          {issue.linkedCommitSha && (
                            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <GitCommit className="w-3 h-3 shrink-0" />
                              <span>{issue.linkedCommitSha}</span>
                            </span>
                          )}
                          {issue.filesTouched && issue.filesTouched.length > 0 && (
                            <span className="text-zinc-500">
                              {issue.filesTouched.length} file{issue.filesTouched.length === 1 ? '' : 's'}
                            </span>
                          )}
                          {issue.additions !== undefined && (
                            <span className="text-emerald-400">+{issue.additions}</span>
                          )}
                        </div>

                        {/* Card Footer: Assignee & Story Points & Quick Move */}
                        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-300 font-bold">
                              {issue.assignee.name.charAt(0)}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[90px]">
                              {issue.assignee.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {issue.storyPoints} pts
                            </span>

                            {/* Quick Column Transition Dropdown */}
                            <select
                              value={issue.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleMoveIssue(issue.id, e.target.value as JiraStatus);
                              }}
                              className="text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded px-1 py-0.5 focus:outline-none"
                              title="Transition issue status"
                            >
                              <option value="backlog">Backlog</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colIssues.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-zinc-600 text-xs font-mono border border-dashed border-zinc-800 rounded-lg">
                      <span>No issues</span>
                      <span className="text-[10px] mt-1 text-zinc-600">Drag or transition tasks here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3B. VIEW MODE 2: Deliverables List / Table View */}
      {viewMode === 'table' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Key</th>
                  <th className="py-2.5 px-3">Summary / Real Commit Deliverable</th>
                  <th className="py-2.5 px-3">Commit SHA</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Points</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setInspectIssue(issue)}
                    className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3">{renderTypeIcon(issue.type)}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{issue.key}</td>
                    <td className="py-2.5 px-3 max-w-md">
                      <span className="text-white font-medium line-clamp-1">{issue.title}</span>
                      {issue.filesTouched && issue.filesTouched.length > 0 && (
                        <span className="text-[11px] text-zinc-500 block truncate">
                          {issue.filesTouched[0].filename}
                          {issue.filesTouched.length > 1 ? ` +${issue.filesTouched.length - 1} more` : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {issue.linkedCommitSha ? (
                        <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {issue.linkedCommitSha}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">{issue.assignee.name}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 capitalize">
                        {renderPriorityIcon(issue.priority)}
                        <span>{issue.priority}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{issue.storyPoints} pts</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          issue.status === 'done'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : issue.status === 'in_review'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : issue.status === 'in_progress'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Issue Detail & Diff Modal */}
      {inspectIssue && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setInspectIssue(null)}
        >
          <div
            className="bg-black border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderTypeIcon(inspectIssue.type)}
                  <span className="text-xs font-mono font-bold text-amber-400">{inspectIssue.key}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-mono text-zinc-400 uppercase">{inspectIssue.type}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    {renderPriorityIcon(inspectIssue.priority)}
                    {inspectIssue.priority.toUpperCase()}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">
                    ✓ Verified Deliverable
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {inspectIssue.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectIssue(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description & Scope */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-mono font-bold text-zinc-400">Deliverable Details &amp; Scope</h4>
              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono whitespace-pre-line">
                {inspectIssue.description}
              </div>
            </div>

            {/* Files Touched & Code Churn */}
            {inspectIssue.filesTouched && inspectIssue.filesTouched.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    Files Modified in Commit ({inspectIssue.filesTouched.length})
                  </h4>
                  <div className="text-xs font-mono">
                    <span className="text-emerald-400 font-bold">+{inspectIssue.additions || 0}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-rose-400 font-bold">-{inspectIssue.deletions || 0}</span>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
                  {inspectIssue.filesTouched.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-black/60 border border-zinc-900">
                      <span className="text-zinc-300 truncate pr-3">{f.filename}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {f.additions > 0 && <span className="text-emerald-400 font-semibold">+{f.additions}</span>}
                        {f.deletions > 0 && <span className="text-rose-400 font-semibold">-{f.deletions}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub Links */}
            {(inspectIssue.linkedBranch || inspectIssue.linkedCommitSha || inspectIssue.linkedPrNumber) && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-mono font-bold text-zinc-400">Linked Git Artifacts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {inspectIssue.linkedBranch && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1 font-mono text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-emerald-400" />
                        Mainline Branch
                      </span>
                      <p className="text-white truncate font-bold">{inspectIssue.linkedBranch}</p>
                    </div>
                  )}

                  {inspectIssue.linkedCommitSha && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1 font-mono text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-amber-400" />
                        Commit SHA
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold">{inspectIssue.linkedCommitSha}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(inspectIssue.linkedCommitSha!)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {copiedSha === inspectIssue.linkedCommitSha ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {inspectIssue.linkedPrNumber && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1 font-mono text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                        <GitPullRequest className="w-3 h-3 text-cyan-400" />
                        PR Status
                      </span>
                      <p className="text-cyan-400 font-bold">#{inspectIssue.linkedPrNumber} Merged</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meta attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Status</span>
                <select
                  value={inspectIssue.status}
                  onChange={(e) => handleMoveIssue(inspectIssue.id, e.target.value as JiraStatus)}
                  className="mt-1 bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 text-xs w-full"
                >
                  <option value="done">Done (Merged)</option>
                  <option value="in_review">In Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Commit Author</span>
                <span className="text-white font-semibold mt-1 block truncate">
                  {inspectIssue.assignee.name}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Complexity</span>
                <span className="text-amber-400 font-bold mt-1 block">
                  {inspectIssue.storyPoints} Story Points
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Committed Date</span>
                <span className="text-zinc-400 mt-1 block">{inspectIssue.createdAt}</span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteIssue(inspectIssue.id)}
                className="flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectIssue(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Issue Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-black border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-sans">Create New Sprint Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Task Title / Summary *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement webhook authentication validator"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description &amp; Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe technical implementation and verification steps..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Issue Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as JiraIssueType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  >
                    <option value="story">Story</option>
                    <option value="bug">Bug</option>
                    <option value="task">Task</option>
                    <option value="security">Security Remediation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as JiraPriority)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  >
                    <option value="highest">Highest (Blocker)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Target Column</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as JiraStatus)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  >
                    <option value="done">Done (Merged)</option>
                    <option value="in_review">In Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="backlog">Backlog</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Story Points (Fibonacci)</label>
                  <select
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  >
                    <option value={1}>1 Point</option>
                    <option value={2}>2 Points</option>
                    <option value={3}>3 Points</option>
                    <option value={5}>5 Points</option>
                    <option value={8}>8 Points</option>
                    <option value={13}>13 Points</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Assignee</label>
                <input
                  type="text"
                  value={newAssigneeName}
                  onChange={(e) => setNewAssigneeName(e.target.value)}
                  placeholder="e.g. Arunodhai V"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
