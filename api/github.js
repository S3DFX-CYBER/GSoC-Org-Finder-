// api/github.js — Vercel Serverless Function
// GitHub API proxy — token lives here, never exposed to users

export const config = { runtime: 'edge' };

const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req) {
  // CORS headers — allow your Vercel domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo'); // e.g. "django/django"

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response(JSON.stringify({ error: 'Invalid repo' }), { status: 400, headers });
  }

  // Check cache
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'GitHub token not configured' }), { status: 500, headers });
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: ghHeaders }),
    ]);

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.message || 'Repo not found' }), { status: repoRes.status, headers });
    }

    const repoData = await repoRes.json();

    // Parse last commit date
    let lastCommit = '—';
    let activityDays = 9999;
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (commits[0]?.commit?.author?.date) {
        const d = new Date(commits[0].commit.author.date);
        activityDays = Math.floor((Date.now() - d) / 86400000);
        if (activityDays === 0) lastCommit = 'Today';
        else if (activityDays === 1) lastCommit = '1d ago';
        else if (activityDays < 30) lastCommit = `${activityDays}d ago`;
        else if (activityDays < 365) lastCommit = `${Math.floor(activityDays / 30)}mo ago`;
        else lastCommit = `${Math.floor(activityDays / 365)}y ago`;
      }
    }

    const activity = activityDays < 14 ? 'active' : activityDays < 60 ? 'moderate' : 'low';

    const result = {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      issues: repoData.open_issues_count,
      watchers: repoData.watchers_count,
      lastCommit,
      activity,
      language: repoData.language,
      ts: Date.now(),
    };

    CACHE.set(repo, result);

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + err.message }), { status: 500, headers });
  }
}
