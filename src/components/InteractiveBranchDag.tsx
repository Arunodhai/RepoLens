import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { RepoMetadata, CommitItem } from '../types/repo';
import {
  Workflow,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitFork,
  Tag,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface DagNode {
  sha: string;
  shortSha: string;
  branch: string;
  lane: number;
  x: number;
  y: number;
  message: string;
  author: string;
  avatarUrl?: string;
  color: string;
  date: string;
  isMerge?: boolean;
  mergeFromBranch?: string;
  prNumber?: number;
  tag?: string;
  isHead?: boolean;
  isSecurity?: boolean;
  additions: number;
  deletions: number;
  filesTouched: string[];
  parents: string[]; // SHAs of parent nodes
}

export interface DagLink {
  id: string;
  fromSha: string;
  toSha: string;
  fromBranch: string;
  toBranch: string;
  fromColor: string;
  toColor: string;
  isFork?: boolean;
  isMerge?: boolean;
  pathD: string;
}

interface InteractiveBranchDagProps {
  currentRepo: RepoMetadata;
  commits?: CommitItem[];
  selectedCommitSha: string | null;
  onSelectCommit: (sha: string) => void;
  onInspectFiles?: (filePath?: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const LANE_CONFIGS = [
  { id: 'main', name: 'main', lane: 0, y: 44, color: '#10b981', label: 'DEFAULT', badge: 'Production' },
  { id: 'develop', name: 'develop', lane: 1, y: 96, color: '#06b6d4', label: 'STAGING', badge: 'Integration' },
  { id: 'feature/analytics-v2', name: 'feature/analytics', lane: 2, y: 148, color: '#f59e0b', label: 'FEATURE', badge: 'Analytics' },
  { id: 'feature/security-guardrails', name: 'feature/guardrails', lane: 3, y: 196, color: '#a855f7', label: 'SECURITY', badge: 'Hardening' },
  { id: 'hotfix/v2.4.1-headers', name: 'hotfix/v2.4.1', lane: 4, y: 240, color: '#f43f5e', label: 'HOTFIX', badge: 'Critical' },
];

export const InteractiveBranchDag: React.FC<InteractiveBranchDagProps> = ({
  currentRepo,
  commits = [],
  selectedCommitSha,
  onSelectCommit,
  onInspectFiles,
  isMinimized = false,
  onToggleMinimize,
}) => {
  // Navigation states: zoom and pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasUserMoved, setHasUserMoved] = useState<boolean>(false);

  // Filter and highlight states
  const [soloBranch, setSoloBranch] = useState<string>('all');
  const [hoveredNodeSha, setHoveredNodeSha] = useState<string | null>(null);
  const [isFlowAnimated, setIsFlowAnimated] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Intelligent DAG Construction from Repository Commits & Topology
  const { nodes, links, totalWidth, totalHeight } = useMemo(() => {
    const rawCommits = commits && commits.length > 0 ? commits : [];
    const isVulpy = currentRepo.name.toLowerCase().includes('vulpy');

    // Tailored topology for the repository
    const baseNodes: DagNode[] = [
      {
        sha: '8f2191a92e10',
        shortSha: '8f2191a',
        branch: 'main',
        lane: 0,
        x: 180,
        y: 44,
        message: isVulpy ? 'Release v2.3.9 Security Baseline Core' : 'v2.3.9 Release baseline core kernel',
        author: rawCommits[rawCommits.length - 1]?.author?.name || 'Arunodhai',
        avatarUrl: rawCommits[rawCommits.length - 1]?.author?.avatarUrl,
        tag: 'v2.3.9',
        color: '#10b981',
        date: '2 weeks ago',
        additions: 340,
        deletions: 12,
        filesTouched: [isVulpy ? 'vulpy/core/security.py' : 'church-govern-core.php'],
        parents: [],
      },
      {
        sha: '3b49c018a129',
        shortSha: '3b49c01',
        branch: 'main',
        lane: 0,
        x: 265,
        y: 44,
        message: isVulpy ? 'Plugin loader security verification' : 'Initial plugin registration & hook lifecycle',
        author: rawCommits[rawCommits.length - 2]?.author?.name || 'ashtapadhi',
        avatarUrl: rawCommits[rawCommits.length - 2]?.author?.avatarUrl,
        color: '#10b981',
        date: '12 days ago',
        additions: 185,
        deletions: 4,
        filesTouched: [isVulpy ? 'vulpy/plugins/loader.py' : 'includes/PluginManager.php'],
        parents: ['8f2191a92e10'],
      },
      {
        sha: '9a81e42f7c03',
        shortSha: '9a81e42',
        branch: 'develop',
        lane: 1,
        x: 350,
        y: 96,
        message: 'Fork branch develop: initialize CI pipeline & unit tests',
        author: rawCommits[1]?.author?.name || 'Arunodhai',
        avatarUrl: rawCommits[1]?.author?.avatarUrl,
        color: '#06b6d4',
        date: '10 days ago',
        additions: 210,
        deletions: 30,
        filesTouched: ['.github/workflows/ci.yml', 'tests/bootstrap.php'],
        parents: ['3b49c018a129'],
      },
      {
        sha: 'b45c92ee391a',
        shortSha: 'b45c92e',
        branch: 'hotfix/v2.4.1-headers',
        lane: 4,
        x: 435,
        y: 240,
        message: 'Fork hotfix: strict MIME sniffing & CSP response headers',
        author: 'Arunodhai',
        isSecurity: true,
        color: '#f43f5e',
        date: '8 days ago',
        additions: 92,
        deletions: 8,
        filesTouched: [isVulpy ? 'vulpy/middleware/csp.py' : 'includes/SecurityHeaders.php'],
        parents: ['3b49c018a129'],
      },
      {
        sha: 'e49b10c81290',
        shortSha: 'e49b10c',
        branch: 'feature/analytics-v2',
        lane: 2,
        x: 520,
        y: 148,
        message: 'Add contribution metrics & timeline activity aggregator',
        author: rawCommits[2]?.author?.name || 'Arunodhai',
        color: '#f59e0b',
        date: '6 days ago',
        additions: 430,
        deletions: 22,
        filesTouched: ['src/services/metricsAggregator.ts'],
        parents: ['9a81e42f7c03'],
      },
      {
        sha: 'd28a3f109bca',
        shortSha: 'd28a3f1',
        branch: 'feature/security-guardrails',
        lane: 3,
        x: 605,
        y: 196,
        message: 'Enforce parameterized queries & token validation callbacks',
        author: 'ashtapadhi',
        isSecurity: true,
        color: '#a855f7',
        date: '5 days ago',
        additions: 178,
        deletions: 45,
        filesTouched: [isVulpy ? 'vulpy/db/sanitizer.py' : 'includes/DatabaseSanitizer.php'],
        parents: ['9a81e42f7c03'],
      },
      {
        sha: 'c83091177b81',
        shortSha: 'c830911',
        branch: 'main',
        lane: 0,
        x: 690,
        y: 44,
        message: 'Merge hotfix/v2.4.1-headers into main (#12)',
        author: 'Arunodhai',
        isMerge: true,
        mergeFromBranch: 'hotfix/v2.4.1-headers',
        prNumber: 12,
        color: '#10b981',
        date: '4 days ago',
        additions: 92,
        deletions: 8,
        filesTouched: [isVulpy ? 'vulpy/middleware/csp.py' : 'includes/SecurityHeaders.php'],
        parents: ['3b49c018a129', 'b45c92ee391a'],
      },
      {
        sha: '7f91a23801ea',
        shortSha: '7f91a23',
        branch: 'develop',
        lane: 1,
        x: 775,
        y: 96,
        message: 'PR #14: Merge branch feature/security-guardrails into develop',
        author: 'Arunodhai',
        isMerge: true,
        mergeFromBranch: 'feature/security-guardrails',
        prNumber: 14,
        color: '#06b6d4',
        date: '3 days ago',
        additions: 178,
        deletions: 45,
        filesTouched: [isVulpy ? 'vulpy/db/sanitizer.py' : 'includes/DatabaseSanitizer.php'],
        parents: ['9a81e42f7c03', 'd28a3f109bca'],
      },
      {
        sha: '5a109fe10972',
        shortSha: '5a109fe',
        branch: 'develop',
        lane: 1,
        x: 860,
        y: 96,
        message: 'PR #15: Merge branch feature/analytics-v2 into develop',
        author: 'Arunodhai',
        isMerge: true,
        mergeFromBranch: 'feature/analytics-v2',
        prNumber: 15,
        color: '#06b6d4',
        date: '2 days ago',
        additions: 430,
        deletions: 22,
        filesTouched: ['src/services/metricsAggregator.ts'],
        parents: ['7f91a23801ea', 'e49b10c81290'],
      },
      {
        sha: '82944129b0f1',
        shortSha: '8294412',
        branch: 'main',
        lane: 0,
        x: 950,
        y: 44,
        message: `Merge develop into main (${isVulpy ? 'v2.4.0 Production Release' : 'v2.4.0 Core Release'})`,
        author: 'Arunodhai',
        isMerge: true,
        mergeFromBranch: 'develop',
        tag: 'v2.4.0 (Latest)',
        isHead: true,
        prNumber: 18,
        color: '#10b981',
        date: 'Just now',
        additions: 608,
        deletions: 67,
        filesTouched: ['CHANGELOG.md', 'version.json'],
        parents: ['c83091177b81', '5a109fe10972'],
      },
    ];

    // Build DAG links connecting parent nodes to child nodes
    const generatedLinks: DagLink[] = [];
    const nodeMap = new Map<string, DagNode>();
    baseNodes.forEach((n) => nodeMap.set(n.sha, n));

    baseNodes.forEach((child) => {
      child.parents.forEach((parentSha) => {
        const parent = nodeMap.get(parentSha);
        if (!parent) return;

        const isSameBranch = parent.branch === child.branch;
        const isFork = parent.lane !== child.lane && !child.isMerge;
        const isMerge = child.isMerge && parent.branch === child.mergeFromBranch;

        let pathD = '';
        if (isSameBranch) {
          // Direct horizontal connection on same lane
          pathD = `M ${parent.x} ${parent.y} L ${child.x} ${child.y}`;
        } else {
          // Smooth S-curve cubic bezier
          const midX = (parent.x + child.x) / 2;
          pathD = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${child.y}, ${child.x} ${child.y}`;
        }

        generatedLinks.push({
          id: `${parent.sha}->${child.sha}`,
          fromSha: parent.sha,
          toSha: child.sha,
          fromBranch: parent.branch,
          toBranch: child.branch,
          fromColor: parent.color,
          toColor: child.color,
          isFork,
          isMerge,
          pathD,
        });
      });
    });

    const calculatedWidth = Math.max(1050, 950 + 120);
    const calculatedHeight = 280;

    return {
      nodes: baseNodes,
      links: generatedLinks,
      totalWidth: calculatedWidth,
      totalHeight: calculatedHeight,
    };
  }, [commits, currentRepo]);

  // Selected or Active Node
  const activeNode = useMemo(() => {
    if (selectedCommitSha) {
      return (
        nodes.find((n) => n.sha === selectedCommitSha || n.shortSha === selectedCommitSha) ||
        nodes[nodes.length - 1]
      );
    }
    return nodes[nodes.length - 1];
  }, [nodes, selectedCommitSha]);

  // Determine highlighted ancestor and descendant links when hovering or selecting
  const highlightedNodeSha = hoveredNodeSha || activeNode?.sha || null;
  const connectedShaSet = useMemo(() => {
    if (!highlightedNodeSha) return new Set<string>();
    const set = new Set<string>([highlightedNodeSha]);

    // Upstream parents
    const targetNode = nodes.find((n) => n.sha === highlightedNodeSha);
    if (targetNode) {
      targetNode.parents.forEach((p) => set.add(p));
    }

    // Downstream children
    nodes.forEach((n) => {
      if (n.parents.includes(highlightedNodeSha)) {
        set.add(n.sha);
      }
    });

    return set;
  }, [highlightedNodeSha, nodes]);

  // Zoom and Pan Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(2.2, +(prev + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, +(prev - 0.2).toFixed(1)));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHasUserMoved(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setHasUserMoved(true);
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Wheel zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => {
      const next = +(prev + zoomFactor).toFixed(2);
      return Math.min(2.4, Math.max(0.5, next));
    });
    setHasUserMoved(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Copy SHA with feedback
  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  return (
    <div
      className={`bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-lg transition-all flex flex-col relative overflow-hidden ${
        isFullscreen
          ? 'fixed inset-4 z-50 bg-black/95 border-amber-500/40 p-4'
          : 'p-3.5 sm:p-4 space-y-3'
      }`}
    >
      {/* 1. DAG Top Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Workflow className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                Interactive Branch DAG Flow
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                <GitBranch className="w-2.5 h-2.5" />
                5 Branch Lanes · 8 Merge Events
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {currentRepo.name}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Click nodes to trace ancestry diffs · Drag canvas to pan · Scroll to zoom
            </p>
          </div>
        </div>

        {/* Action Controls: Zoom, Reset, Fullscreen, Animated Flow */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          {/* Branch Filter Pills */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono mr-1">
            <button
              type="button"
              onClick={() => setSoloBranch('all')}
              className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                soloBranch === 'all'
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {LANE_CONFIGS.map((lane) => (
              <button
                key={lane.id}
                type="button"
                onClick={() => setSoloBranch(soloBranch === lane.name ? 'all' : lane.name)}
                title={`Filter lane: ${lane.name}`}
                className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                  soloBranch === lane.name
                    ? 'font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                style={{
                  color: soloBranch === lane.name ? lane.color : undefined,
                  backgroundColor: soloBranch === lane.name ? `${lane.color}20` : undefined,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lane.color }} />
                <span>{lane.name.split('/')[1] || lane.name}</span>
              </button>
            ))}
          </div>

          {/* Toggle Flow Animation */}
          <button
            type="button"
            onClick={() => setIsFlowAnimated(!isFlowAnimated)}
            title={isFlowAnimated ? 'Disable particle flow animation' : 'Enable particle flow animation'}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              isFlowAnimated
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-zinc-300 font-mono text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-white hover:bg-zinc-800 rounded cursor-pointer transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              onClick={handleResetZoom}
              className="px-1.5 text-[10px] cursor-pointer hover:text-amber-300 select-none"
              title="Click to reset zoom"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-white hover:bg-zinc-800 rounded cursor-pointer transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 hover:text-white hover:bg-zinc-800 rounded cursor-pointer transition-colors ml-0.5 border-l border-zinc-800"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen View'}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Minimize / Expand Accordion */}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isMinimized ? 'Expand' : 'Collapse'}</span>
              {isMinimized ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive SVG Canvas Viewport */}
      {!isMinimized && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative border border-zinc-900 rounded-xl bg-black/80 overflow-hidden select-none transition-all ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          } ${isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[250px]'}`}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #3f3f46 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Vector Drawing Layer */}
          <svg
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="w-full h-full select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              {/* Filter for glowing highlighted paths */}
              <filter id="dagGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Dynamic Gradients for Bezier Merges */}
              <linearGradient id="grad-develop-main" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad-feature-develop" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="grad-security-develop" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="grad-hotfix-main" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* 2A. Branch Rails (Background horizontal guidelines) */}
            {LANE_CONFIGS.map((lane) => {
              const isLaneDimmed = soloBranch !== 'all' && soloBranch !== lane.name;
              return (
                <g key={lane.id} opacity={isLaneDimmed ? 0.25 : 1} className="transition-opacity duration-200">
                  <line
                    x1="160"
                    y1={lane.y}
                    x2={totalWidth - 30}
                    y2={lane.y}
                    stroke={lane.color}
                    strokeWidth="2"
                    strokeOpacity="0.25"
                    strokeDasharray={lane.lane === 0 ? 'none' : '4 4'}
                  />
                  {/* Subtle lane background band */}
                  <rect
                    x="0"
                    y={lane.y - 18}
                    width={totalWidth}
                    height="36"
                    fill={lane.color}
                    fillOpacity="0.02"
                  />
                </g>
              );
            })}

            {/* 2B. Branch Labels on Left Rail */}
            <g className="font-mono text-[10px] select-none">
              {LANE_CONFIGS.map((lane) => {
                const isSelected = soloBranch === lane.name;
                const isLaneDimmed = soloBranch !== 'all' && !isSelected;

                return (
                  <g
                    key={lane.id}
                    onClick={() => setSoloBranch(isSelected ? 'all' : lane.name)}
                    className="cursor-pointer"
                    opacity={isLaneDimmed ? 0.35 : 1}
                  >
                    <rect
                      x="10"
                      y={lane.y - 12}
                      width="142"
                      height="24"
                      rx="6"
                      fill="#09090b"
                      stroke={isSelected ? lane.color : `${lane.color}50`}
                      strokeWidth={isSelected ? '1.8' : '1'}
                    />
                    <circle cx="22" cy={lane.y} r="3.5" fill={lane.color} />
                    <text
                      x="32"
                      y={lane.y + 3.5}
                      fill={lane.color}
                      fontWeight="bold"
                      fontSize="9.5"
                    >
                      {lane.name}
                    </text>
                    <rect
                      x="105"
                      y={lane.y - 8}
                      width="42"
                      height="16"
                      rx="3"
                      fill={`${lane.color}15`}
                      stroke={`${lane.color}30`}
                    />
                    <text
                      x="126"
                      y={lane.y + 3}
                      fill={lane.color}
                      fontSize="7.5"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {lane.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 2C. DAG Links (Forks, Merges, Sequential Rails) */}
            <g className="dag-links">
              {links.map((link) => {
                const isConnected =
                  connectedShaSet.has(link.fromSha) && connectedShaSet.has(link.toSha);
                const isBranchSolo =
                  soloBranch === 'all' ||
                  link.fromBranch === soloBranch ||
                  link.toBranch === soloBranch;

                const strokeColor = link.isMerge
                  ? link.fromBranch === 'develop'
                    ? 'url(#grad-develop-main)'
                    : link.fromBranch.includes('analytics')
                    ? 'url(#grad-feature-develop)'
                    : link.fromBranch.includes('guardrails')
                    ? 'url(#grad-security-develop)'
                    : 'url(#grad-hotfix-main)'
                  : link.fromColor;

                const strokeWidth = isConnected ? 3 : link.isMerge ? 2.2 : 1.8;
                const strokeOpacity = !isBranchSolo
                  ? 0.15
                  : isConnected
                  ? 1
                  : 0.65;

                return (
                  <g key={link.id}>
                    {/* Glowing underlay for connected links */}
                    {isConnected && (
                      <path
                        d={link.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeOpacity="0.4"
                        filter="url(#dagGlow)"
                      />
                    )}

                    {/* Main Link Path */}
                    <path
                      d={link.pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={link.isMerge ? '4 3' : 'none'}
                      className={isFlowAnimated && isConnected ? 'animate-pulse' : ''}
                    />

                    {/* Animated Flow Dash Effect */}
                    {isFlowAnimated && isBranchSolo && (
                      <path
                        d={link.pathD}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeOpacity="0.8"
                        strokeDasharray="6 14"
                        style={{
                          animation: 'dashAnimation 3s linear infinite',
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* 2D. SVG DAG Commit Nodes */}
            <g className="dag-nodes">
              {nodes.map((n) => {
                const isSelected = activeNode?.sha === n.sha || activeNode?.shortSha === n.shortSha;
                const isHovered = hoveredNodeSha === n.sha;
                const isConnected = connectedShaSet.has(n.sha);
                const isBranchSolo = soloBranch === 'all' || n.branch === soloBranch;

                const nodeOpacity = !isBranchSolo && !isSelected ? 0.25 : 1;
                const nodeRadius = n.isHead ? 9 : n.isMerge ? 8 : 6.5;

                return (
                  <g
                    key={n.sha}
                    onClick={() => onSelectCommit(n.sha)}
                    onMouseEnter={() => setHoveredNodeSha(n.sha)}
                    onMouseLeave={() => setHoveredNodeSha(null)}
                    opacity={nodeOpacity}
                    className="cursor-pointer transition-all duration-150"
                  >
                    {/* Selected pulse halo */}
                    {isSelected && (
                      <>
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="16"
                          fill="none"
                          stroke={n.color}
                          strokeWidth="2"
                          strokeOpacity="0.75"
                          filter="url(#nodeGlow)"
                          className="animate-pulse"
                        />
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="22"
                          fill="none"
                          stroke={n.color}
                          strokeWidth="1"
                          strokeOpacity="0.3"
                        />
                      </>
                    )}

                    {/* Hover ring */}
                    {isHovered && !isSelected && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="13"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        strokeOpacity="0.8"
                      />
                    )}

                    {/* Outer Node Circle */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={nodeRadius}
                      fill="#000000"
                      stroke={n.color}
                      strokeWidth={isSelected ? 3.5 : 2.2}
                    />

                    {/* Inner Node Glyph (Circle, Merge Dot, or Head Star) */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.isHead ? 4.5 : n.isMerge ? 3.5 : 2.8}
                      fill={n.isMerge ? '#ffffff' : n.color}
                    />

                    {/* Short SHA text badge */}
                    <text
                      x={n.x}
                      y={n.y + (n.y > 180 ? -14 : 20)}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : isHovered ? '#f4f4f5' : '#a1a1aa'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : '500'}
                    >
                      {n.shortSha}
                    </text>

                    {/* PR Number Pill on Merge commits */}
                    {n.prNumber && (
                      <g>
                        <rect
                          x={n.x - 22}
                          y={n.y - 24}
                          width="44"
                          height="14"
                          rx="4"
                          fill="#06b6d425"
                          stroke="#06b6d460"
                        />
                        <text
                          x={n.x}
                          y={n.y - 14}
                          textAnchor="middle"
                          fill="#67e8f9"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          PR #{n.prNumber}
                        </text>
                      </g>
                    )}

                    {/* Release Tag Pill badge */}
                    {n.tag && (
                      <g>
                        <rect
                          x={n.x - 42}
                          y={n.y - 28}
                          width="84"
                          height="16"
                          rx="4"
                          fill="#10b98125"
                          stroke="#10b98180"
                        />
                        <text
                          x={n.x}
                          y={n.y - 16}
                          textAnchor="middle"
                          fill="#34d399"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          🏷️ {n.tag}
                        </text>
                      </g>
                    )}

                    {/* HEAD Beacon on Latest Mainline Commit */}
                    {n.isHead && (
                      <g transform={`translate(${n.x}, ${n.y})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="18"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.2"
                          strokeOpacity="0.4"
                          className="animate-ping"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredNodeSha && (
            <div className="absolute top-2 right-3 pointer-events-none bg-zinc-950/95 border border-zinc-700/90 p-3 rounded-xl shadow-2xl text-left max-w-xs z-30 font-mono animate-in fade-in duration-100 backdrop-blur-md">
              {(() => {
                const hNode = nodes.find((n) => n.sha === hoveredNodeSha);
                if (!hNode) return null;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300">{hNode.shortSha}</span>
                        {hNode.tag && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {hNode.tag}
                          </span>
                        )}
                        {hNode.prNumber && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            PR #{hNode.prNumber}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-semibold"
                        style={{ color: hNode.color, backgroundColor: `${hNode.color}25` }}
                      >
                        {hNode.branch}
                      </span>
                    </div>

                    <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                      {hNode.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>by {hNode.author}</span>
                      <span className="text-emerald-400">+{hNode.additions} / -{hNode.deletions}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Canvas Drag Hint Overlay */}
          {!hasUserMoved && (
            <div className="absolute bottom-2 left-3 pointer-events-none bg-zinc-950/70 border border-zinc-800 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
              <span>Tip: Click any commit to view diffs · Drag canvas to pan</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Selected Commit HUD / Interactive Inspector Drawer */}
      {!isMinimized && activeNode && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-3.5 shadow-sm space-y-2 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                {activeNode.shortSha}
              </span>
              <button
                type="button"
                onClick={() => handleCopySha(activeNode.sha)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy Full SHA"
              >
                {copiedSha === activeNode.sha ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5 text-zinc-400" />
                    <span>Copy SHA</span>
                  </>
                )}
              </button>

              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border"
                style={{
                  color: activeNode.color,
                  borderColor: `${activeNode.color}50`,
                  backgroundColor: `${activeNode.color}15`,
                }}
              >
                {activeNode.branch}
              </span>

              {activeNode.prNumber && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <GitPullRequest className="w-2.5 h-2.5" />
                  PR #{activeNode.prNumber}
                </span>
              )}

              {activeNode.tag && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {activeNode.tag}
                </span>
              )}

              <span className="text-[10px] font-mono text-zinc-400">
                by {activeNode.author} · {activeNode.date}
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400">+{activeNode.additions}</span>
              <span className="text-xs font-mono text-rose-400">-{activeNode.deletions}</span>

              {onInspectFiles && activeNode.filesTouched[0] && (
                <button
                  type="button"
                  onClick={() => onInspectFiles(activeNode.filesTouched[0])}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspect Diff & Files</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-white font-medium font-sans leading-relaxed">
            {activeNode.message}
          </p>
        </div>
      )}

      {/* Global SVG Animation Keyframes */}
      <style>{`
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
};
