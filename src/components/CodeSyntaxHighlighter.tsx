import React, { useMemo } from 'react';
import Prism from '../utils/prismSetup';

interface CodeSyntaxHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  highlightLine?: number;
}

export const CodeSyntaxHighlighter: React.FC<CodeSyntaxHighlighterProps> = ({
  code,
  language,
  showLineNumbers = true,
  highlightLine,
}) => {
  // Normalize language for Prism
  const normalizedLang = useMemo(() => {
    const l = (language || '').toLowerCase().trim();
    if (l === 'py' || l === 'python') return 'python';
    if (l === 'php') return 'php';
    if (l === 'js' || l === 'javascript') return 'javascript';
    if (l === 'ts' || l === 'typescript') return 'typescript';
    if (l === 'jsx') return 'jsx';
    if (l === 'tsx') return 'tsx';
    if (l === 'json') return 'json';
    if (l === 'sh' || l === 'bash' || l === 'shell') return 'bash';
    if (l === 'yml' || l === 'yaml') return 'yaml';
    if (l === 'md' || l === 'markdown') return 'markdown';
    if (l === 'sql') return 'sql';
    if (l === 'css' || l === 'scss') return 'css';
    if (l === 'html' || l === 'htm' || l === 'xml') return 'markup';
    return 'javascript';
  }, [language]);

  // Compute total lines
  const lineCount = useMemo(() => {
    return (code || '').split('\n').length;
  }, [code]);

  // Generate highlighted HTML tokens
  const highlightedHtml = useMemo(() => {
    if (!code) return '';
    try {
      const grammar =
        Prism.languages[normalizedLang] ||
        (Prism.languages as any)[normalizedLang] ||
        Prism.languages.javascript ||
        Prism.languages.clike;

      if (grammar) {
        return Prism.highlight(code, grammar, normalizedLang);
      }
    } catch (e) {
      console.warn('Prism highlighting fallback:', e);
    }
    return fallbackHighlight(code, normalizedLang);
  }, [code, normalizedLang]);

  return (
    <div className="syntax-code font-mono text-xs text-slate-200 select-text overflow-x-auto w-full">
      {/* Scoped CSS to guarantee colors even with CSS isolation / Tailwind purge */}
      <style>{`
        .syntax-code .token.comment,
        .syntax-code .token.prolog,
        .syntax-code .token.doctype,
        .syntax-code .token.cdata {
          color: #71717a !important;
          font-style: italic;
        }
        .syntax-code .token.punctuation {
          color: #a1a1aa !important;
        }
        .syntax-code .token.property,
        .syntax-code .token.tag,
        .syntax-code .token.boolean,
        .syntax-code .token.number,
        .syntax-code .token.constant,
        .syntax-code .token.symbol,
        .syntax-code .token.deleted {
          color: #f59e0b !important;
        }
        .syntax-code .token.selector,
        .syntax-code .token.attr-name,
        .syntax-code .token.string,
        .syntax-code .token.char,
        .syntax-code .token.builtin,
        .syntax-code .token.inserted,
        .syntax-code .token.string-interpolation,
        .syntax-code .token.triple-quoted-string {
          color: #34d399 !important;
        }
        .syntax-code .token.operator,
        .syntax-code .token.entity,
        .syntax-code .token.url,
        .syntax-code .language-css .token.string {
          color: #38bdf8 !important;
        }
        .syntax-code .token.atrule,
        .syntax-code .token.attr-value,
        .syntax-code .token.keyword,
        .syntax-code .token.delimiter {
          color: #f43f5e !important;
          font-weight: 600;
        }
        .syntax-code .token.function,
        .syntax-code .token.function-definition,
        .syntax-code .token.class-name {
          color: #60a5fa !important;
          font-weight: 500;
        }
        .syntax-code .token.regex,
        .syntax-code .token.important,
        .syntax-code .token.variable {
          color: #fb923c !important;
        }
        .syntax-code .token.decorator,
        .syntax-code .token.annotation {
          color: #fbbf24 !important;
          font-weight: 600;
        }
      `}</style>

      <div className="flex min-w-full py-1">
        {/* Line Numbers Column */}
        {showLineNumbers && (
          <div className="select-none text-zinc-600 text-right pr-4 pl-2 border-r border-zinc-800/80 mr-4 shrink-0 font-mono text-[11px] leading-6">
            {Array.from({ length: lineCount }, (_, idx) => {
              const lineNum = idx + 1;
              const isHighlight = highlightLine === lineNum;
              return (
                <div
                  key={lineNum}
                  className={`h-6 flex items-center justify-end ${
                    isHighlight ? 'text-amber-400 font-bold bg-amber-500/20 px-1 rounded' : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Highlighted Code Lines */}
        <div className="flex-1 min-w-0 pr-4">
          <pre className="m-0 p-0 bg-transparent font-mono text-xs leading-6 overflow-visible whitespace-pre">
            <code
              className={`language-${normalizedLang} whitespace-pre`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
};

// Fallback high-contrast syntax tokenizer
function fallbackHighlight(text: string, lang: string): string {
  // First escape HTML entities
  let escaped = escapeHtml(text);

  if (lang === 'python') {
    // Comments
    escaped = escaped.replace(/(#.*$)/gm, '<span class="token comment">$1</span>');
    // Triple quoted strings
    escaped = escaped.replace(/("""[\s\S]*?"""|&#039;&#039;&#039;[\s\S]*?&#039;&#039;&#039;)/g, '<span class="token triple-quoted-string string">$1</span>');
    // Strings
    escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="token string">$1</span>');
    // Decorators
    escaped = escaped.replace(/(@\w+(?:\.\w+)*)/g, '<span class="token decorator">$1</span>');
    // Keywords
    const pyKeywords = /\b(def|class|return|import|from|as|if|elif|else|while|for|in|try|except|finally|with|lambda|yield|raise|pass|break|continue|and|or|not|is|None|True|False)\b/g;
    escaped = escaped.replace(pyKeywords, '<span class="token keyword">$1</span>');
    // Numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');
    // Function calls
    escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="token function">$1</span>');
  } else if (lang === 'php') {
    // Comments
    escaped = escaped.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="token comment">$1</span>');
    // Strings
    escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="token string">$1</span>');
    // Variables
    escaped = escaped.replace(/(\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g, '<span class="token variable">$1</span>');
    // Keywords
    const phpKeywords = /\b(function|class|public|private|protected|static|return|if|else|elseif|foreach|while|new|use|namespace|extends|implements|try|catch|finally|throw|echo|isset|empty|true|false|null)\b/g;
    escaped = escaped.replace(phpKeywords, '<span class="token keyword">$1</span>');
  } else {
    // Generic JS/TS
    escaped = escaped.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="token comment">$1</span>');
    escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="token string">$1</span>');
    const jsKeywords = /\b(const|let|var|function|return|import|export|from|default|class|if|else|for|while|switch|case|break|try|catch|finally|throw|new|async|await|typeof|interface|type)\b/g;
    escaped = escaped.replace(jsKeywords, '<span class="token keyword">$1</span>');
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');
  }

  return escaped;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
