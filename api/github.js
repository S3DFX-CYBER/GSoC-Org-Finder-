// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };
const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response(JSON.stringify({ error: 'Invalid repo' }), { status: 400, headers });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'No token' }), { status: 500, headers });
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  // MODE: ?gfi=1&issues=1 → return actual issue items
  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetch(
        `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
        { headers: ghHeaders }
      );
      if (!res.ok) {
        return new Response(JSON.stringify({ total: 0, items: [], error: `GitHub ${res.status}` }), { status: 200, headers });
      }
      const data = await res.json();
      const total = data.total_count ?? 0;
      const items = (data.items || []).map(i => ({
        title: i.title,
        html_url: i.html_url,
        created_at: i.created_at,
        comments: i.comments,
        labels: (i.labels || []).map(l => ({ name: l.name, color: l.color })),
      }));
      CACHE.set(cacheKey, { total, items, ts: Date.now() });
      CACHE.set(repo + '__gfi', { gfi: total, ts: Date.now() });
      return new Response(JSON.stringify({ total, items }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ total: 0, items: [], error: err.message }), { status: 200, headers });
    }
  }

  // MODE: ?gfi=1 → return count only
  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ gfi: cached.gfi }), { status: 200, headers });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetch(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        { headers: ghHeaders }
      );
      if (!res.ok) {
        return new Response(JSON.stringify({ gfi: null, error: `GitHub ${res.status}` }), { status: 200, headers });
      }
      const data = await res.json();
      const gfi = data.total_count ?? null;
      if (gfi !== null) CACHE.set(cacheKey, { gfi, ts: Date.now() });
      return new Response(JSON.stringify({ gfi }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ gfi: null, error: err.message }), { status: 200, headers });
    }
  }

  // MODE: standard stats — NO GFI fetch here (avoids search API rate limits)
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
  }

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
      gfi: null,  // fetched separately via ?gfi=1 to avoid rate limiting
      ts: Date.now(),
    };

    CACHE.set(repo, result);
    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + err.message }), { status: 500, headers });
  }
}
