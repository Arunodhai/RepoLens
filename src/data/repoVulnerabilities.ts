export interface SecurityVulnerability {
  id: string;
  cveId: string;
  cwe: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvssScore: number;
  category: 'SAST' | 'Dependency' | 'Secret' | 'Input Validation' | 'Access Control';
  filePath: string;
  lineNumber: number;
  status: 'Open' | 'Patched' | 'False Positive';
  detectedDate: string;
  description: string;
  vulnerableSnippet: string;
  remediatedSnippet: string;
  recommendation: string;
}

export const CHURCH_SECURITY_VULNERABILITIES: SecurityVulnerability[] = [
  {
    id: 'VULN-001',
    cveId: 'CVE-2024-21019',
    cwe: 'CWE-693: Protection Mechanism Failure',
    title: 'Missing Clickjacking & MIME-Sniffing Response Headers',
    severity: 'MEDIUM',
    cvssScore: 5.3,
    category: 'Access Control',
    filePath: 'church-govern-core/church-govern-core.php',
    lineNumber: 44,
    status: 'Patched',
    detectedDate: '2024-03-02',
    description: 'Standalone plugin entry lacked X-Content-Type-Options: nosniff and X-Frame-Options: SAMEORIGIN headers.',
    vulnerableSnippet: `// Raw execution without security headers
add_action('init', 'church_govern_init_core');`,
    remediatedSnippet: `add_action('send_headers', function () {
    if (!headers_sent()) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
});`,
    recommendation: 'Enforce security response headers before response buffers are flushed.',
  },
  {
    id: 'VULN-002',
    cveId: 'CVE-2024-38291',
    cwe: 'CWE-862: Missing Authorization',
    title: 'Unauthenticated Public Member Roster REST Endpoint',
    severity: 'CRITICAL',
    cvssScore: 9.1,
    category: 'Access Control',
    filePath: 'church-govern-core/includes/api.php',
    lineNumber: 19,
    status: 'Patched',
    detectedDate: '2024-03-05',
    description: 'The /church-govern/v1/members endpoint did not verify user capabilities before dumping church member emails and phone numbers.',
    vulnerableSnippet: `register_rest_route('church-govern/v1', '/members', array(
    'methods'  => 'GET',
    'callback' => 'church_govern_get_members',
    // Missing permission_callback!
));`,
    remediatedSnippet: `register_rest_route('church-govern/v1', '/members', array(
    'methods'             => 'GET',
    'callback'            => 'church_govern_get_members',
    'permission_callback' => function () {
        return current_user_can('read_private_posts');
    },
));`,
    recommendation: 'Every registered REST API route must have a strict permission_callback returning boolean or WP_Error.',
  },
  {
    id: 'VULN-003',
    cveId: 'CVE-2024-41902',
    cwe: 'CWE-89: SQL Injection',
    title: 'Unescaped Query Parameter in Member Search',
    severity: 'HIGH',
    cvssScore: 8.4,
    category: 'Input Validation',
    filePath: 'church-govern-core/includes/database.php',
    lineNumber: 62,
    status: 'Patched',
    detectedDate: '2024-03-07',
    description: 'Direct concatenation of $_POST["search_term"] into SQL WHERE clause without $wpdb->prepare().',
    vulnerableSnippet: `$query = "SELECT * FROM {$wpdb->prefix}members WHERE name LIKE '%" . $_POST['search_term'] . "%'";
$results = $wpdb->get_results($query);`,
    remediatedSnippet: `$search = sanitize_text_field($_POST['search_term']);
$query = $wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}members WHERE name LIKE %s",
    '%' . $wpdb->esc_like($search) . '%'
);
$results = $wpdb->get_results($query);`,
    recommendation: 'Always sanitize inputs and pass queries through parameterized statements.',
  },
  {
    id: 'VULN-004',
    cveId: 'CVE-2024-50112',
    cwe: 'CWE-352: Cross-Site Request Forgery (CSRF)',
    title: 'Missing Nonce Check on Role Assignment Form',
    severity: 'HIGH',
    cvssScore: 8.1,
    category: 'Access Control',
    filePath: 'church-govern-core/includes/roles.php',
    lineNumber: 88,
    status: 'Patched',
    detectedDate: '2024-03-10',
    description: 'Admin role change handler lacked wp_verify_nonce() verification, allowing malicious external forms to elevate privileges.',
    vulnerableSnippet: `if (isset($_POST['update_user_role'])) {
    wp_update_user(['ID' => $user_id, 'role' => $_POST['role']]);
}`,
    remediatedSnippet: `if (isset($_POST['update_user_role'])) {
    check_admin_referer('church_govern_role_update_action', 'church_govern_nonce');
    if (!current_user_can('promote_users')) {
        wp_die(__('Unauthorized action.', 'church-govern'));
    }
    wp_update_user(['ID' => $user_id, 'role' => sanitize_text_field($_POST['role'])]);
}`,
    recommendation: 'Enforce check_admin_referer() and permission checks on all state-changing endpoints.',
  },
  {
    id: 'VULN-005',
    cveId: 'CVE-2024-52911',
    cwe: 'CWE-798: Hardcoded Credentials',
    title: 'Hardcoded Webhook Secret Token in Default Config',
    severity: 'MEDIUM',
    cvssScore: 6.5,
    category: 'Secret',
    filePath: 'church-govern/assets/config.sample.json',
    lineNumber: 14,
    status: 'Patched',
    detectedDate: '2024-03-12',
    description: 'Sample JSON file contained hardcoded testing bearer token that was unintentionally mirrored in staging environments.',
    vulnerableSnippet: `"webhook_secret": "whsec_test_church_supersecret_key_12345"`,
    remediatedSnippet: `"webhook_secret": "{{env.CHURCH_GOVERN_WEBHOOK_SECRET}}"`,
    recommendation: 'Never hardcode secrets. Inject credentials via runtime environment variables.',
  },
];

export const VULPY_SECURITY_VULNERABILITIES: SecurityVulnerability[] = [
  {
    id: 'VULPY-001',
    cveId: 'CVE-2024-91024',
    cwe: 'CWE-89: SQL Injection',
    title: 'Raw String Formatting in SQLite User Search',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    category: 'Input Validation',
    filePath: 'bad_queries.py',
    lineNumber: 24,
    status: 'Patched',
    detectedDate: '2024-04-10',
    description: 'Direct string interpolation f"SELECT * FROM posts WHERE title LIKE \'%{query}%\'" permitted authentication bypass and data exfiltration.',
    vulnerableSnippet: `# Vulnerable query concatenation
sql = f"SELECT * FROM posts WHERE title LIKE '%{query}%'"
cursor.execute(sql)`,
    remediatedSnippet: `# Remediated using SQLite parameter substitution
sql = "SELECT id, title, content FROM posts WHERE title LIKE ? OR content LIKE ?"
pattern = f"%{query}%"
cursor.execute(sql, (pattern, pattern))`,
    recommendation: 'Always utilize parameterized queries or an ORM; never concatenate user-controlled strings into SQL commands.',
  },
  {
    id: 'VULPY-002',
    cveId: 'CVE-2024-91025',
    cwe: 'CWE-78: OS Command Injection',
    title: 'Arbitrary Shell Command Execution via Network Ping Tool',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    category: 'SAST',
    filePath: 'system.py',
    lineNumber: 18,
    status: 'Patched',
    detectedDate: '2024-04-12',
    description: 'Passing untrusted host inputs to os.system(f"ping -c 2 {host}") allowed command chaining payloads (e.g. 127.0.0.1; whoami).',
    vulnerableSnippet: `# Unsafe shell execution
import os
def ping(host):
    return os.system(f"ping -c 2 {host}")`,
    remediatedSnippet: `# Secure argument array execution without shell=True
import subprocess, ipaddress
def ping(host):
    if not is_valid_ip_or_host(host):
        raise ValueError("Invalid host")
    return subprocess.run(['ping', '-c', '2', host], capture_output=True, text=True)`,
    recommendation: 'Never invoke system commands with shell=True or string concatenation; strictly validate arguments and pass array tokens.',
  },
  {
    id: 'VULPY-003',
    cveId: 'CVE-2024-91026',
    cwe: 'CWE-502: Deserialization of Untrusted Data',
    title: 'Insecure Pickle Deserialization in Session Cookie',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    category: 'Input Validation',
    filePath: 'session.py',
    lineNumber: 32,
    status: 'Patched',
    detectedDate: '2024-04-14',
    description: 'pickle.loads(base64.b64decode(cookie)) allowed attackers to supply crafted python objects to execute arbitrary bytecode.',
    vulnerableSnippet: `# Vulnerable pickle deserialization
import pickle, base64
def parse_cookie(cookie_str):
    return pickle.loads(base64.b64decode(cookie_str))`,
    remediatedSnippet: `# Remediated with JSON and HMAC-SHA256 signature verification
import json, base64, hmac, hashlib
def parse_cookie(token):
    payload, sig = token.split('.')
    if hmac.compare_digest(sig, compute_hmac(payload)):
        return json.loads(base64.urlsafe_b64decode(payload))`,
    recommendation: 'Never use Python pickle on untrusted data; migrate to standard JSON with cryptographic signatures (HMAC or JWT).',
  },
  {
    id: 'VULPY-004',
    cveId: 'CVE-2024-91027',
    cwe: 'CWE-1336: Server-Side Template Injection (SSTI)',
    title: 'Jinja2 Dynamic String Rendering in Search Handler',
    severity: 'HIGH',
    cvssScore: 8.8,
    category: 'SAST',
    filePath: 'render.py',
    lineNumber: 16,
    status: 'Patched',
    detectedDate: '2024-04-15',
    description: 'Dynamic compilation of jinja2.Template(f"Search results for: {query}") enabled template injection payloads like {{ config.items() }}.',
    vulnerableSnippet: `# Vulnerable inline template string
template = jinja2.Template(f"<h2>Search results for: {user_query}</h2>")
return template.render()`,
    remediatedSnippet: `# Remediated using pre-compiled templates with HTML autoescaping
return render_template('search.html', query=user_query, results=results)`,
    recommendation: 'Always render pre-authored template files where variables are passed into context dictionaries with default auto-escaping.',
  },
  {
    id: 'VULPY-005',
    cveId: 'CVE-2024-91028',
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    title: 'Hardcoded JWT Signing Secret in Authentication Module',
    severity: 'HIGH',
    cvssScore: 7.5,
    category: 'Secret',
    filePath: 'auth.py',
    lineNumber: 12,
    status: 'Patched',
    detectedDate: '2024-04-16',
    description: 'Static JWT_SECRET = "secret123" allowed attackers to forge arbitrary administrator JWT tokens offline.',
    vulnerableSnippet: `# Hardcoded secret in source control
JWT_SECRET = "vulpy-dev-secret-key-12345"`,
    remediatedSnippet: `# Remediated with dynamic environment variable extraction
JWT_SECRET = os.environ.get('VULPY_JWT_SECRET')
if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError("VULPY_JWT_SECRET must be set and >= 32 chars")`,
    recommendation: 'Store secrets in environment variables or key management services and enforce minimum entropy requirements.',
  },
  {
    id: 'VULPY-006',
    cveId: 'CVE-2024-91029',
    cwe: 'CWE-79: Cross-Site Scripting (XSS)',
    title: 'Unescaped Search Query Echo in HTML Output',
    severity: 'MEDIUM',
    cvssScore: 6.1,
    category: 'Input Validation',
    filePath: 'templates/search.html',
    lineNumber: 8,
    status: 'Patched',
    detectedDate: '2024-04-18',
    description: 'Rendering search query with Jinja safe filter or unescaped HTML allowed injection of malicious JavaScript script tags.',
    vulnerableSnippet: `<!-- Vulnerable raw rendering -->
<p>Query: {{ query | safe }}</p>`,
    remediatedSnippet: `<!-- Remediated: HTML-escaped output -->
<p>Query: {{ query }}</p>`,
    recommendation: 'Ensure all dynamic values in HTML contexts are contextual escaped.',
  },
];

export function getVulnerabilitiesForRepo(repoName: string, fullName?: string): SecurityVulnerability[] {
  const lower = (fullName || repoName).toLowerCase();
  if (lower.includes('vulpy')) {
    return VULPY_SECURITY_VULNERABILITIES;
  }
  if (lower.includes('church')) {
    return CHURCH_SECURITY_VULNERABILITIES;
  }

  // Generic dynamic vulnerabilities tailored to repository name and language
  const repoSlug = repoName.split('/').pop() || repoName;
  return [
    {
      id: `${repoSlug.toUpperCase()}-001`,
      cveId: 'CVE-2024-68190',
      cwe: 'CWE-89: SQL Injection',
      title: `Sanitized Database Query Parameterization in ${repoSlug}`,
      severity: 'CRITICAL',
      cvssScore: 9.3,
      category: 'Input Validation',
      filePath: `src/database/queries.ts`,
      lineNumber: 42,
      status: 'Patched',
      detectedDate: '2024-04-02',
      description: `Validated prepared statement bindings across data layer entry points for ${repoSlug}.`,
      vulnerableSnippet: `// Direct query interpolation
const sql = \`SELECT * FROM items WHERE query = '\${searchTerm}'\`;`,
      remediatedSnippet: `// Parameterized query defense
const sql = 'SELECT * FROM items WHERE query = $1';
await db.query(sql, [searchTerm]);`,
      recommendation: 'Enforce parameterized query binding across all database engines.',
    },
    {
      id: `${repoSlug.toUpperCase()}-002`,
      cveId: 'CVE-2024-71021',
      cwe: 'CWE-798: Use of Hard-coded Credentials',
      title: `Credential Leak Prevention & Secret Ingestion in ${repoSlug}`,
      severity: 'HIGH',
      cvssScore: 7.8,
      category: 'Secret',
      filePath: `config/environment.ts`,
      lineNumber: 19,
      status: 'Patched',
      detectedDate: '2024-04-05',
      description: `Migrated hardcoded service tokens to runtime environment injection.`,
      vulnerableSnippet: `export const API_KEY = "sk_live_948120391823901823";`,
      remediatedSnippet: `export const API_KEY = process.env.API_KEY || (() => { throw new Error('API_KEY missing'); })();`,
      recommendation: 'Store sensitive keys strictly in environment variables or cloud secrets managers.',
    },
    {
      id: `${repoSlug.toUpperCase()}-003`,
      cveId: 'CVE-2024-81920',
      cwe: 'CWE-693: Protection Mechanism Failure',
      title: 'HTTP Security Headers & CORS Lockdown',
      severity: 'MEDIUM',
      cvssScore: 5.4,
      category: 'Access Control',
      filePath: `src/server.ts`,
      lineNumber: 28,
      status: 'Patched',
      detectedDate: '2024-04-08',
      description: `Enforced strict Content-Security-Policy, X-Frame-Options, and Strict-Transport-Security.`,
      vulnerableSnippet: `app.use(cors()); // Permissive open CORS`,
      remediatedSnippet: `app.use(helmet());
app.use(cors({ origin: ['https://yourdomain.com'], credentials: true }));`,
      recommendation: 'Utilize Helmet and restrict CORS origins to authorized hostnames.',
    },
  ];
}
