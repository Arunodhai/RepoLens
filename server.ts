import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Parse CLI flags (--port and --host) if passed by development runner
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const cliPort = portIndex !== -1 && args[portIndex + 1] ? Number(args[portIndex + 1]) : null;
const hostIndex = args.indexOf('--host');
const host = (hostIndex !== -1 && args[hostIndex + 1]) || '0.0.0.0';
// Dev server MUST run on port 3000. Never bind to 8080 since nginx already binds 8080 in AI Studio.
const port = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000);

app.use(express.json());

// Fast health-check endpoint for container and readiness probes
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), port });
});

// GitHub proxy endpoint to assist with CORS or token injection if provided
app.get('/api/github/repo', async (req, res) => {
  const { owner, repo } = req.query;
  const token = req.headers.authorization;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Missing owner or repo query parameters' });
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'RepoLens-Intelligence-App',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub API error: ${response.statusText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini-powered repository intelligence summary
app.post('/api/ai-summary', async (req, res) => {
  try {
    const { prompt, repoContext } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'No GEMINI_API_KEY detected. Utilizing client deterministic intelligence engine.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const fullPrompt = `You are RepoLens AI — an elite repository intelligence & software architecture analyst.
Analyze the following repository telemetry metrics, contributor dynamics, hotspots, and milestone velocity:

REPOSITORY CONTEXT:
${JSON.stringify(repoContext, null, 2)}

USER INQUIRY / TASK:
"${prompt}"

GUIDELINES:
1. Provide a direct, incisive, data-grounded response.
2. Cite concrete numbers, contributor handles, hotspot directories, and review metrics from the context.
3. If asked about "productivity", frame it responsibly as "Contribution Activity" and "Code Momentum".
4. Highlight any architectural bottlenecks (e.g. single-contributor hotspot concentration, slow review turnaround).
5. Format with concise headings, bullet points, and key takeaways.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
    });

    res.json({
      success: true,
      text: response.text,
    });
  } catch (err: any) {
    console.error('Gemini error:', err);
    res.status(200).json({
      success: false,
      fallback: true,
      error: err.message,
    });
  }
});

// Mount Vite middleware in development, static in production
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api')) {
      return next();
    }
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (vite.ssrFixStacktrace) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

const server = app.listen(port, host, () => {
  console.log(`RepoLens running on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

