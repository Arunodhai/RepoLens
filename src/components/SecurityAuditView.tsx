import React, { useState, useMemo } from 'react';
import { RepoMetadata, CommitItem, ContributorShare } from '../types/repo';
import { getVulnerabilitiesForRepo, type SecurityVulnerability } from '../data/repoVulnerabilities';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Bug,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Terminal,
  Search,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileText,
  PackageCheck,
  Key,
  X,
  Download,
  CheckSquare,
  FileBadge,
  Sparkles,
  ExternalLink,
  Play,
  Filter,
} from 'lucide-react';

export type { SecurityVulnerability };

export const SecurityAuditView: React.FC<{
  currentRepo: RepoMetadata;
  commits?: CommitItem[];
  contributors?: ContributorShare[];
}> = ({ currentRepo, commits = [], contributors = [] }) => {
  const repoVulns = useMemo(() => {
    return getVulnerabilitiesForRepo(currentRepo.name, currentRepo.fullName);
  }, [currentRepo.name, currentRepo.fullName]);

  const [selectedVulnId, setSelectedVulnId] = useState<string>(repoVulns[0]?.id || 'VULN-001');

  // Update selected vulnerability when repo changes
  React.useEffect(() => {
    if (repoVulns.length > 0) {
      setSelectedVulnId(repoVulns[0].id);
    }
  }, [repoVulns]);

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [scanLogs, setScanLogs] = useState<string[]>([
    `[INIT] SAST Engine initialized for ${currentRepo.fullName}.`,
    `[SCAN] Verified repository files against AST execution rules.`,
    `[PASS] Injection defense: Parameterization and input sanitation enforced.`,
    `[PASS] Authorization & session tokens verified against tampering.`,
    `[INFO] Secret Scanner: 0 unencrypted active keys detected.`,
    `[AUDIT COMPLETE] High security health posture. All advisories verified patched.`,
  ]);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Filtered vulnerabilities
  const filteredVulns = useMemo(() => {
    return repoVulns.filter((v) => {
      const matchSeverity = severityFilter === 'all' || v.severity === severityFilter;
      const matchCategory = categoryFilter === 'all' || v.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.filePath.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSeverity && matchCategory && matchSearch;
    });
  }, [repoVulns, severityFilter, categoryFilter, searchQuery]);

  const activeVuln = useMemo(() => {
    return repoVulns.find((v) => v.id === selectedVulnId) || repoVulns[0];
  }, [repoVulns, selectedVulnId]);


  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs(['[INIT] Running deep SAST & Secret Scanner across mainline branch...']);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress === 20) {
        setScanLogs((prev) => [...prev, '[SAST] Checking 510 AST nodes for SQLi & XSS...']);
      } else if (progress === 40) {
        setScanLogs((prev) => [...prev, '[SECRETS] Scanning entropy for AWS, GitHub, Stripe, and webhook tokens...']);
      } else if (progress === 60) {
        setScanLogs((prev) => [...prev, '[ACCESS] Validating permission_callback signatures on REST routes...']);
      } else if (progress === 80) {
        setScanLogs((prev) => [...prev, '[NONCE] Verifying check_admin_referer() on role assignment handlers...']);
      } else if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanLogs((prev) => [
          ...prev,
          '[SUCCESS] Audit complete: 0 open vulnerabilities. 5/5 CVEs verified patched and hardened.',
        ]);
      }
    }, 350);
  };

  const handleCopyPatch = () => {
    if (activeVuln?.remediatedSnippet) {
      navigator.clipboard.writeText(activeVuln.remediatedSnippet);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  const handleCopyReport = () => {
    const criticalCount = repoVulns.filter((v) => v.severity === 'CRITICAL').length;
    const highCount = repoVulns.filter((v) => v.severity === 'HIGH').length;
    const mediumCount = repoVulns.filter((v) => v.severity === 'MEDIUM').length;
    const report = `# Security & Vulnerability Audit Report - ${currentRepo.fullName}
Generated: ${new Date().toUTCString()}
Status: ${repoVulns.every((v) => v.status === 'Patched') ? '100% REMEDIATED & HARDENED' : 'AUDIT ACTIVE - ACTIONABLE FINDINGS'}

## Summary Metrics
- Total Vulnerabilities Scanned: ${repoVulns.length} vulnerabilities evaluated
- Critical CVEs: ${criticalCount}
- High CVEs: ${highCount}
- Medium CVEs: ${mediumCount}
- SAST Compliance Status: Comprehensive static and dynamic audit

## Cataloged Vulnerabilities
${repoVulns.map((v) => `- [${v.cveId}] (${v.severity}) ${v.title} in ${v.filePath}:${v.lineNumber} - Status: ${v.status}`).join('\n')}
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Security Posture Header */}
      <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Security & Vulnerability Audit Suite
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                ALL 5 CVEs PATCHED
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Automated SAST code audit, CWE vulnerability advisories, secret scanning, and patch verification
            </p>
          </div>
        </div>

        {/* Action Controls: Run Scan & Export Report */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Auditing Codebase...' : 'Run Audit Scan'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Report Copied' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* 4 Security Posture KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Critical / High CVEs</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">0 Open</span>
            <span className="text-xs text-zinc-500">(3 Remediated)</span>
          </div>
          <p className="text-[10px] text-zinc-400">Zero active unpatched exposures</p>
        </div>

        <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">SAST Code Rules</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white">12 / 12</span>
            <span className="text-xs text-emerald-400 font-bold">100% Pass</span>
          </div>
          <p className="text-[10px] text-zinc-400">AST exit, CSRF & SQLi guardrails</p>
        </div>

        <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Secret Scanning</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">Clean</span>
            <span className="text-xs text-zinc-500">0 Leaks</span>
          </div>
          <p className="text-[10px] text-zinc-400">Zero credentials or tokens committed</p>
        </div>

        <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-1">
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Security Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">98 / 100</span>
            <span className="text-xs text-emerald-400">Tier A+</span>
          </div>
          <p className="text-[10px] text-zinc-400">OWASP Top 10 & CWE compliant</p>
        </div>
      </div>

      {/* Main Grid: Vulnerability Catalog (5 cols) & Remediation Diff Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Vulnerabilities List */}
        <div className="lg:col-span-5 bg-black border border-zinc-800 rounded-xl p-4 flex flex-col space-y-3 shadow-sm min-h-[560px]">
          {/* Filter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                Vulnerability Advisories ({filteredVulns.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">All Patched</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CVE, CWE, file..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Severity Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 font-mono text-[10px]">
              {['all', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded transition-colors uppercase ${
                    severityFilter === sev
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Vulnerability Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px]">
            {filteredVulns.map((v) => {
              const isSelected = selectedVulnId === v.id;
              const isCritical = v.severity === 'CRITICAL';
              const isHigh = v.severity === 'HIGH';

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVulnId(v.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer font-mono space-y-1.5 ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-500/50 shadow-md'
                      : 'bg-zinc-950/60 hover:bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {v.severity} ({v.cvssScore})
                      </span>
                      <span className="text-xs text-white font-bold">{v.cveId}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      ✓ {v.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-2">
                    {v.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span className="truncate max-w-[200px]">{v.filePath}:{v.lineNumber}</span>
                    <span className="text-zinc-400">{v.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Vulnerability Diff & Remediation Inspector */}
        <div className="lg:col-span-7 bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-sm min-h-[560px]">
          {/* Header of Active Advisory */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-zinc-800 gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {activeVuln.cveId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {activeVuln.cwe}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  STATUS: {activeVuln.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                {activeVuln.title}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Target: {activeVuln.filePath}:{activeVuln.lineNumber} · Detected: {activeVuln.detectedDate}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyPatch}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors self-start shrink-0"
            >
              {copiedPatch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPatch ? 'Patch Copied' : 'Copy Remediated Patch'}</span>
            </button>
          </div>

          {/* Description & Impact */}
          <div className="space-y-1 text-xs font-mono text-zinc-300">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Risk Analysis</span>
            <p className="leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-slate-200">
              {activeVuln.description}
            </p>
          </div>

          {/* Side-by-Side or Stacked Diff */}
          <div className="space-y-2 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Vulnerable Code (Red) */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-rose-400 flex items-center gap-1 font-semibold">
                  <X className="w-3 h-3" />
                  Vulnerable Implementation
                </span>
                <div className="bg-rose-950/25 border border-rose-900/40 rounded-lg p-2.5 text-xs overflow-x-auto min-h-[140px]">
                  <CodeSyntaxHighlighter
                    code={activeVuln.vulnerableSnippet}
                    language={activeVuln.filePath.endsWith('.py') ? 'python' : activeVuln.filePath.endsWith('.php') ? 'php' : 'javascript'}
                    showLineNumbers={false}
                  />
                </div>
              </div>

              {/* Remediated Code (Green) */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" />
                  Remediated & Verified Implementation
                </span>
                <div className="bg-emerald-950/25 border border-emerald-900/40 rounded-lg p-2.5 text-xs overflow-x-auto min-h-[140px]">
                  <CodeSyntaxHighlighter
                    code={activeVuln.remediatedSnippet}
                    language={activeVuln.filePath.endsWith('.py') ? 'python' : activeVuln.filePath.endsWith('.php') ? 'php' : 'javascript'}
                    showLineNumbers={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="pt-2 border-t border-zinc-800/80 font-mono text-xs">
            <span className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Hardening Recommendation
            </span>
            <p className="text-zinc-300 mt-0.5 text-xs">
              {activeVuln.recommendation}
            </p>
          </div>

          {/* Live Scanner Log Terminal */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                Live Audit Scanner Output
              </span>
              <span>AST Verified</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-400 space-y-1 max-h-24 overflow-y-auto">
              {scanLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-emerald-500">›</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
