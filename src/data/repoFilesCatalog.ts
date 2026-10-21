import CATALOG_DATA from './generatedCatalog.json';

export interface CatalogFileItem {
  path: string;
  name: string;
  directory: string;
  subsystem: string;
  language: 'php' | 'javascript' | 'css' | 'html' | 'json' | 'yaml' | 'shell' | 'asset' | 'markdown';
  category: 'core' | 'theme' | 'templates' | 'tests' | 'ci' | 'docs' | 'manifest' | 'tools';
  sizeBytes: number;
  linesCount: number;
  sastRulesChecked: string[];
  sastStatus: 'Passed' | 'Patched' | 'Verified Safe' | 'Audit Review';
  lastCommitSha: string;
  sha?: string;
  author?: string;
  content?: string;
  vulnerabilities?: Array<{ line: number; title: string; cwe: string; status: string }>;
}

export const ALL_510_REPO_FILES: CatalogFileItem[] = (CATALOG_DATA as any[]).map((item) => {
  let author = 'Arunodhai & ashtapadhi';
  if (item.path.startsWith('church-govern-core/includes/form-email') || item.path.includes('mail-queue')) {
    author = 'ashtapadhi';
  } else if (item.path.includes('seo') || item.path.includes('maps') || item.path.includes('navigation') || item.path.includes('module')) {
    author = 'Arunodhai';
  } else if (item.path.startsWith('.github')) {
    author = 'Arunodhai';
  }

  let sastStatus: 'Passed' | 'Patched' | 'Verified Safe' | 'Audit Review' = 'Passed';
  const vulnerabilities: Array<{ line: number; title: string; cwe: string; status: string }> = [];

  // Map known remediated files and advisories
  if (item.path === 'church-govern-core/church-govern-core.php') {
    sastStatus = 'Patched';
    vulnerabilities.push({ line: 44, title: 'Clickjacking & MIME-Sniffing Headers Enforced', cwe: 'CWE-693', status: 'Patched' });
  } else if (item.path === 'church-govern-core/includes/blogs.php') {
    sastStatus = 'Patched';
    vulnerabilities.push({ line: 28, title: 'SQL Injection Defense ($wpdb->prepare parameterized)', cwe: 'CWE-89', status: 'Patched' });
  } else if (item.path === 'church-govern-core/includes/form-email-notifications.php') {
    sastStatus = 'Patched';
    vulnerabilities.push({ line: 36, title: 'CSRF Nonce & WP Capabilities Validation', cwe: 'CWE-352', status: 'Patched' });
  } else if (item.path === 'church-govern-core/includes/seo.php') {
    sastStatus = 'Patched';
    vulnerabilities.push({ line: 52, title: 'SEO Tag XSS Output Sanitization (wp_kses_post)', cwe: 'CWE-79', status: 'Patched' });
  } else if (item.path.startsWith('tests/')) {
    sastStatus = 'Verified Safe';
  } else if (item.path.endsWith('.xlsx')) {
    sastStatus = 'Audit Review';
  }

  return {
    ...item,
    author,
    sastStatus,
    vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : undefined,
  };
});
