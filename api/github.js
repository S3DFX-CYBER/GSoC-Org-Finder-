// api/github.js — Vercel Edge Function (issue #878)
// Adds rate-limit headers, queue status endpoint, and stale-while-revalidate caching.
export const config = { runtime: 'edge' };

const CACHE      = new Map();
const CACHE_TTL  = 60 * 60 * 1000; // 1h
const CACHE_MAX  = 1000;

function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, value);
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin':   '*',
    'Access-Control-Allow-Methods':  'GET, OPTIONS',
    'Access-Control-Allow-Headers':  'Content-Type',
    'Access-Control-Expose-Headers': 'X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Limit, Retry-After',
    'Content-Type':                  'application/json',
    'Cache-Control':                 'public, max-age=3600, stale-while-revalidate=14400',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const { searchParams } = new URL(req.url);
  const repo        = searchParams.get('repo');
  const user        = searchParams.get('user');
  const gfiMode     = searchParams.get('gfi')    === '1';
  const issuesMode  = searchParams.get('issues') === '1';
  const statusMode  = searchParams.get('status') === '1';

  // ── Queue status: GET /api/github?status=1 ────────────────────────────────
  if (statusMode) {
    const nc    = { ...headers, 'Cache-Control': 'no-store' };
    const token = process.env.GITHUB_TOKEN;
    if (!token) return new Response(JSON.stringify({ ok: false, error: 'No token configured' }), { status: 200, headers: nc });
    try {
      const res = await fetch('https://api.github.com/rate_limit', {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'gsoc-org-finder' },
      });
      if (!res.ok) return new Response(JSON.stringify({ ok: false, error: `GitHub ${res.status}` }), { status: 200, headers: nc });
      const { resources } = await res.json();
      const core = resources?.core, search = resources?.search;
      return new Response(JSON.stringify({
        ok: true,
        core:   { limit: core?.limit,   remaining: core?.remaining,   reset: core?.reset,   resetIn: core   ? Math.max(0, core.reset   * 1000 - Date.now()) : null },
        search: { limit: search?.limit, remaining: search?.remaining, reset: search?.reset },
      }), { status: 200, headers: nc });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 200, headers: nc });
    }
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!repo && !user)                              return new Response(JSON.stringify({ error: 'Missing repo or user parameter' }), { status: 400, headers });
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo))   return new Response(JSON.stringify({ error: 'Invalid repo' }),  { status: 400, headers });
  if (user && !/^[\w.-]+$/.test(user))             return new Response(JSON.stringify({ error: 'Invalid user' }),  { status: 400, headers });

  const token = process.env.GITHUB_TOKEN;

  const ghHeaders = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  if (token) {
    ghHeaders.Authorization = `Bearer ${token}`;
  }

  // Helper to fallback to unauthenticated request if token is invalid (401)
  const fetchWithFallback = async (url, options) => {
    let res = await fetch(url, options);
    if (res.status === 401 && options.headers?.Authorization) {
      // Remove authorization for this retry and all future requests in this invocation
      delete options.headers.Authorization;
      res = await fetch(url, options);
    }
    return res;
  };

  // MODE: ?user=username → return user profile analysis for AI recommender
  if (user) {
    const cacheKey = 'user__' + user;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
    }

    try {
      let page = 1;
      let repos = [];
      while (page <= 3) {
        try {
          const res = await fetchWithFallback(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`, { 
            headers: ghHeaders,
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) {
            if (page === 1) return new Response(JSON.stringify({ error: `GitHub ${res.status}` }), { status: 502, headers });
            break;
          }
          const pageRepos = await res.json();
          repos = repos.concat(pageRepos);
          if (pageRepos.length < 100) break;
          page++;
        } catch (e) {
          // Gracefully break loop on timeout/err for pages 2-3, allowing partial results
          if (page === 1) throw e; 
          break;
        }
      }
      
      let totalStars = 0;
      const languageCounts = {};
      const topicCounts = {};
      let activeDays = 9999;
      
      repos.forEach(r => {
        if (r.fork) return; // Skip forks for skill analysis
        totalStars += r.stargazers_count;
        if (r.language) {
          languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
        }
        if (r.topics) {
          r.topics.forEach(t => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          });
        }
        if (r.pushed_at) {
          const d = new Date(r.pushed_at);
          const days = Math.floor((Date.now() - d) / 86400000);
          if (days < activeDays) activeDays = days;
        }
      });

      const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      
      let activity = 'low';
      if (activeDays < 30) activity = 'high';
      else if (activeDays < 90) activity = 'medium';

      const result = {
        languages,
        topics,
        stars: totalStars,
        activity,
        ts: Date.now()
      };
      
      safeCacheSet(cacheKey, result);
      return new Response(JSON.stringify(result), { status: 200, headers });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }

  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached   = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers });

    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
        { headers: ghHeaders }
      );
      const responseHeaders = addRateLimitHeaders(res, { ...headers });
      if (!res.ok) return new Response(JSON.stringify({ total: 0, items: [], error: `GitHub ${res.status}` }), { status: res.status, headers: responseHeaders });

      const data  = await res.json();
      const total = data.total_count ?? 0;
      const items = (data.items || []).map(i => ({
        title:      i.title,
        html_url:   i.html_url,
        created_at: i.created_at,
        comments:   i.comments,
        labels:     (i.labels || []).map(l => ({ name: l.name, color: l.color })),
      }));
      safeCacheSet(cacheKey, { total, items, ts: Date.now() });
      safeCacheSet(repo + '__gfi', { gfi: total, ts: Date.now() });
      return new Response(JSON.stringify({ total, items }), { status: 200, headers: rh });
   } catch (err) {
      return new Response(JSON.stringify({ total: 0, items: [], error: err.message }), { status: 200, headers: { ...headers } });
    }
  }

  // ── GFI count only
  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached   = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return new Response(JSON.stringify({ gfi: cached.gfi, cached: true }), { status: 200, headers });

    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        { headers: ghHeaders }
      );
      const responseHeaders = addRateLimitHeaders(res, { ...headers });
      if (!res.ok) return new Response(JSON.stringify({ gfi: null, error: `GitHub ${res.status}` }), { status: 200, headers: responseHeaders });

      const data = await res.json();
      const gfi  = data.total_count ?? null;
      if (gfi !== null) safeCacheSet(cacheKey, { gfi, ts: Date.now() });
      return new Response(JSON.stringify({ gfi }), { status: 200, headers: rh });
    } catch (err) {
      return new Response(JSON.stringify({ gfi: null, error: err.message }), { status: 200, headers });
    }
  }

  // ── Standard stats ────────────────────────────────────────────────────────
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });

  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetchWithFallback(`https://api.github.com/repos/${repo}`, { headers: ghHeaders }),
      fetchWithFallback(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: ghHeaders }),
    ]);
    const rh = addRateLimitHeaders(repoRes, { ...headers });

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.message || 'Repo not found' }), { status: repoRes.status, headers: rh });
    }

    const repoData = await repoRes.json();
    let lastCommit = 'Unknown', activityDays = 9999;

    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (commits[0]?.commit?.author?.date) {
        activityDays = Math.floor((Date.now() - new Date(commits[0].commit.author.date)) / 86400000);
        if      (activityDays === 0)   lastCommit = 'Today';
        else if (activityDays === 1)   lastCommit = '1d ago';
        else if (activityDays < 30)    lastCommit = `${activityDays}d ago`;
        else if (activityDays < 365)   lastCommit = `${Math.floor(activityDays / 30)}mo ago`;
        else                           lastCommit = `${Math.floor(activityDays / 365)}y ago`;
      }
    }

    const result = {
      stars:     repoData.stargazers_count,
      forks:     repoData.forks_count,
      issues:    repoData.open_issues_count,
      watchers:  repoData.watchers_count,
      lastCommit,
      activity:  activityDays < 14 ? 'active' : activityDays < 60 ? 'moderate' : 'low',
      language:  repoData.language,
      gfi:       null,
      ts:        Date.now(),
    };

    safeCacheSet(repo, result);
    return new Response(JSON.stringify(result), { status: 200, headers: rh });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + err.message }), { status: 500, headers });
  }
}