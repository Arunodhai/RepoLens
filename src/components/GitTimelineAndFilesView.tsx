import React, { useState, useMemo, useEffect } from 'react';
import { RepoMetadata, CommitItem, ContributorShare } from '../types/repo';
import { ALL_510_REPO_FILES } from '../data/repoFilesCatalog';
import { VULPY_REPO_FILES } from '../data/vulpyFilesCatalog';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import { InteractiveBranchDag } from './InteractiveBranchDag';
import {
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  FileCode2,
  Folder,
  FolderOpen,
  Search,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Terminal,
  Code2,
  Calendar,
  User,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Tag,
  Zap,
  Workflow,
} from 'lucide-react';

export interface FileRecord {
  path: string;
  name: string;
  directory: string;
  subsystem: string;
  language: 'php' | 'javascript' | 'css' | 'html' | 'json' | 'yaml' | 'markdown' | 'asset' | 'shell';
  category: 'core' | 'theme' | 'templates' | 'tests' | 'ci' | 'docs' | 'manifest' | 'tools';
  author: string;
  sizeBytes: number;
  linesCount: number;
  lastCommitSha: string;
  content: string;
}

// Complete repository files map
const CORE_REPO_FILES: Record<string, Partial<FileRecord>> = {
  'church-govern-core/church-govern-core.php': {
    path: 'church-govern-core/church-govern-core.php',
    name: 'church-govern-core.php',
    directory: 'church-govern-core',
    subsystem: 'Core Kernel',
    language: 'php',
    category: 'core',
    author: 'ashtapadhi & Arunodhai',
    sizeBytes: 3120,
    linesCount: 84,
    lastCommitSha: '8294412',
    content: `<?php
/**
 * Plugin Name: Church Govern Core
 * Plugin URI: https://github.com/ashtapadhi/church-govern-cms
 * Description: Core kernel for church governance, access control, and notification pipelines.
 * Version: 2.4.0
 * Author: Arunodhai & ashtapadhi
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define core constants
define('CHURCH_GOVERN_CORE_VERSION', '2.4.0');
define('CHURCH_GOVERN_CORE_PATH', plugin_dir_path(__FILE__));
define('CHURCH_GOVERN_CORE_URL', plugin_dir_url(__FILE__));

// Secure HTTP response headers
add_action('send_headers', function () {
    if (!headers_sent()) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
});

require_once CHURCH_GOVERN_CORE_PATH . 'includes/roles.php';
require_once CHURCH_GOVERN_CORE_PATH . 'includes/post-types.php';
require_once CHURCH_GOVERN_CORE_PATH . 'includes/api.php';
`,
  },
  'church-govern-core/includes/api.php': {
    path: 'church-govern-core/includes/api.php',
    name: 'api.php',
    directory: 'church-govern-core/includes',
    subsystem: 'REST Engine',
    language: 'php',
    category: 'core',
    author: 'Arunodhai',
    sizeBytes: 4280,
    linesCount: 112,
    lastCommitSha: 'b6e3f89',
    content: `<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('church-govern/v1', '/members', array(
        'methods'             => 'GET',
        'callback'            => 'church_govern_get_members',
        'permission_callback' => function () {
            return current_user_can('read_private_posts');
        },
    ));
});
`,
  },
};

// Branch graph metadata definition
export interface GitBranchNode {
  id: string;
  name: string;
  color: string;
  lane: number;
  isDefault?: boolean;
  status: 'active' | 'merged' | 'stale';
  lastCommitSha: string;
  lastUpdated: string;
  behindMain: number;
  aheadMain: number;
}

export interface GitCommitNode {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  avatarUrl: string;
  date: string;
  displayDate: string;
  branch: string;
  lane: number;
  parents: string[];
  isMerge?: boolean;
  mergeFromBranch?: string;
  tag?: string;
  additions: number;
  deletions: number;
  filesTouched: string[];
}

export const GitTimelineAndFilesView: React.FC<{
  currentRepo: RepoMetadata;
  commits?: CommitItem[];
  contributors?: ContributorShare[];
}> = ({ currentRepo, commits = [], contributors = [] }) => {
  const [viewTab, setViewTab] = useState<'topology' | 'tree'>('topology');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [timelineSearch, setTimelineSearch] = useState<string>('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [showSvgDag, setShowSvgDag] = useState<boolean>(true);

  // File tree states
  const [selectedFileKey, setSelectedFileKey] = useState<string>('church-govern-core/church-govern-core.php');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'church-govern-core': true,
    'church-govern-core/includes': true,
    'church-govern': true,
    'templates': true,
    'tests': true,
    'docs': true,
    '.github': true,
  });

  // Branch Topology Definitions
  const branches: GitBranchNode[] = useMemo(() => [
    {
      id: 'main',
      name: 'main',
      color: '#10b981', // emerald
      lane: 0,
      isDefault: true,
      status: 'active',
      lastCommitSha: '8294412',
      lastUpdated: 'Just now',
      behindMain: 0,
      aheadMain: 0,
    },
    {
      id: 'develop',
      name: 'develop',
      color: '#06b6d4', // cyan
      lane: 1,
      status: 'active',
      lastCommitSha: '7f91a23',
      lastUpdated: '2 hours ago',
      behindMain: 0,
      aheadMain: 4,
    },
    {
      id: 'feature/analytics-v2',
      name: 'feature/analytics-v2',
      color: '#f59e0b', // amber
      lane: 2,
      status: 'active',
      lastCommitSha: 'e49b10c',
      lastUpdated: '1 day ago',
      behindMain: 2,
      aheadMain: 6,
    },
    {
      id: 'feature/security-guardrails',
      name: 'feature/security-guardrails',
      color: '#a855f7', // purple
      lane: 3,
      status: 'merged',
      lastCommitSha: 'd28a3f1',
      lastUpdated: '3 days ago',
      behindMain: 0,
      aheadMain: 0,
    },
    {
      id: 'hotfix/v2.4.1-headers',
      name: 'hotfix/v2.4.1-headers',
      color: '#f43f5e', // rose
      lane: 4,
      status: 'merged',
      lastCommitSha: 'b45c92e',
      lastUpdated: '4 days ago',
      behindMain: 0,
      aheadMain: 0,
    },
  ], []);

  // Construct visual chronological Git commits graph
  const gitNodes: GitCommitNode[] = useMemo(() => {
    const rawCommits = commits && commits.length > 0 ? commits : [];
    
    // Fallback commits if dataset is smaller
    const baseCommits = rawCommits.map((c, idx) => {
      let branch = 'main';
      let lane = 0;
      let isMerge = false;
      let mergeFromBranch: string | undefined = undefined;
      let tag: string | undefined = undefined;

      if (idx === 0) {
        tag = 'v2.4.0 (Latest)';
        branch = 'main';
        lane = 0;
      } else if (idx === 1) {
        isMerge = true;
        branch = 'main';
        mergeFromBranch = 'feature/analytics-v2';
        lane = 0;
      } else if (idx === 2 || idx === 3) {
        branch = 'develop';
        lane = 1;
      } else if (idx === 4 || idx === 5) {
        branch = 'feature/analytics-v2';
        lane = 2;
      } else if (idx === 6) {
        isMerge = true;
        branch = 'develop';
        mergeFromBranch = 'feature/security-guardrails';
        lane = 1;
      } else if (idx === 7 || idx === 8) {
        branch = 'feature/security-guardrails';
        lane = 3;
      } else if (idx === 9) {
        tag = 'v2.3.9';
        branch = 'main';
        lane = 0;
      } else if (idx % 4 === 1) {
        branch = 'develop';
        lane = 1;
      } else if (idx % 4 === 2) {
        branch = 'feature/analytics-v2';
        lane = 2;
      } else if (idx % 7 === 0) {
        branch = 'hotfix/v2.4.1-headers';
        lane = 4;
      }

      return {
        sha: c.sha || `sha${idx}`,
        shortSha: c.shortSha || (c.sha ? c.sha.slice(0, 7) : `82944${idx}`),
        message: c.message || 'Mainline commit update',
        author: c.author?.name || 'Arunodhai',
        avatarUrl: c.author?.avatarUrl || 'https://avatars.githubusercontent.com/u/60264218?v=4',
        date: c.date,
        displayDate: c.displayDate || 'Recent',
        branch,
        lane,
        parents: [],
        isMerge,
        mergeFromBranch,
        tag,
        additions: c.stats?.additions || 28,
        deletions: c.stats?.deletions || 4,
        filesTouched: c.filesTouched ? c.filesTouched.map((f) => f.filename) : ['church-govern-core/church-govern-core.php'],
      };
    });

    return baseCommits;
  }, [commits]);

  // Filtered git commits
  const filteredNodes = useMemo(() => {
    return gitNodes.filter((node) => {
      const matchBranch = selectedBranch === 'all' || node.branch === selectedBranch;
      const matchSearch =
        !timelineSearch ||
        node.message.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        node.shortSha.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        node.author.toLowerCase().includes(timelineSearch.toLowerCase());
      return matchBranch && matchSearch;
    });
  }, [gitNodes, selectedBranch, timelineSearch]);

  const activeCommit = useMemo(() => {
    if (!selectedCommitSha) return filteredNodes[0] || null;
    return filteredNodes.find((n) => n.sha === selectedCommitSha || n.shortSha === selectedCommitSha) || filteredNodes[0];
  }, [filteredNodes, selectedCommitSha]);

  // Full files map based on active repository
  const fullFilesMap = useMemo(() => {
    const isVulpy =
      currentRepo.name.toLowerCase().includes('vulpy') ||
      (currentRepo.fullName && currentRepo.fullName.toLowerCase().includes('vulpy'));
    const isChurch =
      currentRepo.id === 'church-govern-cms' || currentRepo.name === 'church-govern-cms';

    const sourceFiles = isVulpy
      ? VULPY_REPO_FILES
      : isChurch
      ? ALL_510_REPO_FILES
      : ALL_510_REPO_FILES;

    const map: Record<string, FileRecord> = {};
    sourceFiles.forEach((f) => {
      map[f.path] = {
        path: f.path,
        name: f.name,
        directory: f.directory,
        subsystem: f.subsystem,
        language: f.language,
        category: f.category,
        author: f.author || 'Arunodhai',
        sizeBytes: f.sizeBytes,
        linesCount: f.linesCount,
        lastCommitSha: f.lastCommitSha,
        content:
          (f as any).content ||
          CORE_REPO_FILES[f.path]?.content ||
          `# ${f.name} - Module of ${f.subsystem}\n# Author: ${f.author || 'Arunodhai'}\n# Lines: ${f.linesCount}\n\ndef ${f.name.replace(/[^a-zA-Z0-9]/g, '_')}():\n    """Module routine for ${currentRepo.name}."""\n    return "Module initialized"\n`,
      };
    });
    return map;
  }, [currentRepo]);

  // Sync selected file and folder expansions when repository switches
  useEffect(() => {
    const isVulpy =
      currentRepo.name.toLowerCase().includes('vulpy') ||
      (currentRepo.fullName && currentRepo.fullName.toLowerCase().includes('vulpy'));
    const isChurch =
      currentRepo.id === 'church-govern-cms' || currentRepo.name === 'church-govern-cms';

    const defaultKey = isVulpy
      ? 'vulpy.py'
      : isChurch
      ? 'church-govern-core/church-govern-core.php'
      : Object.keys(fullFilesMap)[0] || 'vulpy.py';

    setSelectedFileKey(defaultKey);

    // Expand all directories for this repo so the file tree is immediately accessible
    const dirs: Record<string, boolean> = {
      'church-govern-core': true,
      'church-govern-core/includes': true,
      'church-govern': true,
      'templates': true,
      'tests': true,
      'docs': true,
      '.github': true,
      'lib': true,
      'scripts': true,
      'src': true,
      'bad': true,
      'good': true,
    };
    Object.values(fullFilesMap).forEach((f) => {
      if (f.directory) {
        dirs[f.directory] = true;
      }
    });
    setExpandedFolders(dirs);
  }, [currentRepo.id, currentRepo.name, fullFilesMap]);

  const currentFile = fullFilesMap[selectedFileKey] || Object.values(fullFilesMap)[0];

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleCopyCode = () => {
    if (currentFile?.content) {
      navigator.clipboard.writeText(currentFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  // Grouped directory folders for Tree
  const folderTree = useMemo(() => {
    const folders: Record<string, FileRecord[]> = {};
    Object.values(fullFilesMap).forEach((f) => {
      const dir = f.directory || 'root';
      if (!folders[dir]) folders[dir] = [];
      folders[dir].push(f);
    });
    return folders;
  }, [fullFilesMap]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Git Timeline & Topology HUD */}
      <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Git Timeline & Branch Topology
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
                  5 Branches Tracked
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Visual commit DAG, divergence lanes, pull request merges, and repository code structure
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Topology Graph vs Code Tree */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-lg">
          <button
            type="button"
            onClick={() => setViewTab('topology')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              viewTab === 'topology'
                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-amber-400" />
            <span>Branch Topology & Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              viewTab === 'tree'
                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Code Files Explorer ({Object.keys(fullFilesMap).length})</span>
          </button>
        </div>
      </div>

      {/* Tab View 1: Cool Git Timeline & Branch Topology Diagram */}
      {viewTab === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Visual Git Timeline Diagram (8 cols) */}
          <div className="lg:col-span-8 bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-sm min-h-[620px]">
            {/* Top Toolbar: Branch Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedBranch('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all whitespace-nowrap ${
                    selectedBranch === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60'
                  }`}
                >
                  All Branches ({branches.length})
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all whitespace-nowrap ${
                      selectedBranch === b.name
                        ? 'font-bold border'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60'
                    }`}
                    style={{
                      borderColor: selectedBranch === b.name ? b.color : undefined,
                      color: selectedBranch === b.name ? b.color : undefined,
                      backgroundColor: selectedBranch === b.name ? `${b.color}18` : undefined,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span>{b.name}</span>
                    {b.isDefault && <span className="text-[9px] text-zinc-500">HEAD</span>}
                  </button>
                ))}
              </div>

              {/* Search commits */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  placeholder="Filter commits / author..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Interactive Vector Branch Topology DAG (Live Cool Diagram) */}
            <InteractiveBranchDag
              currentRepo={currentRepo}
              commits={commits}
              selectedCommitSha={selectedCommitSha}
              onSelectCommit={(sha) => setSelectedCommitSha(sha)}
              onInspectFiles={(filePath) => {
                if (filePath) {
                  setSelectedFileKey(filePath);
                  setViewTab('tree');
                }
              }}
              isMinimized={!showSvgDag}
              onToggleMinimize={() => setShowSvgDag(!showSvgDag)}
            />

            {/* Visual Branch Lanes Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-mono text-zinc-400 px-3 py-1.5 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
              <div className="col-span-3 sm:col-span-2">Commit / Branch</div>
              <div className="col-span-6 sm:col-span-7">Message & Topology</div>
              <div className="col-span-3 text-right">Author & Date</div>
            </div>

            {/* Chronological Git Graph Nodes List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
              {filteredNodes.map((node, idx) => {
                const branchObj = branches.find((b) => b.name === node.branch) || branches[0];
                const isSelected = activeCommit?.sha === node.sha;

                return (
                  <div
                    key={node.sha + idx}
                    onClick={() => setSelectedCommitSha(node.sha)}
                    className={`grid grid-cols-12 gap-2 p-3 rounded-lg border transition-all cursor-pointer relative items-center ${
                      isSelected
                        ? 'bg-zinc-900/90 border-amber-500/50 shadow-md'
                        : 'bg-zinc-950/50 hover:bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Left: Commit SHA & Branch Tag */}
                    <div className="col-span-3 sm:col-span-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySha(node.shortSha);
                          }}
                          title="Click to copy SHA"
                        >
                          {copiedSha === node.shortSha ? 'COPIED' : node.shortSha}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded w-fit border truncate"
                        style={{
                          color: branchObj.color,
                          borderColor: `${branchObj.color}40`,
                          backgroundColor: `${branchObj.color}10`,
                        }}
                      >
                        {node.branch}
                      </span>
                    </div>

                    {/* Center: Graph Node + Commit Message */}
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                      {/* Visual SVG Branch Node */}
                      <div className="relative flex items-center justify-center shrink-0 w-8 h-8">
                        {/* Vertical line through node */}
                        <div
                          className="absolute w-0.5 h-full -top-1/2 bottom-0"
                          style={{ backgroundColor: `${branchObj.color}50` }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-transform hover:scale-125"
                          style={{
                            borderColor: branchObj.color,
                            backgroundColor: isSelected ? branchObj.color : '#000000',
                          }}
                        >
                          {node.isMerge && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* Message and Labels */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-medium text-white truncate max-w-[320px] sm:max-w-[420px]">
                            {node.message}
                          </p>
                          {node.tag && (
                            <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <Tag className="w-2.5 h-2.5" />
                              {node.tag}
                            </span>
                          )}
                          {node.isMerge && (
                            <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              <GitPullRequest className="w-2.5 h-2.5" />
                              Merged {node.mergeFromBranch}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <span className="text-emerald-400">+{node.additions}</span>
                          <span className="text-rose-400">-{node.deletions}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="truncate">{node.filesTouched[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Author & Timestamp */}
                    <div className="col-span-3 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={node.avatarUrl}
                          alt={node.author}
                          className="w-4 h-4 rounded-full border border-zinc-700 object-cover"
                        />
                        <span className="text-xs text-slate-300 font-mono truncate max-w-[80px]">
                          {node.author}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{node.displayDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Inspector Drawer (4 cols): Selected Commit & Branch Topology Stats */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Commit Inspector */}
            <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-amber-400" />
                  Commit Details
                </span>
                {activeCommit && (
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {activeCommit.shortSha}
                  </span>
                )}
              </div>

              {activeCommit ? (
                <div className="space-y-3 font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Message</span>
                    <p className="text-xs text-white font-medium mt-0.5 leading-relaxed">
                      {activeCommit.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500">Branch</span>
                      <p className="text-xs text-emerald-400 font-bold mt-0.5 truncate">
                        {activeCommit.branch}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500">Author</span>
                      <p className="text-xs text-white font-medium mt-0.5 truncate">
                        {activeCommit.author}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <span className="text-[10px] text-zinc-500">Diff Stats</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400">+{activeCommit.additions} additions</span>
                      <span className="text-rose-400">-{activeCommit.deletions} deletions</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Touched Files</span>
                    <div className="mt-1.5 space-y-1">
                      {activeCommit.filesTouched.map((f, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            if (fullFilesMap[f]) {
                              setSelectedFileKey(f);
                              setViewTab('tree');
                            }
                          }}
                          className="flex items-center justify-between p-2 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <span className="truncate pr-2">{f}</span>
                          <span className="text-[10px] text-zinc-500">inspect →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-mono">Select any commit to inspect</p>
              )}
            </div>

            {/* Branch Health & Topology Stats Card */}
            <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 font-mono">
              <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Active Branch Lanes
              </span>
              <div className="space-y-2">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-white font-medium">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      {b.aheadMain > 0 && <span className="text-amber-400">+{b.aheadMain} ahead</span>}
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab View 2: Clean Code Files Explorer & Syntax Viewer (Zero Security Warnings) */}
      {viewTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* File Directory Tree (4 cols) */}
          <div className="lg:col-span-4 bg-black border border-zinc-800 rounded-xl p-4 flex flex-col space-y-3 shadow-sm min-h-[580px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-400" />
                Repository Tree
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {Object.keys(fullFilesMap).length} files
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search file path..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Tree List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[500px]">
              {Object.entries(folderTree).map(([dirName, files]) => {
                const isExpanded = expandedFolders[dirName] !== false;
                const filteredFiles = files.filter((f) =>
                  !searchFilter || f.path.toLowerCase().includes(searchFilter.toLowerCase())
                );
                if (filteredFiles.length === 0) return null;

                return (
                  <div key={dirName} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleFolder(dirName)}
                      className="w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400/80" />
                        <span className="font-semibold text-white truncate">{dirName}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{filteredFiles.length}</span>
                    </button>

                    {isExpanded && (
                      <div className="pl-4 space-y-0.5 border-l border-zinc-800/80 ml-2.5">
                        {filteredFiles.map((file) => {
                          const isSelected = selectedFileKey === file.path;
                          return (
                            <button
                              key={file.path}
                              type="button"
                              onClick={() => setSelectedFileKey(file.path)}
                              className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs font-mono transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                                <span className="truncate">{file.name}</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                                {file.linesCount}L
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Syntax Code Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-black border border-zinc-800 rounded-xl p-4 flex flex-col space-y-3 shadow-sm min-h-[580px]">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2 truncate">
                <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold font-mono text-white truncate">
                  {currentFile.path}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {currentFile.language.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition-colors"
                >
                  {showLineNumbers ? 'Hide Line #' : 'Show Line #'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1 text-[11px] font-mono rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Body with Syntax Highlighting */}
            <div className="flex-1 overflow-x-auto overflow-y-auto bg-zinc-950 rounded-lg p-3 border border-zinc-800 max-h-[500px]">
              <CodeSyntaxHighlighter
                code={currentFile.content}
                language={currentFile.language}
                showLineNumbers={showLineNumbers}
              />
            </div>

            {/* Footer details */}
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80">
              <div className="flex items-center gap-3">
                <span>Lines: <strong className="text-white">{currentFile.linesCount}</strong></span>
                <span>Size: <strong className="text-white">{Math.round(currentFile.sizeBytes / 1024 * 10) / 10} KB</strong></span>
                <span>Author: <strong className="text-white">{currentFile.author}</strong></span>
              </div>
              <div>
                <span>Last Commit: <strong className="text-amber-400">{currentFile.lastCommitSha}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
