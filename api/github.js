// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };
const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 1000;

const VALID_TOKEN_PREFIXES = ['ghp_', 'gho_', 'ghs_', 'ghr_', 'github_pat_'];

export function isTokenValid(token) {
  return typeof token === 'string' &&
    token.length > 0 &&
    VALID_TOKEN_PREFIXES.some(prefix => token.startsWith(prefix));
}

function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

export function buildGitHubHeaders(token) {
  const resolvedToken = arguments.length === 0 ? process.env.GITHUB_TOKEN : token;

  if (resolvedToken && !isTokenValid(resolvedToken)) {
    console.warn(
      '[api/github] GITHUB_TOKEN present but invalid format - using unauthenticated fallback'
    );
  }

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gsoc-org-finder',
  };

  if (isTokenValid(resolvedToken)) {
    headers['Authorization'] = `token ${resolvedToken}`;
  }

  return headers;
}

function buildFetchOptions(init, headers) {
  const { timeoutMs, ...fetchInit } = init;
  if (timeoutMs) {
    fetchInit.signal = AbortSignal.timeout(timeoutMs);
  }
  return { ...fetchInit, headers };
}

export async function fetchWithFallback(url, headers, init = {}, fetchImpl = fetch) {
  let response = await fetchImpl(url, buildFetchOptions(init, headers));

  if (response.status === 401 && headers['Authorization']) {
    console.warn(
      '[api/github] Token returned 401 - retrying as unauthenticated request'
    );
    const unauthHeaders = { ...headers };
    delete unauthHeaders['Authorization'];
    response = await fetchImpl(url, buildFetchOptions(init, unauthHeaders));
  }

  return response;
}

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    ...extra,
  };
}

function errorResponse(status, message) {
  return new Response(
    JSON.stringify({ error: true, status, message }),
    { status, headers: corsHeaders() }
  );
}

function partialErrorPayload(status, message, extra = {}) {
  return { ...extra, error: true, status, message };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const user = searchParams.get('user');
  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';

  if (!repo && !user) {
    return errorResponse(400, 'Missing repo or user parameter');
  }

  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return errorResponse(400, 'Invalid repo');
  }

  if (user && !/^[\w.-]+$/.test(user)) {
    return errorResponse(400, 'Invalid user');
  }

  const ghHeaders = buildGitHubHeaders();

  // MODE: ?user=username → return user profile analysis for AI recommender
  if (user) {
    const cacheKey = 'user__' + user;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers: corsHeaders() });
    }

    try {
      let page = 1;
      let repos = [];
      while (page <= 3) {
        try {
          const res = await fetchWithFallback(
            `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`,
            ghHeaders,
            { timeoutMs: 5000 }
          );
          if (!res.ok) {
            if (page === 1) {
              const status = res.status;
              let message;
              if (status === 401) {
                message = 'GitHub token is misconfigured and unauthenticated fallback also failed.';
              } else if (status === 403) {
                const resetHeader = res.headers.get('x-ratelimit-reset');
                const resetTime = resetHeader
                  ? new Date(parseInt(resetHeader, 10) * 1000).toUTCString()
                  : 'unknown';
                message = `GitHub rate limit exceeded. Resets at: ${resetTime}.`;
              } else if (status === 404) {
                message = 'GitHub user not found. Check the username for typos.';
              } else {
                message = `GitHub API returned HTTP ${status}.`;
              }
              return errorResponse(status, message);
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
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders() });

    } catch (err) {
      return errorResponse(500, err.message);
    }
  }

  // MODE: ?gfi=1&issues=1 → return actual issue items
  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ total: cached.total, items: cached.items, cached: true }), { status: 200, headers: corsHeaders() });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
        ghHeaders
      );
      if (!res.ok) {
        return new Response(
          JSON.stringify(partialErrorPayload(
            res.status,
            `GitHub API returned HTTP ${res.status}.`,
            { total: 0, items: [] }
          )),
          { status: 200, headers: corsHeaders() }
        );
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
      return new Response(JSON.stringify({ total, items }), { status: 200, headers: corsHeaders() });
    } catch (err) {
      return new Response(
        JSON.stringify(partialErrorPayload(
          500,
          err.message,
          { total: 0, items: [] }
        )),
        { status: 200, headers: corsHeaders() }
      );
    }
  }

  // MODE: ?gfi=1 → return count only
  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ gfi: cached.gfi }), { status: 200, headers: corsHeaders() });
    }
    try {
      const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
      const res = await fetchWithFallback(
        `https://api.github.com/search/issues?q=${q}&per_page=1`,
        ghHeaders
      );
      if (!res.ok) {
        return new Response(
          JSON.stringify(partialErrorPayload(
            res.status,
            `GitHub API returned HTTP ${res.status}.`,
            { gfi: null }
          )),
          { status: 200, headers: corsHeaders() }
        );
      }
      const data = await res.json();
      const gfi = data.total_count ?? null;
      if (gfi !== null) safeCacheSet(cacheKey, { gfi, ts: Date.now() });
      return new Response(JSON.stringify({ gfi }), { status: 200, headers: corsHeaders() });
    } catch (err) {
      return new Response(
        JSON.stringify(partialErrorPayload(
          500,
          err.message,
          { gfi: null }
        )),
        { status: 200, headers: corsHeaders() }
      );
    }
  }

  // MODE: standard stats — NO GFI fetch here (avoids search API rate limits)
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(JSON.stringify({ ...cached, cached: true }), { status: 200, headers: corsHeaders() });
  }

  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetchWithFallback(`https://api.github.com/repos/${repo}`, ghHeaders),
      fetchWithFallback(`https://api.github.com/repos/${repo}/commits?per_page=1`, ghHeaders),
    ]);

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return errorResponse(repoRes.status, err.message || 'Repo not found');
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
    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders() });

  } catch (err) {
    return errorResponse(500, 'Fetch failed: ' + err.message);
  }
}
