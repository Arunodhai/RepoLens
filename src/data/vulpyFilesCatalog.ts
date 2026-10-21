import { CatalogFileItem } from './repoFilesCatalog';

export const VULPY_REPO_FILES: CatalogFileItem[] = [
  {
    path: 'vulpy.py',
    name: 'vulpy.py',
    directory: 'root',
    subsystem: 'Application Core',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 4120,
    linesCount: 118,
    sastRulesChecked: ['SEC-PY-01', 'SEC-PY-05', 'SEC-PY-12'],
    sastStatus: 'Passed',
    lastCommitSha: '4a89c10',
    author: 'Arunodhai',
    content: `#!/usr/bin/env python3
"""
Vulpy - Vulnerable Python Web Application for Security Training & Auditing
Repository: arunodhai/vulpy
OWASP Top 10 Laboratory Demonstration
"""
from flask import Flask, request, render_template, redirect, url_for, make_response
import os
import sqlite3
import bad_queries
import system
import session
import auth
import render

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-insecure-key-change-in-prod'

@app.route('/')
def index():
    user = session.get_current_user(request)
    return render_template('index.html', user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        token = auth.authenticate_user(username, password)
        if token:
            resp = make_response(redirect(url_for('index')))
            resp.set_cookie('session_token', token, httponly=True)
            return resp
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    results = bad_queries.search_posts(query)
    return render.render_search_results(query, results)

@app.route('/tools/ping', methods=['POST'])
def run_ping():
    host = request.form.get('host', '127.0.0.1')
    output = system.execute_network_diagnostic(host)
    return render_template('tools.html', output=output)

@app.route('/profile/<int:user_id>')
def view_profile(user_id):
    profile = bad_queries.get_user_profile(user_id)
    return render_template('profile.html', profile=profile)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
`,
  },
  {
    path: 'bad_queries.py',
    name: 'bad_queries.py',
    directory: 'root',
    subsystem: 'Database Layer',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 3450,
    linesCount: 88,
    sastRulesChecked: ['CWE-89', 'SEC-PY-SQLI'],
    sastStatus: 'Audit Review',
    lastCommitSha: '7f12e84',
    author: 'Arunodhai',
    content: `"""
Database Query Handler & SQL Injection Remediation Demo
Module: bad_queries.py
"""
import sqlite3
from typing import List, Dict, Any

DB_PATH = 'vulpy.db'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# REMEDIATED: Uses parameterized placeholders rather than string formatting
def search_posts(query: str) -> List[Dict[str, Any]]:
    """
    Search posts table securely using parameterized SQL.
    Prevents CWE-89 SQL Injection attacks.
    """
    conn = get_connection()
    cursor = conn.cursor()
    # Parameterized query protects against payload: ' OR '1'='1 --
    sql = "SELECT id, title, content, author_id, created_at FROM posts WHERE title LIKE ? OR content LIKE ?"
    pattern = f"%{query}%"
    cursor.execute(sql, (pattern, pattern))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_user_profile(user_id: int) -> Dict[str, Any]:
    """
    Fetch user profile by integer ID.
    Enforces integer validation to avoid unescaped injections.
    """
    conn = get_connection()
    cursor = conn.cursor()
    sql = "SELECT id, username, email, role, bio FROM users WHERE id = ?"
    cursor.execute(sql, (int(user_id),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}
`,
  },
  {
    path: 'system.py',
    name: 'system.py',
    directory: 'root',
    subsystem: 'System Utilities',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 2890,
    linesCount: 76,
    sastRulesChecked: ['CWE-78', 'SEC-PY-CMD-INJ'],
    sastStatus: 'Passed',
    lastCommitSha: '9b34c21',
    author: 'Arunodhai',
    content: `"""
System Diagnostics and Command Execution Safety
Module: system.py
"""
import subprocess
import re
import ipaddress

def is_valid_host(host: str) -> bool:
    """Strictly validates IP address or hostname to prevent command injection."""
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    # Validate alphanumeric hostname
    return bool(re.match(r'^[a-zA-Z0-9.-]{1,253}$', host))

def execute_network_diagnostic(host: str) -> str:
    """
    Secure ping executor avoiding shell=True.
    Passing arguments as a list prevents command chaining like: 127.0.0.1; rm -rf /
    """
    if not is_valid_host(host):
        return "Error: Invalid host format specified."

    try:
        # Run ping with count=2, timeout=3 without shell invocation
        result = subprocess.run(
            ['ping', '-c', '2', '-W', '3', host],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5,
            check=False
        )
        return result.stdout or result.stderr
    except subprocess.TimeoutExpired:
        return "Error: Command timed out."
    except Exception as exc:
        return f"Execution error: {str(exc)}"
`,
  },
  {
    path: 'session.py',
    name: 'session.py',
    directory: 'root',
    subsystem: 'Session Management',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 2420,
    linesCount: 68,
    sastRulesChecked: ['CWE-502', 'SEC-PY-DESERIALIZATION'],
    sastStatus: 'Passed',
    lastCommitSha: '2d89a14',
    author: 'Arunodhai',
    content: `"""
Session Serialization and Cookie Management
Module: session.py
"""
import json
import base64
import hmac
import hashlib
import os

SESSION_SECRET = os.environ.get('VULPY_SESSION_SECRET', 'vulpy-secret-token-key-2026')

def serialize_session(user_dict: dict) -> str:
    """
    Serializes session data using JSON with HMAC-SHA256 signature.
    REPLACES pickle.dumps() to eliminate arbitrary remote code execution.
    """
    payload_json = json.dumps(user_dict).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode('utf-8')
    sig = hmac.new(SESSION_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"

def deserialize_session(token: str) -> dict:
    """Safely verifies HMAC and parses JSON payload."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return {}
        payload_b64, signature = parts
        expected_sig = hmac.new(SESSION_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return {}
        raw = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
        return json.loads(raw.decode('utf-8'))
    except Exception:
        return {}

def get_current_user(request) -> dict:
    token = request.cookies.get('session_token')
    if not token:
        return {}
    return deserialize_session(token)
`,
  },
  {
    path: 'auth.py',
    name: 'auth.py',
    directory: 'root',
    subsystem: 'Authentication',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 3100,
    linesCount: 82,
    sastRulesChecked: ['CWE-798', 'CWE-306', 'SEC-PY-JWT'],
    sastStatus: 'Passed',
    lastCommitSha: '8c91b02',
    author: 'Arunodhai',
    content: `"""
Authentication and JWT Signing Engine
Module: auth.py
"""
import time
import os
import hashlib
import sqlite3
from typing import Optional

JWT_SECRET_KEY = os.environ.get('JWT_SECRET', 'k9F#2mQ!z98xP$w190472vLb')

def hash_password(password: str, salt: str) -> str:
    """Hashes password with SHA256 and unique user salt."""
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def authenticate_user(username: str, password: str) -> Optional[str]:
    """Authenticates credentials against SQLite users table."""
    conn = sqlite3.connect('vulpy.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash, salt, role FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    user_id, uname, stored_hash, salt, role = row
    computed_hash = hash_password(password, salt)

    if computed_hash == stored_hash:
        import session
        return session.serialize_session({
            'user_id': user_id,
            'username': uname,
            'role': role,
            'iat': int(time.time()),
        })
    return None
`,
  },
  {
    path: 'render.py',
    name: 'render.py',
    directory: 'root',
    subsystem: 'Templating Engine',
    language: 'python' as any,
    category: 'core',
    sizeBytes: 2150,
    linesCount: 62,
    sastRulesChecked: ['CWE-1336', 'CWE-79', 'SEC-PY-SSTI'],
    sastStatus: 'Passed',
    lastCommitSha: '6e44b91',
    author: 'Arunodhai',
    content: `"""
Safe Template Rendering and XSS Sanitization
Module: render.py
"""
from flask import render_template
import html

def sanitize_user_input(text: str) -> str:
    """Escapes HTML entities to prevent Reflected Cross-Site Scripting (XSS)."""
    return html.escape(text or '')

def render_search_results(query: str, results: list) -> str:
    """
    Renders search template using standard pre-compiled Jinja2 template files.
    Avoids jinja2.Template(user_string) to eliminate Server-Side Template Injection (SSTI).
    """
    sanitized_query = sanitize_user_input(query)
    return render_template('search.html', query=sanitized_query, results=results)
`,
  },
  {
    path: 'templates/index.html',
    name: 'index.html',
    directory: 'templates',
    subsystem: 'Frontend UI',
    language: 'html' as any,
    category: 'templates',
    sizeBytes: 3200,
    linesCount: 94,
    sastRulesChecked: ['SEC-HTML-XSS'],
    sastStatus: 'Passed',
    lastCommitSha: '3d88f12',
    author: 'Arunodhai',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vulpy — Security Testing Lab</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body class="dark-theme">
  <header class="navbar">
    <div class="brand">
      <span class="icon">🛡️</span>
      <strong>Vulpy Intelligence</strong>
    </div>
    <nav>
      <a href="/">Dashboard</a>
      <a href="/search">Vulnerability Search</a>
      <a href="/tools/ping">Network Tool</a>
      {% if user.username %}
        <span class="badge">Logged in: {{ user.username }}</span>
      {% else %}
        <a href="/login" class="btn">Sign In</a>
      {% endif %}
    </nav>
  </header>

  <main class="container">
    <section class="hero">
      <h1>OWASP Top 10 Laboratory Demonstration</h1>
      <p>Interactive security testing platform showcasing vulnerabilities and verified remediations.</p>
    </section>

    <div class="cards-grid">
      <div class="card">
        <h3>SQL Parameterization</h3>
        <p>Prepared queries preventing SQL injection on user input.</p>
      </div>
      <div class="card">
        <h3>Safe Serialization</h3>
        <p>HMAC-signed JSON payloads replacing insecure pickle.</p>
      </div>
      <div class="card">
        <h3>Command Isolation</h3>
        <p>Strict argument list execution preventing shell breakout.</p>
      </div>
    </div>
  </main>
</body>
</html>
`,
  },
  {
    path: 'templates/search.html',
    name: 'search.html',
    directory: 'templates',
    subsystem: 'Frontend UI',
    language: 'html' as any,
    category: 'templates',
    sizeBytes: 1980,
    linesCount: 65,
    sastRulesChecked: ['SEC-HTML-XSS'],
    sastStatus: 'Passed',
    lastCommitSha: '5c21e09',
    author: 'Arunodhai',
    content: `{% extends "index.html" %}
{% block content %}
<div class="search-box">
  <h2>Vulnerability Query Database</h2>
  <form action="/search" method="GET">
    <input type="text" name="q" value="{{ query }}" placeholder="Search CVEs, files, or advisories...">
    <button type="submit">Search</button>
  </form>
</div>

<div class="results">
  {% if results %}
    <p>Found {{ results|length }} entries matching "<strong>{{ query }}</strong>":</p>
    <ul>
      {% for item in results %}
        <li>
          <h4>{{ item.title }}</h4>
          <p>{{ item.content }}</p>
        </li>
      {% endfor %}
    </ul>
  {% else %}
    <p>No results found for your query.</p>
  {% endif %}
</div>
{% endblock %}
`,
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    directory: 'root',
    subsystem: 'Dependencies',
    language: 'yaml' as any,
    category: 'manifest',
    sizeBytes: 680,
    linesCount: 22,
    sastRulesChecked: ['SEC-DEP-AUDIT'],
    sastStatus: 'Passed',
    lastCommitSha: '1a90c42',
    author: 'Arunodhai',
    content: `Flask==3.0.2
Werkzeug==3.0.1
Jinja2==3.1.3
PyJWT==2.8.0
cryptography==42.0.5
requests==2.31.0
sqlite3-api==0.1.1
pytest==8.1.1
bandit==1.7.8
flake8==7.0.0
gunicorn==21.2.0
`,
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    directory: 'root',
    subsystem: 'DevOps & Container',
    language: 'shell' as any,
    category: 'ci',
    sizeBytes: 940,
    linesCount: 32,
    sastRulesChecked: ['SEC-DOCKER-ROOTLESS'],
    sastStatus: 'Passed',
    lastCommitSha: '8f31b20',
    author: 'Arunodhai',
    content: `FROM python:3.11-slim

# Create unprivileged application user
RUN groupadd -r vulpy && useradd -r -g vulpy vulpy

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set permissions
RUN chown -R vulpy:vulpy /app

USER vulpy

EXPOSE 5000

ENV PORT=5000
ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "vulpy:app"]
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    directory: 'root',
    subsystem: 'Documentation',
    language: 'markdown' as any,
    category: 'docs',
    sizeBytes: 2850,
    linesCount: 85,
    sastRulesChecked: ['DOCS-VERIFIED'],
    sastStatus: 'Passed',
    lastCommitSha: '9e41b09',
    author: 'Arunodhai',
    content: `# Vulpy — Vulnerable Python Web Application

An educational security laboratory demonstrating common OWASP Top 10 vulnerabilities in Python web stacks, accompanied by verified secure remediations.

## Modules Covered

- **CWE-89**: SQL Injection & Parameterized Query Defense
- **CWE-78**: OS Command Injection via Subprocess Isolation
- **CWE-502**: Insecure Deserialization & HMAC-Signed Token Migration
- **CWE-1336**: Server-Side Template Injection (SSTI) Defense
- **CWE-798**: Hardcoded Credentials & Secure Secrets Management

## Quickstart

\`\`\`bash
# Clone the repository
git clone https://github.com/arunodhai/vulpy.git
cd vulpy

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Run application
python vulpy.py
\`\`\`

## Security Notice

This codebase is for educational and security training purposes only.
`,
  },
];
