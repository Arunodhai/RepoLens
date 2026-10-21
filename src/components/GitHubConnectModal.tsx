import React, { useState } from 'react';
import { getStoredGitHubToken, saveGitHubToken, clearGitHubToken, parseGitHubRepoInput } from '../services/githubApi';
import { Key, Github, Check, AlertCircle, Trash2, X, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';

interface GitHubConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoCustomSearch?: (owner: string, repo: string, token?: string) => void;
}

export const GitHubConnectModal: React.FC<GitHubConnectModalProps> = ({
  isOpen,
  onClose,
  onRepoCustomSearch,
}) => {
  const [tokenInput, setTokenInput] = useState(getStoredGitHubToken() || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customRepoInput, setCustomRepoInput] = useState('');
  const [repoError, setRepoError] = useState('');

  if (!isOpen) return null;

  const handleSaveToken = () => {
    saveGitHubToken(tokenInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearToken = () => {
    clearGitHubToken();
    setTokenInput('');
  };

  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGitHubRepoInput(customRepoInput);
    if (!parsed) {
      setRepoError('Please enter a valid repo link or owner/repo (e.g. https://github.com/facebook/react or vercel/next.js)');
      return;
    }
    setRepoError('');

    // If token provided, save it
    if (tokenInput.trim()) {
      saveGitHubToken(tokenInput.trim());
    }

    if (onRepoCustomSearch) {
      onRepoCustomSearch(parsed.owner, parsed.repo, tokenInput.trim() || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-black border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-200 relative space-y-5"
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

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              GitHub Connection & Repository Triage
            </h2>
            <p className="text-xs text-zinc-400">
              Personal Access Token and custom repository inspection
            </p>
          </div>
        </div>

        {/* Unified Load Any Public or Private Repo with PAT */}
        <form onSubmit={handleUnifiedSubmit} className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-emerald-400" />
                Repository Link or Path
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">Public or Private</span>
            </div>
            
            <input
              type="text"
              value={customRepoInput}
              onChange={(e) => setCustomRepoInput(e.target.value)}
              placeholder="https://github.com/owner/repo or owner/repo (e.g. facebook/react)"
              className="w-full bg-black border border-zinc-800 text-white text-xs px-3.5 py-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500/50"
              autoFocus
            />

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-500 font-mono">Try:</span>
              {[
                'facebook/react',
                'vercel/next.js',
                'tailwindlabs/tailwindcss',
                'torvalds/linux',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setCustomRepoInput(sample)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            {repoError && (
              <p className="text-red-400 text-[11px] font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {repoError}
              </p>
            )}
          </div>

          {/* PAT Configuration */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                Get a PAT <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Required for private repositories. Optional for public repositories (unlocks 5,000 GitHub API req/hr). Stored securely in your browser's local session.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (optional for public)"
                className="w-full bg-black border border-zinc-800 text-white text-xs px-3.5 py-2 rounded-lg font-mono focus:outline-none focus:border-amber-500/50"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {tokenInput && (
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="text-zinc-400 hover:text-red-400 text-xs flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-red-500/30 transition-colors"
                      title="Clear stored token"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Token</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {tokenInput ? '✓ Token will be used for private & public APIs' : '60 req/hr public rate limit'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 max-w-[240px] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Analyze & View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
