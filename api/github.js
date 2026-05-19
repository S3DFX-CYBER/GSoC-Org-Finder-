// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };
const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 1000;

/**
 * Safely adds an item to the cache, evicting the oldest item if the maximum size is reached.
 * @param {string} key - The cache key.
 * @param {any} value - The data to cache.
 */
function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

/**
 * Main Vercel Edge Function handler for GitHub API proxy requests.
 * Parses incoming requests and routes them to the appropriate GitHub API endpoints.
 * @param {Request} req - The incoming HTTP request.
 * @returns {Promise<Response>} The HTTP response containing GitHub data or an error.
 */
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

  if (token) {
    ghHeaders.Authorization = `token ${token}`;
  }

  // GitHub uses 403 for both rate-limiting and access/abuse blocks.
  // Inspect headers to return the correct status to callers.
  /**
   * Classifies a 403 Forbidden response from GitHub to determine if it is a rate limit or an access restriction.
   * @param {Response} res - The fetch Response object from GitHub.
   * @returns {{status: number, error: string}} An object containing the appropriate HTTP status code and error message.
   */
  const classify403 = (res) => {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const retryAfter = res.headers.get('Retry-After');
    const isRateLimit = remaining === '0' || retryAfter !== null;
    return isRateLimit
      ? { status: 429, error: 'GitHub API rate limit exceeded. Please try again later.' }
      : { status: 403, error: 'GitHub API access restricted for this resource.' };
  };

  /**
   * Helper function to fetch data from GitHub with a default timeout and 401 Unauthorized fallback.
   * If a 401 is received, it retries the request without the Authorization header for public access.
   * @param {string} url - The GitHub API URL to fetch.
   * @param {RequestInit} [options={}] - Optional fetch options.
   * @returns {Promise<Response>} The fetch Response object.
   */
  const fetchGitHub = async (url, options = {}) => {
    // Apply a default 10s timeout when the caller hasn't provided one
    const controller = options.signal ? null : new AbortController();
    const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
    const composedOptions = controller
      ? { ...options, signal: controller.signal }
      : options;

    try {
      let res = await fetch(url, composedOptions);
      if (res.status === 401 && composedOptions.headers?.Authorization) {
        const fallbackHeaders = { ...composedOptions.headers };
        delete fallbackHeaders.Authorization;
        res = await fetch(url, { ...composedOptions, headers: fallbackHeaders });
      }
      return res;
    } finally {
      if (timer) clearTimeout(timer);
    }
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
          const res = await fetchGitHub(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`, { 
            headers: ghHeaders,
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) {
            if (page === 1) {
              if (res.status === 404) return new Response(JSON.stringify({ error: 'GitHub user not found' }), { status: 404, headers });
              if (res.status === 403) { const { status, error } = classify403(res); return new Response(JSON.stringify({ error }), { status, headers }); }
              return new Response(JSON.stringify({ error: `GitHub ${res.status}` }), { status: 502, headers });
            }
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

  // MODE: ?gfi=1&issues=1 → return actual issue items
  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchGitHub(
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
      safeCacheSet(cacheKey, { total, items, ts: Date.now() });
      safeCacheSet(repo + '__gfi', { gfi: total, ts: Date.now() });
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
      const res = await fetchGitHub(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        { headers: ghHeaders }
      );
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

  // MODE: standard stats — NO GFI fetch here (avoids search API rate limits)
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers });
  }

  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetchGitHub(`https://api.github.com/repos/${repo}`, { headers: ghHeaders }),
      fetchGitHub(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: ghHeaders }),
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

    safeCacheSet(repo, result);
    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + err.message }), { status: 500, headers });
  }
}
