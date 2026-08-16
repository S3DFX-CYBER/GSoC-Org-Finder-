// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };

const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 1000;

export function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

function getStale(key) {
  return CACHE.get(key) ?? null;
}

// 429 is always a rate limit.
// 403 is a rate limit only when x-ratelimit-remaining is exactly '0';
// any other 403 is an auth or permission error and should not be treated as
// rate limiting (the client uses this distinction to avoid masking auth issues).
export function isRateLimited(res) {
  if (res.status === 429) return true;
  if (res.status === 403) {
    return res.headers.get('x-ratelimit-remaining') === '0';
  }
  return false;
}

export function staleResponse(data, headers) {
  const { ts, ...payload } = data;
  const staleSeconds = Math.round((Date.now() - ts) / 1000);
  return new Response(
    JSON.stringify({ ...payload, cached: true, rateLimit: true, staleSeconds }),
    { status: 200, headers }
  );
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const user = searchParams.get('user');
  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';

  if (!repo && !user) {
    return new Response(JSON.stringify({ error: 'Missing repo or user parameter' }), { status: 400, headers });
  }
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return new Response(JSON.stringify({ error: 'Invalid repo' }), { status: 400, headers });
  }
  if (user && !/^[\w.-]+$/.test(user)) {
    return new Response(JSON.stringify({ error: 'Invalid user' }), { status: 400, headers });
  }

  const token = process.env.GITHUB_TOKEN;
  const ghHeaders = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };
  if (token) ghHeaders.Authorization = `Bearer ${token}`;

  const fetchWithFallback = async (url, options) => {
    let res = await fetch(url, options);
    if (res.status === 401 && options.headers?.Authorization) {
      const retryOptions = { ...options, headers: { ...options.headers } };
      delete retryOptions.headers.Authorization;
      res = await fetch(url, retryOptions);
    }
    return res;
  };

  //?user=username 
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
          const res = await fetchWithFallback(
            `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`,
            { headers: ghHeaders, signal: AbortSignal.timeout(5000) }
          );
          if (isRateLimited(res)) {
            const stale = getStale(cacheKey);
            if (stale) return staleResponse(stale, headers);
            return new Response(
              JSON.stringify({ error: 'GitHub API rate limit reached. Please try again later.' }),
              { status: 429, headers }
            );
          }
          if (!res.ok) {
            if (page === 1) return new Response(JSON.stringify({ error: `GitHub ${res.status}` }), { status: 502, headers });
            break;
          }
          const pageRepos = await res.json();
          repos = repos.concat(pageRepos);
          if (pageRepos.length < 100) break;
          page++;
        } catch (e) {
          if (page === 1) throw e;
          break;
        }
      }

      let totalStars = 0;
      const languageCounts = {};
      const topicCounts = {};
      let activeDays = 9999;

      repos.forEach(r => {
        if (r.fork) return;
        totalStars += r.stargazers_count;
        if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
        if (r.topics) r.topics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
        if (r.pushed_at) {
          const days = Math.floor((Date.now() - new Date(r.pushed_at)) / 86400000);
          if (days < activeDays) activeDays = days;
        }
      });

      const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const activity = activeDays < 30 ? 'high' : activeDays < 90 ? 'medium' : 'low';
      const result = { languages, topics, stars: totalStars, activity, ts: Date.now() };

      safeCacheSet(cacheKey, result);
      return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }


  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
        { headers: ghHeaders }
      );
      if (isRateLimited(res)) {
        const stale = getStale(cacheKey);
        if (stale) return staleResponse({ ...stale, total: stale.total, items: stale.items }, headers);
        return new Response(
          JSON.stringify({ total: 0, items: [], rateLimit: true, error: 'GitHub API rate limit reached. Please try again later.' }),
          { status: 200, headers }
        );
      }
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
      safeCacheSet(cacheKey, { total, items, ts: Date.now() });
      safeCacheSet(repo + '__gfi', { gfi: total, ts: Date.now() });
      return new Response(JSON.stringify({ total, items }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ total: 0, items: [], error: err.message }), { status: 200, headers });
    }
  }

  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ gfi: cached.gfi }), { status: 200, headers });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        { headers: ghHeaders }
      );
      if (isRateLimited(res)) {
        const stale = getStale(cacheKey);
        if (stale) return staleResponse({ gfi: stale.gfi, ts: stale.ts }, headers);
        return new Response(
          JSON.stringify({ gfi: null, rateLimit: true, error: 'GitHub API rate limit reached. Please try again later.' }),
          { status: 200, headers }
        );
      }
      if (!res.ok) {
        return new Response(JSON.stringify({ gfi: null, error: `GitHub ${res.status}` }), { status: 200, headers });
      }
      const data = await res.json();
      const gfi = data.total_count ?? null;
      if (gfi !== null) safeCacheSet(cacheKey, { gfi, ts: Date.now() });
      return new Response(JSON.stringify({ gfi }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ gfi: null, error: err.message }), { status: 200, headers });
    }
  }

  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
  }

  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetchWithFallback(`https://api.github.com/repos/${repo}`, { headers: ghHeaders }),
      fetchWithFallback(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: ghHeaders }),
    ]);

    if (isRateLimited(repoRes)) {
      const stale = getStale(repo);
      if (stale) return staleResponse(stale, headers);
      return new Response(
        JSON.stringify({ error: 'GitHub API rate limit reached. Cached data unavailable.' }),
        { status: 429, headers }
      );
    }

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.message || 'Repo not found' }), { status: repoRes.status, headers });
    }

    const repoData = await repoRes.json();
    let lastCommit = '—';
    let activityDays = 9999;

    if (commitsRes.ok) {
      try {
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
      } catch {

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
      gfi: null,
      ts: Date.now(),
    };

    safeCacheSet(repo, result);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + err.message }), { status: 500, headers });
  }
}